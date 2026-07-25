# sankhya-js — `sk-form`, `sk-dynaform`, `sk-form-custom-item`

Tres componentes de formulario. `sk-dynaform` e a cabeca de tela de entidade (orquestra dataset + form + grid + filter + tree). `sk-form` renderiza campos a partir de propriedades ou dataset. `sk-form-custom-item` sobrescreve propriedades/renderizacao de campos especificos dentro de um `sk-form`.

---

## 1. `sk-form`

### Atributos de scope

Definidos:

| Atributo | Binding | Proposito |
|----------|---------|-----------|
| `sk-dataset` / `dataset` | `=?` | Dataset de onde vem os campos |
| `properties` | `=?` | Alternativa ao dataset: array de `fields` (`label`, `fieldName`, `value`, `type`, `required`, `groupName`, `fieldProp`) |
| `model` | `=` | Modelo bidirectional quando nao ha dataset |
| `sk-only-custom` (attr) | flag | Renderiza apenas `sk-form-custom-item` filhos, ignora metadados do dataset |
| `columns` / `sk-columns` | `@` | 1, 2, 3, 4 ou 6 colunas (padrao 1) |
| `sk-inline` | `@` | `true` forca 1 coluna (padrao flex) |
| `sk-fields-order` | `=?` | Array com a ordem dos `fieldName` |
| `sk-required-fields` | `=?` | Array de campos adicionalmente requeridos |
| `sk-field-interceptor` | `=` | Interceptor por campo |
| `sk-form-interceptor` | `=` | Interceptor de form (ver secao Interceptors) |
| `sk-on-form-loaded` | `&?` | Callback com `form` (o controller) ao carregar |
| `sk-model-change` | `&?` | Disparado ao mudar modelo (modo properties) |
| `sk-on-create-field` | `&?` | Invocado apos criar cada campo |
| `sk-allow-repeated-fields` | `@` | Permite mesmo `fieldName` em multiplos custom items |
| `sk-form-config-column-key` | `@?` | Chave para persistir configuracao de colunas |
| `sk-form-column-number-config` | `@?` | Config especifica de numero de colunas |

Requires opcional: `^?skDynaform`. Quando dentro de um `sk-dynaform`, a chave de configuracao de coluna e obtida via `getFormColConfig()` automaticamente.

### API publica do `SkFormController`

Expostos em `self.*`:

- `registryField(fieldCtrl)` — usado pelo `sk-form-item` internamente para se inscrever no form.
- `highlightFields(fieldNames, kind)` / `unHighlightFields(fieldNames, kind)` — destaque visual (ex.: campos requeridos nao preenchidos). `FormHighlithKind` injetado.
- `updateFieldLabelWidth(fieldName)` / `updateFieldsLabelWidth()` — recalcula largura do label.
- `isFormInline()` — `true` quando `sk-inline='true'`.
- `getModel()` — retorna o modelo atual (util no modo `properties`).
- `getFieldController(fieldName)` — **assincrono**, retorna promise que resolve com o controller do `sk-form-item` correspondente (use sempre `.then`).
- `showFieldTooltip(fieldName, msg)` — tooltip programatico no campo.
- `addCustomFormItem(fieldName, element)` / `getCustomFormItem(fieldName)` — registra/consulta custom items programaticamente.
- `setFieldProperty(fieldName, prop, value)` — altera propriedade (ex.: `visible`, `enabled`, `required`).
- `setFieldFocus(fieldName)` — foco programatico.
- `loaddedFromConfig` (flag) — `true` se a configuracao de campos veio de persistencia.

### Obter referencia ao controller

Tres formas:

```html
<!-- 1. Via atributo id (captura no $parent) -->
<sk-form id="myForm" sk-dataset="ctrl.ds"></sk-form>

<!-- 2. Via sk-on-form-loaded -->
<sk-form sk-dataset="ctrl.ds" sk-on-form-loaded="ctrl.onFormLoaded(form)"></sk-form>
```

```javascript
// 3. Via SkComponentRegistry, caso o form esteja registrado
SkComponentRegistry.get('myForm').then(function(form) { ... });
```

