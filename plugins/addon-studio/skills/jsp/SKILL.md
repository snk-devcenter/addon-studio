---
name: jsp
description: Painel operacional, dashboard denso, mapa ou tela de leitura em que **você escreve o HTML na mão** e o servidor renderiza — servidos como `.jsp` pelo próprio add-on, com a taglib `sankhyaUtil` (`<snk:query>` para SQL no render, `<snk:load/>` para a API JavaScript de tela). Use ao criar, revisar ou depurar arquivo em `webapp/jsp/`; ao instalar o suporte a `.jsp` num add-on que ainda não tem (TLD, taglibs, dependências do `:vc`); ao registrar a tela no menu do dicionário com `<ui url="/$ctx/jsp/...">`; ao consumir SQL de dentro de um `.jsp` por `<snk:query>` ou `executeQuery`; ao navegar entre telas com `openApp`/`openLevel`; ao portar para o add-on gadget do `Dashboard.xhtml5` nativo, que rodava por zip + insert nas tabelas de dashboard; ao subir uma ilha AngularJS dentro de um `.jsp` já existente — carregar `angular` + `snk.js` sem o `Html5Launcher` para usar `ServiceProxy`, `MessageUtils`, `SanPopup` ou `SkWorkspace`, ou abrir popup nativo do framework, numa página que continua server-side; ou quando a tela `.jsp` abre mas o JavaScript não roda — "Método não disponível aqui", `contextPage is not defined`, `[$injector:nomod] ui.grid`, `workspace`/`VSS is not defined`, ou o código JS surge como texto na página. NÃO usar para tela AngularJS/`sk-*` em `webapp/html5/` que consome endpoint do add-on — isso é `sankhya-js`, que é também o destino da tela nova que já ia carregar o stack Angular completo (`.xhtml5` pelo `Html5Launcher`); nem para tela que o Sankhya monta a partir da tabela sem HTML próprio — isso é `data-dictionary`.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Tela `.jsp` — Addon Studio 2.0

Um `.jsp` é servido pelo contexto web do próprio add-on (módulo `:vc`) e renderiza HTML no
servidor. Diferente da tela `sankhya-js`, o default não tem AngularJS, dataset nem componente
`sk-*`: o que existe é HTML, JavaScript solto e uma taglib que dá acesso a SQL e à API de
navegação do Sankhya. Quando isso não basta, dá para subir uma **ilha Angular** com o
`snk.js` da plataforma dentro da própria página (§5) — sem virar tela `sankhya-js`.

Vale quando o layout é o produto — painel operacional, mapa, gráfico denso, tela de leitura
com muitas visões — ou quando se está trazendo para o add-on um gadget que rodava no
`Dashboard.xhtml5`. Para cadastro CRUD, `data-dictionary` ou `sankhya-js` entregam mais com
menos.

---

## 1. O que o add-on precisa ter

Suporte a `.jsp` não vem pronto: são cinco arquivos e duas dependências, todos no módulo
`:vc`. Os templates de [`templates/`](templates/) são cópia funcional — o que muda em cada
projeto é o `package`.

| Onde | Arquivo | Papel |
|:-----|:--------|:------|
| `webapp/WEB-INF/tld/` | `sankhyaUtil.tld` | Declara `<snk:query>` e `<snk:load/>`. O `<tag-class>` precisa bater com o `package` real das classes. |
| `src/main/java/.../taglibs/` | `QueryTag.java` | Implementa `<snk:query>` — executa SQL no render. |
| | `ResultImpl.java` | Resultado do `QueryTag` (`javax.servlet.jsp.jstl.sql.Result`). |
| | `Period.java` | Suporte a parâmetro de período nomeado do `QueryTag`. |
| | `HTMLGadgetSetupTag.java` | Implementa `<snk:load/>` — injeta a API JavaScript. |
| `webapp/jsp/<Pasta>/` | `<Tela>.jsp` | A tela. Ver [`templates/Tela.jsp`](templates/Tela.jsp). |

O `:vc` normalmente recebe só `sdk-sankhya`/`javaee-api`; as taglibs importam JAPE e
modelcore, então precisam entrar como `compileOnly` (o Wildfly já provisiona em runtime,
empacotar duplicaria jar):

```groovy
dependencies {
    compileOnly 'br.com.sankhya:libs:master'
    compileOnly 'br.com.sankhya:mge-modelcore:<versao-da-plataforma>'
}
```

