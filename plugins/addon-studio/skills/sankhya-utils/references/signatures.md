# Assinaturas — `com.sankhya.util`

Assinaturas públicas extraídas dos jars da plataforma, com `throws` preservado — Java 8 exige tratar a checada. `static` implícito, salvo quando indicado. Nomes de pacote omitidos (`String`, `BigDecimal`, `Timestamp`, `Element`, `JsonObject`, ...); tipos aninhados aparecem como `Classe$Aninhada`.

Classes ordenadas por frequência de uso em addons. Índice curado, armadilhas e tabela de substituição: `SKILL.md`.

## StringUtils

Null-safety, formatação BR (CPF/CNPJ/CEP/telefone/placa), padding, conversão e escape. `isEmpty`/`getEmptyAsNull` tratam `null`, vazio e string só com espaços.

```java
final int ONLY_DIGITS
final int ONLY_ALPHAS
final int INDEX_NOT_FOUND
final Pattern VARIAVEIS_MSG
final Pattern VARIAVEIS_MSG_AND
final String ISO_8859_1
final String UTF_8
Collection buildTokens(String, String, StringUtils$TokenBuilder)
Set buildTokensAsSet(String, String, StringUtils$TokenBuilder)
String buildRaizCnpj(String)
Collection<String> getLines(String)
BigDecimal convertToBigDecimal(String)
String copy(String, int, int)
String copySemPadr(String, int, int)
String copy(Object, int, int)
String substringBetween(String, String, String)
String replaceVars(HashMap<String, String>, String)
String replaceVarsOfAnd(HashMap<String, String>, String)
String substr(Object, int, int)
void delimeterReplace(String, StringBuffer, String, String, int)
String delimeterSubstring(String, String, String, int)
String formatNumeric(String, Object, int)
String formatNumeric(String, Object)
String formatNumeric(Object)
String formatTimestamp(Timestamp, String)
String formataCep(String)
String formataCfop(String, int)
String formataCgcCpf(String)
String formataCgcCpf(String, String)
String formataPlaca(String)
String formataTelefone(String)
String formataTelefone2(String)
String formataTelefone3(String)
String formatSizeBytesToString(long)
String getCollectionCommaSeparated(Collection<?>)
Collection<String> commaSeparetedToCollection(String)
String getCollectionCommaSeparated(Collection<?>, boolean)
String getListCommaSeparated(List<?>)
String getListCommaSeparated(List<?>, boolean)
String getArrayCommaSeparated(Object[])
int getDelimiterClosingPosition(CharSequence, char, char, int)
int getDelimiterOpeningPosition(CharSequence, char, char, int)
String getEmptyAsNull(Object)
String getEmptyAsNull(String)
String getNullAsEmpty(String)
String getNullAsEmpty(Object)
boolean isDelimitersBalanced(String, char, char)
boolean isEmpty(Object)
boolean isEmpty(String)
boolean isNotEmpty(Object)
String joinArray(Object[], String, String)
String joinArray(Object[], String, String, String)
String joinArray(Object[], String)
String joinArray(Object[], String, boolean)
String joinArray(Object[], String, boolean, String)
String joinArray(Object[], String, boolean, String, String)
String pad(Object, int)
String padc(Object, int, char)
String padl(Object, int, char)
String padl(Object, int)
String padr(Object, int, char)
String padr(Object, int, String)
InputStream replaceAccentuatedChars(Clob) throws Exception
InputStream replaceAccentuatedCharsForString(String) throws Exception
String getValidFileName(String)
String replaceAccentuatedChars(String)
void replaceAccentuatedChars(StringBuffer)
void replaceAccentuatedChars(StringBuffer, String)
StringUtils append(String)
int countChars(char)
int countChars(String, char)
int countOcorrences(String, StringBuffer)
boolean empty(String)
String monthYear(String)
void replicate(StringBuffer, String, int)
String replicate(String, int)
StringUtils deleteChars(char)
StringUtils deleteChars(char, int)
StringUtils deleteChars(char, int, boolean)
StringUtils deleteExcept(int, int)
StringUtils deleteExcept(int, int, String)
StringUtils format(String, String, char)
String left(Object, int)
String right(Object, int)
StringUtils padc(int)
StringUtils padc(int, char)
String padc(Object, int)
StringUtils padl(int)
StringUtils padl(int, char)
StringUtils padr(int)
StringUtils padr(int, char)
String padr(Object, int)
String removePontuacao(String)
Map removeTokens(StringBuffer, String, String)
Map removeQuotes(StringBuffer, char)
StringUtils replaceChars(char, char)
StringUtils replaceChars(char, char, int)
StringUtils replaceChars(char, char, int, boolean)
StringUtils replacePattern(char)
StringUtils replacePattern(char, int)
StringUtils replacePattern(char, int, int)
StringUtils replacePattern(char, int, int, String)
StringUtils replaceString(String, String)
String replaceString(String, String, String)
void replaceString(String, String, StringBuffer)
void replaceString(String, String, StringBuffer, boolean)
void rollbackTokens(StringBuffer, Map, String)
String rtrim(String)
void rtrim(StringBuilder)
String ltrim(String)
StringUtils setPattern(int)
StringUtils stringZero(int)
String stringZero(Object, int, boolean)
String stringZero(Object, int)
boolean empty()
String hexStr2decStr(String)
byte[] toByteArray(String)
String toCNPJ(String) throws IllegalArgumentException
String toCPF(String) throws IllegalArgumentException
char[] toCharArray(String)
BigDecimal toCurrency(String)
Timestamp toDate(String)
Timestamp toDateTime(String)
String toHexString(byte[])
BigDecimal toNumber(String)
String toMD5(String) throws Exception
String toString()
StringBuffer toStringBuffer()
Timestamp toTime(String)
void wrapLines(StringBuffer, int)
String getNomeArquivo(String)
String getResourceAsString(Class, String) throws Exception
String removerCaracteresEspeciais(String) throws Exception
String prefix(String, int)
String trim(String)
String digitoVerificador(String)
String modulo11(String)
String modulo10(String)
String secureSubstring(String, int, int)
String normalizeFileName(String)
boolean safelyEquals(Object, Object)
boolean safelyEquals(String, String)
boolean safelyEqualsIgnoreCase(String, String)
String adicionaBarras(String)
String montaStringConfiguracoes(String, String, String, boolean)
String formataCartao(String) throws Exception
String getProximoDiaUtil(String, String, int) throws Exception
String getProximoDiaUtil(String, String, String, int) throws Exception
String htmlScape(String)
String reverseHtmlScape(String)
String replaceHtmlEntities(String)
String urlScape(String)
String blankWhenEmpty(String)
String replaceAll(String, String, String)
String buildLogradouro(String, String, String, String, BigDecimal)
String buildBairroCidade(String, String, BigDecimal, BigDecimal)
String buildUFCEP(String, String, BigDecimal)
String loadStringFromResource(Class, String) throws Exception
String duplicarAspasSimples(String)
boolean isNumeric(String)
String onlyNumber(String) throws Exception
String clobAsString(Clob) throws Exception
String getClobFromStream(ResultSet, String) throws Exception
String getClobFromStream(ResultSet, String, int) throws Exception
boolean toBoolean(String)
String onlyStringWithoutAccent(String)
boolean hasSpecialCharacter(String)
String limitSize(String, int)
String replaceLast(String, String, String)
String getNameFile(FileItem)
String buildCollectionAsString(Collection, String)
String join(Object[], String, int, int)
String join(Object[], String)
<T> String joinElements(T...)
String transformUTF8(String)
boolean containsOnlyZeros(Object)
boolean containsOnlyZeros(String)
String getValueOrDefault(String, String)
String parseStackTraceToString(Throwable)
int safeIndexOf(String, String)
boolean safeContains(String, String)
boolean safeStartsWith(String, String)
```

