import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { writeJsonAtomic } from "../src/io/files.ts"
import type { CuratedFile } from "../src/schema/curated.ts"
import type { LockField, LockFile } from "../src/schema/lock.ts"
import { acceptedField, curatedUnit, lockUnit } from "./helpers.ts"

// A phone in review from the unit's contact block, as verify writes it (origin included).
export const reviewField = (over: Partial<LockField> = {}): LockField =>
	acceptedField({
		status: "review",
		origin: "unitContact",
		reason: "agreement: 1 other source(s) disagree",
		gates: acceptedField().gates.map((g) =>
			g.gate === "agreement" ? { ...g, pass: false, onFail: "review" as const, reason: "x" } : g
		),
		...over,
	})
const reviewPhone = reviewField()
export const lockWith = (): LockFile => ({
	kommune: "3405",
	units: [
		lockUnit({ unitId: "org:999999991", fields: { phone: reviewPhone } }),
		lockUnit({
			unitId: "org:999999992",
			fields: {},
			inclusion: {
				status: "review",
				reason: "two or more register units share the page",
				suggestedCategories: ["nodtjenester"],
				providerType: "offentlig",
			},
		}),
	],
})
export const curatedWith = (over: Partial<CuratedFile> = {}): CuratedFile => ({
	kommune: "3405",
	name: "Lillehammer",
	units: [curatedUnit({ unitId: "org:999999991" })],
	...over,
})

export function dataDir(lock = lockWith(), curated = curatedWith()): string {
	const dir = mkdtempSync(join(tmpdir(), "varde-review-"))
	writeJsonAtomic(join(dir, "lock", "3405.json"), lock)
	writeJsonAtomic(join(dir, "curated", "3405-lillehammer.json"), curated)
	return dir
}
