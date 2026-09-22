import type { ReactNode } from 'react'

interface CalloutProps {
  type?: 'note' | 'warning'
  title?: string
  children: ReactNode
}

/** `<Callout title="Heads up">text</Callout>` inside MDX. */
export function Callout({ type = 'note', title, children }: CalloutProps) {
  return (
    <aside className={`callout callout--${type}`} role="note">
      {title && <strong className="callout__title">{title}</strong>}
      {children}
    </aside>
  )
}

/** Marks a page as an outline. Delete it (and `draft: true`) once the page is written. */
export function Draft({ source }: { source?: string }) {
  return (
    <aside className="callout callout--draft" role="note">
      <strong className="callout__title">Draft</strong>
      This page is an outline. Write it following AGENTS.md, section &ldquo;Writing docs&rdquo;.
      {source && (
        <>
          {' '}
          Source of truth: <code>{source}</code>
        </>
      )}
    </aside>
  )
}
