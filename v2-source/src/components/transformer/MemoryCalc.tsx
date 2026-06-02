import { useState, useMemo } from 'react'

interface Config {
  name: string
  paramsB: number
  nLayers: number
  dModel: number
  nHeads: number
  nKvHeads: number
  seqLen: number
}

const PRESETS: Config[] = [
  { name: 'This diagram', paramsB: 0.001, nLayers: 2,   dModel: 32,    nHeads: 4,   nKvHeads: 2,  seqLen: 6 },
  { name: 'GPT-2 Small',  paramsB: 0.117, nLayers: 12,  dModel: 768,   nHeads: 12,  nKvHeads: 12, seqLen: 1024 },
  { name: 'Llama 3 8B',   paramsB: 8,     nLayers: 32,  dModel: 4096,  nHeads: 32,  nKvHeads: 8,  seqLen: 8192 },
  { name: 'Llama 3 70B',  paramsB: 70,    nLayers: 80,  dModel: 8192,  nHeads: 64,  nKvHeads: 8,  seqLen: 8192 },
  { name: 'Llama 3 405B', paramsB: 405,   nLayers: 126, dModel: 16384, nHeads: 128, nKvHeads: 8,  seqLen: 8192 },
  // Qwen2.5: hidden=5120, q_heads=40, kv_heads=8, d_head=128
  { name: 'Qwen2.5 14B',  paramsB: 14.7,  nLayers: 48,  dModel: 5120,  nHeads: 40,  nKvHeads: 8,  seqLen: 8192 },
  { name: 'Qwen2.5 32B',  paramsB: 32.8,  nLayers: 64,  dModel: 5120,  nHeads: 40,  nKvHeads: 8,  seqLen: 8192 },
]

function fmt(bytes: number): string {
  if (bytes < 1e3) return `${bytes.toFixed(0)} B`
  if (bytes < 1e6) return `${(bytes / 1e3).toFixed(1)} KB`
  if (bytes < 1e9) return `${(bytes / 1e6).toFixed(0)} MB`
  if (bytes < 1e12) return `${(bytes / 1e9).toFixed(2)} GB`
  return `${(bytes / 1e12).toFixed(1)} TB`
}

function NumField({ label, value, onChange, min, max, step = 1, readonly = false }: {
  label: string; value: number; onChange?: (v: number) => void
  min: number; max: number; step?: number; readonly?: boolean
}) {
  return (
    <div>
      <label className="font-mono text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        readOnly={readonly}
        onChange={e => onChange?.(Number(e.target.value))}
        className="w-full font-mono text-sm px-3 py-1.5 rounded border outline-none"
        style={{
          backgroundColor: readonly ? 'var(--surface-2)' : 'var(--surface)',
          borderColor: 'var(--border)',
          color: readonly ? 'var(--text-muted)' : 'var(--text-bright)',
          cursor: readonly ? 'default' : 'text',
        }}
      />
    </div>
  )
}

const COLORS = {
  weights: '#58a6ff',
  grads: '#60a5fa',
  master: '#f59e0b',
  adamM: '#f97316',
  adamV: '#ef4444',
  kv: '#a78bfa',
  act: '#34d399',
}

