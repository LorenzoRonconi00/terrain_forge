import type { Heightfield } from '../terrain/heightfield'
import type { TerrainParams } from '../terrain/params'
import { normalizeHeights } from './normalizeHeights'

export interface TerrainJson {
    format: 'terrain-forge/heightfield'
    version: 1
    width: number
    height: number
    worldSize: number
    minHeight: number
    maxHeight: number
    params: TerrainParams
    heights: number[]
}

export function buildTerrainJson(field: Heightfield, params: TerrainParams): TerrainJson {
    const normalized = normalizeHeights(field)
    return {
        format: 'terrain-forge/heightfield',
        version: 1,
        width: field.width,
        height: field.height,
        worldSize: field.worldSize,
        minHeight: normalized.minHeight,
        maxHeight: normalized.maxHeight,
        params: { ...params },
        heights: Array.from(normalized.values)
    }
}

export function encodeTerrainJson(field: Heightfield, params: TerrainParams): Uint8Array {
    return new TextEncoder().encode(JSON.stringify(buildTerrainJson(field, params)))
}