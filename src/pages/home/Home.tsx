import { Link } from 'react-router'
import {
  ArrowRight,
  Check,
  Copy,
  DatabaseZap,
  GitCompareArrows,
  Layers,
  Network,
  Plug,
  Repeat2,
} from 'lucide-react'
import { Code } from '../../components/Code'
import { Tab, Tabs } from '../../components/Tabs'
import { useCopy, useTitle } from '../../lib/hooks'
import { site } from '../../site.config'
import { generatedSnippet, installSteps, migrationSnippet, querySnippet, schemaSnippet } from './snippets'

function Hero() {
  const { copied, copy } = useCopy()
  return (
    <section className="hero">
      <div className="container">
        <span className="pill">
          <span className="pill__dot" /> v0.1 &middot; early release
        </span>
        <h1 className="hero__title">Describe your database once.</h1>
        <p className="hero__lead">
          {site.name} turns a Go schema into typed queries, relations and SQL migrations for PostgreSQL, MySQL and
          SQLite.
        </p>
        <div className="hero__actions">
          <Link to={site.getStartedPath} className="btn btn--primary btn--lg">
            Get started <ArrowRight size={16} />
          </Link>
          <Link to="/docs" className="btn btn--secondary btn--lg">
            Read the docs
          </Link>
        </div>
        <div className="hero__install">
          <code>{site.installCommand}</code>
          <button type="button" className="code__copy" onClick={() => copy(site.installCommand)}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="hero__showcase">
          <Tabs labels={['Schema', 'Generated', 'Query', 'Migration']}>
            <Tab>
              <Code code={schemaSnippet} lang="go" />
            </Tab>
            <Tab>
              <Code code={generatedSnippet} lang="go" />
            </Tab>
            <Tab>
              <Code code={querySnippet} lang="go" />
            </Tab>
            <Tab>
              <Code code={migrationSnippet} lang="sql" />
            </Tab>
          </Tabs>
        </div>
      </div>
    </section>
  )
}

function Install() {
  return (
    <section className="section" id="install">
      <div className="container">
        <div className="section__head">
          <p className="section__eyebrow">Install</p>
          <h2 className="section__title">From zero to a typed client in three commands.</h2>
          <p className="section__lead">
            You need Go 1.22 or newer and a database. {site.name} depends on no database driver: you import the one you
            already use.
          </p>
        </div>
        <ol className="steps" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {installSteps.map((step) => (
            <li className="step" key={step.title}>
              <div className="step__num" />
              <h3 className="card__title">{step.title}</h3>
              <Code code={step.code} lang={step.lang} />
            </li>
          ))}
        </ol>
        <p className="install__note">
          Full walkthrough in the <Link to="/docs/installation">installation guide</Link> and the{' '}
          <Link to="/docs/quickstart">quickstart</Link>.
        </p>
      </div>
    </section>
  )
}

const features = [
  {
    icon: Layers,
    title: 'Typed, generated queries',
    text: 'Columns are generic, so comparing the wrong type does not compile. Reads use generated accessors, not reflection.',
  },
  {
    icon: GitCompareArrows,
    title: 'Migrations with a down',
    text: 'Diff your schema against a snapshot and get an exact, reviewable up and down migration. Renames are explicit, never guessed.',
  },
  {
    icon: Network,
    title: 'Relations without N+1',
    text: 'Derived from your foreign keys. With loads related rows in batches, filtered, ordered and nested to any depth.',
  },
  {
    icon: Repeat2,
    title: 'Upserts and bulk writes',
    text: 'Upsert and UpsertMany speak ON CONFLICT and ON DUPLICATE KEY, run in one transaction and read the rows back.',
  },
  {
    icon: DatabaseZap,
    title: 'PostgreSQL, MySQL, SQLite',
    text: 'One schema, three databases. SQLite table rebuilds are handled for you, and every engine runs through end-to-end tests.',
  },
  {
    icon: Plug,
    title: 'Bring your own driver',
    text: 'The core has no driver dependency. Use pgx or lib/pq, go-sql-driver/mysql, modernc or mattn sqlite.',
  },
]

function Features() {
  return (
    <section className="section">
      <div className="container">
        <div className="section__head">
          <p className="section__eyebrow">Why {site.name}</p>
          <h2 className="section__title">The feel of Drizzle or Prisma, in plain Go.</h2>
          <p className="section__lead">
            Your schema is Go code, so you get autocomplete, compile errors and normal control flow. Everything else is
            generated from it.
          </p>
        </div>
        <div className="features">
          {features.map(({ icon: Icon, title, text }) => (
            <div className="card feature" key={title}>
              <Icon size={22} strokeWidth={1.75} />
              <span className="card__title">{title}</span>
              <span className="card__text">{text}</span>
            </div>
          ))}
        </div>
        <div className="dbs" aria-label="Supported databases">
          {['PostgreSQL', 'MySQL', 'SQLite'].map((db) => (
            <span className="pill" key={db}>
              {db}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function Cta() {
  return (
    <section className="container">
      <div className="cta">
        <h2 className="cta__title">Ready to try it?</h2>
        <p className="cta__text">Install the CLI, run lathe init, and have a typed client in a few minutes.</p>
        <div className="hero__actions">
          <Link to={site.getStartedPath} className="btn btn--primary btn--lg">
            Get started <ArrowRight size={16} />
          </Link>
          <a href={site.repo} className="btn btn--secondary btn--lg" target="_blank" rel="noreferrer noopener">
            View on GitHub
          </a>
        </div>
      </div>
    </section>
  )
}

export function Home() {
  useTitle(`${site.name}: ${site.tagline}`)
  return (
    <>
      <Hero />
      <Install />
      <Features />
      <Cta />
    </>
  )
}
