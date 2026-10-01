import { render } from "@testing-library/react"
import { expect, test } from "vitest"
import { BrandMark } from "../src/components/BrandMark.tsx"

test("two marks on one page each point at their own clip and mask", () => {
	const { container } = render(
		<>
			<BrandMark />
			<BrandMark />
		</>
	)
	const svgs = [...container.querySelectorAll("svg")]
	expect(svgs).toHaveLength(2)
	const ids = svgs.flatMap((svg) => {
		const scene = svg.querySelector("g[clip-path]")
		const refs = [scene?.getAttribute("clip-path"), scene?.getAttribute("mask")].map(
			(value) => value?.match(/^url\(#(.+)\)$/)?.[1]
		)
		for (const id of refs) {
			expect(id).toBeDefined()
			expect(document.getElementById(id as string)?.closest("svg")).toBe(svg)
		}
		return refs
	})
	expect(new Set(ids).size).toBe(4)
})

test("the mark stays decorative and draws in currentColor", () => {
	const { container } = render(<BrandMark />)
	const svg = container.querySelector("svg")
	expect(svg).toHaveAttribute("aria-hidden", "true")
	expect(svg?.querySelector("circle[stroke='currentColor']")).not.toBeNull()
	expect(svg?.querySelectorAll("polygon")).toHaveLength(4)
})
