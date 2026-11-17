import { existsSync, readFileSync } from "node:fs"
import { basename } from "node:path"
import { z } from "zod"
import type { Wrong } from "../answerKey/score.ts"
import { FieldName, NonBlank } from "../schema/common.ts"
import { UnitId } from "../schema/ids.ts"
import type { LockFile } from "../schema/lock.ts"

// How I ruled an accepted value that differs from the answer key (a disagreement) or a sampled
// row outside the key (a sample). keyStale: the live site shows an old value. pipelineWrong: the
// lock is wrong, and known-wrong.json lists it. unclear: not settled yet. right: the lock is right.
export const RULINGS = ["keyStale", "pipelineWrong", "unclear", "right"] as const
const KINDS = ["disagreement", "sample"] as const

type Identity = { kind: (typeof KINDS)[number]; keyId?: number; unitId: string; field: string }

// One disagreement or one sampled field. A disagreement is with a key row, so it names one; a
// sample is outside the key, so it never does.
const identity = (e: Identity) => `${e.kind}|${e.keyId ?? ""}|${e.unitId}|${e.field}`

function keyIdProblems(e: Identity): string[] {
	if (e.kind === "disagreement" && e.keyId === undefined)
		return ["a disagreement needs its key row id"]
	if (e.kind === "sample" && e.keyId !== undefined) return ["a sample has no key row id"]
	return []
}

function repeats<T>(list: readonly T[], key: (e: T) => string): number[] {
	const seen = new Set<string>()
	const at: number[] = []
	for (const [i, e] of list.entries()) {
		if (seen.has(key(e))) at.push(i)
		seen.add(key(e))
	}
	return at
}

export const PilotCheck = z
	.strictObject({
		kind: z.enum(KINDS),
		keyId: z.number().int().positive().optional(),
		unitId: UnitId,
		field: FieldName,
		ruling: z.enum(RULINGS),
		note: NonBlank.max(300),
		by: z.enum(["proposed", "me"]),
	})
	.superRefine((c, ctx) => {
		for (const message of keyIdProblems(c)) ctx.addIssue({ code: "custom", message })
		if (c.kind === "sample" && c.ruling === "keyStale")
			ctx.addIssue({ code: "custom", message: "a sample has no key to be stale" })
	})
export type PilotCheck = z.infer<typeof PilotCheck>

export const PilotChecks = z
	.strictObject({ checks: z.array(PilotCheck) })
	.superRefine((file, ctx) => {
		// A proposal and my ruling may stand side by side. Two from one author may not.
		for (const i of repeats(file.checks, (c) => `${identity(c)}|${c.by}`))
			ctx.addIssue({
				code: "custom",
				path: ["checks", i],
				message: "two checks of one disagreement or sampled field by the same author",
			})
	})
export type PilotChecks = z.infer<typeof PilotChecks>

export const KnownWrongEntry = z
	.strictObject({
		kind: z.enum(KINDS),
		keyId: z.number().int().positive().optional(),
		unitId: UnitId,
		field: FieldName,
	})
	.superRefine((e, ctx) => {
		for (const message of keyIdProblems(e)) ctx.addIssue({ code: "custom", message })
	})
export type KnownWrongEntry = z.infer<typeof KnownWrongEntry>

export const KnownWrong = z
	.strictObject({ entries: z.array(KnownWrongEntry) })
	.superRefine((file, ctx) => {
		for (const i of repeats(file.entries, identity))
			ctx.addIssue({ code: "custom", path: ["entries", i], message: "a value listed twice" })
	})
export type KnownWrong = z.infer<typeof KnownWrong>

// A list file that is missing, broken or off its schema. The message names the file and the
// place in it, never its text: the notes and the values are page text.
export class ChecksFileError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "ChecksFileError"
	}
}

