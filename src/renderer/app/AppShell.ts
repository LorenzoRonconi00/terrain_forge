import { Pane } from 'tweakpane'
import { DungeonView } from '../canvas/DungeonView'
import { Viewer } from '../three/Viewer'
import { DungeonPanel } from '../ui/DungeonPanel'
import { DungeonStore } from '../ui/dungeonStore'
import { TerrainPanel } from '../ui/TerrainPanel'
import { TerrainStore } from '../ui/store'

export class AppShell {
    private readonly pane: Pane
    private readonly viewer: Viewer
    private readonly dungeonCanvas: HTMLCanvasElement
    private readonly dungeonView: DungeonView
    private readonly terrainStore: TerrainStore
    private readonly terrainPanel: TerrainPanel
    private readonly terrainUnsubscribe: () => void
    private readonly dungeonStore: DungeonStore
    private readonly dungeonPanel: DungeonPanel
    private readonly dungeonUnsubscribe: () => void

    constructor(
        terrainCanvas: HTMLCanvasElement,
        dungeonCanvas: HTMLCanvasElement,
        panelContainer: HTMLElement
    ) {
        this.dungeonCanvas = dungeonCanvas

        this.pane = new Pane({ title: 'Terrain Forge', container: panelContainer })
        const tab = this.pane.addTab({ pages: [{ title: 'Terrain' }, { title: 'Dungeon' }] })

        this.viewer = new Viewer(terrainCanvas)
        this.terrainStore = new TerrainStore()
        this.terrainPanel = new TerrainPanel(this.terrainStore, this.viewer, tab.pages[0], () =>
            this.pane.refresh()
        )
        this.terrainUnsubscribe = this.terrainStore.subscribe((params, field) => {
            this.viewer.setTerrain(field, params.seaLevel)
        })

        this.dungeonView = new DungeonView(dungeonCanvas)
        this.dungeonStore = new DungeonStore()
        this.dungeonPanel = new DungeonPanel(this.dungeonStore, this.dungeonView, tab.pages[1], () =>
            this.pane.refresh()
        )
        this.dungeonUnsubscribe = this.dungeonStore.subscribe((_params, dungeon) => {
            this.dungeonView.setDungeon(dungeon)
        })

        tab.on('select', (event) => {
            this.setActivePage(event.index)
        })

        this.setActivePage(0)
    }

    private setActivePage(index: number): void {
        const isTerrain = index === 0
        this.viewer.canvas.style.display = isTerrain ? 'block' : 'none'
        this.dungeonCanvas.style.display = isTerrain ? 'none' : 'block'
        if (!isTerrain) {
            this.dungeonView.render()
        }
    }

    dispose(): void {
        this.terrainUnsubscribe()
        this.terrainPanel.dispose()
        this.viewer.dispose()
        this.dungeonUnsubscribe()
        this.dungeonPanel.dispose()
        this.dungeonView.dispose()
        this.pane.dispose()
    }
}