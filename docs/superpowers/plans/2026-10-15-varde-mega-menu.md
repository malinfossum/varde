# Varde "Alle tjenester" mega-menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn "Alle tjenester" in the header into a click-to-open disclosure that shows everything Varde covers (nine categories, five helplines, Helsenorge and NAV, Om Varde, "Se alle tjenester"): a full-width panel from 1024 px and an accordion inside the Meny below it.

**Architecture:** One PR, `feat/mega-menu`, six tasks. A new `ServicesGroups` component renders the four groups once; `ServicesPanel` (desktop) and `HeaderMenu` (the accordion) both render it, with a `layout` prop that only changes class names. Both surfaces are native `<details>` disclosures driven by the existing `usePicker` hook, which gains three small options and one rule for nested disclosures. Helpline names come from a new `HELPLINE_NAMES` constant copied from the seed and guarded by tests and a build check.

**Tech Stack:** React 19, TypeScript 7, Vite 8, Tailwind 4 (component classes in `main.css`), Vitest 5 + Testing Library + vitest-axe, `@playwright/test` 1.64.0 (Chromium only), `axe-core` 4.14.0 (already a devDependency), Biome 2.

**Spec:** `docs/superpowers/specs/2026-10-15-varde-mega-menu-design.md` (approved 2026-10-15, on branch `docs/mega-menu-spec`). It builds on the UI polish spec (`docs/superpowers/specs/2026-10-02-varde-ui-polish-design.md`, on `docs/ui-polish-spec`). Read both before Task 1.

**Depends on PR #74.** PR #74 (`feat/landing-fit`, sub-project A, PR 4) is still open. It changes `Header.tsx`, `main.css` and the header tests this plan edits, so the build branches from `main` only after #74 has merged. Line numbers below are from `feat/landing-fit` at `3ca42e1`, which is what `main` holds once #74 merges. If #74 changes again before it merges, re-read each file before its task and trust the file over the line numbers.

## Global Constraints

Every task's requirements include these. Values are copied from the spec.

