# Chave Primária (PK) — Entity (Sankhya Addon Studio)

## PK Simples

Tabela com única coluna como PK:

```java

@Id
@Column(name = "CODENTIDADE")
private Integer codEntidade;
```

> PK sequencial: nao use coluna com prefixo `ID`. Use `COD*` (cadastros) ou `NU*` (movimentos/documentos).

> **PK e automatica por padrao.** A geracao fica no XML do dicionario (`sequenceType="A" sequenceField="<coluna>"`) — vale pra cadastro, configuracao, log, registro e tabela de apoio. Consequencia no codigo: **nao setar a PK** antes de `save` num insert (nem no service, nem no mapper) — o framework preenche. Ver skill `data-dictionary`, secao "Como determinar `sequenceType`", pras poucas excecoes de PK manual.

## PK Composta (`@Embeddable`)

Tabela com PK composta — crie classe separada anotada com `@Embeddable`.

**Classe `@Embeddable`:**

```java
import br.com.sankhya.studio.persistence.Column;
import br.com.sankhya.studio.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Embeddable
public class TdcXyzEntidadeId {

    @Column(name = "CODORIG")
    private Integer codOrig;

    @Column(name = "NUITEM")
    private Integer nuItem;
}
```

> **Não confundir com `<treeTable>`:** `CODORIG` é nome arbitrário de exemplo de PK composta entre tabelas distintas. Em `<treeTable>` (hierarquia recursiva pai/filho dentro da própria tabela), a coluna FK pro pai **é sempre `CODIGOPAI`** (nome fixo do framework, não renomeável). Ver skill `data-dictionary` → `tree-table.md`.

**Uso na entidade:**

```java

@Id
private TdcXyzEntidadeId embeddedId;
```

## Convenções da PK composta

| Regra          | Detalhe                                                             |
|:---------------|:--------------------------------------------------------------------|
| Nome da classe | `<NomeEntidade>Id` (ex: `TdcXyzProdutoId`)                             |
| Anotações      | `@Data`, `@AllArgsConstructor`, `@NoArgsConstructor`, `@Embeddable` |
| Campos         | Cada campo com `@Column(name = "...")` — somente `name`             |
| Na entidade    | Campo anotado apenas com `@Id` (sem `@Column`)                      |

## Métodos auxiliares na entidade (opcional)

Facilitar acesso aos campos da PK composta — crie métodos delegadores:

```java
public Integer getCodOrig() {
    return this.embeddedId.getCodOrig();
}

public Integer getNuItem() {
    return this.embeddedId.getNuItem();
}
```

