import { type Ref, computed } from 'vue'

/** Fit entire buffer into ~viewportWidth px (avoids 40px/s on 8‑minute beats). */
export function useFitPxPerSec(duration: Ref<number | undefined>, viewportWidth = 380) {
  return computed(() => {
    const d = duration.value ?? 1
    return Math.max(1, Math.min(80, viewportWidth / d))
  })
}
