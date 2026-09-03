import { describe, expect, it } from 'vitest'
import { generateHeightfield } from '../terrain/heightfield'
import { DEFAULT_TERRAIN_PARAMS } from '../terrain/params'
import type { Heightfield } from '../terrain/heightfield'
import { encodeTerrainObj } from './meshObj'

function decode(bytes: Uint8Array): string[] {
    return new TextDecoder().decode(bytes).trimEnd().split('\n')
}

function flatField(width: number, height: number): Heightfield {
    return {
        width,
        height,
        worldSize: 100,
        heightScale: 20,
        data: new Float32Array(width * height).fill(0.5)
    }
}

describe('encodeTerrainObj', () => {
    it('starts with the header comment', () => {
        const lines = decode(encodeTerrainObj(flatField(4, 4)))
        expect(lines[0]).toBe('# Terrain Forge OBJ export')
    })

    it('emits one v and one vn per vertex, and two faces per cell', () => {
        const field = generateHeightfield({ ...DEFAULT_TERRAIN_PARAMS, width: 20, height: 12 })
        const lines = decode(encodeTerrainObj(field))
        expect(lines.filter((l) => l.startsWith('v ')).length).toBe(20 * 12)
        expect(lines.filter((l) => l.startsWith('vn ')).length).toBe(20 * 12)
        expect(lines.filter((l) => l.startsWith('f ')).length).toBe(2 * 19 * 11)
    })

    it('references vertices with 1-based indices inside range', () => {
        const width = 6
        const height = 6
        const lines = decode(encodeTerrainObj(flatField(width, height)))
        for (const line of lines.filter((l) => l.startsWith('f '))) {
            const refs = line
                .slice(2)
                .split(' ')
                .map((token) => Number(token.split('//')[0]))
            for (const ref of refs) {
                expect(Number.isInteger(ref)).toBe(true)
                expect(ref).toBeGreaterThanOrEqual(1)
                expect(ref).toBeLessThanOrEqual(width * height)
            }
        }
    })

    it('produces unit-length upward normals for a flat field', () => {
        const lines = decode(encodeTerrainObj(flatField(5, 5)))
        for (const line of lines.filter((l) => l.startsWith('vn '))) {
            expect(line).toBe('vn 0.0000 1.0000 0.0000')
        }
    })

    it('places the first vertex at the grid corner', () => {
        const lines = decode(encodeTerrainObj(flatField(4, 4)))
        const first = lines.find((l) => l.startsWith('v '))
        expect(first).toBe('v -50.0000 10.0000 -50.0000')
    })

    it('is deterministic', () => {
        const field = generateHeightfield({ ...DEFAULT_TERRAIN_PARAMS, width: 16, height: 16 })
        expect(Array.from(encodeTerrainObj(field))).toEqual(Array.from(encodeTerrainObj(field)))
    })
})