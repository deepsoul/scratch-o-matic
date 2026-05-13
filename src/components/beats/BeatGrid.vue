<script setup lang="ts">
import type { BeatManifestEntry } from '@/types/studio'
import BeatCard from '@/components/beats/BeatCard.vue'

defineProps<{
  items: BeatManifestEntry[]
  selectedId: string | null
}>()

const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <BeatCard
      v-for="b in items"
      :key="b.id"
      :beat="b"
      :selected="selectedId === b.id"
      @select="emit('select', b.id)"
    />
  </div>
</template>
