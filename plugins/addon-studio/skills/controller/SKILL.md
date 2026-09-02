---
name: controller
description: Cria, revisa e refatora endpoints REST Sankhya com `@Controller` — `serviceName`, SP, `@Transactional`, DTOs, `@Valid`, mapeamento HTTP (GET/POST/PUT/DELETE), códigos de status. Use ao criar, alterar, revisar, auditar ou padronizar controllers REST, ao expor cadastro/feature via REST, ao integrar com app mobile/frontend, ao implementar listagem/lançamento/detalhamento/atualização/exclusão expostos por endpoint (pedido que só diz "listar/filtrar/paginar X" sem citar rota, REST ou app é a query, skill `repository`), ao receber spec de endpoint/API, ao declarar validação de entrada no DTO (`@Valid`, `@NotNull`, `@NotBlank`, `@Size` moram aqui; a resposta de erro da violação é `controller-advice`; injetar o repository/service no controller é `dependency-injection`), ao descobrir como chamar o endpoint de fora (URL a partir do `serviceName`/SP, chamada por Postman ou curl), ao trabalhar com arquivos `*Controller.java`, ou ao tocar em código com `@Controller`/`@GetMapping`/`@PostMapping`/`@RequestMapping`. NÃO usar para consumir API REST de terceiro — expor é aqui, consumir é `retrofit`.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Controller (`@Controller`) — Addon Studio 2.0

`@Controller` marca classes = pontos entrada API interna add-on. Cada metodo publico auto-exposto como endpoint servico. Controllers **orquestram** fluxo requisicao — **nunca** contem logica negocio.

> **Referencias complementares:**
> - `dependency-injection` — Injecao de dependencia (Guice)
> - `mapstruct` — Mapeamento de objetos (MapStruct)
> - `controller-advice` — Tratamento global de excecoes

---

## 1. Anatomia de um Controller

```java
import br.com.sankhya.studio.annotations.Controller;
import br.com.sankhya.studio.annotations.enums.EJBTransactionType;
import br.com.sankhya.studio.persistence.Transactional;
import com.google.inject.Inject;
import javax.validation.Valid;

@Controller(
    serviceName = "PedidoControllerSP",                 // Obrigatorio, sufixo "SP"
    transactionType = EJBTransactionType.Supports       // Opcional (Supports e o padrao)
)
public class PedidoController {

    private final PedidoService pedidoService;          // Dependencias como final
    private final PedidoRestMapper mapper;

    @Inject                                             // Injecao via construtor
    public PedidoController(PedidoService pedidoService,
                            PedidoRestMapper mapper) {
        this.pedidoService = pedidoService;
        this.mapper = mapper;
    }

    @Transactional                                      // Metodos que alteram dados
    public CriarPedidoResponse criar(@Valid CriarPedidoRequest request) {
        Pedido pedido = mapper.toPedido(request);       // DTO -> entidade @JapeEntity
        Pedido salvo = pedidoService.criar(pedido);
        return mapper.toCriarResponse(salvo);           // entidade -> DTO
    }
}
```

### O que atravessa controller -> service

O objeto que sai do mapper e entra no service e a **entidade `@JapeEntity`** — ou um valor simples (`BigDecimal nuPedido`), quando o service nao precisa do registro inteiro.

**Nao existe terceiro modelo entre DTO e entidade.** O caminho padrao tem dois modelos e um mapper:

```
Request DTO  ->  @JapeEntity  ->  Response DTO
```

Um objeto de dominio separado da entidade so se paga quando existe logica que **nao** mapeia 1:1 com tabela — orquestracao entre varias entidades, maquina de estados propria, calculo com invariante que a tabela nao expressa. Isso e decisao consciente do projeto, tomada com o dev: **nao e o default de CRUD** e nao deve ser inferido a partir dos exemplos desta skill.

---

## 2. Atributos do `@Controller`

### `serviceName` (obrigatorio)

