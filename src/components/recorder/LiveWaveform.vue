<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  stream: MediaStream | null
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let raf = 0
let analyser: AnalyserNode | null = null
let audioCtx: AudioContext | null = null
const data = new Uint8Array(1024)

function draw() {
  const c = canvas.value
  if (!c) return
  const ctx = c.getContext('2d')
  if (!ctx) return
  const w = c.width
  const h = c.height
  ctx.fillStyle = '#0c0e12'
  ctx.fillRect(0, 0, w, h)
  if (analyser) {
    analyser.getByteTimeDomainData(data)
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < w; i++) {
      const v = data[Math.floor((i / w) * data.length)] / 128 - 1
      const y = (1 + v) * 0.5 * h
      if (i === 0) ctx.moveTo(i, y)
      else ctx.lineTo(i, y)
    }
    ctx.stroke()
  }
  raf = requestAnimationFrame(draw)
}

function connect() {
  disconnect()
  if (!props.stream) {
    raf = requestAnimationFrame(draw)
    return
  }
  audioCtx = new AudioContext({ latencyHint: 'interactive' })
  const src = audioCtx.createMediaStreamSource(props.stream)
  analyser = audioCtx.createAnalyser()
  analyser.fftSize = 2048
  src.connect(analyser)
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(draw)
}

function disconnect() {
  cancelAnimationFrame(raf)
  analyser?.disconnect()
  void audioCtx?.close().catch(() => {})
  analyser = null
  audioCtx = null
}

watch(
  () => props.stream,
  () => connect(),
  { immediate: true },
)

onBeforeUnmount(() => disconnect())
</script>

<template>
  <canvas
    ref="canvas"
    width="640"
    height="120"
    class="h-24 w-full max-w-xl rounded-lg border border-white/10 bg-studio-bg"
  />
</template>
