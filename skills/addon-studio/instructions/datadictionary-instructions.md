---
applyTo: "datadictionary/**/*.xml"
---

# Dicionario de Dados (Data Dictionary) - Addon Studio 2.0

**Dicionario de Dados** define estrutura dados aplicacao — tabelas, campos, instancias, extensoes entidades nativas — declarativo via XML em `datadictionary/`.

Entidade Java (`@JapeEntity`) = classe dominio **limpa** — so `@Column(name = "...")`, `@JoinColumn(name, referencedColumnName)`, anotacoes relacionamento (`@OneToMany`, `@OneToOne`, `@ManyToOne`). **Toda metadata UI, tipos, descricoes, comportamento** vive so nos XMLs.

> **Regra fundamental:** `@Column` so atributo `name`. `@JoinColumn` so `name` e `referencedColumnName`. Nao use `@Expression`, `@GeneratedValue`, `@Option`, `@Property` nem outro atributo extra. Tudo no XML.

---

# PARTE 1 - CRIANDO O DICIONARIO DE DADOS

---

## 1.1 Estrutura de Arquivos

**Um XML por tabela/entidade** em `datadictionary/`.

**Convencao:** nome arquivo = nome tabela. Ex: `TDCXYZCAD.xml` pra tabela `TDCXYZCAD`.

---

## 1.2 Esqueleto XML Base

```xml
<?xml version="1.0" encoding="ISO-8859-1" ?>
<metadados xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xsi:noNamespaceSchemaLocation="../.gradle/metadados.xsd">

    <!-- <table> ou <nativeTable> aqui -->

</metadados>
```

---

## 1.3 Tags Raiz

| Tag XML           | Quando usar                                                              |
|:------------------|:-------------------------------------------------------------------------|
| `<table />`       | Tabela **nova** criada pelo add-on.                                      |
| `<nativeTable />` | Extensao tabela **nativa** Sankhya Om (adiciona campos/instancia). |

---

## 1.4 Tag `<table>` - Tabela nova

### Atributos obrigatorios

| Atributo        | Descricao                                                                                                       |
|:----------------|:----------------------------------------------------------------------------------------------------------------|
| `name`          | Nome tabela no banco.                                                                               |
| `sequenceType`  | `"A"` (automatico) ou `"M"` (manual).                                                                           |
| `sequenceField` | Coluna PK que recebe sequencia. **Obrigatorio com `sequenceType="A"`; omitir com `sequenceType="M"`.** |

### Como determinar `sequenceType`

| Caso                                    | XML                                         |
|:-----------------------------------------|:--------------------------------------------|
| PK simples geracao automatica        | `sequenceType="A" sequenceField="<coluna>"` |
| PK simples geracao manual            | `sequenceType="M"` (sem `sequenceField`)    |
| PK composta - algum campo auto       | `sequenceType="A" sequenceField="<coluna>"` |
| PK composta - todos manuais              | `sequenceType="M"` (sem `sequenceField`)    |

**Exemplos XML:**

```xml
<!-- AUTO -->
<table name="TDCXYZPRD" sequenceType="A" sequenceField="CODPRODUTO">

<!-- MANUAL -->
<table name="TDCXYZCFG" sequenceType="M">
```

> **Padrao PK sequencial:** nao usar prefixo `ID` na coluna sequencia.
> Use `COD*` pra cadastros (ex.: `CODPRODUTO`), `NU*` pra movimentos/documentos (ex.: `NUNOTA`).

---

## 1.5 Chave Primaria (`<primaryKey>`)

Lista campos PK. PK simples = 1 `<field>`; PK composta = varios `<field>`.

```xml
<!-- PK simples -->
<primaryKey>
    <field name="CODPRODUTO"/>
</primaryKey>

<!-- PK composta -->
<primaryKey>
    <field name="CODPRODUTO"/>
    <field name="NUITEM"/>
</primaryKey>
```

---

## 1.6 Instancias (`<instances>`)

