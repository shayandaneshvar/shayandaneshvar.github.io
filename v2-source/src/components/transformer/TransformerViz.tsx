import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import {
  D_MODEL, N_HEADS, N_KV_GQA,
  sinusoidalPE, ropeFreqs, attnWeights,
  makeColors, getSamples,
  type ColorFns, type SampleEntry,
} from './utils'

type PosEncType = 'sinusoidal' | 'rope'
type AttnType = 'mha' | 'gqa'
type SamplingType = 'greedy' | 'topk' | 'topp'
type SelectedModule =
  | null | 'embedding' | 'pos-enc'
  | 'layer1-attn' | 'layer1-ffn'
  | 'layer2-attn' | 'layer2-ffn'
  | 'lm-head' | 'sampling'

// ─── Small helpers ───────────────────────────────────────────────────────────

function RadioGroup<T extends string>({ label, value, onChange, options }: {
  label: string; value: T; onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div>
      <p className="font-mono text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <button key={o.value} onClick={() => onChange(o.value)}
            className="font-mono text-xs px-3 py-1.5 rounded border transition-all duration-150"
            style={value === o.value
              ? { color: 'var(--bg)', backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }
              : { color: 'var(--text)', borderColor: 'var(--border)' }}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Arrow() {
  return (
    <div className="flex justify-center my-1" style={{ color: 'var(--border)' }}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="10" y1="2" x2="10" y2="14" />
        <polyline points="5,10 10,15 15,10" />
      </svg>
    </div>
  )
}

function ModuleBlock({ label, badge, selected, onClick, accent2 }: {
  label: string; badge?: string; selected: boolean
  onClick: () => void; accent2?: boolean
}) {
  const borderCol = accent2 ? '#a78bfa' : 'var(--accent)'
  const bgCol = accent2 ? 'rgba(167,139,250,0.08)' : 'var(--accent-8)'
  return (
    <button onClick={onClick}
      className="w-full text-left rounded border px-4 py-3 transition-all duration-200"
      style={{
        borderColor: selected ? borderCol : 'var(--border)',
        backgroundColor: selected ? bgCol : 'var(--surface)',
      }}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium"
          style={{ color: selected ? borderCol : 'var(--text-bright)' }}>
          {label}
        </span>
        {badge && (
          <span className="font-mono text-xs px-2 py-0.5 rounded"
            style={{ color: borderCol, backgroundColor: selected ? bgCol : 'var(--surface-2)' }}>
            {badge}
          </span>
        )}
      </div>
    </button>
  )
}

function PanelCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-5 space-y-4"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
      <h3 className="font-semibold text-base" style={{ color: 'var(--text-bright)' }}>{title}</h3>
      {children}
    </div>
  )
}

function Info({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{children}</p>
}

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-xs px-4 py-3 rounded border overflow-x-auto"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)', color: 'var(--accent)' }}>
      {children}
    </div>
  )
}

// ─── Heatmap SVG ─────────────────────────────────────────────────────────────

function PEHeatmap({ data, rowLabels, colorFn }: {
  data: number[][]; rowLabels: string[]; colorFn: (v: number) => string
}) {
  const cols = data[0]?.length ?? 0
  const cW = 13; const cH = 18; const lW = 52
  const svgW = lW + cols * cW
  const svgH = data.length * cH
  return (
    <svg width={svgW} height={svgH} style={{ display: 'block' }}>
      {rowLabels.map((lbl, i) => (
        <text key={i} x={lW - 5} y={i * cH + cH * 0.75}
          textAnchor="end" fontSize={10} fill="var(--text-muted)">{lbl}</text>
      ))}
      {data.map((row, i) => row.map((val, j) => (
        <rect key={`${i}-${j}`}
          x={lW + j * cW} y={i * cH}
          width={cW - 1} height={cH - 1}
          fill={colorFn(val)} rx={1} />
      )))}
    </svg>
  )
}

