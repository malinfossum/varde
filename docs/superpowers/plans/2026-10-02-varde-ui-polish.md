# Varde UI polish and install hint (sub-project A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Varde its finish and safety pieces: a real header (links, language and theme pickers, quick exit with Shift x3), an About page with liability text, a landing page that fits one 950 px screen, aligned result cards with hover depth, and an installable (online-only) PWA.

**Architecture:** Six PRs in the spec's order. PR 1 adds a Playwright harness that runs against `vite preview` of a full prerendered build, so every later PR proves its layout claims in a real browser. All new behaviour follows the existing layering: pure logic in `src/services/`, state and effects in `src/hooks/`, rendering in `src/components/`. The Workbench picker is ported (markup, class names, behaviour as a hook), never loaded as a script.

**Tech Stack:** React 19, TypeScript 7, Vite 8, Tailwind 4, vitest 4 + Testing Library + vitest-axe, Biome 2, `@playwright/test` 1.63.0 (new, Chromium only), GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-02-varde-ui-polish-design.md` (approved 2026-10-02; amended the same day with the two-column landing decision, see Landing in PR 4).

## Global Constraints

Every task's requirements include these. Values are copied from the spec.

- **Fit:** the landing page, footer included, is at most **950 px** tall at **1280 x 950** and **1920 x 950**, in both themes and both languages, at default zoom, with the install hint closed.
- **Header row rule:** every control in a header row is **44 px** tall and shares one bottom edge (checked at 375, 1280 and 1920).
- **Targets:** every new interactive element (chips, helpline buttons, the install hint's `<summary>`, footer links, picker rows, the back arrow) is at least **44 x 44 px**.
- **CSP:** no `style` attribute in prerendered HTML. Inline styles are set from JavaScript after mount only. The inline init script in `web/index.html` and its CSP hash in `web/public/_headers` do not change in any PR.
- **Always current:** no service worker, no offline cache, no new server.
- **Storage keys stay:** theme `"theme"`, language `"varde.lang"`.
- **External URLs:** Helsenorge `https://www.helsenorge.no`, NAV `https://www.nav.no` (both checked live 2026-10-02, both answer 200). Quick exit target `https://www.google.com` via `location.replace`.
- **Hover:** 2 px lift with a soft shadow over 150 ms, only under `(hover: hover) and (prefers-reduced-motion: no-preference)`. Focus styles unchanged.
- **CSS is mobile-first:** baseline is the smallest screen; layer up with `min-width` 768 px (`md:`) and 1024 px (`lg:`). Never `max-width`. The quick exit's short-screen rule uses `min-height`.
- **Playwright:** `@playwright/test` pinned exactly at `1.63.0`, Chromium only, licence Apache-2.0 (from `npm view` on 2026-10-02; re-read from the installed package in Task 1).
- **Never invent contact data.** Every phone number, URL and menu label is copied from a data file or a cited source, never typed from memory. Test fixtures copy rows from `web/public/data/resources.nb.json`.
- **Text I ship:** first person, no em dashes (rewrite the sentence instead; no en dash or spaced hyphen as a stand-in). The existing page-title pattern `<title> – Varde` stays as it is, because every page already uses it.
- **Commits:** conventional prefix (`feat:`, `test:`, `docs:`, `ci:`, `style:`), no `Co-Authored-By` and no AI attribution.
- **Every new check is shown red once.** Before a Playwright or unit check is trusted, break the code on purpose, run the check, see it fail, and restore. Each PR description lists every break and its red result.
- **Commands** run from `web/` unless a step says otherwise: `npm test`, `npx biome ci .`, `npm run build`, `npx playwright test`. Run `npx biome check --write .` before every `npx biome ci .`: the snippets are Biome-formatted where checked, but new imports land wherever the step says and organize-imports decides their order.
- **i18n snippets** show every line with a trailing comma. Insert them after the last existing entry, add a comma to the line that was last, and drop the comma after the new last line, so the file stays valid JSON.

## Review Focus

Inputs the spec implies but no spec test names. Each line has a test in the task that owns the code.

1. **Coming back to the landing page by client-side navigation** (for example from `/sok` via the brand link): there is no baked page data, yet "Noen å snakke med" must still appear. Test in Task 14.
2. **Typing capitals in the search box** (Shift held with letters, quickly and repeatedly) must never trigger the quick exit. Test in Task 10.
3. **A helpline whose `chatUrl` is not `https://`** (`javascript:`, `http://`, empty) renders its name alone, never a link. Test in Task 13.
4. **Theme on "System" while the OS flips dark/light, or another tab changes the choice:** the page and the trigger name follow without a reload. Test in Task 9.
5. **English at 320 px**, where the labels are longest ("Leave this page", "All services", "About Varde and liability"): no horizontal scroll on any page. Test in Task 5.

## Open items (owner: Malin)

- **New "Meld feil" alias.** Task 4 cannot finish without it, and PR 2 cannot merge without it.
- **Cloudflare Web Analytics off.** Check in the Cloudflare dashboard (Workers & Pages, the `varde` project, Metrics: Web Analytics must be disabled) before PR 2 merges, since the About page now names Cloudflare.
- **Arbeidslivstelefonen (id 9) needs "tast 3".** Mental Helse lists it as "116 123 (tast 3)" (mentalhelse.no/fa-hjelp/arbeidslivstelefonen/, read 2026-10-02). Varde's data shows plain `116 123`, so a caller reaches Hjelpetelefonen first. Decide before PR 4 merges: fix the row in Neon and the seed (a data change, outside this plan), or swap id 9 out of `HELPLINE_IDS`.
- **Install labels on a real device.** Apple's nb pages for iOS 26 and 27 leave "Share" untranslated, and Edge's nb page reads as machine-translated. Check those two labels on a real device before PR 6 merges (Task 19 lists them).
- **Required check.** After PR 1's `web-e2e` job runs green, add it as a required check: GitHub, repo Settings, Rules, Rulesets, `protect-main`, "Require status checks to pass", add `web-e2e`.

## Decided (2026-10-08)

- **No sticky header on a phone.** At 375 px the tools wrap below the brand (brand plus tools is 345 px nb and 373 px en against 343 px of room, measured on the live site 2026-10-02), so a sticky header would be three rows and 157 px tall. Under 768 px wide the header now scrolls away and only the quick exit stays pinned, the same pattern as short screens. Tasks 10 and 11 carry it; spec Quick exit and Phone bullets amended.
- **Shift x3 stays.** The NVDA Shift-pause test in PR 3's manual check still runs. If a third Shift press soon after pause and resume leaves Varde, I change the shortcut before PR 3 merges.
- **The `Link` aria-label bug is fixed in PR 3.** `Link` passed only `href`, `className`, `hrefLang`, `lang` and `onClick` to its `<a>`, and TypeScript accepts any hyphenated prop, so the brand link's `aria-label` was dropped without an error. Task 6 adds the prop and a test. The label itself becomes "Varde, til forsiden" / "Varde, home page": it is speech only, and a comma pauses the same way at every NVDA punctuation level.

## Shipping a PR

Each PR's last task ends with these steps. Merging is Malin's call; I never merge.

1. Branch from an up-to-date `main` after the previous PR has merged: `git switch main && git pull && git switch -c <branch>`.
2. Before pushing, all four pass from `web/`: `npx biome ci .`, `npm test`, `npm run build`, `npx playwright test` (PR 1 onwards).
3. `git push -u origin <branch>`, then `gh pr create --base main --title "<title>" --body-file <file>`. The body has: what changed (short), a "Red proofs" table (check, break, red result), and a manual checklist when the spec's table has a "Manual, before merge" entry.
4. After Malin merges, open `https://varde.pages.dev` and look at what changed.

---

# PR 1: `test/playwright-harness`

### Task 1: Playwright harness, data snapshot and smoke test

**Files:**
- Modify: `web/package.json`, `web/package-lock.json` (via npm), `web/vite.config.ts`, `web/biome.json`, `web/.gitignore`
- Create: `web/playwright.config.ts`, `web/e2e/helpers.ts`, `web/e2e/smoke.spec.ts`, `web/e2e/fixtures/data/*.json` (six files, generated)

**Interfaces:**
- Consumes: nothing.
- Produces (used by every later e2e spec): `e2e/helpers.ts` exports
  `THEMES: readonly ["light", "dark"]`,
  `setTheme(page: Page, theme: "light" | "dark"): Promise<void>` (stores the theme before any page script runs),
  `settle(page: Page): Promise<void>` (waits for fonts, then reloads once so Fraunces, which is `font-display: optional`, is cached and actually used),
  `noHorizontalScroll(page: Page): Promise<boolean>`.

- [ ] **Step 1: Branch**

```bash
git switch main && git pull && git switch -c test/playwright-harness
```

- [ ] **Step 2: Install Playwright, pinned, and read its licence**

```bash
cd web
npm install --save-dev --save-exact @playwright/test@1.63.0
node -e "console.log(require('./node_modules/@playwright/test/package.json').license)"
```

Expected: `Apache-2.0`. If it prints anything else, stop and tell Malin before going on. Playwright has no telemetry to switch off.

- [ ] **Step 3: Keep vitest out of `e2e/`**

Vitest's default include matches `*.spec.ts`, so it would try to run the Playwright specs. In `web/vite.config.ts`, change the `test` block to:

```ts
	test: {
		environment: "jsdom",
		setupFiles: ["./tests/setup.ts"],
		// Playwright owns e2e/*.spec.ts; vitest's default include would pick them up too.
		include: ["tests/**/*.test.{ts,tsx}"],
	},
```

Add an `e2e` script to `web/package.json` `scripts`, after `"test"`:

```json
		"e2e": "playwright test",
```

- [ ] **Step 4: Ignore generated output**

In `web/biome.json`, add three entries to `files.includes`, after `"!public/data"`:

```json
			"!e2e/fixtures",
			"!test-results",
			"!playwright-report",
```

Append to `web/.gitignore`:

```gitignore

# Playwright
test-results/
playwright-report/
blob-report/
```

`e2e/` stays out of `tsconfig.json` on purpose: the project has no `@types/node`, and Playwright transpiles its own specs. Biome still lints them.

- [ ] **Step 5: Write the config**

Create `web/playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test"

// Runs against `vite preview` of a full build (npm run build), so every check sees the real
// prerendered pages, not the dev server. Chromium only (spec: Testing and verification).
// No retries: a flaky layout check is a finding, not noise to hide.
export default defineConfig({
	testDir: "e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: 0,
	reporter: "list",
	use: {
		baseURL: "http://localhost:4173",
		trace: "retain-on-failure",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: {
		command: "npm run preview -- --port 4173 --strictPort",
		url: "http://localhost:4173",
		reuseExistingServer: !process.env.CI,
	},
})
```

- [ ] **Step 6: Write the shared helpers**

Create `web/e2e/helpers.ts`:

```ts
import type { Page } from "@playwright/test"

export const THEMES = ["light", "dark"] as const

// The inline init script in index.html reads this key before first paint, so setting it in an
// init script gives the real first render in that theme.
export async function setTheme(page: Page, theme: "light" | "dark"): Promise<void> {
	await page.addInitScript((value) => {
		try {
			window.localStorage.setItem("theme", value)
		} catch {}
	}, theme)
}

// Fraunces is font-display: optional, so a first visit may paint the fallback serif and keep
// it. One reload with the font cached gives the layout a real visitor sees on a second visit,
// which is the stable one to measure.
export async function settle(page: Page): Promise<void> {
	await page.evaluate(() => document.fonts.ready)
	await page.reload()
	await page.evaluate(() => document.fonts.ready)
}

export async function noHorizontalScroll(page: Page): Promise<boolean> {
	return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
}
```

- [ ] **Step 7: Make the data snapshot from the local seeded API**

The full build needs `public/data/`, which is gitignored. The snapshot is real seed data, never hand-written. In PowerShell:

```powershell
Start-Service postgresql-x64-17
dotnet run --project ..\api\Varde.Api
```

`appsettings.Development.json` (gitignored) holds the dev connection string; user-secrets do not load in the embedded terminal. Leave the API running and, in a second terminal in `web/`:

```bash
npm run data -- http://localhost:5005
mkdir -p e2e/fixtures/data
cp public/data/*.json e2e/fixtures/data/
ls e2e/fixtures/data
```

Expected: six files (`categories.en.json`, `categories.nb.json`, `kommuner.json`, `municipalities.json`, `resources.en.json`, `resources.nb.json`). Stop the API (Ctrl+C).

- [ ] **Step 8: Write the smoke test**

Create `web/e2e/smoke.spec.ts`:

```ts
import { expect, test } from "@playwright/test"

test("the prerendered landing page loads in both languages without console errors", async ({
	page,
}) => {
	const errors: string[] = []
	page.on("console", (message) => {
		if (message.type() === "error") errors.push(message.text())
	})
	page.on("pageerror", (error) => errors.push(error.message))
	await page.goto("/")
	await expect(page.getByRole("heading", { level: 1 })).toContainText("Finn riktig hjelp")
	await page.goto("/en/")
	await expect(page.getByRole("heading", { level: 1 })).toContainText("Find the right help")
	expect(errors).toEqual([])
})

// The prerender writes file-form pages (resources/1.html). If vite preview fell back to
// index.html instead, this would show the landing headline, and every later check would be
// measuring the wrong page.
test("vite preview serves the file-form detail page, not the landing fallback", async ({
	page,
}) => {
	await page.goto("/resources/1")
	await expect(page.getByRole("heading", { level: 1 })).toContainText("Hjelpetelefonen")
})
```

- [ ] **Step 9: Build and run**

```bash
npm run build
npx playwright install chromium
npx playwright test
```

Expected: `2 passed`.

- [ ] **Step 10: Show it red once**

In `e2e/smoke.spec.ts` change `"Finn riktig hjelp"` to `"Finn feil hjelp"`. Run `npx playwright test smoke`. Expected: FAIL, `Expected substring: "Finn feil hjelp"`. Restore the line and run again: `2 passed`. Note the break and result for the PR description.

- [ ] **Step 11: Vitest still runs only `tests/`**

```bash
npm test
npx biome ci .
```

Expected: vitest reports the same number of test files as before this task (no `e2e/` file listed) and all pass; Biome clean.

- [ ] **Step 12: Commit**

```bash
git add package.json package-lock.json vite.config.ts biome.json .gitignore playwright.config.ts e2e
git commit -m "test: add a Playwright harness against the prerendered build"
```

### Task 2: CI job `web-e2e` and PR 1

**Files:**
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: Task 1's `e2e/fixtures/data/` and `npx playwright test`.
- Produces: the `web-e2e` check that every later PR runs.

- [ ] **Step 1: Add the job**

Append to `.github/workflows/ci.yml`, after the `web-tests` job (same indentation as `web-tests:`):

```yaml
  # Real-browser layout checks against a full prerendered build. The data snapshot is real
  # seed data (web/e2e/fixtures/data), because public/data is gitignored and normally comes
  # from the API at deploy time.
  web-e2e:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: web
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: web/package-lock.json
      - name: Install
        run: npm ci
      - name: Data snapshot
        run: mkdir -p public/data && cp e2e/fixtures/data/*.json public/data/
      - name: Build
        run: npm run build
      - name: Browser
        run: npx playwright install --with-deps chromium
      - name: Playwright
        run: npx playwright test
```

It adds no third-party action and inherits the workflow's `permissions: contents: read`.

- [ ] **Step 2: Commit and ship**

```bash
git add ../.github/workflows/ci.yml
git commit -m "ci: run the Playwright checks on every pull request"
```

Follow "Shipping a PR" with title `test: Playwright harness and web-e2e CI job`. Red proofs: the smoke test from Task 1 Step 10. After the job is green, remind Malin of the required-check step in Open items.

---

# PR 2: `feat/om-varde`

### Task 3: The `about` route, prerendered, plus the no-`style=` guard

**Files:**
- Modify: `web/src/services/urlState.ts`, `web/src/App.tsx`, `web/scripts/prerender.mjs`, `web/src/i18n/nb.json`, `web/src/i18n/en.json`
- Create: `web/src/components/AboutPage.tsx`
- Test: `web/tests/urlState.test.ts`, `web/tests/prerender.test.ts`, `web/tests/hydration.test.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `Route` gains `{ kind: "about" }`; `parseRoute("/om")` returns it; `routePath({ kind: "about" })` returns `"/om"`. `AboutPage({ arrival }: { arrival: number })` exported from `src/components/AboutPage.tsx`. `prerenderSite` throws on any `style=` attribute.

- [ ] **Step 1: Branch**

```bash
git switch main && git pull && git switch -c feat/om-varde
```

- [ ] **Step 2: Write the failing route tests**

Append to `web/tests/urlState.test.ts` (it already imports from `../src/services/urlState.ts`; add `parseRoute`, `parseUrl`, `routePath` to that import if missing):

```ts
test("/om is the About page in both languages", () => {
	expect(parseRoute("/om")).toEqual({ kind: "about" })
	expect(parseUrl("/en/om")).toEqual({ lang: "en", route: { kind: "about" } })
	expect(routePath({ kind: "about" })).toBe("/om")
})
```

In `web/tests/prerender.test.ts`, change the `urlList` expectation to include About after search:

```ts
	expect(urls).toEqual([
		"/",
		"/sok",
		"/om",
		"/resources/5",
		"/kommune/hamar",
		"/en/",
		"/en/sok",
		"/en/om",
		"/en/resources/5",
		"/en/kommune/hamar",
	])
```

and in the "writes every page as a file" test change `expect(result.pages).toHaveLength(8)` to `toHaveLength(10)`. In the "every page carries the share-card tags" test, change `expect(pages).toHaveLength(8)` (line 252) to `toHaveLength(10)` too. Then add after the `kommune/hamar.html` assertion:

```ts
	expect(existsSync(join(distDir, "om.html"))).toBe(true)
	expect(existsSync(join(distDir, "en/om.html"))).toBe(true)
	expect(readFileSync(join(distDir, "sitemap.xml"), "utf8")).toContain(
		"<loc>https://varde.pages.dev/om</loc>"
	)
```

Append a new test to the same file:

```ts
test("rejects a page whose markup carries a style attribute, which the CSP would drop", async () => {
	const { dataDir, distDir } = setup([row], [hamar])
	const render = vi.fn(async () => ({ html: '<main style="color: red">x</main>', head: null }))
	await expect(
		prerenderSite({
			dataDir,
			distDir,
			render,
			split: stubSplit,
			siteOrigin: "https://varde.pages.dev",
			log: () => {},
		})
	).rejects.toThrow(/style=/)
})
```

In `web/tests/hydration.test.tsx`, add two rows to the `test.each` table after `["/en/", {}]`:

```ts
	["/om", {}],
	["/en/om", {}],
```

- [ ] **Step 3: Run them to see them fail**

Run: `npx vitest run tests/urlState.test.ts tests/prerender.test.ts tests/hydration.test.tsx`
Expected: FAIL. `parseRoute("/om")` returns `notFound`, the URL list lacks `/om`, and the style test resolves instead of rejecting. The two new hydration rows already pass (NotFoundState also has an h1); they guard hydration of the real About page after Step 5, not the route itself.

- [ ] **Step 4: Add the route**

In `web/src/services/urlState.ts`, add the kind to `Route`:

```ts
export type Route =
	| { kind: "landing" }
	| { kind: "list" }
	| { kind: "about" }
	| { kind: "detail"; id: number }
	| { kind: "kommune"; slug: string }
	| { kind: "notFound" }
```

In `parseRoute`, after the `/sok` line:

```ts
	if (pathname === "/om") return { kind: "about" }
```

In `routePath`, after the `list` case:

```ts
		case "about":
			return "/om"
```

- [ ] **Step 5: Add the page and the strings**

Create `web/src/components/AboutPage.tsx` (Task 4 fills in the sections):

```tsx
import { useArrivalFocus } from "../hooks/useArrivalFocus.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { PageHead } from "./PageHead.tsx"

export function AboutPage({ arrival }: { arrival: number }) {
	const t = useTranslation()
	const { ref } = useArrivalFocus<HTMLHeadingElement>(arrival, true)
	return (
		<article className="about mx-auto grid max-w-prose gap-6">
			<PageHead title={t("about.pageTitle")} description={t("about.description")} path="/om" />
			<h1 ref={ref} tabIndex={-1} className="text-4xl">
				{t("about.heading")}
			</h1>
		</article>
	)
}
```

Add to `web/src/i18n/nb.json` (after the last entry, commas as in Global Constraints; key order is loose, the parity test sorts):

```json
	"about.pageTitle": "Om Varde og ansvar – Varde",
	"about.description": "Hva Varde er og ikke er, hvor opplysningene kommer fra, ansvar, personvern og hvordan du melder feil.",
	"about.heading": "Om Varde",
```

and to `web/src/i18n/en.json`:

```json
	"about.pageTitle": "About Varde and liability – Varde",
	"about.description": "What Varde is and is not, where the information comes from, liability, privacy and how to report an error.",
	"about.heading": "About Varde",
```

In `web/src/App.tsx`, add the lazy import after `KommunePage`:

```tsx
const AboutPage = lazy(() =>
	import("./components/AboutPage.tsx").then((m) => ({ default: m.AboutPage }))
)
```

and the route line inside `<Suspense>`, after the `list` line:

```tsx
					{route.kind === "about" && <AboutPage arrival={arrival} />}