Define entidade (instancia JAPE) da tabela. Existem duas tags possiveis dentro de `<instances>`:

| Tag                    | Quando usar                                                                                  |
|:-----------------------|:---------------------------------------------------------------------------------------------|
| `<instance>`           | Instancia **nova**, criada pelo addon. Permitida em `<table>` e em `<nativeTable>`.          |
| `<nativeInstance>`     | Instancia **nativa do Sankhya** (ex.: `CabecalhoNota`, `Parceiro`, `Produto`). **Somente** dentro de `<nativeTable>`. |

```xml
<!-- Instancia nova do addon -->
<instances>
    <instance name="TdcXyzProduto">
        <description>Produtos</description>
    </instance>
</instances>
```

```xml
<!-- Instancia nativa Sankhya (so dentro de <nativeTable>) -->
<instances>
    <nativeInstance name="CabecalhoNota">
        <relationShip>
            <!-- relacoes opcionais com entidades do addon -->
        </relationShip>
    </nativeInstance>
</instances>
```

`name` = nome logico da entidade (bate com `@JapeEntity(entity = "...")`).

> **Por que `<nativeInstance>` ao inves de `<instance>`:** ambas as tags geram a mesma entidade no runtime, mas `<nativeInstance>` sinaliza para o builder que a instancia **ja existe** no Sankhya nativo e **nao** deve ser regravada no `metadata.xml` final. Se uma instancia nativa for declarada como `<instance>`, o deploy do addon re-mapeia o owner da instancia para o addon e quebra regras de negocio, validacoes e telas nativas que dependem dela. Pareie sempre com `isNativeInstance = true` no `@JapeEntity` correspondente (ver `entity-instructions.md` secao 1.2).

### Convencao de nomes — setor DevCenter

Convencao do setor para nomes de tabelas e instancias:

| Atributo                                | Padrao                                | Exemplo               |
|:----------------------------------------|:--------------------------------------|:----------------------|
| `<table name="...">`                    | `TDC<MODULO3><CONTEXTO>` (UPPER)      | `TDCXYZCAB`           |
| `<instance name="...">` (em `<table>`)  | `Tdc<Modulo><Contexto>` (PascalCase)  | `TdcXyzCabecalho`     |
| `<instance name="...">` (em `<nativeTable>`, instancia nova) | `Tdc<Modulo><Contexto>` (PascalCase) | `TdcXyzDefensivos` |
| `<nativeInstance name="...">` (em `<nativeTable>`) | Nome **exato** da instancia nativa Sankhya | `CabecalhoNota`, `Parceiro`, `ItemNota` |

Componentes do prefixo addon:

- `Tdc` / `TDC`: prefixo fixo (Tabela DevCenter)
- `<Modulo>` / `<MODULO3>`: sigla modulo, **3 caracteres** (ex.: `Xyz`/`XYZ`, `Fin`/`FIN`)
- `<Contexto>` / `<CONTEXTO>`: contexto/entidade (ex.: `Cabecalho`/`CAB`, `Item`/`ITE`)

> Prefixo `Tdc<Modulo>` no `<instance>` evita colisao com outros contextos do ERP. Bate com `@JapeEntity(entity = "...")` correspondente. `<nativeInstance>` **nunca** leva prefixo addon — o nome tem que ser identico ao da instancia nativa Sankhya.

---

## 1.7 Relacionamentos (`<relationShip>`) - OneToMany

Entidade com filhos (`@OneToMany`) declara `<relationShip>` dentro `<instance>`.

| Atributo XML  | Significado                              |
|:--------------|:-----------------------------------------|
| `entityName`  | Nome entidade filha                   |
| `localName`   | Campo tabela pai (origem)    |
| `targetName`  | Campo tabela filha (destino) |

```xml
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
```

---

## 1.8 Campos (`<fields>` e `<field>`)

Cada `<field>` = coluna + metadata.

### Atributos do `<field>`

