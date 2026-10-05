import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { resolveLegacyHash, watchLegacyHash } from './legacy-hash.ts'

// The browser otherwise restores the previous scroll offset after a reload, landing you
// back where you were instead of at the top of the page it just loaded. This app decides
// its own scroll position, so take it over.
if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'

// Normalize the hash before the router sees it: give HashRouter a valid path, and route
// pre-move "#anchor" links to the right place (see legacy-hash.ts).
resolveLegacyHash()
watchLegacyHash()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </HashRouter>
  </StrictMode>,
)
