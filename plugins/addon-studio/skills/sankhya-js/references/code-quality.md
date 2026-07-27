# sankhya-js - Qualidade de codigo em telas

Praticas de qualidade para telas AngularJS 1.x do `sankhya-js`: padroes estruturais, performance de digest, seguranca e documentacao. Use ao escrever tela nova e em code-review.

Este arquivo **nao** repete os anti-padroes operacionais ja cobertos em `anti-patterns.md` (`$timeout`/polling para esperar assincrono, desregistro de listeners, popup duplicado de erro, mutacao direta de `record[i]`, etc.) - quando o tema for esse, va direto la. Aqui o foco e o que falta: como estruturar, como nao matar o digest, como nao vazar dado e como documentar.

---

## 1. Padroes de codigo

### Early return em vez de aninhamento profundo

Saia cedo dos casos invalidos. Evita piramide de `if` e deixa o caminho feliz no nivel zero de indentacao.

```javascript
function processarLinha() {
    if (!self.ds || self.ds.isEmpty()) { return; }

    var row = self.ds.getCurrentRow();
    // caminho feliz, sem aninhar
}
```

### Separacao de responsabilidades

Cada camada tem um papel. Nao misture:

- **Renderizacao** - directive/template (`*.directive.js`, `*.html`). Sem regra de negocio no template.
- **Estado e logica de tela** - controller. Coordena, nao fala HTTP cru nem monta SQL.
- **Acesso a servico/regra** - service (`*.service.js`) registrado em `angular.module('<Tela>App')`. Service usado por mais de uma tela vai para `html5/commons/` (ver `patterns.md`, Padrao 11).

Controller que monta payload, chama servico, trata erro **e** manipula DOM e candidato a virar god screen (secao 5).

### DRY - procure o utilitario antes de reescrever

Antes de escrever validacao, formatacao ou conversao na mao, procure o equivalente nos utilitarios do framework (modulo `snk.core.util`: `StringUtils`, `DateUtils`, `NumberUtils`, `ArrayUtils`, `ObjectUtils`, `Base64`, ...). Reescrever `formataData`, `padLeft`, `trim`, escape de HTML, etc., duplica codigo que o framework ja testou e mantem. Assinaturas e armadilhas: [utils.md](utils.md).

```javascript
// Ruim: reimplementar formatacao de data
var dia = ('0' + d.getDate()).slice(-2);
var mes = ('0' + (d.getMonth() + 1)).slice(-2);
var txt = dia + '/' + mes + '/' + d.getFullYear();

// Bom: usar o util do framework (ver utils.md)
var txt = DateUtils.formatDate(d, DateUtilsConstants.DEFAULT_DATE_FORMAT);
```

### Escopo de variavel

Declare no menor escopo possivel. Nao pendure estado de uma requisicao especifica em singleton/service compartilhado entre telas - service no AngularJS e singleton, e dois usuarios da mesma tela passam a ler/escrever o mesmo campo.

```javascript
// Ruim: estado de tela vivendo no service singleton
angular.module('<Tela>App').service('MinhaSvc', function() {
    this.nunotaAtual = null; // vaza entre telas/abas
});

// Bom: estado fica no controller; o service recebe por parametro
ServiceProxy.callService('<addon>@MeuServicoSP.metodo', { nunota: { $: nunota } });
```

---

## 2. Performance

### O custo dominante e o ciclo de DIGEST

No AngularJS 1.x cada `$watch`/binding e reavaliado a cada ciclo de digest, e o digest roda muitas vezes por interacao. Duas regras:

- Nao coloque expressao cara em binding (`{{ calculaTotalPesado() }}` em `ng-repeat`). Calcule uma vez no controller e exponha o resultado.
- Nao renderize lista enorme sem virtualizacao/paginacao - milhares de `$watch` por linha travam a tela.

### Nao espere estado com timer

Polling com `setInterval`/`$timeout` para "esperar" dataset ou servico nao so quebra (ver `anti-patterns.md`), como adiciona carga ao digest a cada tick. Use listener/promise.

### Rede

- **Nao trave a UI a toa**: chamada de background usa `ignoreLoadingBar: true` (ver `patterns.md`, Padrao 2).
- **Evite N chamadas em laco**: prefira um servico que recebe a lista, ou agrupe com `$q.all([...])`.

```javascript
// Ruim: N requests em laco
parceiros.forEach(function(p) {
    ServiceProxy.callService('<addon>@MeuServicoSP.metodo', { cod: { $: p } });
});

// Bom: $q.all, ou um servico que recebe a lista
$q.all(parceiros.map(function(p) {
    return ServiceProxy.callService('<addon>@MeuServicoSP.metodo', { cod: { $: p } });
})).then(consolidar);
```

- **`MetadataProvider` em laco**: ele nao cacheia por default (ver `gotchas.md`). Busque o metadado uma vez e reutilize; nao chame dentro de loop nem por linha de grid.
- **Pagine grids grandes**: nao materialize milhares de registros no cliente.