Nome servico registrado plataforma. **Deve** terminar com sufixo `SP`.

```java
@Controller(serviceName = "PedidoControllerSP")
```

> `serviceName` define URL acesso servico. Cada metodo publico exposto como `<serviceName>.<nomeDoMetodo>`.

### `transactionType` (opcional)

Define comportamento transacional **padrao** todos metodos classe.

| `EJBTransactionType` | Descricao | Quando usar |
|:---------------------|:----------|:------------|
| `Supports` | Usa transacao se ja existir; senao, sem. | **Padrao.** Controllers mistura leitura+escrita. |
| `Required` | Sempre executa em transacao (cria se nao existir). | Controllers 100% escrita. |
| `NotSupported` | Executa fora transacao (suspende se existir). | Controllers 100% leitura. |

```java
// Padrao (leitura + escrita com @Transactional granular)
@Controller(serviceName = "MeuControllerSP", transactionType = EJBTransactionType.Supports)

// Somente escrita
@Controller(serviceName = "MeuControllerSP", transactionType = EJBTransactionType.Required)

// Somente leitura
@Controller(serviceName = "ConsultaControllerSP", transactionType = EJBTransactionType.NotSupported)
```

---

## 3. Controle Transacional com `@Transactional`

`@Transactional` so pode ser aplicado em **metodo** (`@Target(METHOD)`) e **sempre tem precedencia** sobre `transactionType` da classe.

### Valores de `Transactional.TxType`

Import: `br.com.sankhya.studio.persistence.Transactional`.

| `TxType` | Semantica |
|:---------|:----------|
| `REQUIRED` | **Default** do `@Transactional` bare. Usa a transacao existente; cria uma se nao houver. |
| `REQUIRES_NEW` | Sempre cria transacao nova, suspendendo a atual se existir. |
| `MANDATORY` | Exige transacao ativa; lanca excecao se nao houver. |
| `NOT_SUPPORTED` | Executa fora de transacao; suspende a atual se existir. |
| `NEVER` | Lanca excecao se houver transacao ativa. |

> **Nao existe `TxType.SUPPORTS`.** Esses cinco valores sao o enum inteiro.

### `EJBTransactionType` (classe) vs `TxType` (metodo)

Sao enums **distintos e nao equivalentes** — nao ha par para todo valor:

| `EJBTransactionType` (classe) | Equivalente em `TxType` (metodo) |
|:------------------------------|:---------------------------------|
| `Supports` (padrao)           | **nenhum** — `SUPPORTS` nao existe no `TxType` |
| `Required`                    | `REQUIRED` |
| `NotSupported`                | `NOT_SUPPORTED` |

`REQUIRES_NEW`, `MANDATORY` e `NEVER` so existem por metodo — nao ha equivalente de classe.

> Metodo que deve seguir `Supports`: **omita** `@Transactional` — ele herda o `transactionType` da classe. `Supports` nao e expressavel por metodo.

```java
@Controller(serviceName = "MeuControllerSP", transactionType = EJBTransactionType.NotSupported)
public class MeuController {

    // Usa o padrao da classe (NotSupported) — sem transacao
    public List<MeuResponse> listar() { ... }

    // Sobrepoe o padrao — executa em transacao propria
    @Transactional
    public MeuResponse criar(@Valid MeuRequest request) { ... }

    // Sobrepoe com transacao nova (isolada)
    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void processarBatch() { ... }
}
```

### Quando usar `@Transactional`

| Operacao | `@Transactional` | Motivo |
|:---------|:-----------------|:-------|
| Create / Update / Delete | Sim | Garante atomicidade |
| Leitura simples | Nao | Sem necessidade transacao |
| Leitura + escrita mesmo metodo | Sim | Garante consistencia |
| Operacao idempotente (sem side effects) | Nao | Desnecessario |

---

## 4. DTOs (Request / Response)

