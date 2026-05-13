import { createRouter, createWebHistory } from 'vue-router'

const HomeView = () => import('@/views/HomeView.vue')
const StudioView = () => import('@/views/StudioView.vue')
const LibraryView = () => import('@/views/LibraryView.vue')

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/studio', name: 'studio', component: StudioView },
    { path: '/library', name: 'library', component: LibraryView },
  ],
})

export default router
