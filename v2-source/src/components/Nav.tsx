import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

const navLinks = [
  { label: 'About', section: 'about' },
  { label: 'Experience', section: 'experience' },
  { label: 'Education', section: 'education' },
  { label: 'Publications', section: 'publications' },
  { label: 'Projects', section: 'projects' },
  { label: 'Blog', section: 'blog' },
  { label: 'Contact', section: 'contact' },
]

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, toggle } = useTheme()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          backgroundColor: scrolled ? 'var(--nav-bg)' : 'transparent',
          borderBottomColor: scrolled ? 'var(--border)' : 'transparent',
        }}
        className="fixed top-0 z-50 w-full px-6 md:px-12 transition-all duration-300 backdrop-blur-md border-b"
      >
        <nav className="flex items-center justify-between h-16 md:h-20 max-w-[1000px] mx-auto">
          <Link
            to="/"
            style={{ color: 'var(--accent)' }}
            className="font-mono text-xl font-bold tracking-wider hover:opacity-70 transition-opacity"
          >
            SD
          </Link>

          <ol className="hidden md:flex items-center gap-8 list-none m-0 p-0">
            {navLinks.map(({ label, section }, i) => (
              <li key={label}>
                <motion.button
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i + 0.3 }}
                  onClick={() => scrollTo(section)}
                  style={{ color: 'var(--text-bright)' }}
                  className="text-sm hover:opacity-70 transition-opacity"
                >
                  {label}
                </motion.button>
              </li>
            ))}

            {/* Theme toggle */}
            <motion.li
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * navLinks.length + 0.2 }}
            >
              <button
                onClick={toggle}
                aria-label="Toggle theme"
                style={{ color: 'var(--text)', borderColor: 'var(--border)' }}
                className="p-2 rounded border hover:opacity-70 transition-opacity"
              >
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </button>
            </motion.li>

            <motion.li
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * navLinks.length + 0.3 }}
            >
              <a
                href="/files/CV_ShayanDaneshvar_Apr2025.pdf"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
                className="font-mono text-sm border px-4 py-2 rounded hover:opacity-80 transition-opacity"
              >
                Resume
              </a>
            </motion.li>
          </ol>

          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              style={{ color: 'var(--text)' }}
              className="p-2"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              className="flex flex-col gap-[5px] p-2 z-50"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span style={{ backgroundColor: 'var(--accent)' }} className={`block w-6 h-0.5 transition-transform duration-300 ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
              <span style={{ backgroundColor: 'var(--accent)' }} className={`block w-6 h-0.5 transition-opacity duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
              <span style={{ backgroundColor: 'var(--accent)' }} className={`block w-6 h-0.5 transition-transform duration-300 ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.3 }}
            style={{ backgroundColor: 'var(--surface)', borderLeftColor: 'var(--border)' }}
            className="fixed inset-y-0 right-0 z-40 w-3/4 flex flex-col items-center justify-center shadow-2xl border-l md:hidden"
          >
            <ol className="flex flex-col items-center gap-8 list-none m-0 p-0">
              {navLinks.map(({ label, section }) => (
                <li key={label}>
                  <button
                    onClick={() => { scrollTo(section); setMenuOpen(false) }}
                    style={{ color: 'var(--text-bright)' }}
                    className="text-lg hover:opacity-70 transition-opacity"
                  >
                    {label}
                  </button>
                </li>
              ))}
              <li>
                <a
                  href="/files/CV_ShayanDaneshvar_Apr2025.pdf"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
                  className="font-mono border px-6 py-3 rounded hover:opacity-80 transition-opacity"
                >
                  Resume
                </a>
              </li>
            </ol>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
