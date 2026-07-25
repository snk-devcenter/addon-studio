# sankhya-js — Componente `sk-dataset`

Dataset e o componente de mais baixo nivel do framework. Controla o ciclo de vida de registros de uma entidade no cliente (refresh, edicao, persistencia, remocao, navegacao). Os demais componentes (datagrid, navigator, form) consomem o dataset como fonte de dados.

E um componente grande do framework (o controller passa de sete mil linhas): boa parte das armadilhas de tela vem daqui.

---

## Modos de operacao

### Modo **conectado a entidade** (`entity-name`)

Dataset carrega metadados e registros da entidade informada, usando o backend padrao (`LoadView` + `CRUDServiceProvider`).

```html
<sk-dataset entity-name="Produto"
            id="dsProduto"
            sk-dataset-created="ctrl.onDsProduto(dataset)">
</sk-dataset>
```

Atributos mais usados:
- `entity-name` — nome da entidade
- `id` — publica o controller em `$parent[id]` e no `appController`
- `crud-listener` — FQN do `CRUDListener` server-side
- `order-by` — string de ORDER BY
- `sk-presentation-field` — forca campo de apresentacao
- `sk-lazy-load` — so carrega metadados no primeiro acesso

### Modo **standalone** (`sk-standalone`)

Dataset nao tem entidade no servidor. Voce define campos via `<sk-dsfield-md>` e fornece handlers customizados. Uso: wizards, pop-ups, grids derivados de chamadas de servico.

```html
<sk-dataset id="dsLocal"
            sk-standalone
            sk-presentation-field="NOME"
            sk-save-handler="ctrl.saveHandler(request)"
            sk-remove-handler="ctrl.removeHandler(request)"
            sk-refresh-handler="ctrl.refreshHandler(request)"
            sk-dataset-created="ctrl.onDsLocal(dataset)">
    <sk-dsfield-md name="NOME" description="Nome"></sk-dsfield-md>
    <sk-dsfield-md name="IDADE" description="Idade" user-type="I"></sk-dsfield-md>
    <sk-dsfield-md name="ATIVO" description="Ativo" presentation-type="S"></sk-dsfield-md>
</sk-dataset>
```

`_standAlone = $attrs.hasOwnProperty('skStandalone')`.

`<sk-dsfield-md>` cria o metadado programaticamente.

### Handlers customizados (obrigatorios no standalone, opcionais no conectado)

| Handler | Quando chama | Retorno esperado |
|---|---|---|
| `sk-refresh-handler` | A cada `dataset.refresh()` | Array de arrays, array de objetos, ou promise que resolve com um destes. Se retornar objeto com `responseBody`, o dataset pega o valor de la |
| `sk-save-handler` | Em `dataset.save()` | Opcional. Se retornar array, o dataset usa como nova versao do registro (captura alteracoes feitas por triggers no backend) |
| `sk-remove-handler` | Em `dataset.removeCurrentRow()` | Nada obrigatorio |

Todos recebem `request` com informacoes do estado do dataset (fieldNames, values, pk, etc.).

---

## Fluxo tipico de tela com dataset

```javascript
angular.module('<Tela>App').controller('MinhaCtrl',
  ['$scope', '$q', function($scope, $q) {
    var self = this;

    self.onDatasetCreated = function(dataset) {
      self.ds = dataset;

      // 1) Opcional: criterios, ordenacao, listeners
      dataset.addCriteriaProvider(...);
      dataset.addDataSavedListener(function(isNew, records) {
        // reagir apos salvar
      });

      // 2) Inicializa e carrega
      dataset.initAndRefresh().then(function() {
        // Aqui os metadados E os registros ja estao carregados
      });
    };
  }]);
```

**Nao confundir** `init()` x `initAndRefresh()`:
- `init()` carrega metadados apenas
- `initAndRefresh()` carrega metadados + chama `refresh()`

`dataset.whenMetadataLoaded()` retorna promise que resolve quando metadados estao prontos — util para configurar `addFieldValueEvaluator` antes do refresh.

---

## Catalogo de listeners

Todos retornam **funcao de desregistro** — chame no `$destroy` ou para remover explicitamente.

| Listener | Dispara quando | Argumentos |
|---|---|---|
| `addLineChangeListener(fn)` | Indice atual muda | `(newIndex)` |
| `addSelectionChangeListener(fn)` | Selecao multipla muda | `()` |
| `addRefreshedListener(fn)` | Apos cada refresh | `(reason)` — ver `DatasetEvents.REFRESH_REASON_*` |
| `addDataModifiedListener(fn)` | Qualquer campo modificado | `(fieldName, newValue, oldValue)` |
| `addFieldModifiedListener(fields, fn)` | Campos especificos modificados | `(fieldName, newValue, oldValue)` |
| `addDataSavedListener(fn)` | Apos save | `(isNew, records)` |
| `addEditionCanceledListener(fn)` | `cancelEdition()` | `()` |
| `addInsertionModeListener(fn)` | Entrou em modo insercao | `(indexBeforeInsert, dataset)` |
| `addRowMetaDataListener(fn)` | Metadata de linha alterada (RMD) | `(...)` |
| `addRecordRemovedListener(fn)` | Registro removido | `(record)` |
| `addAllObserverEventsListener(fn)` | Qualquer evento do observer | `(event, parameters)` |
| `addSaveAvoidListener(fn)` | Save abortado por validacao | `(nullFieldNames, dataset)` |
| `addFinishedEditionListener(fn)` | Usuario saiu do campo editado | — |

