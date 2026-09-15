# Varde static-first (plan 5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Varde becomes a prerendered static site on Cloudflare Pages, built daily from the C# API and Neon inside GitHub Actions, with kommune pages and per-page metadata for search engines.

**Architecture:** The existing React app is rendered to HTML at build time by Vite's SSR build plus React 19's `prerender`, and hydrated in the browser. Search runs in memory over exported JSON. One workflow exports data, builds, prerenders and deploys; the API only ever runs inside that workflow.

**Tech Stack:** React 19, Vite 8 (client + SSR build), Vitest 4 + Testing Library + jsdom, Tailwind v4, react-aria-components 1.21, TypeScript 7, Biome 2, Node 22 scripts (`.mjs`), ASP.NET Core 10 + EF Core (one DTO field), GitHub Actions, `cloudflare/wrangler-action`.

**Spec:** `docs/superpowers/specs/2026-09-15-varde-static-first-design.md` — read it first; every task below argues from it.

## Global Constraints

- No new runtime dependency. New dev dependencies only where a task names one (none do). The deploy tool is `cloudflare/wrangler-action` pinned to a release tag, never `npx wrangler@latest`.
- Web code: TypeScript, tabs, Biome-clean (`npx biome check .` in `web/` before every commit), imports with `.ts`/`.tsx` extensions as the codebase does. Tests live in `web/tests/`, named `<topic>.test.ts(x)`, run with `npm test` in `web/`.
- API code: run `Start-Service postgresql-x64-17` before `dotnet test api/Varde.slnx`. Baseline 85/85.
- Web baseline: 151/151. The count only goes up.
- Voice: comments, docs and commit messages in first person as Malin, no AI attribution, no `Co-Authored-By`.
- Never invent contact data. The report address is exactly `varde.implicate775@passmail.com`. Titles and descriptions are copied verbatim from the spec's tables.
- CSP line, verbatim from the spec: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`
- Row floor: `MIN_RESOURCES = 90`. Page size: 20. Description meta: cut at the last space before 155 characters, append `…`.
- `public/data/` is gitignored and Biome-ignored. `dist-server/` is gitignored and never deployed.
- One `<h1>` per composed page. Every safety-critical control is a real anchor in the prerendered HTML.
- The plan ships as ONE PR from branch `feat/static-first`; a merge to `main` deploys. Commit after every task.

---

## File map

| Path | Responsibility |
|---|---|
| `api/Varde.Core/Dtos/ResourceDto.cs` | + `ServedMunicipalityIds` |
| `api/Varde.Core/Services/ResourceService.cs` | maps the new field |
| `api/Varde.Data/Repositories/ResourceRepository.cs` | includes `ServedMunicipalities` |
| `web/src/services/urlState.ts` | route parsing with language prefix, legacy redirect rule, path helpers |
| `web/public/theme-init.js` | pre-paint theme + pre-paint redirects (mirror of `legacyRedirect`) |
| `web/src/services/data.ts` | loads `/data/*.json`, caches per language, reads the inline page-data block |
| `web/src/services/query.ts` | pure in-memory filter, sort and page (mirrors the API repository) |
| `web/src/pageData.ts` | `PageData` type and context |
| `web/src/navigation.ts` | + `UrlContext` |
| `web/src/components/PageHead.tsx` | title, description, canonical, hreflang (collector on server, effect in browser) |
| `web/src/components/KommunePage.tsx` | the kommune page |
| `web/src/entry-server.tsx` | `render(url, data)` for the prerender |
| `web/src/main.tsx` | hydrate or create root |
| `web/scripts/export-data.mjs` | API → `public/data/*.json`, row floor, slug map |
| `web/scripts/slug.mjs` | `slugify`, `kommunerWithPages` |
| `web/scripts/prerender.mjs` | HTML per URL, JSON blocks, sitemap, robots, 404 |
| `web/public/_headers` | Cloudflare headers |
| `.github/workflows/deploy-web.yml` | data → build → deploy |

---

### Task 1: `servedMunicipalityIds` on the API DTO

**Files:**
- Modify: `api/Varde.Core/Dtos/ResourceDto.cs`
- Modify: `api/Varde.Core/Services/ResourceService.cs` (the `ToDto` method)
- Modify: `api/Varde.Data/Repositories/ResourceRepository.cs` (the `Include` chain near line 75)
- Modify: `web/src/types/api.ts`
- Test: `api/Varde.Tests/Integration/ResourcesApiTests.cs`

**Interfaces:**
- Produces: JSON field `servedMunicipalityIds: number[]` on every resource, sorted ascending, never containing the resource's own `municipalityId`. TypeScript mirror `servedMunicipalityIds: number[]` on `ResourceDto`.

- [ ] **Step 1: Write the failing API test**

Add to `ResourcesApiTests.cs`, next to the existing municipality tests. Use the same seeding helper those tests use to attach a served municipality (a `ResourceMunicipality { ResourceId, MunicipalityId }` row; check `api/Varde.Core/Models/ResourceMunicipality.cs` for the exact property names before writing).

```csharp
[Fact]
public async Task Get_exposes_served_municipality_ids_without_the_own_one()
{
    using var factory = new VardeApiFactory();
    // Resource 1 belongs to municipality 1 and additionally serves municipalities 2 and 3.
    SeedResourceServing(factory, resourceId: 1, ownMunicipalityId: 1, served: [3, 2, 1]);

    var result = await factory.CreateClient()
        .GetFromJsonAsync<PagedResult<ResourceDto>>("/api/resources?municipality=2");

    Assert.NotNull(result);
    var row = Assert.Single(result.Items, r => r.Id == 1);
    Assert.Equal([2, 3], row.ServedMunicipalityIds);
}
```

If no helper seeds served municipalities yet, write `SeedResourceServing` in the test class using the same `VardeDbContext` scope pattern as the existing `SeedDirectory` helper, adding `ResourceMunicipality` rows for each id in `served`.

- [ ] **Step 2: Run it to verify it fails**

Run (PowerShell): `Start-Service postgresql-x64-17; dotnet test api/Varde.slnx --filter Get_exposes_served_municipality_ids_without_the_own_one`
Expected: build error, `ResourceDto` has no `ServedMunicipalityIds`.

- [ ] **Step 3: Add the field, last in the record**

`ResourceDto.cs`: add a parameter after `Categories`:

```csharp
    IReadOnlyList<CategoryDto> Categories,
    IReadOnlyList<int> ServedMunicipalityIds);
```

Add to the XML doc: `/// <param name="ServedMunicipalityIds">Other municipalities this service covers, ascending. Never contains MunicipalityId.</param>`

`ResourceService.ToDto`: build the list and pass it last:

```csharp
    var served = resource.ServedMunicipalities
        .Select(rm => rm.MunicipalityId)
        .Where(id => id != resource.MunicipalityId)
        .Distinct()
        .OrderBy(id => id)
        .ToList();

    return new ResourceDto(
        // ...existing arguments unchanged...
        categories,
        served);
```

`ResourceRepository.cs`: in the query that loads rows for the DTO (the chain with `.Include(r => r.ResourceCategories).ThenInclude(rc => rc.Category)`), add `.Include(r => r.ServedMunicipalities)`. Do the same in the single-resource lookup used by `GET /api/resources/{id}` if it has its own chain.

- [ ] **Step 4: Run the whole API suite**

Run: `dotnet test api/Varde.slnx`
Expected: 86 passed (85 + 1). If `SchemaTests` asserts the DTO's property list, add `ServedMunicipalityIds` there.

- [ ] **Step 5: Mirror the field in TypeScript**

`web/src/types/api.ts`, inside `ResourceDto` after `categories`:

```ts
	categories: CategoryDto[]
	servedMunicipalityIds: number[]
```

Then in `web/`: `npx tsc --noEmit`. Fix every fixture object that now lacks the field by adding `servedMunicipalityIds: []` (tests build `ResourceDto` literals; grep `lastVerified:` under `web/tests` to find them all).

- [ ] **Step 6: Run web tests and commit**

Run: `cd web && npm test`
Expected: 151 passed.

```bash
git checkout -b feat/static-first
git add api web/src/types/api.ts web/tests
git commit -m "feat(api): expose servedMunicipalityIds on ResourceDto"
```

---

### Task 2: URL model with a language prefix

**Files:**
- Modify: `web/src/services/urlState.ts`
- Test: `web/tests/urlState.test.ts`

**Interfaces:**
- Produces:
  - `type Lang = "nb" | "en"` (moved here from `LanguageProvider.tsx`, which re-exports it so imports keep working)
  - `Route` gains `{ kind: "kommune"; slug: string }`
  - `parseUrl(pathname: string): { lang: Lang; route: Route }`
  - `langPrefix(lang: Lang): "" | "/en"`, `pathFor(lang: Lang, path: string): string`
  - `routePath(route: Route): string`
  - `switchLangPath(pathname: string, to: Lang): string`
  - `buildSearch(filters: Filters): string` (the `lang` parameter is removed)
  - `legacyRedirect(pathname: string, search: string, storedLang: string | null): string | null`

- [ ] **Step 1: Write the failing tests**

Append to `web/tests/urlState.test.ts`:

```ts
import {
	buildSearch,
	legacyRedirect,
	parseUrl,
	pathFor,
	routePath,
	switchLangPath,
} from "../src/services/urlState.ts"

describe("language prefix", () => {
	test("parseUrl strips /en and reports the language", () => {
		expect(parseUrl("/")).toEqual({ lang: "nb", route: { kind: "landing" } })
		expect(parseUrl("/en/")).toEqual({ lang: "en", route: { kind: "landing" } })
		expect(parseUrl("/en")).toEqual({ lang: "en", route: { kind: "landing" } })
		expect(parseUrl("/en/sok")).toEqual({ lang: "en", route: { kind: "list" } })
		expect(parseUrl("/en/resources/12")).toEqual({ lang: "en", route: { kind: "detail", id: 12 } })
		expect(parseUrl("/kommune/hamar")).toEqual({ lang: "nb", route: { kind: "kommune", slug: "hamar" } })
		expect(parseUrl("/english")).toEqual({ lang: "nb", route: { kind: "notFound" } })
	})

	test("pathFor and routePath round-trip", () => {
		expect(pathFor("en", "/")).toBe("/en/")
		expect(pathFor("nb", "/sok")).toBe("/sok")
		expect(routePath({ kind: "kommune", slug: "gjovik" })).toBe("/kommune/gjovik")
		expect(switchLangPath("/resources/5", "en")).toBe("/en/resources/5")
		expect(switchLangPath("/en/sok", "nb")).toBe("/sok")
	})

	test("buildSearch never emits lang", () => {
		const search = buildSearch({ search: "nav", categories: [], municipality: 3, national: false, page: 2 })
		expect(search).toBe("?search=nav&municipality=3&page=2")
	})
})

describe("legacyRedirect", () => {
	test("?lang=en becomes the prefixed path with the rest of the query kept", () => {
		expect(legacyRedirect("/", "?lang=en", null)).toBe("/en/")
		expect(legacyRedirect("/sok", "?lang=en&search=nav", null)).toBe("/en/sok?search=nav")
		expect(legacyRedirect("/resources/5", "?lang=en", null)).toBe("/en/resources/5")
		expect(legacyRedirect("/en/sok", "?lang=en", null)).toBe("/en/sok")
	})
	test("?lang=nb is stripped and never redirected by the stored preference", () => {
		expect(legacyRedirect("/", "?lang=nb", "en")).toBe("/")
		expect(legacyRedirect("/resources/5", "?lang=nb", "en")).toBe("/resources/5")
	})
	test("pre-landing bookmarks go to /sok", () => {
		expect(legacyRedirect("/", "?search=nav&lang=en", null)).toBe("/en/sok?search=nav")
		expect(legacyRedirect("/", "?category=rus", null)).toBe("/sok?category=rus")
	})
	test("stored English preference acts only on bare /", () => {
		expect(legacyRedirect("/", "", "en")).toBe("/en/")
		expect(legacyRedirect("/", "", "nb")).toBeNull()
		expect(legacyRedirect("/sok", "", "en")).toBeNull()
		expect(legacyRedirect("/en/", "", "en")).toBeNull()
	})
	test("nothing to do returns null", () => {
		expect(legacyRedirect("/sok", "?search=nav", null)).toBeNull()
	})
})
```

Existing `buildSearch(filters, lang)` calls in this test file drop their second argument.

- [ ] **Step 2: Run to verify failure**

Run: `cd web && npx vitest run tests/urlState.test.ts`
Expected: FAIL, `parseUrl` is not exported.

- [ ] **Step 3: Implement**

In `urlState.ts`:

```ts
export type Lang = "nb" | "en"

export type Route =
	| { kind: "landing" }
	| { kind: "list" }
	| { kind: "detail"; id: number }
	| { kind: "kommune"; slug: string }
	| { kind: "notFound" }

export function parseRoute(pathname: string): Route {
	if (pathname === "/") return { kind: "landing" }
	if (pathname === "/sok") return { kind: "list" }
	const detail = pathname.match(/^\/resources\/(\d+)$/)
	if (detail) return { kind: "detail", id: Number(detail[1]) }
	const kommune = pathname.match(/^\/kommune\/([a-z0-9-]+)$/)
	if (kommune) return { kind: "kommune", slug: kommune[1] }
	return { kind: "notFound" }
}

// The language lives in the path: /en/... is English, everything else Norwegian.
export function parseUrl(pathname: string): { lang: Lang; route: Route } {
	const en = pathname === "/en" || pathname.startsWith("/en/")
	const rest = en ? pathname.slice(3) || "/" : pathname
	return { lang: en ? "en" : "nb", route: parseRoute(rest) }
}

export function langPrefix(lang: Lang): "" | "/en" {
	return lang === "en" ? "/en" : ""
}

export function pathFor(lang: Lang, path: string): string {
	return `${langPrefix(lang)}${path}`
}

export function routePath(route: Route): string {
	switch (route.kind) {
		case "landing":
			return "/"
		case "list":
			return "/sok"
		case "detail":
			return `/resources/${route.id}`
		case "kommune":
			return `/kommune/${route.slug}`
		case "notFound":
			return "/404"
	}
}

export function switchLangPath(pathname: string, to: Lang): string {
	return pathFor(to, routePath(parseUrl(pathname).route))
}

// Mirrored in public/theme-init.js, which cannot import. tests/theme.test.ts runs both
// against the same cases. Returns the URL to location.replace() to, or null.
export function legacyRedirect(pathname: string, search: string, storedLang: string | null): string | null {
	const params = new URLSearchParams(search)
	const lang = params.get("lang")
	const legacyList = pathname === "/" && FILTER_PARAMS.some((name) => params.has(name))
	if (lang !== null) {
		params.delete("lang")
		let path = legacyList ? "/sok" : pathname
		if (lang === "en" && !(path === "/en" || path.startsWith("/en/"))) path = pathFor("en", path)
		const query = params.toString()
		return query ? `${path}?${query}` : path
	}
	if (legacyList) return `/sok${search}`
	if (pathname === "/" && search === "" && storedLang === "en") return "/en/"
	return null
}
```

Change `buildSearch` to `buildSearch(filters: Filters): string` and delete its `if (lang) params.set("lang", lang)` line. Fix the callers (`FilterBar`, `Pagination`, `LandingSearch`, `LanguageToggle` — grep `buildSearch(`) to drop the second argument; `LanguageToggle` is rewritten in Task 6, for now just drop the argument.

- [ ] **Step 4: Run the file, then the suite**

Run: `npx vitest run tests/urlState.test.ts` then `npm test`
Expected: PASS; suite 151 + new tests. `npx tsc --noEmit` clean.

- [ ] **Step 5: Commit**

```bash
git add web/src/services/urlState.ts web/tests/urlState.test.ts web/src
git commit -m "feat(web): language-prefixed URL model and legacy redirect rule"
```

---

### Task 3: Pre-paint redirects in `theme-init.js`

**Files:**
- Modify: `web/public/theme-init.js`
- Modify: `web/src/hooks/useUrlState.ts` (remove the `isLegacyListUrl` rewrite)
- Test: `web/tests/theme.test.ts`

**Interfaces:**
- Consumes: `legacyRedirect` (Task 2) as the reference implementation.
- Produces: the script reads `window.location.pathname`/`search`, `window.localStorage.getItem("varde.lang")`, and calls `window.location.replace(url)` when the rule returns a URL. The script only ever touches `window.*` and `document.documentElement` so a test can shadow `window`.

- [ ] **Step 1: Write the failing test**

Append to `tests/theme.test.ts`:

```ts
import { legacyRedirect } from "../src/services/urlState.ts"

test("the public init script redirects exactly like legacyRedirect", () => {
	const scriptPath = join(dirname(fileURLToPath(import.meta.url)), "../public/theme-init.js")
	const script = readFileSync(scriptPath, "utf8")
	const run = (pathname: string, search: string, storedLang: string | null) => {
		const store = new Map<string, string>([["theme", "light"]])
		if (storedLang) store.set("varde.lang", storedLang)
		const replace = vi.fn()
		const fakeWindow = {
			localStorage: { getItem: (k: string) => store.get(k) ?? null },
			matchMedia: () => ({ matches: false }),
			location: { pathname, search, replace },
		}
		new Function("window", "document", script)(fakeWindow, document)
		return replace.mock.calls.length ? replace.mock.calls[0][0] : null
	}
	const cases: [string, string, string | null][] = [
		["/", "?lang=en", null],
		["/sok", "?lang=en&search=nav", null],
		["/resources/5", "?lang=nb", "en"],
		["/", "?category=rus", null],
		["/", "", "en"],
		["/", "", null],
		["/en/", "", "en"],
		["/sok", "?search=nav", null],
	]
	for (const [pathname, search, stored] of cases) {
		expect(run(pathname, search, stored), `${pathname}${search} stored=${stored}`).toBe(
			legacyRedirect(pathname, search, stored)
		)
	}
})
```

Add `import { vi } from "vitest"` if the file does not import it yet.

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/theme.test.ts`
Expected: FAIL on the first case (no redirect happens).

- [ ] **Step 3: Extend the script**

Append inside `theme-init.js`, as a second IIFE after the theme one (keep the theme block untouched):

```js
// Legacy URLs and the remembered language, resolved before first paint so the HTML file that
// is served never has to be hydrated as a different page. Mirrors legacyRedirect() in
// src/services/urlState.ts; tests/theme.test.ts runs both against the same cases.
;(() => {
	var pathname = window.location.pathname
	var search = window.location.search
	var stored = null
	try {
		stored = window.localStorage.getItem("varde.lang")
	} catch (_) {
		stored = null
	}
	var params = new URLSearchParams(search)
	var filterNames = ["search", "category", "municipality", "national", "page"]
	var legacyList =
		pathname === "/" &&
		filterNames.some(function (name) {
			return params.has(name)
		})
	var isEn = function (p) {
		return p === "/en" || p.indexOf("/en/") === 0
	}
	var target = null
	var lang = params.get("lang")
	if (lang !== null) {
		params.delete("lang")
		var path = legacyList ? "/sok" : pathname
		if (lang === "en" && !isEn(path)) path = "/en" + path
		var query = params.toString()
		target = query ? path + "?" + query : path
	} else if (legacyList) {
		target = "/sok" + search
	} else if (pathname === "/" && search === "" && stored === "en") {
		target = "/en/"
	}
	if (target !== null) window.location.replace(target)
})()
```

- [ ] **Step 4: Remove the React-side rewrite**

In `useUrlState.ts` delete the `isLegacyListUrl` import and the `if (isLegacyListUrl(...)) { window.history.replaceState(...) }` block in `read()`. Delete `isLegacyListUrl` from `urlState.ts` and its test cases in `urlState.test.ts` and `useUrlState.test.tsx` (the rule now lives in `legacyRedirect`).

- [ ] **Step 5: Run the suite and commit**

Run: `npm test` — Expected: all green.

```bash
git add web/public/theme-init.js web/src web/tests
git commit -m "feat(web): resolve legacy URLs and the stored language before first paint"
```

---

### Task 4: In-memory query and the JSON data layer

**Files:**
- Create: `web/src/services/query.ts`, `web/src/services/data.ts`, `web/src/pageData.ts`
- Delete: `web/src/services/api.ts`, `web/src/services/catalogCache.ts`
- Modify: `web/src/hooks/useResources.ts`, `web/src/hooks/useCatalog.ts`, `web/src/components/ResourceDetail.tsx`, `web/src/components/LandingSearch.tsx`
- Create: `web/tests/query.test.ts`, `web/tests/data.test.ts`, `web/tests/stubData.ts`
- Delete: `web/tests/catalogCache.test.ts`; rewrite `web/tests/useCatalog.test.tsx` against `loadIndex`

**Interfaces:**
- Produces:
  - `query.ts`: `PAGE_SIZE = 20`, `matchesMunicipality(r: ResourceDto, id: number): boolean`, `matchesSearch(r: ResourceDto, term: string): boolean`, `compareResources(a: ResourceDto, b: ResourceDto): number`, `applyQuery(resources: ResourceDto[], filters: Filters): PagedResult<ResourceDto>`
  - `data.ts`: `type KommuneEntry = { id: number; slug: string; name: string; county: string }`, `type Index = { resources: ResourceDto[]; municipalities: MunicipalityDto[]; categories: CategoryDto[]; kommuner: KommuneEntry[] }`, `loadIndex(lang: Lang, fetchImpl?: typeof fetch): Promise<Index>`, `prefetchIndex(lang: Lang): void`, `clearIndexCache(): void`, `readPageData(): PageData | null`
  - `pageData.ts`: `type PageData = { resource?: ResourceDto; kommune?: { entry: KommuneEntry; local: ResourceDto[]; national: ResourceDto[] } }`, `PageDataContext`, `usePageData(): PageData`
  - `useResources(filters, lang)` keeps returning `{ state, retry }` with the same `ResourcesState`; `useCatalog(lang)` keeps `{ state, retry }` with `catalog: { municipalities, categories }`.
  - `tests/stubData.ts`: `stubDataFiles(fixture: Partial<Index>): void` — installs a `fetch` stub that answers `/data/resources.nb.json`, `/data/resources.en.json`, `/data/municipalities.json`, `/data/categories.nb.json`, `/data/categories.en.json`, `/data/kommuner.json` from the fixture and 404s anything else.

- [ ] **Step 1: Write the failing query tests**

`tests/query.test.ts`:

```ts
import { describe, expect, test } from "vitest"
import { applyQuery, compareResources, matchesMunicipality, matchesSearch, PAGE_SIZE } from "../src/services/query.ts"
import type { ResourceDto } from "../src/types/api.ts"

const row = (over: Partial<ResourceDto>): ResourceDto => ({
	id: 1, name: "NAV Hamar", description: "Økonomisk rådgivning", isFallbackTranslation: false,
	openingHours: null, isNational: false, isAlwaysOpen: false, municipalityId: 1,
	municipalityName: "Hamar", address: null, phone: null, email: null, website: null,
	chatUrl: null, lastVerified: "2026-08-17", categories: [], servedMunicipalityIds: [],
	...over,
})

describe("query mirrors ResourceRepository.SearchAsync", () => {
	test("municipality matches own or served", () => {
		expect(matchesMunicipality(row({ municipalityId: 1 }), 1)).toBe(true)
		expect(matchesMunicipality(row({ municipalityId: 9, servedMunicipalityIds: [1] }), 1)).toBe(true)
		expect(matchesMunicipality(row({ municipalityId: 9 }), 1)).toBe(false)
	})
	test("search is a trimmed case-insensitive substring on name or description, no folding", () => {
		expect(matchesSearch(row({}), "  hamar ")).toBe(true)
		expect(matchesSearch(row({}), "RÅDGIVNING")).toBe(true)
		expect(matchesSearch(row({}), "radgivning")).toBe(false)
	})
	test("order is local first, then name (nb collation), then id", () => {
		const rows = [
			row({ id: 3, name: "Ørn", isNational: true }),
			row({ id: 2, name: "Åsen" }),
			row({ id: 1, name: "Åsen" }),
			row({ id: 4, name: "Ask" }),
		]
		expect([...rows].sort(compareResources).map((r) => r.id)).toEqual([4, 1, 2, 3])
	})
	test("national wins over municipality, categories are any-of, pages are 20", () => {
		const rows = Array.from({ length: 25 }, (_, i) =>
			row({ id: i + 1, name: `R${String(i + 1).padStart(2, "0")}`, isNational: i % 5 === 0,
				categories: [{ id: 1, slug: i % 2 ? "rus" : "bolig", name: "", isFallbackTranslation: false }] }))
		const page2 = applyQuery(rows, { search: "", categories: [], municipality: null, national: false, page: 2 })
		expect(page2.pageSize).toBe(PAGE_SIZE)
		expect(page2.totalCount).toBe(25)
		expect(page2.items).toHaveLength(5)
		const national = applyQuery(rows, { search: "", categories: [], municipality: 1, national: true, page: 1 })
		expect(national.items.every((r) => r.isNational)).toBe(true)
		const rus = applyQuery(rows, { search: "", categories: ["rus", "nope"], municipality: null, national: false, page: 1 })
		expect(rus.totalCount).toBe(12)
	})
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/query.test.ts` — Expected: FAIL, module not found.

- [ ] **Step 3: Implement `query.ts`**

```ts
import type { Filters } from "./urlState.ts"
import type { PagedResult, ResourceDto } from "../types/api.ts"

// Mirrors api/Varde.Data/Repositories/ResourceRepository.cs SearchAsync exactly, so moving
// search into the browser changes no result. Keep the two in step.
export const PAGE_SIZE = 20

const collator = new Intl.Collator("nb")

export function matchesMunicipality(r: ResourceDto, id: number): boolean {
	return r.municipalityId === id || r.servedMunicipalityIds.includes(id)
}

export function matchesSearch(r: ResourceDto, term: string): boolean {
	const needle = term.trim().toLocaleLowerCase("nb")
	if (!needle) return true
	return (
		r.name.toLocaleLowerCase("nb").includes(needle) ||
		r.description.toLocaleLowerCase("nb").includes(needle)
	)
}

export function compareResources(a: ResourceDto, b: ResourceDto): number {
	if (a.isNational !== b.isNational) return a.isNational ? 1 : -1
	return collator.compare(a.name, b.name) || a.id - b.id
}

export function applyQuery(resources: ResourceDto[], filters: Filters): PagedResult<ResourceDto> {
	let rows = resources
	if (filters.national) rows = rows.filter((r) => r.isNational)
	else if (filters.municipality !== null) {
		const id = filters.municipality
		rows = rows.filter((r) => matchesMunicipality(r, id))
	}
	if (filters.categories.length > 0) {
		rows = rows.filter((r) => r.categories.some((c) => filters.categories.includes(c.slug)))
	}
	if (filters.search.trim()) rows = rows.filter((r) => matchesSearch(r, filters.search))
	const sorted = [...rows].sort(compareResources)
	const start = (filters.page - 1) * PAGE_SIZE
	return {
		items: sorted.slice(start, start + PAGE_SIZE),
		page: filters.page,
		pageSize: PAGE_SIZE,
		totalCount: sorted.length,
	}
}
```

Run: `npx vitest run tests/query.test.ts` — Expected: PASS.

- [ ] **Step 4: Write the failing data tests and the shared stub**

`tests/stubData.ts`:

```ts
import { vi } from "vitest"
import type { Index } from "../src/services/data.ts"

const empty: Index = { resources: [], municipalities: [], categories: [], kommuner: [] }

// One fetch stub for every test that needs data: answers the six JSON files the export
// script writes, 404s everything else. Replaces the per-test API stubs from the API era.
export function stubDataFiles(fixture: Partial<Index> = {}): void {
	const index = { ...empty, ...fixture }
	const files: Record<string, unknown> = {
		"/data/resources.nb.json": index.resources,
		"/data/resources.en.json": index.resources,
		"/data/municipalities.json": index.municipalities,
		"/data/categories.nb.json": index.categories,
		"/data/categories.en.json": index.categories,
		"/data/kommuner.json": index.kommuner,
	}
	vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
		const path = new URL(String(input), "http://localhost").pathname
		if (path in files) return new Response(JSON.stringify(files[path]), { status: 200 })
		return new Response("not found", { status: 404 })
	})
}
```

`tests/data.test.ts`:

```ts
import { afterEach, describe, expect, test, vi } from "vitest"
import { clearIndexCache, loadIndex, readPageData } from "../src/services/data.ts"
import { stubDataFiles } from "./stubData.ts"

afterEach(() => {
	clearIndexCache()
	vi.unstubAllGlobals()
	document.getElementById("varde-data")?.remove()
})

describe("loadIndex", () => {
	test("loads the four files for a language once and caches", async () => {
		stubDataFiles({ municipalities: [{ id: 1, name: "Hamar", county: "Innlandet" }] })
		const first = await loadIndex("nb")
		const second = await loadIndex("nb")
		expect(first.municipalities[0].name).toBe("Hamar")
		expect(second).toBe(first)
		expect((fetch as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(4)
	})
	test("any failed file rejects the whole load", async () => {
		vi.stubGlobal("fetch", async () => new Response("", { status: 500 }))
		await expect(loadIndex("en")).rejects.toThrow()
	})
})

describe("readPageData", () => {
	test("returns null without the block and parses it when present", () => {
		expect(readPageData()).toBeNull()
		const script = document.createElement("script")
		script.type = "application/json"
		script.id = "varde-data"
		script.textContent = JSON.stringify({ resource: { id: 7 } })
		document.body.append(script)
		expect(readPageData()?.resource?.id).toBe(7)
	})
})
```

Run: `npx vitest run tests/data.test.ts` — Expected: FAIL, module not found.

- [ ] **Step 5: Implement `pageData.ts` and `data.ts`**

`src/pageData.ts`:

```ts
import { createContext, useContext } from "react"
import type { KommuneEntry } from "./services/data.ts"
import type { ResourceDto } from "./types/api.ts"

// What the prerender baked into this page. The browser reads it from the #varde-data block
// (services/data.ts readPageData) so a direct load fetches nothing.
export type PageData = {
	resource?: ResourceDto
	kommune?: { entry: KommuneEntry; local: ResourceDto[]; national: ResourceDto[] }
}

export const PageDataContext = createContext<PageData>({})

export function usePageData(): PageData {
	return useContext(PageDataContext)
}
```

`src/services/data.ts`:

```ts
import type { PageData } from "../pageData.ts"
import type { CategoryDto, MunicipalityDto, ResourceDto } from "../types/api.ts"
import type { Lang } from "./urlState.ts"

export type KommuneEntry = { id: number; slug: string; name: string; county: string }
export type Index = {
	resources: ResourceDto[]
	municipalities: MunicipalityDto[]
	categories: CategoryDto[]
	kommuner: KommuneEntry[]
}

const cache = new Map<Lang, Promise<Index>>()

async function getJson<T>(path: string, fetchImpl: typeof fetch): Promise<T> {
	const response = await fetchImpl(path)
	if (!response.ok) throw new Error(`${response.status} for ${path}`)
	return (await response.json()) as T
}

// The six files scripts/export-data.mjs writes. All-or-nothing: a half index would render a
// results page that silently lacks a filter.
export function loadIndex(lang: Lang, fetchImpl: typeof fetch = fetch): Promise<Index> {
	let pending = cache.get(lang)
	if (!pending) {
		pending = Promise.all([
			getJson<ResourceDto[]>(`/data/resources.${lang}.json`, fetchImpl),
			getJson<MunicipalityDto[]>("/data/municipalities.json", fetchImpl),
			getJson<CategoryDto[]>(`/data/categories.${lang}.json`, fetchImpl),
			getJson<KommuneEntry[]>("/data/kommuner.json", fetchImpl),
		]).then(([resources, municipalities, categories, kommuner]) => ({
			resources,
			municipalities,
			categories,
			kommuner,
		}))
		pending.catch(() => cache.delete(lang))
		cache.set(lang, pending)
	}
	return pending
}

export function prefetchIndex(lang: Lang): void {
	loadIndex(lang).catch(() => {})
}

export function clearIndexCache(): void {
	cache.clear()
}

export function readPageData(): PageData | null {
	if (typeof document === "undefined") return null
	const block = document.getElementById("varde-data")
	if (!block?.textContent) return null
	return JSON.parse(block.textContent) as PageData
}
```

Run: `npx vitest run tests/data.test.ts` — Expected: PASS.

- [ ] **Step 6: Rewire the hooks and the two components**

`useResources.ts`: replace the fetch with the index and the pure query; drop the debounce parameter (nothing is rate-limited any more):

```ts
export function useResources(filters: Filters, lang: Lang) {
	const [state, setState] = useState<ResourcesState>({ kind: "loading" })
	const [attempt, setAttempt] = useState(0)
	useEffect(() => {
		let cancelled = false
		setState({ kind: "loading" })
		loadIndex(lang).then(
			(index) => {
				if (!cancelled) setState({ kind: "ready", data: applyQuery(index.resources, filters) })
			},
			() => {
				if (!cancelled) setState({ kind: "error" })
			}
		)
		return () => {
			cancelled = true
		}
	}, [filters, lang, attempt])
	return {
		state,
		retry: () => {
			clearIndexCache()
			setAttempt((n) => n + 1)
		},
	}
}
```

`useCatalog.ts`: same shape, `loadIndex(lang).then((index) => setState({ kind: "ready", catalog: { municipalities: index.municipalities, categories: index.categories } }))`; `retry` calls `clearIndexCache()`. Move the `Catalog` type here (delete `catalogCache.ts`).

`ResourceDetail.tsx`: initial state from the page block, otherwise the index:

```ts
const pageData = usePageData()
const [state, setState] = useState<DetailState>(() =>
	pageData.resource?.id === id ? { kind: "ready", resource: pageData.resource } : { kind: "loading" }
)
useEffect(() => {
	if (pageData.resource?.id === id) return
	let cancelled = false
	loadIndex(lang).then(
		(index) => {
			if (cancelled) return
			const found = index.resources.find((r) => r.id === id)
			setState(found ? { kind: "ready", resource: found } : { kind: "notFound" })
		},
		() => {
			if (!cancelled) setState({ kind: "error" })
		}
	)
	return () => {
		cancelled = true
	}
}, [id, lang, pageData])
```

Keep the component's existing state kinds; map "notFound" to `NotFoundState` as it does for a 404 today.

`LandingSearch.tsx`: `loadCatalog` → `loadIndex`, `prefetchCatalog` → `prefetchIndex`; build the `Catalog` for `suggest()` from the index.

Delete `services/api.ts`. Grep `services/api` and `catalogCache` — no importers may remain. `npx tsc --noEmit` clean.

- [ ] **Step 7: Move every test onto `stubDataFiles`**

Every test that stubbed `fetch` for `http://localhost:5005/api/...` (grep `stubResources`, `/api/resources`, `5005` under `web/tests`) now calls `stubDataFiles({ resources: [...], municipalities: [...], categories: [...] })` with the same fixture rows, plus `servedMunicipalityIds: []`. The API-era pagination fixtures become 25 plain rows and let `applyQuery` page them. `race.test.tsx` (out-of-order responses) becomes a test that a language switch during load does not apply stale data: stub, render at `/sok`, switch language before the promise resolves, assert the ready state is the new language's. Delete `catalogCache.test.ts`; rewrite `useCatalog.test.tsx` to assert the hook derives `municipalities`/`categories` from `loadIndex` and that `retry` refetches (fetch call count grows).

Run: `npm test` — Expected: all green, count ≥ 151 + 7.

- [ ] **Step 8: Commit**

```bash
git add web
git commit -m "feat(web): search in the browser over exported JSON"
```

---

### Task 5: Export script with row floor and slug map

**Files:**
- Create: `web/scripts/slug.mjs`, `web/scripts/export-data.mjs`
- Modify: `web/package.json` (`data` script), `web/.gitignore`, `web/biome.json`
- Test: `web/tests/slug.test.ts`, `web/tests/exportData.test.ts`

**Interfaces:**
- Produces:
  - `slug.mjs`: `slugify(name: string): string`; `kommunerWithPages(municipalities, resources): KommuneEntry[]` (id order, collision suffix `-{id}`, only kommuner matched by ≥ 1 resource through `matchesMunicipality` semantics)
  - `export-data.mjs`: `MIN_RESOURCES = 90`; `exportData({ baseUrl, outDir, fetchImpl, log })` returning `{ resources: { nb: number; en: number }, kommuner: number }`; CLI `node scripts/export-data.mjs [baseUrl]`
  - Files written: `resources.nb.json`, `resources.en.json`, `municipalities.json`, `categories.nb.json`, `categories.en.json`, `kommuner.json`

- [ ] **Step 1: Write the failing slug tests**

`tests/slug.test.ts`:

```ts
import { expect, test } from "vitest"
import { kommunerWithPages, slugify } from "../scripts/slug.mjs"

test("slugify folds æøå and collapses punctuation", () => {
	expect(slugify("Gjøvik")).toBe("gjoevik")
	expect(slugify("Våler")).toBe("vaaler")
	expect(slugify("Nord-Fron")).toBe("nord-fron")
	expect(slugify("Sør-Odal kommune")).toBe("soer-odal-kommune")
	expect(slugify("Øyer")).toBe("oeyer")
	expect(slugify("Ålesund")).toBe("aalesund")
	expect(slugify("Åmot")).toBe("aamot")
})

test("only kommuner with an own or served resource get a page, in id order, collisions suffixed", () => {
	const municipalities = [
		{ id: 3, name: "Våler", county: "Innlandet" },
		{ id: 1, name: "Hamar", county: "Innlandet" },
		{ id: 2, name: "Våler", county: "Østfold" },
		{ id: 4, name: "Tom", county: "Innlandet" },
	]
	const resources = [
		{ id: 10, municipalityId: 1, servedMunicipalityIds: [3] },
		{ id: 11, municipalityId: null, servedMunicipalityIds: [2] },
	]
	expect(kommunerWithPages(municipalities, resources)).toEqual([
		{ id: 1, slug: "hamar", name: "Hamar", county: "Innlandet" },
		{ id: 2, slug: "vaaler", name: "Våler", county: "Østfold" },
		{ id: 3, slug: "vaaler-3", name: "Våler", county: "Innlandet" },
	])
})
```

Run: `npx vitest run tests/slug.test.ts` — Expected: FAIL, module not found.

- [ ] **Step 2: Implement `slug.mjs`**

```js
// Plain JavaScript so both scripts (export, prerender) and Vitest can import it without a
// build. The browser never slugifies: it reads kommuner.json.

export function slugify(name) {
	return name
		.toLowerCase()
		.replace(/æ/g, "ae")
		.replace(/ø/g, "oe")
		.replace(/å/g, "aa")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
}

export function kommunerWithPages(municipalities, resources) {
	const covered = new Set()
	for (const r of resources) {
		if (r.municipalityId !== null) covered.add(r.municipalityId)
		for (const id of r.servedMunicipalityIds) covered.add(id)
	}
	const taken = new Set()
	const out = []
	for (const m of [...municipalities].sort((a, b) => a.id - b.id)) {
		if (!covered.has(m.id)) continue
		let slug = slugify(m.name)
		if (taken.has(slug)) slug = `${slug}-${m.id}`
		taken.add(slug)
		out.push({ id: m.id, slug, name: m.name, county: m.county })
	}
	return out
}
```

Run: `npx vitest run tests/slug.test.ts` — Expected: PASS.

- [ ] **Step 3: Write the failing export test**

`tests/exportData.test.ts`:

```ts
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, expect, test, vi } from "vitest"
import { exportData, MIN_RESOURCES } from "../scripts/export-data.mjs"

const dirs: string[] = []
afterEach(() => {
	for (const d of dirs) rmSync(d, { recursive: true, force: true })
})

function fakeApi(total: number) {
	const rows = Array.from({ length: total }, (_, i) => ({
		id: i + 1, name: `R${i + 1}`, municipalityId: (i % 3) + 1, servedMunicipalityIds: [],
	}))
	return vi.fn(async (input: string) => {
		const url = new URL(input, "http://api")
		if (url.pathname === "/api/municipalities")
			return Response.json([{ id: 1, name: "Hamar", county: "Innlandet" }, { id: 2, name: "Gjøvik", county: "Innlandet" }, { id: 3, name: "Oslo", county: "Oslo" }, { id: 4, name: "Tom", county: "Innlandet" }])
		if (url.pathname === "/api/categories") return Response.json([{ id: 1, slug: "rus", name: "Rus" }])
		if (url.pathname === "/api/resources") {
			const page = Number(url.searchParams.get("page") ?? "1")
			const size = Number(url.searchParams.get("pageSize"))
			expect(size).toBe(100)
			const items = rows.slice((page - 1) * size, page * size)
			return Response.json({ items, page, pageSize: size, totalCount: total })
		}
		return new Response("nope", { status: 404 })
	})
}

test("walks every page, writes six files and the slug map", async () => {
	const outDir = mkdtempSync(join(tmpdir(), "varde-export-"))
	dirs.push(outDir)
	const log = vi.fn()
	const result = await exportData({ baseUrl: "http://api", outDir, fetchImpl: fakeApi(150) as unknown as typeof fetch, log })
	expect(result).toEqual({ resources: { nb: 150, en: 150 }, kommuner: 3 })
	expect(JSON.parse(readFileSync(join(outDir, "resources.nb.json"), "utf8"))).toHaveLength(150)
	expect(JSON.parse(readFileSync(join(outDir, "kommuner.json"), "utf8")).map((k: { slug: string }) => k.slug)).toEqual(["hamar", "gjoevik", "oslo"])
	for (const name of ["resources.en.json", "municipalities.json", "categories.nb.json", "categories.en.json"])
		expect(() => readFileSync(join(outDir, name))).not.toThrow()
	// Counts only, never row contents: the Actions log is public.
	expect(log.mock.calls.flat().join(" ")).not.toContain("R1")
})

test("refuses to write below the row floor", async () => {
	const outDir = mkdtempSync(join(tmpdir(), "varde-export-"))
	dirs.push(outDir)
	await expect(
		exportData({ baseUrl: "http://api", outDir, fetchImpl: fakeApi(MIN_RESOURCES - 1) as unknown as typeof fetch, log: () => {} })
	).rejects.toThrow(/row floor/)
	expect(() => readFileSync(join(outDir, "resources.nb.json"))).toThrow()
})
```

Run: `npx vitest run tests/exportData.test.ts` — Expected: FAIL, module not found.

- [ ] **Step 4: Implement `export-data.mjs`**

```js
#!/usr/bin/env node
// Pulls everything the site needs out of the API once, at build time, into public/data/.
// The API only ever runs inside the deploy workflow (or on my machine for `npm run data`).
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { kommunerWithPages } from "./slug.mjs"

// If the export sees fewer rows than this, the API is half-broken and the build must fail
// rather than publish an empty site. The live seed has 94 rows; lower this deliberately.
export const MIN_RESOURCES = 90
const LANGS = ["nb", "en"]
const PAGE_SIZE = 100

async function getJson(fetchImpl, url) {
	const response = await fetchImpl(url)
	if (!response.ok) throw new Error(`${response.status} for ${url}`)
	return response.json()
}

async function allResources(fetchImpl, baseUrl, lang) {
	const rows = []
	for (let page = 1; ; page++) {
		const result = await getJson(fetchImpl, `${baseUrl}/api/resources?lang=${lang}&pageSize=${PAGE_SIZE}&page=${page}`)
		rows.push(...result.items)
		if (rows.length >= result.totalCount || result.items.length === 0) return rows
	}
}

export async function exportData({ baseUrl, outDir, fetchImpl = fetch, log = console.log }) {
	const resources = {}
	for (const lang of LANGS) {
		resources[lang] = await allResources(fetchImpl, baseUrl, lang)
		if (resources[lang].length < MIN_RESOURCES) {
			throw new Error(`row floor: ${resources[lang].length} ${lang} resources, need ${MIN_RESOURCES}`)
		}
	}
	const municipalities = await getJson(fetchImpl, `${baseUrl}/api/municipalities`)
	const categories = {}
	for (const lang of LANGS) categories[lang] = await getJson(fetchImpl, `${baseUrl}/api/categories?lang=${lang}`)
	const kommuner = kommunerWithPages(municipalities, resources.nb)

	mkdirSync(outDir, { recursive: true })
	const write = (name, data) => {
		writeFileSync(join(outDir, name), JSON.stringify(data))
		log(`wrote ${name}`)
	}
	for (const lang of LANGS) write(`resources.${lang}.json`, resources[lang])
	write("municipalities.json", municipalities)
	for (const lang of LANGS) write(`categories.${lang}.json`, categories[lang])
	write("kommuner.json", kommuner)

	const summary = { resources: { nb: resources.nb.length, en: resources.en.length }, kommuner: kommuner.length }
	log(`resources nb=${summary.resources.nb} en=${summary.resources.en}, kommuner=${summary.kommuner}`)
	return summary
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const baseUrl = process.argv[2] ?? "http://localhost:5005"
	const outDir = join(fileURLToPath(new URL("../public/data/", import.meta.url)))
	exportData({ baseUrl, outDir }).catch((error) => {
		console.error(error.message)
		process.exit(1)
	})
}
```

Run: `npx vitest run tests/exportData.test.ts` — Expected: PASS.

- [ ] **Step 5: Wire the script, ignore the output**

`package.json` scripts: add `"data": "node scripts/export-data.mjs"`.
`web/.gitignore`: add under `# Build`:

```
public/data/
dist-server/
```

`biome.json` includes: `["**", "!dist", "!dist-server", "!public/data", "!node_modules", "!**/*.min.js"]`.

