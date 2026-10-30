import { vi } from "vitest"
import type { PageData } from "../src/pageData.ts"
import type { Index } from "../src/services/data.ts"
import { pickHelplines } from "../src/services/helplines.ts"
import type { Lang } from "../src/services/urlState.ts"
import type { ResourceDto } from "../src/types/api.ts"

const empty: Index = {
	resources: [],
	municipalities: [],
	categories: [],
	kommuner: [],
	counties: [],
	aliases: [],
}

// One fetch stub for every test that needs data: answers the eight JSON files the export
// script writes, 404s everything else. Replaces the per-test API stubs from the API era.
// A plain vi.fn() (not vi.stubGlobal's own closure) so tests can assert on call counts, e.g.
// the useCatalog retry test asserting the fetch call count grows.
// Both languages get the same rows unless a test passes its own English rows.
export function stubDataFiles(fixture: Partial<Index> = {}, enResources?: ResourceDto[]): void {
	const index = { ...empty, ...fixture }
	const files: Record<string, unknown> = {
		"/data/resources.nb.json": index.resources,
		"/data/resources.en.json": enResources ?? index.resources,
		"/data/municipalities.json": index.municipalities,
		"/data/categories.nb.json": index.categories,
		"/data/categories.en.json": index.categories,
		"/data/kommuner.json": index.kommuner,
		"/data/counties.json": index.counties,
		"/data/aliases.json": index.aliases,
	}
	vi.stubGlobal(
		"fetch",
		vi.fn(async (input: RequestInfo | URL) => {
			const path = new URL(String(input), "http://localhost").pathname
			if (path in files) return new Response(JSON.stringify(files[path]), { status: 200 })
			return new Response("not found", { status: 404 })
		})
	)
}

// One national row with every optional field empty; a test overrides only what it is about.
export function makeResource(
	over: Partial<ResourceDto> & Pick<ResourceDto, "id" | "name">
): ResourceDto {
	return {
		description: "",
		isFallbackTranslation: false,
		openingHours: null,
		isNational: true,
		isAlwaysOpen: false,
		isLowThreshold: false,
		cost: null,
		costNote: null,
		municipalityId: null,
		municipalityName: null,
		address: null,
		phone: null,
		email: null,
		website: null,
		chatUrl: null,
		lastVerified: "2026-08-13",
		categories: [],
		servedMunicipalityIds: [],
		parentId: null,
		phoneMenuOption: null,
		...over,
	}
}

// The four landing rows and Mental Helse's two children (9 and 122), not in landing order (the
// tests reverse them anyway). Copied from SeedData.cs: Mental Helse has no chat of its own, so its
// chat comes from Sidetmedord.
export const helplineRows: ResourceDto[] = [
	makeResource({
		id: 1,
		name: "Hjelpetelefonen (Mental Helse)",
		phone: "116 123",
		isAlwaysOpen: true,
	}),
	makeResource({
		id: 2,
		name: "Kirkens SOS",
		phone: "22 40 00 40",
		chatUrl: "https://www.soschat.no",
		isAlwaysOpen: true,
	}),
	makeResource({
		id: 4,
		name: "Alarmtelefonen for barn og unge",
		phone: "116 111",
		chatUrl: "https://www.116111.no",
		isAlwaysOpen: true,
	}),
	makeResource({
		id: 9,
		name: "Arbeidslivstelefonen (Mental Helse)",
		phone: "116 123",
		parentId: 1,
		phoneMenuOption: 3,
	}),
	makeResource({
		id: 121,
		name: "Kors på halsen (Røde Kors)",
		phone: "800 33 321",
		chatUrl: "https://www.korspahalsen.no",
	}),
	makeResource({
		id: 122,
		name: "Sidetmedord (Mental Helse)",
		chatUrl: "https://mentalhelse.no/hjelpechat/",
		parentId: 1,
	}),
]

// What a sighted user sees on a button: its text without the visually hidden parts.
export function visibleText(element: HTMLElement): string {
	const copy = element.cloneNode(true) as HTMLElement
	for (const hidden of copy.querySelectorAll(".visually-hidden, .hidden-inline")) hidden.remove()
	return copy.textContent?.trim() ?? ""
}

// The page data the prerender bakes into a landing page, for tests that render or hydrate it.
export function bakedHelplines(lang: Lang): PageData {
	return { lang, helplines: pickHelplines(helplineRows) }
}
