import { useEffect } from 'react'
import { useLocation } from 'react-router'

/** Scrolls to the top on navigation, or to the #hash target when there is one. */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView()
      return
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}
