# Varde

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/brand/banner-dark.png">
  <img src="docs/brand/banner-light.png" alt="Varde: hjelpetjenester i Norge. Finn riktig hjelp, der du bor." width="1280">
</picture>

A bilingual (Norwegian/English) directory of social services in Norway. Find the right
service in the right kommune, with contact details you can trust in a crisis.

Named after the *varde*: the stone cairns that mark Norwegian mountain routes so you can
find your way when visibility is poor.

## Why

Built from social-work practice. This is the tool I needed as a sosionom and never had.
Service directories go stale, and a dead phone number fails exactly when someone finally
dials it. Varde treats contact data as safety-critical.

## Status

Phase 1, the API, is complete: 94 services across 8 municipalities (Innlandet and Oslo)
plus national services, described in Norwegian and English. Phase 2, the web frontend,
is complete. Phase 3, deployment, went live 2026-09-04. The current design (light-first,
self-hosted type, a search-first landing page) shipped 2026-09-09, and the site went static on
Cloudflare Pages 2026-09-18.

**Live:** https://varde.pages.dev

The site is static. Every page is prerendered from the database once a day and on every
push, so nothing waits on a server. Search runs in the browser over a small JSON index.

## Data verification

Every service was verified against official sources before entering the database: two
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
that goes to a forwarding alias, `varde.purely709@passmail.com`, so a stale number or
address reaches me without exposing my own inbox.

## Stack

- API: ASP.NET Core (.NET 10), EF Core, PostgreSQL 17
- Web: React 19, TypeScript, Vite, Tailwind v4, react-aria-components
- Hosting: Cloudflare Pages, database on Neon

## API

- `GET /api/resources`: text search, municipality and category filters, stable paging; `?lang=nb|en`
- `GET /api/resources/{id}`
- `GET /api/categories`
- `GET /api/municipalities`

Municipality filters include services that *serve* a kommune without being located in it.
Interkommunale krisesentre are the motivating case. The API is rate-limited, and
application logs record result counts, never search terms.

## Web

The landing page is search-first: one box, nine category chips, and no data fetched until
you act on it. Above every page sits an acute strip with the four emergency numbers as
hardcoded constants, so it renders before any JavaScript or data loads. Unified search across
name, category and municipality, with suggestions and a national toggle. Details on the
shift from fastlege to legevakt after hours, when a service's own opening hours are known.
Light theme by default, with a toggle that starts from the system setting and remembers the
choice, and a quick exit in the header that replaces the history entry, so the visit does not
survive the back button. Bilingual throughout, built for keyboard access, and built
mobile-first.

Lighthouse ≥ 95 on the simulated phone is the definition of done, and the measured numbers
are in each PR. On the live site (2026-09-23), performance is 98 on the landing page, 99 on
`/sok` and 95 on resource and kommune pages. Accessibility, best practices and SEO are 100.

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
underlying data changes. Run `npm run build:site` instead of `npm run dev` for the full prerender.
It builds the client and server bundles and writes a static `web/dist/` with one page per
URL, matching what the deploy workflow produces. `vite preview` over that `dist/` can't
validate routing, though: it serves the file-form pages directly by path, but only Cloudflare
Pages' asset server applies the clean-URL and trailing-slash redirect rules the prerendered
pages depend on. Check routing against the real deploy, not a local preview.

Fraunces and Figtree are vendored into `web/public/fonts/`, so `npm install` is enough for a
normal checkout. Only run `npm run fonts` if you bump the `@fontsource/*` package versions.
It re-copies the woff2 files from `node_modules` and a drift test catches a checkout that
forgets to.

## Runbook: the API in containers

The API and its database also run as a container stack, so a checkout needs nothing installed
but Docker or Podman. `compose.yml` starts two services: `api` on port 8080 and `db`, a
PostgreSQL 17 whose data lives in the named volume `postgres_data`. Only the API publishes a
port; the database is reachable from inside the compose network, under the hostname `db`.

```bash
cp .env.example .env          # once, then set a password
podman compose up -d --build  # start (docker compose works the same)
curl --fail http://localhost:8080/health
podman compose logs -f api    # follow the API log
podman compose down           # stop; the database keeps its data
podman compose down -v        # full reset: deletes the volume too
```

The API migrates the database itself at startup, so the first `up` fills an empty PostgreSQL
with the schema and the seed rows. Set `MIGRATE_ON_STARTUP=false` where that must be a
separate step. `.env` holds the database name, user and password and is never committed;
`.env.example` lists the variables the stack needs.

PostgreSQL 17 matches Neon, CI and the local service. A volume created by the older
PostgreSQL 16 image will not start under 17. Reset it once with `podman compose down -v` (or
`podman compose -f compose.prod.yml down -v` for prod-sim). Nothing is lost: the next `up`
migrates and seeds again.

## Runbook: deploy and rollback (prod-sim)

`compose.prod.yml` runs the image CI built instead of building one. It has its own project name,
containers (`varde-api-prod`, `varde-db-prod`) and volume (`varde_prod_data`), so it never
touches the dev stack's data. Both stacks publish port 8080: stop the dev stack first.

**Find the tag.** Actions, the latest green run on `main`, job "Build and push image to GHCR", step "Image tags"
(or Packages, `varde`, the version list). Use the `sha-…` tag, never `latest`: `latest` moves,
so it cannot tell you what runs or take you back.

**Deploy.** Two lines in `.env` decide what runs, and they are read together: `API_IMAGE` is
the name without a tag, `IMAGE_TAG` the tag. The same `IMAGE_TAG` also becomes the API's
`APP_VERSION`, so the image and `/health` cannot disagree.

