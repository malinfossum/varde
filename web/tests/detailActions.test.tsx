import { render, screen } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { ResourceDetail } from "../src/components/ResourceDetail.tsx"
import { AnnouncerProvider } from "../src/components/StatusRegion.tsx"
import { type Lang, LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import { PageDataContext } from "../src/pageData.ts"
import { NO_FAMILY } from "../src/services/family.ts"
import type { ResourceDto } from "../src/types/api.ts"
import { makeResource } from "./stubData.ts"

const ringsaker: ResourceDto = makeResource({
	id: 102,
	name: "Psykisk helse- og rustjenester, Ringsaker kommune",
	description: "Kommunens tilbud.",
	phone: "62 33 52 20",
})

// jsdom ships neither navigator.share nor navigator.clipboard; each test installs what it is about.
function installNavigator(overrides: { share?: unknown; clipboard?: unknown }) {
	for (const [key, value] of Object.entries(overrides)) {
		Object.defineProperty(navigator, key, { value, configurable: true })
	}
	return () => {
		for (const key of Object.keys(overrides)) {
			delete (navigator as unknown as Record<string, unknown>)[key]
		}
	}
}
let restoreNavigator = () => {}
afterEach(() => {
	restoreNavigator()
	restoreNavigator = () => {}
})

// The prerendered path: the resource is baked in, so the page renders without a fetch.
function tree(resource: ResourceDto, lang: Lang) {
	return (
		<PageDataContext.Provider value={{ resource, family: NO_FAMILY }}>
			<LanguageProvider lang={lang}>
				<AnnouncerProvider>
					<ResourceDetail id={resource.id} />
				</AnnouncerProvider>
			</LanguageProvider>
		</PageDataContext.Provider>
	)
}

function renderBaked(resource: ResourceDto = ringsaker, lang: Lang = "nb") {
	return render(tree(resource, lang))
}

const actions = () => [...document.querySelectorAll<HTMLElement>(".detail-head .action-btn")]
const shortLabels = () => actions().map((a) => a.querySelector(".action-label")?.textContent)
const tips = () => actions().map((a) => a.querySelector(".action-tip")?.textContent)

test("with share and clipboard the head ends with copy, share and report, named in full", () => {
	restoreNavigator = installNavigator({
		share: vi.fn().mockResolvedValue(undefined),
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
	})
	renderBaked()
	expect(actions().map((a) => a.getAttribute("aria-label"))).toEqual([
		"Kopier nummer",
		"Del",
		"Meld feil i oppføringen",
	])
	expect(shortLabels()).toEqual(["Kopier nummer", "Del", "Meld feil"])
	expect(tips()).toEqual(["Kopier nummer", "Del", "Meld feil i oppføringen"])
	for (const a of actions()) {
		expect(a.querySelector(".action-label")).toHaveAttribute("aria-hidden", "true")
		expect(a.querySelector(".action-tip")).toHaveAttribute("aria-hidden", "true")
		expect(a.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
	}
	// The group is the last thing in the head, after the title block.
	expect(document.querySelector(".detail-head")?.lastElementChild).toHaveClass("detail-actions")
	expect(document.querySelector(".detail-actions")).not.toHaveAttribute("role")
})

test("in English the names are Copy number, Share and Report an error in this listing", () => {
	restoreNavigator = installNavigator({
		share: vi.fn().mockResolvedValue(undefined),
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
	})
	renderBaked(ringsaker, "en")
	expect(actions().map((a) => a.getAttribute("aria-label"))).toEqual([
		"Copy number",
		"Share",
		"Report an error in this listing",
	])
	expect(shortLabels()).toEqual(["Copy number", "Share", "Report"])
})

test("each short label is contained in its accessible name (WCAG 2.5.3), in both languages", () => {
	restoreNavigator = installNavigator({
		share: vi.fn().mockResolvedValue(undefined),
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
	})
	for (const lang of ["nb", "en"] as const) {
		const { unmount } = renderBaked(ringsaker, lang)
		for (const a of actions()) {
			const label = a.querySelector(".action-label")?.textContent ?? ""
			expect(a.getAttribute("aria-label")).toContain(label)
		}
		unmount()
	}
})

test("clipboard without share relabels share as Kopier lenke, label and tooltip too", () => {
	restoreNavigator = installNavigator({ clipboard: { writeText: vi.fn() } })
	renderBaked()
	const share = screen.getByRole("button", { name: "Kopier lenke" })
	expect(share.querySelector(".action-label")).toHaveTextContent("Kopier lenke")
	expect(share.querySelector(".action-tip")).toHaveTextContent("Kopier lenke")
})

test("the report action is the existing mailto link, as a link", () => {
	renderBaked()
	const report = screen.getByRole("link", { name: "Meld feil i oppføringen" })
	expect(report).toHaveClass("action-btn")
	expect(report.getAttribute("href")).toMatch(/^mailto:varde\.purely709@passmail\.com\?subject=/)
})

test("a service with no phone has two actions, share and report, and no empty slot", () => {
	restoreNavigator = installNavigator({
		share: vi.fn().mockResolvedValue(undefined),
		clipboard: { writeText: vi.fn() },
	})
	renderBaked({ ...ringsaker, phone: null })
	expect(actions().map((a) => a.getAttribute("aria-label"))).toEqual([
		"Del",
		"Meld feil i oppføringen",
	])
	expect(document.querySelector(".detail-actions")?.children).toHaveLength(2)
})
