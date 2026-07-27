# sk-datagrid — componente de grade

Grade tabular principal do sankhya-js. Acoplada a um `sk-dataset` (ou a um objeto standalone) e exposta como controller via `attrs.id`, callback `sk-on-datagrid-loaded` ou registro em `SkComponentRegistry`.

Para o comportamento do dataset subjacente (listeners, standalone, eventos), veja [dataset.md](dataset.md).

---

## Arquitetura — tres backends

A diretiva sk-datagrid seleciona o controller em tempo de `compile` via atributo:

| Atributo no elemento | Controller | Template |
|----------------------|------------|----------|
| (nenhum — default) | `SkAgGridController` | `datagrid.aggrid.tpl.html` |
| `uigrid` | `SkDataGridController` | `datagrid.tpl.html` (ui-grid) |
| `jqx` | `SkJqxDataGridController` | `datagrid.jqx.tpl.html` |

O motor canonico e AG-Grid. `uigrid`/`jqx` sao paths legados mantidos.

---

## Como vincular ao dataset

### 1. Dataset existente (padrao mais comum)

```html
<sk-datagrid id="gridContrato" flex
             sk-dataset="ctrl.dsContrato"
             sk-config-name="{{ctrl.resourceID}}"
             sk-on-datagrid-loaded="ctrl.onDatagridLoaded(datagrid)"
             sk-editable="false"
             sk-datagrid-interceptor="ctrl">
    <sk-datagrid-custom-column sk-field-name="PARCELAFAT"
                               sk-visible="ctrl._exibeParcelaFat"/>
</sk-datagrid>
```

### 2. Standalone a partir de objeto

```html
<sk-datagrid sk-standalone-dataset-object="indicador['DADOS']"
             sk-on-datagrid-loaded="ctrl.onDatagridLoadeIndicadores(datagrid)"
             sk-allow-multiple-selection="false"
             sk-editable="false" flex>
</sk-datagrid>
```

No linker, `DatasetUtils.buildDatasetStandaloneAtObject(obj, scope)` cria o dataset e chama `initAndRefresh()`.

---

## Como expor o controller do grid

Tres formas, nao mutuamente exclusivas:

| Forma | Quando usar |
|-------|-------------|
| `attrs.id="x"` — publica no `$scope.$parent[x]` | Acessar direto do mesmo controller (ex.: `$scope.gridContrato.refreshView()`) |
| `sk-on-datagrid-loaded="fn(datagrid)"` | Precisa esperar o grid montar antes de tocar a API |
| `SkComponentRegistry.register(...)` no controller pai | Compartilhar entre controllers distantes (popup filho, wizard) |

---

## Atributos principais (diretiva `sk-datagrid`)

Todos opcionais exceto `sk-dataset` (ou `sk-standalone-dataset-object`).

### Dataset/config

| Atributo | Tipo | Uso |
|----------|------|-----|
| `sk-dataset` | `=` | Dataset instance |
| `sk-standalone-dataset-object` | `=` | Objeto que vira dataset standalone |
| `sk-config-name` | `@` | Nome da config persistida no backend |
| `sk-datagrid-interceptor` | `=` | Objeto com metodos ganchos (valida, formata, etc.) |
| `sk-on-datagrid-loaded` | `&` | Callback apos grid montar — recebe `datagrid` |
| `sk-on-datagrid-init` | `&` | Callback na inicializacao |

### Selecao / edicao

| Atributo | Default | Uso |
|----------|---------|-----|
| `sk-editable` | depende da config | Habilita edicao inline |
| `sk-allow-multiple-selection` | `false` | Multi-selecao |
| `sk-hide-cbx-column` | `false` | Esconde coluna de checkbox |
| `sk-edit-on-click` | — | Abre edicao ao clicar (em vez de double-click) |
| `sk-auto-clear-edition` | — | Limpa edicao automaticamente |
| `sk-disable-first-select` | — | Desativa selecao automatica da primeira linha |

### Paginacao / busca

| Atributo | Default | Uso |
|----------|---------|-----|
| `sk-disable-pagination` | `false` | **Atencao: pode causar problemas de desempenho** |
| `sk-disable-search` | `false` | Desativa busca |
| `sk-disable-sorting` | `false` | Desativa ordenacao |
| `sk-enable-toolpanel` | — | Habilita painel lateral de ferramentas |

