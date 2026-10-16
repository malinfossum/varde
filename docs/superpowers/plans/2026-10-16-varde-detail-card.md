# Varde: the detail page as one card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put everything about a service on `/resources/:id` inside one bordered card, in sections with real `h2` headings, with the email as the last contact tile and copy, share and report as corner actions (option D).

**Architecture:** One PR on `feat/detail-card`. `ResourceDetail` becomes a page wrapper (back link, then the card) around one `article.detail-card`: a `header` (title block plus the action group), then the Kontakt, Om tjenesten and Praktisk informasjon sections, then a `footer`. The actions move into a new `DetailActions` component that owns the share and copy capability checks, the visible confirmation and the Escape behaviour. CSS in `main.css` switches the one set of action controls between labelled mode and icon mode with a single media query, so there is never a second set of buttons. `contactTiles()` gains an `email` tile behind a new `safeEmail()` guard.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind 4 (component classes in `web/src/styles/main.css`), Vitest + Testing Library + jest-dom + vitest-axe, `@playwright/test` 1.64 (Chromium only, against `npm run build:site`), Biome 2. The API is untouched; its suite still runs before the PR.

**Spec:** `docs/superpowers/specs/2026-10-16-varde-detail-card-design.md` (approved by me 2026-10-16, on branch `docs/detail-card-spec`, stress-tested). Read it in full before Task 1. Reference screenshots of option D (the chosen one): `D-375.png`, `D-1024.png`, `D-375-200pct.png` and `email-as-tile-1024.png` in `C:\Users\Nugget\Documents\Development\GitHub\repos\varde\.claude\worktrees\lavterskel-plan-9f2025\.superpowers\sdd\2026-10-16-varde-detail-card\options\`.

## Global Constraints

Every task's requirements include these. Values are copied from the spec.

- **One card:** `article` with the C2a card style: `rounded-xl border border-border bg-surface p-5 md:p-8`, `grid gap-6`.
- **DOM order is reading and focus order at every width:** head (`h1`, badges, region, "Del av", fallback note, then the action group), Kontakt, Om tjenesten, Praktisk informasjon, footer.
- **Sections:** each a `section` with `aria-labelledby` pointing at a visible `h2`. A section is left out when it would be empty. Between sections a 1 px `border-border` line with `1.5rem` above (the card's `gap-6`) and `1.5rem` below (`padding-top` on the section).
- **Section label style** is `.helpline-group`'s: `0.75rem`, uppercase, `letter-spacing: 0.12em`, regular weight, `var(--muted)`. One shared rule, `.helpline-group, .section-label { … }`, never a copy.
- **Footer:** `footer`, `text-sm text-muted`, "Sist bekreftet 2026-08-13" (ISO date, unchanged). No heading.
- **Icon mode media query, exactly:** `@media (min-width: 768px) and (hover: hover) and (pointer: fine)`. Every other case is labelled mode.
- **Icon mode:** buttons 44 × 44 px, icon centred, short label hidden. Head grid `minmax(0, 1fr) auto`, `gap-4`, `align-items: start`. Tooltip in the `.strip-tip` style, `6px` below the button, aligned to the button's end edge, shown on hover and `:focus-visible`, hidden by Escape until the pointer re-enters or focus moves.
- **Labelled mode:** `display: grid; grid-template-columns: repeat(auto-fit, minmax(5.5rem, 1fr)); gap: 0.5rem`. Each button: icon above the short label, `min-height: 56px`, `0.75rem` label text, the `btn-secondary` border, radius and surface.
- **Accessible names (`aria-label`):** "Kopier nummer" / "Copy number"; "Del" / "Share" or "Kopier lenke" / "Copy link"; "Meld feil i oppføringen" / "Report an error in this listing". Short labels and tooltips are `aria-hidden`. Every short label is contained in its name.
- **Visible confirmation:** 4 seconds, in the button's tooltip slot, in both modes, `aria-hidden`; replaces the name tooltip while it shows. A native share sheet (`"shared"`) and a cancelled one show nothing. Escape or a click on another action clears it; a second click on the same action restarts it; the timer is cleared on unmount. The live-region announcement stays.
- **Prerender renders all three actions** with share labelled "Del". After mount: no clipboard hides copy; no share and no clipboard hides share; clipboard without share relabels it "Kopier lenke".
- **Email tile:** `{ kind: "email", key, address, href }`, `href` is `mailto:` plus the address, last in the tile order, only the service's own email, behind `safeEmail()`. Label `detail.email`, name "E-post, <address>" with the C2a hidden comma. No `rel`, no `target`.
- **Tile rows:** one column below 768 px with each tile as tall as its own content; `grid-auto-rows: 1fr` from 768 px only.
- **Copy (new keys):** `detail.aboutHeading` "Om tjenesten" / "About the service"; `detail.practicalHeading` "Praktisk informasjon" / "Practical details"; `report.short` "Meld feil" / "Report".
- **Icons:** `CopyIcon`, `ShareIcon`, `FlagIcon`, `MailIcon` in `icons.tsx` on the shared 24-unit `Svg` grid, decorative. Drawn for Varde, no path copied from an icon set.
- **"Back to results"** stays above the card unless the back and forward buttons have merged to `main` when this PR opens (Task 8). The page never ships without a way back.
- **Out of scope:** dates following the language, links opening in a new tab, hyphenating the title.
- **Controls on one row share one height and one bottom edge.** Labels stand apart from values by size, weight or colour.
- **CSS is mobile-first:** baseline is the smallest screen, `min-width` queries only.
- **Text I ship:** first person in comments and docs, no em dashes anywhere (rewrite the sentence; no en dash or spaced hyphen as a stand-in). Every new UI string has an nb and an en entry.
- **Commits:** conventional prefix (`feat:`, `fix:`, `test:`, `docs:`, `style:`), author `malinfossum.dev@proton.me`, no `Co-Authored-By`, no AI attribution.
- **Dates:** before writing any date into a file, run `date +"%Y-%m-%d %A"` in the same tool batch.
- **Commands.** API from `api/`: start PostgreSQL first (PowerShell: `Start-Service postgresql-x64-17`), then `dotnet test Varde.slnx`. Web from `web/`: `npx biome check --write .` then `npx biome ci .`, `npm run typecheck`, `npm test`, and for Playwright `mkdir -p public/data && cp e2e/fixtures/data/*.json public/data/ && npm run build:site && npx playwright test`.

## Review Focus

Inputs the spec implies but its test list does not name, most likely first. Each has a test in the task that owns the code.

1. **A refused clipboard write** (permission denied, a locked-down browser). The person sees "Kunne ikke kopiere" under the button, not only a screen-reader announcement, and the name tooltip comes back after 4 seconds. Test in Task 6.
2. **Real addresses the strict guard must still accept:** a plus sign, hyphens, several subdomains, capitals (`Ola+Varde@Post.Example-Kommune.no`). Dropping a real address silently hides a way to reach a service. Test in Task 3.
3. **A service with no phone.** The group has two actions (share and report). They still share one width and one height in labelled mode and sit side by side in icon mode, with no empty slot. Test in Task 5.
4. **The pointer moving from an icon button down onto its tooltip** across the 6 px gap. The tooltip must stay open (WCAG 1.4.13, hoverable). Test in Task 1.
5. **200 % text on a desktop window with a mouse** (icon mode at 1024 px). The title column narrows, but the actions stay 44 × 44 and never overlap the title. Test in Task 1.

## Decided (2026-10-16, writing this plan)

- **Base branch:** cut from `origin/main` if PR #78 has merged by the time the build starts, otherwise from `origin/feat/helplines-c2a`, and rebased onto `main` before the PR opens (spec: Base).
- **"Every control on the card is at least 44 px tall" means the action buttons and the contact tiles.** The website link in Praktisk informasjon and the parent link in "Del av" are text links inside a line of text, which WCAG 2.5.8 exempts, and both look like that in the chosen screenshots.
- **The short label is `display: none` in icon mode,** not visually hidden. It is `aria-hidden` either way, so the only difference is that it takes no room.
- **The tooltip gets a transparent 6 px bridge** (`::before`) between the button and the bubble, so the pointer can cross the gap without the tooltip closing.
- **In labelled mode the confirmation spans the button's width** (`inset-inline: 0`, wraps), so a bubble under the left-most button cannot run off the card. In icon mode it is end-aligned and on one line, like the name tooltip.
- **The tooltip, the confirmation and `.strip-tip` share one rule for their look;** each keeps its own position. `.btn-secondary` and `.action-btn` share one rule for border, radius, surface, text colour and weight. Shared selectors, no copies (the spec's `.helpline-group` approach).
- **The facts grid from 768 px is `max-content minmax(0, 1fr)`,** not `max-content 1fr`: a plain `1fr` cannot shrink below a long unbroken URL.
- **Section ids:** `contact` (unchanged), `service-about`, `service-practical`.
- **`safeEmail` lives in `services/contactTiles.ts`,** its only user, and is exported for its tests.
- **The website link gets the https guard that chat links already have** (`safeChatUrl`). All 94 rows are https today, so nothing changes on screen; a bad value shows as text instead of becoming a `javascript:` link. I rewrite that line anyway, so the guard comes along.
- **The confirmation stores its i18n key, not its text,** so a language switch during the 4 seconds switches the bubble too. It takes no pointer events, so a tap on what it covers is not swallowed by the button.
- **Section headings keep the display font** from the base `h2` rule, as in the chosen screenshots. The shared rule sets size, case, spacing, weight and colour only.

## Open items (owner: Malin)

- **Preview before the PR (Task 9):** id 1 and id 102 at 375, 1024 and 1920 px, nb and en, dark and light.
- **Merging is my call.** Agents push the branch, open the PR and bind it; they never merge.

---

## File map

| File | Change |
|---|---|
| `web/e2e/detail-card.spec.ts` | Create. Every new layout check (Task 1). |
| `web/src/services/contactTiles.ts` | Modify. `email` tile kind, `safeEmail()` (Task 3). |
| `web/src/components/ContactTiles.tsx` | Modify. Email tile, visible `h2`, section class, row heights (Tasks 3, 4). |
| `web/src/components/icons.tsx` | Modify. `MailIcon` (Task 3); `CopyIcon`, `ShareIcon`, `FlagIcon` (Task 5). |
| `web/src/components/ResourceDetail.tsx` | Modify. The card and its sections (Task 4), the action group (Task 5). |
| `web/src/components/DetailActions.tsx` | Create. Copy, share, report; capability checks; confirmation; Escape (Tasks 5, 6). |
| `web/src/styles/main.css` | Modify. Card, sections, facts, actions, tooltips (Tasks 3 to 6). |
| `web/src/i18n/nb.json`, `en.json` | Modify. Three new keys (Tasks 4, 5). |
| `web/tests/contactTiles.test.ts` | Modify (Task 3). |
| `web/tests/detail.test.tsx` | Modify (Tasks 3, 4, 5). |
| `web/tests/detailActions.test.tsx` | Create (Tasks 5, 6). |
| `web/tests/hydration.test.tsx` | Modify (Task 5). |
| `web/tests/axe.test.tsx` | Modify (Task 7). |

## Setup (before Task 1)

- [ ] **Step 1: Check whether PR #78 has merged, then branch**

```bash
git fetch origin
gh pr view 78 --json state,mergedAt -q '.state + " " + (.mergedAt // "")'
```

If it prints `MERGED …`, the base is `origin/main`. Otherwise the base is `origin/feat/helplines-c2a`. Say which in the ledger, and when it is the C2a branch also write its SHA there (`git rev-parse origin/feat/helplines-c2a`). Task 9 rebases from that SHA, because GitHub may delete the branch when #78 merges.

```bash
BASE=origin/feat/helplines-c2a   # or origin/main if #78 has merged
git switch -c feat/detail-card "$BASE"
mkdir -p docs/superpowers/specs docs/superpowers/plans
git show origin/docs/detail-card-spec:docs/superpowers/specs/2026-10-16-varde-detail-card-design.md > docs/superpowers/specs/2026-10-16-varde-detail-card-design.md
git show origin/docs/detail-card-spec:docs/superpowers/plans/2026-10-16-varde-detail-card.md > docs/superpowers/plans/2026-10-16-varde-detail-card.md
git status --short
```

Expected: `git status --short` prints nothing (both paths are already in `$(git rev-parse --git-common-dir)/info/exclude`). If it lists either file, add the path to that exclude file. If a `git show` fails with "does not exist", stop and tell me; do not work from an older copy.

- [ ] **Step 2: Confirm a green start**

PowerShell: `Start-Service postgresql-x64-17`. Then from `api/`: `dotnet tool restore && dotnet test Varde.slnx`. From `web/`: `npm ci && npm run typecheck && npm test`.
Expected: all PASS. If anything is red before Task 1, stop and report it.

---

### Task 1: The layout checks, written first and run red

**Files:**
- Create: `web/e2e/detail-card.spec.ts`

**Interfaces:**
- Consumes: `noHorizontalScroll`, `settle` from `web/e2e/helpers.ts`. Fixture rows 1 (Hjelpetelefonen, three tiles, no email) and 102 (Ringsaker, longest name, phone and email, all three practical fields).
- Produces: the class names every later task must render, so these checks can find them: `article.detail-card` (the card), `.detail-actions` (the group), `.action-btn` (each action, `button` or `a`), `.action-label` (short label), `.action-tip` (name tooltip), `.action-feedback` (confirmation), `.contact-tile` (unchanged), `.detail-facts` (the `dl`).

- [ ] **Step 1: Write the spec file**

```ts
import { expect, type Page, test } from "@playwright/test"
import { noHorizontalScroll, settle } from "./helpers.ts"

// Spec: the detail page as one card. Every check here was run red against the C2a layout before
// the build, which proves it can fail.

type Box = {
	top: number
	bottom: number
	left: number
	right: number
	width: number
	height: number
	fits: boolean
}

// Rounded boxes, plus whether the element's own content fits inside it (no sideways overflow).
async function boxes(page: Page, selector: string): Promise<Box[]> {
	return page.locator(selector).evaluateAll((els) =>
		els.map((el) => {
			const r = el.getBoundingClientRect()
			return {
				top: Math.round(r.top),
				bottom: Math.round(r.bottom),
				left: Math.round(r.left),
				right: Math.round(r.right),
				width: Math.round(r.width),
				height: Math.round(r.height),
				fits: el.scrollWidth <= el.clientWidth + 1,
			}
		})
	)
}

async function one(page: Page, selector: string): Promise<Box> {
	const [box] = await boxes(page, selector)
	if (!box) throw new Error(`nothing matches ${selector}`)
	return box
}

const overlaps = (a: Box, b: Box) =>
	a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

const RINGSAKER = ["/resources/102", "/en/resources/102"] as const

// Icon mode: Desktop Chrome has a mouse, so from 768 px the actions are 44 px icons in the
// card's top-right corner, beside the title and never over it.
for (const width of [768, 1024, 1920]) {
	for (const path of RINGSAKER) {
		test(`icon mode at ${width} px (${path}): three 44 px actions on one line beside the title`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height: 900 })
			await page.goto(path)
			await settle(page)
			const h1 = await one(page, "h1")
			const group = await one(page, ".detail-actions")
			const buttons = await boxes(page, ".action-btn")
			expect(buttons).toHaveLength(3)
			expect(overlaps(group, h1)).toBe(false)
			expect(Math.abs(group.top - h1.top)).toBeLessThanOrEqual(1)
			for (const b of buttons) {
				expect(b.width).toBe(44)
				expect(b.height).toBe(44)
			}
			expect(new Set(buttons.map((b) => b.top)).size).toBe(1)
			expect(new Set(buttons.map((b) => b.bottom)).size).toBe(1)
		})
	}
}

// Review focus 5: a larger text size on a desktop window keeps icon mode intact.
test("icon mode at 1024 px with 200 % text keeps 44 px actions clear of the title", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1024, height: 900 })
	await page.goto("/resources/102")
	await page.addStyleTag({ content: "html { font-size: 200% }" })
	await page.evaluate(() => document.fonts.ready)
	const h1 = await one(page, "h1")
	const group = await one(page, ".detail-actions")
	expect(overlaps(group, h1)).toBe(false)
	for (const b of await boxes(page, ".action-btn")) {
		expect(b.width).toBe(44)
		expect(b.height).toBe(44)
	}
	expect(await noHorizontalScroll(page)).toBe(true)
})

// Labelled mode on a phone: three buttons in a row under the title, one width, one height of at
// least 56 px, one bottom edge. Every action and every tile is at least 44 px tall. The website
// and "Del av" links are text links in a line of text (WCAG 2.5.8 exempts them).
for (const path of RINGSAKER) {
	test(`labelled mode at 375 px (${path}): three equal buttons under the title`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: 375, height: 900 })
		await page.goto(path)
		await settle(page)
		const h1 = await one(page, "h1")
		const buttons = await boxes(page, ".action-btn")
		expect(buttons).toHaveLength(3)
		expect(new Set(buttons.map((b) => b.width)).size).toBe(1)
		expect(new Set(buttons.map((b) => b.height)).size).toBe(1)
		expect(new Set(buttons.map((b) => b.bottom)).size).toBe(1)
		expect(buttons[0]?.height).toBeGreaterThanOrEqual(56)
		expect(buttons[0]?.top).toBeGreaterThanOrEqual(h1.bottom)
		for (const label of await page.locator(".action-label").all()) await expect(label).toBeVisible()
		for (const c of await boxes(page, ".detail-card .action-btn, .detail-card .contact-tile")) {
			expect(c.height).toBeGreaterThanOrEqual(44)
		}
	})
}

// Reflow: nothing scrolls sideways, and the tiles, the facts and the actions stay inside the card.
for (const [label, width, fontSize] of [
	["320 px", 320, "100%"],
	["200 % text at 375 px", 375, "200%"],
] as const) {
	for (const path of ["/resources/1", ...RINGSAKER]) {
		test(`the card reflows at ${label} (${path})`, async ({ page }) => {
			await page.setViewportSize({ width, height: 900 })
			await page.goto(path)
			await page.addStyleTag({ content: `html { font-size: ${fontSize} }` })
			await page.evaluate(() => document.fonts.ready)
			expect(await noHorizontalScroll(page)).toBe(true)
			const card = await one(page, "article.detail-card")
			const inner = await boxes(
				page,
				".detail-card .contact-tile, .detail-card .detail-facts dd, .detail-card .action-btn"
			)
			expect(inner.length).toBeGreaterThan(0)
			for (const b of inner) {
				expect(b.left).toBeGreaterThanOrEqual(card.left)
				expect(b.right).toBeLessThanOrEqual(card.right)
				expect(b.fits).toBe(true)
			}
		})
	}
}

// Below 768 px each tile is as tall as its own content: at 200 % text Ringsaker's email tile
// wraps and the phone tile does not stretch to match it.
test("below 768 px a tile is as tall as its own content (id 102, 200 % text)", async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 900 })
	await page.goto("/resources/102")
	await page.addStyleTag({ content: "html { font-size: 200% }" })
	await page.evaluate(() => document.fonts.ready)
	const tiles = await boxes(page, ".contact-tile")
	expect(tiles).toHaveLength(2)
	expect(tiles[0]?.height).toBeLessThan(tiles[1]?.height ?? 0)
})

// The tooltip: hover and keyboard focus show the full name, Escape hides it, it stays inside the
// card, and the pointer can move onto it without it closing (WCAG 1.4.13).
test("at 1024 px the tooltips show on hover and focus, close on Escape and stay in the card", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1024, height: 900 })
	await page.goto("/resources/102")
	await settle(page)
	const card = await one(page, "article.detail-card")
	const buttons = page.locator(".action-btn")
	const names = ["Kopier nummer", /^(Del|Kopier lenke)$/, "Meld feil i oppføringen"] as const
	for (const [i, name] of names.entries()) {
		const button = buttons.nth(i)
		const tip = button.locator(".action-tip")
		await button.hover()
		await expect(tip).toBeVisible()
		await expect(tip).toHaveText(name)
		const t = await tip.boundingBox()
		const b = await button.boundingBox()
		if (!t || !b) throw new Error("no box")
		expect(t.y).toBeGreaterThanOrEqual(b.y + b.height)
		expect(t.x).toBeGreaterThanOrEqual(card.left)
		expect(t.x + t.width).toBeLessThanOrEqual(card.right)
		// Down across the 6 px gap and onto the bubble: it stays open.
		await page.mouse.move(b.x + b.width / 2, b.y + b.height + 3)
		await page.mouse.move(t.x + t.width - 4, t.y + t.height / 2)
		await expect(tip).toBeVisible()
	}
	await page.keyboard.press("Escape")
	await expect(buttons.nth(2).locator(".action-tip")).toBeHidden()
	await page.mouse.move(10, 890)
	await buttons.nth(0).focus()
	await page.keyboard.press("Tab")
	await expect(buttons.nth(1).locator(".action-tip")).toBeVisible()
})

test("Desktop Chrome at 1024 px gets icon mode: labels hidden, 44 px buttons", async ({ page }) => {
	await page.setViewportSize({ width: 1024, height: 900 })
	await page.goto("/resources/102")
	await settle(page)
	await expect(page.locator(".action-btn")).toHaveCount(3)
	for (const label of await page.locator(".action-label").all()) await expect(label).toBeHidden()
	for (const b of await boxes(page, ".action-btn")) expect(b.width).toBe(44)
})

// The confirmation sits inside its button, over the content below it. A tap there must reach
// that content, not copy again. Copy either succeeds or fails here; both show a bubble.
test("at 375 px the copy confirmation lets taps through to what it covers", async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 900 })
	await page.goto("/resources/102")
	await settle(page)
	await page.locator(".action-btn").first().click()
	const bubble = page.locator(".action-feedback")
	await expect(bubble).toBeVisible()
	expect(await bubble.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("none")
})

// Forced-colors mode drops fills, so each action keeps its edge only through its border.
test("each action keeps a visible border in forced-colors mode", async ({ page }) => {
	await page.emulateMedia({ forcedColors: "active" })
	await page.setViewportSize({ width: 375, height: 900 })
	await page.goto("/resources/102")
	const borders = await page
		.locator(".action-btn")
		.evaluateAll((els) =>
			els.map(
				(el) => `${getComputedStyle(el).borderTopStyle} ${getComputedStyle(el).borderTopWidth}`
			)
		)
	expect(borders).toHaveLength(3)
	for (const b of borders) expect(b).toBe("solid 1px")
})

// A touch tablet has the room but no hover, so it gets labelled mode at any width.
test.describe("on a touch tablet", () => {
	test.use({ isMobile: true, hasTouch: true })
	test("at 1024 px the actions are labelled buttons under the title", async ({ page }) => {
		await page.setViewportSize({ width: 1024, height: 900 })
		await page.goto("/resources/102")
		await settle(page)
		const h1 = await one(page, "h1")
		const group = await one(page, ".detail-actions")
		expect(group.top).toBeGreaterThanOrEqual(h1.bottom)
		await expect(page.locator(".action-label")).toHaveCount(3)
		for (const label of await page.locator(".action-label").all()) await expect(label).toBeVisible()
	})
})
```

- [ ] **Step 2: Build the C2a site and run the new file red**

Run from `web/`:

```bash
mkdir -p public/data && cp e2e/fixtures/data/*.json public/data/ && npm run build:site && npx playwright test e2e/detail-card.spec.ts
```

Expected: every test in the file FAILS (none of the class names exist yet, and id 102 has one tile). Write the count of failed tests and one sample error per test group in the ledger. If any test passes, it cannot prove anything: rewrite it until it fails against C2a.

- [ ] **Step 3: Lint and commit**

```bash
npx biome check --write e2e/detail-card.spec.ts && npx biome ci .
git add web/e2e/detail-card.spec.ts
git commit -m "test(e2e): layout checks for the detail card, red against the C2a layout"
```

---

### Task 2: Confirm the existing suites still pass with the red file present

**Files:** none changed.

**Interfaces:**
- Consumes: Task 1.
- Produces: a recorded baseline of which e2e tests outside `detail-card.spec.ts` pass on this base, so later tasks can tell their own regressions from inherited ones.

- [ ] **Step 1: Run the rest of the e2e suite on the C2a build**

Run from `web/`: `npx playwright test $(ls e2e/*.spec.ts | grep -v detail-card)`
Expected: PASS. If a test outside the new file fails on the untouched base, record its name in the ledger as inherited (known flakes: the Hamar kommune page) and do not fix it in this PR.

---

### Task 3: The email tile and its guard

**Files:**
- Modify: `web/src/services/contactTiles.ts`
- Modify: `web/src/components/ContactTiles.tsx`
- Modify: `web/src/components/icons.tsx`
- Test: `web/tests/contactTiles.test.ts`, `web/tests/detail.test.tsx`

**Interfaces:**
- Consumes: `telHref` (`services/emergency.ts`), `safeChatUrl` (`services/helplines.ts`), `ResourceDto`.
- Produces:
  - `export function safeEmail(value: string | null): string | null`
  - `ContactTile` gains `| { kind: "email"; key: string; address: string; href: string }`, key `email-<id>`, `href` `mailto:<address>`.
  - `export function MailIcon({ className }: IconProps)` in `icons.tsx`.

- [ ] **Step 1: Write the failing unit tests**

Append to `web/tests/contactTiles.test.ts` (update the import line to `import { contactTiles, safeEmail } from "../src/services/contactTiles.ts"`):

```ts
test("the service's own email is the last tile", () => {
	const parent = makeResource({
		id: 102,
		name: "Ringsaker",
		phone: "62 33 52 20",
		email: "postmottak.psykisk.helse@ringsaker.kommune.no",
	})
	const tiles = contactTiles(parent, [])
	expect(tiles.map((t) => t.kind)).toEqual(["phone", "email"])
	expect(tiles.at(-1)).toEqual({
		kind: "email",
		key: "email-102",
		address: "postmottak.psykisk.helse@ringsaker.kommune.no",
		href: "mailto:postmottak.psykisk.helse@ringsaker.kommune.no",
	})
})

test("the email tile comes after every child tile, and a child's email never becomes one", () => {
	const parent = makeResource({ id: 1, name: "P", phone: "116 123", email: "post@p.no" })
	const children = [
		makeResource({ id: 5, name: "Chat child", parentId: 1, chatUrl: "https://c.test/" }),
		makeResource({ id: 6, name: "Phone child", parentId: 1, phone: "800 00 000", email: "c@c.no" }),
	]
	expect(contactTiles(parent, children).map((t) => t.key)).toEqual([
		"phone-1",
		"chat-5",
		"phone-6",
		"email-1",
	])
})

test("no email means no email tile", () => {
	expect(contactTiles(makeResource({ id: 3, name: "X", phone: "1" }), []).map((t) => t.kind)).toEqual([
		"phone",
	])
})

test.each([
	"a@b.no?bcc=x@y.no",
	"a@b.no,c@d.no",
	"javascript:x@y.no",
	"a b@c.no",
	"a@b.no;c@d.no",
	"a@b.no%3Fbcc=x@y.no",
	"a@b@c.no",
	"@b.no",
	"a@b",
	"a@.no",
	"a@b.no.",
	"",
])("safeEmail refuses %j", (value) => {
	expect(safeEmail(value)).toBeNull()
})

test.each([
	"postmottak.psykisk.helse@ringsaker.kommune.no",
	"Ola+Varde@Post.Example-Kommune.no",
	"post@nav.no",
])("safeEmail accepts %j unchanged", (value) => {
	expect(safeEmail(value)).toBe(value)
})

test("safeEmail of null is null, and an unsafe address gets no tile", () => {
	expect(safeEmail(null)).toBeNull()
	const row = makeResource({ id: 4, name: "Y", email: "a@b.no?bcc=x@y.no" })
	expect(contactTiles(row, [])).toEqual([])
})
```

Append to `web/tests/detail.test.tsx`:

```ts
test("the email is the last contact tile, named E-post, and not a row in the facts", async () => {
	await renderDetail({ ...detail, email: "post@krisesenter.example.no" })
	const block = screen.getByRole("region", { name: "Kontakt" })
	const tiles = within(block).getAllByRole("link")
	const email = tiles.at(-1) as HTMLElement
	expect(email).toHaveAccessibleName("E-post, post@krisesenter.example.no")
	expect(email).toHaveAttribute("href", "mailto:post@krisesenter.example.no")
	expect(email).not.toHaveAttribute("rel")
	expect(email).not.toHaveAttribute("target")
	expect([...document.querySelectorAll("dt")].map((dt) => dt.textContent)).not.toContain("E-post")
})

test("an unsafe email gets no tile and no link anywhere", async () => {
	await renderDetail({ ...detail, email: "a@b.no?bcc=x@y.no" })
	expect(document.querySelector('a[href^="mailto:a@b.no"]')).toBeNull()
})

test("in English the email tile is named Email", async () => {
	stubDataFiles({ resources: [{ ...detail, email: "post@example.no" }] })
	render(
		<LanguageProvider lang="en">
			<AnnouncerProvider>
				<ResourceDetail id={12} />
			</AnnouncerProvider>
		</LanguageProvider>
	)
	const block = await screen.findByRole("region", { name: "Contact" })
	expect(within(block).getAllByRole("link").at(-1)).toHaveAccessibleName("Email, post@example.no")
})
```

- [ ] **Step 2: Run the tests to see them fail**

Run from `web/`: `npx vitest run tests/contactTiles.test.ts tests/detail.test.tsx`
Expected: FAIL. `safeEmail` is not exported; the email tile tests find no email tile; "an unsafe email gets no tile" fails because today's `dd` renders `mailto:a@b.no?bcc=x@y.no`.

- [ ] **Step 3: Implement the guard and the tile**

In `web/src/services/contactTiles.ts`, extend the type and the builder:

```ts
export type ContactTile =
	| {
			kind: "phone"
			key: string
			name: string | null
			phone: string
			menuOption: number | null
			alwaysOpen: boolean
			href: string
	  }
	| { kind: "chat"; key: string; name: string | null; href: string }
	| { kind: "email"; key: string; address: string; href: string }
```

Change the end of `contactTiles` so the service's own email comes last:

```ts
	const email = safeEmail(resource.email)
	return [
		...own,
		...childTiles.filter((t) => t.kind === "chat"),
		...childTiles.filter((t) => t.kind === "phone"),
		...(email
			? [{ kind: "email" as const, key: `email-${resource.id}`, address: email, href: `mailto:${email}` }]
			: []),
	]
```

Update the comment above `contactTiles` to say the service's own email comes last and children's emails stay on their own pages. Add the guard below `phoneTile`:

```ts
// One plain address and nothing else (spec: the email tile). In a mailto link "?" starts the
// headers, so "a@b.no?bcc=x@y.no" would add a hidden recipient; "," and ";" add a second
// recipient, ":" makes a scheme, and "%" could encode any of them. Quotes, brackets, slashes and
// "#" have no place in a plain address either. Anything else gets no tile and no link.
const NOT_IN_A_PLAIN_ADDRESS = /[\s?&,;:%#/\\<>"'()[\]]/

export function safeEmail(value: string | null): string | null {
	if (!value || NOT_IN_A_PLAIN_ADDRESS.test(value)) return null
	const [local, domain, ...rest] = value.split("@")
	if (rest.length > 0 || !local || !domain) return null
	const labels = domain.split(".")
	if (labels.length < 2 || labels.some((label) => label === "")) return null
	return value
}
```

If Biome flags an escape in the regex, take its suggested fix and rerun the tests.

- [ ] **Step 4: Draw the mail icon**

Append to `web/src/components/icons.tsx`:

```tsx
// An envelope: a rounded rectangle with the flap drawn as a shallow V from the top corners.
export function MailIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<rect x="3" y="5" width="18" height="14" rx="2" />
			<path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
		</Svg>
	)
}
```

- [ ] **Step 5: Render the email tile and fix the row heights**

Replace the body of `web/src/components/ContactTiles.tsx` with this (the comment block above the function stays, with "phone and chat" changed to "phone, chat and email"):

```tsx
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import type { ContactTile } from "../services/contactTiles.ts"
import { ChatIcon, MailIcon, PhoneIcon } from "./icons.tsx"

type Translate = ReturnType<typeof useTranslation>

const icons = { phone: PhoneIcon, chat: ChatIcon, email: MailIcon } as const

function tileLabel(tile: ContactTile, t: Translate): string {
	if (tile.kind === "email") return t("detail.email")
	return tile.name ?? t(tile.kind === "phone" ? "card.call" : "detail.chat")
}

function tileValue(tile: ContactTile, t: Translate): string {
	if (tile.kind === "email") return tile.address
	if (tile.kind === "chat") return t("detail.tile.openChat")
	return tile.menuOption === null
		? tile.phone
		: `${tile.phone}, ${t("detail.tile.menuOption").replace("{n}", String(tile.menuOption))}`
}

export function ContactTiles({ tiles }: { tiles: ContactTile[] }) {
	const t = useTranslation()
	if (tiles.length === 0) return null
	return (
		<section aria-labelledby="contact">
			<h2 id="contact" className="visually-hidden">
				{t("detail.contactHeading")}
			</h2>
			{/* One column below 768 px, each tile as tall as its own content. Side by side from
			    768 px, where a row shares one height. */}
			<ul className="grid gap-3 md:auto-rows-fr md:grid-cols-2">
				{tiles.map((tile) => {
					const Icon = icons[tile.kind]
					return (
						<li key={tile.key}>
							<a
								href={tile.href}
								className="contact-tile"
								rel={tile.kind === "chat" ? "noopener noreferrer" : undefined}
							>
								<span className="contact-tile-icon">
									<Icon />
								</span>
								<span className="grid min-w-0">
									<span className="contact-tile-label block text-sm text-muted">
										{tileLabel(tile, t)}
										{tile.kind === "phone" && tile.alwaysOpen && (
											<>
												<span className="hidden-inline">,</span> <span aria-hidden="true">·</span>{" "}
												{t("detail.tile.alwaysOpen")}
											</>
										)}
										<span className="hidden-inline">,</span>
									</span>
									{/* A real space between the lines: name computation trims each span, so without it
									    the label's comma runs into the value. */}{" "}
									<span className="contact-tile-value block font-semibold">{tileValue(tile, t)}</span>
								</span>
							</a>
						</li>
					)
				})}
			</ul>
		</section>
	)
}
```

In `web/src/components/ResourceDetail.tsx`, delete the whole `{resource.email && ( … )}` block from the `dl` (the email is a tile now).

- [ ] **Step 6: Run the tests to see them pass**

Run from `web/`: `npx vitest run tests/contactTiles.test.ts tests/detail.test.tsx`
Expected: PASS, the C2a tile tests included.

- [ ] **Step 7: Lint, typecheck and commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add web/src/services/contactTiles.ts web/src/components/ContactTiles.tsx web/src/components/icons.tsx web/src/components/ResourceDetail.tsx web/tests/contactTiles.test.ts web/tests/detail.test.tsx
git commit -m "feat(web): make the service's email the last contact tile, behind a strict address guard"
```

