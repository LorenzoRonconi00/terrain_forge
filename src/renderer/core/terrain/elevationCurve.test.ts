import { describe, expect, it } from 'vitest'
import { applyElevationCurve, clamp01 } from './elevationCurve'

const LINEAR = { exponent: 1, terraces: 0 }

describe('clamp01', () => {
    it('clamps below zero and above one, leaves the middle untouched', () => {
        expect(clamp01(-0.5)).toBe(0)
        expect(clamp01(1.5)).toBe(1)
        expect(clamp01(0.42)).toBe(0.42)
    })
})

describe('applyElevationCurve', () => {
    it('with exponent 1 and no terraces is the identity on [0, 1]', () => {
        for (const value of [0, 0.1, 0.5, 0.9, 1]) {
            expect(applyElevationCurve(value, LINEAR)).toBeCloseTo(value, 12)
        }
    })

    it('keeps the endpoints fixed for any exponent', () => {
        for (const exponent of [0.25, 1, 2, 4]) {
            expect(applyElevationCurve(0, { exponent, terraces: 0 })).toBe(0)
            expect(applyElevationCurve(1, { exponent, terraces: 0 })).toBe(1)
        }
    })

    it('exponent > 1 lowers midtones, exponent < 1 raises them', () => {
        expect(applyElevationCurve(0.5, { exponent: 3, terraces: 0 })).toBeLessThan(0.5)
        expect(applyElevationCurve(0.5, { exponent: 0.5, terraces: 0 })).toBeGreaterThan(0.5)
    })

    it('is monotonic non-decreasing', () => {
        let previous = -1
        for (let x = 0; x <= 1; x += 0.02) {
            const y = applyElevationCurve(x, { exponent: 2.5, terraces: 0 })
            expect(y).toBeGreaterThanOrEqual(previous)
            previous = y
        }
    })

    it('quantizes into terrace steps', () => {
        const distinct = new Set<number>()
        for (let x = 0; x <= 1; x += 0.001) {
            distinct.add(applyElevationCurve(x, { exponent: 1, terraces: 5 }))
        }
        expect(distinct.size).toBeLessThanOrEqual(6)
        for (const value of distinct) {
            expect(value * 5).toBeCloseTo(Math.round(value * 5), 9)
        }
    })

    it('always returns a value within [0, 1]', () => {
        for (const value of [-2, 0, 0.3, 1, 3]) {
            for (const exponent of [0.1, 1, 5]) {
                const result = applyElevationCurve(value, { exponent, terraces: 3 })
                expect(result).toBeGreaterThanOrEqual(0)
                expect(result).toBeLessThanOrEqual(1)
            }
        }
    })
})