```

- [ ] **Step 6: Prerender it, and reject `style=`**

In `web/scripts/prerender.mjs`, add to `CHUNKS`:

```js
	about: "src/components/AboutPage.tsx",
```

In `urlList`, after the `/sok` push:

```js
		out.push({ url: `${p}/om`, data: {}, lang, chunk: CHUNKS.about })
```

After `assertNoOutlinedBoundary`, add:

```js
// index.html's CSP allows only hashed inline styles, so a style="..." attribute in prerendered
// markup is silently dropped by the browser. Inline styles belong in effects, after mount.
function assertNoStyleAttribute(html, url) {
	if (/<[^>]+\sstyle=/.test(html)) {
		throw new Error(`prerendered page ${url} contains a style= attribute, which the CSP would drop`)
	}
}
```

and call it in `prerenderSite` right after `assertNoOutlinedBoundary(html, page.url)`:

```js
		assertNoStyleAttribute(html, page.url)
```

- [ ] **Step 7: Run the tests**

Run: `npx vitest run tests/urlState.test.ts tests/prerender.test.ts tests/hydration.test.tsx tests/i18n.test.tsx`
Expected: PASS.

- [ ] **Step 8: Show the style guard red once**

In `prerender.mjs`, comment out the `assertNoStyleAttribute(html, page.url)` call. Run `npx vitest run tests/prerender.test.ts`. Expected: FAIL on "rejects a page whose markup carries a style attribute" (promise resolved). Restore the call; PASS. Note it for the PR.

- [ ] **Step 9: Full check and commit**

```bash
npm test && npx biome ci . && npm run build
git add src/services/urlState.ts src/App.tsx src/components/AboutPage.tsx src/i18n scripts/prerender.mjs tests/urlState.test.ts tests/prerender.test.ts tests/hydration.test.tsx
git commit -m "feat: add the /om route, prerendered in both languages"
```

Expected: the build log says `prerendered 210 pages` (208 before, plus `/om` and `/en/om`).

### Task 4: About page content and the new report address

**Files:**
- Modify: `web/src/components/AboutPage.tsx`, `web/src/services/contactActions.ts`, `web/src/i18n/nb.json`, `web/src/i18n/en.json`, `README.md`
- Test: `web/tests/about.test.tsx` (create), `web/tests/contactActions.test.ts`, `web/tests/detail.test.tsx`, `web/tests/axe.test.tsx`

**Interfaces:**
- Consumes: `AboutPage` from Task 3.
- Produces: `REPORT_ADDRESS` (the new alias), `generalReportHref(subject: string): string` in `services/contactActions.ts`; `ABOUT_UPDATED: string` (ISO date) exported from `AboutPage.tsx`; the element `id="meld-feil"` on the About page (the footer links to `/om#meld-feil`).

- [ ] **Step 1: Get the alias (blocking)**

Ask Malin for the new Proton alias for "Meld feil". Do not invent one and do not reuse `varde.implicate775@passmail.com`. Every step below that says `<ALIAS>` means the exact address she gives.

- [ ] **Step 2: Write the failing tests**

Create `web/tests/about.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react"
import { afterEach, expect, test } from "vitest"
import { App } from "../src/App.tsx"
import { ABOUT_UPDATED } from "../src/components/AboutPage.tsx"
import { REPORT_ADDRESS } from "../src/services/contactActions.ts"
import { stubDataFiles } from "./stubData.ts"

afterEach(() => {
	window.history.replaceState(null, "", "/")
})

const sections = {
	nb: [
		"Hva Varde er",
		"Hva Varde ikke er",
		"Hvor opplysningene kommer fra",
		"Ansvar",
		"Meld feil",
		"Personvern",
		"Kildekode",
	],
	en: [
		"What Varde is",
		"What Varde is not",
		"Where the information comes from",
		"Liability",
		"Report an error",
		"Privacy",
		"Source code",
	],
}

test.each([
	["/om", "nb"],
	["/en/om", "en"],
] as const)("%s has every section in order", async (path, lang) => {
	stubDataFiles()
	window.history.replaceState(null, "", path)
	render(<App />)
	const main = screen.getByRole("main")
	// The Suspense fallback (LoadingState) has an h1 of its own, so wait for the About h2s instead.
	const headings = (await within(main).findAllByRole("heading", { level: 2 })).map(
		(h) => h.textContent
	)
	expect(headings).toEqual(sections[lang])
})

test("the report section shows the address as text and a mailto link with a subject", async () => {
	stubDataFiles()
	window.history.replaceState(null, "", "/om")
	render(<App />)
	const heading = await screen.findByRole("heading", { level: 2, name: "Meld feil" })
	expect(heading).toHaveAttribute("id", "meld-feil")
	const section = heading.closest("section") as HTMLElement
	expect(within(section).getByText(REPORT_ADDRESS)).toBeInTheDocument()
	expect(within(section).getByRole("link", { name: "Skriv e-post" })).toHaveAttribute(
		"href",
		`mailto:${REPORT_ADDRESS}?subject=Varde%3A%20feil`
	)
})

test("the new alias replaces the old one, and the page says when the text last changed", async () => {
	expect(REPORT_ADDRESS).not.toBe("varde.implicate775@passmail.com")
	expect(REPORT_ADDRESS).toMatch(/^[^\s@]+@[^\s@]+\.[a-z]+$/)
	expect(ABOUT_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/)
	stubDataFiles()
	window.history.replaceState(null, "", "/om")
	render(<App />)
	expect(await screen.findByText(`Teksten ble sist endret ${ABOUT_UPDATED}.`)).toBeInTheDocument()
})
```

In `web/tests/contactActions.test.ts` line 75 and `web/tests/detail.test.tsx` line 64, replace `varde.implicate775@passmail.com` with `<ALIAS>`.

In `web/tests/axe.test.tsx`, add a row to `pages` after `kommune`:

```ts
	["about", "/om", "ok", /Om Varde/],
```

- [ ] **Step 3: Run them to see them fail**

Run: `npx vitest run tests/about.test.tsx tests/contactActions.test.ts tests/detail.test.tsx`
Expected: FAIL (`ABOUT_UPDATED` is not exported, no h2 sections, old address).

- [ ] **Step 4: The address and the general report link**

In `web/src/services/contactActions.ts`, replace the `REPORT_ADDRESS` line and its comment with:

```ts
// A dedicated forwarding alias for error reports, separate from the one tied to deploy
// accounts, so I can switch it off if it attracts spam (spec: Om Varde, Meld feil).
export const REPORT_ADDRESS = "<ALIAS>"
```

and add after `reportHref`:

```ts
export function generalReportHref(subject: string): string {
	return `mailto:${REPORT_ADDRESS}?subject=${encodeURIComponent(subject)}`
}
```

The README publishes the old alias too. In `README.md` (the "Report an error" paragraph, line 47), replace `varde.implicate775@passmail.com` with `<ALIAS>`.

- [ ] **Step 5: The page text**

Add to `web/src/i18n/nb.json` (Malin's approved draft, verbatim):

```json
	"about.whatHeading": "Hva Varde er",
	"about.whatBody": "Varde er en oversikt over hjelpetjenester i Norge: hvem du kan ringe, hvor de holder til og når de har åpent. Varde er gratis, og jeg har laget den på fritiden.",
	"about.notHeading": "Hva Varde ikke er",
	"about.notBody": "Varde er ikke en nødtjeneste. Ingen følger med på det du gjør her, og ingen kan sende hjelp ut fra denne siden. Ved fare for liv, ring 113. Brann 110, politi 112, legevakt 116 117. Varde gir ikke medisinske, juridiske eller økonomiske råd, og er ikke tilknyttet NAV, Helsenorge eller tjenestene som står oppført.",
	"about.sourcesHeading": "Hvor opplysningene kommer fra",
	"about.sourcesBody": "Hvert telefonnummer, hver adresse og hver åpningstid er kopiert fra tjenestens egen side eller fra et offentlig register. Ingenting er gjettet eller funnet på. Hver oppføring viser kilden og datoen den sist ble bekreftet. Tjenester endrer seg: ring tjenesten for å bekrefte før du drar dit.",
	"about.liabilityHeading": "Ansvar",
	"about.liabilityBody": "Jeg gjør mitt beste for at alt stemmer, men jeg kan ikke garantere at opplysningene er riktige, fullstendige eller oppdaterte til enhver tid. Varde gis som den er. Så langt loven tillater det, er jeg ikke ansvarlig for tap eller skade som følger av at noen bruker eller stoler på opplysningene her.",
	"about.reportHeading": "Meld feil",
	"about.reportBody": "Ser du noe som er feil? Send en e-post til {address}. Skriv hvilken tjeneste det gjelder og hva som er feil, så retter jeg det.",
	"about.reportLink": "Skriv e-post",
	"about.reportSubject": "Varde: feil",
	"about.privacyHeading": "Personvern",
	"about.privacyBody": "Varde er laget og drives av Malin Fossum, som er ansvarlig for opplysningene nedenfor. Ingen sporing, ingen informasjonskapsler og ingen kontoer. Valget ditt av språk og tema lagres bare i nettleseren din. Varde ligger hos Cloudflare, som ser IP-adressen din slik alle nettsider gjør, men jeg samler ikke inn statistikk og ser ikke hvem som besøker siden. Sender du meg en e-post om en feil, ser jeg e-postadressen din. Jeg bruker den bare til å rette feilen og svare deg, deler den aldri, og sletter e-posten når saken er ferdig.",
	"about.sourceHeading": "Kildekode",
	"about.sourceBody": "Varde er åpen kildekode (MIT-lisens) på GitHub.",
	"about.updated": "Teksten ble sist endret {date}.",
```

Add to `web/src/i18n/en.json` (the English mirror; Malin reads it in the PR):

```json
	"about.whatHeading": "What Varde is",
	"about.whatBody": "Varde is a directory of help services in Norway: who you can call, where they are and when they are open. Varde is free, and I built it in my spare time.",
	"about.notHeading": "What Varde is not",
	"about.notBody": "Varde is not an emergency service. Nobody watches what you do here, and nobody can send help from this page. If a life is in danger, call 113. Fire 110, police 112, out-of-hours medical service (legevakt) 116 117. Varde gives no medical, legal or financial advice, and is not affiliated with NAV, Helsenorge or the services it lists.",
	"about.sourcesHeading": "Where the information comes from",
	"about.sourcesBody": "Every phone number, address and opening time is copied from the service's own website or from a public register. Nothing is guessed or made up. Every entry shows its source and the date it was last confirmed. Services change: call the service to confirm before you go there.",
	"about.liabilityHeading": "Liability",
	"about.liabilityBody": "I do my best to keep everything correct, but I cannot guarantee that the information is correct, complete or up to date at all times. Varde is provided as is. To the extent the law allows, I am not liable for any loss or damage that follows from anyone using or relying on the information here.",
	"about.reportHeading": "Report an error",
	"about.reportBody": "See something wrong? Send an email to {address}. Say which service it concerns and what is wrong, and I will fix it.",
	"about.reportLink": "Write an email",
	"about.reportSubject": "Varde: error",
	"about.privacyHeading": "Privacy",
	"about.privacyBody": "Varde is made and run by Malin Fossum, who is responsible for the information below. No tracking, no cookies and no accounts. Your choice of language and theme is stored only in your browser. Varde is hosted by Cloudflare, which sees your IP address the way every website does, but I collect no statistics and cannot see who visits the site. If you email me about an error, I see your email address. I use it only to fix the error and reply to you, never share it, and delete the email when the matter is closed.",
	"about.sourceHeading": "Source code",
	"about.sourceBody": "Varde is open source (MIT licence) on GitHub.",
	"about.updated": "This text was last changed {date}.",
```

- [ ] **Step 6: Render the sections**

Get today's date for `ABOUT_UPDATED`:

```bash
date +%Y-%m-%d
```

Replace `web/src/components/AboutPage.tsx` with (put the printed date where it says `<TODAY>`):

```tsx
import { useArrivalFocus } from "../hooks/useArrivalFocus.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { generalReportHref, REPORT_ADDRESS } from "../services/contactActions.ts"
import { PageHead } from "./PageHead.tsx"

// The day the about.* text last changed. Bump it in the same commit as any edit to those
// strings, in both languages.
export const ABOUT_UPDATED = "<TODAY>"

const plainSections = [
	["what", "about.whatHeading", "about.whatBody"],
	["not", "about.notHeading", "about.notBody"],
	["sources", "about.sourcesHeading", "about.sourcesBody"],
	["liability", "about.liabilityHeading", "about.liabilityBody"],
] as const

export function AboutPage({ arrival }: { arrival: number }) {
	const t = useTranslation()
	const { ref } = useArrivalFocus<HTMLHeadingElement>(arrival, true)
	const [beforeAddress, afterAddress] = t("about.reportBody").split("{address}")
	return (
		<article className="about mx-auto grid max-w-prose gap-6">
			<PageHead title={t("about.pageTitle")} description={t("about.description")} path="/om" />
			<h1 ref={ref} tabIndex={-1} className="text-4xl">
				{t("about.heading")}
			</h1>
			{plainSections.map(([id, heading, body]) => (
				<section key={id} aria-labelledby={`about-${id}`} className="grid gap-2">
					<h2 id={`about-${id}`} className="text-2xl">
						{t(heading)}
					</h2>
					<p>{t(body)}</p>
				</section>
			))}
			{/* The footer's "Meld feil" link lands here. The address is plain text so it can be
			    copied on a device with no mail app, where a bare mailto: link does nothing. */}
			<section aria-labelledby="meld-feil" className="grid gap-2">
				<h2 id="meld-feil" className="text-2xl">
					{t("about.reportHeading")}
				</h2>
				<p>
					{beforeAddress}
					<strong className="select-all">{REPORT_ADDRESS}</strong>
					{afterAddress}
				</p>
				<p>
					<a
						href={generalReportHref(t("about.reportSubject"))}
						className="inline-flex min-h-11 items-center"
					>
						{t("about.reportLink")}
					</a>
				</p>
			</section>
			<section aria-labelledby="about-privacy" className="grid gap-2">
				<h2 id="about-privacy" className="text-2xl">
					{t("about.privacyHeading")}
				</h2>
				<p>{t("about.privacyBody")}</p>
			</section>
			<section aria-labelledby="about-source" className="grid gap-2">
				<h2 id="about-source" className="text-2xl">
					{t("about.sourceHeading")}
				</h2>
				<p>{t("about.sourceBody")}</p>
				<p>
					<a
						href="https://github.com/malinfossum/varde"
						rel="noopener noreferrer"
						className="inline-flex min-h-11 items-center"
					>
						{t("footer.source")}
					</a>
				</p>
			</section>
			<p className="text-sm text-muted">{t("about.updated").replace("{date}", ABOUT_UPDATED)}</p>
		</article>
	)
}
```

- [ ] **Step 7: Run the tests**

Run: `npx vitest run tests/about.test.tsx tests/contactActions.test.ts tests/detail.test.tsx tests/axe.test.tsx tests/i18n.test.tsx`
Expected: PASS.

- [ ] **Step 8: Show the section test red once**

Temporarily delete the `liability` row from `plainSections`. Run `npx vitest run tests/about.test.tsx`. Expected: FAIL, the heading list lacks "Ansvar". Restore; PASS. Note it for the PR.

- [ ] **Step 9: Commit**

```bash
npm test && npx biome ci .
git add src/components/AboutPage.tsx src/services/contactActions.ts src/i18n tests/about.test.tsx tests/contactActions.test.ts tests/detail.test.tsx tests/axe.test.tsx ../README.md
git commit -m "feat: write the Om Varde page with liability, privacy and error reports"
```

### Task 5: Footer on every page, reflow check, and PR 2

**Files:**
- Modify: `web/src/components/Footer.tsx`, `web/src/i18n/nb.json`, `web/src/i18n/en.json`
- Test: `web/tests/footer.test.tsx` (create), `web/e2e/reflow.spec.ts` (create)

**Interfaces:**
- Consumes: `emergencyLines`, `telHref` from `services/emergency.ts`; `pathFor` from `services/urlState.ts`; `Link`.
- Produces: footer markup PR 4's fit check measures (two rows, each 44 px tall).

- [ ] **Step 1: Write the failing tests**

Create `web/tests/footer.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react"
import { afterEach, expect, test } from "vitest"
import { App } from "../src/App.tsx"
import { stubDataFiles } from "./stubData.ts"

afterEach(() => {
	window.history.replaceState(null, "", "/")
})

test.each(["/", "/sok", "/om", "/nope"])(
	"%s carries the liability line and the footer links",
	(path) => {
		stubDataFiles()
		window.history.replaceState(null, "", path)
		render(<App />)
		const footer = screen.getByRole("contentinfo")
		expect(footer).toHaveTextContent(
			"Varde er en oversikt, ikke en nødtjeneste. Ved fare for liv, ring 113."
		)
		expect(within(footer).getByRole("link", { name: "113" })).toHaveAttribute("href", "tel:113")
		expect(within(footer).getByRole("link", { name: "Om Varde og ansvar" })).toHaveAttribute(
			"href",
			"/om"
		)
		expect(within(footer).getByRole("link", { name: "Meld feil" })).toHaveAttribute(
			"href",
			"/om#meld-feil"
		)
		expect(within(footer).getByRole("link", { name: "Kildekode på GitHub" })).toBeInTheDocument()
		expect(footer).toHaveTextContent("Ingen sporing. Ingen informasjonskapsler.")
	}
)

test("the English footer links stay in English", () => {
	stubDataFiles()
	window.history.replaceState(null, "", "/en/")
	render(<App />)
	const footer = screen.getByRole("contentinfo")
	expect(footer).toHaveTextContent(
		"Varde is a directory, not an emergency service. If a life is in danger, call 113."
	)
	expect(within(footer).getByRole("link", { name: "Report an error" })).toHaveAttribute(
		"href",
		"/en/om#meld-feil"
	)
	expect(within(footer).getByRole("link", { name: "About Varde and liability" })).toHaveAttribute(
		"href",
		"/en/om"
	)
})
```

Create `web/e2e/reflow.spec.ts` (it also guards Review Focus item 5 for every later PR):

```ts
import { expect, test } from "@playwright/test"
import { noHorizontalScroll, setTheme, THEMES } from "./helpers.ts"

const paths = ["/", "/en/", "/sok", "/en/sok", "/resources/1", "/en/resources/1", "/om", "/en/om"]

test.use({ viewport: { width: 320, height: 700 } })

for (const theme of THEMES) {
	for (const path of paths) {
		test(`${path} reflows at 320 px without horizontal scroll (${theme})`, async ({ page }) => {
			await setTheme(page, theme)
			await page.goto(path)
			await page.evaluate(() => document.fonts.ready)
			expect(await noHorizontalScroll(page)).toBe(true)
		})
	}
}
```

- [ ] **Step 2: Run the unit test to see it fail**

Run: `npx vitest run tests/footer.test.tsx`
Expected: FAIL, no liability text and no About link.

- [ ] **Step 3: The strings**

In `web/src/i18n/nb.json` add:

```json
	"footer.liability": "Varde er en oversikt, ikke en nødtjeneste. Ved fare for liv, ring",
	"footer.about": "Om Varde og ansvar",
	"footer.report": "Meld feil",
```

In `web/src/i18n/en.json` add:

```json
	"footer.liability": "Varde is a directory, not an emergency service. If a life is in danger, call",
	"footer.about": "About Varde and liability",
	"footer.report": "Report an error",
```

- [ ] **Step 4: The footer**

Replace `web/src/components/Footer.tsx` with:

```tsx
import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { emergencyLines, telHref } from "../services/emergency.ts"
import { pathFor } from "../services/urlState.ts"
import { Link } from "./Link.tsx"

// 113 comes from emergency.ts, which tests/emergency.test.ts checks against the seed.
const ambulance = emergencyLines.find((line) => line.id === "ambulanse")

export function Footer() {
	const t = useTranslation()
	const { lang } = useLanguage()
	return (
		<footer className="mt-6 border-t border-border">
			<div className="mx-auto grid max-w-6xl gap-1 px-4 py-3 text-sm text-muted">
				<p>
					{t("footer.liability")}{" "}
					{ambulance && (
						<a
							href={telHref(ambulance.phone)}
							className="inline-flex min-h-11 min-w-11 items-center justify-center font-semibold"
						>
							{ambulance.phone}
						</a>
					)}
					.
				</p>
				<p className="flex flex-wrap items-center gap-x-4">
					<Link to="/om" className="inline-flex min-h-11 items-center">
						{t("footer.about")}
					</Link>
					{/* A plain anchor, not <Link>: Link navigates by pathname and search only, so the
					    #meld-feil hash would be lost. A full load of the prerendered /om page lets the
					    browser scroll to the id itself. */}
					<a
						href={`${pathFor(lang, "/om")}#meld-feil`}
						className="inline-flex min-h-11 items-center"
					>
						{t("footer.report")}
					</a>
					<a
						href="https://github.com/malinfossum/varde"
						rel="noopener noreferrer"
						className="inline-flex min-h-11 items-center"
					>
						{t("footer.source")}
					</a>
					<span>{t("footer.noTracking")}</span>
				</p>
			</div>
		</footer>
	)
}
```

- [ ] **Step 5: Run unit and browser checks**

```bash
npx vitest run tests/footer.test.tsx
npm run build && npx playwright test
```

Expected: vitest PASS; Playwright `18 passed` (2 smoke + 16 reflow, 8 paths in both themes).

- [ ] **Step 6: Show both red once**

Unit: in `Footer.tsx` change ``href={`${pathFor(lang, "/om")}#meld-feil`}`` to `href={pathFor(lang, "/om")}`; `npx vitest run tests/footer.test.tsx` FAILS; restore.
Browser: append `min-w-[400px]` to the existing `className` of the footer's inner `<div>`, rebuild, `npx playwright test reflow` FAILS on every path; restore and rebuild.

