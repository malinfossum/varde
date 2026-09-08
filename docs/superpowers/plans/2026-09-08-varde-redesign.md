# Varde Plan 4 (Redesign) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Varde its "Paper" brand, a data-free landing page, a results page with a real municipality combobox and card grid, a call-first detail page, and a measured performance and accessibility bar, while removing the bundled design-system.

**Architecture:** Tokens move from the workbench design-system into one `tokens.css` mapped through Tailwind's `@theme inline`; the app gains a landing route (`/`) and moves results to `/sok`; a module-level catalog cache lets the landing prefetch what the results page consumes; every route change moves focus and sets the title; the acute strip is static constants that a test pins to the seeded rows; the API gains three national emergency rows by migration.

**Tech Stack:** React 19, TypeScript 7, Vite 8, Tailwind v4 (`@tailwindcss/vite`), react-aria-components 1.21, @fontsource/fraunces + @fontsource/figtree 5.3 (static files vendored into `public/fonts/`), Vitest 4 + Testing Library + vitest-axe, ASP.NET Core (.NET 10) + EF Core migrations + xUnit, Biome 2.

**Spec:** `docs/superpowers/specs/2026-09-08-varde-redesign-design.md` — read it first; this plan implements it and argues from it. Earlier specs stay in force where this one is silent.

## Global Constraints

- All `npm` commands run in `web/`; all `dotnet` commands run in `api/`. Local API tests need PostgreSQL: `Start-Service postgresql-x64-17` (PowerShell, may need elevation).
- Baselines at plan start: web **74/74** Vitest, API **85/85** xUnit. Never finish a task with either suite red. Each task states the expected count after it.
- Branch: `feat/redesign` off `main` (83401de or later). One PR at the end — a merge to `main` deploys, and a half-finished redesign must not ship. `main` is protected: PRs only, `api-tests` + `web-tests` required.
- New dependencies allowed by the spec and nothing else: `react-aria-components`, `@fontsource/fraunces`, `@fontsource/figtree` (dev), `vitest-axe` + `axe-core` (dev). Pin exact versions with `npm install <pkg>@<version>` and commit `package-lock.json`.
- Never type a phone number, URL or service description from memory. Every contact value is copied from a source page or from an existing file, and the source is recorded where the value lands (ledger row, code comment). The three emergency numbers Malin named (110, 112, 113) are still confirmed against the official pages before they enter any file.
- Token values (spec table, with one correction in Task 1): light ground `#f6f2ea`, surface `#ffffff`, border **`#d9d2c6`**, text `#1d1b17`, muted `#5f5a52`, accent `#285f45`, on-accent `#f6f2ea`, akutt `#b3361f`; dark ground `#0b0d10`, surface `#13161a`, border `#2a2f36`, text `#f3efe7`, muted `#b3b0a8`, accent `#7fc39e`, on-accent `#0b0d10`, akutt `#ff8a7a`.
- Contrast floors (tested): text/ground ≥ 7:1; muted, accent, akutt as text on ground ≥ 4.5:1; on-accent on accent ≥ 4.5:1; border/ground ≥ 1.3:1.
- Budgets (measured in Task 13): Lighthouse ≥ 95 ×4 (mobile), `/` JS ≤ 120 KB gz, `/sok` JS ≤ 180 KB gz, LCP ≤ 2.0 s, CLS ≤ 0.05, font bytes on `/` ≤ 80 KB, no API request on `/` before interaction.
- Every user-facing string goes into `src/i18n/nb.json` **and** `en.json` before the component uses it. Keys are dotted, grouped by surface (`landing.*`, `strip.*`, `header.*`, `filter.*`, `title.*`).
- Mobile-first CSS: baseline for the smallest screen, `@media (min-width: 768px)` and `(min-width: 1024px)` upward. No `max-width` queries. All motion inside `@media (prefers-reduced-motion: no-preference)`.
- Commit messages: conventional prefixes, imperative, **no Co-Authored-By or any Claude attribution**. Code, comments and docs are written in Malin's first-person voice.
- Ledger: append one entry per task to `.superpowers/sdd/progress.md` (commit hash, test counts, review findings, deferred minors), following the existing entries' shape.
- The `web/` folder is LF (`.gitattributes`); keep it that way when scripting edits.

---

### Task 1: Tokens in Tailwind, design-system removed, contrast test

The bundled design-system (v2.0.2, two majors stale) and its loader go. One `tokens.css` holds the Paper palette for both themes; Tailwind's `@theme inline` exposes them as utilities that carry `var()`, so the theme switch stays free. A test reads the token file and asserts the spec's contrast floors — which is how the spec's light border `#e3ddd2` (1.21:1 on paper) was caught and corrected to `#d9d2c6` (1.35:1). Fix the spec table in the same commit.

**Files:**
- Create: `web/src/styles/tokens.css`
- Create: `web/src/services/contrast.ts`
- Create: `web/tests/tokens.test.ts`
- Modify: `web/src/styles/main.css` (rewrite)
- Modify: `web/src/main.tsx` (drop the design-system import)
- Modify: `web/biome.json` (drop the `!design-system` exclusion)
- Modify: `docs/superpowers/specs/2026-09-08-varde-redesign-design.md` (border value in the token table)
- Delete: `web/src/styles/design-system.css`, `web/design-system/` (whole folder)

**Interfaces:**
- Produces: CSS custom properties `--ground --surface --border --text --muted --accent --on-accent --akutt --akutt-soft --accent-soft` on `:root` and `[data-theme="dark"]`; Tailwind utilities `bg-ground bg-surface bg-accent bg-akutt-soft bg-accent-soft text-fg text-muted text-accent text-akutt text-on-accent border-border border-akutt font-display font-sans`; `contrastRatio(hexA, hexB): number` and `parseThemeTokens(css): { light: Record<string,string>; dark: Record<string,string> }` from `src/services/contrast.ts`.

- [ ] **Step 1: Write the failing contrast test**

```ts
// web/tests/tokens.test.ts
import { readFileSync } from "node:fs"
import { describe, expect, test } from "vitest"
import { contrastRatio, parseThemeTokens } from "../src/services/contrast.ts"

const css = readFileSync(new URL("../src/styles/tokens.css", import.meta.url), "utf8")
const themes = parseThemeTokens(css)

// The spec's floors. Text on ground is the body copy; the rest are the accent, muted and
// emergency colours wherever they appear as text; border is the hairline that must still read.
const floors: [string, string, number][] = [
	["text", "ground", 7],
	["muted", "ground", 4.5],
	["accent", "ground", 4.5],
	["akutt", "ground", 4.5],
	["on-accent", "accent", 4.5],
	["border", "ground", 1.3],
]

describe.each(["light", "dark"] as const)("%s theme", (theme) => {
	test.each(floors)("%s on %s is at least %s:1", (fg, bg, floor) => {
		const tokens = themes[theme]
		expect(tokens[fg], `token --${fg} missing`).toBeDefined()
		expect(tokens[bg], `token --${bg} missing`).toBeDefined()
		expect(contrastRatio(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(floor)
	})
})

test("contrastRatio matches the WCAG reference pair", () => {
	expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1)
	expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 1)
})
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/tokens.test.ts`
Expected: FAIL — cannot resolve `../src/services/contrast.ts` / `tokens.css`.

- [ ] **Step 3: Write the contrast service**

```ts
// web/src/services/contrast.ts
// WCAG 2.x relative luminance and contrast ratio, plus a reader for tokens.css. Kept as a
// service so the test suite and any future tooling share one implementation.

function channel(value: number): number {
	const c = value / 255
	return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: string): number {
	const clean = hex.replace("#", "")
	const full = clean.length === 3 ? clean.replace(/(.)/g, "$1$1") : clean
	const r = Number.parseInt(full.slice(0, 2), 16)
	const g = Number.parseInt(full.slice(2, 4), 16)
	const b = Number.parseInt(full.slice(4, 6), 16)
	return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(hexA: string, hexB: string): number {
	const a = relativeLuminance(hexA)
	const b = relativeLuminance(hexB)
	const [light, dark] = a > b ? [a, b] : [b, a]
	return (light + 0.05) / (dark + 0.05)
}

// Reads `--name: #hex;` declarations inside the `:root { … }` and `[data-theme="dark"] { … }`
// blocks. Anything that is not a hex colour (color-scheme, font stacks) is skipped.
export function parseThemeTokens(css: string): {
	light: Record<string, string>
	dark: Record<string, string>
} {
	const block = (selector: string) => {
		const start = css.indexOf(selector)
		if (start === -1) return ""
		const open = css.indexOf("{", start)
		const close = css.indexOf("}", open)
		return css.slice(open + 1, close)
	}
	const read = (body: string) => {
		const tokens: Record<string, string> = {}
		for (const match of body.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\s*;/g)) {
			tokens[match[1]] = match[2]
		}
		return tokens
	}
	return { light: read(block(":root")), dark: read(block('[data-theme="dark"]')) }
}
```

- [ ] **Step 4: Write the token file**

```css
/* web/src/styles/tokens.css
   Paper — the Varde palette. Light is the brand's home; dark mirrors it token for token.
   Every colour used as text is contrast-tested against its ground in tests/tokens.test.ts,
   so change a value here and the suite tells you if it stopped reading. Soft tints are
   backgrounds only and are not tested. */

:root {
	color-scheme: light;
	--ground: #f6f2ea;
	--surface: #ffffff;
	--border: #d9d2c6;
	--text: #1d1b17;
	--muted: #5f5a52;
	--accent: #285f45;
	--on-accent: #f6f2ea;
	--akutt: #b3361f;
	--akutt-soft: #f8e7e2;
	--accent-soft: #e4efe8;
}

[data-theme="dark"] {
	color-scheme: dark;
	--ground: #0b0d10;
	--surface: #13161a;
	--border: #2a2f36;
	--text: #f3efe7;
	--muted: #b3b0a8;
	--accent: #7fc39e;
	--on-accent: #0b0d10;
	--akutt: #ff8a7a;
	--akutt-soft: #2a1210;
	--accent-soft: #16231c;
}
```

- [ ] **Step 5: Rewrite main.css**

```css
/* web/src/styles/main.css
   All styling enters here. Tailwind v4 owns the reset (Preflight), the utilities and the
   theme; tokens.css owns the colours. Component classes that a utility string would make
   unreadable live in @layer components below. Mobile-first: baseline is the smallest screen,
   layer up with min-width queries only. */

@import "tailwindcss";
@import "./tokens.css";

@theme inline {
	--color-*: initial;
	--color-ground: var(--ground);
	--color-surface: var(--surface);
	--color-border: var(--border);
	--color-fg: var(--text);
	--color-muted: var(--muted);
	--color-accent: var(--accent);
	--color-on-accent: var(--on-accent);
	--color-akutt: var(--akutt);
	--color-akutt-soft: var(--akutt-soft);
	--color-accent-soft: var(--accent-soft);

	--font-display: "Fraunces", Georgia, "Times New Roman", serif;
	--font-sans: "Figtree", system-ui, "Segoe UI", sans-serif;
}

@layer base {
	html {
		background: var(--ground);
		color: var(--text);
		font-family: var(--font-sans);
		line-height: 1.5;
	}
	h1,
	h2 {
		font-family: var(--font-display);
		font-weight: 600;
		letter-spacing: -0.01em;
		line-height: 1.1;
	}
	a {
		color: var(--accent);
		text-underline-offset: 0.15em;
	}
	:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}
}

@layer components {
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	.skip-link {
		position: absolute;
		left: -999px;
	}
	.skip-link:focus {
		position: static;
	}
	.btn-primary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 44px;
		padding: 0 1.25rem;
		border-radius: 0.75rem;
		background: var(--accent);
		color: var(--on-accent);
		font-weight: 600;
		text-decoration: none;
	}
	.btn-secondary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 44px;
		padding: 0 1rem;
		border: 1px solid var(--border);
		border-radius: 0.75rem;
		background: var(--surface);
		color: var(--text);
		font-weight: 500;
		text-decoration: none;
	}
	.badge {
		display: inline-block;
		border: 1px solid currentColor;
		border-radius: 999px;
		padding: 0 0.5em;
		font-size: 0.75rem;
		line-height: 1.5rem;
	}
	.badge-akutt {
		color: var(--akutt);
	}
}
```

- [ ] **Step 6: Point main.tsx at main.css only, drop the Biome exclusion, delete the folder**

In `web/src/main.tsx` remove the line `import "./styles/design-system.css"`.

In `web/biome.json` change the includes line to:
```json
"includes": ["**", "!dist", "!node_modules", "!**/*.min.js"]
```

Delete `web/src/styles/design-system.css` and the whole `web/design-system/` folder:
```bash
git rm -r -q web/design-system web/src/styles/design-system.css
```

In the spec's token table change the border row to:
```
| border | `#d9d2c6` | `#2a2f36` | hairlines |
```
and add one sentence under the table: "Light border was `#e3ddd2` in the brainstorm; the contrast test measured 1.21:1 on paper, below the 1.3:1 floor, so it is `#d9d2c6` (1.35:1)."

- [ ] **Step 7: Run the token test and the whole suite**

Run: `npx vitest run tests/tokens.test.ts` → PASS (13 tests: 12 pairs + reference).
Run: `npx vitest run` → expect **87/87**. Some existing tests assert on design-system class names? Search first: `grep -rn "design-system\|\.card\b" tests src` — only `resource-card`/`card` classes in `ResourceCard.tsx` remain, which still render. If any test fails on a class selector, the selector is what changed, not behaviour: update the selector.
Run: `npx biome check --write . && npx tsc --noEmit && npm run build` → all clean; the build must not mention `design-system`.

- [ ] **Step 8: Commit**

```bash
git add -A web docs/superpowers/specs/2026-09-08-varde-redesign-design.md
git commit -m "feat(web): Paper tokens in Tailwind, design-system removed, contrast test"
```

