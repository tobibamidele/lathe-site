/** YAML frontmatter at the top of every file in src/content/docs. */
export interface Frontmatter {
  title: string
  /** One sentence. Shown under the title and on the docs index. */
  description: string
  /** Must match a `title` in sections.ts. */
  section: string
  /** Position inside the section, starting at 1. */
  order: number
  /** Marks an outline that still needs writing. Shows a "soon" tag in the sidebar. */
  draft?: boolean
}
