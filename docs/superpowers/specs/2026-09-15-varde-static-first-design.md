# Varde — static-first (plan 5) design

Date: 2026-09-15. Builds on the base spec (2026-08-12), the web spec (2026-08-17), the deploy
spec (2026-08-19) and the redesign spec (2026-09-08). Where this document and an earlier one
disagree, this one wins; everything it does not mention stays as specified before.

## Purpose

Varde is live, but the first request takes up to a minute because the API sleeps on Azure's
free tier, and a search engine sees an empty shell. The two hard requirements I set on
2026-09-10 are **fast** and **always current**: a stale or slow number fails a miljøterapeut in
the field. A third goal is that Varde surfaces in Google for queries like "psykisk helse Hamar".

This plan turns Varde into a static site. Neon and the C# API stay the source of truth, but
they run only at build time, inside a GitHub Actions runner. The output is plain HTML, CSS,
JavaScript and JSON on Cloudflare Pages. Nothing a visitor does reaches a server I run.
The Azure App Service and Static Web App are deleted when the new deploy is verified.

Decisions locked in the brainstorm on 2026-09-14 and 2026-09-15:

- Data scope is deep regional: Innlandet and Oslo done properly, no national coverage.
- Architecture is static-first with the C# API as a build-time source only.
- Host is Cloudflare Pages.
- The static site is produced by prerendering the existing React app and hydrating it
  (option B), not by rewriting in Astro.
- The data refresh runs on every push to `main`, on a daily cron, and on demand.
- Kommune pages are in. Category pages are out.

## Scope

In: the build and deploy pipeline, the JSON export, the URL and language model, prerendering of
every page, hydration, kommune pages, sitemap and robots, head metadata and JSON-LD, the 404
page, the report-a-wrong-number link, security headers on Cloudflare, retiring Azure, one small
API DTO addition, README.

Out (unchanged): the data model beyond the DTO field below, the seed, the search semantics,
the 15:00 handover rule, share and copy-phone, quick exit, theme, brand, the acute strip, the
nine UI fixes from the plan 5 backlog, the brand package.

Out (still deferred): open-now computation, phase 2 auth, category pages, national coverage,
RESH or Enhetsregisteret imports, a custom domain and its email routing.

## Architecture

```
push to main / daily cron / manual  →  GitHub Actions
  test    Biome + Vitest (web), unchanged
  data    dotnet run the API against Neon → export JSON to web/public/data/
  build   vite build (client) + vite build --ssr + prerender script → web/dist/
  deploy  wrangler pages deploy web/dist → Cloudflare Pages
```

One workflow, `deploy-web.yml`, rewritten. It declares `concurrency: deploy-web` with
cancel-in-progress, so a cron run and a push can never deploy out of order; the newest run
wins. The deploy step uses `cloudflare/wrangler-action` pinned to a release tag, never
`npx wrangler@latest`. `deploy-api.yml` is deleted. `ci.yml` (API tests)
stays: the API is still the data source and still needs its tests.

The chain fails closed. If the API does not start, Neon is unreachable, a migration fails, the
export sees too few rows, a test fails or the prerender throws, the run fails and the last
deploy stays live. Nothing partial ever ships. A failed scheduled run emails me (GitHub's
default).

The exported JSON is a build artifact, gitignored, never committed, so a data refresh creates no
commits. Local development gets `npm run data`, which runs the same export once against my
local API on port 5005, then `npm run dev` serves the files from `public/data/`.

The cron is `0 4 * * *` (04:00 UTC daily). Today every data change is a code push, because
the seed lives in C# and migrations apply at API startup, so the cron is a safety net for edits
made directly in Neon. Daily costs nothing on a public repo and keeps the staleness window at
one day instead of a week.

