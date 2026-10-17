# Varde Back and Forward Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Back and Forward buttons in the installed Varde app (display mode standalone), plus the web manifest that makes Varde installable.

**Architecture:** The router (`useUrlState`) learns to count entries, save where you were before each push, and tell subscribers about every push and traversal. Pure services hold the entry state shape, the fallback counter and the focus return. One `HistoryButtons` component renders a bottom bar below 1024 px and two icons before the brand from 1024 px; CSS shows them only in installed mode, switched on by `@media (display-mode: standalone)` or by `data-standalone` on `<html>` (set by `main.tsx` from `navigator.standalone`). `useArrivalFocus` gains two cases: a return by Back or Forward (scroll back and focus the followed link) and a same-route restore.

**Tech Stack:** React 19 + TypeScript, Vite 8, Tailwind v4 with `main.css` component classes, Vitest 5 + Testing Library + jsdom, Playwright 1.64 (Chromium) against `npm run build:site`, Biome.

**Spec:** `docs/superpowers/specs/2026-10-16-varde-back-forward-design.md` (approved 2026-10-16, on `docs/back-forward-spec`). Read it before any task. Where this plan and the spec disagree, the spec wins; stop and ask. The one known disagreement is below, and Malin settles it before the build starts.

## Spec correction (applied 2026-10-17)

The spec says Back-to-home "adds an entry, so Forward can return", and its Testing section says "Back goes to the landing page; Forward then returns to the detail page". A browser cannot do that. Going home through the router is a push, and a push puts the landing page *after* the detail page: the detail page is then behind you, so **Back** returns to it and Forward stays disabled. No history API can insert an entry before the current one. The spec's own "Considered and rejected" note on the double tap already describes this (the second tap of Back returns to where you started). This plan builds and tests the real behaviour: after Back-to-home, Back returns to the detail page and Forward is off. The spec line should read "That adds an entry, so Back can return" and the test line "Back goes to the landing page; Back again returns to the detail page, and Forward then goes home again". Applied to the spec on 2026-10-17, together with the matching "Back could not return" in its "Considered and rejected" note.

## Global Constraints

- Installed mode only. In a browser tab both layouts are `display: none`.
- The quick exit "Forlat siden" keeps calling `location.replace(EXIT_URL)`. Never touch `QuickExit.tsx` or `services/quickExit.ts`.
- Touch targets 44 px. Controls on one row share one height and one bottom edge.
- Every new string in nb and en: `history.label` Sidehistorikk / Page history, `history.back` Tilbake / Back, `history.forward` Fremover / Forward.
- No visible text on either layout: arrows only, names as visually hidden text.
- Mobile-first CSS: baseline is the smallest screen; `min-width` queries only (1024 px here).
- Nothing written to `localStorage` or `sessionStorage`. No service worker.
- No `style="..."` attribute in prerendered HTML (the CSP hashes inline styles; `scripts/prerender.mjs` rejects them). Setting a custom property through `element.style.setProperty` at runtime is CSSOM and is allowed.
- The Search Console meta tag stays on `web/index.html` line 7.
- Biome style: tabs, double quotes, no semicolons, line width 100. Comments in first person where they speak for me, no em dashes.
- Format first with `npx biome check --write .` (the code blocks below are not always wrapped at 100). Suites before every commit that touches code: `npx biome ci .`, `npm run typecheck`, `npm test`; e2e tasks also run `npx playwright test` after `npm run build:site` (with `public/data` filled from `e2e/fixtures/data`).
- Commits: author `malinfossum.dev@proton.me`, no `Co-Authored-By`, no AI attribution.

## Review Focus

1. **A history entry written by the Varde already deployed** (`{ from: "sok" }` with no `idx`, in a tab left open across a deploy) must keep `from` and gain `idx`, not break the detail page's "Tilbake til resultater". Pinned in Task 3 (`mergeEntry`) and Task 4 (mount stamping).
2. **A fragment entry** (the skip link `#main`, `/om#meld-feil`) has no router state. Without the Navigation API it must get the next `idx`, not be counted as entry 0. Pinned in Task 4.
3. **The followed link is inside a closed Meny or a closed picker** when you come back. It must never take focus; focus falls back to the heading at the top. Pinned in Task 5.
4. **Two quick presses of Back** must restore the entry you end on, not the first one. Pinned in Task 5 (values read when the page is ready).
5. **Text at 200 %** makes the bar taller; the page padding must follow its real height so the footer's last line stays clear. Pinned in Task 7 (e2e at 320 px).

---

## Before Task 1: setup

PR #78 (`feat/helplines-c2a`) must be merged first. It touches `App.tsx`, `main.css`, the i18n files and `entry-server.tsx`, so line numbers below are from `main` at 7a88fb7 and may have moved; find the code by the quoted text, not the line.

```bash
git fetch origin
git switch -c feat/back-forward origin/docs/back-forward-spec
git rebase origin/main
cd web
npm ci
mkdir -p public/data && cp e2e/fixtures/data/*.json public/data/
```

The branch then carries the spec and this plan, so the PR ships them with the code. No PostgreSQL is needed: this is web-only work.

---

### Task 1: Installed-mode detection, and how Playwright forces it

**Files:**
- Create: `web/src/services/standalone.ts`
- Create: `web/tests/standalone.test.ts`
- Create: `web/e2e/installed.spec.ts`
- Modify: `web/src/main.tsx` (before the `hydrateRoot` / `createRoot` branch)
- Modify: `web/e2e/helpers.ts` (add `forceInstalled`)

**Interfaces:**
- Produces: `markStandalone(root: HTMLElement, nav: Navigator): void` and `isIosStandalone(nav: Navigator): boolean` in `services/standalone.ts`. `forceInstalled(page: Page): Promise<void>` in `e2e/helpers.ts`; every later installed-mode e2e calls it before `page.goto`.

- [ ] **Step 1: Probe which installed-mode path Playwright can force**

The spec asks this to be settled before any e2e relies on it. A probe I ran on 2026-10-16 (Chromium 156, Playwright 1.64) found that `page.emulateMedia({ displayMode: "standalone" })` is accepted but changes nothing, the CDP feature `Emulation.setEmulatedMedia({ features: [{ name: "display-mode", value: "standalone" }] })` changes nothing, and an init script that defines `navigator.standalone` works. Re-run it to confirm on the installed version. Create `web/e2e/probe.spec.ts` (deleted in Step 3, never committed):

```ts
import { expect, test } from "@playwright/test"

test("probe: which installed-mode path works", async ({ page }) => {
	await page.goto("/")
	const query = () => page.evaluate(() => matchMedia("(display-mode: standalone)").matches)
	await page.emulateMedia({ displayMode: "standalone" } as never)
	const viaEmulateMedia = await query()
	const cdp = await page.context().newCDPSession(page)
	await cdp.send("Emulation.setEmulatedMedia", {
		features: [{ name: "display-mode", value: "standalone" }],
	})
	const viaCdp = await query()
	await page.addInitScript(() => {
		Object.defineProperty(Navigator.prototype, "standalone", { get: () => true, configurable: true })
	})
	await page.reload()
	const viaInitScript = await page.evaluate(
		() => (navigator as Navigator & { standalone?: boolean }).standalone
	)
	console.log({ viaEmulateMedia, viaCdp, viaInitScript })
	expect(viaInitScript).toBe(true)
})
```

Run: `npm run build:site && npx playwright test e2e/probe.spec.ts`
Expected: PASS, and the log shows `{ viaEmulateMedia: false, viaCdp: false, viaInitScript: true }`.

If either media path prints `true`, the installed Playwright can emulate the media query. Keep the init script anyway (it is the only way to exercise the iPhone path the spec requires) and write the finding into the `forceInstalled` comment in Step 6.

- [ ] **Step 2: Write the failing unit test**

`web/tests/standalone.test.ts`:

```ts
import { expect, test } from "vitest"
import { isIosStandalone, markStandalone } from "../src/services/standalone.ts"

const nav = (standalone: unknown) => ({ standalone }) as unknown as Navigator

test("navigator.standalone true marks <html> as installed", () => {
	const root = document.createElement("html")
	markStandalone(root, nav(true))
	expect(root.hasAttribute("data-standalone")).toBe(true)
})

test("anything but true leaves <html> alone", () => {
	for (const value of [false, undefined, "true", 1]) {
		const root = document.createElement("html")
		markStandalone(root, nav(value))
		expect(root.hasAttribute("data-standalone"), String(value)).toBe(false)
		expect(isIosStandalone(nav(value))).toBe(false)
	}
})
```

- [ ] **Step 3: Run it to see it fail, and delete the probe**

Run: `npx vitest run tests/standalone.test.ts`
Expected: FAIL, `Failed to resolve import "../src/services/standalone.ts"`.

```bash
rm e2e/probe.spec.ts
```

- [ ] **Step 4: Write the service**

`web/src/services/standalone.ts`:

```ts
// Installed mode (spec: Layout, Installed mode). Android and desktop installs match
// (display-mode: standalone) in CSS; an iPhone app added to the home screen does not, and reports
// navigator.standalone instead. main.tsx marks <html> from it before it hydrates, so the CSS can
// switch the history controls on from either signal. Nothing else reads it.
export function isIosStandalone(nav: Navigator): boolean {
	return (nav as Navigator & { standalone?: unknown }).standalone === true
}

export function markStandalone(root: HTMLElement, nav: Navigator): void {
	if (isIosStandalone(nav)) root.dataset.standalone = ""
}
```

- [ ] **Step 5: Call it from `main.tsx`**

In `web/src/main.tsx`, add the import beside the others and call it right after the `#root` check, before `const app = (`:

```ts
import { markStandalone } from "./services/standalone.ts"
```

```ts
// Before hydrating, so the first frame the app owns already shows the history controls on an
// iPhone. <html> is outside React's tree, so this cannot cause a hydration mismatch.
markStandalone(document.documentElement, navigator)
```

Run: `npx vitest run tests/standalone.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Add `forceInstalled` and its e2e proof**

Append to `web/e2e/helpers.ts`:

```ts
// Installed mode for e2e. Playwright's Chromium cannot emulate (display-mode: standalone):
// emulateMedia has no display mode and the CDP media feature is ignored (probed 2026-10-16,
// Chromium 156, Playwright 1.64). So the tests take the iPhone path: navigator.standalone, which
// main.tsx turns into data-standalone on <html>. Call it before page.goto.
export async function forceInstalled(page: Page): Promise<void> {
	await page.addInitScript(() => {
		Object.defineProperty(Navigator.prototype, "standalone", { get: () => true, configurable: true })
	})
}
```

`web/e2e/installed.spec.ts`:

```ts
import { expect, test } from "@playwright/test"
import { forceInstalled } from "./helpers.ts"

// Every installed-mode e2e relies on forceInstalled (spec: Testing, end to end). This proves it
// before anything else leans on it.
const paths = ["/", "/en/", "/sok", "/resources/1", "/om"]

for (const path of paths) {
	test(`${path} in a browser tab is not marked installed`, async ({ page }) => {
		await page.goto(path)
		await expect(page.locator("html")).not.toHaveAttribute("data-standalone")
	})

	test(`${path} under forceInstalled is marked installed`, async ({ page }) => {
		await forceInstalled(page)
		await page.goto(path)
		await expect(page.locator("html")).toHaveAttribute("data-standalone", "")
	})
}
```

- [ ] **Step 7: Run the suites**

Run: `npx biome ci . && npm run typecheck && npm test && npm run build:site && npx playwright test e2e/installed.spec.ts`
Expected: all green; 10 installed.spec tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/services/standalone.ts src/main.tsx tests/standalone.test.ts e2e/helpers.ts e2e/installed.spec.ts
git commit -m "feat: mark the installed iPhone app and force installed mode in e2e"
```

---

### Task 2: The web manifest

**Files:**
- Create: `web/public/manifest.webmanifest`
- Create: `web/tests/manifest.test.ts`
- Modify: `web/index.html` (the viewport meta on line 5; new lines after the `apple-touch-icon` link)

**Interfaces:**
- Consumes: the four icons already in `web/public/` (`icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png`) and the `--ground` values in `web/src/styles/tokens.css` (light `#f6f2ea`, dark `#0b0d10`).
- Produces: `/manifest.webmanifest`, linked from every prerendered page (the prerender fills `index.html` as its template).

- [ ] **Step 1: Write the failing test**

`web/tests/manifest.test.ts`:

```ts
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test } from "vitest"

const here = dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(join(here, rel), "utf8")

type Icon = { src: string; sizes: string; type: string; purpose: string }

// The light and dark --ground tokens, in the order tokens.css declares them.
function grounds(): [string, string] {
	const found = [...read("../src/styles/tokens.css").matchAll(/--ground:\s*(#[0-9a-f]{6});/gi)]
	expect(found).toHaveLength(2)
	const [light, dark] = found
	return [light?.[1] ?? "", dark?.[1] ?? ""]
}

test("the manifest is valid JSON that opens Varde standalone at the root", () => {
	const manifest = JSON.parse(read("../public/manifest.webmanifest"))
	expect(manifest).toMatchObject({
		name: "Varde",
		short_name: "Varde",
		lang: "nb",
		start_url: "/",
		scope: "/",
		display: "standalone",
	})
})

test("every icon it names exists, two are any and two are maskable", () => {
	const { icons } = JSON.parse(read("../public/manifest.webmanifest")) as { icons: Icon[] }
	for (const icon of icons) {
		expect(existsSync(join(here, "../public", icon.src.slice(1))), icon.src).toBe(true)
	}
	expect(icons.filter((icon) => icon.purpose === "any")).toHaveLength(2)
	expect(icons.filter((icon) => icon.purpose === "maskable")).toHaveLength(2)
})

test("its colours are the light ground token", () => {
	const manifest = JSON.parse(read("../public/manifest.webmanifest"))
	const [light] = grounds()
	expect(manifest.background_color).toBe(light)
	expect(manifest.theme_color).toBe(light)
})

test("index.html links the manifest, reports the safe area and colours each scheme", () => {
	const html = read("../index.html")
	const [light, dark] = grounds()
	expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest" />')
	expect(html).toContain(
		'<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />'
	)
	expect(html).toContain(
		`<meta name="theme-color" content="${light}" media="(prefers-color-scheme: light)" />`
	)
	expect(html).toContain(
		`<meta name="theme-color" content="${dark}" media="(prefers-color-scheme: dark)" />`
	)
	// Search Console verifies the site by this tag on this line. It must never move.
	expect(html.split("\n")[6]).toContain('name="google-site-verification"')
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/manifest.test.ts`
Expected: FAIL, `ENOENT ... manifest.webmanifest` in the first three tests and a missing `<link rel="manifest"` in the fourth.

