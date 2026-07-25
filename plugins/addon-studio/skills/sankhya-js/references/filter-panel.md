# sk-filter-panel — painel de filtros

Painel lateral que combina **filtros do dicionario de dados** (metadados da entidade) com **filtros personalizados** (nerd-edit/assistente) e **filtros custom** (definidos pelo programador via transclude). Aplica `criteria` ao `dataSource` e dispara `refresh()`.

Arquivos: filterpanel.component.js, filterpanel.service.js, filterpanelbutton.js, ifilterpanel.interceptor.js, dynamic-filter-panel.directive.js, dynamic-filter-panel.controller.js, filter.service.js.

## Arquitetura

```
sk-filter-panel (component — transclude)
  ├─ sk-dynamic-filter-panel    ← accordion de filtros do dicionario (fieldFilterInfo)
  ├─ sk-personalized-filter     ← filtro "nerd-edit" + assistente
  └─ sk-custom-filter-panel     ← conteudo transcluido pelo programador
        ├─ <default-group>      ← personaliza o accordion padrao
        ├─ <custom-group>       ← accordion extra (label obrigatorio)
        └─ <filter-header>      ← HTML custom no header do painel (max 1)
```

O botao que abre/fecha e separado: `sk-filter-panel-btn`. Conexao via `FilterPanelService(instanciaName)` — mesmo nome nos dois.

## Uso basico

```html
<sk-filter-panel sk-data-source="ctrl.dataset"
                 sk-resource-id="minha.tela"
                 sk-has-active-filter="ctrl.temFiltro"
                 sk-custom-criteria-loader="ctrl.getCustomCriteria()"
                 sk-on-filter-created="ctrl.onFilterPanelReady($filter)">

    <default-group label="Tela.filtrosPrincipais">
        <sk-text-input sk-value="ctrl.filtros.nome" sk-label="Nome"></sk-text-input>
    </default-group>

    <custom-group label="Tela.filtrosAvancados" no-padding>
        <!-- outros filtros -->
    </custom-group>

</sk-filter-panel>

<sk-filter-panel-btn></sk-filter-panel-btn>
```

Ctrl+Enter dentro do painel dispara `apply()`.

## Bindings do `sk-filter-panel`

| Binding | Tipo | Proposito |
|---|---|---|
| `sk-data-source` | `<` | `DataSource` (dataset implementa). Fonte do `criteria` e default do `apply` (`refresh()`) |
| `sk-resource-id` | `@` | chave usada para persistir ultimos valores (`{resourceId}.DynamicFilterAccordion`) |
| `sk-entity-name` | `@?` | entidade-base; se omitido, usa `dataSource.getEntityName()` |
| `sk-instancia-name` | `@?` | identificador para parear com `sk-filter-panel-btn` (default `undefined`) |
| `sk-is-open` | `=?` | two-way; estado aberto/fechado |
| `sk-has-active-filter` | `=?` | true quando ha filtro **personalizado** ativo |
| `sk-has-some-active-filter` | `=?` | true quando ha qualquer filtro ativo (dinamico OU personalizado) |
| `sk-has-dynamic-filter` | `=?` | true quando ha filtro **dinamico** (dicionario) ativo |
| `sk-disable-personalized-filter` | `=?` | oculta o bloco de filtro personalizado |
| `sk-filter-panel-interceptor` | `=?` | implementacao de `IFilterPanelInterceptor` (hooks de criteria, save, load, clear) |
| `sk-apply-function` | `&?` | default: `dataSource.refresh()`. Callback ao clicar Aplicar |
| `sk-btn-apply-label` | `@?` | texto do botao (default `Geral.lblAplicar`) |
| `sk-tooltip-apply` | `@?` | tooltip do botao Aplicar |
| `sk-hide-btn-apply` / `sk-hide-apply` | `=?` | oculta o botao Aplicar externo / dentro da tela de criacao |
| `sk-custom-criteria-loader` | `&?` | deve retornar `Criteria` dos filtros custom — **necessario para colorir o botao** |
| `sk-pf-expanded` | `=?` | filtro personalizado ja expandido (default `true`) |
| `sk-group-others` | `=?` | agrupa filtros nao mapeados em "Outros" (default `true`) |
| `sk-show-label-others-filters` | `@?` | exibe/oculta label "Outros" no custom filter panel |
| `sk-panel-width` | `@?` | largura CSS do painel |
| `sk-is-fixed-mode` | `=?` | painel fixo (nao fecha ao aplicar) |
| `sk-hide-filter` | `=?` | oculta o painel inteiro |
| `sk-on-toggle` | `&` | chamado em toggle — recebe `{isOpen}` |
| `sk-on-filter-created` | `&?` | recebe `{$filter}` = API publica apos init |
| `sk-on-dynamic-filter-created` | `&?` | recebe `{$component}` da instancia dinamica |

