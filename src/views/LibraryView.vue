<script setup lang="ts">
import { onMounted } from 'vue'
import { useBeatsStore } from '@/stores/beats'
import { useMixStore } from '@/stores/mix'
import BeatGrid from '@/components/beats/BeatGrid.vue'

const beats = useBeatsStore()
const mix = useMixStore()

onMounted(() => {
  void beats.loadManifest()
})
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8">
    <h1 class="mb-2 text-xl font-semibold text-stone-100">Beat library</h1>
    <p class="mb-6 text-sm text-stone-500">
      Static beats from <span class="font-mono-display text-stone-400">/beats/index.json</span>.
    </p>
    <p v-if="beats.loadError" class="mb-4 text-sm text-red-400">{{ beats.loadError }}</p>
    <BeatGrid
      :items="beats.items"
      :selected-id="mix.selectedBeatId"
      @select="mix.selectedBeatId = $event"
    />
  </div>
</template>