| Atributo XML      | Tipo   | Obrigatorio | Default | Descricao                                                    |
|:------------------|:-------|:------------|:--------|:-------------------------------------------------------------|
| `name`            | String | Sim         | -       | Nome coluna no banco.                                     |
| `dataType`        | String | Sim         | -       | Tipo dado (ver tabela abaixo).                           |
| `size`            | int    | Nao         | -       | Tamanho (TEXTO).                                        |
| `nuCasasDecimais` | int    | Nao         | -       | Casas decimais (DECIMAL).                               |
| `required`        | String | Nao         | `"N"`   | Obrigatorio: `"S"` ou `"N"`.                                 |
| `readOnly`        | String | Nao         | `"N"`   | Somente leitura: `"S"` ou `"N"`.                             |
| `allowSearch`     | String | Sim         | `"N"`   | Permite pesquisa: `"S"` ou `"N"`. **Sempre informar.**       |
| `visibleOnSearch` | String | Sim         | `"N"`   | Visivel na pesquisa: `"S"` ou `"N"`. **Sempre informar.**    |
| `isPresentation`  | String | Nao         | `"N"`   | Campo apresentacao entidade.                           |
| `visible`         | String | Nao         | `"S"`   | Visivel UI (`"N"` oculta).                          |
| `calculated`      | String | Nao         | `"N"`   | Calculado, nao persistido.                             |
| `order`           | int    | Nao         | -       | Ordem exibicao tela.                                   |
| `UITabName`       | String | Nao         | -       | Aba UI. `"__main"` = aba principal.                       |
| `UIGroupName`     | String | Nao         | -       | Agrupamento na aba.                                   |
| `targetInstance`  | String | Condicional | -       | (PESQUISA) Entidade referenciada.                            |
| `targetField`     | String | Condicional | -       | (PESQUISA) Campo na entidade referenciada.                   |
| `targetType`      | String | Condicional | -       | (PESQUISA) Tipo do campo referenciado.                       |

> \* Obrigatorios com `dataType="PESQUISA"`.

> **Case:** `UITabName` (nao `uiTabName`), `UIGroupName` (nao `uiGroupName`), `nuCasasDecimais` (nao `precision`).

### Tipos de dados

| Tipo XML    | Uso                             |
|:------------|:--------------------------------|
| `INTEIRO`   | Inteiros                |
| `TEXTO`     | Textos, listas opcoes       |
| `DECIMAL`   | Decimais                |
| `DATA_HORA` | Data/hora                     |
| `CHECKBOX`  | Booleano (S/N)                  |
| `PESQUISA`  | Lookup / FK outra entidade |

### Sub-tag `<description>` (obrigatoria)

Todo `<field>` tem `<description>` **preenchida** com texto descritivo (nao vazia, sem so espacos). **Sem acentos** (ISO-8859-1).

```xml
<field name="CODPARC" dataType="PESQUISA" ...>
    <description>Cod. Parceiro</description>
</field>
```

### Sub-tag `<expression>` (opcional)

Expressoes calculadas. CDATA pra BeanShell.

```xml
<field name="ATIVO" dataType="CHECKBOX" UITabName="__main" order="99" allowSearch="N" visibleOnSearch="N">
    <description>Ativo</description>
    <expression><![CDATA[if ($col_ATIVO == null) { return "S"; } else { return $col_ATIVO; }]]></expression>
</field>
```

**Variaveis de contexto BeanShell (em `<expression>` BeanShell):**

| Expressao             | Uso                          |
|:----------------------|:-----------------------------|
| `$ctx_usuario_logado` | Codigo usuario logado     |
| `$ctx_dh_atual`       | Data/hora atual servidor  |
| `$col_<COLUNA>`       | Valor atual coluna        |

> Quando `<expression>` contiver **SQL** (nao BeanShell), use as **macros SQL Sankhya** (`dbDate()`, `nullValue()`, `truncMonth()`, etc.) para portabilidade Oracle/MSSQL. Ver `macros-instructions.md`.

