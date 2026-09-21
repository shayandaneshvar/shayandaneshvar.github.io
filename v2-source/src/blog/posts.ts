import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

// Single source of truth for blog posts. The home page card list and the router both
// read from here, so adding a post is: write the page, then add one entry below.
// Pages are lazy loaded so each post ships as its own chunk, not in the home bundle.

export interface Post {
  slug: string          // URL is /v2/#/blog/<slug>
  title: string
  description: string
  tags: string[]
  date: string          // display date, e.g. 'Jun 2026'
  live?: boolean        // interactive post, shows the "live" badge
  Component: LazyExoticComponent<ComponentType>
}

export const posts: Post[] = [
  {
    slug: '5d-parallelism',
    title: '5D Parallelism: DP, TP, PP, CP and EP',
    description:
      'What each parallel dimension splits, what it communicates and where it belongs in a cluster, plus an interactive planner. Pick Qwen3 14B, 32B or a MoE, your GPU or NPU and node size, and get the valid layouts, how many devices you need, memory per device, training step time, and the throughput vs latency trade-off for serving.',
    tags: ['Distributed Training', 'Inference', 'Parallelism', 'Interactive'],
    date: 'Jul 2026',
    live: true,
    Component: lazy(() => import('../pages/BlogParallelism')),
  },
  {
    slug: 'transformer-visualization',
    title: 'Transformer Architecture Explorer',
    description:
      'Interactive decoder-only transformer visualizer. Switch between sinusoidal and RoPE positional encodings, compare multi-head vs grouped-query attention, explore different sampling strategies. Click any module to see its internals.',
    tags: ['Transformers', 'LLMs', 'Interactive', 'Visualization'],
    date: 'Jun 2026',
    live: true,
    Component: lazy(() => import('../pages/BlogTransformerViz')),
  },
]

export const upcoming = ['LLM Post-training Deep Dive', 'Training Dynamics & Loss Curves', 'vLLM Inference Internals']

export function getPost(slug: string): Post {
  const post = posts.find(p => p.slug === slug)
  if (!post) throw new Error(`Unknown blog post: ${slug}`)
  return post
}
