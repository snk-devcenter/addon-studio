import { test, expect } from 'claude-code/testing'
import type { On, ProcessRunResult } from 'claude-code'

const ROOT = '/addon'
const ADDON_BUILD = "plugins { id 'br.com.sankhya.addonstudio' }\n"

const latin1 = (text: string) => Uint8Array.from(text, c => (c.charCodeAt(0) > 0xff ? 0x3f : c.charCodeAt(0)))
const utf8 = (text: string) => new TextEncoder().encode(text)
const hex = (bytes: Uint8Array | undefined) => [...(bytes ?? [])].map(b => b.toString(16).padStart(2, '0')).join('')
const asText = (bytes: Uint8Array) => new TextDecoder().decode(bytes)

const processRan = (exitCode: number, stderr = ''): ProcessRunResult => ({
  exitCode,
  stdout: '',
  stderr,
  isStdoutTruncated: false,
  isStderrTruncated: false,
})

// Disco em memória e iconv falso: fs e processo são a fronteira do mod.
type Disk = Map<string, Uint8Array>
type FakeProcess = (argv: readonly string[], stdin: string, disk: Disk) => ProcessRunResult

const iconvWrites: FakeProcess = (argv, stdin, disk) => {
  disk.set(argv[argv.length - 1]!, latin1(stdin))
  return processRan(0)
}

const fakeDisk = (on: On, files: Record<string, Uint8Array | string>, runProcess: FakeProcess = iconvWrites) => {
  const disk = new Map(Object.entries(files).map(([path, content]) => [path, typeof content === 'string' ? utf8(content) : content]))
  const processes: (readonly string[])[] = []
  on('fs.exists', (_$, e) => ({ value: disk.has(e.path) }))
  on('fs.read', (_$, e) => {
    const bytes = disk.get(e.path)
    if (bytes === undefined) return { deny: `ENOENT: ${e.path}` }
    return { value: e.as === 'bytes' ? { base64: btoa(String.fromCharCode(...bytes)) } : asText(bytes) }
  })
  on('fs.write', (_$, e) => {
    disk.set(e.path, utf8(e.text))
    return { value: undefined }
  })
  on('process.run', (_$, e) => {
    processes.push(e.argv)
    return { value: runProcess(e.argv, e.init?.stdin ?? '', disk) }
  })
  return { disk, processes }
}

const editTool = (on: On, disk: Disk, from: string, to: string) =>
  on('tool.call', (_$, e) => {
    const path = (e as { file_path: string }).file_path
    const text = asText(disk.get(path)!)
    if (!text.includes(from)) return { result: 'old_string não encontrado', isError: true } as never
    disk.set(path, utf8(text.replace(from, to)))
    return { result: { filePath: path } } as never
  })

const toolSaw = (on: On, disk: Disk, seen: string[]) =>
  on('tool.call', (_$, e) => {
    seen.push(asText(disk.get((e as { file_path: string }).file_path)!))
    return { result: { file: { content: seen.at(-1) } } } as never
  })

const writeTool = (on: On, disk: Disk, content: string) =>
  on('tool.call', (_$, e) => {
    disk.set((e as { file_path: string }).file_path, utf8(content))
    return { result: { filePath: (e as { file_path: string }).file_path } } as never
  })

test('Write em projeto addon grava o .java em ISO-8859-1', async ($, on) => {
  const { disk } = fakeDisk(on, { [`${ROOT}/build.gradle`]: ADDON_BUILD })
  writeTool(on, disk, 'olá ê\n')

  await $.tool.call({ tool: 'Write', file_path: `${ROOT}/A.java`, content: 'olá ê\n' } as never)

  expect(hex(disk.get(`${ROOT}/A.java`))).toBe('6f6ce120ea0a')
})

