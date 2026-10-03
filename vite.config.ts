import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import rehypeSlug from 'rehype-slug'
import rehypeShiki from '@shikijs/rehype'
import { docsMeta } from './plugins/docs-meta.ts'
import { docsSearch } from './plugins/docs-search.ts'

// Docs are MDX files in src/content/docs. They are compiled at build time:
//   - frontmatter becomes a named `frontmatter` export
//   - headings get ids (rehype-slug), used by the "On this page" list
//   - fenced code is syntax highlighted (rehype-shiki) with the GitHub dark/light
//     palettes. defaultColor: false makes shiki emit `--shiki-dark` / `--shiki-light`
//     CSS variables instead of fixed colours, so one build serves both themes.
//     The "On this page" bar and CodeBlock read the language-* class for the label.
export default defineConfig({
  plugins: [
    docsMeta(),
    docsSearch(),

    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [
            rehypeShiki,
            {
              themes: { dark: 'github-dark', light: 'github-light' },
              defaultColor: false,
              addLanguageClass: true,
              langs: ['go', 'sql', 'bash', 'json', 'yaml'],
            },
          ],
        ],
      }),
    },
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    css: false,
  },
})
