---
name: data-dictionary
description: Tela de cadastro que o **próprio Sankhya monta a partir da tabela**, declarada no XML do dicionário (`datadictionary/<TABELA>.xml`) — sem escrever JS nem HTML. Sinal prático: se a tela não tem pasta própria em `webapp/html5/`, ela é gerada daqui, e label, campo obrigatório, filtro e item de menu dela moram neste XML. Use ao criar, alterar, revisar, auditar ou padronizar arquivos em `datadictionary/`; quando o pedido é "quero que essa tabela vire uma tela de cadastro", "campo obrigatório / lista de opções / busca de parceiro na tela" ou "quero a tabela no menu"; ao ajustar ou traduzir label de campo, de menu ou qualquer texto/rótulo dessa tela — é o dono default quando o dev diz "label/texto da tela" sem citar `webapp/html5/`; ao receber spec de tabela/entidade hierárquica; ao definir metadados/UI de uma tabela; ao mapear tipos; ou ao tocar em XML com tag raiz `<metadados>`. Cobre `<table>`, `<treeTable>`, `<nativeTable>`, `<instance>`, `<fields>`, `<filters>`, `<menu>`, `<dynamicForm>`, `<dynamicTreeView>`, `dataType` (TEXTO/INTEIRO/DECIMAL/DATA/DATA_HORA/HORA/CHECKBOX/LISTA/PESQUISA), `<expression>`, `calculated`, lookups e relacionamentos. NÃO usar para índice, constraint ou `NOT NULL` no banco — isso é `database`. NÃO usar para campo novo em tabela nativa (`<field>` em `<nativeTable>`) — isso é `merge-on-root`. NÃO usar para tela própria do addon em `webapp/html5/`, nem quando a tela precisa enviar dados para um endpoint/serviço do addon ou ter lógica própria (formulário que chama seu `@Controller`) — isso é `sankhya-js`.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
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

**Convencao:** nome arquivo = nome tabela. Ex: `PRXXYZCAD.xml` pra tabela `PRXXYZCAD`.

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
| `<treeTable />`   | Tabela **hierarquica** (pai/filho) — cadastros tipo centro de custo, categorias de produto, organogramas. Framework gera UI tree + campos `CODIGOPAI`/`ANALITICO`/`GRAU`. Detalhes em [`references/tree-table.md`](references/tree-table.md). |
| `<nativeTable />` | Tabela **nativa** Sankhya Om: so para declarar `<nativeInstance>` com `<relationShip>` (ex.: relacao de merge-on-root). **Nao** adiciona campo nem instancia nova — campo novo em entidade nativa e skill `merge-on-root`. Ver 1.10. |
| `<nativeFolder />`| Encaixe em pasta nativa Sankhya: atributo `name` (`CONFIGURACOES_CADASTROS`/`_CONSULTA`/`_ROTINA`/`_RELATORIO`), filhos iguais aos de `<folder>`. Detalhes em [`references/menu.md`](references/menu.md). |
| `<menu />`        | Estrutura de menu/navegacao do add-on. Container para `<folder>`, `<dynamicForm>`, `<dynamicTreeView>`, `<ui>`, `<dashboard>`. **Todo no de menu leva `resourceId` explicito de no maximo 50 caracteres** — sem isso o deploy pode derrubar o add-on inteiro. Detalhes em [`references/menu.md`](references/menu.md). |
| `<dynamicForm />` | Tela CRUD declarativa (sem JS/HTML) gerada a partir de uma `<instance>` da tabela. Vai dentro de `<menu>`/`<folder>`. Detalhes em [`references/dynamic-form.md`](references/dynamic-form.md). |
| `<filters />`     | Filtros de busca em telas geradas por `<dynamicForm>`/`<dynamicTreeView>`. Filho de `<table>`/`<treeTable>`. Detalhes em [`references/filters.md`](references/filters.md). |

---

## 1.4 Tag `<table>` - Tabela nova

### Atributos obrigatorios

