import { createContext, useContext } from "react"
import type { KommuneEntry } from "./services/data.ts"
import type { ResourceDto } from "./types/api.ts"

// What the prerender baked into this page. The browser reads it from the #varde-data block
// (services/data.ts readPageData) so a direct load fetches nothing.
export type PageData = {
	resource?: ResourceDto
	kommune?: { entry: KommuneEntry; local: ResourceDto[]; national: ResourceDto[] }
}

export const PageDataContext = createContext<PageData>({})

export function usePageData(): PageData {
	return useContext(PageDataContext)
}
