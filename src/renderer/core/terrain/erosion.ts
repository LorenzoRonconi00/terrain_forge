import { Rng, type Seed } from '../prng'
import { clamp01 } from './elevationCurve'

export interface ErosionOptions {
    droplets: number
    radius: number
    seed: Seed
}

const INERTIA = 0.05
const CAPACITY = 4
const MIN_SLOPE = 0.01
const DEPOSIT_RATE = 0.3
const ERODE_RATE = 0.3
const EVAPORATION = 0.01
const GRAVITY = 4
const MAX_LIFETIME = 30
const INITIAL_SPEED = 1
const INITIAL_WATER = 1

interface Brush {
    dx: Int32Array
    dy: Int32Array
    weights: Float32Array
}

function buildBrush(radius: number): Brush {
    const dx: number[] = []
    const dy: number[] = []
    const weights: number[] = []
    let weightSum = 0

    for (let y = -radius; y <= radius; y++) {
        for (let x = -radius; x <= radius; x++) {
            const distanceSq = x * x + y * y
            if (distanceSq <= radius * radius) {
                const weight = 1 - Math.sqrt(distanceSq) / radius
                dx.push(x)
                dy.push(y)
                weights.push(weight)
                weightSum += weight
            }
        }
    }

    return {
        dx: Int32Array.from(dx),
        dy: Int32Array.from(dy),
        weights: Float32Array.from(weights, (w) => w / weightSum)
    }
}

export function erodeHeightfield(
    input: Float32Array,
    width: number,
    height: number,
    options: ErosionOptions
): Float32Array {
    const heights = Float32Array.from(input)
    const rng = new Rng(options.seed)
    const radius = Math.max(1, Math.min(8, Math.floor(options.radius)))
    const brush = buildBrush(radius)
    const droplets = Math.max(0, Math.floor(options.droplets))

    for (let drop = 0; drop < droplets; drop++) {
        let posX = rng.next() * (width - 1)
        let posY = rng.next() * (height - 1)
        let dirX = 0
        let dirY = 0
        let speed = INITIAL_SPEED
        let water = INITIAL_WATER
        let sediment = 0

        for (let step = 0; step < MAX_LIFETIME; step++) {
            const nodeX = Math.floor(posX)
            const nodeY = Math.floor(posY)
            if (nodeX < 0 || nodeX >= width - 1 || nodeY < 0 || nodeY >= height - 1) {
                break
            }

            const cellX = posX - nodeX
            const cellY = posY - nodeY
            const index = nodeY * width + nodeX

            const heightNW = heights[index]
            const heightNE = heights[index + 1]
            const heightSW = heights[index + width]
            const heightSE = heights[index + width + 1]

            const gradientX = (heightNE - heightNW) * (1 - cellY) + (heightSE - heightSW) * cellY
            const gradientY = (heightSW - heightNW) * (1 - cellX) + (heightSE - heightNE) * cellX

            const oldHeight =
                heightNW * (1 - cellX) * (1 - cellY) +
                heightNE * cellX * (1 - cellY) +
                heightSW * (1 - cellX) * cellY +
                heightSE * cellX * cellY

            dirX = dirX * INERTIA - gradientX * (1 - INERTIA)
            dirY = dirY * INERTIA - gradientY * (1 - INERTIA)

            const dirLength = Math.hypot(dirX, dirY)
            if (dirLength < 1e-6) {
                break
            }
            dirX /= dirLength
            dirY /= dirLength

            posX += dirX
            posY += dirY

            const newNodeX = Math.floor(posX)
            const newNodeY = Math.floor(posY)
            if (newNodeX < 0 || newNodeX >= width - 1 || newNodeY < 0 || newNodeY >= height - 1) {
                break
            }

            const newCellX = posX - newNodeX
            const newCellY = posY - newNodeY
            const newIndex = newNodeY * width + newNodeX
            const newHeight =
                heights[newIndex] * (1 - newCellX) * (1 - newCellY) +
                heights[newIndex + 1] * newCellX * (1 - newCellY) +
                heights[newIndex + width] * (1 - newCellX) * newCellY +
                heights[newIndex + width + 1] * newCellX * newCellY

            const deltaHeight = newHeight - oldHeight
            const capacity = Math.max(-deltaHeight, MIN_SLOPE) * speed * water * CAPACITY

            if (sediment > capacity || deltaHeight > 0) {
                const deposit =
                    deltaHeight > 0 ? Math.min(deltaHeight, sediment) : (sediment - capacity) * DEPOSIT_RATE
                sediment -= deposit

                heights[index] += deposit * (1 - cellX) * (1 - cellY)
                heights[index + 1] += deposit * cellX * (1 - cellY)
                heights[index + width] += deposit * (1 - cellX) * cellY
                heights[index + width + 1] += deposit * cellX * cellY
            } else {
                const erosionAmount = Math.min((capacity - sediment) * ERODE_RATE, -deltaHeight)

                for (let b = 0; b < brush.weights.length; b++) {
                    const bx = nodeX + brush.dx[b]
                    const by = nodeY + brush.dy[b]
                    if (bx < 0 || bx >= width || by < 0 || by >= height) {
                        continue
                    }
                    const target = by * width + bx
                    const removed = Math.min(heights[target], erosionAmount * brush.weights[b])
                    heights[target] -= removed
                    sediment += removed
                }
            }

            speed = Math.sqrt(Math.max(0, speed * speed - deltaHeight * GRAVITY))
            water *= 1 - EVAPORATION
        }
    }

    for (let i = 0; i < heights.length; i++) {
        heights[i] = clamp01(heights[i])
    }

    return heights
}