- [ ] **Step 3: Write the manifest**

`web/public/manifest.webmanifest`:

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

If Biome does not format `.webmanifest` files, keep this layout by hand.

- [ ] **Step 4: Link it from `index.html`**

Line 5 becomes:

```html
		<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

Lines 6 and 7 (referrer and Search Console) stay exactly where they are. After the `apple-touch-icon` link, add:

```html
		<!-- The installed app (spec: The manifest). No service worker: an offline copy would fight
		     "always current". default-src 'self' in the CSP already covers manifest-src. -->
		<link rel="manifest" href="/manifest.webmanifest" />
		<meta name="theme-color" content="#f6f2ea" media="(prefers-color-scheme: light)" />
		<meta name="theme-color" content="#0b0d10" media="(prefers-color-scheme: dark)" />
```

The inline script is untouched, so the CSP hash in `public/_headers` and `tests/headers.test.ts` stays valid.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/manifest.test.ts tests/headers.test.ts tests/prerender.test.ts`
Expected: PASS.

- [ ] **Step 6: Run the suites and commit**

Run: `npx biome ci . && npm run typecheck && npm test`
Expected: green.

```bash
git add public/manifest.webmanifest index.html tests/manifest.test.ts
git commit -m "feat: web manifest so Varde can be installed"
```

---

### Task 3: History entry state and the fallback counter

**Files:**
- Create: `web/src/services/historyEntry.ts`
- Create: `web/src/services/historyCounter.ts`
- Create: `web/tests/historyEntry.test.ts`
- Create: `web/tests/historyCounter.test.ts`

**Interfaces:**
- Produces, in `services/historyEntry.ts`:
  - `type EntryState = { from?: "sok"; idx?: number; scrollY?: number; href?: string }`
  - `type EntryPatch = { [K in keyof EntryState]?: EntryState[K] | undefined }`
  - `readEntry(state: unknown): EntryState`
  - `mergeEntry(state: unknown, patch: EntryPatch): EntryState`
- Produces, in `services/historyCounter.ts`:
  - `type HistoryStatus = { canGoBack: boolean; canGoForward: boolean }`
  - `type NavigationLike = { canGoBack: boolean; canGoForward: boolean; addEventListener(type: "currententrychange", listener: () => void): void; removeEventListener(type: "currententrychange", listener: () => void): void }`
  - `type HistoryCounter = { push(): number; arrive(idx: number): void; status(): HistoryStatus }`
  - `createHistoryCounter(): HistoryCounter`
  - `navigationOf(win: Window): NavigationLike | undefined`
  - `readHistoryStatus(nav: NavigationLike | undefined, counter: HistoryCounter): HistoryStatus`

- [ ] **Step 1: Write the failing entry tests**

`web/tests/historyEntry.test.ts`:

```ts
import { expect, test } from "vitest"
import { mergeEntry, readEntry } from "../src/services/historyEntry.ts"

test("an empty or foreign state reads as an empty entry", () => {
	for (const state of [null, undefined, "x", 3, []]) expect(readEntry(state)).toEqual({})
})

test("only the router's fields, with the right types, are read", () => {
	expect(
		readEntry({ from: "sok", idx: 2, scrollY: 480.5, href: "/resources/12", other: true })
	).toEqual({ from: "sok", idx: 2, scrollY: 480.5, href: "/resources/12" })
	expect(readEntry({ from: "list", idx: -1, scrollY: Number.NaN, href: 12 })).toEqual({})
	expect(readEntry({ idx: 1.5 })).toEqual({})
})

test("saving the focus values keeps from and idx", () => {
	expect(mergeEntry({ from: "sok", idx: 3 }, { scrollY: 640, href: "/resources/9" })).toEqual({
		from: "sok",
		idx: 3,
		scrollY: 640,
		href: "/resources/9",
	})
})

test("an entry from the Varde deployed before this one keeps from when it gains idx", () => {
	expect(mergeEntry({ from: "sok" }, { idx: 0 })).toEqual({ from: "sok", idx: 0 })
})

test("a field patched to undefined is removed", () => {
	expect(mergeEntry({ idx: 1, href: "/old" }, { scrollY: 0, href: undefined })).toEqual({
		idx: 1,
		scrollY: 0,
	})
})

test("a saved href keeps quotes and brackets exactly", () => {
	const href = '/sok?search=a"b]c'
	expect(readEntry(mergeEntry(null, { href })).href).toBe(href)
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/historyEntry.test.ts`
Expected: FAIL, cannot resolve `../src/services/historyEntry.ts`.

- [ ] **Step 3: Write `historyEntry.ts`**

```ts
// What the router keeps on each history entry (spec: Behaviour). `from` marks an entry left from
// /sok (the detail page's "Tilbake til resultater" reads it), `idx` counts entries for browsers
// without the Navigation API, and `scrollY` and `href` record where you were and which link you
// followed when you left the entry with a push.
export type EntryState = { from?: "sok"; idx?: number; scrollY?: number; href?: string }

export type EntryPatch = { [K in keyof EntryState]?: EntryState[K] | undefined }

// history.state can hold anything: an older Varde wrote { from: "sok" } alone, and a fragment
// link leaves null. Only fields of the right type are read; anything else is dropped.
export function readEntry(state: unknown): EntryState {
	if (typeof state !== "object" || state === null || Array.isArray(state)) return {}
	const fields = state as Record<string, unknown>
	const entry: EntryState = {}
	if (fields.from === "sok") entry.from = "sok"
	if (typeof fields.idx === "number" && Number.isInteger(fields.idx) && fields.idx >= 0) {
		entry.idx = fields.idx
	}
	if (typeof fields.scrollY === "number" && Number.isFinite(fields.scrollY)) {
		entry.scrollY = fields.scrollY
	}
	if (typeof fields.href === "string") entry.href = fields.href
	return entry
}

// Every replaceState the router makes keeps the fields already on the entry and changes only its
// own. A field patched to undefined is removed, so a navigation without a link clears an href
// saved by an earlier one.
export function mergeEntry(state: unknown, patch: EntryPatch): EntryState {
	const merged: EntryPatch = { ...readEntry(state), ...patch }
	for (const key of Object.keys(merged) as (keyof EntryState)[]) {
		if (merged[key] === undefined) delete merged[key]
	}
	return merged as EntryState
}
```

Run: `npx vitest run tests/historyEntry.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 4: Write the failing counter tests**

`web/tests/historyCounter.test.ts`:

```ts
import { expect, test } from "vitest"
import {
	createHistoryCounter,
	type NavigationLike,
	navigationOf,
	readHistoryStatus,
} from "../src/services/historyCounter.ts"

test("a first load has nothing behind and nothing ahead", () => {
	expect(createHistoryCounter().status()).toEqual({ canGoBack: false, canGoForward: false })
})

test("a push writes the next idx; Back and Forward follow idx and the highest idx", () => {
	const counter = createHistoryCounter()
	expect(counter.push()).toBe(1)
	expect(counter.push()).toBe(2)
	expect(counter.status()).toEqual({ canGoBack: true, canGoForward: false })
	counter.arrive(1)
	expect(counter.status()).toEqual({ canGoBack: true, canGoForward: true })
	counter.arrive(0)
	expect(counter.status()).toEqual({ canGoBack: false, canGoForward: true })
})

test("after a reload the highest is unknown, so Forward is disabled", () => {
	const counter = createHistoryCounter()
	counter.arrive(3)
	expect(counter.status()).toEqual({ canGoBack: true, canGoForward: false })
})

test("Back followed by a new push drops what was ahead", () => {
	const counter = createHistoryCounter()
	counter.push()
	counter.push()
	counter.arrive(1)
	expect(counter.push()).toBe(2)
	expect(counter.status()).toEqual({ canGoBack: true, canGoForward: false })
})

test("the Navigation API wins over the counter where it exists", () => {
	const counter = createHistoryCounter()
	const nav = { canGoBack: true, canGoForward: true } as NavigationLike
	expect(readHistoryStatus(nav, counter)).toEqual({ canGoBack: true, canGoForward: true })
	expect(readHistoryStatus(undefined, counter)).toEqual({ canGoBack: false, canGoForward: false })
})

test("navigationOf reads window.navigation and tolerates its absence", () => {
	expect(navigationOf({} as Window)).toBeUndefined()
	const nav = { canGoBack: false } as NavigationLike
	expect(navigationOf({ navigation: nav } as unknown as Window)).toBe(nav)
})
```

- [ ] **Step 5: Run it to see it fail**

Run: `npx vitest run tests/historyCounter.test.ts`
Expected: FAIL, cannot resolve `../src/services/historyCounter.ts`.

- [ ] **Step 6: Write `historyCounter.ts`**

```ts
export type HistoryStatus = { canGoBack: boolean; canGoForward: boolean }

// The slice of the Navigation API (Baseline 2026) the buttons read. Typed here, so nothing
// depends on whether the installed TypeScript lib knows the API yet.
export type NavigationLike = {
	canGoBack: boolean
	canGoForward: boolean
	addEventListener(type: "currententrychange", listener: () => void): void
	removeEventListener(type: "currententrychange", listener: () => void): void
}

export function navigationOf(win: Window): NavigationLike | undefined {
	return (win as Window & { navigation?: NavigationLike }).navigation
}

// Without the Navigation API the router counts entries itself (spec: Knowing what is behind and
// ahead). `idx` is where you are and `highest` the furthest entry Forward can reach. A push drops
// every entry ahead, so the new entry becomes the highest. After a reload the highest is not
// known, so it starts at the current entry and Forward stays off: the safe direction.
export type HistoryCounter = {
	push(): number
	arrive(idx: number): void
	status(): HistoryStatus
}

export function createHistoryCounter(): HistoryCounter {
	let idx = 0
	let highest = 0
	return {
		push() {
			idx += 1
			highest = idx
			return idx
		},
		arrive(at) {
			idx = at
			highest = Math.max(highest, at)
		},
		status: () => ({ canGoBack: idx > 0, canGoForward: idx < highest }),
	}
}

export function readHistoryStatus(
	nav: NavigationLike | undefined,
	counter: HistoryCounter
): HistoryStatus {
	return nav ? { canGoBack: nav.canGoBack, canGoForward: nav.canGoForward } : counter.status()
}
```

- [ ] **Step 7: Run the suites and commit**

Run: `npx vitest run tests/historyCounter.test.ts tests/historyEntry.test.ts && npx biome ci . && npm run typecheck`
Expected: PASS (12 tests), Biome and tsc clean.

```bash
git add src/services/historyEntry.ts src/services/historyCounter.ts tests/historyEntry.test.ts tests/historyCounter.test.ts
git commit -m "feat: history entry state and a fallback entry counter"
```

---

### Task 4: The router counts, saves and tells

**Files:**
- Modify: `web/src/navigation.ts`
- Modify: `web/src/hooks/useUrlState.ts` (whole file)
- Modify: `web/src/components/Link.tsx` (the `navigate(...)` call in `onClick`)
- Modify: `web/tests/useUrlState.test.tsx`
- Modify: `web/tests/link.test.tsx:22`

**Interfaces:**
- Consumes: `readEntry`, `mergeEntry` (Task 3); `createHistoryCounter`, `HistoryCounter` (Task 3).
- Produces, in `navigation.ts`:
  - `NavigateOptions = { replace?: boolean; lang?: Lang; href?: string }`
  - `type ArrivalVia = "push" | "traverse"`
  - `ArrivalContext: Context<{ via: ArrivalVia; restore: number }>` and `useArrival()`
  - `type HistoryEvents = { subscribe(listener: () => void): () => void; counter: HistoryCounter }`
  - `HistoryEventsContext: Context<HistoryEvents>` and `useHistoryEvents()`
- Produces, from `useUrlState()`: `{ lang, route, filters, arrival, via, restore, navigate, historyEvents }`. `via` is how the last change came (`"push"` for `navigate`, `"traverse"` for popstate). `restore` counts traversals that stayed on the same route. `historyEvents.subscribe` hears every push and traversal.

- [ ] **Step 1: Extend `navigation.ts`**

Replace the `NavigateOptions` line and add the two contexts after `useNavigate`:

```ts
import { createContext, useContext } from "react"
import { createHistoryCounter, type HistoryCounter } from "./services/historyCounter.ts"
import type { Lang } from "./services/urlState.ts"

// href: the link that was followed, saved on the entry being left so Back can focus it again
// (spec: Focus and scroll). Only Link passes it.
export type NavigateOptions = { replace?: boolean; lang?: Lang; href?: string }
```

```ts
// How the current page was reached, for useArrivalFocus. "traverse" is Back or Forward (the
// buttons or the browser's own); "push" is everything else. `restore` counts traversals that
// stayed on the same route, such as Back undoing a filter change on /sok.
export type ArrivalVia = "push" | "traverse"

export const ArrivalContext = createContext<{ via: ArrivalVia; restore: number }>({
	via: "push",
	restore: 0,
})

export function useArrival() {
	return useContext(ArrivalContext)
}

