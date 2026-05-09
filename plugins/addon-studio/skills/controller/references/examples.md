# Exemplos Completos — Controller (Sankhya Addon Studio)

## Controller simples (CRUD)

```java
@Controller(
    serviceName = "AlvoControllerSP",
    transactionType = EJBTransactionType.Supports
)
public class AlvoController {

    private final ImportarAlvoService importarAlvoService;

    @Inject
    public AlvoController(ImportarAlvoService importarAlvoService) {
        this.importarAlvoService = importarAlvoService;
    }

    @Transactional
    public List<AlvoDTO> importar() {
        return importarAlvoService.execute();
    }
}
```

## Controller completo (multiplas operacoes)

```java
@Controller(
    serviceName = "PedidoControllerSP",
    transactionType = EJBTransactionType.Supports
)
public class PedidoController {

    private final CriarPedidoService criarPedidoService;
    private final CancelarPedidoService cancelarPedidoService;
    private final EmitirPedidoService emitirPedidoService;
    private final GerarPdfService gerarPdfService;
    private final PedidoRestMapper mapper;

    @Inject
    public PedidoController(
        CriarPedidoService criarPedidoService,
        CancelarPedidoService cancelarPedidoService,
        EmitirPedidoService emitirPedidoService,
        GerarPdfService gerarPdfService,
        PedidoRestMapper mapper
    ) {
        this.criarPedidoService = criarPedidoService;
        this.cancelarPedidoService = cancelarPedidoService;
        this.emitirPedidoService = emitirPedidoService;
        this.gerarPdfService = gerarPdfService;
        this.mapper = mapper;
    }

    @Transactional
    public CriarPedidoResponse criar(@Valid CriarPedidoRequest request) {
        Pedido pedido = mapper.toPedido(request);
        Pedido resultado = criarPedidoService.execute(pedido);
        return mapper.toCriarResponse(resultado);
    }

    @Transactional
    public EmitirPedidoResponse emitir(@Valid EmitirPedidoRequest request) {
        Resultado resultado = emitirPedidoService.execute(request.getNuPedido());
        Impressao impressao = gerarPdfService.execute(resultado);

        ServiceContext ctx = ServiceContext.getCurrent();
        ctx.putHttpSessionAttribute(impressao.getLabel(), impressao.getFile());

        return mapper.toEmitirResponse(resultado);
    }

    @Transactional
    public void cancelar(@Valid CancelarPedidoRequest request) {
        cancelarPedidoService.execute(request.getNuPedido());
    }
}
```

