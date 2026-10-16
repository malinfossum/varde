import { act, renderHook } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { useUrlState } from "../src/hooks/useUrlState.ts"

// jsdom's scrollY is a plain writable property; tests set it and this puts it back.
const setScrollY = (y: number) =>
	Object.defineProperty(window, "scrollY", { value: y, configurable: true, writable: true })

afterEach(() => {
	vi.restoreAllMocks()
	setScrollY(0)
})

const popTo = (state: unknown, url: string) =>
	act(() => {
		window.history.replaceState(state, "", url)
		window.dispatchEvent(new PopStateEvent("popstate", { state }))
	})

// The list route lives at /sok now (was "/" before this task) — a filter navigation targets
// /sok directly rather than relying on the legacy-redirect coincidence.
test("push navigation grows history, replace navigation does not", () => {
	window.history.pushState(null, "", "/sok")
	const { result } = renderHook(() => useUrlState())

	const lengthBeforePush = window.history.length
	act(() => {
		result.current.navigate("/sok", "?search=a")
	})
	expect(window.history.length).toBe(lengthBeforePush + 1)

	const lengthBeforeReplace = window.history.length
	act(() => {
		result.current.navigate("/sok", "?search=ab", { replace: true })
	})
	expect(window.history.length).toBe(lengthBeforeReplace)
	expect(window.location.search).toBe("?search=ab")
})

test("/?lang=en stays on the landing", () => {
	window.history.pushState(null, "", "/?lang=en")
	const { result } = renderHook(() => useUrlState())
	expect(window.location.pathname).toBe("/")
	expect(result.current.route).toEqual({ kind: "landing" })
})

test("arrival increments on route changes only, and leaving /sok records from=sok", () => {
	window.history.pushState(null, "", "/sok")
	const { result } = renderHook(() => useUrlState())
	expect(result.current.arrival).toBe(0)
	act(() => result.current.navigate("/sok", "?search=rus"))
	expect(result.current.arrival).toBe(0) // filter change, same route
	act(() => result.current.navigate("/resources/12", ""))
	expect(result.current.arrival).toBe(1)
	expect(window.history.state).toMatchObject({ from: "sok", idx: 2 })
	act(() => result.current.navigate("/", ""))
	expect(result.current.arrival).toBe(2)
	expect(window.history.state).not.toHaveProperty("from")
})

test("arrival treats same-slug kommune navigation as the same route", () => {
	window.history.pushState(null, "", "/kommune/hamar")
	const { result } = renderHook(() => useUrlState())
	expect(result.current.arrival).toBe(0)
	act(() => result.current.navigate("/kommune/hamar", "?search=rus"))
	expect(result.current.arrival).toBe(0) // same kommune, filter change only
	act(() => result.current.navigate("/kommune/gjovik", ""))
	expect(result.current.arrival).toBe(1) // different kommune slug
})

test("lang reflects the path prefix, and navigate prefixes with the current language unless told otherwise", () => {
	window.history.pushState(null, "", "/en/sok")
	const { result } = renderHook(() => useUrlState())
	expect(result.current.lang).toBe("en")
	act(() => result.current.navigate("/resources/9", ""))
	expect(window.location.pathname).toBe("/en/resources/9")
	expect(result.current.lang).toBe("en")
	act(() => result.current.navigate("/", "", { lang: "nb" }))
	expect(window.location.pathname).toBe("/")
	expect(result.current.lang).toBe("nb")
})

test("the router restores scroll itself, and a load without router state becomes entry 0", () => {
	window.history.replaceState({ from: "sok" }, "", "/resources/12")
	renderHook(() => useUrlState())
	expect(window.history.scrollRestoration).toBe("manual")
	expect(window.history.state).toEqual({ from: "sok", idx: 0 })
})

test("a push saves scrollY and the followed href on the entry it leaves, then writes idx", () => {
	window.history.replaceState(null, "", "/sok")
	const { result } = renderHook(() => useUrlState())
	setScrollY(640)
	const replace = vi.spyOn(window.history, "replaceState")
	act(() => result.current.navigate("/resources/12", "", { href: "/resources/12" }))
	expect(replace).toHaveBeenCalledWith({ idx: 0, scrollY: 640, href: "/resources/12" }, "")
	expect(window.history.state).toEqual({ from: "sok", idx: 1 })
})