- **Click, never hover.** The panel and the accordion open on click, Enter or Space only. No `mouseenter`, no `:hover` that opens anything.
- **A disclosure, not a menu.** `<details>`/`<summary>` only. No `role="menu"`, `menuitem` or roving tabindex anywhere. No arrow keys in the desktop panel.
- **Targets:** every row, the trigger and "Se alle tjenester" are at least **44 px** tall (`min-height: 2.75rem` or `44px`).
- **Header row rule:** the header stays one row at every width, every control 44 px tall on one bottom edge (the UI polish spec's rule). `e2e/header.spec.ts` already checks 320, 360, 375, 1023, 1024, 1280 and 1920 px in both languages.
- **Panel geometry:** body `max-width: 72rem` with `1rem` inline padding; columns `3fr 1fr 1fr`, no gap, each `1.5rem 1rem 1rem` padding (none on the outer edges), a 1 px `--border` on the inline start of every column after the first; labels on one shared row through `subgrid`; `max-block-size: calc(100dvh - 8rem)`, `overflow-y: auto`, `overscroll-behavior: contain`; shadow `0 16px 32px rgb(0 0 0 / 0.24)`.
- **Labels:** `0.8125rem`, weight 700, `letter-spacing: 0.08em`, uppercase, `--accent`, `0.75rem` inline padding, never focusable, `<span>` not a heading.
- **One open surface at a time:** the panel, the language picker, the theme picker and the Meny never stand open together.
- **No emergency numbers in the panel.** The acute strip already shows them.
- **CSP:** no `style` attribute in prerendered HTML. Inline styles and custom properties are set from JavaScript after mount only. `web/index.html`'s inline script and its hash in `web/public/_headers` do not change.
- **CSS is mobile-first:** baseline is the smallest screen, layered up with `min-width` queries only (640 px for the Meny sheet, 1024 px for the desktop nav). Never `max-width`.
- **Never invent contact data.** Helpline names are copied from `api/Varde.Data/Seed/SeedData.cs`; URLs come from `web/src/services/externalLinks.ts`. Nothing is typed from memory.
- **Text I ship:** first person in comments and docs, no em dashes (rewrite the sentence; no en dash or spaced hyphen as a stand-in). Every new string has an nb and an en entry.
- **Commits:** conventional prefix (`feat:`, `test:`, `style:`, `docs:`), no `Co-Authored-By`, no AI attribution.
- **Every new check is shown red once.** Before a check is trusted, break the code on purpose, run the check, see it fail, restore. The PR description lists every break and its red result.
- **Commands** run from `web/` unless a step says otherwise: `npm test`, `npx biome check --write .` then `npx biome ci .`, `npm run typecheck`, `npm run build:site`, `npx playwright test`. PostgreSQL is not needed: nothing here touches the API.
- **i18n snippets** show the new lines with trailing commas. Insert them before the last existing entry (`"header.menu"`), so the file stays valid JSON without touching the last line.

## Review Focus

Inputs the spec implies but no spec test names, most likely first. Each has a test in the task that owns the code.

1. **Find-in-page opens a closed `<details>`** (Chrome expands one to show a match, and the Meny now holds every category name, so a phone search for "Bolig" opens it): the Meny and the panel must open without moving focus out of the find bar. Test in Task 2 (an open that did not come from the trigger moves no focus) and Task 4 (the panel).
2. **A category URL with several or unknown slugs** (`/sok?category=bolig&category=rus`, `/sok?category=finnes-ikke`, or `?category=bolig` on a page that is not `/sok`): every known slug in the URL marks its row current, an unknown one marks nothing, and nothing throws. Test in Task 3.
3. **Back and forward with the panel open** (a popstate, not a link in the panel): the panel closes, like any other route change. Test in Task 4.
4. **Clicking "Alle tjenester" before JavaScript has loaded:** the native `<details>` opens, and hydration must not close it again. Test in Task 4 (hydration).
5. **A helpline renamed in Neon** (the daily deploy exports live data, not the seed): the header would name it differently from its own detail page. The prerender fails the build instead. Test in Task 1.

## Decided (2026-10-15, writing this plan)

Choices the spec leaves open or that the code forced. Task 6 folds the ones that change a spec sentence into the spec.

- **The panel runs on `usePicker`.** It needs every picker close rule (Escape, outside pointer-down, focus leaving, one open surface), so `usePicker` gains `focusOnOpen: "none"` and `arrows: false` instead of a second hook that copies those rules. The panel's `<details>` has the class `services`, not `picker`, and `usePicker`'s "close the others" rule reads a shared selector, `OPEN_SURFACES`, that covers both.
- **"Rendered rows" reads the `<details>` open state, not `checkVisibility()`.** jsdom has no `checkVisibility()`, so a unit test could only check a stub. A row inside a closed nested `<details>` is skipped, and that `<details>`' own `<summary>` row is kept: the same fact, readable in both jsdom and Chromium. The Playwright checks cover the real browser.
- **Focus moves on open only after a click on the surface's own trigger.** Mouse, Enter and Space all fire `click` on a `<summary>`; Chrome's find-in-page does not. This applies to every picker, the Meny and the panel (Review Focus 1). Before this, find-in-page could already open the language picker on "English"; now it would open the Meny on any category name.
- **The Meny's height comes from where it starts.** At scroll 0 on a phone the acute strip sits above the sticky header, so `calc(100dvh - 8rem)` alone would push the sheet's last rows below the screen (header plus strip is taller than 8 rem below 768 px). On open, `usePicker` writes the room left below the list's top into a `--room` custom property, and the Meny's CSS takes the smaller of the two. Before JavaScript the spec's value applies.
- **The helpline names are guarded three ways.** `public/data` is gitignored, and `deploy-web.yml` runs `npm test` before the export, so a unit test cannot read the exported data. It reads the seed (`SeedData.cs`) and the committed e2e snapshot (`e2e/fixtures/data/`) instead, and the prerender's `pickHelplines` checks the live export at build time.
- **"Every row is 44 px" means at least 44 px.** At 1280 px a helpline column leaves about 168 px for text, and "Hjelpetelefonen (Mental Helse)" wraps to two lines, so those rows are taller. The check pins single-line rows at 44 px and every row at 44 px or more.
- **The chevron still turns under `prefers-reduced-motion`; only the animation goes.** In forced colours the turned chevron is what marks the open trigger, so the state cue stays and the transition is dropped.
- **Hydration does not close a panel opened before JavaScript.** The route-change effect skips its first run (Review Focus 4).
- **A link to the page already shown closes the surface and stays put** (stress test). On `/sok?category=bolig`, "Bolig" would otherwise push a duplicate history entry, and Back would seem to do nothing. `LanguageRows` already does this for the current language. Test in Task 3.
- **The panel's three columns sit behind a container query in rem** (stress test). Px media queries ignore the reader's text size, so at 200 % text the three columns would break names mid-word ("Arbeidslivs" / "telefonen"). Below 60 rem of panel width the groups stack, as in the accordion; at default text every width from 1024 px has more than 60 rem, so the spec's layout is unchanged there. Test in Task 6.
- **The build-time name check says what to do** (stress test). It may first be read in a failed scheduled deploy, so the message names the file to update. GitHub emails the owner when a scheduled run fails.

## Open items (owner: Malin)

- **PR #74 merges first.** The build starts from `main` after it.
- **Decided by me: a category link drops the filters already set on `/sok`.** On `/sok?municipality=hamar`, "Bolig" in the panel goes to `/sok?category=bolig`, so Hamar is gone. The spec makes the links plain `/sok?category={slug}` and calls them item 6's contract. Recommended: keep it as specced. The panel is the same overview on every page, and refining a search is the filter bar's job (item 6). Alternative: keep `municipality` (and `national`) when the current page is `/sok`. That makes the links differ from page to page and the current-row rule harder to read. Tell me before Task 3 if you want the alternative.

## Shipping the PR

1. After #74 has merged: `git switch main && git pull && git switch -c feat/mega-menu`.
2. The plan and the spec live only on `docs/mega-menu-spec`. On the feature branch they are local, git-excluded copies: `git show origin/docs/mega-menu-spec:docs/superpowers/plans/2026-10-15-varde-mega-menu.md > docs/superpowers/plans/2026-10-15-varde-mega-menu.md`, the same for the spec, and both paths in `.git/info/exclude`.
3. Before pushing, all of these pass from `web/`: `npx biome ci .`, `npm run typecheck`, `npm test`, `npm run build:site`, `npx playwright test`.
4. `git push -u origin feat/mega-menu`, then `gh pr create --base main --title "feat: Alle tjenester mega-menu" --body-file <file>`. The body has what changed (short), a "Red proofs" table (check, break, red result) and the manual checklist from Task 6.
5. Merging is Malin's call; I never merge.

---

### Task 1: Helpline names, copied from the seed and guarded

**Files:**
- Modify: `web/src/services/helplines.ts`, `web/src/entry-server.tsx:12-13`
- Test: `web/tests/helplines.test.ts`, `web/tests/seedDrift.test.ts`

**Interfaces:**
- Consumes: `HELPLINE_IDS` (`readonly [1, 2, 121, 9, 122]`), `pickHelplines(resources: readonly ResourceDto[]): Helpline[]`.
- Produces: `type HelplineId = (typeof HELPLINE_IDS)[number]`; `HELPLINE_NAMES: Record<HelplineId, string>`; `assertHelplineNames(resources: readonly Pick<ResourceDto, "id" | "name">[]): void` (throws on a missing id or a different name); `entry-server.tsx`'s `pickHelplines` now runs `assertHelplineNames` first.

- [ ] **Step 1: Branch** (see "Shipping the PR", steps 1 and 2).

- [ ] **Step 2: Write the failing unit tests**

Add to `web/tests/helplines.test.ts` (merge the imports into the existing import lines):

```ts
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { pickHelplines as buildPick } from "../src/entry-server.tsx"
import {
	assertHelplineNames,
	HELPLINE_IDS,
	HELPLINE_NAMES,
	pickHelplines,
	safeChatUrl,
} from "../src/services/helplines.ts"

test("HELPLINE_NAMES names every helpline id and nothing else", () => {
	expect(
		Object.keys(HELPLINE_NAMES)
			.map(Number)
			.sort((a, b) => a - b)
	).toEqual([...HELPLINE_IDS].sort((a, b) => a - b))
	expect(() => assertHelplineNames(helplineRows)).not.toThrow()
})

test("a helpline renamed in the data fails the check, and so does a missing one", () => {
	const renamed = helplineRows.map((r) => (r.id === 2 ? { ...r, name: "Kirkens SOS Norge" } : r))
	expect(() => assertHelplineNames(renamed)).toThrow(
		'helpline 2 is "Kirkens SOS Norge" in the data but "Kirkens SOS" in HELPLINE_NAMES'
	)
	expect(() => assertHelplineNames(renamed)).toThrow("web/src/services/helplines.ts")
	expect(() => assertHelplineNames(helplineRows.filter((r) => r.id !== 122))).toThrow(
		"helpline id 122 is missing from the data"
	)
})

// The prerender's pick is the build-time guard: the daily deploy exports live data from Neon,
// so a name edited there fails the build instead of shipping a header that disagrees with the
// helpline's own page.
test("the prerender's pick refuses data whose helpline names differ", () => {
	const renamed = helplineRows.map((r) => (r.id === 1 ? { ...r, name: "Hjelpetelefonen" } : r))
	expect(() => buildPick(renamed)).toThrow("helpline 1")
	expect(buildPick(helplineRows).map((h) => h.id)).toEqual([1, 2, 121, 9, 122])
})

// The committed snapshot is real exported data (CI's e2e job builds from it).
// jsdom's URL breaks file:// paths on Windows, so node:path/node:url, as in seedDrift.test.ts.
test("the exported data snapshot carries the same helpline names, in both languages", () => {
	const dir = join(dirname(fileURLToPath(import.meta.url)), "../e2e/fixtures/data")
	for (const lang of ["nb", "en"]) {
		const rows = JSON.parse(readFileSync(join(dir, `resources.${lang}.json`), "utf8"))
		expect(() => assertHelplineNames(rows), lang).not.toThrow()
	}
})
```

Add to `web/tests/seedDrift.test.ts` (import `HELPLINE_IDS, HELPLINE_NAMES` from `../src/services/helplines.ts`):

```ts
// Sidetmedord (122) has no phone, so seededResource cannot read it; this reads the name only.
function seededName(id: number): string {
	const start = seed.indexOf(`Id = ${id},`)
	expect(start, `seed row ${id} missing`).toBeGreaterThan(-1)
	const end = seed.indexOf("new Resource", start)
	const name = /Name = "([^"]+)"/.exec(seed.slice(start, end === -1 ? undefined : end))?.[1]
	expect(name, `seed row ${id} has no Name`).toBeDefined()
	return name as string
}

test("HELPLINE_NAMES matches the seed, id for id", () => {
	for (const id of HELPLINE_IDS) expect(HELPLINE_NAMES[id], `helpline ${id}`).toBe(seededName(id))
})
```

- [ ] **Step 3: Run them to see them fail**

Run: `npx vitest run tests/helplines.test.ts tests/seedDrift.test.ts`
Expected: FAIL, `HELPLINE_NAMES` and `assertHelplineNames` are not exported.

- [ ] **Step 4: Implement**

In `web/src/services/helplines.ts`, after `HELPLINE_IDS`, add the constant. Copy each name from `api/Varde.Data/Seed/SeedData.cs` (the `Name = "..."` line under `Id = 1,` at line 89, `Id = 2,` at 102, `Id = 121,` at 648, `Id = 9,` at 193 and `Id = 122,` at 661). Do not type them; the test in Step 2 proves the copy.

```ts
export type HelplineId = (typeof HELPLINE_IDS)[number]

// The header's "Noen å snakke med" group names the helplines on every page, and not every page's
// data block holds them, so the names live here, copied from the seed (SeedData.cs). Names are
// the same in both languages. tests/seedDrift.test.ts fails if one differs from the seed, and the
// prerender checks them against the exported data (assertHelplineNames below).
export const HELPLINE_NAMES: Record<HelplineId, string> = {
	1: "Hjelpetelefonen (Mental Helse)",
	2: "Kirkens SOS",
	121: "Kors på halsen (Røde Kors)",
	9: "Arbeidslivstelefonen (Mental Helse)",
	122: "Sidetmedord (Mental Helse)",
}

// Throws on a helpline id the data lacks or a name that differs from HELPLINE_NAMES. The message
// says what to do, because it may first be read in a failed scheduled deploy.
export function assertHelplineNames(resources: readonly Pick<ResourceDto, "id" | "name">[]): void {
	for (const id of HELPLINE_IDS) {
		const row = resources.find((r) => r.id === id)
		if (!row) throw new Error(`helpline id ${id} is missing from the data`)
		if (row.name !== HELPLINE_NAMES[id])
			throw new Error(
				`helpline ${id} is "${row.name}" in the data but "${HELPLINE_NAMES[id]}" in HELPLINE_NAMES. ` +
					"Check the new name at its source, then copy it into HELPLINE_NAMES " +
					"(web/src/services/helplines.ts) and the seed (SeedData.cs)."
			)
	}
}
```

In `web/src/entry-server.tsx`, replace lines 12-13 (the comment and `export { pickHelplines } ...`) with:

```ts
// The prerender picks the landing page's helplines with the same function the browser uses, and
// checks the header's copied names first, so a helpline renamed in the data fails the build.
export function pickHelplines(resources: readonly ResourceDto[]): Helpline[] {
	assertHelplineNames(resources)
	return pickFrom(resources)
}
```

and add the imports:

```ts
import { assertHelplineNames, type Helpline, pickHelplines as pickFrom } from "./services/helplines.ts"
import type { ResourceDto } from "./types/api.ts"
```

The browser keeps calling `services/helplines.ts`' own `pickHelplines`, which does not check names: the data it fetches is the same export the build already checked.

- [ ] **Step 5: Run the tests to see them pass**

Run: `npx vitest run tests/helplines.test.ts tests/seedDrift.test.ts tests/prerender.test.ts`
Expected: PASS. `prerender.test.ts` injects its own `pickHelplines`, so it is unaffected.

- [ ] **Step 6: Red proof**

Change `"Kirkens SOS"` to `"Kirkens SOS Norge"` in `HELPLINE_NAMES`, run `npx vitest run tests/seedDrift.test.ts tests/helplines.test.ts`, see "helpline 2" fail in both files, restore. Note it for the PR's red-proofs table.

- [ ] **Step 7: Commit**

```bash
git add web/src/services/helplines.ts web/src/entry-server.tsx web/tests/helplines.test.ts web/tests/seedDrift.test.ts
git commit -m "feat: copy the helpline names from the seed and fail the build if the data differs"
```

---

### Task 2: `usePicker` for nested disclosures and the panel

**Files:**
- Modify: `web/src/hooks/usePicker.ts`
- Test: `web/tests/picker.test.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `usePicker(options?: { focusOnOpen?: "active" | "first" | "none"; arrows?: boolean })` returning `{ ref, onToggle, onKeyDown, onBlur, closeAndFocus }`. `onToggle` now takes the React event: `(event: SyntheticEvent<HTMLDetailsElement>) => void` (callers already pass it straight to `<details onToggle>`, so `Picker.tsx` and `HeaderMenu.tsx` compile unchanged). `export const OPEN_SURFACES = "details.picker[open], details.services[open]"`. Rules: rows inside a closed nested `<details>` are skipped (its own `<summary>` row is kept); focus moves on open only after a click on the surface's own `<summary>`; a nested `<details>`' toggle never runs these rules; closing the surface closes every `<details>` nested in it; `arrows: false` leaves the arrow keys, Home and End to the page.

- [ ] **Step 1: Write the failing tests**

Add to `web/tests/picker.test.tsx`, with `import { usePicker } from "../src/hooks/usePicker.ts"`:

```tsx
// A picker with a nested disclosure in its rows, as the Meny holds the Alle tjenester accordion.
// The nested <details> gets its own onToggle, so React listens on it and a toggle there would
// reach the outer handler if the hook did not check the event's target.
function Nested() {
	const { ref, onToggle, onKeyDown, onBlur } = usePicker({ focusOnOpen: "first" })
	return (
		<>
			<details ref={ref} className="picker" onToggle={onToggle} onKeyDown={onKeyDown} onBlur={onBlur}>
				<summary>Ytre</summary>
				<div className="picker-list">
					<button type="button" className="picker-row">
						A
					</button>
					<details className="inner" onToggle={() => {}}>
						<summary className="picker-row">Mer</summary>
						<button type="button" className="picker-row">
							Skjult
						</button>
					</details>
					<button type="button" className="picker-row">
						C
					</button>
				</div>
			</details>
			<button type="button">Utenfor</button>
		</>
	)
}

const outer = () => screen.getByText("Ytre").closest("details") as HTMLDetailsElement
const inner = () => document.querySelector("details.inner") as HTMLDetailsElement

test("the arrows skip the rows of a closed nested disclosure but keep its summary", async () => {
	const user = userEvent.setup()
	render(<Nested />)
	await user.click(screen.getByText("Ytre"))
	await waitFor(() => expect(screen.getByRole("button", { name: "A" })).toHaveFocus())
	await user.keyboard("{ArrowDown}")
	expect(screen.getByText("Mer")).toHaveFocus()
	await user.keyboard("{ArrowDown}")
	expect(screen.getByRole("button", { name: "C" })).toHaveFocus()
	await user.click(screen.getByText("Mer"))
	await waitFor(() => expect(inner().open).toBe(true))
	await user.keyboard("{ArrowDown}")
	expect(screen.getByRole("button", { name: "Skjult" })).toHaveFocus()
})

test("opening the nested disclosure leaves the picker open, and it is not a picker itself", async () => {
	const user = userEvent.setup()
	render(<Nested />)
	await user.click(screen.getByText("Ytre"))
	await user.click(screen.getByText("Mer"))
	await waitFor(() => expect(inner().open).toBe(true))
	expect(outer().open).toBe(true)
	expect(screen.getByText("Mer")).toHaveFocus()
	expect(inner().matches("details.picker")).toBe(false)
})

test("closing the picker closes the nested disclosure, so it is closed each time the picker opens", async () => {
	const user = userEvent.setup()
	render(<Nested />)
	await user.click(screen.getByText("Ytre"))
	await user.click(screen.getByText("Mer"))
	await waitFor(() => expect(inner().open).toBe(true))
	await user.keyboard("{Escape}")
	await waitFor(() => expect(inner().open).toBe(false))
	await user.click(screen.getByText("Ytre"))
	await waitFor(() => expect(outer().open).toBe(true))
	expect(inner().open).toBe(false)
})

// Chrome's find-in-page opens a closed <details> to show a match. That must not pull focus out
// of the find bar, so only a click on the picker's own trigger moves focus.
test("an open that did not come from the trigger moves no focus", async () => {
	render(<Harness />)
	const outside = screen.getByRole("button", { name: "Utenfor" })
	outside.focus()
	act(() => {
		details("Andre").open = true
	})
	await waitFor(() => expect(details("Andre").open).toBe(true))
	expect(outside).toHaveFocus()
})

function Plain() {
	const { ref, onToggle, onKeyDown, onBlur } = usePicker({ focusOnOpen: "none", arrows: false })
	return (
		<details ref={ref} className="services" onToggle={onToggle} onKeyDown={onKeyDown} onBlur={onBlur}>
			<summary>Panel</summary>
			<a href="#a" className="picker-row">
				Første lenke
			</a>
			<a href="#b" className="picker-row">
				Andre lenke
			</a>
		</details>
	)
}

test("focusOnOpen none and arrows off: focus stays on the trigger and the arrows do nothing", async () => {
	const user = userEvent.setup()
	render(<Plain />)
	const summary = screen.getByText("Panel")
	await user.click(summary)
	await waitFor(() => expect((summary.parentElement as HTMLDetailsElement).open).toBe(true))
	expect(summary).toHaveFocus()
	await user.keyboard("{ArrowDown}")
	expect(summary).toHaveFocus()
	await user.keyboard("{Escape}")
	expect((summary.parentElement as HTMLDetailsElement).open).toBe(false)
	expect(summary).toHaveFocus()
})

test("a picker opening closes an open services panel, one open surface at a time", async () => {
	const user = userEvent.setup()
	render(
		<>
			<Plain />
			<Harness />
		</>
	)
	await user.click(screen.getByText("Panel"))
	const panel = screen.getByText("Panel").parentElement as HTMLDetailsElement
	await waitFor(() => expect(panel.open).toBe(true))
	await open(user, "Andre")
	await waitFor(() => expect(panel.open).toBe(false))
})
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/picker.test.tsx`
Expected: FAIL. The arrows land on "Skjult", Escape leaves the inner disclosure open, the programmatic open moves focus to "X", `focusOnOpen: "none"` is a type error, and the panel stays open.

- [ ] **Step 3: Implement**

Replace `web/src/hooks/usePicker.ts` with:

```ts
import {
	type FocusEvent,
	type KeyboardEvent,
	type SyntheticEvent,
	useCallback,
	useEffect,
	useRef,
} from "react"

// Behaviour ported from Workbench DS 3.8.0 components/picker.js. Workbench binds one set of
// listeners to the document from a classic script; Varde is React with a prerendered DOM and a
// CSP that hashes its one inline script, so the same rules live here, per picker. The edge
// shift below is the one inline style, set after mount, never in rendered markup.
const EDGE_GAP = 8
const KEYS = ["ArrowDown", "ArrowUp", "Home", "End"]

// Every surface the header opens: the pickers, the Meny and the services panel. Opening one
// closes the others (mega-menu spec: Behaviour).
export const OPEN_SURFACES = "details.picker[open], details.services[open]"

// A row inside a closed nested <details> (the Meny's Alle tjenester accordion) is not rendered,
// so the arrows skip it; that <details>' own <summary> row is kept. jsdom has no
// checkVisibility(), and the open state is the same fact, so the rule reads it directly.
function shown(row: HTMLElement, root: HTMLElement): boolean {
	for (
		let d = row.closest("details");
		d && d !== root;
		d = d.parentElement?.closest("details") ?? null
	) {
		if (!d.open && !d.querySelector(":scope > summary")?.contains(row)) return false
	}
	return true
}

// focusOnOpen: the pickers open on their active row (UI polish spec: Picker behaviour), the Meny
// on its first row, and the services panel nowhere (mega-menu spec: Behaviour). arrows: the
// panel is a disclosure of links and leaves the arrow keys to the page.
export function usePicker({
	focusOnOpen = "active",
	arrows = true,
}: { focusOnOpen?: "active" | "first" | "none"; arrows?: boolean } = {}) {
	const ref = useRef<HTMLDetailsElement>(null)
	// Set by a click on this surface's own trigger. Mouse, Enter and Space all fire one; Chrome's
	// find-in-page opens a closed <details> without one, and must keep focus in the find bar.
	const fromTrigger = useRef(false)

	useEffect(() => {
		const details = ref.current
		const summary = details?.querySelector(":scope > summary")
		const onClick = () => {
			fromTrigger.current = true
		}
		const onPointerDown = (event: PointerEvent) => {
			if (details?.open && !details.contains(event.target as Node)) details.open = false
		}
		summary?.addEventListener("click", onClick)
		document.addEventListener("pointerdown", onPointerDown)
		return () => {
			summary?.removeEventListener("click", onClick)
			document.removeEventListener("pointerdown", onPointerDown)
		}
	}, [])

	const rows = () => {
		const root = ref.current
		if (!root) return []
		return Array.from(root.querySelectorAll<HTMLElement>(".picker-row")).filter((row) =>
			shown(row, root)
		)
	}

	const closeAndFocus = useCallback(() => {
		const details = ref.current
		if (!details) return
		details.open = false
		details.querySelector<HTMLElement>(":scope > summary")?.focus()
	}, [])

	const onToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
		const details = ref.current
		// A nested <details> (the Meny's accordion) never runs this surface's rules.
		if (!details || event.target !== details) return
		const armed = fromTrigger.current
		fromTrigger.current = false
		const list = details.querySelector<HTMLElement>(".picker-list")
		if (list) list.style.translate = ""
		if (!details.open) {
			// Closed with the surface, so a nested accordion is closed each time it opens again.
			for (const inner of details.querySelectorAll<HTMLDetailsElement>("details[open]"))
				inner.open = false
			return
		}
		for (const other of document.querySelectorAll<HTMLDetailsElement>(OPEN_SURFACES)) {
			if (other !== details) other.open = false
		}
		if (list) {
			const overflow = EDGE_GAP - list.getBoundingClientRect().left
			if (overflow > 0) list.style.translate = `${overflow}px 0`
		}
		if (!armed || focusOnOpen === "none") return
		const all = rows()
		const active =
			focusOnOpen === "active"
				? all.find(
						(row) => row.hasAttribute("aria-current") || row.getAttribute("aria-pressed") === "true"
					)
				: undefined
		;(active ?? all[0])?.focus()
	}

	const onKeyDown = (event: KeyboardEvent<HTMLDetailsElement>) => {
		if (!ref.current?.open) return
		if (event.key === "Escape") {
			event.preventDefault()
			closeAndFocus()
			return
		}
		if (!arrows || !KEYS.includes(event.key)) return
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
		all[next]?.focus()
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

- [ ] **Step 4: Run the tests to see them pass, then the whole suite**

Run: `npx vitest run tests/picker.test.tsx`, then `npm test`
Expected: PASS. The existing picker, language picker, theme picker and Meny tests open their surfaces with `user.click` on the trigger, so the click rule keeps them green. If one opens a picker by setting `.open = true` and then expects focus on a row, change it to click the trigger and list it in the report.

- [ ] **Step 5: Red proofs**

One at a time, run `npx vitest run tests/picker.test.tsx` and restore: (a) return `true` from `shown()`, see the arrow test fail; (b) delete the `if (!armed ...)` guard's `!armed ||`, see the find-in-page test fail; (c) delete the nested-close `for` loop, see the reopen test fail; (d) change `OPEN_SURFACES` to `"details.picker[open]"`, see the one-open-surface test fail.

- [ ] **Step 6: Commit**

```bash
git add web/src/hooks/usePicker.ts web/tests/picker.test.tsx
git commit -m "feat: let usePicker drive nested disclosures and a panel without arrow keys"
```

---

### Task 3: `ServicesGroups`, the one source for both layouts

**Files:**
- Create: `web/src/components/ServicesGroups.tsx`
- Modify: `web/src/services/externalLinks.ts`, `web/src/components/HeaderLinks.tsx`, `web/src/components/Link.tsx:13,22`, `web/src/i18n/nb.json`, `web/src/i18n/en.json`
- Test: `web/tests/servicesGroups.test.tsx` (new)

**Interfaces:**
- Consumes: `CATEGORY_SLUGS`, `HELPLINE_IDS`, `HELPLINE_NAMES` (Task 1), `useCurrentUrl()`, `parseUrl(pathname)`, `parseFilters(params)` (its `.categories: string[]`), `Link`.
- Produces: `ServicesGroups({ layout, onFollow }: { layout: "panel" | "accordion"; onFollow: () => void })`, rendering, in order, a body (`.services-body` for `"panel"`, `.services-stack` for `"accordion"`) of three `.services-col` columns, then `.services-foot` holding the `.services-all` link. Each group is `<span id class="services-label">` plus `<ul aria-labelledby class="services-list">`; the categories list also has `.services-categories`; the Varde group sits in `.services-varde` inside column 3. Every row is a `.picker-row`. `EXTERNAL_LINKS` in `externalLinks.ts` (`readonly { name, href }[]`, Helsenorge then NAV). `ExternalLink({ name, href, className, onFollow? })` exported from `HeaderLinks.tsx`. `Link`'s `aria-current` accepts `"page" | "true"`. i18n keys `services.categories`, `services.talk`, `services.public`, `services.varde`, `services.about`, `services.all`.

- [ ] **Step 1: Write the failing tests**

Create `web/tests/servicesGroups.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, test, vi } from "vitest"
import { ServicesGroups } from "../src/components/ServicesGroups.tsx"
import { LanguageProvider, translate } from "../src/i18n/LanguageProvider.tsx"
import { NavigationContext, UrlContext } from "../src/navigation.ts"
import { CATEGORY_SLUGS } from "../src/services/categories.ts"
import { HELSENORGE_URL, NAV_URL } from "../src/services/externalLinks.ts"
import { HELPLINE_IDS, HELPLINE_NAMES } from "../src/services/helplines.ts"
import { parseUrl } from "../src/services/urlState.ts"

function renderAt(url: string, onFollow = vi.fn(), navigate = vi.fn()) {
	const { pathname, search } = new URL(url, "http://localhost")
	render(
		<NavigationContext.Provider value={navigate}>
			<UrlContext.Provider value={{ pathname, search }}>
				<LanguageProvider lang={parseUrl(pathname).lang}>
					<ServicesGroups layout="panel" onFollow={onFollow} />
				</LanguageProvider>
			</UrlContext.Provider>
		</NavigationContext.Provider>
	)
	return onFollow
}

const links = (list: HTMLElement) =>
	within(list)
		.getAllByRole("link")
		.map((a) => [a.textContent, a.getAttribute("href")])

test("four labelled groups and Se alle tjenester, every href right, in Norwegian", () => {
	renderAt("/")
	expect(links(screen.getByRole("list", { name: "Kategorier" }))).toEqual(
		CATEGORY_SLUGS.map((slug) => [translate("nb", `category.${slug}`), `/sok?category=${slug}`])
	)
	expect(links(screen.getByRole("list", { name: "Noen å snakke med" }))).toEqual(
		HELPLINE_IDS.map((id) => [HELPLINE_NAMES[id], `/resources/${id}`])
	)
	const pub = screen.getByRole("list", { name: "Offentlige tjenester" })
	for (const [name, href] of [
		["Helsenorge (ekstern side, åpnes i ny fane)", HELSENORGE_URL],
		["NAV (ekstern side, åpnes i ny fane)", NAV_URL],
	]) {
		const a = within(pub).getByRole("link", { name })
		expect(a).toHaveAttribute("href", href)
		expect(a).toHaveAttribute("target", "_blank")
		expect(a).toHaveAttribute("rel", "noopener noreferrer")
	}
	expect(
		within(screen.getByRole("list", { name: "Varde" })).getByRole("link", { name: "Om Varde" })
	).toHaveAttribute("href", "/om")
	expect(screen.getByRole("link", { name: "Se alle tjenester" })).toHaveAttribute("href", "/sok")
})

test("in English every label is English and every internal href keeps /en", () => {
	renderAt("/en/")
	expect(links(screen.getByRole("list", { name: "Categories" }))[1]).toEqual([
		"Housing",
		"/en/sok?category=bolig",
	])
	expect(links(screen.getByRole("list", { name: "Someone to talk to" }))[0]).toEqual([
		HELPLINE_NAMES[1],
		"/en/resources/1",
	])
	expect(screen.getByRole("list", { name: "Public services" })).toBeInTheDocument()
	expect(screen.getByRole("link", { name: "About Varde" })).toHaveAttribute("href", "/en/om")
	expect(screen.getByRole("link", { name: "See all services" })).toHaveAttribute("href", "/en/sok")
})

const current = () =>
	screen
		.getAllByRole("link")
		.filter((a) => a.getAttribute("aria-current") === "true")
		.map((a) => a.textContent)

test("the category in the URL is the current row", () => {
	renderAt("/sok?category=bolig")
	expect(current()).toEqual(["Bolig"])
})

// Review Focus 2: several categories, an unknown one, or a category param off /sok.
test.each([
	["/sok?category=bolig&category=rus", ["Bolig", "Rus og avhengighet"]],
	["/sok?category=finnes-ikke", []],
	["/sok", []],
	["/om?category=bolig", []],
])("at %s the current rows are %j", (url, expected) => {
	renderAt(url)
	expect(current()).toEqual(expected)
})

test("the labels are plain text: no headings, nothing focusable", () => {
	renderAt("/")
	expect(screen.queryAllByRole("heading")).toEqual([])
	for (const label of document.querySelectorAll(".services-label")) {
		expect(label.tagName).toBe("SPAN")
		expect(label).not.toHaveAttribute("tabindex")
	}
})

test("following an internal or an external link runs onFollow once", async () => {
	const user = userEvent.setup()
	const onFollow = renderAt("/")
	await user.click(screen.getByRole("link", { name: "Bolig" }))
	expect(onFollow).toHaveBeenCalledTimes(1)
	// jsdom does not implement navigation; this only stops it trying (as in headerMenu.test.tsx).
	const cancel = (event: MouseEvent) => event.preventDefault()
	window.addEventListener("click", cancel)
	try {
		await user.click(screen.getByRole("link", { name: /^NAV/ }))
	} finally {
		window.removeEventListener("click", cancel)
	}
	expect(onFollow).toHaveBeenCalledTimes(2)
})

// The page already shown, as LanguageRows does for the current language: a second navigation
// would push a duplicate history entry, so Back would seem to do nothing.
test("a link to the page already shown closes the surface but does not navigate again", async () => {
	const user = userEvent.setup()
	const navigate = vi.fn()
	const onFollow = renderAt("/sok?category=bolig", vi.fn(), navigate)
	await user.click(screen.getByRole("link", { name: "Bolig" }))
	expect(onFollow).toHaveBeenCalledTimes(1)
	expect(navigate).not.toHaveBeenCalled()
	await user.click(screen.getByRole("link", { name: "Rus og avhengighet" }))
	expect(navigate).toHaveBeenCalledWith("/sok", "?category=rus", { lang: "nb" })
})
```

`renderAt` passes a `vi.fn()` as `NavigationContext`, so an internal link click calls `onNavigate` and records the navigation instead of making it.

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/servicesGroups.test.tsx`
Expected: FAIL, `ServicesGroups.tsx` does not exist.

- [ ] **Step 3: i18n keys**

In `web/src/i18n/nb.json`, insert before `"header.menu": "Meny"`:

```json
	"services.categories": "Kategorier",
	"services.talk": "Noen å snakke med",
	"services.public": "Offentlige tjenester",
	"services.varde": "Varde",
	"services.about": "Om Varde",
	"services.all": "Se alle tjenester",
```

In `web/src/i18n/en.json`, insert before `"header.menu": "Menu"`:

```json
	"services.categories": "Categories",
	"services.talk": "Someone to talk to",
	"services.public": "Public services",
	"services.varde": "Varde",
	"services.about": "About Varde",
	"services.all": "See all services",
```

- [ ] **Step 4: `Link` takes `aria-current="true"`**

In `web/src/components/Link.tsx`, change the prop type on line 22 from `"aria-current"?: "page"` to:

```ts
	// "page" for the language you are in, "true" for the current category in the services list.
	"aria-current"?: "page" | "true"
```

- [ ] **Step 5: One list of external links, one external link**

In `web/src/services/externalLinks.ts`, append:

```ts

// The two public services the header links to, in this order (spec: Header). The header bar,
// the Meny and the services overview all render this list.
export const EXTERNAL_LINKS = [
	{ name: "Helsenorge", href: HELSENORGE_URL },
	{ name: "NAV", href: NAV_URL },
] as const
```

Replace `web/src/components/HeaderLinks.tsx` with:

```tsx
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { EXTERNAL_LINKS } from "../services/externalLinks.ts"
import { Link } from "./Link.tsx"

// One link that leaves Varde. It opens in a new tab so Varde stays open behind it. The arrow is
// decoration; the hidden text says it. The space after the name is what separates it from the
// hidden text in the accessible name.
export function ExternalLink({
	name,
	href,
	className,
	onFollow,
}: {
	name: string
	href: string
	className: string
	onFollow?: () => void
}) {
	const t = useTranslation()
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className={className}
			onClick={() => onFollow?.()}
		>
			{name} <span aria-hidden="true">↗</span>
			<span className="visually-hidden">{t("header.external")}</span>
		</a>
	)
}

// One source for the header's links, rendered by the desktop nav and by the Meny (spec: One
// source, two layouts).
export function HeaderLinks({
	className,
	onFollow,
}: {
	className: string
	// Runs when a link is followed. The Meny uses it to close and refocus its trigger; the
	// desktop nav passes nothing.
	onFollow?: () => void
}) {
	const t = useTranslation()
	return (
		<>
			<Link
				to="/sok"
				className={className}
				onNavigate={() => {
					onFollow?.()
				}}
			>
				<span>{t("header.allServices")}</span>
			</Link>
			{EXTERNAL_LINKS.map(({ name, href }) => (
				<ExternalLink
					key={name}
					name={name}
					href={href}
					className={className}
					onFollow={onFollow}
				/>
			))}
		</>
	)
}
```

The "Alle tjenester" link stays here until Task 4 moves it.

- [ ] **Step 6: Create `ServicesGroups`**

Create `web/src/components/ServicesGroups.tsx`:

```tsx
import { useId } from "react"
import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { useCurrentUrl } from "../navigation.ts"
import { CATEGORY_SLUGS } from "../services/categories.ts"
import { EXTERNAL_LINKS } from "../services/externalLinks.ts"
import { HELPLINE_IDS, HELPLINE_NAMES } from "../services/helplines.ts"
import { parseFilters, parseUrl, pathFor } from "../services/urlState.ts"
import { ExternalLink } from "./HeaderLinks.tsx"
import { Link } from "./Link.tsx"

// Everything Varde covers, in four groups and a "Se alle tjenester" link, rendered by the desktop
// panel and by the Meny's accordion (mega-menu spec: One source, two layouts). layout only
// changes class names, so the two can never list different things. Each group is a list named
// by its label, so NVDA says "Kategorier, liste, 9 elementer"; the labels are spans, not
// headings, so every page's heading outline stays as it is. onFollow runs when any link is
// followed; both callers use it to close their surface and refocus its trigger.
export function ServicesGroups({
	layout,
	onFollow,
}: {
	layout: "panel" | "accordion"
	onFollow: () => void
}) {
	const t = useTranslation()
	const { lang } = useLanguage()
	const { pathname, search } = useCurrentUrl()
	// Only /sok has a current category. Unknown slugs match no row.
	const current =
		parseUrl(pathname).route.kind === "list"
			? parseFilters(new URLSearchParams(search)).categories
			: []
	const categoriesId = useId()
	const talkId = useId()
	const publicId = useId()
	const vardeId = useId()
	// Every link closes the surface. A link to the page already shown stays put, as the current
	// language row does: a second navigation would push a duplicate history entry. The row stays
	// a real link, so without JavaScript it still loads the page.
	const follow =
		(to: string) =>
		(): undefined | false => {
			onFollow()
			return pathFor(lang, to) === `${pathname}${search}` ? false : undefined
		}
	return (
		<>
			<div className={layout === "panel" ? "services-body" : "services-stack"}>
				<div className="services-col">
					<span id={categoriesId} className="services-label">
						{t("services.categories")}
					</span>
					<ul aria-labelledby={categoriesId} className="services-list services-categories">
						{CATEGORY_SLUGS.map((slug) => (
							<li key={slug}>
								<Link
									to={`/sok?category=${slug}`}
									className="picker-row"
									aria-current={current.includes(slug) ? "true" : undefined}
									onNavigate={follow(`/sok?category=${slug}`)}
								>
									{t(`category.${slug}`)}
								</Link>
							</li>
						))}
					</ul>
				</div>
				<div className="services-col">
					<span id={talkId} className="services-label">
						{t("services.talk")}
					</span>
					<ul aria-labelledby={talkId} className="services-list">
						{HELPLINE_IDS.map((id) => (
							<li key={id}>
								<Link
									to={`/resources/${id}`}
									className="picker-row"
									onNavigate={follow(`/resources/${id}`)}
								>
									{HELPLINE_NAMES[id]}
								</Link>
							</li>
						))}
					</ul>
				</div>
				<div className="services-col">
					<span id={publicId} className="services-label">
						{t("services.public")}
					</span>
					<div>
						<ul aria-labelledby={publicId} className="services-list">
							{EXTERNAL_LINKS.map(({ name, href }) => (
								<li key={name}>
									<ExternalLink name={name} href={href} className="picker-row" onFollow={onFollow} />
								</li>
							))}
						</ul>
						<div className="services-varde">
							<span id={vardeId} className="services-label">
								{t("services.varde")}
							</span>
							<ul aria-labelledby={vardeId} className="services-list">
								<li>
									<Link to="/om" className="picker-row" onNavigate={follow("/om")}>
										{t("services.about")}
									</Link>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
			<div className="services-foot">
				<Link to="/sok" className="services-all" onNavigate={follow("/sok")}>
					{t("services.all")} <span aria-hidden="true">→</span>
				</Link>
			</div>
		</>
	)
}
```

Column 3 has exactly two children (its label and one wrapper), like columns 1 and 2, so all three line up on the panel's two subgrid rows in Task 4.

- [ ] **Step 7: Run the tests to see them pass, then the suite**

Run: `npx vitest run tests/servicesGroups.test.tsx tests/i18n.test.tsx`, then `npm test`
Expected: PASS. `i18n.test.tsx` proves every new nb key has an en twin. Nothing renders `ServicesGroups` yet, so the header tests are unchanged.

- [ ] **Step 8: Red proofs**

(a) Drop the `parseUrl(...).route.kind === "list"` condition (always parse the search), see `/om?category=bolig` fail; (b) remove `"services.talk"` from `en.json`, see the i18n twin test fail. Restore both.

- [ ] **Step 9: Commit**

```bash
git add web/src/components/ServicesGroups.tsx web/src/components/HeaderLinks.tsx web/src/components/Link.tsx web/src/services/externalLinks.ts web/src/i18n/nb.json web/src/i18n/en.json web/tests/servicesGroups.test.tsx
git commit -m "feat: list every service group from one component for the panel and the Meny"
```

---

### Task 4: The desktop panel

**Files:**
- Create: `web/src/components/ServicesPanel.tsx`
- Modify: `web/src/components/Header.tsx:32-34`, `web/src/components/HeaderLinks.tsx`, `web/src/components/HeaderMenu.tsx:41-46`, `web/src/components/icons.tsx`, `web/src/styles/main.css`, `web/tests/scope.ts`
- Test: `web/tests/header.test.tsx`, `web/tests/hydration.test.tsx`

**Interfaces:**
- Consumes: `usePicker({ focusOnOpen: "none", arrows: false })` (Task 2), `ServicesGroups` (Task 3), `ExternalLink`, `EXTERNAL_LINKS` (Task 3), `useCurrentUrl()`.
- Produces: `ServicesPanel()` rendering `<details class="services">` with `<summary class="nav-link services-trigger">` (text `header.allServices`, then `ChevronDownIcon` with class `services-chevron`) and `<div class="services-panel">` around `<ServicesGroups layout="panel">`. `ChevronDownIcon` in `icons.tsx`. `HeaderLinks` now renders Helsenorge and NAV only. Test helper `servicesPanel()` in `tests/scope.ts`. CSS classes `.services`, `.services-trigger`, `.services-chevron`, `.services-panel`, `.services-body`, `.services-col`, `.services-label`, `.services-categories`, `.services-varde`, `.services-foot`, `.services-all`.

- [ ] **Step 1: Write the failing tests**

In `web/tests/scope.ts`, add:

```ts
export const servicesPanel = () => scope("details.services")
```

In `web/tests/header.test.tsx`, replace the two nav tests (lines 16-45, "the header nav links to all services..." and "the English nav keeps the language prefix...") with the block below, and add `act, waitFor` to the Testing Library import, `userEvent`, `axe` from `vitest-axe`, and `servicesPanel` from `./scope.ts`:

```tsx
const panel = () => document.querySelector<HTMLDetailsElement>("details.services") as HTMLDetailsElement
const panelTrigger = () => panel().querySelector(":scope > summary") as HTMLElement
const desktopNav = () =>
	screen.getAllByRole("navigation", { name: /^(Hovedmeny|Main menu)$/ })[0] as HTMLElement

async function openPanel(user: ReturnType<typeof userEvent.setup>) {
	await user.click(panelTrigger())
	await waitFor(() => expect(panel().open).toBe(true))
}

// The desktop nav comes first in DOM order; the Meny's nav has the same name.
test("the header nav holds the Alle tjenester disclosure, then Helsenorge and NAV in a new tab", () => {
	stubDataFiles()
	render(<App />)
	const nav = desktopNav()
	expect(nav.contains(panel())).toBe(true)
	expect(panelTrigger()).toHaveAccessibleName("Alle tjenester")
	expect(panel().matches("details.picker")).toBe(false)
	// The bar's own two links, after the disclosure; the panel holds the same two again.
	const bar = [...nav.querySelectorAll<HTMLAnchorElement>(":scope > a")]
	expect(bar.map((a) => a.getAttribute("href"))).toEqual([HELSENORGE_URL, NAV_URL])
	for (const [name, href] of [
		["Helsenorge (ekstern side, åpnes i ny fane)", HELSENORGE_URL],
		["NAV (ekstern side, åpnes i ny fane)", NAV_URL],
	]) {
		for (const link of within(nav).getAllByRole("link", { name })) {
			expect(link).toHaveAttribute("href", href)
			// noopener: the new tab cannot reach back into Varde. noreferrer: it is not told where
			// the visit came from.
			expect(link).toHaveAttribute("target", "_blank")
			expect(link).toHaveAttribute("rel", "noopener noreferrer")
		}
	}
	expect(servicesPanel().getByRole("link", { name: "Se alle tjenester" })).toHaveAttribute(
		"href",
		"/sok"
	)
})

test("the English trigger is All services and the panel keeps the language prefix", () => {
	stubDataFiles()
	window.history.replaceState(null, "", "/en/")
	render(<App />)
	expect(panelTrigger()).toHaveAccessibleName("All services")
	expect(servicesPanel().getByRole("link", { name: "See all services" })).toHaveAttribute(
		"href",
		"/en/sok"
	)
	expect(
		within(desktopNav()).getAllByRole("link", { name: "NAV (external site, opens in a new tab)" })
	).toHaveLength(2)
})

test.each([
	["/", "Alle tjenester"],
	["/en/", "All services"],
])("at %s the trigger toggles the panel and focus stays on it", async (url, name) => {
	const user = userEvent.setup()
	stubDataFiles()
	window.history.replaceState(null, "", url)
	render(<App />)
	expect(panelTrigger()).toHaveAccessibleName(name)
	expect(panel().open).toBe(false)
	await openPanel(user)
	expect(panelTrigger()).toHaveFocus()
	await user.click(panelTrigger())
	await waitFor(() => expect(panel().open).toBe(false))
})

test("Escape closes the panel from a link inside it and returns focus to the trigger", async () => {
	const user = userEvent.setup()
	stubDataFiles()
	render(<App />)
	await openPanel(user)
	await user.tab()
	expect(servicesPanel().getByRole("link", { name: "Økonomi og gjeld" })).toHaveFocus()
	await user.keyboard("{Escape}")
	expect(panel().open).toBe(false)
	expect(panelTrigger()).toHaveFocus()
})

test("a pointer press outside closes the panel", async () => {
	const user = userEvent.setup()
	stubDataFiles()
	render(<App />)
	await openPanel(user)
	await user.click(document.body)
	expect(panel().open).toBe(false)
})

test("focus leaving the panel closes it", async () => {
	const user = userEvent.setup()
	stubDataFiles()
	render(<App />)
	await openPanel(user)
	servicesPanel().getByRole("link", { name: "Se alle tjenester" }).focus()
	await user.tab()
	expect(panel().open).toBe(false)
})

test("a category in the panel navigates there and closes the panel", async () => {
	const user = userEvent.setup()
	stubDataFiles()
	render(<App />)
	await openPanel(user)
	await user.click(servicesPanel().getByRole("link", { name: "Bolig" }))
	expect(window.location.pathname + window.location.search).toBe("/sok?category=bolig")
	expect(panel().open).toBe(false)
})

// Same route, so no arrival moves focus. It must not fall to the body.
test("Se alle tjenester on /sok closes the panel and leaves focus on its trigger", async () => {
	const user = userEvent.setup()
	stubDataFiles()
	window.history.pushState(null, "", "/sok?search=nav")
	render(<App />)
	await openPanel(user)
	await user.click(servicesPanel().getByRole("link", { name: "Se alle tjenester" }))
	expect(window.location.pathname + window.location.search).toBe("/sok")
	expect(panel().open).toBe(false)
	expect(panelTrigger()).toHaveFocus()
})

test("NAV in the panel leaves Varde's tab where it was, closes the panel and refocuses its trigger", async () => {
	const user = userEvent.setup()
	stubDataFiles()
	render(<App />)
	await openPanel(user)
	// jsdom does not implement navigation; this listener only stops it trying.
	const cancel = (event: MouseEvent) => event.preventDefault()
	window.addEventListener("click", cancel)
	try {
		await user.click(servicesPanel().getByRole("link", { name: /^NAV/ }))
	} finally {
		window.removeEventListener("click", cancel)
	}
	expect(window.location.pathname).toBe("/")
	expect(panel().open).toBe(false)
	expect(panelTrigger()).toHaveFocus()
})

// Review Focus 3: back and forward reach the header as a popstate, not through a panel link.
test("a route change from back or forward closes the panel", async () => {
	const user = userEvent.setup()
	stubDataFiles()
	render(<App />)
	await openPanel(user)
	act(() => {
		window.history.pushState(null, "", "/om")
		window.dispatchEvent(new PopStateEvent("popstate"))
	})
	await waitFor(() => expect(panel().open).toBe(false))
})

test("the panel and a picker are never open together", async () => {
	const user = userEvent.setup()
	stubDataFiles()
	render(<App />)
	await openPanel(user)
	const language = document.querySelector(".header-tools details.picker") as HTMLDetailsElement
	await user.click(language.querySelector(":scope > summary") as HTMLElement)
	await waitFor(() => expect(language.open).toBe(true))
	expect(panel().open).toBe(false)
	await openPanel(user)
	expect(language.open).toBe(false)
})

// Review Focus 1: Chrome's find-in-page opens a closed <details> to show a match.
test("an open from find-in-page moves no focus", async () => {
	stubDataFiles()
	render(<App />)
	const brand = screen.getByRole("link", { name: "Varde, til forsiden" })
	brand.focus()
	act(() => {
		panel().open = true
	})
	await waitFor(() => expect(panel().open).toBe(true))
	expect(brand).toHaveFocus()
})

// The desktop half of the axe check: hide the Meny as CSS does from 1024 px.
test("the desktop layout with the panel open has no axe violations", async () => {
	const user = userEvent.setup()
	stubDataFiles()
	const { container } = render(<App />)
	container.querySelector(".menu-nav")?.setAttribute("hidden", "")
	await openPanel(user)
	expect(
		await axe(container, { rules: { "color-contrast": { enabled: false } } })
	).toHaveNoViolations()
})
```

In `web/tests/hydration.test.tsx`, give `hydrate` an optional third parameter and call it right after `document.body.innerHTML = ...`:

```ts
async function hydrate(url: string, data: PageData, beforeHydrate?: () => void) {
	// ...existing lines up to and including document.body.innerHTML = ...
	beforeHydrate?.()
	// ...rest unchanged
```

and add:

```ts
// Review Focus 4: a click on Alle tjenester before JavaScript loads opens the native <details>;
// hydration must leave it open.
test("a panel opened before hydration stays open", async () => {
	const errors = await hydrate("/", bakedHelplines("nb"), () => {
		;(document.querySelector("details.services") as HTMLDetailsElement).open = true
	})
	expect(errors).toEqual([])
	expect((document.querySelector("details.services") as HTMLDetailsElement).open).toBe(true)
})
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/header.test.tsx tests/hydration.test.tsx`
Expected: FAIL, there is no `details.services`.

- [ ] **Step 3: The chevron**

In `web/src/components/icons.tsx`, after `MenuIcon`, add:

```tsx
// The services trigger's chevron. CSS sizes it to 16 px and turns it when the panel is open.
export function ChevronDownIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<path d="M6 9l6 6 6-6" />
		</Svg>
	)
}
```

- [ ] **Step 4: Create `ServicesPanel`**

Create `web/src/components/ServicesPanel.tsx`:

```tsx
import { useEffect, useRef } from "react"
import { usePicker } from "../hooks/usePicker.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { useCurrentUrl } from "../navigation.ts"
import { ChevronDownIcon } from "./icons.tsx"
import { ServicesGroups } from "./ServicesGroups.tsx"

