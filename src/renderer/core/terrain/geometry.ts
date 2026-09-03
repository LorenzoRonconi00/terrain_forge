import type { Heightfield } from './heightfield'

export interface HeightfieldGeometry {
    positions: Float32Array
    indices: Uint32Array
}

export function buildHeightfieldGeometry(field: Heightfield): HeightfieldGeometry {
    const { width, height, worldSize, heightScale, data } = field
    const vertexCount = width * height

    const positions = new Float32Array(vertexCount * 3)
    for (let row = 0; row < height; row++) {
        const z = (row / (height - 1) - 0.5) * worldSize
        for (let col = 0; col < width; col++) {
            const index = row * width + col
            positions[index * 3] = (col / (width - 1) - 0.5) * worldSize
            positions[index * 3 + 1] = data[index] * heightScale
            positions[index * 3 + 2] = z
        }
    }

    const indices = new Uint32Array((width - 1) * (height - 1) * 6)
    let offset = 0
    for (let row = 0; row < height - 1; row++) {
        for (let col = 0; col < width - 1; col++) {
            const a = row * width + col
            const b = a + 1
            const c = a + width
            const d = c + 1
            indices[offset++] = a
            indices[offset++] = c
            indices[offset++] = b
            indices[offset++] = b
            indices[offset++] = c
            indices[offset++] = d
        }
    }

    return { positions, indices }
}