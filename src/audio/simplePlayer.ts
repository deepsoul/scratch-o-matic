export class SimpleBufferPlayer {
  private ctx: AudioContext
  private buffer: AudioBuffer
  readonly gain: GainNode
  private source: AudioBufferSourceNode | null = null
  private startTime = 0
  private startOffset = 0
  loop = false

  constructor(ctx: AudioContext, buffer: AudioBuffer, destination: AudioNode) {
    this.ctx = ctx
    this.buffer = buffer
    this.gain = ctx.createGain()
    this.gain.connect(destination)
  }

  setBuffer(buffer: AudioBuffer) {
    this.stop()
    this.buffer = buffer
    this.startOffset = 0
  }

  isPlaying(): boolean {
    return this.source !== null
  }

  play(rate = 1, when = 0, offset = 0) {
    this.stop()
    const s = this.ctx.createBufferSource()
    this.source = s
    s.buffer = this.buffer
    s.loop = this.loop
    s.playbackRate.value = rate
    s.connect(this.gain)
    const t = this.ctx.currentTime + when
    this.startTime = t
    this.startOffset = offset
    s.start(t, offset)
    if (!this.loop) {
      s.onended = () => {
        if (this.source === s) {
          s.disconnect()
          this.source = null
        }
      }
    }
  }

  stop() {
    try {
      this.source?.stop()
    } catch {
      /* */
    }
    this.source?.disconnect()
    this.source = null
  }

  setPlaybackRate(rate: number) {
    if (!this.source) return
    this.source.playbackRate.setTargetAtTime(rate, this.ctx.currentTime, 0.05)
  }

  getCursorTime(): number {
    if (!this.source) return 0
    const elapsed = this.ctx.currentTime - this.startTime
    const rate = this.source.playbackRate.value
    const t = this.startOffset + elapsed * rate
    return this.loop
      ? ((t % this.buffer.duration) + this.buffer.duration) % this.buffer.duration
      : t
  }
}
