# Varde pipeline

Finds, checks and refreshes Varde's service data. Design:
`docs/superpowers/specs/2026-10-28-varde-national-data-design.md`.

So far: the schema for `data/curated/` and `data/lock/`, the five verification gates, the
answer key and the golden test (PR 1), and discover and fetch (PR 2). Nothing here writes to
`data/` yet, and nothing reaches a model.

## Commands

Run from `pipeline/` (Node 24 or newer).

```bash
npm ci
npm test              # unit, gate, crawler and golden tests; none touches the network
npm run typecheck
npm run data:check    # validates every file in data/
npm run schema        # rewrites schema/*.schema.json after a schema change
npm run discover -- --only 34,0301      # Innlandet and Oslo: units and pages, no page text
npm run fetch -- --only 3405 --limit 3  # pages discover listed, into the cache
npm run recall-report > ../.cache/recall-report.md  # discover's output against the 138-row answer key
```

`--only` takes kommune numbers or two-digit fylke prefixes, and `discover` requires it.
`discover` and `fetch` take `--dry-run` (read and report, write nothing) and `--cache <dir>`
(default `.cache/` at the repo root); `recall-report` takes `--cache <dir>` too. `discover`
also takes `--date YYYY-MM-DD` (the day KLASS codes are read for). `fetch` takes `--limit N`
(at most N pages per kommune, and per national source) and `--national`, which adds Nav
offices and catalogue findings.

## How it fetches

- Only `src/net/` touches the network. It sends `VardeBot/1.0 (+https://varde.pages.dev/om)`,
  HTTPS only, to allow-listed hosts only, and refuses any host that resolves to a private
  address.
- It reads robots.txt (`Disallow`, `Allow`, `Crawl-delay`, `Visit-time`, `Sitemap`) and waits
  5 seconds or the host's crawl delay, whichever is longer, between two requests to one host.
  A crawl delay over 60 seconds keeps the host out for the run.
- Kommune, catalogue and provider hosts are read strictly to RFC 9309: a robots.txt that
  cannot be read keeps the host out. The register hosts (Brreg, SSB's KLASS on `data.ssb.no`
  and `www.ssb.no`, Kartverket and nav.no) are documented open APIs, so there I treat a
  robots.txt that cannot be read as no rules. Their readable rules, the 5-second floor,
  `Retry-After` and every other limit still apply.
- Discover reads each kommune's sitemaps and also probes `/sitemap.xml` on kommune sites and
  nav.no.
- A 429 or 503 waits for `Retry-After`; a second one stops the host for the run. Outside a
  host's `Visit-time` the host is skipped. A timeout, a server error, 30 seconds or 5 MB end
  a request; the run goes on and lists what it skipped.
- The manifest (`pages/manifest.json` in the cache) holds the pages fetched with status 200.
  Every other final status sits in `pages/report.json`. A page that later stops answering
  keeps its manifest entry until the 90-day purge.

## Privacy

- Raw pages can hold staff names. They live in the cache folder only (gitignored here, the
  job's temporary folder in Actions), and a local cache drops them after 90 days.
- Commands print counts, hosts, kommune numbers and reasons. Never page text, unit names,
  org numbers, phone numbers or URLs; URL lists go to report files in the cache folder.
- Brreg sole proprietorships are dropped at the reader, and discover reads no phone or email.
- A catalogue only points to a provider's own page; no value is taken from it.
- Do not open or print cached pages. If an AI tool helps with this code, it must never see a
  page from a kommune that blocks ClaudeBot.

A Dependabot bump of `zod` can change the exported schemas. The snapshot test then fails on
purpose: run `npm run schema` in that PR and commit the result.
