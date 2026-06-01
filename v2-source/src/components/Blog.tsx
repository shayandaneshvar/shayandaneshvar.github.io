import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import SectionHeading from './SectionHeading'

export default function Blog() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="blog" className="py-24" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        <SectionHeading title="Blog & Visualizations" />

        <div
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
          className="flex flex-col items-center text-center py-16 border border-dashed rounded-lg"
        >
          <div className="mb-6" style={{ color: 'var(--border)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>

          <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-bright)' }}>Coming Soon</h3>
          <p className="max-w-md leading-relaxed" style={{ color: 'var(--text)' }}>
            This space is for interactive visualizations, technical write-ups, and tools.
            Things planned: transformer attention visualizations, training dynamics walkthroughs,
            and deep dives into LLM post-training techniques.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {['Transformer Visualizations', 'LLM Post-training', 'Training Dynamics', 'Interactive Tools'].map(tag => (
              <span
                key={tag}
                className="font-mono text-xs px-3 py-1.5 rounded-full border"
                style={{ color: 'var(--accent)', borderColor: 'var(--accent-40)' }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
