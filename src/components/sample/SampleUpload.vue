<script setup lang="ts">
import { ref } from 'vue'
import { useAudioContext } from '@/composables/useAudioContext'
import { useSampleStore, MAX_SAMPLE_BYTES, ACCEPT_SAMPLE_EXTENSIONS } from '@/stores/sample'
import UiButton from '@/components/ui/UiButton.vue'

const sample = useSampleStore()
const { ensureContext } = useAudioContext()
const fileInput = ref<HTMLInputElement | null>(null)
const dragActive = ref(false)
const busy = ref(false)

function extOk(name: string) {
  const lower = name.toLowerCase()
  return ACCEPT_SAMPLE_EXTENSIONS.some((e) => lower.endsWith(e.slice(1)))
}

async function handleFile(file: File | null | undefined) {
  if (!file) return
  sample.clearError()
  if (!extOk(file.name)) {
    sample.setError('Unsupported format (use mp3, wav, m4a, ogg).')
    return
  }
  if (file.size > MAX_SAMPLE_BYTES) {
    sample.setError('File too large (max 30 MB).')
    return
  }
  busy.value = true
  try {
    const ctx = ensureContext()
    const ab = await file.arrayBuffer()
    const buf = await ctx.decodeAudioData(ab.slice(0))
    sample.setBuffer(buf, { source: 'upload', name: file.name, sizeBytes: file.size })
  } catch (e) {
    sample.setError(e instanceof Error ? e.message : 'Decode failed')
  } finally {
    busy.value = false
  }
}

function onDrop(ev: DragEvent) {
  dragActive.value = false
  const f = ev.dataTransfer?.files?.[0]
  void handleFile(f)
}

function onFile(ev: Event) {
  const input = ev.target as HTMLInputElement
  void handleFile(input.files?.[0])
  input.value = ''
}
</script>

<template>
  <div
    class="space-y-3 rounded-xl border border-dashed border-white/15 bg-studio-panel/40 p-6 transition"
    :class="{ 'border-studio-accent/60 bg-studio-accent/5': dragActive }"
    @dragenter.prevent="dragActive = true"
    @dragover.prevent="dragActive = true"
    @dragleave.prevent="dragActive = false"
    @drop.prevent="onDrop"
  >
    <h3 class="text-sm font-semibold text-stone-200">Upload sample</h3>
    <p class="text-xs text-stone-500">mp3, wav, m4a, ogg — max 30 MB</p>
    <p v-if="sample.lastError" class="text-xs text-red-400">{{ sample.lastError }}</p>
    <div class="flex flex-wrap gap-2">
      <UiButton type="button" variant="accent" :disabled="busy" @click="fileInput?.click()">
        Choose file
      </UiButton>
      <input
        ref="fileInput"
        type="file"
        class="hidden"
        accept=".mp3,.wav,.m4a,.ogg,audio/*"
        @change="onFile"
      />
    </div>
  </div>
</template>
