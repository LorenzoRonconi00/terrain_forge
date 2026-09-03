import { createPermutationTable } from '../hash'
import type { Seed } from '../prng'
import type { Noise2D } from './types'

function fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10)
}

function lerp(t: number, a: number, b: number): number {
    return a + t * (b - a)
}

const GRADIENTS_2D: ReadonlyArray<readonly [number, number]> = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [Math.SQRT1_2, Math.SQRT1_2],
    [-Math.SQRT1_2, Math.SQRT1_2],
    [Math.SQRT1_2, -Math.SQRT1_2],
    [-Math.SQRT1_2, -Math.SQRT1_2]
]

const NORMALIZE_2D = Math.SQRT2

function grad(hash: number, x: number, y: number): number {
    const [gx, gy] = GRADIENTS_2D[hash & 7]
    return gx * x + gy * y
}

export class PerlinNoise2D implements Noise2D {
    private readonly perm: Uint8Array

    constructor(seed: Seed) {
        this.perm = createPermutationTable(seed).perm
    }

    sample(x: number, y: number): number {
        const floorX = Math.floor(x)
        const floorY = Math.floor(y)

        const cellX = floorX & 255
        const cellY = floorY & 255

        const fracX = x - floorX
        const fracY = y - floorY

        const u = fade(fracX)
        const v = fade(fracY)

        const perm = this.perm
        const a = perm[cellX] + cellY
        const b = perm[cellX + 1] + cellY

        const bottom = lerp(u, grad(perm[a], fracX, fracY), grad(perm[b], fracX - 1, fracY))
        const top = lerp(
            u,
            grad(perm[a + 1], fracX, fracY - 1),
            grad(perm[b + 1], fracX - 1, fracY - 1)
        )

        return NORMALIZE_2D * lerp(v, bottom, top)
    }
}