| Atributo        | Descricao                                                                                                       |
|:----------------|:----------------------------------------------------------------------------------------------------------------|
| `name`          | Nome tabela no banco.                                                                               |
| `sequenceType`  | `"A"` (automatico) ou `"M"` (manual). **Default `"A"`** — `"M"` so nas excecoes da secao "Como determinar". |
| `sequenceField` | Coluna PK que recebe sequencia. **Obrigatorio com `sequenceType="A"`; omitir com `sequenceType="M"`.** |

### Elemento filho obrigatorio: `<description>`

`<table>` exige `<description>` propria — registrada em `TDDTAB.DESCRTAB` (NOT NULL). Distinta da `<description>` da `<instance>`: a do `<table>` descreve a tabela fisica, a da `<instance>` descreve a entidade JAPE. Costumam ser iguais, mas as duas precisam estar presentes.

```xml
<table name="PRXXYZPRD" sequenceType="A" sequenceField="CODPRODUTO">
    <description>Produtos</description>
    <primaryKey>...</primaryKey>
    <instances>
        <instance name="PrxXyzProduto">
            <description>Produtos</description>
        </instance>
    </instances>
    ...
</table>
```

> Omitir `<description>` da `<table>` causa erro de deploy: `DESCRTAB NULL em TDDTAB`.

### Como determinar `sequenceType`

**Default do ecossistema: `"A"` (automatica).** Tabela nova do addon com PK propria nasce `sequenceType="A" sequenceField="<coluna PK>"` — quem gera o valor e o framework. Cadastro, **configuracao, log, registro, historico, auditoria, fila de integracao**: todos `"A"`. Nao perguntar ao dev qual usar: assumir `"A"` e so tratar `"M"` se a PK cair numa das excecoes abaixo.

`"M"` e excecao e precisa de justificativa. Unicos casos legitimos:

| Caso legitimo para `"M"`                                                    | Por que                                                            |
|:----------------------------------------------------------------------------|:-------------------------------------------------------------------|
| PK composta so de FKs (tabela de ligacao/vinculo)                           | Nao existe coluna pra sequenciar — o valor sai das FKs             |
| PK e codigo de negocio informado pelo usuario ou por sistema externo         | O valor tem significado fora do addon; framework nao pode inventar |
| PK espelha chave de registro nativo Sankhya (1:1 com `NUNOTA`, `CODPARC`, ... — tabela de extensao do `merge-on-root`) | O valor ja existe no registro nativo                              |

> **Por que `"M"` fora desses casos esta errado:** joga a geracao da PK pra aplicacao (`MAX+1` — corrida sob concorrencia) e quebra a gravacao pela tela do dicionario, que conta com a sequencia do framework. **Sintoma tipico:** usuario clica em "novo" na tela gerada, grava, e estoura `ORA-01400: cannot insert NULL into (<TABELA>.<PK>)` — a tela nao preenche PK que o framework nao gera. Tabela de log/config/apoio com PK manual e defeito, nao escolha de design.
>
> A armadilha e tabela de apoio "que so o dbscript alimenta": se ela tem `<instance>`, tem tela — e alguem vai clicar em novo. Ter seed no dbscript **nao** e motivo pra `"M"`.

| Estrutura da PK                                              | XML                                                    |
|:-------------------------------------------------------------|:-------------------------------------------------------|
| PK simples (caso comum)                                      | `sequenceType="A" sequenceField="<coluna>"`            |
| PK composta com uma coluna sequencial (ex.: `NUITEM`)        | `sequenceType="A" sequenceField="<coluna sequencial>"` |
| PK composta so de FKs / PK = codigo de negocio externo       | `sequenceType="M"` (sem `sequenceField`)               |

**Exemplos XML:**

