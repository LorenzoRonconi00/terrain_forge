export type Debounced<Args extends unknown[]> = {
    (...args: Args): void
    cancel: () => void
}

export function debounce<Args extends unknown[]>(
    fn: (...args: Args) => void,
    delayMs: number
): Debounced<Args> {
    let handle: ReturnType<typeof setTimeout> | undefined

    const run = (...args: Args): void => {
        if (handle !== undefined) {
            clearTimeout(handle)
        }
        handle = setTimeout(() => {
            handle = undefined
            fn(...args)
        }, delayMs)
    }

    const cancel = (): void => {
        if (handle !== undefined) {
            clearTimeout(handle)
            handle = undefined
        }
    }

    return Object.assign(run, { cancel })
}