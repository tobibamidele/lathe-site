declare module '*.mdx' {
  import type { ComponentType } from 'react'
  import type { MDXComponents } from 'mdx/types'
  import type { Frontmatter } from './content/types'

  export const frontmatter: Frontmatter
  const MDXContent: ComponentType<{ components?: MDXComponents }>
  export default MDXContent
}
