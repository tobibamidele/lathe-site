import { describe, expect, it } from 'vitest'
import { buildSearchIndex, cleanProse, type SearchRecord } from './docs-search.ts'
import { readDocs, type SourceDoc } from './docs-meta.ts'

/** Wraps a body the way a real doc file is wrapped: frontmatter, then content. */
function index(body: string, frontmatter: Record<string, unknown> = {}): SearchRecord[] {
  const source = `---\ntitle: "Page"\n---\n${body}`
  const doc: SourceDoc = { slug: 'page', source, frontmatter: { title: 'Page', ...frontmatter } }
  return buildSearchIndex([doc])
}

describe('cleanProse', () => {
  it('flattens markdown to words', () => {
    const prose = cleanProse(
      ['# Title', '', 'A **bold** and _soft_ [link](/docs/reading) line.', '', '- one', '- two'].join('\n'),
    )
    expect(prose).toBe('Title A bold and soft link line. one two')
  })

  it('keeps the words inside JSX but not the tags', () => {
    expect(cleanProse('<Callout title="Heads up">Watch out.</Callout>')).toBe('Heads up Watch out.')
    expect(cleanProse('<Tabs labels={[\'PostgreSQL\', \'MySQL\']}></Tabs>')).toBe('')
  })

  it('drops table pipes and header rules', () => {
    expect(cleanProse('| Database | Options |\n| --- | --- |\n| SQLite | WAL |')).toBe('Database Options SQLite WAL')
  })

  it('unwraps images and reference definitions', () => {
    expect(cleanProse('![the logo](/logo.svg)\n\n[ref]: https://example.com')).toBe('the logo')
  })
})

describe('buildSearchIndex', () => {
  it('makes one record per heading plus one for the page', () => {
    const records = index(['Intro.', '', '## First', '', 'One.', '', '### Nested', '', 'Two.'].join('\n'))
    expect(records.map((r) => r.anchor)).toEqual(['', 'first', 'nested'])
    expect(records.map((r) => r.heading)).toEqual(['', 'First', 'Nested'])
    expect(records.map((r) => r.text)).toEqual(['Intro.', 'One.', 'Two.'])
  })

  it('keeps a page record even when a page opens straight into a heading', () => {
    const records = index('## First\n\nOne.')
    expect(records.map((r) => r.anchor)).toEqual(['', 'first'])
    expect(records[0]).toMatchObject({ title: 'Page', text: '' })
  })

  it('slugs headings the way rehype-slug does, so anchors resolve', () => {
    const records = index('Intro.\n\n## Connection pool\n\na\n\n## What Open sets up for you\n\nb\n\n## Next\n\nc')
    expect(records.map((r) => r.anchor)).toEqual(['', 'connection-pool', 'what-open-sets-up-for-you', 'next'])
  })

  it('dedupes repeated headings per file', () => {
    expect(index('Intro.\n\n## Notes\n\na\n\n## Notes\n\nb').map((r) => r.anchor)).toEqual(['', 'notes', 'notes-1'])
  })

  it('keeps fenced code out of the prose and in its own field', () => {
    const records = index('Intro.\n\n## Flags\n\nUse the flag:\n\n```bash\nlathe migrate up --dialect=postgres\n```')
    expect(records[1].text).toBe('Use the flag:')
    expect(records[1].text).not.toContain('dialect')
    expect(records[1].code).toBe('lathe migrate up --dialect=postgres')
  })

  it('follows fences opened inside JSX, and hashes in code are not headings', () => {
    const records = index(
      'Intro.\n\n## Tabs\n\n<Tabs labels={[\'PostgreSQL\']}>\n<Tab>\n\n```go\n# or a comment\n```\n\n</Tab>\n</Tabs>',
    )
    expect(records.map((r) => r.anchor)).toEqual(['', 'tabs'])
    expect(records[1].code).toContain('# or a comment')
  })

  it('copies the frontmatter onto every record', () => {
    expect(index('Intro.\n\n## Deep\n\nbody', { description: 'About depth.', section: 'Schema' })[1]).toMatchObject({
      title: 'Page',
      description: 'About depth.',
      section: 'Schema',
      slug: 'page',
    })
  })

  it('leaves drafts out: an outline is not an answer', () => {
    expect(index('Intro.\n\n## Real\n\nbody', { draft: true })).toEqual([])
  })

  it('caps long fields so one page cannot dominate the index', () => {
    expect(index(`Intro.\n\n## Long\n\n${'word '.repeat(2000)}`)[1].text.length).toBeLessThanOrEqual(1400)
  })

  it('indexes the real docs: a page record each, one record per heading, no duplicates', () => {
    const docs = readDocs().filter((d) => d.frontmatter.draft !== true)
    const records = buildSearchIndex(docs)

    const pageSlugs = records.filter((r) => r.anchor === '').map((r) => r.slug)
    expect(pageSlugs.sort()).toEqual(docs.map((d) => d.slug).sort())
    expect(records.every((r) => r.title && r.slug)).toBe(true)

    const anchors = records.filter((r) => r.anchor !== '').map((r) => `${r.slug}#${r.anchor}`)
    expect(new Set(anchors).size, 'duplicate heading anchors in the index').toBe(anchors.length)
  })
})
