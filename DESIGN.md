# DESIGN.md

The design system for lathe-site. This is the source of truth for how the site looks — it overrides individual
taste, including an AI agent's. If a change conflicts with this file, update this file first and explain why in the
same commit, or don't make the change.

## Reference

`design/reference/toris-docs.png` is the docs layout this site is modelled on: sidebar left, content centre,
generous whitespace, dark by default. Look at it before changing `DocsLayout` or the docs shell CSS.

## Principles

1. **Black and white only.** Every colour in the product is `--bg`, `--fg`, or a step between them, defined once in
   `tokens.css`. No accent colour, no gradients as decoration, no coloured badges. Hierarchy comes from **lightness,
   weight, borders, and inversion** (swapping foreground and background), not hue. The single exception is
   syntax-highlighted code, which uses a fixed GitHub dark/light palette (see "Syntax highlighting") because colour is
   how code is meant to be read. Every other pixel stays black and white.
2. **Two fonts, nothing else.** Geist for text, Geist Mono for anything code-shaped (code blocks, inline code,
   version strings, CLI commands). No third font, no italic display type.
3. **Quiet by default.** Borders are 1px and low-contrast. Radii are generous but not playful. Motion is short
   (`--dur: 160ms`) and only on interactive state changes — never on page load, never looping, never decorative.
4. **Dense but not cramped.** Body copy sits in a max-width column (`--prose-w: 720px`) because long lines are hard
   to read. UI chrome (header, sidebar) is compact; prose gets room to breathe.
5. **The docs are the product.** The landing page exists to get someone into the docs quickly. Do not let it grow
   testimonials, pricing, logos-of-companies-using-this, or other sections that do not serve that goal.

## Tokens

Everything lives in `src/styles/tokens.css`. Components consume variables and never hard-code a value that exists
as a token.

### Colour (dark is default; light is the alternate)

| Token | Dark | Light | Use |
| --- | --- | --- | --- |
| `--bg` | `#0a0a0a` | `#ffffff` | Page background |
| `--bg-elevated` | `#101010` | `#fafafa` | Cards that sit slightly above the page (CTA box) |
| `--bg-subtle` | `#171717` | `#f5f5f5` | Hover/active fills, inline code background |
| `--border` | `#262626` | `#e5e5e5` | Default border |
| `--border-strong` | `#404040` | `#d4d4d4` | Hover border, secondary button border |
| `--fg` | `#fafafa` | `#0a0a0a` | Primary text, headings |
| `--fg-muted` | `#a3a3a3` | `#525252` | Body copy, descriptions |
| `--fg-subtle` | `#8a8a8a` | `#737373` | Labels, timestamps, least important text |
| `--inverse-bg` / `--inverse-fg` | white-on-black | black-on-white | Primary button, active nav pill |

`--fg-subtle` is tuned to stay at or above **AA contrast** (4.5:1 for normal text) against `--bg` in both themes.
**Do not** make it darker in dark mode or lighter in light mode without rechecking contrast — it is the easiest
token to accidentally break.

### Type

- `--font-sans`: Geist Variable, for everything except code.
- `--font-mono`: Geist Mono Variable, for code blocks, inline code, and anything that is a literal command or value.
- Headings: weight 650, `letter-spacing: -0.03em` to `-0.045em` depending on size, `text-wrap: balance`.
- Body: 16px / 1.6–1.75 line-height. Prose (docs body) is slightly larger and looser than UI copy.

### Spacing, radius, motion

- Spacing is ad hoc but consistent within a component family (8px steps mostly). There is no spacing scale token —
  don't invent one for a single component; match nearby values instead.
- Radius: `--radius-sm: 8px` (inline code, small controls), `--radius-md: 12px` (cards, code blocks),
  `--radius-lg: 20px` (large cards), `--radius-pill: 999px` (buttons, pills, tabs).
- Motion: `--dur: 160ms`, `--ease: cubic-bezier(0.2, 0.8, 0.2, 1)`. Used for colour/border/background transitions on
  hover and for the mobile menu. Respect `prefers-reduced-motion` (already handled globally in `base.css`).

## Components

Match these before inventing a new pattern.

- **Button** (`.btn`): pill, 40px (`.btn--lg` 48px). `--primary` is inverse (solid fg-on-bg); `--secondary` is an
  outline. Every button is a pill — there is no square button in this system.