---

### Task 2: Light-first theme init and toggle

The init script defaults to dark today. It becomes light-first, follows the system when nothing is stored, and cannot die on a throwing `localStorage`. The same resolution lives in a pure function the toggle and the tests use; the script mirrors it because it cannot import.

**Files:**
- Create: `web/src/services/theme.ts`
- Create: `web/src/components/ThemeToggle.tsx`
- Create: `web/tests/theme.test.ts`
- Modify: `web/public/theme-init.js` (rewrite)
- Modify: `web/src/i18n/nb.json`, `web/src/i18n/en.json`

**Interfaces:**
- Produces: `type Theme = "light" | "dark"`, `resolveTheme(stored: string | null, prefersDark: boolean): Theme`, `readStoredTheme(storage: Pick<Storage, "getItem"> | undefined): string | null`, `applyTheme(theme: Theme): void` (sets `dataset.theme`, writes storage in try/catch). `ThemeToggle` renders a `<button aria-pressed>` whose accessible name is the theme it switches **to**. i18n keys `header.themeDark` / `header.themeLight`.

- [ ] **Step 1: Failing tests**

```ts
// web/tests/theme.test.ts
import { readFileSync } from "node:fs"
import { expect, test } from "vitest"
import { applyTheme, readStoredTheme, resolveTheme } from "../src/services/theme.ts"

test("stored value wins over the system preference", () => {
	expect(resolveTheme("dark", false)).toBe("dark")
	expect(resolveTheme("light", true)).toBe("light")
})

test("system preference decides when nothing is stored; light when neither", () => {
	expect(resolveTheme(null, true)).toBe("dark")
	expect(resolveTheme(null, false)).toBe("light")
	expect(resolveTheme("purple", false)).toBe("light")
})

test("a throwing storage reads as null instead of crashing", () => {
	const storage = {
		getItem: () => {
			throw new Error("SecurityError")
		},
	}
	expect(readStoredTheme(storage)).toBeNull()
	expect(readStoredTheme(undefined)).toBeNull()
})

test("applyTheme sets data-theme and survives a throwing storage", () => {
	const original = Object.getOwnPropertyDescriptor(window, "localStorage")
	Object.defineProperty(window, "localStorage", {
		configurable: true,
		get() {
			throw new Error("SecurityError")
		},
	})
	try {
		applyTheme("dark")
		expect(document.documentElement.dataset.theme).toBe("dark")
	} finally {
		if (original) Object.defineProperty(window, "localStorage", original)
	}
})

test("the public init script agrees with resolveTheme", () => {
	// The script cannot import the service, so this evaluates it against the same cases.
	const script = readFileSync(new URL("../public/theme-init.js", import.meta.url), "utf8")
	const run = (stored: string | null, prefersDark: boolean) => {
		document.documentElement.removeAttribute("data-theme")
		localStorage.clear()
		if (stored) localStorage.setItem("theme", stored)
		window.matchMedia = (() => ({ matches: prefersDark })) as unknown as typeof window.matchMedia
		new Function(script)()
		return document.documentElement.dataset.theme
	}
	expect(run(null, false)).toBe("light")
	expect(run(null, true)).toBe("dark")
	expect(run("dark", false)).toBe("dark")
	expect(run("light", true)).toBe("light")
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/theme.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement the service, the script and the toggle**

```ts
// web/src/services/theme.ts
export type Theme = "light" | "dark"
const STORAGE_KEY = "theme"

export function resolveTheme(stored: string | null, prefersDark: boolean): Theme {
	if (stored === "dark" || stored === "light") return stored
	return prefersDark ? "dark" : "light"
}

// Some private-browsing modes throw on any localStorage access. Reading through this guard
// means the worst case is "no stored preference", never a dead page.
export function readStoredTheme(storage: Pick<Storage, "getItem"> | undefined): string | null {
	try {
		return storage?.getItem(STORAGE_KEY) ?? null
	} catch {
		return null
	}
}

export function currentTheme(): Theme {
	return document.documentElement.dataset.theme === "dark" ? "dark" : "light"
}

export function applyTheme(theme: Theme): void {
	document.documentElement.dataset.theme = theme
	try {
		window.localStorage.setItem(STORAGE_KEY, theme)
	} catch {
		// Storage unavailable: the choice lives for this page only.
	}
}
```

```js
// web/public/theme-init.js
// Runs before the stylesheet so the first paint is already the right theme. Mirrors
// src/services/theme.ts (resolveTheme / readStoredTheme) — it cannot import, so the test in
// tests/theme.test.ts evaluates this file against the same cases to keep them in step.
;(() => {
	var stored = null
	try {
		stored = window.localStorage.getItem("theme")
	} catch (_) {
		stored = null
	}
	var prefersDark =
		typeof window.matchMedia === "function" &&
		window.matchMedia("(prefers-color-scheme: dark)").matches
	var theme = stored === "dark" || stored === "light" ? stored : prefersDark ? "dark" : "light"
	document.documentElement.dataset.theme = theme
})()
```

```tsx
// web/src/components/ThemeToggle.tsx
import { useState } from "react"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { applyTheme, currentTheme } from "../services/theme.ts"

export function ThemeToggle() {
	const t = useTranslation()
	const [theme, setTheme] = useState(currentTheme)
	const next = theme === "dark" ? "light" : "dark"
	const onToggle = () => {
		applyTheme(next)
		setTheme(next)
	}
	// The name says what the button does, not what the state is: "Mørkt tema" while light.
	return (
		<button
			type="button"
			className="btn-secondary min-w-11"
			aria-pressed={theme === "dark"}
			onClick={onToggle}
		>
			<span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
			<span className="hidden md:inline">{t(next === "dark" ? "header.themeDark" : "header.themeLight")}</span>
			<span className="visually-hidden md:hidden">
				{t(next === "dark" ? "header.themeDark" : "header.themeLight")}
			</span>
		</button>
	)
}
```

Add to `nb.json`: `"header.themeDark": "Mørkt tema", "header.themeLight": "Lyst tema"`. To `en.json`: `"header.themeDark": "Dark theme", "header.themeLight": "Light theme"`.

Remove the `data-palette` line from the old script (it is gone in the rewrite above) and search the codebase for `dataset.palette` / `data-palette` — nothing else should reference it.

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/theme.test.ts` → PASS (5). Full suite → **92/92**. The toggle is mounted in Task 7's header; it is only unit-covered here through the service.

- [ ] **Step 5: Commit**

```bash
git add web/src/services/theme.ts web/src/components/ThemeToggle.tsx web/tests/theme.test.ts web/public/theme-init.js web/src/i18n
git commit -m "feat(web): light-first theme init with system fallback and a theme toggle"
```

---

### Task 3: Self-hosted fonts with a drift test

Fraunces 600 and Figtree 400/600 as static Latin woff2, vendored into `public/fonts/` so the preload URL is stable (Vite hashes everything under `src/`). The packages are devDependencies and a script copies from them; a test hashes both sides so a package bump cannot leave stale files behind. Figtree 500 is dropped on purpose to stay inside the 80 KB font budget.

**Files:**
- Create: `web/scripts/sync-fonts.mjs`
- Create: `web/public/fonts/` (three woff2 files, copied by the script)
- Create: `web/tests/fonts.test.ts`
- Modify: `web/package.json` (devDependencies + `"fonts": "node scripts/sync-fonts.mjs"` script)
- Modify: `web/src/styles/tokens.css` (`@font-face` rules at the top)
- Modify: `web/index.html` (preload)
- Modify: `web/public/staticwebapp.config.json` (`/fonts/*` in `navigationFallback.exclude`)

**Interfaces:**
- Produces: font families `Fraunces` (600) and `Figtree` (400, 600) available to the `--font-display` / `--font-sans` stacks from Task 1. Files at `/fonts/fraunces-latin-600-normal.woff2`, `/fonts/figtree-latin-400-normal.woff2`, `/fonts/figtree-latin-600-normal.woff2`.

- [ ] **Step 1: Install the packages**

```bash
npm install --save-exact --save-dev @fontsource/fraunces@5.3.0 @fontsource/figtree@5.3.0
```

- [ ] **Step 2: Failing drift test**

```ts
// web/tests/fonts.test.ts
import { createHash } from "node:crypto"
import { existsSync, readFileSync, statSync } from "node:fs"
import { expect, test } from "vitest"
import { FONT_FILES } from "../scripts/sync-fonts.mjs"

const sha = (path: URL) => createHash("sha256").update(readFileSync(path)).digest("hex")

test.each(FONT_FILES)("public/fonts/%s is byte-identical to its package file", (file, pkg) => {
	const vendored = new URL(`../public/fonts/${file}`, import.meta.url)
	const source = new URL(`../node_modules/${pkg}/files/${file}`, import.meta.url)
	expect(existsSync(vendored), `run: npm run fonts`).toBe(true)
	expect(sha(vendored)).toBe(sha(source))
})

test("the three files stay under the 80 KB font budget together", () => {
	const total = FONT_FILES.reduce(
		(sum, [file]) => sum + statSync(new URL(`../public/fonts/${file}`, import.meta.url)).size,
		0
	)
	expect(total).toBeLessThanOrEqual(80 * 1024)
})
```

- [ ] **Step 3: Run to verify failure** — `npx vitest run tests/fonts.test.ts` → FAIL (script missing).

- [ ] **Step 4: The sync script**

```js
// web/scripts/sync-fonts.mjs
// Copies the static Latin woff2 files out of the @fontsource packages into public/fonts so
// the preload URL in index.html is stable. tests/fonts.test.ts fails when these drift.
import { copyFileSync, mkdirSync } from "node:fs"
import { fileURLToPath } from "node:url"

export const FONT_FILES = [
	["fraunces-latin-600-normal.woff2", "@fontsource/fraunces"],
	["figtree-latin-400-normal.woff2", "@fontsource/figtree"],
	["figtree-latin-600-normal.woff2", "@fontsource/figtree"],
]

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const out = new URL("../public/fonts/", import.meta.url)
	mkdirSync(out, { recursive: true })
	for (const [file, pkg] of FONT_FILES) {
		copyFileSync(new URL(`../node_modules/${pkg}/files/${file}`, import.meta.url), new URL(file, out))
		console.log(`copied ${file}`)
	}
}
```

Add to `package.json` scripts: `"fonts": "node scripts/sync-fonts.mjs"`. Run `npm run fonts`. Print the sizes: `ls -l public/fonts` and record the total in the ledger; if it is above 81 920 bytes, drop `figtree-latin-600-normal.woff2` from `FONT_FILES` and use weight 500 → 600 fallback via `font-synthesis: none` is *not* acceptable; instead change the semibold usages in Task 1's CSS to `font-weight: 600` remaining but backed by Figtree 400 only (browser synthesis). Record whichever happened.

- [ ] **Step 5: Font faces, preload, SWA exclude**

Prepend to `web/src/styles/tokens.css`:
```css
/* Self-hosted, static Latin subsets vendored by scripts/sync-fonts.mjs. Fraunces is the LCP
   element's face: preloaded in index.html and `optional`, so a slow network shows the
   fallback serif and never shifts the headline. Figtree swaps in as it arrives. */
@font-face {
	font-family: "Fraunces";
	font-style: normal;
	font-weight: 600;
	font-display: optional;
	src: url("/fonts/fraunces-latin-600-normal.woff2") format("woff2");
}
@font-face {
	font-family: "Figtree";
	font-style: normal;
	font-weight: 400;
	font-display: swap;
	src: url("/fonts/figtree-latin-400-normal.woff2") format("woff2");
}
@font-face {
	font-family: "Figtree";
	font-style: normal;
	font-weight: 600;
	font-display: swap;
	src: url("/fonts/figtree-latin-600-normal.woff2") format("woff2");
}
```

In `web/index.html`, after the theme-init script:
```html
<link rel="preload" href="/fonts/fraunces-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin />
```

In `web/public/staticwebapp.config.json`:
```json
"exclude": ["/assets/*", "/fonts/*", "/theme-init.js", "/favicon.ico"]
```

- [ ] **Step 6: Verify**

Run: `npx vitest run tests/fonts.test.ts` → PASS (4). Full suite → **96/96**. `npm run build` then `npm run preview`; open `http://localhost:4173/`, DevTools Network → three font requests from `/fonts/`, no request to `fonts.googleapis.com`. `font-src 'self'` in the CSP already allows them.

- [ ] **Step 7: Commit**

```bash
git add web/package.json web/package-lock.json web/scripts/sync-fonts.mjs web/public/fonts web/tests/fonts.test.ts web/src/styles/tokens.css web/index.html web/public/staticwebapp.config.json
git commit -m "feat(web): self-host Fraunces and Figtree with a vendoring script and drift test"
```

---

### Task 4: Three national emergency rows in the seed (API)

Rows 23, 24, 25: Brannvesen 110, Politi 112, Ambulanse 113. Ledger first, code second, migration third, the same way every seeded row got here. The numbers Malin named are confirmed against the official pages before anything is written; the ledger row records the page.

**Files:**
- Modify: `docs/seed-data.md` (three table rows after row 22; a Notes entry each)
- Modify: `api/Varde.Data/Seed/SeedData.cs` (three `Resource`, six `ResourceTranslation`, three `ResourceCategory` entries; header comment)
- Create: `api/Varde.Data/Migrations/<timestamp>_SeedEmergencyNumbers.cs` (generated)
- Modify: `api/Varde.Tests/Integration/SeedDataTests.cs` (91 → 94 in three places, always-open guard 10 → 13)
- Modify: `README.md` ("Data verification": one line that `web/src/services/emergency.ts` is re-verified in the same pass)

**Interfaces:**
- Produces: resources `Id = 23` (Brannvesen), `24` (Politi), `25` (Ambulanse), `IsNational = true`, `IsAlwaysOpen = true`, category `Nodtjenester`, phones exactly as printed on the source page. Task 5's web test reads these ids by regex.

