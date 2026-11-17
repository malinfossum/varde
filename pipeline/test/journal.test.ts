import { randomUUID } from "node:crypto"
import { appendFileSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
	fetchUnfinished,
	markRunFinished,
	PageCache,
	readRunId,
	writeRunId,
} from "../src/io/pageCache.ts"
import type { Fetched } from "../src/net/crawler.ts"

const A = "https://www.eksempel.kommune.no/a/"
const B = "https://www.eksempel.kommune.no/b/"
const C = "https://www.eksempel.kommune.no/c/"
const RUN = "run-0001-eksempel"
const NOW = Date.parse("2026-11-13T12:00:00Z")

const page = (
	url: string,
	body = "<main>Eksempel helsestasjon</main>",
	fetchedAt = "2026-11-13T09:00:00Z"
): Fetched => ({
	ok: true,
	url,
	finalUrl: url,
	status: 200,
	contentType: "text/html",
	headers: {},
	body,
	fetchedAt,
})
const tmp = () => mkdtempSync(join(tmpdir(), "varde-journal-"))
const journal = (dir: string) => join(dir, "manifest.jsonl")

describe("the page-cache journal", () => {
	it("knows a page that was put but never saved, after a reload", () => {
		const dir = tmp()
		const entry = new PageCache(dir).put(page(A))
		expect(existsSync(join(dir, "manifest.json"))).toBe(false)
		const reloaded = new PageCache(dir)
		expect(reloaded.get(A)).toEqual(entry)
		expect(reloaded.read(entry)).toBe("<main>Eksempel helsestasjon</main>")
	})

	it("appends one line per page, and keeps page text out of it", () => {
		const dir = tmp()
		const cache = new PageCache(dir)
		cache.put(page(A))
		cache.put(page(B))
		const text = readFileSync(journal(dir), "utf8")
		expect(text.split("\n")).toHaveLength(3)
		expect(text.endsWith("\n")).toBe(true)
		expect(text).not.toContain("Eksempel helsestasjon")
	})

	it("loads without a last line that was cut off, and starts the next line on its own", () => {
		const dir = tmp()
		const first = new PageCache(dir).put(page(A))
		appendFileSync(
			journal(dir),
			'{"url":"https://www.eksempel.kommune.no/b/","finalUrl":"https://www.eks'
		)
		const reloaded = new PageCache(dir)
		expect(reloaded.entries()).toEqual([first])
		const third = reloaded.put(page(C))
		expect(new PageCache(dir).entries()).toEqual([first, third])
	})

	it("skips a line that is JSON but not a manifest entry", () => {
		const dir = tmp()
		const first = new PageCache(dir).put(page(A))
		appendFileSync(journal(dir), '{"url":"https://www.eksempel.kommune.no/b/"}\n')
		expect(new PageCache(dir).entries()).toEqual([first])
	})

	it("folds the journal over the saved manifest, the later line winning per URL", () => {
		const dir = tmp()
		const cache = new PageCache(dir)
		cache.put(page(A))
		const b = cache.put(page(B))
		cache.save()
		const newer = new PageCache(dir).put(page(A, "<main>Ny tekst</main>", "2026-11-13T10:00:00Z"))
		const reloaded = new PageCache(dir)
		expect(reloaded.entries()).toEqual([newer, b])
		expect(reloaded.read(newer)).toBe("<main>Ny tekst</main>")
	})

	it("save() writes the manifest once and empties the journal", () => {
		const dir = tmp()
		const cache = new PageCache(dir)
		const a = cache.put(page(A))
		const b = cache.put(page(B))
		cache.save()
		expect(readFileSync(journal(dir), "utf8")).toBe("")
		expect(JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")).entries).toEqual([a, b])
		expect(new PageCache(dir).entries()).toEqual([a, b])
	})

	it("still refuses a page whose file changed after its line was written", () => {
		const dir = tmp()
		const entry = new PageCache(dir).put(page(A))
		writeFileSync(join(dir, entry.file), "<main>Endret etter journalen</main>")
		const reloaded = new PageCache(dir)
		expect(reloaded.get(A)).toEqual(entry)
		expect(reloaded.read(entry)).toBeUndefined()
	})

	it("purges an old page the journal knows, and keeps the journal file", () => {
		const dir = tmp()
		new PageCache(dir).put(page(A, "<main>Gammel</main>", "2026-07-01T12:00:00Z"))
		const fresh = new PageCache(dir).put(page(B))
		const cache = new PageCache(dir)
		expect(cache.purge(NOW)).toBe(1)
		expect(cache.entries()).toEqual([fresh])
		expect(existsSync(journal(dir))).toBe(true)
		cache.save()
		expect(new PageCache(dir).entries()).toEqual([fresh])
	})

	it("writes no journal in a dry run", () => {
		const dir = join(tmp(), "pages")
		const cache = new PageCache(dir, { dryRun: true, runId: RUN })
		cache.put(page(A))
		cache.save()
		expect(existsSync(dir)).toBe(false)
	})

	it("stamps each entry with the run id, and refuses a malformed one", () => {
		const dir = tmp()
		const entry = new PageCache(dir, { runId: RUN }).put(page(A))
		expect(entry.runId).toBe(RUN)
		expect(new PageCache(dir).get(A)?.runId).toBe(RUN)
		expect(new PageCache(tmp()).put(page(A)).runId).toBeUndefined()
		expect(() => new PageCache(tmp(), { runId: "Kari Nordmann" })).toThrow("run id")
	})
})

describe("run ids", () => {
	it("reads back the id a new run wrote, and nothing from a missing or broken run.json", () => {
		const dir = tmp()
		expect(readRunId(dir)).toBeUndefined()
		writeRunId(dir, RUN)
		expect(readRunId(dir)).toBe(RUN)
		writeFileSync(join(dir, "run.json"), "{ ikke json")
		expect(readRunId(dir)).toBeUndefined()
		writeFileSync(join(dir, "run.json"), JSON.stringify({ runId: "Kari Nordmann" }))
		expect(readRunId(dir)).toBeUndefined()
	})

	it("says a run is unfinished from its start until it is marked finished, with or without a resume", () => {
		const dir = tmp()
		expect(fetchUnfinished(dir)).toBe(false)
		writeRunId(dir, RUN)
		expect(fetchUnfinished(dir)).toBe(true)
		markRunFinished(dir, RUN)
		expect(fetchUnfinished(dir)).toBe(false)
		expect(readRunId(dir)).toBe(RUN)
		// A resume starts the same run again: unfinished until fetchPages returns.
		writeRunId(dir, RUN)
		expect(fetchUnfinished(dir)).toBe(true)
		// A run.json from before the flag, or a broken one, does not say it finished.
		writeFileSync(join(dir, "run.json"), JSON.stringify({ runId: RUN }))
		expect(fetchUnfinished(dir)).toBe(true)
		writeFileSync(join(dir, "run.json"), "{ ikke json")
		expect(fetchUnfinished(dir)).toBe(true)
	})

	it("takes the id randomUUID gives", () => {
		const dir = tmp()
		const id = randomUUID()
		writeRunId(dir, id)
		expect(readRunId(dir)).toBe(id)
		expect(() => writeRunId(dir, "Kari Nordmann")).toThrow("run id")
	})
})
