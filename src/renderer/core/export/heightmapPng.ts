import type { Heightfield } from '../terrain/heightfield'
import { normalizeHeights } from './normalizeHeights'
import { encodePng } from './png'

function buildScanlines(field: Heightfield): Uint8Array {
    const { width, height } = field
    const stride = 1 + width * 2
    const { values } = normalizeHeights(field)

    const raw = new Uint8Array(stride * height)
    for (let row = 0; row < height; row++) {
        const rowStart = row * stride
        raw[rowStart] = 0
        for (let col = 0; col < width; col++) {
            const sample = Math.round(values[row * width + col] * 65535)
            const offset = rowStart + 1 + col * 2
            raw[offset] = (sample >>> 8) & 0xff
            raw[offset + 1] = sample & 0xff
        }
    }

    return raw
}

export function encodeHeightmapPng(field: Heightfield): Uint8Array {
    return encodePng({
        width: field.width,
        height: field.height,
        bitDepth: 16,
        colorType: 0,
        scanlines: buildScanlines(field)
    })
}