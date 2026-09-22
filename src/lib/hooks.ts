import { useCallback, useEffect, useRef, useState } from 'react'

/** Sets document.title while the component is mounted. */
export function useTitle(title: string) {
  useEffect(() => {
    document.title = title
  }, [title])
}

/** Clipboard helper: `copy(text)` flips `copied` for a moment. */
export function useCopy(resetMs = 1600) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), resetMs)
      } catch {
        /* clipboard blocked: nothing useful to do */
      }
    },
    [resetMs],
  )
  return { copied, copy }
}
