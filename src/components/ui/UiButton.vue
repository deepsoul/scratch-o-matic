<script setup lang="ts">
defineProps<{
  variant?: 'default' | 'accent' | 'ghost'
  type?: 'button' | 'submit'
  disabled?: boolean
}>()
</script>

<template>
  <button
    :type="type ?? 'button'"
    :disabled="disabled"
    class="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-studio-accent disabled:pointer-events-none disabled:opacity-40"
    :class="{
      'bg-studio-panel text-stone-100 ring-1 ring-white/10 hover:bg-white/5':
        variant === 'default' || !variant,
      'bg-studio-accent text-studio-bg hover:bg-amber-400': variant === 'accent',
      'bg-transparent text-stone-300 hover:text-studio-accent': variant === 'ghost',
    }"
  >
    <slot />
  </button>
</template>
