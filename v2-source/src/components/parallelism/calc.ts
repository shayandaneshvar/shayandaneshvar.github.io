// Memory, time and validity model for 5D parallelism (DP, TP, PP, CP, EP).
// Pure functions, no React. Every number the UI shows comes from here.

// ─── Models ──────────────────────────────────────────────────────────────────
// Values from each model's Hugging Face config.json.

export interface ModelCfg {
  id: string
  name: string
  layers: number
  hidden: number
  heads: number
  kvHeads: number
  headDim: number
  intermediate: number              // dense FFN width (0 for MoE)
  vocab: number
  tied: boolean                     // input embedding shared with LM head
  moe?: { experts: number; topK: number; expertInter: number }
  maxContext: number                // native context without RoPE scaling
}

export const MODELS: ModelCfg[] = [
  { id: 'qwen3-8b', name: 'Qwen3 8B', layers: 36, hidden: 4096, heads: 32, kvHeads: 8, headDim: 128,
    intermediate: 12288, vocab: 151936, tied: false, maxContext: 32768 },
  { id: 'qwen3-14b', name: 'Qwen3 14B', layers: 40, hidden: 5120, heads: 40, kvHeads: 8, headDim: 128,
    intermediate: 17408, vocab: 151936, tied: false, maxContext: 32768 },
  { id: 'qwen3-32b', name: 'Qwen3 32B', layers: 64, hidden: 5120, heads: 64, kvHeads: 8, headDim: 128,
    intermediate: 25600, vocab: 151936, tied: false, maxContext: 32768 },
  { id: 'llama31-70b', name: 'Llama 3.1 70B', layers: 80, hidden: 8192, heads: 64, kvHeads: 8, headDim: 128,
    intermediate: 28672, vocab: 128256, tied: false, maxContext: 131072 },
  { id: 'qwen3-30b-a3b', name: 'Qwen3 30B-A3B', layers: 48, hidden: 2048, heads: 32, kvHeads: 4, headDim: 128,
    intermediate: 0, vocab: 151936, tied: false, maxContext: 32768,
    moe: { experts: 128, topK: 8, expertInter: 768 } },
  { id: 'qwen3-235b-a22b', name: 'Qwen3 235B-A22B', layers: 94, hidden: 4096, heads: 64, kvHeads: 4, headDim: 128,
    intermediate: 0, vocab: 151936, tied: false, maxContext: 32768,
    moe: { experts: 128, topK: 8, expertInter: 1536 } },
]

export interface ModelStats {
  qDim: number; kvDim: number
  attn: number                       // attention params per layer
  denseMlp: number                   // dense FFN params per layer
  expertEach: number                 // params of one expert
  router: number
  embed: number                      // vocab × hidden
  total: number; active: number
  flopParams: number                 // params that do matmuls per token (active, LM head, no lookup)
  kvBytesPerToken: number            // BF16, whole model
}

export function modelStats(m: ModelCfg): ModelStats {
  const qDim = m.heads * m.headDim
  const kvDim = m.kvHeads * m.headDim
  const attn = 2 * m.hidden * qDim + 2 * m.hidden * kvDim
  const denseMlp = 3 * m.hidden * m.intermediate                  // SwiGLU: gate, up, down
  const expertEach = m.moe ? 3 * m.hidden * m.moe.expertInter : 0
  const router = m.moe ? m.hidden * m.moe.experts : 0
  const mlpTotal = m.moe ? m.moe.experts * expertEach + router : denseMlp
  const mlpActive = m.moe ? m.moe.topK * expertEach + router : denseMlp
  const embed = m.vocab * m.hidden
  const embCopies = m.tied ? 1 : 2
  return {
    qDim, kvDim, attn, denseMlp, expertEach, router, embed,
    total: m.layers * (attn + mlpTotal) + embed * embCopies,
    active: m.layers * (attn + mlpActive) + embed * embCopies,
    flopParams: m.layers * (attn + mlpActive) + embed,
    kvBytesPerToken: m.layers * 2 * kvDim * 2,
  }
}

