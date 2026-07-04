---
name: value
description: Configura, revisa e debuga injeção `@Value` Sankhya (`ValueType`, `Provider<T>` lazy/eager, `SANKHYA_PARAM`, `group`), declaração de parâmetro em `META-INF/parameter.xml` e feature flag togglável via `MGECoreParameter`. Use ao injetar, alterar, revisar ou auditar valores de configuração em componentes Guice, criar/editar parâmetro Sankhya (`parameter.xml`, key, cacheable), implementar feature flag, diagnosticar valor não injetado/null/desatualizado, ou ao tocar em código com `@Value`/`ValueType`/`SANKHYA_PARAM`/`MGECoreParameter`.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Injecao de Valores (`@Value`) — Addon Studio 2.0

`@Value` injeta valores de configuracao (env vars, system properties, parametros Sankhya) diretamente em campos de componentes gerenciados pelo Guice. Conversao de tipo automatica. Thread-safe.

> **Beta / Acesso Antecipado**: funcionalidade sujeita a mudancas.
>
> **Referencia complementar:** `dependency-injection`

---

## 1. Atributos

| Atributo       | Obrigatorio | Descricao                                                                 |
|:---------------|:------------|:--------------------------------------------------------------------------|
| `value`        | Nao*        | Nome da propriedade. Alternativa a `param`.                               |
| `param`        | Nao*        | Nome do parametro. Alternativa a `value`. **Tem precedencia sobre `value`**. |
| `group`        | Nao         | Grupo do parametro — exclusivo de `SANKHYA_PARAM`.                        |
| `type`         | Sim         | Fonte: `ENV_VAR`, `SYSTEM_PROPERTY`, `SANKHYA_PARAM` ou `UNDEFINED`.      |
| `defaultValue` | Sim         | Fallback quando a propriedade nao e encontrada. Nunca deixar vazio.        |

> * Ao menos um entre `value` ou `param` e obrigatorio.

---

## 2. Eager vs Lazy

| Modo   | Sintaxe                        | Resolucao               | Quando usar                              |
|:-------|:-------------------------------|:------------------------|:-----------------------------------------|
| Eager  | `private Integer porta`        | Na criacao do objeto    | Valor sempre necessario                  |
| Lazy   | `private Provider<Integer> porta` | Na primeira chamada `.get()`, **cacheado para sempre** | Valor opcional / custoso — config estavel |

```java
// Eager — resolvido na inicializacao
@Value(value = "server.port", type = ValueType.SYSTEM_PROPERTY, defaultValue = "8080")
private Integer serverPort;

// Lazy — resolvido so quando chamado, DEPOIS congela
@Value(param = "MAX_RETRIES", type = ValueType.SANKHYA_PARAM, defaultValue = "3")
private Provider<Integer> maxRetries;

public void executar() {
    int retries = maxRetries.get();  // resolve na primeira chamada; das seguintes vem do cache
    // ...
}
```

> **Lazy adia a resolucao, mas NAO reflete mudanca posterior.** O `ValueProvider` do SDK resolve uma unica vez no primeiro `.get()` e cacheia para sempre (double-checked locking). Como componentes vivem em singletons ou presos em grafos de vida longa (interceptor dentro de `OkHttpClient` reutilizado, client `@Provides @Singleton`), o valor so muda com **restart**. Para toggle em runtime, ver secao "Feature flag togglavel".

---

## 3. Fontes (`ValueType`)

### `ENV_VAR` — variavel de ambiente

```java
@Value(value = "API_KEY", type = ValueType.ENV_VAR, defaultValue = "")
private String apiKey;
```

### `SYSTEM_PROPERTY` — propriedade Java (`-Dchave=valor`)

```java
@Value(value = "server.port", type = ValueType.SYSTEM_PROPERTY, defaultValue = "8080")
private Integer serverPort;
```

### `SANKHYA_PARAM` — parametro do sistema Sankhya

```java
// Sem grupo
@Value(param = "MAX_CONNECTIONS", type = ValueType.SANKHYA_PARAM, defaultValue = "10")
private Provider<Integer> maxConnections;

// Com grupo
@Value(param = "TIMEOUT", group = "CONNECTION", type = ValueType.SANKHYA_PARAM, defaultValue = "30")
private Provider<Long> connectionTimeout;
```

### `UNDEFINED` — sempre usa o `defaultValue`

```java
@Value(value = "qualquer", type = ValueType.UNDEFINED, defaultValue = "valor-fixo")
private String valorFixo;
```

---

## 4. Tipos suportados

`String`, `Integer`/`int`, `Boolean`/`boolean`, `Long`/`long`, `Double`/`double`, `Float`/`float` — e `Provider<T>` de qualquer um deles. Conversao de `String` para o tipo declarado e automatica.

---

## 5. Exemplo completo

```java
import br.com.sankhya.studio.stereotypes.Value;
import br.com.sankhya.internal.sdk.injectors.ValueType;
import br.com.sankhya.studio.stereotypes.Component;
import com.google.inject.Inject;
import com.google.inject.Provider;

@Component
public class IntegracaoConfig {

    @Value(value = "API_BASE_URL", type = ValueType.ENV_VAR, defaultValue = "http://localhost:8080")
    private Provider<String> apiBaseUrl;

    @Value(value = "API_KEY", type = ValueType.ENV_VAR, defaultValue = "dev-key")
    private Provider<String> apiKey;

    // ATENCAO: congela no primeiro get() — para toggle sem restart, ver secao "Feature flag togglavel"
    @Value(param = "INTEGRACAO_ATIVA", type = ValueType.SANKHYA_PARAM, defaultValue = "false")
    private Provider<Boolean> integracaoAtiva;

    @Value(value = "http.timeout", type = ValueType.SYSTEM_PROPERTY, defaultValue = "30000")
    private Integer timeout;

    private final RetrofitCallExecutor executor;

    @Inject
    public IntegracaoConfig(RetrofitCallExecutor executor) {
        this.executor = executor;
    }

    public void enviar(Payload payload) {
        if (!integracaoAtiva.get()) return;
        executor.execute(apiBaseUrl.get(), apiKey.get(), payload, timeout);
    }
}
```

