import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { App } from './App'

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
    expect(await screen.findByRole('heading', { level: 1, name: 'Installation' })).toBeTruthy()
    await screen.findByRole('heading', { level: 2, name: /Install the CLI/ })
    expect(container.querySelector('.tabs')).not.toBeNull() // <Tabs>
    expect(container.querySelector('.callout')).not.toBeNull() // <Callout>
    expect(container.querySelector('.code pre code span[style*="--shiki-dark"]')).not.toBeNull() // build-time highlighting
    // "On this page" fills in after the page body has rendered
    await waitFor(() => expect(container.querySelector('.toc')).not.toBeNull())
    expect(container.querySelectorAll('.toc__link').length).toBeGreaterThan(3)
  })

  it('shows previous and next links between pages', async () => {
    renderAt('/docs/installation')
    await screen.findByRole('heading', { level: 1, name: 'Installation' })
    const pager = screen.getByRole('navigation', { name: /previous and next/i })
    expect(pager.textContent).toContain('Introduction')
    expect(pager.textContent).toContain('Quickstart')
  })

  it('shows the not found page for unknown docs and routes', () => {
    renderAt('/docs/does-not-exist')
    expect(screen.getByRole('heading', { name: /does not exist/i })).toBeTruthy()
  })
})
