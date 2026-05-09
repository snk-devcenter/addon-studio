# Chave Primária (PK) — Entity (Sankhya Addon Studio)

## PK Simples

Tabela com única coluna como PK:

```java

@Id
@Column(name = "CODENTIDADE")
private Integer codEntidade;
```

> PK sequencial: nao use coluna com prefixo `ID`. Use `COD*` (cadastros) ou `NU*` (movimentos/documentos).

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

    @Column(name = "CODPAI")
    private Integer codPai;

    @Column(name = "NUITEM")
    private Integer nuItem;
}
```

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
public Integer getCodPai() {
    return this.embeddedId.getCodPai();
}

public Integer getNuItem() {
    return this.embeddedId.getNuItem();
}
```

