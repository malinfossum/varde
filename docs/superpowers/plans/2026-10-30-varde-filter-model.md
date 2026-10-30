# Filter PR 1: the model. Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the /sok filter's one-kommune model with fylker, several kommuner, a 3-way
national choice, all-of Egenskaper, Pris and facet counts, keep every old link working, and
change today's UI only as much as the new URL params need.

**Architecture:** Committed place files (`web/data/`) give each kommune its kommunenummer and
fylkesnummer. The export attaches those numbers to `municipalities.json` and `kommuner.json`,
so the C# API is untouched. Filter state lives in a new `services/filters.ts`. It parses the URL
by shape first, then `resolveFilters` maps it onto the catalog once that has loaded. Matching
(`query.ts`) and facet counts (`facets.ts`) are pure functions over rows. After that, one
switch-over task moves every consumer to the new model, and a last task rewrites a non-canonical
URL in place.

**Tech Stack:** React 19 + TypeScript (Vite), react-aria-components 1.22.1 (already installed),
Vitest + Testing Library, Playwright, Biome. Plain `.mjs` build scripts with sibling `.d.mts`
declarations.

**Spec:** `docs/superpowers/specs/2026-10-30-varde-filter-design.md` (branch `docs/filter-spec`,
approved 30.10.2026). This plan covers spec Delivery step 1 (PR 1: the model). The lavterskel
data reconcile (step 2) and the UI (step 3, PR 2) get their own plans.

## Global Constraints

- No new dependency (spec, Goal).
- Place numbers are strings everywhere (`"0301"`, `"03"`), because the leading zero matters.
- Kommunenummer and fylkesnummer are copied from the spec's "Old links" list (SSB KLASS,
  classification 131, codesAt 30.10.2026), never from memory: 1 Hamar 3403, 2 Lillehammer
  3405, 3 Gjøvik 3407, 4 Ringsaker 3411, 5 Stange 3413, 6 Løten 3412, 7 Elverum 3420, 8 Oslo
  0301. Fylker: 34 Innlandet, 03 Oslo.
- URL params, in this fixed order: `search`, `county`, `municipality`, `national`, `category`,
  `feature`, `cost`, `page`. Values are in catalog order: kommuner and fylker by number,
  categories in `CATEGORY_SLUGS` order, features as `lavterskel, dognapent`, costs as
  `free, partly, paid`.
- Old links keep working: `municipality` with one or two digits is an old database id;
  `national=true` means `only`; `category=lavterskeltilbud` means `feature=lavterskel`; unknown
  values are dropped, never errors; repeats are deduplicated.
- A kommune added to the C# seed (`api/Varde.Data/Seed/SeedData.cs`) needs its row in
  `web/data/places.json` in the same PR. `tests/places.test.ts` fails otherwise, and so would
  the deploy's export.
- Lavterskeltilbud is never a filter category, and Akutt is never an Egenskap (spec, decision 5).
- The URL rewrite uses `history.replaceState` and keeps the entry's existing `history.state`.
- No C# change. `query.ts` stops claiming to mirror `ResourceRepository.SearchAsync` (spec,
  decision 7).
- `FILTER_PARAMS` in `urlState.ts` stays exactly as it is. The inline script in `index.html`
  mirrors `legacyRedirect`, and legacy root URLs only ever carried those five params.
- The Tilbyder group (`provider`) is not part of PR 1, because no row carries `providerType`
  yet (spec, Delivery).
- Code and identifiers in English, comments in my voice, no em dashes. Biome formatting: tabs,
  line width 100. Run `npx biome check --write <files>` on touched files before each commit.
- Every commit: author `malinfossum.dev@proton.me`, no `Co-Authored-By` or AI trailer. Stage
  explicit paths only, never `git add -A` or `commit -a`.
- All commands run from `web/` unless a step says otherwise. `npm test` and
  `npm run typecheck` must be green at the end of every task.

## Review Focus

1. **Search text that the browser encoded differently** (`?search=rus%20hamar`) must be
   rewritten once to `?search=rus+hamar`, with no loop and no new history entry. Pinned in
   Task 7.
2. **A catalog that fails to load while the URL holds an old link** must show the error state
   and leave the URL exactly as typed, so a retry can still resolve it. Pinned in Task 7.
3. **An English old link** (`/en/sok?municipality=1`) must stay English after the rewrite
   (`/en/sok?municipality=3403`). Pinned in Task 7.
4. **A local row with no kommune and no served kommuner** must drop out under any Sted pick and
   show with no pick. Pinned in Task 4.
5. **A landing-page suggestion for a kommune without its own page** must go to
   `/sok?municipality=<kommunenummer>`, not the old id. Pinned in Task 6.

---

### Task 1: Place files and their guard

**Files:**
- Create: `web/data/places.json`, `web/data/counties.json`, `web/data/aliases.json`
- Create: `web/scripts/places.mjs`, `web/scripts/places.d.mts`
- Test: `web/tests/places.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `readPlaceFiles(dir: string): { places: Place[]; counties: County[]; aliases: Alias[] }`,
  `checkPlaces(places, counties, aliases): string[]` (empty means valid),
  `attachNumbers(municipalities: Municipality[], places: Place[]): NumberedMunicipality[]`
  (throws on a missing or misnamed kommune). Types in `places.d.mts`:
  `Place = { id: number; number: string; countyNumber: string; name: string }`,
  `County = { number: string; name: string }`,
  `Alias = { alias: string; number: string; source: string }`.

- [ ] **Step 1: Write the failing test**

`web/tests/places.test.ts`:

```ts
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, test } from "vitest"
import { attachNumbers, checkPlaces, readPlaceFiles } from "../scripts/places.mjs"

// jsdom replaces the global URL constructor and mis-resolves a relative file:// URL on Windows,
// so paths go through node:path, as in seedDrift.test.ts.
const here = dirname(fileURLToPath(import.meta.url))
const dataDir = join(here, "../data")
const seed = readFileSync(join(here, "../../api/Varde.Data/Seed/SeedData.cs"), "utf8")
const oslo = { number: "03", name: "Oslo" }
const innlandet = { number: "34", name: "Innlandet" }
const hamar = { id: 1, number: "3403", countyNumber: "34", name: "Hamar" }
const osloKommune = { id: 8, number: "0301", countyNumber: "03", name: "Oslo" }

describe("the committed place files", () => {
	test("pass the guard", () => {
		const { places, counties, aliases } = readPlaceFiles(dataDir)
		expect(checkPlaces(places, counties, aliases)).toEqual([])
	})

	test("hold today's eight kommuner with the KLASS numbers from the spec, in number order", () => {
		const { places, counties, aliases } = readPlaceFiles(dataDir)
		expect(places.map((p) => `${p.id} ${p.name} ${p.number} ${p.countyNumber}`)).toEqual([
			"8 Oslo 0301 03",
			"1 Hamar 3403 34",
			"2 Lillehammer 3405 34",
			"3 Gjøvik 3407 34",
			"4 Ringsaker 3411 34",
			"6 Løten 3412 34",
			"5 Stange 3413 34",
			"7 Elverum 3420 34",
		])
		expect(counties).toEqual([oslo, innlandet])
		expect(aliases).toEqual([])
	})

	// The export fails on a kommune the place files lack. This catches it in the PR that adds the
	// kommune to the seed, instead of at deploy.
	test("hold every kommune the API seeds, with the same id and name", () => {
		const consts = new Map(
			[...seed.matchAll(/private const int (\w+) = (\d+);/g)].map((m) => [m[1], Number(m[2])])
		)
		const seeded = [...seed.matchAll(/new Municipality \{ Id = (\w+), Name = "([^"]+)"/g)].map(
			(m) => `${consts.get(m[1]) ?? Number(m[1])} ${m[2]}`
		)
		expect(seeded.length).toBeGreaterThan(0)
		const placeKeys = readPlaceFiles(dataDir).places.map((p) => `${p.id} ${p.name}`)
		for (const kommune of seeded) expect(placeKeys).toContain(kommune)
	})
})

describe("checkPlaces", () => {
	test("rejects a kommune filed under the wrong fylke", () => {
		expect(checkPlaces([{ ...hamar, countyNumber: "03" }], [oslo, innlandet], [])).toEqual([
			"Hamar: 3403 does not start with fylke 03",
		])
	})

	test.each([
		[[{ ...hamar, number: "340" }], [innlandet], "Hamar: kommunenummer 340 is not 4 digits"],
		[[hamar], [oslo], "Hamar: fylke 34 is not in counties.json"],
		[[hamar, osloKommune], [oslo, innlandet], "Oslo: 0301 breaks the rising number order"],
		[[{ ...osloKommune, id: 1 }, hamar], [oslo, innlandet], "Hamar: id 1 is used twice"],
		[[], [{ number: "3", name: "Rar" }], "fylke Rar: number 3 is not 2 digits"],
		[[], [innlandet, oslo], "fylke Oslo: 03 breaks the rising number order"],
	])("rejects broken place data (%#)", (places, counties, message) => {
		expect(checkPlaces(places, counties, [])).toEqual([message])
	})

	test("rejects an alias that points nowhere or names no source", () => {
		expect(
			checkPlaces(
				[hamar],
				[innlandet],
				[
					{ alias: "Brumunddal", number: "3411", source: "SSB tettsteder" },
					{ alias: "Hamar sentrum", number: "3403", source: "" },
				]
			)
		).toEqual(["alias Brumunddal: 3411 is not in places.json", "alias Hamar sentrum: no source"])
	})
})

