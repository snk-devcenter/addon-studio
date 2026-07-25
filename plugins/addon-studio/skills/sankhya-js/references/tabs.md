# sk-tab — abas estruturais

Organiza conteudo em abas navegaveis. Na pratica, `sk-tab` e um syntactic-sugar: no compile, extrai os `sk-tab-item` filhos e monta internamente `sk-tabnavigator` (barra de headers) + `sk-viewstack` (painel ativo) + `sk-viewstack-content` (um por aba). `sk-tab-item` **nao tem directive propria** — e um placeholder DOM processado no compile do pai.

Arquivos: tab.directive.js, tab.controller.js, tabnavigator.directive.js, viewstack.directive.js, viewstack.controller.js, viewstackcontent.directive.js.

## Uso basico

```html
<sk-tab sk-selected-index="ctrl.tabIndex"
        sk-on-select="ctrl.onTabChange"
        sk-creation-policy="auto">

    <sk-tab-item label="Cabecalho 1">
        <div>Conteudo compartilha controller do pai</div>
    </sk-tab-item>

    <sk-tab-item label="Tabs.abaFinanceiro">
        <!-- label passa por i18n() — aqui a chave 'Tabs.abaFinanceiro' e resolvida -->
        <div ng-controller="AbaFinanceiroCtrl as abaCtrl">
            <button ng-click="abaCtrl.carregar()">Carregar</button>
        </div>
    </sk-tab-item>

    <sk-tab-item ng-show="ctrl.mostrarAba3"
                 sk-disabled="!ctrl.permite">
        <sk-tab-header>
            <i class="icon-check"></i> Header com HTML custom
        </sk-tab-header>
        <sk-tab-content>
            <p>Conteudo da aba 3</p>
        </sk-tab-content>
    </sk-tab-item>

</sk-tab>
```

## Atributos do `sk-tab`

| Atributo | Tipo | Default | Proposito |
|---|---|---|---|
| `sk-selected-index` | `=?` | `0` | two-way, controla aba ativa |
| `sk-on-select` | `=?` | `angular.noop` | **ref de funcao** (nao `&`) — invocada como `onSelect(newIndex)` |
| `sk-creation-policy` | attr | `auto` | `auto` (cria ao abrir) ou `all` (cria tudo junto) |
| `sk-hide-show-tabs` | attr | — | propaga para tabnavigator (tabs colapsaveis) |
| `sk-tab-nav-class` | attr | — | classe CSS adicional no tabnavigator |
| `bg-color` | `@` | — | cor de fundo do viewstack (nome sem prefixo `sk-`) |

## `sk-tab-item` (placeholder)

Lido no compile do `sk-tab`. Atributos reconhecidos:

| Atributo | Proposito |
|---|---|
| `label` | texto do header; passa por `i18n(label)` — aceita chave ou literal |
| `ng-show` | propaga para o `sk-tabnavigator-item` (oculta o header) |
| `sk-disabled` | propaga para o header; previne click manual |
| `create-on-init` | forca criacao imediata do painel mesmo com `creationPolicy=auto` |
| child `<sk-tab-header>` | HTML custom para o header; **sobrescreve `label`** |
| child `<sk-tab-content>` | container explicito do corpo; se ausente, o corpo inteiro do `sk-tab-item` vira content |
| `flex` / `layout` | propagados para o `sk-viewstack-content` gerado |
| `layout-padding` | se presente no content (ou no proprio item quando nao ha `<sk-tab-content>`), aplicado no painel |

## Creation policy

| Modo | Comportamento |
|---|---|
| `auto` (default) | cria painel apenas quando `selectedIndex` aponta para ele; uma vez criado, permanece |
| `all` | cria todos os paineis no link (todos os controllers instanciam imediatamente) |
| `create-on-init` por item | forca `auto` a criar aquele painel especifico desde o inicio |

**Nao ha unload** — painel fechado recebe classe `sk-hidden` (display:none) mas `$scope`, watchers e DOM ficam vivos. Abrir muitas abas acumula estado.

## API programatica — `TabController`

Exposto como `ctrl` no scope do `sk-tab`. Metodo unico disponivel:

```javascript
// Adicionar aba programaticamente
ctrl.addTab(form, label);
// form: string (template) OU elemento DOM
// label: texto (nao passa por i18n — ja deve vir resolvido)
```

Quando `form` e string, o controller chama `$compile(form)($scope.scopeComponent)` e em seguida `AngularUtil.digest($scope.scopeComponent)` — pode causar double-digest se o chamador ja esta dentro de um ciclo.

Para acesso a API do tab a partir de outro controller (ex.: dentro de um dynaform), usar `SkComponentRegistry` ou o `getTabsAPI()` do `SkDynaformController`.

## Integracao com outros componentes

**Grids**: ao trocar aba, o viewstack dispara `$scope.$broadcast('uiGridRecalculate')`. Grids em abas recem-abertas recalculam dimensoes. Sem isso, grids em abas inativas no load ficariam com largura `0`.