## TimeUtils

Datas em `java.sql.Timestamp` e `long` (millis) — o par natural das entidades JAPE. Aritmética, comparação por data, formatação e período.

```java
final int MINUTES_PER_DAY
final int SECONDS_PER_MINUTE
final int MILLISECONDS_PER_DAY
final int MILLISECONDS_PER_SECONDS
final int MILLISECONDS_PER_MINUTE
final int MILLISECONDS_PER_HOUR
final Pattern REGEX_DATETIME_RFC3339
TimeUtils$DataDecoder buildDataDecoder(Timestamp)
TimeUtils$DataDecoder buildDataDecoder(long)
long add(long, int, int)
long set(long, int, int)
long addWorkingDays(long, int)
long clear(long, int)
Timestamp bigDecimal2Timestamp(BigDecimal) throws Exception
Timestamp buildPrintableTimestamp(long, String)
Timestamp buildTimestamp(String)
Timestamp addMilissegundos(Timestamp, int) throws Exception
Date buildTimeawareDate(String)
Timestamp buildTimestampRFC3339(String)
TimeUtils$OnlyDate convertToOnlyDate(Object)
long clearDate(long)
Timestamp clearTime(Timestamp)
long clearTime(long)
void clearTime(Calendar)
int compareDates(Calendar, Calendar)
int compareOnlyDates(Timestamp, Timestamp)
Timestamp concatDateAndTime(Timestamp, Timestamp) throws Exception
String mesext(Timestamp)
String dataPorExtenso(Object)
Integer dayOfWeek(Timestamp)
String formataMMYYYY(Object)
String formataDDMMYY(Object)
String formataDDMMYYYY(Object)
String formataDDMMYYYYHHMMSS(Object)
String formataDDMMYYYYHHMM(Object)
String formataHHMM(Object)
String formataHHMMSS(Object)
String formataYYYYMMDD(Object)
String formataRFC3339(Object)
long getDayEnd(long)
long getDayEndNotMillisecond(long)
long getDayStart(long)
int getMaximum(Timestamp, int)
int getDifference(Timestamp, Timestamp)
int getDifference(Timestamp, Timestamp, boolean)
long getDifferenceInMinutes(Timestamp, Timestamp, boolean)
long getDifferenceInMinutes(Timestamp, Timestamp)
long getDifferenceInMonths(Timestamp, Timestamp)
long getDifferenceInHour(Timestamp, Timestamp)
long getDifferenceInHour(Timestamp, Timestamp, boolean)
long timestamp2Hour(long)
Date copyValue(Date, Date, int)
String getDisplayableTime(int)
String getDisplayableTime(BigDecimal)
BigDecimal getHoraDecimal(Timestamp)
Timestamp getMonthEnd(Timestamp)
long getMonthEnd(long)
int getLastDayOfMonth(Timestamp)
int getDay(Timestamp)
int getMonth(Timestamp)
int getYear(Timestamp)
Timestamp getYearStart(Timestamp)
long getMonthEndMax(long)
long getMonthStart(long)
Timestamp getMonthStart(Timestamp)
String getNow(String)
Timestamp getNow()
int getTimeInMinutes(Timestamp)
long getToday()
long getToday(int[])
Timestamp getValueOrNow(Timestamp)
int getWeekOfYear(Date)
BigDecimal getYearMonth(Timestamp)
boolean compareDatesEqualsYearMonth(Timestamp, Timestamp)
long getZeroDate()
Timestamp getTimeOrZero(Timestamp)
boolean isValidTime(BigDecimal)
BigDecimal minutes2Time(int)
BigDecimal minutes2Time(BigDecimal)
long minutes2Timestamp(long)
BigDecimal time2Minutes(int)
BigDecimal time2Minutes(BigDecimal)
BigDecimal timestamp2BigDecimal(Timestamp)
long timestamp2Minutes(long)
String milisegundos2HHmmss(long) throws Exception
String milisegundos2HHmmssSSS(long) throws Exception
String milisegundos2mmss(long) throws Exception
String formatMillis2ElapsedTime(long)
String formatMillis2SecondsElapsed(long)
String formatMillis2SimpleElapsedTime(long)
long toDate(String) throws Exception
long toDate(String, String) throws Exception
BigDecimal toDecimalTime(String)
Timestamp toTimestamp(String) throws Exception
Timestamp toTimestamp(String, String) throws Exception
Timestamp toDateTimestamp(String, String) throws Exception
long weekendFoward(long)
long weekendReward(long)
long getWeekEnd(long)
long getNextWeekStart(long)
boolean isSunday(long)
boolean isFirstDayOfMonth(long)
boolean isLastDayOfMonth(long)
Timestamp getReferenciaAnterior(Timestamp)
Timestamp getUltimoDiaDoMesRefAnterior(Timestamp)
long getNextMonthStart(long)
Timestamp buildData(int, int, int)
Timestamp buildDataWeek(int, int, int)
int getWeek(int, int, int)
Timestamp getInicioPeriodo(Timestamp, int)
Timestamp getInicioPeriodo(Timestamp, TimeUtils$TipoPeriodo)
Timestamp getFinalPeriodo(Timestamp, int, boolean)
Timestamp getFinalPeriodo(Timestamp, TimeUtils$TipoPeriodo, boolean)
Timestamp getFinalPeriodo(Timestamp, int)
Timestamp getFinalPeriodo(Timestamp, TimeUtils$TipoPeriodo)
Timestamp clearFields(Timestamp, int...)
int getDayOfMonth(Timestamp)
Timestamp getHorarioExec(String, int) throws Exception
int getValueFieldTimestamp(Timestamp, int) throws Exception
Timestamp getHorarioExec(String) throws Exception
String getProximoDiaUtil(String, String) throws Exception
String getProximoDiaUtil(String, String, String) throws Exception
boolean isWeekend(long) throws Exception
long getProximoDiaUtil(long) throws Exception
String formataIntervalo(long)
BigDecimal getQtdHorasNoPeriodo(BigDecimal, BigDecimal) throws Exception
String getDayOfWeek(int) throws Exception
String getMonthOfYear(int) throws Exception
Timestamp ultimoDiaMesAnterior(Timestamp)
Timestamp dataAdd(Timestamp, int, int)
Timestamp getSmallest(Timestamp, Timestamp)
Timestamp encodeDate(int, int, int)
Timestamp dataAddDay(Timestamp, int)
Timestamp dataAddYear(Timestamp, int)
int diasPorMes(int, int)
int getDaysOfMonth(int, int)
Timestamp getPreviousMonth(Timestamp)
Timestamp getDay(Integer, int, int)
int getWeeksOfMonth(int, int)
```