---

## 2. `sk-dynaform`

Cabeca de tela de entidade — componente de mais baixo nivel do sankhya-js. Orquestra dataset, form, datagrid, filter panel, tree (hierarquia), abas, navegador, configuracao de tela e bloco de outras opcoes.

### Atributos de scope mais usados

Definidos. Os mais relevantes:

**Entidade / dados**
- `sk-entity-name` (`@`) — nome da entidade (obrigatorio). O dataset interno e criado a partir disso.
- `sk-entity-description` (`@?`) — descricao para detail dynaforms.
- `sk-parent-entity-name` (`&`) — entidade do dataset pai.
- `sk-parent-dynaform` (`=`) — referencia ao dynaform pai (para modo detail).
- `sk-default-mode` (`@`) — `"master"` ou `"detail"`.
- `sk-resource-id` (`@`) — ResourceID (default: o da `sk-application`).
- `sk-additional-criteria` (`=?`) — criteria extra para o request.
- `sk-resolve-pk-entity` (`=?`) — resolve PK via `SkApplication`.

**Layout / UI**
- `sk-form-columns` (`@?`) — maximo de colunas (default 4).
- `sk-form-column-number-config` (`@?`) — chave de config persistida.
- `sk-helper-class-name` (`@`) — FQN da classe Helper backend.
- `sk-recursive-helper` (`=`) — se o helper vale para detail dynaforms.
- `sk-can-back-to-old-layout` (`=`) — botao "voltar ao layout antigo".
- `sk-hide-entity-card` (`=`) — esconde o cartao de chave.
- `sk-skip-start-page` (`=?`) — sem pagina inicial.
- `sk-edit-unique-record` (`=`) — edicao direta em registro unico.
- `sk-hide-tour` (`&?`), `sk-btn-tour-explicito` (`=?`) — tour HTML5.
- `sk-hierarchy` + `sk-tree-search-actived` + `sk-tree-adv-search` + `sk-enable-search-input-hierarchy` + `sk-refresh-dataset-to-tree` — configuracao de hierarquia (sk-tree).

**Callbacks**
- `sk-init-dynaform` (`&`) — antes de `loadMetadata`.
- `sk-on-dynaform-loaded` (`&`) — apos carregar.
- `sk-on-datagrid-loaded` (`&`) — grid pronto.
- `sk-on-datagrid-init` (`&`) — grid inicializando.
- `sk-custom-tabs-loader` (`&`) — retorna array de blocos customizados (`blockId`, `description`, `controller`, `templateUrl`, `eventBus`, `properties`).
- `sk-other-options-loader` (`&`) — carrega opcoes extras.
- `sk-pk-listener` (`&`) — auto-carga PK pelo SkApplication.
- `sk-selected-tab-navigator` (`&`) — aba selecionada mudou.
- `sk-tab-order-function` (`&`) — ordem padrao das abas (so quando nao ha configuracao salva).
- `sk-before-post-config` (`&?`) — true/false para permitir salvar config.
- `sk-filter-panel-apply-function` (`&?`) — custom apply do filter panel.

**Interceptors** (ver secao 4)
- `sk-dynaform-interceptor` (`=?`)
- `sk-datagrid-interceptor` (`=?`)
- `sk-form-interceptor` (`=?`)
- `sk-filter-panel-interceptor` (`=?`)
- `sk-grid-printer-interceptor` (`=?`)

**Flags de botao / visibilidade**
- `sk-show-filter`, `sk-show-search-field`, `sk-show-detail-description`
- `sk-hide-buttons-config`, `sk-hide-button-grid`, `sk-hide-button-favorite`, `sk-hide-button-recents`, `sk-hide-button-entity-attach`
- `sk-hide-entity-search-field`, `sk-hide-form-layout-config`, `sk-hide-number-config`, `sk-hide-custom-filter-panel`
- `sk-suppress-screen-config` — desabilita botao de config **e** impede carregar config salva; diferente de `sk-hide-form-layout-config` que permite carga da config salva.
- `sk-popup-mode` (`=?`) — quando o dynaform e conteudo de um popup.
- `sk-ignore-refresh-config`, `sk-ignored-config-entity`, `sk-ignore-accept-column-entity-name`, `sk-ignore-listener-methods`

