---
name: sankhya-utils
description: Classes utilitárias do backend Java que a plataforma Sankhya já expõe no classpath do addon (`com.sankhya.util`) — `StringUtils`, `BigDecimalUtil`, `TimeUtils`, `XMLUtils`, `JsonUtils`, `JdbcUtils`, `SQLUtils`, `CollectionUtils`, `MapUtils`, `ExceptionNavigator`, `ResourceLock`, `SessionFile`, `UIDGenerator`, validadores de CPF/CNPJ/e-mail/PIS. Use quando o cálculo, a conversão ou a formatação acontece no Java do addon (backend, não na tela) — dono default quando o dev não diz onde roda: "arredondar para N casas", "tratar quando vier null", "formatar como moeda" sem citar tela/`.js`/HTML é backend — e antes de escrever à mão null-check, checagem de string/coleção vazia, conversão de tipo, arredondamento de `BigDecimal`, aritmética de data/`Timestamp`, formatação de moeda/CPF/CNPJ/CEP, fechamento de `ResultSet`, cláusula `IN` dinâmica, lock de recurso, arquivo temporário de sessão ou parser XML/JSON; ao revisar código com null-check repetido; ou ao tocar em código que importa `com.sankhya.util`. NÃO usar para os utilitários homônimos da tela HTML5 (`StringUtils`/`DateUtils`/`NumberUtils` do framework `sankhya-js`) — esses são `sankhya-js`.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Utilitários da plataforma — `com.sankhya.util`

**Regra:** antes de escrever null-check, validação de vazio, conversão, formatação ou cálculo à mão, procure o equivalente neste índice. Se existe, use.

O pacote vem no classpath **junto com a plataforma** — não declare dependência no `build.gradle`, não use `moduleLib`. Só o `import`.

> **Assinaturas completas** (todas as classes, todos os métodos públicos, com `throws`): `references/signatures.md`.

---

## 1. Índice de classes

| Classe | Para que serve |
|:-------|:---------------|
| `StringUtils` | Null-safety de `String`, formatação BR (CPF/CNPJ/CEP/telefone/placa), padding, escape, conversão |
| `TimeUtils` | Datas em `Timestamp`/`long`: aritmética, comparação só-data, formatação, período |
| `BigDecimalUtil` | Null-safety e aritmética de `BigDecimal`: arredondamento, divisão, percentual, moeda |
| `XMLUtils` | Leitura/escrita de XML JDOM (`org.jdom.Element`) — serviços SP e integrações XML |
| `JsonUtils` | Leitura de JSON via Gson (`JsonObject`/`JsonArray`) |
| `JdbcUtils` | Fecha `ResultSet`/`Statement`/`Connection` sem `try/catch`; leitura tipada de `ResultSet` |
| `SQLUtils` | Cláusula `IN`/`NOT IN` dinâmica com quebra por lote, escape de literal |
| `CollectionUtils` | Coleção vazia, split em lotes, transformação |
| `MapUtils` | `Map` vazio, presença de chaves |
| `ListUtils` | `ResultSet` → `List<Map<String, Object>>` |
| `ObjectUtils` | `equals` null-safe entre tipos heterogêneos (delega para `BigDecimalUtil`/`StringUtils` conforme o tipo) |
| `WrapperUtils` | Unboxing null-safe de `Boolean` (ver §8.10) |
| `DateUtils` | Diferenças sobre `java.util.Date` — **API paralela** ao `TimeUtils` (ver §8.6) |
| `ExceptionNavigator` | Primeira/última mensagem não vazia na cadeia de `getCause()` |
| `ResourceLock` | Lock nomeado por recurso, local ou distribuído no cluster |
| `SessionFile` | Arquivo temporário de sessão (retorno de relatório/anexo) |
| `UIDGenerator` | Identificador da plataforma, dígito módulo 11 |
| `Base64Impl` | Encode/decode Base64 |
| `ClasspathUtils` | Classe/recurso pelo classloader do módulo (Wildfly isola por addon) |
| `FileAndStreamUtils`, `ZipUtils` | Leitura de stream/arquivo, compactação |
| `ValidadorCpfCnpj`, `ValidadorEmail`, `ValidadorPIS` | Validação de documento e e-mail |
| `Extenso`, `NumeroTelefone`, `Crypter` | Valor por extenso, parser de telefone, criptografia simétrica |

