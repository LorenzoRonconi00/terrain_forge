import { describe, expect, it } from 'vitest'
import { erodeHeightfield } from './erosion'

function bump(size: number): Float32Array {
    const data = new Float32Array(size * size)
    const center = (size - 1) / 2
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const d = Math.hypot(x - center, y - center) / center
            data[y * size + x] = Math.max(0, 1 - d) ** 2
        }
    }
    return data
}

const OPTIONS = { droplets: 8000, radius: 3, seed: 1 }

describe('erodeHeightfield', () => {
    it('returns a new array of the same length without mutating the input', () => {
        const source = bump(32)
        const snapshot = Array.from(source)
        const result = erodeHeightfield(source, 32, 32, OPTIONS)
        expect(result).not.toBe(source)
        expect(result).toHaveLength(source.length)
        expect(Array.from(source)).toEqual(snapshot)
    })

    it('with zero droplets returns an unchanged copy', () => {
        const source = bump(24)
        const result = erodeHeightfield(source, 24, 24, { ...OPTIONS, droplets: 0 })
        expect(Array.from(result)).toEqual(Array.from(source))
    })

    it('is deterministic for the same input and options', () => {
        const source = bump(32)
        const a = erodeHeightfield(source, 32, 32, OPTIONS)
        const b = erodeHeightfield(source, 32, 32, OPTIONS)
        expect(Array.from(a)).toEqual(Array.from(b))
    })

    it('keeps every sample within [0, 1]', () => {
        const result = erodeHeightfield(bump(32), 32, 32, OPTIONS)
        for (const value of result) {
            expect(value).toBeGreaterThanOrEqual(0)
            expect(value).toBeLessThanOrEqual(1)
        }
    })

    it('lowers the peak of a bump', () => {
        const source = bump(48)
        const result = erodeHeightfield(source, 48, 48, { droplets: 20000, radius: 3, seed: 2 })
        expect(Math.max(...result)).toBeLessThan(Math.max(...source))
        expect(Array.from(result)).not.toEqual(Array.from(source))
    })
})