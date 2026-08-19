# Varde Plan 3 (Deploy) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Varde production-deployable — forwarded-headers fix, startup migrations, SPA/CSP config, and three GitHub Actions workflows — so a merge to main deploys to Azure Static Web Apps + App Service F1 + Neon.

**Architecture:** Two small `Program.cs` changes (forwarded headers first in the pipeline; migrations in all environments), a static `staticwebapp.config.json` + theme-init extraction on the web side, then `ci.yml` (merge gate, both suites on every PR) plus two path-filtered deploy workflows (OIDC to App Service, deployment token to SWA). Azure resources and secrets are created by Malin per the spec's first-deploy order; the repo only ever holds placeholders.

**Tech Stack:** ASP.NET Core (.NET 10), xUnit + WebApplicationFactory + PostgreSQL 17, React 19 + Vite 8 + Vitest, GitHub Actions, Azure App Service F1 (Linux) + Static Web Apps Free, Neon Postgres.

**Spec:** `docs/superpowers/specs/2026-08-19-varde-deploy-design.md` — read it first; this plan implements it and argues from it.

## Global Constraints

- .NET SDK pinned by `api/global.json`: `10.0.300`, `rollForward: latestFeature`. CI uses `dotnet-version: "10.0.x"`.
- Node 22 + `npm ci` in CI. All npm commands run in `web/`.
- Local API tests need PostgreSQL running: `Start-Service postgresql-x64-17` (PowerShell, may need elevation).
- Current baselines: API **81/81** xUnit tests, web **48/48** Vitest tests. This plan adds 4 API tests (2 per API task) → **85**. Never finish a task with either suite red.
- **No new NuGet or npm dependencies.** Everything here uses what's installed.
- **No secrets in the repo, ever.** Real hostnames/connection strings live in GitHub environment secrets/variables and Azure app settings; the repo holds only the `__API_ORIGIN__` placeholder.
- `web/design-system/` is synced read-only content — never edit files inside it.
- CI job keys `api-tests` and `web-tests` are load-bearing (the ruleset in Task 8 requires these exact check names). Do not rename them or add `name:` overrides to those jobs.
- Commit messages: conventional prefixes (`feat:`, `test:`, `ci:`, `docs:`, `chore:`), imperative, **no Co-Authored-By or any Claude attribution trailer**.
- Verification of the live site (spec's DoD checklist) happens after Malin's first-deploy steps — it is not part of this plan's tasks.

---

### Task 1: Forwarded headers — per-IP rate limiting behind App Service's proxy

Behind App Service, `Connection.RemoteIpAddress` is the proxy, so the per-IP rate limiter collapses into one shared bucket, and `UseHttpsRedirection` sees plain HTTP and would redirect-loop the site. The middleware must be **first in the pipeline**. `ForwardLimit = 1` (the default) is the anti-spoofing mechanism: App Service *appends* the real client IP to any client-supplied `X-Forwarded-For`, so only the right-most entry is trustworthy.

**Files:**
- Create: `api/Varde.Tests/Integration/ForwardedHeadersTests.cs`
- Modify: `api/Varde.Api/Program.cs` (pipeline section, currently lines 54–59)

**Interfaces:**
- Consumes: `VardeApiFactory` (existing) — `RateLimitPermitLimit` init property; `/api/resources` endpoint.
- Produces: nothing later tasks call; Task 2 edits the same `Program.cs` region below this change.

- [ ] **Step 1: Write the failing tests**

Create `api/Varde.Tests/Integration/ForwardedHeadersTests.cs`:

```csharp
using System.Net;
using Varde.Tests.Infrastructure;

namespace Varde.Tests.Integration;

public class ForwardedHeadersTests
{
    private static HttpRequestMessage Get(string forwardedFor)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/resources");
        request.Headers.Add("X-Forwarded-For", forwardedFor);
        return request;
    }

    [Fact]
    public async Task Rate_limit_buckets_partition_by_forwarded_client_ip()
    {
        using var factory = new VardeApiFactory { RateLimitPermitLimit = 3 };
        var client = factory.CreateClient();

        for (var i = 0; i < 3; i++)
        {
            var allowed = await client.SendAsync(Get("203.0.113.10"));
            Assert.Equal(HttpStatusCode.OK, allowed.StatusCode);
        }

        var exhausted = await client.SendAsync(Get("203.0.113.10"));
        Assert.Equal(HttpStatusCode.TooManyRequests, exhausted.StatusCode);

        // A different forwarded identity gets its own bucket — this is the assert that fails
        // today, because without the middleware every request shares the "unknown" partition.
        var otherIdentity = await client.SendAsync(Get("203.0.113.99"));
        Assert.Equal(HttpStatusCode.OK, otherIdentity.StatusCode);
    }

    [Fact]
    public async Task Only_the_rightmost_forwarded_entry_names_the_bucket()
    {
        // App Service APPENDS the real client IP to any client-supplied X-Forwarded-For, so
        // with ForwardLimit = 1 the right-most entry wins and spoofed prefixes are ignored.
        using var factory = new VardeApiFactory { RateLimitPermitLimit = 3 };
        var client = factory.CreateClient();

        for (var i = 0; i < 3; i++)
        {
            var allowed = await client.SendAsync(Get($"198.51.100.{i}, 203.0.113.10"));
            Assert.Equal(HttpStatusCode.OK, allowed.StatusCode);
        }

        // Same spoofed prefix style, different right-most hop: different bucket, still 200.
        var realOther = await client.SendAsync(Get("203.0.113.10, 198.51.100.77"));
        Assert.Equal(HttpStatusCode.OK, realOther.StatusCode);

        // Right-most hop 203.0.113.10 again: that bucket is exhausted regardless of prefix.
        var exhausted = await client.SendAsync(Get("198.51.100.200, 203.0.113.10"));
        Assert.Equal(HttpStatusCode.TooManyRequests, exhausted.StatusCode);
    }
}
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
dotnet test api/Varde.slnx --filter "FullyQualifiedName~ForwardedHeadersTests"
```

Expected: **both facts FAIL** — without the middleware all requests share one partition, so the `otherIdentity` / `realOther` requests get 429 instead of 200.

- [ ] **Step 3: Add the middleware, first in the pipeline**

In `api/Varde.Api/Program.cs`, add to the usings block:

```csharp
using Microsoft.AspNetCore.HttpOverrides;
```

Then, immediately after `var app = builder.Build();` and **before** `app.UseExceptionHandler();`:

```csharp
// First in the pipeline, in every environment. App Service terminates TLS and proxies plain
// HTTP to Kestrel, so X-Forwarded-Proto must be applied before UseHttpsRedirection (else
// production redirect-loops) and X-Forwarded-For before the rate limiter (else every visitor
// shares one bucket). KnownNetworks/KnownProxies are cleared because App Service's proxy
// addresses are not enumerable. ForwardLimit stays at 1: App Service APPENDS the real client
// IP, so the right-most entry is the trustworthy one — reading deeper into the chain would
// let clients choose their own rate-limit bucket. Enabled in dev too: there is no proxy
// there, so a spoofed header only mis-partitions a local limiter, and unconditional
// enablement keeps WebApplicationFactory tests in their default Development environment.
var forwardedHeaders = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
};
forwardedHeaders.KnownNetworks.Clear();
forwardedHeaders.KnownProxies.Clear();
app.UseForwardedHeaders(forwardedHeaders);
```

- [ ] **Step 4: Run the full API suite**

```bash
dotnet test api/Varde.slnx
```

Expected: **83 passed** (81 existing + 2 new), 0 failed.

- [ ] **Step 5: Commit**

```bash
git add api/Varde.Tests/Integration/ForwardedHeadersTests.cs api/Varde.Api/Program.cs
git commit -m "feat: partition rate limiting by forwarded client IP behind the proxy"
```

---

### Task 2: Migrations run in every environment

Production Neon fills itself at deploy: schema + all 91 seed rows live in the migrations. Today `Database.Migrate()` only runs in Development ([Program.cs] dev-only block), so a production app would boot against an empty database.

**Files:**
- Create: `api/Varde.Tests/Integration/ProductionStartupTests.cs`
- Modify: `api/Varde.Tests/Infrastructure/VardeApiFactory.cs` (add `Environment` property; update two comments)
- Modify: `api/Varde.Api/Program.cs` (the `if (app.Environment.IsDevelopment())` block)

**Interfaces:**
- Consumes: Task 1's `Program.cs` (edits a region below Task 1's insertion — no overlap).
- Produces: `VardeApiFactory.Environment` (string init property, default `"Development"`) — available to any future test.

