// Fills {key} placeholders in a translated string. Shared by the kommune pages.
export function fill(template: string, values: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""))
}
