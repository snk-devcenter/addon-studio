# sk-wizard — passo a passo

Container de steps navegavel com botoes proximo/anterior/concluir/cancelar, indicador visual, atalhos de teclado (setas), steps condicionais (`disabled`/`isVisible`), validacao por step e criacao lazy de templates.

Arquivos: wizard.directive.js, wizard.controller.js, steps/steps.directive.js, wizardbuttons.directive.js, wizardservice.service.js.

## Arquitetura

| Componente | Papel |
|---|---|
| `sk-wizard` | container transclude; mantem `steps[]`, `selectedStep`, `context` |
| `sk-step` | filho que se registra no wizard via `wizard.addStep($scope)`; template inline ou `sk-template-url` + `sk-controller` |
| `sk-step-next` / `sk-step-previous` / `sk-step-finish` / `sk-step-cancel` | directives-atributo em botoes; click chama o metodo homonimo do wizard |
| `SkWizardHandler` | service singleton com map `name → controller` para acesso inter-controller |

## Uso basico

```html
<sk-wizard name="meuWizard"
           current-step="ctrl.stepAtual"
           sk-on-finish="ctrl.onFinalizar()"
           sk-on-cancel="ctrl.onCancelar()"
           sk-context="ctrl.wizardCtx"
           sk-on-create="ctrl.onWizardCreate(wizard)"
           sk-creation-policy="lazy">

    <sk-step sk-title="Dados" sk-template-url="app/dados.html"
             sk-controller="DadosStepCtrl" sk-controller-as="sctrl">
    </sk-step>

    <sk-step sk-title="Confirmacao"
             sk-can-next="ctrl.podeAvancar"
             sk-validate-step="ctrl.validarConfirmacao($step)">
        <!-- conteudo inline via transclude -->
        <button sk-step-previous>Anterior</button>
        <button sk-step-finish sk-finalize="true">Concluir</button>
    </sk-step>

</sk-wizard>
```

No controller de um step (injetado via DI):

```javascript
angular.module('app').controller('DadosStepCtrl',
  ['$scope', '$wizard', '$step', '$stepEventBus',
  function($scope, $wizard, $step, $stepEventBus) {
    $step.onEnterStep = function() { /* ... */ };
    $step.onExitStep  = function() { /* ... */ };
    $step.setCanNext(false);   // bloqueia avanco ate validar
  }]);
```

## Bindings do `sk-wizard`

| Binding | Tipo | Proposito |
|---|---|---|
| `current-step` | `=` | **titulo** do step corrente (nao indice); two-way |
| `sk-on-finish` | `&` | callback final |
| `sk-on-cancel` | `&` | callback cancelar |
| `sk-on-step-change` | `&?` | `{$step, $index}` a cada mudanca |
| `sk-hide-indicators` | `=` | oculta barra de progresso |
| `sk-hide-btn-cancel` | `=` | oculta botao cancelar |
| `sk-disable-key-down` | `=?` | desliga navegacao por setas |
| `edit-mode` | `=` | marca todos os steps habilitados como `completed` |
| `sk-context` | `=?` | objeto compartilhado; default `{}` |
| `name` | `@` | chave no `SkWizardHandler` |
| `sk-on-create` | `&?` | `{wizard: self}` no init |
| `sk-creation-policy` | `@?` | `lazy` ou qualquer outro (default nao-lazy) |
| `sk-intercept-visible-step` | `=?` | usa `$step.isVisible()` para toggar `disabled`; muda ordem de `onExitStep` |
| `sk-using-max-height` | `=?` | flag de layout |

## Bindings do `sk-step`

| Binding | Tipo | Proposito |
|---|---|---|
| `sk-title` | `@` | titulo e chave para `current-step`/`goToByName` |
| `sk-template-url` | `@` | template do conteudo (alternativa ao transclude) |
| `sk-controller` | `@` | controller injetado; recebe `$wizard`, `$step`, `$stepEventBus` |
| `sk-controller-as` | `@` | alias no scope |
| `sk-can-next` / `sk-can-previous` | `=?` | default `true` |
| `sk-disabled` | `=?` | esconde do fluxo |
| `sk-finalize` | `=?` | marca como step final (libera `finish()`) |
| `sk-completed` | `=?` | flag interna |
| `sk-hide-previous` / `sk-hide-next` / `sk-hide-finish` | `=?` | oculta botao respectivo |
| `sk-validate-step` | `&?` | chamada no `next()`, recebe `{$step}` |
| `sk-event-bus` | `=?` | injetado como `$stepEventBus`; default `new EventBus()` por step |
| `sk-creation-policy` | `@?` | override do wizard |
| `sk-cancel-label` / `sk-previous-label` / `sk-next-label` / `sk-finish-label` | attr | i18n labels |

