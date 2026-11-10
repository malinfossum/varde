import { readFileSync, renameSync } from "node:fs"
import { PassThrough } from "node:stream"
import { describe, expect, it } from "vitest"
import { writeCuratedFile } from "../src/curate/write.ts"
import { readKommuneFiles } from "../src/review/queue.ts"
import { namesInMyText, type ReviewIO, runReview } from "../src/review/session.ts"
import type { CuratedFile } from "../src/schema/curated.ts"
import type { LockFile } from "../src/schema/lock.ts"
import { curatedUnit, lockUnit, PAGE_URL } from "./helpers.ts"
import { curatedWith, dataDir, lockWith, reviewField } from "./reviewHelpers.ts"

const checks = {
	findAddress: async () => undefined,
	urlStatus: async () => 200,
	validKommuner: new Set(["3405"]),
}

async function session(keys: string, over: Partial<ReviewIO> = {}, dir = dataDir()) {
	const files = readKommuneFiles(dir)
	const input = new PassThrough()
	const out: string[] = []
	const done = runReview(files, {
		input,
		output: { write: (t: string) => out.push(t) },
		isTTY: true,
		color: false,
		today: () => "2026-11-06",
		checks,
		...over,
	})
	input.end(keys)
	const result = await done
	const curated = JSON.parse(readFileSync(files[0]?.curatedPath ?? "", "utf8")) as CuratedFile
	return { result, text: out.join(""), curated }
}

// One unit, included, with one phone in review.
const onePhone = (phone: Parameters<typeof reviewField>[0]): string =>
	dataDir({
		kommune: "3405",
		units: [lockUnit({ unitId: "org:999999991", fields: { phone: reviewField(phone) } })],
	})

