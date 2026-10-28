import type { Register, EngineInterface } from 'claude-code'
import { findAddonRoot } from './commons.ts'

// Avisa versão nova do plugin e `docs/ADDON.md` defasado em relação ao plugin instalado.
// A versão publicada é a do marketplace.json da main: só muda no corte de release.
const MARKETPLACE_URL = 'https://raw.githubusercontent.com/snk-devcenter/addon-studio/main/.claude-plugin/marketplace.json'
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000
const TOAST_MS = 10_000
const LATEST_KEY = 'latestRelease'

type LatestRelease = { version: string; checkedAt: number }

const readIfExists = ($: EngineInterface) => async (path: string) =>
  (await $.fs.exists(path)) ? await $.fs.read(path) : undefined

const installedVersion = async ($: EngineInterface) =>
  (JSON.parse(await $.fs.read(`${$.plugin.root}/.claude-plugin/plugin.json`)) as { version: string }).version

const isNewer = (candidate: string, current: string) => {
  const [a, b] = [candidate, current].map(v => v.split('.').map(Number))
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i]
  return false
}

const cachedLatest = async ($: EngineInterface) => (await $.store.get(LATEST_KEY)) as LatestRelease | undefined

// Falha de rede ou JSON inesperado: fica sem aviso, nunca atrapalha a sessão.
const refreshLatest = async ($: EngineInterface) => {
  const cached = await cachedLatest($)
  if (cached !== undefined && (await $.clock.now()) - cached.checkedAt < CHECK_INTERVAL_MS) return
  try {
    const response = await $.http.fetch(MARKETPLACE_URL)
    if (!response.ok) return
    const marketplace = JSON.parse(response.text) as { plugins: { name: string; version: string }[] }
    const version = marketplace.plugins.find(plugin => plugin.name === $.plugin.name)?.version
    if (version !== undefined) await $.store.set(LATEST_KEY, { version, checkedAt: await $.clock.now() })
  } catch {
    return
  }
}

const availableVersion = async ($: EngineInterface) => {
  const latest = await cachedLatest($)
  return latest !== undefined && isNewer(latest.version, await installedVersion($)) ? latest.version : undefined
}

// CRLF de checkout no Windows não conta como defasagem.
const normalized = (text: string) => text.replace(/\r\n/g, '\n')

// Só vale para projeto que rodou o init: sem docs/ADDON.md o session-rules já injeta o do plugin.
const isAddonMdStale = async ($: EngineInterface) => {
  const root = await findAddonRoot(await $.session.cwd(), readIfExists($))
  if (root === undefined) return false
  const projectCopy = await readIfExists($)(`${root}/docs/ADDON.md`)
  if (projectCopy === undefined) return false
  const pluginCopy = await $.fs.read(`${$.plugin.root}/skills/init/assets/ADDON.md`)
  return normalized(projectCopy) !== normalized(pluginCopy)
}

const toasts = async ($: EngineInterface) => {
  const version = await availableVersion($)
  if (version !== undefined) {
    $.ui.toast(`addon-studio v${version} disponível: /plugin update addon-studio@snk-devcenter e depois /reload-plugins`, { timeoutMs: TOAST_MS })
  }
  if (await isAddonMdStale($)) {
    $.ui.toast('docs/ADDON.md está desatualizado em relação ao plugin: rode /addon-studio:init', { timeoutMs: TOAST_MS })
  }
}

// Erro aqui derrubaria a linha de dica inteira, indicador do project-scope incluso.
const hintNotices = async ($: EngineInterface) => {
  try {
    const version = await availableVersion($)
    return [...(version === undefined ? [] : [`v${version} disponível`]), ...((await isAddonMdStale($)) ? ['rode /addon-studio:init'] : [])]
  } catch {
    return []
  }
}

export const register: Register = on => {
  // Sem surface (-p, SDK) não há onde avisar. O fetch roda num timer para não segurar o
  // primeiro prompt: session.start é aguardado antes dele.
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    if (e.surface === null || (await findAddonRoot(e.cwd, readIfExists($))) === undefined) return result
    $.clock.after(0, async () => {
      await refreshLatest($)
      $.ui.invalidate('ui.render')
      await toasts($)
    })
    return result
  })

  on('ui.render', { component: 'PromptHint' }, async ($, e, next) => {
    if ((await findAddonRoot(await $.session.cwd(), readIfExists($))) === undefined) return next(e)
    const notices = await hintNotices($)
    if (notices.length === 0) return next(e)
    const tail = [e.props.tail, ...notices].filter(part => part !== undefined).join(' · ')
    return next({ ...e, props: { ...e.props, tail } })
  })
}
