# sankhya-js — Padroes de uso

Receitas para telas do addon sobre o framework `sankhya-js`. Nos exemplos, `<Tela>App` e o modulo declarado pela propria tela (`angular.module('<Tela>App', ['snk'])`) e `<addon>` e o nome do modulo do addon usado como prefixo de `serviceName`.

---

## Padrao 1 — Servico backend simples

Uso: tela precisa chamar um servico do backend e tratar a resposta.

```javascript
angular.module('<Tela>App')
  .controller('MinhaCtrl', ['$scope', 'ServiceProxy',
    function($scope, ServiceProxy) {

      ServiceProxy.callService('<addon>@OrdemServicoSP.listarFinanceiros', {
        codParc: { $: $scope.codParc }
      }).then(function(data) {
        $scope.dados = data.responseBody;
      }).catch(function(err) {
        // Popup de erro ja e exibido por default, a nao ser que
        // config.errorHandler / config.ignorePopUpErrorMsgs sejam setados
      });
    }
  ]);
```

**Observacoes:**
- `serviceName` sempre com prefixo: `<addon>@` para servico do proprio addon, `mge@`/`mgecom@`/`mgefin@` para servico nativo. Sem prefixo vai para `mge`.
- Campos primitivos no `params` usam notacao `{ $: valor }` (herdada do transform XML/JSON do backend).
- Resposta e desserializada; usualmente em `data.responseBody`.

---

## Padrao 2 — Builder fluente

Uso: chamada com mais de uma option ou reuso do builder.

```javascript
var chamador = ServiceProxy.builder()
  .serviceName('<addon>@OrdemServicoSP.listarItens')
  .ignoreLoadingBar(true);

chamador.params({ nunota: { $: 12345 } }).call()
  .then(handleItens);
```

`ignoreLoadingBar` e `asOption` — vai para `options`, nao para `variables`. `.call()` e o alias registrado em `.buildFn(..., 'call')`.

---

## Padrao 3 — Componente (directive) com template

Uso: trecho de UI reutilizado em mais de um ponto da mesma tela.

```javascript
// html5/<Tela>/component/meucomp.directive.js
angular.module('<Tela>App')
  .directive('addonMeucomp', ['MinhaDep', function(MinhaDep) {
    return {
      restrict: 'E',
      scope: {
        value: '=',
        onChange: '&'
      },
      templateUrl: 'html5/<Tela>/component/meucomp.tpl.html',
      controller: ['$scope', function($scope) {
        $scope.click = function() {
          $scope.onChange({ value: $scope.value });
        };
      }]
    };
  }]);
```

**Checklist:**
- [ ] Registra em `angular.module('<Tela>App')` **sem** array de dependencias (o array so aparece na declaracao do modulo, no `<Tela>.js`)
- [ ] `<script>` do arquivo listado em `launcher/<Tela>.body` — senao a tag nao e compilada e falha silenciosa
- [ ] `templateUrl` a partir da raiz do webapp (`html5/...`), nao relativo a pasta da tela
- [ ] Prefixo proprio do addon no nome (`addonMeucomp` → `<addon-meucomp>`). `sk-` e do framework: reusar o prefixo arrisca colidir com componente novo do produto

---

## Padrao 4 — Tela com varios arquivos

Uso: tela grande o suficiente para nao caber em um `.js` so.

```
html5/<Tela>/
  <Tela>.js                        # angular.module('<Tela>App', ['snk']) — unico com array
  <Tela>.html
  component/meucomp.directive.js   # angular.module('<Tela>App')
  component/meucomp.tpl.html
  popup/aprovacao.controller.js    # angular.module('<Tela>App')
  popup/aprovacao.tpl.html
  launcher/<Tela>.body             # <script> de todos os .js acima, exceto <Tela>.js
```

Regra: **um** arquivo declara o modulo com array de dependencias; todos os outros reusam sem array. Declarar `['snk']` de novo em outro arquivo sobrescreve o modulo e derruba o que ja tinha sido registrado.

---

## Padrao 5 — Compartilhar instancia entre controllers

Uso: duas telas/controllers precisam conversar sem ter relacao de parente no DOM.

```javascript
// ControllerPai
angular.module('<Tela>App').controller('Pai',
  ['$scope', 'SkComponentRegistry', function($scope, SkComponentRegistry) {
    var self = this;
    self.refreshLista = refreshLista;

    var deregister = SkComponentRegistry.register(self, 'meuContexto');
    $scope.$on('$destroy', deregister);
  }]);

// ControllerFilho (em outra tela/pop-up)
angular.module('<Tela>App').controller('Filho',
  ['SkComponentRegistry', function(SkComponentRegistry) {
    SkComponentRegistry.get('meuContexto').then(function(pai) {
      pai.refreshLista();
    });
  }]);
```

**Observacoes:**
- `get()` **empilha** o deferred ate que o `register()` correspondente ocorra. Util para ordem de inicializacao nao-deterministica.
- Handle e global — conflito gera `console.warn` e `register` retorna `angular.noop` (nao sobrescreve por padrao).
- Passar `$scope` como terceiro argumento auto-desregistra no `$destroy`.

---

## Padrao 6 — Metadados de entidade com relacoes

Uso: tela dinamica que precisa saber campos, tipos e relacoes de uma entidade.

```javascript
MetadataProvider.getEntityAndRelationsMetadata(
  ['Parceiro', 'Produto'],
  function filtraRelacao(entity, field) {
    return field.name !== 'PRODUTOHIST'; // ignora FKs especificas
  },
  /*includeOneToMany*/ true
).then(function(result) {
  var parceiro = result.entities['Parceiro'];
  var relacoes = result.relations;         // 1-1 (fk)
  var filhos = result.oneToManyRelations;  // 1-N
});
```

