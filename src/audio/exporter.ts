/**
 * Renders a stereo mix of beat + sample with static crossfade and playback-rate pitch.
 *
 * MVP: linear playback from t=0 (no recorded scratch gesture timeline). Extend with an event log
 * to replay Auto/Manual moves offline.
 */

export interface ExportGraphOptions {
  sampleRate?: number
  beatBuffer: AudioBuffer
  sampleBuffer: AudioBuffer
  /** -1 beat only … +1 sample only */
  crossfader: number
  beatRate?: number
  sampleRateMul?: number
}

function equalPowerGains(crossfader: number): { gBeat: number; gSample: number } {
  const p = (crossfader + 1) / 2
  const gBeat = Math.cos((p * Math.PI) / 2)
  const gSample = Math.sin((p * Math.PI) / 2)
  return { gBeat, gSample }
}

export async function renderMixOffline(opts: ExportGraphOptions): Promise<AudioBuffer> {
  const sampleRate = opts.sampleRate ?? opts.beatBuffer.sampleRate
  const duration = Math.max(opts.beatBuffer.duration, opts.sampleBuffer.duration)
  const offline = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate)

  const { gBeat, gSample } = equalPowerGains(opts.crossfader)
  const beatGain = offline.createGain()
  const sampleGain = offline.createGain()
  beatGain.gain.value = gBeat
  sampleGain.gain.value = gSample

  const beatSrc = offline.createBufferSource()
  beatSrc.buffer = opts.beatBuffer
  beatSrc.playbackRate.value = opts.beatRate ?? 1
  beatSrc.connect(beatGain)

  const sampleSrc = offline.createBufferSource()
  sampleSrc.buffer = opts.sampleBuffer
  sampleSrc.playbackRate.value = opts.sampleRateMul ?? 1
  sampleSrc.connect(sampleGain)

  beatGain.connect(offline.destination)
  sampleGain.connect(offline.destination)

  beatSrc.start(0)
  sampleSrc.start(0)

  return offline.startRendering()
}

export function encodeWavInterleaved(stereoBuffer: AudioBuffer): Blob {
  const numChannels = stereoBuffer.numberOfChannels
  const sampleRate = stereoBuffer.sampleRate
  const format = 1
  const bitDepth = 16
  const samples = stereoBuffer.length
  const blockAlign = (numChannels * bitDepth) / 8
  const byteRate = sampleRate * blockAlign
  const dataSize = samples * blockAlign
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  function writeString(offset: number, s: string) {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i))
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, format, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  const ch0 = stereoBuffer.getChannelData(0)
  const ch1 = numChannels > 1 ? stereoBuffer.getChannelData(1) : stereoBuffer.getChannelData(0)
  let offset = 44
  for (let i = 0; i < samples; i++) {
    for (const ch of [ch0, ch1]) {
      const s = Math.max(-1, Math.min(1, ch[i]))
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
      offset += 2
    }
  }

  return new Blob([buffer], { type: 'audio/wav' })
}
