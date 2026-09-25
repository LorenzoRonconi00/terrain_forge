import type { TabPageApi } from 'tweakpane'
import { encodeHeightmapPng } from '../core/export/heightmapPng'
import { encodeTerrainObj } from '../core/export/meshObj'
import { encodeTerrainJson } from '../core/export/terrainJson'
import type { Heightfield } from '../core/terrain/heightfield'
import { DEFAULT_TERRAIN_PARAMS, type TerrainParams } from '../core/terrain/params'
import type { Viewer } from '../three/Viewer'
import { debounce } from './debounce'
import type { TerrainStore } from './store'

const APPLY_DELAY_MS = 120

export class TerrainPanel {
    private readonly state: TerrainParams
    private readonly store: TerrainStore
    private readonly viewer: Viewer
    private readonly refresh: () => void
    private readonly apply = debounce(() => this.store.setParams(this.state), APPLY_DELAY_MS)

    constructor(store: TerrainStore, viewer: Viewer, container: TabPageApi, refresh: () => void) {
        this.store = store
        this.viewer = viewer
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
            Object.assign(this.state, DEFAULT_TERRAIN_PARAMS)
            this.refresh()
            this.store.setParams(this.state)
        })
        general.addBinding(this.state, 'worldSize', { min: 10, max: 500, step: 1 })
        general.addBinding(this.state, 'width', { min: 16, max: 512, step: 1 })
        general.addBinding(this.state, 'height', { min: 16, max: 512, step: 1 })
        general.on('change', () => this.apply())

        const noise = container.addFolder({ title: 'Noise' })
        noise.addBinding(this.state, 'noiseType', {
            options: { Perlin: 'perlin', Simplex: 'simplex' }
        })
        noise.addBinding(this.state, 'scale', { min: 1, max: 200, step: 0.5 })
        noise.addBinding(this.state, 'octaves', { min: 1, max: 8, step: 1 })
        noise.addBinding(this.state, 'persistence', { min: 0, max: 1, step: 0.01 })
        noise.addBinding(this.state, 'lacunarity', { min: 1.5, max: 3.5, step: 0.01 })
        noise.addBinding(this.state, 'offsetX', { min: -500, max: 500, step: 1 })
        noise.addBinding(this.state, 'offsetY', { min: -500, max: 500, step: 1 })
        noise.on('change', () => this.apply())

        const shape = container.addFolder({ title: 'Shape' })
        shape.addBinding(this.state, 'heightScale', { min: 0, max: 100, step: 0.5 })
        shape.addBinding(this.state, 'elevationExponent', { min: 0.2, max: 5, step: 0.05 })
        shape.addBinding(this.state, 'terraces', { min: 0, max: 20, step: 1 })
        shape.addBinding(this.state, 'seaLevel', { min: 0, max: 1, step: 0.01 })
        shape.on('change', () => this.apply())

        const erosion = container.addFolder({ title: 'Erosion' })
        erosion.addBinding(this.state, 'erosionEnabled')
        erosion.addBinding(this.state, 'erosionDroplets', { min: 0, max: 150000, step: 1000 })
        erosion.addBinding(this.state, 'erosionRadius', { min: 1, max: 6, step: 1 })
        erosion.on('change', () => this.apply())

        const display = container.addFolder({ title: 'Display' })
        const displayState = { wireframe: false }
        display.addBinding(displayState, 'wireframe').on('change', (event) => {
            this.viewer.setWireframe(event.value)
        })
        display.addBinding(this.viewer.stats, 'fps', {
            readonly: true,
            view: 'graph',
            min: 0,
            max: 144,
            interval: 200
        })

        const exportFolder = container.addFolder({ title: 'Export' })
        exportFolder.addButton({ title: 'Heightmap PNG' }).on('click', () => {
            void this.exportFile('png', encodeHeightmapPng(this.currentField()), [
                { name: 'PNG image', extensions: ['png'] }
            ])
        })
        exportFolder.addButton({ title: 'Terrain JSON' }).on('click', () => {
            void this.exportFile('json', encodeTerrainJson(this.currentField(), this.state), [
                { name: 'JSON', extensions: ['json'] }
            ])
        })
        exportFolder.addButton({ title: 'Mesh OBJ' }).on('click', () => {
            void this.exportFile('obj', encodeTerrainObj(this.currentField()), [
                { name: 'Wavefront OBJ', extensions: ['obj'] }
            ])
        })
    }

    dispose(): void {
        this.apply.cancel()
    }

    private currentField(): Heightfield {
        this.apply.cancel()
        this.store.setParams(this.state)
        return this.store.getField()
    }

    private async exportFile(
        extension: string,
        data: Uint8Array,
        filters: { name: string; extensions: string[] }[]
    ): Promise<void> {
        const field = this.store.getField()
        const result = await window.api.saveFile({
            data,
            defaultName: `terrain_${this.state.seed}_${field.width}x${field.height}.${extension}`,
            filters
        })
        if (!result.ok && !result.canceled) {
            console.error(`Export (${extension}) failed:`, result.error)
        }
    }
}