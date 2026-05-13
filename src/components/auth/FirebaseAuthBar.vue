<script setup lang="ts">
import { computed } from 'vue'
import { signInWithGoogle } from '@/services/firebase'
import { getFirebaseOrNull, isFirebaseConfigured, isFirebaseEnabled } from '@/services/firebase'
import { useAuthStore } from '@/stores/auth'
import UiButton from '@/components/ui/UiButton.vue'

const auth = useAuthStore()

const showAuth = computed(() => isFirebaseEnabled() && isFirebaseConfigured())

async function google() {
  try {
    await signInWithGoogle()
  } catch {
    /* handled in UI elsewhere */
  }
}

function signOut() {
  const fb = getFirebaseOrNull()
  void fb?.auth.signOut()
}
</script>

<template>
  <div v-if="showAuth" class="flex flex-wrap items-center gap-2">
    <template v-if="!auth.isLoggedIn">
      <UiButton type="button" variant="ghost" @click="google">Google sign-in</UiButton>
    </template>
    <UiButton v-else type="button" variant="ghost" @click="signOut">Sign out</UiButton>
  </div>
</template>
