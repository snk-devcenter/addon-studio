import { test, expect } from 'claude-code/testing'
import type { On, ProcessRunResult } from 'claude-code'

const FILE = '/projeto/src/A.java'

const scriptRun = (exitCode: number, stderr = '', stdout = ''): ProcessRunResult => ({
  exitCode,
  stdout,
  stderr,
  isStdoutTruncated: false,
  isStderrTruncated: false,
})

type Step = { argv: readonly string[]; stdin?: string } | 'tool'

const toolRan = (on: On, steps: Step[], answer: unknown = { result: { filePath: FILE } }) =>
  on('tool.call', () => {
    steps.push('tool')
    return answer as never
  })

const scriptAnswers = (on: On, steps: Step[], answer: (argv: readonly string[]) => ProcessRunResult) =>
  on('process.run', (_$, e) => {
    steps.push({ argv: e.argv, stdin: e.init?.stdin })
    return { value: answer(e.argv) }
  })

const toUtf8Answer = (converted: boolean) => (argv: readonly string[]) =>
  argv.includes('--to-utf8') ? scriptRun(0, '', converted ? 'converted\n' : '') : scriptRun(0)

const modeOf = (step: Step) => (step === 'tool' ? 'tool' : step.argv.includes('--to-utf8') ? 'to-utf8' : 'to-iso')

test('Write entrega o arquivo gravado ao to-iso88591.sh', async ($, on) => {
  const steps: Step[] = []
  toolRan(on, steps)
  scriptAnswers(on, steps, () => scriptRun(0))

  const ran = await $.tool.call({ tool: 'Write', file_path: FILE } as never)

  expect(steps.map(modeOf)).toEqual(['tool', 'to-iso'])
  const [, script] = steps as [Step, { argv: readonly string[]; stdin?: string }]
  expect(script.argv[0]).toBe('sh')
  expect(script.argv[1]).toMatch(/\/hooks\/to-iso88591\.sh$/)
  expect(JSON.parse(script.stdin!)).toEqual({ tool_input: { file_path: FILE } })
  expect(ran.context ?? []).toEqual([])
})

test('Edit lê o arquivo em UTF-8 e devolve em ISO-8859-1 (#45)', async ($, on) => {
  const steps: Step[] = []
  toolRan(on, steps)
  scriptAnswers(on, steps, toUtf8Answer(true))

  await $.tool.call({ tool: 'Edit', file_path: FILE } as never)

  expect(steps.map(modeOf)).toEqual(['to-utf8', 'tool', 'to-iso'])
})

test('Edit com erro devolve em ISO-8859-1 o arquivo que o mod passou para UTF-8', async ($, on) => {
  const steps: Step[] = []
  toolRan(on, steps, { result: 'old_string não encontrado', isError: true })
  scriptAnswers(on, steps, toUtf8Answer(true))

  await $.tool.call({ tool: 'Edit', file_path: FILE } as never)

  expect(steps.map(modeOf)).toEqual(['to-utf8', 'tool', 'to-iso'])
})

test('Edit com erro em arquivo que já era UTF-8 não converte nada', async ($, on) => {
  const steps: Step[] = []
  toolRan(on, steps, { result: 'old_string não encontrado', isError: true })
  scriptAnswers(on, steps, toUtf8Answer(false))

  await $.tool.call({ tool: 'Edit', file_path: FILE } as never)

  expect(steps.map(modeOf)).toEqual(['to-utf8', 'tool'])
})

test('Read de arquivo ISO-8859-1 lê em UTF-8 e devolve o arquivo como estava', async ($, on) => {
  const steps: Step[] = []
  toolRan(on, steps)
  scriptAnswers(on, steps, toUtf8Answer(true))

  await $.tool.call({ tool: 'Read', file_path: FILE } as never)

  expect(steps.map(modeOf)).toEqual(['to-utf8', 'tool', 'to-iso'])
})

test('Read de arquivo que não precisou de conversão não grava nada', async ($, on) => {
  const steps: Step[] = []
  toolRan(on, steps)
  scriptAnswers(on, steps, toUtf8Answer(false))

  await $.tool.call({ tool: 'Read', file_path: FILE } as never)

  expect(steps.map(modeOf)).toEqual(['to-utf8', 'tool'])
})

test('exit 2 do script chega ao modelo como contexto', async ($, on) => {
  const steps: Step[] = []
  toolRan(on, steps)
  scriptAnswers(on, steps, () => scriptRun(2, 'encoding: contem U+FFFD'))

  const ran = await $.tool.call({ tool: 'Write', file_path: FILE } as never)

  expect(ran.context).toEqual(['encoding: contem U+FFFD'])
})

test('falha ao rodar o script avisa o modelo sem derrubar a tool', async ($, on) => {
  toolRan(on, [])
  on('process.run', () => ({ deny: 'sh: not found' }))

  const ran = await $.tool.call({ tool: 'Write', file_path: FILE } as never)

  expect(ran.result).toEqual({ filePath: FILE })
  expect(ran.context?.join('\n') ?? '').toContain('sh: not found')
})