Secrets and variables in the GitHub `production` environment after this plan: `NEON_CONNECTION_STRING`
(the export's `ConnectionStrings__VardeDb`), `CLOUDFLARE_API_TOKEN` (Pages edit scope only),
`CLOUDFLARE_ACCOUNT_ID`. The four Azure secrets and the `API_APP_NAME` and `API_URL` variables are
removed. `VITE_API_URL` and the "require API_URL" guard disappear from the web build.

## Data export

The data job starts the API with `dotnet run` in the runner, waits for `/api/municipalities`
to answer, then a Node script (`web/scripts/export-data.mjs`, plain JavaScript, no build step)
fetches and writes:

| File | Source | Notes |
|---|---|---|
| `resources.nb.json`, `resources.en.json` | `/api/resources?lang=…&pageSize=100`, every page walked | full rows, same shape as `ResourceDto` |
| `municipalities.json` | `/api/municipalities` | |
| `categories.nb.json`, `categories.en.json` | `/api/categories?lang=…` | |

All files land in `web/public/data/`. The script refuses to continue if either resources file
has fewer than `MIN_RESOURCES = 90` rows (the live seed has 94), exiting non-zero so the
workflow fails before the build. The API is stopped afterwards; nothing else ever talks to it.

**The Actions log is public**, because the repo is. The API runs in the runner with
`ASPNETCORE_ENVIRONMENT=Production` and `Logging__LogLevel__Default=Warning`, sensitive-data
logging off, so no SQL or parameters are printed. The export script prints row counts and file
names only. The connection string is a masked secret and is never echoed.

**One API change.** The API's municipality filter matches a resource by its own
`MunicipalityId` *or* by its `ServedMunicipalities` list, but `ResourceDto` exposes only
`municipalityId`. Client-side filtering and kommune pages need the served list, so `ResourceDto`
gains `servedMunicipalityIds: number[]` (the resource's own municipality is not repeated in
it). This is a field on the DTO, the mapping in `ResourceService`, the hand-written TypeScript
mirror in `web/src/types/api.ts`, and one API test. It is the only C# change in this plan.

## Search moves to the browser

`/sok` no longer queries an API. It loads `resources.{lang}.json`, `municipalities.json` and
`categories.{lang}.json` once, then filters, sorts and pages in memory. At regional scale the
resources file is tens of KB gzipped. At national scale it would be split per kommune; not
needed now.

The in-memory rules mirror `ResourceRepository.SearchAsync` exactly, so results do not change
with this plan:

- **Municipality:** `municipalityId === id` or `servedMunicipalityIds` contains `id`, plus
  every `isNational` row — mirroring `ResourceRepository.SearchAsync`.
- **National:** `isNational` only. National and municipality stay mutually exclusive as today.
- **Categories:** any of the selected slugs present on the row.
- **Search:** trimmed, case-insensitive substring match on `name` or `description` in the
  current language. No diacritic folding, because the API's `ILIKE` does none. (`match.ts`'s
  `fold` stays for suggestions only.)
- **Order:** local rows before national (`isNational` false first), then `name` with
  `Intl.Collator("nb")`, then `id`.
- **Paging:** 20 per page, matching `Paging.DefaultPageSize`.

`services/api.ts` is replaced by `services/data.ts` (loads the JSON files) and
`services/query.ts` (the pure rules above, unit-tested against the same cases the API tests
use). `useResources` and `useCatalog` keep their signatures where the components allow it.

## URL and language model

A static host serves one file per path, so the language lives in the path. The URL is the
single source of truth for language.

| Page | Norwegian | English |
|---|---|---|
| Landing | `/` | `/en/` |
| Search | `/sok` | `/en/sok` |
| Resource | `/resources/{id}` | `/en/resources/{id}` |
| Kommune | `/kommune/{slug}` | `/en/kommune/{slug}` |

- Filter query parameters on `/sok` are unchanged. The `lang` parameter is gone from
  `buildSearch`.
- `parseRoute` strips the `/en` prefix and returns `{ lang, route }`. `LanguageProvider` takes
  the language from the route; it no longer reads local storage.
- The language toggle is a link to the same page under the other prefix, carrying `hreflang`
  and `lang` for the target language. It still writes the
  preference to local storage on an explicit toggle. Nothing else writes it.
- The remembered preference acts in exactly one place: an arrival at bare `/` with an empty
  query string. `theme-init.js` (pre-paint, already loaded synchronously) gains a check: on
  pathname `/`, empty search and a stored English preference, `location.replace("/en/")`.
  This runs before first paint, so there is no Norwegian flash and no hydration mismatch.
  Deep links always carry their language. `/?lang=nb` is never redirected by this rule.
