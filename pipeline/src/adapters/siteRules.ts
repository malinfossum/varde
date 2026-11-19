import { isNavOfficeUrl } from "../registers/nav.ts"

// Sites no adapter covers, mapped to the element that holds their main text. Each row was
// checked on the live site before it went in. A rule whose element is gone falls back to
// <main>, marked. A row with "only" covers just the pages that test accepts; the host's other
// pages are read as if it had no rule.
export const SITE_RULES: readonly {
	host: string
	selector: string
	only?: (url: string) => boolean
}[] = [
	// Søndre Land (Optimizely, no <main>), checked 03.11.2026 on its legevakt page.
	{ host: "www.sondre-land.kommune.no", selector: "div.basic-article" },
	// Oslo (no CMS marker), checked 03.11.2026 on the helsestasjon hub and the legevakt page:
	// the h1 and every tel: link sit inside <main>.
	{ host: "www.oslo.kommune.no", selector: "main" },
	// Nav (Next.js, no <main>), checked 19.11.2026 on the 260 office pages fetched 18.11.2026:
	// each has one div with role main and the office's h1 inside it. Office pages only: no other
	// nav.no page was checked.
	{ host: "www.nav.no", selector: "[role='main']", only: isNavOfficeUrl },
]
