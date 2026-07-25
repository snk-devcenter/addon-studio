# Inputs canonicos — familia `FieldBinder`

Familia de componentes de entrada (text, combobox, date/time, switch, checkbox) que compartilha a interface `FieldBinder` para integracao com `sk-dataset`. Todos suportam dois modos: ligado a um dataset (`sk-dataset` + `sk-field-name`) ou standalone (`sk-value`).

Interface base: fieldbinder.model.js.

## Modelo `FieldBinder`

Implementado via `ObjectUtils.implements(self, FieldBinder, {... })`. Cada input sobrescreve `setData`, `setNgModelCtrl`, e alguns specifics; os demais metodos vem do prototype.

### API do FieldBinder

| Metodo | Proposito |
|---|---|
| `setData(data)` / `getData()` | escreve/le o valor no scope.value |
| `setNgModelCtrl(ngModelCtrl)` | injeta o `$ngModelController` do input interno |
| `setFocus()` / `select()` | foco programatico |
| `setEnabled(enabled)` | atalho para `scope.enabled =...` |
| `highlightField()` / `unHighlightField()` | destaque visual |
| `getFieldName()` | resolve `fieldName` ou `fieldIndex → name` via metadata do dataset |
| `useDataset()` | `true` se `dataset` + (`fieldName` ou `fieldIndex`); **throw** se `dataset` sem nenhum dos dois |
| `modify(force)` | notifica `dataset.setModified(self)` (respeita `ignoreModifiedNotification`) |
| `notifyChangeToDataset(isEnd)` | dispara `notifyEditionStart` + `setModified` |
| `beforeSetData()` / `afterSetData()` | pausa `ignoreModifiedNotification`; `afterSetData` religa via `$$postDigest` |
| `bindToDataset()` | anexa `addFieldBinder(self)` + observer opcional de `disableOnInsertion` |
| `scopeCreated()` / `scopeDestroyed()` | ciclo — chamado pelo `initializePrototype` |
| `finishedEdition(newVal, oldVal)` | dispara `onEndEdit` + `dataset.notifyFinishedEdition` |
| `fbFocusIn()` / `fbFocusOut()` | registra `oldValue`, chama `onEndEdit` no blur |
| `setElement(element)` | binda focus/blur do elemento DOM |
| `addDatasetLoadedListener(fn)` | aguarda `dataset.whenMetadataLoaded()` |

### Ciclo de vida

```
directive link
  → ctrl.setNgModelCtrl(ngModelCtrl)
  → ctrl.setElement($input)
  → scopeCreated (watch dataset → bindToDataset)
  → bindToDataset
      → dataset.addFieldBinder(self)
      → observer opcional (disableOnInsertion)
      → dataset.whenMetadataLoaded().then(listeners)
usuario digita
  → ng-change → changeHandler → notifyChangeToDataset
blur
  → fbFocusOut → onEndEdit + finishedEdition
$destroy
  → scopeDestroyed → dataset.removeFieldBinder + desliga focus/blur
```

### `disableOnInsertion`

Atributo opcional do sk-text-input. Quando `true`, o bind adiciona observer que:

```javascript
observer.insertionModeActivated = function () {
    if (self.scope.enabled) {
        self.scope.enabled = false;  // desabilita
        changed = true;
    }
    self.beforeSetData();
    self.setData(undefined);         // limpa
    self.afterSetData();
};

observer.currentLineChanged = function () {
    if (changed) self.scope.enabled = true;
};
```

## Modos de uso

### Com dataset

```html
<sk-text-input sk-dataset="ctrl.dataset"
               sk-field-name="NOMEPARC">
</sk-text-input>
```

FieldBinder se registra em `dataset.addFieldBinder(self)` e o valor sincroniza automaticamente com o registro corrente. `setData` do dataset → `scope.value` → ngModel → `<input>`. `ng-change` no `<input>` → `notifyChangeToDataset(false)` → `dataset.setModified(self)`.

### Standalone

```html
<sk-text-input sk-value="ctrl.minhaVar"
               sk-change="ctrl.onChange()">
</sk-text-input>
```

`scope.value` e two-way com a variavel do consumidor. Sem `dataset`, `useDataset()` retorna `false` e o input nao notifica modificacao.

### Editor de grid inline

Todo input respeita `sk-datagrid-editor="true"` e recebe foco automatico ao abrir. No `sk-switch`, o atributo `aggrid` cancela navegacao por setas para nao saltar celulas.

## Atributos comuns

