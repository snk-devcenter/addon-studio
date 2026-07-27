# Inputs canonicos — familia `FieldBinder`

Familia de componentes de entrada (texto, numero, data, escolha, arquivo) que compartilha a interface `FieldBinder` para integracao com `sk-dataset`. Quase todos suportam dois modos: ligado a um dataset (`sk-dataset` + `sk-field-name`) ou standalone (`sk-value`).

Interface base: fieldbinder.model.js. Diretivas em components/input/, exceto onde indicado.

## Indice — qual input usar

| Componente | Dado | Observacao |
|---|---|---|
| `sk-text-input` | texto | o input padrao; `sk-password`, `sk-only-numbers`, `sk-restrict` |
| `sk-text-area` | texto longo | `rows` derivado de `sk-size` quando `sk-rows` nao vem |
| `sk-masked-input` | texto com mascara | `ui-mask`; base de CPF/CNPJ/CEP/telefone |
| `sk-url-input` | URL | botao abre em nova aba, prefixa `http://` |
| `sk-rich-text` | HTML | editor com barra de formatacao |
| `sk-code-editor` | codigo | wrapper do Ace |
| `sk-number-input` | numero | `sk-precision` / `sk-pretty-precision` |
| `sk-numeric-stepper` | numero | igual ao anterior + botoes `-`/`+` |
| `sk-rate-input` | 1..5 | estrelas; sem `sk-enabled` |
| `sk-date-input` | data | `sk-month-mode`, `sk-only-icon`, `sk-button-mode` |
| `sk-time-input` | hora | `sk-show-seconds`, `sk-unlimited-hour` |
| `sk-date-time-input` | data+hora | composicao de date + time |
| `sk-date-period-input` | intervalo | valor e `{dtIni, dtFin}` |
| `sk-datepicker` | calendario | standalone, nao e `FieldBinder` |
| `sk-combobox` | escolha 1 | `ui-select`; `sk-options` ou `sk-options-from-query` |
| `sk-multi-combo` | escolha N | valor `Array`, persiste string separada por virgula |
| `sk-radio-input` | escolha 1 | um elemento por opcao, agrupado por `sk-name` |
| `sk-switch` | S/N | o booleano do produto; integra com dataset |
| `sk-checkbox` | boolean | **nao** e `FieldBinder`; tri-state opcional |
| `sk-checkbox-list` | escolha N | lista com marcar/desmarcar todos |
| `sk-select-distinct-input` | escolha N | valores distintos ja existentes na coluna |
| `sk-typeahead-input` | autocomplete | opcoes por funcao (`sk-get-options`) |
| `sk-pesquisa-input` | FK | ver [pesquisa.md](pesquisa.md) |
| `sk-search-input` | filtro de tela | standalone, com debounce; nao e `FieldBinder` |
| `sk-cgc-cpf-input` | CPF/CNPJ | mascara alterna pelo tamanho |
| `sk-cep-input` | CEP | busca endereco (lupa + Correios) |
| `sk-phone-input` | telefone | tres inputs: DDD, prefixo, sufixo |
| `sk-file-input` | arquivo | grava chave de sessao no campo |
| `sk-file-input-multi` | N arquivos | popup com a lista |
| `sk-image-input` | imagem | preview + upload |
| `sk-color-picker` | cor | paleta; components/colorpicker/ |

Fora de escopo de addon (telas de dominio do produto): `sk-controle-estoque-input`, `sk-controle-produto`, `sk-company-selector`, `sk-filter-dataset`, `sk-type-select`.

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

Tambem existe em `sk-number-input`, `sk-numeric-stepper`, `sk-masked-input`, `sk-url-input` e `sk-pesquisa-input`.

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
| `sk-focus-out` | `&?` ou `=?` | — | callback de blur — **o tipo varia por componente** (ver gotcha 16) |
| `sk-end-edit` | `&` | — | fim de edicao (valor mudou entre focus e blur) |
| `sk-datagrid-editor` | `@` | `false` | modo editor inline de grid |
| `autofocus` | attr | — | foco ao montar |

### `&` chama, `=` recebe a referencia

