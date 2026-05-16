<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { useAudioContext } from '@/composables/useAudioContext'
import { bufferToPeaks } from '@/composables/useWaveform'
import { useFitPxPerSec } from '@/composables/useWaveformZoom'
import { useBeatsStore } from '@/stores/beats'
import { useCuesStore } from '@/stores/cues'
import { useMixStore } from '@/stores/mix'
import { useSampleStore } from '@/stores/sample'
import Deck from '@/components/deck/Deck.vue'
import Crossfader from '@/components/deck/Crossfader.vue'
import CueEditor from '@/components/cue/CueEditor.vue'
import UiButton from '@/components/ui/UiButton.vue'
import { SimpleBufferPlayer } from '@/audio/simplePlayer'
import { ScratchEngine, reverseBuffer, buildCueTimeline } from '@/audio/scratchEngine'
import { barLengthToSeconds } from '@/audio/patterns'
import { estimateBpm } from '@/audio/bpm'
import { HeuristicMagicStrategy } from '@/audio/magic'
import { encodeWavInterleaved, renderMixOffline } from '@/audio/exporter'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { uploadMixWav } from '@/services/storage'
import { useAuthStore } from '@/stores/auth'
import { getFirebaseOrNull } from '@/services/firebase'
import { addDoc, collection } from 'firebase/firestore'

const { ensureContext, resumeFromGesture, ctx } = useAudioContext()
const sample = useSampleStore()
const beats = useBeatsStore()
const cues = useCuesStore()
const mix = useMixStore()
const auth = useAuthStore()

const { buffer: sampleBuffer } = storeToRefs(sample)
const { selectedBeatId, crossfader, tempoSyncEnabled, detectedSampleBpm } = storeToRefs(mix)

const beatBuffer = shallowRef<AudioBuffer | null>(null)
const beatPeaks = ref<Float32Array>(new Float32Array(0))
const samplePeaks = ref<Float32Array>(new Float32Array(0))

const beatPlayer = shallowRef<SimpleBufferPlayer | null>(null)
const samplePlayer = shallowRef<SimpleBufferPlayer | null>(null)
const scratchEngine = shallowRef<ScratchEngine | null>(null)

const master = shallowRef<GainNode | null>(null)
const beatGain = shallowRef<GainNode | null>(null)
const sampleGain = shallowRef<GainNode | null>(null)
const scratchGain = shallowRef<GainNode | null>(null)

const beatTime = ref(0)
const sampleTime = ref(0)
const beatDuration = computed(() => beatBuffer.value?.duration)
const sampleDuration = computed(() => sampleBuffer.value?.duration)
const beatPxPerSec = useFitPxPerSec(beatDuration)
const samplePxPerSec = useFitPxPerSec(sampleDuration)
let raf = 0
let beatLoadGen = 0

const lastScratchNorm = ref(0)
const manualScratching = ref(false)

const selectedBeat = computed(() => {
  const id = selectedBeatId.value
  if (!id) return null
  return beats.items.find((b) => b.id === id) ?? null
})

function equalPower(cf: number) {
  const p = (cf + 1) / 2
  return { gBeat: Math.cos((p * Math.PI) / 2), gSample: Math.sin((p * Math.PI) / 2) }
}

function applyCrossfade() {
  const audioCtx = ctx.value
  if (!audioCtx) return
  const { gBeat, gSample } = equalPower(crossfader.value)
  const t = audioCtx.currentTime
  if (beatGain.value) beatGain.value.gain.setTargetAtTime(gBeat, t, 0.02)
  if (sampleGain.value) sampleGain.value.gain.setTargetAtTime(gSample, t, 0.02)
}

async function initGraph() {
  await resumeFromGesture()
  const c = ensureContext()
  if (!master.value) {
    const m = c.createGain()
    m.gain.value = 1
    m.connect(c.destination)
    master.value = m

    const bg = c.createGain()
    const sg = c.createGain()
    const scg = c.createGain()
    bg.connect(m)
    sg.connect(m)
    scg.connect(m)
    beatGain.value = bg
    sampleGain.value = sg
    scratchGain.value = scg

    const silent = c.createBuffer(1, 1, c.sampleRate)
    beatPlayer.value = new SimpleBufferPlayer(c, silent, bg)
    samplePlayer.value = new SimpleBufferPlayer(c, silent, sg)
  }
  applyCrossfade()
}

