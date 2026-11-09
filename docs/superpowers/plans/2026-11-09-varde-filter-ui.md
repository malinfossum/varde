# Filter PR 2: the /sok filter UI. Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace FilterBar on /sok with the four parts the filter spec designs: Søk and a
multi-pick Sted field with the national radio under them, facet groups with counts (a sidebar
from 1024 px, a full-screen dialog below), and removable chips for every active filter above
the results.

**Architecture:** Two pure services build what the UI shows: `placeOptions.ts` (the Sted list,
its keys and labels) and `activeFilters.ts` (the chips). `useResources` adds the facet counts
and the kommuner that have rows to its ready state, so counts exist only once rows have loaded.
Five components, each with one job: `PlaceField` (the Sted combobox), `PlaceBar` (Søk, Sted and
the national radio), `FacetGroup` (one `<details>` group of checkboxes), `FacetPanel` (the
sidebar and the dialog) and `ActiveFilters` (the chips row). Every component reads its state
from the URL's filters and writes back through `onPatch`, so nothing holds its own copy. Which
facet layout shows is CSS only: a media query plus a container query on the /sok page.

**Tech Stack:** React 19 + TypeScript (Vite), react-aria-components 1.22.1 (already installed:
ComboBox in multiple mode, TagGroup, DialogTrigger, Modal), Tailwind v4 with component classes
in `src/styles/main.css`, Vitest + Testing Library + vitest-axe, Playwright (Chromium), Biome.

**Spec:** `docs/superpowers/specs/2026-10-30-varde-filter-design.md` (branch
`docs/filter-spec`, approved 30.10.2026). This plan covers spec Delivery step 3 (PR 2: the UI)
and the PR 2 lines of its Testing section. PR 1 (the model) and the lavterskel data reconcile
are merged.

**Schedule:** written Monday 09.11.2026. Tasks 1 to 5 on Monday, Tasks 6 to 10 and the
controller's Task 11 on Tuesday 10.11.2026, merge-ready Tuesday evening.

## Global Constraints

- No new dependency (spec, Goal).
- Place numbers are strings everywhere (`"0301"`, `"03"`), because the leading zero matters.
- Lavterskeltilbud is never a filter category, and Akutt is never an Egenskap (spec, decision 5).
- Tilbyder is not built: no row carries `providerType` yet (spec, Delivery). `FacetGroup` stays
  generic so it slots in later.
- Mobile-first CSS: baseline styles for the smallest screen, `min-width` breakpoints at 768 px
  and 1024 px only. Never add a `max-width` query.
- Every control is at least 44 px (2.75rem). Controls on one row share one height and one bottom
  edge, and their labels sit on one baseline.
- Labels look like labels: a legend, field label or option label differs from its value or
  count by weight, size or colour, never the same text in the same ink.
- Both themes, 200 % text and 320 px reflow are checked. No horizontal scroll at any width.
- Under `forced-colors: active`, checkbox and radio states, chip borders and focus rings stay
  visible through system colours, never through `box-shadow` alone.
- No em dashes anywhere: code, comments, copy, commit messages. Rewrite the sentence instead.
- Times are written `13:20`, dates `10.11.2026` in prose and comments.
- Code and identifiers in English, comments in my own first-person voice.
- Biome formatting: tabs, line width 100. Run `npx biome check --write <files>` on every touched
  file before each commit.
- Every commit: author `malinfossum.dev@proton.me`, no `Co-Authored-By` or AI trailer. Stage
  explicit paths only, never `git add -A` or `commit -a`.
- All commands run from `web/` unless a step says otherwise. `npm test` and
  `npm run typecheck` are green at the end of every task.
- Stay out of `pipeline/` entirely: another session works there.
- The plan and the spec are git-excluded local copies in the build worktree. Never commit them
  on `feat/filter-ui`.
- Never invent contact data. This PR adds no rows; test fixtures that need made-up place
  numbers say so in a comment and use numbers that are obviously not real (PR 1 ruling).

## Verified facts (checked on 09.11.2026 against the installed packages)

Implementers rely on these. Each one was read in the source named.

1. **ComboBox multiple mode.** `ComboBoxProps<T, M extends 'single' | 'multiple'>`. With
   `selectionMode="multiple"` the props are `value: readonly Key[]`, `defaultValue` and
   `onChange: (value: Key[]) => void` (`react-stately/dist/types/src/combobox/useComboBoxState.d.ts`,
   `ValueBase<ValueType<M>, ChangeValueType<M>>`).
2. **The list stays open after a pick in multiple mode.** In
   `react-stately/dist/private/combobox/useComboBoxState.mjs` the "close when an item is
   selected" effect runs only for `selectionMode === 'single'`, and `commit()` (Enter) selects
   the focused key without closing. Enter on an option that is already picked unpicks it.
3. **The typed text clears itself when `inputValue` is left uncontrolled.** When the value
   changes, `resetInputValue()` sets the input to the selected item's text, which is `''` in
   multiple mode. On blur `commitSelection()` does the same. Both run only when `inputValue` is
   not passed. So `PlaceField` mirrors the text with `onInputChange` and never passes
   `inputValue`.
4. **react-stately compares `value` by reference.** A new array on every render reads as a new
   pick and resets the typed text on every keystroke. `PlaceField` memoises `value` on a joined
   string.
5. **ariaHideOutside keeps two markers visible**
   (`react-aria/dist/private/overlays/ariaHideOutside.mjs`): its first pass keeps every
   `[data-live-announcer], [data-react-aria-top-layer]` element (presence of the attribute), but
   its MutationObserver keeps a node only when `dataset.liveAnnouncer === 'true'`. So the status
   region gets `data-live-announcer="true"`, not an empty value.
6. **A Modal uses `inert`, a ComboBox uses `aria-hidden`.** `useModalOverlay` calls
   ariaHideOutside with `shouldUseInert: true`; `useComboBox` calls it without. jsdom 30 has no
   `inert` support, so in vitest both fall back to `aria-hidden`. An axe run with an open modal
   must be scoped to the dialog, or axe reports the hidden trigger behind it
   (`aria-hidden-focus`), which a real browser never has.
7. **TagGroup focus.** When the focused tag is removed, react-stately's list state moves focus to
   the next tag, or the previous one when it was last. When the last tag goes, `useTagGroup`
   focuses its own container, not a useful target. `useChipFocus` (Task 5) owns every case.
8. **TagGroup sets `aria-live` on its grid.** Any test that finds the status region with
   `document.querySelector("[aria-live]")` can grab a chips grid instead. Tests use
   `[data-live-announcer]` from Task 3 on.
9. **The /sok search box has no styles today.** `SearchBar.tsx` renders a bare `<input>`, and
   Tailwind's Preflight sets `border: 0`, so it has no border and no height. Task 6 styles it.
10. **A `<fieldset>` is `min-inline-size: min-content` by default** and Preflight does not reset
    it, so one long label can push the page sideways at 200 % text. Every fieldset in this PR
    sets `min-inline-size: 0`.
11. **Fixture data** (`e2e/fixtures/data/`, which CI and local e2e copy to `public/data/`): 138
    rows, 17 of them national; 8 kommuner in 2 fylker (34 Innlandet with seven, 03 Oslo with
    one, Oslo 0301); `aliases.json` is `[]`. Hamar has 21 local or served rows. So the Sted list
    with nothing typed is Innlandet, then Elverum, Gjøvik, Hamar, Lillehammer, Løten, Oslo,
    Ringsaker, Stange.
