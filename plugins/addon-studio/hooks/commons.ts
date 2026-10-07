const ADDON_GRADLE_PLUGIN = 'br.com.sankhya.addonstudio'
const BUILD_FILES = ['build.gradle', 'build.gradle.kts']

export const parentOf = (path: string) => path.replace(/[\\/]+[^\\/]*$/, '')

// Conteúdo do arquivo, ou undefined quando ele não existe. Recebido de quem chama porque
// `$` não atravessa import: o engine só o segue em função declarada no próprio arquivo.
export type ReadIfExists = (path: string) => Promise<string | undefined>

// O módulo -vc não aplica o plugin Gradle, a raiz sim: por isso a subida até a raiz.
export const isInAddonProject = async (startDir: string, readIfExists: ReadIfExists) => {
  for (let dir = startDir; dir !== ''; ) {
    for (const name of BUILD_FILES) {
      if ((await readIfExists(`${dir}/${name}`))?.includes(ADDON_GRADLE_PLUGIN)) return true
    }
    const parent = parentOf(dir)
    if (parent === dir) return false
    dir = parent
  }
  return false
}