function tick() {
  const beatPlaying = beatPlayer.value?.isPlaying() ?? false
  const samplePlaying = samplePlayer.value?.isPlaying() ?? false
  if (beatPlaying) beatTime.value = beatPlayer.value!.getCursorTime()
  if (samplePlaying) sampleTime.value = samplePlayer.value!.getCursorTime()
  if (beatPlaying || samplePlaying) {
    raf = requestAnimationFrame(tick)
  } else {
    raf = 0
  }
}

function startTransportLoop() {
  if (raf) return
  raf = requestAnimationFrame(tick)
}

function stopTransportLoop() {
  if (raf) {
    cancelAnimationFrame(raf)
    raf = 0
  }
}

watch(
  () => sampleBuffer.value,
  async (buf) => {
    if (buf) await initGraph()
    if (!buf) {
      samplePeaks.value = new Float32Array(0)
      samplePlayer.value?.stop()
      scratchEngine.value?.stop()
      scratchEngine.value = null
      return
    }
    sampleTime.value = 0
    mix.sampleIsPlaying = false
    samplePeaks.value = bufferToPeaks(buf)
    samplePlayer.value?.setBuffer(buf)
    const c = ensureContext()
    scratchEngine.value?.stop()
    scratchEngine.value = new ScratchEngine({
      audioContext: c,
      forwardBuffer: buf,
      reversedBuffer: reverseBuffer(c, buf),
      destination: scratchGain.value!,
    })
  },
  { immediate: true },
)

async function loadBeatById(id: string | null) {
  const gen = ++beatLoadGen
  beatPlayer.value?.stop()
  mix.beatIsPlaying = false
  stopTransportLoop()
  beatTime.value = 0

  if (!id) {
    beatBuffer.value = null
    beatPeaks.value = new Float32Array(0)
    return
  }

  if (!beats.items.length) await beats.loadManifest()
  const meta = beats.items.find((b) => b.id === id)
  if (!meta) return

  try {
    const c = ensureContext()
    const base = import.meta.env.BASE_URL.replace(/\/?$/, '/')
    const res = await fetch(`${base}beats/${meta.file}`)
    if (!res.ok) throw new Error(`Beat fetch ${res.status}`)
    const ab = await res.arrayBuffer()
    if (gen !== beatLoadGen) return
    const decoded = await c.decodeAudioData(ab.slice(0))
    if (gen !== beatLoadGen) return
    beatBuffer.value = decoded
    beatPeaks.value = bufferToPeaks(decoded)
    beatPlayer.value?.setBuffer(decoded)
    beatTime.value = 0
  } catch {
    if (gen === beatLoadGen) {
      beatBuffer.value = null
      beatPeaks.value = new Float32Array(0)
    }
  }
}

watch(selectedBeatId, (id) => {
  void loadBeatById(id)
})

watch(crossfader, () => applyCrossfade())

watch(
  () =>
    [
      mix.beatPlaybackRate,
      mix.samplePlaybackRate,
      tempoSyncEnabled.value,
      detectedSampleBpm.value,
      selectedBeat.value?.bpm,
    ] as const,
  () => {
    let br = mix.beatPlaybackRate
    let sr = mix.samplePlaybackRate
    if (tempoSyncEnabled.value && detectedSampleBpm.value && selectedBeat.value?.bpm) {
      const ratio = selectedBeat.value.bpm / detectedSampleBpm.value
      sr = mix.samplePlaybackRate * ratio
    }
    beatPlayer.value?.setPlaybackRate(br)
    samplePlayer.value?.setPlaybackRate(sr)
  },
)

watch(
  () => mix.beatLoop,
  (v) => {
    if (beatPlayer.value) beatPlayer.value.loop = v
  },
)
watch(
  () => mix.sampleLoop,
  (v) => {
    if (samplePlayer.value) samplePlayer.value.loop = v
  },
)

function toggleBeat() {
  void initGraph()
  if (!beatBuffer.value || !beatPlayer.value) return
  if (beatPlayer.value.isPlaying()) {
    beatPlayer.value.stop()
    mix.beatIsPlaying = false
    if (!samplePlayer.value?.isPlaying()) stopTransportLoop()
  } else {
    beatPlayer.value.loop = mix.beatLoop
    beatPlayer.value.play(mix.beatPlaybackRate)
    mix.beatIsPlaying = true
    startTransportLoop()
  }
}

function toggleSample() {
  void initGraph()
  if (!sampleBuffer.value || !samplePlayer.value) return
  if (samplePlayer.value.isPlaying()) {
    samplePlayer.value.stop()
    mix.sampleIsPlaying = false
    if (!beatPlayer.value?.isPlaying()) stopTransportLoop()
  } else {
    samplePlayer.value.loop = mix.sampleLoop
    samplePlayer.value.play(mix.samplePlaybackRate)
    mix.sampleIsPlaying = true
    startTransportLoop()
  }
}

