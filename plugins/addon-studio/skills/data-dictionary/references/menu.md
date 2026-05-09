# Menu (`<menu>`) — Data Dictionary

Define ponto de entrada na barra de navegação principal do Sankhya Om. Container hierárquico para `<folder>`, `<dynamicForm>`, `<dynamicTreeView>`, `<ui>`, `<dashboard>`, `<pastaNativa>`.

## Quando usar

- Add-on tem funcionalidade suficiente para justificar entrada **dedicada** na nav bar (módulo completo: Cadastros, Movimentos, Relatórios)
- Telas custom (`<ui>`), forms (`<dynamicForm>`), dashboards e pastas nativas precisam estar agrupados sob um label do add-on

> **Quando NÃO usar:** se for apenas adicionar 1-2 telas em estrutura nativa Sankhya existente (ex.: mais um cadastro em "Configurações de Cadastros"), use `<nativeFolder>` ao invés de criar `<menu>` próprio.

## Onde declarar

`<menu>` é filho top-level direto de `<metadados>` (irmão de `<table>`, `<treeTable>`, `<nativeTable>`, `<view>`, `<nativeFolder>`). Boa prática: separar arquivo XML — `datadictionary/<NOME>_MENU.xml` só com `<menu>` (não misturar com definições de tabela).

## Estrutura XML básica

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<metadados>
    <menu id="TDC_MENU_XYZ"
          description="Modulo XYZ"
          icon="/$ctx/assets/xyz_icone.png">
        <folder id="TDC_FLD_CADASTROS" description="Cadastros">
            <!-- Atendimento e Departamento sao <table> regulares -->
            <dynamicForm id="TDC_FORM_ATD"
                         instance="TdcXyzAtendimento"
                         description="Atendimentos"/>
            <dynamicForm id="TDC_FORM_DEP"
                         instance="TdcXyzDepartamento"
                         description="Departamentos"/>
            <!-- Centro de Custo eh <treeTable> hierarquica - usar dynamicTreeView -->
            <dynamicTreeView id="TDC_TREE_CCU"
                             instance="TdcXyzCentroCusto"
                             description="Centro de Custo"/>
        </folder>
    </menu>
</metadados>
```

## Atributos do `<menu>`

| Atributo | Obrigatório | Descrição | Exemplo |
|----------|:-----------:|-----------|---------|
| `id` | Sim | Identificador único. Pattern `[a-zA-Z0-9_.-]+`. Usar prefixo do projeto (`<PRX>_MENU_<MOD3>`) | `TDC_MENU_XYZ` |
| `description` | Sim | Label visível na barra de navegação | `Modulo XYZ` |
| `icon` | Sim | URL do ícone (local `/$ctx/assets/...` ou externa) | `/$ctx/assets/xyz.png` |
| `license` | Não | Identificador de licença (controle por feature) | — |

## Filhos de `<menu>` / `<folder>` (folderSubItens)

`folderSubItens` aceita 6 tipos de filhos (todos 0..N, ordem livre):

| Filho | Função | Detalhes |
|-------|--------|----------|
| `<folder>` | Submenu hierárquico recursivo | Pode aninhar mais folders/uis/forms/etc |
| `<dynamicForm>` | Tela CRUD declarativa para `<table>` regular | Ver [`dynamic-form.md`](dynamic-form.md) |
| `<dynamicTreeView>` | Tela CRUD com tree-view para `<treeTable>` hierárquica. Atributos idênticos ao `<dynamicForm>` (`id`, `instance`, `description`, `resourceId`, `license`). **Regra:** `<table>` → `<dynamicForm>`; `<treeTable>` → `<dynamicTreeView>` | Ver [`tree-table.md`](tree-table.md) |
| `<ui>` | Tela custom (xhtml5/JS/HTML) | URL aponta para arquivo XHTML5 |
| `<dashboard>` | Dashboard de gráficos/KPIs | Arquivo em `/dashboards/` |
| `<pastaNativa>` | Encaixe em pasta nativa do Sankhya | Apenas 4 valores enum (ver abaixo) |
| `<uiDesignSystem>` | Tela usando design system padrão Sankhya | Pouco usado, consultar projeto |

## `<folder>` — submenu recursivo

```xml
<folder id="TDC_FLD_CADASTROS" description="Cadastros">
    <folder id="TDC_FLD_CAD_BASICOS" description="Cadastros Basicos">
        <dynamicForm id="TDC_FORM_CCU" instance="TdcXyzCentroCusto" description="Centro de Custo"/>
        <dynamicForm id="TDC_FORM_DEP" instance="TdcXyzDepartamento" description="Departamento"/>
    </folder>
    <folder id="TDC_FLD_CAD_AVANCADOS" description="Cadastros Avancados">
        <dynamicForm id="TDC_FORM_CFG" instance="TdcXyzConfiguracao" description="Configuracoes"/>
    </folder>
