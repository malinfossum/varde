// IndexNow (spec 2026-11-06): after a deploy, tell Bing and the other IndexNow engines which
// pages are new, changed or gone. Run as `node scripts/indexnow.mjs <live.json> <next.json>`
// with SITE_ORIGIN set. It never fails a deploy: every path ends with exit code 0, and a ping
// that does not land leaves a ::warning:: annotation on the run instead. No shebang, for the
// same Vitest reason prerender.mjs gives.
import { readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

export const ENDPOINT = "https://api.indexnow.org/indexnow"
export const BATCH = 10_000
const KEY_FILE = /^([a-f0-9]{32})\.txt$/

// The key lives only in its file name and content (public/<key>.txt), so the two cannot drift.
export function findKey(publicDir) {
	const keys = readdirSync(publicDir)
		.map((name) => KEY_FILE.exec(name)?.[1])
		.filter(Boolean)
	if (keys.length !== 1) throw new Error(`expected one key file, found ${keys.length}`)
	return keys[0]
}

// A missing, empty or malformed manifest counts as empty: the first run sends every page.
export function readManifest(path) {
	try {
		const value = JSON.parse(readFileSync(path, "utf8"))
		return value && typeof value === "object" && !Array.isArray(value) ? value : {}
	} catch {
		return {}
	}
}

// Only a site path survives: one leading slash, no backslash (URL parsers read "\" as "/", so
// "/\host" is a protocol-relative form in disguise), and the resolved URL keeps the site's origin.
function toUrl(path, origin) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return null
	try {
		const url = new URL(path, origin)
		return url.origin === new URL(origin).origin ? url.href : null
	} catch {
		return null
	}
}

export function changedUrls(live, next, origin) {
	const paths = new Set()
	for (const [path, hash] of Object.entries(next))
		if (!Object.hasOwn(live, path) || live[path] !== hash) paths.add(path)
	for (const path of Object.keys(live)) if (!Object.hasOwn(next, path)) paths.add(path)
	return [...paths]
		.map((path) => toUrl(path, origin))
		.filter(Boolean)
		.sort()
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function ping({
	urls,
	origin,
	key,
	fetchImpl = fetch,
	log = console.log,
	wait = sleep,
}) {
	if (urls.length === 0) {
		log("IndexNow: 0 changed URLs, nothing sent")
		return
	}
	const host = new URL(origin).host
	for (let i = 0; i < urls.length; i += BATCH) {
		const urlList = urls.slice(i, i + BATCH)
		const send = async () => {
			try {
				const response = await fetchImpl(ENDPOINT, {
					method: "POST",
					headers: { "Content-Type": "application/json; charset=utf-8" },
					body: JSON.stringify({ host, key, urlList }),
					signal: AbortSignal.timeout(30_000),
				})
				return response.status
			} catch {
				return 0
			}
		}
		let status = await send()
		if (status === 0 || status >= 500) {
			await wait(10_000)
			status = await send()
		}
		const shown = status === 0 ? "network error" : status
		log(`IndexNow: ${urlList.length} URLs, status ${shown}`)
		if (status !== 200 && status !== 202)
			log(
				`::warning::IndexNow ping got ${shown} for ${urlList.length} URLs; the sitemap still lists them`
			)
	}
}

export async function main({
	argv,
	env,
	fetchImpl = fetch,
	log = console.log,
	wait = sleep,
	publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public"),
}) {
	try {
		const origin = (env.SITE_ORIGIN ?? "").replace(/\/$/, "")
		const [livePath = "", nextPath = ""] = argv
		const next = readManifest(nextPath)
		if (!origin || Object.keys(next).length === 0) {
			log("::warning::IndexNow skipped: no SITE_ORIGIN or no new manifest")
			return
		}
		const key = findKey(publicDir)
		const urls = changedUrls(readManifest(livePath), next, origin)
		await ping({ urls, origin, key, fetchImpl, log, wait })
	} catch (error) {
		log(`::warning::IndexNow failed: ${error instanceof Error ? error.message : "unknown error"}`)
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await main({ argv: process.argv.slice(2), env: process.env })
	process.exitCode = 0
}