// "Alle tjenester" from 1024 px (mega-menu spec: Desktop: the panel). A disclosure of links, not
// a menu: a native <details>, so it opens before hydration and without JavaScript. It keeps the
// picker's close rules (Escape, a pointer press outside, focus leaving, one open surface at a
// time), but opening never moves focus and there are no arrow keys. It has the class services,
// not picker, so the pickers' own rules leave it alone except through OPEN_SURFACES.
export function ServicesPanel() {
	const t = useTranslation()
	const { ref, onToggle, onKeyDown, onBlur, closeAndFocus } = usePicker({
		focusOnOpen: "none",
		arrows: false,
	})
	const { pathname, search } = useCurrentUrl()
	const url = `${pathname}${search}`
	// The header outlives every route change, back and forward included, so the panel closes on
	// each one. The first run is skipped: a panel opened before hydration stays open.
	const shownAt = useRef(url)
	useEffect(() => {
		if (shownAt.current === url) return
		shownAt.current = url
		if (ref.current) ref.current.open = false
	}, [url, ref])
	return (
		<details
			ref={ref}
			className="services"
			onToggle={onToggle}
			onKeyDown={onKeyDown}
			onBlur={onBlur}
		>
			<summary className="nav-link services-trigger">
				<span>{t("header.allServices")}</span>
				<ChevronDownIcon className="services-chevron" />
			</summary>
			<div className="services-panel">
				<ServicesGroups layout="panel" onFollow={closeAndFocus} />
			</div>
		</details>
	)
}
```

- [ ] **Step 5: Wire it into the header, and move the Meny's plain link out of `HeaderLinks`**

In `web/src/components/Header.tsx`, import `ServicesPanel` and change the nav (lines 32-34) to:

```tsx
				<nav aria-label={t("header.navLabel")} className="header-nav">
					<ServicesPanel />
					<HeaderLinks className="nav-link" />
				</nav>
