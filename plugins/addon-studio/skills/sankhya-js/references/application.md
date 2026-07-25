# sk-application — raiz de tela HTML5

Container obrigatorio de toda tela HTML5 do produto. Implementa o `DefaultSankhyaApplication`: publica o controller como singleton (`SkApplication.instance()`), registra atalhos de teclado padrao, escuta mudancas de URL para disparar `loadByPK`, aplica configuracoes de `body` e integra com o workspace (GWT ou standalone).

Arquivos: defaultsankhyaapplication.directive.js, defaultsankhyaaplication.controller.js, skapplication.service.js.

## Directive

```html
<div sk-application
     layout="column"
     flex=""
     sk-body-overflow="hidden"
     sk-body-height="100%"
     load-by-pk-whitout-pk
     has-embedded-swf
     use-local-hash
     ng-controller="MinhaTelaCtrl as telaCtrl">
  <!-- conteudo -->
</div>
```

`restrict: 'EA'`, `priority: 501`, `controller: 'DefaultSankhyaApplicationController'`.

Atributos reconhecidos no `compile`:

| Atributo | Efeito |
|---|---|
| `layout` | default `column` se ausente |
| `flex` | default `''` se ausente |
| `sk-body-overflow` | aplica `overflow` no `<body>`; se `hidden` e nao houver `sk-body-height`, seta `height: 100%` no primeiro filho |
| `sk-body-height` | seta `height` e `max-height` no primeiro filho do body |
| `load-by-pk-whitout-pk` | dispara `loadByPK(null)` mesmo sem PK na URL |
| `has-embedded-swf` | pula registro dos atalhos globais (excecao: `ctrl+g` em Central de Notas) |
| `use-local-hash` | restringe `getCurrentHistory` ao `resourceID` atual |

O controller deve ser declarado com alias (`MeuCtrl as meuCtrl`); sem isso o console avisa e varios metodos dependentes do alias retornam `undefined`.

## Singleton `SkApplication`

Provider com tres modos:

```javascript
// 1. get — usado dentro de qualquer service/controller apos bootstrap
var app = SkApplication.instance();

// 2. set — feito automaticamente pelo DefaultSankhyaApplicationController
SkApplication.instance(self);  // joga erro se ja setado

// 3. standalone (dev isolado) — em config, antes do bootstrap
angular.module('meuApp').config(['SkApplicationProvider',
  function(SkApplicationProvider) {
    SkApplicationProvider.setStandaloneApp('MinhaTelaDev', '<PROFILE_ID>', {
      appDescription: 'Minha tela de dev',
      params: { 'mge.core.config.form.html5': 1 }
    });
  }]);
```

`SkApplicationInstance` e o atalho injetavel ja resolvido:

```javascript
angular.module('<Tela>App').service('MeuService',
  ['SkApplicationInstance', function(SkApplicationInstance) {
    var resourceID = SkApplicationInstance.getResourceID();
  }]);
```

## API do controller

Mixin de `EventBus` aplicado no `self`: `dispatchEvent`, `addEventListener`, etc.

### Identificacao

| Metodo | Retorno |
|---|---|
| `getResourceID(defaultValue?)` | `urlParams.workspaceResourceID \|\| urlParams.resourceID \|\| defaultValue \|\| 'unknown.resource.id'` |
| `getScreenResourceID()` | `urlParams.resourceID` (sem fallback) |
| `getUserID()` | `Number($window.UID)`, lanca erro se ausente |
| `getAppController()` | instancia do controller da tela (via alias `MeuCtrl as meuCtrl`) |
| `getAppControllerAlias()` | string do alias |
| `getElement()` | `$element` do directive |

### Autorizacao

`_auth = MGEAuthorizationService.buildFromRAS()` e carregado no construtor.

- `hasAuthorization(key)` — consulta RAS; lanca se `_auth == null`
- `isSup()` — usuario supervisor; lanca se `_auth == null`
- `authIsLoadded()` — checar antes das duas acima quando o codigo roda cedo no ciclo
- `getAuthorizationData()` — objeto de autorizacao completo
- `temOpcional(opcional)` — testa atributos `opc*` do `window`; se `opc0009 == '1'` retorna `true` sempre
- `userIsCaixa` — delegado para `SkWorkspace.userIsCaixa`

