import type { Rng } from '../prng'
import { collectLeaves, type BspNode } from './bsp'
import type { DungeonParams } from './params'
import type { Room } from './rooms'
import { Tile } from './tiles'

export interface DungeonConnection {
    from: number
    to: number
}

export function buildCorridors(
    root: BspNode,
    leaves: BspNode[],
    rooms: Room[],
    tiles: Uint8Array,
    width: number,
    height: number,
    params: Pick<DungeonParams, 'corridorWidth' | 'extraConnections'>,
    rng: Rng
): DungeonConnection[] {
    const leafToRoom = new Map<BspNode, Room>()
    leaves.forEach((leaf, index) => leafToRoom.set(leaf, rooms[index]))

    const connections: DungeonConnection[] = []
    connectTree(root, leafToRoom, tiles, width, height, params.corridorWidth, connections, rng)
    addLoopConnections(
        rooms,
        connections,
        tiles,
        width,
        height,
        params.corridorWidth,
        params.extraConnections,
        rng
    )
    markDoors(tiles, width, height)

    return connections
}

function connectTree(
    node: BspNode,
    leafToRoom: Map<BspNode, Room>,
    tiles: Uint8Array,
    width: number,
    height: number,
    corridorWidth: number,
    connections: DungeonConnection[],
    rng: Rng
): void {
    if (!node.left || !node.right) {
        return
    }

    connectTree(node.left, leafToRoom, tiles, width, height, corridorWidth, connections, rng)
    connectTree(node.right, leafToRoom, tiles, width, height, corridorWidth, connections, rng)

    const leftRooms = collectRoomsUnder(node.left, leafToRoom)
    const rightRooms = collectRoomsUnder(node.right, leafToRoom)
    const roomA = leftRooms[Math.floor(rng.next() * leftRooms.length)]
    const roomB = rightRooms[Math.floor(rng.next() * rightRooms.length)]

    carveCorridor(tiles, width, height, roomA, roomB, corridorWidth, rng)
    connections.push({ from: roomA.id, to: roomB.id })
}

function collectRoomsUnder(node: BspNode, leafToRoom: Map<BspNode, Room>): Room[] {
    return collectLeaves(node).map((leaf) => {
        const room = leafToRoom.get(leaf)
        if (!room) {
            throw new Error('Missing room for BSP leaf')
        }
        return room
    })
}

function connectionKey(a: number, b: number): string {
    return a < b ? `${a}:${b}` : `${b}:${a}`
}

function addLoopConnections(
    rooms: Room[],
    connections: DungeonConnection[],
    tiles: Uint8Array,
    width: number,
    height: number,
    corridorWidth: number,
    extraConnections: number,
    rng: Rng
): void {
    if (rooms.length < 2 || extraConnections <= 0) {
        return
    }

    const existing = new Set(connections.map((c) => connectionKey(c.from, c.to)))
    const maxAttempts = extraConnections * 20
    let attempts = 0
    let added = 0

    while (added < extraConnections && attempts < maxAttempts) {
        attempts += 1
        const a = rooms[Math.floor(rng.next() * rooms.length)]
        const b = rooms[Math.floor(rng.next() * rooms.length)]
        if (a.id === b.id) {
            continue
        }
        const key = connectionKey(a.id, b.id)
        if (existing.has(key)) {
            continue
        }
        existing.add(key)
        carveCorridor(tiles, width, height, a, b, corridorWidth, rng)
        connections.push({ from: a.id, to: b.id })
        added += 1
    }
}

function carveCorridor(
    tiles: Uint8Array,
    width: number,
    height: number,
    roomA: Room,
    roomB: Room,
    corridorWidth: number,
    rng: Rng
): void {
    const ax = Math.floor(roomA.x + roomA.width / 2)
    const ay = Math.floor(roomA.y + roomA.height / 2)
    const bx = Math.floor(roomB.x + roomB.width / 2)
    const by = Math.floor(roomB.y + roomB.height / 2)

    if (rng.next() < 0.5) {
        carveHorizontal(tiles, width, height, ax, bx, ay, corridorWidth)
        carveVertical(tiles, width, height, ay, by, bx, corridorWidth)
    } else {
        carveVertical(tiles, width, height, ay, by, ax, corridorWidth)
        carveHorizontal(tiles, width, height, ax, bx, by, corridorWidth)
    }
}

function carveHorizontal(
    tiles: Uint8Array,
    width: number,
    height: number,
    x0: number,
    x1: number,
    y: number,
    corridorWidth: number
): void {
    const from = Math.min(x0, x1)
    const to = Math.max(x0, x1)
    for (let x = from; x <= to; x++) {
        for (let offset = 0; offset < corridorWidth; offset++) {
            const ty = y + offset - Math.floor(corridorWidth / 2)
            if (x < 0 || x >= width || ty < 0 || ty >= height) {
                continue
            }
            paintCorridorTile(tiles, ty * width + x)
        }
    }
}

function carveVertical(
    tiles: Uint8Array,
    width: number,
    height: number,
    y0: number,
    y1: number,
    x: number,
    corridorWidth: number
): void {
    const from = Math.min(y0, y1)
    const to = Math.max(y0, y1)
    for (let y = from; y <= to; y++) {
        for (let offset = 0; offset < corridorWidth; offset++) {
            const tx = x + offset - Math.floor(corridorWidth / 2)
            if (tx < 0 || tx >= width || y < 0 || y >= height) {
                continue
            }
            paintCorridorTile(tiles, y * width + tx)
        }
    }
}

function paintCorridorTile(tiles: Uint8Array, index: number): void {
    if (tiles[index] === Tile.Wall) {
        tiles[index] = Tile.Corridor
    }
}

function markDoors(tiles: Uint8Array, width: number, height: number): void {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x
            if (tiles[index] === Tile.Corridor && isAdjacentToFloor(tiles, width, height, x, y)) {
                tiles[index] = Tile.Door
            }
        }
    }
}

function isAdjacentToFloor(
    tiles: Uint8Array,
    width: number,
    height: number,
    x: number,
    y: number
): boolean {
    const neighbors: [number, number][] = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1]
    ]
    for (const [nx, ny] of neighbors) {
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
            continue
        }
        if (tiles[ny * width + nx] === Tile.Floor) {
            return true
        }
    }
    return false
}