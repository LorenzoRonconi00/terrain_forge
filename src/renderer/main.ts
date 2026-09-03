import { Viewer } from './three/Viewer'
import { ControlPanel } from './ui/ControlPanel'
import { TerrainStore } from './ui/store'

function bootstrap(): void {
    const canvas = document.querySelector<HTMLCanvasElement>('#viewport')
    const panelContainer = document.querySelector<HTMLElement>('#panel')
    if (!canvas || !panelContainer) {
        throw new Error('Required DOM nodes (#viewport, #panel) not found in index.html')
    }

    const viewer = new Viewer(canvas)
    const store = new TerrainStore()
    const panel = new ControlPanel(store, viewer, panelContainer)

    const unsubscribe = store.subscribe((params, field) => {
        viewer.setTerrain(field, params.seaLevel)
    })

    if (import.meta.hot) {
        import.meta.hot.dispose(() => {
            unsubscribe()
            panel.dispose()
            viewer.dispose()
        })
    }
}

bootstrap()