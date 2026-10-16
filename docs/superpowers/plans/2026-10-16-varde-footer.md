# Sanity-style footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Varde's footer in the style of the Sanity.io footer: the liability sentence, the
text links under a muted label, a small uppercase privacy note with "© Varde", the GitHub mark as
an icon and the theme switcher as a three-icon pill, which replaces the desktop header's Tema
picker.

**Architecture:** `Footer.tsx` keeps one DOM order at every width; CSS stacks it below 1024 px
and lays it in one 44 px row from 1280 px. `App` owns the one theme state (`useThemeChoice()`)
and passes it to `Header` (for the Meny rows) and to `Footer` (for the new `ThemePill`). The
acute strip's Escape-to-hide tooltip logic moves into a `useDismissibleTips()` hook that the strip
and the footer share.

**Tech Stack:** React 19 + TypeScript, Tailwind v4 plus `web/src/styles/main.css` components,
Vitest + Testing Library + jest-axe, Playwright, Biome.

**Spec:** `docs/superpowers/specs/2026-10-16-varde-footer-design.md` (read it before Task 1).

## Global Constraints

- Branch `feat/footer` from `main`. All commands run from `web/` unless a step says otherwise.
- Web only: no API, database or PostgreSQL needed.
- Every interactive footer control is 44 x 44 px or `min-h-11` (44 px tall); controls on one row
  share one bottom edge.
- From 1280 px (both languages, both themes) the footer is one row and at most 69 px tall; the
  landing page still fits 1920 x 950 (`e2e/landing.spec.ts`, unchanged).
- Accessible names in both languages; uppercase only through CSS `text-transform`, never in the
  strings.
- No em dashes in code, comments, strings or commit messages. Comments in my first-person voice
  where they speak about decisions ("I keep …"), matching the existing comments.
- Biome formatting (tabs, double quotes, no semicolons). Run `npm run check` before each commit.
- Commit messages: `feat:` / `test:` / `refactor:` prefixes as in `git log`; no AI attribution.
- Never type the GitHub mark's path from memory; copy it from the Octicons source (Task 2).

## Review Focus

1. **Text at 200 %** (a reader's browser font setting): the footer wraps and never scrolls
   sideways at 375 or 1280 px. Pinned in Task 4 (`200 %` test).
2. **A narrow desktop window with a mouse** (320 px): the GitHub tooltip at the left edge and the
   Mørkt tooltip at the right edge stay on screen. Pinned in Task 4 (tooltip test at 320).
3. **Storage blocked** (Safari private mode, cookies off): the pill still renders and an in-page
   Mørkt survives an OS theme flip. Pinned in Task 3 (moved picker tests).
4. **A choice in the footer pill on a phone, then opening the Meny**: the Meny shows the same
   pressed row. Pinned in Task 3 (`a pill choice updates the Meny` test).
5. **English, the longest row** (16 px spare at 1280): one row, not two. Pinned in Task 4 (one-row
   test runs nb and en).

---

### Task 1: `useDismissibleTips` hook, used by the acute strip

**Files:**
- Create: `web/src/hooks/useDismissibleTips.ts`
- Modify: `web/src/components/AcuteStrip.tsx:1-27,34,44-45`
- Test: `web/tests/dismissibleTips.test.tsx` (new), `web/tests/strip.test.tsx` (unchanged, must stay green)

**Interfaces:**
- Produces: `useDismissibleTips(): { hidden: boolean; show: () => void }`. Task 2 calls it in
  `Footer`.

- [ ] **Step 1: Write the failing test**

`web/tests/dismissibleTips.test.tsx`:

```tsx
import { act, fireEvent, renderHook } from "@testing-library/react"
import { expect, test } from "vitest"
import { useDismissibleTips } from "../src/hooks/useDismissibleTips.ts"

test("Escape hides the tips until show() is called", () => {
	const { result } = renderHook(() => useDismissibleTips())
	expect(result.current.hidden).toBe(false)
	act(() => {
		fireEvent.keyDown(document, { key: "Escape" })
	})
	expect(result.current.hidden).toBe(true)
	act(() => result.current.show())
	expect(result.current.hidden).toBe(false)
})

test("other keys leave the tips alone", () => {
	const { result } = renderHook(() => useDismissibleTips())
	act(() => {
		fireEvent.keyDown(document, { key: "Enter" })
	})
	expect(result.current.hidden).toBe(false)
})

test("the listener is removed on unmount", () => {
	const { result, unmount } = renderHook(() => useDismissibleTips())
	unmount()
	fireEvent.keyDown(document, { key: "Escape" })
	expect(result.current.hidden).toBe(false)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/dismissibleTips.test.tsx`
Expected: FAIL, cannot resolve `../src/hooks/useDismissibleTips.ts`.

- [ ] **Step 3: Write the hook**

`web/src/hooks/useDismissibleTips.ts`:

```ts
import { useEffect, useState } from "react"

// Hover tooltips must be dismissible without moving the pointer (WCAG 1.4.13). Escape hides a
// group's tips until the pointer enters or focus lands on one of its controls, which calls show().
// The acute strip and the footer each call this once.
export function useDismissibleTips() {
	const [hidden, setHidden] = useState(false)
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setHidden(true)
		}
		document.addEventListener("keydown", onKeyDown)
		return () => document.removeEventListener("keydown", onKeyDown)
	}, [])
	return { hidden, show: () => setHidden(false) }
}
```

- [ ] **Step 4: Use it in the acute strip**

In `web/src/components/AcuteStrip.tsx`, replace the `tipsHidden` state, its effect and
`showTips` (lines 18-27) with:

```tsx
	// Escape closes the tooltips (WCAG 1.4.13) until the pointer enters or focus lands on a link.
	const tips = useDismissibleTips()
```

Then `data-tips={tipsHidden ? "hidden" : undefined}` becomes
`data-tips={tips.hidden ? "hidden" : undefined}`, and `onPointerEnter={showTips}` /
`onFocus={showTips}` become `onPointerEnter={tips.show}` / `onFocus={tips.show}`. Add
`import { useDismissibleTips } from "../hooks/useDismissibleTips.ts"` and remove `useEffect` /
`useState` from the React import if nothing else in the file uses them.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/dismissibleTips.test.tsx tests/strip.test.tsx`
Expected: PASS (3 new tests, and the strip's "each tel link holds its label as a hidden tooltip
that Escape closes" still passes).

- [ ] **Step 6: Commit**

```bash
npm run check
git add src/hooks/useDismissibleTips.ts src/components/AcuteStrip.tsx tests/dismissibleTips.test.tsx
git commit -m "refactor: move the strip's Escape-to-hide tooltips into useDismissibleTips"
```

---

### Task 2: The new footer layout (label, links, note, GitHub icon, tooltips)

**Files:**
- Modify: `web/src/components/Footer.tsx` (whole file)
- Modify: `web/src/components/icons.tsx` (append `GitHubIcon`)
- Modify: `web/src/i18n/nb.json:107-111`, `web/src/i18n/en.json:107-111`
- Modify: `web/src/styles/main.css:354-382` (tooltip look split) and append the footer rules after the strip block
- Test: `web/tests/footer.test.tsx`

**Interfaces:**
- Consumes: `useDismissibleTips()` from Task 1.
- Produces: `GitHubIcon({ className? })` in `icons.tsx`; CSS classes `.footer-row`,
  `.footer-liability`, `.footer-label`, `.footer-note`, `.footer-bar`, `.footer-tip-host`,
  `.footer-tip`, `.footer-tip-bubble`, `.footer-tip-start`, `.footer-tip-end`. Task 3 puts the
  pill inside `.footer-bar` and uses `.footer-tip*` on its buttons.

- [ ] **Step 1: Write the failing tests**

Replace `web/tests/footer.test.tsx` with:

```tsx
import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, expect, test } from "vitest"
import { App } from "../src/App.tsx"
import { stubDataFiles } from "./stubData.ts"

