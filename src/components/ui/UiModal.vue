<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ 'update:open': [v: boolean]; close: [] }>()

function close() {
  emit('update:open', false)
  emit('close')
}

function onKey(ev: KeyboardEvent) {
  if (ev.key === 'Escape') close()
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      @click.self="close"
    >
      <div
        class="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl border border-white/10 bg-studio-panel p-6 shadow-2xl"
        @click.stop
      >
        <div class="mb-4 flex items-center justify-between gap-3">
          <h2 class="text-lg font-semibold text-stone-100">{{ title }}</h2>
          <button
            type="button"
            class="rounded p-1 text-stone-500 hover:text-stone-200"
            aria-label="Close"
            @click="close"
          >
            ✕
          </button>
        </div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>