## API publica (via `sk-on-filter-created` ou service)

Exposta por `ObjectUtils.buildPublicAPI`:

| Metodo | Proposito |
|---|---|
| `toggle()` / `open()` / `close()` | controla visibilidade; `toggle` retorna novo `isOpen` |
| `panelIsOpen()` | copia defensiva de `isOpen` |
| `whenPersonalizedFilterLoad()` | promise que resolve quando `sk-personalized-filter` esta pronto |
| `getPersonalizedFilter()` | instancia do personalized filter (**throw** se disabled ou ainda nao carregado) |
| `addHasFilterListener(fn)` | notificado quando estado `hasSomeActiveFilter` muda |
| `setCustomFiltersElement(element)` | substitui o conteudo custom programaticamente |

## Tags de organizacao (no transclude)

| Tag | Atributos | Proposito |
|---|---|---|
| `<default-group>` | `label`, `remove-header` | personaliza o accordion padrao (filtros do programador). `remove-header` nao pode coexistir com outros accordions |
| `<custom-group>` | `label` (obrigatorio), `no-padding` | accordion extra |
| `<filter-header>` | — | HTML para o header do painel; **apenas 1** — dois disparam throw |

## `IFilterPanelInterceptor`

Contrato validado por `ObjectUtils.isImplementorOf` no init:

| Metodo | Proposito |
|---|---|
| `getCriteria(dataSource)` | retorna `CriteriaProvider` dos filtros programador |
| `interceptBeforeSave(dataSource)` | retorna `CriteriaProvider` a persistir |
| `interceptAfterLoad(lastValues)` | hook apos carregar ultimos valores |
| `clearFilter()` | limpa os filtros programador |

## `FilterPanelService(name)`

Provider singleton que gerencia instancias por `instanciaName`:

```javascript
// Pareamento panel + btn
<sk-filter-panel sk-instancia-name="relatorios"></sk-filter-panel>
<sk-filter-panel-btn sk-instancia-name="relatorios"></sk-filter-panel-btn>

// Em outro controller
FilterPanelService('relatorios').open();
FilterPanelService('relatorios').addHasFilterListener(function(hasFilter){ ... });
```

`register()` resolve defers pendentes (btn pode ser criado antes do panel). Nome duplicado lanca `Instancia de FilterPanel X ja foi definida.`.

## Filtros do dicionario (dynamic-filter-panel)

`SkFilter.getFilterPanelFields(entityName)` consulta `MetadataProvider.getEntityMetadata(entity)` e filtra campos com `field.fieldFilterInfo`. Sem campos marcados, `hasFilterInfos=false` e o accordion dinamico nao aparece.

Tipos suportados (traducao em `typeTranslations`): `N→I`, `B→S`, `SO→S`, `DT→D`, `DH→D`, `T→S`, `ENTITY`, `BLIST→CHECKLIST`, `P→DP`, `ENTITYLIST`.

Valores especiais: `__ALL__`, `__VOID__`, `__NON_VOID__`.

Sincronizacao entre instancias (mesma tela com varios paineis): evento `$rootScope` `SYNC_DYNAMIC_FILTER_PANEL_EVENT` por `{resourceId}.DynamicFilterAccordion`.

## Fluxo de aplicacao

```javascript
// apply()
if (dataSource && !applyFunction) {
    dataSource.refresh().then(closeOnApply);
} else {
    $q.when((applyFunction || noop)()).then(function(result) {
        if (result) closeOnApply();       // so fecha se truthy
    });
}
// closeOnApply() so fecha em mobile (UserAgentUtils.isMobile())
```

## Gotchas

1. **`<filter-header>` duplicado lanca**. O `$postLink` itera filhos do transclude: dois `<filter-header>` disparam `'[sk-filter-panel] Nao e possivel informar dois filter-header.'`.