```xml
<!-- AUTO — padrao, inclui config/log/historico -->
<table name="PRXXYZPRD" sequenceType="A" sequenceField="CODPRODUTO">
    <description>Produtos</description>
    ...
</table>

<!-- MANUAL — excecao: PK composta so de FKs (tabela de vinculo) -->
<table name="PRXXYZVIN" sequenceType="M">
    <description>Vinculo Origem x Produto</description>
    <primaryKey>
        <field name="CODORIG"/>
        <field name="CODPROD"/>
    </primaryKey>
    ...
</table>
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
| `<instance>`           | Instancia **nova**, criada pelo addon, sobre tabela do addon (`<table>`/`<treeTable>`). Nao crie instancia nova sobre tabela nativa (ver 1.10). |
| `<nativeInstance>`     | Instancia **nativa do Sankhya** (ex.: `CabecalhoNota`, `Parceiro`, `Produto`). **Somente** dentro de `<nativeTable>`. |

```xml
<!-- Instancia nova do addon -->
<instances>
    <instance name="PrxXyzProduto">
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

### Atributos de `<instance>` / `<nativeInstance>`

| Atributo         | Obrigatorio | Descricao                                                                                     |
|:-----------------|:------------|:----------------------------------------------------------------------------------------------|
| `name`           | Sim         | Nome logico da entidade (bate com `@JapeEntity(entity = "...")`).                              |
| `resourceId`     | Nao         | Identificador do recurso da instancia no Sankhya. Formato `br.com.sankhya.<projeto>.<idtela>`. |
| `parentInstance` | Nao         | `resourceId` da instancia **nativa** da qual esta deriva. Declara a instancia como alias/derivada da nativa. |

`parentInstance` existe no XSD para instancia propria do addon sobre tabela nativa — caminho que nao se usa mais: estender entidade nativa e skill `merge-on-root`.

> **Por que `<nativeInstance>` ao inves de `<instance>`:** ambas as tags geram a mesma entidade no runtime, mas `<nativeInstance>` sinaliza para o builder que a instancia **ja existe** no Sankhya nativo e **nao** deve ser regravada no `metadata.xml` final. Se uma instancia nativa for declarada como `<instance>`, o deploy do addon re-mapeia o owner da instancia para o addon e quebra regras de negocio, validacoes e telas nativas que dependem dela. Pareie sempre com `isNativeInstance = true` no `@JapeEntity` correspondente (ver `entity` secao 1.2).

### Convencao de nomes (parametrizada por projeto)

Padrao parametrizado por `<PRX>` (prefixo) + `<MOD3>` (modulo). Ver `database` secao "Descobrir convencao do projeto" antes de criar tabela nova.

| Atributo                                | Padrao                                  | Exemplo (PRX=PRX, MOD3=XYZ)  |
|:----------------------------------------|:----------------------------------------|:-----------------------------|
| `<table name="...">`                    | `<PRX><MOD3><CTX>` (UPPER)              | `PRXXYZCAB`                  |
| `<instance name="...">` (em `<table>`)  | `<Prx><Mod><Ctx>` (PascalCase)          | `PrxXyzCabecalho`            |
| `<nativeInstance name="...">` (em `<nativeTable>`) | Nome **exato** da instancia nativa Sankhya | `CabecalhoNota`, `Parceiro`, `ItemNota` |

Componentes do prefixo addon:

- `<Prx>` / `<PRX>`: prefixo fixo do projeto, **3-4 caracteres** (ex.: `Abc`/`ABC`)
- `<Mod>` / `<MOD3>`: sigla modulo, **3 caracteres** (ex.: `Xyz`/`XYZ`, `Fin`/`FIN`)
- `<Ctx>` / `<CTX>`: contexto/entidade (ex.: `Cabecalho`/`CAB`, `Item`/`ITE`)

> Prefixo `<Prx><Mod>` no `<instance>` evita colisao com outros contextos do ERP. Bate com `@JapeEntity(entity = "...")` correspondente. `<nativeInstance>` **nunca** leva prefixo addon — o nome tem que ser identico ao da instancia nativa Sankhya.

> **NOTA:** exemplos seguintes usam o literal `PRX` no lugar do prefixo. Substituir pelo `<PRX>` real do projeto.

---

## 1.7 Relacionamentos (`<relationShip>`)

Entidade com relacao (`@OneToMany`, `@OneToOne`) declara `<relationShip>` dentro `<instance>`/`<nativeInstance>`.

### Atributos do `<relation>`