### Transclude

O dynaform aceita slots atraves de `<dynaform-{entity-name-dashcase}>`. Tags reconhecidas:

- `sk-left-top-bar` / `sk-right-top-bar` — barras superiores.
- `sk-header-bar` — header.
- `sk-footer-bar` — rodape (exige `height` no elemento filho).
- `sk-footer-filter-bar` — rodape de filtros.
- `sk-custom-filter-panel` — painel de filtros customizado.
- `sk-container-form-grid` — layout form+grid customizado.
- `sk-bottom-grid-panel` — painel abaixo do grid.
- `sk-datagrid-custom-column` — ver [datagrid.md](datagrid.md).

Exemplo:

```html
<sk-dynaform sk-entity-name="Parceiro" sk-resource-id="br.com.sankhya.Parceiros">
  <dynaform-parceiro>
    <sk-right-top-bar>
      <button ng-click="ctrl.extra()">Acao extra</button>
    </sk-right-top-bar>
    <sk-datagrid-custom-column sk-field-name="TIPOPESSOA">
      <!-- override de coluna -->
    </sk-datagrid-custom-column>
  </dynaform-parceiro>
</sk-dynaform>
```

### API publica do `SkDynaformController`

Exposta em `self.*` no controller. ~150 metodos. Agrupados:

**Lifecycle / metadata**
- `loadMetadata()` — carrega metadata inicial.
- `rebuildLayout()` — reconstroi apos mudancas.
- `whenLoaded()` — promise que resolve quando carregado.
- `loadByPK(pk)` — forca carga por PK.
- `addMetadataUpdateListener(fn)` / `addTreeCreatedListener(fn)`.
- `loadFiltersOnCreate()` / `configCopied()`.

**Dataset / dados**
- `getDataset()` — retorna o dataset orquestrado.
- `addFieldDefaultValue(name, value)`.
- `setFieldProperty(name, prop, value)` / `getFieldProperty(name, prop)` / `addFieldPropertyEvaluator(name, fn)`.
- `hasDefaultValue(name)`.
- `setFieldRequireInTab(name, required)`.

**Grid**
- `getGridController()` — `SkAgGridController` do datagrid interno (ver [datagrid.md](datagrid.md)).
- `openGridConfig()` / `forceCloseGridConfig()`.
- `getDatagridInterceptor()`.
- `addCustomColumnMD(md)`.

**Filtro / navegacao**
- `getFilterPanelInstance()` / `setCustomFilterPanel(elem)`.
- `hasDynamicFilter()` / `hasForceEnablePersonalizedFilter()` / `showTourDynamicFilter()`.
- `filterFieldsPersonalizedFilter(fn)` / `filterInstanceName`.
- `getNavigatorAPI()` — navegador superior.
- `setNavigatorSaveHandler(fn)` / `setNavigatorAddHandler(fn)`.
- `hideBtnIsFavorite()`.

**Abas / blocos**
- `customTabsLoader()` / `setTabsInfo(info)` / `getTabsInfo()`.
- `selectTabByLabel(label)` / `selectTabById(id)` / `selectTabPerId(id)`.
- `getSelectedTab()`.
- `setAllTabsEnabled(bool)` / `setTabEnabled(id, bool)`.
- `setTabOrderConfig(cfg)` / `setTabOrder(order)`.
- `changeBlockVisibility(blockId, visible)` / `changeBlockEnabled(blockId, enabled)` / `selectBlockTab(blockId)`.
- `addCustomFormItemVisible(fieldName, visible)`.

**View mode**
- `whichViewMode()` — `'grid'`, `'form'`, ou `'start'`.
- `showDyanformView()` / `goToFormView()` / `goToGridView()` / `goToStartPage()`.
- `onSelectShowGridOnStartPage()` / `onShowAllActionOnStartPage()`.

