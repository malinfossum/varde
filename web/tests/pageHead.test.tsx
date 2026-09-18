import { render } from "@testing-library/react"
import { afterEach, expect, test } from "vitest"
import { HeadContext, type HeadEntry, PageHead } from "../src/components/PageHead.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import { metaDescription } from "../src/services/site.ts"

afterEach(() => {
	document.head.querySelectorAll("[data-page-head]").forEach((el) => {
		el.remove()
	})
	document.title = ""
})

test("in the browser it writes title, description, canonical and hreflang into the head", () => {
	render(
		<LanguageProvider lang="en">
			<PageHead title="NAV Hamar – Varde" description="Økonomisk rådgivning" path="/resources/12" />
		</LanguageProvider>
	)
	expect(document.title).toBe("NAV Hamar – Varde")
	expect(document.head.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
		"Økonomisk rådgivning"
	)
	expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(
		"http://localhost:5173/en/resources/12"
	)
	const alternates = [...document.head.querySelectorAll('link[rel="alternate"]')].map((l) => [
		l.getAttribute("hreflang"),
		l.getAttribute("href"),
	])
	expect(alternates).toEqual([
		["nb", "http://localhost:5173/resources/12"],
		["en", "http://localhost:5173/en/resources/12"],
		["x-default", "http://localhost:5173/resources/12"],
	])
})

test("under a collector it reports instead of touching the document", () => {
	const seen: HeadEntry[] = []
	render(
		<HeadContext.Provider value={{ set: (e) => seen.push(e) }}>
			<LanguageProvider lang="nb">
				<PageHead title="Søk – Varde" description="d" path="/sok" />
			</LanguageProvider>
		</HeadContext.Provider>
	)
	expect(seen).toEqual([{ title: "Søk – Varde", description: "d", path: "/sok", lang: "nb" }])
	expect(document.title).toBe("")
})

test("metaDescription cuts at the last space before 155 characters", () => {
	const long = `${"ord ".repeat(60)}slutt`
	const cut = metaDescription(long)
	expect(cut.length).toBeLessThanOrEqual(156)
	expect(cut.endsWith("…")).toBe(true)
	expect(cut.at(-2)).not.toBe(" ")
	expect(metaDescription("kort")).toBe("kort")
})
