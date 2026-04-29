---
applyTo: "**/*.java"
---

# Injeção de Dependência (Guice) ? Addon Studio 2.0

Addon Studio 2.0 usa **Google Guice** como container DI. Anotações estereótipo customizadas fazem auto-scan. Doc descreve regras, padrões, boas práticas DI.

---

## 1. Regra de Ouro

**Sempre injeção via construtor** com `@Inject` de `com.google.inject.Inject`.

```java
import com.google.inject.Inject;

@Component
public class MeuService {

    private final MeuRepository repository;
    private final MeuGateway gateway;

    @Inject
    public MeuService(MeuRepository repository, MeuGateway gateway) {
        this.repository = repository;
        this.gateway = gateway;
    }
}
```

> **NUNCA** `@Inject` de `javax.inject`. Sempre `com.google.inject.Inject`.

---

## 2. Estereótipos (Anotações de Auto-Scanning)

Framework scaneia e registra classes com:

| Anotação | Pacote | Gerenciamento | Uso |
|:---------|:-------|:--------------|:----|
| `@Controller` | `br.com.sankhya.studio.annotations` | **Automático** ? NÃO adicionar `@Component` | Entrypoints REST (equivale ao `@Service` EJB) |
| `@Repository` | `br.com.sankhya.studio.stereotypes` | **Automático** ? NÃO adicionar `@Component` | Interfaces de acesso a dados (`JapeRepository`) |
| `@Component` | `br.com.sankhya.studio.stereotypes` | **Automático** | Classes gerais: Services, Services, Adapters, Gateways, Mappers auxiliares |
| `@ControllerAdvice` | `br.com.sankhya.studio.web` | **Automático** | Tratamento global de exceções |
| `@CustomModule` | `br.com.sankhya.studio.stereotypes` | **Automático** | Módulos Guice customizados (equivale a `AbstractModule`) |

### Quando usar cada estereótipo

```
@Controller      ? Entrypoints REST (serviceName obrigatório com sufixo "SP")
@Repository      ? Interfaces JapeRepository (NÃO crie implementação manual)
@Component       ? Todo o resto que precisa ser injetado
@CustomModule    ? Módulos de configuração Guice (bindings manuais)
@ControllerAdvice ? Handler global de exceções
```

---

## 3. Classes por Estereótipo

### 3.1 `@Controller` ? Entrypoints REST

```java
import br.com.sankhya.studio.annotations.Controller;
import br.com.sankhya.studio.annotations.enums.EJBTransactionType;
import br.com.sankhya.studio.persistence.Transactional;
import com.google.inject.Inject;

@Controller(
    serviceName = "MeuControllerSP",
    transactionType = EJBTransactionType.Supports
)
public class MeuController {

    private final MeuService meuService;

    @Inject
    public MeuController(MeuService meuService) {
        this.meuService = meuService;
    }

    @Transactional
    public ResponseEntity<MeuDTO> executar(MeuRequest request) {
        // ...
    }
}
```

**Regras:**
- `serviceName` obrigatório, sufixo `"SP"`.
- `transactionType` define tipo transação EJB (`Supports`, `Required`, etc.).
- Métodos que alteram dados precisam `@Transactional`.
- **NÃO** adicionar `@Component` ? `@Controller` já gerenciado pelo framework.

### 3.2 `@Repository` ? Interfaces de Acesso a Dados

```java
import br.com.sankhya.sdk.data.repository.JapeRepository;
import br.com.sankhya.studio.stereotypes.Repository;

@Repository
public interface MeuProdutoRepository extends JapeRepository<Integer, MeuProduto> {
    // métodos declarativos ? o framework gera a implementação
}
```

**Regras:**
- Sempre **interface** (nunca classe concreta).
- Estende `JapeRepository<PKType, EntityType>`.
- **NÃO** adicionar `@Component` ? framework gera implementação e registra no Guice.
- Injetável direto em qualquer `@Component` ou `@Controller`.

### 3.3 `@Component` ? Classes Gerais

Pra qualquer classe injetável que não encaixa em `@Controller` ou `@Repository`.

**Exemplos `@Component`:**

| Tipo | Exemplo |
|:-----|:--------|
| Servico de aplicacao | `ImportarProdutoService` |
| Servico de negocio  | `PedidoCreateService` |
| Servico de infraestrutura | `IntegrationConfigurationService` |
| Gateway/Adapter | `DynamicProdutoGateway` |
| Mapper auxiliar (usado por MapStruct `uses={}`) | `StringMappingNormalizer` |
| Provider/Resolver | `IntegrationPlatformProvider` |

```java
import br.com.sankhya.studio.stereotypes.Component;
import com.google.inject.Inject;

@Component
public class ImportarProdutoService {

    private final ProdutoRepository repository;
    private final DynamicProdutoGateway gateway;

    @Inject
    public ImportarProdutoService(ProdutoRepository repository,
                                  DynamicProdutoGateway gateway) {
        this.repository = repository;
        this.gateway = gateway;
    }

    public List<MeuProduto> execute() { ... }
}
```