```

In `web/src/components/HeaderLinks.tsx`, delete the `<Link to="/sok" ...>` block from `HeaderLinks`, the now unused `Link` import and the `t` constant, and change its comment to `// The header's two links that leave Varde, rendered by the desktop nav and by the Meny (spec: One source, two layouts).` `HeaderLinks` then returns `<>{EXTERNAL_LINKS.map(...)}</>` only.

In `web/src/components/HeaderMenu.tsx`, the Meny keeps its plain "Alle tjenester" link until Task 5 replaces it with the accordion. Change the first group (lines 41-46) to:

```tsx
					<div className="menu-group">
						{/* Every link closes the Meny and returns focus to the trigger, never into a
						    closed list. A route change then moves focus on to the new heading; a link
						    to the route already shown, or a new tab, leaves it on the trigger. */}
						<Link
							to="/sok"
							className="picker-row"
							onNavigate={() => {
								closeAndFocus()
							}}
						>
							<span>{t("header.allServices")}</span>
						</Link>
						<HeaderLinks className="picker-row" onFollow={closeAndFocus} />
					</div>
```

and add `import { Link } from "./Link.tsx"`.

- [ ] **Step 6: The panel's CSS**

In `web/src/styles/main.css`, inside `@layer components`, after the `@media (min-width: 1024px) { ... .menu-nav { display: none; } }` block (line 295), add:

