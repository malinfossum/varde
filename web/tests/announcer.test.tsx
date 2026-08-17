import { act, render, screen } from "@testing-library/react"
import { expect, test, vi } from "vitest"
import { AnnouncerProvider, useAnnounce } from "../src/components/StatusRegion.tsx"

function Probe({ onReady }: { onReady: (announce: (message: string) => void) => void }) {
	onReady(useAnnounce())
	return null
}

function renderProbe() {
	let announce: (message: string) => void = () => {}
	render(
		<AnnouncerProvider>
			<Probe
				onReady={(fn) => {
					announce = fn
				}}
			/>
		</AnnouncerProvider>
	)
	// Calls happen outside a React event handler, so each state update needs act() to flush
	// synchronously before the assertion reads the DOM.
	return (message: string) => act(() => announce(message))
}

test("announcements within the compose window are combined, not replaced", () => {
	const announce = renderProbe()
	announce("A")
	announce("B")
	const region = screen.getByText("A. B")
	expect(region).toHaveTextContent("A. B")
})

test("an announcement after the compose window replaces instead of composing", () => {
	vi.useFakeTimers()
	// performance.now() is what the provider actually reads, so advance that clock rather than
	// Date — fake timers move both together, but be explicit about which one gates the window.
	const announce = renderProbe()
	announce("A")
	announce("B")
	act(() => vi.advanceTimersByTime(1600))
	announce("C")
	const region = screen.getByText("C")
	expect(region).toHaveTextContent("C")
	expect(region.textContent).not.toContain("A")
	expect(region.textContent).not.toContain("B")
	vi.useRealTimers()
})
