import { join, resolve } from 'node:path'
import type { Plugin } from 'vite'
import GithubSlugger from 'github-slugger'
import { readDocs, type SourceDoc } from './docs-meta.ts'

const VIRTUAL_ID = 'virtual:docs-search'
const RESOLVED_ID = '\0' + VIRTUAL_ID

/** Per-section characters kept. Enough to rank and quote from without bloating the chunk. */
const TEXT_LIMIT = 1400
const CODE_LIMIT = 1400

/** One searchable unit: a whole page, or one `##`/`###` section of one. */
export interface SearchRecord {
  slug: string
  /** Heading id matching rehype-slug, so a hit can link to `/docs/<slug>#<anchor>`. Empty for the page itself. */
  anchor: string
  title: string
  /** Empty for the page record. */
  heading: string
  section: string
  description: string
  /** Prose only. */
  text: string
  /** Fenced code only. Kept apart from prose because flags and call names live here. */
  code: string
}

interface Segment {
  heading: string
  anchor: string
  text: string[]
  code: string[]
}

const fence = /^\s*(```|~~~)/
const atxHeading = /^(#{2,3})\s+(.+?)\s*#*\s*$/

/**
 * Splits an MDX body at its headings, keeping fenced code in its own bucket.
 *
 * Heading ids come from the same `github-slugger` rehype-slug uses, and a fresh slugger per
 * file, so a hit links to an anchor that actually exists and repeated headings dedupe the
 * same way (`notes`, `notes-1`). Never hand-roll these.
 */
function segments(body: string): Segment[] {
  const slugger = new GithubSlugger()
  const out: Segment[] = []
  const intro: Segment = { heading: '', anchor: '', text: [], code: [] }
  let current = intro
  let inFence = false

  for (const line of body.split('\n')) {
    if (fence.test(line)) {
      inFence = !inFence
      continue
    }
    if (!inFence) {
      const heading = atxHeading.exec(line)
      if (heading) {
        current = { heading: heading[2], anchor: slugger.slug(heading[2]), text: [], code: [] }
        out.push(current)
        continue
      }
    }
    ;(inFence ? current.code : current.text).push(line)
  }
  // Whatever came before the first heading is the page record, so it leads the group. It is
// emitted even when empty: it is what makes a page findable by its title and description.
  out.unshift(intro)
  return out
}

/** Flattens MDX and Markdown down to words. Only ever applied outside code fences. */
export function cleanProse(source: string): string {
  return (
    source
      // MDX ESM has nothing to search for.
      .replace(/^\s*(import|export)\s[^\n]*$/gm, ' ')
      // Keep the human part of a JSX attribute, drop the machinery.
      .replace(/<\/?[A-Za-z][^>]*>/g, (tag) => {
        const labels = [...tag.matchAll(/\b(?:title|label|alt)="([^"]*)"/g)].map((m) => m[1])
        return labels.length > 0 ? ` ${labels.join(' ')} ` : ' '
      })
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/^\s*\[[^\]]+\]:.*$/gm, ' ')
      // Table pipes and header rules read as noise.
      .replace(/\|/g, ' ')
      .replace(/^\s*[-=*+|\s:]+$/gm, ' ')
      .replace(/^\s*>\s?/gm, '')
      .replace(/^\s*[-*+]\s+\[[ xX]\]\s+/gm, '')
      .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, '')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/[`*_~]/g, '')
      .replace(/\\([\\`*_{}[\]()#+\-.!])/g, '$1')
      .replace(/\s+/g, ' ')
      .trim()
  )
}

const cap = (value: string, limit: number) => (value.length > limit ? value.slice(0, limit) : value)

/** Builds the whole index. Draft pages are left out: an outline is not an answer. */
export function buildSearchIndex(docs: SourceDoc[]): SearchRecord[] {
  const records: SearchRecord[] = []

  for (const doc of docs) {
    if (doc.frontmatter.draft === true) continue

    const title = typeof doc.frontmatter.title === 'string' ? doc.frontmatter.title : doc.slug
    const description = typeof doc.frontmatter.description === 'string' ? doc.frontmatter.description : ''
    const section = typeof doc.frontmatter.section === 'string' ? doc.frontmatter.section : ''
    const body = doc.source.replace(/^---\r?\n[\s\S]*?\r?\n---/, '')

    for (const segment of segments(body)) {
      const text = cleanProse(segment.text.join('\n'))
      const code = segment.code.join('\n').replace(/\n{3,}/g, '\n\n').trim()
      records.push({
        slug: doc.slug,
        anchor: segment.anchor,
        title,
        heading: segment.heading,
        section,
        description,
        text: cap(text, TEXT_LIMIT),
        code: cap(code, CODE_LIMIT),
      })
    }
  }

  return records
}

/**
 * Exposes the docs search index as `virtual:docs-search`.
 *
 * Separate from `virtual:docs-meta` on purpose: the metadata module is imported by the
 * sidebar and must stay in the main bundle, while the full text of every page does not.
 * src/lib/search.ts imports this dynamically, so it arrives in its own chunk on first use.
 */
export function docsSearch(dir = 'src/content/docs'): Plugin {
  const root = resolve(dir)

  return {
    name: 'lathe-docs-search',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined
    },
    load(id) {
      if (id !== RESOLVED_ID) return undefined
      const docs = readDocs(dir)
      for (const d of docs) this.addWatchFile(join(root, `${d.slug}.mdx`))
      return `export default ${JSON.stringify(buildSearchIndex(docs))}`
    },
    configureServer(server) {
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
