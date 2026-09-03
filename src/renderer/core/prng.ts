export type Seed = number | string

export class Rng {
    private state: number

    constructor(seed: Seed) {
        this.state = normalizeSeed(seed)
    }

    next(): number {
        this.state = (this.state + 0x9e3779b9) | 0
        let t = Math.imul(this.state ^ (this.state >>> 16), 0x21f0aaad)
        t = Math.imul(t ^ (t >>> 15), 0x735a2d97)
        return ((t ^ (t >>> 15)) >>> 0) / 4294967296
    }

    int(maxExclusive: number): number {
        return Math.floor(this.next() * maxExclusive)
    }

    range(min: number, max: number): number {
        return min + this.next() * (max - min)
    }

    pick<T>(items: readonly T[]): T {
        return items[this.int(items.length)]
    }
}

function normalizeSeed(seed: Seed): number {
    if (typeof seed === 'number') {
        return (Math.trunc(seed) | 0) || 1
    }

    let h = 1779033703 ^ seed.length
    for (let i = 0; i < seed.length; i++) {
        h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
        h = (h << 13) | (h >>> 19)
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^ (h >>> 16)) >>> 0) || 1
}