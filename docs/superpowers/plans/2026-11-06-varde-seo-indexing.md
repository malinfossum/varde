# Varde SEO indexing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every Varde service and kommune page reachable and announced, so Google and Bing index them: a `/kommune` index page linked from the header, longer titles, a real front page meta description, WebSite JSON-LD and an IndexNow ping of changed pages after each deploy.

**Architecture:** Pure logic goes in `web/src/services/` (titles, kommune index) and `web/scripts/` (prerender manifest, IndexNow diff and ping). Components stay thin. The prerender bakes the new page's data, writes `dist/page-hashes.json`, and the deploy workflow diffs it against the live copy and pings only what changed.

**Tech Stack:** React 19 + TypeScript (Vite), prerender through `react-dom/static`, Vitest + Testing Library, Playwright, GitHub Actions, Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-11-06-varde-seo-indexing-design.md` (branch `docs/seo-indexing-spec`). Read it before Task 1.

## Global Constraints

- Scope: `web/` and `.github/workflows/deploy-web.yml` only. Never touch `pipeline/`, `api/` or the `docs/national-data-spec` branch.
- No em dashes anywhere (code, comments, copy, commits). Titles keep the existing en dash separator ` – Varde`.
- Times `13:20`, dates `06.11.2026` in prose; ISO dates only where a machine reads them.
- Copy is exactly the spec's table (decision 6) plus the `/kommune` meta description in Task 4, which Malin approves with the plan. Never reword copy.
- Layering: `services/` has no React and no DOM; hooks hold state; components render and wire events.
- Mobile-first CSS with `min-width` queries at 768, 1024 and 1600 px. No `max-width` queries.
- Every interactive row is at least 44 px tall. A label beside a value is set apart by size or colour (`text-sm text-muted`).
- The prerender hydration guard (no `<script`, `<template` or `style=` in prerendered markup) must keep passing.
- No new dependency, no new GitHub Action, no secret. Telemetry stays off.
- Commits: conventional style, sole author, no AI attribution or `Co-Authored-By` lines. Stage explicit paths only.
- Before any test run in a fresh worktree: `cd web && npm ci`. Before `npm run e2e`: `cp e2e/fixtures/data/*.json public/data/` (prerender reads `public/data`, as CI does).

## Review Focus

1. **Language switch on `/kommune`:** switching nb to en on a directly loaded index must show the English page (title, labels, links) without a reload or the stale baked page. Pinned in Task 9 ("switches to English in place"); Task 4 keys the component by language so it remounts.
2. **Direct load fetches nothing:** a prerendered `/kommune` must render from baked data with no `fetch` call, and hydrate without a "Laster" flash. Pinned in Task 4 (no-fetch test) and Task 9 (hydration spec paths).
3. **`/kommune` next to the `kommune/` folder:** `vite preview` and Cloudflare must serve `kommune.html` for `/kommune`. Pinned in Task 9 (e2e direct load of `/kommune` and `/en/kommune`) plus the manual preview-deploy curl in Task 10.
4. **A changed asset link must not mark pages changed,** or every code deploy pings all 300 URLs. Pinned in Task 6 (asset-only change keeps the hash).
5. **Hostile or broken manifest content** (non-path keys, `//host`, `/\host`, a JSON array, an empty file) must never reach the ping or crash it. Pinned in Task 7.

---

## File Structure

- Create `web/src/services/titles.ts`: `serviceTitle(resource)`, the title rule.
- Create `web/src/services/kommuneIndex.ts`: `buildKommuneIndex(kommuner, resources)` and the `KommuneIndex` type.
- Create `web/src/i18n/fill.ts`: the `{key}` template filler, moved out of `KommunePage.tsx` so two pages share it.
- Create `web/src/components/KommuneIndexPage.tsx`: the `/kommune` page.
- Create `web/scripts/indexnow.mjs` + `web/scripts/indexnow.d.mts`: diff, ping and CLI.
- Create `web/public/<key>.txt`: the IndexNow key file.
- Modify `web/src/services/urlState.ts`, `web/src/App.tsx`, `web/src/pageData.ts`, `web/src/entry-server.tsx`, `web/src/components/HeaderLinks.tsx`, `ResourceDetail.tsx`, `LandingPage.tsx`, `ListPage.tsx`, `KommunePage.tsx`, `web/src/i18n/nb.json`, `en.json`, `web/src/styles/main.css`, `web/scripts/prerender.mjs`, `prerender.d.mts`, `web/public/_headers`, `.github/workflows/deploy-web.yml`.
- Tests: create `web/tests/titles.test.ts`, `kommuneIndex.test.ts`, `kommuneIndexPage.test.tsx`, `indexnow.test.ts`, `web/e2e/kommuneIndex.spec.ts`; modify `urlState.test.ts`, `landing.test.tsx`, `header.test.tsx`, `headerMenu.test.tsx`, `prerender.test.ts`, `headers.test.ts`, `e2e/reflow.spec.ts`, `e2e/hydration.spec.ts`.

---

### Task 1: Titles and the front page description

**Files:**
- Create: `web/src/services/titles.ts`
- Modify: `web/src/components/ResourceDetail.tsx:115`, `web/src/components/LandingPage.tsx:17-28`, `web/src/components/ListPage.tsx:28,138`, `web/src/i18n/nb.json`, `web/src/i18n/en.json`
- Test: create `web/tests/titles.test.ts`; modify `web/tests/landing.test.tsx:46`

**Interfaces:**
- Produces: `serviceTitle(resource: { name: string; municipalityName: string | null }): string`. i18n keys `landing.pageTitle`, `landing.description`, `list.pageTitle`.

- [ ] **Step 1: Write the failing test** in `web/tests/titles.test.ts`

```ts
import { expect, test } from "vitest"
import { serviceTitle } from "../src/services/titles.ts"

const t = (name: string, municipalityName: string | null) => serviceTitle({ name, municipalityName })

test("adds the place when the name lacks it", () => {
	expect(t("CRUX Arbeideren", "Hamar")).toBe("CRUX Arbeideren, Hamar – Varde")
})

test("keeps the name alone when it already has the place, in any case", () => {
	expect(t("Nav Hamar", "Hamar")).toBe("Nav Hamar – Varde")
	expect(t("NAV HAMAR", "Hamar")).toBe("NAV HAMAR – Varde")
})

test("a place at the start of a longer word counts as present", () => {
	expect(t("Stangehjelpa", "Stange")).toBe("Stangehjelpa – Varde")
})

test("a place inside another word does not count", () => {
	expect(t("Alkoholvern", "Hol")).toBe("Alkoholvern, Hol – Varde")
})

test("national rows have no place", () => {
	expect(t("Mental Helse Hjelpetelefonen", null)).toBe("Mental Helse Hjelpetelefonen – Varde")
})

test("drops the suffix when the title would pass 60 characters", () => {
	const name = "Vake kirkelig ressurssenter mot seksuelle overgrep"
	expect(t(name, "Oslo")).toBe(`${name}, Oslo`)
	expect(t(name, "Oslo").length).toBeLessThanOrEqual(60)
})

test("never cuts a name that is over 60 on its own", () => {
	const name = "Gjøvik frivilligsentral avd. Øverby (Øverbykafeen og Torsdagstreff)"
	expect(t(name, "Gjøvik")).toBe(name)
})

test("exactly 60 characters keeps the suffix", () => {
	const name = "x".repeat(60 - " – Varde".length)
	expect(t(name, null)).toBe(`${name} – Varde`)
})

test("a place with regex characters is matched literally", () => {
	expect(t("Senter (Hamar)", "Hamar")).toBe("Senter (Hamar) – Varde")
	expect(t("Senter", "A.B")).toBe("Senter, A.B – Varde")
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `cd web && npx vitest run tests/titles.test.ts`
Expected: FAIL, cannot resolve `../src/services/titles.ts`.

- [ ] **Step 3: Write `web/src/services/titles.ts`**

```ts
// The page title of a service (spec 2026-11-06, decision 4). The place is added only when the
// name lacks it, and " – Varde" goes when the title would pass 60 characters. A name is never
// cut: the title is also what a screen reader and a browser tab show.
const SUFFIX = " – Varde"
const MAX = 60

function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// The place counts as present when it starts a word: "Stangehjelpa" has Stange, but Hol is not
// found inside "Alkoholvern".
function hasPlace(name: string, place: string): boolean {
	return new RegExp(`(?<!\\p{L})${escapeRegExp(place)}`, "iu").test(name)
}

export function serviceTitle(resource: { name: string; municipalityName: string | null }): string {
	const { name, municipalityName: place } = resource
	const base = place && !hasPlace(name, place) ? `${name}, ${place}` : name
	const full = `${base}${SUFFIX}`
	return full.length <= MAX ? full : base
}
```

- [ ] **Step 4: Run it to see it pass**

Run: `cd web && npx vitest run tests/titles.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Use it in `ResourceDetail.tsx`**

Add `import { serviceTitle } from "../services/titles.ts"` with the other service imports, and change line 115 from `` title={`${resource.name} – Varde`} `` to `title={serviceTitle(resource)}`.

- [ ] **Step 6: Add the i18n keys**

In `web/src/i18n/nb.json`, after `"landing.subtitle"` add:

```json
	"landing.pageTitle": "Varde – finn riktig hjelpetjeneste der du bor",
	"landing.description": "Finn hjelpetjenester der du bor: hjelpetelefoner, lavterskeltilbud og kommunale tjenester, med telefon, adresse og åpningstider. Gratis og uten sporing.",
```

and after `"list.pagerStatus"` add `"list.pageTitle": "Søk i alle hjelpetjenester – Varde",`.

In `web/src/i18n/en.json`, at the same places:

```json
	"landing.pageTitle": "Varde – find the right help service where you live",
	"landing.description": "Find help services where you live: helplines, low-threshold services and municipal services, with phone, address and opening hours. Free, no tracking.",
```

and `"list.pageTitle": "Search all help services – Varde",`.

- [ ] **Step 7: Use the keys in `LandingPage.tsx` and `ListPage.tsx`**

`LandingPage.tsx`: delete the `titles` map (lines 17-20) and change the `PageHead` line to:

```tsx
			<PageHead title={t("landing.pageTitle")} description={t("landing.description")} path="/" />
```

If `lang` from `useLanguage()` is now unused in `LandingPage`, remove that line and the import name too (Biome flags it).

`ListPage.tsx`: delete `const titles = ...` (line 28) and change the `PageHead` line to `<PageHead title={t("list.pageTitle")} description={descriptions[lang]} path="/sok" />`.

- [ ] **Step 8: Update the landing title test**

In `web/tests/landing.test.tsx:46` change the expectation to `"Varde – finn riktig hjelpetjeneste der du bor"`. Then grep for other expectations of the old titles:

Run: `cd web && grep -rn "finn riktig hjelpetjeneste\"\|\"Søk – Varde\"\|Search – Varde" tests e2e`
Expected: only `tests/arrivalFocus.test.tsx` and `tests/pageHead.test.tsx`, which pass their own title to `PageHead` and stay as they are. Update any other hit to the new copy.

- [ ] **Step 9: Run the whole unit suite**

Run: `cd web && npm test`
Expected: PASS. `tests/detail.test.tsx:110` expects `"Krisesenteret i Hamar – Varde"`; its fixture has `municipalityName` Hamar inside the name, so it stays green. If it fails, read the fixture before changing anything.

- [ ] **Step 10: Commit**

```bash
git add web/src/services/titles.ts web/tests/titles.test.ts web/src/components/ResourceDetail.tsx web/src/components/LandingPage.tsx web/src/components/ListPage.tsx web/src/i18n/nb.json web/src/i18n/en.json web/tests/landing.test.tsx
git commit -m "feat(web): longer titles with the place and a real front page description"
```

---

### Task 2: The `/kommune` route

**Files:**
- Modify: `web/src/services/urlState.ts:3-9,19-28,46-60`
- Test: `web/tests/urlState.test.ts`

**Interfaces:**
- Produces: `Route` gains `{ kind: "kommuneIndex" }`; `parseRoute("/kommune")` returns it; `routePath({ kind: "kommuneIndex" })` returns `"/kommune"`.

- [ ] **Step 1: Write the failing test** (append to `web/tests/urlState.test.ts`; reuse its existing imports, adding `parseUrl`, `routePath`, `switchLangPath` if missing)

```ts
test("/kommune is the kommune index in both languages, and a slashed form is not", () => {
	expect(parseUrl("/kommune")).toEqual({ lang: "nb", route: { kind: "kommuneIndex" } })
	expect(parseUrl("/en/kommune")).toEqual({ lang: "en", route: { kind: "kommuneIndex" } })
	expect(parseUrl("/kommune/")).toEqual({ lang: "nb", route: { kind: "notFound" } })
	expect(routePath({ kind: "kommuneIndex" })).toBe("/kommune")
	expect(switchLangPath("/kommune", "en")).toBe("/en/kommune")
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `cd web && npx vitest run tests/urlState.test.ts`
Expected: FAIL, route kind `notFound` instead of `kommuneIndex`.

- [ ] **Step 3: Implement**

In `urlState.ts`, add `| { kind: "kommuneIndex" }` to `Route` after the `about` line. In `parseRoute`, after the `/om` line add `if (pathname === "/kommune") return { kind: "kommuneIndex" }`. In `routePath`, add before `case "kommune":`:

```ts
		case "kommuneIndex":
			return "/kommune"
```

- [ ] **Step 4: Run the test and the type check**

Run: `cd web && npx vitest run tests/urlState.test.ts && npx tsc --noEmit`
Expected: PASS, and no type errors (any `switch` on `route.kind` without a default would flag here; fix such a switch by adding the case).

- [ ] **Step 5: Commit**

```bash
git add web/src/services/urlState.ts web/tests/urlState.test.ts
git commit -m "feat(web): add the /kommune route"
```

---

### Task 3: The kommune index service

**Files:**
- Create: `web/src/services/kommuneIndex.ts`
- Test: `web/tests/kommuneIndex.test.ts`

**Interfaces:**
- Consumes: `KommuneEntry` from `services/data.ts`, `matchesMunicipality` from `services/query.ts`, `ResourceDto` from `types/api.ts`.
- Produces:

```ts
export type KommuneIndexEntry = { slug: string; name: string; count: number }
export type KommuneIndexGroup = { county: string; kommuner: KommuneIndexEntry[] }
export type KommuneIndex = { groups: KommuneIndexGroup[]; national: number }
export function buildKommuneIndex(kommuner: readonly KommuneEntry[], resources: readonly ResourceDto[]): KommuneIndex
```

- [ ] **Step 1: Write the failing test** in `web/tests/kommuneIndex.test.ts`

```ts
import { expect, test } from "vitest"
import { splitForKommune } from "../src/components/KommunePage.tsx"
import type { KommuneEntry } from "../src/services/data.ts"
import { buildKommuneIndex } from "../src/services/kommuneIndex.ts"
import type { ResourceDto } from "../src/types/api.ts"

const k = (id: number, name: string, county: string): KommuneEntry => ({
	id,
	slug: name.toLowerCase(),
	name,
	county,
	number: String(3400 + id),
})
const r = (id: number, over: Partial<ResourceDto>) =>
	({
		id,
		name: `R${id}`,
		isNational: false,
		municipalityId: null,
		servedMunicipalityIds: [],
		...over,
	}) as ResourceDto

const kommuner = [
	k(1, "Hamar", "Innlandet"),
	k(2, "Elverum", "Innlandet"),
	k(3, "Oslo", "Oslo"),
	k(4, "Ålesund", "Møre og Romsdal"),
	k(5, "Fredrikstad", "Østfold"),
	k(6, "Bergen", "Vestland"),
]
const resources = [
	r(1, { municipalityId: 1 }),
	r(2, { municipalityId: 9, servedMunicipalityIds: [1, 2] }),
	r(3, { isNational: true }),
	r(4, { municipalityId: 3 }),
]

test("groups by fylke and sorts fylker and kommuner A-Å the Norwegian way", () => {
	const index = buildKommuneIndex(kommuner, resources)
	expect(index.groups.map((g) => g.county)).toEqual([
		"Innlandet",
		"Møre og Romsdal",
		"Oslo",
		"Vestland",
		"Østfold",
	])
	expect(index.groups[0]?.kommuner.map((x) => x.name)).toEqual(["Elverum", "Hamar"])
})

test("each count equals the kommune page's own local list, served rows included", () => {
	const index = buildKommuneIndex(kommuner, resources)
	for (const entry of kommuner) {
		const shown = index.groups.flatMap((g) => g.kommuner).find((x) => x.slug === entry.slug)
		expect(shown?.count).toBe(splitForKommune(entry, resources).local.length)
	}
	expect(index.groups[0]?.kommuner).toEqual([
		{ slug: "elverum", name: "Elverum", count: 1 },
		{ slug: "hamar", name: "Hamar", count: 2 },
	])
})

test("counts national rows once, and zero when there are none", () => {
	expect(buildKommuneIndex(kommuner, resources).national).toBe(1)
	expect(buildKommuneIndex(kommuner, resources.filter((x) => !x.isNational)).national).toBe(0)
})

test("the input order of rows and kommuner does not change the result", () => {
	const a = buildKommuneIndex(kommuner, resources)
	const b = buildKommuneIndex([...kommuner].reverse(), [...resources].reverse())
	expect(b).toEqual(a)
})

test("no kommuner gives no groups", () => {
	expect(buildKommuneIndex([], resources)).toEqual({ groups: [], national: 1 })
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `cd web && npx vitest run tests/kommuneIndex.test.ts`
Expected: FAIL, cannot resolve `../src/services/kommuneIndex.ts`.

- [ ] **Step 3: Write `web/src/services/kommuneIndex.ts`**

```ts
import type { ResourceDto } from "../types/api.ts"
import type { KommuneEntry } from "./data.ts"
import { matchesMunicipality } from "./query.ts"

// What /kommune shows (spec 2026-11-06): kommuner grouped by fylke, each with its local service
// count. The count uses the same rule as the kommune page's local list (splitForKommune): own
// and served rows, never national ones. tests/kommuneIndex.test.ts pins the two together.
export type KommuneIndexEntry = { slug: string; name: string; count: number }
export type KommuneIndexGroup = { county: string; kommuner: KommuneIndexEntry[] }
export type KommuneIndex = { groups: KommuneIndexGroup[]; national: number }

const collator = new Intl.Collator("nb")

export function buildKommuneIndex(
	kommuner: readonly KommuneEntry[],
	resources: readonly ResourceDto[]
): KommuneIndex {
	const byCounty = new Map<string, KommuneIndexEntry[]>()
	for (const entry of kommuner) {
		const count = resources.filter(
			(r) => !r.isNational && matchesMunicipality(r, entry.id)
		).length
		const list = byCounty.get(entry.county) ?? []
		list.push({ slug: entry.slug, name: entry.name, count })
		byCounty.set(entry.county, list)
	}
	const groups = [...byCounty.entries()]
		.sort(([a], [b]) => collator.compare(a, b))
		.map(([county, list]) => ({
			county,
			kommuner: list.sort((a, b) => collator.compare(a.name, b.name) || collator.compare(a.slug, b.slug)),
		}))
	return { groups, national: resources.filter((r) => r.isNational).length }
}
```

- [ ] **Step 4: Run it to see it pass**

Run: `cd web && npx vitest run tests/kommuneIndex.test.ts`
Expected: PASS, 5 tests. If the Ø/Å order fails, check the collator is `"nb"`, not the default locale.

- [ ] **Step 5: Commit**

```bash
git add web/src/services/kommuneIndex.ts web/tests/kommuneIndex.test.ts
git commit -m "feat(web): build the kommune index grouped by fylke"
```

---

### Task 4: The `/kommune` page

**Files:**
- Create: `web/src/components/KommuneIndexPage.tsx`, `web/src/i18n/fill.ts`
- Modify: `web/src/components/KommunePage.tsx:33-35` (use the shared `fill`), `web/src/App.tsx`, `web/src/pageData.ts`, `web/src/i18n/nb.json`, `web/src/i18n/en.json`, `web/src/styles/main.css` (inside `@layer components`)
- Test: `web/tests/kommuneIndexPage.test.tsx`

**Interfaces:**
- Consumes: `buildKommuneIndex`, `KommuneIndex` (Task 3); route kind `kommuneIndex` (Task 2); `loadIndex(lang)` from `services/data.ts`.
- Produces: `PageData.kommuneIndex?: KommuneIndex`; `fill(template: string, values: Record<string, string | number>): string`; component `KommuneIndexPage({ arrival }: { arrival: number })`.

Copy for this page. The `kommuneIndex.description` line is new and is approved by Malin together with this plan:

| Key | nb | en |
|---|---|---|
| `kommuneIndex.pageTitle` | Hjelpetjenester per kommune – Varde | Help services by municipality – Varde |
| `kommuneIndex.title` | Hjelpetjenester per kommune | Help services by municipality |
| `kommuneIndex.description` | Velg kommunen din og finn hjelpetjenestene der, med telefon, adresse og åpningstider. Kommunene er gruppert etter fylke. | Pick your municipality and find its help services, with phone, address and opening hours. Municipalities are grouped by county. |
| `kommuneIndex.countOne` | 1 tjeneste | 1 service |
| `kommuneIndex.countOther` | {n} tjenester | {n} services |
| `kommuneIndex.national` | {n} nasjonale tjenester gjelder i hele landet. | {n} national services cover the whole country. |
| `kommuneIndex.nationalLink` | Se alle tjenester | See all services |

- [ ] **Step 1: Write the failing test** in `web/tests/kommuneIndexPage.test.tsx`

```tsx
import { render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"
import { render as prerender } from "../src/entry-server.tsx"
import { clearIndexCache } from "../src/services/data.ts"
import { buildKommuneIndex } from "../src/services/kommuneIndex.ts"
import type { ResourceDto } from "../src/types/api.ts"
import { stubDataFiles } from "./stubData.ts"

const hamar = { id: 1, slug: "hamar", name: "Hamar", county: "Innlandet", number: "3403" }
const elverum = { id: 2, slug: "elverum", name: "Elverum", county: "Innlandet", number: "3420" }
const oslo = { id: 3, slug: "oslo", name: "Oslo", county: "Oslo", number: "0301" }
const base = {
	description: "d",
	isFallbackTranslation: false,
	openingHours: null,
	isLowThreshold: false,
	cost: null,
	costNote: null,
	municipalityName: null,
	address: null,
	phone: "12345678",
	email: null,
	website: null,
	chatUrl: null,
	lastVerified: "2026-08-17",
	categories: [],
	parentId: null,
	phoneMenuOption: null,
	isAlwaysOpen: false,
	servedMunicipalityIds: [],
}
const rows = [
	{ ...base, id: 1, name: "NAV Hamar", municipalityId: 1, isNational: false },
	{ ...base, id: 2, name: "Krisesenteret", municipalityId: 9, servedMunicipalityIds: [1], isNational: false },
	{ ...base, id: 3, name: "Mental Helse", municipalityId: null, isNational: true },
] as unknown as ResourceDto[]

afterEach(() => {
	clearIndexCache()
	vi.unstubAllGlobals()
	window.history.replaceState(null, "", "/")
})

test("lists each fylke as a region with its kommuner, counts and the national line", async () => {
	stubDataFiles({ resources: rows, kommuner: [hamar, elverum, oslo] })
	window.history.pushState(null, "", "/kommune")
	const { container } = render(<App />)
	expect(
		await screen.findByRole("heading", { level: 1, name: "Hjelpetjenester per kommune" })
	).toBeInTheDocument()
	const innlandet = screen.getByRole("region", { name: "Innlandet" })
	const links = within(innlandet).getAllByRole("link")
	expect(links.map((a) => a.getAttribute("href"))).toEqual(["/kommune/elverum", "/kommune/hamar"])
	expect(within(innlandet).getByRole("link", { name: "Hamar 2 tjenester" })).toBeInTheDocument()
	expect(within(innlandet).getByRole("link", { name: "Elverum 0 tjenester" })).toBeInTheDocument()
	expect(within(innlandet).getByRole("list")).toBeInTheDocument()
	expect(screen.getByRole("region", { name: "Oslo" })).toBeInTheDocument()
	expect(screen.getByText(/1 nasjonale tjenester gjelder i hele landet\./)).toBeInTheDocument()
	expect(screen.getByRole("link", { name: "Se alle tjenester" })).toHaveAttribute("href", "/sok")
	expect(container.querySelectorAll("h1")).toHaveLength(1)
	await waitFor(() => expect(document.title).toBe("Hjelpetjenester per kommune – Varde"))
})

test("one service says tjeneste, and the English page says service and services", async () => {
	stubDataFiles({ resources: rows.slice(0, 1), kommuner: [hamar] })
	window.history.pushState(null, "", "/en/kommune")
	render(<App />)
	expect(
		await screen.findByRole("heading", { level: 1, name: "Help services by municipality" })
	).toBeInTheDocument()
	expect(screen.getByRole("link", { name: "Hamar 1 service" })).toHaveAttribute("href", "/en/kommune/hamar")
	// No national rows: the line is left out.
	expect(screen.queryByText(/national services cover/)).toBeNull()
})

test("a prerendered page renders from baked data and fetches nothing", async () => {
	const fetchSpy = vi.fn()
	vi.stubGlobal("fetch", fetchSpy)
	const kommuneIndex = buildKommuneIndex([hamar], rows)
	const { html } = await prerender("/kommune", { lang: "nb", kommuneIndex })
	expect(html).toContain("Hjelpetjenester per kommune")
	expect(html).toContain('href="/kommune/hamar"')
	expect(html).not.toContain("<script")
	expect(html).not.toContain(" style=")
	expect(fetchSpy).not.toHaveBeenCalled()
})

test("a failed index load shows the error state, and Prøv igjen loads it", async () => {
	vi.stubGlobal("fetch", vi.fn(async () => new Response("down", { status: 503 })))
	window.history.pushState(null, "", "/kommune")
	render(<App />)
	expect(await screen.findByRole("button", { name: /prøv igjen/i })).toBeInTheDocument()
})
```

The last test reads the retry button by its visible name. Before running, check `web/src/components/ErrorState.tsx` and the `error.*` keys in `nb.json`, and use the real button name if it differs from "Prøv igjen".

- [ ] **Step 2: Run it to see it fail**

Run: `cd web && npx vitest run tests/kommuneIndexPage.test.tsx`
Expected: FAIL, `/kommune` renders the not-found page.

- [ ] **Step 3: Move `fill` to `web/src/i18n/fill.ts`**

```ts
// Fills {key} placeholders in a translated string. Shared by the kommune pages.
export function fill(template: string, values: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""))
}
```

In `KommunePage.tsx`, delete its local `fill` (lines 33-35) and add `import { fill } from "../i18n/fill.ts"`.

- [ ] **Step 4: Add the i18n keys** from the copy table above to `nb.json` and `en.json` (after the `kommune.*` block), and `"header.kommuner": "Kommuner"` / `"header.kommuner": "Municipalities"` after `header.allServices` (Task 5 uses it; adding it now keeps the files in step).

- [ ] **Step 5: Extend `PageData`** in `web/src/pageData.ts`

Add `import type { KommuneIndex } from "./services/kommuneIndex.ts"` and, after the `kommune?:` field:

```ts
	// The /kommune page: every kommune grouped by fylke, with counts.
	kommuneIndex?: KommuneIndex
```

- [ ] **Step 6: Write `web/src/components/KommuneIndexPage.tsx`**

```tsx
import { useEffect, useState } from "react"
import { useArrivalFocus } from "../hooks/useArrivalFocus.ts"
import { fill } from "../i18n/fill.ts"
import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { usePageData } from "../pageData.ts"
import { loadIndex } from "../services/data.ts"
import { buildKommuneIndex, type KommuneIndex } from "../services/kommuneIndex.ts"
import { ErrorState } from "./ErrorState.tsx"
import { Link } from "./Link.tsx"
import { LoadingState } from "./LoadingState.tsx"
import { PageHead } from "./PageHead.tsx"

type State = { kind: "loading" } | { kind: "error" } | { kind: "ready"; index: KommuneIndex }

// /kommune (spec 2026-11-06): the crawlable way in to every kommune page. A direct load reads
// the baked index; a client-side visit builds it from the language's export, like KommunePage.
export function KommuneIndexPage({ arrival }: { arrival: number }) {
	const t = useTranslation()
	const { lang } = useLanguage()
	const baked = usePageData().kommuneIndex
	const [state, setState] = useState<State>(() =>
		baked ? { kind: "ready", index: baked } : { kind: "loading" }
	)
	const [attempt, setAttempt] = useState(0)
	// biome-ignore lint/correctness/useExhaustiveDependencies: attempt only forces a re-fetch
	useEffect(() => {
		if (baked) return
		let cancelled = false
		loadIndex(lang).then(
			(index) => {
				if (!cancelled)
					setState({ kind: "ready", index: buildKommuneIndex(index.kommuner, index.resources) })
			},
			() => {
				if (!cancelled) setState({ kind: "error" })
			}
		)
		return () => {
			cancelled = true
		}
	}, [lang, baked, attempt])
	const { ref } = useArrivalFocus<HTMLHeadingElement>(arrival, state.kind === "ready")

	if (state.kind === "loading") return <LoadingState />
	if (state.kind === "error") return <ErrorState onRetry={() => setAttempt((n) => n + 1)} />

	const { groups, national } = state.index
	const count = (n: number) =>
		n === 1 ? t("kommuneIndex.countOne") : fill(t("kommuneIndex.countOther"), { n })
	return (
		<article className="grid gap-6">
			<PageHead
				title={t("kommuneIndex.pageTitle")}
				description={t("kommuneIndex.description")}
				path="/kommune"
			/>
			<h1 ref={ref} tabIndex={-1}>
				{t("kommuneIndex.title")}
			</h1>
			{groups.map((group, i) => (
				<section key={group.county} aria-labelledby={`fylke-${i}`} className="grid gap-3">
					<h2 id={`fylke-${i}`}>{group.county}</h2>
					<ul
						// biome-ignore lint/a11y/noRedundantRoles: VoiceOver drops it when list-style is none
						role="list"
						className="kommune-grid"
					>
						{group.kommuner.map((k) => (
							<li key={k.slug}>
								<Link to={`/kommune/${k.slug}`} className="kommune-row">
									<span className="kommune-name">{k.name}</span>{" "}
									<span className="kommune-count text-sm text-muted">{count(k.count)}</span>
								</Link>
							</li>
						))}
					</ul>
				</section>
			))}
			{national > 0 && (
				<p>
					{fill(t("kommuneIndex.national"), { n: national })}{" "}
					<Link to="/sok">{t("kommuneIndex.nationalLink")}</Link>
				</p>
			)}
		</article>
	)
}
```

- [ ] **Step 7: Wire it in `web/src/App.tsx`**

After the `AboutPage` lazy import add:

```tsx
const KommuneIndexPage = lazy(() =>
	import("./components/KommuneIndexPage.tsx").then((m) => ({ default: m.KommuneIndexPage }))
)
```

In `Page`, before the `route.kind === "kommune"` block add:

```tsx
			{/* Keyed by language: the baked index belongs to the loaded language only. */}
			{route.kind === "kommuneIndex" && <KommuneIndexPage key={lang} arrival={arrival} />}