```css
	/* "Alle tjenester" from 1024 px (mega-menu spec: Desktop: the panel). The <details> stays
	   static, so the panel hangs from the sticky header across the full viewport width, above the
	   page and below the pickers' lists (z-index 30). It moves with the header, so the page cannot
	   scroll it into view: it scrolls inside itself, and every link stays reachable and visible
	   when tabbed to on a short or zoomed window (WCAG 2.4.11, house bar 2.4.12). The open trigger
	   gets the picker hover tint; its turned chevron marks it open in forced colours too. */
	.services > summary {
		list-style: none;
		cursor: pointer;
	}
	.services > summary::-webkit-details-marker {
		display: none;
	}
	.services[open] > summary {
		background: color-mix(in srgb, var(--text) 6%, transparent);
	}
	.services-chevron {
		inline-size: 1rem;
		block-size: 1rem;
	}
	[open] > summary > .services-chevron {
		rotate: 180deg;
	}
	@media (prefers-reduced-motion: no-preference) {
		.services-chevron {
			transition: rotate 150ms ease-out;
		}
	}
	.services-panel {
		position: absolute;
		inset-inline: 0;
		inset-block-start: 100%;
		z-index: 20;
		max-block-size: calc(100dvh - 8rem);
		overflow-y: auto;
		overscroll-behavior: contain;
		background: var(--surface);
		border-block: 1px solid var(--border);
		box-shadow: 0 16px 32px rgb(0 0 0 / 0.24);
	}
	/* The body sits in the header's own column, so its first column starts on the brand's left
	   edge. Baseline: the groups stacked, split by rules, as large text needs them. From 60 rem
	   of panel width, three columns with no gap: each pads itself, and every column after the
	   first draws the divider on its inline start, so the dividers run the body's full height.
	   The labels share the first of two subgrid rows, so the first row of every column starts
	   on one line however the labels wrap. A container query in rem, not a media query: px
	   media queries ignore the reader's text size, and at 200 % text three columns would break
	   names mid-word. At default text every width from 1024 px has more than 60 rem. */
	.services-panel {
		container: services / inline-size;
	}
	.services-body {
		max-inline-size: 72rem;
		margin-inline: auto;
		padding-inline: 1rem;
	}
	.services-body > .services-col {
		padding-block: 1rem;
	}
	.services-body > .services-col + .services-col {
		border-block-start: 1px solid var(--border);
	}
	@container services (min-width: 60rem) {
		.services-body {
			display: grid;
			grid-template-columns: 3fr 1fr 1fr;
			grid-template-rows: auto 1fr;
		}
		.services-body > .services-col {
			grid-row: span 2;
			display: grid;
			grid-template-rows: subgrid;
			padding: 1.5rem 1rem 1rem;
		}
		.services-body > .services-col:first-child {
			padding-inline-start: 0;
		}
		.services-body > .services-col:last-child {
			padding-inline-end: 0;
		}
		.services-body > .services-col + .services-col {
			border-block-start: 0;
			border-inline-start: 1px solid var(--border);
		}
		.services-body .services-categories {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
		}
	}
	/* Labels look like labels: smaller than the rows, bold, uppercase, in the accent. The inline
	   padding matches the rows', so label and row text share one edge. */
	.services-label {
		display: block;
		padding: 0 0.75rem 0.5rem;
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--accent);
	}
	.services-varde {
		margin-block-start: 1rem;
		padding-block-start: 1rem;
		border-block-start: 1px solid var(--border);
	}
	.services-foot {
		border-block-start: 1px solid var(--border);
	}
	/* The foot's rule runs the full width; its link starts on the brand's left edge. */
	.services-panel .services-foot {
		padding: 0.25rem max(1rem, calc((100% - 72rem) / 2 + 1rem));
	}
	.services-all {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		min-height: 2.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		color: var(--accent);
		font-weight: 600;
		text-decoration: none;
	}
	.services-all:hover {
		background: color-mix(in srgb, var(--text) 6%, transparent);
	}
	@media (forced-colors: active) {
		.services-panel,
		.services-body > .services-col + .services-col,
		.services-varde,
		.services-foot {
			border-color: CanvasText;
		}
	}
```