---

### Task 4: The card and its sections

**Files:**
- Modify: `web/src/components/ResourceDetail.tsx`
- Modify: `web/src/components/ContactTiles.tsx` (visible `h2`, section class)
- Modify: `web/src/styles/main.css`
- Modify: `web/src/i18n/nb.json`, `web/src/i18n/en.json`
- Test: `web/tests/detail.test.tsx`

**Interfaces:**
- Consumes: Task 3's `ContactTiles`; `safeChatUrl` (`services/helplines.ts`), reused as the https guard for the website link.
- Produces: `article.detail-card` with `header.detail-head` holding `div.detail-title` (h1, badges, region, "Del av", fallback note); the copy, share and report controls stay where C2a had them, inside `header.detail-head` after `div.detail-title`, until Task 5 replaces them. CSS classes `.detail-section`, `.section-label`, `.detail-head`, `.detail-title`, `.detail-facts`. i18n keys `detail.aboutHeading`, `detail.practicalHeading`.

- [ ] **Step 1: Write the failing tests**

Append to `web/tests/detail.test.tsx`:

```ts
const ringsaker: ResourceDto = {
	...detail,
	name: "Psykisk helse- og rustjenester, Ringsaker kommune",
	description: "Kommunens tilbud til voksne.",
	openingHours: "Kan kontaktes i tidsrommet 08-15.30",
	address: "Brugata 3, 2380 Brumunddal",
	email: "postmottak.psykisk.helse@ringsaker.kommune.no",
	website: "https://www.ringsaker.kommune.no/",
}

test("the card has an h1 and three h2 sections in order, each a region named by its heading", async () => {
	await renderDetail(ringsaker)
	const card = screen.getByRole("article")
	expect(within(card).getByRole("heading", { level: 1 })).toHaveTextContent(ringsaker.name)
	expect(within(card).getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([
		"Kontakt",
		"Om tjenesten",
		"Praktisk informasjon",
	])
	for (const name of ["Kontakt", "Om tjenesten", "Praktisk informasjon"]) {
		expect(within(card).getByRole("region", { name })).toBeInTheDocument()
	}
})

test("Praktisk informasjon lists hours, address and website in that order, each label beside its value", async () => {
	await renderDetail(ringsaker)
	const facts = screen.getByRole("region", { name: "Praktisk informasjon" })
	expect([...facts.querySelectorAll("dt")].map((dt) => dt.textContent)).toEqual([
		"Åpningstider",
		"Adresse",
		"Nettside",
	])
	for (const pair of facts.querySelectorAll("dl > div")) {
		expect(pair.querySelectorAll("dt")).toHaveLength(1)
		expect(pair.querySelectorAll("dd")).toHaveLength(1)
	}
})

test("the footer holds last verified, inside the card, with no heading", async () => {
	await renderDetail(ringsaker)
	const footer = screen.getByText(/Sist bekreftet/).closest("footer")
	expect(footer).not.toBeNull()
	expect(footer).toHaveTextContent("Sist bekreftet 2026-08-13")
	expect(screen.getByRole("article")).toContainElement(footer)
	expect(within(footer as HTMLElement).queryByRole("heading")).toBeNull()
})

test.each(["", "   "])("a blank description (%j) leaves Om tjenesten out", async (description) => {
	await renderDetail({ ...ringsaker, description })
	expect(screen.queryByRole("region", { name: "Om tjenesten" })).toBeNull()
})

test("no hours, address or website leaves Praktisk informasjon out", async () => {
	await renderDetail({ ...ringsaker, openingHours: null, address: null, website: null })
	expect(screen.queryByRole("region", { name: "Praktisk informasjon" })).toBeNull()
})

test("no tiles leaves Kontakt out, and the other sections stay", async () => {
	await renderDetail({ ...ringsaker, phone: null, email: null, chatUrl: null })
	expect(screen.queryByRole("region", { name: "Kontakt" })).toBeNull()
	expect(screen.getByRole("region", { name: "Om tjenesten" })).toBeInTheDocument()
})

function renderEnglish(resource: ResourceDto) {
	stubDataFiles({ resources: [resource] })
	render(
		<LanguageProvider lang="en">
			<AnnouncerProvider>
				<ResourceDetail id={12} />
			</AnnouncerProvider>
		</LanguageProvider>
	)
	return screen.findByRole("heading", { level: 1 })
}

test("on /en a fallback description is marked as Norwegian, and only the description", async () => {
	await renderEnglish({ ...ringsaker, isFallbackTranslation: true })
	expect(screen.getByText("Kommunens tilbud til voksne.")).toHaveAttribute("lang", "nb")
	expect(screen.getByRole("heading", { level: 1 })).not.toHaveAttribute("lang")
	expect(screen.getByRole("region", { name: "About the service" })).toBeInTheDocument()
	expect(screen.getByRole("region", { name: "Practical details" })).toBeInTheDocument()
})

test("on /en a translated description carries no lang", async () => {
	await renderEnglish(ringsaker)
	expect(screen.getByText("Kommunens tilbud til voksne.")).not.toHaveAttribute("lang")
})

test("a website that is not https shows as text, never as a link", async () => {
	await renderDetail({ ...ringsaker, website: "javascript:alert(1)" })
	const facts = screen.getByRole("region", { name: "Praktisk informasjon" })
	expect(within(facts).queryByRole("link")).toBeNull()
	expect(facts).toHaveTextContent("javascript:alert(1)")
})

test("the back link stays outside the card", async () => {
	await renderDetail(ringsaker)
	const back = screen.getByRole("link", { name: "Tilbake til resultater" })
	expect(screen.getByRole("article")).not.toContainElement(back)
})
```

