<script setup lang="ts">
import { ref } from 'vue'
import type { BeatManifestEntry } from '@/types/studio'
import UiButton from '@/components/ui/UiButton.vue'

const props = defineProps<{
  beat: BeatManifestEntry
  selected: boolean
}>()

const emit = defineEmits<{ select: [] }>()

const audioRef = ref<HTMLAudioElement | null>(null)
const base = import.meta.env.BASE_URL.replace(/\/?$/, '/')

function preview() {
  void audioRef.value?.play()
}
</script>

<template>
  <article
    class="flex flex-col overflow-hidden rounded-xl border bg-studio-panel/60 transition"
    :class="selected ? 'border-studio-accent ring-1 ring-studio-accent/40' : 'border-white/5'"
  >
    <div class="aspect-square w-full bg-studio-bg">
      <img
        :src="`${base}beats/${props.beat.cover}`"
        :alt="props.beat.title"
        class="h-full w-full object-cover opacity-90"
        loading="lazy"
      />
    </div>
    <div class="flex flex-1 flex-col gap-2 p-4">
      <h3 class="text-sm font-semibold text-stone-100">{{ props.beat.title }}</h3>
      <p class="font-mono-display text-xs text-stone-500">
        {{ props.beat.bpm }} BPM · {{ props.beat.key }}
      </p>
      <audio ref="audioRef" :src="`${base}beats/${props.beat.file}`" preload="none" />
      <div class="flex flex-wrap gap-2">
        <UiButton type="button" variant="ghost" @click="preview">Preview</UiButton>
        <UiButton type="button" variant="accent" @click="emit('select')">
          {{ selected ? 'Selected' : 'Use in studio' }}
        </UiButton>
      </div>
    </div>
  </article>
</template>
