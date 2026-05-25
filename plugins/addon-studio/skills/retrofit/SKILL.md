---
name: retrofit
description: Configura, revisa e debuga integração HTTP externa em Sankhya Addon Studio usando Retrofit + Moshi + OkHttp — declara dependências `moduleLib` no `build.gradle`, escreve interface client (`@GET`/`@POST`/`@Body`/`@Path`/`@Query`/`@Headers`), faz wiring Guice via `@Provides @Singleton` em `@CustomModule`, cria interceptors OkHttp (autenticação, logging, headers). Use ao integrar API REST/JSON externa, consumir endpoint de terceiro, adicionar lib Retrofit/Moshi/OkHttp, montar HTTP client, criar interceptor, ou diagnosticar `NoClassDefFoundError` runtime de classe Retrofit/OkHttp.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Integração HTTP com Retrofit — Addon Studio 2.0

Stack oficial para integração HTTP externa: **Retrofit + Moshi + OkHttp**. Substitui `HttpClient` nativo, `URLConnection`, Apache HTTP Client.

Esta skill cobre: declaração de deps no Gradle, interface client, wiring Guice, interceptors. Decisões arquiteturais (factory wrapper vs builder direto, retry, URL dinâmica) são do projeto — a skill mostra patterns válidos sem opinar.

---

## 1. Dependências (`build.gradle` do módulo)

> **NÃO** declarar no `build.gradle` raiz. Vai no `build.gradle` do **módulo** (`model/build.gradle`, etc.).

Use **somente `moduleLib`** — a configuração custom do plugin `br.com.sankhya.addonstudio` já adiciona o JAR ao classpath de compilação **e** empacota no EJB final. Não duplicar com `implementation`.

```groovy
dependencies {
    // Retrofit + Moshi (JSON) — padrão para APIs REST.
    moduleLib 'com.squareup.retrofit2:retrofit:2.12.0'
    moduleLib 'com.squareup.retrofit2:converter-moshi:2.12.0'
    moduleLib 'com.squareup.moshi:moshi:1.15.2'

    // OkHttp — cliente HTTP subjacente (obrigatório).
    moduleLib 'com.squareup.okhttp3:okhttp:3.14.9'
}
```

### Conversores opcionais

| Conversor | Quando usar | Dependência |
|:----------|:------------|:------------|
| `converter-moshi` | JSON (padrão) | `com.squareup.retrofit2:converter-moshi:2.12.0` |
| `converter-scalars` | Body `String` cru (SOAP/XML/texto) | `com.squareup.retrofit2:converter-scalars:2.12.0` |
| `converter-jaxb` | XML via JAXB | usar fábrica externa (`JaxbConverterFactory` de pacote terceiro) |

> Para testes com `MockWebServer`, adicionar em `testImplementation`:
> ```groovy
> testImplementation 'com.squareup.okhttp3:mockwebserver:3.14.9'
> ```

---

## 2. Interface do client

Declare a API como **interface** anotada com Retrofit. **Sempre retorno `Call<T>`** (síncrono — executor trata `.execute()`).

```java
package br.com.sankhya.devcenter.meuaddon.infrastructure.integration.parceiro;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.Headers;
import retrofit2.http.POST;
import retrofit2.http.Path;
import retrofit2.http.Query;

public interface ParceiroApi {

    @GET("v1/produtos/{id}")
    Call<ProdutoDto> buscarProduto(@Path("id") Long id);

    @GET("v1/produtos")
    Call<ListaProdutosDto> listarProdutos(@Query("limit") Integer limit,
                                          @Query("offset") Integer offset);

    @POST("v1/pedidos")
    @Headers("Content-Type: application/json")
    Call<PedidoCriadoDto> criarPedido(@Body NovoPedidoDto pedido);
}
```

### Anotações principais

| Anotação | Uso |
|:---------|:----|
| `@GET`/`@POST`/`@PUT`/`@DELETE`/`@PATCH` | Verbo HTTP + path relativo (`v1/recurso/{id}`) |
| `@Path("id")` | Substitui `{id}` no path |
| `@Query("k")` | Adiciona `?k=v` na query string |
| `@QueryMap` | Map<String, String> dinâmico de query params |
| `@Body` | Corpo JSON serializado pelo conversor (Moshi) |
| `@Headers("K: V")` | Header estático no método |
| `@Header("K")` | Header dinâmico (parâmetro) |
| `@FormUrlEncoded` + `@Field` | `application/x-www-form-urlencoded` |
| `@Multipart` + `@Part` | Upload `multipart/form-data` |