</folder>
```

| Atributo | Obrigatório | Descrição |
|----------|:-----------:|-----------|
| `id` | Sim | Pattern `[a-zA-Z0-9_.-]+`, único no plugin |
| `description` | Sim | Label do submenu |
| `resourceId` | Não | Recurso para controle de permissão |
| `license` | Não | Licença |

## `<ui>` — tela custom (xhtml5)

Usa quando UI não pode ser gerada declarativamente (gráficos, layouts custom, fluxos não-CRUD):

```xml
<folder id="TDC_FLD_RELATORIOS" description="Relatorios">
    <ui id="TDC_UI_RPT_XYZ"
        url="/$ctx/addon/xyz/relatorio_custom.xhtml5"
        description="Relatorio XYZ Customizado">
        <acesso description="Visualizar" acronym="VIS" sequence="1"/>
        <acesso description="Exportar" acronym="EXP" sequence="2"/>
    </ui>
</folder>
```

| Atributo | Obrigatório | Descrição |
|----------|:-----------:|-----------|
| `id` | Sim | Identificador único |
| `url` | Sim | Path do XHTML5 (formato `/$ctx/addon/...xhtml5`) |
| `description` | Sim | Label |
| `resourceId` | Não | Recurso de permissão |
| `license` | Não | Licença |

Filhos: `<acesso>` (0..N), `<properties>` (controlproperties).

## `<acesso>` — controle de permissão

Define níveis de acesso (roles/perfis) para a tela. Cada `<acesso>` vira uma permissão específica que admin pode atribuir a perfis de usuário:

```xml
<ui id="TDC_UI_PEDIDOS" url="..." description="Pedidos">
    <acesso description="Visualizar" acronym="VIS" sequence="1"/>
    <acesso description="Editar" acronym="EDI" sequence="2"/>
    <acesso description="Cancelar" acronym="CAN" sequence="3"/>
    <acesso description="Liberar Limite" acronym="LIB" sequence="4"/>
</ui>
```

| Atributo | Obrigatório | Descrição |
|----------|:-----------:|-----------|
| `description` | Sim | Nome da permissão visível no admin |
| `acronym` | Sim | Sigla curta (verificada via `ContextoAcao`/`ContextoRegra` no Java) |
| `sequence` | Não | Ordem de exibição (`xs:nonNegativeInteger`) |

Acesso não declarado = permissão liberada para todos. Acesso declarado = admin precisa atribuir explicitamente.

## `<dashboard>` — dashboard de gráficos/KPIs

Aponta para arquivo de dashboard em `/dashboards/`:

```xml
<folder id="TDC_FLD_DASHBOARDS" description="Dashboards">
    <dashboard id="TDC_DSH_VENDAS"
               file="/dashboards/vendas.json"
               description="Dashboard de Vendas"/>
</folder>
```

| Atributo | Obrigatório | Descrição |
|----------|:-----------:|-----------|
| `id` | Sim | Identificador único |
| `file` | Sim | Path do arquivo de definição (em `/dashboards/`) |
| `description` | Sim | Label |
| `license` | Não | Licença |

## `<pastaNativa>` — encaixe em pasta nativa Sankhya

Quando o add-on adiciona apenas 1-2 telas em estrutura existente do Sankhya, evitar `<menu>` próprio e usar `<pastaNativa>`. Atributo `name` aceita 4 valores enum:

| Valor de `name` | Onde encaixa |
|-----------------|--------------|
| `CONFIGURACOES_CADASTROS` | Configurações → Cadastros |
| `CONFIGURACOES_RELATORIO` | Configurações → Relatórios |
| `CONFIGURACOES_CONSULTA` | Configurações → Consultas |
| `CONFIGURACOES_ROTINA` | Configurações → Rotinas |

Exemplo:

```xml
<metadados>
    <nativeFolder>
        <pastaNativa name="CONFIGURACOES_CADASTROS" resourceId="tdc_xyz_cad">
            <dynamicForm id="TDC_FORM_CCU"
                         instance="TdcXyzCentroCusto"
                         description="Centro de Custo (Add-on XYZ)"/>
        </pastaNativa>
    </nativeFolder>
</metadados>
```

> **Atenção:** `<pastaNativa>` vai dentro de `<nativeFolder>` (top-level), **não** dentro de `<menu>`.

## `controlproperties` — propriedades avançadas

Filho `<properties>` em `<ui>`/`<dynamicForm>`/`<dynamicTreeView>` aceita 3 sub-tags:

| Sub-tag | Função |
|---------|--------|
| `<entityName>` | Override da `instance` (raro — atributo `instance` já basta) |
| `<filterExpression>` | Filtro fixo aplicado ao listar registros |
| `<paramMenuAtivo>` | SQL que retorna 1+ row para liberar o item de menu (toggle por feature flag, parâmetro Sankhya, etc.) |

Exemplo `paramMenuAtivo` — habilita o form só se parâmetro Sankhya `XYZ_FEAT_ATD = 'S'`:

```xml
<dynamicForm id="TDC_FORM_ATD" instance="TdcXyzAtendimento" description="Atendimentos">
    <properties>
        <paramMenuAtivo>SELECT 1 FROM TSIPAR WHERE CHAVE = 'XYZ_FEAT_ATD' AND VALOR = 'S'</paramMenuAtivo>
    </properties>
