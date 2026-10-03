declare module 'virtual:docs-meta' {
  import type { Frontmatter } from './content/types'

  /** Frontmatter of every doc plus its slug, produced by plugins/docs-meta.ts. */
  const docs: (Frontmatter & { slug: string })[]
  export default docs
}

declare module 'virtual:docs-search' {
  import type { SearchRecord } from '../plugins/docs-search'

  /** One entry per page and per heading, produced by plugins/docs-search.ts. */
  const records: SearchRecord[]
  export default records
}
