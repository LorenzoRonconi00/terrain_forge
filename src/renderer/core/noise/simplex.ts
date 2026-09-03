import { createPermutationTable, type PermutationTable } from '../hash'
import type { Seed } from '../prng'
import type { Noise2D } from './types'

const F2 = 0.5 * (Math.sqrt(3) - 1)
const G2 = (3 - Math.sqrt(3)) / 6

const GRADIENTS_2D: ReadonlyArray<readonly [number, number]> = [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
    [1, 0],
    [-1, 0],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [0, 1],
    [0, -1]
]

export class SimplexNoise2D implements Noise2D {
    private readonly table: PermutationTable

    constructor(seed: Seed) {
        this.table = createPermutationTable(seed)
    }

    sample(x: number, y: number): number {
        const { perm, permMod12 } = this.table

        const skew = (x + y) * F2
        const i = Math.floor(x + skew)
        const j = Math.floor(y + skew)
        const unskew = (i + j) * G2

        const x0 = x - (i - unskew)
        const y0 = y - (j - unskew)

        const upperTriangle = x0 > y0
        const i1 = upperTriangle ? 1 : 0
        const j1 = upperTriangle ? 0 : 1

        const x1 = x0 - i1 + G2
        const y1 = y0 - j1 + G2
        const x2 = x0 - 1 + 2 * G2
        const y2 = y0 - 1 + 2 * G2

        const ii = i & 255
        const jj = j & 255

        return 70 * (
            this.corner(x0, y0, permMod12[ii + perm[jj]]) +
            this.corner(x1, y1, permMod12[ii + i1 + perm[jj + j1]]) +
            this.corner(x2, y2, permMod12[ii + 1 + perm[jj + 1]])
        )
    }

    private corner(x: number, y: number, gradientIndex: number): number {
        let t = 0.5 - x * x - y * y
        if (t < 0) {
            return 0
        }
        const [gx, gy] = GRADIENTS_2D[gradientIndex]
        t *= t
        return t * t * (gx * x + gy * y)
    }
}