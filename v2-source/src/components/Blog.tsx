import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import SectionHeading from './SectionHeading'

const posts = [
  {
    title: 'Transformer Architecture Explorer',
    description:
      'Interactive decoder-only transformer visualizer. Switch between sinusoidal and RoPE positional encodings, compare multi-head vs grouped-query attention, explore different sampling strategies. Click any module to see its internals.',
    tags: ['Transformers', 'LLMs', 'Interactive', 'Visualization'],
    date: 'Jun 2026',
    href: '/blog/transformer-visualization',
    live: true,
  },
]

const upcoming = ['LLM Post-training Deep Dive', 'Training Dynamics & Loss Curves', 'vLLM Inference Internals']

export default function Blog() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="blog" className="py-24" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}>
        <SectionHeading title="Blog & Visualizations" />

        <div className="space-y-6">
          {posts.map((post, i) => (
            <motion.div
              key={post.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}>
              <Link to={post.href}
                className="block rounded-lg border p-6 transition-all duration-300 hover:-translate-y-0.5 group"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{post.date}</span>
                      {post.live && (
                        <span className="font-mono text-xs px-2 py-0.5 rounded-full border"
                          style={{ color: 'var(--accent)', borderColor: 'var(--accent-40)' }}>
                          live
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold mb-2 group-hover:opacity-80 transition-opacity"
                      style={{ color: 'var(--text-bright)' }}>
                      {post.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                      {post.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {post.tags.map(tag => (
                        <span key={tag} className="font-mono text-xs px-2 py-0.5 rounded"
                          style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface-2)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="flex-shrink-0 mt-1 group-hover:translate-x-1 transition-transform duration-200"
                    style={{ color: 'var(--accent)' }}>
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </Link>
            </motion.div>
          ))}

          {/* Upcoming */}
          <div className="rounded-lg border p-6" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', borderStyle: 'dashed' }}>
            <p className="font-mono text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Coming up</p>
            <div className="space-y-2">
              {upcoming.map(title => (
                <div key={title} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
