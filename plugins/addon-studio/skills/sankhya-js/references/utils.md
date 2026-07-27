# sankhya-js — utilitarios do modulo `snk.core.util`

Servicos que a tela recebe por injecao de dependencia, sem nada a declarar alem do modulo `snk`. Antes de escrever null-check, formatacao, aritmetica de data, clausula `IN` ou copia de objeto na mao, procure aqui — o equivalente do lado Java e a skill `sankhya-utils` (`com.sankhya.util`).

```javascript
angular.module('<Tela>App', ['snk'])
  .controller('<Tela>Controller', ['StringUtils', 'DateUtils', 'DateUtilsConstants', 'NumberUtils',
    function (StringUtils, DateUtils, DateUtilsConstants, NumberUtils) { /* ... */ }]);
```

Arquivos: core/util/<pasta>/<nome>.service.js.

## Indice

| Servico | Serve para |
|---|---|
| `StringUtils` | vazio/trim, mascara de documento, buffer, case, escape HTML |
| `NumberUtils` | formatacao decimal, parse pt-BR, arredondamento, bytes |
| `DateUtils` + `DateUtilsConstants` | data e hora sobre moment, formatos default |
| `ArrayUtils` | busca, ordenacao e remocao em array |
| `ObjectUtils` | path aninhado, clone, comparacao, contrato de interface |
| `SkConstants` | `KEY_CODE`, eventos, media queries, operadores SQL |
| `Base64` | encode/decode (usado no `pkHash` da URL) |
| `ClipboardUtils` | copiar texto |
| `UrlUtils` | query params, PK da URL, base da aplicacao |
| `SqlUtils` | clausula `IN` sem estourar limite do banco |
| `SessionFileUpload` | upload para a sessao (par do `sk-file-input`) |
| `UidGenerator` | id unico para elemento/DOM |
| `AngularUtil` | debounce, timeout, compile, watch de uma vez |

---

## StringUtils

core/util/string/stringutil.service.js.

### Vazio e conversao

| Metodo | Nota |
|---|---|
| `isEmpty(value)` / `isNotEmpty(value)` | faz `toString()` + `trim()`; `undefined`, `null` e `'   '` sao vazios |
| `emptyAsUndefined(s)` / `emptyAsNull(str)` / `undefinedAsEmpty(s)` / `nullAsEmpty(value)` | conversoes entre vazio, `undefined` e `null` |
| `toBoolean(value)` | `true` so para `'true'` ou `'s'` (case-insensitive) — ver gotcha 1 |
| `toPX(value)` | concatena `'px'` |
| `trim` / `ltrim` / `rtrim` | idem `String.prototype`, tolerando `undefined` |

### Formatacao de documento e contato

`formatCgcCpf(cgccpf)` decide pelo tamanho dos digitos: 11 → `toCPF`, 14 → `toCNPJ`. Tambem existem `toPhone(strPhone)`, `cesuraCpf(cpf)` e `cesuraCnpj(cnpj)` (quebra em grupos), e `isValidEmail(value)`.

### Texto

| Metodo | Nota |
|---|---|
| `substitute(format, args)` | `'{0} de {1}'` ou `'{nome}'`; `args` e objeto **ou** varargs. Nao toca em `{{...}}`, entao e seguro em template com bind Angular |
| `newBuffer()` | `StringBuilder`: `append(x)` encadeavel, `toString()`, `length()`, `clear()` |
| `stringZero(value, width, truncOverFlow)` | left-pad com zeros; estourando `width` e com `truncOverFlow` (default `true`) devolve `'*'` repetido |
| `padStart` / `padEnd` / `replicate(str, count)` / `insertAt(str, newStr, index)` | |
| `toDashCase(value)` | `MinhaEntidade` → `minha-entidade` (o linker do dynaform usa isso) |
| `toCapitalCase(value, all)` | |
| `buildNick(name)` | primeiras 3 letras |
| `startsWith` / `contains(data, characters)` / `replaceAll(str, de, para)` | |
| `replaceAccentuatedChars` / `removeSpecialCharacters` / `getSpecialCharacters` / `hasAccentuationOrWhiteSpace` | |
| `htmlScape` / `toHtmlText` / `replaceHtmlEntities` / `containsHtml` / `barScape` | |
| `textToColor(str)` | cor deterministica a partir do texto (avatar, tag) |
| `getOnlyFieldName(fullPath)` | ultimo segmento de `ENTIDADE.CAMPO` |
| `isDelimitersBalanced(str, open, close)` | |
| `nextUid()` | id incremental curto (o mesmo dos componentes) |
| `compareFunction(v1, v2, ascending)` | comparador pronto para `Array.sort` |
| `expandHierarchyMask(mask)` / `applyHierarchyMask(mask, value, removeEmptyGroups, fromLeft, defaultChar)` | mascara de codigo hierarquico (plano de contas, centro de resultado) |

