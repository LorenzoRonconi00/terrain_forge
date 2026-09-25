import type { Dungeon } from '../dungeon/dungeon'
import { Tile } from '../dungeon/tiles'
import { encodePng } from './png'
import { TILE_GRAY } from './tilemapPng'

const TILE_PIXEL_SIZE = 16
const TILESET_IMAGE_NAME = 'dungeon-tileset.png'

export function encodeDungeonTmx(dungeon: Dungeon): Uint8Array {
    const gids = Array.from(dungeon.tiles, (tile) => tile + 1)

    const dataRows: string[] = []
    for (let row = 0; row < dungeon.height; row++) {
        const start = row * dungeon.width
        const rowValues = gids.slice(start, start + dungeon.width)
        const isLastRow = row === dungeon.height - 1
        dataRows.push(rowValues.join(',') + (isLastRow ? '' : ','))
    }

    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        `<map version="1.10" orientation="orthogonal" renderorder="right-down" width="${dungeon.width}" height="${dungeon.height}" tilewidth="${TILE_PIXEL_SIZE}" tileheight="${TILE_PIXEL_SIZE}" infinite="0" nextlayerid="2" nextobjectid="1">`,
        ` <tileset firstgid="1" name="dungeon-tiles" tilewidth="${TILE_PIXEL_SIZE}" tileheight="${TILE_PIXEL_SIZE}" tilecount="4" columns="4">`,
        `  <image source="${TILESET_IMAGE_NAME}" width="${TILE_PIXEL_SIZE * 4}" height="${TILE_PIXEL_SIZE}"/>`,
        ' </tileset>',
        ` <layer id="1" name="tiles" width="${dungeon.width}" height="${dungeon.height}">`,
        '  <data encoding="csv">',
        ...dataRows,
        '  </data>',
        ' </layer>',
        '</map>'
    ]

    return new TextEncoder().encode(xml.join('\n') + '\n')
}

export function encodeDungeonTileset(): Uint8Array {
    const width = TILE_PIXEL_SIZE * 4
    const height = TILE_PIXEL_SIZE
    const stride = 1 + width
    const raw = new Uint8Array(stride * height)
    const shades = [Tile.Wall, Tile.Floor, Tile.Corridor, Tile.Door].map((tile) => TILE_GRAY[tile])

    for (let row = 0; row < height; row++) {
        const rowStart = row * stride
        raw[rowStart] = 0
        for (let col = 0; col < width; col++) {
            raw[rowStart + 1 + col] = shades[Math.floor(col / TILE_PIXEL_SIZE)]
        }
    }

    return encodePng({ width, height, bitDepth: 8, colorType: 0, scanlines: raw })
}