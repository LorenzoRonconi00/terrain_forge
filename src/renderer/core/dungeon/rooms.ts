import type { Rng } from '../prng'
import type { BspNode, Rect } from './bsp'
import type { DungeonParams } from './params'

export interface Room {
    id: number
    x: number
    y: number
    width: number
    height: number
}

type RoomOptions = Pick<DungeonParams, 'roomMinSize' | 'roomMaxSize' | 'roomPadding'>

export function placeRoom(rect: Rect, options: RoomOptions, rng: Rng, id: number): Room {
    const availableWidth = Math.max(3, rect.width - options.roomPadding * 2)
    const availableHeight = Math.max(3, rect.height - options.roomPadding * 2)

    const minSize = Math.max(3, Math.min(options.roomMinSize, availableWidth, availableHeight))
    const maxWidth = Math.max(minSize, Math.min(options.roomMaxSize, availableWidth))
    const maxHeight = Math.max(minSize, Math.min(options.roomMaxSize, availableHeight))

    const width = Math.round(minSize + rng.next() * (maxWidth - minSize))
    const height = Math.round(minSize + rng.next() * (maxHeight - minSize))

    const slackX = Math.max(0, rect.width - options.roomPadding * 2 - width)
    const slackY = Math.max(0, rect.height - options.roomPadding * 2 - height)

    const x = rect.x + options.roomPadding + Math.floor(rng.next() * (slackX + 1))
    const y = rect.y + options.roomPadding + Math.floor(rng.next() * (slackY + 1))

    return { id, x, y, width, height }
}

export function placeRooms(leaves: BspNode[], options: RoomOptions, rng: Rng): Room[] {
    return leaves.map((leaf, index) => placeRoom(leaf.rect, options, rng, index))
}