- [ ] **Step 2: Run the tests to see them fail**

Run from `web/`: `npx vitest run tests/detail.test.tsx`
Expected: FAIL. Only "Kontakt" exists as an `h2`, there is no `footer`, and the `article` today wraps the back link.

- [ ] **Step 3: Add the copy**

In `web/src/i18n/nb.json`, after `"detail.contactHeading": "Kontakt",` add:

```json
	"detail.aboutHeading": "Om tjenesten",
	"detail.practicalHeading": "Praktisk informasjon",
```

In `web/src/i18n/en.json`, after `"detail.contactHeading": "Contact",` add:

```json
	"detail.aboutHeading": "About the service",
	"detail.practicalHeading": "Practical details",
```

- [ ] **Step 4: Build the card in `ResourceDetail.tsx`**

Replace everything from `const backLabel = t("detail.back")` to the end of the component with:

```tsx
	const backLabel = t("detail.back")
	const description = resource.description.trim()
	// The same https guard as chat links: every website in the data is https, and anything else
	// (a typo, a javascript: value) shows as text and never becomes a link.
	const website = safeChatUrl(resource.website)
	const hasFacts = Boolean(resource.openingHours || resource.address || resource.website)

	return (
		<div className="grid gap-6">
			<PageHead
				title={`${resource.name} – Varde`}
				description={metaDescription(resource.description)}
				path={`/resources/${resource.id}`}
			/>
			{cameFromResults ? (
				<button
					type="button"
					className="justify-self-start text-accent underline"
					onClick={() => window.history.back()}
				>
					{backLabel}
				</button>
			) : (
				<Link to="/sok" className="justify-self-start text-accent underline">
					{backLabel}
				</Link>
			)}
			{/* Everything about the service sits in this one card (spec: the detail page as one
			    card). DOM order is the reading and focus order at every width. */}
			<article className="detail-card grid gap-6 rounded-xl border border-border bg-surface p-5 md:p-8">
				<header className="detail-head">
					<div className="detail-title grid min-w-0 gap-3">
						<h1 ref={heading} tabIndex={-1} className="text-3xl wrap-anywhere md:text-5xl">
							{resource.name}
						</h1>
						<ResourceBadges resource={resource} />
						<p className="text-muted">
							{resource.isNational ? t("detail.nationalService") : resource.municipalityName}
						</p>
						{family.parent && (
							<p className="text-sm text-muted">
								{partOfBefore}
								<Link to={`/resources/${family.parent.id}`} className="text-accent underline">
									{family.parent.name}
								</Link>
								{partOfAfter}
							</p>
						)}
						{resource.isFallbackTranslation && (
							<p className="text-sm text-muted">{t("card.fallback")}</p>
						)}
					</div>
					{/* C2a's copy, share and report controls, unchanged until the action group replaces them. */}
					<div className="grid gap-3">
						{((resource.phone && canCopy) || capability !== "none") && (
							<div className="flex flex-wrap items-center gap-2">
								{resource.phone && canCopy && (
									<button
										type="button"
										className="btn-secondary"
										onClick={() => resource.phone && onCopyPhone(resource.phone)}
									>
										{t("detail.copyPhone")}
									</button>
								)}
								{capability !== "none" && (
									<button type="button" className="btn-secondary" onClick={onShare}>
										{t(capability === "share" ? "detail.share" : "detail.copyLink")}
									</button>
								)}
							</div>
						)}
						<a href={reportHref(resource.id, resource.name)} className="text-sm text-accent underline">
							{t("report.link")}
						</a>
					</div>
				</header>
				<ContactTiles tiles={tiles} />
				{description && (
					<section aria-labelledby="service-about" className="detail-section grid gap-3">
						<h2 id="service-about" className="section-label">
							{t("detail.aboutHeading")}
						</h2>
						{/* A fallback row on /en is Norwegian text, so a screen reader must read it as
						    Norwegian (WCAG 3.1.2). The title and hours are short, so only this gets lang. */}
						<p
							className="max-w-prose"
							lang={resource.isFallbackTranslation && lang === "en" ? "nb" : undefined}
						>
							{description}
						</p>
					</section>
				)}
				{hasFacts && (
					<section aria-labelledby="service-practical" className="detail-section grid gap-3">
						<h2 id="service-practical" className="section-label">
							{t("detail.practicalHeading")}
						</h2>
						{/* Each label and value is a div, so on a phone a label sits right above its own
						    value. From 768 px the divs step aside and the dl is a two-column grid. */}
						<dl className="detail-facts">
							{resource.openingHours && (
								<div>
									<dt>{t("card.hours")}</dt>
									<dd>{resource.openingHours}</dd>
								</div>
							)}
							{resource.address && (
								<div>
									<dt>{t("detail.address")}</dt>
									<dd>{resource.address}</dd>
								</div>
							)}
							{resource.website && (
								<div>
									<dt>{t("detail.website")}</dt>
									<dd className="wrap-anywhere">
										{website ? (
											<a href={website} rel="noopener noreferrer" className="text-accent underline">
												{website}
											</a>
										) : (
											resource.website
										)}
									</dd>
								</div>
							)}
						</dl>
					</section>
				)}
				{/* A footer inside an article is not a contentinfo landmark, so the site footer stays
				    the only one. No heading: a heading over one date is noise in the heading list. */}
				<footer className="detail-section text-sm text-muted">
					{t("card.lastVerified")} {resource.lastVerified}
				</footer>
			</article>
		</div>
	)
}
```