A familia mistura os dois estilos de binding para callback, e o HTML muda conforme o caso:

```html
<!-- '&' — escreve a chamada -->
<sk-text-input sk-change="ctrl.onChange()"></sk-text-input>

<!-- '=' — passa a funcao, sem parenteses -->
<sk-cep-input sk-focus-out="ctrl.onBlur"></sk-cep-input>
```

Escrever `sk-focus-out="ctrl.onBlur()"` num componente que declara `=?` faz o Angular avaliar a chamada como expressao two-way (o retorno vira o valor bindado) e o handler nunca roda como callback.

---

# Texto

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

## sk-text-area

Arquivos: textAreaInput.directive.js.

`<textarea>` com contador implicito (`maxlength="{{size}}"`) e icone de copiar que aparece quando o campo esta desabilitado.

| Atributo | Proposito |
|---|---|
| `sk-rows` | numero de linhas; vence a derivacao automatica |
| `sk-size` | `maxlength` **e** base do calculo de `rows` |
| `sk-height` / `sk-width` | altura/largura em px — lidos de `attr`, nao do scope |
| `sk-style` | objeto passado ao `ng-style` |
| `sk-placeholder` | placeholder (passa pelo filtro `i18n`) |
| `sk-component-created` | callback apos o link |
| `sk-drop-enabled` | habilita drop |
| `sk-drag-enter` / `sk-drag-over` / **`sk-drop`** | handlers de drag — aqui o de soltar e `sk-drop`, nao `sk-drag-drop` |
| `flex` | troca a classe de altura fixa por layout flex |

`rows` sem `sk-rows`: `4` por default; `sk-size` entre 101 e 300 → `2`; entre 301 e 600 → `4`; acima de 600 → `6`. O elemento sempre recebe `resize: vertical`.

Alem dos comuns, o controller expoe `ctrl.getSelectionRange()` → `{start, end}`.

## sk-masked-input

Arquivos: maskedInput.directive.js. Base dos inputs de documento.

| Atributo | Proposito |
|---|---|
| `sk-mask` | mascara `ui-mask` (ex.: `99/99/9999`) |
| `sk-mask-func` | expressao que resolve a mascara em runtime; substitui `sk-mask` |
| `sk-default-char` | caractere de preenchimento |
| `sk-include-mask` | mantem os caracteres da mascara no valor do model |
| `sk-prevent-fill-mask` | nao preenche a mascara enquanto digita |
| `sk-fill-left-from-right` | preenche da direita para a esquerda |
| `sk-value-options` | repassado a `ng-model-options` |
| `sk-keydown` | **`=`** — referencia de funcao |
| `sk-size`, `sk-align`, `sk-placeholder`, `sk-disable-on-insertion` | idem text-input |

## sk-url-input

Arquivos: urlinput.directive.js, urlinput.controller.js.

Input de texto com botao que abre o valor em nova aba. Se o valor nao casa `\w+://`, o componente prefixa `http://` antes de abrir — o campo no banco continua sem o esquema.

Atributos: `sk-size`, `sk-placeholder`, `sk-disable-on-insertion`, `sk-keydown` (**`=`**).

## sk-rich-text

Arquivos: richtext.directive.js.

Editor HTML com barra de ferramentas configuravel.

| Atributo | Proposito |
|---|---|
| `sk-height` | altura do editor |
| `sk-auto-resize` | cresce com o conteudo |
| `sk-variaveis` | lista de variaveis oferecidas para insercao no texto |
| `sk-show-image-button` / `sk-show-link-button` / `sk-show-text-format-buttons` | liga grupos de botoes |
| `sk-hide-buttons` | esconde botoes especificos |
| `sk-pop-up-edit-enabled` | permite editar em popup ampliado |
| `sk-link-enabled` | habilita hiperlink |

## sk-code-editor

Arquivos: codeeditor.directive.js, codeeditor.controller.js. Wrapper do Ace (`ace.edit`), tema `eclipse`, basePath `/mge/scripts/vendors/ace`.

