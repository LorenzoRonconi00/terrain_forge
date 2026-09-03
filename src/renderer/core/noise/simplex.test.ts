import { describe, expect, it } from 'vitest'
import { SimplexNoise2D } from './simplex'

function sampleGrid(noise: SimplexNoise2D, span: number, step: number): number[] {
    const values: number[] = []
    for (let y = -span; y <= span; y += step) {
        for (let x = -span; x <= span; x += step) {
            values.push(noise.sample(x, y))
        }
    }
    return values
}

describe('SimplexNoise2D', () => {
    it('is deterministic for the same seed', () => {
        const a = new SimplexNoise2D(2024)
        const b = new SimplexNoise2D(2024)
        for (const [x, y] of [
            [0.1, 0.2],
            [12.7, -4.3],
            [-99.9, 33.33]
        ]) {
            expect(a.sample(x, y)).toBe(b.sample(x, y))
        }
    })

    it('depends on the seed', () => {
        const a = new SimplexNoise2D(1)
        const b = new SimplexNoise2D(2)
        expect(a.sample(3.5, 7.25)).not.toBe(b.sample(3.5, 7.25))
    })

    it('stays within [-1, 1] and uses a wide part of the range', () => {
        const noise = new SimplexNoise2D(7)
        const values = sampleGrid(noise, 40, 0.37)
        const min = Math.min(...values)
        const max = Math.max(...values)
        expect(min).toBeGreaterThan(-1.05)
        expect(max).toBeLessThan(1.05)
        expect(min).toBeLessThan(-0.6)
        expect(max).toBeGreaterThan(0.6)
    })

    it('is continuous: small input steps give small output steps', () => {
        const noise = new SimplexNoise2D(11)
        let previous = noise.sample(0, 0.3)
        let maxDelta = 0
        for (let x = 0.02; x <= 30; x += 0.02) {
            const current = noise.sample(x, 0.3)
            maxDelta = Math.max(maxDelta, Math.abs(current - previous))
            previous = current
        }
        expect(maxDelta).toBeLessThan(0.2)
    })

    it('has an approximately zero mean over a large grid', () => {
        const noise = new SimplexNoise2D(3)
        const values = sampleGrid(noise, 60, 0.5)
        const mean = values.reduce((sum, value) => sum + value, 0) / values.length
        expect(Math.abs(mean)).toBeLessThan(0.05)
    })

    it('is not constant', () => {
        const noise = new SimplexNoise2D(5)
        const values = sampleGrid(noise, 20, 0.5)
        const mean = values.reduce((sum, value) => sum + value, 0) / values.length
        const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
        expect(variance).toBeGreaterThan(0.02)
    })
})