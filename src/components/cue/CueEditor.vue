<script setup lang="ts">
import { computed } from 'vue'
import type { ScratchPatternId, CueBarLength } from '@/types/studio'
import { useCuesStore } from '@/stores/cues'
import UiButton from '@/components/ui/UiButton.vue'

const cues = useCuesStore()

const patterns: ScratchPatternId[] = ['baby', 'chirp', 'forward', 'transformer', 'flare']
const lengths: CueBarLength[] = ['1/16', '1/8', '1/4']

const list = computed(() => cues.sorted)

function color(idx: number) {
  return cues.CUE_COLORS[idx % cues.CUE_COLORS.length]
}
</script>

<template>
  <div class="space-y-3 rounded-xl border border-white/5 bg-studio-panel/40 p-4">
    <div class="flex items-center justify-between">
      <h4 class="text-sm font-semibold text-stone-200">Cue points</h4>
      <span class="font-mono-display text-xs text-stone-500"
        >{{ list.length }} / {{ cues.MAX_CUES }}</span
      >
    </div>
    <p class="text-xs text-stone-500">
      Click the sample waveform to add (max {{ cues.MAX_CUES }}).
    </p>
    <ul v-if="list.length" class="space-y-3">
      <li
        v-for="c in list"
        :key="c.id"
        class="rounded-lg border border-white/5 bg-studio-bg/80 p-3"
        :style="{ borderLeftColor: color(c.colorIndex), borderLeftWidth: '4px' }"
      >
        <div class="mb-2 flex items-center justify-between gap-2">
          <span class="font-mono-display text-xs text-studio-accent">{{ c.time.toFixed(3) }}s</span>
          <UiButton variant="ghost" type="button" @click="cues.removeCue(c.id)">Remove</UiButton>
        </div>
        <div class="grid gap-2 sm:grid-cols-2">
          <label class="text-xs text-stone-400">
            Pattern
            <select
              class="mt-1 w-full rounded border border-white/10 bg-studio-panel px-2 py-1 text-stone-100"
              :value="c.pattern"
              @change="
                cues.updateCue(c.id, {
                  pattern: ($event.target as HTMLSelectElement).value as ScratchPatternId,
                })
              "
            >
              <option v-for="p in patterns" :key="p" :value="p">{{ p }}</option>
            </select>
          </label>
          <label class="text-xs text-stone-400">
            Length
            <select
              class="mt-1 w-full rounded border border-white/10 bg-studio-panel px-2 py-1 text-stone-100"
              :value="c.length"
              @change="
                cues.updateCue(c.id, {
                  length: ($event.target as HTMLSelectElement).value as CueBarLength,
                })
              "
            >
              <option v-for="l in lengths" :key="l" :value="l">{{ l }} bar</option>
            </select>
          </label>
          <label class="text-xs text-stone-400 sm:col-span-2">
            Intensity (0–100)
            <input
              type="range"
              min="0"
              max="100"
              :value="c.intensity"
              class="mt-1 w-full accent-studio-accent"
              @input="
                cues.updateCue(c.id, {
                  intensity: Number(($event.target as HTMLInputElement).value),
                })
              "
            />
          </label>
          <label class="text-xs text-stone-400 sm:col-span-2">
            Tag
            <input
              :value="c.tag"
              class="mt-1 w-full rounded border border-white/10 bg-studio-panel px-2 py-1 text-stone-100"
              maxlength="24"
              @change="
                cues.updateCue(c.id, { tag: ($event.target as HTMLInputElement).value.trim() })
              "
            />
          </label>
        </div>
      </li>
    </ul>
    <p v-else class="text-sm text-stone-500">No cues yet.</p>
  </div>
</template>
