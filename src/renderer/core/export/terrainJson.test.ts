import { describe, expect, it } from 'vitest'
import { generateHeightfield } from '../terrain/heightfield'
import { DEFAULT_TERRAIN_PARAMS } from '../terrain/params'
import { buildTerrainJson, encodeTerrainJson } from './terrainJson'

const PARAMS = { ...DEFAULT_TERRAIN_PARAMS, width: 24, height: 24 }

describe('buildTerrainJson', () => {
    it('carries format, version and dimensions', () => {
        const field = generateHeightfield(PARAMS)
        const json = buildTerrainJson(field, PARAMS)
        expect(json.format).toBe('terrain-forge/heightfield')
        expect(json.version).toBe(1)
        expect(json.width).toBe(24)
        expect(json.height).toBe(24)
        expect(json.worldSize).toBe(PARAMS.worldSize)
        expect(json.heights).toHaveLength(24 * 24)
    })

    it('embeds a copy of the params', () => {
        const field = generateHeightfield(PARAMS)
        const json = buildTerrainJson(field, PARAMS)
        expect(json.params).toEqual(PARAMS)
        json.params.seed = 999
        expect(buildTerrainJson(field, PARAMS).params.seed).toBe(PARAMS.seed)
    })

    it('normalized heights stay within [0, 1] and use the full range', () => {
        const field = generateHeightfield(PARAMS)
        const json = buildTerrainJson(field, PARAMS)
        const min = Math.min(...json.heights)
        const max = Math.max(...json.heights)
        expect(min).toBeGreaterThanOrEqual(0)
        expect(max).toBeLessThanOrEqual(1)
        expect(min).toBeCloseTo(0, 5)
        expect(max).toBeCloseTo(1, 5)
    })

    it('minHeight and maxHeight are world units', () => {
        const field = generateHeightfield(PARAMS)
        const json = buildTerrainJson(field, PARAMS)
        expect(json.minHeight).toBeGreaterThanOrEqual(0)
        expect(json.maxHeight).toBeLessThanOrEqual(PARAMS.heightScale)
        expect(json.maxHeight).toBeGreaterThan(json.minHeight)
    })

    it('is deterministic', () => {
        const field = generateHeightfield(PARAMS)
        expect(buildTerrainJson(field, PARAMS)).toEqual(buildTerrainJson(field, PARAMS))
    })
})

describe('encodeTerrainJson', () => {
    it('produces UTF-8 bytes that parse back to the same object', () => {
        const field = generateHeightfield(PARAMS)
        const bytes = encodeTerrainJson(field, PARAMS)
        const parsed = JSON.parse(new TextDecoder().decode(bytes))
        expect(parsed).toEqual(buildTerrainJson(field, PARAMS))
    })
})