describe("attachNumbers", () => {
	test("adds kommunenummer and fylkesnummer by id", () => {
		expect(attachNumbers([{ id: 1, name: "Hamar", county: "Innlandet" }], [hamar])).toEqual([
			{ id: 1, name: "Hamar", county: "Innlandet", number: "3403", countyNumber: "34" },
		])
	})

	test("fails on a kommune the place files lack", () => {
		expect(() => attachNumbers([{ id: 9, name: "Tom", county: "Innlandet" }], [hamar])).toThrow(
			"places.json has no entry for municipality 9 Tom"
		)
	})

	test("fails when the place files and the API disagree on a name", () => {
		expect(() => attachNumbers([{ id: 1, name: "Hamr", county: "Innlandet" }], [hamar])).toThrow(
			'places.json names municipality 1 "Hamar", the API says "Hamr"'
		)
	})
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/places.test.ts`
Expected: FAIL, cannot resolve `../scripts/places.mjs`.

Then prove the seed check can go red: temporarily change `"Hamar"` to `"Hamr"` in
`data/places.json` once Step 3 has written it, run the test, see "hold every kommune the API
seeds" fail on `1 Hamar`, and change it back. Record the red in the ledger.

- [ ] **Step 3: Write the place files**

`web/data/places.json` (numbers copied from the spec's "Old links" list, see Global Constraints):

```json
[
	{ "id": 8, "number": "0301", "countyNumber": "03", "name": "Oslo" },
	{ "id": 1, "number": "3403", "countyNumber": "34", "name": "Hamar" },
	{ "id": 2, "number": "3405", "countyNumber": "34", "name": "Lillehammer" },
	{ "id": 3, "number": "3407", "countyNumber": "34", "name": "Gjøvik" },
	{ "id": 4, "number": "3411", "countyNumber": "34", "name": "Ringsaker" },
	{ "id": 6, "number": "3412", "countyNumber": "34", "name": "Løten" },
	{ "id": 5, "number": "3413", "countyNumber": "34", "name": "Stange" },
	{ "id": 7, "number": "3420", "countyNumber": "34", "name": "Elverum" }
]
```

`web/data/counties.json`:

```json
[
	{ "number": "03", "name": "Oslo" },
	{ "number": "34", "name": "Innlandet" }
]
```

`web/data/aliases.json`:

```json
[]
```

- [ ] **Step 4: Write the guard**

`web/scripts/places.mjs`:

```js
// Plain JavaScript so export-data.mjs and Vitest can both import it, as slug.mjs is. The place
// files in web/data give every kommune its kommunenummer and fylkesnummer (filter spec, Data
// contract). The export refuses to publish them unless this guard passes.
import { readFileSync } from "node:fs"
import { join } from "node:path"

export function readPlaceFiles(dir) {
	const read = (name) => JSON.parse(readFileSync(join(dir, name), "utf8"))
	return { places: read("places.json"), counties: read("counties.json"), aliases: read("aliases.json") }
}

// Strictly rising numbers keep one catalog order for the URL and rule out duplicates too.
function checkRising(list, label, errors) {
	for (let i = 1; i < list.length; i++) {
		if (list[i - 1].number >= list[i].number) {
			errors.push(`${label(list[i])}: ${list[i].number} breaks the rising number order`)
		}
	}
}

export function checkPlaces(places, counties, aliases) {
	const errors = []
	for (const c of counties) {
		if (!/^\d{2}$/.test(c.number)) errors.push(`fylke ${c.name}: number ${c.number} is not 2 digits`)
	}
	checkRising(counties, (c) => `fylke ${c.name}`, errors)
	const countyNumbers = new Set(counties.map((c) => c.number))
	const ids = new Set()
	for (const p of places) {
		if (!/^\d{4}$/.test(p.number)) {
			errors.push(`${p.name}: kommunenummer ${p.number} is not 4 digits`)
		} else if (p.number.slice(0, 2) !== p.countyNumber) {
			errors.push(`${p.name}: ${p.number} does not start with fylke ${p.countyNumber}`)
		}
		if (!countyNumbers.has(p.countyNumber)) {
			errors.push(`${p.name}: fylke ${p.countyNumber} is not in counties.json`)
		}
		if (ids.has(p.id)) errors.push(`${p.name}: id ${p.id} is used twice`)
		ids.add(p.id)
	}
	checkRising(places, (p) => p.name, errors)
	const numbers = new Set(places.map((p) => p.number))
	for (const a of aliases) {
		if (!numbers.has(a.number)) errors.push(`alias ${a.alias}: ${a.number} is not in places.json`)
		if (!a.source) errors.push(`alias ${a.alias}: no source`)
	}
	return errors
}

// The API knows kommuner by database id only. The numbers come from the place files, and a
// kommune they lack (or name differently) stops the export instead of shipping without a number.
export function attachNumbers(municipalities, places) {
	const byId = new Map(places.map((p) => [p.id, p]))
	return municipalities.map((m) => {
		const place = byId.get(m.id)
		if (!place) throw new Error(`places.json has no entry for municipality ${m.id} ${m.name}`)
		if (place.name !== m.name) {
			throw new Error(`places.json names municipality ${m.id} "${place.name}", the API says "${m.name}"`)
		}
		return { ...m, number: place.number, countyNumber: place.countyNumber }
	})
}
```

`web/scripts/places.d.mts`:

```ts
// Sibling declaration for places.mjs. This project carries no allowJs/@types/node, so a plain
// .mjs import has no type on its own. tests/places.test.ts and export-data.mjs are the consumers.
export type Place = { id: number; number: string; countyNumber: string; name: string }
export type County = { number: string; name: string }
export type Alias = { alias: string; number: string; source: string }
type Municipality = { id: number; name: string; county: string }
export type NumberedMunicipality = Municipality & { number: string; countyNumber: string }

export declare function readPlaceFiles(dir: string): {
	places: Place[]
	counties: County[]
	aliases: Alias[]
}
export declare function checkPlaces(places: Place[], counties: County[], aliases: Alias[]): string[]
export declare function attachNumbers(
	municipalities: Municipality[],
	places: Place[]
): NumberedMunicipality[]
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/places.test.ts`
Expected: PASS, every test green.

- [ ] **Step 6: Format, check, commit**

```bash
npx biome check --write data scripts/places.mjs scripts/places.d.mts tests/places.test.ts
npm test && npm run typecheck
git add data/places.json data/counties.json data/aliases.json scripts/places.mjs scripts/places.d.mts tests/places.test.ts
git commit -m "feat(data): add place files with kommunenummer and fylkesnummer, and their guard"
```

---

### Task 2: The export attaches numbers and the index loads fylker and aliases

**Files:**
- Modify: `web/scripts/export-data.mjs`, `web/scripts/export-data.d.mts`
- Modify: `web/scripts/slug.mjs:27`, `web/scripts/slug.d.mts`
- Modify: `web/src/types/api.ts:4`
- Modify: `web/src/services/data.ts`, `web/src/hooks/useCatalog.ts`, `web/src/components/LandingSearch.tsx:23-39`
- Modify: `web/tests/stubData.ts`, `web/tests/exportData.test.ts`, `web/tests/data.test.ts`
- Modify: `web/e2e/fixtures/data/municipalities.json`, `web/e2e/fixtures/data/kommuner.json`
- Create: `web/e2e/fixtures/data/counties.json`, `web/e2e/fixtures/data/aliases.json`
- Modify: every test fixture `npm run typecheck` reports (MunicipalityDto or KommuneEntry literals)

**Interfaces:**
- Consumes: `readPlaceFiles`, `checkPlaces`, `attachNumbers` from Task 1.
- Produces:
  - `MunicipalityDto = { id: number; name: string; county: string; number: string; countyNumber: string }`
  - `KommuneEntry = { id: number; slug: string; name: string; county: string; number: string }`
  - `County = { number: string; name: string }` and `Alias = { alias: string; number: string; source: string }`, exported from `services/data.ts`
  - `Index` and `Catalog` gain `counties: County[]` and `aliases: Alias[]`
  - `catalogOf(index: Index): Catalog` in `services/data.ts`
  - `exportData({ ..., placesDir?: string })`; default `web/data/`. Writes `counties.json` and `aliases.json` next to the six files it writes today.

- [ ] **Step 1: Write the failing tests**

In `web/tests/exportData.test.ts`, add `writeFileSync` to the `node:fs` import. Then add this
helper below `fakeApi`, and pass `placesDir: fakePlaces()` to **every** existing `exportData(...)`
call in the file (the fake API's kommuner are not the real ones, so the real place files would
fail them):

```ts
type FakePlace = { id: number; number: string; countyNumber: string; name: string }
// The fake API's four kommuner. "Tom" is made up for these tests, and so is its number.
const FAKE_PLACES: FakePlace[] = [
	{ id: 3, number: "0301", countyNumber: "03", name: "Oslo" },
	{ id: 1, number: "3403", countyNumber: "34", name: "Hamar" },
	{ id: 2, number: "3407", countyNumber: "34", name: "Gjøvik" },
	{ id: 4, number: "3499", countyNumber: "34", name: "Tom" },
]

function fakePlaces(places: FakePlace[] = FAKE_PLACES): string {
	const dir = mkdtempSync(join(tmpdir(), "varde-places-"))
	dirs.push(dir)
	writeFileSync(join(dir, "places.json"), JSON.stringify(places))
	writeFileSync(
		join(dir, "counties.json"),
		JSON.stringify([
			{ number: "03", name: "Oslo" },
			{ number: "34", name: "Innlandet" },
		])
	)
	writeFileSync(join(dir, "aliases.json"), "[]")
	return dir
}

const readOut = (dir: string, name: string) => JSON.parse(readFileSync(join(dir, name), "utf8"))
```

Add `"counties.json"` and `"aliases.json"` to the file-name list the first test loops over, and
rename that test to `"walks every page, writes eight files and the slug map"`. Then add:

```ts
test("attaches kommunenummer and fylkesnummer from the place files", async () => {
	const outDir = mkdtempSync(join(tmpdir(), "varde-export-"))
	dirs.push(outDir)
	await exportData({
		baseUrl: "http://api",
		outDir,
		fetchImpl: fakeApi(150) as unknown as typeof fetch,
		log: vi.fn(),
		placesDir: fakePlaces(),
	})
	expect(readOut(outDir, "municipalities.json")[0]).toEqual({
		id: 1,
		name: "Hamar",
		county: "Innlandet",
		number: "3403",
		countyNumber: "34",
	})
	expect(readOut(outDir, "kommuner.json").map((k: { number: string }) => k.number)).toEqual([
		"3403",
		"3407",
		"0301",
	])
	expect(readOut(outDir, "counties.json")).toEqual([
		{ number: "03", name: "Oslo" },
		{ number: "34", name: "Innlandet" },
	])
	expect(readOut(outDir, "aliases.json")).toEqual([])
})

test("refuses to export place files that fail the guard", async () => {
	const outDir = mkdtempSync(join(tmpdir(), "varde-export-"))
	dirs.push(outDir)
	const broken = FAKE_PLACES.map((p) => (p.name === "Hamar" ? { ...p, countyNumber: "03" } : p))
	await expect(
		exportData({
			baseUrl: "http://api",
			outDir,
			fetchImpl: fakeApi(150) as unknown as typeof fetch,
			log: vi.fn(),
			placesDir: fakePlaces(broken),
		})
	).rejects.toThrow("Hamar: 3403 does not start with fylke 03")
})

test("refuses to export when the API has a kommune the place files lack", async () => {
	const outDir = mkdtempSync(join(tmpdir(), "varde-export-"))
	dirs.push(outDir)
	await expect(
		exportData({
			baseUrl: "http://api",
			outDir,
			fetchImpl: fakeApi(150) as unknown as typeof fetch,
			log: vi.fn(),
			placesDir: fakePlaces(FAKE_PLACES.filter((p) => p.name !== "Tom")),
		})
	).rejects.toThrow("places.json has no entry for municipality 4 Tom")
})
```

In `web/tests/data.test.ts`, add (import `clearIndexCache` and `loadIndex` if the file does not
already):

```ts
test("the index carries the fylke list and the alias list", async () => {
	clearIndexCache()
	stubDataFiles({ counties: [{ number: "34", name: "Innlandet" }], aliases: [] })
	const index = await loadIndex("nb")
	expect(index.counties).toEqual([{ number: "34", name: "Innlandet" }])
	expect(index.aliases).toEqual([])
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/exportData.test.ts tests/data.test.ts`
Expected: FAIL. The export writes no `counties.json` and `municipalities.json` has no
`number`; `index.counties` is `undefined`.

- [ ] **Step 3: Implement the export side**

In `web/scripts/export-data.mjs`:

```js
import { attachNumbers, checkPlaces, readPlaceFiles } from "./places.mjs"
```

Change the signature and the municipality fetch:

```js
export async function exportData({
	baseUrl,
	outDir,
	fetchImpl = fetch,
	log = console.log,
	placesDir = fileURLToPath(new URL("../data/", import.meta.url)),
}) {
	// The place files are checked before anything is fetched, so a bad edit fails fast.
	const { places, counties, aliases } = readPlaceFiles(placesDir)
	const placeErrors = checkPlaces(places, counties, aliases)
	if (placeErrors.length > 0) throw new Error(`place files: ${placeErrors.join("; ")}`)
```

Replace `const municipalities = await getJson(fetchImpl, \`${baseUrl}/api/municipalities\`)` with:

```js
	const municipalities = attachNumbers(
		await getJson(fetchImpl, `${baseUrl}/api/municipalities`),
		places
	)
```

After `write("kommuner.json", kommuner)`, add:

```js
	write("counties.json", counties)
	write("aliases.json", aliases)
```

In `web/scripts/export-data.d.mts`, add `placesDir?: string` to `ExportDataOptions`.

In `web/scripts/slug.mjs` line 27, carry the number:

```js
		out.push({ id: m.id, slug, name: m.name, county: m.county, number: m.number })
```

In `web/scripts/slug.d.mts`, add `number: string` to both `Municipality` and `KommuneEntry`.

- [ ] **Step 4: Implement the browser side**

`web/src/types/api.ts` line 4:

```ts
// number and countyNumber are not from the API: the export attaches them from web/data/places.json.
export type MunicipalityDto = {
	id: number
	name: string
	county: string
	number: string
	countyNumber: string
}
```

`web/src/services/data.ts`: add `number: string` to `KommuneEntry`, then add the two types and
widen `Index`:

```ts
export type KommuneEntry = { id: number; slug: string; name: string; county: string; number: string }
export type County = { number: string; name: string }
// A town name that picks its kommune in Sted ("Brumunddal" picks Ringsaker). Ships empty; the
// national data pipeline fills it from a named source (filter spec, Data contract).
export type Alias = { alias: string; number: string; source: string }
export type Index = {
	resources: ResourceDto[]
	municipalities: MunicipalityDto[]
	categories: CategoryDto[]
	kommuner: KommuneEntry[]
	counties: County[]
	aliases: Alias[]
}

// Everything in the index except the rows: what the filter and the search suggestions read.
export type Catalog = Omit<Index, "resources">

export function catalogOf(index: Index): Catalog {
	return {
		municipalities: index.municipalities,
		categories: index.categories,
		kommuner: index.kommuner,
		counties: index.counties,
		aliases: index.aliases,
	}
}
```

Remove the old `Catalog` type and its comment. In `loadIndex`, fetch the two new files and
change the comment above it to "The eight files scripts/export-data.mjs writes.":

```ts
		pending = Promise.all([
			getJson<ResourceDto[]>(`/data/resources.${lang}.json`, fetchImpl),
			getJson<MunicipalityDto[]>("/data/municipalities.json", fetchImpl),
			getJson<CategoryDto[]>(`/data/categories.${lang}.json`, fetchImpl),
			getJson<KommuneEntry[]>("/data/kommuner.json", fetchImpl),
			getJson<County[]>("/data/counties.json", fetchImpl),
			getJson<Alias[]>("/data/aliases.json", fetchImpl),
		]).then(([resources, municipalities, categories, kommuner, counties, aliases]) => ({
			resources,
			municipalities,
			categories,
			kommuner,
			counties,
			aliases,
		}))
```

`web/src/hooks/useCatalog.ts`: import `catalogOf` and make `toReady` return
`{ kind: "ready", catalog: catalogOf(index) }`.

`web/src/components/LandingSearch.tsx`: import `catalogOf` and replace the hand-built object in
`setCatalog({...})` with `setCatalog(catalogOf(index))`.

`web/tests/stubData.ts`: `const empty: Index = { resources: [], municipalities: [], categories: [], kommuner: [], counties: [], aliases: [] }`,
and add `"/data/counties.json": index.counties` and `"/data/aliases.json": index.aliases` to
`files`. Change "the six JSON files" in its comment to "the eight JSON files".

- [ ] **Step 5: Update the e2e data snapshot**

CI copies `e2e/fixtures/data/*.json` straight into `public/data`, so the snapshot must have the
export's new shape. Run from `web/`:

```bash
node -e "
const fs = require('fs'); const d = 'e2e/fixtures/data/';
const places = JSON.parse(fs.readFileSync('data/places.json', 'utf8'));
const byId = new Map(places.map((p) => [p.id, p]));
const edit = (f, fn) => fs.writeFileSync(d + f, JSON.stringify(JSON.parse(fs.readFileSync(d + f, 'utf8')).map(fn)));
edit('municipalities.json', (m) => ({ ...m, number: byId.get(m.id).number, countyNumber: byId.get(m.id).countyNumber }));
edit('kommuner.json', (k) => ({ ...k, number: byId.get(k.id).number }));
fs.writeFileSync(d + 'counties.json', JSON.stringify(JSON.parse(fs.readFileSync('data/counties.json', 'utf8'))));
fs.writeFileSync(d + 'aliases.json', '[]');
"
```

Expected: no output. `head -c 120 e2e/fixtures/data/municipalities.json` shows `"number"` on
every kommune. A `Cannot read properties of undefined` error means a fixture kommune is missing
from `data/places.json`: stop and report it. Never make up a number.

- [ ] **Step 6: Fix the fixtures the type change breaks**

Run: `npm run typecheck`
For each error on a `MunicipalityDto` or `KommuneEntry` literal in `tests/`, add the numbers by
name from `web/data/places.json` (Hamar `"3403"`/`"34"`, Oslo `"0301"`/`"03"`, and so on). A
fixture kommune that is not in `places.json` is made up for its test: give it a made-up number
with the right fylke prefix (for example `"3499"`) and a short comment saying so. A `Catalog`
or `Index` literal gets `counties: []` and `aliases: []`.

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test && npm run typecheck`
Expected: PASS, including the three new export tests and the index test.

- [ ] **Step 8: Format, commit**

```bash
npx biome check --write scripts src tests
git add scripts/export-data.mjs scripts/export-data.d.mts scripts/slug.mjs scripts/slug.d.mts src/types/api.ts src/services/data.ts src/hooks/useCatalog.ts src/components/LandingSearch.tsx tests/stubData.ts tests/exportData.test.ts tests/data.test.ts e2e/fixtures/data/municipalities.json e2e/fixtures/data/kommuner.json e2e/fixtures/data/counties.json e2e/fixtures/data/aliases.json
```

Also `git add` each test file Step 6 changed (list them with `git status --short tests`), then:

```bash
git commit -m "feat(data): attach place numbers in the export and load fylker and aliases"
```

---

### Task 3: The filter state

**Files:**
- Create: `web/src/services/filters.ts`
- Test: `web/tests/filters.test.ts`

**Interfaces:**
- Consumes: `MunicipalityDto` (with `number`, `countyNumber`) and `County` from Task 2;
  `CATEGORY_SLUGS` from `services/categories.ts`; `ResourceCost` from `types/api.ts`.
- Produces (all from `services/filters.ts`):
  - `NATIONAL_MODES = ["include", "exclude", "only"] as const`, `type NationalMode`
  - `FEATURES = ["lavterskel", "dognapent"] as const`, `type Feature`
  - `COSTS = ["free", "partly", "paid"] as const`
  - `FILTER_CATEGORY_SLUGS: readonly string[]` (every slug but `lavterskeltilbud`)
  - `type Filters = { search: string; counties: string[]; municipalities: string[]; national: NationalMode; categories: string[]; features: Feature[]; costs: ResourceCost[]; page: number }`
  - `CLEAR_ALL: Omit<Filters, "page">`, `EMPTY_FILTERS: Filters`
  - `parseFilters(params: URLSearchParams): Filters`
  - `resolveFilters(filters: Filters, municipalities: readonly MunicipalityDto[], counties: readonly County[], renumbered?: Readonly<Record<string, string>>): Filters`
  - `buildSearch(filters: Filters): string`
  - `applyPatch(filters: Filters, patch: Partial<Filters>): Filters`
  - `type FilterPick = { kind: "municipality"; number: string } | { kind: "category"; slug: string }`
  - `suggestionPatch(filters: Filters, pick: FilterPick): Partial<Filters>`
  - `categorySearch(slug: string): string`
  - `hasFilters(filters: Filters): boolean`

- [ ] **Step 1: Write the failing test**

`web/tests/filters.test.ts`:

```ts
import { describe, expect, test } from "vitest"
import {
	applyPatch,
	buildSearch,
	CLEAR_ALL,
	categorySearch,
	EMPTY_FILTERS,
	type Filters,
	hasFilters,
	parseFilters,
	resolveFilters,
	suggestionPatch,
} from "../src/services/filters.ts"
import type { MunicipalityDto } from "../src/types/api.ts"

const parse = (search: string) => parseFilters(new URLSearchParams(search))
const municipalities: MunicipalityDto[] = [
	{ id: 1, name: "Hamar", county: "Innlandet", number: "3403", countyNumber: "34" },
	{ id: 4, name: "Ringsaker", county: "Innlandet", number: "3411", countyNumber: "34" },
	{ id: 8, name: "Oslo", county: "Oslo", number: "0301", countyNumber: "03" },
]
const counties = [
	{ number: "03", name: "Oslo" },
	{ number: "34", name: "Innlandet" },
]
const full: Filters = {
	search: "rus hamar",
	counties: ["34"],
	municipalities: ["0301"],
	national: "exclude",
	categories: ["rus"],
	features: ["lavterskel"],
	costs: ["free"],
	page: 2,
}

describe("parseFilters", () => {
	test("an empty query is the empty filter", () => {
		expect(parse("")).toEqual(EMPTY_FILTERS)
	})

	test.each([
		["?national=true", "only"],
		["?national=only", "only"],
		["?national=exclude", "exclude"],
		["?national=yes", "include"],
		["", "include"],
	])("%s reads national as %s", (search, mode) => {
		expect(parse(search).national).toBe(mode)
	})

	test("an old Lavterskeltilbud category link becomes the Lavterskel Egenskap", () => {
		expect(parse("?category=lavterskeltilbud&category=rus")).toMatchObject({
			categories: ["rus"],
			features: ["lavterskel"],
		})
	})

	test("unknown values are dropped and repeats deduplicated, in catalog order", () => {
		expect(
			parse(
				"?category=rus&category=bogus&category=okonomi&category=rus&feature=dognapent&feature=akutt&feature=lavterskel&cost=paid&cost=free&cost=cheap"
			)
		).toMatchObject({
			categories: ["okonomi", "rus"],
			features: ["lavterskel", "dognapent"],
			costs: ["free", "paid"],
		})
	})

	test("places keep only their shape here: an old id, a kommunenummer or a fylkesnummer", () => {
		expect(
			parse(
				"?municipality=1&municipality=3403&municipality=abc&municipality=340&municipality=0&county=34&county=3&county=034"
			)
		).toMatchObject({ municipalities: ["1", "3403"], counties: ["34"] })
	})

	test("Bare nasjonale wins over Sted in one URL, as the old toggle did", () => {
		expect(parse("?national=true&municipality=1&county=34")).toMatchObject({
			national: "only",
			municipalities: [],
			counties: [],
		})
	})

	test("page is a positive integer, else 1", () => {
		expect(parse("?page=3").page).toBe(3)
		expect(parse("?page=0").page).toBe(1)
		expect(parse("?page=x").page).toBe(1)
	})
})

describe("resolveFilters", () => {
	test.each([
		["1", "3403"],
		["4", "3411"],
		["8", "0301"],
	])("old id %s maps to kommunenummer %s", (id, number) => {
		const resolved = resolveFilters(parse(`?municipality=${id}`), municipalities, counties)
		expect(resolved.municipalities).toEqual([number])
	})

	test("a place without data is dropped, so the list widens", () => {
		const resolved = resolveFilters(
			parse("?municipality=99&municipality=3420&county=50"),
			municipalities,
			counties
		)
		expect(resolved).toMatchObject({ municipalities: [], counties: [] })
	})

	test("an old id and its kommunenummer collapse to one pick, in number order", () => {
		const resolved = resolveFilters(
			parse("?municipality=3411&municipality=1&municipality=3403&municipality=8"),
			municipalities,
			counties
		)
		expect(resolved.municipalities).toEqual(["0301", "3403", "3411"])
	})

	test("a renumbered kommune follows the correspondence table", () => {
		// A made-up row: the real table arrives with spec B (storage).
		const resolved = resolveFilters(parse("?municipality=9999"), municipalities, counties, {
			"9999": "3403",
		})
		expect(resolved.municipalities).toEqual(["3403"])
	})
})

describe("buildSearch", () => {
	test("writes the params in one fixed order", () => {
		expect(buildSearch(full)).toBe(
			"?search=rus+hamar&county=34&municipality=0301&national=exclude&category=rus&feature=lavterskel&cost=free&page=2"
		)
	})

	test("the empty filter is no query at all", () => {
		expect(buildSearch(EMPTY_FILTERS)).toBe("")
	})

	test.each([
		"?search=%C3%A6%C3%B8%C3%A5+rus&municipality=3403&category=rus",
		"?county=34&national=exclude&feature=dognapent&cost=partly&page=4",
	])("parse then build gives the same URL: %s", (search) => {
		expect(buildSearch(parse(search))).toBe(search)
	})

	test("two orders of the same params build one URL", () => {
		expect(buildSearch(parse("?category=rus&municipality=3403&category=bolig"))).toBe(
			buildSearch(parse("?municipality=3403&category=bolig&category=rus"))
		)
	})
})

describe("applyPatch", () => {
	const base: Filters = { ...EMPTY_FILTERS, page: 3 }

	test("choosing Bare nasjonale clears the Sted picks", () => {
		expect(
			applyPatch({ ...base, municipalities: ["3403"], counties: ["34"] }, { national: "only" })
		).toMatchObject({ national: "only", municipalities: [], counties: [] })
	})

	test("picking a place while Bare nasjonale is on switches the radio back to Ta med", () => {
		expect(applyPatch({ ...base, national: "only" }, { municipalities: ["3403"] })).toMatchObject(
			{ national: "include", municipalities: ["3403"] }
		)
	})

	test("Skjul keeps the Sted picks", () => {
		expect(applyPatch({ ...base, municipalities: ["3403"] }, { national: "exclude" })).toMatchObject(
			{ national: "exclude", municipalities: ["3403"] }
		)
	})

	test("any filter change resets the page, a page change keeps it", () => {
		expect(applyPatch(base, { costs: ["free"] }).page).toBe(1)
		expect(applyPatch(base, { page: 5 }).page).toBe(5)
	})

	test("values come back deduplicated and in catalog order", () => {
		expect(
			applyPatch(base, {
				categories: ["rus", "bolig", "rus"],
				municipalities: ["3411", "3403", "3411"],
				features: ["dognapent", "lavterskel"],
			})
		).toMatchObject({
			categories: ["bolig", "rus"],
			municipalities: ["3403", "3411"],
			features: ["lavterskel", "dognapent"],
		})
	})

	test("CLEAR_ALL clears every filter and the search text", () => {
		expect(applyPatch(full, CLEAR_ALL)).toEqual(EMPTY_FILTERS)
	})
})

describe("picks and links", () => {
	const current: Filters = { ...EMPTY_FILTERS, categories: ["rus"], municipalities: ["0301"] }

	test("a suggestion adds to the filter instead of replacing it", () => {
		expect(
			applyPatch(current, suggestionPatch(current, { kind: "category", slug: "bolig" }))
		).toMatchObject({ categories: ["bolig", "rus"] })
		expect(
			applyPatch(current, suggestionPatch(current, { kind: "municipality", number: "3403" }))
		).toMatchObject({ municipalities: ["0301", "3403"] })
	})

	test("a Lavterskeltilbud suggestion ticks the Lavterskel Egenskap", () => {
		expect(
			applyPatch(current, suggestionPatch(current, { kind: "category", slug: "lavterskeltilbud" }))
		).toMatchObject({ categories: ["rus"], features: ["lavterskel"] })
	})

	test("a category link goes to its category, Lavterskeltilbud to the Egenskap", () => {
		expect(categorySearch("rus")).toBe("?category=rus")
		expect(categorySearch("lavterskeltilbud")).toBe("?feature=lavterskel")
	})

	test("hasFilters ignores the page", () => {
		expect(hasFilters({ ...EMPTY_FILTERS, page: 4 })).toBe(false)
		expect(hasFilters({ ...EMPTY_FILTERS, costs: ["paid"] })).toBe(true)
	})
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/filters.test.ts`
Expected: FAIL, cannot resolve `../src/services/filters.ts`.

- [ ] **Step 3: Write the implementation**

`web/src/services/filters.ts`:

```ts
import type { MunicipalityDto, ResourceCost } from "../types/api.ts"
import { CATEGORY_SLUGS } from "./categories.ts"
import type { County } from "./data.ts"

// The /sok filter's state and its URL (filter spec, Filter model). Place numbers stay strings,
// because the leading zero in "0301" and "03" matters.

export const NATIONAL_MODES = ["include", "exclude", "only"] as const
export type NationalMode = (typeof NATIONAL_MODES)[number]
export const FEATURES = ["lavterskel", "dognapent"] as const
export type Feature = (typeof FEATURES)[number]
export const COSTS = ["free", "partly", "paid"] as const satisfies readonly ResourceCost[]

// Lavterskeltilbud is reached through the Lavterskel Egenskap, never as a category, and an old
// link's category=lavterskeltilbud parses to feature=lavterskel (filter spec, decision 5).
export const FILTER_CATEGORY_SLUGS: readonly string[] = CATEGORY_SLUGS.filter(
	(slug) => slug !== "lavterskeltilbud"
)

export type Filters = {
	search: string
	counties: string[]
	municipalities: string[]
	national: NationalMode
	categories: string[]
	features: Feature[]
	costs: ResourceCost[]
	page: number
}

export const CLEAR_ALL: Omit<Filters, "page"> = {
	search: "",
	counties: [],
	municipalities: [],
	national: "include",
	categories: [],
	features: [],
	costs: [],
}
export const EMPTY_FILTERS: Filters = { ...CLEAR_ALL, page: 1 }

// The keys whose change sends the list back to page 1.
const FILTER_KEYS = [
	"search",
	"counties",
	"municipalities",
	"national",
	"categories",
	"features",
	"costs",
] as const

// An old database id is one or two digits; a kommunenummer is four.
const OLD_ID_OR_NUMBER = /^(?:[1-9]\d?|\d{4})$/
const COUNTY_NUMBER = /^\d{2}$/

// Keeps the known values, once each, in the order given. That one step validates, dedupes and
// puts a list in catalog order.
function inOrder<T extends string>(order: readonly T[], values: readonly string[]): T[] {
	return order.filter((value) => values.includes(value))
}

function sortedUnique(values: readonly string[]): string[] {
	return [...new Set(values)].sort()
}

function positiveInt(value: string | null): number | null {
	if (value === null || !/^\d+$/.test(value)) return null
	const parsed = Number(value)
	return parsed > 0 ? parsed : null
}

// Reads what the URL alone can tell. Places are kept by shape only here: whether "1" is Hamar
// or "3420" has data needs the catalog, which resolveFilters adds once it has loaded.
export function parseFilters(params: URLSearchParams): Filters {
	const categories = params.getAll("category")
	const features = params.getAll("feature")
	if (categories.includes("lavterskeltilbud")) features.push("lavterskel")
	const rawNational = params.get("national")
	const national: NationalMode =
		rawNational === "only" || rawNational === "true"
			? "only"
			: rawNational === "exclude"
				? "exclude"
				: "include"
	// Bare nasjonale and Sted exclude each other. A URL with both keeps Bare nasjonale, as the
	// old national toggle did.
	const only = national === "only"
	return {
		search: params.get("search") ?? "",
		counties: only ? [] : sortedUnique(params.getAll("county").filter((v) => COUNTY_NUMBER.test(v))),
		municipalities: only
			? []
			: sortedUnique(params.getAll("municipality").filter((v) => OLD_ID_OR_NUMBER.test(v))),
		national,
		categories: inOrder(FILTER_CATEGORY_SLUGS, categories),
		features: inOrder(FEATURES, features),
		costs: inOrder(COSTS, params.getAll("cost")),
		page: positiveInt(params.get("page")) ?? 1,
	}
}

// Maps the places onto the catalog: an old database id becomes its kommunenummer, a renumbered
// kommune its new number, and a place without data is dropped, so the link widens instead of
// breaking (filter spec, Old links).
export function resolveFilters(
	filters: Filters,
	municipalities: readonly MunicipalityDto[],
	counties: readonly County[],
	renumbered: Readonly<Record<string, string>> = {}
): Filters {
	const known = new Set(municipalities.map((m) => m.number))
	const byOldId = new Map(municipalities.map((m) => [String(m.id), m.number]))
	const mapped = filters.municipalities
		.map((value) => (value.length <= 2 ? byOldId.get(value) : (renumbered[value] ?? value)))
		.filter((number): number is string => number !== undefined && known.has(number))
	const countyNumbers = new Set(counties.map((c) => c.number))
	return {
		...filters,
		municipalities: sortedUnique(mapped),
		counties: filters.counties.filter((number) => countyNumbers.has(number)),
	}
}

// One filter state, one URL: the params in a fixed order, the values as the state holds them
// (parseFilters and applyPatch keep them in catalog order).
export function buildSearch(filters: Filters): string {
	const params = new URLSearchParams()
	if (filters.search) params.set("search", filters.search)
	for (const number of filters.counties) params.append("county", number)
	for (const number of filters.municipalities) params.append("municipality", number)
	if (filters.national !== "include") params.set("national", filters.national)
	for (const slug of filters.categories) params.append("category", slug)
	for (const feature of filters.features) params.append("feature", feature)
	for (const cost of filters.costs) params.append("cost", cost)
	if (filters.page > 1) params.set("page", String(filters.page))
	const query = params.toString()
	return query ? `?${query}` : ""
}

export function applyPatch(filters: Filters, patch: Partial<Filters>): Filters {
	const next: Filters = { ...filters, ...patch }
	if (patch.national === "only") {
		next.counties = []
		next.municipalities = []
	} else if (next.national === "only" && (next.counties.length > 0 || next.municipalities.length > 0)) {
		next.national = "include"
	}
	next.counties = sortedUnique(next.counties)
	next.municipalities = sortedUnique(next.municipalities)
	next.categories = inOrder(FILTER_CATEGORY_SLUGS, next.categories)
	next.features = inOrder(FEATURES, next.features)
	next.costs = inOrder(COSTS, next.costs)
	if (FILTER_KEYS.some((key) => key in patch) && patch.page === undefined) next.page = 1
	return next
}

// What a picked search suggestion or a category link adds. Lavterskeltilbud ticks the
// Egenskap instead of a category (filter spec, decision 5).
export type FilterPick = { kind: "municipality"; number: string } | { kind: "category"; slug: string }

export function suggestionPatch(filters: Filters, pick: FilterPick): Partial<Filters> {
	if (pick.kind === "municipality") return { municipalities: [...filters.municipalities, pick.number] }
	if (pick.slug === "lavterskeltilbud") return { features: [...filters.features, "lavterskel"] }
	return { categories: [...filters.categories, pick.slug] }
}

export function categorySearch(slug: string): string {
	return buildSearch(applyPatch(EMPTY_FILTERS, suggestionPatch(EMPTY_FILTERS, { kind: "category", slug })))
}

export function hasFilters(filters: Filters): boolean {
	return buildSearch({ ...filters, page: 1 }) !== ""
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/filters.test.ts`
Expected: PASS.

- [ ] **Step 5: Format, check, commit**

```bash
npx biome check --write src/services/filters.ts tests/filters.test.ts
npm test && npm run typecheck
git add src/services/filters.ts tests/filters.test.ts
git commit -m "feat(web): add the filter state: parse, resolve, build and patch the new URL params"
```

---

### Task 4: Matching rows and the loadRows seam

**Files:**
- Modify: `web/src/services/query.ts`
- Create: `web/src/services/rows.ts`
- Create: `web/tests/filterFixture.ts`
- Test: `web/tests/query.test.ts` (append), `web/tests/rows.test.ts`

**Interfaces:**
- Consumes: `Filters`, `Feature`, `NationalMode`, `EMPTY_FILTERS` from Task 3;
  `MunicipalityDto` from Task 2; `Index` from Task 2.
- Produces:
  - `pickedIds(filters: Filters, municipalities: readonly MunicipalityDto[]): ReadonlySet<number> | null` (null means no Sted pick)
  - `matchesWhere(r: ResourceDto, national: NationalMode, ids: ReadonlySet<number> | null): boolean`
  - `hasFeature(r: ResourceDto, feature: Feature): boolean`
  - `matchesFilters(r: ResourceDto, filters: Filters, ids: ReadonlySet<number> | null): boolean`
  - `applyFilters(resources: readonly ResourceDto[], filters: Filters, municipalities: readonly MunicipalityDto[]): PagedResult<ResourceDto>`
  - `loadRows(index: Pick<Index, "resources">, places: Pick<Filters, "counties" | "municipalities">): ResourceDto[]` in `services/rows.ts`
  - Test fixture `tests/filterFixture.ts`: `places`, `rows`, `f(over?)`, and the five named rows.
  - The old `applyQuery` stays until Task 6 removes it.

- [ ] **Step 1: Write the shared fixture**

`web/tests/filterFixture.ts`:

```ts
import { EMPTY_FILTERS, type Filters } from "../src/services/filters.ts"
import type { CategoryDto, MunicipalityDto } from "../src/types/api.ts"
import { makeResource } from "./stubData.ts"

// Five rows that cover every filter group, shared by the query and facet tests. Names sort A to
// E, so the expected order reads off the ids (local rows first, then national).
const cat = (slug: string): CategoryDto => ({ id: 0, slug, name: slug, isFallbackTranslation: false })

export const places: MunicipalityDto[] = [
	{ id: 8, name: "Oslo", county: "Oslo", number: "0301", countyNumber: "03" },
	{ id: 1, name: "Hamar", county: "Innlandet", number: "3403", countyNumber: "34" },
	{ id: 4, name: "Ringsaker", county: "Innlandet", number: "3411", countyNumber: "34" },
]

export const hamarRus = makeResource({
	id: 1,
	name: "A",
	isNational: false,
	municipalityId: 1,
	categories: [cat("rus")],
})
export const ringsakerBolig = makeResource({
	id: 2,
	name: "B",
	isNational: false,
	municipalityId: 4,
	categories: [cat("bolig")],
})
export const osloRusLavterskel = makeResource({
	id: 3,
	name: "C",
	isNational: false,
	municipalityId: 8,
	categories: [cat("rus")],
	isLowThreshold: true,
})
// A shared krisesenter: no address kommune of its own, serves Hamar and Ringsaker.
export const sharedKrisesenter = makeResource({
	id: 4,
	name: "D",
	isNational: false,
	municipalityId: null,
	servedMunicipalityIds: [1, 4],
	categories: [cat("vold-og-overgrep")],
})
export const nationalRus = makeResource({
	id: 5,
	name: "E",
	isNational: true,
	categories: [cat("rus")],
	isAlwaysOpen: true,
	cost: "free",
})

export const rows = [hamarRus, ringsakerBolig, osloRusLavterskel, sharedKrisesenter, nationalRus]

export const f = (over: Partial<Filters> = {}): Filters => ({ ...EMPTY_FILTERS, ...over })
```

- [ ] **Step 2: Write the failing tests**

Append to `web/tests/query.test.ts` (merge the new names into its existing `query.ts` import):

```ts
import { applyFilters, pickedIds } from "../src/services/query.ts"
import { f, places, rows } from "./filterFixture.ts"

describe("applyFilters", () => {
	const ids = (over: Parameters<typeof f>[0]) =>
		applyFilters(rows, f(over), places).items.map((r) => r.id)

	test.each([
		["no filter: every row, local first", {}, [1, 2, 3, 4, 5]],
		["a kommune: located there, serving it, or national", { municipalities: ["3403"] }, [1, 4, 5]],
		["a fylke expands to its kommuner", { counties: ["34"] }, [1, 2, 4, 5]],
		["two kommuner are a union", { municipalities: ["0301", "3411"] }, [2, 3, 4, 5]],
		["Skjul drops national rows", { municipalities: ["3403"], national: "exclude" }, [1, 4]],
		["Skjul with no place starts from every row", { national: "exclude" }, [1, 2, 3, 4]],
		["Bare nasjonale", { national: "only" }, [5]],
		["Kategorier are any-of", { categories: ["bolig", "rus"] }, [1, 2, 3, 5]],
		["one Egenskap", { features: ["lavterskel"] }, [3]],
		["Egenskaper are all-of", { features: ["lavterskel", "dognapent"] }, []],
		["Pris drops rows with no stated cost", { costs: ["free"] }, [5]],
		["search narrows", { search: "c" }, [3]],
		[
			"groups AND together",
			{ municipalities: ["0301"], categories: ["rus"], features: ["lavterskel"] },
			[3],
		],
	] as const)("%s", (_, over, expected) => {
		expect(ids(over as Parameters<typeof f>[0])).toEqual(expected)
	})

	test("a local row with no kommune and no served kommuner drops out under any Sted pick", () => {
		const orphan = { ...rows[0], id: 9, name: "F", municipalityId: null, servedMunicipalityIds: [] }
		expect(applyFilters([orphan], f(), places).totalCount).toBe(1)
		expect(applyFilters([orphan], f({ counties: ["34"] }), places).totalCount).toBe(0)
		expect(applyFilters([orphan], f({ municipalities: ["3403"] }), places).totalCount).toBe(0)
	})

	test("pages through the sorted rows", () => {
		const many = Array.from({ length: 25 }, (_, i) => ({
			...rows[0],
			id: i + 1,
			name: `R${String(i + 1).padStart(2, "0")}`,
		}))
		const page2 = applyFilters(many, f({ page: 2 }), places)
		expect(page2.totalCount).toBe(25)
		expect(page2.items.map((r) => r.id)).toEqual([21, 22, 23, 24, 25])
	})
})

describe("pickedIds", () => {
	test("no pick is null, a fylke and a kommune add up", () => {
		expect(pickedIds(f(), places)).toBeNull()
		expect([...(pickedIds(f({ counties: ["03"], municipalities: ["3411"] }), places) ?? [])].sort()).toEqual([4, 8])
	})
})
```

`web/tests/rows.test.ts`:

```ts
import { expect, test } from "vitest"
import { loadRows } from "../src/services/rows.ts"
import { rows } from "./filterFixture.ts"

test("loadRows hands back every row while all rows live in one file", () => {
	expect(loadRows({ resources: rows }, { counties: ["34"], municipalities: [] })).toBe(rows)
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/query.test.ts tests/rows.test.ts`
Expected: FAIL, `applyFilters` and `pickedIds` are not exported, and `rows.ts` does not exist.

- [ ] **Step 4: Write the implementation**

Append to `web/src/services/query.ts` (add the imports at the top: `MunicipalityDto` from
`../types/api.ts`, and `Feature`, `Filters as FilterState`, `NationalMode` from `./filters.ts`.
The alias avoids a clash with the old `Filters` import, which Task 6 removes):

```ts
// The database ids a Sted pick covers: every picked kommune plus every kommune in a picked fylke.
// null means no pick, so every row passes Sted.
export function pickedIds(
	filters: FilterState,
	municipalities: readonly MunicipalityDto[]
): ReadonlySet<number> | null {
	if (filters.counties.length === 0 && filters.municipalities.length === 0) return null
	const ids = new Set<number>()
	for (const m of municipalities) {
		if (filters.municipalities.includes(m.number) || filters.counties.includes(m.countyNumber)) {
			ids.add(m.id)
		}
	}
	return ids
}

function coversPlace(r: ResourceDto, ids: ReadonlySet<number>): boolean {
	return (
		(r.municipalityId !== null && ids.has(r.municipalityId)) ||
		r.servedMunicipalityIds.some((id) => ids.has(id))
	)
}

// Sted and the national choice together (filter spec, How each group matches a row). A row
// matches a picked kommune when it is located there or serves it, so a shared krisesenter shows
// in every kommune it covers.
export function matchesWhere(
	r: ResourceDto,
	national: NationalMode,
	ids: ReadonlySet<number> | null
): boolean {
	if (national === "only") return r.isNational
	if (national === "exclude" && r.isNational) return false
	if (ids === null) return true
	return (national === "include" && r.isNational) || coversPlace(r, ids)
}

export function hasFeature(r: ResourceDto, feature: Feature): boolean {
	return feature === "lavterskel" ? r.isLowThreshold : r.isAlwaysOpen
}

// Groups AND together. Kategorier and Pris are any-of, Egenskaper all-of. A row with no stated
// cost drops out once any Pris box is ticked.
export function matchesFilters(
	r: ResourceDto,
	filters: FilterState,
	ids: ReadonlySet<number> | null
): boolean {
	return (
		matchesSearch(r, filters.search) &&
		matchesWhere(r, filters.national, ids) &&
		(filters.categories.length === 0 ||
			r.categories.some((c) => filters.categories.includes(c.slug))) &&
		filters.features.every((feature) => hasFeature(r, feature)) &&
		(filters.costs.length === 0 || (r.cost !== null && filters.costs.includes(r.cost)))
	)
}

export function applyFilters(
	resources: readonly ResourceDto[],
	filters: FilterState,
	municipalities: readonly MunicipalityDto[]
): PagedResult<ResourceDto> {
	const ids = pickedIds(filters, municipalities)
	const sorted = resources.filter((r) => matchesFilters(r, filters, ids)).sort(compareResources)
	const start = (filters.page - 1) * PAGE_SIZE
	return {
		items: sorted.slice(start, start + PAGE_SIZE),
		page: filters.page,
		pageSize: PAGE_SIZE,
		totalCount: sorted.length,
	}
}
```

`web/src/services/rows.ts`:

```ts
import type { ResourceDto } from "../types/api.ts"
import type { Index } from "./data.ts"
import type { Filters } from "./filters.ts"

// The rows filtering and facet counts work on. Today every row lives in one file per language,
// so the picked places narrow nothing here yet. Spec B (storage) can make this load only the
// picked places' files without touching the filter code (filter spec, Data contract).
export function loadRows(
	index: Pick<Index, "resources">,
	_places: Pick<Filters, "counties" | "municipalities">
): ResourceDto[] {
	return index.resources
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/query.test.ts tests/rows.test.ts`
Expected: PASS.

- [ ] **Step 6: Format, check, commit**

```bash
npx biome check --write src/services/query.ts src/services/rows.ts tests/filterFixture.ts tests/query.test.ts tests/rows.test.ts
npm test && npm run typecheck
git add src/services/query.ts src/services/rows.ts tests/filterFixture.ts tests/query.test.ts tests/rows.test.ts
git commit -m "feat(web): match rows on every filter group, with a loadRows seam for storage"
```

---

### Task 5: Facet counts

**Files:**
- Create: `web/src/services/facets.ts`
- Test: `web/tests/facets.test.ts`

**Interfaces:**
- Consumes: `pickedIds`, `matchesWhere`, `hasFeature`, `matchesSearch` from `query.ts` (Task 4);
  `NATIONAL_MODES`, `FEATURES`, `COSTS`, `FILTER_CATEGORY_SLUGS`, `Filters` from Task 3.
- Produces: `type FacetCounts = { national: Record<NationalMode, number>; categories: Record<string, number>; features: Record<Feature, number>; costs: Record<ResourceCost, number> }`
  and `facetCounts(rows: readonly ResourceDto[], filters: Filters, municipalities: readonly MunicipalityDto[]): FacetCounts`.
  PR 2's FacetGroup reads it.

- [ ] **Step 1: Write the failing test**

`web/tests/facets.test.ts`:

```ts
import { describe, expect, test } from "vitest"
import { facetCounts } from "../src/services/facets.ts"
import type { Filters } from "../src/services/filters.ts"
import { applyFilters } from "../src/services/query.ts"
import { f, places, rows } from "./filterFixture.ts"

describe("facetCounts: the list each option would give if ticked, every other tick kept", () => {
	test("with nothing ticked, each option counts the rows it alone would show", () => {
		const counts = facetCounts(rows, f(), places)
		expect(counts.categories.rus).toBe(3)
		expect(counts.categories.bolig).toBe(1)
		expect(counts.categories.okonomi).toBe(0)
		expect(counts.features).toEqual({ lavterskel: 1, dognapent: 1 })
		expect(counts.costs).toEqual({ free: 1, partly: 0, paid: 0 })
		expect(counts.national).toEqual({ include: 5, exclude: 4, only: 1 })
	})

	test("an any-of group widens: with Rus ticked, Bolig counts rows that are rus or bolig", () => {
		const counts = facetCounts(rows, f({ categories: ["rus"] }), places)
		expect(counts.categories.bolig).toBe(4)
		expect(counts.categories.rus).toBe(3)
	})

	test("Egenskaper narrow: with Døgnåpent ticked, Lavterskel counts rows that are both", () => {
		expect(facetCounts(rows, f({ features: ["dognapent"] }), places).features).toEqual({
			lavterskel: 0,
			dognapent: 1,
		})
	})

	test("the radio counts the list with that option chosen; Bare nasjonale ignores Sted", () => {
		expect(facetCounts(rows, f({ counties: ["34"] }), places).national).toEqual({
			include: 4,
			exclude: 3,
			only: 1,
		})
	})

	test("search narrows every count", () => {
		expect(facetCounts(rows, f({ search: "e" }), places).national).toEqual({
			include: 1,
			exclude: 0,
			only: 1,
		})
	})

	test("Lavterskeltilbud has no category count", () => {
		expect("lavterskeltilbud" in facetCounts(rows, f(), places).categories).toBe(false)
	})

	test.each<Partial<Filters>>([
		{ categories: ["rus", "bolig"] },
		{ features: ["lavterskel"] },
		{ costs: ["free"] },
		{ municipalities: ["0301"], categories: ["rus"] },
		{ national: "exclude", counties: ["34"] },
	])("a ticked option shows the list as it is now (%o)", (over) => {
		const filters = f(over)
		const total = applyFilters(rows, filters, places).totalCount
		const counts = facetCounts(rows, filters, places)
		for (const slug of filters.categories) expect(counts.categories[slug]).toBe(total)
		for (const feature of filters.features) expect(counts.features[feature]).toBe(total)
		for (const cost of filters.costs) expect(counts.costs[cost]).toBe(total)
		expect(counts.national[filters.national]).toBe(total)
	})
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/facets.test.ts`
Expected: FAIL, cannot resolve `../src/services/facets.ts`.

- [ ] **Step 3: Write the implementation**

`web/src/services/facets.ts`:

```ts
import type { MunicipalityDto, ResourceCost, ResourceDto } from "../types/api.ts"
import {
	COSTS,
	FEATURES,
	type Feature,
	FILTER_CATEGORY_SLUGS,
	type Filters,
	NATIONAL_MODES,
	type NationalMode,
} from "./filters.ts"
import { hasFeature, matchesSearch, matchesWhere, pickedIds } from "./query.ts"

export type FacetCounts = {
	national: Record<NationalMode, number>
	categories: Record<string, number>
	features: Record<Feature, number>
	costs: Record<ResourceCost, number>
}

// How many rows the list would hold if each option were ticked, every other tick kept (filter
// spec, Facet counts). Any-of groups widen, Egenskaper narrow, the radio swaps, and a ticked
// option shows the list as it is. One pass: each row's group matches are worked out once.
export function facetCounts(
	rows: readonly ResourceDto[],
	filters: Filters,
	municipalities: readonly MunicipalityDto[]
): FacetCounts {
	const counts: FacetCounts = {
		national: { include: 0, exclude: 0, only: 0 },
		categories: Object.fromEntries(FILTER_CATEGORY_SLUGS.map((slug) => [slug, 0])),
		features: { lavterskel: 0, dognapent: 0 },
		costs: { free: 0, partly: 0, paid: 0 },
	}
	const ids = pickedIds(filters, municipalities)
	for (const r of rows) {
		if (!matchesSearch(r, filters.search)) continue
		const where = matchesWhere(r, filters.national, ids)
		// "any" is true when the row has one of the group's ticked values. With nothing ticked it
		// is false, so an option then counts only the rows that have it.
		const anyCategory = r.categories.some((c) => filters.categories.includes(c.slug))
		const categories = filters.categories.length === 0 || anyCategory
		const features = filters.features.every((feature) => hasFeature(r, feature))
		const anyCost = r.cost !== null && filters.costs.includes(r.cost)
		const costs = filters.costs.length === 0 || anyCost

		if (categories && features && costs) {
			for (const mode of NATIONAL_MODES) {
				// Bare nasjonale clears the Sted picks (applyPatch), so its count ignores them.
				if (matchesWhere(r, mode, mode === "only" ? null : ids)) counts.national[mode]++
			}
		}
		if (where && features && costs) {
			for (const slug of FILTER_CATEGORY_SLUGS) {
				if (anyCategory || r.categories.some((c) => c.slug === slug)) counts.categories[slug]++
			}
		}
		if (where && categories && costs && features) {
			for (const feature of FEATURES) if (hasFeature(r, feature)) counts.features[feature]++
		}
		if (where && categories && features) {
			for (const cost of COSTS) if (anyCost || r.cost === cost) counts.costs[cost]++
		}
	}
	return counts
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/facets.test.ts`
Expected: PASS.

- [ ] **Step 5: Format, check, commit**

```bash
npx biome check --write src/services/facets.ts tests/facets.test.ts
npm test && npm run typecheck
git add src/services/facets.ts tests/facets.test.ts
git commit -m "feat(web): count what each filter option would give, in one pass over the rows"
```

---

### Task 6: Switch the site to the new model

Every consumer of the old `Filters` moves to `services/filters.ts` in one task, because the type
change breaks them all at once. Behaviour that changes for a visitor: the kommune combobox
writes a kommunenummer, the national button writes `national=only`, a search suggestion adds to
the filter instead of replacing it, the Lavterskeltilbud chip and landing chip toggle the
Lavterskel Egenskap, and "Tøm" clears every new key too.

**Files:**
- Modify: `web/src/services/urlState.ts` (remove the filter part, keep routes, languages and `FILTER_PARAMS`)
- Modify: `web/src/services/query.ts` (remove `applyQuery`, rewrite the header comment)
- Modify: `web/src/services/match.ts` (`Suggestion` carries `number`)
- Modify: `web/src/hooks/useUrlState.ts`, `web/src/hooks/useResources.ts`
- Modify: `web/src/components/ListPage.tsx`, `web/src/components/FilterBar.tsx`,
  `web/src/components/LandingSearch.tsx`, `web/src/components/LandingPage.tsx:66,81`,
  `web/src/components/KommunePage.tsx:24,112`
- Test: `web/tests/urlState.test.ts`, `web/tests/query.test.ts`, `web/tests/filterbar.test.tsx`,
  `web/tests/list.test.tsx`, `web/tests/landing.test.tsx`, `web/tests/kommune.test.tsx`,
  `web/tests/match.test.ts`, and any other file `npm run typecheck` reports

**Interfaces:**
- Consumes: everything from Tasks 2 to 4.
- Produces: `Suggestion = { kind: "municipality"; number: string; name: string } | { kind: "category"; slug: string; name: string }`
  (assignable to `FilterPick`). `useResources(filters, lang)` keeps its signature and resolves the
  filters against the index itself. `ListPage` computes `resolved` (memoised) for Task 7.

- [ ] **Step 1: Write the failing tests**

Add to `web/tests/landing.test.tsx` (Review Focus 5). Copy the stub-and-render shape from the
existing landing-search suggestion tests in that file. The kommune must be in `municipalities`
but not in `kommuner`:

```tsx
test("a suggested kommune without its own page goes to /sok with its kommunenummer", async () => {
	stubDataFiles({
		municipalities: [{ id: 1, name: "Hamar", county: "Innlandet", number: "3403", countyNumber: "34" }],
		kommuner: [],
	})
	window.history.pushState(null, "", "/")
	const user = userEvent.setup()
	render(<App />)
	await user.type(await screen.findByRole("searchbox"), "Hamar")
	await user.click(await screen.findByRole("button", { name: /Hamar/ }))
	await waitFor(() => expect(window.location.pathname + window.location.search).toBe("/sok?municipality=3403"))
})
```

(If the file's suggestion tests use different accessible names for the search box or the
suggestion button, use theirs.)

Add to `web/tests/list.test.tsx`:

```tsx
test("a category suggestion adds to the ticked categories instead of replacing them", async () => {
	stubDataFiles({
		resources: [resource],
		municipalities,
		categories: [
			{ id: 4, slug: "rus", name: "Rus", isFallbackTranslation: false },
			{ id: 2, slug: "bolig", name: "Bolig", isFallbackTranslation: false },
		],
	})
	window.history.pushState(null, "", "/sok?category=rus&search=bol")
	const user = userEvent.setup()
	render(<App />)
	await user.click(await screen.findByRole("button", { name: /Bolig/ }))
	await waitFor(() => expect(window.location.search).toContain("category=bolig&category=rus"))
})
```

(Use the name the suggestion button has in the existing suggestion tests in `list.test.tsx` if
`/Bolig/` matches both the chip and the suggestion; scope the query with `within` to the
suggestions region as those tests do.)

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/landing.test.tsx tests/list.test.tsx`
Expected: the two new tests FAIL (the landing one goes to `?municipality=1`, the list one
replaces `rus`).

- [ ] **Step 3: Move the services**

`web/src/services/urlState.ts`: delete the `Filters` type, `positiveInt`, `parseFilters`,
`buildSearch` and `applyPatch`. Keep `FILTER_PARAMS` and its comment unchanged.

`web/src/services/query.ts`: delete `applyQuery` and the old `import type { Filters } from
"./urlState.ts"`. Rename the `FilterState` alias import from Task 4 to plain `Filters` and
update its uses. Replace the header comment with:

```ts
// Search and filtering run in the browser only. The C# ResourceRepository.SearchAsync is frozen
// as it is and gets none of these filters (filter spec, decision 7).
```

`web/src/services/match.ts`: the municipality suggestion carries its number:

```ts
export type Suggestion =
	| { kind: "municipality"; number: string; name: string }
	| { kind: "category"; slug: string; name: string }
```

and in `suggest`: `.map((m) => ({ kind: "municipality", number: m.number, name: m.name }))`.

- [ ] **Step 4: Move the hooks**

`web/src/hooks/useUrlState.ts`: import `type Filters` and `parseFilters` from
`../services/filters.ts` instead of `../services/urlState.ts`.

`web/src/hooks/useResources.ts`:

```ts
import { clearIndexCache, type Index, loadIndex, peekIndex } from "../services/data.ts"
import { type Filters, resolveFilters } from "../services/filters.ts"
import { applyFilters } from "../services/query.ts"
import { loadRows } from "../services/rows.ts"

// An old link's places resolve against the index before matching, so ?municipality=1 still
// finds Hamar on the very first render.
function compute(index: Index, filters: Filters): PagedResult<ResourceDto> {
	const resolved = resolveFilters(filters, index.municipalities, index.counties)
	return applyFilters(loadRows(index, resolved), resolved, index.municipalities)
}
```

Use `compute(index, filters)` in both places that called `applyQuery(index.resources, filters)`.

- [ ] **Step 5: Move the components**

`web/src/components/ListPage.tsx`:
- Import `applyPatch`, `buildSearch`, `CLEAR_ALL`, `type Filters`, `resolveFilters`,
  `suggestionPatch` from `../services/filters.ts` instead of `urlState.ts`.
- Below the `catalog` line, add:

```tsx
	// Old ids and places without data resolve against the catalog; until it loads, the parsed
	// filters stand (filter spec, Old links).
	const resolved = useMemo(
		() => (catalog ? resolveFilters(filters, catalog.municipalities, catalog.counties) : filters),
		[catalog, filters]
	)
```

- `apply` and `applySearch` patch `resolved` instead of `filters`.
- `onPick` becomes `const onPick = (suggestion: Suggestion) => apply(suggestionPatch(resolved, suggestion))`.
- Replace `categoriesKey` and the result-count effect's dependency list with one key that covers
  every filter:

```tsx
	// Every filter key, the new ones included, in one string (the URL without its page).
	const filterKey = buildSearch({ ...resolved, page: 1 })
	// biome-ignore lint/correctness/useExhaustiveDependencies: filterKey stands in for every filter value
	useEffect(() => {
		...unchanged body...
	}, [totalCount, filterKey, filters.page, suggestions])
```

- Delete `knownMunicipality`, and pass `filters={resolved}` to `FilterBar`.
- `EmptyState`'s `onClearFilters` becomes `() => apply(CLEAR_ALL)`.

`web/src/components/FilterBar.tsx`: replace the imports and everything above `return (`, and
the bits inside the JSX listed below:

```tsx
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import type { Catalog } from "../services/data.ts"
import { CLEAR_ALL, type Filters, hasFilters } from "../services/filters.ts"
import { MunicipalityCombobox } from "./MunicipalityCombobox.tsx"
import { SearchBar } from "./SearchBar.tsx"

function toggle<T>(values: T[], value: T): T[] {
	return values.includes(value) ? values.filter((v) => v !== value) : [...values, value]
}

export function FilterBar({
	catalog,
	filters,
	onPatch,
	onSearch,
}: {
	catalog: Catalog | null
	filters: Filters
	onPatch: (patch: Partial<Filters>) => void
	onSearch: (value: string) => void
}) {
	const t = useTranslation()
	// Until PR 2's Sted field, this single combobox shows a pick only while it is the one place
	// picked.
	const single = filters.counties.length === 0 && filters.municipalities.length === 1
	const selectedId = single
		? (catalog?.municipalities.find((m) => m.number === filters.municipalities[0])?.id ?? null)
		: null
	// Until PR 2's facet panel, the Lavterskeltilbud chip stands for the Lavterskel Egenskap
	// (filter spec, decision 5).
	const isActive = (slug: string) =>
		slug === "lavterskeltilbud"
			? filters.features.includes("lavterskel")
			: filters.categories.includes(slug)
	const toggleCategory = (slug: string) =>
		onPatch(
			slug === "lavterskeltilbud"
				? { features: toggle(filters.features, "lavterskel") }
				: { categories: toggle(filters.categories, slug) }
		)
```

Inside the JSX:
- The combobox gets `selectedId={selectedId}` and

```tsx
					onSelect={(id) => {
						const number = catalog.municipalities.find((m) => m.id === id)?.number
						// As before, choosing a kommune or "Alle" turns Bare nasjonale off.
						onPatch({
							counties: [],
							municipalities: number ? [number] : [],
							national: filters.national === "only" ? "include" : filters.national,
						})
					}}
					onNoMatchNational={() => onPatch({ national: "only" })}
```

- The national button: `aria-pressed={filters.national === "only"}` and
  `onClick={() => onPatch({ national: filters.national === "only" ? "include" : "only" })}`.
- In the chip map: `const active = isActive(c.slug)`.
- The reset button shows on `hasFilters(filters)` and calls `onPatch(CLEAR_ALL)`. Delete `anySet`.

`web/src/components/LandingSearch.tsx`:
- Import `applyPatch`, `buildSearch`, `EMPTY_FILTERS`, `type Filters`, `suggestionPatch` from
  `../services/filters.ts`; delete the local `empty` constant.
- `const go = (patch: Partial<Filters>) => navigate("/sok", buildSearch(applyPatch(EMPTY_FILTERS, patch)))`
- `onPick`:

```tsx
	const onPick = (s: Suggestion) => {
		if (s.kind !== "municipality") return go(suggestionPatch(EMPTY_FILTERS, s))
		const kommune = catalog?.kommuner.find((k) => k.number === s.number)
		if (kommune) navigate(`/kommune/${kommune.slug}`, "")
		else go(suggestionPatch(EMPTY_FILTERS, s))
	}
```

`web/src/components/LandingPage.tsx` lines 66 and 81: `to={\`/sok${categorySearch(slug)}\`}`
(import `categorySearch` from `../services/filters.ts`).

`web/src/components/KommunePage.tsx`: line 112 links to
`` `/sok?municipality=${entry.number}` ``, and the comment on line 24 says `applyFilters`
instead of `applyQuery`.

- [ ] **Step 6: Move the old tests to the new shape**

Run `npm test` and `npm run typecheck`, then fix each failure with this mapping. Change nothing
else in a test.

| Old | New |
|---|---|
| `import type { Filters } from "../src/services/urlState.ts"` | from `"../src/services/filters.ts"` |
| a whole `Filters` literal | `{ ...EMPTY_FILTERS, ...the fields the test sets }` |
| `municipality: null` | `municipalities: []` |
| `municipality: 1` (Hamar) / `8` (Oslo) | `municipalities: ["3403"]` / `["0301"]` |
| `national: false` / `national: true` | `national: "include"` / `national: "only"` |
| an expected written URL `?municipality=1` | `?municipality=3403` |
| an expected written URL `national=true` | `national=only` |
| a URL the test loads | leave it, unless the test is not about old links: then use the number |
| `{ kind: "municipality", id: 1, name: "Hamar" }` | `{ kind: "municipality", number: "3403", name: "Hamar" }` |
| a `filters.categories` replace expectation after a suggestion | the categories added, in catalog order |

Also:
- `tests/urlState.test.ts`: delete the tests of `parseFilters`, `buildSearch` and `applyPatch`
  (`tests/filters.test.ts` covers them). Keep the route, language, `legacyRedirect` and
  `canHydrate` tests.
- `tests/query.test.ts`: delete the `applyQuery` tests (Task 4's `applyFilters` table covers
  them), and rename the describe `"query mirrors ResourceRepository.SearchAsync"` to
  `"query matchers"`.
- `tests/list.test.tsx` "an unknown ?municipality= value…": its comment now says the value
  "fails parseFilters' shape check". The assertions stay.

Any failure that the mapping does not explain is a behaviour change: stop and report it
instead of editing the expectation.

- [ ] **Step 7: Run everything**

Run: `npm test && npm run typecheck && npx biome check src tests`
Expected: PASS, including the two tests from Step 1.

- [ ] **Step 8: Commit**

```bash
git add src/services/urlState.ts src/services/query.ts src/services/match.ts src/hooks/useUrlState.ts src/hooks/useResources.ts src/components/ListPage.tsx src/components/FilterBar.tsx src/components/LandingSearch.tsx src/components/LandingPage.tsx src/components/KommunePage.tsx
```

Also `git add` each test file Step 6 changed (`git status --short tests`), then:

```bash
git commit -m "feat(web): move /sok to the new filter model; suggestions add, links use kommunenummer"
```

---

### Task 7: Rewrite a non-canonical URL in place

**Files:**
- Modify: `web/src/components/ListPage.tsx`
- Test: `web/tests/list.test.tsx`
- Create: `web/e2e/oldLinks.spec.ts`

**Interfaces:**
- Consumes: `resolved` in `ListPage` (Task 6). Writes with `window.history.replaceState`
  directly (spec, Old links), not through `navigate`.
- Produces: nothing new for later tasks.

- [ ] **Step 1: Write the failing tests**

Add to `web/tests/list.test.tsx`:

```tsx
test("an old link is rewritten to its canonical URL once the catalog loads, keeping the entry's state", async () => {
	stubDataFiles({ resources: [resource], municipalities, categories: [] })
	window.history.pushState(
		{ idx: 4, scrollY: 120 },
		"",
		"/sok?category=lavterskeltilbud&municipality=1&national=yes"
	)
	const length = window.history.length
	render(<App />)
	await waitFor(() =>
		expect(window.location.search).toBe("?municipality=3403&feature=lavterskel")
	)
	expect(window.history.length).toBe(length)
	expect(window.history.state).toMatchObject({ idx: 4, scrollY: 120 })
	expect(screen.getByRole("combobox", { name: "Kommune" })).toHaveValue("Hamar")
})

test("search text the browser encoded differently is rewritten once, with no new entry", async () => {
	stubDataFiles({ resources: [resource], municipalities, categories: [] })
	window.history.pushState({ idx: 0 }, "", "/sok?search=krise%20hamar")
	const length = window.history.length
	render(<App />)
	await waitFor(() => expect(window.location.search).toBe("?search=krise+hamar"))
	expect(window.history.length).toBe(length)
})

test("an English old link stays English after the rewrite", async () => {
	stubDataFiles({ resources: [resource], municipalities, categories: [] })
	window.history.pushState({ idx: 0 }, "", "/en/sok?municipality=1")
	render(<App />)
	await waitFor(() =>
		expect(window.location.pathname + window.location.search).toBe("/en/sok?municipality=3403")
	)
})

test("a canonical URL is left alone", async () => {
	stubDataFiles({ resources: [resource], municipalities, categories: [] })
	window.history.pushState({ idx: 0 }, "", "/sok?municipality=3403")
	const replace = vi.spyOn(window.history, "replaceState")
	render(<App />)
	expect(await screen.findByText("Krisesenteret i Hamar")).toBeInTheDocument()
	// The router's own state merges pass no URL; the rewrite passes one.
	expect(replace.mock.calls.filter((call) => call.length > 2)).toEqual([])
})

test("with the catalog down, an old link stays exactly as typed", async () => {
	vi.stubGlobal(
		"fetch",
		vi.fn(async () => new Response("down", { status: 503 }))
	)
	window.history.pushState({ idx: 0 }, "", "/sok?municipality=1")
	render(<App />)
	expect(await screen.findByRole("heading", { name: "Noe gikk galt" })).toBeInTheDocument()
	expect(window.location.search).toBe("?municipality=1")
})
```

(`"Noe gikk galt"` is `error.heading` in nb. If the existing error-state tests in
`list.test.tsx` find that heading another way, match them.)

`web/e2e/oldLinks.spec.ts`:

```ts
import { expect, test } from "@playwright/test"
import { forceInstalled, hydrated, settle } from "./helpers.ts"

test.beforeEach(async ({ page }) => {
	await forceInstalled(page)
	await page.setViewportSize({ width: 375, height: 800 })
})

test("an old ?municipality=1 link lands on Hamar under its kommunenummer", async ({ page }) => {
	await page.goto("/sok?municipality=1")
	await hydrated(page)
	await expect(page).toHaveURL(/\/sok\?municipality=3403$/)
	await expect(page.getByRole("combobox", { name: "Kommune" })).toHaveValue("Hamar")
})

test("Back to a rewritten old link restores the scroll position", async ({ page }) => {
	// A weekday morning, as in historyNav.spec.ts, so the handover banner has its full height.
	await page.clock.setFixedTime(new Date(2026, 9, 28, 10, 0))
	await page.goto("/sok?municipality=1")
	await settle(page)
	await hydrated(page)
	await expect(page).toHaveURL(/\/sok\?municipality=3403$/)
	const link = page.locator("main a[href^='/resources/']").nth(4)
	await link.evaluate((el) => el.scrollIntoView({ block: "center" }))
	const scrollY = await page.evaluate(() => window.scrollY)
	expect(scrollY).toBeGreaterThan(200)
	await link.click()
	await expect(page).toHaveURL(/\/resources\/\d+$/)
	await page.goBack()
	await expect(page).toHaveURL(/\/sok\?municipality=3403$/)
	await expect
		.poll(async () => Math.abs((await page.evaluate(() => window.scrollY)) - scrollY))
		.toBeLessThanOrEqual(1)
})
```

- [ ] **Step 2: Run the unit tests to verify they fail**

Run: `npx vitest run tests/list.test.tsx`
Expected: the old-link, encoding and English tests FAIL (the URL keeps its old form). The
"left alone" and "catalog down" tests pass already, which is correct: they guard the fix.

- [ ] **Step 3: Write the implementation**

In `web/src/components/ListPage.tsx`, below the `resolved` memo:

```tsx
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
```

- [ ] **Step 4: Run the unit tests to verify they pass**

Run: `npx vitest run tests/list.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run the e2e suite**

Run: `npm run e2e`
Expected: PASS, including `e2e/oldLinks.spec.ts` and `e2e/historyNav.spec.ts`. If
`historyNav.spec.ts` fails, the rewrite has disturbed scroll restore: debug it with
superpowers:systematic-debugging before changing anything.

- [ ] **Step 6: Format, check, commit**

```bash
npx biome check --write src/components/ListPage.tsx tests/list.test.tsx e2e/oldLinks.spec.ts
npm test && npm run typecheck
git add src/components/ListPage.tsx tests/list.test.tsx e2e/oldLinks.spec.ts
git commit -m "feat(web): rewrite old and non-canonical /sok links in place once the catalog loads"
```

---

### Task 8: Whole-branch check and the PR

**Files:** none changed, unless a check fails.

- [ ] **Step 1: Run every check on the finished branch**

```bash
npm test
npm run typecheck
npx biome check .
npm run e2e
```

Expected: all PASS. Record the vitest and Playwright pass counts from the output for the PR
body.

- [ ] **Step 2: Check the spec's PR 1 scope against the diff**

Run `git diff --stat main...HEAD` and confirm that each of these is present: `urlState`/`filters`
(params, old links, rewrite), `query` (all groups, `loadRows`), `facetCounts`, the three data
files, and the build step that attaches numbers. Confirm too that nothing from PR 2 is
present: no PlaceBar, FacetGroup, FacetPanel or ActiveFilters, and no copy keys.

- [ ] **Step 3: Draft the PR body**

Write the PR body to `.superpowers/sdd/<ledger dir>/pr-body.md` (first person, no em dashes):
what changed for a visitor (old links rewrite to kommunenummer, suggestions add, the
Lavterskeltilbud chip is the Lavterskel Egenskap), what is model-only and waits for PR 2
(fylker, several kommuner, Skjul, Pris, Døgnåpent, the counts), the verification counts from
Step 1, the new rule that a kommune added to the seed needs its `web/data/places.json` row in
the same PR, and the follow-ups: the lavterskel data reconcile PR before PR 2, and PR 2 itself.
Title: `feat(web): filter model for fylker, several kommuner, Egenskaper and counts`.

> Stress-tested 2026-10-30 (skill 1b85fca): 4 applied, 1 adapted, 0 decided by me.
