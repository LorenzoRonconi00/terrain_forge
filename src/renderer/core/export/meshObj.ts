import { buildHeightfieldGeometry } from '../terrain/geometry'
import type { Heightfield } from '../terrain/heightfield'

function computeNormals(positions: Float32Array, indices: Uint32Array): Float32Array {
    const normals = new Float32Array(positions.length)

    for (let i = 0; i < indices.length; i += 3) {
        const i0 = indices[i] * 3
        const i1 = indices[i + 1] * 3
        const i2 = indices[i + 2] * 3

        const ax = positions[i1] - positions[i0]
        const ay = positions[i1 + 1] - positions[i0 + 1]
        const az = positions[i1 + 2] - positions[i0 + 2]
        const bx = positions[i2] - positions[i0]
        const by = positions[i2 + 1] - positions[i0 + 1]
        const bz = positions[i2 + 2] - positions[i0 + 2]

        const nx = ay * bz - az * by
        const ny = az * bx - ax * bz
        const nz = ax * by - ay * bx

        for (const base of [i0, i1, i2]) {
            normals[base] += nx
            normals[base + 1] += ny
            normals[base + 2] += nz
        }
    }

    for (let i = 0; i < normals.length; i += 3) {
        const length = Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1
        normals[i] /= length
        normals[i + 1] /= length
        normals[i + 2] /= length
    }

    return normals
}

function fmt(value: number): string {
    return Number.isFinite(value) ? (value + 0).toFixed(4) : '0.0000'
}

export function encodeTerrainObj(field: Heightfield): Uint8Array {
    const { positions, indices } = buildHeightfieldGeometry(field)
    const normals = computeNormals(positions, indices)

    const lines: string[] = [
        '# Terrain Forge OBJ export',
        `# grid ${field.width} x ${field.height}, worldSize ${field.worldSize}`,
        'o terrain'
    ]

    for (let i = 0; i < positions.length; i += 3) {
        lines.push(`v ${fmt(positions[i])} ${fmt(positions[i + 1])} ${fmt(positions[i + 2])}`)
    }
    for (let i = 0; i < normals.length; i += 3) {
        lines.push(`vn ${fmt(normals[i])} ${fmt(normals[i + 1])} ${fmt(normals[i + 2])}`)
    }
    for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i] + 1
        const b = indices[i + 1] + 1
        const c = indices[i + 2] + 1
        lines.push(`f ${a}//${a} ${b}//${b} ${c}//${c}`)
    }

    return new TextEncoder().encode(lines.join('\n') + '\n')
}