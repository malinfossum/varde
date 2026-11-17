import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
	RULE_PATHS,
	RULES_FINGERPRINT,
	RULES_VERSION,
	ruleGaps,
	rulesFingerprint,
} from "../src/verify/rules.ts"

const ROOT = fileURLToPath(new URL("..", import.meta.url))

function tree(files: Record<string, string>): string {
	const root = mkdtempSync(join(tmpdir(), "varde-rules-"))
	for (const [rel, text] of Object.entries(files)) {
		mkdirSync(dirname(join(root, rel)), { recursive: true })
		writeFileSync(join(root, rel), text)
	}
	return root
}
const sha = (text: string) => `sha256:${createHash("sha256").update(text).digest("hex")}`

const FILES = {
	"src/gates/b.ts": "export const b = 2\r\n",
	"src/gates/a.ts": "export const a = 1\n",
	"src/gates/notes.md": "not code",
	"src/text/deep/x.ts": "export const x = 0\n",
	"src/registers/kartverket.ts": "export const k = 1\n",
	"src/cli/verify.ts": "export const cli = 1\n",
	"src/verify/rules.ts": 'export const RULES_FINGERPRINT = "sha256:x"\n',
}

describe("RULES_VERSION", () => {
	it("moves with the rule files", () => {
		const now = rulesFingerprint(ROOT)
		expect(
			now,
			`rule files changed: bump RULES_VERSION in src/verify/rules.ts and set RULES_FINGERPRINT to ${now}`
		).toBe(RULES_FINGERPRINT)
	})

	it("is a positive whole number, over the rule folders the plan names", () => {
		expect(Number.isInteger(RULES_VERSION) && RULES_VERSION > 0).toBe(true)
		expect(RULE_PATHS).toEqual([
			"src/adapters/",
			"src/answerKey/schema.ts",
			"src/discover/catalogues.ts",
			"src/discover/types.ts",
			"src/extract/cmsBoxes.ts",
			"src/extract/page.ts",
			"src/recall/match.ts",
			"src/registers/",
			"src/schema/",
			"src/sources/",
			"src/xlsx/",
			"src/gates/",
			"src/verify/",
			"src/curate/",
			"src/text/",
			"src/net/allowList.ts",
		])
	})
})

describe("RULE_PATHS", () => {
	it("covers every file verify.ts imports, outside src/net/ and src/io/", () => {
		expect(ruleGaps(ROOT), "add these to RULE_PATHS and bump RULES_VERSION").toEqual([])
	})
})

describe("rulesFingerprint", () => {
	it("hashes each .ts file under the rule paths in sorted order, \\r\\n read as \\n", () => {
		const expected = sha(
			[
				"src/gates/a.ts\nexport const a = 1\n\n",
				"src/gates/b.ts\nexport const b = 2\n\n",
				"src/registers/kartverket.ts\nexport const k = 1\n\n",
				"src/text/deep/x.ts\nexport const x = 0\n\n",
			].join("")
		)
		expect(rulesFingerprint(tree(FILES))).toBe(expected)
	})

	it("leaves out rules.ts itself and every file outside the rule paths", () => {
		const base = rulesFingerprint(tree(FILES))
		expect(
			rulesFingerprint(
				tree({ ...FILES, "src/verify/rules.ts": 'export const RULES_FINGERPRINT = "y"\n' })
			)
		).toBe(base)
		expect(rulesFingerprint(tree({ ...FILES, "src/cli/verify.ts": "endret\n" }))).toBe(base)
		expect(rulesFingerprint(tree({ ...FILES, "src/gates/notes.md": "endret" }))).toBe(base)
	})

	it("changes with a rule file's text or a new rule file, never with its line endings", () => {
		const base = rulesFingerprint(tree(FILES))
		expect(rulesFingerprint(tree({ ...FILES, "src/gates/a.ts": "export const a = 2\n" }))).not.toBe(
			base
		)
		expect(rulesFingerprint(tree({ ...FILES, "src/curate/new.ts": "export {}\n" }))).not.toBe(base)
		expect(rulesFingerprint(tree({ ...FILES, "src/gates/a.ts": "export const a = 1\r\n" }))).toBe(
			base
		)
	})
})
