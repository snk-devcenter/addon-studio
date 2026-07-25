// Template: directive AngularJS 1.x numa tela do addon.
// Uso: trecho de UI reutilizado em mais de um ponto da tela.
// Arquivo: html5/<Tela>/component/meucomp.directive.js
// Referencia: references/patterns.md secao 3
//
// ATENCAO: so o <Tela>.js declara o modulo com [] de deps.
// Os demais arquivos reutilizam SEM array — passar [] de novo
// sobrescreve o modulo e perde o que ja foi declarado (gotcha 11).
//
// O <script> deste arquivo precisa estar em launcher/<Tela>.body,
// senao a tag nao e compilada e a falha e silenciosa (gotcha 12).

// ====================================================================
// html5/<Tela>/<Tela>.js — unico lugar com array de dependencias
// ====================================================================
angular.module('<Tela>App', ['snk']);

// ====================================================================
// html5/<Tela>/component/meucomp.directive.js
// ====================================================================
angular
    .module('<Tela>App')
    .directive('addonMeucomp', [function () {
        return {
            restrict: 'E',
            scope: {
                // = : two-way. Use quando o componente altera o valor do pai.
                // @ : string literal. Use para labels/titulos fixos.
                // & : expressao. Use para callbacks invocados pelo componente.
                value: '=',
                label: '@',
                onChange: '&'
            },
            // Path a partir da raiz do webapp, nao da pasta da tela.
            templateUrl: 'html5/<Tela>/component/meucomp.tpl.html',
            controller: ['$scope', function ($scope) {
                var self = this;

                self.click = function () {
                    // Nomes do objeto viram variaveis locais na expressao do pai.
                    // Aqui o pai pode usar `value` em on-change="ctrl.aoMudar(value)".
                    $scope.onChange({ value: $scope.value });
                };
            }],
            controllerAs: 'ctrl'
        };
    }]);

// ====================================================================
// USO em html5/<Tela>/<Tela>.html
// ====================================================================
//
// Prefixo proprio do addon no nome da tag: `sk-` e do framework e pode
// colidir com componente novo do produto.
//
// <addon-meucomp
//     value="ctrl.valorAtual"
//     label="Meu campo"
//     on-change="ctrl.aoMudar(value)">
// </addon-meucomp>
//
// No controller da tela:
//
//   angular.module('<Tela>App').controller('<Tela>Controller', function () {
//       var ctrl = this;
//       ctrl.valorAtual = 'inicial';
//       ctrl.aoMudar = function (valor) {
//           // `valor` vem do $scope.onChange({ value: ... }) do componente.
//       };
//   });