## BigDecimalUtil

Aritmética e null-safety de `BigDecimal`. Constantes: `ZERO_VALUE` (0), `CEM_VALUE` (100), `MATH_CTX` (`MathContext(64, HALF_UP)`), `DEC_FORMAT_VLR` (`DecimalFormat("0.00")`, Locale en_US).

```java
final BigDecimal ZERO_VALUE
final BigDecimal CEM_VALUE
final MathContext MATH_CTX
final DecimalFormat DEC_FORMAT_VLR
BigDecimal buildFromDouble(double)
BigDecimal safetyDivision(BigDecimal, BigDecimal, MathContext)
BigDecimal buildFromDouble(Number)
BigDecimal getRounded(double, int)
BigDecimal getRounded(BigDecimal, int)
double getRoundedDouble(double, int)
int getValue(BigDecimal, int)
BigDecimal getValue(BigDecimal, BigDecimal)
BigDecimal getValueOrZero(BigDecimal)
boolean isEmpty(BigDecimal)
boolean isNullOrZero(BigDecimal)
BigDecimal porcentagem(BigDecimal, BigDecimal)
BigDecimal porcentagem(BigDecimal, BigDecimal, MathContext)
String toCurrency(BigDecimal)
BigDecimal truncate(BigDecimal, int)
BigDecimal truncate(double, int)
BigDecimal truncateMGE(BigDecimal, int)
BigDecimal valueOf(double)
BigDecimal valueOf(long)
BigDecimal valueOf(String)
BigDecimal getBigDecimal(Object)
BigDecimal max(BigDecimal, BigDecimal)
BigDecimal min(BigDecimal, BigDecimal)
int min(int, int)
double subtractDouble(double, double)
double addDouble(double, double)
BigDecimal divide(BigDecimal, BigDecimal)
BigDecimal divide(BigDecimal, BigDecimal, int)
String formatCurrency(BigDecimal, int)
BigDecimal getRoundedHalfDown(BigDecimal, int)
BigDecimal strToBigDecimalDef(String, BigDecimal)
int getIntOrZero(Integer)
boolean safelyEquals(BigDecimal, BigDecimal)
```