```bash
podman compose down                            # dev stack off, port 8080 free
# .env: API_IMAGE=ghcr.io/malinfossum/varde and IMAGE_TAG=sha-<new>
podman compose -f compose.prod.yml config      # check the image: line shows the right tag
podman compose -f compose.prod.yml pull        # fetch the CI image, nothing is built
podman compose -f compose.prod.yml up -d
podman compose -f compose.prod.yml ps          # both services healthy?
curl --fail http://localhost:8080/health       # "version" must be sha-<new>
podman inspect varde-api-prod --format '{{.Config.Image}} {{.Image}}'   # tag + digest: proof of what runs
```

Write down the old tag and its digest before you change anything. The tag is the way back; CI
never pushes a sha tag twice, so it keeps pointing at the same digest.

### Rollback

What runs now: `curl -s http://localhost:8080/health` (the claim) and
`podman inspect varde-api-prod --format '{{.Config.Image}}'` (the proof).

1. `.env`: `IMAGE_TAG=sha-<previous good>`, taken from the tag register below or `git log --oneline`
2. `podman compose -f compose.prod.yml pull && podman compose -f compose.prod.yml up -d`
3. Prove it with both commands above: `version` and the image tag both say `sha-<previous good>`

Rollback is the deploy flow with an older value. Nothing is rebuilt. If going back needs a
rebuild, it is a fix, not a rollback. The database volume is untouched by both deploy and
rollback, which is what makes going back possible at all. The one exception is a release whose
migration changed the schema: then the old image meets a newer schema, so check the migrations
before you roll back past one.

**Tag register**

| Tag | Where | Role |
|---|---|---|
| `sha-83f4d70` | GHCR | Good. `/health` is back after the drill. Newer pushes to `main` each have their own tag |
| `sha-4e97289` | GHCR | Broken on purpose: `/health` renamed to `/status`. Green pipeline, red health gate |
| `sha-5156e25` | GHCR | Good. The rollback target in the drill |
| `sha-89f36a0` | GHCR | Good. Web dependency bump only |
| `sha-b8e13da` | GHCR | Good. Logs its version at startup |
| `sha-a581a64` | GHCR | Good. The first image CI built |
| `latest` | GHCR | Moves with every push to `main`. Never deploy it, it cannot take you back |

**Rollback drill, 2026-10-01:** round 1: 6.2 s · round 2: 5.6 s (from the `.env` edit until `/health` reports the old sha)

**Failure journal**

| Error (short) | What I learned |
|---|---|
| `failed to resolve reference "…:sha-does-not-exist": not found` | `pull` fails before any container is swapped, so the old version keeps running. Read the tag off a green run, never from memory |
| `curl: (7) Couldn't connect to server` | Nobody listens on that port. Check `ps` and the port mapping |
| `curl: (22) The requested URL returned error: 404` | The app is alive and answered. Check the URL and the path |
| `dependency failed to start: container varde-db-prod has no healthcheck configured` | `condition: service_healthy` needs a healthcheck behind it. A condition with no check fails loudly or waits in silence |
| `Assert.Equal() Failure: Values differ` (build-test red) | A red test stops the delivery: the merge is blocked and no image is built |
| `/health` 404 while every check is green | Tests check logic, not the HTTP surface. The health gate catches what nobody tested for |

Stuck? Read `podman compose -f compose.prod.yml logs api` before guessing. A tag that does not
exist shows up as `not found` or `manifest unknown` on pull. `denied` usually means a private
package, but GHCR can say it about a missing tag too, so check the tag first.

## Deployment

Varde deploys via a single GitHub Actions workflow, `deploy-web.yml`, on a push to `main`, a
daily cron at 04:00 UTC, and manual dispatch. The workflow starts the API inside the runner
against **Neon** (PostgreSQL 17, Frankfurt, `nb-NO` ICU collation). That is the same startup that
applies EF Core migrations and seed data. It exports its data as JSON, builds and prerenders
the site, then deploys the resulting `web/dist` to **Cloudflare Pages**. Nothing user-facing
ever talks to the API; it exists only as a build-time step.

Five GitHub Actions workflows drive the repo:

| Workflow | Trigger | Does |
|---|---|---|
| `ci.yml` | every pull request | both test suites + a client build (the required merge checks) |
| `build-test.yml` | pull request and push to `main` | format check, API build and tests, vulnerable-package report; on `main` it also pushes the API image to GHCR |
| `deploy-web.yml` | push to `main`, daily cron, manual dispatch | run the API against Neon, export data, build, prerender, deploy to Cloudflare Pages |
| `ward.yml` | pull request, push to `main`, weekly cron, manual dispatch | shared CI and security checks via `malinfossum/ward`; auto-merges Dependabot PRs |
| `repo-hygiene.yml` | README changes, releases, manual dispatch | check the repo's public face (description, topics, homepage, versions, links) against the README, via `malinfossum/ward` |

Deploy credentials live in the GitHub `production` environment: secrets
`NEON_CONNECTION_STRING`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and variable
`SITE_ORIGIN`. The repo itself contains no hostnames or secrets.

By design there is no analytics or telemetry, and HTTP logging is off. See the privacy
posture in `docs/superpowers/specs/2026-08-12-varde-design.md`. The current deployment design
is `docs/superpowers/specs/2026-09-15-varde-static-first-design.md`. The earlier Azure design
(`2026-08-19-varde-deploy-design.md`) is kept as a record and no longer describes production.

## Licence

Code: MIT. The Varde name and mark: all rights reserved, see `LICENSE`.
