import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import TransformerViz from '../components/transformer/TransformerViz'

export default function BlogTransformerViz() {
  return (
    <div className="relative">
      <Nav />
      <main className="mx-auto max-w-[1200px] px-6 md:px-12 pt-28 pb-24">

        {/* Breadcrumb */}
        <Link to="/" className="font-mono text-sm inline-flex items-center gap-2 mb-8 hover:opacity-70 transition-opacity"
          style={{ color: 'var(--text-muted)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Portfolio
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            {['Transformers', 'LLMs', 'Interactive', 'Visualization'].map(tag => (
              <span key={tag} className="font-mono text-xs px-3 py-1 rounded-full border"
                style={{ color: 'var(--accent)', borderColor: 'var(--accent-40)' }}>
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4"
            style={{ color: 'var(--text-bright)' }}>
            Transformer Architecture Explorer
          </h1>
          <p className="text-base leading-relaxed max-w-2xl" style={{ color: 'var(--text)' }}>
            An interactive decoder-only transformer you can poke at. Switch between sinusoidal
            and RoPE position encodings, compare multi-head vs grouped-query attention, and
            see how different sampling strategies carve up the output distribution.
            Click any module in the architecture diagram to expand it.
          </p>
          <p className="font-mono text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
            June 2026 · S. Shayan Daneshvar
          </p>
        </div>

        {/* Visualizer */}
        <TransformerViz />

        {/* Notes */}
        <div className="mt-16 pt-10 border-t space-y-4 max-w-2xl" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-bright)' }}>Notes</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
            The attention weights shown are deterministic pseudo-random values (seeded per head
            and layer) to produce realistic-looking patterns without requiring an actual forward
            pass. The sinusoidal PE heatmap and RoPE frequency plots use the real formulas.
            Sampling probabilities use a fixed logit distribution conditioned on the context
            "The cat sat on the ___".
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
            d_model = 32 (for visual clarity), 4 attention heads, 2 layers. Real models use
            d_model = 4096-8192, 32-128 heads, 32-128 layers.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