### 3.4 `@ControllerAdvice` ? Tratamento Global de Exceções

```java
import br.com.sankhya.studio.web.ControllerAdvice;
import br.com.sankhya.studio.web.ExceptionHandler;

@Log
@ControllerAdvice
public class RestExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<String> handleNotFound(EntityNotFoundException e) {
        log.log(Level.INFO, "Entidade nao encontrada: {0}", e.getMessage());
        return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleBadRequest(IllegalArgumentException e) {
        return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
    }
}
```

**Regras:**
- Um por projeto (centraliza tratamento exceções).
- Cada método trata exceção específica com `@ExceptionHandler`.
- Dispensa `@Component`.

---

## 4. Módulos Customizados (`@CustomModule`)

Quando auto-scan insuficiente (bindings manuais, `Multibinder`, `@Provides`), crie módulo Guice com `@CustomModule`.

### 4.1 Multibinder ? Strategy Pattern

Registra múltiplas implementações de interface pra resolução dinâmica runtime.

```java
import br.com.sankhya.studio.stereotypes.CustomModule;
import com.google.inject.AbstractModule;
import com.google.inject.multibindings.Multibinder;

@CustomModule
public class IntegrationPlatformConfig extends AbstractModule {

    @Override
    protected void configure() {
        Multibinder<IntegrationPlatformAdapter> binder =
            Multibinder.newSetBinder(binder(), IntegrationPlatformAdapter.class);

        binder.addBinding().to(WebReceitaAdapter.class);
        // binder.addBinding().to(OutraPlataformaAdapter.class);
    }
}
```

`Set<IntegrationPlatformAdapter>` injetável:

```java
@Singleton
public class IntegrationPlatformResolver {

    private final Map<TipoPlataforma, IntegrationPlatformAdapter> adapters;

    @Inject
    public IntegrationPlatformResolver(Set<IntegrationPlatformAdapter> adapters) {
        this.adapters = adapters.stream()
            .collect(Collectors.toMap(IntegrationPlatformAdapter::getTipo, Function.identity()));
    }

    public IntegrationPlatformAdapter resolve(TipoPlataforma tipo) {
        IntegrationPlatformAdapter adapter = adapters.get(tipo);
        if (adapter == null) {
            throw new IllegalArgumentException("Nenhuma integracao implementada para: " + tipo);
        }
        return adapter;
    }
}
```

### 4.2 `@Provides` ? Factory Methods

Pra criar instâncias com configuração especial (ex: clientes HTTP).

```java
import br.com.sankhya.studio.stereotypes.CustomModule;
import com.google.inject.AbstractModule;
import com.google.inject.Provides;
import com.google.inject.Singleton;

@CustomModule
public class MeuClientConfig extends AbstractModule {

    @Provides
    @Singleton
    public MeuApiClient provideMeuApiClient(RetrofitClientFactory factory) {
        return factory.create(
            MeuApiClient.class,
            Collections.emptyList(),
            "https://api.exemplo.com/"
        );
    }

    @Provides
    @Singleton
    public MeuApiAuthClient provideMeuAuthClient(RetrofitClientFactory factory,
                                                  MeuAuthInterceptor authInterceptor) {
        return factory.create(
            MeuApiAuthClient.class,
            Collections.singletonList(authInterceptor),
            "https://api.exemplo.com/"
        );
    }
}
```

**Regras:**
- `@Provides` marca método como factory.
- `@Singleton` garante instância única.
- Parâmetros resolvidos automaticamente pelo Guice.
- Classe **deve** estender `AbstractModule` e ter `@CustomModule`.

---

## 5. Escopo: `@Singleton`

Guice padrão cria **nova instância** a cada injeção. Use `@Singleton` pra instância única.

```java
import com.google.inject.Singleton;

@Component
@Singleton
public class RetrofitCallExecutor {
    // Uma única instância reutilizada em toda a aplicação
}
```

### Quando usar `@Singleton`

| Usar `@Singleton` | Não usar (padrão) |
|:-------------------|:-------------------|
| Clientes HTTP, executors, factories | Services, Services de domínio |
| Resolvers e registries | Gateways e Adapters |
| Interceptors (OkHttp, Auth) | Controllers |
| Caches e pools | Mappers auxiliares |

> `@Singleton` **sem** `@Component` não auto-scaneada. Precisa estar em `@CustomModule` ou ser injetada por classe que Guice conhece.

---

## 6. `Provider<T>` ? Injeção Lazy / Circular

Em dependência circular ou resolução lazy, injete `Provider<T>` em vez de `T`.

```java
import com.google.inject.Inject;
import com.google.inject.Provider;
import com.google.inject.Singleton;

@Singleton
public class MeuAuthInterceptor implements Interceptor {

    private final Provider<MeuAuthClient> authClientProvider;
    private final Provider<IntegrationConfigurationService> configProvider;

    @Inject
    public MeuAuthInterceptor(Provider<MeuAuthClient> authClientProvider,
                               Provider<IntegrationConfigurationService> configProvider) {
        this.authClientProvider = authClientProvider;
        this.configProvider = configProvider;
    }

    @Override
    public Response intercept(Chain chain) throws IOException {
        // .get() resolve a dependência no momento da chamada (lazy)
        MeuAuthClient client = authClientProvider.get();
        IntegrationConfigurationService config = configProvider.get();
        // ...
    }
}
```

