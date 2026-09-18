import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test } from "vitest"

const CSP =
	"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"

test("_headers carries the spec's policy", () => {
	const text = readFileSync(
		join(dirname(fileURLToPath(import.meta.url)), "../public/_headers"),
		"utf8"
	)
	expect(text).toContain(`Content-Security-Policy: ${CSP}`)
	expect(text).toContain("Referrer-Policy: no-referrer")
	expect(text).toContain("X-Content-Type-Options: nosniff")
	expect(text).toContain("Permissions-Policy: camera=(), microphone=(), geolocation=()")
})
