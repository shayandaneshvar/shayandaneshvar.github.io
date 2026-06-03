import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import TransformerViz from '../components/transformer/TransformerViz'
import MemoryCalc from '../components/transformer/MemoryCalc'

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
            An interactive causal decoder-only transformer you can poke at. Switch between
            sinusoidal and RoPE position encodings, compare multi-head vs grouped-query
            attention, and see how temperature and different sampling strategies carve up
            the output distribution. Click any module in the architecture diagram to expand it.
          </p>
          <p className="font-mono text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
            June 2026 · S. Shayan Daneshvar
          </p>
        </div>

        {/* Visualizer */}
        <TransformerViz />

        {/* KV Cache */}
        <div className="mt-16 pt-10 border-t" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-bright)' }}>KV Cache</h2>
          <div className="space-y-4 max-w-2xl">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              At each generation step, self-attention needs the K and V vectors for every token
              that came before. Without caching, you recompute them all from scratch on every
              step — so generating token 512 recomputes K and V for tokens 0 through 511. That
              is quadratic in the number of generated tokens.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              The KV cache avoids this by storing K and V from every previous step. When
              generating token t+1, you compute Q, K, V only for the new token, append the
              new K and V to the cache, and attend over the full cached sequence. Compute
              per step is now constant. The trade-off is memory: the cache grows by one row
              per layer per step, so longer contexts cost more VRAM.
            </p>
            <div className="font-mono text-xs px-4 py-3 rounded border leading-relaxed"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--accent)' }}>
              KV cache size = n_layers × 2 (K and V) × seq_len × n_kv_heads × d_head × 2 bytes<br />
              <br />
              per token = n_layers × 2 × n_kv_heads × d_head × 2 bytes<br />
              <span style={{ color: 'var(--text-muted)' }}>
                Llama 3 8B: 32 × 2 × 8 × 128 × 2 = 131 KB per token → 1 GB at 8K context
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              This is precisely why GQA exists. With 32 Q heads but only 8 KV heads, the cache
              is 4x smaller than MHA with no meaningful quality loss. At 128K context windows
              the difference is tens of gigabytes.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              There is a separate scaling problem with context length: naive attention computes
              a seq_len × seq_len score matrix, so memory grows quadratically. Doubling context
              length quadruples the memory needed to store those scores. FlashAttention sidesteps
              this by never materializing the full matrix. It computes attention in tiles that
              fit in fast on-chip SRAM, keeping memory linear in sequence length. Compute is
              still O(n²) in FLOPs either way, but the memory bottleneck is gone, which is what
              makes 128K+ contexts feasible on real hardware.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              One important limitation: in a multi-turn conversation, each new turn typically
              recomputes the KV cache from scratch over the full conversation history. If your
              system prompt is 10K tokens and you have 50 tool call steps, you are paying that
              recompute cost 50 times.
            </p>
            <p className="text-sm font-medium mt-2" style={{ color: 'var(--text-bright)' }}>Prefix caching</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              Prefix caching solves this. If the token sequence at the start of a new request
              exactly matches a previously computed one, the inference server reuses the stored
              KV cache for that prefix instead of recomputing it. A 32K system prompt that is
              identical across all requests gets computed once. Only the new tokens after the
              prefix need fresh computation.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              vLLM supports this via automatic prefix caching (enabled by default in recent
              versions). SGLang takes it further with RadixAttention, which organizes the KV
              cache as a radix tree and can match and reuse any shared prefix across concurrent
              requests, not just system prompts.
            </p>
          </div>
        </div>

        {/* Memory Calculator */}
        <div className="mt-12 pt-10 border-t" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-bright)' }}>Memory Requirements</h2>
          <p className="text-sm leading-relaxed mb-8 max-w-2xl" style={{ color: 'var(--text)' }}>
            How much GPU memory a model actually needs. Starts with the toy model from the
            diagram above — switch presets to see real numbers. FP16 weights throughout;
            training uses mixed precision with FP32 master weights and AdamW optimizer states.
          </p>
          <MemoryCalc />
        </div>

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