## NumberUtils

core/util/number/numberutil.service.js. Formatacao via `numeral`, locale do produto.

| Metodo | Nota |
|---|---|
| `format(value, precision, prettyPrecision)` | mascara `0,0` + casas; `prettyPrecision > -1` corta zeros a direita ate esse limite |
| `formatWithoutThousandSeparator(value, precision, prettyPrecision)` | igual, sem separador de milhar |
| `stringToNumber(value)` | parse pt-BR — ver gotcha 2 |
| `formatNumber(value, acceptDecimals)` | limpa o que nao for digito (e `.`/`,` quando aceita decimais) |
| `getNumberOrDefault(value, def)` / `getNumberOrZero(value)` / `getNumberOrNull(value)` | |
| `round(value, decimals)` | arredondamento por notacao exponencial (evita o erro de ponto flutuante do `toFixed`) |
| `add(n1, n2, scale = 2)` | soma ja arredondada; `NaN` conta como `0` |
| `compareNumber(o1, o2, ascending = true)` | comparador para `sort`, com `undefined` no fim |
| `isNumeric` / `isInt` / `isFloat` | aceitam string (passam por `stringToNumber`) |
| `bytesToSize(bytes)` | `'1 MB'` |
| `decimalToHex` / `hexToDecimal` | |
| `isScientificNotation(value)` / `cientificNotationToStrNumber(value)` / `getScientificNotationFormatted(value, precision)` | |

## DateUtils e DateUtilsConstants

core/util/date/dateutil.service.js, dateutil.constant.js. Wrapper de `moment` — os formatos sao **tokens do moment** (`DD/MM/YYYY`), nao do filtro `date` do Angular.

### Constantes

| Constante | Valor |
|---|---|
| `DEFAULT_DATE_FORMAT` | `'DD/MM/YYYY'` |
| `DEFAULT_DATETIME_FORMAT` | `'DD/MM/YYYY HH:mm:ss'` |
| `DEFAULT_DATETIME_FORMAT_IGNORE_SECONDS` | `'DD/MM/YYYY HH:mm'` |
| `DEFAULT_TIME_FORMAT` | `'HH:mm:ss'` |
| `DEFAULT_DATE_US_FORMAT` | `'YYYY-MM-DD'` |
| `DEFAULT_DATE_MONTH_FORMAT` | `'MM/yyyy'` |
| `GREGORIAN_DATE_FORMAT` | `'YYYY-MM-DD HH:mm:ss.S'` |
| `MOMENT_LANG_PT_BR` | meses, dias e formatos longos em pt-BR |

`DateUtils.UNIT`: `DAYS`, `MONTHS`, `YEARS`, `MINUTES`, `HOURS`.

### Metodos

| Metodo | Nota |
|---|---|
| `getToday(doClearTime)` | sem argumento **zera a hora**; `getToday(false)` mantem |
| `clearTime(date)` / `clearSeconds(date)` | `startOf('day')` / `startOf('minutes')` |
| `formatDate(date, format, inputFormat)` | default `DEFAULT_DATE_FORMAT`; devolve `undefined` se a data for invalida |
| `dateToString(date, formatOutput)` | so aceita `Date` (senao `undefined`) |
| `stringToDate(dateStr)` / `stringToDateTime(dateStr, formato)` | parse com os formatos default |
| `strToDate(strValue, adjustDayLightSavingTime, modeMonthYear)` | parse com tratamento de horario de verao; `modeMonthYear` aceita `MM/YYYY` e devolve o dia 1 |
| `parse(input, format, baseDate)` | parser proprio, por formato |
| `isValidDate(date, inputFormat)` | |
| `add(dt, qtd, unit)` / `subtract(dt, qtd, unit)` | `unit` default `days` |
| `diff(date, date2, unit)` | `date - date2`, default em dias |
| `diffWithToday(date, unit)` | `date - hoje` |
| `getFirstDay(dt)` / `getLastDay(dt)` | primeiro/ultimo dia do mes |
| `weekGetFirstDay(dt)` / `weekGetLastDay(dt)` | idem para a semana |
| `isLastDayOfMonth(date)` | |
| `getYear()` / `getMonth()` | do momento atual |
| `getOneYearAgo()` | |
| `compare(d1, d2, ascending)` / `compareOnlyDate(dt1, dt2)` | comparadores para `sort`; o segundo ignora hora |
| `setTime(date, time)` / `extractTimeFromDate(date, unlimitedHour, minutesIsPriority)` | |
| `timestampToDate(timestamp)` / `timeConverter(timestamp)` | |
| `milisegundosToHHmmss` / `milisegundosToHHmmssMMM` / `milisegundosTommssMM` / `getTimeFormattedFromMilis` | duracao a partir de milissegundos |
| `minutes2Time(minutes)` / `getMinutes(time)` / `getTimeFormatterFromMinutes(minutes)` | |
| `sortValueForDate(unordered)` | |

