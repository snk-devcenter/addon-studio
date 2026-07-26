# sankhya-js — Armadilhas

Comportamentos nao-obvios extraidos do codigo. Ler antes de escrever ou revisar codigo que toque essas APIs.

---

## 1. `serviceName` sem `@` cai no modulo `mge`

```javascript
var defModule = "mge";
if (serviceName.indexOf("@") > -1) {
    var s = serviceName.split("@");
    defModule = s[0];
    serviceName = s[1];
}
```

Consequencia: `ServiceProxy.callService('MeuServicoSP.metodo',...)` vai para `/mge/service.sbr?serviceName=MeuServicoSP.metodo` — o servico do addon nunca e alcancado. **Sempre prefixe**: `<addon>@` para servico do proprio addon, `mgecom@`/`mgefin@`/`mge@` para servico nativo.

---

## 2. `MetadataProvider` cacheia com locale no nome

```javascript
function getFullEntityName(entity) {
    return entity + '-' + getLocale();
}
```

Entrada `"Produto"` vira chave de cache `"Produto-pt_BR"`. Trocar idioma invalida as entradas anteriores (ficam orfas no cache ate reload). Alem disso, requests para o backend vao para `/mge/metadataProvider.mge/Produto-pt_BR.js` — o backend precisa responder aquela rota.

Pratico: chamar `SkI18nService.setLang(novoLang)` **nao** limpa o cache do MetadataProvider.

---

## 3. `_useInternalCache` do MetadataProvider e `false` por default

```javascript
var _useInternalCache = false;
```

Resultado: toda chamada a `getEntityMetadata` dispara request HTTP, mesmo que a entidade tenha sido buscada antes. So ha deduplicacao **em voo** via `pendingEntityRequests`. Para ativar o cache, setar via atribuicao direta (nao ha setter publico).

---

## 4. Handle duplicado no `SkComponentRegistry.register`

```javascript
if (instances[handle]) {
    console.warn('[ComponentRegistry] Instancias com handle duplicado: ' + handle);
    exists = true;
    if(!ignoreDuplicity) return angular.noop;
}
```

Segundo `register` com mesmo handle NAO sobrescreve — retorna `angular.noop`. A instancia antiga permanece ate alguem chamar a funcao de desregistro dela. Para sobrescrever intencional, passe `ignoreDuplicity: true`.

Consequencia pratica: se dois controllers com mesmo handle sao instanciados em ordem imprevisivel, o segundo silenciosamente nao se registra — e `get(handle)` continua resolvendo com a primeira instancia, que pode ja estar destruida.

---

## 5. `SkComponentRegistry.get` empilha para sempre se ninguem registrar

```javascript
if (instance) {
    deferred.resolve(instance);
} else {
    addToPendingHandles(handle, deferred);
}
```

O deferred fica em `pendings[handle]` sem timeout. Se nenhum `register` ocorrer para aquele handle, a promise nunca resolve nem rejeita — vaza memoria e trava cadeias `.then`. Use `getSync(handle)` quando puder tolerar `null` imediato.

---

## 6. `ServiceProxy.builder()` lanca `Error` se `serviceName` faltar

```javascript
if (varMD.required && angular.isUndefined(currValue)) {
    throw Error((varMD.asOption ? 'Opção ' : 'Variável ') + key
                + ' é requerida e não foi preenchida no builder');
}
```

`ServiceProxy.builder()` marca `serviceName` como required. Esquecer `.serviceName(...)` derruba com `Error` sincrono — nao volta como rejection de promise.

---

## 7. `config.callback` suprime o `.then`

```javascript
if (angular.isFunction(config.callback)) {
    config.callback(clonedData);
} else {
    deffered.resolve(clonedData);
}
```

Se passar `{ callback: fn }` no config, o `.then` do promise retornado **nunca resolve com dados**. So com reject. Decida entre um modelo ou outro.

Mesmo vale para `exceptionCallback`: se setado, o reject pode nao chegar em `.catch`.

---

## 8. Erro de servico exibe popup por default

```javascript
function handleDefaultSystemError(data, config, statusMessage) {
    if(config?.ignorePopUpErrorMsgs){ return; }
    ...
    MessageUtils.showError(MessageUtils.TITLE_ERROR, statusMessage);
}
```

Qualquer erro do backend abre popup `MessageUtils.showError`, mesmo que o codigo cliente trate via `.catch`. Isso gera popups duplicados quando o cliente tambem mostra mensagem propria.

Solucoes: passar `ignorePopUpErrorMsgs: true` ou `errorHandler: fn` no config para suprimir o popup padrao.

