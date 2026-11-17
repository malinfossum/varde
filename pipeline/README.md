# Varde pipeline

Finds, checks and refreshes Varde's service data. Design:
`docs/superpowers/specs/2026-10-28-varde-national-data-design.md`.

So far: the schema for `data/curated/` and `data/lock/`, the five verification gates, the
answer key and the golden test (PR 1), discover and fetch (PR 2), and extract, verify and
review (PR 3). Extraction is rule-based: no model and no page text leaves the machine.
PR 4 added the pilot run: one full run over Oslo and the 46 Innlandet kommuner, committed as a
scored baseline in `data/` and `docs/pilot/pilot-report.md`. Nothing in `data/` reaches the
site until spec B's publish step, and `data:check --publish` refuses while
`test/known-wrong.json` lists a value.

## Commands

Run from `pipeline/` (Node 24 or newer).

```bash
npm ci
npm test              # unit, gate, stage and golden tests; none touches the network
npm run typecheck
npm run data:check    # validates every file in data/; add -- --publish before a publish
npm run schema        # rewrites schema/*.schema.json after a schema change
npm run discover -- --only pilot                # Oslo and Innlandet (or --only 34,0301): units and pages, no page text
npm run fetch -- --only pilot --national        # pages discover listed, into the cache; --resume after a stop
npm run extract -- --only pilot --national      # field values with their quotes, into the cache
npm run verify -- --data ../data --only pilot --nklm-fetch   # the five gates, lock and curated files
npm run review -- --data ../data                # my answers, one item at a time, in a terminal
npm run score -- --only pilot                   # the pass mark and docs/pilot/pilot-report.md
npm run sweep -- --only pilot                   # capitalised words left in the locks, for me to read
npm run recall-report > ../.cache/recall-report.md  # discover's output against the 138-row answer key
```

`verify` and `review` need `--data <dir>`, a folder holding `curated/` and `lock/`. The pilot
writes to the repo's own `data/` (`--data ../data`). Only one of them runs in a
data folder at a time: each holds `<data>/.pipeline.lock` while it runs and refuses to start
when the file is there. A run that was killed outright can leave the file behind; delete it
when no verify or review is running. `verify --nklm-fetch` downloads NKLM's legevakt file from
`NKLM_FILE_URL`, which redirects to `www.norceresearch.no` (on the host allow-list). It keeps the
file only when its hash matches an edition the licence covers; any other file stops the NKLM
step until I record the licence in `docs/licence-requests/README.md`. `--nklm-file` names a
file I downloaded myself and goes through the same hash check. `verify` also takes `--dry-run`,
which reads and counts and writes nothing to `--data`. With `--nklm-fetch` it still saves the
NKLM file in the cache. Both commands take `--cache <dir>` (default `.cache/` at the repo root)
for discover's and extract's output, and `review --kommune 3405` walks one kommune only.

`discover`, `fetch`, `extract` and `verify` each hold `<cache>/pages/run.lock` while they run, so two of
them never share a cache. A lock left by a process that is gone is taken over. Each prints a
line when a kommune is done, with a running count, and `fetch` prints a line about every five
minutes. `fetch --resume` skips a page the same run already fetched and any page under 24 hours
old. `verify --resume` skips a kommune only when its lock's `inputs` (the hashes of its
extraction file, the national extraction file and its curated file, the NKLM edition and
`RULES_VERSION`) all match. A change to a gate or a field rule bumps `RULES_VERSION` in
`src/verify/rules.ts`; `test/rules.test.ts` fails until it is bumped. `extract --offline` and
`verify --offline` fetch nothing and let nothing expire: a page or a Kartverket answer missing
from the cache stops the kommune and names what it missed. `verify --offline` does not ask for
the status of a website or chat URL I typed in review again: its status comes from the page
manifest when that holds the URL, and otherwise my decision stands. Gap PRs score this way, so a
rule change is never mixed with changes on the source pages.

Kartverket's address API gets its own pace, one request a second, and its answers are cached
for 30 days in `<cache>/kartverket/`, each file named by a hash of its search. The 90-day purge
in `fetch` clears them with the pages.

`data:check` accepts a value I edited when the curated file holds a matching `edit` decision, and
it grounds every value the same way the grounding gate does (a website by its source page, hours
by their quote). An answer settles a Lavterskel question only when the rule itself is unsure: if
the rule gives an automatic yes or no that the value contradicts, the item stays in review.
When such an item is in review, `r` (drop the field) is the only answer that overrules the rule.

