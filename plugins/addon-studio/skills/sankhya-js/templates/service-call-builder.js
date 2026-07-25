// Template: ServiceProxy.builder() com options avancadas.
// Uso: precisa suprimir loading bar, tratar erro manualmente, ou abortar chamada.
// Referencia: references/patterns.md secao 2

angular
    .module('<Tela>App')
    .controller('MinhaCtrl', [
        '$scope', 'ServiceProxy', 'MessageUtils',
        function ($scope, ServiceProxy, MessageUtils) {
            var self = this;
            var _promisePendente = null;

            // ================================================================
            // Builder fluente — nomeacao enxuta, options legiveis
            // ================================================================
            self.buscar = function (payload) {
                // .serviceName e required. Esquecer derruba com Error sincrono,
                // nao vira rejection de promise (gotcha 6).
                // .ignoreLoadingBar(true) suprime a barra global de carregamento.
                _promisePendente = ServiceProxy.builder()
                    .serviceName('<addon>@ConsultaSP.buscar')
                    .ignoreLoadingBar(true)
                    .params(payload)
                    .call();

                return _promisePendente.then(function (data) {
                    return data.responseBody;
                });
            };

            // ================================================================
            // Tratamento manual de erro — responsabilidade TOTAL do cliente
            // ================================================================
            self.salvarComErroCustom = function (payload) {
                // errorHandler suprime o popup padrao.
                // Se usar APENAS ignorePopUpErrorMsgs (sem errorHandler),
                // o popup some mas a promise ainda reject normalmente — trate no .catch.
                return ServiceProxy.callService(
                    '<addon>@OperacaoSP.salvar', payload,
                    {
                        ignorePopUpErrorMsgs: true,
                        errorHandler: function (data, status) {
                            MessageUtils.showError(
                                MessageUtils.TITLE_ERROR,
                                (data && data.statusMessage) || 'Falha ao salvar'
                            );
                        }
                    }
                );
                // NAO combinar config.callback com .then no mesmo callService —
                // callback suprime o resolve da promise (gotcha 7).
            };

            // ================================================================
            // Abortar request em voo
            // ================================================================
            self.cancelar = function () {
                // .abort() marca aborted=true e resolve o deferred interno.
                // A promise original vira rejeitada com status especial.
                if (_promisePendente && _promisePendente.abort) {
                    _promisePendente.abort();
                    _promisePendente = null;
                }
            };

            // Limpeza ao sair da tela — evita request pendurada apos $destroy.
            $scope.$on('$destroy', self.cancelar);
        }
    ]);

// ====================================================================
// USO em HTML — busca com botao cancelar
// ====================================================================
//
// <div ng-controller="MinhaCtrl as ctrl">
//     <sk-button label="Buscar"
//                ng-click="ctrl.buscar({ filtro: { $: 'X' } })">
//     </sk-button>
//
//     <sk-button label="Cancelar"
//                ng-click="ctrl.cancelar()">
//     </sk-button>
//
//     <sk-button label="Salvar"
//                ng-click="ctrl.salvarComErroCustom({ dados: { $: 'Y' } })">
//     </sk-button>
// </div>
