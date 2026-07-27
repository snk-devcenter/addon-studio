# sankhya-js — componentes de UI (overlay, layout, listas, comportamento)

Componentes genericos do bundle `snk` que nao entram nas referencias de formulario, grade e input. Sao os blocos de montagem da tela: aviso flutuante, painel colapsavel, lista, arrastar e redimensionar.

Para dialogo modal (`SanPopup`, `MessageUtils`) veja [messages-popup.md](messages-popup.md); para popup de campos, [popup-parameter.md](popup-parameter.md).

## Indice

| Componente | Tipo | Serve para |
|---|---|---|
| `WaitWindow` | service | bloquear a tela com "aguarde" durante processamento longo |
| `SnackbarService` / `sk-snackbar` | service + diretiva | aviso nao-modal no canto da tela |
| `sk-popover` | atributo | conteudo flutuante ancorado num botao, com Aplicar/Fechar |
| `sk-help-tip` | elemento | icone de interrogacao com texto de ajuda |
| `TooltipBuilder` | provider | tooltip por codigo, sem atributo no HTML |
| `sk-dropdown` | elemento | menu suspenso com itens, cabecalho e separador |
| `sk-scroll-container` | atributo | rolagem por mousewheel em area que nao rola sozinha |
| `sk-accordion` / `sk-accordion-group` | elemento | seções colapsaveis |
| `sk-divider` | elemento | linha separadora |
| `sk-loading-panel` | elemento | painel "Carregando" sobre a area |
| `sk-work-box` | elemento | caixa de trabalho com layout e drop |
| `sk-list` | elemento | lista selecionavel, com drag & drop opcional |
| `sk-entity-card` | elemento | cartao de visita de um registro de entidade |
| `sk-btn-novo` | elemento | botao "novo" ligado ao dataset |
| `sk-draggable` | atributo | mover elemento pela tela |
| `sk-resizable` | elemento/atributo | painel redimensionavel |
| `sk-sortable` | atributo | reordenar itens de um `ng-repeat` |

---

# Overlay e feedback

## `WaitWindow` — bloqueio durante processamento

components/waitwindow/waitwindow.service.js. `SanPopup` sem botoes, sem `Esc` (`keyboard: false`), sem icone de fechar e sem arrastar.

```javascript
WaitWindow.show('Processando...');
ServiceProxy.callService('<addon>@ProcessamentoSP.executar', payload)
    .then(function (r) { WaitWindow.change('Gravando...'); return gravar(r); })
    .finally(WaitWindow.close);
```

| Metodo | Efeito |
|---|---|
| `show(message)` | abre; **se ja houver instancia, apenas troca a mensagem** |
| `change(message)` | troca a mensagem da instancia aberta |
| `close()` | fecha e limpa a instancia |

## `SnackbarService` — aviso nao-modal

components/snackbar/snackbar.service.js. Cria um `<sk-snackbar>` e o insere no inicio do `body`.

```javascript
SnackbarService.open({
    title: 'Importacao',
    message: 'Arquivo processado.',
    duration: 4000,
    positionHorizontal: 'right',
    positionVertical: 'bottom',
    iconName: 'check',
    customClass: 'minha-classe'
});
```

A diretiva `sk-snackbar` aceita os mesmos campos (`sk-snackbar-title`, `sk-snackbar-message`, `sk-snackbar-duration`, `sk-position-horizontal`, `sk-position-vertical`, `sk-custom-class`, `sk-icon-name`) quando voce prefere declarar no template.

## `sk-popover` — conteudo flutuante ancorado

components/popover/popover.directive.js. Atributo num botao; o conteudo vem de um template.

```html
<button sk-popover
        popover-template-url="html5/<Tela>/popover/filtros.tpl.html"
        popover-placement="bottom"
        apply-handler="ctrl.aplicarFiltros()"
        properties="ctrl.propsDoPopover">
    Filtros
</button>
```

| Atributo | Default | Efeito |
|---|---|---|
| `popover-template-url` | — | template do conteudo |
| `popover-placement` | `bottom` | `top` ou `bottom` |
| `popover-container` | `body` | onde o popover e anexado |
| `popover-hide-on-outside-click` | `true` | fecha ao clicar fora |
| `popover-hide-on-button-click` | `true` | fecha ao reclicar no botao |
| `create-on-load` | `true` | monta no DOM junto com a tela; `false` adia para a primeira interacao |
| `show-btn-apply` / `show-btn-close` | `true` | botoes Aplicar/Fechar |
| `apply-handler` | — | callback do Aplicar |
| `before-close-handler` | — | roda antes de fechar; pode devolver promise para segurar o fechamento |
| `properties` | — | objeto repassado ao scope do template |
| `always-load-properties` | — | reavalia `properties` a cada abertura |
| `popover-listeners` | — | `{onOpen, onClose}` |
| `hide-delay` | — | atraso para esconder |
| `enable` / `lock-on-pop-up` | — | habilita/trava a abertura |

