import type { UnitGroup } from "../curate/include.ts"
import { lavterskel } from "../gates/lavterskel.ts"
import type { Candidate } from "../gates/types.ts"
import { namesMatch } from "../recall/match.ts"
import { brregRecordUrl } from "../registers/brreg.ts"
import { NKLM_PAGE, type NklmRow, nklmRecordId } from "../registers/nklm.ts"
import { FIELD_NAMES, type FieldName } from "../schema/common.ts"
import type { ExtractedCandidate, ExtractedPage } from "../schema/extraction.ts"
import { possibleNames } from "../text/names.ts"
import { phoneDigits } from "../text/normalise.ts"

export type Proposal = { candidate: Candidate; block?: number; rank?: 1 | 2 | 3; review?: string }

export type CandidateInput = {
	kommune: string
	group: UnitGroup
	// The units each page is a source for, by final URL.
	sharers: ReadonlyMap<string, readonly UnitGroup[]>
	switchboard?: { phone: string; orgNumber: string }
	// Pages on the kommune's own site: a "Sentralbord" line there is rank 3 for every unit.
	kommunePages: readonly ExtractedPage[]
	nklm?: { date: string; rows: readonly NklmRow[] }
	places: readonly string[]
}

// The values a page shared by several units can put on the wrong one (decided 06.11.2026). name
// joins them, since a shared page's h1 names the page; phoneHours and alwaysOpen go with the phone.
export const SHARED_FIELDS: ReadonlySet<FieldName> = new Set([
	"phone",
	"phoneHours",
	"alwaysOpen",
	"email",
	"address",
	"name",
])

const ORIGIN_ORDER: Readonly<Record<string, number>> = { unitContact: 0, unitPage: 1, register: 2 }

function toCandidate(input: CandidateInput, page: ExtractedPage, c: ExtractedCandidate): Candidate {
	const quotes = c.evidence.kind === "quote" ? c.evidence.quotes : []
	const ctx = { unitName: `${input.group.name} ${input.group.matchName}`, places: input.places }
	// The h1 is the name Varde stores, so its quote is no person's name to redact. A website's quote
	// is the h1 or, on a page with none, the first line (a byline, a breadcrumb), so it runs the
	// redaction like every other quote: the website is grounded by its source URL, not the quote.
	const personNames =
		c.field === "name" ? [] : [...new Set(quotes.flatMap((q) => possibleNames(q, ctx)))]
	return {
		kommune: input.kommune,
		unitId: input.group.unitId,
		field: c.field,
		value: c.value,
		sourceUrl: page.finalUrl,
		evidence: c.evidence,
		origin: c.origin,
		...(c.role === undefined ? {} : { role: c.role }),
		personNames,
		fetchedAt: page.fetchedAt,
	}
}

type Verdict = "keep" | "skip" | "review"

// On a page several units share, a value counts for this unit only when its block's heading names
// this unit and no other one. A heading that names only another unit is that unit's value. Any
// other value goes to review: a heading such as "Eksempel helsestasjon" names every unit on the
// page, because namesMatch lets the shorter name match the longer.
function shared(input: CandidateInput, page: ExtractedPage, c: ExtractedCandidate): Verdict {
	const sharers = input.sharers.get(page.finalUrl) ?? []
	if (sharers.length <= 1 || !SHARED_FIELDS.has(c.field)) return "keep"
	const heading = c.block === undefined ? undefined : page.blocks[c.block]?.heading
	const named = heading === undefined ? [] : sharers.filter((g) => namesMatch(heading, g.matchName))
	if (named.length === 1 && named[0]?.unitId === input.group.unitId) return "keep"
	if (named.length > 0 && !named.some((g) => g.unitId === input.group.unitId)) return "skip"
	return "review"
}

const register = (
	input: CandidateInput,
	field: FieldName,
	value: string,
	reg: "brreg" | "nklm",
	recordId: string,
	sourceUrl: string,
	fetchedAt: string,
	role?: string
): Candidate => ({
	kommune: input.kommune,
	unitId: input.group.unitId,
	field,
	value,
	sourceUrl,
	evidence: { kind: "register", register: reg, recordId },
	origin: "register",
	...(role === undefined ? {} : { role }),
	personNames: [],
	fetchedAt,
})

// Brreg keeps the switchboard as typed ("+47 62000005"). It is stored the way a page writes a
// landline, from the same digits every phone comparison reads: "62 00 00 05".
export function switchboardPhone(raw: string): string {
	const digits = phoneDigits(raw)
	return digits.length === 8 ? digits.replace(/(\d{2})(?=\d)/g, "$1 ") : raw.trim()
}

