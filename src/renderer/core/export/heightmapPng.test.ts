import { describe, expect, it } from 'vitest'
import type { Heightfield } from '../terrain/heightfield'
import { encodeHeightmapPng } from './heightmapPng'

const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10]

function field(width: number, height: number, data: number[]): Heightfield {
    return { width, height, worldSize: 1, heightScale: 1, data: Float32Array.from(data) }
}

function crc32(bytes: Uint8Array): number {
    let crc = 0xffffffff
    for (let i = 0; i < bytes.length; i++) {
        crc ^= bytes[i]
        for (let bit = 0; bit < 8; bit++) {
            crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
        }
    }
    return (crc ^ 0xffffffff) >>> 0
}

function readChunks(png: Uint8Array): { type: string; data: Uint8Array; crc: number; body: Uint8Array }[] {
    const view = new DataView(png.buffer, png.byteOffset, png.byteLength)
    const chunks = []
    let pos = 8
    while (pos < png.length) {
        const len = view.getUint32(pos)
        const type = String.fromCharCode(...png.subarray(pos + 4, pos + 8))
        const body = png.subarray(pos + 4, pos + 8 + len)
        chunks.push({ type, data: png.subarray(pos + 8, pos + 8 + len), crc: view.getUint32(pos + 8 + len), body })
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
    it('starts with the PNG signature', () => {
        const png = encodeHeightmapPng(field(2, 2, [0, 0, 0, 0]))
        expect(Array.from(png.subarray(0, 8))).toEqual(SIGNATURE)
    })

    it('writes a valid IHDR with matching dimensions and 16-bit grayscale', () => {
        const png = encodeHeightmapPng(field(7, 3, new Array(21).fill(0.5)))
        const ihdr = readChunks(png)[0]
        const view = new DataView(ihdr.data.buffer, ihdr.data.byteOffset, ihdr.data.byteLength)
        expect(ihdr.type).toBe('IHDR')
        expect(view.getUint32(0)).toBe(7)
        expect(view.getUint32(4)).toBe(3)
        expect(ihdr.data[8]).toBe(16)
        expect(ihdr.data[9]).toBe(0)
    })

    it('has exactly one IDAT and ends with an empty IEND', () => {
        const chunks = readChunks(encodeHeightmapPng(field(4, 4, new Array(16).fill(0.25))))
        expect(chunks.filter((c) => c.type === 'IDAT')).toHaveLength(1)
        const last = chunks[chunks.length - 1]
        expect(last.type).toBe('IEND')
        expect(last.data).toHaveLength(0)
    })

    it('stores a correct CRC on every chunk', () => {
        const chunks = readChunks(encodeHeightmapPng(field(5, 5, new Array(25).fill(0.9))))
        for (const c of chunks) {
            expect(c.crc).toBe(crc32(c.body))
        }
    })

    it('produces a zlib stream that starts with 0x78 0x01', () => {
        const idat = readChunks(encodeHeightmapPng(field(3, 3, new Array(9).fill(0.1))))
            .find((c) => c.type === 'IDAT')!.data
        expect(idat[0]).toBe(0x78)
        expect(idat[1]).toBe(0x01)
    })

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