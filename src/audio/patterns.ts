import type { ScratchPatternId } from '@/types/studio'

/**
 * Normalized automation curve: t in [0,1], value is playbackRate multiplier.
 * Safari/WebKit clamp negative rates — reverse motion uses a reversed buffer in scratchEngine.
 */
export type PatternCurve = { t: number; rate: number }[]

export const PATTERN_LIBRARY: Record<ScratchPatternId, PatternCurve> = {
  baby: [
    { t: 0, rate: 0.2 },
    { t: 0.15, rate: -0.35 },
    { t: 0.45, rate: 0.5 },
    { t: 0.75, rate: -0.2 },
    { t: 1, rate: 0 },
  ],
  chirp: [
    { t: 0, rate: 1.2 },
    { t: 0.2, rate: -0.9 },
    { t: 0.5, rate: 1.4 },
    { t: 0.8, rate: -0.4 },
    { t: 1, rate: 0 },
  ],
  forward: [
    { t: 0, rate: 0 },
    { t: 0.25, rate: 0.8 },
    { t: 0.5, rate: 1.2 },
    { t: 0.75, rate: 0.6 },
    { t: 1, rate: 0 },
  ],
  transformer: [
    { t: 0, rate: 0 },
    { t: 0.1, rate: 1 },
    { t: 0.2, rate: 0 },
    { t: 0.3, rate: -0.6 },
    { t: 0.4, rate: 0 },
    { t: 0.5, rate: 1 },
    { t: 0.6, rate: 0 },
    { t: 0.7, rate: -0.6 },
    { t: 0.85, rate: 0.4 },
    { t: 1, rate: 0 },
  ],
  flare: [
    { t: 0, rate: 0.6 },
    { t: 0.12, rate: -0.5 },
    { t: 0.24, rate: 0.7 },
    { t: 0.36, rate: -0.55 },
    { t: 0.48, rate: 0.65 },
    { t: 0.6, rate: -0.45 },
    { t: 0.72, rate: 0.5 },
    { t: 0.84, rate: -0.35 },
    { t: 1, rate: 0 },
  ],
}

export function barLengthToSeconds(bpm: number, len: '1/16' | '1/8' | '1/4'): number {
  const beatSec = 60 / bpm
  const barSec = beatSec * 4
  if (len === '1/16') return barSec / 16
  if (len === '1/8') return barSec / 8
  return barSec / 4
}

export function interpolateCurve(curve: PatternCurve, t: number): number {
  if (t <= curve[0].t) return curve[0].rate
  for (let i = 1; i < curve.length; i++) {
    const a = curve[i - 1]
    const b = curve[i]
    if (t <= b.t) {
      const u = (t - a.t) / (b.t - a.t || 1)
      return a.rate + (b.rate - a.rate) * u
    }
  }
  return curve[curve.length - 1].rate
}