| Atributo XML    | Obrigatorio | Default     | Significado                                                                     |
|:----------------|:------------|:------------|:--------------------------------------------------------------------------------|
| `entityName`    | Sim         | -           | Nome da instancia relacionada.                                                  |
| `relation`      | Nao         | `OneToOne`  | Tipo: `OneToOne`, `OneToMany`, `ManyToOne`, `ManyToMany`. **Default e `OneToOne` — informar sempre em relacao 1:N.** |
| `insert`        | Nao         | -           | `"S"`/`"N"`. So com `OneToOne`: inclui a entidade relacionada que tenha `merge-on-root`. |
| `update`        | Nao         | -           | `"S"`/`"N"`. So com `OneToOne`: atualiza a entidade relacionada que tenha `merge-on-root`. |
| `removeCascade` | Nao         | -           | `"S"`/`"N"`. So com `OneToMany`: exclui os dados relacionados (equivale a `delete on cascade`). |

Filhos: `<expression>` (opcional) e `<fields>` (obrigatorio). Cada `<field>` do `<fields>` tem `localName` (coluna da tabela atual) e `targetName` (coluna da relacionada).

```xml
<instance name="PrxXyzProduto">
    <description>Produtos</description>
    <relationShip>
        <relation entityName="PrxXyzVinculoProduto" relation="OneToMany" removeCascade="S">
            <fields>
                <field localName="CODPRODUTO" targetName="CODPRODUTO"/>
            </fields>
        </relation>
    </relationShip>
</instance>
```

### Sub-tag `<expression>` do `<relation>` (opcional)

Configura o relacionamento e/ou filtra a entidade destino. Aceita **tres formatos** (combinaveis no mesmo `<expression>`):

**1) `@ref-param[...]` — configuracao do relacionamento (reflete no dynaform)**

| Opcao                       | Efeito                                                                                          |
|:----------------------------|:------------------------------------------------------------------------------------------------|
| `description=`              | Descricao da aba no dynaform (ex.: `description=Contatos`).                                     |
| `force-one-to-one=true`     | Forca entidade com chave dupla por data a aparecer como **pesquisa** em vez de aba. Ex.: `TipoOperacao`, `TipoNegociacao`. |
| `result-only-analytic=true` | Exibe so registros analiticos da entidade hierarquica destino.                                  |
| `show-on-ui=false`          | Com dynaform, a aba nao aparece na tela.                                                        |
| `auto-search=true`          | Busca automatica da relacionada.                                                                |
| `merge-on-root=true`        | Junta as 2 entidades na tela — o usuario ve uma coisa so. Pareia com `insert`/`update` no `<relation>`. |
| `merge-to-find=true`        | Junta as entidades na busca.                                                                    |
| `APP_PROFILE=P:(...)`       | Exibe so se o cliente tiver os modulos da chave. Formato `P:(<CHAVE>{<CODMOD>},...)` — chave e codigo saem do modulo licenciado, nao invente. |

**2) `@form-filter[...]` — filtro de formulario**

Pode depender de campo dos **dois** formularios. Alias `form.` = formulario de origem; alias `this.` = formulario de destino.

**3) Filtro simples** — depende so da entidade destino. Alias `this.`.

```xml
<!-- 1) @ref-param: aba nomeada, forcada como pesquisa -->
<relation entityName="PrxXyzTipo" relation="OneToOne">
    <expression><![CDATA[@ref-param[description=Tipo, force-one-to-one=true]]]></expression>
    <fields>
        <field localName="CODTIPO" targetName="CODTIPO"/>
    </fields>
</relation>

<!-- 2) @form-filter: cruza campo do form de origem (form.) com o destino (this.) -->
<relation entityName="PrxXyzVinculo" relation="OneToMany">
    <expression><![CDATA[@form-filter[EXISTS (SELECT 1 FROM PRXXYZCTR C WHERE C.CODEMP = form.CODEMP AND this.CODVINCULO = C.CODVINCULO)]]]></expression>
    <fields>
        <field localName="CODPRODUTO" targetName="CODPRODUTO"/>
    </fields>
</relation>

<!-- 3) Filtro simples: so a entidade destino -->
<relation entityName="PrxXyzVinculo" relation="OneToMany">
    <expression><![CDATA[this.ATIVO='S']]></expression>
    <fields>
        <field localName="CODPRODUTO" targetName="CODPRODUTO"/>
    </fields>
</relation>
```

