# sankhya-js — Catalogo de APIs

APIs publicas do framework mais usadas em tela de addon. O bundle `snk` ja vem servido pela plataforma — nada aqui e instalado ou versionado dentro do addon.

---

## `ServiceProxy` — comunicacao com backend

Service em `snk.core.util`.

### Chamada direta

| Metodo | Uso |
|---|---|
| `callService(serviceName, content, config)` | Chamada direta. Retorna promise |
| `builder()` | Retorna `FluidBuilder` com `serviceName` (required), `ignoreLoadingBar` (asOption), `params` e alias `.call()` |

### Formato do `serviceName`

`"modulo@Servico.metodo"` ou apenas `"Servico.metodo"` (assume `defModule = "mge"`). Split em `@` em.

### URL montada

```
{urlBase}/{modulo}/service.sbr?serviceName={nome}&counter={n}&application={app}&outputType=json&preventTransform={bool}
```

Parametros opcionais agregados na URL: `mgeSession`, `resourceID`, `globalID`, `flowID`, `vss`, e os de `config.aditionalUrlParameters`.

### `config` suportado em `callService`

| Chave | Default | Efeito |
|---|---|---|
| `method` | `'POST'` | POST/PUT/DELETE/GET. Outros lancam `Error` |
| `ignoreLoadingBar` | `false` | Nao exibe barra de loading global |
| `preventTransform` | `false` | Nao aplica transform no response do backend |
| `normalizedJson` | — | Indica que `content` ja foi normalizado por `XmlJson.normalize` |
| `headers` | — | Extra headers (apenas POST/PUT) |
| `callback(data)` | — | Substitui `.then` — resolve vira callback direto |
| `exceptionCallback(data)` | — | Substitui `.catch` |
| `errorHandler(data, status, headers, config)` | — | Suprime popup de erro padrao |
| `ignorePopUpErrorMsgs` | `false` | Suprime popups mas mantem reject |
| `aditionalUrlParameters` | — | Objeto `{k:v}` concatenado como query string |

### Headers padroes da requisicao

```
Content-Type: application/json; charset=UTF-8
appkey: <valor configurado via self.appKey(...)>
sktk: <sktk.y(requestContent)>
```

### Client events

| Metodo | Uso |
|---|---|
| `addClientEvent(eventId, handler)` | Registra handler. Retorna `ClientEventHandler` com `.unregistry()` |
| `addSingleClientEvent(eventId, handler)` | Idempotente: so registra se nao houver handler para o id |
| `removeClientEvent(eventId, handler?)` | Remove handler especifico ou todos do id |
| `hasClientEvent(eventId)` | Boolean |

Eventos sao injetados automaticamente no request body (`clientEventList.clientEvent`) em.

### Listeners de impressao

| Metodo | Uso |
|---|---|
| `addPrintListener(fn)` | Disparado quando `data.pendingPrinting == "true"` |
| `addLocalPrintingListener(fn)` | Disparado quando `data.localPrintings` presente |

### Serializacao de chamadas

| Metodo | Uso |
|---|---|
| `addSerializedService(serviceName)` | Forca execucao sequencial de chamadas subsequentes deste servico |

### Abortar request

`promise.abort()` — marca `aborted = true` e resolve o deferred de abort.

---

## `FluidBuilder` — padrao builder dos servicos

### Metadados de variavel

Cada entrada do array de metadados pode ser:
- String: `"nomeVar"` — variavel simples, nao-required, nao-asOption
- Object: `{name, required?, asOption?, value?, transformer?, fnImpl?}`

| Campo | Efeito |
|---|---|
| `required` | `.build()` lanca `Error` se nao preenchida |
| `asOption` | Vai para `_options` em vez de `_variables` |
| `value` | Default aplicado no build se nao setada |
| `transformer(value,...)` | Aplica transformacao no setter |
| `fnImpl({workingObj, builder, args})` | Substitui o setter default por funcao customizada |

### Metodos do builder

| Metodo | Uso |
|---|---|
| `.build()` | Valida requireds e invoca `buildFn(variables, options, workingObj)` |
| `.buildFn(fn, alias?)` | Define funcao de build; `alias` expoe como metodo (`.call()`, etc.) |
| `.reset()` | Limpa variaveis e options |
| `.toFunction()` | Retorna funcao que chama `reset()` ao ser invocada |
| `.workingObj(obj)` | Define contexto passado ao `buildFn` |
| `.options(map)` | Substitui todas as options |
| `.option(k, v)` | Seta uma option |
| `.fnImpl(nome, fn)` | Adiciona metodo customizado apos construcao |

Mensagem de erro exata quando `required` falta: `"Variável X é requerida e não foi preenchida no builder"` (ou `"Opção X..."` se `asOption: true`).

---

## `MetadataProvider` — metadados de entidades

Service em `snk.core.metadataprovider` (depende de `snk.core.util`)..

