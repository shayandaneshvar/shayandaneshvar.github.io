import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import SectionHeading from './SectionHeading'

const pubs = [
  {
    title: 'VulScribeR: Exploring RAG-based Vulnerability Augmentation with LLMs',
    venue: 'ACM Transactions on Software Engineering and Methodology (TOSEM)',
    badge: 'Q1 · IF 7.0',
    year: '2025',
    authors: 'Seyed Shayan Daneshvar, Yu Nong, Xu Yang, Shaowei Wang, Haipeng Cai',
    doi: 'https://dl.acm.org/doi/abs/10.1145/3760775',
    tags: ['LLM', 'RAG', 'Vulnerability Detection', 'Data Augmentation'],
  },
  {
    title: 'A Study on Mixup-inspired Augmentation Methods for Software Vulnerability Detection',
    venue: 'EASE 2025, International Conference on Evaluation and Assessment in SE',
    badge: 'CORE A',
    year: '2025',
    authors: 'Seyed Shayan Daneshvar, Da Tan, Shaowei Wang, Carson Leung',
    doi: 'https://dl.acm.org/doi/full/10.1145/3756681.3757017',
    tags: ['Mixup', 'Augmentation', 'Vulnerability Detection', 'ML4SE'],
  },
  {
    title: 'GUI Element Detection Using SOTA YOLO Deep Learning Models',
    venue: 'ArXiv Preprint',
    badge: 'Preprint',
    year: '2024',
    authors: 'Seyed Shayan Daneshvar, Shaowei Wang',
    doi: 'https://arxiv.org/pdf/2408.03507',
    tags: ['YOLO', 'Object Detection', 'GUI', 'Computer Vision'],
  },
  {
    title: 'The Application of Barcode Readable Assay and Linear Regression RGB Analysis Using a Customized Smartphone App in On-chip Electromembrane Extraction for Simultaneous Determination of Heavy Metal Ions',
    venue: 'Microchemical Journal',
    badge: 'Q1 · IF 5.4',
    year: '2024',
    authors: 'Neda Rezaei, Seyed Shayan Daneshvar, Behrooz Nasihatkon, Shahram Seidi, Maryam Rezazadeh',
    doi: 'https://www.sciencedirect.com/science/article/abs/pii/S0026265X23013218',
    tags: ['Computer Vision', 'RGB Analysis', 'Android', 'Point-of-Care'],
  },
]

export default function Publications() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="publications" className="py-24" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        <SectionHeading title="Publications" />

        <div className="space-y-4">
          {pubs.map((p, i) => (
            <motion.a
              key={p.title}
              href={p.doi}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
              className="block rounded-lg p-5 md:p-6 border hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-medium group-hover:opacity-70 transition-opacity leading-snug" style={{ color: 'var(--text-bright)' }}>
                    {p.title}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>{p.venue}</p>
                  <p className="font-mono text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{p.authors}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {p.tags.map(t => (
                      <span key={t} className="font-mono text-xs px-2 py-0.5 rounded" style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-10)' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                  <span className="font-mono text-xs px-2 py-1 rounded border whitespace-nowrap" style={{ color: 'var(--accent)', borderColor: 'var(--accent-40)' }}>
                    {p.badge}
                  </span>
                  <span className="font-mono text-xs" style={{ color: 'var(--text)' }}>{p.year}</span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>

        <p className="mt-6 text-center">
          <a
            href="https://scholar.google.ca/citations?user=NVHzLg0AAAAJ"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--accent)' }}
            className="font-mono text-sm hover:underline"
          >
            View all on Google Scholar →
          </a>
        </p>
      </motion.div>
    </section>
  )
}