2. **`getPersonalizedFilter()` lanca em dois cenarios**. Se `disablePersonalizedFilter=true` → `'Nao existe filtro personalizado pois o "disablePersonalizedFilter" foi ligado.'`; se ainda nao carregado → `'Instancia de filtro personalizado ainda nao carregada.'`. Usar `whenPersonalizedFilterLoad().then(...)` antes.

3. **`instanciaName` duplicado no service lanca**. `FilterPanelService(name).register()` com nome ja ocupado (nao-deferred) dispara `'Instancia de FilterPanel X ja foi definida.'`. Nome `undefined` (default) compartilha entre telas — se ha mais de uma tela ativa (popup + fundo), pode colidir.

4. **`sk-custom-criteria-loader` e obrigatorio quando ha filtros custom**. Sem ele, `sk-filter-panel-btn` nao consegue calcular se ha filtro ativo e a cor/badge nao reflete estado real. O comentario ngdoc destaca isso em vermelho.

5. **`sk-apply-function` precisa retornar truthy para fechar em mobile**. `closeOnApply` so roda quando `applyResult` e truthy. Retornar `undefined`/`void` mantem o painel aberto em mobile — valido se o usuario precisa revisar multiplos filtros, problematico se nao.

6. **`sk-has-active-filter` vs `sk-has-some-active-filter`**. O primeiro e so personalizado; o segundo inclui dinamico + personalizado + custom. Usar o errado da cor de botao incoerente. Para colorir o `sk-filter-panel-btn`, o framework usa `hasSomeActiveFilter` via `addHasFilterListener`.

7. **`dynamic-filter-panel` exige `entityName` ou dataSource nao-standalone**. Se `dataSource.isStandAlone()` retorna `true`, `loadFilters()` e pulado e o accordion dinamico fica vazio. Caso contrario, sem `entityName` e sem `dataSource.getEntityName()` → throw `'[dynamic-filter-panel] E obrigatorio informar um entityName ou ter um entityName no DataSource'`.

8. **`resourceId` generico vaza ultimos valores entre telas**. A config de ultimos valores e salva como `{resourceId}.DynamicFilterAccordion`. Sem `resourceId` unico por tela, duas telas compartilham o mesmo snapshot e reescrevem uma a outra. Garantir `resourceId` distinto (ou proveniente da URL `?resourceID=`).

9. **`remove-header` no `<default-group>` com outros accordions quebra UX**. O ngdoc alerta: o `remove-header` foi pensado para o caso de **apenas** o grupo default existir. Combinar com `<custom-group>` deixa um bloco sem header no meio de outros com header.

10. **`entity-list` tem cache proprio (`_entityListCtrls`, `_entityListLastValues`)**. Trocar `dataSource` sem destruir o painel pode manter controllers antigos de entity-list. Em telas que substituem a referencia do dataset, destruir/recriar o panel inteiro e mais seguro.

11. **Filtros custom adicionados ao panel apos init nao aparecem sozinhos**. O `$postLink` roda uma vez; filtros adicionados depois exigem `setCustomFiltersElement(novoElement)`. Pending: se `_dynamicFilterPanel` ainda nao esta pronto, a chamada e enfileirada em `_pendingCustomFiltersElement`.

12. **`init()` injeta `sk-disable-attr-width` e `layout` no `$element`**. Se o consumidor tenta controlar largura via `width=` do Angular, pode ser ignorado — usar `sk-panel-width`. Ausencia do atributo `layout` e preenchida automaticamente.

13. **Typo latente em `tooltipApply`**. Linha `self.tooltipApply = $scope.tooddltipApply ? $scope.tooltipApply : 'Geral.buttonAplicarTooltip'` usa `tooddltipApply` no teste — sempre `undefined`, entao `tooltipApply` fica sempre com o fallback. Passar `sk-tooltip-apply` nao muda o tooltip.

14. **`sk-is-fixed-mode` nao bloqueia `close()` programatico**. Apenas impede o fechamento automatico apos `apply` em mobile. Codigo que chama `filterService.close()` fecha do mesmo jeito.

15. **`EventBus.dispatchEvent('hasFilter',...)` e mixin via `ObjectUtils.extend`**. Nao ha `removeEventListener` publicado — listeners adicionados por `addHasFilterListener` vivem ate o `$destroy` do scope do panel. Em telas com paineis recriados dinamicamente, listeners do consumidor ficam ativos ate o panel morrer.