```

- [ ] **Step 8: Add the layout CSS** in `web/src/styles/main.css`, inside `@layer components`, after the `.nav-link:hover` rule

```css
	/* /kommune (spec 2026-11-06): one whole-row link per kommune, mobile-first 1 to 4 columns.
	   The name may wrap, the count never does. A border, not only a background, so the row edge
	   survives forced colours. */
	.kommune-grid {
		display: grid;
		gap: 0.75rem;
	}
	@media (min-width: 768px) {
		.kommune-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (min-width: 1024px) {
		.kommune-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
	@media (min-width: 1600px) {
		.kommune-grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}
	.kommune-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		min-height: 44px;
		height: 100%;
		padding: 0.5rem 1rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		color: var(--text);
		text-decoration: none;
	}
	.kommune-row:hover .kommune-name {
		text-decoration: underline;
	}
	.kommune-name {
		min-width: 0;
		overflow-wrap: anywhere;
		font-weight: 500;
	}
	.kommune-count {
		white-space: nowrap;
	}
```

- [ ] **Step 9: Run the tests**

Run: `cd web && npx vitest run tests/kommuneIndexPage.test.tsx tests/kommune.test.tsx tests/i18n.test.tsx`
Expected: PASS. The i18n parity test proves both files carry the same keys.

- [ ] **Step 10: Run the whole suite and Biome**

Run: `cd web && npm test && npx biome ci .`
Expected: PASS, no Biome errors.

- [ ] **Step 11: Commit**

```bash
git add web/src/components/KommuneIndexPage.tsx web/src/i18n/fill.ts web/src/components/KommunePage.tsx web/src/App.tsx web/src/pageData.ts web/src/i18n/nb.json web/src/i18n/en.json web/src/styles/main.css web/tests/kommuneIndexPage.test.tsx
git commit -m "feat(web): add the /kommune page grouped by fylke"
```

---

### Task 5: The header link

**Files:**
- Modify: `web/src/components/HeaderLinks.tsx`
- Test: `web/tests/header.test.tsx`, `web/tests/headerMenu.test.tsx:25-45,89-101`

**Interfaces:**
- Consumes: i18n key `header.kommuner` (Task 4), route kind `kommuneIndex` (Task 2), `useCurrentUrl` from `navigation.ts`, `parseUrl` from `services/urlState.ts`.

- [ ] **Step 1: Write the failing tests**

Append to `web/tests/header.test.tsx`:

```tsx
test("the header nav links to the kommune index right after all services", () => {
	stubDataFiles()
	render(<App />)
	const nav = screen.getAllByRole("navigation", { name: "Hovedmeny" })[0] as HTMLElement
	const names = within(nav).getAllByRole("link").map((a) => a.textContent)
	expect(names[0]).toBe("Alle tjenester")
	expect(names[1]).toBe("Kommuner")
	expect(within(nav).getByRole("link", { name: "Kommuner" })).toHaveAttribute("href", "/kommune")
})

test("the current page's header link carries aria-current, the other does not", async () => {
	stubDataFiles()
	window.history.pushState(null, "", "/kommune")
	render(<App />)
	const nav = screen.getAllByRole("navigation", { name: "Hovedmeny" })[0] as HTMLElement
	expect(within(nav).getByRole("link", { name: "Kommuner" })).toHaveAttribute("aria-current", "page")
	expect(within(nav).getByRole("link", { name: "Alle tjenester" })).not.toHaveAttribute("aria-current")
	window.history.replaceState(null, "", "/")
})

test("the English header says Municipalities and keeps the prefix", () => {
	stubDataFiles()
	window.history.pushState(null, "", "/en/")
	render(<App />)
	const nav = screen.getAllByRole("navigation", { name: "Main menu" })[0] as HTMLElement
	expect(within(nav).getByRole("link", { name: "Municipalities" })).toHaveAttribute("href", "/en/kommune")
	window.history.replaceState(null, "", "/")
})
```

Check the English nav name in the existing test at `header.test.tsx:35` and use that name if it is not "Main menu". If the file has no `afterEach` that resets the URL, the `replaceState` lines above do it.

In `web/tests/headerMenu.test.tsx`, in the test at line 25 add after the "Alle tjenester" line:

```tsx
	expect(m.getByRole("link", { name: "Kommuner" })).toHaveAttribute("href", "/kommune")
```

and rename that test to `"the Meny holds the four links, then Språk and Tema as named groups"`. In the arrows test (line 89), the new link adds one stop: change `await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}")` to `await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}")`.

- [ ] **Step 2: Run them to see them fail**

Run: `cd web && npx vitest run tests/header.test.tsx tests/headerMenu.test.tsx`
Expected: FAIL, no link named "Kommuner".

- [ ] **Step 3: Implement** in `HeaderLinks.tsx`

Add imports `import { useCurrentUrl } from "../navigation.ts"` and `import { parseUrl } from "../services/urlState.ts"`. Inside the component, after `const t = useTranslation()`:

```tsx
	// The current page's link says so (aria-current); a click on it still works.
	const current = parseUrl(useCurrentUrl().pathname).route.kind