### DTOs (Moshi)

DTOs são POJOs Java 8 com Lombok. Moshi serializa via getters/setters — nomes de campo precisam bater com JSON (use `@Json(name = "...")` se diferente).

```java
import com.squareup.moshi.Json;
import lombok.Data;

@Data
public class ProdutoDto {
    private Long id;
    private String nome;

    @Json(name = "preco_unitario")
    private Double precoUnitario;
}
```

---

## 3. Wiring Guice — duas opções

Escolha conforme o projeto. **Skill não opina** — ambas são válidas.

### Opção A — `Retrofit.Builder` direto no `@Provides`

Indicado quando addon tem **uma única integração HTTP** ou cada cliente tem config muito diferente. Sem boilerplate adicional.

```java
import br.com.sankhya.studio.stereotypes.CustomModule;
import com.google.inject.AbstractModule;
import com.google.inject.Provides;
import com.google.inject.Singleton;
import okhttp3.OkHttpClient;
import retrofit2.Retrofit;
import retrofit2.converter.moshi.MoshiConverterFactory;

import java.util.concurrent.TimeUnit;

@CustomModule
public class ParceiroIntegrationModule extends AbstractModule {

    private static final String BASE_URL = "https://api.parceiro.com.br/";

    @Override
    protected void configure() { }

    @Provides
    @Singleton
    public ParceiroApi provideParceiroApi(ParceiroAuthInterceptor authInterceptor) {
        OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .addInterceptor(authInterceptor)
            .build();

        return new Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(httpClient)
            .addConverterFactory(MoshiConverterFactory.create())
            .build()
            .create(ParceiroApi.class);
    }
}
```

### Opção B — Factory wrapper reutilizável

Indicado quando addon tem **múltiplas integrações HTTP** — encapsula timeouts/converter padrão em um lugar só, deixa `@Provides` enxuto. Trocar a lib base no futuro vira mudança em arquivo único.

**Boilerplate:**

```java
package br.com.sankhya.devcenter.meuaddon.infrastructure.integration.shared;

import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import retrofit2.Converter;
import retrofit2.Retrofit;
import retrofit2.converter.moshi.MoshiConverterFactory;

import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Factory centralizada de clientes Retrofit. Injetável via Guice
 * (classe concreta sem deps — auto-resolvida).
 */
public class RetrofitClientFactory {

    /** JSON (Moshi) — padrão REST. */
    public <T> T create(Class<T> service, List<Interceptor> interceptors, String baseUrl) {
        return create(service, interceptors, baseUrl, MoshiConverterFactory.create());
    }

    /** Conversor customizado (XML, scalars, etc.). */
    public <T> T create(Class<T> service, List<Interceptor> interceptors, String baseUrl,
                        Converter.Factory converterFactory) {
        OkHttpClient.Builder clientBuilder = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS);

        for (Interceptor interceptor : interceptors) {
            clientBuilder.addInterceptor(interceptor);
        }

        return new Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(clientBuilder.build())
            .addConverterFactory(converterFactory)
            .build()
            .create(service);
    }
}
```

**Uso no módulo:**

```java
@CustomModule
public class ParceiroIntegrationModule extends AbstractModule {

    private static final String BASE_URL = "https://api.parceiro.com.br/";

    @Override
    protected void configure() { }

    @Provides
    @Singleton
    public ParceiroApi provideParceiroApi(RetrofitClientFactory factory,
                                          ParceiroAuthInterceptor authInterceptor) {
        return factory.create(
            ParceiroApi.class,
            Collections.singletonList(authInterceptor),
            BASE_URL
        );
    }
}
```

### Regras universais (qualquer opção)