Notes for the implementer:
- `lang` is already in scope from `const { lang } = useLanguage()`.
- Add `import { safeChatUrl } from "../services/helplines.ts"`.
- The description paragraph renders the trimmed text. The meta description still reads `resource.description`, unchanged.
- The C2a comment `{/* Every way to reach the service is a tile … */}` goes; the tiles now have their own section.

- [ ] **Step 5: Make the Kontakt heading visible and give it the section style**

In `web/src/components/ContactTiles.tsx` change the `section` and `h2`:

```tsx
		<section aria-labelledby="contact" className="detail-section grid gap-3">
			<h2 id="contact" className="section-label">
				{t("detail.contactHeading")}
			</h2>
```

Update the component comment: the `h2` is now visible ("The h2 is a visible label and puts the block in the heading list.").

- [ ] **Step 6: Add the CSS**

In `web/src/styles/main.css`, change the selector of the existing `.helpline-group` rule to share it, and extend its comment:

```css
	/* The age-group labels on the landing and the section headings on the detail page: small,
	   uppercase and muted, so they read as labels beside the bold names and body text, by size,
	   weight and colour. */
	.helpline-group,
	.section-label {
		color: var(--muted);
		font-size: 0.75rem;
		font-weight: 400;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
```

At the end of `@layer components`, after `.contact-tile-icon`, add:

```css
	/* The detail page card (spec: the detail page as one card). Each section after the head starts
	   with a 1 px line: the card's gap-6 puts 1.5rem above it and this puts 1.5rem below. */
	.detail-section {
		border-block-start: 1px solid var(--border);
		padding-block-start: 1.5rem;
	}
	.detail-head {
		display: grid;
		gap: 1rem;
	}
	/* Praktisk informasjon. On a phone each label sits over its value, 0.25rem apart, with 1rem
	   between pairs, so it is clear which label belongs to which value. From 768 px it is the C2a
	   two-column grid. minmax(0, 1fr), not 1fr, so a long URL can shrink the column and wrap. */
	.detail-facts {
		display: grid;
		gap: 1rem;
	}
	.detail-facts > div {
		display: grid;
		gap: 0.25rem;
	}
	.detail-facts dt {
		color: var(--muted);
	}
	@media (min-width: 768px) {
		.detail-facts {
			grid-template-columns: max-content minmax(0, 1fr);
			column-gap: 2rem;
			row-gap: 0.75rem;
		}
		.detail-facts > div {
			display: contents;
		}
	}
```

- [ ] **Step 7: Run the tests to see them pass**

Run from `web/`: `npx vitest run tests/detail.test.tsx`
Expected: PASS, the C2a detail tests included (the copy, share and report controls are still where C2a had them).

- [ ] **Step 8: Lint, typecheck, the whole unit suite, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add web/src/components/ResourceDetail.tsx web/src/components/ContactTiles.tsx web/src/styles/main.css web/src/i18n/nb.json web/src/i18n/en.json web/tests/detail.test.tsx
git commit -m "feat(web): put everything about a service in one card with Kontakt, Om tjenesten and Praktisk informasjon"
```

---

### Task 5: The corner actions: one set of controls, two modes, no jump on load

**Files:**
- Create: `web/src/components/DetailActions.tsx`
- Modify: `web/src/components/ResourceDetail.tsx`
- Modify: `web/src/components/icons.tsx`
- Modify: `web/src/styles/main.css`
- Modify: `web/src/i18n/nb.json`, `web/src/i18n/en.json`
- Create: `web/tests/detailActions.test.tsx`
- Modify: `web/tests/detail.test.tsx`, `web/tests/hydration.test.tsx`

**Interfaces:**
- Consumes: `copyText`, `reportHref`, `shareCapability`, `shareResource`, `ShareCapability` (`services/contactActions.ts`); `useAnnounce` (`StatusRegion.tsx`); `header.detail-head` from Task 4.
- Produces:
  - `export function DetailActions({ id, name, phone }: { id: number; name: string; phone: string | null })`, rendered as the last child of `header.detail-head`.
  - Markup per action: `.action-btn` (`button`, or `a` for report) with `aria-label`, an icon, `span.action-label[aria-hidden]` and `span.action-tip[aria-hidden]`. Task 6 adds `span.action-feedback`.
  - `CopyIcon`, `ShareIcon`, `FlagIcon` in `icons.tsx`. i18n key `report.short`.

- [ ] **Step 1: Write the failing tests**

Create `web/tests/detailActions.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { ResourceDetail } from "../src/components/ResourceDetail.tsx"
import { AnnouncerProvider } from "../src/components/StatusRegion.tsx"
import { type Lang, LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import { PageDataContext } from "../src/pageData.ts"
import { NO_FAMILY } from "../src/services/family.ts"
import type { ResourceDto } from "../src/types/api.ts"
import { makeResource } from "./stubData.ts"

const ringsaker: ResourceDto = makeResource({
	id: 102,
	name: "Psykisk helse- og rustjenester, Ringsaker kommune",
	description: "Kommunens tilbud.",
	phone: "62 33 52 20",
})

// jsdom ships neither navigator.share nor navigator.clipboard; each test installs what it is about.
function installNavigator(overrides: { share?: unknown; clipboard?: unknown }) {
	for (const [key, value] of Object.entries(overrides)) {
		Object.defineProperty(navigator, key, { value, configurable: true })
	}
	return () => {
		for (const key of Object.keys(overrides)) {
			delete (navigator as unknown as Record<string, unknown>)[key]
		}
	}
}
let restoreNavigator = () => {}
afterEach(() => {
	restoreNavigator()
	restoreNavigator = () => {}
})

// The prerendered path: the resource is baked in, so the page renders without a fetch.
function tree(resource: ResourceDto, lang: Lang) {
	return (
		<PageDataContext.Provider value={{ resource, family: NO_FAMILY }}>
			<LanguageProvider lang={lang}>
				<AnnouncerProvider>
					<ResourceDetail id={resource.id} />
				</AnnouncerProvider>
			</LanguageProvider>
		</PageDataContext.Provider>
	)
}

function renderBaked(resource: ResourceDto = ringsaker, lang: Lang = "nb") {
	return render(tree(resource, lang))
}

const actions = () => [...document.querySelectorAll<HTMLElement>(".detail-head .action-btn")]
const shortLabels = () => actions().map((a) => a.querySelector(".action-label")?.textContent)
const tips = () => actions().map((a) => a.querySelector(".action-tip")?.textContent)

test("with share and clipboard the head ends with copy, share and report, named in full", () => {
	restoreNavigator = installNavigator({
		share: vi.fn().mockResolvedValue(undefined),
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
	})
	renderBaked()
	expect(actions().map((a) => a.getAttribute("aria-label"))).toEqual([
		"Kopier nummer",
		"Del",
		"Meld feil i oppføringen",
	])
	expect(shortLabels()).toEqual(["Kopier nummer", "Del", "Meld feil"])
	expect(tips()).toEqual(["Kopier nummer", "Del", "Meld feil i oppføringen"])
	for (const a of actions()) {
		expect(a.querySelector(".action-label")).toHaveAttribute("aria-hidden", "true")
		expect(a.querySelector(".action-tip")).toHaveAttribute("aria-hidden", "true")
		expect(a.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
	}
	// The group is the last thing in the head, after the title block.
	expect(document.querySelector(".detail-head")?.lastElementChild).toHaveClass("detail-actions")
	expect(document.querySelector(".detail-actions")).not.toHaveAttribute("role")
})

test("in English the names are Copy number, Share and Report an error in this listing", () => {
	restoreNavigator = installNavigator({
		share: vi.fn().mockResolvedValue(undefined),
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
	})
	renderBaked(ringsaker, "en")
	expect(actions().map((a) => a.getAttribute("aria-label"))).toEqual([
		"Copy number",
		"Share",
		"Report an error in this listing",
	])
	expect(shortLabels()).toEqual(["Copy number", "Share", "Report"])
})

test("each short label is contained in its accessible name (WCAG 2.5.3), in both languages", () => {
	restoreNavigator = installNavigator({
		share: vi.fn().mockResolvedValue(undefined),
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
	})
	for (const lang of ["nb", "en"] as const) {
		const { unmount } = renderBaked(ringsaker, lang)
		for (const a of actions()) {
			const label = a.querySelector(".action-label")?.textContent ?? ""
			expect(a.getAttribute("aria-label")).toContain(label)
		}
		unmount()
	}
})

test("clipboard without share relabels share as Kopier lenke, label and tooltip too", () => {
	restoreNavigator = installNavigator({ clipboard: { writeText: vi.fn() } })
	renderBaked()
	const share = screen.getByRole("button", { name: "Kopier lenke" })
	expect(share.querySelector(".action-label")).toHaveTextContent("Kopier lenke")
	expect(share.querySelector(".action-tip")).toHaveTextContent("Kopier lenke")
})

test("the report action is the existing mailto link, as a link", () => {
	renderBaked()
	const report = screen.getByRole("link", { name: "Meld feil i oppføringen" })
	expect(report).toHaveClass("action-btn")
	expect(report.getAttribute("href")).toMatch(/^mailto:varde\.purely709@passmail\.com\?subject=/)
})

test("a service with no phone has two actions, share and report, and no empty slot", () => {
	restoreNavigator = installNavigator({
		share: vi.fn().mockResolvedValue(undefined),
		clipboard: { writeText: vi.fn() },
	})
	renderBaked({ ...ringsaker, phone: null })
	expect(actions().map((a) => a.getAttribute("aria-label"))).toEqual([
		"Del",
		"Meld feil i oppføringen",
	])
	expect(document.querySelector(".detail-actions")?.children).toHaveLength(2)
})
```

In `web/tests/hydration.test.tsx` add:

```ts
// Spec: Hydration. The prerender shows all three actions, with share labelled Del, so the row
// does not jump from one button to three on load.
test("the prerendered detail page holds all three actions", async () => {
	const { html } = await render("/resources/12", { resource })
	expect(html).toContain('aria-label="Kopier nummer"')
	expect(html).toContain('aria-label="Del"')
	expect(html).toContain('aria-label="Meld feil i oppføringen"')
})
```

The existing `"/resources/12 hydrates without a recoverable error"` and `"/en/resources/12 …"` cases stay; they prove the first client render matches this markup.

- [ ] **Step 2: Run the tests to see them fail**

Run from `web/`: `npx vitest run tests/detailActions.test.tsx tests/hydration.test.tsx`
Expected: FAIL. There is no `.action-btn`, and the prerendered HTML has no copy or share button (C2a renders them only after mount).

- [ ] **Step 3: Add the copy**

`web/src/i18n/nb.json`, after `"report.link": "Meld feil i oppføringen",`: `"report.short": "Meld feil",`
`web/src/i18n/en.json`, after `"report.link": "Report an error in this listing",`: `"report.short": "Report",`
(Mind the trailing comma: if `report.link` is the last key in its object, put the comma on `report.link` and none on the new line.)

- [ ] **Step 4: Draw the three icons**

Append to `web/src/components/icons.tsx`:

```tsx
// The detail page's actions. Each sits in a control whose aria-label names it.

// Two offset rounded squares: the front one whole, the back one showing only its top-left edge.
export function CopyIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<rect x="8" y="8" width="12" height="12" rx="2" />
			<path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
		</Svg>
	)
}

