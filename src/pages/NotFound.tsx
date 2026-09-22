import { Link } from 'react-router'
import { useTitle } from '../lib/hooks'
import { site } from '../site.config'

export function NotFound() {
  useTitle(`Not found · ${site.name}`)
  return (
    <div className="container" style={{ padding: '120px 24px', textAlign: 'center' }}>
      <p className="section__eyebrow">404</p>
      <h1 className="section__title">This page does not exist.</h1>
      <p className="section__lead">It may have moved. The docs index lists everything that is here.</p>
      <div className="hero__actions">
        <Link to="/docs" className="btn btn--primary">
          Browse the docs
        </Link>
        <Link to="/" className="btn btn--secondary">
          Home
        </Link>
      </div>
    </div>
  )
}