test('conversão limpa a status line ao terminar', async ($, on) => {
  const { disk } = fakeDisk(on, { [`${ROOT}/build.gradle`]: ADDON_BUILD })
  writeTool(on, disk, 'olá\n')
  const shown: (string | undefined)[] = []
  on('ui.status', (_$, e) => {
    shown.push(e.text)
    return { value: undefined }
  })

  await $.tool.call({ tool: 'Write', file_path: `${ROOT}/A.java`, content: 'olá\n' } as never)

  expect(shown.at(-1)).toBeUndefined()
})

test('Write em submódulo sem o plugin, sob raiz que aplica, converte', async ($, on) => {
  const { disk } = fakeDisk(on, {
    [`${ROOT}/build.gradle`]: ADDON_BUILD,
    [`${ROOT}/addon-vc/build.gradle`]: "plugins { id 'java' }\n",
  })
  writeTool(on, disk, 'olá\n')

  await $.tool.call({ tool: 'Write', file_path: `${ROOT}/addon-vc/F.java`, content: 'olá\n' } as never)

  expect(hex(disk.get(`${ROOT}/addon-vc/F.java`))).toBe('6f6ce10a')
})

test('Write fora de projeto addon não converte', async ($, on) => {
  const { disk, processes } = fakeDisk(on, { '/outro/build.gradle': "plugins { id 'java' }\n" })
  writeTool(on, disk, 'olá\n')

  await $.tool.call({ tool: 'Write', file_path: '/outro/E.java', content: 'olá\n' } as never)

  expect(hex(disk.get('/outro/E.java'))).toBe('6f6cc3a10a')
  expect(processes).toEqual([])
})

test('Write de extensão fora da lista não converte', async ($, on) => {
  const { disk, processes } = fakeDisk(on, { [`${ROOT}/build.gradle`]: ADDON_BUILD })
  writeTool(on, disk, 'olá\n')

  await $.tool.call({ tool: 'Write', file_path: `${ROOT}/D.md`, content: 'olá\n' } as never)

  expect(hex(disk.get(`${ROOT}/D.md`))).toBe('6f6cc3a10a')
  expect(processes).toEqual([])
})

test('U+FFFD no arquivo: não converte e avisa o modelo', async ($, on) => {
  const { disk, processes } = fakeDisk(on, { [`${ROOT}/build.gradle`]: ADDON_BUILD })
  writeTool(on, disk, 'ol�\n')

  const ran = await $.tool.call({ tool: 'Write', file_path: `${ROOT}/C.java`, content: 'ol�\n' } as never)

  expect(hex(disk.get(`${ROOT}/C.java`))).toBe('6f6cefbfbd0a')
  expect(processes).toEqual([])
  expect(ran.context?.join('\n') ?? '').toContain('U+FFFD')
})

test('Edit enxerga o arquivo ISO-8859-1 em UTF-8 e devolve em ISO-8859-1 (#45)', async ($, on) => {
  const file = `${ROOT}/C.java`
  const { disk } = fakeDisk(on, { [`${ROOT}/build.gradle`]: ADDON_BUILD, [file]: latin1('/* Frequência */ "x"\n') })
  editTool(on, disk, '"x"', '"ação"')

  const ran = await $.tool.call({ tool: 'Edit', file_path: file, old_string: '"x"', new_string: '"ação"' } as never)

  expect(ran.isError).toBeUndefined()
  expect(hex(disk.get(file))).toBe(hex(latin1('/* Frequência */ "ação"\n')))
})

test('Edit com erro devolve o arquivo convertido como estava', async ($, on) => {
  const file = `${ROOT}/C.java`
  const original = latin1('/* Frequência */\n')
  const { disk } = fakeDisk(on, { [`${ROOT}/build.gradle`]: ADDON_BUILD, [file]: original })
  editTool(on, disk, 'inexistente', 'y')

  await $.tool.call({ tool: 'Edit', file_path: file, old_string: 'inexistente', new_string: 'y' } as never)

  expect(hex(disk.get(file))).toBe(hex(original))
})