// ─── Hardware ────────────────────────────────────────────────────────────────
// Dense BF16 peak, HBM bandwidth, and per-device one-direction link bandwidth inside a
// node (NVLink / HCCS) and across nodes (NIC). Ascend figures are approximate public numbers.

export interface Hardware {
  id: string; name: string
  memGB: number; tflops: number; hbmTBs: number
  intraGBs: number; interGBs: number
  approx?: boolean
}

export const HARDWARE: Hardware[] = [
  { id: 'h100', name: 'H100 80GB', memGB: 80, tflops: 989, hbmTBs: 3.35, intraGBs: 450, interGBs: 50 },
  { id: 'h200', name: 'H200 141GB', memGB: 141, tflops: 989, hbmTBs: 4.8, intraGBs: 450, interGBs: 50 },
  { id: 'b200', name: 'B200 180GB', memGB: 180, tflops: 2250, hbmTBs: 8, intraGBs: 900, interGBs: 50 },
  { id: 'a100', name: 'A100 80GB', memGB: 80, tflops: 312, hbmTBs: 2.0, intraGBs: 300, interGBs: 25 },
  { id: '910b', name: 'Ascend 910B 64GB', memGB: 64, tflops: 320, hbmTBs: 1.6, intraGBs: 196, interGBs: 25, approx: true },
]

// Advertised capacities ("80GB") are GiB, which is what nvidia-smi and torch report, so an
// 80GB H100 really addresses about 85.9 GB in the decimal units used everywhere else here.
export const BYTES_PER_GIB = 1024 ** 3
// Same idea as vLLM's --gpu-memory-utilization default: the rest goes to fragmentation,
// communication buffers and the runtime.
export const USABLE_FRACTION = 0.9

// ─── Validity checks ─────────────────────────────────────────────────────────

export interface Check {
  ok: boolean
  hard: boolean                         // hard = config is invalid when it fails; soft = a warning
  label: string
}

const check = (ok: boolean, label: string, hard = true): Check => ({ ok, hard, label })

function headChecks(m: ModelCfg, tp: number, nodeSize: number): Check[] {
  return [
    check(m.heads % tp === 0, `TP ${tp} divides the ${m.heads} query heads`),
    check(m.kvHeads % tp === 0 || tp % m.kvHeads === 0,
      m.kvHeads >= tp
        ? `TP ${tp} divides the ${m.kvHeads} KV heads`
        : `TP ${tp} > ${m.kvHeads} KV heads: each KV head is replicated ${tp / m.kvHeads}×`,
      true),
    check(tp <= nodeSize, `TP ${tp} stays inside one ${nodeSize}-device node`),
  ]
}

// ─── Training ────────────────────────────────────────────────────────────────

export interface TrainSettings {
  seqLen: number
  globalBatch: number                   // sequences per optimizer step
  microBatch: number
  zero: 0 | 1 | 2 | 3
  recompute: 'none' | 'full'
  mfu: number                           // 0..1
}

export interface TrainPar { tp: number; pp: number; cp: number; ep: number; dp: number }

export interface MemBreakdown {
  weights: number; grads: number; optimizer: number; activations: number; logits: number; total: number
}

export interface TrainResult {
  par: TrainPar
  devices: number; nodes: number
  microBatches: number                  // gradient accumulation steps per DP rank
  bubble: number                        // pipeline idle fraction
  mem: MemBreakdown                     // busiest pipeline stage
  busiestStage: string
  usable: number
  stepTime: number                      // seconds
  tokensPerStep: number
  tokensPerSec: number
  tokensPerSecPerDevice: number
  hoursPer10B: number
  checks: Check[]
  valid: boolean
}

