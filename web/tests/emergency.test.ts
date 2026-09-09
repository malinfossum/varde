import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test } from "vitest"
import { emergencyLines, telHref } from "../src/services/emergency.ts"

// jsdom replaces the global URL constructor, and on Windows that replacement mis-resolves a
// relative path against a file:// base, so I go through node:path/node:url instead of
// `new URL("../../api/Varde.Data/Seed/SeedData.cs", import.meta.url)` (same fix as
// tokens.test.ts/fonts.test.ts).
const seedPath = join(
	dirname(fileURLToPath(import.meta.url)),
	"../../api/Varde.Data/Seed/SeedData.cs"
)
const seed = readFileSync(seedPath, "utf8")

function seededPhone(id: number): string {
	// The block for one resource runs from its `Id = N,` to the next `new Resource`.
	const start = seed.indexOf(`Id = ${id},`)
	expect(start, `seed row ${id} missing`).toBeGreaterThan(-1)
	const end = seed.indexOf("new Resource", start)
	const block = seed.slice(start, end === -1 ? undefined : end)
	const phone = /Phone = "([^"]+)"/.exec(block)?.[1]
	expect(phone, `seed row ${id} has no Phone`).toBeDefined()
	return phone as string
}

test("strip order is 110, 112, 113, 116 117 and each number equals its seed row", () => {
	expect(emergencyLines.map((l) => l.id)).toEqual(["brann", "politi", "ambulanse", "legevakt"])
	for (const line of emergencyLines) {
		expect(line.phone).toBe(seededPhone(line.seedId))
		expect(line.source).toMatch(/^https:\/\//)
		expect(line.verified).toMatch(/^\d{4}-\d{2}-\d{2}$/)
	}
})

test("telHref strips spaces only", () => {
	expect(telHref("116 117")).toBe("tel:116117")
	expect(telHref("110")).toBe("tel:110")
})