---

## 2. Tabela de substituição

| Código manual | Utilitário |
|:--------------|:-----------|
| `s == null \|\| s.trim().isEmpty()` | `StringUtils.isEmpty(s)` |
| `s != null && !s.trim().isEmpty()` | `StringUtils.isNotEmpty(s)` |
| `s != null ? s.trim() : null` | `StringUtils.getEmptyAsNull(s)` |
| `s != null ? s : ""` | `StringUtils.getNullAsEmpty(s)` |
| `s1 != null && s1.equals(s2)` | `StringUtils.safelyEquals(s1, s2)` |
| `v != null ? v : BigDecimal.ZERO` | `BigDecimalUtil.getValueOrZero(v)` |
| `v == null \|\| v.compareTo(BigDecimal.ZERO) == 0` | `BigDecimalUtil.isNullOrZero(v)` |
| `v.setScale(2, RoundingMode.HALF_UP)` | `BigDecimalUtil.getRounded(v, 2)` |
| `i != null ? i : 0` (`Integer`) | `BigDecimalUtil.getIntOrZero(i)` |
| `new BigDecimal(str)` dentro de `try/catch` | `BigDecimalUtil.strToBigDecimalDef(str, padrao)` |
| `new Timestamp(System.currentTimeMillis())` | `TimeUtils.getNow()` |
| `new SimpleDateFormat("dd/MM/yyyy").format(dt)` | `TimeUtils.formataDDMMYYYY(dt)` |
| `Calendar` só para somar dias | `TimeUtils.dataAddDay(ts, n)` |
| `Calendar` só para zerar hora | `TimeUtils.clearTime(ts)` |
| comparar datas ignorando hora na mão | `TimeUtils.compareOnlyDates(t1, t2)` |
| `c == null \|\| c.isEmpty()` (coleção) | `CollectionUtils.isEmpty(c)` |
| `m == null \|\| m.isEmpty()` (map) | `MapUtils.isEmpty(m)` |
| `b != null && b` (`Boolean`/`Object`) | `WrapperUtils.getBooleanOrFalse(b)` — não converte `"S"`/`"N"` (§8.10) |
| `try { rs.close(); } catch (Exception ignored) {}` | `JdbcUtils.closeResultSet(rs)` |
| montar `IN (?, ?, ?)` concatenando em loop | `SQLUtils.buildINClause(campo, qtd)` |
| `e.getCause().getCause().getMessage()` | `ExceptionNavigator.getLastNotEmptyMessage(e)` |
| regex de CPF/CNPJ copiada de outro projeto | `new ValidadorCpfCnpj(nro)` + `isValid()` |

---

## 3. StringUtils

```java
import com.sankhya.util.StringUtils;
```

