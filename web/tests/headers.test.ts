import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test } from "vitest"

const here = dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(join(here, rel), "utf8")

// react-aria's usePress injects one <style id="react-aria-pressable-style"> at first press —
// the only inline style anything on the site adds — so style-src carries its hash instead of
// 'unsafe-inline'. Nonces are impossible on a static host.
const PRESSABLE_STYLE_HASH = "'sha256-38RhXrc7EdReTKsOm23ZPOCUgniTUUcjky8QOOrQx6o='"

const CSP = `default-src 'self'; script-src 'self'; style-src 'self' ${PRESSABLE_STYLE_HASH}; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`

test("_headers carries the spec's policy", () => {
	const text = read("../public/_headers")
	expect(text).toContain(`Content-Security-Policy: ${CSP}`)
	expect(text).toContain("Referrer-Policy: no-referrer")
	expect(text).toContain("X-Content-Type-Options: nosniff")
	expect(text).toContain("Permissions-Policy: camera=(), microphone=(), geolocation=()")
})

// Drift guard: rebuild the injected CSS from the installed react-aria source and hash it. A
// react-aria upgrade that changes the snippet turns this red before the CSP silently blocks
// the style in production (a blocked style-src reports nothing — there is no report-uri).
test("the style-src hash matches what the installed react-aria injects", () => {
	const source = read("../node_modules/react-aria/dist/private/interactions/usePress.mjs")
	const attribute = source.match(/PRESSABLE_ATTRIBUTE = '([^']+)'/)?.[1]
	const template = source.match(/style\.textContent = `([\s\S]*?)`\.trim\(\)/)?.[1]
	expect(attribute).toBe("data-react-aria-pressable")
	expect(template).toBeDefined()
	const css = (template as string).replace(/\$\{[^}]+\}/g, attribute as string).trim()
	const hash = `'sha256-${createHash("sha256").update(css).digest("base64")}'`
	expect(hash).toBe(PRESSABLE_STYLE_HASH)
})
