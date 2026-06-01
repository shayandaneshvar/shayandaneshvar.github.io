export const D_MODEL = 32
export const N_HEADS = 4
export const N_KV_GQA = 2

export function lcg(seed: number) {
  let s = ((seed >>> 0) || 1)
  return () => {
    s = ((Math.imul(1664525, s) + 1013904223) >>> 0)
    return s / 2 ** 32
  }
}

export function softmax(arr: number[]): number[] {
  const max = Math.max(...arr)
  const e = arr.map(x => Math.exp(x - max))
  const sum = e.reduce((a, b) => a + b, 0)
  return e.map(x => x / sum)
}

export function sinusoidalPE(seqLen: number): number[][] {
  return Array.from({ length: seqLen }, (_, pos) =>
    Array.from({ length: D_MODEL }, (_, d) => {
      const i = Math.floor(d / 2)
      const omega = 1 / Math.pow(10000, (2 * i) / D_MODEL)
      return d % 2 === 0 ? Math.sin(pos * omega) : Math.cos(pos * omega)
    })
  )
}

export function ropeFreqs(): number[] {
  return Array.from({ length: D_MODEL / 2 }, (_, i) =>
    1 / Math.pow(10000, (2 * i) / D_MODEL)
  )
}

export function attnWeights(seqLen: number, head: number, layer: number): number[][] {
  const r = lcg(head * 137 + layer * 1009 + 31)
  return Array.from({ length: seqLen }, (_, q) => {
    const scores = Array.from({ length: seqLen }, (_, k) => {
      if (k > q) return -1e9
      return (r() - 0.5) * 3 + (k === q ? 0.5 : 0)
    })
    const finite = scores.filter(x => x > -1e8)
    const max = Math.max(...finite)
    const e = scores.map((s, k) => k > q ? 0 : Math.exp(s - max))
    const sum = e.reduce((a, b) => a + b, 0)
    return e.map(x => sum > 0 ? x / sum : 0)
  })
}

function lerp(t: number, a: number, b: number) {
  return a + Math.max(0, Math.min(1, t)) * (b - a)
}

export type ColorFns = { attn: (w: number) => string; pe: (v: number) => string }

export function makeColors(dark: boolean): ColorFns {
  const bg: [number, number, number] = dark ? [22, 27, 34] : [238, 241, 251]
  const fg: [number, number, number] = dark ? [88, 166, 255] : [37, 99, 235]
  const hot: [number, number, number] = dark ? [248, 113, 113] : [220, 38, 38]

  const rgb = (r: number, g: number, b: number) =>
    `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`

  return {
    attn: (w) => rgb(lerp(w, bg[0], fg[0]), lerp(w, bg[1], fg[1]), lerp(w, bg[2], fg[2])),
    pe: (v) => {
      const t = Math.abs(v)
      const ref: [number, number, number] = v >= 0 ? fg : hot
      return rgb(lerp(t, bg[0], ref[0]), lerp(t, bg[1], ref[1]), lerp(t, bg[2], ref[2]))
    },
  }
}

export interface SampleEntry { token: string; prob: number; cumProb: number }

const RAW_SAMPLES: [string, number][] = [
  ['mat', 4.2], ['floor', 2.8], ['rug', 2.1], ['ground', 1.9], ['bed', 1.3],
  ['grass', 0.7], ['pavement', 0.2], ['sofa', -0.1], ['roof', -0.4],
  ['shelf', -0.7], ['table', -1.0], ['wall', -1.3], ['chair', -1.6],
  ['carpet', -1.9], ['door', -2.2],
]

export function getSamples(): SampleEntry[] {
  const probs = softmax(RAW_SAMPLES.map(x => x[1]))
  let cum = 0
  return RAW_SAMPLES.map(([token], i) => {
    cum += probs[i]
    return { token, prob: probs[i], cumProb: cum }
  })
}
