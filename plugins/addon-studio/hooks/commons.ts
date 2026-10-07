const ADDON_GRADLE_PLUGIN = 'br.com.sankhya.addonstudio'
const BUILD_FILES = ['build.gradle', 'build.gradle.kts']

// A status line é uma só por plugin: quem a usa de passagem devolve este texto ao terminar.
export const ACTIVE_STATUS = 'addon-studio ativo'

export const parentOf = (path: string) => path.replace(/[\\/]+[^\\/]*$/, '')

// Conteúdo do arquivo, ou undefined quando ele não existe. Recebido de quem chama porque
// `$` não atravessa import: o engine só o segue em função declarada no próprio arquivo.
export type ReadIfExists = (path: string) => Promise<string | undefined>

// O módulo -vc não aplica o plugin Gradle, a raiz sim: por isso a subida até a raiz.
export const findAddonRoot = async (startDir: string, readIfExists: ReadIfExists) => {
  for (let dir = startDir; dir !== ''; ) {
    for (const name of BUILD_FILES) {
      if ((await readIfExists(`${dir}/${name}`))?.includes(ADDON_GRADLE_PLUGIN)) return dir
    }
    const parent = parentOf(dir)
    if (parent === dir) return undefined
    dir = parent
  }
  return undefined
}

export const isInAddonProject = async (startDir: string, readIfExists: ReadIfExists) =>
  (await findAddonRoot(startDir, readIfExists)) !== undefined
