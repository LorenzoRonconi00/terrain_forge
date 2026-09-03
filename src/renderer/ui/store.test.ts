import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_TERRAIN_PARAMS } from '../core/terrain/params'
import { TerrainStore } from './store'

function makeStore(): TerrainStore {
    return new TerrainStore({ ...DEFAULT_TERRAIN_PARAMS, width: 32, height: 32 })
}

describe('TerrainStore', () => {
    it('generates an initial field from the given params', () => {
        const store = makeStore()
        expect(store.getField().data).toHaveLength(32 * 32)
    })

    it('calls a new subscriber immediately with the current state', () => {
        const store = makeStore()
        const listener = vi.fn()
        store.subscribe(listener)
        expect(listener).toHaveBeenCalledTimes(1)
        expect(listener).toHaveBeenCalledWith(store.getParams(), store.getField())
    })

    it('regenerates the field and notifies on setParams', () => {
        const store = makeStore()
        const listener = vi.fn()
        store.subscribe(listener)
        const before = store.getField()

        store.setParams({ seed: store.getParams().seed + 1 })

        expect(listener).toHaveBeenCalledTimes(2)
        expect(store.getField()).not.toBe(before)
        expect(Array.from(store.getField().data)).not.toEqual(Array.from(before.data))
    })

    it('merges the patch instead of replacing all params', () => {
        const store = makeStore()
        store.setParams({ octaves: 3 })
        expect(store.getParams().octaves).toBe(3)
        expect(store.getParams().seed).toBe(DEFAULT_TERRAIN_PARAMS.seed)
    })

    it('stops notifying after unsubscribe', () => {
        const store = makeStore()
        const listener = vi.fn()
        const unsubscribe = store.subscribe(listener)
        unsubscribe()
        store.setParams({ octaves: 2 })
        expect(listener).toHaveBeenCalledTimes(1)
    })

    it('returns param copies so callers cannot mutate internal state', () => {
        const store = makeStore()
        const params = store.getParams()
        params.seed = 999
        expect(store.getParams().seed).toBe(DEFAULT_TERRAIN_PARAMS.seed)
    })
})