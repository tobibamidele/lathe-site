import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type Ref,
} from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router'
import { CornerDownLeft, Search, X } from 'lucide-react'
import { browseDocs, hitTo, preloadIndex, searchDocs, type SearchHit } from '../lib/search'

/** ⌘K on Apple hardware, Ctrl K elsewhere. Read once: it cannot change mid-session. */
const isApple = () => typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent)

/**
 * Everything tabbable inside the palette. The results are deliberately absent: a combobox is
 * driven with aria-activedescendant, so its options never enter the tab order.
 */
const FOCUSABLE = 'input, button:not([disabled])'

interface TriggerProps {
  className?: string
  open: boolean
  onOpen: () => void
  ref?: Ref<HTMLButtonElement>
}

/** The button that opens the palette. Rendered once per place search is offered. */
export function SearchTrigger({ className = '', open, onOpen, ref }: TriggerProps) {
  return (
    <button
      ref={ref}
      type="button"
      className={`search-trigger ${className}`.trim()}
      // Named explicitly: the mobile variant hides the label, and the name must not depend on CSS.
      aria-label="Search docs"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={onOpen}
    >
      <Search size={15} />
      <span className="search-trigger__label">Search docs</span>
      <kbd>{isApple() ? '⌘' : 'Ctrl'} K</kbd>
    </button>
  )
}

/** The palette. Lives in a portal so the sticky, scrolling sidebar cannot clip it. */
export function Palette({
  query,
  setQuery,
  onClose,
  onPick,
}: {
  query: string
  setQuery: (query: string) => void
  onClose: () => void
  onPick: (hit: SearchHit) => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [hits, setHits] = useState<SearchHit[]>([])
  const [active, setActive] = useState(0)
  const [searched, setSearched] = useState(false)
  const titleId = useId()
  const listId = useId()

  // A blank query browses every page in reading order instead of searching.
  const browse = useMemo(() => browseDocs(), [])
  const results = query.trim() ? hits : browse

  useEffect(() => {
    let cancelled = false
    searchDocs(query)
      .then((found) => {
        if (cancelled) return
        setHits(found)
        setSearched(true)
      })
      .catch(() => !cancelled && setSearched(true))
    return () => {
      cancelled = true
    }
  }, [query])

  const move = (delta: number) => {
    if (results.length === 0) return
    setActive((current) => (current + delta + results.length) % results.length)
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        move(1)
        break
      case 'ArrowUp':
        e.preventDefault()
        move(-1)
        break
      case 'Home':
        if (results.length > 0) (e.preventDefault(), setActive(0))
        break
      case 'End':
        if (results.length > 0) (e.preventDefault(), setActive(results.length - 1))
        break
      case 'Enter':
        if (results[active]) {
          e.preventDefault()
          onPick(results[active])
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
      case 'Tab': {
        // Keep focus in the palette: the input, the close button, then back round.
        const focusable = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
        if (!focusable || focusable.length === 0) return
        const at = Array.from(focusable).indexOf(document.activeElement as HTMLElement)
        e.preventDefault()
        focusable[(at + (e.shiftKey ? -1 : 1) + focusable.length) % focusable.length]?.focus()
      }
    }
  }

  const pending = query.trim().length > 0 && !searched

  return createPortal(
    <div className="search-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="search-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panelRef}
        onKeyDown={onKeyDown}
      >
        <h2 className="sr-only" id={titleId}>
          Search the documentation
        </h2>

        <div className="search-field">
          <Search size={17} className="search-field__icon" />
          <input
            className="search-input"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={results.length > 0 ? listId : undefined}
            aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
            aria-autocomplete="list"
            autoFocus
            spellCheck={false}
            placeholder="Search the docs"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
          />
          <button type="button" className="search-clear" onClick={onClose} aria-label="Close search">
            <X size={16} />
          </button>
        </div>

        <div className="search-results">
          {results.length > 0 ? (
            <div id={listId} role="listbox" aria-label="Search results">
              {results.map((hit, i) => (
                <Link
                  key={`${hit.slug}#${hit.anchor}`}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className="search-result"
                  tabIndex={-1}
                  to={hitTo(hit)}
                  onMouseEnter={() => setActive(i)}
                  onClick={onClose}
                >
                  <span className="search-result__title">{hit.title}</span>
                  <span className="search-result__heading">
                    {hit.heading ? `${hit.section} · ${hit.heading}` : hit.section}
                  </span>
                  {hit.snippet && (
                    <span className="search-result__snippet">
                      {hit.snippet.before}
                      {hit.snippet.match && <mark>{hit.snippet.match}</mark>}
                      {hit.snippet.after}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="search-empty" aria-live="polite">
              {pending ? 'Searching…' : query.trim() ? `No results for “${query.trim()}”` : 'Type to search'}
            </p>
          )}
        </div>

        <div className="search-footer">
          <span className="search-footer__count" aria-live="polite">
            {query.trim() && searched
              ? `${results.length} ${results.length === 1 ? 'result' : 'results'}`
              : `${browse.length} pages`}
          </span>
          <span className="search-footer__hints">
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd> to navigate
            </span>
            <span>
              <kbd>
                <CornerDownLeft size={11} />
              </kbd>{' '}
              to open
            </span>
            <span>
              <kbd>esc</kbd> to close
            </span>
          </span>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export interface DocsSearch {
  open: boolean
  query: string
  setQuery: (query: string) => void
  /** `from` is who to send focus back to when the palette closes. */
  openPalette: (from?: HTMLElement | null) => void
  closePalette: () => void
  pick: (hit: SearchHit) => void
}

/**
 * Owns the palette for the docs shell.
 *
 * Lives in the layout, not in the trigger, because the sidebar is rendered twice (desktop and
 * mobile) and two listeners would open two palettes on the same ⌘K.
 *
 * `pathname` is passed in so the palette can close itself when the route changes underneath it
 * (browser back and forward). Following a result already closes it.
 */
export function useDocsSearch(pathname: string): DocsSearch {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const returnFocusTo = useRef<HTMLElement | null>(null)
  const openedAt = useRef<string | null>(null)
  const navigate = useNavigate()

  // Start fetching as soon as the docs shell is on screen, so the palette never waits.
  useEffect(() => {
    preloadIndex().catch(() => {
      /* the palette reports its own state; nothing to do here */
    })
  }, [])

  const openPalette = useCallback(
    (from?: HTMLElement | null) => {
      returnFocusTo.current = from ?? null
      openedAt.current = pathname
      setOpen(true)
    },
    [pathname],
  )

  const closePalette = useCallback(() => {
    setOpen(false)
    setQuery('')
    returnFocusTo.current?.focus()
  }, [])

  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        // A no-op while the palette is already up. Re-opening would replace the element we owe
        // focus back to with the palette's own input, and Escape would then return focus to a
        // node that is being unmounted, leaving it on the body.
        if (open) return
        const from = document.activeElement instanceof HTMLElement ? document.activeElement : null
        openPalette(from)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, openPalette])

  useEffect(() => {
    if (open && openedAt.current !== null && openedAt.current !== pathname) closePalette()
  }, [pathname, open, closePalette])

  // The page behind must not scroll under the palette.
  useEffect(() => {
    if (!open) return
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.removeProperty('overflow')
    }
  }, [open])

  const pick = useCallback(
    (hit: SearchHit) => {
      setOpen(false)
      setQuery('')
      navigate(hitTo(hit))
    },
    [navigate],
  )

  return { open, query, setQuery, openPalette, closePalette, pick }
}
