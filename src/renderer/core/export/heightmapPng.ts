import type { Heightfield } from '../terrain/heightfield'
import { normalizeHeights } from './normalizeHeights'

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
const MAX_DEFLATE_BLOCK = 0xffff

const CRC_TABLE = buildCrcTable()

function buildCrcTable(): Uint32Array {
    const table = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
        let c = n
        for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
        }
        table[n] = c >>> 0
    }
    return table
}

function crc32(bytes: Uint8Array): number {
    let crc = 0xffffffff
    for (let i = 0; i < bytes.length; i++) {
        crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xff]
    }
    return (crc ^ 0xffffffff) >>> 0
}

function adler32(bytes: Uint8Array): number {
    let a = 1
    let b = 0
    for (let i = 0; i < bytes.length; i++) {
        a = (a + bytes[i]) % 65521
        b = (b + a) % 65521
    }
    return ((b << 16) | a) >>> 0
}

function chunk(type: string, data: Uint8Array): Uint8Array {
    const body = new Uint8Array(4 + data.length)
    for (let i = 0; i < 4; i++) {
        body[i] = type.charCodeAt(i)
    }
    body.set(data, 4)

    const result = new Uint8Array(4 + body.length + 4)
    const view = new DataView(result.buffer)
    view.setUint32(0, data.length)
    result.set(body, 4)
    view.setUint32(4 + body.length, crc32(body))
    return result
}

function buildHeader(width: number, height: number): Uint8Array {
    const data = new Uint8Array(13)
    const view = new DataView(data.buffer)
    view.setUint32(0, width)
    view.setUint32(4, height)
    data[8] = 16
    data[9] = 0
    data[10] = 0
    data[11] = 0
    data[12] = 0
    return data
}

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

function deflateStored(raw: Uint8Array): Uint8Array {
    const blockCount = Math.max(1, Math.ceil(raw.length / MAX_DEFLATE_BLOCK))
    const out = new Uint8Array(2 + blockCount * 5 + raw.length + 4)
    let pos = 0

    out[pos++] = 0x78
    out[pos++] = 0x01

    for (let block = 0; block < blockCount; block++) {
        const start = block * MAX_DEFLATE_BLOCK
        const end = Math.min(start + MAX_DEFLATE_BLOCK, raw.length)
        const len = end - start

        out[pos++] = block === blockCount - 1 ? 1 : 0
        out[pos++] = len & 0xff
        out[pos++] = (len >>> 8) & 0xff
        out[pos++] = ~len & 0xff
        out[pos++] = (~len >>> 8) & 0xff
        out.set(raw.subarray(start, end), pos)
        pos += len
    }

    const checksum = adler32(raw)
    out[pos++] = (checksum >>> 24) & 0xff
    out[pos++] = (checksum >>> 16) & 0xff
    out[pos++] = (checksum >>> 8) & 0xff
    out[pos] = checksum & 0xff

    return out
}

export function encodeHeightmapPng(field: Heightfield): Uint8Array {
    const parts = [
        PNG_SIGNATURE,
        chunk('IHDR', buildHeader(field.width, field.height)),
        chunk('IDAT', deflateStored(buildScanlines(field))),
        chunk('IEND', new Uint8Array(0))
    ]

    const total = parts.reduce((sum, part) => sum + part.length, 0)
    const png = new Uint8Array(total)
    let offset = 0
    for (const part of parts) {
        png.set(part, offset)
        offset += part.length
    }
    return png
}