// pushState fires no event, so the router tells subscribers after each push and traversal and
// the history buttons never poll. `counter` is the fallback for browsers without the Navigation
// API.
export type HistoryEvents = {
	subscribe(listener: () => void): () => void
	counter: HistoryCounter
}

export const HistoryEventsContext = createContext<HistoryEvents>({
	subscribe: () => () => {},
	counter: createHistoryCounter(),
})

export function useHistoryEvents() {
	return useContext(HistoryEventsContext)
}
```

- [ ] **Step 2: Write the failing router tests**

In `web/tests/useUrlState.test.tsx`, change the imports to:

```ts
import { act, renderHook } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { useUrlState } from "../src/hooks/useUrlState.ts"

// jsdom's scrollY is a plain writable property; tests set it and this puts it back.
const setScrollY = (y: number) =>
	Object.defineProperty(window, "scrollY", { value: y, configurable: true, writable: true })

afterEach(() => {
	vi.restoreAllMocks()
	setScrollY(0)
})

const popTo = (state: unknown, url: string) =>
	act(() => {
		window.history.replaceState(state, "", url)
		window.dispatchEvent(new PopStateEvent("popstate", { state }))
	})
```

In the existing test "arrival increments on route changes only, and leaving /sok records from=sok", replace the two state assertions:

```ts
	expect(window.history.state).toMatchObject({ from: "sok", idx: 2 })
```

```ts
	expect(window.history.state).not.toHaveProperty("from")
```

(The filter change in that test is a push too, so the detail entry is `idx` 2.)

Append:

```ts
test("the router restores scroll itself, and a load without router state becomes entry 0", () => {
	window.history.replaceState({ from: "sok" }, "", "/resources/12")
	renderHook(() => useUrlState())
	expect(window.history.scrollRestoration).toBe("manual")
	expect(window.history.state).toEqual({ from: "sok", idx: 0 })
})

test("a push saves scrollY and the followed href on the entry it leaves, then writes idx", () => {
	window.history.replaceState(null, "", "/sok")
	const { result } = renderHook(() => useUrlState())
	setScrollY(640)
	const replace = vi.spyOn(window.history, "replaceState")
	act(() => result.current.navigate("/resources/12", "", { href: "/resources/12" }))
	expect(replace).toHaveBeenCalledWith({ idx: 0, scrollY: 640, href: "/resources/12" }, "")
	expect(window.history.state).toEqual({ from: "sok", idx: 1 })
})

test("a navigation without a link saves no href and clears one saved earlier", () => {
	window.history.replaceState({ idx: 0, href: "/old" }, "", "/resources/12")
	const { result } = renderHook(() => useUrlState())
	const replace = vi.spyOn(window.history, "replaceState")
	act(() => result.current.navigate("/", ""))
	expect(replace).toHaveBeenCalledWith({ idx: 0, scrollY: 0 }, "")
})

test("saving the focus values keeps from: sok and idx", () => {
	window.history.replaceState({ from: "sok", idx: 4 }, "", "/resources/12")
	const { result } = renderHook(() => useUrlState())
	const replace = vi.spyOn(window.history, "replaceState")
	act(() => result.current.navigate("/", ""))
	expect(replace).toHaveBeenCalledWith({ from: "sok", idx: 4, scrollY: 0 }, "")
})

test("a replace navigation keeps idx and the saved values", () => {
	window.history.replaceState({ idx: 2, scrollY: 300, href: "/resources/9" }, "", "/sok?search=a")
	const { result } = renderHook(() => useUrlState())
	act(() => result.current.navigate("/sok", "?search=ab", { replace: true }))
	expect(window.history.state).toEqual({ idx: 2, scrollY: 300, href: "/resources/9" })
})

test("subscribers hear every push and every traversal", () => {
	window.history.replaceState(null, "", "/sok")
	const { result } = renderHook(() => useUrlState())
	const listener = vi.fn()
	const unsubscribe = result.current.historyEvents.subscribe(listener)
	act(() => result.current.navigate("/resources/12", ""))
	expect(listener).toHaveBeenCalledTimes(1)
	popTo({ idx: 0 }, "/sok")
	expect(listener).toHaveBeenCalledTimes(2)
	unsubscribe()
	act(() => result.current.navigate("/om", ""))
	expect(listener).toHaveBeenCalledTimes(2)
})

test("a traversal to another route is an arrival via traverse; on the same route it is a restore", () => {
	window.history.replaceState(null, "", "/sok")
	const { result } = renderHook(() => useUrlState())
	act(() => result.current.navigate("/sok", "?category=rus"))
	act(() => result.current.navigate("/resources/12", ""))
	expect(result.current).toMatchObject({ arrival: 1, via: "push", restore: 0 })
	popTo({ idx: 1 }, "/sok?category=rus")
	expect(result.current).toMatchObject({ arrival: 2, via: "traverse", restore: 0 })
	popTo({ idx: 0 }, "/sok")
	expect(result.current).toMatchObject({ arrival: 2, via: "traverse", restore: 1 })
})

test("without the Navigation API the counter follows pushes and traversals", () => {
	window.history.replaceState(null, "", "/")
	const { result } = renderHook(() => useUrlState())
	const status = () => result.current.historyEvents.counter.status()
	expect(status()).toEqual({ canGoBack: false, canGoForward: false })
	act(() => result.current.navigate("/om", ""))
	expect(status()).toEqual({ canGoBack: true, canGoForward: false })
	popTo({ idx: 0 }, "/")
	expect(status()).toEqual({ canGoBack: false, canGoForward: true })
	act(() => result.current.navigate("/sok", ""))
	expect(status()).toEqual({ canGoBack: true, canGoForward: false })
})

test("an entry with no state reached by popstate or hashchange (a fragment link) gets the next idx", () => {
	window.history.replaceState(null, "", "/om")
	const { result } = renderHook(() => useUrlState())
	popTo(null, "/om#meld-feil")
	expect(window.history.state).toEqual({ idx: 1 })
	act(() => {
		window.history.replaceState(null, "", "/om#main")
		window.dispatchEvent(new HashChangeEvent("hashchange"))
	})
	expect(window.history.state).toEqual({ idx: 2 })
	expect(result.current.historyEvents.counter.status()).toEqual({
		canGoBack: true,
		canGoForward: false,
	})
})
```

In `web/tests/link.test.tsx`, line 22 becomes:

```ts
	expect(onNavigate).toHaveBeenCalledWith("/resources/1", "", { lang: "nb", href: "/resources/1" })
```

- [ ] **Step 3: Run them to see them fail**

Run: `npx vitest run tests/useUrlState.test.tsx tests/link.test.tsx`
Expected: FAIL. The new tests fail on `scrollRestoration`, missing `idx`, `historyEvents` being undefined; the link test fails on the missing `href`.

- [ ] **Step 4: Rewrite `useUrlState.ts`**

```ts
import { useCallback, useEffect, useState } from "react"
import {
	type ArrivalVia,
	type HistoryEvents,
	type NavigateOptions,
	useCurrentUrl,
} from "../navigation.ts"
import { createHistoryCounter } from "../services/historyCounter.ts"
import { mergeEntry, readEntry } from "../services/historyEntry.ts"
import {
	type Filters,
	type Lang,
	parseFilters,
	parseUrl,
	pathFor,
	type Route,
} from "../services/urlState.ts"

type UrlState = {
	lang: Lang
	route: Route
	filters: Filters
	arrival: number
	via: ArrivalVia
	restore: number
}

function sameRoute(a: Route, b: Route): boolean {
	if (a.kind !== b.kind) return false
	if (a.kind === "detail" && b.kind === "detail") return a.id === b.id
	if (a.kind === "kommune" && b.kind === "kommune") return a.slug === b.slug
	return true
}

function read(pathname: string, search: string): Omit<UrlState, "arrival" | "via" | "restore"> {
	return { ...parseUrl(pathname), filters: parseFilters(new URLSearchParams(search)) }
}

export function useUrlState() {
	const initialUrl = useCurrentUrl()
	const [state, setState] = useState<UrlState>(() => ({
		...read(initialUrl.pathname, initialUrl.search),
		arrival: 0,
		via: "push",
		restore: 0,
	}))

	// One per app. The history buttons subscribe here, because pushState fires no event.
	const [historyEvents] = useState(() => {
		const listeners = new Set<() => void>()
		const events: HistoryEvents & { notify(): void } = {
			counter: createHistoryCounter(),
			subscribe(listener) {
				listeners.add(listener)
				return () => {
					listeners.delete(listener)
				}
			},
			notify() {
				for (const listener of listeners) listener()
			},
		}
		return events
	})

	// `arrival` counts route changes (not filter changes on the same route). Pages use it to
	// move focus to their heading; the first load stays 0 so the browser's own focus is kept.
	// `via` says whether the change was a push or Back/Forward, and `restore` counts Back/Forward
	// that stayed on the same route (spec: Focus and scroll).
	const sync = useCallback((via: ArrivalVia) => {
		setState((prev) => {
			const next = read(window.location.pathname, window.location.search)
			const same = sameRoute(prev.route, next.route)
			return {
				...next,
				via,
				arrival: same ? prev.arrival : prev.arrival + 1,
				restore: same && via === "traverse" ? prev.restore + 1 : prev.restore,
			}
		})
	}, [])

	useEffect(() => {
		// useArrivalFocus restores the scroll when the page is ready; the browser's own restore
		// would land earlier, on a page that is still loading.
		window.history.scrollRestoration = "manual"
		const { counter } = historyEvents
		// A page load without router state counts as the first entry (spec: Knowing what is behind
		// and ahead). The merge keeps a `from` an older Varde wrote.
		const loaded = readEntry(window.history.state)
		if (loaded.idx === undefined) {
			window.history.replaceState(mergeEntry(window.history.state, { idx: 0 }), "")
		}
		counter.arrive(loaded.idx ?? 0)

		// A fragment link (the skip link, /om#meld-feil) makes a new entry with no state. It gets
		// the next idx, as a push would; an entry the router wrote is simply arrived at.
		const adopt = () => {
			const { idx } = readEntry(window.history.state)
			if (idx === undefined) {
				window.history.replaceState(mergeEntry(window.history.state, { idx: counter.push() }), "")
			} else counter.arrive(idx)
		}
		const onPopState = () => {
			adopt()
			sync("traverse")
			historyEvents.notify()
		}
		const onHashChange = () => {
			adopt()
			historyEvents.notify()
		}
		window.addEventListener("popstate", onPopState)
		window.addEventListener("hashchange", onHashChange)
		return () => {
			window.removeEventListener("popstate", onPopState)
			window.removeEventListener("hashchange", onHashChange)
		}
	}, [sync, historyEvents])

	const navigate = useCallback(
		(path: string, search: string, options?: NavigateOptions) => {
			const { lang: current, route: currentRoute } = parseUrl(window.location.pathname)
			const target = `${pathFor(options?.lang ?? current, path)}${search}`
			// The detail page's "back to results" needs to know it came from /sok: the site sends
			// no referrer and pushState never sets one, so the fact travels in history state.
			const leavingResults = currentRoute.kind === "list" && path !== "/sok"
			const from = leavingResults ? "sok" : undefined
			if (options?.replace) {
				window.history.replaceState(mergeEntry(window.history.state, { from }), "", target)
			} else {
				// Where you were and the link you followed, saved on the entry you leave, so Back can
				// bring you to the same spot (spec: Focus and scroll).
				window.history.replaceState(
					mergeEntry(window.history.state, { scrollY: window.scrollY, href: options?.href }),
					""
				)
				window.history.pushState(
					mergeEntry(null, { from, idx: historyEvents.counter.push() }),
					"",
					target
				)
			}
			sync("push")
			historyEvents.notify()
		},
		[sync, historyEvents]
	)

	return { ...state, navigate, historyEvents }
}
```

- [ ] **Step 5: Pass the href from `Link`**

In `web/src/components/Link.tsx`, the last line of `onClick` becomes:

```ts
		navigate(url.pathname, url.search, { lang: target, href })
```

(`href` is the attribute value computed above, `pathFor(target, to)`, which is exactly what `getAttribute("href")` returns later.)

- [ ] **Step 6: Run the tests**

Run: `npx vitest run tests/useUrlState.test.tsx tests/link.test.tsx tests/detail.test.tsx tests/shell.test.tsx`
Expected: PASS. `detail.test.tsx` proves "Tilbake til resultater" still reads `from`.

- [ ] **Step 7: Run the suites and commit**

Run: `npx biome ci . && npm run typecheck && npm test`
Expected: green.

```bash
git add src/navigation.ts src/hooks/useUrlState.ts src/components/Link.tsx tests/useUrlState.test.tsx tests/link.test.tsx
git commit -m "feat: router counts entries, saves your spot and tells subscribers"
```

---

### Task 5: Back and Forward return you to your spot

**Files:**
- Create: `web/src/services/returnFocus.ts`
- Create: `web/tests/returnFocus.test.tsx`
- Modify: `web/src/hooks/useArrivalFocus.ts` (whole file)
- Modify: `web/src/App.tsx` (`App()`; providers)
- Modify: `web/tests/arrivalFocus.test.tsx` (append)
- Modify: `web/tests/setup.ts` (jsdom stub for `checkVisibility`)

**Interfaces:**
- Consumes: `readEntry` (Task 3); `ArrivalContext`, `useArrival`, `HistoryEventsContext` and `useUrlState()`'s `via`, `restore`, `historyEvents` (Task 4).
- Produces, in `services/returnFocus.ts`:
  - `notePress(button: HTMLButtonElement): void` (called by the history buttons in Task 6)
  - `takePressed(): HTMLButtonElement | null`
  - `findVisibleLink(href: string, root?: ParentNode): HTMLAnchorElement | null`
  - `returnToLink(state: unknown): boolean`
  - `restoreSameRoute(state: unknown, heading: HTMLElement | null, pressed: HTMLButtonElement | null): void`
- `useArrivalFocus` keeps its signature `(arrival, ready, settled = ready, token = settled)`.

- [ ] **Step 1: Stub `checkVisibility` for jsdom**

jsdom has no layout and no `checkVisibility`. In `web/tests/setup.ts`, after the `scrollIntoView` stub, add:

```ts
// jsdom has no checkVisibility. A [hidden] ancestor is the one invisibility the tests need: a
// link inside a closed menu must never take focus back (spec: Focus and scroll).
Element.prototype.checkVisibility ??= function (this: Element) {
	return this.closest("[hidden]") === null
}
```

- [ ] **Step 2: Write the failing service tests**

`web/tests/returnFocus.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import {
	findVisibleLink,
	notePress,
	restoreSameRoute,
	returnToLink,
	takePressed,
} from "../src/services/returnFocus.ts"