### Outros registradores (nao sao "listeners" mas sao pontos de extensao)

| Metodo | Efeito |
|---|---|
| `addFieldValueEvaluator(fieldName, fn, triggerFields)` | Recalcula `fieldName` quando qualquer `triggerFields` muda. Retorno da `fn` vira valor |
| `addAutoInsertValue(fieldName, value)` | Valor default aplicado em insercao automatica quando refresh retorna vazio |
| `addCriteriaProvider(provider)` | Adiciona criterio dinamico na consulta do refresh |
| `addRecordValidator(fn)` | Validacao custom antes do save |
| `addFieldMetadataInterceptor(fieldName, fn)` | Ajusta metadata do campo no carregamento (readOnly, required, visible,...) |
| `addObserver(IDataSetObserver)` | Observer de baixo nivel — os `add*Listener` sao atalhos sobre este |

---

## Eventos e constantes

Tres conjuntos em dataset.constant.js:

### `DatasetContants`
- `RECORD_IS_NOT_DIRTY` — retorno de `isRecordDirty` para registro nao modificado
- `DEFAULT_USER_FIELDS: "$USERFIELDS"` — chave reservada para campos de usuario

### `DatasetEvents` — eventos do EventBus
- `ON_METADATA_UPDATED` — disparado quando metadados sao setados/atualizados
- `BACKGROUND_LOAD` / `BACKGROUND_LOAD_START` / `BACKGROUND_LOAD_END`
- `REFRESH_CELLS` — pedido de refresh de celulas especificas
- `REFRESH_REASON_SORT` / `_RESET` / `_FILTER` / `_RECORDS_ADDED` — reason recebido no `addRefreshedListener`
- `LINE_CHANGE_BY_RECORD_REMOVED` — distingue linha que mudou porque removeram o registro ativo
- `RECORD_CHANGED_REASON_INSERT`
- `ADD_RECORDS_AS_OBJECT_END` / `ADD_RECORDS_AS_ARRAY_END`

Escuta via `dataset.addEventListener(DatasetEvents.ON_METADATA_UPDATED, fn)`. `EventBus` e mixado via `ObjectUtils.extend(self, EventBus)`.

### `DatasetObserverEvents` — eventos do observer
Nomes canonicos dos eventos observados por `addAllObserverEventsListener`:
- `EVENT_RECORD_EDITED` / `EVENT_EDIT_MODE` / `EVENT_EDITION_STARTED` / `EVENT_EDITION_CANCELED` / `EVENT_FINISHED_EDITION`
- `EVENT_CURRENT_RECORD_CHANGED` / `EVENT_CURRENT_RECORD_REFRESHED`
- `EVENT_DATA_SET_REFRESHED` / `EVENT_DATA_SET_CLEARED` / `EVENT_DATA_SET_CLOSED` / `EVENT_DATA_SET_UPLOADING`
- `EVENT_DATA_SAVED` / `EVENT_SAVE_AVOID`
- `EVENT_INSERT_MODE` / `EVENT_INSERTION_CANCELED` / `EVENT_RECORD_REMOVED`
- `EVENT_SELECTION_CHANGED` / `EVENT_ROW_METADATA_CHANGED` / `EVENT_RELOAD_FIELDS`

---

## Estados — quando consultar o que

| Pergunta | Metodo |
|---|---|
| Metadados carregados? | `whenMetadataLoaded()` |
| Dataset ja carregou registros pelo menos uma vez? | `isLoaded()` |
| Tem algum registro? | `isEmpty()` / `size()` |
| Esta em modo de edicao? | `isEditMode()` / `isAnyEditMode()` / `isInsertionMode()` / `isCopyingRecord()` |
| Registro corrente foi modificado? | `isRecordDirty()` |
| Refresh em andamento? | `isRefreshing()` |

**Prefira listeners a polling.** Se voce precisa reagir a "quando o dataset carregar", use `addRefreshedListener` — nao loop checando `isLoaded()`.

---

## APIs mais usadas (resumo)

