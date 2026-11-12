import { CuratedWriteError, writeCuratedFile } from "../curate/write.ts"
import { checkEdit } from "../gates/run.ts"
import type { AddressHit, Candidate, GateContext } from "../gates/types.ts"
import { unsettledValidity, validityGate } from "../gates/validity.ts"
import {
	CATEGORY_SLUGS,
	type CategorySlug,
	type FieldValue,
	type ProviderType,
} from "../schema/common.ts"
import {
	type CuratedFile,
	type CuratedUnit,
	findDecision,
	type ReviewDecision,
} from "../schema/curated.ts"
import { hasInvisible } from "../text/invisible.ts"
import { midSentenceWords, possibleNames } from "../text/names.ts"
import { LineReader } from "./lines.ts"
import {
	buildQueue,
	canAccept,
	type FieldItem,
	type IncludeItem,
	type KommuneFiles,
	type ReviewItem,
} from "./queue.ts"
import { renderItem } from "./render.ts"

export type EditChecks = {
	findAddress: (address: string, kommune: string) => Promise<AddressHit | undefined>
	urlStatus: (url: string) => Promise<number | undefined>
	validKommuner: ReadonlySet<string>
}
export type ReviewIO = {
	input: NodeJS.ReadableStream
	output: { write: (text: string) => unknown }
	isTTY: boolean
	color: boolean
	signal?: AbortSignal
	today: () => string
	checks: EditChecks
	save?: (path: string, file: CuratedFile) => Promise<void>
}
export type ReviewOutcome = {
	outcome: "empty" | "refused" | "done" | "quit" | "stopped"
	answered: number
}

