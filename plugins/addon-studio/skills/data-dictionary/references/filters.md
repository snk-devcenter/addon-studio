# Filtros (`<filters>`) — Data Dictionary

Filtros declarativos exibidos acima da grade de resultados em telas geradas via `<dynamicForm>`/`<dynamicTreeView>`. Permitem ao usuário pesquisar registros sem código de UI custom.

## Quando usar

- Telas com volume de registros onde busca direta por PK não é prática
- Cadastros com campos textuais (`descrição`, `nome`) — habilitar busca parcial
- Tabelas com data de criação/alteração — filtro por período
- Campos com poucos valores possíveis — multi-seleção

> **Não** declarar filtros para todo campo da tabela. Apenas os que usuários **realmente vão usar** para buscar. Filtros em excesso poluem a UI e degradam performance (cada filtro = potencial WHERE adicional).

## Onde declarar

`<filters>` é filho de `<table>`, `<treeTable>` ou `<view>` (`xs:all` em `tableOrView`). Vai junto de `<fields>`, `<primaryKey>`, `<instances>`:

```xml
<table name="TDCXYZATD" sequenceType="A" sequenceField="CODATD">
    <description>Atendimento</description>
    <primaryKey><field name="CODATD"/></primaryKey>
    <instances>
        <instance name="TdcXyzAtendimento">
            <description>Atendimento</description>
        </instance>
    </instances>
    <fields>
        <!-- ... campos ... -->
    </fields>
    <filters>
        <filter field="CODATD"/>
        <filter field="DESCATD" useLikeExpression="S"/>
        <filter field="DHCRIACAO" type="PERIODO" label="Periodo de Criacao"/>
    </filters>
</table>
```

## Estrutura XML

```xml
<filters>
    <!-- Filtro simples -->
    <filter field="<NOME_CAMPO>" [label="..."] [type="..."] [...]/>

    <!-- Agrupamento logico -->
    <group label="<TITULO_GRUPO>">
        <filter field="..." .../>
        <filter field="..." .../>
    </group>
</filters>
```

## Atributos do `<filter>`

| Atributo | Obrigatório | Default | Descrição |
|----------|:-----------:|:-------:|-----------|
| `field` | Sim | — | Nome da coluna alvo (deve existir em `<fields>`) |
| `label` | Não | `<description>` do `<field>` | Texto visível ao usuário |
| `type` | Não | `PADRAO` | Tipo do componente: `PADRAO` / `MULTI_SELECAO` / `PERIODO` |
| `useLikeExpression` | Não | `"N"` | Se `"S"`, gera `LIKE '%valor%'` em vez de `=`. Use em campos texto livre. |
| `required` | Não | `"N"` | Se `"S"`, usuário precisa preencher antes de executar a busca |
| `keepLast` | Não | `"S"` | Mantém o último valor entre sessões |
| `considerRelationFilter` | Não | `"S"` | Considera filtros de relacionamento ao montar query |
| `voidExpression` | Não | `"N"` | Permite expressão vazia (sem condição) |

## Tipos de filtro (`type`)

| Tipo | Renderização | Quando usar |
|------|--------------|-------------|
| `PADRAO` (default) | Input simples ou lookup conforme `dataType` do campo | Maioria dos casos. Texto, números, lookups (`PESQUISA`). |
| `PERIODO` | Dois date-pickers ("De" / "Até") | Campos de data (`DATA`, `DATA_HORA`) — busca por intervalo. |
| `MULTI_SELECAO` | Combo multi-valor | Campos com poucos valores fixos. **Limitação:** não aplicável a todos os tipos de campo. |

## Sub-tag `<group>` — agrupamento lógico

Agrupa filtros relacionados visualmente (UI mostra título do grupo). Útil para organizar quando há muitos filtros:

```xml
<filters>
    <filter field="CODATD"/>
    <filter field="DESCATD" useLikeExpression="S"/>

    <group label="Datas">
        <filter field="DHCRIACAO" type="PERIODO" label="Criacao"/>
        <filter field="DHALTER" type="PERIODO" label="Alteracao"/>
    </group>

    <group label="Status">
        <filter field="STATUS" type="MULTI_SELECAO" label="Status"/>
        <filter field="ATIVO" label="Ativo"/>
    </group>
</filters>
```

## Sub-tag `<criteria>` (esquema permite, uso raro)

Schema `metadados.xsd` define `<filter>` com 0..N filhos `<criteria>` para condições mais complexas. Documentação oficial padrão **não exemplifica uso direto** — campos comuns ficam declarativos via atributos do `<filter>`. Se precisar de critério custom (raro), consultar projeto de referência interno.

## Exemplos