- [ ] **Step 7: Commit**

```bash
npm test && npx biome ci .
git add src/components/Footer.tsx src/i18n tests/footer.test.tsx e2e/reflow.spec.ts
git commit -m "feat: add the liability line and About links to the footer"
```

- [ ] **Step 8: Ship PR 2**

Blocked until both Open items for PR 2 are done (the alias is in the code, Cloudflare Web Analytics confirmed off). Follow "Shipping a PR" with title `feat: Om Varde page, liability footer and Meld feil`. Red proofs: Task 3 Step 8, Task 4 Step 8, Task 5 Step 6. Manual before merge: "Malin reads the About text in both languages."

---

# PR 3: `feat/header`

### Task 6: Header nav links and the header layout

**Files:**
- Create: `web/src/services/externalLinks.ts`
- Modify: `web/src/services/hints.ts`, `web/src/components/Link.tsx`, `web/src/components/Header.tsx`, `web/src/styles/main.css`, `web/src/i18n/nb.json`, `web/src/i18n/en.json`
- Test: `web/tests/header.test.tsx` (create)

**Interfaces:**
- Consumes: `Link`.
- Produces: `Link` gains an optional `aria-label` prop, passed to its `<a>`. `HELSENORGE_URL`, `NAV_URL` (strings) from `services/externalLinks.ts`. Header DOM: `.header-row` > brand link, `nav.header-nav`, `div.header-tools`. Tasks 8 to 10 swap the contents of `.header-tools`; Task 20 adds the back arrow before the brand.

- [ ] **Step 1: Branch**

```bash
git switch main && git pull && git switch -c feat/header
```

- [ ] **Step 2: Write the failing tests**

Create `web/tests/header.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react"
import { afterEach, expect, test } from "vitest"
import { App } from "../src/App.tsx"
import { HELSENORGE_URL, NAV_URL } from "../src/services/externalLinks.ts"
import { stubDataFiles } from "./stubData.ts"

afterEach(() => {
	window.history.replaceState(null, "", "/")
})

test("the official URLs are pinned (checked live 2026-10-02)", () => {
	expect(HELSENORGE_URL).toBe("https://www.helsenorge.no")
	expect(NAV_URL).toBe("https://www.nav.no")
})

test("the header nav links to all services, Helsenorge and NAV, the last two marked external", () => {
	stubDataFiles()
	render(<App />)
	const nav = screen.getByRole("navigation", { name: "Hovedmeny" })
	expect(within(nav).getByRole("link", { name: "Alle tjenester" })).toHaveAttribute("href", "/sok")
	expect(within(nav).getByRole("link", { name: "Helsenorge (ekstern side)" })).toHaveAttribute(
		"href",
		HELSENORGE_URL
	)
	expect(within(nav).getByRole("link", { name: "NAV (ekstern side)" })).toHaveAttribute(
		"href",
		NAV_URL
	)
})

test("the English nav keeps the language prefix and says external in English", () => {
	stubDataFiles()
	window.history.replaceState(null, "", "/en/")
	render(<App />)
	const nav = screen.getByRole("navigation", { name: "Main menu" })
	expect(within(nav).getByRole("link", { name: "All services" })).toHaveAttribute("href", "/en/sok")
	expect(within(nav).getByRole("link", { name: "NAV (external site)" })).toBeInTheDocument()
})

// Link used to drop aria-label without a type error (TypeScript accepts any hyphenated
// prop), so the brand link was named "Varde" only. This pins the name in both languages.
test("the brand link is named for where it goes", () => {
	stubDataFiles()
	render(<App />)
	expect(screen.getByRole("link", { name: "Varde, til forsiden" })).toHaveAttribute("href", "/")
})

test("the English brand link is named in English", () => {
	stubDataFiles()
	window.history.replaceState(null, "", "/en/")
	render(<App />)
	expect(screen.getByRole("link", { name: "Varde, home page" })).toHaveAttribute("href", "/en/")
})
```

- [ ] **Step 3: Run to see it fail**

Run: `npx vitest run tests/header.test.tsx`
Expected: FAIL, `externalLinks.ts` does not exist. Once Step 4 adds it, the two brand link tests still FAIL until Step 5 (the name is "Varde").

- [ ] **Step 4: The URLs**

Create `web/src/services/externalLinks.ts`:

```ts
// Official homepages, checked live on 2026-10-02 (both answer 200 at these addresses).
// tests/header.test.tsx pins them; change one only after checking the site itself.
export const HELSENORGE_URL = "https://www.helsenorge.no"
export const NAV_URL = "https://www.nav.no"
```

