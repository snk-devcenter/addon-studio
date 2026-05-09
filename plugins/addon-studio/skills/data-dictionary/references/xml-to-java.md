# Geração @JapeEntity a partir de XML (XML -> Java)

## Fluxo de Criacao

```
XML do Dicionario -> Entidade Java (@JapeEntity) limpa
```

---

## Mapeamento Tag raiz / instancia -> `@JapeEntity`

| Tag raiz XML    | Tag instancia XML    | `@JapeEntity` resultante                                                                                  |
|:----------------|:---------------------|:-----------------------------------------------------------------------------------------------------------|
| `<table>`       | `<instance>`         | `@JapeEntity(entity = "<instance.name>", table = "<table.name>")`                                          |
| `<nativeTable>` | `<instance>`         | `@JapeEntity(entity = "<instance.name>", table = "<nativeTable.name>", isNativeTable = true)`              |
| `<nativeTable>` | `<nativeInstance>`   | `@JapeEntity(entity = "<nativeInstance.name>", table = "<nativeTable.name>", isNativeTable = true, isNativeInstance = true)` |

---

## Mapeamento PK -> `@Id`

| XML                                    | Java                                                    |
|:---------------------------------------|:--------------------------------------------------------|
| `<primaryKey>` com 1 `<field>`         | `@Id` no campo correspondente                           |
| `<primaryKey>` com N `<field>`         | Classe `@Embeddable` + `@Id` no campo embeddable |

### PK Simples

```xml
<primaryKey>
    <field name="CODPRODUTO"/>
</primaryKey>
```

```java
@Id
@Column(name = "CODPRODUTO")
private Integer codProduto;
```

### PK Composta

```xml
<primaryKey>
    <field name="CODPAI"/>
    <field name="NUITEM"/>
</primaryKey>
```

Cria classe `@Embeddable`:

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
@Embeddable
public class TdcXyzEntidadeId {

    @Column(name = "CODPAI")
    private Integer codPai;

    @Column(name = "NUITEM")
    private Integer nuItem;
}
```

Na entidade:

```java
@Id
private TdcXyzEntidadeId embeddedId;
```

---

## Mapeamento `<field>` -> `@Column`

Pra **cada** `<field>` no XML, cria campo Java com **so** `@Column(name = "<nome>")`.

| XML                   | Java                     |
|:----------------------|:-------------------------|
| `<field name="XYZ">` | `@Column(name = "XYZ")` |

**Tipo Java inferido do `dataType` XML:**

| XML `dataType` | Tipo Java sugerido                |
|:---------------|:----------------------------------|
| `INTEIRO`      | `BigDecimal` ou `Integer`         |
| `TEXTO`        | `String`                          |
| `DECIMAL`      | `BigDecimal`                      |
| `DATA_HORA`    | `Timestamp` (`java.sql.Timestamp`) |
| `CHECKBOX`     | `Boolean`                         |
| `PESQUISA`     | `BigDecimal` ou `Integer` (tipo FK) |

> Campos `dataType="PESQUISA"` geram campo Java com tipo FK. Nao precisa `@OneToOne` / `@JoinColumn` so por ser PESQUISA — so adiciona quando entidade precisa navegar pra referenciada no dominio.

---

## Mapeamento `<relationShip>` -> `@OneToMany`

Pra cada `<relation>` dentro `<relationShip>`, cria campo `@OneToMany`:

```xml
<relation entityName="TdcXyzVinculoProduto">
    <fields>
        <field localName="CODPRODUTO" targetName="CODPRODUTO"/>
    </fields>
</relation>
```

```java
@OneToMany(
    cascade = Cascade.ALL,
    relationship = {
        @Relationship(fromField = "CODPRODUTO", toField = "CODPRODUTO")
    }
)
private List<TdcXyzVinculoProduto> vinculos;
```

| XML           | Java `@Relationship` |
|:--------------|:---------------------|
| `localName`   | `fromField`          |
| `targetName`  | `toField`            |

---

## Mapeamento PESQUISA com navegacao -> `@OneToOne` + `@JoinColumn`

Dominio precisa navegar pra outra entidade (ex: acessar campos Parceiro)? Adiciona `@OneToOne` + `@JoinColumn`:

```xml
<field name="CODPARC" dataType="PESQUISA" targetInstance="Parceiro" targetField="CODPARC" targetType="INTEIRO" ...>
```

```java
@OneToOne
@JoinColumn(name = "CODPARC", referencedColumnName = "CODPARC")
private Parceiro parceiro;
```

> `@JoinColumn` **so** `name` e `referencedColumnName`. `name` = campo local; `referencedColumnName` = campo na tabela referenciada.

---

## Atenção: FK que referencia campo nao-PK da entidade alvo

As vezes FK local **nao aponta pra PK** da referenciada, mas pra outro campo unico (codigo identificacao externo, ex: `CODORIGEM`, `CODIGOINTEGRACAO`).

Nesses casos, `referencedColumnName` = **campo unico na tabela destino** — **nao** PK.

**Regra:**
- `name` = coluna FK local (na tabela que contem `@JoinColumn`)
- `referencedColumnName` = campo referencia na tabela destino (PK ou qualquer unico)

**Exemplo correto - FK local aponta pra campo unico `CODORIGEM` na destino:**
```java
// Tabela TDCXYZREL possui coluna CODPRODUTO que referencia CODORIGEM de TDCXYZPRD
@OneToOne
@JoinColumn(name = "CODPRODUTO", referencedColumnName = "CODORIGEM")
private Produto produto;

// Tabela TDCXYZREL possui coluna CODCULTURA que referencia CODORIGEM de TDCXYZCUL
@OneToOne
@JoinColumn(name = "CODCULTURA", referencedColumnName = "CODORIGEM")
private Cultura cultura;
```

**Exemplo errado - `name` e `referencedColumnName` invertidos:**
```java
// NUNCA FAÇA ISSO - CODORIGEM nao é um campo local de TDCXYZREL
@JoinColumn(name = "CODORIGEM", referencedColumnName = "CODPRODUTO")
private Produto produto;
```

> **Resumo:** `name` = **sempre** campo da tabela que **tem** o `@JoinColumn`. `referencedColumnName` = campo na tabela **referenciada**. FK nao aponta pra PK? Identifica qual campo unico destino ta sendo usado e poe em `referencedColumnName`.

---

## Campos do XML que Nao vao para o Java

Itens XML que **nao geram nada** na entidade Java:

| Item XML                                     | Motivo                                       |
|:---------------------------------------------|:---------------------------------------------|
| `sequenceType` / `sequenceField`             | Framework gerencia, nao entidade |
| `<description>`                              | Metadata UI                               |
| `<expression>`                               | Framework gerencia                    |
| `<fieldOptions>`                             | Metadata UI                               |
| `dataType`, `size`, `readOnly`, `order`, etc. | Metadata UI                               |

---

## Anotacoes Lombok Padrao

Toda entidade tem Lombok minimo:

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
```

`@Builder` so se entidade construida programaticamente no dominio.

