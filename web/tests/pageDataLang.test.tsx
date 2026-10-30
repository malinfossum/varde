import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"
import { splitForKommune } from "../src/components/KommunePage.tsx"
import { type PageData, PageDataContext } from "../src/pageData.ts"
import { clearIndexCache } from "../src/services/data.ts"
import { desktopTools } from "./scope.ts"
import { makeResource, stubDataFiles } from "./stubData.ts"

// Page data belongs to the URL that was loaded. A client-side switch to the other language
// must show that language's rows, not the ones baked into the cold-loaded page (issue #79).

const hamar = { id: 1, slug: "hamar", name: "Hamar", county: "Innlandet", number: "3403" }
const nb = [
	makeResource({
		id: 12,
		name: "Krisesenteret",
		description: "Hjelp døgnet rundt.",
		municipalityId: 1,
		isNational: false,
	}),
]
const en = [
	makeResource({
		id: 12,
		name: "Crisis centre",
		description: "Help around the clock.",
		municipalityId: 1,
		isNational: false,
	}),
]

afterEach(() => {
	clearIndexCache()
	vi.unstubAllGlobals()
	window.history.replaceState(null, "", "/")
})

function coldLoad(path: string, data: PageData) {
	window.history.replaceState(null, "", path)
	return render(
		<PageDataContext.Provider value={data}>
			<App />
		</PageDataContext.Provider>
	)
}

test.each([
	{
		from: "nb",
		path: "/resources/12",
		baked: nb,
		to: "English",
		heading: "Crisis centre",
		text: "Help around the clock.",
	},
	{
		from: "en",
		path: "/en/resources/12",
		baked: en,
		to: "Norsk",
		heading: "Krisesenteret",
		text: "Hjelp døgnet rundt.",
	},
] as const)(
	"a cold-loaded $from detail page shows the other language after a switch",
	async ({ from, path, baked, to, heading, text }) => {
		stubDataFiles({ resources: nb, kommuner: [hamar] }, en)
		coldLoad(path, { lang: from, resource: baked[0], family: { parent: null, children: [] } })
		await userEvent.click(desktopTools().getByRole("link", { name: to }))
		expect(await screen.findByRole("heading", { level: 1, name: heading })).toBeInTheDocument()
		expect(screen.getByText(text)).toBeInTheDocument()
	}
)

test("a cold-loaded nb kommune page shows the English rows after a switch", async () => {
	stubDataFiles({ resources: nb, kommuner: [hamar] }, en)
	coldLoad("/kommune/hamar", { lang: "nb", kommune: splitForKommune(hamar, nb) })
	expect(
		await screen.findByRole("heading", { level: 3, name: "Krisesenteret" })
	).toBeInTheDocument()
	await userEvent.click(desktopTools().getByRole("link", { name: "English" }))
	expect(
		await screen.findByRole("heading", { level: 3, name: "Crisis centre" })
	).toBeInTheDocument()
	expect(screen.queryByRole("heading", { level: 3, name: "Krisesenteret" })).toBeNull()
})

test("a round trip nb, en, nb on a cold-loaded detail page ends in Norwegian", async () => {
	stubDataFiles({ resources: nb, kommuner: [hamar] }, en)
	coldLoad("/resources/12", { lang: "nb", resource: nb[0], family: { parent: null, children: [] } })
	await userEvent.click(desktopTools().getByRole("link", { name: "English" }))
	await screen.findByRole("heading", { level: 1, name: "Crisis centre" })
	await userEvent.click(desktopTools().getByRole("link", { name: "Norsk" }))
	expect(
		await screen.findByRole("heading", { level: 1, name: "Krisesenteret" })
	).toBeInTheDocument()
})

test("a round trip nb, en, nb on a cold-loaded kommune page ends in Norwegian", async () => {
	stubDataFiles({ resources: nb, kommuner: [hamar] }, en)
	coldLoad("/kommune/hamar", { lang: "nb", kommune: splitForKommune(hamar, nb) })
	await screen.findByRole("heading", { level: 3, name: "Krisesenteret" })
	await userEvent.click(desktopTools().getByRole("link", { name: "English" }))
	await screen.findByRole("heading", { level: 3, name: "Crisis centre" })
	await userEvent.click(desktopTools().getByRole("link", { name: "Norsk" }))
	expect(
		await screen.findByRole("heading", { level: 3, name: "Krisesenteret" })
	).toBeInTheDocument()
})
