import { getDomain } from "tldts"
import type { LicenceStatus } from "../gates/types.ts"
import { REGISTER_SOURCES } from "./registers.ts"

export const HOST_KINDS = ["register", "catalogue", "kommune", "provider"] as const
export type HostKind = (typeof HOST_KINDS)[number]
export type HostEntry = { host: string; kind: HostKind; licence: LicenceStatus }

const register = (name: keyof typeof REGISTER_SOURCES): HostEntry => ({
	host: REGISTER_SOURCES[name].host,
	kind: "register",
	licence: REGISTER_SOURCES[name].licence,
})

// The registers PR 2 reads and the catalogues discover uses as finders. Licences go by exact
// host: frivilligsentral.no is the register, hamar.frivilligsentral.no is a sentral's own site.
// The Aim API (api.aimcms.no) is not fetched until Prokom answers.
export const FIXED_HOSTS: readonly HostEntry[] = [
	register("brreg"),
	register("klass"),
	register("kartverket"),
	// data.ssb.no/robots.txt redirects to www.ssb.no, so the crawler needs that host allowed.
	{ host: "www.ssb.no", kind: "register", licence: "ccBy" },
	register("nav"),
	register("nklm"),
	// NKLM's file link on nklm.norceresearch.no redirects to this host, which serves the xlsx.
	// Exact host, so no other norceresearch.no subdomain is reachable.
	{ host: "www.norceresearch.no", kind: "register", licence: REGISTER_SOURCES.nklm.licence },
	// Finders only, until NKVTS and Norges Frivilligsentraler say yes.
	{ host: "dinutvei.no", kind: "catalogue", licence: "pending" },
	{ host: "frivilligsentral.no", kind: "catalogue", licence: "pending" },
	// Their lists point to their own office and tilbud pages, which are the provider's own.
	{ host: "konfliktraadet.no", kind: "catalogue", licence: "ownPage" },
	{ host: "kirkensbymisjon.no", kind: "catalogue", licence: "ownPage" },
]

// Registrable domains a catalogue or Brreg may link to that are never a provider's own site.
export const NOT_PROVIDER_DOMAINS: readonly string[] = [
	"facebook.com",
	"instagram.com",
	"youtube.com",
	"youtu.be",
	"twitter.com",
	"x.com",
	"linkedin.com",
	"tiktok.com",
	"snapchat.com",
	"vimeo.com",
	"google.com",
	"google.no",
	"goo.gl",
	"bit.ly",
	"apple.com",
	"lovdata.no",
]

// Registrable domains that served malicious scripts or gambling spam when the pilot fetched
// them: likely expired and bought, or hijacked. Brreg still lists them as hjemmeside for units in
// Oslo and Innlandet, so the pipeline never fetches them, lists them as pages or keeps them as a
// unit's website. A bruker must never be sent there from Varde. A whole registrable domain goes,
// subdomains included (hosjakk.no for hedmarksku.hosjakk.no).
export const UNSAFE_DOMAINS: readonly string[] = [
	// Microsoft Defender flagged the cached front pages on 18.11.2026: a tech-support scam
	// (Cryxos), a redirector and a phishing page.
	"amaderjalsha.com",
	"climateact.org",
	"moderne.no",
	// Gambling spam on the cached page: the strong tier of npm run suspect-sites, 18.11.2026.
	"barnasbrobygger.com",
	"chaknews.com",
	"fantasiforbundet.no",
	"gulbygningen.com",
	"hherf.org",
	"hosjakk.no",
	"innlandsbordet.org",
	"klbbn.no",
	"kulturkampen.no",
	"kulturklubben.info",
	"litegjormye.com",
	"oppland-ornitologene.org",
	"oslofilmklubb.no",
	"pechakucha.no",
	"rcassin.no",
	"solviksvenner.no",
	"trysil-knut.org",
	"vibro.no",
	// Indonesian gambling spam on the cached page, found by hand on 18.11.2026: the title names
	// a gambling brand, and suspect-sites gave one a weak sign and the other none.
	"bylan.net",
	"theworlddrum.com",
]

// One unsafe site on a shared platform, where the registrable domain holds everyone else's
// sites too: the exact host goes, with its subdomains, and the rest of blogspot.com stays.
export const UNSAFE_HOSTS: readonly string[] = [
	// Indonesian spam on the cached page, found by hand in the weak tier on 18.11.2026.
	"hamarjazz.blogspot.com",
]

export function isUnsafeHost(host: string): boolean {
	const lower = host.toLowerCase().replace(/\.$/, "")
	return (
		UNSAFE_DOMAINS.includes(getDomain(lower) ?? lower) ||
		UNSAFE_HOSTS.some((unsafe) => lower === unsafe || lower.endsWith(`.${unsafe}`))
	)
}
