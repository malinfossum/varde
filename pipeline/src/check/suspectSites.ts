import { load } from "cheerio/slim"
import { getDomain } from "tldts"
import { foldNorwegian, httpsHost, normaliseText } from "../text/normalise.ts"

// One strong sign: a page selling gambling, the way most hijacked Norwegian domains end up. The
// weak signs are common on sites that are fine: Brreg often lists an umbrella body's site for a
// local branch (dfs.no for every skytterlag), an old domain may redirect to the new one, and an
// association for a diaspora writes in its own language (Kurdish, Bulgarian).
export const SUSPECT_REASONS = ["spam", "foreignLanguage", "leftDomain", "namesNeither"] as const
export const STRONG_REASONS: readonly SuspectReason[] = ["spam"]
export type SuspectReason = (typeof SUSPECT_REASONS)[number]

// Words a legal name shares with many sites that are not the unit's own.
const GENERIC = new Set([
	"norge",
	"norges",
	"norsk",
	"norske",
	"norway",
	"oslo",
	"forening",
	"foreningen",
	"avdeling",
	"stiftelsen",
	"stiftelse",
	"senter",
	"senteret",
	"klubb",
	"klubben",
	"kommune",
	"kommunes",
	"international",
	"norwegian",
])

// Languages a Norwegian service writes its site in, by the html element's lang attribute.
const EXPECTED_LANGUAGES = new Set(["no", "nb", "nn", "en", "se", "sv", "da"])

// Words of the gambling spam that fills most hijacked domains, matched as whole words. One hit
// is not enough: a museum page or a scout group may use one of them once.
const SPAM =
	/\b(casino|slot|gacor|judi|togel|toto|sbobet|nettcasino|bettingsider|betting|poker online)\b/gi

const SPAM_HITS = 3

const fold = (text: string) => foldNorwegian(normaliseText(text))

// The words of a legal name that point at this unit: four letters or more, not generic.
const distinctWords = (name: string) =>
	fold(name)
		.split(/[^a-z0-9]+/)
		.filter((w) => w.length >= 4 && !GENERIC.has(w))

const domainOf = (url: string): string | undefined => {
	const host = httpsHost(url)
	return host === undefined ? undefined : (getDomain(host) ?? host)
}

// Whether a unit's Brreg website still looks like the unit's own. A domain that changed hands
// (expired and bought, or hijacked) shows one of two signs: the page ends up on another
// registrable domain, or nothing on it names the unit or its org number. Brreg keeps the old
// hjemmeside for years, so these are the sites to look at before UNSAFE_DOMAINS grows.
// A sign is not proof: a site may use a brand name that shares no word with the legal one.
export function suspectReason(
	unit: { name: string; orgNumber: string; website: string },
	page: { finalUrl: string; html: string }
): SuspectReason | undefined {
	const $ = load(page.html)
	$("script, style, noscript, template").remove()
	// Text nodes joined with a space: text() glues "<h1>Forening</h1><p>casino" into one word.
	const text = $.root()
		.find("*")
		.addBack()
		.contents()
		.toArray()
		.flatMap((n) => (n.type === "text" && "data" in n ? [n.data] : []))
		.join(" ")
		.replace(/\s+/g, " ")
		.trim()
	if ((text.match(SPAM)?.length ?? 0) >= SPAM_HITS) return "spam"
	const from = domainOf(unit.website)
	const to = domainOf(page.finalUrl)
	if (from !== undefined && to !== undefined && from !== to) return "leftDomain"
	if (text.replace(/\D/g, "").includes(unit.orgNumber)) return undefined
	// One distinctive word is enough: Brreg's legal name is often longer than the name a site
	// uses ("ADHD NORGE OSLO OG AKERSHUS"), and a hijacked page shares no word with it. A part of
	// a longer word counts too, so "adhd" is found in "ADHD-foreningen".
	const words = distinctWords(unit.name)
	if (words.length === 0) return undefined
	const folded = fold(text)
	if (words.some((w) => folded.includes(w))) return undefined
	const lang = ($("html").attr("lang") ?? "").trim().slice(0, 2).toLowerCase()
	return lang !== "" && !EXPECTED_LANGUAGES.has(lang) ? "foreignLanguage" : "namesNeither"
}