### Leitura
- `getCurrentRow()` / `getCurrentRowAsObject()` / `getRowAsObject(index)`
- `getRecords()` / `getRecordsAsObjects()`
- `getFieldValue(name)` / `getFieldValueAsString(name)` / `getFieldValueAsNumber(name)` / `getFieldValueAsJson(name)` / `getFieldValueAsBoolean(name)`
- `getSelectedRecords()` / `getSelectedRecordsAsObjects()` / `getSelectedRecordsPks()`
- `getPrimaryKeyObject()` / `getPrimaryKeyValues()`
- `getFieldsMetadata()` / `getFieldMetadata(name)` / `getFieldIndexByName(name)`

### Escrita
- `setFieldValue(name, value)` / `setFieldValueAsString` / `setFieldValueAsJson`
- `goToInsertionMode()` / `beginEdition()`
- `cancelEdition()` / `askAndCancelEdition()`
- `save()` / `silentSave()` / `autoSave()` / `autoSaveFromMaster()`
- `removeCurrentRow()` / `unconditionalRemoveCurrentRecord()`
- `copyCurrentRow()`
- `updateRecord(index, record)` / `addRecords(records)` / `addRecordsAsObjects(records)`
- `resetRecords()` / `clearDataSet()`

### Navegacao
- `first()` / `previous()` / `next()` / `last()` / `hasPrevious()` / `hasNext()`
- `gotoRow(index)` / `changeRow(index)` / `setCurrentIndex(i)` / `getCurrentIndex()`
- `locateByPk(pkObject)`

### Consulta / filtro / ordem
- `addCriteriaProvider(provider)` / `removeCriteriaProvider(provider)` / `getCriteriaProvider()`
- `setFilterFunction(fn)` / `addFilterFunction(fn)` / `addObjectFilterFunction(fn)`
- `filterRecords(...)` / `removeFilter()`
- `setSortFunction(fn)` / `setObjectSortFunction(fn)` / `sortRecords(...)` / `removeSort()`
- `setOrderByExpression(expr)`

### Metadados e campos dinamicos
- `addUserFieldMetadata(fieldMD)` — adiciona campo na fly
- `addTransientField(fieldMD)` — campo que nao vai para persistencia
- `makeFieldRequired(name)` / `makeFieldNonRequired(name)`
- `makeFieldPersonalizedValidator(name, fn)`
- `updateRMD()` — forca reload de row metadata

---

## Padrao tipico de save handler em standalone

```javascript
self.saveHandler = function(request) {
  return ServiceProxy.callService('<addon>@MinhaRegraSP.persistir', {
    registro: request.record
  }).then(function(data) {
    // Retornar array de linhas faz o dataset atualizar com os
    // valores devolvidos (captura alteracoes feitas pelo backend).
    return data.responseBody.linhas;
  });
};
```

O retorno do handler pode ser sincrono (array) ou promise. Se for objeto com `responseBody`, o dataset usa `responseBody` como valor.

---

## Padrao de tela com form + grid + navigator

```html
<sk-dataset entity-name="Produto" id="dsProduto"
            sk-dataset-created="ctrl.onDsCreated(dataset)"></sk-dataset>

<sk-double-face-panel flex>
  <sk-top-bar>
    <sk-navigator dataset="ctrl.dsProduto"></sk-navigator>
  </sk-top-bar>
  <sk-face-one>
    <sk-form sk-dataset="ctrl.dsProduto" flex></sk-form>
  </sk-face-one>
  <sk-face-two>
    <sk-datagrid sk-dataset="ctrl.dsProduto"></sk-datagrid>
  </sk-face-two>
</sk-double-face-panel>
```

Quando `sk-dataset` tem `id="dsProduto"`, o controller e publicado em `$parent.dsProduto` (e tambem no `appController`). Assim os componentes filhos referenciam o dataset por nome.

---

## Gotchas do dataset (resumidas)

Armadilhas mais frequentes:

1. **Esquecer de chamar a funcao de desregistro dos listeners** — em telas re-abertas, listeners acumulam e disparam duas, tres, N vezes. Sempre `$scope.$on('$destroy', removeListener)`.
2. **Acesso direto a `record[i] = valor`** — nao notifica observers nem field binders. Sempre `dataset.setFieldValue(name, value)`.
3. **Chamar `refresh()` e logo `getCurrentRow()`** — `refresh()` e assincrono; o current row ainda e o anterior. Use `.then()` do refresh ou `addRefreshedListener`.
4. **Esperar dataset com `$timeout(fn, 500)`** — anti-padrao. Ver [anti-patterns.md](anti-patterns.md).
5. **Dataset standalone sem `sk-refresh-handler`** — qualquer `refresh()` falha silenciosamente (nao ha backend default).
6. **Multiplos datasets com mesmo `id`** — `$parent[id]` vira o ultimo registrado. Bugs aparecem so em cenarios especificos de re-render.

Ver tambem: [gotchas.md](gotchas.md) para armadilhas do framework em geral e [anti-patterns.md](anti-patterns.md) para praticas nao recomendadas.