afterEach(() => {
	vi.restoreAllMocks()
	takePressed()
})

const scrollSpy = () => vi.spyOn(window, "scrollTo").mockImplementation(() => {})

test("a saved href with a quote and a bracket is matched without an error", () => {
	const href = '/sok?search=a"b]c'
	render(<a href={href}>Treff</a>)
	expect(findVisibleLink(href)).toBe(screen.getByRole("link", { name: "Treff" }))
})

test("a hidden link never matches; the first visible one with the same href does", () => {
	render(
		<>
			<div hidden>
				<a href="/resources/12">I menyen</a>
			</div>
			<a href="/resources/12">I listen</a>
		</>
	)
	expect(findVisibleLink("/resources/12")?.textContent).toBe("I listen")
	expect(findVisibleLink("/resources/99")).toBeNull()
})

test("returnToLink scrolls to the saved spot, then focuses the link without a second scroll", () => {
	const scrollTo = scrollSpy()
	render(<a href="/resources/12">NAV Hamar</a>)
	const link = screen.getByRole("link")
	const focus = vi.spyOn(link, "focus")
	expect(returnToLink({ idx: 0, scrollY: 480, href: "/resources/12" })).toBe(true)
	expect(scrollTo).toHaveBeenCalledWith({ top: 480, behavior: "instant" })
	expect(focus).toHaveBeenCalledWith({ preventScroll: true })
	expect(link).toHaveFocus()
})

test("returnToLink does nothing without a saved href or a visible match", () => {
	const scrollTo = scrollSpy()
	render(
		<div hidden>
			<a href="/resources/12">I menyen</a>
		</div>
	)
	expect(returnToLink({ idx: 0, scrollY: 480 })).toBe(false)
	expect(returnToLink({ idx: 0, scrollY: 480, href: "/resources/12" })).toBe(false)
	expect(scrollTo).not.toHaveBeenCalled()
})

test("a same-route restore scrolls to the saved spot and leaves focus where it is", () => {
	const scrollTo = scrollSpy()
	render(
		<>
			<h1 tabIndex={-1}>Treff</h1>
			<input aria-label="Søk" />
		</>
	)
	screen.getByRole("textbox").focus()
	restoreSameRoute({ idx: 1, scrollY: 900 }, screen.getByRole("heading"), null)
	expect(scrollTo).toHaveBeenCalledWith({ top: 900, behavior: "instant" })
	expect(screen.getByRole("textbox")).toHaveFocus()
})

test("a same-route restore without a saved spot does not scroll", () => {
	const scrollTo = scrollSpy()
	restoreSameRoute({ idx: 1 }, null, null)
	expect(scrollTo).not.toHaveBeenCalled()
})

test("focus on a history button that is now disabled moves to the heading without scrolling", () => {
	scrollSpy()
	render(
		<>
			<h1 tabIndex={-1}>Treff</h1>
			<button type="button">Tilbake</button>
		</>
	)
	const button = screen.getByRole("button") as HTMLButtonElement
	button.focus()
	notePress(button)
	button.disabled = true
	const heading = screen.getByRole("heading")
	const focus = vi.spyOn(heading, "focus")
	restoreSameRoute({ idx: 0 }, heading, takePressed())
	expect(focus).toHaveBeenCalledWith({ preventScroll: true })
})

test("Chromium has already moved focus to <body>: the heading still gets it", () => {
	scrollSpy()
	render(
		<>
			<h1 tabIndex={-1}>Treff</h1>
			<button type="button">Tilbake</button>
		</>
	)
	const button = screen.getByRole("button") as HTMLButtonElement
	notePress(button)
	button.disabled = true
	restoreSameRoute({ idx: 0 }, screen.getByRole("heading"), takePressed())
	expect(screen.getByRole("heading")).toHaveFocus()
})

test("a pressed button that is still enabled keeps its focus", () => {
	scrollSpy()
	render(
		<>
			<h1 tabIndex={-1}>Treff</h1>
			<button type="button">Fremover</button>
		</>
	)
	const button = screen.getByRole("button") as HTMLButtonElement
	button.focus()
	notePress(button)
	restoreSameRoute({ idx: 1 }, screen.getByRole("heading"), takePressed())
	expect(button).toHaveFocus()
})
```

- [ ] **Step 3: Run it to see it fail**

Run: `npx vitest run tests/returnFocus.test.tsx`
Expected: FAIL, cannot resolve `../src/services/returnFocus.ts`.

- [ ] **Step 4: Write `returnFocus.ts`**

```ts
import { readEntry } from "./historyEntry.ts"

// The history button pressed last. A same-route Back or Forward can disable the very button
// that has focus; Chromium then moves focus to <body> a moment later (probed 2026-10-16). Only
// in that case does focus move to the heading (spec: Focus and scroll).
let pressed: HTMLButtonElement | null = null

export function notePress(button: HTMLButtonElement): void {
	pressed = button
}

export function takePressed(): HTMLButtonElement | null {
	const button = pressed
	pressed = null
	return button
}

// Each link's href attribute is compared with the saved string. It is never built into a CSS
// selector, so a quote or bracket in a search URL cannot break the lookup. A link inside a
// closed Meny or picker is not visible and never matches.
export function findVisibleLink(href: string, root: ParentNode = document): HTMLAnchorElement | null {
	for (const link of root.querySelectorAll<HTMLAnchorElement>("a[href]")) {
		if (link.getAttribute("href") === href && link.checkVisibility()) return link
	}
	return null
}

// Back or Forward to another route. Scroll first, then focus without a second scroll. Returns
// false when there is no saved link or no visible match, and the caller falls back to the
// ordinary arrival: top of the page, focus on the heading.
export function returnToLink(state: unknown): boolean {
	const { href, scrollY } = readEntry(state)
	if (href === undefined) return false
	const link = findVisibleLink(href)
	if (!link) return false
	window.scrollTo({ top: scrollY ?? 0, behavior: "instant" })
	link.focus({ preventScroll: true })
	return true
}

// Back or Forward on the same route (a filter change on /sok). The scroll comes back; focus
// stays, unless it was on a history button that has just become disabled.
export function restoreSameRoute(
	state: unknown,
	heading: HTMLElement | null,
	pressedButton: HTMLButtonElement | null
): void {
	const { scrollY } = readEntry(state)
	if (scrollY !== undefined) window.scrollTo({ top: scrollY, behavior: "instant" })
	if (!pressedButton?.disabled || !heading) return
	const active = document.activeElement
	if (active === pressedButton || active === document.body || active === null) {
		heading.focus({ preventScroll: true })
	}
}
```

Run: `npx vitest run tests/returnFocus.test.tsx`
Expected: PASS (9 tests).

- [ ] **Step 5: Write the failing hook tests**

Append to `web/tests/arrivalFocus.test.tsx` (add `type ReactNode` to a `react` import and `ArrivalContext` from `../src/navigation.ts`):

```tsx
import type { ReactNode } from "react"
import { ArrivalContext } from "../src/navigation.ts"
```

```tsx
function ReturnProbe({
	arrival,
	ready,
	via = "traverse",
	restore = 0,
	token,
	children,
}: {
	arrival: number
	ready: boolean
	via?: "push" | "traverse"
	restore?: number
	token?: unknown
	children?: ReactNode
}) {
	return (
		<ArrivalContext.Provider value={{ via, restore }}>
			<ReturnPage arrival={arrival} ready={ready} token={token}>
				{children}
			</ReturnPage>
		</ArrivalContext.Provider>
	)
}

function ReturnPage({
	arrival,
	ready,
	token,
	children,
}: {
	arrival: number
	ready: boolean
	token?: unknown
	children?: ReactNode
}) {
	// No token given means the default (token === settled): a page with no content of its own
	// that changes on the same route.
	const { ref } = useArrivalFocus<HTMLHeadingElement>(arrival, ready, ready, token ?? ready)
	return (
		<>
			<h1 ref={ref} tabIndex={-1}>
				Treff
			</h1>
			{children}
		</>
	)
}

test("Back to another route scrolls to the saved spot and focuses the followed link", () => {
	const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {})
	window.history.replaceState({ idx: 0, scrollY: 480, href: "/resources/12" }, "", "/sok")
	render(
		<ReturnProbe arrival={1} ready={true}>
			<a href="/resources/12">NAV Hamar</a>
		</ReturnProbe>
	)
	expect(screen.getByRole("link", { name: "NAV Hamar" })).toHaveFocus()
	expect(scrollTo).toHaveBeenCalledWith({ top: 480, behavior: "instant" })
})

// The second press stays on the same route as the first lands on, so `arrival` does not move:
// the pending return must read the entry it ends on, not the one current when it was set.
test("the values are read when the page is ready, so two quick presses restore the last entry", () => {
	const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {})
	const links = (
		<>
			<a href="/resources/1">Første</a>
			<a href="/resources/2">Andre</a>
		</>
	)
	window.history.replaceState({ idx: 1, scrollY: 100, href: "/resources/1" }, "", "/sok")
	const { rerender } = render(
		<ReturnProbe arrival={2} ready={false}>
			{links}
		</ReturnProbe>
	)
	window.history.replaceState({ idx: 0, scrollY: 900, href: "/resources/2" }, "", "/sok")
	rerender(
		<ReturnProbe arrival={2} ready={true}>
			{links}
		</ReturnProbe>
	)
	expect(screen.getByRole("link", { name: "Andre" })).toHaveFocus()
	expect(scrollTo).toHaveBeenLastCalledWith({ top: 900, behavior: "instant" })
})

test("Back with no saved link, or a link inside a closed menu, arrives at the top and the heading", () => {
	const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {})
	window.history.replaceState({ idx: 0, scrollY: 480, href: "/resources/12" }, "", "/")
	render(
		<ReturnProbe arrival={1} ready={true}>
			<div hidden>
				<a href="/resources/12">I menyen</a>
			</div>
		</ReturnProbe>
	)
	expect(screen.getByRole("heading")).toHaveFocus()
	expect(scrollTo).toHaveBeenCalledWith({ top: 0 })
})

test("a new navigation (push) keeps today's arrival even when the entry has a saved link", () => {
	vi.spyOn(window, "scrollTo").mockImplementation(() => {})
	window.history.replaceState({ idx: 1, scrollY: 480, href: "/resources/12" }, "", "/sok")
	render(
		<ReturnProbe arrival={1} ready={true} via="push">
			<a href="/resources/12">NAV Hamar</a>
		</ReturnProbe>
	)
	expect(screen.getByRole("heading")).toHaveFocus()
})

test("a same-route restore on a page without its own token scrolls at once", () => {
	const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {})
	window.history.replaceState({ idx: 0, scrollY: 700 }, "", "/om")
	const { rerender } = render(<ReturnProbe arrival={0} ready={true} restore={0} />)
	expect(scrollTo).not.toHaveBeenCalled()
	rerender(<ReturnProbe arrival={0} ready={true} restore={1} />)
	expect(scrollTo).toHaveBeenCalledWith({ top: 700, behavior: "instant" })
	expect(screen.getByRole("heading")).not.toHaveFocus()
})

test("a same-route restore on a page with a token waits for that page's next answer", () => {
	const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {})
	window.history.replaceState({ idx: 0, scrollY: 700 }, "", "/sok")
	const first = { page: 1 }
	const { rerender } = render(<ReturnProbe arrival={0} ready={true} restore={0} token={first} />)
	rerender(<ReturnProbe arrival={0} ready={true} restore={1} token={first} />)
	expect(scrollTo).not.toHaveBeenCalled()
	rerender(<ReturnProbe arrival={0} ready={true} restore={1} token={{ page: 2 }} />)
	expect(scrollTo).toHaveBeenCalledWith({ top: 700, behavior: "instant" })
})

test("a page mounted after earlier restores does not replay them", () => {
	const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {})
	window.history.replaceState({ idx: 0, scrollY: 700 }, "", "/om")
	render(<ReturnProbe arrival={0} ready={true} restore={3} />)
	expect(scrollTo).not.toHaveBeenCalled()
})
```

- [ ] **Step 6: Run them to see them fail**

Run: `npx vitest run tests/arrivalFocus.test.tsx`
Expected: FAIL on the new tests (focus stays on the heading, no `behavior: "instant"` scroll, no restore).

- [ ] **Step 7: Rewrite `useArrivalFocus.ts`**

Keep the long header comment as it is and add one paragraph to its end:

```ts
//
// Back and Forward (spec: Focus and scroll). An arrival by a traversal is a "return": once the
// page is ready, the scroll goes back to the saved spot and focus lands on the link that was
// followed, read from history.state at that moment so two quick presses restore the last entry.
// No saved link, or no visible one, falls back to the ordinary arrival. A traversal that stays
// on the same route is a "restore": the scroll comes back and focus stays. A page whose `token`
// is its own (the results list) waits for its next answer before restoring; any other page
// restores at once.
```

The code below the comment becomes:

```ts
import { type RefObject, useEffect, useRef } from "react"
import { useArrival } from "../navigation.ts"
import { restoreSameRoute, returnToLink, takePressed } from "../services/returnFocus.ts"

