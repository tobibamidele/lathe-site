import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { getDoc, getDocComponent, getNeighbors, type DocMeta } from '../../lib/docs'
import { useTitle } from '../../lib/hooks'
import { mdxComponents } from '../../components/mdx'
import { site } from '../../site.config'
import { NotFound } from '../NotFound'
import { Toc, type Heading } from './Toc'

/** Runs once the lazily loaded MDX has rendered, so headings can be collected. */
function Ready({ onReady }: { onReady: () => void }) {
  useEffect(onReady, [onReady])
  return null
}

function DocView({ meta }: { meta: DocMeta }) {
  const Content = getDocComponent(meta.slug)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [headings, setHeadings] = useState<Heading[]>([])
  const { prev, next } = getNeighbors(meta.slug)
  const { hash } = useLocation()
  useTitle(`${meta.title} · ${site.name}`)

  // ScrollToTop handles the hash on navigation, but the body is lazy: the target does not
  // exist yet when it looks. Wait for the headings, which only arrive once MDX has rendered.
  useEffect(() => {
    if (!hash || headings.length === 0) return
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (!target) return
      target.scrollIntoView()
      // Land keyboard and screen reader users on the section too, not above it.
      target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [hash, headings])

  const collect = useCallback(() => {
    const nodes = bodyRef.current?.querySelectorAll<HTMLHeadingElement>('h2[id], h3[id]') ?? []
    setHeadings(
      Array.from(nodes, (n) => ({
        id: n.id,
        text: n.textContent ?? '',
        depth: n.tagName === 'H2' ? 2 : 3,
      })),
    )
  }, [])

  if (!Content) return <NotFound />

  return (
    <div className="doc">
      <article>
        <p className="doc__eyebrow">{meta.section}</p>
        <h1 className="doc__title">{meta.title}</h1>
        <p className="doc__lead">{meta.description}</p>

        <div className="doc__body prose" ref={bodyRef}>
          <Suspense fallback={<div className="doc__loading" aria-hidden="true" />}>
            <Content components={mdxComponents} />
            <Ready onReady={collect} />
          </Suspense>
        </div>

        <a className="edit-link" href={`${site.editBase}${meta.slug}.mdx`} target="_blank" rel="noreferrer noopener">
          Edit this page
        </a>

        {(prev || next) && (
          <nav className="pager" aria-label="Previous and next page">
            {prev && (
              <Link className="pager__link" to={`/docs/${prev.slug}`}>
                <span className="pager__hint">Previous</span>
                <span className="pager__title">{prev.title}</span>
              </Link>
            )}
            {next && (
              <Link className="pager__link pager__link--next" to={`/docs/${next.slug}`}>
                <span className="pager__hint">Next</span>
                <span className="pager__title">{next.title}</span>
              </Link>
            )}
          </nav>
        )}
      </article>
      <Toc headings={headings} />
    </div>
  )
}

/** /docs/:slug */
export function DocPage() {
  const { slug = '' } = useParams()
  const meta = getDoc(slug)
  if (!meta) return <NotFound />
  // key: a new page starts with fresh heading state
  return <DocView key={slug} meta={meta} />
}
