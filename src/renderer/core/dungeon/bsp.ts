import type { Rng } from '../prng'
import type { DungeonParams } from './params'

export interface Rect {
    x: number
    y: number
    width: number
    height: number
}

export interface BspNode {
    rect: Rect
    left: BspNode | null
    right: BspNode | null
}

type SplitOptions = Pick<DungeonParams, 'minLeafSize' | 'maxDepth' | 'splitRandomness'>

export function buildBspTree(rect: Rect, options: SplitOptions, rng: Rng): BspNode {
    return split(rect, options, rng, 0)
}

function split(rect: Rect, options: SplitOptions, rng: Rng, depth: number): BspNode {
    if (depth >= options.maxDepth) {
        return { rect, left: null, right: null }
    }

    const canSplitVertically = rect.width >= options.minLeafSize * 2
    const canSplitHorizontally = rect.height >= options.minLeafSize * 2

    if (!canSplitVertically && !canSplitHorizontally) {
        return { rect, left: null, right: null }
    }

    const splitVertically = chooseOrientation(rect, canSplitVertically, canSplitHorizontally, rng)
    const [a, b] = splitVertically
        ? splitAlongX(rect, options, rng)
        : splitAlongY(rect, options, rng)

    return {
        rect,
        left: split(a, options, rng, depth + 1),
        right: split(b, options, rng, depth + 1)
    }
}

function chooseOrientation(
    rect: Rect,
    canSplitVertically: boolean,
    canSplitHorizontally: boolean,
    rng: Rng
): boolean {
    if (canSplitVertically && !canSplitHorizontally) {
        return true
    }
    if (canSplitHorizontally && !canSplitVertically) {
        return false
    }
    if (rect.width > rect.height * 1.25) {
        return true
    }
    if (rect.height > rect.width * 1.25) {
        return false
    }
    return rng.next() < 0.5
}

function splitPosition(size: number, minLeafSize: number, randomness: number, rng: Rng): number {
    const min = minLeafSize
    const max = size - minLeafSize
    const mid = (min + max) / 2
    const spread = (max - min) * randomness
    const position = mid + (rng.next() * 2 - 1) * spread
    return Math.round(Math.min(max, Math.max(min, position)))
}

function splitAlongX(rect: Rect, options: SplitOptions, rng: Rng): [Rect, Rect] {
    const cut = splitPosition(rect.width, options.minLeafSize, options.splitRandomness, rng)
    return [
        { x: rect.x, y: rect.y, width: cut, height: rect.height },
        { x: rect.x + cut, y: rect.y, width: rect.width - cut, height: rect.height }
    ]
}

function splitAlongY(rect: Rect, options: SplitOptions, rng: Rng): [Rect, Rect] {
    const cut = splitPosition(rect.height, options.minLeafSize, options.splitRandomness, rng)
    return [
        { x: rect.x, y: rect.y, width: rect.width, height: cut },
        { x: rect.x, y: rect.y + cut, width: rect.width, height: rect.height - cut }
    ]
}

export function collectLeaves(node: BspNode): BspNode[] {
    if (!node.left && !node.right) {
        return [node]
    }
    const leaves: BspNode[] = []
    if (node.left) {
        leaves.push(...collectLeaves(node.left))
    }
    if (node.right) {
        leaves.push(...collectLeaves(node.right))
    }
    return leaves
}