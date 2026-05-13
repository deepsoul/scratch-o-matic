<script setup lang="ts">
const model = defineModel<number>({ required: true })
defineProps<{
  min?: number
  max?: number
  step?: number
  label?: string
}>()
</script>

<template>
  <label class="flex flex-col gap-1 text-xs text-stone-400">
    <span v-if="label" class="font-mono-display uppercase tracking-wide">{{ label }}</span>
    <input
      v-model.number="model"
      type="range"
      class="h-2 w-full cursor-pointer appearance-none rounded-full bg-studio-bg accent-studio-accent"
      :min="min ?? 0"
      :max="max ?? 100"
      :step="step ?? 1"
    />
  </label>
</template>