In `web/src/services/hints.ts`, add `import { HELSENORGE_URL } from "./externalLinks.ts"` as the first line, above the `./match.ts` import (Biome's import order), and change the entry's `href: "https://www.helsenorge.no",` to `href: HELSENORGE_URL,` (same value).

- [ ] **Step 5: The strings**

`web/src/i18n/nb.json`:

```json
	"header.navLabel": "Hovedmeny",
	"header.allServices": "Alle tjenester",
	"header.external": "(ekstern side)",
```

`web/src/i18n/en.json`:

```json
	"header.navLabel": "Main menu",
	"header.allServices": "All services",
	"header.external": "(external site)",
```

In the same two files, change the existing `header.home` value (a dash read aloud varies by NVDA punctuation level; a comma pauses the same at every level):

```json
	"header.home": "Varde, til forsiden",
```

```json
	"header.home": "Varde, home page",
```

In `web/src/components/Link.tsx`, add `"aria-label": ariaLabel,` to the destructured props after `onNavigate,`, add `"aria-label"?: string` to the props type after `onNavigate?: () => void`, and pass it on: `<a href={href} className={className} aria-label={ariaLabel} hrefLang={lang} lang={lang} onClick={onClick}>`.

- [ ] **Step 6: The header**

Replace `web/src/components/Header.tsx` with:

```tsx
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { HELSENORGE_URL, NAV_URL } from "../services/externalLinks.ts"
import { BrandMark } from "./BrandMark.tsx"
import { LanguageToggle } from "./LanguageToggle.tsx"
import { Link } from "./Link.tsx"
import { QuickExit } from "./QuickExit.tsx"
import { ThemeToggle } from "./ThemeToggle.tsx"

// Same tab on purpose (spec: Header). The arrow is decoration; the hidden text says it.
function ExternalMark() {
	const t = useTranslation()
	return (
		<>
			<span aria-hidden="true">↗</span>
			{/* No leading space: the space before <ExternalMark /> in the link already separates
			    the words, so the name reads "Helsenorge (ekstern side)" with one space. */}
			<span className="visually-hidden">{t("header.external")}</span>
		</>
	)
}

export function Header() {
	const t = useTranslation()
	return (
		<header className="app-header border-b border-border bg-surface">
			{/* DOM order is the desktop order from the spec: brand, nav, pickers, exit. Under
			    1024 px the nav drops to a row of its own below (CSS order), and under 768 px the
			    tools wrap below the brand too (three rows, measured), so a phone's keyboard order
			    runs brand, nav, then the rows above; I keep one DOM order rather than two.
			    flex-wrap keeps 320 px free of horizontal scroll, and every control keeps 44 px. */}
			<div className="header-row mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2">
				<Link
					to="/"
					className="inline-flex min-h-11 items-center gap-2 font-display text-lg text-fg no-underline"
					aria-label={t("header.home")}
				>
					<BrandMark className="h-8 w-8 text-accent" />
					<span>Varde</span>
				</Link>
				<nav aria-label={t("header.navLabel")} className="header-nav">
					<Link to="/sok" className="nav-link">
						{t("header.allServices")}
					</Link>
					<a href={HELSENORGE_URL} className="nav-link">
						Helsenorge <ExternalMark />
					</a>
					<a href={NAV_URL} className="nav-link">
						NAV <ExternalMark />
					</a>
				</nav>
				<div className="header-tools">
					<LanguageToggle />
					<ThemeToggle />
					<QuickExit />
				</div>
			</div>
		</header>
	)
}
```

Append inside `@layer components` in `web/src/styles/main.css`, after the `.app-header` media block:

```css
	.header-nav {
		order: 3;
		display: flex;
		flex-basis: 100%;
		flex-wrap: wrap;
		gap: 0 0.25rem;
	}
	.nav-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		min-height: 44px;
		padding: 0 0.5rem;
		border-radius: 0.5rem;
		color: var(--text);
		font-weight: 500;
		text-decoration: none;
	}
	.nav-link:hover {
		text-decoration: underline;
	}
	.header-tools {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-inline-start: auto;
	}
	@media (min-width: 1024px) {
		.header-nav {
			order: 0;
			flex-basis: auto;
		}
	}
```

- [ ] **Step 7: Run, show red once, commit**

Run: `npx vitest run tests/header.test.tsx tests/hints.test.tsx`. Expected: PASS.
Red proofs: change `NAV_URL` to `"https://nav.no"`; the pin test FAILS; restore. Remove `aria-label={ariaLabel}` from the `<a>` in `Link.tsx`; both brand link tests FAIL (the name is "Varde"); restore.

```bash
npm test && npx biome ci .
git add src/services/externalLinks.ts src/services/hints.ts src/components/Link.tsx src/components/Header.tsx src/styles/main.css src/i18n tests/header.test.tsx
git commit -m "feat: add Alle tjenester, Helsenorge and NAV links to the header, and pass aria-label through Link"
```

### Task 7: The picker shell (`usePicker`, `Picker`, icons, ported CSS)

**Files:**
- Create: `web/src/hooks/usePicker.ts`, `web/src/components/Picker.tsx`, `web/src/components/icons.tsx`
- Modify: `web/src/styles/main.css`
- Test: `web/tests/picker.test.tsx` (create)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `usePicker(): { ref: RefObject<HTMLDetailsElement | null>; onToggle(): void; onKeyDown(event: KeyboardEvent<HTMLDetailsElement>): void; onBlur(event: FocusEvent<HTMLDetailsElement>): void; closeAndFocus(): void }`
  - `Picker(props: { name: string; value: string | null; icon: ReactNode; children: (closeAndFocus: () => void) => ReactNode })`. The trigger's accessible name is `"<name>: <value>"`, or `name` alone while `value` is `null`. Rows carry `className="picker-row"`; the active row carries `aria-current` or `aria-pressed="true"`.
  - Icons, all `aria-hidden`, `currentColor`, 20 px: `GlobeIcon`, `CheckIcon`, `SunIcon`, `MoonIcon`, `SystemIcon`, `ArrowLeftIcon`, each `(props: { className?: string }) => JSX.Element`.

- [ ] **Step 1: Write the failing tests**

Create `web/tests/picker.test.tsx`:

```tsx
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, test } from "vitest"
import { Picker } from "../src/components/Picker.tsx"

function Harness() {
	return (
		<>
			<Picker name="Første" value="B" icon={<span />}>
				{(closeAndFocus) =>
					["A", "B", "C"].map((v) => (
						<button
							key={v}
							type="button"
							className="picker-row"
							aria-pressed={v === "B"}
							onClick={closeAndFocus}
						>
							{v}
						</button>
					))
				}
			</Picker>
			<Picker name="Andre" value={null} icon={<span />}>
				{(closeAndFocus) =>
					["X", "Y"].map((v) => (
						<button key={v} type="button" className="picker-row" onClick={closeAndFocus}>
							{v}
						</button>
					))
				}
			</Picker>
			<button type="button">Utenfor</button>
		</>
	)
}

const trigger = (name: string) =>
	screen.getByText(name, { selector: ".visually-hidden" }).closest("summary") as HTMLElement
const details = (name: string) => trigger(name).parentElement as HTMLDetailsElement

async function open(user: ReturnType<typeof userEvent.setup>, name: string) {
	await user.click(trigger(name))
	await waitFor(() => expect(details(name).open).toBe(true))
}

test("the trigger names the setting and its value, or the setting alone before a value exists", () => {
	render(<Harness />)
	expect(trigger("Første: B")).toBeInTheDocument()
	expect(trigger("Andre")).toBeInTheDocument()
	expect(screen.getByRole("group", { name: "Første" })).toBeInTheDocument()
})

test("opening focuses the active row; arrows wrap; Home and End jump", async () => {
	const user = userEvent.setup()
	render(<Harness />)
	await open(user, "Første: B")
	await waitFor(() => expect(screen.getByRole("button", { name: "B" })).toHaveFocus())
	await user.keyboard("{ArrowDown}")
	expect(screen.getByRole("button", { name: "C" })).toHaveFocus()
	await user.keyboard("{ArrowDown}")
	expect(screen.getByRole("button", { name: "A" })).toHaveFocus()
	await user.keyboard("{ArrowUp}")
	expect(screen.getByRole("button", { name: "C" })).toHaveFocus()
	await user.keyboard("{Home}")
	expect(screen.getByRole("button", { name: "A" })).toHaveFocus()
	await user.keyboard("{End}")
	expect(screen.getByRole("button", { name: "C" })).toHaveFocus()
})

test("with no active row, opening focuses the first row", async () => {
	const user = userEvent.setup()
	render(<Harness />)
	await open(user, "Andre")
	await waitFor(() => expect(screen.getByRole("button", { name: "X" })).toHaveFocus())
})

test("Escape closes and returns focus to the trigger", async () => {
	const user = userEvent.setup()
	render(<Harness />)
	await open(user, "Første: B")
	await user.keyboard("{Escape}")
	expect(details("Første: B").open).toBe(false)
	expect(trigger("Første: B")).toHaveFocus()
})

test("choosing a row closes the picker and returns focus to the trigger", async () => {
	const user = userEvent.setup()
	render(<Harness />)
	await open(user, "Første: B")
	await user.click(screen.getByRole("button", { name: "C" }))
	expect(details("Første: B").open).toBe(false)
	expect(trigger("Første: B")).toHaveFocus()
})

test("opening one picker closes the other", async () => {
	const user = userEvent.setup()
	render(<Harness />)
	await open(user, "Første: B")
	act(() => {
		details("Andre").open = true
	})
	await waitFor(() => expect(details("Første: B").open).toBe(false))
})

test("a pointer press outside closes it", async () => {
	const user = userEvent.setup()
	render(<Harness />)
	await open(user, "Første: B")
	await user.click(screen.getByRole("button", { name: "Utenfor" }))
	expect(details("Første: B").open).toBe(false)
})

test("focus leaving the picker closes it", async () => {
	const user = userEvent.setup()
	render(<Harness />)
	await open(user, "Første: B")
	await user.keyboard("{End}")
	await user.tab()
	expect(details("Første: B").open).toBe(false)
})
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run tests/picker.test.tsx`
Expected: FAIL, `Picker.tsx` does not exist.

- [ ] **Step 3: The hook**

Create `web/src/hooks/usePicker.ts`:

```ts
import { type FocusEvent, type KeyboardEvent, useCallback, useEffect, useRef } from "react"

// Behaviour ported from Workbench DS 3.8.0 components/picker.js. Workbench binds one set of
// listeners to the document from a classic script; Varde is React with a prerendered DOM and a
// CSP that hashes its one inline script, so the same rules live here, per picker. The edge
// shift below is the one inline style, set after mount, never in rendered markup.
const EDGE_GAP = 8
const KEYS = ["ArrowDown", "ArrowUp", "Home", "End"]

export function usePicker() {
	const ref = useRef<HTMLDetailsElement>(null)

	useEffect(() => {
		const onPointerDown = (event: PointerEvent) => {
			const details = ref.current
			if (details?.open && !details.contains(event.target as Node)) details.open = false
		}
		document.addEventListener("pointerdown", onPointerDown)
		return () => document.removeEventListener("pointerdown", onPointerDown)
	}, [])

	const rows = () => Array.from(ref.current?.querySelectorAll<HTMLElement>(".picker-row") ?? [])

	const closeAndFocus = useCallback(() => {
		const details = ref.current
		if (!details) return
		details.open = false
		details.querySelector("summary")?.focus()
	}, [])

	const onToggle = () => {
		const details = ref.current
		if (!details) return
		const list = details.querySelector<HTMLElement>(".picker-list")
		if (list) list.style.translate = ""
		if (!details.open) return
		for (const other of document.querySelectorAll<HTMLDetailsElement>("details.picker[open]")) {
			if (other !== details) other.open = false
		}
		if (list) {
			const overflow = EDGE_GAP - list.getBoundingClientRect().left
			if (overflow > 0) list.style.translate = `${overflow}px 0`
		}
		const all = rows()
		const active = all.find(
			(row) => row.hasAttribute("aria-current") || row.getAttribute("aria-pressed") === "true"
		)
		;(active ?? all[0])?.focus()
	}

	const onKeyDown = (event: KeyboardEvent<HTMLDetailsElement>) => {
		if (!ref.current?.open) return
		if (event.key === "Escape") {
			event.preventDefault()
			closeAndFocus()
			return
		}
		if (!KEYS.includes(event.key)) return
		event.preventDefault()
		const all = rows()
		if (all.length === 0) return
		const at = all.indexOf(document.activeElement as HTMLElement)
		let next: number
		if (event.key === "Home") next = 0
		else if (event.key === "End") next = all.length - 1
		else {
			const step = event.key === "ArrowDown" ? 1 : -1
			next = at === -1 ? (step === 1 ? 0 : all.length - 1) : (at + step + all.length) % all.length
		}
		all[next].focus()
	}

	// A null relatedTarget (the window lost focus) is left to the pointer-down handler.
	const onBlur = (event: FocusEvent<HTMLDetailsElement>) => {
		const details = ref.current
		const to = event.relatedTarget
		if (details?.open && to instanceof Node && !details.contains(to)) details.open = false
	}

	return { ref, onToggle, onKeyDown, onBlur, closeAndFocus }
}
```

- [ ] **Step 4: The icons**

Create `web/src/components/icons.tsx`:

```tsx
import type { ReactNode } from "react"

// Plain stroke icons drawn for Varde on a 24-unit grid. Decorative at every use: the text
// beside them, or a visually hidden name, carries the meaning.
type IconProps = { className?: string }

function Svg({ className, children }: IconProps & { children: ReactNode }) {
	return (
		<svg
			className={className}
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			focusable="false"
		>
			{children}
		</svg>
	)
}

export function GlobeIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<circle cx="12" cy="12" r="9" />
			<ellipse cx="12" cy="12" rx="4" ry="9" />
			<path d="M3 12h18" />
		</Svg>
	)
}

export function CheckIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<path d="M5 12.5l4.5 4.5L19 7.5" />
		</Svg>
	)
}

export function SunIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
		</Svg>
	)
}

export function MoonIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
		</Svg>
	)
}

export function SystemIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<rect x="3" y="4" width="18" height="12" rx="2" />
			<path d="M8 20h8M12 16v4" />
		</Svg>
	)
}

export function ArrowLeftIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<path d="M19 12H5M11 18l-6-6 6-6" />
		</Svg>
	)
}
```

- [ ] **Step 5: The shell**

Create `web/src/components/Picker.tsx`:

```tsx
import type { ReactNode } from "react"
import { usePicker } from "../hooks/usePicker.ts"

// The Workbench DS 3.8.0 picker (components/picker.css, same markup and class names): a native
// <details>, so the menu opens and closes before hydration and without JavaScript. The trigger
// carries its name once, in the visually hidden span; the icon and the short visible value are
// aria-hidden so the name is never read twice.
export function Picker({
	name,
	value,
	icon,
	children,
}: {
	name: string
	value: string | null
	icon: ReactNode
	children: (closeAndFocus: () => void) => ReactNode
}) {
	const { ref, onToggle, onKeyDown, onBlur, closeAndFocus } = usePicker()
	return (
		<details ref={ref} className="picker" onToggle={onToggle} onKeyDown={onKeyDown} onBlur={onBlur}>
			<summary className="btn-secondary min-w-11">
				<span aria-hidden="true" className="inline-flex">
					{icon}
				</span>
				<span aria-hidden="true" className="picker-value">
					{value ?? name}
				</span>
				<span className="visually-hidden">{value ? `${name}: ${value}` : name}</span>
			</summary>
			{/* biome-ignore lint/a11y/useSemanticElements: Workbench picker markup; a fieldset would bring its own UA box styles into the ported CSS */}
			<div className="picker-list" role="group" aria-label={name}>
				{children(closeAndFocus)}
			</div>
		</details>
	)
}
```

If `npx biome lint` flags the handlers on `<details>` (a native interactive element), add a `biome-ignore` comment on the line above the opening tag, using the exact rule name Biome prints and the reason "native disclosure; the handlers port Workbench picker.js".

- [ ] **Step 6: The ported CSS**

Append inside `@layer components` in `web/src/styles/main.css`:

```css
	/* Preference picker, ported from Workbench DS 3.8.0 components/picker.css: same markup and
	   class names; behaviour lives in hooks/usePicker.ts. Workbench tokens mapped to Varde's:
	   surface-2 to surface, border-strong to border, surface-4 (hover) to a text tint. */
	.picker {
		position: relative;
		display: inline-block;
	}
	.picker > summary {
		list-style: none;
		cursor: pointer;
	}
	.picker > summary::-webkit-details-marker {
		display: none;
	}
	.picker-value {
		display: none;
	}
	@media (min-width: 768px) {
		.picker-value {
			display: inline;
		}
	}
	.picker-list {
		position: absolute;
		inset-block-start: calc(100% + 0.25rem);
		inset-inline-end: 0;
		z-index: 30;
		display: grid;
		inline-size: max-content;
		min-inline-size: min(12rem, 100vw - 2rem);
		max-inline-size: min(22rem, 100vw - 2rem);
		max-block-size: min(60vh, 24rem);
		overflow-y: auto;
		padding: 0.25rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 0.75rem;
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.16);
	}
	.picker-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		inline-size: 100%;
		min-height: 2.75rem;
		padding: 0.5rem 0.75rem;
		border: 0;
		border-radius: 0.5rem;
		background: transparent;
		color: var(--text);
		font: inherit;
		text-align: start;
		text-decoration: none;
		overflow-wrap: anywhere;
		cursor: pointer;
	}
	.picker-row:hover {
		background: color-mix(in srgb, var(--text) 6%, transparent);
	}
	.picker-row[aria-current],
	.picker-row[aria-pressed="true"] {
		background: var(--accent-soft);
		font-weight: 600;
	}
	.picker-code {
		flex-shrink: 0;
		inline-size: 3ch;
		font-size: 0.875rem;
		color: var(--muted);
	}
	.picker-check {
		margin-inline-start: auto;
	}
	@media (forced-colors: active) {
		.picker-row[aria-current],
		.picker-row[aria-pressed="true"] {
			forced-color-adjust: none;
			background: Highlight;
			color: HighlightText;
		}
	}
```

- [ ] **Step 7: Run, show red once, commit**

Run: `npx vitest run tests/picker.test.tsx`. Expected: PASS (8 tests).
Red proof: in `usePicker.ts` change `(at + step + all.length) % all.length` to `Math.min(at + step, all.length - 1)`; the arrows test FAILS (no wrap); restore.

```bash
npm test && npx biome ci .
git add src/hooks/usePicker.ts src/components/Picker.tsx src/components/icons.tsx src/styles/main.css tests/picker.test.tsx
git commit -m "feat: port the Workbench picker as a hook and a details shell"
```

### Task 8: Language picker

**Files:**
- Create: `web/src/i18n/languages.ts`, `web/src/components/LanguagePicker.tsx`
- Modify: `web/src/components/Link.tsx`, `web/src/components/Header.tsx`, `web/src/i18n/nb.json`, `web/src/i18n/en.json`; the comments naming `LanguageToggle` in `web/src/components/StatusRegion.tsx` and `web/src/navigation.ts`
- Delete: `web/src/components/LanguageToggle.tsx`
- Test: `web/tests/languagePicker.test.tsx` (create), `web/tests/shell.test.tsx`

**Interfaces:**
- Consumes: `Picker`, `GlobeIcon`, `CheckIcon` (Task 7); `Link`; `translate`, `LANG_STORAGE_KEY`, `useLanguage`, `useTranslation`; `useAnnounce`; `useCurrentUrl`; `parseUrl`, `routePath`.
- Produces: `LANGUAGES: readonly { code: Lang; name: string; short: string }[]` from `src/i18n/languages.ts`. `Link` accepts `"aria-current"?: "page"`.

- [ ] **Step 1: Write the failing tests**

Create `web/tests/languagePicker.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import { afterEach, expect, test } from "vitest"
import { App } from "../src/App.tsx"
import { render as prerender } from "../src/entry-server.tsx"
import { stubDataFiles } from "./stubData.ts"

afterEach(() => {
	window.history.replaceState(null, "", "/")
})

test("the trigger says Språk: Norsk, and each row carries its own lang and the current mark", () => {
	stubDataFiles()
	render(<App />)
	expect(screen.getByText("Språk: Norsk", { selector: ".visually-hidden" })).toBeInTheDocument()
	const norsk = screen.getByRole("link", { name: "Norsk" })
	const english = screen.getByRole("link", { name: "English" })
	expect(norsk).toHaveAttribute("aria-current", "page")
	expect(norsk).toHaveAttribute("lang", "nb")
	expect(norsk).toHaveAttribute("href", "/")
	expect(english).not.toHaveAttribute("aria-current")
	expect(english).toHaveAttribute("lang", "en")
	expect(english).toHaveAttribute("href", "/en/")
})

test("the prerendered header has the picker and real links, so it works before JavaScript", async () => {
	const { html } = await prerender("/sok", {})
	expect(html).toContain('<details class="picker"')
	expect(html).toMatch(/<a[^>]+href="\/en\/sok"/)
})
```

In `web/tests/shell.test.tsx`, replace the test "the toggle links to the same page in the other language, dropping page, and remembers the choice" with:

```tsx
test("choosing a language goes to the same page in it, drops page, remembers it and refocuses the trigger", async () => {
	stubDataFiles()
	window.history.pushState(null, "", "/sok?search=nav&page=2")
	render(<App />)
	const english = screen.getByRole("link", { name: "English" })
	expect(english).toHaveAttribute("href", "/en/sok?search=nav")
	expect(english).toHaveAttribute("hreflang", "en")
	expect(english).toHaveAttribute("lang", "en")
	await userEvent.click(english)
	expect(window.location.pathname).toBe("/en/sok")
	expect(localStorage.getItem("varde.lang")).toBe("en")
	// Focus goes back to the trigger, whose name now carries the new value (spec: Names and
	// state for both pickers).
	expect(document.activeElement?.tagName).toBe("SUMMARY")
	expect(document.activeElement).toHaveTextContent("Language: English")
	expect(screen.getByText(/Language is now English/)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run tests/languagePicker.test.tsx tests/shell.test.tsx`
Expected: FAIL (no "Språk: Norsk"; focus stays on the link).

- [ ] **Step 3: The language list and the strings**

Create `web/src/i18n/languages.ts`:

```ts
import type { Lang } from "../services/urlState.ts"

// Every language Varde ships, in menu order. A new language is one entry here, its strings
// file and its URL prefix (services/urlState.ts). No flags: a flag names a country, not a
// language.
export const LANGUAGES: readonly { code: Lang; name: string; short: string }[] = [
	{ code: "nb", name: "Norsk", short: "NO" },
	{ code: "en", name: "English", short: "EN" },
]
```

`nb.json`: `"header.language": "Språk",` and `en.json`: `"header.language": "Language",`.

- [ ] **Step 4: Let `Link` carry `aria-current`**

In `web/src/components/Link.tsx`, add the prop to the destructuring and the type:

```tsx
export function Link({
	to,
	lang,
	className,
	children,
	onNavigate,
	"aria-current": ariaCurrent,
}: {
	to: string
	lang?: Lang
	className?: string
	children: ReactNode
	onNavigate?: () => void
	"aria-current"?: "page"
}) {
```

and pass it to the anchor:

```tsx
		<a
			href={href}
			className={className}
			hrefLang={lang}
			lang={lang}
			aria-current={ariaCurrent}
			onClick={onClick}
		>
```

- [ ] **Step 5: The picker**

Create `web/src/components/LanguagePicker.tsx`:

```tsx
import {
	LANG_STORAGE_KEY,
	translate,
	useLanguage,
	useTranslation,
} from "../i18n/LanguageProvider.tsx"
import { LANGUAGES } from "../i18n/languages.ts"
import { useCurrentUrl } from "../navigation.ts"
import { parseUrl, routePath } from "../services/urlState.ts"
import { CheckIcon, GlobeIcon } from "./icons.tsx"
import { Link } from "./Link.tsx"
import { Picker } from "./Picker.tsx"
import { useAnnounce } from "./StatusRegion.tsx"

export function LanguagePicker() {
	const { lang } = useLanguage()
	const t = useTranslation()
	const announce = useAnnounce()
	const { pathname, search } = useCurrentUrl()
	// A different language can change the result set entirely, so a switch resets paging the
	// same way a search or filter change does (spec).
	const params = new URLSearchParams(search)
	params.delete("page")
	const query = params.toString()
	const to = `${routePath(parseUrl(pathname).route)}${query ? `?${query}` : ""}`
	const current = LANGUAGES.find((language) => language.code === lang) ?? LANGUAGES[0]
	return (
		<Picker name={t("header.language")} value={current.name} icon={<GlobeIcon />}>
			{(closeAndFocus) =>
				LANGUAGES.map((language) => {
					const isCurrent = language.code === lang
					return (
						<Link
							key={language.code}
							to={to}
							lang={language.code}
							className="picker-row"
							aria-current={isCurrent ? "page" : undefined}
							onNavigate={() => {
								try {
									localStorage.setItem(LANG_STORAGE_KEY, language.code)
								} catch {}
								// Announced in the language being switched to: useTranslation() would
								// still read the old one until the re-render lands.
								if (!isCurrent) announce(translate(language.code, "status.langChanged"))
								closeAndFocus()
							}}
						>
							<span>{language.name}</span>
							<span className="picker-code" aria-hidden="true">
								{language.short}
							</span>
							{isCurrent && <CheckIcon className="picker-check" />}
						</Link>
					)
				})
			}
		</Picker>
	)
}
```

In `Header.tsx`, replace the `LanguageToggle` import and element with `import { LanguagePicker } from "./LanguagePicker.tsx"` and `<LanguagePicker />`. Delete `web/src/components/LanguageToggle.tsx`. In `StatusRegion.tsx` and `navigation.ts`, change the word `LanguageToggle` in the comments to `LanguagePicker`.

- [ ] **Step 6: Run, show red once, commit**

Run: `npm test`. Expected: PASS, including `race.test.tsx` (it still finds the "English" link).
Red proof: remove `closeAndFocus()` from `onNavigate`; the shell test FAILS on the focus line; restore.

```bash
npx biome ci .
git add -A src/i18n src/components src/navigation.ts tests/languagePicker.test.tsx tests/shell.test.tsx
git commit -m "feat: replace the language toggle with the Workbench language picker"
```

### Task 9: Theme picker (Lyst, Mørkt, System)

**Files:**
- Modify: `web/src/services/theme.ts`, `web/src/components/Header.tsx`, `web/src/i18n/nb.json`, `web/src/i18n/en.json`
- Create: `web/src/hooks/useThemeChoice.ts`, `web/src/components/ThemePicker.tsx`
- Delete: `web/src/components/ThemeToggle.tsx`
- Test: `web/tests/themePicker.test.tsx` (create), `web/tests/theme.test.ts`, `web/tests/shell.test.tsx`

**Interfaces:**
- Consumes: `Picker`, `SunIcon`, `MoonIcon`, `SystemIcon`, `CheckIcon` (Task 7).
- Produces: in `services/theme.ts`: `type ThemeChoice = Theme | "system"`, `readChoice(storage): ThemeChoice`, `systemPrefersDark(): boolean`, `showChoice(choice: ThemeChoice): Theme` (sets `data-theme`, stores nothing), `chooseTheme(choice: ThemeChoice): Theme` (writes or removes the key, then shows). `applyTheme` and `currentTheme` are removed (their only users were `ThemeToggle` and `tests/theme.test.ts`). `useThemeChoice(): { state: { choice: ThemeChoice; theme: Theme } | null; choose(choice: ThemeChoice): void }`.

- [ ] **Step 1: Write the failing tests**

Create `web/tests/themePicker.test.tsx`:

```tsx
import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test } from "vitest"
import { App } from "../src/App.tsx"
import { render as prerender } from "../src/entry-server.tsx"
import { stubDataFiles } from "./stubData.ts"

// jsdom has no matchMedia. This fake lets a test flip the OS preference and fire "change".
function fakeOsTheme(dark: boolean) {
	const state = { matches: dark }
	const listeners = new Set<() => void>()
	const query = {
		get matches() {
			return state.matches
		},
		addEventListener: (_: string, fn: () => void) => listeners.add(fn),
		removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
	}
	window.matchMedia = (() => query) as unknown as typeof window.matchMedia
	return {
		set(next: boolean) {
			state.matches = next
			for (const fn of listeners) fn()
		},
	}
}

afterEach(() => {
	Reflect.deleteProperty(window, "matchMedia")
	document.documentElement.removeAttribute("data-theme")
})

const name = (text: string) => screen.getByText(text, { selector: ".visually-hidden" })

test("with nothing stored, the trigger says System and the resolved theme", () => {
	fakeOsTheme(false)
	stubDataFiles()
	render(<App />)
	expect(name("Tema: System (lyst)")).toBeInTheDocument()
	expect(screen.getByRole("button", { name: "System" })).toHaveAttribute("aria-pressed", "true")
})

test("Mørkt stores the choice, applies it and returns focus to the trigger", async () => {
	fakeOsTheme(false)
	stubDataFiles()
	render(<App />)
	await userEvent.click(screen.getByRole("button", { name: "Mørkt" }))
	expect(localStorage.getItem("theme")).toBe("dark")
	expect(document.documentElement.dataset.theme).toBe("dark")
	expect(name("Tema: Mørkt")).toBeInTheDocument()
	expect(document.activeElement?.tagName).toBe("SUMMARY")
})

test("System removes the key and follows the OS live", async () => {
	const os = fakeOsTheme(false)
	localStorage.setItem("theme", "light")
	stubDataFiles()
	render(<App />)
	await userEvent.click(screen.getByRole("button", { name: "System" }))
	expect(localStorage.getItem("theme")).toBeNull()
	act(() => os.set(true))
	expect(document.documentElement.dataset.theme).toBe("dark")
	expect(name("Tema: System (mørkt)")).toBeInTheDocument()
})

test("a choice made in another tab is followed here", () => {
	fakeOsTheme(false)
	stubDataFiles()
	render(<App />)
	act(() => {
		localStorage.setItem("theme", "dark")
		window.dispatchEvent(new StorageEvent("storage", { key: "theme" }))
	})
	expect(document.documentElement.dataset.theme).toBe("dark")
	expect(name("Tema: Mørkt")).toBeInTheDocument()
})

test("the prerendered trigger says only Tema, so hydration cannot mismatch", async () => {
	const { html } = await prerender("/", {})
	expect(html).toContain('<span class="visually-hidden">Tema</span>')
})
```

In `web/tests/theme.test.ts`, change the import to `import { chooseTheme, readStoredTheme, resolveTheme } from "../src/services/theme.ts"` and replace the `applyTheme` test with:

```ts
test("chooseTheme sets data-theme and survives a throwing storage", () => {
	const original = Object.getOwnPropertyDescriptor(window, "localStorage")
	Object.defineProperty(window, "localStorage", {
		configurable: true,
		get() {
			throw new Error("SecurityError")
		},
	})
	try {
		chooseTheme("dark")
		expect(document.documentElement.dataset.theme).toBe("dark")
	} finally {
		if (original) Object.defineProperty(window, "localStorage", original)
	}
})
```

In `web/tests/shell.test.tsx`, first test, replace `expect(screen.getByRole("button", { name: "Mørkt tema" })).toBeInTheDocument()` with:

```tsx
	expect(
		screen.getByText("Tema: System (lyst)", { selector: ".visually-hidden" })
	).toBeInTheDocument()
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run tests/themePicker.test.tsx tests/theme.test.ts tests/shell.test.tsx`
Expected: FAIL (`chooseTheme` not exported, no "Tema" trigger).

- [ ] **Step 3: The theme service**

Replace everything in `web/src/services/theme.ts` from `export function currentTheme` to the end of the file with:

```ts
export type ThemeChoice = Theme | "system"

export function readChoice(storage: Pick<Storage, "getItem"> | undefined): ThemeChoice {
	const stored = readStoredTheme(storage)
	return stored === "light" || stored === "dark" ? stored : "system"
}

export function systemPrefersDark(): boolean {
	return (
		typeof window.matchMedia === "function" &&
		window.matchMedia("(prefers-color-scheme: dark)").matches
	)
}

// Shows a choice without storing it: on mount, and when the OS or another tab changes.
export function showChoice(choice: ThemeChoice): Theme {
	const theme = resolveTheme(choice === "system" ? null : choice, systemPrefersDark())
	document.documentElement.dataset.theme = theme
	return theme
}

// Lyst and Mørkt store the choice; System removes the key, so the inline init script in
// index.html falls back to prefers-color-scheme on the next load. Same key as before, so the
// init script and its CSP hash do not change (spec: Theme picker).
export function chooseTheme(choice: ThemeChoice): Theme {
	try {
		if (choice === "system") window.localStorage.removeItem(STORAGE_KEY)
		else window.localStorage.setItem(STORAGE_KEY, choice)
	} catch {
		// Storage unavailable: the choice lives for this page only.
	}
	return showChoice(choice)
}
```

- [ ] **Step 4: The hook**

Create `web/src/hooks/useThemeChoice.ts`:

```ts
import { useEffect, useState } from "react"
import {
	chooseTheme,
	readChoice,
	showChoice,
	type Theme,
	type ThemeChoice,
} from "../services/theme.ts"

type ThemeState = { choice: ThemeChoice; theme: Theme }

// null until mount: the prerendered HTML cannot know the reader's theme, so the first render
// is the same on the server and in the browser, and the real value arrives in the effect.
export function useThemeChoice() {
	const [state, setState] = useState<ThemeState | null>(null)
	useEffect(() => {
		const sync = () => {
			const choice = readChoice(window.localStorage)
			setState({ choice, theme: showChoice(choice) })
		}
		sync()
		const media =
			typeof window.matchMedia === "function"
				? window.matchMedia("(prefers-color-scheme: dark)")
				: null
		// Follow the OS only while the choice is System.
		const onMedia = () => {
			if (readChoice(window.localStorage) === "system") sync()
		}
		// Another tab changed or cleared the key (a null key is storage.clear()).
		const onStorage = (event: StorageEvent) => {
			if (event.key === "theme" || event.key === null) sync()
		}
		media?.addEventListener("change", onMedia)
		window.addEventListener("storage", onStorage)
		return () => {
			media?.removeEventListener("change", onMedia)
			window.removeEventListener("storage", onStorage)
		}
	}, [])
	const choose = (choice: ThemeChoice) => setState({ choice, theme: chooseTheme(choice) })
	return { state, choose }
}
```

- [ ] **Step 5: The strings**

In `nb.json`, change `"header.themeDark": "Mørkt tema"` to `"Mørkt"` and `"header.themeLight": "Lyst tema"` to `"Lyst"`, and add:

```json
	"header.theme": "Tema",
	"header.themeSystem": "System",
	"header.themeResolvedLight": "lyst",
	"header.themeResolvedDark": "mørkt",
```

In `en.json`, change `"Dark theme"` to `"Dark"` and `"Light theme"` to `"Light"`, and add:

```json
	"header.theme": "Theme",
	"header.themeSystem": "System",
	"header.themeResolvedLight": "light",
	"header.themeResolvedDark": "dark",
```

- [ ] **Step 6: The picker**

Create `web/src/components/ThemePicker.tsx`:

```tsx
import { useThemeChoice } from "../hooks/useThemeChoice.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { CheckIcon, MoonIcon, SunIcon, SystemIcon } from "./icons.tsx"
import { Picker } from "./Picker.tsx"

const CHOICES = [
	{ choice: "light", key: "header.themeLight", Icon: SunIcon },
	{ choice: "dark", key: "header.themeDark", Icon: MoonIcon },
	{ choice: "system", key: "header.themeSystem", Icon: SystemIcon },
] as const

export function ThemePicker() {
	const t = useTranslation()
	const { state, choose } = useThemeChoice()
	let value: string | null = null
	if (state?.choice === "system") {
		const resolved = t(
			state.theme === "dark" ? "header.themeResolvedDark" : "header.themeResolvedLight"
		)
		value = `${t("header.themeSystem")} (${resolved})`
	} else if (state) {
		value = t(state.choice === "dark" ? "header.themeDark" : "header.themeLight")
	}
	// Before mount (state null) the icon is the sun on the server and in the browser alike.
	const Icon = CHOICES.find((c) => c.choice === state?.choice)?.Icon ?? SunIcon
	return (
		<Picker name={t("header.theme")} value={value} icon={<Icon />}>
			{(closeAndFocus) =>
				CHOICES.map(({ choice, key, Icon: RowIcon }) => {
					const pressed = state?.choice === choice
					return (
						<button
							key={choice}
							type="button"
							className="picker-row"
							aria-pressed={pressed}
							onClick={() => {
								choose(choice)
								closeAndFocus()
							}}
						>
							<RowIcon />
							<span>{t(key)}</span>
							{pressed && <CheckIcon className="picker-check" />}
						</button>
					)
				})
			}
		</Picker>
	)
}
```

In `Header.tsx`, replace the `ThemeToggle` import and element with `import { ThemePicker } from "./ThemePicker.tsx"` and `<ThemePicker />`. Delete `web/src/components/ThemeToggle.tsx`.

- [ ] **Step 7: Run, show red once, commit**

Run: `npm test`. Expected: PASS.
Red proof: delete `window.addEventListener("storage", onStorage)`; "a choice made in another tab" FAILS; restore.

```bash
npx biome ci .
git add -A src/services/theme.ts src/hooks/useThemeChoice.ts src/components src/i18n tests/themePicker.test.tsx tests/theme.test.ts tests/shell.test.tsx
git commit -m "feat: add a theme picker with Lyst, Mørkt and System"
```

### Task 10: Quick exit with Shift x3, always in view

**Files:**
- Create: `web/src/services/quickExit.ts`, `web/src/hooks/useShiftExit.ts`
- Modify: `web/src/components/QuickExit.tsx`, `web/src/App.tsx`, `web/src/styles/main.css`
- Test: `web/tests/quickExit.test.ts` (create), `web/tests/shiftExit.test.tsx` (create)

**Interfaces:**
- Consumes: nothing new.
- Produces, in `services/quickExit.ts`: `EXIT_URL: string`, `leave(): void`, `type KeyLike = { key: string; repeat: boolean; isComposing: boolean }`, `createShiftCounter(onTrigger: () => void, now?: () => number): { keydown(e: KeyLike): void; keyup(e: KeyLike): void }`. `useShiftExit(onExit?: () => void): void`. The exit link carries class `quick-exit`.

- [ ] **Step 1: Write the failing tests**

Create `web/tests/quickExit.test.ts`:

```ts
import { expect, test, vi } from "vitest"
import { createShiftCounter, type KeyLike } from "../src/services/quickExit.ts"

const key = (k: string, extra: Partial<KeyLike> = {}): KeyLike => ({
	key: k,
	repeat: false,
	isComposing: false,
	...extra,
})

function setup() {
	let clock = 0
	const fired = vi.fn()
	const counter = createShiftCounter(fired, () => clock)
	const press = (k: string, extra: Partial<KeyLike> = {}) => {
		counter.keydown(key(k, extra))
		counter.keyup(key(k, extra))
	}
	const tick = (ms: number) => {
		clock += ms
	}
	return { fired, counter, press, tick }
}

test("three Shift presses on their own leave", () => {
	const { fired, press } = setup()
	press("Shift")
	press("Shift")
	expect(fired).not.toHaveBeenCalled()
	press("Shift")
	expect(fired).toHaveBeenCalledTimes(1)
})

test("Shift used for capitals never counts, however fast", () => {
	const { fired, counter, press } = setup()
	for (const letter of ["A", "B", "C", "D"]) {
		counter.keydown(key("Shift"))
		counter.keydown(key(letter))
		counter.keyup(key(letter))
		counter.keyup(key("Shift"))
	}
	expect(fired).not.toHaveBeenCalled()
	// A capital must leave the count at 0, not 1: two clean presses after it are still only two.
	press("Shift")
	press("Shift")
	expect(fired).not.toHaveBeenCalled()
})

test("any other key in between resets the count, Ctrl and Alt included", () => {
	const { fired, press } = setup()
	press("Shift")
	press("Shift")
	press("Control")
	press("Shift")
	expect(fired).not.toHaveBeenCalled()
	press("Shift")
	press("Alt")
	press("Shift")
	press("Shift")
	expect(fired).not.toHaveBeenCalled()
})

test("holding Shift down (key repeat) counts once", () => {
	const { fired, counter, press } = setup()
	counter.keydown(key("Shift"))
	counter.keydown(key("Shift", { repeat: true }))
	counter.keydown(key("Shift", { repeat: true }))
	counter.keyup(key("Shift"))
	press("Shift")
	expect(fired).not.toHaveBeenCalled()
	press("Shift")
	expect(fired).toHaveBeenCalledTimes(1)
})

test("events during IME composition are ignored", () => {
	const { fired, press } = setup()
	press("Shift", { isComposing: true })
	press("Shift", { isComposing: true })
	press("Shift", { isComposing: true })
	expect(fired).not.toHaveBeenCalled()
})

test("a slow third press does nothing: the count restarts 5 seconds after the first", () => {
	const { fired, press, tick } = setup()
	press("Shift")
	tick(2000)
	press("Shift")
	tick(3500)
	press("Shift")
	expect(fired).not.toHaveBeenCalled()
	press("Shift")
	press("Shift")
	expect(fired).toHaveBeenCalledTimes(1)
})
```

Create `web/tests/shiftExit.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"
import { leave } from "../src/services/quickExit.ts"
import { stubDataFiles } from "./stubData.ts"

vi.mock("../src/services/quickExit.ts", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../src/services/quickExit.ts")>()
	return { ...actual, leave: vi.fn() }
})

afterEach(() => {
	vi.mocked(leave).mockClear()
})

test("Shift three times leaves, also while typing in the search box", async () => {
	stubDataFiles()
	const user = userEvent.setup()
	render(<App />)
	await user.click(screen.getByRole("searchbox", { name: /Søk/ }))
	await user.keyboard("{Shift}{Shift}{Shift}")
	expect(leave).toHaveBeenCalledTimes(1)
})

test("typing capitals in the search box never leaves", async () => {
	stubDataFiles()
	const user = userEvent.setup()
	render(<App />)
	await user.click(screen.getByRole("searchbox", { name: /Søk/ }))
	await user.keyboard("{Shift>}H{/Shift}{Shift>}A{/Shift}{Shift>}M{/Shift}{Shift>}A{/Shift}")
	expect(leave).not.toHaveBeenCalled()
})

test("the exit link still works as a plain link before any script runs", () => {
	stubDataFiles()
	render(<App />)
	expect(screen.getByRole("link", { name: "Forlat siden" })).toHaveAttribute(
		"href",
		"https://www.google.com"
	)
})
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run tests/quickExit.test.ts tests/shiftExit.test.tsx`
Expected: FAIL, `quickExit.ts` does not exist.

- [ ] **Step 3: The counter and the exit**

Create `web/src/services/quickExit.ts`:

```ts
// The quick exit's one destination: neutral and unremarkable. location.replace, so this page
// does not survive the back button (base spec, "Browser history and the quick exit").
export const EXIT_URL = "https://www.google.com"

export function leave(): void {
	window.location.replace(EXIT_URL)
}

export type KeyLike = { key: string; repeat: boolean; isComposing: boolean }

const WINDOW_MS = 5000

// GOV.UK's "Exit this page" shortcut: Shift pressed and released three times on its own.
// A Shift held while another key went down (a capital letter, a shortcut) does not count,
// and that other key resets the count. Key repeat from holding Shift counts once. The count
// restarts 5 seconds after its first press, so a slow third press does nothing.
export function createShiftCounter(onTrigger: () => void, now: () => number = Date.now) {
	let count = 0
	let first = 0
	let clean = false
	return {
		keydown(event: KeyLike) {
			if (event.isComposing) return
			if (event.key !== "Shift") {
				count = 0
				clean = false
				return
			}
			if (!event.repeat) clean = true
		},
		keyup(event: KeyLike) {
			if (event.isComposing || event.key !== "Shift" || !clean) return
			clean = false
			const at = now()
			if (count === 0 || at - first > WINDOW_MS) {
				count = 0
				first = at
			}
			count += 1
			if (count === 3) {
				count = 0
				onTrigger()
			}
		},
	}
}
```

Create `web/src/hooks/useShiftExit.ts`:

```ts
import { useEffect } from "react"
import { createShiftCounter, leave } from "../services/quickExit.ts"

// Mounted once, in App's shell. Capture phase, so a widget that stops propagation (the
// react-aria combobox) cannot swallow the shortcut. It fires inside inputs too, as on GOV.UK.
export function useShiftExit(onExit: () => void = leave): void {
	useEffect(() => {
		const counter = createShiftCounter(onExit)
		const down = (event: KeyboardEvent) => counter.keydown(event)
		const up = (event: KeyboardEvent) => counter.keyup(event)
		document.addEventListener("keydown", down, true)
		document.addEventListener("keyup", up, true)
		return () => {
			document.removeEventListener("keydown", down, true)
			document.removeEventListener("keyup", up, true)
		}
	}, [onExit])
}
```

- [ ] **Step 4: Wire it up**

Replace `web/src/components/QuickExit.tsx` with:

```tsx
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { EXIT_URL, leave } from "../services/quickExit.ts"

export function QuickExit() {
	const t = useTranslation()
	// A real anchor with a real href: this is a safety-critical control, so it has to work even
	// if the click handler never runs (JS still loading, prerendered markup before hydration).
	return (
		<a
			href={EXIT_URL}
			className="btn-secondary quick-exit"
			onClick={(event) => {
				event.preventDefault()
				leave()
			}}
		>
			{t("app.quickExit")}
		</a>
	)
}
```

In `web/src/App.tsx`, add `import { useShiftExit } from "./hooks/useShiftExit.ts"` and call `useShiftExit()` as the first line of `Shell`, before `const t = useTranslation()`.

In `main.css`, the existing `.app-header` rule makes the header sticky from 480 px of height. Narrow it to tablet and up, and say why above it:

```css
	/* Sticky only where it costs one or two rows. On a phone the tools wrap below the brand,
	   so a sticky header would be three rows (157 px, measured 2026-10-02); there it scrolls
	   away and only the quick exit stays pinned, as on short screens (spec: Quick exit). */
	.app-header {
		position: static;
	}
	@media (min-height: 480px) and (min-width: 768px) {
		.app-header {
			position: sticky;
			top: 0;
			z-index: 10;
		}
	}
```

Append inside `@layer components` in `main.css`:

```css
	/* Always in view (spec: Quick exit). Wherever the header scrolls away (under 768 px wide or
	   480 px tall, .app-header), the button pins itself to the top right corner instead. Its slot
	   in .header-tools is then empty, so the tools keep that room free and the pinned button
	   never covers a picker (Task 11 measures it). */
	.quick-exit {
		position: fixed;
		top: 0.5rem;
		right: 0.5rem;
		z-index: 20;
	}
	.header-tools {
		margin-inline-end: 10rem;
	}
	@media (min-height: 480px) and (min-width: 768px) {
		.quick-exit {
			position: static;
		}
		.header-tools {
			margin-inline-end: 0;
		}
	}
```

- [ ] **Step 5: Run, show red once, commit**

Run: `npm test`. Expected: PASS (the hydration test's `Forlat siden` anchor regex still matches).
Red proof: delete `clean = false` from the `event.key !== "Shift"` branch; "Shift used for capitals never counts" FAILS; restore.

```bash
npx biome ci .
git add src/services/quickExit.ts src/hooks/useShiftExit.ts src/components/QuickExit.tsx src/App.tsx src/styles/main.css tests/quickExit.test.ts tests/shiftExit.test.tsx
git commit -m "feat: leave the page with Shift pressed three times, and keep the exit in view"
```

### Task 11: Header browser checks, focus never hidden, and PR 3

**Files:**
- Modify: `web/src/styles/main.css`
- Test: `web/e2e/header.spec.ts` (create)

**Interfaces:**
- Consumes: `setTheme`, `THEMES` (Task 1); the header DOM from Tasks 6 to 10.
- Produces: `scroll-padding-top` on `html`, which the footer's `#meld-feil` anchor and every later page rely on.

- [ ] **Step 1: Write the browser checks**

Create `web/e2e/header.spec.ts`:

```ts
import { expect, type Page, test } from "@playwright/test"
import { setTheme, THEMES } from "./helpers.ts"

type Box = { label: string; top: number; bottom: number; height: number }

async function headerControls(page: Page): Promise<Box[]> {
	return page.evaluate(() =>
		[...document.querySelectorAll<HTMLElement>("header a, header button, header summary")]
			// Rows inside a closed picker still have boxes in Chromium (content-visibility: hidden,
			// not display: none), so skip the lists outright.
			.filter((el) => !el.closest(".picker-list") && el.checkVisibility())
			.map((el) => {
				const r = el.getBoundingClientRect()
				const label = `${el.tagName} ${(el.textContent ?? "").trim().slice(0, 24)}`
				return { label, top: r.top, bottom: r.bottom, height: r.height }
			})
	)
}

// Controls whose vertical centres sit within 22 px of each other share a row.
function rowsOf(boxes: Box[]): Box[][] {
	const rows: Box[][] = []
	const centre = (b: Box) => (b.top + b.bottom) / 2
	for (const box of [...boxes].sort((a, b) => centre(a) - centre(b))) {
		const row = rows.find((r) => Math.abs(centre(r[0]) - centre(box)) < 22)
		if (row) row.push(box)
		else rows.push([box])
	}
	return rows
}

async function tabTo(page: Page, selector: string) {
	for (let i = 0; i < 30; i++) {
		await page.keyboard.press("Tab")
		if (await page.evaluate((s) => document.activeElement?.matches(s) ?? false, selector)) return
	}
	throw new Error(`Tab never reached ${selector}`)
}

// 1024 is the narrowest one-row width, English has the longest labels, and a first visit
// (nothing stored) shows the widest theme value, "System (lyst)", so all three are measured:
// scroll-padding-top (Step 3) assumes one row from 1024 px.
for (const width of [375, 1024, 1280, 1920]) {
	for (const theme of [...THEMES, "system"] as const) {
		for (const path of ["/", "/en/"]) {
			test(`header ${path} at ${width} px (${theme}): every control 44 px tall, one bottom edge per row`, async ({
				page,
			}) => {
				await page.setViewportSize({ width, height: 900 })
				if (theme !== "system") await setTheme(page, theme)
				await page.goto(path)
				await page.evaluate(() => document.fonts.ready)
				// The theme value fills in after mount; measure the real, hydrated width.
				await page
					.locator("header .visually-hidden", { hasText: /^(Tema|Theme): / })
					.waitFor({ state: "attached" })
				const rows = rowsOf(await headerControls(page))
				// Measured 2026-10-02: brand 91 + tools 245 (nb) / 274 (en) px overflow the 343 px
				// row at 375, so a phone has brand (with the pinned exit level with it at the top),
				// tools and nav on three rows. Not sticky there, so the height scrolls away (Decided).
				expect(rows.length).toBe(width >= 1024 ? 1 : width >= 768 ? 2 : 3)
				for (const row of rows) {
					for (const box of row) expect(box.height, box.label).toBeCloseTo(44, 0)
					const bottoms = row.map((b) => b.bottom)
					expect(Math.max(...bottoms) - Math.min(...bottoms)).toBeLessThan(1)
				}
			})
		}
	}
}

for (const viewport of [
	{ width: 1280, height: 600 },
	{ width: 1024, height: 600 },
	{ width: 375, height: 700 },
]) {
	test(`tabbing through /sok at ${viewport.width} px never puts focus under the header or the pinned exit`, async ({
		page,
	}) => {
		await page.setViewportSize(viewport)
		await page.goto("/sok")
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
		// Both directions: Chromium centres a target it has to scroll to, so going forward rarely
		// lands under the header. Going back, an element partly under the header counts as in
		// view and takes focus without a scroll, which only scroll-padding-top prevents. At 375
		// the header scrolls away and the pinned quick exit is what could cover focus, so both
		// boxes are checked.
		for (const key of ["Tab", "Shift+Tab"]) {
			for (let i = 0; i < 40; i++) {
				await page.keyboard.press(key)
				const covered = await page.evaluate(() => {
					const el = document.activeElement as HTMLElement | null
					const header = document.querySelector("header")
					const exit = document.querySelector(".quick-exit")
					if (!el || !header || !exit || el === document.body || header.contains(el)) return null
					const r = el.getBoundingClientRect()
					return [header.getBoundingClientRect(), exit.getBoundingClientRect()].some(
						(h) =>
							r.top < h.bottom - 1 &&
							r.bottom > h.top + 1 &&
							r.left < h.right - 1 &&
							r.right > h.left + 1
					)
						? el.outerHTML.slice(0, 80)
						: null
				})
				expect(covered, key).toBeNull()
			}
		}
	})
}

test("the quick exit stays in view after scrolling, on a normal screen, a short one and a phone", async ({
	page,
}) => {
	for (const viewport of [
		{ width: 1280, height: 950 },
		{ width: 640, height: 400 },
		{ width: 375, height: 700 },
	]) {
		await page.setViewportSize(viewport)
		await page.goto("/sok")
		await expect(page.getByRole("heading", { level: 1 })).toBeAttached()
		await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
		const box = await page.getByRole("link", { name: "Forlat siden" }).boundingBox()
		if (!box) throw new Error("no quick exit box")
		expect(box.y).toBeGreaterThanOrEqual(0)
		expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
	}
})

for (const viewport of [
	{ width: 640, height: 400 },
	{ width: 375, height: 700 },
]) {
	test(`at ${viewport.width} x ${viewport.height} the pinned quick exit covers no other header control`, async ({
		page,
	}) => {
		await page.setViewportSize(viewport)
		for (const path of ["/sok", "/en/sok"]) {
			await page.goto(path)
			await page.evaluate(() => document.fonts.ready)
			const covered = await page.evaluate(() => {
				const exit = document.querySelector(".quick-exit")
				if (!exit) return ["no quick exit"]
				const e = exit.getBoundingClientRect()
				return [...document.querySelectorAll<HTMLElement>("header a, header button, header summary")]
					.filter((el) => el !== exit && !el.closest(".picker-list") && el.checkVisibility())
					.filter((el) => {
						const r = el.getBoundingClientRect()
						return r.left < e.right && r.right > e.left && r.top < e.bottom && r.bottom > e.top
					})
					.map((el) => el.outerHTML.slice(0, 80))
			})
			expect(covered, path).toEqual([])
		}
	})
}

test("forced colours keep the focus ring and the current picker row visible", async ({ page }) => {
	await page.emulateMedia({ forcedColors: "active" })
	await page.goto("/")
	await tabTo(page, "header summary")
	const ring = await page.evaluate(() => {
		const s = getComputedStyle(document.activeElement as HTMLElement)
		return { style: s.outlineStyle, width: Number.parseFloat(s.outlineWidth) }
	})
	expect(ring.style).not.toBe("none")
	expect(ring.width).toBeGreaterThanOrEqual(2)
	await page.keyboard.press("Enter")
	const row = page.locator('header .picker-row[aria-current="page"]')
	await expect(row).toBeFocused()
	const colours = await row.evaluate((el) => ({
		row: getComputedStyle(el).backgroundColor,
		list: getComputedStyle(el.parentElement as HTMLElement).backgroundColor,
	}))
	expect(colours.row).not.toBe(colours.list)
})
```

- [ ] **Step 2: Run to see the focus check fail**

```bash
npm run build && npx playwright test header
```

Expected: the header-row, quick-exit and forced-colours tests PASS; "never puts focus under the header or the pinned exit" FAILS on the Shift+Tab pass (an element above, partly under the header, takes focus without a scroll). If a header-row test fails, read the label it prints and fix that control's height in CSS before going on.

- [ ] **Step 3: Keep focus clear of the sticky header**

Append inside `@layer base` in `main.css`, after the `:focus-visible` rule:

```css
	/* The sticky header must never cover a focused element or an anchor target (WCAG 2.4.11,
	   house bar 2.4.12). The value is the header's height plus room: two rows (109 px) under
	   1024 px, one (61 px) from there. The header is sticky only from 768 px wide and 480 px
	   tall (.app-header); elsewhere only the pinned quick exit sits at the top, so the padding
	   clears its band. */
	html {
		scroll-padding-top: 3.5rem;
	}
	@media (min-height: 480px) and (min-width: 768px) {
		html {
			scroll-padding-top: 8rem;
		}
	}
	@media (min-height: 480px) and (min-width: 1024px) {
		html {
			scroll-padding-top: 5rem;
		}
	}
```

- [ ] **Step 4: Run all browser checks**

```bash
npm run build && npx playwright test
```

Expected: all pass.

- [ ] **Step 5: Show each new check red once**

Restore and rebuild after each, and record each for the PR description:
1. `.nav-link` `min-height: 40px`: the header-row test FAILS naming `A Alle tjenester`.
2. Remove the `scroll-padding-top` block: the focus test FAILS (as in Step 2).
3. In `.quick-exit`, change `position: fixed` to `position: static`: the quick exit test FAILS on the 640 x 400 and 375 x 700 screens.
4. Remove the `@media (forced-colors: active)` picker block: the forced-colours test FAILS on the row colour.
5. Remove the baseline `.header-tools { margin-inline-end: 10rem; }`: the pinned-exit cover test FAILS, naming a picker's `<summary>` (at 375 the margin is also what keeps the pickers off the brand row, so the header-row test there may go red too). If it is red before this break (a long label wider than 10rem), raise the value until it passes; never shrink the button.

- [ ] **Step 6: Commit and ship PR 3**

```bash
npm test && npx biome ci .
git add src/styles/main.css e2e/header.spec.ts
git commit -m "test: check the header row rule, hidden focus, quick exit and forced colours"
```

Follow "Shipping a PR" with title `feat: header links, language and theme pickers, quick exit with Shift x3`. Red proofs: Task 6 Step 7, Task 7 Step 7, Task 8 Step 6, Task 9 Step 7, Task 10 Step 5, Task 11 Step 5. Manual before merge: an NVDA pass over the header and both pickers (the triggers read "Språk: Norsk" and "Tema: ...", rows read with their state). In the same pass, press Shift to pause NVDA's speech and again to resume it, as screen reader users do, and note whether a third press soon after leaves Varde; record the result in the PR so Malin can judge the Shift x3 trade-off.

---

# PR 4: `feat/landing-fit`

**Layout decision (Malin, 2026-10-02, while writing this plan):** I measured the live landing page at 1280 x 950: 1175 px tall (strip 60, header 61, hero 570, trust 105, emergency 189, footer 93 plus 48 margin). The content the spec adds, with every padding at zero, sums to about 1075 px in a stacked layout, so padding alone cannot reach 950. From 1024 px the landing page therefore has **two columns**: hero, search and chips on the left (3fr); emergency numbers and helplines on the right (2fr). Trust line and footer run full width below. The hero is left-aligned from 1024 px. Under 1024 px everything stacks, emergency first after the hero, as the spec says. Estimate: about 900 px. The spec's "Side by side" bullet is amended to match in the same commit as this plan.

### Task 12: Hero, chips, emergency grid and the two-column layout

**Files:**
- Modify: `web/src/components/LandingPage.tsx`, `web/src/components/LandingSearch.tsx`, `web/src/styles/main.css`, `web/src/i18n/nb.json`, `web/src/i18n/en.json`
- Test: `web/tests/landing.test.tsx`, `web/e2e/landing.spec.ts` (create)

**Interfaces:**
- Consumes: `CATEGORY_SLUGS`, `emergencyLines`, `telHref`, `Link`, `settle` (Task 1).
- Produces: landing DOM `.landing-columns` > `section.hero` (left) and `div.landing-help` (right, holds `section[aria-labelledby=emergency]`; Task 14 appends the helplines section to it). Chip classes `chip`, `chip-acute`, list class `chip-grid` (Task 17's hover uses `.chip`).

- [ ] **Step 1: Branch**

```bash
git switch main && git pull && git switch -c feat/landing-fit
```

- [ ] **Step 2: Write the failing unit tests**

Append to `web/tests/landing.test.tsx`:

```tsx
test("Nødtjenester stands apart; the other eight sit in one grid in category order", () => {
	stubCatalog()
	render(<App />)
	const acute = screen.getByRole("link", { name: "Nødtjenester" })
	expect(acute).toHaveClass("chip-acute")
	expect(acute.closest("ul")).toBeNull()
	const grid = screen.getByRole("link", { name: nb["category.bolig"] }).closest("ul") as HTMLElement
	const names = within(grid)
		.getAllByRole("link")
		.map((a) => a.textContent)
	expect(names).toEqual(
		CATEGORY_SLUGS.filter((s) => s !== "nodtjenester").map((s) => nb[`category.${s}`])
	)
})

test("the headline keeps its last three words together, in both languages", () => {
	stubCatalog()
	const { unmount } = render(<App />)
	expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
		"Finn riktig hjelp, der\u00a0du\u00a0bor."
	)
	unmount()
	window.history.replaceState(null, "", "/en/")
	render(<App />)
	expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
		"Find the right help, where\u00a0you\u00a0live."
	)
})

test("the emergency intro is the plain new line, in both languages", () => {
	stubCatalog()
	const { unmount } = render(<App />)
	expect(screen.getByText("Ved akutt fare, ring:")).toBeInTheDocument()
	unmount()
	window.history.replaceState(null, "", "/en/")
	render(<App />)
	expect(screen.getByText("In an emergency, call:")).toBeInTheDocument()
})
```

- [ ] **Step 3: Run to see them fail**

Run: `npx vitest run tests/landing.test.tsx`
Expected: FAIL on all three new tests.

- [ ] **Step 4: The strings**

In `nb.json`: `"landing.headline": "Finn riktig hjelp, der\u00a0du\u00a0bor."` and `"landing.emergencyIntro": "Ved akutt fare, ring:"`.
In `en.json`: `"landing.headline": "Find the right help, where\u00a0you\u00a0live."` and `"landing.emergencyIntro": "In an emergency, call:"`.
Keep the `\u00a0` escapes exactly as written (in JSON and in the test strings), not pasted characters, so the non-breaking spaces stay visible in review. Some editing tools decode the escape into the character itself (this plan lost them once that way), so check afterwards: `grep -c "u00a0" src/i18n/nb.json src/i18n/en.json tests/landing.test.tsx` prints 1, 1 and 2.

- [ ] **Step 5: The layout**

In `web/src/components/LandingSearch.tsx`, change the `<search className="mx-auto w-full max-w-xl">` class to `"mx-auto w-full max-w-xl lg:mx-0"` so the search lines up with the left-aligned hero.

In `LandingPage.tsx`, keep the imports, `NEXT_VERIFICATION_PASS`, `titles` and the trust section as they are (Task 15 rewrites the trust section). Replace `const chipOrder = [...]` with:

```tsx
const GRID_SLUGS = CATEGORY_SLUGS.filter((s) => s !== "nodtjenester")
```

Replace the hero `<section className="hero ...">…</section>` with the block below. Then delete the old emergency `<section aria-labelledby="emergency">`, because it moves into `.landing-help`. The trust section sits between them today and stays where it is, so it now follows `.landing-columns` at full width (spec: Two columns).

```tsx
			{/* Two columns from 1024 px (decided 2026-10-02 so the page fits one 950 px screen):
			    finding help on the left, calling for it on the right. Under 1024 px they stack. */}
			<div className="landing-columns grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-start lg:gap-10">
				<section className="hero relative py-6 text-center lg:py-4 lg:text-left">
					<p className="entrance text-xs uppercase tracking-[0.24em] text-muted">
						{t("landing.eyebrow")}
					</p>
					<h1
						ref={ref}
						tabIndex={-1}
						className="mx-auto mt-3 max-w-2xl text-4xl leading-[1.1] text-balance md:text-6xl lg:mx-0"
					>
						{t("landing.headline")}
					</h1>
					<p className="entrance entrance-2 mx-auto mt-4 max-w-xl text-muted lg:mx-0">
						{t("landing.subtitle")}
					</p>
					<div className="entrance entrance-3 mt-6">
						<LandingSearch />
					</div>
					<p className="entrance entrance-4 mt-6 text-xs uppercase tracking-[0.18em] text-muted">
						{t("landing.browse")}
					</p>
					<div className="entrance entrance-5 mt-3 grid gap-2">
						<Link
							to="/sok?category=nodtjenester"
							className="chip chip-acute justify-self-center lg:justify-self-start"
						>
							{t("category.nodtjenester")}
						</Link>
						<ul className="chip-grid grid grid-cols-2 gap-2 md:grid-cols-4">
							{GRID_SLUGS.map((slug) => (
								<li key={slug}>
									<Link to={`/sok?category=${slug}`} className="chip w-full">
										{t(`category.${slug}`)}
									</Link>
								</li>
							))}
						</ul>
					</div>
				</section>

				<div className="landing-help grid gap-6 border-t border-border pt-6 lg:border-0 lg:py-4">
					<section aria-labelledby="emergency">
						<h2 id="emergency" className="text-2xl">
							{t("landing.emergencyHeading")}
						</h2>
						<p className="mt-2 text-muted">{t("landing.emergencyIntro")}</p>
						<ul className="mt-3 grid grid-cols-2 gap-3">
							{emergencyLines.map((line) => (
								<li key={line.id}>
									<a href={telHref(line.phone)} className="btn-primary w-full text-lg">
										{line.phone} <span className="font-normal">{t(`strip.${line.id}`)}</span>
									</a>
								</li>
							))}
						</ul>
					</section>
				</div>
			</div>
```

Append inside `@layer components` in `main.css`:

```css
	/* Category chips on the landing page. Nødtjenester is the accent chip on a row of its own;
	   the other eight share one width in the grid (spec: Chips, item 3). */
	.chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		padding: 0 1rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		color: var(--text);
		font-size: 0.875rem;
		font-weight: 500;
		text-align: center;
		text-decoration: none;
	}
	.chip-acute {
		border-color: var(--accent);
		background: var(--accent);
		color: var(--on-accent);
		font-weight: 600;
	}
```

- [ ] **Step 6: Run the unit tests**

Run: `npm test`. Expected: PASS.

- [ ] **Step 7: Write the browser checks**

Create `web/e2e/landing.spec.ts`:

```ts
import { expect, test } from "@playwright/test"
import { settle } from "./helpers.ts"

for (const [width, columns] of [
	[375, 2],
	[1280, 4],
] as const) {
	test(`the eight category chips sit in ${columns} equal columns at ${width} px`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height: 900 })
		await page.goto("/")
		const boxes = await page.locator(".chip-grid .chip").evaluateAll((els) =>
			els.map((el) => {
				const r = el.getBoundingClientRect()
				return { x: Math.round(r.left), w: Math.round(r.width) }
			})
		)
		expect(boxes).toHaveLength(8)
		expect(new Set(boxes.map((b) => b.x)).size).toBe(columns)
		expect(new Set(boxes.map((b) => b.w)).size).toBe(1)
	})
}

for (const width of [1280, 1920]) {
	for (const [path, first, last] of [
		["/", "der", "bor."],
		["/en/", "where", "live."],
	] as const) {
		test(`hero at ${width} px (${path}): line height 1.1, two lines, last three words together`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height: 950 })
			await page.goto(path)
			await settle(page)
			const m = await page.locator("h1").evaluate(
				(h1, words) => {
					const s = getComputedStyle(h1)
					const lineHeight = Number.parseFloat(s.lineHeight)
					const text = h1.firstChild as Text
					const top = (word: string) => {
						const at = text.data.indexOf(word)
						const range = document.createRange()
						range.setStart(text, at)
						range.setEnd(text, at + word.length)
						return range.getBoundingClientRect().top
					}
					return {
						ratio: lineHeight / Number.parseFloat(s.fontSize),
						lines: Math.round(h1.getBoundingClientRect().height / lineHeight),
						firstTop: top(words[0]),
						lastTop: top(words[1]),
					}
				},
				[first, last]
			)
			expect(m.ratio).toBeCloseTo(1.1, 2)
			expect(m.lines).toBe(2)
			expect(m.firstTop).toBe(m.lastTop)
		})
	}
}
```

- [ ] **Step 8: Run them**

```bash
npm run build && npx playwright test landing
```

Expected: PASS. If a hero test reports `lines: 3` at 1280, the 3fr column is too narrow for 60 px type: change the h1's `md:text-6xl` to `md:text-6xl lg:text-5xl 2xl:text-6xl`, rebuild and re-run. Do not change the strings.

- [ ] **Step 9: Show both red once, then commit**

Chips: change `md:grid-cols-4` to `md:grid-cols-3`; the 1280 chip test FAILS (3 columns); restore. Hero: remove `leading-[1.1]`; the ratio check FAILS (1.0); restore. Rebuild after each.

```bash
npx biome ci .
git add src/components/LandingPage.tsx src/components/LandingSearch.tsx src/styles/main.css src/i18n tests/landing.test.tsx e2e/landing.spec.ts
git commit -m "feat: two-column landing with balanced hero, chip grid and 2 x 2 emergency numbers"
```

### Task 13: Helpline ids, picked at prerender

**Files:**
- Create: `web/src/services/helplines.ts`
- Modify: `web/src/pageData.ts`, `web/src/entry-server.tsx`, `web/scripts/prerender.mjs`, `web/scripts/prerender.d.mts`, `web/tests/stubData.ts`
- Test: `web/tests/helplines.test.ts` (create), `web/tests/prerender.test.ts`, `web/tests/hydration.test.tsx`

**Interfaces:**
- Consumes: `ResourceDto`, `Lang`.
- Produces: `HELPLINE_IDS: readonly [1, 2, 121, 9, 122]`, `type Helpline = Pick<ResourceDto, "id" | "name" | "phone" | "chatUrl">`, `pickHelplines(resources: readonly ResourceDto[]): Helpline[]` (throws `helpline id <n> is missing from the data`), `safeChatUrl(url: string | null): string | null`. `PageData.helplines?: { lang: Lang; entries: Helpline[] }`. `prerenderSite` takes a required `pickHelplines` option. `helplineRows: ResourceDto[]` exported from `tests/stubData.ts` for every later test.

- [ ] **Step 1: The fixture rows (copied, not typed)**

Append to `web/tests/stubData.ts` (add `import type { ResourceDto } from "../src/types/api.ts"` after the `../src/services/data.ts` import, where organize-imports wants it). The `id`, `name`, `phone`, `chatUrl` and `lastVerified` values are copied from `public/data/resources.nb.json` (export of 2026-09-16); re-check them against the file before committing:

```ts
function helpline(
	id: number,
	name: string,
	phone: string | null,
	chatUrl: string | null
): ResourceDto {
	return {
		id,
		name,
		description: "",
		isFallbackTranslation: false,
		openingHours: null,
		isNational: true,
		isAlwaysOpen: false,
		municipalityId: null,
		municipalityName: null,
		address: null,
		phone,
		email: null,
		website: null,
		chatUrl,
		lastVerified: "2026-08-13",
		categories: [],
		servedMunicipalityIds: [],
	}
}

// The five "Noen å snakke med" rows, not in the landing order (the test reverses them anyway).
export const helplineRows: ResourceDto[] = [
	helpline(1, "Hjelpetelefonen (Mental Helse)", "116 123", null),
	helpline(2, "Kirkens SOS", "22 40 00 40", "https://www.soschat.no"),
	helpline(9, "Arbeidslivstelefonen (Mental Helse)", "116 123", null),
	helpline(121, "Kors på halsen (Røde Kors)", "800 33 321", "https://www.korspahalsen.no"),
	helpline(122, "Sidetmedord (Mental Helse)", null, "https://sidetmedord.mentalhelse.no/"),
]
```

- [ ] **Step 2: Write the failing tests**

Create `web/tests/helplines.test.ts`:

```ts
import { expect, test } from "vitest"
import { HELPLINE_IDS, pickHelplines, safeChatUrl } from "../src/services/helplines.ts"
import { helplineRows } from "./stubData.ts"

test("the five helplines come back in the curated order, whatever the data order", () => {
	expect(HELPLINE_IDS).toEqual([1, 2, 121, 9, 122])
	const picked = pickHelplines([...helplineRows].reverse())
	expect(picked.map((h) => h.id)).toEqual([1, 2, 121, 9, 122])
	expect(picked[0]).toEqual({
		id: 1,
		name: "Hjelpetelefonen (Mental Helse)",
		phone: "116 123",
		chatUrl: null,
	})
})

test("a helpline id missing from the data throws, so the build fails", () => {
	const without121 = helplineRows.filter((r) => r.id !== 121)
	expect(() => pickHelplines(without121)).toThrow("helpline id 121 is missing from the data")
})

test("only an https:// chat URL survives", () => {
	expect(safeChatUrl("https://sidetmedord.mentalhelse.no/")).toBe(
		"https://sidetmedord.mentalhelse.no/"
	)
	expect(safeChatUrl("http://example.test")).toBeNull()
	expect(safeChatUrl("javascript:alert(1)")).toBeNull()
	expect(safeChatUrl(" https://example.test")).toBeNull()
	expect(safeChatUrl("")).toBeNull()
	expect(safeChatUrl(null)).toBeNull()
})
```

In `web/tests/prerender.test.ts`: add `pickHelplines: () => [],` to every `prerenderSite({` call (run `grep -n "prerenderSite({" tests/prerender.test.ts` to list them; there are 7 after Task 3). Then append:

```ts
test("the landing pages bake their helplines, in their own language", async () => {
	const { dataDir, distDir } = setup([row], [hamar])
	const render = vi.fn(async () => ({ html: "<main>x</main>", head: null }))
	await prerenderSite({
		dataDir,
		distDir,
		render,
		split: stubSplit,
		pickHelplines: () => [{ id: 1, name: "Hjelpetelefonen", phone: "116 123", chatUrl: null }],
		siteOrigin: "https://varde.pages.dev",
		log: () => {},
	})
	expect(readFileSync(join(distDir, "index.html"), "utf8")).toContain(
		'"helplines":{"lang":"nb","entries":[{"id":1'
	)
	expect(readFileSync(join(distDir, "en/index.html"), "utf8")).toContain('"helplines":{"lang":"en"')
	expect(readFileSync(join(distDir, "sok.html"), "utf8")).not.toContain("helplines")
})

test("a helpline id missing from the export fails the whole build", async () => {
	const { dataDir, distDir } = setup([row], [hamar])
	const render = vi.fn(async () => ({ html: "<main>x</main>", head: null }))
	await expect(
		prerenderSite({
			dataDir,
			distDir,
			render,
			split: stubSplit,
			pickHelplines: () => {
				throw new Error("helpline id 121 is missing from the data")
			},
			siteOrigin: "https://varde.pages.dev",
			log: () => {},
		})
	).rejects.toThrow("helpline id 121")
})
```

In `web/tests/hydration.test.tsx`, import `pickHelplines` from `../src/services/helplines.ts` and `helplineRows` from `./stubData.ts`, and change the landing rows of the `test.each` table to:

```ts
	["/", { helplines: { lang: "nb", entries: pickHelplines(helplineRows) } }],
	["/en/", { helplines: { lang: "en", entries: pickHelplines(helplineRows) } }],
```

- [ ] **Step 3: Run to see them fail**

Run: `npx vitest run tests/helplines.test.ts tests/prerender.test.ts`
Expected: FAIL, `helplines.ts` does not exist and the landing page has no `helplines` block.

- [ ] **Step 4: The service**

Create `web/src/services/helplines.ts`:

```ts
import type { ResourceDto } from "../types/api.ts"

// "Noen å snakke med" on the landing page, in this order (spec: Landing, item 9): seed ids
// 1 Hjelpetelefonen, 2 Kirkens SOS, 121 Kors på halsen, 9 Arbeidslivstelefonen,
// 122 Sidetmedord. The prerender picks them from the exported data, so an id that vanishes
// fails the build instead of shipping a shorter list.
export const HELPLINE_IDS = [1, 2, 121, 9, 122] as const

export type Helpline = Pick<ResourceDto, "id" | "name" | "phone" | "chatUrl">

export function pickHelplines(resources: readonly ResourceDto[]): Helpline[] {
	return HELPLINE_IDS.map((id) => {
		const row = resources.find((r) => r.id === id)
		if (!row) throw new Error(`helpline id ${id} is missing from the data`)
		return { id: row.id, name: row.name, phone: row.phone, chatUrl: row.chatUrl }
	})
}

// A chat link renders only for an https:// URL; anything else shows the name alone. The
// detail page's existing links are hardened in sub-project E, where outside data arrives.
export function safeChatUrl(url: string | null): string | null {
	return url?.startsWith("https://") ? url : null
}
```

In `web/src/pageData.ts`, add the imports `import type { Helpline } from "./services/helplines.ts"` and `import type { Lang } from "./services/urlState.ts"`, and the field:

```ts
export type PageData = {
	resource?: ResourceDto
	kommune?: { entry: KommuneEntry; local: ResourceDto[]; national: ResourceDto[] }
	// Tagged with its language: page data belongs to the URL that was loaded, and a later
	// client-side switch to the other language must not show these names.
	helplines?: { lang: Lang; entries: Helpline[] }
}
```

In `web/src/entry-server.tsx`, after the `splitForKommune` re-export:

```ts
// The prerender picks the landing page's helplines with the same function the browser uses.
export { pickHelplines } from "./services/helplines.ts"
```

- [ ] **Step 5: The prerender**

In `web/scripts/prerender.mjs`:
- In `urlList`, change the landing push to `out.push({ url: \`${p}/\`, data: {}, lang, landing: true })`.
- Add `pickHelplines,` to the `prerenderSite` parameter list, after `split,`.
- Replace the `const data = ...` statement in the page loop with:

```js
		const data = page.kommune
			? { kommune: split(page.kommune, resourcesByLang[page.lang]) }
			: page.landing
				? { helplines: { lang: page.lang, entries: pickHelplines(resourcesByLang[page.lang]) } }
				: page.data
```

- In the CLI block's `prerenderSite({...})` call, add `pickHelplines: server.pickHelplines,` after `split: server.splitForKommune,`.

In `web/scripts/prerender.d.mts` (the type sibling `tsc --noEmit` reads for the tests), add `landing?: boolean` to `PrerenderPage`, add `export type PickHelplinesFn = (resources: object[]) => unknown` after `SplitFn`, and add `pickHelplines: PickHelplinesFn` to `PrerenderOptions` after `split: SplitFn`. Without it every `prerenderSite({ … pickHelplines … })` in the tests fails the build with TS2353.

- [ ] **Step 6: Run, show red once, commit**

Run: `npm test && npm run build`. Expected: PASS, and the build log still says `prerendered 210 pages`.
Red proof: in `HELPLINE_IDS` change `121` to `999`; `npm run build` FAILS with `helpline id 999 is missing from the data`; restore.

```bash
npx biome ci .
git add src/services/helplines.ts src/pageData.ts src/entry-server.tsx scripts/prerender.mjs scripts/prerender.d.mts tests/stubData.ts tests/helplines.test.ts tests/prerender.test.ts tests/hydration.test.tsx
git commit -m "feat: pick the landing helplines from the export at prerender, failing on a missing id"
```

### Task 14: "Noen å snakke med" on the landing page

**Files:**
- Create: `web/src/components/Helplines.tsx`
- Modify: `web/src/components/LandingPage.tsx`, `web/src/components/LandingSearch.tsx` (one comment), `web/src/styles/main.css`, `web/src/i18n/nb.json`, `web/src/i18n/en.json`
- Test: `web/tests/helplinesSection.test.tsx` (create), `web/tests/landing.test.tsx`, `web/tests/shell.test.tsx`, `web/tests/axe.test.tsx`

**Interfaces:**
- Consumes: `pickHelplines`, `safeChatUrl`, `Helpline`, `helplineRows` (Task 13); `usePageData`; `loadIndex`; `telHref`; `Link`.
- Produces: `Helplines()` rendered inside `.landing-help`, after the emergency section; `section[aria-labelledby=helplines]`.

- [ ] **Step 1: Write the failing tests**

Create `web/tests/helplinesSection.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"
import { type PageData, PageDataContext } from "../src/pageData.ts"
import { pickHelplines } from "../src/services/helplines.ts"
import { helplineRows, stubDataFiles } from "./stubData.ts"

afterEach(() => {
	vi.restoreAllMocks()
	window.history.replaceState(null, "", "/")
})

const baked: PageData = { helplines: { lang: "nb", entries: pickHelplines(helplineRows) } }

function renderLanding(data: PageData = baked) {
	return render(
		<PageDataContext.Provider value={data}>
			<App />
		</PageDataContext.Provider>
	)
}

test("baked helplines render in order, each name linking to its page, without a request", () => {
	const fetchSpy = vi.spyOn(globalThis, "fetch")
	renderLanding()
	const section = screen.getByRole("region", { name: "Noen å snakke med" })
	expect(within(section).getByText("Du kan være anonym.")).toBeInTheDocument()
	const names = within(section)
		.getAllByRole("listitem")
		.map((li) => within(li).getAllByRole("link")[0].textContent)
	expect(names).toEqual([
		"Hjelpetelefonen (Mental Helse)",
		"Kirkens SOS",
		"Kors på halsen (Røde Kors)",
		"Arbeidslivstelefonen (Mental Helse)",
		"Sidetmedord (Mental Helse)",
	])
	expect(within(section).getByRole("link", { name: "Kirkens SOS" })).toHaveAttribute(
		"href",
		"/resources/2"
	)
	expect(fetchSpy).not.toHaveBeenCalled()
})

test("the call buttons say the number, and their names also say the service", () => {
	renderLanding()
	const section = screen.getByRole("region", { name: "Noen å snakke med" })
	const call = within(section).getByRole("link", {
		name: "Ring 116 123, Hjelpetelefonen (Mental Helse)",
	})
	expect(call).toHaveAttribute("href", "tel:116123")
	expect(
		within(section).getByRole("link", { name: "Ring 116 123, Arbeidslivstelefonen (Mental Helse)" })
	).toBeInTheDocument()
})

test("an entry without a phone gets a Chat link to its https chat", () => {
	renderLanding()
	const section = screen.getByRole("region", { name: "Noen å snakke med" })
	expect(
		within(section).getByRole("link", { name: "Chat, Sidetmedord (Mental Helse)" })
	).toHaveAttribute("href", "https://sidetmedord.mentalhelse.no/")
})

test("a chat URL that is not https shows the name alone, never a link", () => {
	const entries = pickHelplines(helplineRows).map((h) =>
		h.id === 122 ? { ...h, chatUrl: "javascript:alert(1)" } : h
	)
	renderLanding({ helplines: { lang: "nb", entries } })
	const section = screen.getByRole("region", { name: "Noen å snakke med" })
	expect(within(section).queryByRole("link", { name: /Chat/ })).toBeNull()
	expect(
		within(section).getByRole("link", { name: "Sidetmedord (Mental Helse)" })
	).toBeInTheDocument()
})

test("coming back to the landing page without baked data loads the helplines", async () => {
	stubDataFiles({ resources: helplineRows })
	render(<App />)
	const section = await screen.findByRole("region", { name: "Noen å snakke med" })
	expect(within(section).getAllByRole("listitem")).toHaveLength(5)
})

test("baked Norwegian helplines are not reused on the English landing page", async () => {
	stubDataFiles({ resources: helplineRows })
	window.history.replaceState(null, "", "/en/")
	renderLanding()
	const section = await screen.findByRole("region", { name: "Someone to talk to" })
	expect(within(section).getAllByRole("listitem")).toHaveLength(5)
	expect(fetch).toHaveBeenCalled()
})
```

In `web/tests/landing.test.tsx`, the test "the landing renders without a single request" now needs baked helplines. Add the imports `import { PageDataContext } from "../src/pageData.ts"`, `import { pickHelplines } from "../src/services/helplines.ts"` and `helplineRows` from `./stubData.ts`, and replace its `render(<App />)` with:

```tsx
	render(
		<PageDataContext.Provider
			value={{ helplines: { lang: "nb", entries: pickHelplines(helplineRows) } }}
		>
			<App />
		</PageDataContext.Provider>
	)
```

In `web/tests/shell.test.tsx`, make the same replacement in "the landing route renders a heading and loads no data" (same three imports).

In `web/tests/landing.test.tsx`, make the same provider replacement in "focusing the search box prefetches the catalog…", and add `expect(fetchSpy).not.toHaveBeenCalled()` before `await user.click(box)` (use the test's own name for its fetch spy), so the four calls provably come from the focus. Without baked data, `<Helplines />` would fetch the index on mount and the prefetch check would pass even if the prefetch broke.

In `web/tests/axe.test.tsx`, import `helplineRows` from `./stubData.ts`, change the `stub` "ok" fixture to `resources: [resource, ...helplineRows]`, and change the landing row of `pages` to `["landing", "/", "ok", /Noen å snakke med/]` so axe runs after the section has loaded.

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run tests/helplinesSection.test.tsx`
Expected: FAIL, no region "Noen å snakke med".

- [ ] **Step 3: The strings**

The subtitle says only what all five services' own pages confirm (checked 2026-10-02): all five say you can be anonymous; Kirkens SOS says a call costs the same as an ordinary landline call, so "Gratis" is dropped.

`nb.json`:

```json
	"landing.helplinesHeading": "Noen å snakke med",
	"landing.helplinesSubtitle": "Du kan være anonym.",
```

`en.json`:

```json
	"landing.helplinesHeading": "Someone to talk to",
	"landing.helplinesSubtitle": "You can stay anonymous.",
```

- [ ] **Step 4: The component**

Create `web/src/components/Helplines.tsx`:

```tsx
import { useEffect, useState } from "react"
import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { usePageData } from "../pageData.ts"
import { loadIndex } from "../services/data.ts"
import { telHref } from "../services/emergency.ts"
import { type Helpline, pickHelplines, safeChatUrl } from "../services/helplines.ts"
import { Link } from "./Link.tsx"

export function Helplines() {
	const { lang } = useLanguage()
	const t = useTranslation()
	const baked = usePageData().helplines
	const fresh = baked && baked.lang === lang ? baked.entries : null
	const [entries, setEntries] = useState<Helpline[] | null>(fresh)
	// A direct load has the rows baked in. Coming back by client-side navigation, or in the
	// other language, there is nothing baked for this URL, so the rows come from the index.
	// If that fails the section stays hidden; the emergency numbers beside it still show.
	useEffect(() => {
		if (baked && baked.lang === lang) {
			setEntries(baked.entries)
			return
		}
		let cancelled = false
		setEntries(null)
		loadIndex(lang)
			.then((index) => {
				if (!cancelled) setEntries(pickHelplines(index.resources))
			})
			.catch(() => {
				if (!cancelled) setEntries(null)
			})
		return () => {
			cancelled = true
		}
	}, [lang, baked])
	if (!entries) return null
	return (
		<section aria-labelledby="helplines">
			<h2 id="helplines" className="text-2xl">
				{t("landing.helplinesHeading")}
			</h2>
			<p className="mt-2 text-muted">{t("landing.helplinesSubtitle")}</p>
			<ul className="mt-3 grid gap-2">
				{entries.map((entry) => {
					const chat = safeChatUrl(entry.chatUrl)
					// The visible label stays short ("Ring 116 123"); the hidden part adds the service,
					// since two entries share 116 123. The visible words come first in the name
					// (WCAG 2.5.3, label in name).
					return (
						<li key={entry.id} className="helpline-row">
							<Link to={`/resources/${entry.id}`} className="helpline-name">
								{entry.name}
							</Link>
							{entry.phone ? (
								<a href={telHref(entry.phone)} className="btn-primary shrink-0">
									{t("card.call")} {entry.phone}
									<span className="visually-hidden">, {entry.name}</span>
								</a>
							) : chat ? (
								<a href={chat} className="btn-secondary shrink-0">
									{t("detail.chat")}
									<span className="visually-hidden">, {entry.name}</span>
								</a>
							) : null}
						</li>
					)
				})}
			</ul>
		</section>
	)
}
```

In `LandingPage.tsx`, import it and render `<Helplines />` inside `.landing-help`, right after the emergency `</section>`. In `LandingSearch.tsx`, the comment "The landing fetches nothing on render" is no longer true without baked data; change it to "The search box fetches nothing on render".

Append inside `@layer components` in `main.css`:

```css
	.helpline-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.25rem 0.75rem;
	}
	.helpline-name {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		color: var(--text);
		font-weight: 600;
	}
```

- [ ] **Step 5: Run, show red once, commit**

Run: `npm test`. Expected: PASS.
Red proof: replace `safeChatUrl(entry.chatUrl)` with `entry.chatUrl`; "a chat URL that is not https" FAILS; restore.

```bash
npx biome ci .
git add src/components/Helplines.tsx src/components/LandingPage.tsx src/components/LandingSearch.tsx src/styles/main.css src/i18n tests/helplinesSection.test.tsx tests/landing.test.tsx tests/shell.test.tsx tests/axe.test.tsx
git commit -m "feat: add Noen å snakke med with five helplines to the landing page"
```

### Task 15: Trust line, Shift hint, the 950 px check, and PR 4

**Files:**
- Modify: `web/src/components/LandingPage.tsx`, `web/src/i18n/nb.json`, `web/src/i18n/en.json`, spacing classes in `web/src/App.tsx`, `LandingPage.tsx` and `Footer.tsx` (tuning only)
- Test: `web/tests/landing.test.tsx`, `web/e2e/landing.spec.ts`

**Interfaces:**
- Consumes: everything above; `setTheme`, `settle`, `THEMES`.
- Produces: `section[aria-labelledby=trust]` as a flex row; Task 19 appends the install hint to it.

- [ ] **Step 1: Write the failing tests**

Append to `web/tests/landing.test.tsx`:

```tsx
test("the trust line is one muted line, followed by the Shift hint", () => {
	stubCatalog()
	render(<App />)
	const trust = screen.getByRole("region", { name: "Derfor kan du stole på Varde" })
	expect(trust).toHaveTextContent(
		"Ingen sporing · Hvert nummer kopiert fra kilden · Sjekkes hvert halvår"
	)
	expect(trust).toHaveTextContent("Trykk Shift tre ganger for å forlate siden raskt.")
})
```

Append to `web/e2e/landing.spec.ts` (add `setTheme` and `THEMES` to its helpers import):

```ts
for (const width of [1280, 1920]) {
	for (const theme of THEMES) {
		for (const path of ["/", "/en/"]) {
			test(`landing ${path} fits 950 px at ${width} px (${theme}), footer included`, async ({
				page,
			}) => {
				await page.setViewportSize({ width, height: 950 })
				await setTheme(page, theme)
				await page.goto(path)
				await settle(page)
				await expect(
					page.getByRole("region", { name: /Noen å snakke med|Someone to talk to/ })
				).toBeVisible()
				const height = await page.evaluate(() => document.documentElement.scrollHeight)
				expect(height).toBeLessThanOrEqual(950)
			})
		}
	}
}
```

- [ ] **Step 2: The strings and the trust section**

`nb.json`: delete `landing.trustNoTracking`, `landing.trustSources`, `landing.trustVerified`; add:

```json
	"landing.trustLine": "Ingen sporing · Hvert nummer kopiert fra kilden · Sjekkes hvert halvår",
	"landing.shiftHint": "Trykk Shift tre ganger for å forlate siden raskt.",
```

`en.json`: delete the same three; add:

```json
	"landing.trustLine": "No tracking · Every number copied from its source · Checked every six months",
	"landing.shiftHint": "Press Shift three times to leave quickly.",
```

In `LandingPage.tsx`, delete `NEXT_VERIFICATION_PASS` and its comment, and replace the trust `<section>` with:

```tsx
			<section
				aria-labelledby="trust"
				className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-border pt-4 text-sm text-muted"
			>
				<h2 id="trust" className="visually-hidden">
					{t("landing.trustHeading")}
				</h2>
				<p>{t("landing.trustLine")}</p>
				<p>{t("landing.shiftHint")}</p>
			</section>
```

- [ ] **Step 3: Run the unit test, then measure**

Run: `npm test`. Expected: PASS.

```bash
npm run build && npx playwright test landing
```

If a fit test fails, measure where the height goes, in the browser at 1280 x 950 (`npx playwright test landing --debug`, or a one-off `page.evaluate` that prints `getBoundingClientRect().height` for the strip, header, `.hero`, `.landing-help`, the trust section and the footer). Then trim spacing in this order, rebuilding and re-running after each:
1. `<main>` in `App.tsx`: `py-6` to `py-6 lg:py-4`.
2. `.hero` and `.landing-help`: `lg:py-4` to `lg:py-2`.
3. Hero gaps: `mt-6` (search and browse label) to `mt-6 lg:mt-4`.
4. Trust section: `mt-6 pt-4` to `mt-4 pt-3`.
5. Footer: `mt-6` to `mt-4`.

Stop rule: if it is still over 950 after all five, stop. Report the measured block heights to Malin and do not shrink text, controls or targets to make it fit.

- [ ] **Step 4: Show the fit check red once**

Add `lg:pt-40` to `.hero`; rebuild; the 1280 fit tests FAIL; remove it and rebuild.

- [ ] **Step 5: Commit and ship PR 4**

```bash
npm test && npx biome ci . && npx playwright test
git add src/components/LandingPage.tsx src/App.tsx src/components/Footer.tsx src/i18n tests/landing.test.tsx e2e/landing.spec.ts
git commit -m "feat: fold the trust line into one row and fit the landing page in 950 px"
```

Blocked until Malin has decided the Arbeidslivstelefonen "tast 3" item (Open items). Follow "Shipping a PR" with title `feat: landing page fits one screen, with helplines and a balanced hero`. Red proofs: Task 12 Step 9, Task 13 Step 6, Task 14 Step 5, Task 15 Step 4. Manual before merge: screenshots at 375 and 1920 x 950 in both themes; at 320 and 375 px, no emergency button label runs past its button edge in the 2 x 2 grid (centred overflow shows no horizontal scroll, so the reflow check cannot see it); an NVDA pass over the helplines.

---

# PR 5: `feat/card-slots`

### Task 16: Card slots on a subgrid

**Files:**
- Modify: `web/src/components/ResourceCard.tsx`, `web/src/components/ListPage.tsx`, `web/src/components/KommunePage.tsx`, `web/src/styles/main.css`
- Test: `web/e2e/cards.spec.ts` (create), existing `tests/list.test.tsx`, `tests/kommune.test.tsx` must stay green

**Interfaces:**
- Consumes: `setTheme`, `THEMES`.
- Produces: each card is `li.card` with eight direct children carrying `data-slot` = `title`, `badges`, `kommune`, `fallback`, `description`, `hours`, `actions`, `verified`; the lists carry class `card-grid`.

- [ ] **Step 1: Branch**

```bash
git switch main && git pull && git switch -c feat/card-slots
```

- [ ] **Step 2: Write the browser check**

Create `web/e2e/cards.spec.ts`:

```ts
import { expect, test } from "@playwright/test"
import { setTheme, THEMES } from "./helpers.ts"

const SLOTS = [
	"title",
	"badges",
	"kommune",
	"fallback",
	"description",
	"hours",
	"actions",
	"verified",
]

for (const theme of THEMES) {
	test(`at 1280 px every slot lines up across each row of cards (${theme})`, async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 950 })
		await setTheme(page, theme)
		await page.goto("/sok")
		await expect(page.locator(".card").first()).toBeVisible()
		const rows = await page.locator(".card").evaluateAll((cards) => {
			const byTop = new Map<number, Record<string, number>[]>()
			for (const card of cards) {
				const top = Math.round(card.getBoundingClientRect().top)
				const slots: Record<string, number> = {}
				for (const slot of card.querySelectorAll<HTMLElement>(":scope > [data-slot]")) {
					// Compare the margin edge: a filled slot carries a 0.75rem top margin and an empty
					// one none, so the margin edge is what sits on the shared subgrid track.
					const margin = Number.parseFloat(getComputedStyle(slot).marginTop)
					slots[slot.dataset.slot ?? ""] = slot.getBoundingClientRect().top - margin
				}
				byTop.set(top, [...(byTop.get(top) ?? []), slots])
			}
			return [...byTop.values()].filter((row) => row.length > 1)
		})
		expect(rows.length).toBeGreaterThan(0)
		for (const row of rows) {
			for (const slot of SLOTS) {
				const tops = row.map((cardSlots) => cardSlots[slot])
				expect(Math.max(...tops) - Math.min(...tops), slot).toBeLessThanOrEqual(1)
			}
		}
	})
}
```

- [ ] **Step 3: Run it to see it fail**

```bash
npm run build && npx playwright test cards
```

Expected: FAIL. Today's cards have no `.card` class, so `toBeVisible` times out.

- [ ] **Step 4: The card**

Replace the returned `<li>` in `web/src/components/ResourceCard.tsx` with:

```tsx
		<li className="card rounded-xl border bg-surface p-4">
			<Heading data-slot="title" className="text-lg font-semibold leading-snug">
				<Link to={`/resources/${resource.id}`} className="text-fg">
					{resource.name}
				</Link>
			</Heading>
			{/* Every slot renders even when empty, so the slots below it stay in line with the
			    other cards in the row (spec: Cards, item 4). */}
			<div data-slot="badges">
				<ResourceBadges resource={resource} />
			</div>
			<div data-slot="kommune">
				{resource.municipalityName &&
					(kommuneSlug ? (
						<p className="text-sm text-muted">
							<Link to={`/kommune/${kommuneSlug}`}>{resource.municipalityName}</Link>
						</p>
					) : (
						<p className="text-sm text-muted">{resource.municipalityName}</p>
					))}
			</div>
			<div data-slot="fallback">
				{resource.isFallbackTranslation && (
					<p className="text-sm text-muted">{t("card.fallback")}</p>
				)}
			</div>
			{/* Full description, never clamped: closure notices and safety lines live here. */}
			<p data-slot="description">{resource.description}</p>
			<div data-slot="hours">
				{resource.openingHours && (
					<p className="text-sm">
						<span className="text-muted">{t("card.hours")}:</span> {resource.openingHours}
					</p>
				)}
			</div>
			<p data-slot="actions" className="flex flex-wrap gap-2">
				{resource.phone ? (
					<a href={telHref(resource.phone)} className="btn-primary">
						{t("card.call")} {resource.phone}
					</a>
				) : (
					<span className="self-center text-sm text-muted">{t("card.noPhone")}</span>
				)}
				<Link to={`/resources/${resource.id}`} className="btn-secondary">
					{t("card.details")}
				</Link>
			</p>
			<p data-slot="verified" className="text-xs text-muted">
				{t("card.lastVerified")} {resource.lastVerified}
			</p>
		</li>
