# Varde — plan 2 (web) design

**Date:** 2026-08-17
**Base:** [2026-08-12-varde-design.md](2026-08-12-varde-design.md). Its Frontend, Error handling,
Accessibility, Testing, Repository layout, and Configuration sections are **binding by reference**
— this document only adds to or overrides them, and says so explicitly where it does.

---

## Scope

Plan 2 builds `web/` from the workbench `web-react-ts` scaffold and implements the base spec's
frontend design, plus the deltas below. Two small API additions ride along — the `national`
query parameter and the `IsAlwaysOpen` flag — each the size of a bool, a filter, and its tests.
Nothing else touches the backend; the structured-hours table stays deferred.

**Done means:** the app runs locally against the API; all frontend (Vitest + RTL) and backend
(xUnit) tests green; keyboard-only pass by hand; CORS verified with a real preflight from the
Vite dev origin. Deployment is plan 3.

---

## Unified search

One search field reaches everything by name or keyword.

- The query is sent to `GET /resources?search=` (service names + descriptions), as in the base
  spec — debounced, cancellable, URL-driven.
- The same query is matched **client-side** against the kommune list and the category names,
  case- and diacritic-insensitively, in both containment directions: "rusbehandling" contains
  "rus" → the Rus category matches; "ham" is contained in "Hamar" → Hamar matches. Both lists
  are small (8 and 9) and already fetched for the filters; no new requests.
- Matches render as tappable **filter suggestions** above the results — "Hamar (kommune)",
  "Rus (kategori)". Each suggestion is a real `<button>` at least 44×44 px. Tapping one
  applies it as a filter, composing with the text search. All filters live in the URL (base
  spec rule).
- Suggestions are announced as part of the **single settled StatusRegion announcement** (base
  spec: one `aria-live` region, one update per settled result set) — e.g. "12 treff. Forslag:
  Hamar, Rus." They are never their own live region and never announced per keystroke.
- **Zero results is never a dead end** (base spec rule, restated because it governs this
  feature): the empty state offers the national fallbacks, suggests widening filters, and
  shows any kommune/category suggestions the query matched.

## Paging

The base spec left the paging UI undefined; plan 2 defines it. A **prev/next pager**
("Forrige" / "Neste" + "Side X av Y") below the results — real buttons, disabled at the ends,
page number in the URL (`?page=`). Prev/next is chosen over "load more" because appended
results and a `?page=` URL contradict each other on reload, and over numbered pages because
eight municipalities of data do not need random access.

**Any change to search text, filters, or language resets `page` to 1.** Without this, applying
a filter while on page 3 strands the user on an empty page that quietly reads as zero results.
An out-of-range or non-numeric `page` in a hand-edited URL follows the postures section.

## Kommune/fylke picker

A labelled text input ("Finn din kommune") above an **always-visible list** grouped under
fylke headings (Innlandet, Oslo). Typing filters the list instantly. This is a filtered
visible list, **not** an ARIA combobox: plain input, real links, semantic HTML — keyboard and
screen-reader behaviour come free instead of hand-built.

- Empty input shows the full grouped list: that is the fylke → kommune browse path.
- **Nasjonale tjenester** is pinned above the fylke groups and also matches search text.
- No match: "Fant ikke kommunen din" — explains that coverage is limited today and links the
  Nasjonale tjenester view.
- Filtering the list is announced through the same settled StatusRegion pattern as search
  ("5 kommuner vises"), debounced — never per keystroke, never a second live region.
- Selecting a kommune sets `?municipality=<id>`. Results include national services
  automatically (API behaviour since phase 1); they carry the Nasjonal badge.
- **`municipality` and `national` are mutually exclusive in every URL the frontend
  constructs.** Selecting a kommune from the national view drops `national`; selecting
  Nasjonale tjenester drops `municipality`. The API's 400 exists for hand-edited URLs, not as
  something the frontend can trigger.
