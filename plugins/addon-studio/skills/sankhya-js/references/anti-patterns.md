# sankhya-js — Praticas nao recomendadas

Anti-padroes observados no codigo real que causam bugs recorrentes. Cada item lista o padrao ruim, **por que** gera problema e qual e a alternativa correta.

Use como checklist de triagem de bugs em telas AngularJS e code-review.

---

## 1. `setTimeout`/`$timeout(fn, ms)` para "esperar" retorno de servico

### Padrao ruim

```javascript
ServiceProxy.callService('mge@Algo.fazer', payload);
$timeout(function() {
    // supostamente o servico ja terminou...
    self.atualizarTela();
}, 500);
```

 `setTimeout` envolvendo `$popupInstance.dismiss` dentro de um `.catch` para "mover o throw para fora da cadeia de promise".

### Por que quebra

- `callService` retorna promise. Em rede lenta ou servico pesado, 500ms pode nao ser suficiente e o codigo do `$timeout` executa com dado velho.
- Em rede rapida, o handler executa antes do tempo e fica preso atras do timer.
- Nunca se sabe se o servico falhou ou foi cancelado quando o callback do timer roda.
- O callback do timer NAO entra no ciclo de digest sempre (se usar `setTimeout` cru), pulando atualizacoes de binding.

### Forma correta

Sempre **encadear no `.then`** da promise:

```javascript
ServiceProxy.callService('mge@Algo.fazer', payload)
    .then(function(data) {
        self.atualizarTela(data.responseBody);
    })
    .catch(function(err) {
        // trate ou deixe o popup padrao agir
    });
```

Para sequenciar, encadeie com outro `.then`. Para paralelizar, use `$q.all([p1, p2])`.

---

## 2. Polling de `dataset.isLoaded()` em vez de `addRefreshedListener`

### Padrao ruim

```javascript
var t = setInterval(function() {
    if (self.ds.isLoaded()) {
        clearInterval(t);
        self.prosseguir();
    }
}, 100);
```

Variante pior com `$timeout` recursivo fazendo a mesma coisa.

### Por que quebra

- `isLoaded()` fica `true` **para sempre** apos o primeiro load. Em refreshes subsequentes continua `true`, entao polling nao deteta "terminou este refresh".
- Gera carga desnecessaria no ciclo de digest a cada 100ms.
- Risco de memory leak se a tela fechar antes do load terminar e o interval nao for limpo.

### Forma correta

```javascript
var removeListener = self.ds.addRefreshedListener(function(reason) {
    self.prosseguir();
});
$scope.$on('$destroy', removeListener);
```

Ou, para o primeiro load especificamente:

```javascript
self.ds.initAndRefresh().then(function() {
    self.prosseguir();
});
```

---

## 3. Chamar `getCurrentRow()` imediatamente apos `refresh()`

### Padrao ruim

```javascript
self.ds.refresh();
var row = self.ds.getCurrentRow();   // ainda e o row anterior
```

### Por que quebra

`refresh()` retorna promise — a leitura sincrona logo abaixo pega o registro anterior. Funciona "por sorte" em cache quente, quebra quando o servico e chamado de verdade.

### Forma correta

```javascript
self.ds.refresh().then(function() {
    var row = self.ds.getCurrentRow();
});
```

Ou use `addRefreshedListener` se precisar reagir a todos os refreshes.

---

## 4. Esquecer de desregistrar listeners do dataset/ServiceProxy

### Padrao ruim

```javascript
self.ds.addDataSavedListener(function(isNew, records) {
    ...
});
// sem guardar o retorno nem limpar no $destroy
```

### Por que quebra

Todos os `add*Listener` do dataset retornam **funcao de desregistro**. Se a tela e reaberta sem recarregar o bundle, o listener antigo continua. Na segunda sessao, cada save dispara o listener 2x. Terceira, 3x. E assim por diante.

Vale o mesmo para `ServiceProxy.addClientEvent` — retorna `ClientEventHandler` com `.unregistry()`.

### Forma correta

```javascript
var off = self.ds.addDataSavedListener(fn);
$scope.$on('$destroy', off);
```

Ou passar `$scope` onde a API suportar (ex.: `SkComponentRegistry.register(inst, handle, $scope)`).

---

## 5. Mutacao direta de `record[i] = valor`

### Padrao ruim

```javascript
var row = self.ds.getCurrentRow();
row[indexCampoX] = 'novo valor';
```

### Por que quebra

- Nao notifica observers/listeners do dataset.
- Field binders e validadores ligados ao campo nao recalculam.
- Triggers do `addFieldValueEvaluator` nao disparam.
- Row fica "modificada" mas `isRecordDirty()` pode retornar errado.

### Forma correta

```javascript
self.ds.setFieldValue('CAMPOX', 'novo valor');
```

`setFieldValue` passa pelos interceptadores, atualiza binders e dispara `dataModified`.

---

## 6. Construir URL de servico na mao em vez de usar `ServiceProxy`

### Padrao ruim

```javascript
$http.post('/mgecom/service.sbr?serviceName=X.y', payload);
```

### Por que quebra

Nao aplica: headers `appkey`/`sktk`, counter incremental, `mgeSession`, `resourceID`, `globalID`, `flowID`, popup de erro padrao, client events, print listeners, monitoramento de rede, modulo em update, serializacao de chamadas, suporte a abort.

### Forma correta

```javascript
ServiceProxy.callService('<addon>@MeuServicoSP.metodo', payload);
```

Sempre. Mesmo para GET (passar `{ method: 'GET' }` no config).

---

## 7. Servicos sem prefixo de modulo

### Padrao ruim

