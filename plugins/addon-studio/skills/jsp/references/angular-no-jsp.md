# A API que a ilha Angular destrava num `.jsp`

Subir Angular + `snk.js` dentro de um `.jsp` (SKILL.md §5) dá acesso à mesma API das telas
`sankhya-js`: `ServiceProxy`, `MessageUtils`, `SanPopup` e `SkWorkspace`. Este documento
cobre o que muda **fora** do `Html5Launcher` — o resto do contrato de cada serviço está na
skill `sankhya-js`, em [`references/api-cheatsheet.md`](../../sankhya-js/references/api-cheatsheet.md)
e [`references/messages-popup.md`](../../sankhya-js/references/messages-popup.md).

---

## `ServiceProxy.callService(serviceName, payload)`

Devolve promise. Substitui o `executeQuery` da taglib quando você quer loading, encadeamento
e o tratamento de erro do framework — inclusive o popup de erro nativo, que o próprio
`ServiceProxy` abre quando o serviço volta com status diferente de sucesso.

```js
ServiceProxy
  .callService('ExecQuerySP.execQuery', {
    querydata: {
      query:  { '$': sql },
      config: { name: 'maxRows', value: '-1' }
    }
  })
  .then(function (resp) { /* resp.responseBody */ });
```

**Lê a global `VSS` em toda chamada.** Fora do `Html5Launcher` ninguém a declara: sem ela,
`ReferenceError` em cada ida ao backend. Ver SKILL.md §5.

**`serviceName` sem prefixo chama serviço nativo.** Sem `<addon>@`, o framework assume
`defModule = "mge"`. Isso é o desejado para `ExecQuerySP.execQuery`; para um `@Controller`
do próprio add-on o nome é `'<addon>@<Nome>SP.<metodo>'` — skill `controller`.

**Query inválida volta com status de sucesso**, com o erro dentro de
`responseBody.queryExecResult`. Mesma armadilha do `executeQuery` da taglib
([`gadget-api.md`](gadget-api.md)): sem testar esse campo, SQL quebrado chega à tela como
lista vazia.

**`line` e `column` chegam como objeto único quando há só um.** Normalize para array antes
de iterar, senão a tela com um registro só quebra e a com dois funciona.

---

## `MessageUtils` — popups de mensagem

```js
MessageUtils.showInfo('Título', 'Mensagem');
MessageUtils.showError('Título', 'Mensagem');
MessageUtils.showAlert('Título', 'Mensagem');

MessageUtils.simpleConfirm('Título', 'Confirma?')
  .then(function () { /* Sim */ })
  .catch(function () { /* Não */ });
```

`simpleConfirm` devolve promise: resolve no Sim, rejeita no Não. Não há callback.

**Os labels dos botões vêm do i18n.** As 14 chaves `Geral.*` (`Geral.buttonSim`,
`Geral.buttonNao`, `Geral.msgTitleErro`, …) moram em `/mge/assets/i18n/<locale>/_Framework.json`.
Sem o gate de i18n antes do `angular.bootstrap` (SKILL.md §5), o popup abre com a **chave
crua** no lugar do label. É o sintoma mais visível de bootstrap sem gate — e ele não quebra
nada, só fica feio, então passa despercebido em teste rápido.

**`MessageUtils` injeta `ButtonThemes`**, de `snk.components.button` — é por isso que esse
módulo está no fecho de dependências mesmo numa tela sem botão do framework.

---

## `SanPopup.open(config)` — popup com template e controller próprios

```js
SanPopup.open({
  title: 'Escolher produto',
  size: 'md',                 // sm | md | lg
  type: 'primary',
  grayBG: true,
  okBtnLabel: 'Selecionar',
  template: '<select ng-model="ctrl.item" ng-options="p.DESCR for p in ctrl.itens"></select>',
  controllerAs: 'ctrl',
  controller: ['$scope', '$popupInstance', 'itens', function ($scope, $popupInstance, itens) {
    var c = this;
    c.itens = itens;
    $scope.$success = function () { $popupInstance.success(c.item); };
  }],
  resolve: { itens: function () { return vm.itens; } }
})
.result
  .then(function (item) { /* Ok */ })
  .catch(function ()     { /* cancelou ou fechou */ });
```

