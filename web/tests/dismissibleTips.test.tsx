import { act, fireEvent, renderHook } from "@testing-library/react"
import { expect, test } from "vitest"
import { useDismissibleTips } from "../src/hooks/useDismissibleTips.ts"

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
	const { result, unmount } = renderHook(() => useDismissibleTips())
	unmount()
	fireEvent.keyDown(document, { key: "Escape" })
	expect(result.current.hidden).toBe(false)
})