O diretório das taglibs é escolha do projeto. O que não é negociável: o `<tag-class>` da TLD
e o `package` das classes têm de ser a mesma FQN, senão o JSP falha no load da tag.

---

## 2. Registro no menu

Sem entrada no menu a tela existe mas não é alcançável — e, mais importante, ela precisa ser
aberta **dentro do workspace** para que `openApp` tenha destino (ver §4).

No XML do dicionário, dentro de `<menu>` ou de um `<folder>`:

```xml
<ui id="br.com.sankhya.<addon>.<idtela>"
    resourceId="br.com.sankhya.<addon>.<idtela>"
    url="/$ctx/jsp/<Pasta>/<Tela>.jsp"
    description="Minha Tela" />
```

`$ctx` é o contexto web do add-on — o `rootProject.name` do `settings.gradle`. Estrutura de
menu, pastas e encaixe em pasta nativa: skill `data-dictionary`.

Quando a pasta tem várias views (§4, `openLevel`), **só o entrypoint entra no menu**. As
demais são alcançadas por navegação; registrá-las duplicaria portas de entrada para o que é
um fluxo só.

---

## 3. Trazer dados — duas rotas que não competem

**`<snk:query>` — no servidor, durante o render.** A página nasce com os dados dentro.
Simples e sem ida extra ao servidor; em compensação, só muda com reload.

```jsp
<snk:query var="registros" maxRows="50">
SELECT CODPARC, NOMEPARC FROM TGFPAR ORDER BY CODPARC
</snk:query>
```

O resultado é um `javax.servlet.jsp.jstl.sql.Result` no `pageContext`: `getRows()` devolve
`SortedMap[]` com chave case-insensitive, e `isLimitedByMaxRows()` diz se `maxRows` cortou.
Atributos, parâmetros nomeados e datasource: [`references/querytag.md`](references/querytag.md).

**`executeQuery` — no cliente, depois do load.** Permite recarregar sem sair da página,
paginar e reagir a filtro. Custa uma requisição.

```js
executeQuery(sql, [], function (val) {
  var linhas = JSON.parse(val);   // string JSON, e todo valor vem como string
}, function (err) { /* ... */ });
```

O SQL costuma morar num `script type="text/plain"` na própria página, lido com `textContent`
— o browser não interpreta o bloco, e o SQL fica legível junto da tela em vez de concatenado
em JavaScript.

Contrato completo, formato da resposta e o teto de linhas:
[`references/gadget-api.md`](references/gadget-api.md).

---

## 4. A API que `<snk:load/>` injeta

Cinco funções globais. A tag tem de vir no `<head>`, **antes** de qualquer script que as use.

| Função | O que faz |
|:-------|:----------|
| `executeQuery(sql, params, ok, err)` | Executa SELECT. `ok` recebe **string** JSON (§3). |
| `openApp(resourceID, pkObject)` | Abre uma tela do Sankhya já posicionada num registro. |
| `openLevel(nivel, params)` | Navega para outra view da mesma pasta. |
| `refreshDetails(componentID, params)` | Recarrega a página. |
| `openPage(page, params)` | Abre URL externa em nova aba. |

**`openApp` depende do workspace.** A tela roda num iframe do workspace HTML5, e é ele quem
abre a tela de destino. O `pkObject` vai **inteiro e sem serializar**: a tela de destino o
recebe em `$scope.loadByPK` e posiciona o registro. A chave tem de ser o nome da coluna da PK.

```js
openApp('<resourceId da tela de destino>', {CODPARC: Number(cod)});
```

Consequência prática: abrindo o `.jsp` direto pela URL, fora do menu, `openApp` não tem para
onde ir. Não é defeito da tela — é falta do workspace em volta.

**`openLevel` é a navegação entre views da pasta.** Caminho relativo resolve ao lado do
`.jsp` atual, e os `params` viram query string, lidos no destino com `request.getParameter`.
Não confundir com o `pkObject` do `openApp`: ali quem interpreta é o dataset da tela nativa,
aqui quem lê é o `.jsp` que você escreveu.

---

## 5. Ilha Angular no `.jsp` — quando o HTML solto não basta

Um `.jsp` pode subir Angular e o `snk.js` da plataforma dentro dele, **sem passar pelo
`Html5Launcher`**. Isso destrava `ServiceProxy`, `MessageUtils`, `SanPopup` e `SkWorkspace`
— a mesma API das telas `sankhya-js` — numa página que continua sendo `.jsp`, com a taglib
e o `<snk:query>` funcionando ao lado.

