# Relacionamentos — Entity (Sankhya Addon Studio)

## Mapeamento de colunas — qual anotação usar

| Relacionamento | Anotação de mapeamento de coluna       |
|:---------------|:----------------------------------------|
| `@ManyToOne`   | `@JoinColumn` ou `@JoinColumns`         |
| `@OneToOne`    | `@JoinColumn` ou `@JoinColumns`         |
| `@OneToMany`   | `relationship = { @Relationship(...) }` |

> **Regra crítica**: `@JoinColumn`/`@JoinColumns` **NUNCA** com `@OneToMany`. Pra `@OneToMany`, use somente o atributo `relationship`.

## `@OneToMany` — Pai -> Filhos

Entidade com lista de filhos.

```java

@OneToMany(
    cascade = {Cascade.CREATE, Cascade.MERGE},
    relationship = {
        @Relationship(
            fromField = "CODPRODUTO",  // Campo da tabela PAI
            toField = "CODPRODUTO"     // Campo da tabela FILHA
        )
    }
)
private List<TdcXyzVinculoProduto> vinculos;
```

| Atributo    | Significado                                                                  |
|:------------|:-----------------------------------------------------------------------------|
| `cascade`   | Operações cascateadas. Prefira `{Cascade.CREATE, Cascade.MERGE}` em vez de `Cascade.ALL` (evita delete em cascata acidental). |
| `fromField` | Nome da **coluna** na tabela pai                                             |
| `toField`   | Nome da **coluna** na tabela filha                                           |

> Tipo do campo sempre `List<EntidadeFilha>`.

### `@OneToMany` quando o pai tem PK composta

Pai com PK composta, filho referencia o pai via FK composta — pai usa `relationship` (não `@JoinColumns`); filho usa `@ManyToOne` + `@JoinColumns`:

```java
// Pai com PK composta
@JapeEntity(entity = "Pai", table = "TB_PAI")
public class Pai {
    @Id
    private PaiId id;     // @Embeddable com COL1 + COL2

    @OneToMany(
        cascade = {Cascade.CREATE, Cascade.MERGE},
        relationship = {
            @Relationship(fromField = "COL1", toField = "FK_PAI_COL1"),
            @Relationship(fromField = "COL2", toField = "FK_PAI_COL2")
        }
    )
    private List<Filha> filhas;
}

// Filho referencia pai via FK composta
@JapeEntity(entity = "Filha", table = "TB_FILHA")
public class Filha {
    @Id
    @Column(name = "ID")
    private Integer id;

    @ManyToOne
    @JoinColumns({
        @JoinColumn(name = "FK_PAI_COL1", referencedColumnName = "COL1"),
        @JoinColumn(name = "FK_PAI_COL2", referencedColumnName = "COL2")
    })
    private Pai pai;
}
```

## `@OneToOne` + `@JoinColumn` — Navegação para entidade referenciada

Domínio precisa **navegar** para outra entidade (acessar campos dela).

```java

@OneToOne
@JoinColumn(name = "CODPARC", referencedColumnName = "CODPARC")
private Parceiro parceiro;
```

| Atributo               | Significado                                                |
|:-----------------------|:-----------------------------------------------------------|
| `name`                 | Coluna na **tabela atual** (FK)                            |
| `referencedColumnName` | Coluna na **tabela referenciada** (PK ou campo de vínculo) |

## `@OneToOne` / `@ManyToOne` + `@JoinColumns` — FK Composta

FK aponta para PK composta — use `@JoinColumns` agrupando múltiplos `@JoinColumn`. Funciona com `@OneToOne` e `@ManyToOne`.

### Cenário A — PK simples referencia PK composta

```java
@JapeEntity(entity = "ChaveSimples", table = "TB_CHAVE_SIMPLES")
public class ChaveSimples {
    @Id
    @Column(name = "ID")
    private Integer id;

    @OneToOne
    @JoinColumns({
        @JoinColumn(name = "FK_COL1", referencedColumnName = "COL1"),
        @JoinColumn(name = "FK_COL2", referencedColumnName = "COL2")
    })
    private ChaveComposta chaveComposta;
}
```

### Cenário B — PK composta referencia PK composta

```java
@JapeEntity(entity = "ChaveComposta2", table = "TB_CHAVE_COMPOSTA_2")
public class ChaveComposta2 {
    @Id
    private ChaveComposta2Id id;

    @ManyToOne
    @JoinColumns({
        @JoinColumn(name = "FK_TB1_COL1", referencedColumnName = "COL1"),
        @JoinColumn(name = "FK_TB1_COL2", referencedColumnName = "COL2")
    })
    private ChaveComposta1 chaveComposta1;
}
```

### Cenário C — referência a campo único não-PK na tabela alvo

```java
@OneToOne
@JoinColumns({
    @JoinColumn(name = "CODTIPOPER", referencedColumnName = "CODTIPOPER"),
    @JoinColumn(name = "DHALTER", referencedColumnName = "DHTIPOPER")
})
private TipoOperacao tipoOperacao;
```

### Boas práticas em `@JoinColumns`

- **Nomes descritivos**: `FK_PAI_COL1` ou `CODEMP_CONTRATO` em vez de `EMP`/`COL`. Reduz ambiguidade quando há múltiplas FKs compostas no mesmo entity.
- **Mesma ordem** em `@JoinColumns` e no `@Embeddable` da PK alvo. Inconsistência causa join quebrado em runtime sem erro de compilação.
- **`name` vs `referencedColumnName`**: `name` = coluna **local** (na tabela com `@JoinColumn`); `referencedColumnName` = coluna **na tabela alvo**. Inverter quebra silenciosamente — ver `data-dictionary/references/xml-to-java.md`, seção "FK que referencia campo nao-PK".

## `@ManyToOne` + `@JoinColumn` — Filho -> Pai

Navegação inversa: filho -> pai.

```java

@ManyToOne
@JoinColumn(name = "CODORIGEM", referencedColumnName = "CODPRODUTO")
private TdcXyzProduto produto;
```

## Quando usar cada relacionamento

| Preciso de...                         | Uso                                                 |
|:--------------------------------------|:----------------------------------------------------|
| Lista de filhos na entidade pai       | `@OneToMany`                                        |
| Acessar campos de outra entidade (FK) | `@OneToOne` + `@JoinColumn`                         |
| Acessar o pai a partir do filho       | `@ManyToOne` + `@JoinColumn`                        |
| Apenas armazenar a FK (sem navegar)   | Somente `@Column(name = "FK")` — sem relacionamento |

> **Importante:** Só precisa do valor da FK (ex: `codParceiro`) — use apenas `@Column`. `@OneToOne`/`@JoinColumn` necessário **somente** quando domínio precisa acessar campos da entidade referenciada.

