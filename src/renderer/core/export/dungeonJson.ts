import type { Dungeon } from '../dungeon/dungeon'
import type { DungeonParams } from '../dungeon/params'
import { TILE_LEGEND } from '../dungeon/tiles'

export interface DungeonJson {
    format: 'terrain-forge/dungeon'
    version: 1
    width: number
    height: number
    tileLegend: Record<number, string>
    tiles: number[]
    rooms: Dungeon['rooms']
    connections: Dungeon['connections']
    start: number
    end: number
    params: DungeonParams
}

export function buildDungeonJson(dungeon: Dungeon, params: DungeonParams): DungeonJson {
    return {
        format: 'terrain-forge/dungeon',
        version: 1,
        width: dungeon.width,
        height: dungeon.height,
        tileLegend: TILE_LEGEND,
        tiles: Array.from(dungeon.tiles),
        rooms: dungeon.rooms,
        connections: dungeon.connections,
        start: dungeon.start,
        end: dungeon.end,
        params: { ...params }
    }
}

export function encodeDungeonJson(dungeon: Dungeon, params: DungeonParams): Uint8Array {
    return new TextEncoder().encode(JSON.stringify(buildDungeonJson(dungeon, params)))
}