**Filhos / hierarquia**
- `addChildDynaform(child)` / `initChildDynaform(child)`.
- `onChildDynaformLoaded(child)` / `onChildDatagridLoaded(child)`.
- `isHierarchyDynaform()` / `getTree()`.

**Helper / outras opcoes**
- `getHelperClassName()` / `isRecursiveHelper()`.
- `getDynaformHelperData()` / `setDynaformHelperData(data)`.
- `otherOptionsLoader()` / `otherOptionsInterceptor(...)`.
- `changeOtherOptionEnabled(id, enabled)`.
- `setOtherConfig(...)` / `getOtherConfig()`.

**Utilidades**
- `getEntityName()` / `getParentEntityName()` / `getResourceId()` / `getMasterDynaformResourceId()`.
- `getDynaformElement()` / `getMasterDynaformElement()`.
- `getLayoutInfo()` / `getEntityCardProps()` / `getFormColConfig()`.
- `getAutoNumFieldName()` / `isAutoNum()` / `setAutoNum(bool)`.
- `isFieldVisible(name)` / `isFieldEnabled(name)` / `getFieldTabName(name)`.
- `getHiddenFieldsFromConfig()` / `getHiddenFieldsByProgrammer()` / `getExceptFieldsByEntity(name)` / `getEntityForceUserFields(name)`.
- `highlightFields(names, kind)` / `unHighlightFields(names, kind)`.
- `showFieldTooltip(name, msg)` / `resolveFocus(name)`.
- `isVariation()` / `isFieldVisible(name)` / `enableSortFields()`.
- `setBtnNewCompact(fn)` / `getBtnNewCompact()`.
- `hasAccess(permissao)`.
- `addShortcut(key, fn)`.
- `setVisibleReferences(...)`.
- `closeAllPopovers()`.
- `adjustFilterSidenavPosition()`.
- `actionBtnToggle()`.

**Handlers de dataset (observer automatico)**

O controller se registra como observer do dataset. Estes metodos sao invocados pelo dataset e nao devem ser chamados manualmente:

- `refreshed(reason)` — apos `refresh`.
- `currentLineChanged(oldIdx, newIdx)`.
- `dataModified(field, row)`.
- `editionModeActivated(row)` / `editionCanceled()`.
- `dataSaved(isNew, records)`.
- `recordRemoved(indices, records)`.
- `insertionModeActivated()`.
- `saveAvoided(reason)`.
- `allEvents(event)` — catch-all.

### Obter referencia ao controller

```html
<sk-dynaform id="myDyna" sk-entity-name="Parceiro"></sk-dynaform>
```

O `attrs.id` coloca o controller em `scope.$parent[id]`.

Ou em outro controller, via `SkComponentRegistry.get('myDyna').then(ctrl =>...)` se registrado.

---

## 3. `sk-form-custom-item`

Override de propriedades/renderizacao por campo dentro de um `sk-form` ou `sk-dynaform`.

### Atributos

- `sk-field-name` (**obrigatorio**) — nome do campo que sera customizado.
- `sk-description` — sobrescreve label (suporta expressao e i18n).
- `sk-visible` — expressao para controlar visibilidade.
- `sk-enabled` — expressao para controlar enabled.
- `sk-group` — move o campo para outro grupo.
- `required` — forca requerido.
- `sk-is-rich-text` — tratamento rich text.
- `popUpEditEnabled` — habilita popup de edicao ampliada.
- `sk-hide-buttons` — esconde botoes auxiliares.
- `sk-helper-tooltip` — tooltip de ajuda.
- `sk-simple-label` — label simples (sem estilizacao).

### Padroes de uso

**Override total do widget (substituir input)**

```html
<sk-form sk-dataset="ctrl.myDS">
  <sk-form-custom-item sk-field-name="TIPOPESSOA">
    <sk-combobox sk-dataset="ctrl.myDS" sk-field-name="TIPOPESSOA"
                 sk-options="ctrl.tipoPessoaOpts"></sk-combobox>
  </sk-form-custom-item>
</sk-form>
```

**Override apenas de propriedades** (mantem widget padrao)

