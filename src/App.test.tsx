import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { App } from './App'

// vitest transforms the MDX chunks and the search index on demand, so the first query in a
// file can take well over the 1s default.
const WAIT = 8000

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('routes', () => {
  it('renders the landing page with the install command', async () => {
    renderAt('/')
    expect(screen.getByRole('heading', { level: 1, name: /describe your database once/i })).toBeTruthy()
    expect(screen.getAllByText(/go install github.com\/tobibamidele\/lathe/).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: /three commands/i })).toBeTruthy()
  })

  it('renders the docs index with a card per section', () => {
    renderAt('/docs')
    expect(screen.getByRole('heading', { level: 1, name: 'Documentation' })).toBeTruthy()
    for (const name of ['Getting started', 'Schema', 'Connect', 'Querying', 'Migrations', 'Debugging', 'Reference']) {
      expect(screen.getAllByText(name).length, name).toBeGreaterThan(0)
    }
  })

  it('renders a written doc page, including MDX components and highlighted code', async () => {
    const { container } = renderAt('/docs/installation')
    expect(await screen.findByRole('heading', { level: 1, name: 'Installation' }, { timeout: WAIT })).toBeTruthy()
    await screen.findByRole('heading', { level: 2, name: /Install the CLI/ }, { timeout: WAIT })
    expect(container.querySelector('.tabs')).not.toBeNull() // <Tabs>
    expect(container.querySelector('.callout')).not.toBeNull() // <Callout>
    expect(container.querySelector('.code pre code span[style*="--shiki-dark"]')).not.toBeNull() // build-time highlighting
    // "On this page" fills in after the page body has rendered
    await waitFor(() => expect(container.querySelector('.toc')).not.toBeNull())
    expect(container.querySelectorAll('.toc__link').length).toBeGreaterThan(3)
  })

  it('shows previous and next links between pages', async () => {
    renderAt('/docs/installation')
    await screen.findByRole('heading', { level: 1, name: 'Installation' }, { timeout: WAIT })
    const pager = screen.getByRole('navigation', { name: /previous and next/i })
    expect(pager.textContent).toContain('Introduction')
    expect(pager.textContent).toContain('Quickstart')
  })

  it('shows the not found page for unknown docs and routes', () => {
    renderAt('/docs/does-not-exist')
    expect(screen.getByRole('heading', { name: /does not exist/i })).toBeTruthy()
  })
})