**O botão Ok chama `$success()` sem argumento** (`popup.tpl.html` → `onSuccess()`). Ou seja:
o `.result` resolve com `undefined` se você não fizer nada. **Sobrescrever `$scope.$success`
no controller do popup é a forma documentada de devolver um valor** — não existe outro
gancho, e devolver por variável compartilhada com o controller de fora é o anti-pattern que
essa API existe para evitar.

`resolve` é o único caminho de entrada de dados: as funções são resolvidas antes de
instanciar o controller, e o resultado é injetado por nome, como no `$routeProvider`.

**O popup é pendurado no `<body>`, fora da `div` da app** — é por isso que o bootstrap é
`angular.bootstrap(document, ...)` e não numa `div`, e por isso que `bootstrap.min.css`
precisa estar carregado (SKILL.md §5): sem ele o `.modal` perde `position:fixed` e o popup
renderiza em fluxo normal no fim da página. Existe no DOM, fecha no ESC, e não aparece.

**`SanPopupStack` injeta `SkTourService`**, de `snk.core.tour` — a razão desse módulo no fecho.

---

## `SkWorkspace.openAppActivity(resourceId, pkObject)`

```js
SkWorkspace.openAppActivity('<resourceId da tela de destino>', { CODPARC: Number(cod) });
```

Mesmo efeito do `openApp` da taglib ([`gadget-api.md`](gadget-api.md)), pelo serviço do
framework em vez de resolver `parent.workspace` na mão. Vale a mesma regra: o `pkObject` vai
inteiro, sem serializar, com a chave sendo o nome da coluna da PK.

**`SkWorkspace` lê a global `workspace` no construtor** — não no método. Basta **injetar** o
serviço para o `ReferenceError` acontecer, mesmo que a tela nunca navegue. Por isso a global
é declarada mesmo quando resolve para `undefined` (`.jsp` aberto pela URL, fora do menu);
nesse caso o serviço instancia e a navegação é que não tem destino.

Numa tela que já usa a taglib, `openApp` e `openAppActivity` coexistem sem conflito — são
dois caminhos para o mesmo workspace. Escolha um por tela e mantenha.

---

## Diagnóstico: o erro visível quase nunca é a causa

Falha de parse do `snk.js` e falha dentro de um bloco `.run()` produzem sintomas que apontam
para o lugar errado. A tabela é o mapa de tradução:

| Sintoma no console | Causa real |
|:-------------------|:-----------|
| `Unknown provider: i18nProvider <- i18n <- MessageUtils <- ServiceProxy` | falta `ui-grid.modified.js`: o parse do bundle estourou antes de `snk.i18n` |
| `[$injector:nomod] Module 'ui.grid' is not available!` | idem, é o erro de origem — o de cima é o que sobra depois |
| `[$injector:modulerr]` e a página fica com os `{{ }}` crus | `ReferenceError` dentro de `.run()`: falta `i18nAll`, `i18nFramework` ou `locale` |
| `ftxt is not defined` / `$ is not defined` durante o load | `sf.js` ou `jquery` depois do `snk.js` — os dois são exigidos em tempo de parse |
| `workspace is not defined` ao injetar qualquer serviço | falta a global `workspace` |
| `VSS is not defined` só ao clicar em algo | falta a global `VSS` — `ServiceProxy.callService` a lê |
| Popup com `Geral.buttonSim` no botão | bootou sem o gate de `_Framework.json` |
| Popup existe no DOM, fecha no ESC, não aparece | falta `bootstrap.min.css` |
| Página muda, nenhum erro no console | `angular.bootstrap` dentro da cadeia de promises sem `try/catch` — o erro morreu como unhandled rejection |

Para caçar uma dessas sem round-trip de deploy: reproduza a página em **jsdom** apontando a
`url` para o servidor real (os `src="/mge/..."` baixam de lá), e capture `jsdomError` +
`unhandledrejection`. Dá o stack exato em um minuto.