**Quando isso se paga.** Quando o `.jsp` **já existe** e é grande demais para reescrever, ou
quando você quer só uma **ilha**: um popup nativo, uma chamada de serviço com loading e erro
tratados, um trecho reativo dentro de uma tela que continua server-side. **Tela nova não
entra aqui**: se ela vai carregar o stack Angular inteiro de qualquer jeito, ela devia ser
`.xhtml5` — o `Html5Launcher` já faz isso, é o caminho suportado, e não deixa 8 `<script>`
de caminho absoluto sob sua manutenção. Tier A se paga por **não reescrever**, não por ser
mais leve.

### Os 8 scripts, nesta ordem

O template nativo carrega ~35. O fecho mínimo são estes 8, e nenhum é decorativo — tirar
qualquer um quebra em **tempo de parse** do `snk.js`, com sintoma que não aponta para a causa.

| # | Script | Por que está aqui |
|:--|:-------|:------------------|
| 1 | `/mge/js/sf/sf.js` | `snk.js` chama `ftxt('pcsf')` em **tempo de parse** |
| 2 | `/mge/js/util/jquery-1.9.1.min.js` | `snk.js` roda `+function($){...}` em **tempo de parse** |
| 3 | `/mge/js/util/Base64.js` | global usada pelo `ServiceProxy` no caminho de erro |
| 4 | `/mge/scripts/vendors/angular/angular.js` | o framework |
| 5 | `/mge/scripts/vendors/moment/moment.min.js` | bloco `.config()` **eager** de `snk.core.util` |
| 6 | `/mge/scripts/vendors/numeral/numeral.min.js` | bloco `.config()` **eager** de `snk.core.util` |
| 7 | `/mge/scripts/vendors/translate/angular-translate.js` | `$translate`, injetado pelo `SanPopup` via `snk.i18n` |
| 8 | `/mge/scripts/vendors/ui-grid/ui-grid.modified.js` | **obrigatório mesmo sem grid nenhum** — ver abaixo |

E só então `/mge/scripts/snk.js`.

**Caminhos absolutos `/mge/...`.** Relativo resolve dentro do contexto do add-on e dá 404.

**`ui-grid` sem grid não é engano.** O `snk.js` tem um IIFE de topo de arquivo que faz
`angular.module('ui.grid')` na forma **getter**. Sem o vendor carregado antes, isso lança
`[$injector:nomod]` em tempo de parse, e tudo o que vem depois no bundle nunca registra —
medido, **204 de 1039 providers**. O erro visível mente: o dev vê
`Unknown provider: i18nProvider <- i18n <- MessageUtils <- ServiceProxy`, porque `snk.i18n`
é concatenado depois do ponto do estouro, e ninguém suspeita de grid lendo isso.
(`ui-grid.min.css` só é preciso se a tela for renderizar um grid de verdade.)

### As 5 globais que o `Html5Launcher` injeta

Um `.jsp` não tem nenhuma delas. **Declare antes do `<script src=".../snk.js">`**, não depois:

| Global | Quem lê | Quando estoura |
|:-------|:--------|:---------------|
| `workspace` | `SkWorkspace` (**construtor**) | ao injetar o serviço, mesmo sem navegar |
| `VSS` | `ServiceProxy.callService` | em **toda** chamada ao backend |
| `locale` | `SkI18nService` | no `setLang` |
| `i18nAll` | `SkI18nServiceLoader` | 1º `setLang`, dentro de `.run()` → `[$injector:modulerr]` |
| `i18nFramework` | `SkI18nServiceLoader` | idem |

O `SkI18nServiceLoader` **não recebe os bundles por injeção** — ele faz `angular.forEach`
lendo o escopo global. Popular a global antes do `angular.bootstrap` basta; não há `addBundle`
a fazer no `.run()`.

`workspace` resolve de `window.top`/`window.parent`, e pode ficar `undefined` — é o que
acontece abrindo o `.jsp` pela URL, fora do menu (§4). Declarar mesmo assim é o que impede o
`ReferenceError`; o que falta aí é o workspace em volta, não a global.

### CSS, nesta ordem

```html
<link rel="stylesheet" href="/mge/assets/vendors/bootstrap.min.css"/>
<link rel="stylesheet" href="/mge/assets/css/snk.min.css"/>
<link rel="stylesheet" href="tela.css"/>
```