function AttnHeatmap({ weights, tokens, colorFn }: {
  weights: number[][]; tokens: string[]; colorFn: (v: number) => string
}) {
  const n = tokens.length
  const cs = Math.min(46, Math.floor(260 / Math.max(n, 1)))
  const lW = 38; const lH = 22
  return (
    <svg width={lW + n * cs} height={lH + n * cs} style={{ display: 'block' }}>
      {tokens.map((t, j) => (
        <text key={j} x={lW + j * cs + cs / 2} y={lH - 5}
          textAnchor="middle" fontSize={9} fill="var(--text-muted)">
          {t.slice(0, 4)}
        </text>
      ))}
      {tokens.map((t, i) => (
        <text key={i} x={lW - 4} y={lH + i * cs + cs / 2 + 4}
          textAnchor="end" fontSize={9} fill="var(--text-muted)">
          {t.slice(0, 4)}
        </text>
      ))}
      {weights.map((row, i) => row.map((w, j) => (
        <rect key={`${i}-${j}`}
          x={lW + j * cs} y={lH + i * cs}
          width={cs - 1} height={cs - 1}
          fill={colorFn(w)} rx={2} />
      )))}
      {weights.map((row, i) => row.map((w, j) =>
        w > 0.04 ? (
          <text key={`${i}-${j}-t`}
            x={lW + j * cs + cs / 2} y={lH + i * cs + cs / 2 + 4}
            textAnchor="middle" fontSize={cs > 36 ? 9 : 7}
            fill={w > 0.4 ? '#0d1117' : 'var(--text-muted)'}>
            {w.toFixed(2)}
          </text>
        ) : null
      ))}
    </svg>
  )
}

// ─── PE Panel ────────────────────────────────────────────────────────────────

function SinusoidalPanel({ tokens, colors }: { tokens: string[]; colors: ColorFns }) {
  const pe = useMemo(() => sinusoidalPE(tokens.length), [tokens.length])
  return (
    <PanelCard title="Sinusoidal Positional Encoding">
      <Info>
        Each position gets a unique vector computed from sine and cosine waves at different
        frequencies. The model learns to attend to positional patterns from these deterministic
        embeddings, which generalize to unseen sequence lengths.
      </Info>
      <Formula>
        PE(pos, 2i) = sin(pos / 10000^(2i/d_model))<br />
        PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
      </Formula>
      <div>
        <p className="font-mono text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Heatmap: positions (rows) × dimensions (cols={D_MODEL}) — blue=positive, red=negative
        </p>
        <div className="overflow-x-auto">
          <PEHeatmap data={pe} rowLabels={tokens} colorFn={colors.pe} />
        </div>
        <p className="font-mono text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          Columns 0-1 oscillate fast (high freq), columns 30-31 oscillate slow (low freq).
          Each row is unique, giving the model unambiguous position signals.
        </p>
      </div>
    </PanelCard>
  )
}