```html
<sk-form-custom-item sk-field-name="EMAIL"
                     sk-description="E-mail principal"
                     sk-visible="ctrl.temEmail"
                     required></sk-form-custom-item>
```

**Apenas custom items (ignora metadados)**

```html
<sk-form sk-dataset="ctrl.myDS" sk-only-custom>
  <sk-form-custom-item sk-field-name="CAMPO1"> ... </sk-form-custom-item>
  <sk-form-custom-item sk-field-name="CAMPO2"> ... </sk-form-custom-item>
</sk-form>
```

No modo `sk-only-custom`, so os campos declarados no HTML aparecem no form.

---

## 4. Interceptors

### `IDynaformInterceptor`

Definido em idynaform.interceptor.js:

- `interceptFieldMetadata(fieldMD, dataset, dynaform)` — ajustar metadados de campo.
- `interceptDataset(dynaform, dataset)` — apos o dataset ser criado.
- `interceptPersonalizedFilter(pf, dataset)` — ajustar filtro personalizado.
- `interceptNavigator(navigator, dynaform)` — ajustar barra de navegacao.
- `interceptDynaform(dynaform)` — ajustar o dynaform.
- `acceptField(fieldMD, dynaform, dataset)` — `true` para aceitar o campo no form.
- `acceptTab(tabId, dynaform, dataset, isCustomBlock)` — `true` para aceitar a aba.

### `IFormInterceptor`

Definido em iform.interceptor.js. Chamadas **nesta ordem**:

1. `acceptField(fieldMetadata, dataset)` — decide se o campo entra no form.
2. `interceptField(fieldMetadata, dataset)` — ajustar metadados.
3. `interceptBuildField(fieldName, dataset, fieldProp, scope)` — substituir o widget visual antes da criacao. Pode retornar `element` compilado ou `{ input, container }`.
4. `buildFieldContainer(fieldName, dataset, fieldElem, scope, labelElem)` — envolver o campo em container customizado (ex.: hbox com botao extra).
5. `interceptFieldElement(fieldName, element, controller)` — ajuste final apos criado.

Validacao de implementacao via `ObjectUtils.isImplementorOf($scope.formInterceptor, IFormInterceptor)`.

### `IDatagridInterceptor` e `IFilterPanelInterceptor`

Ver [datagrid.md](datagrid.md) para detalhes do IDatagridInterceptor. Ambos seguem o mesmo padrao: objeto com metodos especificos, validado por `ObjectUtils.isImplementorOf`.

---

## 5. Integracao com outros componentes

### Com dataset