**Controller de tela**: telas com rota (`$route`) emitem `$contextControllerChanged` pelo `sk-application`; o `sk-tab` escuta e refaz `$scope[controllerAs] = controllerInstance`. Telas sem rota dependem do controller ja estar setado no link inicial.

**`sk-tabs-selected-index` do `sk-navigator`**: quando a busca Ctrl+F encontra um campo dentro de `sk-tab-item`, o navigator atualiza esse binding para pular para a aba correta antes de destacar o campo.

## Swipe mobile

`sk-tabnavigator` registra `SwipeUtil.left(scope, element, nextPage)` e `.right(...)`. Em tablets, swipe horizontal na barra muda o grupo de headers quando ha mais items do que cabem. Esse comportamento e do navigator, nao do viewstack.

## Gotchas

1. **`sk-tab-item` nao e directive real**. No DOM final nao existe — o compile converte em `sk-tabnavigator-item` + `sk-viewstack-content`. Selectores CSS em `sk-tab-item` nao pegam. Para estilizar conteudo, usar `sk-viewstack-content` ou uma classe propria dentro do `<sk-tab-content>`.

2. **`label` passa por `i18n()`**. Aceita string literal OU chave. Se a chave nao existe no bundle, retorna a propria chave como texto (silenciosamente). Um `label="Financeiro"` que depois vira `label="Tabs.Financeiro"` pode aparecer como `Tabs.Financeiro` literal se a chave nao foi cadastrada.

3. **`<sk-tab-header>` sobrescreve `label`**. Se o `sk-tab-item` tem um child `<sk-tab-header>`, o compile pega o `innerHTML` dele e ignora o atributo `label`. Usar para header com icones/HTML, e pular `label` nesse caso.

4. **`creation-policy=auto` adia instanciacao de controllers**. Controllers declarados dentro de abas nao-iniciais so rodam na primeira abertura. Codigo que precisa do ctrl pronto no load (ex.: servico que se registra em `SkComponentRegistry`) deve estar em aba inicial, em tela fora da aba, ou usar `create-on-init`.

5. **Sem lazy unload**. Painel fechado fica com `sk-hidden` (display:none); watchers, `$scope` e DOM continuam ativos. Tab com muitas abas pesadas acumula custo de digest. Se o caso pede unload, renderizar condicionalmente via `ng-if` dentro do `<sk-tab-content>`.

6. **Painel escondido tem `clientHeight` e `clientWidth = 0`**. Componentes que medem dimensoes no link (ex.: `sk-pesquisa-input` que so carrega descricao quando `clientHeight > 0`) funcionam apenas quando a aba esta visivel. O `uiGridRecalculate` resolve para grids; outros componentes precisam reagir ao evento de selecao.

7. **`selectedIndex` fora do range e ignorado silenciosamente**. `updateSelectedIndex` so executa se `$scope.viewstacks[newValue]` existe. Setar `-1` ou um indice maior que a quantidade de abas nao dispara `onSelect`, nao cria conteudo, e `$scope.selectedIndex` fica com o valor invalido — debug complicado.

8. **`sk-on-select` e `=?`, nao `&`**. Passar referencia de funcao (`ctrl.onChange`), nao invocacao (`ctrl.onChange()`). No viewstack e chamada diretamente como `$scope.onSelect(newValue)`. Destoa do padrao AngularJS e do resto do framework.

9. **`bg-color` sem prefixo `sk-`**. O scope binding e `bgColor: '@bgColor'`; o compile re-emite para o viewstack como `sk-bg-color`. Atributo `bg-color` direto pode conflitar com parsers HTML estritos ou frameworks que reservam nomes.

10. **`sk-disabled` nao bloqueia programaticamente**. Previne click manual mas `selectedIndex = N` abre a aba N mesmo desabilitada. Para bloqueio logico, validar antes de setar o index.

11. **Swipe mobile muda aba**. Em tablets, componentes com gesture horizontal (date picker, carousel custom) dentro de `sk-tabnavigator` disputam o swipe. Se o conflito surgir, desabilitar swipe no componente interno via `ng-swipe-disabled` ou stopPropagation.

12. **`$contextControllerChanged` e pre-requisito para rehook de `controllerAs` nas abas**. Em telas sem `$route` (maioria das telas de entidade do produto), o evento nao e emitido; o `sk-tab` usa o `AngularUtil.getContextControllerInfo` no postLink inicial e e isso. Trocar o controller da tela dinamicamente requer emitir `$rootScope.$emit('$contextControllerChanged')` manualmente.

13. **`sk-hide-show-tabs` propaga com nome identico**. O compile do `sk-tab` apenas encaminha para o tabnavigator. Nao confundir com `sk-hide-tabs` (nao existe) — o nome completo importa.

14. **`addTab(form, label)` com `form: string` faz `$compile` + `digest` manual**. Se chamado dentro de um ciclo de digest (ex.: dentro de um `$watch` handler), dispara erro `$digest already in progress`. Envolver em `$timeout(..., 0, false)` para segurar.