Run once for real: start the API (`dotnet run --project api/Varde.Api` in another terminal, PostgreSQL running) then `npm run data`. Expected: six files in `web/public/data/`, log shows `resources nb=94 en=94` (or the current count). `git status` shows nothing under `public/data`.

- [ ] **Step 6: Commit**

```bash
git add web/scripts web/tests/slug.test.ts web/tests/exportData.test.ts web/package.json web/.gitignore web/biome.json
git commit -m "feat(web): export API data to JSON with a row floor and kommune slugs"
```

---

### Task 6: Language comes from the route

**Files:**
- Modify: `web/src/i18n/LanguageProvider.tsx`, `web/src/hooks/useUrlState.ts`, `web/src/App.tsx`, `web/src/components/Link.tsx`, `web/src/components/LanguageToggle.tsx`
- Test: `web/tests/i18n.test.tsx`, `web/tests/shell.test.tsx`, `web/tests/link.test.tsx`, `web/tests/useUrlState.test.tsx`

**Interfaces:**
- Produces:
  - `LanguageProvider({ lang, children })` — no `initialLang`, no storage read; `useLanguage(): { lang }`; `translate`, `useTranslation` unchanged; `export type { Lang }` re-exported from `urlState.ts`
  - `useUrlState()` returns `{ lang, route, filters, arrival, navigate }`; `navigate(path, search, options?)` takes an UNPREFIXED app path and prefixes it with the current language
  - `Link({ to, lang?, className, children, onNavigate? })` — `to` is unprefixed; `lang` overrides the prefix and sets `hrefLang`/`lang` attributes
  - `LanguageToggle` renders `<Link lang={next} to={currentPath + searchWithoutPage} onNavigate={announce + store}>`; `localStorage["varde.lang"]` is written only there