| Atributo | Tipo | Default | Proposito |
|---|---|---|---|
| `sk-dataset` | `=?` | — | instancia do dataset |
| `sk-field-name` | `@?` | — | nome do campo no dataset |
| `sk-field-index` | `@?` | — | alternativa a `sk-field-name` |
| `sk-value` | `=?` | — | modo standalone (bind externo) |
| `sk-enabled` | `=?` | `true` | habilita edicao |
| `sk-required` | `=?` | `false` | adiciona classe `required` (ver gotcha 3) |
| `sk-change` | `&?` | — | callback apos mudanca |
| `sk-focus` | `&?` | — | callback de focus |
| `sk-focus-out` | `&?` | — | callback de blur |
| `sk-datagrid-editor` | `@` | `false` | modo editor inline de grid |
| `autofocus` | attr | — | foco ao montar |

## sk-text-input

Arquivos: textInput.directive.js, textInput.controller.js.

Template gerado: `<input type="text|password" class="form-control" ng-model="value"...>`.

| Atributo | Proposito |
|---|---|
| `sk-align` | `text-align` do input |
| `sk-password` | renderiza como `type="password"` |
| `sk-size` | `maxlength`; em Safari, hack de keypress para aceitar replace no limite |
| `sk-placeholder` | placeholder |
| `sk-display-as-upper-case` | `text-transform: uppercase` (so visual) |
| `sk-restrict` | regex de **rejeicao** de caracteres (ex.: `[^0-9]` rejeita nao-digitos) |
| `sk-only-numbers` | filtro numerico |
| `sk-show-thousand-separator` | separador de milhar |
| `sk-decimal-time` | formatacao decimal de tempo |
| `sk-disable-on-insertion` | limpa + desabilita em insertion mode |
| `sk-keydown` | callback `&?` |
| `sk-end-edit` | dispara no fim da edicao (valor mudou no blur) |
| `sk-finish-change` | callback adicional no change |
| `sk-before-change` | callback antes do change |
| `sk-focus-out-controle` | **so quando `true`** dispara `sk-focus-out` via blur (ver gotcha 6) |
| `sk-drop-enabled` | habilita drag-drop |
| `sk-drag-enter` / `sk-drag-over` / `sk-drag-drop` | handlers de drag |

## sk-combobox

Arquivos: combobox.directive.js.

Backend e `ui-select` (nao `<select>` nativo).

| Atributo | Proposito |
|---|---|
| `sk-options` | array literal `[{data, value},...]` |
| `sk-options-from-query` | `{query: 'SELECT... FROM...', keyField, descriptionField, callback}` — backend executa SQL |
| `sk-opt-key` | propriedade chave nas opcoes (default `data`) |
| `sk-opt-label` | propriedade label nas opcoes (default `value`) |
| `sk-allow-null` | permite limpar |
| `sk-without-bind-html` | usa `ng-bind` em vez de `ng-bind-html` no label |

Comportamentos:
- Escuta `$document` scroll → `$select.close()` (desregistra no `$destroy`)
- `setFocus` faz `$broadcast('UiSelectFocusEvent')`
- `$watch(value)` → `ctrl.updateCombobox(newValue)`

## sk-date-time-input

Arquivos: dateTimeInput.directive.js.

Composicao de `sk-date-input` + `sk-time-input`.

| Atributo | Proposito |
|---|---|
| `sk-show-date` | default `true`; oculta a parte de data |
| `sk-show-seconds` | default `false`; inclui segundos |
| `sk-align` | alinhamento |

Variantes independentes: `sk-date-input` (so data), `sk-time-input` (so hora), `sk-date-period-input` (intervalo).

## sk-switch

Arquivos: switch.directive.js.

Checkbox que serializa como string `'S'`/`'N'` (padrao do produto). Implementa `FieldBinder` — integra com dataset.

| Atributo | Default | Proposito |
|---|---|---|
| `sk-true-value` | `'S'` | valor quando marcado |
| `sk-false-value` | `'N'` | valor quando desmarcado |
| `sk-switch-label` | — | label lateral |
| `sk-wide` | `false` | estilo expandido |
| `sk-prevent-click` | `false` | bloqueia toggle por click |

Em `aggrid`: intercepta LEFT/RIGHT/UP/DOWN para preservar o switch ativo:

```javascript
if (attr.hasOwnProperty('aggrid')) {
    element.bind('keydown', function(event) {
        if ([LEFT, RIGHT, UP, DOWN].includes(event.which)) {
            event.preventDefault();
        }
    });
}
```

## sk-checkbox

Arquivos: checkbox.directive.js.

