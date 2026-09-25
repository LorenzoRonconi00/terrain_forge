import { describe, expect, it } from 'vitest'
import { encodePng } from './png'

const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10]

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

function readChunks(
    png: Uint8Array
): { type: string; data: Uint8Array; crc: number; body: Uint8Array }[] {
    const view = new DataView(png.buffer, png.byteOffset, png.byteLength)
    const chunks = []
    let pos = 8
    while (pos < png.length) {
        const len = view.getUint32(pos)
        const type = String.fromCharCode(...png.subarray(pos + 4, pos + 8))
        const body = png.subarray(pos + 4, pos + 8 + len)
        chunks.push({
            type,
            data: png.subarray(pos + 8, pos + 8 + len),
            crc: view.getUint32(pos + 8 + len),
            body
        })
        pos += 12 + len
    }
    return chunks
}

function grayscale8Image(width: number, height: number, fill: number) {
    const stride = 1 + width
    const scanlines = new Uint8Array(stride * height).fill(fill)
    for (let row = 0; row < height; row++) {
        scanlines[row * stride] = 0
    }
    return { width, height, bitDepth: 8 as const, colorType: 0, scanlines }
}

describe('encodePng', () => {
    it('starts with the PNG signature', () => {
        const png = encodePng(grayscale8Image(2, 2, 100))
        expect(Array.from(png.subarray(0, 8))).toEqual(SIGNATURE)
    })

    it('writes an IHDR with matching dimensions, bit depth and color type', () => {
        const png = encodePng(grayscale8Image(9, 4, 50))
        const ihdr = readChunks(png)[0]
        const view = new DataView(ihdr.data.buffer, ihdr.data.byteOffset, ihdr.data.byteLength)
        expect(ihdr.type).toBe('IHDR')
        expect(view.getUint32(0)).toBe(9)
        expect(view.getUint32(4)).toBe(4)
        expect(ihdr.data[8]).toBe(8)
        expect(ihdr.data[9]).toBe(0)
    })

    it('has exactly one IDAT and ends with an empty IEND', () => {
        const chunks = readChunks(encodePng(grayscale8Image(4, 4, 10)))
        expect(chunks.filter((c) => c.type === 'IDAT')).toHaveLength(1)
        const last = chunks[chunks.length - 1]
        expect(last.type).toBe('IEND')
        expect(last.data).toHaveLength(0)
    })

    it('stores a correct CRC on every chunk', () => {
        const chunks = readChunks(encodePng(grayscale8Image(5, 5, 200)))
        for (const c of chunks) {
            expect(c.crc).toBe(crc32(c.body))
        }
    })

    it('produces a zlib stream that starts with 0x78 0x01', () => {
        const idat = readChunks(encodePng(grayscale8Image(3, 3, 1))).find((c) => c.type === 'IDAT')!
            .data
        expect(idat[0]).toBe(0x78)
        expect(idat[1]).toBe(0x01)
    })

    it('is deterministic', () => {
        const a = encodePng(grayscale8Image(6, 6, 42))
        const b = encodePng(grayscale8Image(6, 6, 42))
        expect(Array.from(a)).toEqual(Array.from(b))
    })
})