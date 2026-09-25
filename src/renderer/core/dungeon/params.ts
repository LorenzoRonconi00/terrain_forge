export interface DungeonParams {
    seed: number
    width: number
    height: number
    minLeafSize: number
    maxDepth: number
    roomMinSize: number
    roomMaxSize: number
    roomPadding: number
    corridorWidth: number
    extraConnections: number
    splitRandomness: number
}

export const DEFAULT_DUNGEON_PARAMS: DungeonParams = {
    seed: 1337,
    width: 96,
    height: 96,
    minLeafSize: 12,
    maxDepth: 6,
    roomMinSize: 5,
    roomMaxSize: 10,
    roomPadding: 1,
    corridorWidth: 2,
    extraConnections: 3,
    splitRandomness: 0.25
}