## XMLUtils

Leitura/escrita de XML JDOM (`org.jdom.Element`/`Document`). Base dos serviços SP e integrações XML (NF-e, WebService, EDI).

```java
void addAttributeElement(Element, String, Object)
void addAttributeElement(Element, String, ResultSet) throws Exception
void addContentElement(Element, String, ResultSet) throws Exception
void addContentElement(Element, String, Object)
void addContentElement(Element, String, Object, Namespace) throws Exception
void addContentElement(Element, String, Object, Attribute[]) throws Exception
void addContentElement(Element, String, Object, Attribute[], Namespace)
Element buildCDATAElement(String, String)
void addFormatedContentElement(Element, String, Object, boolean) throws Exception
void addCDATAContentElement(Element, String, Object) throws Exception
void addCDATAContentElement(Element, String, String)
void addCDATAContentElementIfNotEmpty(Element, String, Object)
Document buildDocumentFromStream(InputStream) throws Exception
Document buildDocumentFromString(String) throws Exception
Document buildDocumentFromString(String, boolean) throws Exception
Element buildXMLElementFromObject(Object, String, Map) throws Exception
Element buildXMLElementFromObject(Object, String) throws Exception
Element buildXMLFromResultSet(String, String, ResultSet, XMLUtils$RowBuilder) throws Exception
Element buildXMLFromResultSet(String, String, ResultSet) throws Exception
Element buildXMLFromMap(Map<String, Object>) throws Exception
Element buildXMLFromMap(Map<String, Object>, String, boolean) throws Exception
void cleanDocument(Document) throws Exception
void cleanElement(Element) throws Exception
String documentToString(Document) throws Exception
String documentToString(Document, String) throws Exception
String elementToString(Element) throws Exception
String elementToString(Element, String) throws Exception
BigDecimal getAttributeAsBigDecimal(Element, String)
BigDecimal getAttributeAsBigDecimalOrZero(Element, String)
boolean getAttributeAsBoolean(Element, String)
String getAttributeAsString(Element, String)
String getAttributeAsString(Element, String, boolean)
Timestamp getAttributeAsTimestamp(Element, String)
<T extends Enum<T>> T getAttributeAsEnum(Element, String, Class<T>)
BigDecimal getContentAsBigDecimal(Element)
Boolean getContentAsBoolean(Element)
String getContentAsString(Element)
Timestamp getContentAsTimeStamp(Element)
<T extends Enum<T>> T getContentAsEnum(Element, Class<T>)
BigDecimal getContentChildAsBigDecimal(Element, String)
Boolean getContentChildAsBoolean(Element, String)
String getContentChildAsString(Element, String)
Timestamp getContentChildAsTimeStamp(Element, String)
<T extends Enum<T>> T getContentChildAsEnum(Element, String, Class<T>)
BigDecimal getRequiredAttributeAsBigDecimal(Element, String) throws Exception
String getRequiredAttributeAsString(Element, String) throws Exception
String getRequiredAttributeAsString(Element, String, boolean)
Timestamp getRequiredAttributeAsTimestamp(Element, String) throws Exception
<T extends Enum<T>> T getRequiredAttributeAsEnum(Element, String, Class<T>)
Element getChild(Element, String, String) throws Exception
Element getChild(Element, String) throws Exception
Element getRequiredChild(Element, String, String) throws Exception
Element getRequiredChild(Element, String) throws Exception
BigDecimal getRequiredContentAsBigDecimal(Element)
String getRequiredContentAsString(Element)
Timestamp getRequiredContentAsTimestamp(Element)
BigDecimal getRequiredContentChildAsBigDecimal(Element, String)
String getRequiredContentChildAsString(Element, String)
Timestamp getRequiredContentChildAsTimeStamp(Element, String)
String getStringOrEmpty(Object)
void iterateOnChildren(String, Element, XMLUtils$ChildIterator) throws Exception
void printFromDebug(Element)
Element removeChildIgnoringNameSpace(Element, String)
void setAttibuteIfNotEmpty(Element, String, String)
void setAttibuteValueIfNotEmpty(Element, String, Object)
void setAttibuteValue(Element, String, Object)
void setText(Element, Object)
void writeToStream(Document, OutputStream) throws Exception
void writeToStream(Document, OutputStream, String) throws Exception
String getXMLString(Element, String) throws Exception
void writeToStream(Element, OutputStream) throws Exception
void writeToStream(Element, OutputStream, String) throws Exception
Collection<BigDecimal> getChildrenContentAsBigDecimalCollection(Element, String)
Collection<BigDecimal> getChildrenContentAsBigDecimalCollection(Element, String, String)
void setNamespaceRecursively(Element, Namespace)
Element stringToElement(String) throws Exception
Collection<String> getChildrenContentAsStringCollection(Element, String)
Collection<String> getChildrenContentAsStringCollection(Element, String, String)
String keepingValidXMLChars(String)
boolean isXMLValid(String)
String escapeInvalidXMLChars(String)
```