describe('docs search', () => {
  // The sidebar renders twice (desktop slot and mobile drawer), so scope to the desktop one.
  const sidebar = (container: HTMLElement) => within(container.querySelector('.docs__sidebar-slot') as HTMLElement)
  const palette = () => screen.getByRole('dialog', { name: /search the documentation/i })
  const input = () => screen.getByRole('combobox')
  const type = (query: string) => fireEvent.change(input(), { target: { value: query } })

  it('offers search in the docs sidebar, on the index and on a page', () => {
    const { container, unmount } = renderAt('/docs')
    expect(sidebar(container).getByRole('button', { name: /search docs/i })).toBeTruthy()
    // Mobile gets its own entry point, because the sidebar is hidden there.
    expect(container.querySelector('.docs-mobile__search')).not.toBeNull()
    unmount()

    const onPage = renderAt('/docs/connecting')
    expect(sidebar(onPage.container).getByRole('button', { name: /search docs/i })).toBeTruthy()
  })

  it('opens a modal palette with the input focused, and closes it with escape', () => {
    const { container } = renderAt('/docs')
    const trigger = sidebar(container).getByRole('button', { name: /search docs/i })
    fireEvent.click(trigger)
    expect(palette()).toBeTruthy()
    expect(input()).toBe(document.activeElement)

    fireEvent.keyDown(input(), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    // Focus goes back where it came from.
    expect(document.activeElement).toBe(trigger)
  })

  it('opens on the keyboard shortcut and closes on the scrim', () => {
    renderAt('/docs/connecting')
    fireEvent.keyDown(document, { key: 'k', metaKey: true })
    expect(screen.getByRole('dialog')).toBeTruthy()

    const scrim = document.querySelector('.search-scrim')
    expect(scrim).not.toBeNull()
    fireEvent.mouseDown(scrim as Element)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.querySelector('.search-panel')).toBeNull()
  })

  it('does not lose the return-focus target when the shortcut is pressed while already open', () => {
    const { container } = renderAt('/docs')
    const trigger = sidebar(container).getByRole('button', { name: /search docs/i })
    fireEvent.click(trigger)
    expect(document.activeElement).toBe(input())

    // Pressing the shortcut again must not overwrite the element we owe focus back to, which
    // by now is the palette's own input and about to be unmounted.
    fireEvent.keyDown(document, { key: 'k', metaKey: true })
    fireEvent.keyDown(input(), { key: 'Escape' })

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('resets the selection when the query changes, so enter never goes dead', async () => {
    const { container } = renderAt('/docs')
    fireEvent.click(sidebar(container).getByRole('button', { name: /search docs/i }))
    await screen.findAllByRole('option', undefined, { timeout: WAIT })

    // Walk down the browse list, then narrow to a query with fewer hits than that.
    fireEvent.keyDown(input(), { key: 'ArrowDown' })
    fireEvent.keyDown(input(), { key: 'ArrowDown' })
    type('exit code')

    const options = await screen.findAllByRole('option', undefined, { timeout: WAIT })
    expect(options).toHaveLength(1)
    expect(options[0].getAttribute('aria-selected')).toBe('true')
    expect(input().getAttribute('aria-activedescendant')).toBe(options[0].id)

    fireEvent.keyDown(input(), { key: 'Enter' })
    await screen.findByRole('heading', { level: 1, name: 'CLI reference' }, { timeout: WAIT })
    await waitFor(() => expect(document.activeElement?.id).toBe('exit-codes'), { timeout: WAIT })
  })

  it('browses every page until something is typed', async () => {
    const { container } = renderAt('/docs')
    fireEvent.click(sidebar(container).getByRole('button', { name: /search docs/i }))
    const options = await screen.findAllByRole('option', undefined, { timeout: WAIT })
    expect(options.length).toBeGreaterThan(20)
    expect(options[0].textContent).toContain('Introduction')
  })

  it('finds a heading and goes to it, landing focus on the heading', async () => {
    const { container } = renderAt('/docs')
    fireEvent.click(sidebar(container).getByRole('button', { name: /search docs/i }))
    type('Connection pool')

    const options = await screen.findAllByRole('option', undefined, { timeout: WAIT })
    const target = options.find((option) => option.textContent?.includes('Connection pool'))
    expect(target, 'a hit on the Connection pool heading').toBeTruthy()
    fireEvent.click(target as HTMLElement)

    // The palette is gone, the right page is shown, and the heading is where focus lands.
    await screen.findByRole('heading', { level: 1, name: 'Connecting' }, { timeout: WAIT })
    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() => expect(document.activeElement?.id).toBe('connection-pool'), { timeout: WAIT })
  })

  it('marks the matching run and keeps focus in the input while arrowing', async () => {
    const { container } = renderAt('/docs')
    fireEvent.click(sidebar(container).getByRole('button', { name: /search docs/i }))
    type('dialect')

    const options = await screen.findAllByRole('option', undefined, { timeout: WAIT })
    expect(options.length).toBeGreaterThan(0)
    expect(document.querySelectorAll('.search-result mark').length).toBeGreaterThan(0)
    expect(options[0].getAttribute('aria-selected')).toBe('true')

    fireEvent.keyDown(input(), { key: 'ArrowDown' })
    await waitFor(() => expect(input().getAttribute('aria-activedescendant')).toBeTruthy(), { timeout: WAIT })
    expect(document.activeElement).toBe(input())
  })

  it('opens the active result on enter', async () => {
    const { container } = renderAt('/docs')
    fireEvent.click(sidebar(container).getByRole('button', { name: /search docs/i }))
    type('troubleshooting')
    await screen.findAllByRole('option', undefined, { timeout: WAIT })
    fireEvent.keyDown(input(), { key: 'Enter' })
    await screen.findByRole('heading', { level: 1, name: /troubleshooting/i }, { timeout: WAIT })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('says so when nothing matches', async () => {
    const { container } = renderAt('/docs')
    fireEvent.click(sidebar(container).getByRole('button', { name: /search docs/i }))
    type('zzzqqqxyzzy')
    await waitFor(() => expect(screen.getByText(/no results/i)).toBeTruthy(), { timeout: WAIT })
    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect(screen.getByText(/^0 results$/)).toBeTruthy()
  })

  it('traps focus inside the palette', async () => {
    const { container } = renderAt('/docs')
    fireEvent.click(sidebar(container).getByRole('button', { name: /search docs/i }))
    type('dialect')
    await screen.findAllByRole('option', undefined, { timeout: WAIT })

    const close = screen.getByRole('button', { name: /close search/i })
    close.focus()
    fireEvent.keyDown(palette(), { key: 'Tab' })
    expect(document.activeElement).toBe(input())

    fireEvent.keyDown(palette(), { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(close)
  })
})
