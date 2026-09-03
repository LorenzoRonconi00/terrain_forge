import { BufferAttribute, BufferGeometry, Color, Mesh, MeshStandardMaterial } from 'three'
import type { Heightfield } from '../core/terrain/heightfield'
import { buildHeightfieldGeometry } from '../core/terrain/geometry'

interface ColorStop {
    at: number
    color: Color
}

const WATER_GRADIENT: ColorStop[] = [
    { at: 0, color: new Color(0x123047) },
    { at: 1, color: new Color(0x2f6f92) }
]

const LAND_GRADIENT: ColorStop[] = [
    { at: 0, color: new Color(0xd8c9a3) },
    { at: 0.06, color: new Color(0x6f9f4e) },
    { at: 0.35, color: new Color(0x47702f) },
    { at: 0.65, color: new Color(0x8a7c6a) },
    { at: 0.9, color: new Color(0xf4f4f4) }
]

function sampleGradient(stops: ColorStop[], t: number, target: Color): void {
    if (t <= stops[0].at) {
        target.copy(stops[0].color)
        return
    }
    const last = stops[stops.length - 1]
    if (t >= last.at) {
        target.copy(last.color)
        return
    }
    for (let i = 1; i < stops.length; i++) {
        const current = stops[i]
        if (t <= current.at) {
            const previous = stops[i - 1]
            const span = current.at - previous.at
            const local = span > 0 ? (t - previous.at) / span : 0
            target.copy(previous.color).lerp(current.color, local)
            return
        }
    }
    target.copy(last.color)
}

export class TerrainMesh {
    readonly object: Mesh
    private geometry: BufferGeometry | null = null

    constructor() {
        const material = new MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.95,
            metalness: 0
        })
        this.object = new Mesh(new BufferGeometry(), material)
    }

    update(field: Heightfield, seaLevel: number): void {
        const { positions, indices } = buildHeightfieldGeometry(field)

        const colors = new Float32Array(field.width * field.height * 3)
        const color = new Color()
        for (let i = 0; i < field.data.length; i++) {
            this.writeColor(field.data[i], seaLevel, color)
            colors[i * 3] = color.r
            colors[i * 3 + 1] = color.g
            colors[i * 3 + 2] = color.b
        }

        const geometry = new BufferGeometry()
        geometry.setAttribute('position', new BufferAttribute(positions, 3))
        geometry.setAttribute('color', new BufferAttribute(colors, 3))
        geometry.setIndex(new BufferAttribute(indices, 1))
        geometry.computeVertexNormals()
        geometry.computeBoundingSphere()

        this.geometry?.dispose()
        this.geometry = geometry
        this.object.geometry = geometry
    }

    dispose(): void {
        this.geometry?.dispose()
        const material = this.object.material as MeshStandardMaterial
        material.dispose()
    }

    setWireframe(enabled: boolean): void {
        const material = this.object.material as MeshStandardMaterial
        material.wireframe = enabled
    }

    private writeColor(normalizedHeight: number, seaLevel: number, target: Color): void {
        if (seaLevel > 0 && normalizedHeight < seaLevel) {
            sampleGradient(WATER_GRADIENT, normalizedHeight / seaLevel, target)
            return
        }
        const landSpan = 1 - seaLevel
        const t = landSpan > 0 ? (normalizedHeight - seaLevel) / landSpan : normalizedHeight
        sampleGradient(LAND_GRADIENT, t, target)
    }
}