---

## 6. Feature flag togglavel (sem restart)

`@Value` (eager OU lazy) **nao serve** para flag que precisa mudar em runtime: eager resolve na criacao, lazy congela no primeiro `.get()`. Para toggle refletir sem restart, leia o parametro direto a cada uso via `MGECoreParameter` (mesma API que o `PropertyResolver` do SDK chama por baixo):

```java
import br.com.sankhya.modelcore.util.MGECoreParameter;

private boolean flagAtiva() {
    try {
        return MGECoreParameter.getParameterAsBoolean("PRXMODMINHAFLAG");
    } catch (Exception e) {
        return false; // default seguro — fora do contexto do ERP a chamada lanca
    }
}
```

**Pre-requisitos:**

- Parametro declarado com `cacheable="false"` no `parameter.xml` (ver secao 7) — senao o proprio ERP cacheia o valor.
- `try/catch` com default seguro e obrigatorio — fora do contexto do ERP (e em teste) a chamada lanca.

> `ValueProvider.clearCache()` existe e e publico, mas a classe e interna (`br.com.sankhya.internal.*`) — documentado apenas como solucao para **testes**, nao para producao.

---

## 7. Declarando o parametro (`META-INF/parameter.xml`)

`@Value(type = SANKHYA_PARAM)` e `MGECoreParameter` pressupoem parametro **existente**. Declare em `src/main/resources/META-INF/parameter.xml` — o deploy registra e o valor fica editavel nas Preferencias do ERP:

```xml
<parameter
    name="meuaddon.minha.flag"
    key="PRXMODMINHAFLAG"
    type="boolean"
    default="false"
    cacheable="false"
    required="false"
    module="B"
    description="Descricao exibida nas Preferencias"/>
```

Restricoes do XSD (`parameters.xsd`) que derrubam o build/deploy:

| Atributo | Restricao |
|:---------|:----------|
| `key` | 3–15 chars, `[a-zA-Z_]+` — **sem digitos** |
| `name` | `[a-zA-Z.]+` (pontuado, comeca com o modulo) |
| `description` | 3–50 chars |
| `type` | `integer` / `string` / `boolean` / `date` / `list` / `number` |
| `cacheable` | `false` para valor que muda em runtime (flags) |
| `module` | letra do modulo (ex.: `B` = Configuracao) |
| `list-content` | opcoes separadas por `\n` quando `type="list"` |

> `cacheable="false"` e pre-requisito do pattern de flag togglavel da secao 6.

---

## 8. Restricoes

- **Somente em classes gerenciadas pelo Guice** (`@Component`, `@Controller`, `@Repository`, etc.). Em classes criadas com `new`, o campo fica `null`.
- **Nao funciona em campos `final`**.
- `group` e exclusivo de `SANKHYA_PARAM` — ignorado nas outras fontes.

---

## 9. Anti-Patterns (PROIBIDO)

| Anti-Pattern                                       | Correcao                                          |
|:---------------------------------------------------|:--------------------------------------------------|
| Classe nao gerenciada com `@Value`                 | Anotar classe com `@Component` ou equivalente     |
| Campo `final` anotado com `@Value`                 | Remover `final`                                   |
| `defaultValue = ""` em valor critico               | Fornecer fallback significativo                   |
| `value` e `param` juntos (ambiguidade)             | Usar so `param` — tem precedencia de qualquer forma|
| `group` em `ENV_VAR` ou `SYSTEM_PROPERTY`          | `group` so funciona com `SANKHYA_PARAM`           |
| Eager em valor opcional/custoso                    | Usar `Provider<T>` (Lazy)                         |
| `Provider<T>` como feature flag togglavel          | Congela no primeiro `.get()` — ler `MGECoreParameter` a cada uso + `cacheable="false"` (secao 6) |
| `SANKHYA_PARAM` sem declarar no `parameter.xml`    | Declarar em `META-INF/parameter.xml` (secao 7)    |

---

## 10. Checklist: Novo `@Value`

1. [ ] Classe anotada com estereotipo Guice (`@Component`, `@Controller`, etc.).
2. [ ] Escolher fonte correta: `ENV_VAR`, `SYSTEM_PROPERTY` ou `SANKHYA_PARAM`.
3. [ ] Usar `param` para `SANKHYA_PARAM` (com `group` se necessario); `value` para as demais.
4. [ ] `SANKHYA_PARAM`: parametro declarado no `META-INF/parameter.xml` (secao 7).
5. [ ] Definir `defaultValue` com valor significativo — nunca string vazia em config critica.
6. [ ] Decidir Eager vs Lazy: `Provider<T>` se o valor for opcional/custoso — lembrando que congela apos o primeiro `.get()`.
7. [ ] Flag que precisa mudar sem restart? **Nao** usar `@Value` — pattern da secao 6.
8. [ ] Campo nao e `final`.


## Related Skills

- `dependency-injection` — @Value injeta em @Component gerenciados pelo Guice

## Skills relacionadas

- `dependency-injection` — wiring Guice que injeta os `@Value`
- `addon-studio` — regras universais do projeto