## JsonUtils

Leitura de JSON via **Gson** (`com.google.gson.JsonObject`/`JsonArray`). Os `get*` retornam `null`/zero quando a chave não existe; os `getRequired*` lançam exceção.

```java
String getString(JsonObject, String)
String getRequiredString(JsonObject, String)
JsonElement getJsonElement(JsonObject, String)
JsonElement getJsonElement(JsonObject, String, boolean)
JsonElement getJsonElementRecursive(JsonObject, String, boolean)
JsonElement getJsonElementRecursive(JsonObject, String)
JsonObject getJsonObject(JsonObject, String)
JsonObject getRequiredJsonObject(JsonObject, String)
JsonObject parseJsonObject(JsonElement)
JsonArray parseJsonArray(JsonElement)
<T> T wrap(JsonObject, Class<T>)
<T> List<T> wrap(JsonArray, Class<T>)
JsonArray getJsonArray(JsonObject, String)
JsonArray getJsonToArray(JsonObject, String)
int getInt(JsonObject, String)
int getRequiredInt(JsonObject, String)
BigDecimal getBigDecimal(JsonObject, String)
BigDecimal getRequiredBigDecimal(JsonObject, String)
Double getDouble(JsonObject, String)
BigDecimal getBigDecimalOrZero(JsonObject, String)
Timestamp getTimestamp(JsonObject, String)
boolean isEmpty(JsonObject)
BigDecimal formatToBigDecimalOrZero(JsonObject, String)
BigDecimal formatToBigDecimal(JsonObject, String)
JsonObject convertStringToJsonObject(String)
boolean isJsonObject(Object)
List<JsonObject> getJsonObjectList(JsonArray) throws Exception
Collection<String> getChildrenAsStringCollection(JsonObject, String) throws Exception
Collection<String> getChildrenAsStringCollection(JsonArray, String) throws Exception
Collection<BigDecimal> getChildrenAsBigDecimalCollection(JsonObject, String) throws Exception
Collection<BigDecimal> getChildrenAsBigDecimalCollection(JsonArray, String) throws Exception
JsonArray convertStringToJsonArray(String)
JsonElement parserString(String)
Boolean getBoolean(JsonObject, String)
JsonObject buildJsonObjectFromResultSet(ResultSet) throws Exception
JsonObject buildJsonObjectFromResultSet(String, ResultSet) throws Exception
<E> JsonArray convertArrayToJsonArray(Collection<E>)
JsonArray convertArrayStringToJsonArray(String[])
void addProperty(JsonObject, String, Object)
void addPropertyIfNotEmpty(JsonObject, String, Object)
void addPropertyIfNotEmpty(JsonObject, String, String)
void addJsonObjectIfNotEmpty(JsonObject, String, JsonObject)
void addJsonObjectIfNotEmpty(JsonObject, String, String)
void addChildIfNotEmpty(JsonObject, String, JsonObject)
Map<String, Object> convertStringToJsonObjectToMap(String)
Map<String, Object> convertJsonObjectToMap(JsonObject)
<T> List<T> convertJsonArrayToList(JsonArray, String, Class<T>)
Map<String, Object> getMap(JsonObject, String)
String converteObjectToString(Object)
Gson getGson()
Gson getGson(String)
JsonElement getSafeValueIndex(JsonArray, int)
String getSafeValueIndexAsString(JsonArray, int)
```