### URL e parametros

- `getUrlParam(name)` — sem validacao
- `getRequiredUrlParam(name)` — lanca se ausente
- `getMgeParams()` — retorna variavel global `MGE_PARAMS` (injetada pelo `Html5Launcher`)
- `getAttributeFromHTMLWrapper(name)` — le `window[name]` (opcionais, configs pre-renderizados)
- `isPureDynaform()`, `isOnlyHtmlApp()`, `isHtml5()`, `isModoFlow()` — flags derivadas da URL

### Configuracao persistente

Persistencia via `SystemUtilsSP`:

```javascript
app.saveMgeConfig('meu.resource.id', {
  atributo: JSON.stringify({ filtroPadrao: 'ABC' })
}, /* usuario opcional */ 'joao');

app.loadMgeConfig('meu.resource.id').then(function(config) { /* ... */ });

app.removeMgeConfig('meu.resource.id', 'T', 'joao');

app.saveMGECoreParameter([
  { nome: 'meu.param', valor: 'X' }
], /* loggedUser */ false);
```

Config pre-renderizado pelo servidor (input hidden no DOM, sem rede):

```javascript
var cfg = app.getConfiguracaoTela('minha.tela.config', /* default */ {});
app.putConfiguracaoTela('minha.tela.config', { ordem: 'ASC' });

// Modo asIs: nao aplica JSON.parse/stringify
var raw = app.getConfiguracaoTela('meu.token', '', /* asIs */ true);
app.putConfiguracaoTela('meu.token', 'abc123', true);
```

### Feature flags e versao

```javascript
app.isFeatureActive('MINHA_FEATURE').then(function(active) { /* ... */ });
// Cacheado por 1 hora em memoria.

app.isMinRequiredVersion('4.35.0');  // compara com window.top.SYSVERSION
```

### Ciclo de vida

```javascript
app.openApp('br.com.sankhya.com.mov', { NUNOTA: { $: 123, type: 'I' } });
app.closeApp();                   // fecha a propria; ou closeApp(outroResourceId)
app.reloadApp(resourceId, pkObj); // recarrega
app.openWindow(url, target, specs); // avisa popup bloqueado (exceto electron)
app.workspaceLogout();
app.setFrameTitle('Novo titulo');
```

### Runtime props (memoria in-app)

```javascript
app.putRuntimeProperty('edicaoAtiva', true);
var v = app.getRuntimeProperty('edicaoAtiva');
```

### Assinatura digital

```javascript
app.requestDigitalSignature(stamp, params, executorClassName, clientCallBackName);
app.revokeDigitalSignature(stamp, params, executorClassName, clientCallBackName);
app.showDigitalSignInfo(stamp, chaveArquivo);
```

### Workspace e ambiente

- `isJivaW()` / `isSankhyaW()` — host atual
- `isBloqMovContaPDV()` — delegado para `workspace.isBloqMovContaPDV`

### Eventos e integracao externa

```javascript
// Listener de mudanca de PK na URL (historico)
app.addPKChangeListener(function(pkObject) { /* ... */ });

// Dispatch de evento de teclado
app.dispatchFindKey(elementoFoco);

// Registrar chamadas que o GWT/SWF externo pode invocar no elemento raiz
app.registerExternalCall('meuHookExterno', function(arg) { /* ... */ });
// Fica acessivel em element[0].meuHookExterno(arg) para chamadores Flex/GWT.
```

### Utilidades

```javascript
app.viewFilesInWindow(chaveArquivo, /* module */ 'mge'); // abre visualizadorArquivos.mge
app.useClassicLayoutVersion(dataset, resourceId);        // volta para SWF/GWT apos cancelar edicao
app.useClassicLayoutVersionNoDataSet(resourceId);
app.setDecodeUTF8UrlLoadByPk(true);                       // afeta getPkObject
```