- **Unknown ids degrade, never crash:** a hand-edited `?municipality=` that matches no known
  kommune (or an unknown `?category=` slug) renders `EmptyState` with a clear-filter action,
  and the picker shows no selection. The API already returns an empty page for it; the
  frontend must not render a phantom selected kommune.

## Nasjonale tjenester

**API delta.** New optional `national` (bool) on `GET /resources`. `true` returns only rows
with `IsNational`, composing with `search`, `category`, and paging as usual. Sending both
`national=true` and `municipality` is contradictory and returns **400 ProblemDetails** —
explicit, not silently ignored. `national=false` and `national` absent are equivalent.

**Frontend.** The pinned picker entry maps to `?national=true`. In kommune views, national
rows carry a **"Nasjonal"** badge so it is visible they serve everywhere.

## Badges

Three badges, each stating something the data actually contains:

| Badge | Source of truth | Meaning |
|---|---|---|
| Nasjonal | `IsNational` | Serves the whole country |
| Akutt | category `nodtjenester` | For an ongoing emergency (category truth, **not** an hours claim) |
| Døgnåpent | `IsAlwaysOpen` (new) | The verified source states 24/7 service |

**`IsAlwaysOpen` — API delta.** A bool on `Resource` (same shape as `IsNational`), exposed on
`ResourceDto`, **seeded only where the already-verified source states døgnåpent** — the
verification pass recorded those hours verbatim, so setting the flag is copying, not deciding.
Rows with ambiguous or partial hours stay `false`. **Absence of the badge means "see the hours
text", never "closed at night."** The flag stays current the way every other datum does:
`LastVerified`. No parsing of the free-text `OpeningHours` — deriving state from prose is the
guess this project refuses.

**Per-service hours are authoritative.** Cards and the detail view render the translated
free-text `OpeningHours` wherever the service is shown; on the detail view it sits prominently
with the contact information, not below the fold. Fastlegekontor — and any service with its own
hours — differ from each other, and the service's verified hours text always wins over any
generic guidance this application renders. No generic rule (the 15:00 banner included) may
appear in a context where it could read as that service's hours — see the banner rules below.

## Akutt access and the 15:00 handover

- A persistent **"Akutt hjelp"** shortcut in the shell (adjacent to QuickExit, visually
  distinct from it) jumps to `?category=nodtjenester`. At any hour that view is the right
  destination — this serves the "open now" intent honestly without hours data.
