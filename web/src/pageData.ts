import { createContext, useContext } from "react"
import type { KommuneEntry } from "./services/data.ts"
import type { Helpline } from "./services/helplines.ts"
import type { Lang } from "./services/urlState.ts"
import type { ResourceDto } from "./types/api.ts"

// What the prerender baked into this page. The browser reads it from the #varde-data block
// (services/data.ts readPageData) so a direct load fetches nothing.
export type PageData = {
	resource?: ResourceDto
	kommune?: { entry: KommuneEntry; local: ResourceDto[]; national: ResourceDto[] }
	// Tagged with its language: page data belongs to the URL that was loaded, and a later
	// client-side switch to the other language must not show these names.
	helplines?: { lang: Lang; entries: Helpline[] }
}

export const PageDataContext = createContext<PageData>({})

export function usePageData(): PageData {
	return useContext(PageDataContext)
}