```

In `ListPage.tsx` (one list) and `KommunePage.tsx` (two lists), change `className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"` on the card `<ul>` to `className="card-grid grid gap-x-4 md:grid-cols-2 xl:grid-cols-3"`.

Append inside `@layer components` in `main.css`:

```css
	/* Result cards line up slot by slot across a row (spec: Cards, item 4). The list defines no
	   rows of its own; each card spans eight and adopts them with subgrid, so a title that wraps
	   pushes that slot down in every card of the row. Spacing is a top margin on filled slots,
	   not a row gap, so a slot no card in the row uses collapses to nothing. */
	.card-grid {
		row-gap: 0;
	}
	/* The border colour lives here, not in a border-border utility: Tailwind's utilities layer
	   beats @layer components, so a utility colour would cancel Task 17's hover border. */
	.card {
		display: grid;
		grid-row: span 8;
		grid-template-rows: subgrid;
		row-gap: 0;
		margin-block-end: 1rem;
		border-color: var(--border);
	}
	.card > [data-slot]:not(:first-child):not(:empty) {
		margin-block-start: 0.75rem;
	}
	.card > [data-slot="actions"] {
		align-self: end;
	}
```

- [ ] **Step 5: Run everything, show red once, commit**

```bash
npm test && npm run build && npx playwright test
```

