import { useEffect, useState } from 'react'

export interface Heading {
  id: string
  text: string
  depth: 2 | 3
}

/** How far below the top of the viewport a heading counts as "current" (header + breathing room). */
const OFFSET = 96

/** "On this page": the headings of the current doc, with the one being read marked. */
export function Toc({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState<string>()

  useEffect(() => {
    if (headings.length === 0) return
    const els = headings.map((h) => document.getElementById(h.id)).filter((el): el is HTMLElement => el !== null)
    if (els.length === 0) return

    let frame = 0
    // Position based rather than IntersectionObserver based, so it is right after a jump
    // (a #link, or a reload halfway down the page) and not only after scrolling through.
    const update = () => {
      frame = 0
      let current = els[0].id
      for (const el of els) {
        if (el.getBoundingClientRect().top - OFFSET <= 0) current = el.id
        else break
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
      if (atBottom) current = els[els.length - 1].id
      setActive(current)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [headings])

  if (headings.length === 0) return null
  return (
    <nav className="toc" aria-label="On this page">
      <span className="toc__label">On this page</span>
      <ul className="toc__list">
        {headings.map((h) => (
          <li key={h.id}>
            <a href={`#${h.id}`} className="toc__link" data-depth={h.depth} data-active={active === h.id}>
              {h.text.replace(/#$/, '')}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
