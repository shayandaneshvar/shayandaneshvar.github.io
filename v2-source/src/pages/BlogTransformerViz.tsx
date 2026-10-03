import BlogPostLayout from '../components/BlogPostLayout'
import TransformerViz from '../components/transformer/TransformerViz'
import MemoryCalc from '../components/transformer/MemoryCalc'

export default function BlogTransformerViz() {
  return (
    <BlogPostLayout slug="transformer-visualization" intro={
      <p>
        An interactive causal decoder-only transformer you can poke at. Switch between
        sinusoidal and RoPE position encodings, compare multi-head vs grouped-query
        attention, watch a Mixture of Experts router send each token to a different pair of
        experts, and see how temperature and different sampling strategies carve up the
        output distribution. Click any module in the architecture diagram to expand it.
      </p>
    }>
      {/* Visualizer */}
      <TransformerViz />

      {/* KV Cache */}
      <div className="mt-16 pt-10 border-t" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-bright)' }}>KV Cache</h2>
        <div className="space-y-4 max-w-2xl">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
            At each generation step, self-attention needs the K and V vectors for every token
            that came before. Without caching, you recompute them all from scratch on every
            step, so generating token 512 recomputes K and V for tokens 0 through 511. That
            is quadratic in the number of generated tokens.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
            The KV cache avoids this by storing K and V from every previous step. When
            generating token t+1, you compute Q, K, V only for the new token, append the
            new K and V to the cache, and attend over the full cached sequence. The
            projections and FFN now cost the same at every step; only the attention dot
            products still grow linearly with the cache length. The trade-off is memory:
            the cache grows by one row per layer per step, so longer contexts cost more VRAM.
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
          <p className="text-sm font-medium mt-2" style={{ color: 'var(--text-bright)' }}>What is actually quadratic</p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
            "Attention is O(n²)" covers three different problems that have three different
            answers, and it is worth keeping them apart:
          </p>
          <ul className="space-y-2 text-sm leading-relaxed list-disc pl-5" style={{ color: 'var(--text)' }}>
            <li>
              <span style={{ color: 'var(--text-bright)' }}>Recomputing K and V every step.</span>{' '}
              Quadratic total work across a generation, and exactly what the KV cache removes.
            </li>
            <li>
              <span style={{ color: 'var(--text-bright)' }}>Storing the score matrix.</span>{' '}
              Naive attention materializes a seq_len × seq_len matrix per head, so doubling the
              context quadruples that memory. FlashAttention never writes it out: it walks the
              sequence in tiles that fit in on-chip SRAM, keeps a running softmax normalizer,
              and recomputes the tile it needs during the backward pass. Memory becomes linear
              in sequence length and the kernel gets faster, because the bottleneck was moving
              bytes to and from HBM rather than the math itself.
            </li>
            <li>
              <span style={{ color: 'var(--text-bright)' }}>The attention FLOPs.</span>{' '}
              Still O(n²), and nothing above changes that. Every query still attends to every
              earlier key. Getting below quadratic compute means changing the model: a sliding
              window, sparse attention, or a linear-attention hybrid such as Mamba or Gated
              DeltaNet, where most layers carry a fixed-size recurrent state and only a few keep
              full attention.
            </li>
            <li>
              <span style={{ color: 'var(--text-bright)' }}>The KV cache itself.</span>{' '}
              Linear in context length, but a naive allocator wastes most of what it reserves.
              That is what PagedAttention fixes.
            </li>
          </ul>
          <p className="text-sm font-medium mt-2" style={{ color: 'var(--text-bright)' }}>PagedAttention</p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
            Early serving stacks gave each sequence one contiguous KV buffer, sized for the
            longest output it might produce. A request that could generate 2K tokens but stopped
            at 100 held the rest of that buffer anyway, and the leftover gaps between buffers
            were too small to reuse. The vLLM paper measured 60% to 80% of KV memory lost this way.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
            PagedAttention borrows the idea behind virtual memory. The cache is cut into
            fixed-size blocks of a few tokens each, a sequence's blocks can sit anywhere in
            memory, and a per-sequence block table maps logical positions to physical blocks.
            The attention kernel reads through that table instead of assuming one flat array.
            Waste drops to a few percent, and the memory you get back turns directly into more
            concurrent sequences, which is throughput. Blocks can also be shared: several samples
            of the same prompt, or many requests behind one system prompt, can point at the same
            physical blocks and copy on write only when they diverge.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
            The two are complementary and both are standard now. FlashAttention makes computing
            attention over a long context possible; PagedAttention makes storing many of those
            contexts at once affordable.
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
          diagram above. Switch presets to see real numbers. BF16 weights throughout;
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
    </BlogPostLayout>
  )
}