Expected: PASS (unit tests query by role and text, so the wrappers do not break them).
Red proof: remove `grid-template-rows: subgrid;`; rebuild; the cards check FAILS on the first slot that drifts (usually `badges`); restore and rebuild.

```bash
npx biome ci .
git add src/components/ResourceCard.tsx src/components/ListPage.tsx src/components/KommunePage.tsx src/styles/main.css e2e/cards.spec.ts
git commit -m "feat: line result cards up slot by slot with subgrid"
```

### Task 17: Hover depth, and PR 5

**Files:**
- Modify: `web/src/styles/main.css`
- Test: `web/e2e/cards.spec.ts`

**Interfaces:**
- Consumes: `.card` (Task 16), `.chip` (Task 12), `.btn-primary`, `.btn-secondary`.
- Produces: nothing new.

- [ ] **Step 1: Write the browser checks**

Append to `web/e2e/cards.spec.ts`:

```ts
test("a card lifts 2 px on hover", async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 950 })
	await page.goto("/sok")
	const card = page.locator(".card").first()
	await expect(card).toBeVisible()
	expect(await page.evaluate(() => matchMedia("(hover: hover)").matches)).toBe(true)
	await card.hover()
	await page.waitForTimeout(250)
	const lift = await card.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42)
	expect(lift).toBeCloseTo(-2, 1)
})

test("with reduced motion a hovered card does not move, but its border changes", async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: "reduce" })
	await page.setViewportSize({ width: 1280, height: 950 })
	await page.goto("/sok")
	const card = page.locator(".card").first()
	await expect(card).toBeVisible()
	const before = await card.evaluate((el) => getComputedStyle(el).borderTopColor)
	await card.hover()
	await page.waitForTimeout(250)
	const after = await card.evaluate((el) => ({
		transform: getComputedStyle(el).transform,
		border: getComputedStyle(el).borderTopColor,
	}))
	expect(after.transform).toBe("none")
	expect(after.border).not.toBe(before)
})
```

