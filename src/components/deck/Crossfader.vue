<script setup lang="ts">
import { computed } from 'vue'

const model = defineModel<number>({ required: true })

const pct = computed(() => Math.round(((model.value + 1) / 2) * 100))

function onInput(ev: Event) {
  const v = Number((ev.target as HTMLInputElement).value)
  const next = (v / 100) * 2 - 1
  model.value = Math.abs(next) < 0.06 ? 0 : next
}
</script>

<template>
  <div class="flex w-full max-w-md flex-col gap-2 px-2">
    <div class="flex items-center justify-between text-xs text-stone-500">
      <span>Beat</span>
      <span class="font-mono-display text-studio-accent">{{ pct }}%</span>
      <span>Sample</span>
    </div>
    <input
      :value="Math.round(((model + 1) / 2) * 100)"
      type="range"
      min="0"
      max="100"
      step="1"
      class="h-3 w-full cursor-pointer appearance-none rounded-full bg-studio-bg accent-studio-accent"
      @input="onInput"
    />
  </div>
</template>
