# sankhya-js — `sk-pesquisa-input`

Input de **foreign-key resolver**: o usuario digita o codigo (ou busca por descricao), o componente resolve a PK contra uma entidade-alvo e sincroniza codigo + descricao com o dataset. Tambem abre popup de pesquisa avancada com criteria. E o widget mais usado em cadastros — toda referencia FK (Parceiro, Produto, Usuario, Natureza, Empresa, etc.) passa por aqui.

Vive em components/input/pesquisa/. Pertence ao modulo `snk.components.input` (nao ha modulo `pesquisa` separado).

## Arquitetura interna

Nao e um widget monolitico. Por baixo, o template renderiza:

- `<sk-text-input>` — campo de codigo (PK).
- `<sk-typeahead-input>` — campo de descricao com suggestions.
- Icone de busca (`<sk-icon font-icon="search">`) que abre o popup avancado.

O controller (`SkPesquisaInputController`) implementa `FieldBinder` via `ObjectUtils.implements`, participando do ciclo do dataset como qualquer input.

O service (`SkPesquisaService`) encapsula as chamadas ao backend (`mge@PesquisaSP.*`) e o popup avancado.

## Modos de uso

### 1. Com dataset (forma canonica em cadastros)

```html
<sk-pesquisa-input sk-dataset="ctrl.ds"
                   sk-field-name="CODPARC"
                   sk-entity-name="Parceiro"></sk-pesquisa-input>
```

O campo de codigo liga ao field `CODPARC`. A descricao e automaticamente ligada a `Parceiro.NOMEPARC` (via `fk.descriptionFieldName` dos metadados) — o controller ja busca o campo de descricao padrao da FK.

Quando o metadata nao expoe `fk.descriptionFieldName`, usar `sk-description-field-name` explicitamente:

```html
<sk-pesquisa-input sk-dataset="ctrl.ds"
                   sk-field-name="CODUSU"
                   sk-entity-name="Usuario"
                   sk-description-field-name="Usuario.NOMEUSU"></sk-pesquisa-input>
```

### 2. Standalone (filtros / modais)

```html
<sk-pesquisa-input sk-value="ctrl.codParc"
                   sk-entity-name="Parceiro"
                   sk-change="ctrl.onParcChange()"></sk-pesquisa-input>
```

Sem dataset, o bind do codigo e na variavel de `sk-value`. Descricao e local ao componente. Para forcar carregamento da descricao em tela que nao esta visivel, usar `sk-force-load-description="true"`.

### 3. Dentro de `sk-datagrid` como editor de celula

Com o atributo `sk-datagrid-editor`, o template adapta: o codigo vira editor inline e a descricao e escondida.

```html
<sk-pesquisa-input sk-dataset="ctrl.ds"
                   sk-field-name="CODPROD"
                   sk-entity-name="Produto"
                   sk-datagrid-editor="true"></sk-pesquisa-input>
```

## Atributos de scope

Definidos. Agrupados:

### Entidade

| Atributo | Binding | Uso |
|---|---|---|
| `sk-entity-name` | `@?` | Nome da entidade a pesquisar (obrigatorio na pratica) |
| `sk-local-entity-name` | `@?` | Entidade local quando o FK esta em uma tabela local |
| `sk-target-field` | `@` | Campo fisico no dataset (override do fieldName) |
| `sk-description-field-name` | `@?` | Campo com a descricao — ex.: `"Parceiro.NOMEPARC"` |
| `sk-target-description-field-name` | `@?` | Campo no dataset local onde gravar a descricao |
| `sk-relation-ship-description` | `@` | Relacao que expoe a descricao (pra FK aninhado) |
| `sk-resource-id-cadastro` | `@?` | ResourceID da tela de cadastro da entidade — aparece botao "Ir para cadastro" no popup |

### Dataset / modelo

| Atributo | Binding | Uso |
|---|---|---|
| `sk-dataset` | `=?` | Dataset |
| `sk-field-name` | `@?` | Nome do campo |
| `sk-field-index` | `@?` | Indice do campo (alternativa ao nome) |
| `sk-value` | `=?` | Modelo standalone |
| `sk-use-local-field-name` | `=?` | Usa fieldName local em vez do relacional |
| `sk-api` / `sk-pesquisa-input-api` | `=?` | Ref bidirecional ao controller |

