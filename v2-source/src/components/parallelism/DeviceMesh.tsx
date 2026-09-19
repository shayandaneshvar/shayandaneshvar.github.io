import { useState } from 'react'

// Devices laid out in their nodes. Pick a device and a dimension to see which devices it
// talks to over that dimension, and whether that traffic stays on the fast in-node links.

export interface MeshDim {
  key: string
  label: string
  size: number
  comm: string
  // Devices with equal group keys communicate over this dimension. Defaults to "all other
  // coordinates equal". A dim with groupKey is virtual: it regroups existing ranks (EP
  // folding) instead of adding a mesh axis, so it takes no part in rank striding.
  groupKey?: (c: Record<string, number>) => string
}

const MAX_RENDER = 512

function coordsOf(rank: number, dims: MeshDim[]): Record<string, number> {
  const c: Record<string, number> = {}
  let stride = 1
  for (const d of dims.filter(x => !x.groupKey)) {
    c[d.key] = Math.floor(rank / stride) % d.size
    stride *= d.size
  }
  return c
}

function keyFor(dim: MeshDim, c: Record<string, number>, dims: MeshDim[]): string {
  if (dim.groupKey) return dim.groupKey(c)
  return dims.filter(d => d.key !== dim.key && !d.groupKey).map(d => c[d.key]).join(',')
}

function ranges(ns: number[]): string {
  const out: string[] = []
  let i = 0
  while (i < ns.length) {
    let j = i
    while (j + 1 < ns.length && ns[j + 1] === ns[j] + 1) j++
    out.push(j > i ? `${ns[i]}–${ns[j]}` : `${ns[i]}`)
    i = j + 1
  }
  return out.length > 6 ? `${out.slice(0, 6).join(', ')}, …` : out.join(', ')
}

export default function DeviceMesh({ devices, nodeSize, dims }: {
  devices: number; nodeSize: number; dims: MeshDim[]   // dims ordered fastest-varying first
}) {
  const active = dims.filter(d => d.size > 1)
  const [dimKey, setDimKey] = useState<string>(active[0]?.key ?? '')
  const [picked, setPicked] = useState(0)

  const dim = active.find(d => d.key === dimKey) ?? active[0]
  const sel = picked < devices ? picked : 0
  const shown = Math.min(devices, MAX_RENDER)
  const selKey = dim ? keyFor(dim, coordsOf(sel, dims), dims) : ''
  const members: number[] = []
  if (dim) {
    for (let r = 0; r < devices; r++) if (keyFor(dim, coordsOf(r, dims), dims) === selKey) members.push(r)
  }
  const memberSet = new Set(members)
  const nodesSpanned = new Set(members.map(r => Math.floor(r / nodeSize))).size
  const nodeCount = Math.ceil(shown / nodeSize)
  const cols = nodeSize === 16 ? 8 : 4

  if (!dim) {
    return (
      <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
        Every dimension is 1: a single device, nothing to communicate.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>Show group:</span>
        {active.map(d => (
          <button key={d.key} onClick={() => setDimKey(d.key)}
            className="font-mono text-xs px-2.5 py-1 rounded border transition-colors"
            style={d.key === dim.key
              ? { color: 'var(--bg)', backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }
              : { color: 'var(--text)', borderColor: 'var(--border)' }}>
            {d.label} {d.size}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {Array.from({ length: nodeCount }, (_, n) => (
          <div key={n} className="rounded border p-2" style={{ borderColor: 'var(--border)' }}>
            <p className="font-mono mb-1.5" style={{ color: 'var(--text-muted)', fontSize: 10 }}>node {n}</p>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, 1.75rem)` }}>
              {Array.from({ length: nodeSize }, (_, i) => {
                const r = n * nodeSize + i
                if (r >= shown) return <div key={i} className="h-7 rounded border border-dashed" style={{ borderColor: 'var(--border-soft)' }} />
                const isSel = r === sel
                const inGroup = memberSet.has(r)
                return (
                  <button key={i} onClick={() => setPicked(r)} aria-label={`device ${r}`}
                    className="h-7 rounded border font-mono transition-colors"
                    style={{
                      fontSize: 10,
                      borderColor: inGroup ? 'var(--accent)' : 'var(--border)',
                      backgroundColor: isSel ? 'var(--accent)' : inGroup ? 'var(--accent-20)' : 'var(--surface-2)',
                      color: isSel ? 'var(--bg)' : inGroup ? 'var(--text-bright)' : 'var(--text-muted)',
                    }}>
                    {r}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Device <span style={{ color: 'var(--text-bright)' }}>{sel}</span>'s {dim.label} group:
        devices {ranges(members)} ({members.length}).{' '}
        {nodesSpanned === 1
          ? <span style={{ color: 'var(--text-bright)' }}>Stays inside one node.</span>
          : <span style={{ color: 'var(--text-bright)' }}>Crosses {nodesSpanned} nodes.</span>}{' '}
        Traffic: {dim.comm}.
        {devices > MAX_RENDER && ` Showing the first ${MAX_RENDER} of ${devices} devices.`}
      </p>
    </div>
  )
}
