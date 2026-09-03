import { describe, expect, it } from 'vitest'
import { Rng } from './prng'

describe('Rng', () => {
    it('is deterministic for the same numeric seed', () => {
        const a = new Rng(42)
        const b = new Rng(42)
        const seqA = Array.from({ length: 16 }, () => a.next())
        const seqB = Array.from({ length: 16 }, () => b.next())
        expect(seqA).toEqual(seqB)
    })

    it('produces different sequences for different seeds', () => {
        const a = new Rng(1)
        const b = new Rng(2)
        expect(a.next()).not.toEqual(b.next())
    })

    it('is deterministic for string seeds and sensitive to the string', () => {
        const a = new Rng('everest')
        const b = new Rng('everest')
        const seqA = Array.from({ length: 8 }, () => a.next())
        const seqB = Array.from({ length: 8 }, () => b.next())
        expect(seqA).toEqual(seqB)
        expect(new Rng('everest').next()).not.toEqual(new Rng('everes').next())
    })

    it('keeps next() in [0, 1)', () => {
        const rng = new Rng(7)
        for (let i = 0; i < 5000; i++) {
            const value = rng.next()
            expect(value).toBeGreaterThanOrEqual(0)
            expect(value).toBeLessThan(1)
        }
    })

    it('keeps int(n) in [0, n)', () => {
        const rng = new Rng(9)
        for (let i = 0; i < 5000; i++) {
            const value = rng.int(10)
            expect(Number.isInteger(value)).toBe(true)
            expect(value).toBeGreaterThanOrEqual(0)
            expect(value).toBeLessThan(10)
        }
    })

    it('keeps range(min, max) within bounds', () => {
        const rng = new Rng(11)
        for (let i = 0; i < 5000; i++) {
            const value = rng.range(-3, 5)
            expect(value).toBeGreaterThanOrEqual(-3)
            expect(value).toBeLessThan(5)
        }
    })

    it('pick returns an element of the array', () => {
        const rng = new Rng(13)
        const items = ['a', 'b', 'c', 'd'] as const
        for (let i = 0; i < 100; i++) {
            expect(items).toContain(rng.pick(items))
        }
    })
})