### Drag & drop

`sk-drag-enabled`, `sk-drop-enabled`, `sk-drag-field-presentation`, `sk-drag-start`, `sk-drag-enter`, `sk-drag-over`, `sk-drop`, `sk-drag-end`, `sk-drop-tree` — todos em :180-188.

### Modo arvore

Combinar ambos:

```html
<sk-datagrid sk-dataset="ctrl.ds"
             sk-key-property="CODIGO"
             sk-parent-property="CODPAI">
</sk-datagrid>
```

### Eventos de linha / celula

`sk-on-dbl-click`, `sk-on-click`, `sk-click-row-focus`, `sk-fn-save-row-on-enter`, `sk-fn-save-row-on-arrow-down`, `sk-fn-save-on-click`, `sk-new-row-on-tab`, `sk-new-row-on-arrow-down`, `sk-enter-as-tab`, `sk-arrow-focus-field`, `sk-nextrow-aftersave`, `sk-focus-out` — ver :164-216.

---

## API do controller (`SkAgGridController`)

### Navegacao / selecao

| Metodo | Uso |
|--------|-----|
| `previousRow()` / `nextRow()` | Mover linha atual |
| `hasPrevious()` / `hasNext()` | Checar limites |
| `selectNodeByIndex(index)` | Selecionar linha por indice |
| `selectAllRecords()` | Selecionar todas |
| `unselectAllSelectedRows()` | Limpar selecao |
| `setSelectedRecords(records)` | Forcar conjunto de selecao |
| `getSelectedRecords()` | Array de registros selecionados |
| `syncSelectOnDataset()` | Sincronizar selecao com dataset |
| `isAllowMultipleSelection()` | Flag atual |
| `setAllowMultipleSelection(bool)` | Alternar |

### Edicao

| Metodo | Uso |
|--------|-----|
| `startEdit()` / `endEdit()` | Abrir/fechar editor |
| `setNextFocusCell(...)` | Programar proximo foco |
| `tabToNextEditableRow()` / `tabToNextEditableCell()` | Navegacao tab |
| `setAwaitSaveToEdit(bool)` | Esperar save antes de editar |
| `getEditorOpenned()` | Editor aberto? |
| `addCustomCellRenderer(columns, renderer)` | Renderer custom por coluna |
| `addCustomEditorRenderer(columns, renderer)` | Editor custom por coluna |

### Colunas

| Metodo | Uso |
|--------|-----|
| `getColumnByName(name)` | Coluna por nome de campo |
| `getColumnDefs()` / `setColumnDefs(defs)` | Defs AG-Grid |
| `getOriginalColumnDefs()` | Defs originais (antes de mods) |
| `getVisibleColumnDefs()` | Apenas colunas visiveis |
| `addCustomColumnMD(md)` | **Usado por `sk-datagrid-custom-column`** |
| `pinColumn(col)` / `unpinColumn(col)` | Pin/unpin |
| `setGroupColumn(col)` / `setGroupColumns(cols)` | Agrupamento |
| `setOrderColumn(col, dir)` | Ordenacao programatica |
| `updateGridColumn(col)` | Forcar atualizacao |
| `resetColumnWidths()` | Reset de largura |
| `getColumnWidth(col)` | Largura atual |
| `getCurrentColIndexByColumnDef(def)` | Index da coluna atual |
| `getCurrentColByFieldName(name)` | Col atual por nome |

### Filtro / busca

| Metodo | Uso |
|--------|-----|
| `getFilterFunction()` | Funcao filtro ativa |
| `setFilterByColumn(col, filter)` | Aplicar filtro |
| `getFilterByColumn(col)` | Filtro atual |
| `getFilterInfoColumn(col)` | Metadados do filtro |
| `removeFilterByColumn(col)` | Remover |
| `clearSearchOfCols()` | Limpar buscas |
| `disableSearch(bool)` | Toggle runtime |
| `setEnableFilterDatePeriod(bool)` | Filtro por periodo |

### Refresh / estado