// An arrow rising out of an open box.
export function ShareIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<path d="M12 15V3M7.5 7.5L12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
		</Svg>
	)
}

// A pole with a flag whose free edge is notched.
export function FlagIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<path d="M5 21V4M5 4h13l-3.5 4.5L18 13H5" />
		</Svg>
	)
}
```

- [ ] **Step 5: Create `DetailActions.tsx`**

```tsx
import { useEffect, useState } from "react"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import {
	copyText,
	reportHref,
	type ShareCapability,
	shareCapability,
	shareResource,
} from "../services/contactActions.ts"
import { CopyIcon, FlagIcon, ShareIcon } from "./icons.tsx"
import { useAnnounce } from "./StatusRegion.tsx"

// Copy number, share and report (spec: Corner actions, option D). One set of controls serves
// every width; main.css shows them as labelled buttons under the title, or as 44 px icons with
// tooltips in the card's top-right corner when there is room and a mouse. The full name is the
// aria-label, so the short label and the tooltip are aria-hidden and a screen reader hears each
// name once. The group has no role: three controls are quicker with Tab than a toolbar.
export function DetailActions({
	id,
	name,
	phone,
}: {
	id: number
	name: string
	phone: string | null
}) {
	const t = useTranslation()
	const announce = useAnnounce()

	// The prerender shows all three actions, with share labelled Del, so the row never jumps from
	// one button to three on load (spec: Hydration). After mount this corrects the rare browser
	// that has no clipboard or no share sheet. The server and first client render still match.
	const [capability, setCapability] = useState<ShareCapability>("share")
	const [canCopy, setCanCopy] = useState(true)
	// Share/copy support is a fact about this browser, not this navigation, so this runs on mount.
	useEffect(() => {
		setCapability(shareCapability(navigator))
		setCanCopy(Boolean(navigator.clipboard))
	}, [])

	// Escape closes the tooltips (WCAG 1.4.13) until the pointer enters or focus lands on an action,
	// the same pattern as the acute strip.
	const [tipsHidden, setTipsHidden] = useState(false)
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setTipsHidden(true)
		}
		document.addEventListener("keydown", onKeyDown)
		return () => document.removeEventListener("keydown", onKeyDown)
	}, [])
	const showTips = () => setTipsHidden(false)

	const onCopy = async () => {
		if (!phone) return
		const ok = await copyText(phone, navigator)
		announce(t(ok ? "detail.phoneCopied" : "detail.copyFailed"))
	}

	const onShare = async () => {
		const outcome = await shareResource({ name, phone, url: window.location.href }, navigator)
		if (outcome === "copied") announce(t("detail.linkCopied"))
		if (outcome === "failed") announce(t("detail.copyFailed"))
	}

	const copyName = t("detail.copyPhone")
	const shareName = t(capability === "share" ? "detail.share" : "detail.copyLink")
	const reportName = t("report.link")
	const hover = { onPointerEnter: showTips, onFocus: showTips }

	return (
		<div className="detail-actions" data-tips={tipsHidden ? "hidden" : undefined}>
			{phone && canCopy && (
				<button type="button" className="action-btn" aria-label={copyName} onClick={onCopy} {...hover}>
					<CopyIcon />
					<span className="action-label" aria-hidden="true">
						{copyName}
					</span>
					<span className="action-tip" aria-hidden="true">
						{copyName}
					</span>
				</button>
			)}
			{capability !== "none" && (
				<button type="button" className="action-btn" aria-label={shareName} onClick={onShare} {...hover}>
					<ShareIcon />
					<span className="action-label" aria-hidden="true">
						{shareName}
					</span>
					<span className="action-tip" aria-hidden="true">
						{shareName}
					</span>
				</button>
			)}
			<a href={reportHref(id, name)} className="action-btn" aria-label={reportName} {...hover}>
				<FlagIcon />
				<span className="action-label" aria-hidden="true">
					{t("report.short")}
				</span>
				<span className="action-tip" aria-hidden="true">
					{reportName}
				</span>
			</a>
		</div>
	)
}
```

- [ ] **Step 6: Use it in `ResourceDetail.tsx`**

- Replace the whole C2a controls block inside `header.detail-head` (the `{/* C2a's copy, share and report controls … */}` comment and the `<div className="grid gap-3">…</div>` after it) with:

```tsx
					<DetailActions id={resource.id} name={resource.name} phone={resource.phone} />
```

- Delete the `capability` and `canCopy` state, their mount effect and its comment, `onShare`, `onCopyPhone`, and the `announce` constant.
- Delete the imports that are now unused: the whole `../services/contactActions.ts` import and `useAnnounce`. Add `import { DetailActions } from "./DetailActions.tsx"`.
- Update the comment above the remaining `cameFromResults` effect: drop "Unlike the capability checks above," so it reads "This is a fact about *this navigation*."

- [ ] **Step 7: Add the two modes to `main.css`**

Replace the `.btn-secondary` rule with a shared look plus its own layout:

```css
	/* The secondary look: an outlined button on the surface. The detail page's action buttons share
	   it (spec: Corner actions) and set their own layout. */
	.btn-secondary,
	.action-btn {
		border: 1px solid var(--border);
		border-radius: 0.75rem;
		background: var(--surface);
		color: var(--text);
		font-weight: 500;
		text-decoration: none;
	}
	.btn-secondary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 44px;
		padding: 0 1rem;
	}
```

Replace the `.strip-tip` rule with a shared look plus its own position (the `@media (hover: hover) and (pointer: fine)` block after it is unchanged):

```css
	/* The look every tooltip shares: the acute strip's labels, and the detail page's action names
	   and copy confirmations. Each sets its own position. */
	.strip-tip,
	.action-tip,
	.action-feedback {
		z-index: 30;
		padding: 0.25rem 0.5rem;
		font-size: 0.8125rem;
		font-weight: 500;
		line-height: 1.5;
		color: var(--text);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.16);
	}
	/* The strip's labels as tooltips (spec: Acute strip, one line). Only where the pointer can
	   hover, so a tap on a phone dials without a tooltip. The tooltip sits inside the link right
	   below it, so the pointer can move onto it without it closing (WCAG 1.4.13). */
	.strip-tip {
		display: none;
		position: absolute;
		inset-block-start: 100%;
		inset-inline-start: 50%;
		translate: -50% 0;
		white-space: nowrap;
	}
```

The shared rule adds `line-height: 1.5`, which the strip's tip already inherits from `html`, so the strip does not change. Then, after the `.detail-facts` rules from Task 4, add:

```css
	/* Copy, share and report (spec: Corner actions, option D). Labelled mode by default: phones
	   and touch tablets have no hover to show a tooltip, so each button shows its short label
	   under the icon. They share one width and one height and fill the row; at 200 % text they
	   wrap to one per row. */
	.detail-actions {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(5.5rem, 1fr));
		gap: 0.5rem;
	}
	.action-btn {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		min-height: 56px;
		padding: 0.5rem;
		font-size: 0.75rem;
		line-height: 1.25;
		text-align: center;
		overflow-wrap: anywhere;
	}
	.action-tip {
		display: none;
	}
	/* Icon mode: room and a mouse or trackpad. Width alone is not enough, since an iPad at 1024 px
	   has room but no hover. The head becomes two columns, so the title wraps in its own column and
	   never runs under the icons. */
	@media (min-width: 768px) and (hover: hover) and (pointer: fine) {
		.detail-head {
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: start;
		}
		.detail-actions {
			display: flex;
		}
		.action-btn {
			width: 44px;
			height: 44px;
			min-height: 44px;
			padding: 0;
		}
		.action-label {
			display: none;
		}
		/* The full name, 6 px below the button and aligned to its end edge, so it never leaves the
		   card. The transparent ::before bridges the gap, so the pointer can move onto the tooltip
		   without it closing (WCAG 1.4.13). */
		.action-tip {
			position: absolute;
			inset-block-start: calc(100% + 6px);
			inset-inline-end: 0;
			white-space: nowrap;
		}
		.action-tip::before {
			content: "";
			position: absolute;
			inset-inline: 0;
			inset-block-end: 100%;
			height: 6px;
		}
		.action-btn:hover .action-tip,
		.action-btn:focus-visible .action-tip {
			display: block;
		}
		.detail-actions[data-tips="hidden"] .action-tip {
			display: none;
		}
	}
```

- [ ] **Step 8: Update the C2a share and copy tests in `detail.test.tsx`**

Their behaviour is unchanged, but the confirmation will also show on screen in Task 6, so every `findByText` that reads an announcement reads it from the live region. Change these three lines:

```ts
	expect(await screen.findByText("Lenken er kopiert", { selector: "[aria-live]" })).toBeInTheDocument()
```

```ts
	expect(await screen.findByText("Nummeret er kopiert", { selector: "[aria-live]" })).toBeInTheDocument()
```

```ts
	expect(await screen.findByText("Kunne ikke kopiere", { selector: "[aria-live]" })).toBeInTheDocument()
```

- [ ] **Step 9: Run the tests to see them pass**

Run from `web/`: `npx vitest run tests/detailActions.test.tsx tests/detail.test.tsx tests/hydration.test.tsx`
Expected: PASS, including the C2a tests "with neither share nor clipboard the page has no share or copy buttons" and "a share sheet without a clipboard shows Del but no copy-phone button" (the mount effect hides what jsdom cannot do).

- [ ] **Step 10: Lint, typecheck, the whole unit suite, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add web/src/components/DetailActions.tsx web/src/components/ResourceDetail.tsx web/src/components/icons.tsx web/src/styles/main.css web/src/i18n/nb.json web/src/i18n/en.json web/tests/detailActions.test.tsx web/tests/detail.test.tsx web/tests/hydration.test.tsx
git commit -m "feat(web): copy, share and report as corner actions, labelled on touch and icons with tooltips on desktop"
```