afterEach(() => {
	window.history.replaceState(null, "", "/")
})

const footer = () => screen.getByRole("contentinfo")

test.each(["/", "/sok", "/om", "/nope"])(
	"%s carries the liability line, the footer nav, the note and the GitHub icon",
	(path) => {
		stubDataFiles()
		window.history.replaceState(null, "", path)
		render(<App />)
		const f = footer()
		expect(f).toHaveTextContent(
			"Varde er en oversikt, ikke en nødtjeneste. Ved fare for liv og helse, ring 113."
		)
		expect(within(f).getByRole("link", { name: "113" })).toHaveAttribute("href", "tel:113")
		const nav = within(f).getByRole("navigation", { name: "Om nettstedet" })
		expect(within(nav).getByRole("link", { name: "Om Varde og ansvar" })).toHaveAttribute(
			"href",
			"/om"
		)
		expect(within(nav).getByRole("link", { name: "Meld feil" })).toHaveAttribute(
			"href",
			"/om#meld-feil"
		)
		const github = within(f).getByRole("link", { name: "Kildekode på GitHub" })
		expect(github).toHaveAttribute("href", "https://github.com/malinfossum/varde")
		expect(github).toHaveAttribute("rel", "noopener noreferrer")
		expect(github.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
		// The name comes from the hidden span; the tooltip repeats it and is hidden from readers.
		expect(github.querySelector(".footer-tip")).toHaveAttribute("aria-hidden", "true")
		const note = f.querySelector(".footer-note") as HTMLElement
		expect(note).toHaveTextContent("© Varde · Ingen sporing. Ingen informasjonskapsler.")
		expect(within(note).getByText("·")).toHaveAttribute("aria-hidden", "true")
	}
)

test("the English footer is in English", () => {
	stubDataFiles()
	window.history.replaceState(null, "", "/en/")
	render(<App />)
	const f = footer()
	expect(f).toHaveTextContent(
		"Varde is a directory, not an emergency service. If life or health is in danger, call 113."
	)
	const nav = within(f).getByRole("navigation", { name: "About this site" })
	expect(within(nav).getByRole("link", { name: "Report an error" })).toHaveAttribute(
		"href",
		"/en/om#meld-feil"
	)
	expect(within(nav).getByRole("link", { name: "About Varde and liability" })).toHaveAttribute(
		"href",
		"/en/om"
	)
	expect(within(f).getByRole("link", { name: "Source code on GitHub" })).toBeInTheDocument()
	expect(f.querySelector(".footer-note")).toHaveTextContent("© Varde · No tracking. No cookies.")
})

test("Escape hides the footer tooltips until focus returns to a footer control", () => {
	stubDataFiles()
	render(<App />)
	const row = footer().querySelector(".footer-row") as HTMLElement
	act(() => {
		fireEvent.keyDown(document, { key: "Escape" })
	})
	expect(row).toHaveAttribute("data-tips", "hidden")
	act(() => {
		within(footer()).getByRole("link", { name: "Kildekode på GitHub" }).focus()
	})
	expect(row).not.toHaveAttribute("data-tips")
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/footer.test.tsx`
Expected: FAIL, no navigation named "Om nettstedet".

- [ ] **Step 3: Update the strings**

In `web/src/i18n/nb.json`, replace the `footer.source` to `footer.report` block (lines 107-111) with:

```json
	"footer.source": "Kildekode på GitHub",
	"footer.noTracking": "Ingen sporing.",
	"footer.noCookies": "Ingen informasjonskapsler.",
	"footer.label": "Om nettstedet",
	"footer.liability": "Varde er en oversikt, ikke en nødtjeneste. Ved fare for liv og helse, ring",
	"footer.about": "Om Varde og ansvar",
	"footer.report": "Meld feil",
```

In `web/src/i18n/en.json`, the same block becomes:

```json
	"footer.source": "Source code on GitHub",
	"footer.noTracking": "No tracking.",
	"footer.noCookies": "No cookies.",
	"footer.label": "About this site",
	"footer.liability": "Varde is a directory, not an emergency service. If life or health is in danger, call",
	"footer.about": "About Varde and liability",
	"footer.report": "Report an error",
```

Keep whatever trailing comma the line after the block needs. Then
`grep -rn "footer.noTracking" src tests` and update any other user of the old one-line string.

- [ ] **Step 4: Copy the GitHub mark from its source**

Run (from the repo root, read-only):

```bash
curl -sL https://raw.githubusercontent.com/primer/octicons/main/icons/mark-github-24.svg
curl -sL https://raw.githubusercontent.com/primer/octicons/main/LICENSE | head -5
```

Copy only the `d` attribute of the `<path>`; never paste the whole file (an SVG can carry
script or foreign content). Confirm the licence is MIT, and read https://github.com/logos (GitHub's logo guidelines) to
confirm the unaltered mark may link to a GitHub repository. If either is not true, stop and ask
Malin. Append to `web/src/components/icons.tsx`, pasting the `d` attribute exactly as the SVG
gives it (the SVG's own `viewBox` is `0 0 24 24`; if it differs, use the SVG's value):

```tsx
// GitHub's own mark, the one filled brand icon among the stroke icons, on purpose: a brand mark
// is drawn the way its owner draws it. Path copied from primer/octicons mark-github-24.svg (MIT,
// checked <date of the check>), used unaltered as a link to the repository, as GitHub's logo
// guidelines allow. Never recolour it beyond currentColor.
export function GitHubIcon({ className }: IconProps) {
	return (
		<svg
			className={className}
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true"
			focusable="false"
		>
			<path d="<the d attribute from mark-github-24.svg>" />
		</svg>
	)
}
```

Fill in the date by running `date +"%Y-%m-%d"`. The two `<…>` markers above are the only values
the engineer supplies, and both come from a command's output.

- [ ] **Step 5: Split the tooltip look from its position, add the footer rules**

In `web/src/styles/main.css`, replace the `.strip-tip { … }` rule (lines 357-373) with:

```css
	.strip-tip,
	.footer-tip-bubble {
		padding: 0.25rem 0.5rem;
		white-space: nowrap;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.16);
	}
	.strip-tip {
		display: none;
		position: absolute;
		inset-block-start: 100%;
		inset-inline-start: 50%;
		translate: -50% 0;
		z-index: 30;
	}
```

After the strip's `@media (hover: hover) and (pointer: fine) { … }` block, still inside the same
`@layer components { … }` block, append:

```css
	/* The footer (spec 2026-10-16 footer). The label and the note are small uppercase text, set
	   apart from the links by size and case; one tracking for both, so they read as one voice. */
	.footer-label,
	.footer-note {
		font-size: 0.75rem;
		line-height: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: var(--muted);
	}
	/* Footer tooltips open above their control, because the footer sits at the bottom of the
	   screen. The 6 px gap is the tooltip's own transparent padding, so the pointer can move onto
	   the bubble without leaving the hover area (WCAG 1.4.13). Start and end alignment keep the
	   tooltips at the page edges on screen. */
	.footer-tip-host {
		position: relative;
	}
	.footer-tip {
		display: none;
		position: absolute;
		inset-block-end: 100%;
		inset-inline-start: 50%;
		translate: -50% 0;
		z-index: 30;
		padding-block-end: 6px;
	}
	.footer-tip-start {
		inset-inline-start: 0;
		translate: none;
	}
	.footer-tip-end {
		inset-inline-start: auto;
		inset-inline-end: 0;
		translate: none;
	}
	.footer-tip-bubble {
		display: block;
	}
	@media (hover: hover) and (pointer: fine) {
		.footer-tip-host:hover .footer-tip,
		.footer-tip-host:focus-visible .footer-tip {
			display: block;
		}
		.footer-row[data-tips="hidden"] .footer-tip {
			display: none;
		}
	}
```

- [ ] **Step 6: Rewrite the footer**

`web/src/components/Footer.tsx`:

```tsx
import { useId } from "react"
import { useDismissibleTips } from "../hooks/useDismissibleTips.ts"
import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { emergencyLines, telHref } from "../services/emergency.ts"
import { pathFor } from "../services/urlState.ts"
import { GitHubIcon } from "./icons.tsx"
import { Link } from "./Link.tsx"

// 113 comes from emergency.ts, which tests/emergency.test.ts checks against the seed.
const ambulance = emergencyLines.find((line) => line.id === "ambulanse")

// The Sanity-style footer (spec: docs/superpowers/specs/2026-10-16-varde-footer-design.md). One
// DOM order at every width: liability, the links, the note, then the icon controls. Below
// 1024 px it stacks; from 1280 px it is one 44 px row and stays 69 px tall, which the landing
// needs to fit one 1920 x 950 screen. Between 1024 and about 1100 px whole groups wrap.
export function Footer() {
	const t = useTranslation()
	const { lang } = useLanguage()
	const tips = useDismissibleTips()
	const labelId = useId()
	return (
		<footer className="mt-6 border-t border-border lg:mt-4">
			<div
				data-tips={tips.hidden ? "hidden" : undefined}
				className="footer-row mx-auto grid max-w-6xl gap-3 px-4 py-3 text-sm text-muted lg:flex lg:flex-wrap lg:items-center lg:justify-between lg:gap-x-6"
			>
				{/* The 113 link keeps the text tight (a normal word space each side) and gets its 44 x 44 px
				    target from an ::after box centred on the number. py-3 below 1024 px leaves room for
				    that box above the label. From 1024 px the sentence wraps to two lines inside the
				    44 px row. */}
				<p className="footer-liability py-3 lg:max-w-[17rem] lg:flex-none lg:py-0">
					{t("footer.liability")}{" "}
					{ambulance && (
						<a
							href={telHref(ambulance.phone)}
							className="relative inline-block font-semibold after:absolute after:top-1/2 after:left-1/2 after:size-11 after:-translate-x-1/2 after:-translate-y-1/2"
						>
							{ambulance.phone}
						</a>
					)}
					.
				</p>
				{/* The label is visible below 1024 px and names the nav at every width. sr-only, not
				    .visually-hidden: Tailwind makes no lg: variant for a plain component class. */}
				<nav aria-labelledby={labelId} className="grid gap-1 lg:block">
					<span id={labelId} className="footer-label lg:sr-only">
						{t("footer.label")}
					</span>
					<span className="flex flex-wrap items-center gap-x-4 lg:gap-x-3">
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
					</span>
				</nav>
				{/* Two short lines, like Sanity's small text. The dot is decoration, so readers skip it;
				    the space between the lines keeps the words apart for them. */}
				<p className="footer-note lg:flex-none">
					<span className="block">
						© Varde <span aria-hidden="true">·</span> {t("footer.noTracking")}
					</span>{" "}
					<span className="block">{t("footer.noCookies")}</span>
				</p>
				<div className="footer-bar flex items-center justify-between lg:flex-none lg:gap-3">
					{/* -ml-3 below 1024 px lines the glyph up with the text edge; the 44 px target stays
					    whole. */}
					<a
						href="https://github.com/malinfossum/varde"
						rel="noopener noreferrer"
						onPointerEnter={tips.show}
						onFocus={tips.show}
						className="footer-tip-host -ml-3 inline-flex size-11 items-center justify-center text-muted hover:text-fg lg:ml-0"
					>
						<GitHubIcon />
						<span className="visually-hidden">{t("footer.source")}</span>
						<span className="footer-tip footer-tip-start" aria-hidden="true">
							<span className="footer-tip-bubble">{t("footer.source")}</span>
						</span>
					</a>
				</div>
			</div>
		</footer>
	)
}
```

The history-tip branch adds its "Slett historikken" link as the third link in the nav's inner
span. If that branch has merged before this one, keep its link there when you rebase.

- [ ] **Step 7: Run the tests**

Run: `npx vitest run tests/footer.test.tsx tests/axe.test.tsx tests/i18n.test.tsx tests/strip.test.tsx`
Expected: PASS. If the axe test flags the footer nav, read the violation before changing
anything; a named `nav` inside `footer` is valid.

- [ ] **Step 8: Commit**

```bash
npm run check
git add src/components/Footer.tsx src/components/icons.tsx src/i18n/nb.json src/i18n/en.json src/styles/main.css tests/footer.test.tsx
git commit -m "feat: rebuild the footer with a label, a short note and the GitHub mark"
```

---

### Task 3: The theme pill, one theme state, no theme picker in the header

**Files:**
- Create: `web/src/components/ThemePill.tsx`
- Modify: `web/src/App.tsx:12-24,57-81` (theme state in `Shell`)
- Modify: `web/src/components/Header.tsx:1-16,35-39`
- Modify: `web/src/components/Footer.tsx` (props, pill in `.footer-bar`)
- Modify: `web/src/styles/main.css` (append pill rules after the footer rules)
- Delete: `web/src/components/ThemePicker.tsx`, `web/tests/themePicker.test.tsx`
- Test: `web/tests/themePill.test.tsx` (new), `web/tests/headerMenu.test.tsx:103-120`, `web/tests/shell.test.tsx:17-29`

**Interfaces:**
- Consumes: `useThemeChoice()` (`hooks/useThemeChoice.ts`, unchanged), `ThemeApi` and
  `THEME_CHOICES` (`components/ThemeRows.tsx`, unchanged), `useAnnounce()`
  (`components/StatusRegion.tsx`), the `.footer-tip*` classes and `tips.show` from Task 2.
- Produces: `ThemePill({ theme, onTip }: { theme: ThemeApi; onTip: () => void })`;
  `Header({ theme }: { theme: ThemeApi })`; `Footer({ theme }: { theme: ThemeApi })`.

- [ ] **Step 1: Write the failing tests**

`web/tests/themePill.test.tsx` (the old picker tests, moved to the pill, plus the new ones):

```tsx
import { act, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test } from "vitest"
import { App } from "../src/App.tsx"
import { render as prerender } from "../src/entry-server.tsx"
import { menu } from "./scope.ts"
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

// Chrome ("sites can't save data") and Firefox with cookies blocked throw from the
// window.localStorage getter itself. Restored before the shared afterEach clears storage.
function blockStorage() {
	const original = Object.getOwnPropertyDescriptor(window, "localStorage")
	Object.defineProperty(window, "localStorage", {
		configurable: true,
		get() {
			throw new Error("SecurityError")
		},
	})
	return () => {
		if (original) Object.defineProperty(window, "localStorage", original)
	}
}

afterEach(() => {
	Reflect.deleteProperty(window, "matchMedia")
	document.documentElement.removeAttribute("data-theme")
	window.history.replaceState(null, "", "/")
})

// The Meny holds a group named Tema too, so the pill is found inside the footer.
const pill = (name = "Tema") =>
	within(within(screen.getByRole("contentinfo")).getByRole("group", { name }))
const tip = (button: HTMLElement) => button.querySelector(".footer-tip")?.textContent

test("three buttons, Lyst, System, Mørkt; with nothing stored System is pressed", () => {
	fakeOsTheme(false)
	stubDataFiles()
	render(<App />)
	const buttons = pill().getAllByRole("button")
	expect(buttons).toHaveLength(3)
	expect(buttons[0]).toHaveAccessibleName("Lyst")
	expect(buttons[1]).toHaveAccessibleName("System")
	expect(buttons[2]).toHaveAccessibleName("Mørkt")
	expect(buttons[1]).toHaveAttribute("aria-pressed", "true")
	expect(buttons[0]).toHaveAttribute("aria-pressed", "false")
	expect(tip(buttons[1])).toBe("System (lyst)")
	expect(buttons[2].querySelector(".footer-tip")).toHaveClass("footer-tip-end")
})

test("the English pill is named Theme, with Light, System and Dark", () => {
	fakeOsTheme(false)
	stubDataFiles()
	window.history.replaceState(null, "", "/en/")
	render(<App />)
	const buttons = pill("Theme").getAllByRole("button")
	expect(buttons.map((b) => b.getAttribute("aria-pressed"))).toEqual(["false", "true", "false"])
	expect(buttons[0]).toHaveAccessibleName("Light")
	expect(buttons[2]).toHaveAccessibleName("Dark")
})

test("Mørkt stores the choice, applies it, keeps focus and says so", async () => {
	fakeOsTheme(false)
	stubDataFiles()
	render(<App />)
	const mørkt = pill().getByRole("button", { name: "Mørkt" })
	await userEvent.click(mørkt)
	expect(localStorage.getItem("theme")).toBe("dark")
	expect(document.documentElement.dataset.theme).toBe("dark")
	expect(mørkt).toHaveAttribute("aria-pressed", "true")
	expect(mørkt).toHaveFocus()
	expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent("Tema: Mørkt")
})

test("pressing the pressed button changes nothing", async () => {
	fakeOsTheme(false)
	localStorage.setItem("theme", "dark")
	stubDataFiles()
	render(<App />)
	const mørkt = pill().getByRole("button", { name: "Mørkt" })
	expect(mørkt).toHaveAttribute("aria-pressed", "true")
	await userEvent.click(mørkt)
	expect(localStorage.getItem("theme")).toBe("dark")
	expect(mørkt).toHaveAttribute("aria-pressed", "true")
})

test("System removes the key and follows the OS live", async () => {
	const os = fakeOsTheme(false)
	localStorage.setItem("theme", "light")
	stubDataFiles()
	render(<App />)
	const system = pill().getByRole("button", { name: "System" })
	await userEvent.click(system)
	expect(localStorage.getItem("theme")).toBeNull()
	act(() => os.set(true))
	expect(document.documentElement.dataset.theme).toBe("dark")
	expect(tip(system)).toBe("System (mørkt)")
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
	expect(pill().getByRole("button", { name: "Mørkt" })).toHaveAttribute("aria-pressed", "true")
})

test("a pill choice updates the Meny's pressed row", async () => {
	fakeOsTheme(false)
	stubDataFiles()
	render(<App />)
	await userEvent.click(pill().getByRole("button", { name: "Mørkt" }))
	expect(menu().getByRole("button", { name: "Mørkt" })).toHaveAttribute("aria-pressed", "true")
})

test("with site data blocked, the page stays up and the pill still renders", () => {
	fakeOsTheme(false)
	stubDataFiles()
	const restore = blockStorage()
	try {
		render(<App />)
		expect(pill().getByRole("button", { name: "System" })).toHaveAttribute("aria-pressed", "true")
	} finally {
		restore()
	}
})

test("with site data blocked, Mørkt survives an OS change", async () => {
	const os = fakeOsTheme(true)
	stubDataFiles()
	const restore = blockStorage()
	try {
		render(<App />)
		await userEvent.click(pill().getByRole("button", { name: "Mørkt" }))
		act(() => os.set(false))
		expect(document.documentElement.dataset.theme).toBe("dark")
		expect(pill().getByRole("button", { name: "Mørkt" })).toHaveAttribute("aria-pressed", "true")
	} finally {
		restore()
	}
})

test("the prerendered pill presses nothing, so hydration cannot mismatch", async () => {
	const { html } = await prerender("/", {})
	const footerHtml = html.slice(html.indexOf("<footer"))
	expect(footerHtml).toContain('aria-label="Tema"')
	expect(footerHtml.match(/aria-pressed="false"/g)).toHaveLength(3)
	expect(footerHtml).not.toContain('aria-pressed="true"')
})

test("the desktop header has no theme control any more", () => {
	fakeOsTheme(false)
	stubDataFiles()
	render(<App />)
	expect(document.querySelector(".header-tools")).not.toHaveTextContent(/Tema/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/themePill.test.tsx`
Expected: FAIL, no group named "Tema" inside the footer.

- [ ] **Step 3: Write the pill**

`web/src/components/ThemePill.tsx`:

```tsx
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { useAnnounce } from "./StatusRegion.tsx"
import { THEME_CHOICES, type ThemeApi } from "./ThemeRows.tsx"

// Sanity's order, light to dark with System between them, so the pill reads as a scale. The Meny
// keeps THEME_CHOICES' own order (Lyst, Mørkt, System).
const PILL = [THEME_CHOICES[0], THEME_CHOICES[2], THEME_CHOICES[1]] as const

// The theme switcher in the footer (spec: The theme pill). Three pressed-state buttons, the same
// model as the Meny's theme rows. Before mount the state is null and nothing is pressed, so the
// prerendered HTML and the first browser render match.
export function ThemePill({ theme, onTip }: { theme: ThemeApi; onTip: () => void }) {
	const t = useTranslation()
	const announce = useAnnounce()
	const { state } = theme
	return (
		// biome-ignore lint/a11y/useSemanticElements: a fieldset would bring its UA border and legend box into the pill
		<div role="group" aria-label={t("header.theme")} className="theme-pill">
			{PILL.map(({ choice, key, Icon }, index) => {
				const pressed = state?.choice === choice
				let tip = t(key)
				// The System tooltip says what System is right now, once the browser knows.
				if (choice === "system" && state) {
					tip += ` (${t(state.theme === "dark" ? "header.themeResolvedDark" : "header.themeResolvedLight")})`
				}
				const edge = index === PILL.length - 1 ? " footer-tip-end" : ""
				return (
					<button
						key={choice}
						type="button"
						aria-pressed={pressed}
						className="theme-pill-btn footer-tip-host"
						onPointerEnter={onTip}
						onFocus={onTip}
						onClick={() => {
							theme.choose(choice)
							announce(`${t("header.theme")}: ${t(key)}`)
						}}
					>
						<Icon />
						<span className="visually-hidden">{t(key)}</span>
						<span className={`footer-tip${edge}`} aria-hidden="true">
							<span className="footer-tip-bubble">{tip}</span>
						</span>
					</button>
				)
			})}
		</div>
	)
}
```

- [ ] **Step 4: The pill's CSS**

Append to `web/src/styles/main.css`, after the footer rules from Task 2:

```css
	/* The theme pill: three 44 px round buttons. The outline is an inset shadow, so it adds no
	   size and the pill is exactly as tall as the links beside it. */
	.theme-pill {
		display: inline-flex;
		border-radius: 999px;
		box-shadow: inset 0 0 0 1px var(--border);
	}
	.theme-pill-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 999px;
		color: var(--muted);
	}
	.theme-pill-btn:hover,
	.theme-pill-btn[aria-pressed="true"] {
		color: var(--text);
	}
	.theme-pill-btn[aria-pressed="true"] {
		box-shadow: inset 0 0 0 1px var(--text);
	}
	/* Shadows vanish in forced colours. The pressed mark is a border, not an outline, so it never
	   replaces the focus ring (an outline) on the pressed button. */
	@media (forced-colors: active) {
		.theme-pill {
			outline: 1px solid CanvasText;
		}
		.theme-pill-btn[aria-pressed="true"] {
			border: 2px solid Highlight;
		}
	}
```

`.footer-tip-host` (Task 2) gives each button `position: relative`.

- [ ] **Step 5: One theme state in App, passed down**

In `web/src/App.tsx`, add `import { useThemeChoice } from "./hooks/useThemeChoice.ts"`. In
`Shell`, after `const t = useTranslation()`:

```tsx
	// One theme state for the Meny's theme rows and the footer pill, so a choice in one shows in
	// the other at once (a storage event only reaches other tabs).
	const theme = useThemeChoice()
```

and render `<Header theme={theme} />` and `<Footer theme={theme} />`.

In `web/src/components/Header.tsx`: remove the `useThemeChoice` and `ThemePicker` imports, add
`import type { ThemeApi } from "./ThemeRows.tsx"`, change the signature to
`export function Header({ theme }: { theme: ThemeApi }) {`, delete the two-line comment and the
`const theme = useThemeChoice()` line, and delete `<ThemePicker theme={theme} />` from
`.header-tools`. In the comment above `.header-row`, "brand, nav, pickers, Meny, exit" becomes
"brand, nav, language picker, Meny, exit" and "the nav and the pickers" becomes "the nav and the
language picker".

In `web/src/components/Footer.tsx`: add `import { ThemePill } from "./ThemePill.tsx"` and
`import type { ThemeApi } from "./ThemeRows.tsx"`, change the signature to
`export function Footer({ theme }: { theme: ThemeApi }) {`, and add
`<ThemePill theme={theme} onTip={tips.show} />` as the last child of `.footer-bar`, after the
GitHub link.

Delete `web/src/components/ThemePicker.tsx` and `web/tests/themePicker.test.tsx`
(`git rm`). Then `grep -rn "ThemePicker" src tests` must print nothing.

- [ ] **Step 6: Update the tests that named the header picker**

`web/tests/headerMenu.test.tsx`, the test at lines 103-120: rename it to
`"a theme row applies the theme, keeps the Meny open on that row, says so, and the footer pill follows"`,
change the comment above it to `// One theme state, so the footer pill already shows the choice.
The status line is the confirmation (spec: Below 1024 px: Meny, Behaviour).`, and replace the
last assertion (the `desktopTools()` one and its comment) with:

```tsx
	const footerPill = within(screen.getByRole("contentinfo")).getByRole("group", { name: "Tema" })
	expect(within(footerPill).getByRole("button", { name: "Mørkt" })).toHaveAttribute(
		"aria-pressed",
		"true"
	)
```

Add `screen` and `within` to the file's Testing Library import if missing, and drop
`desktopTools` from the `./scope.ts` import if nothing else in the file uses it.

`web/tests/shell.test.tsx`, the test at line 17: rename it to
`"shell renders skip link, quick exit, acute strip and the footer theme pill"` and replace the
`"Tema: System (lyst)"` assertion with:

```tsx
	expect(
		within(screen.getByRole("contentinfo")).getByRole("group", { name: "Tema" })
	).toBeInTheDocument()
```

(add `within` to its import).

- [ ] **Step 7: Run the whole unit suite**

Run: `npm test`
Expected: PASS, every file. `npm run typecheck` also passes.

- [ ] **Step 8: Commit**

```bash
npm run check
git add -A src tests
git commit -m "feat: move the theme switcher into the footer as a three-icon pill"
```

---

### Task 4: End-to-end checks, header e2e update, screenshots for Malin

**Files:**
- Modify: `web/e2e/footer.spec.ts` (append; fix the comment on line 4)
- Modify: `web/e2e/header.spec.ts:62-65,81`
- Test: `web/e2e/landing.spec.ts` (unchanged, must pass)

**Interfaces:**
- Consumes: the footer DOM and classes from Tasks 2 and 3; `settle`, `setTheme`,
  `noHorizontalScroll`, `THEMES` from `e2e/helpers.ts`.

- [ ] **Step 1: Write the footer checks**

In `web/e2e/footer.spec.ts`, change line 4 to
`// 1920: the footer is one row there, so the 113 target must not reach the links.` and change
the import to `import { noHorizontalScroll, setTheme, settle, THEMES } from "./helpers.ts"` and
`import { expect, type Page, test } from "@playwright/test"`. Then append:

```ts
type Box = { label: string; top: number; bottom: number; height: number }

// Every footer control except the 113 link, whose own box is the 20 px glyph (its 44 px target
// is an ::after box, checked above).
async function footerControls(page: Page): Promise<Box[]> {
	return page.evaluate(() =>
		[...document.querySelectorAll<HTMLElement>("footer a, footer button")]
			.filter((el) => !el.closest(".footer-liability"))
			.map((el) => {
				const r = el.getBoundingClientRect()
				return {
					label: el.innerText.trim() || el.querySelector(".visually-hidden")?.textContent || "",
					top: r.top,
					bottom: r.bottom,
					height: r.height,
				}
			})
	)
}

function rowsOf(boxes: Box[]): Box[][] {
	const rows: Box[][] = []
	for (const box of [...boxes].sort((a, b) => a.top - b.top)) {
		const row = rows.find((r) => Math.abs(r[0].top - box.top) < 4)
		if (row) row.push(box)
		else rows.push([box])
	}
	return rows
}

// Spec: Width budget and Height. One row from 1280 px keeps the landing on one 1920 x 950 screen.
for (const width of [1280, 1920]) {
	for (const theme of THEMES) {
		for (const path of paths) {
			test(`footer ${path} at ${width} px (${theme}): one row, 69 px at most`, async ({ page }) => {
				await page.setViewportSize({ width, height: 950 })
				await setTheme(page, theme)
				await page.goto(path)
				await settle(page)
				const height = await page.locator("footer").evaluate((f) => f.getBoundingClientRect().height)
				expect(height).toBeLessThanOrEqual(69.5)
				const rows = rowsOf(await footerControls(page))
				expect(rows.length, rows.flat().map((b) => b.label).join(" | ")).toBe(1)
			})
		}
	}
}

for (const width of [375, 1024, 1280, 1920]) {
	for (const path of paths) {
		test(`footer ${path} at ${width} px: every control 44 px, one bottom edge per row`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height: 900 })
			await page.goto(path)
			await settle(page)
			for (const row of rowsOf(await footerControls(page))) {
				for (const box of row) expect(box.height, box.label).toBeCloseTo(44, 0)
				const bottoms = row.map((b) => b.bottom)
				expect(Math.max(...bottoms) - Math.min(...bottoms)).toBeLessThan(1)
			}
		})
	}
}

test("at 375 px the GitHub glyph lines up with the text edge", async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 812 })
	await page.goto("/")
	await settle(page)
	const m = await page.evaluate(() => ({
		glyph: (document.querySelector("footer .footer-bar a svg") as Element).getBoundingClientRect()
			.left,
		text: (document.querySelector("footer .footer-liability") as Element).getBoundingClientRect()
			.left,
	}))
	expect(Math.abs(m.glyph - m.text)).toBeLessThanOrEqual(1)
})

for (const width of [375, 1280]) {
	test(`with text at 200 % the footer at ${width} px never scrolls sideways`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 })
		await page.goto("/en/")
		await settle(page)
		await page.evaluate(() => {
			document.documentElement.style.fontSize = "200%"
		})
		expect(await noHorizontalScroll(page)).toBe(true)
	})
}

test("forced colours keep the pressed pill button marked", async ({ page }) => {
	await page.emulateMedia({ forcedColors: "active" })
	await setTheme(page, "dark")
	await page.goto("/")
	const pressed = page.locator('footer .theme-pill-btn[aria-pressed="true"]')
	await expect(pressed).toHaveCount(1)
	const border = await pressed.evaluate((el) => {
		const s = getComputedStyle(el)
		return { style: s.borderTopStyle, width: Number.parseFloat(s.borderTopWidth) }
	})
	expect(border.style).toBe("solid")
	expect(border.width).toBeGreaterThanOrEqual(2)
})

// Spec: Tooltips. Above the control, inside the screen, hoverable, and Escape hides them.
for (const width of [320, 375, 1920]) {
	test(`footer tooltips at ${width} px sit above their control, on screen, and stay while hovered`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height: 900 })
		await page.goto("/")
		await settle(page)
		const hosts = page.locator("footer .footer-tip-host")
		await expect(hosts).toHaveCount(4)
		for (let i = 0; i < 4; i++) {
			const host = hosts.nth(i)
			await host.hover()
			const tip = host.locator(".footer-tip")
			await expect(tip).toBeVisible()
			const m = await host.evaluate((el) => {
				const h = el.getBoundingClientRect()
				const b = (el.querySelector(".footer-tip-bubble") as Element).getBoundingClientRect()
				const t = (el.querySelector(".footer-tip") as Element).getBoundingClientRect()
				return {
					hostTop: h.top,
					tipBottom: t.bottom,
					left: b.left,
					right: b.right,
					vw: document.documentElement.clientWidth,
					bubbleX: b.left + b.width / 2,
					bubbleY: b.top + b.height / 2,
				}
			})
			expect(m.tipBottom).toBeLessThanOrEqual(m.hostTop + 1)
			expect(m.left).toBeGreaterThanOrEqual(0)
			expect(m.right).toBeLessThanOrEqual(m.vw)
			await page.mouse.move(m.bubbleX, m.bubbleY, { steps: 5 })
			await expect(tip).toBeVisible()
		}
		await page.keyboard.press("Escape")
		await expect(hosts.nth(3).locator(".footer-tip")).toBeHidden()
	})
}

// Keyboard users get the same tooltip on :focus-visible. Shift+Tab from the first pill button is
// a real keyboard move onto the GitHub link, whatever links sit before it.
test("the GitHub tooltip shows on keyboard focus", async ({ page }) => {
	await page.setViewportSize({ width: 1920, height: 950 })
	await page.goto("/")
	await settle(page)
	await page.locator("footer .theme-pill-btn").first().focus()
	await page.keyboard.press("Shift+Tab")
	const github = page.locator("footer .footer-bar a")
	await expect(github).toBeFocused()
	await expect(github.locator(".footer-tip")).toBeVisible()
})
```

- [ ] **Step 2: Update the header e2e**

In `web/e2e/header.spec.ts`, delete the three lines that wait for the theme's hidden name
(lines 62-65: the comment `// The theme value fills in after mount; …` and the
`await page.locator("header .visually-hidden", { hasText: /^(Tema|Theme): / }).waitFor(…)`
statement): no header control changes width after mount any more. In the test title at line
81, `"the nav and the pickers"` becomes `"the nav and the language picker"`.

- [ ] **Step 3: Build and run the end-to-end suite**

Run (in the background, it takes a few minutes): `npm run e2e`
Expected: PASS, including every existing `landing.spec.ts` test (the 1920 x 950 fit) and the
existing 113 target test. If a footer budget test fails in English only, measure the row with the
Playwright trace before changing anything; the spec's budget table has the expected widths.

- [ ] **Step 4: Screenshots for Malin**

From `web/`, with the preview server running (`preview_start` name `web-preview`, port 4173),
run this script (save it outside the repo, for example
`C:/Users/Nugget/AppData/Local/Temp/footer-shots.mjs`) with
`node <script> "$(pwd)" "../.superpowers/sdd/2026-10-16-varde-footer/final"`:

```js
import { createRequire } from "node:module"
import { mkdirSync } from "node:fs"
const require = createRequire(process.argv[2] + "/package.json")
const { chromium } = require("@playwright/test")
const out = process.argv[3]
mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
for (const width of [375, 1024, 1280, 1920]) {
	for (const path of ["/", "/en/"]) {
		for (const scheme of ["dark", "light"]) {
			const page = await browser.newPage({
				viewport: { width, height: 950 },
				colorScheme: scheme,
				deviceScaleFactor: 2,
			})
			await page.goto(`http://localhost:4173${path}`)
			await page.evaluate(() => document.fonts.ready)
			await page.locator("footer").screenshot({
				path: `${out}/${width}-${path === "/" ? "nb" : "en"}-${scheme}.png`,
			})
			await page.close()
		}
	}
}
await browser.close()
```

Look at every image: one row from 1280, the pill and the GitHub icon on one bottom edge, the
label set apart from the links, nothing clipped. Malin sees them before the PR opens.

- [ ] **Step 5: Commit**

```bash
npm run check
git add e2e/footer.spec.ts e2e/header.spec.ts
git commit -m "test: hold the footer to one row, 44 px controls and on-screen tooltips"
```

- [ ] **Step 6: Coordination before the PR**

Run `git fetch origin && git log origin/main --oneline -15`. If the history-tip branch has merged,
rebase onto `origin/main`, keep its "Slett historikken" link as the third link in the footer nav,
drop any GitHub-link change of its own (this branch already has the icon), and run
`npx vitest run tests/footer.test.tsx` plus `npx playwright test e2e/footer.spec.ts e2e/landing.spec.ts`
again. If it has not merged, leave a line in the PR body: "The history-tip branch rebases onto
this one and adds its link as the third footer link."

> Stress-tested 2026-10-17 (skill 1b85fca): 3 applied, 0 adapted, 0 decided by me.
