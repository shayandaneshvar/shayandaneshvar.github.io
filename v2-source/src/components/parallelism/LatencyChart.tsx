import { useEffect, useRef, useState } from 'react'
import { fmtRate, type InferPoint } from './calc'

// Decode throughput per device (y) against time per output token (x), one point per batch
// size from 1 up to the KV-cache limit. Single series, so no legend: the title names it.

const M = { top: 16, right: 20, bottom: 40, left: 56 }

// Ticks from 0 up to the first clean value at or above max, so the domain always
// contains every point.
function niceTicks(max: number, count = 5): number[] {
  const raw = max / count
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const step = [1, 2, 2.5, 5, 10].map(f => f * mag).find(s => s >= raw) ?? raw
  return Array.from({ length: Math.ceil(max / step - 1e-9) + 1 }, (_, i) => +(i * step).toFixed(6))
}

export default function LatencyChart({ points, current }: { points: InferPoint[]; current: InferPoint | null }) {
  const ref = useRef<SVGSVGElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  // Render at the container's real pixel width so text stays 11px on phones and desktops.
  const [W, setW] = useState(640)
  const empty = points.length === 0
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [empty])   // the measured element is swapped when the chart empties or fills
  const H = Math.round(Math.min(320, Math.max(220, W * 0.42)))
  const PW = W - M.left - M.right
  const PH = H - M.top - M.bottom

  // The measured container always renders so the ResizeObserver stays attached.
  if (empty) {
    return (
      <div ref={boxRef}>
        <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
          Nothing to plot: not even one sequence fits in memory with this configuration.
        </p>
      </div>
    )
  }

  const all = current ? [...points, current] : points
  const xTicks = niceTicks(Math.max(...all.map(p => p.tpot * 1e3)) * 1.05, W < 480 ? 4 : 6)
  const yTicks = niceTicks(Math.max(...all.map(p => p.perDevice)) * 1.08)
  const xMax = xTicks.at(-1)!
  const yMax = yTicks.at(-1)!
  const sx = (ms: number) => M.left + (ms / xMax) * PW
  const sy = (v: number) => M.top + PH - (v / yMax) * PH
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${sx(p.tpot * 1e3).toFixed(1)},${sy(p.perDevice).toFixed(1)}`).join(' ')

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const box = ref.current!.getBoundingClientRect()
    const x = ((e.clientX - box.left) / box.width) * W
    let best = 0
    points.forEach((p, i) => {
      if (Math.abs(sx(p.tpot * 1e3) - x) < Math.abs(sx(points[best].tpot * 1e3) - x)) best = i
    })
    setHover(best)
  }

  const hp = hover !== null ? points[hover] : null

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium" style={{ color: 'var(--text-bright)' }}>
        Decode throughput vs latency, batch 1 up to the KV cache limit
      </p>
      <div ref={boxRef} className="relative">
        <svg ref={ref} width={W} height={H} className="block select-none"
          onPointerMove={onMove} onPointerLeave={() => setHover(null)}
          role="img" aria-label="Decode throughput per device against time per output token">
          {yTicks.map(t => (
            <g key={`y${t}`}>
              <line x1={M.left} x2={W - M.right} y1={sy(t)} y2={sy(t)} stroke="var(--border-soft)" strokeWidth={1} />
              <text x={M.left - 8} y={sy(t) + 4} textAnchor="end" fontSize={11} fill="var(--text-muted)"
                style={{ fontVariantNumeric: 'tabular-nums' }}>{t.toLocaleString()}</text>
            </g>
          ))}
          {xTicks.map(t => (
            <text key={`x${t}`} x={sx(t)} y={H - M.bottom + 18} textAnchor="middle" fontSize={11}
              fill="var(--text-muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>{t}</text>
          ))}
          <line x1={M.left} x2={W - M.right} y1={M.top + PH} y2={M.top + PH} stroke="var(--border)" strokeWidth={1} />
          <text x={M.left + PW / 2} y={H - 4} textAnchor="middle" fontSize={11} fill="var(--text-muted)">
            time per output token (ms), lower is more interactive
          </text>
          <text x={14} y={M.top + PH / 2} textAnchor="middle" fontSize={11} fill="var(--text-muted)"
            transform={`rotate(-90 14 ${M.top + PH / 2})`}>output tokens/s per device</text>

          {hp && (
            <line x1={sx(hp.tpot * 1e3)} x2={sx(hp.tpot * 1e3)} y1={M.top} y2={M.top + PH}
              stroke="var(--text-muted)" strokeWidth={1} />
          )}
          <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, i) => (
            <circle key={p.batch} cx={sx(p.tpot * 1e3)} cy={sy(p.perDevice)} r={hover === i ? 6 : 4}
              fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
          ))}
          {current && (
            <g>
              <circle cx={sx(current.tpot * 1e3)} cy={sy(current.perDevice)} r={7}
                fill="var(--surface)" stroke="var(--accent)" strokeWidth={2} />
              <circle cx={sx(current.tpot * 1e3)} cy={sy(current.perDevice)} r={3} fill="var(--accent)" />
              <text x={sx(current.tpot * 1e3) + (sx(current.tpot * 1e3) > W * 0.7 ? -11 : 11)}
                y={sy(current.perDevice) + 18} fontSize={11}
                textAnchor={sx(current.tpot * 1e3) > W * 0.7 ? 'end' : 'start'}
                fill="var(--text-bright)">your batch ({current.batch})</text>
            </g>
          )}
        </svg>

        {hp && (
          <div className="absolute pointer-events-none rounded border px-3 py-2 font-mono text-xs shadow-lg"
            style={{
              left: `${(sx(hp.tpot * 1e3) / W) * 100}%`, top: 8,
              transform: sx(hp.tpot * 1e3) > W * 0.6 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)',
              backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)',
            }}>
            <div><span style={{ color: 'var(--text-bright)' }} className="font-semibold">{fmtRate(hp.perDevice)}</span> tok/s per device</div>
            <div><span style={{ color: 'var(--text-bright)' }} className="font-semibold">{(hp.tpot * 1e3).toFixed(1)} ms</span> per token</div>
            <div><span style={{ color: 'var(--text-bright)' }} className="font-semibold">{fmtRate(hp.perUser)}</span> tok/s per user</div>
            <div>batch {hp.batch}</div>
          </div>
        )}
      </div>

      <details className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
        <summary className="cursor-pointer">Table view</summary>
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
            <thead>
              <tr style={{ color: 'var(--text)' }}>
                <th className="py-1 pr-3">batch</th><th className="py-1 pr-3">ms / token</th>
                <th className="py-1 pr-3">tok/s per user</th><th className="py-1">tok/s per device</th>
              </tr>
            </thead>
            <tbody>
              {points.map(p => (
                <tr key={p.batch} className="border-t" style={{ borderColor: 'var(--border-soft)' }}>
                  <td className="py-1 pr-3">{p.batch}</td><td className="py-1 pr-3">{(p.tpot * 1e3).toFixed(1)}</td>
                  <td className="py-1 pr-3">{fmtRate(p.perUser)}</td><td className="py-1">{fmtRate(p.perDevice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
