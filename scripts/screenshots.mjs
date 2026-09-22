// Visual check: screenshots key pages in dark/light and desktop/mobile, and fails on
// any console or page error. Not part of the normal install; it needs a headless Chromium:
//
//   npm i --no-save puppeteer-core @sparticuz/chromium
//   npm run build && npx vite preview --port 4173 &
//   node scripts/screenshots.mjs            # writes ./screenshots/*.png
//
// Set BASE to test another URL, e.g. BASE=https://your-site.vercel.app
import { mkdirSync } from 'node:fs'
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

const base = process.env.BASE ?? 'http://localhost:4173'
const out = 'screenshots'
mkdirSync(out, { recursive: true })

const browser = await puppeteer.launch({
  args: [...chromium.args, '--no-sandbox'],
  executablePath: await chromium.executablePath(),
  headless: 'shell',
})

const problems = []
async function shot(name, path, { w = 1440, h = 900, theme = 'dark', full = false, scrollTo } = {}) {
  const page = await browser.newPage()
  page.on('pageerror', (e) => problems.push(`${name}: ${e.message}`))
  page.on('console', (m) => m.type() === 'error' && problems.push(`${name}: console ${m.text()}`))
  await page.setViewport({ width: w, height: h })
  await page.evaluateOnNewDocument((t) => localStorage.setItem('theme', t), theme)
  await page.goto(base + path, { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 400)) // lazy MDX chunk + effects
  if (scrollTo) await page.evaluate((y) => window.scrollTo(0, y), scrollTo)
  await new Promise((r) => setTimeout(r, 200))
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: full })
  await page.close()
}

await shot('home-dark', '/')
await shot('home-dark-full', '/', { full: true })
await shot('home-light', '/', { theme: 'light' })
await shot('docs-index', '/docs')
await shot('doc-installation', '/docs/installation')
await shot('doc-connecting-scrolled', '/docs/connecting', { scrollTo: 700 })
await shot('doc-draft', '/docs/relations')
await shot('doc-light', '/docs/quickstart', { theme: 'light' })
await shot('mobile-home', '/', { w: 390, h: 844 })
await shot('mobile-doc', '/docs/installation', { w: 390, h: 844 })
await browser.close()

if (problems.length) {
  console.error('Problems:\n' + problems.join('\n'))
  process.exit(1)
}
console.log(`ok: screenshots in ./${out}/, no console or page errors`)
