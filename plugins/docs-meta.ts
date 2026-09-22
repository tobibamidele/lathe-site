import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { Plugin } from 'vite'
import YAML from 'yaml'

const VIRTUAL_ID = 'virtual:docs-meta'
const RESOLVED_ID = '\0' + VIRTUAL_ID

/**
 * Exposes the frontmatter of every file in src/content/docs as `virtual:docs-meta`.
 *
 * Why not read `frontmatter` from each MDX module? Importing it, even eagerly, pulls the
 * whole page body into the importing chunk. Parsing the YAML here keeps metadata in the
 * main bundle (a few hundred bytes per page) while page bodies stay lazy chunks.
 */
export function docsMeta(dir = 'src/content/docs'): Plugin {
  const root = resolve(dir)

  function read() {
    return readdirSync(root)
      .filter((f) => f.endsWith('.mdx'))
      .sort()
      .map((file) => {
        const source = readFileSync(join(root, file), 'utf8')
        const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source)
        if (!match) throw new Error(`${dir}/${file}: missing YAML frontmatter`)
        let data: unknown
        try {
          data = YAML.parse(match[1])
        } catch (err) {
          throw new Error(`${dir}/${file}: invalid frontmatter (${(err as Error).message}). Quote titles and descriptions.`)
        }
        return { ...(data as object), slug: file.replace(/\.mdx$/, '') }
      })
  }

  return {
    name: 'lathe-docs-meta',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined
    },
    load(id) {
      if (id !== RESOLVED_ID) return undefined
      const docs = read()
      // Watch files, not the directory: adds and removals are handled in configureServer.
      for (const d of docs) this.addWatchFile(join(root, `${d.slug}.mdx`))
      return `export default ${JSON.stringify(docs)}`
    },
    configureServer(server) {
      // Adding, removing or editing a doc can change the sidebar: refresh the module.
      const refresh = (file: string) => {
        if (!file.startsWith(root) || !file.endsWith('.mdx')) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', refresh).on('unlink', refresh).on('change', refresh)
    },
  }
}
