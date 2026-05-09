# Geração XML a partir de @JapeEntity (Java -> XML)

## Fluxo de Geracao

```
Entidade Java (@JapeEntity) -> XML do Dicionario -> Limpar entidade Java
```

1. **Ler** entidade + dependencias (`@Embeddable`, relacionamentos).
2. **Gerar** XML conforme Parte 1.
3. **Limpar** entidade removendo atributos extras, conforme a etapa de limpeza da entidade Java.

---

## Mapeamento `@JapeEntity` -> Tag raiz e tag de instancia

| `isNativeTable` | `isNativeInstance` | Tag raiz        | Tag de instancia      |
|:----------------|:-------------------|:----------------|:----------------------|
| omitido         | omitido            | `<table>`       | `<instance>`          |
| `true`          | omitido            | `<nativeTable>` | `<instance>`          |
| `true`          | `true`             | `<nativeTable>` | `<nativeInstance>`    |

Atributo `name` da tag raiz vem de `@JapeEntity(table = "...")`. Atributo `name` da tag de instancia vem de `@JapeEntity(entity = "...")`.

> Combinacao `isNativeTable = false` + `isNativeInstance = true` **nao existe** — instancia nativa pressupoe tabela nativa.

---

## Mapeamento PK e Sequencia

| Condicao                                | `sequenceType` | `sequenceField` |
|:-----------------------------------------|:---------------|:----------------|
| `@Id` simples com `@GeneratedValue(AUTO)` ou sem `@GeneratedValue` (default AUTO) | `"A"` | nome coluna |
| `@Id` simples com `@GeneratedValue(MANUAL)` | `"M"` | - |
| `@EmbeddedId` com um campo `@GeneratedValue(AUTO)` | `"A"` | nome coluna |
| `@EmbeddedId` sem AUTO (todos manuais ou sem `@GeneratedValue`) | `"M"` | - |

---

## Mapeamento de Atributos `@Column` -> `<field>`

Entidade original com atributos extra no `@Column`? Mapeie pra XML:

| Atributo Java (`@Column`) | Atributo XML (`<field>`) | Conversao                                |
|:--------------------------|:-------------------------|:-----------------------------------------|
| `name`                    | `name`                   | Direto                                   |
| `description`             | `<description>`          | Sub-tag                                  |
| `documentation`           | -                        | Ignorado no XML                          |
| `dataType`                | `dataType`               | `DataType.INTEGER` -> `"INTEIRO"`, etc.  |
| `size`                    | `size`                   | Direto                                   |
| `precision`               | `nuCasasDecimais`        | Direto                                   |
| `required`                | `required`               | `true` -> `"S"`, `false`/omitido -> `"N"` |
| `readOnly`                | `readOnly`               | `true` -> `"S"`, `false`/omitido -> `"N"` |
| `allowSearch`             | `allowSearch`            | `true` -> `"S"`, `false`/omitido -> `"N"` |
| `visibleOnSearch`         | `visibleOnSearch`        | `true` -> `"S"`, `false`/omitido -> `"N"` |
| `isPresentation`          | `isPresentation`         | `true` -> `"S"`, `false`/omitido -> `"N"` |
| `visible`                 | `visible`                | `false` -> `"N"`, `true`/omitido -> `"S"` |
| `calculated`              | `calculated`             | `true` -> `"S"`, `false`/omitido -> `"N"` |
| `order`                   | `order`                  | Direto                                   |
| `uiTabName`               | `UITabName`              | **Atenção no case!**                     |
| `uiGroupName`             | `UIGroupName`            | **Atenção no case!**                     |
| `targetInstance`          | `targetInstance`         | Direto                                   |
| `targetField`             | `targetField`            | Direto                                   |
| `targetType`              | `targetType`             | `DataType.INTEGER` -> `"INTEIRO"`, etc.  |
| `options = { @Option }`   | `<fieldOptions>`         | Sub-tag com `<option>`                   |

**Mapeamento `DataType`:**

