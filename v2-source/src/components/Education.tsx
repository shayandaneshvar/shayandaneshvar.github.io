import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import SectionHeading from './SectionHeading'

// Everything here comes from the resume. No inferred coursework or paraphrased titles.
// Sourced from the resume and LinkedIn. Nothing inferred.
const degrees = [
  {
    degree: 'MSc in Computer Science',
    focus: 'Deep Learning for Software Engineering',
    school: 'University of Manitoba',
    location: 'Winnipeg, Canada',
    gpa: '4.5 / 4.5',
    thesis: 'Exploring Representation-level Augmentation and RAG-based Vulnerability Augmentation with LLMs for Vulnerability Detection',
    highlights: [
      'Two first-author papers: ACM TOSEM (Q1) and EASE 2025 (CORE A)',
      'Graduate research assistant in machine learning for software engineering, supervised by Dr. Shaowei Wang',
      'TA for Computational Intelligence and Software Engineering 2; grader for Machine Learning, Software Engineering 1 and Project Management',
      'Reviewer for ACM TOSEM (2026 to present) and ICSE 2026 Shadow Program Committee',
      'Graduate Fellowship, Research Completion Award and International Graduate Entrance Scholarship',
    ],
  },
  {
    degree: 'BSc in Computer Engineering',
    focus: 'Software Engineering and Applied AI',
    school: 'K.N. Toosi University of Technology',
    location: 'Tehran, Iran',
    gpa: '19.21 / 20 (4.0 / 4.0)',
    thesis: 'Reflection Removal of In-vehicle Images with UNets (19.5/20)',
    highlights: [
      'Ranked 1st of 76 in the program',
      'Undergraduate research assistant in computer vision and machine learning, supervised by Dr. Behrooz Nasihatkon',
      'Head TA for Advanced Programming with Java, Operating Systems, and Design and Analysis of Algorithms; TA for Database Design',
      'Computer engineering in Iran covers the computer science curriculum plus mandatory electrical engineering and electronics courses (140 credits)',
      'Ranked 1,427th of 144,437 (top 1%) in the national university entrance exam',
    ],
  },
]

export default function Education() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="education" className="py-24" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        <SectionHeading title="Education" />

        <div className="space-y-6">
          {degrees.map((d, i) => (
            <motion.div
              key={d.degree}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
              className="rounded-lg p-6 md:p-8 border hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-lg font-semibold transition-colors" style={{ color: 'var(--text-bright)' }}>
                    {d.degree}
                  </h3>
                  {d.focus && <p className="font-mono text-sm" style={{ color: 'var(--accent)' }}>{d.focus}</p>}
                  <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
                    {d.school} · {d.location}
                  </p>
                </div>
                <p className="font-mono text-sm shrink-0" style={{ color: 'var(--accent)' }}>GPA: {d.gpa}</p>
              </div>

              <p className="text-sm italic mb-4 border-l-2 pl-4" style={{ color: 'var(--text)', borderColor: 'var(--accent-40)' }}>
                Thesis: {d.thesis}
              </p>

              <ul className="space-y-1.5">
                {d.highlights.map((h, j) => (
                  <li key={j} className="text-sm flex gap-2" style={{ color: 'var(--text)' }}>
                    <span style={{ color: 'var(--accent)' }} className="shrink-0">▹</span>
                    {h}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
