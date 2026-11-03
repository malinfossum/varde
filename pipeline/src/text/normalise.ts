// Text helpers shared by the gates and the scorer. Every comparison in the pipeline goes
// through these, so a page and a model answer that differ only in typography still match.

import { getDomain } from "tldts"

const SOFT_HYPHEN = /\u00AD/g
const ODD_SPACES = /[\u00A0\u2007\u2009\u202F]/g
const DASHES = /[\u2010-\u2015\u2212]/g
const SINGLE_QUOTES = /[\u2018\u2019]/g
const DOUBLE_QUOTES = /[\u00AB\u00BB\u201C\u201D]/g

export function normaliseText(text: string): string {
	return text
		.normalize("NFC")
		.replace(SOFT_HYPHEN, "")
		.replace(ODD_SPACES, " ")
		.replace(DASHES, "-")
		.replace(SINGLE_QUOTES, "'")
		.replace(DOUBLE_QUOTES, '"')
		.replace(/\s+/g, " ")
		.trim()
		.toLocaleLowerCase("nb")
}

// Digits only. A country code goes only when it is clearly one: "+47" or "0047".
export function phoneDigits(phone: string): string {
	const digits = phone.replace(/\D/g, "")
	if (digits.length === 12 && digits.startsWith("0047")) return digits.slice(4)
	if (digits.length === 10 && digits.startsWith("47") && phone.trim().startsWith("+")) {
		return digits.slice(2)
	}
	return digits
}

// A number is in a quote when it equals a run of whole digit groups. Times and dates such as
// "08.00" or "27.10.2026" are blanked first, so the hours never glue onto the number. The rest
// is split on spaces, so "62 00 00 00" holds 62000000 but "11 30" never holds 113.
export function quoteHasPhone(quote: string, phone: string): boolean {
	const target = phoneDigits(phone)
	if (target.length === 0) return false
	const withoutTimes = normaliseText(quote).replace(/\d+(?:[.:]\d+)+/g, " ")
	for (const run of withoutTimes.match(/\d+(?: \d+)*/g) ?? []) {
		const groups = run.split(" ")
		for (let start = 0; start < groups.length; start++) {
			let joined = ""
			for (const group of groups.slice(start)) {
				joined += group
				if (joined === target) return true
				if (joined.length >= target.length) break
			}
		}
	}
	return false
}

export function normaliseUrl(url: string): string {
	try {
		const parsed = new URL(url.trim())
		const host = parsed.hostname.replace(/^www\./, "")
		const path = parsed.pathname.replace(/\/+$/, "")
		return `${host}${path}${parsed.search}`.toLowerCase()
	} catch {
		return normaliseText(url)
	}
}

// A link never starts right after "@", a dot, a hyphen or a letter, so the domain of
// "post@hamar.kommune.no" is not read as a link to hamar.kommune.no.
const URL_TOKEN =
	/(?<![\p{L}\p{N}@._-])(?:https?:\/\/)?[a-z0-9æøå-]+(?:\.[a-z0-9æøå-]+)+(?:\/[^\s"'<>()]*)?/gu

export function quoteHasUrl(quote: string, url: string): boolean {
	const target = normaliseUrl(url)
	if (target.length === 0) return false
	for (const token of normaliseText(quote).match(URL_TOKEN) ?? []) {
		const trimmed = token.replace(/[.,;:]+$/, "")
		const withScheme = /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`
		if (normaliseUrl(withScheme) === target) return true
	}
	return false
}

const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u

// The value must stand as a whole in the quote: the character before and after a match may
// not be a letter or digit, so "Storgata 1" is not found inside "Storgata 12". Every
// occurrence is tried, not just the first.
export function quoteHasText(quote: string, value: string): boolean {
	const wanted = normaliseText(value)
	if (wanted.length === 0) return false
	const text = normaliseText(quote)
	for (let at = text.indexOf(wanted); at !== -1; at = text.indexOf(wanted, at + 1)) {
		const before = text.charAt(at - 1)
		const after = text.charAt(at + wanted.length)
		if (!LETTER_OR_DIGIT.test(before) && !LETTER_OR_DIGIT.test(after)) return true
	}
	return false
}

// A URL's host as the gates compare it: lower case, without a leading "www.".
export function siteHost(url: string): string | undefined {
	try {
		return new URL(url).hostname.toLowerCase().replace(/^www\./, "")
	} catch {
		return undefined
	}
}

// The lower-case host of a plain https URL whose host has a registrable domain. Anything
// else (http, a port, user info, an IP address, a bare public suffix) gives undefined.
export function httpsHost(url: string): string | undefined {
	let parsed: URL
	try {
		parsed = new URL(url)
	} catch {
		return undefined
	}
	if (
		parsed.protocol !== "https:" ||
		parsed.port !== "" ||
		parsed.username !== "" ||
		parsed.password !== ""
	) {
		return undefined
	}
	const host = parsed.hostname.toLowerCase()
	return getDomain(host) === null ? undefined : host
}

// A web address the way Brreg writes it ("www.hamar.kommune.no/"), as an https URL. The
// fetcher is HTTPS only, so an http address is tried as https.
export function asHttpsUrl(raw: string): string | undefined {
	const rest = raw.trim().replace(/^https?:\/\//i, "")
	if (rest === "" || /\s/.test(rest)) return undefined
	const url = `https://${rest}`
	return httpsHost(url) === undefined ? undefined : new URL(url).href
}

// Lower case with æ, ø and å spelt the way URLs and Brreg's capitals often spell them.
export function foldNorwegian(text: string): string {
	return text
		.toLowerCase()
		.replace(/æ/g, "ae")
		.replace(/ø/g, "o")
		.replace(/å/g, "a")
		.normalize("NFD")
		.replace(/\p{M}/gu, "")
}