**Nao implementa FieldBinder** — e um wrapper de checkbox tematico do produto que usa `require: '^ngModel'` puro. Para dataset, usar `sk-switch`.

| Atributo | Default | Proposito |
|---|---|---|
| `true-value` | `true` | valor quando marcado |
| `false-value` | `false` | valor quando desmarcado |
| `indeterminate-value` | `undefined` | valor no estado tri-state |
| `accept-indeterminate` | `false` | habilita tri-state |
| `tabindex` | `0` | identico ao HTML5 |

Classes aplicadas: `sk-checked`, `sk-indeterminate`. Directive tem `priority: 210` para rodar antes do `ngAria`.

```html
<sk-checkbox ng-model="ctrl.active"
             accept-indeterminate="true"
             indeterminate-value="I">
    Label do checkbox
</sk-checkbox>
```

## Gotchas

1. **Dataset + `sk-value` juntos lanca**. `sk-text-input` e `sk-combobox` checam no link e lancam `'Input que utiliza o dataset nao deve fazer bind de valor.'`. Em dataset, deixar so `sk-field-name`.

2. **`sk-dataset` sem `sk-field-name`/`sk-field-index` lanca**. `FieldBinder.useDataset()` levanta `'Dataset foi definido porem nao foi definido o fieldIndex ou fieldName.'`. Remover `sk-dataset` se for usar em standalone.

3. **`sk-required` so aplica classe CSS**. Adiciona/remove `required` no element container via `$observe('skRequired')`. Validacao real vem do `ng-required` do `<input>` interno + metadata do dataset. Nao supor que `sk-required=true` impede save.

4. **`sk-restrict` e regex de rejeicao**. `sk-restrict="[^0-9]"` significa "rejeita tudo que nao e digito" — regex invertida. Escrever `[0-9]` faria o contrario e deixaria passar tudo menos digitos.

5. **`sk-options-from-query` executa SQL direto**. O objeto `{query, keyField, descriptionField}` e enviado ao backend e executado. Nunca concatenar input de usuario na string — e vetor de SQL injection.

6. **`sk-focus-out-controle` tem typo e inverte o padrao**. Em `sk-text-input`, o handler de blur so dispara `onFocusOut` se `focusOutControle` for truthy: `if (scope.onFocusOut && scope.focusOutControle) { scope.onFocusOut(); }`. Por default falsy → text-input nao emite `sk-focus-out`. `sk-switch` e `sk-combobox` sempre emitem. Inconsistencia entre componentes.

7. **Combobox fecha no scroll global**. Handler em `$document.on(SCROLL)` fecha a dropdown. Scroll programatico em outro componente (ex.: `element.scrollIntoView()` dentro de um popup) pode fechar uma dropdown aberta.

8. **`sk-checkbox` nao integra com dataset**. Usar `sk-switch` com `sk-true-value="S"`/`sk-false-value="N"` — e o padrao do produto. Colocar `sk-checkbox` numa tela com dataset nao vincula ao campo.

9. **`sk-disable-on-insertion` limpa o valor**. Em `insertionModeActivated`, chama `setData(undefined)` alem de desabilitar. Em `currentLineChanged`, so reabilita se havia habilitado antes (`changed` flag). Registros sem insert intermediario nao sao afetados.

10. **`fieldIndex` resolve lazy**. Antes de `dataset.whenMetadataLoaded()`, `getFieldName()` com `fieldIndex` retorna `undefined`. Usar `ctrl.addDatasetLoadedListener(fn)` para logica dependente do nome do campo.

11. **`beforeSetData/afterSetData` usa `$$postDigest`**. Permite o dataset escrever sem re-notificar. Custom `setData` que escreva fora dessa janela pode disparar loops de notificacao. Preservar a pausa.

12. **Safari + `sk-size`**: replace no limite so funciona com selecao ativa. Sem selecao, keypress e bloqueado. Hack especifico para Safari; outros browsers deixam o ng-change cuidar.

13. **`sk-options-from-query.callback` dispara apos carregar opcoes**. Logica dependente das opcoes (selecao default, filtros) deve ir no `callback`, nao em `$timeout` cego — a query pode ser lenta.

14. **`sk-switch` em `aggrid` precisa do atributo `aggrid`**. Sem ele, setas do teclado navegam entre celulas e o switch fica "saltando" sem trocar estado. Esse atributo e separado de `sk-datagrid-editor`.

15. **`sk-checkbox` tem `priority: 210` (antes do ngAria)**. Se a aplicacao customiza ngAria globalmente, testar checkbox — a ordem de compile pode afetar atributos ARIA gerados.