> `force-one-to-one` decide **OneToOne vs aba** no dynaform; `description=` nomeia a aba. Omitir `<expression>` na geracao perde cardinalidade correta, filtro e nome de aba — o XSD nao exige, entao a falta e silenciosa.

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
| `nullable`        | String | Nao         | `"S"`   | Permite valor nulo: `"S"` ou `"N"`.                          |
| `allowDefault`    | String | Nao         | `"S"`   | Permite valor padrao: `"S"` ou `"N"`.                        |
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

> **`nullable` vs `required`:** `nullable="N"` restringe o **dado** (campo nao aceita nulo); `required="S"` restringe a **UI** (dynaform exige preenchimento). Nao sao sinonimos — campo obrigatorio na tela pode aceitar nulo no banco (registro gravado por integracao/listener) e vice-versa.

### Tipos de dados

Conforme `metadados.xsd`, `dataType` aceita 14 valores:

| Tipo XML              | Uso                                                         | Atributos extras obrigatorios            |
|:----------------------|:------------------------------------------------------------|:------------------------------------------|
| `TEXTO`               | Texto curto (single-line)                                   | `size`                                    |
| `CAIXA_TEXTO`         | Texto longo (textarea/multi-line)                           | `size`                                    |
| `INTEIRO`             | Inteiros                                                    | —                                         |
| `DECIMAL`             | Decimais                                                    | `nuCasasDecimais`                         |
| `DATA`                | Data (sem hora)                                             | —                                         |
| `DATA_HORA`           | Data + hora                                                 | —                                         |
| `HORA`                | Hora (sem data)                                             | —                                         |
| `CHECKBOX`            | Booleano (`S`/`N`)                                          | —                                         |
| `LISTA`               | Combo/select com opcoes fixas                               | `<fieldOptions>` (sub-tag)                |
| `PESQUISA`            | Lookup / FK para outra entidade                             | `targetInstance`, `targetField`, `targetType` |
| `HTML`                | Editor rich text (HTML)                                     | —                                         |
| `ARQUIVO`             | Upload de arquivo unico                                     | —                                         |
| `MULTIPLOS_ARQUIVOS`  | Upload de multiplos arquivos                                | —                                         |
| `IMAGEM`              | Upload de imagem                                            | —                                         |

> **`targetType` em PESQUISA** aceita: `TEXTO`, `INTEIRO`, `DECIMAL`, `DATA`, `DATA_HORA`, `HORA`.

### Sub-tag `<description>` (obrigatoria)

Todo `<field>` tem `<description>` **preenchida** com texto descritivo (nao vazia, sem so espacos). Acentos permitidos — a skill [`encoding`](../encoding/SKILL.md) converte o arquivo para ISO-8859-1 depois.

```xml
<field name="CODPARC" dataType="PESQUISA" ...>
    <description>Cód. Parceiro</description>
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

> Quando `<expression>` contiver **SQL** (nao BeanShell), envolva o conteudo com `#type.sql#` e use as **macros SQL Sankhya** (`dbDate()`, `nullValue()`, `truncMonth()`, etc.) para portabilidade Oracle/MSSQL. Ver `macros`.

**`<expression>` vs atributo `calculated` — semantica completa:**

`<expression>` define a logica do campo (BeanShell ou SQL via `#type.sql#`). O comportamento depende de o campo ter ou nao a flag `calculated="S"`:

| Cenario | `<expression>` roda | Coluna no banco | `@Column` na entity Java |
|---------|---------------------|-----------------|---------------------------|
| `<expression>` **sem** `calculated` (default `N`) | So em INSERT/UPDATE | **Sim** — valor persiste na coluna fisica | **Sim** — `@Column` normal |
| `<expression>` **com** `calculated="S"` | A cada leitura do registro | **Nao** — sem DDL para esse campo | **Sim** — `@Column` normal (framework le via expression) |