- Legacy URLs are handled in the same pre-paint script, never in React, because the HTML file
  served for a legacy URL is the wrong page and hydrating over it would mismatch. Two shapes,
  both resolved with `location.replace` before first paint: `?lang=en` on any route
  (`/?lang=en`, `/sok?lang=en&…`, `/resources/5?lang=en`) becomes the prefixed path with the
  remaining query kept; pre-landing `/?search=…` bookmarks become `/sok?search=…`. The
  `isLegacyListUrl` rewrite leaves `useUrlState`. The plan 4 rule holds: `/?lang=en` lands on
  the English landing, never on results.
- Resource URLs keep the numeric id. Rows have no slug field, ids are stable and already
  live, and the page title carries the name.

## Pages

Per language, the prerender produces:

| Page | Count | Content in the HTML |
|---|---|---|
| Landing | 1 | none (no data load, as today) |
| Search shell | 1 | header, search box, filter bar, no results |
| Resource | one per row | the resource |
| Kommune | one per kommune with at least one own or served resource | that kommune's resources |

Plus `sitemap.xml` listing every page above in both languages with `hreflang` alternates,
and `robots.txt` pointing at the sitemap.

**Search shell.** `/sok` is prerendered with its chrome and an empty results region in the
loading state. After hydration it loads the JSON files and renders results. Filter combinations
live in query parameters and cannot be prerendered; search engines should not index them, and
`robots.txt` disallows `/sok?`, `/en/sok?` and `/data/`.

**Kommune page.** A new route kind `{ kind: "kommune"; slug: string }` and one new component,
`KommunePage`. It renders: an `h1` "Hjelpetjenester i {name}" / "Help services in {name}", a
one-paragraph description, the existing `ResourceCard` grid for rows where
`municipalityId === id` or `servedMunicipalityIds` contains `id`, ordered as in search; an
`h2` and grid for national rows; a link into `/sok?municipality={id}` for refining.
No search box, no filter bar. Rules:

- Only kommuner with at least one own or served resource get a page. An empty page is thin
  content and is not generated.
- Slug is derived from the name at build time: lower case, `æ`→`ae`, `ø`→`oe`, `å`→`aa`,
  spaces and other non `[a-z0-9]` runs → `-`. Kommuner are processed in id order; on a
  collision the later one gets `-{id}` appended. The export script writes the slug map to
  `public/data/kommuner.json` (only kommuner that get a page) so the prerender and the client
  share one list; the browser never computes a slug.
- The landing page's municipality suggestions and the results' municipality names link to the
  kommune page, so every kommune page is reachable by a crawler.

**Head per page.** Each page component declares its `<title>`, `<meta name="description">`,
`<link rel="canonical">` and `hreflang` links for `nb`, `en` and `x-default` (→ nb) through one
`PageHead` component. On the server `PageHead` hands the values to a collector that the
prerender writes into `<head>`; in the browser it writes them in an effect, the way
`useDocumentTitle` does today, so the head never takes part in hydration. `useDocumentTitle`
is removed. Absolute URLs use `VITE_SITE_ORIGIN`, set by the workflow from the `SITE_ORIGIN`
repository variable (the `pages.dev` URL until a domain exists) and guarded the way `API_URL`
was; the dev default is `http://localhost:5173`. Titles:

| Page | nb | en |
|---|---|---|
| Landing | `Varde – finn riktig hjelpetjeneste` | `Varde – find the right help service` |
| Search | `Søk – Varde` | `Search – Varde` |
| Resource | `{name} – Varde` | same |
| Kommune | `Hjelpetjenester i {name} – Varde` | `Help services in {name} – Varde` |

Descriptions: landing and search keep the current meta description per language; resource
uses its description cut at the last space before 155 characters with `…` appended (whole
description if shorter); kommune uses "{n} hjelpetjenester i {name},
fylke {county}, med telefonnummer og åpningstider" and the English equivalent.

