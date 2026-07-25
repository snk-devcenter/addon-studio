# Anatomia da tela HTML5 no addon

Como uma tela `sankhya-js` nasce, é registrada, é servida e é empacotada dentro de um projeto Addon Studio. O que é API do framework está nos outros arquivos de `references/`; aqui fica só o que é específico do addon.

---

## Módulo web (`<addon>-vc`)

O projeto separa backend e frontend em módulos Gradle distintos:

```
settings.gradle
  include '<addon>-model'    # Java: @JapeEntity, @Controller, repositories
  include '<addon>-vc'       # web: telas HTML5 (plugin Gradle `war`)
```

Árvore do módulo web:

```
<addon>-vc/src/main/webapp/
  WEB-INF/web.xml                        # gerado pelo Studio — não editar à mão
  assets/                                # ícones/imagens (menu usa /$ctx/assets/...)
  html5/
    commons/                             # código compartilhado entre telas (opcional)
    <Tela>/
      <Tela>.html
      <Tela>.js
      <Tela>.css
      launcher/
        <Tela>.body                      # <script> extras
        <Tela>.include                   # <link rel="stylesheet">
      popup/
        <algo>.tpl.html
        <algo>.controller.js
```

---

## Gerar a tela

```bash
gradle gerarTela -Ptela=<Tela>                          # tela em branco
gradle gerarTela -Ptela=<Tela> -Pinstancia=<Instance>   # tela dynaform sobre a instância
```

Sem `-Ptela` a task falha com `informe o parametro "-Ptela=NomeTela" com o nome da tela desejado`.

Gera `src/main/webapp/html5/<Tela>/` com `<Tela>.html`, `<Tela>.js`, `<Tela>.css` e `launcher/<Tela>.body` + `launcher/<Tela>.include`, **todos em UTF-8**.

### Tela em branco

```html
<!-- <Tela>.html -->
<sk-application ng-controller="<Tela>Controller as ctrl" creation-complete="ctrl.init()">

</sk-application>
```

```javascript
// <Tela>.js
angular.module('<Tela>App', ['snk'])
    .controller('<Tela>Controller', ['$scope',
        function ($scope) {
            let self = this;

            self.init = init;

            function init() {

            }
        }]);
```

### Tela dynaform (`-Pinstancia=`)

```html
<sk-application ng-controller="<Tela>Controller as ctrl" creation-complete="ctrl.init()">
    <sk-dynaform
            sk-entity-name="<Instance>"
            sk-on-dynaform-loaded="ctrl.onDynaformLoad(dynaform, dataset)"
            sk-dynaform-interceptor="ctrl"
            sk-datagrid-interceptor="ctrl"
            sk-form-interceptor="ctrl"
            sk-skip-start-page="true"
            flex></sk-dynaform>
</sk-application>
```

```javascript
angular.module('<Tela>App', ['snk'])
    .controller('<Tela>Controller', ['$scope', 'Criteria', 'MessageUtils', 'SkApplication', 'ObjectUtils',
        function ($scope, Criteria, MessageUtils, SkApplication, ObjectUtils) {
            let self = this;

            ObjectUtils.implements(self, IDynaformInterceptor);
            ObjectUtils.implements(self, IFormInterceptor);
            ObjectUtils.implements(self, IDatagridInterceptor);

            self.onDynaformLoad = onDynaformLoad;

            let criteria = new CriteriaProvider();
            criteria.getCriteria = getCriteria;

            function onDynaformLoad(dynaform, dataset) {
                self._dynaform = dynaform;
                self._dataset = dataset;
                self._dataset.addCriteriaProvider(criteria);
            }

            function getCriteria() {
                return Criteria();
            }
        }]);
```

`sk-entity-name` recebe o **`name` da `<instance>`** do dicionário de dados — não o nome da tabela nem o da classe Java (skill `data-dictionary`).

---

## Launcher: `.body` e `.include`

Arquivos que o launcher injeta na página final da tela. A tag `<ignored>` existe só para o arquivo continuar sendo HTML válido — ela não é renderizada.

```html
<!-- launcher/<Tela>.body — scripts além do <Tela>.js -->
<ignored>
    <script type="text/javascript" src="html5/commons/service.js"></script>
    <script type="text/javascript" src="html5/<Tela>/popup/<algo>.controller.js"></script>
</ignored>
```

```html
<!-- launcher/<Tela>.include — folhas de estilo -->
<ignored>
    <link rel="stylesheet" href="html5/<Tela>/<Tela>.css"></link>
</ignored>
```

Regras:

- Todo `.js` da tela que não seja o `<Tela>.js` (controller de popup, diretiva, service auxiliar) **precisa** de uma linha no `.body`. Sem isso o Angular acusa controller/diretiva desconhecida em runtime, sem erro no build.
- `src` e `href` são relativos à raiz do `webapp` (`html5/...`), não à pasta da tela.
- O `.body` gerado já vem com `html5/commons/service.js`. Se o projeto não tiver essa pasta, remova a linha — o navegador busca um arquivo inexistente a cada abertura da tela.

---

## Registrar no menu

A tela só aparece no produto depois de entrar no XML de menu do dicionário de dados (skill `data-dictionary`):

```xml
<folder id="<prefixo>.rotinas" resourceId="<prefixo>.rotinas" description="Rotinas">
    <ui id="<prefixo>.<idtela>"
        resourceId="<prefixo>.<idtela>"
        url="/$ctx/<Tela>.xhtml5"
        description="<Descrição no menu>">
        <properties/>
    </ui>
</folder>
```

- `url` é sempre `/$ctx/<Tela>.xhtml5` — `$ctx` resolve para o contexto do addon e `<Tela>` é o nome da pasta em `html5/`. O `.xhtml5` é virtual: quem responde é o launcher de telas HTML5 registrado no `web.xml`; não existe arquivo `.xhtml5` no repositório.
- `resourceId` é o que o controle de permissão enxerga — sem ele a tela não tem como ser liberada por perfil.
- Tela CRUD pura de uma `<instance>` normalmente não precisa de `<ui>`: use `<dynamicForm>` e economize a tela custom.
- O XML de menu é `.xml` do dicionário: **ISO-8859-1** (skill `encoding`). O conteúdo do `webapp` continua UTF-8.

---

## Falar com o backend do addon

```javascript
ServiceProxy.callService('<addon>@<Nome>SP.<metodo>', payload)
    .then(function (response) {
        var body = response.responseBody;
    });
```

| Parte | Vem de |
|---|---|
| `<addon>` | nome do módulo do addon (mesmo valor que o `$ctx` da URL do menu) |
| `<Nome>SP` | `serviceName` do `@Controller` no módulo `-model` (skill `controller`) |
| `<metodo>` | método público do controller |

Sem o prefixo `<addon>@`, o framework assume `mge` e a chamada vai para o serviço nativo — erro de "serviço não encontrado" ou, pior, um serviço homônimo do produto. Serviços nativos são chamados com o prefixo do módulo deles (`mge@`, `mgecom@`, `mgefin@`).

O payload é o JSON que o controller recebe; a resposta útil fica em `response.responseBody`.

---

## Popups e templates

```javascript
SanPopup.open({
    templateUrl: 'html5/<Tela>/popup/<algo>.tpl.html',   // a partir da raiz do webapp
    controller: '<Algo>Controller',
    controllerAs: 'ctrl'
});
```

O controller do popup registra no **módulo da tela**, não em um módulo novo:

```javascript
angular.module('<Tela>App').controller('<Algo>Controller', [/* ... */]);
```

---

## Empacotamento e deploy

`gradle deployAddon` (skill `build`) empacota o módulo `-vc` junto com o `-model` no artefato do addon. Não há Grunt, npm, bundler ou minificação no caminho: os arquivos vão como estão para o servidor. Consequências:

- Erro de sintaxe em `.js` só aparece no navegador, em runtime.
- Nada de `import`/`export` ES module — os scripts são carregados por `<script src>`.
- Após o deploy, force refresh no navegador: o produto cacheia os estáticos da tela.

---

## Checklist de tela nova

1. [ ] `gradle gerarTela -Ptela=<Tela>` (com `-Pinstancia=` se for dynaform sobre instância do dicionário).
2. [ ] `<Tela>.js` declara `angular.module('<Tela>App', ['snk'])` e usa DI por array.
3. [ ] Todo `.js` extra da tela listado em `launcher/<Tela>.body`; CSS em `launcher/<Tela>.include`.
4. [ ] Chamadas de serviço com prefixo `<addon>@` e `serviceName` casando com o `@Controller` do `-model`.
5. [ ] `sk-entity-name` casando com o `name` da `<instance>` do dicionário.
6. [ ] `<ui url="/$ctx/<Tela>.xhtml5">` no XML de menu, com `resourceId` para permissão.
7. [ ] Arquivos do `webapp` em UTF-8; XML do dicionário em ISO-8859-1.
8. [ ] Sem `console.log` esquecido e sem texto de UI fora de PT-BR/`SkI18nService`.
