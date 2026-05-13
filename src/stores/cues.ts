import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { CuePoint, ScratchPatternId } from '@/types/studio'
import { CUE_COLORS } from '@/types/studio'

export const MAX_CUES = 8

let cueId = 0
function nextCueId() {
  cueId += 1
  return `cue-${cueId}`
}

export const useCuesStore = defineStore('cues', () => {
  const cues = ref<CuePoint[]>([])

  const sorted = computed(() => [...cues.value].sort((a, b) => a.time - b.time))

  function canAdd() {
    return cues.value.length < MAX_CUES
  }

  function addAtTime(timeSec: number) {
    if (!canAdd()) return null
    const colorIndex = cues.value.length % CUE_COLORS.length
    const cue: CuePoint = {
      id: nextCueId(),
      time: Math.max(0, timeSec),
      pattern: 'baby',
      length: '1/8',
      intensity: 70,
      tag: '',
      colorIndex,
    }
    cues.value = [...cues.value, cue]
    return cue
  }

  function updateCue(id: string, patch: Partial<Omit<CuePoint, 'id'>>) {
    cues.value = cues.value.map((c) => (c.id === id ? { ...c, ...patch } : c))
  }

  function removeCue(id: string) {
    cues.value = cues.value.filter((c) => c.id !== id)
  }

  function clear() {
    cues.value = []
  }

  /** Replace all cues (used by Magic mode). */
  function setCues(next: CuePoint[]) {
    cues.value = next.slice(0, MAX_CUES)
  }

  function setPatternForAll(pattern: ScratchPatternId) {
    cues.value = cues.value.map((c) => ({ ...c, pattern }))
  }

  return {
    cues,
    sorted,
    canAdd,
    addAtTime,
    updateCue,
    removeCue,
    clear,
    setCues,
    setPatternForAll,
    MAX_CUES,
    CUE_COLORS,
  }
})