| Atributo | Proposito |
|---|---|
| `sk-mode` | sufixo do modo Ace — vira `ace/mode/<sk-mode>` (`javascript`, `xml`, `sql`, ...) |
| `sk-creation-complete` | `&`, recebe `editor` — a api com `resize(force)` e `execCommand(cmd)` |
| `sk-enabled` | `false` coloca o editor em read-only |

Nao aceita `sk-field-index`: so `sk-field-name` ou `sk-value`.

---

# Numericos

## sk-number-input

Arquivos: numberInput.directive.js, numberInput.controller.js.

Model e `Number`; a view e formatada por `NumberUtils.format` e reconvertida por `NumberUtils.stringToNumber`. Texto sempre alinhado a direita (fixo no template).

| Atributo | Default | Proposito |
|---|---|---|
| `sk-precision` | `0` | casas decimais |
| `sk-pretty-precision` | `-1` | casas decimais significativas — remove zeros a direita ate esse limite |
| `sk-restrict` | — | regex de rejeicao, aplicada via `AngularUtil.addRegexOnlyParser` |
| `sk-size` | — | `maxlength` |
| `sk-style` | — | objeto para `ng-style` |
| `sk-password` | — | renderiza como `type="password"` |
| `sk-keydown` | — | `&`, recebe `$event` |
| `sk-ignore-rm-precision` | `false` | ignora a precisao vinda do row metadata |
| `sk-avoid-formating-conflicts` | `false` | formata tambem quando `precision === 0` |
| `sk-disable-on-insertion` | `false` | idem text-input |

O componente escuta `dataset.addRowMetaDataListener` e, salvo `sk-ignore-rm-precision`, sobrescreve `sk-precision` com a propriedade `rm_precision` do registro corrente — precisao por linha vinda do backend vence a do template.

## sk-numeric-stepper

Arquivos: numericstepperinput.directive.js.

Mesmo motor numerico, com botoes `-` e `+` (`tabindex="-1"`, nao entram na navegacao por Tab). Aceita `sk-precision`, `sk-pretty-precision`, `sk-size`, `sk-value-options`, `sk-disable-on-insertion`. `layout` e `layout-align` sao lidos do elemento (default `row` / `start end`).

`sk-focus-out` aqui e **`=`**.

## sk-rate-input

Arquivos: rateInput.directive.js, rateInput.controller.js.

Cinco estrelas, valor inteiro de 1 a 5. Os atributos `sk-min`/`sk-max` aparecem comentados no fonte — **nao estao implementados**, a escala e fixa.

Scope so tem `sk-dataset`, `sk-field-name`, `sk-field-index`, `sk-value` e `sk-change`: nao ha `sk-enabled` nem `sk-required`. Para exibir sem permitir edicao, renderize outra coisa (ou bloqueie o clique no container).

---

# Data e hora

## sk-date-input

Arquivos: dateInput.directive.js.

Input com datepicker popup (`sk-datepicker-popup`), formato `dd/MM/yyyy`.

| Atributo | Proposito |
|---|---|
| `sk-month-mode` | attr do elemento; troca para formato de mes e `min-mode: month` |
| `sk-only-icon` | esconde o input, deixa so o icone de calendario |
| `sk-button-mode` | modo botao (aplica a classe `button-mode`) |
| `sk-close-on-selection` | fecha o popup ao escolher a data |
| `sk-on-select-date` | callback de selecao no calendario |
| `sk-append-to-body` | usado pelo `sk-date-period-input` ao compor |

## sk-time-input

Arquivos: timeInput.directive.js, timeInput.controller.js.

Valor no model e numerico (`Time.toNumber`), a view usa `Time.parse`.

| Atributo | Proposito |
|---|---|
| `sk-show-seconds` | inclui segundos no parse e na exibicao |
| `sk-hide-icon` | esconde o icone de relogio |
| `sk-unlimited-hour` | attr; permite hora acima de 23 (duracao, nao horario) |
| `sk-set-now` | **`=`** — substitui a funcao interna que preenche com a hora atual |

## sk-date-time-input

Arquivos: dateTimeInput.directive.js. Composicao de `sk-date-input` + `sk-time-input`.

