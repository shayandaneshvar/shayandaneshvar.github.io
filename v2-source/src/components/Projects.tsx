import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import SectionHeading from './SectionHeading'

const featured = [
  {
    title: 'Single Image Reflection Removal with Mamba/S6',
    description:
      'Replicated the best SOTA single image reflection removal model (DSRNet), created an image-based version of the Mamba/S6 state-space model, and replaced attention modules in DSRNet with Mamba modules. Also investigated cosine annealing LR scheduling and AdamW weight decay on the resulting Mamba-CNN network.',
    tags: ['Python', 'PyTorch', 'Docker', 'OpenCV', 'Mamba/S6'],
    year: '2024',
    image: '/images/sirr_mamba.png',
    github: 'https://github.com/shayandaneshvar/mamba-reflection',
    course: 'Image-based Generative Methods in ML · A+',
  },
  {
    title: 'GUI Element Detection using SOTA YOLO Models',
    description:
      'Benchmarked multiple YOLO variants on a GUI element detection dataset, investigating three novel research questions on mAP@.5 performance with IoU > 0.5. Published as an ArXiv preprint.',
    tags: ['Python', 'PyTorch', 'TensorFlow', 'YOLOv8', 'YOLOv9'],
    year: '2023',
    image: '/images/gui-element-det-res.png',
    github: 'https://github.com/shayandaneshvar/gui-element-detection',
    external: 'https://arxiv.org/abs/2408.03507',
    course: 'Data-driven Software Engineering · A+',
  },
  {
    title: 'Brain Tumor Segmentation with 3D U-Net Variants',
    description:
      'Created, trained, and evaluated three 3D U-Net variants on the BraTS2020 dataset: Vanilla 3D U-Net, Residual 3D U-Net, and a 3D U-Net with a custom attention mechanism. Trained with both Dice and BCE+Dice losses. Also helped a colleague use the segmentation outputs to train an FCN for survival rate prediction.',
    tags: ['Python', 'PyTorch', '3D U-Net', 'BraTS2020', 'Segmentation'],
    year: '2023',
    image: '/images/BraTS20.png',
    github: 'https://github.com/shayandaneshvar/braTS-2020',
    course: 'Deep Learning with CNNs · A+',
  },
]

const others = [
  {
    title: 'Reflection Removal of In-vehicle Images',
    description:
      'BSc thesis. Synthesized a reflection dataset from CamVid road images, built a U-Net-style CNN with 3-channel output, and trained variants with different depths and kernel sizes to remove windshield reflections while preserving the scene behind.',
    tags: ['Python', 'PyTorch', 'U-Net', 'Dataset Synthesis'],
    year: '2022',
    grade: '19.5/20',
    image: '/images/bsc-thesis.jpg',
    github: 'https://github.com/shayandaneshvar/Reflection-Removal-Project',
  },
  {
    title: 'Dapixi: Photo Sharing Platform',
    description:
      'Microservices photo-sharing social network (similar to Instagram and Pinterest). Led backend design, development, and deployment. Over 12K lines of Java alongside recommender systems (categorical + collaborative filtering) in Python. Still running.',
    tags: ['Java', 'Spring Cloud', 'Angular 10', 'MongoDB', 'Docker', 'OAuth2'],
    year: '2020',
    grade: '19.9/20',
    image: '/images/dapixi.jpg',
    external: 'https://dapixi.ir',
  },
  {
    title: 'Face Registration, Morphing and Gesture Transfer',
    description:
      'Detected face landmarks with dlib, computed average faces, and registered faces using affine and similarity transforms. Computed PCA via SVD to find and animate the top 10 principal components. Transferred live webcam gestures to face models by solving a least squares problem.',
    tags: ['Python', 'OpenCV', 'dlib', 'PCA', 'SVD'],
    year: '2021',
    grade: '19.9/20',
    image: '/images/linearAlgebra-project.jpg',
    github: 'https://github.com/shayandaneshvar/Face-Morphing-Project',
  },
  {
    title: 'Soccer Player Detection, Classification and Visualization',
    description:
      "Detected players using KNN background subtraction and connected components. Trained a CNN on a custom dataset to classify players vs referees, reaching 98%+ accuracy at 10fps on a mid-range laptop. Mapped player positions to a bird's-eye field view using perspective transforms across three camera feeds.",
    tags: ['Python', 'OpenCV', 'KNN', 'CNN'],
    year: '2021',
    grade: '20/20',
    image: '/images/ComputerVisionCourseProject.jpg',
    github: 'https://github.com/shayandaneshvar/ComputerVision-Final-Project',
  },
  {
    title: 'Text Summarizer with Genetic Algorithm and NSGA-II',
    description:
      'Implemented Genetic Algorithm, Genetic Programming, and NSGA-II from scratch in Java (no optimization libraries). Applied to extractive text summarization optimizing for sentence diversity and relevance. Results were strong enough that the course instructor offered a RA position to publish it.',
    tags: ['Java', 'NSGA-II', 'Genetic Algorithm', 'NLP'],
    year: '2021',
    github: 'https://github.com/shayandaneshvar/AI-project-2',
  },
  {
    title: 'KBox: Cloud File Storage',
    description:
      'Full monolith web app built with Spring Framework, Spring Security, MongoDB GridFS, and Thymeleaf. Supported file upload, download, and sharing via email or link. Deployed and publicly available for over two months.',
    tags: ['Java', 'Spring Boot', 'MongoDB', 'GridFS', 'Spring Security'],
    year: '2021',
    grade: '20/20',
    image: '/images/kbox.jpg',
    github: 'https://github.com/shayandaneshvar/KBox',
  },
  {
    title: 'Chibaladi: E-Learning Platform',
    description:
      'Microservices e-learning platform with video courses and adaptive quizzing. Owned backend architecture, development, and deployment end-to-end. Completed Video, Auth, and Quiz services before the startup was cancelled for lack of funding.',
    tags: ['Spring Cloud', 'React', 'Next.js', 'PostgreSQL', 'MongoDB', 'Docker'],
    year: '2021',
    external: 'https://web.archive.org/web/20211124123101/https://chibaladi.com/',
  },
  {
    title: 'Huffman Text Compressor',
    description:
      'Implemented the Huffman compression algorithm and priority-queue tree data structure from scratch using Java Random Access File. Includes a GUI with drag-and-drop support and an optional file lock.',
    tags: ['Java', 'Data Structures', 'Compression', 'GUI'],
    year: '2019',
    grade: '18.2/20',
    github: 'https://github.com/shayandaneshvar/Huffman-Compressor',
  },
]

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

const INITIAL_SHOW = 4

export default function Projects() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const [showAll, setShowAll] = useState(false)
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
              className={`relative grid md:grid-cols-12 gap-4 items-center ${i % 2 === 1 ? 'md:[direction:rtl]' : ''}`}
            >
              <div className={`md:col-span-7 relative group rounded overflow-hidden ${i % 2 === 1 ? 'md:[direction:ltr]' : ''}`}>
                {p.image ? (
                  <>
                    <div style={{ backgroundColor: 'var(--accent-20)' }} className="absolute inset-0 group-hover:bg-transparent transition-all duration-300 z-10" />
                    <img src={p.image} alt={p.title} className="w-full h-56 md:h-72 object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                  </>
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
              className="border rounded-lg p-6 flex flex-col hover:-translate-y-1 transition-all duration-300"
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
