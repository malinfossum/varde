// Hand-written mirrors of api/Varde.Core/Dtos — phase 2 generates these from OpenAPI; phase 1 writes them by hand on purpose.

export type CategoryDto = { id: number; slug: string; name: string; isFallbackTranslation: boolean }
export type MunicipalityDto = { id: number; name: string; county: string }
export type PagedResult<T> = { items: T[]; page: number; pageSize: number; totalCount: number }
export type ResourceDto = {
	id: number
	name: string
	description: string
	isFallbackTranslation: boolean
	openingHours: string | null
	isNational: boolean
	isAlwaysOpen: boolean
	municipalityId: number | null
	municipalityName: string | null
	address: string | null
	phone: string | null
	email: string | null
	website: string | null
	chatUrl: string | null
	lastVerified: string
	categories: CategoryDto[]
}