## ArrayUtils

core/util/array/arrayutil.service.js.

| Metodo | Nota |
|---|---|
| `toArray(arr)` | `undefined` → `[]`, string → `split(',')`, escalar → `[x]` |
| `isNotEmpty(arr)` / `isIn(arr, obj)` | |
| `find(arr, checkerFn)` / `findIndex(arr, checkerFn)` | |
| `findWhere(array, whereObj)` | **nao funciona** — ver gotcha 3 |
| `indexOf(arr, obj, forceRemove)` / `removeReference(array, obj, forceRemove)` / `removeAtIndex(array, index)` | |
| `insertAtIndex(array, index, value)` / `pushAll(src, items)` / `pushIfNotFound(arr, obj, checkerFn)` | |
| `sortByProperty(array, property, sortFn)` | `property` aceita path aninhado (usa `ObjectUtils.getProperty`) |
| `sortByStringProperty` / `sortByNumberProperty` | |
| `sortArrayFromArray(array, orderArray, valueGetter)` | ordena seguindo a ordem de outro array |
| `reverse(originalList)` / `copy(arr, deep)` / `normalizeArray(array)` | |
| `forEach(arr, fn)` / `callEachFunctionWith(arr)` | |
| `arrayToString(array)` | |

## ObjectUtils

core/util/object/objectutil.service.js.

| Metodo | Nota |
|---|---|
| `getProperty(obj, path, testFlatPaths, pathSeparator)` | path aninhado (`'a.b.c'`), separador configuravel |
| `setProperty(obj, path, value, pathSeparator)` / `setPropetyWithHierarchy(obj, path, value)` | cria os niveis intermediarios |
| `removeProperty(obj, path, pathSeparator)` / `getAsArray(obj, path, ...)` | |
| `isEmpty(obj)` / `sizeOf(object)` / `getEmptyAsUndefined(obj)` | |
| `equals(obj1, obj2)` | compara `JSON.stringify` — ordem das chaves importa |
| `clone(obj)` | copia **rasa**; nao serve para `Date` (gotcha 4) |
| `cloneJSON(obj)` | copia profunda via JSON (perde `Date`, `undefined`, funcao) |
| `defaultValues(obj, defaultValues)` / `entries(obj)` / `forEachInObject(obj, callback)` / `filterOnObject(obj, predicate)` | |
| `defineProperty(obj, key, handler, value)` / `bindProperty(src, srcProp, dest, destProp)` | |
| `buildPublicAPI(source, methods)` / `buildPublicAPIFromObject(source)` | expor so parte do controller como api (`sk-api`) |
| `objectToHash(obj)` / `valueFn(value)` / `getFunctionFromObject(template, obj)` | |
| `implements(objInstance, implementor, defValues)` / `extend(...)` / `isImplementorOf(obj, implementor)` | contrato de interface do framework — implementacao parcial **lanca**, ver [gotchas.md](gotchas.md) secao 14 |

## SkConstants

core/util/constant/constant.constant.js. Constante (nao service): injete e leia.

- `KEY_CODE`: `ENTER: 13`, `ESCAPE: 27`, `SPACE: 32`, `TAB: 9`, `BACKSPACE: 8`, `DELETE: 46`, `LEFT_ARROW: 37`, `UP_ARROW: 38`, `RIGHT_ARROW: 39`, `DOWN_ARROW: 40`, `HOME: 36`, `END: 35`, `CTRL: 17`, `ALT: 18`, `COMMAND: 91`, `PLUS: 107`, `MINUS: 109`.
- `EVENTS`: `RESIZE`, `DESTROY` (`'$destroy'`), `SCROLL`, `KEY_DOWN`, `FOCUS`, `BLUR`, `SWIPE_LEFT`, `SWIPE_RIGHT`.
- `MOUSE` / `TOUCH`: nomes dos eventos DOM.
- `MEDIA` e `MEDIA_PRIORITY`: media queries do produto (`sm`, `gt-sm`, `md`, `gt-md`, `lg`, `gt-lg`).
- `KEY_MAP`, `SQL`: operadores usados na montagem de criteria (`AND`, `OR`, `IN`, `LIKE`, `LIKE_START`, `LIKE_END`, `NULL`, `NOT_NULL`, `=`, `<>`, `>`, `>=`, `<`, `<=`).

