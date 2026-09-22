import { Link } from 'react-router'
import { site } from '../site.config'

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <span>
          {site.name} &middot; MIT licensed &middot; {site.tagline}
        </span>
        <nav className="footer__links" aria-label="Footer">
          <Link to="/docs">Docs</Link>
          <a href={site.repo} target="_blank" rel="noreferrer noopener">
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  )
}