function RopeCompass({ theta, tokens, label }: { theta: number; tokens: string[]; label: string }) {
  const cx = 50; const cy = 50; const r = 36
  const points = tokens.map((_, m) => {
    const angle = m * theta
    return { x: cx + r * Math.cos(angle - Math.PI / 2), y: cy + r * Math.sin(angle - Math.PI / 2), m }
  })
  return (
    <div>
      <svg width={100} height={100}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={1} />
        <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="var(--border-soft)" strokeWidth={0.5} />
        <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="var(--border-soft)" strokeWidth={0.5} />
        {points.map((p, i) => {
          const opacity = 0.3 + (i / Math.max(1, tokens.length - 1)) * 0.7
          return (
            <g key={i}>
              {i > 0 && (
                <line x1={points[i - 1].x} y1={points[i - 1].y} x2={p.x} y2={p.y}
                  stroke="var(--accent)" strokeWidth={1} opacity={opacity * 0.5} />
              )}
              <circle cx={p.x} cy={p.y} r={4} fill="var(--accent)" opacity={opacity} />
              <text x={p.x} y={p.y - 6} textAnchor="middle" fontSize={7} fill="var(--text-muted)">{i}</text>
            </g>
          )
        })}
      </svg>
      <p className="font-mono text-xs text-center mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  )
}

function RoPEPanel({ tokens }: { tokens: string[] }) {
  const freqs = useMemo(() => ropeFreqs(), [])
  const showcasePairs = [0, 4, 15]
  return (
    <PanelCard title="Rotary Position Embedding (RoPE)">
      <Info>
        RoPE encodes position by rotating Q and K vectors in 2D subspaces. Each dimension
        pair rotates at a different frequency: early pairs spin fast, late pairs spin
        almost not at all. Crucially, attention Q·K^T depends only on the
        relative rotation, i.e., only on m-n (the position gap).
      </Info>
      <Formula>
        f_q(x_m, m) = (W_q x_m) e^(im·Θ)<br />
        attn(m,n) depends only on (m - n)
      </Formula>
      <div>
        <p className="font-mono text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Frequency per dimension pair (θ_i = 1/10000^(2i/{D_MODEL})):
        </p>
        <div className="overflow-x-auto">
          <svg width={freqs.length * 19 + 40} height={80} style={{ display: 'block' }}>
            {freqs.map((θ, i) => {
              const logVal = Math.log10(θ)
              const barH = Math.max(2, ((logVal + 4) / 4) * 60)
              return (
                <g key={i}>
                  <rect x={40 + i * 19} y={65 - barH} width={16} height={barH}
                    fill="var(--accent)" opacity={0.4 + (1 - i / freqs.length) * 0.6} rx={1} />
                  {i % 4 === 0 && (
                    <text x={40 + i * 19 + 8} y={78} textAnchor="middle" fontSize={8} fill="var(--text-muted)">{i}</text>
                  )}
                </g>
              )
            })}
            <text x={2} y={68} fontSize={8} fill="var(--text-muted)">slow</text>
            <text x={2} y={8} fontSize={8} fill="var(--text-muted)">fast</text>
            <line x1={38} y1={0} x2={38} y2={70} stroke="var(--border)" strokeWidth={0.5} />
          </svg>
        </div>
      </div>
      <div>
        <p className="font-mono text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Rotation of token positions in 3 sample dimension pairs (numbers = token index):
        </p>
        <div className="flex gap-4 flex-wrap">
          {showcasePairs.map(i => (
            <RopeCompass key={i} theta={freqs[i]} tokens={tokens}
              label={`pair ${i}: θ=${freqs[i].toFixed(4)}`} />
          ))}
        </div>
        <p className="font-mono text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          Pair 0 spins fast (tokens spread far). Pair 15 barely moves (nearly same angle).
          Together they give the model a rich multi-frequency position signal.
        </p>
      </div>
    </PanelCard>
  )
}

// ─── Attention Panel ─────────────────────────────────────────────────────────

function MHADiagram({ selectedHead, onSelect }: { selectedHead: number; onSelect: (h: number) => void }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: N_HEADS }, (_, h) => (
        <button key={h} onClick={() => onSelect(h)}
          className="flex-1 rounded border p-2 text-center transition-all duration-150"
          style={{
            borderColor: h === selectedHead ? 'var(--accent)' : 'var(--border)',
            backgroundColor: h === selectedHead ? 'var(--accent-8)' : 'var(--surface-2)',
          }}>
          <div className="font-mono text-xs font-semibold" style={{ color: 'var(--accent)' }}>Hd {h}</div>
          <div className="flex justify-center gap-0.5 mt-1">
            {['Q', 'K', 'V'].map(l => (
              <span key={l} className="font-mono text-xs px-1 border rounded"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', fontSize: 9 }}>{l}</span>
            ))}
          </div>
        </button>
      ))}
    </div>
  )
}