```javascript
element.bind(SkConstants.EVENTS.KEY_DOWN, function (evt) {
    if (evt.which === SkConstants.KEY_CODE.ENTER) { self.confirmar(); }
});
```

## Base64

core/util/encode/base64.service.js. `encode(input, isUTF8)`, `decode(input, isUTF8)`, `encodeToBinary(string)`. Ver gotcha 5 — o `isUTF8` nao tem o default que a assinatura sugere.

## ClipboardUtils

core/util/clipboard/clipboard.service.js.

- `copyTextToClipboard(text)` — copia direto (textarea oculta + `execCommand`).
- `bind(target, getText)` — liga um elemento a uma funcao que produz o texto; devolve a instancia do `Clipboard` para voce destruir quando quiser.

`AngularUtil.sendTextToClipboard(text, element)` faz o mesmo a partir de um elemento.

## UrlUtils

core/util/url/urlutil.service.js.

| Metodo | Nota |
|---|---|
| `getQueryParams(qs)` | objeto com os parametros; ja faz `unescape` e `decodeURIComponent` |
| `getUrlBase()` | `protocolo//host[:porta]` |
| `getPkObject(pkHash)` | decodifica o hash Base64 da URL para o objeto de PK |
| `getTokenParam(token, pos)` / `getPkHashFromToken(token)` / `getResourceIDFromToken(token)` / `getQueryParamsFromToken(token)` | leitura do token de rota da tela |

## SqlUtils

core/util/sql/sqlutil.service.js. Montagem de fragmento SQL — o SQL de negocio continua sendo do backend (ver [code-quality.md](code-quality.md)).

| Metodo | Nota |
|---|---|
| `buildINClause(alias, fieldName, list)` | devolve `' IN ( ... )'`, quebrando em blocos de **1000** valores unidos por `OR <alias>.<campo> IN (...)`. O primeiro `<alias>.<campo>` **nao** vem no retorno — concatene antes |
| `buildINClauseByValues(fieldName, parameters)` | mesma quebra, ja com o campo e envolto em parenteses |
| `loadFromQuery(columnsName, tableName, whereOrderGroup, fullLine)` | monta e executa um `SELECT`; devolve promise |
| `checkifExistWordInQuery(query, word)` / `getParamsFromQuery(query, word)` / `getDefaultNamedParamsObject(arrayParams)` | inspecao de query com parametros nomeados |

## SessionFileUpload

