import type { Seed } from '../prng'
import { PerlinNoise2D } from './perlin'
import { SimplexNoise2D } from './simplex'
import type { Noise2D, NoiseType } from './types'

export function createNoise2D(type: NoiseType, seed: Seed): Noise2D {
    return type === 'simplex' ? new SimplexNoise2D(seed) : new PerlinNoise2D(seed)
}