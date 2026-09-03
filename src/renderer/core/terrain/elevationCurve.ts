export interface ElevationCurveOptions {
    exponent: number
    terraces: number
}

export function clamp01(value: number): number {
    if (value < 0) {
        return 0
    }
    if (value > 1) {
        return 1
    }
    return value
}

export function applyElevationCurve(value: number, options: ElevationCurveOptions): number {
    let result = clamp01(value)

    const exponent = Math.max(0.0001, options.exponent)
    result = result ** exponent

    const steps = Math.floor(options.terraces)
    if (steps >= 2) {
        result = Math.round(result * steps) / steps
    }

    return clamp01(result)
}