---
name: jsp
description: Tela `.jsp` servida pelo próprio add-on, com a taglib `sankhyaUtil` (`<snk:query>` para SQL server-side e `<snk:load/>` para a API JavaScript de tela). É o caminho para dashboard denso, tela de leitura com layout próprio (mapa, gráfico, painel operacional) e para portar gadget do Dashboard nativo, que rodava por zip + insert nas tabelas de dashboard. Use ao criar, revisar ou depurar arquivo em `webapp/jsp/`; ao instalar o suporte a `.jsp` num add-on que ainda não tem (TLD, taglibs, dependências do `:vc`); ao registrar a tela no menu do dicionário com `<ui url="/$ctx/jsp/...">`; ao consumir SQL de dentro de um `.jsp` por `<snk:query>` ou `executeQuery`; ao navegar entre telas com `openApp`/`openLevel`; ao migrar gadget do `Dashboard.xhtml5` para tela standalone; ou quando a tela abre mas o JavaScript não roda, aparece "Método não disponível aqui", `contextPage is not defined`, ou o código JS surge como texto na página. NÃO usar para tela AngularJS/`sk-*` em `webapp/html5/` — isso é `sankhya-js`; nem para tela que o Sankhya monta a partir da tabela sem HTML próprio — isso é `data-dictionary`.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Tela `.jsp` — Addon Studio 2.0

Um `.jsp` é servido pelo contexto web do próprio add-on (módulo `:vc`) e renderiza HTML no
servidor. Diferente da tela `sankhya-js`, não há AngularJS, dataset nem componente `sk-*`:
o que existe é HTML, JavaScript solto e uma taglib que dá acesso a SQL e à API de navegação
do Sankhya.

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

## 5. Armadilhas

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

## 6. Anti-patterns

| Anti-pattern | Correção |
|:-------------|:---------|
| Tag `<snk:...>` dentro de comentário ou string JavaScript | Escrever o nome sem os sinais (§5) |
| `<snk:load/>` depois dos scripts que usam a API | A tag vai no `<head>`, antes de tudo |
| Serializar o `pkObject` do `openApp` | Passar o objeto inteiro — o destino o lê em `loadByPK` |
| Servlet próprio para rodar o SQL do `executeQuery` | O serviço nativo já faz isso (`references/gadget-api.md`) |
| Registrar toda view da pasta no menu | Só o entrypoint; o resto é `openLevel` |
| `<tag-class>` da TLD divergente do `package` real | Mesma FQN nos dois |
| Cadastro CRUD como `.jsp` | `data-dictionary` ou `sankhya-js` |

---

## 7. Checklist: nova tela `.jsp`

1. [ ] TLD em `webapp/WEB-INF/tld/` e as 4 classes no `:vc`, com `<tag-class>` batendo no `package`.
2. [ ] `compileOnly` de `libs` e `mge-modelcore` no `vc/build.gradle`.
3. [ ] `.jsp` em `webapp/jsp/<Pasta>/`, com `<snk:load/>` no `<head>`.
4. [ ] `<ui url="/$ctx/jsp/<Pasta>/<Tela>.jsp">` no dicionário — só para o entrypoint.
5. [ ] Carga escolhida: `<snk:query>` (render) ou `executeQuery` (sob demanda), ou as duas.
6. [ ] `openApp` recebendo `pkObject` com a chave da PK, sem serializar.
7. [ ] `<script>` balanceado e sem `<snk:` dentro.
8. [ ] Só ASCII em arte de comentário.
9. [ ] Abrir **pelo menu**, não pela URL — é o que dá workspace ao `openApp`.

---

## Referências

- [`references/gadget-api.md`](references/gadget-api.md) — as cinco funções em detalhe, o serviço que executa a query, formato da resposta e teto de linhas
- [`references/querytag.md`](references/querytag.md) — `<snk:query>`: atributos, `Result`, parâmetros nomeados, datasource
- [`templates/`](templates/) — TLD, as 4 taglibs e um `.jsp` funcional, prontos para copiar

## Skills relacionadas

- `data-dictionary` — registro no menu, `<folder>`, pasta nativa
- `sankhya-js` — tela HTML5 do add-on (AngularJS, `sk-*`), a alternativa quando o caso é CRUD
- `database` — objetos de banco que a tela consulta
- `build` — deploy do add-on e do contexto web
- `encoding` — ISO-8859-1 nos `.java`/`.xml` das taglibs
