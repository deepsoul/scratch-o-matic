import { onUnmounted } from 'vue'

export interface ShortcutMap {
  [key: string]: () => void
}

export function useKeyboardShortcuts(map: ShortcutMap, active: () => boolean) {
  function onKey(ev: KeyboardEvent) {
    if (!active()) return
    const t = ev.target as HTMLElement | null
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return

    const key = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key
    const fn = map[key]
    if (!fn) return
    ev.preventDefault()
    fn()
  }

  window.addEventListener('keydown', onKey)
  onUnmounted(() => window.removeEventListener('keydown', onKey))
}
