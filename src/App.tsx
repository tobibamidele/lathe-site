import { Route, Routes } from 'react-router'
import { DocsLayout } from './layouts/DocsLayout'
import { SiteLayout } from './layouts/SiteLayout'
import { Home } from './pages/home/Home'
import { DocPage } from './pages/docs/DocPage'
import { DocsIndex } from './pages/docs/DocsIndex'
import { NotFound } from './pages/NotFound'

/** The router itself (BrowserRouter / MemoryRouter) is supplied by main.tsx and tests. */
export function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="docs" element={<DocsLayout />}>
          <Route index element={<DocsIndex />} />
          <Route path=":slug" element={<DocPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
