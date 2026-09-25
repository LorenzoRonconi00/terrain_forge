import type { Dungeon } from '../core/dungeon/dungeon'
import { Tile } from '../core/dungeon/tiles'

const MIN_ZOOM = 0.2
const MAX_ZOOM = 8
const ZOOM_STEP = 1.1

function colorForTile(tile: number): string {
    switch (tile) {
        case Tile.Floor:
            return '#3a3f4b'
        case Tile.Corridor:
            return '#2b2f38'
        case Tile.Door:
            return '#c9a227'
        default:
            return '#111318'
    }
}

export class DungeonView {
    private readonly canvas: HTMLCanvasElement
    private readonly context: CanvasRenderingContext2D
    private readonly resizeObserver: ResizeObserver

    private dungeon: Dungeon | null = null
    private zoom = 1
    private offsetX = 0
    private offsetY = 0

    private isPanning = false
    private lastPointerX = 0
    private lastPointerY = 0

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas

        const context = canvas.getContext('2d')
        if (!context) {
            throw new Error('2D context not available for the dungeon canvas')
        }
        this.context = context

        this.resizeObserver = new ResizeObserver(() => this.render())
        this.resizeObserver.observe(this.canvas)

        this.canvas.addEventListener('pointerdown', this.onPointerDown)
        this.canvas.addEventListener('pointermove', this.onPointerMove)
        this.canvas.addEventListener('pointerup', this.onPointerUp)
        this.canvas.addEventListener('pointerleave', this.onPointerUp)
        this.canvas.addEventListener('wheel', this.onWheel, { passive: false })
    }

    setDungeon(dungeon: Dungeon): void {
        this.dungeon = dungeon
        this.resetView()
    }

    resetView(): void {
        this.zoom = 1
        this.offsetX = 0
        this.offsetY = 0
        this.render()
    }

    render(): void {
        const width = this.canvas.clientWidth
        const height = this.canvas.clientHeight
        if (width === 0 || height === 0) {
            return
        }

        const dpr = Math.min(window.devicePixelRatio, 2)
        const pixelWidth = Math.round(width * dpr)
        const pixelHeight = Math.round(height * dpr)
        if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
            this.canvas.width = pixelWidth
            this.canvas.height = pixelHeight
        }

        const ctx = this.context
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.fillStyle = '#0c0c10'
        ctx.fillRect(0, 0, width, height)

        const dungeon = this.dungeon
        if (!dungeon) {
            return
        }

        const fitCell = Math.min(width / dungeon.width, height / dungeon.height)
        const cellSize = fitCell * this.zoom
        const gridWidth = dungeon.width * cellSize
        const gridHeight = dungeon.height * cellSize
        const originX = (width - gridWidth) / 2 + this.offsetX
        const originY = (height - gridHeight) / 2 + this.offsetY

        for (let y = 0; y < dungeon.height; y++) {
            for (let x = 0; x < dungeon.width; x++) {
                ctx.fillStyle = colorForTile(dungeon.tiles[y * dungeon.width + x])
                ctx.fillRect(
                    Math.round(originX + x * cellSize),
                    Math.round(originY + y * cellSize),
                    Math.ceil(cellSize),
                    Math.ceil(cellSize)
                )
            }
        }

        this.drawMarker(dungeon, dungeon.start, originX, originY, cellSize, '#4ade80')
        this.drawMarker(dungeon, dungeon.end, originX, originY, cellSize, '#f87171')
    }

    dispose(): void {
        this.resizeObserver.disconnect()
        this.canvas.removeEventListener('pointerdown', this.onPointerDown)
        this.canvas.removeEventListener('pointermove', this.onPointerMove)
        this.canvas.removeEventListener('pointerup', this.onPointerUp)
        this.canvas.removeEventListener('pointerleave', this.onPointerUp)
        this.canvas.removeEventListener('wheel', this.onWheel)
    }

    private drawMarker(
        dungeon: Dungeon,
        roomId: number,
        originX: number,
        originY: number,
        cellSize: number,
        color: string
    ): void {
        const room = dungeon.rooms.find((candidate) => candidate.id === roomId)
        if (!room) {
            return
        }
        const cx = originX + (room.x + room.width / 2) * cellSize
        const cy = originY + (room.y + room.height / 2) * cellSize
        const radius = Math.max(3, cellSize * 0.6)

        this.context.beginPath()
        this.context.fillStyle = color
        this.context.arc(cx, cy, radius, 0, Math.PI * 2)
        this.context.fill()
    }

    private readonly onPointerDown = (event: PointerEvent): void => {
        this.isPanning = true
        this.lastPointerX = event.clientX
        this.lastPointerY = event.clientY
        this.canvas.setPointerCapture(event.pointerId)
    }

    private readonly onPointerMove = (event: PointerEvent): void => {
        if (!this.isPanning) {
            return
        }
        this.offsetX += event.clientX - this.lastPointerX
        this.offsetY += event.clientY - this.lastPointerY
        this.lastPointerX = event.clientX
        this.lastPointerY = event.clientY
        this.render()
    }

    private readonly onPointerUp = (event: PointerEvent): void => {
        this.isPanning = false
        if (this.canvas.hasPointerCapture(event.pointerId)) {
            this.canvas.releasePointerCapture(event.pointerId)
        }
    }

    private readonly onWheel = (event: WheelEvent): void => {
        event.preventDefault()
        const factor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP
        this.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, this.zoom * factor))
        this.render()
    }
}