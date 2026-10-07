import type { Register, EngineInterface, HookFailure, ToolCallResult } from 'claude-code'
import { isInAddonProject, parentOf } from './commons.ts'

// Avisa o modelo, sem bloquear, quando o código gravado em projeto Addon Studio viola regra
// documentada nas skills. Toda regra cita a origem: regra sem origem nas skills não entra.
// No Edit só o new_string é verificado, para não repetir violação que já estava no arquivo.

type Rule = {
  pattern: RegExp
  message: string
  source: string
  // A regra só vale quando o texto verificado também casa isto (ex.: é um @Controller).
  onlyWith?: RegExp
}

const JAVA_FILE = /\.java$/
// encoding/SKILL.md restringe o cabeçalho obrigatório ao XML de dicionário e dbscripts.
const HEADER_XML_FILE = /[\\/](dbscripts|datadictionary)[\\/][^\\/]*\.xml$/
const XML_DECLARATION_WITH_ENCODING = /^\s*<\?xml[^?]*\bencoding\s*=/i

const ADDON = 'init/assets/ADDON.md'
const USE_LOG = 'use `@Log` Lombok + `java.util.logging`'
const USE_GUICE_INJECT = 'use `com.google.inject.Inject`'

// A regra Java 8 estrito do ADDON.md proíbe o que não existe no Java 8; a lista dela é exemplo, não o limite.
// Fica de fora o símbolo Java 9+ cujo nome também existe no Java 8 ou em lib comum
// (`Optional.isEmpty`, `.or(`, `.lines()`, `.transferTo(`, `getFirst()`, `.reversed()`).
const notInJava8 = (pattern: RegExp, symbol: string, version: number, instead?: string): Rule => ({
  pattern,
  message: `${symbol} é Java ${version}+ (projeto é Java 8 estrito)${instead === undefined ? '' : ` — use ${instead}`}`,
  source: ADDON,
})

