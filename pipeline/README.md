# Varde pipeline

Finds, checks and refreshes Varde's service data. Design:
`docs/superpowers/specs/2026-10-28-varde-national-data-design.md`.

So far: the schema for `data/curated/` and `data/lock/`, the five verification gates, the
answer key and the golden test (PR 1), discover and fetch (PR 2), and extract, verify and
review (PR 3). Extraction is rule-based: no model and no page text leaves the machine. Nothing
here writes to the repo's `data/` yet; PR 4 commits the pilot's lock files.

## Commands

Run from `pipeline/` (Node 24 or newer).

```bash
npm ci
npm test              # unit, gate, stage and golden tests; none touches the network
npm run typecheck
npm run data:check    # validates every file in data/
npm run schema        # rewrites schema/*.schema.json after a schema change
npm run discover -- --only 34,0301      # Innlandet and Oslo: units and pages, no page text
npm run fetch -- --only 3405 --limit 3  # pages discover listed, into the cache
npm run extract -- --only 3405          # field values with their quotes, into the cache
npm run verify -- --data <dir> --only 3405 --nklm-file <path>   # the five gates, lock and curated files
npm run review -- --data <dir>          # my answers, one item at a time, in a terminal
npm run recall-report > ../.cache/recall-report.md  # discover's output against the 138-row answer key
```

`verify` and `review` need `--data <dir>`, a folder holding `curated/` and `lock/`. Until PR 4,
`verify` refuses the repo's own `data/` and every folder inside it. Only one of them runs in a
data folder at a time: each holds `<data>/.pipeline.lock` while it runs and refuses to start
when the file is there. A run that was killed outright can leave the file behind; delete it
when no verify or review is running. `verify --nklm-fetch` downloads NKLM's legevakt file from
`NKLM_FILE_URL`, which redirects to `www.norceresearch.no` (on the host allow-list). It keeps the
file only when its hash matches an edition the licence covers; any other file stops the NKLM
step until I record the licence in `docs/licence-requests/README.md`. `--nklm-file` names a
file I downloaded myself and goes through the same hash check. `verify` also takes `--dry-run`,
which reads and counts and writes nothing.

`data:check` accepts a value I edited when the curated file holds a matching `edit` decision, and
it grounds every value the same way the grounding gate does (a website by its source page, hours
by their quote). An answer settles a Lavterskel question only when the rule itself is unsure: if
the rule gives an automatic yes or no that the value contradicts, the item stays in review.

## Review

`review` shows each open item with its quote, its source link and host, and the gate's reason.
Each answer is a key and Enter, written to the curated file at once (check it with `git diff`):

| Key | Does |
|---|---|
| a | accept the value as shown; my answer settles a review, never a drop |
| r | reject it; the field is dropped |
| e | type my own value (and a role for a phone); it gets the checks verify runs first |
| s | skip, ask again next time |
| q or Ctrl+C | quit; every earlier answer is already saved |

A mobile with no role offers no `a`: the safety gate passes it only with a role, so only `e`
(with a role) or `r` settles it. For "include this unit?" the keys are y (then pick categories)
and n (then type why). Every question takes q, every answer prints one "Saved: ..." line, and a
second Ctrl+C leaves at once. An item verify could not settle with my earlier answer comes back,
labelled "my answer of <date> did not settle it".

A reason or a role I type is stored in the curated file, which is public once committed. Review
refuses one with a hidden character, and shows back a possible person name and keeps it only
when I type `keep`.

Page text is stripped of control codes, escape sequences, bidi, zero-width and other hidden
characters before it is shown, and the item says how many characters it removed. `NO_COLOR`
turns colour off, and meaning never rests on colour. `review` refuses to run without an
interactive terminal. Git Bash's own window is not one to Node: run it in PowerShell or Windows
Terminal, or start it as `winpty npm run review -- --data <dir>`.

`--only` takes kommune numbers or two-digit fylke prefixes, and `discover` requires it. An
`--only` that matches no kommune stops `discover` before it writes anything, and a `fetch`
selection with no pages exits with code 2 and leaves `pages/report.json` as it was.
`discover` and `fetch` take `--dry-run` (read and report, write nothing) and `--cache <dir>`
(default `.cache/` at the repo root); `extract` and `recall-report` take `--cache <dir>` too, and `extract` also takes `--dry-run`. `discover`
also takes `--date YYYY-MM-DD` (the day KLASS codes are read for). `fetch` takes `--limit N`
(at most N pages per kommune, and per national source) and `--national`, which adds Nav
offices and catalogue findings.

## How it fetches

- Only `src/net/` touches the network. It sends `VardeBot/1.0 (+https://varde.pages.dev/om)`,
  HTTPS only, to allow-listed hosts only (no port, no user info in the URL), and refuses any
  host that resolves to a private address.
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
- A role mobile keeps two quotes only, the role word and the number. Every other quote has its
  possible names replaced by `[navn]` before it is stored. Names are never stored.
- Extraction files (`<cache>/extract/`) hold page lines: cache only, never printed, never committed.
- Text I type in review (a reason, a role, an edited value) is public once the curated file is
  committed. Review warns me about a possible person name before it saves one.
- Brreg sole proprietorships are dropped at the reader, and discover reads no phone or email.
- A catalogue only points to a provider's own page; no value is taken from it.
- Do not open or print cached pages. If an AI tool helps with this code, it must never see a
  page from a kommune that blocks ClaudeBot.

A Dependabot bump of `zod` can change the exported schemas. The snapshot test then fails on
purpose: run `npm run schema` in that PR and commit the result.