function trainStageMemory(
  m: ModelCfg, st: ModelStats, s: TrainSettings, p: TrainPar,
  stage: 'first' | 'last' | 'only', microBatches: number,
): MemBreakdown {
  const layersHere = Math.ceil(m.layers / p.pp)

  // Parameters held by one device of this stage.
  const kvPerDev = m.kvHeads >= p.tp ? m.kvHeads / p.tp : 1
  const attnDev = 2 * m.hidden * st.qDim / p.tp + 2 * m.hidden * kvPerDev * m.headDim
  const denseLayer = attnDev + (m.moe ? st.router : st.denseMlp / p.tp)
  // MoE "parallel folding": expert layers re-partition the same TP×CP×DP ranks into EP
  // groups (expert TP = 1), so each device holds experts / EP whole experts.
  const expertLayer = m.moe ? (m.moe.experts / p.ep) * st.expertEach : 0
  const embShard = st.embed / p.tp                                // vocab-parallel
  const embCopies = stage === 'only' ? (m.tied ? 1 : 2) : 1
  const denseParams = layersHere * denseLayer + embShard * embCopies
  const expertParams = layersHere * expertLayer

  // ZeRO shards across the replicas of each parameter: DP×CP for dense weights,
  // expert-DP = TP×CP×DP / EP for experts.
  const dpGroup = p.dp * p.cp
  const edpGroup = (p.tp * p.cp * p.dp) / p.ep
  const params = (sharded: boolean) =>
    sharded ? denseParams / dpGroup + expertParams / edpGroup : denseParams + expertParams

  const weights = 2 * params(s.zero >= 3)                         // BF16
  const grads = 2 * params(s.zero >= 2)                           // BF16
  const optimizer = 12 * params(s.zero >= 1)                      // FP32 master + Adam m + v

  // Activations saved for backward, bytes per token per layer (BF16, FlashAttention,
  // no dropout). Sequence parallel shards everything by TP, CP shards the sequence.
  const h = m.hidden
  const attnAct = 4 * h + 2 * (st.qDim + 2 * st.kvDim) + 2 * st.qDim
  const mlpAct = m.moe
    ? 4 * h + 2 * m.moe.topK * h + 8 * m.moe.topK * m.moe.expertInter + 4 * m.moe.experts
    : 4 * h + 8 * m.intermediate
  const perTokLayer = attnAct + mlpAct
  const tokensDev = s.microBatch * s.seqLen / (p.tp * p.cp)
  // 1F1B: the first stage holds activations for up to PP micro-batches at once.
  const inFlight = stage === 'first' ? Math.min(p.pp, microBatches) : 1
  const activations = s.recompute === 'none'
    ? inFlight * layersHere * tokensDev * perTokLayer
    : inFlight * layersHere * tokensDev * 2 * h + tokensDev * perTokLayer

  // Logits (BF16) plus FP32 softmax/grad for the loss, vocab-parallel over TP.
  const logits = stage === 'first' ? 0 : (s.microBatch * s.seqLen / p.cp) * (m.vocab / p.tp) * 6

  return { weights, grads, optimizer, activations, logits,
    total: weights + grads + optimizer + activations + logits }
}

