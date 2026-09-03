# Dynamic Form (`<dynamicForm>`) — Data Dictionary

Componente UI declarativo que **gera tela de cadastro CRUD completa** sem escrever código de interface (sem JavaScript/HTML). Aproveita a definição do `<table>`/`<instance>` no dicionário de dados — campos, abas, relacionamentos e lookups são montados automaticamente.

> **`<dynamicForm>` é para `<table>` regular** (CRUD em grade/formulário). Para `<treeTable>` (hierarquia pai/filho), usar `<dynamicTreeView>` — mesma estrutura de atributos, mas renderiza tree-view. Ver tabela "Diferença `<dynamicForm>` vs outros componentes" abaixo.

## Quando usar

- Cadastros administrativos baseados em tabelas estruturadas
- CRUD sem desenvolvimento de UI custom
- Telas com lookups (PESQUISA) e relacionamentos
- Prototipação rápida de telas de manutenção

> **Quando NÃO usar:** se a tela exige UI custom (JS/HTML), gráficos complexos, ou layout fora do padrão grid/form, use `<ui>` apontando para `.xhtml5` próprio.

## Onde declarar

`<dynamicForm>` vai dentro de `<menu>` ou `<folder>` no XML do dicionário (raiz `<metadados>` → `<menu>` → `<dynamicForm>`). **Não** declarar dentro de `<table>`. Boa prática: separar definição de tabela e definição de menu em arquivos XML diferentes.

## Estrutura XML

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<metadados>
    <menu id="TDC_MENU_XYZ" description="Modulo XYZ" icon="https://.../icon.png">
        <dynamicForm id="TDC_FORM_CCU"
                     resourceId="TDC_FORM_CCU"
                     instance="TdcXyzCentroCusto"
                     description="Cadastro de Centro de Custo"/>
    </menu>
</metadados>
```

## Atributos do `<dynamicForm>`

| Atributo | Obrigatório | Descrição | Exemplo |
|----------|:-----------:|-----------|---------|
| `id` | Sim | Identificador único. Pattern `[a-zA-Z0-9_.-]+`. Use prefixo do projeto (`<PRX>_FORM_<CTX>`) | `TDC_FORM_CCU` |
| `instance` | Sim | Nome da `<instance>` declarada no `<table>`. **Deve bater exatamente** | `TdcXyzCentroCusto` |
| `description` | Sim | Label do menu visível ao usuário | `Cadastro de Centro de Custo` |
| `resourceId` | Opcional no XSD, **obrigatório na prática** | Recurso para controle de permissão. Mesmo valor do `id`, máx. 50 caracteres — sem ele o `NOME` gravado em `TRDCON` recebe o prefixo do contexto do add-on e pode derrubar o carregamento do módulo. Ver [`menu.md`](menu.md#resourceid--obrigatório-na-prática-teto-de-50-em-trdconnome) | `TDC_FORM_CCU` |
| `license` | Não | Identificador de licença | — |

## Como o `instance` conecta tudo

`instance` é o **elo lógico** entre `<dynamicForm>` e a tabela:

```xml
<!-- Arquivo: datadictionary/TDCXYZATD.xml -->
<table name="TDCXYZATD" sequenceType="A" sequenceField="CODATD">
    <description>Atendimento</description>
    <primaryKey><field name="CODATD"/></primaryKey>
    <instances>
        <instance name="TdcXyzAtendimento">    <!-- ← instance declarada aqui -->
            <description>Atendimento</description>
        </instance>
    </instances>
    <fields>...</fields>
</table>
```

```xml
<!-- Arquivo: datadictionary/TDCXYZ_MENU.xml -->
<metadados>
    <menu id="TDC_MENU_XYZ" description="Modulo XYZ" icon="...">
        <dynamicForm id="TDC_FORM_ATD"
                     resourceId="TDC_FORM_ATD"
                     instance="TdcXyzAtendimento"   <!-- ← bate com instance acima -->
                     description="Atendimentos"/>
    </menu>
</metadados>
```

Se `instance` apontar para nome inexistente, o deploy **falha**.

> **Para `<treeTable>`:** mesma lógica de `instance`, mas o componente de menu correto é `<dynamicTreeView>` (não `<dynamicForm>`). Atributos idênticos (`id`, `instance`, `description`, `resourceId`, `license`).

## Geração automática da tela

Framework monta a tela a partir de:

| Atributo do `<field>` | Comportamento na tela |
|-----------------------|----------------------|
| `dataType` | Tipo do widget (TEXTO=textbox, LISTA=combo, PESQUISA=lookup, CHECKBOX=checkbox, DATA_HORA=datetime picker, etc.) |
| `description` | Label do campo |
| `required` | Validação obrigatório |
| `readOnly` | Campo só leitura |
| `visible` | Mostra/esconde no form |
| `UITabName` | Nome da aba onde o campo aparece |
| `UIGroupName` | Nome do grupo dentro da aba |
| `order` | Ordem de exibição |
| `<expression>` | Valor default em runtime (BeanShell ou SQL) |
| `<fieldOptions>` | Opções fixas para `dataType="LISTA"` |

> **Nada de UI custom necessário.** Para personalizar layout, use `UITabName`/`UIGroupName`/`order` nos `<field>` da tabela.

## Exemplo completo (cadastro com PESQUISA + valor default)

```xml
<!-- Tabela -->
<table name="TDCXYZATD" sequenceType="A" sequenceField="CODATD">
    <description>Atendimento</description>
    <primaryKey><field name="CODATD"/></primaryKey>
    <instances>
        <instance name="TdcXyzAtendimento">
            <description>Atendimento</description>
        </instance>
    </instances>
    <fields>
        <field name="CODATD" dataType="INTEIRO" required="S" allowSearch="S" visibleOnSearch="S"
               UITabName="__main" order="1">
            <description>Codigo</description>
        </field>
        <field name="DESCATD" dataType="TEXTO" size="100" required="S" allowSearch="S" visibleOnSearch="S"
               UITabName="__main" order="2">
            <description>Descricao</description>
        </field>
        <field name="CODUSU" dataType="PESQUISA"
               targetInstance="Usuario" targetField="CODUSU" targetType="INTEIRO"
               required="S" allowSearch="S" visibleOnSearch="S" UITabName="__main" order="3">
            <description>Usuario</description>
            <expression><![CDATA[return $ctx_usuario_logado;]]></expression>
        </field>
        <field name="DHCRIACAO" dataType="DATA_HORA" readOnly="S" allowSearch="N" visibleOnSearch="N"
               UITabName="__main" order="4">
            <description>Data Criacao</description>
            <expression><![CDATA[return $ctx_dh_atual;]]></expression>
        </field>
    </fields>
