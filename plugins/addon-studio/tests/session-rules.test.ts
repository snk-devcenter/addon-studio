import { test, expect, type Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

const ROOT = '/addon'
const ADDON_BUILD = "plugins { id 'br.com.sankhya.addonstudio' }\n"
const JAVA_BUILD = "plugins { id 'java' }\n"
const PLUGIN_ADDON_MD = '/skills/init/assets/ADDON.md'
const RULES = '# Regras do addon\nJava 8 estrito.\n'
const INIT_NOTE = 'Rode /addon-studio:init'

const WITHOUT_INIT = {
  [`${ROOT}/build.gradle`]: ADDON_BUILD,
  [`${ROOT}/addon-vc/build.gradle`]: JAVA_BUILD,
}
const WITH_INIT = {
  ...WITHOUT_INIT,
  [`${ROOT}/docs/ADDON.md`]: '',
  [`${ROOT}/CLAUDE.md`]: '@docs/ADDON.md\n',
}

// Sessão e disco falsos: cwd e fs são a fronteira do mod. O ADDON.md do plugin é
// achado pelo sufixo porque a raiz do plugin é do engine, não do teste.
const sessionIn = (on: On, cwd: string, files: Record<string, string>) => {
  const disk = new Map(Object.entries(files))
  const isPluginAddonMd = (path: string) => path.endsWith(PLUGIN_ADDON_MD)
  on('session.cwd', () => ({ value: cwd }))
  on('fs.exists', (_$, e) => ({ value: disk.has(e.path) || isPluginAddonMd(e.path) }))
  on('fs.read', (_$, e) => ({ value: isPluginAddonMd(e.path) ? RULES : disk.get(e.path)! }))
  on('prompt.context', (_$, e) => ({ blocks: e.blocks }))
}

const CORE_BLOCKS = { blocks: [{ name: 'currentDate', text: '2026-10-07' }] }

const injected = async ($: Engine) =>
  (await $.prompt.context(CORE_BLOCKS)).blocks.filter(block => block.name !== 'currentDate')

test('projeto sem build.gradle não recebe as regras', async ($, on) => {
  sessionIn(on, '/vazio', {})

  expect(await injected($)).toEqual([])
})

test('build.gradle de outro stack não recebe as regras', async ($, on) => {
  sessionIn(on, '/outro', { '/outro/build.gradle': JAVA_BUILD })

  expect(await injected($)).toEqual([])
})

test('projeto addon sem init recebe a nota e o ADDON.md do plugin', async ($, on) => {
  sessionIn(on, ROOT, WITHOUT_INIT)

  const [block] = await injected($)

  expect(block?.text).toContain(INIT_NOTE)
  expect(block?.text).toContain(RULES)
})

test('sessão no módulo -vc de addon sem init recebe as regras', async ($, on) => {
  sessionIn(on, `${ROOT}/addon-vc`, WITHOUT_INIT)

  const [block] = await injected($)

  expect(block?.text).toContain(RULES)
})

test('projeto addon com init não recebe as regras de novo', async ($, on) => {
  sessionIn(on, ROOT, WITH_INIT)

  expect(await injected($)).toEqual([])
})

test('sessão no módulo -vc de addon com init não recebe as regras de novo', async ($, on) => {
  sessionIn(on, `${ROOT}/addon-vc`, WITH_INIT)

  expect(await injected($)).toEqual([])
})

test('docs/ADDON.md sem o import no CLAUDE.md ainda recebe as regras', async ($, on) => {
  sessionIn(on, ROOT, { ...WITHOUT_INIT, [`${ROOT}/docs/ADDON.md`]: '', [`${ROOT}/CLAUDE.md`]: '# projeto\n' })

  const [block] = await injected($)

  expect(block?.text).toContain(RULES)
})

test('os blocos do engine seguem intactos', async ($, on) => {
  sessionIn(on, ROOT, WITHOUT_INIT)

  expect((await $.prompt.context(CORE_BLOCKS)).blocks[0]).toEqual(CORE_BLOCKS.blocks[0])
})