## API `$step` (injetada no controller do step)

| Metodo | Proposito |
|---|---|
| `setCanNext(val)` | **atualiza `canNext` E `completed`** (os dois) |
| `getCanNext()` / `getCanPrevious()` / `getCanFinish()` | getters |
| `setCanPrevious(val)` / `setCanFinish(val)` | setters |
| `setEnabled(val)` | inverte para `disabled` |
| `hidePrevious/hideNext/hideFinish(val)` | toggla visibilidade |
| `validateStep()` | executa `sk-validate-step` |
| `isStepsCompleted()` | delega para wizard |
| `onEnterStep` / `onExitStep` / `isVisible` | **default `angular.noop`** — consumidor sobrescreve |
| `wizardContext` | referencia ao `sk-context` |

## API do wizard (via `sk-on-create`, `SkWizardHandler.wizard(name)`)

| Metodo | Proposito |
|---|---|
| `next()` | valida `canNext`, chama `validateStep`, marca `completed=true`, avanca ou `finish()` |
| `previous()` | volta respeitando `canPrevious` |
| `finish()` | so se `getCanFinish()` truthy |
| `cancel()` | dispara `onCancel` |
| `goTo(step, fromAddStep?)` | navega para referencia direta do step |
| `goToByName(nameOrIndex, {forceDisabled, resetCompleted})` | navega por titulo ou indice |
| `getStepByName(nameOrIndex)` | retorna o `$step` da API publica |
| `isStepsCompleted()` | true se cada step e `completed` OU `finalize` |
| `previou()` | **typo**: retorna se o ultimo `goTo` foi "para tras" (direcao), nao navega |
| `isLazy()` | consulta creationPolicy |
| `currentStepNumber()` | indice 1-based do step selecionado entre os habilitados |
| `getStepsContainerElement()` | referencia DOM `.steps` |

## Ciclo

```
sk-step link
  → wizard.addStep(scope)
  → se 1o habilitado: goTo(step, /*fromAddStep*/ true)

creationPolicy=all
  → loadTpl imediatamente (template ou transclude)
creationPolicy=lazy
  → $watch('created') — loadTpl so quando goTo marca created=true

next()
  if (!$step.getCanNext()) return;
  $step.validateStep();
  if (interceptVisibleStep) $step.onExitStep();
  completed = true;
  goTo(next) || finish();

goTo(step)
  unselectAll();
  setSelectedStep → onExitStep (prev) + onEnterStep (novo)
  selected = true;
  $emit('wizard:stepChanged', {step, index});
  onStepChange({$step, $index});
  DomUtil.scrollTo(stepsElem, 0);
```

## Atalhos e service

- **Setas** `←`/`→` no `$document` disparam `previous()`/`next()` (desde que `canPrevious`/`canNext` e nao `disableKeyDown`).
- `SkWizardHandler.wizard('nome').goTo(...)` — acesso a partir de outro controller quando o wizard tem `name`.

## Gotchas

1. **`current-step` e titulo, nao indice**. O `$watch` em `currentStep` procura `ArrayUtils.findWhere(getEnabledSteps(), {title: $scope.currentStep})`. Passar numero vira uma busca por titulo numerico — so funciona se o step nao tem `sk-title` e o `title = wizard.getNextStepNumber()` ja fez cast para string coincidente.

2. **`edit-mode=true` marca TODOS os steps como `completed`**. Watcher em `[editMode, steps.length]` itera `getEnabledSteps()` setando `completed=true` a cada adicao de step. Util em edicao de registro ja salvo, mas pula validacoes — usar com cuidado.

