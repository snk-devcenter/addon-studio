---
name: sankhya-js
description: Telas HTML5 do addon (módulo `<addon>-vc`, `src/main/webapp/html5/<Tela>/`) escritas em AngularJS 1.x sobre o framework proprietário `sankhya-js` (módulo `snk`) — `sk-application`, `sk-dynaform`, `sk-dataset`, `sk-datagrid`, `sk-form`, `sk-wizard`, `sk-navigator`, `sk-pesquisa-input`, `sk-text-input`, `sk-file-input`, `SanPopup`, `PopUpParameter`, `MessageUtils`, `ServiceProxy`, `MetadataProvider`, `SkComponentRegistry`, `SkWorkspace`. Use ao criar, alterar, revisar ou depurar tela do addon, ao gerar tela com `gradle gerarTela`, ao consumir um `@Controller ...SP` do próprio addon a partir da tela, ao montar dynaform sobre `<instance>` do dicionário de dados, ao registrar a tela no menu via `<ui url="/$ctx/<Tela>.xhtml5">`, ou ao tocar em `.js`/`.html`/`.css` sob `webapp/html5/`. NÃO usar para o frontend novo de Design System (`snk-application` Stencil/web components em `frontend/<App>`, `gradle compileDS`), React ou Flex.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 — telas HTML5 do módulo `<addon>-vc` (AngularJS 1.x + framework `sankhya-js`). Arquivos do `webapp` em UTF-8.
---

# Telas HTML5 do addon (`sankhya-js`) — Addon Studio 2.0

Framework frontend proprietário do produto Sankhya, baseado em **AngularJS 1.x** (não Angular 2+). O addon **consome** o framework: a plataforma serve o bundle `snk` e a tela do addon declara `['snk']` como dependência. Nada do framework é buildado ou versionado dentro do addon.

---

## Onde a tela vive

Telas ficam no módulo web do addon (`<addon>-vc`, plugin Gradle `war`):

```
<addon>-vc/src/main/webapp/
  html5/<Tela>/
    <Tela>.html                  # fragmento: raiz e <sk-application>, sem <html>/<head>
    <Tela>.js                    # angular.module('<Tela>App', ['snk'])
    <Tela>.css
    launcher/<Tela>.body         # <script> extras (popups, código comum)
    launcher/<Tela>.include      # <link rel="stylesheet">
    popup/<algo>.tpl.html        # templates de popup/diretiva
    popup/<algo>.controller.js
  assets/                        # ícones e imagens da tela e do menu
datadictionary/MENU_<id>.xml     # <ui url="/$ctx/<Tela>.xhtml5"> registra a tela
```

Scaffold oficial: **`gradle gerarTela -Ptela=<Tela>`** (task do plugin Gradle do Studio). Com `-Pinstancia=<Instance>` gera a variante dynaform já ligada a uma `<instance>` do dicionário. Detalhes, arquivos gerados e registro no menu: [references/addon-screen.md](references/addon-screen.md).

---

## Regras não-negociáveis

1. **AngularJS 1.x** — `angular.module(...)`, `$scope`, `$q`, `$http`, DI por array. Nada de Angular 2+ (standalone components, signals, RxJS), nada de React.
2. **Cada tela declara o próprio módulo:** `angular.module('<Tela>App', ['snk'])`. Nunca registrar controller/service dentro de `snk`, `snk.core.*`, `snk.components.*` ou `snk.commons` — esses módulos são do framework, não do addon.
3. **DI por array** (`['$scope', 'ServiceProxy', function ($scope, ServiceProxy) {...}]`), como no template do `gerarTela`. DI implícita por nome de parâmetro quebra em qualquer minificação.
4. **Backend só via `ServiceProxy`**, com prefixo do addon no `serviceName`: `'<addon>@<Nome>SP.<metodo>'`. Sem prefixo o framework assume `defModule = "mge"` e chama o serviço nativo errado. Nunca montar `/mge/service.sbr` na mão.
5. **`<Nome>SP` é o `serviceName` do `@Controller` do addon** — o contrato dos dois lados anda junto (skill `controller`).
6. **`sk-entity-name` casa com o `name` da `<instance>`** declarada no dicionário de dados (skill `data-dictionary`), não com o nome da tabela nem com o da entidade Java.
7. **Arquivos do `webapp` em UTF-8** — `.js`, `.html`, `.css`, `.body`, `.include`. A regra ISO-8859-1 do addon vale para `.java`/`.xml`/`.kt`/`.properties` (inclusive o XML de menu que registra a tela), **não** para o conteúdo do `webapp`.
8. **Sem emoji.** Texto de UI em PT-BR direto ou via `SkI18nService` quando a tela precisar de mais de um idioma.

