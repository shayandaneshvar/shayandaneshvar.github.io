import { Suspense, useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './App.css'
import HomePage from './pages/HomePage'
import { posts } from './blog/posts'

// HashRouter has no built-in scroll restoration, so a new page would otherwise open at
// the previous page's scroll offset. Only a real page change resets the scroll: the home
// page clears its one-shot scrollTo state after using it, and that state change must not
// drag the page back to the top mid-scroll.
function ScrollToTop() {
  const { pathname, state } = useLocation()
  const lastPath = useRef<string | null>(null)
  useEffect(() => {
    if (lastPath.current === pathname) return
    lastPath.current = pathname
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