```javascript
// Servico esta no mgecom, mas foi chamado sem prefixo
ServiceProxy.callService('FichaParceiroSP.getFinanceiros', payload);
```

### Por que quebra

Sem `@`, cai em `defModule = "mge"`. Request vai para `/mge/service.sbr?...` e o backend retorna erro de "servico nao encontrado".

Em triagem: se o bug reporta erro "servico X.y nao encontrado" e o servico existe, verifique o prefixo de modulo no frontend.

### Forma correta

```javascript
ServiceProxy.callService('<addon>@MeuServicoSP.metodo', payload);
```

---

## 8. `callService` com `callback` E `.then` ao mesmo tempo

### Padrao ruim

```javascript
ServiceProxy.callService('mge@X.y', payload, {
    callback: function(data) { /* handler A */ }
}).then(function(data) { /* handler B */ });
```

### Por que quebra

Se `config.callback` esta setado, o `.then` nunca recebe o dado. Handler B so dispara em caso de erro (e mesmo assim so se `exceptionCallback` nao estiver setado).

### Forma correta

Use **um modelo ou outro** — de preferencia `.then` (promise-based). `callback`/`exceptionCallback` existe por compatibilidade com codigo mais antigo.

---

## 9. Duplicar handle no `SkComponentRegistry` sem `ignoreDuplicity`

### Padrao ruim

```javascript
// Em dois controllers diferentes, sem coordenar
SkComponentRegistry.register(self, 'meuHandle');
```

### Por que quebra

O segundo `register` com mesmo handle gera `console.warn` e retorna `angular.noop`. A instancia antiga continua ativa — se ja foi destruida, `get(handle)` resolve com zumbi.

Em triagem: bugs de "esta chamando o metodo errado" / "mostra dado de tela anterior" em telas que usam `SkComponentRegistry` frequentemente tem raiz aqui.

### Forma correta

- Usar handles unicos por escopo de tela (ex.: incluir resourceId ou uuid).
- Quando a sobrescrita e desejada, passar `ignoreDuplicity: true`.
- Sempre passar `$scope` no terceiro argumento para auto-desregistro.

---

## 10. Tratar erro de servico via try/catch sincrono

### Padrao ruim

```javascript
try {
    ServiceProxy.callService('mge@X.y', payload);
} catch (e) {
    // nunca entra aqui — servico e assincrono
}
```

### Por que quebra

`callService` retorna promise imediatamente. O erro vai via rejection, nao exception. O `try/catch` so pegaria erro na **construcao** da chamada.

### Forma correta

```javascript
ServiceProxy.callService('mge@X.y', payload)
    .catch(function(err) { ... });
```

---

## 11. Popup duplicado em caso de erro

### Padrao ruim

```javascript
ServiceProxy.callService('mge@X.y', payload)
    .catch(function(err) {
        MessageUtils.showError('Erro', 'Falhou: ' + err.statusMessage);
    });
```

### Por que quebra

O ServiceProxy **ja exibe popup de erro** por default em `handleDefaultSystemError`. O codigo acima abre o popup do framework **e** o popup manual — usuario ve dois modais sobrepostos.

### Forma correta

Escolha um:

```javascript
// Opcao A: so popup manual, suprime o padrao
ServiceProxy.callService('mge@X.y', payload, {
    ignorePopUpErrorMsgs: true
}).catch(handler);

// Opcao B: errorHandler customizado substitui o padrao
ServiceProxy.callService('mge@X.y', payload, {
    errorHandler: function(data, status) {
        MessageUtils.showError(...);
    }
});
```

---

## 12. Injetar `$SkInjector` em service/controller

### Padrao ruim

```javascript
angular.module('<Tela>App').service('MinhaSvc',
  ['$SkInjector', function($SkInjector) { ... }]);
```

### Por que quebra

O `$get` do provider lanca `Error('Este injector deve ser usado apenas em configurações de módulos.')`.

### Forma correta

Usar `$SkInjectorProvider` apenas em `.config([...])`, **nunca** em services/controllers.

---

## 13. Alterar `$scope.parentDataset` apos bootstrap

Dataset usa `AngularUtil.addSingleWatch($scope, 'parentDataset', setParentDataSet)` — `addSingleWatch` dispara uma unica vez. Trocar o parent depois nao re-configura a hierarquia.

### Forma correta

Use `dataset.setParentDataSet(outro)` explicitamente.

---

## 14. Acessar `workspace` global diretamente

### Padrao ruim

```javascript
window.workspace.openAppActivity(id, pk);
```

### Por que quebra

Em ambiente standalone (teste, iframe sem shell, SSR-like), `workspace` e `undefined`. O codigo quebra com TypeError.

### Forma correta

Usar `SkWorkspace` — todos os metodos fazem `workspace && workspace.xxx()`.

```javascript
SkWorkspace.openAppActivity(id, pk);
```

---

## Checklist rapido para triagem

Em bugs de tela AngularJS/sankhya-js, investigue primeiro:

- [ ] Servico sendo chamado com prefixo de modulo correto?
- [ ] Ha `$timeout`/`setTimeout` aguardando algo assincrono?
- [ ] Listeners de dataset/ServiceProxy estao sendo desregistrados?
- [ ] `refresh()` seguido de leitura sincrona sem `.then()`?
- [ ] `setFieldValue` vs mutacao direta de record[i]?
- [ ] Popup duplicado de erro?
- [ ] Handle duplicado no `SkComponentRegistry`?
- [ ] `callback` + `.then` no mesmo `callService`?

Esses oito itens cobrem a maioria das classes de bugs recorrentes em telas antigas.
