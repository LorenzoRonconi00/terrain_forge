import { Rng, type Seed } from './prng'

export interface PermutationTable {
    perm: Uint8Array
    permMod12: Uint8Array
}

export function createPermutationTable(seed: Seed): PermutationTable {
    const rng = new Rng(seed)

    const base = new Uint8Array(256)
    for (let i = 0; i < 256; i++) {
        base[i] = i
    }
    for (let i = 255; i > 0; i--) {
        const j = rng.int(i + 1)
        const swap = base[i]
        base[i] = base[j]
        base[j] = swap
    }

    const perm = new Uint8Array(512)
    const permMod12 = new Uint8Array(512)
    for (let i = 0; i < 512; i++) {
        const value = base[i & 255]
        perm[i] = value
        permMod12[i] = value % 12
    }

    return { perm, permMod12 }
}