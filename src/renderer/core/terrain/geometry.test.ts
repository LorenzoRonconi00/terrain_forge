import { describe, expect, it } from 'vitest'
import { buildHeightfieldGeometry } from './geometry'
import type { Heightfield } from './heightfield'

function field(width: number, height: number, fill: number): Heightfield {
    return {
        width,
        height,
        worldSize: 100,
        heightScale: 20,
        data: new Float32Array(width * height).fill(fill)
    }
}

describe('buildHeightfieldGeometry', () => {
    it('produces the expected buffer sizes', () => {
        const { positions, indices } = buildHeightfieldGeometry(field(8, 5, 0))
        expect(positions).toHaveLength(8 * 5 * 3)
        expect(indices).toHaveLength(7 * 4 * 6)
    })

    it('places the grid corners at ±worldSize / 2', () => {
        const { positions } = buildHeightfieldGeometry(field(4, 4, 0))
        expect(positions[0]).toBeCloseTo(-50, 6)
        expect(positions[2]).toBeCloseTo(-50, 6)
        const last = (4 * 4 - 1) * 3
        expect(positions[last]).toBeCloseTo(50, 6)
        expect(positions[last + 2]).toBeCloseTo(50, 6)
    })

    it('maps height to y as data * heightScale', () => {
        const { positions } = buildHeightfieldGeometry(field(4, 4, 0.5))
        for (let i = 1; i < positions.length; i += 3) {
            expect(positions[i]).toBeCloseTo(10, 6)
        }
    })

    it('keeps every index inside the vertex range', () => {
        const { indices } = buildHeightfieldGeometry(field(6, 6, 0))
        for (const index of indices) {
            expect(index).toBeGreaterThanOrEqual(0)
            expect(index).toBeLessThan(6 * 6)
        }
    })
})