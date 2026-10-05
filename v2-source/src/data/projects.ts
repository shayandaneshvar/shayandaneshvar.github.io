// Project data, kept out of the component so the legacy hash resolver can read the
// anchors without importing the component (and without a cycle).
//
// `anchor` is the id the old v1 page used for that project. Those links are still in the
// wild, so the ids move with the content instead of being retired.

export interface Project {
  title: string
  description: string
  tags: string[]
  year: string
  anchor?: string
  image?: string
  github?: string
  external?: string
  course?: string
  grade?: string
}

export const INITIAL_SHOW = 4

export const featured: Project[] = [
  {
    title: 'Single Image Reflection Removal with Mamba/S6',
    anchor: 'reflection-removal-with-mamba',
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
    anchor: 'gui-element-detection-yolo',
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
    anchor: 'brain-tumor-segmentation-3DUNet',
    description:
      'Created, trained, and evaluated three 3D U-Net variants on the BraTS2020 dataset: Vanilla 3D U-Net, Residual 3D U-Net, and a 3D U-Net with a custom attention mechanism. Trained with both Dice and BCE+Dice losses. Also helped a colleague use the segmentation outputs to train an FCN for survival rate prediction.',
    tags: ['Python', 'PyTorch', '3D U-Net', 'BraTS2020', 'Segmentation'],
    year: '2023',
    image: '/images/BraTS20.png',
    github: 'https://github.com/shayandaneshvar/braTS-2020',
    course: 'Deep Learning with CNNs · A+',
  },
]

export const others: Project[] = [
  {
    title: 'Reflection Removal of In-vehicle Images',
    anchor: 'bsc-thesis',
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
    anchor: 'dapixi',
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
    anchor: 'la-project',
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
    anchor: 'cv-bsc-project',
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
    anchor: 'ai-2',
    description:
      'Implemented Genetic Algorithm, Genetic Programming, and NSGA-II from scratch in Java (no optimization libraries). Applied to extractive text summarization optimizing for sentence diversity and relevance. Results were strong enough that the course instructor offered a RA position to publish it.',
    tags: ['Java', 'NSGA-II', 'Genetic Algorithm', 'NLP'],
    year: '2021',
    github: 'https://github.com/shayandaneshvar/AI-project-2',
  },
  {
    title: 'KBox: Cloud File Storage',
    anchor: 'kbox',
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
    anchor: 'chibaladi',
    description:
      'Microservices e-learning platform with video courses and adaptive quizzing. Owned backend architecture, development, and deployment end-to-end. Completed Video, Auth, and Quiz services before the startup was cancelled for lack of funding.',
    tags: ['Spring Cloud', 'React', 'Next.js', 'PostgreSQL', 'MongoDB', 'Docker'],
    year: '2021',
    external: 'https://web.archive.org/web/20211124123101/https://chibaladi.com/',
  },
  {
    title: 'Huffman Text Compressor',
    anchor: 'huffman',
    description:
      'Implemented the Huffman compression algorithm and priority-queue tree data structure from scratch using Java Random Access File. Includes a GUI with drag-and-drop support and an optional file lock.',
    tags: ['Java', 'Data Structures', 'Compression', 'GUI'],
    year: '2019',
    grade: '18.2/20',
    github: 'https://github.com/shayandaneshvar/Huffman-Compressor',
  },
]

/** Every project anchor carried over from v1. */
export const PROJECT_ANCHORS: string[] = [...featured, ...others]
  .map(p => p.anchor)
  .filter((a): a is string => !!a)

/** Anchors that sit in the collapsed part of the list and need it expanded. */
export const HIDDEN_PROJECT_ANCHORS: string[] = others
  .slice(INITIAL_SHOW)
  .map(p => p.anchor)
  .filter((a): a is string => !!a)
