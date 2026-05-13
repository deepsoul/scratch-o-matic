<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRecorder } from '@/composables/useRecorder'
import { useAudioContext } from '@/composables/useAudioContext'
import { useSampleStore } from '@/stores/sample'
import LiveWaveform from '@/components/recorder/LiveWaveform.vue'
import UiButton from '@/components/ui/UiButton.vue'

const recorder = useRecorder()
const { ensureContext } = useAudioContext()
const sample = useSampleStore()

const busy = ref(false)

const previewStream = computed(() => {
  if (recorder.state.value === 'recording' || recorder.state.value === 'paused') {
    return recorder.stream.value
  }
  return null
})

async function decodeBlobToBuffer(blob: Blob): Promise<AudioBuffer> {
  const ctx = ensureContext()
  const ab = await blob.arrayBuffer()
  return ctx.decodeAudioData(ab.slice(0))
}

async function commitRecording() {
  busy.value = true
  try {
    const blob = await recorder.buildBlob()
    if (!blob) return
    const buf = await decodeBlobToBuffer(blob)
    sample.setBuffer(buf, {
      source: 'recording',
      name: `recording-${new Date().toISOString()}`,
      sizeBytes: blob.size,
    })
    recorder.discard()
  } catch (e) {
    sample.setError(e instanceof Error ? e.message : 'Decode failed')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="space-y-3 rounded-xl border border-white/5 bg-studio-panel/40 p-4">
    <h3 class="text-sm font-semibold text-stone-200">Microphone</h3>
    <p v-if="!recorder.canUse.value" class="text-xs text-amber-400">MediaRecorder not supported.</p>
    <p v-else-if="recorder.error.value" class="text-xs text-red-400">{{ recorder.error.value }}</p>
    <LiveWaveform :stream="previewStream" />
    <div class="flex flex-wrap gap-2">
      <UiButton
        v-if="recorder.state.value === 'idle'"
        type="button"
        variant="accent"
        :disabled="busy"
        @click="recorder.start()"
      >
        Record
      </UiButton>
      <template v-else-if="recorder.state.value === 'recording'">
        <UiButton type="button" @click="recorder.pause()">Pause</UiButton>
        <UiButton type="button" variant="ghost" @click="recorder.stop()">Stop</UiButton>
      </template>
      <template v-else-if="recorder.state.value === 'paused'">
        <UiButton type="button" @click="recorder.resume()">Resume</UiButton>
        <UiButton type="button" variant="ghost" @click="recorder.stop()">Stop</UiButton>
      </template>
      <template v-else-if="recorder.state.value === 'stopped'">
        <UiButton type="button" variant="accent" :disabled="busy" @click="commitRecording">
          Use take
        </UiButton>
        <UiButton type="button" variant="ghost" :disabled="busy" @click="recorder.discard()">
          Discard
        </UiButton>
      </template>
    </div>
  </div>
</template>
