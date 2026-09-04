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

Phase 1, the API, is complete: 91 services across 8 municipalities (Innlandet and Oslo)
plus national services, described in Norwegian and English. Phase 2, the web frontend,
is complete. Deployment is next.

## Data verification

Every service was verified against official sources before entering the database — two
independent verification passes, with conflicts resolved by source hierarchy (a service's
own site outranks a re-listing) and unconfirmable details left empty rather than guessed.
The full audit trail is in [docs/verification/](docs/verification/). Phone numbers
belonging to named individuals are never published, and shelters that withhold their
address for safety are listed without one by design.

## Stack

- API: ASP.NET Core (.NET 10), EF Core, PostgreSQL 17
- Web: React, TypeScript, Vite
- Hosting (planned): Azure

## API

- `GET /api/resources` — text search, municipality and category filters, stable paging; `?lang=nb|en`
- `GET /api/resources/{id}`
- `GET /api/categories`
- `GET /api/municipalities`

Municipality filters include services that *serve* a kommune without being located in it —
interkommunale krisesentre are the motivating case. The API is rate-limited, and
application logs record result counts, never search terms.

## Web

Unified search across name, category and municipality, with suggestions and a national
toggle. Details on the shift from fastlege to legevakt after hours, when a service's own
opening hours are known. Bilingual throughout, built for keyboard access, and built mobile-first.

## Run locally

Prerequisites: .NET 10 SDK, PostgreSQL 17 on localhost, and Node.js for the web frontend.

```bash
# API
cd api
dotnet test
dotnet run --project Varde.Api

# Web (separate terminal)
cd web
npm install
npm test
npm run dev
```

Tests create disposable `varde_test_<guid>` databases. The connection defaults to the
standard local development setup (`localhost`, `postgres`/`postgres`); override it with the
`VARDE_TEST_PG` environment variable. The web dev server expects the API at
`http://localhost:5005` by default (`VITE_API_URL` to override).

## Deployment

Varde deploys automatically on merge to `main`: the frontend to **Azure Static Web Apps**
(Free), the API to **Azure App Service** (F1, Linux, Germany West Central), the database on
**Neon** (PostgreSQL 17, Frankfurt, `nb-NO` ICU collation). Schema and seed data arrive via
EF Core migrations at API startup — nothing is hand-built in the database.

Three GitHub Actions workflows drive it:

| Workflow | Trigger | Does |
|---|---|---|
| `ci.yml` | every pull request | both test suites + web build — the required merge checks |
| `deploy-api.yml` | push to `main` touching `api/**` | re-test, then deploy to App Service via OIDC |
| `deploy-web.yml` | push to `main` touching `web/**` | re-test, build with the real API origin, deploy to SWA |

Deploy credentials live in the GitHub `production` environment: secrets `AZURE_CLIENT_ID`,
`AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` (OIDC federated login — no stored password),
`AZURE_STATIC_WEB_APPS_API_TOKEN`, and variables `API_APP_NAME` and `API_URL`. The repo
itself contains no hostnames or secrets; `staticwebapp.config.json` carries an
`__API_ORIGIN__` placeholder replaced at deploy time.

By design there is no Application Insights and HTTP logging is off — see the privacy posture
in `docs/superpowers/specs/2026-08-12-varde-design.md`. The full deployment design, including
the first-deploy runbook and verification checklist, is
`docs/superpowers/specs/2026-08-19-varde-deploy-design.md`.