- [ ] **Step 1: Verify the sources and write the ledger rows**

Open each service's own official page (the organisation that operates the line: the fire service's public information page for 110, politiet.no for 112, helsenorge.no for 113). Copy the number as printed, the page URL, and one sentence of what the line is for. Append three rows to the table in `docs/seed-data.md` after row 22, matching the column order `| # | Name | Municipality | Categories | Phone | Website | Opening hours | Source URL | Verified | Checked | Notes |`, with `(national)`, `nodtjenester`, `Døgnåpent`, today's date, `☑`, and a Notes cell that quotes the sentence on the page that carries the number. Name the rows `Brannvesen (nødnummer)`, `Politi (nødnummer)`, `Ambulanse (medisinsk nødhjelp)` unless the page prints an official name — then use that. If a page does not print the number, stop and report; do not seed from memory.

- [ ] **Step 2: Failing tests**

In `SeedDataTests.cs` change `Assert.Equal(91, …)` to `94` at the three sites (resource count, `first.TotalCount`, `seenIds.Count`) and `Assert.Equal(10, flagged.Count)` to `13` with the comment `// 10 + rows 23-25 (nødnumre), source-verified <date>`.

Run: `dotnet test` → 4 tests FAIL on counts.

- [ ] **Step 3: Seed code**

After the `Id = 22` resource in the `Entity<Resource>().HasData(` block add (values from the ledger rows, not from here):

```csharp
            // Rows 23-25 — the national emergency numbers, added 2026-09-08 for the acute strip
            // (plan 4). Copied from docs/seed-data.md rows 23-25; each row's Notes quotes the
            // source page. web/src/services/emergency.ts carries the same numbers as constants
            // and a web test pins them to these rows.
            new Resource
            {
                Id = 23,
                Name = "<Name from row 23>",
                IsNational = true,
                IsAlwaysOpen = true,
                MunicipalityId = null,
                Phone = "110",
                Website = "<Source URL from row 23>",
                LastVerified = VerifiedRows23To25,
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
```
and the same shape for `Id = 24` (`Phone = "112"`) and `Id = 25` (`Phone = "113"`). Add next to the other `Verified*` fields:
```csharp
    // Rows 23-25 (nødnumre) were added and verified 2026-09-08 — see docs/seed-data.md.
    private static readonly DateOnly VerifiedRows23To25 = new(2026, 9, 8);
```
Translations (ids 183–188, after the last existing `ResourceTranslation`): nb + en per row, `OpeningHours = "Døgnåpent"` / `"Open 24 hours"`, `Description` = the ledger row's one sentence, English written by you from that sentence (descriptions are prose, not contact data). Categories: `new ResourceCategory { ResourceId = 23, CategoryId = Categories.Nodtjenester }` and likewise for 24 and 25, after the `ResourceId = 22` entries.

Update the class summary comment: add one sentence that plan 4 added rows 23–25.

- [ ] **Step 4: Migration and tests**

```bash
dotnet ef migrations add SeedEmergencyNumbers --project Varde.Data --startup-project Varde.Api
```
Open the generated migration: it must contain only `InsertData` calls for three resources, six translations and three resource-category rows. Anything else (a column change, an unrelated update) means the model drifted — stop and report.

Run: `dotnet test` → **85/85** (counts now green). Run `dotnet run --project Varde.Api` once, hit `http://localhost:5005/api/resources?category=nodtjenester&lang=nb`, and confirm the three rows appear with the right phones.

- [ ] **Step 5: README line**

Under `## Data verification` add: "The four numbers on the acute strip live in `web/src/services/emergency.ts` as constants (the landing page fetches nothing) and are re-verified in the same six-month pass as the rows; a test keeps them identical to seed rows 3 and 23–25."

- [ ] **Step 6: Commit**

```bash
git add docs/seed-data.md api/Varde.Data api/Varde.Tests README.md
git commit -m "feat(api): seed the national emergency numbers 110, 112 and 113"
```

---

### Task 5: Emergency constants pinned to the seed (web)

**Files:**
- Create: `web/src/services/emergency.ts`
- Create: `web/tests/emergency.test.ts`

**Interfaces:**
- Produces: `type EmergencyLine = { id: "brann" | "politi" | "ambulanse" | "legevakt"; seedId: number; phone: string; source: string; verified: string }`, `export const emergencyLines: readonly EmergencyLine[]` in strip order (110, 112, 113, 116 117), and `export function telHref(phone: string): string` moved here from `ResourceCard.tsx` (re-exported there until Task 10 rewrites the card).

- [ ] **Step 1: Failing test**

```ts
// web/tests/emergency.test.ts
import { readFileSync } from "node:fs"
import { expect, test } from "vitest"
import { emergencyLines, telHref } from "../src/services/emergency.ts"

const seed = readFileSync(new URL("../../api/Varde.Data/Seed/SeedData.cs", import.meta.url), "utf8")

function seededPhone(id: number): string {
	// The block for one resource runs from its `Id = N,` to the next `new Resource`.
	const start = seed.indexOf(`Id = ${id},`)
	expect(start, `seed row ${id} missing`).toBeGreaterThan(-1)
	const end = seed.indexOf("new Resource", start)
	const block = seed.slice(start, end === -1 ? undefined : end)
	const phone = /Phone = "([^"]+)"/.exec(block)?.[1]
	expect(phone, `seed row ${id} has no Phone`).toBeDefined()
	return phone as string
}

test("strip order is 110, 112, 113, 116 117 and each number equals its seed row", () => {
	expect(emergencyLines.map((l) => l.id)).toEqual(["brann", "politi", "ambulanse", "legevakt"])
	for (const line of emergencyLines) {
		expect(line.phone).toBe(seededPhone(line.seedId))
		expect(line.source).toMatch(/^https:\/\//)
		expect(line.verified).toMatch(/^\d{4}-\d{2}-\d{2}$/)
	}
})

test("telHref strips spaces only", () => {
	expect(telHref("116 117")).toBe("tel:116117")
	expect(telHref("110")).toBe("tel:110")
})
```

- [ ] **Step 2: Run to verify failure** — `npx vitest run tests/emergency.test.ts` → FAIL.

- [ ] **Step 3: Implement**

```ts
// web/src/services/emergency.ts
// The acute strip's four numbers. The landing page fetches nothing, so these are constants —
// copied from api/Varde.Data/Seed/SeedData.cs rows 23, 24, 25 and 3, never typed from memory.
// tests/emergency.test.ts reads the seed file and fails if the two ever differ. Re-verified in
// the six-month LastVerified pass (README, "Data verification").

export type EmergencyLine = {
	id: "brann" | "politi" | "ambulanse" | "legevakt"
	seedId: number
	phone: string
	source: string
	verified: string
}

export const emergencyLines: readonly EmergencyLine[] = [
	{ id: "brann", seedId: 23, phone: "110", source: "<row 23 source URL>", verified: "2026-09-08" },
	{ id: "politi", seedId: 24, phone: "112", source: "<row 24 source URL>", verified: "2026-09-08" },
	{ id: "ambulanse", seedId: 25, phone: "113", source: "<row 25 source URL>", verified: "2026-09-08" },
	{ id: "legevakt", seedId: 3, phone: "116 117", source: "https://www.helsenorge.no/legevakt/", verified: "2026-09-07" },
]

export function telHref(phone: string): string {
	return `tel:${phone.replaceAll(" ", "")}`
}
```
Replace the three `<row N source URL>` placeholders with the URLs from the ledger rows written in Task 4. In `ResourceCard.tsx` replace the local `telHref` with `export { telHref } from "../services/emergency.ts"` so `ResourceDetail`, `EmptyState`, `ErrorState` keep importing from the card until Task 10.

- [ ] **Step 4: Run** — `npx vitest run` → **98/98**. Biome + tsc clean.

- [ ] **Step 5: Commit**

```bash
git add web/src/services/emergency.ts web/tests/emergency.test.ts web/src/components/ResourceCard.tsx
git commit -m "feat(web): emergency line constants pinned to the seed rows"
```

---

### Task 6: Routes — landing, `/sok`, legacy redirect, arrival focus, titles

`/` becomes the landing; results move to `/sok`. A legacy `/` URL carrying a filter parameter is rewritten in place (replaceState) before React reads it, so bookmarks work and history stays clean. `lang` alone is not a filter. Every route change bumps an `arrival` counter that pages use to move focus; the pushState carries `{ from: "sok" }` when leaving results so the detail page can go back with filters intact. The catalog cache lands here too because the landing (Task 8) and results (Task 9) both need it and its test is independent.

**Files:**
- Modify: `web/src/services/urlState.ts`
- Modify: `web/src/hooks/useUrlState.ts`
- Create: `web/src/hooks/useArrivalFocus.ts`
- Create: `web/src/hooks/useDocumentTitle.ts`
- Create: `web/src/services/catalogCache.ts`
- Modify: `web/src/hooks/useCatalog.ts`
- Modify: `web/src/services/match.ts` (import `Catalog` from the cache module)
- Modify: `web/src/App.tsx` (route switch; `ListPage` under `/sok`; a temporary `<h1>` placeholder for `/` until Task 8)
- Modify: `web/src/components/AkuttShortcut.tsx`, `NotFoundState.tsx`, `ResourceDetail.tsx` — links to `/` that meant "results" now point to `/sok`
- Modify: `web/tests/setup.ts` (clear the catalog cache after each test)
- Modify: `web/tests/urlState.test.ts`, `web/tests/useUrlState.test.tsx`, `web/tests/useCatalog.test.tsx`, `web/tests/list.test.tsx`, `web/tests/shell.test.tsx`, `web/tests/race.test.tsx`, `web/tests/errorRecovery.test.tsx`, `web/tests/search.test.tsx` — any test that pushes `/?…` and expects the list keeps working through the redirect; any test asserting `window.location.pathname === "/"` after a filter change now expects `/sok`
- Modify: `web/src/i18n/nb.json`, `en.json` (`title.*` keys)

**Interfaces:**
- Produces: `Route = { kind: "landing" } | { kind: "list" } | { kind: "detail"; id: number } | { kind: "notFound" }`; `parseRoute(pathname)`; `isLegacyListUrl(pathname, params): boolean`; `FILTER_PARAMS`; `useUrlState()` returns `{ route, filters, langParam, arrival: number, navigate }` where `navigate(pathname, search, options?: { replace?: boolean })` stores `{ from: "sok" }` in history state when called while on `/sok`; `useArrivalFocus<T extends HTMLElement>(arrival: number, ready: boolean): { ref: RefObject<T | null>; requestFocus: () => void }`; `useDocumentTitle(title: string)`; `loadCatalog(lang): Promise<Catalog>`, `prefetchCatalog(lang): void`, `clearCatalogCache(): void`, `type Catalog`; `NavigationContext` value unchanged in shape.

- [ ] **Step 1: Failing tests for routing and the redirect**

Append to `web/tests/urlState.test.ts`:
```ts
import { isLegacyListUrl, parseRoute } from "../src/services/urlState.ts"

test("root is the landing, /sok is the list, detail and unknown are unchanged", () => {
	expect(parseRoute("/")).toEqual({ kind: "landing" })
	expect(parseRoute("/sok")).toEqual({ kind: "list" })
	expect(parseRoute("/resources/12")).toEqual({ kind: "detail", id: 12 })
	expect(parseRoute("/sok/extra")).toEqual({ kind: "notFound" })
})

test("legacy list URLs are those with a filter parameter; lang alone is the landing", () => {
	const p = (s: string) => new URLSearchParams(s)
	expect(isLegacyListUrl("/", p("search=rus"))).toBe(true)
	expect(isLegacyListUrl("/", p("category=nodtjenester"))).toBe(true)
	expect(isLegacyListUrl("/", p("municipality=1"))).toBe(true)
	expect(isLegacyListUrl("/", p("national=true"))).toBe(true)
	expect(isLegacyListUrl("/", p("page=2"))).toBe(true)
	expect(isLegacyListUrl("/", p("lang=en"))).toBe(false)
	expect(isLegacyListUrl("/", p(""))).toBe(false)
	expect(isLegacyListUrl("/sok", p("search=rus"))).toBe(false)
})
```

Append to `web/tests/useUrlState.test.tsx` (it already renders a probe component around `useUrlState`; follow its pattern):
```tsx
test("a legacy /?search= URL is rewritten to /sok in place and parsed as the list", () => {
	window.history.pushState(null, "", "/?search=rus&lang=en")
	const { result } = renderHook(() => useUrlState())
	expect(window.location.pathname).toBe("/sok")
	expect(window.location.search).toBe("?search=rus&lang=en")
	expect(result.current.route).toEqual({ kind: "list" })
	expect(result.current.filters.search).toBe("rus")
})

test("/?lang=en stays on the landing", () => {
	window.history.pushState(null, "", "/?lang=en")
	const { result } = renderHook(() => useUrlState())
	expect(window.location.pathname).toBe("/")
	expect(result.current.route).toEqual({ kind: "landing" })
})

test("arrival increments on route changes only, and leaving /sok records from=sok", () => {
	window.history.pushState(null, "", "/sok")
	const { result } = renderHook(() => useUrlState())
	expect(result.current.arrival).toBe(0)
	act(() => result.current.navigate("/sok", "?search=rus"))
	expect(result.current.arrival).toBe(0) // filter change, same route
	act(() => result.current.navigate("/resources/12", ""))
	expect(result.current.arrival).toBe(1)
	expect(window.history.state).toEqual({ from: "sok" })
	act(() => result.current.navigate("/", ""))
	expect(result.current.arrival).toBe(2)
	expect(window.history.state).toBeNull()
})
```
(`renderHook` and `act` come from `@testing-library/react`.)

