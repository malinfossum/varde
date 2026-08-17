# Varde — design

**Date:** 2026-08-12
**Status:** Approved (phase 1)
**Author:** Malin Fossum

---

## Name

*Varde* is Norwegian for a cairn — stacked stones marking a safe route across the fjell — and
also for a beacon, a signal fire lit on a hilltop. Both meanings describe the application: a
marker left by people who went before, and a light visible from a distance when you are lost.

Availability checked 2026-08-12: no GitHub project of this name, `varde` is free on npm.
`varde.no` belongs to Varde Hartmark, an unrelated Norwegian consultancy; the project does not
need that domain.

---

## Purpose

A public, searchable directory of Norwegian social services. Someone in difficulty — or the
caseworker helping them — should be able to find the right service, in the right municipality,
with contact details that still work, in under a minute.

The application exists because this tool was missing from the author's own work as a sosionom.

### Users

1. **A person seeking help.** May be in crisis. May not read Norwegian. May be on a phone, on
   mobile data, in a hurry.
2. **A caseworker.** Knows the domain, needs speed and accuracy, wants to send someone a link.

User 1 governs every design decision where the two conflict.

---

## Scope

### Phase 1 — public directory (this spec)

Search and browse services. Filter by category and municipality. Bilingual, Norwegian default.
Read-only. No accounts. Deployed publicly.

### Phase 2 — oppfølging and fristoversikt (separate spec)

Authentication, then Person → Meeting → Note → Tiltak, with a dashboard surfacing cases
approaching their saksbehandlingsfrist. The directory becomes a feature inside it: while
following someone up, search services and attach one to their plan.

Phase 2 shares this codebase and this database. It is deliberately not designed here.

### Non-goals for phase 1

No authentication. No user accounts. No public submission of services. No admin UI — seeding
happens through an EF Core migration. No map view. No i18n library. No state-management
library. No mobile app.

---

## Data and privacy

**Phase 1 contains no personal data of any kind.** Every record describes a public
organisation: NAV Hamar, a krisesenter, a gjeldsrådgivning office. Names, addresses and phone
numbers of *organisations* are already public information.

Phase 2 will introduce records about people. Those will be seeded, obviously fictional data
only — never real client information, in any environment, at any point. This is stated in the
README as a deliberate design position, not a disclaimer.

The application sets no cookies, runs no analytics, and stores nothing about its visitors. A
person looking up a krisesenter should leave no trace on the server. Language preference is
kept in `localStorage`, client-side only.

That promise is not automatic — three things have to be actively prevented, because the default
behaviour of the stack breaks it.

### Logging and retention

Search terms travel in the query string, and both Azure App Service HTTP logging and
Application Insights capture full request URLs together with client IP by default. Shipped
unmodified, the server would hold a timestamped record that a given IP searched `krisesenter`.

- **Application Insights is not provisioned.** Not configured-and-quiet — not created.
- **App Service HTTP logging is disabled.** If it is ever enabled for diagnostics, query strings
  are stripped first.
- Application logs record **result counts, never search terms**.
- No log aggregation, no retention period, because there is nothing retained. The README states
  this plainly rather than leaving "no tracking" to be inferred.

### Referrer leakage

Every `ResourceCard` links out to a service's own website. By default the browser attaches the
current Varde URL — search terms included — as the `Referer` header, so a third party would
receive `?search=vold+i+nære+relasjoner` for each visitor who clicks through.

- `<meta name="referrer" content="no-referrer">` on the document.
- `rel="noopener noreferrer"` on every external link.

### Browser history and the quick exit

Filters live in the URL by deliberate design — shareable, pre-filtered links are genuinely
useful to a caseworker. The cost is that `?search=krisesenter` lands in browser history, which
on a shared computer is a concrete physical risk rather than a theoretical one.

The application therefore carries a persistent **"Forlat siden"** control, the pattern used by
krisesenter.no and dinutvei.no: it navigates immediately to a neutral site using
`location.replace()`, so the current page does not survive in the back history. It is reachable
by keyboard, visible on every screen, and never hidden behind a menu.

---

## Data model

Six tables. Translations live in the database, not only in the UI — an English interface
wrapped around Norwegian service descriptions would be worse than no English at all.

