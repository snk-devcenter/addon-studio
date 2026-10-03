# Exemplos Completos — Controller (Sankhya Addon Studio)

## Controller simples (CRUD)

```java
@Controller(
    serviceName = "ProdutoControllerSP",
    transactionType = EJBTransactionType.Supports
)
public class ProdutoController {

    private final ProdutoService produtoService;

    @Inject
    public ProdutoController(ProdutoService produtoService) {
        this.produtoService = produtoService;
    }

    @Transactional
    public List<ProdutoResponse> importar() {
        return produtoService.importar();
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

    private final PedidoService pedidoService;
    private final ImpressaoService impressaoService;
    private final PedidoRestMapper mapper;

    @Inject
    public PedidoController(
        PedidoService pedidoService,
        ImpressaoService impressaoService,
        PedidoRestMapper mapper
    ) {
        this.pedidoService = pedidoService;
        this.impressaoService = impressaoService;
        this.mapper = mapper;
    }

    @Transactional
    public CriarPedidoResponse criar(@Valid CriarPedidoRequest request) {
        Pedido pedido = mapper.toPedido(request);          // DTO -> entidade @JapeEntity
        Pedido resultado = pedidoService.criar(pedido);
        return mapper.toCriarResponse(resultado);
    }

    @Transactional
    public EmitirPedidoResponse emitir(@Valid EmitirPedidoRequest request) {
        Pedido emitido = pedidoService.emitir(request.getNuPedido());
        Impressao impressao = impressaoService.gerarPdf(emitido);

        ServiceContext ctx = ServiceContext.getCurrent();
        ctx.putHttpSessionAttribute(impressao.getLabel(), impressao.getFile());

        return mapper.toEmitirResponse(emitido);
    }

    @Transactional
    public void cancelar(@Valid CancelarPedidoRequest request) {
        pedidoService.cancelar(request.getNuPedido());
    }
}
```

> Duas deps de service porque sao duas responsabilidades distintas (pedido e impressao) — nao uma classe por endpoint. `emitir` e `cancelar` moram no mesmo `PedidoService` que `criar`.