| Metodo | Uso |
|--------|-----|
| `refreshView()` | Re-render completo |
| `refreshCells()` | Re-render de celulas |
| `refreshLayout()` | Ajustar layout |
| `setViewModeToLoaded()` / `setViewModeToLoading()` | Estado visual |
| `initializeDatagrid()` | Inicializacao explicita |
| `updateGridOptions(opts)` | Atualizar opcoes AG-Grid |
| `setEnabled(bool)` | Habilitar/desabilitar grid todo |

### Menu / configuracao

| Metodo | Uso |
|--------|-----|
| `openGridConfig()` | Abre dialogo de configuracao |
| `startTour()` | Inicia tour guiado |
| `openGridMenu()` / `closeGridMenu()` | Menu lateral |
| `openToolPanel()` / `closeToolPanel()` | Tool panel AG-Grid |
| `setCompactMode(bool)` | Modo compacto |
| `hasCbxColumn()` | Tem coluna checkbox? |
| `isEnableDynamicMode()` | Flag de modo dinamico |

### Dados

| Metodo | Uso |
|--------|-----|
| `getDataset()` | Dataset vinculado |
| `getRecords()` | Todos os registros |
| `setBottomData(data)` | Linha "pinned" no rodape |
| `dropSelectedRow()` | Remove linha selecionada |

### AG-Grid interno (use com cuidado)

`getGridApi()`, `getColumnApi()`, `getGridOptions()` — expoem API nativa AG-Grid. Util para casos nao cobertos, mas foge do contrato do sankhya-js.

### Listener

```javascript
datagrid.addGridReadyListener(function() {
    // grid pronto, api disponivel
});
```

**Atencao: nao retorna funcao de desregistro** — a funcao fica na fila ate a proxima inicializacao. Evitar em fluxos que reabrem a tela.

---

## Integracao com dataset (observer)

O grid se auto-registra como `DatasetObserver` no dataset vinculado, via o contrato `allEvents`/`refreshed`/`currentLineChanged`/etc. documentado em [dataset.md](dataset.md). Handlers automaticos em :2751-2759:

```javascript
_self.refreshed                 = onDatasetRefresh;
_self.currentLineChanged        = onDatasetCurrentLineChanged;
_self.editionCanceled           = editionCanceled;
_self.dataSaved                 = dataSaved;
_self.allEvents                 = onAllEvents;
_self.cleared                   = onDatasetCleared;
_self.currentRecordRefreshed    = currentRecordRefreshed;
_self.insertionModeActivated    = insertionModeActivated;
_self.insertionCanceled         = insertionCanceled;
```

Implicacao pratica: o grid responde a eventos do dataset automaticamente — nao e necessario chamar `refreshView()` manualmente apos `ds.refresh()`, `ds.saveRecord()`, `ds.addRecord()`, etc.

---

## Custom columns (`sk-datagrid-custom-column`)

Diretiva filha para sobrescrever ou acrescentar propriedades de coluna. Pode existir dentro de `sk-datagrid` ou `sk-dynaform`.

| Atributo | Reativo | Uso |
|----------|---------|-----|
| `sk-field-name` | nao (obrigatorio) | Nome do campo no dataset. Suporta multiplos separados por virgula |
| `sk-description` | sim (`$observe`) | Label — passa por i18n |
| `sk-visible` | sim (`$watch`) | Expressao booleana |
| `sk-enabled` | sim (`$watch`) | Expressao booleana de edicao |
| `sk-text-align` | nao | `'right'`, `'left'` ou `'center'` (outros valores ignorados) |
| `sk-cell-formatter` | nao | `function(col, value, record)` — valor da celula |
| `sk-check-box-formatter` | nao | Para colunas checkbox |
| `sk-custom-sort` | nao | Funcao de comparacao |
| `sk-live-check` | nao | Flag booleana |
| `width` | nao | Largura inicial |

Exemplo real.

```html
<sk-datagrid sk-dataset="ctrl.dsDetalhesFinanceiros" sk-only-custom flex>
    <sk-datagrid-custom-column sk-field-name="VLRDESDOB"
                               sk-width="100"
                               sk-text-align="right"
                               sk-cell-formatter="ctrl.buildLabelValorDesdob"/>
    <sk-datagrid-custom-column sk-field-name="DTVENC" sk-width="140"/>
</sk-datagrid>
```