```

Give the existing `/sok` link `aria-current={current === "list" ? "page" : undefined}`, and add right after it:

```tsx
			<Link
				to="/kommune"
				className={className}
				aria-current={current === "kommuneIndex" ? "page" : undefined}
				onNavigate={() => {
					onFollow?.()
				}}
			>
				<span>{t("header.kommuner")}</span>
			</Link>
```

Update the comment at the top from "the header's three links" to "the header's four links".

- [ ] **Step 4: Run the tests**

Run: `cd web && npx vitest run tests/header.test.tsx tests/headerMenu.test.tsx tests/axe.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run the whole suite**

Run: `cd web && npm test`
Expected: PASS. If another test counts the header's links, update its count and say why in the commit body.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/HeaderLinks.tsx web/tests/header.test.tsx web/tests/headerMenu.test.tsx
git commit -m "feat(web): link the kommune index from the header and mark the current page"
```

---

### Task 6: Prerender the index, WebSite JSON-LD and the page-hash manifest

**Files:**
- Modify: `web/scripts/prerender.mjs`, `web/scripts/prerender.d.mts`, `web/src/entry-server.tsx`
- Test: `web/tests/prerender.test.ts`

**Interfaces:**
- Consumes: `buildKommuneIndex` (Task 3), `KommuneIndexPage.tsx` (Task 4).
- Produces: `prerenderSite` option `kommuneIndex: (kommuner, resources) => unknown` (required); exported `websiteLd(lang, siteOrigin)`, `pageHash({ head, html, data, ld })`; the file `dist/page-hashes.json`, a JSON object with every page URL (for example `"/kommune"`, `"/en/resources/5"`) mapped to a 64-character hex SHA-256, keys sorted. Task 7 reads this file.

- [ ] **Step 1: Thread the new option through the existing tests**

In `web/tests/prerender.test.ts`, add after `const noFamily = ...`:

```ts
const stubIndex = () => ({ groups: [], national: 0 })
```

and add `kommuneIndex: stubIndex,` after every `split: stubSplit,` line (11 places):

Run: `cd web && sed -i 's/^\(\s*\)split: stubSplit,$/\1split: stubSplit,\n\1kommuneIndex: stubIndex,/' tests/prerender.test.ts && grep -c "kommuneIndex: stubIndex" tests/prerender.test.ts`
Expected: `11`.

- [ ] **Step 2: Write the failing tests** (update two, append the rest)

Change the `urlList` test's expected list to:

```ts
	expect(urls).toEqual([
		"/",
		"/sok",
		"/om",
		"/kommune",
		"/resources/5",
		"/kommune/hamar",
		"/en/",
		"/en/sok",
		"/en/om",
		"/en/kommune",
		"/en/resources/5",
		"/en/kommune/hamar",
	])