- [ ] **Step 2: Failing tests for the arrival hook, the title hook and the cache**

```tsx
// web/tests/arrivalFocus.test.tsx
import { act, render, screen } from "@testing-library/react"
import { expect, test } from "vitest"
import { useArrivalFocus } from "../src/hooks/useArrivalFocus.ts"
import { useDocumentTitle } from "../src/hooks/useDocumentTitle.ts"

function Probe({ arrival, ready }: { arrival: number; ready: boolean }) {
	const { ref } = useArrivalFocus<HTMLHeadingElement>(arrival, ready)
	return ready ? (
		<h1 ref={ref} tabIndex={-1}>
			Heading
		</h1>
	) : (
		<p>loading</p>
	)
}

test("first load never steals focus", () => {
	render(<Probe arrival={0} ready={true} />)
	expect(screen.getByRole("heading")).not.toHaveFocus()
})

test("an arrival focuses the heading once it is ready, and only once", () => {
	const { rerender } = render(<Probe arrival={1} ready={false} />)
	rerender(<Probe arrival={1} ready={true} />)
	expect(screen.getByRole("heading")).toHaveFocus()
	screen.getByRole("heading").blur()
	rerender(<Probe arrival={1} ready={true} />)
	expect(screen.getByRole("heading")).not.toHaveFocus()
})

test("requestFocus moves focus on the next ready render", () => {
	let request: () => void = () => {}
	function Pager({ ready }: { ready: boolean }) {
		const { ref, requestFocus } = useArrivalFocus<HTMLHeadingElement>(0, ready)
		request = requestFocus
		return ready ? <h2 ref={ref} tabIndex={-1}>Results</h2> : <p>loading</p>
	}
	const { rerender } = render(<Pager ready={true} />)
	act(() => request())
	rerender(<Pager ready={false} />)
	rerender(<Pager ready={true} />)
	expect(screen.getByRole("heading")).toHaveFocus()
})

test("useDocumentTitle sets and updates the title", () => {
	function Titled({ title }: { title: string }) {
		useDocumentTitle(title)
		return null
	}
	const { rerender } = render(<Titled title="Søk – Varde" />)
	expect(document.title).toBe("Søk – Varde")
	rerender(<Titled title="Varde" />)
	expect(document.title).toBe("Varde")
})
```

```ts
// web/tests/catalogCache.test.ts
import { afterEach, expect, test, vi } from "vitest"
import { clearCatalogCache, loadCatalog, prefetchCatalog } from "../src/services/catalogCache.ts"

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })

afterEach(() => {
	vi.restoreAllMocks()
	clearCatalogCache()
})

test("two loads for one language share one pair of requests", async () => {
	const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((input) =>
		Promise.resolve(ok(String(input).includes("municipalities") ? [] : []))
	)
	await Promise.all([loadCatalog("nb"), loadCatalog("nb")])
	expect(fetchSpy).toHaveBeenCalledTimes(2) // municipalities + categories, once
	await loadCatalog("en")
	expect(fetchSpy).toHaveBeenCalledTimes(4)
})

test("prefetch fills the cache so a later load makes no request", async () => {
	const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok([]))
	prefetchCatalog("nb")
	await loadCatalog("nb")
	expect(fetchSpy).toHaveBeenCalledTimes(2)
})

test("a failure is not cached", async () => {
	const fetchSpy = vi
		.spyOn(globalThis, "fetch")
		.mockResolvedValueOnce(new Response(null, { status: 500 }))
		.mockResolvedValue(ok([]))
	await expect(loadCatalog("nb")).rejects.toThrow()
	await loadCatalog("nb")
	expect(fetchSpy.mock.calls.length).toBeGreaterThanOrEqual(3)
})
```

- [ ] **Step 3: Run to verify failure** — `npx vitest run tests/urlState.test.ts tests/useUrlState.test.tsx tests/arrivalFocus.test.tsx tests/catalogCache.test.ts` → FAIL.

- [ ] **Step 4: Implement routing**

`web/src/services/urlState.ts` — replace the `Route` type and `parseRoute`, add the legacy check:
```ts
export type Route =
	| { kind: "landing" }
	| { kind: "list" }
	| { kind: "detail"; id: number }
	| { kind: "notFound" }

// The parameters that mean "this is a results URL". `lang` is deliberately absent: /?lang=en
// is the English landing, and the language toggle must never bounce a visitor into results.
export const FILTER_PARAMS = ["search", "category", "municipality", "national", "page"] as const

export function isLegacyListUrl(pathname: string, params: URLSearchParams): boolean {
	return pathname === "/" && FILTER_PARAMS.some((name) => params.has(name))
}

export function parseRoute(pathname: string): Route {
	if (pathname === "/") return { kind: "landing" }
	if (pathname === "/sok") return { kind: "list" }
	const match = pathname.match(/^\/resources\/(\d+)$/)
	if (match) return { kind: "detail", id: Number(match[1]) }
	return { kind: "notFound" }
}
```

`web/src/hooks/useUrlState.ts` — full replacement:
```ts
import { useCallback, useEffect, useState } from "react"
import {
	type Filters,
	isLegacyListUrl,
	parseFilters,
	parseRoute,
	type Route,
} from "../services/urlState.ts"

type UrlState = { route: Route; filters: Filters; langParam: string | null; arrival: number }

function sameRoute(a: Route, b: Route): boolean {
	if (a.kind !== b.kind) return false
	return a.kind !== "detail" || b.kind !== "detail" || a.id === b.id
}

function read(): Omit<UrlState, "arrival"> {
	const params = new URLSearchParams(window.location.search)
	// Bookmarked /?search=… from before the landing existed: rewrite in place, no history entry.
	if (isLegacyListUrl(window.location.pathname, params)) {
		window.history.replaceState(window.history.state, "", `/sok${window.location.search}`)
	}
	return {
		route: parseRoute(window.location.pathname),
		filters: parseFilters(params),
		langParam: params.get("lang"),
	}
}

export function useUrlState() {
	const [state, setState] = useState<UrlState>(() => ({ ...read(), arrival: 0 }))

	// `arrival` counts route changes (not filter changes on the same route). Pages use it to
	// move focus to their heading; the first load stays 0 so the browser's own focus is kept.
	const sync = useCallback(() => {
		setState((prev) => {
			const next = read()
			return { ...next, arrival: sameRoute(prev.route, next.route) ? prev.arrival : prev.arrival + 1 }
		})
	}, [])

	useEffect(() => {
		window.addEventListener("popstate", sync)
		return () => window.removeEventListener("popstate", sync)
	}, [sync])

	const navigate = useCallback(
		(pathname: string, search: string, options?: { replace?: boolean }) => {
			// The detail page's "back to results" needs to know it came from /sok: the site sends
			// no referrer and pushState never sets one, so the fact travels in history state.
			const leavingResults = window.location.pathname === "/sok" && pathname !== "/sok"
			const historyState = leavingResults ? { from: "sok" } : null
			if (options?.replace) window.history.replaceState(historyState, "", `${pathname}${search}`)
			else window.history.pushState(historyState, "", `${pathname}${search}`)
			sync()
		},
		[sync]
	)

	return { ...state, navigate }
}
```

- [ ] **Step 5: Implement the hooks and the cache**

```ts
// web/src/hooks/useArrivalFocus.ts
import { type RefObject, useEffect, useRef } from "react"

// Moves focus to a page's heading after a route change (arrival > 0) once the page is ready,
// and on demand (requestFocus) for the pager. Scroll first, then focus without a second
// scroll: focus() alone centres the element in Chromium.
export function useArrivalFocus<T extends HTMLElement>(
	arrival: number,
	ready: boolean
): { ref: RefObject<T | null>; requestFocus: () => void } {
	const ref = useRef<T>(null)
	const pending = useRef(false)

	useEffect(() => {
		if (arrival > 0) pending.current = true
	}, [arrival])

	useEffect(() => {
		if (!pending.current || !ready || !ref.current) return
		pending.current = false
		ref.current.scrollIntoView({ block: "start" })
		ref.current.focus({ preventScroll: true })
	}, [ready, arrival])

	return {
		ref,
		requestFocus: () => {
			pending.current = true
		},
	}
}
```

```ts
// web/src/hooks/useDocumentTitle.ts
import { useEffect } from "react"

export function useDocumentTitle(title: string) {
	useEffect(() => {
		document.title = title
	}, [title])
}
```

```ts
// web/src/services/catalogCache.ts
import { fetchCategories, fetchMunicipalities } from "./api.ts"
import type { CategoryDto, MunicipalityDto } from "../types/api.ts"

export type Catalog = { municipalities: MunicipalityDto[]; categories: CategoryDto[] }

// One in-flight-or-settled promise per language. The landing prefetches on focus; the results
// page reads the same promise, so the two pages share one pair of requests. A rejected load
// is evicted so a retry really retries.
const cache = new Map<string, Promise<Catalog>>()

export function loadCatalog(lang: string): Promise<Catalog> {
	const cached = cache.get(lang)
	if (cached) return cached
	const controller = new AbortController()
	const promise = Promise.all([
		fetchMunicipalities(controller.signal),
		fetchCategories(lang, controller.signal),
	]).then(([municipalities, categories]) => ({ municipalities, categories }))
	promise.catch(() => cache.delete(lang))
	cache.set(lang, promise)
	return promise
}

export function prefetchCatalog(lang: string): void {
	loadCatalog(lang).catch(() => {
		// Prefetch is best effort; the page that needs the catalog reports its own error.
	})
}

export function clearCatalogCache(): void {
	cache.clear()
}
```

`web/src/hooks/useCatalog.ts` — replace the body to consume the cache (`Catalog` is re-exported for existing importers):
```ts
import { useEffect, useState } from "react"
import type { Lang } from "../i18n/LanguageProvider.tsx"
import { type Catalog, clearCatalogCache, loadCatalog } from "../services/catalogCache.ts"

export type { Catalog }

export type CatalogState =
	| { kind: "loading" }
	| { kind: "error" }
	| { kind: "ready"; catalog: Catalog }

export function useCatalog(lang: Lang) {
	const [state, setState] = useState<CatalogState>({ kind: "loading" })
	const [attempt, setAttempt] = useState(0)

	// biome-ignore lint/correctness/useExhaustiveDependencies: attempt only forces a re-fetch
	useEffect(() => {
		let cancelled = false
		setState({ kind: "loading" })
		loadCatalog(lang)
			.then((catalog) => {
				if (!cancelled) setState({ kind: "ready", catalog })
			})
			.catch(() => {
				if (!cancelled) setState({ kind: "error" })
			})
		return () => {
			cancelled = true
		}
	}, [lang, attempt])

	return {
		state,
		retry: () => {
			clearCatalogCache()
			setAttempt((n) => n + 1)
		},
	}
}
```
In `match.ts` change the import to `import type { Catalog } from "../services/catalogCache.ts"`. In `tests/setup.ts` add `import { clearCatalogCache } from "../src/services/catalogCache.ts"` and call `clearCatalogCache()` inside the existing `afterEach`.

- [ ] **Step 6: Wire App and the titles**

Add i18n keys — nb: `"title.app": "Varde", "title.search": "Søk – Varde", "title.detail": "{name} – Varde", "title.notFound": "Fant ikke siden – Varde"`; en: `"Varde"`, `"Search – Varde"`, `"{name} – Varde"`, `"Page not found – Varde"`.

