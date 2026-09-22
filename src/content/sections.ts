export interface SectionMeta {
  title: string
  /** Shown on the docs index card for this section. */
  description: string
}

/** Sidebar and docs index order. A doc's `section` frontmatter must match a title here. */
export const sections: SectionMeta[] = [
  { title: 'Getting started', description: 'Install lathe, define a schema and run your first query.' },
  { title: 'Schema', description: 'Tables, column types, keys, indexes and defaults.' },
  { title: 'Connect', description: 'Open a connection to PostgreSQL, MySQL or SQLite and tune it.' },
  { title: 'Querying', description: 'Read, write, filter, join, preload relations, upsert and run transactions.' },
  { title: 'Migrations', description: 'Generate, review, apply and revert SQL migrations.' },
  { title: 'Debugging', description: 'Log statements, inspect the generated SQL and understand errors.' },
  { title: 'Reference', description: 'Every CLI command, the type mapping and known limitations.' },
]
