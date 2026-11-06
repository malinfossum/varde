# Varde: get every page indexed

Date: 2026-11-06. Scope: `web/` and the deploy workflow's ping step. The data pipeline
(`pipeline/`) and the national data spec are out of scope.

## Purpose

On 05.11.2026 I audited how search engines see Varde. Google knows one page, the front page.
Bing has the front page as "Blocked". The site itself is fine: robots.txt, the sitemap (298
URLs, all 200), prerendered HTML with title, description, canonical, hreflang and JSON-LD,
noindex on preview hosts, real 404s.

The root cause is orphan pages. No crawlable link reaches any kommune page. The front page
links four helplines and `/sok?category=...`, which robots.txt blocks, and `/sok` prerenders
empty. The 8 kommune pages are what link all 138 services, so 134 services and every kommune
page are reachable through the sitemap only.

Success: Google and Bing index every service page and every kommune page. No tracking, nothing
paid. Inbound links (portfolio, GitHub profile, LinkedIn) are mine to add by hand, outside this
PR.

## Decisions locked in the brainstorm (05.11.2026 and 06.11.2026)

1. **One PR, four fixes:** a `/kommune` index page linked from the header, IndexNow, a real
   front page meta description, and longer titles plus WebSite JSON-LD.
2. **`/kommune` groups kommuner by fylke**, from the `county` field in `kommuner.json`, each
   with its local service count. It scales past 15 kommuner without new data.
3. **The header link says "Kommuner" / "Municipalities"**, right after "Alle tjenester".
   Measured on the live header at 1024 px: the Norwegian row uses about 620 of 992 px today,
   and the new link adds 94 px. English fits by about 180 px.
4. **Service titles add the place only when the name lacks it.** If the title would pass 60
   characters, ` – Varde` is dropped. A name is never cut, because the title is also what a
   screen reader and a browser tab show.
5. **IndexNow pings only what changed**, found by diffing a page-hash manifest against the live
   one. The ping never fails a deploy.
6. **Copy approved by me** (this spec is the source for it):

| Where | nb | en |
|---|---|---|
| `/` title | Varde – finn riktig hjelpetjeneste der du bor | Varde – find the right help service where you live |
| `/` meta description | Finn hjelpetjenester der du bor: hjelpetelefoner, lavterskeltilbud og kommunale tjenester, med telefon, adresse og åpningstider. Gratis og uten sporing. | Find help services where you live: helplines, low-threshold services and municipal services, with phone, address and opening hours. Free, no tracking. |
| `/sok` title | Søk i alle hjelpetjenester – Varde | Search all help services – Varde |
| `/kommune` title | Hjelpetjenester per kommune – Varde | Help services by municipality – Varde |
| `/kommune` h1 | Hjelpetjenester per kommune | Help services by municipality |
| Header link | Kommuner | Municipalities |
| Count label | 1 tjeneste / {n} tjenester | 1 service / {n} services |
| National line | {n} nasjonale tjenester gjelder i hele landet. Se alle tjenester | {n} national services cover the whole country. See all services |

`/om` and the kommune pages keep their titles. The landing page's visible subtitle stays as it
is; only the meta description changes, through its own key `landing.description`.

## Design

### The `/kommune` page

- **Route.** `services/urlState.ts` gains `{ kind: "kommuneIndex" }` for `/kommune` (and
  `/en/kommune` through the existing language prefix), with the matching path back.
- **Data.** A pure service, `services/kommuneIndex.ts`, builds
  `{ groups: [{ county, kommuner: [{ slug, name, count }] }], national }`. Groups and kommuner
  sort A-Å with the `nb` collation. Each `count` is `splitForKommune(entry, resources).local.length`,
  so it always equals the number on that kommune's own page, shared services such as krisesentre
  included. `national` counts `isNational` rows. County names come from the data as they are
  (`Innlandet`, `Oslo`) in both languages.
- **Prerender.** `urlList` adds `/kommune` in both languages, so the sitemap grows to 300 URLs.
  The prerender bakes the index into the page data (`PageData.kommuneIndex`), so a direct load
  fetches nothing. A client-side navigation builds it from `loadIndex(lang)`, the way
  `KommunePage` does, with the same loading and error states. `entry-server.tsx` re-exports the
  builder for the prerender script, as it does `splitForKommune`.
- **Component.** `components/KommuneIndexPage.tsx`, a lazy chunk listed in the prerender's
  `CHUNKS`. Thin: it renders what the service returns. h1 with arrival focus, one `section` per
  fylke labelled by its h2, a list of links, then the national line with a link to `/sok`.
- **Layout.** Each kommune is one whole-row link, at least 44 px tall: the name in body ink,
  the count as a muted label beside it, so the label reads as a label. Mobile-first tiles: 1
  column at 320 px, 2 at 768 px, 3 at 1024 px, 4 at 1600 px. Inside the existing `max-w-6xl`
  main column, as every page.

