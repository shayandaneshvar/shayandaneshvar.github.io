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

export default function HomePage() {
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
