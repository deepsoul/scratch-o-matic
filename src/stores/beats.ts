import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { BeatManifestEntry } from '@/types/studio'

export const useBeatsStore = defineStore('beats', () => {
  const items = ref<BeatManifestEntry[]>([])
  const loadError = ref<string | null>(null)
  const isLoading = ref(false)

  const byId = computed(() => new Map(items.value.map((b) => [b.id, b])))

  async function loadManifest() {
    isLoading.value = true
    loadError.value = null
    try {
      const res = await fetch('/beats/index.json')
      if (!res.ok) throw new Error(`Manifest ${res.status}`)
      const data = (await res.json()) as { beats: BeatManifestEntry[] }
      items.value = data.beats
    } catch (e) {
      loadError.value = e instanceof Error ? e.message : 'Failed to load beats'
      items.value = []
    } finally {
      isLoading.value = false
    }
  }

  return { items, loadError, isLoading, byId, loadManifest }
})