**JSON-LD.** The prerender script (server only) injects one `<script type="application/ld+json">`
into resource pages: `@type: Organization`, `name`, `description`, `telephone`, `url`
(`website`), `email`, `address` as a plain `PostalAddress.streetAddress` string when present,
`areaServed` as the municipality name or "Norge". No `openingHours`, because `openingHours`
is free text (recorded blocker). Kommune pages get a `CollectionPage` with `name` and
`description`. The browser never needs this, so it is not rendered by React.

## Prerender and hydration

**Build.** Vite's own SSR recipe, no new runtime dependency:

1. `vite build` — the client bundle, as today; `index.html` becomes the template with two
   placeholder comments, `<!--app-head-->` and `<!--app-html-->`, plus a `<!--app-data-->`
   slot for the page data block.
2. `vite build --ssr src/entry-server.tsx --outDir dist-server` — exports
   `render(url: string, data: PageData): Promise<{ html: string; head: HeadEntry | null }>`,
   where `HeadEntry = { title, description, path, lang }`; the prerender writes the head tags
   itself rather than receiving pre-rendered markup.
3. `node scripts/prerender.mjs` — reads the JSON in `public/data/`, derives the URL list,
   calls `render` for each, and writes `dist/<path>/index.html`. Folder form, not
   `12.html`, so Cloudflare Pages serves both `/resources/12` and `/resources/12/`.
   Also writes `sitemap.xml`, `robots.txt`, and `404.html` from the same template with the
   static not-found line in a `<noscript>` block, an empty `#root` and no data block. `dist-server/` is deleted
   afterwards and never deployed.

**Render API.** React 19's `prerender` from `react-dom/static`, not `renderToString`. It
waits for lazy chunks and Suspense boundaries, so the existing code splitting of the list and
detail chunks stays and the landing bundle stays small. The client entry hydrates when `#root`
already has children and falls back to `createRoot` when it is empty. One code path covers
the prerendered pages, the Vite dev server (which serves an empty root) and `404.html`.

**Page data.** `PageData` is `{ resource }` for a resource page, `{ kommune: { entry, local,
national } }` for a kommune page, `{}` otherwise. The prerender inlines it as
`<script type="application/json" id="varde-data">` before the module script. Non-executable,
so the CSP stays `script-src 'self'`. The resource and kommune hooks read that block on first
render and fetch nothing. The search shell has no data block and loads the JSON files in an
effect after hydration. Client-side navigation from search to a resource uses the already
loaded index; a direct load uses the block. Client-side navigation to a kommune page loads
`kommuner.json` and the index files first.

**Inline JSON is escaped.** Both inline blocks, the page data and the JSON-LD, are serialised
with `<` as `<` and U+2028/U+2029 as escapes, so a description containing `</script>`
cannot close the block. A fixture with exactly that string is in the prerender tests. Today the
data is my own seed; a RESH or Enhetsregisteret import would make it untrusted, and the
escaping is in place before that.

**No browser globals during render.** `useUrlState` becomes a pure parse of a URL passed in:
the browser's location on the client, the target URL from the prerender on the server, carried
in a small `UrlContext`. `resolveLang` and its local storage read are deleted (the language
is in the route). Theme is already safe: the pre-paint script sets `data-theme` on `<html>`,
outside the hydrated `#root`, so no mismatch. `<html lang>` is written into the template per
language by the prerender script; the provider's effect that sets `document.documentElement.lang`
stays as a no-op on load and does its job on client-side language toggles.

**Time-dependent rendering.** `HandoverBanner` calls `handoverVariant(new Date())` in its
state initialiser, which would render one variant at build time and another in the browser: a
guaranteed hydration mismatch. It changes to a neutral first render (`variant = null`: the
legevakt line only, which every variant shows, so nothing shifts) and computes the variant in
the effect it already has. This is the only component
that reads the clock during render (verified by grep on 2026-09-15).

**Hydration errors are build errors.** `hydrateRoot` gets `onRecoverableError` that
`console.error`s in production and throws in tests. The hydration test in Testing is the
guard; no page ships that mismatches in jsdom.

**Works before hydration.** The prerendered HTML is on screen before JavaScript arrives, and on
a slow connection that gap is when someone in distress is looking at it. Everything
safety-critical is therefore a real anchor in the HTML: `tel:` call buttons, the acute strip,
the language toggle and quick exit. Quick exit renders as an `<a>` to its target, and hydration
adds the `location.replace` behaviour on top. A test asserts the prerendered resource page
contains a `tel:` href and the quick-exit anchor.

