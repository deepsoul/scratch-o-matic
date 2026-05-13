import Meyda from 'meyda'
import type { CuePoint, ScratchPatternId } from '@/types/studio'
import { CUE_COLORS } from '@/types/studio'

export interface MagicAnalysis {
  /** 0 = noise-like, higher = more tonal */
  spectralCentroidMean: number
  rmsMean: number
  zcrMean: number
  /** Normalized onset indices 0..1 along buffer */
  onsetStrengths: { t: number; strength: number }[]
}

export interface MagicStrategy {
  readonly id: string
  analyze(buffer: AudioBuffer): Promise<MagicAnalysis>
  buildCues(analysis: MagicAnalysis, buffer: AudioBuffer): CuePoint[]
}

function bufferToMono(buffer: AudioBuffer): Float32Array {
  const len = buffer.length
  const ch0 = buffer.getChannelData(0)
  if (buffer.numberOfChannels === 1) return ch0.slice()
  const out = new Float32Array(len)
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const ch = buffer.getChannelData(c)
    for (let i = 0; i < len; i++) out[i] += ch[i]
  }
  const scale = 1 / buffer.numberOfChannels
  for (let i = 0; i < len; i++) out[i] *= scale
  return out
}

function pickPattern(centroid: number, zcr: number, rms: number): ScratchPatternId {
  const vocalish = centroid > 2200 && zcr < 0.12
  const drumish = zcr > 0.14 && rms > 0.08
  if (drumish) return 'flare'
  if (vocalish) return 'transformer'
  if (centroid > 3000) return 'chirp'
  if (rms < 0.04) return 'baby'
  return 'forward'
}

export class HeuristicMagicStrategy implements MagicStrategy {
  readonly id = 'heuristic-meyda-v1'

  async analyze(buffer: AudioBuffer): Promise<MagicAnalysis> {
    const mono = bufferToMono(buffer)
    const sr = buffer.sampleRate
    const hop = 1024
    let centroidSum = 0
    let zcrSum = 0
    let rmsSum = 0
    let frames = 0
    const strengths: { t: number; strength: number }[] = []
    let prevMag = 0

    for (let offset = 0; offset + hop < mono.length; offset += hop) {
      const slice = mono.subarray(offset, offset + hop)
      Meyda.bufferSize = hop
      Meyda.sampleRate = sr
      const features = Meyda.extract(['rms', 'spectralCentroid', 'zcr'], slice)
      if (!features) continue
      const c = features.spectralCentroid ?? 0
      const z = features.zcr ?? 0
      const r = features.rms ?? 0
      centroidSum += c
      zcrSum += z
      rmsSum += r
      frames += 1
      const mag = r * r + Math.abs(c - prevMag) * 0.0001
      strengths.push({ t: offset / mono.length, strength: mag })
      prevMag = c
    }

    return {
      spectralCentroidMean: frames ? centroidSum / frames : 0,
      zcrMean: frames ? zcrSum / frames : 0,
      rmsMean: frames ? rmsSum / frames : 0,
      onsetStrengths: strengths,
    }
  }

  buildCues(analysis: MagicAnalysis, buffer: AudioBuffer): CuePoint[] {
    const sorted = [...analysis.onsetStrengths].sort((a, b) => b.strength - a.strength)
    const picks = sorted.slice(0, 6)
    picks.sort((a, b) => a.t - b.t)

    const pattern = pickPattern(analysis.spectralCentroidMean, analysis.zcrMean, analysis.rmsMean)

    return picks.map((p, i) => ({
      id: `magic-${i}-${Math.random().toString(36).slice(2, 7)}`,
      time: Math.min(buffer.duration - 0.01, Math.max(0, p.t * buffer.duration)),
      pattern,
      length: (['1/16', '1/8', '1/4'] as const)[i % 3],
      intensity: 55 + (i % 3) * 10,
      tag: 'magic',
      colorIndex: i % CUE_COLORS.length,
    }))
  }
}

/** Placeholder for future remote / ML strategy. */
export type RemoteMagicStrategy = MagicStrategy & { readonly endpoint: string }