export function useArrivalFocus<T extends HTMLElement>(
	arrival: number,
	ready: boolean,
	settled: boolean = ready,
	token: unknown = settled
): { ref: RefObject<T | null>; requestFocus: () => void } {
	const ref = useRef<T>(null)
	const { via, restore } = useArrival()
	const pending = useRef<"arrival" | "return" | "restore" | "request" | null>(null)
	// The restore count this page has already seen, so a page mounted later never replays one.
	const restoreSeen = useRef(restore)

	// biome-ignore lint/correctness/useExhaustiveDependencies: via is read at the arrival, not a trigger
	useEffect(() => {
		if (arrival > 0) pending.current = via === "traverse" ? "return" : "arrival"
	}, [arrival])

	// biome-ignore lint/correctness/useExhaustiveDependencies: restore is the trigger; token and settled are read
	useEffect(() => {
		if (restore === restoreSeen.current) return
		restoreSeen.current = restore
		if (pending.current === "arrival" || pending.current === "return") return
		if (token !== settled) pending.current = "restore"
		else restoreSameRoute(window.history.state, ref.current, takePressed())
	}, [restore])

	// arrival isn't read in the body, but a page that's ready from its very first render (the
	// landing placeholder, NotFoundState) never toggles `ready` — without arrival as a trigger
	// too, a later arrival on such a page would set `pending` and nothing would ever consume it.
	// biome-ignore lint/correctness/useExhaustiveDependencies: arrival and token are deliberate triggers
	useEffect(() => {
		if (!pending.current || !settled) return
		const reason = pending.current
		pending.current = null
		const pressed = takePressed()
		if (reason === "restore") {
			restoreSameRoute(window.history.state, ready ? ref.current : null, pressed)
			return
		}
		if (!ready || !ref.current) return
		if (reason === "return" && returnToLink(window.history.state)) return
		if (reason === "request") ref.current.scrollIntoView({ block: "start" })
		else window.scrollTo({ top: 0 })
		ref.current.focus({ preventScroll: true })
	}, [ready, settled, arrival, token])

	return {
		ref,
		requestFocus: () => {
			pending.current = "request"
		},
	}
}
```

The existing comment line "arrival isn't read in the body..." moves down with its effect, as shown; do not keep a second copy above.

- [ ] **Step 8: Provide the contexts in `App.tsx`**

Add `useMemo` to a `react` import, and `ArrivalContext`, `HistoryEventsContext` to the `./navigation.ts` import. `App()` becomes:

```tsx
export function App() {
	const { lang, route, filters, arrival, via, restore, navigate, historyEvents } = useUrlState()
	// A new object only when one of the two changes, so pages don't re-render for nothing.
	const arrivalContext = useMemo(() => ({ via, restore }), [via, restore])
	return (
		<LanguageProvider lang={lang}>
			<AnnouncerProvider>
				<NavigationContext.Provider value={navigate}>
					<HistoryEventsContext.Provider value={historyEvents}>
						<ArrivalContext.Provider value={arrivalContext}>
							<Shell route={route} filters={filters} arrival={arrival} />
						</ArrivalContext.Provider>
					</HistoryEventsContext.Provider>
				</NavigationContext.Provider>
			</AnnouncerProvider>
		</LanguageProvider>
	)
}
```

- [ ] **Step 9: Run the tests**

Run: `npx vitest run tests/arrivalFocus.test.tsx tests/returnFocus.test.tsx tests/list.test.tsx tests/race.test.tsx tests/hydration.test.tsx`
Expected: PASS. The pager tests in `list.test.tsx` prove `requestFocus` still scrolls the heading into view.

- [ ] **Step 10: Run the suites and commit**

Run: `npx biome ci . && npm run typecheck && npm test`
Expected: green.

```bash
git add src/services/returnFocus.ts src/hooks/useArrivalFocus.ts src/App.tsx tests/returnFocus.test.tsx tests/arrivalFocus.test.tsx tests/setup.ts
git commit -m "feat: Back and Forward return you to your spot and the link you followed"
```

---

### Task 6: The HistoryButtons component

**Files:**
- Create: `web/src/hooks/useHistoryButtons.ts`
- Create: `web/src/hooks/useEscapeHidesTips.ts`
- Create: `web/src/components/HistoryButtons.tsx`
- Create: `web/tests/historyButtons.test.tsx`
- Modify: `web/src/components/icons.tsx` (two icons at the end)
- Modify: `web/src/components/AcuteStrip.tsx` (use `useEscapeHidesTips`)
- Modify: `web/src/components/Header.tsx` (prop and first row item)
- Modify: `web/src/App.tsx` (`Shell`: Header prop, bar after the footer)
- Modify: `web/src/i18n/nb.json`, `web/src/i18n/en.json` (after `header.external`)
- Modify: `web/tests/axe.test.tsx:84` (hide the bar as CSS does at the tested width)
- Modify: `web/tests/shell.test.tsx` (append)
- Modify: `web/tests/headerMenu.test.tsx` (the "phone layout with the Meny open has no axe violations" test)

**Interfaces:**
- Consumes: `useNavigate`, `useHistoryEvents` (Task 4); `navigationOf`, `readHistoryStatus`, `HistoryStatus` (Task 3); `notePress` (Task 5).
- Produces: `HistoryButtons({ layout, atLanding }: { layout: "bar" | "icons"; atLanding: boolean })` rendering `<nav class="history-bar">` or `<nav class="history-icons">`, each with two `button.btn-secondary.history-btn`; the icons layout adds `span.history-tip` and `data-tips="hidden"` on the nav after Escape. `useHistoryButtons(atLanding: boolean): { backDisabled: boolean; forwardDisabled: boolean; back(): void; forward(): void }`. `useEscapeHidesTips(): { tipsHidden: boolean; showTips(): void }`. `Header({ atLanding }: { atLanding: boolean })`. The bar writes its height to `--history-bar-h` on `<html>`. CSS classes for Task 7: `.history-bar`, `.history-icons`, `.history-btn`, `.history-tip`.

- [ ] **Step 1: Add the strings**

`web/src/i18n/nb.json`, after `"header.external"`:

```json
	"history.label": "Sidehistorikk",
	"history.back": "Tilbake",
	"history.forward": "Fremover",
```

`web/src/i18n/en.json`, after `"header.external"`:

```json
	"history.label": "Page history",
	"history.back": "Back",
	"history.forward": "Forward",
```

- [ ] **Step 2: Write the failing component tests**

`web/tests/historyButtons.test.tsx`:

```tsx
import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { afterEach, expect, test, vi } from "vitest"
import { HistoryButtons } from "../src/components/HistoryButtons.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import { type HistoryEvents, HistoryEventsContext, NavigationContext } from "../src/navigation.ts"
import { createHistoryCounter } from "../src/services/historyCounter.ts"
import type { Lang } from "../src/services/urlState.ts"

afterEach(() => {
	vi.restoreAllMocks()
	Reflect.deleteProperty(window, "navigation")
	document.documentElement.style.removeProperty("--history-bar-h")
})

function fakeEvents() {
	const listeners = new Set<() => void>()
	const events: HistoryEvents = {
		counter: createHistoryCounter(),
		subscribe(listener) {
			listeners.add(listener)
			return () => listeners.delete(listener)
		},
	}
	const notify = () =>
		act(() => {
			for (const listener of listeners) listener()
		})
	return { events, notify }
}

// A Navigation API stand-in: an EventTarget with the two flags the buttons read.
function fakeNavigation(canGoBack: boolean, canGoForward: boolean) {
	const nav = Object.assign(new EventTarget(), { canGoBack, canGoForward })
	Object.defineProperty(window, "navigation", { value: nav, configurable: true })
	return nav
}

function renderButtons({
	layout = "bar" as "bar" | "icons",
	atLanding = false,
	lang = "nb" as Lang,
	navigate = vi.fn(),
	events = fakeEvents().events,
} = {}) {
	const view = render(
		<LanguageProvider lang={lang}>
			<NavigationContext.Provider value={navigate}>
				<HistoryEventsContext.Provider value={events}>
					<HistoryButtons layout={layout} atLanding={atLanding} />
				</HistoryEventsContext.Provider>
			</NavigationContext.Provider>
		</LanguageProvider>
	)
	const nav = within(screen.getByRole("navigation"))
	return {
		...view,
		navigate,
		back: () => nav.getByRole("button", { name: lang === "nb" ? "Tilbake" : "Back" }),
		forward: () => nav.getByRole("button", { name: lang === "nb" ? "Fremover" : "Forward" }),
	}
}

test("both buttons are disabled in the server render, so hydration matches", () => {
	const html = renderToString(
		<LanguageProvider lang="nb">
			<HistoryButtons layout="bar" atLanding={false} />
		</LanguageProvider>
	)
	expect(html.match(/<button[^>]*disabled=""/g)).toHaveLength(2)
})

test("names and the nav label in nb and en, arrows only", () => {
	for (const [lang, label, back, forward] of [
		["nb", "Sidehistorikk", "Tilbake", "Fremover"],
		["en", "Page history", "Back", "Forward"],
	] as const) {
		const { unmount } = renderButtons({ lang, layout: "icons" })
		const nav = screen.getByRole("navigation", { name: label })
		expect(within(nav).getByRole("button", { name: back })).toBeInTheDocument()
		expect(within(nav).getByRole("button", { name: forward })).toBeInTheDocument()
		for (const button of within(nav).getAllByRole("button")) {
			expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
			expect(button.querySelector(".visually-hidden")).not.toBeNull()
		}
		unmount()
	}
})

test("only the icons have tooltips, hidden from screen readers", () => {
	const { unmount } = renderButtons({ layout: "icons" })
	expect(document.querySelectorAll(".history-tip")).toHaveLength(2)
	for (const tip of document.querySelectorAll(".history-tip")) {
		expect(tip).toHaveAttribute("aria-hidden", "true")
	}
	unmount()
	renderButtons({ layout: "bar" })
	expect(document.querySelector(".history-tip")).toBeNull()
})

test("with the Navigation API, canGoBack and canGoForward drive disabled", () => {
	const nav = fakeNavigation(true, false)
	const { back, forward } = renderButtons()
	expect(back()).toBeEnabled()
	expect(forward()).toBeDisabled()
	nav.canGoForward = true
	act(() => {
		nav.dispatchEvent(new Event("currententrychange"))
	})
	expect(forward()).toBeEnabled()
	nav.canGoBack = false
	act(() => {
		window.dispatchEvent(new Event("pageshow"))
	})
	expect(forward()).toBeEnabled()
	expect(back()).toBeEnabled() // not the landing page: Back can still go home
})

test("without the API the router's counter drives disabled, refreshed on each notice", () => {
	const { events, notify } = fakeEvents()
	const { back, forward } = renderButtons({ atLanding: true, events })
	expect(back()).toBeDisabled()
	expect(forward()).toBeDisabled()
	events.counter.push()
	notify()
	expect(back()).toBeEnabled()
	events.counter.arrive(0)
	notify()
	expect(back()).toBeDisabled()
	expect(forward()).toBeEnabled()
})

test("Back with an entry behind calls history.back; Forward calls history.forward", () => {
	fakeNavigation(true, true)
	const historyBack = vi.spyOn(window.history, "back").mockImplementation(() => {})
	const historyForward = vi.spyOn(window.history, "forward").mockImplementation(() => {})
	const { back, forward, navigate } = renderButtons()
	fireEvent.click(back())
	fireEvent.click(forward())
	expect(historyBack).toHaveBeenCalledTimes(1)
	expect(historyForward).toHaveBeenCalledTimes(1)
	expect(navigate).not.toHaveBeenCalled()
})

test("Back on a first load goes home through the router; on the landing page it is disabled", () => {
	fakeNavigation(false, false)
	const historyBack = vi.spyOn(window.history, "back").mockImplementation(() => {})
	const first = renderButtons({ atLanding: false })
	fireEvent.click(first.back())
	expect(first.navigate).toHaveBeenCalledWith("/", "")
	expect(historyBack).not.toHaveBeenCalled()
	first.unmount()
	expect(renderButtons({ atLanding: true }).back()).toBeDisabled()
})

test("the bar writes its real height to --history-bar-h and removes it when it goes", () => {
	let report: () => void = () => {}
	vi.stubGlobal(
		"ResizeObserver",
		class {
			constructor(callback: () => void) {
				report = callback
			}
			observe() {}
			disconnect() {}
		}
	)
	const { unmount } = renderButtons({ layout: "bar" })
	const bar = document.querySelector(".history-bar") as HTMLElement
	vi.spyOn(bar, "getBoundingClientRect").mockReturnValue({ height: 122 } as DOMRect)
	act(() => report())
	expect(document.documentElement.style.getPropertyValue("--history-bar-h")).toBe("122px")
	unmount()
	vi.unstubAllGlobals()
	expect(document.documentElement.style.getPropertyValue("--history-bar-h")).toBe("")
})

test("Escape hides the icon tooltips until focus lands on a button again", () => {
	fakeNavigation(true, true)
	const { back } = renderButtons({ layout: "icons" })
	const nav = document.querySelector(".history-icons") as HTMLElement
	fireEvent.keyDown(document, { key: "Escape" })
	expect(nav).toHaveAttribute("data-tips", "hidden")
	fireEvent.focus(back())
	expect(nav).not.toHaveAttribute("data-tips")
})
```

Append to `web/tests/shell.test.tsx`:

```tsx
test("the history icons open the header row and the bar comes after the footer", () => {
	stubResources()
	render(<App />)
	const [icons, bar] = screen.getAllByRole("navigation", { name: "Sidehistorikk" })
	if (!icons || !bar) throw new Error("missing history nav")
	expect(icons).toHaveClass("history-icons")
	expect(icons.parentElement?.firstElementChild).toBe(icons)
	expect(bar).toHaveClass("history-bar")
	const footer = screen.getByRole("contentinfo")
	expect(footer.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})
```

- [ ] **Step 3: Run them to see them fail**

Run: `npx vitest run tests/historyButtons.test.tsx tests/shell.test.tsx`
Expected: FAIL, cannot resolve `../src/components/HistoryButtons.tsx`; the shell test finds no "Sidehistorikk" navigation.

- [ ] **Step 4: Add the icons**

Append to `web/src/components/icons.tsx`:

```tsx
// The history chevrons, the same paths Rookdex uses (spec: Layout).
export function BackIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<path d="M15 5l-7 7 7 7" />
		</Svg>
	)
}