**Fallback for the combobox.** If react-aria's `ComboBox` cannot be server-rendered in this
version, it mounts client-only behind a plain `<input>` with identical attributes and
accessible name, swapped in an effect. Not expected: react-aria-components supports server
rendering on React 18 and later.

## 404, errors and the report link

**404.** Cloudflare Pages serves `/404.html` with a real 404 status for any path without a
file. This one file cannot be prerendered in two languages, so it ships with an empty `#root`
and takes the `createRoot` path instead of hydrating. A `<noscript>` block carries a static
`Fant ikke siden / Page not found` line for the no-JavaScript case; with JavaScript, React
renders the existing not-found view in the language of the URL prefix. Client-side
navigation to a bad path keeps today's `notFound` route.

**Runtime errors.** Resource and kommune pages have their data inline and have no error path.
`/sok` renders results only once all three JSON files have loaded, and keeps the existing
`ErrorState` with retry if any of them fails. Nothing new.

**Report a wrong number.** On the resource page, below the contact actions, a link
"Meld feil i oppføringen" / "Report an error in this listing" to
`mailto:varde.implicate775@passmail.com` with subject `Varde #{id}: {name}` (URL-encoded)
and an empty body. No backend, no form, no storage. The address is one constant,
`REPORT_ADDRESS` in `services/contactActions.ts`, and is a forwarding alias I can switch off
if it attracts spam. When a custom domain arrives it becomes a Cloudflare Email Routing address
and only the constant changes.

## Security headers

`web/public/_headers` replaces `staticwebapp.config.json`, same policy translated:

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'
  Referrer-Policy: no-referrer
  X-Content-Type-Options: nosniff
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

`connect-src` loses the API origin: the only fetches are same-origin JSON. `mailto:` links
are navigations, not fetches, and need no CSP entry. The `navigationFallback` rewrite is not
carried over; every route is a real file and unknown paths must be real 404s. A test asserts
the CSP line in `_headers` equals the one in this spec.

**No analytics.** Cloudflare Pages can inject a Web Analytics beacon; it stays off. The served
HTML contains no script the build did not emit, and the CSP would block one anyway. Checked
as part of the definition of done.

## Retiring Azure

In this order, after the Cloudflare deploy is verified (see Definition of done):

1. Cloudflare Pages project `varde` live on its `pages.dev` URL, both languages, all page types.
2. In the Azure portal (my action; the CLI classifier blocks state-changing `az` calls):
   delete the App Service `varde-api` and its F1 plan, the Static Web App, the
   `varde-github-deploy` app registration with both federated credentials, and the
   `varde-guard` budget alert. Resource group afterwards if empty.
3. In the repo: delete `deploy-api.yml`, remove the Azure secrets and variables from the
   `production` environment, update README (new URL, no cold-start caveat, the daily refresh,
   `npm run data` for local development, the report address policy).
4. The old `azurestaticapps.net` URL goes dark. Varde has been live ten days on it; no
   redirect is kept.

The API's CORS configuration and rate limiter stay as they are; they are harmless when no
browser talks to the API, and removing them is not this plan's job.

## i18n

New keys, both languages, declared and used (no dead keys): `kommune.title`,
`kommune.description`, `kommune.local`, `kommune.national`, `kommune.refine`, `report.link`.
The page titles and descriptions above, the mail subject and the static not-found line are
constants, not i18n keys: they are per-page metadata or bilingual on purpose.

## Testing

All 151 existing web tests keep passing after the URL model change; the API's 85 keep passing
plus one for the DTO field. New, in Vitest:

- **Hydration guard.** For each page type (landing, search shell, resource, kommune): render
  through `entry-server`, load the HTML into jsdom, `hydrateRoot` with a handler that throws
  on any recoverable error. Fake timers around the handover banner prove its first render is
  neutral.
- **Prerender script.** From a fixture: the exact file set in both languages, empty kommuner
  excluded, slug rules (æøå, punctuation, collision), sitemap lists every file with
  alternates, robots present, 404 copied.
