# sankhya-js — `PopUpParameter`

Servico que abre um **popup de formulario** a partir de uma lista de parametros, sem template nem controller proprios. E o atalho para "preciso pedir 3 campos ao usuario antes de chamar o servico": onde `SanPopup.open` exigiria `.tpl.html` + `.controller.js` + carregamento no `launcher/<Tela>.body`, aqui basta encadear builders.

Por baixo e um `SanPopup.open` com `templateUrl: 'components/popupparameter/popupparameter.tpl.html'`, cujo template e um unico `<sk-form>`:

```html
<sk-form columns="{{::options.columns}}" properties="fields" sk-autofocus sk-allow-duplicate-fields>
</sk-form>
```

Ou seja: **todo campo suportado pelo `sk-form` funciona aqui** ([form.md](form.md), [inputs.md](inputs.md)).

Fontes (framework, nao versionado no addon):
- components/popupparameter/popupparameter.service.js (291 linhas) — API publica + builder
- components/popupparameter/popupparameter.controller.js (105 linhas) — validacao e montagem do resultado
- components/popupparameter/popupparameter.tpl.html, .module.js, .less

Modulo `snk.components.popupparameter`, ja incluido no bundle `snk`. Na tela do addon basta injetar `'PopUpParameter'` na DI por array — nao ha nada a declarar em `angular.module('<Tela>App', ['snk'])`.

---

## Quando usar cada um

| Necessidade | Use |
|-------------|-----|
| So mensagem / confirmacao | `MessageUtils` ([messages-popup.md](messages-popup.md)) |
| Pedir N campos e seguir o fluxo | **`PopUpParameter`** |
| Popup com layout proprio, grade, wizard, abas, regra de UI | `SanPopup.open` ([messages-popup.md](messages-popup.md)) |
| Formulario ligado a um registro do dataset | `sk-dynaform` / `sk-form` na propria tela ([form.md](form.md)) |

Regra pratica: se o popup nao tem nada alem de campos + OK/Cancelar, `PopUpParameter` elimina 2 arquivos e o registro no `.body`.

---

## Forma 1 — builder (preferida)

```javascript
angular.module('LancamentoOSApp', ['snk'])
  .controller('LancamentoOSController', ['PopUpParameter', 'ServiceProxy', 'MessageUtils',
    function (PopUpParameter, ServiceProxy, MessageUtils) {
      let self = this;

      self.reabrirOs = reabrirOs;

      function reabrirOs(nroOs) {
        PopUpParameter.builder()
            .title('Reabertura de OS')
            .size('md')
            .columns(2)
            .height(180)
            .buildDateParameter('DTREABERTURA', 'Data de reabertura', true, new Date())
            .buildSearchInputParameter('CODUSU', 'Responsavel', true, 'Usuario', 'NOMEUSU')
            .buildStringParameter('OBSERVACAO', 'Observacao', false, undefined, 200)
            .show().result
            .then(function (result) {
                // result = { DTREABERTURA: Date, CODUSU: '3', OBSERVACAO: '...' }
                return ServiceProxy.callService('<addon>@OrdemServicoSP.reabrir', {
                    nroOs: nroOs,
                    codUsu: result.CODUSU,
                    observacao: result.OBSERVACAO
                });
            })
            .then(function (response) {
                MessageUtils.showInfo(MessageUtils.TITLE_INFORMATION, response.responseBody.body);
            });
      }
    }]);
```

`.show()` devolve a **instancia do SanPopup** — o consumo e sempre `.show().result.then(...)`, nunca `.show().then(...)`.

### Builders de parametro

Todos empilham um campo e devolvem o builder. As mesmas funcoes existem soltas no servico (`PopUpParameter.buildStringParameter(...)`) para montar array e usar com `openPopUp`.

| Metodo | Assinatura | Campo gerado |
|--------|-----------|--------------|
| `buildStringParameter` | `(name, description, required, value?, maxLength?)` | texto (`sk-text-input`; `maxLength > 100` vira textarea) |
| `buildIntegerParameter` | `(name, description, required, value?)` | numero (`type: 'I'`) |
| `buildDateParameter` | `(name, description, required, value?)` | data (`type: 'D'`) |
| `buildSwitchParameter` | `(name, description, required, value?)` | switch (`isCheckbox: true`) |
| `buildComboboxParameter` | `(name, description, required, options, defaultValue?)` | combobox — `options` e um **objeto** `{ chave: rotulo }`, convertido para `[{ value: rotulo, data: chave }]` |
| `buildSearchInputParameter` | `(name, description, required, entityName, descriptionFieldName?, options?, value?)` | `sk-pesquisa-input` (`type: 'ENTITY'`) — ver [pesquisa.md](pesquisa.md) |
| `buildFileParameter` | `(name, description, fileKey, uploadState, required)` | upload (`presentationType: 'F'`) — note a **ordem diferente**: `required` e o ultimo |

