# Injecao e Uso — MapStruct

## No Controller (via construtor)

```java
@Controller(serviceName = "MeuControllerSP", transactionType = EJBTransactionType.Supports)
public class MeuController {

    private final MeuService meuService;
    private final MeuRestMapper mapper;

    @Inject
    public MeuController(MeuService meuService, MeuRestMapper mapper) {
        this.meuService = meuService;
        this.mapper = mapper;
    }

    @Transactional
    public MeuResponse criar(@Valid MeuRequest request) {
        MeuEntity entidade = mapper.toDomain(request);
        MeuEntity salva = meuService.criar(entidade);   // regra de negocio no service
        return mapper.toResponse(salva);
    }
}
```

## Na classe de integracao (via construtor)

```java
@Component
public class MeuPlatformGateway {

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

    public List<MeuEntity> buscarTodos() {
        MeuApiResponse root = executor.execute(client.buscarTodos());
        return root.getItens().stream()
            .map(mapper::toDomain)
            .collect(Collectors.toList());
    }
}
```

> Mappers injetam como qualquer dep — `@Inject` via construtor. Guice resolve implementacao gerada auto.

