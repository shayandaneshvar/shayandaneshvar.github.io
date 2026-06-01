import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import SectionHeading from './SectionHeading'

export default function Contact() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="contact" className="py-24 text-center" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        <SectionHeading title="Get In Touch" />

        <p className="font-mono text-sm mb-4" style={{ color: 'var(--accent)' }}>What's Next?</p>
        <h2 className="text-4xl md:text-5xl font-bold mb-5" style={{ color: 'var(--text-bright)' }}>Say Hello.</h2>
        <p className="max-w-lg mx-auto leading-relaxed mb-10" style={{ color: 'var(--text)' }}>
          I'm open to interesting research collaborations, engineering roles, and conversations
          about LLMs, computer vision, or anything at the intersection of the two.
          My inbox is always open.
        </p>

        <a
          href="mailto:daneshvarshayan@gmail.com"
          style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
          className="font-mono border px-10 py-4 rounded text-sm hover:opacity-80 transition-all duration-300 hover:-translate-y-0.5 inline-block"
        >
          Say Hello
        </a>
      </motion.div>
    </section>
  )
}
