import type { Catalog } from "../hooks/useCatalog.ts"

// NFD splits letters from combining marks (å → a + ring) so the marks can be stripped.
// ø and æ are distinct letters, not letter+mark, so they need their own mapping.
export function fold(value: string): string {
	return value
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replaceAll("ø", "o")
		.replaceAll("æ", "ae")
}

export function matchesEitherWay(a: string, b: string): boolean {
	const foldedA = fold(a)
	const foldedB = fold(b)
	return foldedA.includes(foldedB) || foldedB.includes(foldedA)
}

export type Suggestion =
	| { kind: "municipality"; id: number; name: string }
	| { kind: "category"; slug: string; name: string }

export function suggest(query: string, catalog: Catalog): Suggestion[] {
	const trimmed = query.trim()
	if (fold(trimmed).length < 2) return []
	const municipalities: Suggestion[] = catalog.municipalities
		.filter((m) => matchesEitherWay(trimmed, m.name))
		.slice(0, 3)
		.map((m) => ({ kind: "municipality", id: m.id, name: m.name }))
	const categories: Suggestion[] = catalog.categories
		.filter((c) => matchesEitherWay(trimmed, c.name) || matchesEitherWay(trimmed, c.slug))
		.slice(0, 3)
		.map((c) => ({ kind: "category", slug: c.slug, name: c.name }))
	return [...municipalities, ...categories]
}