Pontos criticos:

- `calculated="S"` **exige** `<expression>` presente (obrigatorio).
- `calculated="S"` afeta **somente o DDL** (sem coluna fisica). **Nao** afeta `@Column` da `@JapeEntity` — campo calculado continua acessivel pela entity Java normalmente.
- Use `calculated="S"` quando precisar de informacao variavel atualizada em tempo real (ex.: status derivado de outras tabelas, agregacao).
- **Custo alto, especialmente SQL**: se carregar 1000 registros, o framework dispara 1 query por registro para cada coluna calculada. Sem `calculated`, a `<expression>` roda 1 vez no INSERT/UPDATE e o valor fica persistido — leitura barata.

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

## 1.10 Tabela Nativa (`<nativeTable>`)

`<nativeTable>` so declara relacao em instancia nativa: `<nativeInstance>` com `<relationShip>`. **Sem** `<primaryKey>`, `sequenceType`, `<fields>` ou `<instance>` nova.

- **Campo novo em entidade nativa nao vai aqui.** O `<fields>` de `<nativeTable>` cria coluna na tabela nativa e o `metadados.xsd` o marca como deprecated. O caminho e uma tabela de extensao com merge-on-root — skill `merge-on-root`.
- **Instancia nova do addon sobre tabela nativa** tambem nao se usa mais: a informacao nova vai para a tabela de extensao, com instancia propria em `<table>`.

Uso tipico — relacao de merge-on-root na instancia nativa:

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

Combine com `isNativeTable = true` **e** `isNativeInstance = true` no `@JapeEntity` da raiz, se ela tiver entidade Java (skill `entity`, secao 1.2).

> `<nativeInstance>` aceita apenas `<relationShip>` opcional — sem `<description>`, sem campos.

> Projeto que ja tem `<field>` em `<nativeTable>`: nao acrescente outros. Campo novo vai para a tabela de extensao.

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
       readOnly="S" UITabName="Outras Informações" order="99" allowSearch="N" visibleOnSearch="N">
    <description>Cód. Usuário</description>
    <expression><![CDATA[return $ctx_usuario_logado;]]></expression>
</field>
<field name="DHALTER" dataType="DATA_HORA" readOnly="S" UITabName="Outras Informações" order="99"
       allowSearch="N" visibleOnSearch="N">
    <description>Data/Hora Alteração</description>
    <expression><![CDATA[return $ctx_dh_atual;]]></expression>
</field>
<field name="DHCREATE" dataType="DATA_HORA" readOnly="S" UITabName="Outras Informações" order="99"
       allowSearch="N" visibleOnSearch="N">
    <description>Data/Hora Criação</description>
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

Exemplos completos de XML — tabela com sequência AUTO/MANUAL, PK simples e composta, `nativeTable + nativeInstance` (relacao de merge-on-root), e exemplo XML→Java integrado — em [`references/examples.md`](references/examples.md).

---

## 2. Geração XML a partir de @JapeEntity (Java → XML)

Workflow para gerar XML do dicionário a partir de uma `@JapeEntity` Java existente — fluxo, mapeamento `@JapeEntity` → tag raiz/instância, mapeamento PK e sequência, mapeamento `@Column` → `<field>`, limpeza da entidade Java pós-geração — em [`references/java-to-xml.md`](references/java-to-xml.md).

---

## 3. Geração @JapeEntity a partir de XML (XML → Java)

Workflow para gerar entidade `@JapeEntity` Java a partir do XML do dicionário — fluxo, mapeamento de tag raiz/instância, PK simples e composta, `<field>` → `@Column`, `<relationShip>` → `@OneToMany`, PESQUISA com navegação → `@OneToOne`/`@JoinColumn`, edge cases (FK que referencia campo não-PK), campos que não vão para Java, anotações Lombok padrão — em [`references/xml-to-java.md`](references/xml-to-java.md). Exemplo completo XML→Java em [`references/examples.md`](references/examples.md).

