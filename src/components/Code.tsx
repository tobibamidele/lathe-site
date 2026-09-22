import { isValidElement, useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { Fragment as JsxFragment, jsx, jsxs } from 'react/jsx-runtime'
import { Check, Copy } from 'lucide-react'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import type { Element, Nodes } from 'hast'
import { useCopy } from '../lib/hooks'

// Landing-page snippets are highlighted at runtime with shiki's GitHub palette.
// Docs (MDX) are highlighted at build time instead, see vite.config.ts.
// shiki is pulled in narrowly (core + the four languages + two themes) and only
// when a runtime snippet first mounts, so docs pages never download it and the
// landing page doesn't pull every bundled grammar. Both paths emit the same
// `--shiki-dark`/`--shiki-light` CSS variables, styled in src/styles/code.css.
type Highlighter = import('shiki/core').HighlighterCore

let highlighterPromise: Promise<Highlighter> | undefined
function getHighlighter(): Promise<Highlighter> {
  return (highlighterPromise ??= Promise.all([
    import('shiki/core'),
    import('shiki/engine/javascript'),
    import('shiki/langs/go.mjs'),
    import('shiki/langs/sql.mjs'),
    import('shiki/langs/bash.mjs'),
    import('shiki/langs/json.mjs'),
    import('shiki/themes/github-dark.mjs'),
    import('shiki/themes/github-light.mjs'),
  ]).then(([core, engines, go, sql, bash, json, githubDark, githubLight]) =>
    core.createHighlighterCore({
      engine: engines.createJavaScriptRegexEngine(),
      themes: [githubDark.default, githubLight.default],
      langs: [go.default, sql.default, bash.default, json.default],
    }),
  ))
}

async function highlight(highlighter: Highlighter, lang: string, code: string): Promise<ReactNode> {
  const root = await highlighter.codeToHast(code, {
    lang,
    themes: { dark: 'github-dark', light: 'github-light' },
    defaultColor: false,
  })
  // codeToHast returns a <pre>; keep its <code> so the frame owns the <pre> (the
  // copy button reads textContent from that ref).
  const pre = root.children.find(isElement('pre'))
  const codeElement = pre?.children.find(isElement('code'))
  return codeElement
    ? toJsxRuntime(codeElement, { Fragment: JsxFragment, jsx, jsxs })
    : code
}

function isElement(tagName: string) {
  return (node: Nodes): node is Element => node.type === 'element' && node.tagName === tagName
}

function useHighlighted(lang: string, code: string): ReactNode {
  const [body, setBody] = useState<ReactNode>(code)
  useEffect(() => {
    let cancelled = false
    setBody(code)
    getHighlighter()
      .then((highlighter) => highlight(highlighter, lang, code))
      .then((highlighted) => !cancelled && setBody(highlighted))
      .catch(() => !cancelled && setBody(code))
    return () => {
      cancelled = true
    }
  }, [lang, code])
  return body
}

interface FrameProps {
  lang?: string
  getText: () => string
  children: ReactNode
}

/** Bordered code container with a language label and a copy button. */
export function CodeFrame({ lang, getText, children }: FrameProps) {
  const { copied, copy } = useCopy()
  return (
    <div className="code">
      <div className="code__bar">
        <span>{lang ?? 'text'}</span>
        <button type="button" className="code__copy" onClick={() => copy(getText())}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      {children}
    </div>
  )
}

/** Used by MDX for fenced code blocks (already highlighted at build time). */
export function CodeBlock({ children }: ComponentProps<'pre'>) {
  const ref = useRef<HTMLPreElement>(null)
  return (
    <CodeFrame lang={languageOf(children)} getText={() => ref.current?.textContent ?? ''}>
      <pre ref={ref}>{children}</pre>
    </CodeFrame>
  )
}

function languageOf(children: ReactNode): string | undefined {
  if (!isValidElement<{ className?: string }>(children)) return undefined
  return /language-([\w-]+)/.exec(children.props.className ?? '')?.[1]
}

/** Highlighted code for use in TSX (landing page, tabs). */
export function Code({ code, lang = 'go' }: { code: string; lang?: string }) {
  const text = code.replace(/\n$/, '')
  const body = useHighlighted(lang, text)
  return (
    <CodeFrame lang={lang} getText={() => text}>
      <pre>
        <code>{body}</code>
      </pre>
    </CodeFrame>
  )
}