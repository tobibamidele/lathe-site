import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { Menu, X } from 'lucide-react'
import { site } from '../site.config'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'header__link active' : 'header__link')

export function Header() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])

  return (
    <header className="header">
      <div className="container header__inner">
        <Link to="/" className="brand" aria-label={`${site.name} home`}>
          <Logo />
          <span>{site.name}</span>
        </Link>

        <nav className="header__nav" aria-label="Primary">
          <NavLink to="/" end className={navClass}>
            Home
          </NavLink>
          <NavLink to="/docs" className={navClass}>
            Docs
          </NavLink>
          <a className="header__link" href={site.repo} target="_blank" rel="noreferrer noopener">
            GitHub
          </a>
        </nav>

        <div className="header__actions">
          <ThemeToggle />
          <Link to={site.getStartedPath} className="btn btn--primary">
            Get started
          </Link>
          <button
            type="button"
            className="icon-btn header__menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="mobile-panel" aria-label="Mobile">
          <Link to="/">Home</Link>
          <Link to="/docs">Docs</Link>
          <a href={site.repo} target="_blank" rel="noreferrer noopener">
            GitHub
          </a>
          <Link to={site.getStartedPath} className="btn btn--primary btn--lg">
            Get started
          </Link>
        </nav>
      )}
    </header>
  )
}
