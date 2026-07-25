// Template: sk-wizard com step controller usando $wizard, $step, $stepEventBus.
// Uso: fluxos multi-passo (wizards de cadastro, NF, importacao).
// Referencia: references/wizard.md
//
// ATENCAO:
// - current-step e TITULO do step, nao indice (gotcha 1).
// - setCanNext(val) muda canNext E completed simultaneamente (gotcha 3).
// - canEnterStep / canExitStep sao codigo morto — use sk-validate-step (gotcha 4).

// ================================================================
// Controller do wizard — captura ponteiro, mantem contexto compartilhado
// ================================================================
angular
    .module('minhaTelaApp')
    .controller('MeuWizardCtrl', ['SkWizardHandler',
        function (SkWizardHandler) {
            var self = this;

            // Contexto compartilhado entre steps —
            // todos os $step.wizardContext apontam para este mesmo objeto.
            self.wizardCtx = {
                dados: {},
                resultadoFinal: null
            };

            // Titulo do step inicial (nao indice).
            self.stepAtual = 'Dados';

            self.onWizardCreate = function (wizard) {
                self.wizard = wizard;
                // Acesso cross-controller: SkWizardHandler.wizard('meuWizard') em outra tela.
                // CUIDADO: name duplicado sobrescreve sem warn (gotcha 9).
            };

            self.validarConfirmacao = function ($step) {
                // Retornar false bloqueia o avanco no click do sk-step-next.
                return !!self.wizardCtx.dados.nome;
            };

            self.onFinalizar = function () {
                // Disparado apos click em sk-step-finish em step marcado sk-finalize="true".
            };

            self.onCancelar = function () {
                // Para voltar ao step inicial, respeitar disabled (gotcha 8).
                SkWizardHandler.wizard('meuWizard').goToByName('Dados', {
                    forceDisabled: true
                });
            };
        }
    ]);

// ================================================================
// Controller de um step especifico
// Em lazy creationPolicy, este controller so e instanciado quando
// o step e visitado pela primeira vez (gotcha 6). Se precisar de logica
// viva antes da primeira visita, mover para o controller do wizard.
// ================================================================
angular
    .module('minhaTelaApp')
    .controller('DadosStepCtrl', ['$scope', '$wizard', '$step', '$stepEventBus',
        function ($scope, $wizard, $step, $stepEventBus) {
            var sctrl = this;

            // wizardContext = mesmo objeto passado em sk-context do sk-wizard.
            sctrl.ctx = $step.wizardContext;

            // Callbacks do ciclo — default e angular.noop, sobrescrever para ativar.
            $step.onEnterStep = function () {
                // Executado em goTo() deste step.
            };

            $step.onExitStep = function () {
                // Executado ao sair. ATENCAO: em sk-intercept-visible-step,
                // a ordem muda — next() chama explicitamente (gotcha 13).
            };

            // setCanNext muda canNext E completed (gotcha 3).
            // Se o intuito e so bloquear avanco mantendo step visualmente
            // completo, use outro mecanismo (sk-validate-step).
            sctrl.validarECalcular = function () {
                var valido = !!sctrl.ctx.dados.nome;
                $step.setCanNext(valido);
            };

            // EventBus compartilhado entre steps — so funciona se sk-event-bus
            // foi passado com a MESMA instancia em cada sk-step (gotcha 11).
            // Default e new EventBus() por step — sem compartilhamento.
            $stepEventBus.on('dados:atualizados', function (payload) {
                sctrl.ctx.dados = payload;
            });
        }
    ]);

// ====================================================================
// USO em HTML
// ====================================================================
//
// <div ng-controller="MeuWizardCtrl as ctrl">
//
//     <sk-wizard name="meuWizard"
//                current-step="ctrl.stepAtual"
//                sk-context="ctrl.wizardCtx"
//                sk-on-create="ctrl.onWizardCreate(wizard)"
//                sk-on-finish="ctrl.onFinalizar()"
//                sk-on-cancel="ctrl.onCancelar()"
//                sk-creation-policy="lazy">
//
//         <sk-step sk-title="Dados"
//                  sk-template-url="app/dados.html"
//                  sk-controller="DadosStepCtrl"
//                  sk-controller-as="sctrl">
//         </sk-step>
//
//         <sk-step sk-title="Confirmacao"
//                  sk-validate-step="ctrl.validarConfirmacao($step)">
//             <!-- conteudo inline via transclude -->
//             <p>Nome: {{ ctrl.wizardCtx.dados.nome }}</p>
//             <button sk-step-previous>Anterior</button>
//             <button sk-step-finish sk-finalize="true">Concluir</button>
//         </sk-step>
//     </sk-wizard>
// </div>