function readChecked<S extends z.ZodType>(path: string, schema: S): z.output<S> {
	const name = basename(path)
	if (!existsSync(path)) throw new ChecksFileError(`${name} is missing`)
	let data: unknown
	try {
		data = JSON.parse(readFileSync(path, "utf8"))
	} catch {
		throw new ChecksFileError(`${name} is not valid JSON`)
	}
	const parsed = schema.safeParse(data)
	if (!parsed.success) {
		// An unknown key's message would quote the key, which is text from the file.
		const where = parsed.error.issues
			.map(
				(i) =>
					`${i.path.join(".")}: ${i.code === "unrecognized_keys" ? "an unknown key" : i.message}`
			)
			.join("; ")
		throw new ChecksFileError(`${name} does not match its schema (${where})`)
	}
	return parsed.data
}

export function readPilotChecks(path: string): PilotChecks {
	return readChecked(path, PilotChecks)
}

export function readKnownWrong(path: string): KnownWrong {
	return readChecked(path, KnownWrong)
}

// The golden test's ratchet over disagreements: a wrong value the list lacks, and a listed one
// that no longer occurs, both by key row, unit and field. Sample entries have no key row;
// goneSamples checks them.
export function ratchet(
	wrong: readonly Wrong[],
	known: KnownWrong
): { unlisted: Wrong[]; gone: KnownWrongEntry[] } {
	const at = (keyId: number | undefined, unitId: string, field: string) =>
		`${keyId ?? ""}|${unitId}|${field}`
	const listed = known.entries.filter((e) => e.kind === "disagreement")
	const listedAt = new Set(listed.map((e) => at(e.keyId, e.unitId, e.field)))
	const wrongAt = new Set(wrong.map((w) => at(w.keyId, w.unitId, w.field)))
	return {
		unlisted: wrong.filter((w) => !listedAt.has(at(w.keyId, w.unitId, w.field))),
		gone: listed.filter((e) => !wrongAt.has(at(e.keyId, e.unitId, e.field))),
	}
}

// A listed sample is gone when no committed lock still holds that unit's field as accepted.
export function goneSamples(known: KnownWrong, locks: readonly LockFile[]): KnownWrongEntry[] {
	return known.entries.filter(
		(e) =>
			e.kind === "sample" &&
			!locks.some((l) =>
				l.units.some((u) => u.unitId === e.unitId && u.fields[e.field]?.status === "accepted")
			)
	)
}

const label = (e: Identity) =>
	e.kind === "disagreement"
		? `disagreement with key row ${e.keyId}, unit ${e.unitId}, field ${e.field}`
		: `sample, unit ${e.unitId}, field ${e.field}`

// The two lists agree: every pipeline wrong ruling of mine is on known-wrong.json, and every entry
// there has one. A proposal does not count until I make it mine.
export function checksAgree(checks: PilotChecks, known: KnownWrong): string[] {
	const mine = checks.checks.filter((c) => c.ruling === "pipelineWrong" && c.by === "me")
	const ruled = new Set(mine.map(identity))
	const listed = new Set(known.entries.map(identity))
	return [
		...mine
			.filter((c) => !listed.has(identity(c)))
			.map(
				(c) =>
					`pilot-checks.json rules ${label(c)} pipeline wrong, and known-wrong.json does not list it`
			),
		...known.entries
			.filter((e) => !ruled.has(identity(e)))
			.map(
				(e) =>
					`known-wrong.json lists ${label(e)}, and pilot-checks.json has no pipeline wrong ruling of mine for it`
			),
	]
}

// A disagreement I ruled key stale or right: the key is the wrong side, so the golden test lets the
// value pass until the next key freeze. A proposal or an unclear ruling never does.
export function keyIsWrong(checks: PilotChecks, w: Wrong): boolean {
	return checks.checks.some(
		(c) =>
			c.by === "me" &&
			c.kind === "disagreement" &&
			(c.ruling === "keyStale" || c.ruling === "right") &&
			c.keyId === w.keyId &&
			c.unitId === w.unitId &&
			c.field === w.field
	)
}