---

## Quando NÃO usar esta skill

- **Design System / Stencil** — telas em `frontend/<App>/` com web components (`snk-application`, `snk-data-unit`), buildadas por `gradle compileDS`. Stack independente, sem AngularJS.
- **React / Vite** em microfrontend próprio do projeto.
- **Flex (MXML/AS3)** e telas GWT legadas — consomem os mesmos serviços, UI é outra.
- **Backend do addon** (`@Controller`, `@JapeEntity`, repository, job): skills próprias do plugin.

---

## Padrão canônico 1 — Tela chamando serviço do próprio addon

```javascript
angular.module('LancamentoOSApp', ['snk'])
  .controller('LancamentoOSController', ['ServiceProxy', 'MessageUtils',
    function (ServiceProxy, MessageUtils) {
      let self = this;

      self.finalizar = finalizar;

      function finalizar(nroOs) {
        ServiceProxy.callService('<addon>@OrdemServicoSP.finalizarOrdemServico', {
          nroOs: nroOs
        }).then(function (response) {
          MessageUtils.showInfo(MessageUtils.TITLE_INFORMATION, response.responseBody.body);
        });
      }
    }]);
```

`<addon>` é o nome do módulo do addon (o mesmo do contexto `$ctx`). Do lado Java, `@Controller(serviceName = "OrdemServicoSP")` com o método `finalizarOrdemServico`. Builder, `abort()`, supressão de popup de erro e demais opções: [references/api-cheatsheet.md](references/api-cheatsheet.md).

## Padrão canônico 2 — Dynaform sobre instância do dicionário

```html
<sk-application ng-controller="RecProdutoController as ctrl" creation-complete="ctrl.init()">
  <sk-dynaform sk-entity-name="RecProduto"
               sk-on-dynaform-loaded="ctrl.onDynaformLoaded(dynaform, dataset)"
               sk-skip-start-page="true"
               flex>
    <dynaform-rec-produto>
      <sk-right-top-bar gap="8">
        <button primary ng-click="ctrl.sincronizar()">Sincronizar</button>
      </sk-right-top-bar>
    </dynaform-rec-produto>
  </sk-dynaform>
</sk-application>
```

```javascript
function onDynaformLoaded(dynaform, dataset) {
  self.dynaform = dynaform;
  self.dataset = dataset;      // API de CRUD/navegação — ver references/dataset.md
  self.dataset.initAndRefresh();
}
```

A tag filha (`<dynaform-rec-produto>`) é o ponto de extensão do dynaform daquela instância — dentro dela entram barras de botões e slots. Interceptors (`IDynaformInterceptor`, `IFormInterceptor`, `IDatagridInterceptor`) e `CriteriaProvider`: [references/form.md](references/form.md) e [references/dataset.md](references/dataset.md).

## Padrão canônico 3 — Popup da tela

```javascript
SanPopup.open({
  title: 'Sincronizar',
  templateUrl: 'html5/RecProduto/popup/popuprelacaoproduto.tpl.html',  // path a partir da raiz do webapp
  controller: 'PopupRelacaoProdutoController',                        // registrado no MESMO módulo da tela
  controllerAs: 'ctrl',
  showBtnOk: true,
  size: 'md'
}).result.then(function (result) { /* ... */ });
```

O `.controller.js` do popup precisa ser carregado por `launcher/<Tela>.body`, senão o Angular acusa controller desconhecido. `MessageUtils`, temas de botão e o contrato de `$popupInstance`: [references/messages-popup.md](references/messages-popup.md).

**Popup que só pede campos não precisa de template nem controller** — use `PopUpParameter`, que monta um `sk-form` a partir dos parâmetros:

```javascript
PopUpParameter.builder()
  .title('Reabertura de OS')
  .columns(2)
  .buildDateParameter('DTREABERTURA', 'Data de reabertura', true, new Date())
  .buildSearchInputParameter('CODUSU', 'Responsável', true, 'Usuario', 'NOMEUSU')
  .show().result                              // .show() devolve a instância; a promise é .result
  .then(function (result) { /* result.DTREABERTURA, result.CODUSU */ });
```

Builders disponíveis, opções, sentinelas do botão "Desconsiderar não informados" e armadilhas: [references/popup-parameter.md](references/popup-parameter.md).

## Padrão canônico 4 — Compartilhar instância entre controllers

```javascript
var deregister = SkComponentRegistry.register(self, 'minhaInstancia');
$scope.$on('$destroy', deregister);

SkComponentRegistry.get('minhaInstancia').then(function (instance) {
  instance.fazerAlgo();
});
```

