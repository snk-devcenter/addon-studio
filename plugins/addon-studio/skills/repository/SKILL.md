---
name: repository
description: Cria, revisa e refatora interfaces `@Repository` Sankhya estendendo `JapeRepository<ID, Entity>` com `@Criteria`, `@NativeQuery`, `@Modifying`, `@Param`, paginação, `findByPK` (retorno nullable, `throws Exception`). Use ao criar, alterar, revisar, auditar ou padronizar a camada de acesso a dados, ao implementar consulta/listagem/filtro/paginação/busca, ao escrever query custom, ao trabalhar com arquivos `*Repository.java`, ou ao tocar em código com `@Repository`/`JapeRepository`.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Repositório (@Repository) — Addon Studio 2.0

Padrão **Repository** no SDK Sankhya = abstração simplifica acesso dados. Define interfaces declarativas, SDK gera implementação em compile-time — sem boilerplate, type-safe, protege SQL Injection.

> **Referência complementar:** consulte `entity` para criar entidades correspondentes.

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

| Método                       | Descrição                                                                   | Lança       |
|:-----------------------------|:----------------------------------------------------------------------------|:------------|
| `save(T entity)`             | Salva ou atualiza entidade                                                  | `Exception` |
| `findByPK(ID id)`            | Busca por PK → retorna `T` (pode ser `null` — verificar com null-check)     | `Exception` |
| `findAll()`                  | Retorna todas instâncias                                                    | `Exception` |
| `findAll(Pageable pageable)` | Retorna página com ordenação → `Page<T>`                                    | `Exception` |
| `delete(T entity)`           | Remove entidade do banco                                                    | `Exception` |

> **Atenção:** todos os métodos herdados lançam `Exception` **checked**. Todo método de serviço ou controller que os chame deve declarar `throws Exception` na assinatura.
>
> **`findByPK` retorna `T` (nullable), não `Optional<T>`.** Use null-check manual:
> ```java
> MinhaEntidade e = repository.findByPK(id);
> if (e == null) throw new MinhaException("Registro não encontrado: " + id);
> ```

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

> **Quando usar `@Parameter`:**
>
> - **Opcional** quando o nome do parâmetro Java casa com o `:nome` da clause — basta declarar `Long empresa, String status` (vincula automaticamente).
> - **Obrigatório** quando os nomes diferem. Sintaxe correta: **`@Parameter(name = "...")`** — sempre com `name = ` explícito. A forma posicional `@Parameter("...")` **causa erro de compilação**.

```java
// Nomes do método != :nome da clause → @Parameter(name = "...") obrigatório
@Criteria(clause = "this.DTNEG BETWEEN :dataInicio AND :dataFim")
List<Pedido> findByPeriodo(
    @Parameter(name = "dataInicio") LocalDate inicio,
    @Parameter(name = "dataFim") LocalDate fim
);
```

---

### 3.2 `@NativeQuery` — Consultas SQL Nativas

> **Import obrigatório:** `import br.com.sankhya.studio.persistence.NativeQuery;`
> Cobre tanto `@NativeQuery` quanto `@NativeQuery.Result`. **Não usar** `br.com.sankhya.sdk.data.repository.NativeQuery` — pacote incorreto, causa erro de compilação.

Use `@NativeQuery` para queries complexas com JOINs, agregações, funções específicas banco etc.

```java

@NativeQuery("SELECT CODVEICULO, PLACA FROM TGFVEI WHERE MODELO = :modelo")
List<VeiculoDTO> findByModeloNativo(String modelo);
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
String buscarDescricaoPorCodigo(Long codigo);

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
void reajustarPrecoPorGrupo(BigDecimal fator, Long grupo);

@Modifying
@NativeQuery("DELETE FROM TDCXYZLOG WHERE DTEXPIRACAO < :data")
void excluirLogsExpirados(LocalDate data);
```

> **`@Modifying` deve retornar `void` ou `Boolean`.** KSP rejeita `int` com erro de compilação.

Sempre envolva `@Modifying` em método `@Transactional`.

```java

@Transactional
public void limparLogsAntigos(LocalDate data) throws Exception {
    logRepository.excluirLogsExpirados(data);
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
// Macro dbDate() — data/hora atual do banco (portatil Oracle/MSSQL)
@Criteria(clause = "this.DTMOV = dbDate()")
List<Movimentacao> findByDataAtual();

// Macro ignorecase() — busca tolerante a case e acentos
@Criteria(clause = "ignorecase(this.NOMEPARC) = ignorecase(:nome)")
List<Nota> findByNomeParceiro(String nome);

// Macro nullValue() — substitui null por padrao (NVL/ISNULL portatil)
@NativeQuery("SELECT nullValue(VLRDESCONTO, 0) FROM TGFCAB WHERE NUNOTA = :nu")
BigDecimal descontoOuZero(Long nu);
```

