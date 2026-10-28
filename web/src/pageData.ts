import { createContext, useContext } from "react"
import { useLanguage } from "./i18n/LanguageProvider.tsx"
import type { KommuneEntry } from "./services/data.ts"
import type { Family } from "./services/family.ts"
import type { HelplineGroup } from "./services/helplines.ts"
import type { Lang } from "./services/urlState.ts"
import type { ResourceDto } from "./types/api.ts"

// What the prerender baked into this page. The browser reads it from the #varde-data block
// (services/data.ts readPageData) so a direct load fetches nothing.
export type PageData = {
	// The language of the URL that was loaded. Page data belongs to that URL only: after a
	// client-side switch to the other language its rows are the wrong language (issue #79).
	lang?: Lang
	resource?: ResourceDto
	// Belongs to `resource`: its parent and its children, found in the same language's export.
	family?: Family
	kommune?: { entry: KommuneEntry; local: ResourceDto[]; national: ResourceDto[] }
	helplines?: HelplineGroup[]
}

export const PageDataContext = createContext<PageData>({})

const NONE: PageData = {}

// The baked data while the page is still in the language it was loaded in, nothing after a
// switch, so every reader falls back to the index for the active language.
export function usePageData(): PageData {
	const data = useContext(PageDataContext)
	const { lang } = useLanguage()
	return data.lang === lang ? data : NONE
}