### Criteria

| Atributo | Binding | Uso |
|---|---|---|
| `sk-enviroment-criteria` | `&?` | **Funcao** que retorna uma `Criteria` ou string — aplicada em cada busca |
| `sk-form-criteria` | `@?` | Criteria **estatica** em formato string |
| `sk-dependent-fields` | `=?` | Array de campos dos quais depende (dispara reload) |
| `sk-somente-analitico` | `=?` | Filtra registros analiticos (nao sinteticos) |
| `sk-show-inactives` | `<?` | Inclui registros inativos |

### Descricao — carga

| Atributo | Binding | Uso |
|---|---|---|
| `sk-show-description-input` | `=?` | Exibe/esconde o campo de descricao (default `true`) |
| `sk-load-description` | `=?` | Carrega descricao (comportamento default `true`) |
| `sk-load-description-on-change` | `=?` | Recarrega em cada mudanca |
| `sk-load-description-without-being-visible` | `=?` | Permite carga mesmo escondido — **ver gotcha 6.1** |
| `sk-force-load-description` | `=?` | Forca reload mesmo quando codigo nao mudou |
| `sk-save-description-field-to-data-set` | `=?` | Grava descricao no dataset local (util quando nao se salva imediato) |
| `sk-notify-description-change-to-data-set` | `=?` | Notifica dataset ao trocar descricao (default `true`) |

### Comportamento

| Atributo | Binding | Uso |
|---|---|---|
| `sk-enabled` | `=?` | Habilitado (default `true`) |
| `sk-required` | `=?` | Requerido |
| `sk-code-input-enabled` | `=?` | Habilita apenas o campo de codigo |
| `sk-data-type` | `=?` | Tipo do codigo (`'I'` = inteiro, `'D'` = decimal, etc.) |
| `sk-disable-on-insertion` | `=` | Bloqueia em modo insercao |
| `sk-show-finder-error` | `<?` | Exibe erro quando registro nao encontrado (default `true`) |
| `sk-only-search` | `=?` | So permite busca pelo popup, nao por digitacao |
| `sk-only-presentation` | `=?` | So apresenta, sem edicao |
| `sk-standalone-mode` | `=` | Modo desacoplado de dataset |
| `sk-allow-show-hierarchical-mode` | `=?` | Permite visao hierarquica no popup |
| `sk-use-tab-like-enter` | `=?` | Tab comporta-se como Enter (confirma e avanca) |
| `sk-enable-lookup` | `=?` | Se `false`, skip a chamada ao PesquisaSP e apenas dispara `onEntityChange` |

### Callbacks

| Atributo | Binding | Invocacao |
|---|---|---|
| `sk-change` | `&?` | Codigo mudou |
| `sk-entity-change` | `&?` | Registro carregado (arg: `{pkField, key, label, data, fields, programmatically}`) |
| `sk-end-edit` | `&` | Saiu do campo (arg: `{value, inputName}` onde `inputName` e `'code'` ou `'description'`) |
| `sk-on-created` | `&?` | Componente criado |
| `sk-click-handler` | `&?` | Click custom |
| `sk-focus` | `=?` | Funcao expos ao pai |
| `sk-focus-out` | `=?` | Funcao expos ao pai |

## API publica do controller

Expostos em `self.*`. Acesso via `sk-api="ctrl.pesquisaApi"`:

- `loadDescription(initialLoad, programmatically, code, forceLoad, datasetIndex)` — carrega descricao da entidade a partir do codigo. Sem argumentos, usa o `$scope.codeValue` atual.
- `getTargetDescriptionFieldName()` — retorna o nome do campo onde a descricao vai ser gravada.
- `getDescriptionValue()` — descricao atual.
- `setCodeValue(newV)` — seta o codigo (pode acionar reload da descricao).
- `setDescriptionValue(description)` — seta apenas a descricao (sem reload).
- `setFocus(onDescription)` — foco no codigo ou na descricao.

Flags no controller:
- `observerActivated` — `true` apos o observer ativar a primeira vez.
- `descriptionLoaded` — `true` apos primeira carga bem-sucedida.

Exemplo:

```html
<sk-pesquisa-input sk-dataset="ctrl.ds" sk-field-name="CODPARC"
                   sk-entity-name="Parceiro"
                   sk-api="ctrl.parcApi"></sk-pesquisa-input>
```

