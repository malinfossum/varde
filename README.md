# Varde

A bilingual (Norwegian/English) directory of social services in Norway — find the right
service in the right kommune, with contact details you can trust in a crisis.

Named after the *varde*: the stone cairns that mark Norwegian mountain routes so you can
find your way when visibility is poor.

## Why

Built from social-work practice — this is the tool I needed as a sosionom and never had.
Service directories go stale, and a dead phone number fails exactly when someone finally
dials it. Varde treats contact data as safety-critical.

## Status

Phase 1, the API, is complete: 94 services across 8 municipalities (Innlandet and Oslo)
plus national services, described in Norwegian and English. Phase 2, the web frontend,
is complete. Phase 3, deployment, went live 2026-09-04. The current design — light-first,
self-hosted type, a search-first landing page — shipped 2026-09-09.

**Live:** https://varde.pages.dev

The site is static. Every page is prerendered from the database once a day and on every
push, so nothing waits on a server. Search runs in the browser over a small JSON index.

## Data verification

Every service was verified against official sources before entering the database — two
independent verification passes, with conflicts resolved by source hierarchy (a service's
own site outranks a re-listing) and unconfirmable details left empty rather than guessed.
The full audit trail is in [docs/verification/](docs/verification/). Phone numbers
belonging to named individuals are never published, and shelters that withhold their
address for safety are listed without one by design. Every row is re-verified against its
source every six months, and the date shown as "Sist bekreftet" is the date of that check.
The four numbers on the acute strip live in `web/src/services/emergency.ts` as constants
(the landing page fetches nothing) and are re-verified in the same six-month pass as the
rows; a test keeps them identical to seed rows 3 and 23–25.

**Report an error.** Every resource page has a "report wrong information" `mailto:` link
that goes to a forwarding alias, `varde.implicate775@passmail.com`, so a stale number or
address reaches me without exposing my own inbox.

## Stack

- API: ASP.NET Core (.NET 10), EF Core, PostgreSQL 17
- Web: React 19, TypeScript, Vite, Tailwind v4, react-aria-components
- Hosting: Cloudflare Pages, database on Neon

## API

- `GET /api/resources` — text search, municipality and category filters, stable paging; `?lang=nb|en`
- `GET /api/resources/{id}`
- `GET /api/categories`
- `GET /api/municipalities`

Municipality filters include services that *serve* a kommune without being located in it —
interkommunale krisesentre are the motivating case. The API is rate-limited, and
application logs record result counts, never search terms.

## Web

The landing page is search-first: one box, nine category chips, and no data fetched until
you act on it. Above every page sits an acute strip with the four emergency numbers as
hardcoded constants, not a fetch, so it works even if the API is down. Unified search across
name, category and municipality, with suggestions and a national toggle. Details on the
shift from fastlege to legevakt after hours, when a service's own opening hours are known.
Light theme by default, with a toggle that starts from the system setting and remembers the
choice, and a quick exit in the header that replaces the history entry, so the visit does not
survive the back button. Bilingual throughout, built for keyboard access, and built
mobile-first.

Lighthouse ≥ 95 on the simulated phone is the definition of done, and the measured numbers
are in each PR. Accessibility is 100 across the site and the landing page scores 99 on
performance; `/sok` scores 67–74 and misses that budget. It is LCP-bound — the largest
element is the first result heading, which cannot paint before the API answers — and it is
reported rather than tuned away.

## Run locally

Prerequisites: .NET 10 SDK, PostgreSQL 17 on localhost, and Node.js for the web frontend.

```bash
# API
cd api
dotnet test
dotnet run --project Varde.Api

# Web (separate terminal, with the API running on port 5005)
cd web
npm install
npm test
npm run data
npm run dev
```

Tests create disposable `varde_test_<guid>` databases. The connection defaults to the
standard local development setup (`localhost`, `postgres`/`postgres`); override it with the
`VARDE_TEST_PG` environment variable. `npm run data` exports the API's data into
`web/public/data/` so the dev server has something to search over; re-run it whenever the
underlying data changes. Run `npm run build` instead of `npm run dev` for the full prerender
— it builds the client and server bundles and writes a static `web/dist/` with one page per
URL, matching what the deploy workflow produces.

Fraunces and Figtree are vendored into `web/public/fonts/`, so `npm install` is enough for a
normal checkout. Only run `npm run fonts` if you bump the `@fontsource/*` package versions —
it re-copies the woff2 files from `node_modules` and a drift test catches a checkout that
forgets to.

## Deployment

Varde deploys via a single GitHub Actions workflow, `deploy-web.yml`, on a push to `main`, a
daily cron at 04:00 UTC, and manual dispatch. The workflow starts the API inside the runner
against **Neon** (PostgreSQL 17, Frankfurt, `nb-NO` ICU collation) — the same startup that
applies EF Core migrations and seed data — exports its data as JSON, builds and prerenders
the site, then deploys the resulting `web/dist` to **Cloudflare Pages**. Nothing user-facing
ever talks to the API; it exists only as a build-time step.

Two GitHub Actions workflows drive the repo:

| Workflow | Trigger | Does |
|---|---|---|
| `ci.yml` | every pull request | both test suites + a client build — the required merge checks |
| `deploy-web.yml` | push to `main`, daily cron, manual dispatch | run the API against Neon, export data, build, prerender, deploy to Cloudflare Pages |

Deploy credentials live in the GitHub `production` environment: secrets
`NEON_CONNECTION_STRING`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and variable
`SITE_ORIGIN`. The repo itself contains no hostnames or secrets.

By design there is no Application Insights and HTTP logging is off — see the privacy posture
in `docs/superpowers/specs/2026-08-12-varde-design.md`. The full deployment design, including
the first-deploy runbook and verification checklist, is
`docs/superpowers/specs/2026-08-19-varde-deploy-design.md`.
