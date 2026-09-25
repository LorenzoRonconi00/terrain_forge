export const Tile = {
    Wall: 0,
    Floor: 1,
    Corridor: 2,
    Door: 3
} as const

export type Tile = (typeof Tile)[keyof typeof Tile]

export const TILE_LEGEND: Record<Tile, string> = {
    [Tile.Wall]: 'wall',
    [Tile.Floor]: 'floor',
    [Tile.Corridor]: 'corridor',
    [Tile.Door]: 'door'
}