## `sk-help-tip` — icone de ajuda

components/helptip/helptip.directive.js. Renderiza o icone de interrogacao; o clique alterna um tooltip que **nao fecha sozinho** (`duration(-1)`).

```html
<sk-help-tip sk-help-tip="Cadastro.msgAjudaCampoX" sk-placement="right"></sk-help-tip>
```

O texto vem de `sk-help-tip` ou `sk-text` e passa por `i18n`. `sk-scrollable="true"` exige `sk-placement="bottom"` (ver gotcha 5). `sk-class-help` adiciona classe ao tooltip.

## `TooltipBuilder` — tooltip por codigo

components/tooltipbuilder/tooltipbuilder.service.js. Provider que devolve um builder por elemento.

```javascript
var tip = TooltipBuilder(element)      // element opcional; ou .targetElement(el) depois
    .message('Preencha o responsavel')
    .placement('right')
    .duration(-1)                      // -1 = so fecha por hide()/clique
    .customClass('minha-classe');

tip.show();
tip.isOpen();
tip.hide();
```

Defaults: `duration: 3000`, `placement: 'top'`. Metodos encadeaveis: `message`, `duration`, `customClass`, `placement` (gerados a partir das opcoes), mais `option(k, v)`, `options(obj)`, `targetElement(el)`, `opener(el)`, `i18n(chave, valores)`, `setScrollable(bool)`, `show`, `hide`, `isOpen`.

## `sk-dropdown` — menu suspenso

components/dropdown/dropdown.directive.js. O item selecionado e escrito em `sk-value`.

```html
<sk-dropdown sk-value="ctrl.opcao" sk-text="Acoes" sk-font-icon="menu">
    <sk-dropdown-header>Exportar</sk-dropdown-header>
    <sk-dropdown-item value="pdf">PDF</sk-dropdown-item>
    <sk-dropdown-item value="xls">Planilha</sk-dropdown-item>
    <sk-dropdown-separator></sk-dropdown-separator>
    <sk-dropdown-item value="csv">CSV</sk-dropdown-item>
</sk-dropdown>
```

Filhos reconhecidos: `sk-dropdown-header`, `sk-dropdown-item`, `sk-dropdown-separator`, `sk-dropdown-switch`. Sem `value`, o item recebe o indice. O rotulo do item passa pelo filtro `translate`. Atributos: `sk-value` (`=`), `sk-text`, `sk-font-icon`, `sk-svg-url`.

Para abrir dropdown por codigo existe o `DropdownUtil` (`create`, `open`, `close`, `isOpen`).

---

# Layout

## `sk-scroll-container`

core/util/scrollcontainer/scrollcontainer.directive.js. Atributo. Converte `mousewheel`/`DOMMouseScroll` em `scrollTop += 30`, para area que nao rola nativamente.

```html
<div sk-scroll-container class="minha-area">...</div>
<div sk-scroll-container="ctrl.rolagemLigada">...</div>   <!-- expressao liga/desliga -->
```

## `sk-accordion` e `sk-accordion-group`

components/accordion/. O container aplica `layout="column"` e `flex`.

```html
<sk-accordion close-others="false">
    <sk-accordion-group heading="Dados gerais" is-open="ctrl.abrirGerais">
        <!-- conteudo -->
    </sk-accordion-group>
    <sk-accordion-group heading="Anexos" sk-icon="paperclip" sk-icon-tooltip="Anexos">
        <!-- conteudo -->
    </sk-accordion-group>
</sk-accordion>
```

| Atributo do grupo | Tipo | Efeito |
|---|---|---|
| `heading` | `@` | titulo |
| `is-open` | `=?` | controla/reflete a abertura |
| `is-disabled` | `=?` | bloqueia |
| `is-required` | `=?` | marca como obrigatorio |
| `sk-invalid` | `=?` | marca visualmente como invalido |
| `sk-icon` / `sk-icon-svg-src` / `sk-icon-color` / `sk-icon-tooltip` | `@?` | icone no cabecalho |
| `sk-icon-click` | `&?` | clique no icone |