| Metodo | Uso |
|---|---|
| `getEntityMetadata(names)` | Aceita string, CSV, array. Retorna `promise<{ [name]: entity }>` |
| `getEntityAndRelationsMetadata(names, filterFn?, includeOneToMany?)` | Retorna `{entities, relations, oneToManyRelations}` |
| `getSizeOfCache()` | Tamanho do cache interno |

Endpoint: `GET /mge/metadataProvider.mge/{entityName-locale}.js`.

Cache chave: `entityName + '-' + SkI18nService.getLang()`. `_useInternalCache` e `false` por default — alterar via atribuicao direta.

Exposto globalmente em `top.mdProvider`.

---

## `SkComponentRegistry` — compartilhamento de instancias

Factory em `snk.core.services.registry`..

| Metodo | Uso |
|---|---|
| `get(handle)` | Retorna `promise`. Se ja registrado resolve imediato; senao empilha ate o `register` |
| `register(instance, handle, scope?, ignoreDuplicity?)` | Retorna funcao de desregistro. Se `scope` passado, auto-desregistra no `$destroy` |
| `getSync(handle)` | Retorna instancia ou `null` sincrono. Nao empilha |

Handle duplicado: `console.warn` + retorna `angular.noop`. Passar `ignoreDuplicity: true` permite sobrescrever.

Handle vazio ou undefined no `register`: retorna `angular.noop`.

---

## `SkI18nService` — internacionalizacao

Service em `snk.i18n`..

| Metodo | Uso |
|---|---|
| `instant(id, values?)` | Traducao sincrona via `$translate.instant` |
| `translate(id, values?)` | Traducao assincrona (promise) |
| `setLang(lang)` | Muda idioma corrente |
| `getLang()` | Idioma corrente (ou `'pt_BR'` default) |
| `loadAsyncBundle(locale, url)` | GET + `addBundle` para cada chave |
| `addBundle(lang, bundleName, translations)` | Registra bundle (alias: `addPart`) |
| `adjustTranslateValues(values)` | Array vira `{p0, p1,...}` |

Tambem ha o provider `i18n` injetavel como funcao: `i18n('chave', valores)`.

Values array: posicoes viram `p0`, `p1`, `p2`... no mapa.

---

## `SkWorkspace` — integracao com a shell do produto

Service em `snk.core.workspace`. Depende da variavel global `workspace` injetada pelo GWT.

| Metodo | Uso |
|---|---|
| `openAppActivity(resourceId, pkObject)` | Abre tela pelo resourceId |
| `closeApp(resourceId)` | Fecha tela |
| `reloadApp(resourceId, pkObject)` | Recarrega tela |
| `requestSignature(stamp, params, executor, callback, resourceId)` | Pede assinatura digital |
| `revokeSignature(...)` | Revoga assinatura |
| `showDigitalSignDetails(stamp, chaveArquivo)` | Detalhes de assinatura |
| `openHelp(url)` | Ajuda contextual |
| `downloadFile(serverAddress, chave, extension, params)` | Fallback: `/mge/visualizadorArquivos.mge?chaveArquivo=X` |
| `trackAnalyticsEvent(category, action, label)` | Evento de analytics |
| `isJivaW()` / `isSankhyaW()` | Deteccao de produto pelo `PROFILEID` |
| `logout()` | Delega para `workspace.logout()` |
| `getCurrentHistory(resourceID?)` | Hash da tela ativa (ciente de multi-abas) |
| `addHistoryChangeHandler(fn, resourceID, useLocalHash?)` | Listener de mudanca de hash |
| `openSideBarWorkspace(...)` | Multi Abas — abre workspace lateral |

A deteccao usa a global `PROFILEID`, cujos valores sao constantes internas do produto. Prefira `isJivaW()`/`isSankhyaW()` a comparar o valor na mao.

---

## `$SkInjectorProvider` — registro dinamico de modulos

| API | Uso |
|---|---|
| `$SkInjectorProvider.register(module, depNames)` | Adiciona `depNames` como dependencias do `module` apos bootstrap. Executa `_invokeQueue` e `_configBlocks` do modulo dependente |
| `$SkInjectorProvider.setProviders({$provide, $controllerProvider, $compileProvider, $filterProvider, $injector})` | Configurado uma vez no config do `snk`. Nao precisa chamar em codigo de aplicacao |

Injetar `$SkInjector` fora de um `.config(...)` lanca `Error('Este injector deve ser usado apenas em configuracoes de modulos.')`.

---

## Modulos principais

| Modulo | Dependencias |
|---|---|
| `snk` | (agrega tudo) |
| `snk.core.util` | inclui `snk.components.popup` |
| `snk.core.metadataprovider` | `['snk.core.util']` |
| `snk.core.services.registry` | — |
| `snk.core.workspace` | — |
| `snk.i18n` | — |
| `snk.components.<nome>` | geralmente `[]` |

Dependencias externas fixadas em `package.json.otherModuleDependencies`: `ngSanitize`, `ngTouch`, `ui.tinymce`, `ui.mask`.