Handles são globais na página: duplicidade gera `console.warn` e devolve `angular.noop`. Prefixe o handle com o nome da tela.

## Padrão canônico 5 — Metadados de entidade

```javascript
MetadataProvider.getEntityMetadata('RecProduto').then(function (entities) {
  var meta = entities['RecProduto'];   // meta.fields, meta.relations, meta.tableName
});
```

Cache por `entidade + locale`. Serve tanto para entidade nativa quanto para a do addon declarada no dicionário.

---

## Onde aprofundar

- [references/addon-screen.md](references/addon-screen.md) — anatomia da tela no addon, `gerarTela`, launcher `.body`/`.include`, registro no menu, deploy, checklist
- [references/api-cheatsheet.md](references/api-cheatsheet.md) — `ServiceProxy`, `FluidBuilder`, `MetadataProvider`, `SkComponentRegistry`, `SkI18nService`, `SkWorkspace`, `$SkInjectorProvider`
- [references/patterns.md](references/patterns.md) — padrões canônicos + tabela de decisão
- [references/anti-patterns.md](references/anti-patterns.md) — práticas a evitar, útil em triagem de bug
- [references/gotchas.md](references/gotchas.md) — armadilhas de API
- [references/code-quality.md](references/code-quality.md) — organização de arquivos, performance de digest, segurança, telas gigantes

### Componentes

- [references/application.md](references/application.md) — `sk-application`: container raiz, singleton, ciclo de vida
- [references/form.md](references/form.md) — `sk-form`, `sk-dynaform`, interceptors, `getNavigatorAPI()` (esconder botões CRUD do dynaform)
- [references/dataset.md](references/dataset.md) — `sk-dataset`: entity/standalone, listeners, CRUD
- [references/datagrid.md](references/datagrid.md) — `sk-datagrid`: backends, colunas custom
- [references/inputs.md](references/inputs.md) — os ~30 inputs da família `FieldBinder`, com índice de qual usar: texto (`sk-text-input`, `sk-text-area`, `sk-masked-input`), número (`sk-number-input`, `sk-numeric-stepper`), data/hora, escolha (`sk-combobox`, `sk-radio-input`, `sk-switch`, `sk-checkbox-list`), documento (`sk-cgc-cpf-input`, `sk-cep-input`, `sk-phone-input`) e arquivo (`sk-file-input`)
- [references/navigator.md](references/navigator.md) — `sk-navigator`: barra CRUD + navegação
- [references/filter-panel.md](references/filter-panel.md) — `sk-filter-panel` + `sk-filter-panel-btn`
- [references/pesquisa.md](references/pesquisa.md) — `sk-pesquisa-input` + `SkPesquisaService`
- [references/messages-popup.md](references/messages-popup.md) — `MessageUtils` + `SanPopup`
- [references/popup-parameter.md](references/popup-parameter.md) — `PopUpParameter`: popup de campos sem template proprio
- [references/wizard.md](references/wizard.md) — `sk-wizard` + `sk-step`
- [references/tabs.md](references/tabs.md) — `sk-tab` + `sk-tab-item`
- [references/sidenav.md](references/sidenav.md) — `sk-sidenav` e variantes

### Templates

- [templates/component-directive.js](templates/component-directive.js) — esqueleto de directive + uso no HTML
- [templates/service-call-simple.js](templates/service-call-simple.js) — `callService` + `.then`
- [templates/service-call-builder.js](templates/service-call-builder.js) — builder, options, abort, erro manual
- [templates/dataset-standalone.js](templates/dataset-standalone.js) — `sk-dataset sk-standalone` + handlers
- [templates/wizard-step.js](templates/wizard-step.js) — `sk-wizard` com API `$step` + validação
- [templates/popup-custom.js](templates/popup-custom.js) — `SanPopup.open` + `$popupInstance`
- [templates/filter-panel-interceptor.js](templates/filter-panel-interceptor.js) — `IFilterPanelInterceptor` + `FilterPanelService`

---

## Skills relacionadas

- `controller` — o `@Controller(serviceName = "<Nome>SP")` que a tela chama via `ServiceProxy`
- `data-dictionary` — `<instance>` usada em `sk-entity-name` e o `<ui>` que registra a tela no menu
- `entity` — entidade JAPE por trás da instância
- `build` — `gradle deployAddon` empacota o `webapp` do módulo `-vc`
- `encoding` — ISO-8859-1 vale para `.java`/`.xml`/`.kt`/`.properties`; o `webapp` fica em UTF-8
