---
name: merge-on-root
description: Estende uma entidade com campos novos sem criar coluna na tabela dela — tabela de extensão com a mesma PK, ligada por `@OneToOne` com `@ref-param[merge-on-root=true]`, que a plataforma funde na tela e no registro da entidade raiz. É o caminho oficial para guardar informação nova em entidade nativa do Sankhya (Parceiro, Produto, Nota, TOP...). Use quando o dev pedir campo novo, coluna nova ou "guardar mais um dado" num cadastro ou documento nativo — "preciso de um campo a mais na tela de Parceiros", "adicionar uma flag no produto", "gravar X junto da nota" —, ao estender tabela do próprio addon sem mexer nela, ou ao revisar `<nativeTable>` com `<fields>`, `ALTER TABLE` em tabela nativa (`TGF*`, `TSI*`, `TCS*`) ou instância nova sobre tabela nativa. A resposta nunca é `ALTER TABLE` na tabela nativa nem `<field>` dentro de `<nativeTable>`: o campo vai para a tabela de extensão. A tabela de extensão inteira (dbscript, XML e Java) é desta skill. NÃO usar para tabela nova do addon sem relação com entidade existente — isso é a skill `data-dictionary` (ou o sub-agent `entity-architect`, quando XML, dbscript e entidade nascem juntos); nem para relacionamento 1:N (aba separada), que é `<relation relation="OneToMany">` da `data-dictionary`.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Merge-on-root — estender entidade sem adicionar campo nela

O merge-on-root estende uma entidade com os campos de outra tabela sem criar coluna na tabela estendida. Os campos vivem numa **tabela de extensão** com a **mesma PK** da entidade raiz, ligada a ela por um relacionamento 1:1 com `@ref-param[merge-on-root=true]`. A plataforma funde as duas: na tela e no registro, para o usuário, é uma entidade só.

Funciona para entidade do addon e para entidade nativa. Para entidade nativa é o **único** caminho: não adicione campo em tabela nativa, nem por `ALTER TABLE` em `dbscripts/`, nem por `<field>` dentro de `<nativeTable>` (o `metadados.xsd` marca esse `<fields>` como deprecated). Tabela nativa tem volume e carga altíssimos — a migração em horário de pico pode derrubar o SankhyaOM do cliente —, a coluna pode sumir numa atualização da plataforma e a alteração invalida o suporte.

Projeto que já tem coluna própria em tabela nativa: não acrescente outras. Campo novo vai para a extensão.

---

## 1. As peças

| Peça | Artefato | Skill de detalhe |
|:--|:--|:--|
| Tabela de extensão | `dbscripts/V<NNN>-CREATE_TABLE_<TABELA>.xml` | `database` |
| Dicionário da extensão | `datadictionary/<TABELA>.xml` com `<table>` + `<instance>` | `data-dictionary` |
| Relação de merge na raiz | `datadictionary/<TABELA_RAIZ>.xml` com `<relation>` 1:1 | `data-dictionary` |
| Entidade Java da extensão | `@JapeEntity` só com mapeamento estrutural | `entity` |
| Entidade Java da raiz | Só se o código lê/grava a raiz via repository | `entity`, `repository` |

O exemplo abaixo estende `Parceiro` (`TGFPAR`) com dois campos de integração. `<PRX>`/`<MOD3>` seguem a convenção do projeto (skill `database`, "Descobrir convenção do projeto"); aqui o literal `PRX` + `XYZ`.

---

## 2. Tabela de extensão — dbscript

PK **idêntica** à da raiz (mesmas colunas e tipos), sem FK declarada no DDL. CREATE mínimo + um `ALTER` por coluna + CHECK do `CHECKBOX`, como em qualquer tabela do addon:

