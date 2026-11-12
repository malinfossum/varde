// CMS boxes that hold a unit's contact details or opening hours, often outside the main
// element. Each entry was found on a fetched page (tag names, ids and classes only) and says
// where and when. A CMS with no entry gets none: the Kontakt heading rule still runs.
export type CmsBox = {
	adapter: "acos" | "corepublish" | "sitevision"
	kind: "contact" | "hours"
	tag: string
	className?: string
	id?: string
}

// None yet. Checked 09.11.2026 on www.kongsvinger.kommune.no (CorePublish, 25 pages),
// www.lillehammer.kommune.no (ACOS, 47 pages) and www.gran.kommune.no (Sitevision, 39 pages):
// no element held the unit's own contact links on most pages, and no class or id named opening
// hours. The two contact elements I did see are rare (an ACOS contact-person webpart on 6 of 47
// pages, a CorePublish contact element on 1 of 25) and hold possible names, so neither is a
// unit box.
export const CMS_BOXES: readonly CmsBox[] = []

const IDENT = /^[A-Za-z][\w-]*$/

// "aside.kontaktboks", "div#apningstider". Only plain identifiers, so a table entry can never
// smuggle a combinator or a pseudo-class into the selector.
export function boxSelector(box: CmsBox): string {
	for (const part of [box.tag, box.className, box.id]) {
		if (part !== undefined && !IDENT.test(part))
			throw new Error("a CMS box needs plain identifiers")
	}
	return `${box.tag}${box.className === undefined ? "" : `.${box.className}`}${box.id === undefined ? "" : `#${box.id}`}`
}
