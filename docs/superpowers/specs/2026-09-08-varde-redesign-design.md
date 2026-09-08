# Varde — redesign (plan 4) design

Date: 2026-09-08. Builds on the base spec (2026-08-12), the web spec (2026-08-17) and the
deploy spec (2026-08-19). Where this document and an earlier one disagree, this one wins;
everything it does not mention stays as specified before.

## Purpose

Varde is live but looks unfinished: one flat column, a municipality list of thirty buttons,
no header, no hierarchy between "call now" and "read more". This plan gives it a visual
identity and a landing page, restructures the composition, and sets a performance and
accessibility bar that the build has to prove, not assume.

Two people have to be served at once. Someone on a phone who needs a number they can trust in
seconds, possibly in distress. And a social worker at a desk who opens Varde every day and
starts from a municipality. The first gets an acute strip that needs no interaction and a
search box that is the only thing on screen. The second gets a results page with a proper
filter bar and a grid that scans.

## Scope

In: brand tokens and type, the landing page, header and acute strip, results page composition,
municipality combobox, card and detail hierarchy, empty/loading/error states, light and dark
themes, performance budget, removal of the bundled design-system, three national emergency
rows in the seed.

Out (unchanged from earlier specs): the API, the data model, the search and paging logic, the
URL-state contract, the 15:00 handover rule, wayfinding hints, share and copy-phone, quick
exit, i18n mechanics. Out (still deferred): open-now computation, phase 2 auth, any new
municipalities.

## Brand: "Paper"

Light first. The daily user is at a desk in daylight; the person in crisis gets the same
calm page. Dark mode is a mirror, not an afterthought.

| Token | Light | Dark | Use |
|---|---|---|---|
| ground | `#f6f2ea` | `#0b0d10` | page background |
| surface | `#ffffff` | `#13161a` | cards, inputs, header |
| border | `#e3ddd2` | `#2a2f36` | hairlines |
| text | `#1d1b17` | `#f3efe7` | body |
| muted | `#5f5a52` | `#b3b0a8` | secondary text, eyebrows |
| accent | `#285f45` | `#7fc39e` | buttons, links, active chips |
| on-accent | `#f6f2ea` | `#0b0d10` | text on accent fills |
| akutt | `#b3361f` | `#ff8a7a` | emergency badge and strip |

Contrast rules, checked in a test that reads the token file: text on ground ≥ 7:1, muted on
ground ≥ 4.5:1, accent as text on ground ≥ 4.5:1, on-accent on accent ≥ 4.5:1, akutt as text
on ground ≥ 4.5:1, border against ground ≥ 1.3:1 so edges read. No colour carries meaning
alone: the akutt badge always has the word, the active chip always has a checkmark.

Type: **Fraunces** 600 for h1 and h2 only, **Figtree** 400/500/600 for everything else. Both
self-hosted from `@fontsource/*` as static Latin woff2 files, not the variable builds: the
variable Fraunces with its optical-size axis is roughly 100 KB on its own and would sit on
the LCP element's critical path. The Fraunces file is preloaded on the landing and uses
`font-display: optional`, so a late font never shifts the headline; Figtree uses `swap`. Font
bytes on `/` stay at or under 80 KB (see the budget). No third-party font requests, which
keeps the CSP as it is.

The mark is a stacked-stones cairn, one SVG, `currentColor` fill, coloured by CSS so it follows
the theme. Until the brand pack exists the app ships the placeholder from the brainstorm
mockup. The pack is built in Claude Design from a one-page brief that lists these tokens, the
type pairing, the mark idea and the sizes the app needs (favicon, 32 px header, 1280×640
social card). The brief is a deliverable of the plan; the pack is not on the critical path.

Decoration is limited to two soft radial colour blooms behind the hero, in CSS, no images.
One accent family, no gradients on controls, structure over decoration.

## Tokens live in Tailwind, the bundled design-system goes

The `web/design-system/` folder, its `design-system.css` loader, the `@layer` juggling and
the workbench sync are removed. Tailwind's `@theme inline` block in `main.css` becomes the only
token source; it maps `--color-*` utilities to CSS custom properties declared in a new
`src/styles/tokens.css`, light values on `:root`, dark values under `[data-theme="dark"]`.
That keeps the existing pattern where every utility carries `var(--token)` so the theme
switch is free. Tailwind's Preflight is imported now that the design-system reset is gone.

The Biome exclusion for `design-system` is removed. The base spec's line "the design-system
folder is consumed, never modified" is superseded: there is no folder to consume.