- `@CustomModule` + `extends AbstractModule` — sem essa dupla, Guice ignora o módulo.
- `@Provides @Singleton` — cliente Retrofit é stateless, reutilizar instância evita reconstruir OkHttp pool a cada chamada.
- Interceptors recebidos por parâmetro do método `@Provides` — Guice resolve automático.
- Ver skill `dependency-injection` para detalhes de `@CustomModule`, `@Provides`, `Multibinder`.

---

## 4. Interceptors OkHttp

Interceptors são **pipeline** que processa cada request/response. Use para autenticação, logging, headers globais, retry, métricas.

### Estrutura básica

```java
import br.com.sankhya.studio.stereotypes.Component;
import com.google.inject.Singleton;
import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;

import java.io.IOException;

@Component
@Singleton
public class ParceiroAuthInterceptor implements Interceptor {

    private final TokenProvider tokenProvider;

    @com.google.inject.Inject
    public ParceiroAuthInterceptor(TokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @Override
    public Response intercept(Chain chain) throws IOException {
        Request original = chain.request();
        Request authenticated = original.newBuilder()
            .header("Authorization", "Bearer " + tokenProvider.getToken())
            .build();
        return chain.proceed(authenticated);
    }
}
```

**Regras:**
- `@Component @Singleton` — uma instância para todas as chamadas.
- Implementa `okhttp3.Interceptor`.
- `chain.proceed(request)` é **obrigatório** — sem ele a request não vai pra rede.
- `@Inject` via construtor para resolver dependências (token provider, config, etc.).

### Dependência circular (interceptor → client → interceptor)

Comum quando o interceptor precisa de um client que precisa do próprio interceptor (refresh token, por exemplo). Use `Provider<T>`:

```java
@Singleton
public class ParceiroAuthInterceptor implements Interceptor {

    private final Provider<ParceiroAuthClient> authClientProvider;

    @Inject
    public ParceiroAuthInterceptor(Provider<ParceiroAuthClient> authClientProvider) {
        this.authClientProvider = authClientProvider;
    }

    @Override
    public Response intercept(Chain chain) throws IOException {
        ParceiroAuthClient client = authClientProvider.get(); // resolve lazy
        // ...
    }
}
```

Ver skill `dependency-injection` (seção `Provider<T>`).

### Múltiplos interceptors

Ordem importa. Passe lista na ordem desejada:

```java
factory.create(
    ParceiroApi.class,
    Arrays.asList(loggingInterceptor, authInterceptor, headerInterceptor),
    BASE_URL
);
```

Pipeline OkHttp: cada interceptor envolve o próximo (request desce, response sobe).

---

## 5. Executando chamadas

O retorno `Call<T>` é **preguiçoso** — só executa quando você chama `.execute()` (sync) ou `.enqueue()` (async).

### Execução simples (sync)

```java
import retrofit2.Call;
import retrofit2.Response;

@Component
public class ParceiroGateway {

    private final ParceiroApi api;

    @Inject
    public ParceiroGateway(ParceiroApi api) {
        this.api = api;
    }

    public ProdutoDto buscar(Long id) {
        try {
            Response<ProdutoDto> response = api.buscarProduto(id).execute();
            if (!response.isSuccessful()) {
                throw new IntegrationApiException(
                    "Erro " + response.code() + ": " + (response.errorBody() != null ? response.errorBody().string() : "")
                );
            }
            ProdutoDto body = response.body();
            if (body == null) {
                throw new IntegrationApiException("Resposta com corpo nulo");
            }
            return body;
        } catch (IOException e) {
            throw new IntegrationNetworkException("Falha de rede", e);
        }
    }
}
```

> Boilerplate de tratamento (status, body nulo, IOException) repete em toda chamada. Projetos costumam extrair um `RetrofitCallExecutor` — ver bloco "Patterns avançados" abaixo.

---

## 6. Configuração de base URL

Três abordagens válidas. Skill não opina.

| Abordagem | Quando usar |
|:----------|:------------|
| Constante `static final` no módulo | URL fixa, mudou só com release |
| `@Value("integration.parceiro.url")` injetado no `@Provides` | URL varia por ambiente (dev/homol/prod) — ver skill `value` |
| Tabela de configuração no banco | URL gerenciada pelo cliente final em runtime — usar factory pattern (avançado) |

---

## 7. Patterns avançados — menção curta

Estes patterns são comuns mas opcionais. Skill não detalha — implemente conforme a necessidade do projeto.

