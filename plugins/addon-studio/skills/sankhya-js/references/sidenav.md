# sk-sidenav — painel lateral

Painel lateral (esquerda/direita/top/bottom) com animacao de abertura, backdrop, swipe em mobile, media-query-based `locked` (parte do layout), modo fixo e foco programatico. Controlavel via two-way (`is-open`) ou via service `skSidenav(handle)` ancorado no `sk-id`.

Arquivos: sidenav.directive.js, sidenav.controller.js, sidenav.service.js, sidenav.constant.js.

## Tres directives + um atributo

| Directive | Template | Proposito |
|---|---|---|
| `sk-sidenav` | `sidenav.tpl.html` | painel vertical (esquerda/direita) |
| `sk-sidenav-horizontal` | `sidenavHorizontal.tpl.html` | painel horizontal (top/bottom) |
| `sk-sidenav-focus` | — | atributo `A` em elemento interno que deve receber foco ao abrir |

Controller compartilhado `skSidenavController` expoe `open/close/toggle/isOpen/isLockedOpen/focusElement/redraw`.

## Uso basico

```html
<!-- Painel esquerda, locked em telas grandes -->
<sk-sidenav sk-id="menuPrincipal"
            is-open="false"
            is-locked-open="skMedia('gt-sm')"
            sk-width="320px">
    <div layout-padding>
        <h1>Menu</h1>
        <input type="text" sk-sidenav-focus>
    </div>
</sk-sidenav>

<!-- Painel direita, fechado por default -->
<sk-sidenav sk-id="ajuda"
            sk-sidenav-right
            sk-on-close="ctrl.onAjudaClose()">
    <div layout-padding>Ajuda lateral</div>
</sk-sidenav>
```

Controle programatico:

```javascript
skSidenav('menuPrincipal').toggle().then(function() { /* animou */ });

// Ou via registry
SkComponentRegistry.get('menuPrincipal').then(function(ctrl) {
    ctrl.open();
});
```

## Bindings (scope isolado)

| Binding | Tipo | Proposito |
|---|---|---|
| `is-open` | `=?` | two-way; aberto/fechado |
| `sk-id` | `@?` | handle usado por `skSidenav(handle)` e `SkComponentRegistry` |
| `sk-on-toggle` | `&` | callback apos toggle — **dispara mesmo sem mudar estado** |
| `sk-on-close` | `&?` | callback apos transicao para fechado |
| `backdrop-class` | `@?` | classe CSS adicional no backdrop |
| `sk-is-fixed-mode` | `=?` | painel ocupa espaco fixo no layout (nao flutua) |

## Atributos de compile (sem scope binding)

Lidos diretamente do `$attrs`:

| Atributo | Efeito |
|---|---|
| `sk-sidenav-right` | alinha a direita; default: esquerda |
| `sk-sidenav-bottom` | (horizontal) alinha embaixo; default: topo |
| `sk-filter-panel-mode` | aplica `.sk-sidenav-filter-panel-mode` + `.high-contrast-panel` |
| `is-locked-open` | expressao avaliada no `$parent` recebendo `skMedia` como local — quando truthy, painel vira parte do layout (classe `.sk-locked-open`) |
| `sk-width` | forca `width`/`max-width`/`min-width` (vertical) |
| `sk-height` | forca `height`/`max-height`/`min-height` (horizontal) |
| `sk-remove-parent-scroll` | nao congela `overflow` do pai ao abrir |
| `child-layout` ou `layout` | propagado para o segundo filho como atributo `layout=` |

## Default de `is-locked-open`

```javascript
// Sem is-locked-open declarado:
isLocked = skMedia('gt-lg');
```

Em telas `gt-lg` o painel aparece locked **mesmo sem `is-open`**. Abaixo desse breakpoint, fica flutuante.

## API do controller (via `SkComponentRegistry`)

| Metodo | Retorno | Proposito |
|---|---|---|
| `isOpen()` | boolean | estado corrente |
| `isLockedOpen()` | boolean | **observacao**: le `$scope.isLockedOpen` que nao e atualizado pela expressao — retorna sempre falsy a menos que setado manualmente |
| `open()` | promise | abre (resolve apos animacao) |
| `close()` | promise | fecha |
| `toggle()` | promise | alterna |
| `focusElement(el?)` | el | getter/setter do elemento que recebe foco ao abrir |
| `redraw()` | — | no-op por default; sobrescrito por consumidores que precisam recalcular ao mudar fixed-mode |

## Service `skSidenav(handle)`

Wrapper sobre `SkComponentRegistry`. Metodos retornam promise ou rejeitam quando o handle nao esta registrado.

```javascript
// Aguardar registro
skSidenav('meuId').then(function() {
    skSidenav('meuId').open();
});

// Direto — rejeita se nao registrado
skSidenav('meuId').toggle().catch(function(err) {
    // err: "SideNav 'meuId' nao esta disponivel!"
});
```

Metodos expostos: `isOpen`, `isLockedOpen`, `toggle`, `open`, `close`, `then(fn)`.

## Gestos e teclado

- **Swipe**: `SwipeUtil.left(scope, parent,...)` + `.right(...)` binda o **pai** do sidenav, nao o proprio. Regras:
 - Esquerda fechado + swipe right em `startX <= 50` → abre
 - Esquerda aberto + swipe left em `startX ∈ [290, 320]` → fecha
 - Direita fechado + swipe left perto da borda esquerda do painel → abre
 - Direita aberto + swipe right perto da borda esquerda do painel → fecha