`options` do `buildSearchInputParameter` aceita `{ showDescription: bool, enviromentCriteria: <criteria> }`, mapeados para `sk-show-description-input` e `sk-enviroment-criteria`.

### Opcoes do popup

Metodos de opcao expostos pelo builder: `.title()`, `.size()`, `.height()`, `.columns()`, `.backdrop()`, `.showBtnDesconsiderar()`.

Qualquer outra opcao vai por `.option(chave, valor)`:

```javascript
PopUpParameter.builder()
    .title('Core.SequenciaDeVisita.titMoverItem')
    .size('alert')
    .buildIntegerParameter('ROWPOSITION', 'Nova posicao', true, 1)
    .option('okLabel', 'Core.SequenciaDeVisita.btnReordenar')
    .show().result
    .then(function (result) { mover(result.ROWPOSITION); });
```

| Opcao | Default | Efeito |
|-------|---------|--------|
| `title` | `'PopupParameters.tituloInformeParametro'` | Titulo (passa por `SkI18nService.instant`) |
| `size` | `'md'` | `'alert'`, `'sm'`, `'md'`, `'lg'`, `'xl'` |
| `columns` | `'1'` | Colunas do `sk-form` |
| `height` | — | Altura fixa do corpo (px) |
| `backdrop` | `'static'` | Igual ao `SanPopup` |
| `okLabel` | `'Geral.lblAplicar'` | Rotulo do OK |
| `showBtnDesconsiderar` | `false` | Exibe o botao "Nao" com semantica de *desconsiderar nao informados* (ver gotcha 3) |
| `noLabel` | `'PopupParameters.lblDesconsiderarNaoInf'` | Rotulo desse botao |
| `localEntityName` | — | Nome da entidade da tela; libera inativos na pesquisa quando o campo aponta para a mesma entidade |

`title`, `okLabel` e `noLabel` passam por `SkI18nService.instant` — aceitam chave i18n **ou** texto literal.

---

## Forma 2 — `openPopUp(parameters, options)`

Use quando os campos vem prontos do backend (metadados de acao, filtros, variaveis de consulta) ou quando precisa de `fieldProp` que os builders nao expoem.

```javascript
var parameters = [
    {
        name: 'DTVALIDADE',
        fieldName: 'DTVALIDADE',
        description: 'Data de validade',
        type: 'D',                  // I, F, D, T, H, C, S, ENTITY, ENTITYLIST, CGC_CPF, CEP, ...
        presentationType: 'P',      // default aplicado pelo controller quando ausente
        required: true,
        value: new Date(),
        fieldProp: { autofocus: '' }
    }
];

PopUpParameter.openPopUp(parameters, { size: 'sm', title: 'Alterar validade' })
    .result
    .then(function (result) {
        // result.DTVALIDADE
    });
```

O objeto de campo e um **field metadata do `sk-form`** — `type`/`fieldType`/`dataType`, `presentationType`, `size`, `enabled`, `visible`, `groupName` (agrupa campos no form), `fieldProp` (atributos repassados ao input). Mapeamento completo de tipo para input em [form.md](form.md) e [inputs.md](inputs.md).

O controller preenche defaults ao abrir: `presentationType = 'P'`, `description = label` quando so `label` veio, `value/visible/showInactives` quando ausentes.

### Resultado

Em ambas as formas o `result` e `{ [parameter.name]: parameter.value }`. A chave e o **`name`**, nao o `fieldName`.

---

## Gotchas

### 1. `.show()` retorna instancia, nao promise

```javascript
// ERRADO — instancia nao e thenable
PopUpParameter.builder().buildStringParameter('X', 'X', true).show().then(...);

// CERTO
PopUpParameter.builder().buildStringParameter('X', 'X', true).show().result.then(...);
```

### 2. Campo obrigatorio vazio lanca excecao, nao rejeita a promise

Ao clicar OK, o controller valida e faz `throw new Error('Existem parâmetros obrigatórios em branco.')`. Nao ha `.catch` a escrever: o popup continua aberto e o erro sobe pelo `ng-click`. Nao implemente validacao propria esperando rejeicao — para regra de negocio alem de "preenchido", valide no `.then` e reabra o popup, ou use `SanPopup` com `popup.closing`/`preventDefault`.

### 3. `showBtnDesconsiderar` resolve com **valores sentinela**, nao com vazio

O botao "Desconsiderar nao informados" fecha com `dismiss('no')`, que internamente chama `$popupInstance.success(...)` — ou seja, **cai no `.then` de sucesso**, ignorando obrigatorios. Campos vazios recebem `defaultValue` sentinela por tipo:

| Tipo | Sentinela |
|------|-----------|
| `I` / `T` | `-9999` |
| `F` | `-0.010101` |
| `D` | `'01/01/1800'` |
| `H` | `'01/01/1800 00:00'` |
| `S` | `'>:-:<'` |