- [ ] **Step 1: Write the failing tests**

In `shell.test.tsx`, replace the `/?lang=en` cases:

```ts
test("the language is read from the path prefix", () => {
	stubDataFiles()
	window.history.pushState(null, "", "/en/")
	render(<App />)
	expect(screen.getByRole("link", { name: "Norsk" })).toHaveAttribute("href", "/")
	expect(document.documentElement.lang).toBe("en")
})

test("the toggle links to the same page in the other language, dropping page, and remembers the choice", async () => {
	stubDataFiles()
	window.history.pushState(null, "", "/sok?search=nav&page=2")
	render(<App />)
	const toggle = screen.getByRole("link", { name: "English" })
	expect(toggle).toHaveAttribute("href", "/en/sok?search=nav")
	expect(toggle).toHaveAttribute("hreflang", "en")
	expect(toggle).toHaveAttribute("lang", "en")
	await userEvent.click(toggle)
	expect(window.location.pathname).toBe("/en/sok")
	expect(localStorage.getItem("varde.lang")).toBe("en")
	expect(screen.getByRole("link", { name: "Norsk" })).toBeInTheDocument()
})

test("browser back across a language change updates the UI language", () => {
	stubDataFiles()
	window.history.pushState(null, "", "/en/")
	render(<App />)
	act(() => {
		window.history.pushState(null, "", "/")
		window.dispatchEvent(new PopStateEvent("popstate"))
	})
	expect(screen.getByRole("link", { name: "English" })).toBeInTheDocument()
})
```

