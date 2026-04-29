---
applyTo: "**/*Repository.java"
---

# Repositório (@Repository) — Addon Studio 2.0

Padrão **Repository** no SDK Sankhya = abstração simplifica acesso dados. Define interfaces declarativas, SDK gera implementação em compile-time — sem boilerplate, type-safe, protege SQL Injection.

> **Referência complementar:** consulte `entity-instructions.md` para criar entidades correspondentes.

---

## 1. Criando um Repositório

Repositório = **interface** que estende `JapeRepository<ID, T>`:

```java
import br.com.sankhya.sdk.data.repository.JapeRepository;
import br.com.sankhya.studio.stereotypes.Repository;

@Repository
public interface VeiculoRepository extends JapeRepository<Long, Veiculo> {
    // métodos customizados aqui
}
```

- **`Long`** → tipo chave primária (primeiro param)
- **`Veiculo`** → classe entidade (segundo param)

---

## 2. Métodos CRUD Padrão (Herdados)

| Método                       | Descrição                                              |
|:-----------------------------|:-------------------------------------------------------|
| `save(T entity)`             | Salva ou atualiza entidade                             |
| `findByPK(ID id)`            | Busca por PK → retorna `Optional<T>`                   |
| `findAll()`                  | Retorna todas instâncias                               |
| `findAll(Pageable pageable)` | Retorna página com ordenação → `Page<T>`               |
| `delete(T entity)`           | Remove entidade do banco                               |

---

## 3. Consultas Customizadas

### 3.1 `@Criteria` — Consultas com Condição WHERE

Use `@Criteria` para filtros SELECT simples tipados.

**Obrigatório: prefixo `this.` em todos campos da clause.**

```java

@Criteria(clause = "this.PLACA = :placa")
Optional<Veiculo> findByPlaca(String placa);

@Criteria(clause = "this.ATIVO = :ativo")
List<Veiculo> findByAtivo(Boolean ativo);

@Criteria(clause = "this.CODEMP = :empresa AND this.STATUS = :status")
List<Pedido> findByEmpresaAndStatus(Long empresa, String status);
```

> Use `@Parameter("nome")` para vincular explicitamente nome do param quando necessário.

```java

@Criteria(clause = "this.DTNEG BETWEEN :dataInicio AND :dataFim")
List<Pedido> findByPeriodo(
    @Parameter(name = "dataInicio") LocalDate inicio,
    @Parameter(name = "dataFim") LocalDate fim
);
```

---

### 3.2 `@NativeQuery` — Consultas SQL Nativas

Use `@NativeQuery` para queries complexas com JOINs, agregações, funções específicas banco etc.

```java

@NativeQuery("SELECT CODVEICULO, PLACA FROM TGFVEI WHERE MODELO = :modelo")
List<VeiculoDTO> findByModeloNativo(@Parameter("modelo") String modelo);
```

#### Mapeando o resultado com `@NativeQuery.Result`

Crie interface anotada com `@NativeQuery.Result` para mapear colunas retornadas:

```java

@NativeQuery.Result
interface VeiculoDTO {

    Long getCodVeiculo();   // mapeia coluna CODVEICULO

    String getPlaca();      // mapeia coluna PLACA
}
```

Nomes dos getters devem coincidir **exatamente** com nomes/aliases das colunas. Divergência = `null`.

#### Retornando tipos Java simples

```java

@NativeQuery("SELECT DESCRPROD FROM TGFPRO WHERE CODPROD = :codigo")
String buscarDescricaoPorCodigo(@Parameter("codigo") Long codigo);

@NativeQuery("SELECT COUNT(1) FROM TGFPRO")
Long contarTotalDeProdutos();
```

Queries tipo simples devem retornar **exatamente uma coluna**. Mais de uma lança `ResultHasMoreThanOneColumnException`.

#### Passando `JdbcWrapper` para reuso de conexão

Ideal dentro de `@Listener`, reaproveita conexão transacional existente:

```java

@NativeQuery("SELECT COUNT(1) FROM TGFCAB WHERE STATUS = 'P'")
Long contarPendentes(JdbcWrapper jdbc);
```

---

### 3.3 `@Modifying` + `@NativeQuery` — Operações de Escrita (UPDATE / DELETE / INSERT)

```java

@Modifying
@NativeQuery("UPDATE TGFPRO SET VLRVENDA = VLRVENDA * :fator WHERE CODGRUPOPROD = :grupo")
int reajustarPrecoPorGrupo(@Parameter("fator") BigDecimal fator, @Parameter("grupo") Long grupo);

@Modifying
@NativeQuery("DELETE FROM AD_LOGS WHERE DTEXPIRACAO < :data")
int excluirLogsExpirados(@Parameter("data") LocalDate data);
```

Sempre envolva `@Modifying` em método `@Transactional`.

```java

@Transactional
public int limparLogsAntigos(LocalDate data) {
    return logRepository.excluirLogsExpirados(data);
}
```

