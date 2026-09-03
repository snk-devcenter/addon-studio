# Menu (`<menu>`) — Data Dictionary

Define ponto de entrada na barra de navegação principal do Sankhya Om. Container hierárquico para `<folder>`, `<dynamicForm>`, `<dynamicTreeView>`, `<ui>`, `<dashboard>`, `<pastaNativa>`.

> **Regra que derruba deploy:** todo `<ui>` e todo `<folder>` — e todo `<dynamicForm>`/`<dynamicTreeView>`/`<dashboard>` — leva `resourceId` explícito de no máximo 50 caracteres. O XSD deixa o atributo opcional; trate como obrigatório. Sem ele o `NOME` gravado em `TRDCON` recebe o prefixo do contexto do add-on, estoura os 50 caracteres da coluna e **o módulo inteiro não carrega**. Ver [`resourceId` e o teto de 50](#resourceid--obrigatório-na-prática-teto-de-50-em-trdconnome).

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
        <folder id="TDC_FLD_CADASTROS" resourceId="TDC_FLD_CADASTROS" description="Cadastros">
            <!-- Atendimento e Departamento sao <table> regulares -->
            <dynamicForm id="TDC_FORM_ATD"
                         resourceId="TDC_FORM_ATD"
                         instance="TdcXyzAtendimento"
                         description="Atendimentos"/>
            <dynamicForm id="TDC_FORM_DEP"
                         resourceId="TDC_FORM_DEP"
                         instance="TdcXyzDepartamento"
                         description="Departamentos"/>
            <!-- Centro de Custo eh <treeTable> hierarquica - usar dynamicTreeView -->
            <dynamicTreeView id="TDC_TREE_CCU"
                             resourceId="TDC_TREE_CCU"
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
<folder id="TDC_FLD_CADASTROS" resourceId="TDC_FLD_CADASTROS" description="Cadastros">
    <folder id="TDC_FLD_CAD_BASICOS" resourceId="TDC_FLD_CAD_BASICOS" description="Cadastros Basicos">
        <dynamicForm id="TDC_FORM_CCU" resourceId="TDC_FORM_CCU" instance="TdcXyzCentroCusto" description="Centro de Custo"/>
        <dynamicForm id="TDC_FORM_DEP" resourceId="TDC_FORM_DEP" instance="TdcXyzDepartamento" description="Departamento"/>
    </folder>
    <folder id="TDC_FLD_CAD_AVANCADOS" resourceId="TDC_FLD_CAD_AVANCADOS" description="Cadastros Avancados">
        <dynamicForm id="TDC_FORM_CFG" resourceId="TDC_FORM_CFG" instance="TdcXyzConfiguracao" description="Configuracoes"/>
    </folder>
</folder>
```

| Atributo | Obrigatório | Descrição |
|----------|:-----------:|-----------|
| `id` | Sim | Pattern `[a-zA-Z0-9_.-]+`, único no plugin |
| `description` | Sim | Label do submenu |
| `resourceId` | Opcional no XSD, **obrigatório na prática** | Recurso para controle de permissão. Máx. 50 caracteres. Sem ele o `NOME` em `TRDCON` vira `<domain>.<id>` e pode estourar a coluna — ver [teto de 50](#resourceid--obrigatório-na-prática-teto-de-50-em-trdconnome) |
| `license` | Não | Licença |

## `<ui>` — tela custom (xhtml5)

Usa quando UI não pode ser gerada declarativamente (gráficos, layouts custom, fluxos não-CRUD):

```xml
<folder id="TDC_FLD_RELATORIOS" resourceId="TDC_FLD_RELATORIOS" description="Relatorios">
    <ui id="TDC_UI_RPT_XYZ"
        resourceId="TDC_UI_RPT_XYZ"
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
| `resourceId` | Opcional no XSD, **obrigatório na prática** | Recurso de permissão. Máx. 50 caracteres. Sem ele o `NOME` em `TRDCON` vira `<domain>.<id>` e pode estourar a coluna — ver [teto de 50](#resourceid--obrigatório-na-prática-teto-de-50-em-trdconnome) |
| `license` | Não | Licença |

Filhos: `<acesso>` (0..N), `<properties>` (controlproperties).

## `resourceId` — obrigatório na prática (teto de 50 em `TRDCON.NOME`)

O XSD marca `resourceId` como opcional em `<ui>`, `<folder>`, `<dynamicForm>`, `<dynamicTreeView>` e
`<dashboard>`. Na prática ele é obrigatório: **sem `resourceId`, um único item de menu com `id` longo
impede o add-on inteiro de carregar.**

### O que o import grava

Cada nó de menu vira um controle na `TRDCON`:

```sql
INSERT INTO TRDCON (NUCONTROLE, NOME, DESCRCONTROLE, TIPOCONTROLE, TIPOFILHOS, CONTROLE, DOMAIN)
```

O valor de `NOME` sai de uma de duas formas:

| Nó no XML | `NOME` gravado |
|-----------|----------------|
| **com** `resourceId` | o `resourceId`, puro |
| **sem** `resourceId` | `<domain>.<id>` — `domain` é o nome do contexto do add-on |

O prefixo é aplicado mesmo existindo coluna `DOMAIN` própria no insert. Não conte com ela: quem sofre o
limite é o `NOME`.

### O teto: `VARCHAR2(50)`

`TRDCON.NOME` é `VARCHAR2(50)` na plataforma. Medido num banco de produção — todo domínio do produto
cabe, com zero de folga em vários deles:

| `DOMAIN` | controles de menu | maior `NOME` |
|----------|------------------:|-------------:|
| `mge` | 1115 | 50 |
| `mgepes` | 167 | 50 |
| `mgeliv` | 107 | 50 |
| `mgecontab` | 82 | 50 |
| `mgeprod` | 68 | 50 |
| `mgewms` | 63 | 49 |

Seis add-ons de terceiros no mesmo banco: todos ≤ 49. O único a passar de 50 foi um add-on com 129
controles — e ele quebrou.

### O orçamento do `id` quando falta `resourceId`

```
len(id) <= 50 - len(domain) - 1
```

| Contexto do add-on | `len(domain)` | Orçamento do `id` |
|--------------------|--------------:|------------------:|
| 6 caracteres | 6 | 43 |
| 12 caracteres | 12 | 37 |
| 20 caracteres | 20 | 29 |

Com contexto de 12 caracteres o orçamento é **37, não 50**. Um `id` de 47 caracteres — perfeitamente
válido isolado, dentro do pattern e abaixo de 50 — vira `NOME` de 60 e estoura.

### Modo de falha: o módulo não carrega

Não é degradação parcial nem item de menu faltando. Um caractere a mais em **um** nó e o add-on inteiro
fica fora:

```
ORA-12899: valor muito grande para a coluna "SANKHYA"."TRDCON"."NOME" (real: 60, máximo: 50)
  -> DataDictionaryInsertException
  -> ModuleBootLoaderException
  -> [SANMODULE] Erro ao inicializar módulo. O módulo não será carregado.
```

### Por que build e deploy local não pegam

- O `metadados.xsd` não declara `maxLength` em `idType` nem em `textType`. `id` e `resourceId` de
  qualquer tamanho validam, e o build passa.
- **Base de desenvolvimento pode ter a coluna com 60**, não 50. Um `deployAddon` local com `NOME` de
  exatamente 60 passa raspando, margem zero, e o mesmo pacote quebra no ambiente do cliente.
  **Ambiente local não é teste válido para esse limite** — o que vale é contar os caracteres de cada
  `resourceId` no XML.

### O fix é dar `resourceId`, não encurtar o `id`

Com `resourceId` o `NOME` é o `resourceId` puro, sem prefixo de domínio, e o orçamento volta a ser os 50
inteiros. Encurtar o `id` trata o sintoma, deixa o `NOME` dependente do tamanho do contexto e quebra a
convenção observada em produção: **119 de 129 nós usam `id` igual ao `resourceId`**. Repetir o valor nos
dois atributos deixa o `NOME` gravado previsível a partir do XML — é o padrão usado nos exemplos deste
arquivo.

## `<acesso>` — controle de permissão

Define níveis de acesso (roles/perfis) para a tela. Cada `<acesso>` vira uma permissão específica que admin pode atribuir a perfis de usuário:

```xml
<ui id="TDC_UI_PEDIDOS" resourceId="TDC_UI_PEDIDOS" url="..." description="Pedidos">
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
<folder id="TDC_FLD_DASHBOARDS" resourceId="TDC_FLD_DASHBOARDS" description="Dashboards">
    <dashboard id="TDC_DSH_VENDAS"
               resourceId="TDC_DSH_VENDAS"
               file="/dashboards/vendas.json"
               description="Dashboard de Vendas"/>
</folder>
```

| Atributo | Obrigatório | Descrição |
|----------|:-----------:|-----------|
| `id` | Sim | Identificador único |
| `file` | Sim | Path do arquivo de definição (em `/dashboards/`) |
| `description` | Sim | Label |
| `resourceId` | Opcional no XSD, **obrigatório na prática** | Máx. 50 caracteres — ver [teto de 50](#resourceid--obrigatório-na-prática-teto-de-50-em-trdconnome) |
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
                         resourceId="TDC_FORM_CCU"
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
<dynamicForm id="TDC_FORM_ATD" resourceId="TDC_FORM_ATD" instance="TdcXyzAtendimento" description="Atendimentos">
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

        <folder id="TDC_FLD_CADASTROS" resourceId="TDC_FLD_CADASTROS" description="Cadastros">
            <!-- Departamento eh <table> regular -->
            <dynamicForm id="TDC_FORM_DEP"
                         resourceId="TDC_FORM_DEP"
                         instance="TdcXyzDepartamento"
                         description="Departamento"/>
            <!-- Centro de Custo eh <treeTable> - usar dynamicTreeView -->
            <dynamicTreeView id="TDC_TREE_CCU"
                             resourceId="TDC_TREE_CCU"
                             instance="TdcXyzCentroCusto"
                             description="Centro de Custo"/>
        </folder>

        <folder id="TDC_FLD_MOVIMENTOS" resourceId="TDC_FLD_MOVIMENTOS" description="Movimentos">
            <dynamicForm id="TDC_FORM_ATD"
                         resourceId="TDC_FORM_ATD"
                         instance="TdcXyzAtendimento"
                         description="Atendimentos">
                <properties>
                    <filterExpression>STATUS &lt;&gt; 'CANCELADO'</filterExpression>
                </properties>
            </dynamicForm>
        </folder>

        <folder id="TDC_FLD_CONSULTAS" resourceId="TDC_FLD_CONSULTAS" description="Consultas">
            <ui id="TDC_UI_REL_PROD"
                resourceId="TDC_UI_REL_PROD"
                url="/$ctx/addon/xyz/relatorio_produtividade.xhtml5"
                description="Relatorio de Produtividade">
                <acesso description="Visualizar" acronym="VIS" sequence="1"/>
                <acesso description="Exportar" acronym="EXP" sequence="2"/>
            </ui>
        </folder>

        <folder id="TDC_FLD_DASHBOARDS" resourceId="TDC_FLD_DASHBOARDS" description="Dashboards">
            <dashboard id="TDC_DSH_VENDAS"
                       resourceId="TDC_DSH_VENDAS"
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

- [ ] **Nó de menu sem `resourceId`** — o `NOME` gravado em `TRDCON` passa a ser `<domain>.<id>`, o orçamento do `id` cai para `50 - len(domain) - 1` e um `id` longo derruba o carregamento do módulo inteiro. Ver [teto de 50](#resourceid--obrigatório-na-prática-teto-de-50-em-trdconnome).
- [ ] **`resourceId` com mais de 50 caracteres** — mesma `ORA-12899`, mesmo módulo fora do ar.
- [ ] **Validar o limite só no `deployAddon` local** — base de desenvolvimento pode ter `TRDCON.NOME` com 60. Contar caracteres no XML é o único teste que vale.
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
- `resourceId` explícito em **todo** nó de menu, com o mesmo valor do `id` e no máximo 50 caracteres — é a convenção de produção e a única forma de o `NOME` em `TRDCON` não depender do tamanho do contexto do add-on
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