**`bootstrap.min.css` não é opcional se a tela usa popup.** `.modal` e `.modal-backdrop`
tiram dele todo o posicionamento (`position:fixed`, `top/right/bottom/left`, `z-index`); o
`snk.min.css` só traz *override*. Sem bootstrap o popup renderiza em fluxo normal no fim do
`<body>`: existe no DOM, fecha no ESC, e não aparece na tela.

A contrapartida é real e vale dizer ao dono da tela: os dois são **baseline global** e
reestilizam a página inteira. O CSS da tela vem por último para que as regras dela vençam.

### Dependências do módulo

Fecho exato para `ServiceProxy` + `MessageUtils` + `SanPopup` + `SkWorkspace`:

```js
angular.module('<App>', [
  'snk.core.util',          // ServiceProxy, MessageUtils, Criteria, StringUtils, ObjectUtils
  'snk.core.workspace',     // SkWorkspace
  'snk.core.application',   // SkApplication (o SkWorkspace injeta)
  'snk.core.tour',          // SkTourService (o SanPopupStack injeta)
  'snk.components.popup',   // SanPopup
  'snk.components.button',  // ButtonThemes (o MessageUtils injeta)
  'snk.i18n'                // $translate + i18n
]);
```

`pascalprecht.translate` é o único módulo de vendor angular que esse fecho exige, e chega
por `snk.i18n`. **Não dependa do módulo guarda-chuva `snk`**: ele puxa datagrid e o bloco
inteiro de vendors — exatamente o que esta tela não carrega.

### Bootstrap manual, com gate de i18n

Nada de `ng-app`. Busque `/mge/assets/i18n/<locale>/_Framework.json` (40 KB, as 14 chaves
`Geral.*` que o `MessageUtils` usa nos labels) e **só então** chame `angular.bootstrap`, com
um `.run()` que faz `SkI18nService.setLang(locale)`. Sem o gate, o popup abre com a chave
crua no lugar do label.

Três coisas que custam deploy se forem ignoradas:

- **`angular.bootstrap(document, ...)`**, não numa `div` — o `SanPopup` pendura o popup no
  `<body>`, fora da app.
- **`try/catch` em volta do `bootstrap`.** Dentro de uma cadeia de promises o erro morre
  como *unhandled rejection*: a tela fica muda, só com os `{{ }}` crus e o console limpo.
  Escreva o erro na página.
- **Não reaproveite o `launcher.js`.** Ele monta a URL do bundle da tela em caminho
  **relativo**, o que dá 404 fora da raiz do contexto. Os bundles do framework, ao
  contrário, são absolutos — dá para buscar direto.

Template pronto: [`templates/TelaAngular.jsp`](templates/TelaAngular.jsp). A API destravada,
o contrato de cada serviço e a tabela sintoma → causa:
[`references/angular-no-jsp.md`](references/angular-no-jsp.md).

---

## 6. Armadilhas

**Custom tag dentro de comentário JavaScript é executada.** O JSP não conhece comentário JS.
Uma tag escrita em `// ...` ou `/* ... */` roda na tradução, e se ela emitir
`<script>...</script>` — caso do `<snk:load/>` — esse `</script>` fecha o bloco da página
antes da hora: o JS seguinte vira **texto visível** e as funções definidas depois do corte
nunca existem. O sintoma engana, porque a parte server-side continua renderizando certo.
Em comentário, escreva o nome da tag sem os sinais. Comentário JSP (`<%-- --%>`) é removido
na tradução e não tem esse problema.

Duas guardas baratas antes de entregar um `.jsp`: contar `<script` contra `</script>`, e
casar `<script>(.*?)</script>` procurando `<snk:` dentro.

**Caractere fora do latin-1 vira `?`.** Vale para `─`, `…` e afins, mesmo com o `.jsp` em
UTF-8 — use ASCII em arte de comentário. Acentuação normal de texto (`ç`, `ã`, `é`) funciona.

**`executeQuery` devolve string, não objeto** — e todo valor vem como string, inclusive
coluna numérica. Converta no cliente.

**Assinatura preservada não significa comportamento preservado.** Ao portar um gadget, as
cinco funções existem, mas `openLevel` e `refreshDetails` apontavam para componentes do
dashboard. Sem ele, precisam de destino novo — a página, uma URL — ou viram inertes.

---

## 7. Anti-patterns

