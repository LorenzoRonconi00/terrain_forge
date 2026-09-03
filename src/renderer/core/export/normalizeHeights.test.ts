import { describe, expect, it } from 'vitest'
import type { Heightfield } from '../terrain/heightfield'
import { normalizeHeights } from './normalizeHeights'

function field(data: number[], heightScale = 10): Heightfield {
    return { width: data.length, height: 1, worldSize: 1, heightScale, data: Float32Array.from(data) }
}

describe('normalizeHeights', () => {
    it('stretches a non-flat field to [0, 1] with 0 and 1 present', () => {
        const { values, min, max } = normalizeHeights(field([0.2, 0.4, 0.6]))
        expect(min).toBeCloseTo(0.2, 6)
        expect(max).toBeCloseTo(0.6, 6)
        expect(values[0]).toBeCloseTo(0, 6)
        expect(values[2]).toBeCloseTo(1, 6)
    })

    it('converts the extremes to world units via heightScale', () => {
        const { minHeight, maxHeight } = normalizeHeights(field([0.25, 0.75], 40))
        expect(minHeight).toBeCloseTo(10, 6)
        expect(maxHeight).toBeCloseTo(30, 6)
    })

    it('clamps out-of-range input before normalizing', () => {
        const { values, min, max } = normalizeHeights(field([-2, 0.5, 3]))
        expect(min).toBe(0)
        expect(max).toBe(1)
        expect(Array.from(values)).toEqual([0, 0.5, 1])
    })

    it('returns all zeros for a flat field without dividing by zero', () => {
        const { values, minHeight, maxHeight } = normalizeHeights(field([0.5, 0.5, 0.5], 20))
        expect(Array.from(values)).toEqual([0, 0, 0])
        expect(minHeight).toBe(10)
        expect(maxHeight).toBe(10)
    })
})