- [ ] **Step 2: Run to see them fail**

```bash
npm run build && npx playwright test cards
```

Expected: both hover tests FAIL (no lift, no border change).

- [ ] **Step 3: The hover rules**

Append inside `@layer components` in `main.css`:

```css
	/* A little depth on hover (spec: item 5), only with a real pointer. Under reduced motion
	   nothing moves; the border colour alone marks hover. Focus styles are unchanged. */
	@media (hover: hover) {
		/* Not the accent chip: its accent border is its identity, and .chip:hover would beat
		   .chip-acute on specificity and turn it grey. */
		.card:hover,
		.chip:not(.chip-acute):hover,
		.btn-secondary:hover {
			border-color: var(--muted);
		}
	}
	@media (hover: hover) and (prefers-reduced-motion: no-preference) {
		.card,
		.chip,
		.btn-primary,
		.btn-secondary {
			transition:
				transform 150ms ease-out,
				box-shadow 150ms ease-out,
				border-color 150ms ease-out;
		}
		.card:hover,
		.chip:hover,
		.btn-primary:hover,
		.btn-secondary:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgb(0 0 0 / 0.08);
		}
	}
```

- [ ] **Step 4: Run, show red once, commit, ship**

```bash
npm run build && npx playwright test
```

Expected: PASS.
Red proof: drop `and (prefers-reduced-motion: no-preference)` from the second media query; rebuild; the reduced-motion test FAILS (the card moves); restore and rebuild.