export function computeTrain(
  m: ModelCfg, hw: Hardware, nodeSize: number, s: TrainSettings, p: TrainPar,
): TrainResult {
  const st = modelStats(m)
  const devices = p.tp * p.pp * p.cp * p.dp
  const nodes = Math.ceil(devices / nodeSize)
  const microBatches = Math.max(1, Math.floor(s.globalBatch / (p.dp * s.microBatch)))

  let mem: MemBreakdown
  let busiestStage: string
  if (p.pp === 1) {
    mem = trainStageMemory(m, st, s, p, 'only', microBatches)
    busiestStage = 'single stage'
  } else {
    const first = trainStageMemory(m, st, s, p, 'first', microBatches)
    const last = trainStageMemory(m, st, s, p, 'last', microBatches)
    const firstBusier = first.total >= last.total
    mem = firstBusier ? first : last
    busiestStage = firstBusier ? `first stage (holds ${Math.min(p.pp, microBatches)} micro-batches)` : 'last stage (LM head + logits)'
  }
  const usable = hw.memGB * BYTES_PER_GIB * USABLE_FRACTION

  // FLOPs: 6 × params per token, plus causal attention (average context seq/2).
  const tokensPerStep = s.globalBatch * s.seqLen
  let flopsPerToken = 6 * st.flopParams + 6 * m.layers * s.seqLen * st.qDim
  if (s.recompute === 'full') flopsPerToken *= 4 / 3                // one extra forward
  const bubble = (p.pp - 1) / (microBatches + p.pp - 1)
  const computeTime = tokensPerStep * flopsPerToken / (devices * hw.tflops * 1e12 * s.mfu)
  const stepTime = computeTime / (1 - bubble)
  const tokensPerSec = tokensPerStep / stepTime

  const checks: Check[] = [...headChecks(m, p.tp, nodeSize)]
  checks.push(check(p.pp <= m.layers, `PP ${p.pp} ≤ ${m.layers} layers`))
  if (p.pp > 1 && p.pp <= m.layers) {
    checks.push(check(m.layers % p.pp === 0,
      m.layers % p.pp === 0
        ? `${m.layers} layers split evenly into ${p.pp} stages of ${m.layers / p.pp}`
        : `${m.layers} layers do not split evenly over PP ${p.pp} (uneven stages, up to ${Math.ceil(m.layers / p.pp)} layers)`,
      false))
  }
  checks.push(check(s.seqLen % (2 * p.cp) === 0,
    `sequence ${s.seqLen} splits into ${2 * p.cp} equal chunks for load-balanced CP ${p.cp}`))
  if (m.moe) {
    checks.push(check(m.moe.experts % p.ep === 0, `${m.moe.experts} experts divide evenly over EP ${p.ep}`))
    checks.push(check((p.tp * p.cp * p.dp) % p.ep === 0,
      `EP ${p.ep} folds into the TP×CP×DP = ${p.tp * p.cp * p.dp} ranks of each stage`))
  } else {
    checks.push(check(p.ep === 1, 'EP only applies to MoE models (EP = 1)'))
  }
  checks.push(check(s.globalBatch % (p.dp * s.microBatch) === 0,
    `global batch ${s.globalBatch} = DP ${p.dp} × micro-batch ${s.microBatch} × ${microBatches} accumulation steps`))
  checks.push(check(mem.total <= usable,
    `busiest device needs ${fmtBytes(mem.total)} of ${fmtBytes(usable)} usable (${Math.round(USABLE_FRACTION * 100)}% of ${hw.memGB} GB)`))
  checks.push(check(s.seqLen <= m.maxContext,
    `sequence ${s.seqLen} ≤ native context ${m.maxContext}`, false))
  if (devices > nodeSize) {
    checks.push(check(devices % nodeSize === 0, `${devices} devices fill whole ${nodeSize}-device nodes`, false))
  }
  if (p.pp > 1) {
    checks.push(check(bubble <= 0.1, `pipeline bubble ${(bubble * 100).toFixed(1)}% (more micro-batches shrink it)`, false))
  }

  return {
    par: p, devices, nodes, microBatches, bubble, mem, busiestStage, usable,
    stepTime, tokensPerStep, tokensPerSec, tokensPerSecPerDevice: tokensPerSec / devices,
    hoursPer10B: 10e9 / tokensPerSec / 3600,
    checks, valid: checks.every(c => c.ok || !c.hard),
  }
}