- [ ] **Step 1: Add the environment seam to the factory**

In `api/Varde.Tests/Infrastructure/VardeApiFactory.cs`, add next to the other init properties:

```csharp
/// <summary>
/// Host environment for this test's app instance. Production hides OpenAPI and enables
/// HTTPS redirection (inert under TestServer — no https port is configured, so the
/// middleware skips redirecting); migrations run in every environment.
/// </summary>
public string Environment { get; init; } = "Development";
```

Replace the hardcoded line in `ConfigureWebHost`:

```csharp
builder.UseEnvironment("Development");
```

with:

```csharp
builder.UseEnvironment(Environment);
```

Update the stale comment above it — replace

```csharp
// Program.cs's Development branch applies migrations and maps OpenAPI; tests need the former.
```

with:

```csharp
// Program.cs applies migrations at startup in every environment; OpenAPI stays dev-only.
```

and in the class-level XML doc, replace the sentence `The app applies migrations on startup in Development.` with `The app applies migrations on startup in every environment.`

- [ ] **Step 2: Write the tests**

Create `api/Varde.Tests/Integration/ProductionStartupTests.cs`:

```csharp
using System.Net;
using Varde.Tests.Infrastructure;

namespace Varde.Tests.Integration;

public class ProductionStartupTests
{
    [Fact]
    public async Task Production_startup_applies_migrations_and_seed()
    {
        // KeepSeedData: this test asserts the migrated seed is queryable, so don't truncate.
        using var factory = new VardeApiFactory { Environment = "Production", KeepSeedData = true };
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/categories");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Production_does_not_expose_openapi()
    {
        // Guard, not new behavior: MapOpenApi stays inside the Development branch.
        using var factory = new VardeApiFactory { Environment = "Production", KeepSeedData = true };
        var client = factory.CreateClient();

        var response = await client.GetAsync("/openapi/v1.json");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
```