- `sk-form sk-dataset="ctrl.ds"` ou dentro de `sk-dynaform` (dataset implicito).
- Controller se registra como observer do dataset automaticamente — eventos `currentLineChanged`, `dataModified`, `editionModeActivated`, etc. chegam como metodos no controller.
- **Nao** mutar `record[i]` direto. Usar `dataset.setFieldValue('CAMPO', valor)` (ver [anti-patterns.md#5](anti-patterns.md)).

### Com datagrid

- `sk-dynaform` ja embute datagrid. Controle via `getGridController()` e atributo `sk-on-datagrid-loaded`.
- Override de colunas: `<sk-datagrid-custom-column>` dentro de `<dynaform-{entity}>`.
- Ver [datagrid.md](datagrid.md).

### Com tree (hierarquia)

- Ativar com `sk-hierarchy="true"`.
- Busca: `sk-tree-search-actived` + `sk-tree-adv-search`.
- Inicializacao com tree carregada: `sk-refresh-dataset-to-tree`.
- Acessar via `getTree()`.

### Com filter panel

- Customizar: transclude `<sk-custom-filter-panel>` em `<dynaform-{entity}>`.
- Ou via `sk-filter-panel-interceptor`.
- Acessar instancia: `getFilterPanelInstance()`.

---

## 6. Gotchas

### 6.1. `parentDynaform` — `addSingleWatch`, nao `$watch`

No linker do `sk-dynaform`, o vinculo com o pai usa `AngularUtil.addSingleWatch(scope, 'parentDynaform', controller.loadMetadata)`. Isso dispara **uma unica vez**. Trocar `parentDynaform` depois nao reexecuta `loadMetadata`. Se precisar recarregar, chamar explicitamente.

### 6.2. `getFieldController` e **assincrono**

`self.getFieldController(fieldName)` retorna promise. Nao assuma disponibilidade sincrona:

```javascript
// Errado
var ctrl = form.getFieldController('EMAIL');
ctrl.setFocus(); // TypeError

// Certo
form.getFieldController('EMAIL').then(function(ctrl) {
    ctrl.setFocus();
});
```

### 6.3. `sk-only-custom` oculta tudo que nao foi declarado

Quando `sk-only-custom` esta presente, **so** os `sk-form-custom-item` no HTML sao renderizados. Campos do dataset que nao tenham custom item correspondente simplesmente nao aparecem.

### 6.4. `sk-suppress-screen-config` vs `sk-hide-form-layout-config`

Parecem iguais mas sao diferentes:

- `sk-suppress-screen-config` — desabilita o botao **E** impede carregar config salva do banco.
- `sk-hide-form-layout-config` — so esconde o botao; config salva ainda e aplicada.

Documentado.

### 6.5. Ordem das abas diferente do Flex

No `sk-tab-order-function`, a contagem **comeca em 1**, nao em 0 como no Flex. Nao sobrescreve config salva — so roda quando nao ha ordenacao persistida.

### 6.6. `disableRemoveInvisibleFields`

Padrao: `false` — fields invisiveis sao **removidos** do dataset. Quando `true`, apenas muda `visible=false` no field, mantendo-o no dataset. Impacto: se algum listener depende da presenca do field, desativar a remocao.

### 6.7. `sk-before-post-config` pode bloquear o save

Funcao recebe a config e deve retornar `true` para permitir salvar ou `false` para bloquear. Retornar `undefined` bloqueia.

### 6.8. `IFormInterceptor.interceptBuildField` — cuidado com a substituicao

Retornar element compilado **substitui** o widget padrao. Se o template resultante nao faz binding com o dataset, o campo fica orfao. Use `interceptBuildField` so quando realmente precisa de um widget customizado.

### 6.9. `self.refreshed`, `self.dataModified`, etc. nao sao listeners — sao handlers

Estes metodos sao invocados pelo dataset via observer pattern. Sobrescrevendo um deles voce substitui o comportamento — nao adiciona listener. Se precisa reagir a eventos sem romper o comportamento padrao, use `dataset.addRefreshedListener(fn)` / `addDataModifiedListener(fn)` e lembre do cleanup em `$destroy`.

### 6.10. Transclude so funciona com tag `dynaform-{entity-dashcase}`

O linker faz `masterDynaformElem.find('dynaform-' + StringUtils.toDashCase(entityName))`. Se a tag nao estiver com o nome exato (ex.: `dynaform-parceiro` para entidade `Parceiro`), os slots (`sk-right-top-bar`, `sk-custom-filter-panel`, etc.) sao descartados silenciosamente.

---

## Checklist de triagem (bugs de form/dynaform)

- [ ] `sk-entity-name` bate com a entidade do DataDictionary?
- [ ] Tag `dynaform-{entity-dashcase}` esta com o nome correto?
- [ ] `getFieldController` foi usado como promise (`.then`)?
- [ ] `sk-only-custom` esta presente por engano, escondendo campos esperados?
- [ ] `sk-suppress-screen-config` bloqueando config que deveria carregar?
- [ ] Listeners de dataset registrados diretamente no dataset (`addRefreshedListener`) estao sendo desregistrados em `$destroy`?
- [ ] `parentDynaform` mudando dinamicamente sem chamar `loadMetadata` explicitamente?
- [ ] Interceptor implementando **todos** os metodos da interface (ou pelo menos os que pretende usar)?
- [ ] Campo invisivel sumiu do dataset? Considerar `sk-disable-remove-invisible-fields`.
- [ ] `setFieldProperty` usado em vez de mutacao direta do field?