async function detectBpm() {
  if (!sampleBuffer.value) return
  const g = await estimateBpm(sampleBuffer.value)
  mix.detectedSampleBpm = g?.bpm ?? null
}

async function runMagic() {
  if (!sampleBuffer.value) return
  mix.magicCooking = true
  try {
    await initGraph()
    const strategy = new HeuristicMagicStrategy()
    const analysis = await strategy.analyze(sampleBuffer.value)
    const next = strategy.buildCues(analysis, sampleBuffer.value)
    cues.setCues(next)
  } catch (e) {
    sample.setError(e instanceof Error ? e.message : 'Magic failed')
  } finally {
    mix.magicCooking = false
  }
}

let autoRaf = 0
let autoStartCtx = 0
let autoSlots: { t: number; cue: import('@/types/studio').CuePoint }[] = []

let autoFired = new Set<string>()

function stopAutoScratch() {
  cancelAnimationFrame(autoRaf)
  autoSlots = []
  autoFired = new Set()
  mix.autoScratchEnabled = false
}

function scheduleAutoScratch() {
  stopAutoScratch()
  if (!selectedBeat.value || !sampleBuffer.value || !cues.cues.length) return
  const bpm = selectedBeat.value.bpm
  const dur = beatBuffer.value?.duration ?? 60
  autoSlots = buildCueTimeline(cues.sorted, bpm, dur)
  autoFired = new Set()
  mix.autoScratchEnabled = true
  void initGraph()
  if (beatPlayer.value && !beatPlayer.value.isPlaying()) {
    beatPlayer.value.loop = mix.beatLoop
    beatPlayer.value.play(mix.beatPlaybackRate)
    mix.beatIsPlaying = true
    startTransportLoop()
  }
  autoStartCtx = ensureContext().currentTime

  const step = () => {
    const t = ensureContext().currentTime - autoStartCtx
    for (const slot of autoSlots) {
      const key = `${slot.t}-${slot.cue.id}`
      if (t >= slot.t && t < slot.t + 0.08 && !autoFired.has(key)) {
        autoFired.add(key)
        const d = barLengthToSeconds(bpm, slot.cue.length)
        scratchEngine.value?.playPattern({
          offsetSec: slot.cue.time,
          durationSec: d,
          pattern: slot.cue.pattern,
          intensity: slot.cue.intensity,
        })
      }
    }
    if (mix.autoScratchEnabled) autoRaf = requestAnimationFrame(step)
  }
  autoRaf = requestAnimationFrame(step)
}

async function exportWav() {
  if (!beatBuffer.value || !sampleBuffer.value) return
  const rendered = await renderMixOffline({
    beatBuffer: beatBuffer.value,
    sampleBuffer: sampleBuffer.value,
    crossfader: crossfader.value,
    beatRate: mix.beatPlaybackRate,
    sampleRateMul: mix.samplePlaybackRate,
  })
  const blob = encodeWavInterleaved(rendered)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'scratch-o-matic-mix.wav'
  a.click()
  URL.revokeObjectURL(url)

  const fb = getFirebaseOrNull()
  if (fb && auth.isLoggedIn && auth.user) {
    try {
      const path = `users/${auth.user.uid}/mixes/${Date.now()}.wav`
      await uploadMixWav(blob, path)
      await addDoc(collection(fb.db, 'mixes'), {
        uid: auth.user.uid,
        path,
        createdAt: Date.now(),
      })
    } catch {
      /* optional upload */
    }
  }
}

function onSampleTap(t: number) {
  if (!cues.canAdd()) return
  cues.addAtTime(t)
}

function onScratchMove(nx: number) {
  lastScratchNorm.value = nx
  if (!scratchEngine.value || !sampleBuffer.value) return
  if (!manualScratching.value) {
    manualScratching.value = true
    scratchEngine.value.startManualFromOffset(sampleTime.value, () => lastScratchNorm.value)
    samplePlayer.value?.stop()
    mix.sampleIsPlaying = false
  }
}

function onScratchEnd() {
  manualScratching.value = false
  scratchEngine.value?.stop()
}

