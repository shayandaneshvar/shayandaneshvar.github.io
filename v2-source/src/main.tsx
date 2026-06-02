import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'

// Ensure HashRouter always starts with a valid path.
// If the URL has no hash (or just "#"), set it to "#/" so the "/" route matches.
if (!window.location.hash || window.location.hash === '#') {
  window.history.replaceState(
    null,
    '',
    window.location.pathname + window.location.search + '#/'
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </HashRouter>
  </StrictMode>,
)