## Callbacks sobrescritiveis pelo `$scope`

```javascript
angular.module('meuApp').controller('MinhaTelaCtrl', ['$scope',
  function($scope) {
    $scope.loadByPK = function(pk) {
      // disparado automaticamente em mudanca de hash/URL; recebe pkObject
    };

    $scope.getCloseConfirm = function() {
      return 'Existem dados nao salvos. Fechar mesmo assim?';  // ou null
    };

    $scope.appCustomClose = function(saveOption, value) {
      // customizar comportamento de close quando getCloseConfirm retorna texto
    };

    $scope.onWorkspaceFocus = function() {
      // chamado quando a aba/workspace volta a ficar em foco
    };
  }]);
```

Esses 4 sao expostos via `$element[0].getCloseConfirm`, `appCustomClose`, `onWorkspaceFocus` para que chamadores externos (GWT) consigam invoca-los.

## Atalhos de teclado (default)

Registrados se `!has-embedded-swf`. Todos disparados como eventos `KeyboardEvents.*` no EventBus do controller — componentes escutam via `app.addEventListener(KeyboardEvents.SAVE_KEY,...)`.

| Tecla | Evento | Proposito |
|---|---|---|
| `ctrl+g` | — | `workspace.searchApp()` (busca de tela) |
| `ctrl+f` | `FIND` | pesquisa de campo |
| `ctrl+e` | `FIND_ENTITY` | pesquisa de entidade |
| `ctrl+d` | — | `workspace.showDesktop()` |
| `f1` | — | `workspace.openHelp()` |
| `f5` | `REFRESH_DS` | refresh do dataset |
| `f6` | `CHANGE_FACE_KEY` | trocar face do double-face-panel |
| `ctrl+f6` | `PREVIOUS_TAB` | aba anterior |
| `ctrl+f7` | `NEXT_TAB` | proxima aba |
| `f7` / `ctrl+\` | `SAVE_KEY` | salvar |
| `f8` | `ADD_KEY` | adicionar registro |
| `f9` / `ctrl+f9` | `DELETE_KEY` | remover registro |
| `esc` | `CANCEL_KEY` | cancelar edicao (propaga) |
| `ctrl+.` | `NEXT_KEY` | proximo registro |
| `ctrl+,` | `PREVIOUS_KEY` | registro anterior |
| `ctrl+k` | — | dev: log de watchers (AngularStats) |

Com `has-embedded-swf`, so `ctrl+g` e registrado para Central de Notas.

## Side-effects globais no init

Ocorrem no construtor do controller, antes de `$scope.loadByPK` ser chamado:

- `angular.isUndefined = value => value == null` (override — `null` agora conta como undefined)
- `angular.isDefined = value => value != null`
- `window.skUid = SkComponentRegistry.getSync`
- `window.int = parseInt(str, 10)` (legado, se `int` nao existir)
- `ServiceProxy.applicationResourceID(...)`, `setApplicationName(...)`, `addPrintListener(PrintUtils.processPendingPrinting)`, `addLocalPrintingListener(PrintUtils.processLocalPrintings)`
- `ServiceProxy.globalID($window.GLOBALID)`, `ServiceProxy.appKey($window.APPKEY)` se presentes
- Listener de `mousemove` para abrir/fechar sidebar do workspace quando cursor chega perto da borda direita
- `SkWorkspace.addHistoryChangeHandler(historyChanged, getResourceID())` — dispara `loadByPK` apos mudanca de URL
- Banner "beta app" se `?betaApp=true&newLayoutSupChoice=S`
- Banner "primeiro acesso novo layout" se `?isFirstAccess=S`
- `getAvisosInicializacao()` le `{resourceID}.avisoIniciaLizacao` do DOM e dispara `MessageUtils.showAlert` se houver

## Fluxo de `loadByPK`

1. URL muda (hash ou query) → `SkWorkspace.addHistoryChangeHandler` dispara `historyChanged(token)`
2. `historyChanged` compara hash e `pk-refresh` com o ultimo visto (`pkHasChanged`)
3. Se mudou, extrai `pkObject` via `UrlUtils.getPkObject(pkHash, isUTF8UrlLoadByPk)`
4. Normaliza `type` de cada campo da PK (`I` se numerico, `S` se nao)
5. Se `pkObject` existe ou `load-by-pk-whitout-pk` esta setado, chama `$scope.loadByPK(pkObject)`
6. Depois notifica cada listener registrado via `addPKChangeListener`

## Gotchas

1. **`SkApplication.instance()` sem setup lanca erro**. Se algum service injeta `SkApplicationInstance` e a tela nao esta dentro de `sk-application`, o bootstrap falha com `'Application nao iniciado'`. Em fixtures ou dev isolado, chamar `SkApplicationProvider.setStandaloneApp(...)` em `.config(...)`.

2. **Dois `sk-application` na mesma pagina = erro**. `SkApplication.instance(self)` lanca `'Application ja instanciado'` no segundo. Telas aninhadas precisam usar o directive apenas no container raiz.

3. **`getResourceID()` sem URL retorna `'unknown.resource.id'`**. Esse valor vai para `ServiceProxy.applicationResourceID` e aparece em logs do backend — dificil de rastrear depois. Preferir passar a URL com `?resourceID=...` mesmo em dev.

4. **`hasAuthorization` e `isSup` lancam se RAS nao carregou**. Codigo que roda muito cedo (pre-init de componente) deve checar `authIsLoadded()` primeiro. A mensagem de erro e i18n: `'SanUtil.Authorization.messagePermissoesNaoCarregadas'`.

5. **Override de `angular.isUndefined`/`isDefined` e global**. Apos o init de qualquer `sk-application`, essas duas funcoes passam a tratar `null` como undefined. Bibliotecas que dependem do comportamento original (`angular.isUndefined(null) === false`) podem quebrar.

6. **`getConfiguracaoTela` / `putConfiguracaoTela` usam input hidden no DOM**. Nao e persistencia de verdade — e o canal para receber configuracoes pre-renderizadas pelo servidor no launcher da tela. Chamar `put` so afeta o DOM da pagina atual; recarregar a tela perde o valor. Para persistir, usar `saveMgeConfig`.

7. **Sem alias no `ng-controller`, `getAppController()` retorna `undefined`**. O regex `(\w+) as (\w+)` precisa casar. Formato aceito: `MeuCtrl as meuCtrl`. Sem alias, `console.warn` e qualquer logica de tela que use `getAppController()` vai quebrar silenciosamente.

8. **`isFeatureActive` cacheia 1 hora em memoria**. Alterar a feature no backend nao reflete ate reload da pagina. Para testes, limpar `_globalFeatureFlags` via devtools ou recarregar.

9. **`has-embedded-swf` pula TODOS os atalhos exceto `ctrl+g`**. Telas hibridas (HTML5 + SWF embutido) dependem dos atalhos vindos do GWT. Se precisar de atalho especifico, usar `KeyboardManager.bind` manualmente no controller da tela.

10. **`addPKChangeListener` dispara apos `loadByPK`, nao antes**. Se a logica precisa modificar o `pkObject` antes do load, interceptar no proprio `$scope.loadByPK` — listeners sao notificacao post-hoc e a PK ja foi aplicada.

11. **`setStandaloneApp` precisa rodar na fase `config`**. Como mexe em `PROFILEID`, `APPLICATION_NAME` e `workspace` globais sem `var`, precisa estar no provider antes de qualquer `$get`. Nao usar em producao — deixa `workspace.isMock=true`.

12. **`openWindow` avisa popup bloqueado so em browser**. Em electron, nao avisa (`UserAgentUtils.getBrowserInfo().electron` pula o check). Se a integracao abre janelas via `openWindow` e roda tanto no browser quanto em electron, o comportamento diverge.

13. **`_callLoadByPkWhitoutPk` usa snake-case errado de proposito**. O atributo e `load-by-pk-whitout-pk` (typo historico "whitout" em vez de "without"). Nao corrigir — e contrato com telas existentes.
