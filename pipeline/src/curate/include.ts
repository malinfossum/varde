import type { DiscoveredUnit } from "../discover/types.ts"
import { namesMatch } from "../recall/match.ts"
import type { CategorySlug, ProviderType } from "../schema/common.ts"
import type { ExtractedPage } from "../schema/extraction.ts"
import { unitId } from "../schema/ids.ts"
import type { Inclusion } from "../schema/lock.ts"
import { normaliseUrl } from "../text/normalise.ts"
import { categoriesFor, providerTypeFor } from "./categories.ts"

export type UnitGroup = {
	unitId: string
	unit?: DiscoveredUnit
	pages: ExtractedPage[]
	name: string
	matchName: string
	categories: CategorySlug[]
	isKrisesenter: boolean
	providerType?: ProviderType
	inclusion: Inclusion
}

export type MatchInput = {
	units: readonly DiscoveredUnit[]
	pages: readonly ExtractedPage[]
	// Nav office pages and other pages found nationally: they join a kommune only through a unit.
	national: ReadonlySet<string>
	addressId: (address: string) => string | undefined
	kommuneHost?: string
	nklmLegevakt: (pageName: string) => boolean
}

export type MatchResult = {
	groups: UnitGroup[]
	noUnitId: number
	unitsWithoutPage: number
	pagesWithProblem: number
	nationalUnmatched: number
	foldedParents: number
}

const candidateValue = (page: ExtractedPage, field: "name" | "address") => {
	const c = page.candidates.find((x) => x.field === field && x.origin !== "register")
	return typeof c?.value === "string" ? c.value : undefined
}
export const pageName = (page: ExtractedPage) => candidateValue(page, "name")
export const pageAddress = (page: ExtractedPage) => candidateValue(page, "address")

// A Brreg main unit and its only sub-unit in the list are one service: Brreg lists an
// association and its branch with one name and one address, and both would match its page,
// which turns one service into two questions and, with two yes answers, two listings. The
// sub-unit stays (it carries the visiting address), with the main unit's legal form, and with
// the main unit's website and code when it has none of its own. A main unit with two or more
// sub-units here keeps them apart: those are separate services.
export function foldParents(units: readonly DiscoveredUnit[]): {
	units: DiscoveredUnit[]
	folded: number
} {
	const byOrg = new Map(units.map((u) => [u.orgNumber, u]))
	const children = new Map<string, DiscoveredUnit[]>()
	for (const u of units) {
		if (u.parent !== undefined && byOrg.has(u.parent))
			children.set(u.parent, [...(children.get(u.parent) ?? []), u])
	}
	const onlyChild = (orgNumber: string) => children.get(orgNumber)?.length === 1
	const out: DiscoveredUnit[] = []
	let folded = 0
	for (const u of units) {
		if (onlyChild(u.orgNumber)) {
			folded++
			continue
		}
		const parent = u.parent === undefined ? undefined : byOrg.get(u.parent)
		if (parent === undefined || !onlyChild(parent.orgNumber)) {
			out.push(u)
			continue
		}
		const merged: DiscoveredUnit = { ...u, orgForm: parent.orgForm }
		const website = u.website ?? parent.website
		if (website !== undefined) merged.website = website
		const code = u.naeringskode ?? parent.naeringskode
		if (code !== undefined) merged.naeringskode = code
		out.push(merged)
	}
	return { units: out, folded }
}

// A Brreg unit and a page belong together by the unit's website or the org number the page
// carries (Nav office data): a strong match. Name plus the same Kartverket address id only
// suggests it: a weak match.
function belongs(
	u: DiscoveredUnit,
	p: ExtractedPage,
	addressId: MatchInput["addressId"]
): "strong" | "weak" | undefined {
	if (u.website !== undefined) {
		const site = normaliseUrl(u.website)
		if (site === normaliseUrl(p.url) || site === normaliseUrl(p.finalUrl)) return "strong"
	}
	if (p.orgNumber !== undefined && p.orgNumber === u.orgNumber) return "strong"
	const name = pageName(p)
	const address = pageAddress(p)
	if (name === undefined || address === undefined || u.address === undefined) return undefined
	const id = addressId(address)
	return id !== undefined && id === addressId(u.address) && namesMatch(u.name, name)
		? "weak"
		: undefined
}

const byUnitId = (a: UnitGroup, b: UnitGroup) =>
	a.unitId < b.unitId ? -1 : a.unitId > b.unitId ? 1 : 0

