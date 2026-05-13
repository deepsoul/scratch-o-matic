import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import { subscribeAuth } from '@/services/firebase'
import { listLocalKeys } from '@/services/localPersist'
import { useAuthStore } from '@/stores/auth'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

const auth = useAuthStore()
subscribeAuth(async (u) => {
  auth.setUser(u)
  if (u) {
    try {
      const keys = await listLocalKeys()
      if (keys.length) auth.requestMigrationPrompt()
    } catch {
      /* ignore */
    }
  }
  auth.markInitialized()
})

app.use(router)
app.mount('#app')