```javascript
// Em outro evento, recarregar
ctrl.parcApi.loadDescription(false, true, undefined, true);

// Focar no campo de descricao
ctrl.parcApi.setFocus(true);
```

## `SkPesquisaService`

Service injetavel para uso programatico:

### Suggestions (typeahead)

```javascript
SkPesquisaService.loadSuggestions(entityName, value, compacted, limit, requestCriteria, options)
    .then(function(entity) {
        // entity.data: array de registros
        // entity.fieldsMetadata: metadados dos campos
        // entity.pkField, entity.descriptionField: campos-chave
    });
```

Chama `mge@PesquisaSP.getSuggestion` com `allowConcurrentCalls: 'true'` no header. **Importante**: a ultima chamada vence — resultados de chamadas anteriores sao descartados.

### Resolver por PK

```javascript
SkPesquisaService.loadSuggestionsByPk(entityName, pk, parentPk, requestCriteria, options)
```

`pk` pode ser valor simples ou objeto (PK composta). Se objeto, o primeiro campo e assumido como `assumedPkName` e o restante vai para `parentPk`.

### Popup de pesquisa avancada

```javascript
SkPesquisaService.openPesquisaPopUp(entityName, value, options)
    .then(function(result) {
        // usuario selecionou registro
    });
```

`options` suporta `resourceIdCadastro` (adiciona botao "Ir para cadastro"), `modalId` (para poder fechar programaticamente via `closeModal`), `onlyPresentation`, `txProperties`, `localEntityName`, `ignoreEntityCriteria`, `limit`, `orderByDesc`.

### Fechar popup programaticamente

```javascript
SkPesquisaService.closeModal('modalId1');
SkPesquisaService.closeModal(['modalId1', 'modalId2']);
SkPesquisaService.closeModal('modalId1,modalId2');
```

Aceita string unica, CSV ou array.

### Favoritos

```javascript
SkPesquisaService.isFavorite(entityName, pkValues).then(isFav => ...);
SkPesquisaService.updateFavorite(entityName, pkValues, true);
```

### Configuracao de pesquisa (campos visiveis no popup)

```javascript
SkPesquisaService.getSearchConfig(entityName).then(...);
SkPesquisaService.saveSearchConfig(entityName, descriptor);
SkPesquisaService.removeSearchConfig(entityName);
```

## Criteria

### Dinamica (muda por registro) — `sk-enviroment-criteria`

```html
<sk-pesquisa-input sk-dataset="ctrl.ds"
                   sk-field-name="CODPROD"
                   sk-entity-name="Produto"
                   sk-enviroment-criteria="ctrl.buildCriteria()"></sk-pesquisa-input>
```

```javascript
ctrl.buildCriteria = function() {
    return new Criteria('this.ATIVO = :ativo')
        .addParameter('ativo', 'S', 'S');
};
```

Funcao chamada a cada busca. Retornar `null` para sem criteria adicional.

### Estatica — `sk-form-criteria`

String com a expressao de criteria. Avaliada uma unica vez.

### Dependencia em outros campos — `sk-dependent-fields`

Array com os fieldNames dos quais o pesquisa depende. Quando um deles muda, a carga e invalidada.

## Servicos `PesquisaSP.*` chamados

Todos com prefixo `mge@`:

- `PesquisaSP.getSuggestion` — typeahead e carga por PK.
- `PesquisaSP.isFavorito` — verifica favorito.
- `PesquisaSP.marcarComoFavorito` — marca/desmarca.
- `PesquisaSP.getSearchConfig` — recupera config da pesquisa.
- `PesquisaSP.saveSearchConfig` — persiste config.
- `PesquisaSP.removeSearchConfig` — remove config.
- `mge@SystemUtilsSP.getInstanceDescription` — descricao de instancia (para `relationShipDescription`).

## Gotchas

### 6.1. `loadDescription` ignora chamada se elemento nao estiver visivel

Por default, `loadDescription` **retorna sem carregar** quando `clientHeight == 0`. Em abas nao renderizadas, tooltips, popups com display inicial `none`, a descricao nunca carrega. Para forcar carga mesmo escondido: `sk-load-description-without-being-visible="true"`.

Excecao: dentro de `sk-datagrid` com atributo `aggrid`, o check e ignorado.

