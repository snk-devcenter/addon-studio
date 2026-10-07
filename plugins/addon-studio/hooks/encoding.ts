import type { Register, EngineInterface, HookFailure, ToolCallResult } from 'claude-code'
import { ACTIVE_STATUS, isInAddonProject, parentOf } from './commons.ts'

// Converte arquivo-fonte de addon Sankhya para ISO-8859-1 depois de Write/Edit, e
// entrega Read/Edit sobre UTF-8. As tools decodificam o arquivo como UTF-8: num arquivo
// em ISO-8859-1, o Edit regravaria cada acento do trecho não editado como U+FFFD (#45).
const SOURCE_EXTENSION = /\.(java|xml|kt|properties)$/
const REPLACEMENT_CHARACTER = '�'
const UTF8_BOM_LENGTH = 3
const FROM_CHAR_CODE_CHUNK = 8192

const readIfExists = ($: EngineInterface) => async (path: string) =>
  (await $.fs.exists(path)) ? await $.fs.read(path) : undefined

// Sem o filtro de projeto o hook converteria .java de qualquer projeto da máquina.
const isAddonSource = async ($: EngineInterface, filePath: string) =>
  SOURCE_EXTENSION.test(filePath) && (await $.fs.exists(filePath)) && (await isInAddonProject(parentOf(filePath), readIfExists($)))

const readBytes = async ($: EngineInterface, filePath: string) => {
  const { base64 } = await $.fs.read(filePath, { as: 'bytes' })
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0))
}

const isSameBytes = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((byte, i) => byte === b[i])

// O texto, quando os bytes são UTF-8 válido; undefined quando não são (arquivo em ISO-8859-1).
const decodeUtf8 = (bytes: Uint8Array) => {
  const text = new TextDecoder().decode(bytes)
  const encoded = new TextEncoder().encode(text)
  const isValid = isSameBytes(encoded, bytes) || isSameBytes(encoded, bytes.subarray(UTF8_BOM_LENGTH))
  return isValid ? text : undefined
}

// Byte a byte: em ISO-8859-1 cada byte é o code point de mesmo valor. TextDecoder('latin1')
// não serve, o WHATWG o trata como windows-1252 e troca a faixa 0x80-0x9F.
const decodeLatin1 = (bytes: Uint8Array) => {
  let text = ''
  for (let i = 0; i < bytes.length; i += FROM_CHAR_CODE_CHUNK) {
    text += String.fromCharCode(...bytes.subarray(i, i + FROM_CHAR_CODE_CHUNK))
  }
  return text
}

// $.fs.write só grava UTF-8: os bytes ISO-8859-1 saem do iconv, que vem com glibc, macOS e o
// Git Bash que o Claude Code exige no Windows. Node não serve: o instalador nativo não o traz.
// //TRANSLIT aproxima o que não existe em Latin-1 (— vira -).
const writeLatin1 = ($: EngineInterface, filePath: string, text: string) =>
  $.process.run(['sh', '-c', 'iconv -f UTF-8 -t ISO-8859-1//TRANSLIT > "$1"', 'sh', filePath], { stdin: text })

// Devolve o aviso para o modelo, quando há um.
const toIso = async ($: EngineInterface, filePath: string) => {
  if (!(await isAddonSource($, filePath))) return undefined
  const text = decodeUtf8(await readBytes($, filePath))
  if (text === undefined) return undefined

  // O byte original já não existe: converter só trocaria U+FFFD por '?' e esconderia a perda.
  if (text.includes(REPLACEMENT_CHARACTER)) {
    return `encoding: "${filePath}" contem U+FFFD -- acento perdido ao ler arquivo ISO-8859-1 como UTF-8. Arquivo NAO convertido: restaure o trecho acentuado (git diff / git checkout -- "${filePath}") e reaplique a edicao.`
  }

  $.ui.status('Convertendo encoding para ISO-8859-1...')
  const written = await writeLatin1($, filePath, text).finally(() => $.ui.status(ACTIVE_STATUS))
  if (written.exitCode === 0) return undefined

  // O redirecionamento já truncou o arquivo: o conteúdo volta em UTF-8.
  await $.fs.write(filePath, text)
  return `encoding: conversao para ISO-8859-1 falhou em "${filePath}" -- arquivo mantido em UTF-8. ${written.stderr}`
}

// true quando converteu: Read só devolve para ISO-8859-1 o arquivo que ele mesmo trocou.
const toUtf8 = async ($: EngineInterface, filePath: string) => {
  if (!(await isAddonSource($, filePath))) return false
  const bytes = await readBytes($, filePath)
  if (decodeUtf8(bytes) !== undefined) return false
  await $.fs.write(filePath, decodeLatin1(bytes))
  return true
}

const withWarning = (ran: ToolCallResult, warning: string | undefined) =>
  warning === undefined || ran.deny !== undefined ? ran : { ...ran, context: [...(ran.context ?? []), warning] }

const hasSucceeded = (ran: ToolCallResult) => ran.deny === undefined && !ran.isError

const aroundUtf8 = async (
  $: EngineInterface,
  filePath: string,
  runTool: () => Promise<ToolCallResult>,
  needsIso: (ran: ToolCallResult, wasConverted: boolean) => boolean,
) => {
  const wasConverted = await toUtf8($, filePath)
  const ran = await runTool()
  return needsIso(ran, wasConverted) ? withWarning(ran, await toIso($, filePath)) : ran
}

const reportFailure = (filePath: string, error: HookFailure, ran: ToolCallResult) =>
  withWarning(
    ran,
    `encoding: hook falhou em "${filePath}" (${error.message ?? error.kind}) -- confira o encoding com a skill encoding.`,
  )

export const register: Register = on => {
  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    const ran = await next(e)
    return hasSucceeded(ran) ? withWarning(ran, await toIso($, e.file_path)) : ran
  }).catch(async ($, e, next) => reportFailure(e.file_path, next.error, await next(e)))
  on('tool.call', { tool: 'Edit' }, ($, e, next) =>
    aroundUtf8($, e.file_path, () => next(e), (ran, wasConverted) => wasConverted || hasSucceeded(ran)),
  ).catch(async ($, e, next) => reportFailure(e.file_path, next.error, await next(e)))
  on('tool.call', { tool: 'Read' }, ($, e, next) =>
    aroundUtf8($, e.file_path, () => next(e), (_ran, wasConverted) => wasConverted),
  ).catch(async ($, e, next) => reportFailure(e.file_path, next.error, await next(e)))
}
