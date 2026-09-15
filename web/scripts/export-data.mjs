#!/usr/bin/env node
// Pulls everything the site needs out of the API once, at build time, into public/data/.
// The API only ever runs inside the deploy workflow (or on my machine for `npm run data`).
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { kommunerWithPages } from "./slug.mjs"

// If the export sees fewer rows than this, the API is half-broken and the build must fail
// rather than publish an empty site. The live seed has 94 rows; lower this deliberately.
export const MIN_RESOURCES = 90
const LANGS = ["nb", "en"]
const PAGE_SIZE = 100

async function getJson(fetchImpl, url) {
	const response = await fetchImpl(url)
	if (!response.ok) throw new Error(`${response.status} for ${url}`)
	return response.json()
}

async function allResources(fetchImpl, baseUrl, lang) {
	const rows = []
	for (let page = 1; ; page++) {
		const result = await getJson(
			fetchImpl,
			`${baseUrl}/api/resources?lang=${lang}&pageSize=${PAGE_SIZE}&page=${page}`
		)
		rows.push(...result.items)
		if (rows.length >= result.totalCount || result.items.length === 0) return rows
	}
}

export async function exportData({ baseUrl, outDir, fetchImpl = fetch, log = console.log }) {
	const resources = {}
	for (const lang of LANGS) {
		resources[lang] = await allResources(fetchImpl, baseUrl, lang)
		if (resources[lang].length < MIN_RESOURCES) {
			throw new Error(
				`row floor: ${resources[lang].length} ${lang} resources, need ${MIN_RESOURCES}`
			)
		}
	}
	const municipalities = await getJson(fetchImpl, `${baseUrl}/api/municipalities`)
	const categories = {}
	for (const lang of LANGS)
		categories[lang] = await getJson(fetchImpl, `${baseUrl}/api/categories?lang=${lang}`)
	const kommuner = kommunerWithPages(municipalities, resources.nb)

	mkdirSync(outDir, { recursive: true })
	const write = (name, data) => {
		writeFileSync(join(outDir, name), JSON.stringify(data))
		log(`wrote ${name}`)
	}
	for (const lang of LANGS) write(`resources.${lang}.json`, resources[lang])
	write("municipalities.json", municipalities)
	for (const lang of LANGS) write(`categories.${lang}.json`, categories[lang])
	write("kommuner.json", kommuner)

	const summary = {
		resources: { nb: resources.nb.length, en: resources.en.length },
		kommuner: kommuner.length,
	}
	log(
		`resources nb=${summary.resources.nb} en=${summary.resources.en}, kommuner=${summary.kommuner}`
	)
	return summary
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const baseUrl = process.argv[2] ?? "http://localhost:5005"
	const outDir = join(fileURLToPath(new URL("../public/data/", import.meta.url)))
	exportData({ baseUrl, outDir }).catch((error) => {
		console.error(error.message)
		process.exit(1)
	})
}