12. **The old FilterBar selectors in e2e/** are only in `e2e/oldLinks.spec.ts` (the "Kommune"
    combobox). In `tests/` they are in `filterbar.test.tsx`, `combobox.test.tsx`,
    `list.test.tsx` (lines 157, 167, 170, 401) and `historyButtons.test.tsx` line 238. One more
    test breaks without naming the old UI: `listRole.test.tsx` finds the badge with
    `getByText("Lavterskel")`, which the Egenskaper facet label now matches too (Task 9).

Facts 13 to 18 were found on 09.11.2026 by running this plan's code in a scratch copy of main
(`git archive` of `dd48a44`, with the installed `node_modules` linked in), not by reading.

13. **Chips inside a ComboBox go in `ComboBoxValue`.** The ComboBox builds its option collection
    by rendering all its children in a hidden pass. A `TagGroup` there renders its content
    straight into that pass (`CollectionBuilder` returns `props.content` when a document already
    exists), its `TagList` falls back to a plain `Collection`, and every `Tag` lands in the
    option list: "Duplicate key county:34 found in collection" on the first pick. `ComboBoxValue`
    is a hideable component (`react-aria-components/dist/private/ComboBox.mjs`), so it is skipped
    in that pass. It also gives the input an `aria-describedby` that points at it, so the input's
    description is the picks ("Innlandet Hamar" in jsdom).
14. **react-aria names a Tag's remove button itself.** `useTag` gives it `aria-label` "Fjern" /
    "Remove" (its own `nb-NO` and `en-US` strings) and `aria-labelledby="<button id> <row id>"`.
    `aria-labelledby` wins over any `aria-label` I pass, so a custom "Fjern Hamar" is read as
    "Fjern Hamar Hamar". With no `aria-label` of my own the name is "Fjern Hamar" /
    "Remove Hamar", which every test in this plan asserts.
15. **`data-react-aria-top-layer` is honoured by every `ariaHideOutside`,** the Modal's too. Left
    on the Sted group for good, it kept the Sted field, `main` and `#app` free of `inert` behind
    the open filter dialog (measured at 375 px). Task 5 sets it only while the list is open.
16. **jsdom trims each element's text in an accessible name.** `Rus og avhengighet` plus a hidden
    `", "` span plus the count gives "Rus og avhengighet,12". A plain space between the label span
    and the count span gives "Rus og avhengighet, 12".
17. **A TagGroup's chips render one commit after the rest of the page.** On Back the saved scroll
    is restored first; the chip rows then grow above it, and Chrome's scroll anchoring moved the
    page by their height (38 px at 375 px with one Sted pick). `html:has(.sok-page)` turns
    anchoring off (Task 7).
18. **Playwright role locators skip `aria-hidden` content.** While the Sted list is open the rest
    of the page is `aria-hidden`, so a role locator for something outside the field waits for
    ever. The e2e `tabTo` helper resolves its element once, before it starts pressing Tab.

## Calls for Malin

- **C1: badge strings for facet labels.** The spec's copy table says Betalt, Low threshold and
  Paid, but the card badges say Koster penger (nb), No referral and Costs money (en), and the
  spec also says a facet and a badge never use two words for one thing. Default in this plan:
  the facets reuse the badge keys (`badge.lowThreshold`, `badge.alwaysOpen`, `badge.cost.*`).
  The alternative is to rename the badges to the table's words in this PR.
- **C2: national chip labels.** New keys `filter.chip.nationalExclude` "Skjul nasjonale" /
  "Hide national" and `filter.chip.nationalOnly` "Bare nasjonale" / "National only".
- **C3: the dialog footer sits below the scroll area, not over it.** The spec asks for a sticky
  footer with `scroll-padding-bottom` equal to its height. This plan makes the dialog a flex
  column (heading, scroll area, footer), so the footer never covers any checkbox by
  construction, at any text size, with no height to keep in sync. The spec's e2e check (the last
  checkbox stays above the footer's top edge) still runs. The alternative is the sticky footer
  as written.
- **C4: the Sted list at 200 % text on a phone (open, found in the stress test of 09.11.2026).**
  With a Sted pick and the field low on a 375 px screen at 200 % text, focus opens the list, the
  page scrolls by itself and react-aria closes the list again at once (Task 10, Step 3). Not yet
  understood. Recommended: a time-boxed hunt (45 min, superpowers:systematic-debugging) inside
  Task 10; if it is not found by then, that one assertion becomes `test.fail()` with a comment
  and a follow-up issue, so the run stays honest and flips to red the day it is fixed.
  Alternative: `menuTrigger="input"` plus a ▾ button that opens the list, as the old field had,
  which removes the open-on-focus path at the cost of a second control and a changed behaviour.
- **C5: the result cards at 200 % text on a phone (open).** At 375 px and 200 % text the cards
  are wider than the screen (437 px of page), because of the card's own nowrap content. The
  filter UI no longer is. Recommended: the cards get their own small follow-up PR, and this PR's
  200 % e2e checks look at the filter UI only (as written now). Alternative: fix the card
  reflow in this PR, which grows its scope past the spec's PR 2 list.

**Rulings (Malin, 09.11.2026):** C1 reuse the badge strings. C2 and C3 as written. C4 a 45-minute hunt inside Task 10, then `test.fail()` on that one assertion plus a follow-up issue. C5 a follow-up PR for the cards; PR 2 keeps the scoped 200 % checks. Plan approved for a subagent-driven build on `feat/filter-ui`.

## Review Focus

1. **Back and Forward after removing a chip:** the Sted chips and the checkboxes follow the URL,
   with no stale state inside a component. Pinned in Task 4 (checkbox rerender), Task 5 (Sted
   rerender), Task 9 (App: remove, Back) and Task 10 (e2e).
2. **Removing the last chip while the list is empty** sends focus to the empty state's heading,
   never to `<body>`. Pinned in Task 8 (component) and Task 9 (App).
3. **Picking a place while Bare nasjonale is on** flips the radio to Ta med and shows the Sted
   chip. Pinned in Task 6.
4. **Switching language with filters on** (`/sok?category=...&municipality=3403` to `/en/sok`)
   keeps the filters and shows English chip and option labels. Pinned in Task 9 (App) and
   Task 10 (e2e).
5. **Text typed in Sted but never picked** filters nothing and makes no chip, also after Tab
   leaves the field. Pinned in Task 5.

## File map

| File | Job | Task |
|---|---|---|
| `web/src/services/placeOptions.ts` | Sted options, keys, labels, patch | 1 |
| `web/src/services/activeFilters.ts` | One chip per active value | 2 |
| `web/src/hooks/useResources.ts` | Ready state gains `counts` and `withRows` | 3 |
| `web/src/components/StatusRegion.tsx` | `data-live-announcer="true"` | 3 |
| `web/src/components/FacetGroup.tsx` | `FacetOption` row and one `<details>` group | 4 |
| `web/src/hooks/useChipFocus.ts` | Focus after a chip is removed | 5 |
| `web/src/components/FilterChip.tsx` | One removable chip (react-aria `Tag`) | 5 |
| `web/src/components/PlaceField.tsx` | The Sted multi-pick combobox | 5 |
| `web/src/components/PlaceBar.tsx` | Søk + Sted + national radio | 6 |
| `web/src/components/SearchBar.tsx` | Styled to match Sted | 6 |
| `web/src/components/FacetPanel.tsx` | `FacetSidebar`, `FacetDialog` | 7 |
| `web/src/components/ActiveFilters.tsx` | Chips row + Nullstill alt | 8 |
| `web/src/components/ListPage.tsx` | Wiring, reserved height | 9 |
| `web/src/styles/main.css` | Component classes | 4 to 9 |
| `web/src/i18n/nb.json`, `en.json` | Copy | 2, 4 to 9 |
| `web/e2e/filter.spec.ts` | The PR 2 e2e | 10 |
| Deleted: `FilterBar.tsx`, `MunicipalityCombobox.tsx`, `tests/filterbar.test.tsx`, `tests/combobox.test.tsx` | | 9 |

---

### Task 1: The Sted options service

**Files:**
- Create: `web/src/services/placeOptions.ts`
- Test: `web/tests/placeOptions.test.ts`

**Interfaces:**
- Consumes: `Catalog` from `src/services/data.ts`, `Filters` from `src/services/filters.ts`,
  `fold` and `matchesEitherWay` from `src/services/match.ts`, `rows` from `tests/filterFixture.ts`.
- Produces:
  - `type PlaceOption = { key: string; label: string }`
  - `type PlaceOptionGroups = { counties: PlaceOption[]; municipalities: PlaceOption[] }`
  - `kommunerWithRows(rows: readonly ResourceDto[]): ReadonlySet<number>` (municipality ids)
  - `municipalityLabel(m: MunicipalityDto, places: Pick<Catalog, "municipalities" | "counties">): string`
  - `placeLabel(places: Pick<Catalog, "municipalities" | "counties">, key: string): string | null`
  - `placeOptions(catalog: Pick<Catalog, "municipalities" | "counties" | "aliases">, withRows: ReadonlySet<number> | null, input: string): PlaceOptionGroups`
  - `selectedPlaceKeys(filters: Pick<Filters, "counties" | "municipalities">): string[]`
  - `placePatch(keys: readonly string[]): Pick<Filters, "counties" | "municipalities">`
  - Key format: `county:34`, `municipality:3403`, `alias:<kommunenummer>:<alias>`.

Note: the brief named the second parameter `rows`. It takes `withRows` (the set of kommune ids
with data) instead, because ListPage never holds the rows, and a set worked out once per index
(Task 3) saves a scan of every row on each keystroke. `placePatch` takes the keys only: they
are the whole selection, so it needs nothing else.

- [ ] **Step 1: Write the failing test**

`web/tests/placeOptions.test.ts`:

```ts
import { describe, expect, test } from "vitest"
import type { Catalog } from "../src/services/data.ts"
import {
	kommunerWithRows,
	placeLabel,
	placeOptions,
	placePatch,
	selectedPlaceKeys,
} from "../src/services/placeOptions.ts"
import type { MunicipalityDto } from "../src/types/api.ts"
import { rows } from "./filterFixture.ts"

const kommune = (id: number, name: string, county: string, number: string): MunicipalityDto => ({
	id,
	name,
	county,
	number,
	countyNumber: number.slice(0, 2),
})

// Hamar, Løten, Ringsaker and Oslo carry their KLASS numbers from the spec. The two Våler rows
// are a made-up duplicate name: 3499 and 3199 are not real kommunenummer, only the fylke prefix
// is real.
const hamar = kommune(1, "Hamar", "Innlandet", "3403")
const loten = kommune(6, "Løten", "Innlandet", "3412")
const ringsaker = kommune(4, "Ringsaker", "Innlandet", "3411")
const oslo = kommune(8, "Oslo", "Oslo", "0301")
const valerInnlandet = kommune(98, "Våler", "Innlandet", "3499")
const valerOstfold = kommune(99, "Våler", "Østfold", "3199")

const catalog: Pick<Catalog, "municipalities" | "counties" | "aliases"> = {
	municipalities: [oslo, valerOstfold, hamar, ringsaker, loten, valerInnlandet],
	counties: [
		{ number: "03", name: "Oslo" },
		{ number: "31", name: "Østfold" },
		{ number: "34", name: "Innlandet" },
	],
	// A made-up alias row for the test. aliases.json ships empty.
	aliases: [{ alias: "Brumunddal", number: "3411", source: "test fixture" }],
}
const all = new Set([1, 4, 6, 8, 98, 99])
const labels = (options: { label: string }[]) => options.map((o) => o.label)

describe("placeOptions", () => {
	test.each<[string, string, ReadonlySet<number> | null, string[], string[]]>([
		[
			"an empty field lists every place with rows, fylker first, Oslo once as the kommune",
			"",
			all,
			["Innlandet", "Østfold"],
			["Hamar", "Løten", "Oslo", "Ringsaker", "Våler (Innlandet)", "Våler (Østfold)"],
		],
		[
			"with the rows not known yet, every catalog kommune is offered",
			"",
			null,
			["Innlandet", "Østfold"],
			["Hamar", "Løten", "Oslo", "Ringsaker", "Våler (Innlandet)", "Våler (Østfold)"],
		],
		[
			"a kommune without rows is left out, and keeps its fylke label on the other Våler",
			"",
			new Set([1, 4, 8, 98, 99]),
			["Innlandet", "Østfold"],
			["Hamar", "Oslo", "Ringsaker", "Våler (Innlandet)", "Våler (Østfold)"],
		],
		[
			"a fylke whose kommuner have no rows is left out",
			"",
			new Set([1, 4, 6, 8, 98]),
			["Innlandet"],
			["Hamar", "Løten", "Oslo", "Ringsaker", "Våler (Innlandet)"],
		],
		["matching folds ø both ways: lot finds Løten", "lot", all, [], ["Løten"]],
		["a typed fylke name finds the fylke", "innl", all, ["Innlandet"], []],
		["Oslo is offered once, as the kommune", "oslo", all, [], ["Oslo"]],
		[
			"a shared name lists both, each with its fylke",
			"valer",
			all,
			[],
			["Våler (Innlandet)", "Våler (Østfold)"],
		],
		["one letter never offers an alias", "b", all, [], []],
		["two letters offer the alias, labelled with its kommune", "br", all, [], ["Ringsaker (Brumunddal)"]],
		["an alias for a kommune without rows is not offered", "brum", new Set([1, 6, 8, 98, 99]), [], []],
	])("%s", (_name, input, withRows, counties, municipalities) => {
		const options = placeOptions(catalog, withRows, input)
		expect(labels(options.counties)).toEqual(counties)
		expect(labels(options.municipalities)).toEqual(municipalities)
	})

	test("keys carry the kind and the number, and an alias key carries its kommune", () => {
		expect(placeOptions(catalog, all, "brum").municipalities.map((o) => o.key)).toEqual([
			"alias:3411:Brumunddal",
		])
		expect(placeOptions(catalog, all, "hamar").municipalities.map((o) => o.key)).toEqual([
			"municipality:3403",
		])
		expect(placeOptions(catalog, all, "innlandet").counties.map((o) => o.key)).toEqual([
			"county:34",
		])
	})

	test("the nb collator sorts Æ, Ø and Å after Z, as Norwegian does", () => {
		// Made-up kommunenummer in fylke 46; only the prefix is real. An English collator would put
		// Ærøy and Åsane before Bergen.
		const vestland = {
			municipalities: [
				kommune(1, "Åsane", "Vestland", "4698"),
				kommune(2, "Bergen", "Vestland", "4699"),
				kommune(3, "Ærøy", "Vestland", "4697"),
			],
			counties: [{ number: "46", name: "Vestland" }],
			aliases: [],
		}
		expect(labels(placeOptions(vestland, null, "").municipalities)).toEqual([
			"Bergen",
			"Ærøy",
			"Åsane",
		])
	})
})

describe("kommunerWithRows", () => {
	test("collects every kommune a row is located in or serves", () => {
		expect([...kommunerWithRows(rows)].sort((a, b) => a - b)).toEqual([1, 4, 8])
	})
})

describe("picks", () => {
	test("selectedPlaceKeys lists fylker, then kommuner", () => {
		expect(selectedPlaceKeys({ counties: ["34"], municipalities: ["0301", "3403"] })).toEqual([
			"county:34",
			"municipality:0301",
			"municipality:3403",
		])
	})

	test("placePatch turns keys back into numbers, and an alias into its kommune", () => {
		expect(placePatch(["county:34", "municipality:0301", "alias:3411:Brumunddal"])).toEqual({
			counties: ["34"],
			municipalities: ["0301", "3411"],
		})
		expect(placePatch([])).toEqual({ counties: [], municipalities: [] })
	})

	test("placeLabel names a picked place, with its fylke when the name is shared", () => {
		expect(placeLabel(catalog, "county:34")).toBe("Innlandet")
		expect(placeLabel(catalog, "county:03")).toBe("Oslo")
		expect(placeLabel(catalog, "municipality:3403")).toBe("Hamar")
		expect(placeLabel(catalog, "municipality:3199")).toBe("Våler (Østfold)")
		expect(placeLabel(catalog, "municipality:9999")).toBeNull()
	})
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/placeOptions.test.ts`
Expected: FAIL, "Failed to resolve import ../src/services/placeOptions.ts".

- [ ] **Step 3: Write the implementation**

`web/src/services/placeOptions.ts`:

```ts
import type { MunicipalityDto, ResourceDto } from "../types/api.ts"
import type { Catalog } from "./data.ts"
import type { Filters } from "./filters.ts"
import { fold, matchesEitherWay } from "./match.ts"

// The Sted field's options and picks (filter spec, UI, PlaceBar). A key names one option with
// its kind in front, so fylker, kommuner and town aliases share one list: "county:34",
// "municipality:3403", "alias:3411:Brumunddal". Place numbers stay strings.
export type PlaceOption = { key: string; label: string }
export type PlaceOptionGroups = { counties: PlaceOption[]; municipalities: PlaceOption[] }
type Places = Pick<Catalog, "municipalities" | "counties">

const collator = new Intl.Collator("nb")
const byLabel = (a: PlaceOption, b: PlaceOption) => collator.compare(a.label, b.label)

// The database ids of the kommuner with a row located there or served. The Sted list offers only
// places with data, and a fylke has data when one of its kommuner does.
export function kommunerWithRows(rows: readonly ResourceDto[]): ReadonlySet<number> {
	const ids = new Set<number>()
	for (const r of rows) {
		if (r.municipalityId !== null) ids.add(r.municipalityId)
		for (const id of r.servedMunicipalityIds) ids.add(id)
	}
	return ids
}

// A fylke that is one kommune of the same name (Oslo) is listed once, as the kommune.
function isOneKommune(
	county: { number: string; name: string },
	municipalities: readonly MunicipalityDto[]
): boolean {
	const inside = municipalities.filter((m) => m.countyNumber === county.number)
	return inside.length === 1 && inside[0]?.name === county.name
}

// A kommune name that two fylker share carries its fylke: "Våler (Innlandet)".
export function municipalityLabel(m: MunicipalityDto, places: Places): string {
	const shared = places.municipalities.some((o) => o.number !== m.number && o.name === m.name)
	if (!shared) return m.name
	const county = places.counties.find((c) => c.number === m.countyNumber)?.name ?? m.county
	return `${m.name} (${county})`
}

// The chip label for a picked place, or null when the catalog has no such place.
export function placeLabel(places: Places, key: string): string | null {
	const [kind, number] = key.split(":")
	if (kind === "county") return places.counties.find((c) => c.number === number)?.name ?? null
	if (kind !== "municipality") return null
	const m = places.municipalities.find((x) => x.number === number)
	return m ? municipalityLabel(m, places) : null
}

// Fylker, then kommuner, each in nb order. withRows null means the rows have not loaded yet, and
// then every catalog kommune is offered. Matching folds diacritics both ways, so "lot" finds
// Løten and "Loten" does too.
export function placeOptions(
	catalog: Pick<Catalog, "municipalities" | "counties" | "aliases">,
	withRows: ReadonlySet<number> | null,
	input: string
): PlaceOptionGroups {
	const typed = input.trim()
	const matches = (name: string) => typed === "" || matchesEitherWay(typed, name)
	const listed = catalog.municipalities.filter((m) => withRows === null || withRows.has(m.id))
	const counties = catalog.counties
		.filter((c) => listed.some((m) => m.countyNumber === c.number))
		.filter((c) => !isOneKommune(c, catalog.municipalities) && matches(c.name))
		.map((c) => ({ key: `county:${c.number}`, label: c.name }))
	const municipalities = listed
		.filter((m) => matches(m.name))
		.map((m) => ({ key: `municipality:${m.number}`, label: municipalityLabel(m, catalog) }))
	// Aliases wait for two letters, so an empty field never lists every tettsted (filter spec).
	if (fold(typed).length >= 2) {
		for (const a of catalog.aliases) {
			const m = listed.find((x) => x.number === a.number)
			if (m && matchesEitherWay(typed, a.alias)) {
				municipalities.push({
					key: `alias:${a.number}:${a.alias}`,
					label: `${municipalityLabel(m, catalog)} (${a.alias})`,
				})
			}
		}
	}
	return { counties: counties.sort(byLabel), municipalities: municipalities.sort(byLabel) }
}

export function selectedPlaceKeys(filters: Pick<Filters, "counties" | "municipalities">): string[] {
	return [
		...filters.counties.map((number) => `county:${number}`),
		...filters.municipalities.map((number) => `municipality:${number}`),
	]
}

// The Sted field's keys back to filter state. An alias key picks its kommune. applyPatch sorts
// and dedupes, so an alias for a kommune that is already picked changes nothing.
export function placePatch(keys: readonly string[]): Pick<Filters, "counties" | "municipalities"> {
	const counties: string[] = []
	const municipalities: string[] = []
	for (const key of keys) {
		const [kind, number] = key.split(":")
		if (!number) continue
		if (kind === "county") counties.push(number)
		else if (kind === "municipality" || kind === "alias") municipalities.push(number)
	}
	return { counties, municipalities }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/placeOptions.test.ts`
Expected: PASS, 17 tests.

- [ ] **Step 5: Format, check, commit**

```bash
npx biome check --write src/services/placeOptions.ts tests/placeOptions.test.ts
npm test && npm run typecheck
git add src/services/placeOptions.ts tests/placeOptions.test.ts
git commit -m "feat(web): Sted options for fylker, kommuner and town aliases"
```

---

### Task 2: The active filter chips service

**Files:**
- Create: `web/src/services/activeFilters.ts`
- Modify: `web/tests/filterFixture.ts` (add a shared `catalog`)
- Modify: `web/src/i18n/nb.json`, `web/src/i18n/en.json`
- Test: `web/tests/activeFilters.test.ts`

**Interfaces:**
- Consumes: `placeLabel` (Task 1), `Filters`, `Feature` from `src/services/filters.ts`,
  `translate(lang, key)` from `src/i18n/LanguageProvider.tsx`.
- Produces:
  - `type ActiveChip = { id: string; label: string; remove: Partial<Filters> }`
  - `activeFilters(filters: Filters, places: Pick<Catalog, "municipalities" | "counties">, t: (key: string) => string): ActiveChip[]`
  - `FEATURE_LABEL_KEYS: Record<Feature, string>`, `costLabelKey(cost: ResourceCost): string`,
    `categoryLabelKey(slug: string): string` (Task 7 labels the facets with these).
  - Chip ids: `county:34`, `municipality:3403`, `national`, `category:<slug>`,
    `feature:<feature>`, `cost:<cost>`.
  - `catalog: Catalog` exported from `tests/filterFixture.ts` (Oslo, Hamar, Ringsaker; fylker 03
    Oslo and 34 Innlandet), used by Tasks 4 to 8.
  - i18n keys `filter.chip.nationalExclude`, `filter.chip.nationalOnly` (Call C2).

- [ ] **Step 1: Add the shared catalog to the fixture**

In `web/tests/filterFixture.ts`, add to the imports:

```ts
import type { Catalog } from "../src/services/data.ts"
```

and append at the end of the file:

```ts
// The catalog the component tests share: today's two fylker and the three kommuner above.
export const catalog: Catalog = {
	municipalities: places,
	categories: [],
	kommuner: [],
	counties: [
		{ number: "03", name: "Oslo" },
		{ number: "34", name: "Innlandet" },
	],
	aliases: [],
}
```

- [ ] **Step 2: Write the failing test**

`web/tests/activeFilters.test.ts`:

```ts
import { describe, expect, test } from "vitest"
import { translate } from "../src/i18n/LanguageProvider.tsx"
import { activeFilters } from "../src/services/activeFilters.ts"
import { applyPatch } from "../src/services/filters.ts"
import { catalog, f } from "./filterFixture.ts"

const nb = (key: string) => translate("nb", key)
const en = (key: string) => translate("en", key)
const everything = f({
	search: "krise",
	counties: ["34"],
	municipalities: ["0301", "3403"],
	national: "exclude",
	categories: ["bolig", "rus"],
	features: ["lavterskel", "dognapent"],
	costs: ["free", "paid"],
})

describe("activeFilters", () => {
	test("one chip per value, in URL param order, and none for the search text", () => {
		expect(activeFilters(everything, catalog, nb).map((c) => c.label)).toEqual([
			"Innlandet",
			"Oslo",
			"Hamar",
			"Skjul nasjonale",
			"Bolig",
			"Rus og avhengighet",
			"Lavterskel",
			"Døgnåpent",
			"Gratis",
			"Koster penger",
		])
	})

	// Call C1: the Egenskaper and Pris chips read the card badge strings.
	test("English labels come from the same keys", () => {
		expect(activeFilters(everything, catalog, en).map((c) => c.label)).toEqual([
			"Innlandet",
			"Oslo",
			"Hamar",
			"Hide national",
			"Housing",
			"Substance use and addiction",
			"No referral",
			"Open 24/7",
			"Free",
			"Costs money",
		])
	})

	test("each chip's patch removes its own value and nothing else", () => {
		const ids = activeFilters(everything, catalog, nb).map((c) => c.id)
		for (const chip of activeFilters(everything, catalog, nb)) {
			const next = applyPatch(everything, chip.remove)
			expect(activeFilters(next, catalog, nb).map((c) => c.id)).toEqual(
				ids.filter((id) => id !== chip.id)
			)
			expect(next.search).toBe("krise")
		}
	})

	test.each([
		["include", []],
		["exclude", ["Skjul nasjonale"]],
		["only", ["Bare nasjonale"]],
	] as const)("national %s gives %j", (national, labels) => {
		expect(activeFilters(f({ national }), catalog, nb).map((c) => c.label)).toEqual(labels)
	})

	test("Bare nasjonale reads National only in English", () => {
		expect(activeFilters(f({ national: "only" }), catalog, en).map((c) => c.label)).toEqual([
			"National only",
		])
	})

	test("a place the catalog lacks gets no chip", () => {
		expect(activeFilters(f({ counties: ["99"], municipalities: ["9999"] }), catalog, nb)).toEqual(
			[]
		)
	})

	test("search text alone gives no chip", () => {
		expect(activeFilters(f({ search: "rus" }), catalog, nb)).toEqual([])
	})
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run tests/activeFilters.test.ts`
Expected: FAIL, "Failed to resolve import ../src/services/activeFilters.ts".

- [ ] **Step 4: Add the copy**

In `web/src/i18n/nb.json`, directly after the line `"filter.heading": "Filtre",` insert:

```json
	"filter.chip.nationalExclude": "Skjul nasjonale",
	"filter.chip.nationalOnly": "Bare nasjonale",
```

In `web/src/i18n/en.json`, directly after `"filter.heading": "Filters",` insert:

```json
	"filter.chip.nationalExclude": "Hide national",
	"filter.chip.nationalOnly": "National only",
```

- [ ] **Step 5: Write the implementation**

`web/src/services/activeFilters.ts`:

```ts
import type { ResourceCost } from "../types/api.ts"
import type { Catalog } from "./data.ts"
import type { Feature, Filters } from "./filters.ts"
import { placeLabel } from "./placeOptions.ts"

// A facet and a card badge never use two words for one thing (filter spec, Copy), so the
// Egenskaper and Pris options and chips read the badge strings.
export const FEATURE_LABEL_KEYS: Record<Feature, string> = {
	lavterskel: "badge.lowThreshold",
	dognapent: "badge.alwaysOpen",
}
export const costLabelKey = (cost: ResourceCost) => `badge.cost.${cost}`
export const categoryLabelKey = (slug: string) => `category.${slug}`

export type ActiveChip = { id: string; label: string; remove: Partial<Filters> }

function without<T>(values: readonly T[], value: T): T[] {
	return values.filter((v) => v !== value)
}

// One chip per active value, in URL param order (filter spec, ActiveFilters). Ta med is the
// default and has no chip, and the search text has none either, because its own field shows it.
// A place the catalog lacks gets no chip; resolveFilters has already dropped it from the list.
export function activeFilters(
	filters: Filters,
	places: Pick<Catalog, "municipalities" | "counties">,
	t: (key: string) => string
): ActiveChip[] {
	const chips: ActiveChip[] = []
	for (const number of filters.counties) {
		const id = `county:${number}`
		const label = placeLabel(places, id)
		if (label) chips.push({ id, label, remove: { counties: without(filters.counties, number) } })
	}
	for (const number of filters.municipalities) {
		const id = `municipality:${number}`
		const label = placeLabel(places, id)
		if (label) {
			chips.push({ id, label, remove: { municipalities: without(filters.municipalities, number) } })
		}
	}
	if (filters.national !== "include") {
		chips.push({
			id: "national",
			label: t(
				filters.national === "only" ? "filter.chip.nationalOnly" : "filter.chip.nationalExclude"
			),
			remove: { national: "include" },
		})
	}
	for (const slug of filters.categories) {
		chips.push({
			id: `category:${slug}`,
			label: t(categoryLabelKey(slug)),
			remove: { categories: without(filters.categories, slug) },
		})
	}
	for (const feature of filters.features) {
		chips.push({
			id: `feature:${feature}`,
			label: t(FEATURE_LABEL_KEYS[feature]),
			remove: { features: without(filters.features, feature) },
		})
	}
	for (const cost of filters.costs) {
		chips.push({
			id: `cost:${cost}`,
			label: t(costLabelKey(cost)),
			remove: { costs: without(filters.costs, cost) },
		})
	}
	return chips
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/activeFilters.test.ts tests/i18n.test.tsx`
Expected: PASS (the i18n parity test proves both files got both keys).

- [ ] **Step 7: Format, check, commit**

```bash
npx biome check --write src/services/activeFilters.ts tests/activeFilters.test.ts tests/filterFixture.ts src/i18n/nb.json src/i18n/en.json
npm test && npm run typecheck
git add src/services/activeFilters.ts tests/activeFilters.test.ts tests/filterFixture.ts src/i18n/nb.json src/i18n/en.json
git commit -m "feat(web): one chip per active filter, in URL order"
```

---

### Task 3: Counts in the ready state, and a status region a modal never hides

**Files:**
- Modify: `web/src/hooks/useResources.ts`
- Modify: `web/src/components/StatusRegion.tsx`
- Test: `web/tests/list.test.tsx`, `web/tests/announcer.test.tsx`,
  `web/tests/errorRecovery.test.tsx`

**Interfaces:**
- Consumes: `facetCounts`, `FacetCounts` from `src/services/facets.ts`; `kommunerWithRows`
  (Task 1).
- Produces:
  - `type FilterResult = { data: PagedResult<ResourceDto>; counts: FacetCounts; withRows: ReadonlySet<number> }`
  - `type ResourcesState = { kind: "loading" } | { kind: "error" } | ({ kind: "ready" } & FilterResult)`
  - `useResources(filters, lang)` keeps its signature.
  - The status region carries `data-live-announcer="true"`. Tests find it with
    `document.querySelector("[data-live-announcer]")` from here on (Verified fact 8).

- [ ] **Step 1: Write the failing tests**

Add to `web/tests/list.test.tsx`, after the test "once the index is cached, filtering ... never
re-enters loading":

```tsx
test("the ready state carries the facet counts and the kommuner that have rows", async () => {
	stubDataFiles({ resources: [resource], municipalities, categories: [] })
	const { result } = renderHook(() => useResources(EMPTY_FILTERS, "nb"))
	await waitFor(() => expect(result.current.state.kind).toBe("ready"))
	const state = result.current.state
	if (state.kind !== "ready") throw new Error("not ready")
	// The one row is a local Hamar Nødtjenester row.
	expect(state.counts.categories.nodtjenester).toBe(1)
	expect(state.counts.national).toEqual({ include: 1, exclude: 1, only: 0 })
	expect([...state.withRows]).toEqual([1])
})
```

In the same file, in the test "typing debounces the announced result count", change

```tsx
	const region = document.querySelector("[aria-live]") as HTMLElement
```

to

```tsx
	// A chips grid carries aria-live too (react-aria's TagGroup), so find the status region itself.
	const region = document.querySelector("[data-live-announcer]") as HTMLElement
```

In `web/tests/errorRecovery.test.tsx`, in "a failed fetch is announced in the live region",
change `document.querySelector("[aria-live]")` to
`document.querySelector("[data-live-announcer]")`.

Add to `web/tests/announcer.test.tsx` (add the import at the top):

```tsx
import { Dialog, Modal, ModalOverlay } from "react-aria-components"
```

```tsx
// aria-hidden in jsdom, inert in a browser: react-aria's Modal uses whichever the platform has.
function hiddenFromScreenReaders(el: Element | null): boolean {
	for (let node = el; node; node = node.parentElement) {
		if (node.getAttribute("aria-hidden") === "true" || (node as HTMLElement).inert) return true
	}
	return false
}

test("an open modal leaves the status region audible", async () => {
	render(
		<AnnouncerProvider>
			<p>Bak dialogen</p>
			<ModalOverlay isOpen>
				<Modal>
					<Dialog aria-label="Prøve">Innhold</Dialog>
				</Modal>
			</ModalOverlay>
		</AnnouncerProvider>
	)
	await screen.findByRole("dialog")
	// The control: the modal did hide what sits outside it.
	expect(hiddenFromScreenReaders(screen.getByText("Bak dialogen"))).toBe(true)
	expect(hiddenFromScreenReaders(document.querySelector("[aria-live]"))).toBe(false)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/list.test.tsx tests/announcer.test.tsx tests/errorRecovery.test.tsx`
Expected: FAIL. The ready-state test fails on `state.counts` being undefined (and typecheck
would report it), the modal test fails because the region is hidden, and the two selector
tests fail because no element has `data-live-announcer` yet.

- [ ] **Step 3: Write the implementation**

Replace the top of `web/src/hooks/useResources.ts`, from the imports down to and including
`readyFromCache`, with:

```ts
import { useEffect, useState } from "react"
import type { Lang } from "../i18n/LanguageProvider.tsx"
import { clearIndexCache, type Index, loadIndex, peekIndex } from "../services/data.ts"
import { type FacetCounts, facetCounts } from "../services/facets.ts"
import { type Filters, resolveFilters } from "../services/filters.ts"
import { kommunerWithRows } from "../services/placeOptions.ts"
import { applyFilters } from "../services/query.ts"
import { loadRows } from "../services/rows.ts"
import type { PagedResult, ResourceDto } from "../types/api.ts"

// One filter state's answer: the page of results, the facet counts and the kommuner that have
// rows (the Sted list offers only those). Counts exist only here, so while rows load there are
// none to render (filter spec, Loading and failure).
export type FilterResult = {
	data: PagedResult<ResourceDto>
	counts: FacetCounts
	withRows: ReadonlySet<number>
}

export type ResourcesState =
	| { kind: "loading" }
	| { kind: "error" }
	| ({ kind: "ready" } & FilterResult)

// The kommuner with rows depend on the index alone, so I work them out once per index and not
// on every keystroke. They read every row, not loadRows: once spec B loads only the picked
// places' rows, the Sted list must still offer the others, and spec B then owns this list.
const withRowsByIndex = new WeakMap<Index, ReadonlySet<number>>()
function withRowsOf(index: Index): ReadonlySet<number> {
	let ids = withRowsByIndex.get(index)
	if (!ids) {
		ids = kommunerWithRows(index.resources)
		withRowsByIndex.set(index, ids)
	}
	return ids
}

// An old link's places resolve against the index before matching, so ?municipality=1 still
// finds Hamar on the very first render. Filtering and counting read the same rows.
function compute(index: Index, filters: Filters): FilterResult {
	const resolved = resolveFilters(filters, index.municipalities, index.counties)
	const rows = loadRows(index, resolved)
	return {
		data: applyFilters(rows, resolved, index.municipalities),
		counts: facetCounts(rows, resolved, index.municipalities),
		withRows: withRowsOf(index),
	}
}

// When the index is already settled, filtering is pure computation over data already in
// memory. That is what lets a filter change (every keystroke in the search box, say) apply
// synchronously below, instead of round-tripping through a "loading" state for a fetch that
// never happens.
function readyFromCache(lang: Lang, filters: Filters): ResourcesState | null {
	const index = peekIndex(lang)
	return index ? { kind: "ready", ...compute(index, filters) } : null
}
```

In the effect below it, change

```ts
				if (!cancelled) setState({ kind: "ready", data: compute(index, filters) })
```

to

```ts
				if (!cancelled) setState({ kind: "ready", ...compute(index, filters) })
```

In `web/src/components/StatusRegion.tsx`, replace the two comment lines and the `<div>` at the
end of `AnnouncerProvider` with:

```tsx
			{/* The app's single aria-live region: every async announcement funnels here. */}
			{/* `top-0`: without it this absolute 1 px box sits after the `min-h-dvh` shell and adds 1 px of
			    scroll to every page (the landing fit test catches it). */}
			{/* data-live-announcer="true" keeps this region audible while a react-aria Modal or an
			    open ComboBox hides the rest of the page (ariaHideOutside). Its first pass skips
			    any element with the attribute, but its MutationObserver checks for the value
			    "true", so the value matters (react-aria/dist/private/overlays/ariaHideOutside.mjs).
			    That is how the filter dialog's count announcement stays audible without a second
			    region inside the dialog (filter spec, FacetPanel). */}
			<div aria-live="polite" data-live-announcer="true" className="visually-hidden top-0">
				{message}
			</div>
```

(The first comment line had an em dash; it is a colon now.)

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/list.test.tsx tests/announcer.test.tsx tests/errorRecovery.test.tsx`
Expected: PASS.

- [ ] **Step 5: Format, check, commit**

```bash
npx biome check --write src/hooks/useResources.ts src/components/StatusRegion.tsx tests/list.test.tsx tests/announcer.test.tsx tests/errorRecovery.test.tsx
npm test && npm run typecheck
git add src/hooks/useResources.ts src/components/StatusRegion.tsx tests/list.test.tsx tests/announcer.test.tsx tests/errorRecovery.test.tsx
git commit -m "feat(web): facet counts in the ready state; the status region survives a modal"
```

---

### Task 4: FacetGroup and the option row

**Files:**
- Create: `web/src/components/FacetGroup.tsx`
- Modify: `web/src/styles/main.css`, `web/src/i18n/nb.json`, `web/src/i18n/en.json`
- Test: `web/tests/facetGroup.test.tsx`

**Interfaces:**
- Consumes: `fill` from `src/i18n/fill.ts`.
- Produces:
  - `type FacetChoice<T extends string> = { value: T; label: string }`
  - `FacetOption(props: { type: "checkbox" | "radio"; name?: string; label: string; count: number | null; checked: boolean; onChange: () => void })`
    (Task 6 builds the national radio from it).
  - `FacetGroup<T extends string>(props: { legend: string; options: readonly FacetChoice<T>[]; checked: readonly T[]; counts: Readonly<Record<T, number>> | null; defaultOpen: boolean; onToggle: (value: T) => void })`
  - CSS classes `.facet-group`, `.facet-summary-end`, `.facet-ticked`, `.facet-chevron`,
    `.facet-fieldset`, `.facet-option`, `.facet-input`, `.facet-label`, `.facet-count`.
  - i18n key `filter.ticked`.

- [ ] **Step 1: Write the failing test**

