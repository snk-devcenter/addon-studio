# sk-navigator — barra CRUD + navegacao do dataset

Barra de botoes ligada a um `dataset`: primeiro/anterior/proximo/ultimo, novo, editar, duplicar, remover, salvar, cancelar, refresh, e busca de campos (`Ctrl+F`). Implementa `IDataSetObserver` e reage a eventos do dataset para habilitar/desabilitar botoes, com suporte a edicao unica, insercao externa, auto-save em navegacao e modo datagrid.

Arquivos: navigator.directive.js, navigator.controller.js.

> **Dentro de um `sk-dynaform` esta pagina nao se aplica.** O dynaform monta o navigator no proprio template, sem HTML da tela onde por atributo. O controle ali e programatico, por `dynaform.getNavigatorAPI()` — chaves, defaults e armadilhas em [form.md secao 2.1](form.md). Esta pagina cobre o `sk-navigator` que **voce** escreve no HTML, junto de um `sk-dataset` proprio.
>
> Para uma toolbar completa sobre dataset (navigator + gridconfig + gridprinter + anexos + pesquisa de entidade) sem montar um dynaform, existe `sk-taskbar`, que recebe as mesmas chaves em um objeto: `<sk-taskbar sk-dataset="ctrl.dataset" sk-navigator-options="ctrl.navOptions">`. O objeto aceita `disableNavigator`, `showNavigation`, `showAddButton`, `showCopyButton`, `showRemoveButton`, `showRefreshButton`, `showCancelButton`, `showSaveButton`, `showEditButton` e `compactAddBtn`; chave omitida cai no default (tudo `true`).

## Directive

```html
<sk-navigator dataset="ctrl.dataset"
              sk-api="ctrl.navigatorApi"
              sk-save-handler="ctrl.onSave(dataset)"
              show-crud="true"
              sk-always-navigation="true">
</sk-navigator>
```

`restrict: 'E'`, `controller: 'SkNavigatorController'`, template `components/navigator/navigator.tpl.html`.

### Atributos

**Dataset e API**
| Atributo | Tipo | Proposito |
|---|---|---|
| `dataset` | `=` | obrigatorio; instancia de `sk-dataset` |
| `sk-api` | `=?` | two-way; controller escreve `api = self` ao linkar |

**Handlers (callbacks `&?`)**
| Atributo | Assinatura | Proposito |
|---|---|---|
| `sk-add-function` | `fn(scope)` | substitui `dataset.goToInsertionMode()` no click do `+` |
| `sk-edit-function` | `fn(scope)` | substitui `dataset.goToInsertionMode()` no click do editar |
| `sk-save-handler` | `fn({dataset})` | substitui `dataset.save(...)` no click do disquete |
| `sk-remove-handler` | `fn({dataset})` | substitui `dataset.removeCurrentRow()` no click do lixo |

**Visibilidade (todos `=?`)**
| Atributo | Efeito |
|---|---|
| `show-crud` | umbrella; **sem prefixo `sk-`** (o binding e `showCrud: '=?showCrud'`). Ver detalhe abaixo |
| `sk-show-navigation` | mostra/oculta primeiro/anterior/proximo/ultimo |
| `sk-show-add-button` / `sk-show-copy-button` / `sk-show-remove-button` / `sk-show-editar-button` | granular por botao CRUD |
| `sk-show-refresh-button` / `sk-show-cancel-button` / `sk-show-save-button` | granular de acao |
| `sk-show-first-button` / `sk-show-last-button` | granular de nav |
| `sk-show-edit-button` | habilita edicao multipla |

**Modos especiais**
| Atributo | Efeito |
|---|---|
| `sk-edit-unique-record` | `=` — edicao unica, oculta nav; save/cancel sempre visiveis |
| `sk-external-insertion-mode` | `=?` — fluxo externo controla insertion; muda toda a logica de visibilidade |
| `sk-always-navigation` | `=?` — prev/next com dirty dispara `save()` antes de navegar |
| `sk-refresh-all-records` | `=?` — passado como `refreshAllRecords` para `dataset.save()` |
| `sk-ignore-conditional-save-copy` | `=?` — desliga `setConditionalAutoSave(false)` durante `copyCurrentRow`, religa depois |
| `sk-hide-question-remove` | atributo fixo — pula confirmacao no delete |

**Busca de campos (Ctrl+F)**
| Atributo | Efeito |
|---|---|
| `sk-enable-search-fields` | `=?` — habilita panel de autocomplete em `Ctrl+F` |
| `sk-search-fields-use-dataset` | `=?` — `true`: varre `dataset.getFieldsMetadata()`; `false`: varre `sk-simple-item` do DOM |
| `sk-tabs-selected-index` | `=?` — sincroniza index de `sk-tab` ao pular para campo em aba diferente |

## API (via `sk-api`)

