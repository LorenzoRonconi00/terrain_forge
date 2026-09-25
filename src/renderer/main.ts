import { AppShell } from './app/AppShell'

function bootstrap(): void {
    const terrainCanvas = document.querySelector<HTMLCanvasElement>('#viewport')
    const dungeonCanvas = document.querySelector<HTMLCanvasElement>('#dungeon-viewport')
    const panelContainer = document.querySelector<HTMLElement>('#panel')
    if (!terrainCanvas || !dungeonCanvas || !panelContainer) {
        throw new Error(
            'Required DOM nodes (#viewport, #dungeon-viewport, #panel) not found in index.html'
        )
    }

    const shell = new AppShell(terrainCanvas, dungeonCanvas, panelContainer)

    if (import.meta.hot) {
        import.meta.hot.dispose(() => shell.dispose())
    }
}

bootstrap()