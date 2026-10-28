import { test, expect, mock, type Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

const ROOT = '/addon'
const ADDON_BUILD = "plugins { id 'br.com.sankhya.addonstudio' }\n"
const PLUGIN_MANIFEST = '/.claude-plugin/plugin.json'
const PLUGIN_ADDON_MD = '/skills/init/assets/ADDON.md'
const INSTALLED = '3.4.6'
const RULES = '# Regras do addon\nJava 8 estrito.\n'
const SIX_HOURS = 6 * 60 * 60 * 1000

const marketplace = (version: string) => JSON.stringify({ plugins: [{ name: 'addon-studio', version }] })

type Session = { cwd?: string; files?: Record<string, string>; published?: string; isOnline?: boolean; store?: Record<string, unknown> }

// Sessão, disco, rede, relógio e store falsos: são a fronteira do mod. Manifest e ADDON.md
// do plugin são achados pelo sufixo porque a raiz do plugin é do engine, não do teste.
const sessionIn = (on: On, { cwd = ROOT, files = {}, published = INSTALLED, isOnline = true, store = {} }: Session) => {
  const disk = new Map(Object.entries({ [`${ROOT}/build.gradle`]: ADDON_BUILD, ...files }))
  const pluginFile = (path: string) =>
    path.endsWith(PLUGIN_MANIFEST) ? JSON.stringify({ version: INSTALLED }) : path.endsWith(PLUGIN_ADDON_MD) ? RULES : undefined
  const fetched: string[] = []
  const toasts: string[] = []
  const clock = mock.clock(on, { now: SIX_HOURS * 10 })
  mock.store(on, store)
  on('session.cwd', () => ({ value: cwd }))
  on('fs.exists', (_$, e) => ({ value: disk.has(e.path) || pluginFile(e.path) !== undefined }))
  on('fs.read', (_$, e) => ({ value: pluginFile(e.path) ?? disk.get(e.path)! }))
  on('http.fetch', (_$, e) => {
    fetched.push(e.url)
    if (!isOnline) throw new Error('offline')
    return { value: { status: 200, ok: true, headers: {}, text: marketplace(published) } }
  })
  on('ui.toast', (_$, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('ui.invalidate', () => ({ value: undefined }))
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  // O engine desenha a linha de dica com o que a cadeia deixou em props.
  const hint: { tail?: string } = {}
  on('ui.render', (h$, e) => {
    hint.tail = (e.props as { tail?: string }).tail
    const { Text } = h$.ui.resolve(e)
    return Text({ children: '' })
  })
  return { clock, fetched, toasts, hint }
}

const start = async ($: Engine, clock: ReturnType<typeof mock.clock>, { cwd = ROOT, surface = 'terminal' as 'terminal' | null } = {}) => {
  await $.session.start({ cwd, surface, isInteractive: surface !== null })
  await clock.settle()
}

const hintTail = async ($: Engine, hint: { tail?: string }) => {
  const props = { isDraft: false, isWorking: false, hint: '? for shortcuts' }
  await $.ui.render({ component: 'PromptHint', surface: 'terminal', requestId: 'hint', props })
  return hint.tail
}

test('versão nova publicada vira toast e entra na linha de dica', async ($, on) => {
  const { clock, toasts, hint } = sessionIn(on, { published: '3.5.0' })

  await start($, clock)

  expect(toasts).toEqual([expect.stringContaining('v3.5.0 disponível')])
  expect(toasts[0]).toContain('/plugin update addon-studio@snk-devcenter')
  expect(await hintTail($, hint)).toBe('addon-studio · v3.5.0 disponível')
})

test('mesma versão publicada não avisa', async ($, on) => {
  const { clock, toasts, hint } = sessionIn(on, {})

  await start($, clock)

  expect(toasts).toEqual([])
  expect(await hintTail($, hint)).toBe('addon-studio')
})

test('versão publicada mais velha que a instalada não avisa', async ($, on) => {
  const { clock, toasts } = sessionIn(on, { published: '3.4.5' })

  await start($, clock)

  expect(toasts).toEqual([])
})

test('minor maior vence patch maior na comparação', async ($, on) => {
  const { clock, toasts } = sessionIn(on, { published: '3.10.0' })

  await start($, clock)

  expect(toasts).toEqual([expect.stringContaining('v3.10.0')])
})

test('checagem recente no store não refaz a requisição', async ($, on) => {
  const store = { latestRelease: { version: '3.5.0', checkedAt: SIX_HOURS * 10 - 1000 } }
  const { clock, fetched, toasts } = sessionIn(on, { store })

  await start($, clock)

  expect(fetched).toEqual([])
  expect(toasts).toEqual([expect.stringContaining('v3.5.0')])
})

test('checagem vencida no store refaz a requisição', async ($, on) => {
  const store = { latestRelease: { version: INSTALLED, checkedAt: 0 } }
  const { clock, fetched } = sessionIn(on, { published: '3.5.0', store })

  await start($, clock)

  expect(fetched).toHaveLength(1)
})

test('sem rede, a sessão segue sem aviso', async ($, on) => {
  const { clock, toasts, hint } = sessionIn(on, { isOnline: false })

  await start($, clock)

  expect(toasts).toEqual([])
  expect(await hintTail($, hint)).toBe('addon-studio')
})

test('fora de projeto addon, não consulta a versão', async ($, on) => {
  const { clock, fetched } = sessionIn(on, { cwd: '/outro', published: '3.5.0' })

  await start($, clock, { cwd: '/outro' })

  expect(fetched).toEqual([])
})

test('sessão sem surface (-p), não consulta a versão', async ($, on) => {
  const { clock, fetched } = sessionIn(on, { published: '3.5.0' })

  await start($, clock, { surface: null })

  expect(fetched).toEqual([])
})

test('docs/ADDON.md diferente do plugin pede o init', async ($, on) => {
  const { clock, toasts, hint } = sessionIn(on, { files: { [`${ROOT}/docs/ADDON.md`]: '# Regras antigas\n' } })

  await start($, clock)

  expect(toasts).toEqual([expect.stringContaining('/addon-studio:init')])
  expect(await hintTail($, hint)).toBe('addon-studio · rode /addon-studio:init')
})

test('docs/ADDON.md igual ao plugin com CRLF não avisa', async ($, on) => {
  const { clock, toasts } = sessionIn(on, { files: { [`${ROOT}/docs/ADDON.md`]: RULES.replace(/\n/g, '\r\n') } })

  await start($, clock)

  expect(toasts).toEqual([])
})

test('projeto sem docs/ADDON.md não pede o init por aqui', async ($, on) => {
  const { clock, toasts } = sessionIn(on, {})

  await start($, clock)

  expect(toasts).toEqual([])
})
