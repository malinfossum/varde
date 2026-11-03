// Sites no adapter covers, mapped to the element that holds their main text. Each row was
// checked on the live site before it went in. A rule whose element is gone falls back to
// <main>, marked.
export const SITE_RULES: readonly { host: string; selector: string }[] = [
	// Søndre Land (Optimizely, no <main>), checked 03.11.2026 on its legevakt page.
	{ host: "www.sondre-land.kommune.no", selector: "div.basic-article" },
	// Oslo (no CMS marker), checked 03.11.2026 on the helsestasjon hub and the legevakt page:
	// the h1 and every tel: link sit inside <main>.
	{ host: "www.oslo.kommune.no", selector: "main" },
]