describe("runReview", () => {
	it("says Nothing to review and exits when nothing is open", async () => {
		const answered = curatedWith({
			units: [
				curatedUnit({
					unitId: "org:999999991",
					decisions: [
						{
							field: "phone",
							value: "62 00 00 00",
							sourceUrl: PAGE_URL,
							decision: "accept",
							decidedOn: "2026-11-06",
						},
					],
				}),
				curatedUnit({
					unitId: "org:999999992",
					include: false,
					excludeReason: "Ikke en tjeneste",
					categories: [],
				}),
			],
		})
		const { result, text } = await session("", {}, dataDir(lockWith(), answered))
		expect(result.outcome).toBe("empty")
		expect(text).toContain("Nothing to review")
	})

	it("refuses to start without an interactive terminal, so it can never answer for me", async () => {
		const { result, curated, text } = await session("y\n\na\n", { isTTY: false })
		expect(result.outcome).toBe("refused")
		expect(curated).toEqual(curatedWith())
		expect(text).toContain("winpty")
	})

	it("y with Enter includes the unit with the suggested categories; a accepts the field", async () => {
		const { result, curated } = await session("y\n\na\n")
		expect(result).toEqual({ outcome: "done", answered: 2 })
		expect(curated.units.find((u) => u.unitId === "org:999999992")).toMatchObject({
			include: true,
			categories: ["nodtjenester"],
			providerType: "offentlig",
		})
		expect(curated.units.find((u) => u.unitId === "org:999999991")?.decisions).toEqual([
			{
				field: "phone",
				value: "62 00 00 00",
				sourceUrl: PAGE_URL,
				decision: "accept",
				decidedOn: "2026-11-06",
			},
		])
	})

	it("says what it saved after each answer, in words", async () => {
		const { text } = await session("y\n\na\n")
		expect(text).toContain("Saved: included.")
		expect(text).toContain("Saved: accepted phone.")
	})

	it("y with numbers picks the categories", async () => {
		const { curated } = await session("y\n9 3\ns\n")
		expect(curated.units.find((u) => u.unitId === "org:999999992")?.categories).toEqual([
			"psykisk-helse",
			"nodtjenester",
		])
	})

	it("quits from the category prompt with q, and saves nothing", async () => {
		const { result, curated } = await session("y\nq\n")
		expect(result.outcome).toBe("quit")
		expect(curated).toEqual(curatedWith())
	})

	it("n leaves the unit out with my reason; r rejects the field", async () => {
		const { curated } = await session("n\nIkke en tjeneste\nr\n")
		expect(curated.units.find((u) => u.unitId === "org:999999992")).toMatchObject({
			include: false,
			excludeReason: "Ikke en tjeneste",
		})
		expect(curated.units.find((u) => u.unitId === "org:999999991")?.decisions[0]).toMatchObject({
			decision: "reject",
		})
	})

	it("shows back a reason that may hold a person's name, and keeps it only on keep", async () => {
		const kept = await session("n\nKari Nordmann sluttet\nkeep\ns\n")
		expect(kept.text).toContain(
			"Curated files are public. This may be a person's name: Kari Nordmann"
		)
		expect(kept.curated.units.find((u) => u.unitId === "org:999999992")?.excludeReason).toBe(
			"Kari Nordmann sluttet"
		)
		const retyped = await session("n\nKari Nordmann sluttet\nIkke en tjeneste\ns\n")
		expect(retyped.curated.units.find((u) => u.unitId === "org:999999992")?.excludeReason).toBe(
			"Ikke en tjeneste"
		)
	})

	it("refuses a reason with a hidden character, and asks for it again", async () => {
		const { text, curated } = await session("n\nIkke\u200b en tjeneste\nIkke en tjeneste\ns\n")
		expect(text).toContain("Refused: that text holds a hidden character")
		expect(curated.units.find((u) => u.unitId === "org:999999992")?.excludeReason).toBe(
			"Ikke en tjeneste"
		)
	})

	it("reads a possible name the way the hours guard does: a run, or a word inside a sentence", () => {
		expect(namesInMyText("Ikke en tjeneste", "Eksempel")).toEqual([])
		expect(namesInMyText("Kari Nordmann sluttet", "Eksempel")).toEqual(["Kari Nordmann"])
		expect(namesInMyText("spør etter Kari", "Eksempel")).toEqual(["Kari"])
		expect(namesInMyText("Avdelingsleder", "Eksempel")).toEqual([])
	})

	it("s skips and q quits, and neither saves anything", async () => {
		expect((await session("s\ns\n")).curated).toEqual(curatedWith())
		const quit = await session("q\n")
		expect(quit.result.outcome).toBe("quit")
		expect(quit.curated).toEqual(curatedWith())
	})

	it("numbers only the items it will show: a skipped unit's fields drop out of the count", async () => {
		const base = lockWith()
		const lock: LockFile = {
			...base,
			units: base.units.map((u) =>
				u.unitId === "org:999999992" ? { ...u, fields: { phone: reviewField() } } : u
			),
		}
		const { text } = await session("s\ns\n", {}, dataDir(lock))
		expect(text).toContain("1 of 2")
		expect(text).toContain("2 of 2")
		expect(text).not.toContain("of 3")
	})

	it("saves nothing for a key without Enter", async () => {
		const { result, curated } = await session("y")
		expect(result.outcome).toBe("quit")
		expect(curated).toEqual(curatedWith())
	})

	it("drops a last line that has no Enter, even when it would have been a valid answer", async () => {
		const { result, curated } = await session("y\n\na")
		expect(result).toEqual({ outcome: "quit", answered: 1 })
		expect(curated.units.find((u) => u.unitId === "org:999999991")?.decisions).toEqual([])
	})

	it("quits at once from a sub-prompt with q, even when more answers follow", async () => {
		const { result, curated } = await session("y\nq\n\na\n")
		expect(result.outcome).toBe("quit")
		expect(curated).toEqual(curatedWith())
	})

	it("asks again after a key it does not know", async () => {
		const { text, curated } = await session("x\ns\ns\n")
		expect(text).toContain("Use one of")
		expect(curated).toEqual(curatedWith())
	})

	it("refuses an edit the validity or safety gate fails, says why, and asks the same item again", async () => {
		const { text, curated } = await session("s\ne\nikke et nummer\ne\n62 00 00 09\n\n")
		expect(text).toContain("Refused: validity: not a number in the Nkom plan")
		expect(curated.units.find((u) => u.unitId === "org:999999991")?.decisions).toEqual([
			{
				field: "phone",
				value: "62 00 00 00",
				sourceUrl: PAGE_URL,
				decision: "edit",
				editedValue: "62 00 00 09",
				decidedOn: "2026-11-06",
			},
		])
	})

	it("asks for a role with an edited mobile, and refuses a mobile with none", async () => {
		const { text, curated } = await session("s\ne\n900 00 009\n\ne\n900 00 009\nAvdelingsleder\n")
		expect(text).toContain("Refused: safety")
		expect(curated.units.find((u) => u.unitId === "org:999999991")?.decisions[0]).toMatchObject({
			editedValue: "900 00 009",
			role: "Avdelingsleder",
		})
	})

	it("checks my edit with the origin verify used: a mobile from outside the contact block is refused", async () => {
		const { text, curated } = await session(
			"e\n900 00 009\nAvdelingsleder\nr\n",
			{},
			onePhone({ origin: "unitPage" })
		)
		expect(text).toContain("Refused: safety: a mobile outside the unit's own contact field")
		expect(curated.units[0]?.decisions).toMatchObject([{ decision: "reject" }])
	})

	it("offers no accept for a mobile with no role, only an edit with a role or a reject", async () => {
		const phone = {
			value: "900 00 000",
			evidence: { kind: "quote" as const, quotes: ["900 00 000"] },
			reason: "safety: a mobile on the unit page needs its role label",
		}
		const { text, curated } = await session("a\nr\n", {}, onePhone(phone))
		expect(text).toContain("Use one of: r, e, s, q, then Enter")
		expect(curated.units[0]?.decisions).toMatchObject([{ decision: "reject", value: "900 00 000" }])
	})

	it("replaces my earlier answer that verify could not settle, so verify reads the new one", async () => {
		const decided = {
			kind: "decision" as const,
			decidedOn: "2026-11-05",
			original: { kind: "quote" as const, quotes: ["900 00 000"] },
		}
		const dir = onePhone({
			value: "900 00 000",
			evidence: decided,
			reason: "safety: a mobile on the unit page needs its role label",
		})
		const earlier = {
			field: "phone" as const,
			value: "900 00 000",
			sourceUrl: PAGE_URL,
			decision: "accept" as const,
			decidedOn: "2026-11-05",
		}
		const files = readKommuneFiles(dir)
		await writeCuratedFile(
			files[0]?.curatedPath ?? "",
			curatedWith({ units: [curatedUnit({ unitId: "org:999999991", decisions: [earlier] })] })
		)
		const { curated } = await session("e\n900 00 009\nAvdelingsleder\n", {}, dir)
		expect(curated.units[0]?.decisions).toEqual([
			{
				field: "phone",
				value: "900 00 000",
				sourceUrl: PAGE_URL,
				decision: "edit",
				editedValue: "900 00 009",
				role: "Avdelingsleder",
				decidedOn: "2026-11-06",
			},
		])
	})

	it("stops on Ctrl+C like q, with every earlier answer saved", async () => {
		const controller = new AbortController()
		const files = readKommuneFiles(dataDir())
		const input = new PassThrough()
		const done = runReview(files, {
			input,
			output: { write: () => true },
			isTTY: true,
			color: false,
			today: () => "2026-11-06",
			checks,
			signal: controller.signal,
		})
		input.write("y\n\n")
		await new Promise((r) => setTimeout(r, 20))
		controller.abort()
		expect((await done).outcome).toBe("quit")
		const curated = JSON.parse(readFileSync(files[0]?.curatedPath ?? "", "utf8")) as CuratedFile
		expect(curated.units.some((u) => u.unitId === "org:999999992")).toBe(true)
	})

	it("saves through a rename that fails once, and stops with the temporary file kept when it keeps failing", async () => {
		let calls = 0
		const flaky = (path: string, file: CuratedFile) =>
			writeCuratedFile(path, file, {
				rename: (from, to) => {
					calls++
					if (calls === 1) throw Object.assign(new Error("busy"), { code: "EBUSY" })
					renameSync(from, to)
				},
				sleep: async () => {},
			})
		const once = await session("y\n\ns\n", { save: flaky })
		expect(once.curated.units.some((u) => u.unitId === "org:999999992")).toBe(true)
		const broken = (path: string, file: CuratedFile) =>
			writeCuratedFile(path, file, {
				rename: () => {
					throw Object.assign(new Error("busy"), { code: "EBUSY" })
				},
				sleep: async () => {},
			})
		const stopped = await session("y\n\n", { save: broken })
		expect(stopped.result.outcome).toBe("stopped")
		expect(stopped.text).toContain("kept in")
	})

	it("prints no escape code with colour off, and bold labels with it on", async () => {
		expect((await session("q\n")).text).not.toContain("\u001b")
		expect((await session("q\n", { color: true })).text).toContain("\u001b[1m")
	})

	describe("Lavterskel and address answers", () => {
		const oneField = (
			field: "lowThreshold" | "address",
			over: Parameters<typeof reviewField>[0]
		): string =>
			dataDir({
				kommune: "3405",
				units: [lockUnit({ unitId: "org:999999991", fields: { [field]: reviewField(over) } })],
			})

		it("lets my edit settle a Lavterskel question the rule leaves open", async () => {
			const dir = oneField("lowThreshold", {
				value: false,
				evidence: { kind: "quote", quotes: ["Tilbudet holder til i Storgata."] },
			})
			const { text, curated } = await session("e\nja\n", {}, dir)
			expect(text).not.toContain("Refused")
			expect(curated.units[0]?.decisions).toMatchObject([
				{ field: "lowThreshold", value: false, decision: "edit", editedValue: true },
			])
		})

		it("refuses an edit that contradicts a yes or no the Lavterskel rule gives itself", async () => {
			const dir = oneField("lowThreshold", {
				value: true,
				evidence: { kind: "quote", quotes: ["Tilbudet er gratis, og du trenger ikke henvisning."] },
			})
			const { text, curated } = await session("e\nnei\nr\n", {}, dir)
			expect(text).toContain("Refused: safety: the Lavterskel rule says yes")
			expect(curated.units[0]?.decisions).toMatchObject([{ decision: "reject" }])
		})

		it("keys an address answer by the lock's stored value, never by the text I typed", async () => {
			const stored = "Storgata 1, 2609 Lillehammer"
			const dir = oneField("address", {
				value: stored,
				evidence: { kind: "quote", quotes: ["Besøksadresse: storgata 1, lillehammer"] },
			})
			const hit = { addressId: "a2", kommune: "3405", text: "Storgata 2, 2609 Lillehammer" }
			const { text, curated } = await session(
				"e\nstorgata 2\n",
				{ checks: { ...checks, findAddress: async () => hit } },
				dir
			)
			expect(text).not.toContain("Refused")
			expect(curated.units[0]?.decisions).toEqual([
				{
					field: "address",
					value: stored,
					sourceUrl: PAGE_URL,
					decision: "edit",
					editedValue: "storgata 2",
					decidedOn: "2026-11-06",
				},
			])
		})
	})
})