## JdbcUtils

Fechamento silencioso de recursos JDBC e leitura tipada de `ResultSet`.

```java
Connection buildConnectionFromProperties(Properties) throws Exception
Connection buildConnection(String, String, String, String, String, String, String) throws Exception
void closeResultSet(ResultSet)
void closeStatement(Statement)
void closeConnection(Connection)
void fillMapFromResultSet(Map<String, Object>, ResultSet) throws SQLException
Object getTypedFieldFromResultSet(String, ResultSet) throws SQLException
Object getTypedFieldFromResultSet(String, Class<?>, ResultSet) throws SQLException
String getClobFieldAsString(ResultSet, String) throws Exception
```

## SQLUtils

Montagem de cláusula `IN`/`NOT IN` com quebra automática por lote (`IN_CLAUSE_MAX_PARAMS`) e escape de literais.

```java
final int IN_CLAUSE_MAX_PARAMS
String buildINClause(String, int)
String buildINClause(String, int, int)
String buildINClause(String, int, int, boolean)
String buildINClauseByValuesWithQuotes(String, String)
String buildINClauseByValuesWithQuotes(String, Collection)
String buildINClauseByValuesWithQuotes(String, Collection, int)
String buildINClauseByValues(String, Collection, int, boolean)
String buildINClauseByValues(String, Collection, int, boolean, boolean)
String buildINClauseByValues(String, Collection, int, boolean, boolean, boolean)
String buildINClauseByValues(String, String)
String buildINClauseByValues(String, Collection)
String buildNOTINClauseByValues(String, String)
String buildNOTINClauseByValues(String, Collection)
ResultSet executeDynamicQuery(Connection, StringBuffer, Object[]) throws Exception
void executeBatchUpdateByValues(PreparedStatement, Iterable, int, SQLUtils$ParameterSetter) throws Exception
String removeAlias(String)
StringBuilder appendOr(StringBuilder)
String appendOr(String)
StringBuilder appendAnd(StringBuilder)
String appendAnd(String)
String escapeQuotes(String)
```

