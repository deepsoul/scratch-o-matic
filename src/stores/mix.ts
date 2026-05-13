import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/** -1 = full beat deck, +1 = full sample deck, 0 = center (equal-power midpoint). */
export type CrossfaderPosition = number

export const useMixStore = defineStore('mix', () => {
  const crossfader = ref<CrossfaderPosition>(0)
  const beatLoop = ref(false)
  const sampleLoop = ref(false)
  /** Playback rate multiplier (1 = original). */
  const beatPlaybackRate = ref(1)
  const samplePlaybackRate = ref(1)
  const tempoSyncEnabled = ref(false)
  const detectedSampleBpm = ref<number | null>(null)
  const selectedBeatId = ref<string | null>(null)
  const beatIsPlaying = ref(false)
  const sampleIsPlaying = ref(false)
  const autoScratchEnabled = ref(false)
  const magicCooking = ref(false)

  const beatPitchPercent = computed({
    get: () => (beatPlaybackRate.value - 1) * 100,
    set: (v: number) => {
      beatPlaybackRate.value = 1 + v / 100
    },
  })

  const samplePitchPercent = computed({
    get: () => (samplePlaybackRate.value - 1) * 100,
    set: (v: number) => {
      samplePlaybackRate.value = 1 + v / 100
    },
  })

  function setCrossfader(v: number, snap = false) {
    let next = Math.max(-1, Math.min(1, v))
    if (snap && Math.abs(next) < 0.08) next = 0
    crossfader.value = next
  }

  return {
    crossfader,
    beatLoop,
    sampleLoop,
    beatPlaybackRate,
    samplePlaybackRate,
    tempoSyncEnabled,
    detectedSampleBpm,
    selectedBeatId,
    beatIsPlaying,
    sampleIsPlaying,
    autoScratchEnabled,
    magicCooking,
    beatPitchPercent,
    samplePitchPercent,
    setCrossfader,
  }
})
