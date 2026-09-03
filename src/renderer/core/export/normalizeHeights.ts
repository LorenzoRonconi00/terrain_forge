import type { Heightfield } from '../terrain/heightfield'

export interface NormalizedHeights {
    values: Float32Array
    min: number
    max: number
    minHeight: number
    maxHeight: number
}

export function normalizeHeights(field: Heightfield): NormalizedHeights {
    const { data, heightScale } = field

    let min = Infinity
    let max = -Infinity
    for (let i = 0; i < data.length; i++) {
        const clamped = data[i] < 0 ? 0 : data[i] > 1 ? 1 : data[i]
        if (clamped < min) {
            min = clamped
        }
        if (clamped > max) {
            max = clamped
        }
    }

    const range = max - min
    const inv = range > 0 ? 1 / range : 0

    const values = new Float32Array(data.length)
    for (let i = 0; i < data.length; i++) {
        const clamped = data[i] < 0 ? 0 : data[i] > 1 ? 1 : data[i]
        values[i] = (clamped - min) * inv
    }

    return { values, min, max, minHeight: min * heightScale, maxHeight: max * heightScale }
}