function GQADiagram({ selectedHead, onSelect }: { selectedHead: number; onSelect: (h: number) => void }) {
  const groupColor = (h: number) => h < 2 ? 'var(--accent)' : '#a78bfa'
  const kvGroupColor = (g: number) => g === 0 ? 'var(--accent)' : '#a78bfa'
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {Array.from({ length: N_HEADS }, (_, h) => (
          <button key={h} onClick={() => onSelect(h)}
            className="flex-1 rounded border p-2 text-center transition-all duration-150"
            style={{
              borderColor: h === selectedHead ? groupColor(h) : 'var(--border)',
              backgroundColor: h === selectedHead ? (h < 2 ? 'var(--accent-8)' : 'rgba(167,139,250,0.08)') : 'var(--surface-2)',
            }}>
            <div className="font-mono text-xs font-semibold" style={{ color: groupColor(h) }}>Q{h}</div>
            <div className="font-mono text-xs" style={{ color: 'var(--text-muted)', fontSize: 9 }}>
              → KV{Math.floor(h / N_KV_GQA)}
            </div>
          </button>
        ))}
      </div>
      <div className="flex gap-2 px-0">
        {Array.from({ length: N_KV_GQA }, (_, g) => (
          <div key={g}
            className="flex-1 rounded border p-2 text-center"
            style={{ borderColor: kvGroupColor(g), backgroundColor: g === 0 ? 'var(--accent-5)' : 'rgba(167,139,250,0.05)' }}>
            <div className="font-mono text-xs font-semibold" style={{ color: kvGroupColor(g) }}>
              KV Group {g}
            </div>
            <div className="font-mono text-xs" style={{ color: 'var(--text-muted)', fontSize: 9 }}>
              shared by Q{g * 2}, Q{g * 2 + 1}
            </div>
          </div>
        ))}
      </div>
      <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
        GQA uses {N_HEADS} Q heads but only {N_KV_GQA} K/V groups.
        Memory for KV cache is {N_HEADS / N_KV_GQA}x smaller than MHA.
      </p>
    </div>
  )
}

function AttnPanel({ attnType, tokens, weightsPerHead, layerIdx }: {
  attnType: AttnType; tokens: string[]
  weightsPerHead: number[][][]; layerIdx: number
}) {
  const [selectedHead, setSelectedHead] = useState(0)
  const { theme } = useTheme()
  const colors = useMemo(() => makeColors(theme === 'dark'), [theme])

  return (
    <PanelCard title={`Self-Attention · Layer ${layerIdx}`}>
      <Info>
        {attnType === 'mha'
          ? `Multi-Head Attention runs ${N_HEADS} independent attention heads in parallel. Each head can focus on different types of relationships between tokens.`
          : `Grouped Query Attention uses ${N_HEADS} Q heads but only ${N_KV_GQA} K/V groups. Each group of ${N_HEADS / N_KV_GQA} Q heads shares one K and V, reducing memory by ${N_HEADS / N_KV_GQA}x with minimal quality loss.`}
      </Info>
      <Formula>
        Attention(Q, K, V) = softmax(QK^T / sqrt(d_k) + mask) · V<br />
        d_k = {D_MODEL / N_HEADS} (head dim) | mask = causal (lower triangular)
      </Formula>
      {attnType === 'mha'
        ? <MHADiagram selectedHead={selectedHead} onSelect={setSelectedHead} />
        : <GQADiagram selectedHead={selectedHead} onSelect={setSelectedHead} />}
      <div>
        <p className="font-mono text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Attention weights for Head {selectedHead} — rows=Query, cols=Key (causal mask applied):
        </p>
        <div className="overflow-x-auto">
          <AttnHeatmap
            weights={weightsPerHead[selectedHead]}
            tokens={tokens}
            colorFn={colors.attn} />
        </div>
        <p className="font-mono text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          Each row sums to 1. The diagonal and below are the only reachable positions
          (causal masking prevents looking at future tokens during generation).
        </p>
      </div>
    </PanelCard>
  )
}

// ─── FFN Panel ───────────────────────────────────────────────────────────────

