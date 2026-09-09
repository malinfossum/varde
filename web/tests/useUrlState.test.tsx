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

test("a legacy /?search= URL is rewritten to /sok in place and parsed as the list", () => {
	window.history.pushState(null, "", "/?search=rus&lang=en")
	const { result } = renderHook(() => useUrlState())
	expect(window.location.pathname).toBe("/sok")
	expect(window.location.search).toBe("?search=rus&lang=en")
	expect(result.current.route).toEqual({ kind: "list" })
	expect(result.current.filters.search).toBe("rus")
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