No `sk-accordion`, `close-others` (default `true`, da constante `accordionConfig`) define se abrir um fecha os demais.

## `sk-divider` e `sk-loading-panel`

- `sk-divider`: elemento sem atributos; so aplica a classe `sk-divider`.
- `sk-loading-panel`: icone girando + `Geral.lblCarregando`, posicionado com `container-absolute` sobre a area. Sem atributos — controle a exibicao com `ng-if`/`ng-show`.

## `sk-work-box`

components/workbox/workbox.directive.js. Caixa com layout e area de soltura.

| Atributo | Efeito |
|---|---|
| `sk-direction-layout` | `V`/`vertical` → `layout="column"`; `H`/`horizontal` → `layout="row"` |
| `sk-width` / `sk-height` | numero, aplicado como **porcentagem** |
| `sk-creation-complete` | `&?` apos o link |
| `sk-drop` / `sk-drag-over` | `&?` handlers |
| `sk-on-resize-workbox` | `&?` |

---

# Listas e cartoes

## `sk-list`

components/list/list.directive.js. Container de lista selecionavel; os itens vem de um `ng-repeat` dentro dele.

```html
<sk-list sk-api="ctrl.listApi"
         sk-on-selection="ctrl.onSelecionar($item)"
         sk-drag-enabled="true" sk-drop-enabled="true"
         sk-drop="ctrl.onDrop(event)"
         sk-scroll-container flex>
    <div ng-repeat="item in ctrl.itens" layout-padding ng-bind="item.DESCRICAO"></div>
</sk-list>
```

| Atributo | Tipo | Efeito |
|---|---|---|
| `sk-api` | `=?` | publica a api do componente |
| `sk-on-selection` | `&?` | selecao mudou |
| `sk-drag-enabled` / `sk-drop-enabled` | `=?` | liga arrastar/soltar |
| `sk-drag-start` / `sk-drag-enter` / `sk-drag-over` / `sk-drag-end` / `sk-drop` | `&?` | handlers; o evento chega como `event` (jqLite) |
| `sk-enable-css-table` | `=?` | usa as cores da grade |

## `sk-entity-card`

components/entitycard/entitycard.directive.js. Cartao de visita de um registro — nome, imagem, campos e atalho para o cadastro.

```html
<sk-entity-card sk-entity-name="'Parceiro'"
                sk-pk-field="'CODPARC'"
                sk-description-field="'NOMEPARC'"
                sk-fields-metadata="ctrl.metadataParceiro"
                sk-enable-show-details="true">
</sk-entity-card>
```

Repare que os bindings sao `=` (expressao), nao `@`: string literal precisa de aspas dentro do atributo.

| Atributo | Efeito |
|---|---|
| `sk-entity-name` | nome da `<instance>` |
| `sk-pk-field` / `sk-all-pks` / `sk-other-entity-pks` | chave do registro |
| `sk-description-field` / `sk-image-field` | campos de titulo e imagem |
| `sk-fields-metadata` | metadados dos campos exibidos |
| `sk-data` | dados ja carregados |
| `sk-fields-limit` | `@`, corta a quantidade de campos |
| `sk-enable-show-details` | link para o cadastro |
| `sk-resource-id` | tela aberta no detalhe |
| `sk-is-favorite` / `sk-disable-favorite-opt` | estrela de favorito |
| `sk-single-column` / `sk-compact` / `sk-highlight-on` | layout |

## `sk-btn-novo`

components/btnnovo/btnnovo.directive.js. Botao padrao de inclusao, com tooltip derivado da entidade.

| Atributo | Efeito |
|---|---|
| `sk-dataset` | dataset onde a inclusao acontece |
| `sk-do-bind` | `=?` liga o clique ao `dataset` |
| `sk-on-click` | `&?` acao propria |
| `sk-entity-description` | `@?` nome exibido no tooltip |
| `sk-tooltip-text` / `sk-tooltip-placement` | `@?` |
| `sk-compact` / `sk-enabled` | `=?` |

---

# Comportamento

## `sk-draggable`

components/draggable/draggable.directive.js. Atributo: arrasta o elemento (ou um ancestral) com mouse/touch.

```html
<div class="janela">
    <div class="titulo" sk-draggable draggable-level="1">Arraste aqui</div>
</div>
```