- **ESC** dentro do painel dispara `close()` (ignorado quando locked).
- **Keydown** so esta ativo enquanto o painel esta aberto (bind/unbind dinamico no pai).

## Ciclo de animacao

```
toggleOpen(true)
  └→ isOpen = true
  └→ $timeout(0)
      └→ updateIsOpen(true):
          parent.on('keydown', onKeyDown)
          backdrop.on('click', close)
          triggeringElement = document.activeElement
          disableParentScroll(true)   // overflow: hidden no pai
          addRemoveLockedOpen(isLocked)
          $animate.enter(backdrop, parent)  // so quando nao-locked
          $animate.removeClass(element, 'sk-closed')
          $animate.addClass(element, 'sk-open')
          → focusElement.focus()
```

No fechamento: `triggeringElement.focus()` devolve foco ao elemento que abriu o sidenav.

## Gotchas

1. **`is-locked-open` sobrepoe `is-open`**. Quando a expressao resolve truthy, o painel abre mesmo com `is-open=false` e a classe `.sk-locked-open` e aplicada. Para painel sempre flutuante, omitir o atributo **nao basta** — o default e `skMedia('gt-lg')`, ou seja, locked em telas largas. Setar explicitamente `is-locked-open="false"`.

2. **`is-locked-open` e avaliada no `$parent`, nao no scope isolado**. Variaveis que so existem dentro do sidenav nao funcionam na expressao. Deve ser uma propriedade acessivel pelo controller externo (ou `skMedia(...)`, que e injetado como local).

3. **`userLastState` persiste entre resizes**. Se o usuario fechou manualmente, mudar a viewport para um tamanho locked **nao reabre** automaticamente — o framework respeita a ultima acao do usuario. Resetar requer recriar a directive.

4. **`sk-on-toggle` dispara mesmo quando o estado nao muda**. `toggleOpen(isOpen)` com `scope.isOpen == isOpen` retorna imediatamente mas **ainda chama `scope.onToggle()`**. Consumidor que conta toggles reais tem que comparar estados.

5. **`sk-on-close` so dispara na transicao para fechado**. Nao dispara em outro toggle. Para logica sempre-que-muda, usar `sk-on-toggle` + ler `isOpen`.

6. **`ctrl.isLockedOpen()` retorna valor defasado**. O controller le `$scope.isLockedOpen`, que nao e populado pela expressao `is-locked-open` (essa e avaliada dentro do link). Para checagem em runtime, consultar classe `.sk-locked-open` no elemento ou reavaliar a expressao externamente.

7. **Sidenav sem `sk-id` e incontrolavel via service**. Sem registro no `SkComponentRegistry`, `skSidenav(undefined)` falha. So `is-open` two-way externa funciona.

8. **`sk-id` e `@?`**. Mudanca dinamica do atributo nao re-registra no `SkComponentRegistry`. Trocar o id requer destruir e recriar o elemento.

9. **`disableParentScroll` reverte para o valor inicial**. Ao abrir, grava `parent.css('overflow')`; ao fechar, restaura. Se codigo externo mudou o overflow enquanto estava aberto, a restauracao sobrescreve. `sk-remove-parent-scroll` desliga esse comportamento.

10. **Backdrop animado so em modo flutuante**. Em locked, `$animate.enter/leave(backdrop)` nao e chamado. Customizacoes via `backdrop-class` so aparecem no modo nao-locked.

11. **Swipe de abertura assume `startX <= 50` para esquerda**. Layouts com sidebar principal ocupando a margem esquerda podem impedir o gesture. Swipe de direita usa a posicao do proprio painel (`sidenavRect.left`), entao depende da largura.

12. **`parent.min-width: 10px` (ou `min-height`)** e aplicado via `SidenavConstants.DEFAULT_CLOSED_SIZE`. Pai sem dimensionamento proprio acaba com 10px visiveis mesmo fechado — util como "alca" de swipe, mas surpreende quem espera zero.

13. **`sk-sidenav-focus` so funciona apos a animacao**. O `focusEl.focus()` roda dentro do `.then()` da promise de animacao. Elementos adicionados ao DOM apos o abrir nao recebem foco ate a proxima abertura.

14. **`recalcFixedMode` tem branch diferente para IE**. Usa `min-width`/`min-height` alem de `width`/`height`. Em IE, sidenav em fixed-mode fechado fica com `SidenavConstants.DEFAULT_CLOSED_SIZE`; outros browsers ficam com `auto`. Testar layout em IE se fixed-mode e critico.

15. **`sk-filter-panel-mode` nao e `sk-filter-panel`**. Apenas aplica classes de alto contraste para harmonizar o sidenav visualmente com um painel de filtros. Nao adiciona funcionalidade de filtro.

16. **`$window.resize` listener e removido no `$destroy` do scope**, mas nao em `$element.on('$destroy')`. Em cenarios raros onde o elemento e removido fora do ciclo Angular (ex.: `element.remove()` manual), o listener pode ficar orfao ate o GC do `$window`.

17. **`SwipeUtil.left/right` binda no pai**. Outros gestures horizontais dentro do pai (carousels, sliders) disputam o swipe. Em telas com `sk-sidenav-left`, componentes swipe-sensitive perto da borda esquerda podem conflitar.
