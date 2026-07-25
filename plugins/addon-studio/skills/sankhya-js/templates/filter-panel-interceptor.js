// Template: sk-filter-panel com IFilterPanelInterceptor + pareamento via FilterPanelService.
// Uso: telas com filtros programador (custom) + filtros do dicionario de dados.
// Referencia: references/filter-panel.md
//
// ATENCAO:
// - sk-custom-criteria-loader e OBRIGATORIO quando ha filtros custom — sem ele
//   o sk-filter-panel-btn nao consegue calcular se ha filtro ativo e o badge
//   nao pinta (gotcha 4).
// - sk-has-active-filter = so filtro PERSONALIZADO; sk-has-some-active-filter =
//   dinamico + personalizado + custom. Usar o errado da cor incoerente (gotcha 6).
// - sk-instancia-name duplicado lanca 'Instancia de FilterPanel X ja foi definida.'.
//   Nome undefined (default) compartilha entre telas — popup + tela de fundo
//   podem colidir (gotcha 3).
// - sk-tooltip-apply NAO funciona (typo latente no framework, gotcha 13) —
//   o tooltip fica sempre no fallback 'Geral.buttonAplicarTooltip'.
// - resourceId generico vaza ultimos valores entre telas (gotcha 8).

// ================================================================
// Controller da tela
// ================================================================
angular
    .module('<Tela>App')
    .controller('RelatoriosCtrl', ['$scope', 'FilterPanelService', 'Criteria',
        function ($scope, FilterPanelService, Criteria) {
            var self = this;

            // Modelo dos filtros custom (vinculados via ng-model no <default-group>).
            self.filtros = {
                nome: '',
                ativo: 'S'
            };

            // ============================================================
            // Capturar API publica do panel (sk-on-filter-created="...($filter)")
            // ============================================================
            self.onFilterPanelReady = function ($filter) {
                self.panel = $filter;

                // addHasFilterListener nao tem removeEventListener publicado —
                // listener vive ate o $destroy do scope do panel (gotcha 15).
                // Guardar para desregistrar manualmente quando o consumidor morre.
                var off = $filter.addHasFilterListener(function (hasFilter) {
                    self.temFiltroAtivo = hasFilter;
                });
                $scope.$on('$destroy', off);
            };

            // ============================================================
            // sk-custom-criteria-loader — devolve Criteria dos filtros CUSTOM.
            // Sem este retorno, o botao externo nao pinta mesmo com filtros
            // preenchidos (gotcha 4).
            // ============================================================
            self.getCustomCriteria = function () {
                var criteria = new Criteria();
                if (self.filtros.nome) {
                    criteria.addCriterion('NOME', 'LIKE', '%' + self.filtros.nome + '%');
                }
                if (self.filtros.ativo) {
                    criteria.addCriterion('ATIVO', '=', self.filtros.ativo);
                }
                return criteria;
            };

            // ============================================================
            // IFilterPanelInterceptor — validado por ObjectUtils.isImplementorOf
            // no init do panel. Os 4 metodos sao obrigatorios; default noop
            // faz o panel ignorar os filtros custom.
            // ============================================================
            self.interceptor = {
                // Chamado ao aplicar — devolve CriteriaProvider para compor
                // o criteria final junto com o dinamico.
                getCriteria: function (dataSource) {
                    return self.getCustomCriteria();
                },

                // Chamado antes de salvar ultimos valores — pode divergir de
                // getCriteria se alguns filtros nao devem ser persistidos.
                interceptBeforeSave: function (dataSource) {
                    return self.getCustomCriteria();
                },

                // Hook apos carregar ultimos valores — hidrata self.filtros.
                // lastValues e o snapshot persistido em {resourceId}.DynamicFilterAccordion.
                interceptAfterLoad: function (lastValues) {
                    if (lastValues && lastValues.custom) {
                        self.filtros = angular.extend(self.filtros, lastValues.custom);
                    }
                },

                // Chamado ao clicar "Limpar" — zerar o modelo custom.
                clearFilter: function () {
                    self.filtros = { nome: '', ativo: 'S' };
                }
            };

            // ============================================================
            // Acesso cross-controller via FilterPanelService(name).
            // Mesmo nome em sk-filter-panel e sk-filter-panel-btn (gotcha 3).
            // ============================================================
            self.abrirFiltros = function () {
                FilterPanelService('relatorios').open();
            };

            self.fecharFiltros = function () {
                FilterPanelService('relatorios').close();
            };
        }
    ]);

// ====================================================================
// USO em HTML
// ====================================================================
//
// <div ng-controller="RelatoriosCtrl as ctrl">
//
//     <!-- Panel + btn usam o mesmo sk-instancia-name para parear -->
//     <sk-filter-panel sk-data-source="ctrl.dataset"
//                      sk-resource-id="relatorios.v1"
//                      sk-instancia-name="relatorios"
//                      sk-has-some-active-filter="ctrl.temFiltroAtivo"
//                      sk-custom-criteria-loader="ctrl.getCustomCriteria()"
//                      sk-filter-panel-interceptor="ctrl.interceptor"
//                      sk-on-filter-created="ctrl.onFilterPanelReady($filter)">
//
//         <!-- Accordion padrao: filtros do programador -->
//         <default-group label="Relatorios.filtrosPrincipais">
//             <sk-text-input sk-value="ctrl.filtros.nome"
//                            sk-label="Nome"></sk-text-input>
//             <sk-combobox sk-value="ctrl.filtros.ativo"
//                          sk-label="Ativo"
//                          sk-items="[{v:'S',l:'Sim'},{v:'N',l:'Nao'}]"></sk-combobox>
//         </default-group>
//
//         <!-- Accordion extra (label obrigatorio) -->
//         <custom-group label="Relatorios.filtrosAvancados" no-padding>
//             <!-- mais inputs -->
//         </custom-group>
//
//         <!-- <filter-header> opcional — APENAS 1 (gotcha 1) -->
//     </sk-filter-panel>
//
//     <!-- Botao que abre/fecha — pareado pelo sk-instancia-name -->
//     <sk-filter-panel-btn sk-instancia-name="relatorios"></sk-filter-panel-btn>
//
// </div>
