export const ADAPTER_NAMES = ["acos", "corepublish", "sitevision", "siteRule", "fallback"] as const
export type AdapterName = (typeof ADAPTER_NAMES)[number]

// The page's main text and where it came from. origin is "unitPage" for every adapter in PR 2;
// PR 3 narrows it to "unitContact" where extraction finds the unit's own contact block.
// fallback marks text taken from a bare <main>, whose values PR 3 sends to review.
export type AdapterResult = {
	adapter: AdapterName
	text: string
	origin: "unitPage"
	fallback: boolean
}