export function searchTrain(
  m: ModelCfg, hw: Hardware, nodeSize: number, s: TrainSettings, maxDevices = 1024,
): TrainResult[] {
  const pow2 = [1, 2, 4, 8, 16]
  const eps = m.moe ? [1, 2, 4, 8, 16, 32, 64].filter(e => m.moe!.experts % e === 0) : [1]
  const dps = Array.from({ length: 128 }, (_, i) => i + 1)
    .filter(dp => s.globalBatch % (dp * s.microBatch) === 0)
  const out: TrainResult[] = []
  // Cheap structural filters first; computeTrain (with its labelled checks) only runs
  // on combinations that can possibly be valid.
  for (const tp of pow2.filter(t => t <= nodeSize && m.heads % t === 0
    && (m.kvHeads % t === 0 || t % m.kvHeads === 0)))
    for (const pp of pow2.filter(x => x <= m.layers))
      for (const cp of [1, 2, 4, 8].filter(c => s.seqLen % (2 * c) === 0))
        for (const ep of eps)
          for (const dp of dps) {
            if (tp * pp * cp * dp > maxDevices) break
            if ((tp * cp * dp) % ep !== 0) continue
            const r = computeTrain(m, hw, nodeSize, s, { tp, pp, cp, ep, dp })
            if (r.valid) out.push(r)
          }
  return out
}

// ─── Inference ───────────────────────────────────────────────────────────────

export interface InferSettings {
  prompt: number                        // context tokens per request
  output: number                        // generated tokens per request
  batch: number                         // concurrent sequences per engine
  wDtype: 'bf16' | 'fp8'
  kvDtype: 'bf16' | 'fp8'
}

// dp = engine replicas. For MoE with ep on, the DP ranks share one expert pool
// (DP attention + EP = TP×DP, the DeepSeek-style serving layout) instead of each
// replica holding every expert.
export interface InferPar { tp: number; pp: number; dp: number; ep: boolean }

export interface InferPoint { batch: number; tpot: number; perUser: number; perDevice: number }

export interface InferResult {
  par: InferPar
  devices: number; nodes: number
  groupDevices: number                  // devices that serve one batch together
  mem: { weights: number; kv: number; reserve: number; total: number }
  usable: number
  kvPerTokenDev: number
  maxSeqs: number                       // KV-limited concurrent sequences per engine
  ttft: number; tpot: number; e2e: number   // seconds
  perUser: number                       // tokens/s one request sees
  perDevice: number                     // output tokens/s per device
  total: number                         // output tokens/s, whole deployment
  sweep: InferPoint[]
  checks: Check[]
  valid: boolean
}

const ALPHA_INTRA = 10e-6               // per-collective latency, seconds
const ALPHA_INTER = 25e-6
const HBM_EFF = 0.8                     // achievable fraction of HBM bandwidth
const DECODE_MFU = 0.5
const PREFILL_MFU = 0.5