3. **`setCanNext(val)` muda `canNext` E `completed`**. Um `setCanNext(false)` marca o step como nao-completo. Se o intuito e so bloquear avanco mantendo completude visual, o efeito colateral surpreende.

4. **`canEnterStep` e `canExitStep` existem mas nao sao chamados**. Estao definidos no controller mas nao sao invocados em nenhum caminho — codigo morto. `canenter`/`canexit` nao tem efeito. Usar `sk-can-next`/`sk-can-previous` + `sk-validate-step`.

5. **`creationPolicy=lazy` atrasa o template, nao o `$scope` do step**. O `sk-step` roda seu link (registra no wizard, publica `$step`) imediatamente. So o `loadTpl` (compile do template/transclude) fica pendente ate `created=true` (setado no primeiro `goTo`). Step nunca visitado nunca compila.

6. **Controller do step so roda apos o `loadTpl`**. Em `lazy`, servicos que precisam se inscrever no init (ex.: listeners globais) nao rodam para steps nao visitados. Se a logica precisa estar viva antes, mover para o controller do wizard ou usar `creationPolicy=all`.

7. **Multiplos wizards na mesma pagina acumulam `$document keydown`**. Cada `sk-wizard` binda seus propios handlers. Seta pressionada e processada por todos — wizards escondidos ainda respondem. `sk-disable-key-down` afeta so o wizard onde esta setado.

8. **`goToByName(titulo)` com step disabled retorna undefined**. Sem `{forceDisabled: true}`, `enabledSteps.filter(...)` nao acha o step desabilitado; `stepTo = undefined` e o `goTo(undefined)` lanca `Cannot set property 'created' of undefined`. Passar `{forceDisabled: true}` ou habilitar antes.

9. **`name` duplicado sobrescreve sem warn**. `SkWizardHandler.addWizard(name, wizard)` faz `wizards[name] = wizard` — segundo wizard toma o nome silenciosamente, `wizard(name)` passa a retornar o mais novo.

10. **`isStepsCompleted()` aceita `finalize` como completo**. Um step marcado `sk-finalize=true` mas nao visitado ainda conta como ok. Se o wizard e disparado por `finish` via API externa, todos os steps anteriores ainda precisam estar `completed`.

11. **`sk-event-bus` default e um `new EventBus()` por step**. Sem bus compartilhado, steps nao se comunicam. Para pub/sub entre steps, passar a mesma instancia via `sk-event-bus`.

12. **`previou()` (typo) nao navega — retorna direcao**. Faz parte da API mas o nome sugere acao; na verdade devolve boolean indicando se o ultimo `goTo` foi "para tras". Navegacao e `previous()`.

13. **`sk-intercept-visible-step` muda a ordem de `onExitStep`**. Sem ele, `setSelectedStep` chama `oldStep.$step.onExitStep()` automaticamente. Com ele, `next()` precisa chamar explicitamente — e `goTo()` direto pula. Consumidor que seta `onExitStep` esperando execucao automatica em ambos modos fica surpreso.

14. **`DomUtil.scrollTo(_stepsElem, 0)` em cada `goTo`**. Container reseta scroll ao mudar step. Se o conteudo do step foi rolado manualmente, o scroll some — normal em wizards, mas pode atrapalhar fluxos onde o step e longo e o usuario quer pre-visualizar os proximos pelo mesmo container.

15. **`sk-step.title` cai em `wizard.getNextStepNumber()` quando omitido**. Retorna `steps.length`, ou seja, uma string numerica que colide com `currentStep` se outro step tem `sk-title="2"`. Em wizards dinamicos que removem/adicionam steps, a numeracao default pode referir ao step errado.

16. **`firstRun` flag trata primeiro `goTo` diferente**. Adicionar novos steps em runtime apos o primeiro render usa o branch "else" — `_wizardPreviou` e calculado a partir do `selectedStep` corrente, o que pode gerar direcao incorreta se o novo step foi inserido no meio da lista.

17. **`setSelectedStep` com `fromAddStep=true` pula `onExitStep` do step anterior**. Util no primeiro `goTo` (nao ha step anterior real), mas se o primeiro step dispara side effects que precisam de limpeza em re-render (SPA troca de view), o `onExitStep` nao roda.