// One proposal per field for the unit, and every candidate the agreement gate compares it with.
export function unitCandidates(input: CandidateInput): { chosen: Proposal[]; peers: Candidate[] } {
	const proposals: Proposal[] = []
	const g = input.group
	const firstFetch = g.pages[0]?.fetchedAt ?? "1970-01-01T00:00:00Z"
	for (const page of g.pages) {
		for (const c of page.candidates) {
			const verdict = shared(input, page, c)
			if (verdict === "skip") continue
			const sharers = input.sharers.get(page.finalUrl)?.length ?? 1
			const review = verdict === "review" ? `the page is shared by ${sharers} units` : c.review
			proposals.push({
				candidate: toCandidate(input, page, c),
				...(c.block === undefined ? {} : { block: c.block }),
				...(c.rank === undefined ? {} : { rank: c.rank }),
				...(review === undefined ? {} : { review }),
			})
		}
	}
	const peers: Candidate[] = proposals
		.filter((p) => p.candidate.field !== "phone")
		.map((p) => p.candidate)
	if (g.unit?.address !== undefined) {
		const url = brregRecordUrl(g.unit.register, g.unit.orgNumber)
		peers.push(
			register(input, "address", g.unit.address, "brreg", g.unit.orgNumber, url, firstFetch)
		)
	}
	const nklmRows = (input.nklm?.rows ?? []).filter(
		(r) => r.kommuner.includes(input.kommune) && namesMatch(r.name, g.name)
	)
	const nklmPeers = nklmRows.flatMap((r) => {
		const id = nklmRecordId(input.nklm?.date ?? "", r.row)
		return [
			...(r.phone === undefined
				? []
				: [register(input, "phone", r.phone, "nklm", id, NKLM_PAGE, firstFetch)]),
			...(r.address === undefined
				? []
				: [register(input, "address", r.address, "nklm", id, NKLM_PAGE, firstFetch)]),
		]
	})
	peers.push(...nklmPeers.filter((c) => c.field === "address"))

	const chosen: Proposal[] = []
	// The phone order: rank 1, else rank 2, else the switchboard (Brreg first, then a kommune page).
	const phones = proposals.filter((p) => p.candidate.field === "phone")
	const top = ([1, 2] as const)
		.map((r) => phones.filter((p) => p.rank === r))
		.find((list) => list.length > 0)
	let phone: Proposal | undefined = top?.[0]
	if (top !== undefined) {
		peers.push(...top.map((p) => p.candidate))
		if (phone?.rank === 1) peers.push(...nklmPeers.filter((c) => c.field === "phone"))
	} else if (input.switchboard !== undefined) {
		const url = brregRecordUrl("enheter", input.switchboard.orgNumber)
		phone = {
			candidate: register(
				input,
				"phone",
				switchboardPhone(input.switchboard.phone),
				"brreg",
				input.switchboard.orgNumber,
				url,
				firstFetch,
				"Sentralbord"
			),
			rank: 3,
		}
	} else {
		const rank3 =
			phones.find((p) => p.rank === 3) ??
			input.kommunePages
				.flatMap((page) =>
					page.candidates
						.filter((c) => c.field === "phone" && c.rank === 3)
						.map((c) => ({ page, c }))
				)
				.map(({ page, c }): Proposal => ({ candidate: toCandidate(input, page, c), rank: 3 }))[0]
		phone = rank3
	}
	if (phone !== undefined) chosen.push(phone)
	for (const field of FIELD_NAMES) {
		if (field === "phone" || field === "lowThreshold") continue
		let list = proposals.filter((p) => p.candidate.field === field)
		// Hours and always-open belong to the rank 1 number they were read beside.
		if (field === "phoneHours" || field === "alwaysOpen") {
			list =
				phone?.rank === 1
					? list.filter(
							(p) =>
								p.candidate.sourceUrl === phone?.candidate.sourceUrl && p.block === phone?.block
						)
					: []
		}
		const best = [...list].sort(
			(a, b) => (ORIGIN_ORDER[a.candidate.origin] ?? 3) - (ORIGIN_ORDER[b.candidate.origin] ?? 3)
		)[0]
		if (best !== undefined) chosen.push(best)
		else if (field === "address" && g.unit?.address !== undefined) {
			const url = brregRecordUrl(g.unit.register, g.unit.orgNumber)
			chosen.push({
				candidate: register(
					input,
					"address",
					g.unit.address,
					"brreg",
					g.unit.orgNumber,
					url,
					firstFetch
				),
			})
		}
	}
	// The Lavterskel badge: the first page with quotes; the safety gate's rule decides it.
	const lav = g.pages.find((p) => p.lavterskelQuotes.length > 0)
	if (lav !== undefined) {
		const quotes = lav.lavterskelQuotes
		const ctx = { unitName: `${g.name} ${g.matchName}`, places: input.places }
		chosen.push({
			candidate: {
				kommune: input.kommune,
				unitId: g.unitId,
				field: "lowThreshold",
				value: lavterskel(quotes, undefined).outcome === "yes",
				sourceUrl: lav.finalUrl,
				evidence: { kind: "quote", quotes },
				origin: "unitPage",
				personNames: [...new Set(quotes.flatMap((q) => possibleNames(q, ctx)))],
				fetchedAt: lav.fetchedAt,
			},
		})
	}
	return { chosen, peers }
}
