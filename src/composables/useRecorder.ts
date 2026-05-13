import { computed, onUnmounted, ref, shallowRef } from 'vue'

export type RecorderState = 'idle' | 'recording' | 'paused' | 'stopped'

export function useRecorder() {
  const state = ref<RecorderState>('idle')
  const error = ref<string | null>(null)
  const chunks = shallowRef<Blob[]>([])
  const mimeType = ref('audio/webm')

  const mediaRecorder = shallowRef<MediaRecorder | null>(null)
  const stream = shallowRef<MediaStream | null>(null)

  const canUse = computed(() => typeof MediaRecorder !== 'undefined')

  function pickMime(): string {
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
    for (const m of candidates) {
      if (MediaRecorder.isTypeSupported(m)) return m
    }
    return ''
  }

  async function start() {
    error.value = null
    chunks.value = []
    mimeType.value = pickMime() || 'audio/webm'
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.value = s
      const mr = new MediaRecorder(s, mimeType.value ? { mimeType: mimeType.value } : undefined)
      mediaRecorder.value = mr
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.value = [...chunks.value, e.data]
      }
      mr.start(100)
      state.value = 'recording'
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Microphone error'
      state.value = 'idle'
      stream.value = null
    }
  }

  function pause() {
    if (mediaRecorder.value?.state === 'recording') {
      mediaRecorder.value.pause()
      state.value = 'paused'
    }
  }

  function resume() {
    if (mediaRecorder.value?.state === 'paused') {
      mediaRecorder.value.resume()
      state.value = 'recording'
    }
  }

  function stop() {
    const mr = mediaRecorder.value
    if (!mr || mr.state === 'inactive') return
    mr.stop()
    state.value = 'stopped'
    stream.value?.getTracks().forEach((t) => t.stop())
    stream.value = null
    mediaRecorder.value = null
  }

  function discard() {
    stop()
    chunks.value = []
    state.value = 'idle'
  }

  async function buildBlob(): Promise<Blob | null> {
    if (!chunks.value.length) return null
    return new Blob(chunks.value, { type: mimeType.value })
  }

  onUnmounted(() => {
    discard()
  })

  return {
    state,
    error,
    chunks,
    mimeType,
    stream,
    canUse,
    start,
    pause,
    resume,
    stop,
    discard,
    buildBlob,
  }
}
