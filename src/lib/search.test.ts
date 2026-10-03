import { describe, expect, it } from 'vitest'
import { browseDocs, hitTo, searchDocs } from './search'

describe('searchDocs', () => {
  it('puts the right page first for a title query', async () => {
    const hits = await searchDocs('Installing')
    expect(hits[0].slug).toBe('installation')
    // Both the page and the section that matched are offered, anchored appropriately.
    expect(hits.some((h) => h.anchor === '')).toBe(true)
    expect(hits.some((h) => h.anchor !== '')).toBe(true)
  })

  it('finds a heading inside a page and links to its anchor', async () => {
    const hits = await searchDocs('Connection pool')
    expect(hits[0]).toMatchObject({ slug: 'connecting', anchor: 'connection-pool' })
    expect(hitTo(hits[0])).toBe('/docs/connecting#connection-pool')
  })

  it('finds a keyword that only exists in prose', async () => {
    const hits = await searchDocs('busy timeout')
    expect(hits.map((h) => h.slug)).toContain('connecting')
  })

  it('finds a keyword that only exists in code', async () => {
    // --dialect is a flag: it is in no title, heading or description.
    const hits = await searchDocs('--dialect')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.every((h) => h.slug.length > 0)).toBe(true)
  })

  it('quotes a run that really is in the snippet', async () => {
    const [hit] = await searchDocs('Connection pool')
    const match = hit.snippet?.match.toLowerCase() ?? ''
    expect(['connection', 'pool']).toContain(match)
    expect(hit.snippet?.before.length ?? 0).toBeGreaterThan(0)
  })

  it('tolerates a typo', async () => {
    const hits = await searchDocs('migratons')
    expect(hits.map((h) => h.slug)).toContain('migrations')
  })

  it('returns nothing for a query with no signal', async () => {
    expect(await searchDocs('zzzqqqxyzzy')).toEqual([])
  })

  it('returns nothing for a blank query', async () => {
    expect(await searchDocs('   ')).toEqual([])
    expect(await searchDocs('a')).toEqual([])
  })
})

describe('browseDocs', () => {
  it('lists every page in reading order, ending with the reference pages', async () => {
    const pages = browseDocs()
    expect(pages.length).toBeGreaterThan(20)
    expect(pages[0]).toMatchObject({ slug: 'introduction', section: 'Getting started', anchor: '' })
    expect(pages[0].snippet?.before).toBeTruthy()
    expect(hitTo(pages[pages.length - 1])).toBe('/docs/limitations')
  })
})