### Sub-tag `<fieldOptions>` (opcional)

Opcoes pra campo lista (dropdown). Cada `<option>` tem `value` (armazenado) e texto (label).

```xml
<field name="TIPO" dataType="LISTA" size="10" UITabName="__main" order="3" allowSearch="N" visibleOnSearch="N">
    <description>Tipo</description>
    <fieldOptions>
        <option value="A">Opcao A</option>
        <option value="B">Opcao B</option>
        <option value="C">Opcao C</option>
    </fieldOptions>
</field>
```

> `dataType` = `"LISTA"`. Diferenca texto vs lista = presenca `<fieldOptions>`.
>
> **Regra:** `<fieldOptions>` **so** em `LISTA`. `CHECKBOX` **nao** leva `<fieldOptions>`.

---

## 1.9 Campo PESQUISA (Lookup / FK)

Campos que referenciam outra entidade: `dataType="PESQUISA"` + `targetInstance`, `targetField`, `targetType`.

```xml
<field name="CODPARC" dataType="PESQUISA" targetInstance="Parceiro" targetField="CODPARC" targetType="INTEIRO"
       allowSearch="S" visibleOnSearch="S" UITabName="__main" order="2">
    <description>Cod. Parceiro</description>
</field>
```

---

## 1.10 Extensao de Tabela Nativa (`<nativeTable>`)

Estende tabelas Sankhya Om. **Sem** `<primaryKey>` nem `sequenceType`.

- Declare **todos campos usados pela entidade** (nativos + custom).
- Prefixo exclusivo add-on (ex: `XYZ_`) nos custom pra evitar conflito.

Dentro de `<nativeTable>` ha **dois cenarios** para a tag de instancia, conforme a entidade alvo seja nativa ou nova (ver tabela completa em 1.6):

### Cenario A — Instancia **nativa** Sankhya: `<nativeInstance>`

Use quando a entidade ja existe no Sankhya nativo (`CabecalhoNota`, `Parceiro`, `ItemNota`, `TipoOperacao`, `Produto`, etc.). Combine sempre com `isNativeTable = true` **e** `isNativeInstance = true` no `@JapeEntity`.

```xml
<nativeTable name="TGFTOP">
    <instances>
        <nativeInstance name="TipoOperacao">
            <relationShip>
                <relation entityName="TdcXyzVinculo" insert="N" update="N" relation="OneToOne" removeCascade="N">
                    <fields>
                        <field localName="CODTIPOPER" targetName="CODTIPOPER"/>
                    </fields>
                </relation>
            </relationShip>
        </nativeInstance>
    </instances>
    <fields>
        <field name="XYZ_HABILITADO" dataType="CHECKBOX" UITabName="XyzAddon" allowSearch="N" visibleOnSearch="N">
            <description>Habilitado</description>
        </field>
    </fields>
</nativeTable>
```

> `<nativeInstance>` aceita apenas `<relationShip>` opcional — sem `<description>`, sem campos adicionais. Os campos vao no `<fields>` da `<nativeTable>`.

### Cenario B — Instancia **nova** do addon em tabela nativa: `<instance>`

Use quando o addon cria uma instancia logica nova sobre uma tabela nativa (ex.: `DefensivosAgricolas` sobre `TGFDFAGR`). Combine com `isNativeTable = true` no `@JapeEntity`, **sem** `isNativeInstance`.

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

## 1.11 Blocos de Campos Reutilizaveis

Blocos comuns copiaveis em varias entidades.

### Bloco de Auditoria

Campos padrao auditoria (usuario + data criacao/alteracao). Use pra rastrear alteracoes:

```xml
<field name="ATIVO" dataType="CHECKBOX" UITabName="__main" order="99" allowSearch="N" visibleOnSearch="N">
    <description>Ativo</description>
    <expression><![CDATA[if ($col_ATIVO == null) { return "S"; } else { return $col_ATIVO; }]]></expression>
</field>
<field name="CODUSU" dataType="PESQUISA" targetInstance="Usuario" targetField="CODUSU" targetType="INTEIRO"
       readOnly="S" UITabName="Outras Informacoes" order="99" allowSearch="N" visibleOnSearch="N">
    <description>Cod. Usuario</description>
    <expression><![CDATA[return $ctx_usuario_logado;]]></expression>
</field>
<field name="DHALTER" dataType="DATA_HORA" readOnly="S" UITabName="Outras Informacoes" order="99"
       allowSearch="N" visibleOnSearch="N">
    <description>Data/Hora Alteracao</description>
    <expression><![CDATA[return $ctx_dh_atual;]]></expression>
</field>
<field name="DHCREATE" dataType="DATA_HORA" readOnly="S" UITabName="Outras Informacoes" order="99"
       allowSearch="N" visibleOnSearch="N">
    <description>Data/Hora Criacao</description>
    <expression><![CDATA[if ($col_DHCREATE == null) { return $ctx_dh_atual; } else { return $col_DHCREATE; }]]></expression>
</field>
```

### Bloco de Integracao com Plataforma Externa

Campos pra entidades com correspondencia em sistemas externos. Inclui ID origem (retornado pela plataforma pos-sync) + campo indicando qual plataforma gerou registro. **Inclua bloco Auditoria** junto:

```xml
<field name="IDORIGEM" dataType="TEXTO" size="100" readOnly="S" order="2" allowSearch="N" visibleOnSearch="N">
    <description>Id Origem</description>
</field>
<field name="PLATAFORMA" dataType="LISTA" size="10" readOnly="S" UITabName="__main" order="3"
       allowSearch="N" visibleOnSearch="N">
    <description>Plataforma</description>
    <fieldOptions>
        <option value="A">Plataforma A</option>
        <option value="B">Plataforma B</option>
    </fieldOptions>
</field>
<!-- + bloco de Auditoria completo acima -->
```

---

## 1.12 Exemplos Completos

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

## 2.1 Fluxo de Geracao

```
Entidade Java (@JapeEntity) -> XML do Dicionario -> Limpar entidade Java
```

1. **Ler** entidade + dependencias (`@Embeddable`, relacionamentos).
2. **Gerar** XML conforme Parte 1.
3. **Limpar** entidade removendo atributos extras (secao 2.5).

---

## 2.2 Mapeamento `@JapeEntity` -> Tag raiz e tag de instancia

| `isNativeTable` | `isNativeInstance` | Tag raiz        | Tag de instancia      |
|:----------------|:-------------------|:----------------|:----------------------|
| omitido         | omitido            | `<table>`       | `<instance>`          |
| `true`          | omitido            | `<nativeTable>` | `<instance>`          |
| `true`          | `true`             | `<nativeTable>` | `<nativeInstance>`    |

Atributo `name` da tag raiz vem de `@JapeEntity(table = "...")`. Atributo `name` da tag de instancia vem de `@JapeEntity(entity = "...")`.

> Combinacao `isNativeTable = false` + `isNativeInstance = true` **nao existe** — instancia nativa pressupoe tabela nativa.

---

## 2.3 Mapeamento PK e Sequencia

| Condicao                                | `sequenceType` | `sequenceField` |
|:-----------------------------------------|:---------------|:----------------|
| `@Id` simples com `@GeneratedValue(AUTO)` ou sem `@GeneratedValue` (default AUTO) | `"A"` | nome coluna |
| `@Id` simples com `@GeneratedValue(MANUAL)` | `"M"` | - |
| `@EmbeddedId` com um campo `@GeneratedValue(AUTO)` | `"A"` | nome coluna |
| `@EmbeddedId` sem AUTO (todos manuais ou sem `@GeneratedValue`) | `"M"` | - |

---

## 2.4 Mapeamento de Atributos `@Column` -> `<field>`

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

