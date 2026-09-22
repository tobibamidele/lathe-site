import {
  Children,
  isValidElement,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

/** One panel of a `<Tabs>`. Its label comes from the matching entry in `labels`. */
export function Tab({ children }: { children: ReactNode }) {
  return <>{children}</>
}

interface TabsProps {
  labels: string[]
  children: ReactNode
}

/**
 * <Tabs labels={['PostgreSQL', 'MySQL']}>
 *   <Tab>...</Tab>
 *   <Tab>...</Tab>
 * </Tabs>
 */
export function Tabs({ labels, children }: TabsProps) {
  const [active, setActive] = useState(0)
  const id = useId()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const panels = Children.toArray(children).filter(isValidElement)

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const last = labels.length - 1
    const move: Record<string, number> = {
      ArrowRight: active === last ? 0 : active + 1,
      ArrowLeft: active === 0 ? last : active - 1,
      Home: 0,
      End: last,
    }
    if (!(e.key in move)) return
    e.preventDefault()
    setActive(move[e.key])
    tabRefs.current[move[e.key]]?.focus()
  }

  return (
    <div className="tabs">
      <div className="tabs__list" role="tablist" onKeyDown={onKeyDown}>
        {labels.map((label, i) => (
          <button
            key={label}
            ref={(el) => {
              tabRefs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            className="tabs__tab"
            aria-selected={i === active}
            aria-controls={`${id}-panel-${i}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        className="tabs__panel"
        role="tabpanel"
        id={`${id}-panel-${active}`}
        aria-labelledby={`${id}-tab-${active}`}
      >
        {panels[active]}
      </div>
    </div>
  )
}
