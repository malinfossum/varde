# Varde — plan 3 (deploy) design

**Date:** 2026-08-19
**Base:** [2026-08-12-varde-design.md](2026-08-12-varde-design.md). Its Privacy, Logging and
retention, and Definition of done sections are **binding by reference** — this document only
adds to or overrides them, and says so explicitly where it does. It **overrides** the base
spec's Deployment section (which predates the Neon decision).

---

## Scope

Plan 3 takes the finished phase-1+2 application from `main` to a public production deployment:
Azure Static Web Apps (frontend), Azure App Service F1 (API), Neon Postgres (database, already
live), wired together by two GitHub Actions workflows that deploy automatically on merge to
main. It closes the deploy items in the phase-1 Definition of done.

**Done means:** both live URLs in the README; a merge to main deploys the changed half
end-to-end with tests gating the deploy; all phase-1 DoD deploy checkboxes verified against
the live site; the three standing carries (forwarded headers, production migrations, DB
collation) resolved.

**Out of scope:** custom domain (free SWA/App Service hostnames for now — a domain can be
attached later with zero migration), structured opening hours, the Legevakt row-3 hours
follow-up, any Application Insights or logging (deliberately absent, base spec), phase 1.5+.

---

## Decisions (settled in brainstorm, 2026-08-19)

| Question | Decision |
|---|---|
| Frontend host | **Azure Static Web Apps, Free tier** — native SPA fallback for the app's path-based routes; GitHub Pages would need the `404.html` redirect hack, which serves a real 404 status on shared deep links. |
| Public URL | **Free auto-generated hostnames** (`*.azurestaticapps.net`, `*.azurewebsites.net`). 0 kr; honors the free-only constraint. |
| Repo home | **Stays at `github.com/malinfossum/varde`.** Company-realism via ruleset, PR flow, CI gates, and a GitHub `production` Environment — not an org. |
| Deploy trigger | **Automatic on merge to main.** Merging is already the human release gate ("merge/release = Malin"); main = production stays true by construction. |
| Production migrations | **`Database.Migrate()` at app startup, all environments.** Empty Neon fills itself (schema + 91 seed rows live in migrations); no second copy of the DB credential in GitHub; a failed migration blocks startup, which is the safe failure. |

---

## Azure resources

Everything in one resource group **`rg-varde`**, region **Germany West Central** (Frankfurt) —
the same city as Neon's `eu-central-1`, so API↔DB latency stays minimal. Fallback region
West Europe if F1 quota is unavailable.

1. **App Service plan, F1, Linux** + Web App on the .NET 10 runtime. Name chosen at creation
   (`varde-api` if free on `*.azurewebsites.net`, else `varde-api-no` or similar). F1 realities
   are known and accepted: 60 CPU-minutes/day with a hard throttle (no charge, ever), no
   Always On, 3–10 s cold start after idle.
2. **Static Web App, Free tier.** Auto-generated hostname, globally CDN-served, TLS included.
3. **Nothing else.** No Application Insights, no Log Analytics workspace, HTTP logging off —
   the DoD requires verifying their *absence* (base spec, Logging and retention).

**Cost posture (overrides the base spec's "spending cap" line):** the classic spending cap
exists only on the 30-day trial subscription. The durable protection is (a) free-SKU-only
resources, which cannot bill, and (b) an Azure budget alert at a nominal amount (~1 kr) that
emails if anything ever accrues cost. Account signup and any card-verification step are
Malin's alone.

The database is **not** an Azure resource: Neon project `varde` (PG 17, Frankfurt), connection
strings live in Proton Pass only — never in the repo, GitHub, or chat.

---

## Code and config changes

### 1. Forwarded headers (carry, `Program.cs`)

Behind App Service's proxy, `HttpContext.Connection.RemoteIpAddress` is the proxy's address,
so the per-IP rate limiter collapses into one global bucket — every visitor shares one
60-requests/minute window. Fix: `UseForwardedHeaders` (X-Forwarded-For + X-Forwarded-Proto),
registered **before** `UseRateLimiter`, enabled outside Development. Explicit code is chosen
over Azure's `ASPNETCORE_FORWARDEDHEADERS_ENABLED=true` app setting: same effect, but visible
in the repo and integration-testable.

Because App Service's proxy addresses are not enumerable, `KnownNetworks`/`KnownProxies` are
cleared — the standard App Service configuration. The header is only trustworthy because App
Service always fronts the app; the spec records this assumption.

**Test:** an integration test sends a request carrying `X-Forwarded-For` with the middleware
active and asserts the rate-limit partition uses the forwarded address (two forwarded
identities do not share a bucket).

### 2. Migrations in all environments (`Program.cs`)

`Database.Migrate()` moves out of the `IsDevelopment()` block and runs unconditionally at
startup. `MapOpenApi` stays dev-only; `UseHttpsRedirection` stays production-only. The
existing comment rule stands: schema comes from migrations, never `EnsureCreated`.

### 3. Production configuration (no code)

Both production values are **App Service app settings**, entered by Malin in the portal:

- `ConnectionStrings__VardeDb` — the Neon string from Proton Pass (direct, not pooled: a
  single F1 instance holds few connections, and startup migrations want a direct connection).
- `Cors__AllowedOrigins__0` — the SWA hostname, known only after the SWA is created.

Nothing changes in `appsettings.json`; the config-driven CORS and rate-limit sections already
support this.

### 4. Database collation (carry, Neon)

Neon's default database collates as `C.UTF-8`, which orders æ/ø/å wrong. The app's database
is created in Neon **once, before first deploy**, with ICU collation:

```sql
CREATE DATABASE varde LOCALE_PROVIDER icu ICU_LOCALE 'nb-NO' TEMPLATE template0;
```

Every `ORDER BY` on names is then Norwegian-correct with no per-query `COLLATE` clauses. The
web's `Intl.Collator` sorting stays as belt-and-braces. **Verification:** a psql spot-check
that a query over seeded names orders æ/ø/å after z.

### 5. Frontend build-time API URL (workflow only)

`VITE_API_URL` is set in the deploy workflow's build step to the App Service URL.
`web/src/services/api.ts` already reads it; no source change.

### 6. New file: `web/staticwebapp.config.json`

- `navigationFallback` → `/index.html` so deep links on path routes load the app instead of
  404ing.
- Response headers mirroring the app's existing posture: `Referrer-Policy: no-referrer`
  (belt-and-braces over the `<meta name="referrer">` tag), `X-Content-Type-Options: nosniff`,
  and a `Content-Security-Policy` allowing self plus `connect-src` to the API origin. The CSP
  is written against what the built app actually loads (Vite emits self-hosted assets only);
  if a directive would break the app, loosening it requires a note in the file saying why.

---

## Pipeline

Two GitHub Actions workflows, path-filtered, triggered on push to `main`. "Push to main only
happens by merge" is made true, not assumed: the repo currently has **no ruleset** (verified
2026-08-19), so a **protect-main ruleset** (require PR before merging, block force pushes) is
part of this plan — it was already on the settings checklist and becomes load-bearing the
moment main auto-deploys:

### `deploy-api.yml` (paths: `api/**`)

1. **Test job:** full xUnit suite (81) against a **Postgres 17 service container** — the first
   time the API tests run in CI. The container's throwaway credentials live in the workflow
   file; they secure nothing.
2. **Deploy job**, needs test job green: `dotnet publish` → deploy to App Service.
   Authentication via **OIDC federated credentials** (`azure/login` with a Microsoft Entra app
   registration trusting the repo's `production` environment) — no long-lived Azure secret
   stored anywhere.

### `deploy-web.yml` (paths: `web/**`)

1. **Test job:** `npm ci` → Biome check → Vitest (48).
2. **Deploy job**, needs test job green: `vite build` with `VITE_API_URL` → deploy via the
   official SWA action, authenticated with the SWA **deployment token** (that platform's
   standard mechanism), stored as an environment secret.

Shared rules:

- Secrets and the OIDC subject live in a GitHub **`production` Environment**. No approval
  gate on it (deploy trigger decision above); it scopes credentials and shows deploy history.
- A change touching both `api/**` and `web/**` runs both workflows independently; order does
  not matter because the API contract is already deployed-compatible before web code relying
  on it merges (existing PR discipline).
- Workflow files are the only new repo content besides `staticwebapp.config.json`.

---

## First-deploy order

One-time sequence; portal/psql steps are Malin's, repo steps land via PR:

1. Protect-main ruleset added on GitHub (require PR, block force pushes).
2. Azure account + subscription ready (Malin; card verification hers alone), budget alert set.
3. Create `varde` database in Neon with the `nb-NO` ICU collation (SQL above).
4. Create `rg-varde`, App Service plan + Web App; set the two app settings (connection string,
   CORS origin placeholder until step 5).
5. Merge the code/workflow PR → API deploys; startup migration creates schema + seeds 91 rows.
6. Create the Static Web App; put its hostname into `Cors__AllowedOrigins__0`; store its
   deployment token as an environment secret → web deploys.
7. Verification pass (below); live URLs into the README.

---

## Verification — closing the phase-1 DoD

All checks run against the **live** site:

- [ ] Live URLs in the README (frontend + API).
- [ ] Lighthouse accessibility ≥ 95 on the live frontend.
- [ ] Application Insights confirmed absent and HTTP logging confirmed disabled in the portal.
- [ ] External link click shows no `Referer` header in devtools.
- [ ] Quick exit verified live: keyboard-reachable, leaves no back-history entry.
- [ ] Rate limiter live: a curl burst past the window limit returns 429.
- [ ] Collation: psql spot-check that seeded names order æ/ø/å correctly.
- [ ] Deep link to a sub-path loads the app (SWA fallback working).
- [ ] Cold-start behavior observed once and noted in the README if user-visible.

**Honest limitation, recorded:** per-IP rate-limit partitioning cannot be fully proven from
one machine. The integration test covers the middleware logic; production gets the
single-client 429 sanity check only.

---

## Deferred

- Custom domain (attach later; zero migration).
- Uptime monitoring (any external pinger would also keep F1 warm — a decision for later, since
  it spends the 60 CPU-min/day budget).
- The base spec's deferred items stand (who re-verifies `LastVerified`, phase 2 auth).
