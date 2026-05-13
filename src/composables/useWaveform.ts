/** Downsample buffer to bar peaks for WaveSurfer (single channel). */
export function bufferToPeaks(buffer: AudioBuffer, barCount = 512): Float32Array {
  const ch = buffer.getChannelData(0)
  const n = ch.length
  const step = Math.max(1, Math.floor(n / barCount))
  const peaks = new Float32Array(barCount)
  for (let i = 0; i < barCount; i++) {
    let max = 0
    const start = i * step
    const end = Math.min(n, start + step)
    for (let j = start; j < end; j++) max = Math.max(max, Math.abs(ch[j]))
    peaks[i] = max
  }
  return peaks
}