- The **fastlege → legevakt handover** is a fixed rule needing no per-service data: a banner
  reads, on weekdays between 08:00 and 15:00, "kontakt fastlegen din" (with the HelseNorge
  fastlege link), and outside that window — evenings, nights, weekends — "legevakt 116 117"
  as a `tel:` link. The 08:00–15:00 window is a wayfinding rule of this application, not a
  claim about any specific fastlege's hours. Rules that keep it honest:
  - The daytime variant **always carries the legevakt fallback line** ("Akutt, eller fastlegen
    stengt? Legevakt 116 117") — so on a public holiday or at an office with shorter hours the
    guidance is still safe without computing the Norwegian holiday calendar.
  - The banner renders **only on the list view, never on the resource detail route** — a
    specific service's own hours are authoritative there, and generic guidance next to them
    could read as a claim about that service.
  - Computed from the client clock on mount and **recomputed when the tab regains visibility**
    (`visibilitychange`), so an app left open across 15:00 does not show stale guidance.
    It is not an `aria-live` region; it changes only at those moments.
  - Translated like all interface strings.
- Per-service "open now" computation is **deferred** until a structured hours table exists —
  see Deferred decisions.

## Contextual wayfinding hints

A small curated keyword → destination map, maintained as content per language (in `i18n/`,
alongside the interface strings): queries matching "fastlege", "frikort", "resept" and similar
surface **HelseNorge**; equivalents exist for Regjeringen.no and peers only where the
destination is clearly right. Rendering rules, designed so hints help without nagging someone
looking for help:

- At most **one** hint at a time, in a quiet slot under the results header.
- Shown only while a triggering query is active; gone when the query changes.
- Never a substitute for results — it renders alongside them, not instead of them.
- **Hint text and destination are static content.** The user's query is never interpolated
  into the hint text, and destination URLs are fixed landing pages that never carry the query
  — no search term leaves this application in a link.
- Hints are ordinary links in the tab order; they are not announced through StatusRegion
  (supplementary content, not a result).
- External links carry `rel="noopener noreferrer"` (base spec, Referrer leakage).

The map ships small (a handful of entries whose destinations were checked at seed time) and
grows only through the same verification discipline as the seed data.

## Postures

- **Non-numeric query params** (`?municipality=abc`): the framework's automatic 400 stands.
  The frontend never emits one — params come from typed state, not free text — and
  `ErrorState` covers the hand-edited-URL case like any other failed request.
- **CORS**: the plan includes a verification task exercising a real preflight from the Vite
  dev origin against the API — the phase-1 `WithMethods("GET")` restriction finally meets a
  real browser.

## Testing (additions to the base spec's list)

**Backend:** `national=true` returns only national rows; composes with `search` and
`category`; `national` + `municipality` → 400; `IsAlwaysOpen` flows to the DTO; seed
composition asserts the flag only on rows whose hours text records døgnåpent.

**Frontend:** picker filtering narrows the list and no-match renders the national-view link;
suggestions appear for kommune and category matches and applying one updates the URL **and
resets `page` to 1**; the pager disables at both ends and filter changes reset it; the three
badges render from their fields, and Døgnåpent absent ≠ any "closed" rendering; the handover
banner shows the correct variant for injected clock times (weekday morning, weekday after
15:00, weekend), always includes the legevakt fallback in the daytime variant, and **does not
render on the detail route**; selecting a kommune from the national view produces a URL with
no `national` param (and vice versa); an unknown `?municipality=` id renders `EmptyState`
with a clear-filter action and an unselected picker; a wayfinding hint renders for a mapped
keyword, at most one, clears with the query, and its href never contains the query text. The
base spec's race test, empty-state, i18n, and focus tests all still apply.

---

## Definition of done — plan 2

- [ ] `web/` built from the scaffold; Counter example files removed
- [ ] All base-spec frontend behaviours implemented (states, i18n, a11y, race handling)
- [ ] Unified search with suggestions; picker with browse + no-match paths; prev/next pager
      with reset-on-filter-change
- [ ] Nasjonale view + `national` param; three badges live
- [ ] Akutt hjelp shortcut + 15:00 banner
- [ ] Wayfinding hints with the starter map
- [ ] Frontend + backend tests green, including the additions above
- [ ] Keyboard-only pass by hand; usable at 320 px; contrast checks incl. badges and hints
- [ ] CORS preflight verified from the Vite dev origin

## Deferred decisions

- **Structured hours table / per-service open-now** — unchanged from the base spec's deferral.
  `IsAlwaysOpen` deliberately does not attempt it; intervals, weekday logic, and a "åpent nå"
  filter wait for their own backend plan.
- **Døgnåpent as a filter** (`alwaysOpen=true` param): cheap once the flag exists, but out of
  plan 2's scope — the badge ships first, demand decides the filter.
- **Hint map growth** — new destinations enter through the seed-verification discipline, not
  ad hoc.

## Accepted trade-offs (named so they are decisions, not omissions)

- **Search text lives in the URL and therefore in browser history.** Base-spec decision,
  binding: shareability and a working back button won. The quick exit (which leaves no
  back-history entry) is the mitigation for a user who needs the visit gone.
- **The banner ignores Norwegian public holidays.** Computing the movable holiday calendar
  client-side is real scope for a marginal case; the always-present legevakt fallback line
  makes the daytime variant safe on a holiday rather than wrong.
