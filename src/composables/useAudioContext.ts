import { shallowRef } from 'vue'

export function useAudioContext() {
  const ctx = shallowRef<AudioContext | null>(null)

  function ensureContext(): AudioContext {
    if (!ctx.value) {
      ctx.value = new AudioContext({ latencyHint: 'interactive' })
    }
    return ctx.value
  }

  async function resumeFromGesture(): Promise<AudioContext> {
    const c = ensureContext()
    if (c.state === 'suspended') await c.resume()
    return c
  }

  return { ctx, ensureContext, resumeFromGesture }
}
