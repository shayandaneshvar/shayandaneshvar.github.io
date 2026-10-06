import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import SectionHeading from './SectionHeading'

const jobs = [
  {
    company: 'Huawei',
    title: 'LLM Research Engineer',
    org: 'Huawei Technologies Canada',
    location: 'Kingston, Canada',
    range: 'Nov 2025 – Present',
    bullets: [
      'Proposed and built a sandbox-reusing task augmentation pipeline that grew rejection-sampled distillation data by 50%, lifting Qwen3-14B via SFT by 4.3 pp on SWE-bench Verified and 7.1 pp on FeatBench',
      'Architected an agentic SWE environment builder whose procedural memory evolves into an executable ruleset, building 10K+ environments across 10 languages; against SWE-Gen that is 2.2× the yield, 3.8× the throughput and 68% fewer tokens',
      'Designed multi-stage guidance for agent evaluation to reduce false failures from hidden API mismatches, giving fairer benchmarking and graded training signals for PPO/DPO',
      'Developed a trajectory quality analyzer with agent tool call classification by phase to flag loops, brute-forcing and skipped verification, marking 12% of issue-resolution trajectories for redistillation',
      'Performed continual supervised fine-tuning of Pangu 92B MoE on 1B+ tokens of my distilled trajectories combined with a subsample of its original 15B-token code data, across multi-node distributed GPU/NPU clusters',
    ],
  },
  {
    company: 'MacDon',
    title: 'Machine Learning Engineer',
    org: 'MacDon Industries (contract via Zoomi Technologies)',
    location: 'Winnipeg, Canada',
    range: 'Apr 2025 – Sep 2025',
    bullets: [
      'Led end-to-end delivery of a DAFormer-based unsupervised domain adaptation model with a custom ClassMix, beating the supervised baseline by 3 pp in Dice score using only unlabelled real data, in 75% of the planned time',
      'Customized DoGE generative augmentation by conditioning ControlNet on filtered masks and edges; cut the labelled real data requirement by 70% while maintaining semantic segmentation quality',
      'Introduced a novel adaptation of ClassMix for binary segmentation and delivered the architecture production ready',
    ],
  },
  {
    company: 'MacDon (Intern)',
    title: 'Machine Learning Engineer Intern',
    org: 'MacDon Industries (Mitacs Accelerate)',
    location: 'Winnipeg, Canada',
    range: 'Nov 2024 – Mar 2025',
    bullets: [
      'Integrated and trained SegFormer in the legacy PyTorch pipeline for a 4 pp Dice gain, and diagnosed real vs synthetic drift with UMAP on CLIP and VGG embeddings, steering the project to domain adaptation',
      'Surveyed and presented SOTA unsupervised domain adaptation methods; the findings shaped the direction taken in the full-time role',
      'Ran 100+ augmentation experiments to identify which methods yield measurable performance gains',
    ],
  },
  {
    company: 'Mahsan',
    title: 'Senior Java Software Engineer',
    org: 'Mahsan',
    location: 'Tehran, Iran',
    range: 'May 2022 – Dec 2022',
    bullets: [
      'Guided a team of 4 in architecting a distributed data-analytics platform for dynamic ontology management, combining microkernel and microservices architectures with CQRS, Saga and Event Sourcing',
      'Built distributed tracing and monitoring for all microservices with Spring Cloud Sleuth, Zipkin, Prometheus, Grafana, Elasticsearch, Kibana and Logstash',
      'Researched and evaluated ETL tools (Knime, Spark, etc.) and adopted Apache NiFi for data pipeline implementation',
      'Led 50+ code reviews enforcing coding standards, mentored 2 junior developers, and taught Spring Cloud and microservices to 7+ developers over 30+ hours',
    ],
  },
  {
    company: 'Tosan Soha',
    title: 'Java Software Engineer',
    org: 'Tosan Soha',
    location: 'Tehran, Iran',
    range: 'Nov 2021 – May 2022',
    bullets: [
      'Developed hybrid Java/Kotlin e-wallet and trading platforms on Kubernetes serving 2K+ concurrent users, with banking APIs for internal and external services and event-driven Kafka workflows',
      'Proposed replacing a tangled JWT/session login system with Spring Security OAuth-based client/server services to enable third-party login, and implemented parts of the OAuth flow along with the cross-service refactorings',
      'Contributed 16K+ lines across those services, cutting technical debt through large-scale refactoring and replacing jQuery with native JS APIs',
    ],
  },
  {
    company: 'Pinket',
    title: 'Java Backend Developer',
    org: 'Pinket',
    location: 'Tehran, Iran',
    range: 'May 2021 – Nov 2021',
    bullets: [
      'Developed event-driven chat, notification and shopping services with Spring, Kafka, PostgreSQL and MongoDB',
      'Maintained the chat service and added integration and unit tests to CI/CD, raising code coverage by 7%',
    ],
  },
  {
    company: 'Mapsa',
    title: 'Java Instructor and Mentor (Part-time)',
    org: 'Mapsa HR and Training',
    location: 'Tehran, Iran',
    range: 'Jan 2020 – May 2021',
    bullets: [
      'Taught core and advanced Java, including OOP, SQL, data structures, concurrency, and algorithm design',
      'Delivered hands-on training and mentorship in Spring Boot, Spring MVC, JPA, Docker, and REST APIs',
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
