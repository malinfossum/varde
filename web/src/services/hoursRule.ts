export type HandoverVariant = "fastlege" | "legevakt"

// A wayfinding rule of this application, not a claim about any fastlege's hours (spec).
export function handoverVariant(now: Date): HandoverVariant {
	const day = now.getDay()
	const isWeekday = day >= 1 && day <= 5
	const hour = now.getHours()
	return isWeekday && hour >= 8 && hour < 15 ? "fastlege" : "legevakt"
}