`sk-only-custom` no `sk-datagrid` instrui a grade a renderizar **apenas** as colunas declaradas explicitamente (ignorar as do dataset). Caso contrario, custom columns apenas sobrescrevem — nao restringem.

---

## Custom renderers (`sk-cell-renderer` / `sk-editor-renderer`)

Filhos do `sk-datagrid` para injetar renderizacao/editor HTML5 custom por coluna. Processados via `eval` — a tag `<script columns="NOME_COL">` deve conter `function renderer() { return { getGui, refresh, destroy } }`.

```html
<sk-datagrid sk-dataset="ctrl.dataset">
    <sk-cell-renderer>
        <script columns="ICO">
            function renderer() {
                return {
                    getGui: function(params, originalItem, scope, utils) {
                        return utils.createDirective('sk-icon',
                            { 'font-icon': scope.dataset.getFieldValue('ICO') }, scope);
                    },
                    refresh: function(params) { return true; },
                    destroy: function() {}
                };
            }
        </script>
    </sk-cell-renderer>
</sk-datagrid>
```

Atencao: o conteudo da tag `<script>` e **executado via `eval()`** no linker — erros de sintaxe nao aparecem no compile, so no momento do linker; evitar fechar escopo sobre variaveis externas nao-serializaveis.

---

## Configuracao persistida (`sk-config-name`)

Quando `sk-config-name` e informado, a grade carrega/grava configuracao (colunas visiveis, ordem, filtros) persistida no backend. O botao de configuracao so aparece se o usuario tiver a permissao `ACCESS_CONTROL_CONFIG_GRID` — checagem via `SkApplication.hasAuthorization(MGEAuthorizationConstants.ACCESS_CONTROL_CONFIG_GRID)`.

Padrao comum: usar `{{ctrl.resourceID}}` para isolar config por tela:

```html
sk-config-name="{{ctrl.resourceID}}"
sk-config-name="GrdCfgCpl:{{ctrl.resourceID}}"   <!-- prefixo para grade secundaria na mesma tela -->
```

---

## Componentes de apoio da grade

Nao vem dentro do `sk-datagrid` — voce coloca no toolbar/rodape da tela e liga no mesmo dataset (ou no controller do grid).

### `sk-rows-counter` — contador de linhas

components/rowscounter/rowscounter.directive.js.

```html
<sk-rows-counter sk-dataset="ctrl.dataset" sk-on-click="ctrl.abrirDetalhe()"></sk-rows-counter>
```

| Atributo | Tipo | Uso |
|---|---|---|
| `sk-dataset` | `=?` | dataset observado |
| `sk-on-click` | `&?` | clique no contador |
| `lines-limit` | `<` | acima de `0`, pinta o contador em alerta e mostra o icone de triangulo |

Escuta `BACKGROUND_LOAD_START`/`BACKGROUND_LOAD_END` do dataset: durante a paginacao em background exibe um pop com link **cancelar**, que chama `dataset.cancelPagination()`. A contagem vem de `$watchCollection('dataset.getRecords()')` — e o que ja foi carregado, nao o total da consulta.

### `sk-grid-config` — colunas visiveis

components/gridconfig/gridconfig.directive.js.

```html
<sk-grid-config sk-config-name="<PRX>MinhaGrade"
                sk-available-columns-standard="CODIGO, DESCRICAO, DTALTER">
</sk-grid-config>
```

| Atributo | Tipo | Uso |
|---|---|---|
| `sk-config-name` | `@` | id da configuracao persistida — observado, pode trocar em runtime |
| `sk-available-columns-standard` | `@?` | lista separada por virgula das colunas oferecidas por padrao |
| `sk-selected-columns-grid` | `&?` | devolve as colunas escolhidas ao abrir |
| `sk-tooltip-placement` | `@?` | posicao do tooltip |
| `uigrid` | attr | monta a instancia no modo do backend uigrid |

O botao so aparece se o usuario tiver a autorizacao `ACCESS_CONTROL_CONFIG_GRID` (`SkApplication.instance().hasAuthorization`); antes de a autorizacao carregar, o default e liberar. No `$destroy` a instancia faz `unregistry()`.

### `GridStatistics` — soma e media das colunas numericas