- **Card** (`.card`): 1px border, `--radius-lg`, border brightens to `--fg` on hover if it's a link. Used for
  feature tiles and docs-index section cards. Don't add a shadow or a background tint on hover — the border change
  is the entire hover affordance.
- **Pill** (`.pill`): outlined capsule with an optional dot, for small status labels ("v0.1 · early release",
  database names). Not a button — no hover state.
- **Callout** (`.callout`): left border + card background, for asides in docs. Default type is neutral; `--warning`
  gets a thicker double left border. `--draft` (dashed, no background) marks unwritten pages — don't reuse it for
  anything else.
- **Code frame** (`.code`): bordered box, a top bar with the language name (left) and a copy button (right), body
  below in Geist Mono. This is the *only* way code appears on the site — never a bare `<pre>`.
- **Tabs** (`.tabs`): pill-shaped tab list, used for "pick your database" style alternatives. Keyboard-navigable
  (arrow keys, Home/End) — keep that behaviour if you touch `Tabs.tsx`.
- **Sidebar link / TOC link**: active state is a filled pill background (sidebar) or a left border (TOC) — never
  colour alone, so it still reads with the palette constraint.
- **Search** (`.search-trigger`, `.search-panel`): a pill button at the top of the docs sidebar, and a palette
  centred under the header on click or ⌘K. The scrim is `--overlay` plus a blur, the same treatment the header
  already uses — no shadow, ever. Results are a combobox: arrows move, Enter opens, Escape closes, focus stays
  inside. The matched run is marked with inversion (`--inverse-bg` / `--inverse-fg`), which is the only emphasis
  available in a black and white system. A shortcut is advertised in a `<kbd>`: `--radius-sm` border, mono, 11px.

## Syntax highlighting

Code is highlighted with **shiki** (VS Code's TextMate grammars — far more accurate than highlight.js for Go) using the
**GitHub dark** / **GitHub light** palettes. Token colours are emitted inline as `--shiki-dark` / `--shiki-light` CSS
variables (see `vite.config.ts` for build-time, `src/components/Code.tsx` for the landing page), so the same markup
serves both themes; `code.css` maps the variables per theme.

This is the one place colour exists — it is never applied to the product chrome, UI copy, badges, or inline code.
Inline code stays black and white (`--bg-subtle` background, default foreground). Both themes must be checked for
contrast after any theme or palette change.

## Layout

- Max content width `--container: 1120px`.
- Docs shell: `--sidebar-w: 240px` sidebar, fluid content column capped at `--prose-w: 720px`, `--toc-w: 200px`
  "on this page" column. Below `1180px` the TOC is dropped; below `860px` the sidebar collapses into a `<details>`.
- Header is sticky, 64px, blurred translucent background. Footer is a simple bordered strip — resist growing it into
  a sitemap.
- The search palette is a modal: it must sit above the sticky header (`z-index` 60) and go edge to edge below
  860px, where it uses `100dvh` so the mobile browser chrome cannot clip it.

## Accessibility

- Every focusable element must show `:focus-visible` (the global outline in `base.css` — don't suppress it).
- Colour is never the only signal (see sidebar/TOC active states above).
- Buttons and links are large enough to hit on mobile (40px minimum height).
- A modal traps focus while it is open, returns focus to whatever opened it, and names itself (`aria-labelledby`)
  rather than relying on a placeholder. Result lists are `role="listbox"` driven by `aria-activedescendant`, so the
  options never enter the tab order. An icon-only control needs its own `aria-label`: its visible label cannot be
  allowed to disappear with a media query.
- A skip-link is present (`.skip-link`); keep it working if you change `SiteLayout`.

## Anti-patterns

Reject these on sight, whoever proposes them:

- Any hex value or `rgb()` outside `tokens.css`.
- A second accent colour "just for this one badge."
- A drop shadow, a glow, or a gradient used as decoration rather than the hero grid mask.
- A third font, or Geist loaded from a CDN link tag instead of `@fontsource-variable`.
- An emoji in UI copy or docs prose.
- A carousel, an auto-playing animation, or a cookie-consent-style banner.
- New spacing/radius/duration constants that don't reuse an existing token.