| Metodo | Proposito |
|---|---|
| `getDataset()` | retorna o dataset atualmente ligado |
| `setDataGridMode(enabled, gridInstance)` | delega prev/next para `gridInstance.previousRow/nextRow`; lanca se `enabled=true` sem `gridInstance` |
| `setSaveHandler(fn)` | registra handler de save programaticamente |
| `setAddHandler(fn)` | registra handler de add programaticamente |
| `setEditHandler(fn)` | registra handler de edit programaticamente |

Handlers via atributo (`sk-save-handler`, etc.) e via API sao intercambiaveis — `api.saveHandler` sobrescreve o de scope quando presente.

## Observer handlers (implementa `IDataSetObserver`)

Todos chamam `enableDisableNavControls()` no fim para recalcular estado dos botoes.

| Handler | Efeito adicional |
|---|---|
| `dataSaved` | — |
| `insertionModeActivated` | injeta `include.in.deep.copy` no TX se esta copiando registro |
| `currentLineChanged` | reseta `_showedEditionAlertForThisRecord = false` |
| `refreshed` | — |
| `closed` | zera todos os enabled; save/cancel refletem dirty do dataset |
| `dataModified` | — |
| `editionCanceled` | — |
| `selectionChanged` | — |
| `editionModeActivated` | — |
| `uploadingFile(uploading)` | desabilita save enquanto upload roda |

## Fluxos especiais

### `show-crud="false"` — o que sai e o que fica

Cada grupo do template testa `!(showCrud === false)`. Com `show-crud="false"` saem:

- botao novo (`sk-btn-novo`)
- grupo salvar + descartar
- grupo excluir / duplicar / editar
- botao atualizar

**Fica de fora do umbrella o grupo de navegacao** — primeiro/anterior/proximo/ultimo continuam visiveis, porque o `ng-if` deles nao consulta `showCrud`. Ou seja, `show-crud="false"` entrega exatamente uma barra somente-leitura navegavel; para tirar tambem a navegacao, somar `sk-show-navigation="false"`.

A comparacao e `=== false` estrita: `show-crud="0"`, `show-crud="'false'"` (string) ou o atributo ausente **nao** desligam nada.

Alem da UI, o `$watch('dataset')` faz:

```javascript
$scope.dataset.setEnableDeleteFromNavigator(!($scope.showCrud === false || $scope.showRemoveButton === false));
```

Isso e o que impede o delete por outros caminhos (teclado, menu de contexto do grid) — esconder o botao com `sk-show-remove-button="false"` tem o mesmo efeito colateral.

### Navegacao com dirty + `sk-always-navigation`

```javascript
// prev/next com alwaysNavigation + dirty
if ($scope.dataset.isRecordDirty() && $scope.alwaysNavigation) {
    $scope.dataset.save().then(function(){
        $scope.dataset.previous(); // ou next()
    });
}
```

Sem `alwaysNavigation` e com dirty, prev/next ficam desabilitados ate salvar ou cancelar.

### Clone + deep copy

Quando o dataset e entity (nao-standalone), carrega metadata de entidades filhas (ONE_TO_MANY) via `mge@SystemUtilsSP.getDeepCopyMetadata`. No click em duplicar:

1. Se ha metadata e (nao `keepChoice` OU ha entity nao-respondida) → abre popup `DeepCopyPopUpController`
2. Popup persiste a escolha via `SkApplication.instance().saveMgeConfig('{resourceID}.configDeepCopy.{entity}', config)`
3. Executa `dataset.copyCurrentRow()`

Com `sk-ignore-conditional-save-copy` e dataset em conditional autosave:

```javascript
$scope.dataset.setConditionalAutoSave(false);
$scope.dataset.copyCurrentRow().then(function(){
    $scope.dataset.setConditionalAutoSave(true);
});
```

### External insertion mode

Com `sk-external-insertion-mode=true`, toda a logica de visibilidade de add/save/cancel/prev/next e reescrita para que o fluxo externo (ex.: Central de Notas) controle quando mostrar o botao de insercao. Add aparece quando `insertionMode || !dirty`; save/cancel aparecem quando `!insertionMode && dirty`; prev/next/first/last quando `!insertionMode && !dirty`.

### Data grid mode

```javascript
ctrl.navigatorApi.setDataGridMode(true, gridInstance);
```

Quando ativo, prev/next delegam para `gridInstance.previousRow()`/`nextRow()` em vez do dataset. Os enabled de first/prev/next/last passam a consultar `gridInstance.hasPrevious/hasNext`.

### Busca de campos (Ctrl+F)

`KeyboardManager.bind('Ctrl+F', openSearch)` abre panel de autocomplete que varre a tela e destaca o campo escolhido:

- `sk-search-fields-use-dataset=true` → itera `dataset.getFieldsMetadata()` filtrando `visible` e excluindo `userType == 'customBlock'`
- `sk-search-fields-use-dataset=false` (default) → varre `sk-simple-item` no DOM usando `sk-label`

No select, se o campo esta em `sk-tab-item` e `sk-tabs-selected-index` esta bindado, atualiza o index e so entao destaca (`$timeout 50ms`). Adiciona classe `highlighted-field` no `.form-group` pai e faz `scrollIntoView`.

