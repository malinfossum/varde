import { act, renderHook } from "@testing-library/react"
import { expect, test } from "vitest"
import { useUrlState } from "../src/hooks/useUrlState.ts"

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
	expect(window.history.state).toEqual({ from: "sok" })
	act(() => result.current.navigate("/", ""))
	expect(result.current.arrival).toBe(2)
	expect(window.history.state).toBeNull()
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
