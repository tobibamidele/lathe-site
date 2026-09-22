import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { getSections } from '../../lib/docs'
import { useTitle } from '../../lib/hooks'
import { site } from '../../site.config'

/** /docs: one card per section, each opening the section's first page. */
export function DocsIndex() {
  useTitle(`Documentation · ${site.name}`)
  return (
    <div>
      <h1 className="docs-index__title">Documentation</h1>
      <p className="docs-index__lead">
        Everything you need to use {site.name}: installing it, connecting to a database, defining a schema, querying,
        migrations and debugging.
      </p>
      <div className="docs-index__grid">
        {getSections().map((section) => (
          <Link key={section.title} to={`/docs/${section.docs[0].slug}`} className="card">
            <span className="card__title">{section.title}</span>
            <span className="card__text">{section.description}</span>
            <span className="card__link">
              Read <ArrowRight size={15} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
