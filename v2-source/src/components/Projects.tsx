import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import SectionHeading from './SectionHeading'
import { featured, others, INITIAL_SHOW, HIDDEN_PROJECT_ANCHORS } from '../data/projects'
import { peekPendingSection } from '../legacy-hash'

function FolderIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
    </svg>
  )
}

function ExternalIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  )
}

export default function Projects() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  // A legacy link can point at a project in the collapsed tail; open the list for it.
  const [showAll, setShowAll] = useState(() => {
    const target = peekPendingSection()
    return target !== null && HIDDEN_PROJECT_ANCHORS.includes(target)
  })
  const visibleOthers = showAll ? others : others.slice(0, INITIAL_SHOW)

  return (
    <section id="projects" className="py-24" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        <SectionHeading title="Projects" />

        {/* Featured */}
        <div className="space-y-24 mb-20">
          {featured.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              id={p.anchor}
              className={`relative grid md:grid-cols-12 gap-4 items-center scroll-mt-24 ${i % 2 === 1 ? 'md:[direction:rtl]' : ''}`}
            >
              <div className={`md:col-span-7 relative group rounded overflow-hidden ${i % 2 === 1 ? 'md:[direction:ltr]' : ''}`}>
                {p.image ? (
                  <img src={p.image} alt={p.title} className="w-full h-56 md:h-72 object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                ) : (
                  <div style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded h-56 md:h-72 flex items-center justify-center">
                    <span style={{ color: 'var(--accent)', opacity: 0.2 }} className="font-mono text-6xl font-bold">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                )}
              </div>

              <div className={`md:col-span-5 ${i % 2 === 1 ? 'md:[direction:ltr] md:text-right' : ''} z-10`}>
                <p className="font-mono text-xs mb-1" style={{ color: 'var(--accent)' }}>Featured Project</p>
                {p.course && <p className="font-mono text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{p.course}</p>}
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-bright)' }}>{p.title}</h3>
                <div style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }} className="border rounded p-5 text-sm leading-relaxed shadow-xl">
                  {p.description}
                </div>
                <div className={`flex flex-wrap gap-3 mt-4 ${i % 2 === 1 ? 'md:justify-end' : ''}`}>
                  {p.tags.map(t => <span key={t} className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{t}</span>)}
                </div>
                <div className={`flex gap-3 mt-4 ${i % 2 === 1 ? 'md:justify-end' : ''}`}>
                  {p.github && (
                    <a href={p.github} target="_blank" rel="noreferrer" style={{ color: 'var(--text)' }} className="hover:opacity-60 transition-opacity"><GitHubIcon /></a>
                  )}
                  {p.external && (
                    <a href={p.external} target="_blank" rel="noreferrer" style={{ color: 'var(--text)' }} className="hover:opacity-60 transition-opacity"><ExternalIcon /></a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Other projects */}
        <h3 className="font-mono text-center text-lg mb-8" style={{ color: 'var(--text-bright)' }}>Other Noteworthy Projects</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleOthers.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
              id={p.anchor}
              className="border rounded-lg p-6 flex flex-col hover:-translate-y-1 transition-all duration-300 scroll-mt-24"
            >
              <div className="flex items-start justify-between mb-5">
                <FolderIcon />
                <div className="flex items-center gap-3">
                  {p.github && (
                    <a href={p.github} target="_blank" rel="noreferrer" style={{ color: 'var(--text)' }} className="hover:opacity-60 transition-opacity"><GitHubIcon /></a>
                  )}
                  {p.external && (
                    <a href={p.external} target="_blank" rel="noreferrer" style={{ color: 'var(--text)' }} className="hover:opacity-60 transition-opacity"><ExternalIcon /></a>
                  )}
                </div>
              </div>
              <h4 className="font-medium leading-snug mb-1" style={{ color: 'var(--text-bright)' }}>{p.title}</h4>
              {p.grade && <p className="font-mono text-xs mb-2" style={{ color: 'var(--accent)' }}>{p.grade}</p>}
              <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--text)' }}>{p.description}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {p.tags.map(t => <span key={t} className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{t}</span>)}
              </div>
            </motion.div>
          ))}
        </div>

        {others.length > INITIAL_SHOW && (
          <div className="text-center mt-10">
            <button
              onClick={() => setShowAll(!showAll)}
              style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
              className="font-mono text-sm border px-6 py-3 rounded hover:opacity-80 transition-opacity"
            >
              {showAll ? 'Show Less' : `Show ${others.length - INITIAL_SHOW} More`}
            </button>
          </div>
        )}
      </motion.div>
    </section>
  )
}
