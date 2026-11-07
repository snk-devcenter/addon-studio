# `<snk:query>` — SQL no render da página

Executa um SELECT durante a renderização do JSP e publica o resultado no `pageContext`. A
página nasce com os dados dentro: nada de requisição extra, nada de estado de carregamento.
Em troca, os dados só mudam com reload — para atualizar sem sair da página, o caminho é
`executeQuery` ([`gadget-api.md`](gadget-api.md)).

Implementação em [`../templates/QueryTag.java`](../templates/QueryTag.java).

```jsp
<snk:query var="registros" maxRows="50">
SELECT CODPARC, NOMEPARC, ATIVO
  FROM TGFPAR
 ORDER BY CODPARC
</snk:query>
```

---

## Atributos

| Atributo | Obrigatório | Descrição |
|:---------|:------------|:----------|
| `var` | Sim | Nome da variável publicada no `pageContext`. |
| `scope` | Não | `page` (padrão), `request`, `session` ou `application`. |
| `maxRows` | Não | Teto de linhas. `-1` (padrão) não limita. |
| `startRow` | Não | Quantas linhas descartar do início. Padrão `0`. |
| `dataSource` | Não | Datasource alternativo. Sem ele, o padrão do add-on. |

O SQL vai no corpo da tag ou no atributo `sql`. Corpo vazio e `sql` ausente é erro em tempo
de render.

---

## Lendo o resultado

O `var` recebe um `javax.servlet.jsp.jstl.sql.Result`:

| Método | Devolve |
|:-------|:--------|
| `getRows()` | `SortedMap[]` — uma linha por mapa, chave **case-insensitive** |
| `getRowsByIndex()` | `Object[][]` — mesmas linhas, por posição |
| `getColumnNames()` | `String[]` na ordem do SELECT |
| `getRowCount()` | Número de linhas trazidas |
| `isLimitedByMaxRows()` | `true` se `maxRows` cortou o resultado |

```jsp
<%
  Result rs = (Result) pageContext.getAttribute("registros");
  SortedMap[] linhas = (rs == null) ? new SortedMap[0] : rs.getRows();
%>
<% for (SortedMap l : linhas) { %>
  <tr><td><%= l.get("CODPARC") %></td><td><%= l.get("NOMEPARC") %></td></tr>
<% } %>
```

Valor nulo no banco chega como `null` no mapa — diferente do `executeQuery`, que devolve tudo
como string. Trate antes de concatenar.

`isLimitedByMaxRows()` merece uso: silenciosamente exibir 50 de 5.000 linhas é como um
relatório erra sem parecer errado.

---

## Parâmetros nomeados

O `QueryTag` reconhece `:nome` no SQL e resolve o valor a partir dos **atributos da
requisição** — não dos parâmetros da URL. Quem popula é um scriptlet no topo da página, um
servlet ou um filtro, antes da tag rodar.

```jsp
<%
  request.setAttribute("CODPARC", codparc);
  request.setAttribute("CODPARC_TYPE", "INTEGER");
%>
<snk:query var="registros">
SELECT NOMEPARC FROM TGFPAR WHERE CODPARC = :CODPARC
</snk:query>
```

**Cada `:nome` precisa de um `nome_TYPE` na requisição.** O tipo diz como converter o valor
antes de ligá-lo à consulta; sem ele a tag falha ao montar o parâmetro. É o esquecimento mais
comum, e o erro que ele produz não aponta para o atributo que faltou.

| `nome_TYPE` | Valor ligado |
|---|---|
| `INTEGER`, `DECIMAL` | `BigDecimal` |
| `DATE`, `DATETIME`, `DATEPERIOD` | `Timestamp.valueOf(valor.toString())` — o texto precisa estar em `yyyy-MM-dd HH:mm:ss` |
| qualquer outro | `String` |

Só os nomes por extenso são reconhecidos (maiúscula ou minúscula). Abreviação como `"I"` não dá
erro: cai em "qualquer outro" e o valor vai como texto. No Oracle a conversão implícita faz a
consulta parecer certa, mas o tipo se perdeu.

