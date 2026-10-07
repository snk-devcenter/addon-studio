import { test, expect } from 'claude-code/testing'
import type { On, ProcessRunResult } from 'claude-code'

const FILE = '/projeto/src/A.java'

const scriptRun = (exitCode: number, stderr = ''): ProcessRunResult => ({
  exitCode,
  stdout: '',
  stderr,
  isStdoutTruncated: false,
  isStderrTruncated: false,
})

const toolRanOk = (on: On) => on('tool.call', () => ({ result: { filePath: FILE } }) as never)

for (const tool of ['Write', 'Edit'] as const) {
  test(`${tool} entrega o arquivo tocado ao to-iso88591.sh`, async ($, on) => {
    toolRanOk(on)
    const calls: { argv: readonly string[]; stdin?: string }[] = []
    on('process.run', (_$, e) => {
      calls.push({ argv: e.argv, stdin: e.init?.stdin })
      return { value: scriptRun(0) }
    })

    const ran = await $.tool.call({ tool, file_path: FILE } as never)

    expect(calls.length).toBe(1)
    expect(calls[0]!.argv[0]).toBe('sh')
    expect(calls[0]!.argv[1]).toMatch(/\/hooks\/to-iso88591\.sh$/)
    expect(JSON.parse(calls[0]!.stdin!)).toEqual({ tool_input: { file_path: FILE } })
    expect(ran.context ?? []).toEqual([])
  })
}

test('exit 2 do script chega ao modelo como contexto', async ($, on) => {
  toolRanOk(on)
  on('process.run', () => ({ value: scriptRun(2, 'encoding: contem U+FFFD') }))

  const ran = await $.tool.call({ tool: 'Write', file_path: FILE } as never)

  expect(ran.context).toEqual(['encoding: contem U+FFFD'])
})

test('tool com erro não aciona a conversão', async ($, on) => {
  on('tool.call', { tool: 'Edit' }, () => ({ result: 'falhou', isError: true }) as never)
  let called = false
  on('process.run', () => {
    called = true
    return { value: scriptRun(0) }
  })

  await $.tool.call({ tool: 'Edit', file_path: FILE } as never)

  expect(called).toBe(false)
})

test('falha ao rodar o script avisa o modelo sem derrubar a tool', async ($, on) => {
  toolRanOk(on)
  on('process.run', () => ({ deny: 'sh: not found' }))

  const ran = await $.tool.call({ tool: 'Write', file_path: FILE } as never)

  expect(ran.result).toEqual({ filePath: FILE })
  expect(ran.context?.join('\n') ?? '').toContain('sh: not found')
})