### Quando usar `Provider<T>`

- **Dependência circular:** A depende de B que depende de A.
- **Singleton com dep request-scoped:** ex: interceptor singleton que precisa service com contexto.
- **Lazy init:** adiar criação de objeto custoso até primeiro uso.

---

## 7. MapStruct e o Container Guice

Mappers MapStruct registrados automaticamente no Guice (config global `defaultComponentModel = "jakarta"`).

### Mapper simples (sem dependências)

```java
@Mapper
public interface MeuMapper {
    MeuDTO toDto(MinhaEntidade entity);
}
```

Injetável direto:

```java
@Inject
public MeuController(MeuMapper mapper) { ... }
```

### Mapper com `uses` (dependência de classe `@Component`)

```java
@Mapper(
    uses = {StringMappingNormalizer.class},
    injectionStrategy = InjectionStrategy.CONSTRUCTOR
)
public interface MeuIntegrationMapper {
    MinhaEntidade toDomain(MeuDTO dto);
}
```

**Regras:**
- Classe em `uses` **deve** ser `@Component`.
- Use `injectionStrategy = InjectionStrategy.CONSTRUCTOR` pra garantir CDI injete via construtor.

---

## 8. Padrão tipico de wiring DI

Fluxo comum (**ilustrativo** — skill nao opina sobre arquitetura, ajuste a sua):

```
@Controller (entrada)
  └── @Inject Service (@Component)
       └── @Inject Repository (@Repository — interface)
       └── @Inject Gateway concreto (@Component)
            └── @Inject Provider / Resolver / Adapter (@Component)
                 └── resolvido em runtime via @CustomModule + Multibinder
```

`@CustomModule` registra bindings explicitos (Multibinder, `@Provides @Singleton`).

---

## 9. Interfaces e implementacoes via Guice

Interfaces (Ports) abstraem implementacao concreta. Guice resolve a implementacao quando ela e marcada com `@Component` e implementa a interface.

**Interface:**

```java
public interface ProdutoGateway {
    List<MeuProduto> findAll();
}
```

**Implementação:**

```java
@Component
public class DynamicProdutoGateway implements ProdutoGateway {

    private final IntegrationPlatformProvider provider;

    @Inject
    public DynamicProdutoGateway(IntegrationPlatformProvider provider) {
        this.provider = provider;
    }

    @Override
    public List<MeuProduto> findAll() {
        return provider.get().produto().findAll();
    }
}
```

> Guice resolve `ProdutoGateway` ? `DynamicProdutoGateway` automático porque `DynamicProdutoGateway` é `@Component` e implementa interface.

---

## 10. Checklist

### Nova classe injetável

1. ? Identificar estereótipo correto (`@Controller`, `@Repository`, `@Component`).
2. ? Usar `@Inject` de `com.google.inject.Inject` no construtor.
3. ? Declarar deps `private final`, inicializar no construtor.
4. ? **NÃO** usar `new` pra criar deps ? sempre injetar.
5. ? **NÃO** misturar estereótipos (ex: `@Component` + `@Controller`).

### Novo módulo customizado

1. ? Criar classe que estende `AbstractModule`.
2. ? Anotar com `@CustomModule`.
3. ? Usar `Multibinder` pra Strategy Pattern.
4. ? Usar `@Provides @Singleton` pra factories.
5. ? Colocar em `config/`.

### Novo interceptor ou singleton

1. ? Anotar com `@Singleton`.
2. ? Dep circular? Usar `Provider<T>`.
3. ? Não é `@Component`? Garantir registro em algum `@CustomModule`.

---

## 11. Erros Comuns

| Erro | Correção |
|:-----|:---------|
| Usar `javax.inject.Inject` | Sempre `com.google.inject.Inject`. |
| Adicionar `@Component` em `@Controller` | `@Controller` já gerenciado. Remove `@Component`. |
| Adicionar `@Component` em `@Repository` | `@Repository` já gerenciado. Remove `@Component`. |
| Criar implementação manual de Repository | Use interface `JapeRepository` ? framework gera implementação. |
| Usar `new` pra instanciar dep | Injete via construtor. Guice resolve automático. |
| Dep circular com `@Singleton` | Use `Provider<T>` pra quebrar ciclo. |
| Classe sem estereótipo que precisa injeção | Adicione `@Component` ou registre em `@CustomModule`. |
| `@Singleton` sem `@Component` e sem módulo | Guice não encontra. Adicione um dos dois. |
| Mapper MapStruct com `uses` sem `injectionStrategy` | Adicione `injectionStrategy = InjectionStrategy.CONSTRUCTOR`. |
| `@Provides` em classe sem `@CustomModule` | Guice não encontra provider. Adicione `@CustomModule`. |