| Entity | Fields |
|---|---|
| **Resource** | `Id`, `Name`, `IsNational`, `MunicipalityId?`, `Address?`, `Phone?`, `Email?`, `Website?`, `LastVerified`, `CreatedAt`, `UpdatedAt` |
| **ResourceTranslation** | `Id`, `ResourceId`, `LanguageCode`, `Description` |
| **Category** | `Id`, `Slug` |
| **CategoryTranslation** | `Id`, `CategoryId`, `LanguageCode`, `Name` |
| **ResourceCategory** | `ResourceId`, `CategoryId` — join table |
| **Municipality** | `Id`, `Name`, `County` |

### Decisions

**`Name` is not translated.** NAV Hamar is NAV Hamar in every language. Municipality names are
proper nouns for the same reason. Only `Description` and category names are translated.

**Categories are many-to-many.** NAV covers both økonomi and arbeid. Forcing a single category
would misfile services, and a misfiled service is an invisible service. The join table is worth
one extra migration.

**`LastVerified` is a required field, shown on every card.** Out-of-date contact information in
this domain is not an inconvenience — it is a person reaching a dead number on a bad day. The
UI displays *"Sist bekreftet 12.08.2026"* so the user can judge for themselves.

**`MunicipalityId` is nullable.** National services (Mental Helse, Kirkens SOS) belong to no
municipality and must appear in every municipality's results. `IsNational` drives that.

**Language codes are BCP 47:** `nb` for bokmål and `en`. Not `no` — `nb` is what belongs in
`<html lang>` for correct screen-reader pronunciation.

**`Description` is plain text.** Never HTML, never markdown. It is rendered as `{description}`
in JSX and `dangerouslySetInnerHTML` appears nowhere in the codebase. When a description needs
to point somewhere, that is what the structured `Website`, `Phone` and `Email` fields are for.
This matters most in phase 2, where an admin path could otherwise turn a description into a
stored-XSS vector.

### Seed data

Phase 1 ships with **20** real services across at least three Innlandet municipalities, each
with both `nb` and `en` descriptions. Curated by hand from municipal and NAV websites.

Twenty is deliberate. Quality over quantity: every entry is verified at seed time, and a wrong
phone number in this domain does more harm than a missing service does. Seed data is rows in a
migration, so the directory grows by appending — no restructuring required.

---

## API — ASP.NET Core, layered with repository

```
GET /api/resources?search=&category=&municipality=&lang=nb&page=1&pageSize=20
GET /api/resources/{id}?lang=nb
GET /api/categories?lang=nb
GET /api/municipalities
```

Read-only. Paged envelope: `{ items, page, pageSize, totalCount }`.

| Parameter | Accepts | Behaviour |
|---|---|---|
| `search` | free text | Case-insensitive match against `Resource.Name` and the description in the requested language. Empty or absent means no text filter. |
| `category` | category `Slug` | Slugs, not ids — the URL stays readable and shareable. Repeatable for multiple categories (OR). |
| `municipality` | municipality `Id` | Results include that municipality's services **plus** all services where `IsNational` is true. |
| `lang` | `nb` or `en` | Defaults to `nb`. **An unrecognised value falls back to `nb` silently — it is never a 400.** A truncated or mistyped shared link must still show the directory; someone already struggling should not meet an error page because a URL lost a character. |
| `page` | integer ≥ 1 | Defaults to 1. |
| `pageSize` | integer 1–100 | Defaults to 20. Values above 100 are clamped to 100. |

No authentication, because none is needed. Adding auth to a directory of public information is
exactly the over-engineering that would be flagged in review.

Errors use `ProblemDetails`, which ASP.NET Core provides. A request for a resource id that does
not exist returns **404 with `ProblemDetails`**, not an empty 200. OpenAPI spec published —
phase 2 will generate the frontend's TypeScript types from it.

### Sort order

Results are ordered: **local services before national ones, then `Name` ascending, then `Id`
ascending** as a final tiebreaker.

The tiebreaker is not cosmetic. PostgreSQL guarantees no row order without an `ORDER BY`, and
`OFFSET` paging over a non-total sort can show one service on two pages while another is never
reachable at all — a failure nobody reports, because you cannot report the entry you never saw.
Local-before-national keeps the nearest help at the top of page one.