</dynamicForm>
```

Item somente aparece no menu se a query retornar pelo menos 1 row no banco.

## Exemplo completo (estrutura realista)

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<metadados>
    <menu id="TDC_MENU_XYZ"
          description="Modulo XYZ"
          icon="/$ctx/assets/xyz_icone.png">

        <folder id="TDC_FLD_CADASTROS" description="Cadastros">
            <!-- Departamento eh <table> regular -->
            <dynamicForm id="TDC_FORM_DEP"
                         instance="TdcXyzDepartamento"
                         description="Departamento"/>
            <!-- Centro de Custo eh <treeTable> - usar dynamicTreeView -->
            <dynamicTreeView id="TDC_TREE_CCU"
                             instance="TdcXyzCentroCusto"
                             description="Centro de Custo"/>
        </folder>

        <folder id="TDC_FLD_MOVIMENTOS" description="Movimentos">
            <dynamicForm id="TDC_FORM_ATD"
                         instance="TdcXyzAtendimento"
                         description="Atendimentos">
                <properties>
                    <filterExpression>STATUS &lt;&gt; 'CANCELADO'</filterExpression>
                </properties>
            </dynamicForm>
        </folder>

        <folder id="TDC_FLD_CONSULTAS" description="Consultas">
            <ui id="TDC_UI_REL_PROD"
                url="/$ctx/addon/xyz/relatorio_produtividade.xhtml5"
                description="Relatorio de Produtividade">
                <acesso description="Visualizar" acronym="VIS" sequence="1"/>
                <acesso description="Exportar" acronym="EXP" sequence="2"/>
            </ui>
        </folder>

        <folder id="TDC_FLD_DASHBOARDS" description="Dashboards">
            <dashboard id="TDC_DSH_VENDAS"
                       file="/dashboards/xyz_vendas.json"
                       description="Vendas"/>
        </folder>
    </menu>
</metadados>
```

## Diferenças entre filhos de menu

| Componente | UI gerada de... | Quando escolher |
|------------|----------------|-----------------|
| `<dynamicForm>` | `<instance>` da tabela | CRUD padrão sem código |
| `<dynamicTreeView>` | `<instance>` de `<treeTable>` | CRUD com tree-view (hierarquia) |
| `<ui>` | Arquivo `.xhtml5` próprio | Layout/lógica custom além de CRUD |
| `<dashboard>` | Arquivo de dashboard JSON | Gráficos, KPIs, painéis analíticos |
| `<pastaNativa>` | Estrutura nativa Sankhya | Adicionar a `Configurações` existente |

## Anti-patterns

- [ ] **Aninhar `<menu>` dentro de `<menu>`** — `<menu>` é só raiz da nav bar. Use `<folder>` para hierarquia.
- [ ] Usar prefixo `AD_` em `id` — reservado para Sankhya core. Usar `<PRX>_` do projeto.
- [ ] IDs duplicados (mesmo `id` em `<folder>`/`<ui>`/etc.) — causa falha de renderização
- [ ] `icon` com path quebrado — menu aparece sem ícone
- [ ] Menus/folders vazios sem filhos — UI confusa para o usuário
- [ ] Misturar definição de `<menu>` no mesmo XML de `<table>` — separar arquivos
- [ ] Criar `<menu>` dedicado para 1-2 telas isoladas — usar `<pastaNativa>` em `<nativeFolder>`
- [ ] Esquecer `<acesso>` em `<ui>` que faz operações sensíveis — sem permissões, qualquer usuário acessa
- [ ] Conflito de `id` com entidade nativa Sankhya (`Produto`, `Parceiro`, etc.)

## Boas práticas

- ID segue padrão `<PRX>_MENU_<MOD3>` para `<menu>`, `<PRX>_FLD_<CTX>` para `<folder>`, `<PRX>_FORM_<CTX>` para `<dynamicForm>`, `<PRX>_UI_<CTX>` para `<ui>`
- `description` clara, em português, voltada ao usuário final
- Estrutura típica: `<menu>` → folders por categoria (Cadastros / Movimentos / Consultas / Dashboards) → forms/uis específicos
- Arquivo XML separado: `datadictionary/<PRX><MOD3>_MENU.xml` só com `<menu>`
- Declarar `<acesso>` em `<ui>` que fazem ações sensíveis (cancelar, liberar, deletar, etc.)
- Usar `<paramMenuAtivo>` para gating por feature flag/parâmetro Sankhya — permite habilitar/desabilitar item via parametrização sem novo deploy
- Usar `<filterExpression>` em `<dynamicForm>` para visões pré-filtradas (ex.: "Atendimentos Abertos", "Pedidos Cancelados")
- Ícone PNG/SVG em `/src/main/resources/assets/` — referenciar via `/$ctx/assets/<arquivo>`

## Related references

- [`dynamic-form.md`](dynamic-form.md) — `<dynamicForm>` em detalhe (atributos, geração da UI, integração com `<instance>`)
- [`tree-table.md`](tree-table.md) — `<treeTable>` para usar com `<dynamicTreeView>`
- [`filters.md`](filters.md) — `<filters>` aparecem automaticamente em telas geradas pelo `<dynamicForm>`
