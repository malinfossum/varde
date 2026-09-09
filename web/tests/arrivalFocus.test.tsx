import { act, render, screen } from "@testing-library/react"
import { expect, test } from "vitest"
import { useArrivalFocus } from "../src/hooks/useArrivalFocus.ts"
import { useDocumentTitle } from "../src/hooks/useDocumentTitle.ts"

function Probe({ arrival, ready }: { arrival: number; ready: boolean }) {
	const { ref } = useArrivalFocus<HTMLHeadingElement>(arrival, ready)
	return ready ? (
		<h1 ref={ref} tabIndex={-1}>
			Heading
		</h1>
	) : (
		<p>loading</p>
	)
}

test("first load never steals focus", () => {
	render(<Probe arrival={0} ready={true} />)
	expect(screen.getByRole("heading")).not.toHaveFocus()
})

test("an arrival focuses the heading once it is ready, and only once", () => {
	const { rerender } = render(<Probe arrival={1} ready={false} />)
	rerender(<Probe arrival={1} ready={true} />)
	expect(screen.getByRole("heading")).toHaveFocus()
	screen.getByRole("heading").blur()
	rerender(<Probe arrival={1} ready={true} />)
	expect(screen.getByRole("heading")).not.toHaveFocus()
})

test("requestFocus moves focus on the next ready render", () => {
	let request: () => void = () => {}
	function Pager({ ready }: { ready: boolean }) {
		const { ref, requestFocus } = useArrivalFocus<HTMLHeadingElement>(0, ready)
		request = requestFocus
		return ready ? (
			<h2 ref={ref} tabIndex={-1}>
				Results
			</h2>
		) : (
			<p>loading</p>
		)
	}
	const { rerender } = render(<Pager ready={true} />)
	act(() => request())
	rerender(<Pager ready={false} />)
	rerender(<Pager ready={true} />)
	expect(screen.getByRole("heading")).toHaveFocus()
})

test("useDocumentTitle sets and updates the title", () => {
	function Titled({ title }: { title: string }) {
		useDocumentTitle(title)
		return null
	}
	const { rerender } = render(<Titled title="Søk – Varde" />)
	expect(document.title).toBe("Søk – Varde")
	rerender(<Titled title="Varde" />)
	expect(document.title).toBe("Varde")
})
