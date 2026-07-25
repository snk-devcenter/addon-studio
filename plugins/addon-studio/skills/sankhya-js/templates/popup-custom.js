// Template: popup custom via SanPopup com controller proprio.
// Uso: formulario/wizard em modal, nao cobrivel por MessageUtils.showInfo/alert.
// Referencia: references/messages-popup.md secao "SanPopup"
//
// ATENCAO:
// - title e obrigatorio — SanPopup.open lanca Error se ausente (gotcha 4).
// - template/templateUrl e obrigatorio — SanPopup.open lanca Error se ausente (gotcha 5).
// - Popup opera em $rootScope.$new() — sobrevive ao $destroy do controller
//   que abriu. Se o chamador e destruido, o popup continua visivel (gotcha 10).

// ================================================================
// Controller da tela pai — abre o popup
// ================================================================
angular
    .module('<Tela>App')
    .controller('TelaPaiCtrl', ['$scope', 'SanPopup', 'SkI18nService',
        function ($scope, SanPopup, SkI18nService) {
            var self = this;

            self.abrirAjuste = function (linhaAtual) {
                var popupInstance = SanPopup.open({
                    title: SkI18nService.instant('Financeiro.lblAjuste'),
                    templateUrl: 'commons/ajuste/ajuste.tpl.html',
                    controller: 'AjusteController',
                    controllerAs: 'ctrl',
                    size: 'md',
                    backdrop: 'static',    // clique fora nao fecha
                    keyboard: true,        // ESC fecha

                    // resolve = mesmo padrao das rotas Angular.
                    // Os valores sao injetados no controller por nome.
                    resolve: {
                        dados: function () { return linhaAtual; }
                    }
                });

                // .result resolve em $success, rejeita em $dismiss.
                popupInstance.result.then(function (resultado) {
                    self.aplicarAjuste(resultado);
                }, function (reason) {
                    // reason e o argumento passado em $dismiss/dismiss().
                });
            };

            self.aplicarAjuste = function (resultado) {
                // Atualiza dados da tela a partir do retorno do popup.
            };
        }
    ]);

// ================================================================
// Controller do popup — injeta $popupInstance + resolves
// ================================================================
angular
    .module('<Tela>App')
    .controller('AjusteController', ['$scope', '$popupInstance', 'dados',
        function ($scope, $popupInstance, dados) {
            var ctrl = this;

            ctrl.valorOriginal = dados.valor;
            ctrl.valorAjustado = dados.valor;

            // Fechar programaticamente (alternativa a $success/$dismiss no HTML).
            ctrl.confirmar = function () {
                $popupInstance.success({
                    valor: ctrl.valorAjustado
                });
            };

            ctrl.cancelar = function () {
                $popupInstance.dismiss('cancel');
            };

            // ============================================================
            // Validar antes de fechar — preventDefault mantem o popup aberto.
            // Evento disparado no $scope do popup, ANTES do fechamento real.
            // ============================================================
            $scope.$on('popup.closing', function (event, resultOrReason, isSuccess) {
                if (isSuccess && !ctrl.formularioValido()) {
                    event.preventDefault();
                    // Cuidado com popup duplicado: se o erro vira MessageUtils.showError,
                    // verifique que o ServiceProxy nao exibiu popup antes (anti-pattern 11).
                }
            });

            ctrl.formularioValido = function () {
                return ctrl.valorAjustado > 0;
            };
        }
    ]);

// ====================================================================
// USO em HTML — tela pai (abre o popup)
// ====================================================================
//
// <div ng-controller="TelaPaiCtrl as ctrl">
//     <sk-button label="Ajustar"
//                ng-click="ctrl.abrirAjuste({ valor: 100 })">
//     </sk-button>
// </div>
//
// ====================================================================
// USO em HTML — commons/ajuste/ajuste.tpl.html (template do popup)
// ====================================================================
// SanPopup injeta no $scope do popup duas funcoes: $success e $dismiss.
// Usar em ng-click equivale a chamar $popupInstance.success/dismiss no controller.
//
// <div>
//     <p>Valor original: {{ ctrl.valorOriginal }}</p>
//     <sk-text-input value="ctrl.valorAjustado"></sk-text-input>
//
//     <!-- Opcao A: $success / $dismiss injetados diretamente -->
//     <button ng-click="$success({ valor: ctrl.valorAjustado })">Salvar</button>
//     <button ng-click="$dismiss('cancel')">Cancelar</button>
//
//     <!-- Opcao B: metodos do controller — fazem o mesmo -->
//     <!-- <button ng-click="ctrl.confirmar()">Salvar</button> -->
//     <!-- <button ng-click="ctrl.cancelar()">Cancelar</button> -->
// </div>
