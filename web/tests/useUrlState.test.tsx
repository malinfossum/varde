import { act, renderHook } from "@testing-library/react"
import { expect, test } from "vitest"
import { useUrlState } from "../src/hooks/useUrlState.ts"

test("push navigation grows history, replace navigation does not", () => {
	window.history.pushState(null, "", "/")
	const { result } = renderHook(() => useUrlState())

	const lengthBeforePush = window.history.length
	act(() => {
		result.current.navigate("/", "?search=a")
	})
	expect(window.history.length).toBe(lengthBeforePush + 1)

	const lengthBeforeReplace = window.history.length
	act(() => {
		result.current.navigate("/", "?search=ab", { replace: true })
	})
	expect(window.history.length).toBe(lengthBeforeReplace)
	expect(window.location.search).toBe("?search=ab")
})