Controllers **nunca** expoe a entidade `@JapeEntity` diretamente na response. Use DTOs = contratos entrada/saida.

### Organizacao

> Skill nao opina sobre pacotes. Padrao comum: DTOs (Request/Response) e mapper MapStruct ficam **junto do controller** (mesmo pacote ou subpacotes `dto/` e `mapper/` ao lado do `*Controller.java`). Ajuste a sua arquitetura.

### Request DTO

Usa `@Data` (Lombok) + validacao `javax.validation`:

```java
import lombok.Data;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.DecimalMin;
import java.math.BigDecimal;

@Data
public class CriarPedidoRequest {

    @NotNull(message = "O codigo do parceiro e obrigatorio.")
    private BigDecimal codParceiro;

    @NotBlank(message = "A descricao e obrigatoria.")
    private String descricao;

    @DecimalMin(value = "0.01", message = "O valor deve ser maior que zero.")
    private BigDecimal valor;

    private String observacao;   // Opcional — sem validacao
}
```

### Response DTO

Usa `@Data` (Lombok), sem validacao:

```java
import lombok.Data;
import java.math.BigDecimal;

@Data
public class CriarPedidoResponse {
    private BigDecimal numeroPedido;
    private BigDecimal valorTotal;
    private String status;
}
```

### Anotacoes de validacao comuns

| Anotacao | Uso | Exemplo |
|:---------|:----|:--------|
| `@NotNull` | Campo obrigatorio (qualquer tipo) | `@NotNull(message = "...")` |
| `@NotBlank` | String obrigatoria e nao vazia | `@NotBlank(message = "...")` |
| `@NotEmpty` | Collection/String nao vazia | `@NotEmpty(message = "...")` |
| `@DecimalMin` | Valor minimo (BigDecimal) | `@DecimalMin(value = "0.01", message = "...")` |
| `@Size` | Tamanho min/max de String ou Collection | `@Size(min = 1, max = 200)` |
| `@Valid` | Validacao em cascata (objetos nested) | `@Valid MeuRequest request` |

> `@Valid` em parametro metodo controller ativa validacao automatica. Falha = framework retorna erro antes executar metodo.

---

## 5. Protocolo HTTP — Request e Response

### URL de acesso

```
<dns>/<contexto-addon>/service.sbr?serviceName=<serviceName>.<nomeMetodo>&mgeSession=<jsessionId>
```

- `contexto-addon` = valor `rootProject.name` em `settings.gradle`
- `serviceName` = atributo `@Controller`
- `nomeMetodo` = nome metodo publico controller

**Exemplo:**
```
http://localhost:8080/meu-addon/service.sbr?serviceName=PedidoControllerSP.criarPedido&mgeSession=ABC123
```

### Autenticacao

Todas requisicoes exigem auth via `mgeSession`. `jsessionId` obtido com `MobileLogin`:

```bash
curl --location 'http://localhost:8080/mge/service.sbr?serviceName=MobileLoginSP.login&outputType=json' \
--header 'Content-Type: application/json' \
--data '{
    "requestBody": {
        "NOMUSU": {"$": "USUARIO"},
        "INTERNO": {"$": "SENHA"}
    }
}'
```

> Ambientes com Gateway Sankhya: auth via `MobileLogin` nao necessaria — Gateway gerencia token.

### Formato da Request (POST)

```json
{
  "serviceName": "PedidoControllerSP.criarPedido",
  "requestBody": {
    "request": {
      "codParceiro": 12345,
      "descricao": "Pedido de teste",
      "valor": 150.50,
      "observacao": "Entrega urgente"
    }
  }
}
```

**Regras:**
- `serviceName`: `<serviceName>.<nomeMetodo>` (mesmo valor URL).
- `requestBody`: Contem argumentos metodo como propriedades nomeadas pelo nome parametro Java.

> Metodo `criarPedido(CriarPedidoRequest request)` = JSON usa `"request"` como chave. Se fosse `criarPedido(CriarPedidoRequest pedido)`, chave seria `"pedido"`.