function FFNPanel({ layerIdx }: { layerIdx: number }) {
  const geluX = Array.from({ length: 61 }, (_, i) => -3 + i * 0.1)
  const geluY = geluX.map(x => x * 0.5 * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3))))
  const svgW = 260; const svgH = 90
  const xMin = -3; const xMax = 3; const yMin = -0.5; const yMax = 3
  const toSVG = (x: number, y: number) => ({
    sx: ((x - xMin) / (xMax - xMin)) * svgW,
    sy: svgH - ((y - yMin) / (yMax - yMin)) * svgH,
  })
  const pathD = geluX.map((x, i) => {
    const { sx, sy } = toSVG(x, geluY[i])
    return `${i === 0 ? 'M' : 'L'}${sx.toFixed(1)},${sy.toFixed(1)}`
  }).join(' ')

  return (
    <PanelCard title={`Feed-Forward Network · Layer ${layerIdx}`}>
      <Info>
        The FFN applies two linear transformations with a GELU activation in between.
        The hidden dimension is typically 4x the model dimension, giving the network
        capacity to store and retrieve factual knowledge per position independently.
      </Info>
      <div className="space-y-2">
        {[
          { label: `Linear: ${D_MODEL} → ${D_MODEL * 4}`, sub: 'project up (4x expansion)' },
          { label: 'GELU activation', sub: 'smooth non-linearity' },
          { label: `Linear: ${D_MODEL * 4} → ${D_MODEL}`, sub: 'project down' },
        ].map((row, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="font-mono text-xs px-3 py-2 rounded border flex-1"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)', color: 'var(--text-bright)' }}>
              {row.label}
            </div>
            <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{row.sub}</span>
          </div>
        ))}
      </div>
      <div>
        <p className="font-mono text-xs mb-2" style={{ color: 'var(--text-muted)' }}>GELU activation function:</p>
        <svg width={svgW} height={svgH} style={{ display: 'block' }}>
          <line x1={toSVG(xMin, 0).sx} y1={toSVG(0, 0).sy}
            x2={toSVG(xMax, 0).sx} y2={toSVG(0, 0).sy}
            stroke="var(--border)" strokeWidth={0.5} />
          <line x1={toSVG(0, yMin).sx} y1={toSVG(0, yMin).sy}
            x2={toSVG(0, yMax).sx} y2={toSVG(0, yMax).sy}
            stroke="var(--border)" strokeWidth={0.5} />
          <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth={2} />
          {[0].map(x => {
            const { sx, sy } = toSVG(x, geluY[Math.round((x - xMin) / 0.1)])
            return <circle key={x} cx={sx} cy={sy} r={3} fill="var(--accent)" />
          })}
        </svg>
        <p className="font-mono text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          GELU(x) ≈ x · 0.5 · (1 + tanh(√(2/π)(x + 0.044715x³)))
        </p>
      </div>
    </PanelCard>
  )
}

// ─── LM Head Panel ───────────────────────────────────────────────────────────

function LMHeadPanel() {
  return (
    <PanelCard title="LM Head (Unembedding)">
      <Info>
        The LM head projects the final hidden state back to the vocabulary dimension.
        In many models (weight tying) the unembedding matrix is the transpose of the
        token embedding matrix, keeping the parameter count down.
      </Info>
      <Formula>
        logits = W_u · h_last   (shape: vocab_size)<br />
        probs = softmax(logits / temperature)
      </Formula>
      <div className="flex items-center gap-3">
        <div className="font-mono text-xs px-3 py-2 rounded border"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)', color: 'var(--text-bright)' }}>
          Hidden: d_model = {D_MODEL}
        </div>
        <span style={{ color: 'var(--text-muted)' }}>→</span>
        <div className="font-mono text-xs px-3 py-2 rounded border"
          style={{ borderColor: 'var(--accent)', backgroundColor: 'var(--accent-8)', color: 'var(--accent)' }}>
          Logits: vocab_size ≈ 32K–150K
        </div>
      </div>
      <Info>
        Only the last token position's hidden state is used during autoregressive generation.
        The full sequence of hidden states is used during training to compute cross-entropy loss.
      </Info>
    </PanelCard>
  )
}

// ─── Embedding Panel ─────────────────────────────────────────────────────────

function EmbeddingPanel({ tokens }: { tokens: string[] }) {
  return (
    <PanelCard title="Token Embedding">
      <Info>
        Before any of this, raw text is split into subword pieces by a tokenizer (usually
        BPE or SentencePiece). "unbelievable" might become ["un", "believ", "able"]; the
        word "cat" is likely one piece. The vocabulary is these subword types, typically
        32K–150K entries. Each token ID then indexes into a learned embedding matrix to
        get a dense vector of dimension d_model.
      </Info>
      <Formula>
        text → BPE tokenizer → [id₀, id₁, ..., idₙ]<br />
        E ∈ ℝ^(V × d_model),  h₀(t) = E[idₜ]
      </Formula>
      <div>
        <p className="font-mono text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
          Token → integer ID → row lookup in E (d_model = {D_MODEL} here, 4096–8192 in real models):
        </p>
        <div className="space-y-2">
          {tokens.map((t, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="font-mono text-xs w-16 text-right" style={{ color: 'var(--accent)' }}>[{i}] {t}</span>
              <div className="flex-1 h-3 rounded overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
                <div className="h-full rounded" style={{
                  width: `${30 + ((i * 17 + 7) % 60)}%`,
                  backgroundColor: 'var(--accent)', opacity: 0.4 + (i % 3) * 0.2,
                }} />
              </div>
              <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>d={D_MODEL}</span>
            </div>
          ))}
        </div>
        <p className="font-mono text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          Positional encoding is then added element-wise: h = E[id] + PE(position).
          In models with weight tying, this same matrix E is reused (transposed) as the
          LM head at the output end.
        </p>
      </div>
    </PanelCard>
  )
}

