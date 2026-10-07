import type { Register, EngineInterface, HookFailure, ToolCallResult } from 'claude-code'

// A conversão em bytes fica no to-iso88591.sh: $.fs.write só grava texto,
// não ISO-8859-1. O script segue sendo a fonte da regra (e do --selftest).
const convertAfter = async ($: EngineInterface, filePath: string, ran: ToolCallResult) => {
  if (ran.deny !== undefined || ran.isError) return ran

  $.ui.status('Convertendo encoding para ISO-8859-1...')
  const { exitCode, stderr } = await $.process
    .run(['sh', `${$.plugin.root}/hooks/to-iso88591.sh`], {
      stdin: JSON.stringify({ tool_input: { file_path: filePath } }),
    })
    .finally(() => $.ui.status(undefined))

  return exitCode === 0 ? ran : { ...ran, context: [...(ran.context ?? []), stderr] }
}

const reportFailure = (filePath: string, error: HookFailure, ran: ToolCallResult) => {
  if (ran.deny !== undefined) return ran
  const failure = `encoding: hook falhou em "${filePath}" (${error.message ?? error.kind}) -- confira o encoding com a skill encoding.`
  return { ...ran, context: [...(ran.context ?? []), failure] }
}

export const register: Register = on => {
  on('tool.call', { tool: 'Write' }, async ($, e, next) => convertAfter($, e.file_path, await next(e))).catch(
    async ($, e, next) => reportFailure(e.file_path, next.error, await next(e)),
  )
  on('tool.call', { tool: 'Edit' }, async ($, e, next) => convertAfter($, e.file_path, await next(e))).catch(
    async ($, e, next) => reportFailure(e.file_path, next.error, await next(e)),
  )
}
