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
// encoding/SKILL.md:27 restringe o cabeçalho obrigatório ao XML de dicionário e dbscripts.
const HEADER_XML_FILE = /[\\/](dbscripts|datadictionary)[\\/][^\\/]*\.xml$/
const XML_DECLARATION_WITH_ENCODING = /^\s*<\?xml[^?]*\bencoding\s*=/i

const ADDON = 'init/assets/ADDON.md'
const USE_LOG = 'use `@Log` Lombok + `java.util.logging`'
const USE_GUICE_INJECT = 'use `com.google.inject.Inject`'

const JAVA_RULES: Rule[] = [
  { pattern: /\bvar\s+[A-Za-z_$][\w$]*\s*[=:]/g, message: '`var` é Java 10+ (projeto é Java 8 estrito)', source: `${ADDON}:11` },
  { pattern: /\b(?:List|Set|Map)\.of\s*\(/g, message: '`List.of`/`Set.of`/`Map.of` é Java 9+ (projeto é Java 8 estrito)', source: `${ADDON}:11` },
  { pattern: /\.isBlank\(\s*\)/g, message: '`String.isBlank()` é Java 11+ (projeto é Java 8 estrito)', source: `${ADDON}:11` },
  { pattern: /(?<!\bCollectors)\.toList\(\s*\)/g, message: '`Stream.toList()` é Java 16+ — use `collect(Collectors.toList())`', source: `${ADDON}:11` },
  {
    pattern: /\.orElseThrow\(\s*\)/g,
    message: '`orElseThrow()` sem argumento é Java 10+ — use `orElseThrow(Supplier)`',
    source: `${ADDON}:11`,
  },
  { pattern: /\brecord\s+[A-Z][\w$]*\s*[(<]/g, message: '`record` é Java 16+ (projeto é Java 8 estrito)', source: `${ADDON}:11` },
  {
    pattern: /\b(?:non-)?sealed\s+(?:abstract\s+|static\s+)*(?:class|interface)\b/g,
    message: '`sealed` é Java 17+ (projeto é Java 8 estrito)',
    source: `${ADDON}:11`,
  },
  { pattern: /"""/g, message: 'text block é Java 15+ (projeto é Java 8 estrito)', source: `${ADDON}:11` },
  {
    pattern: /^[ \t]*import\s+(?:javax|jakarta)\.persistence\./gm,
    message: 'JPA padrão — use `@JapeEntity` e as anotações de `br.com.sankhya.studio.persistence`',
    source: `${ADDON}:13`,
  },
  {
    pattern: /\b(?:JapeWrapper|EntityFacade)\b/g,
    onlyWith: /@Controller\b/,
    message: '`JapeWrapper`/`EntityFacade` direto em controller — use interface estendendo `JapeRepository`',
    source: `${ADDON}:13`,
  },
  { pattern: /^[ \t]*import\s+javax\.inject\./gm, message: `\`javax.inject\` — ${USE_GUICE_INJECT}`, source: `${ADDON}:14, dependency-injection/SKILL.md:416` },
  { pattern: /^[ \t]*import\s+org\.slf4j\./gm, message: `SLF4J — ${USE_LOG}`, source: `${ADDON}:15` },
  { pattern: /@Slf4j\b/g, message: `SLF4J — ${USE_LOG}`, source: `${ADDON}:15` },
  { pattern: /\bSystem\.out\b/g, message: `\`System.out\` — ${USE_LOG}`, source: `${ADDON}:15, job/SKILL.md:336` },
  {
    pattern: /\bthrow\s+new\s+RuntimeException\s*\(/g,
    message: '`RuntimeException` cru — lance exceção tipada estendendo `RuntimeException` com mensagem de negócio',
    source: `${ADDON}:16, listener/SKILL.md:245`,
  },
  {
    pattern: /@Service\b/g,
    message: '`@Service` é legado — endpoint é `@Controller`, service de negócio é `@Component`',
    source: 'controller/SKILL.md:503',
  },
  {
    pattern: /@Component\b/g,
    onlyWith: /@(?:Controller|Repository)\b/,
    message: '`@Controller`/`@Repository` já são gerenciados — não adicione `@Component`',
    source: 'dependency-injection/SKILL.md:45, controller/SKILL.md:502',
  },
  {
    pattern: /\bTxType\.SUPPORTS\b/g,
    message: '`TxType.SUPPORTS` não existe — omita `@Transactional` (o método herda `Supports` da classe)',
    source: 'controller/SKILL.md:499',
  },
  {
    pattern: /^[ \t]*import\s+[\w.]+\.transaction\.Transactional\s*;/gm,
    message: 'import errado de `@Transactional` — use `br.com.sankhya.studio.persistence.Transactional`',
    source: 'job/SKILL.md:331',
  },
  {
    pattern: /^[ \t]*import\s+[\w.]+\.stereotypes\.Job\s*;/gm,
    message: 'import errado de `@Job` — use `br.com.sankhya.studio.annotations.Job`',
    source: 'job/SKILL.md:330',
  },
  {
    pattern: /\bimplements\s+(?:[\w.<>]+\s*,\s*)*IJob\b/g,
    message: '`IJob` é classe abstrata — use `extends IJob`',
    source: 'job/SKILL.md:329',
  },
  { pattern: /@Job\s*\([^)]*\bname\s*=/g, message: '`@Job(name = ...)` — use `@Job(serviceName = ...)`', source: 'job/SKILL.md:332' },
  {
    pattern: /\bString\s+getScheduleConfigHook\s*\(/g,
    message: 'frequência vem de `getScheduleConfig()` — `getScheduleConfigHook()` é obsoleto',
    source: 'job/SKILL.md:334',
  },
  {
    pattern: /\bTransactionType\.REQUIRES_NEW\b/g,
    message: '`TransactionType.REQUIRES_NEW` não existe — use `AUTOMATIC` ou `MANUAL`',
    source: 'action-button/SKILL.md:251',
  },
  { pattern: /\bFieldType\.CHECKBOX\b/g, message: '`FieldType.CHECKBOX` não existe — use `FieldType.BOOLEAN`', source: 'action-button/SKILL.md:253' },
  {
    pattern: /\bRefreshTypeEnum\.(?:ALL|ITEM)\b/g,
    message: '`RefreshTypeEnum.ALL`/`ITEM` não existem — use `ALL_ITEMS`/`NONE_ITEM`',
    source: 'action-button/SKILL.md:254',
  },
  {
    pattern: /@Callback\s*\((?=[^)]*\bAFTER\b)(?=[^)]*\bPROCESS_BILLING\b)/g,
    message: '`PROCESS_BILLING` só existe com `BEFORE`',
    source: 'callback/SKILL.md:225',
  },
  {
    pattern: /@ExceptionHandler\s*\(\s*(?:value\s*=\s*)?\{?\s*Exception\.class\s*\}?\s*\)/g,
    message: '`@ExceptionHandler(Exception.class)` pega-tudo — declare exceções específicas',
    source: 'controller-advice/SKILL.md:168',
  },
  {
    pattern: /@ExceptionHandler\s*\(\s*(?:value\s*=\s*)?\{\s*\}\s*\)/g,
    message: '`@ExceptionHandler({})` vazio — declare ao menos uma classe',
    source: 'controller-advice/SKILL.md:171',
  },
  {
    pattern: /\bfindByPK\s*\((?:[^()]|\([^()]*\))*\)\s*\.\s*(?:orElseThrow|map)\s*\(/g,
    message: '`findByPK` retorna `T` nullable, não `Optional` — use null-check',
    source: 'repository/SKILL.md:582',
  },
  { pattern: /@Delete\b/g, message: '`@Delete` descontinuada — use `@Modifying` + `@NativeQuery`', source: 'repository/SKILL.md:580' },
  {
    pattern: /@Modifying\b[^;{}]*?\bint\s+[\w$]+\s*\(/g,
    message: '`@Modifying` retornando `int` — use `void` ou `Boolean`',
    source: 'repository/SKILL.md:581',
  },
  {
    pattern: /^[ \t]*import\s+br\.com\.sankhya\.sdk\.data\.repository\.NativeQuery\s*;/gm,
    message: 'import errado de `@NativeQuery` — use `br.com.sankhya.studio.persistence.NativeQuery`',
    source: 'repository/SKILL.md:584',
  },
  {
    pattern: /\bPageable\.of\s*\(/g,
    message: '`Pageable` não tem factory — use `PageRequest.of(...)`',
    source: 'repository/SKILL.md:585',
  },
  {
    pattern: /\.getTotal(?:Elements|Pages)\s*\(/g,
    message: '`Page<T>` não tem total — use `hasNext()`/`isLast()` ou `COUNT` próprio',
    source: 'repository/SKILL.md:586',
  },
  {
    pattern: /^[ \t]*import\s+br\.com\.sankhya\.jape\.util\.JdbcWrapper\s*;/gm,
    message: 'import errado — use `br.com.sankhya.jape.dao.JdbcWrapper`',
    source: 'listener/SKILL.md:249',
  },
  {
    pattern: /\bDynamicVO\s+[\w$]+\s*=\s*[\w$.]+\.getVo\s*\(\s*\)/g,
    message: '`getVo()` sem cast — use `(DynamicVO) event.getVo()`',
    source: 'listener/SKILL.md:238',
  },
  {
    pattern: /@Value\s*\([^)]*\)\s*(?:@[\w.]+(?:\([^)]*\))?\s*)*(?:(?:private|protected|public|static)\s+)*final\s+(?!class\b)/g,
    message: 'campo `final` com `@Value` — remova o `final`',
    source: 'value/SKILL.md:210',
  },
  {
    pattern: /@Value\s*\((?=[^)]*\bvalue\s*=)(?=[^)]*\bparam\s*=)/g,
    message: '`@Value` com `value` e `param` juntos — use só `param`',
    source: 'value/SKILL.md:212',
  },
  {
    pattern: /@Value\s*\((?=[^)]*\bgroup\s*=)(?=[^)]*\b(?:ENV_VAR|SYSTEM_PROPERTY)\b)/g,
    message: '`group` só funciona com `SANKHYA_PARAM`',
    source: 'value/SKILL.md:213',
  },
]

const XML_RULES: Rule[] = [
  {
    pattern: /<\?xml[^?]*\bencoding\s*=\s*["'](?!ISO-8859-1["'])/gi,
    message: 'cabeçalho XML com encoding diferente — use `<?xml version="1.0" encoding="ISO-8859-1" ?>`',
    source: 'encoding/SKILL.md:230',
  },
]

type Finding = { line: number; message: string; source: string }

const missingXmlHeader: Finding = {
  line: 1,
  message: 'XML sem cabeçalho obrigatório `<?xml version="1.0" encoding="ISO-8859-1" ?>`',
  source: 'encoding/SKILL.md:229',
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

const hasSucceeded = (ran: ToolCallResult) => ran.deny === undefined && !ran.isError

// O tipo garante o texto, mas tests/encoding.test.ts chama Write/Edit sem ele: sem o guard do
// chamador o lint lança e o engine pula este hook, quebrando a conversão de encoding da cadeia.
const lintAfter = async ($: EngineInterface, ran: ToolCallResult, filePath: string, lint: () => Finding[], where: string) => {
  if (!hasSucceeded(ran)) return ran
  const found = lint()
  if (found.length === 0) return ran
  if (!(await isInAddonProject(parentOf(filePath), readIfExists($)))) return ran
  return { ...ran, context: [...(ran.context ?? []), report(where, found)] }
}

// O arquivo já foi gravado quando o lint roda: falha dele vira aviso, não derruba a tool.
const reportFailure = (filePath: string, error: HookFailure, ran: ToolCallResult) => ({
  ...ran,
  context: [...(ran.context ?? []), `source-lint: hook falhou em "${filePath}" (${error.message ?? error.kind}) -- arquivo gravado sem verificação das regras das skills.`],
})

export const register: Register = on => {
  on('tool.call', { tool: 'Write' }, async ($, e, next) =>
    lintAfter($, await next(e), e.file_path, () => (e.content === undefined ? [] : writeViolations(e.file_path, e.content)), `"${e.file_path}"`),
  ).catch(async ($, e, next) => reportFailure(e.file_path, next.error, await next(e)))
  on('tool.call', { tool: 'Edit' }, async ($, e, next) =>
    lintAfter($, await next(e), e.file_path, () => (e.new_string === undefined ? [] : editViolations(e.file_path, e.new_string)), `o trecho novo (new_string) de "${e.file_path}"`),
  ).catch(async ($, e, next) => reportFailure(e.file_path, next.error, await next(e)))
}