// Which pages belong to which unit, and whether each unit gets in without my look. Exactly one
// unit for one page, that unit on no other page, a heading that names the unit, a known
// category and a known provider type is automatic. Anything else is one question for me.
// Reasons never hold a name or a value.
export function matchUnits(input: MatchInput): MatchResult {
	let pagesWithProblem = 0
	let nationalUnmatched = 0
	let noUnitId = 0
	const { units, folded } = foldParents(input.units)
	const usable = input.pages.filter((p) => {
		if (p.problem === undefined) return true
		pagesWithProblem++
		return false
	})
	const unitsOf = new Map<ExtractedPage, DiscoveredUnit[]>()
	const pagesOf = new Map<DiscoveredUnit, ExtractedPage[]>()
	for (const p of usable) {
		const strong: DiscoveredUnit[] = []
		const weak: DiscoveredUnit[] = []
		for (const u of units) {
			const how = belongs(u, p, input.addressId)
			if (how === "strong") strong.push(u)
			else if (how === "weak") weak.push(u)
		}
		// A website or an org number names the unit; a strong match leaves the weak ones out.
		const found = strong.length > 0 ? strong : weak
		unitsOf.set(p, found)
		for (const u of found) pagesOf.set(u, [...(pagesOf.get(u) ?? []), p])
	}
	const groups = new Map<string, UnitGroup>()
	for (const [u, pages] of pagesOf) {
		const shared = pages.some((p) => (unitsOf.get(p)?.length ?? 0) > 1)
		const h1 = pages.length === 1 && !shared ? pageName(pages[0] as ExtractedPage) : undefined
		// A hub page a Brreg website points at ("Familie og oppvekst") must not lend its title, or
		// its number, to one unit without my look.
		const named = h1 !== undefined && namesMatch(u.name, h1)
		const urls = pages.map((p) => p.finalUrl)
		const legevakt = pages.some((p) => {
			const n = pageName(p)
			return n !== undefined && input.nklmLegevakt(n)
		})
		const names = [u.name, ...pages.flatMap((p) => pageName(p) ?? [])]
		const cat = categoriesFor({
			...(u.naeringskode === undefined ? {} : { naeringskode: u.naeringskode }),
			urls,
			names,
			nklmLegevakt: legevakt,
		})
		const providerType = providerTypeFor({
			orgForm: u.orgForm,
			urls,
			...(input.kommuneHost === undefined ? {} : { kommuneHost: input.kommuneHost }),
		})
		const reason = shared
			? "two or more register units share the page"
			: pages.length > 1
				? "the unit has two or more pages"
				: !cat.known
					? "no known category"
					: !named
						? "the page heading does not name the unit"
						: providerType === undefined
							? "the provider type is unknown"
							: undefined
		// Suggestions reach the question whatever the reason, so a helsestasjon is offered
		// familie-og-barn.
		const inclusion: Inclusion = {
			status: reason === undefined ? "auto" : "review",
			reason: reason ?? "one register unit, one page, a known category",
			suggestedCategories: cat.categories,
			...(providerType === undefined ? {} : { providerType }),
		}
		const id = unitId({ orgNumber: u.orgNumber, name: u.name })
		groups.set(id, {
			unitId: id,
			unit: u,
			pages,
			name: named && h1 !== undefined ? h1 : u.name,
			matchName: u.name,
			categories: cat.categories,
			isKrisesenter: cat.isKrisesenter,
			...(providerType === undefined ? {} : { providerType }),
			inclusion,
		})
	}
	for (const p of usable) {
		if ((unitsOf.get(p)?.length ?? 0) > 0) continue
		if (input.national.has(p.url)) {
			nationalUnmatched++
			continue
		}
		const name = pageName(p)
		const address = pageAddress(p)
		const addressId = address === undefined ? undefined : input.addressId(address)
		let id: string | undefined
		try {
			id = name === undefined || addressId === undefined ? undefined : unitId({ addressId, name })
		} catch {
			id = undefined
		}
		if (id === undefined || name === undefined) {
			// No org number and no resolvable address: no unit id, so nothing is stored. PR 4 measures it.
			noUnitId++
			continue
		}
		const existing = groups.get(id)
		if (existing !== undefined) {
			existing.pages.push(p)
			continue
		}
		const cat = categoriesFor({
			urls: [p.finalUrl],
			names: [name],
			nklmLegevakt: input.nklmLegevakt(name),
		})
		const providerType = providerTypeFor({
			urls: [p.finalUrl],
			...(input.kommuneHost === undefined ? {} : { kommuneHost: input.kommuneHost }),
		})
		groups.set(id, {
			unitId: id,
			pages: [p],
			name,
			matchName: name,
			categories: cat.categories,
			isKrisesenter: cat.isKrisesenter,
			...(providerType === undefined ? {} : { providerType }),
			inclusion: {
				status: "review",
				reason: "no register unit matches the page",
				suggestedCategories: cat.categories,
				...(providerType === undefined ? {} : { providerType }),
			},
		})
	}
	const unitsWithoutPage = units.filter((u) => !pagesOf.has(u)).length
	return {
		groups: [...groups.values()].sort(byUnitId),
		noUnitId,
		unitsWithoutPage,
		pagesWithProblem,
		nationalUnmatched,
		foldedParents: folded,
	}
}
