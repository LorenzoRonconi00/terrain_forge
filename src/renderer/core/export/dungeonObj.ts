import type { Dungeon } from '../dungeon/dungeon'
import { Tile } from '../dungeon/tiles'

const WALL_HEIGHT = 3

interface ObjBuilder {
    vertexLines: string[]
    normalLines: string[]
    faceLines: string[]
    vertexCount: number
    normalCache: Map<string, number>
}

function fmt(value: number): string {
    return (value + 0).toFixed(4)
}

function createBuilder(): ObjBuilder {
    return {
        vertexLines: [],
        normalLines: [],
        faceLines: [],
        vertexCount: 0,
        normalCache: new Map()
    }
}

function normalIndex(builder: ObjBuilder, nx: number, ny: number, nz: number): number {
    const key = `${nx},${ny},${nz}`
    const cached = builder.normalCache.get(key)
    if (cached !== undefined) {
        return cached
    }
    builder.normalLines.push(`vn ${fmt(nx)} ${fmt(ny)} ${fmt(nz)}`)
    const index = builder.normalCache.size + 1
    builder.normalCache.set(key, index)
    return index
}

function addQuad(
    builder: ObjBuilder,
    corners: [number, number, number][],
    normal: [number, number, number]
): void {
    const start = builder.vertexCount + 1
    for (const [x, y, z] of corners) {
        builder.vertexLines.push(`v ${fmt(x)} ${fmt(y)} ${fmt(z)}`)
        builder.vertexCount += 1
    }
    const ni = normalIndex(builder, ...normal)
    builder.faceLines.push(`f ${start}//${ni} ${start + 1}//${ni} ${start + 2}//${ni}`)
    builder.faceLines.push(`f ${start}//${ni} ${start + 2}//${ni} ${start + 3}//${ni}`)
}

function addFloorQuad(builder: ObjBuilder, x: number, z: number): void {
    addQuad(
        builder,
        [
            [x, 0, z],
            [x, 0, z + 1],
            [x + 1, 0, z + 1],
            [x + 1, 0, z]
        ],
        [0, 1, 0]
    )
}

function addWallBox(builder: ObjBuilder, x: number, z: number): void {
    const y0 = 0
    const y1 = WALL_HEIGHT

    addQuad(builder, [[x, y1, z], [x, y1, z + 1], [x + 1, y1, z + 1], [x + 1, y1, z]], [0, 1, 0])
    addQuad(builder, [[x, y0, z], [x + 1, y0, z], [x + 1, y0, z + 1], [x, y0, z + 1]], [0, -1, 0])
    addQuad(builder, [[x, y0, z], [x, y0, z + 1], [x, y1, z + 1], [x, y1, z]], [-1, 0, 0])
    addQuad(
        builder,
        [[x + 1, y0, z + 1], [x + 1, y0, z], [x + 1, y1, z], [x + 1, y1, z + 1]],
        [1, 0, 0]
    )
    addQuad(builder, [[x + 1, y0, z], [x, y0, z], [x, y1, z], [x + 1, y1, z]], [0, 0, -1])
    addQuad(
        builder,
        [[x, y0, z + 1], [x + 1, y0, z + 1], [x + 1, y1, z + 1], [x, y1, z + 1]],
        [0, 0, 1]
    )
}

function isWalkable(tile: number): boolean {
    return tile === Tile.Floor || tile === Tile.Corridor || tile === Tile.Door
}

function hasWalkableNeighbor(dungeon: Dungeon, x: number, z: number): boolean {
    const { width, height, tiles } = dungeon
    const neighbors: [number, number][] = [
        [x - 1, z],
        [x + 1, z],
        [x, z - 1],
        [x, z + 1]
    ]
    for (const [nx, nz] of neighbors) {
        if (nx < 0 || nx >= width || nz < 0 || nz >= height) {
            continue
        }
        if (isWalkable(tiles[nz * width + nx])) {
            return true
        }
    }
    return false
}

export function encodeDungeonObj(dungeon: Dungeon): Uint8Array {
    const builder = createBuilder()

    for (let z = 0; z < dungeon.height; z++) {
        for (let x = 0; x < dungeon.width; x++) {
            const tile = dungeon.tiles[z * dungeon.width + x]
            if (isWalkable(tile)) {
                addFloorQuad(builder, x, z)
            } else if (tile === Tile.Wall && hasWalkableNeighbor(dungeon, x, z)) {
                addWallBox(builder, x, z)
            }
        }
    }

    const lines = [
        '# Terrain Forge dungeon OBJ export',
        `# grid ${dungeon.width} x ${dungeon.height}, 1 unit per tile`,
        'o dungeon',
        ...builder.vertexLines,
        ...builder.normalLines,
        'g floors_and_walls',
        ...builder.faceLines
    ]

    return new TextEncoder().encode(lines.join('\n') + '\n')
}