import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'

export type SampleSourceKind = 'none' | 'upload' | 'recording'

export const MAX_SAMPLE_BYTES = 30 * 1024 * 1024

export const ACCEPT_SAMPLE_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.ogg'] as const

export const useSampleStore = defineStore('sample', () => {
  const buffer = shallowRef<AudioBuffer | null>(null)
  const sourceKind = ref<SampleSourceKind>('none')
  const displayName = ref<string | null>(null)
  const byteSize = ref(0)
  const lastError = ref<string | null>(null)

  const duration = computed(() => buffer.value?.duration ?? 0)
  const sampleRate = computed(() => buffer.value?.sampleRate ?? 0)

  function setBuffer(
    next: AudioBuffer,
    meta: { source: SampleSourceKind; name?: string; sizeBytes?: number },
  ) {
    buffer.value = next
    sourceKind.value = meta.source
    displayName.value = meta.name ?? null
    byteSize.value = meta.sizeBytes ?? next.length * next.numberOfChannels * 4
    lastError.value = null
  }

  function setError(message: string) {
    lastError.value = message
  }

  function clearError() {
    lastError.value = null
  }

  function clear() {
    buffer.value = null
    sourceKind.value = 'none'
    displayName.value = null
    byteSize.value = 0
    lastError.value = null
  }

  return {
    buffer,
    sourceKind,
    displayName,
    byteSize,
    lastError,
    duration,
    sampleRate,
    setBuffer,
    setError,
    clearError,
    clear,
  }
})
