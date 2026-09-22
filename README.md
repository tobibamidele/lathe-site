# lathe-site

The website for [lathe](https://github.com/tobibamidele/lathe): a landing page and documentation.

Vite, React and TypeScript. Docs are MDX. Geist for type, black and white for colour.

> **Working on this repo with an AI agent?** Read [`AGENTS.md`](./AGENTS.md) first, and [`DESIGN.md`](./DESIGN.md) before touching any styling.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type check, then production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest: docs validation and route smoke tests |
| `npm run screenshots` | Visual check in a headless browser (needs an extra install, see the script header) |

Requires **Node 22.22 or newer** (React Router 8 and Vitest 5 both need it). `.nvmrc` pins it: `nvm use`.

## What is here

```
src/pages/home/        landing page (hero, install, features, CTA)
src/pages/docs/        docs index, doc page, "on this page"
src/content/docs/      one .mdx file per doc page   <-- most edits happen here
src/content/sections.ts  sidebar sections, order and descriptions
src/components/        header, footer, code blocks, tabs, callouts
src/styles/            tokens.css holds every colour, then one file per concern
src/site.config.ts     name, repo URL, install command: change these when renaming
plugins/docs-meta.ts   build step that turns frontmatter into a virtual module
```

## Status

The shell is finished: landing page, docs layout, theme toggle, mobile layout, syntax highlighting, tests.
Four docs pages are written (Introduction, Installation, Quickstart, Connecting). The other 23 are outlines
marked `draft: true` that show a "soon" tag in the sidebar. Find them with `grep -l "draft: true" src/content/docs/*.mdx`.

## Deploy

Static hosting. `vercel.json` rewrites every path to `index.html`, which client-side routing needs.
On other hosts, configure the same fallback. Build command `npm run build`, output directory `dist`.

## Before going live

- The install commands assume `github.com/tobibamidele/lathe` is published. Update `src/site.config.ts` if the path differs.
- The logo is a placeholder (`src/components/Logo.tsx`, `public/favicon.svg`).
- There is no Open Graph image yet.
