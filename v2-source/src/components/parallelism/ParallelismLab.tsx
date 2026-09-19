import { useMemo, useState } from 'react'
import {
  MODELS, HARDWARE, USABLE_FRACTION, modelStats,
  computeTrain, searchTrain, computeInfer, searchInfer,
  fmtBytes, fmtParams, fmtTime, fmtRate,
  type ModelCfg, type Hardware, type Check,
  type TrainSettings, type TrainPar, type TrainResult,
  type InferSettings, type InferPar, type InferResult,
} from './calc'
import DeviceMesh, { type MeshDim } from './DeviceMesh'
import LatencyChart from './LatencyChart'

// ─── UI atoms ────────────────────────────────────────────────────────────────

const on = { color: 'var(--bg)', backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }
const off = { color: 'var(--text)', borderColor: 'var(--border)' }

function Seg<T extends string | number>({ label, options, value, onChange, format, disabled }: {
  label: string; options: readonly T[]; value: T; onChange: (v: T) => void
  format?: (v: T) => string; disabled?: boolean
}) {
  return (
    <div>
      <p className="font-mono text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(o => (
          <button key={String(o)} onClick={() => onChange(o)} disabled={disabled}
            className="font-mono text-xs px-2.5 py-1 rounded border transition-colors disabled:opacity-40"
            style={o === value ? on : off}>
            {format ? format(o) : String(o)}
          </button>
        ))}
      </div>
    </div>
  )
}