### Rate limiting

`search` runs a case-insensitive scan across names and descriptions on a burstable-tier
database. The API is public and unauthenticated, so nothing otherwise prevents one script from
saturating it — or from spending the Azure budget of a private individual.

ASP.NET Core's built-in rate limiter (`AddRateLimiter`, fixed window, keyed by client IP).
The spending cap stays as a backstop; it is not the control. A cap that trips takes the site
*down*, which fails the user worse than being slow does.

### Query safety

Text search stays in LINQ, where EF Core parameterises it. If raw SQL is ever needed for
`ILIKE` performance, it uses parameters — never string interpolation into `FromSqlRaw`.

### CORS

The frontend and API are on different origins (Static Web Apps and App Service). A named CORS
policy allows the Static Web Apps origin plus `localhost` for development. Not
`AllowAnyOrigin`.

### Translation fallback

If a resource has no translation in the requested language, the API returns the `nb` text and
sets `isFallbackTranslation: true` on the item. The UI then shows a small honest note —
*"This description is only available in Norwegian"* — rather than silently serving Norwegian to
someone who asked for English.

---

## Frontend — Vite + React + TypeScript

### Components

```
App              layout shell
QuickExit        "Forlat siden" — persistent, keyboard-reachable
LanguageToggle   nb / en
SearchBar        debounced text input
FilterPanel      category + municipality
StatusRegion     single aria-live region — see Accessibility
ResourceList     results
ResourceCard     one service
ResourceDetail   detail route
EmptyState       the fallback path — see below
ErrorState       failure + retry
NotFoundState    unknown resource or unmatched route
LoadingState
```

### Routes

`/` — list. `/resources/:id` — detail. A catch-all route renders `NotFoundState`, as does a
detail route whose id returns 404. Both offer a way back to search, because a stale shared link
is the likeliest way someone arrives there.

Paths stay in English regardless of UI language; the language is a query parameter, not a route
segment.

### State

`useState` for filters, `useEffect` + `fetch` for data. **No Redux, no Zustand, no TanStack
Query.** The primitives are the lesson. A library adopted before feeling the problem it solves
is a library that cannot be explained in an interview.

**Filters live in the URL query string.** A search is then shareable, the back button works,
and refreshing does not lose your place.

Types are hand-written for phase 1 so the author understands what a type is, then generated
from OpenAPI in phase 2 so the author understands why generation is better.

Data flows one direction: URL params → state → fetch → typed response → render.

**Every request is cancellable.** The `useEffect` that fetches results creates an
`AbortController` and aborts it in its cleanup, so a superseded request never resolves into
state.

Without this, debounced input guarantees a race: type `kri`, then `krisesenter`, and if the
first response arrives last the list shows results for `kri` while the input reads
`krisesenter`. On mobile data that is common, not rare — and confidently showing results for a
query the user did not make is the worst failure mode this application has.

This is also the argument for the no-library decision paying off rather than costing: request
cancellation is precisely one of the problems TanStack Query exists to solve, and solving it by
hand once is what makes reaching for the library later an informed choice.

**External links carry `rel="noopener noreferrer"`** — see Referrer leakage above.

### Internationalisation

Hand-rolled: a `LanguageProvider` using React Context, a `useTranslation()` hook, and
`src/i18n/nb.json` + `src/i18n/en.json`.

Not `react-i18next`. The application has roughly forty interface strings; the library's plural
rules and interpolation engine would go unused. Building it by hand teaches React Context — a
fundamental that a project this size would otherwise skip entirely. Phase 2 may swap to the
library, by which point its behaviour will be understood rather than assumed.

Resolution order: `?lang=` → `localStorage` → `nb`. Unrecognised values are ignored rather than
rejected, matching the API.

**`localStorage` is written only on an explicit toggle, never from URL resolution.** A
`?lang=nb` link opens in Norwegian for that visit without overwriting the reader's saved
preference — otherwise an English-reading user who follows a colleague's shared Norwegian link
silently loses their setting to someone else's URL.

On change the provider updates `document.documentElement.lang`, reflects the language in the
URL, and announces the switch through `StatusRegion`.