| Método | Assinatura | Comportamento |
|:-------|:-----------|:--------------|
| `isEmpty` | `(String) : boolean` | `true` para `null`, `""` e só-espaços |
| `isEmpty` | `(Object) : boolean` | `null` → `true`; senão aplica a regra acima ao `toString()` (ver §8.4) |
| `isNotEmpty` | `(Object) : boolean` | negação de `isEmpty` |
| `getEmptyAsNull` | `(String) : String` | vazio/só-espaços → `null`; senão retorna **trimado** |
| `getNullAsEmpty` | `(String) : String` | `null` → `""` |
| `getValueOrDefault` | `(String, String) : String` | valor ou padrão |
| `safelyEquals` | `(String, String) : boolean` | `equals` null-safe; `null`, `""` e só-espaços são **equivalentes entre si** |
| `safelyEqualsIgnoreCase` | `(String, String) : boolean` | idem, sem case |
| `safeContains` / `safeStartsWith` / `safeIndexOf` | `(String, String)` | busca null-safe (`false` / `-1` quando algum lado é vazio) |
| `left` / `right` | `(Object, int) : String` | N primeiros/últimos caracteres |
| `padl` / `padr` / `padc` | `(Object, int[, char]) : String` | alinha à esquerda/direita/centro |
| `stringZero` | `(Object, int) : String` | zeros à esquerda |
| `limitSize` | `(String, int) : String` | trunca no tamanho |
| `isNumeric` | `(String) : boolean` | só dígitos |
| `replaceAccentuatedChars` | `(String) : String` | remove acentos |
| `removePontuacao` | `(String) : String` | limpa máscara (`onlyNumber` faz o mesmo, mas declara `throws Exception`) |
| `convertToBigDecimal` / `toNumber` | `(String) : BigDecimal` | string com ou sem pontuação → número |
| `toDate` / `toDateTime` / `toTime` | `(String) : Timestamp` | conversão de data |
| `formataCgcCpf` | `(String) : String` | máscara CPF (11 dígitos) ou CNPJ (14) |
| `formataCep` / `formataTelefone` / `formataPlaca` | `(String) : String` | máscaras BR |
| `getCollectionCommaSeparated` | `(Collection<?>) : String` | join por vírgula |
| `commaSeparetedToCollection` | `(String) : Collection<String>` | split por vírgula |
| `duplicarAspasSimples` | `(String) : String` | escapa `'` para SQL literal |
| `parseStackTraceToString` | `(Throwable) : String` | stack trace em `String` para log |

Constantes: `StringUtils.ISO_8859_1`, `StringUtils.UTF_8` — use no lugar de literal `"ISO-8859-1"` ao ler/escrever stream.

---

## 4. BigDecimalUtil

```java
import com.sankhya.util.BigDecimalUtil;
```

| Método | Assinatura | Comportamento (verificado no bytecode) |
|:-------|:-----------|:---------------------------------------|
| `getValueOrZero` | `(BigDecimal) : BigDecimal` | `null` → `ZERO_VALUE` |
| `getValue` | `(BigDecimal, BigDecimal) : BigDecimal` | `null` → padrão |
| `getValue` | `(BigDecimal, int) : int` | **retorna `int`** — sobrecarga pelo tipo do padrão (§8.7) |
| `getIntOrZero` | `(Integer) : int` | `null` → `0` |
| `isEmpty` / `isNullOrZero` | `(BigDecimal) : boolean` | `null` **ou** zero (mesma implementação) |
| `safelyEquals` | `(BigDecimal, BigDecimal) : boolean` | compara por `compareTo`; trata **`null` como zero** (§8.8) |
| `getRounded` | `(BigDecimal, int) : BigDecimal` | `setScale(escala, HALF_UP)` |
| `getRoundedHalfDown` | `(BigDecimal, int) : BigDecimal` | `setScale(escala, HALF_DOWN)` |
| `truncate` | `(BigDecimal, int) : BigDecimal` | `setScale(escala, DOWN)` — corta, não arredonda |
| `divide` | `(BigDecimal, BigDecimal) : BigDecimal` | `MathContext(2, HALF_EVEN)` — **2 dígitos significativos** (§8.1) |
| `divide` | `(BigDecimal, BigDecimal, int) : BigDecimal` | idem, com precisão explícita; lança `IllegalStateException` se algum arg for `null` |
| `safetyDivision` | `(BigDecimal, BigDecimal, MathContext) : BigDecimal` | dividendo `null`/zero → devolve o dividendo; divisor `null`/zero → divide por `ONE`. Nunca lança `ArithmeticException` |
| `porcentagem` | `(BigDecimal parte, BigDecimal todo[, MathContext]) : BigDecimal` | `parte * 100 / todo`; sem `MathContext` usa `MathContext(2, HALF_UP)` (§8.2) |
| `max` / `min` | `(BigDecimal, BigDecimal) : BigDecimal` | `a.compareTo(b)` direto — **não é null-safe** (§8.3) |
| `valueOf` | `(double)` / `(long)` / `(String)` | fábrica |
| `getBigDecimal` | `(Object) : BigDecimal` | aceita `BigDecimal`, `String` e `Number`; outro tipo → `IllegalStateException` |
| `strToBigDecimalDef` | `(String, BigDecimal) : BigDecimal` | conversão com padrão em caso de erro (não lança) |
| `toCurrency` | `(BigDecimal) : String` | formata com padrão `#,##0.00` |
| `formatCurrency` | `(BigDecimal, int) : String` | idem, com N casas decimais |

