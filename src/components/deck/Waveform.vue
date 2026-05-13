<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import WaveSurfer from 'wavesurfer.js'

const props = withDefaults(
  defineProps<{
    peaks: Float32Array | number[]
    duration: number
    currentTime?: number
    interact?: boolean
    /** When false, drag seeks are disabled (sample scratch mode). */
    enableSeek?: boolean
    minPxPerSec?: number
  }>(),
  { interact: true, currentTime: 0, minPxPerSec: 40, enableSeek: true },
)

const emit = defineEmits<{
  seek: [time: number]
  /** Normalized horizontal scratch axis [-1, 1] while dragging */
  scratchMove: [normX: number]
  scratchEnd: []
  /** Click / tap on waveform — time in seconds */
  tap: [time: number]
}>()

const root = ref<HTMLElement | null>(null)
let ws: WaveSurfer | null = null
let localScrub = false

function destroyWs() {
  ws?.destroy()
  ws = null
}

function buildWs() {
  if (!root.value) return
  destroyWs()
  const peakArray =
    props.peaks instanceof Float32Array ? props.peaks : Float32Array.from(props.peaks)
  ws = WaveSurfer.create({
    container: root.value,
    height: 112,
    peaks: [peakArray],
    duration: props.duration,
    waveColor: '#2a3140',
    progressColor: '#f59e0b',
    cursorColor: '#fbbf24',
    interact: props.interact,
    minPxPerSec: props.minPxPerSec,
    fillParent: true,
    dragToSeek: props.enableSeek ? { debounceTime: 60 } : false,
  })
  ws.on('interaction', (t) => {
    emit('tap', t)
    if (props.enableSeek) {
      localScrub = true
      emit('seek', t)
      queueMicrotask(() => {
        localScrub = false
      })
    }
  })
  ws.on('drag', (rx) => emit('scratchMove', rx * 2 - 1))
  ws.on('dragend', () => emit('scratchEnd'))
}

onMounted(() => {
  buildWs()
})

watch(
  () => [props.peaks, props.duration] as const,
  () => buildWs(),
  { deep: true },
)

watch(
  () => props.currentTime,
  (t) => {
    if (!ws || localScrub) return
    ws.setTime(t)
  },
)

onUnmounted(() => destroyWs())
</script>

<template>
  <div ref="root" class="w-full overflow-hidden rounded-lg border border-white/5 bg-studio-bg" />
</template>
