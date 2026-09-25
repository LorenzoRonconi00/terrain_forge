import { describe, expect, it } from 'vitest'
import type { Heightfield } from '../terrain/heightfield'
import { encodeHeightmapPng } from './heightmapPng'

function field(width: number, height: number, data: number[]): Heightfield {
    return { width, height, worldSize: 1, heightScale: 1, data: Float32Array.from(data) }
}

function readChunks(png: Uint8Array): { type: string; data: Uint8Array }[] {
    const view = new DataView(png.buffer, png.byteOffset, png.byteLength)
    const chunks = []
    let pos = 8
    while (pos < png.length) {
        const len = view.getUint32(pos)
        const type = String.fromCharCode(...png.subarray(pos + 4, pos + 8))
        chunks.push({ type, data: png.subarray(pos + 8, pos + 8 + len) })
        pos += 12 + len
    }
    return chunks
}

function inflateStored(idat: Uint8Array): Uint8Array {
    const out: number[] = []
    let pos = 2
    for (; ;) {
        const isLast = idat[pos] & 1
        const len = idat[pos + 1] | (idat[pos + 2] << 8)
        pos += 5
        for (let i = 0; i < len; i++) {
            out.push(idat[pos + i])
        }
        pos += len
        if (isLast) {
            break
        }
    }
    return Uint8Array.from(out)
}

describe('encodeHeightmapPng', () => {
    it('is deterministic', () => {
        const a = encodeHeightmapPng(field(6, 6, new Array(36).fill(0.42)))
        const b = encodeHeightmapPng(field(6, 6, new Array(36).fill(0.42)))
        expect(Array.from(a)).toEqual(Array.from(b))
    })

    it('maps normalized heights to 16-bit big-endian samples and clamps out-of-range', () => {
        const png = encodeHeightmapPng(field(4, 1, [0, 1, 0.5, -3]))
        const idat = readChunks(png).find((c) => c.type === 'IDAT')!.data
        const raw = inflateStored(idat)
        expect(raw[0]).toBe(0)
        expect([raw[1], raw[2]]).toEqual([0x00, 0x00])
        expect([raw[3], raw[4]]).toEqual([0xff, 0xff])
        expect([raw[5], raw[6]]).toEqual([0x80, 0x00])
        expect([raw[7], raw[8]]).toEqual([0x00, 0x00])
    })

    it('stretches the used range to the full 16-bit span', () => {
        const png = encodeHeightmapPng(field(3, 1, [0.2, 0.4, 0.6]))
        const raw = inflateStored(readChunks(png).find((c) => c.type === 'IDAT')!.data)
        expect([raw[1], raw[2]]).toEqual([0x00, 0x00])
        expect([raw[5], raw[6]]).toEqual([0xff, 0xff])
    })
})