Two new dependencies, each earning its place:

- `react-aria-components` for the municipality combobox and any dialog. An accessible
  combobox with grouping, typeahead, mobile behaviour and screen-reader announcements is the
  one component I should not hand-roll.
- `@fontsource/fraunces` and `@fontsource/figtree` for self-hosted static font files.

No animation library. The landing's entrance is CSS keyframes. If a later feature needs
orchestrated motion, that is a new decision.

## Routes

| Path | Page | Data on load |
|---|---|---|
| `/` | Landing | none |
| `/sok` | Results | catalog + resources, as today |
| `/resources/:id` | Detail | one resource, as today |
| anything else | Not found | none |

The results page keeps today's query-string contract exactly (`search`, `category`
repeated, `municipality`, `national`, `page`, `lang`, as implemented in `urlState.ts`); only
the pathname moves from `/` to `/sok`. Old links to `/` carrying a filter parameter
(`search`, `category`, `municipality`, `national` or `page`) redirect client-side to `/sok`
with the same query so nothing bookmarked breaks. `lang` alone is not a filter: `/?lang=en`
is the English landing, and the language toggle never leaves the page it is on.

Results and detail are lazy-loaded chunks; the landing chunk carries only the landing.

### Navigation focus and titles

A client-side route change moves focus: to the h1 on the landing and the detail page, to
the results heading on `/sok`. Filter and pager changes inside `/sok` keep today's rules
(search keeps focus in the box, the pager focuses the results heading). The document title
follows the route: "Varde" on the landing, "Søk – Varde" on results, "<service name> – Varde"
on detail, "Fant ikke siden – Varde" on not found, each localised.

### Catalog cache

The catalog (municipalities and categories) is fetched at most once per language per page
load, through a module-level cache that `useCatalog` reads and the landing prefetch fills.
Retry clears the entry and fetches again. The landing and the results page therefore share
one request instead of two.

## Landing page

Above the fold, top to bottom:

1. Acute strip (see below).
2. Header (see below).
3. Hero, centred: an uppercase eyebrow ("Hjelpetjenester i Norge"), one Fraunces headline
   ("Finn riktig hjelp, der du bor."), one sentence of subtitle, then the search box.
4. "eller bla i kategorier" and the nine category chips, each an `<a>` to
   `/sok?category=<slug>`.

The search box is the same unified search as the results page: typing shows suggestions
(municipalities and categories) from the catalog, Enter or the button goes to `/sok?search=…`, a
suggestion goes straight to the scoped results. Enter always submits the typed text;
suggestions are buttons below the box reached with Tab, there is no keyboard highlighting
inside the box. The landing fetches nothing on load. The catalog request starts when the
search box receives focus or the pointer enters it (see Catalog cache), so the first
suggestions are ready by the time the first keystroke lands. If the catalog fails, the box
still works as plain search: Enter navigates and the results page shows its own error state.

