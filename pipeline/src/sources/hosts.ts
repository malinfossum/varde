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
// NKLM and the Aim API (api.aimcms.no) are not fetched until their owners answer.
export const FIXED_HOSTS: readonly HostEntry[] = [
	register("brreg"),
	register("klass"),
	register("kartverket"),
	// data.ssb.no/robots.txt redirects to www.ssb.no, so the crawler needs that host allowed.
	{ host: "www.ssb.no", kind: "register", licence: "ccBy" },
	register("nav"),
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
