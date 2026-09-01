<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" isELIgnored="true"%>
<%@ taglib prefix="snk" uri="/WEB-INF/tld/sankhyaUtil.tld" %>
<%--
  Ilha Angular dentro de um .jsp -- Angular + snk.js SEM o Html5Launcher.

  Isto NAO carrega os ~35 vendors do XHtml5LauncherTemplate, NAO carrega o
  launcher.js e NAO depende de uma pasta html5/<Modulo>/. Sao 8 scripts, e cada
  um esta aqui por um motivo -- tirar qualquer um quebra em tempo de PARSE do
  snk.js, com sintoma que nao aponta para a causa. Ver a SKILL.md antes de mexer.

  Placeholders a trocar:
    <App>       nome do modulo Angular desta tela        (ex.: FrotaApp)
    <Ctrl>      nome do controller                        (ex.: FrotaCtrl)
    <resourceId da tela de destino>  resourceId da tela que o openAppActivity abre
    tela.css    o css da propria tela (opcional)
--%>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Minha Tela</title>

<%-- Ordem obrigatoria: bootstrap -> snk -> css da tela.
     bootstrap.min.css NAO e opcional se a tela usa popup: .modal e .modal-backdrop
     tiram dele todo o posicionamento (position:fixed, top/right/bottom/left, z-index);
     o snk.min.css so traz OVERRIDE. Sem bootstrap o popup existe no DOM, fecha no ESC
     e nao aparece na tela. Contrapartida: os dois sao baseline global e reestilizam
     a pagina inteira -- o css da tela vem por ultimo para vencer. --%>
<link rel="stylesheet" href="/mge/assets/vendors/bootstrap.min.css"/>
<link rel="stylesheet" href="/mge/assets/css/snk.min.css"/>
<link rel="stylesheet" href="tela.css"/>

<%-- snk:load continua valendo: executeQuery, openApp, openLevel, openPage e
     refreshDetails seguem disponiveis ao lado do Angular. --%>
<snk:load/>

<%-- Caminhos ABSOLUTOS /mge/...: relativo resolve dentro do contexto do add-on e da 404. --%>
<script src="/mge/js/sf/sf.js"></script>
<script src="/mge/js/util/jquery-1.9.1.min.js"></script>
<script src="/mge/js/util/Base64.js"></script>
<script src="/mge/scripts/vendors/angular/angular.js"></script>
<script src="/mge/scripts/vendors/moment/moment.min.js"></script>
<script src="/mge/scripts/vendors/numeral/numeral.min.js"></script>
<script src="/mge/scripts/vendors/translate/angular-translate.js"></script>
<%-- ui-grid e OBRIGATORIO mesmo sem grid nenhum: o snk.js tem IIFE de topo com
     angular.module('ui.grid') na forma getter. Sem ele, [$injector:nomod] em tempo
     de parse e so 204 dos 1039 providers registram -- e o erro visivel mente,
     aparece como "Unknown provider: i18nProvider <- i18n <- MessageUtils". --%>
<script src="/mge/scripts/vendors/ui-grid/ui-grid.modified.js"></script>

<script>
// As 5 globais que o Html5Launcher injeta e que um .jsp nao tem. TEM que existir
// antes do snk.js: workspace e lido no construtor do SkWorkspace, VSS em toda
// ServiceProxy.callService, e i18nAll/i18nFramework sao lidas do escopo global
// pelo SkI18nServiceLoader -- faltando qualquer uma, o erro cai dentro de um
// .run() e vira [$injector:modulerr]: a app inteira nao boota.
var workspace = (function () {
  try { if (window.top && window.top.workspace && window.top.workspace.openAppActivity) return window.top.workspace; } catch (e) {}
  try { if (window.parent && window.parent.workspace && window.parent.workspace.openAppActivity) return window.parent.workspace; } catch (e) {}
  return undefined;
})();
var VSS = '';
var locale = 'pt_BR';
var i18nAll = {};
var i18nFramework = {};
</script>

<script src="/mge/scripts/snk.js"></script>
</head>
<body>

<h1>Minha Tela</h1>

<div ng-controller="<Ctrl> as vm">

  <%-- bootErro: alvo do catch do bootstrap la embaixo. Sem ele, falha de boot
       deixa a tela muda, so com os {{ }} crus. --%>
  <div id="bootErro"></div>

  <p>
    <button ng-click="vm.carregar()" ng-disabled="vm.carregando">
      {{vm.carregando ? 'carregando...' : 'carregar'}}
    </button>
    <button ng-click="vm.escolher()" ng-disabled="!vm.linhas.length">escolher (popup)</button>
    <span ng-if="vm.status">{{vm.status}}</span>
  </p>

  <table ng-if="vm.linhas.length">
    <thead><tr><th>Codigo</th><th>Nome</th><th></th></tr></thead>
    <tbody>
      <tr ng-repeat="l in vm.linhas">
        <td>{{l.CODPARC}}</td>
        <td>{{l.NOMEPARC}}</td>
        <td><button ng-click="vm.abrir(l)">abrir</button></td>
      </tr>
    </tbody>
  </table>

</div>