A guarda real e `sk-enable-search-fields`: `openSearch` so abre com `enableSearchFields` truthy, e nenhum dos dois navigators do dynaform recebe esse atributo.

```javascript
if(!$scope.isInsideDynaform && $scope.enableSearchFields){ ... }
```

`isInsideDynaform` **nao existe** — nao esta no `scope` da directive nem e atribuido em lugar nenhum do `sankhya-js`. Sempre `undefined`, logo a primeira metade da condicao e sempre verdadeira. Nao tente setar via atributo: por ser scope isolado, nao chega.

### Alerta de edicao

Driven pelo parametro MGE `global.notifica.alteracao.dataset`. Quando ativo, popover `edition-alert-popover-{componentId}` aparece uma vez por registro apos o dataset ficar dirty (flag `_showedEditionAlertForThisRecord` reseta em `currentLineChanged`).

## Gotchas

1. **`sk-api` two-way sobrescreve o valor do consumidor**. O controller faz `$scope.api = self` no init — se o consumidor passou `sk-api="ctrl.api"` com valor pre-existente, ele e substituido. Usar apenas como saida.

2. **`setDataGridMode(true)` sem `gridInstance` lanca**. Erro literal: `'Para usar datagridmode e obrigatorio a instancia do grid.'`. Sempre passar a instancia (obtida via `datagrid.api` ou `SkComponentRegistry`).

3. **`show-crud === false` nao esconde a navegacao e afeta o delete fora da barra**. Escopo exato do umbrella e o efeito em `setEnableDeleteFromNavigator` na secao "`show-crud="false"` — o que sai e o que fica".

3.1. **`sk-show-editar-button` testa `=== true`, os outros testam `=== false`.** O botao editar-registro fica oculto por default e so aparece com o valor booleano `true` — nao basta a ausencia do atributo como nos demais. Nao confundir com `sk-show-edit-button` (edicao multipla), que segue a regra normal.

4. **`sk-external-insertion-mode=true` reescreve todas as regras de visibilidade**. Se ativado por engano, add/save/cancel/prev/next aparecem em momentos inesperados. So usar em fluxos que gerenciam insertion externamente.

5. **`sk-always-navigation` com dirty dispara `dataset.save()` automatico**. Pode acionar regras do backend, validacoes, eventos `before-post` do form. Usuarios clicando prev/next rapido podem gerar saves em cascata.

6. **`KeyboardManager.bind('Ctrl+F', openSearch)` nao e desregistrado no `$destroy`**. N navigators = N bindings. Colide com `Ctrl+F` do `sk-application` (que dispara `KeyboardEvents.FIND`). Em telas com multiplos navigators o comportamento vira loteria. Evitar montar mais de um `sk-navigator` por tela — lembrando que **o dynaform ja monta dois** (toolbar principal + `sk-fixed-bar`), entao um `sk-navigator` seu numa tela de dynaform e o terceiro binding. O que impede os dois do dynaform de abrirem o panel e so `enableSearchFields` estar `undefined` — o bind existe e responde.

7. **Deep copy metadata carrega uma vez por troca de dataset**. Flag `_deepCopyMDLoaded` impede reload ate o dataset ser substituido por outra instancia. Mudar `entityName` do mesmo dataset nao retriggera. Para forcar reload, trocar a referencia do dataset.

8. **Deep copy config e persistido por `{resourceID}.configDeepCopy.{entity}`**. Se `getResourceID()` retorna `'unknown.resource.id'` (URL sem `resourceID`), a config fica compartilhada entre todas as telas anonimas. Garantir `?resourceID=` na URL.

9. **`sk-refresh-all-records=true` recarrega o dataset inteiro apos save**. Custo alto em grids grandes — evita apenas se realmente precisa atualizar calculos server-side de todas as linhas.

10. **`uploadingFile(true)` desabilita so o save**. Prev/next/cancel continuam ativos. Usuario pode navegar no meio do upload e perder o arquivo em progresso — se upload e critico, desabilitar outros botoes manualmente.

11. **`_showedEditionAlertForThisRecord` reseta so em `currentLineChanged`**. Cancelar edicao na mesma linha e voltar a editar nao reabre o popover. Para forcar, trocar de registro e voltar.

12. **`_keepDeepCopyAnswer=true` pula o popup de deep copy**. Se ha entity nova nao-respondida (`answered == 'N'`), `hasUnansweredDeepCopy()` detecta e reabre o popup. Mas a checagem usa `forEach` com `return true` — que NAO sai do forEach. A funcao sempre retorna `false`, entao novas entities adicionadas apos a primeira resposta nao disparam o popup ate o usuario limpar a config manualmente.

13. **`sk-hide-question-remove` pula a confirmacao, mas nao a regra de negocio**. Se o dataset tem `beforeDelete` que normalmente exibe confirm, ele continua executando — o atributo so afeta a question default do framework.
