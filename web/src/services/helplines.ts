import type { ResourceDto } from "../types/api.ts"

// "Noen å snakke med" on the landing page, in this order (spec: Landing, item 9): seed ids
// 1 Hjelpetelefonen, 2 Kirkens SOS, 121 Kors på halsen, 9 Arbeidslivstelefonen,
// 122 Sidetmedord. The prerender picks them from the exported data, so an id that vanishes
// fails the build instead of shipping a shorter list.
export const HELPLINE_IDS = [1, 2, 121, 9, 122] as const

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
export function safeChatUrl(url: string | null): string | null {
	return url?.startsWith("https://") ? url : null
}
