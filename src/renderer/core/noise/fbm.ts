import type { Noise2D } from './types'

export interface FbmOptions {
    octaves: number
    frequency: number
    lacunarity: number
    persistence: number
}

export const DEFAULT_FBM_OPTIONS: FbmOptions = {
    octaves: 5,
    frequency: 1,
    lacunarity: 2,
    persistence: 0.5
}

export class Fbm implements Noise2D {
    private readonly source: Noise2D
    private readonly octaves: number
    private readonly frequency: number
    private readonly lacunarity: number
    private readonly persistence: number

    constructor(source: Noise2D, options: FbmOptions = DEFAULT_FBM_OPTIONS) {
        this.source = source
        this.octaves = Math.max(1, Math.floor(options.octaves))
        this.frequency = options.frequency
        this.lacunarity = options.lacunarity
        this.persistence = options.persistence
    }

    sample(x: number, y: number): number {
        let amplitude = 1
        let frequency = this.frequency
        let sum = 0
        let normalization = 0

        for (let octave = 0; octave < this.octaves; octave++) {
            sum += amplitude * this.source.sample(x * frequency, y * frequency)
            normalization += amplitude
            frequency *= this.lacunarity
            amplitude *= this.persistence
        }

        return sum / normalization
    }
}