Constantes: `ZERO_VALUE` (0), `CEM_VALUE` (100), `MATH_CTX` (`MathContext(64, HALF_UP)`), `DEC_FORMAT_VLR` (`DecimalFormat("0.00")`, Locale `en_US`).

**Valor monetário — padrão seguro:**

```java
// Divisão com precisão alta + arredondamento explícito no fim
BigDecimal unitario = BigDecimalUtil.getRounded(
        BigDecimalUtil.safetyDivision(vlrTotal, quantidade, BigDecimalUtil.MATH_CTX), 2);

// Percentual sobre o total, 2 casas
BigDecimal percentual = BigDecimalUtil.getRounded(
        BigDecimalUtil.porcentagem(vlrDesconto, vlrTotal, BigDecimalUtil.MATH_CTX), 2);
```

---

## 5. TimeUtils

```java
import com.sankhya.util.TimeUtils;
```

Opera em `java.sql.Timestamp` e `long` (millis) — o par natural das entidades JAPE.

| Método | Assinatura | Comportamento |
|:-------|:-----------|:--------------|
| `getNow` | `() : Timestamp` | agora |
| `getNow` | `(String pattern) : String` | agora formatado (`"dd/MM/yyyy"`, `"yyyy-MM-dd"`, ...) |
| `getToday` | `() : long` | hoje com hora zerada, em millis |
| `getValueOrNow` | `(Timestamp) : Timestamp` | `null` → agora |
| `clearTime` | `(Timestamp) : Timestamp` | zera hora/minuto/segundo/millis |
| `dataAddDay` | `(Timestamp, int) : Timestamp` | soma dias (negativo subtrai) |
| `dataAddYear` | `(Timestamp, int) : Timestamp` | soma anos |
| `dataAdd` | `(Timestamp, int, int) : Timestamp` | soma em campo de `Calendar` |
| `add` | `(long millis, int qtd, int campo) : long` | **ordem invertida** vs `Calendar.add` (§8.5) |
| `addWorkingDays` | `(long, int) : long` | soma dias úteis |
| `getProximoDiaUtil` | `(long) : long` | próximo dia útil |
| `compareOnlyDates` | `(Timestamp, Timestamp) : int` | compara ignorando hora; null-safe (`null,null` → 0) |
| `getDifference` | `(Timestamp, Timestamp) : int` | diferença em **dias** |
| `getDifferenceInHour` / `getDifferenceInMinutes` / `getDifferenceInMonths` | `(Timestamp, Timestamp) : long` | diferença na unidade do nome |
| `getMonthStart` / `getMonthEnd` / `getYearStart` | `(Timestamp) : Timestamp` | limites de período |
| `getInicioPeriodo` / `getFinalPeriodo` | `(Timestamp, TipoPeriodo) : Timestamp` | período por `TimeUtils.TipoPeriodo` (`DIA`, `SEMANA`, `DEZENA`, `QUINZENA`, `MES`, `BIMESTRE`, `TRIMESTRE`, `QUADRIMESTRE`, `SEMESTRE`, `ANO`, `PERIODO_UNICO`) |
| `getDay` / `getMonth` / `getYear` / `getDayOfMonth` | `(Timestamp) : int` | componentes da data |
| `dayOfWeek` | `(Timestamp) : Integer` | dia da semana (**retorno boxed**) |
| `getYearMonth` | `(Timestamp) : BigDecimal` | competência `YYYYMM` |
| `buildTimestamp` | `(String) : Timestamp` | parse de data em formato BR (`"dd/MM/yyyy"`) |
| `buildTimestampRFC3339` / `formataRFC3339` | `(String)` / `(Object)` | ISO 8601 para payload de API |
| `toTimestamp` | `(String[, String pattern]) : Timestamp` | parse com padrão explícito |
| `formataDDMMYYYY` / `formataDDMMYYYYHHMM` / `formataDDMMYYYYHHMMSS` / `formataHHMM` / `formataYYYYMMDD` / `formataMMYYYY` | `(Object) : String` | formatação pronta; **argumento `null` devolve a máscara em branco** (`"  /  /  "`), não `null` |
| `timestamp2BigDecimal` / `bigDecimal2Timestamp` | conversão | data como número (campos legados) |
| `minutes2Time` / `time2Minutes` / `getHoraDecimal` | `(BigDecimal)` | hora decimal ↔ minutos |
| `isSunday` / `isFirstDayOfMonth` / `isLastDayOfMonth` | `(long) : boolean` | testes de calendário |
| `isWeekend` | `(long) : boolean` | fim de semana — declara `throws Exception` |

