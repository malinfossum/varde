import type { Lang } from "../services/urlState.ts"

// Every language Varde ships, in menu order. A new language is one entry here, its strings
// file and its URL prefix (services/urlState.ts). No flags: a flag names a country, not a
// language.
export const LANGUAGES: readonly { code: Lang; name: string; short: string }[] = [
	{ code: "nb", name: "Norsk", short: "NO" },
	{ code: "en", name: "English", short: "EN" },
]