```bash
npm test && npx biome ci .
git add src/styles/main.css e2e/cards.spec.ts
git commit -m "feat: add a subtle hover lift to cards, chips and buttons"
```

Follow "Shipping a PR" with title `feat: aligned result cards and hover depth`. Red proofs: Task 16 Step 5, Task 17 Step 4. Manual before merge: Malin checks the hover feels subtle.

---

# PR 6: `feat/install`

### Task 18: Web manifest and theme colours

**Files:**
- Create: `web/public/manifest.webmanifest`
- Modify: `web/index.html`
- Test: `web/tests/manifest.test.ts` (create)

**Interfaces:**
- Consumes: the four icons sub-project D shipped in `web/public/`.
- Produces: an installable site (no service worker).

- [ ] **Step 1: Branch**

```bash
git switch main && git pull && git switch -c feat/install
```

- [ ] **Step 2: Write the failing test**

Create `web/tests/manifest.test.ts`:

```ts
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test } from "vitest"

const web = join(dirname(fileURLToPath(import.meta.url)), "..")
const read = (path: string) => readFileSync(join(web, path), "utf8")

// PNG width and height sit in the IHDR chunk, bytes 16 to 23, big-endian.
function pngSize(path: string): [number, number] {
	const bytes = readFileSync(join(web, path))
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
	return [view.getUint32(16), view.getUint32(20)]
}

function ground(css: string, selector: RegExp): string {
	const block = css.match(selector)?.[1] ?? ""
	return block.match(/--ground:\s*(#[0-9a-f]{6})/)?.[1] ?? "missing"
}

const manifest = JSON.parse(read("public/manifest.webmanifest"))
const tokens = read("src/styles/tokens.css")
const lightGround = ground(tokens, /:root\s*\{([^}]*)\}/)
const darkGround = ground(tokens, /\[data-theme="dark"\]\s*\{([^}]*)\}/)

test("the manifest names Varde, starts at / and installs standalone", () => {
	expect(manifest).toMatchObject({
		name: "Varde",
		short_name: "Varde",
		lang: "nb",
		start_url: "/",
		scope: "/",
		display: "standalone",
	})
	expect(manifest.background_color).toBe(lightGround)
	expect(manifest.theme_color).toBe(lightGround)
})

test("every icon exists at its stated size, with both any and maskable present", () => {
	for (const icon of manifest.icons) {
		const file = `public${icon.src}`
		expect(existsSync(join(web, file)), file).toBe(true)
		const [w, h] = pngSize(file)
		expect(`${w}x${h}`, file).toBe(icon.sizes)
	}
	const purposes = manifest.icons.map((i: { purpose: string }) => i.purpose)
	expect(purposes.filter((p: string) => p === "any")).toHaveLength(2)
	expect(purposes.filter((p: string) => p === "maskable")).toHaveLength(2)
})

test("index.html links the manifest and sets a theme colour per scheme, Search Console tag untouched", () => {
	const html = read("index.html")
	expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest" />')
	expect(html).toContain(
		`<meta name="theme-color" media="(prefers-color-scheme: light)" content="${lightGround}" />`
	)
	expect(html).toContain(
		`<meta name="theme-color" media="(prefers-color-scheme: dark)" content="${darkGround}" />`
	)
	expect(html.split("\n")[6]).toContain('name="google-site-verification"')
})
```

Add the one Node type this needs to `web/tests/node-builtins.d.ts` if `tsc` complains: `node:url`'s `fileURLToPath` is already declared there (tokens.test.ts uses it), so nothing should be missing.

- [ ] **Step 3: Run to see it fail**

Run: `npx vitest run tests/manifest.test.ts`
Expected: FAIL, no manifest file.

- [ ] **Step 4: The manifest and the head tags**

Create `web/public/manifest.webmanifest`:

```json
{
	"name": "Varde",
	"short_name": "Varde",
	"lang": "nb",
	"start_url": "/",
	"scope": "/",
	"display": "standalone",
	"background_color": "#f6f2ea",
	"theme_color": "#f6f2ea",
	"icons": [
		{ "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
		{ "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
		{
			"src": "/icon-maskable-192.png",
			"sizes": "192x192",
			"type": "image/png",
			"purpose": "maskable"
		},
		{
			"src": "/icon-maskable-512.png",
			"sizes": "512x512",
			"type": "image/png",
			"purpose": "maskable"
		}
	]
}
```

In `web/index.html`, after the `apple-touch-icon` line (line 11), add:

```html
		<!-- Installable, online-only: no service worker, because an offline cache fights
		     "always current". default-src 'self' in the CSP covers manifest-src. -->
		<link rel="manifest" href="/manifest.webmanifest" />
		<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f6f2ea" />
		<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0b0d10" />
```

The inline script is untouched, so `tests/headers.test.ts` still matches its CSP hash.

- [ ] **Step 5: Run, show red once, commit**

Run: `npm test`. Expected: PASS (including `headers.test.ts`).
Red proof: change the manifest's `icon-512.png` entry to `"sizes": "384x384"`; the icon test FAILS; restore.

```bash
npx biome ci .
git add public/manifest.webmanifest index.html tests/manifest.test.ts
git commit -m "feat: add a web manifest so Varde can be installed, online-only"
```

### Task 19: The install hint

**Files:**
- Create: `web/src/components/InstallHint.tsx`
- Modify: `web/src/components/LandingPage.tsx`, `web/src/styles/main.css`, `web/src/i18n/nb.json`, `web/src/i18n/en.json`
- Test: `web/tests/installHint.test.tsx` (create)

**Interfaces:**
- Consumes: the trust section (Task 15).
- Produces: `InstallHint()`; `details.install-hint`, hidden under `(display-mode: standalone)`.

The menu labels below are copied from the vendors' help pages, read 2026-10-02: Apple iPhone User Guide "Add a website icon to your Home Screen" (support.apple.com/guide/iphone/iph42ab2f3a7/ios and /nb-no/), Google Chrome Help "Use progressive web apps" (support.google.com/chrome/answer/9658361, hl=en and hl=no), Microsoft Edge "Install, manage or uninstall apps in Microsoft Edge" (en-us and nb-no). Two need a check on a real device before merge (Open items): Apple's nb pages for iOS 26 and 27 leave "Share" in English, so the nb step uses "Del" from the iOS 18 nb page; Edge's nb labels read as machine-translated.

- [ ] **Step 1: Write the failing test**

Create `web/tests/installHint.test.tsx`:

```tsx
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { render, screen, within } from "@testing-library/react"
import { expect, test } from "vitest"
import { App } from "../src/App.tsx"
import { stubDataFiles } from "./stubData.ts"

test("the landing page offers the install steps for iPhone, Android and computer", () => {
	stubDataFiles()
	render(<App />)
	const hint = screen
		.getByText("Legg Varde på hjemskjermen: slik gjør du")
		.closest("details") as HTMLElement
	expect(hint).toHaveClass("install-hint")
	const steps = within(hint).getAllByRole("listitem")
	expect(steps).toHaveLength(3)
	expect(steps[0]).toHaveTextContent("Legg til på Hjem-skjermen")
	expect(steps[1]).toHaveTextContent("Installer og opprett snarvei")
	expect(steps[2]).toHaveTextContent("Installer siden som app")
})

test("the hint hides itself once Varde runs installed", () => {
	const css = readFileSync(
		join(dirname(fileURLToPath(import.meta.url)), "../src/styles/main.css"),
		"utf8"
	)
	expect(css).toMatch(
		/@media \(display-mode: standalone\)\s*\{\s*\.install-hint\s*\{\s*display: none;/
	)
})
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run tests/installHint.test.tsx`
Expected: FAIL.

- [ ] **Step 3: The strings**

`nb.json`:

```json
	"install.summary": "Legg Varde på hjemskjermen: slik gjør du",
	"install.iosLabel": "iPhone og iPad (Safari):",
	"install.iosSteps": "Åpne Del-menyen i Safari, velg «Legg til på Hjem-skjermen» og trykk «Legg til».",
	"install.androidLabel": "Android (Chrome):",
	"install.androidSteps": "Trykk på Mer til høyre for adressefeltet, velg «Installer og opprett snarvei» og så «Installer».",
	"install.desktopLabel": "Datamaskin (Chrome eller Edge):",
	"install.desktopSteps": "I Chrome: Mer, så «Cast, lagre og del», så «Installer siden som app…». I Edge: «Innstillinger og mer», så «Flere verktøy», «Apps» og «Installer dette området som en app».",
```

`en.json`:

```json
	"install.summary": "Add Varde to your home screen: how",
	"install.iosLabel": "iPhone and iPad (Safari):",
	"install.iosSteps": "Open Safari's Share menu, choose “Add to Home Screen”, then tap “Add”.",
	"install.androidLabel": "Android (Chrome):",
	"install.androidSteps": "Tap More to the right of the address bar, then “Install and create shortcut”, then “Install”.",
	"install.desktopLabel": "Computer (Chrome or Edge):",
	"install.desktopSteps": "In Chrome: More, then “Cast, save, and share”, then “Install page as app...”. In Edge: “Settings and more”, then “More tools”, “Apps” and “Install this site as an app”.",
```

- [ ] **Step 4: The component**

Create `web/src/components/InstallHint.tsx`:

```tsx
import { useTranslation } from "../i18n/LanguageProvider.tsx"

const STEPS = [
	["install.iosLabel", "install.iosSteps"],
	["install.androidLabel", "install.androidSteps"],
	["install.desktopLabel", "install.desktopSteps"],
] as const

// Instructions, not an install button: there is no service worker, and the browsers that
// would offer a prompt differ anyway. Hidden once Varde runs installed (main.css).
export function InstallHint() {
	const t = useTranslation()
	return (
		<details className="install-hint">
			{/* No flex here: summary keeps display: list-item, so the native disclosure triangle
			    stays and the hint looks like something that opens. text-sm plus py-3 is 44 px. */}
			<summary className="min-h-11 cursor-pointer py-3">
				{t("install.summary")}
			</summary>
			<ol className="mt-1 grid gap-2 pb-2">
				{STEPS.map(([label, steps]) => (
					<li key={label}>
						<strong className="font-semibold text-fg">{t(label)}</strong> {t(steps)}
					</li>
				))}
			</ol>
		</details>
	)
}
```

In `LandingPage.tsx`, import it and render `<InstallHint />` as the last child of the trust `<section>`.

Append inside `@layer components` in `main.css`:

```css
	@media (display-mode: standalone) {
		.install-hint {
			display: none;
		}
	}
```

- [ ] **Step 5: Run, show red once, commit**

```bash
npm test && npm run build && npx playwright test
```

Expected: PASS. If the 950 px fit fails (the trust row grows from a 20 px line to the 44 px summary, more if it wraps at 1280), measure the trust section and trim with Task 15 Step 3's list. Task 15's stop rule applies, and the summary never drops below 44 px.
Red proof: change `display-mode: standalone` to `display-mode: browser` in the CSS; the unit test FAILS; restore.

```bash
npx biome ci .
git add src/components/InstallHint.tsx src/components/LandingPage.tsx src/styles/main.css src/i18n tests/installHint.test.tsx
git commit -m "feat: add an install hint with the vendors' own menu labels"
```

### Task 20: Back arrow in installed mode, and PR 6

**Files:**
- Create: `web/src/components/BackButton.tsx`
- Modify: `web/src/components/Header.tsx`, `web/src/styles/main.css`, `web/src/i18n/nb.json`, `web/src/i18n/en.json`
- Test: `web/tests/backButton.test.tsx` (create)

**Interfaces:**
- Consumes: `ArrowLeftIcon` (Task 7), `useNavigate`, `useCurrentUrl`, `useLanguage`, `parseUrl`.
- Produces: `BackButton()`; `button.back-button` as the first child of `.header-row` on every route except the landing page.

- [ ] **Step 1: Write the failing tests**

Create `web/tests/backButton.test.tsx`:

```tsx
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"
import { stubDataFiles } from "./stubData.ts"

afterEach(() => {
	vi.restoreAllMocks()
	window.history.replaceState(null, "", "/")
})

test("the back arrow is in the markup on every page but the landing page", () => {
	stubDataFiles()
	window.history.replaceState(null, "", "/sok")
	const { unmount } = render(<App />)
	expect(screen.getByRole("button", { name: "Tilbake" })).toHaveClass("back-button")
	unmount()
	window.history.replaceState(null, "", "/")
	render(<App />)
	expect(screen.queryByRole("button", { name: "Tilbake" })).toBeNull()
})

test("with history behind it, the arrow goes back", async () => {
	stubDataFiles()
	window.history.replaceState(null, "", "/sok")
	vi.spyOn(window.history, "length", "get").mockReturnValue(2)
	const back = vi.spyOn(window.history, "back").mockImplementation(() => {})
	render(<App />)
	await userEvent.click(screen.getByRole("button", { name: "Tilbake" }))
	expect(back).toHaveBeenCalledTimes(1)
})

test("opened straight onto a page, the arrow goes to the landing page in the same language", async () => {
	stubDataFiles()
	window.history.replaceState(null, "", "/en/sok")
	vi.spyOn(window.history, "length", "get").mockReturnValue(1)
	render(<App />)
	await userEvent.click(screen.getByRole("button", { name: "Back" }))
	expect(window.location.pathname).toBe("/en/")
})

test("CSS shows the arrow only when Varde runs installed", () => {
	const css = readFileSync(
		join(dirname(fileURLToPath(import.meta.url)), "../src/styles/main.css"),
		"utf8"
	)
	expect(css).toMatch(/\.back-button\s*\{\s*display: none;/)
	expect(css).toMatch(
		/@media \(display-mode: standalone\)\s*\{\s*\.back-button\s*\{\s*display: inline-flex;/
	)
})
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run tests/backButton.test.tsx`
Expected: FAIL, no "Tilbake" button.

- [ ] **Step 3: The button**

`nb.json`: `"header.back": "Tilbake",` and `en.json`: `"header.back": "Back",`.

Create `web/src/components/BackButton.tsx`:

```tsx
import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { useNavigate } from "../navigation.ts"
import { ArrowLeftIcon } from "./icons.tsx"

// Installed (standalone) mode has no browser back button, so the app brings its own (spec:
// A4). An app opened straight onto a detail page has no history in this window, so the arrow
// goes to the landing page instead. CSS shows it only in standalone mode, so the prerendered
// HTML is the same for everyone and nothing changes at hydration.
export function BackButton() {
	const t = useTranslation()
	const { lang } = useLanguage()
	const navigate = useNavigate()
	return (
		<button
			type="button"
			className="btn-secondary back-button min-w-11"
			onClick={() => {
				if (window.history.length > 1) window.history.back()
				else navigate("/", "", { lang })
			}}
		>
			<ArrowLeftIcon />
			<span className="visually-hidden">{t("header.back")}</span>
		</button>
	)
}
```

In `Header.tsx`, add the imports `import { useCurrentUrl } from "../navigation.ts"`, `import { parseUrl } from "../services/urlState.ts"` and `import { BackButton } from "./BackButton.tsx"`. In `Header()`, after `const t = useTranslation()`, add:

```tsx
	const isLanding = parseUrl(useCurrentUrl().pathname).route.kind === "landing"
```

and render `{!isLanding && <BackButton />}` as the first child of `.header-row`, before the brand link.

Append inside `@layer components` in `main.css` (after `.btn-secondary`, so this `display` wins):

```css
	.back-button {
		display: none;
	}
	@media (display-mode: standalone) {
		.back-button {
			display: inline-flex;
		}
	}
```

- [ ] **Step 4: Run, show red once, commit**

```bash
npm test && npm run build && npx playwright test
```

Expected: PASS. The header-row browser check is unchanged, because the arrow is `display: none` outside standalone mode.
Red proof: change `window.history.length > 1` to `window.history.length > 2`; "with history behind it" FAILS; restore.

```bash
npx biome ci .
git add src/components/BackButton.tsx src/components/Header.tsx src/styles/main.css src/i18n tests/backButton.test.tsx
git commit -m "feat: add a back arrow when Varde runs as an installed app"
```

- [ ] **Step 5: Ship PR 6**

Blocked until the two install labels are checked on a real device (Open items). Follow "Shipping a PR" with title `feat: installable PWA with an install hint and a back arrow`. Red proofs: Task 18 Step 5, Task 19 Step 5, Task 20 Step 4. Manual before merge: Malin installs Varde on her Android phone from `varde.pages.dev` (a preview deploy, or the live site after merge), checks the icon, the standalone window, the back arrow on a detail page, and that the install hint is gone inside the app.

---

## Spec coverage

| Spec item | Task |
|---|---|
| Header links (8, A1) | 6 |
| Language picker (A2) | 7, 8 |
| Theme picker (A2) | 7, 9 |
| Quick exit, Shift x3, always in view (7) | 10, 11 |
| Header row rule, focus not hidden, 320 px, forced colours | 11, 5 |
| Hero spacing (16) | 12 |
| Chips (3) | 12 |
| Emergency intro and 2 x 2 (2) | 12 |
| Noen å snakke med (9) | 13, 14 |
| Side by side (two columns from 1024 px, amended) | 12, 14 |
| Trust line and Shift hint (17) | 15 |
| Fit 950 px (17) | 15 |
| Targets 44 x 44 | 5, 6, 7, 12, 14, 19, 20 (`min-h-11` or a 44 px rule on every new control; the header row test measures the header ones, the rest are checked in the manual screenshots) |
| Card slots (4) | 16 |
| Hover (5) | 17 |
| Om Varde route, footer, Meld feil (A3) | 3, 4, 5 |
| Manifest (P) | 18 |
| Install hint (P) | 19 |
| Back arrow (A4) | 20 |
| Playwright harness, snapshot, CI | 1, 2 |
| No `style=` in prerendered HTML | 3 |
| Every check shown red once | the last steps of every task |

## Considered and rejected

- **Keyboard order under 1024 px.** The DOM runs brand, nav, tools while the screen shows the tools above the nav. Two DOM orders would trade this for a mismatch on desktop or a duplicated nav, so I keep one order (Task 6 comment).
- **Shift-click counts as a clean Shift press.** Opening a link in a new window with Shift-click three times leaves the page. GOV.UK has the same edge, and it costs one reload of Varde.
- **Choosing the language that is already current** navigates to the same URL. Harmless, and the row is marked current, so I add no guard.
- **Hardening the detail page's existing website and chat links** stays in sub-project E, as the spec says; only the new helpline link gets the `https://` check.

> Stress-tested 2026-10-02 (spec-stress-test skill): 31 applied, 3 left for Malin.
