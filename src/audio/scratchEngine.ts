import type { CuePoint, ScratchPatternId } from '@/types/studio'
import { interpolateCurve, PATTERN_LIBRARY } from '@/audio/patterns'

/** Pre-compute reversed buffer for Safari (no negative playbackRate). */
export function reverseBuffer(ctx: BaseAudioContext, input: AudioBuffer): AudioBuffer {
  const channels = input.numberOfChannels
  const length = input.length
  const rate = input.sampleRate
  const out = ctx.createBuffer(channels, length, rate)
  for (let c = 0; c < channels; c++) {
    const src = input.getChannelData(c)
    const dst = out.getChannelData(c)
    for (let i = 0; i < length; i++) dst[i] = src[length - 1 - i]
  }
  return out
}

export interface ScratchEngineOptions {
  audioContext: AudioContext
  forwardBuffer: AudioBuffer
  reversedBuffer: AudioBuffer
  destination: AudioNode
}

/**
 * Rate-modulation scratch approximation.
 *
 * Limits: no stylus/platter physics. WebKit disallows negative `playbackRate`; use `reversedBuffer`
 * with positive rate for backward motion (manual mode). Pattern auto-play uses forward buffer only
 * (magnitudes) for deterministic scheduling — full bidirectional pattern cuts require buffer swaps
 * per segment (future work).
 */
export class ScratchEngine {
  private ctx: AudioContext
  private forward: AudioBuffer
  private reversed: AudioBuffer
  private source: AudioBufferSourceNode | null = null
  private gain: GainNode
  private manualTimer: ReturnType<typeof setInterval> | null = null

  constructor(opts: ScratchEngineOptions) {
    this.ctx = opts.audioContext
    this.forward = opts.forwardBuffer
    this.reversed = opts.reversedBuffer
    this.gain = this.ctx.createGain()
    this.gain.gain.value = 1
    this.gain.connect(opts.destination)
  }

  stop() {
    if (this.manualTimer != null) {
      clearInterval(this.manualTimer)
      this.manualTimer = null
    }
    try {
      this.source?.stop()
    } catch {
      /* already stopped */
    }
    this.source?.disconnect()
    this.source = null
  }

  private clampRate(magnitude: number): number {
    return Math.min(4, Math.max(0.08, magnitude))
  }

  /**
   * Live manual scratch: normalized pointer x in [-1, 1] → signed motion; negative uses reversed buffer.
   */
  startManualFromOffset(offsetSec: number, getNormX: () => number) {
    this.stop()
    let src: AudioBufferSourceNode | null = null
    let usingReverse = false

    this.manualTimer = setInterval(() => {
      const nx = Math.max(-1, Math.min(1, getNormX()))
      const signed = nx * 2.5
      const reverseWanted = signed < 0
      const mag = this.clampRate(Math.abs(signed) + 0.05)
      const buf = reverseWanted ? this.reversed : this.forward
      const startPos = reverseWanted
        ? Math.max(0, this.forward.duration - offsetSec)
        : Math.min(this.forward.duration - 0.001, Math.max(0, offsetSec))

      if (!src || reverseWanted !== usingReverse) {
        try {
          src?.stop()
        } catch {
          /* */
        }
        src?.disconnect()
        const next = this.ctx.createBufferSource()
        src = next
        this.source = next
        usingReverse = reverseWanted
        next.buffer = buf
        next.loop = true
        next.loopStart = 0
        next.loopEnd = buf.duration
        next.connect(this.gain)
        next.playbackRate.value = mag
        next.start(this.ctx.currentTime, startPos)
        return
      }
      src.playbackRate.setTargetAtTime(mag, this.ctx.currentTime, 0.02)
    }, 16)
  }

  /**
   * Forward-buffer pattern (uses magnitude of template curve × intensity).
   */
  playPattern(options: {
    offsetSec: number
    durationSec: number
    pattern: ScratchPatternId
    intensity: number
  }): void {
    this.stop()
    const curve = PATTERN_LIBRARY[options.pattern]
    const ctx = this.ctx
    const t0 = ctx.currentTime + 0.02
    const duration = Math.max(0.08, options.durationSec)
    const intensityScale = 0.4 + (options.intensity / 100) * 1.1

    const src = ctx.createBufferSource()
    this.source = src
    src.buffer = this.forward
    src.connect(this.gain)
    const startOffset = Math.min(this.forward.duration - 0.001, Math.max(0, options.offsetSec))
    src.start(t0, startOffset)

    const steps = 36
    for (let i = 0; i <= steps; i++) {
      const u = i / steps
      const raw = interpolateCurve(curve, u) * intensityScale
      const mag = this.clampRate(Math.abs(raw) + 0.08)
      src.playbackRate.linearRampToValueAtTime(mag, t0 + (duration * i) / steps)
    }
    src.stop(t0 + duration + 0.03)
    src.onended = () => {
      src.disconnect()
      if (this.source === src) this.source = null
    }
  }
}

export function buildCueTimeline(
  cues: CuePoint[],
  beatBpm: number,
  beatDurationSec: number,
): { t: number; cue: CuePoint }[] {
  const sorted = [...cues].sort((a, b) => a.time - b.time)
  if (!sorted.length) return []
  const beatLen = 60 / beatBpm
  const slots: { t: number; cue: CuePoint }[] = []
  let beatIndex = 0
  for (const cue of sorted) {
    const t = Math.min(beatIndex * beatLen, Math.max(0, beatDurationSec - 0.05))
    slots.push({ t, cue })
    beatIndex += 1
  }
  return slots
}
