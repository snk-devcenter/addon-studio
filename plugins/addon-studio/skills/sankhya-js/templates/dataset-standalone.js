// Template: sk-dataset em modo standalone (sem entidade no backend).
// Uso: wizards, pop-ups, grids derivados de servico customizado.
// Referencia: references/dataset.md secao "Modo standalone"
//
// ATENCAO: standalone REQUER os 3 handlers (refresh/save/remove).
// Sem sk-refresh-handler, dataset.refresh() nao faz nada (nao ha backend default).

angular
    .module('<Tela>App')
    .controller('MinhaCtrl', ['$scope', 'ServiceProxy',
        function ($scope, ServiceProxy) {
            var self = this;

            // ================================================================
            // Captura do ponteiro do dataset + configuracao inicial
            // ================================================================
            self.onDatasetCreated = function (dataset) {
                self.ds = dataset;

                // Listeners retornam funcao de desregistro — sem $destroy,
                // listeners acumulam em telas re-abertas (anti-pattern 4).
                var offSaved = dataset.addDataSavedListener(function (isNew, records) {
                    // Reagir apos save — isNew indica se foi insercao.
                });
                $scope.$on('$destroy', offSaved);

                // initAndRefresh = metadados + refresh. init() so carrega metadados.
                // A .then aqui resolve apenas apos os dois — getCurrentRow() e seguro.
                dataset.initAndRefresh();
            };

            // ================================================================
            // refreshHandler — chamado a cada dataset.refresh()
            // Retorno: array de arrays | array de objetos | objeto com responseBody
            // ================================================================
            self.refreshHandler = function (request) {
                return ServiceProxy.callService('<addon>@MinhaConsultaSP.listar', {
                    filtro: { $: request.filter }
                }).then(function (data) {
                    // Retornar o objeto inteiro tambem funciona — dataset
                    // extrai automaticamente de responseBody quando presente.
                    return data.responseBody.linhas;
                });
            };

            // ================================================================
            // saveHandler — chamado em dataset.save()
            // Retorno: opcional. Se array, dataset atualiza o registro com os
            //   valores devolvidos (captura campos alterados por triggers do backend).
            // ================================================================
            self.saveHandler = function (request) {
                return ServiceProxy.callService('<addon>@MinhaConsultaSP.persistir', {
                    registro: request.record
                }).then(function (data) {
                    return data.responseBody.linhas;
                });
            };

            // ================================================================
            // removeHandler — chamado em dataset.removeCurrentRow()
            // ================================================================
            self.removeHandler = function (request) {
                return ServiceProxy.callService('<addon>@MinhaConsultaSP.excluir', {
                    pk: { $: request.pk }
                });
            };

            // ================================================================
            // Acoes do usuario sobre o dataset
            // ================================================================
            self.incluir = function () {
                self.ds.goToInsertionMode();
                // NUNCA fazer record[i] = valor — nao notifica observers
                // nem recalcula field binders (anti-pattern 5).
                self.ds.setFieldValue('NOME', '');
                self.ds.setFieldValue('ATIVO', 'S');
            };

            self.salvar = function () {
                // save() e assincrono — retorna promise.
                // Nao chamar getCurrentRow() sincrono apos save (anti-pattern 3).
                return self.ds.save();
            };
        }
    ]);

// ====================================================================
// USO em HTML
// ====================================================================
//
// <div ng-controller="MinhaCtrl as ctrl">
//
//     <sk-dataset id="dsLocal"
//                 sk-standalone
//                 sk-presentation-field="NOME"
//                 sk-refresh-handler="ctrl.refreshHandler(request)"
//                 sk-save-handler="ctrl.saveHandler(request)"
//                 sk-remove-handler="ctrl.removeHandler(request)"
//                 sk-dataset-created="ctrl.onDatasetCreated(dataset)">
//
//         <sk-dsfield-md name="NOME" description="Nome"></sk-dsfield-md>
//         <sk-dsfield-md name="IDADE" description="Idade" user-type="I"></sk-dsfield-md>
//         <sk-dsfield-md name="ATIVO" description="Ativo" presentation-type="S"></sk-dsfield-md>
//     </sk-dataset>
//
//     <sk-button label="Incluir" ng-click="ctrl.incluir()"></sk-button>
//     <sk-button label="Salvar" ng-click="ctrl.salvar()"></sk-button>
//
//     <sk-datagrid sk-dataset="ctrl.ds"></sk-datagrid>
// </div>