function MemRow({ label, note, bytes, total, color }: {
  label: string; note: string; bytes: number; total: number; color: string
}) {
  const pct = total > 0 ? Math.min(100, (bytes / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="font-mono text-xs font-semibold" style={{ color: 'var(--text-bright)' }}>
            {label}
          </span>
          <span className="font-mono text-xs ml-2 break-words" style={{ color: 'var(--text-muted)' }}>
            {note}
          </span>
        </div>
        <span className="font-mono text-sm font-bold shrink-0" style={{ color }}>{fmt(bytes)}</span>
      </div>
      <div className="h-2 rounded overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
        <div className="h-full rounded transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

export default function MemoryCalc() {
  const [selectedPreset, setSelectedPreset] = useState(2)
  const [cfg, setCfg] = useState<Config>(PRESETS[2])
  const [batchSize, setBatchSize] = useState(4)
  const [tab, setTab] = useState<'inference' | 'training'>('inference')

  const set = (k: keyof Config, v: number) => {
    setSelectedPreset(-1)
    setCfg(prev => ({ ...prev, [k]: v }))
  }

  const applyPreset = (i: number) => {
    setSelectedPreset(i)
    setCfg(PRESETS[i])
  }

  const dHead = useMemo(
    () => Math.max(1, Math.floor(cfg.dModel / Math.max(1, cfg.nHeads))),
    [cfg.dModel, cfg.nHeads]
  )
  const kvHeads = Math.min(cfg.nKvHeads, cfg.nHeads)
  const params = cfg.paramsB * 1e9

  // ── Inference ───────────────────────────────────────────────────────────────
  const inf_weights = params * 2
  // KV cache at full context: layers × 2(K+V) × seq_len × kv_heads × d_head × 2 bytes
  const inf_kv = cfg.nLayers * 2 * cfg.seqLen * kvHeads * dHead * 2
  // Activations at inference = just one layer at a time, very small
  const inf_act = cfg.seqLen * cfg.dModel * 2 * 6
  const inf_total = inf_weights + inf_kv + inf_act
  const inf_kv_per_token = cfg.nLayers * 2 * kvHeads * dHead * 2

  // ── Training (mixed precision + AdamW) ──────────────────────────────────────
  const tr_fp16_weights = params * 2
  const tr_fp16_grads = params * 2
  const tr_fp32_master = params * 4
  const tr_adam_m = params * 4
  const tr_adam_v = params * 4
  // Activation memory without gradient checkpointing.
  // Formula: 34 × L × B × S × H bytes (Korthikanti et al. 2022, TP=1 approximation)
  // Does not include the quadratic-in-seq attention term — accurate for short-to-medium sequences.
  const tr_act = cfg.nLayers * batchSize * cfg.seqLen * cfg.dModel * 34
  const tr_no_act = tr_fp16_weights + tr_fp16_grads + tr_fp32_master + tr_adam_m + tr_adam_v
  const tr_total = tr_no_act + tr_act
  const bytesPerParam = tr_no_act / params

  return (
    <div className="space-y-6">

      {/* Presets */}
      <div>
        <p className="font-mono text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Model preset</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p, i) => (
            <button key={p.name} onClick={() => applyPreset(i)}
              className="font-mono text-xs px-3 py-1.5 rounded border transition-all duration-150"
              style={selectedPreset === i
                ? { color: 'var(--bg)', backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }
                : { color: 'var(--text)', borderColor: 'var(--border)' }}>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Parameter inputs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <NumField label="Parameters (B)" value={cfg.paramsB} onChange={v => set('paramsB', v)} min={0.001} max={1000} step={0.001} />
        <NumField label="Layers" value={cfg.nLayers} onChange={v => set('nLayers', v)} min={1} max={256} />
        <NumField label="d_model" value={cfg.dModel} onChange={v => set('dModel', v)} min={64} max={32768} step={64} />
        <NumField label="Q heads" value={cfg.nHeads} onChange={v => set('nHeads', v)} min={1} max={256} />
        <NumField label="KV heads" value={kvHeads} onChange={v => set('nKvHeads', v)} min={1} max={cfg.nHeads} />
        <NumField label="d_head (derived)" value={dHead} min={dHead} max={dHead} readonly />
        <NumField label="Context length" value={cfg.seqLen} onChange={v => set('seqLen', v)} min={1} max={200000} step={512} />
        <NumField label="Batch size (train)" value={batchSize} onChange={setBatchSize} min={1} max={512} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['inference', 'training'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="font-mono text-xs px-4 py-2 rounded border capitalize transition-all duration-150"
            style={tab === t
              ? { color: 'var(--bg)', backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }
              : { color: 'var(--text)', borderColor: 'var(--border)' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="rounded-lg border p-6 space-y-4"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
        {tab === 'inference' ? (
          <>
            <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
              FP16 weights loaded once. KV cache grows with each generated token up to context length.
              No gradients or optimizer states.
            </p>
            <MemRow label="Weights (FP16)" note={`${cfg.paramsB}B params × 2 bytes`}
              bytes={inf_weights} total={inf_total} color={COLORS.weights} />
            <MemRow
              label="KV cache (FP16)"
              note={`${cfg.nLayers} layers × 2 (K+V) × ${cfg.seqLen.toLocaleString()} tokens × ${kvHeads} kv_heads × ${dHead} d_head × 2 bytes`}
              bytes={inf_kv} total={inf_total} color={COLORS.kv} />
            <MemRow label="Activations" note="one layer at a time, very small at inference"
              bytes={inf_act} total={inf_total} color={COLORS.act} />
            <div className="pt-3 border-t space-y-1" style={{ borderColor: 'var(--border)' }}>
              <div className="flex justify-between items-center">
                <span className="font-mono text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>Total</span>
                <span className="font-mono text-xl font-bold" style={{ color: 'var(--accent)' }}>{fmt(inf_total)}</span>
              </div>
              <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                KV cache per token: {fmt(inf_kv_per_token)} — with a full {cfg.seqLen.toLocaleString()}-token context that is {fmt(inf_kv)}.
                {kvHeads < cfg.nHeads && ` GQA (${kvHeads} KV heads vs ${cfg.nHeads} Q heads) saves ${(cfg.nHeads / kvHeads).toFixed(0)}× vs MHA here.`}
              </p>
            </div>
          </>
        ) : (
          <>
            <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
              Mixed precision: FP16 forward/backward, FP32 master weights and optimizer states (AdamW).
              Activations without gradient checkpointing — enabling checkpointing trades compute for memory.
            </p>
            <MemRow label="FP16 weights" note={`${cfg.paramsB}B params × 2 bytes`}
              bytes={tr_fp16_weights} total={tr_total} color={COLORS.weights} />
            <MemRow label="FP16 gradients" note={`${cfg.paramsB}B params × 2 bytes`}
              bytes={tr_fp16_grads} total={tr_total} color={COLORS.grads} />
            <MemRow label="FP32 master weights" note={`${cfg.paramsB}B params × 4 bytes — stable accumulation`}
              bytes={tr_fp32_master} total={tr_total} color={COLORS.master} />
            <MemRow label="Adam first moment (m)" note={`${cfg.paramsB}B params × 4 bytes (FP32)`}
              bytes={tr_adam_m} total={tr_total} color={COLORS.adamM} />
            <MemRow label="Adam second moment (v)" note={`${cfg.paramsB}B params × 4 bytes (FP32)`}
              bytes={tr_adam_v} total={tr_total} color={COLORS.adamV} />
            <MemRow
              label="Activations"
              note={`${cfg.nLayers}L × batch ${batchSize} × ${cfg.seqLen.toLocaleString()} seq × ${cfg.dModel} dim × 34 bytes (approx, no checkpointing)`}
              bytes={tr_act} total={tr_total} color={COLORS.act} />
            <div className="pt-3 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
              <div className="flex justify-between items-baseline">
                <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                  Model + optimizer (no activations)
                </span>
                <span className="font-mono text-sm" style={{ color: 'var(--text-bright)' }}>
                  {fmt(tr_no_act)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-mono text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>Total</span>
                <span className="font-mono text-xl font-bold" style={{ color: 'var(--accent)' }}>{fmt(tr_total)}</span>
              </div>
              <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                {bytesPerParam.toFixed(1)} bytes per parameter for model + optimizer
                (rule of thumb: 16 bytes/param for AdamW mixed precision).
                Activation memory dominates at large batch × sequence sizes.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
