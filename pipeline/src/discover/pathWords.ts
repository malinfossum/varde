import { foldNorwegian } from "../text/normalise.ts"

// Words in a page path that mark a service Varde lists. A sitemap lists every page on a site
// (Oslo 5,093, Kongsvinger 1,973) and fetch spends at least 5 seconds per page per host, so
// discover keeps only paths with one of these. The recall report shows what the list misses.

// Short words count only as a whole path word: "nav" but not "navn", "rus" but not "russ".
const WHOLE = [
	"nav",
	"rus",
	"bolig",
	"vold",
	"krise",
	"gjeld",
	"ungdom",
	"familie",
	"sosial",
	"sosiale",
	"akutt",
]
// Longer stems also count at the start of a compound: "helsestasjonen", "rustjenester".
const STEMS = [
	"aktivitetshus",
	"barnevern",
	"boligkontor",
	"boligsosial",
	"dagsenter",
	"familiesenter",
	"familievern",
	"flyktning",
	"fontenehus",
	"frisklivs",
	"frivillig",
	"gjeldsradgiv",
	"helsestasjon",
	"krisesenter",
	"kriseteam",
	"lavterskel",
	"legevakt",
	"moteplass",
	"okonomisk",
	"oppfolgingstjeneste",
	"overgrep",
	"psykisk",
	"rusomsorg",
	"ruskonsulent",
	"rustjeneste",
	"sosialtjeneste",
	"ungdomshus",
	"ungdomskontakt",
	"utekontakt",
]
const FILE = /\.(?:pdf|docx?|xlsx?|pptx?|jpe?g|png|gif|zip)$/i

export function looksLikeService(url: string): boolean {
	let path: string
	try {
		path = decodeURIComponent(new URL(url).pathname)
	} catch {
		return false
	}
	if (FILE.test(path)) return false
	const words = foldNorwegian(path)
		.split(/[^a-z0-9]+/)
		.filter((w) => w !== "")
	return words.some((w) => WHOLE.includes(w) || STEMS.some((stem) => w.startsWith(stem)))
}
