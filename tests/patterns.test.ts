import { describe, expect, it } from 'vitest'
import { interpolateCurve, PATTERN_LIBRARY } from '@/audio/patterns'

describe('interpolateCurve', () => {
  it('interpolates between points', () => {
    const curve = PATTERN_LIBRARY.baby
    expect(interpolateCurve(curve, 0)).toBe(curve[0].rate)
    expect(interpolateCurve(curve, 1)).toBe(curve[curve.length - 1].rate)
  })
})