- **URL dinâmica (config no banco):** crie interface funcional `ParceiroApiFactory { ParceiroApi create(String urlBase); }` e binde via `@Provides` retornando lambda. Útil quando gateway lê URL de `ConfiguracaoPlataforma`.
- **Retry com backoff:** envolva `call.execute()` em um `RetryExecutor` próprio — distinga exceções de rede (retry) das de API (não retry). Considere `okhttp3.ConnectionPool` e timeouts antes de retry.
- **Logging:** `okhttp3.logging.HttpLoggingInterceptor` (dep adicional `moduleLib 'com.squareup.okhttp3:logging-interceptor:3.14.9'`). Configurar nível `BODY` só em dev.
- **SOAP/XML:** use `converter-scalars` + interceptor que envelopa request em `<soap:Envelope>` e extrai `<soap:Body>` da response. DTOs ficam só com conteúdo funcional. Anote método Retrofit com `@Headers("SOAPAction: ...")`.
- **Executor compartilhado:** `RetrofitCallExecutor` (`@Component @Singleton`) que recebe `Call<T>` e devolve `T`, centralizando tratamento de status/body/IOException. Reduz boilerplate em gateways.

---

## 8. Erros Comuns

| Erro | Causa | Correção |
|:-----|:------|:---------|
| `NoClassDefFoundError: retrofit2/Retrofit` em runtime | Declarado só como `implementation`, sem `moduleLib` | Trocar para `moduleLib` (ou ambos em versões antigas do plugin Gradle) |
| `IllegalArgumentException: Illegal URL` no `Retrofit.Builder` | Base URL sem barra final | Adicionar `/` no fim: `"https://api.x.com/"` |
| `EOFException` em response com `204 No Content` | Tentou desserializar corpo vazio | Use `Call<Void>` ou cheque `response.body() == null` |
| `MalformedJsonException` ao deserializar | DTO não bate com JSON | Adicionar `@Json(name = "...")` em campos com nome diferente |
| `@Inject` de `javax.inject` no interceptor | Pacote errado | `com.google.inject.Inject` (ver skill `addon-studio`) |
| Token expirou mid-request | Auth interceptor sem refresh | Implementar `okhttp3.Authenticator` separado para 401, ou refresh proativo |
| Timeouts disparam sob carga | Defaults OkHttp são baixos | Configurar `connectTimeout`/`readTimeout`/`writeTimeout` no `OkHttpClient.Builder` |
| `Method not annotated with HTTP method type` | Falta `@GET`/`@POST`/etc. | Adicionar verbo HTTP no método da interface |

---

## 9. Checklist

### Nova integração HTTP

1. [ ] Adicionar deps `moduleLib` (retrofit + converter-moshi + moshi + okhttp) no `build.gradle` do módulo.
2. [ ] Criar interface `XxxApi` com anotações Retrofit. Retorno `Call<T>`.
3. [ ] Criar DTOs Java 8 com Lombok (`@Data`) — usar `@Json(name=...)` quando JSON não casar.
4. [ ] Criar `@CustomModule` com `@Provides @Singleton` retornando o cliente.
5. [ ] Se múltiplas APIs no addon, considerar `RetrofitClientFactory` (opção B).
6. [ ] Criar interceptors necessários (auth, logging) como `@Component @Singleton`.
7. [ ] Gateway/adapter (`@Component`) injeta o client e expõe métodos de domínio.
8. [ ] Tratar response status, body nulo, `IOException` — extrair executor compartilhado se boilerplate repetir.

---

## Related Skills

- `dependency-injection` — `@CustomModule`, `@Provides`, `@Singleton`, `Provider<T>`, `Multibinder`
- `value` — injetar base URL e timeouts via `@Value`
- `addon-studio` — regras universais (Java 8, `@Inject` de `com.google.inject`)
- `test` — testar gateway com `MockWebServer` (OkHttp)
- `controller-advice` — mapear `IntegrationApiException`/`IntegrationNetworkException` para HTTP errors do addon

## Skills relacionadas

- `build` — comandos Gradle (`gradle deployAddon`)
- `encoding` — garantir ISO-8859-1 após criar arquivos `.java`
