<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MigrationModal from '@/components/layout/MigrationModal.vue'
import FirebaseAuthBar from '@/components/auth/FirebaseAuthBar.vue'

const auth = useAuthStore()
</script>

<template>
  <div class="flex min-h-full flex-col">
    <header
      class="sticky top-0 z-40 border-b border-white/5 bg-studio-panel/90 px-4 py-3 backdrop-blur-md"
    >
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <RouterLink
          to="/"
          class="font-mono-display text-lg font-semibold tracking-tight text-studio-accent"
        >
          Scratch-o-matic
        </RouterLink>
        <nav class="flex flex-wrap items-center gap-4 text-sm text-stone-400">
          <RouterLink class="hover:text-studio-accent" active-class="text-studio-accent" to="/">
            Home
          </RouterLink>
          <RouterLink
            class="hover:text-studio-accent"
            active-class="text-studio-accent"
            to="/library"
          >
            Beats
          </RouterLink>
          <RouterLink
            class="hover:text-studio-accent"
            active-class="text-studio-accent"
            to="/studio"
          >
            Studio
          </RouterLink>
        </nav>
        <span class="font-mono-display text-xs text-stone-500">{{ auth.statusLabel }}</span>
        <FirebaseAuthBar />
      </div>
    </header>
    <main class="flex-1">
      <RouterView />
    </main>
    <MigrationModal />
  </div>
</template>