</table>

<!-- Menu (em arquivo separado) -->
<metadados>
    <menu id="TDC_MENU_ATD" description="Atendimentos" icon="...">
        <dynamicForm id="TDC_FORM_ATD"
                     resourceId="TDC_FORM_ATD"
                     instance="TdcXyzAtendimento"
                     description="Cadastro de Atendimentos"/>
    </menu>
</metadados>
```

Resultado: tela com 4 campos, `CODUSU` lookup pra Usuario com default = usuário logado, `DHCRIACAO` read-only com default = data/hora atual do servidor.

## `controlproperties` (refinamentos opcionais)

`<dynamicForm>` aceita filho `<properties>` (`controlproperties`) com 3 sub-tags:

| Sub-tag | Função |
|---------|--------|
| `<entityName>` | Override da `instance` (raro — `instance` no atributo já basta) |
| `<filterExpression>` | Filtro fixo aplicado ao listar registros |
| `<paramMenuAtivo>` | SQL que retorna 1+ row para liberar acesso à tela |

```xml
<dynamicForm id="TDC_FORM_ATD" resourceId="TDC_FORM_ATD" instance="TdcXyzAtendimento" description="Atendimentos">
    <properties>
        <paramMenuAtivo>SELECT 1 FROM TSIPAR WHERE CHAVE = 'XYZ_FEAT_ATD' AND VALOR = 'S'</paramMenuAtivo>
    </properties>
</dynamicForm>
```

## Diferença `<dynamicForm>` vs outros componentes de menu

| Componente | Tipo de tabela alvo | Renderização |
|------------|---------------------|--------------|
| `<dynamicForm>` | `<table>` regular | Grid + form CRUD padrão |
| `<dynamicTreeView>` | `<treeTable>` hierárquica | Tree-view expansível com mesmos campos do form |
| `<ui>` | Qualquer (custom) | Arquivo `.xhtml5` próprio (JS/HTML manual) |
| `<dashboard>` | N/A | Arquivo de dashboard em `/dashboards/` (gráficos/KPIs) |

> **Regra:** componente segue o tipo da tabela. `<table>` → `<dynamicForm>`. `<treeTable>` → `<dynamicTreeView>`. Tentar usar `<dynamicForm>` apontando pra `<instance>` de uma `<treeTable>` perde a UI hierárquica (renderiza grade plana, ignorando `CODIGOPAI`/`GRAU`/`ANALITICO`).

## Anti-patterns

- [ ] Omitir `resourceId` — o `NOME` em `TRDCON` passa a ser `<domain>.<id>` e pode estourar o `VARCHAR2(50)`, impedindo o módulo de carregar. Ver [`menu.md`](menu.md#resourceid--obrigatório-na-prática-teto-de-50-em-trdconnome)
- [ ] Usar prefixo genérico `AD_` no `id` — usar `<PRX>_` do projeto
- [ ] `instance` apontando para nome que não existe na tabela — deploy falha
- [ ] **Usar `<dynamicForm>` apontando para `<instance>` de `<treeTable>`** — perde tree-view, renderiza grade plana. Use `<dynamicTreeView>` para `<treeTable>`.
- [ ] Conflito de nome com entidade nativa Sankhya (`Produto`, `Parceiro`, `Usuario`, etc.) — usar nomes específicos do addon
- [ ] Declarar `<dynamicForm>` dentro de `<table>` — vai dentro de `<menu>`
- [ ] Definir tabela e menu no mesmo arquivo XML — separar em arquivos diferentes
- [ ] Tentar adicionar JS/HTML para customizar — `<dynamicForm>` é declarativo; se precisar custom, usar `<ui>`
- [ ] Esquecer `description` em `<field>` — necessário pra ter label na UI gerada

## Boas práticas

- ID segue padrão `<PRX>_FORM_<CTX>` (ex.: `TDC_FORM_CCU`, `TDC_FORM_ATD`)
- `description` clara e em português (visível ao usuário final)
- Organizar campos com `UITabName` (default `__main`) e `UIGroupName` para tela limpa
- `order` numérico crescente para garantir disposição consistente
- Usar `<expression>` com `$ctx_usuario_logado`/`$ctx_dh_atual` para auditoria automática
- Lookups (`PESQUISA`) sempre com `targetInstance` + `targetField` + `targetType`
- Separar arquivos: `<table>`/`<treeTable>` em um, `<menu>` + `<dynamicForm>` em outro