**`DATE` liga um `Timestamp`, e no Oracle isso derruba o índice da coluna `DATE`.** O bind
vai por `setTimestamp`; TIMESTAMP tem precedência sobre DATE, então o Oracle converte a
**coluna**, e o predicado sai de `INDEX RANGE SCAN` para `INDEX FULL SCAN`. Envolva o
parâmetro: `WHERE DTNEG >= CAST(:DT_INI AS DATE)`. É portável — no MSSQL vira `date` e
descarta a hora, o que não importa em período começando 00h.

Valor ausente ou vazio vira `null` no parâmetro — a consulta roda, com o efeito que `null`
tiver na cláusula. Se a intenção era "sem filtro", escreva isso no SQL em vez de contar com
o `null`.

### Faixa de datas

Um atributo do tipo `Period` (ver [`../templates/Period.java`](../templates/Period.java))
atende dois marcadores de uma vez, `.INI` e `.FIN`:

```jsp
SELECT ... WHERE DTNEG BETWEEN :PERIODO.INI AND :PERIODO.FIN
```

com `request.setAttribute("PERIODO", period)`.

Aqui não há degradação para `null`: sem o atributo `PERIODO`, o cast para `Period` devolve
`null` e a tag estoura `NullPointerException` no render.

### Porte de gadget: ninguém mais popula os atributos

No `Dashboard.xhtml5` quem fazia `setAttribute` dos parâmetros (e montava o `Period` a partir
de `.INI`/`.FIN`) era o servlet do gadget, com os valores das `<prompt-parameters>`. Na tela
de menu do add-on nada faz isso. Um `.jsp` portado com `<snk:query>` parametrizada abre com
`NullPointerException` (se usa `:X.INI`/`:X.FIN`) ou filtrando por `null` sem erro (parâmetro
simples). Antes de portar, procure `:[A-Z_]` dentro das tags e decida de onde o filtro vem
agora — query string lida num scriptlet, filtro na própria tela, default no servidor.

### O que o parser toma por parâmetro

O reconhecimento é a regex `:[^(]\w+(\.\w+)?[^)]`, aplicada ao corpo inteiro **sem saber o
que é literal ou comentário**. Ela aceita um caractere qualquer entre o `:` e o nome, e consome
um caractere depois dele. Consequências:

| SQL | O que acontece |
|---|---|
| `'PENDENCIA: Chassi nao informado'` | `: Chassi ` vira o parâmetro `Chassi`, ligado a `null`; o literal é reescrito |
| `/* ver nota: AFRE */` | idem, parâmetro `AFRE` |
| `= :CODVEI, ...` | a vírgula colada entra no nome (`CODVEI,`), que não casa com atributo nenhum |

Corrija partindo o literal no dois-pontos (`concatstr('PENDENCIA:', ' Chassi nao informado')`,
skill `macros`), tirando `:` de comentário, e deixando espaço antes de vírgula depois de
`:nome`. Ao migrar SQL que rodava por
`executeQuery` (onde nada disso é parâmetro), gere a troca por script e confira rodando a
regex sobre o corpo da tag: zero casamentos fora dos parâmetros de verdade.

### Cláusula IN

`campo IN (:nome)` é expandido a partir do valor do atributo, que carrega a lista. `NOT IN`
também é reconhecido. Como o resto, depende do `nome_TYPE` correspondente.

---

## Datasource

Sem `dataSource`, a tag usa o padrão do add-on — a menos que o ambiente aponte um datasource
específico para consulta de tela, caso em que ela o respeita sozinha. É o mecanismo que
permite mandar leitura pesada para réplica sem tocar em uma linha de JSP, e a razão para não
fixar datasource no atributo sem necessidade real.

---

## Quando preferir `executeQuery`

`<snk:query>` é a escolha natural para o conteúdo principal da tela. Vale trocar quando:

- a tela precisa **recarregar sem reload** (filtro, atualização periódica);
- o volume pede **paginação** — o `executeQuery` tem teto de linhas e um padrão de paginação
  estabelecido ([`gadget-api.md`](gadget-api.md));
- a consulta depende de algo que só existe no cliente.

As duas convivem na mesma página sem conflito: uma pinta o estado inicial, a outra atualiza.
