import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { debounce } from './debounce'

describe('debounce', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('does not call the function before the delay elapses', () => {
        const fn = vi.fn()
        const debounced = debounce(fn, 100)
        debounced()
        vi.advanceTimersByTime(99)
        expect(fn).not.toHaveBeenCalled()
        vi.advanceTimersByTime(1)
        expect(fn).toHaveBeenCalledTimes(1)
    })

    it('collapses rapid calls into one, keeping the latest arguments', () => {
        const fn = vi.fn()
        const debounced = debounce(fn, 100)
        debounced('a')
        debounced('b')
        debounced('c')
        vi.advanceTimersByTime(100)
        expect(fn).toHaveBeenCalledTimes(1)
        expect(fn).toHaveBeenCalledWith('c')
    })

    it('restarts the timer on each call', () => {
        const fn = vi.fn()
        const debounced = debounce(fn, 100)
        debounced()
        vi.advanceTimersByTime(80)
        debounced()
        vi.advanceTimersByTime(80)
        expect(fn).not.toHaveBeenCalled()
        vi.advanceTimersByTime(20)
        expect(fn).toHaveBeenCalledTimes(1)
    })

    it('cancel prevents a pending call', () => {
        const fn = vi.fn()
        const debounced = debounce(fn, 100)
        debounced()
        debounced.cancel()
        vi.advanceTimersByTime(200)
        expect(fn).not.toHaveBeenCalled()
    })
})