const JAVA_8_RULES: Rule[] = [
  notInJava8(/\bvar\s+[A-Za-z_$][\w$]*\s*[=:,)]/g, '`var`', 10),
  notInJava8(/\b(?:List|Set|Map)\.(?:of|copyOf)\s*\(/g, '`List`/`Set`/`Map` `.of`/`.copyOf`', 9, '`Arrays.asList`/`Collections.unmodifiable*`'),
  notInJava8(/\bMap\.(?:ofEntries|entry)\s*\(/g, '`Map.ofEntries`/`Map.entry`', 9, '`new AbstractMap.SimpleEntry<>(k, v)`'),
  notInJava8(/\.isBlank\(\s*\)/g, '`String.isBlank()`', 11, '`trim().isEmpty()`'),
  notInJava8(/\.strip(?:Leading|Trailing|Indent)?\(\s*\)/g, '`String.strip*()`', 11, '`trim()`'),
  notInJava8(/(?<!\b(?:StringUtils|Strings))\.repeat\s*\(/g, '`String.repeat`', 11),
  notInJava8(/\.(?:indent|formatted)\s*\(|\.translateEscapes\(\s*\)/g, '`String.indent`/`formatted`/`translateEscapes`', 12, '`String.format`'),
  notInJava8(/(?<!\bCollectors)\.toList\(\s*\)/g, '`Stream.toList()`', 16, '`collect(Collectors.toList())`'),
  notInJava8(/\.(?:takeWhile|dropWhile)\s*\(|\bStream\.ofNullable\s*\(/g, '`takeWhile`/`dropWhile`/`Stream.ofNullable`', 9),
  notInJava8(/\.mapMulti\s*\(/g, '`Stream.mapMulti`', 16),
  notInJava8(/\btoUnmodifiable(?:List|Set|Map)\s*\(|\bCollectors\.(?:filtering|flatMapping|teeing)\s*\(/g, '`Collectors` `toUnmodifiable*`/`filtering`/`flatMapping`/`teeing`', 9),
  notInJava8(/\.orElseThrow\(\s*\)/g, '`orElseThrow()` sem argumento', 10, '`orElseThrow(Supplier)`'),
  notInJava8(/\.ifPresentOrElse\s*\(/g, '`Optional.ifPresentOrElse`', 9),
  notInJava8(/\bPredicate\.not\s*\(/g, '`Predicate.not`', 11),
  notInJava8(/\bObjects\.(?:requireNonNullElse(?:Get)?|checkIndex|checkFromToIndex|checkFromIndexSize)\s*\(/g, '`Objects.requireNonNullElse`/`check*Index`', 9),
  notInJava8(/\bFiles\.(?:readString|writeString)\s*\(|\bPath\.of\s*\(/g, '`Files.readString`/`writeString`/`Path.of`', 11, '`Paths.get` e `Files.readAllBytes`/`write`'),
  notInJava8(/\.readAllBytes\(\s*\)|\.readNBytes\s*\(/g, '`InputStream.readAllBytes()`/`readNBytes`', 9),
  notInJava8(/\.(?:orTimeout|completeOnTimeout)\s*\(|\bCompletableFuture\.(?:failedFuture|delayedExecutor|completedStage|failedStage)\s*\(/g, '`CompletableFuture` timeout/`failedFuture`', 9),
  notInJava8(/\bMath\.clamp\s*\(/g, '`Math.clamp`', 21),
  notInJava8(/\b(?:ProcessHandle|StackWalker|VarHandle|HexFormat)\b|^[ \t]*import\s+java\.net\.http\./gm, '`ProcessHandle`/`StackWalker`/`VarHandle`/`HexFormat`/`java.net.http`', 9),
  notInJava8(/\bThread\.(?:ofVirtual|ofPlatform|startVirtualThread)\s*\(|\bnewVirtualThreadPerTaskExecutor\s*\(/g, 'virtual thread', 21),
  notInJava8(/@Deprecated\s*\(/g, '`@Deprecated(since/forRemoval)`', 9, '`@Deprecated` sem argumento'),
  notInJava8(/\bnew\s+[\w$.]+\s*<>\s*\((?:[^()]|\([^()]*\))*\)\s*\{/g, 'diamond `<>` em classe anônima', 9, 'o tipo explícito em `new X<Tipo>() {`'),
  notInJava8(/\btry\s*\(\s*[\w$.]+\s*[;)]/g, 'try-with-resources com variável já declarada', 9, '`try (Tipo nome = ...)`'),
  notInJava8(/\bcase\b[^:;{}]*->|\bdefault\s*->/g, '`switch` com `->`', 14, '`case X:` com `break`'),
  notInJava8(/(?<![.\w$])yield\s+[\w$"'(-]/g, '`yield` em switch', 14),
  notInJava8(/\binstanceof\s+(?:final\s+)?[\w$.]+(?:<[^>]*>)?(?:\[\])*(?:\s+[A-Za-z_$][\w$]*\b|\s*\()/g, 'pattern matching em `instanceof`', 16, 'cast explícito depois do `instanceof`'),
  notInJava8(/\brecord\s+[A-Z][\w$]*\s*[(<]/g, '`record`', 16, 'classe com Lombok `@Data`'),
  notInJava8(/\b(?:non-)?sealed\s+(?:abstract\s+|static\s+)*(?:class|interface)\b/g, '`sealed`', 17),
  notInJava8(/"""/g, 'text block', 15),
  notInJava8(/^[ \t]*(?:open\s+)?module\s+[\w.]+\s*\{/gm, '`module-info`', 9),
]

const JAVA_RULES: Rule[] = [
  ...JAVA_8_RULES,
  {
    pattern: /^[ \t]*import\s+(?:javax|jakarta)\.persistence\./gm,
    message: 'JPA padrão — use `@JapeEntity` e as anotações de `br.com.sankhya.studio.persistence`',
    source: ADDON,
  },
  {
    pattern: /\b(?:JapeWrapper|EntityFacade)\b/g,
    onlyWith: /@Controller\b/,
    message: '`JapeWrapper`/`EntityFacade` direto em controller — use interface estendendo `JapeRepository`',
    source: ADDON,
  },
  { pattern: /^[ \t]*import\s+javax\.inject\./gm, message: `\`javax.inject\` — ${USE_GUICE_INJECT}`, source: `${ADDON}, dependency-injection/SKILL.md` },
  { pattern: /^[ \t]*import\s+org\.slf4j\./gm, message: `SLF4J — ${USE_LOG}`, source: ADDON },
  { pattern: /@Slf4j\b/g, message: `SLF4J — ${USE_LOG}`, source: ADDON },
  { pattern: /\bSystem\.out\b/g, message: `\`System.out\` — ${USE_LOG}`, source: `${ADDON}, job/SKILL.md` },
  {
    pattern: /\bthrow\s+new\s+RuntimeException\s*\(/g,
    message: '`RuntimeException` cru — lance exceção tipada estendendo `RuntimeException` com mensagem de negócio',
    source: `${ADDON}, listener/SKILL.md`,
  },
  {
    pattern: /@Service\b/g,
    message: '`@Service` é legado — endpoint é `@Controller`, service de negócio é `@Component`',
    source: 'controller/SKILL.md',
  },
  {
    pattern: /@Component\b/g,
    onlyWith: /@(?:Controller|Repository)\b/,
    message: '`@Controller`/`@Repository` já são gerenciados — não adicione `@Component`',
    source: 'dependency-injection/SKILL.md, controller/SKILL.md',
  },
  {
    pattern: /\bTxType\.SUPPORTS\b/g,
    message: '`TxType.SUPPORTS` não existe — omita `@Transactional` (o método herda `Supports` da classe)',
    source: 'controller/SKILL.md',
  },
  {
    pattern: /^[ \t]*import\s+[\w.]+\.transaction\.Transactional\s*;/gm,
    message: 'import errado de `@Transactional` — use `br.com.sankhya.studio.persistence.Transactional`',
    source: 'job/SKILL.md',
  },
  {
    pattern: /^[ \t]*import\s+[\w.]+\.stereotypes\.Job\s*;/gm,
    message: 'import errado de `@Job` — use `br.com.sankhya.studio.annotations.Job`',
    source: 'job/SKILL.md',
  },
  {
    pattern: /\bimplements\s+(?:[\w.<>]+\s*,\s*)*IJob\b/g,
    message: '`IJob` é classe abstrata — use `extends IJob`',
    source: 'job/SKILL.md',
  },
  { pattern: /@Job\s*\([^)]*\bname\s*=/g, message: '`@Job(name = ...)` — use `@Job(serviceName = ...)`', source: 'job/SKILL.md' },
  {
    pattern: /\bString\s+getScheduleConfigHook\s*\(/g,
    message: 'frequência vem de `getScheduleConfig()` — `getScheduleConfigHook()` é obsoleto',
    source: 'job/SKILL.md',
  },
  {
    pattern: /\bTransactionType\.REQUIRES_NEW\b/g,
    message: '`TransactionType.REQUIRES_NEW` não existe — use `AUTOMATIC` ou `MANUAL`',
    source: 'action-button/SKILL.md',
  },
  { pattern: /\bFieldType\.CHECKBOX\b/g, message: '`FieldType.CHECKBOX` não existe — use `FieldType.BOOLEAN`', source: 'action-button/SKILL.md' },
  {
    pattern: /\bRefreshTypeEnum\.(?:ALL|ITEM)\b/g,
    message: '`RefreshTypeEnum.ALL`/`ITEM` não existem — use `ALL_ITEMS`/`NONE_ITEM`',
    source: 'action-button/SKILL.md',
  },
  {
    pattern: /@Callback\s*\((?=[^)]*\bAFTER\b)(?=[^)]*\bPROCESS_BILLING\b)/g,
    message: '`PROCESS_BILLING` só existe com `BEFORE`',
    source: 'callback/SKILL.md',
  },
  {
    pattern: /@ExceptionHandler\s*\(\s*(?:value\s*=\s*)?\{?\s*Exception\.class\s*\}?\s*\)/g,
    message: '`@ExceptionHandler(Exception.class)` pega-tudo — declare exceções específicas',
    source: 'controller-advice/SKILL.md',
  },
  {
    pattern: /@ExceptionHandler\s*\(\s*(?:value\s*=\s*)?\{\s*\}\s*\)/g,
    message: '`@ExceptionHandler({})` vazio — declare ao menos uma classe',
    source: 'controller-advice/SKILL.md',
  },
  {
    pattern: /\bfindByPK\s*\((?:[^()]|\([^()]*\))*\)\s*\.\s*(?:orElseThrow|map)\s*\(/g,
    message: '`findByPK` retorna `T` nullable, não `Optional` — use null-check',
    source: 'repository/SKILL.md',
  },
  { pattern: /@Delete\b/g, message: '`@Delete` descontinuada — use `@Modifying` + `@NativeQuery`', source: 'repository/SKILL.md' },
  {
    pattern: /@Modifying\b[^;{}]*?\bint\s+[\w$]+\s*\(/g,
    message: '`@Modifying` retornando `int` — use `void` ou `Boolean`',
    source: 'repository/SKILL.md',
  },
  {
    pattern: /^[ \t]*import\s+br\.com\.sankhya\.sdk\.data\.repository\.NativeQuery\s*;/gm,
    message: 'import errado de `@NativeQuery` — use `br.com.sankhya.studio.persistence.NativeQuery`',
    source: 'repository/SKILL.md',
  },
  {
    pattern: /\bPageable\.of\s*\(/g,
    message: '`Pageable` não tem factory — use `PageRequest.of(...)`',
    source: 'repository/SKILL.md',
  },
  {
    pattern: /\.getTotal(?:Elements|Pages)\s*\(/g,
    message: '`Page<T>` não tem total — use `hasNext()`/`isLast()` ou `COUNT` próprio',
    source: 'repository/SKILL.md',
  },
  {
    pattern: /^[ \t]*import\s+br\.com\.sankhya\.jape\.util\.JdbcWrapper\s*;/gm,
    message: 'import errado — use `br.com.sankhya.jape.dao.JdbcWrapper`',
    source: 'listener/SKILL.md',
  },
  {
    pattern: /\bDynamicVO\s+[\w$]+\s*=\s*[\w$.]+\.getVo\s*\(\s*\)/g,
    message: '`getVo()` sem cast — use `(DynamicVO) event.getVo()`',
    source: 'listener/SKILL.md',
  },
  {
    pattern: /@Value\s*\([^)]*\)\s*(?:@[\w.]+(?:\([^)]*\))?\s*)*(?:(?:private|protected|public|static)\s+)*final\s+(?!class\b)/g,
    message: 'campo `final` com `@Value` — remova o `final`',
    source: 'value/SKILL.md',
  },
  {
    pattern: /@Value\s*\((?=[^)]*\bvalue\s*=)(?=[^)]*\bparam\s*=)/g,
    message: '`@Value` com `value` e `param` juntos — use só `param`',
    source: 'value/SKILL.md',
  },
  {
    pattern: /@Value\s*\((?=[^)]*\bgroup\s*=)(?=[^)]*\b(?:ENV_VAR|SYSTEM_PROPERTY)\b)/g,
    message: '`group` só funciona com `SANKHYA_PARAM`',
    source: 'value/SKILL.md',
  },
]

const XML_RULES: Rule[] = [
  {
    pattern: /<\?xml[^?]*\bencoding\s*=\s*["'](?!ISO-8859-1["'])/gi,
    message: 'cabeçalho XML com encoding diferente — use `<?xml version="1.0" encoding="ISO-8859-1" ?>`',
    source: 'encoding/SKILL.md',
  },
]

type Finding = { line: number; message: string; source: string }

const missingXmlHeader: Finding = {
  line: 1,
  message: 'XML sem cabeçalho obrigatório `<?xml version="1.0" encoding="ISO-8859-1" ?>`',
  source: 'encoding/SKILL.md',
}

// Troca o conteúdo de comentários e literais por espaço, mantendo as quebras de linha, para o
// regex não casar texto que não é código. A abertura do text block fica: a regra dele é o `"""`.
const blankNonCode = (source: string) => {
  const blank = (text: string) => text.replace(/[^\n]/g, ' ')
  return source.replace(
    /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)|"""[\s\S]*?(?:"""|$)|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?/g,
    token => {
      if (token.startsWith('"""')) return `"""${blank(token.slice(3))}`
      if (token.startsWith('"') || token.startsWith("'")) return token[0] + blank(token.slice(1))
      return blank(token)
    },
  )
}

const lineAt = (text: string, index: number) => text.slice(0, index).split('\n').length

const violations = (text: string, rules: Rule[]): Finding[] =>
  rules
    .filter(rule => rule.onlyWith === undefined || rule.onlyWith.test(text))
    .flatMap(({ pattern, message, source }) => [...text.matchAll(pattern)].map(match => ({ line: lineAt(text, match.index), message, source })))
    .sort((a, b) => a.line - b.line)

const javaViolations = (text: string) => violations(blankNonCode(text), JAVA_RULES)

const writeViolations = (filePath: string, content: string) => {
  if (JAVA_FILE.test(filePath)) return javaViolations(content)
  if (!HEADER_XML_FILE.test(filePath)) return []
  const header = XML_DECLARATION_WITH_ENCODING.test(content) ? [] : [missingXmlHeader]
  return [...header, ...violations(content, XML_RULES)]
}

const editViolations = (filePath: string, newString: string) => {
  if (JAVA_FILE.test(filePath)) return javaViolations(newString)
  return HEADER_XML_FILE.test(filePath) ? violations(newString, XML_RULES) : []
}

const report = (where: string, found: Finding[]) =>
  [
    `source-lint: ${where} viola regra das skills do addon-studio (aviso; corrija se a violação for sua):`,
    ...found.map(({ line, message, source }) => `- linha ${line}: ${message} [${source}]`),
  ].join('\n')

const readIfExists = ($: EngineInterface) => async (path: string) =>
  (await $.fs.exists(path)) ? await $.fs.read(path) : undefined

const lintAfter = async ($: EngineInterface, ran: ToolCallResult, filePath: string, lint: () => Finding[], where: string) => {
  if (ran.deny !== undefined || ran.isError) return ran
  const found = lint()
  if (found.length === 0) return ran
  if (!(await isInAddonProject(parentOf(filePath), readIfExists($)))) return ran
  return { ...ran, context: [...(ran.context ?? []), report(where, found)] }
}

// O arquivo já foi gravado quando o lint roda: falha dele vira aviso, não derruba a tool.
const reportFailure = (filePath: string, error: HookFailure, ran: ToolCallResult) =>
  ran.deny !== undefined
    ? ran
    : {
        ...ran,
        context: [...(ran.context ?? []), `source-lint: hook falhou em "${filePath}" (${error.message ?? error.kind}) -- arquivo gravado sem verificação das regras das skills.`],
      }

export const register: Register = on => {
  on('tool.call', { tool: 'Write' }, async ($, e, next) =>
    lintAfter($, await next(e), e.file_path, () => writeViolations(e.file_path, e.content), `"${e.file_path}"`),
  ).catch(async ($, e, next) => reportFailure(e.file_path, next.error, await next(e)))
  on('tool.call', { tool: 'Edit' }, async ($, e, next) =>
    lintAfter($, await next(e), e.file_path, () => editViolations(e.file_path, e.new_string), `o trecho novo (new_string) de "${e.file_path}"`),
  ).catch(async ($, e, next) => reportFailure(e.file_path, next.error, await next(e)))
}
