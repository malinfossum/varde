import { phoneDigits } from "../text/normalise.ts"
import { lavterskel } from "./lavterskel.ts"
import { drop, type Gate, pass, review } from "./types.ts"

export function isMobile(phone: string): boolean {
	return /^[49]\d{7}$/.test(phoneDigits(phone))
}

// An email is kept only when its local part names a service. Anything else may be a
// person's own address.
const SERVICE_WORDS = [
	"post",
	"kontakt",
	"info",
	"sentralbord",
	"service",
	"kundesenter",
	"ekspedisjon",
	"resepsjon",
	"mottak",
	"legevakt",
	"barnevern",
	"helsestasjon",
	"frivillig",
	"krisesenter",
	"familievern",
	"ungdom",
	"booking",
	"timebestilling",
	"kommune",
	"sekretariat",
	"kontor",
	"senter",
	"tjeneste",
]

export function emailNamesAService(email: string): boolean {
	const local = email.toLowerCase().split("@")[0] ?? ""
	return local.split(/[.\-_+]/).some((token) => SERVICE_WORDS.some((w) => token.includes(w)))
}

export const ACCOUNT_NUMBER = /\b\d{4}[ .]?\d{2}[ .]?\d{5}\b/
const INSTRUCTION =
	/\b(?:ignore|ignorer|instructions?|instruksjon(?:er)?|system prompt|assistant|you are an ai|du er en ki)\b/i

// Gate 5: person data out, krisesenter addresses to me, and the Lavterskel badge by rule.
export const safetyGate: Gate = (c, ctx) => {
	const quotes = c.evidence.kind === "quote" ? c.evidence.quotes : []
	const texts = typeof c.value === "string" ? [c.value, ...quotes] : quotes
	if (c.origin === "jsonLdAuthor") return drop("safety", "a JSON-LD author is a person")
	if (ctx.unit.orgForm === "ENK") return drop("safety", "a sole proprietorship (ENK)")
	if (texts.some((t) => ACCOUNT_NUMBER.test(t))) return drop("safety", "holds an account number")
	if (quotes.some((q) => INSTRUCTION.test(q))) {
		return review("safety", "a quote reads like an instruction to a model")
	}
	switch (c.field) {
		case "phone":
			if (typeof c.value !== "string" || !isMobile(c.value)) return pass("safety")
			if (c.origin !== "unitContact") {
				return drop("safety", "a mobile outside the unit's own contact field")
			}
			return c.role === undefined
				? review("safety", "a mobile on the unit page needs its role label")
				: pass("safety", "a mobile the kommune publishes as the unit's contact")
		case "email":
			return typeof c.value === "string" && emailNamesAService(c.value)
				? pass("safety")
				: drop("safety", "the email may be a person's own")
		case "address":
			// A centre may keep its address off its own site on purpose; brreg still lists it.
			// So only the centre's own page decides whether Varde shows it.
			if (!ctx.unit.isKrisesenter) return pass("safety")
			return c.origin === "unitContact" || c.origin === "unitPage"
				? pass("safety", "a krisesenter address the centre publishes itself")
				: drop("safety", "a krisesenter address not from the centre's own page")
		case "lowThreshold": {
			const rule = lavterskel(quotes, ctx.unit.cost)
			if (rule.outcome === "review") return review("safety", rule.reason)
			if ((rule.outcome === "yes") !== c.value) {
				return review("safety", `the Lavterskel rule says ${rule.outcome}: ${rule.reason}`)
			}
			return pass("safety", rule.reason)
		}
		default:
			return pass("safety")
	}
}
