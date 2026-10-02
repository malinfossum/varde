import { render } from "@testing-library/react"
import { expect, test } from "vitest"
import { ringMark, svgDoc } from "../scripts/brand-geometry.mjs"
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

// Root attributes allowed to differ between the header mark and the pack. The header svg is
// decorative and sized by CSS; the pack's svg root carries a namespace and a fixed size. Only
// the root skips them: the mask and its rect need their width and height compared.
const ROOT_ONLY = new Set(["aria-hidden", "focusable", "class", "xmlns", "width", "height"])

type Shape = { name: string; attrs: [string, string][]; children: Shape[] }

// The tree as plain data: element names in order, attributes sorted by name, ids renamed by
// document order and every url(#id) pointed at the new name. Values stay as written, so a
// changed number still shows.
function shape(root: Element): Shape {
	const ids = new Map([...root.querySelectorAll("[id]")].map((el, i) => [el.id, `id${i}`]))
	const walk = (el: Element): Shape => ({
		name: el.localName,
		attrs: el
			.getAttributeNames()
			.filter((name) => el !== root || !ROOT_ONLY.has(name))
			.sort()
			.map((name): [string, string] => {
				const value = el.getAttribute(name) as string
				if (name === "id") return [name, ids.get(value) ?? value]
				return [name, value.replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${ids.get(id) ?? id})`)]
			}),
		children: [...el.children].map(walk),
	})
	return walk(root)
}

test("the header mark draws the same shapes as the pack's ringMark", () => {
	const { container } = render(<BrandMark />)
	const pack = new DOMParser().parseFromString(
		svgDoc(32, 32, ringMark("currentColor")),
		"image/svg+xml"
	).documentElement
	expect(pack.localName).toBe("svg")
	expect(shape(container.querySelector("svg") as SVGSVGElement)).toEqual(shape(pack))
})