| Java (`DataType`)    | XML (`dataType`) |
|:---------------------|:-----------------|
| `DataType.INTEGER`   | `INTEIRO`        |
| `DataType.TEXT`      | `TEXTO`          |
| `DataType.DECIMAL`   | `DECIMAL`        |
| `DataType.DATE_TIME` | `DATA_HORA`      |
| `DataType.CHECKBOX`  | `CHECKBOX`       |
| `DataType.SEARCH`    | `PESQUISA`       |
| `DataType.LIST`      | `TEXTO`          |

---

## 2.5 Limpeza da Entidade Java (pós-geracao)

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

# PARTE 3 - CRIANDO A ENTIDADE JAVA A PARTIR DO DICIONARIO

XML ja existe e precisa criar/recriar entidade Java.

---

## 3.1 Fluxo de Criacao

```
XML do Dicionario -> Entidade Java (@JapeEntity) limpa
```

---

## 3.2 Mapeamento Tag raiz / instancia -> `@JapeEntity`

| Tag raiz XML    | Tag instancia XML    | `@JapeEntity` resultante                                                                                  |
|:----------------|:---------------------|:-----------------------------------------------------------------------------------------------------------|
| `<table>`       | `<instance>`         | `@JapeEntity(entity = "<instance.name>", table = "<table.name>")`                                          |
| `<nativeTable>` | `<instance>`         | `@JapeEntity(entity = "<instance.name>", table = "<nativeTable.name>", isNativeTable = true)`              |
| `<nativeTable>` | `<nativeInstance>`   | `@JapeEntity(entity = "<nativeInstance.name>", table = "<nativeTable.name>", isNativeTable = true, isNativeInstance = true)` |

---

## 3.3 Mapeamento PK -> `@Id`

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

## 3.4 Mapeamento `<field>` -> `@Column`

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

## 3.5 Mapeamento `<relationShip>` -> `@OneToMany`

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

## 3.6 Mapeamento PESQUISA com navegacao -> `@OneToOne` + `@JoinColumn`

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

## 3.6.1 Atenção: FK que referencia campo nao-PK da entidade alvo

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

## 3.7 Campos do XML que Nao vao para o Java

Itens XML que **nao geram nada** na entidade Java:

| Item XML                                     | Motivo                                       |
|:---------------------------------------------|:---------------------------------------------|
| `sequenceType` / `sequenceField`             | Framework gerencia, nao entidade |
| `<description>`                              | Metadata UI                               |
| `<expression>`                               | Framework gerencia                    |
| `<fieldOptions>`                             | Metadata UI                               |
| `dataType`, `size`, `readOnly`, `order`, etc. | Metadata UI                               |

---

## 3.8 Anotacoes Lombok Padrao

