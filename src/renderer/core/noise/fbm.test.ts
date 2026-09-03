import { describe, expect, it } from 'vitest'
import { Fbm, type FbmOptions } from './fbm'
import { PerlinNoise2D } from './perlin'
import type { Noise2D } from './types'

const BASE_OPTIONS: FbmOptions = {
    octaves: 5,
    frequency: 0.5,
    lacunarity: 2,
    persistence: 0.5
}

describe('Fbm', () => {
    it('is deterministic for the same source and options', () => {
        const a = new Fbm(new PerlinNoise2D(2024), BASE_OPTIONS)
        const b = new Fbm(new PerlinNoise2D(2024), BASE_OPTIONS)
        for (const [x, y] of [
            [0.3, 1.1],
            [12.7, -4.3],
            [-40.2, 8.8]
        ]) {
            expect(a.sample(x, y)).toBe(b.sample(x, y))
        }
    })

    it('with one octave equals the source at the base frequency', () => {
        const source = new PerlinNoise2D(7)
        const fbm = new Fbm(source, { ...BASE_OPTIONS, octaves: 1 })
        for (const [x, y] of [
            [1.5, 2.5],
            [-3.25, 9.75]
        ]) {
            expect(fbm.sample(x, y)).toBe(source.sample(x * BASE_OPTIONS.frequency, y * BASE_OPTIONS.frequency))
        }
    })

    it('clamps octaves to at least one', () => {
        const source = new PerlinNoise2D(7)
        const zero = new Fbm(source, { ...BASE_OPTIONS, octaves: 0 })
        const one = new Fbm(source, { ...BASE_OPTIONS, octaves: 1 })
        expect(zero.sample(4.4, 1.2)).toBe(one.sample(4.4, 1.2))
    })

    it('preserves the range of a constant source regardless of octaves', () => {
        const constantSource: Noise2D = { sample: () => 0.8 }
        const fbm = new Fbm(constantSource, { ...BASE_OPTIONS, octaves: 8 })
        expect(fbm.sample(1, 2)).toBeCloseTo(0.8, 10)
    })

    it('stays within [-1, 1] over a grid', () => {
        const fbm = new Fbm(new PerlinNoise2D(11), BASE_OPTIONS)
        for (let y = -30; y <= 30; y += 0.53) {
            for (let x = -30; x <= 30; x += 0.53) {
                const value = fbm.sample(x, y)
                expect(value).toBeGreaterThan(-1.05)
                expect(value).toBeLessThan(1.05)
            }
        }
    })

    it('adds detail as octaves increase', () => {
        const source = new PerlinNoise2D(3)
        const one = new Fbm(source, { ...BASE_OPTIONS, octaves: 1 })
        const five = new Fbm(source, { ...BASE_OPTIONS, octaves: 5 })
        expect(five.sample(3.3, 1.7)).not.toBe(one.sample(3.3, 1.7))
    })

    it('collapses toward the first octave as persistence approaches zero', () => {
        const source = new PerlinNoise2D(5)
        const faint = new Fbm(source, { ...BASE_OPTIONS, octaves: 6, persistence: 1e-6 })
        const single = new Fbm(source, { ...BASE_OPTIONS, octaves: 1 })
        expect(faint.sample(2.2, 6.6)).toBeCloseTo(single.sample(2.2, 6.6), 4)
    })
})