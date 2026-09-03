import { describe, expect, it } from 'vitest'
import { PerlinNoise2D } from './perlin'

function sampleGrid(noise: PerlinNoise2D, span: number, step: number): number[] {
    const values: number[] = []
    for (let y = -span; y <= span; y += step) {
        for (let x = -span; x <= span; x += step) {
            values.push(noise.sample(x, y))
        }
    }
    return values
}

describe('PerlinNoise2D', () => {
    it('is deterministic for the same seed', () => {
        const a = new PerlinNoise2D(2024)
        const b = new PerlinNoise2D(2024)
        for (const [x, y] of [
            [0.1, 0.2],
            [12.7, -4.3],
            [-99.9, 33.33]
        ]) {
            expect(a.sample(x, y)).toBe(b.sample(x, y))
        }
    })

    it('depends on the seed', () => {
        const a = new PerlinNoise2D(1)
        const b = new PerlinNoise2D(2)
        expect(a.sample(3.5, 7.25)).not.toBe(b.sample(3.5, 7.25))
    })

    it('is exactly zero on integer lattice points', () => {
        const noise = new PerlinNoise2D(42)
        for (const [x, y] of [
            [0, 0],
            [5, -2],
            [17, 133],
            [-8, -8]
        ]) {
            expect(noise.sample(x, y)).toBe(0)
        }
    })

    it('stays within [-1, 1] and uses a wide part of the range', () => {
        const noise = new PerlinNoise2D(7)
        const values = sampleGrid(noise, 40, 0.37)
        const min = Math.min(...values)
        const max = Math.max(...values)
        expect(min).toBeGreaterThan(-1.05)
        expect(max).toBeLessThan(1.05)
        expect(min).toBeLessThan(-0.7)
        expect(max).toBeGreaterThan(0.7)
    })

    it('is continuous: small input steps give small output steps', () => {
        const noise = new PerlinNoise2D(11)
        let previous = noise.sample(0, 0.3)
        let maxDelta = 0
        for (let x = 0.02; x <= 30; x += 0.02) {
            const current = noise.sample(x, 0.3)
            maxDelta = Math.max(maxDelta, Math.abs(current - previous))
            previous = current
        }
        expect(maxDelta).toBeLessThan(0.15)
    })

    it('is not constant', () => {
        const noise = new PerlinNoise2D(3)
        const values = sampleGrid(noise, 20, 0.5)
        const mean = values.reduce((sum, value) => sum + value, 0) / values.length
        const variance =
            values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
        expect(variance).toBeGreaterThan(0.02)
    })
})