export function computeInfer(
  m: ModelCfg, hw: Hardware, nodeSize: number, s: InferSettings, p: InferPar,
): InferResult {
  const st = modelStats(m)
  const h = m.hidden
  const wb = s.wDtype === 'fp8' ? 1 : 2
  const kvb = s.kvDtype === 'fp8' ? 1 : 2
  const ep = !!m.moe && p.ep
  const layersHere = Math.ceil(m.layers / p.pp)
  const kvPerDev = m.kvHeads >= p.tp ? m.kvHeads / p.tp : 1

  // Weights on the busiest stage (last stage also has the LM head).
  const attnDev = 2 * h * st.qDim / p.tp + 2 * h * kvPerDev * m.headDim
  const expertDev = m.moe ? m.moe.experts * st.expertEach / (ep ? p.tp * p.dp : p.tp) : 0
  const mlpDev = m.moe ? st.router + expertDev : st.denseMlp / p.tp
  const embDev = st.embed / p.tp * (p.pp === 1 ? (m.tied ? 1 : 2) : 1)
  const weights = (layersHere * (attnDev + mlpDev) + embDev) * wb

  const kvPerTokenDev = layersHere * 2 * kvPerDev * m.headDim * kvb
  const reserve = 2e9 + s.batch * m.vocab * 4                     // runtime, graphs, FP32 logits
  const usable = hw.memGB * BYTES_PER_GIB * USABLE_FRACTION
  const seqTokens = s.prompt + s.output
  const kvBudget = usable - weights - reserve
  const maxSeqs = Math.max(0, Math.floor(kvBudget / (kvPerTokenDev * seqTokens)))
  const kv = s.batch * seqTokens * kvPerTokenDev

  const tpLink = (p.tp <= nodeSize ? hw.intraGBs : hw.interGBs) * 1e9
  const tpAlpha = p.tp <= nodeSize ? ALPHA_INTRA : ALPHA_INTER
  const epSpan = p.tp * p.dp
  const epLink = (epSpan <= nodeSize ? hw.intraGBs : hw.interGBs) * 1e9
  const epAlpha = epSpan <= nodeSize ? ALPHA_INTRA : ALPHA_INTER
  const ppCross = p.tp * p.pp > nodeSize
  const ctxAvg = s.prompt + s.output / 2

  // One decode step on one pipeline stage for b sequences per engine rank.
  const stageTime = (b: number) => {
    const denseBytes = (layersHere * (attnDev + (m.moe ? st.router : mlpDev)) + st.embed / p.tp) * wb
    let expertBytes = 0
    if (m.moe) {
      const tokens = ep ? b * p.dp : b
      const touched = 1 - Math.pow(1 - m.moe.topK / m.moe.experts, tokens)
      expertBytes = layersHere * expertDev * wb * touched
    }
    const bytes = denseBytes + expertBytes + b * ctxAvg * kvPerTokenDev
    const memT = bytes / (hw.hbmTBs * 1e12 * HBM_EFF)
    const mlpActive = m.moe ? m.moe.topK * st.expertEach : st.denseMlp
    const flops = 2 * b * (layersHere * (st.attn + mlpActive) + st.embed) / p.tp
      + 4 * b * ctxAvg * (st.qDim / p.tp) * layersHere
    const compT = flops / (hw.tflops * 1e12 * DECODE_MFU)
    let comm = 0
    // With EP the MoE layer's all-reduce is replaced by all-to-all dispatch + combine.
    if (p.tp > 1) comm += (ep ? 1 : 2) * layersHere * (tpAlpha + 2 * (p.tp - 1) / p.tp * b * h * 2 / tpLink)
    if (ep && epSpan > 1) comm += 2 * layersHere * (epAlpha + b * m.moe!.topK * h * 2 / epLink)
    return Math.max(memT, compT) + comm
  }
  // PP splits the batch into PP micro-batches that flow through the stages; a token
  // still visits every stage in turn, so PP adds capacity, not speed.
  const tpotFor = (b: number) => {
    const micro = Math.max(1, Math.ceil(b / p.pp))
    const p2p = p.pp > 1
      ? (ppCross ? ALPHA_INTER : ALPHA_INTRA) + micro * h * 2 / ((ppCross ? hw.interGBs : hw.intraGBs) * 1e9)
      : 0
    return p.pp * (stageTime(micro) + p2p)
  }
  const groupDevices = p.tp * p.pp * (ep ? p.dp : 1)
  const seqsPerGroup = (b: number) => (ep ? b * p.dp : b)
  const devices = p.tp * p.pp * p.dp

  const point = (b: number): InferPoint => {
    const tpot = tpotFor(b)
    return { batch: b, tpot, perUser: 1 / tpot, perDevice: seqsPerGroup(b) / tpot / groupDevices }
  }

  // Prefill is compute bound: a single prompt runs through all stages in sequence.
  const prefillFlops = s.prompt * (2 * st.flopParams + 2 * s.prompt * st.qDim * m.layers)
  let ttft = prefillFlops / (p.tp * hw.tflops * 1e12 * PREFILL_MFU)
  if (p.tp > 1) ttft += 2 * m.layers * (tpAlpha + 2 * (p.tp - 1) / p.tp * s.prompt * h * 2 / tpLink)

  const cur = point(Math.max(1, s.batch))
  const sweepBatches = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048].filter(b => b <= maxSeqs)
  if (maxSeqs >= 1 && !sweepBatches.includes(maxSeqs)) sweepBatches.push(maxSeqs)
  const sweep = sweepBatches.map(point)

  const checks: Check[] = [...headChecks(m, p.tp, nodeSize)]
  checks.push(check(p.pp <= m.layers, `PP ${p.pp} ≤ ${m.layers} layers`))
  if (m.moe && ep) {
    checks.push(check(m.moe.experts % epSpan === 0,
      `${m.moe.experts} experts divide evenly over EP = TP×DP = ${epSpan}`))
  }
  checks.push(check(maxSeqs >= 1,
    maxSeqs >= 1
      ? `weights (${fmtBytes(weights)}) leave room for ${maxSeqs} sequence${maxSeqs > 1 ? 's' : ''} of ${seqTokens.toLocaleString()} tokens`
      : `weights (${fmtBytes(weights)}) + one ${seqTokens.toLocaleString()}-token sequence do not fit in ${fmtBytes(usable)}`))
  checks.push(check(s.batch <= maxSeqs,
    `${s.batch} concurrent sequences fit in the KV cache (max ${maxSeqs}); beyond that requests queue or get preempted`))
  checks.push(check(seqTokens <= m.maxContext,
    `${seqTokens.toLocaleString()} tokens ≤ native context ${m.maxContext.toLocaleString()}`, false))
  if (devices > nodeSize) {
    checks.push(check(devices % nodeSize === 0, `${devices} devices fill whole ${nodeSize}-device nodes`, false))
  }

  const mem = { weights, kv, reserve, total: weights + kv + reserve }
  return {
    par: p, devices, nodes: Math.ceil(devices / nodeSize), groupDevices, mem, usable, kvPerTokenDev, maxSeqs,
    ttft, tpot: cur.tpot, e2e: ttft + s.output * cur.tpot,
    perUser: cur.perUser, perDevice: cur.perDevice, total: cur.perDevice * devices,
    sweep, checks, valid: checks.every(c => c.ok || !c.hard),
  }
}