**Observacoes:**
- `filterFn` recebe `(entity, field)` e decide se a FK dele deve ser incluida nas relacoes 1-1.
- 1-N so vem com `includeOneToMany: true`.
- Chaves no `entities` sao o nome da entidade **sem** sufixo de locale (o sufixo so existe internamente no cache).

---

## Padrao 7 — Client events

Uso: servico do backend envia eventos que o frontend precisa reagir (ex.: confirmar ação, abrir wizard).

```javascript
// Registrar
var handler = function(event, recaller) {
  if (event.data.confirm) {
    recaller.recall(); // re-executa a mesma chamada apos confirmacao
  }
};

var registration = ServiceProxy.addClientEvent('CONFIRMACAO_SAIDA', handler);

// Desregistrar quando a tela morre
$scope.$on('$destroy', function() {
  registration.unregistry();
});
```

O backend retorna `data.clientEvents = [{ id: 'CONFIRMACAO_SAIDA',...payload }]` e o frontend invoca todos os handlers registrados.

---

## Padrao 8 — i18n em controller e template

```javascript
// Controller
angular.module('<Tela>App').controller('Minha',
  ['$scope', 'SkI18nService', function($scope, SkI18nService) {
    $scope.mensagem = SkI18nService.instant('MinhaTela.mensagem');
    $scope.msgComParam = SkI18nService.instant('MinhaTela.comValor', ['10']);
    // Se for array, posicoes viram p0, p1, ... no bundle
    // Bundle: { "comValor": "Total: {{p0}}" }
  }]);
```

```html
<!-- Template com filter -->
<span>{{ 'MinhaTela.mensagem' | translate }}</span>
```

Tambem ha o provider `i18n` injetavel como funcao: `i18n('chave', [10])`.

---

## Padrao 9 — Download de arquivo

```javascript
// chave vem do backend (ex.: chaveArquivo gerado por upload ou geracao de PDF)
SkWorkspace.downloadFile(null, chaveArquivo, 'pdf', { foo: 'bar' });
```

Se o workspace do GWT estiver disponivel, usa `workspace.downloadFile`. Caso contrario, abre nova aba com URL `/mge/visualizadorArquivos.mge?chaveArquivo=X&foo=bar`.

---

## Padrao 10 — Registrar modulo dinamicamente em tela dependente

Uso: a tela precisa de um componente `snk.components.*` que nao veio na dependencia declarada no bootstrap.

```javascript
angular.module('<Tela>App', ['snk'])
  .config(['$SkInjectorProvider', function($SkInjectorProvider) {
    $SkInjectorProvider.register(
      angular.module('<Tela>App'),
      ['snk.components.popup', 'snk.components.datepicker']
    );
  }]);
```

---

## Padrao 11 — Codigo compartilhado entre telas do addon

Uso: service/diretiva usada por mais de uma tela do mesmo addon (formatador, wrapper de servico, componente de layout).

```
html5/commons/
  commons.module.js       # angular.module('<Addon>Commons', [])
  service.js              # angular.module('<Addon>Commons').service(...)
```

```javascript
// html5/<Tela>/<Tela>.js
angular.module('<Tela>App', ['snk', '<Addon>Commons']);
```

```html
<!-- launcher/<Tela>.body — em TODA tela que usa o commons -->
<ignored>
    <script type="text/javascript" src="html5/commons/commons.module.js"></script>
    <script type="text/javascript" src="html5/commons/service.js"></script>
</ignored>
```

O modulo do commons precisa estar declarado antes do bootstrap da tela — por isso os `<script>` vao no `.body` de cada tela consumidora. Se a ordem de carga nao for garantida, use o `$SkInjectorProvider` (Padrao 10) em vez de declarar a dependencia no array.

Sem o commons, a alternativa e duplicar o codigo por tela — nao registre nada em `snk.commons` nem em outro modulo do framework.

---

## Tabela de decisao

| Precisa... | Use |
|---|---|
| Chamar servico backend | `ServiceProxy.callService` ou `ServiceProxy.builder().call()` |
| Reagir a evento do backend | `ServiceProxy.addClientEvent(id, handler)` |
| Encadear chamadas sequenciais no mesmo servico | `ServiceProxy.addSerializedService(name)` |
| Abortar request em voo | guardar a promise e chamar `.abort()` |
| Obter estrutura de entidade | `MetadataProvider.getEntityMetadata` |
| Obter entidade + FKs | `MetadataProvider.getEntityAndRelationsMetadata` |
| Compartilhar instancia entre controllers | `SkComponentRegistry.register`/`.get` |
| Criar widget UI | directive em `angular.module('<Tela>App')` + `<script>` no `.body` |
| Traduzir texto estatico | `SkI18nService.instant` ou filter `\| translate` |
| Abrir/fechar tela do produto | `SkWorkspace.openAppActivity`/`closeApp` |
| Download de arquivo pelo viewer interno | `SkWorkspace.downloadFile` |
| Adicionar dependencia apos bootstrap | `$SkInjectorProvider.register` em `.config()` |
| Codigo usado por mais de uma tela do addon | `html5/commons/` + `<script>` no `.body` de cada tela |
| Registrar a tela no menu do produto | `<ui url="/$ctx/<Tela>.xhtml5">` no XML de menu (ver `addon-screen.md`) |