```xml
<sql nomeTabela="PRXXYZIPA" ordem="1" executar="SE_NAO_EXISTIR"
     tipoObjeto="TABLE" nomeObjeto="PRXXYZIPA"
     descricao="Criacao da tabela de extensao PRXXYZIPA (Parceiro)">
    <mssql>
        CREATE TABLE PRXXYZIPA (
        CODPARC INT NOT NULL,
        CONSTRAINT PK_PRXXYZIPA PRIMARY KEY (CODPARC)
        )
    </mssql>
    <oracle>
        CREATE TABLE PRXXYZIPA (
        CODPARC NUMBER(10) NOT NULL,
        CONSTRAINT PK_PRXXYZIPA PRIMARY KEY (CODPARC)
        )
    </oracle>
</sql>

<sql nomeTabela="PRXXYZIPA" ordem="2" executar="SE_NAO_EXISTIR"
     tipoObjeto="COLUMN" nomeObjeto="INTEGRACAOATIVA"
     descricao="Adicionar campo INTEGRACAOATIVA na tabela PRXXYZIPA">
    <mssql>
        ALTER TABLE PRXXYZIPA ADD INTEGRACAOATIVA CHAR(1)
    </mssql>
    <oracle>
        ALTER TABLE PRXXYZIPA ADD (INTEGRACAOATIVA VARCHAR2(1))
    </oracle>
</sql>

<sql nomeTabela="PRXXYZIPA" ordem="3" executar="SE_NAO_EXISTIR"
     tipoObjeto="CONSTRAINT" nomeObjeto="CK_PRXXYZIPA_INTEGRACAOATIVA"
     descricao="Restringir o campo INTEGRACAOATIVA aos valores S e N">
    <mssql>
        ALTER TABLE PRXXYZIPA ADD CONSTRAINT CK_PRXXYZIPA_INTEGRACAOATIVA CHECK (INTEGRACAOATIVA IN ('S', 'N'))
    </mssql>
    <oracle>
        ALTER TABLE PRXXYZIPA ADD CONSTRAINT CK_PRXXYZIPA_INTEGRACAOATIVA CHECK (INTEGRACAOATIVA IN ('S', 'N'))
    </oracle>
</sql>

<sql nomeTabela="PRXXYZIPA" ordem="4" executar="SE_NAO_EXISTIR"
     tipoObjeto="COLUMN" nomeObjeto="DHULTIMPORT"
     descricao="Adicionar campo DHULTIMPORT na tabela PRXXYZIPA">
    <mssql>
        ALTER TABLE PRXXYZIPA ADD DHULTIMPORT DATETIME
    </mssql>
    <oracle>
        ALTER TABLE PRXXYZIPA ADD (DHULTIMPORT DATE)
    </oracle>
</sql>
```

---

## 3. Dicionário da extensão

`<table>` comum com `sequenceType="M"`: a PK espelha a chave do registro raiz, o valor já existe e vem dele (caso legítimo de `"M"` na `data-dictionary`, seção 1.4). `UITabName` define a aba em que os campos aparecem dentro da tela da raiz.

```xml
<table name="PRXXYZIPA" sequenceType="M">
    <description>Integracao de Pedidos por Parceiro</description>
    <primaryKey>
        <field name="CODPARC"/>
    </primaryKey>
    <instances>
        <instance name="PrxXyzIntegracaoParceiro">
            <description>Integracao de Pedidos por Parceiro</description>
        </instance>
    </instances>
    <fields>
        <field name="CODPARC" dataType="INTEIRO" allowSearch="N" visibleOnSearch="N">
            <description>Codigo do Parceiro</description>
        </field>
        <field name="INTEGRACAOATIVA" dataType="CHECKBOX" UITabName="Integracao" order="1"
               allowSearch="N" visibleOnSearch="N">
            <description>Integracao Ativa</description>
        </field>
        <field name="DHULTIMPORT" dataType="DATA_HORA" UITabName="Integracao" order="2" readOnly="S"
               allowSearch="N" visibleOnSearch="N">
            <description>Ultima Importacao</description>
        </field>
    </fields>
</table>
```

---

## 4. Relação de merge na raiz

Na raiz nativa: `<nativeTable>` + `<nativeInstance>` com **só** o `<relationShip>` — sem `<fields>` (seria coluna na tabela nativa). Raiz do addon: a mesma `<relation>` dentro do `<instance>` da tabela dela.

```xml
<nativeTable name="TGFPAR">
    <instances>
        <nativeInstance name="Parceiro">
            <relationShip>
                <relation entityName="PrxXyzIntegracaoParceiro" relation="OneToOne" insert="S" update="S">
                    <expression><![CDATA[@ref-param[merge-on-root=true]]]></expression>
                    <fields>
                        <field localName="CODPARC" targetName="CODPARC"/>
                    </fields>
                </relation>
            </relationShip>
        </nativeInstance>
    </instances>
</nativeTable>
```

- `relation="OneToOne"` — só 1:1 se funde. `OneToMany` aparece como aba separada, não como campos da raiz.
- `insert="S"` / `update="S"` — a plataforma inclui e atualiza a linha da extensão junto com a raiz. Sem eles, a tela mostra os campos mas não grava.
- Sem `removeCascade` (é de `OneToMany`).

---

## 5. Entidades Java

Extensão: mapeamento estrutural, como toda entidade (metadado de UI fica no XML — skill `entity`).

```java
import br.com.sankhya.studio.persistence.Column;
import br.com.sankhya.studio.persistence.Id;
import br.com.sankhya.studio.persistence.JapeEntity;
import java.math.BigDecimal;
import java.sql.Timestamp;
import lombok.Data;
import lombok.NoArgsConstructor;

@JapeEntity(entity = "PrxXyzIntegracaoParceiro", table = "PRXXYZIPA")
@Data
@NoArgsConstructor
public class PrxXyzIntegracaoParceiro {

    @Id
    @Column(name = "CODPARC")
    private BigDecimal codigoParceiro;

    @Column(name = "INTEGRACAOATIVA")
    private Boolean integracaoAtiva;

    @Column(name = "DHULTIMPORT")
    private Timestamp dataUltimaImportacao;
}
```

