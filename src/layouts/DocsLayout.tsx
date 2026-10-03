import { useEffect, useRef, useState, type Ref } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { ChevronDown } from 'lucide-react'
import { Palette, SearchTrigger, useDocsSearch } from '../components/DocsSearch'
import { getSections } from '../lib/docs'

interface SidebarProps {
  /** Omitted on mobile, where the entry point is in the bar above the drawer. */
  onSearch?: () => void
  searchOpen?: boolean
  triggerRef?: Ref<HTMLButtonElement>
}

function Sidebar({ onSearch, searchOpen = false, triggerRef }: SidebarProps) {
  return (
    <nav className="sidebar" aria-label="Documentation">
      {onSearch && <SearchTrigger open={searchOpen} onOpen={onSearch} ref={triggerRef} />}
      <Link to="/docs" className="sidebar__label">
        Docs
      </Link>
      {getSections().map((section) => (
        <div className="sidebar__group" key={section.title}>
          <span className="sidebar__label">{section.title}</span>
          <ul className="sidebar__list">
            {section.docs.map((doc) => (
              <li key={doc.slug}>
                <NavLink to={`/docs/${doc.slug}`} className="sidebar__link">
                  {doc.title}
                  {doc.draft && <span className="sidebar__soon">soon</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

/** Sidebar on the left, the page (docs index or a doc) on the right. */
export function DocsLayout() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { open: searching, query, setQuery, openPalette, closePalette, pick } = useDocsSearch(pathname)
  const sidebarTrigger = useRef<HTMLButtonElement>(null)
  const mobileTrigger = useRef<HTMLButtonElement>(null)

  useEffect(() => setOpen(false), [pathname])

  return (
    <div className="container docs">
      <div className="docs-mobile">
        <div className="docs-mobile__bar">
          <button
            type="button"
            className="docs-mobile__toggle"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            Documentation menu
            <ChevronDown size={16} />
          </button>
          <SearchTrigger
            className="docs-mobile__search"
            open={searching}
            ref={mobileTrigger}
            onOpen={() => openPalette(mobileTrigger.current)}
          />
        </div>
        {open && <Sidebar />}
      </div>
      <div className="docs__sidebar-slot">
        <Sidebar
          searchOpen={searching}
          onSearch={() => openPalette(sidebarTrigger.current)}
          triggerRef={sidebarTrigger}
        />
      </div>
      <div className="docs__content">
        <Outlet />
      </div>
      {searching && (
        <Palette query={query} setQuery={setQuery} onClose={closePalette} onPick={pick} />
      )}
    </div>
  )
}