test('Read enxerga o arquivo ISO-8859-1 em UTF-8 e deixa os bytes como estavam', async ($, on) => {
  const file = `${ROOT}/C.java`
  const original = latin1('/* Frequência */\n')
  const { disk } = fakeDisk(on, { [`${ROOT}/build.gradle`]: ADDON_BUILD, [file]: original })
  const seen: string[] = []
  toolSaw(on, disk, seen)

  await $.tool.call({ tool: 'Read', file_path: file } as never)

  expect(seen).toEqual(['/* Frequência */\n'])
  expect(hex(disk.get(file))).toBe(hex(original))
})

test('Read de arquivo UTF-8 não regrava nem roda processo', async ($, on) => {
  const file = `${ROOT}/U.java`
  const { disk, processes } = fakeDisk(on, { [`${ROOT}/build.gradle`]: ADDON_BUILD, [file]: 'olá\n' })
  toolSaw(on, disk, [])

  await $.tool.call({ tool: 'Read', file_path: file } as never)

  expect(hex(disk.get(file))).toBe('6f6cc3a10a')
  expect(processes).toEqual([])
})

test('Read fora de .java/.xml/.kt/.properties não toca o disco', async ($, on) => {
  let touched = false
  on('fs.exists', () => {
    touched = true
    return { value: false }
  })
  on('tool.call', () => ({ result: { file: { content: '' } } }) as never)

  await $.tool.call({ tool: 'Read', file_path: `${ROOT}/README.md` } as never)

  expect(touched).toBe(false)
})

test('iconv falhando mantém o arquivo em UTF-8 e avisa o modelo', async ($, on) => {
  const file = `${ROOT}/A.java`
  const truncatesAndFails: FakeProcess = (_argv, _stdin, disk) => {
    disk.set(file, new Uint8Array())
    return processRan(1, 'iconv: falhou')
  }
  const { disk } = fakeDisk(on, { [`${ROOT}/build.gradle`]: ADDON_BUILD }, truncatesAndFails)
  writeTool(on, disk, 'olá\n')

  const ran = await $.tool.call({ tool: 'Write', file_path: file, content: 'olá\n' } as never)

  expect(hex(disk.get(file))).toBe('6f6cc3a10a')
  expect(ran.context?.join('\n') ?? '').toContain('iconv: falhou')
})

test('sem iconv, mantém o arquivo em UTF-8 e avisa o modelo', async ($, on) => {
  const file = `${ROOT}/A.java`
  const SHELL_COMMAND_NOT_FOUND = 127
  const withoutIconv: FakeProcess = (_argv, _stdin, disk) => {
    disk.set(file, new Uint8Array())
    return processRan(SHELL_COMMAND_NOT_FOUND, 'sh: 1: iconv: not found')
  }
  const { disk, processes } = fakeDisk(on, { [`${ROOT}/build.gradle`]: ADDON_BUILD }, withoutIconv)
  writeTool(on, disk, 'olá\n')

  const ran = await $.tool.call({ tool: 'Write', file_path: file, content: 'olá\n' } as never)

  expect(processes.map(argv => argv[0])).toEqual(['sh'])
  expect(hex(disk.get(file))).toBe('6f6cc3a10a')
  expect(ran.context?.join('\n') ?? '').toContain('iconv: not found')
})

test('falha inesperada do hook avisa o modelo sem derrubar a tool', async ($, on) => {
  on('fs.exists', () => ({ deny: 'EACCES' }))
  on('tool.call', () => ({ result: { filePath: `${ROOT}/A.java` } }) as never)

  const ran = await $.tool.call({ tool: 'Write', file_path: `${ROOT}/A.java`, content: 'olá\n' } as never)

  expect(ran.result).toEqual({ filePath: `${ROOT}/A.java` })
  expect(ran.context?.join('\n') ?? '').toContain('encoding: hook falhou')
})