- [ ] **Step 3: Run the tests to verify the first one fails**

```bash
dotnet test api/Varde.slnx --filter "FullyQualifiedName~ProductionStartupTests"
```

Expected: `Production_startup_applies_migrations_and_seed` **FAILS** (500 — no tables exist because migrations never ran in Production). `Production_does_not_expose_openapi` passes already; it is a guard against regressing the env split in the next step.

- [ ] **Step 4: Move migrations out of the Development branch**

In `api/Varde.Api/Program.cs`, replace:

```csharp
if (app.Environment.IsDevelopment())
{
    // Schema comes from migrations, always — never EnsureCreated.
    using (var scope = app.Services.CreateScope())
    {
        scope.ServiceProvider.GetRequiredService<VardeDbContext>().Database.Migrate();
    }

    app.MapOpenApi();          // JSON spec at /openapi/v1.json — dev only
}
else
{
    app.UseHttpsRedirection();
}
```

with:

```csharp
// Schema comes from migrations, always — never EnsureCreated. Runs in every environment:
// production Neon fills itself at deploy (schema + seed rows live in the migrations), and
// a failed migration blocks startup, which is the safe failure.
using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<VardeDbContext>().Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();          // JSON spec at /openapi/v1.json — dev only
}
else
{
    app.UseHttpsRedirection();
}
```

- [ ] **Step 5: Run the full API suite**

```bash
dotnet test api/Varde.slnx
```