test("a navigation without a link saves no href and clears one saved earlier", () => {
	window.history.replaceState({ idx: 0, href: "/old" }, "", "/resources/12")
	const { result } = renderHook(() => useUrlState())
	const replace = vi.spyOn(window.history, "replaceState")
	act(() => result.current.navigate("/", ""))
	expect(replace).toHaveBeenCalledWith({ idx: 0, scrollY: 0 }, "")
})

test("saving the focus values keeps from: sok and idx", () => {
	window.history.replaceState({ from: "sok", idx: 4 }, "", "/resources/12")
	const { result } = renderHook(() => useUrlState())
	const replace = vi.spyOn(window.history, "replaceState")
	act(() => result.current.navigate("/", ""))
	expect(replace).toHaveBeenCalledWith({ from: "sok", idx: 4, scrollY: 0 }, "")
})

test("a replace navigation keeps idx and the saved values", () => {
	window.history.replaceState({ idx: 2, scrollY: 300, href: "/resources/9" }, "", "/sok?search=a")
	const { result } = renderHook(() => useUrlState())
	act(() => result.current.navigate("/sok", "?search=ab", { replace: true }))
	expect(window.history.state).toEqual({ idx: 2, scrollY: 300, href: "/resources/9" })
})

test("subscribers hear every push and every traversal", () => {
	window.history.replaceState(null, "", "/sok")
	const { result } = renderHook(() => useUrlState())
	const listener = vi.fn()
	const unsubscribe = result.current.historyEvents.subscribe(listener)
	act(() => result.current.navigate("/resources/12", ""))
	expect(listener).toHaveBeenCalledTimes(1)
	popTo({ idx: 0 }, "/sok")
	expect(listener).toHaveBeenCalledTimes(2)
	unsubscribe()
	act(() => result.current.navigate("/om", ""))
	expect(listener).toHaveBeenCalledTimes(2)
})

test("a traversal to another route is an arrival via traverse; on the same route it is a restore", () => {
	window.history.replaceState(null, "", "/sok")
	const { result } = renderHook(() => useUrlState())
	act(() => result.current.navigate("/sok", "?category=rus"))
	act(() => result.current.navigate("/resources/12", ""))
	expect(result.current).toMatchObject({ arrival: 1, via: "push", restore: 0 })
	popTo({ idx: 1 }, "/sok?category=rus")
	expect(result.current).toMatchObject({ arrival: 2, via: "traverse", restore: 0 })
	popTo({ idx: 0 }, "/sok")
	expect(result.current).toMatchObject({ arrival: 2, via: "traverse", restore: 1 })
})

test("without the Navigation API the counter follows pushes and traversals", () => {
	window.history.replaceState(null, "", "/")
	const { result } = renderHook(() => useUrlState())
	const status = () => result.current.historyEvents.counter.status()
	expect(status()).toEqual({ canGoBack: false, canGoForward: false })
	act(() => result.current.navigate("/om", ""))
	expect(status()).toEqual({ canGoBack: true, canGoForward: false })
	popTo({ idx: 0 }, "/")
	expect(status()).toEqual({ canGoBack: false, canGoForward: true })
	act(() => result.current.navigate("/sok", ""))
	expect(status()).toEqual({ canGoBack: true, canGoForward: false })
})

test("an entry with no state reached by popstate or hashchange (a fragment link) gets the next idx", () => {
	window.history.replaceState(null, "", "/om")
	const { result } = renderHook(() => useUrlState())
	popTo(null, "/om#meld-feil")
	expect(window.history.state).toEqual({ idx: 1 })
	act(() => {
		window.history.replaceState(null, "", "/om#main")
		window.dispatchEvent(new HashChangeEvent("hashchange"))
	})
	expect(window.history.state).toEqual({ idx: 2 })
	expect(result.current.historyEvents.counter.status()).toEqual({
		canGoBack: true,
		canGoForward: false,
	})
})