`draggable-level` (default `0`) diz quantos niveis subir do elemento marcado ate o que sera movido — `1` move o pai. O elemento movido recebe `position: absolute`. Filho com o atributo `sk-draggable-off` nao inicia o arrasto.

## `sk-resizable`

components/resizable/resizable.directive.js. Painel redimensionavel; normalmente dentro de `sk-resizable-columns` / `sk-resizable-rows`.

```html
<sk-resizable-columns sk-height="100%">
    <div sk-resizable sk-direction="'right'" sk-min-width="200">...</div>
    <div>...</div>
</sk-resizable-columns>
```

`sk-direction` e `=` (expressao — a string vai entre aspas). Demais: `sk-width`, `sk-height`, `sk-min-width`, `sk-min-height`, `sk-grabber`, `sk-disabled`, `sk-centered-x`, `sk-centered-y`, `sk-sibling`, `sk-show-sibling`, `sk-relative-size`, `sk-relative-resizable`, `sk-resize-to-pixel`, `sk-change-layout`, `sk-resize-next-preview`, `sk-handle-workbox-resize`, e os callbacks `sk-on-resize` e `sk-on-change-relative-size`.

## `sk-sortable`

components/sortable/sortable.directive.js. Atributo sobre o container de um `ng-repeat`; reordena o array de origem.

```html
<ul sk-sortable="ctrl.sortableOptions">
    <li ng-repeat="item in ctrl.itens">{{item.DESCRICAO}}</li>
</ul>
```

O objeto de opcoes e o da lib `Sortable`, com callbacks nomeados `onStart`, `onEnd`, `onUpdate`, etc., recebendo `{model, models, ...}`. A diretiva descobre o array pelo `ng-repeat` do proprio elemento — sem `ng-repeat` dentro, nao ha o que ordenar.

---

## Gotchas

1. **`SnackbarService.open` monta os atributos como string com aspas simples**. O service faz `setAttribute('sk-snackbar-message', "'" + message + "'")` e depois compila: mensagem contendo apostrofo quebra a expressao Angular. Passe chave i18n ou texto sem `'` — para conteudo dinamico, prefira montar `<sk-snackbar>` no template com bind.

2. **`WaitWindow` e singleton e nao fecha sozinho**. Com uma instancia aberta, `show()` so troca a mensagem. E como o popup nao tem botao, `Esc` desligado e sem icone de fechar, esquecer o `close()` num caminho de erro **trava a tela**. Feche no `finally`, nao no `then`.

3. **`sk-accordion` fecha os outros por default**. `accordionConfig.closeOthers` e `true`; para manter mais de um grupo aberto, `close-others="false"` no `sk-accordion`.

4. **`sk-help-tip` fica aberto ate o proximo clique**. O builder e criado com `duration(-1)`. Em tela com varios help-tips, cada um mantem o seu — nenhum fecha o do vizinho.

5. **Tooltip scrollable so com `placement: 'bottom'`**. `TooltipBuilder` lanca `'[TooltipBuilder] Tooltip scrollable só pode ser usado com placement = "bottom"'` no recalculo de tamanho — vale tambem para `sk-help-tip` com `sk-scrollable="true"` e `sk-placement` diferente de `bottom`.

6. **`sk-draggable` aplica `position: absolute`** no elemento movido, o que costuma quebrar layout flex do pai. E `draggable-level` maior que a profundidade real lanca `'Undefined parent at level N.'` no link.

7. **`sk-entity-card` e `sk-resizable` usam `=` onde parece `@`**. `sk-entity-name="Parceiro"` avalia `Parceiro` como variavel de scope (resulta `undefined`); o correto e `sk-entity-name="'Parceiro'"`. Mesma coisa em `sk-direction="'right'"`.

8. **`sk-scroll-container` nao cria area rolavel**. Ele so traduz a roda do mouse em `scrollTop`, 30px por evento; o elemento ainda precisa de altura limitada e `overflow` no CSS. Sem isso o atributo nao faz nada visivel.

9. **O evento dos handlers de `sk-list` e jqLite**. Em `sk-drop="ctrl.onDrop(event)"`, o `dataTransfer` esta em `event.originalEvent.dataTransfer` — acessar `event.dataTransfer` direto devolve `undefined`.

10. **`sk-work-box` re-hooka o `controllerAs` em `$contextControllerChanged`**. Como o `sk-tab`, ele resolve o controller de contexto no postLink e so atualiza quando esse evento e emitido. Trocar o controller da tela dinamicamente exige emitir `$rootScope.$emit('$contextControllerChanged')`.
