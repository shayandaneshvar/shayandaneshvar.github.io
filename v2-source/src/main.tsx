import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { resolveLegacyHash, watchLegacyHash } from './legacy-hash.ts'

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