Below the fold: a trust strip of three short facts (no tracking and no cookies; every number
copied from the service's own page; re-verified every six months, next pass dated), an
emergency section that repeats the four numbers as large tap targets with one line each, and
a footer (source on GitHub, language, theme). No testimonials, no screenshots, no "features".

Entrance motion: the eyebrow, subtitle and search box rise 8 px and fade in over 400 ms with
a 60 ms stagger; chips follow. The headline does not animate at all: it is the LCP element,
and an element animating from opacity 0 is not counted as painted until the animation ends.
Under `prefers-reduced-motion: reduce` everything is simply there. Nothing moves after load.

## Acute strip

One line, above the header, on every page, in the akutt colour on a tinted ground:
"Nød: 110 brann · 112 politi · 113 ambulanse · Legevakt 116 117", each number an
`<a href="tel:…">` with the digits as its visible text and a 44 px target, on desktop too.
On phones the line wraps to two rows; it never truncates and never collapses. It scrolls
with the page rather than sticking, so it never competes with the header for screen space.
It is not dismissable: the person who needs it most is the one least likely to find a
re-open control.

The four numbers are constants in `src/services/emergency.ts`, not fetched, because the
landing fetches nothing. Each constant carries the source URL it was copied from and the date.
They fall under the six-month re-verification pass like every seeded row (the verification
ledger gets a line for them). The same four services also exist as seeded rows so they are
searchable and browsable; a test asserts that the constants and the seed agree, by reading the
seed file's strings, so the two cannot drift silently.

## Header

A slim sticky header on surface with a hairline border: the mark and wordmark linking to `/`,
then on the right the language toggle, the theme toggle and quick exit. Every control has a
visible label at 768 px and up and an icon with an accessible name below that; quick exit
keeps its label at every width because it must be obvious. Height 56 px. The header is
sticky only when the viewport is at least 480 px tall; below that (landscape phones, 200 %
zoom) it scrolls with the page. The skip link stays first in the DOM.

The "Akutt hjelp" shortcut from the web spec is no longer a header button; the acute strip and
the emergency section on the landing replace it. Its behaviour (navigate to the emergency
category) survives as the strip's category link.

## Results page

Layout on phone: filter bar, results heading, one column of cards, pager. From 768 px the
grid is two columns; from 1024 px the filter bar becomes a left sidebar of 280 px and the
grid three columns, so a social worker sees nine cards without scrolling.

Filter bar, in order: search box (same component as the landing), municipality combobox,
"Nasjonale tjenester" toggle, category chips (multi-select `<button aria-pressed>`; the
checkmark on an active chip is decorative, the state lives in `aria-pressed`), and a
"Nullstill" button that appears only when a filter is set. The handover banner and the
wayfinding hint keep their current positions above the results heading.

### Municipality combobox

Built on `react-aria-components` ComboBox. Options grouped by county, typeahead on name,
clear button inside the field. Choosing "Alle kommuner" clears the filter. The no-match
row says so and offers the national toggle, as the web spec's picker does today. The
thirty-button list is removed.

Keyboard: arrow keys move, Enter selects, Escape closes without changing the value. Screen
readers hear the group name and the count of options. On phones the list opens below the
field, never as a full-screen sheet, so the page stays where the user left it.

## Cards

Order inside a card, fixed:

1. Name (h3, a link to the detail page).
2. Badges: Akutt, Nasjonal, Døgnåpent, in that order, only those that apply.
3. The description in full. No line clamp: some descriptions carry a closure notice or a
   safety line (NAV Elverum's temporary closure, for one), and a clamp would cut exactly
   those. Cards vary in height; the grid aligns them to the top.
4. Opening hours if present, one line.
5. Actions: primary "Ring", an `<a href="tel:…">` styled as a button with the digits as its
   visible text, shown when a phone exists; secondary "Detaljer" link. A card without a phone
   shows "Detaljer" as the only action and a muted "Ingen telefon, se nettside" line.
6. Muted "Sist verifisert" date.

The whole card is not a link; the name and the two actions are. That keeps the tap targets
honest and the text selectable.

## Detail page

Hero on surface: name as h1, badges, municipality or "Nasjonal tjeneste", then the call
button as the largest element on the page with the number as text, and beside it copy-phone
and share as they exist today. Below: description, opening hours, address, website, email,
chat, each as a labelled row, omitted when empty. The last-verified date closes the page. A "Tilbake til resultater" link at the top returns to the results
with filters intact. The site sends `Referrer-Policy: no-referrer` and pushState navigation
never sets a referrer, so the link cannot use one: the in-app navigate call records
`history.state.from = "sok"` when leaving the results page, the link calls `history.back()`
when that flag is present, and is otherwise a plain link to `/sok`.

## States

- Loading: skeleton cards matching the grid, not a spinner, so nothing jumps when data lands.
  The results heading area reserves its height.
- Empty: the existing empty state, restyled, with its suggestions and clear-filters action.
- Error: the existing single error state with the fallback numbers, restyled; the acute strip
  above it already carries the emergency numbers, so the error panel repeats only 116 117.
- Not found: restyled, links to `/` and `/sok`.
- Offline: no special handling this plan; the error state covers it.

## Theme

Light by default. The init script reads `localStorage.theme` inside a try/catch, because
some private-browsing modes throw on access and the script is the first one on the page;
when the value is absent or the read fails it follows `prefers-color-scheme`. The header
toggle writes the choice. `data-palette` is removed. The
`color-scheme` property is set on `:root` so native controls match.

## Performance budget (acceptance criteria)

Measured with Lighthouse in Chrome against `vite preview` of a production build, simulated
mobile, three runs, median reported in the PR:

| Metric | Budget |
|---|---|
| Lighthouse Performance, Accessibility, Best Practices, SEO | ≥ 95 each |
| Initial JavaScript for `/` | ≤ 120 KB gzipped |
| Initial JavaScript for `/sok` | ≤ 180 KB gzipped |
| LCP on `/` | ≤ 2.0 s simulated 4G |
| CLS | ≤ 0.05 |
| Font requests | 2 to 4 static files, all same-origin |
| Font bytes on `/` | ≤ 80 KB |
| Requests on `/` before interaction | HTML, CSS, JS chunks, fonts, favicon; no API call |

The build prints chunk sizes; the plan records them in the ledger at every task that touches
dependencies. If the combobox pushes `/sok` over budget, it is lazy-loaded within the results
chunk rather than trimmed.

## Accessibility bar (acceptance criteria)

- Keyboard-only pass through landing, results with every filter, detail, and every state.
- Screen-reader pass (NVDA on Windows) of the same route: landmarks, headings in order, the
  combobox announcing groups, result counts announced as today.
- 320 px width without horizontal scroll; 200 % zoom without loss.
- Contrast test in the suite (see Brand); axe run in the test suite on every page component.
- Reduced-motion verified by toggling the OS setting.

## Seed: three national emergency rows

Three new national rows in the `nodtjenester` category, in `docs/seed-data.md` first and then
`SeedData.cs`, following the existing ledger conventions and the no-calls policy:

- Brannvesen, 110
- Politi, 112
- Ambulanse / medisinsk nødhjelp, 113

Name, number, one-line description and hours (all three are always open) are copied from the
official page for each, source URL and date recorded in the ledger. Nothing is typed from
memory, including the digits. The seed tests that assert 91 resources move to 94. The migration runs at API startup as before.

## i18n

Every new string exists in `nb.json` and `en.json` before the component that uses it. The
landing headline and subtitle, the trust strip, the emergency section, the combobox labels
and announcements, the card action labels and the header control names are all new keys.
The fallback mechanism is unchanged.

## Testing

Unit and component (Vitest + Testing Library), added to the existing suite:

- Token contrast test reading `tokens.css`.
- Emergency constants match the seed file.
- Landing: no fetch on render; catalog fetch on focus; Enter navigates to `/sok?search=`;
  suggestion navigates to scoped results; catalog failure still allows search.
- Route parsing: `/`, `/sok`, legacy `/?search=` redirect, `/?lang=en` stays on the
  landing, detail, not found.
- Navigation focus: h1 focused after landing → results → detail; title per route.
- Catalog cache: landing prefetch then results mount makes one request, retry makes two.
- Combobox: typeahead, group labels, select, clear, no-match row, Escape.
- Card: action order, "Ring" is an anchor with the digits, no-phone variant, badge order.
- Detail: call button text, back link uses `history.state.from`, plain link otherwise.
- Theme init: stored value wins, system preference otherwise, light when neither, storage
  throwing falls back to system.
- Reduced motion: the entrance class is not applied when the media query matches.
- axe on every page component in both themes.

By hand, recorded in the ledger: the Lighthouse table, the keyboard pass, the NVDA pass,
320 px and 200 % zoom, reduced-motion, and a tap test of the acute strip on a phone.

## Definition of done — plan 4

- [ ] Design-system folder, loader and Biome exclusion removed; tokens in `tokens.css`
- [ ] Fonts self-hosted; no third-party requests on any page
- [ ] Landing, acute strip, header, results layout, combobox, cards, detail, states built
- [ ] Legacy `/?…` links redirect to `/sok?…`
- [ ] Three emergency rows seeded from source, ledger updated, guard test updated
- [ ] Light and dark themes complete; init follows system when unset
- [ ] All tests green, including contrast, axe, and the constants-match-seed test
- [ ] Performance table in the PR meets every budget line
- [ ] Accessibility passes recorded in the ledger
- [ ] No cookie set on any route of the live site, in either theme, checked in DevTools before
      the trust strip claims it; if one appears the strip says "ingen sporing" only
- [ ] Brand brief written and handed over; placeholder mark in place
- [ ] README updated: stack section, no design-system sync, performance and verification notes

## Deferred decisions

- Open-now computation and a "open now" filter (blocked on structured opening hours).
- A Lighthouse CI job; this plan measures by hand and records the numbers.
- Replacing the placeholder mark with the pack's mark and uploading the social preview.
- Offline support and a service worker.
- Phase 2 auth.

## Accepted trade-offs

- Light first breaks my dark-first habit on purpose; a daytime desk tool is the primary use.
- The acute strip costs 40 to 60 px on every page. Worth it: the strip is the product's
  promise.
- `react-aria-components` is a real dependency. A hand-rolled combobox would be smaller and
  worse.
- Emergency numbers are duplicated: constants in the web app and rows in the seed. The
  matching test is the price of a landing that fetches nothing.
- The pager stays as prev/next; infinite scroll would fight the "results heading gets focus"
  behaviour that already works.