### Filtro de texto com LIKE

```xml
<filters>
    <filter field="DESCATD" label="Descricao" useLikeExpression="S"/>
</filters>
```

UI: campo de texto livre. Query gerada: `... WHERE DESCATD LIKE '%<valor>%'`.

### Filtro de período (data)

```xml
<filters>
    <filter field="DHCRIACAO" type="PERIODO" label="Periodo de Criacao"/>
</filters>
```

UI: 2 date-pickers ("De" / "Até"). Query: `... WHERE DHCRIACAO BETWEEN <de> AND <ate>`.

### Filtro multi-seleção em campo `LISTA`

```xml
<fields>
    <field name="STATUS" dataType="LISTA" size="20" required="S" allowSearch="S" visibleOnSearch="S">
        <description>Status</description>
        <fieldOptions>
            <option value="ABERTO">Aberto</option>
            <option value="ANDAMENTO">Em andamento</option>
            <option value="FECHADO">Fechado</option>
        </fieldOptions>
    </field>
</fields>

<filters>
    <filter field="STATUS" type="MULTI_SELECAO" label="Status"/>
</filters>
```

UI: combo permitindo selecionar múltiplos status simultaneamente.

### Filtro com lookup (`PESQUISA`)

```xml
<fields>
    <field name="CODUSU" dataType="PESQUISA"
           targetInstance="Usuario" targetField="CODUSU" targetType="INTEIRO"
           allowSearch="S" visibleOnSearch="S">
        <description>Usuario Responsavel</description>
    </field>
</fields>

<filters>
    <filter field="CODUSU" label="Usuario Responsavel"/>
</filters>
```

UI: lookup que abre busca de usuário, mesmo widget do form.

### Conjunto completo agrupado

```xml
<filters>
    <filter field="CODATD" label="Codigo"/>
    <filter field="DESCATD" useLikeExpression="S" label="Descricao"/>

    <group label="Datas">
        <filter field="DHCRIACAO" type="PERIODO" label="Criacao"/>
        <filter field="DHALTER" type="PERIODO" label="Ultima Alteracao"/>
    </group>

    <filter field="STATUS" type="MULTI_SELECAO"/>
    <filter field="CODUSU" label="Usuario Responsavel"/>
    <filter field="ATIVO" label="Ativo"/>
</filters>
```

## Anti-patterns

- [ ] Declarar filtro para **todo** campo da tabela — UI fica poluída, performance cai
- [ ] `field` apontando para coluna inexistente em `<fields>` — deploy falha
- [ ] Esquecer `useLikeExpression="S"` em campos de texto livre (`descricao`, `nome`) — busca exata raramente é o que o usuário quer
- [ ] Usar `type="PERIODO"` em campo que **não** é de data — não funciona
- [ ] `type="MULTI_SELECAO"` em campo `dataType` que não suporta — limitação documentada
- [ ] Omitir `label` em filtros — usuário vê o nome técnico da coluna (ex.: `DHCRIACAO` em vez de `Data de Criacao`)
- [ ] `required="S"` sem necessidade — força usuário preencher antes de buscar (use só quando volume justificar)
- [ ] Filtros em campos com `calculated="S"` — performance ruim (executa expression a cada filtro), avaliar caso a caso

## Boas práticas

- Filtrar **apenas** campos que usuários realmente buscam — qualidade > quantidade
- `useLikeExpression="S"` em campos de texto livre (descrição, nome, observações)
- `type="PERIODO"` em datas — UX intuitivo
- `label` claro em português ("Periodo de Criacao", não "DHCRIACAO")
- Agrupar via `<group>` quando >5 filtros — organiza visualmente
- Criar índice no banco para colunas filtradas frequentemente (não declarar no XML — vai no `dbscript`)
- Combinar com `controlproperties/filterExpression` no `<dynamicForm>` para filtros fixos (não-editáveis)

## Integração com `<dynamicForm>`

Filtros declarados em `<table>` aparecem **automaticamente** na tela gerada por `<dynamicForm>` que aponta pra `<instance>` daquela tabela. Não precisa declaração extra no `<dynamicForm>`.

Para **filtros fixos** (não-editáveis, sempre aplicados), usar `<filterExpression>` em `<properties>` do `<dynamicForm>`:

```xml
<dynamicForm id="TDC_FORM_ATD_ABERTOS" instance="TdcXyzAtendimento"
             description="Atendimentos Abertos">
    <properties>
        <filterExpression>STATUS = 'ABERTO'</filterExpression>
    </properties>
</dynamicForm>
```

UI mostra apenas registros com `STATUS = 'ABERTO'`, e filtros declarados em `<filters>` continuam funcionando por cima desse fixo.