- **Head.** Title, description, canonical and `hreflang` per page type per language, read
  from the rendered HTML.
- **Query rules.** `services/query.ts` against the same cases the API repository tests use,
  including served municipalities, exclusivity, ordering and paging.
- **URL model.** Prefix parsing, `buildSearch` without lang, and the pre-paint redirects in
  `theme-init.js` (stored preference on bare `/` only, both legacy shapes, `/?lang=nb` left
  alone) executed like the theme parity test.
- **Composed-page invariants.** Exactly one `h1` on the composed kommune page and the 404
  view, and the existing axe run extended to the kommune page.
- **Before hydration.** The prerendered resource page contains a `tel:` href and the
  quick-exit anchor; the served HTML contains no script the build did not emit.
- **Export script.** With a mocked `fetch`: every page walked, files written, the row floor
  refuses and exits non-zero.
- **Headers.** `_headers` CSP equals the spec string.

Verified in the browser after the first deploy, recorded in the PR:

- Every page type on `pages.dev` in both languages; view-source shows the content without
  JavaScript; an unknown path returns status 404.
- No hydration warning in the console on any page type.
- Lighthouse on all four page types: Performance ≥ 95, Accessibility 100, Best Practices
  ≥ 95, SEO ≥ 95. This is now a fair target for `/sok`; the 67 measured on 2026-09-09 was
  waiting on the API.
- Plan 4's budgets stay in force: ≤ 120 KB gzipped JavaScript on `/`, ≤ 180 KB on `/sok`,
  ≤ 80 KB fonts on `/`.
- Google's Rich Results test accepts a resource page's JSON-LD.
- One scheduled run and one manual run observed green in Actions.

## Definition of done — plan 5

- [ ] `deploy-web.yml` runs on push, cron and dispatch; data → build → deploy in one chain
- [ ] Export script with row floor; `public/data/` gitignored; `npm run data` works locally
- [ ] `servedMunicipalityIds` on the DTO, API tests green
- [ ] Search runs in the browser with the mirrored rules; results identical to before
- [ ] Language in the path; legacy `?lang=` rewritten; `/` honours the stored preference
- [ ] All page types prerendered in both languages; kommune pages live; sitemap and robots
- [ ] Head metadata and JSON-LD per page; Rich Results test passes on one resource page
- [ ] Hydration guard test green; no hydration warning in production console
- [ ] 404 served with status 404 in both languages
- [ ] Report link live with the alias address
- [ ] `_headers` in place; `staticwebapp.config.json` gone
- [ ] Lighthouse and budget table in the PR meets every line above
- [ ] Azure resources deleted, secrets and variables removed, `deploy-api.yml` gone
- [ ] README updated
- [ ] Sitemap submitted in Google Search Console (my action; the HTML verification file is
      committed to `web/public/`)

## Deferred decisions

- Category pages, or category sections within kommune pages: decide after Search Console
  shows how the kommune pages perform.
- Custom domain and `hei@<domain>` via Cloudflare Email Routing: after the domain is bought.
- Splitting the resources index per kommune: only if the data scope grows past regional.
- Resource slugs in URLs: only if ids prove a problem in search results.

## Accepted trade-offs

- React ships on every page (roughly the same JavaScript as today). An Astro rewrite would
  ship less, at the cost of redoing plan 4's page work. Not worth it at regional scale.
- A data edit made directly in Neon appears within a day, not instantly. Every edit I make
  today is a push and deploys immediately.
- The report address is public on every resource page and will be scraped. It is a
  forwarding alias I can disable.
- Cloudflare Pages caps a deploy at 20,000 files. Regional scope in two languages is a few
  hundred. National scope would need on-demand rendering; out of scope.
- The 404 page is client-rendered, so a no-JavaScript visitor sees only the static line.
- Cloudflare, as the host, sees visitor IP addresses in its own logs, as Azure did. Nothing I
  run logs anything about a visitor.
- A kommune renamed in the data changes its slug and URL. The regional set is stable and no
  redirect is kept.
- No HSTS header in `_headers`: `pages.dev` is HSTS-preloaded, and a custom domain gets it at
  the zone level.
