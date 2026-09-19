import BlogPostLayout from '../components/BlogPostLayout'
import ParallelismLab from '../components/parallelism/ParallelismLab'

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-bright)' }}>{children}</h2>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{children}</p>
}

function Em({ children }: { children: React.ReactNode }) {
  return <span style={{ color: 'var(--text-bright)' }}>{children}</span>
}

function Section({ children, first }: { children: React.ReactNode; first?: boolean }) {
  return (
    <section className={`${first ? 'mt-4' : 'mt-16'} pt-10 border-t`} style={{ borderColor: 'var(--border)' }}>
      {children}
    </section>
  )
}

function DimCard({ tag, name, rows }: { tag: string; name: string; rows: [string, React.ReactNode][] }) {
  return (
    <div className="rounded-lg border p-5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
      <div className="flex items-baseline gap-3 mb-4">
        <span className="font-mono text-sm font-bold px-2 py-0.5 rounded" style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-10)' }}>{tag}</span>
        <h3 className="font-semibold" style={{ color: 'var(--text-bright)' }}>{name}</h3>
      </div>
      <dl className="space-y-3">
        {rows.map(([k, v]) => (
          <div key={k} className="grid sm:grid-cols-[7.5rem_1fr] gap-1 sm:gap-3">
            <dt className="font-mono text-xs pt-0.5" style={{ color: 'var(--text-muted)' }}>{k}</dt>
            <dd className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export default function BlogParallelism() {
  return (
    <BlogPostLayout slug="5d-parallelism" intro={
      <p>
        Past a few billion parameters, neither training nor serving fits on one accelerator, and
        there are five different ways to split the work: data, tensor, pipeline, context and
        expert parallelism. This post covers what each one splits, what it has to communicate,
        and where in the cluster it belongs. Then you can plan a real run: pick Qwen3 14B, 32B
        or a MoE model, your GPU or NPU, and how many sit in a node. The planner lists the valid
        layouts, how many devices you need, the memory on each, the training step time, and the
        throughput vs latency trade-off for serving.
      </p>
    }>
      <div className="max-w-3xl space-y-4">
        <Section first>
          <H2>Why one device is not enough</H2>
          <div className="space-y-4">
            <P>
              Training with AdamW in mixed precision keeps five things per parameter: BF16 weights
              (2 bytes), BF16 gradients (2), an FP32 master copy (4) and Adam's two FP32 moments
              (4 + 4). That is <Em>16 bytes per parameter</Em> before a single activation is stored.
              Qwen3 32B has 32.8B parameters, so that's 524 GB. One H100 has 80 GB.
            </P>
            <P>
              Serving is lighter but has its own wall. The BF16 weights of Qwen3 32B are 65.5 GB,
              and every token of context costs 64 layers × 2 (K and V) × 8 KV heads × 128 dims × 2
              bytes = <Em>262 KB of KV cache</Em>. One 32K-token conversation needs another 8.6 GB,
              so a single 80 GB card can hold the weights and almost no users.
            </P>
            <P>
              So the model, its optimizer state, its activations and its KV cache all have to be cut
              up. Each parallel dimension cuts along a different axis and pays for it with a
              different kind of communication.
            </P>
          </div>
        </Section>

        <Section>
          <H2>The five dimensions</H2>
          <div className="space-y-4">
            <DimCard tag="DP" name="Data parallelism" rows={[
              ['Splits', 'The batch. Every rank holds the whole model and processes different sequences.'],
              ['Communicates', 'Gradients, once per optimizer step: an all-reduce that overlaps with the backward pass.'],
              ['Lives', 'Anywhere, including across nodes. It tolerates slow links best, which makes it the way you scale out.'],
              ['Watch out', <>Plain DP copies all 16 bytes per parameter onto every rank. <Em>ZeRO-1</Em> shards the
                optimizer state across DP ranks, <Em>ZeRO-2</Em> also the gradients, <Em>ZeRO-3</Em> (FSDP) the weights
                too, at the cost of gathering each layer's weights right before using it. The global batch must equal
                DP × micro-batch × gradient accumulation steps.</>],
            ]} />
            <DimCard tag="TP" name="Tensor parallelism" rows={[
              ['Splits', <>Every weight matrix. In the Megatron scheme, the Q/K/V and gate/up projections are split by
                columns (whole heads, FFN channels) and the output and down projections by rows, so each rank computes a
                slice of every layer.</>],
              ['Communicates', <>Activations, inside every layer: two collectives in the forward pass and two in the
                backward, and the next matmul cannot start until they finish.</>],
              ['Lives', 'Inside a node, on NVLink or HCCS. Stretching TP across the network usually costs more than it saves.'],
              ['Watch out', <>TP has to divide the number of attention heads. With grouped-query attention, once TP
                exceeds the number of KV heads (8 on dense Qwen3, 4 on Qwen3 MoE), each KV head gets replicated, so the
                KV cache per device stops shrinking.</>],
            ]} />
            <DimCard tag="PP" name="Pipeline parallelism" rows={[
              ['Splits', 'Layers into stages. Qwen3 32B at PP 4 puts 16 layers on each stage.'],
              ['Communicates', 'Only hidden states at stage boundaries, point to point. The cheapest traffic of the five.'],
              ['Lives', 'Across nodes, happily.'],
              ['Watch out', <>The bubble. With m micro-batches and p stages, a fraction (p − 1) / (m + p − 1) of each
                step is idle, so PP needs many micro-batches per step. Under the usual 1F1B schedule the first stage also
                keeps activations for p micro-batches at once, which is why it tends to be the device that runs out of
                memory. Layer counts that don't divide evenly (94 for Qwen3 235B) give uneven stages.</>],
            ]} />
            <DimCard tag="CP" name="Context (and sequence) parallelism" rows={[
              ['Splits', 'The sequence, in every layer, attention included.'],
              ['Communicates', 'Key and value blocks, passed around a ring inside attention while each rank computes on the block it already has.'],
              ['Lives', 'Preferably in a node, but the overlap with compute makes cross-node CP workable for long sequences.'],
              ['Watch out', <>Only worth it when activations, not weights, are the problem, which means long context.
                The sequence has to split into 2 × CP equal chunks (see below).</>],
            ]} />
            <DimCard tag="EP" name="Expert parallelism" rows={[
              ['Splits', 'The experts of MoE layers. Qwen3 235B has 128 experts per layer; at EP 64 each device holds 2.'],
              ['Communicates', <>Tokens. Before each MoE layer an all-to-all sends every token to the devices holding its
                top-8 experts, and a second all-to-all brings the results back.</>],
              ['Lives', 'Ideally inside a node or a fast scale-up domain. All-to-all is the most network-sensitive collective here.'],
              ['Watch out', 'EP does not add devices of its own (see folding, below). Router imbalance turns directly into idle devices.'],
            ]} />
          </div>
        </Section>

        <Section>
          <H2>SP vs CP, and why CP is harder</H2>
          <div className="space-y-4">
            <P>
              The names get mixed up. <Em>Sequence parallelism</Em> in the Megatron sense is a companion
              to TP rather than a dimension of its own. The parts of a layer that TP leaves whole (layer
              norms, residual adds, dropout) are split along the sequence instead, and TP's all-reduce
              becomes a reduce-scatter followed by an all-gather. That moves the same number of bytes,
              but now every activation in the layer is divided by TP. The planner assumes SP whenever TP
              is above 1.
            </P>
            <P>
              <Em>Context parallelism</Em> splits the sequence through the whole layer, and attention is
              the problem: every query needs every earlier key. Ring attention keeps the query chunk in
              place and passes K/V chunks around the CP group, overlapping each transfer with the
              attention math on the chunk that just arrived. The causal mask adds a twist. Cut a
              sequence into CP contiguous pieces and the last rank attends to everything while the first
              attends to almost nothing. So each rank takes two chunks from opposite ends, chunk i and
              chunk 2·CP − 1 − i, which evens out the work.
            </P>
            <P>
              DeepSpeed Ulysses is the other approach. Two all-to-alls around attention switch from
              splitting by sequence to splitting by head, so attention itself runs unsplit on a subset of
              heads. It's simple and fast in a node, but its degree is capped by the number of KV heads.
            </P>
          </div>
        </Section>

        <Section>
          <H2>Putting it together</H2>
          <div className="space-y-4">
            <P>
              The number of devices is <Em>TP × PP × CP × DP</Em>. The order in which ranks get those
              coordinates matters as much as the sizes. Megatron assigns TP fastest, then CP, then DP,
              with PP outermost, so every TP group lands on neighbouring devices of the same node and only
              the cheap pipeline and gradient traffic crosses the network.
            </P>
            <P>
              EP is the odd one out. In Megatron's MoE <Em>parallel folding</Em>, the expert layers reuse
              the TP × CP × DP devices of each pipeline stage and regroup them: attention runs with the
              usual TP/CP/DP split, and the MoE layer on the same devices runs with EP (and expert data
              parallelism). EP therefore has to divide TP × CP × DP, and each expert is replicated
              TP × CP × DP / EP times, which is the group ZeRO shards expert optimizer state across.
            </P>
            <P>A reasonable order of decisions:</P>
            <ol className="list-decimal pl-6 space-y-2 text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              <li>Pick the smallest TP (at most one node) that makes the weights and optimizer state manageable.</li>
              <li>If the model still does not fit, add PP across nodes, or ZeRO-3.</li>
              <li>If long sequences blow up activations, add CP or turn on activation recompute.</li>
              <li>For MoE, pick EP so the experts fit, keeping the all-to-all inside a node if you can.</li>
              <li>Scale DP for throughput, keeping the global batch divisible by DP × micro-batch.</li>
            </ol>
          </div>
        </Section>
      </div>

      <Section>
        <H2>Plan a run</H2>
        <div className="max-w-3xl mb-8">
          <P>
            Choose a model, an accelerator and how many devices share a node. The planner searches every
            combination of TP, PP, CP, EP and DP up to 1,024 devices, keeps the ones that pass every check
            and fit in memory, and loads the smallest. Change any dimension to see what breaks. Switch to
            Inference for serving.
          </P>
        </div>
        <ParallelismLab />
      </Section>

      <div className="max-w-3xl space-y-4">
        <Section>
          <H2>Inference is a different problem</H2>
          <div className="space-y-4">
            <P>
              Training optimizes one number, tokens per second per dollar. Serving has two that pull
              against each other: <Em>time to first token</Em>, set by prefill, which is compute bound,
              and <Em>time per output token</Em>, set by decode, which is memory-bandwidth bound. A
              decode step reads every weight once no matter how many sequences are in the batch, so
              batching is nearly free until reading the KV cache catches up. That's the curve in the
              Inference tab.
            </P>
            <P>The dimensions trade differently at inference time:</P>
            <ul className="list-disc pl-6 space-y-2 text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              <li><Em>TP cuts latency.</Em> Each device reads 1/TP of the weights per token. The price is two
                all-reduces per layer per token, and at small batches their fixed latency adds up.</li>
              <li><Em>PP adds memory, not speed.</Em> More devices means more room for KV cache and bigger
                batches, but a token still visits every stage in turn.</li>
              <li><Em>DP multiplies throughput</Em> with no communication at all, and leaves latency alone.</li>
              <li><Em>EP for MoE</Em> is usually paired with data-parallel attention (the layout DeepSeek
                made popular): attention runs data parallel so the KV cache is never duplicated by TP, while
                the experts are spread across all TP × DP devices so no expert is stored twice.</li>
              <li><Em>CP</Em> appears at inference for very long prompts, splitting prefill across devices to cut
                time to first token. The planner does not model it.</li>
            </ul>
          </div>
        </Section>

        <Section>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-bright)' }}>Assumptions</h2>
          <div className="space-y-4">
            <P>
              Model shapes come from each model's Hugging Face config.json. Hardware figures are dense BF16
              peak and HBM bandwidth from vendor datasheets; the Ascend numbers are approximate public figures.
            </P>
            <P>
              Training: BF16 mixed precision with FP32 master weights and AdamW, so 2 + 2 + 12 bytes per
              parameter before ZeRO sharding. Activations assume FlashAttention (no stored score matrix),
              SwiGLU, no dropout, and sequence parallelism alongside TP. Step time is 6 × active parameters ×
              tokens plus causal attention FLOPs, divided by devices × peak × MFU, then stretched by the
              pipeline bubble. Communication is folded into the MFU figure rather than simulated, so be
              sceptical of layouts that push TP or EP traffic across nodes, and expect MoE runs to reach a
              lower MFU than dense ones. 90% of device memory is treated as usable.
            </P>
            <P>
              Inference: each decode step costs the larger of bytes read / (80% of HBM bandwidth) and FLOPs /
              (50% of peak), plus collective latency. MoE weight reads count only the experts at least one
              token in the batch is routed to. Prefill runs at 50% of peak. No chunked-prefill overlap,
              speculative decoding or prefix caching.
            </P>
            <P>
              Real systems land within tens of percent of numbers like these at best. What the planner is
              good for is comparing layouts and seeing which resource runs out first.
            </P>
          </div>
        </Section>
      </div>
    </BlogPostLayout>
  )
}
