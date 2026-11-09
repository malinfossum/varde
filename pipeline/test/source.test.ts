import { describe, expect, it } from "vitest"
import { sourceGate } from "../src/gates/source.ts"
import type { Register } from "../src/schema/common.ts"
import { REGISTER_SOURCES } from "../src/sources/registers.ts"
import { candidate, context, PAGE_URL } from "./helpers.ts"

describe("source gate", () => {
	it("passes an allow-listed HTTPS page with a licence status", () => {
		expect(sourceGate(candidate(), context()).pass).toBe(true)
	})

	it("drops a host off the allow-list", () => {
		const result = sourceGate(candidate({ sourceUrl: "https://example.com/x" }), context())
		expect(result).toMatchObject({ pass: false, onFail: "drop" })
	})

	it("drops plain HTTP", () => {
		const result = sourceGate(candidate({ sourceUrl: "http://www.hamar.kommune.no/x" }), context())
		expect(result).toMatchObject({ pass: false, onFail: "drop" })
	})

	it("drops a URL robots.txt disallows", () => {
		const result = sourceGate(candidate(), context({ robotsAllows: () => false }))
		expect(result).toMatchObject({ pass: false, onFail: "drop" })
	})

	it("drops a host with no licence status recorded", () => {
		const result = sourceGate(candidate(), context({ licence: () => undefined }))
		expect(result).toMatchObject({ pass: false, onFail: "drop" })
	})

	it("drops a value taken from a catalogue that has not said yes", () => {
		const result = sourceGate(candidate({ sourceUrl: "https://dinutvei.no/hjelp/1" }), context())
		expect(result).toMatchObject({ pass: false, onFail: "drop" })
	})
})

const HOSTS = new Set([
	"www.hamar.kommune.no",
	"data.brreg.no",
	"data.ssb.no",
	"api.kartverket.no",
	"nklm.norceresearch.no",
	"www.nav.no",
	"www.krisesenter-eksempel.no",
])

const fromRegister = (register: Register, sourceUrl: string) =>
	candidate({
		sourceUrl,
		origin: "register",
		evidence: { kind: "register", register, recordId: "999999999" },
	})

describe("source gate: register evidence", () => {
	const ctx = context({ allowedHosts: HOSTS })

	it("passes register evidence that comes from its register's own host", () => {
		const brreg = "https://data.brreg.no/enhetsregisteret/api/underenheter/999999999"
		expect(sourceGate(fromRegister("brreg", brreg), ctx).pass).toBe(true)
		const klass = "https://data.ssb.no/api/klass/v1/classifications/131/codesAt?date=2026-11-03"
		expect(sourceGate(fromRegister("klass", klass), ctx).pass).toBe(true)
		const kartverket = "https://api.kartverket.no/adresser/v1/sok?sok=Storgata+1"
		expect(sourceGate(fromRegister("kartverket", kartverket), ctx).pass).toBe(true)
		const nav = "https://www.nav.no/kontor/nav-eksempel"
		expect(sourceGate(fromRegister("nav", nav), ctx).pass).toBe(true)
	})

	it("drops register evidence that comes from any other host", () => {
		expect(sourceGate(fromRegister("brreg", PAGE_URL), ctx)).toMatchObject({
			pass: false,
			onFail: "drop",
		})
	})

	it("drops evidence from a register whose licence is still pending", () => {
		const nklm = fromRegister("nklm", "https://nklm.norceresearch.no/legevakter")
		expect(sourceGate(nklm, ctx)).toMatchObject({ pass: false, onFail: "drop" })
	})

	it("records Kartverket and KLASS as CC BY, Brreg as NLOD", () => {
		expect(REGISTER_SOURCES.kartverket.licence).toBe("ccBy")
		expect(REGISTER_SOURCES.klass.licence).toBe("ccBy")
		expect(REGISTER_SOURCES.brreg.licence).toBe("nlod")
	})
})

describe("source gate: licences and the unit's own host", () => {
	it("passes a page whose licence is CC BY", () => {
		expect(sourceGate(candidate(), context({ licence: () => "ccBy" })).pass).toBe(true)
	})

	it("drops an own-page value from a host that is not the unit's", () => {
		const elsewhere = candidate({
			sourceUrl: "https://www.krisesenter-eksempel.no/kontakt/",
			origin: "unitPage",
		})
		expect(sourceGate(elsewhere, context({ allowedHosts: HOSTS }))).toMatchObject({
			pass: false,
			onFail: "drop",
		})
		const own = context({
			allowedHosts: HOSTS,
			unit: { ...context().unit, ownHosts: new Set(["krisesenter-eksempel.no"]) },
		})
		expect(sourceGate(elsewhere, own).pass).toBe(true)
	})

	it("checks the own host only for own-page origins", () => {
		const article = candidate({
			sourceUrl: "https://www.krisesenter-eksempel.no/nyhet/",
			origin: "article",
		})
		expect(sourceGate(article, context({ allowedHosts: HOSTS })).pass).toBe(true)
	})
})

it("reads my decision's original evidence: a register value still comes from the register's host", () => {
	const reg = { kind: "register", register: "brreg", recordId: "999999999" } as const
	const c = candidate({
		evidence: { kind: "decision", decidedOn: "2026-11-06", original: reg },
		origin: "register",
	})
	expect(sourceGate(c, context())).toMatchObject({ pass: false, onFail: "drop" })
	const atBrreg = {
		...c,
		sourceUrl: "https://data.brreg.no/enhetsregisteret/api/enheter/999999999",
	}
	expect(sourceGate(atBrreg, context()).pass).toBe(true)
})