---

### Task 6: A visible confirmation for copy and share

**Files:**
- Modify: `web/src/components/DetailActions.tsx`
- Modify: `web/src/styles/main.css`
- Test: `web/tests/detailActions.test.tsx`

**Interfaces:**
- Consumes: Task 5's `DetailActions` and its `tipsHidden` Escape handler.
- Produces: `export const FEEDBACK_MS = 4000` in `DetailActions.tsx`; `span.action-feedback[aria-hidden]` in place of `span.action-tip` while a confirmation shows.

- [ ] **Step 1: Write the failing tests**

Append to `web/tests/detailActions.test.tsx` (add `act` and `fireEvent` to the `@testing-library/react` import, and `import userEvent from "@testing-library/user-event"`):

```tsx
// Only setTimeout and clearTimeout are fake, so React's scheduler (setImmediate) is untouched and
// vi.getTimerCount() counts this component's timers alone. delay: null stops user-event from
// scheduling timers of its own. Nothing here waits with findBy, so no real time has to pass.
function setupTimers() {
	vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
	return userEvent.setup({ delay: null })
}
afterEach(() => {
	vi.useRealTimers()
})

const flush = () => act(async () => {})
const feedbackIn = (el: HTMLElement) => el.querySelector(".action-feedback")
const tipIn = (el: HTMLElement) => el.querySelector(".action-tip")

test("a copy shows Nummeret er kopiert in place of the tooltip, hidden from screen readers, for 4 seconds", async () => {
	const user = setupTimers()
	restoreNavigator = installNavigator({ clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
	renderBaked()
	const copy = screen.getByRole("button", { name: "Kopier nummer" })
	await user.click(copy)
	await flush()
	expect(feedbackIn(copy)).toHaveTextContent("Nummeret er kopiert")
	expect(feedbackIn(copy)).toHaveAttribute("aria-hidden", "true")
	expect(tipIn(copy)).toBeNull()
	// The live region still speaks it, once.
	expect(screen.getAllByText("Nummeret er kopiert", { selector: "[aria-live]" })).toHaveLength(1)
	act(() => vi.advanceTimersByTime(3999))
	expect(feedbackIn(copy)).not.toBeNull()
	act(() => vi.advanceTimersByTime(1))
	expect(feedbackIn(copy)).toBeNull()
	expect(tipIn(copy)).toHaveTextContent("Kopier nummer")
})

test("switching language while the confirmation shows switches the bubble too", async () => {
	const user = setupTimers()
	restoreNavigator = installNavigator({ clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
	const { rerender } = renderBaked()
	await user.click(screen.getByRole("button", { name: "Kopier nummer" }))
	await flush()
	rerender(tree(ringsaker, "en"))
	expect(feedbackIn(screen.getByRole("button", { name: "Copy number" }))).toHaveTextContent(
		"Number copied"
	)
})

test("a refused copy shows Kunne ikke kopiere on screen too", async () => {
	const user = setupTimers()
	restoreNavigator = installNavigator({
		clipboard: { writeText: vi.fn().mockRejectedValue(new DOMException("denied", "NotAllowedError")) },
	})
	renderBaked()
	const copy = screen.getByRole("button", { name: "Kopier nummer" })
	await user.click(copy)
	await flush()
	expect(feedbackIn(copy)).toHaveTextContent("Kunne ikke kopiere")
	act(() => vi.advanceTimersByTime(4000))
	expect(feedbackIn(copy)).toBeNull()
})

test("share by copy shows Lenken er kopiert under the share button", async () => {
	const user = setupTimers()
	restoreNavigator = installNavigator({ clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
	renderBaked()
	const share = screen.getByRole("button", { name: "Kopier lenke" })
	await user.click(share)
	await flush()
	expect(feedbackIn(share)).toHaveTextContent("Lenken er kopiert")
})

test("a native share sheet shows nothing: the sheet is the feedback", async () => {
	const user = setupTimers()
	restoreNavigator = installNavigator({ share: vi.fn().mockResolvedValue(undefined) })
	renderBaked()
	await user.click(screen.getByRole("button", { name: "Del" }))
	await flush()
	expect(document.querySelector(".action-feedback")).toBeNull()
})

test("Escape clears the confirmation early", async () => {
	const user = setupTimers()
	restoreNavigator = installNavigator({ clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
	renderBaked()
	const copy = screen.getByRole("button", { name: "Kopier nummer" })
	await user.click(copy)
	await flush()
	expect(feedbackIn(copy)).not.toBeNull()
	await user.keyboard("{Escape}")
	expect(feedbackIn(copy)).toBeNull()
	expect(document.querySelector(".detail-actions")).toHaveAttribute("data-tips", "hidden")
})

test("a click on another action clears it, and the report link clears it too", async () => {
	const user = setupTimers()
	restoreNavigator = installNavigator({ clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
	renderBaked()
	const copy = screen.getByRole("button", { name: "Kopier nummer" })
	const share = screen.getByRole("button", { name: "Kopier lenke" })
	await user.click(copy)
	await flush()
	await user.click(share)
	await flush()
	expect(feedbackIn(copy)).toBeNull()
	expect(feedbackIn(share)).toHaveTextContent("Lenken er kopiert")
	// jsdom does not follow a mailto link; a click event is enough to prove the handler.
	fireEvent.click(screen.getByRole("link", { name: "Meld feil i oppføringen" }))
	expect(document.querySelector(".action-feedback")).toBeNull()
})

test("a second click on the same action restarts the 4 seconds", async () => {
	const user = setupTimers()
	restoreNavigator = installNavigator({ clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
	renderBaked()
	const copy = screen.getByRole("button", { name: "Kopier nummer" })
	await user.click(copy)
	await flush()
	act(() => vi.advanceTimersByTime(3000))
	await user.click(copy)
	await flush()
	act(() => vi.advanceTimersByTime(3000))
	expect(feedbackIn(copy)).toHaveTextContent("Nummeret er kopiert")
	act(() => vi.advanceTimersByTime(1000))
	expect(feedbackIn(copy)).toBeNull()
})

test("leaving the page mid-message leaves no timer and logs no error", async () => {
	const user = setupTimers()
	const errors = vi.spyOn(console, "error").mockImplementation(() => {})
	restoreNavigator = installNavigator({ clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
	const { unmount } = renderBaked()
	await user.click(screen.getByRole("button", { name: "Kopier nummer" }))
	await flush()
	unmount()
	expect(vi.getTimerCount()).toBe(0)
	act(() => vi.advanceTimersByTime(5000))
	expect(errors).not.toHaveBeenCalled()
	errors.mockRestore()
})

test("leaving the page while the clipboard is still writing starts no timer", async () => {
	setupTimers()
	let finish: () => void = () => {}
	const writeText = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)))
	restoreNavigator = installNavigator({ clipboard: { writeText } })
	const { unmount } = renderBaked()
	fireEvent.click(screen.getByRole("button", { name: "Kopier nummer" }))
	unmount()
	await act(async () => finish())
	expect(vi.getTimerCount()).toBe(0)
})
```

- [ ] **Step 2: Run the tests to see them fail**

Run from `web/`: `npx vitest run tests/detailActions.test.tsx`
Expected: the new tests FAIL (no `.action-feedback` exists). The Task 5 tests still PASS.

- [ ] **Step 3: Add the confirmation to `DetailActions.tsx`**

Change the React import to `import { useEffect, useRef, useState } from "react"`. Add above the component:

```tsx
// How long a copy confirmation stays on screen (spec: Visible feedback). Four seconds, not two:
// someone with low vision needs time to find and read even three words.
export const FEEDBACK_MS = 4000

// The key, not the text, so a language switch while it shows changes the bubble too.
type Feedback = { action: "copy" | "share"; key: string }

// One bubble at a time: while a confirmation shows, it takes the tooltip's place. Both are
// aria-hidden, since the name is the aria-label and the live region speaks the confirmation.
function Bubble({ name, feedback }: { name: string; feedback: string | null }) {
	return feedback ? (
		<span className="action-feedback" aria-hidden="true">
			{feedback}
		</span>
	) : (
		<span className="action-tip" aria-hidden="true">
			{name}
		</span>
	)
}
```

Inside the component, after the capability effect:

```tsx
	const [feedback, setFeedback] = useState<Feedback | null>(null)
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
	// False once the page is gone, so a clipboard write that finishes after navigation starts no
	// timer and sets no state. Set in the effect, not at creation, so StrictMode's second mount
	// turns it back on.
	const mounted = useRef(false)
	useEffect(() => {
		mounted.current = true
		return () => {
			mounted.current = false
			clearTimeout(timer.current)
		}
	}, [])

	const clearFeedback = () => {
		clearTimeout(timer.current)
		setFeedback(null)
	}
	// A second click on the same action lands here again and restarts the 4 seconds.
	const confirm = (action: Feedback["action"], key: string) => {
		announce(t(key))
		if (!mounted.current) return
		clearTimeout(timer.current)
		setFeedback({ action, key })
		timer.current = setTimeout(() => setFeedback(null), FEEDBACK_MS)
	}
```

Change the Escape handler so Escape also clears a confirmation early:

```tsx
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Escape") return
			setTipsHidden(true)
			clearTimeout(timer.current)
			setFeedback(null)
		}
		document.addEventListener("keydown", onKeyDown)
		return () => document.removeEventListener("keydown", onKeyDown)
	}, [])
```

Replace `onCopy` and `onShare`. A click on any action first clears a confirmation that another action shows:

```tsx
	const onCopy = async () => {
		if (!phone) return
		clearFeedback()
		const ok = await copyText(phone, navigator)
		confirm("copy", ok ? "detail.phoneCopied" : "detail.copyFailed")
	}

	// A native share sheet ("shared") is its own feedback, and a cancelled one says nothing.
	const onShare = async () => {
		clearFeedback()
		const outcome = await shareResource({ name, phone, url: window.location.href }, navigator)
		if (outcome === "copied") confirm("share", "detail.linkCopied")
		if (outcome === "failed") confirm("share", "detail.copyFailed")
	}
```

In the JSX, replace each `span.action-tip` with a `Bubble`, and give the report link `onClick={clearFeedback}`:

```tsx
					<Bubble name={copyName} feedback={feedback?.action === "copy" ? t(feedback.key) : null} />
```

```tsx
					<Bubble name={shareName} feedback={feedback?.action === "share" ? t(feedback.key) : null} />
```

```tsx
			<a
				href={reportHref(id, name)}
				className="action-btn"
				aria-label={reportName}
				onClick={clearFeedback}
				{...hover}
			>
				<FlagIcon />
				<span className="action-label" aria-hidden="true">
					{t("report.short")}
				</span>
				<Bubble name={reportName} feedback={null} />
			</a>
```

- [ ] **Step 4: Place the confirmation in both modes**

In `main.css`, after the `.action-tip { display: none; }` rule (outside the media query), add:

```css
	/* The copy confirmation shows in both modes, below its button. In labelled mode it spans the
	   button's width and wraps, so a bubble under the left-most button cannot leave the card. It
	   sits inside the button, so it takes no pointer events: a tap on the tile it covers for those
	   4 seconds reaches the tile instead of copying again. */
	.action-feedback {
		position: absolute;
		inset-block-start: calc(100% + 6px);
		inset-inline: 0;
		text-align: center;
		pointer-events: none;
	}
```

