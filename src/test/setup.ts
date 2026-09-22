import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom does not implement scrolling
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
Element.prototype.scrollIntoView = vi.fn()

afterEach(() => {
  cleanup()
  document.documentElement.dataset.theme = 'dark'
})