Expected: **85 passed** (83 after Task 1 + this task's 2 facts), 0 failed.

- [ ] **Step 6: Commit**

```bash
git add api/Varde.Tests/Integration/ProductionStartupTests.cs api/Varde.Tests/Infrastructure/VardeApiFactory.cs api/Varde.Api/Program.cs
git commit -m "feat: apply migrations at startup in every environment"
```

---

### Task 3: SWA config + theme-init extraction + production build check

The CSP uses `script-src 'self'` with no hashes, so the inline theme-init script in `index.html` moves to a static file (it must stay a synchronous, non-module script loaded **before** the stylesheets — it prevents a theme flash). `staticwebapp.config.json` lives in `web/public/` so Vite copies it into `dist/`, where the SWA deploy action reads it. Facts already verified 2026-08-19: `npm run build` bundles all design-system CSS + fonts self-hosted into `/assets`, and the built CSS contains zero external URLs — strict `'self'` is correct.

**Files:**
- Create: `web/public/theme-init.js`
- Create: `web/public/staticwebapp.config.json`
- Modify: `web/index.html` (lines 13–20, the inline script block)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: the literal placeholder `__API_ORIGIN__` inside `staticwebapp.config.json` — Task 6's deploy workflow sed-replaces it with the `API_URL` variable. Spell it exactly `__API_ORIGIN__`.

- [ ] **Step 1: Extract the theme-init script**

Create `web/public/theme-init.js` (content identical to the current inline script body):

```js
(() => {
	var root = document.documentElement
	root.dataset.theme = localStorage.getItem("theme") || "dark"
	root.dataset.palette = localStorage.getItem("palette") || "default"
})()
```

In `web/index.html`, replace:

```html
		<!-- No-flash theme init: must run BEFORE stylesheets -->
		<script>
			(() => {
				var root = document.documentElement;
				root.dataset.theme = localStorage.getItem("theme") || "dark";
				root.dataset.palette = localStorage.getItem("palette") || "default";
			})();
		</script>
```

with:

```html
		<!-- No-flash theme init: must load BEFORE stylesheets, synchronously (no defer/module).
		     External file instead of inline so the CSP can stay script-src 'self' with no hashes. -->
		<script src="/theme-init.js"></script>
```

- [ ] **Step 2: Run the web suite to confirm nothing depended on the inline script**

```bash
cd web && npm test
```

Expected: **48 passed** (component tests run under jsdom and never load `index.html`).

- [ ] **Step 3: Create the SWA config**

Create `web/public/staticwebapp.config.json`:

```json
{
	"navigationFallback": {
		"rewrite": "/index.html",
		"exclude": ["/assets/*", "/theme-init.js", "/favicon.ico"]
	},
	"globalHeaders": {
		"Referrer-Policy": "no-referrer",
		"X-Content-Type-Options": "nosniff",
		"Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' __API_ORIGIN__; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
	}
}
```

Why each piece: `navigationFallback` makes deep links on path routes load the app; the excludes stop real static files from falling back to HTML. `Referrer-Policy` and the `rel="noopener noreferrer"` links already in the app are belt-and-braces for the no-`Referer` DoD item. `connect-src` gains the API origin at deploy time via the `__API_ORIGIN__` placeholder — the repo never holds the real hostname.

- [ ] **Step 4: Build and verify the dist output**

```bash
cd web && npm run build
```

Expected: build succeeds. Then verify:

```bash
cd web && ls dist/staticwebapp.config.json dist/theme-init.js && grep -c "theme-init.js" dist/index.html && (grep -o "url(http" dist/assets/*.css; echo "external-url grep exit: $? (1 = none, correct)")
```

Expected: both files listed, grep count ≥ 1 (the script tag survived the build), and the final grep exits 1 (no external URLs — CSP `'self'` holds).

- [ ] **Step 5: Commit**

```bash
git add web/public/theme-init.js web/public/staticwebapp.config.json web/index.html
git commit -m "feat: add Static Web Apps config and extract theme-init for a hash-free CSP"
```

---

### Task 4: `ci.yml` — the merge gate

Both suites on **every** PR, no path filters — deliberately (spec, Pipeline section): path-filtered *required* checks would leave docs-only PRs unmergeable, because required checks that never report stay "expected" forever. The job keys `api-tests` / `web-tests` become the ruleset's required contexts in Task 8.

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `TestDatabase.AdminConnectionString`'s default (`Host=localhost;Port=5432;...;Username=postgres;Password=postgres`) — the service container below matches it exactly, so no `VARDE_TEST_PG` is needed in CI.
- Produces: check contexts `api-tests` and `web-tests` (required by Task 8's ruleset). The `services:` block and the api/web step sequences are reused verbatim in Tasks 5 and 6.

- [ ] **Step 1: Create the workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:

jobs:
  # Job keys are the required-check contexts in the protect-main ruleset — do not rename.
  api-tests:
    runs-on: ubuntu-latest
    services:
      # Matches TestDatabase.cs's default connection string, so no VARDE_TEST_PG is needed.
      # Throwaway credentials for a job-local container; they secure nothing.
      postgres:
        image: postgres:17
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: "10.0.x"
      - name: Test
        run: dotnet test api/Varde.slnx

  web-tests:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: web
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: web/package-lock.json
      - name: Install
        run: npm ci
      - name: Biome
        run: npx biome ci .
      - name: Test
        run: npm test
      - name: Build
        run: npm run build
```

The web job ends with `npm run build` so a broken production build (which includes `tsc --noEmit`) can never merge — the deploy workflow must never be the first place a build fails.

- [ ] **Step 2: Verify the YAML parses**

```bash
node -e "console.log(require('node:fs').readFileSync('.github/workflows/ci.yml','utf8').length, 'bytes read')" && git diff --stat
```

There is no YAML linter installed; the real verification is the workflow's first run when this branch's PR opens. Double-check indentation visually against the block above before committing (Actions YAML is indentation-fragile).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: run both test suites on every pull request"
```

---

### Task 5: `deploy-api.yml`

Push-to-main, path-filtered, re-runs the API suite (a deploy never rides a stale green), then publishes to App Service via OIDC — no long-lived Azure secret exists anywhere.

**Files:**
- Create: `.github/workflows/deploy-api.yml`

**Interfaces:**
- Consumes: the `services:` block and api test steps from Task 4 (repeated verbatim — workflows cannot share job definitions).
- Produces: expects GitHub `production` environment to hold secrets `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` and variable `API_APP_NAME` (the Web App resource name, e.g. `varde-api`). Malin creates these in the portal/GitHub per the spec's first-deploy order — see the note below the YAML.

- [ ] **Step 1: Create the workflow**

Create `.github/workflows/deploy-api.yml`:

```yaml
name: Deploy API

on:
  push:
    branches: [main]
    paths:
      - "api/**"
      - ".github/workflows/deploy-api.yml"
  workflow_dispatch:

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: "10.0.x"
      - name: Test
        run: dotnet test api/Varde.slnx

  deploy:
    needs: test
    runs-on: ubuntu-latest
    environment: production
    permissions:
      # OIDC: the job requests a GitHub-signed token; Azure trusts it via the federated
      # credential on the app registration. No stored Azure secret exists.
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: "10.0.x"
      - name: Publish
        run: dotnet publish api/Varde.Api/Varde.Api.csproj -c Release -o publish
      - uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      - uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ vars.API_APP_NAME }}
          package: publish
```

**Note for Malin's portal setup (not executor work, recorded here so the workflow's expectations are explicit):** the Entra app registration gets a federated credential with issuer `https://token.actions.githubusercontent.com`, subject `repo:malinfossum/varde:environment:production`, audience `api://AzureADTokenExchange`, and a **Website Contributor** role assignment scoped to `rg-varde` only (spec: never subscription-wide). The client/tenant/subscription IDs are identifiers, not passwords, but live as environment secrets to keep them out of logs.

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy-api.yml
git commit -m "ci: deploy API to App Service on merge to main (OIDC)"
```

---

### Task 6: `deploy-web.yml`

Builds with the real API origin injected twice — `VITE_API_URL` for the fetch base URL and a `sed` replace of `__API_ORIGIN__` in the CSP — then uploads `dist/` with the SWA action.

**Files:**
- Create: `.github/workflows/deploy-web.yml`

**Interfaces:**
- Consumes: `__API_ORIGIN__` placeholder from Task 3; web test steps from Task 4 (repeated verbatim).
- Produces: expects the `production` environment to hold secret `AZURE_STATIC_WEB_APPS_API_TOKEN` (the SWA deployment token) and variable `API_URL` — the **full API origin with scheme, no trailing slash** (e.g. `https://varde-api.azurewebsites.net`), because `web/src/services/api.ts` builds URLs as `` `${BASE}/api/...` ``.

- [ ] **Step 1: Create the workflow**

Create `.github/workflows/deploy-web.yml`:

```yaml
name: Deploy Web

on:
  push:
    branches: [main]
    paths:
      - "web/**"
      - ".github/workflows/deploy-web.yml"
  workflow_dispatch:

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: web
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: web/package-lock.json
      - name: Install
        run: npm ci
      - name: Biome
        run: npx biome ci .
      - name: Test
        run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: web/package-lock.json
      - name: Install
        working-directory: web
        run: npm ci
      - name: Build
        working-directory: web
        env:
          VITE_API_URL: ${{ vars.API_URL }}
        run: npm run build
      - name: Inject API origin into the CSP
        # The repo holds only the __API_ORIGIN__ placeholder; the real hostname lives in
        # the API_URL environment variable and lands in dist/ only, never in git.
        run: sed -i "s|__API_ORIGIN__|${{ vars.API_URL }}|g" web/dist/staticwebapp.config.json
      - uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: upload
          app_location: web/dist
          skip_app_build: true
```

`skip_app_build: true` because the workflow already built with `tsc --noEmit` + Vite — Oryx re-building inside the action would be slower and could pick different tool versions.

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy-web.yml
git commit -m "ci: deploy web to Static Web Apps on merge to main"
```

---

### Task 7: README deployment section

The DoD's "live URL in the README" lands at cutover (Malin's verification pass fills in the real hostnames); this task documents the deploy architecture and the exact GitHub configuration so first-deploy is reproducible from the README + spec alone.

**Files:**
- Modify: `README.md` (append a `## Deployment` section; read the file first and place it after the existing setup/testing sections, before any closing license section)

**Interfaces:**
- Consumes: names produced in Tasks 5–6 (`API_APP_NAME`, `API_URL`, the three `AZURE_*` secrets, `AZURE_STATIC_WEB_APPS_API_TOKEN`).
- Produces: nothing.

- [ ] **Step 1: Append the section**

Add to `README.md` (adjust heading level to match the file's existing structure):

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: document the deployment pipeline in the README"
```

---

### Task 8: Protect-main ruleset (⚠ requires Malin's explicit go-ahead at execution time)

Repo-settings change, not code — **confirm with Malin before running**. Auto-deploy makes an unguarded main genuinely risky: this ruleset makes "push to main only happens by merge" true and requires the CI checks. Note: with required checks active, *this plan's own PR* must have `api-tests` and `web-tests` green to merge — they will run on the PR because `ci.yml` exists on the branch.

**Files:** none (GitHub API via `gh`).

**Interfaces:**
- Consumes: check contexts `api-tests` and `web-tests` from Task 4.
- Produces: active ruleset `protect-main` on the repo.

- [ ] **Step 1: Get Malin's confirmation, then create the ruleset**

```bash
gh api repos/malinfossum/varde/rulesets -X POST --input - <<'JSON'
{
  "name": "protect-main",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "pull_request", "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "allowed_merge_methods": ["merge", "squash"] } },
    { "type": "required_status_checks", "parameters": {
        "strict_required_status_checks_policy": false,
        "required_status_checks": [
          { "context": "api-tests" },
          { "context": "web-tests" } ] } }
  ]
}
JSON
```

`required_approving_review_count` is 0 because GitHub does not let an author approve their own PR — on a solo repo a nonzero count would deadlock every merge. The PR *flow* (checks, review-in-session, Malin merges) is the human gate.

- [ ] **Step 2: Verify**

```bash
gh api repos/malinfossum/varde/rulesets --jq '.[] | {name, enforcement}'
```

Expected: `{"name":"protect-main","enforcement":"active"}`.

No commit — nothing in the repo changed.

---

## After the plan

Everything else in the spec is Malin's first-deploy sequence (Azure account, Neon `varde` database with `nb-NO` collation + Proton Pass update, App Service + SWA creation, environment secrets/variables) followed by the merge and the live-site verification checklist — run those from the spec's **First-deploy order** and **Verification** sections, not from this plan.