### Listener acumulado tambem e performance

Listener nao desregistrado (ver `anti-patterns.md`) nao e so risco de bug: cada listener orfao multiplica o trabalho a cada disparo do evento. Em tela reaberta varias vezes, o mesmo handler roda 2x, 3x, N vezes.

---

## 3. Seguranca

### XSS - nao injete HTML nao confiavel

O app ja inclui `ngSanitize`. Prefira binding seguro (`ng-bind`, interpolacao `{{ }}`) que escapa automaticamente. So use `ng-bind-html`/`$sce` com conteudo **sanitizado**. Nunca concatene entrada do usuario em HTML cru.

```javascript
// Ruim: HTML cru com entrada do usuario
elemento.innerHTML = '<b>' + nomeDigitado + '</b>';

// Bom: binding escapa por padrao
$scope.nome = nomeDigitado; // no template: <b ng-bind="nome"></b>
```

### Nao monte SQL no frontend

O cliente envia parametros (`{ $: valor }`) ao servico; a query e responsabilidade do backend, que deve parametrizar (anti-SQL injection - skills `repository` e `entity`). String de WHERE concatenada no JS e bug e brecha ao mesmo tempo.

### Exposicao de servico e decisao do backend

Quem decide se um servico e acessivel e o backend, no `@Controller` do modulo `-model` (skill `controller`). Nao assuma que "so o frontend chama esse servico" protege algo - o endpoint e alcancavel diretamente.

### Nao existe gate automatico

O build do addon nao roda lint nem minifica o `.js` da tela: o arquivo vai como esta para o servidor e erro de sintaxe so aparece no navegador. Rode o lint do editor antes de commitar e abra a tela uma vez apos o deploy — nao confie em `gradle deployAddon` para acusar problema de frontend.

---

## 4. Comentarios e documentacao

### Comente o porque, com rastreabilidade

Comentario bom explica regra fiscal/financeira/UX nao obvia e aponta o chamado. Nao comente o obvio; remova codigo morto dentro do escopo que esta mexendo.

```javascript
// Chamado #0000 - aliquota de ICMS-ST nao entra na base quando UF origem = destino
if (ufOrigem === ufDestino) {
    base = base - valorST;
}

// Chamado #0000 - regra de negocio exige confirmacao antes de cancelar nota faturada
```

### Documente o contrato de diretiva e service

Nao ha gerador de documentacao no addon, mas diretiva ou service reusado por outras telas precisa do contrato escrito no proprio arquivo: atributos de scope, eventos emitidos e o que os handlers recebem.

```javascript
/**
 * <addon-meucomp> — exibe X e emite `onChange` quando o usuario altera o valor.
 *
 * @param {=} value     Valor exibido (two-way binding).
 * @param {&} onChange  Disparado na alteracao; recebe `{ value }`.
 */
angular.module('<Tela>App')
  .directive('addonMeucomp', [function() {
    return { restrict: 'E', scope: { value: '=', onChange: '&' } };
  }]);
```

---

## 5. God screens - divida tecnica, NAO modelo a imitar

Telas de milhares de linhas existem tanto no produto quanto em addons antigos, e existem por historia, nao por design. Sao alertas, nao referencia. Sinal de alerta pratico: `<Tela>.js` passando de ~500 linhas ou concentrando payload, chamada de servico, tratamento de erro e manipulacao de DOM no mesmo controller.

Ao precisar mexer numa dessas:

- Nao aumente o tamanho sem necessidade real.
- Extraia services/helpers coesos do trecho que voce esta tocando, em vez de empilhar mais um metodo no monolito.
- **Jamais** altere fluxo fiscal ou financeiro sem teste manual de regressao - o custo de um erro aqui e nota emitida errada ou lancamento financeiro incorreto.

---

## Checklist de qualidade

- [ ] Casos invalidos saem por early return; caminho feliz sem aninhamento profundo?
- [ ] Renderizacao, logica de tela e acesso a servico em camadas separadas?
- [ ] Procurou util do framework antes de reescrever validacao/formatacao?
- [ ] Estado de requisicao fora de service singleton compartilhado?
- [ ] Sem expressao cara em binding nem lista enorme sem paginacao?
- [ ] Sem N chamadas em laco (agrupou ou usou `$q.all`)?
- [ ] `MetadataProvider` buscado uma vez, nao em laco?
- [ ] HTML do usuario via binding seguro, nunca concatenado cru?
- [ ] SQL fica no backend; frontend so manda `{ $: valor }` e `serviceName` com prefixo `<addon>@`?
- [ ] Lint do editor limpo e tela aberta no navegador apos o deploy (o build nao acusa erro de JS)?
- [ ] Comentario aponta o porque e o chamado/ticket?
- [ ] Diretiva/service reusado por outra tela com contrato documentado no arquivo?
- [ ] Nao engordou tela gigante; extraiu helper; testou regressao de fluxo fiscal/financeiro?
