import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test } from "vitest"

const here = dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(join(here, rel), "utf8")

type Icon = { src: string; sizes: string; type: string; purpose: string }

// The light and dark --ground tokens, in the order tokens.css declares them.
function grounds(): [string, string] {
	const found = [...read("../src/styles/tokens.css").matchAll(/--ground:\s*(#[0-9a-f]{6});/gi)]
	expect(found).toHaveLength(2)
	const [light, dark] = found
	return [light?.[1] ?? "", dark?.[1] ?? ""]
}

test("the manifest is valid JSON that opens Varde standalone at the root", () => {
	const manifest = JSON.parse(read("../public/manifest.webmanifest"))
	expect(manifest).toMatchObject({
		name: "Varde",
		short_name: "Varde",
		lang: "nb",
		start_url: "/",
		scope: "/",
		display: "standalone",
	})
})

test("every icon it names exists, two are any and two are maskable", () => {
	const { icons } = JSON.parse(read("../public/manifest.webmanifest")) as { icons: Icon[] }
	for (const icon of icons) {
		expect(existsSync(join(here, "../public", icon.src.slice(1))), icon.src).toBe(true)
	}
	expect(icons.filter((icon) => icon.purpose === "any")).toHaveLength(2)
	expect(icons.filter((icon) => icon.purpose === "maskable")).toHaveLength(2)
})

test("its colours are the light ground token", () => {
	const manifest = JSON.parse(read("../public/manifest.webmanifest"))
	const [light] = grounds()
	expect(manifest.background_color).toBe(light)
	expect(manifest.theme_color).toBe(light)
})

test("index.html links the manifest, reports the safe area and colours each scheme", () => {
	const html = read("../index.html")
	const [light, dark] = grounds()
	expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest" />')
	expect(html).toContain(
		'<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />'
	)
	expect(html).toContain(
		`<meta name="theme-color" content="${light}" media="(prefers-color-scheme: light)" />`
	)
	expect(html).toContain(
		`<meta name="theme-color" content="${dark}" media="(prefers-color-scheme: dark)" />`
	)
	// Search Console verifies the site by this tag on this line. It must never move.
	expect(html.split("\n")[6]).toContain('name="google-site-verification"')
})
