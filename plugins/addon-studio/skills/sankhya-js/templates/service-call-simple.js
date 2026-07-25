// Template: chamada simples ao backend via ServiceProxy.
// Uso: 80% dos casos — carregar dados ou disparar uma operacao.
// Referencia: references/patterns.md secao 1

angular
    .module('<Tela>App')
    .controller('MinhaCtrl', ['$scope', 'ServiceProxy',
        function ($scope, ServiceProxy) {
            var self = this;

            self.carregar = function (codParc) {
                // serviceName DEVE ter prefixo: <addon>@ para servico do proprio addon,
                // mge@/mgecom@/mgefin@ para nativo. Sem prefixo cai em "mge" (gotcha 1).
                // { $: valor } e a notacao herdada do transform XML/JSON do backend.
                ServiceProxy.callService(
                    '<addon>@MeuServicoSP.listar',
                    { codParc: { $: codParc } }
                ).then(function (data) {
                    $scope.financeiros = data.responseBody;
                });

                // Popup de erro ja e exibido por default pelo ServiceProxy.
                // NAO adicionar .catch so para mostrar outro popup — gera dialogos
                // sobrepostos (anti-pattern 11). Se precisar tratar manualmente,
                // use o template service-call-builder.js com errorHandler/ignorePopUpErrorMsgs.
            };
        }
    ]);

// ====================================================================
// USO em HTML
// ====================================================================
//
// <div ng-controller="MinhaCtrl as ctrl">
//     <sk-button label="Carregar" ng-click="ctrl.carregar(123)"></sk-button>
//
//     <ul>
//         <li ng-repeat="f in financeiros track by f.codigo">
//             {{ f.descricao }}
//         </li>
//     </ul>
// </div>