---

## 4.1 Checklist: Criando XML do zero (solicitacao do usuario)

1. [ ] Criar `<NOME_TABELA>.xml` em `datadictionary/`.
2. [ ] `<table>` pra tabela do addon. `<nativeTable>` so para relacao em `<nativeInstance>` (nome reusa entidade do ERP) — campo novo em tabela nativa e `merge-on-root`.
3. [ ] `sequenceType="A"` + `sequenceField="<coluna PK>"` (default — inclui config/log/historico). `"M"` so nas excecoes da secao 1.4.
4. [ ] Declarar `<description>` da `<table>` (vai pra `TDDTAB.DESCRTAB`, NOT NULL).
5. [ ] Declarar `<primaryKey>` com campos PK.
6. [ ] Declarar `<instance>` com nome entidade + `<description>` propria da instancia. Instancia derivada de nativa? Informar `parentInstance` (+ `resourceId`).
7. [ ] Declarar `<relationShip>` pra cada relacao. Informar `relation` (default e `OneToOne` — 1:N exige `relation="OneToMany"`) e `<expression>` quando houver filtro, `force-one-to-one` ou nome de aba.
8. [ ] Declarar **todos** campos + atributos.
9. [ ] Informar `allowSearch` e `visibleOnSearch` em **todos**.
10. [ ] Nomes corretos: `UITabName`, `UIGroupName`, `nuCasasDecimais`, `required="S"/"N"`.
11. [ ] Incluir `<expression>` pra calculados.
12. [ ] Incluir `<fieldOptions>` so em `LISTA`.
13. [ ] Usar `dataType="PESQUISA"` + `targetInstance`/`targetField`/`targetType` pra lookups.
14. [ ] `<description>` preenchida em todos `<field>` (nao vazia). Acentos permitidos — skill `encoding` ajusta o charset depois.

## 4.2 Checklist: Gerando XML a partir de entidade Java existente

1. [ ] Seguir checklist 4.1 mapeando `@Column` -> `<field>`.
2. [ ] Pos-gerar XML, limpar entidade Java (ver [`references/java-to-xml.md`](references/java-to-xml.md), seção "Limpeza da Entidade Java").
3. [ ] Remover `@Expression`, `@GeneratedValue`, `@Option`, `@Property`.
4. [ ] Reduzir `@Column` a **so** `name`.
5. [ ] Reduzir `@JoinColumn` a **so** `name` e `referencedColumnName`.
6. [ ] Reduzir `@JapeEntity` a `entity` e `table` — mais `isNativeTable`/`isNativeInstance` quando a tabela/instancia for nativa (ver [`references/java-to-xml.md`](references/java-to-xml.md)).
7. [ ] Remover imports nao usados.

## 4.3 Checklist: Criando entidade Java a partir do XML

1. [ ] Criar classe com `@JapeEntity(entity, table)`.
2. [ ] Adicionar `@Data`, `@NoArgsConstructor`, `@AllArgsConstructor`.
3. [ ] Pra cada `<field>` da `<primaryKey>`, mapear como `@Id` + `@Column(name)`.
4. [ ] PK composta? Criar `@Embeddable` com campos, usar `@Id` no embeddable.
5. [ ] Pra cada `<field>` dos `<fields>`, criar campo Java com `@Column(name)` + tipo inferido.
6. [ ] Pra cada `<relation relation="OneToMany">`, criar `@OneToMany` com `@Relationship`.
7. [ ] PESQUISA com navegacao: adicionar `@OneToOne` + `@JoinColumn(name, referencedColumnName)`.
8. [ ] **Nao** adicionar `@Expression`, `@GeneratedValue`, `@Option`, `@Property` nem extras.

---

## 4.4 Erros Comuns