| Atributo | Proposito |
|---|---|
| `sk-show-date` | default `true`; oculta a parte de data |
| `sk-show-seconds` | default `false`; inclui segundos |
| `sk-align` | alinhamento |

## sk-date-period-input

Arquivos: datePeriodInput.directive.js.

Dois `sk-date-input` com o rotulo "a" no meio. O valor **nao** e uma data: e o objeto `{dtIni, dtFin}`.

```html
<sk-date-period-input sk-value="ctrl.periodo" sk-change="ctrl.filtrar()"></sk-date-period-input>
```

```javascript
self.periodo = { dtIni: DateUtils.getToday(), dtFin: DateUtils.getToday() };
```

## sk-datepicker

Arquivos: components/datepicker/datepicker.directive.js.

Calendario embutido (sem input). Nao e `FieldBinder`: usa `ngModel` direto (`require: ['skDatepicker', '?^ngModel']`). Atributos: `datepicker-mode`, `date-disabled`, `only-current-month`, `custom-class`, `on-select-date`, `on-change-month`, `on-create`.

---

# Escolha

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

## sk-multi-combo

Arquivos: multicombo.directive.js, multicombo.controller.js.

Selecao multipla num popover. `scope.value` e um `Array` de chaves; no dataset o valor persiste como string separada por virgula (`getData` faz `join(',')`, `setData` faz `split(',')`).

| Atributo | Proposito |
|---|---|
| `sk-options` | `[{data, value, selected}]` — dispensavel se vier do dataset |
| `sk-label-fn` | `&`, recebe `{items}`; devolve o texto do botao |
| `sk-on-close` | `&`, recebe `{items}` ao fechar o popover |

Com `sk-dataset`, as opcoes saem de `dataset.getFieldMetadata(fieldName).options` e o rotulo default vira `"<n> - <descricao do campo> selecionados"`.

Lanca no init: `'[skMultiCombo] data set ou options precisa ser informado.'` e `'[skMultiCombo] quando dataset for informado, é necessário informar um skField.'`.

## sk-radio-input

Arquivos: radioInput.directive.js, radioInput.controller.js.

Um elemento por opcao; o label vai por transclusao. Agrupa pelo `sk-name`.

```html
<sk-radio-input sk-value="ctrl.sexo" sk-option="M" sk-name="sexo">Masculino</sk-radio-input>
<sk-radio-input sk-value="ctrl.sexo" sk-option="F" sk-name="sexo">Feminino</sk-radio-input>
```

`sk-option` e `@` (string literal) e o template usa `value="{{option}}"`, entao o valor selecionado chega como **string** — a comparacao interna e `==`. Ver gotcha 17 para as duas armadilhas do componente.

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

Arquivos: components/checkbox/checkbox.directive.js.

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

## sk-checkbox-list

Arquivos: components/checkboxlist/checkboxlist.directive.js, checkboxlist.controller.js.

Lista de checkboxes com cabecalho tri-state que marca/desmarca todos. Nao e `FieldBinder`: e um componente de selecao standalone.

| Atributo | Proposito |
|---|---|
| `sk-label` | titulo do cabecalho (passa por `i18n`) |
| `sk-options` | `[{data, value, checked}]` — `data` e a chave, `value` o rotulo |
| `sk-value` | array **mutado pelo componente** com os `data` marcados |
| `sk-single-selection` | limita a um item e esconde o checkbox do cabecalho |
| `sk-on-change` | `&`, sem argumentos |

Lanca `'sk-checkbox-list: O atributo sk-options deve ser um array de objetos!'` se `sk-options` nao for array.

## sk-select-distinct-input

Arquivos: selectdistinctinput.directive.js, selectdistinctinput.controller.js.

Abre popup com os valores **ja existentes** na coluna, para o usuario escolher entre eles — util em filtro. Renderiza sobre um `sk-text-input`.

| Atributo | Proposito |
|---|---|
| `sk-column-name` | coluna consultada; default e o `sk-field-name` |
| `sk-data-provider` | lista pronta, no lugar da consulta |
| `sk-after-load` | **`=`** — chamado depois de carregar os valores |
| `sk-key-delimiter` | separa chave e descricao dentro de cada item |
| `sk-entity-name`, `sk-size`, `sk-restrict` | idem aos correspondentes do text-input |

