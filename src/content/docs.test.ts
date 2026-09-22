import { describe, expect, it } from 'vitest'
import { getDocComponent, getDocs, getSections } from '../lib/docs'
import { sections } from './sections'

describe('docs content', () => {
  const docs = getDocs()

  it('has no pages left in draft', () => {
    // All 27 pages are written. If a future page is added as `draft: true`, this starts
    // failing on purpose — delete this assertion (not the whole test) once that is expected again.
    expect(docs.filter((d) => d.draft)).toEqual([])
  })

  it('has pages', () => {
    expect(docs.length).toBeGreaterThan(0)
  })

  it('gives every page a title, description, known section and order', () => {
    for (const d of docs) {
      expect(d.title, `${d.slug}: title`).toBeTruthy()
      expect(d.description, `${d.slug}: description`).toBeTruthy()
      expect(sections.map((s) => s.title), `${d.slug}: section "${d.section}" is not in sections.ts`).toContain(
        d.section,
      )
      expect(Number.isInteger(d.order) && d.order >= 1, `${d.slug}: order must be a positive integer`).toBe(true)
    }
  })

  it('uses kebab-case slugs, each once', () => {
    const slugs = docs.map((d) => d.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('has one position per section (no two pages share an order)', () => {
    const seen = new Set<string>()
    for (const d of docs) {
      const key = `${d.section}:${d.order}`
      expect(seen.has(key), `${d.slug}: order ${d.order} is already used in "${d.section}"`).toBe(false)
      seen.add(key)
    }
  })

  it('keeps every section non-empty and in the declared order', () => {
    const shown = getSections().map((s) => s.title)
    expect(shown).toEqual(sections.map((s) => s.title).filter((t) => shown.includes(t)))
    for (const s of sections) expect(shown, `section "${s.title}" has no pages`).toContain(s.title)
  })

  it('can load every page body', () => {
    for (const d of docs) expect(getDocComponent(d.slug), d.slug).toBeDefined()
  })
})
