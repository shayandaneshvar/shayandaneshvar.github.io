import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Nav from '../components/Nav'
import Hero from '../components/Hero'
import About from '../components/About'
import Experience from '../components/Experience'
import Education from '../components/Education'
import Publications from '../components/Publications'
import Projects from '../components/Projects'
import Blog from '../components/Blog'
import Contact from '../components/Contact'
import Footer from '../components/Footer'
import { takePendingSection } from '../legacy-hash'

export default function HomePage() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const requested = (location.state as { scrollTo?: string } | null)?.scrollTo
    const section = requested ?? takePendingSection()
    if (!section) return
    // Wait for the page to render before scrolling to the target section.
    requestAnimationFrame(() => {
      document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' })
    })
    // Router state lives in history, so it survives a reload and would scroll again on
    // every refresh of this entry. It is a one-shot instruction, so drop it once used.
    if (requested) navigate('.', { replace: true, state: null })
  }, [location.state, navigate])

  return (
    <div className="relative">
      <Nav />
      <main className="mx-auto max-w-[1000px] px-6 md:px-12 lg:px-24">
        <Hero />
        <About />
        <Experience />
        <Education />
        <Publications />
        <Projects />
        <Blog />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
