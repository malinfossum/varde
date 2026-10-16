import { expect, test } from "vitest"
import {
	createHistoryCounter,
	type NavigationLike,
	navigationOf,
	readHistoryStatus,
} from "../src/services/historyCounter.ts"

test("a first load has nothing behind and nothing ahead", () => {
	expect(createHistoryCounter().status()).toEqual({ canGoBack: false, canGoForward: false })
})

test("a push writes the next idx; Back and Forward follow idx and the highest idx", () => {
	const counter = createHistoryCounter()
	expect(counter.push()).toBe(1)
	expect(counter.push()).toBe(2)
	expect(counter.status()).toEqual({ canGoBack: true, canGoForward: false })
	counter.arrive(1)
	expect(counter.status()).toEqual({ canGoBack: true, canGoForward: true })
	counter.arrive(0)
	expect(counter.status()).toEqual({ canGoBack: false, canGoForward: true })
})

test("after a reload the highest is unknown, so Forward is disabled", () => {
	const counter = createHistoryCounter()
	counter.arrive(3)
	expect(counter.status()).toEqual({ canGoBack: true, canGoForward: false })
})

test("Back followed by a new push drops what was ahead", () => {
	const counter = createHistoryCounter()
	counter.push()
	counter.push()
	counter.arrive(1)
	expect(counter.push()).toBe(2)
	expect(counter.status()).toEqual({ canGoBack: true, canGoForward: false })
})

test("the Navigation API wins over the counter where it exists", () => {
	const counter = createHistoryCounter()
	const nav = { canGoBack: true, canGoForward: true } as NavigationLike
	expect(readHistoryStatus(nav, counter)).toEqual({ canGoBack: true, canGoForward: true })
	expect(readHistoryStatus(undefined, counter)).toEqual({ canGoBack: false, canGoForward: false })
})

test("navigationOf reads window.navigation and tolerates its absence", () => {
	expect(navigationOf({} as Window)).toBeUndefined()
	const nav = { canGoBack: false } as NavigationLike
	expect(navigationOf({ navigation: nav } as unknown as Window)).toBe(nav)
})
