import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { ChevronDown } from 'lucide-react'
import { getSections } from '../lib/docs'

function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Documentation">
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
  useEffect(() => setOpen(false), [pathname])

  return (
    <div className="container docs">
      <div className="docs-mobile">
        <button
          type="button"
          className="docs-mobile__toggle"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          Documentation menu
          <ChevronDown size={16} />
        </button>
        {open && <Sidebar />}
      </div>
      <div className="docs__sidebar-slot">
        <Sidebar />
      </div>
      <div className="docs__content">
        <Outlet />
      </div>
    </div>
  )
}
