import type { LicenceStatus } from "../gates/types.ts"
import type { Register } from "../schema/common.ts"

// Where each register answers, and the terms its data comes under (spec, "Licences"). Nav
// describes its own offices, so its office pages are ownPage. NKLM waits for its licence answer.
export const REGISTER_SOURCES: Readonly<
	Record<Register, { host: string; licence: LicenceStatus }>
> = {
	brreg: { host: "data.brreg.no", licence: "nlod" },
	nav: { host: "www.nav.no", licence: "ownPage" },
	klass: { host: "data.ssb.no", licence: "ccBy" },
	kartverket: { host: "api.kartverket.no", licence: "ccBy" },
	nklm: { host: "nklm.norceresearch.no", licence: "pending" },
}
