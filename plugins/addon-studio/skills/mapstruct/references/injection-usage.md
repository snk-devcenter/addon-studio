# Injecao e Uso — MapStruct

## No Controller (via construtor)

```java
@Controller(serviceName = "MeuControllerSP", transactionType = EJBTransactionType.Supports)
public class MeuController {

    private final MeuRestMapper mapper;

    @Inject
    public MeuController(MeuRestMapper mapper) {
        this.mapper = mapper;
    }

    @Transactional
    public MeuResponse executar(MeuRequest request) {
        MeuDomainObj domain = mapper.toDomain(request);
        // ... logica ...
        return mapper.toResponse(domain);
    }
}
```

## No Gateway de integracao (via construtor)

```java
@Component
public class MeuPlatformGateway implements MeuGateway {

    private final MeuApiClient client;
    private final RetrofitCallExecutor executor;
    private final MeuPlatformMapper mapper;

    @Inject
    public MeuPlatformGateway(MeuApiClient client,
                               RetrofitCallExecutor executor,
                               MeuPlatformMapper mapper) {
        this.client = client;
        this.executor = executor;
        this.mapper = mapper;
    }

    @Override
    public List<MeuDomainObj> findAll() {
        MeuApiResponse root = executor.execute(client.buscarTodos());
        return root.getItens().stream()
            .map(mapper::toDomain)
            .collect(Collectors.toList());
    }
}
```

> Mappers injetam como qualquer dep — `@Inject` via construtor. Guice resolve implementacao gerada auto.

