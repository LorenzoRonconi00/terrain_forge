import type { NoiseType } from '../noise/types'

export interface TerrainParams {
    seed: number
    noiseType: NoiseType
    width: number
    height: number
    worldSize: number
    scale: number
    octaves: number
    persistence: number
    lacunarity: number
    heightScale: number
    elevationExponent: number
    terraces: number
    seaLevel: number
    offsetX: number
    offsetY: number
}

export const DEFAULT_TERRAIN_PARAMS: TerrainParams = {
    seed: 1337,
    noiseType: 'perlin',
    width: 256,
    height: 256,
    worldSize: 100,
    scale: 40,
    octaves: 5,
    persistence: 0.5,
    lacunarity: 2,
    heightScale: 24,
    elevationExponent: 2,
    terraces: 0,
    seaLevel: 0.32,
    offsetX: 0,
    offsetY: 0
}