import { Rng } from '../prng'
import { buildBspTree, collectLeaves, type Rect } from './bsp'
import { buildCorridors, type DungeonConnection } from './corridors'
import type { DungeonParams } from './params'
import { placeRooms, type Room } from './rooms'
import { Tile } from './tiles'

export interface Dungeon {
    width: number
    height: number
    tiles: Uint8Array
    rooms: Room[]
    connections: DungeonConnection[]
    start: number
    end: number
}

export function generateDungeon(params: DungeonParams): Dungeon {
    const width = Math.max(8, Math.floor(params.width))
    const height = Math.max(8, Math.floor(params.height))

    const rng = new Rng(params.seed)
    const rootRect: Rect = { x: 0, y: 0, width, height }
    const root = buildBspTree(rootRect, params, rng)
    const leaves = collectLeaves(root)
    const rooms = placeRooms(leaves, params, rng)

    const tiles = new Uint8Array(width * height)
    for (const room of rooms) {
        paintRoom(tiles, width, height, room)
    }

    const connections = buildCorridors(root, leaves, rooms, tiles, width, height, params, rng)
    const { start, end } = findFarthestRooms(rooms, connections)

    return { width, height, tiles, rooms, connections, start, end }
}

function paintRoom(tiles: Uint8Array, width: number, height: number, room: Room): void {
    for (let y = room.y; y < room.y + room.height; y++) {
        if (y < 0 || y >= height) {
            continue
        }
        for (let x = room.x; x < room.x + room.width; x++) {
            if (x < 0 || x >= width) {
                continue
            }
            tiles[y * width + x] = Tile.Floor
        }
    }
}

function findFarthestRooms(
    rooms: Room[],
    connections: DungeonConnection[]
): { start: number; end: number } {
    if (rooms.length <= 1) {
        const only = rooms[0]?.id ?? 0
        return { start: only, end: only }
    }

    const adjacency = new Map<number, number[]>()
    for (const room of rooms) {
        adjacency.set(room.id, [])
    }
    for (const connection of connections) {
        adjacency.get(connection.from)?.push(connection.to)
        adjacency.get(connection.to)?.push(connection.from)
    }

    const fromFirst = farthestFrom(rooms[0].id, adjacency)
    const fromFarthest = farthestFrom(fromFirst.node, adjacency)

    return { start: fromFirst.node, end: fromFarthest.node }
}

function farthestFrom(
    source: number,
    adjacency: Map<number, number[]>
): { node: number; distance: number } {
    const distances = new Map<number, number>([[source, 0]])
    const queue = [source]
    let farthestNode = source
    let farthestDistance = 0

    while (queue.length > 0) {
        const current = queue.shift()!
        const currentDistance = distances.get(current) ?? 0
        for (const neighbor of adjacency.get(current) ?? []) {
            if (!distances.has(neighbor)) {
                distances.set(neighbor, currentDistance + 1)
                if (currentDistance + 1 > farthestDistance) {
                    farthestDistance = currentDistance + 1
                    farthestNode = neighbor
                }
                queue.push(neighbor)
            }
        }
    }

    return { node: farthestNode, distance: farthestDistance }
}