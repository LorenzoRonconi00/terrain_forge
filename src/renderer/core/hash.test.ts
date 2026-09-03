import { describe, expect, it } from 'vitest'
import { createPermutationTable } from './hash'

describe('createPermutationTable', () => {
    it('returns two tables of length 512', () => {
        const { perm, permMod12 } = createPermutationTable(1)
        expect(perm).toHaveLength(512)
        expect(permMod12).toHaveLength(512)
    })

    it('first 256 entries are a permutation of 0..255', () => {
        const { perm } = createPermutationTable(123)
        const seen = new Set<number>()
        for (let i = 0; i < 256; i++) {
            seen.add(perm[i])
        }
        expect(seen.size).toBe(256)
        expect(Math.min(...seen)).toBe(0)
        expect(Math.max(...seen)).toBe(255)
    })

    it('is doubled: perm[i] equals perm[i & 255]', () => {
        const { perm } = createPermutationTable(123)
        for (let i = 256; i < 512; i++) {
            expect(perm[i]).toBe(perm[i & 255])
        }
    })

    it('permMod12 is perm modulo 12', () => {
        const { perm, permMod12 } = createPermutationTable(999)
        for (let i = 0; i < 512; i++) {
            expect(permMod12[i]).toBe(perm[i] % 12)
        }
    })

    it('is deterministic for the same seed', () => {
        const a = createPermutationTable('alps')
        const b = createPermutationTable('alps')
        expect(Array.from(a.perm)).toEqual(Array.from(b.perm))
    })

    it('differs for different seeds', () => {
        const a = createPermutationTable(1)
        const b = createPermutationTable(2)
        expect(Array.from(a.perm)).not.toEqual(Array.from(b.perm))
    })
})