import type { Register, EngineInterface } from 'claude-code'
import { isInAddonProject } from './commons.ts'

// Fora de projeto Addon Studio o plugin some do contexto: listagem de skills, sub-agents,
// Skill tool e menu `/`. Permite instalar o plugin no escopo de usuário sem que as
// descriptions disputem o disparo em projeto que não é Sankhya.

const readIfExists = ($: EngineInterface) => async (path: string) =>
  (await $.fs.exists(path)) ? await $.fs.read(path) : undefined

const isOutsideAddonProject = async ($: EngineInterface) => !(await isInAddonProject(await $.session.cwd(), readIfExists($)))

const INDICATOR = 'addon-studio'

const ownPrefix = ($: EngineInterface) => `${$.plugin.name}:`

// Uma linha por skill: as descriptions do plugin são escalares YAML de uma linha.
const withoutOwnSkills = (listing: string, prefix: string) =>
  listing
    .split('\n')
    .filter(line => !line.startsWith(`- ${prefix}`))
    .join('\n')

export const register: Register = on => {
  // Indicador discreto (cinza, no fim da linha de dica do prompt): `$.ui.status` sai como aviso.
  on('ui.render', { component: 'PromptHint' }, async ($, e, next) => {
    if (await isOutsideAddonProject($)) return next(e)
    const tail = e.props.tail === undefined ? INDICATOR : `${e.props.tail} · ${INDICATOR}`
    return next({ ...e, props: { ...e.props, tail } })
  })

  on('prompt.attachment', { type: 'skill_listing' }, async ($, e, next) => {
    if (!(await isOutsideAddonProject($))) return next(e)
    return next({ ...e, text: withoutOwnSkills(e.text, ownPrefix($)) })
  })

  on('agent.offer', async ($, e, next) => {
    if (!e.agent.startsWith(ownPrefix($)) || !(await isOutsideAddonProject($))) return next(e)
    return { isOffered: false }
  })

  on('command.describe', async ($, e, next) => {
    if (!e.command.startsWith(ownPrefix($)) || !(await isOutsideAddonProject($))) return next(e)
    return next({ ...e, isHidden: true })
  })

  on('tool.call', { tool: 'Skill' }, async ($, e, next) => {
    if (!e.skill.startsWith(ownPrefix($)) || !(await isOutsideAddonProject($))) return next(e)
    return { deny: `${e.skill}: skill de projeto Sankhya Addon Studio, e este diretório não aplica o plugin Gradle br.com.sankhya.addonstudio.` }
  })
}
