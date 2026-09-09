// The acute strip's four numbers. The landing page fetches nothing, so these are constants —
// copied from api/Varde.Data/Seed/SeedData.cs rows 23, 24, 25 and 3, never typed from memory.
// tests/emergency.test.ts reads the seed file and fails if the two ever differ. Re-verified in
// the six-month LastVerified pass (README, "Data verification").

export type EmergencyLine = {
	id: "brann" | "politi" | "ambulanse" | "legevakt"
	seedId: number
	phone: string
	source: string
	verified: string
}

export const emergencyLines: readonly EmergencyLine[] = [
	{
		id: "brann",
		seedId: 23,
		phone: "110",
		source: "https://www.dsb.no/brannsikkerhet/nodmelding/110-sentralene/",
		verified: "2026-09-09",
	},
	{
		id: "politi",
		seedId: 24,
		phone: "112",
		source: "https://www.politiet.no/kontakt-politiet/ring-politiet",
		verified: "2026-09-09",
	},
	{
		id: "ambulanse",
		seedId: 25,
		phone: "113",
		source: "https://www.helsenorge.no/forstehjelp",
		verified: "2026-09-09",
	},
	{
		id: "legevakt",
		seedId: 3,
		phone: "116 117",
		source: "https://www.helsenorge.no/legevakt/",
		verified: "2026-09-07",
	},
]

export function telHref(phone: string): string {
	return `tel:${phone.replaceAll(" ", "")}`
}