// Today in Norway, as the calendar date my decisions carry.
export const osloDate = (ms = Date.now()) =>
	new Intl.DateTimeFormat("en-CA", {
		timeZone: "Europe/Oslo",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(ms)

type Step = "answered" | "skip" | "again" | "quit" | "stopped"
const BOOLEAN_FIELDS = new Set(["alwaysOpen", "lowThreshold"])

// Words in text I type that may be a person's name: a run of two or more capitalised words, or one
// that stands inside a sentence, as the hours name guard reads them. A capitalised word that opens
// the text ("Ikke en tjeneste") is not one.
export function namesInMyText(text: string, unitName: string): string[] {
	const inside = new Set(midSentenceWords(text))
	return possibleNames(text, { unitName, places: [] }).filter(
		(run) => run.includes(" ") || inside.has(run)
	)
}

class Session {
	readonly #io: ReviewIO
	readonly #reader: LineReader
	readonly #byKommune: Map<string, KommuneFiles>

	constructor(files: readonly KommuneFiles[], io: ReviewIO) {
		this.#io = io
		this.#reader = new LineReader(io.input, io.signal)
		this.#byKommune = new Map(files.map((f) => [f.kommune, f]))
	}

	out(text: string): void {
		this.#io.output.write(text)
	}

	// A line from me, trimmed. undefined means quit: the end of input or Ctrl+C.
	async line(prompt: string): Promise<string | undefined> {
		this.out(prompt)
		return (await this.#reader.next())?.trim()
	}

	// A sub-prompt: q alone quits here too, so I can leave from any question.
	async answer(prompt: string): Promise<string | undefined> {
		const a = await this.line(prompt)
		return a === undefined || a.toLowerCase() === "q" ? undefined : a
	}

	async key(keys: readonly string[]): Promise<string | undefined> {
		for (;;) {
			const answer = await this.line("> ")
			if (answer === undefined) return undefined
			if (keys.includes(answer.toLowerCase())) return answer.toLowerCase()
			this.out(`Use one of: ${keys.join(", ")}, then Enter\n`)
		}
	}

	// Text I type that the curated file stores, which is public once I commit it. A hidden character
	// (a paste can bring one) is refused. A possible person name is shown back, and "keep" keeps it.
	async freeText(
		prompt: string,
		unitName: string,
		allowEmpty: boolean
	): Promise<string | undefined> {
		let text = await this.answer(prompt)
		for (;;) {
			if (text === undefined) return undefined
			if (text === "" && allowEmpty) return ""
			if (hasInvisible(text)) {
				this.out("Refused: that text holds a hidden character (from a paste?). Type it again\n")
			} else if (text !== "") {
				const names = namesInMyText(text, unitName)
				if (names.length === 0) return text
				this.out(`Curated files are public. This may be a person's name: ${names.join(", ")}\n`)
				const confirm = await this.answer(
					"Type keep and Enter to keep it as it is, or type it again\n> "
				)
				if (confirm === undefined) return undefined
				if (confirm.toLowerCase() === "keep") return text
				text = confirm
				continue
			}
			text = await this.answer(prompt)
		}
	}

	async save(kommune: string, what: string): Promise<boolean> {
		const f = this.#byKommune.get(kommune)
		if (f === undefined) return false
		try {
			await (this.#io.save ?? writeCuratedFile)(f.curatedPath, f.curated)
			this.out(`Saved: ${what}.\n`)
			return true
		} catch (err) {
			this.out(
				`${err instanceof CuratedWriteError ? err.message : "could not save the curated file"}. Stopping.\n`
			)
			return false
		}
	}

	unit(kommune: string, unitId: string): CuratedUnit | undefined {
		return this.#byKommune.get(kommune)?.curated.units.find((u) => u.unitId === unitId)
	}

	addUnit(kommune: string, unit: CuratedUnit): void {
		const f = this.#byKommune.get(kommune)
		if (f === undefined) return
		f.curated = {
			...f.curated,
			units: [...f.curated.units, unit].sort((a, b) => (a.unitId < b.unitId ? -1 : 1)),
		}
	}

	async providerType(suggested: ProviderType | undefined): Promise<ProviderType | undefined> {
		if (suggested !== undefined) return suggested
		this.out("Provider type: o offentlig, f frivillig, q quit, then Enter\n")
		const k = await this.key(["o", "f", "q"])
		return k === undefined || k === "q" ? undefined : k === "o" ? "offentlig" : "frivillig"
	}

	async categories(suggested: readonly CategorySlug[]): Promise<CategorySlug[] | undefined> {
		const list = CATEGORY_SLUGS.map((c, i) => `${i + 1} ${c}`).join(", ")
		for (;;) {
			const answer = await this.answer(
				`Categories by number (${list}). Enter takes: ${suggested.join(", ") || "none"}. q quits\n> `
			)
			if (answer === undefined) return undefined
			if (answer === "" && suggested.length > 0) return [...suggested]
			const picked = answer.split(/\s+/).map(Number)
			if (
				answer !== "" &&
				picked.every((n) => Number.isInteger(n) && n >= 1 && n <= CATEGORY_SLUGS.length)
			) {
				const set = new Set(picked.map((n) => CATEGORY_SLUGS[n - 1] as CategorySlug))
				return CATEGORY_SLUGS.filter((c) => set.has(c))
			}
			this.out("Use numbers from the list, separated by spaces\n")
		}
	}

	async include(item: IncludeItem): Promise<Step> {
		const k = await this.key(["y", "n", "s", "q"])
		if (k === undefined || k === "q") return "quit"
		if (k === "s") return "skip"
		const brreg = item.sources.find((s) => s.kind === "brreg")?.ref
		const nav = item.sources.find((s) => s.kind === "nav")?.ref
		const sources: CuratedUnit["sources"] = {
			...(brreg === undefined ? {} : { orgNumber: brreg }),
			...(nav === undefined ? {} : { navOfficeId: nav }),
			pages: item.sources.filter((s) => s.kind === "page").map((s) => s.ref),
		}
		if (k === "y") {
			const categories = await this.categories(item.suggestedCategories)
			if (categories === undefined) return "quit"
			const providerType = await this.providerType(item.providerType)
			if (providerType === undefined) return "quit"
			this.addUnit(item.kommune, {
				unitId: item.unitId,
				name: item.unitName,
				include: true,
				sources,
				categories,
				providerType,
				decisions: [],
			})
			return (await this.save(item.kommune, "included")) ? "answered" : "stopped"
		}
		const reason = await this.freeText(
			"Why leave it out? It is public in the repo, so no names. Then Enter (q quits)\n> ",
			item.unitName,
			false
		)
		if (reason === undefined) return "quit"
		const providerType = await this.providerType(item.providerType)
		if (providerType === undefined) return "quit"
		this.addUnit(item.kommune, {
			unitId: item.unitId,
			name: item.unitName,
			include: false,
			excludeReason: reason,
			sources,
			categories: [],
			providerType,
			decisions: [],
		})
		return (await this.save(item.kommune, "left out")) ? "answered" : "stopped"
	}

	// The lookups for a value I typed, once per value: Kartverket for an address, the crawler for a
	// website or chat URL.
	async editContext(item: FieldItem, value: FieldValue): Promise<GateContext> {
		const text = typeof value === "string" ? value : undefined
		const hit =
			item.field === "address" && text !== undefined
				? await this.#io.checks.findAddress(text, item.kommune)
				: undefined
		const status =
			(item.field === "website" || item.field === "chatUrl") && text !== undefined
				? await this.#io.checks.urlStatus(text)
				: undefined
		return {
			allowedHosts: new Set(),
			robotsAllows: () => true,
			licence: () => "ownPage",
			pageText: () => undefined,
			urlStatus: () => status,
			findAddress: () => hit,
			validKommuner: this.#io.checks.validKommuner,
			// The real facts come back in verify, which runs the same gates again on my answer.
			unit: {
				categories: item.categories,
				isKrisesenter: false,
				ownHosts: new Set(),
				...(item.cost === undefined ? {} : { cost: item.cost }),
			},
			peers: [],
		}
	}

	// My typed value as verify will see it: my decision as its evidence, the origin verify used
	// (the strictest, unitPage, when an older lock has none), and the possible names in my own text
	// for the hours name guard.
	editCandidate(item: FieldItem, value: FieldValue, role: string | undefined): Candidate {
		const original = item.evidence.kind === "decision" ? item.evidence.original : item.evidence
		return {
			kommune: item.kommune,
			unitId: item.unitId,
			field: item.field,
			value,
			sourceUrl: item.sourceUrl,
			evidence: { kind: "decision", decidedOn: this.#io.today(), original },
			origin: item.origin ?? "unitPage",
			...(role === undefined ? {} : { role }),
			personNames:
				typeof value === "string"
					? possibleNames(value, { unitName: item.unitName, places: [] })
					: [],
			fetchedAt: "1970-01-01T00:00:00Z",
		}
	}

	// A value I type, checked the way verify will check it. Validity alone first, so a value that is
	// no number is refused before a phone's role is asked; then checkEdit (validity, safety, the
	// hours name guard). A drop refuses on the spot. A validity review (an address Kartverket does
	// not know, a URL that does not answer 200) is one my decision would settle unseen, so it shows
	// me the reason and saves only on keep. Typing the value again checks the new one from the top.
	async edit(item: FieldItem): Promise<{ value: FieldValue; role?: string } | Step> {
		const boolean = BOOLEAN_FIELDS.has(item.field)
		let typed = await this.answer(
			boolean
				? "Your value, ja or nei, then Enter (q quits)\n> "
				: "Your value, then Enter (q quits)\n> "
		)
		for (;;) {
			if (typed === undefined) return "quit"
			const value: FieldValue = boolean ? typed.toLowerCase() === "ja" : typed
			if (typed === "" || (boolean && !["ja", "nei"].includes(typed.toLowerCase()))) {
				this.out("Refused: that is not a value for this field\n")
				return "again"
			}
			const ctx = await this.editContext(item, value)
			const valid = validityGate(this.editCandidate(item, value, undefined), ctx)
			if (!valid.pass) {
				this.out(`Refused: ${valid.gate}: ${valid.reason ?? "failed"}\n`)
				return "again"
			}
			let role: string | undefined
			if (item.field === "phone") {
				const typedRole = await this.freeText(
					"Role label (for example Avdelingsleder), or Enter for none. It is public in the repo, so no names (q quits)\n> ",
					item.unitName,
					true
				)
				if (typedRole === undefined) return "quit"
				role = typedRole === "" ? undefined : typedRole
			}
			const c = this.editCandidate(item, value, role)
			const check = checkEdit(c, ctx)
			if (!check.ok) {
				this.out(`Refused: ${check.reason}\n`)
				return "again"
			}
			const doubt = unsettledValidity(c, ctx)
			if (doubt.pass) return role === undefined ? { value } : { value, role }
			this.out(`Not confirmed: ${doubt.gate}: ${doubt.reason ?? "review"}\n`)
			const confirm = await this.answer(
				"Type keep and Enter to save it anyway, or type it again (q quits)\n> "
			)
			if (confirm === undefined) return "quit"
			if (confirm.toLowerCase() === "keep") return role === undefined ? { value } : { value, role }
			typed = confirm
		}
	}

	async field(item: FieldItem): Promise<Step> {
		const k = await this.key(canAccept(item) ? ["a", "r", "e", "s", "q"] : ["r", "e", "s", "q"])
		if (k === undefined || k === "q") return "quit"
		if (k === "s") return "skip"
		const unit = this.unit(item.kommune, item.unitId)
		if (unit === undefined) return "skip"
		// The question's key is the page's value; for an answer verify could not settle it is the
		// value that answer was keyed by (Task 17's answerKey).
		const key = {
			field: item.field,
			value: item.answerKey ?? item.value,
			sourceUrl: item.sourceUrl,
		}
		const base = { ...key, decidedOn: this.#io.today() }
		let decision: ReviewDecision
		let what: string
		if (k === "e") {
			const edited = await this.edit(item)
			if (typeof edited === "string") return edited
			decision = {
				...base,
				decision: "edit",
				editedValue: edited.value,
				...(edited.role === undefined ? {} : { role: edited.role }),
			}
			what = `edited ${item.field}`
		} else if (k === "a" && key.value !== item.value) {
			// The value shown is my own earlier edit: accepting it keeps that edit.
			decision = {
				...base,
				decision: "edit",
				editedValue: item.value,
				...(item.role === undefined ? {} : { role: item.role }),
			}
			what = `accepted ${item.field}`
		} else {
			decision = { ...base, decision: k === "a" ? "accept" : "reject" }
			what = `${k === "a" ? "accepted" : "rejected"} ${item.field}`
		}
		// One answer per question: verify reads the first answer that matches, so a new one replaces
		// the earlier one instead of sitting behind it.
		const earlier = findDecision(unit.decisions, key)
		unit.decisions = [...unit.decisions.filter((d) => d !== earlier), decision]
		return (await this.save(item.kommune, what)) ? "answered" : "stopped"
	}
}

// The terminal walk-through, one item at a time. Each answer is written to the curated file at
// once, so quitting (q, Ctrl+C, the end of input) loses nothing already answered.
export async function runReview(files: KommuneFiles[], io: ReviewIO): Promise<ReviewOutcome> {
	if (!io.isTTY) {
		io.output.write(
			"review needs an interactive terminal, so it can never answer for me. Run it in PowerShell or Windows Terminal. " +
				"Git Bash's own window is not one to Node: start it there as winpty npm run review -- --data <dir>.\n"
		)
		return { outcome: "refused", answered: 0 }
	}
	const items = buildQueue(files)
	if (items.length === 0) {
		io.output.write("Nothing to review\n")
		return { outcome: "empty", answered: 0 }
	}
	const s = new Session(files, io)
	const left = new Set<string>()
	let answered = 0
	// Only the items I will see count: a field of a unit I skipped, left out or have not included
	// yet is not shown, so "2 of 2" never jumps to "4 of 5".
	const shown = (item: ReviewItem) =>
		item.kind === "include" ||
		(!left.has(`${item.kommune}|${item.unitId}`) &&
			s.unit(item.kommune, item.unitId)?.include === true)
	for (let i = 0; i < items.length; i++) {
		const item = items[i]
		if (item === undefined || !shown(item)) continue
		const visible = items.filter(shown)
		s.out(renderItem(item, visible.indexOf(item) + 1, visible.length, io.color))
		const step = item.kind === "include" ? await s.include(item) : await s.field(item)
		if (step === "quit") {
			s.out("Stopped. Every answer so far is saved.\n")
			return { outcome: "quit", answered }
		}
		if (step === "stopped") return { outcome: "stopped", answered }
		if (step === "again") i--
		if (step === "answered") answered++
		if (item.kind === "include" && step !== "answered") left.add(`${item.kommune}|${item.unitId}`)
	}
	s.out(
		`Done: ${answered} answered. Run git diff on the curated files to check them before I commit.\n`
	)
	return { outcome: "done", answered }
}