### Header

`HeaderLinks` gains a `Link` to `/kommune` after "Alle tjenester". The desktop nav and the Meny
both render `HeaderLinks`, so one change covers both.

### Titles, description and JSON-LD

- **`serviceTitle(resource)`**, a pure function in `services/`, applies decision 4. "Lacks the
  place" means `municipalityName` is not a case-insensitive substring of `name`. National rows
  have no place and keep `{name} – Varde`. `ResourceDetail` uses it. Live data on 06.11.2026:
  48 of 121 local titles gain the place, 5 drop the suffix, 3 stay over 60 because the name
  alone is.
- **Static titles and the meta description** move into `nb.json` and `en.json`, with the copy
  from the table above.
- **WebSite JSON-LD** on `/` and `/en/`: `@type: WebSite`, `name: "Varde"`, `url` (the
  language's front page), `inLanguage`. No `SearchAction`: Google retired the sitelinks search
  box, and `/sok?` is blocked in robots.txt anyway. Built in `prerender.mjs` beside the existing
  `jsonLd`, written through the same `escapeJson` path.

### IndexNow

Facts from indexnow.org's documentation (read 06.11.2026): one POST to
`https://api.indexnow.org/indexnow` takes up to 10,000 URLs; the key is 8 to 128 characters of
`a-z A-Z 0-9 -`; a key file at the site root, `/<key>.txt` holding the key, needs no
`keyLocation`; success is 200 (202 while the key is still being checked).

- **Manifest.** `prerenderSite` writes `dist/page-hashes.json`: each page URL mapped to a
  SHA-256 of that page's own content, which is its head tags, rendered markup, baked data and
  JSON-LD. The template and the hashed asset links are left out, so a code-only change flags
  nothing. The 404 page is not in it.
- **Diff.** `scripts/indexnow.mjs` exports a pure `changedUrls(live, next)`: URLs that are new,
  whose hash changed, or that were removed (IndexNow takes a removed URL as "gone"). Sorted, so
  the output is stable.
- **Ping.** The same script's CLI reads the live and the new manifest, turns paths into absolute
  URLs with `SITE_ORIGIN`, and POSTs `{ host, key, urlList }` in batches of up to 10,000. A
  missing or unreadable live manifest counts as empty, so the first run sends every URL once.
  Zero changes means no request at all. It logs the status code and the URL count, nothing
  else, and always exits 0.
- **Key.** A random 32-character hex key, kept as a constant in the script, plus
  `web/public/<key>.txt` holding it. It is public by design: Bing reads the file to check that
  the ping comes from the site's owner. A unit test checks that the file and the constant agree.
- **Workflow (`deploy-web.yml`).** Before the deploy step:
  `curl -sf "$SITE_ORIGIN/page-hashes.json" -o live-hashes.json || true`. After it, an
  "IndexNow" step with `continue-on-error: true` and a 2-minute timeout runs the CLI. The
  workflow deploys `main` only, so preview hosts are never pinged. It reads `vars.SITE_ORIGIN`,
  so a later domain switch needs no change here.
- **Accepted gap.** If a run is cancelled after the deploy and before the ping, those changes
  are never pinged, because the next run sees them as live already. The sitemap still covers
  them.

## Risks to check during the build

- **`/kommune` next to the `kommune/` folder.** Pages are written in file form
  (`kommune.html`), and `dist/kommune/` already holds the kommune pages. I don't know how
  Cloudflare Pages and `vite preview` resolve `/kommune` and `/kommune/` when both exist. Check
  both on the PR's preview deploy with curl before merge: `/kommune` must answer 200 with the
  index page, and `/kommune/` must not 404.
- **The hydration guard** (no `<script`, `<template` or `style=` in prerendered markup) must
  pass for the new route like every other.

## Testing

- **Unit (Vitest):** `serviceTitle` against the rule's cases (place missing, place present,
  national, over 60, name alone over 60); `kommuneIndex` grouping, sort order and counts equal
  to `splitForKommune`; `urlList` and the sitemap include `/kommune` in both languages; WebSite
  JSON-LD on both front pages and nowhere else; the manifest (same input gives the same hash,
  a changed asset link keeps it, changed content changes it); `changedUrls` (new, changed,
  removed, empty live); the key file matches the constant; the new i18n keys exist in both
  languages.
- **End to end (Playwright):** `/kommune` and `/en/kommune` show the fylke groups, every link
  reaches its kommune page, and each count equals that page's count; the header link in the
  desktop nav and in the Meny; no horizontal overflow and 44 px link rows at 320, 768, 1024,
  1280, 1600 and 1920 px; axe on the new route.
- **Before the PR:** `npm test` and the full `npm run e2e` in `web/`.

## After deploy (mine)

Request indexing for `/kommune` and two or three kommune pages in Search Console, check the
Bing IndexNow report shows the first ping, and re-check the sitemap status in Search Console
around 12.11.2026.