export function ForwardIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<path d="M9 5l7 7-7 7" />
		</Svg>
	)
}
```

- [ ] **Step 5: Extract the tooltip Escape rule**

`web/src/hooks/useEscapeHidesTips.ts`:

```ts
import { useEffect, useState } from "react"

// Hover tooltips must be dismissable without moving the pointer (WCAG 1.4.13). Escape hides
// them until the pointer enters or focus lands on their control again. Shared by the acute
// strip and the history icons.
export function useEscapeHidesTips(): { tipsHidden: boolean; showTips: () => void } {
	const [tipsHidden, setTipsHidden] = useState(false)
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setTipsHidden(true)
		}
		document.addEventListener("keydown", onKeyDown)
		return () => document.removeEventListener("keydown", onKeyDown)
	}, [])
	return { tipsHidden, showTips: () => setTipsHidden(false) }
}
```

In `web/src/components/AcuteStrip.tsx`, replace the `tipsHidden` state, its effect and `showTips` with:

```tsx
	const { tipsHidden, showTips } = useEscapeHidesTips()
```

and change the `react` import to nothing (remove `useEffect, useState`) plus:

```tsx
import { useEscapeHidesTips } from "../hooks/useEscapeHidesTips.ts"
```

Run: `npx vitest run tests/strip.test.tsx`
Expected: PASS (behaviour unchanged).

- [ ] **Step 6: Write `useHistoryButtons.ts`**

```ts
import { useEffect, useState } from "react"
import { useHistoryEvents, useNavigate } from "../navigation.ts"
import {
	type HistoryStatus,
	navigationOf,
	readHistoryStatus,
} from "../services/historyCounter.ts"

// The state and actions behind both layouts (spec: Behaviour). Back goes back when there is an
// entry behind, goes home through the router when there is none, and is disabled on the landing
// page then. Forward goes forward or is disabled.
export function useHistoryButtons(atLanding: boolean) {
	const navigate = useNavigate()
	const { subscribe, counter } = useHistoryEvents()
	// null until mounted: the prerender and the first client render show both buttons disabled,
	// so the two renders match (spec: Before hydration).
	const [status, setStatus] = useState<HistoryStatus | null>(null)

	useEffect(() => {
		const nav = navigationOf(window)
		const update = () => setStatus(readHistoryStatus(nav, counter))
		update()
		const unsubscribe = subscribe(update)
		nav?.addEventListener("currententrychange", update)
		// A page restored from the back/forward cache keeps the state it had when it was left.
		window.addEventListener("pageshow", update)
		return () => {
			unsubscribe()
			nav?.removeEventListener("currententrychange", update)
			window.removeEventListener("pageshow", update)
		}
	}, [subscribe, counter])

	const canGoBack = status?.canGoBack ?? false
	return {
		backDisabled: status === null || (!canGoBack && atLanding),
		forwardDisabled: !(status?.canGoForward ?? false),
		back: () => (canGoBack ? window.history.back() : navigate("/", "")),
		forward: () => window.history.forward(),
	}
}
```

- [ ] **Step 7: Write `HistoryButtons.tsx`**

```tsx
import { type MouseEvent, useEffect, useRef } from "react"
import { useEscapeHidesTips } from "../hooks/useEscapeHidesTips.ts"
import { useHistoryButtons } from "../hooks/useHistoryButtons.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { notePress } from "../services/returnFocus.ts"
import { BackIcon, ForwardIcon } from "./icons.tsx"

type Layout = "bar" | "icons"

// Back and Forward for the installed app, where the browser shows none (spec: Layout). One
// component, two layouts: the bottom bar below 1024 px and two icons before the brand from
// 1024 px. CSS shows at most one, and only in installed mode; in a browser tab both are
// display: none, so they are in neither the tab order nor the accessibility tree. The arrow is
// the only thing on screen; the name is visually hidden text.
export function HistoryButtons({ layout, atLanding }: { layout: Layout; atLanding: boolean }) {
	const t = useTranslation()
	const { backDisabled, forwardDisabled, back, forward } = useHistoryButtons(atLanding)
	const barRef = useBarHeight(layout === "bar")
	const { tipsHidden, showTips } = useEscapeHidesTips()
	const icons = layout === "icons"
	const press = (go: () => void) => (event: MouseEvent<HTMLButtonElement>) => {
		notePress(event.currentTarget)
		go()
	}
	const buttons = [
		{ key: "back", label: t("history.back"), Icon: BackIcon, disabled: backDisabled, go: back },
		{
			key: "forward",
			label: t("history.forward"),
			Icon: ForwardIcon,
			disabled: forwardDisabled,
			go: forward,
		},
	]
	return (
		<nav
			ref={barRef}
			aria-label={t("history.label")}
			className={icons ? "history-icons" : "history-bar"}
			data-tips={icons && tipsHidden ? "hidden" : undefined}
		>
			{buttons.map(({ key, label, Icon, disabled, go }) => (
				<button
					key={key}
					type="button"
					className="btn-secondary history-btn"
					disabled={disabled}
					onClick={press(go)}
					onPointerEnter={icons ? showTips : undefined}
					onFocus={icons ? showTips : undefined}
				>
					<Icon className="size-6" />
					<span className="visually-hidden">{label}</span>
					{/* Shown on hover and keyboard focus with a mouse only (see .history-tip). It
					    repeats the button's name, so screen readers skip it. */}
					{icons && (
						<span className="history-tip" aria-hidden="true">
							{label}
						</span>
					)}
				</button>
			))}
		</nav>
	)
}

// The page keeps room under its last line for the bar (spec: below 1024 px). The bar's real
// height, safe-area inset and larger text included, goes to --history-bar-h on <html>; CSS falls
// back to 4.25rem plus the inset until this runs. setProperty is CSSOM, which the CSP allows.
function useBarHeight(active: boolean) {
	const ref = useRef<HTMLElement>(null)
	useEffect(() => {
		const bar = ref.current
		if (!active || !bar) return
		const root = document.documentElement
		const observer = new ResizeObserver(() => {
			root.style.setProperty("--history-bar-h", `${bar.getBoundingClientRect().height}px`)
		})
		observer.observe(bar)
		return () => {
			observer.disconnect()
			root.style.removeProperty("--history-bar-h")
		}
	}, [active])
	return ref
}
```

- [ ] **Step 8: Wire it into the header and the shell**

`web/src/components/Header.tsx`: add the import, take the prop and render the icons as the first item of `.header-row`:

```tsx
import { HistoryButtons } from "./HistoryButtons.tsx"
```

```tsx
export function Header({ atLanding }: { atLanding: boolean }) {
```

Extend the row comment's first sentence to: "DOM order is history icons (installed app, from 1024 px), brand, nav, pickers, Meny, exit." Then, right after the opening `<div className="header-row ...">`:

```tsx
				<HistoryButtons layout="icons" atLanding={atLanding} />
```

`web/src/App.tsx`, in `Shell`: add the import, pass the prop and render the bar after the footer:

```tsx
import { HistoryButtons } from "./components/HistoryButtons.tsx"
```

```tsx
			<Header atLanding={route.kind === "landing"} />
```

```tsx
			<Footer />
			{/* After the footer, so Tab reaches the bar last, in the order it is seen. */}
			<HistoryButtons layout="bar" atLanding={route.kind === "landing"} />
```

- [ ] **Step 9: Keep the axe test to one layout**

In `web/tests/axe.test.tsx`, under the `.menu-nav` line:

```ts
		// Likewise both history layouts are in the tree; the test width shows the header icons.
		container.querySelector(".history-bar")?.setAttribute("hidden", "")
```

In `web/tests/headerMenu.test.tsx`, the test "the phone layout with the Meny open has no axe violations" hides `.header-nav` and `.header-tools` in a selector loop. Add `.history-icons` to that loop: the phone layout shows the bar, and two "Sidehistorikk" landmarks in the tree fail axe's `landmark-unique`.

- [ ] **Step 10: Run the tests**

Run: `npx vitest run tests/historyButtons.test.tsx tests/shell.test.tsx tests/headerMenu.test.tsx tests/axe.test.tsx tests/hydration.test.tsx tests/header.test.tsx tests/strip.test.tsx`
Expected: PASS. `hydration.test.tsx` proves the prerender and the first client render still match with the buttons in place.

- [ ] **Step 11: Run the suites and commit**

Run: `npx biome ci . && npm run typecheck && npm test`
Expected: green.

```bash
git add src/hooks/useHistoryButtons.ts src/hooks/useEscapeHidesTips.ts src/components/HistoryButtons.tsx src/components/icons.tsx src/components/AcuteStrip.tsx src/components/Header.tsx src/App.tsx src/i18n/nb.json src/i18n/en.json tests/historyButtons.test.tsx tests/shell.test.tsx tests/headerMenu.test.tsx tests/axe.test.tsx
git commit -m "feat: Back and Forward buttons, bar and header icons"
```

---

### Task 7: Installed-mode CSS and the layout checks

**Files:**
- Modify: `web/src/styles/main.css` (after the `@media (min-width: 768px) { .menu-word ... }` block; the `.strip-tip` rule; the hover block under it)
- Create: `web/tests/historyCss.test.ts`
- Create: `web/e2e/history.spec.ts`
- Modify: `web/e2e/helpers.ts` (move `headerControls`, `rowsOf` and `Box` here)
- Modify: `web/e2e/header.spec.ts` (import them instead)

**Interfaces:**
- Consumes: the class names from Task 6; `forceInstalled` (Task 1).
- Produces: `headerControls(page)` and `rowsOf(boxes)` exported from `e2e/helpers.ts` (moved verbatim from `header.spec.ts`); `hydrated(page)` in `e2e/helpers.ts`, used by Task 8.

- [ ] **Step 1: Write the failing CSS guard**

`web/tests/historyCss.test.ts`:

```ts
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test } from "vitest"

const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(join(here, "../src/styles/main.css"), "utf8")

function body(pattern: RegExp): string {
	const found = css.match(pattern)
	if (!found) throw new Error(`main.css lacks ${pattern}`)
	return (found[1] ?? "").replace(/\s+/g, " ").trim()
}

// Installed mode has two triggers (spec: Layout, Installed mode). Each sets the same three
// switches; this keeps them from drifting apart.
test("both installed-mode triggers set the same switches", () => {
	const media = body(/@media screen and \(display-mode: standalone\) \{\s*:root \{([^}]*)\}/)
	const attribute = body(/@media screen \{\s*:root\[data-standalone\] \{([^}]*)\}/)
	expect(media).toBe(attribute)
	for (const name of ["--history-bar: grid", "--history-icons: flex", "--history-space:"]) {
		expect(media).toContain(name)
	}
})

