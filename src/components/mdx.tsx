import type { ComponentProps } from 'react'
import type { MDXComponents } from 'mdx/types'
import { Link } from 'react-router'
import { Callout, Draft } from './Callout'
import { CodeBlock } from './Code'
import { Tab, Tabs } from './Tabs'

/** Internal links use the router, external ones open safely in a new tab. */
function MdxLink({ href = '', children, ...rest }: ComponentProps<'a'>) {
  if (href.startsWith('/')) return <Link to={href}>{children}</Link>
  if (href.startsWith('#')) return <a href={href} {...rest}>{children}</a>
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" {...rest}>
      {children}
    </a>
  )
}

/** h2/h3 get a hover "#" link so sections can be shared. Ids come from rehype-slug. */
const heading = (Tag: 'h2' | 'h3') =>
  function Heading({ id, children, ...rest }: ComponentProps<'h2'>) {
    return (
      <Tag id={id} {...rest}>
        {children}
        {id && (
          <a className="anchor" href={`#${id}`} aria-label="Link to this section">
            #
          </a>
        )}
      </Tag>
    )
  }

/** Everything available inside .mdx files without an import. */
export const mdxComponents: MDXComponents = {
  a: MdxLink,
  h2: heading('h2'),
  h3: heading('h3'),
  pre: CodeBlock,
  Callout,
  Draft,
  Tabs,
  Tab,
}
