import { guess } from 'web-audio-beat-detector'

export async function estimateBpm(buffer: AudioBuffer): Promise<{
  bpm: number
  offset: number
  tempo: number
} | null> {
  try {
    const r = (await guess(buffer)) as { bpm: number; offset: number; tempo?: number }
    return { bpm: r.bpm, offset: r.offset, tempo: r.tempo ?? r.bpm }
  } catch {
    return null
  }
}