## CollectionUtils

Checagem de coleção vazia, split em lotes e transformação.

```java
Collection<Collection<BigDecimal>> splitList(List<BigDecimal>, int)
boolean isEmpty(Collection)
boolean isNotEmpty(Collection)
<E, T> Collection<T> map(Collection<E>, CollectionUtils$CollectionTransformer<E, T>)
boolean inArray(String, String[])
```

## MapUtils

Checagem de `Map` vazio e presença de chaves.

```java
boolean containsSomeKey(Object[], Map)
boolean containsSomeKey(Collection, Map)
boolean containsAllKeys(Collection, Map)
Map sortByValue(Map, Comparator)
boolean isEmpty(Map)
boolean isNotEmpty(Map)
```

## ListUtils

Conversão de `ResultSet` em `List<Map<String, Object>>`.

```java
List<Map<String, Object>> resultSetToList(ResultSet) throws SQLException
```

## ObjectUtils

Comparação null-safe entre objetos de tipos heterogêneos (`BigDecimal` via `compareTo`).

```java
boolean safelyEquals(Object, Object)
```

## WrapperUtils

Unboxing null-safe de `Boolean`.

```java
boolean getBooleanOrFalse(Object)
```

## DateUtils

Diferenças e normalização sobre `java.util.Date` — **API paralela ao `TimeUtils`**, que opera em `Timestamp`/`long`. Em addon, prefira `TimeUtils`.

```java
long diffDatesMilliSeg(Date, Date)
long diffDatesHours(Date, Date)
long diffDatesSeconds(Date, Date)
long diffDatesMinutes(Date, Date)
long diffDatesDays(Date, Date)
void zeraHora(Date)
void zeraDate(Date)
Date converterStringToDate(String)
String retornaNumeros(String)
boolean checkIfDateIsBetweenTwoDates(Date, Date, Date)
```

## ExceptionNavigator

Percorre a cadeia de `getCause()` e devolve a primeira/última mensagem não vazia — evita `NullPointerException` ao logar exceção aninhada do JAPE.

```java
String getFirstNotEmptyMessage(Throwable)
String getLastNotEmptyMessage(Throwable)
```

## ResourceLock

Lock nomeado por recurso (local ou distribuído no cluster). `getLock` devolve `ResourceLock.LockHandle`, que expõe `isNew()`, `isHoldByThisThread()`, `release()`, `putProperty`/`getProperty`.

```java
final boolean USE_STRIPED_LOCKS
ResourceLock$LockHandle getLock(String)
ResourceLock$LockHandle getLockOnObjectReference(Object, long)
ResourceLock$LockHandle getLock(String, boolean)
ResourceLock$LockHandle getLock(String, long)
ResourceLock$LockHandle getLock(String, long, boolean)
ResourceLock$LockHandle getLock(String, long, boolean, boolean)
ResourceLock$LockHandle getDistributedLock(String, long, boolean)
ResourceLock$LockHandle getDistributedLock(String, long)
ResourceLock$LockHandle getDistributedLock(String, boolean)
ResourceLock$LockHandle getDistributedLock(String)
Map getLockedResourceskeys()
boolean isLocked(String)
ResourceLock$LockHandle getCurretLockHandle(String)
void release(ResourceLock$LockHandle)
```

## SessionFile

Arquivo temporário vinculado à sessão (retorno de relatório/anexo). Estende `org.apache.commons.fileupload.disk.DiskFileItem`. MIME types em `SessionFile.MimeType`: `PDF`, `JRXML`, `TXT`, `BIN`, `ZIP`.

```java
void setCanSendViaEmail(boolean) throws Exception
boolean isCanSendViaEmail()
SessionFile createSessionFile(String, String, byte[]) throws IOException
SessionFile createSessionFile(String, String, File) throws IOException
File buildTempFile(byte[], String) throws Exception
File buildTempFile() throws Exception
File buildTempFile(String) throws Exception
File getTempViewerFileDir()
```

## Base64Impl

Encode/decode Base64 (alternativa Java 8 sem `java.util.Base64` do JDK, mantida por compatibilidade com o restante da plataforma).

```java
String encode(byte[])
byte[] decode(String)
```

## UIDGenerator

Geração de identificadores da plataforma e dígito módulo 11.

```java
String getNextID()
String getMod11Digit(String)
String generateTxIdRandom()
```

## ClasspathUtils