### Formato da Response

**Sucesso (`status = "1"`):**

```json
{
  "serviceName": "PedidoControllerSP.criarPedido",
  "status": "1",
  "pendingPrinting": "false",
  "transactionId": "CB0F625A72C214CF8449F0B18E1FA81A",
  "responseBody": {
    "numeroPedido": 987654,
    "valorTotal": 551.00,
    "status": "PENDENTE"
  }
}
```

**Erro (`status != "1"`):**

```json
{
  "serviceName": "PedidoControllerSP.criarPedido",
  "status": "0",
  "pendingPrinting": "false",
  "transactionId": "CB0F625A72C214CF8449F0B18E1FA81A",
  "statusMessage": "Erro de validacao: O campo descricao e obrigatorio"
}
```

| `status` | Significado |
|:---------|:------------|
| `"1"` | Sucesso |
| `"0"` | Erro de execucao |
| `"3"` | Timeout |
| `"4"` | Cancelado por concorrencia |

> Erro: `responseBody` nao incluido. Mensagem fica em `statusMessage`.

---

## 6. Tipo de Retorno dos Metodos

Tipo retorno cada metodo definido pela regra negocio projeto:

- Metodos retornam dados = retornam **DTO resposta diretamente**.
- Metodos sem retorno dados = **`void`**.

```java
// Com retorno de dados
public PedidoResponse criarPedido(@Valid CriarPedidoRequest request) {
    ...
    return mapper.toResponse(resultado);
}

// Sem retorno de dados
@Transactional
public void cancelar(@Valid CancelarPedidoRequest request) {
    pedidoService.cancelar(request.getNuPedido());
}
```

Framework serializa automaticamente o objeto retornado em `responseBody` da response.

---

## 7. Tratamento Global de Excecoes (`@ControllerAdvice`)

Excecoes lancadas em metodos do controller devem ser tratadas em classe `@ControllerAdvice` separada. **Nunca** capturar excecao no proprio controller — deixar propagar.

> Ver `controller-advice` para regras criticas (handler nao pode retornar `void`, multiplas excecoes por handler, rollback automatico, proibicao de `Exception.class`) e niveis de log sugeridos.

---

## 8. Fluxo Padrao de um Metodo

```
Request DTO —@Valid—> Controller —mapper—> @JapeEntity
                        |
                        |— Service.<operacao>(entidade)
                        |       |— regra de negocio + repository
                        |
                        |— mapper.toResponse(resultado)
                        |
                        |— return response
```

### Metodo com entrada e saida (CRUD)

```java
@Transactional
public CriarPedidoResponse criarPedido(@Valid CriarPedidoRequest request) {
    Pedido pedido = mapper.toPedido(request);
    Pedido resultado = pedidoService.criar(pedido);
    return mapper.toCriarResponse(resultado);
}
```

### Metodo somente com entrada (acao sem retorno)

```java
@Transactional
public void cancelar(@Valid CancelarPedidoRequest request) {
    pedidoService.cancelar(request.getNuPedido());
}
```

### Metodo somente com saida (consulta)

```java
public List<ProdutoResponse> listarProdutos() {
    List<Produto> produtos = produtoService.listar();
    return produtos.stream()
        .map(mapper::toResponse)
        .collect(Collectors.toList());
}
```

### Metodo sem entrada e sem saida (trigger)

```java
@Transactional
public void sincronizar() {
    sincronizacaoService.sincronizar();
}
```

---

## 9. Exemplos Completos

Exemplos completos — controller simples (CRUD) e controller completo (múltiplas operações: criar, emitir, cancelar, com `ServiceContext` para impressão) — em [`references/examples.md`](references/examples.md).

---

## 10. Convencoes