<script>
angular
  .module('<App>', [
    // Fecho exato para ServiceProxy + MessageUtils + SanPopup + SkWorkspace.
    // NAO dependa do modulo guarda-chuva 'snk': ele puxa datagrid e o bloco
    // inteiro de vendors, que e justamente o que esta tela nao carrega.
    'snk.core.util',          // ServiceProxy, MessageUtils, Criteria, StringUtils, ObjectUtils
    'snk.core.workspace',     // SkWorkspace
    'snk.core.application',   // SkApplication (o SkWorkspace injeta)
    'snk.core.tour',          // SkTourService (o SanPopupStack injeta)
    'snk.components.popup',   // SanPopup
    'snk.components.button',  // ButtonThemes (o MessageUtils injeta)
    'snk.i18n'                // $translate + i18n; ja arrasta o pascalprecht.translate,
                              // o unico modulo de vendor angular que este fecho exige
  ])
  .controller('<Ctrl>', ['$q', 'ServiceProxy', 'MessageUtils', 'SanPopup', 'SkWorkspace',
    function ($q, ServiceProxy, MessageUtils, SanPopup, SkWorkspace) {

      var vm = this;

      var SQL =
        "SELECT CODPARC, NOMEPARC " +
        "  FROM TGFPAR " +
        " WHERE ATIVO = 'S' " +
        " ORDER BY NOMEPARC";

      vm.linhas = [];
      vm.carregando = false;
      vm.status = '';

      vm.carregar = carregar;
      vm.escolher = escolher;
      vm.abrir = abrir;

      // maxRows -1 e o mesmo teto do executeQuery da taglib: o ExecQuerySP troca
      // qualquer valor <= 0 pelo teto maximo e ignora o MAXROWEXECQUERY.
      function execQuery(sql) {
        return ServiceProxy
          .callService('ExecQuerySP.execQuery', {
            querydata: {
              query:  { '$': sql },
              config: { name: 'maxRows', value: '-1' }
            }
          })
          .then(function (resp) {
            var body = (resp && resp.responseBody) || {};
            // Query invalida volta com status de SUCESSO e o erro no corpo.
            if (body.queryExecResult) {
              return $q.reject('ERRO AO EXECUTAR QUERY: ' + (arr(body.queryExecResult)[0] || {}).ERRO);
            }
            return linhas(body);
          });
      }

      // line e column chegam como objeto unico quando ha so um -- normaliza.
      function arr(v) {
        if (v == null) { return []; }
        return Object.prototype.toString.call(v) === '[object Array]' ? v : [v];
      }

      function linhas(body) {
        return arr(body.entity ? body.entity.line : null).map(function (l) {
          var o = {};
          arr(l.column).forEach(function (c) { o[c.name] = (c.value === undefined ? '' : c.value); });
          return o;
        });
      }

      function carregar() {
        vm.carregando = true;
        vm.status = '';
        execQuery(SQL)
          .then(function (rows) { vm.linhas = rows; vm.status = rows.length + ' registro(s)'; })
          .catch(function (e) { vm.linhas = []; vm.status = String(e); })
          ['finally'](function () { vm.carregando = false; });
      }

      function escolher() {
        SanPopup.open({
          title: 'Escolher',
          size: 'md',
          type: 'primary',
          grayBG: true,
          okBtnLabel: 'Selecionar',
          template:
            '<select ng-model="ctrl.selecionado" ng-options="l.NOMEPARC for l in ctrl.linhas"></select>',
          controllerAs: 'ctrl',
          controller: ['$scope', '$popupInstance', 'linhas', function ($scope, $popupInstance, linhas) {
            var c = this;
            c.linhas = linhas;
            c.selecionado = linhas[0];
            // O botao Ok chama $success() SEM argumento. Sobrescrever $success no
            // escopo e a forma documentada de devolver um valor pelo .result.
            $scope.$success = function () { $popupInstance.success(c.selecionado); };
          }],
          resolve: { linhas: function () { return vm.linhas; } }
        })
        .result
        .then(function (l) { MessageUtils.showInfo('Selecionado', l.NOMEPARC); })
        .catch(function () { /* cancelou */ });
      }

      function abrir(l) {
        SkWorkspace.openAppActivity('<resourceId da tela de destino>', { CODPARC: Number(l.CODPARC) });
      }
    }
  ]);

// ---------------------------------------------------------------------------
// Bootstrap MANUAL -- nao use ng-app. Busca o bundle de i18n do framework e SO
// ENTAO chama angular.bootstrap. _Framework.json (40 KB) tem as 14 chaves Geral.*
// que o MessageUtils usa nos labels dos botoes; sem ele o popup mostra a chave crua.
//
// Nao da pra reaproveitar o launcher.js: ele monta a URL do bundle da tela em
// caminho RELATIVO, o que da 404 fora da raiz do contexto.
// ---------------------------------------------------------------------------
(function () {

  function bootar() {
    // setLang dispara o SkI18nServiceLoader, que le as globais i18nAll e
    // i18nFramework sozinho -- nao precisa addBundle aqui.
    angular.module('<App>').run(['SkI18nService', function (SkI18nService) {
      SkI18nService.setLang(locale);
    }]);
    try {
      // document inteiro, como o template nativo: o SanPopup pendura o popup no
      // body, fora da div da app.
      angular.bootstrap(document, ['<App>']);
    } catch (e) {
      // Sem este catch o erro morre como unhandled rejection da cadeia de
      // promises abaixo e a tela fica muda.
      console.error('angular.bootstrap falhou:', e);
      var alvo = document.getElementById('bootErro');
      if (alvo) { alvo.textContent = 'bootstrap falhou: ' + String((e && e.message) || e); }
    }
  }

  fetch('/mge/assets/i18n/' + locale + '/_Framework.json', { credentials: 'same-origin' })
    .then(function (r) { return r.json(); })
    .then(function (j) { i18nFramework = j; })
    .catch(function (e) { console.warn('i18n do framework nao carregou; labels ficam com a chave crua.', e); })
    .then(bootar);
})();
</script>

</body>
</html>