---

## 9. `$SkInjectorProvider` so funciona dentro de `.config(...)`

```javascript
this.$get = function(){throw new Error('Este injector deve ser usado apenas em configurações de módulos.')};
```

Injetar `$SkInjector` (sem o `Provider`) em qualquer service/controller lanca erro. Uso correto e sempre `$SkInjectorProvider` dentro de um `.config([...])`.

---

## 10. `addHistoryChangeHandler` tem dois caminhos de codigo divergentes

- Se `workspace.addHistoryChangeHandler` existir (ambiente GWT normal), delega para ele.
- Se nao existir, ha fallback usando `$window.onhashchange` ou `$interval` de 100ms polling.

O fallback polling **nao para** automaticamente — se a tela nao chama algo que limpe a funcao no `$interval`, ela continua a cada 100ms. Comentario no codigo menciona "Aqui nao esta force como o flex devido a Central, que entra em loop ao abrir duas notas" — comportamento conhecido.

---

## 11. Segundo `angular.module(nome, [])` sobrescreve o modulo

Um unico arquivo da tela declara o modulo com array (`angular.module('<Tela>App', ['snk'])`, no `<Tela>.js`). Todos os outros (`*.directive.js`, `*.controller.js` de popup, service) reusam com `angular.module('<Tela>App')` **sem** o segundo argumento.

Passar `[]` de novo em outro arquivo **sobrescreve** o modulo ja registrado e derruba o que foi declarado antes no ciclo de carga. Armadilha classica de copiar o `<Tela>.js` de outra tela ao criar arquivo novo.

---

## 12. `.js` da tela nao listado no `.body` falha em silencio

Alem do `<Tela>.js`, todo script da tela (controller de popup, diretiva, service) so e carregado se tiver `<script>` em `launcher/<Tela>.body`. Esquecer a linha nao quebra build nem deploy: no navegador, o popup abre vazio ou o Angular reclama de controller desconhecido — e o arquivo esta la, versionado, aparentemente correto.

Mesma origem: `templateUrl` e `src` sao resolvidos a partir da raiz do `webapp` (`html5/<Tela>/...`), nao da pasta da tela. Path relativo curto retorna 404 e o popup abre em branco.

---

## 13. `pt_BR` e idioma fallback

```javascript
const DEFAULT_LANG = 'pt_BR';
```

Se `$translate.use()` retornar `undefined`, `SkI18nService.getLang()` devolve `'pt_BR'`. Codigo que faz lookup manual por locale precisa lidar com os dois cenarios (locale setado explicitamente vs. default implicito).

---

## 14. Interface do framework: implementacao parcial **lanca**

`ObjectUtils.isImplementorOf(obj, Interface)` nao avisa — derruba:

```javascript
if (!obj.hasOwnProperty(method)) {
    throw new Error(objName + ' não é uma implementação de ' + implementor.name);
}
```

Passa direto so se `obj.__proto__ === Interface.prototype`. Fora disso, **cada** metodo do prototype da interface precisa existir como **own property** do objeto — heranca por prototype chain nao conta, e metodo que a interface declara mas o framework nunca chama tambem e exigido.

Chamado no init de: `IDynaformInterceptor`, `IFormInterceptor`, `IDatagridInterceptor`, `IFilterPanelInterceptor`, `IGridPrinterInterceptor`, `IDynaformConfigObserver`, `CriteriaProvider`, `FieldBinder`, `IDataSetObserver`, `RecordValidator`, `Criteria`, `DataSource`.

Sintoma: a tela morre no carregamento com `Objeto não é uma implementação de IDynaformInterceptor` — `objName` cai em `'Objeto'` quando o interceptor nao tem campo `name`, o que nao ajuda a localizar qual dos interceptors da tela e o culpado.

Forma segura:

```javascript
ObjectUtils.implements(self, IDynaformInterceptor);  // angular.extend do prototype: vira own property
self.acceptField = function (fieldMD, dynaform, dataset) { return fieldMD.name !== 'AD_INTERNO'; };
```

---

## 15. `workspace` global injetado pelo GWT

```javascript
/**A variavel 'workspace' e 'PROFILEID' são injetadas no contexto pelo GWT;*/
```

`SkWorkspace` e um wrapper sobre `window.workspace` e `window.PROFILEID`. Muitos metodos sao `workspace && workspace.xxx()` — se executar fora do container do produto (ex.: teste unitario sem mock, standalone), a maioria e no-op silencioso.

Para testar: mockar `window.workspace` com os metodos que a tela precisa.
