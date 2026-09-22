declare module 'virtual:docs-meta' {
  import type { Frontmatter } from './content/types'

  /** Frontmatter of every doc plus its slug, produced by plugins/docs-meta.ts. */
  const docs: (Frontmatter & { slug: string })[]
  export default docs
}