```

and in the "writes every page as a file" test change `toHaveLength(10)` to `toHaveLength(12)`.

Append:

```ts
import { createHash } from "node:crypto"
import { buildKommuneIndex } from "../src/services/kommuneIndex.ts"
import { splitForKommune } from "../src/components/KommunePage.tsx"
import { pickHelplines } from "../src/services/helplines.ts"
```

(merge these into the file's import block at the top; `pageHash` and `websiteLd` join the existing `../scripts/prerender.mjs` import), then:

```ts
const echoRender = async (url: string, data: object) => ({
	html: `<main>${url} ${JSON.stringify(data)}</main>`,
	head: {
		title: `T ${url}`,
		description: "D",
		path: url.replace(/^\/en/, "") || "/",
		lang: url.startsWith("/en") ? "en" : "nb",
	},
})

test("/kommune is written as kommune.html with its baked index, beside the kommune folder", async () => {
	const { dataDir, distDir } = setup([row], [hamar])
	await prerenderSite({
		dataDir,
		distDir,
		render: echoRender,
		split: stubSplit,
		kommuneIndex: (kommuner: object[], resources: object[]) => ({
			groups: [{ county: "Innlandet", kommuner }],
			national: resources.length,
		}),
		pickHelplines: () => [],
		family: noFamily,
		siteOrigin: "https://varde.pages.dev",
		log: () => {},
	})
	const page = readFileSync(join(distDir, "kommune.html"), "utf8")
	expect(page).toContain('"kommuneIndex":{"groups":[{"county":"Innlandet"')
	expect(existsSync(join(distDir, "kommune", "hamar.html"))).toBe(true)
	expect(existsSync(join(distDir, "en", "kommune.html"))).toBe(true)
	const sitemap = readFileSync(join(distDir, "sitemap.xml"), "utf8")
	expect(sitemap).toContain("<loc>https://varde.pages.dev/kommune</loc>")
	expect(sitemap).toContain("<loc>https://varde.pages.dev/en/kommune</loc>")
})

