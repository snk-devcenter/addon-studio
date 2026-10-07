import type { Register, EngineInterface } from 'claude-code'
import { findAddonRoot } from './commons.ts'

// Piso para projeto que nunca rodou `/addon-studio:init`: sem isso, as regras universais
// (Java 8 estrito, ISO-8859-1, JAPE, Guice) não entram no contexto por caminho nenhum.
// Fonte única: o mesmo ADDON.md que o `init` copia.
const RULES_BLOCK = 'addonStudioRules'
const INIT_NOTE =
  '[Injetado pelo plugin addon-studio: este projeto nao tem docs/ADDON.md. Rode /addon-studio:init para fixar estas regras no projeto.]\n\n'

const readIfExists = ($: EngineInterface) => async (path: string) =>
  (await $.fs.exists(path)) ? await $.fs.read(path) : undefined

// Com o init, o ADDON.md do projeto já está no contexto via CLAUDE.md, que o Claude Code
// carrega também dos diretórios acima do cwd.
const hasRunInit = async ($: EngineInterface, root: string) =>
  (await $.fs.exists(`${root}/docs/ADDON.md`)) && ((await readIfExists($)(`${root}/CLAUDE.md`))?.includes('@docs/ADDON.md') ?? false)

const needsRules = async ($: EngineInterface) => {
  const root = await findAddonRoot(await $.session.cwd(), readIfExists($))
  return root !== undefined && !(await hasRunInit($, root))
}

export const register: Register = on => {
  on('prompt.context', async ($, e, next) => {
    const context = await next(e)
    if (!(await needsRules($))) return context
    const rules = await $.fs.read(`${$.plugin.root}/skills/init/assets/ADDON.md`)
    return { ...context, blocks: [...context.blocks, { name: RULES_BLOCK, text: INIT_NOTE + rules }] }
  })
}
