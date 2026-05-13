import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { isFirebaseConfigured, isFirebaseEnabled } from '@/services/firebase'

export interface AuthUserLite {
  uid: string
  email: string | null
  displayName: string | null
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUserLite | null>(null)
  const migrationPromptPending = ref(false)
  const initialized = ref(false)

  const isLoggedIn = computed(() => user.value !== null)
  const statusLabel = computed(() => {
    if (!isFirebaseEnabled()) return 'Guest (local)'
    if (!isFirebaseConfigured()) return 'Guest (Firebase not configured)'
    if (user.value?.displayName) return user.value.displayName
    if (user.value?.email) return user.value.email
    if (user.value) return 'Signed in'
    return 'Guest'
  })

  function setUser(next: AuthUserLite | null) {
    user.value = next
  }

  function requestMigrationPrompt() {
    migrationPromptPending.value = true
  }

  function dismissMigrationPrompt() {
    migrationPromptPending.value = false
  }

  function markInitialized() {
    initialized.value = true
  }

  return {
    user,
    migrationPromptPending,
    initialized,
    isLoggedIn,
    statusLabel,
    setUser,
    requestMigrationPrompt,
    dismissMigrationPrompt,
    markInitialized,
  }
})