export function searchInfer(m: ModelCfg, hw: Hardware, nodeSize: number, s: InferSettings): InferResult[] {
  const out: InferResult[] = []
  for (const tp of [1, 2, 4, 8, 16].filter(t => t <= nodeSize))
    for (const pp of [1, 2, 4, 8].filter(x => x <= m.layers))
      for (const ep of m.moe ? [false, true] : [false])
        // DP only changes per-device numbers when EP shares experts across DP ranks.
        for (const dp of ep ? [1, 2, 4, 8].filter(d => tp * d > 1 && tp * pp * d <= 64) : [1]) {
          const r = computeInfer(m, hw, nodeSize, s, { tp, pp, dp, ep })
          if (r.valid) out.push(r)
        }
  return out
}

// ─── Formatting ──────────────────────────────────────────────────────────────

export function fmtBytes(b: number): string {
  if (b < 1e6) return `${(b / 1e3).toFixed(0)} KB`
  if (b < 1e9) return `${(b / 1e6).toFixed(0)} MB`
  if (b < 1e12) return `${(b / 1e9).toFixed(1)} GB`
  return `${(b / 1e12).toFixed(2)} TB`
}

export function fmtParams(n: number): string {
  return n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : `${(n / 1e6).toFixed(0)}M`
}

export function fmtTime(sec: number): string {
  if (sec < 1e-3) return `${(sec * 1e6).toFixed(0)} µs`
  if (sec < 1) return `${(sec * 1e3).toFixed(sec < 0.01 ? 2 : 1)} ms`
  if (sec < 120) return `${sec.toFixed(2)} s`
  if (sec < 7200) return `${(sec / 60).toFixed(1)} min`
  return `${(sec / 3600).toFixed(1)} h`
}

export function fmtRate(x: number): string {
  if (x >= 1e6) return `${(x / 1e6).toFixed(2)}M`
  if (x >= 1e4) return `${(x / 1e3).toFixed(1)}K`
  if (x >= 100) return x.toFixed(0)
  return x.toFixed(1)
}
