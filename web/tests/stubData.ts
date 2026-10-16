import { vi } from "vitest"
import type { PageData } from "../src/pageData.ts"
import type { Index } from "../src/services/data.ts"
import { pickHelplines } from "../src/services/helplines.ts"
import type { Lang } from "../src/services/urlState.ts"
import type { ResourceDto } from "../src/types/api.ts"

const empty: Index = { resources: [], municipalities: [], categories: [], kommuner: [] }

// One fetch stub for every test that needs data: answers the six JSON files the export
// script writes, 404s everything else. Replaces the per-test API stubs from the API era.
// A plain vi.fn() (not vi.stubGlobal's own closure) so tests can assert on call counts, e.g.
// the useCatalog retry test asserting the fetch call count grows.
export function stubDataFiles(fixture: Partial<Index> = {}): void {
	const index = { ...empty, ...fixture }
	const files: Record<string, unknown> = {
		"/data/resources.nb.json": index.resources,
		"/data/resources.en.json": index.resources,
		"/data/municipalities.json": index.municipalities,
		"/data/categories.nb.json": index.categories,
		"/data/categories.en.json": index.categories,
		"/data/kommuner.json": index.kommuner,
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

function helpline(
	id: number,
	name: string,
	phone: string | null,
	chatUrl: string | null
): ResourceDto {
	return {
		id,
		name,
		description: "",
		isFallbackTranslation: false,
		openingHours: null,
		isNational: true,
		isAlwaysOpen: false,
		municipalityId: null,
		municipalityName: null,
		address: null,
		phone,
		email: null,
		website: null,
		chatUrl,
		lastVerified: "2026-08-13",
		categories: [],
		servedMunicipalityIds: [],
		parentId: null,
		phoneMenuOption: null,
	}
}

// The five "Noen å snakke med" rows, not in the landing order (the test reverses them anyway).
export const helplineRows: ResourceDto[] = [
	helpline(1, "Hjelpetelefonen (Mental Helse)", "116 123", null),
	helpline(2, "Kirkens SOS", "22 40 00 40", "https://www.soschat.no"),
	helpline(9, "Arbeidslivstelefonen (Mental Helse)", "116 123", null),
	helpline(121, "Kors på halsen (Røde Kors)", "800 33 321", "https://www.korspahalsen.no"),
	helpline(122, "Sidetmedord (Mental Helse)", null, "https://sidetmedord.mentalhelse.no/"),
]

// The page data the prerender bakes into a landing page, for tests that render or hydrate it.
export function bakedHelplines(lang: Lang): PageData {
	return { helplines: { lang, entries: pickHelplines(helplineRows) } }
}
