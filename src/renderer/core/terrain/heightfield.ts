import { Fbm } from '../noise/fbm'
import { createNoise2D } from '../noise/createNoise'
import { applyElevationCurve, clamp01 } from './elevationCurve'
import { erodeHeightfield } from './erosion'
import type { TerrainParams } from './params'

export interface Heightfield {
    width: number
    height: number
    worldSize: number
    heightScale: number
    data: Float32Array
}

export function generateHeightfield(params: TerrainParams): Heightfield {
    const width = Math.max(2, Math.floor(params.width))
    const height = Math.max(2, Math.floor(params.height))
    const scale = params.scale <= 0 ? 1 : params.scale

    const source = createNoise2D(params.noiseType, params.seed)
    const fbm = new Fbm(source, {
        octaves: params.octaves,
        frequency: 1,
        lacunarity: params.lacunarity,
        persistence: params.persistence
    })

    let data: Float32Array = new Float32Array(width * height)

    for (let row = 0; row < height; row++) {
        const v = row / (height - 1)
        const worldZ = (v - 0.5) * params.worldSize
        const noiseZ = worldZ / scale + params.offsetY

        for (let col = 0; col < width; col++) {
            const u = col / (width - 1)
            const worldX = (u - 0.5) * params.worldSize
            const noiseX = worldX / scale + params.offsetX

            const raw = fbm.sample(noiseX, noiseZ)
            const normalized = clamp01(raw * 0.5 + 0.5)
            const shaped = applyElevationCurve(normalized, {
                exponent: params.elevationExponent,
                terraces: params.terraces
            })

            data[row * width + col] = shaped
        }
    }

    if (params.erosionEnabled && params.erosionDroplets > 0) {
        data = erodeHeightfield(data, width, height, {
            droplets: params.erosionDroplets,
            radius: params.erosionRadius,
            seed: params.seed
        })
    }

    return { width, height, worldSize: params.worldSize, heightScale: params.heightScale, data }
}