```java
// Vencimento = hoje + N dias, sem hora
Timestamp vencimento = TimeUtils.dataAddDay(new Timestamp(TimeUtils.getToday()), prazoDias);

// Está dentro da competência informada?
boolean mesmaCompetencia = TimeUtils.compareDatesEqualsYearMonth(dtMovimento, dtReferencia);
```

---

## 6. XMLUtils e JsonUtils — integração

Ambas existem para **payload cru**: `XMLUtils` opera sobre JDOM (`org.jdom.Element`), `JsonUtils` sobre Gson (`com.google.gson.JsonObject`).

```java
// XML: leitura defensiva (get*) vs obrigatória (getRequired* lança se ausente)
Element item = XMLUtils.getRequiredChild(raiz, "item");
BigDecimal qtd = XMLUtils.getAttributeAsBigDecimalOrZero(item, "QTDNEG");
String obs   = XMLUtils.getContentChildAsString(item, "OBSERVACAO");
XMLUtils.addCDATAContentElementIfNotEmpty(retorno, "MENSAGEM", mensagem);

// JSON: get* devolve null/zero na ausência; getRequired* lança
JsonObject body = JsonUtils.convertStringToJsonObject(raw);
String codigo   = JsonUtils.getRequiredString(body, "codigo");
BigDecimal vlr  = JsonUtils.getBigDecimalOrZero(body, "valor");
```

> **Em endpoint REST novo, não use estas classes.** `@Controller` recebe/devolve DTO com `@Valid`, e a conversão DTO↔entidade é MapStruct. Ver skills `controller` e `mapstruct`. `XMLUtils`/`JsonUtils` ficam para serviço SP legado, integração XML (NF-e, EDI, WebService) e resposta de terceiro sem contrato estável.

---

## 7. Utilitários pontuais

```java
// Fecha recurso JDBC sem try/catch aninhado
} finally {
    JdbcUtils.closeResultSet(rs);
    JdbcUtils.closeStatement(st);
}

// IN dinâmica com quebra automática por lote (evita o limite de 1000 do Oracle)
String clausula = SQLUtils.buildINClause("CAB.NUNOTA", codigos.size());
String literal  = SQLUtils.buildINClauseByValues("CAB.CODTIPOPER", tiposOperacao);

// Mensagem útil de exceção aninhada do JAPE (@Log Lombok + java.util.logging)
log.log(Level.SEVERE, "Falha ao gravar: " + ExceptionNavigator.getLastNotEmptyMessage(e), e);

// Serializa acesso concorrente a um recurso (numeração, saldo, arquivo)
ResourceLock.LockHandle lock = ResourceLock.getLock("SALDO_" + codigoProduto, 30000L);
try {
    // seção crítica
} finally {
    lock.release();
}

// Arquivo de retorno para a tela (relatório, anexo)
SessionFile arquivo = SessionFile.createSessionFile("relatorio.pdf", SessionFile.MimeType.PDF, bytes);

// Validação de documento
ValidadorCpfCnpj validador = new ValidadorCpfCnpj(StringUtils.removePontuacao(cgcCpf));
if (!validador.isValid()) {
    throw new DocumentoInvalidoException(validador.getMessage()); // exceção tipada do projeto
}
```