The rows reuse `.picker-row` (44 px, `0.5rem 0.75rem`, `0.5rem` radius, hover tint, `--text`, no underline) and its `[aria-current]` and forced-colours rules, which match `aria-current="true"` as well as `"page"`. Tailwind's Preflight already strips list bullets, margins and padding from `ul`.

- [ ] **Step 7: Run the tests to see them pass, then the suite**

Run: `npx vitest run tests/header.test.tsx tests/hydration.test.tsx`, then `npm test`
Expected: PASS. `headerMenu.test.tsx` still passes: the Meny keeps its "Alle tjenester" link. If `axe.test.tsx` or `shell.test.tsx` now finds two elements for "Bolig" or "Se alle tjenester" (the landing chips sit in `<main>`, the panel in the header), scope that query to `<main>` with `within(screen.getByRole("main"))` and list it in the report.

- [ ] **Step 8: Red proofs**

One at a time, run `npx vitest run tests/header.test.tsx tests/hydration.test.tsx` and restore: (a) remove the `shownAt.current === url` early return, see the hydration test fail; (b) remove `url` from the effect so it never re-runs (`[ref]`), see the popstate test fail; (c) pass `focusOnOpen: "first"` instead of `"none"`, see the toggle test fail on focus.

- [ ] **Step 9: Commit**

```bash
git add web/src/components/ServicesPanel.tsx web/src/components/Header.tsx web/src/components/HeaderLinks.tsx web/src/components/HeaderMenu.tsx web/src/components/icons.tsx web/src/styles/main.css web/tests/scope.ts web/tests/header.test.tsx web/tests/hydration.test.tsx
git commit -m "feat: open every service from the Alle tjenester panel on desktop"
```

---

### Task 5: The Meny's accordion and the phone sheet

**Files:**
- Modify: `web/src/components/HeaderMenu.tsx`, `web/src/hooks/usePicker.ts`, `web/src/styles/main.css`
- Test: `web/tests/headerMenu.test.tsx`

**Interfaces:**
- Consumes: `ServicesGroups` (Task 3), `ChevronDownIcon` (Task 4), `usePicker` (Task 2), `HeaderLinks` (Helsenorge and NAV only, Task 4).
- Produces: the Meny's `.menu-list` holds, in order, `.menu-group` with `<details class="services-accordion">` (summary `.picker-row`, body `.services-accordion-body` around `<ServicesGroups layout="accordion">`), then `role="group"` "Offentlige tjenester" with `HeaderLinks`, then Språk, then Tema. `usePicker` sets `--room` (px) on an opened surface's `.picker-list`. CSS classes `.services-accordion`, `.services-accordion-body`, `.services-stack`.

- [ ] **Step 1: Write the failing tests, and update the ones that named the old link**

In `web/tests/headerMenu.test.tsx`, add helpers after `openMenu`:

```tsx
const accordion = () =>
	menuDetails().querySelector<HTMLDetailsElement>("details.services-accordion") as HTMLDetailsElement
const accordionTrigger = () => accordion().querySelector(":scope > summary") as HTMLElement

async function openAccordion(user: ReturnType<typeof userEvent.setup>) {
	await user.click(accordionTrigger())
	await waitFor(() => expect(accordion().open).toBe(true))
}
```

Change `trigger` to read only the Meny's own summary, since the Meny now holds a second one:

```tsx
const trigger = () => menuDetails().querySelector(":scope > summary") as HTMLElement
```

Replace the first test ("the Meny holds the three links, then Språk and Tema as named groups") with:

```tsx
test("the Meny holds Alle tjenester alone, then Offentlige tjenester, Språk and Tema", () => {
	stubDataFiles()
	render(<App />)
	expect(trigger()).toHaveAccessibleName("Meny")
	const groups = [...menuDetails().querySelectorAll(".menu-list > .menu-group")]
	expect(groups).toHaveLength(4)
	expect(groups[0].children).toHaveLength(1)
	expect(groups[0].firstElementChild).toBe(accordion())
	expect(accordionTrigger()).toHaveAccessibleName("Alle tjenester")
	expect(accordion().matches("details.picker")).toBe(false)
	const m = menu()
	const pub = m.getByRole("group", { name: "Offentlige tjenester" })
	expect(groups[1]).toBe(pub)
	const helsenorge = within(pub).getByRole("link", {
		name: "Helsenorge (ekstern side, åpnes i ny fane)",
	})
	expect(helsenorge).toHaveAttribute("href", HELSENORGE_URL)
	expect(helsenorge).toHaveAttribute("target", "_blank")
	expect(helsenorge).toHaveAttribute("rel", "noopener noreferrer")
	const språk = m.getByRole("group", { name: "Språk" })
	expect(groups[2]).toBe(språk)
	expect(within(språk).getByRole("link", { name: "Norsk" })).toHaveAttribute("aria-current", "page")
	expect(within(språk).getByRole("link", { name: "English" })).toHaveAttribute("lang", "en")
	const tema = m.getByRole("group", { name: "Tema" })
	expect(groups[3]).toBe(tema)
	expect(
		within(tema)
			.getAllByRole("button")
			.map((b) => b.textContent)
	).toEqual(["Lyst", "Mørkt", "System"])
	// The accordion lists what the desktop panel lists.
	expect(within(accordion()).getByRole("list", { name: "Kategorier" }).children).toHaveLength(9)
	expect(within(accordion()).getByRole("link", { name: "Se alle tjenester" })).toHaveAttribute(
		"href",
		"/sok"
	)
})
```

In "the English Meny is named Menu, with Language and Theme groups", add:

```tsx
	expect(accordionTrigger()).toHaveAccessibleName("All services")
	expect(menu().getByRole("group", { name: "Public services" })).toBeInTheDocument()
```

In "opening the Meny focuses its first row, even with a current language row" and in "the arrows move through all three groups, skip the group labels and wrap", replace every `menu().getByRole("link", { name: "Alle tjenester" })` with `accordionTrigger()`, and rename the second test to "the arrows move through all four groups, skip the group labels and wrap". The arrow sequence does not change: Alle tjenester, Helsenorge, NAV, Norsk, English, Lyst, Mørkt, System.

Replace "Alle tjenester navigates and the Meny closes" and "Alle tjenester on /sok closes the Meny and leaves focus on its trigger" with:

```tsx
// The header outlives the route change, so the Meny closes itself.
test("a category in the accordion navigates there and the Meny closes", async () => {
	const user = userEvent.setup()
	stubDataFiles()
	render(<App />)
	await openMenu(user)
	await openAccordion(user)
	await user.click(within(accordion()).getByRole("link", { name: "Bolig" }))
	expect(window.location.pathname + window.location.search).toBe("/sok?category=bolig")
	expect(menuDetails().open).toBe(false)
})

// Same route, so no arrival moves focus. It must not fall to the body.
test("Se alle tjenester on /sok closes the Meny and leaves focus on its trigger", async () => {
	const user = userEvent.setup()
	stubDataFiles()
	window.history.pushState(null, "", "/sok?search=nav")
	render(<App />)
	await openMenu(user)
	await openAccordion(user)
	await user.click(within(accordion()).getByRole("link", { name: "Se alle tjenester" }))
	expect(window.location.pathname + window.location.search).toBe("/sok")
	expect(menuDetails().open).toBe(false)
	expect(trigger()).toHaveFocus()
})

test("the arrows skip a closed accordion and enter an open one", async () => {
	const user = userEvent.setup()
	stubDataFiles()
	render(<App />)
	await openMenu(user)
	await waitFor(() => expect(accordionTrigger()).toHaveFocus())
	await user.keyboard("{ArrowDown}")
	expect(
		within(menu().getByRole("group", { name: "Offentlige tjenester" })).getByRole("link", {
			name: /^Helsenorge/,
		})
	).toHaveFocus()
	await user.keyboard("{ArrowUp}")
	expect(accordionTrigger()).toHaveFocus()
	await openAccordion(user)
	expect(menuDetails().open).toBe(true)
	expect(accordionTrigger()).toHaveFocus()
	await user.keyboard("{ArrowDown}")
	expect(within(accordion()).getByRole("link", { name: "Økonomi og gjeld" })).toHaveFocus()
})

test("the accordion is closed each time the Meny opens", async () => {
	const user = userEvent.setup()
	stubDataFiles()
	render(<App />)
	await openMenu(user)
	await openAccordion(user)
	await user.keyboard("{Escape}")
	expect(menuDetails().open).toBe(false)
	expect(trigger()).toHaveFocus()
	await openMenu(user)
	expect(accordion().open).toBe(false)
})

test("the phone layout with the Meny and the accordion open has no axe violations", async () => {
	const user = userEvent.setup()
	stubDataFiles()
	const { container } = render(<App />)
	for (const el of container.querySelectorAll(".header-nav, .header-tools")) {
		el.setAttribute("hidden", "")
	}
	await openMenu(user)
	await openAccordion(user)
	expect(
		await axe(container, { rules: { "color-contrast": { enabled: false } } })
	).toHaveNoViolations()
})
```

In "Helsenorge leaves Varde's tab where it was, closes the Meny and refocuses its trigger", change the click target to the bar group's link:

```tsx
		await user.click(
			within(menu().getByRole("group", { name: "Offentlige tjenester" })).getByRole("link", {
				name: /^Helsenorge/,
			})
		)
```

In the last test ("the prerendered Meny is a native details..."), the Meny now holds the accordion's own `</details>`, so slice to the end of the Meny's `<nav>` instead, and update the comment:

```ts
	const meny = html.slice(start, html.indexOf("</nav>", start))
	// Matched with their lang attribute: "Se alle tjenester" also links to /sok, so href alone
	// would pass without the Norsk row.
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/headerMenu.test.tsx`
Expected: FAIL, there is no `details.services-accordion` and no "Offentlige tjenester" group.

- [ ] **Step 3: The accordion in the Meny**

In `web/src/components/HeaderMenu.tsx`: remove the `Link` import Task 4 added, import `ChevronDownIcon` from `./icons.tsx` and `ServicesGroups` from `./ServicesGroups.tsx`, add `const publicId = useId()` beside the other ids, update the file's top comment to say "Below 1024 px the services overview, the two external links and both pickers live here (UI polish spec: Below 1024 px: Meny; mega-menu spec: Phones and tablets)", and replace the first `.menu-group` (the one Task 4 wrote) with:

```tsx
					{/* Alle tjenester in a group of its own, so it never sits against a link that
					    leaves Varde. A nested disclosure without the picker class: usePicker's
					    one-open-surface rule leaves it alone, the arrows skip its rows while it is
					    closed, and closing the Meny closes it. Every link in it closes the Meny and
					    returns focus to the trigger; a route change then moves focus on to the new
					    heading. */}
					<div className="menu-group">
						<details className="services-accordion">
							<summary className="picker-row">
								<span>{t("header.allServices")}</span>
								<ChevronDownIcon className="services-chevron" />
							</summary>
							<div className="services-accordion-body">
								<ServicesGroups layout="accordion" onFollow={closeAndFocus} />
							</div>
						</details>
					</div>
					{/* biome-ignore lint/a11y/useSemanticElements: Workbench picker markup, as in Picker.tsx */}
					<div className="menu-group" role="group" aria-labelledby={publicId}>
						<span id={publicId} className="menu-group-label">
							{t("services.public")}
						</span>
						<HeaderLinks className="picker-row" onFollow={closeAndFocus} />
					</div>
```

- [ ] **Step 4: `usePicker` measures the room below an opened list**

In `web/src/hooks/usePicker.ts`, in `onToggle`, replace the `if (list) { const overflow ... }` block with:

```ts
		if (list) {
			const box = list.getBoundingClientRect()
			const overflow = EDGE_GAP - box.left
			if (overflow > 0) list.style.translate = `${overflow}px 0`
			// The room left below the list's top. The Meny's CSS caps its height with it, because
			// at scroll 0 on a phone the acute strip sits above the sticky header and a fixed
			// calc(100dvh - 8rem) would push its last rows below the screen.
			list.style.setProperty("--room", `${Math.floor(window.innerHeight - box.top - EDGE_GAP)}px`)
		}
```

- [ ] **Step 5: The accordion's and the sheet's CSS**

In `web/src/styles/main.css`, after the `.menu-list .picker-check { ... }` rule (line 340), add:

```css
	/* The Meny's list below 1024 px (mega-menu spec: Sheet). Below 640 px it is a sheet across
	   the header, hung from the sticky header itself; from 640 px it keeps the picker's
	   right-anchored shape at 22 rem, one width whether the accordion is open or not. It may
	   grow to the screen's height less 8 rem, or less where it starts lower (usePicker writes
	   --room on open), scrolls inside itself and never scrolls the page behind it. This replaces
	   the pickers' 24 rem cap for the Meny only. */
	.header-menu {
		position: static;
	}
	.menu-list {
		inset-inline: 0.5rem;
		inline-size: auto;
		max-inline-size: none;
		max-block-size: min(calc(100dvh - 8rem), var(--room, 100dvh));
		overscroll-behavior: contain;
	}
	@media (min-width: 640px) {
		.header-menu {
			position: relative;
		}
		.menu-list {
			inset-inline: auto 0;
			inline-size: min(22rem, 100vw - 2rem);
		}
	}
	/* Alle tjenester in the Meny: a picker row whose chevron sits in the check column, and the
	   same groups as the desktop panel, one column, hanging off a line that marks them as its
	   children. */
	.services-accordion > summary {
		list-style: none;
	}
	.services-accordion > summary::-webkit-details-marker {
		display: none;
	}
	.services-accordion > summary > .services-chevron {
		grid-column: 3;
		justify-self: end;
	}
	.services-accordion-body {
		margin-inline-start: 0.75rem;
		border-inline-start: 1px solid var(--border);
	}
	.services-stack .services-label {
		padding-block-start: 0.5rem;
	}
	@media (forced-colors: active) {
		.services-accordion-body {
			border-color: CanvasText;
		}
	}
```

These rules sit after `.picker` and `.picker-list`, so at equal specificity they win.

- [ ] **Step 6: Run the tests to see them pass, then the suite**

Run: `npx vitest run tests/headerMenu.test.tsx tests/picker.test.tsx`, then `npm test`
Expected: PASS.

- [ ] **Step 7: Red proofs**

One at a time, run `npx vitest run tests/headerMenu.test.tsx` and restore: (a) add `picker` to the accordion's class, see the "not a picker" assertion fail; (b) move the "Offentlige tjenester" group above the accordion's group, see the order test fail; (c) slice the prerender test back to `</details>`, see it fail (this one proves the fix is needed, then restore the `</nav>` slice).

- [ ] **Step 8: Commit**

```bash
git add web/src/components/HeaderMenu.tsx web/src/hooks/usePicker.ts web/src/styles/main.css web/tests/headerMenu.test.tsx
git commit -m "feat: list every service in the Meny as an accordion and widen it to a sheet on phones"
```

---

### Task 6: Browser checks, the spec amendment and the PR

**Files:**
- Create: `web/e2e/services.spec.ts`
- Modify: `web/e2e/helpers.ts`, `web/e2e/header.spec.ts`
- Docs (on `docs/mega-menu-spec`, not the feature branch): `docs/superpowers/specs/2026-10-15-varde-mega-menu-design.md`

**Interfaces:**
- Consumes: everything above, through the built site.
- Produces: `tabTo(page, selector)` and `axeHeader(page)` in `e2e/helpers.ts`.

- [ ] **Step 1: Shared helpers**

Move `tabTo` from `web/e2e/header.spec.ts` (lines 33-39) into `web/e2e/helpers.ts` as an export, import it back in `header.spec.ts`, and add the axe helper to `helpers.ts`:

```ts
export async function tabTo(page: Page, selector: string): Promise<void> {
	for (let i = 0; i < 40; i++) {
		await page.keyboard.press("Tab")
		if (await page.evaluate((s) => document.activeElement?.matches(s) ?? false, selector)) return
	}
	throw new Error(`Tab never reached ${selector}`)
}

type AxeRun = (
	context: Element,
	options: object
) => Promise<{ violations: { id: string; nodes: unknown[] }[] }>

// axe-core is already a devDependency (the unit tests use it through vitest-axe). In the browser
// it also checks colour contrast with the real CSS, which jsdom cannot. The header is the
// context, so the page's own content is not part of this check.
export async function axeHeader(page: Page): Promise<string[]> {
	await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" })
	return page.evaluate(async () => {
		const { axe } = window as unknown as { axe: { run: AxeRun } }
		const result = await axe.run(document.querySelector("header") as Element, {
			resultTypes: ["violations"],
		})
		return result.violations.map((v) => `${v.id} (${v.nodes.length})`)
	})
}
```

The limit goes from 30 to 40 Tabs: with the panel open, "Se alle tjenester" is the 19th stop after the trigger.

- [ ] **Step 2: Update the header checks for the second summary and the panel**

In `web/e2e/header.spec.ts`:

1. In `headerControls`, skip the panel's rows like the picker lists': change the filter to `.filter((el) => !el.closest(".picker-list, .services-panel") && el.checkVisibility())`.
2. In the one-row test, after `const rows = rowsOf(boxes)`, add the trigger check (spec: the header stays one row with the panel's trigger in it):

```ts
				if (width >= 1024)
					expect(
						rows[0].some((b) => /^SUMMARY (Alle tjenester|All services)/.test(b.label)),
						boxes.map((b) => b.label).join(" | ")
					).toBe(true)
```

3. The Meny now holds two summaries, so every `menu.locator("summary")` (the 8 px edge test, the arrows test, the text-edge test and the "a Meny link navigates" test) becomes `menu.locator(":scope > summary")`, or Playwright's strict mode fails on two matches.
4. In "the Meny opens on its first row...", change `menu.getByRole("link", { name: "Alle tjenester" })` to `menu.locator("details.services-accordion > summary")`.
5. Replace "a Meny link navigates and the Meny closes with the page change" with:

```ts
test("a category in the Meny's accordion navigates and the Meny closes with the page change", async ({
	page,
}) => {
	await page.setViewportSize({ width: 375, height: 812 })
	await page.goto("/")
	const menu = page.locator("header details.header-menu")
	await menu.locator(":scope > summary").click()
	await menu.locator("details.services-accordion > summary").click()
	await menu.getByRole("link", { name: "Bolig" }).click()
	await expect(page).toHaveURL(/\/sok\?category=bolig$/)
	await expect(menu).not.toHaveAttribute("open")
})
```

6. In the text-edge test, the accordion's own rows are indented on purpose, so leave them out: `const rows = [...document.querySelectorAll<HTMLElement>(".menu-list .picker-row")].filter((row) => !row.closest(".services-accordion-body"))`.

- [ ] **Step 3: Write the mega-menu browser checks**

Create `web/e2e/services.spec.ts`:

```ts
import { expect, type Page, test } from "@playwright/test"
import { axeHeader, noHorizontalScroll, setTheme, settle, tabTo, THEMES } from "./helpers.ts"

const panel = (page: Page) => page.locator("header details.services")

async function openPanel(page: Page) {
	await panel(page).locator(":scope > summary").click()
	await expect(panel(page)).toHaveAttribute("open", "")
}

async function openMenuAndAccordion(page: Page) {
	const menu = page.locator("header details.header-menu")
	await menu.locator(":scope > summary").click()
	await expect(menu.locator(".picker-row:focus")).toHaveCount(1)
	await menu.locator("details.services-accordion > summary").click()
	await expect(menu.locator("details.services-accordion")).toHaveAttribute("open", "")
	return menu
}

test("at 1280 x 800 the first column, its row highlights and Se alle tjenester start on the brand's edge; rows are 44 px; dividers run the full height", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1280, height: 800 })
	await page.goto("/")
	await settle(page)
	await openPanel(page)
	const m = await page.evaluate(() => {
		const left = (el: Element) => Math.round(el.getBoundingClientRect().left)
		const body = document.querySelector(".services-body") as HTMLElement
		const cols = [...body.querySelectorAll<HTMLElement>(":scope > .services-col")]
		const firstColRows = [...cols[0].querySelectorAll<HTMLElement>(".picker-row")]
		const height = (el: Element) => el.getBoundingClientRect().height
		const lines = (el: HTMLElement) =>
			Math.round(
				(height(el) - 16) / Number.parseFloat(getComputedStyle(el).lineHeight)
			)
		return {
			brand: left(document.querySelector("header a[aria-label]") as Element),
			firstCol: left(cols[0]),
			rowStarts: [...new Set(firstColRows.filter((_, i) => i % 3 === 0).map(left))],
			all: left(document.querySelector(".services-all") as Element),
			rows: [...document.querySelectorAll<HTMLElement>(".services-panel .picker-row")].map(
				(r) => ({ text: r.textContent, height: height(r), lines: lines(r) })
			),
			dividers: cols.slice(1).map((c) => Math.round(height(c))),
			body: Math.round(height(body)),
		}
	})
	expect(m.firstCol).toBe(m.brand)
	expect(m.rowStarts).toEqual([m.brand])
	expect(m.all).toBe(m.brand)
	for (const row of m.rows) {
		expect(row.height, row.text ?? "").toBeGreaterThanOrEqual(44)
		if (row.lines === 1) expect(row.height, row.text ?? "").toBeCloseTo(44, 0)
	}
	expect(m.dividers).toEqual([m.body, m.body])
})

for (const path of ["/", "/en/"]) {
	test(`at 1024 x 800 (${path}) the first row of every column starts on one line`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1024, height: 800 })
		await page.goto(path)
		await settle(page)
		await openPanel(page)
		const tops = await page.evaluate(() =>
			[...document.querySelectorAll(".services-body > .services-col")].map((col) =>
				Math.round((col.querySelector(".picker-row") as Element).getBoundingClientRect().top)
			)
		)
		expect(new Set(tops).size, `first-row tops ${tops}`).toBe(1)
	})
}

// WCAG 2.4.11: the panel moves with the sticky header, so it must scroll inside itself.
// Review Focus: the same with text at 200 %, where the header may wrap.
for (const [width, height, textSize] of [
	[1024, 500, "100%"],
	[1280, 800, "200%"],
] as const) {
	test(`at ${width} x ${height} with text at ${textSize}, Tab reaches Se alle tjenester inside the screen`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height })
		await page.goto("/")
		await settle(page)
		await page.evaluate((size) => {
			document.documentElement.style.fontSize = size
		}, textSize)
		await tabTo(page, "details.services > summary")
		await page.keyboard.press("Enter")
		await expect(panel(page)).toHaveAttribute("open", "")
		await tabTo(page, ".services-all")
		const box = await page.locator(".services-all").boundingBox()
		if (!box) throw new Error("no Se alle tjenester box")
		expect(box.y).toBeGreaterThanOrEqual(0)
		expect(box.y + box.height).toBeLessThanOrEqual(height)
		expect(await noHorizontalScroll(page)).toBe(true)
		// Three columns at default text, the groups stacked at 200 % (the container query).
		const tracks = await page
			.locator(".services-body")
			.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length)
		expect(tracks).toBe(textSize === "100%" ? 3 : 1)
	})
}

// At scroll 0 the acute strip sits above the sticky header, the tallest case for the sheet.
for (const viewport of [
	{ width: 320, height: 640 },
	{ width: 375, height: 812 },
	{ width: 800, height: 600 },
]) {
	test(`at ${viewport.width} x ${viewport.height} the Meny with Alle tjenester open stays inside the screen and its last row is reachable`, async ({
		page,
	}) => {
		await page.setViewportSize(viewport)
		for (const path of ["/", "/en/"]) {
			await page.goto(path)
			await settle(page)
			const menu = await openMenuAndAccordion(page)
			const box = await menu.locator(".menu-list").evaluate((el) => {
				const r = el.getBoundingClientRect()
				return {
					left: r.left,
					right: r.right,
					bottom: r.bottom,
					width: document.documentElement.clientWidth,
				}
			})
			expect(box.left, path).toBeGreaterThanOrEqual(8)
			expect(box.right, path).toBeLessThanOrEqual(box.width - 8)
			expect(box.bottom, path).toBeLessThanOrEqual(viewport.height)
			expect(await noHorizontalScroll(page), path).toBe(true)
			const last = menu.getByRole("button", { name: "System" })
			await last.scrollIntoViewIfNeeded()
			const lastBox = await last.boundingBox()
			if (!lastBox) throw new Error("no System row box")
			expect(lastBox.y + lastBox.height, path).toBeLessThanOrEqual(viewport.height)
			// Closed, Alle tjenester never sits against a link that leaves Varde: the group rule
			// and the Offentlige tjenester label lie between them (41 px in the prototype).
			await menu.locator("details.services-accordion > summary").click()
			const gap = await menu.evaluate((el) => {
				const groups = el.querySelectorAll(".menu-list > .menu-group")
				const summary = groups[0].querySelector("summary") as Element
				const helsenorge = groups[1].querySelector("a") as Element
				return helsenorge.getBoundingClientRect().top - summary.getBoundingClientRect().bottom
			})
			expect(gap, path).toBeGreaterThanOrEqual(40)
			await page.keyboard.press("Escape")
		}
	})
}

for (const theme of THEMES) {
	test(`axe finds nothing in the header with the panel open (${theme})`, async ({ page }) => {
		await setTheme(page, theme)
		await page.setViewportSize({ width: 1280, height: 800 })
		await page.goto("/")
		await openPanel(page)
		expect(await axeHeader(page)).toEqual([])
	})

	test(`axe finds nothing in the header with the Meny and Alle tjenester open (${theme})`, async ({
		page,
	}) => {
		await setTheme(page, theme)
		await page.setViewportSize({ width: 375, height: 812 })
		await page.goto("/")
		await openMenuAndAccordion(page)
		expect(await axeHeader(page)).toEqual([])
	})
}

test("forced colours keep the panel's border, its dividers and a row's focus ring visible", async ({
	page,
}) => {
	await page.emulateMedia({ forcedColors: "active" })
	await page.setViewportSize({ width: 1280, height: 800 })
	await page.goto("/")
	await tabTo(page, "details.services > summary")
	await page.keyboard.press("Enter")
	await page.keyboard.press("Tab")
	const s = await page.evaluate(() => {
		const style = (selector: string) =>
			getComputedStyle(document.querySelector(selector) as Element)
		const row = getComputedStyle(document.activeElement as Element)
		return {
			panel: style(".services-panel").borderTopColor,
			divider: style(".services-body > .services-col + .services-col").borderInlineStartColor,
			outline: row.outlineStyle,
			outlineWidth: Number.parseFloat(row.outlineWidth),
			inPanel: !!document.activeElement?.closest(".services-panel"),
		}
	})
	expect(s.inPanel).toBe(true)
	expect(s.panel).not.toBe("rgba(0, 0, 0, 0)")
	expect(s.divider).not.toBe("rgba(0, 0, 0, 0)")
	expect(s.outline).not.toBe("none")
	expect(s.outlineWidth).toBeGreaterThanOrEqual(2)
})

test("a category in the panel lands on its list with the panel closed", async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 800 })
	await page.goto("/")
	await openPanel(page)
	await panel(page).getByRole("link", { name: "Bolig" }).click()
	await expect(page).toHaveURL(/\/sok\?category=bolig$/)
	await expect(panel(page)).not.toHaveAttribute("open")
	await expect(
		panel(page).locator('.picker-row[aria-current="true"]', { hasText: "Bolig" })
	).toHaveCount(1)
})
```

The `lines` helper reads a row's text lines from its height less its 16 px of vertical padding, so a helpline name that wraps is allowed to be taller (Decided: at least 44 px).

- [ ] **Step 4: Build and run the browser checks**

Run: `npm run build:site`, then `npx playwright test`
Expected: PASS. If the 1280 x 800 alignment check fails by 1 px on the foot link, read both numbers before changing anything: the foot's `calc` and the body's `margin-inline: auto` must land on the same pixel, and the fix is in the CSS, never a looser assertion.

- [ ] **Step 5: Red proofs**

One at a time, rebuild (`npm run build:site`), run `npx playwright test e2e/services.spec.ts` and restore: (a) remove `grid-template-rows: subgrid` from `.services-body > .services-col`, see the 1024 one-line check fail in English; (b) remove `overflow-y: auto` from `.services-panel`, see the 1024 x 500 check fail; (c) set `.menu-list`'s `max-block-size` back to `calc(100dvh - 8rem)`, see the 320 x 640 sheet check fail on its bottom edge (if it passes, the strip is shorter than I measured from the code: record the real numbers in the PR and keep the `--room` rule, since 2.4.11 still needs it at larger text sizes); (d) remove the forced-colours border rule and set `.services-panel { border-block: 1px solid transparent }`, see the forced-colours check fail; (e) change the container query to `(min-width: 1rem)`, see the 200 % check find 3 tracks; (f) remove the `.menu-group-label` from the Offentlige tjenester group, see the 40 px gap check fail.

- [ ] **Step 6: Look at it**

Start the preview (`preview_start` with the project's launch config, or `npm run preview`) and take screenshots for the PR: 1280 x 800 panel open in both themes, 1024 x 800 panel open in English, 375 x 812 Meny with the accordion open, and 320 x 640 the same. Check every row of controls by the house rules: one height, one bottom edge, labels set apart from rows by weight, size and colour. Two rounds at most, then put what is left in front of Malin.

- [ ] **Step 7: Manual checks for the PR description (Malin)**

- NVDA, Chrome, desktop: Tab to "Alle tjenester" (announced as a button, collapsed), Enter (expanded), Tab into the panel ("Kategorier, liste, 9 elementer"), Escape (back on the trigger, collapsed).
- NVDA, phone layout (Chrome at 375 px): Meny opens on "Alle tjenester", Down arrow goes to Helsenorge while it is closed, Enter opens it, Down arrow enters "Kategorier".
- Ctrl+F "Bolig" on `/` at 1280 px: the panel opens to show the match and the find bar keeps focus.

- [ ] **Step 8: Commit the browser checks**

```bash
git add web/e2e/services.spec.ts web/e2e/helpers.ts web/e2e/header.spec.ts
git commit -m "test: check the services panel and the Meny accordion in a real browser"
```

- [ ] **Step 9: Amend the spec on `docs/mega-menu-spec`**

The spec branch is never checked out from a feature branch. Edit the local, git-excluded copy, then commit it to the docs branch with a temporary index (from the repo root):

1. In the spec, Behaviour, Phone accordion: "its row list keeps only rows that are rendered (`checkVisibility()`)" becomes "its row list skips rows inside a closed nested `<details>` (that `<details>`' own summary row stays); jsdom has no `checkVisibility()`, and the open state is the same fact".
2. In "One source, two layouts": "A test reads the exported data" becomes "Tests read the seed and the committed data snapshot, and the prerender checks the live export".
3. In "Sheet": add "or less where it starts lower: on open, `usePicker` writes the room below the list's top into `--room`, and the sheet takes the smaller value".
4. In "Desktop: the panel", Trigger: "(no turn under `prefers-reduced-motion`)" becomes "(the turn is not animated under `prefers-reduced-motion`; the chevron still turns, since it marks the open trigger in forced colours)".
5. In Behaviour, Desktop panel: add "Opening moves focus only after a click on the trigger (mouse, Enter or Space); an open from find-in-page moves none. The panel runs on `usePicker` with `focusOnOpen: "none"` and `arrows: false`."
6. In Testing, End to end: "every row is 44 px" becomes "every row is at least 44 px, and every single-line row is 44 px".
7. In "Desktop: the panel", Layout: add "Three columns from 60 rem of panel width (a container query, so it follows the reader's text size); below that the groups stack, as in the accordion."
8. In Behaviour, Desktop panel: "A link to the route already shown, or a new tab, leaves focus on the trigger" gains "; a link to the exact page already shown does not navigate again, as the current language row".

```bash
git fetch origin
tip=$(git rev-parse origin/docs/mega-menu-spec)
export GIT_INDEX_FILE="$(git rev-parse --git-dir)/mega-menu-spec.index"
git read-tree "$tip"
blob=$(git hash-object -w docs/superpowers/specs/2026-10-15-varde-mega-menu-design.md)
git update-index --add --cacheinfo 100644,"$blob",docs/superpowers/specs/2026-10-15-varde-mega-menu-design.md
tree=$(git write-tree)
commit=$(git commit-tree "$tree" -p "$tip" -m "docs: amend the mega-menu spec with the plan's decisions")
git update-ref refs/heads/docs/mega-menu-spec "$commit"
unset GIT_INDEX_FILE
rm "$(git rev-parse --git-dir)/mega-menu-spec.index"
git push origin docs/mega-menu-spec
```

- [ ] **Step 10: Ship**

Follow "Shipping the PR", steps 3 and 4. PR body draft:

```markdown
## What changed

"Alle tjenester" in the header now opens on click and shows everything Varde covers: the nine categories, the five helplines, Helsenorge and NAV, and Om Varde, plus "Se alle tjenester". From 1024 px it is a full-width panel under the header; below that it is an accordion at the top of the Meny, which is now a sheet across the header on phones. Both are native `<details>` disclosures, so they work before JavaScript, and they share the picker's close rules (Escape, a click outside, focus leaving, one open surface at a time).

- `ServicesGroups` renders the groups once for both layouts.
- `usePicker` skips the rows of a closed accordion, moves focus on open only after a click on its own trigger (find-in-page no longer pulls focus), closes nested disclosures with the Meny, and covers the panel with `focusOnOpen: "none"` and `arrows: false`.
- The helpline names are copied from the seed, and the build fails if the live data names one differently.

Spec: `docs/superpowers/specs/2026-10-15-varde-mega-menu-design.md` (on `docs/mega-menu-spec`, amended with this plan's decisions).

## Red proofs

| Check | Break | Red result |
|---|---|---|
| (one row per break from Tasks 1 to 6) | | |

## Manual, before merge

- [ ] NVDA desktop: trigger announced collapsed and expanded, "Kategorier, liste, 9 elementer", Escape back to the trigger.
- [ ] NVDA phone layout: Meny opens on "Alle tjenester", arrows skip it while closed and enter it when open.
- [ ] Ctrl+F "Bolig" at 1280 px: the panel opens and the find bar keeps focus.
- [ ] Screenshots attached: 1280 x 800 both themes, 1024 x 800 English, 375 x 812 and 320 x 640 with the accordion open.
```

Fill the red-proofs table from the notes taken at each task's red-proof step before opening the PR.

---

## Spec coverage

| Spec item | Task |
|---|---|
| Decision 1, click never hover | 4, 5 (no hover rules; Global Constraints) |
| Decision 2, a disclosure not a menu | 4, 5 |
| Decision 3, four groups and Se alle tjenester | 3 |
| Decision 4, no emergency numbers | 3 (nothing from `emergency.ts` is imported) |
| Decision 5, Helsenorge and NAV in the bar and the panel | 4 |
| Decision 6, hairline dividers, labels that look like labels | 4 (CSS), 6 (alignment, forced colours) |
| Decision 7, an accordion in the Meny in its own group | 5 |
| Trigger, chevron, accessible name | 4 |
| Position, height, layout, subgrid | 4 (CSS), 6 (1280, 1024, 1024 x 500) |
| Column table and links (categories, helplines, external, Om, Se alle) | 3 |
| Current category with `aria-current` | 3, 6 |
| Forced colours | 4, 5 (CSS), 6 |
| Header bar unchanged, one row | 4, 6 |
| Meny order and the 41 px separation | 5 (order test; the separation follows from the group divider and the Offentlige tjenester label) |
| The accordion, closed each time the Meny opens | 2, 5 |
| Sheet below 640 px, 22 rem from 640 px, height and overscroll | 5 (CSS), 6 |
| One source, `ServicesGroups`, `layout` prop | 3 |
| `HELPLINE_NAMES` and its drift test | 1 |
| New i18n keys | 3 |
| Desktop behaviour: toggle, Escape, outside, focus out, follow, route change, one surface, Safari, find-in-page | 2, 4 |
| Phone behaviour: first row, arrows skip a closed accordion, Escape, follow, not a picker, nested toggle | 2, 5 |
| Screen readers: `ul aria-labelledby`, span labels, button with state | 3, 4, 6 (manual NVDA) |
| Touch: click only, 44 px targets | 4, 5, 6 |
| Testing, unit list | 1 to 5 |
| Testing, end to end list | 6 |

## Considered and rejected

- **A second hook for the panel.** It would copy `usePicker`'s pointer-down, blur and Escape rules, and the two copies could drift. Two options on `usePicker` cost less.
- **Stubbing `checkVisibility()` in jsdom.** The unit test would then check the stub, not the rule. Reading the `<details>` open state works the same in both places.
- **Checking the helpline names inside the browser's `pickHelplines`.** A mismatch there would break the landing page for a visitor; the build is the right place to fail.
- **A JavaScript-sized desktop panel.** At desktop widths the strip and the header together stay under 8 rem at default text size, so the spec's CSS value holds there; only the Meny gets `--room`.
- **Find-in-page opening the Meny on a phone** (stress test). The Meny now holds every category name, so Chrome's find bar opens the sheet over the page for a search like "rus". The spec accepts the same for the desktop panel, and the only way out (rendering the accordion's rows after hydration) would leave it empty before JavaScript. The focus fix in Task 2 keeps the find bar usable, so I accept it.
- **Closing the surfaces when the window crosses 1024 px** (stress test). Rotating a tablet with the panel open hides it while it stays open, and it is open again on the way back. The Meny already behaves this way, one click closes it, and nothing traps focus, so a `matchMedia` listener is not worth it.
- **A stale `--room` after scrolling or rotating with the Meny open** (stress test). Scrolling only moves the sheet up, so the stored room is smaller than needed, never larger. A rotation can make it wrong until the next open, which is rare and fixes itself.
- **A click on a trigger that never toggles** (stress test) would leave `fromTrigger` armed for the next open. Nothing in Varde cancels a `<summary>` click, so I add no reset.
- **A hydration mismatch on `aria-current`** (stress test). The prerender has one `/sok` page with no query, but `canHydrate` already renders any `/sok?...` URL from scratch, so a direct load of `/sok?category=bolig` never hydrates against it. Checked in `web/src/services/urlState.ts`.

> Stress-tested 2026-10-15 (skill 1b85fca): 3 applied, 1 adapted, 1 decided by me.
