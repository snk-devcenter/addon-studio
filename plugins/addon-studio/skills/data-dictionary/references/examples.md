# Exemplos Completos — Data Dictionary (Sankhya Addon Studio)

## XML completos (1.12)

### Tabela com sequencia AUTO

```xml
<?xml version="1.0" encoding="ISO-8859-1" ?>
<metadados xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xsi:noNamespaceSchemaLocation="../.gradle/metadados.xsd">

    <table name="TDCXYZPRD" sequenceType="A" sequenceField="CODPRODUTO">
        <description>Produtos</description>
        <primaryKey>
            <field name="CODPRODUTO"/>
        </primaryKey>
        <instances>
            <instance name="TdcXyzProduto">
                <description>Produtos</description>
                <relationShip>
                    <relation entityName="TdcXyzVinculoProduto">
                        <fields>
                            <field localName="CODPRODUTO" targetName="CODPRODUTO"/>
                        </fields>
                    </relation>
                </relationShip>
            </instance>
        </instances>
        <fields>
            <field name="CODPRODUTO" dataType="INTEIRO" readOnly="S" order="1" allowSearch="S" visibleOnSearch="S">
                <description>Cod. Produto</description>
            </field>
            <field name="DESCR" dataType="TEXTO" size="200" isPresentation="S" readOnly="S"
                   allowSearch="S" visibleOnSearch="S" UITabName="__main" order="3">
                <description>Nome Produto</description>
            </field>
            <!-- ... demais campos ... -->
            <!-- Bloco de Auditoria + Bloco de Integracao (se aplicavel) -->
        </fields>
    </table>

</metadados>
```

### Tabela com sequencia MANUAL

```xml
<table name="TDCXYZCFG" sequenceType="M">
    <description>Configuracao</description>
    <primaryKey>
        <field name="CODCONF"/>
    </primaryKey>
    <instances>
        <instance name="TdcXyzConfiguracao">
            <description>Configuracao</description>
        </instance>
    </instances>
    <fields>
        <field name="CODCONF" dataType="INTEIRO" readOnly="S" order="1" allowSearch="N" visibleOnSearch="N">
            <description>Cod. Configuracao</description>
        </field>
        <!-- ... demais campos ... -->
    </fields>
</table>
```

### PK Composta (AUTO)

```xml
<table name="TDCXYZREL" sequenceType="A" sequenceField="NURELACAO">
    <primaryKey>
        <field name="CODPAI"/>
        <field name="NURELACAO"/>
    </primaryKey>
    <!-- ... -->
</table>
```

### PK Composta (MANUAL)

```xml
<table name="TDCXYZVIN" sequenceType="M">
    <primaryKey>
        <field name="CODPAI"/>
        <field name="CODPROD"/>
    </primaryKey>
    <!-- ... -->
</table>
```

### nativeTable + nativeInstance (entidade nativa Sankhya estendida)

```xml
<nativeTable name="TGFTOP">
    <instances>
        <nativeInstance name="TipoOperacao">
            <relationShip>
                <relation entityName="TdcXyzVinculoTop" insert="N" update="N" relation="OneToOne" removeCascade="N">
                    <fields>
                        <field localName="CODTIPOPER" targetName="CODTIPOPER"/>
                    </fields>
                </relation>
            </relationShip>
        </nativeInstance>
    </instances>
    <fields>
        <field name="XYZ_CAMPOCUSTOM" dataType="CHECKBOX" UITabName="XyzAddon" allowSearch="N" visibleOnSearch="N">
            <description>Campo Customizado</description>
        </field>
    </fields>
</nativeTable>
```

### nativeTable + instance nova (addon cria instancia logica sobre tabela nativa)

```xml
<nativeTable name="TGFDFAGR">
    <instances>
        <instance name="TdcXyzDefensivos">
            <description>Defensivos Agricolas</description>
        </instance>
    </instances>
    <fields>
        <field name="NUMRECEITAGRO" dataType="TEXTO" size="50" UITabName="__main" allowSearch="S" visibleOnSearch="S">
            <description>Num. Receituario</description>
        </field>
    </fields>
</nativeTable>
```

---

# PARTE 2 - GERANDO O DICIONARIO A PARTIR DE ENTIDADES JAVA

Entidades Java com `@JapeEntity` ja existem? Segue processo pra gerar XMLs.


---

## XML -> Java completo (3.9)

**XML (`TDCXYZCFG.xml`):**

```xml
<table name="TDCXYZCFG" sequenceType="M">
    <primaryKey>
        <field name="CODCONF"/>
    </primaryKey>
    <instances>
        <instance name="TdcXyzConfiguracao">
            <description>Configuracao</description>
        </instance>
    </instances>
    <fields>
        <field name="CODCONF" dataType="INTEIRO" readOnly="S" order="1" allowSearch="N" visibleOnSearch="N">
            <description>Cod. Configuracao</description>
        </field>
        <field name="ATIVO" dataType="CHECKBOX" UITabName="__main" order="2" ...>
            <description>Ativo</description>
        </field>
        <field name="TIPO" dataType="LISTA" size="10" UITabName="__main" order="2" ...>
            <description>Tipo</description>
            <fieldOptions>...</fieldOptions>
        </field>
        <field name="CLIENTID" dataType="TEXTO" size="100" order="4" ...>
            <description>Client ID</description>
        </field>
    </fields>
</table>
```

**Entidade Java gerada:**

```java
import br.com.sankhya.studio.persistence.Column;
import br.com.sankhya.studio.persistence.Id;
import br.com.sankhya.studio.persistence.JapeEntity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JapeEntity(
    entity = "TdcXyzConfiguracao",
    table = "TDCXYZCFG"
)
public class TdcXyzConfiguracao {

    @Id
    @Column(name = "CODCONF")
    private BigDecimal codConfiguracao;

    @Column(name = "ATIVO")
    private Boolean ativo;

    @Column(name = "TIPO")
    private TipoEnum tipo;

    @Column(name = "CLIENTID")
    private String clientId;
}
```

---

# PARTE 4 - CHECKLISTS E ERROS COMUNS