useKeyboardShortcuts(
  {
    ' ': () => {
      void toggleBeat()
      void toggleSample()
    },
    m: () => void runMagic(),
    '1': () => fireCue(0),
    '2': () => fireCue(1),
    '3': () => fireCue(2),
    '4': () => fireCue(3),
    '5': () => fireCue(4),
    '6': () => fireCue(5),
    '7': () => fireCue(6),
    '8': () => fireCue(7),
  },
  () => true,
)

function fireCue(index: number) {
  const c = cues.sorted[index]
  if (!c || !selectedBeat.value) return
  const dur = barLengthToSeconds(selectedBeat.value.bpm, c.length)
  scratchEngine.value?.playPattern({
    offsetSec: c.time,
    durationSec: dur,
    pattern: c.pattern,
    intensity: c.intensity,
  })
}

onMounted(() => {
  void loadBeatById(selectedBeatId.value)
})

onUnmounted(() => {
  stopTransportLoop()
  stopAutoScratch()
  beatPlayer.value?.stop()
  samplePlayer.value?.stop()
  scratchEngine.value?.stop()
})
</script>

<template>
  <div class="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
    <header class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-stone-100">Studio</h1>
        <p class="text-sm text-stone-500">
          Waveforms are visual only; playback runs through the Web Audio graph.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UiButton type="button" variant="accent" :disabled="!sampleBuffer" @click="detectBpm">
          Detect BPM
        </UiButton>
        <UiButton type="button" :disabled="!sampleBuffer || mix.magicCooking" @click="runMagic">
          ✨ Magic
        </UiButton>
        <UiButton
          type="button"
          :disabled="!beatBuffer || !sampleBuffer"
          @click="scheduleAutoScratch"
        >
          Auto-Scratch
        </UiButton>
        <UiButton
          type="button"
          variant="ghost"
          :disabled="!mix.autoScratchEnabled"
          @click="stopAutoScratch"
        >
          Stop auto
        </UiButton>
        <UiButton type="button" :disabled="!beatBuffer || !sampleBuffer" @click="exportWav">
          Export WAV
        </UiButton>
      </div>
    </header>

    <div
      v-if="mix.magicCooking"
      class="rounded-lg border border-studio-accent/40 bg-studio-accent/10 px-4 py-3 font-mono-display text-sm text-studio-accent"
    >
      Cooking…
    </div>

    <div class="flex flex-col items-center gap-2 lg:flex-row lg:items-stretch">
      <Deck
        class="flex-1"
        title="Beat deck"
        :subtitle="selectedBeat ? `${selectedBeat.bpm} BPM` : '—'"
        :peaks="beatPeaks"
        :duration="beatBuffer?.duration ?? 0.001"
        :current-time="beatTime"
        :follow-playhead="mix.beatIsPlaying"
        :min-px-per-sec="beatPxPerSec"
        :is-playing="mix.beatIsPlaying"
        :loop="mix.beatLoop"
        :pitch-percent="mix.beatPitchPercent"
        @toggle-play="toggleBeat"
        @toggle-loop="mix.beatLoop = !mix.beatLoop"
        @update:pitch-percent="mix.beatPitchPercent = $event"
        @seek="(t) => (beatTime = t)"
      />
      <div class="flex flex-col items-center justify-center gap-3 py-2 lg:w-56">
        <Crossfader v-model="mix.crossfader" />
        <label class="flex items-center gap-2 text-xs text-stone-400">
          <input v-model="mix.tempoSyncEnabled" type="checkbox" class="accent-studio-accent" />
          Tempo sync
        </label>
        <p v-if="detectedSampleBpm" class="font-mono-display text-xs text-stone-500">
          Sample ~{{ detectedSampleBpm }} BPM
        </p>
      </div>
      <Deck
        class="flex-1"
        title="Sample deck"
        :subtitle="sample.displayName ?? 'No sample'"
        :enable-waveform-seek="false"
        :peaks="samplePeaks"
        :duration="sampleBuffer?.duration ?? 0.001"
        :current-time="sampleTime"
        :follow-playhead="mix.sampleIsPlaying"
        :min-px-per-sec="samplePxPerSec"
        :is-playing="mix.sampleIsPlaying"
        :loop="mix.sampleLoop"
        :pitch-percent="mix.samplePitchPercent"
        @toggle-play="toggleSample"
        @toggle-loop="mix.sampleLoop = !mix.sampleLoop"
        @update:pitch-percent="mix.samplePitchPercent = $event"
        @seek="(t) => (sampleTime = t)"
        @tap="onSampleTap"
        @scratch-move="onScratchMove"
        @scratch-end="onScratchEnd"
      />
    </div>

    <CueEditor />
  </div>
</template>
