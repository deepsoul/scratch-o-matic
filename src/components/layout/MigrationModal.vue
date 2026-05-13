<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { listLocalKeys } from '@/services/localPersist'
import UiModal from '@/components/ui/UiModal.vue'
import UiButton from '@/components/ui/UiButton.vue'

const auth = useAuthStore()
const open = ref(false)
const keys = ref<string[]>([])

async function openModal() {
  keys.value = await listLocalKeys()
  open.value = true
}

async function confirm() {
  auth.dismissMigrationPrompt()
  open.value = false
}
</script>

<template>
  <div>
    <button
      v-if="auth.migrationPromptPending && auth.isLoggedIn"
      type="button"
      class="fixed bottom-4 right-4 z-30 rounded-full bg-studio-accent px-4 py-2 text-xs font-medium text-studio-bg shadow-lg"
      @click="openModal"
    >
      Migrate local data
    </button>
    <UiModal v-model:open="open" title="Local sessions">
      <p class="mb-4 text-sm text-stone-400">
        Found {{ keys.length }} local key(s). Full merge into Firestore is a follow-up; for now this
        confirms IndexedDB access.
      </p>
      <ul class="mb-4 max-h-40 overflow-auto font-mono-display text-xs text-stone-500">
        <li v-for="k in keys" :key="k">{{ k }}</li>
      </ul>
      <UiButton type="button" variant="accent" @click="confirm">Dismiss</UiButton>
    </UiModal>
  </div>
</template>