| Anti-pattern | Correção |
|:-------------|:---------|
| Tag `<snk:...>` dentro de comentário ou string JavaScript | Escrever o nome sem os sinais (§6) |
| `<snk:load/>` depois dos scripts que usam a API | A tag vai no `<head>`, antes de tudo |
| Serializar o `pkObject` do `openApp` | Passar o objeto inteiro — o destino o lê em `loadByPK` |
| Servlet próprio para rodar o SQL do `executeQuery` | O serviço nativo já faz isso (`references/gadget-api.md`) |
| Registrar toda view da pasta no menu | Só o entrypoint; o resto é `openLevel` |
| `<tag-class>` da TLD divergente do `package` real | Mesma FQN nos dois |
| Cadastro CRUD como `.jsp` | `data-dictionary` ou `sankhya-js` |
| Tela nova nascendo `.jsp` só para carregar o stack Angular (§5) | Tela nova com stack completo é `.xhtml5` — `sankhya-js` |
| `ng-app` na ilha Angular | Bootstrap manual, depois do gate de i18n (§5) |
| Depender do módulo `snk` na ilha Angular | Só o fecho de 7 módulos (§5) — `snk` puxa datagrid e todos os vendors |
| Carregar só os vendors "que a tela usa" | Os 8 são o mínimo; `ui-grid` é exigido sem grid (§5) |
| `<script src="scripts/snk.js">` (relativo) | Absoluto `/mge/...` — relativo resolve no contexto do add-on e dá 404 |

---

## 8. Checklist: nova tela `.jsp`

1. [ ] TLD em `webapp/WEB-INF/tld/` e as 4 classes no `:vc`, com `<tag-class>` batendo no `package`.
2. [ ] `compileOnly` de `libs` e `mge-modelcore` no `vc/build.gradle`.
3. [ ] `.jsp` em `webapp/jsp/<Pasta>/`, com `<snk:load/>` no `<head>`.
4. [ ] `<ui url="/$ctx/jsp/<Pasta>/<Tela>.jsp">` no dicionário — só para o entrypoint.
5. [ ] Carga escolhida: `<snk:query>` (render) ou `executeQuery` (sob demanda), ou as duas.
6. [ ] `openApp` recebendo `pkObject` com a chave da PK, sem serializar.
7. [ ] `<script>` balanceado e sem `<snk:` dentro.
8. [ ] Só ASCII em arte de comentário.
9. [ ] Abrir **pelo menu**, não pela URL — é o que dá workspace ao `openApp`.

Se a tela tiver ilha Angular (§5), some a estes:

10. [ ] Os 8 `<script>` na ordem, em caminho absoluto `/mge/...`, e `snk.js` por último.
11. [ ] `ui-grid.modified.js` presente, mesmo sem grid na tela.
12. [ ] As 5 globais (`workspace`, `VSS`, `locale`, `i18nAll`, `i18nFramework`) declaradas **antes** do `snk.js`.
13. [ ] CSS: `bootstrap.min.css` → `snk.min.css` → CSS da tela.
14. [ ] Fecho de 7 módulos, sem depender de `snk`.
15. [ ] `_Framework.json` buscado antes do `angular.bootstrap(document, ...)`, com `try/catch` que escreve o erro na página.

---

## Referências

- [`references/gadget-api.md`](references/gadget-api.md) — as cinco funções em detalhe, o serviço que executa a query, formato da resposta e teto de linhas
- [`references/querytag.md`](references/querytag.md) — `<snk:query>`: atributos, `Result`, parâmetros nomeados, datasource
- [`references/angular-no-jsp.md`](references/angular-no-jsp.md) — `ServiceProxy`, `MessageUtils`, `SanPopup`, `SkWorkspace` na ilha Angular, e a tabela sintoma → causa
- [`templates/`](templates/) — TLD, as 4 taglibs, um `.jsp` funcional e o [`TelaAngular.jsp`](templates/TelaAngular.jsp) da ilha, prontos para copiar

## Skills relacionadas

- `data-dictionary` — registro no menu, `<folder>`, pasta nativa
- `sankhya-js` — tela HTML5 do add-on (AngularJS, `sk-*`), a alternativa quando o caso é CRUD ou quando a tela nova já ia carregar o stack completo; é lá que mora o contrato de `ServiceProxy`, `MessageUtils` e `SanPopup`
- `controller` — o `@Controller(serviceName = "<Nome>SP")` que a ilha Angular chama por `ServiceProxy` com o prefixo `<addon>@`
- `database` — objetos de banco que a tela consulta
- `build` — deploy do add-on e do contexto web
- `encoding` — ISO-8859-1 nos `.java`/`.xml` das taglibs
