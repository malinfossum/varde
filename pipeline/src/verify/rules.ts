import { createHash } from "node:crypto"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

// The version of the rules verify applies. Every lock records it in its inputs, and
// verify --resume re-runs a kommune whose lock holds another one. Bump it with every change to a
// gate, a field rule, the address rule or Kartverket's reader, and set RULES_FINGERPRINT to match:
// test/rules.test.ts fails until the two move together.
export const RULES_VERSION = 1

// rulesFingerprint over this repo's rule files when RULES_VERSION was last set. A hash of source
// code, not of page data.
export const RULES_FINGERPRINT =
	"sha256:215d3c03a76d5c57186d4b85cd5046c66d2a04446b4edab7696b97e65d81402e"

// The code that decides a lock's values: every file verify.ts imports, outside src/net/ and
// src/io/ (ruleGaps checks this). A formatting-only change asks for a bump too: that costs one
// full verify from the local caches, a few minutes.
export const RULE_PATHS: readonly string[] = [
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
]
// This file holds the fingerprint, so a hash that read it could never match it.
const SELF = "src/verify/rules.ts"
const byPath = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

// Every .ts file at or under one rule path, as a path relative to root with "/" between parts.
function tsFiles(root: string, rel: string): string[] {
	const path = join(root, rel)
	if (!existsSync(path)) return []
	if (!statSync(path).isDirectory()) return rel.endsWith(".ts") ? [rel] : []
	const dir = rel.endsWith("/") ? rel : `${rel}/`
	return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
		if (entry.isDirectory()) return tsFiles(root, `${dir}${entry.name}/`)
		return entry.name.endsWith(".ts") ? [`${dir}${entry.name}`] : []
	})
}

// sha256 over the rule files in sorted relative-path order, each as its path, a line break, its
// text with \r\n read as \n, and a line break. A checkout's line endings never change it.
export function rulesFingerprint(root: string): string {
	const files = [...new Set(RULE_PATHS.flatMap((p) => tsFiles(root, p)))]
		.filter((f) => f !== SELF)
		.sort(byPath)
	const hash = createHash("sha256")
	for (const rel of files) {
		const text = readFileSync(join(root, rel), "utf8").replace(/\r\n/g, "\n")
		hash.update(`${rel}\n${text}\n`)
	}
	return `sha256:${hash.digest("hex")}`
}

// The files src/verify/verify.ts reads, followed through their relative imports, that no rule
// path covers, sorted. src/net/ and src/io/ fetch and store and decide no value, so they stay out.
// A file listed here could change a lock's values while verify --resume keeps the old lock.
export function ruleGaps(root: string): string[] {
	const covered = (rel: string) =>
		RULE_PATHS.some((p) => (p.endsWith("/") ? rel.startsWith(p) : rel === p))
	const seen = new Set<string>()
	const todo = ["src/verify/verify.ts"]
	for (let rel = todo.pop(); rel !== undefined; rel = todo.pop()) {
		if (seen.has(rel)) continue
		seen.add(rel)
		const text = readFileSync(join(root, rel), "utf8")
		for (const [, spec] of text.matchAll(/from "(\.{1,2}\/[^"]+\.ts)"/g)) {
			if (spec !== undefined) todo.push(new URL(spec, `file:///${rel}`).pathname.slice(1))
		}
	}
	return [...seen]
		.filter((f) => !f.startsWith("src/net/") && !f.startsWith("src/io/") && !covered(f))
		.sort(byPath)
}