test("only the two front pages carry WebSite JSON-LD", async () => {
	const { dataDir, distDir } = setup([row], [hamar])
	await prerenderSite({
		dataDir,
		distDir,
		render: echoRender,
		split: stubSplit,
		kommuneIndex: stubIndex,
		pickHelplines: () => [],
		family: noFamily,
		siteOrigin: "https://varde.pages.dev",
		log: () => {},
	})
	expect(websiteLd("en", "https://varde.pages.dev")).toEqual({
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: "Varde",
		url: "https://varde.pages.dev/en/",
		inLanguage: "en",
	})
	const front = readFileSync(join(distDir, "index.html"), "utf8")
	expect(front).toContain('"@type":"WebSite"')
	expect(front).toContain('"url":"https://varde.pages.dev/"')
	expect(readFileSync(join(distDir, "en", "index.html"), "utf8")).toContain('"inLanguage":"en"')
	for (const file of ["sok.html", "om.html", "kommune.html", "resources/5.html"])
		expect(readFileSync(join(distDir, file), "utf8")).not.toContain('"@type":"WebSite"')
})

test("pageHash is a sha256 of the page's own content", () => {
	const parts = { head: "<title>T</title>", html: "<main>x</main>", data: { a: 1 }, ld: null }
	const expected = createHash("sha256")
		.update(JSON.stringify([parts.head, parts.html, parts.data, parts.ld]))
		.digest("hex")
	expect(pageHash(parts)).toBe(expected)
	expect(pageHash({ ...parts, html: "<main>y</main>" })).not.toBe(expected)
})

async function manifestFor(
	resources: object[],
	kommuner: object[],
	options: { template?: string; manifest?: object } = {}
) {
	const { dataDir, distDir } = setup(resources, kommuner)
	if (options.template) writeFileSync(join(distDir, "index.html"), options.template)
	await prerenderSite({
		dataDir,
		distDir,
		render: echoRender,
		split: splitForKommune as never,
		kommuneIndex: buildKommuneIndex as never,
		pickHelplines: () => [],
		family: realFamily,
		siteOrigin: "https://varde.pages.dev",
		manifest: (options.manifest ?? null) as never,
		log: () => {},
	})
	return JSON.parse(readFileSync(join(distDir, "page-hashes.json"), "utf8")) as Record<string, string>
}

const rowB = { ...row, id: 6, name: "Krisesenteret", municipalityId: 9, servedMunicipalityIds: [1] }

test("the manifest lists every page once, keys sorted, values sha256 hex, no 404", async () => {
	const hashes = await manifestFor([row, rowB], [hamar])
	const keys = Object.keys(hashes)
	expect(keys).toEqual([...keys].sort())
	expect(keys).toHaveLength(14)
	expect(keys).toContain("/kommune")
	expect(keys).not.toContain("/404")
	for (const value of Object.values(hashes)) expect(value).toMatch(/^[a-f0-9]{64}$/)
})

test("the same data in another order gives the same manifest", async () => {
	const a = await manifestFor([row, rowB], [hamar])
	const b = await manifestFor([rowB, row], [hamar])
	expect(b).toEqual(a)
})

test("a changed asset link or template keeps every hash", async () => {
	const a = await manifestFor([row], [hamar])
	const b = await manifestFor([row], [hamar], {
		template: template.replace("/assets/main.js", "/assets/main-NEWHASH.js"),
		manifest: {
			"src/main.tsx": { file: "assets/main-NEWHASH.js", isEntry: true },
			"src/components/KommuneIndexPage.tsx": { file: "assets/KommuneIndexPage-NEW.js" },
		},
	})
	expect(b).toEqual(a)
})

test("changed content changes only that page's hash", async () => {
	const a = await manifestFor([row], [hamar])
	const b = await manifestFor([{ ...row, description: "new text" }], [hamar])
	const changed = Object.keys(a).filter((k) => a[k] !== b[k])
	// The row shows on its own page and on the kommune pages; nothing else moved.
	expect(changed.sort()).toEqual(
		["/en/kommune/hamar", "/en/resources/5", "/kommune/hamar", "/resources/5"].sort()
	)
})
```

`landing` pages call `pickHelplines`; the `() => []` stub keeps these tests free of the helpline ids. `pickHelplines` from `src/services/helplines.ts` is imported only if Biome or TS needs it elsewhere; if it ends up unused, drop that import.

- [ ] **Step 3: Run them to see them fail**

Run: `cd web && npx vitest run tests/prerender.test.ts`
Expected: FAIL: `pageHash` and `websiteLd` are not exported, `/kommune` is missing from `urlList`.

- [ ] **Step 4: Implement in `web/scripts/prerender.mjs`**

1. Add `import { createHash } from "node:crypto"` at the top.
2. Add to `CHUNKS`: `kommuneIndex: "src/components/KommuneIndexPage.tsx",`.
3. In `urlList`, after the `/om` line:

```js
		out.push({ url: `${p}/kommune`, data: {}, lang, kommuneIndex: true, chunk: CHUNKS.kommuneIndex })
```

4. After `jsonLd`, add:

```js
// The front page tells search engines the site's name (spec 2026-11-06). No SearchAction:
// Google retired the sitelinks search box, and /sok? is blocked in robots.txt.
export function websiteLd(lang, siteOrigin) {
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: "Varde",
		url: `${siteOrigin}${prefix(lang)}/`,
		inLanguage: lang,
	}
}

// A page's own content, hashed for IndexNow (spec 2026-11-06): head tags, markup, baked data and
// JSON-LD. The template and the hashed asset links are left out, so a code-only deploy changes
// no hash and pings nothing.
export function pageHash({ head, html, data, ld }) {
	return createHash("sha256")
		.update(JSON.stringify([head, html, data, ld ?? null]))
		.digest("hex")
}
```

5. Add `kommuneIndex,` to `prerenderSite`'s destructured options after `split,`.
6. In the loop, change the `content` chain to:

```js
		const content = page.kommune
			? { kommune: split(page.kommune, resourcesByLang[page.lang]) }
			: page.kommuneIndex
				? { kommuneIndex: kommuneIndex(kommuner, resourcesByLang[page.lang]) }
				: page.landing
					? { helplines: pickHelplines(resourcesByLang[page.lang]) }
					: page.data.resource
						? { ...page.data, family: family(page.data.resource, resourcesByLang[page.lang]) }
						: page.data
```

7. Before the loop add `const hashes = {}`. Replace the `ld` and `fillTemplate` lines with:

```js
		const ld = data.resource
			? jsonLd(data.resource, page.lang, siteOrigin)
			: page.landing
				? websiteLd(page.lang, siteOrigin)
				: null
		const pageHead = headTags(head, siteOrigin)
		hashes[page.url] = pageHash({ head: pageHead, html, data, ld })
		const file = fillTemplate(template, {
			lang: page.lang,
			head: [pageHead, modulepreloadTags(manifest, page.chunk)].filter(Boolean).join("\n\t\t"),
			html,
			data,
			ld,
		})
```

8. After the `sitemap.xml` write:

```js
	const sorted = Object.fromEntries(Object.entries(hashes).sort(([a], [b]) => (a < b ? -1 : 1)))
	writeFileSync(join(distDir, "page-hashes.json"), `${JSON.stringify(sorted, null, "\t")}\n`)
