# AGENTS.md

Instructions for AI coding agents (and humans) working on **lathe-site**, the website for
[lathe](https://github.com/tobibamidele/lathe): a landing page plus documentation.

Read this file fully before making changes. Read [`DESIGN.md`](./DESIGN.md) before touching anything visual.
It is the source of truth for how the site looks and it overrides your own taste.

## What this project is

- A static single-page app: **Vite 8, React 19, React Router 8, TypeScript 7**, plain CSS.
- **Docs are MDX** in `src/content/docs/`, compiled at build time. There is no CMS and no backend.
- Black and white only, **Geist** and **Geist Mono** for type, dark by default with a light theme.
- lathe is a schema-first ORM toolchain for Go. The site explains how to install it, connect, define a schema,
  query, migrate and debug.

## Commands

Requires **Node 22.22+** (see `engines` and `.nvmrc`).

```bash
npm install
npm run dev          # dev server, http://localhost:5173
npm run typecheck    # tsc --noEmit
npm test             # vitest: docs validation + route smoke tests
npm run build        # typecheck, then vite build to dist/
npm run screenshots  # visual check, needs: npm i --no-save puppeteer-core @sparticuz/chromium
```

**Definition of done for any change:** `npm run typecheck`, `npm test` and `npm run build` all pass with no warnings.
For anything visual, also run `npm run screenshots` and look at the images (see "Verifying visual changes").

## Project map

```
index.html                 sets data-theme before first paint (no flash); dark unless the user chose light
vite.config.ts             MDX + highlighting pipeline, docs-meta and docs-search plugins, vitest config
plugins/docs-meta.ts       reads every doc, frontmatter + raw source; exposes `virtual:docs-meta`
plugins/docs-search.ts     turns that source into `virtual:docs-search`: one record per heading
src/
  main.tsx                 entry: fonts, global CSS, BrowserRouter
  App.tsx                  routes only: / , /docs , /docs/:slug , *
  site.config.ts           name, repo, install command, edit links. Never hard-code these elsewhere.
  content/
    sections.ts            docs sections: order + description (drives sidebar and the /docs cards)
    types.ts               Frontmatter type
    docs/*.mdx             one file per docs page. The filename is the URL slug.
    docs.test.ts           validates every page's frontmatter
  lib/
    docs.ts                reads metadata (virtual module) + lazily loads page bodies
    search.ts              fuse.js over the search index, lazily imported; browse + snippets
    theme.ts, hooks.ts     useTheme, useTitle, useCopy
  layouts/                 SiteLayout (header/footer), DocsLayout (sidebar + search)
  pages/home/              landing page; snippets.ts holds the code shown on it
  pages/docs/              DocsIndex, DocPage, Toc ("On this page")
  components/              Header, Footer, Code, Tabs, Callout, Logo, ThemeToggle, mdx.tsx, DocsSearch
  styles/                  tokens.css (all colours) + base, ui, code, layout, prose, docs, search, home
scripts/screenshots.mjs    headless visual check
design/reference/          toris-docs.png: the reference the docs layout is modelled on
```

## Conventions

**TypeScript.** `strict` is on, as are `noUnusedLocals` and `noUnusedParameters`. No `any`. Prefer named exports.
Function components, hooks, no class components.

**Styling.** Plain CSS with custom properties. No Tailwind, no CSS-in-JS, no CSS modules.

- Use variables from `src/styles/tokens.css`. **Never write a hex colour or a literal radius in a component style.**
- One class-name namespace per component (`.card`, `.card__title`, `.card--wide`), BEM-ish.
- New styles go in the existing file for that concern. Add a new file only for a genuinely new area, and import it
  from `styles/index.css`.

**Dependencies.** Do not add one without a reason you can state in one sentence. Icons come from `lucide-react`
(import the icon, never the whole package). No animation, UI-kit or state libraries.

**Routing.** Internal links use `<Link to>` / `NavLink`. In MDX, write internal links as plain markdown links
starting with `/`; they are routed automatically. External links open in a new tab automatically.

**Config that changes on rename or publish** (name, repo, install command) lives in `src/site.config.ts` and nowhere else.
The landing page's code samples live in `src/pages/home/snippets.ts`.

## Writing docs

### Add a page

1. Create `src/content/docs/<slug>.mdx`. Slug is kebab-case and becomes `/docs/<slug>`.
2. Start with frontmatter, **quoting `title` and `description`**. Unquoted values containing `: ` are invalid YAML
   and fail the build.

   ```mdx
   ---
   title: "Reading data"
   description: "Get, FindFirst, FindMany, ordering, paging and projections."
   section: Querying
   order: 1
   ---
   ```

   - `section` must match a `title` in `src/content/sections.ts`.
   - `order` is the position inside the section, starting at 1. Two pages cannot share one.
   - Add `draft: true` for an outline. It shows a "soon" tag in the sidebar. Remove it when the page is written.
3. Do not repeat the title as an `# h1`. The layout renders title and description. Start the body with prose or an `##`.
4. Run `npm test`. It checks every rule above, so a mistake fails loudly instead of silently missing from the sidebar.

To add a **section**, add it to `sections.ts` (its position there is its position in the docs).

### Components available in MDX (no import needed)

| Component | Use |
| --- | --- |
| `<Callout title="...">text</Callout>` | A note. `type="warning"` for a stronger one. Use sparingly. |
| `<Draft source="README.md, Section" />` | Marks an outline. Delete it when the page is written. |
| `<Tabs labels={['A', 'B']}><Tab>...</Tab><Tab>...</Tab></Tabs>` | Alternatives, e.g. per database. |

Inside `<Tab>` and `<Callout>`, **leave a blank line before and after** markdown such as code fences, or MDX will not parse it:

````mdx
<Tabs labels={['PostgreSQL', 'MySQL']}>
<Tab>

```go
postgres.Open(dsn)
```

</Tab>
<Tab>

```go
mysql.Open(dsn)
```

</Tab>
</Tabs>
````

Fenced code is highlighted at build time. Use `go`, `sql`, `bash`, `json`, `yaml` or `text`. Always give a language.
In prose, a bare `<` or `{` is parsed as JSX: put it in backticks.

### Writing rules

- **Accuracy beats everything.** The source of truth is the lathe repository: `README.md`, `docs/design.md`, and
  above all `examples/showcase`, which compiles and runs. **Every Go snippet must be copied from, or verified against,
  code that compiles.** Never invent an API, a flag or an error message. If you cannot verify something, leave it out.
- CLI flags and output: check `internal/cli` in the lathe repo. Error strings: grep the lathe source for them.
- Voice: second person, present tense, plain words. Explain *why* once, then show the code. No marketing, no
  exclamation marks, no "simply" or "just".
- Shape of a page: a one-sentence lead, the shortest working example, the details, then the gotchas. Link to related pages.
- Prefer a table to a long list of options. Prefer one good example to three similar ones.
- Show output when it helps (`text` blocks). Say which database an example is for when it matters.

## Design rules (summary; full detail in DESIGN.md)

- Black and white only. Hierarchy comes from lightness, weight, borders and inversion, never from a hue.
  Do not add an accent colour, a gradient, a shadow or an emoji.
- Geist for text, Geist Mono for code. Do not load fonts from a CDN; they come from `@fontsource-variable`.
- Every interactive element has a visible focus state and is at least 40px tall.
- Both themes must work. Test a change in dark **and** light.
- Body text contrast must stay AA. Do not darken `--fg-subtle` in dark mode or lighten it in light mode.

## Verifying visual changes

Tests cannot tell you whether something looks right. After any visual change:

```bash
npm i --no-save puppeteer-core @sparticuz/chromium   # once
npm run build && npx vite preview --port 4173 &
npm run screenshots
```

Then open the PNGs in `./screenshots/`, at least `home-dark-full`, `docs-index`, `doc-installation`, `mobile-home`
and a light theme shot. Look for clipped text, overflow, cramped spacing and anything that does not match DESIGN.md.
The script also fails on any browser console error.

## Gotchas learned the hard way

- **Never import an MDX module just to read its `frontmatter`.** It pulls the page body into the importing chunk and
  defeats lazy loading. Metadata comes from `virtual:docs-meta` (see `plugins/docs-meta.ts`).
- Import local plugins with their extension in `vite.config.ts` (`./plugins/docs-meta.ts`).
- **Heading ids in the search index must come from `github-slugger`**, the same library `rehype-slug` uses, with one
  slugger per file so repeated headings dedupe identically. A hand-rolled slug silently breaks every `/docs/x#anchor`
  link. `plugins/docs-search.test.ts` and the built chunk are the check.
- The search index lives in its own virtual module and is imported **dynamically** (`src/lib/search.ts`). A static
  import of `virtual:docs-search` would drag ~25kB gzip of page text into the main bundle.
- The palette is portalled to `document.body` because `.sidebar` is `position: sticky` with `overflow-y: auto` and
  would clip it. Its state lives in `DocsLayout`, not in the trigger: the sidebar renders twice, so a trigger-owned
  listener would open two palettes on one ⌘K.
- `<Ready>` in `DocPage` exists because the "On this page" list can only be read after the lazy MDX has rendered.
- The active heading in `Toc` is computed from scroll position on purpose. IntersectionObserver misses jump-scrolls.
- jsdom has no `scrollTo`, `scrollIntoView` or `IntersectionObserver`; `src/test/setup.ts` stubs what tests need.
- `/bin/sh` on some machines is dash: no `{a,b}` brace expansion in npm scripts or shell snippets.

## Status and backlog

**Done:** landing page, docs shell (sidebar, index, on-this-page, prev/next, edit link), dark/light theme with no flash,
responsive layout, build-time syntax highlighting, docs search (sidebar trigger, ⌘K palette, fuzzy search over titles,
headings and body text, jump to a heading and land on it), docs validation tests, route smoke tests.

**Written docs:** Introduction, Installation, Quickstart, Connecting.

**Outlines to write** (search for `draft: true`): everything else. Suggested order: Reading, Writing, Migrations,
Logging and tracing, Relations, then the rest.

**Not built yet** (do not start without being asked):

- Real logo and favicon, Open Graph image
- Sitemap, `robots.txt`, `llms.txt`
- Versioned docs
- A blog or changelog page
- Automated visual regression tests

## Before publishing

- Install commands assume the Go module `github.com/tobibamidele/lathe` is published and tagged. Check
  `src/site.config.ts` and every `go install` / `go get` in the docs and on the landing page.
- Replace the placeholder logo. Confirm the repo and edit-link URLs in `site.config.ts`.
