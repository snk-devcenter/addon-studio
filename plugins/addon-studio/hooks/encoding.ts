import type { Register, EngineInterface, HookFailure, ProcessRunResult, ToolCallResult } from 'claude-code'

// A conversão em bytes fica no to-iso88591.sh: $.fs.write só grava texto,
// não ISO-8859-1. O script segue sendo a fonte da regra (e do --selftest).
const runScript = ($: EngineInterface, filePath: string, mode: readonly string[]) =>
  $.process.run(['sh', `${$.plugin.root}/hooks/to-iso88591.sh`, ...mode], {
    stdin: JSON.stringify({ tool_input: { file_path: filePath } }),
  })

const toIso = ($: EngineInterface, filePath: string) => {
  $.ui.status('Convertendo encoding para ISO-8859-1...')
  return runScript($, filePath, []).finally(() => $.ui.status(undefined))
}

const withWarning = (ran: ToolCallResult, run: ProcessRunResult) =>
  run.exitCode === 0 || ran.deny !== undefined ? ran : { ...ran, context: [...(ran.context ?? []), run.stderr] }

const hasSucceeded = (ran: ToolCallResult) => ran.deny === undefined && !ran.isError

const afterWrite = async ($: EngineInterface, filePath: string, ran: ToolCallResult) =>
  hasSucceeded(ran) ? withWarning(ran, await toIso($, filePath)) : ran

// Read/Edit decodificam o arquivo como UTF-8: em ISO-8859-1, o Edit regravaria cada acento
// como U+FFFD (#45). A tool roda sobre o arquivo em UTF-8 e ele volta para ISO-8859-1 depois.
const aroundUtf8 = async (
  $: EngineInterface,
  filePath: string,
  runTool: () => Promise<ToolCallResult>,
  needsIso: (ran: ToolCallResult, wasConverted: boolean) => boolean,
) => {
  const toUtf8 = await runScript($, filePath, ['--to-utf8'])
  const wasConverted = toUtf8.stdout.includes('converted')
  const ran = withWarning(await runTool(), toUtf8)
  return needsIso(ran, wasConverted) ? withWarning(ran, await toIso($, filePath)) : ran
}

const reportFailure = (filePath: string, error: HookFailure, ran: ToolCallResult) => {
  if (ran.deny !== undefined) return ran
  const failure = `encoding: hook falhou em "${filePath}" (${error.message ?? error.kind}) -- confira o encoding com a skill encoding.`
  return { ...ran, context: [...(ran.context ?? []), failure] }
}

export const register: Register = on => {
  on('tool.call', { tool: 'Write' }, async ($, e, next) => afterWrite($, e.file_path, await next(e))).catch(
    async ($, e, next) => reportFailure(e.file_path, next.error, await next(e)),
  )
  on('tool.call', { tool: 'Edit' }, ($, e, next) =>
    aroundUtf8($, e.file_path, () => next(e), (ran, wasConverted) => wasConverted || hasSucceeded(ran)),
  ).catch(async ($, e, next) => reportFailure(e.file_path, next.error, await next(e)))
  // Read só devolve o que ele mesmo converteu: ler não pode reescrever um arquivo UTF-8.
  on('tool.call', { tool: 'Read' }, ($, e, next) =>
    aroundUtf8($, e.file_path, () => next(e), (_ran, wasConverted) => wasConverted),
  ).catch(async ($, e, next) => reportFailure(e.file_path, next.error, await next(e)))
}
