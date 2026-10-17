import type { ResourceDto } from "../types/api.ts"
import { telHref } from "./emergency.ts"
import { safeChatUrl } from "./helplines.ts"

// One tile per way to reach a service (spec C2a). `name` is null for the service itself (the
// tile says "Ring" or "Chat") and a child's data name for a sub-service.
export type ContactTile =
	| {
			kind: "phone"
			key: string
			name: string | null
			phone: string
			menuOption: number | null
			alwaysOpen: boolean
			href: string
	  }
	| { kind: "chat"; key: string; name: string | null; href: string }
	| { kind: "email"; key: string; address: string; href: string }

// Order: the service's own phone, its own chat, then children that are chats, then children
// that are phones, each in id order, so a chat sits second the way it does on Mental Helse's own
// site. A child with a phone is a phone tile; otherwise a safe chat makes it a chat tile; a child
// with neither gets none. An unsafe chat URL never becomes a link. The service's own email comes
// last, and only if it passes safeEmail; a child's email stays on the child's own page.
export function contactTiles(
	resource: ResourceDto,
	children: readonly ResourceDto[]
): ContactTile[] {
	const own: ContactTile[] = []
	if (resource.phone) own.push(phoneTile(resource, resource.phone, null))
	const chat = safeChatUrl(resource.chatUrl)
	if (chat) own.push({ kind: "chat", key: `chat-${resource.id}`, name: null, href: chat })
	const childTiles = [...children]
		.sort((a, b) => a.id - b.id)
		.flatMap((child): ContactTile[] => {
			if (child.phone) return [phoneTile(child, child.phone, child.name)]
			const childChat = safeChatUrl(child.chatUrl)
			return childChat
				? [{ kind: "chat", key: `chat-${child.id}`, name: child.name, href: childChat }]
				: []
		})
	const email = safeEmail(resource.email)
	return [
		...own,
		...childTiles.filter((t) => t.kind === "chat"),
		...childTiles.filter((t) => t.kind === "phone"),
		...(email
			? [
					{
						kind: "email" as const,
						key: `email-${resource.id}`,
						address: email,
						href: `mailto:${email}`,
					},
				]
			: []),
	]
}

// `?? null`: data cached from before phoneMenuOption existed has no such key.
function phoneTile(row: ResourceDto, phone: string, name: string | null): ContactTile {
	return {
		kind: "phone",
		key: `phone-${row.id}`,
		name,
		phone,
		menuOption: row.phoneMenuOption ?? null,
		alwaysOpen: row.isAlwaysOpen,
		href: telHref(phone),
	}
}

// One plain address and nothing else (spec: the email tile). In a mailto link "?" starts the
// headers, so "a@b.no?bcc=x@y.no" would add a hidden recipient; "," and ";" add a second
// recipient, ":" makes a scheme, and "%" could encode any of them. Quotes, brackets, slashes and
// "#" have no place in a plain address either. Anything else gets no tile and no link.
const NOT_IN_A_PLAIN_ADDRESS = /[\s?&,;:%#/\\<>"'()[\]]/

export function safeEmail(value: string | null): string | null {
	if (!value || NOT_IN_A_PLAIN_ADDRESS.test(value)) return null
	const [local, domain, ...rest] = value.split("@")
	if (rest.length > 0 || !local || !domain) return null
	const labels = domain.split(".")
	if (labels.length < 2 || labels.some((label) => label === "")) return null
	return value
}
