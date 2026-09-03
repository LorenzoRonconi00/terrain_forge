import { describe, expect, it } from 'vitest'
import { generateHeightfield } from './heightfield'
import { DEFAULT_TERRAIN_PARAMS, type TerrainParams } from './params'

function params(overrides: Partial<TerrainParams>): TerrainParams {
    return { ...DEFAULT_TERRAIN_PARAMS, width: 24, height: 24, ...overrides }
}

function variance(data: Float32Array): number {
    let mean = 0
    for (const value of data) {
        mean += value
    }
    mean /= data.length
    let acc = 0
    for (const value of data) {
        acc += (value - mean) ** 2
    }
    return acc / data.length
}

describe('generateHeightfield', () => {
    it('produces width * height samples, all within [0, 1]', () => {
        const field = generateHeightfield(params({ width: 32, height: 20 }))
        expect(field.data).toHaveLength(32 * 20)
        for (const value of field.data) {
            expect(value).toBeGreaterThanOrEqual(0)
            expect(value).toBeLessThanOrEqual(1)
        }
    })

    it('is deterministic for the same params', () => {
        const a = generateHeightfield(params({ seed: 5 }))
        const b = generateHeightfield(params({ seed: 5 }))
        expect(Array.from(a.data)).toEqual(Array.from(b.data))
    })

    it('depends on the seed', () => {
        const a = generateHeightfield(params({ seed: 1 }))
        const b = generateHeightfield(params({ seed: 2 }))
        expect(Array.from(a.data)).not.toEqual(Array.from(b.data))
    })

    it('shifts with the noise offset', () => {
        const a = generateHeightfield(params({ offsetX: 0 }))
        const b = generateHeightfield(params({ offsetX: 100 }))
        expect(Array.from(a.data)).not.toEqual(Array.from(b.data))
    })

    it('clamps dimensions to integers of at least 2', () => {
        const field = generateHeightfield(params({ width: 1.7, height: 8.9 }))
        expect(field.width).toBe(2)
        expect(field.height).toBe(8)
        expect(field.data).toHaveLength(2 * 8)
    })

    it('stays finite when scale is zero or negative', () => {
        const field = generateHeightfield(params({ scale: 0 }))
        for (const value of field.data) {
            expect(Number.isFinite(value)).toBe(true)
        }
    })

    it('carries worldSize and heightScale through unchanged', () => {
        const field = generateHeightfield(params({ worldSize: 250, heightScale: 60 }))
        expect(field.worldSize).toBe(250)
        expect(field.heightScale).toBe(60)
    })

    it('has real structure, not a flat field', () => {
        const field = generateHeightfield(params({ width: 64, height: 64 }))
        expect(variance(field.data)).toBeGreaterThan(0.005)
    })

    it('produces a quantized field when terraces are set', () => {
        const field = generateHeightfield(params({ width: 40, height: 40, elevationExponent: 1, terraces: 6 }))
        for (const value of field.data) {
            expect(value * 6).toBeCloseTo(Math.round(value * 6), 6)
        }
    })
    it('produces a different field for simplex noise, still within [0, 1]', () => {
        const perlin = generateHeightfield(params({ noiseType: 'perlin' }))
        const simplex = generateHeightfield(params({ noiseType: 'simplex' }))
        expect(Array.from(perlin.data)).not.toEqual(Array.from(simplex.data))
        for (const value of simplex.data) {
            expect(value).toBeGreaterThanOrEqual(0)
            expect(value).toBeLessThanOrEqual(1)
        }
    })
})