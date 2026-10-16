import type { ResourceDto } from "../types/api.ts"
import { childrenOf } from "./family.ts"

// "Noen å snakke med" on the landing page (spec C2a): two age groups of two, in this order. The
// names are short landing labels, never translated, and each must be part of its row's data name,
// so a renamed row cannot keep a stale label. The prerender picks the rows from the exported data,
// so a missing id or a stale label fails the build instead of shipping a wrong list.
export const HELPLINE_GROUPS = [
	{
		key: "adults",
		rows: [
			{ id: 1, name: "Mental Helse" },
			{ id: 2, name: "Kirkens SOS" },
		],
	},
	{
		key: "young",
		rows: [
			{ id: 4, name: "Alarmtelefonen for barn og unge" },
			{ id: 121, name: "Kors på halsen" },
		],
	},
] as const

export type HelplineGroupKey = (typeof HELPLINE_GROUPS)[number]["key"]
// `name` is the short landing label. `chatUrl` has already been through safeChatUrl.
export type Helpline = { id: number; name: string; phone: string | null; chatUrl: string | null }
export type HelplineGroup = { key: HelplineGroupKey; rows: Helpline[] }

export function pickHelplines(resources: readonly ResourceDto[]): HelplineGroup[] {
	return HELPLINE_GROUPS.map((group) => ({
		key: group.key,
		rows: group.rows.map(({ id, name }) => {
			const row = resources.find((r) => r.id === id)
			if (!row) throw new Error(`helpline id ${id} is missing from the data`)
			if (!row.name.includes(name))
				throw new Error(`helpline label "${name}" is not part of "${row.name}" (id ${id})`)
			return { id, name, phone: row.phone, chatUrl: chatFor(row, resources) }
		}),
	}))
}

// A service's chat is its own, or else the first child's (in id order) that is safe. Mental
// Helse's chat lives on Sidetmedord (row 122) only, so the URL has one source.
export function chatFor(row: ResourceDto, resources: readonly ResourceDto[]): string | null {
	const own = safeChatUrl(row.chatUrl)
	if (own) return own
	for (const child of childrenOf(row.id, resources)) {
		const chat = safeChatUrl(child.chatUrl)
		if (chat) return chat
	}
	return null
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
