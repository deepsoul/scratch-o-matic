<script setup lang="ts">
import { RouterLink } from 'vue-router'
import SampleUpload from '@/components/sample/SampleUpload.vue'
import Recorder from '@/components/recorder/Recorder.vue'
import UiButton from '@/components/ui/UiButton.vue'
import { useSampleStore } from '@/stores/sample'
import { storeToRefs } from 'pinia'

const sample = useSampleStore()
const { buffer, displayName } = storeToRefs(sample)
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
    <section class="space-y-2">
      <h1 class="text-2xl font-semibold text-stone-100">Scratch-o-matic</h1>
      <p class="text-sm text-stone-500">
        Upload or record a sample, pick a beat in the library, then open the studio to scratch —
        manually, with cues, auto patterns, or Magic heuristics.
      </p>
    </section>

    <SampleUpload />
    <Recorder />

    <div
      v-if="buffer"
      class="rounded-lg border border-white/10 bg-studio-panel/50 px-4 py-3 text-sm text-stone-300"
    >
      Loaded:
      <span class="font-mono-display text-studio-accent">{{ displayName ?? 'sample' }}</span>
    </div>

    <div class="flex flex-wrap gap-3">
      <RouterLink to="/library">
        <UiButton type="button" variant="accent">Beat library</UiButton>
      </RouterLink>
      <RouterLink to="/studio">
        <UiButton type="button" :disabled="!buffer">Open studio</UiButton>
      </RouterLink>
    </div>
  </div>
</template>