function NumInput({ label, value, onChange, min, max, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number
}) {
  return (
    <div>
      <label className="font-mono text-xs block mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <input type="number" value={value} min={min} max={max} step={step}
        onChange={e => {
          const v = Number(e.target.value)
          if (Number.isFinite(v)) onChange(Math.min(max, Math.max(min, v)))
        }}
        className="w-full font-mono text-sm px-3 py-1.5 rounded border outline-none"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-bright)' }} />
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-5 space-y-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
      <h3 className="font-semibold text-base" style={{ color: 'var(--text-bright)' }}>{title}</h3>
      {children}
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded border px-4 py-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
      <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-xl font-semibold mt-0.5" style={{ color: 'var(--text-bright)' }}>{value}</p>
      {sub && <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}

function MemRows({ rows, total, usable, capacityGB }: {
  rows: { label: string; note: string; bytes: number }[]; total: number; usable: number; capacityGB: number
}) {
  const over = total > usable
  const pct = Math.min(100, (total / usable) * 100)
  return (
    <div className="space-y-3">
      {rows.map(r => (
        <div key={r.label} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm min-w-0">
              <span style={{ color: 'var(--text-bright)' }}>{r.label}</span>{' '}
              <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{r.note}</span>
            </p>
            <span className="font-mono text-sm shrink-0" style={{ color: 'var(--text-bright)' }}>{fmtBytes(r.bytes)}</span>
          </div>
          <div className="h-1.5 rounded overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
            <div className="h-full rounded" style={{ width: `${Math.min(100, (r.bytes / usable) * 100)}%`, backgroundColor: 'var(--accent)', opacity: 0.7 }} />
          </div>
        </div>
      ))}
      <div className="pt-3 border-t space-y-1.5" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>Per device</span>
          <span className="font-mono text-base font-bold" style={{ color: over ? '#ef4444' : 'var(--accent)' }}>
            {fmtBytes(total)} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>/ {fmtBytes(usable)} usable</span>
          </span>
        </div>
        <div className="h-2.5 rounded overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
          <div className="h-full rounded transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: over ? '#ef4444' : 'var(--accent)' }} />
        </div>
        <p className="font-mono text-xs" style={{ color: over ? '#ef4444' : 'var(--text-muted)' }}>
          {over ? '✗ Does not fit. ' : ''}Usable = {Math.round(USABLE_FRACTION * 100)}% of {capacityGB} GB, the rest goes to
          fragmentation, communication buffers and the runtime.
        </p>
      </div>
    </div>
  )
}

function Checks({ checks }: { checks: Check[] }) {
  return (
    <ul className="space-y-1.5">
      {checks.map(c => {
        const icon = c.ok ? '✓' : c.hard ? '✗' : '!'
        const color = c.ok ? 'var(--accent)' : c.hard ? '#ef4444' : '#f59e0b'
        return (
          <li key={c.label} className="flex gap-2 text-sm leading-snug">
            <span className="font-mono shrink-0 w-3" style={{ color }}>{icon}</span>
            <span style={{ color: c.ok ? 'var(--text)' : 'var(--text-bright)' }}>
              {c.label}{!c.ok && !c.hard && <span style={{ color: 'var(--text-muted)' }}> (warning)</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function ConfigTable<R>({ headers, rows, cells, isCurrent, onPick }: {
  headers: string[]; rows: R[]; cells: (r: R) => (string | number)[]
  isCurrent: (r: R) => boolean; onPick: (r: R) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full font-mono text-xs text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
        <thead>
          <tr style={{ color: 'var(--text-muted)' }}>
            {headers.map(h => <th key={h} className="py-1.5 px-2 font-normal whitespace-nowrap">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const cur = isCurrent(r)
            return (
              <tr key={i} onClick={() => onPick(r)} tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(r) } }}
                className="border-t cursor-pointer transition-colors hover:bg-[var(--accent-8)]"
                style={{ borderColor: 'var(--border-soft)', backgroundColor: cur ? 'var(--accent-10)' : undefined,
                  color: cur ? 'var(--text-bright)' : 'var(--text)' }}>
                {cells(r).map((c, j) => <td key={j} className="py-1.5 px-2 whitespace-nowrap">{c}</td>)}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function LoadButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="font-mono text-xs px-2.5 py-1 ml-2 rounded border transition-colors hover:opacity-80"
      style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}>
      load it
    </button>
  )
}

const kLabel = (n: number) => (n >= 1024 ? `${n / 1024}K` : String(n))

// ─── Search helpers ──────────────────────────────────────────────────────────

function bestTrain(m: ModelCfg, hw: Hardware, node: number, s: TrainSettings): TrainPar | null {
  const all = searchTrain(m, hw, node, s)
  all.sort((a, b) => a.devices - b.devices || a.stepTime - b.stepTime)
  return all[0]?.par ?? null
}

function bestInfer(m: ModelCfg, hw: Hardware, node: number, s: InferSettings): InferPar | null {
  const all = searchInfer(m, hw, node, s)
  all.sort((a, b) => a.devices - b.devices || a.tpot - b.tpot)
  return all[0]?.par ?? null
}

const DEFAULT_TRAIN: TrainSettings = { seqLen: 4096, globalBatch: 256, microBatch: 1, zero: 1, recompute: 'none', mfu: 0.4 }
const DEFAULT_INFER: InferSettings = { prompt: 8192, output: 1024, batch: 32, wDtype: 'bf16', kvDtype: 'bf16' }

// ─── Main ────────────────────────────────────────────────────────────────────

export default function ParallelismLab() {
  const [modelId, setModelId] = useState('qwen3-32b')
  const [hwId, setHwId] = useState('h100')
  const [nodeSize, setNodeSize] = useState(8)
  const [mode, setMode] = useState<'train' | 'infer'>('train')
  const [ts, setTs] = useState<TrainSettings>(DEFAULT_TRAIN)
  const [is, setIs] = useState<InferSettings>(DEFAULT_INFER)
  const model = MODELS.find(m => m.id === modelId)!
  const hw = HARDWARE.find(h => h.id === hwId)!
  const [tpar, setTpar] = useState<TrainPar>(() =>
    bestTrain(model, hw, nodeSize, DEFAULT_TRAIN) ?? { tp: 8, pp: 1, cp: 1, ep: 1, dp: 1 })
  const [ipar, setIpar] = useState<InferPar>(() =>
    bestInfer(model, hw, nodeSize, DEFAULT_INFER) ?? { tp: 8, pp: 1, dp: 1, ep: false })

  // Changing the model, hardware or node size jumps to the smallest valid setup for it.
  const setContext = (mId: string, hId: string, node: number) => {
    const m = MODELS.find(x => x.id === mId)!
    const h = HARDWARE.find(x => x.id === hId)!
    setModelId(mId); setHwId(hId); setNodeSize(node)
    setTpar(bestTrain(m, h, node, ts) ?? { tp: Math.min(8, node), pp: 1, cp: 1, ep: 1, dp: 1 })
    setIpar(bestInfer(m, h, node, is) ?? { tp: Math.min(8, node), pp: 1, dp: 1, ep: false })
  }

  const st = useMemo(() => modelStats(model), [model])
  const unit = hw.id === '910b' ? 'NPUs' : 'GPUs'

  return (
    <div className="space-y-6">
      {/* Shared context */}
      <div className="rounded-lg border p-5 space-y-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
        <Seg label="Model" options={MODELS.map(m => m.id)} value={modelId}
          format={id => MODELS.find(m => m.id === id)!.name}
          onChange={id => setContext(id, hwId, nodeSize)} />
        <div className="grid sm:grid-cols-[1fr_auto] gap-4">
          <Seg label="Accelerator" options={HARDWARE.map(h => h.id)} value={hwId}
            format={id => HARDWARE.find(h => h.id === id)!.name}
            onChange={id => setContext(modelId, id, nodeSize)} />
          <Seg label={`${unit} per node`} options={[4, 8, 16] as const} value={nodeSize as 4 | 8 | 16}
            onChange={n => setContext(modelId, hwId, n)} />
        </div>
        <div className="font-mono text-xs leading-relaxed px-3 py-2 rounded" style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--text-bright)' }}>{model.name}</span>: {fmtParams(st.total)} params
          {model.moe && <> ({fmtParams(st.active)} active, {model.moe.experts} experts, top-{model.moe.topK})</>}
          {' · '}{model.layers} layers · d_model {model.hidden} · {model.heads} Q heads / {model.kvHeads} KV heads × {model.headDim}
          {' · '}{model.moe ? `expert FFN ${model.moe.expertInter}` : `FFN ${model.intermediate}`} · vocab {model.vocab.toLocaleString()}
          {' · '}KV cache {fmtBytes(st.kvBytesPerToken)}/token (BF16)
          <br />
          <span style={{ color: 'var(--text-bright)' }}>{hw.name}</span>: {hw.tflops} TFLOPS dense BF16 · {hw.hbmTBs} TB/s HBM
          {' · '}{hw.intraGBs} GB/s in-node · {hw.interGBs} GB/s between nodes{hw.approx && ' (approximate public figures)'}
        </div>
        <div className="flex gap-2">
          {(['train', 'infer'] as const).map(t => (
            <button key={t} onClick={() => setMode(t)}
              className="font-mono text-sm px-4 py-2 rounded border transition-colors" style={mode === t ? on : off}>
              {t === 'train' ? 'Training' : 'Inference'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'train'
        ? <TrainView model={model} hw={hw} nodeSize={nodeSize} unit={unit} s={ts} setS={setTs} par={tpar} setPar={setTpar} />
        : <InferView model={model} hw={hw} nodeSize={nodeSize} unit={unit} s={is} setS={setIs} par={ipar} setPar={setIpar} />}
    </div>
  )
}

// ─── Training ────────────────────────────────────────────────────────────────

function TrainView({ model, hw, nodeSize, unit, s, setS, par, setPar }: {
  model: ModelCfg; hw: Hardware; nodeSize: number; unit: string
  s: TrainSettings; setS: (s: TrainSettings) => void; par: TrainPar; setPar: (p: TrainPar) => void
}) {
  const [sort, setSort] = useState<'devices' | 'efficiency'>('devices')
  const all = useMemo(() => searchTrain(model, hw, nodeSize, s), [model, hw, nodeSize, s])
  const r = useMemo(() => computeTrain(model, hw, nodeSize, s, par), [model, hw, nodeSize, s, par])
  const smallest = useMemo(() => [...all].sort((a, b) => a.devices - b.devices || a.stepTime - b.stepTime)[0], [all])
  const isCur = (x: TrainResult) => (Object.keys(par) as (keyof TrainPar)[]).every(k => x.par[k] === par[k])
  const top = useMemo(() => [...all].sort(sort === 'devices'
    ? (a, b) => a.devices - b.devices || a.stepTime - b.stepTime
    : (a, b) => b.tokensPerSecPerDevice - a.tokensPerSecPerDevice || a.devices - b.devices).slice(0, 10), [all, sort])
  const set = <K extends keyof TrainSettings>(k: K, v: TrainSettings[K]) => setS({ ...s, [k]: v })
  const setP = <K extends keyof TrainPar>(k: K, v: number) => setPar({ ...par, [k]: v })

  const dims: MeshDim[] = [
    { key: 'tp', label: 'TP', size: par.tp, comm: 'reduce-scatter + all-gather of activations, 4× per layer per micro-batch, on the critical path' },
    { key: 'cp', label: 'CP', size: par.cp, comm: 'ring passing of K/V blocks inside every attention layer, overlapped with compute' },
    { key: 'dp', label: 'DP', size: par.dp, comm: 'gradient all-reduce (reduce-scatter with ZeRO) once per step, overlapped with backward' },
    { key: 'pp', label: 'PP', size: par.pp, comm: 'point-to-point activations and gradients between neighbouring stages' },
  ]
  if (model.moe && par.ep > 1) {
    dims.push({
      key: 'ep', label: 'EP', size: par.ep, comm: 'all-to-all token dispatch and combine at every MoE layer',
      groupKey: c => `${c.pp}|${Math.floor((c.tp + par.tp * (c.cp + par.cp * c.dp)) / par.ep)}`,
    })
  }

  const layersHere = Math.ceil(model.layers / par.pp)
  const zeroNote = (level: number) => (s.zero >= level ? `sharded over DP×CP = ${par.dp * par.cp}` : 'replicated on every DP rank')

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Card title="Training run">
          <Seg label="Sequence length (tokens)" options={[2048, 4096, 8192, 16384, 32768, 65536, 131072] as const}
            value={s.seqLen as 4096} format={kLabel} onChange={v => set('seqLen', v)} />
          <div className="grid grid-cols-2 gap-3">
            <NumInput label="Global batch (sequences/step)" value={s.globalBatch} min={1} max={16384}
              onChange={v => set('globalBatch', Math.round(v))} />
            <NumInput label="MFU (%)" value={Math.round(s.mfu * 100)} min={5} max={80}
              onChange={v => set('mfu', v / 100)} />
          </div>
          <Seg label="Micro-batch (sequences per forward)" options={[1, 2, 4, 8] as const} value={s.microBatch as 1}
            onChange={v => set('microBatch', v)} />
          <div className="grid grid-cols-2 gap-3">
            <Seg label="ZeRO stage" options={[0, 1, 2, 3] as const} value={s.zero} onChange={v => set('zero', v)} />
            <Seg label="Activation recompute" options={['none', 'full'] as const} value={s.recompute}
              onChange={v => set('recompute', v)} />
          </div>
          <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
            {(s.globalBatch * s.seqLen).toLocaleString()} tokens per optimizer step.
          </p>
        </Card>

        <Card title="Parallel layout">
          <div className="grid grid-cols-2 gap-4">
            <Seg label="TP (tensor)" options={[1, 2, 4, 8, 16] as const} value={par.tp as 1} onChange={v => setP('tp', v)} />
            <Seg label="PP (pipeline)" options={[1, 2, 4, 8, 16] as const} value={par.pp as 1} onChange={v => setP('pp', v)} />
            <Seg label="CP (context)" options={[1, 2, 4, 8] as const} value={par.cp as 1} onChange={v => setP('cp', v)} />
            <NumInput label="DP (data)" value={par.dp} min={1} max={512} onChange={v => setP('dp', Math.round(v))} />
          </div>
          <Seg label={model.moe ? 'EP (expert), folded into TP×CP×DP' : 'EP (expert): dense model, no experts'}
            options={[1, 2, 4, 8, 16, 32, 64] as const} value={par.ep as 1} disabled={!model.moe}
            onChange={v => setP('ep', v)} />
          <div className="font-mono text-xs px-3 py-2 rounded leading-relaxed" style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-muted)' }}>
            {unit} = TP × PP × CP × DP = {par.tp} × {par.pp} × {par.cp} × {par.dp} ={' '}
            <span style={{ color: 'var(--text-bright)' }}>{r.devices}</span> ({r.nodes} node{r.nodes > 1 ? 's' : ''} of {nodeSize}).
            {model.moe && ` EP ${par.ep} reuses those ranks for the MoE layers, so it adds no ${unit}.`}
            {' '}Each DP rank runs {r.microBatches} micro-batch{r.microBatches > 1 ? 'es' : ''} of {s.microBatch} per step.
          </div>
          {smallest
            ? <p className="text-sm" style={{ color: 'var(--text)' }}>
                Smallest valid setup: <span className="font-semibold" style={{ color: 'var(--text-bright)' }}>{smallest.devices} {unit}</span>
                {' '}({smallest.nodes} node{smallest.nodes > 1 ? 's' : ''} of {nodeSize}).
                {!isCur(smallest) && <LoadButton onClick={() => setPar(smallest.par)} />}
              </p>
            : <p className="text-sm" style={{ color: '#ef4444' }}>
                No layout up to 1,024 {unit} fits. Try full recompute, a higher ZeRO stage, a shorter sequence or a smaller micro-batch.
              </p>}
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label={unit} value={String(r.devices)} sub={`${r.nodes} node${r.nodes > 1 ? 's' : ''} of ${nodeSize}`} />
        <Stat label="Memory per device" value={fmtBytes(r.mem.total)} sub={`${Math.round((r.mem.total / r.usable) * 100)}% of usable`} />
        <Stat label="Step time" value={fmtTime(r.stepTime)} sub={par.pp > 1 ? `${(r.bubble * 100).toFixed(1)}% pipeline bubble` : 'no pipeline bubble'} />
        <Stat label="Throughput" value={`${fmtRate(r.tokensPerSec)} tok/s`} sub={`${fmtRate(r.tokensPerSecPerDevice)} per device · 10B tokens in ${fmtTime(r.hoursPer10B * 3600)}`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Card title={`Memory on the busiest device (${r.busiestStage})`}>
          <MemRows usable={r.usable} total={r.mem.total} capacityGB={hw.memGB} rows={[
            { label: 'Weights', note: `BF16, ${layersHere} layers, ${s.zero >= 3 ? zeroNote(3) : `1/${par.tp} of each matrix (TP)`}`, bytes: r.mem.weights },
            { label: 'Gradients', note: `BF16, ${zeroNote(2)}`, bytes: r.mem.grads },
            { label: 'Optimizer', note: `FP32 master + Adam m, v (12 B/param), ${zeroNote(1)}`, bytes: r.mem.optimizer },
            { label: 'Activations', note: s.recompute === 'full' ? 'layer inputs only, recomputed in backward' : `saved for backward, ÷${par.tp * par.cp} by TP×CP`, bytes: r.mem.activations },
            { label: 'Logits', note: 'BF16 logits + FP32 loss, last stage only', bytes: r.mem.logits },
          ]} />
        </Card>
        <Card title="Validity checks">
          <Checks checks={r.checks} />
        </Card>
      </div>

      <Card title="Where the traffic goes">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
          Ranks are numbered with TP fastest, then CP, DP and PP (Megatron's default order), so the chattiest
          dimension lands on neighbouring devices. Click any device to see its groups.
        </p>
        <DeviceMesh key={`${par.tp}-${par.pp}-${par.cp}-${par.dp}-${par.ep}-${nodeSize}`}
          devices={r.devices} nodeSize={nodeSize} dims={dims} />
      </Card>

      <Card title={`Valid layouts (${all.length.toLocaleString()} found up to 1,024 ${unit})`}>
        <div className="flex flex-wrap gap-2">
          {(['devices', 'efficiency'] as const).map(k => (
            <button key={k} onClick={() => setSort(k)}
              className="font-mono text-xs px-2.5 py-1 rounded border transition-colors" style={sort === k ? on : off}>
              {k === 'devices' ? `Fewest ${unit}` : `Most tokens/s per device`}
            </button>
          ))}
        </div>
        {top.length > 0
          ? <ConfigTable<TrainResult>
              headers={['TP', 'PP', 'CP', 'EP', 'DP', unit, 'nodes', 'mem/device', 'step', 'tok/s/device']}
              rows={top}
              cells={x => [x.par.tp, x.par.pp, x.par.cp, x.par.ep, x.par.dp, x.devices, x.nodes,
                fmtBytes(x.mem.total), fmtTime(x.stepTime), fmtRate(x.tokensPerSecPerDevice)]}
              isCurrent={isCur}
              onPick={x => setPar(x.par)} />
          : <p className="text-sm" style={{ color: 'var(--text-muted)' }}>None.</p>}
        <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>Click a row to load it.</p>
      </Card>
    </div>
  )
}

// ─── Inference ───────────────────────────────────────────────────────────────

function InferView({ model, hw, nodeSize, unit, s, setS, par, setPar }: {
  model: ModelCfg; hw: Hardware; nodeSize: number; unit: string
  s: InferSettings; setS: (s: InferSettings) => void; par: InferPar; setPar: (p: InferPar) => void
}) {
  const [sort, setSort] = useState<'devices' | 'latency' | 'throughput'>('devices')
  const all = useMemo(() => searchInfer(model, hw, nodeSize, s), [model, hw, nodeSize, s])
  const r = useMemo(() => computeInfer(model, hw, nodeSize, s, par), [model, hw, nodeSize, s, par])
  const smallest = useMemo(() => [...all].sort((a, b) => a.devices - b.devices || a.tpot - b.tpot)[0], [all])
  const isCur = (x: InferResult) => x.par.tp === par.tp && x.par.pp === par.pp && x.par.dp === par.dp && x.par.ep === par.ep
  const peak = (x: InferResult) => Math.max(0, ...x.sweep.map(p => p.perDevice))
  const top = useMemo(() => [...all].sort(
    sort === 'devices' ? (a, b) => a.devices - b.devices || a.tpot - b.tpot
      : sort === 'latency' ? (a, b) => (a.sweep[0]?.tpot ?? 1) - (b.sweep[0]?.tpot ?? 1)
        : (a, b) => peak(b) - peak(a)).slice(0, 10), [all, sort])
  const set = <K extends keyof InferSettings>(k: K, v: InferSettings[K]) => setS({ ...s, [k]: v })
  const ep = !!model.moe && par.ep

  const dims: MeshDim[] = [
    { key: 'tp', label: 'TP', size: par.tp, comm: 'all-reduce after attention and MLP in every layer, for every decoded token' },
    { key: 'dp', label: 'DP', size: par.dp, comm: ep ? 'none directly: DP ranks run attention alone and meet in the EP all-to-all' : 'none: independent replicas, a router spreads requests' },
    { key: 'pp', label: 'PP', size: par.pp, comm: 'point-to-point hidden states between neighbouring stages' },
  ]
  if (ep && par.tp * par.dp > 1) {
    dims.push({ key: 'ep', label: 'EP', size: par.tp * par.dp, comm: 'all-to-all token dispatch and combine at every MoE layer', groupKey: c => `${c.pp}` })
  }

  const current = r.maxSeqs >= 1 ? { batch: s.batch, tpot: r.tpot, perUser: r.perUser, perDevice: r.perDevice } : null
  const seqTokens = s.prompt + s.output

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Card title="Serving workload">
          <Seg label="Context per request (prompt tokens)" options={[1024, 4096, 8192, 16384, 32768, 65536, 131072] as const}
            value={s.prompt as 8192} format={kLabel} onChange={v => set('prompt', v)} />
          <Seg label="Output tokens per request" options={[256, 1024, 4096, 16384] as const}
            value={s.output as 1024} format={kLabel} onChange={v => set('output', v)} />
          <NumInput label={`Concurrent sequences per engine${ep && par.dp > 1 ? ' (per DP rank)' : ''}`} value={s.batch}
            min={1} max={4096} onChange={v => set('batch', Math.round(v))} />
          <div className="grid grid-cols-2 gap-3">
            <Seg label="Weights" options={['bf16', 'fp8'] as const} value={s.wDtype} format={v => v.toUpperCase()} onChange={v => set('wDtype', v)} />
            <Seg label="KV cache" options={['bf16', 'fp8'] as const} value={s.kvDtype} format={v => v.toUpperCase()} onChange={v => set('kvDtype', v)} />
          </div>
        </Card>

        <Card title="Parallel layout">
          <div className="grid grid-cols-2 gap-4">
            <Seg label="TP (tensor)" options={[1, 2, 4, 8, 16] as const} value={par.tp as 1} onChange={v => setPar({ ...par, tp: v })} />
            <Seg label="PP (pipeline)" options={[1, 2, 4, 8] as const} value={par.pp as 1} onChange={v => setPar({ ...par, pp: v })} />
            <NumInput label={ep ? 'DP (attention ranks)' : 'DP (replicas)'} value={par.dp} min={1} max={256}
              onChange={v => setPar({ ...par, dp: Math.round(v) })} />
            <Seg label={model.moe ? 'Expert parallel' : 'Expert parallel (MoE only)'} options={['off', 'on'] as const}
              value={par.ep ? 'on' : 'off'} disabled={!model.moe} onChange={v => setPar({ ...par, ep: v === 'on' })} />
          </div>
          <div className="font-mono text-xs px-3 py-2 rounded leading-relaxed" style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-muted)' }}>
            {unit} = TP × PP × DP = {par.tp} × {par.pp} × {par.dp} = <span style={{ color: 'var(--text-bright)' }}>{r.devices}</span> ({r.nodes} node{r.nodes > 1 ? 's' : ''} of {nodeSize}).
            {ep
              ? ` Experts are spread over EP = TP × DP = ${par.tp * par.dp} ${unit}; attention runs data parallel.`
              : par.dp > 1 ? ` ${par.dp} independent copies of a ${par.tp * par.pp}-${unit.slice(0, -1)} engine.` : ''}
          </div>
          {smallest
            ? <p className="text-sm" style={{ color: 'var(--text)' }}>
                Smallest engine that serves {s.batch} concurrent {seqTokens.toLocaleString()}-token request{s.batch > 1 ? 's' : ''}:{' '}
                <span className="font-semibold" style={{ color: 'var(--text-bright)' }}>{smallest.devices} {unit}</span>.
                {!isCur(smallest) && <LoadButton onClick={() => setPar(smallest.par)} />}
              </p>
            : <p className="text-sm" style={{ color: '#ef4444' }}>
                No layout up to TP 16 × PP 8 fits. Try fewer concurrent sequences, FP8 weights, FP8 KV cache or a shorter context.
              </p>}
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label={unit} value={String(r.devices)} sub={`${r.nodes} node${r.nodes > 1 ? 's' : ''} · max ${r.maxSeqs.toLocaleString()} sequences`} />
        <Stat label="Time to first token" value={fmtTime(r.ttft)} sub={`prefill of ${s.prompt.toLocaleString()} tokens`} />
        <Stat label="Time per output token" value={fmtTime(r.tpot)} sub={`${fmtRate(r.perUser)} tok/s per user · ${fmtTime(r.e2e)} end to end`} />
        <Stat label="Decode throughput" value={`${fmtRate(r.total)} tok/s`} sub={`${fmtRate(r.perDevice)} per device`} />
      </div>

      <Card title="Throughput vs latency">
        <LatencyChart points={r.sweep} current={current} />
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
          Each point is one batch size. At small batches every step reads all the weights to produce
          a handful of tokens, so adding sequences is nearly free and throughput climbs. As the batch
          grows, reading each sequence's KV cache (and eventually compute) dominates, so latency rises
          while throughput flattens. The curve ends where the KV cache runs out of memory.
        </p>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Card title="Memory per device">
          <MemRows usable={r.usable} total={r.mem.total} capacityGB={hw.memGB} rows={[
            { label: 'Weights', note: `${s.wDtype.toUpperCase()}, busiest stage${ep ? `, experts ÷${par.tp * par.dp}` : ''}`, bytes: r.mem.weights },
            { label: 'KV cache', note: `${s.batch} seqs × ${seqTokens.toLocaleString()} tokens × ${fmtBytes(r.kvPerTokenDev)}/token`, bytes: r.mem.kv },
            { label: 'Runtime reserve', note: 'CUDA graphs, workspace, FP32 logits', bytes: r.mem.reserve },
          ]} />
        </Card>
        <Card title="Validity checks">
          <Checks checks={r.checks} />
        </Card>
      </div>

      <Card title="Where the traffic goes">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
          Ranks are numbered with TP fastest, then DP, then PP. Click any device to see its groups.
        </p>
        <DeviceMesh key={`${par.tp}-${par.pp}-${par.dp}-${par.ep}-${nodeSize}`}
          devices={r.devices} nodeSize={nodeSize} dims={dims} />
      </Card>

      <Card title="Valid engine layouts">
        <div className="flex flex-wrap gap-2">
          {(['devices', 'latency', 'throughput'] as const).map(k => (
            <button key={k} onClick={() => setSort(k)}
              className="font-mono text-xs px-2.5 py-1 rounded border transition-colors" style={sort === k ? on : off}>
              {k === 'devices' ? `Fewest ${unit}` : k === 'latency' ? 'Lowest latency' : 'Most tokens/s per device'}
            </button>
          ))}
        </div>
        {top.length > 0
          ? <ConfigTable<InferResult>
              headers={['TP', 'PP', 'DP', 'EP', unit, 'max seqs', 'ms/token @1', 'peak tok/s/device']}
              rows={top}
              cells={x => [x.par.tp, x.par.pp, x.par.dp, x.par.ep ? x.par.tp * x.par.dp : '-', x.devices, x.maxSeqs.toLocaleString(),
                ((x.sweep[0]?.tpot ?? 0) * 1e3).toFixed(1), fmtRate(peak(x))]}
              isCurrent={isCur}
              onPick={x => setPar(x.par)} />
          : <p className="text-sm" style={{ color: 'var(--text-muted)' }}>None.</p>}
        <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
          Click a row to load it. "Peak" is at the largest batch the KV cache allows.
        </p>
      </Card>
    </div>
  )
}
