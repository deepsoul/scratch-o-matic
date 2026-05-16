<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import WaveSurfer from 'wavesurfer.js'

const props = withDefaults(
  defineProps<{
    peaks: Float32Array | number[]
    duration: number
    currentTime?: number
    interact?: boolean
    enableSeek?: boolean
    minPxPerSec?: number
    /** Sync playhead from transport only while playing. */
    followPlayhead?: boolean
  }>(),
  {
    interact: true,
    currentTime: 0,
    minPxPerSec: 40,
    enableSeek: true,
    followPlayhead: false,
  },
)

const emit = defineEmits<{
  seek: [time: number]
  scratchMove: [normX: number]
  scratchEnd: []
  tap: [time: number]
}>()

const root = ref<HTMLElement | null>(null)
let ws: WaveSurfer | null = null
let localScrub = false
let programmaticSeek = false
let lastPeaksSig = ''
let lastDuration = 0
let lastEnableSeek = true
let lastMinPx = 40

function peaksSignature(peaks: Float32Array | number[]): string {
  const len = peaks.length
  if (!len) return '0'
  const a = peaks[0]
  const b = peaks[Math.floor(len / 2)]
  const c = peaks[len - 1]
  return `${len}:${a}:${b}:${c}`
}

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
    duration: Math.max(0.001, props.duration),
    waveColor: '#2a3140',
    progressColor: '#f59e0b',
    cursorColor: '#fbbf24',
    interact: props.interact,
    minPxPerSec: props.minPxPerSec,
    fillParent: true,
    autoScroll: false,
    autoCenter: false,
    dragToSeek: props.enableSeek ? { debounceTime: 60 } : false,
  })
  ws.on('interaction', (t) => {
    if (programmaticSeek) return
    emit('tap', t)
    if (props.enableSeek) {
      localScrub = true
      emit('seek', t)
      queueMicrotask(() => {
        localScrub = false
      })
    }
  })
  ws.on('drag', (rx) => {
    if (programmaticSeek) return
    emit('scratchMove', rx * 2 - 1)
  })
  ws.on('dragend', () => {
    if (programmaticSeek) return
    emit('scratchEnd')
  })

  lastPeaksSig = peaksSignature(peakArray)
  lastDuration = props.duration
  lastEnableSeek = props.enableSeek
  lastMinPx = props.minPxPerSec
}

function syncIfNeeded() {
  const peakArray =
    props.peaks instanceof Float32Array ? props.peaks : Float32Array.from(props.peaks)
  const sig = peaksSignature(peakArray)
  const durationChanged = Math.abs(props.duration - lastDuration) > 0.001
  const seekModeChanged = props.enableSeek !== lastEnableSeek
  const zoomChanged = props.minPxPerSec !== lastMinPx
  if (!ws || sig !== lastPeaksSig || durationChanged || seekModeChanged || zoomChanged) {
    buildWs()
    seekProgrammatic(props.currentTime ?? 0)
  }
}

function seekProgrammatic(t: number) {
  if (!ws) return
  programmaticSeek = true
  try {
    ws.setTime(t)
  } finally {
    queueMicrotask(() => {
      programmaticSeek = false
    })
  }
}

onMounted(() => {
  buildWs()
})

watch(
  () => [props.peaks, props.duration, props.enableSeek, props.minPxPerSec] as const,
  () => syncIfNeeded(),
)

let lastSyncedTime = -1
watch(
  () => [props.currentTime, props.followPlayhead] as const,
  ([t, follow], old) => {
    if (!ws || localScrub) return
    if (follow) {
      if (Math.abs(t - lastSyncedTime) < 0.03) return
      lastSyncedTime = t
      seekProgrammatic(t)
      return
    }
    const prevT = old?.[0]
    if (prevT === undefined || Math.abs(t - prevT) > 0.001) {
      lastSyncedTime = t
      seekProgrammatic(t)
    }
  },
)

onUnmounted(() => destroyWs())
</script>

<template>
  <div ref="root" class="w-full overflow-hidden rounded-lg border border-white/5 bg-studio-bg" />
</template>