> Macros traduzem automaticamente entre Oracle e MSSQL. Lista completa (datas, texto, conversoes, agregacoes): ver `macros`. **Sempre prefira macro a sintaxe especifica de banco** (`SYSDATE`, `NVL`, `||`, `ROWNUM`, etc.).

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
List<VeiculoView> listarAtivos(String ativo);
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

1. **Use `Optional<T>`** para resultados de `@Criteria` que podem não existir. Para `findByPK`, o retorno é `T` (nullable) — use null-check manual
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
    public void aprovarPedido(Long nunota) throws Exception {
        Pedido pedido = repository.findByPK(nunota);
        if (pedido == null) throw new IllegalArgumentException("Pedido não encontrado: " + nunota);
        repository.save(pedido);
    }
}

// Errado: query methods do Spring Data NÃO são suportados
List<Veiculo> findByPlacaStartingWith(String prefix); // não funciona

// Correto: use @Criteria no lugar
@Criteria(clause = "this.PLACA LIKE :prefix")
List<Veiculo> findByPlacaStartingWith(String prefix);
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
    List<Pedido> findByCliente(Long codigoCliente);

    @NativeQuery("SELECT NUNOTA as numero, VLRNOTA as valor FROM TGFCAB WHERE STATUS = :status AND CODEMP = :empresa")
    List<PedidoResumoDTO> findResumoPorStatus(
        String status,
        Long empresa
    );

    @Modifying
    @NativeQuery("DELETE FROM TGFCAB WHERE STATUS = 'R' AND DHALTER < :dataLimite")
    void deleteRascunhosAntigos(LocalDateTime dataLimite);
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
    public void limparRascunhosAntigos() throws Exception {
        LocalDateTime limite = LocalDateTime.now().minusDays(30);
        pedidoRepository.deleteRascunhosAntigos(limite);
    }

    public List<Pedido> buscarPedidosDoCliente(Long codigoCliente) throws Exception {
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

1. [ ] Interface Java em local apropriado da arquitetura do projeto.
2. [ ] Extends `JapeRepository<TipoID, TipoEntidade>` (ID primeiro, entidade depois).
3. [ ] Anotada com `@Repository` de `br.com.sankhya.studio.stereotypes`.
4. [ ] Métodos `@Criteria` com prefixo `this.` em todos campos da clause.
5. [ ] Nomes de params do método batem com `:placeholders` da clause.
6. [ ] `@NativeQuery.Result` como interface publica em arquivo proprio (não interface interna do repository).
7. [ ] `@Modifying` sempre com `@Transactional` no serviço chamador.
8. [ ] Queries complexas em arquivo externo com `fromFile = true`.
9. [ ] `Optional<T>` para métodos `@Criteria` que podem não encontrar resultado. `findByPK` retorna `T` nullable — usar null-check manual.
10. [ ] Métodos de serviço/controller que chamam `save`, `findByPK`, `findAll` ou `delete` declaram `throws Exception`.
11. [ ] Métodos `@Modifying` retornam `void` ou `Boolean` — nunca `int`.

### Erros comuns

| Erro                                             | Correção                                           |
|:-------------------------------------------------|:---------------------------------------------------|
| Omitir `this.` na clause do `@Criteria`          | Usar `this.CAMPO = :param` — obrigatório           |
| Parâmetros invertidos em `JapeRepository<T, ID>` | ID sempre primeiro param                           |
| `@NativeQuery.Result` como interface interna     | Criar como interface pública em arquivo proprio    |
| `@Modifying` sem `@Transactional` no chamador    | Envolver chamada em método `@Transactional`        |
| Usar Query Methods do Spring Data                | Não suportado — usar `@Criteria` ou `@NativeQuery` |
| `@Delete` descontinuada                          | Usar `@Modifying` + `@NativeQuery`                 |
| `@Modifying` retornando `int`                    | KSP rejeita — usar `void` ou `Boolean`             |
| `findByPK(...).orElseThrow(...)` ou `.map(...)`  | `findByPK` retorna `T` (nullable), não `Optional<T>` — usar null-check manual |
| Esquecer `throws Exception` em método que usa repositório | Todo método que chama `save`, `findByPK`, `findAll` ou `delete` deve declarar `throws Exception` |
| Import errado de `@NativeQuery`                  | Usar `br.com.sankhya.studio.persistence.NativeQuery`, não `br.com.sankhya.sdk.data.repository.NativeQuery` |


## Related Skills

- `entity` — entidade @JapeEntity sobre a qual o repository opera
- `macros` — macros SQL para `@NativeQuery` e `queries/<arquivo>.xml`
- `test` — repository é tipicamente mockado em testes (cuidado com JapeRepository quirks)

## Skills relacionadas

- `entity` — entidade que o repositório opera
- `macros` — macros SQL em `@NativeQuery`
- `test` — JUnit + Mockito do repositório