core/util/sessionfileupload/sessionfileupload.service.js. E o motor do [`sk-file-input`](inputs.md#sk-file-input).

| Metodo | Nota |
|---|---|
| `uploadSessionFile(fileKey, file, fnCreateHttp)` | envia via `XMLHttpRequest` + `FormData` (campo `arquivo`); devolve promise. `fnCreateHttp` recebe o `XMLHttpRequest` para voce assinar `progress` ou abortar |
| `clearSessionFile(fileKey)` | descarta o arquivo da sessao |
| `openCustomSessionUpload(fileKey, onUpload, properties)` | abre a janela de upload do produto |

O backend recupera o arquivo pela mesma `fileKey` — no dataset ela viaja como `$file.session.key{<fileKey>}`.

## UidGenerator

core/util/uid/uidGenerator.service.js. `generateUID(prefix)` — default `'uid_'`, base no timestamp e incremental dentro da sessao. Para id de elemento dentro de componente, `StringUtils.nextUid()` tambem serve.

## AngularUtil

core/util/angular/angularutil.service.js. Os mais uteis numa tela de addon:

| Metodo | Nota |
|---|---|
| `debounce(action, delay, scope, invokeApply)` | devolve funcao debounced que resolve promise; `delay` default `10` |
| `timeout(handler, millis, apply)` | `$timeout` com `apply` **`false`** por default — nao dispara digest |
| `interval(handler, millis, apply)` / `cancelTimeout(timer)` / `cancelInterval(interval)` | |
| `apply(scope, applyFn)` / `digest(scope)` / `wrapApply(scope, action, context)` | digest seguro |
| `addSingleWatch($scope, property, callback)` | watch que dispara **uma vez** (no primeiro valor truthy) e se desregistra |
| `addConditionalRemoveWatch(scope, prop, fnListener, fnCondition)` | watch que se remove quando a condicao bate |
| `onDestroyScope(scope, fn)` | atalho para `$on('$destroy')` |
| `addWindowResizeHandler(handler, scope, debounceValue)` | resize ja debounced e desregistrado no destroy |
| `compile(element, scope)` / `getControllerFromElement(element)` | |
| `setFocusOnInput(input)` | ignora mobile |
| `addNumberOnlyParser(ngModelCtrl)` / `addRegexOnlyParser(ngModelCtrl, expression)` | parsers dos inputs |
| `isPromise(obj)` / `isDeffered(obj)` / `syncPromise(src, dest)` / `timeoutPromise(defer, millis, callback, apply)` | |
| `xmlToJson` / `xmlStringToJson` / `jsonToXml` / `objToXML` / `buildXmlFromString` | conversao XML usada nas integracoes do produto |

---

## Gotchas

1. **`StringUtils.toBoolean` so aceita `'true'` e `'s'`**. `toBoolean(1)`, `toBoolean('S ')` (com espaco), `toBoolean('sim')` e `toBoolean('yes')` devolvem `false`. Vindo do backend como `'S'`/`'N'` funciona; vindo como `0`/`1` nao.

2. **`NumberUtils.stringToNumber` le ponto isolado como decimal**. `'1.234'` → `1.234`; o ponto so vira separador de milhar quando ha virgula depois (`'1.234,56'` → `1234.56`). Valor que chegou formatado do backend com milhar e sem decimais e corrompido no parse.

3. **`ArrayUtils.findWhere` sempre devolve `undefined`**. O loop interno e `for (var whereKey in whereKey)` — itera sobre a propria variavel (`undefined`), nunca sobre `whereObj`, entao o corpo nao executa. Use `ArrayUtils.find(arr, fn)`. Isso tambem explica por que `current-step` do `sk-wizard` nao localiza o step ([wizard.md](wizard.md)).

4. **`ObjectUtils.clone` e raso e quebra com `Date`**. Faz `obj.constructor()` e copia as own properties: para `Date`, `Date()` sem `new` devolve **string**, e `Date` nao tem own property — o retorno e a data atual em texto. Para data, `new Date(d.getTime())`; para copia profunda, `cloneJSON` (que por sua vez converte `Date` em string ISO).

5. **`Base64.encode(x)` nao aplica UTF-8**. O service define `encode` duas vezes; a segunda (`encode(input, isUTF8)`) sobrescreve a primeira, entao a chamada com um argumento so passa `isUTF8 === undefined` e pula o `_utf8_encode`. Texto acentuado exige `Base64.encode(texto, true)`. O mesmo vale para `decode`.

6. **`AngularUtil.timeout` nao dispara digest**. O terceiro argumento default e `false` (o `$timeout` do Angular usa `true`). Mudanca de escopo feita dentro dele so aparece na tela no proximo ciclo — passe `true` quando o efeito for visual e nao houver outro digest a caminho.

7. **`SqlUtils.buildINClause` devolve a clausula sem o primeiro campo**. O retorno comeca em `' IN ( '` e so repete `<alias>.<campo>` a partir do segundo bloco de 1000 valores. Escrever `where += SqlUtils.buildINClause('PAR', 'CODPARC', ids)` sem prefixar `PAR.CODPARC` gera SQL invalido.

8. **`ObjectUtils.equals` depende da ordem das chaves**. E `JSON.stringify(a) === JSON.stringify(b)`: dois objetos com o mesmo conteudo em ordem diferente sao "diferentes". Para comparar registro editado com o original, compare campo a campo ou normalize antes.

9. **`DateUtils.getToday()` zera a hora**. Sem argumento, `doClearTime` vira `true`. Para carimbar hora corrente, `getToday(false)`. Consequencia: `diffWithToday` compara contra meia-noite de hoje.

10. **Os formatos sao do moment, nao do Angular**. `DateUtils.formatDate(d, 'dd/MM/yyyy')` nao devolve `01/01/2026` — em moment, `dd` e dia da semana abreviado e `yyyy` nao e token de ano. Use `DateUtilsConstants.DEFAULT_DATE_FORMAT` (`'DD/MM/YYYY'`) ou o token correto.