| Erro                                              | Correcao                                                         |
|:--------------------------------------------------|:-----------------------------------------------------------------|
| No de menu (`<ui>`, `<folder>`, `<dynamicForm>`, `<dynamicTreeView>`, `<dashboard>`) sem `resourceId` | Declarar `resourceId` explicito, igual ao `id` e com no maximo 50 caracteres. Sem ele o import grava `TRDCON.NOME` = `<domain>.<id>` numa coluna `VARCHAR2(50)`: estourar da `ORA-12899` -> `ModuleBootLoaderException` e **o modulo inteiro nao carrega**. Base local pode ter a coluna com 60 e mascarar. Detalhes em [`references/menu.md`](references/menu.md). |
| Usar `uiTabName` no XML                           | Sempre `UITabName` (Pascal Case, UI maiusculo).               |
| Usar `precision` no XML                           | Sempre `nuCasasDecimais`.                                        |
| Usar `required="true"` no XML                     | Sempre `required="S"` ou `required="N"`.                         |
| Omitir `allowSearch`/`visibleOnSearch`            | Sempre informar, mesmo `"N"`.                           |
| Omitir `<fieldOptions>` em campo lista            | Gerar `<fieldOptions>` com `<option>` pra cada opcao.           |
| Usar `<fieldOptions>` em campo `CHECKBOX`         | Remover `<fieldOptions>`, manter so `dataType="CHECKBOX"`. |
| `<description>` vazia ou ausente em `<field>`     | Preencher `<description>` obrigatorio.      |
| Omitir `<description>` filha de `<table>` (so na `<instance>`) | Adicionar `<description>` propria de `<table>`. Sem ela, deploy falha com `DESCRTAB NULL em TDDTAB`. |
| Omitir `sequenceType` na tag `<table>`            | Sempre informar `sequenceType` (+ `sequenceField` se AUTO).      |
| `sequenceType="M"` em tabela de config, log, registro, historico ou cadastro do addon | Trocar por `sequenceType="A" sequenceField="<coluna PK>"`. `"M"` so em PK composta de FKs, codigo de negocio externo ou PK espelhada de nativa. |
| `sequenceType="A"` sem `sequenceField`            | `sequenceField` e obrigatorio com `"A"` — informar a coluna PK que recebe a sequencia. |
| Omitir `relation` em `<relation>` de uma relacao 1:N | Informar `relation="OneToMany"`. O default do XSD e `OneToOne` — omitir gera cardinalidade errada sem erro de validacao. |
| Atributos extras no `@Column` Java      | Manter **so** `name` — resto no XML.               |
| Usar `@Expression` ou `@GeneratedValue` no Java  | Remover — vao pra `<expression>` e `sequenceType` no XML.       |
| `@JoinColumn` com `name` e `referencedColumnName` invertidos | `name` = campo local (na tabela com `@JoinColumn`). `referencedColumnName` = campo na referenciada. Ver [`references/xml-to-java.md`](references/xml-to-java.md), seção "FK que referencia campo nao-PK". |
| Usar `<instance>` para instancia nativa Sankhya em `<nativeTable>` | Usar `<nativeInstance>`. `<instance>` faz o builder regravar a entrada no `metadata.xml`; durante o deploy a instancia e re-mapeada para o owner do addon e quebra regras/validacoes nativas. |
| `<field>` dentro de `<nativeTable><fields>` | Campo vai para tabela de extensao com merge-on-root (skill `merge-on-root`) — o XSD marca esse `<fields>` como deprecated. |
| `<instance>` nova do addon dentro de `<nativeTable>` | Tabela de extensao com instancia propria em `<table>` + merge-on-root. |
| Esquecer `<nativeInstance>` quando o `entity` Java reusa nome nativo (`CabecalhoNota`, `Parceiro`, `Produto`, etc.) | Trocar `<instance>` por `<nativeInstance>` no XML e adicionar `isNativeInstance = true` no `@JapeEntity`. |


## Skills relacionadas

- `entity` — classe Java `@JapeEntity` que mapeia a tabela definida neste XML
- `database` — dbscript que materializa a tabela no banco
- `merge-on-root` — campo novo em entidade nativa (ou do addon) via tabela de extensao 1:1
- `macros` — macros do MacroTranslator para SQL portável Oracle/MSSQL no campo `<expression>`
