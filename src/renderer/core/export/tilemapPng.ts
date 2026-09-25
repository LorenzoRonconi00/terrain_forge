import type { Dungeon } from '../dungeon/dungeon'
import { Tile } from '../dungeon/tiles'
import { encodePng } from './png'

export const TILE_GRAY: Record<number, number> = {
    [Tile.Wall]: 10,
    [Tile.Floor]: 235,
    [Tile.Corridor]: 150,
    [Tile.Door]: 90
}

function buildScanlines(dungeon: Dungeon): Uint8Array {
    const { width, height, tiles } = dungeon
    const stride = 1 + width
    const raw = new Uint8Array(stride * height)

    for (let row = 0; row < height; row++) {
        const rowStart = row * stride
        raw[rowStart] = 0
        for (let col = 0; col < width; col++) {
            raw[rowStart + 1 + col] = TILE_GRAY[tiles[row * width + col]] ?? 0
        }
    }

    return raw
}

export function encodeTilemapPng(dungeon: Dungeon): Uint8Array {
    return encodePng({
        width: dungeon.width,
        height: dungeon.height,
        bitDepth: 8,
        colorType: 0,
        scanlines: buildScanlines(dungeon)
    })
}