`web/tests/facetGroup.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactElement } from "react"
import { describe, expect, test, vi } from "vitest"
import { axe } from "vitest-axe"
import { FacetGroup, FacetOption } from "../src/components/FacetGroup.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import type { Lang } from "../src/services/urlState.ts"

const options = [
	{ value: "rus", label: "Rus og avhengighet" },
	{ value: "bolig", label: "Bolig" },
	{ value: "okonomi", label: "Økonomi og gjeld" },
]
const counts = { rus: 12, bolig: 3, okonomi: 0 }
const axeOptions = { rules: { "color-contrast": { enabled: false } } }

function group({
	checked = [],
	withCounts = true,
	defaultOpen = true,
	onToggle = vi.fn(),
}: {
	checked?: string[]
	withCounts?: boolean
	defaultOpen?: boolean
	onToggle?: (value: string) => void
} = {}): ReactElement {
	return (
		<FacetGroup
			legend="Kategorier"
			options={options}
			checked={checked}
			counts={withCounts ? counts : null}
			defaultOpen={defaultOpen}
			onToggle={onToggle}
		/>
	)
}

const inLang = (lang: Lang, ui: ReactElement) => <LanguageProvider lang={lang}>{ui}</LanguageProvider>

test("the group is a fieldset named by its legend, and each count is part of its option's name", () => {
	render(inLang("nb", group()))
	const groups = screen.getAllByRole("group", { name: "Kategorier" })
	expect(groups.map((g) => g.tagName)).toContain("FIELDSET")
	expect(screen.getByRole("checkbox", { name: "Rus og avhengighet, 12" })).not.toBeChecked()
	// A 0 stays visible and enabled, so nothing jumps and nothing is hidden (filter spec).
	expect(screen.getByRole("checkbox", { name: "Økonomi og gjeld, 0" })).toBeEnabled()
})

test("with no counts yet, no number renders and the names are the bare labels", () => {
	render(inLang("nb", group({ withCounts: false })))
	expect(screen.getByRole("checkbox", { name: "Rus og avhengighet" })).toBeInTheDocument()
	expect(screen.queryByText("12")).not.toBeInTheDocument()
	expect(screen.queryByText("0")).not.toBeInTheDocument()
})

test("ticking a box hands its value to onToggle", async () => {
	const onToggle = vi.fn()
	render(inLang("nb", group({ onToggle })))
	await userEvent.click(screen.getByRole("checkbox", { name: "Bolig, 3" }))
	expect(onToggle).toHaveBeenCalledWith("bolig")
})

// Review Focus 1: the boxes are the URL's, so Back and Forward re-tick them.
test("the boxes follow the props on every render", () => {
	const view = render(inLang("nb", group({ checked: ["bolig"] })))
	expect(screen.getByRole("checkbox", { name: "Bolig, 3" })).toBeChecked()
	view.rerender(inLang("nb", group({ checked: [] })))
	expect(screen.getByRole("checkbox", { name: "Bolig, 3" })).not.toBeChecked()
	view.rerender(inLang("nb", group({ checked: ["rus", "bolig"] })))
	expect(screen.getByRole("checkbox", { name: "Rus og avhengighet, 12" })).toBeChecked()
})

test("the summary says how many options are ticked, in both languages", () => {
	const view = render(inLang("nb", group({ checked: ["rus", "bolig"] })))
	expect(screen.getByText("2 valgt")).toBeInTheDocument()
	view.rerender(inLang("en", group({ checked: ["rus", "bolig"] })))
	expect(screen.getByText("2 selected")).toBeInTheDocument()
	view.rerender(inLang("nb", group()))
	expect(screen.queryByText(/valgt/)).not.toBeInTheDocument()
})

test("defaultOpen decides whether the group starts open", () => {
	const view = render(inLang("nb", group({ defaultOpen: false })))
	expect(view.container.querySelector("details")?.open).toBe(false)
	view.unmount()
	const open = render(inLang("nb", group({ defaultOpen: true })))
	expect(open.container.querySelector("details")?.open).toBe(true)
})

test("FacetOption radios share their name and carry their count", () => {
	render(
		<fieldset>
			<legend>Nasjonale tjenester</legend>
			<FacetOption type="radio" name="n" label="Ta med" count={5} checked onChange={vi.fn()} />
			<FacetOption type="radio" name="n" label="Skjul" count={4} checked={false} onChange={vi.fn()} />
		</fieldset>
	)
	expect(screen.getByRole("radio", { name: "Ta med, 5" })).toBeChecked()
	expect(screen.getByRole("radio", { name: "Skjul, 4" })).toHaveAttribute("name", "n")
})

describe.each(["nb", "en"] as const)("%s", (lang) => {
	test("has no axe violations", async () => {
		const { container } = render(inLang(lang, group({ checked: ["rus"] })))
		expect(await axe(container, axeOptions)).toHaveNoViolations()
	})
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/facetGroup.test.tsx`
Expected: FAIL, "Failed to resolve import ../src/components/FacetGroup.tsx".

- [ ] **Step 3: Add the copy**

`web/src/i18n/nb.json`, directly after `"filter.heading": "Filtre",`:

```json
	"filter.ticked": "{n} valgt",
```

`web/src/i18n/en.json`, directly after `"filter.heading": "Filters",`:

```json
	"filter.ticked": "{n} selected",
```

- [ ] **Step 4: Write the component**

`web/src/components/FacetGroup.tsx`:

```tsx
import { fill } from "../i18n/fill.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"

export type FacetChoice<T extends string> = { value: T; label: string }

// One option: a native control, its label, and the count once rows have loaded. The comma is
// hidden text at the end of the label's span and a real space sits between that span and the
// count, so a screen reader hears "Rus og avhengighet, 12" (filter spec, Accessibility and look).
// A space inside the hidden span is trimmed away by the name computation ("Rus og
// avhengighet,12" in jsdom), and the flex row drops the outer one visually.
export function FacetOption({
	type,
	name,
	label,
	count,
	checked,
	onChange,
}: {
	type: "checkbox" | "radio"
	name?: string
	label: string
	count: number | null
	checked: boolean
	onChange: () => void
}) {
	return (
		<label className="facet-option">
			<input
				type={type}
				name={name}
				checked={checked}
				onChange={onChange}
				className="facet-input"
			/>
			<span className="facet-label">
				{label}
				{count !== null && <span className="hidden-inline">,</span>}
			</span>
			{count !== null && (
				<>
					{" "}
					<span className="facet-count">{count}</span>
				</>
			)}
		</label>
	)
}

// One facet group (filter spec, FacetGroup). The summary is what a sighted user reads and
// clicks; the legend repeats it for a screen reader, which hears the group before each option.
// With counts null (rows still loading) no count renders at all, because a "0" would read as
// "nothing here". The ticked count shows in the summary, so a closed group still tells.
export function FacetGroup<T extends string>({
	legend,
	options,
	checked,
	counts,
	defaultOpen,
	onToggle,
}: {
	legend: string
	options: readonly FacetChoice<T>[]
	checked: readonly T[]
	counts: Readonly<Record<T, number>> | null
	defaultOpen: boolean
	onToggle: (value: T) => void
}) {
	const t = useTranslation()
	const ticked = options.filter((o) => checked.includes(o.value)).length
	return (
		<details className="facet-group" open={defaultOpen}>
			<summary>
				<span>{legend}</span>
				<span className="facet-summary-end">
					{ticked > 0 && (
						<span className="facet-ticked">{fill(t("filter.ticked"), { n: ticked })}</span>
					)}
					<span aria-hidden="true" className="facet-chevron">
						▾
					</span>
				</span>
			</summary>
			<fieldset className="facet-fieldset">
				<legend className="visually-hidden">{legend}</legend>
				{options.map((o) => (
					<FacetOption
						key={o.value}
						type="checkbox"
						label={o.label}
						count={counts ? (counts[o.value] ?? 0) : null}
						checked={checked.includes(o.value)}
						onChange={() => onToggle(o.value)}
					/>
				))}
			</fieldset>
		</details>
	)
}
```

- [ ] **Step 5: Add the styles**

In `web/src/styles/main.css`, inside `@layer components`, just before its closing brace (the
last line of the file), add:

```css
	/* The /sok facets (filter spec, FacetGroup). Every option is a 44 px row: the control, its
	   label in the text colour, and the count pushed right, muted and tabular, so a label and its
	   count never read as one value. The summary is heavier than the options. */
	.facet-group > summary {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 2.75rem;
		cursor: pointer;
		font-weight: 600;
		list-style: none;
	}
	.facet-group > summary::-webkit-details-marker {
		display: none;
	}
	.facet-summary-end {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-inline-start: auto;
	}
	.facet-ticked {
		color: var(--muted);
		font-size: 0.875rem;
		font-weight: 500;
	}
	.facet-chevron {
		color: var(--muted);
	}
	.facet-group[open] .facet-chevron {
		rotate: 180deg;
	}
	/* A fieldset is min-content wide by default and Preflight does not reset it, so one long
	   label could push the page sideways at 200 % text. */
	.facet-fieldset {
		display: grid;
		min-inline-size: 0;
	}
	.facet-option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-height: 2.75rem;
		cursor: pointer;
	}
	.facet-input {
		flex-shrink: 0;
		inline-size: 1.25rem;
		block-size: 1.25rem;
		accent-color: var(--accent);
	}
	.facet-label {
		min-inline-size: 0;
		color: var(--text);
		overflow-wrap: anywhere;
	}
	.facet-count {
		margin-inline-start: auto;
		color: var(--muted);
		font-size: 0.875rem;
		font-variant-numeric: tabular-nums;
	}
	/* Forced colours drop fills and shadows. Native boxes and radios keep their system look, and
	   the focus ring is an outline, which forced colours paints in a system colour. */
	@media (forced-colors: active) {
		.facet-input {
			forced-color-adjust: auto;
		}
		.facet-input:focus-visible {
			outline: 3px solid Highlight;
		}
	}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run tests/facetGroup.test.tsx tests/i18n.test.tsx`
Expected: PASS.

If the first test reports more than one group named "Kategorier", that is the `<details>`
taking the summary as its name; the `toContain("FIELDSET")` form already allows it.

- [ ] **Step 7: Format, check, commit**

```bash
npx biome check --write src/components/FacetGroup.tsx src/styles/main.css tests/facetGroup.test.tsx src/i18n/nb.json src/i18n/en.json
npm test && npm run typecheck
git add src/components/FacetGroup.tsx src/styles/main.css tests/facetGroup.test.tsx src/i18n/nb.json src/i18n/en.json
git commit -m "feat(web): facet groups with counts in each option's name"
```

---

### Task 5: The Sted field

**Files:**
- Create: `web/src/hooks/useChipFocus.ts`
- Create: `web/src/components/FilterChip.tsx`
- Create: `web/src/components/PlaceField.tsx`
- Modify: `web/src/styles/main.css`, `web/src/i18n/nb.json`, `web/src/i18n/en.json`
- Test: `web/tests/placeField.test.tsx`

**Interfaces:**
- Consumes: `placeOptions`, `placeLabel`, `placePatch`, `selectedPlaceKeys`, `PlaceOption`
  (Task 1); `catalog`, `f` from `tests/filterFixture.ts` (Task 2); `applyPatch`.