## Pilot run

Once, on my PC, in a Terminal tab I can see. Ctrl+C stops any stage; run it again with
`--resume` (fetch, verify) or as it was (discover, extract).

1. Freeze the answer key from the live site, so no disagreement comes from an old freeze:
   download `resources.nb.json`, `resources.en.json` and `municipalities.json` from
   `https://varde.pages.dev/data/` into a folder, then
   `npm run key:freeze -- <folder> <yyyy-mm-dd>`.
2. Keep the PC awake. The slowest host at a 5-second pace sets the time, likely an afternoon
   into the evening.
3. Run, each with `--only pilot`:

   ```bash
   npm run discover -- --only pilot
   npm run fetch -- --only pilot --national
   npm run extract -- --only pilot --national
   npm run verify -- --data ../data --only pilot --nklm-fetch
   npm run score -- --only pilot --pr-body ../.cache/pr-body.md
   ```

   If `score` refuses because a kommune failed on a timeout, a network error or a server
   error, run `npm run fetch -- --only pilot --national --resume`, then extract (with
   `--national` again), `verify --resume` and score again. `score` also refuses when a kommune
   that blocks ClaudeBot has no site in discover's files: it names the kommune number, and I
   run `discover` again so the site is found.
4. `npm run score -- --only pilot --seed-blocked` writes "check by hand" entries for the seven
   kommuner that block ClaudeBot. I check those pages myself in a browser.
5. `npm run score -- --only pilot --todo ../.cache/pilot-todo.json` lists the other open
   checks, without the seven kommuner or any page on their sites. A fresh Claude session
   reads only that file and the live pages, and writes its proposals into
   `test/pilot-checks.json` with `by: "proposed"`. I rule on each and set `by: "me"`; every
   "pipeline wrong" ruling also goes into `test/known-wrong.json`.
6. `npm run sweep -- --only pilot` in a terminal outside any AI tool. I read the list myself
   and never paste it into an AI session. A real name means a redaction fix, a test fixture
   and a new `verify`, never a hand edit of a lock.
7. `npm run score -- --only pilot --pr-body ../.cache/pr-body.md` once more, then commit
   `data/lock/`, `data/curated/`, `docs/pilot/pilot-report.md`, `test/known-wrong.json`,
   `test/pilot-checks.json` and `test/answer-key.json` if the freeze changed it.

Gap PRs re-run `extract --offline`, `verify --offline --resume` and `score` from the local
caches, which takes minutes. The report states the date of the oldest page behind the locks,
so a re-baseline after the 90-day purge shows as one.

## Review

`review` shows each open item with its quote, its source link and host, and the gate's reason.
Each answer is a key and Enter, written to the curated file at once (if the data folder is in
git, check it with `git diff`):

| Key | Does |
|---|---|
| a | accept the value as shown; my answer settles a review, never a drop |
| r | reject it; the field is dropped |
| e | type my own value (and a role for a phone); it gets the checks verify runs first |
| s | skip, ask again next time |
| q or Ctrl+C | quit; every earlier answer is already saved |

A value I type that a check drops is refused with the reason. One the validity gate only doubts
(an address Kartverket does not know, a URL that does not answer 200) shows the reason and is
saved only when I type `keep`; typing a new value checks that one instead.

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
(default `.cache/` at the repo root); `extract` and `recall-report` take `--cache <dir>` too,
and `extract` also takes `--dry-run`. `discover` also takes `--date YYYY-MM-DD` (the day KLASS
codes are read for). `fetch` takes `--limit N` (at most N pages per kommune, and per national
source) and `--national`, which adds Nav offices and catalogue findings.

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
  possible names replaced by `[navn]` before it is stored. A value is stored as the page writes
  it, so a name that is part of a value stays: a street named after a person, or an hours line
  that opens with a given name.
- Extraction files (`<cache>/extract/`) hold page lines: cache only, never printed, never committed.
- Text I type in review (a reason, a role, an edited value) is public once the curated file is
  committed. Review warns me about a possible person name before it saves one.
- Brreg sole proprietorships are dropped at the reader, and discover reads no phone or email.
- A catalogue only points to a provider's own page; no value is taken from it.
- Do not open or print cached pages. If an AI tool helps with this code, it must never see a
  page from a kommune that blocks ClaudeBot.

A Dependabot bump of `zod` can change the exported schemas. The snapshot test then fails on
purpose: run `npm run schema` in that PR and commit the result.
