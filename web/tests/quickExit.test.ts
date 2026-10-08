import { expect, test, vi } from "vitest"
import { createShiftCounter, type KeyLike } from "../src/services/quickExit.ts"

const key = (k: string, extra: Partial<KeyLike> = {}): KeyLike => ({
	key: k,
	repeat: false,
	isComposing: false,
	...extra,
})

function setup() {
	let clock = 0
	const fired = vi.fn()
	const counter = createShiftCounter(fired, () => clock)
	const press = (k: string, extra: Partial<KeyLike> = {}) => {
		counter.keydown(key(k, extra))
		counter.keyup(key(k, extra))
	}
	const tick = (ms: number) => {
		clock += ms
	}
	return { fired, counter, press, tick }
}

test("three Shift presses on their own leave", () => {
	const { fired, press } = setup()
	press("Shift")
	press("Shift")
	expect(fired).not.toHaveBeenCalled()
	press("Shift")
	expect(fired).toHaveBeenCalledTimes(1)
})

test("Shift used for capitals never counts, however fast", () => {
	const { fired, counter, press } = setup()
	for (const letter of ["A", "B", "C", "D"]) {
		counter.keydown(key("Shift"))
		counter.keydown(key(letter))
		counter.keyup(key(letter))
		counter.keyup(key("Shift"))
	}
	expect(fired).not.toHaveBeenCalled()
	// A capital must leave the count at 0, not 1: two clean presses after it are still only two.
	press("Shift")
	press("Shift")
	expect(fired).not.toHaveBeenCalled()
})

test("any other key in between resets the count, Ctrl and Alt included", () => {
	const { fired, press } = setup()
	press("Shift")
	press("Shift")
	press("Control")
	press("Shift")
	expect(fired).not.toHaveBeenCalled()
	press("Shift")
	press("Alt")
	press("Shift")
	press("Shift")
	expect(fired).not.toHaveBeenCalled()
})

test("holding Shift down (key repeat) counts once", () => {
	const { fired, counter, press } = setup()
	counter.keydown(key("Shift"))
	counter.keydown(key("Shift", { repeat: true }))
	counter.keydown(key("Shift", { repeat: true }))
	counter.keyup(key("Shift"))
	press("Shift")
	expect(fired).not.toHaveBeenCalled()
	press("Shift")
	expect(fired).toHaveBeenCalledTimes(1)
})

test("events during IME composition are ignored", () => {
	const { fired, press } = setup()
	press("Shift", { isComposing: true })
	press("Shift", { isComposing: true })
	press("Shift", { isComposing: true })
	expect(fired).not.toHaveBeenCalled()
})

test("a slow third press does nothing: the count restarts 5 seconds after the first", () => {
	const { fired, press, tick } = setup()
	press("Shift")
	tick(2000)
	press("Shift")
	tick(3500)
	press("Shift")
	expect(fired).not.toHaveBeenCalled()
	press("Shift")
	press("Shift")
	expect(fired).toHaveBeenCalledTimes(1)
})