---

## Error handling

Three explicit states, none of them silent: loading, error, empty.

**Errors offer a retry.** A failed fetch shows what happened and a button, never a blank page.

**Zero results is never a dead end.** This is a requirement, not a nicety. When a search returns
nothing, `EmptyState` offers national fallbacks — NAV, 116 117 (legevakt), Mental Helse 116 123,
Kirkens SOS — and suggests widening the filters. Someone using this application may be in
crisis. A blank screen is a design failure, not an edge case.

**Every emergency number is a `tel:` link.** The likeliest device in the likeliest scenario is a
phone, and a number that has to be memorised and retyped is a number that does not get called.

**A missing resource is not an error page.** `NotFoundState` explains that the service may have
moved or closed, shows `LastVerified` context where possible, and routes back to search. Stale
shared links are expected traffic, not an exceptional case.

---

## Accessibility

Requirements, verified before phase 1 is called done:

- Every interactive element reachable by keyboard, with a visible focus indicator.
- Every input has an associated `<label>`.
- `<html lang>` matches the active language at all times.
- Semantic HTML and a real `<form>` — not divs with click handlers.
- A skip link to `<main id="main">`, so a keyboard user is not tabbed through every filter
  control to reach results on each visit.
- Touch targets at least 44×44 px.
- All animation and transition respects `prefers-reduced-motion`.
- Usable at 320 px width.
- Contrast at least 4.5:1 for body text **and for `LastVerified`** — which will be rendered as
  small muted text, and is exactly where contrast gets quietly lost.

### The status region

A single `aria-live="polite"` region owns every asynchronous announcement, and it updates
**once per settled result set** — after the debounce fires and the request resolves. Not per
render.

The naive version, announcing the count whenever it changes, interrupts a screen-reader user
mid-word with the consequences of their own typing: searching `krisesenter` produces a burst of
renders and a burst of announcements. The same region also announces the loading state, so
changing a filter is not silent, and confirms a language switch.

### Focus

Focus remains on `LanguageToggle` after it is activated. Switching language re-renders every
string on the page, and the default outcome of that is focus falling to `<body>` — stranding a
keyboard user at the top of the document with no indication of why.

Styling is mobile-first with `min-width` breakpoints at 768 px and 1024 px, dark-mode-first,
using the workbench design-system tokens imported as plain CSS. **The design-system folder is
consumed, never modified.**

---

## Testing

**Backend (xUnit):** repository filtering and paging; the translation-fallback rule; national
services appearing in every municipality's results; **sort order is total and paging is stable
across pages** (no duplicates, no unreachable rows); an unknown `lang` falls back to `nb`
instead of erroring; a missing resource id returns 404; endpoint integration tests via
`WebApplicationFactory`.

**Frontend (Vitest + React Testing Library):** filtering narrows results; empty state renders
the national fallbacks as `tel:` links; language toggle changes rendered strings *and*
`<html lang>` *and* keeps focus; error state renders a working retry; `NotFoundState` renders
for an unknown id.

**The race has a test.** A superseded request that resolves late must not overwrite state from
the current one — resolve two fetches out of order and assert the rendered list matches the
latest query. This is the bug most likely to reappear during a refactor, and the one least
likely to be caught by hand.

Tests target behaviour, not implementation. The existing Stop hook runs `dotnet test` and
`npm test` automatically, so this enforces itself.

---

## Repository layout

**Both halves are copied from workbench scaffolds, not built from scratch.** `scaffolds/csharp-api`
for the backend and `scaffolds/web-react-ts` for the frontend (workbench v2.6.0, 2026-08-12).
Names and folder conventions below follow those scaffolds — the project adopts their structure
rather than inventing its own.

```
varde/
  api/                      ← from scaffolds/csharp-api
    Varde.Api/              controllers, ProblemDetails, OpenAPI
    Varde.Core/             entities, interfaces
    Varde.Data/             EF Core, repositories, migrations, seed
    Varde.Tests/
    Varde.slnx
    global.json
  web/                      ← from scaffolds/web-react-ts
    src/
      components/
      hooks/
      services/             fetch client — scaffold convention, not `api/`
      i18n/                 nb.json, en.json          (new)
      types/                hand-written API types    (new)
      styles/
    design-system/          bundled with the scaffold — read-only
  docs/
  README.md
```

