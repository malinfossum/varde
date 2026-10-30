// Hand-written mirrors of api/Varde.Core/Dtos — phase 2 generates these from OpenAPI; phase 1 writes them by hand on purpose.

export type CategoryDto = { id: number; slug: string; name: string; isFallbackTranslation: boolean }
// number and countyNumber are not from the API: the export attaches them from web/data/places.json.
export type MunicipalityDto = {
	id: number
	name: string
	county: string
	number: string
	countyNumber: string
}
export type PagedResult<T> = { items: T[]; page: number; pageSize: number; totalCount: number }
// The API's ResourceCost, as ResourceService spells it on the wire. null is "not stated".
export type ResourceCost = "free" | "paid" | "partly"
export type ResourceDto = {
	id: number
	name: string
	description: string
	isFallbackTranslation: boolean
	openingHours: string | null
	isNational: boolean
	isAlwaysOpen: boolean
	isLowThreshold: boolean
	cost: ResourceCost | null
	costNote: string | null
	municipalityId: number | null
	municipalityName: string | null
	address: string | null
	phone: string | null
	email: string | null
	website: string | null
	chatUrl: string | null
	lastVerified: string
	categories: CategoryDto[]
	servedMunicipalityIds: number[]
	// The service this one belongs to (Arbeidslivstelefonen under Mental Helse), or null.
	parentId: number | null
	// The key to press after the call connects (1 to 9), or null.
	phoneMenuOption: number | null
}