In `link.test.tsx` add: rendered inside an English provider, `<Link to="/sok">` has `href="/en/sok"`; `<Link to="/sok" lang="nb">` has `href="/sok"` and `hreflang="nb"`.

In `i18n.test.tsx`, any test that relied on `localStorage` choosing the language on load becomes: stored `en` + load `/` renders Norwegian (the redirect is the pre-paint script's job, Task 3).

Run: `npx vitest run tests/shell.test.tsx tests/link.test.tsx tests/i18n.test.tsx` — Expected: FAIL.

- [ ] **Step 2: Implement**

`LanguageProvider.tsx`:

```tsx
import { createContext, type ReactNode, useContext, useEffect } from "react"
import { I18nProvider } from "react-aria-components"
import type { Lang } from "../services/urlState.ts"
import en from "./en.json"
import nb from "./nb.json"

export type { Lang }
export const LANG_STORAGE_KEY = "varde.lang"
const strings: Record<Lang, Record<string, string>> = { nb, en }

const LanguageContext = createContext<{ lang: Lang } | null>(null)

// The URL is the only source of the language (spec: URL and language model). Storage is
// written by the toggle alone and read by public/theme-init.js alone, before first paint.
export function LanguageProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
	useEffect(() => {
		document.documentElement.lang = lang
	}, [lang])
	return (
		<LanguageContext.Provider value={{ lang }}>
			<I18nProvider locale={lang}>{children}</I18nProvider>
		</LanguageContext.Provider>
	)
}
```

Keep `useLanguage`, `translate`, `useTranslation` as they are (minus `setLang`). Delete `resolveLang`.

`useUrlState.ts` — `read()` returns `{ ...parseUrl(pathname), filters: parseFilters(params) }`; `navigate` prefixes:

```ts
const navigate = useCallback(
	(path: string, search: string, options?: { replace?: boolean }) => {
		const { lang: current } = parseUrl(window.location.pathname)
		const target = `${pathFor(current, path)}${search}`
		const leavingResults = parseUrl(window.location.pathname).route.kind === "list" && path !== "/sok"
		const historyState = leavingResults ? { from: "sok" } : null
		if (options?.replace) window.history.replaceState(historyState, "", target)
		else window.history.pushState(historyState, "", target)
		sync()
	},
	[sync]
)
```

`sameRoute` compares kommune slugs as well as detail ids.

`App.tsx`: `const { lang, route, filters, arrival, navigate } = useUrlState()` and `<LanguageProvider lang={lang}>`.

`Link.tsx`:

```tsx
export function Link({ to, lang, className, children, onNavigate }: {
	to: string
	lang?: Lang
	className?: string
	children: ReactNode
	onNavigate?: () => void
}) {
	const navigate = useNavigate()
	const { lang: current } = useLanguage()
	const target = lang ?? current
	const href = pathFor(target, to)
	const onClick = (event: MouseEvent) => {
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
		event.preventDefault()
		onNavigate?.()
		const url = new URL(to, window.location.origin)
		navigate(url.pathname, url.search, { lang: target })
	}
	return (
		<a href={href} className={className} hrefLang={lang} lang={lang} onClick={onClick}>
			{children}
		</a>
	)
}
```

`navigate` therefore takes a third option, `lang`, which overrides the prefix; without it the current language is used. Update the context type in `navigation.ts`:

```ts
export type NavigateOptions = { replace?: boolean; lang?: Lang }
export const NavigationContext = createContext<
	(pathname: string, search: string, options?: NavigateOptions) => void
>(() => {})
```

and in `useUrlState.navigate` compute `const target = `${pathFor(options?.lang ?? current, path)}${search}``.

`LanguageToggle.tsx`:

```tsx
export function LanguageToggle() {
	const { lang } = useLanguage()
	const announce = useAnnounce()
	const next: Lang = lang === "nb" ? "en" : "nb"
	const params = new URLSearchParams(window.location.search)
	params.delete("page")
	const query = params.toString()
	const to = `${routePath(parseUrl(window.location.pathname).route)}${query ? `?${query}` : ""}`
	const remember = () => {
		try {
			localStorage.setItem(LANG_STORAGE_KEY, next)
		} catch {}
		announce(translate(next, "status.langChanged"))
	}
	return (
		<Link to={to} lang={next} className="btn-secondary min-w-11" onNavigate={remember}>
			{lang === "nb" ? "English" : "Norsk"}
		</Link>
	)
}
```

`window.location` inside render is a browser global and would break the server render in Task 10, so the toggle reads the URL through a context instead. Add to `navigation.ts`:

```ts
export const UrlContext = createContext<{ pathname: string; search: string } | null>(null)
export function useCurrentUrl(): { pathname: string; search: string } {
	const fromContext = useContext(UrlContext)
	if (fromContext) return fromContext
	return { pathname: window.location.pathname, search: window.location.search }
}
```

and use `useCurrentUrl()` in the toggle instead of `window.location`. `useUrlState` reads its initial state through `useCurrentUrl()` too.

- [ ] **Step 3: Run the suite, fix stragglers**

Run: `npm test` and `npx tsc --noEmit`. Any component that called `setLang` or `useLanguage().setLang` no longer compiles; only the toggle did. Any test asserting `getByRole("button", { name: "English" })` becomes `link`.

Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add web
git commit -m "feat(web): language from the URL prefix, toggle as a link"
```

---

### Task 7: `PageHead` replaces `useDocumentTitle`

**Files:**
- Create: `web/src/components/PageHead.tsx`, `web/src/services/site.ts`
- Delete: `web/src/hooks/useDocumentTitle.ts`
- Modify: `LandingPage.tsx`, `ListPage.tsx`, `ResourceDetail.tsx`, `NotFoundState.tsx`, `web/index.html`
- Test: `web/tests/pageHead.test.tsx`

**Interfaces:**
- Produces:
  - `site.ts`: `SITE_ORIGIN = import.meta.env.VITE_SITE_ORIGIN ?? "http://localhost:5173"`; `metaDescription(text: string): string` (155-char rule)
  - `HeadContext` (server collector): `createContext<{ set(entry: HeadEntry): void } | null>(null)`, `type HeadEntry = { title: string; description: string; path: string; lang: Lang }`
  - `PageHead({ title, description, path })` — `path` is the UNPREFIXED route path

- [ ] **Step 1: Write the failing tests**

`tests/pageHead.test.tsx`:

```tsx
import { render } from "@testing-library/react"
import { afterEach, expect, test } from "vitest"
import { HeadContext, type HeadEntry, PageHead } from "../src/components/PageHead.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import { metaDescription } from "../src/services/site.ts"

afterEach(() => {
	document.head.querySelectorAll("[data-page-head]").forEach((el) => el.remove())
	document.title = ""
})

test("in the browser it writes title, description, canonical and hreflang into the head", () => {
	render(
		<LanguageProvider lang="en">
			<PageHead title="NAV Hamar – Varde" description="Økonomisk rådgivning" path="/resources/12" />
		</LanguageProvider>
	)
	expect(document.title).toBe("NAV Hamar – Varde")
	expect(document.head.querySelector('meta[name="description"]')?.getAttribute("content")).toBe("Økonomisk rådgivning")
	expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("http://localhost:5173/en/resources/12")
	const alternates = [...document.head.querySelectorAll('link[rel="alternate"]')].map((l) => [l.getAttribute("hreflang"), l.getAttribute("href")])
	expect(alternates).toEqual([
		["nb", "http://localhost:5173/resources/12"],
		["en", "http://localhost:5173/en/resources/12"],
		["x-default", "http://localhost:5173/resources/12"],
	])
})

test("under a collector it reports instead of touching the document", () => {
	const seen: HeadEntry[] = []
	render(
		<HeadContext.Provider value={{ set: (e) => seen.push(e) }}>
			<LanguageProvider lang="nb">
				<PageHead title="Søk – Varde" description="d" path="/sok" />
			</LanguageProvider>
		</HeadContext.Provider>
	)
	expect(seen).toEqual([{ title: "Søk – Varde", description: "d", path: "/sok", lang: "nb" }])
	expect(document.title).toBe("")
})

test("metaDescription cuts at the last space before 155 characters", () => {
	const long = `${"ord ".repeat(60)}slutt`
	const cut = metaDescription(long)
	expect(cut.length).toBeLessThanOrEqual(156)
	expect(cut.endsWith("…")).toBe(true)
	expect(cut.at(-2)).not.toBe(" ")
	expect(metaDescription("kort")).toBe("kort")
})
```

Run: `npx vitest run tests/pageHead.test.tsx` — Expected: FAIL.

- [ ] **Step 2: Implement**

`services/site.ts`:

```ts
// The public origin, set by the deploy workflow (SITE_ORIGIN variable). Only absolute URLs
// (canonical, hreflang, sitemap) use it; every link in the app stays relative.
export const SITE_ORIGIN: string = import.meta.env.VITE_SITE_ORIGIN ?? "http://localhost:5173"

export function metaDescription(text: string): string {
	if (text.length <= 155) return text
	const head = text.slice(0, 155)
	const cut = head.lastIndexOf(" ")
	return `${(cut > 0 ? head.slice(0, cut) : head).trimEnd()}…`
}
```

`components/PageHead.tsx`:

```tsx
import { createContext, useContext, useEffect } from "react"
import { useLanguage } from "../i18n/LanguageProvider.tsx"
import { SITE_ORIGIN } from "../services/site.ts"
import { type Lang, pathFor } from "../services/urlState.ts"

export type HeadEntry = { title: string; description: string; path: string; lang: Lang }

// Server side the prerender collects the entry and writes the tags itself; in the browser an
// effect writes them, so <head> never takes part in hydration (spec: Head per page).
export const HeadContext = createContext<{ set(entry: HeadEntry): void } | null>(null)

function upsert(selector: string, create: () => HTMLElement, apply: (el: HTMLElement) => void) {
	let el = document.head.querySelector<HTMLElement>(selector)
	if (!el) {
		el = create()
		el.dataset.pageHead = ""
		document.head.append(el)
	}
	apply(el)
}

export function PageHead({ title, description, path }: { title: string; description: string; path: string }) {
	const { lang } = useLanguage()
	const collector = useContext(HeadContext)
	collector?.set({ title, description, path, lang })
	useEffect(() => {
		if (collector) return
		document.title = title
		upsert('meta[name="description"]', () => document.createElement("meta"), (el) => {
			el.setAttribute("name", "description")
			el.setAttribute("content", description)
		})
		upsert('link[rel="canonical"]', () => document.createElement("link"), (el) => {
			el.setAttribute("rel", "canonical")
			el.setAttribute("href", `${SITE_ORIGIN}${pathFor(lang, path)}`)
		})
		const alternates: [string, Lang][] = [["nb", "nb"], ["en", "en"], ["x-default", "nb"]]
		for (const [hreflang, target] of alternates) {
			upsert(`link[rel="alternate"][hreflang="${hreflang}"]`, () => document.createElement("link"), (el) => {
				el.setAttribute("rel", "alternate")
				el.setAttribute("hreflang", hreflang)
				el.setAttribute("href", `${SITE_ORIGIN}${pathFor(target, path)}`)
			})
		}
	}, [collector, title, description, path, lang])
	return null
}
```

Use it in the four pages with the spec's exact titles (nb / en): landing `Varde – finn riktig hjelpetjeneste` / `Varde – find the right help service`, description = the i18n `landing.subtitle` string; list `Søk – Varde` / `Search – Varde`, description = the current meta description text moved from `index.html` (nb) and its English twin `Varde – find the right help service where you live. Public directory of social services in Norway.`; detail `{name} – Varde`, `metaDescription(resource.description)`; not found `Fant ikke siden – Varde` / `Page not found – Varde`, path `/404`. Put the title strings in a `titles` map inside each page: `{ nb: "...", en: "..." }[lang]`.

`index.html`: remove `<title>Varde</title>` and the `<meta name="description">` (React writes both); add the three placeholder comments — `<!--app-head-->` at the end of `<head>`, `<!--app-data-->` right before the module script, and put `<!--app-html-->` inside `<div id="root"></div>` so the line reads `<div id="root"><!--app-html--></div>`.

Delete `useDocumentTitle.ts` and its imports.

- [ ] **Step 3: Run everything, commit**

Run: `npm test` — Expected: green; any old `document.title` assertions still hold.

```bash
git add web
git commit -m "feat(web): PageHead with canonical and hreflang per page"
```

---

### Task 8: Hydration-safe banner, quick exit and the report link

**Files:**
- Modify: `web/src/components/HandoverBanner.tsx`, `web/src/components/QuickExit.tsx`, `web/src/components/ResourceDetail.tsx`, `web/src/services/contactActions.ts`, `web/src/i18n/nb.json`, `web/src/i18n/en.json`
- Test: `web/tests/banner.test.tsx`, `web/tests/shell.test.tsx`, `web/tests/contactActions.test.ts`, `web/tests/detail.test.tsx`

**Interfaces:**
- Produces: `REPORT_ADDRESS = "varde.implicate775@passmail.com"`, `reportHref(id: number, name: string): string`; i18n key `report.link` = `Meld feil i oppføringen` / `Report an error in this listing`.

- [ ] **Step 1: Write the failing tests**

`banner.test.tsx`, add:

```tsx
test("first render is the neutral legevakt line; the fastlege paragraph arrives in an effect", () => {
	vi.useFakeTimers()
	vi.setSystemTime(new Date("2026-09-15T10:00:00"))
	const { container } = render(<Wrapped><HandoverBanner /></Wrapped>)
	// Synchronous first paint: what the prerender emits at any hour.
	expect(container.querySelectorAll("p")).toHaveLength(1)
	expect(screen.getByRole("link", { name: /116 117/ })).toBeInTheDocument()
	act(() => {})
	expect(container.querySelectorAll("p")).toHaveLength(2)
	vi.useRealTimers()
})
```

(`Wrapped` = the same `LanguageProvider lang="nb"` wrapper the file already uses; the fastlege variant is active at 10:00 on a weekday per `hoursRule.ts` — check the rule and pick a time it returns `"fastlege"` for.)

`shell.test.tsx`: `expect(screen.getByRole("link", { name: "Forlat siden" })).toHaveAttribute("href", "https://www.google.com")`.

`contactActions.test.ts`:

```ts
test("reportHref is a mailto to the role alias with an encoded subject", () => {
	expect(reportHref(12, "NAV Hamar & co")).toBe(
		"mailto:varde.implicate775@passmail.com?subject=Varde%20%2312%3A%20NAV%20Hamar%20%26%20co"
	)
})
```

`detail.test.tsx`: the rendered detail has `getByRole("link", { name: "Meld feil i oppføringen" })` with the `mailto:` href.

Run those four files — Expected: FAIL.

- [ ] **Step 2: Implement**

`HandoverBanner.tsx`:

```tsx
const [variant, setVariant] = useState<HandoverVariant | null>(null)
useEffect(() => {
	const update = () => {
		if (!document.hidden) setVariant(handoverVariant(new Date()))
	}
	update()
	document.addEventListener("visibilitychange", update)
	return () => document.removeEventListener("visibilitychange", update)
}, [])
```

Render: the fastlege paragraph only when `variant === "fastlege"`; the legevakt link text is `${t("banner.legevakt")} ${LEGEVAKT_PHONE}` when `variant !== "fastlege"` (null included), `t("banner.fallback")` when fastlege.

`QuickExit.tsx`:

```tsx
<a
	href="https://www.google.com"
	className="btn-secondary"
	onClick={(event) => {
		event.preventDefault()
		window.location.replace("https://www.google.com")
	}}
>
	{t("app.quickExit")}
</a>
```

`contactActions.ts`:

```ts
// One forwarding alias I can switch off if it attracts spam (spec: Report a wrong number).
export const REPORT_ADDRESS = "varde.implicate775@passmail.com"

export function reportHref(id: number, name: string): string {
	return `mailto:${REPORT_ADDRESS}?subject=${encodeURIComponent(`Varde #${id}: ${name}`)}`
}
```

`ResourceDetail.tsx`: below the contact actions, `<a href={reportHref(resource.id, resource.name)} className="link-muted">{t("report.link")}</a>` (use whatever muted link class the detail page already uses for its secondary links).

i18n: add `"report.link"` to both files.

- [ ] **Step 3: Run the suite, commit**

Run: `npm test` — Expected: green.

```bash
git add web
git commit -m "feat(web): hydration-safe banner and quick exit, report-a-wrong-number link"
```

---

### Task 9: Kommune page

**Files:**
- Create: `web/src/components/KommunePage.tsx`
- Modify: `web/src/App.tsx`, `web/src/components/ResourceCard.tsx`, `web/src/components/ListPage.tsx`, `web/src/components/LandingSearch.tsx` (municipality suggestions), `web/src/i18n/nb.json`, `web/src/i18n/en.json`
- Test: `web/tests/kommune.test.tsx`, `web/tests/axe.test.tsx`

**Interfaces:**
- Consumes: `usePageData().kommune`, `loadIndex`, `matchesMunicipality`, `compareResources`, `PageHead`, `ResourceCard`.
- Produces: `KommunePage({ slug, arrival })`; `ResourceCard({ resource, kommuneSlug? })` links the municipality name to `/kommune/{slug}` when given; i18n keys `kommune.title` (`Hjelpetjenester i {name}` / `Help services in {name}`), `kommune.description` (`{n} hjelpetjenester i {name}, fylke {county}, med telefonnummer og åpningstider` / `{n} help services in {name}, {county} county, with phone numbers and opening hours`), `kommune.local` (`Tjenester i {name}` / `Services in {name}`), `kommune.national` (`Nasjonale tjenester` / `National services`), `kommune.refine` (`Søk og filtrer i {name}` / `Search and filter in {name}`).

- [ ] **Step 1: Write the failing tests**

`tests/kommune.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"
import { clearIndexCache } from "../src/services/data.ts"
import { stubDataFiles } from "./stubData.ts"

const hamar = { id: 1, slug: "hamar", name: "Hamar", county: "Innlandet" }
const rows = [
	{ id: 1, name: "NAV Hamar", municipalityId: 1, servedMunicipalityIds: [], isNational: false },
	{ id: 2, name: "Krisesenteret", municipalityId: 9, servedMunicipalityIds: [1], isNational: false },
	{ id: 3, name: "Mental Helse", municipalityId: null, servedMunicipalityIds: [], isNational: true },
	{ id: 4, name: "NAV Elverum", municipalityId: 9, servedMunicipalityIds: [], isNational: false },
].map((r) => ({ description: "d", isFallbackTranslation: false, openingHours: null, isAlwaysOpen: false,
	municipalityName: null, address: null, phone: "12345678", email: null, website: null, chatUrl: null,
	lastVerified: "2026-08-17", categories: [], ...r }))

afterEach(() => {
	clearIndexCache()
	vi.unstubAllGlobals()
})

test("renders own and served resources, then national ones, with one h1", async () => {
	stubDataFiles({ resources: rows, kommuner: [hamar], municipalities: [{ id: 1, name: "Hamar", county: "Innlandet" }] })
	window.history.pushState(null, "", "/kommune/hamar")
	const { container } = render(<App />)
	expect(await screen.findByRole("heading", { level: 1, name: "Hjelpetjenester i Hamar" })).toBeInTheDocument()
	const local = screen.getByRole("region", { name: "Tjenester i Hamar" })
	expect(within(local).getAllByRole("listitem").map((li) => within(li).getByRole("heading", { level: 3 }).textContent))
		.toEqual(["Krisesenteret", "NAV Hamar"])
	const national = screen.getByRole("region", { name: "Nasjonale tjenester" })
	expect(within(national).getAllByRole("listitem")).toHaveLength(1)
	expect(screen.getByRole("link", { name: "Søk og filtrer i Hamar" })).toHaveAttribute("href", "/sok?municipality=1")
	expect(container.querySelectorAll("h1")).toHaveLength(1)
	expect(document.title).toBe("Hjelpetjenester i Hamar – Varde")
})

test("unknown slug is not found", async () => {
	stubDataFiles({ kommuner: [hamar] })
	window.history.pushState(null, "", "/kommune/nope")
	render(<App />)
	expect(await screen.findByRole("heading", { level: 1, name: /fant ikke/i })).toBeInTheDocument()
})
```

Card headings: `ResourceCard` renders `<h2>` today. Inside a kommune page whose sections have `<h2>`, cards must be `<h3>`; give `ResourceCard` a `headingLevel?: 2 | 3` prop (default 2) and use 3 here. Adjust the test if the card's heading is a link (query the heading, then its text).

Extend `axe.test.tsx`: add `/kommune/hamar` to the composed pages with the fixture above; the one-h1 assertion already runs for every page.

Run: `npx vitest run tests/kommune.test.tsx tests/axe.test.tsx` — Expected: FAIL.

- [ ] **Step 2: Implement**

`KommunePage.tsx`:

```tsx
import { useEffect, useState } from "react"
import { useArrivalFocus } from "../hooks/useArrivalFocus.ts"
import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { usePageData } from "../pageData.ts"
import { type KommuneEntry, loadIndex } from "../services/data.ts"
import { compareResources, matchesMunicipality } from "../services/query.ts"
import type { ResourceDto } from "../types/api.ts"
import { ErrorState } from "./ErrorState.tsx"
import { Link } from "./Link.tsx"
import { LoadingState } from "./LoadingState.tsx"
import { NotFoundState } from "./NotFoundState.tsx"
import { PageHead } from "./PageHead.tsx"
import { ResourceCard } from "./ResourceCard.tsx"

type Data = { entry: KommuneEntry; local: ResourceDto[]; national: ResourceDto[] }
type State = { kind: "loading" } | { kind: "error" } | { kind: "notFound" } | { kind: "ready"; data: Data }

export function splitForKommune(entry: KommuneEntry, resources: ResourceDto[]): Data {
	const local = resources.filter((r) => !r.isNational && matchesMunicipality(r, entry.id)).sort(compareResources)
	const national = resources.filter((r) => r.isNational).sort(compareResources)
	return { entry, local, national }
}

function fill(template: string, values: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""))
}

