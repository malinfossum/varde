// robots.txt as RFC 9309 reads it, plus the lines it leaves out that Varde honours anyway:
// Crawl-delay, Visit-time and Sitemap.

export type VisitWindow = { from: number; to: number }

export type Robots = {
	allows(pathAndQuery: string): boolean
	crawlDelayMs?: number
	visitTime?: VisitWindow
	sitemaps: readonly string[]
	notes: readonly string[]
}

const AGENT = "vardebot"
// RFC 9309 asks crawlers to read at least 500 KiB.
const MAX_PARSE = 500 * 1024
const MINUTES_PER_DAY = 1440

type Rule = { allow: boolean; length: number; pattern: string }
type Group = { agents: string[]; rules: Rule[]; crawlDelayMs?: number; visitTime?: VisitWindow }

function rule(allow: boolean, pattern: string): Rule {
	const encoded = pattern.replace(/[^\x21-\x7e]/g, (ch) => encodeURIComponent(ch))
	return { allow, length: encoded.length, pattern: encoded }
}

// RFC 9309 matching: "*" is any run of characters, a final "$" anchors the end, and anything
// else is a prefix match. No regular expression: a robots.txt full of "*" cannot make one
// take exponential time. Two pointers that step back to the last "*" on a mismatch take at
// most pattern length times path length steps.
export function robotsMatch(pattern: string, path: string): boolean {
	const anchored = pattern.endsWith("$")
	const p = anchored ? pattern.slice(0, -1) : pattern
	let i = 0
	let j = 0
	let star = -1
	let mark = 0
	while (j < path.length) {
		if (i < p.length && p[i] === "*") {
			star = i
			i++
			mark = j
		} else if (i < p.length && p[i] === path[j]) {
			i++
			j++
		} else if (i === p.length && !anchored) {
			return true
		} else if (star >= 0) {
			i = star + 1
			mark++
			j = mark
		} else {
			return false
		}
	}
	while (i < p.length && p[i] === "*") i++
	return i === p.length
}

// The longest matching pattern wins, and Allow wins a tie. robots.txt itself is always allowed.
function allowed(rules: readonly Rule[], pathAndQuery: string): boolean {
	if (pathAndQuery === "/robots.txt") return true
	let best: Rule | undefined
	for (const r of rules) {
		if (!robotsMatch(r.pattern, pathAndQuery)) continue
		if (best === undefined || r.length > best.length || (r.length === best.length && r.allow)) {
			best = r
		}
	}
	return best?.allow ?? true
}

const VISIT =
	/^(\d{2}):?(\d{2})\s*-\s*(\d{2}):?(\d{2})(?:\s*(?:UTC|GMT)\s*(?:([+-])(\d{1,2})(?::?(\d{2}))?)?)?$/i

// "0200-0500 UTC+1" is 01:00 to 04:00 UTC. A time without an offset is UTC.
export function parseVisitTime(value: string): VisitWindow | undefined {
	const match = VISIT.exec(value.trim())
	if (match === null) return undefined
	const [, h1 = "", m1 = "", h2 = "", m2 = "", sign, offsetH = "0", offsetM = "0"] = match
	if ([h1, h2].some((h) => Number(h) > 23) || [m1, m2].some((m) => Number(m) > 59)) {
		return undefined
	}
	const offset =
		sign === undefined ? 0 : (sign === "-" ? -1 : 1) * (Number(offsetH) * 60 + Number(offsetM))
	const wrap = (minutes: number) =>
		((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
	return {
		from: wrap(Number(h1) * 60 + Number(m1) - offset),
		to: wrap(Number(h2) * 60 + Number(m2) - offset),
	}
}

export function inVisitWindow(nowMs: number, window: VisitWindow): boolean {
	const now = new Date(nowMs)
	const minute = now.getUTCHours() * 60 + now.getUTCMinutes()
	return window.from <= window.to
		? minute >= window.from && minute < window.to
		: minute >= window.from || minute < window.to
}

const strictest = (groups: readonly Group[]) =>
	groups.reduce<number | undefined>(
		(max, g) => (g.crawlDelayMs === undefined ? max : Math.max(max ?? 0, g.crawlDelayMs)),
		undefined
	)

export function parseRobots(text: string): Robots {
	const groups: Group[] = []
	const sitemaps: string[] = []
	const notes: string[] = []
	let current: Group | undefined
	let inAgentLines = false
	for (const raw of text.slice(0, MAX_PARSE).split(/\r\n|\r|\n/)) {
		const line = raw.replace(/#.*$/, "").trim()
		const colon = line.indexOf(":")
		if (colon < 0) continue
		const key = line.slice(0, colon).trim().toLowerCase()
		const value = line.slice(colon + 1).trim()
		if (key === "user-agent") {
			if (!inAgentLines || current === undefined) {
				current = { agents: [], rules: [] }
				groups.push(current)
			}
			current.agents.push(value.toLowerCase())
			inAgentLines = true
			continue
		}
		inAgentLines = false
		if (key === "sitemap") {
			if (/^https?:\/\//i.test(value)) sitemaps.push(value)
			continue
		}
		if (current === undefined) continue
		if (key === "allow" || key === "disallow") {
			if (value !== "") current.rules.push(rule(key === "allow", value))
		} else if (key === "crawl-delay") {
			const seconds = Number(value)
			if (value !== "" && Number.isFinite(seconds) && seconds >= 0) {
				current.crawlDelayMs = Math.max(current.crawlDelayMs ?? 0, seconds * 1000)
			} else {
				notes.push("unreadable Crawl-delay")
			}
		} else if (key === "visit-time") {
			const window = parseVisitTime(value)
			if (window === undefined) notes.push("unreadable Visit-time")
			else current.visitTime ??= window
		}
	}
	// VardeBot's own group, else the one for everyone. A Crawl-delay or Visit-time that only
	// another bot's group states still applies when the applying group states none.
	const mine = groups.filter((g) => g.agents.some((a) => a.split("/")[0]?.trim() === AGENT))
	const applying = mine.length > 0 ? mine : groups.filter((g) => g.agents.includes("*"))
	const rules = applying.flatMap((g) => g.rules)
	const robots: Robots = { allows: (path) => allowed(rules, path), sitemaps, notes }
	const delay = strictest(applying) ?? strictest(groups)
	if (delay !== undefined) robots.crawlDelayMs = delay
	const visit =
		applying.find((g) => g.visitTime)?.visitTime ?? groups.find((g) => g.visitTime)?.visitTime
	if (visit !== undefined) robots.visitTime = visit
	return robots
}

export const ALLOW_ALL: Robots = { allows: () => true, sitemaps: [], notes: [] }

export const DISALLOW_ALL: Robots = {
	allows: (path) => path === "/robots.txt",
	sitemaps: [],
	notes: ["robots.txt could not be read: the host stays out"],
}

// RFC 9309: a 4xx means there are no rules; a 5xx or no answer means keep out.
export function robotsFromResponse(status: number, body: string): Robots {
	if (status >= 200 && status < 300) return parseRobots(body)
	if (status >= 400 && status < 500) return ALLOW_ALL
	return DISALLOW_ALL
}