// ─── Sampling Panel ──────────────────────────────────────────────────────────

function SamplingPanel({ type, topK, topP, data, onTopK, onTopP }: {
  type: SamplingType; topK: number; topP: number
  data: SampleEntry[]
  onTopK: (k: number) => void
  onTopP: (p: number) => void
}) {
  const maxProb = data[0]?.prob ?? 1
  const selected = (entry: SampleEntry, idx: number): boolean => {
    if (type === 'greedy') return idx === 0
    if (type === 'topk') return idx < topK
    return entry.cumProb - entry.prob < topP
  }
  const selectedCount = data.filter((e, i) => selected(e, i)).length

  return (
    <PanelCard title="Sampling Strategy">
      <Info>
        After the LM head produces logits, a sampling strategy selects the next token.
        The context is "The cat sat on the ___" — so "mat" dominates the distribution.
      </Info>
      {type === 'topk' && (
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>k =</span>
          <input type="range" min={1} max={15} value={topK}
            onChange={e => onTopK(Number(e.target.value))}
            className="flex-1 accent-[var(--accent)]" />
          <span className="font-mono text-xs w-4" style={{ color: 'var(--accent)' }}>{topK}</span>
        </div>
      )}
      {type === 'topp' && (
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>p =</span>
          <input type="range" min={50} max={99} value={Math.round(topP * 100)}
            onChange={e => onTopP(Number(e.target.value) / 100)}
            className="flex-1 accent-[var(--accent)]" />
          <span className="font-mono text-xs w-8" style={{ color: 'var(--accent)' }}>{topP.toFixed(2)}</span>
        </div>
      )}
      <div className="space-y-1.5">
        {data.map((entry, i) => {
          const isSelected = selected(entry, i)
          const barWidth = (entry.prob / maxProb) * 100
          return (
            <div key={entry.token} className="flex items-center gap-2">
              <span className="font-mono text-xs w-16 text-right"
                style={{ color: isSelected ? 'var(--text-bright)' : 'var(--text-muted)' }}>
                {entry.token}
              </span>
              <div className="flex-1 h-4 rounded overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
                <div className="h-full rounded transition-all duration-300"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: isSelected ? 'var(--accent)' : 'var(--border)',
                    opacity: isSelected ? 1 : 0.4,
                  }} />
              </div>
              <span className="font-mono text-xs w-10 text-right"
                style={{ color: isSelected ? 'var(--accent)' : 'var(--text-muted)' }}>
                {(entry.prob * 100).toFixed(1)}%
              </span>
            </div>
          )
        })}
      </div>
      <div className="font-mono text-xs px-3 py-2 rounded" style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-muted)' }}>
        {type === 'greedy' && `Greedy: always pick the highest-probability token → "mat" (${(data[0]?.prob * 100).toFixed(1)}%)`}
        {type === 'topk' && `Top-${topK}: sample from the top ${topK} tokens (${selectedCount} highlighted), covering ${(data.slice(0, Math.min(topK, data.length)).reduce((s, e) => s + e.prob, 0) * 100).toFixed(1)}% of probability mass`}
        {type === 'topp' && `Top-p: sample from the smallest set covering ≥${(topP * 100).toFixed(0)}% probability → ${selectedCount} tokens (highlighted)`}
      </div>
    </PanelCard>
  )
}

// ─── Default Panel ───────────────────────────────────────────────────────────

