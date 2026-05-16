<script setup lang="ts">
import { computed } from 'vue'
import Waveform from '@/components/deck/Waveform.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiSlider from '@/components/ui/UiSlider.vue'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    peaks: Float32Array | number[]
    duration: number
    currentTime: number
    isPlaying: boolean
    loop: boolean
    pitchPercent: number
    /** Beat deck: waveform seeks; sample deck: cues + scratch drag only. */
    enableWaveformSeek?: boolean
    minPxPerSec?: number
    /** When false, waveform playhead stays put until playback (avoids setTime storms). */
    followPlayhead?: boolean
  }>(),
  { enableWaveformSeek: true, followPlayhead: false },
)

const emit = defineEmits<{
  togglePlay: []
  toggleLoop: []
  'update:pitchPercent': [v: number]
  seek: [time: number]
  scratchMove: [normX: number]
  scratchEnd: []
  tap: [time: number]
}>()

const pitchModel = computed({
  get: () => props.pitchPercent,
  set: (v: number) => emit('update:pitchPercent', v),
})
</script>

<template>
  <section
    class="flex flex-col gap-3 rounded-xl border border-white/5 bg-studio-panel/60 p-4 shadow-inner"
  >
    <header class="flex flex-wrap items-baseline justify-between gap-2">
      <div>
        <h3 class="text-sm font-semibold tracking-wide text-stone-100">{{ title }}</h3>
        <p v-if="subtitle" class="font-mono-display text-xs text-stone-500">{{ subtitle }}</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UiButton type="button" @click="emit('togglePlay')">
          {{ isPlaying ? 'Pause' : 'Play' }}
        </UiButton>
        <UiButton type="button" variant="ghost" @click="emit('toggleLoop')">
          Loop: {{ loop ? 'on' : 'off' }}
        </UiButton>
      </div>
    </header>

    <Waveform
      :peaks="peaks"
      :duration="duration"
      :current-time="currentTime"
      :follow-playhead="followPlayhead"
      :min-px-per-sec="minPxPerSec"
      :enable-seek="enableWaveformSeek"
      @seek="emit('seek', $event)"
      @scratch-move="emit('scratchMove', $event)"
      @scratch-end="emit('scratchEnd')"
      @tap="emit('tap', $event)"
    />

    <UiSlider v-model="pitchModel" :min="-50" :max="50" label="Pitch / speed %" />
  </section>
</template>
