// Share and copy for a resource's contact details. Pure functions over an injected
// navigator-like object so the component stays render-only and the logic tests without React.

export type ShareTarget = {
	share?: (data: { title: string; text: string; url: string }) => Promise<void>
	clipboard?: { writeText: (text: string) => Promise<void> }
}

export type ShareCapability = "share" | "copy" | "none"
export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed"

export type ShareEntry = { name: string; phone: string | null; url: string }

export function shareText(name: string, phone: string | null): string {
	return phone ? `${name} — ${phone}` : name
}

export function shareCapability(nav: ShareTarget): ShareCapability {
	if (typeof nav.share === "function") return "share"
	if (nav.clipboard) return "copy"
	return "none"
}

export async function copyText(text: string, nav: ShareTarget): Promise<boolean> {
	if (!nav.clipboard) return false
	try {
		await nav.clipboard.writeText(text)
		return true
	} catch {
		return false
	}
}

export async function shareResource(entry: ShareEntry, nav: ShareTarget): Promise<ShareOutcome> {
	if (nav.share) {
		try {
			await nav.share({
				title: entry.name,
				text: shareText(entry.name, entry.phone),
				url: entry.url,
			})
			return "shared"
		} catch (error: unknown) {
			// The user closed the sheet — nothing to announce and nothing to fall back to.
			if (error instanceof DOMException && error.name === "AbortError") return "cancelled"
			// Anything else (unsupported payload, sheet unavailable) degrades to copying the link.
		}
	}
	return (await copyText(entry.url, nav)) ? "copied" : "failed"
}