- Produces:
  - `useChipFocus(count: number, fallback: () => void): { listRef: RefObject<HTMLDivElement | null>; removing: (index: number) => void }`
  - `FilterChip(props: { id: string; label: string })`: one react-aria `Tag` with a remove
    button that react-aria names `Fjern <label>` / `Remove <label>` itself (its localised
    "Fjern" plus the row's `textValue`, through `aria-labelledby`). Task 8 reuses it.
  - `PlaceField(props: { catalog: Catalog; withRows: ReadonlySet<number> | null; filters: Filters; onPatch: (patch: Partial<Filters>) => void })`
  - DOM contract the e2e relies on: the combobox is named "Sted" / "Place"; the bordered
    control is `.place-group`; its chips grid is named "Sted" / "Place"; the label is
    `.place-field .field-label`.
  - CSS classes `.field-label`, `.place-field`, `.place-group`, `.place-input`, `.place-option`,
    `.place-check`, `.filter-chip`, `.filter-chip-label`, `.filter-chip-remove`.
  - i18n keys `filter.place`, `filter.placePlaceholder`, `filter.counties`,
    `filter.municipalities`. No `filter.remove`: an `aria-label` on the remove button loses to
    react-aria's `aria-labelledby` and reads "Fjern Hamar Hamar" (Verified fact 14).

Read the long comments in `src/components/MunicipalityCombobox.tsx` before starting. Two of its
traps carry over and are kept (and their comments moved here): `items` plus a pass-through
`defaultFilter`, and `data-react-aria-top-layer` on the Group, now set only while the list is
open (Verified fact 15). Its third trap (a controlled `inputValue` that nothing resets) is
avoided by not controlling `inputValue` at all (Verified facts 3 and 4). Two new ones: the chips
sit inside `ComboBoxValue`, never directly in the ComboBox (Verified fact 13), and the chip's
remove button carries no `aria-label` of its own (Verified fact 14). The code below was run on
09.11.2026 in a scratch copy of main with the installed packages: the 11 tests pass.

- [ ] **Step 1: Write the failing test**

`web/tests/placeField.test.tsx`:

```tsx
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { type ReactNode, useState } from "react"
import { describe, expect, test, vi } from "vitest"
import { axe } from "vitest-axe"
import { PlaceField } from "../src/components/PlaceField.tsx"
import { AnnouncerProvider } from "../src/components/StatusRegion.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import type { Catalog } from "../src/services/data.ts"
import { applyPatch, type Filters } from "../src/services/filters.ts"
import type { Lang } from "../src/services/urlState.ts"
import { catalog as fixture, f } from "./filterFixture.ts"

// The shared fixture (Oslo, Hamar, Ringsaker) plus Løten for the diacritics, and one made-up
// alias row (aliases.json ships empty).
const catalog: Catalog = {
	...fixture,
	municipalities: [
		...fixture.municipalities,
		{ id: 6, name: "Løten", county: "Innlandet", number: "3412", countyNumber: "34" },
	],
	aliases: [{ alias: "Brumunddal", number: "3411", source: "test fixture" }],
}
const axeOptions = { rules: { "color-contrast": { enabled: false } } }

function Wrapper({ lang = "nb", children }: { lang?: Lang; children: ReactNode }) {
	return (
		<LanguageProvider lang={lang}>
			<AnnouncerProvider>{children}</AnnouncerProvider>
		</LanguageProvider>
	)
}

function renderField(filters: Partial<Filters> = {}, lang: Lang = "nb") {
	const onPatch = vi.fn()
	const ui = (next: Partial<Filters>) => (
		<Wrapper lang={lang}>
			<PlaceField catalog={catalog} withRows={null} filters={f(next)} onPatch={onPatch} />
		</Wrapper>
	)
	const view = render(ui(filters))
	return { onPatch, container: view.container, rerenderWith: (next: Partial<Filters>) => view.rerender(ui(next)) }
}

// Stands in for ListPage: every patch goes through applyPatch, as the URL would.
function Stateful({ initial }: { initial: Partial<Filters> }) {
	const [filters, setFilters] = useState(f(initial))
	return (
		<Wrapper>
			<PlaceField
				catalog={catalog}
				withRows={null}
				filters={filters}
				onPatch={(patch) => setFilters((current) => applyPatch(current, patch))}
			/>
		</Wrapper>
	)
}

const sted = () => screen.getByRole("combobox", { name: "Sted" })
const chipLabels = () =>
	[...document.querySelectorAll(".place-group .filter-chip-label")].map((el) => el.textContent)
const chipRow = (label: string) =>
	screen.getByText(label, { selector: ".filter-chip-label" }).closest<HTMLElement>('[role="row"]')

// A section header labels its group through aria-labelledby, so a missing or unlabelled group
// shows up as a missing or empty entry.
function groupNames(): string[] {
	return screen.getAllByRole("group").map((group) => {
		const id = group.getAttribute("aria-labelledby")
		return (id && document.getElementById(id)?.textContent) || ""
	})
}
const optionNames = () => screen.getAllByRole("option").map((option) => option.textContent ?? "")

test("focus opens the list: Fylker, then Kommuner, each in nb order, Oslo once as the kommune", async () => {
	const user = userEvent.setup()
	renderField()
	await user.click(sted())
	await screen.findByRole("listbox")
	expect(groupNames()).toEqual(["Fylker", "Kommuner"])
	expect(optionNames()).toEqual(["Innlandet", "Hamar", "Løten", "Oslo", "Ringsaker"])
})

test("typing folds diacritics, Enter picks, the list stays open and the text clears", async () => {
	const user = userEvent.setup()
	const { onPatch, rerenderWith } = renderField()
	await user.type(sted(), "lot")
	expect(await screen.findByRole("option", { name: "Løten" })).toBeInTheDocument()
	expect(screen.queryByRole("option", { name: "Hamar" })).not.toBeInTheDocument()
	await user.keyboard("{ArrowDown}{Enter}")
	expect(onPatch).toHaveBeenCalledWith({ counties: [], municipalities: ["3412"] })
	// ListPage answers with the new URL, and the field shows it.
	rerenderWith({ municipalities: ["3412"] })
	expect(screen.getByRole("listbox")).toBeInTheDocument()
	expect(sted()).toHaveValue("")
	expect(chipLabels()).toEqual(["Løten"])
})

test("Escape closes the list without picking", async () => {
	const user = userEvent.setup()
	const { onPatch } = renderField()
	await user.type(sted(), "ham")
	await screen.findByRole("listbox")
	await user.keyboard("{Escape}")
	await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument())
	expect(onPatch).not.toHaveBeenCalled()
})

// Review Focus 5.
test("text typed but never picked filters nothing and makes no chip, also after Tab", async () => {
	const user = userEvent.setup()
	const { onPatch } = renderField()
	await user.type(sted(), "ham")
	await screen.findByRole("option", { name: "Hamar" })
	await user.tab()
	expect(onPatch).not.toHaveBeenCalled()
	expect(screen.queryByRole("grid", { name: "Sted" })).not.toBeInTheDocument()
	expect(sted()).toHaveValue("")
})

test("no match shows the coverage note, and its link asks for national services only", async () => {
	const user = userEvent.setup()
	const { onPatch } = renderField()
	await user.type(sted(), "zzz")
	expect(await screen.findByText(/Fant ikke kommunen din/)).toBeInTheDocument()
	await user.click(
		screen.getByRole("button", { name: "Se nasjonale tjenester som gjelder hele landet" })
	)
	expect(onPatch).toHaveBeenCalledWith({ national: "only" })
})

test("a town alias offers its kommune and picks it", async () => {
	const user = userEvent.setup()
	const { onPatch } = renderField()
	await user.type(sted(), "brum")
	expect(await screen.findByRole("option", { name: "Ringsaker (Brumunddal)" })).toBeInTheDocument()
	await user.keyboard("{ArrowDown}{Enter}")
	expect(onPatch).toHaveBeenCalledWith({ counties: [], municipalities: ["3411"] })
})

// Review Focus 1: the chips are the URL's, never the field's own memory.
test("the chips follow the URL, so Back, Forward and every outside change show at once", () => {
	const { rerenderWith } = renderField({ municipalities: ["3403"] })
	expect(chipLabels()).toEqual(["Hamar"])
	rerenderWith({})
	expect(screen.queryByRole("grid", { name: "Sted" })).not.toBeInTheDocument()
	rerenderWith({ counties: ["34"], municipalities: ["0301"] })
	expect(chipLabels()).toEqual(["Innlandet", "Oslo"])
})

test("removing a chip moves focus to the next chip, and the last one to the input", async () => {
	const user = userEvent.setup()
	render(<Stateful initial={{ counties: ["34"], municipalities: ["3403"] }} />)
	expect(chipLabels()).toEqual(["Innlandet", "Hamar"])
	await user.click(screen.getByRole("button", { name: "Fjern Innlandet" }))
	await waitFor(() => expect(chipRow("Hamar")).toHaveFocus())
	await user.click(screen.getByRole("button", { name: "Fjern Hamar" }))
	await waitFor(() => expect(sted()).toHaveFocus())
	expect(document.body).not.toHaveFocus()
})

test("labels and react-aria's own words follow the app's language", async () => {
	// react-aria names the listbox from its own locale bundle. It said Forslag / Suggestions for
	// the single combobox; if multiple mode names it differently, assert what each language
	// gives now. The point is that nb and en differ.
	const user = userEvent.setup()
	renderField({}, "nb")
	await user.click(sted())
	expect(await screen.findByRole("listbox")).toHaveAttribute("aria-label", "Forslag")
	cleanup()
	renderField({ municipalities: ["3403"] }, "en")
	const place = screen.getByRole("combobox", { name: "Place" })
	expect(place).toHaveAttribute("placeholder", "County, municipality or town")
	expect(screen.getByRole("button", { name: "Remove Hamar" })).toBeInTheDocument()
	await user.click(place)
	expect(await screen.findByRole("listbox")).toHaveAttribute("aria-label", "Suggestions")
	expect(groupNames()).toEqual(["Counties", "Municipalities"])
})

describe.each(["nb", "en"] as const)("%s", (lang) => {
	test("has no axe violations, closed and open", async () => {
		const user = userEvent.setup()
		const { container } = renderField({ counties: ["34"], municipalities: ["3403"] }, lang)
		expect(await axe(container, axeOptions)).toHaveNoViolations()
		await user.click(screen.getByRole("combobox"))
		expect(await axe(await screen.findByRole("listbox"), axeOptions)).toHaveNoViolations()
	})
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/placeField.test.tsx`
Expected: FAIL, "Failed to resolve import ../src/components/PlaceField.tsx".

- [ ] **Step 3: Add the copy**

`web/src/i18n/nb.json`, directly after `"filter.heading": "Filtre",`:

```json
	"filter.place": "Sted",
	"filter.placePlaceholder": "Fylke, kommune eller tettsted",
	"filter.counties": "Fylker",
	"filter.municipalities": "Kommuner",
```

`web/src/i18n/en.json`, directly after `"filter.heading": "Filters",`:

```json
	"filter.place": "Place",
	"filter.placePlaceholder": "County, municipality or town",
	"filter.counties": "Counties",
	"filter.municipalities": "Municipalities",
```

- [ ] **Step 4: Write the focus hook**

`web/src/hooks/useChipFocus.ts`:

```ts
import { useEffect, useRef } from "react"

// Where focus goes after a chip is removed (filter spec, Components): to the chip that took its
// place, or the one before it when it was last in the row, and to `fallback` once none are left.
// Never to <body>. react-aria moves focus between the remaining chips by itself, but when the
// last one goes its TagGroup only focuses its own container, and here the TagGroup unmounts with
// that chip, so I let this hook own every case.
export function useChipFocus(count: number, fallback: () => void) {
	const listRef = useRef<HTMLDivElement>(null)
	const pending = useRef<number | null>(null)
	// biome-ignore lint/correctness/useExhaustiveDependencies: count is the trigger; fallback is read when it fires
	useEffect(() => {
		const index = pending.current
		if (index === null) return
		pending.current = null
		if (count === 0) {
			fallback()
			return
		}
		const rows = listRef.current?.querySelectorAll<HTMLElement>('[role="row"]')
		rows?.[Math.min(index, count - 1)]?.focus()
	}, [count])
	return {
		listRef,
		// Called with the removed chip's index, just before the patch that removes it.
		removing: (index: number) => {
			pending.current = index
		},
	}
}
```

- [ ] **Step 5: Write the chip**

`web/src/components/FilterChip.tsx`:

```tsx
import { Button, Tag } from "react-aria-components"

// One removable chip inside a react-aria TagList. The row takes its name from textValue, and
// react-aria names the remove button with its own localised "Fjern" / "Remove" plus that row
// name (aria-labelledby), so a screen reader hears "Fjern Hamar", never a row of identical
// "Fjern" buttons. An aria-label here would be overridden by that aria-labelledby and read
// "Fjern Hamar Hamar".
export function FilterChip({ id, label }: { id: string; label: string }) {
	return (
		<Tag id={id} textValue={label} className="filter-chip">
			<span className="filter-chip-label">{label}</span>
			<Button slot="remove" className="filter-chip-remove">
				<span aria-hidden="true">×</span>
			</Button>
		</Tag>
	)
}
```

- [ ] **Step 6: Write the field**

`web/src/components/PlaceField.tsx`:

```tsx
import { useMemo, useRef, useState } from "react"
import {
	Button,
	ComboBox,
	ComboBoxValue,
	Group,
	Header,
	Input,
	Label,
	ListBox,
	ListBoxItem,
	ListBoxSection,
	Popover,
	TagGroup,
	TagList,
} from "react-aria-components"
import { useChipFocus } from "../hooks/useChipFocus.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import type { Catalog } from "../services/data.ts"
import type { Filters } from "../services/filters.ts"
import {
	type PlaceOption,
	placeLabel,
	placeOptions,
	placePatch,
	selectedPlaceKeys,
} from "../services/placeOptions.ts"
import { FilterChip } from "./FilterChip.tsx"
import { CheckIcon } from "./icons.tsx"

function PlaceItem({ option }: { option: PlaceOption }) {
	return (
		<ListBoxItem id={option.key} textValue={option.label} className="place-option">
			{({ isSelected }) => (
				<>
					<span>{option.label}</span>
					{isSelected && <CheckIcon className="place-check" />}
				</>
			)}
		</ListBoxItem>
	)
}

// The Sted field (filter spec, PlaceBar): one react-aria ComboBox in multiple mode for fylker and
// kommuner. Keyboard, typeahead, group announcements and the popover come from the library; this
// file decides what the options are. Picks show as chips inside the field, and the list stays
// open after a pick, which multiple mode does by itself.
export function PlaceField({
	catalog,
	withRows,
	filters,
	onPatch,
}: {
	catalog: Catalog
	withRows: ReadonlySet<number> | null
	filters: Filters
	onPatch: (patch: Partial<Filters>) => void
}) {
	const t = useTranslation()
	const inputRef = useRef<HTMLInputElement>(null)
	// What is typed, for my own matching. The field itself stays uncontrolled: with inputValue
	// left to react-stately, multiple mode clears the text after every pick and on blur by
	// itself. Passing inputValue would make both of those mine, the trap the old single combobox
	// documented, and typed text that was never picked could linger looking like a filter.
	const [input, setInput] = useState("")
	const picked = selectedPlaceKeys(filters)
	// The picks are the URL's, never this field's own memory, so Back, Forward and every outside
	// change show at once. One string keeps the array's identity stable between renders:
	// react-stately compares `value` by reference, and a new array on every keystroke would read
	// as a new pick and wipe the text being typed.
	const pickedKey = picked.join(" ")
	const value = useMemo(() => (pickedKey ? pickedKey.split(" ") : []), [pickedKey])
	const options = placeOptions(catalog, withRows, input)
	const { listRef, removing } = useChipFocus(picked.length, () => inputRef.current?.focus())
	const remove = (key: string) => {
		removing(picked.indexOf(key))
		onPatch(placePatch(picked.filter((k) => k !== key)))
	}

	return (
		<ComboBox
			className="place-field"
			selectionMode="multiple"
			menuTrigger="focus"
			allowsEmptyCollection
			// `items` is how I tell ComboBox that the list it is given is already filtered: it is
			// the prop react-aria checks before doing any filtering of its own, so `options` stays
			// the single source of truth for what is rendered. It also keeps the collection built
			// from one set of node objects: without it, react-aria swaps its section nodes for
			// plain clones the moment you type, and React 19.2's development-only render logger
			// walks that diff into a `childNodes` getter that throws on purpose, which froze the
			// old combobox in `npm run dev` only. defaultFilter stays as a pass-through in case a
			// future version stops honouring `items`: ComboBox's own filter does not fold ø and æ
			// the way matchesEitherWay does, and would drop matches I just decided to keep.
			items={[...options.counties, ...options.municipalities]}
			defaultFilter={() => true}
			value={value}
			onChange={(keys) => onPatch(placePatch(keys.map(String)))}
			onInputChange={setInput}
		>
			{({ isOpen }) => (
				<>
					<Label className="field-label">{t("filter.place")}</Label>
					{/* react-aria's ComboBox hides everything outside [input, popover] while the list
					    is open, and menuTrigger="focus" means that is whenever the field has focus, so
					    a plain wrapper here would hide the chips next to the input.
					    data-react-aria-top-layer is react-aria's own escape hatch for this (there is
					    no public prop for it on ComboBox in this version; ariaHideOutside.mjs scans for
					    it before hiding anything). Only while the list is open: every later
					    ariaHideOutside honours it too, and left on it would keep the whole Sted field
					    and its <main> reachable behind the filter dialog's modal. */}
					<Group
						role="presentation"
						data-react-aria-top-layer={isOpen ? "" : undefined}
						className="place-group"
					>
						{/* ComboBoxValue is the slot react-aria gives a multi-pick field for its picks.
						    It is left out of the ComboBox's own collection pass, so the chips' Tag
						    nodes never land in the option list: a TagGroup placed here directly
						    throws "Duplicate key county:34 found in collection". */}
						<ComboBoxValue className="contents">
							{() =>
								picked.length > 0 && (
									<TagGroup
										aria-label={t("filter.place")}
										className="contents"
										onRemove={(keys) => {
											const [key] = [...keys]
											if (key !== undefined) remove(String(key))
										}}
									>
										<TagList ref={listRef} className="flex max-w-full flex-wrap gap-1">
											{picked.map((key) => (
												<FilterChip key={key} id={key} label={placeLabel(catalog, key) ?? key} />
											))}
										</TagList>
									</TagGroup>
								)
							}
						</ComboBoxValue>
						<Input
							ref={inputRef}
							placeholder={t("filter.placePlaceholder")}
							className="place-input"
						/>
					</Group>
					<Popover className="max-h-72 w-[var(--trigger-width)] overflow-auto rounded-xl border border-border bg-surface p-1 shadow-lg">
						<ListBox
							renderEmptyState={() => (
								<p className="p-3 text-sm text-muted">
									{t("filter.noMatch")}{" "}
									{/* slot={null}: this button is not the ComboBox's own trigger button. */}
									<Button
										slot={null}
										className="underline"
										onPress={() => onPatch({ national: "only" })}
									>
										{t("filter.noMatchLink")}
									</Button>
								</p>
							)}
						>
							{options.counties.length > 0 && (
								<ListBoxSection id="counties">
									<Header className="px-3 pt-2 text-xs uppercase tracking-wide text-muted">
										{t("filter.counties")}
									</Header>
									{options.counties.map((option) => (
										<PlaceItem key={option.key} option={option} />
									))}
								</ListBoxSection>
							)}
							{options.municipalities.length > 0 && (
								<ListBoxSection id="municipalities">
									<Header className="px-3 pt-2 text-xs uppercase tracking-wide text-muted">
										{t("filter.municipalities")}
									</Header>
									{options.municipalities.map((option) => (
										<PlaceItem key={option.key} option={option} />
									))}
								</ListBoxSection>
							)}
						</ListBox>
					</Popover>
				</>
			)}
		</ComboBox>
	)
}
```

- [ ] **Step 7: Add the styles**

In `web/src/styles/main.css`, after the facet block from Task 4 (still inside
`@layer components`), add:

```css
	/* A label over its control: smaller and heavier than the value, so it reads as a label. */
	.field-label {
		font-size: 0.875rem;
		line-height: 1.25rem;
		font-weight: 600;
	}
	/* The Sted field. The bordered group is the control: 2.75rem tall with no picks, the same as
	   Søk, and it grows downwards as chips wrap, so it never scrolls sideways at 320 px. The input
	   has no ring of its own; the group draws it, so the ring goes round the chips too. */
	.place-group {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem;
		min-block-size: 2.75rem;
		border: 1px solid var(--border);
		border-radius: 0.75rem;
		background: var(--surface);
	}
	.place-group:has(.filter-chip) {
		padding: 0.25rem;
	}
	.place-group:has(input:focus-visible) {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}
	.place-input {
		flex: 1 1 10rem;
		min-inline-size: 0;
		min-block-size: calc(2.75rem - 2px);
		padding-inline: 0.75rem;
		background: transparent;
		color: var(--text);
		outline: none;
	}
	.place-option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		min-block-size: 2.75rem;
		padding-inline: 0.75rem;
		border-radius: 0.5rem;
		cursor: pointer;
	}
	.place-option[data-focused] {
		background: var(--accent-soft);
	}
	.place-option[data-selected] {
		font-weight: 600;
	}
	.place-check {
		flex-shrink: 0;
		color: var(--accent);
	}
	/* A removable chip: the label, then a 44 px remove button. A border, not a shadow, so forced
	   colours keep its edge. */
	.filter-chip {
		display: inline-flex;
		align-items: center;
		max-inline-size: 100%;
		min-block-size: 2.75rem;
		padding-inline-start: 0.75rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--ground);
		color: var(--text);
		font-size: 0.875rem;
		font-weight: 500;
	}
	.filter-chip[data-focus-visible] {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}
	.filter-chip-label {
		min-inline-size: 0;
		overflow-wrap: anywhere;
	}
	.filter-chip-remove {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		min-inline-size: 2.75rem;
		min-block-size: 2.75rem;
		border-radius: 999px;
		color: var(--muted);
		cursor: pointer;
	}
	.filter-chip-remove:hover {
		color: var(--text);
	}
	@media (forced-colors: active) {
		.place-option[data-focused] {
			outline: 2px solid Highlight;
			outline-offset: -2px;
		}
		.filter-chip {
			border-color: CanvasText;
		}
		.place-group:has(input:focus-visible),
		.filter-chip[data-focus-visible] {
			outline-color: Highlight;
		}
	}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npx vitest run tests/placeField.test.tsx tests/i18n.test.tsx`
Expected: PASS, 11 tests in `placeField.test.tsx`.

If "the list stays open" fails, re-read Verified fact 2 in
`node_modules/react-stately/dist/private/combobox/useComboBoxState.mjs` for this exact version
before changing code. If a row is not focusable as `chipRow` finds it, check that `TagList`
receives `listRef` (react-aria forwards it to the grid element).

- [ ] **Step 9: Format, check, commit**

```bash
npx biome check --write src/hooks/useChipFocus.ts src/components/FilterChip.tsx src/components/PlaceField.tsx src/styles/main.css tests/placeField.test.tsx src/i18n/nb.json src/i18n/en.json
npm test && npm run typecheck
git add src/hooks/useChipFocus.ts src/components/FilterChip.tsx src/components/PlaceField.tsx src/styles/main.css tests/placeField.test.tsx src/i18n/nb.json src/i18n/en.json
git commit -m "feat(web): Sted field picks several fylker and kommuner as chips"
```

---

### Task 6: PlaceBar: Søk, Sted and the national radio

**Files:**
- Create: `web/src/components/PlaceBar.tsx`
- Modify: `web/src/components/SearchBar.tsx`
- Modify: `web/src/styles/main.css`, `web/src/i18n/nb.json`, `web/src/i18n/en.json`
- Test: `web/tests/placeBar.test.tsx`

**Interfaces:**
- Consumes: `PlaceField` (Task 5), `FacetOption` (Task 4), `NATIONAL_MODES` and `applyPatch`
  from `src/services/filters.ts`, `facetCounts` from `src/services/facets.ts`.
- Produces:
  - `PlaceBar(props: { catalog: Catalog | null; withRows: ReadonlySet<number> | null; counts: FacetCounts | null; filters: Filters; onPatch: (patch: Partial<Filters>) => void; onSearch: (value: string) => void })`
  - DOM contract for e2e: `.place-bar` holds `search` and `.place-field`; Søk's input is
    `input[type='search']` with class `search-input`; its label has class `field-label`; the
    national fieldset is named "Nasjonale tjenester" / "National services".
  - CSS classes `.place-bar`, `.search-input`, `.national-radio`, `.national-options`.
  - i18n keys `filter.national.include`, `filter.national.exclude`, `filter.national.only`.

- [ ] **Step 1: Write the failing test**

`web/tests/placeBar.test.tsx`:

```tsx
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { type ReactNode, useState } from "react"
import { describe, expect, test, vi } from "vitest"
import { axe } from "vitest-axe"
import { PlaceBar } from "../src/components/PlaceBar.tsx"
import { AnnouncerProvider } from "../src/components/StatusRegion.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import { facetCounts } from "../src/services/facets.ts"
import { applyPatch, type Filters } from "../src/services/filters.ts"
import type { Lang } from "../src/services/urlState.ts"
import { catalog, f, places, rows } from "./filterFixture.ts"

const counts = facetCounts(rows, f(), places)
const axeOptions = { rules: { "color-contrast": { enabled: false } } }

function Wrapper({ lang = "nb", children }: { lang?: Lang; children: ReactNode }) {
	return (
		<LanguageProvider lang={lang}>
			<AnnouncerProvider>{children}</AnnouncerProvider>
		</LanguageProvider>
	)
}

function renderBar({
	filters = {},
	withCatalog = true,
	withCounts = true,
	lang = "nb",
}: { filters?: Partial<Filters>; withCatalog?: boolean; withCounts?: boolean; lang?: Lang } = {}) {
	const onPatch = vi.fn()
	const onSearch = vi.fn()
	const ui = (next: Partial<Filters>) => (
		<Wrapper lang={lang}>
			<PlaceBar
				catalog={withCatalog ? catalog : null}
				withRows={null}
				counts={withCounts ? counts : null}
				filters={f(next)}
				onPatch={onPatch}
				onSearch={onSearch}
			/>
		</Wrapper>
	)
	const view = render(ui(filters))
	return { onPatch, onSearch, container: view.container, rerenderWith: (next: Partial<Filters>) => view.rerender(ui(next)) }
}

function Stateful({ initial }: { initial: Partial<Filters> }) {
	const [filters, setFilters] = useState(f(initial))
	return (
		<Wrapper>
			<PlaceBar
				catalog={catalog}
				withRows={null}
				counts={null}
				filters={filters}
				onPatch={(patch) => setFilters((current) => applyPatch(current, patch))}
				onSearch={vi.fn()}
			/>
		</Wrapper>
	)
}

test("without a catalog only Søk shows", () => {
	renderBar({ withCatalog: false })
	expect(screen.getByRole("searchbox", { name: "Søk etter tjeneste, kommune eller tema" })).toBeInTheDocument()
	expect(screen.queryByRole("combobox", { name: "Sted" })).not.toBeInTheDocument()
	expect(screen.queryAllByRole("radio")).toEqual([])
})

test("Søk and Sted sit in one bar, and the national choice sits under it with its counts", () => {
	renderBar()
	expect(screen.getByRole("searchbox")).toBeInTheDocument()
	expect(screen.getByRole("combobox", { name: "Sted" })).toBeInTheDocument()
	const national = screen.getByRole("group", { name: "Nasjonale tjenester" })
	expect(national.tagName).toBe("FIELDSET")
	expect(screen.getByRole("radio", { name: "Ta med, 5" })).toBeChecked()
	expect(screen.getByRole("radio", { name: "Skjul, 4" })).not.toBeChecked()
	expect(screen.getByRole("radio", { name: "Bare nasjonale, 1" })).not.toBeChecked()
})

test("no radio count while rows load", () => {
	renderBar({ withCounts: false })
	expect(screen.getByRole("radio", { name: "Ta med" })).toBeChecked()
})

test("choosing a radio patches national, and the radios follow the props", async () => {
	const user = userEvent.setup()
	const { onPatch, rerenderWith } = renderBar()
	await user.click(screen.getByRole("radio", { name: "Skjul, 4" }))
	expect(onPatch).toHaveBeenCalledWith({ national: "exclude" })
	rerenderWith({ national: "only" })
	expect(screen.getByRole("radio", { name: "Bare nasjonale, 1" })).toBeChecked()
	rerenderWith({})
	expect(screen.getByRole("radio", { name: "Ta med, 5" })).toBeChecked()
})

// Review Focus 3.
test("picking a place while Bare nasjonale is on switches the radio to Ta med and shows the chip", async () => {
	const user = userEvent.setup()
	render(<Stateful initial={{ national: "only" }} />)
	expect(screen.getByRole("radio", { name: "Bare nasjonale" })).toBeChecked()
	await user.type(screen.getByRole("combobox", { name: "Sted" }), "ham")
	await screen.findByRole("option", { name: "Hamar" })
	await user.keyboard("{ArrowDown}{Enter}")
	// The list stays open after a pick and hides the rest of the page from role queries.
	await user.keyboard("{Escape}")
	await waitFor(() => expect(screen.getByRole("radio", { name: "Ta med" })).toBeChecked())
	expect(
		[...document.querySelectorAll(".place-group .filter-chip-label")].map((el) => el.textContent)
	).toEqual(["Hamar"])
})

test("typing in Søk hands each value to onSearch", async () => {
	const user = userEvent.setup()
	const { onSearch } = renderBar()
	await user.type(screen.getByRole("searchbox"), "r")
	expect(onSearch).toHaveBeenCalledWith("r")
})

test("English labels", () => {
	renderBar({ lang: "en" })
	expect(screen.getByRole("combobox", { name: "Place" })).toBeInTheDocument()
	expect(screen.getByRole("group", { name: "National services" })).toBeInTheDocument()
	expect(screen.getByRole("radio", { name: "Include, 5" })).toBeChecked()
	expect(screen.getByRole("radio", { name: "Hide, 4" })).toBeInTheDocument()
	expect(screen.getByRole("radio", { name: "National only, 1" })).toBeInTheDocument()
})

describe.each(["nb", "en"] as const)("%s", (lang) => {
	test("has no axe violations", async () => {
		const { container } = renderBar({ lang, filters: { municipalities: ["3403"] } })
		expect(await axe(container, axeOptions)).toHaveNoViolations()
	})
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/placeBar.test.tsx`
Expected: FAIL, "Failed to resolve import ../src/components/PlaceBar.tsx".

- [ ] **Step 3: Add the copy**

`web/src/i18n/nb.json`, directly after `"filter.heading": "Filtre",`:

```json
	"filter.national.include": "Ta med",
	"filter.national.exclude": "Skjul",
	"filter.national.only": "Bare nasjonale",
```

`web/src/i18n/en.json`, directly after `"filter.heading": "Filters",`:

```json
	"filter.national.include": "Include",
	"filter.national.exclude": "Hide",
	"filter.national.only": "National only",
```

`filter.national` itself ("Nasjonale tjenester" / "National services") stays and becomes the
radio legend.

- [ ] **Step 4: Style the search box**

`web/src/components/SearchBar.tsx`, change the label and input to:

```tsx
				<label htmlFor={id} className="field-label">
					{t("search.label")}
				</label>
				<input
					id={id}
					type="search"
					value={value}
					onChange={(event) => onChange(event.target.value)}
					autoComplete="off"
					className="search-input"
				/>
```

- [ ] **Step 5: Write the component**

`web/src/components/PlaceBar.tsx`:

```tsx
import { useId } from "react"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import type { Catalog } from "../services/data.ts"
import type { FacetCounts } from "../services/facets.ts"
import { type Filters, NATIONAL_MODES } from "../services/filters.ts"
import { FacetOption } from "./FacetGroup.tsx"
import { PlaceField } from "./PlaceField.tsx"
import { SearchBar } from "./SearchBar.tsx"

// The bar on top of /sok (filter spec, PlaceBar): Søk and Sted side by side from 768 px, stacked
// below, and the national choice right under them. Sted and the radio need the catalog, so on a
// catalog failure only Søk shows (filter spec, Loading and failure). The radio counts each mode
// as if it were chosen; Bare nasjonale ignores the Sted picks, because choosing it clears them.
export function PlaceBar({
	catalog,
	withRows,
	counts,
	filters,
	onPatch,
	onSearch,
}: {
	catalog: Catalog | null
	withRows: ReadonlySet<number> | null
	counts: FacetCounts | null
	filters: Filters
	onPatch: (patch: Partial<Filters>) => void
	onSearch: (value: string) => void
}) {
	const t = useTranslation()
	const name = useId()
	return (
		<div className="grid gap-4">
			<div className="place-bar">
				<SearchBar value={filters.search} onChange={onSearch} />
				{catalog && (
					<PlaceField catalog={catalog} withRows={withRows} filters={filters} onPatch={onPatch} />
				)}
			</div>
			{catalog && (
				<fieldset className="national-radio">
					<legend className="field-label">{t("filter.national")}</legend>
					<div className="national-options">
						{NATIONAL_MODES.map((mode) => (
							<FacetOption
								key={mode}
								type="radio"
								name={name}
								label={t(`filter.national.${mode}`)}
								count={counts ? counts.national[mode] : null}
								checked={filters.national === mode}
								onChange={() => onPatch({ national: mode })}
							/>
						))}
					</div>
				</fieldset>
			)}
		</div>
	)
}
```

- [ ] **Step 6: Add the styles**

In `web/src/styles/main.css`, after the Sted block from Task 5 (inside `@layer components`):

```css
	/* Søk and Sted (filter spec, PlaceBar). Stacked on a phone. From 768 px they sit side by side
	   on a two-row subgrid: the labels share the first row and the controls the second, so the
	   labels keep one baseline even when one wraps at a larger text size, and both controls start
	   on one line. With no picks both are 2.75rem tall, so they share one bottom edge too. Picks
	   make Sted grow downwards while Søk stays where it is. */
	.place-bar {
		display: grid;
		gap: 1rem;
	}
	/* minmax(0, 1fr), not the implicit auto column: an auto column takes its content's
	   min-content, and the Sted input's intrinsic width alone made the page 437 px wide at 375 px
	   and 200 % text. */
	.place-bar > search,
	.place-bar > search > form,
	.place-field {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 0.25rem;
		align-content: start;
		min-inline-size: 0;
	}
	.search-input {
		display: block;
		inline-size: 100%;
		min-block-size: 2.75rem;
		padding-inline: 0.75rem;
		border: 1px solid var(--border);
		border-radius: 0.75rem;
		background: var(--surface);
		color: var(--text);
	}
	/* Stacked 44 px rows on a phone, one wrapping row from 768 px. */
	.national-radio {
		min-inline-size: 0;
	}
	.national-radio > legend {
		margin-block-end: 0.25rem;
	}
	.national-options {
		display: grid;
	}
	@media (min-width: 768px) {
		.place-bar {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			grid-template-rows: auto auto;
			gap: 0.25rem 1rem;
		}
		.place-bar > search,
		.place-bar > search > form,
		.place-bar > .place-field {
			grid-row: span 2;
			grid-template-rows: subgrid;
		}
		.place-bar .field-label {
			align-self: end;
		}
		.national-options {
			display: flex;
			flex-wrap: wrap;
			column-gap: 1.5rem;
		}
	}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npx vitest run tests/placeBar.test.tsx tests/i18n.test.tsx`
Expected: PASS, 9 tests in `placeBar.test.tsx`.

- [ ] **Step 8: Format, check, commit**

```bash
npx biome check --write src/components/PlaceBar.tsx src/components/SearchBar.tsx src/styles/main.css tests/placeBar.test.tsx src/i18n/nb.json src/i18n/en.json
npm test && npm run typecheck
git add src/components/PlaceBar.tsx src/components/SearchBar.tsx src/styles/main.css tests/placeBar.test.tsx src/i18n/nb.json src/i18n/en.json
git commit -m "feat(web): PlaceBar with Søk, Sted and the three-way national choice"
```

---

### Task 7: FacetPanel: the sidebar and the dialog

**Files:**
- Create: `web/src/components/FacetPanel.tsx`
- Modify: `web/src/styles/main.css`, `web/src/i18n/nb.json`, `web/src/i18n/en.json`
- Test: `web/tests/facetPanel.test.tsx`

**Interfaces:**
- Consumes: `FacetGroup` (Task 4); `FEATURE_LABEL_KEYS`, `costLabelKey`, `categoryLabelKey`
  (Task 2); `FILTER_CATEGORY_SLUGS`, `FEATURES`, `COSTS` from `src/services/filters.ts`.
- Produces:
  - `facetTickCount(filters: Filters): number` (Kategorier + Egenskaper + Pris ticks)
  - `FacetSidebar(props: { loaded: boolean; filters: Filters; counts: FacetCounts | null; onPatch: (patch: Partial<Filters>) => void })`:
    an `<aside class="facet-sidebar">` named "Filtre", empty until `loaded`.
  - `FacetDialog(props: { filters: Filters; counts: FacetCounts | null; totalCount: number | null; onPatch: (patch: Partial<Filters>) => void })`:
    the "Flere filtre (n)" button (`.facet-trigger`) and its full-screen dialog named "Filtre".
  - CSS: `.sok-page` (the size container named `sok`; ListPage puts the class on in Task 9),
    `.sok-layout`, `.facet-sidebar`, `.facet-trigger`, `.facet-groups`, `.facet-overlay`,
    `.facet-modal`, `.facet-dialog`, `.facet-dialog-header`, `.facet-dialog-title`, `.facet-dialog-body`,
    `.facet-dialog-footer`.
  - i18n keys `filter.features`, `filter.cost`, `filter.more`, `filter.moreCount`,
    `filter.show`, `filter.showOne`, `filter.showPending`.

The threshold, worked out: the sidebar column is 17.5rem (280 px, today's width), the gap
1.5rem, and the results column must keep 20rem. 17.5 + 1.5 + 20 = **39rem**. The container
query is in rem, which follows the root font size. At 100 % text 39rem is 624 px, and the page
is 992 px wide at a 1024 px window (main has 1rem padding each side), so the sidebar shows. At
200 % text 39rem is 1248 px: at a 1280 px window the page is 1216 px (1280 minus 2 × 32 px), so
the dialog shows; at 1600 px (1536 px of page) and 1920 px (1856 px) the sidebar shows again.

- [ ] **Step 1: Write the failing test**

`web/tests/facetPanel.test.tsx`:

```tsx
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { type ReactNode, useState } from "react"
import { describe, expect, test, vi } from "vitest"
import { axe } from "vitest-axe"
import { FacetDialog, FacetSidebar } from "../src/components/FacetPanel.tsx"
import { AnnouncerProvider } from "../src/components/StatusRegion.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import { facetCounts } from "../src/services/facets.ts"
import { applyPatch } from "../src/services/filters.ts"
import type { Lang } from "../src/services/urlState.ts"
import { f, places, rows } from "./filterFixture.ts"

// With nothing ticked: rus 3, bolig 1, vold-og-overgrep 1, lavterskel 1, dognapent 1, free 1.
const counts = facetCounts(rows, f(), places)
const axeOptions = { rules: { "color-contrast": { enabled: false } } }

function Wrapper({ lang = "nb", children }: { lang?: Lang; children: ReactNode }) {
	return (
		<LanguageProvider lang={lang}>
			<AnnouncerProvider>{children}</AnnouncerProvider>
		</LanguageProvider>
	)
}

function fieldset(legend: string): HTMLElement {
	const found = screen
		.getAllByRole("group", { name: legend, hidden: true })
		.find((g) => g.tagName === "FIELDSET")
	if (!found) throw new Error(`no fieldset named ${legend}`)
	return found
}
const optionLabels = (legend: string) =>
	[...fieldset(legend).querySelectorAll(".facet-label")].map((el) => el.firstChild?.textContent)

function StatefulDialog({ lang = "nb", totalCount = 7 }: { lang?: Lang; totalCount?: number | null }) {
	const [filters, setFilters] = useState(f())
	return (
		<Wrapper lang={lang}>
			<FacetDialog
				filters={filters}
				counts={counts}
				totalCount={totalCount}
				onPatch={(patch) => setFilters((current) => applyPatch(current, patch))}
			/>
		</Wrapper>
	)
}

test("the sidebar holds Kategorier and Egenskaper open, Pris closed, and no Tilbyder", () => {
	render(
		<Wrapper>
			<FacetSidebar loaded filters={f()} counts={counts} onPatch={vi.fn()} />
		</Wrapper>
	)
	const aside = screen.getByRole("complementary", { name: "Filtre" })
	const groups = [...aside.querySelectorAll("details")].map((d) => [
		d.querySelector("summary > span")?.textContent,
		d.open,
	])
	expect(groups).toEqual([
		["Kategorier", true],
		["Egenskaper", true],
		["Pris", false],
	])
	expect(within(aside).queryByText("Tilbyder")).not.toBeInTheDocument()
})

test("the sidebar is an empty column until the catalog has loaded", () => {
	render(
		<Wrapper>
			<FacetSidebar loaded={false} filters={f()} counts={null} onPatch={vi.fn()} />
		</Wrapper>
	)
	expect(screen.getByRole("complementary", { name: "Filtre" })).toBeEmptyDOMElement()
})

test("Kategorier never offers Lavterskeltilbud, and Egenskaper is Lavterskel and Døgnåpent only", () => {
	render(
		<Wrapper>
			<FacetSidebar loaded filters={f()} counts={counts} onPatch={vi.fn()} />
		</Wrapper>
	)
	expect(optionLabels("Kategorier")).toEqual([
		"Økonomi og gjeld",
		"Bolig",
		"Psykisk helse",
		"Rus og avhengighet",
		"Vold og overgrep",
		"Familie og barn",
		"Arbeid",
		"Juridisk hjelp",
		"Nødtjenester",
	])
	// Call C1: the badge strings.
	expect(optionLabels("Egenskaper")).toEqual(["Lavterskel", "Døgnåpent"])
	expect(optionLabels("Pris")).toEqual(["Gratis", "Delvis gratis", "Koster penger"])
})

test("a tick adds its value to its own group and a second tick removes it", async () => {
	const user = userEvent.setup()
	const onPatch = vi.fn()
	render(
		<Wrapper>
			<FacetSidebar loaded filters={f({ categories: ["rus"] })} counts={counts} onPatch={onPatch} />
		</Wrapper>
	)
	await user.click(screen.getByRole("checkbox", { name: "Bolig, 1" }))
	expect(onPatch).toHaveBeenLastCalledWith({ categories: ["rus", "bolig"] })
	await user.click(screen.getByRole("checkbox", { name: "Rus og avhengighet, 3" }))
	expect(onPatch).toHaveBeenLastCalledWith({ categories: [] })
	await user.click(screen.getByRole("checkbox", { name: "Døgnåpent, 1" }))
	expect(onPatch).toHaveBeenLastCalledWith({ features: ["dognapent"] })
	await user.click(screen.getByRole("checkbox", { name: "Gratis, 1", hidden: true }))
	expect(onPatch).toHaveBeenLastCalledWith({ costs: ["free"] })
})

test("the trigger counts ticked facet options, not places or the national choice", () => {
	const view = render(
		<Wrapper>
			<FacetDialog filters={f()} counts={counts} totalCount={7} onPatch={vi.fn()} />
		</Wrapper>
	)
	expect(screen.getByRole("button", { name: "Flere filtre" })).toBeInTheDocument()
	view.rerender(
		<Wrapper>
			<FacetDialog
				filters={f({ categories: ["rus"], features: ["lavterskel"], costs: ["free"], municipalities: ["3403"], national: "exclude" })}
				counts={counts}
				totalCount={7}
				onPatch={vi.fn()}
			/>
		</Wrapper>
	)
	expect(screen.getByRole("button", { name: "Flere filtre (3)" })).toBeInTheDocument()
})

test("the dialog applies ticks live and Vis N treff closes it, with focus back on the trigger", async () => {
	const user = userEvent.setup()
	render(<StatefulDialog />)
	await user.click(screen.getByRole("button", { name: "Flere filtre" }))
	const dialog = await screen.findByRole("dialog", { name: "Filtre" })
	await user.click(within(dialog).getByRole("checkbox", { name: "Rus og avhengighet, 3" }))
	expect(within(dialog).getByRole("checkbox", { name: "Rus og avhengighet, 3" })).toBeChecked()
	expect(screen.getByRole("dialog", { name: "Filtre" })).toBeInTheDocument()
	await user.click(within(dialog).getByRole("button", { name: "Vis 7 treff" }))
	await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
	await waitFor(() => expect(screen.getByRole("button", { name: "Flere filtre (1)" })).toHaveFocus())
})

test("the dialog carries its own quick exit, since it covers the header", async () => {
	const user = userEvent.setup()
	render(<StatefulDialog />)
	await user.click(screen.getByRole("button", { name: "Flere filtre" }))
	const dialog = await screen.findByRole("dialog", { name: "Filtre" })
	expect(within(dialog).getByRole("link", { name: "Forlat siden" })).toHaveAttribute(
		"href",
		"https://www.google.com"
	)
})

test("Escape closes the dialog and focus goes back to the trigger", async () => {
	const user = userEvent.setup()
	render(<StatefulDialog />)
	const trigger = screen.getByRole("button", { name: "Flere filtre" })
	await user.click(trigger)
	await screen.findByRole("dialog", { name: "Filtre" })
	await user.keyboard("{Escape}")
	await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
	await waitFor(() => expect(trigger).toHaveFocus())
})

test.each<[Lang, number | null, string]>([
	["nb", 1, "Vis 1 treff"],
	["nb", null, "Vis treff"],
	["en", 1, "Show 1 result"],
	["en", 12, "Show 12 results"],
])("the footer in %s for %s results reads %s", async (lang, totalCount, label) => {
	const user = userEvent.setup()
	render(<StatefulDialog lang={lang} totalCount={totalCount} />)
	await user.click(screen.getByRole("button", { name: lang === "nb" ? "Flere filtre" : "More filters" }))
	const dialog = await screen.findByRole("dialog")
	expect(within(dialog).getByRole("button", { name: label })).toBeInTheDocument()
})

test("the sidebar and an open dialog never share an id", async () => {
	const user = userEvent.setup()
	render(
		<Wrapper>
			<FacetSidebar loaded filters={f()} counts={counts} onPatch={vi.fn()} />
			<FacetDialog filters={f()} counts={counts} totalCount={7} onPatch={vi.fn()} />
		</Wrapper>
	)
	await user.click(screen.getByRole("button", { name: "Flere filtre" }))
	await screen.findByRole("dialog")
	const ids = [...document.querySelectorAll("[id]")].map((el) => el.id)
	expect(new Set(ids).size).toBe(ids.length)
})

describe.each(["nb", "en"] as const)("%s", (lang) => {
	test("the sidebar and the open dialog have no axe violations", async () => {
		const user = userEvent.setup()
		const sidebar = render(
			<Wrapper lang={lang}>
				<FacetSidebar loaded filters={f({ categories: ["rus"] })} counts={counts} onPatch={vi.fn()} />
			</Wrapper>
		)
		expect(await axe(sidebar.container, axeOptions)).toHaveNoViolations()
		sidebar.unmount()
		render(<StatefulDialog lang={lang} />)
		await user.click(screen.getByRole("button", { name: lang === "nb" ? "Flere filtre" : "More filters" }))
		// Scoped to the dialog: jsdom has no inert, so the trigger behind the modal is aria-hidden
		// there, which a real browser (inert) never reports (Verified fact 6).
		expect(await axe(await screen.findByRole("dialog"), axeOptions)).toHaveNoViolations()
	})
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/facetPanel.test.tsx`
Expected: FAIL, "Failed to resolve import ../src/components/FacetPanel.tsx".

- [ ] **Step 3: Add the copy**

`web/src/i18n/nb.json`, directly after `"filter.heading": "Filtre",`:

```json
	"filter.features": "Egenskaper",
	"filter.cost": "Pris",
	"filter.more": "Flere filtre",
	"filter.moreCount": "Flere filtre ({n})",
	"filter.show": "Vis {n} treff",
	"filter.showOne": "Vis 1 treff",
	"filter.showPending": "Vis treff",
```

`web/src/i18n/en.json`, directly after `"filter.heading": "Filters",`:

```json
	"filter.features": "Features",
	"filter.cost": "Cost",
	"filter.more": "More filters",
	"filter.moreCount": "More filters ({n})",
	"filter.show": "Show {n} results",
	"filter.showOne": "Show 1 result",
	"filter.showPending": "Show results",
```

`filter.categories` ("Kategorier" / "Categories") already exists and stays. The button reads
"Flere filtre" with nothing ticked, so it never says "(0)".

- [ ] **Step 4: Write the component**

`web/src/components/FacetPanel.tsx`:

```tsx
import { useRef } from "react"
import { Button, Dialog, DialogTrigger, Heading, Modal, ModalOverlay } from "react-aria-components"
import { fill } from "../i18n/fill.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { categoryLabelKey, costLabelKey, FEATURE_LABEL_KEYS } from "../services/activeFilters.ts"
import type { FacetCounts } from "../services/facets.ts"
import { COSTS, FEATURES, FILTER_CATEGORY_SLUGS, type Filters } from "../services/filters.ts"
import { FacetGroup } from "./FacetGroup.tsx"
import { QuickExit } from "./QuickExit.tsx"

type PanelProps = {
	filters: Filters
	counts: FacetCounts | null
	onPatch: (patch: Partial<Filters>) => void
}

function toggle<T>(values: readonly T[], value: T): T[] {
	return values.includes(value) ? values.filter((v) => v !== value) : [...values, value]
}

// The ticked facet options, for "Flere filtre (n)". Places and the national choice sit in the
// bar above, always in view, so they are not counted here.
export function facetTickCount(filters: Filters): number {
	return filters.categories.length + filters.features.length + filters.costs.length
}

// The three groups. Kategorier and Egenskaper start open, Pris closed (filter spec, FacetGroup).
// Tilbyder is not built yet: no row carries providerType.
function FacetGroups({ filters, counts, onPatch }: PanelProps) {
	const t = useTranslation()
	return (
		<div className="facet-groups">
			<FacetGroup
				legend={t("filter.categories")}
				options={FILTER_CATEGORY_SLUGS.map((slug) => ({ value: slug, label: t(categoryLabelKey(slug)) }))}
				checked={filters.categories}
				counts={counts?.categories ?? null}
				defaultOpen
				onToggle={(slug) => onPatch({ categories: toggle(filters.categories, slug) })}
			/>
			<FacetGroup
				legend={t("filter.features")}
				options={FEATURES.map((feature) => ({ value: feature, label: t(FEATURE_LABEL_KEYS[feature]) }))}
				checked={filters.features}
				counts={counts?.features ?? null}
				defaultOpen
				onToggle={(feature) => onPatch({ features: toggle(filters.features, feature) })}
			/>
			<FacetGroup
				legend={t("filter.cost")}
				options={COSTS.map((cost) => ({ value: cost, label: t(costLabelKey(cost)) }))}
				checked={filters.costs}
				counts={counts?.costs ?? null}
				defaultOpen={false}
				onToggle={(cost) => onPatch({ costs: toggle(filters.costs, cost) })}
			/>
		</div>
	)
}

// From 1024 px the groups sit in a column left of the results, as long as the results keep 20rem
// (the .sok-page container query in main.css decides; below that this is display: none, so it
// leaves the accessibility tree). The column is there while the catalog loads, empty, so the
// results never jump from the first column to the second.
export function FacetSidebar({ loaded, ...panel }: PanelProps & { loaded: boolean }) {
	const t = useTranslation()
	return (
		<aside aria-label={t("filter.heading")} className="facet-sidebar">
			{loaded && <FacetGroups {...panel} />}
		</aside>
	)
}

// Below the sidebar layout, "Flere filtre (n)" opens the groups in a full-screen react-aria
// Modal (filter spec, FacetPanel). Ticks apply live, so the footer always shows the real count.
// Escape and the footer button close it, and react-aria returns focus to the button. The
// dialog is a flex column with the footer under the scroll area, not over it, so the footer
// never covers a focused checkbox at any text size (Call C3). The count is announced by the
// page's one status region, which stays audible through the modal (data-live-announcer).
// The dialog covers the header, so it carries its own "Forlat siden": on a phone with no keyboard
// that button is the only quick exit, and a full-screen filter must never hide it.
export function FacetDialog({ totalCount, ...panel }: PanelProps & { totalCount: number | null }) {
	const t = useTranslation()
	const triggerRef = useRef<HTMLButtonElement>(null)
	const ticked = facetTickCount(panel.filters)
	// A tablet turned to landscape while the dialog is open crosses into the sidebar layout, and
	// the trigger is display: none by the time it closes, so react-aria's focus return would land
	// on <body>. Two frames, so this runs after react-aria's own restore: then focus goes to the
	// first sidebar group, which holds the same boxes.
	const onOpenChange = (open: boolean) => {
		if (open) return
		requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				if (triggerRef.current?.checkVisibility()) return
				document.querySelector<HTMLElement>(".facet-sidebar summary")?.focus()
			})
		)
	}
	const show =
		totalCount === null
			? t("filter.showPending")
			: totalCount === 1
				? t("filter.showOne")
				: fill(t("filter.show"), { n: totalCount })
	return (
		<DialogTrigger onOpenChange={onOpenChange}>
			<Button ref={triggerRef} className="btn-secondary facet-trigger justify-self-start">
				{ticked > 0 ? fill(t("filter.moreCount"), { n: ticked }) : t("filter.more")}
			</Button>
			<ModalOverlay className="facet-overlay">
				<Modal className="facet-modal">
					<Dialog className="facet-dialog">
						{({ close }) => (
							<>
								<div className="facet-dialog-header">
									<Heading slot="title" level={2} className="facet-dialog-title">
										{t("filter.heading")}
									</Heading>
									<QuickExit />
								</div>
								<div className="facet-dialog-body">
									<FacetGroups {...panel} />
								</div>
								<div className="facet-dialog-footer">
									<button type="button" className="btn-primary w-full" onClick={close}>
										{show}
									</button>
								</div>
							</>
						)}
					</Dialog>
				</Modal>
			</ModalOverlay>
		</DialogTrigger>
	)
}
```

- [ ] **Step 5: Add the styles**

In `web/src/styles/main.css`, after the PlaceBar block from Task 6 (inside `@layer components`):

```css
	/* The /sok layout (filter spec, Layout 1). The page is a size container, so the facets can
	   ask how wide the page really is. From 1024 px they sit in a 17.5rem column, but only while
	   the results keep 20rem: 17.5rem + 1.5rem gap + 20rem = 39rem. In rem, so it follows the root
	   font size: at 200 % text on a 1280 px window the page is 1216 px against 1248 px, and the
	   facets fall back to the dialog. The rule sits after .btn-secondary on purpose, and the
	   trigger selector has two classes, so display: none wins over the button's inline-flex. */
	.sok-page {
		grid-template-columns: minmax(0, 1fr);
		container: sok / inline-size;
	}
	.sok-layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1.5rem;
	}
	/* No scroll anchoring on /sok. react-aria renders a TagGroup's chips one commit after the
	   rest, so on Back the saved scroll is restored first and the chip rows grow above it
	   afterwards; Chrome's anchoring then moved the page by their height (38 px at 375 px with
	   one Sted pick: e2e/oldLinks.spec.ts failed). The layout after that commit is the one the
	   scroll was saved in, so the restored number is already right. */
	html:has(.sok-page) {
		overflow-anchor: none;
	}
	.facet-sidebar {
		display: none;
	}
	.facet-groups {
		display: grid;
		gap: 0.5rem;
	}
	@media (min-width: 1024px) {
		@container sok (min-width: 39rem) {
			.sok-layout {
				grid-template-columns: 17.5rem minmax(0, 1fr);
				align-items: start;
			}
			.facet-sidebar {
				display: block;
			}
			.sok-page .facet-trigger {
				display: none;
			}
		}
	}
	/* The full-screen filter dialog: heading, a scroll area, and the footer below it. */
	.facet-overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: var(--ground);
	}
	.facet-modal {
		block-size: 100%;
	}
	.facet-dialog {
		display: flex;
		flex-direction: column;
		block-size: 100%;
		outline: none;
	}
	/* The heading and the dialog's own quick exit share one row, the exit at the end as in the
	   header. */
	.facet-dialog-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem 1rem;
		padding: 0.5rem 1rem;
		border-block-end: 1px solid var(--border);
	}
	.facet-dialog-title {
		font-size: 1.25rem;
	}
	.facet-dialog-body {
		flex: 1;
		min-block-size: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding-inline: 1rem;
	}
	.facet-dialog-footer {
		padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom));
		border-block-start: 1px solid var(--border);
		background: var(--surface);
	}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/facetPanel.test.tsx tests/i18n.test.tsx`
Expected: PASS, 15 tests in `facetPanel.test.tsx`.

- [ ] **Step 7: Format, check, commit**

```bash
npx biome check --write src/components/FacetPanel.tsx src/styles/main.css tests/facetPanel.test.tsx src/i18n/nb.json src/i18n/en.json
npm test && npm run typecheck
git add src/components/FacetPanel.tsx src/styles/main.css tests/facetPanel.test.tsx src/i18n/nb.json src/i18n/en.json
git commit -m "feat(web): facet sidebar from 1024 px and a full-screen filter dialog below"
```

---

### Task 8: ActiveFilters: the chips row

**Files:**
- Create: `web/src/components/ActiveFilters.tsx`
- Modify: `web/src/styles/main.css`, `web/src/i18n/nb.json`, `web/src/i18n/en.json`
- Test: `web/tests/activeFiltersRow.test.tsx`

**Interfaces:**
- Consumes: `activeFilters` (Task 2), `useChipFocus` and `FilterChip` (Task 5), `CLEAR_ALL` and
  `hasFilters` from `src/services/filters.ts`.
- Produces:
  - `ActiveFilters(props: { filters: Filters; catalog: Pick<Catalog, "municipalities" | "counties">; onPatch: (patch: Partial<Filters>) => void; headingRef: RefObject<HTMLHeadingElement | null> })`
  - The chips grid is named "Valgte filtre" / "Selected filters"; the reset button reads
    "Nullstill alt" / "Clear all".
  - CSS class `.active-filters`.
  - i18n key `filter.selected`; `filter.reset` changes value.

Removing the last chip, or pressing Nullstill alt (which takes the row with it), moves focus to
`headingRef`: the results `<h1>`, or the empty state's heading when nothing matches. The
Nullstill alt case is not in the spec's text, but without it focus would fall to `<body>`.

- [ ] **Step 1: Write the failing test**

`web/tests/activeFiltersRow.test.tsx`:

```tsx
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { type ReactNode, useRef, useState } from "react"
import { describe, expect, test, vi } from "vitest"
import { axe } from "vitest-axe"
import { ActiveFilters } from "../src/components/ActiveFilters.tsx"
import { AnnouncerProvider } from "../src/components/StatusRegion.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import { applyPatch, CLEAR_ALL, type Filters } from "../src/services/filters.ts"
import type { Lang } from "../src/services/urlState.ts"
import { catalog, f } from "./filterFixture.ts"

const axeOptions = { rules: { "color-contrast": { enabled: false } } }

function Wrapper({ lang = "nb", children }: { lang?: Lang; children: ReactNode }) {
	return (
		<LanguageProvider lang={lang}>
			<AnnouncerProvider>{children}</AnnouncerProvider>
		</LanguageProvider>
	)
}

function renderRow(filters: Partial<Filters>, lang: Lang = "nb") {
	const onPatch = vi.fn()
	function Probe() {
		const headingRef = useRef<HTMLHeadingElement>(null)
		return (
			<>
				<h1 ref={headingRef} tabIndex={-1}>
					Treff
				</h1>
				<ActiveFilters filters={f(filters)} catalog={catalog} onPatch={onPatch} headingRef={headingRef} />
			</>
		)
	}
	const view = render(
		<Wrapper lang={lang}>
			<Probe />
		</Wrapper>
	)
	return { onPatch, container: view.container }
}

// Stands in for ListPage: the heading is the empty state's, and every patch goes through
// applyPatch as the URL would.
function Stateful({ initial }: { initial: Partial<Filters> }) {
	const [filters, setFilters] = useState(f(initial))
	const headingRef = useRef<HTMLHeadingElement>(null)
	return (
		<Wrapper>
			<h1 ref={headingRef} tabIndex={-1}>
				Ingen treff
			</h1>
			<ActiveFilters
				filters={filters}
				catalog={catalog}
				headingRef={headingRef}
				onPatch={(patch) => setFilters((current) => applyPatch(current, patch))}
			/>
		</Wrapper>
	)
}

const chipLabels = () =>
	[...document.querySelectorAll(".filter-chip-label")].map((el) => el.textContent)
const chipRow = (label: string) =>
	screen.getByText(label, { selector: ".filter-chip-label" }).closest<HTMLElement>('[role="row"]')

test("nothing set shows nothing", () => {
	renderRow({})
	expect(screen.queryByRole("grid")).not.toBeInTheDocument()
	expect(screen.queryByRole("button")).not.toBeInTheDocument()
})

test("one chip per active value under Valgte filtre, each with a named remove button", () => {
	renderRow({ municipalities: ["3403"], national: "exclude", categories: ["rus"] })
	expect(screen.getByRole("grid", { name: "Valgte filtre" })).toBeInTheDocument()
	expect(chipLabels()).toEqual(["Hamar", "Skjul nasjonale", "Rus og avhengighet"])
	expect(screen.getByRole("button", { name: "Fjern Hamar" })).toBeInTheDocument()
})

test("removing a chip patches only its own value", async () => {
	const { onPatch } = renderRow({ municipalities: ["3403"], categories: ["rus"] })
	await userEvent.click(screen.getByRole("button", { name: "Fjern Rus og avhengighet" }))
	expect(onPatch).toHaveBeenCalledWith({ categories: [] })
})

test("Delete on a chip moves focus to the next chip, or the one before when it was last", async () => {
	const user = userEvent.setup()
	render(<Stateful initial={{ municipalities: ["3403"], national: "exclude", categories: ["rus"] }} />)
	chipRow("Skjul nasjonale")?.focus()
	await user.keyboard("{Delete}")
	await waitFor(() => expect(chipRow("Rus og avhengighet")).toHaveFocus())
	await user.keyboard("{Delete}")
	await waitFor(() => expect(chipRow("Hamar")).toHaveFocus())
})

// Review Focus 2.
test("removing the last chip on an empty list sends focus to the empty state's heading", async () => {
	const user = userEvent.setup()
	render(<Stateful initial={{ search: "zzz", categories: ["rus"] }} />)
	await user.click(screen.getByRole("button", { name: "Fjern Rus og avhengighet" }))
	await waitFor(() =>
		expect(screen.getByRole("heading", { level: 1, name: "Ingen treff" })).toHaveFocus()
	)
	expect(document.body).not.toHaveFocus()
	// The search text is still set, so Nullstill alt stays.
	expect(screen.getByRole("button", { name: "Nullstill alt" })).toBeInTheDocument()
})

test.each<[string, Partial<Filters>]>([
	["search text", { search: "hamar" }],
	["a kommune", { municipalities: ["3403"] }],
	["Bare nasjonale", { national: "only" }],
	["an Egenskap", { features: ["lavterskel"] }],
])("Nullstill alt shows with %s alone and clears everything", async (_name, filters) => {
	const { onPatch } = renderRow(filters)
	await userEvent.click(screen.getByRole("button", { name: "Nullstill alt" }))
	expect(onPatch).toHaveBeenCalledWith(CLEAR_ALL)
})

test("Nullstill alt takes the row with it and sends focus to the heading", async () => {
	const user = userEvent.setup()
	render(<Stateful initial={{ search: "zzz", categories: ["rus"] }} />)
	await user.click(screen.getByRole("button", { name: "Nullstill alt" }))
	await waitFor(() =>
		expect(screen.getByRole("heading", { level: 1, name: "Ingen treff" })).toHaveFocus()
	)
	expect(screen.queryByRole("button", { name: "Nullstill alt" })).not.toBeInTheDocument()
})

test("English labels", () => {
	renderRow({ municipalities: ["3403"], national: "exclude" }, "en")
	expect(screen.getByRole("grid", { name: "Selected filters" })).toBeInTheDocument()
	expect(chipLabels()).toEqual(["Hamar", "Hide national"])
	expect(screen.getByRole("button", { name: "Remove Hamar" })).toBeInTheDocument()
	expect(screen.getByRole("button", { name: "Clear all" })).toBeInTheDocument()
})

describe.each(["nb", "en"] as const)("%s", (lang) => {
	test("has no axe violations", async () => {
		const { container } = renderRow({ counties: ["34"], categories: ["rus"], costs: ["free"] }, lang)
		expect(await axe(container, axeOptions)).toHaveNoViolations()
	})
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/activeFiltersRow.test.tsx`
Expected: FAIL, "Failed to resolve import ../src/components/ActiveFilters.tsx".

- [ ] **Step 3: Add and change the copy**

`web/src/i18n/nb.json`: directly after `"filter.heading": "Filtre",` insert
`"filter.selected": "Valgte filtre",`, and change `"filter.reset": "Nullstill",` to
`"filter.reset": "Nullstill alt",`.

`web/src/i18n/en.json`: directly after `"filter.heading": "Filters",` insert
`"filter.selected": "Selected filters",`, and change `"filter.reset": "Reset",` to
`"filter.reset": "Clear all",`.

- [ ] **Step 4: Write the component**

`web/src/components/ActiveFilters.tsx`:

```tsx
import { type RefObject, useEffect, useRef } from "react"
import { Label, TagGroup, TagList } from "react-aria-components"
import { useChipFocus } from "../hooks/useChipFocus.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { activeFilters } from "../services/activeFilters.ts"
import type { Catalog } from "../services/data.ts"
import { CLEAR_ALL, type Filters, hasFilters } from "../services/filters.ts"
import { FilterChip } from "./FilterChip.tsx"

// The chips above the results (filter spec, ActiveFilters): one per active value, so every
// filter, wherever it was set, can be seen and undone in one place. "Nullstill alt" clears every
// filter and the search text, and shows whenever anything is set. When the last chip goes, or
// Nullstill alt takes the whole row, focus moves to the results heading, which is the empty
// state's heading when nothing matches. Never to <body>.
export function ActiveFilters({
	filters,
	catalog,
	onPatch,
	headingRef,
}: {
	filters: Filters
	catalog: Pick<Catalog, "municipalities" | "counties">
	onPatch: (patch: Partial<Filters>) => void
	headingRef: RefObject<HTMLHeadingElement | null>
}) {
	const t = useTranslation()
	const chips = activeFilters(filters, catalog, t)
	const { listRef, removing } = useChipFocus(chips.length, () => headingRef.current?.focus())
	const active = hasFilters(filters)
	const clearing = useRef(false)
	// biome-ignore lint/correctness/useExhaustiveDependencies: active is the trigger; the refs are read
	useEffect(() => {
		if (!active && clearing.current) headingRef.current?.focus()
		clearing.current = false
	}, [active])

	if (!active) return null
	return (
		<div className="active-filters">
			{chips.length > 0 && (
				<TagGroup
					className="grid gap-1"
					onRemove={(keys) => {
						const index = chips.findIndex((chip) => keys.has(chip.id))
						const chip = chips[index]
						if (!chip) return
						removing(index)
						onPatch(chip.remove)
					}}
				>
					<Label className="field-label">{t("filter.selected")}</Label>
					<TagList ref={listRef} className="flex flex-wrap gap-2">
						{chips.map((chip) => (
							<FilterChip key={chip.id} id={chip.id} label={chip.label} />
						))}
					</TagList>
				</TagGroup>
			)}
			<button
				type="button"
				className="btn-secondary"
				onClick={() => {
					clearing.current = true
					onPatch(CLEAR_ALL)
				}}
			>
				{t("filter.reset")}
			</button>
		</div>
	)
}
```

- [ ] **Step 5: Add the styles**

In `web/src/styles/main.css`, after the FacetPanel block from Task 7:

```css
	/* The chips row above the results, with Nullstill alt at the end of the last line. The chips
	   and the button are both 44 px, and items-end puts the button on the chips' bottom edge. */
	.active-filters {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 0.5rem 1rem;
	}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/activeFiltersRow.test.tsx tests/i18n.test.tsx`
Expected: PASS, 13 tests in `activeFiltersRow.test.tsx`.

`tests/filterbar.test.tsx` now fails on the button name "Nullstill" (it is "Nullstill alt").
That file is deleted in Task 9; to keep `npm test` green at the end of this task, change each of
its three `name: "Nullstill"` queries to `name: "Nullstill alt"` now (FilterBar reads the same
`filter.reset` key).

- [ ] **Step 7: Format, check, commit**

```bash
npx biome check --write src/components/ActiveFilters.tsx src/styles/main.css tests/activeFiltersRow.test.tsx tests/filterbar.test.tsx src/i18n/nb.json src/i18n/en.json
npm test && npm run typecheck
git add src/components/ActiveFilters.tsx src/styles/main.css tests/activeFiltersRow.test.tsx tests/filterbar.test.tsx src/i18n/nb.json src/i18n/en.json
git commit -m "feat(web): removable chips for every active filter, plus Nullstill alt"
```

---

### Task 9: Wire /sok, remove FilterBar, re-measure the reserved height

**Files:**
- Modify: `web/src/components/ListPage.tsx` (full replacement below)
- Modify: `web/src/styles/main.css` (`.sok-top`)
- Modify: `web/src/App.tsx:29` (stale comment), `web/src/i18n/nb.json`, `web/src/i18n/en.json`
- Delete: `web/src/components/FilterBar.tsx`, `web/src/components/MunicipalityCombobox.tsx`,
  `web/tests/filterbar.test.tsx`, `web/tests/combobox.test.tsx`
- Test: `web/tests/list.test.tsx`, `web/tests/historyButtons.test.tsx`, `web/tests/axe.test.tsx`,
  `web/tests/listRole.test.tsx`, `web/e2e/oldLinks.spec.ts`
- Temporary, never committed: `web/e2e/measure-reserve.spec.ts`

**Interfaces:**
- Consumes: `PlaceBar` (Task 6), `FacetSidebar`, `FacetDialog` (Task 7), `ActiveFilters`
  (Task 8), the ready state's `counts` and `withRows` (Task 3).
- Produces: the /sok page as Task 10 tests it. DOM: `.sok-page` (container) > `.sok-top`
  (PlaceBar and the trigger) and `.sok-layout` (`aside.facet-sidebar` and the results column).
  On a catalog failure neither `.sok-top` nor `aside.facet-sidebar` renders.

**Where every still-relevant assertion from the deleted tests now lives:**

| Deleted test | Now |
|---|---|
| filterbar: the national toggle on and off | placeBar.test "choosing a radio patches national, and the radios follow the props" |
| filterbar: a category chip adds and removes its slug | facetPanel.test "a tick adds its value ... a second tick removes it" |
| filterbar: Nullstill appears once a filter is set and clears all | activeFiltersRow.test "Nullstill alt shows with ... alone and clears everything" |
| filterbar: Nullstill appears with search, municipality or national alone | the same test.each |
| filterbar: the municipality field follows an outside change | placeField.test "the chips follow the URL ..." |
| combobox: opening lists every municipality under its county | placeField.test "focus opens the list: Fylker, then Kommuner ..." |
| combobox: typeahead folds diacritics, Enter selects, Escape closes | placeField.test "typing folds diacritics, Enter picks ..." and "Escape closes the list without picking" |
| combobox: no match shows the coverage note with the national link | placeField.test "no match shows the coverage note ..." |
| combobox: county and municipality nb collation | placeOptions.test "the nb collator sorts Æ, Ø and Å after Z" |
| combobox: the input follows selectedId | placeField.test "the chips follow the URL ..." |
| combobox: react-aria speaks the app's language | placeField.test "labels and react-aria's own words follow the app's language" |
| combobox: "Alle kommuner" offered after a pick, hidden while typing | dropped: there is no "Alle kommuner" in a multi-pick field. Nothing picked means all of Norway, and each pick has its own remove button |
| combobox: "Tøm" clears | dropped: the field has no clear button; chips and Nullstill alt replace it |

- [ ] **Step 1: Update the existing tests to the new UI**

In `web/tests/list.test.tsx`:

Add to the imports: `import { desktopTools } from "./scope.ts"`.

In "an unknown ?municipality= value doesn't crash the app", replace the last two lines (the
comment and the combobox assertion) with:

```tsx
	// No phantom pick either: no chip names some kommune that doesn't exist.
	expect(screen.queryByRole("grid", { name: "Sted" })).not.toBeInTheDocument()
```

Replace the whole test "Tøm clears both municipality and national selection from the URL" with:

```tsx
test("Nullstill alt clears places and the national choice from the URL", async () => {
	stubCatalogAndResources()
	window.history.pushState(null, "", "/sok?municipality=1&national=exclude")
	const user = userEvent.setup()
	render(<App />)
	await screen.findByRole("grid", { name: "Valgte filtre" })
	await user.click(screen.getByRole("button", { name: "Nullstill alt" }))
	await waitFor(() => expect(window.location.search).toBe(""))
})
```

In "an old link is rewritten to its canonical URL once the catalog loads", replace the last
line (`expect(screen.getByRole("combobox", { name: "Kommune" })).toHaveValue("Hamar")`) with:

```tsx
	const chips = await screen.findByRole("grid", { name: "Valgte filtre" })
	expect(within(chips).getByText("Hamar")).toBeInTheDocument()
```

Then add these tests at the end of the file:

```tsx
// Review Focus 1: Back restores the chip and the tick, because both read the URL.
test("Back after removing a chip brings the chip and its box back", async () => {
	stubDataFiles({ resources: [resource], municipalities, categories: [] })
	window.history.pushState(null, "", "/sok?municipality=3403&category=nodtjenester")
	const user = userEvent.setup()
	render(<App />)
	const chips = await screen.findByRole("grid", { name: "Valgte filtre" })
	await user.click(within(chips).getByRole("button", { name: "Fjern Nødtjenester" }))
	await waitFor(() => expect(window.location.search).toBe("?municipality=3403"))
	expect(screen.getByRole("checkbox", { name: /^Nødtjenester/ })).not.toBeChecked()
	act(() => window.history.back())
	await waitFor(() =>
		expect(window.location.search).toBe("?municipality=3403&category=nodtjenester")
	)
	await waitFor(() => expect(screen.getByRole("checkbox", { name: /^Nødtjenester/ })).toBeChecked())
	expect(
		within(screen.getByRole("grid", { name: "Valgte filtre" })).getByText("Nødtjenester")
	).toBeInTheDocument()
})

// Review Focus 2.
test("removing the last chip on an empty list puts focus on the empty state's heading", async () => {
	stubDataFiles({ resources: [resource], municipalities, categories: [] })
	window.history.pushState(null, "", "/sok?search=zzz&category=nodtjenester")
	const user = userEvent.setup()
	render(<App />)
	await screen.findByRole("heading", { level: 1, name: "Ingen treff" })
	await user.click(screen.getByRole("button", { name: "Fjern Nødtjenester" }))
	await waitFor(() =>
		expect(screen.getByRole("heading", { level: 1, name: "Ingen treff" })).toHaveFocus()
	)
	expect(document.body).not.toHaveFocus()
})

// Review Focus 4.
test("switching to English keeps the filters and shows English chips and options", async () => {
	stubDataFiles({ resources: [resource], municipalities, categories: [] })
	window.history.pushState(null, "", "/sok?category=nodtjenester&municipality=3403")
	const user = userEvent.setup()
	render(<App />)
	await screen.findByRole("grid", { name: "Valgte filtre" })
	await user.click(desktopTools().getByRole("link", { name: "English" }))
	await waitFor(() =>
		expect(window.location.pathname + window.location.search).toBe(
			"/en/sok?municipality=3403&category=nodtjenester"
		)
	)
	const chips = await screen.findByRole("grid", { name: "Selected filters" })
	expect(within(chips).getByText("Emergency services")).toBeInTheDocument()
	expect(within(chips).getByText("Hamar")).toBeInTheDocument()
	expect(screen.getByRole("checkbox", { name: /^Emergency services/ })).toBeChecked()
	expect(screen.getByRole("combobox", { name: "Place" })).toBeInTheDocument()
})

test("with the catalog down, only Søk and the error state show", async () => {
	vi.stubGlobal(
		"fetch",
		vi.fn(async () => new Response("down", { status: 503 }))
	)
	window.history.pushState({ idx: 0 }, "", "/sok")
	render(<App />)
	expect(await screen.findByRole("heading", { name: "Noe gikk galt" })).toBeInTheDocument()
	expect(
		screen.getByRole("searchbox", { name: "Søk etter tjeneste, kommune eller tema" })
	).toBeInTheDocument()
	expect(screen.queryByRole("combobox", { name: "Sted" })).not.toBeInTheDocument()
	expect(screen.queryAllByRole("radio")).toEqual([])
	expect(screen.queryAllByRole("checkbox")).toEqual([])
	expect(screen.queryByRole("button", { name: /^Flere filtre/ })).not.toBeInTheDocument()
	expect(screen.queryByRole("complementary", { name: "Filtre" })).not.toBeInTheDocument()
})
```

In `web/tests/historyButtons.test.tsx` line 238, change

```tsx
	fireEvent.click(screen.getByRole("button", { name: "Nasjonale tjenester" }))
```

to

```tsx
	fireEvent.click(screen.getByRole("radio", { name: /^Bare nasjonale/ }))
```

In `web/tests/listRole.test.tsx`, the results-page test finds the Lavterskel badge with
`screen.getByText("Lavterskel")`, and the Egenskaper facet now has a label with that same text
(Call C1), so it fails with "Found multiple elements". Rename the test to "the results page's
lists keep role=list: result cards, badges" (the old category chips list is gone) and change
the line to:

```tsx
	expect(screen.getByText("Lavterskel", { selector: ".badge" }).closest("ul")).toHaveAttribute(
		"role",
		"list"
	)
```

In `web/tests/axe.test.tsx`, add a filtered results page to `pages`, after the `results` row:

```tsx
	["filtered", "/sok?municipality=3403&category=nodtjenester", "ok", /treff/],
```

In `web/e2e/oldLinks.spec.ts`, in "an old ?municipality=1 link lands on Hamar", replace the
combobox line with:

```ts
	await expect(
		page.getByRole("grid", { name: "Valgte filtre" }).getByRole("row").filter({ hasText: "Hamar" })
	).toBeVisible()
	await expect(
		page.getByRole("grid", { name: "Sted" }).getByRole("row").filter({ hasText: "Hamar" })
	).toBeVisible()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/list.test.tsx tests/historyButtons.test.tsx tests/axe.test.tsx tests/listRole.test.tsx`
Expected: FAIL. ListPage still renders FilterBar, so there is no "Valgte filtre" grid, no
radio and no checkbox. (`listRole.test.tsx` passes at this step; it only needs the new selector
once the facets render.)

- [ ] **Step 3: Replace ListPage**

`web/src/components/ListPage.tsx`, the whole file:

```tsx
import { useEffect, useMemo } from "react"
import { useArrivalFocus } from "../hooks/useArrivalFocus.ts"
import { useCatalog } from "../hooks/useCatalog.ts"
import { useResources } from "../hooks/useResources.ts"
import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { useNavigate } from "../navigation.ts"
import {
	applyPatch,
	buildSearch,
	CLEAR_ALL,
	type Filters,
	resolveFilters,
	suggestionPatch,
} from "../services/filters.ts"
import { type Suggestion, suggest } from "../services/match.ts"
import { ActiveFilters } from "./ActiveFilters.tsx"
import { EmptyState } from "./EmptyState.tsx"
import { ErrorState } from "./ErrorState.tsx"
import { FacetDialog, FacetSidebar } from "./FacetPanel.tsx"
import { HandoverBanner } from "./HandoverBanner.tsx"
import { LoadingState } from "./LoadingState.tsx"
import { PageHead } from "./PageHead.tsx"
import { Pagination } from "./Pagination.tsx"
import { PlaceBar } from "./PlaceBar.tsx"
import { ResourceCard } from "./ResourceCard.tsx"
import { useAnnounce } from "./StatusRegion.tsx"
import { Suggestions } from "./Suggestions.tsx"
import { WayfindingHint } from "./WayfindingHint.tsx"

const descriptions = {
	nb: "Varde – finn riktig hjelpetjeneste der du bor. Offentlig katalog over sosiale tjenester i Norge.",
	en: "Varde – find the right help service where you live. Public directory of social services in Norway.",
}

export function ListPage({ filters, arrival }: { filters: Filters; arrival: number }) {
	const { lang } = useLanguage()
	const t = useTranslation()
	const navigate = useNavigate()
	const announce = useAnnounce()
	const { state: catalogState, retry: retryCatalog } = useCatalog(lang)
	const catalog = catalogState.kind === "ready" ? catalogState.catalog : null
	const failed = catalogState.kind === "error"
	const { state, retry } = useResources(filters, lang)
	// Counts and the kommuner with rows exist only once rows have loaded (filter spec, Loading
	// and failure).
	const ready = state.kind === "ready" ? state : null
	// Old ids and places without data resolve against the catalog; until it loads, the parsed
	// filters stand (filter spec, Old links).
	const resolved = useMemo(
		() => (catalog ? resolveFilters(filters, catalog.municipalities, catalog.counties) : filters),
		[catalog, filters]
	)

	// A URL the catalog reads differently (an old id, a place without data, a stray value, other
	// encoding) is rewritten to its one canonical form once the catalog has loaded (filter spec,
	// Old links). Passing the entry's own state keeps its scroll key for Back. This skips
	// navigate on purpose: navigate would re-read the URL and mark the change as a push, which
	// can flip a Back restore half-way, and the resolved filters already are what the new URL
	// says. With the catalog down nothing is rewritten, so a retry can still resolve it.
	useEffect(() => {
		if (!catalog) return
		const canonical = buildSearch(resolved)
		const { pathname, search, hash } = window.location
		if (canonical !== search) {
			window.history.replaceState(window.history.state, "", `${pathname}${canonical}${hash}`)
		}
	}, [catalog, resolved])

	const retryFailed = () => {
		retryCatalog()
		if (state.kind === "error") retry()
	}

	const apply = (patch: Partial<Filters>) =>
		navigate("/sok", buildSearch(applyPatch(resolved, patch)))

	// The pager sits under the whole list. After "Neste" the new cards render above the
	// viewport and focus stays on the button. The user sees nothing change. Only the pager
	// asks for this: a search or filter change must never pull focus out of the search box.
	// `settled` covers "error" too. An error settles the request just as much as a result does,
	// and a pending flag left dangling on an errored or empty page would fire on a later,
	// unrelated load instead (say, the user typing a new search after a retry). `state` as the
	// token: a page change answered from the already-cached index never flips ready/settled at
	// all (see useResources), so the pager's requestFocus() needs the freshly computed state
	// object itself to know a new answer has actually arrived.
	// An empty answer is ready too: the empty state's heading takes the ref then, so Back or
	// Forward onto it lands focus on that heading and never leaves it on <body>.
	const { ref: resultsHeading, requestFocus } = useArrivalFocus<HTMLHeadingElement>(
		arrival,
		state.kind === "ready",
		state.kind !== "loading",
		state
	)
	const goToPage = (page: number) => {
		requestFocus()
		apply({ page })
	}

	// Typing in the search box fires on every keystroke; pushing a history entry per keystroke
	// would flood back/forward with useless states. Replace the current entry instead. Every
	// other filter change (picker, suggestions, pager, clear, toggle) still pushes normally.
	const applySearch = (patch: Partial<Filters>) =>
		navigate("/sok", buildSearch(applyPatch(resolved, patch)), { replace: true })

	// suggest() re-scans the whole catalog on every call. Memoize so it only re-runs when the
	// search text or the catalog itself actually changes, not on every ListPage render.
	const suggestions: Suggestion[] = useMemo(
		() => (catalog && filters.search ? suggest(filters.search, catalog) : []),
		[catalog, filters.search]
	)

	const onPick = (suggestion: Suggestion) => apply(suggestionPatch(resolved, suggestion))

	// A failure is a settled state too: without its own announcement the live region keeps
	// saying "Laster …" while the visible page shows the error. Loading only reaches here for a
	// genuine fetch now (useResources answers a cached filter change synchronously), so this
	// never fires on a keystroke that loaded nothing.
	// biome-ignore lint/correctness/useExhaustiveDependencies: announce once per settled set
	useEffect(() => {
		if (state.kind === "loading") announce(t("status.loading"))
		if (state.kind === "error") announce(t("error.heading"))
	}, [state.kind])

	// The result count, debounced: typing narrows the result set on every keystroke, and
	// announcing each intermediate count would read out a stream of numbers the user never
	// stopped on. Keyed on the actual values that change the message (not state.kind, which
	// stays "ready" across a synchronous filter change) so the count still gets announced once
	// typing settles.
	const totalCount = state.kind === "ready" ? state.data.totalCount : null
	// Every filter key, the new ones included, in one string (the URL without its page).
	const filterKey = buildSearch({ ...resolved, page: 1 })
	// biome-ignore lint/correctness/useExhaustiveDependencies: filterKey stands in for every filter value
	useEffect(() => {
		if (totalCount === null) return
		const names = suggestions.map((s) => s.name).join(", ")
		const message = `${totalCount} ${t("status.results")}${names ? `. ${t("search.suggestions")}: ${names}` : ""}`
		const timer = setTimeout(() => announce(message), 300)
		return () => clearTimeout(timer)
	}, [totalCount, filterKey, filters.page, suggestions])

	return (
		<div className="sok-page grid gap-6">
			<PageHead title={t("list.pageTitle")} description={descriptions[lang]} path="/sok" />
			{/* .sok-top reserves the loaded height of everything above the results that waits for
			    the catalog: Sted, the national choice and, outside the sidebar layout, the "Flere
			    filtre" button. Before the catalog arrives only Søk is there, and that growth would
			    push the results down once data lands: a layout shift, and a moved target for the
			    scroll position Back restores. Since filter PR 2 the whole bar sits above the
			    results at every width, so the floor holds from 1024 px too (the old side column
			    needed none there). The values live in main.css under .sok-top: each is the loaded
			    height measured on 10.11.2026 with e2e/measure-reserve.spec.ts (375x812, 768, 1024
			    and 1280 px, 100 % text), rounded up to the next 0.25rem. They are in rem, so they
			    grow with a larger text size, and the sidebar step uses the same media and container
			    query as the sidebar itself, so the floor always matches the layout on screen.
			    It is lifted on a catalog failure. Then only Søk renders, and a floor would leave a
			    screenful of nothing above "Noe gikk galt" during exactly the outage that panel
			    exists for (measured with the old filter at 375x812: the Legevakt number fell below
			    the fold). It stays on once the catalog has loaded: lifting it then costs its own
			    small shift and buys nothing, because the loaded bar fills it anyway. */}
			<div className={failed ? "grid gap-4" : "sok-top grid gap-4"}>
				<PlaceBar
					catalog={catalog}
					withRows={ready?.withRows ?? null}
					counts={ready?.counts ?? null}
					filters={resolved}
					onPatch={apply}
					onSearch={(value) => applySearch({ search: value })}
				/>
				{catalog && (
					<FacetDialog
						filters={resolved}
						counts={ready?.counts ?? null}
						totalCount={totalCount}
						onPatch={apply}
					/>
				)}
			</div>
			<div className={failed ? "grid gap-4" : "sok-layout"}>
				{!failed && (
					<FacetSidebar
						loaded={catalog !== null}
						filters={resolved}
						counts={ready?.counts ?? null}
						onPatch={apply}
					/>
				)}
				{/* minmax(0, 1fr): an auto column would take the widest chip's or card's
				    min-content and push the chips row past a 375 px screen at 200 % text. */}
				<div className="grid grid-cols-[minmax(0,1fr)] content-start gap-4">
					<HandoverBanner />
					<Suggestions suggestions={suggestions} onPick={onPick} />
					<WayfindingHint query={filters.search} />
					{catalog && (
						<ActiveFilters
							filters={resolved}
							catalog={catalog}
							onPatch={apply}
							headingRef={resultsHeading}
						/>
					)}
					{/* useCatalog and useResources both resolve from the one shared loadIndex(lang)
					    promise in services/data.ts, so a catalog error and a resources error always
					    coincide: there's no state where one fails without the other. One ErrorState
					    at the default level 1 covers both; retryFailed refetches everything that
					    failed. */}
					{failed && <ErrorState onRetry={retryFailed} />}
					{state.kind === "loading" && <LoadingState />}
					{/* Covers both the genuine zero-results case and a page past the last one (e.g. a
					    stale ?page= after filters narrowed the result set). The API returns an empty
					    items array either way, and both deserve the same recovery UI rather than a
					    blank list. */}
					{state.kind === "ready" && state.data.items.length === 0 && (
						<EmptyState
							onClearFilters={() => apply(CLEAR_ALL)}
							suggestions={suggestions}
							onPick={onPick}
							headingRef={resultsHeading}
						/>
					)}
					{state.kind === "ready" && state.data.items.length > 0 && (
						<>
							{/* /sok's only <h1>. It doubles as the arrival-focus target after paging. */}
							<h1 ref={resultsHeading} tabIndex={-1} className="text-lg leading-snug">
								{state.data.totalCount} {t("status.results")}
							</h1>
							<ul
								// biome-ignore lint/a11y/noRedundantRoles: VoiceOver drops it when list-style is none
								role="list"
								className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
							>
								{state.data.items.map((resource) => (
									<ResourceCard
										key={resource.id}
										resource={resource}
										kommuneSlug={
											catalog?.kommuner.find((k) => k.id === resource.municipalityId)?.slug
										}
									/>
								))}
							</ul>
							<Pagination
								page={state.data.page}
								pageSize={state.data.pageSize}
								totalCount={state.data.totalCount}
								onPage={goToPage}
							/>
						</>
					)}
				</div>
			</div>
		</div>
	)
}
```

Everything above `return` is today's code, unchanged, except two new constants: `failed` and
`ready` (with its comment). The JSX below `return` is new. This file, with Tasks 1 to 8 and
the test edits above, was run on 09.11.2026 in a scratch copy of main: `npm run typecheck` is
clean and all 672 vitest tests in the files that run inside `web/` pass.

- [ ] **Step 4: Add the reserved height with computed starting values**

In `web/src/styles/main.css`, after the ActiveFilters block from Task 8:

```css
	/* The /sok bar's reserved height while the catalog loads; the reasons are in ListPage.tsx.
	   Each value is the loaded height of .sok-top at 100 % text, rounded up to the next 0.25rem.
	   The sidebar step uses the sidebar's own media and container query. */
	.sok-top {
		min-height: 24rem;
	}
	@media (min-width: 768px) {
		.sok-top {
			min-height: 13.25rem;
		}
	}
	@media (min-width: 1024px) {
		@container sok (min-width: 39rem) {
			.sok-top {
				min-height: 9.5rem;
			}
		}
	}
```

These are computed, not yet measured: below 768 px Søk 68 + 16 + Sted 68 + 16 + national 156
(legend 20, 4, three 44 px rows) + 16 + button 44 = 384 px = 24rem; from 768 px the bar row 68 +
16 + national row 68 + 16 + button 44 = 212 px = 13.25rem; in the sidebar layout 68 + 16 + 68 =
152 px = 9.5rem. Step 6 replaces them with measured values.

- [ ] **Step 5: Delete FilterBar and the old combobox, and remove the unused copy**

```bash
git rm src/components/FilterBar.tsx src/components/MunicipalityCombobox.tsx tests/filterbar.test.tsx tests/combobox.test.tsx
grep -rn 'filter\.\(municipality\|all\|toggleList\|clear\)"' src tests e2e
```

Expected from grep: only the four lines in `src/i18n/nb.json` and `src/i18n/en.json`. Delete
`"filter.municipality"`, `"filter.all"`, `"filter.toggleList"` and `"filter.clear"` from both
files. Then confirm nothing else went unused:

```bash
for key in $(grep -o '"filter\.[^"]*"' src/i18n/nb.json | tr -d '"'); do
	grep -rq --include=*.ts --include=*.tsx "$key" src || echo "unused: $key"
done
```

Expected: no output, except keys built from a template (`filter.national.include`, `.exclude`,
`.only` are read as `` `filter.national.${mode}` `` in PlaceBar.tsx); confirm those three by
eye and keep them.

In `web/src/App.tsx` line 29, change "(the municipality combobox)" to "(the Sted field, the
chips and the filter dialog)".

- [ ] **Step 6: Measure the reserved height and set the real values**

Create the throwaway spec `web/e2e/measure-reserve.spec.ts` (never commit it):

```ts
import { test } from "@playwright/test"

// Throwaway: prints the loaded height of .sok-top with its floor switched off.
for (const width of [375, 768, 1024, 1280]) {
	test(`measure .sok-top at ${width} px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 812 })
		await page.goto("/sok")
		await page.getByRole("combobox", { name: "Sted" }).waitFor()
		await page.addStyleTag({ content: ".sok-top { min-height: 0 !important }" })
		const height = await page.locator(".sok-top").evaluate((el) => el.getBoundingClientRect().height)
		console.log(`.sok-top at ${width} px: ${height} px = ${height / 16}rem`)
	})
}
```

Run (in a fresh worktree, first `npm ci` and `cp e2e/fixtures/data/*.json public/data/`):

```bash
npm run build:site
npx playwright test e2e/measure-reserve.spec.ts --reporter=list
rm e2e/measure-reserve.spec.ts
```

Set each `.sok-top` value in main.css to its measured height rounded up to the next 0.25rem:
375 px for the base rule, 768 px for the 768 px rule, and the larger of 1024 and 1280 px for the
sidebar rule. If a measured value differs from the computed one by more than 1rem, find out why
before setting it (a stray margin or an extra row is a layout bug, not a new floor). If you
measure on a day other than 10.11.2026, run `date +"%d.%m.%Y"` and put that date in the
ListPage comment.

- [ ] **Step 7: Run every test**

```bash
npm test
npm run typecheck
npm run e2e
```

Expected: all PASS, including `e2e/historyNav.spec.ts` (Back restores the scroll position on
/sok) and the updated `e2e/oldLinks.spec.ts`. If historyNav fails, the reserved height or the
new bar has moved the results after a restore: debug it with superpowers:systematic-debugging
before changing values. If "Back to a rewritten old link restores the scroll position" is off
by a few dozen pixels, check first that the `html:has(.sok-page) { overflow-anchor: none }`
rule from Task 7 is in the built CSS (Verified fact 17).

A known load flake: 3 of 13 full `npm test` runs of this plan's code on 09.11.2026 had one red
test, and never a single-file run. The two I traced were "a page beyond the last page shows
EmptyState" in `list.test.tsx`, whose `findByRole` passed findBy's 1 s default while the whole
suite ran in parallel (the test takes about 0.5 to 0.6 s on main and with this PR alike). Rerun
once; if the same test is red twice in a row it is real, so debug it.

Then confirm no e2e still reaches for the old UI:

```bash
grep -rn 'name: "Kommune"\|"Nasjonale tjenester" })\|aria-pressed' e2e/*.ts
```

Expected: hits only for header, footer and theme controls (`header.spec.ts`, `footer.spec.ts`,
`helpers.ts`), none on /sok filter controls.

- [ ] **Step 8: Format, check, commit**

```bash
npx biome check --write src/components/ListPage.tsx src/styles/main.css src/App.tsx src/i18n/nb.json src/i18n/en.json tests/list.test.tsx tests/historyButtons.test.tsx tests/axe.test.tsx tests/listRole.test.tsx e2e/oldLinks.spec.ts
npm test && npm run typecheck
git add src/components/ListPage.tsx src/styles/main.css src/App.tsx src/i18n/nb.json src/i18n/en.json tests/list.test.tsx tests/historyButtons.test.tsx tests/axe.test.tsx tests/listRole.test.tsx e2e/oldLinks.spec.ts
git commit -m "feat(web): /sok uses PlaceBar, facets and chips; FilterBar is gone"
```

(The four deleted files were staged by `git rm` in Step 5 and go into this commit.)

---

### Task 10: The filter e2e

**Files:**
- Create: `web/e2e/filter.spec.ts`
- Modify: `web/e2e/strip.spec.ts:83-85` (a stale comment)

**Interfaces:**
- Consumes: the DOM contract from Tasks 5 to 9; `hydrated`, `noHorizontalScroll`, `setTheme`,
  `THEMES` from `e2e/helpers.ts`; the fixture facts (Verified fact 11).
- Produces: nothing for later tasks.

The spec's "old `?municipality=1` link lands on Hamar, and Back from there restores the scroll
position" is `e2e/oldLinks.spec.ts`, updated in Task 9 to assert the Hamar chips. It is not
repeated here.

- [ ] **Step 1: Write the spec**

`web/e2e/filter.spec.ts`:

```ts
import { expect, type Locator, type Page, test } from "@playwright/test"
import { hydrated, noHorizontalScroll, setTheme, THEMES } from "./helpers.ts"

// The /sok filter UI (filter spec, Testing, PR 2) against the fixture data: 8 kommuner in 2
// fylker (Innlandet with seven; Oslo with one, so Oslo is listed once, as the kommune), 138 rows,
// aliases.json empty.

const sted = (page: Page) => page.getByRole("combobox", { name: "Sted" })
const stedChips = (page: Page) => page.getByRole("grid", { name: "Sted" })
const activeChips = (page: Page) => page.getByRole("grid", { name: "Valgte filtre" })
const statusRegion = (page: Page) => page.locator("[data-live-announcer]")
const trigger = (page: Page) => page.getByRole("button", { name: /^Flere filtre/ })
const dialog = (page: Page) => page.getByRole("dialog", { name: "Filtre" })

async function openSok(page: Page, path = "/sok"): Promise<void> {
	await page.goto(path)
	await hydrated(page)
	await sted(page).waitFor()
}

// Presses Tab until the target has focus, so the path is the one a keyboard user takes.
// The element is resolved once, up front: while the Sted list is open on the way past, react-aria
// sets aria-hidden on the rest of the page, and a role locator re-resolved then would wait for
// ever instead of pressing the next Tab.
async function tabTo(page: Page, target: Locator, max = 80): Promise<void> {
	const el = await target.elementHandle()
	for (let i = 0; i < max; i++) {
		if (await el.evaluate((node) => node === document.activeElement)) return
		await page.keyboard.press("Tab")
	}
	throw new Error("Tab never reached the target")
}

// The filter's own boxes end inside the viewport. At 200 % text on a phone the result cards are
// still wider than the screen (their nowrap Ring button), which is the separate card reflow
// follow-up, so the 200 % checks look at the filter UI only and not at the whole page.
async function filterFits(page: Page): Promise<boolean> {
	return page.evaluate(() => {
		const width = document.documentElement.clientWidth
		const boxes = document.querySelectorAll(
			".sok-top, .sok-top *, .active-filters, .active-filters *, .facet-sidebar *, .facet-dialog, .facet-dialog *, [role='listbox'], [role='listbox'] *"
		)
		return [...boxes].every((el) => {
			const r = el.getBoundingClientRect()
			return r.width === 0 || r.right <= width + 1
		})
	})
}

// inert in a browser, aria-hidden as react-aria's fallback.
function hiddenFromScreenReaders(el: Element): boolean {
	for (let node: Element | null = el; node; node = node.parentElement) {
		if (node.getAttribute("aria-hidden") === "true" || (node as HTMLElement).inert) return true
	}
	return false
}

for (const theme of THEMES) {
	for (const width of [375, 1024, 1920]) {
		test(`Sted by keyboard at ${width} px (${theme})`, async ({ page }) => {
			await setTheme(page, theme)
			await page.setViewportSize({ width, height: 900 })
			await openSok(page)
			await sted(page).focus()
			await page.keyboard.type("ham")
			await expect(page.getByRole("option", { name: "Hamar" })).toBeVisible()
			await page.keyboard.press("ArrowDown")
			await page.keyboard.press("Enter")
			await expect(page).toHaveURL(/\/sok\?municipality=3403$/)
			// The chip in the field, the list still open, the typed text gone.
			await expect(stedChips(page).getByRole("row").filter({ hasText: "Hamar" })).toBeVisible()
			await expect(page.getByRole("listbox")).toBeVisible()
			await expect(sted(page)).toHaveValue("")
			await page.keyboard.press("Escape")
			await expect(page.getByRole("listbox")).toHaveCount(0)
			await expect(sted(page)).toBeFocused()
			expect(await noHorizontalScroll(page)).toBe(true)
		})
	}

	test(`the filter dialog by keyboard at 375 px (${theme})`, async ({ page }) => {
		await setTheme(page, theme)
		await page.setViewportSize({ width: 375, height: 800 })
		await openSok(page)
		await tabTo(page, trigger(page))
		await page.keyboard.press("Enter")
		await expect(dialog(page)).toBeVisible()
		const rus = dialog(page).getByRole("checkbox", { name: /^Rus og avhengighet/ })
		await tabTo(page, rus)
		await page.keyboard.press("Space")
		await expect(rus).toBeChecked()
		await expect(page).toHaveURL(/category=rus/)
		const footer = dialog(page).getByRole("button", { name: /^Vis \d+ treff$/ })
		const shown = (await footer.textContent())?.match(/\d+/)?.[0]
		await page.keyboard.press("Escape")
		await expect(dialog(page)).toHaveCount(0)
		await expect(page.getByRole("button", { name: "Flere filtre (1)" })).toBeFocused()
		await expect(page.getByRole("heading", { level: 1 })).toHaveText(`${shown} treff`)
	})
}

test("the result count is announced after a tick", async ({ page }) => {
	await page.setViewportSize({ width: 1024, height: 900 })
	await openSok(page)
	// Ticking Bolig gives exactly the count shown next to it.
	const count = await page
		.locator(".facet-sidebar .facet-option", { hasText: "Bolig" })
		.locator(".facet-count")
		.textContent()
	await page.getByRole("checkbox", { name: /^Bolig/ }).check()
	await expect(page.getByRole("heading", { level: 1 })).toHaveText(`${count} treff`)
	await expect(statusRegion(page)).toContainText(`${count} treff`)
})

test("with the dialog open, the status region stays audible and speaks the new count", async ({
	page,
}) => {
	await page.setViewportSize({ width: 375, height: 800 })
	await openSok(page)
	await trigger(page).click()
	await expect(dialog(page)).toBeVisible()
	expect(await page.locator("#app").evaluate(hiddenFromScreenReaders)).toBe(true)
	expect(await statusRegion(page).evaluate(hiddenFromScreenReaders)).toBe(false)
	await dialog(page)
		.getByRole("checkbox", { name: /^Bolig/ })
		.check()
	const footer = dialog(page).getByRole("button", { name: /^Vis \d+ treff$/ })
	await expect(footer).toHaveText(/^Vis \d+ treff$/)
	const shown = (await footer.textContent())?.match(/\d+/)?.[0]
	await expect(statusRegion(page)).toContainText(`${shown} treff`)
})

for (const [width, sidebar] of [
	[375, false],
	[1280, false],
	[1920, true],
] as const) {
	test(`at 200 % text and ${width} px the facets are a ${sidebar ? "sidebar" : "dialog"}, with no sideways scroll`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height: 900 })
		await openSok(page, "/sok?municipality=3403&category=rus&feature=lavterskel")
		await page.addStyleTag({ content: "html { font-size: 200% }" })
		if (sidebar) {
			await expect(page.locator(".facet-sidebar")).toBeVisible()
			await expect(trigger(page)).toBeHidden()
		} else {
			await expect(page.locator(".facet-sidebar")).toBeHidden()
			await expect(trigger(page)).toBeVisible()
		}
		expect(await filterFits(page)).toBe(true)
	})
}

// The old follow-up: the /sok filter panel scrolled sideways at 375 px, and at 200 % text.
for (const fontSize of ["100%", "200%"]) {
	test(`the /sok filter never scrolls sideways at 375 px and ${fontSize} text`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: 375, height: 800 })
		await openSok(page, "/sok?county=34&municipality=3403&category=rus&cost=free")
		await page.addStyleTag({ content: `html { font-size: ${fontSize} }` })
		expect(await filterFits(page)).toBe(true)
		await sted(page).focus()
		await expect(page.getByRole("listbox")).toBeVisible()
		expect(await filterFits(page)).toBe(true)
		await page.keyboard.press("Escape")
		await trigger(page).click()
		await expect(dialog(page)).toBeVisible()
		expect(await dialog(page).evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
		expect(await filterFits(page)).toBe(true)
		if (fontSize === "100%") expect(await noHorizontalScroll(page)).toBe(true)
	})
}

for (const width of [768, 1024, 1280, 1920]) {
	test(`Søk and Sted share one height, one bottom edge and one label baseline at ${width} px`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height: 900 })
		await openSok(page)
		const m = await page.evaluate(() => {
			const box = (selector: string) => {
				const el = document.querySelector(selector)
				if (!el) throw new Error(`no ${selector}`)
				const r = el.getBoundingClientRect()
				return { bottom: r.bottom, height: r.height }
			}
			// The bottom of a label's last line box. Both labels use one font and size, so equal
			// bottoms mean one baseline.
			const lastLine = (selector: string) => {
				const el = document.querySelector(selector)
				if (!el) throw new Error(`no ${selector}`)
				const range = document.createRange()
				range.selectNodeContents(el)
				const lines = range.getClientRects()
				return lines[lines.length - 1]?.bottom ?? Number.NaN
			}
			return {
				search: box(".place-bar input[type='search']"),
				place: box(".place-group"),
				searchLabel: lastLine(".place-bar search label"),
				placeLabel: lastLine(".place-field .field-label"),
			}
		})
		expect(Math.abs(m.search.height - m.place.height)).toBeLessThanOrEqual(1)
		expect(Math.abs(m.search.bottom - m.place.bottom)).toBeLessThanOrEqual(1)
		expect(Math.abs(m.searchLabel - m.placeLabel)).toBeLessThanOrEqual(1)
	})
}

test("tabbing to the last checkbox in the dialog leaves it above the footer", async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 640 })
	await openSok(page)
	await trigger(page).click()
	await expect(dialog(page)).toBeVisible()
	// Pris starts closed; open it so its last box is the last one in the dialog.
	const pris = dialog(page).locator("summary", { hasText: "Pris" })
	await tabTo(page, pris)
	await page.keyboard.press("Enter")
	const last = dialog(page).getByRole("checkbox").last()
	await tabTo(page, last)
	const rowBottom = await last.evaluate(
		(el) => el.closest("label")?.getBoundingClientRect().bottom ?? Number.NaN
	)
	const footerTop = await dialog(page)
		.locator(".facet-dialog-footer")
		.evaluate((el) => el.getBoundingClientRect().top)
	expect(rowBottom).toBeLessThanOrEqual(footerTop)
})

test("five Sted picks at 375 px wrap inside the field and never scroll sideways", async ({
	page,
}) => {
	await page.setViewportSize({ width: 375, height: 800 })
	await openSok(page)
	await sted(page).click()
	for (const name of ["Innlandet", "Elverum", "Gjøvik", "Hamar", "Lillehammer"]) {
		await page.getByRole("option", { name }).click()
	}
	await expect(stedChips(page).getByRole("row")).toHaveCount(5)
	const group = page.locator(".place-group")
	expect(await group.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
	expect(await group.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThan(44)
	expect(await noHorizontalScroll(page)).toBe(true)
})

test.describe("forced colours", () => {
	test.use({ forcedColors: "active" })

	test("a focused checkbox keeps a visible ring, and chips keep their border", async ({ page }) => {
		await page.setViewportSize({ width: 1024, height: 900 })
		await openSok(page, "/sok?category=rus")
		const box = page.getByRole("checkbox", { name: /^Bolig/ })
		await tabTo(page, box)
		const ring = await box.evaluate((el) => {
			const s = getComputedStyle(el)
			return { style: s.outlineStyle, width: Number.parseFloat(s.outlineWidth) }
		})
		expect(ring.style).not.toBe("none")
		expect(ring.width).toBeGreaterThan(0)
		const border = await activeChips(page)
			.locator(".filter-chip")
			.first()
			.evaluate((el) => {
				const s = getComputedStyle(el)
				return { style: s.borderTopStyle, width: Number.parseFloat(s.borderTopWidth) }
			})
		expect(border.style).toBe("solid")
		expect(border.width).toBeGreaterThan(0)
	})
})

test("a failed catalog shows Søk and the error state only", async ({ page }) => {
	await page.route("**/data/*.json", (route) => route.fulfill({ status: 500, body: "down" }))
	await page.setViewportSize({ width: 375, height: 812 })
	await page.goto("/sok")
	await hydrated(page)
	await expect(page.getByRole("heading", { name: "Noe gikk galt" })).toBeVisible()
	await expect(
		page.getByRole("searchbox", { name: "Søk etter tjeneste, kommune eller tema" })
	).toBeVisible()
	await expect(sted(page)).toHaveCount(0)
	await expect(page.getByRole("radio")).toHaveCount(0)
	await expect(page.getByRole("checkbox")).toHaveCount(0)
	await expect(trigger(page)).toHaveCount(0)
	await expect(page.locator(".sok-top")).toHaveCount(0)
})

// The dialog covers the header, so it carries its own quick exit; Shift three times works too,
// because useShiftExit listens on the document in the capture phase.
test("quick exit works from inside the filter dialog, by button and by Shift", async ({ page }) => {
	const stub =
		'<!doctype html><html lang="nb"><title>Stub</title><p id="exit-stub">Utgang</p></html>'
	await page.route(/^https:\/\/www\.google\.com\//, (route) =>
		route.fulfill({ status: 200, contentType: "text/html", body: stub })
	)
	await page.setViewportSize({ width: 375, height: 800 })
	await openSok(page)
	await trigger(page).click()
	await expect(dialog(page).getByRole("link", { name: "Forlat siden" })).toBeVisible()
	await dialog(page)
		.getByRole("checkbox", { name: /^Bolig/ })
		.focus()
	await page.keyboard.press("Shift")
	await page.keyboard.press("Shift")
	await page.keyboard.press("Shift")
	await expect(page.locator("#exit-stub")).toBeVisible()
	await openSok(page)
	await trigger(page).click()
	await dialog(page).getByRole("link", { name: "Forlat siden" }).click()
	await expect(page.locator("#exit-stub")).toBeVisible()
})

// A tablet turned to landscape with the dialog open: the trigger is gone when it closes.
test("closing the dialog after the window grows into the sidebar layout focuses the sidebar", async ({
	page,
}) => {
	await page.setViewportSize({ width: 900, height: 800 })
	await openSok(page)
	await trigger(page).click()
	await expect(dialog(page)).toBeVisible()
	await page.setViewportSize({ width: 1200, height: 800 })
	await page.keyboard.press("Escape")
	await expect(dialog(page)).toHaveCount(0)
	await expect(page.locator(".facet-sidebar summary").first()).toBeFocused()
})

// Review Focus 1.
test("Back after removing a chip brings the chip and its box back", async ({ page }) => {
	await page.setViewportSize({ width: 1024, height: 900 })
	await openSok(page, "/sok?municipality=3403&category=rus")
	const rus = page.getByRole("checkbox", { name: /^Rus og avhengighet/ })
	await activeChips(page).getByRole("button", { name: "Fjern Rus og avhengighet" }).click()
	await expect(page).toHaveURL(/\/sok\?municipality=3403$/)
	await expect(rus).not.toBeChecked()
	await page.goBack()
	await expect(page).toHaveURL(/\/sok\?municipality=3403&category=rus$/)
	await expect(rus).toBeChecked()
	await expect(
		activeChips(page).getByRole("row").filter({ hasText: "Rus og avhengighet" })
	).toBeVisible()
	await stedChips(page).getByRole("button", { name: "Fjern Hamar" }).click()
	await expect(page).toHaveURL(/\/sok\?category=rus$/)
	await page.goBack()
	await expect(page).toHaveURL(/\/sok\?municipality=3403&category=rus$/)
	await expect(stedChips(page).getByRole("row").filter({ hasText: "Hamar" })).toBeVisible()
})

// Review Focus 4.
test("switching to English keeps the filters and shows English labels", async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 })
	await openSok(page, "/sok?category=rus&municipality=3403")
	await page.locator("header .header-tools summary").click()
	await page.locator("header .header-tools").getByRole("link", { name: "English" }).click()
	await expect(page).toHaveURL(/\/en\/sok\?municipality=3403&category=rus$/)
	const chips = page.getByRole("grid", { name: "Selected filters" })
	await expect(
		chips.getByRole("row").filter({ hasText: "Substance use and addiction" })
	).toBeVisible()
	await expect(chips.getByRole("row").filter({ hasText: "Hamar" })).toBeVisible()
	await expect(page.getByRole("checkbox", { name: /^Substance use and addiction/ })).toBeChecked()
	await expect(page.getByRole("combobox", { name: "Place" })).toBeVisible()
})
```

- [ ] **Step 2: Fix the stale strip.spec comment**

`web/e2e/strip.spec.ts` lines 83 to 85 say the /sok filter panel is wider than a phone at
200 % text. That stops being true for the filter with this PR (pinned above), but the result
cards still are (measured 09.11.2026: 437 px of page at 375 px). Replace those three comment
lines with:

```ts
			// The strip itself never reaches past the viewport. The page as a whole is not asserted:
			// at this text size the result cards are still wider than a phone (their nowrap Ring
			// button). The filter UI itself is pinned in filter.spec.ts ("the /sok filter never
			// scrolls sideways at 375 px and 200% text").
```

Leave the assertions as they are.

- [ ] **Step 3: Run the new spec**

```bash
npm run build:site
npx playwright test e2e/filter.spec.ts --reporter=list
```

Expected: PASS, 27 tests (6 Sted keyboard, 2 dialog keyboard, 1 announcement, 1 dialog-open
region, 3 at 200 % text, 2 sideways pins, 4 measurements, 1 footer, 1 five picks, 1 forced
colours, 1 failed catalog, 1 quick exit, 1 layout switch, 1 Back, 1 language).

Run on 09.11.2026 in a scratch build with the code in this plan: 26 pass, and the whole e2e suite
otherwise passes. The one that fails is "the /sok filter never scrolls sideways at 375 px and
200% text", at `await expect(page.getByRole("listbox")).toBeVisible()`: with a Sted pick and the
field low on the screen at 200 % text, focus opens the list, the document scrolls by itself
(443 px, with no `scrollIntoView` or `scrollTo` call from app code) and react-aria closes the
list again on that scroll. With no pick the list opens fine (it flips above the field).
Overriding the ListBox's `autoFocus` did not stop it. How to handle it waits on my
Call C4. Do not edit the assertion to make it pass.

Then prove the measuring test can go red, so it is not a check that always passes: in
`src/styles/main.css` change `.search-input`'s `min-block-size` to `3rem`, run
`npm run build:site && npx playwright test e2e/filter.spec.ts -g "one label baseline"`, and
expect all four measuring tests to FAIL on the height. Undo the change with
`git checkout src/styles/main.css` and rerun `npm run build:site` before Step 4.

A failure here is a finding about the UI, not about the test, unless the test reads the DOM
contract wrongly. Check the contract in the task that owns it (Tasks 5 to 9) before editing an
assertion, and report any assertion you change.

- [ ] **Step 4: Run the whole e2e suite**

Run: `npm run e2e`
Expected: PASS, every spec.

- [ ] **Step 5: Format, check, commit**

```bash
npx biome check --write e2e/filter.spec.ts e2e/strip.spec.ts
npm test && npm run typecheck
git add e2e/filter.spec.ts e2e/strip.spec.ts
git commit -m "test(web): e2e for the /sok filter at three widths, two themes and 200 % text"
```

---

### Task 11: Whole-branch check, layout audit and the PR (controller only)

This task is for the controller, not a subagent: it needs the browser pane.

**Files:** none changed, unless a check fails.

- [ ] **Step 1: Run every check on the finished branch**

In the build worktree, if it is fresh: `npm ci` in `web/` and
`cp e2e/fixtures/data/*.json public/data/` first. `vite preview` serves whatever is in `dist`,
so after any rebase rerun `npm run e2e` (which rebuilds) rather than `npx playwright test`.

```bash
npm test
npm run typecheck
npx biome check .
npm run e2e
```

Expected: all PASS. Record the vitest and Playwright pass counts from the output for the PR
body.

- [ ] **Step 2: Layout audit in the browser pane**

Build (`npm run build:site`) and start the preview from `.claude/launch.json` config
`web-preview` (port 4173; for a worktree add a config with `--prefix` pointing at its `web/`, as
`web-preview-lavterskel` does). Read
`C:\Users\Nugget\Documents\Development\GitHub\repos\workbench\libraries\layout-audit\audit.js`
(read-only) and, on each page below, run its text with `javascript_tool`, then
`auditLayout(document, { mark: true })`:

- `/sok?county=34&municipality=0301&category=rus&feature=lavterskel&cost=free` and
  `/en/sok?county=34&municipality=0301&category=rus&feature=lavterskel&cost=free`
- at 320, 768, 1024, 1280, 1600 and 1920 px (`resize_window`), plus 320 px with
  `document.documentElement.style.fontSize = "200%"`.

Take every screenshot and measurement in one batched round, fix, then confirm in at most one
more round. Also check by eye, in both themes: labels set apart from values (summary over
options, option label over count, field labels over controls), one bottom edge for Søk and Sted
from 768 px, chips that wrap, and no empty gutters at 1920 px. Reset the viewport with
`resize_window` preset `desktop` when done. Anything still off after the second round goes to
Malin as a screenshot with the numbers, not into more polishing.

- [ ] **Step 3: Check the PR 2 scope against the diff**

Run `git diff --stat main...HEAD` and confirm: PlaceBar, FacetGroup, FacetPanel, ActiveFilters,
the copy, the reserved-height re-measure, `data-live-announcer` on the status region, and the
deletion of FilterBar and MunicipalityCombobox. Confirm nothing under `pipeline/` changed, and
that neither the spec nor this plan is in the diff.

- [ ] **Step 4: Draft the PR body**

Write it to `.superpowers/sdd/<ledger dir>/pr-body.md`, first person, no em dashes. What changes
for a visitor (several places at once, fylker, town aliases once `aliases.json` has rows, the
national radio, Egenskaper and Pris with counts, a sidebar from 1024 px and a dialog below,
removable chips and Nullstill alt), the verification counts from Step 1, the audit result from
Step 2, Calls C1 to C3 with what was chosen, and my manual follow-up after deploy: an NVDA pass
through Sted, the dialog and the chips row, listening for the count while the dialog is open.
Title: `feat(web): /sok filter UI with Sted, facets, counts and chips`.

---

## Stress test (09.11.2026)

Two passes on 09.11.2026: the five lenses (security, privacy, accessibility, legal, loopholes),
then a sixth, "will it build?". For the sixth I ran the plan's code instead of reading it: a
scratch copy of main (`git archive dd48a44 web`, the installed `node_modules` linked in), every
code block of Tasks 1 to 10 applied as written, then `tsc`, the whole vitest suite, `npm run
build:site` and the whole Playwright suite. Every fix below was run the same way.

- **Security: clean.** No new trust boundary, request or dependency. Place names, alias text and
  copy reach the DOM as React text only. URL values still pass through `parseFilters` and
  `applyPatch`, which drop unknown values. An alias key is split on `:` but only its first two
  parts are read, so an alias with a colon in it cannot pick another kommune.
- **Privacy: clean.** Filter state lives in the URL alone, as today; nothing new is stored on the
  device or sent anywhere.
- **Legal: clean.** No new dependency, font, dataset or third party. The aliases credit line
  belongs to the pipeline PR that fills `aliases.json`.
- **Will it build: yes, after the fixes below.** As written, Task 5 crashed on the first pick,
  `npm run typecheck` failed on two unused imports, 3 vitest files were red, and 7 e2e tests
  failed. With the fixes: `tsc` clean; all 672 vitest tests in the files that run inside `web/`
  pass (4 files read the repo's `api/` and `docs/` folders, which the scratch copy lacks); the
  per-task counts match the plan (17, 9, 9, 11, 9, 15, 13); the whole e2e suite is 358 passed
  and 1 failed, and that one is Call C4. Calls C1 to C3 break nothing; C1 is why
  `listRole.test.tsx` needs a new selector (Applied 7).

**Applied**
1. 🟠 Accessibility (safety): the full-screen dialog covered the header's "Forlat siden", the only
   quick exit on a phone with no keyboard. The dialog header now carries its own `QuickExit`
   (Task 7), pinned by a component test and an e2e test that leaves by button and by Shift
   three times from inside the dialog (Task 10).
2. 🟡 Accessibility: a tablet turned to landscape with the dialog open crosses into the sidebar
   layout, the trigger is `display: none` when the dialog closes, and focus fell to `<body>`.
   `FacetDialog` now moves focus to the first sidebar group then (Task 7), pinned by an e2e test
   that resizes from 900 to 1200 px with the dialog open (Task 10).
3. 🟡 Loopholes (a guard that cannot fail): the Søk/Sted measuring test now has a step that proves
   it goes red when the heights differ (Task 10, Step 3).
4. 🟠 Build: the chip remove button got an `aria-label` "Fjern Hamar", but react-aria's own
   `aria-labelledby` wins and the name was "Fjern Hamar Hamar"; 2 placeField tests failed. The
   label and the `filter.remove` key are gone, and react-aria's localised "Fjern" / "Remove"
   plus the row name gives "Fjern Hamar" (Task 5, Verified fact 14). Proof: the placeField and
   activeFiltersRow name assertions, green.
5. 🟠 Build: `FacetOption` put ", " inside the hidden span, and jsdom's name computation trims it
   to "Rus og avhengighet,12"; 4 facetGroup tests failed. The comma stays hidden and a real
   space now sits between the label and the count (Task 4, Verified fact 16). Proof: the
   facetGroup, facetPanel and placeBar name assertions, green.
6. 🟠 Accessibility (reflow): at 375 px and 200 % text the page was 437 px wide. Implicit `auto`
   grid columns took their content's min-content: the Sted input's intrinsic width, then the
   widest chip. `.sok-page`, `.sok-layout`, the results column, `.place-field` and Søk's grids
   now use `minmax(0, 1fr)` (Tasks 6, 7 and 9). Proof: the filter UI now ends inside 375 px at
   200 % (e2e `filterFits`); the result cards still do not (Call C5).
7. 🟠 Build: `tests/listRole.test.tsx` was not in the plan, and it fails once the facets render:
   `getByText("Lavterskel")` finds the badge and the facet label (Call C1). Task 9 now scopes it
   to `.badge` and renames the test. Proof: listRole.test green.
8. 🟠 Build (e2e): the `tabTo` helper re-resolved a role locator on every step. Tabbing past Sted
   opens its list, react-aria sets `aria-hidden` on the rest of the page, and the locator for
   the "Flere filtre" button or a sidebar checkbox then waited 30 s. 3 tests timed out. The
   helper resolves its element once (Task 10, Verified fact 18). Proof: both dialog keyboard
   tests and the forced-colours test, green.
9. 🟡 Build: two unused imports (`within` in placeField.test, `type Filters` in facetPanel.test)
   failed `npm run typecheck` under `noUnusedLocals`. Removed. Proof: `tsc` clean.
10. 🟡 Docs: Task 10's new strip.spec comment said the whole page is pinned at 200 % text, which
    stays false while the cards overflow. The comment now says what is pinned. Proof: by eye.
11. 🟡 Loopholes (flake): 3 of 13 full vitest runs had one red test under parallel load; the two
    I traced were a `findByRole` in `list.test.tsx` near findBy's 1 s default (main takes the
    same 0.5 s there). Task 9, Step 7 now names it and says when a red is real.

**Adapted** (a cleverer fix than the obvious one)
1. 🔴 Build: Task 5 crashed on the first pick with "Duplicate key county:34 found in collection".
   A `TagGroup` placed inside the ComboBox renders its `Tag` nodes into the ComboBox's own
   option collection. The obvious fix moves the chips outside the ComboBox and rebuilds the
   field's border, focus ring and popover anchor around them. Instead the TagGroup sits in
   `ComboBoxValue`, react-aria's slot for a multi-pick field's values, which its collection
   pass skips; as a bonus the input's description is the picks (Verified fact 13). Proof: all
   11 placeField tests and the 6 Sted keyboard e2e tests, green.
2. 🟠 Accessibility: `data-react-aria-top-layer` sat on the Sted group for good, and the Modal's
   `ariaHideOutside` honours it too, so with the filter dialog open the Sted field, `main` and
   `#app` stayed reachable behind it (no `inert`). The plan's own e2e caught it. The obvious fix
   drops the attribute and lets the chips go `aria-hidden` whenever Sted has focus (its list
   opens on focus), so a screen reader could never swipe from the input to a chip. Instead the
   attribute is set only while the list is open, through the ComboBox render prop (Task 5,
   Verified fact 15). Proof: e2e "with the dialog open, the status region stays audible", green.
3. 🟠 Loopholes (Back): e2e "Back to a rewritten old link restores the scroll position" was 38 px
   off. A TagGroup's chips render one commit late, so the restore ran first and Chrome's scroll
   anchoring then shifted the page by the chip rows. The obvious fix defers the restore by a
   frame in `services/returnFocus.ts`, which every route shares. Instead /sok turns anchoring
   off (`html:has(.sok-page) { overflow-anchor: none }`, Task 7): the layout after that late
   commit is the one the scroll was saved in, so the saved number is already right. Proof:
   oldLinks.spec and historyNav.spec, green.
4. 🟠 Accessibility (reflow, e2e): the plan's 200 % e2e checks asserted the whole page, which
   cannot pass while the result cards overflow (Call C5). They now assert the filter UI's own
   boxes (`filterFits`: the bar, the chips row, the sidebar, the dialog and the open list), and
   the 100 % run still checks the whole page. That keeps the filter pinned without growing the
   PR into the cards.

**Needs my call**
- **C4** (🟠, the Sted list closes at once at 200 % text on a phone) and **C5** (🟠, the result
  cards at 200 % text): both under "Calls for Malin", each with a recommendation and one
  alternative.

**Considered and rejected**
- **Every tick pushes a history entry**, also inside the dialog, so five ticks take five Backs.
  That is today's behaviour for every filter change, and Back undoing one tick at a time is what
  Review Focus 1 relies on.
- **The dialog hides the acute strip** (110, 112, 113) while it is open. It is the spec's
  full-screen choice (decision 1), and one button at the bottom or Escape closes it. The quick
  exit, which cannot wait, is now inside it.
- **Focusing the Sted input after the last chip goes opens its list** (`menuTrigger="focus"`). The
  input is the right target (spec), and a list that opens on focus is how the field always behaves.
- **A hand-made `?county=03` link** shows an "Oslo" chip for the fylke, which the list never offers
  (Oslo is listed as the kommune). Picking Oslo then gives two "Oslo" chips. Rare, harmless (same
  rows), and folding fylke 03 into kommune 0301 in the parser is a model change for PR 1's code.
- **The reserved height is a floor at 100 % text.** At 200 % the labels wrap and the loaded bar
  is taller than the floor, so a small shift remains there. The values are in rem, so most of it
  scales.
- **The chips row is outside the reserved height.** On a cold load of a filtered link the chips
  row and the Sted chips appear when the catalog lands. The results land in that same moment
  (one shared index promise), so nothing the user is reading moves; on Back both come from the
  cache in the first render.
- **No scroll anchoring on /sok** (Adapted 3). Anchoring keeps the view still when content above
  it grows; on /sok that content is the chips row, which grows from the user's own click, and
  the result being read sits below it either way.
- **No virtualised Sted list.** At national scale the empty field lists up to 15 fylker and 357
  kommuner. react-aria renders that without trouble, and the spec rejects precomputing for less.
- **Chip remove buttons are not in the Tab order.** react-aria's TagGroup removes the focused chip
  with Delete or Backspace and announces that hint in the app's language; pointer and voice
  control users press the named button.
- **The legend repeats the summary text** for a screen reader in browse mode. The spec asks for a
  fieldset with a legend so each option is heard with its group; the repeat is the cost.
- **The Sted input is described by its picks** ("Innlandet Hamar", from `ComboBoxValue`). That is
  useful, not noise; my NVDA pass after deploy confirms how it sounds.

> Stress-tested 2026-11-09 (skill a217382): 11 applied, 4 adapted, 0 decided by me.
