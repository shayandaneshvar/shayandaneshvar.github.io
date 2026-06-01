import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import SectionHeading from './SectionHeading'

const skills = [
  'Python', 'PyTorch', 'Transformers', 'vLLM',
  'LLaMA-Factory', 'Megatron-LM', 'Ray',
  'Docker', 'Kubernetes', 'Apache Kafka',
  'AWS EC2', 'Java',
]

export default function About() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="about" className="py-24" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        <SectionHeading title="About Me" />

        <div className="grid md:grid-cols-[3fr_2fr] gap-12 items-start">
          <div className="space-y-4 text-base leading-relaxed" style={{ color: 'var(--text)' }}>
            <p>
              I train language models for a living and find it genuinely interesting. Most of my
              time right now goes into post-training Code LLMs at{' '}
              <span style={{ color: 'var(--text-bright)' }}>Huawei</span>: training, evaluation, and
              deployment. Rejection sampling, SFT, reward design, benchmarking — the full loop,
              trying to make models that can actually help with real software tasks. Before that I
              was at MacDon adapting computer vision models to industrial settings with almost no
              labeled data.
            </p>
            <p>
              My research background is in ML for Software Engineering. My MSc at the{' '}
              <span style={{ color: 'var(--text-bright)' }}>University of Manitoba</span> focused on
              using LLMs to generate better training data for vulnerability detection, which led to
              publications in <span style={{ color: 'var(--accent)' }}>TOSEM</span> and{' '}
              <span style={{ color: 'var(--accent)' }}>EASE</span>. Along the way I also worked on
              state-space models for image restoration and YOLO-based GUI detection, mostly because
              the problems were interesting.
            </p>
            <p>
              I started out as a software engineer and spent a few years building production systems
              before going all-in on ML. That background mostly just means I can take a project from
              idea to deployment myself. Published as{' '}
              <span style={{ color: 'var(--accent)' }} className="font-mono">S. Shayan Daneshvar</span>.
            </p>

            <p style={{ color: 'var(--text-bright)' }} className="font-medium mt-6">Technologies I work with:</p>
            <ul className="grid grid-cols-2 gap-2 mt-2">
              {skills.map(skill => (
                <li key={skill} className="font-mono text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <span style={{ color: 'var(--accent)' }}>▹</span>
                  {skill}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative group mx-auto md:mx-0 w-64 h-64 md:w-full md:h-auto md:aspect-square max-w-xs">
            <div style={{ borderColor: 'var(--accent)' }} className="absolute inset-0 border-2 rounded translate-x-4 translate-y-4 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform duration-300 z-0" />
            <div className="relative z-10 rounded overflow-hidden w-full h-full">
              <img
                src="/photo1.jpg"
                alt="Shay Daneshvar"
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500 group-hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