---

### 3.4 Paginação com `@Criteria`

Paginação suportada **apenas** com `@Criteria`. `@NativeQuery` não suporta.

```java

@Criteria(clause = "this.ATIVO = :ativo")
Page<Veiculo> findByAtivoPaginado(Boolean ativo, Pageable pageable);
```

**Uso no serviço:**

```java
PageRequest pageRequest = PageRequest.of(0, 10, Sort.by("PLACA", Direction.DESC));
Page<Veiculo> pagina = repository.findByAtivoPaginado(true, pageRequest);
```

---

### 3.5 Funções SQL e Macros Sankhya

```java
// Função UPPER
@Criteria(clause = "UPPER(this.NOMEPARC) = UPPER(:nome)")
List<Nota> findByNomeParceiroCaseInsensitive(String nome);

// Macro dbDate()
@Criteria(clause = "this.DTMOV = dbDate()")
List<Movimentacao> findByDataAtual();
```

---

### 3.6 Entidade com Chave Primária Composta (`@Embeddable`)

```java

@Embeddable
public class ItemNotaPK {

    @Column(name = "NUNOTA")
    private Long numeroUnico;
    @Column(name = "SEQUENCIA")
    private Long sequenciaItem;
}

@JapeEntity(entity = "ItemNota", table = "TGFITE")
public class ItemNota {

    @Id
    private ItemNotaPK id;
    @Column(name = "CODPROD")
    private Long codProduto;
}

@Repository
public interface ItemNotaRepository extends JapeRepository<ItemNotaPK, ItemNota> {
    // CRUD para chave composta funciona automaticamente
}
```

---

## 4. Queries SQL Externas (Arquivos)

Queries complexas (100+ linhas) = arquivos externos com `fromFile = true`.

### Arquivo `.sql` (compatível Oracle e MSSQL)

```java

@NativeQuery(value = "queries/listar-veiculos-ativos.sql", fromFile = true)
List<VeiculoView> listarAtivos(@Parameter("ativo") String ativo);
```

**Arquivo:** `model/src/main/resources/queries/listar-veiculos-ativos.sql`

```sql
SELECT v.CODVEI, v.PLACA, v.DESCRICAO
FROM TGFVEI v
WHERE v.ATIVO = :ativo
ORDER BY v.DESCRICAO
```

---

### Arquivo `.xml` (queries por banco de dados)

Use quando sintaxe difere entre Oracle e MSSQL:

**Arquivo:** `model/src/main/resources/queries/quantidade-vendida.xml`

```xml

<sql>
    <both>
        <!-- Query idêntica para ambos os bancos -->
        SELECT COUNT(*) FROM TGFCAB
    </both>
    <oracle>
        SELECT NVL(SUM(ITE.QTDNEG), 0) AS TOTAL FROM TGFITE ITE
        WHERE ITE.CODPROD = :codProd
    </oracle>
    <mssql>
        SELECT ISNULL(SUM(ITE.QTDNEG), 0) AS TOTAL FROM TGFITE ITE
        WHERE ITE.CODPROD = :codProd
    </mssql>
</sql>
```

**Prioridade de seleção:**

1. `<both>` — usada para ambos bancos (maior prioridade)
2. `<oracle>` ou `<mssql>` — só se `<both>` vazia

Queries de arquivos **cacheadas automaticamente** em memória após primeira leitura.

---

### Validações em Compile-Time

SDK valida queries externas durante compilação:

| Verificação                         | Resultado          |
|:------------------------------------|:-------------------|
| Arquivo não encontrado              | Erro de compilação |
| Arquivo `.sql` vazio                | Erro de compilação |
| XML mal formado                     | Erro de compilação |
| Todas as tags XML vazias            | Erro de compilação |
| Apenas Oracle OU MSSQL definida     | Warning            |
| Parâmetros inconsistentes entre DBs | Erro de compilação |

---

## 5. Boas Práticas

1. **Use `Optional<T>`** para resultados que podem não existir
2. **Nomes descritivos** — prefira `findByPlaca` a genérico `buscar`
3. **Valide params no serviço** antes de chamar repositório
4. **Separe responsabilidades** — lógica negócio no `@Service`, não no repositório
5. **Use `@Transactional`** para toda operação `@Modifying`
6. **Evite `SELECT *`** — mapeie só campos necessários
7. **Use paginação** para consultas com muitos registros (padrão: 500 por sessão)
8. **Prefira `<both>` em XMLs** para query única entre bancos

---

## 6. Anti-Patterns

