export interface Noise2D {
    sample(x: number, y: number): number
}

export type NoiseType = 'perlin' | 'simplex'