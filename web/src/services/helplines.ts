import type { ResourceDto } from "../types/api.ts"

// "Noen å snakke med" on the landing page, in this order (spec: Landing, item 9): seed ids
// 1 Hjelpetelefonen, 2 Kirkens SOS, 121 Kors på halsen, 9 Arbeidslivstelefonen,
// 122 Sidetmedord. The prerender picks them from the exported data, so an id that vanishes
// fails the build instead of shipping a shorter list.
export const HELPLINE_IDS = [1, 2, 121, 9, 122] as const

// A short line under a name on the landing page. Id 9 shares 116 123 with Hjelpetelefonen,
// and its seed description says to choose option 3 in the menu ("Velg tast 3 i menyen").
export const HELPLINE_NOTES: Partial<Record<number, string>> = { 9: "landing.helplineNote.9" }

export type Helpline = Pick<ResourceDto, "id" | "name" | "phone" | "chatUrl">

export function pickHelplines(resources: readonly ResourceDto[]): Helpline[] {
	return HELPLINE_IDS.map((id) => {
		const row = resources.find((r) => r.id === id)
		if (!row) throw new Error(`helpline id ${id} is missing from the data`)
		return { id: row.id, name: row.name, phone: row.phone, chatUrl: row.chatUrl }
	})
}

// A chat link renders only for an https:// URL; anything else shows the name alone. The
// detail page's existing links are hardened in sub-project E, where outside data arrives.
// The scheme in the returned link is written here, not copied from the data, so CodeQL
// can see the link never starts with javascript: (the same shape as telHref's "tel:").
const HTTPS = "https://"

export function safeChatUrl(url: string | null): string | null {
	if (!url?.startsWith(HTTPS)) return null
	return `${HTTPS}${url.slice(HTTPS.length)}`
}