// viewport-fit=cover lets the page run under a notch in landscape; the content stays inside.
test("the page keeps its content inside the safe area", () => {
	expect(css).toContain(
		"padding-inline: env(safe-area-inset-left) env(safe-area-inset-right);"
	)
})
```

Run: `npx vitest run tests/historyCss.test.ts`
Expected: FAIL, `main.css lacks /@media screen and \(display-mode.../`.

- [ ] **Step 2: Write the CSS**

In `web/src/styles/main.css`, inside `@layer components`, after the `@media (min-width: 768px) { .menu-word {...} }` block:

```css
	/* Back and Forward in the installed app (spec: Layout). Both layouts are display: none by
	   default, so a browser tab has them in neither the tab order nor the accessibility tree.
	   Installed mode sets three switches on :root from either trigger below; nothing else reads
	   the triggers. Both are screen-only, so neither layout prints. tests/historyCss.test.ts keeps
	   the two blocks identical. */
	@media screen and (display-mode: standalone) {
		:root {
			--history-bar: grid;
			--history-icons: flex;
			--history-space: var(--history-bar-h, calc(4.25rem + env(safe-area-inset-bottom)));
		}
	}
	/* iPhones report installed mode through navigator.standalone, not the media query; main.tsx
	   turns that into data-standalone before it hydrates. */
	@media screen {
		:root[data-standalone] {
			--history-bar: grid;
			--history-icons: flex;
			--history-space: var(--history-bar-h, calc(4.25rem + env(safe-area-inset-bottom)));
		}
	}
	/* Below 1024 px: fixed to the bottom edge, two equal columns. Above the page, below the
	   sticky header (z-index 10), so the open Meny and pickers cover it. */
	.history-bar {
		display: var(--history-bar, none);
		position: fixed;
		inset-inline: 0;
		inset-block-end: 0;
		z-index: 5;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		padding: 0.5rem calc(1rem + env(safe-area-inset-right))
			calc(0.5rem + env(safe-area-inset-bottom)) calc(1rem + env(safe-area-inset-left));
		background: var(--surface);
		border-block-start: 1px solid var(--border);
	}
	.history-icons {
		display: none;
		align-items: center;
		gap: 0.25rem;
	}
	.history-btn {
		position: relative;
	}
	.history-icons .history-btn {
		min-width: 44px;
		padding-inline: 0;
	}
	/* A button that cannot act stays where it is, so nothing beside it moves. */
	.history-btn:disabled {
		opacity: 0.45;
		cursor: default;
	}
	/* Room for the bar under the page's last line, and for focus scrolled to the bottom (WCAG
	   2.4.11). The value is the bar's real height (useBarHeight), or the default until it runs. */
	body {
		padding-block-end: var(--history-space, 0);
	}
	html {
		scroll-padding-block-end: var(--history-space, 0);
	}
	@media (min-width: 1024px) {
		.history-bar {
			display: none;
		}
		.history-icons {
			display: var(--history-icons, none);
		}
		body {
			padding-block-end: 0;
		}
		html {
			scroll-padding-block-end: 0;
		}
	}
	@media (forced-colors: active) {
		.history-btn:disabled {
			opacity: 1;
			color: GrayText;
			border-color: GrayText;
		}
	}
	/* viewport-fit=cover (index.html) lets the page run under a notch in landscape, so the
	   content keeps itself inside the safe area. Every inset is 0 in portrait and on desktop. */
	body {
		padding-inline: env(safe-area-inset-left) env(safe-area-inset-right);
	}
```

Change the `.strip-tip {` selector line to `.strip-tip,` + `.history-tip {` so the two share one look:

```css
	.strip-tip,
	.history-tip {
```

and extend the `@media (hover: hover) and (pointer: fine)` block under it:

```css
	@media (hover: hover) and (pointer: fine) {
		.strip-link:hover .strip-tip,
		.strip-link:focus-visible .strip-tip,
		.history-btn:hover .history-tip,
		.history-btn:focus-visible .history-tip {
			display: block;
		}
		.acute-strip[data-tips="hidden"] .strip-tip,
		.history-icons[data-tips="hidden"] .history-tip {
			display: none;
		}
	}
```

Update the comment above `.strip-tip` to say the history icons share it.

Run: `npx vitest run tests/historyCss.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 3: Move the header helpers**

Cut `type Box`, `headerControls` and `rowsOf` (with their comments) from `web/e2e/header.spec.ts` into `web/e2e/helpers.ts`, export them, and import them in `header.spec.ts`. One change on the way: scope the selector to the app header, `".app-header a, .app-header button, .app-header summary"`. The detail page has a `<header>` of its own (`ResourceDetail.tsx`, the call and copy buttons), and the unscoped `header a, ...` counts those as extra rows on /resources/1. `header.spec.ts` only visits "/" and "/en/", so it is unaffected:

```ts
import { headerControls, noHorizontalScroll, rowsOf, setTheme, settle, THEMES } from "./helpers.ts"
```

Add to `helpers.ts`:

```ts
// The app has hydrated: the theme value in the header fills in after mount.
export async function hydrated(page: Page): Promise<void> {
	await page
		.locator("header .visually-hidden", { hasText: /^(Tema|Theme): / })
		.first()
		.waitFor({ state: "attached" })
}
```

- [ ] **Step 4: Write the layout e2e**

`web/e2e/history.spec.ts`:

```ts
import { createRequire } from "node:module"
import { expect, type Page, test } from "@playwright/test"
import {
	forceInstalled,
	headerControls,
	hydrated,
	noHorizontalScroll,
	rowsOf,
	setTheme,
	settle,
	THEMES,
} from "./helpers.ts"

const bar = (page: Page) => page.locator(".history-bar")
const icons = (page: Page) => page.locator(".history-icons")

async function boxes(page: Page, selector: string) {
	return page
		.locator(selector)
		.evaluateAll((els) =>
			els.map((el) => {
				const r = el.getBoundingClientRect()
				return { top: r.top, bottom: r.bottom, height: r.height, width: r.width, left: r.left }
			})
		)
}

// Spec: Layout, decision 1. A browser tab has its own Back and Forward.
for (const width of [375, 1024, 1280]) {
	test(`a browser tab at ${width} px shows no history controls`, async ({ page }) => {
		await page.setViewportSize({ width, height: 800 })
		await page.goto("/resources/1")
		await hydrated(page)
		await expect(bar(page)).toBeHidden()
		await expect(icons(page)).toBeHidden()
		await expect(page.getByRole("navigation", { name: "Sidehistorikk" })).toHaveCount(0)
	})
}

for (const [path, label] of [
	["/resources/1", "Sidehistorikk"],
	["/en/resources/1", "Page history"],
] as const) {
	for (const width of [320, 375]) {
		test(`installed at ${width} px (${path}): the bar, 44 px buttons on one bottom edge`, async ({
			page,
		}) => {
			await forceInstalled(page)
			await page.setViewportSize({ width, height: 800 })
			await page.goto(path)
			await settle(page)
			await hydrated(page)
			await expect(bar(page)).toBeVisible()
			await expect(icons(page)).toBeHidden()
			await expect(page.getByRole("navigation", { name: label })).toHaveCount(1)
			const buttons = await boxes(page, ".history-bar .history-btn")
			expect(buttons).toHaveLength(2)
			for (const b of buttons) expect(b.height).toBeCloseTo(44, 0)
			expect(Math.abs(buttons[0].bottom - buttons[1].bottom)).toBeLessThan(1)
			expect(Math.abs(buttons[0].width - buttons[1].width)).toBeLessThan(1)
			const [frame] = await boxes(page, ".history-bar")
			expect(frame.bottom).toBeCloseTo(800, 0)
			expect(await noHorizontalScroll(page)).toBe(true)
			// The header is unchanged on phones: still one row.
			expect(rowsOf(await headerControls(page))).toHaveLength(1)
		})
	}

	for (const width of [1024, 1280]) {
		test(`installed at ${width} px (${path}): icons first in one header row, one bottom edge`, async ({
			page,
		}) => {
			await forceInstalled(page)
			await page.setViewportSize({ width, height: 900 })
			await page.goto(path)
			await settle(page)
			await hydrated(page)
			await expect(icons(page)).toBeVisible()
			await expect(bar(page)).toBeHidden()
			await expect(page.locator(".header-row > :first-child")).toHaveClass(/history-icons/)
			const rows = rowsOf(await headerControls(page))
			expect(rows, JSON.stringify(rows)).toHaveLength(1)
			for (const box of rows[0]) expect(box.height, box.label).toBeCloseTo(44, 0)
			const bottoms = rows[0].map((b) => b.bottom)
			expect(Math.max(...bottoms) - Math.min(...bottoms)).toBeLessThan(1)
			for (const b of await boxes(page, ".history-icons .history-btn")) {
				expect(b.width).toBeCloseTo(44, 0)
			}
			expect(await noHorizontalScroll(page)).toBe(true)
		})
	}
}

test("neither layout shows visible text: an arrow and a hidden name only", async ({ page }) => {
	await forceInstalled(page)
	for (const width of [375, 1280]) {
		await page.setViewportSize({ width, height: 800 })
		await page.goto("/resources/1")
		await hydrated(page)
		const visibleText = await page.locator(".history-btn:visible").evaluateAll((buttons) =>
			buttons.flatMap((button) =>
				[...button.children]
					.filter((child) => child.tagName !== "svg")
					.filter((child) => !child.classList.contains("visually-hidden"))
					.filter((child) => child.checkVisibility())
					.map((child) => child.textContent)
			)
		)
		expect(visibleText, `${width} px`).toEqual([])
	}
})

test("the bar never covers the footer's last line at 375 px", async ({ page }) => {
	await forceInstalled(page)
	await page.setViewportSize({ width: 375, height: 700 })
	await page.goto("/om")
	await settle(page)
	await hydrated(page)
	await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
	const footer = await page.getByRole("contentinfo").boundingBox()
	const frame = await bar(page).boundingBox()
	if (!footer || !frame) throw new Error("no box")
	expect(footer.y + footer.height).toBeLessThanOrEqual(frame.y + 0.5)
})

// WCAG 2.4.11: a control focused at the bottom of the page is scrolled clear of the bar
// (html's scroll-padding-block-end), never left under it.
test("a focused footer link at 375 px is never under the bar", async ({ page }) => {
	await forceInstalled(page)
	await page.setViewportSize({ width: 375, height: 700 })
	await page.goto("/om")
	await settle(page)
	await hydrated(page)
	const last = page.getByRole("contentinfo").getByRole("link").last()
	await last.focus()
	const link = await last.boundingBox()
	const frame = await bar(page).boundingBox()
	if (!link || !frame) throw new Error("no box")
	expect(link.y + link.height).toBeLessThanOrEqual(frame.y + 0.5)
})

test("with text at 200 % at 320 px the padding follows the taller bar", async ({ page }) => {
	await forceInstalled(page)
	await page.setViewportSize({ width: 320, height: 700 })
	await page.goto("/om")
	await settle(page)
	await hydrated(page)
	await page.evaluate(() => {
		document.documentElement.style.fontSize = "200%"
	})
	const height = await bar(page).evaluate((el) => el.getBoundingClientRect().height)
	await expect
		.poll(() =>
			page.evaluate(() =>
				getComputedStyle(document.documentElement).getPropertyValue("--history-bar-h")
			)
		)
		.toBe(`${height}px`)
	await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
	const footer = await page.getByRole("contentinfo").boundingBox()
	const frame = await bar(page).boundingBox()
	if (!footer || !frame) throw new Error("no box")
	expect(footer.y + footer.height).toBeLessThanOrEqual(frame.y + 0.5)
})

test("with a mouse at 1280 px a history icon shows its tooltip, and Escape hides it", async ({
	page,
}) => {
	await forceInstalled(page)
	await page.setViewportSize({ width: 1280, height: 800 })
	await page.goto("/resources/1")
	await settle(page)
	await hydrated(page)
	const back = icons(page).getByRole("button", { name: "Tilbake" })
	await expect(back).toBeEnabled()
	const tip = back.locator(".history-tip")
	await back.hover()
	await expect(tip).toBeVisible()
	await expect(tip).toHaveText("Tilbake")
	const t = await tip.boundingBox()
	if (!t) throw new Error("no box")
	expect(t.x).toBeGreaterThanOrEqual(0)
	await page.keyboard.press("Escape")
	await expect(tip).toBeHidden()
})

test("print hides both layouts", async ({ page }) => {
	await forceInstalled(page)
	for (const width of [375, 1280]) {
		await page.setViewportSize({ width, height: 800 })
		await page.goto("/resources/1")
		await hydrated(page)
		await page.emulateMedia({ media: "print" })
		await expect(bar(page)).toBeHidden()
		await expect(icons(page)).toBeHidden()
		await page.emulateMedia({ media: "screen" })
	}
})

// axe in a real browser, where the contrast of the dimmed disabled state can be measured.
const axePath = createRequire(import.meta.url).resolve("axe-core/axe.min.js")
for (const theme of THEMES) {
	for (const width of [375, 1280]) {
		test(`axe passes in installed mode at ${width} px (${theme})`, async ({ page }) => {
			await forceInstalled(page)
			await setTheme(page, theme)
			await page.setViewportSize({ width, height: 800 })
			await page.goto("/resources/1")
			await settle(page)
			await hydrated(page)
			await page.addScriptTag({ path: axePath })
			const violations = await page.evaluate(async () => {
				type Result = { violations: { id: string; nodes: { target: string[] }[] }[] }
				const { axe } = window as unknown as { axe: { run(): Promise<Result> } }
				const result = await axe.run()
				return result.violations.map(
					(v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`
				)
			})
			expect(violations).toEqual([])
		})
	}
}
```

If axe reports a violation outside the history controls that also fails on `main` without this branch, do not fix it here: scope this test with `axe.run({ include: [["header"], [".history-bar"]] })`, note the outside finding in the PR body as a follow-up, and tell me.

- [ ] **Step 5: Run the e2e**

Run: `npm run build:site && npx playwright test e2e/history.spec.ts e2e/header.spec.ts e2e/anchor.spec.ts e2e/reflow.spec.ts`
Expected: PASS. `header.spec.ts` proves the browser-tab header is unchanged; `anchor.spec.ts` proves the scroll padding change kept anchors under the sticky header.

- [ ] **Step 6: Run the suites and commit**

Run: `npx biome ci . && npm run typecheck && npm test`
Expected: green.

```bash
git add src/styles/main.css tests/historyCss.test.ts e2e/history.spec.ts e2e/helpers.ts e2e/header.spec.ts
git commit -m "feat: installed-mode layout for Back and Forward, checked in the browser"
```

---

### Task 8: Back and Forward behaviour in the browser

**Files:**
- Create: `web/e2e/historyNav.spec.ts`

**Interfaces:**
- Consumes: `forceInstalled`, `hydrated`, `settle` (`e2e/helpers.ts`).

- [ ] **Step 1: Write the e2e**

`web/e2e/historyNav.spec.ts`:

```ts
import { expect, type Page, test } from "@playwright/test"
import { forceInstalled, hydrated, settle } from "./helpers.ts"

const names = {
	nb: { back: "Tilbake", forward: "Fremover", home: /\/$/ },
	en: { back: "Back", forward: "Forward", home: /\/en\/$/ },
}

function bar(page: Page, lang: "nb" | "en" = "nb") {
	const nav = page.locator(".history-bar")
	return {
		back: nav.getByRole("button", { name: names[lang].back }),
		forward: nav.getByRole("button", { name: names[lang].forward }),
	}
}

test.beforeEach(async ({ page }) => {
	await forceInstalled(page)
	await page.setViewportSize({ width: 375, height: 800 })
})

test("a first load of the landing page: Back and Forward are disabled", async ({ page }) => {
	await page.goto("/")
	await hydrated(page)
	await expect(bar(page).back).toBeDisabled()
	await expect(bar(page).forward).toBeDisabled()
})

// Back-to-home is a push, so the detail page ends up behind the landing page: Back returns to
// it and Forward is off (see "Spec correction" at the top of the plan).
for (const lang of ["nb", "en"] as const) {
	const prefix = lang === "en" ? "/en" : ""
	test(`a first load of a detail page (${lang}): Back goes home, Back again returns`, async ({
		page,
	}) => {
		await page.goto(`${prefix}/resources/1`)
		await hydrated(page)
		const { back, forward } = bar(page, lang)
		await expect(back).toBeEnabled()
		await expect(forward).toBeDisabled()
		await back.click()
		await expect(page).toHaveURL(names[lang].home)
		await expect(forward).toBeDisabled()
		await expect(back).toBeEnabled()
		await back.click()
		await expect(page).toHaveURL(new RegExp(`${prefix}/resources/1$`))
		await expect(forward).toBeEnabled()
		await forward.click()
		await expect(page).toHaveURL(names[lang].home)
	})
}

