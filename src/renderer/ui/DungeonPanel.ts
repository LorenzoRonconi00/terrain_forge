import type { TabPageApi } from 'tweakpane'
import type { DungeonView } from '../canvas/DungeonView'
import type { Dungeon } from '../core/dungeon/dungeon'
import { DEFAULT_DUNGEON_PARAMS, type DungeonParams } from '../core/dungeon/params'
import { encodeDungeonJson } from '../core/export/dungeonJson'
import { encodeDungeonObj } from '../core/export/dungeonObj'
import { encodeDungeonTileset, encodeDungeonTmx } from '../core/export/dungeonTmx'
import { encodeTilemapPng } from '../core/export/tilemapPng'
import { debounce } from './debounce'
import type { DungeonStore } from './dungeonStore'

const APPLY_DELAY_MS = 120

export class DungeonPanel {
    private readonly state: DungeonParams
    private readonly store: DungeonStore
    private readonly view: DungeonView
    private readonly refresh: () => void
    private readonly apply = debounce(() => this.store.setParams(this.state), APPLY_DELAY_MS)

    constructor(store: DungeonStore, view: DungeonView, container: TabPageApi, refresh: () => void) {
        this.store = store
        this.view = view
        this.refresh = refresh
        this.state = store.getParams()

        const general = container.addFolder({ title: 'General' })
        general.addBinding(this.state, 'seed', { step: 1 })
        general.addButton({ title: 'Randomize seed' }).on('click', () => {
            this.state.seed = Math.floor(Math.random() * 1_000_000)
            this.refresh()
            this.store.setParams(this.state)
        })
        general.addButton({ title: 'Reset' }).on('click', () => {
            Object.assign(this.state, DEFAULT_DUNGEON_PARAMS)
            this.refresh()
            this.store.setParams(this.state)
        })
        general.addBinding(this.state, 'width', { min: 32, max: 200, step: 1 })
        general.addBinding(this.state, 'height', { min: 32, max: 200, step: 1 })
        general.on('change', () => this.apply())

        const layout = container.addFolder({ title: 'Layout' })
        layout.addBinding(this.state, 'minLeafSize', { min: 6, max: 40, step: 1 })
        layout.addBinding(this.state, 'maxDepth', { min: 1, max: 8, step: 1 })
        layout.addBinding(this.state, 'splitRandomness', { min: 0, max: 0.9, step: 0.05 })
        layout.on('change', () => this.apply())

        const rooms = container.addFolder({ title: 'Rooms' })
        rooms.addBinding(this.state, 'roomMinSize', { min: 3, max: 20, step: 1 })
        rooms.addBinding(this.state, 'roomMaxSize', { min: 3, max: 30, step: 1 })
        rooms.addBinding(this.state, 'roomPadding', { min: 0, max: 4, step: 1 })
        rooms.on('change', () => this.apply())

        const corridors = container.addFolder({ title: 'Corridors' })
        corridors.addBinding(this.state, 'corridorWidth', { min: 1, max: 4, step: 1 })
        corridors.addBinding(this.state, 'extraConnections', { min: 0, max: 15, step: 1 })
        corridors.on('change', () => this.apply())

        const display = container.addFolder({ title: 'Display' })
        display.addButton({ title: 'Reset view' }).on('click', () => {
            this.view.resetView()
        })

        const exportFolder = container.addFolder({ title: 'Export' })
        exportFolder.addButton({ title: 'Dungeon JSON' }).on('click', () => {
            void this.exportFile('json', encodeDungeonJson(this.currentDungeon(), this.state), [
                { name: 'JSON', extensions: ['json'] }
            ])
        })
        exportFolder.addButton({ title: 'Tilemap PNG' }).on('click', () => {
            void this.exportFile('png', encodeTilemapPng(this.currentDungeon()), [
                { name: 'PNG image', extensions: ['png'] }
            ])
        })
        exportFolder.addButton({ title: 'Mesh OBJ' }).on('click', () => {
            void this.exportFile('obj', encodeDungeonObj(this.currentDungeon()), [
                { name: 'Wavefront OBJ', extensions: ['obj'] }
            ])
        })
        exportFolder.addButton({ title: 'Tiled TMX' }).on('click', () => {
            void this.exportFile('tmx', encodeDungeonTmx(this.currentDungeon()), [
                { name: 'Tiled map', extensions: ['tmx'] }
            ])
        })
        exportFolder.addButton({ title: 'Tiled Tileset PNG' }).on('click', () => {
            void this.exportFile('png', encodeDungeonTileset(), [
                { name: 'PNG image', extensions: ['png'] }
            ])
        })
    }

    dispose(): void {
        this.apply.cancel()
    }

    private currentDungeon(): Dungeon {
        this.apply.cancel()
        this.store.setParams(this.state)
        return this.store.getDungeon()
    }

    private async exportFile(
        extension: string,
        data: Uint8Array,
        filters: { name: string; extensions: string[] }[]
    ): Promise<void> {
        const dungeon = this.store.getDungeon()
        const result = await window.api.saveFile({
            data,
            defaultName: `dungeon_${this.state.seed}_${dungeon.width}x${dungeon.height}.${extension}`,
            filters
        })
        if (!result.ok && !result.canceled) {
            console.error(`Export (${extension}) failed:`, result.error)
        }
    }
}