Carga de classe/recurso respeitando o classloader do módulo — necessário no Wildfly, onde cada addon tem classloader próprio.

```java
<T> T instantiateObject(ClassLoader, Class<T>) throws Exception
<T> T instantiateObject(ClassLoader, Class<T>, ClasspathUtils$InstanceSupplier<T>) throws Exception
<T> T singletonObjectPerClassLoader(Class<T>) throws Exception
<T> T singletonObjectPerClassLoader(ClassLoader, Class<T>) throws Exception
<T, E extends Throwable> T executeAndReturnOnConvergentClassloader(br.function.ThrowableSupplier<T, E>) throws E
<E extends Throwable> void executeOnModuleClassloader(String, br.function.ThrowableRunnable<E>) throws E
<T, E extends Throwable> T executeAndReturnOnModuleClassloader(String, br.function.ThrowableSupplier<T, E>) throws E
<T> T singletonObjectPerClassloader(ClassLoader, Class<T>, ClasspathUtils$InstanceSupplier<T>) throws Exception
boolean isCurrentClassLoaderFromSankhyaw()
Class getClassFromContextClassLoader(String) throws Exception
Class getClassFromContextClassLoader(String, ClassLoader) throws Exception
Class getClassFromContextClassLoader(String, ClassLoader, boolean) throws Exception
List<InputStream> getResourceInputStream(String) throws URISyntaxException, IOException
InputStream getFirtResourceInputStream(String) throws URISyntaxException, IOException
void registryLoockupClassloader(ClassLoader)
void registryLoockupClassloader(String, ClassLoader)
void unregistryLoockupClassloader()
void unregistryLoockupClassloader(String)
ClassLoader getLoockupClassloader(String) throws Exception
ClassLoader getClassloaderFromCallerModule() throws Exception
String getResourceAsString(String) throws Exception
String getResourceAsString(String, String) throws Exception
boolean isConvergentClassLoader(ClassLoader)
```

## ZipUtils

Compactação em memória e por diretório.

```java
byte[] zip(Map<String, byte[]>) throws Exception
byte[] zip(String, byte[]) throws IOException
void zipDirectory(File, String, boolean) throws IOException
void putZipEntry(zip.ZipOutputStream, String, InputStream) throws Exception
void putZipEntry(zip.ZipOutputStream, String, InputStream, int) throws Exception
void putZipEntry(zip.ZipOutputStream, File) throws Exception
void putZipEntry(zip.ZipOutputStream, File, String) throws Exception
void putZipEntry(zip.ZipOutputStream, File, String, int) throws Exception
byte[] processarZipEntryInfoList(Collection<ZipUtils$ZipEntryInfo>) throws Exception
String getFileNameFromZip(zip.ZipEntry)
String getRelativePathFromZip(zip.ZipEntry)
```

## FileAndStreamUtils

Leitura de `InputStream`/`File`/`Reader` para `byte[]` ou `String`.

```java
byte[] readBytes(InputStream) throws IOException
String readStringFromStream(InputStream, String) throws IOException
String readStringFromStream(InputStream) throws IOException
String readStringFromFile(String) throws IOException
String readStringFromFile(File) throws IOException
String readStringFromReader(Reader) throws IOException
Object readObjectFromFile(File) throws IOException, ClassNotFoundException
void writeStringToFile(String, String) throws IOException
```

## ValidadorCpfCnpj

Validador com estado (instanciar, `setNumber`, `setTypenumber`, `isValid`, `getMessage`). Tipo via constantes `CPF` e `CNPJ`.

```java
final int CPF
final int CNPJ
String getMessage()
void setNumber(String)
void setTypenumber(int)
int getTypenumber()
boolean isValid()
```

## ValidadorEmail

Validação de e-mail por regex (`REGEX_EMAIL`).

```java
final String REGEX_EMAIL
boolean isValid(String)
```

## ValidadorPIS

Validação de PIS/PASEP.

```java
boolean isValid(String)
```

## NumeroTelefone

Parser de telefone: separa DDD e número (campos públicos `ddd`, `numero`).

```java
int ddd
long numero
NumeroTelefone parse(String) throws Exception
String nroPuro(String) throws Exception
```

## Extenso

Valor monetário por extenso.

```java
void setNumber(BigDecimal)
void setNumber(double)
void show()
String getExtenso(BigDecimal)
String toString()
```

## Crypter

Criptografia simétrica de `byte[]`.

```java
byte[] encrypt(byte[]) throws Exception
byte[] decrypt(byte[]) throws Exception
```

