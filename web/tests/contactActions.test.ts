import { describe, expect, test, vi } from "vitest"
import {
	copyText,
	shareCapability,
	shareResource,
	shareText,
} from "../src/services/contactActions.ts"

const entry = {
	name: "Krisesenteret i Hamar",
	phone: "62 00 00 00",
	url: "https://varde.test/r/12",
}

describe("shareText", () => {
	test("joins name and phone", () => {
		expect(shareText("Krisesenteret i Hamar", "62 00 00 00")).toBe(
			"Krisesenteret i Hamar — 62 00 00 00"
		)
	})
	test("is just the name when there is no phone", () => {
		expect(shareText("Krisesenteret i Hamar", null)).toBe("Krisesenteret i Hamar")
	})
})

describe("shareCapability", () => {
	test("prefers the share sheet when the browser has one", () => {
		expect(shareCapability({ share: vi.fn(), clipboard: { writeText: vi.fn() } })).toBe("share")
	})
	test("falls back to copy when only the clipboard exists", () => {
		expect(shareCapability({ clipboard: { writeText: vi.fn() } })).toBe("copy")
	})
	test("is none when the browser has neither", () => {
		expect(shareCapability({})).toBe("none")
	})
})

describe("shareResource", () => {
	test("hands name, phone and url to the share sheet", async () => {
		const share = vi.fn().mockResolvedValue(undefined)
		const outcome = await shareResource(entry, { share })
		expect(outcome).toBe("shared")
		expect(share).toHaveBeenCalledWith({
			title: "Krisesenteret i Hamar",
			text: "Krisesenteret i Hamar — 62 00 00 00",
			url: "https://varde.test/r/12",
		})
	})
	test("a cancelled sheet is cancelled, not a failure and not a copy", async () => {
		const share = vi.fn().mockRejectedValue(new DOMException("cancelled", "AbortError"))
		const writeText = vi.fn()
		expect(await shareResource(entry, { share, clipboard: { writeText } })).toBe("cancelled")
		expect(writeText).not.toHaveBeenCalled()
	})
	test("a broken share sheet falls through to copying the link", async () => {
		const share = vi.fn().mockRejectedValue(new TypeError("no can do"))
		const writeText = vi.fn().mockResolvedValue(undefined)
		expect(await shareResource(entry, { share, clipboard: { writeText } })).toBe("copied")
		expect(writeText).toHaveBeenCalledWith("https://varde.test/r/12")
	})
	test("without a share sheet the link is copied", async () => {
		const writeText = vi.fn().mockResolvedValue(undefined)
		expect(await shareResource(entry, { clipboard: { writeText } })).toBe("copied")
		expect(writeText).toHaveBeenCalledWith("https://varde.test/r/12")
	})
	test("with nothing to share or copy the outcome is failed", async () => {
		expect(await shareResource(entry, {})).toBe("failed")
	})
})

describe("copyText", () => {
	test("resolves true when the clipboard accepts the text", async () => {
		const writeText = vi.fn().mockResolvedValue(undefined)
		expect(await copyText("62 00 00 00", { clipboard: { writeText } })).toBe(true)
		expect(writeText).toHaveBeenCalledWith("62 00 00 00")
	})
	test("resolves false when the clipboard write is refused", async () => {
		const writeText = vi.fn().mockRejectedValue(new DOMException("denied", "NotAllowedError"))
		expect(await copyText("62 00 00 00", { clipboard: { writeText } })).toBe(false)
	})
	test("resolves false when there is no clipboard", async () => {
		expect(await copyText("62 00 00 00", {})).toBe(false)
	})
})