components/gridstatistics/gridstatistics.service.js. Service, nao diretiva:

```javascript
GridStatistics.openGridStatistics(ctrl.datagrid);   // controller do grid, nao o dataset
```

Abre um `SanPopup` com uma linha por coluna **visivel** de `dataType` `'I'` ou `'F'`, trazendo `COLUNA`, `SOMA`, `MEDIA`, `OCORRENCIAS`, `MAIOR`, `MENOR`. Com a grade vazia, mostra o alerta `DataGrid.gradeVazia` e nao abre.

---

## Gotchas

### 1. `addGridReadyListener` nao retorna deregister

A funcao e empilhada em `_gridReadyListeners` e nunca removida por API publica. Em fluxos que montam/desmontam o grid varias vezes (ex.: tabs lazy, popups reabertos), preferir `sk-on-datagrid-loaded`.

### 2. Selecao multipla desligada por default

`sk-allow-multiple-selection` nao informado = so selecao unica. Checado em :5427-5429.

### 3. `sk-disable-pagination` tem custo

A propria diretiva alerta: `"Atenção: desabilitar a paginação pode causar sérios problemas de desempenho."`.

### 4. `sk-only-custom` muda semantica

Sem `sk-only-custom`, custom columns complementam as automaticas (via metadata do dataset). Com, a grade so renderiza o que foi declarado — esquecer pode gerar grade vazia.

### 5. Troca de backend via atributo

Adicionar `jqx` ou `uigrid` no elemento muda o controller (`SkJqxDataGridController` / `SkDataGridController`) e a API publica e diferente. Codigo escrito assumindo AG-Grid quebra em silencio quando o atributo estiver presente.

### 6. `$element.data('$skDatagridController', this)`

O controller e tambem acessivel via `$element.data('$skDatagridController')` — util para codigo de baixo nivel que tem o elemento DOM mas nao o escopo.

### 7. Custom renderer via `eval()`

O `<script>` dentro de `sk-cell-renderer`/`sk-editor-renderer` e executado com `eval()` no momento do linker. Erros de sintaxe nao sao detectados no compile. Evitar referencias a closures externos alem do que vem em `scope` e `utils`.

### 8. Handlers de dataset sao setados automaticamente

Nao sobrescrever `grid.refreshed`, `grid.dataSaved`, etc. — esses slots sao usados pelo proprio controller para reagir a eventos do dataset.

### 9. A media do `GridStatistics` divide pelo total de linhas

No calculo, `occurrences++` esta fora do `if (!isNaN(fieldValue))`: linha com valor nulo, vazio ou nao numerico nao entra na soma mas entra no divisor. Em coluna com muitos vazios a media sai menor do que a media dos valores preenchidos — e `OCORRENCIAS` e a contagem de linhas, nao de valores.

### 10. Estatistica e contador enxergam so o que ja foi carregado

`GridStatistics` usa `datagrid.getDataset().getRecordsAsObject()` e `sk-rows-counter` observa `dataset.getRecords()`. Com paginacao ligada (o default), os dois refletem as paginas ja trazidas — nao o total da consulta. Total real vem do backend.

---

## Checklist de triagem para bugs de grade

- [ ] Qual backend? Default aggrid, mas `jqx` ou `uigrid` mudam o controller.
- [ ] Grade esta recebendo dataset via `sk-dataset` ou `sk-standalone-dataset-object`?
- [ ] Se o controller do grid e acessado, foi via `attrs.id`, `sk-on-datagrid-loaded` ou `SkComponentRegistry`? Order de inicializacao correta?
- [ ] `sk-only-custom` esta presente? Entao so renderiza colunas explicitas.
- [ ] Selecao multipla requer `sk-allow-multiple-selection="true"` explicito.
- [ ] `refresh()` sincrono apos `ds.saveRecord()` nao e necessario — grid observa dataset.
- [ ] Em grade editavel, checar `sk-editable`, `sk-fn-save-row-on-enter`, `sk-new-row-on-tab`.
- [ ] Custom column invisivel em producao? Checar expressao de `sk-visible` no controller.
- [ ] Grade com permissao de config? So aparece se `ACCESS_CONTROL_CONFIG_GRID` autorizada.