Raiz: **só** se o código do addon lê ou grava a raiz via repository e precisa navegar até a extensão. Para a tela, o XML basta. O `cascade` vale no `save` do repository: com `CREATE`, `UPDATE` e `MERGE`, gravar a raiz grava a extensão.

```java
import br.com.sankhya.studio.persistence.Cascade;
import br.com.sankhya.studio.persistence.Column;
import br.com.sankhya.studio.persistence.Id;
import br.com.sankhya.studio.persistence.JapeEntity;
import br.com.sankhya.studio.persistence.JoinColumn;
import br.com.sankhya.studio.persistence.OneToOne;
import java.math.BigDecimal;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@JapeEntity(entity = "Parceiro", table = "TGFPAR", isNativeTable = true, isNativeInstance = true)
@Data
@NoArgsConstructor
public class Parceiro {

    @Id
    @Column(name = "CODPARC")
    private BigDecimal codigo;

    @Column(name = "NOMEPARC")
    private String nome;

    @OneToOne(cascade = { Cascade.CREATE, Cascade.UPDATE, Cascade.MERGE })
    @JoinColumn(name = "CODPARC", referencedColumnName = "CODPARC")
    @ToString.Exclude
    private PrxXyzIntegracaoParceiro integracao;
}
```

O `@ref-param[merge-on-root=true]` fica no `<expression>` do XML, não em `@Expression` no Java. Com o dicionário automático desligado (padrão do projeto: `persistence.auto-dd` falso no `application.yaml`), a raiz nativa não precisa de `@IgnoreAutoDD` — o Java não gera dicionário.

---

## 6. Cuidados

- **Mesma PK.** A PK da extensão é a PK da raiz — as mesmas colunas, com os mesmos tipos (se composta, todas). É o que torna o 1:1 possível.
- **Sem `Cascade.DELETE` nem `Cascade.ALL`.** Com `DELETE` a relação passa a ser obrigatória, e uma 1:1 obrigatória não aparece na tela enquanto o registro raiz ainda não tem linha na extensão — todo registro antigo fica sem os campos.
- **Só 1:1.** Precisa de N valores por registro raiz? É tabela filha com `OneToMany` (aba separada), não merge-on-root.
- **Registro antigo sem linha na extensão** é o estado normal: a linha nasce quando o registro raiz é gravado (`insert="S"`).

---

## 7. Anti-Patterns (PROIBIDO)

| Anti-Pattern | Correção |
|:--|:--|
| `ALTER TABLE TGFPAR ADD <coluna>` (ou qualquer tabela nativa) | Coluna na tabela de extensão |
| `<field>` dentro de `<nativeTable><fields>` | Campo no `<table>` da extensão; `<nativeTable>` só com `<nativeInstance>` + `<relationShip>` |
| `<instance>` nova do addon sobre tabela nativa | Tabela de extensão com instância própria + merge-on-root |
| PK da extensão diferente da PK da raiz (sequência própria, `sequenceType="A"`) | Mesma PK, `sequenceType="M"` |
| `relation="OneToMany"` com `merge-on-root` | Merge só funde 1:1 |
| `<relation>` de merge sem `insert="S"`/`update="S"` | Informar os dois — senão a tela não grava a extensão |
| `Cascade.ALL` / `Cascade.DELETE` no `@OneToOne` da raiz | `{ Cascade.CREATE, Cascade.UPDATE, Cascade.MERGE }` |
| `@Expression("@ref-param[merge-on-root=true]")` no Java | `<expression>` da `<relation>` no XML |

---

## 8. Checklist

1. [ ] Confirmar que a entidade raiz é a certa e que o dado é 1:1 com ela.
2. [ ] Descobrir `<PRX>`/`<MOD3>` do projeto e nomear a tabela de extensão.
3. [ ] dbscript: CREATE com a PK idêntica à da raiz + `ALTER` por coluna + CHECK de `CHECKBOX`/`LISTA`.
4. [ ] `datadictionary/<TABELA>.xml` da extensão: `<table sequenceType="M">`, `<instance>`, campos com `UITabName`.
5. [ ] `datadictionary/<TABELA_RAIZ>.xml`: `<relation relation="OneToOne" insert="S" update="S">` com `@ref-param[merge-on-root=true]`; raiz nativa sem `<fields>`.
6. [ ] Entidade Java da extensão (só `@Column(name)`).
7. [ ] Entidade Java da raiz só se o código navega até a extensão — `cascade` sem `DELETE`/`ALL`.
8. [ ] Encoding ISO-8859-1 nos `.xml`/`.java` (skill `encoding`).

---

## Skills relacionadas

- `database` — padrões de dbscript da tabela de extensão
- `data-dictionary` — `<table>`, `<relation>` e opções de `@ref-param`
- `entity` — mapeamento Java e flags de entidade nativa
- `repository` — leitura/gravação da raiz com a extensão
