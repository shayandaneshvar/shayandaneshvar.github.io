import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import SectionHeading from './SectionHeading'

const jobs = [
  {
    company: 'Huawei',
    title: 'LLM Research Engineer',
    org: 'Huawei Technologies',
    location: 'Kingston, Canada',
    range: 'Nov 2025 – Present',
    bullets: [
      'Boosted 7B and 30B reasoning LLMs by 26 to 71% on target benchmarks via SFT on 10B to 25B+ rejection-sampled tokens, enabling native tool-calling for agentic software engineering tasks',
      'Built an agentic data augmentation pipeline that generated the training dataset; integrated a scaffold-reusing verifier to validate integrity and preserve test state across augmented samples',
      'Extended the internal Code LLM evaluation scaffold with multi-stage reward design and code hints; improved benchmark fairness and produced RL-ready training signals for GRPO/PPO training',
      'Ran end-to-end fine-tuning, evaluation, and inference pipelines for 1B to 30B LLMs on multi-node GPU/NPU clusters',
    ],
  },
  {
    company: 'MacDon',
    title: 'Machine Learning Engineer',
    org: 'MacDon Industries',
    location: 'Winnipeg, Canada',
    range: 'Apr 2025 – Oct 2025',
    bullets: [
      'Customized DoGE generative augmentation by conditioning ControlNet on filtered masks and edges; cut labeled real data requirements by 70% while maintaining semantic segmentation quality',
      'Engineered a production-ready DAFormer-based architecture for unsupervised domain adaptation in semantic segmentation, introducing a novel adaptation of ClassMix for binary segmentation',
      'Surpassed the supervised baseline by 3% Dice score using only unlabeled data through pseudo-labeling',
      'Led end-to-end design and delivery independently, delivering in 75% of expected time with results exceeding performance goals',
    ],
  },
  {
    company: 'MacDon (Intern)',
    title: 'ML Engineer Intern',
    org: 'MacDon Industries',
    location: 'Winnipeg, Canada',
    range: 'Nov 2024 – Apr 2025',
    bullets: [
      'Mapped domain drift between real and synthetic images (VGG and CLIP embeddings + UMAP), identifying unsupervised domain adaptation as the path forward; this finding anchored the entire project direction',
      'Adapted and trained SegFormer into the legacy PyTorch pipeline, achieving a 4% Dice score gain on the test set',
      'Surveyed and presented SOTA UDA methods; findings directly shaped the direction taken in the full-time role',
      'Ran 100+ augmentation experiments to identify which methods yield measurable performance gains',
    ],
  },
  {
    company: 'Mahsan',
    title: 'Software Engineer',
    org: 'Mahsan',
    location: 'Tehran, Iran',
    range: 'May 2022 – Dec 2022',
    bullets: [
      'Designed the architecture using a mix of microservices and kernel patterns for a distributed data analytics platform for dynamic ontology management',
      'Integrated web service monitoring using Spring Cloud Tracing, Prometheus, Grafana, ELK stack, and Zipkin, enabling distributed tracing and real-time diagnostics across all microservices',
      'Authored 20K+ lines of code and led 50+ rigorous code reviews, enforcing standards that bumped velocity by 9%',
      'Researched and evaluated ETL tools (Knime, Spark, etc.) and adopted Apache NiFi for data pipeline implementation',
      'Taught Spring Framework, Spring Cloud, and Microservices patterns to 7+ developers across 30+ hours of sessions',
    ],
  },
  {
    company: 'Tosan / Pinket',
    title: 'Java Software Engineer',
    org: 'Tosan Soha & Pinket',
    location: 'Tehran, Iran',
    range: 'May 2021 – May 2022',
    bullets: [
      'Refactored and contributed 16K+ lines in hybrid Java/Kotlin web services, modularizing APIs and simplifying security by replacing the legacy Session/JWT system with Spring Cloud Security OAuth modules',
      'Developed and maintained e-wallet and trading platforms providing banking APIs to internal and external services, reducing technical debt through large-scale refactoring and replacing jQuery with native JS APIs',
      'Built event-driven workflows using Spring and Kafka for chat, notifications, and shopping services serving 2K+ concurrent users',
    ],
  },
  {
    company: 'Mapsa',
    title: 'Java Web Development Instructor',
    org: 'Mapsa HR and Training',
    location: 'Tehran, Iran',
    range: 'Jan 2020 – May 2021',
    bullets: [
      'Taught core and advanced Java programming including OOP, SQL, Data Structures, Concurrency, and Algorithms',
      'Delivered practical hands-on training and mentorship in Spring Boot, Spring MVC, JPA, Docker, and REST APIs',
    ],
  },
  {
    company: 'Mapsa (Intern)',
    title: 'Java Backend Developer Intern',
    org: 'Mapsa HR and Training',
    location: 'Tehran, Iran',
    range: 'Jun 2019 – Sep 2019',
    bullets: [
      'Collaborated with team members following Scrum practices to prototype, develop, and deploy apps on the cloud',
      'Gained practical experience in Java development, Agile, industry standards, and best practices in a team setting',
    ],
  },
]

export default function Experience() {
  const [active, setActive] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const job = jobs[active]

  return (
    <section id="experience" className="py-24" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        <SectionHeading title="Experience" />

        <div className="flex flex-col sm:flex-row gap-0">
          <div style={{ borderColor: 'var(--border)' }} className="flex sm:flex-col overflow-x-auto sm:overflow-visible border-b sm:border-b-0 sm:border-l-2">
            {jobs.map((j, i) => (
              <button
                key={j.company}
                onClick={() => setActive(i)}
                style={active === i
                  ? { color: 'var(--accent)', borderColor: 'var(--accent)', backgroundColor: 'var(--accent-5)' }
                  : { color: 'var(--text)', borderColor: 'transparent' }
                }
                className="font-mono text-sm px-5 py-3 text-left whitespace-nowrap transition-all duration-200 border-b-2 sm:border-b-0 sm:border-l-2 -mb-px sm:mb-0 sm:-ml-[2px]"
              >
                {j.company}
              </button>
            ))}
          </div>

          <div className="sm:ml-8 pt-4 sm:pt-0 flex-1">
            <h3 className="text-xl font-medium" style={{ color: 'var(--text-bright)' }}>
              {job.title}{' '}
              <span style={{ color: 'var(--accent)' }}>@ {job.org}</span>
            </h3>
            <p className="font-mono text-sm mt-1 mb-1" style={{ color: 'var(--text-muted)' }}>{job.location}</p>
            <p className="font-mono text-sm mb-5" style={{ color: 'var(--text)' }}>{job.range}</p>

            <ul className="space-y-3">
              {job.bullets.map((b, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                  <span style={{ color: 'var(--accent)' }} className="mt-0.5 flex-shrink-0">▹</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
