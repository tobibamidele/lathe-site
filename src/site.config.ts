/**
 * Everything that is likely to change when the project is renamed, published or
 * moved lives here, so pages never hard-code it.
 */
export const site = {
  name: 'lathe',
  tagline: 'A schema-first ORM toolchain for Go.',
  repo: 'https://github.com/tobibamidele/lathe',
  modulePath: 'github.com/tobibamidele/lathe',
  installCommand: 'go install github.com/tobibamidele/lathe/cmd/lathe@latest',
  /** Where "Get started" buttons point. */
  getStartedPath: '/docs/installation',
  /** "Edit this page" links: base URL + `<slug>.mdx`. */
  editBase: 'https://github.com/tobibamidele/lathe-site/edit/main/src/content/docs/',
} as const
