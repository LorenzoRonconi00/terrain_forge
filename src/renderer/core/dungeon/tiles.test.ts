import { describe, expect, it } from 'vitest'
import { Tile, TILE_LEGEND } from './tiles'

describe('tiles', () => {
    it('assigns each tile a distinct numeric value', () => {
        const values = Object.values(Tile)
        expect(new Set(values).size).toBe(values.length)
    })

    it('has a legend entry for every tile value', () => {
        for (const value of Object.values(Tile)) {
            expect(TILE_LEGEND[value]).toBeTypeOf('string')
        }
    })
})