## sk-typeahead-input

Arquivos: typeaheadInput.directive.js (a diretiva `sk-typeahead` de baixo nivel e interna).

Autocomplete alimentado por funcao.

| Atributo | Proposito |
|---|---|
| `sk-get-options` | **`=`** — funcao que devolve as opcoes (promise ou array) |
| `sk-key` / `sk-label` | propriedades de chave e rotulo |
| `sk-min-length` | minimo de caracteres para disparar |
| `sk-limit-to` | corta a lista |
| `sk-load-on-focus` | busca ja no foco, sem digitar |
| `sk-clear-after-select` | limpa o campo apos escolher |
| `sk-show-more` / `sk-show-more-fn` | item "ver mais" no fim da lista |
| `sk-template-url` | template proprio do item |
| `sk-is-loading` | flag de carregando |
| `sk-filter-value` | valor usado no filtro |
| `sk-on-select` | **`=`** |
| `sk-focus-out` | **`=`** |

---

# Documento e contato

Os tres seguintes sao mascaras especializadas com o mesmo motor do `sk-masked-input`.

## sk-cgc-cpf-input

Arquivos: cgcCpfInput.directive.js. Alterna a mascara entre CPF e CNPJ conforme o conteudo. Atributos: `sk-size`, `sk-focus-out` (**`=`**).

## sk-cep-input

Arquivos: cepinput.directive.js.

Alem da mascara, traz lupa de pesquisa e botao de consulta aos Correios; o input fica desabilitado enquanto a consulta roda.

| Atributo | Proposito |
|---|---|
| `sk-cods-address-bind` | `<` — campos de codigo (cidade, bairro, ...) preenchidos pela consulta |
| `sk-desc-address-bind` | `<` — campos de descricao correspondentes |
| `sk-intercept-address-info` | **`=`** — intercepta o endereco antes de aplicar |
| `sk-on-select-cep` | **`=`** — apos escolher um CEP |
| `sk-address-loadded` | `&` — apos carregar o endereco |
| `sk-focus-out` | **`=`** |

## sk-phone-input

Arquivos: phoneinput.directive.js.

Tres inputs (DDD, prefixo, sufixo) num unico componente, cada um com seu `ngModelController`. `sk-focus-out` e `&` **sem `?`**: o blur sempre chama a expressao, entao declarar o atributo e efetivamente obrigatorio para nao avaliar `undefined`.

---

# Arquivo, imagem e cor

## sk-file-input

Arquivos: fileinput.directive.js, fileinput.controller.js.

Upload de um arquivo com barra de progresso. O upload real vai por `SessionFileUpload.uploadSessionFile(fileKey, file, createHttp)`.

**Ponte com o backend**: em modo dataset o que e gravado no campo **nao** e o binario, e a chave de sessao `$file.session.key{<fileKey>}` — o backend resolve esse token para o arquivo enviado. Com `sk-save-on-repository`, a chave ganha o sufixo `.saveOnRepository{<internalName>}`. O download monta `/mge/download.mge?fileName=sfi://<fileKey>`.

| Atributo | Proposito |
|---|---|
| `sk-file-key` | chave da sessao; default e o `sk-field-name` |
| `sk-upload-state` | `&` — recebe `$state`, `$value`, `$component` |
| `sk-api` | `&` — publica a api do componente (`setFileKey`, `clear`) |
| `sk-before-upload` / `sk-before-open-upload` | ganchos antes de enviar / antes de abrir o seletor |
| `sk-custom-file-uploader` | `&` — troca o uploader padrao; recebe `$fileKey` e `$file` |
| `sk-standalone-mode` | grava `{label, key}` em JSON e deriva o fileKey de entidade + campo + rowID |
| `sk-name-as-value` | grava o nome do arquivo em vez da chave de sessao |
| `sk-download-file` / `sk-custom-download-file` / `sk-intercept-url-download` | controlam o clique de download |
| `sk-save-on-repository` | persiste no repositorio, nao so na sessao |
| `sk-show-btn-cancel` | mostra o botao de remover apos concluir |
| `sk-btn-label` / `sk-btn-icon` / `sk-tooltip` | aparencia do botao |
| `sk-only-button` | attr; renderiza so o botao |
| `sk-disabled-focus` | desliga o realce de foco |