`ResourceLock.getDistributedLock(...)` estende o lock a todos os nós do cluster — use quando a exclusão precisa valer para o ambiente inteiro, não só para a JVM local.

---

## 8. Armadilhas

### 8.1 `divide(a, b)` usa precisão, não escala

`MathContext(2, HALF_EVEN)` = **2 dígitos significativos**. `divide(new BigDecimal("1234"), new BigDecimal("2"))` devolve `6.2E+2` (620), não `617.00`. Para valor monetário use `safetyDivision(a, b, BigDecimalUtil.MATH_CTX)` (precisão 64) e arredonde no fim com `getRounded(v, 2)`.

### 8.2 `porcentagem(parte, todo)` idem

A sobrecarga de 2 argumentos usa `MathContext(2, HALF_UP)` — mesma armadilha. Passe `BigDecimalUtil.MATH_CTX` na sobrecarga de 3 argumentos.

### 8.3 Nem todo método de `BigDecimalUtil` é null-safe

`divide` (as duas sobrecargas) lança `IllegalStateException` ("dividendo/divisor não pode ser nulo"). `max` e `min` chamam `compareTo` no primeiro argumento sem checagem — `NullPointerException`. Envolva com `getValueOrZero` ou use `safetyDivision`, que trata `null` — e **devolve o próprio dividendo** quando ele é `null`/zero, ou seja, pode retornar `null`.

```java
BigDecimal maior = BigDecimalUtil.max(
        BigDecimalUtil.getValueOrZero(saldoAtual),
        BigDecimalUtil.getValueOrZero(saldoMinimo));
```

### 8.4 `isEmpty(Object)` faz `toString()`

`StringUtils.isEmpty(new ArrayList<>())` é `false` — o `toString()` de uma lista vazia é `"[]"`, que não é vazio. A sobrecarga aceita qualquer tipo, então o erro **compila**. Use a classe certa: coleção → `CollectionUtils.isEmpty`, map → `MapUtils.isEmpty`, `BigDecimal` → `BigDecimalUtil.isNullOrZero`.

### 8.5 `TimeUtils.add(millis, quantidade, campo)`

Ordem invertida em relação a `Calendar.add(campo, quantidade)`. Como os dois parâmetros são `int`, trocar não quebra a compilação — vira bug silencioso de data.

```java
// CORRETO
new Timestamp(TimeUtils.add(dtBase.getTime(), 30, Calendar.DAY_OF_MONTH))
// PREFERÍVEL quando é dia/ano
TimeUtils.dataAddDay(dtBase, 30)
```

### 8.6 `TimeUtils` × `DateUtils`

`TimeUtils` opera em `Timestamp`/`long`; `DateUtils` em `java.util.Date`, com outros nomes (`diffDatesDays`, `zeraHora`, `checkIfDateIsBetweenTwoDates`). Entidade JAPE usa `Timestamp`, então o padrão do addon é `TimeUtils` — misturar as duas gera conversão desnecessária. `DateUtils.zeraHora(Date)` ainda **muta** o argumento e retorna `void`.

### 8.7 Sobrecargas que mudam o tipo de retorno

`BigDecimalUtil.getValue(v, BigDecimal.ONE)` devolve `BigDecimal`; `getValue(v, 1)` devolve `int`. O padrão escolhido define o retorno.

### 8.8 `safelyEquals` de `BigDecimal` iguala `null` e zero

`BigDecimalUtil.safelyEquals(null, BigDecimal.ZERO)` é `true` — a implementação usa `isEmpty` nos dois lados. Se `null` e zero precisam ser distintos (campo opcional × campo zerado), compare explicitamente.

### 8.9 Conflito de nome com Apache Commons

`StringUtils`, `CollectionUtils` e `MapUtils` também existem no Commons, com semântica diferente (`org.apache.commons.lang.StringUtils.isEmpty` **não** trima). Confira o import: tem de ser `com.sankhya.util`.

