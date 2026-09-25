import { generateDungeon, type Dungeon } from '../core/dungeon/dungeon'
import { DEFAULT_DUNGEON_PARAMS, type DungeonParams } from '../core/dungeon/params'

export type DungeonListener = (params: DungeonParams, dungeon: Dungeon) => void

export class DungeonStore {
    private params: DungeonParams
    private dungeon: Dungeon
    private readonly listeners = new Set<DungeonListener>()

    constructor(initial: DungeonParams = DEFAULT_DUNGEON_PARAMS) {
        this.params = { ...initial }
        this.dungeon = generateDungeon(this.params)
    }

    getParams(): DungeonParams {
        return { ...this.params }
    }

    getDungeon(): Dungeon {
        return this.dungeon
    }

    setParams(patch: Partial<DungeonParams>): void {
        this.params = { ...this.params, ...patch }
        this.dungeon = generateDungeon(this.params)
        this.emit()
    }

    subscribe(listener: DungeonListener): () => void {
        this.listeners.add(listener)
        listener(this.params, this.dungeon)
        return () => {
            this.listeners.delete(listener)
        }
    }

    private emit(): void {
        for (const listener of this.listeners) {
            listener(this.params, this.dungeon)
        }
    }
}