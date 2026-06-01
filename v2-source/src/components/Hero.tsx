import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

const roles = [
  'Researcher',
  'LLM Engineer',
  'Software Developer',
  'Perpetually Curious',
]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
})

export default function Hero() {
  const [roleIndex, setRoleIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIndex(i => (i + 1) % roles.length)
    }, 2600)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="min-h-screen flex flex-col justify-center pt-20">
      <motion.p {...fadeUp(0.1)} style={{ color: 'var(--accent)' }} className="font-mono text-base mb-5">
        Hi, my name is
      </motion.p>

      <motion.h1
        {...fadeUp(0.2)}
        style={{ color: 'var(--text-bright)' }}
        className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight"
      >
        Shay Daneshvar
      </motion.h1>

      <motion.div {...fadeUp(0.3)} className="mt-2 h-14 md:h-16 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.h2
            key={roleIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            style={{ color: 'var(--text)' }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight"
          >
            {roles[roleIndex]}
          </motion.h2>
        </AnimatePresence>
      </motion.div>

      <motion.p {...fadeUp(0.4)} style={{ color: 'var(--text)' }} className="max-w-xl mt-6 text-lg leading-relaxed">
        I train reasoning models, build production ML systems, and publish research at the
        intersection of software engineering and large language models. Currently at{' '}
        <span style={{ color: 'var(--text-bright)' }}>Huawei Technologies</span>, post-training
        Code LLMs on multi-node GPU clusters.
      </motion.p>

      <motion.div {...fadeUp(0.5)} className="flex gap-4 mt-10 flex-wrap">
        <a
          href="#projects"
          style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
          className="font-mono border px-7 py-4 rounded text-sm hover:opacity-80 transition-all duration-300 hover:-translate-y-0.5"
        >
          See My Work
        </a>
        <a
          href="#contact"
          style={{ color: 'var(--text)', borderColor: 'var(--border)' }}
          className="font-mono border px-7 py-4 rounded text-sm hover:opacity-80 transition-all duration-300 hover:-translate-y-0.5"
        >
          Get In Touch
        </a>
      </motion.div>

      {/* Social sidebar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="fixed left-6 bottom-0 hidden xl:flex flex-col items-center gap-5"
      >
        {[
          {
            href: 'https://github.com/shayandaneshvar',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>,
          },
          {
            href: 'https://ca.linkedin.com/in/shayanda',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>,
          },
          {
            href: 'https://scholar.google.ca/citations?user=NVHzLg0AAAAJ',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 24a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-24L0 9.5l4.838 3.94A8 8 0 0 1 12 10a8 8 0 0 1 7.162 3.44L24 9.5z"/></svg>,
          },
        ].map(({ href, icon }) => (
          <a key={href} href={href} target="_blank" rel="noreferrer"
            style={{ color: 'var(--text)' }}
            className="hover:opacity-60 hover:-translate-y-1 transition-all duration-200">
            {icon}
          </a>
        ))}
        <div style={{ backgroundColor: 'var(--border)' }} className="w-px h-24" />
      </motion.div>

      {/* Email sidebar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="fixed right-6 bottom-0 hidden xl:flex flex-col items-center gap-5"
      >
        <a
          href="mailto:daneshvarshayan@gmail.com"
          style={{ writingMode: 'vertical-rl', color: 'var(--text)' } as React.CSSProperties}
        >
          daneshvarshayan@gmail.com
        </a>
        <div style={{ backgroundColor: 'var(--border)' }} className="w-px h-24" />
      </motion.div>
    </section>
  )
}
