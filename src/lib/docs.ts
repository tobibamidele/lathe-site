import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { MDXComponents } from 'mdx/types'
import docsMeta from 'virtual:docs-meta'
import type { Frontmatter } from '../content/types'
import { sections, type SectionMeta } from '../content/sections'

export interface DocMeta extends Frontmatter {
  slug: string
}

export interface DocSection extends SectionMeta {
  docs: DocMeta[]
}

type MdxComponent = ComponentType<{ components?: MDXComponents }>

// Metadata comes from a build-time virtual module (plugins/docs-meta.ts), so the sidebar
// and the docs index need no page loads. Page bodies are lazy: one chunk each.
const pageModules = import.meta.glob<{ default: MdxComponent }>('../content/docs/*.mdx')

const sectionRank = (title: string) => {
  const i = sections.findIndex((s) => s.title === title)
  return i === -1 ? sections.length : i
}

const allDocs: DocMeta[] = [...docsMeta].sort(
    (a, b) =>
      sectionRank(a.section) - sectionRank(b.section) || a.order - b.order || a.title.localeCompare(b.title),
  )

/** Every doc in reading order (section, then order). */
export const getDocs = (): DocMeta[] => allDocs

export const getDoc = (slug: string): DocMeta | undefined => allDocs.find((d) => d.slug === slug)

/** Sections that have at least one doc, in display order. */
export function getSections(): DocSection[] {
  return sections
    .map((s) => ({ ...s, docs: allDocs.filter((d) => d.section === s.title) }))
    .filter((s) => s.docs.length > 0)
}

export function getNeighbors(slug: string): { prev?: DocMeta; next?: DocMeta } {
  const i = allDocs.findIndex((d) => d.slug === slug)
  if (i === -1) return {}
  return { prev: allDocs[i - 1], next: allDocs[i + 1] }
}

// Lazy components must keep a stable identity between renders.
const lazyCache = new Map<string, LazyExoticComponent<MdxComponent>>()

export function getDocComponent(slug: string): LazyExoticComponent<MdxComponent> | undefined {
  const cached = lazyCache.get(slug)
  if (cached) return cached
  const loader = pageModules[`../content/docs/${slug}.mdx`]
  if (!loader) return undefined
  const component = lazy(loader)
  lazyCache.set(slug, component)
  return component
}