Estados entregues a `sk-upload-state` (constante `SkFileInputConstant`): `'uploading'`, `'upload-success'`, `'upload-failure'`. Arquivo de 0 byte e recusado com mensagem de erro antes de subir.

```html
<sk-file-input sk-dataset="ctrl.dataset"
               sk-field-name="ANEXO"
               sk-file-key="ANEXO"
               sk-upload-state="ctrl.onUploadState($state, $value)"
               sk-show-btn-cancel="true">
</sk-file-input>
```

## sk-file-input-multi

Arquivos: fileinputmulti.directive.js, fileinputmulti.controller.js.

Botao com contador que abre um popup (`SanPopup`) com a lista de arquivos. O campo recebe JSON com os itens; em `sk-standalone-mode` grava `{values: [...]}`. Atributos: `sk-file-key`, `sk-dataset`, `sk-field-name`, `sk-enabled`, `sk-standalone-mode`.

## sk-image-input

Arquivos: imageinput.directive.js.

Preview + upload de imagem, com fallback de icone.

| Atributo | Proposito |
|---|---|
| `sk-file` | `=`, o arquivo selecionado |
| `sk-entity-name` / `sk-pk` | de onde carregar a imagem ja gravada |
| `sk-accept-type` | tipos aceitos |
| `sk-only-image` | restringe a imagens |
| `sk-max-size` | tamanho maximo |
| `sk-width` / `sk-height` | dimensoes do preview |
| `sk-icon-default` | icone quando nao ha imagem |
| `sk-image-loader-custom` | loader alternativo |
| `sk-standalone-mode` | idem file-input |

## sk-color-picker

Arquivos: components/colorpicker/colorpicker.directive.js.

| Atributo | Proposito |
|---|---|
| `sk-data-provider` | paleta customizada |
| `sk-square-mode` | amostras quadradas |
| `sk-show-color-text-input` | campo de texto com o codigo da cor |
| `sk-disable-unselect-color` | impede limpar a selecao |
| `sk-default-color` | cor inicial |
| `sk-data-type` | tipo do valor gravado |
| `sk-on-change` | **`=`** |

---

# Busca

## sk-search-input

Arquivos: searchinput.directive.js.

Campo de filtro da propria tela — standalone, **nao** e `FieldBinder` e nao aceita `sk-dataset`.

| Atributo | Default | Proposito |
|---|---|---|
| `sk-value` | — | `=`, obrigatorio |
| `sk-debounce` | `100` | ms antes de disparar `sk-change` |
| `sk-change` | — | `&`, apos o debounce |
| `sk-cancel-search` | — | `&`, quando o valor vai de preenchido para vazio |
| `sk-on-click` | — | **`=`**; tambem disparado por Enter quando nao ha `sk-keydown` |
| `sk-keydown` | — | `&`, recebe `$event` |
| `sk-search-options` | — | opcoes de busca (adiciona a classe `has-options`) |
| `sk-search-tooltip` / `sk-tool-tip-placement` / `sk-input-helptip` | — | textos de apoio |

## sk-pesquisa-input

Campo de FK com lupa, descricao e criterios. Tem referencia propria: [pesquisa.md](pesquisa.md).

---

## Gotchas

1. **Dataset + `sk-value` juntos lanca**. `sk-text-input`, `sk-text-area`, `sk-masked-input`, `sk-radio-input`, `sk-rate-input` e `sk-combobox` checam no link e lancam `'Input que utiliza o dataset não deve fazer bind de valor.'`. Em dataset, deixar so `sk-field-name`.

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