function DefaultPanel() {
  return (
    <div className="rounded-lg border p-8 text-center space-y-3"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', borderStyle: 'dashed' }}>
      <p className="text-2xl">⬅</p>
      <p className="font-semibold" style={{ color: 'var(--text-bright)' }}>Click any module</p>
      <p className="text-sm" style={{ color: 'var(--text)' }}>
        Select a block in the architecture diagram to explore it in detail:
        heatmaps, diagrams, math formulas.
      </p>
    </div>
  )
}

// ─── Layer Block ─────────────────────────────────────────────────────────────

function LayerBlock({ layerIdx, attnType, selected, onSelect, expanded, onToggle }: {
  layerIdx: number; attnType: AttnType
  selected: SelectedModule; onSelect: (m: SelectedModule) => void
  expanded: boolean; onToggle: () => void
}) {
  const attnId = `layer${layerIdx}-attn` as SelectedModule
  const ffnId = `layer${layerIdx}-ffn` as SelectedModule
  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      <button onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: 'var(--surface-2)' }}>
        <span className="font-mono text-xs font-semibold" style={{ color: 'var(--text-bright)' }}>
          Decoder Layer {layerIdx}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>{expanded ? '▾' : '▸'}</span>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}>
            <div className="p-3 space-y-2">
              <ModuleBlock
                label="Self-Attention"
                badge={attnType === 'mha' ? 'MHA' : 'GQA'}
                selected={selected === attnId}
                onClick={() => onSelect(selected === attnId ? null : attnId)}
              />
              <div className="text-center font-mono text-xs py-1" style={{ color: 'var(--text-muted)' }}>
                Add &amp; Norm
              </div>
              <ModuleBlock
                label="Feed Forward Network"
                selected={selected === ffnId}
                onClick={() => onSelect(selected === ffnId ? null : ffnId)}
              />
              <div className="text-center font-mono text-xs py-1" style={{ color: 'var(--text-muted)' }}>
                Add &amp; Norm
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TransformerViz() {
  const [tokenInput, setTokenInput] = useState('The cat sat on the mat')
  const [posType, setPosType] = useState<PosEncType>('sinusoidal')
  const [attnType, setAttnType] = useState<AttnType>('mha')
  const [samplingType, setSamplingType] = useState<SamplingType>('greedy')
  const [topK, setTopK] = useState(5)
  const [topP, setTopP] = useState(0.9)
  const [selected, setSelected] = useState<SelectedModule>('pos-enc')
  const [layer1Open, setLayer1Open] = useState(true)
  const [layer2Open, setLayer2Open] = useState(false)

  const tokens = useMemo(
    () => tokenInput.trim().split(/\s+/).filter(Boolean).slice(0, 8),
    [tokenInput]
  )

  const weightsL1 = useMemo(
    () => Array.from({ length: N_HEADS }, (_, h) => attnWeights(tokens.length, h, 1)),
    [tokens.length]
  )
  const weightsL2 = useMemo(
    () => Array.from({ length: N_HEADS }, (_, h) => attnWeights(tokens.length, h, 2)),
    [tokens.length]
  )
  const samples = useMemo(() => getSamples(), [])

  const { theme } = useTheme()
  const colors = useMemo(() => makeColors(theme === 'dark'), [theme])

  const sel = (id: SelectedModule) => setSelected(prev => prev === id ? null : id)

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid sm:grid-cols-3 gap-6 p-5 rounded-lg border"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
        <RadioGroup label="Position Encoding" value={posType} onChange={v => { setPosType(v); setSelected('pos-enc') }}
          options={[{ value: 'sinusoidal', label: 'Sinusoidal' }, { value: 'rope', label: 'RoPE' }]} />
        <RadioGroup label="Attention Type" value={attnType}
          onChange={v => { setAttnType(v); if (selected?.includes('attn')) setSelected(selected) }}
          options={[{ value: 'mha', label: 'MHA' }, { value: 'gqa', label: 'GQA' }]} />
        <RadioGroup label="Sampling" value={samplingType} onChange={v => { setSamplingType(v); setSelected('sampling') }}
          options={[{ value: 'greedy', label: 'Greedy' }, { value: 'topk', label: 'Top-k' }, { value: 'topp', label: 'Top-p' }]} />
      </div>

      {/* Token input */}
      <div>
        <label className="font-mono text-xs mb-2 block" style={{ color: 'var(--text-muted)' }}>
          Input sequence (space-separated, up to 8 tokens):
        </label>
        <input value={tokenInput} onChange={e => setTokenInput(e.target.value)}
          className="w-full font-mono text-sm px-4 py-2.5 rounded border outline-none"
          style={{
            backgroundColor: 'var(--surface)', borderColor: 'var(--border)',
            color: 'var(--text-bright)',
          }}
          placeholder="The cat sat on the mat" />
        <div className="flex gap-2 mt-2 flex-wrap">
          {tokens.map((t, i) => (
            <span key={i} className="font-mono text-xs px-2 py-0.5 rounded"
              style={{ backgroundColor: 'var(--surface-2)', color: 'var(--accent)' }}>
              [{i}] {t}
            </span>
          ))}
        </div>
      </div>

      {/* Architecture + Detail panel */}
      <div className="grid lg:grid-cols-[2fr_3fr] gap-6 items-start">

        {/* Left: architecture flow */}
        <div>
          <div className="font-mono text-xs text-center py-2 px-3 rounded border"
            style={{ borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}>
            {tokens.join(' · ')} ({tokens.length} tokens)
          </div>
          <Arrow />
          <ModuleBlock label="Token Embedding" selected={selected === 'embedding'}
            onClick={() => sel('embedding')} />
          <Arrow />
          <ModuleBlock label="Positional Encoding"
            badge={posType === 'sinusoidal' ? 'Sinusoidal' : 'RoPE'}
            selected={selected === 'pos-enc'}
            onClick={() => sel('pos-enc')} />
          <Arrow />
          <LayerBlock layerIdx={1} attnType={attnType} selected={selected}
            onSelect={setSelected} expanded={layer1Open} onToggle={() => setLayer1Open(v => !v)} />
          <Arrow />
          <LayerBlock layerIdx={2} attnType={attnType} selected={selected}
            onSelect={setSelected} expanded={layer2Open} onToggle={() => setLayer2Open(v => !v)} />
          <Arrow />
          <ModuleBlock label="LM Head" badge="Unembedding" selected={selected === 'lm-head'}
            onClick={() => sel('lm-head')} />
          <Arrow />
          <ModuleBlock label="Sampling"
            badge={samplingType === 'greedy' ? 'Greedy' : samplingType === 'topk' ? `Top-${topK}` : `Top-p ${topP}`}
            selected={selected === 'sampling'}
            onClick={() => sel('sampling')} />
          <Arrow />
          <div className="font-mono text-sm text-center py-3 px-4 rounded border"
            style={{ borderColor: 'var(--accent)', color: 'var(--accent)', backgroundColor: 'var(--accent-8)' }}>
            Next token: "{samples[0].token}"
          </div>
        </div>

        {/* Right: detail panel */}
        <div className="sticky top-24">
          <AnimatePresence mode="wait">
            <motion.div key={selected ?? 'default'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}>
              {selected === null && <DefaultPanel />}
              {selected === 'embedding' && <EmbeddingPanel tokens={tokens} />}
              {selected === 'pos-enc' && (posType === 'sinusoidal'
                ? <SinusoidalPanel tokens={tokens} colors={colors} />
                : <RoPEPanel tokens={tokens} />)}
              {(selected === 'layer1-attn' || selected === 'layer2-attn') && (
                <AttnPanel attnType={attnType} tokens={tokens}
                  weightsPerHead={selected === 'layer1-attn' ? weightsL1 : weightsL2}
                  layerIdx={selected === 'layer1-attn' ? 1 : 2} />
              )}
              {(selected === 'layer1-ffn' || selected === 'layer2-ffn') && (
                <FFNPanel layerIdx={selected === 'layer1-ffn' ? 1 : 2} />
              )}
              {selected === 'lm-head' && <LMHeadPanel />}
              {selected === 'sampling' && (
                <SamplingPanel type={samplingType} topK={topK} topP={topP}
                  data={samples} onTopK={setTopK} onTopP={setTopP} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