### 8.10 `getBooleanOrFalse` não entende `"S"`/`"N"`

`WrapperUtils.getBooleanOrFalse(Object)`: `null` → `false`; `String` → `Boolean.parseBoolean`, que só aceita `"true"`. Ou seja, `getBooleanOrFalse("S")` é **`false`** — exatamente o formato dos campos `CHECKBOX` do dicionário. Use para `Boolean`/`Object` vindo de `Map`/`ResultSet`; para flag `"S"`/`"N"` compare explicitamente (`"S".equals(valor)`).

### 8.11 Não invente método

`getBigDecimalOrZero` existe em `JsonUtils` (recebe `JsonObject` + chave), **não** em `BigDecimalUtil`. O equivalente lá é `getValueOrZero`. Na dúvida, consulte `references/signatures.md`.

---

## 9. Anti-patterns (PROIBIDO)

| Anti-Pattern | Correção |
|:-------------|:---------|
| `if (s != null && !s.trim().isEmpty())` repetido no arquivo | `StringUtils.isNotEmpty(s)` |
| `v == null ? BigDecimal.ZERO : v` espalhado pelo service | `BigDecimalUtil.getValueOrZero(v)` |
| `new SimpleDateFormat(...)` como campo de instância/estático | `TimeUtils.formata*` (`SimpleDateFormat` não é thread-safe) |
| `Calendar` inline só para somar dias ou zerar hora | `TimeUtils.dataAddDay` / `TimeUtils.clearTime` |
| `try { rs.close(); } catch (Exception e) {}` em cada `finally` | `JdbcUtils.closeResultSet(rs)` |
| Concatenar `IN (` em loop com `StringBuilder` | `SQLUtils.buildINClause` / `buildINClauseByValues` |
| Regex de CPF/CNPJ/e-mail copiada entre projetos | `ValidadorCpfCnpj` / `ValidadorEmail` / `ValidadorPIS` |
| `e.getCause().getMessage()` sem checar `null` | `ExceptionNavigator.getLastNotEmptyMessage(e)` |
| `synchronized` em método de service para serializar recurso de negócio | `ResourceLock.getLock(chave)` (funciona no cluster) |
| Copiar util do Sankhya para dentro do addon "para não depender" | importar de `com.sankhya.util` — já está no classpath |
| Adicionar Apache Commons Lang no `build.gradle` para `isEmpty`/`isBlank` | usar o que a plataforma já expõe |

---

## 10. Quando NÃO usar

- **Validação de payload REST** — é `@Valid` + Bean Validation no DTO, não `if (StringUtils.isEmpty(...)) throw`. Ver skill `controller`.
- **Conversão DTO ↔ entidade** — é MapStruct. Ver skill `mapstruct`.
- **JSON de endpoint próprio** — o `@Controller` já serializa o DTO; `JsonUtils`/Gson só para JSON cru de terceiro.
- **Cliente HTTP externo** — Retrofit + Moshi, não `XMLUtils`/`JsonUtils` sobre resposta bruta. Ver skill `retrofit`.
- **Portabilidade de SQL** — data/texto/null em query são macros do `MacroTranslator` (`dbDate()`, `nullValue()`, `ignorecase()`), não `TimeUtils`/`StringUtils` no Java. Ver skill `macros`.
- **Regra de negócio de saldo/estoque/financeiro** — utilitário só faz null-safety e formatação; o cálculo continua sendo do domínio.

---

## Skills relacionadas

- `controller` / `mapstruct` — validação e conversão em endpoint REST (substituem `if` manual e parser cru)
- `repository` — `@Criteria`/`@NativeQuery`; `SQLUtils` complementa na montagem de `IN` dinâmica
- `macros` — equivalentes das utilidades de data/texto/null **dentro** do SQL
- `retrofit` — integração HTTP externa com Moshi, em vez de parser JSON manual
- `test` — `SessionFile` é uma das classes com mock estático necessário (`mockito-inline`)
