import { Color, PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { Heightfield } from '../core/terrain/heightfield'
import { createLights } from './lights'
import { TerrainMesh } from './TerrainMesh'

export class Viewer {
    readonly stats = { fps: 0 }

    readonly canvas: HTMLCanvasElement
    private readonly renderer: WebGLRenderer
    private readonly scene: Scene
    private readonly camera: PerspectiveCamera
    private readonly controls: OrbitControls
    private readonly terrain: TerrainMesh
    private readonly resizeObserver: ResizeObserver

    private frames = 0
    private fpsClock = performance.now()

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas

        this.renderer = new WebGLRenderer({ canvas, antialias: true })
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

        this.scene = new Scene()
        this.scene.background = new Color(0x1a1a1f)

        this.camera = new PerspectiveCamera(50, 1, 0.1, 4000)
        this.camera.position.set(95, 70, 95)

        this.controls = new OrbitControls(this.camera, this.canvas)
        this.controls.enableDamping = true
        this.controls.minDistance = 20
        this.controls.maxDistance = 1500
        this.controls.target.set(0, 0, 0)

        for (const light of createLights()) {
            this.scene.add(light)
        }

        this.terrain = new TerrainMesh()
        this.scene.add(this.terrain.object)

        this.resizeObserver = new ResizeObserver(() => this.resize())
        this.resizeObserver.observe(this.canvas)
        this.resize()

        this.renderer.setAnimationLoop(this.tick)
    }

    setTerrain(field: Heightfield, seaLevel: number): void {
        this.terrain.update(field, seaLevel)
    }

    setWireframe(enabled: boolean): void {
        this.terrain.setWireframe(enabled)
    }

    private resize(): void {
        const width = this.canvas.clientWidth
        const height = this.canvas.clientHeight
        if (width === 0 || height === 0) {
            return
        }
        this.renderer.setSize(width, height, false)
        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()
    }

    private readonly tick = (): void => {
        this.controls.update()
        this.renderer.render(this.scene, this.camera)

        this.frames += 1
        const now = performance.now()
        const elapsed = now - this.fpsClock
        if (elapsed >= 250) {
            this.stats.fps = Math.round((this.frames * 1000) / elapsed)
            this.frames = 0
            this.fpsClock = now
        }
    }

    dispose(): void {
        this.renderer.setAnimationLoop(null)
        this.resizeObserver.disconnect()
        this.controls.dispose()
        this.terrain.dispose()
        this.renderer.dispose()
    }
}