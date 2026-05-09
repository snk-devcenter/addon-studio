# Passo a Passo: Criando Entidade do Zero — Entity

## Cenário: Criar uma nova entidade `TdcXyzFornecedor`

Tabela `TDCXYZFOR`, PK simples `CODFORN` (auto), campos `NOME`, `CNPJ`, `ATIVO`, com vinculo para `Parceiro`.

---

## Passo 1 — Criar o XML do dicionário de dados

Arquivo `datadictionary/TDCXYZFOR.xml`:

```xml
<?xml version="1.0" encoding="ISO-8859-1" ?>
<metadados xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xsi:noNamespaceSchemaLocation="../.gradle/metadados.xsd">

    <table name="TDCXYZFOR" sequenceType="A" sequenceField="CODFORN">
        <description>Fornecedores</description>
        <primaryKey>
            <field name="CODFORN"/>
        </primaryKey>
        <instances>
            <instance name="TdcXyzFornecedor">
                <description>Fornecedores</description>
            </instance>
        </instances>
        <fields>
            <field name="CODFORN" dataType="INTEIRO" readOnly="S" order="1" allowSearch="S" visibleOnSearch="S">
                <description>Codigo Fornecedor</description>
            </field>
            <field name="NOME" dataType="TEXTO" size="200" isPresentation="S" required="S"
                   allowSearch="S" visibleOnSearch="S" UITabName="__main" order="2">
                <description>Nome</description>
            </field>
            <field name="CNPJ" dataType="TEXTO" size="20" allowSearch="S" visibleOnSearch="S"
                   UITabName="__main" order="3">
                <description>CNPJ</description>
            </field>
            <field name="CODPARC" dataType="PESQUISA" targetInstance="Parceiro" targetField="CODPARC"
                   targetType="INTEIRO" allowSearch="S" visibleOnSearch="S" UITabName="__main" order="4">
                <description>Cod. Parceiro</description>
            </field>
            <field name="ATIVO" dataType="CHECKBOX" UITabName="__main" order="99" allowSearch="N" visibleOnSearch="N">
                <description>Ativo</description>
                <expression><![CDATA[if ($col_ATIVO == null) { return "S"; } else { return $col_ATIVO; }]]></expression>
            </field>
        </fields>
    </table>

</metadados>
```

---

## Passo 2 — Criar a entidade Java

Arquivo `TdcXyzFornecedor.java`:

```java
import br.com.sankhya.studio.persistence.Column;
import br.com.sankhya.studio.persistence.Id;
import br.com.sankhya.studio.persistence.JapeEntity;
import br.com.sankhya.studio.persistence.JoinColumn;
import br.com.sankhya.studio.persistence.OneToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JapeEntity(
    entity = "TdcXyzFornecedor",
    table = "TDCXYZFOR"
)
public class TdcXyzFornecedor {

    @Id
    @Column(name = "CODFORN")
    private Integer codFornecedor;

    @Column(name = "NOME")
    private String nome;

    @Column(name = "CNPJ")
    private String cnpj;

    @Column(name = "CODPARC")
    private BigDecimal codParceiro;

    @Column(name = "ATIVO")
    private Boolean ativo;

    // Navegação para Parceiro (somente se o domínio precisar acessar campos do Parceiro)
    @OneToOne
    @JoinColumn(name = "CODPARC", referencedColumnName = "CODPARC")
    private Parceiro parceiro;
}
```

---

## Passo 3 — (Se PK composta) Criar a classe `@Embeddable`

Entidade com PK composta — criaria em `TdcXyzFornecedorId.java`.

---

## Passo 4 — (Se enum) Criar enum

Entidade usa novo enum — crie classe Java conforme secao 9.

---

## Passo 5 — Validar

- Entidade tem `@Data`, `@NoArgsConstructor`, `@AllArgsConstructor`?
- `@JapeEntity` tem só `entity` e `table`?
- Todos `@Column` têm só `name`?
- Todos `@JoinColumn` têm só `name` e `referencedColumnName`?
- Sem `@Expression`, `@GeneratedValue`, `@Option`, `@Property`?
- XML em `datadictionary/` criado?
- XML declara `allowSearch` e `visibleOnSearch` em todos campos?