```java
// Errado: query genérica sem filtros — pode retornar muitos registros
@Criteria(clause = "1 = 1")
List<Produto> findAll();

// Correto: sempre use filtros obrigatórios
@Criteria(clause = "this.ATIVO = 'S' AND this.CODEMP = :empresa")
List<Produto> findAtivosByEmpresa(Long empresa);

// Errado: lógica de negócio dentro do repositório
@Repository
public interface PedidoRepository extends JapeRepository<Long, Pedido> {

    default void aprovarPedido(Long nunota) { /* ... */ }
}

// Correto: lógica de negócio no serviço
@Component
public class PedidoService {

    @Transactional
    public void aprovarPedido(Long nunota) {
        Pedido pedido = repository.findById(nunota).orElseThrow(...);
        repository.save(pedido);
    }
}

// Errado: query methods do Spring Data NÃO são suportados
List<Veiculo> findByPlacaStartingWith(String prefix); // não funciona

// Correto: use @Criteria no lugar
@Criteria(clause = "this.PLACA LIKE :prefix")
List<Veiculo> findByPlacaStartingWith(@Parameter("prefix") String prefix);
```

---

## 7. Limitações Conhecidas

- **Query Methods por nome** (estilo Spring Data JPA) **não suportados**
- **Paginação** só com `@Criteria`, não com `@NativeQuery`
- **Limite padrão registros**: 500 por sessão (use paginação pra contornar)
- **`@Delete` descontinuada** — use `@Modifying` + `@NativeQuery` para exclusões

---

## 8. Exemplo Completo

```java
// Entidade
@JapeEntity(entity = "CabecalhoNota", table = "TGFCAB")
@Data
public class Pedido {

    @Id
    @Column(name = "NUNOTA")
    private Long numero;
    @Column(name = "CODPARC")
    private Long codigoCliente;
    @Column(name = "VLRNOTA")
    private BigDecimal valor;
    @Column(name = "STATUS")
    private String status;
    @Column(name = "DHALTER")
    private LocalDateTime dataAlteracao;
}

// DTO de resultado
@NativeQuery.Result
public interface PedidoResumoDTO {

    Long getNumero();

    BigDecimal getValor();
}

// Repositório
@Repository
public interface PedidoRepository extends JapeRepository<Long, Pedido> {

    @Criteria(clause = "this.CODPARC = :codigoCliente")
    List<Pedido> findByCliente(@Parameter("codigoCliente") Long codigoCliente);

    @NativeQuery("SELECT NUNOTA as numero, VLRNOTA as valor FROM TGFCAB WHERE STATUS = :status AND CODEMP = :empresa")
    List<PedidoResumoDTO> findResumoPorStatus(
        @Parameter("status") String status,
        @Parameter("empresa") Long empresa
    );

    @Modifying
    @NativeQuery("DELETE FROM TGFCAB WHERE STATUS = 'R' AND DHALTER < :dataLimite")
    int deleteRascunhosAntigos(@Parameter("dataLimite") LocalDateTime dataLimite);
}

// Serviço
@Component
public class PedidoService {

    private final PedidoRepository pedidoRepository;

    @Inject
    public PedidoService(PedidoRepository pedidoRepository) {
        this.pedidoRepository = pedidoRepository;
    }

    @Transactional
    public void limparRascunhosAntigos() {
        LocalDateTime limite = LocalDateTime.now().minusDays(30);
        pedidoRepository.deleteRascunhosAntigos(limite);
    }

    public List<Pedido> buscarPedidosDoCliente(Long codigoCliente) {
        if (codigoCliente == null) {
            throw new IllegalArgumentException("Código do cliente é obrigatório.");
        }
        return pedidoRepository.findByCliente(codigoCliente);
    }
}
```

---

## 9. Checklist

### Criando um repositório novo

1. — Interface Java em local apropriado da arquitetura do projeto.
2. — Extends `JapeRepository<TipoID, TipoEntidade>` (ID primeiro, entidade depois).
3. — Anotada com `@Repository` de `br.com.sankhya.studio.stereotypes`.
4. — Métodos `@Criteria` com prefixo `this.` em todos campos da clause.
5. — Nomes de params do método batem com `:placeholders` da clause.
6. — `@NativeQuery.Result` como interface publica em arquivo proprio (não interface interna do repository).
7. — `@Modifying` sempre com `@Transactional` no serviço chamador.
8. — Queries complexas em arquivo externo com `fromFile = true`.
9. — `Optional<T>` para métodos que podem não encontrar resultado.

### Erros comuns

| Erro                                             | Correção                                           |
|:-------------------------------------------------|:---------------------------------------------------|
| Omitir `this.` na clause do `@Criteria`          | Usar `this.CAMPO = :param` — obrigatório           |
| Parâmetros invertidos em `JapeRepository<T, ID>` | ID sempre primeiro param                           |
| `@NativeQuery.Result` como interface interna     | Criar como interface pública em arquivo proprio    |
| `@Modifying` sem `@Transactional` no chamador    | Envolver chamada em método `@Transactional`        |
| Usar Query Methods do Spring Data                | Não suportado — usar `@Criteria` ou `@NativeQuery` |
| `@Delete` descontinuada                          | Usar `@Modifying` + `@NativeQuery`                 |