Inside the icon-mode media query, extend the tooltip position rule so the confirmation sits where the tooltip does:

```css
		.action-tip,
		.action-feedback {
			position: absolute;
			inset-block-start: calc(100% + 6px);
			inset-inline: auto 0;
			white-space: nowrap;
		}
```

(This replaces the icon-mode `.action-tip { position … }` rule from Task 5; the `::before` bridge and the hover rules stay.)

- [ ] **Step 5: Run the tests to see them pass**

Run from `web/`: `npx vitest run tests/detailActions.test.tsx tests/detail.test.tsx`
Expected: PASS.

- [ ] **Step 6: Lint, typecheck, the whole unit suite, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add web/src/components/DetailActions.tsx web/src/styles/main.css web/tests/detailActions.test.tsx
git commit -m "feat(web): show the copy and share result under the button for 4 seconds"
```

---

### Task 7: The layout checks go green, axe on the full card, red proofs

**Files:**
- Modify: `web/tests/axe.test.tsx`
- Modify only if a check fails: the file that owns the failing behaviour (`main.css`, `DetailActions.tsx`, `ResourceDetail.tsx`, `ContactTiles.tsx`).

**Interfaces:**
- Consumes: Tasks 1 to 6.
- Produces: a green e2e suite and the red proofs for the PR body.

- [ ] **Step 1: Give axe a card with every section and the email tile**

In `web/tests/axe.test.tsx`, give the `resource` constant an address and an email, so the detail page renders all three sections and the email tile:

```ts
	address: "Torggata 1, 2317 Hamar",
	phone: "62 00 00 00",
	email: "post@krisesenter.example.no",
```

(Only `address` and `email` change. No other page in this test shows either field.) Then run from `web/`: `npx vitest run tests/axe.test.tsx`
Expected: PASS in both themes. A violation is a real defect in the card: fix it in the owning file, never by disabling a rule.

- [ ] **Step 2: Build and run the whole e2e suite**

Run from `web/`: `mkdir -p public/data && cp e2e/fixtures/data/*.json public/data/ && npm run build:site && npx playwright test`
Expected: PASS, every test in `e2e/detail-card.spec.ts` included. Anything that failed on the untouched base in Task 2 is recorded there, not fixed here. For a new failure, read the trace (`npx playwright show-trace test-results/<test>/trace.zip`), fix it in the file that owns the behaviour, and rerun.

- [ ] **Step 3: Red proofs, one per mode**

Each one breaks a single line, rebuilds, runs one group, sees it FAIL, and restores. Note each failure for the PR body.

1. In `main.css` change the icon-mode query to `@media (min-width: 768px)`. Rebuild, run `npx playwright test e2e/detail-card.spec.ts -g "touch tablet"`: it FAILS (the tablet gets icons). Restore.
2. Remove `md:auto-rows-fr` from the `ul` in `ContactTiles.tsx` and put back `auto-rows-fr`. Rebuild, run `-g "own content"`: it FAILS. Restore.
3. Delete the `.action-tip::before` rule. Rebuild, run `-g "tooltips show"`: it FAILS at the move onto the bubble. Restore.

Rebuild once more after the last restore and rerun `npx playwright test e2e/detail-card.spec.ts`: PASS.

- [ ] **Step 4: Commit**

```bash
npx biome check --write . && npx biome ci .
git add web/tests/axe.test.tsx
git commit -m "test(web): axe covers the full detail card with the email tile"
```

(If Step 2 needed fixes, commit them first, each with a `fix(web):` message naming what the check caught.)

---

### Task 8: "Back to results": keep or remove

**Files:**
- Modify only if the back and forward buttons have merged: `web/src/components/ResourceDetail.tsx`, `web/tests/detail.test.tsx`

**Interfaces:**
- Consumes: the state of `main`.
- Produces: a page that always has a way back.

- [ ] **Step 1: Check `main`**

```bash
git fetch origin
git log origin/main --oneline -30 | grep -iE "back|forward|history nav" || echo "not merged"
gh pr list --state merged --search "back forward in:title" --limit 5
```

Read what it prints. The back and forward buttons count as merged only if a merged PR adds in-app Back and Forward buttons to the page shell on `main`. If unsure, ask me; do not guess.

- [ ] **Step 2a: Not merged: keep it**

Nothing changes. "Back to results" stays above the card, outside it (Task 4's test "the back link stays outside the card" covers it). Note in the PR body that the back and forward PR removes it.

- [ ] **Step 2b: Merged: remove it**

In `ResourceDetail.tsx`: delete the `cameFromResults` state, its effect and the comment above it, the `backLabel` constant, and the whole `{cameFromResults ? (…) : (…)}` block. Keep `detail.back` in both bundles: `NotFoundState` still uses it.

In `detail.test.tsx`: delete "with from=sok in history state the back control goes back", "cameFromResults recomputes per id, not just on mount" and "the back link stays outside the card". In "the phone tile calls the service and the back link is a plain link without history state", delete the back-link assertion and rename it "the phone tile calls the service". Add:

```ts
test("the card has no back link: the in-app back and forward buttons replace it", async () => {
	await renderDetail()
	expect(screen.queryByRole("link", { name: "Tilbake til resultater" })).toBeNull()
	expect(screen.queryByRole("button", { name: "Tilbake til resultater" })).toBeNull()
})
```

Run from `web/`: `npx biome check --write . && npx biome ci . && npm run typecheck && npm test`. Then commit:

```bash
git add web/src/components/ResourceDetail.tsx web/tests/detail.test.tsx
git commit -m "feat(web): drop Back to results from the detail page, the back and forward buttons replace it"
```

---

### Task 9: Rebase, every suite, measured screenshots, PR

**Files:**
- No source changes unless a check fails.

**Interfaces:**
- Consumes: everything above.
- Produces: the pushed branch, an open and bound PR, and screenshots I have seen.

- [ ] **Step 1: Rebase onto `main` if #78 has merged**

If the branch was cut from `origin/feat/helplines-c2a`:

```bash
git fetch origin
gh pr view 78 --json state -q .state
```

If `MERGED`: `git rebase --onto origin/main <C2A_SHA> feat/detail-card`, where `<C2A_SHA>` is the base SHA recorded in the ledger at Setup (the branch name may be gone after the merge, and an auto-fix commit on #78 would move it). Resolve conflicts in favour of this branch's card markup, and rerun Task 7 Step 2 on the result. If #78 is still open, stop and ask me whether to wait or to open this PR against `feat/helplines-c2a`. The spec says the PR opens on `main`.

- [ ] **Step 2: Run every suite from clean**

PowerShell: `Start-Service postgresql-x64-17`. From `api/`: `dotnet test Varde.slnx`. From `web/`: `npx biome ci . && npm run typecheck && npm test && mkdir -p public/data && cp e2e/fixtures/data/*.json public/data/ && npm run build:site && npx playwright test`.
Expected: all PASS. Read the counts off the output; they go in the PR body.

- [ ] **Step 3: Check the spec against the build**

Dispatch a fresh reviewer (no context from the build) with the spec, this plan's Decided section and `git diff origin/main...HEAD`. It checks every spec section (Decisions, Card structure, Section headings, Practical details, Kontakt: the email tile, Corner actions, Visible feedback, Hydration, Back to results, Copy, Icons, Testing) and lists anything missing or different. Fix real gaps in the task that owns the code, then rerun Step 2.

- [ ] **Step 4: Serve the preview and measure it**

Start the `web-preview` configuration (`preview_start`) on the built `dist/`. In one batch, screenshot `/resources/1`, `/en/resources/1`, `/resources/102` and `/en/resources/102` at 375, 1024 and 1920 px, in dark and light (set `localStorage.theme` before load, as `setTheme` in `e2e/helpers.ts` does). Measure, do not eyeball: read the boxes of the card, the `h1`, the action group and each action, each tile, each `dt` and `dd`, and each section's top border. Check:

- the actions share one top and one bottom edge, at 44 × 44 in icon mode and one width and height of at least 56 px in labelled mode;
- the action group's top equals the `h1`'s top in icon mode, and the group sits below the head text in labelled mode;
- each section line has 24 px above and below it (the gap and the padding);
- the section labels read as labels (muted, small, uppercase) beside the body text, and each `dt` is muted beside its `dd`;
- hover the copy icon at 1024 px and screenshot the tooltip; click it and screenshot the confirmation in both modes.

Keyboard-only walk at 375 and 1280 px: Tab from the h1 reaches copy, share and report, then each tile once, then the website link. Every focus ring is fully visible.

- [ ] **Step 5: Show me before the PR**

Put the screenshots and the measured numbers in front of me, with the preview URL. If anything looks off after one fix round, show me what is left instead of polishing further.

- [ ] **Step 6: Push and open the PR**

```bash
git push -u origin feat/detail-card
```

Open the PR against `main` with `gh pr create`. Title: `feat: the detail page as one card, with corner actions and the email as a tile`. Body, in first person, no em dashes:

- **What** (four bullets: one card with sections; email tile behind a strict guard; corner actions in two modes; visible copy confirmation);
- **Decided while planning** (the Decided list above, one line each);
- **Checks** (the counts from Step 2, read off the output);
- **Red proofs** (Task 1's red run against C2a, and the three deliberate breaks from Task 7);
- **Back to results** (kept, and the back and forward PR removes it; or removed here, per Task 8);
- **Test before merge** (375, 1024 and 1920 px, both languages, both themes; NVDA on `/resources/102`: H walks Kontakt, Om tjenesten, Praktisk informasjon; the email tile reads "E-post, postmottak…"; each action is read once by its full name).

Then bind the PR with the ccd_pr tools, read its CI and stop. Merging is my call.

---

## Considered and rejected (writing this plan)

- **A separate `EmailTile` component.** The three tile kinds share one markup; two small helpers (`tileLabel`, `tileValue`) and an icon map keep one loop.
- **Faking every timer.** That would also fake React's scheduler and user-event's delays, so `vi.getTimerCount()` could not prove the confirmation's timer is gone. Only `setTimeout` and `clearTimeout` are faked, and the tests never wait with `findBy`.
- **A unit test for the media query.** jsdom loads no CSS. The mode switch is proved in Chromium (Task 1), including a touch-tablet context.

## Considered and rejected (stress test, 2026-10-16)

- **Escape on the Meny also hides the action tooltips.** The listener is page-wide, like the acute strip's. It only hides tooltips until the pointer or focus comes back, so it costs nothing.
- **A background tab stretching the 4 seconds.** Browsers throttle timers in hidden tabs, so a bubble can outlive 4 seconds there. Nobody is looking at it, and it clears on the next timer tick.
- **A name on the card's `article`.** An article is not a landmark, and the `h1` already names the page. A label would add a second announcement of the title.
- **A separate `safeWebsite()` helper.** It would be a copy of `safeChatUrl` under a new name. One https guard with two callers is simpler; I rename it if a third caller with different rules appears.
- **The optimistic prerender showing copy for a moment in a browser with no clipboard.** The spec accepts this trade: a rare flash instead of a jump on every load.

> Stress-tested 2026-10-16 (skill 1b85fca): 4 applied, 1 adapted, 0 decided by me.
