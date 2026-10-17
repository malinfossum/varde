import { act, fireEvent, renderHook } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { useDismissibleTips } from "../src/hooks/useDismissibleTips.ts"

afterEach(() => {
	vi.restoreAllMocks()
})

test("Escape hides the tips until show() is called", () => {
	const { result } = renderHook(() => useDismissibleTips())
	expect(result.current.hidden).toBe(false)
	act(() => {
		fireEvent.keyDown(document, { key: "Escape" })
	})
	expect(result.current.hidden).toBe(true)
	act(() => result.current.show())
	expect(result.current.hidden).toBe(false)
})

test("other keys leave the tips alone", () => {
	const { result } = renderHook(() => useDismissibleTips())
	act(() => {
		fireEvent.keyDown(document, { key: "Enter" })
	})
	expect(result.current.hidden).toBe(false)
})

test("the listener is removed on unmount", () => {
	const add = vi.spyOn(document, "addEventListener")
	const remove = vi.spyOn(document, "removeEventListener")
	const { unmount } = renderHook(() => useDismissibleTips())
	const handler = add.mock.calls.find(([type]) => type === "keydown")?.[1]
	expect(handler).toBeDefined()
	unmount()
	expect(remove).toHaveBeenCalledWith("keydown", handler)
})