### 6.2. `lastLoadedPk` curto-circuita reloads

Se o codigo atual e igual ao ultimo carregado, `loadDescription` retorna sem fazer nada. Para forcar reload (ex.: criteria mudou), passar `forceLoad=true` ou setar `sk-force-load-description`.

### 6.3. Standalone + descricao = configuracao explicita

No modo standalone (sem dataset), `loadDescription` **retorna sem carregar** a menos que `sk-force-load-description` esteja ativo. Em filtros standalone, sempre combinar com `sk-force-load-description="true"` se precisa da descricao.

### 6.4. `enableLookup=false` suprime a consulta

Quando `sk-enable-lookup="false"`, o componente **nao** chama `PesquisaSP.getSuggestion` — apenas dispara `onEntityChange` com o codigo cru. Util quando a descricao vem de fonte externa, mas e fonte comum de "descricao nao aparece mesmo com codigo valido".

### 6.5. `descriptionFieldName` vem de `fk.descriptionFieldName`

Quando nao informado, e lido de `fieldMD.fk.descriptionFieldName` do metadata. Entidades sem FK mapeada direito caem no branch `else` e o componente desabilita o campo de descricao. Se a FK existe mas o metadata nao expoe, informar `sk-description-field-name` explicito.

### 6.6. Race em `sk-datagrid`: resultado de linha antiga chega em linha nova

Como `loadSuggestionsByPk` e assincrono, quando usado dentro de grid o dataset pode mudar de linha antes do retorno. O controller aborta o processamento se `datasetIndex !== $scope.dataset.getCurrentIndex()` **e** o atributo `aggrid` esta presente. Em grids que nao usam `aggrid` (jqx, ui-grid), esse guard nao dispara — esteja ciente ao montar custom column.

### 6.7. Timeout de 15s no loading

A promise de carga tem timeout de 15 segundos via `AngularUtil.timeoutPromise`. Servicos backend lentos (criteria com join pesado, entidade grande sem indice) fazem a descricao "nao aparecer" sem erro visivel — apenas o `searching` volta para false. Em triagem de bug "descricao nao carrega em entidade X", inspecionar tempo do `PesquisaSP.getSuggestion`.

### 6.8. `saveDescriptionFieldToDataSet` grava com `notify=false`

Quando `sk-save-description-field-to-data-set="true"`, o grava via `dataset.setFieldValue(rel + '.' + descField, value, false)`. O terceiro parametro `false` suprime notificacao — listeners de `dataModified` do campo de descricao **nao** disparam.

### 6.9. `closeModal` precisa de `modalId` no momento do `open`

Para poder fechar o popup programaticamente, o `open` tem que receber `modalId`. Sem isso, o popup nao entra em `modalInstanceById` e `closeModal` e no-op silencioso.

### 6.10. `loadSuggestions` tem deduplicacao implicita por `lastValue`

Multiplas chamadas concorrentes: so o resultado cuja query casa com `lastValue` e resolvido. Respostas "antigas" sao descartadas silenciosamente. Bom para typeahead, mas pode surpreender quem chama o service direto esperando que toda promise resolva.

### 6.11. `showInactives` precisa de `<?` (one-way)

O binding e one-way: `<?skShowInactives`. Mudar a variavel depois do bootstrap do componente **nao** propaga. Para toggle dinamico, usar `sk-options.showInactives` que e lido em cada busca.

## Checklist de triagem

Bugs frequentes em `sk-pesquisa-input`:

- [ ] "Descricao nao aparece": campo esta visivel na montagem? (gotcha 6.1)
- [ ] "Descricao nao atualiza": codigo e o mesmo? (gotcha 6.2, 6.5)
- [ ] Standalone com descricao: `sk-force-load-description` setado? (gotcha 6.3)
- [ ] `enable-lookup="false"` por engano? (gotcha 6.4)
- [ ] Criteria dinamica: funcao retorna `Criteria` ou string valida?
- [ ] Em grid: atributo `aggrid` presente? (gotcha 6.6)
- [ ] Backend lento? Tempo de `PesquisaSP.getSuggestion`? (gotcha 6.7)
- [ ] Listener de `dataModified` no campo de descricao? Pode ser suprimido (gotcha 6.8)
- [ ] `closeModal` nao fecha o popup? Passou `modalId` no `open`? (gotcha 6.9)
