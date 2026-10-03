import type Fuse from 'fuse.js'
import type { IFuseOptions } from 'fuse.js'
import type { SearchRecord } from '../../plugins/docs-search'
import { getDocs } from './docs'

export type { SearchRecord }

/** A piece of a result with the matching run called out, so callers can render <mark>. */
export interface Snippet {
  before: string
  match: string
  after: string
}

export interface SearchHit {
  slug: string
  /** Heading id, or '' for the page as a whole. */
  anchor: string
  title: string
  heading: string
  section: string
  snippet: Snippet | null
}

const LIMIT = 10

// Title and heading rank far above body text, so `dialect` surfaces the page about dialects
// rather than every page that happens to mention one. Code carries the lowest weight but is
// still searched: flag names like --dialect live only there.
const OPTIONS: IFuseOptions<SearchRecord> = {
  keys: [
    { name: 'title', weight: 0.5 },
    { name: 'heading', weight: 0.3 },
    { name: 'description', weight: 0.15 },
    { name: 'text', weight: 0.1 },
    { name: 'code', weight: 0.05 },
    { name: 'section', weight: 0.02 },
  ],
  threshold: 0.32,
  ignoreLocation: true,
  minMatchCharLength: 2,
}

// The index and fuse.js are both imported dynamically, so neither reaches the main bundle:
// they arrive in one chunk the first time someone searches.
let indexPromise: Promise<Fuse<SearchRecord>> | undefined

/** Warms the index. Called when the search widget mounts, not when it opens. */
export function preloadIndex(): Promise<Fuse<SearchRecord>> {
  return (indexPromise ??= loadIndex())
}

async function loadIndex(): Promise<Fuse<SearchRecord>> {
  const [{ default: records }, { default: Fuse }] = await Promise.all([
    import('virtual:docs-search'),
    import('fuse.js'),
  ])
  return new Fuse(rankRecords(records), OPTIONS)
}

/** Reading order, so results and the browse list follow the sidebar rather than the alphabet. */
function rankRecords(records: SearchRecord[]): SearchRecord[] {
  const order = new Map(getDocs().map((d, i) => [d.slug, i]))
  return [...records].sort((a, b) => (order.get(a.slug) ?? Infinity) - (order.get(b.slug) ?? Infinity))
}

const ellipsis = '…'

function tokensOf(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
    .filter((token) => token.length >= 2)
}

/** Widens a hit to a readable window around the first literal match of a query token. */
function snippetOf(record: SearchRecord, tokens: string[]): Snippet | null {
  const radius = 70
  for (const haystack of [record.text, record.code]) {
    if (!haystack) continue
    const lower = haystack.toLowerCase()
    for (const token of tokens) {
      const at = lower.indexOf(token)
      if (at === -1) continue
      const start = Math.max(0, at - radius)
      const end = Math.min(haystack.length, at + token.length + radius)
      return {
        before: (start > 0 ? ellipsis : '') + haystack.slice(start, at).trimStart(),
        match: haystack.slice(at, at + token.length),
        after: haystack.slice(at + token.length, end).trimEnd() + (end < haystack.length ? ellipsis : ''),
      }
    }
  }
  return null
}

function toHit(record: SearchRecord, tokens: string[]): SearchHit {
  return {
    slug: record.slug,
    anchor: record.anchor,
    title: record.title,
    heading: record.heading,
    section: record.section,
    snippet: snippetOf(record, tokens),
  }
}

/** Where a hit takes you. Exported so the component and the tests agree on it. */
export const hitTo = (hit: SearchHit) => (hit.anchor ? `/docs/${hit.slug}#${hit.anchor}` : `/docs/${hit.slug}`)

/** Fuzzy search over every page and heading. Resolves to [] for a blank query. */
export async function searchDocs(query: string): Promise<SearchHit[]> {
  const tokens = tokensOf(query)
  if (tokens.length === 0) return []
  const fuse = await preloadIndex()
  return fuse.search(tokens.join(' ')).slice(0, LIMIT).map((result) => toHit(result.item, tokens))
}

/** Every page in reading order, for the palette's idle state. */
export function browseDocs(): SearchHit[] {
  return getDocs().map((doc) => ({
    slug: doc.slug,
    anchor: '',
    title: doc.title,
    heading: '',
    section: doc.section,
    snippet: { before: doc.description, match: '', after: '' },
  }))
}