Esses valores existem para o filtro personalizado montar criteria "ignore este parametro". Numa tela de addon eles **nao devem chegar ao backend** — ou nao habilite a opcao, ou filtre as sentinelas antes do `callService`. O tooltip do botao e fixo no framework (`'Somente para Filtros formados com "OU". '`), o que reforca: essa opcao e para filtro, nao para formulario comum.

### 4. Sem guarda, o popup abre duplicado

`PopUpParameter` nao serializa aberturas. Duplo clique no botao abre dois popups empilhados. O proprio framework guarda a instancia (`personalized-filter.controller.js`):

```javascript
if (angular.isDefined(self.popUpParameter)) {
    return;                      // ja existe popup aberto
}

self.popUpParameter = PopUpParameter.openPopUp(parameters, options);

self.popUpParameter.result.then(function (result) {
    self.popUpParameter = undefined;
    // ...
}, function () {
    self.popUpParameter = undefined;
});
```

### 5. `.options(obj)` **substitui** todas as opcoes

`.option(k, v)` acumula; `.options({...})` troca o objeto inteiro. Chamar `.options()` depois de `.title()` descarta o titulo. Prefira `.option()`.

### 6. Enter confirma o popup — e o bind nao e desfeito

O controller faz `KeyboardManager.bind('enter', success)` e nao chama `unbind` no `$destroy`. O listener e adicionado ao `document` e o registry `keyboardEvent['enter']` guarda so o ultimo bind, entao `KeyboardManager.unbind('enter')` remove apenas um. Consequencias praticas: Enter dentro do popup confirma (comportamento desejado), mas apos varias aberturas sobram listeners na pagina. Se a tela usa Enter para outra coisa, reavalie o atalho depois de abrir um `PopUpParameter`.

### 7. Combobox recebe objeto, nao array

```javascript
// ERRADO
.buildComboboxParameter('ANO', 'Ano', true, ['2024', '2025'])

// CERTO — { valorRetornado: rotuloExibido }
.buildComboboxParameter('ANO', 'Ano', true, { '2024': '2024', '2025': '2025' }, '2025')
```

### 8. `columns` e string no template

O template usa `columns="{{::options.columns}}"` com default `'1'`. `.columns(2)` funciona (interpolacao converte), mas o default e string — nao compare com `===`.

### 9. `entityPK` troca o `fieldName` durante a exibicao

Campos com `entityPK` (vindos de metadados hierarquicos) tem `fieldName` sobrescrito ao abrir e restaurado por `buildResultObject`. Ao montar parametros na mao, use `name` como chave estavel; nao dependa de `fieldName` no `.then`.

---

## Padroes de uso

### Coletar parametros antes de chamar o servico do addon

```javascript
function importarPlanejamento() {
    PopUpParameter.builder()
        .title('Selecione o ano')
        .size('sm')
        .buildComboboxParameter('ANO', 'Ano', true, self.anosDisponiveis, self.anoAtual)
        .show().result
        .then(function (result) {
            return ServiceProxy.callService('<addon>@PlanejamentoSP.importar', {
                ano: result.ANO
            });
        })
        .then(function () {
            self.dataset.refresh();
        });
}
```

### Reaproveitar valores atuais como default

```javascript
PopUpParameter.builder()
    .title('Dados de acesso')
    .columns(2)
    .height(180)
    .buildStringParameter('usuario', 'Usuario', true, info.user)
    .buildStringParameter('senha', 'Senha', true, info.pass)
    .buildIntegerParameter('porta', 'Porta', false, info.port)
    .show().result
    .then(aplicar);
```

### Campo de pesquisa (FK) dentro do popup

```javascript
PopUpParameter.builder()
    .title('Transferir OS')
    .buildSearchInputParameter('CODPARC', 'Parceiro', true, 'Parceiro', 'NOMEPARC')
    .show().result
    .then(function (result) {
        // result.CODPARC = PK escolhida
    });
```

`entityName` e o **`name` da `<instance>`** do dicionario de dados (mesma regra do `sk-entity-name`), servindo tanto para entidade nativa quanto para a do addon.

---

## Checklist de triagem

- [ ] `.then` nunca dispara? Faltou `.result` depois de `.show()`.
- [ ] `result` com `-9999` / `'01/01/1800'` / `'>:-:<'`? `showBtnDesconsiderar` habilitado — sentinela, nao valor real.
- [ ] Campo obrigatorio nao bloqueia? `required` precisa ser `true`/`'true'`; a validacao usa `StringUtils.toBoolean`.
- [ ] Popup duplicado? Guardar a instancia e limpar nos dois lados da promise.
- [ ] Chave do `result` `undefined`? Use `name`, nao `fieldName` nem `label`.
- [ ] Combobox vazio? `options` deve ser objeto `{ chave: rotulo }`.
- [ ] Titulo aparecendo como `PopupParameters.xxx`? Chave i18n inexistente no bundle — passe texto literal.
- [ ] Layout apertado? Ajuste `columns` e `height`; campos longos (`maxLength > 100`) viram textarea.