In `App.tsx`, `Shell` receives `route`, `filters`, `arrival` and renders:
```tsx
<main id="main">
	{route.kind === "landing" && <LandingPlaceholder arrival={arrival} />}
	{route.kind === "list" && <ListPage filters={filters} arrival={arrival} />}
	{route.kind === "detail" && <ResourceDetail id={route.id} arrival={arrival} />}
	{route.kind === "notFound" && <NotFoundState arrival={arrival} />}
</main>
```
`LandingPlaceholder` is a ten-line component in `App.tsx` for this task only (Task 8 replaces it): `useDocumentTitle(t("title.app"))`, `useArrivalFocus<HTMLHeadingElement>(arrival, true)`, renders `<h1 ref={ref} tabIndex={-1}>{t("app.title")}</h1>` and a `Link` to `/sok` with `t("landing.toSearch")` (nb "Gå til søk", en "Go to search" — add the keys). `ListPage` gets an `arrival` prop and replaces its `resultsHeading`/`focusResultsOnReady` pair with `const { ref: resultsHeading, requestFocus } = useArrivalFocus<HTMLHeadingElement>(arrival, state.kind === "ready" && state.data.items.length > 0)`; `goToPage` calls `requestFocus()` then `apply({ page })`; delete the old settle effect; add `useDocumentTitle(t("title.search"))`. `ResourceDetail` gets `arrival`, `useDocumentTitle(state.kind === "ready" ? t("title.detail").replace("{name}", state.resource.name) : t("title.app"))`, and its `<h2>` becomes `<h1 ref={ref} tabIndex={-1}>` with `useArrivalFocus(arrival, state.kind === "ready")`. `NotFoundState` gets `arrival` (default `0` so `ResourceDetail` can still render it without one), `useDocumentTitle(t("title.notFound"))`, and an `<h1>` (detail's not-found stays an `h2` — pass a `level` prop: `level?: 1 | 2`, default 1; detail passes 2). Every `Link to="/"` in `AkuttShortcut`, `NotFoundState`, `ResourceDetail` (the back link) becomes `/sok` (`AkuttShortcut` → `/sok?category=nodtjenester`).

- [ ] **Step 7: Run the whole suite and repair the existing tests**

Run: `npx vitest run`. Expect failures only in tests that (a) assert `window.location.pathname` after a filter change (now `/sok`), (b) look for `Tilbake til søket` linking to `/` (now `/sok`), or (c) use `useCatalog` with abort expectations (`race.test.tsx`, `useCatalog.test.tsx`: a cancelled consumer no longer aborts the request, it ignores the result — rewrite those assertions to "the stale result does not reach the state"). Each fix must keep the test's intent; note every rewrite in the ledger. Target: **112/112** (98 + 3 urlState + 3 useUrlState + 4 arrival/title + 3 cache + 1 landing placeholder smoke test you add to `shell.test.tsx`: render `App` at `/` and expect a level-1 heading "Varde" and no `fetch` call).

Run: `npx biome check --write . && npx tsc --noEmit`.

- [ ] **Step 8: Commit**

```bash
git add -A web
git commit -m "feat(web): landing route, results at /sok, legacy redirect, arrival focus, catalog cache"
```

---

### Task 7: Acute strip, header, footer, app shell

The shell that every page shares. The strip is not sticky; the header is sticky above 480 px viewport height. The old "Akutt hjelp" header button goes; the strip carries the category link.

**Files:**
- Create: `web/src/components/AcuteStrip.tsx`
- Create: `web/src/components/BrandMark.tsx`
- Create: `web/src/components/Header.tsx`
- Create: `web/src/components/Footer.tsx`
- Create: `web/tests/strip.test.tsx`
- Modify: `web/src/App.tsx` (`Shell` composition)
- Modify: `web/src/components/QuickExit.tsx`, `LanguageToggle.tsx` (class names only)
- Modify: `web/src/styles/main.css` (`.app-header` sticky rule)
- Modify: `web/tests/shell.test.tsx` (the akutt shortcut assertion becomes a strip assertion)
- Modify: `web/src/i18n/nb.json`, `en.json`
- Delete: `web/src/components/AkuttShortcut.tsx`

**Interfaces:**
- Consumes: `emergencyLines`, `telHref` (Task 5); `ThemeToggle` (Task 2); `useNavigate`, `Link`.
- Produces: `<AcuteStrip />`, `<Header />`, `<Footer />`, `<BrandMark className? />` (SVG, `currentColor`). i18n keys `strip.label` ("Nødnumre"), `strip.brann` ("brann"), `strip.politi` ("politi"), `strip.ambulanse` ("ambulanse"), `strip.legevakt` ("Legevakt"), `strip.more` ("Alle nødtjenester"), `header.home` ("Varde – til forsiden"), `footer.source` ("Kildekode på GitHub"), `footer.noTracking` ("Ingen sporing. Ingen informasjonskapsler."); English equivalents.

- [ ] **Step 1: Failing test**

```tsx
// web/tests/strip.test.tsx
import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"
import { AcuteStrip } from "../src/components/AcuteStrip.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import { emergencyLines } from "../src/services/emergency.ts"

test("the strip lists every emergency line as a tel link with the digits visible", () => {
	render(
		<LanguageProvider initialLang="nb">
			<AcuteStrip />
		</LanguageProvider>
	)
	const region = screen.getByRole("region", { name: "Nødnumre" })
	for (const line of emergencyLines) {
		const link = screen.getByRole("link", { name: new RegExp(line.phone) })
		expect(link).toHaveAttribute("href", `tel:${line.phone.replaceAll(" ", "")}`)
		expect(region).toContainElement(link)
	}
	expect(screen.getByRole("link", { name: "Alle nødtjenester" })).toHaveAttribute(
		"href",
		"/sok?category=nodtjenester"
	)
})
```

- [ ] **Step 2: Run to verify failure** — FAIL (module missing).

- [ ] **Step 3: Implement the strip, mark, header, footer**

```tsx
// web/src/components/AcuteStrip.tsx
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { emergencyLines, telHref } from "../services/emergency.ts"
import { Link } from "./Link.tsx"

// Above the header on every page. Not sticky, not dismissable: the person who needs it most
// is the one least likely to find a re-open control. Numbers are constants (see emergency.ts).
export function AcuteStrip() {
	const t = useTranslation()
	return (
		<section aria-label={t("strip.label")} className="bg-akutt-soft text-akutt">
			<ul className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm">
				{emergencyLines.map((line) => (
					<li key={line.id} className="flex items-center gap-1">
						<a href={telHref(line.phone)} className="inline-flex min-h-11 items-center font-semibold text-akutt">
							{line.phone}
						</a>
						<span>{t(`strip.${line.id}`)}</span>
					</li>
				))}
				<li className="ml-auto">
					<Link to="/sok?category=nodtjenester" className="inline-flex min-h-11 items-center text-akutt underline">
						{t("strip.more")}
					</Link>
				</li>
			</ul>
		</section>
	)
}
```

```tsx
// web/src/components/BrandMark.tsx
// Placeholder cairn until the brand pack lands: three stacked stones, coloured by CSS through
// currentColor — never a fill attribute, var() does not resolve in SVG presentation attributes.
export function BrandMark({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className} fill="currentColor">
			<rect x="9" y="3" width="6" height="4" rx="2" />
			<rect x="6" y="9" width="12" height="4.5" rx="2.2" />
			<rect x="3" y="16" width="18" height="5" rx="2.5" />
		</svg>
	)
}
```

```tsx
// web/src/components/Header.tsx
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { BrandMark } from "./BrandMark.tsx"
import { LanguageToggle } from "./LanguageToggle.tsx"
import { Link } from "./Link.tsx"
import { QuickExit } from "./QuickExit.tsx"
import { ThemeToggle } from "./ThemeToggle.tsx"

export function Header() {
	const t = useTranslation()
	return (
		<header className="app-header border-b border-border bg-surface">
			<div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
				<Link to="/" className="inline-flex min-h-11 items-center gap-2 font-display text-lg text-fg no-underline" aria-label={t("header.home")}>
					<BrandMark className="h-6 w-6 text-accent" />
					<span>Varde</span>
				</Link>
				<div className="flex items-center gap-2">
					<LanguageToggle />
					<ThemeToggle />
					<QuickExit />
				</div>
			</div>
		</header>
	)
}
```
`QuickExit` keeps its label at every width: give its button `className="btn-secondary"`. `LanguageToggle` gets `className="btn-secondary min-w-11"`.

```tsx
// web/src/components/Footer.tsx
import { useTranslation } from "../i18n/LanguageProvider.tsx"

export function Footer() {
	const t = useTranslation()
	return (
		<footer className="mt-12 border-t border-border">
			<div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted">
				<p>{t("footer.noTracking")}</p>
				<a href="https://github.com/malinfossum/varde" rel="noopener noreferrer" className="inline-flex min-h-11 items-center">
					{t("footer.source")}
				</a>
			</div>
		</footer>
	)
}
```

`App.tsx` `Shell`:
```tsx
<div id="app" className="flex min-h-dvh flex-col">
	<a href="#main" className="skip-link">{t("app.skipToContent")}</a>
	<AcuteStrip />
	<Header />
	<main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
		{/* route switch from Task 6 */}
	</main>
	<Footer />
</div>
```
Add to `main.css` `@layer components`:
```css
	.app-header {
		position: static;
	}
	@media (min-height: 480px) {
		.app-header {
			position: sticky;
			top: 0;
			z-index: 10;
		}
	}
```
Delete `AkuttShortcut.tsx` and its i18n key `app.akuttShortcut`; remove `app.tagline` only if nothing else uses it (Task 8 reuses the idea with a new key, so delete it).

- [ ] **Step 4: Tests**

`shell.test.tsx`: replace the akutt-shortcut assertion with `expect(screen.getByRole("region", { name: "Nødnumre" })).toBeInTheDocument()` and add `expect(screen.getByRole("button", { name: "Mørkt tema" })).toBeInTheDocument()`. Run the suite → **113/113**. Biome + tsc. `npm run dev`, open `/` and `/sok`: strip on top, header below, footer at the bottom; shrink the window height under 480 px and confirm the header scrolls away.

- [ ] **Step 5: Commit**

```bash
git add -A web
git commit -m "feat(web): acute strip, sticky header with theme toggle, footer"
```

---

### Task 8: Landing page

Hero, search with suggestions, nine static category chips, trust strip, emergency section. No request on render; the catalog prefetch fires on focus or pointer-enter of the search box. Entrance animation in CSS with the headline excluded.

**Files:**
- Create: `web/src/services/categories.ts` (the nine slugs, static)
- Create: `web/src/components/LandingPage.tsx`
- Create: `web/src/components/LandingSearch.tsx`
- Create: `web/tests/landing.test.tsx`
- Modify: `web/src/App.tsx` (replace `LandingPlaceholder`)
- Modify: `web/src/styles/main.css` (hero blooms + entrance keyframes)
- Modify: `web/src/i18n/nb.json`, `en.json`
- Modify: `README.md` is **not** touched here (Task 13)

**Interfaces:**
- Consumes: `prefetchCatalog`, `loadCatalog`, `suggest`, `buildSearch`, `useNavigate`, `useArrivalFocus`, `useDocumentTitle`, `emergencyLines`, `telHref`, `SearchBar` (existing, reused), `Suggestions` (existing, reused).
- Produces: `CATEGORY_SLUGS` (readonly tuple of the nine slugs in the order of `Categories.cs`), i18n keys `category.<slug>` (nine, names copied from `Categories.Translations`), `landing.eyebrow`, `landing.headline`, `landing.subtitle`, `landing.searchLabel`, `landing.searchButton`, `landing.browse`, `landing.trustHeading`, `landing.trustNoTracking`, `landing.trustSources`, `landing.trustVerified` (with `{date}`), `landing.emergencyHeading`, `landing.emergencyIntro`.

- [ ] **Step 1: Failing tests**

```tsx
// web/tests/landing.test.tsx
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"
import { CATEGORY_SLUGS } from "../src/services/categories.ts"

const municipalities = [{ id: 1, name: "Hamar", county: "Innlandet" }]
const categories = [{ id: 4, slug: "rus", name: "Rus og avhengighet", isFallbackTranslation: false }]

function stubCatalog(fail = false) {
	return vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
		const url = String(input)
		if (fail) return Promise.resolve(new Response(null, { status: 500 }))
		if (url.includes("/api/municipalities")) return Promise.resolve(new Response(JSON.stringify(municipalities)))
		if (url.includes("/api/categories")) return Promise.resolve(new Response(JSON.stringify(categories)))
		return Promise.resolve(new Response(JSON.stringify({ items: [], page: 1, pageSize: 20, totalCount: 0 })))
	})
}

afterEach(() => {
	vi.restoreAllMocks()
	window.history.replaceState(null, "", "/")
})

test("the landing renders without a single request", () => {
	const fetchSpy = stubCatalog()
	render(<App />)
	expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Finn riktig hjelp/)
	expect(fetchSpy).not.toHaveBeenCalled()
	expect(document.title).toBe("Varde")
})

test("focusing the search box prefetches the catalog; Enter submits the text to /sok", async () => {
	const fetchSpy = stubCatalog()
	const user = userEvent.setup()
	render(<App />)
	const box = screen.getByRole("searchbox", { name: /Søk/ })
	await user.click(box)
	await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2))
	await user.type(box, "rus{Enter}")
	expect(window.location.pathname).toBe("/sok")
	expect(window.location.search).toContain("search=rus")
})

test("a suggestion goes straight to scoped results", async () => {
	stubCatalog()
	const user = userEvent.setup()
	render(<App />)
	await user.type(screen.getByRole("searchbox", { name: /Søk/ }), "ham")
	await user.click(await screen.findByRole("button", { name: /Hamar/ }))
	expect(window.location.pathname).toBe("/sok")
	expect(window.location.search).toContain("municipality=1")
})

test("a failed catalog still lets Enter navigate", async () => {
	stubCatalog(true)
	const user = userEvent.setup()
	render(<App />)
	await user.type(screen.getByRole("searchbox", { name: /Søk/ }), "vold{Enter}")
	expect(window.location.pathname).toBe("/sok")
})

test("nine category chips link to scoped results and the strip numbers repeat below the fold", () => {
	stubCatalog()
	render(<App />)
	for (const slug of CATEGORY_SLUGS) {
		expect(screen.getByRole("link", { name: new RegExp(`^${slug === "nodtjenester" ? "Nødtjenester" : ".+"}$`) })).toBeDefined()
	}
	const chips = screen.getAllByRole("link").filter((a) => a.getAttribute("href")?.startsWith("/sok?category="))
	expect(chips).toHaveLength(9)
	expect(screen.getAllByRole("link", { name: /116 117/ }).length).toBeGreaterThanOrEqual(2) // strip + emergency section
})
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement**

```ts
// web/src/services/categories.ts
// The nine category slugs, in the order api/Varde.Data/Seed/Categories.cs defines them. Slugs
// are stable by contract (they live in shared URLs); display names come from i18n so the
// landing can render its chips without a request.
export const CATEGORY_SLUGS = [
	"okonomi",
	"bolig",
	"psykisk-helse",
	"rus",
	"vold-og-overgrep",
	"familie-og-barn",
	"arbeid",
	"juridisk-hjelp",
	"nodtjenester",
] as const
export type CategorySlug = (typeof CATEGORY_SLUGS)[number]
```
i18n `category.*` names: copy the nb and en `Name` values from `Categories.Translations` in `api/Varde.Data/Seed/Categories.cs` (e.g. `"category.okonomi": "Økonomi og gjeld"` / `"Money and debt"`). Chip order on the landing puts `nodtjenester` first, then the rest in slug order.

```tsx
// web/src/components/LandingSearch.tsx
import { useEffect, useMemo, useState } from "react"
import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { useNavigate } from "../navigation.ts"
import { type Catalog, loadCatalog, prefetchCatalog } from "../services/catalogCache.ts"
import { type Suggestion, suggest } from "../services/match.ts"
import { buildSearch, type Filters } from "../services/urlState.ts"
import { Suggestions } from "./Suggestions.tsx"

const empty: Filters = { search: "", categories: [], municipality: null, national: false, page: 1 }

export function LandingSearch() {
	const { lang } = useLanguage()
	const t = useTranslation()
	const navigate = useNavigate()
	const [value, setValue] = useState("")
	const [catalog, setCatalog] = useState<Catalog | null>(null)

	// The landing fetches nothing on render. The first sign of intent — focus or the pointer
	// reaching the box — starts the catalog request so suggestions are ready for the first
	// keystroke. A failed catalog is silent here: plain search still works.
	const warm = () => prefetchCatalog(lang)

	useEffect(() => {
		if (!value) return
		let cancelled = false
		loadCatalog(lang)
			.then((c) => {
				if (!cancelled) setCatalog(c)
			})
			.catch(() => {})
		return () => {
			cancelled = true
		}
	}, [value, lang])

	const suggestions: Suggestion[] = useMemo(
		() => (catalog && value ? suggest(value, catalog) : []),
		[catalog, value]
	)

	const go = (patch: Partial<Filters>) => navigate("/sok", buildSearch({ ...empty, ...patch }, lang))
	const onPick = (s: Suggestion) =>
		s.kind === "municipality" ? go({ municipality: s.id }) : go({ categories: [s.slug] })

	return (
		<search className="mx-auto w-full max-w-xl">
			<form
				className="flex items-center gap-2 rounded-xl border border-border bg-surface p-1.5 pl-4"
				onSubmit={(event) => {
					event.preventDefault()
					go({ search: value.trim() })
				}}
			>
				<label htmlFor="landing-search" className="visually-hidden">
					{t("landing.searchLabel")}
				</label>
				<input
					id="landing-search"
					type="search"
					value={value}
					onChange={(event) => setValue(event.target.value)}
					onFocus={warm}
					onPointerEnter={warm}
					placeholder={t("landing.searchPlaceholder")}
					autoComplete="off"
					className="min-h-11 flex-1 bg-transparent text-fg outline-none"
				/>
				<button type="submit" className="btn-primary">
					{t("landing.searchButton")}
				</button>
			</form>
			<Suggestions suggestions={suggestions} onPick={onPick} />
		</search>
	)
}
```
`landing.searchLabel` is nb `"Søk etter tjeneste, kommune eller tema"` so the test's `/Søk/` name matches; placeholder nb `"Hamar, rus, krisesenter …"`.

```tsx
// web/src/components/LandingPage.tsx
import { useArrivalFocus } from "../hooks/useArrivalFocus.ts"
import { useDocumentTitle } from "../hooks/useDocumentTitle.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { CATEGORY_SLUGS } from "../services/categories.ts"
import { emergencyLines, telHref } from "../services/emergency.ts"
import { LandingSearch } from "./LandingSearch.tsx"
import { Link } from "./Link.tsx"

// Copied from README "Data verification" (next pass date). Update it there and here together.
const NEXT_VERIFICATION_PASS = "<date from README>"

const chipOrder = ["nodtjenester", ...CATEGORY_SLUGS.filter((s) => s !== "nodtjenester")]

export function LandingPage({ arrival }: { arrival: number }) {
	const t = useTranslation()
	useDocumentTitle(t("title.app"))
	const { ref } = useArrivalFocus<HTMLHeadingElement>(arrival, true)
	return (
		<div className="landing">
			<section className="hero relative py-10 text-center md:py-16">
				<p className="entrance text-xs uppercase tracking-[0.24em] text-muted">{t("landing.eyebrow")}</p>
				<h1 ref={ref} tabIndex={-1} className="mx-auto mt-3 max-w-2xl text-4xl md:text-6xl">
					{t("landing.headline")}
				</h1>
				<p className="entrance mx-auto mt-4 max-w-md text-muted">{t("landing.subtitle")}</p>
				<div className="entrance mt-6">
					<LandingSearch />
				</div>
				<p className="entrance mt-6 text-xs uppercase tracking-[0.18em] text-muted">{t("landing.browse")}</p>
				<ul className="entrance mt-3 flex flex-wrap justify-center gap-2">
					{chipOrder.map((slug) => (
						<li key={slug}>
							<Link to={`/sok?category=${slug}`} className="btn-secondary rounded-full text-sm">
								{t(`category.${slug}`)}
							</Link>
						</li>
					))}
				</ul>
			</section>

			<section aria-labelledby="trust" className="grid gap-4 border-t border-border py-8 md:grid-cols-3">
				<h2 id="trust" className="visually-hidden">{t("landing.trustHeading")}</h2>
				<p className="text-sm text-muted">{t("landing.trustNoTracking")}</p>
				<p className="text-sm text-muted">{t("landing.trustSources")}</p>
				<p className="text-sm text-muted">{t("landing.trustVerified").replace("{date}", NEXT_VERIFICATION_PASS)}</p>
			</section>

			<section aria-labelledby="emergency" className="border-t border-border py-8">
				<h2 id="emergency" className="text-2xl">{t("landing.emergencyHeading")}</h2>
				<p className="mt-2 max-w-prose text-muted">{t("landing.emergencyIntro")}</p>
				<ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
	)
}
```
Copy the next-pass date from README's "Data verification" section into `NEXT_VERIFICATION_PASS` (do not compute it).

CSS in `main.css` `@layer components`:
```css
	.hero::before {
		content: "";
		position: absolute;
		inset: 0;
		z-index: -1;
		pointer-events: none;
		background:
			radial-gradient(320px 200px at 20% 0%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 70%),
			radial-gradient(320px 200px at 85% 30%, color-mix(in srgb, #e0a84a 14%, transparent), transparent 70%);
	}
	@media (prefers-reduced-motion: no-preference) {
		.entrance {
			animation: rise 400ms ease-out both;
		}
		.entrance:nth-of-type(2) { animation-delay: 60ms; }
		.entrance:nth-of-type(3) { animation-delay: 120ms; }
		.entrance:nth-of-type(4) { animation-delay: 180ms; }
		.entrance:nth-of-type(5) { animation-delay: 240ms; }
	}
	@keyframes rise {
		from { opacity: 0; transform: translateY(8px); }
		to { opacity: 1; transform: none; }
	}
```
The `h1` carries no `entrance` class on purpose (LCP). Replace `LandingPlaceholder` in `App.tsx` with `<LandingPage arrival={arrival} />` and delete the `landing.toSearch` keys.

i18n (nb): `landing.eyebrow` "Hjelpetjenester i Norge"; `landing.headline` "Finn riktig hjelp, der du bor."; `landing.subtitle` "Skriv en kommune, et tema eller et navn. Varde foreslår mens du skriver."; `landing.searchButton` "Søk"; `landing.browse` "eller bla i kategorier"; `landing.trustHeading` "Derfor kan du stole på Varde"; `landing.trustNoTracking` "Ingen sporing og ingen informasjonskapsler."; `landing.trustSources` "Hvert nummer er kopiert fra tjenestens egen side."; `landing.trustVerified` "Alle oppføringer sjekkes på nytt hvert halvår. Neste gang: {date}."; `landing.emergencyHeading` "Akutt hjelp"; `landing.emergencyIntro` "Alle nødnumrene når fram til samme sentral. Ring det som passer best, men ring."

- [ ] **Step 4: Run** — `npx vitest run tests/landing.test.tsx` → PASS (5); full suite → **118/118**; Biome + tsc; `npm run dev` and look at `/` at 375 px and 1280 px, then with the OS reduced-motion setting on (no animation).

- [ ] **Step 5: Commit**

```bash
git add -A web
git commit -m "feat(web): landing page with search-first hero, category chips, trust and emergency sections"
```

---

### Task 9: Municipality combobox and filter bar

**Files:**
- Create: `web/src/components/MunicipalityCombobox.tsx`
- Create: `web/src/components/FilterBar.tsx`
- Create: `web/tests/combobox.test.tsx`
- Modify: `web/src/components/ListPage.tsx` (use `FilterBar`)
- Modify: `web/tests/setup.ts` (ResizeObserver stub)
- Modify: `web/package.json` (dependency)
- Modify: `web/src/i18n/nb.json`, `en.json`
- Delete: `web/src/components/KommunePicker.tsx`, `web/tests/picker.test.tsx` (its intents move to `combobox.test.tsx`)

**Interfaces:**
- Consumes: `MunicipalityDto`, `CategoryDto`, `Filters`, `matchesEitherWay`, `useAnnounce`.
- Produces: `<MunicipalityCombobox municipalities selectedId onSelect(id: number | null) />`; `<FilterBar catalog filters onPatch(patch: Partial<Filters>) onSearch(value: string) />` which renders `SearchBar`, the combobox, the national toggle (`<button aria-pressed>`), category chips (`<button aria-pressed>`), and "Nullstill" when any filter is set. i18n keys `filter.municipality` ("Kommune"), `filter.all` ("Alle kommuner"), `filter.national` ("Nasjonale tjenester"), `filter.categories` ("Kategorier"), `filter.reset` ("Nullstill"), `filter.noMatch` (reuse the text of `picker.noMatch`), `filter.noMatchLink` (reuse `picker.noMatchLink`), `filter.clear` ("Tøm").

- [ ] **Step 1: Install**

```bash
npm install --save-exact react-aria-components@1.21.1
```
Add to `tests/setup.ts`: `globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver` (react-aria's popover positioning observes the trigger; jsdom has no ResizeObserver).

- [ ] **Step 2: Failing tests**

```tsx
// web/tests/combobox.test.tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, test, vi } from "vitest"
import { MunicipalityCombobox } from "../src/components/MunicipalityCombobox.tsx"
import { AnnouncerProvider } from "../src/components/StatusRegion.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"

const municipalities = [
	{ id: 1, name: "Hamar", county: "Innlandet" },
	{ id: 6, name: "Løten", county: "Innlandet" },
	{ id: 8, name: "Oslo", county: "Oslo" },
]

function renderBox(selectedId: number | null = null, onSelect = vi.fn()) {
	render(
		<LanguageProvider initialLang="nb">
			<AnnouncerProvider>
				<MunicipalityCombobox municipalities={municipalities} selectedId={selectedId} onSelect={onSelect} />
			</AnnouncerProvider>
		</LanguageProvider>
	)
	return onSelect
}

test("opening lists every municipality under its county", async () => {
	const user = userEvent.setup()
	renderBox()
	await user.click(screen.getByRole("button", { name: /Kommune/ }))
	const listbox = await screen.findByRole("listbox")
	expect(listbox).toBeInTheDocument()
	expect(screen.getByRole("group", { name: "Innlandet" })).toBeInTheDocument()
	expect(screen.getByRole("group", { name: "Oslo" })).toBeInTheDocument()
	expect(screen.getAllByRole("option")).toHaveLength(4) // 3 + "Alle kommuner"
})

test("typeahead folds diacritics, Enter selects, Escape closes without selecting", async () => {
	const user = userEvent.setup()
	const onSelect = renderBox()
	const input = screen.getByRole("combobox", { name: "Kommune" })
	await user.type(input, "lot")
	expect(await screen.findByRole("option", { name: "Løten" })).toBeInTheDocument()
	expect(screen.queryByRole("option", { name: "Hamar" })).not.toBeInTheDocument()
	await user.keyboard("{ArrowDown}{Enter}")
	expect(onSelect).toHaveBeenCalledWith(6)

	await user.clear(input)
	await user.type(input, "ham")
	await user.keyboard("{Escape}")
	expect(onSelect).toHaveBeenCalledTimes(1)
})

test("no match shows the coverage note with the national link; clear resets to all", async () => {
	const user = userEvent.setup()
	const onSelect = renderBox(1)
	await user.type(screen.getByRole("combobox", { name: "Kommune" }), "zzz")
	expect(await screen.findByText(/Fant ikke kommunen din/)).toBeInTheDocument()
	await user.click(screen.getByRole("button", { name: "Tøm" }))
	expect(onSelect).toHaveBeenCalledWith(null)
})
```

- [ ] **Step 3: Run to verify failure** — FAIL.

- [ ] **Step 4: Implement**

```tsx
// web/src/components/MunicipalityCombobox.tsx
import { useState } from "react"
import {
	Button,
	ComboBox,
	Header,
	Input,
	Label,
	ListBox,
	ListBoxItem,
	ListBoxSection,
	Popover,
} from "react-aria-components"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { matchesEitherWay } from "../services/match.ts"
import type { MunicipalityDto } from "../types/api.ts"

const nbCollator = new Intl.Collator("nb")
const ALL = "all"

// react-aria-components ComboBox: keyboard, typeahead, group announcements and the popover
// come from the library; this file only decides what the options are. Filtering is ours so
// "lot" finds Løten (matchesEitherWay folds diacritics), which the built-in contains-filter
// would miss.
export function MunicipalityCombobox({
	municipalities,
	selectedId,
	onSelect,
}: {
	municipalities: MunicipalityDto[]
	selectedId: number | null
	onSelect: (id: number | null) => void
}) {
	const t = useTranslation()
	const selectedName = municipalities.find((m) => m.id === selectedId)?.name ?? ""
	const [input, setInput] = useState(selectedName)

	const visible = input.trim()
		? municipalities.filter((m) => matchesEitherWay(input, m.name))
		: municipalities
	const counties = [...new Set(visible.map((m) => m.county))].sort(nbCollator.compare)

	return (
		<ComboBox
			className="grid gap-1"
			menuTrigger="focus"
			allowsEmptyCollection
			inputValue={input}
			onInputChange={setInput}
			selectedKey={selectedId ?? ALL}
			onSelectionChange={(key) => {
				if (key === null) return
				const next = key === ALL ? null : Number(key)
				setInput(next === null ? "" : (municipalities.find((m) => m.id === next)?.name ?? ""))
				onSelect(next)
			}}
		>
			<Label className="text-sm font-semibold">{t("filter.municipality")}</Label>
			<div className="flex items-center rounded-xl border border-border bg-surface">
				<Input className="min-h-11 flex-1 bg-transparent px-3 text-fg outline-none" />
				{input && (
					<Button
						slot={null}
						className="min-h-11 px-3 text-muted"
						onPress={() => {
							setInput("")
							onSelect(null)
						}}
					>
						{t("filter.clear")}
					</Button>
				)}
				<Button className="min-h-11 min-w-11 text-muted" aria-label={`${t("filter.municipality")}: ${t("filter.all")}`}>
					▾
				</Button>
			</div>
			<Popover className="max-h-72 w-[var(--trigger-width)] overflow-auto rounded-xl border border-border bg-surface p-1 shadow-lg">
				<ListBox
					renderEmptyState={() => (
						<p className="p-3 text-sm text-muted">
							{t("filter.noMatch")}{" "}
							<Button className="underline" onPress={() => onSelect(null)}>{t("filter.noMatchLink")}</Button>
						</p>
					)}
				>
					{!input.trim() && (
						<ListBoxItem id={ALL} className="cursor-pointer rounded-lg px-3 py-2 data-[focused]:bg-accent-soft data-[selected]:font-semibold">
							{t("filter.all")}
						</ListBoxItem>
					)}
					{counties.map((county) => (
						<ListBoxSection key={county} id={county}>
							<Header className="px-3 pt-2 text-xs uppercase tracking-wide text-muted">{county}</Header>
							{visible
								.filter((m) => m.county === county)
								.sort((a, b) => nbCollator.compare(a.name, b.name))
								.map((m) => (
									<ListBoxItem key={m.id} id={m.id} textValue={m.name} className="cursor-pointer rounded-lg px-3 py-2 data-[focused]:bg-accent-soft data-[selected]:font-semibold">
										{m.name}
									</ListBoxItem>
								))}
						</ListBoxSection>
					))}
				</ListBox>
			</Popover>
		</ComboBox>
	)
}
```
If `ListBoxSection` is not exported by the installed version, it is `Section` — check `node_modules/react-aria-components/dist/types.d.ts` and use whichever exists; note it in the ledger. The "no match" `noMatchLink` selects national through the parent: `FilterBar` passes `onSelect` that maps `null` from the empty-state button to `{ national: true }` — simplest is a second prop `onNoMatchNational: () => void`; add it and call it from the empty state instead of `onSelect(null)`.

```tsx
// web/src/components/FilterBar.tsx
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import type { Catalog } from "../services/catalogCache.ts"
import type { Filters } from "../services/urlState.ts"
import { MunicipalityCombobox } from "./MunicipalityCombobox.tsx"
import { SearchBar } from "./SearchBar.tsx"

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
	const anySet =
		filters.search !== "" || filters.categories.length > 0 || filters.municipality !== null || filters.national
	const toggleCategory = (slug: string) =>
		onPatch({
			categories: filters.categories.includes(slug)
				? filters.categories.filter((s) => s !== slug)
				: [...filters.categories, slug],
		})
	return (
		<div className="grid gap-4">
			<SearchBar value={filters.search} onChange={onSearch} />
			{catalog && (
				<MunicipalityCombobox
					municipalities={catalog.municipalities}
					selectedId={filters.national ? null : filters.municipality}
					onSelect={(id) => onPatch({ municipality: id, national: false })}
					onNoMatchNational={() => onPatch({ national: true })}
				/>
			)}
			<button
				type="button"
				className="btn-secondary justify-start"
				aria-pressed={filters.national}
				onClick={() => onPatch(filters.national ? { national: false } : { national: true })}
			>
				{t("filter.national")}
			</button>
			{catalog && (
				<fieldset className="grid gap-2">
					<legend className="text-sm font-semibold">{t("filter.categories")}</legend>
					<ul className="flex flex-wrap gap-2">
						{catalog.categories.map((c) => {
							const active = filters.categories.includes(c.slug)
							return (
								<li key={c.slug}>
									<button type="button" className="btn-secondary rounded-full text-sm" aria-pressed={active} onClick={() => toggleCategory(c.slug)}>
										{active && <span aria-hidden="true">✓ </span>}
										{c.name}
									</button>
								</li>
							)
						})}
					</ul>
				</fieldset>
			)}
			{anySet && (
				<button
					type="button"
					className="btn-secondary justify-self-start"
					onClick={() => onPatch({ search: "", categories: [], municipality: null, national: false })}
				>
					{t("filter.reset")}
				</button>
			)}
		</div>
	)
}
```
In `ListPage.tsx` replace the `SearchBar` + `KommunePicker` block with `<FilterBar catalog={catalog} filters={filters} onPatch={apply} onSearch={(value) => applySearch({ search: value })} />`, keeping `Suggestions` and `WayfindingHint` below it and the "unknown municipality id" guard (`knownMunicipality`) feeding `filters.municipality` as before (pass `{ ...filters, municipality: knownMunicipality ? filters.municipality : null }`).

- [ ] **Step 5: Run**

`npx vitest run` — remove `tests/picker.test.tsx`; any list/search test that clicked a municipality button now types into the combobox (`getByRole("combobox", { name: "Kommune" })`, then `findByRole("option", …)`). Target **118/118** (3 new, 3 old picker tests removed). Biome + tsc. Manually: keyboard through the combobox with NVDA or Narrator once — group names and option counts are announced.

- [ ] **Step 6: Commit**

```bash
git add -A web
git commit -m "feat(web): municipality combobox on react-aria-components and a filter bar"
```

---

### Task 10: Results layout, cards, skeleton loading

**Files:**
- Modify: `web/src/components/ResourceCard.tsx` (rewrite)
- Modify: `web/src/components/ListPage.tsx` (layout classes; sidebar from 1024 px)
- Modify: `web/src/components/LoadingState.tsx` (skeletons)
- Modify: `web/src/components/Pagination.tsx` (classes only)
- Modify: `web/src/components/ResourceDetail.tsx`, `EmptyState.tsx`, `ErrorState.tsx` (import `telHref` from `services/emergency.ts`)
- Modify: `web/tests/list.test.tsx`
- Modify: `web/src/i18n/nb.json`, `en.json` (`card.call` "Ring", `card.details` "Detaljer", `card.noPhone` "Ingen telefon – se nettsiden")

**Interfaces:**
- Produces: `ResourceCard` with the fixed order: name link, badges (Akutt, Nasjonal, Døgnåpent), full description, hours, actions (`<a href="tel:">Ring <digits></a>` primary, `Detaljer` secondary), verified date. `LoadingState` renders six `aria-hidden` skeleton cards inside a `<div role="status" aria-busy="true">` with visually-hidden "Laster …".

- [ ] **Step 1: Failing tests**

Add to `tests/list.test.tsx`:
```tsx
test("card order: name, badges in order, description, hours, Ring as a tel anchor, details, verified", () => {
	withLang(<ResourceCard resource={{ ...resource, isNational: true }} />)
	const badges = screen.getAllByText(/^(Akutt|Nasjonal|Døgnåpent)$/).map((el) => el.textContent)
	expect(badges).toEqual(["Akutt", "Nasjonal", "Døgnåpent"])
	const call = screen.getByRole("link", { name: /Ring 62 00 00 00/ })
	expect(call).toHaveAttribute("href", "tel:62000000")
	expect(call.className).toContain("btn-primary")
	expect(screen.getByRole("link", { name: "Detaljer" })).toHaveAttribute("href", "/resources/12")
	expect(screen.getByText("Hjelp ved vold i nære relasjoner.")).toBeInTheDocument()
})

test("a card without a phone shows only Detaljer and the no-phone line", () => {
	withLang(<ResourceCard resource={{ ...resource, phone: null }} />)
	expect(screen.queryByRole("link", { name: /Ring/ })).not.toBeInTheDocument()
	expect(screen.getByText("Ingen telefon – se nettsiden")).toBeInTheDocument()
})

test("loading renders skeletons under a busy status region", () => {
	withLang(<LoadingState />)
	expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true")
	expect(screen.getByText("Laster …")).toHaveClass("visually-hidden")
})
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement**

```tsx
// web/src/components/ResourceCard.tsx
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { telHref } from "../services/emergency.ts"
import type { ResourceDto } from "../types/api.ts"
import { Link } from "./Link.tsx"

export { telHref }

export function ResourceCard({ resource }: { resource: ResourceDto }) {
	const t = useTranslation()
	const isAkutt = resource.categories.some((c) => c.slug === "nodtjenester")
	return (
		<li className="resource-card grid content-start gap-3 rounded-xl border border-border bg-surface p-4">
			<h3 className="text-lg font-semibold leading-snug">
				<Link to={`/resources/${resource.id}`} className="text-fg">
					{resource.name}
				</Link>
			</h3>
			{(isAkutt || resource.isNational || resource.isAlwaysOpen) && (
				<p className="flex flex-wrap gap-1">
					{isAkutt && <span className="badge badge-akutt">{t("badge.akutt")}</span>}
					{resource.isNational && <span className="badge text-muted">{t("badge.national")}</span>}
					{resource.isAlwaysOpen && <span className="badge text-accent">{t("badge.alwaysOpen")}</span>}
				</p>
			)}
			{resource.isFallbackTranslation && <p className="text-sm text-muted">{t("card.fallback")}</p>}
			{/* Full description, never clamped: closure notices and safety lines live here. */}
			<p>{resource.description}</p>
			{resource.openingHours && (
				<p className="text-sm">
					<span className="text-muted">{t("card.hours")}:</span> {resource.openingHours}
				</p>
			)}
			<p className="flex flex-wrap gap-2">
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
			<p className="text-xs text-muted">
				{t("card.lastVerified")} {resource.lastVerified}
			</p>
		</li>
	)
}
```
Note the website link left the card (it is on the detail page); the existing test "card renders … external rel" loses that assertion — move the `rel` check to `detail.test.tsx`.

```tsx
// web/src/components/LoadingState.tsx
import { useTranslation } from "../i18n/LanguageProvider.tsx"

const placeholders = [0, 1, 2, 3, 4, 5]

export function LoadingState() {
	const t = useTranslation()
	return (
		<div role="status" aria-busy="true" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			<span className="visually-hidden">{t("status.loading")}</span>
			{placeholders.map((n) => (
				<div key={n} aria-hidden="true" className="grid gap-3 rounded-xl border border-border bg-surface p-4">
					<div className="h-5 w-2/3 rounded bg-accent-soft" />
					<div className="h-4 w-1/3 rounded bg-accent-soft" />
					<div className="h-4 w-full rounded bg-accent-soft" />
					<div className="h-11 w-1/2 rounded-xl bg-accent-soft" />
				</div>
			))}
		</div>
	)
}
```
Because `LoadingState` now owns a `role="status"`, the `ListPage` "Laster …" announcement through `useAnnounce` stays (it is the app's single live region); the skeleton's hidden text is for the busy region only.

`ListPage` layout: outer `<div className="grid gap-6 lg:grid-cols-[280px_1fr]">`; first column `<aside aria-label={t("filter.heading")}>` (nb "Filtre") holding `FilterBar`; second column holds `HandoverBanner`, `Suggestions`, `WayfindingHint`, the states, the `<h2>` and `<ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">`. `Pagination`: `nav` gets `className="flex items-center justify-between gap-3"`, buttons `btn-secondary`.

- [ ] **Step 4: Run** — full suite → **121/121**; Biome + tsc; `npm run dev` at 375, 768, 1024, 1280 px: one, two, sidebar + three columns.

- [ ] **Step 5: Commit**

```bash
git add -A web
git commit -m "feat(web): card hierarchy with a call-first action row, skeleton loading, results grid"
```

---

### Task 11: Detail page

**Files:**
- Modify: `web/src/components/ResourceDetail.tsx` (rewrite of the ready branch; back link)
- Modify: `web/tests/detail.test.tsx`
- Modify: `web/src/i18n/nb.json`, `en.json` (`detail.back` → "Tilbake til resultater"; `detail.nationalService` "Nasjonal tjeneste"; `detail.municipality` "Kommune")

- [ ] **Step 1: Failing tests**

Add to `tests/detail.test.tsx`:
```tsx
test("the call button is the hero and the back link is a plain link without history state", async () => {
	vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(detail), { status: 200 }))
	window.history.replaceState(null, "", "/resources/12")
	render(<LanguageProvider initialLang="nb"><AnnouncerProvider><ResourceDetail id={12} arrival={0} /></AnnouncerProvider></LanguageProvider>)
	const call = await screen.findByRole("link", { name: /Ring 62 00 00 00/ })
	expect(call).toHaveAttribute("href", "tel:62000000")
	expect(call.className).toContain("btn-primary")
	expect(screen.getByRole("link", { name: "Tilbake til resultater" })).toHaveAttribute("href", "/sok")
	expect(document.title).toBe("Krisesenteret i Hamar – Varde")
})

test("with from=sok in history state the back control goes back", async () => {
	vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(detail), { status: 200 }))
	window.history.replaceState({ from: "sok" }, "", "/resources/12")
	const back = vi.spyOn(window.history, "back").mockImplementation(() => {})
	render(<LanguageProvider initialLang="nb"><AnnouncerProvider><ResourceDetail id={12} arrival={1} /></AnnouncerProvider></LanguageProvider>)
	await screen.findByRole("heading", { level: 1, name: "Krisesenteret i Hamar" })
	await userEvent.setup().click(screen.getByRole("button", { name: "Tilbake til resultater" }))
	expect(back).toHaveBeenCalledTimes(1)
})
```
(Import `AnnouncerProvider` and `userEvent`; `ResourceDetail` already needs the announcer for share/copy.)

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement the ready branch**

```tsx
	const cameFromResults = (window.history.state as { from?: string } | null)?.from === "sok"
	const backLabel = t("detail.back")

	return (
		<article className="grid gap-6">
			{cameFromResults ? (
				<button type="button" className="justify-self-start text-accent underline" onClick={() => window.history.back()}>
					{backLabel}
				</button>
			) : (
				<Link to="/sok" className="justify-self-start">{backLabel}</Link>
			)}
			<header className="grid gap-3 rounded-xl border border-border bg-surface p-5 md:p-8">
				<h1 ref={ref} tabIndex={-1} className="text-3xl md:text-5xl">{resource.name}</h1>
				<p className="flex flex-wrap gap-1">
					{isAkutt && <span className="badge badge-akutt">{t("badge.akutt")}</span>}
					{resource.isNational && <span className="badge text-muted">{t("badge.national")}</span>}
					{resource.isAlwaysOpen && <span className="badge text-accent">{t("badge.alwaysOpen")}</span>}
				</p>
				<p className="text-muted">
					{resource.isNational ? t("detail.nationalService") : resource.municipalityName}
				</p>
				{resource.isFallbackTranslation && <p className="text-sm text-muted">{t("card.fallback")}</p>}
				{resource.phone && (
					<div className="flex flex-wrap items-center gap-2">
						<a href={telHref(resource.phone)} className="btn-primary text-xl md:text-2xl">
							{t("card.call")} {resource.phone}
						</a>
						{canCopy && (
							<button type="button" className="btn-secondary" onClick={() => resource.phone && onCopyPhone(resource.phone)}>
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
			</header>
			<p className="max-w-prose">{resource.description}</p>
			<dl className="grid gap-3 md:grid-cols-[max-content_1fr] md:gap-x-8">
				{/* the existing dt/dd pairs for hours, address, website, email, chat — phone is in the hero now */}
			</dl>
			<p className="text-sm text-muted">{t("card.lastVerified")} {resource.lastVerified}</p>
		</article>
	)
```
`isAkutt` is computed like the card's. A resource without a phone keeps the share button in the hero (move the `capability` block outside the phone guard so it always renders when available). The `arrival` prop and `useArrivalFocus` / `useDocumentTitle` are already in place from Task 6.

- [ ] **Step 4: Run** — full suite → **123/123**; Biome + tsc; in the browser: results → detail → back keeps the filters and the page position; direct load of `/resources/12` shows the plain link.

- [ ] **Step 5: Commit**

```bash
git add -A web
git commit -m "feat(web): detail page with the call button as hero and a stateful back link"
```

---

### Task 12: States restyled and axe on every page

**Files:**
- Modify: `web/src/components/EmptyState.tsx`, `ErrorState.tsx`, `NotFoundState.tsx`
- Create: `web/tests/axe.test.tsx`
- Modify: `web/tests/errorRecovery.test.tsx` (the error panel lists only 116 117 now)
- Modify: `web/tests/setup.ts` (extend `expect` with vitest-axe matchers)
- Modify: `web/package.json` (dev deps)

- [ ] **Step 1: Install**

```bash
npm install --save-exact --save-dev vitest-axe@0.1.0 axe-core@4.13.0
```
In `tests/setup.ts` add `import * as axeMatchers from "vitest-axe/matchers"` and `expect.extend(axeMatchers)` (import `expect` from vitest).

- [ ] **Step 2: Failing tests**

```tsx
// web/tests/axe.test.tsx
import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, test, vi } from "vitest"
import { axe } from "vitest-axe"
import { App } from "../src/App.tsx"

const resource = { /* copy the `resource` fixture from list.test.tsx */ }
const municipalities = [{ id: 1, name: "Hamar", county: "Innlandet" }]
const categories = [{ id: 9, slug: "nodtjenester", name: "Nødtjenester", isFallbackTranslation: false }]

type Mode = "ok" | "empty" | "error"
function stub(mode: Mode) {
	vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
		const url = String(input)
		if (mode === "error") return Promise.resolve(new Response(null, { status: 500 }))
		if (url.includes("/api/municipalities")) return Promise.resolve(new Response(JSON.stringify(municipalities)))
		if (url.includes("/api/categories")) return Promise.resolve(new Response(JSON.stringify(categories)))
		if (/\/api\/resources\/\d+/.test(url)) return Promise.resolve(new Response(JSON.stringify(resource)))
		const items = mode === "empty" ? [] : [resource]
		return Promise.resolve(new Response(JSON.stringify({ items, page: 1, pageSize: 20, totalCount: items.length })))
	})
}

// jsdom does no layout, so axe cannot judge colour; tests/tokens.test.ts covers contrast.
const options = { rules: { "color-contrast": { enabled: false } } }

const pages: [string, string, Mode, RegExp][] = [
	["landing", "/", "ok", /Finn riktig hjelp/],
	["results", "/sok", "ok", /treff/],
	["empty", "/sok?search=zzz", "empty", /Ingen treff/],
	["error", "/sok", "error", /Noe gikk galt/],
	["detail", "/resources/12", "ok", /Krisesenteret i Hamar/],
	["not found", "/nope", "ok", /Fant ikke/],
]

afterEach(() => {
	vi.restoreAllMocks()
	window.history.replaceState(null, "", "/")
	document.documentElement.removeAttribute("data-theme")
})

describe.each(["light", "dark"])("%s theme", (theme) => {
	test.each(pages)("%s has no axe violations", async (_name, path, mode, settled) => {
		document.documentElement.dataset.theme = theme
		stub(mode)
		window.history.replaceState(null, "", path)
		const { container } = render(<App />)
		await screen.findByText(settled)
		expect(await axe(container, options)).toHaveNoViolations()
	})
})
```

- [ ] **Step 3: Run to verify failure** — the states still carry old markup; expect at least the error-state fallback list and heading-order findings, or a green run if the old markup happens to pass. Either way continue: the restyle is required by the spec.

- [ ] **Step 4: Restyle the states**

`ErrorState`: keep the shape, switch the utilities to `rounded-xl border border-akutt bg-akutt-soft p-5 grid gap-3`, heading `text-xl text-fg`, and render only the Legevakt line: `nationalFallbacks.filter((s) => s.id === 3)`. Retry button → `btn-secondary`. The strip above already carries 110/112/113.

`EmptyState`: `grid gap-3 rounded-xl border border-border bg-surface p-5`; the fallback list stays (it is the "these are always there" list); the clear button → `btn-secondary`.

`NotFoundState`: `grid gap-3 py-10 text-center`; links to `/` (`landing.toHome` "Til forsiden") and `/sok` (`detail.back`) as `btn-secondary`.

`errorRecovery.test.tsx`: assertions that expected 116 123 inside the error panel now expect it absent and 116 117 present.

- [ ] **Step 5: Run** — `npx vitest run tests/axe.test.tsx` → PASS (12); full suite → **135/135**; Biome + tsc.

- [ ] **Step 6: Commit**

```bash
git add -A web
git commit -m "feat(web): restyled empty, error and not-found states with axe coverage on every page"
```

---

### Task 13: Lazy routes, performance measurement, README, brand brief, PR

**Files:**
- Modify: `web/src/App.tsx` (`lazy` + `Suspense` for `ListPage` and `ResourceDetail`)
- Modify: `README.md` (Stack, Web, Run locally, Deployment notes)
- Create: `docs/brand/varde-brief.md`
- Modify: `.superpowers/sdd/progress.md` (Lighthouse table, bundle sizes, manual passes)

- [ ] **Step 1: Lazy routes**

```tsx
import { lazy, Suspense } from "react"
const ListPage = lazy(() => import("./components/ListPage.tsx").then((m) => ({ default: m.ListPage })))
const ResourceDetail = lazy(() => import("./components/ResourceDetail.tsx").then((m) => ({ default: m.ResourceDetail })))
```
Wrap the route switch in `<Suspense fallback={<LoadingState />}>`. Run the suite: every test that renders `App` at `/sok` or a detail already awaits with `findBy…`; a test using `getBy…` synchronously on lazy content must switch to `findBy…`. Target **135/135**.

- [ ] **Step 2: Build and measure**

```bash
npm run build
```
Record every chunk's gzipped size from the build output in the ledger. Sum the chunks loaded on `/` (index + landing) and on `/sok` (index + list + react-aria chunk). If `/sok` exceeds 180 KB gz, move the combobox behind its own `lazy()` inside `FilterBar` and re-measure.

```bash
npm run preview
```
In a second terminal (set `CHROME_PATH` to Edge or Brave if Chrome is absent):
```bash
npx lighthouse http://localhost:4173/ --output=json --output-path=./lh-landing.json --chrome-flags="--headless=new" --quiet
npx lighthouse "http://localhost:4173/sok" --output=json --output-path=./lh-results.json --chrome-flags="--headless=new" --quiet
```
Run each three times; the default config is the simulated mobile profile. Read `categories.*.score`, `audits.largest-contentful-paint.numericValue`, `audits.cumulative-layout-shift.numericValue` from the JSON. Put the medians in a table in the ledger and in the PR body. Confirm in DevTools on `/`: no request to the API before interaction, three font files, no third-party host, no cookie under Application → Cookies (also on the deployed site after merge — a DoD line). Delete the `lh-*.json` files.

If any budget line fails, fix it in this task (font weight, chunking, an unexpected import in the landing chunk) before the PR. Never lower the budget.

- [ ] **Step 3: Manual passes, recorded in the ledger**

Keyboard only through landing → results (every filter, pager) → detail → back; NVDA pass of the same route (title read on each navigation, combobox groups announced, result count announced); 320 px width with no horizontal scroll; 200 % zoom; OS reduced-motion on; acute strip tap-tested on a phone against the dev server.

- [ ] **Step 4: README and brand brief**

README: Stack → "Web: React 19, TypeScript, Vite, Tailwind v4, react-aria-components"; remove any mention of the design-system sync; Web section: one sentence on the landing (search first, no data until you act), one on the acute strip, one on performance ("Lighthouse ≥ 95 on the simulated phone is part of the definition of done; the measured numbers are in each PR"); Run locally: `npm run fonts` after `npm install` only when the font packages change.

`docs/brand/varde-brief.md` — one page, first person, for Claude Design: the name and story (cairns, wayfinding when visibility is poor), the audience (someone in crisis on a phone; a social worker at a desk), the tone (calm, professional, public-service, never alarmist), the locked tokens for both themes (Task 1 table), the type pairing (Fraunces 600 display, Figtree 400/600 body), the mark idea (stacked-stones cairn, single colour, must work at 16, 32 and 128 px, `currentColor` SVG), the deliverables (mark SVG, favicon set, 1280×640 social card, 1280×320 README banner, a short guidelines page), and the constraints (no gradients on controls, one accent family, contrast floors from the spec).

- [ ] **Step 5: Final review and PR**

Run everything: `npx vitest run` (**135/135**), `npx biome ci .`, `npx tsc --noEmit`, `npm run build`; `cd ../api && dotnet test` (**85/85**). Push and open the PR:

```bash
git push -u origin feat/redesign
gh pr create --base main --head feat/redesign --title "feat: Varde redesign (plan 4)" --body-file <a file with: summary, the Lighthouse and bundle tables, the manual-pass checklist ticked, and "merge = deploy web + API migration">
```
Malin merges. After the merge: confirm on the live site that the migration ran (`/api/resources?category=nodtjenester` shows rows 23–25), the fonts load from `/fonts/`, and no cookie is set — then tick the last DoD lines in the spec.

---

## Self-review

**Spec coverage.** Brand tokens and contrast test → Task 1. Type and fonts → Task 3. Design-system removal, Biome, Preflight → Task 1. Routes, legacy redirect, `lang` rule, navigation focus and titles, catalog cache → Task 6. Landing (hero, search rules, prefetch, failure path, chips as links, trust strip, emergency section, entrance motion with the headline excluded) → Task 8. Acute strip as anchors, not sticky, category link; header sticky rule; footer → Task 7. Results layout, filter bar, `aria-pressed` chips, Nullstill → Tasks 9 and 10. Combobox → Task 9. Cards (order, no clamp, Ring anchor, no-phone line) → Task 10. Detail (hero call button, copy/share, rows, back via history state) → Task 11. States (skeleton, empty, error with 116 117 only, not found) → Tasks 10 and 12. Theme (light default, system, try/catch, `color-scheme`) → Task 2 (+ `color-scheme` in Task 1's tokens). Performance budget and measurement → Task 13. Accessibility bar → Tasks 12 and 13. Seed rows → Task 4. Emergency constants and matching test → Task 5. i18n before use → every task. Testing list → matched task by task. DoD → Task 13's checks; README → Task 13; brand brief → Task 13.

**Placeholders.** The only bracketed values are the three source URLs and row names that must come from the pages Task 4 verifies, and the next-verification date copied from README; each says where the value comes from. That is the never-invent rule, not a gap.

**Type consistency.** `Route` kinds `landing | list | detail | notFound` (Task 6) are what `App.tsx` switches on in Tasks 6–8 and 13. `useArrivalFocus` returns `{ ref, requestFocus }` in Task 6 and is consumed with those names in Tasks 8, 10 (via ListPage) and 11. `Catalog` lives in `catalogCache.ts` and is re-exported from `useCatalog.ts`; `FilterBar` and `LandingSearch` import it from the cache module. `emergencyLines` / `telHref` from `services/emergency.ts` are consumed by the strip (7), landing (8), card (10), detail (11). `MunicipalityCombobox` takes `onNoMatchNational` (added in Task 9's note) and `FilterBar` passes it. `navigate(pathname, search, options?)` keeps its signature; history state is added inside the hook, so `Link` and `LanguageToggle` are untouched.

**Count trail.** 74 → 87 (T1) → 92 (T2) → 96 (T3) → 98 (T5) → 112 (T6) → 113 (T7) → 118 (T8) → 118 (T9, +3 −3) → 121 (T10) → 123 (T11) → 135 (T12) → 135 (T13). API 85 → 85 (T4 changes assertions, adds none). Counts are targets: if a repair in Task 6 adds or removes a test, restate the trail in the ledger.
