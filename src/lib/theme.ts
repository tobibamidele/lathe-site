import { useCallback, useState } from 'react'

export type Theme = 'dark' | 'light'

// index.html sets data-theme before first paint; this reads and updates it.
const current = (): Theme => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(current)
  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {
      /* private mode: the choice just will not persist */
    }
    setTheme(next)
  }, [theme])
  return { theme, toggle }
}