16. **`sk-focus-out` muda de tipo conforme o componente**. `&?` (escreve a chamada) em `sk-text-input`, `sk-text-area`, `sk-number-input`, `sk-combobox`, `sk-switch`, `sk-date-input`, `sk-time-input`, `sk-date-time-input`, `sk-masked-input`, `sk-url-input`, `sk-search-input`; `&` sem `?` em `sk-phone-input`; **`=?`** (passa a referencia, sem parenteses) em `sk-cep-input`, `sk-cgc-cpf-input`, `sk-numeric-stepper`, `sk-typeahead-input` e `sk-pesquisa-input`. Mesma divisao vale para `sk-keydown` (`&` no text/number, `=` no masked/url) e `sk-on-change` (`=` no `sk-color-picker`). Conferir a diretiva antes de escrever o atributo.

17. **`sk-radio-input` nao tem `sk-focus-out` e nao aceita foco programatico**. O `linkFn` chama `scope.onFocusOut(scope)` no blur, mas `onFocusOut` **nao esta declarado no scope isolado** — quando o handler roda, e `TypeError`. Alem disso, `element.children()[0]` e o `<label>` do template (o `<input>` esta dentro dele), entao `ctrl.setFocus()`/`ctrl.select()` miram um elemento que nao e focavel — `label.select` sequer existe. Na pratica: nao use foco programatico nesse componente e nao declare `sk-focus-out`.

18. **`sk-align` nao funciona no `sk-date-input`**. O objeto `templateArgs` do `getTemplate` declara a chave `style` duas vezes — a segunda (`close-on-date-selection`) sobrescreve a do alinhamento, que nunca chega ao template. Vale tambem para o `sk-date-period-input`, que repassa `sk-align` aos dois date-inputs internos.

19. **`sk-rate-input` nao tem `sk-enabled`**. O scope isolado nao declara `enabled` nem `required`; `sk-min`/`sk-max` estao comentados no fonte. E sempre editavel e sempre 1..5.

20. **`sk-multi-combo` e `sk-checkbox-list` mutam o array recebido**. O multi-combo escreve `selected` em cada objeto de `sk-options` e reusa o array de `sk-value`; o checkbox-list escreve `checked` nas opcoes e faz `value.length = 0` para reaproveitar a referencia. Nao passar direto o array de metadata (ou qualquer objeto compartilhado) — clonar antes.

21. **No `sk-text-area` o handler de soltar e `sk-drop`**, nao `sk-drag-drop` como no `sk-text-input`. E `sk-height`/`sk-width` sao lidos de `attr` (px, numero), nao do scope: nao aceitam expressao Angular.

22. **`sk-file-input` grava chave de sessao, nao arquivo**. O campo do dataset recebe `$file.session.key{<fileKey>}`; quem materializa e o backend. Ler esse campo esperando nome ou caminho de arquivo devolve o token. Com `sk-name-as-value="true"` o valor passa a ser o nome do arquivo — e ai nao ha mais como o backend recuperar o binario por essa chave.

23. **`sk-precision` default e `0`**. Sem informar, `sk-number-input` nao formata decimais: `formatToView` so chama `NumberUtils.format` quando `precision > 0` (ou com `sk-avoid-formating-conflicts`). Campo com casas decimais no dicionario precisa de `sk-precision` explicito no template — ou de `rm_precision` vindo do row metadata.

24. **`NumberUtils.stringToNumber` le ponto isolado como decimal**. `'1.234'` vira `1.234`, nao `1234` — o separador de milhar so e descartado quando ha virgula depois dele (`'1.234,56'` → `1234.56`). Cuidado ao combinar `sk-avoid-formating-conflicts` com `sk-precision="0"` em valores acima de mil: a view ganha o ponto de milhar e o parse de volta o interpreta como decimal.

25. **`sk-set-now` substitui a funcao, nao e callback**. Em `sk-time-input`, `$scope.setNow = $scope.setNow || setNow` — passar o atributo troca o comportamento do botao de "agora" pela sua funcao. Para so reagir ao preenchimento, use `sk-change`.

26. **`sk-search-input` limpa via `sk-cancel-search`**. Quando o valor vai de preenchido para vazio (inclusive pelo botao de limpar), o componente chama `sk-cancel-search` **em vez de** `sk-change`. Tela que so escuta `sk-change` nunca recebe o evento de "filtro removido" e continua exibindo a lista filtrada.