```

9. In the CLI block at the bottom, add `kommuneIndex: server.buildKommuneIndex,` after `split: server.splitForKommune,`.

- [ ] **Step 5: Update `web/scripts/prerender.d.mts`**

Add `kommuneIndex?: boolean` to `PrerenderPage`, `export type KommuneIndexFn = (kommuner: object[], resources: object[]) => unknown`, `kommuneIndex: KommuneIndexFn` to `PrerenderOptions` after `split`, and:

```ts
export declare function websiteLd(lang: string, siteOrigin: string): object
export declare function pageHash(parts: { head: string; html: string; data: unknown; ld: unknown }): string
```

- [ ] **Step 6: Re-export the builder** in `web/src/entry-server.tsx`, after the `splitForKommune` re-export:

```tsx
// The prerender bakes /kommune with the same builder the browser uses.
export { buildKommuneIndex } from "./services/kommuneIndex.ts"
```

- [ ] **Step 7: Run the tests**

Run: `cd web && npx vitest run tests/prerender.test.ts tests/hydration.test.tsx`
Expected: PASS. If "changed content changes only that page's hash" lists more pages, check whether the changed row also reaches `/kommune` (it should not: the index holds counts only) before touching the test.

- [ ] **Step 8: Prove it on a real build**

Run: `cd web && cp e2e/fixtures/data/*.json public/data/ && npm run build:site && node -e "const h=require('./dist/page-hashes.json');console.log(Object.keys(h).length, h['/kommune'].length)" && ls dist/kommune.html dist/en/kommune.html && grep -c '"@type":"WebSite"' dist/index.html`
Expected: `300 64`, both files listed, `1`.

- [ ] **Step 9: Commit**

```bash
git add web/scripts/prerender.mjs web/scripts/prerender.d.mts web/src/entry-server.tsx web/tests/prerender.test.ts
git commit -m "feat(web): prerender /kommune, WebSite JSON-LD and a page-hash manifest"
```

---

### Task 7: The IndexNow script and key file

**Files:**
- Create: `web/scripts/indexnow.mjs`, `web/scripts/indexnow.d.mts`, `web/public/<key>.txt`
- Modify: `web/public/_headers`
- Test: create `web/tests/indexnow.test.ts`; modify `web/tests/headers.test.ts`

**Interfaces:**
- Consumes: `dist/page-hashes.json` from Task 6 (object of path to hash).
- Produces: `node scripts/indexnow.mjs <live.json> <next.json>` with env `SITE_ORIGIN`; always exit code 0. Task 8 calls exactly this.

One deviation from the spec, on purpose: the spec keeps the key as a constant in the script plus a matching file. This plan keeps only the file and has the script read the key from it (`findKey`). One source of truth, so the two can never drift. The test still proves there is exactly one key file and that its content is its name.

- [ ] **Step 1: Generate the key file**

Run: `cd web && KEY=$(node -e "console.log(require('node:crypto').randomBytes(16).toString('hex'))") && printf '%s' "$KEY" > "public/$KEY.txt" && ls public/*.txt`
Expected: one file, `public/<32 hex characters>.txt`. The key is public by design (spec, IndexNow section).

- [ ] **Step 2: Write the failing tests** in `web/tests/indexnow.test.ts`

```ts
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, expect, test, vi } from "vitest"
import { BATCH, changedUrls, ENDPOINT, findKey, main, ping, readManifest } from "../scripts/indexnow.mjs"

const here = dirname(fileURLToPath(import.meta.url))
const publicDir = join(here, "..", "public")
const origin = "https://varde.pages.dev"
const dirs: string[] = []
afterEach(() => {
	for (const d of dirs) rmSync(d, { recursive: true, force: true })
})
const tmp = () => {
	const d = mkdtempSync(join(tmpdir(), "varde-indexnow-"))
	dirs.push(d)
	return d
}
const noWait = async () => {}

test("public/ holds exactly one key file, and it contains its own name", () => {
	const key = findKey(publicDir)
	expect(key).toMatch(/^[a-f0-9]{32}$/)
	expect(readFileSync(join(publicDir, `${key}.txt`), "utf8")).toBe(key)
	expect(readdirSync(publicDir).filter((f) => /^[a-f0-9]{32}\.txt$/.test(f))).toHaveLength(1)
})

test("changedUrls returns new, changed and removed pages as sorted absolute URLs", () => {
	const live = { "/": "a", "/om": "b", "/resources/9": "c" }
	const next = { "/": "a", "/om": "B", "/kommune": "d" }
	expect(changedUrls(live, next, origin)).toEqual([
		"https://varde.pages.dev/kommune",
		"https://varde.pages.dev/om",
		"https://varde.pages.dev/resources/9",
	])
})

test("an empty live manifest means every page is new", () => {
	expect(changedUrls({}, { "/": "a", "/en/": "b" }, origin)).toEqual([
		"https://varde.pages.dev/",
		"https://varde.pages.dev/en/",
	])
})

test("keys that are not site paths never reach the ping", () => {
	const next = {
		"https://evil.example/x": "1",
		"//evil.example/x": "2",
		"/\\evil.example/x": "3",
		"om": "4",
		constructor: "5",
		"/ok": "6",
	}
	expect(changedUrls({ "//gone.example": "y", toString: "z" }, next, origin)).toEqual([
		"https://varde.pages.dev/ok",
	])
})

test("readManifest turns anything unreadable into an empty object", () => {
	const d = tmp()
	const file = (name: string, text: string) => {
		writeFileSync(join(d, name), text)
		return join(d, name)
	}
	expect(readManifest(join(d, "missing.json"))).toEqual({})
	expect(readManifest(file("empty.json", ""))).toEqual({})
	expect(readManifest(file("array.json", "[1,2]"))).toEqual({})
	expect(readManifest(file("null.json", "null"))).toEqual({})
	expect(readManifest(file("ok.json", '{"/":"a"}'))).toEqual({ "/": "a" })
})

test("ping sends nothing when nothing changed", async () => {
	const fetchImpl = vi.fn()
	const log = vi.fn()
	await ping({ urls: [], origin, key: "k".repeat(32), fetchImpl, log, wait: noWait })
	expect(fetchImpl).not.toHaveBeenCalled()
	expect(log).toHaveBeenCalledWith("IndexNow: 0 changed URLs, nothing sent")
})

test("ping posts host, key and the URLs, and logs status and count only", async () => {
	const fetchImpl = vi.fn(async () => new Response(null, { status: 202 }))
	const log = vi.fn()
	const urls = ["https://varde.pages.dev/kommune"]
	await ping({ urls, origin, key: "abc12345", fetchImpl, log, wait: noWait })
	expect(fetchImpl).toHaveBeenCalledTimes(1)
	const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
	expect(url).toBe(ENDPOINT)
	expect(init.method).toBe("POST")
	expect(JSON.parse(String(init.body))).toEqual({ host: "varde.pages.dev", key: "abc12345", urlList: urls })
	expect(log.mock.calls.map((c) => c[0])).toEqual(["IndexNow: 1 URLs, status 202"])
})

test("ping splits more than 10,000 URLs into batches", async () => {
	const fetchImpl = vi.fn(async () => new Response(null, { status: 200 }))
	const urls = Array.from({ length: BATCH + 1 }, (_, i) => `https://varde.pages.dev/resources/${i}`)
	await ping({ urls, origin, key: "abc12345", fetchImpl, log: () => {}, wait: noWait })
	expect(fetchImpl).toHaveBeenCalledTimes(2)
})

test("a 5xx or a network error is retried once; a 4xx is not, and both warn", async () => {
	const wait = vi.fn(noWait)
	const flaky = vi
		.fn()
		.mockResolvedValueOnce(new Response(null, { status: 503 }))
		.mockResolvedValueOnce(new Response(null, { status: 200 }))
	const log = vi.fn()
	await ping({ urls: ["https://varde.pages.dev/"], origin, key: "abc12345", fetchImpl: flaky, log, wait })
	expect(flaky).toHaveBeenCalledTimes(2)
	expect(wait).toHaveBeenCalledWith(10_000)
	expect(log.mock.calls.some((c) => String(c[0]).startsWith("::warning::"))).toBe(false)

	const refused = vi.fn(async () => new Response(null, { status: 403 }))
	const log2 = vi.fn()
	await ping({ urls: ["https://varde.pages.dev/"], origin, key: "abc12345", fetchImpl: refused, log: log2, wait })
	expect(refused).toHaveBeenCalledTimes(1)
	expect(log2.mock.calls.some((c) => String(c[0]).startsWith("::warning::IndexNow ping got 403"))).toBe(true)

	const down = vi.fn(async () => {
		throw new TypeError("fetch failed")
	})
	const log3 = vi.fn()
	await ping({ urls: ["https://varde.pages.dev/"], origin, key: "abc12345", fetchImpl: down, log: log3, wait })
	expect(down).toHaveBeenCalledTimes(2)
	expect(log3.mock.calls.some((c) => String(c[0]).includes("network error"))).toBe(true)
})

test("main never throws and reports a warning when it cannot run", async () => {
	const d = tmp()
	const next = join(d, "next.json")
	writeFileSync(next, '{"/":"a"}')
	const log = vi.fn()
	const fetchImpl = vi.fn(async () => new Response(null, { status: 200 }))
	// No SITE_ORIGIN: skipped with a warning, nothing sent.
	await expect(
		main({ argv: [join(d, "live.json"), next], env: {}, fetchImpl, log, wait: noWait, publicDir })
	).resolves.toBeUndefined()
	expect(fetchImpl).not.toHaveBeenCalled()
	expect(log.mock.calls.some((c) => String(c[0]).startsWith("::warning::IndexNow skipped"))).toBe(true)
	// A public dir with no key file: a warning, nothing sent, no throw.
	const log2 = vi.fn()
	await main({ argv: [join(d, "live.json"), next], env: { SITE_ORIGIN: origin }, fetchImpl, log: log2, wait: noWait, publicDir: d })
	expect(fetchImpl).not.toHaveBeenCalled()
	expect(log2.mock.calls.some((c) => String(c[0]).startsWith("::warning::IndexNow failed"))).toBe(true)
	// The first run: no live manifest, so every page is sent.
	const log3 = vi.fn()
	await main({ argv: [join(d, "live.json"), next], env: { SITE_ORIGIN: `${origin}/` }, fetchImpl, log: log3, wait: noWait, publicDir })
	expect(fetchImpl).toHaveBeenCalledTimes(1)
	const body = JSON.parse(String((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body))
	expect(body.urlList).toEqual(["https://varde.pages.dev/"])
})
```

Append to `web/tests/headers.test.ts`:

```ts
test("the IndexNow plumbing files are never indexed", () => {
	const text = read("../public/_headers")
	const key = readdirSync(join(here, "../public")).find((f) => /^[a-f0-9]{32}\.txt$/.test(f))
	expect(key).toBeDefined()
	for (const path of ["/page-hashes.json", `/${key}`]) {
		expect(text).toMatch(new RegExp(`^${path.replace(/\./g, "\\.")}\\r?\\n\\s+X-Robots-Tag: noindex`, "m"))
	}
})
```

and add `readdirSync` to that file's `node:fs` import.

- [ ] **Step 3: Run them to see them fail**

Run: `cd web && npx vitest run tests/indexnow.test.ts tests/headers.test.ts`
Expected: FAIL, cannot resolve `../scripts/indexnow.mjs`; the headers test fails on the missing block.

- [ ] **Step 4: Write `web/scripts/indexnow.mjs`**

```js
// IndexNow (spec 2026-11-06): after a deploy, tell Bing and the other IndexNow engines which
// pages are new, changed or gone. Run as `node scripts/indexnow.mjs <live.json> <next.json>`
// with SITE_ORIGIN set. It never fails a deploy: every path ends with exit code 0, and a ping
// that does not land leaves a ::warning:: annotation on the run instead. No shebang, for the
// same Vitest reason prerender.mjs gives.
import { readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

export const ENDPOINT = "https://api.indexnow.org/indexnow"
export const BATCH = 10_000
const KEY_FILE = /^([a-f0-9]{32})\.txt$/

// The key lives only in its file name and content (public/<key>.txt), so the two cannot drift.
export function findKey(publicDir) {
	const keys = readdirSync(publicDir)
		.map((name) => KEY_FILE.exec(name)?.[1])
		.filter(Boolean)
	if (keys.length !== 1) throw new Error(`expected one key file, found ${keys.length}`)
	return keys[0]
}

// A missing, empty or malformed manifest counts as empty: the first run sends every page.
export function readManifest(path) {
	try {
		const value = JSON.parse(readFileSync(path, "utf8"))
		return value && typeof value === "object" && !Array.isArray(value) ? value : {}
	} catch {
		return {}
	}
}

// Only a site path survives: one leading slash, and the resolved URL keeps the site's origin
// (a backslash form like "/\host" resolves to another host and is dropped here).
function toUrl(path, origin) {
	if (!path.startsWith("/") || path.startsWith("//")) return null
	try {
		const url = new URL(path, origin)
		return url.origin === new URL(origin).origin ? url.href : null
	} catch {
		return null
	}
}

export function changedUrls(live, next, origin) {
	const paths = new Set()
	for (const [path, hash] of Object.entries(next))
		if (!Object.hasOwn(live, path) || live[path] !== hash) paths.add(path)
	for (const path of Object.keys(live)) if (!Object.hasOwn(next, path)) paths.add(path)
	return [...paths]
		.map((path) => toUrl(path, origin))
		.filter(Boolean)
		.sort()
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function ping({ urls, origin, key, fetchImpl = fetch, log = console.log, wait = sleep }) {
	if (urls.length === 0) {
		log("IndexNow: 0 changed URLs, nothing sent")
		return
	}
	const host = new URL(origin).host
	for (let i = 0; i < urls.length; i += BATCH) {
		const urlList = urls.slice(i, i + BATCH)
		const send = async () => {
			try {
				const response = await fetchImpl(ENDPOINT, {
					method: "POST",
					headers: { "Content-Type": "application/json; charset=utf-8" },
					body: JSON.stringify({ host, key, urlList }),
					signal: AbortSignal.timeout(30_000),
				})
				return response.status
			} catch {
				return 0
			}
		}
		let status = await send()
		if (status === 0 || status >= 500) {
			await wait(10_000)
			status = await send()
		}
		const shown = status === 0 ? "network error" : status
		log(`IndexNow: ${urlList.length} URLs, status ${shown}`)
		if (status !== 200 && status !== 202)
			log(`::warning::IndexNow ping got ${shown} for ${urlList.length} URLs; the sitemap still lists them`)
	}
}

export async function main({
	argv,
	env,
	fetchImpl = fetch,
	log = console.log,
	wait = sleep,
	publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public"),
}) {
	try {
		const origin = (env.SITE_ORIGIN ?? "").replace(/\/$/, "")
		const [livePath = "", nextPath = ""] = argv
		const next = readManifest(nextPath)
		if (!origin || Object.keys(next).length === 0) {
			log("::warning::IndexNow skipped: no SITE_ORIGIN or no new manifest")
			return
		}
		const key = findKey(publicDir)
		const urls = changedUrls(readManifest(livePath), next, origin)
		await ping({ urls, origin, key, fetchImpl, log, wait })
	} catch (error) {
		log(`::warning::IndexNow failed: ${error instanceof Error ? error.message : "unknown error"}`)
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await main({ argv: process.argv.slice(2), env: process.env })
	process.exitCode = 0
}
```

- [ ] **Step 5: Write `web/scripts/indexnow.d.mts`**

```ts
// Sibling declaration for indexnow.mjs, like prerender.d.mts. tests/indexnow.test.ts is the
// only TS consumer.
export type Manifest = Record<string, string>
export type FetchLike = (url: string, init: RequestInit) => Promise<Response>
export type PingOptions = {
	urls: string[]
	origin: string
	key: string
	fetchImpl?: FetchLike
	log?: (message: string) => void
	wait?: (ms: number) => Promise<void>
}
export declare const ENDPOINT: string
export declare const BATCH: number
export declare function findKey(publicDir: string): string
export declare function readManifest(path: string): Manifest
export declare function changedUrls(live: Manifest, next: Manifest, origin: string): string[]
export declare function ping(options: PingOptions): Promise<void>
export declare function main(options: {
	argv: string[]
	env: Record<string, string | undefined>
	fetchImpl?: FetchLike
	log?: (message: string) => void
	wait?: (ms: number) => Promise<void>
	publicDir?: string
}): Promise<void>
```

If the test file's `vi.fn()` mocks do not satisfy `FetchLike`, cast them at the call site with `as never` rather than loosening the declaration.

- [ ] **Step 6: Add the noindex blocks** to the end of `web/public/_headers` (replace `<key>` with the file name from Step 1, without `.txt` doubling)

```
/page-hashes.json
  X-Robots-Tag: noindex

/<key>.txt
  X-Robots-Tag: noindex
```

Match the indentation the file already uses under `/*` (two spaces).

- [ ] **Step 7: Run the tests**

Run: `cd web && npx vitest run tests/indexnow.test.ts tests/headers.test.ts`
Expected: PASS.

- [ ] **Step 8: Run the whole suite and Biome**

Run: `cd web && npm test && npx biome ci .`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add web/scripts/indexnow.mjs web/scripts/indexnow.d.mts web/public/*.txt web/public/_headers web/tests/indexnow.test.ts web/tests/headers.test.ts
git commit -m "feat(web): IndexNow script and key file that ping only changed pages"
```

Check with `git status` that the only new `.txt` in `web/public` is the key file before committing.

---

### Task 8: The deploy workflow

**Files:**
- Modify: `.github/workflows/deploy-web.yml` (job `build-and-deploy`)

**Interfaces:**
- Consumes: `node scripts/indexnow.mjs <live.json> <next.json>` (Task 7), `web/dist/page-hashes.json` (Task 6).

- [ ] **Step 1: Add the fetch step** right before `- name: Deploy to Cloudflare Pages`:

```yaml
      # The live site's page hashes, taken before this deploy replaces them. Missing (the first
      # run, or the site is down) means the IndexNow step treats every page as new.
      - name: Fetch the live page hashes
        env:
          SITE_ORIGIN: ${{ vars.SITE_ORIGIN }}
        run: curl -sf --max-time 20 "$SITE_ORIGIN/page-hashes.json" -o live-hashes.json || true
```

- [ ] **Step 2: Add the ping step** after the deploy step, at the end of the job:

```yaml
      # Tell IndexNow (Bing and the other engines) which pages are new, changed or gone. It can
      # never fail the deploy; a ping that does not land leaves a warning annotation on the run.
      - name: IndexNow
        continue-on-error: true
        timeout-minutes: 3
        working-directory: web
        env:
          SITE_ORIGIN: ${{ vars.SITE_ORIGIN }}
        run: node scripts/indexnow.mjs ../live-hashes.json dist/page-hashes.json
```

- [ ] **Step 3: Lint the workflow**

Run: `npx --yes actionlint@1 .github/workflows/deploy-web.yml 2>/dev/null || python -c "import yaml,sys;yaml.safe_load(open('.github/workflows/deploy-web.yml'));print('yaml ok')"`
Expected: no actionlint findings, or `yaml ok` if actionlint cannot run. Do not install anything to make it run.

- [ ] **Step 4: Dry-run the CLI locally against the real build** (no network call: an empty manifest pair sends nothing)

Run: `cd web && SITE_ORIGIN=https://varde.pages.dev node scripts/indexnow.mjs no-such-live.json no-such-next.json; echo "exit $?"`
Expected: `::warning::IndexNow skipped: no SITE_ORIGIN or no new manifest` and `exit 0`. (Missing files on purpose: Windows node cannot see Git Bash's `/tmp`.) Never run it against `dist/page-hashes.json` with the real origin locally: that would send a real ping.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/deploy-web.yml
git commit -m "ci(web): ping IndexNow with the pages each deploy changed"
```

---

### Task 9: End-to-end tests

**Files:**
- Create: `web/e2e/kommuneIndex.spec.ts`
- Modify: `web/e2e/reflow.spec.ts:4`, `web/e2e/hydration.spec.ts:9-16`

**Interfaces:**
- Consumes: the built site from `npm run build:site` with the e2e fixture data (8 kommuner, 138 rows, 17 national).

- [ ] **Step 1: Write `web/e2e/kommuneIndex.spec.ts`**

```ts
import { createRequire } from "node:module"
import { expect, test } from "@playwright/test"
import { hydrated, noHorizontalScroll, setTheme, settle, THEMES } from "./helpers.ts"

const axePath = createRequire(import.meta.url).resolve("axe-core/axe.min.js")

for (const [path, h1, prefix] of [
	["/kommune", "Hjelpetjenester per kommune", ""],
	["/en/kommune", "Help services by municipality", "/en"],
] as const) {
	test(`${path} loads directly and every count matches its kommune page`, async ({ page }) => {
		await page.goto(path)
		await expect(page.getByRole("heading", { level: 1, name: h1 })).toBeVisible()
		await expect(page.getByRole("region", { name: "Innlandet" })).toBeVisible()
		await expect(page.getByRole("region", { name: "Oslo" })).toBeVisible()
		const rows = await page.locator(".kommune-row").evaluateAll((els) =>
			els.map((a) => ({
				href: a.getAttribute("href") ?? "",
				count: Number.parseInt(a.querySelector(".kommune-count")?.textContent ?? "", 10),
			}))
		)
		expect(rows).toHaveLength(8)
		for (const { href, count } of rows) {
			expect(href.startsWith(`${prefix}/kommune/`)).toBe(true)
			await page.goto(href)
			const local = page.locator("section[aria-labelledby='kommune-local'] h3")
			await expect(local.first()).toBeVisible()
			expect(await local.count()).toBe(count)
		}
	})
}

test("a directly loaded /kommune switches to English in place", async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 })
	await page.goto("/kommune")
	await hydrated(page)
	await page.evaluate(() => {
		;(window as unknown as { stayed: boolean }).stayed = true
	})
	await page.locator("header .header-tools summary").click()
	await page.locator("header .header-tools").getByRole("link", { name: "English" }).click()
	await expect(page).toHaveURL(/\/en\/kommune$/)
	await expect(page.getByRole("heading", { level: 1, name: "Help services by municipality" })).toBeVisible()
	await expect(page.getByRole("link", { name: /^Hamar \d+ services$/ })).toHaveAttribute("href", "/en/kommune/hamar")
	await expect(page).toHaveTitle("Help services by municipality – Varde")
	expect(await page.evaluate(() => (window as unknown as { stayed?: boolean }).stayed)).toBe(true)
})

test("the header link opens the index from the desktop nav and from the Meny", async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 })
	await page.goto("/om")
	await page.locator(".header-nav").getByRole("link", { name: "Kommuner" }).click()
	await expect(page).toHaveURL(/\/kommune$/)
	await expect(page.getByRole("heading", { level: 1, name: "Hjelpetjenester per kommune" })).toBeFocused()
	await page.setViewportSize({ width: 375, height: 800 })
	await page.goto("/om")
	await page.locator("details.header-menu summary").click()
	await page.locator("details.header-menu").getByRole("link", { name: "Kommuner" }).click()
	await expect(page).toHaveURL(/\/kommune$/)
})

for (const width of [320, 768, 1024, 1280, 1600, 1920]) {
	test(`/kommune fits at ${width} px with 44 px rows and the planned columns`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 })
		await page.goto("/kommune")
		await settle(page)
		expect(await noHorizontalScroll(page)).toBe(true)
		const boxes = await page
			.locator("section[aria-labelledby='fylke-0'] .kommune-row")
			.evaluateAll((els) => els.map((a) => a.getBoundingClientRect().toJSON() as DOMRect))
		for (const box of boxes) expect(box.height).toBeGreaterThanOrEqual(44)
		const columns = new Set(boxes.map((b) => Math.round(b.left))).size
		const expected = width >= 1600 ? 4 : width >= 1024 ? 3 : width >= 768 ? 2 : 1
		expect(columns).toBe(expected)
	})
}

for (const theme of THEMES) {
	test(`axe passes on /kommune (${theme})`, async ({ page }) => {
		await setTheme(page, theme)
		await page.goto("/kommune")
		await settle(page)
		await page.addScriptTag({ path: axePath })
		const violations = await page.evaluate(async () => {
			const { axe } = window as unknown as {
				axe: { run(): Promise<{ violations: { id: string }[] }> }
			}
			return (await axe.run()).violations.map((v) => v.id)
		})
		expect(violations).toEqual([])
	})
}
```

The first group (Innlandet) has 7 kommuner in the fixture, enough for 4 columns. Before writing, compare `settle`, `setTheme` and the axe pattern with `e2e/history.spec.ts:260-280` and match their real signatures.

- [ ] **Step 2: Add `/kommune` to the existing guards**

`e2e/reflow.spec.ts:4`: add `"/kommune", "/en/kommune"` to `paths`. `e2e/hydration.spec.ts`: add `"/kommune", "/en/kommune"` to the path list.

- [ ] **Step 3: Build and run the new and touched specs**

Run: `cd web && cp e2e/fixtures/data/*.json public/data/ && npm run build:site && npx playwright test e2e/kommuneIndex.spec.ts e2e/reflow.spec.ts e2e/hydration.spec.ts e2e/header.spec.ts`
Expected: PASS. If `/kommune` 404s under `vite preview` while `dist/kommune.html` exists, that is the spec's "kommune.html beside the kommune/ folder" risk: stop, report what `vite preview` does with `curl -sI http://localhost:4173/kommune` and `/kommune/`, and do not work around it in the router.

- [ ] **Step 4: Commit**

```bash
git add web/e2e/kommuneIndex.spec.ts web/e2e/reflow.spec.ts web/e2e/hydration.spec.ts
git commit -m "test(web): end-to-end checks for the kommune index"
```

---

### Task 10: Full verification, layout audit and PR

**Files:** none new.

- [ ] **Step 1: The full suites**

Run: `cd web && npm test && npx biome ci . && npm run e2e`
Expected: every test passes. Report failures with their output; never skip one.

- [ ] **Step 2: Layout audit on the served build** (Malin's standards: measure, two rounds)

Start the `web-preview` server from `.claude/launch.json` and measure `/kommune` and `/en/kommune` at 320, 768, 1024, 1280, 1600 and 1920 px in both themes: row heights, that name and count share a centre line in each row, equal gaps, and the header row at 1024 px in both languages. Then inject a long name in devtools (`document.querySelector('.kommune-name').textContent = "Porsanger Porsáŋgu Porsanki"`) at 1600 px and check the name wraps while the count stays whole. Check the rows under forced colours (Chromium devtools, Rendering, "Emulate CSS forced-colors"), and Tab through the page: every row shows the site's focus ring, unclipped by its neighbour. Fix and re-measure at most once, then show Malin the screenshots.

- [ ] **Step 3: Open the PR** from a branch off main, `feat/seo-indexing`, with this body (fill in the counts from the run in Step 1):

```markdown
## What

Google knew only Varde's front page: no crawlable link reached the kommune pages, which link every service. This PR adds:

- `/kommune` and `/en/kommune`: every kommune grouped by fylke with its service count, linked from the header ("Kommuner").
- Longer titles: the place is added when a service name lacks it.
- A real front page meta description and WebSite JSON-LD.
- IndexNow: the prerender writes `page-hashes.json`, and each deploy pings only new, changed or removed pages. The ping never fails a deploy.

Spec: `docs/superpowers/specs/2026-11-06-varde-seo-indexing-design.md`.

## Checks

- `npm test`: N passed
- `npm run e2e`: N passed
- Layout measured at 320 to 1920 px in both themes and languages
```

- [ ] **Step 4: Check the preview deploy** once Cloudflare posts it on the PR:

Run: `curl -sI https://<preview-host>/kommune | head -1 && curl -sI https://<preview-host>/kommune/ | head -3 && curl -s https://<preview-host>/page-hashes.json | head -c 120`
Expected: `/kommune` answers 200; `/kommune/` answers a 308 to `/kommune` or 200, never 404; the manifest is JSON. Report the three lines on the PR.

- [ ] **Step 5: Hand Malin her after-deploy list** (from the spec): request indexing for `/kommune` and two or three kommune pages in Search Console; check Bing's IndexNow report shows the first ping; re-check the sitemap status around 12.11.2026; on the first 04:00 cron run after the merge, check the IndexNow step logged `0 changed URLs`.

---

## Stress test notes

- **Applied:** keyboard focus ring check on the rows (Task 10 Step 2); the language-switch e2e test (Task 9) pins Review Focus 1; the local CLI dry run uses missing files instead of `/tmp`, which Windows node cannot see (Task 8 Step 4); the hostile-key test drops a `__proto__` literal that sets a prototype instead of a key.
- **Considered and rejected:**
  - A singular national line ("1 nasjonal tjeneste"): live data has 17 national rows. Adding a singular key needs new copy from Malin; revisit if the count ever drops to 1.
  - Hashing the real React render in the shuffle test: the echo render serialises the baked data, which is everything the markup is built from. React's own output for the same data is deterministic.
  - Running the deploy's ping in the PR's CI: it would send real pings from preview builds. The CLI is covered by unit tests with a stubbed `fetch`, and the first real run is checked after merge (Task 10 Step 5).

> Stress-tested 2026-11-06 (skill a217382): 4 applied, 0 adapted, 0 decided by me.