| Java (`DataType`)              | XML (`dataType`)       | Notas                                                          |
|:-------------------------------|:-----------------------|:---------------------------------------------------------------|
| `DataType.TEXT`                | `TEXTO`                | Exige atributo `size` no XML                                   |
| `DataType.LARGE_TEXT`          | `CAIXA_TEXTO`          | Textarea/multi-line. Exige `size`                              |
| `DataType.INTEGER`             | `INTEIRO`              | —                                                              |
| `DataType.DECIMAL`             | `DECIMAL`              | Exige `nuCasasDecimais`                                        |
| `DataType.DATE`                | `DATA`                 | Sem hora                                                       |
| `DataType.DATE_TIME`           | `DATA_HORA`            | Data + hora                                                    |
| `DataType.TIME`                | `HORA`                 | Sem data                                                       |
| `DataType.CHECKBOX`            | `CHECKBOX`             | `S`/`N` no banco                                               |
| `DataType.LIST`                | `LISTA`                | Exige sub-tag `<fieldOptions>` com `<option value>label</option>` |
| `DataType.SEARCH`              | `PESQUISA`             | Exige `targetInstance`+`targetField`+`targetType`              |
| `DataType.HTML`                | `HTML`                 | Editor rich text                                               |
| `DataType.FILE`                | `ARQUIVO`              | Upload unico                                                   |
| `DataType.MULTIPLE_FILES`      | `MULTIPLOS_ARQUIVOS`   | Upload multiplo                                                |
| `DataType.IMAGE`               | `IMAGEM`               | Upload de imagem                                               |

---

## Limpeza da Entidade Java (pós-geracao)

Pos-gerar XML, **limpe entidade Java** removendo tudo que foi pro dicionario.

### O que REMOVER

| Anotacao / atributo                                      | Ação                                                      |
|:---------------------------------------------------------|:----------------------------------------------------------|
| `@Column(description, dataType, size, ...)`             | Manter **so** `@Column(name = "...")`                |
| `@JoinColumn(description, dataType, ...)`               | Manter **so** `name` e `referencedColumnName`        |
| `@JapeEntity(description, ...)` (atributos extras)      | Manter `entity`, `table` e — quando aplicavel — `isNativeTable` / `isNativeInstance`. Remover `description` e demais atributos. |
| `@Expression`                                            | Remover (vai pra `<expression>` no XML)    |
| `@GeneratedValue`                                        | Remover (vai pra `sequenceType` no XML)    |
| `@Option`                                                | Remover (vai pra `<fieldOptions>` no XML)  |
| `@Property`                                              | Remover                                     |
| Imports nao usados                                   | Remover (`DataType`, `Expression`, `GeneratedValue`, `Option`, `Property`, etc.) |

### Exemplo: antes e depois

**ANTES (metadata no Java):**

```java
@JapeEntity(entity = "TdcXyzProduto", table = "TDCXYZPRD", description = "Produtos")
public class TdcXyzProduto {

    @Id
    @GeneratedValue(strategy = GeneratedValue.GenerationType.AUTO)
    @Column(name = "CODPRODUTO", description = "Cod. Produto", dataType = DataType.INTEGER,
            order = 1, readOnly = true, allowSearch = true, visibleOnSearch = true)
    private Integer codProduto;

    @Column(name = "DESCR", description = "Nome Produto", dataType = DataType.TEXT,
            size = 200, isPresentation = true, readOnly = true, uiTabName = "__main", order = 3)
    private String nomeProduto;
}
```

**DEPOIS (limpo):**

```java
@JapeEntity(entity = "TdcXyzProduto", table = "TDCXYZPRD")
public class TdcXyzProduto {

    @Id
    @Column(name = "CODPRODUTO")
    private Integer codProduto;

    @Column(name = "DESCR")
    private String nomeProduto;
}
```

Toda metadata (description, dataType, order, readOnly, etc.) fica no `TDCXYZPRD.xml`.

---

Para o fluxo inverso (XML -> Java), consulte `references/xml-to-java.md`.