The scaffold ships `Counter.tsx`, `useCounter.ts` and `services/counter.ts` as a worked MVC-ish
example. These are removed once the equivalent Varde components exist — read them first, they
are the reference for how the layers talk to each other.

Biome for `web/`, excluding `design-system/`. `.editorconfig` for `api/`.

---

## Configuration and secrets

This repository is destined for public GitHub, and git history is permanent — a credential
committed once is not removed by rotating the password afterwards, and scanners crawl new
public repositories within minutes of creation.

- **Local development:** connection string in `dotnet user-secrets`. Never in
  `appsettings.json`.
- **Production:** Azure App Service configuration, injected as environment variables.
- `appsettings.Development.json` and `.env` are gitignored.
- **The `.gitignore` exists before the first commit.** Adding it afterwards leaves the secret in
  the history it was meant to prevent.

The repository stays private until the history has been checked and the deployment is
confirmed clean.

---

## Deployment

Azure — Static Web Apps for the frontend, App Service for the API, Azure Database for
PostgreSQL Flexible Server (burstable tier). A spending cap is set before anything is
provisioned. This advances roadmap priority 3 (Docker + Azure) alongside priority 2.

Application Insights is deliberately **not** provisioned, and HTTP logging stays off — see
Logging and retention.

Fallback if Azure cost becomes a problem: frontend to GitHub Pages, API elsewhere.

---

## Definition of done — phase 1

- [ ] 20 services seeded across at least 3 Innlandet municipalities, in `nb` and `en`
- [ ] All backend and frontend tests green
- [ ] Deployed, with the live URL in the README
- [ ] Lighthouse accessibility score at least 95
- [ ] README states the data policy and the phase 2 plan
- [ ] Keyboard-only pass completed by hand
- [ ] No secret committed — `.gitignore` verified against the full history before publishing
- [ ] Application Insights confirmed absent and HTTP logging confirmed disabled in Azure
- [ ] Quick exit verified: leaves no back-history entry, reachable by keyboard
- [ ] External link checked in devtools — no `Referer` header sent

---

## Deferred decisions

**Who verifies the data, and how often?** `LastVerified` implies a process that does not exist
yet. For phase 1 the author verifies by hand at seed time. A real answer is needed before the
directory is promoted anywhere beyond a portfolio piece.

**Phase 2 authentication:** ASP.NET Core Identity or Microsoft Entra ID. Decided in the phase 2
spec, not here.

**Phase 1.5 (decided 2026-08-13):** two feature areas raised during seeding, deliberately not
absorbed mid-build: a **forms library** (per service, marked paper/digital/both, printable for
people who don't use the internet, with device-local favourites — no accounts, so `localStorage`)
and **tjenestenivå guidance** (what is primærhelsetjeneste vs. sekundærhelsetjeneste vs. statlige
tjenester — who to contact, what to expect, how to move forward when applying). Each gets its own
brainstorm → spec → stress test after phase 1 ships. Husbanken's skjemaoversikt is the worked
example for the first; "how do I apply for co-parenting" is the north star for the second.

**Time-of-day availability (requested 2026-08-17, for the web spec / plan 2):** the app should
show, based on when the user opens it, which services are open right now — and surface the
fastlege → legevakt handover at 15:00 (daytime: contact your fastlege; after 15:00: legevakt
116 117). Design constraint discovered when the request landed: phase 1 stores opening hours as
translated free text (`OpeningHours` on `ResourceTranslation`), which cannot drive an "open now"
computation — parsing Norwegian prose like "Hverdager til 15.30 (16.00 fredag) settes over til
Stangehjelpa" is exactly the kind of guess this project refuses to make. Plan 2's spec must
decide: add a structured hours table (per-weekday intervals, seeded from the same sources,
nullable for rows where hours are genuinely unknown) alongside the display text, or ship the
feature category-scoped only (nødtjenester = døgnåpent) without per-service computation. The
`nodtjenester` category (ninth category, strict acute-lines-only, decided the same day — see
seed-data.md ## Categories) is the first half of this request and ships with Task 9.
