export type ScratchPatternId = 'baby' | 'chirp' | 'forward' | 'transformer' | 'flare'

export type CueBarLength = '1/16' | '1/8' | '1/4'

export interface BeatManifestEntry {
  id: string
  title: string
  bpm: number
  key: string
  file: string
  cover: string
  length: number
}

export interface CuePoint {
  id: string
  /** Seconds into the sample waveform */
  time: number
  pattern: ScratchPatternId
  length: CueBarLength
  /** 0–100 */
  intensity: number
  tag: string
  /** 0–7 palette index */
  colorIndex: number
}

export const CUE_COLORS = [
  '#f59e0b',
  '#38bdf8',
  '#a78bfa',
  '#34d399',
  '#fb7185',
  '#fbbf24',
  '#2dd4bf',
  '#c084fc',
] as const