Toda entidade tem Lombok minimo:

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
```

`@Builder` so se entidade construida programaticamente no dominio.

---

## 3.9 Exemplo Completo: XML -> Java

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

---

## 4.1 Checklist: Criando XML do zero (solicitacao do usuario)

1. [ ] Criar `<NOME_TABELA>.xml` em `datadictionary/`.
2. [ ] `<table>` pra novas ou `<nativeTable>` pra nativas. Em `<nativeTable>`, escolher `<instance>` (instancia nova do addon) ou `<nativeInstance>` (instancia nativa Sankhya — nome reusa entidade do ERP).
3. [ ] Definir `sequenceType` e `sequenceField` conforme estrategia.
4. [ ] Declarar `<primaryKey>` com campos PK.
5. [ ] Declarar `<instance>` com nome entidade.
6. [ ] Declarar `<relationShip>` pra cada pai-filho.
7. [ ] Declarar **todos** campos + atributos.
8. [ ] Informar `allowSearch` e `visibleOnSearch` em **todos**.
9. [ ] Nomes corretos: `UITabName`, `UIGroupName`, `nuCasasDecimais`, `required="S"/"N"`.
10. [ ] Incluir `<expression>` pra calculados.
11. [ ] Incluir `<fieldOptions>` so em `LISTA`.
12. [ ] Usar `dataType="PESQUISA"` + `targetInstance`/`targetField`/`targetType` pra lookups.
13. [ ] `<description>` preenchida em todos `<field>` (nao vazia), sem acentos.

## 4.2 Checklist: Gerando XML a partir de entidade Java existente

1. [ ] Seguir checklist 4.1 mapeando `@Column` -> `<field>`.
2. [ ] Pos-gerar XML, limpar entidade Java (secao 2.5).
3. [ ] Remover `@Expression`, `@GeneratedValue`, `@Option`, `@Property`.
4. [ ] Reduzir `@Column` a **so** `name`.
5. [ ] Reduzir `@JoinColumn` a **so** `name` e `referencedColumnName`.
6. [ ] Reduzir `@JapeEntity` a **so** `entity` e `table`.
7. [ ] Remover imports nao usados.

## 4.3 Checklist: Criando entidade Java a partir do XML

1. [ ] Criar classe com `@JapeEntity(entity, table)`.
2. [ ] Adicionar `@Data`, `@NoArgsConstructor`, `@AllArgsConstructor`.
3. [ ] Pra cada `<field>` da `<primaryKey>`, mapear como `@Id` + `@Column(name)`.
4. [ ] PK composta? Criar `@Embeddable` com campos, usar `@Id` no embeddable.
5. [ ] Pra cada `<field>` dos `<fields>`, criar campo Java com `@Column(name)` + tipo inferido.
6. [ ] Pra cada `<relation>`, criar `@OneToMany` com `@Relationship`.
7. [ ] PESQUISA com navegacao: adicionar `@OneToOne` + `@JoinColumn(name, referencedColumnName)`.
8. [ ] **Nao** adicionar `@Expression`, `@GeneratedValue`, `@Option`, `@Property` nem extras.

---

## 4.4 Erros Comuns

| Erro                                              | Correcao                                                         |
|:--------------------------------------------------|:-----------------------------------------------------------------|
| Usar `uiTabName` no XML                           | Sempre `UITabName` (Pascal Case, UI maiusculo).               |
| Usar `precision` no XML                           | Sempre `nuCasasDecimais`.                                        |
| Usar `required="true"` no XML                     | Sempre `required="S"` ou `required="N"`.                         |
| Omitir `allowSearch`/`visibleOnSearch`            | Sempre informar, mesmo `"N"`.                           |
| Omitir `<fieldOptions>` em campo lista            | Gerar `<fieldOptions>` com `<option>` pra cada opcao.           |
| Usar `<fieldOptions>` em campo `CHECKBOX`         | Remover `<fieldOptions>`, manter so `dataType="CHECKBOX"`. |
| `<description>` vazia ou ausente em `<field>`     | Preencher `<description>` obrigatorio.      |
| Omitir `sequenceType` na tag `<table>`            | Sempre informar `sequenceType` (+ `sequenceField` se AUTO).      |
| Atributos extras no `@Column` Java      | Manter **so** `name` — resto no XML.               |
| Usar `@Expression` ou `@GeneratedValue` no Java  | Remover — vao pra `<expression>` e `sequenceType` no XML.       |
| `@JoinColumn` com `name` e `referencedColumnName` invertidos | `name` = campo local (na tabela com `@JoinColumn`). `referencedColumnName` = campo na referenciada. Ver secao 3.6.1. |
| Usar `<instance>` para instancia nativa Sankhya em `<nativeTable>` | Usar `<nativeInstance>`. `<instance>` faz o builder regravar a entrada no `metadata.xml`; durante o deploy a instancia e re-mapeada para o owner do addon e quebra regras/validacoes nativas. |
| Esquecer `<nativeInstance>` quando o `entity` Java reusa nome nativo (`CabecalhoNota`, `Parceiro`, `Produto`, etc.) | Trocar `<instance>` por `<nativeInstance>` no XML e adicionar `isNativeInstance = true` no `@JapeEntity`. |