import { Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './App.css'
import HomePage from './pages/HomePage'
import { posts } from './blog/posts'

// HashRouter has no built-in scroll restoration, so a new page would otherwise open at
// the previous page's scroll offset. Skip when the home page is about to scroll to a section.
function ScrollToTop() {
  const { pathname, state } = useLocation()
  useEffect(() => {
    if ((state as { scrollTo?: string } | null)?.scrollTo) return
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, state])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {posts.map(({ slug, Component }) => (
            <Route key={slug} path={`/blog/${slug}`} element={<Component />} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}
