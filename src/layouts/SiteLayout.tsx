import { Outlet } from 'react-router'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { ScrollToTop } from '../components/ScrollToTop'

/** Header, page, footer. Every route renders inside this. */
export function SiteLayout() {
  return (
    <div className="site">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <ScrollToTop />
      <Header />
      <main id="main" className="site__main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