export function KommunePage({ slug, arrival }: { slug: string; arrival: number }) {
	const t = useTranslation()
	const { lang } = useLanguage()
	const baked = usePageData().kommune
	const [state, setState] = useState<State>(() =>
		baked && baked.entry.slug === slug ? { kind: "ready", data: baked } : { kind: "loading" }
	)
	const [attempt, setAttempt] = useState(0)
	useEffect(() => {
		if (baked && baked.entry.slug === slug) return
		let cancelled = false
		loadIndex(lang).then(
			(index) => {
				if (cancelled) return
				const entry = index.kommuner.find((k) => k.slug === slug)
				setState(entry ? { kind: "ready", data: splitForKommune(entry, index.resources) } : { kind: "notFound" })
			},
			() => {
				if (!cancelled) setState({ kind: "error" })
			}
		)
		return () => {
			cancelled = true
		}
	}, [slug, lang, baked, attempt])
	const { ref } = useArrivalFocus<HTMLHeadingElement>(arrival, state.kind === "ready")

	if (state.kind === "loading") return <LoadingState />
	if (state.kind === "error") return <ErrorState onRetry={() => setAttempt((n) => n + 1)} />
	if (state.kind === "notFound") return <NotFoundState arrival={arrival} />

	const { entry, local, national } = state.data
	const values = { name: entry.name, county: entry.county, n: local.length }
	const title = fill(t("kommune.title"), values)
	return (
		<article>
			<PageHead title={`${title} – Varde`} description={fill(t("kommune.description"), values)} path={`/kommune/${slug}`} />
			<h1 ref={ref} tabIndex={-1}>{title}</h1>
			<p>{fill(t("kommune.description"), values)}</p>
			<section aria-labelledby="kommune-local">
				<h2 id="kommune-local">{fill(t("kommune.local"), values)}</h2>
				<ul className="results-grid">
					{local.map((r) => <ResourceCard key={r.id} resource={r} headingLevel={3} />)}
				</ul>
			</section>
			<section aria-labelledby="kommune-national">
				<h2 id="kommune-national">{t("kommune.national")}</h2>
				<ul className="results-grid">
					{national.map((r) => <ResourceCard key={r.id} resource={r} headingLevel={3} />)}
				</ul>
			</section>
			<p><Link to={`/sok?municipality=${entry.id}`} className="btn-secondary">{fill(t("kommune.refine"), values)}</Link></p>
		</article>
	)
}
```

Use the same grid class the list page uses for its cards (check `ListPage.tsx` for the class name and reuse it).

`App.tsx`: lazy-load `KommunePage` like the others; `{route.kind === "kommune" && <KommunePage slug={route.slug} arrival={arrival} />}`.

`ResourceCard.tsx`: `headingLevel` prop (`const Heading = headingLevel === 3 ? "h3" : "h2"`), and `kommuneSlug?: string` — when given, the municipality name renders as `<Link to={`/kommune/${kommuneSlug}`}>`. `ListPage.tsx` passes `kommuneSlug={index.kommuner.find((k) => k.id === r.municipalityId)?.slug}` — expose `kommuner` from `useResources`' ready state (`data` plus `kommuner: index.kommuner`) or from `useCatalog`; pick `useCatalog` and add `kommuner` to `Catalog`.

`LandingSearch.tsx`: when a municipality suggestion is picked and the index has a kommune entry with that id, navigate to `/kommune/{slug}`; otherwise `/sok?municipality={id}` as today.

i18n: the five keys in both files. The `every nb key has an en twin` test keeps them honest.

- [ ] **Step 3: Run the suite, commit**

Run: `npm test` — Expected: green.

```bash
git add web
git commit -m "feat(web): kommune pages"
```

---

### Task 10: Server entry, hydrate-or-create, hydration guard

**Files:**
- Create: `web/src/entry-server.tsx`, `web/tests/hydration.test.tsx`
- Modify: `web/src/main.tsx`, `web/vite.config.ts`, `web/package.json`, `web/src/hooks/useUrlState.ts`

**Interfaces:**
- Produces: `render(url: string, data: PageData): Promise<{ html: string; head: HeadEntry | null }>` from `entry-server.tsx`; `npm run build:server` → `dist-server/entry-server.mjs`; `npm run build:client` → `dist/`.

- [ ] **Step 1: Write the failing hydration test**

`tests/hydration.test.tsx`:

```tsx
import { act } from "@testing-library/react"
import { StrictMode } from "react"
import { hydrateRoot } from "react-dom/client"
import { afterEach, expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"
import { render } from "../src/entry-server.tsx"
import { clearIndexCache } from "../src/services/data.ts"
import { PageDataContext, type PageData } from "../src/pageData.ts"
import { UrlContext } from "../src/navigation.ts"
import { stubDataFiles } from "./stubData.ts"

const resource = { id: 12, name: "NAV Hamar", description: "Økonomisk rådgivning", isFallbackTranslation: false,
	openingHours: null, isNational: false, isAlwaysOpen: false, municipalityId: 1, municipalityName: "Hamar",
	address: null, phone: "12345678", email: null, website: null, chatUrl: null, lastVerified: "2026-08-17",
	categories: [], servedMunicipalityIds: [] }
const hamar = { id: 1, slug: "hamar", name: "Hamar", county: "Innlandet" }

afterEach(() => {
	clearIndexCache()
	vi.unstubAllGlobals()
	document.body.innerHTML = ""
})

async function hydrate(url: string, data: PageData) {
	stubDataFiles({ resources: [resource], kommuner: [hamar], municipalities: [{ id: 1, name: "Hamar", county: "Innlandet" }] })
	const { html } = await render(url, data)
	expect(html.length).toBeGreaterThan(200)
	document.body.innerHTML = `<div id="root">${html}</div>`
	const { pathname, search } = new URL(url, "http://localhost")
	window.history.pushState(null, "", `${pathname}${search}`)
	const errors: unknown[] = []
	await act(async () => {
		hydrateRoot(
			document.getElementById("root") as HTMLElement,
			<StrictMode>
				<UrlContext.Provider value={{ pathname, search }}>
					<PageDataContext.Provider value={data}>
						<App />
					</PageDataContext.Provider>
				</UrlContext.Provider>
			</StrictMode>,
			{ onRecoverableError: (error) => errors.push(error) }
		)
	})
	return errors
}

test.each([
	["/", {}],
	["/en/", {}],
	["/sok", {}],
	["/resources/12", { resource }],
	["/en/resources/12", { resource }],
	["/kommune/hamar", { kommune: { entry: hamar, local: [resource], national: [] } }],
])("%s hydrates without a recoverable error", async (url, data) => {
	expect(await hydrate(url, data as PageData)).toEqual([])
})

test("the resource page bakes the resource into the HTML", async () => {
	const { html, head } = await render("/resources/12", { resource })
	expect(html).toContain("NAV Hamar")
	expect(html).toContain('href="tel:12345678"')
	expect(head).toEqual({ title: "NAV Hamar – Varde", description: "Økonomisk rådgivning", path: "/resources/12", lang: "nb" })
})
```

Run: `npx vitest run tests/hydration.test.tsx` — Expected: FAIL, `entry-server` missing.

- [ ] **Step 2: Implement `entry-server.tsx`**

```tsx
import { StrictMode } from "react"
import { prerender } from "react-dom/static"
import { App } from "./App.tsx"
import { HeadContext, type HeadEntry } from "./components/PageHead.tsx"
import { UrlContext } from "./navigation.ts"
import { type PageData, PageDataContext } from "./pageData.ts"

// Called once per URL by scripts/prerender.mjs. prerender() waits for lazy chunks and
// Suspense, so the code splitting in App.tsx stays. Nothing here may touch window/document.
export async function render(url: string, data: PageData): Promise<{ html: string; head: HeadEntry | null }> {
	const { pathname, search } = new URL(url, "http://prerender.invalid")
	let head: HeadEntry | null = null
	const { prelude } = await prerender(
		<StrictMode>
			<HeadContext.Provider value={{ set: (entry) => { head = entry } }}>
				<UrlContext.Provider value={{ pathname, search }}>
					<PageDataContext.Provider value={data}>
						<App />
					</PageDataContext.Provider>
				</UrlContext.Provider>
			</HeadContext.Provider>
		</StrictMode>
	)
	return { html: await new Response(prelude).text(), head }
}
```

- [ ] **Step 3: Make `useUrlState` server-safe and `main.tsx` hydrate-or-create**

`useUrlState.ts`: the initial state comes from `useCurrentUrl()` (Task 6) — `useState(() => ({ ...parseUrl(current.pathname), filters: parseFilters(new URLSearchParams(current.search)), arrival: 0 }))`. `sync` and `navigate` keep reading `window.location` because they only run in the browser. The `popstate` listener is registered in an effect, which never runs on the server.

`ListPage`'s data effect runs only in the browser, so the server output is the loading state — exactly the "search shell". If `LoadingState` renders an `<h1>` (it does: `<h1 className="text-lg">`), the shell already has one `h1`; nothing to add.

`main.tsx`:

```tsx
import { StrictMode } from "react"
import { createRoot, hydrateRoot } from "react-dom/client"
import { App } from "./App.tsx"
import { PageDataContext } from "./pageData.ts"
import { readPageData } from "./services/data.ts"
import "./styles/main.css"

const root = document.getElementById("root")
if (!root) throw new Error("Missing #root element in index.html")

const app = (
	<StrictMode>
		<PageDataContext.Provider value={readPageData() ?? {}}>
			<App />
		</PageDataContext.Provider>
	</StrictMode>
)

// Prerendered pages arrive with HTML inside #root and are hydrated. The Vite dev server and
// 404.html ship an empty root and are rendered from scratch. One entry, both cases.
if (root.hasChildNodes()) {
	hydrateRoot(root, app, {
		onRecoverableError: (error) => console.error("Hydration mismatch — the prerender and the client disagree:", error),
	})
} else {
	createRoot(root).render(app)
}
```

`vite.config.ts`:

```ts
export default defineConfig(({ isSsrBuild }) => ({
	plugins: [react(), tailwindcss()],
	build: isSsrBuild ? { rollupOptions: { output: { entryFileNames: "[name].mjs" } } } : {},
	test: {
		environment: "jsdom",
		setupFiles: ["./tests/setup.ts"],
	},
}))
```

`package.json` scripts:

```json
"build:client": "tsc --noEmit && vite build",
"build:server": "vite build --ssr src/entry-server.tsx --outDir dist-server",
"prerender": "node scripts/prerender.mjs",
"build": "npm run build:client && npm run build:server && npm run prerender",
```

(`prerender.mjs` arrives in Task 11; until then `npm run build` fails at the last step, which is fine on a feature branch. `ci.yml`'s web build step becomes `npm run build:client` in Task 12.)

- [ ] **Step 4: Run the guard, then everything**

Run: `npx vitest run tests/hydration.test.tsx`
Expected: PASS for all six URLs. If `/sok` reports a mismatch on the combobox, apply the spec's fallback: `MunicipalityCombobox` renders a plain `<input>` with the same `aria-label` and classes until an effect sets `mounted`, then the `ComboBox`. If the resource page mismatches on the handover banner, re-check Task 8 (the first render must not read the clock).

Run: `npm test && npm run build:client && npm run build:server`
Expected: green; `dist-server/entry-server.mjs` exists; `node -e "import('./dist-server/entry-server.mjs').then(m => m.render('/', {})).then(r => console.log(r.html.length))"` in `web/` prints a number over 1000.

- [ ] **Step 5: Commit**

```bash
git add web
git commit -m "feat(web): server entry, hydrate-or-create root, hydration guard"
```

---

### Task 11: Prerender script, `_headers`, sitemap, robots, 404

**Files:**
- Create: `web/scripts/prerender.mjs`, `web/public/_headers`, `web/tests/prerender.test.ts`, `web/tests/headers.test.ts`
- Delete: `web/public/staticwebapp.config.json`, `web/public/robots.txt` (the script writes it)

**Interfaces:**
- Consumes: `dist/index.html` with the three placeholders, `dist-server/entry-server.mjs` `render`, `public/data/*.json`, `slug.mjs`.
- Produces: `prerenderSite({ dataDir, distDir, template, render, siteOrigin, log })` returning `{ pages: string[] }`; `escapeJson(value: unknown): string`; `jsonLd(resource, lang, siteOrigin): object`; `urlList(kommuner, resourcesByLang): { url: string; data: PageData }[]`.

- [ ] **Step 1: Write the failing tests**

`tests/prerender.test.ts`:

```ts
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, expect, test, vi } from "vitest"
import { escapeJson, prerenderSite, urlList } from "../scripts/prerender.mjs"

const dirs: string[] = []
afterEach(() => { for (const d of dirs) rmSync(d, { recursive: true, force: true }) })

const template = `<!doctype html><html lang="nb"><head><meta charset="UTF-8" /><script src="/theme-init.js"></script><!--app-head--></head><body><div id="root"><!--app-html--></div><!--app-data--><script type="module" src="/assets/main.js"></script></body></html>`

function setup(resources: object[], kommuner: object[]) {
	const dir = mkdtempSync(join(tmpdir(), "varde-prerender-"))
	dirs.push(dir)
	const dataDir = join(dir, "data")
	const distDir = join(dir, "dist")
	mkdirSync(dataDir)
	mkdirSync(distDir)
	writeFileSync(join(dataDir, "resources.nb.json"), JSON.stringify(resources))
	writeFileSync(join(dataDir, "resources.en.json"), JSON.stringify(resources))
	writeFileSync(join(dataDir, "kommuner.json"), JSON.stringify(kommuner))
	writeFileSync(join(distDir, "index.html"), template)
	return { dataDir, distDir }
}

const row = { id: 5, name: "NAV Hamar", description: "x</script><b>y", municipalityId: 1, servedMunicipalityIds: [], isNational: false, phone: "12345678", website: null, email: null, address: null, municipalityName: "Hamar" }
const hamar = { id: 1, slug: "hamar", name: "Hamar", county: "Innlandet" }

test("escapeJson cannot close a script block", () => {
	expect(escapeJson({ d: "</script>" })).toBe('{"d":"\\u003c/script>"}')
	expect(escapeJson({ d: "a\u2028b" })).toBe('{"d":"a\\u2028b"}')
})

test("urlList covers landing, search, every resource and kommune in both languages", () => {
	const urls = urlList([hamar], { nb: [row], en: [row] }).map((u) => u.url)
	expect(urls).toEqual(["/", "/sok", "/resources/5", "/kommune/hamar", "/en/", "/en/sok", "/en/resources/5", "/en/kommune/hamar"])
})

test("writes every page as folder/index.html with head, data block, lang, sitemap, robots and 404", async () => {
	const { dataDir, distDir } = setup([row], [hamar])
	const render = vi.fn(async (url: string, data: { resource?: { name: string } }) => ({
		html: `<main>${url} ${data.resource?.name ?? ""}</main>`,
		head: { title: `T ${url}`, description: "D", path: url.replace(/^\/en/, "") || "/", lang: url.startsWith("/en") ? "en" : "nb" },
	}))
	const result = await prerenderSite({ dataDir, distDir, render, siteOrigin: "https://varde.pages.dev", log: () => {} })
	expect(result.pages).toHaveLength(8)
	const detail = readFileSync(join(distDir, "en/resources/5/index.html"), "utf8")
	expect(detail).toContain('<html lang="en">')
	expect(detail).toContain("<title>T /en/resources/5</title>")
	expect(detail).toContain('<link rel="canonical" href="https://varde.pages.dev/en/resources/5" />')
	expect(detail).toContain('hreflang="x-default" href="https://varde.pages.dev/resources/5"')
	expect(detail).toContain('<script type="application/json" id="varde-data">')
	expect(detail).not.toContain("</script><b>")
	expect(detail).toContain('<script type="application/ld+json">')
	expect(detail).toContain('"@type":"Organization"')
	expect(readFileSync(join(distDir, "index.html"), "utf8")).toContain("<main>/ </main>")
	const sitemap = readFileSync(join(distDir, "sitemap.xml"), "utf8")
	expect(sitemap).toContain("<loc>https://varde.pages.dev/kommune/hamar</loc>")
	expect(sitemap).toContain('hreflang="en" href="https://varde.pages.dev/en/kommune/hamar"')
	expect(readFileSync(join(distDir, "robots.txt"), "utf8")).toBe("User-agent: *\nAllow: /\nDisallow: /sok?\nDisallow: /en/sok?\nDisallow: /data/\nSitemap: https://varde.pages.dev/sitemap.xml\n")
	const notFound = readFileSync(join(distDir, "404.html"), "utf8")
	expect(notFound).toContain('<div id="root"></div>')
	expect(notFound).toContain("<noscript>")
	expect(notFound).toContain("Fant ikke siden / Page not found")
	expect(existsSync(join(distDir, "kommune/hamar/index.html"))).toBe(true)
})
```

`tests/headers.test.ts`:

```ts
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test } from "vitest"

const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"

test("_headers carries the spec's policy", () => {
	const text = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../public/_headers"), "utf8")
	expect(text).toContain(`Content-Security-Policy: ${CSP}`)
	expect(text).toContain("Referrer-Policy: no-referrer")
	expect(text).toContain("X-Content-Type-Options: nosniff")
	expect(text).toContain("Permissions-Policy: camera=(), microphone=(), geolocation=()")
})
```

Run both — Expected: FAIL.

- [ ] **Step 2: Write `_headers`**

`web/public/_headers`:

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'
  Referrer-Policy: no-referrer
  X-Content-Type-Options: nosniff
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Delete `staticwebapp.config.json` and `public/robots.txt`.

- [ ] **Step 3: Implement `prerender.mjs`**

```js
#!/usr/bin/env node
// Turns the built app into one HTML file per URL. Runs after `vite build` (client) and
// `vite build --ssr` (server); reads public/data/ written by export-data.mjs.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const LANGS = ["nb", "en"]
const prefix = (lang) => (lang === "en" ? "/en" : "")

// JSON that can sit inside <script>: '<' can never start '</script>', and the two line
// separators JSON allows but JavaScript source does not are escaped as well.
export function escapeJson(value) {
	return JSON.stringify(value)
		.replace(/</g, "\\u003c")
		.replace(/\u2028/g, "\\u2028")
		.replace(/\u2029/g, "\\u2029")
}

export function jsonLd(resource, lang, siteOrigin) {
	const out = {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: resource.name,
		description: resource.description,
		url: resource.website ?? `${siteOrigin}${prefix(lang)}/resources/${resource.id}`,
		areaServed: resource.municipalityName ?? "Norge",
	}
	if (resource.phone) out.telephone = resource.phone
	if (resource.email) out.email = resource.email
	if (resource.address) out.address = { "@type": "PostalAddress", streetAddress: resource.address }
	return out
}

function kommuneData(entry, resources) {
	const local = resources.filter((r) => !r.isNational && (r.municipalityId === entry.id || r.servedMunicipalityIds.includes(entry.id)))
	const national = resources.filter((r) => r.isNational)
	return { entry, local, national }
}

export function urlList(kommuner, resourcesByLang) {
	const out = []
	for (const lang of LANGS) {
		const p = prefix(lang)
		out.push({ url: `${p}/`, data: {}, lang })
		out.push({ url: `${p}/sok`, data: {}, lang })
		for (const r of resourcesByLang[lang]) out.push({ url: `${p}/resources/${r.id}`, data: { resource: r }, lang })
		for (const k of kommuner) out.push({ url: `${p}/kommune/${k.slug}`, data: { kommune: kommuneData(k, resourcesByLang[lang]) }, lang })
	}
	return out
}

function headTags(head, siteOrigin) {
	if (!head) return ""
	const abs = (lang, path) => `${siteOrigin}${prefix(lang)}${path}`
	return [
		`<title>${escapeHtml(head.title)}</title>`,
		`<meta name="description" content="${escapeHtml(head.description)}" />`,
		`<link rel="canonical" href="${abs(head.lang, head.path)}" />`,
		`<link rel="alternate" hreflang="nb" href="${abs("nb", head.path)}" />`,
		`<link rel="alternate" hreflang="en" href="${abs("en", head.path)}" />`,
		`<link rel="alternate" hreflang="x-default" href="${abs("nb", head.path)}" />`,
	].join("\n\t\t")
}

function escapeHtml(text) {
	return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function fillTemplate(template, { lang, head, html, data, ld }) {
	const blocks = []
	if (data && Object.keys(data).length) blocks.push(`<script type="application/json" id="varde-data">${escapeJson(data)}</script>`)
	if (ld) blocks.push(`<script type="application/ld+json">${escapeJson(ld)}</script>`)
	return template
		.replace('<html lang="nb">', `<html lang="${lang}">`)
		.replace("<!--app-head-->", head)
		.replace("<!--app-html-->", html)
		.replace("<!--app-data-->", blocks.join("\n\t\t"))
}

function sitemap(pages, siteOrigin) {
	const byPath = new Map()
	for (const page of pages) {
		const path = page.url.replace(/^\/en(?=\/)/, "") || "/"
		byPath.set(path, true)
	}
	const entries = [...byPath.keys()].flatMap((path) =>
		LANGS.map((lang) => {
			const alternates = LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${siteOrigin}${prefix(l)}${path}" />`).join("")
			return `<url><loc>${siteOrigin}${prefix(lang)}${path}</loc>${alternates}</url>`
		})
	)
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join("\n")}\n</urlset>\n`
}

export async function prerenderSite({ dataDir, distDir, render, siteOrigin, log = console.log }) {
	const read = (name) => JSON.parse(readFileSync(join(dataDir, name), "utf8"))
	const kommuner = read("kommuner.json")
	const resourcesByLang = { nb: read("resources.nb.json"), en: read("resources.en.json") }
	const template = readFileSync(join(distDir, "index.html"), "utf8")
	for (const marker of ["<!--app-head-->", "<!--app-html-->", "<!--app-data-->"]) {
		if (!template.includes(marker)) throw new Error(`index.html lacks ${marker}`)
	}
	const pages = urlList(kommuner, resourcesByLang)
	for (const page of pages) {
		const { html, head } = await render(page.url, page.data)
		const ld = page.data.resource ? jsonLd(page.data.resource, page.lang, siteOrigin) : null
		const file = fillTemplate(template, { lang: page.lang, head: headTags(head, siteOrigin), html, data: page.data, ld })
		const dir = join(distDir, page.url === "/" ? "" : page.url)
		mkdirSync(dir, { recursive: true })
		writeFileSync(join(dir, "index.html"), file)
	}
	const notFound = fillTemplate(template, {
		lang: "nb",
		head: "<title>Fant ikke siden – Varde</title>",
		html: "",
		data: {},
		ld: null,
	}).replace('<div id="root"></div>', '<noscript><p>Fant ikke siden / Page not found</p></noscript>\n\t\t<div id="root"></div>')
	writeFileSync(join(distDir, "404.html"), notFound)
	writeFileSync(join(distDir, "sitemap.xml"), sitemap(pages, siteOrigin))
	writeFileSync(
		join(distDir, "robots.txt"),
		`User-agent: *\nAllow: /\nDisallow: /sok?\nDisallow: /en/sok?\nDisallow: /data/\nSitemap: ${siteOrigin}/sitemap.xml\n`
	)
	log(`prerendered ${pages.length} pages`)
	return { pages: pages.map((p) => p.url) }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const here = dirname(fileURLToPath(import.meta.url))
	const webDir = join(here, "..")
	const siteOrigin = process.env.VITE_SITE_ORIGIN ?? "http://localhost:5173"
	const server = await import(pathToFileURL(join(webDir, "dist-server", "entry-server.mjs")).href)
	await prerenderSite({ dataDir: join(webDir, "public", "data"), distDir: join(webDir, "dist"), render: server.render, siteOrigin })
	rmSync(join(webDir, "dist-server"), { recursive: true, force: true })
}
```

Note on the `404.html` replacement: the template's root line is `<div id="root"><!--app-html--></div>`, which after `fillTemplate` with `html: ""` reads `<div id="root"></div>`, so the `.replace` above matches.

Run: `npx vitest run tests/prerender.test.ts tests/headers.test.ts` — Expected: PASS.

- [ ] **Step 4: Run a real build**

With `public/data/` populated (Task 5, `npm run data` against the local API): `npm run build`.
Expected: `dist/` holds `index.html`, `en/index.html`, `sok/index.html`, `resources/<id>/index.html` for every row in both languages, `kommune/<slug>/index.html`, `sitemap.xml`, `robots.txt`, `404.html`, `_headers`, `data/`. `dist-server/` is gone.
Then `npx vite preview` and open `http://localhost:4173/resources/12`: view-source shows the resource name inside `#root`, the console shows no hydration error, the call button is a `tel:` link before JavaScript (disable JS in devtools and reload to confirm), quick exit is a link. Open `/kommune/<slug>` and `/en/kommune/<slug>`. Record what you saw in the commit message body.

- [ ] **Step 5: Add the before-hydration test and commit**

Append to `tests/hydration.test.tsx`:

```tsx
test("the prerendered resource page works before JavaScript", async () => {
	const { html } = await render("/resources/12", { resource })
	expect(html).toContain('href="tel:12345678"')
	expect(html).toMatch(/<a[^>]+href="https:\/\/www\.google\.com"[^>]*>Forlat siden<\/a>/)
	expect(html).toContain('href="/en/resources/12"')
})
```

Run: `npm test` — Expected: green.

```bash
git add web
git commit -m "feat(web): prerender every page with metadata, sitemap, robots, 404 and Cloudflare headers"
```

---

### Task 12: Workflow, README and Azure removal from the repo

**Files:**
- Rewrite: `.github/workflows/deploy-web.yml`
- Delete: `.github/workflows/deploy-api.yml`
- Modify: `.github/workflows/ci.yml` (web build step), `README.md`

**Interfaces:**
- Consumes: secrets `NEON_CONNECTION_STRING`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; variable `SITE_ORIGIN` — all in the `production` environment, created by Malin before the first run (checklist in Task 13).

- [ ] **Step 1: Rewrite `deploy-web.yml`**

```yaml
name: Deploy Web

on:
  push:
    branches: [main]
  schedule:
    # Daily at 04:00 UTC: data edited directly in Neon reaches the site within a day.
    - cron: "0 4 * * *"
  workflow_dispatch:

permissions:
  contents: read

# A cron run and a push must never deploy out of order; the newest run wins.
concurrency:
  group: deploy-web
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: web
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: web/package-lock.json
      - run: npm ci
      - run: npx biome ci .
      - run: npm test

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: "10.0.x"
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: web/package-lock.json

      - name: Require SITE_ORIGIN
        env:
          SITE_ORIGIN: ${{ vars.SITE_ORIGIN }}
        run: test -n "$SITE_ORIGIN" || { echo "vars.SITE_ORIGIN is not set - refusing to build broken canonical URLs"; exit 1; }

      # The API runs only here, against Neon, long enough to export. This log is public:
      # Warning level, no sensitive-data logging, and the export prints counts only.
      - name: Start the API
        env:
          ConnectionStrings__VardeDb: ${{ secrets.NEON_CONNECTION_STRING }}
          ASPNETCORE_ENVIRONMENT: Production
          ASPNETCORE_URLS: http://localhost:5005
          Logging__LogLevel__Default: Warning
        run: |
          dotnet run --project api/Varde.Api/Varde.Api.csproj -c Release --no-launch-profile > api.log 2>&1 &
          echo $! > api.pid
          for i in $(seq 1 60); do
            curl -sf http://localhost:5005/api/municipalities > /dev/null && exit 0
            sleep 2
          done
          echo "API did not answer within 120 s"; cat api.log; exit 1

      - name: Export data
        working-directory: web
        run: |
          npm ci
          npm run data -- http://localhost:5005

      - name: Stop the API
        if: always()
        run: kill "$(cat api.pid)" 2>/dev/null || true

      - name: Build and prerender
        working-directory: web
        env:
          VITE_SITE_ORIGIN: ${{ vars.SITE_ORIGIN }}
        run: npm run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy web/dist --project-name=varde --branch=main
```

Check the current `cloudflare/wrangler-action` release on GitHub before committing and pin to its exact tag (for example `@v3.14.1`), not a floating major. If `dotnet run` needs a launch profile to bind the port, the `ASPNETCORE_URLS` variable covers it; keep `--no-launch-profile` so `launchSettings.json` cannot override it.

- [ ] **Step 2: `ci.yml` and deletions**

In `ci.yml` change the web `Build` step to `run: npm run build:client` (PR checks have no data to prerender; the prerender is unit-tested). Delete `.github/workflows/deploy-api.yml`.

- [ ] **Step 3: README**

Update the README so that:
- the Live line points at `https://varde.pages.dev` (or the `SITE_ORIGIN` Malin gives you) and the API line is removed;
- the cold-start paragraph is replaced by: "The site is static. Every page is prerendered from the database once a day and on every push, so nothing waits on a server. Search runs in the browser over a small JSON index.";
- Run locally gains, after `npm install`: `npm run data` (with the API running on port 5005) then `npm run dev`; and `npm run build` for the full prerender;
- Deployment describes: GitHub Actions on push, daily cron and manual dispatch; the API runs inside the workflow against Neon; Cloudflare Pages hosts `web/dist`; secrets `NEON_CONNECTION_STRING`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; variable `SITE_ORIGIN`; the Azure paragraph is removed;
- a short "Report an error" line explains the `mailto:` link on every resource page goes to a forwarding alias.

Keep the README's voice and length; no marketing.

- [ ] **Step 4: Commit**

```bash
git add .github README.md
git commit -m "ci: build and deploy the static site to Cloudflare Pages daily"
```

Run the full check once more from `web/`: `npm test`, `npx biome ci .`, `npm run build:client`. From the repo root: `dotnet test api/Varde.slnx`. All green before opening the PR.

---

### Task 13: First deploy, verification and Azure retirement (Malin + one follow-up commit)

**Files:** none in code except a possible `web/public/google<token>.html` verification file and README URL fix.

- [ ] **Step 1: Before merging the PR (Malin, in the Cloudflare and GitHub UIs)**
  1. Cloudflare dashboard → Workers & Pages → Create → Pages → "Direct upload" → project name `varde`. Note the `*.pages.dev` URL.
  2. Cloudflare → My Profile → API Tokens → Create token → "Edit Cloudflare Workers" template is too wide; use Custom with `Account · Cloudflare Pages · Edit` only. Copy the token once.
  3. GitHub repo → Settings → Environments → `production`: add secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (dashboard right sidebar), `NEON_CONNECTION_STRING` (the .NET-style string with `Host=…;Username=…;Password=…;Database=varde;SSL Mode=Require` — paste it WITHOUT surrounding quotes, the trap from plan 3); add variable `SITE_ORIGIN` = `https://varde.pages.dev` (no trailing slash).
  4. Remove `AZURE_STATIC_WEB_APPS_API_TOKEN`, `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, and variables `API_APP_NAME`, `API_URL` after the first green run, not before.

- [ ] **Step 2: Merge, watch the run**
  Expected in Actions: test → build-and-deploy green; the API log step shows no SQL; the export step prints `resources nb=94 en=94, kommuner=N`; wrangler prints the deployment URL.

- [ ] **Step 3: Verify in the browser and record in the PR (or a follow-up issue)**
  - Open `/`, `/en/`, `/sok`, `/en/sok`, `/resources/12`, `/en/resources/12`, `/kommune/<slug>`, `/en/kommune/<slug>`, `/nope` (status 404 in devtools Network), `/?lang=en` (lands on `/en/`), `/?search=nav` (lands on `/sok?search=nav`).
  - View-source on a resource and a kommune page shows the content inside `#root`.
  - Console: no hydration error on any page type.
  - Lighthouse (Chrome, mobile, incognito) on the four page types: Performance ≥ 95, Accessibility 100, Best Practices ≥ 95, SEO ≥ 95. Paste the table.
  - Network tab: `/` JavaScript ≤ 120 KB gzipped, `/sok` ≤ 180 KB, fonts ≤ 80 KB; no request to any host but the site's own.
  - Google Rich Results test on one resource URL: accepted.
  - Trigger `workflow_dispatch` once; wait for the 04:00 cron once; both green.

- [ ] **Step 4: Retire Azure (Malin, portal)**
  Delete: App Service `varde-api` and its F1 plan; the Static Web App; app registration `varde-github-deploy` (both federated credentials go with it); budget `varde-guard`; the resource group if empty. Then remove the Azure secrets and variables from GitHub (Step 1.4).

- [ ] **Step 5: Search Console**
  Add a URL-prefix property for `SITE_ORIGIN`, choose HTML-file verification, commit the file to `web/public/` on a small branch, merge, verify, submit `sitemap.xml`.

---

## Self-review

**Spec coverage.** Pipeline and cron → Task 12. Export, row floor, public log → Task 5, 12. DTO field → Task 1. Search in the browser with mirrored rules → Task 4. URL and language model, legacy redirects, stored preference, toggle with hreflang → Tasks 2, 3, 6. Pages table, kommune rules, links to kommune pages, robots disallows → Tasks 9, 11. Head per page, `VITE_SITE_ORIGIN` → Task 7, 12. JSON-LD → Task 11. Prerender mechanics, `prerender` API, hydrate-or-create, page data block, escaping, no browser globals, banner, quick exit, combobox fallback → Tasks 8, 10, 11. 404 with `<noscript>` → Task 11. Report link → Task 8. `_headers`, no analytics check → Tasks 11, 13. Azure retirement, README → Tasks 12, 13. Testing list: hydration guard (10), prerender script (11), head (7), query rules (4), URL model (2, 3), export script (5), headers (11), composed-page invariants (9), before hydration (11). Budgets and Lighthouse → Task 13. Deferred items untouched.

**Placeholders.** None: every step has code or an exact command. The one judgment call left to the implementer (ResourceMunicipality property names in Task 1) points at the file to read.

**Type consistency.** `Lang` is defined in `urlState.ts` and re-exported by `LanguageProvider.tsx` (Tasks 2, 6). `Index`/`KommuneEntry` live in `data.ts` and are consumed by `pageData.ts`, `KommunePage`, `stubData.ts` (Tasks 4, 9, 10). `HeadEntry` is defined in `PageHead.tsx` and returned by `entry-server.tsx` (Tasks 7, 10). `render(url, data)` returns `{ html, head }` in both Task 10's entry and Task 11's script. `applyQuery` returns `PagedResult<ResourceDto>` so `ListPage`'s existing `state.data.totalCount` keeps compiling. `useResources(filters, lang)` dropped the third parameter; grep callers.
