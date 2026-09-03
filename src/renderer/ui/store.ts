import { generateHeightfield, type Heightfield } from '../core/terrain/heightfield'
import { DEFAULT_TERRAIN_PARAMS, type TerrainParams } from '../core/terrain/params'

export type TerrainListener = (params: TerrainParams, field: Heightfield) => void

export class TerrainStore {
    private params: TerrainParams
    private field: Heightfield
    private readonly listeners = new Set<TerrainListener>()

    constructor(initial: TerrainParams = DEFAULT_TERRAIN_PARAMS) {
        this.params = { ...initial }
        this.field = generateHeightfield(this.params)
    }

    getParams(): TerrainParams {
        return { ...this.params }
    }

    getField(): Heightfield {
        return this.field
    }

    setParams(patch: Partial<TerrainParams>): void {
        this.params = { ...this.params, ...patch }
        this.field = generateHeightfield(this.params)
        this.emit()
    }

    subscribe(listener: TerrainListener): () => void {
        this.listeners.add(listener)
        listener(this.params, this.field)
        return () => {
            this.listeners.delete(listener)
        }
    }

    private emit(): void {
        for (const listener of this.listeners) {
            listener(this.params, this.field)
        }
    }
}