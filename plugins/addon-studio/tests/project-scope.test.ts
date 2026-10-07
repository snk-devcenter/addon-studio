import { test, expect, type Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

const ROOT = '/addon'
const OTHER_ROOT = '/outro'
const ADDON_BUILD = "plugins { id 'br.com.sankhya.addonstudio' }\n"
const PLUGIN = { plugin: 'addon-studio', tier: 'user' } as const

const LISTING = [
  'The following skills are available for use with the Skill tool:',
  '',
  '- simplify: Review the changed code.',
  '- addon-studio:build: Build e deploy local de addon Sankhya.',
  '- addon-studio:before-load-listener',
  '- code-review: Review the current diff.',
].join('\n')

const LISTING_WITHOUT_ADDON = [
  'The following skills are available for use with the Skill tool:',
  '',
  '- simplify: Review the changed code.',
  '- code-review: Review the current diff.',
].join('\n')

// Sessão e disco falsos: cwd e fs são a fronteira do mod. O que o engine faria com a
// listagem, o agent e o comando é devolvido como o plugin deixou.
const sessionIn = (on: On, cwd: string) => {
  const files = new Map([[`${ROOT}/build.gradle`, ADDON_BUILD]])
  on('session.cwd', () => ({ value: cwd }))
  on('fs.exists', (_$, e) => ({ value: files.has(e.path) }))
  on('fs.read', (_$, e) => ({ value: files.get(e.path)! }))
  on('prompt.attachment', (_$, e) => ({ text: e.text }))
  on('agent.offer', () => ({ isOffered: true }))
  on('command.describe', (_$, e) => ({ description: e.description, isHidden: e.isHidden }))
  on('tool.call', () => ({ result: 'skill carregada' }) as never)
}

const skillListing = { type: 'skill_listing', text: LISTING, origin: { kind: 'engine' } } as const
const reviewerAgent = { agent: 'addon-studio:addon-reviewer', description: 'Revisa', source: 'plugin', provider: PLUGIN }
const buildCommand = {
  command: 'addon-studio:build',
  description: 'Build',
  isHidden: false,
  immediate: false,
  provider: PLUGIN,
}

test('fora de projeto addon, a listagem de skills perde as do plugin', async ($, on) => {
  sessionIn(on, OTHER_ROOT)

  expect(await $.prompt.attachment(skillListing)).toEqual({ text: LISTING_WITHOUT_ADDON })
})

test('fora de projeto addon, sub-agent do plugin não é oferecido', async ($, on) => {
  sessionIn(on, OTHER_ROOT)

  expect(await $.agent.offer(reviewerAgent)).toEqual({ isOffered: false })
})

test('fora de projeto addon, sub-agent de outra origem continua oferecido', async ($, on) => {
  sessionIn(on, OTHER_ROOT)

  const explore = { agent: 'Explore', description: 'Busca', source: 'built-in', provider: { plugin: 'engine', tier: 'core' } } as const
  expect(await $.agent.offer(explore)).toEqual({ isOffered: true })
})

test('fora de projeto addon, comando do plugin some do menu', async ($, on) => {
  sessionIn(on, OTHER_ROOT)

  expect((await $.command.describe(buildCommand)).isHidden).toBe(true)
})

test('fora de projeto addon, Skill tool recusa skill do plugin', async ($, on) => {
  sessionIn(on, OTHER_ROOT)

  const ran = await $.tool.call({ tool: 'Skill', skill: 'addon-studio:build' })

  expect(ran.deny).toContain('br.com.sankhya.addonstudio')
})

test('em projeto addon, a listagem de skills fica inteira', async ($, on) => {
  sessionIn(on, ROOT)

  expect(await $.prompt.attachment(skillListing)).toEqual({ text: LISTING })
})

test('sessão aberta no módulo -vc enxerga o plugin aplicado na raiz', async ($, on) => {
  sessionIn(on, `${ROOT}/addon-vc`)

  expect(await $.prompt.attachment(skillListing)).toEqual({ text: LISTING })
})

test('em projeto addon, sub-agent e comando do plugin seguem disponíveis', async ($, on) => {
  sessionIn(on, ROOT)

  expect(await $.agent.offer(reviewerAgent)).toEqual({ isOffered: true })
  expect((await $.command.describe(buildCommand)).isHidden).toBe(false)
})

test('em projeto addon, Skill tool carrega skill do plugin', async ($, on) => {
  sessionIn(on, ROOT)

  const ran = await $.tool.call({ tool: 'Skill', skill: 'addon-studio:build' })

  expect(ran.deny).toBeUndefined()
})

// O engine desenha a linha de dica com o que a cadeia deixou em props: a base guarda a cauda.
const hintTail = async ($: Engine, on: On, tail?: string) => {
  let drawnTail: string | undefined
  on('ui.render', (h$, e) => {
    drawnTail = (e.props as { tail?: string }).tail
    const { Text } = h$.ui.resolve(e)
    return Text({ children: '' })
  })
  const props = { isDraft: false, isWorking: false, hint: '? for shortcuts', ...(tail === undefined ? {} : { tail }) }
  await $.ui.render({ component: 'PromptHint', surface: 'terminal', requestId: 'hint', props })
  return drawnTail
}

test('em projeto addon, a linha de dica do prompt indica o plugin', async ($, on) => {
  sessionIn(on, ROOT)

  expect(await hintTail($, on)).toBe('addon-studio')
})

test('em projeto addon, o indicador soma à cauda de outro plugin', async ($, on) => {
  sessionIn(on, ROOT)

  expect(await hintTail($, on, 'outro')).toBe('outro · addon-studio')
})

test('fora de projeto addon, a linha de dica fica como está', async ($, on) => {
  sessionIn(on, OTHER_ROOT)

  expect(await hintTail($, on)).toBeUndefined()
})