// Spec: Focus and scroll. The misclick this feature exists to fix.
async function openResultFarDown(page: Page) {
	await page.goto("/sok")
	await settle(page)
	await hydrated(page)
	const link = page.locator("main a[href^='/resources/']").nth(6)
	await link.evaluate((el) => el.scrollIntoView({ block: "center" }))
	const scrollY = await page.evaluate(() => window.scrollY)
	expect(scrollY).toBeGreaterThan(200)
	const href = await link.getAttribute("href")
	if (!href) throw new Error("no href")
	await link.click()
	await expect(page).toHaveURL(new RegExp(`${href}$`))
	return { scrollY, href }
}

const focusedHref = (page: Page) =>
	page.evaluate(() => document.activeElement?.getAttribute("href") ?? null)

test("/sok: Back returns to the scrolled spot with the followed link focused; Forward opens it again", async ({
	page,
}) => {
	const { scrollY, href } = await openResultFarDown(page)
	await bar(page).back.click()
	await expect(page).toHaveURL(/\/sok$/)
	await expect.poll(() => focusedHref(page)).toBe(href)
	expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrollY)).toBeLessThanOrEqual(1)
	await bar(page).forward.click()
	await expect(page).toHaveURL(new RegExp(`${href}$`))
	// Forward to a page you left by Back: the top, with focus on the heading.
	await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).toBe("H1")
	expect(await page.evaluate(() => window.scrollY)).toBe(0)
})

test("the browser's own Back restores the same way", async ({ page }) => {
	const { scrollY, href } = await openResultFarDown(page)
	await page.goBack()
	await expect(page).toHaveURL(/\/sok$/)
	await expect.poll(() => focusedHref(page)).toBe(href)
	expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrollY)).toBeLessThanOrEqual(1)
})

test.describe("without the Navigation API", () => {
	test.beforeEach(async ({ page }) => {
		await page.addInitScript(() => {
			Object.defineProperty(window, "navigation", { value: undefined, configurable: true })
		})
	})

	test("Back after a first load goes home, and after a reload Forward is off", async ({
		page,
	}) => {
		await page.goto("/resources/1")
		await hydrated(page)
		expect(await page.evaluate(() => (window as { navigation?: unknown }).navigation)).toBeFalsy()
		await bar(page).back.click()
		await expect(page).toHaveURL(/\/$/)
		await expect(bar(page).forward).toBeDisabled()
		await bar(page).back.click()
		await expect(page).toHaveURL(/\/resources\/1$/)
		await expect(bar(page).forward).toBeEnabled()
		await bar(page).forward.click()
		await expect(page).toHaveURL(/\/$/)
		// After a reload the router no longer knows what was ahead: Forward stays off.
		await bar(page).back.click()
		await expect(page).toHaveURL(/\/resources\/1$/)
		await page.reload()
		await hydrated(page)
		await expect(bar(page).forward).toBeDisabled()
		await expect(bar(page).back).toBeEnabled()
	})
})
```

- [ ] **Step 2: Run it**

Run: `npm run build:site && npx playwright test e2e/historyNav.spec.ts`
Expected: PASS (7 tests). If the scroll check fails by a few pixels, the page height changed between leaving and returning (a lazy chunk or font): find why before loosening the tolerance.

- [ ] **Step 3: Commit**

```bash
git add e2e/historyNav.spec.ts
git commit -m "test: Back and Forward behaviour in the installed app"
```

---

### Task 9: The quick exit, tested as it is

**Files:**
- Create: `web/e2e/quickExit.spec.ts`

**Interfaces:**
- Consumes: `forceInstalled`, `hydrated`. `EXIT_URL` is `https://www.google.com` (`services/quickExit.ts`, unchanged).

- [ ] **Step 1: Write the e2e**

`web/e2e/quickExit.spec.ts`:

```ts
import { expect, type Page, test } from "@playwright/test"
import { forceInstalled, hydrated } from "./helpers.ts"

// Spec: Quick exit. location.replace removes only the page you are on. These tests prove that
// limit as it is, and that the history buttons add nothing that undoes an exit.
const STUB = '<!doctype html><html lang="nb"><title>Stub</title><p id="exit-stub">Utgang</p></html>'

test.beforeEach(async ({ page }) => {
	await page.route(/^https:\/\/www\.google\.com\//, (route) =>
		route.fulfill({ status: 200, contentType: "text/html", body: STUB })
	)
	await forceInstalled(page)
	await page.setViewportSize({ width: 375, height: 800 })
})

// Asserting the stub first means an exit that never left cannot pass.
async function exit(page: Page) {
	await page.locator(".quick-exit").click()
	await expect(page.locator("#exit-stub")).toBeVisible()
}

test("after exiting from a detail page reached from /sok, Back lands on /sok, never on that page", async ({
	page,
}) => {
	await page.goto("/sok")
	await hydrated(page)
	await page.locator("main a[href^='/resources/']").first().click()
	await expect(page).toHaveURL(/\/resources\/\d+$/)
	await exit(page)
	await page.goBack()
	await expect(page).toHaveURL(/\/sok$/)
})

test("in a one-page session, Back after the exit leaves Varde entirely", async ({ page }) => {
	await page.goto("/resources/1")
	await hydrated(page)
	await exit(page)
	await page.goBack()
	expect(new URL(page.url()).host).not.toBe("localhost:4173")
})

test("Back-to-home raises history.length by exactly one", async ({ page }) => {
	await page.goto("/resources/1")
	await hydrated(page)
	const back = page.locator(".history-bar").getByRole("button", { name: "Tilbake" })
	await expect(back).toBeEnabled()
	const before = await page.evaluate(() => history.length)
	await back.click()
	await expect(page).toHaveURL(/\/$/)
	expect(await page.evaluate(() => history.length)).toBe(before + 1)
})
```

- [ ] **Step 2: Run it**

Run: `npm run build:site && npx playwright test e2e/quickExit.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 3: Commit**

```bash
git add e2e/quickExit.spec.ts
git commit -m "test: the quick exit cannot be undone by Back and Forward"
```

---

### Task 10: Coordination, full verification and the phone check

**Files:**
- Modify (only if the mega-menu has merged first): `web/e2e/history.spec.ts` (append)
- Modify (only if Malin decides the link goes, see Step 2): `web/src/components/ResourceDetail.tsx`, `web/tests/detail.test.tsx`

- [ ] **Step 1: The mega-menu, if it merged first**

Run: `git log origin/main --oneline | grep -i "mega"`. If `feat/mega-menu` is on `main`, rebase and append to `web/e2e/history.spec.ts`:

```ts
// Spec: in installed mode the mega-menu panel's first column lines up with the row's start
// edge, which is now the Back button.
test("installed at 1280 px the services panel starts on the Back button's left edge", async ({
	page,
}) => {
	await forceInstalled(page)
	await page.setViewportSize({ width: 1280, height: 800 })
	await page.goto("/resources/1")
	await settle(page)
	await hydrated(page)
	await page.locator("details.services > summary").click()
	const back = await page.locator(".history-icons .history-btn").first().boundingBox()
	const column = await page.locator(".services-col").first().boundingBox()
	if (!back || !column) throw new Error("no box")
	expect(Math.abs(column.x - back.x)).toBeLessThanOrEqual(1)
})
```

Then run `npx playwright test e2e/header.spec.ts e2e/history.spec.ts` and confirm the 1024 px rows are still one row in nb and en, in both a browser tab and installed mode. If the mega-menu has not merged, skip this step; the mega-menu PR re-runs the check when it lands second.

- [ ] **Step 2: "Tilbake til resultater"**

My approved spec keeps it ("It also serves browser tabs"). The detail-card spec (on `docs/detail-card-spec`) says whichever of the two PRs lands second removes it. These conflict, and only Malin can settle it. Ask her before this step: "The detail-card spec removes 'Tilbake til resultater' once Back and Forward land, but Back and Forward exist only in the installed app. Keep the link for browser tabs (my spec), or remove it?" Then:
- **Keep (default, the approved spec):** change nothing. Tell the detail-card session the link stays.
- **Remove, and the detail card has not merged:** leave it; the detail-card PR removes it.
- **Remove, and the detail card merged first and left it:** delete the link, its `cameFromResults` state and effect from `ResourceDetail.tsx`, and the tests that name "Tilbake til resultater" in `tests/detail.test.tsx`; leave `from: "sok"` in the router (harmless, and other code may read it later). Run `npm test` and commit `feat: Back and Forward replace "Tilbake til resultater"`.

- [ ] **Step 3: All suites, from clean**

Run: `npx biome ci . && npm run typecheck && npm test && npm run build:site && npx playwright test`
Expected: all green. Paste the summary lines (test counts) into the PR body.

- [ ] **Step 4: Check every spec test line**

Walk the spec's Testing section line by line and name the test that covers each. Every unit and e2e line has one in Tasks 1 to 9. Fix any gap before going on.

- [ ] **Step 5: On my phone**

Serve the built branch so I can install it (Varde needs HTTPS to install, so use the PR's Cloudflare preview deployment once the PR is pushed as a draft). I install it on my phone and try Back, Forward and the quick exit in the real installed app. I also turn the phone to landscape and set the system text size to its largest, and check that the sticky header and the bar together still leave room to read and that nothing sits under the notch. I also open the installed desktop window (Chrome or Edge) and check whether it already shows a back arrow of its own; if it does, dropping the desktop icons becomes a follow-up issue.

- [ ] **Step 6: Open the PR**

Push `feat/back-forward` and open the PR with this body:

```markdown
## Back and Forward in the installed app

Varde installed on a phone or desktop has no browser buttons, so a misclick had no way back. This adds Back and Forward there, and the web manifest that makes Varde installable.

- Installed mode only. Browser tabs are unchanged.
- Phones get a bottom bar, desktop two icons before the brand. Arrows only; the names are hidden text.
- Back goes home when nothing is behind it, and is disabled on the landing page then.
- Back and Forward bring you back to the same spot, with focus on the link you followed.
- The quick exit is untouched. Its limit (earlier Varde pages stay in the history) is tested as it is.

Spec: `docs/superpowers/specs/2026-10-16-varde-back-forward-design.md`
Plan: `docs/superpowers/plans/2026-10-16-varde-back-forward.md`

### Tested
- Biome, typecheck, Vitest, Playwright: (paste the counts from Step 3)
- On my phone in the installed app: Back, Forward, quick exit
```

---

## Self-review against the spec

- Manifest, viewport-fit, theme-color: Task 2. Installed-mode triggers: Tasks 1 and 7. One component, two layouts, nav names: Task 6. Bar measurements, safe area, z-index, padding with `--history-bar-h`, print: Task 7. Icons before the brand, tooltips with Escape, 44 px: Tasks 6 and 7. Disabled look and forced colours: Task 7.
- Back, home fallback, Forward, Navigation API, fallback `idx`, subscribe without polling, `replaceState` keeps fields, no storage: Tasks 3, 4 and 6. Before hydration: Task 6.
- Focus and scroll table, read at ready time, string matching, instant scroll, `checkVisibility`, new navigations unchanged: Tasks 4 and 5.
- Quick exit and its three e2e tests: Task 9. Copy keys: Task 6. Phone check and coordination: Task 10.

## Stress test (2026-10-16)

Five lenses on this plan, plus a fresh-context review that ran every code block from Tasks 1 to 9 in a scratch copy (tsc, Biome, Vitest, build:site, Playwright with `--repeat-each=5`).

- Security: clean. `history.state` is read through `readEntry`, which keeps only typed fields; a saved href is compared as a string, never built into a selector or navigated to. No new dependency.
- Privacy: clean. Nothing new is stored; history state lives in the tab's own session history.
- Legal: clean. The arrows are Rookdex's own paths; axe-core is an existing dev dependency.

**Applied**
1. 🟠 Accessibility: `viewport-fit=cover` lets landscape content run under a notch. `body` gets the safe-area inline padding (Task 7), guarded by `historyCss.test.ts`.
2. 🟠 Accessibility (WCAG 2.4.11): an e2e test focuses the footer's last link at 375 px and proves the bar never covers it (Task 7).
3. 🟠 Loophole: the installed-mode header e2e counted the detail page's own `<header>`; `headerControls` is scoped to `.app-header` (Task 7).
4. 🟠 Guard that could not fail: the "two quick presses" test passed with a state-at-arrival implementation; it now keeps `arrival` fixed across the second press (Task 5).
5. 🟠 Existing test left broken: `headerMenu.test.tsx`'s phone axe test now hides `.history-icons` (Task 6).
6. 🟡 Typecheck: three `noUncheckedIndexedAccess` errors in the new tests fixed (Tasks 2, 6, 7).
7. 🟡 Accessibility: the phone check now covers landscape and the largest system text (Task 10).
8. 🟡 Loophole: the spec's "Forward can return" after Back-to-home is impossible with a push; the plan tests the real behaviour and states the correction at the top.

**Adapted**
1. Installed mode in e2e uses the `navigator.standalone` init script, not emulated `display-mode`: probed, Chromium 156 ignores both media paths, and the init script also exercises the iPhone path.

**Considered and rejected**
- **Fixed bar on a short landscape screen.** Header and bar together take about 122 px. Making the bar static below a height breaks "one tap back". Checked by hand on the phone instead (Task 10).
- **`scrollRestoration = "manual"` on a cross-document Back in a browser tab.** Such a return now opens at the top unless bfcache restores it. Every Varde link, the language switch included, is a router push, so this only meets rare external same-tab returns.
- **A stale `notePress`.** A pressed button that never produces a restore could steer one later same-route restore; every consumption clears it, so at most one rescue can misfire, and only onto the heading.

> Stress-tested 2026-10-16 (skill 1b85fca): 8 applied, 1 adapted, 0 decided by me (the Forward correction waits for Malin).