| Convencao | Padrao | Exemplo |
|:----------|:-------|:--------|
| Nome da classe | `<Feature>Controller` | `PedidoController` |
| `serviceName` | `<Feature>ControllerSP` | `PedidoControllerSP` |
| Nome Request DTO | `<Acao>Request` ou `<Acao><Feature>Request` | `CriarPedidoRequest` |
| Nome Response DTO | `<Acao>Response` ou `<Acao><Feature>Response` | `EmitirPedidoResponse` |
| Nome Mapper | `<Feature>RestMapper` | `PedidoRestMapper` |
| Nome Service | `<Feature>Service`, com metodos nomeados por operacao | `PedidoService.criar(...)`, `.cancelar(...)` |

> **Service por feature, nao por endpoint.** Um `<Feature>Service` com metodos nomeados e o padrao — mantem o construtor do controller enxuto. Quebrar em classe por operacao (`CriarPedidoService.execute(...)`) e legitimo quando a operacao cresce a ponto de ter deps proprias, mas e decisao do projeto: **nao gerar um service por endpoint por default.**

---

## 11. Checklist: Novo Controller

1. [ ] Criar classe Controller (organizar conforme arquitetura do projeto).
2. [ ] Anotar com `@Controller(serviceName = "<Feature>ControllerSP")`.
3. [ ] Definir `transactionType` adequado (ou usar padrao `Supports`).
4. [ ] Injetar dependencias (services, mappers) via construtor com `@Inject`.
5. [ ] Criar Request DTOs com validacao (`@NotNull`, `@NotBlank`, etc.).
6. [ ] Criar Response DTOs.
7. [ ] Criar MapStruct Mapper (ver `mapstruct`).
8. [ ] Usar `@Valid` em parametro dos metodos que recebem DTOs.
9. [ ] Usar `@Transactional` em metodos que alteram dados.
10. [ ] Retornar tipo adequado conforme regra negocio (DTO resposta ou `void`).
11. [ ] **NAO** colocar logica negocio — delegar para o service.
12. [ ] **NAO** capturar excecoes — deixar `@ControllerAdvice` tratar.
13. [ ] Verificar se `@ControllerAdvice` cobre excecoes lancadas pelo service.

---

## 12. Anti-Patterns (PROIBIDO)

| Anti-Pattern | Correcao |
|:-------------|:---------|
| Retornar entidade `@JapeEntity` diretamente | Usar Response DTO + MapStruct |
| Logica de negocio no controller | Mover para o service |
| Criar um objeto de dominio intermediario entre DTO e `@JapeEntity` por default | Mapear direto para a entidade — terceiro modelo so por decisao explicita do projeto |
| `try/catch` no controller para excecoes de negocio | Deixar o `@ControllerAdvice` tratar |
| Controller acessando Repository diretamente | Usar Service como intermediario |
| Controller chamando Gateway diretamente | Usar Service como intermediario |
| `serviceName` sem sufixo `SP` | Sempre `<Nome>SP` |
| Esquecer `@Transactional` em metodo de escrita | Adicionar `@Transactional` |
| `@Transactional(Transactional.TxType.SUPPORTS)` | Nao existe — omitir `@Transactional` (metodo herda `Supports` da classe) |
| `@Transactional` na classe | So vale em metodo (`@Target(METHOD)`) — use `transactionType` no `@Controller` |
| Esquecer `@Valid` no parametro | Adicionar `@Valid` para ativar validacao |
| Adicionar `@Component` no controller | `@Controller` ja e gerenciado — nao misturar |
| Capturar excecao e retornar `null` | Deixar a excecao propagar para o `@ControllerAdvice` |


## Skills relacionadas

- `controller-advice` — tratamento global de exceções lançadas pelo controller
- `dependency-injection` — wiring Guice do controller (injeção de serviços)
- `mapstruct` — controller usa mapper MapStruct para DTO ↔ entidade `@JapeEntity`
- `repository` — service delega persistência ao repository (controller nunca acessa repository direto)
- `test` — JUnit + Mockito do controller
