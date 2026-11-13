# Varde national data, PR 4 (pilot run) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the pipeline fit for one full, stoppable run over Oslo and the 46 Innlandet kommuner, then run it once on my PC and commit the result as a scored baseline: 47 lock files, the curated files, `docs/pilot/pilot-report.md`, `test/known-wrong.json`, `test/pilot-checks.json` and `data/README.md`. Nothing reaches the live site.

**Architecture:** Two fixes come first, before any lock is committed: the address place-part rule (verify keeps the page's place only when it matches Kartverket's postcode and poststed) and a 1-second pace with a 30-day disk cache for Kartverket. Then the run gets its plumbing: a pilot list behind `--only pilot`, a page-cache journal with `fetch --resume`, a hash-based `verify --resume`, a failed-kommune lock, `--offline`, progress lines and a cache lock. `npm run score` reads only committed files plus the local discover and extract caches, and writes a deterministic report and a PR-body summary. A ratchet (`test/known-wrong.json`) lets the golden test and `data:check --publish` live with the baseline's known wrong values. `npm run sweep` lists capitalised words left in the locks before I commit them.

**Tech Stack:** Node 24 (native type stripping), TypeScript 7.0.2, Zod 4.6.7, Vitest 5.1.0, Biome 2.6.7, `cheerio@1.2.0`, `tldts@7.4.26`, `fflate@0.8.3`. No new dependency. Node built-ins only for the rest: `node:crypto`, `node:fs`, `node:path`, `node:util`.

**Spec:** `docs/superpowers/specs/2026-10-28-varde-national-data-design.md` on `docs/national-data-spec` (tip f4b8004 or later). Read "PR 4: pilot run" in full before Task 1, plus "Pilot" (the pass mark), "Kommuner that block ClaudeBot" and "Privacy". That section wins where it differs from earlier text. Code it builds on: `pipeline/` on `main` (PR 3 merged, tip 9972c1f). Branch `feat/pipeline-pilot` from `main`.

## Global Constraints

Every task's requirements include these. Values are copied from the spec and from the PR 3 plan where they still apply.

- **Only `src/net/` touches the network, and no test does.** `test/networkBoundary.test.ts` fails if any file outside `src/net/` imports `node:http`, `node:https`, `node:http2`, `node:net`, `node:tls`, `node:dns`, `node:dgram`, `undici` or the full `cheerio`, or calls `fetch(`, and if any test imports `src/net/http.ts` or a CLI. Every stage takes the crawler's `get(url, kind)`; tests use `fakeGet`, `fakeWeb` and `FakeClock` from `test/netHelpers.ts`. CLIs are never imported by tests, so every piece of CLI logic worth testing lives in a module under `src/`.
- **No new dependency.** Pinned versions stay as they are in `pipeline/package.json`.
- **Node 24**, relative imports carry `.ts`, and only erasable TypeScript: no `enum`, no `namespace`, no constructor parameter properties.
- **No AI model, no key, no spend.** The pilot extracts with rules.
- **The 7 pilot kommuner that block ClaudeBot:** Hamar (3403), Løten (3412), Stange (3413), Nord-Odal (3414), Sør-Odal (3415), Grue (3417) and Våler (3419). Checked 13.11.2026: each robots.txt has `User-agent: ClaudeBot` / `Disallow: /`; Våler's site is `www.vaaler-he.kommune.no` (Brreg, kommune 3419), and Østfold's Våler (3114, `www.valer.kommune.no`) has no such block. Their page text, extraction files, lock values and lock quotes must never reach an AI company. No AI agent opens, prints or quotes any of those for these kommuner, and the sweep output for any kommune is never pasted into a Claude session.
- **Never print cached page text, extraction files, or lock quotes and values, for any host, from an AI agent's shell.** The implementer is an AI agent: anything it prints is sent to Anthropic. Checks print counts, lengths, kommune numbers and reasons. The pilot run itself happens in my visible Terminal tab, never in an agent's shell. One exception, by the spec's design: Task 13's checks session reads `pilot-todo.json` (values and quotes from the 40 open kommuner) only after I have read the sweep. Nothing from the seven reaches it.
- **Logs are public in Actions** (PR 5 runs these stages there). Commands print counts, kommune numbers, KLASS kommune names, hosts and reasons. Never page text, quotes, unit names, org numbers, phone numbers, emails or URLs. Exceptions, both local only: an `--offline` cache miss names the URL or the search it missed (the spec asks for it), and `sweep` prints words from the locks to my terminal. Neither runs from an agent's shell over the real `.cache/` or `data/`, and neither output goes into a Claude session: a miss can name a street from a page in a kommune that blocks ClaudeBot.
- **Fail closed.** Each lock, curated, extraction and report file is written whole (`writeJsonAtomic`, `writeFileAtomic`, `writeLockFile`); a stop never leaves half a file.
- **Linear-time patterns only.** No nested or overlapping quantifiers on text from pages or locks.
- **Deterministic report.** `docs/pilot/pilot-report.md` holds no clock time, no durations, no machine path and no cache-dependent number. The same locks, curated files, key and checks, read with the same discover, crawl and extract caches (part 5 reads them), give the same bytes, with `\n` line ends.
- **Markdown that GitHub renders is inert.** Every quote, value and source URL in the report or the PR body goes through `sanitise()` (`src/review/sanitise.ts`) and then into a code span or a fenced code block whose fence is longer than any backtick run inside it. URLs are code spans, never links. Free text from the key (unit names) goes through `inert()` (`src/recall/report.ts`).
- **Test fixtures are fictional:** numbers like `62 00 00 00`, the placeholder names "Kari Nordmann" and "Ola Nordmann", org numbers starting `99999`, hosts under `eksempel.kommune.no`, postcodes and poststeder like `2999 EKSEMPELBY`. The one real-data exception stays the PR 2 KLASS fixture in `test/fixtures/klass/`.
- **Text I ship:** code, comments and docs in English, first person, no em dashes anywhere (rewrite the sentence; no en dash or spaced hyphen as a stand-in). Dates in prose are `13.11.2026`, times `13:00`. ISO dates stay where a machine reads them.
- **Commits:** conventional prefix (`feat:`, `fix:`, `test:`, `docs:`, `chore:`), scope `(pipeline)` or `(data)`, author `malinfossum.dev@proton.me`, no `Co-Authored-By`, no AI attribution. Stage explicit paths only, never `git commit -a`.
- **Dates:** before writing any date into a file, run `date +"%Y-%m-%d %A"` in the same tool batch.
- **Every new check is shown red once:** break the code or a fixture on purpose, run the check, see it fail, restore. Each task names its break; the PR body lists every break and its red result.
- **Commands, from `pipeline/`:** `npx biome check --write .` then `npx biome ci .`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run data:check`. PostgreSQL is not needed for the pipeline suites.

## Review Focus

Inputs the spec implies but no spec test names, most likely first. Each has a test in the task that owns the code.

1. **A resumed fetch overwrites the crawl report.** `fetch --resume` only requests what is missing, so its `pages/report.json` would lose the hosts the first run stopped, and verify would then call a failed kommune "no pages fetched" instead of "host stopped: timeout", which `score` scores as lost recall instead of refusing. The resumed run merges its report into the previous one. Test in Task 4.
2. **`verify --resume` after I answer review questions.** `review` rewrites the curated file, and the extraction file and `RULES_VERSION` stay the same. A resume that compared only those two would keep the old lock, and my answers would not reach the lock until a full re-run. The lock's `inputs` also hold the curated file's hash, so the kommune re-runs. Test in Task 6.
3. **A gap PR that changes a gate and forgets `RULES_VERSION`.** `verify --resume` would then skip every kommune and the gap PR would score stale locks. A fingerprint test hashes the rule folders and fails until the version and the fingerprint are bumped together. Test in Task 5.
4. **A poststed of two words or with a hyphen.** "2999 Nordre Eksempelby Kari Nordmann" against Kartverket's `NORDRE EKSEMPELBY` must keep "2999 Nordre Eksempelby" and cut "Kari Nordmann"; a page that writes "2999 Nordre-Eksempelby" is not the poststed and goes to review. Test in Task 2.
5. **Fewer than 20 units to sample.** If the 39 kommuner outside the key give fewer than 20 included units with an accepted field, the sample takes all of them, and part 7 and rule 5 say "N of 20" instead of pretending to a full sample. Test in Task 8.

## Decided (13.11.2026, writing this plan)

Choices the spec leaves open, or where the code on `main` forced a shape. Each line has its reason. Lines 1, 2, 5, 6, 7, 8, 14, 19, 22 and 23 go further than the spec's text; I approve them at plan review or they change.

1. **A lock's `inputs` hold more than the spec names:** `{ extraction, national?, curated?, nklm?, rules }`: the sha256 of the kommune's extraction file, of the national extraction file, of the curated file as verify wrote it, the NKLM edition date, and `RULES_VERSION`. Verify reads all of them, so a resume that skipped on the spec's two alone would keep stale locks after a review session (Review Focus 2), a new Nav extraction or a new NKLM edition. Every extra input only makes resume skip less.
2. **`RULES_VERSION` has a fingerprint** (`RULES_FINGERPRINT`, sha256 over `RULE_PATHS`: every file `src/verify/verify.ts` imports, followed through its imports, except `src/net/` and `src/io/`, with `\r\n` read as `\n`). A test fails while the two do not match, and its message says to bump both. A second test fails when a new import leaves a file outside `RULE_PATHS`. Reason: Review Focus 3. A formatting-only change also asks for a bump; that costs one full verify of the local caches, a few minutes.
3. **The failed kinds are the crawler's `HostStop` kinds plus `robots` and `noPages`.** Transient, as the spec lists them: `timeout`, `network`, `serverError`. Every other kind is lasting and scored as lost recall, `visitTime` and `secondTooMany` included, since the spec names only those three as what a sleeping PC causes. The kind comes from the merged crawl report: the kommune's own site host's stop first, then the first stopped host among its pages' hosts, then `robots` when every page was refused by robots.txt, else `noPages`.
4. **A kommune "came through" when its extraction file holds at least one page.** `extract` already writes a file for every kommune it is asked for (an empty `pages` list when nothing is cached); Task 6 pins that with a test. Verify writes the `failed` lock when that list is empty and the crawl report settles every page (lists each as not fetched). Otherwise the kommune is not finished: a fetch stopped with Ctrl+C left pages in neither the cache nor the report, so it gets no lock, and `score` refuses it as never attempted.
5. **The sample ranks by hash, not by shuffle.** Each candidate unit gets `sha256("<SAMPLE_SEED>:<kommune>:<unitId>")`, and the 20 lowest are drawn. Same locks, same sample, as the spec asks. A gap PR that adds or drops a few units changes the sample only at its margin, so fewer rows wait for a new check. A candidate is a unit in one of the 39 kommuner outside the key, not waiting for its inclusion answer, with at least one accepted field.
6. **One sample check per accepted field** of each sampled unit (`kind: "sample"`, `unitId`, `field`), so a wrong value can name its field in `known-wrong.json`. About 20 units times 5 to 7 fields.
7. **`score --offline` is accepted and changes nothing,** because `score` never fetches and never purges. The "oldest cached page" date in the report is the oldest `fetchedAt` in the committed locks, which keeps the report deterministic and readable in CI. `extract --offline` and `verify --offline` carry the spec's rule (nothing expires, nothing is fetched, a miss is an error that names it). A missing discover or extraction file always stops `score` and names it, which is the spec's `--offline` fails on a cache miss.
8. **A key row counts as found when a lock unit's name matches it in any status but dropped** (accepted or review), or by address and phone as today. The spec counts a unit waiting for its inclusion answer as found; a name in review is the same kind of "found, not settled". Rule 1 (wrong values) still compares accepted values only. `matchKeyRow` gains an option for this; the golden test keeps the accepted-only form.
9. **The report's sanitiser is new code, reused later.** No PR-body renderer exists yet (PR 5 publishes). `src/score/markdown.ts` holds `codeSpan`, `codeBlock` and `cellText`; PR 5's review PR body uses the same module.
10. **The place-part rule is read literally: the place part is the text after the address's first comma.** "Storgata 1, 2. etasje, 2609 Lillehammer" therefore goes to review ("place part does not match Kartverket"). The report's part 3 counts it, and a gap PR can widen the rule with a measured reason. A Kartverket answer with no `poststed` sends the field to review too.
11. **The Kartverket cache is used by verify only.** `review` keeps its live lookup, now at the new 1-second pace: a value I type should be checked against today's register.
12. **Stage timings and scale numbers live in the cache, not the report.** Each stage CLI appends its duration to `<cache>/timings.json`; verify writes its Kartverket counts to `<cache>/verify-stats.json`; the crawler's report gains each host's crawl delay. `score --pr-body` reads them for the PR body's scale block.
13. **`verify` may now write to the repo's `data/`.** The PR 3 guard (`isRepoData`) is removed from the verify CLI; `isRepoData` stays exported for its tests until a later clean-up. `--data` stays required, so a run always names its target. A write stopped halfway can leave a `<file>.<pid>.tmp` in `data/`, so the baseline commit stages `*.json` only (Task 13).
14. **A different postcode never reaches the place-part rule.** `pickAddress` already refuses a Kartverket record whose postcode differs from the page's, so `findAddress` gives no hit, and the validity gate sends it to review as "validity: Kartverket does not know the address". Any address with no hit keeps only the text before its first comma (approved 13.11.2026): Kartverket confirmed no place, so no page text after the comma is stored. Task 2 pins this with a test. This closes the `inValue` gap for these values now: a name after the place leaves the value, so redaction takes it out of the quote too. In the rare case another candidate in the kommune stored the same street text with a hit, the cut value finds that hit and passes validity, as that candidate's own value does.
15. **On a place mismatch the review value is Kartverket's street text alone.** A review value is committed too, so unconfirmed page text after the comma (a name, a label) must not ride into it, nor into the quote through `inValue`.
16. **`resolveAddresses` runs one Kartverket lookup at a time.** Two units at one address then make one request: the second search finds the first answer in the cache. Kartverket is held to one request a second anyway, so nothing is lost.
17. **`pages/report.json` has one reader:** Task 4's `readCrawlReport(path)` in `src/fetch/fetchPages.ts`, with one schema. Fetch, extract and verify read a missing or broken report as none; `score` refuses a report that exists but does not parse, since reading it as none would turn a stopped host into "no pages fetched".
18. **`discover` takes the cache lock too,** because its purge calls the page cache's `save()`, which would race a running fetch.
19. **`extract --offline` counts a URL as a miss only when the crawl report does not list it as not fetched.** Fetch stores only pages that answered 200, so a 404, a robots refusal or a stopped host leaves a URL out of the cache by design. Read literally, the spec's rule would fail every offline extract on its first 404. A miss is a URL that is neither cached nor listed: a page the cache lost.
20. **`canSkip` never skips a failed lock.** Its kind comes from the crawl report, which is not among the lock's inputs, and rewriting a lock with no units costs nothing.
21. **Before the baseline only `RULES_FINGERPRINT` moves.** Tasks 6 and 11 change rule files and set the new fingerprint; `RULES_VERSION` stays 1 until Task 13 Step 4 writes the first locks. From then on every rule change bumps both.
22. **How `score` reads my checks.** A disagreement or sampled field in a kommune that blocks ClaudeBot, or whose value or unit page lies on one of their sites, counts as "check by hand" while it has no ruling by me. Rule 5 counts any ruling by me other than `right` as wrong, and an empty sample fails. Two checks with the same `by` for one field make `score` refuse.
23. **What `score` and `sweep` print.** A refusal names a check by its entry number in `test/pilot-checks.json`, never by unit id (unit ids hold org numbers). Discover's reasons go into the report as plain inert text. The sweep's place names come from the discover files, and from the curated files' `name` when the cache has none (a fresh clone).
24. **Units I left out never reach a lock.** `verifyKommune` on `main` skips a unit whose answer has `include: false` (`src/verify/verify.ts` line 296), so rule 2 and the ratchet never see them. No task changes this.
25. **The PR body names the report by its path in a code span, not a link.** A relative link in a PR body resolves against the PR's page and breaks.
26. **`score` refuses a pilot kommune whose own site host has a transient stop** (`timeout`, `network`, `serverError`) in the merged crawl report, even when its lock is normal (approved 13.11.2026). A host that stops halfway leaves some pages fetched and the rest missing, and nothing else refuses that lock. Only the own site host counts: another page host may serve only a few of the kommune's pages. The trade-off: a site that keeps timing out blocks its kommune until a resume gets through. `verify` prints the same kommuner with the steps to run (Task 6).

## Left for later plans

- Every gap fix the baseline shows, one gap per PR (spec decision 1).
- `verify --offline` stops a kommune whose curated file holds a website or chat URL I edited in review: those checks have no cache.
- PR 5's refresh-only check must allow a lock's `inputs` to change along with `verifiedAt` and `fetchedAt`: a weekly refresh re-extracts, so the extraction hash always moves.
- The AI fallback decision, read from part 3 of the report.
- The Om Varde page: sources, credits and the Art. 14 notice for visitors (the UI follow-up before go-live). `data/README.md` carries them for the repository until then.

## File Structure

```text
pipeline/
  src/
    pilot/list.ts            NEW  PILOT, KEY_KOMMUNER, CLAUDEBOT_BLOCKED, parseOnly, selects
    cli/discover.ts          MOD  --only pilot
    cli/fetch.ts             MOD  --only pilot, --resume, progress, run lock, merged report, timings
    cli/extract.ts           MOD  --only pilot, --offline, progress, timings
    cli/verify.ts            MOD  --only pilot, --resume, --offline, failed locks, progress, stats, timings, repo data/ allowed
    cli/data-check.ts        MOD  --publish
    cli/score.ts             NEW  npm run score [--only pilot] [--pr-body <file>] [--offline]
    cli/sweep.ts             NEW  npm run sweep [--only pilot]
    text/address.ts          MOD  placePart (the place-part rule)
    registers/kartverket.ts  MOD  poststed, cache-aware findAddress
    verify/context.ts        MOD  kartverketForm returns { value, review? }; resolveAddresses takes the cache
    verify/verify.ts         MOD  settle applies the place-part review; verifyEach progress; inputs on the lock
    verify/rules.ts          NEW  RULES_VERSION, RULES_FINGERPRINT, RULE_PATHS, rulesFingerprint, ruleGaps
    verify/resume.ts         NEW  lockInputs, canSkip, splitResume
    verify/failed.ts         NEW  failedKind, fetchSettled, failedLock, writeFailedLock, TRANSIENT_KINDS
    gates/types.ts           MOD  AddressHit gains postcode, poststed
    discover/types.ts        MOD  DiscoverReport.hosts[].delayMs (optional)
    discover/discover.ts     MOD  onKommune progress callback
    curate/write.ts          MOD  curatedText
    extract/extract.ts       MOD  --offline misses, empty scope, runExtract
    io/files.ts              MOD  sha256Of
    recall/report.ts         MOD  export STOP_TEXT
    net/types.ts             MOD  PACE_MS
    net/crawler.ts           MOD  per-server pace floor; HostLine.delayMs
    io/pageCache.ts          MOD  manifest.jsonl journal, runId on entries
    io/addressCache.ts       NEW  AddressCache (30-day, hashed file names, offline)
    io/runLock.ts            NEW  holdCache, CacheBusyError
    io/offline.ts            NEW  OfflineMissError, offlineGet
    io/timings.ts            NEW  recordTiming, readTimings
    fetch/fetchPages.ts      MOD  onPage callback; resumeFilter; mergeCrawlReports; readCrawlReport; urlsByKommune
    fetch/progress.ts        NEW  KommuneProgress
    schema/lock.ts           MOD  LockInputs, FAILED_KINDS, LockFailure, LockFile.inputs, LockFile.failed
    check/dataCheck.ts       MOD  checkData(root, { publish })
    answerKey/score.ts       MOD  matchKeyRow option { anyStatus }
    score/checks.ts          NEW  PilotChecks, KnownWrong, readers, ratchet, checksAgree
    score/sample.ts          NEW  SAMPLE_SEED, SAMPLE_SIZE, drawSample
    score/pilot.ts           NEW  scorePilot, ScoreRefusal, PilotScore
    score/markdown.ts        NEW  codeSpan, codeBlock, cellText
    score/render.ts          NEW  renderReport, renderPrBody, PR_BODY_LIMIT
    score/scale.ts           NEW  ScaleNumbers, HostScale (Task 9); scaleNumbers (Task 10)
    score/load.ts            NEW  loadPilotInput, loadScaleInput, ScoreLoadError
    score/todo.ts            NEW  todoItems (--todo), seedBlocked (--seed-blocked)
    score/sweep.ts           NEW  sweepLocks, formatSweep
    text/names.ts            MOD  export isKnownWord
  schema/lock.schema.json    MOD  regenerated (npm run schema)
  package.json               MOD  score and sweep scripts
  test/
    known-wrong.json         NEW  { "entries": [] }
    pilot-checks.json        NEW  { "checks": [] }
    golden.test.ts           MOD  the ratchet
    helpers.ts               MOD  testInputs()
    networkBoundary.test.ts  MOD  scans src/score/, src/pilot/ and the new files
    verify, kartverket, context, crawler, pageCache, schema, dataCheck, curatedWrite, queue,
    session, score, extract, discover .test.ts; reviewHelpers.ts                        MOD  new shapes
    verifyHelpers.ts, pilotFixture.ts                                                    NEW  shared fixtures
    pilotList.test.ts, placePart.test.ts, addressCache.test.ts, pace.test.ts, journal.test.ts,
    resumeFetch.test.ts, runLock.test.ts, progress.test.ts, timings.test.ts, rules.test.ts,
    resumeVerify.test.ts, failed.test.ts, offline.test.ts, checks.test.ts, publish.test.ts,
    sample.test.ts, pilotScore.test.ts, markdown.test.ts, report.test.ts, scale.test.ts,
    scoreLoad.test.ts, todo.test.ts, sweep.test.ts                                       NEW
  README.md                  MOD  "Pilot run" section; score, sweep, --resume, --offline
data/
  README.md                  MOD  sources and licences, Art. 14 notice
  lock/*.json, curated/*.json      the baseline (Task 13)
docs/pilot/pilot-report.md         the baseline report (Task 13)
```

## Interfaces between tasks

A task's implementer sees only its own task. These are the names and types neighbouring tasks rely on. A task may add private helpers; it may not rename these.

```ts
// src/pilot/list.ts (Task 1)
export const PILOT: readonly string[]            // "0301" and the 46 KLASS 131 codes 3401..3454 on 28.10.2026, sorted
export const KEY_KOMMUNER: readonly string[]     // ["0301","3403","3405","3407","3411","3412","3413","3420"]
export const CLAUDEBOT_BLOCKED: readonly string[] // ["3403","3412","3413","3414","3415","3417","3419"]
export function parseOnly(raw: string | undefined): string[] | undefined // "pilot" expands; [] for none; undefined when invalid
export function selects(only: readonly string[], kommune: string): boolean // true for [] or a matching prefix

// src/registers/kartverket.ts (Tasks 2, 3)
export type AddressRecord = { addressId: string; kommune: string; text: string; postcode?: string; poststed?: string }
export async function findAddress(get: Get, wanted: string, kommune: string, cache?: AddressCache): Promise<AddressHit | undefined>
export class AddressLookupError extends Error {}   // Task 3: findAddress throws it when a cache is given and the host is stopped
// src/gates/types.ts (Task 2)
export type AddressHit = { addressId: string; kommune: string; text?: string; postcode?: string; poststed?: string }

// src/text/address.ts (Task 2)
export const PLACE_MISMATCH = "place part does not match Kartverket"
export function placePart(value: string, postcode: string | undefined, poststed: string | undefined): { place: string } | { review: string } | undefined
// undefined: the value has no comma (nothing to keep); place: ", <postcode> <page spelling>"
// src/verify/context.ts (Task 2)
export function kartverketForm(value: string, hit: AddressHit): { value: string; review?: string } // review: value is Kartverket's street text alone

// src/io/addressCache.ts (Task 3)
export const ADDRESS_MAX_AGE_DAYS = 30
export class AddressCache {
  constructor(dir: string, options?: { offline?: boolean; dryRun?: boolean; now?: () => number })
  lookups: number; hits: number
  read(search: string, kommune: string): AddressRecord[] | undefined   // counts a lookup; a hit when fresh (or offline)
  write(search: string, kommune: string, records: readonly AddressRecord[]): void
  purge(nowMs: number): number                                         // removes answers over MAX_AGE_DAYS (90)
}
// src/io/offline.ts (Task 3)
export class OfflineMissError extends Error { readonly what: string }   // message: "offline: not in the cache: <what>"
export const offlineGet: Get                                           // rejects with OfflineMissError(url)
// src/verify/context.ts (Task 3)
export async function resolveAddresses(get: Get, addresses: Iterable<string>, kommune: string, cache?: AddressCache): Promise<...same as today> // one lookup at a time
// src/discover/types.ts (Task 3): DiscoverReport.hosts[] gains an optional delayMs
// src/net/types.ts (Task 3)
export const PACE_MS: Readonly<Record<string, number>>                  // { "kartverket.no": 1_000 }, keyed by registrable domain
// src/net/crawler.ts (Tasks 3, 4)
export type HostLine = { host: string; requests: number; delayMs: number; stopped?: HostStop }

// src/io/pageCache.ts (Task 4)
export const ManifestEntry  // gains runId: z.string().regex(/^[0-9a-z-]{8,40}$/).optional()
export function readRunId(dir: string): string | undefined
export function writeRunId(dir: string, runId: string): void
class PageCache { constructor(dir, options?: { dryRun?: boolean; runId?: string }); /* put appends to manifest.jsonl; save writes manifest.json and empties the journal */ }
// src/io/runLock.ts (Task 4)
export const RUN_LOCK = "run.lock"
export class CacheBusyError extends Error {}
export function pidAlive(pid: number): boolean
export function holdCache(dir: string, isAlive?: (pid: number) => boolean): { release: () => void } // run.lock with the pid; a dead pid is taken over
// src/fetch/fetchPages.ts (Task 4)
export function resumeFilter(urls: readonly string[], cache: PageCache, runId: string, nowMs: number): string[] // drops same-run pages and pages under 24 h old
export function mergeCrawlReports(previous: CrawlReport | undefined, current: CrawlReport, tried?: readonly string[]): CrawlReport
// requests add up per host and the current run's stop wins; current wins per URL; the previous run's notFetched line stays only for a URL the current run did not try
// (tried defaults to the current run's own notFetched URLs)
export function readCrawlReport(path: string): CrawlReport | undefined   // the only reader of <cache>/pages/report.json
export function urlsByKommune(kommuner: readonly KommuneDiscovery[], limit?: number): Map<string, string[]>
export async function fetchPages(get: Get, cache: PageCache, urls: readonly string[], onPage?: (url: string) => void): Promise<FetchSummary>
// src/fetch/progress.ts (Task 4)
export class KommuneProgress { constructor(byKommune: ReadonlyMap<string, readonly string[]>, names: ReadonlyMap<string, string>, print: (line: string) => void); page(url: string): void; heartbeat(): void }
// src/io/timings.ts (Task 4)
export function recordTiming(cacheDir: string, stage: string, ms: number): void   // merges into <cache>/timings.json
export function readTimings(cacheDir: string): Record<string, number>

// src/schema/lock.ts (Task 5)
export const Sha256 = z.string().regex(/^sha256:[0-9a-f]{64}$/)
export const LockInputs = z.strictObject({ extraction: Sha256, national: Sha256.optional(), curated: Sha256.optional(), nklm: CalendarDate.optional(), rules: z.number().int().positive() })
export const FAILED_KINDS = [...HOST_STOPS, "robots", "noPages"] as const
export const LockFailure = z.strictObject({ kind: z.enum(FAILED_KINDS), reason: NonBlank })
// LockFile gains inputs: LockInputs (required) and failed: LockFailure.optional(); a failed lock has units: []
// src/verify/rules.ts (Task 5)
export const RULES_VERSION: number          // 1
export const RULES_FINGERPRINT: string      // "sha256:..."
export const RULE_PATHS: readonly string[]  // every file verify.ts imports outside src/net/ and src/io/: src/adapters/, src/registers/, src/schema/, src/gates/, src/verify/, src/curate/, src/text/ and more (Task 5)
export function rulesFingerprint(root: string): string
export function ruleGaps(root: string): string[] // verify.ts's import closure minus src/net/, src/io/ and RULE_PATHS; [] is the test
// src/verify/verify.ts (Task 5): VerifyInput gains inputs?: LockInputs
// test/helpers.ts (Task 5)
export function testInputs(): LockInputs     // { extraction: "sha256:" + "0".repeat(64), rules: 1 }

// src/verify/resume.ts (Task 6)
export function sha256File(path: string): string | undefined                  // "sha256:<hex>", undefined when missing
export function lockInputs(o: { cacheDir: string; dataDir: string; kommune: string; nklmDate?: string }): LockInputs
export function canSkip(dataDir: string, kommune: string, inputs: LockInputs): boolean // the lock parses, is not failed, and its inputs deep-equal
export function splitResume<K extends { kommune: string }>(kommuner: readonly K[], o: { cacheDir: string; dataDir: string; nklmDate?: string }): { todo: K[]; skipped: K[] }
// src/verify/failed.ts (Task 6)
export const TRANSIENT_KINDS: readonly FailedKind[]  // ["timeout","network","serverError"]
export function failedKind(k: KommuneDiscovery, report: CrawlReport | undefined): LockFailure
export function fetchSettled(k: KommuneDiscovery, report: CrawlReport | undefined): boolean // every page listed as not fetched; verify writes a failed lock only then
export function failedLock(kommune: string, failure: LockFailure, inputs: LockInputs): LockFile
export type FailedKind
export async function writeFailedLock(dataDir, k, report, inputs, io?): Promise<LockFailure>
export function failedCounts(k: { kommune: string; name: string }): VerifyCounts
// src/io/files.ts (Task 6)
export function sha256Of(data: string | Uint8Array): string   // "sha256:<hex>"
// src/curate/write.ts (Task 6)
export function curatedText(file: CuratedFile): string        // the exact text writeCuratedFile saves
// src/extract/extract.ts (Task 6)
export type ExtractOptions = { offline?: boolean; notFetched?: ReadonlySet<string> }
export function runExtract(o: ExtractRun): { purged: number | undefined; summaries; failed; misses } // extractScopes also returns misses
// src/verify/verify.ts (Task 6)
export async function verifyAndWrite(dataDir: string, input: VerifyInput, inputs: Omit<LockInputs, "curated">, io?: RenameIo): Promise<VerifyCounts>
export async function verifyEach<K extends { kommune: string }>(kommuner: readonly K[], run: (k: K) => Promise<VerifyCounts | undefined>, onDone?: (k: K, at: number, of: number) => void): Promise<...same as today>
// VerifyInput gains addressCache?: AddressCache; unfinishedReason prints an OfflineMissError's what and an AddressLookupError's message

// src/score/checks.ts (Task 7)
export const RULINGS = ["keyStale", "pipelineWrong", "unclear", "right"] as const
export const PilotCheck = z.strictObject({ kind: z.enum(["disagreement","sample"]), keyId: z.number().int().positive().optional(), unitId: UnitId, field: FieldName, ruling: z.enum(RULINGS), note: NonBlank.max(300), by: z.enum(["proposed","me"]) })
export const PilotChecks = z.strictObject({ checks: z.array(PilotCheck) })
export const KnownWrongEntry = z.strictObject({ kind: z.enum(["disagreement","sample"]), keyId: z.number().int().positive().optional(), unitId: UnitId, field: FieldName })
export const KnownWrong = z.strictObject({ entries: z.array(KnownWrongEntry) })
export function readPilotChecks(path: string): PilotChecks
export function readKnownWrong(path: string): KnownWrong
export function ratchet(wrong: readonly Wrong[], known: KnownWrong): { unlisted: Wrong[]; gone: KnownWrongEntry[] } // disagreement entries only
export function checksAgree(checks: PilotChecks, known: KnownWrong): string[]   // problems; [] when every pipelineWrong by me is listed and nothing else is
export function keyIsWrong(checks: PilotChecks, w: Wrong): boolean             // a disagreement I ruled keyStale or right; the golden test lets it pass
export class ChecksFileError extends Error {}   // readPilotChecks and readKnownWrong throw it on a missing or invalid file
export function goneSamples(known: KnownWrong, locks: readonly LockFile[]): KnownWrongEntry[] // sample entries whose field is no longer accepted
// src/answerKey/score.ts (Task 7): Score gains badgeWrong
// src/check/dataCheck.ts (Task 7)
export function checkData(root: string, options?: { publish?: boolean }): string[]
// src/answerKey/score.ts (Task 7)
export function matchKeyRow(unit: LockUnit, rows: readonly KeyRow[], options?: { anyStatus?: boolean }): KeyRow | undefined

// src/score/sample.ts (Task 8)
export const SAMPLE_SEED = "varde-pilot-2026-11-13"
export const SAMPLE_SIZE = 20
export function drawSample(locks: readonly LockFile[], curated: readonly CuratedFile[], outside: readonly string[]): { kommune: string; unitId: string }[]
// src/score/pilot.ts (Task 8)
export type ScoreRefusal = { refused: true; problems: string[] }
export type PilotScore = { refused: false; /* see Task 8 */ }
export function scorePilot(input: PilotInput): PilotScore | ScoreRefusal
// PilotInput.blockedHosts: readonly string[]: the blocked kommuner's sites in siteHost form (Task 10 fills it from discover);
// a disagreement or sampled field whose value or unit page lies there is byHand, whatever its kommune
// also exported (Task 8): PilotInput, PageCount, Check, Checks, Ruling, RulingName, RuleLine, RuleStatus, INCLUSION_SECONDS,
// LOST_STAGES, reasonParts; sample.ts: compareText, curatedIds, waitsForInclusion; recall/report.ts: STOP_TEXT

// src/score/markdown.ts (Task 9)
export function codeSpan(text: string): string
export function codeBlock(text: string): string
export function cellText(text: string): string
// src/score/render.ts (Task 9)
export const PR_BODY_LIMIT = 60_000
export function renderReport(s: PilotScore): string
export function renderPrBody(s: PilotScore, scale: ScaleNumbers | undefined, reportPath: string): string
export class PrBodyTooLongError extends Error {}
// src/score/scale.ts (types in Task 9, because renderPrBody takes them; scaleNumbers in Task 10)
export type HostScale = { host: string; requests: number; delayMs: number; estimateMs: number }
export type ScaleNumbers = { hosts: HostScale[]; slowest?: HostScale; overJobLimit: string[]; lockBytes: number; kartverket?: { lookups: number; hits: number }; timings: Record<string, number> }
export const JOB_LIMIT_MS = 6 * 3_600_000   // plus formatDuration, groupDigits
export type ScaleInput = { report?: CrawlReport; lockBytes: number; stats?: { lookups: number; hits: number }; timings: Record<string, number> } // Task 10
export function scaleNumbers(o: ScaleInput): ScaleNumbers                                                                                      // Task 10
// src/score/load.ts (Task 10)
export const REPORT_PATH = "docs/pilot/pilot-report.md"
export function loadPilotInput(root: string, cacheDir: string, only: readonly string[]): PilotInput   // plus loadScaleInput, testFile, ScoreLoadError
export function transientStops(input: PilotInput): string[]   // own site host stopped on timeout, network or serverError; score refuses (Decided 26)
// src/score/todo.ts (Task 10)
export const CHECK_BY_HAND = "check by hand"
export function todoItems(s: PilotScore, blocked: readonly string[]): TodoItem[]                      // score --todo <file> writes { blockedHosts: string[]; items: TodoItem[] }
export function seedBlocked(s: PilotScore, checks: Checks, blocked: readonly string[]): { checks: Checks; added: number } // score --seed-blocked

// src/text/names.ts (Task 11)
export function isKnownWord(word: string, places: readonly string[]): boolean
// src/score/sweep.ts (Task 11)
export type SweepLine = { kommune: string; unitId: string; field: string; where: "value" | "role" | "quote"; word: string }
export function sweepLocks(locks: readonly LockFile[], places: readonly string[]): SweepLine[]
export function formatSweep(lines: readonly SweepLine[]): string
// also exported (Task 11): SWEEP_HEADER, SweepError, sweepPlaces, runSweep
```

## Tasks

| # | Task | Depends on |
|---|---|---|
| 1 | The pilot list and `--only pilot` | none |
| 2 | The address place part | none |
| 3 | Kartverket pace, cache and `--offline` lookups | 2 |
| 4 | The page-cache journal, `fetch --resume`, progress, the cache lock | 1, 3 |
| 5 | Lock schema: `inputs`, `failed`, `RULES_VERSION` | 2, 3 |
| 6 | Verify: `--resume`, failed locks, `--offline`, progress, the repo's `data/` | 3, 4, 5 |
| 7 | The ratchet: known wrong values, rulings, `data:check --publish` | 1, 5 |
| 8 | Scoring the pilot | 1, 6, 7 |
| 9 | The report and the PR-body summary | 8 |
| 10 | The `score` command and the scale numbers | 4, 6, 9 |
| 11 | The name sweep | 1, 5 |
| 12 | Docs: the pilot run, sources and licences, the notice | 10, 11 |
| 13 | Full suites, the pilot run, the checks, the baseline PR | all |


### Task 1: The pilot list and `--only pilot`

One source file holds the 47 pilot kommuner, the 8 the answer key covers and the 7 that block ClaudeBot. `parseOnly` replaces the four copies of the `--only` parsing in the stage CLIs, and `selects` replaces their four copies of the prefix filter. `discover` still refuses an empty selection. The README's "Pilot run" section is Task 12's.

**Files:**
- Create: `pipeline/src/pilot/list.ts`
- Modify: `pipeline/src/cli/discover.ts` (lines 1-3, 15, 25-37), `pipeline/src/cli/fetch.ts` (lines 2, 15, 26-37, 43-45), `pipeline/src/cli/extract.ts` (lines 2, 18, 28-35, 44), `pipeline/src/cli/verify.ts` (lines 2, 27-28, 40-47, 104-106)
- Test: `pipeline/test/pilotList.test.ts` (new)

**Interfaces:**
- Consumes: `parseCodesAt` (`src/registers/klass.ts`), `KOMMUNE_NUMBERS` (`src/answerKey/freeze.ts`), both in the test only.
- Produces (`src/pilot/list.ts`):
  - `PILOT: readonly string[]`: "0301" and the 46 KLASS 131 codes 3401..3454 on 28.10.2026, sorted.
  - `KEY_KOMMUNER: readonly string[]`: `["0301","3403","3405","3407","3411","3412","3413","3420"]`.
  - `CLAUDEBOT_BLOCKED: readonly string[]`: `["3403","3412","3413","3414","3415","3417","3419"]`.
  - `parseOnly(raw: string | undefined): string[] | undefined`: "pilot" expands; `[]` for none; `undefined` when invalid.
  - `selects(only: readonly string[], kommune: string): boolean`: true for `[]` or a matching prefix.

- [ ] **Step 1: Write the failing test**

The KLASS fixture `test/fixtures/klass/codes-at-2026-11-03.json` (real public data, PR 2) holds 0301, the 46 Innlandet codes and 9999, which `parseCodesAt` drops. Its date is after 28.10.2026, so it equals `PILOT` unless KLASS changed a kommune in between. That makes it the check on the hand-copied list.

Create `pipeline/test/pilotList.test.ts`:

```ts
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { KOMMUNE_NUMBERS } from "../src/answerKey/freeze.ts"
import { CLAUDEBOT_BLOCKED, KEY_KOMMUNER, PILOT, parseOnly, selects } from "../src/pilot/list.ts"
import { parseCodesAt } from "../src/registers/klass.ts"

const sortedUnique = (list: readonly string[]) => [...new Set(list)].sort()

describe("the pilot list", () => {
	it("holds Oslo and the 46 Innlandet kommuner, sorted, each once", () => {
		expect(PILOT).toHaveLength(47)
		expect([...PILOT]).toEqual(sortedUnique(PILOT))
		expect(PILOT[0]).toBe("0301")
		expect(PILOT.filter((k) => /^34\d{2}$/.test(k))).toHaveLength(46)
		expect(PILOT.every((k) => /^\d{4}$/.test(k))).toBe(true)
	})

	it("equals the kommuner in the KLASS fixture of 03.11.2026", () => {
		const fixture = JSON.parse(
			readFileSync(new URL("./fixtures/klass/codes-at-2026-11-03.json", import.meta.url), "utf8")
		)
		const klass = parseCodesAt(fixture) ?? []
		expect([...PILOT]).toEqual(klass.map((k) => k.code).sort())
	})

	it("holds the 8 key kommuner and the 7 that block ClaudeBot, each a part of the pilot", () => {
		for (const list of [KEY_KOMMUNER, CLAUDEBOT_BLOCKED]) {
			expect([...list]).toEqual(sortedUnique(list))
			expect(list.every((k) => PILOT.includes(k))).toBe(true)
		}
		expect(KEY_KOMMUNER).toHaveLength(8)
		expect(CLAUDEBOT_BLOCKED).toHaveLength(7)
		// The key's own table of kommune numbers is the source of the 8.
		expect([...KEY_KOMMUNER]).toEqual(Object.values(KOMMUNE_NUMBERS).sort())
		// Innlandet's Våler (3419). Østfold's Våler (3114) has no block and is not in the pilot.
		expect(CLAUDEBOT_BLOCKED).toContain("3419")
		expect(PILOT).not.toContain("3114")
	})

	it("cannot be changed while a run reads it", () => {
		for (const list of [PILOT, KEY_KOMMUNER, CLAUDEBOT_BLOCKED]) expect(Object.isFrozen(list)).toBe(true)
	})
})

describe("parseOnly", () => {
	it("gives an empty selection when --only is missing or empty", () => {
		expect(parseOnly(undefined)).toEqual([])
		expect(parseOnly("")).toEqual([])
		expect(parseOnly(" , ")).toEqual([])
	})

	it("expands pilot to the 47 kommuner", () => {
		expect(parseOnly("pilot")).toEqual([...PILOT])
	})

	it("takes pilot mixed with codes and prefixes, and counts each entry once", () => {
		expect(parseOnly("pilot,0301")).toEqual([...PILOT])
		expect(parseOnly("pilot,03")).toEqual([...PILOT, "03"])
		expect(parseOnly(" 34 , 3405,0301,0301")).toEqual(["34", "3405", "0301"])
	})

	it("refuses anything that is not a kommune number, a county prefix or pilot", () => {
		for (const raw of ["3", "340", "34055", "abc", "Pilot", "pilot,3", "34;0301", "34 05"]) {
			expect(parseOnly(raw), raw).toBeUndefined()
		}
	})
})

describe("selects", () => {
	it("takes every kommune for an empty selection, else a kommune that starts with an entry", () => {
		expect(selects([], "3405")).toBe(true)
		expect(selects(["34"], "3405")).toBe(true)
		expect(selects(["0301"], "3405")).toBe(false)
		expect(selects(PILOT, "3301")).toBe(false)
		expect(selects(PILOT, "3454")).toBe(true)
	})
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run test/pilotList.test.ts`
Expected: FAIL, the module `../src/pilot/list.ts` does not exist.

- [ ] **Step 3: Create `src/pilot/list.ts`**

The codes are copied from the plan (KLASS 131 codesAt 2026-10-28, read 13.11.2026). The date in the comment is that reading's date, not today's.

```ts
// The pilot (spec, "PR 4: pilot run", "The pilot list"): Oslo and the 46 Innlandet kommuner, 47
// in all. The Innlandet codes are KLASS classification 131 codesAt 2026-10-28, read 13.11.2026.
// A kommune change in KLASS after that date changes this list by hand, in its own PR.
export const PILOT: readonly string[] = Object.freeze([
	"0301",
	"3401",
	"3403",
	"3405",
	"3407",
	"3411",
	"3412",
	"3413",
	"3414",
	"3415",
	"3416",
	"3417",
	"3418",
	"3419",
	"3420",
	"3421",
	"3422",
	"3423",
	"3424",
	"3425",
	"3426",
	"3427",
	"3428",
	"3429",
	"3430",
	"3431",
	"3432",
	"3433",
	"3434",
	"3435",
	"3436",
	"3437",
	"3438",
	"3439",
	"3440",
	"3441",
	"3442",
	"3443",
	"3446",
	"3447",
	"3448",
	"3449",
	"3450",
	"3451",
	"3452",
	"3453",
	"3454",
])

// The 8 kommuner the answer key covers. Pass-mark rules 1, 3 and 4 are scored on these; rule 5
// samples the other 39.
export const KEY_KOMMUNER: readonly string[] = Object.freeze([
	"0301",
	"3403",
	"3405",
	"3407",
	"3411",
	"3412",
	"3413",
	"3420",
])

// The pilot kommuner whose robots.txt blocks ClaudeBot (checked 13.11.2026): Hamar, Løten, Stange,
// Nord-Odal, Sør-Odal, Grue and Våler (Innlandet's 3419). Their page text, extraction files, lock
// values and quotes never go to an AI company.
export const CLAUDEBOT_BLOCKED: readonly string[] = Object.freeze([
	"3403",
	"3412",
	"3413",
	"3414",
	"3415",
	"3417",
	"3419",
])

// A kommune number (four digits) or a county prefix (two digits).
const SELECTION = /^\d{2}(?:\d{2})?$/

// --only as every stage reads it: kommune numbers and county prefixes separated by commas, and the
// word "pilot" for the 47 above. Entries may be mixed and repeated ("pilot,0301"); each counts
// once, in the place it first stood. No --only gives [] (every kommune). undefined means an entry
// is none of these, and the command prints its usage.
export function parseOnly(raw: string | undefined): string[] | undefined {
	const entries = (raw ?? "")
		.split(",")
		.map((p) => p.trim())
		.filter((p) => p !== "")
	const out: string[] = []
	for (const entry of entries) {
		if (entry === "pilot") out.push(...PILOT)
		else if (SELECTION.test(entry)) out.push(entry)
		else return undefined
	}
	return [...new Set(out)]
}

// Whether a selection takes this kommune. An empty selection takes every kommune.
export function selects(only: readonly string[], kommune: string): boolean {
	return only.length === 0 || only.some((p) => kommune.startsWith(p))
}
```

- [ ] **Step 4: Run the test to see it pass**

Run: `npx vitest run test/pilotList.test.ts`
Expected: PASS.

- [ ] **Step 5: Use `parseOnly` and `selects` in the four stage CLIs**

`src/cli/discover.ts`. Line 3, before:

```ts
//   node src/cli/discover.ts --only 34,0301 [--date 2026-11-03] [--cache <dir>] [--dry-run]
```

After:

```ts
//   node src/cli/discover.ts --only pilot|34,0301 [--date 2026-11-03] [--cache <dir>] [--dry-run]
```

Add `import { parseOnly } from "../pilot/list.ts"` to the imports. Line 15, before:

```ts
const USAGE = "usage: discover --only 34,0301 [--date YYYY-MM-DD] [--cache <dir>] [--dry-run]"
```

After:

```ts
const USAGE =
	"usage: discover --only pilot|34,0301 [--date YYYY-MM-DD] [--cache <dir>] [--dry-run]"
```

Lines 25-37, before:

```ts
const only = (values.only ?? "")
	.split(",")
	.map((p) => p.trim())
	.filter((p) => p !== "")
const date = values.date ?? isoSeconds(Date.now()).slice(0, 10)
if (
	only.length === 0 ||
	only.some((p) => !/^\d{2}(?:\d{2})?$/.test(p)) ||
	!/^\d{4}-\d{2}-\d{2}$/.test(date)
) {
	console.error(USAGE)
	process.exit(2)
}
```

After:

```ts
const only = parseOnly(values.only)
const date = values.date ?? isoSeconds(Date.now()).slice(0, 10)
if (only === undefined || only.length === 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
	console.error(USAGE)
	process.exit(2)
}
```

`src/cli/fetch.ts`. Line 2, before:

```ts
//   node src/cli/fetch.ts [--only 3405,0301] [--national] [--limit 3] [--cache <dir>] [--dry-run]
```

After:

```ts
//   node src/cli/fetch.ts [--only pilot|3405,0301] [--national] [--limit 3] [--cache <dir>] [--dry-run]
```

Add `import { parseOnly, selects } from "../pilot/list.ts"`. Line 15, before:

```ts
const USAGE = "usage: fetch [--only 3405,0301] [--national] [--limit N] [--cache <dir>] [--dry-run]"
```

After:

```ts
const USAGE =
	"usage: fetch [--only pilot|3405,0301] [--national] [--limit N] [--cache <dir>] [--dry-run]"
```

Lines 26-37, before:

```ts
const only = (values.only ?? "")
	.split(",")
	.map((p) => p.trim())
	.filter((p) => p !== "")
const limit = values.limit === undefined ? undefined : Number(values.limit)
if (
	only.some((p) => !/^\d{2}(?:\d{2})?$/.test(p)) ||
	(limit !== undefined && (!Number.isInteger(limit) || limit < 1))
) {
	console.error(USAGE)
	process.exit(2)
}
```

After:

```ts
const only = parseOnly(values.only)
const limit = values.limit === undefined ? undefined : Number(values.limit)
if (only === undefined || (limit !== undefined && (!Number.isInteger(limit) || limit < 1))) {
	console.error(USAGE)
	process.exit(2)
}
```

Lines 43-45, before:

```ts
	const kommuner = found.kommuner.filter(
		(k) => only.length === 0 || only.some((p) => k.kommune.startsWith(p))
	)
```

After:

```ts
	const kommuner = found.kommuner.filter((k) => selects(only, k.kommune))
```

`src/cli/extract.ts`. Line 2, before:

```ts
//   node src/cli/extract.ts [--only 3405,0301] [--national] [--cache <dir>] [--dry-run]
```

After:

```ts
//   node src/cli/extract.ts [--only pilot|3405,0301] [--national] [--cache <dir>] [--dry-run]
```

Add `import { parseOnly, selects } from "../pilot/list.ts"`. Line 18, before:

```ts
const USAGE = "usage: extract [--only 3405,0301] [--national] [--cache <dir>] [--dry-run]"
```

After:

```ts
const USAGE = "usage: extract [--only pilot|3405,0301] [--national] [--cache <dir>] [--dry-run]"
```

Lines 28-35, before:

```ts
const only = (values.only ?? "")
	.split(",")
	.map((p) => p.trim())
	.filter((p) => p !== "")
if (only.some((p) => !/^\d{2}(?:\d{2})?$/.test(p))) {
	console.error(USAGE)
	process.exit(2)
}
```

After:

```ts
const only = parseOnly(values.only)
if (only === undefined) {
	console.error(USAGE)
	process.exit(2)
}
```

Line 44, before:

```ts
		.filter((k) => only.length === 0 || only.some((p) => k.kommune.startsWith(p)))
```

After:

```ts
		.filter((k) => selects(only, k.kommune))
```

`src/cli/verify.ts`. Line 2, before:

```ts
//   node src/cli/verify.ts --data <dir> [--only 3405] [--cache <dir>] [--nklm-file <path>] [--nklm-fetch] [--dry-run]
```

After:

```ts
//   node src/cli/verify.ts --data <dir> [--only pilot|3405] [--cache <dir>] [--nklm-file <path>] [--nklm-fetch] [--dry-run]
```

Add `import { parseOnly, selects } from "../pilot/list.ts"`. Lines 27-28, before:

```ts
const USAGE =
	"usage: verify --data <dir> [--only 3405,0301] [--cache <dir>] [--nklm-file <path>] [--nklm-fetch] [--dry-run]"
```

After:

```ts
const USAGE =
	"usage: verify --data <dir> [--only pilot|3405,0301] [--cache <dir>] [--nklm-file <path>] [--nklm-fetch] [--dry-run]"
```

Lines 40-47, before:

```ts
const only = (values.only ?? "")
	.split(",")
	.map((p) => p.trim())
	.filter((p) => p !== "")
if (values.data === undefined || only.some((p) => !/^\d{2}(?:\d{2})?$/.test(p))) {
	console.error(USAGE)
	process.exit(2)
}
```

After:

```ts
const only = parseOnly(values.only)
if (values.data === undefined || only === undefined) {
	console.error(USAGE)
	process.exit(2)
}
```

Lines 104-106, before:

```ts
	const kommuner = found.kommuner.filter(
		(k) => only.length === 0 || only.some((p) => k.kommune.startsWith(p))
	)
```

After:

```ts
	const kommuner = found.kommuner.filter((k) => selects(only, k.kommune))
```

`process.exit` returns `never`, so `only` is `string[]` after each guard, inside the callbacks too.

- [ ] **Step 6: Check the usage path of each CLI**

Each of these exits before it builds a crawler or reads the cache, so nothing touches the network:

```bash
node src/cli/discover.ts; echo "exit $?"
node src/cli/discover.ts --only 3; echo "exit $?"
node src/cli/fetch.ts --only Pilot; echo "exit $?"
node src/cli/extract.ts --only 34055; echo "exit $?"
node src/cli/verify.ts --data /tmp/x --only pilot,3; echo "exit $?"
```

Expected: each prints its usage line (with `pilot` in it) and `exit 2`.

- [ ] **Step 7: Show it red once**

Remove `"3454"` from `PILOT`. Run `npx vitest run test/pilotList.test.ts`: FAIL on "holds Oslo and the 46 Innlandet kommuner" (46 entries) and on "equals the kommuner in the KLASS fixture". Restore, run: PASS. Then in `parseOnly` change `return [...new Set(out)]` to `return out`. Run it: FAIL on "takes pilot mixed with codes and prefixes" (48 entries for "pilot,0301"). Restore, run: PASS. Note both for the PR body.

- [ ] **Step 8: Format, types, lint, tests, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm run lint && npm test
git add src/pilot/list.ts src/cli/discover.ts src/cli/fetch.ts src/cli/extract.ts src/cli/verify.ts test/pilotList.test.ts
git commit -m "feat(pipeline): add the pilot list and --only pilot to every stage"
```

---

### Task 2: The address place part

Verify stores Kartverket's street text and then the page's text after the first comma, so a name or a label after the place rides into the value ("2609 Lillehammer Kari Nordmann"), and `inValue` in `gates/run.ts` then spares it in the quote. The new rule (plan Decided 10): the place part is the text after the first comma, kept only when it starts with Kartverket's postcode, whitespace and Kartverket's poststed (compared after `normaliseText`), with the page's spelling kept and every word after the poststed cut. Anything else sends the field to review with `PLACE_MISMATCH`.

**What the value holds in review:** Kartverket's street text alone, without the page's place part. Reason: a review value is committed too, and unconfirmed page text in it ("2999 Eksempelby Kari Nordmann" under a poststed-less answer) would keep a name in both the value and, through `inValue`, the quote.

**A different postcode never reaches this rule.** `pickAddress` already refuses a record whose postcode differs from the page's, so `findAddress` gives no hit, `settle` keeps only the text before the value's first comma (as for every address with no hit, plan Decided 14), and the validity gate sends it to review with "validity: Kartverket does not know the address". The test pins that, a trailing name included. The place-part rule handles the postcode only when the page's first word after the comma is not the postcode Kartverket matched (a floor line, a place with no postcode).

**Files:**
- Modify: `pipeline/src/text/address.ts` (append after line 32), `pipeline/src/registers/kartverket.ts` (lines 15, 17-26, 28-40, 58), `pipeline/src/gates/types.ts` (lines 30-31), `pipeline/src/verify/context.ts` (lines 1-8 imports, 111-116), `pipeline/src/verify/verify.ts` (lines 124-137, 164-165, 246)
- Test: `pipeline/test/placePart.test.ts` (new), `pipeline/test/verify.test.ts` (lines 82-86, plus a new describe block), `pipeline/test/kartverket.test.ts` (lines 36, 41, 73-77, 96-100, 109-113, plus a new describe block), `pipeline/test/context.test.ts` (lines 96-121)

**Interfaces:**
- Consumes: `normaliseText` (`src/text/normalise.ts`), `splitAddress`, `streetKey`, `toReview` and `runGates` as they stand.
- Produces:
  - `src/text/address.ts`: `PLACE_MISMATCH = "place part does not match Kartverket"`; `placePart(value: string, postcode: string | undefined, poststed: string | undefined): { place: string } | { review: string } | undefined` (`undefined`: no comma; `place`: `", <postcode> <page spelling>"`).
  - `src/registers/kartverket.ts`: `AddressRecord = { addressId: string; kommune: string; text: string; postcode?: string; poststed?: string }`; `pickAddress` and `findAddress` return `postcode` and `poststed` when Kartverket sends them.
  - `src/gates/types.ts`: `AddressHit = { addressId: string; kommune: string; text?: string; postcode?: string; poststed?: string }`.
  - `src/verify/context.ts`: `kartverketForm(value: string, hit: AddressHit): { value: string; review?: string }`.

- [ ] **Step 1: Write the failing unit tests**

Create `pipeline/test/placePart.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { PLACE_MISMATCH, placePart } from "../src/text/address.ts"
import { kartverketForm } from "../src/verify/context.ts"

const mismatch = { review: PLACE_MISMATCH }

describe("placePart", () => {
	it("keeps the postcode and the poststed in the page's own spelling", () => {
		expect(placePart("Storgata 3, 2999 Eksempelby", "2999", "EKSEMPELBY")).toEqual({
			place: ", 2999 Eksempelby",
		})
		expect(placePart("Storgata 3, 2999 EKSEMPELBY", "2999", "EKSEMPELBY")).toEqual({
			place: ", 2999 EKSEMPELBY",
		})
	})

	it("cuts a trailing name", () => {
		expect(placePart("Storgata 3, 2999 Eksempelby Kari Nordmann", "2999", "EKSEMPELBY")).toEqual({
			place: ", 2999 Eksempelby",
		})
		expect(placePart("Storgata 3, 2999 Eksempelby, Kari Nordmann", "2999", "EKSEMPELBY")).toEqual({
			place: ", 2999 Eksempelby",
		})
	})

	it("cuts a trailing Telefon, and the full stop after the poststed", () => {
		expect(placePart("Storgata 3, 2999 Eksempelby Telefon", "2999", "EKSEMPELBY")).toEqual({
			place: ", 2999 Eksempelby",
		})
		expect(
			placePart("Storgata 3, 2999 Eksempelby. Telefon 62 00 00 00", "2999", "EKSEMPELBY")
		).toEqual({ place: ", 2999 Eksempelby" })
	})

	it("reads a poststed of two words, with any spacing between the words", () => {
		const two = "NORDRE EKSEMPELBY"
		expect(placePart("Storgata 3, 2999 Nordre Eksempelby Kari Nordmann", "2999", two)).toEqual({
			place: ", 2999 Nordre Eksempelby",
		})
		expect(placePart("Storgata 3,  2999 Nordre  Eksempelby", "2999", two)).toEqual({
			place: ", 2999 Nordre Eksempelby",
		})
	})

	it("sends a hyphenated spelling of a two-word poststed to review", () => {
		expect(placePart("Storgata 3, 2999 Nordre-Eksempelby", "2999", "NORDRE EKSEMPELBY")).toEqual(
			mismatch
		)
	})

	it("sends a different postcode, a different place or a longer word to review", () => {
		expect(placePart("Storgata 3, 2998 Eksempelby", "2999", "EKSEMPELBY")).toEqual(mismatch)
		expect(placePart("Storgata 3, 2999 Annenby", "2999", "EKSEMPELBY")).toEqual(mismatch)
		expect(placePart("Storgata 3, 2999 Eksempelbyen", "2999", "EKSEMPELBY")).toEqual(mismatch)
		expect(placePart("Storgata 3, 2999", "2999", "EKSEMPELBY")).toEqual(mismatch)
		expect(placePart("Storgata 3, Eksempelby", "2999", "EKSEMPELBY")).toEqual(mismatch)
	})

	it("sends a floor line before the postcode to review", () => {
		expect(placePart("Storgata 3, 2. etasje, 2999 Eksempelby", "2999", "EKSEMPELBY")).toEqual(
			mismatch
		)
	})

	it("sends an answer with no poststed or no postcode to review", () => {
		expect(placePart("Storgata 3, 2999 Eksempelby", "2999", undefined)).toEqual(mismatch)
		expect(placePart("Storgata 3, 2999 Eksempelby", undefined, "EKSEMPELBY")).toEqual(mismatch)
	})

	it("has nothing to keep when the value has no comma", () => {
		expect(placePart("Storgata 3", "2999", "EKSEMPELBY")).toBeUndefined()
	})
})

describe("kartverketForm", () => {
	const hit = {
		addressId: "a3",
		kommune: "3405",
		text: "Storgata 3",
		postcode: "2999",
		poststed: "EKSEMPELBY",
	}

	it("stores Kartverket's street text and the place part it confirms", () => {
		expect(kartverketForm("Storgata 3, 2999 Eksempelby Kari Nordmann", hit)).toEqual({
			value: "Storgata 3, 2999 Eksempelby",
		})
	})

	it("stores the street text alone, with the review reason, when the place is not Kartverket's", () => {
		expect(
			kartverketForm("Storgata 3, 2999 Nordre-Eksempelby", { ...hit, poststed: "NORDRE EKSEMPELBY" })
		).toEqual({ value: "Storgata 3", review: PLACE_MISMATCH })
		const noPoststed = { addressId: "a3", kommune: "3405", text: "Storgata 3", postcode: "2999" }
		expect(kartverketForm("Storgata 3, 2999 Eksempelby Kari Nordmann", noPoststed)).toEqual({
			value: "Storgata 3",
			review: PLACE_MISMATCH,
		})
	})

	it("stores the street text alone for a value with no comma", () => {
		expect(kartverketForm("Storgata 3", hit)).toEqual({ value: "Storgata 3" })
	})

	it("keeps the value when the hit has no street text", () => {
		expect(kartverketForm("Storgata 3, 2999 Eksempelby", { addressId: "a3", kommune: "3405" })).toEqual(
			{ value: "Storgata 3, 2999 Eksempelby" }
		)
	})
})
```

- [ ] **Step 2: Write the failing verify tests**

In `pipeline/test/verify.test.ts`, the `address()` helper (lines 82-86) gains a postcode and a poststed, with `LILLEHAMMER` as the default so every existing test keeps its place part. `null` means Kartverket sends no poststed (a default parameter cannot tell `undefined` from a missing argument). Before:

```ts
const address = (id: string, text: string) => ({
	body: JSON.stringify({
		adresser: [{ adresseid: id, adressetekst: text, kommunenummer: "3405", postnummer: "2609" }],
	}),
})
```

After:

```ts
const address = (
	id: string,
	text: string,
	postnummer = "2609",
	poststed: string | null = "LILLEHAMMER"
) => ({
	body: JSON.stringify({
		adresser: [
			{
				adresseid: id,
				adressetekst: text,
				kommunenummer: "3405",
				postnummer,
				...(poststed === null ? {} : { poststed }),
			},
		],
	}),
})
```

Add `import { PLACE_MISMATCH } from "../src/text/address.ts"` to the imports, and this block at the end of the file:

```ts
describe("the address place part", () => {
	const page = (line: string) => html(`${H1}<h2>Kontakt</h2><p>Besøksadresse: ${line}</p>`)
	// Kartverket's answer for Storgata 3: postcode 2999, and the poststed given (null: none).
	const storgata3 = (poststed: string | null, postnummer = "2999") =>
		fakeGet({
			...KARTVERKET,
			[addressQuery("storgata 3", "3405")]: address("a3", "Storgata 3", postnummer, poststed),
		})
	const lockFor = async (line: string, get: Get, curated?: CuratedFile) => {
		const { input } = setup({
			pages: { [BV]: page(line) },
			units: [unit({ address: undefined })],
			get,
			curated,
		})
		return (await verifyKommune(input)).lock
	}

	it("cuts a trailing name from the value, so redaction removes it from the quote too", async () => {
		const lock = await lockFor("Storgata 3, 2999 Eksempelby Kari Nordmann", storgata3("EKSEMPELBY"))
		expect(lock.units[0]?.fields.address).toMatchObject({
			status: "accepted",
			value: "Storgata 3, 2999 Eksempelby",
			addressId: "a3",
		})
		expect(JSON.stringify(lock)).not.toMatch(/Kari|Nordmann/)
	})

	it("cuts a trailing Telefon from the value", async () => {
		const lock = await lockFor(
			"Storgata 3, 2999 Eksempelby Telefon 62 00 00 00",
			storgata3("EKSEMPELBY")
		)
		expect(lock.units[0]?.fields.address).toMatchObject({
			status: "accepted",
			value: "Storgata 3, 2999 Eksempelby",
		})
	})

	it("leaves a clean value as the page wrote it", async () => {
		const lock = await lockFor("Storgata 3, 2999 Eksempelby", storgata3("EKSEMPELBY"))
		expect(lock.units[0]?.fields.address).toMatchObject({
			status: "accepted",
			value: "Storgata 3, 2999 Eksempelby",
			addressId: "a3",
		})
	})

	it("sends a different postcode to review through the validity gate, with the text before the comma alone", async () => {
		// pickAddress refuses a record with another postcode, so there is no hit and no place-part check.
		const lock = await lockFor(
			"Storgata 3, 2998 Eksempelby Kari Nordmann",
			storgata3("EKSEMPELBY")
		)
		const field = lock.units[0]?.fields.address
		expect(field).toMatchObject({
			status: "review",
			value: "Storgata 3",
			reason: "validity: Kartverket does not know the address",
		})
		expect(field?.addressId).toBeUndefined()
		expect(JSON.stringify(lock)).not.toMatch(/Kari|Nordmann/)
	})

	it("sends an answer with no poststed to review, with the street text alone", async () => {
		const lock = await lockFor("Storgata 3, 2999 Eksempelby Kari Nordmann", storgata3(null))
		expect(lock.units[0]?.fields.address).toMatchObject({
			status: "review",
			value: "Storgata 3",
			reason: PLACE_MISMATCH,
			addressId: "a3",
		})
		expect(JSON.stringify(lock)).not.toMatch(/Kari|Nordmann/)
	})

	it("sends a hyphenated poststed to review, and my accept settles it", async () => {
		const line = "Storgata 3, 2999 Nordre-Eksempelby"
		const before = await lockFor(line, storgata3("NORDRE EKSEMPELBY"))
		expect(before.units[0]?.fields.address).toMatchObject({
			status: "review",
			value: "Storgata 3",
			reason: PLACE_MISMATCH,
		})
		const decisions = [
			{
				field: "address" as const,
				value: "Storgata 3",
				sourceUrl: BV,
				decision: "accept" as const,
				decidedOn: "2026-11-06",
			},
		]
		const curated: CuratedFile = { kommune: "3405", name: "Lillehammer", units: [answer(decisions)] }
		const after = await lockFor(line, storgata3("NORDRE EKSEMPELBY"), curated)
		expect(after.units[0]?.fields.address).toMatchObject({
			status: "accepted",
			value: "Storgata 3",
			addressId: "a3",
		})
		expect(after.units[0]?.fields.address?.reason).toBeUndefined()
	})
})
```

(`setup` takes `curated?: CuratedFile`; passing `undefined` is the same as leaving it out. `answer()` builds the curated unit for `org:999999991`, the default unit's id.)

- [ ] **Step 3: Add the poststed tests to `test/kartverket.test.ts`**

Add after the `describe("pickAddress: a house letter", ...)` block:

```ts
describe("Kartverket's postcode and poststed", () => {
	it("carries the postcode and the poststed onto the hit", () => {
		expect(pickAddress(records(record("a1")), "Storgata 1, 2609 Lillehammer")).toEqual({
			addressId: "a1",
			kommune: "3405",
			text: "Storgata 1",
			postcode: "2609",
			poststed: "LILLEHAMMER",
		})
	})

	it("gives no poststed when Kartverket sends none", () => {
		const bare = {
			adresseid: "a1",
			adressetekst: "Storgata 1",
			kommunenummer: "3405",
			postnummer: "2609",
		}
		expect(parseAddressSearch({ adresser: [bare] })).toEqual([
			{ addressId: "a1", kommune: "3405", text: "Storgata 1", postcode: "2609" },
		])
	})
})
```

- [ ] **Step 4: Run them to see them fail**

Run: `npx vitest run test/placePart.test.ts test/verify.test.ts test/kartverket.test.ts`
Expected: FAIL. `placePart` and `PLACE_MISMATCH` do not exist; `kartverketForm` returns a string; the hit has no `postcode` or `poststed`; in verify the trailing name stays in the value ("Storgata 3, 2999 Eksempelby Kari Nordmann") and in the lock, and the poststed-less and hyphenated cases are accepted with the page's place part.

- [ ] **Step 5: Add the rule to `src/text/address.ts`**

Append after `quoteHasAddress` (line 32):

```ts
// The reason a field goes to review when the page's place is not Kartverket's.
export const PLACE_MISMATCH = "place part does not match Kartverket"

// Punctuation that may close the place: "2999 Eksempelby." or "2999 Eksempelby, Kari Nordmann".
// A loop, not a pattern, so a long run of dots costs one pass.
function withoutClosing(word: string): string {
	let end = word.length
	while (end > 0 && ".,;:".includes(word.charAt(end - 1))) end--
	return word.slice(0, end)
}

// The place part verify may store after Kartverket's street text: the text after the first comma,
// only when it is Kartverket's postcode, then whitespace, then Kartverket's poststed, compared
// without case. The page's own spelling stays ("Lillehammer", not "LILLEHAMMER") and every word
// after the poststed is cut, so a name or a label that follows the place never rides into the
// value. The text is split on whitespace, so the poststed always ends at a word: "Eksempelbyen"
// is not "Eksempelby", and "Nordre-Eksempelby" is not "NORDRE EKSEMPELBY". undefined: the value
// has no comma, so there is no place part to keep.
export function placePart(
	value: string,
	postcode: string | undefined,
	poststed: string | undefined
): { place: string } | { review: string } | undefined {
	const comma = value.indexOf(",")
	if (comma < 0) return undefined
	const mismatch = { review: PLACE_MISMATCH }
	if (postcode === undefined || poststed === undefined) return mismatch
	const [code, ...rest] = value
		.slice(comma + 1)
		.trim()
		.split(/\s+/)
	if (code !== postcode) return mismatch
	const length = poststed.trim().split(/\s+/).length
	const words = rest.slice(0, length)
	if (words.length < length) return mismatch
	const place = [...words.slice(0, -1), withoutClosing(words.at(-1) ?? "")].join(" ")
	if (normaliseText(place) !== normaliseText(poststed)) return mismatch
	return { place: `, ${code} ${place}` }
}
```

- [ ] **Step 6: Read the poststed in `src/registers/kartverket.ts` and `src/gates/types.ts`**

In `gates/types.ts`, lines 30-31, before:

```ts
// text is Kartverket's own address text ("Storgata 1A"), the form verify stores.
export type AddressHit = { addressId: string; kommune: string; text?: string }
```

After:

```ts
// text is Kartverket's own address text ("Storgata 1A"), the form verify stores. postcode and
// poststed are Kartverket's too ("2999", "EKSEMPELBY"); the place-part rule reads them.
export type AddressHit = {
	addressId: string
	kommune: string
	text?: string
	postcode?: string
	poststed?: string
}
```

In `registers/kartverket.ts`, line 15, before:

```ts
export type AddressRecord = { addressId: string; kommune: string; text: string; postcode?: string }
```

After:

```ts
// poststed comes as Kartverket writes it, in capitals ("EKSEMPELBY").
export type AddressRecord = {
	addressId: string
	kommune: string
	text: string
	postcode?: string
	poststed?: string
}
```

Lines 17-26 (`Search`), add `poststed` after `postnummer`:

```ts
const Search = z.object({
	adresser: z.array(
		z.object({
			adresseid: z.string(),
			adressetekst: z.string(),
			kommunenummer: z.string(),
			postnummer: z.string().optional(),
			poststed: z.string().optional(),
		})
	),
})
```

In `parseAddressSearch` (lines 28-40), after `if (a.postnummer !== undefined) record.postcode = a.postnummer` add:

```ts
		if (a.poststed !== undefined) record.poststed = a.poststed
```

In `pickAddress`, line 58, before:

```ts
	return { addressId: hit.addressId, kommune: hit.kommune, text: hit.text }
```

After:

```ts
	return {
		addressId: hit.addressId,
		kommune: hit.kommune,
		text: hit.text,
		...(hit.postcode === undefined ? {} : { postcode: hit.postcode }),
		...(hit.poststed === undefined ? {} : { poststed: hit.poststed }),
	}
```

- [ ] **Step 7: `kartverketForm` returns the value and the review reason**

In `src/verify/context.ts`, add `import { placePart } from "../text/address.ts"` to the imports, and replace lines 111-116, before:

```ts
// The value verify stores: Kartverket's own street text, then the page's postcode and place.
export function kartverketForm(value: string, hit: AddressHit): string {
	if (hit.text === undefined) return value
	const comma = value.indexOf(",")
	return comma < 0 ? hit.text : `${hit.text}${value.slice(comma)}`
}
```

After:

```ts
// The value verify stores: Kartverket's street text, then the page's postcode and poststed when
// they are Kartverket's own (placePart). Any other place part sends the field to review, and the
// value holds Kartverket's street text alone: page text Kartverket did not confirm (a name, a
// label, a floor line) never stands in a stored value, so redaction also takes a name out of the
// quote (inValue in gates/run.ts spares only the value's own words).
export function kartverketForm(value: string, hit: AddressHit): { value: string; review?: string } {
	if (hit.text === undefined) return { value }
	const place = placePart(value, hit.postcode, hit.poststed)
	if (place === undefined) return { value: hit.text }
	if ("review" in place) return { value: hit.text, review: place.review }
	return { value: `${hit.text}${place.place}` }
}
```

- [ ] **Step 8: `settle` sends a place mismatch to review**

In `src/verify/verify.ts`, lines 124-137, before:

```ts
// One field: Kartverket's form for an address, my answer if I gave one, then the five gates. A
// rule's or the shared page's review reason applies only where I have not answered. An answer
// whose quotes left the page counts as no answer, so the gates judge the value afresh.
function settle(
	p: Proposal,
	ctx: GateContext,
	decisions: readonly ReviewDecision[],
	now: string
): { field: LockField; unsettled: boolean } {
	let c = p.candidate
	if (c.field === "address" && typeof c.value === "string") {
		const hit = ctx.findAddress(c.value)
		if (hit !== undefined) c = { ...c, value: kartverketForm(c.value, hit) }
	}
```

After:

```ts
// One field: Kartverket's form for an address, my answer if I gave one, then the five gates. A
// rule's, the shared page's or the place part's review reason applies only where I have not
// answered: my decision is found by the stored value, Kartverket's form, so an accept settles a
// place mismatch as it settles any other review. An address Kartverket gave no hit keeps only the
// text before its first comma: no place was confirmed, so a name after it never stands in the
// value or, through inValue, in the quote. An answer whose quotes left the page counts as no
// answer, so the gates judge the value afresh.
function settle(
	p: Proposal,
	ctx: GateContext,
	decisions: readonly ReviewDecision[],
	now: string
): { field: LockField; unsettled: boolean } {
	let c = p.candidate
	let placeReview: string | undefined
	if (c.field === "address" && typeof c.value === "string") {
		const hit = ctx.findAddress(c.value)
		if (hit !== undefined) {
			const form = kartverketForm(c.value, hit)
			c = { ...c, value: form.value }
			placeReview = form.review
		} else {
			const comma = c.value.indexOf(",")
			const street = comma < 0 ? "" : c.value.slice(0, comma).trim()
			if (street !== "") c = { ...c, value: street }
		}
	}
```

Lines 164-165, before:

```ts
	const field = runGates(c, ctx, now)
	return { field: p.review === undefined ? field : toReview(field, p.review), unsettled: false }
```

After:

```ts
	const gated = runGates(c, ctx, now)
	const field = placeReview === undefined ? gated : toReview(gated, placeReview)
	return { field: p.review === undefined ? field : toReview(field, p.review), unsettled: false }
```

Line 246, in `verifyKommune`, the gates look the stored form up, so it goes into the map. Before:

```ts
		if (hit?.text !== undefined) addresses.set(kartverketForm(a, hit), hit)
```

After:

```ts
		if (hit?.text !== undefined) addresses.set(kartverketForm(a, hit).value, hit)
```

- [ ] **Step 9: Update the existing tests that read a hit or a form**

`test/kartverket.test.ts`: the `record()` helper already sends `postnummer` and `poststed: "LILLEHAMMER"`, so each `toEqual` on a hit gains both. Line 36, before:

```ts
		expect(hit).toEqual({ addressId: r.adresseid, kommune: r.kommunenummer, text: r.adressetekst })
```

After:

```ts
		expect(hit).toEqual({
			addressId: r.adresseid,
			kommune: r.kommunenummer,
			text: r.adressetekst,
			postcode: r.postnummer,
			poststed: r.poststed,
		})
```

Line 41, before:

```ts
		expect(hit).toEqual({ addressId: "a1", kommune: "3405", text: "Storgata 1A" })
```

After:

```ts
		expect(hit).toEqual({
			addressId: "a1",
			kommune: "3405",
			text: "Storgata 1A",
			postcode: "2609",
			poststed: "LILLEHAMMER",
		})
```

Lines 73-77, 96-100 and 109-113: add `postcode: "2609",` and `poststed: "LILLEHAMMER",` after the `text` line of each expected object (`text: "Storgata 1"`, `text: "Storgata 1"` and `text: "Storgata 1A"`).

`test/context.test.ts`, lines 96-121: the body gains a poststed, the hit gains both fields, and `kartverketForm` returns an object. Before:

```ts
describe("resolveAddresses and kartverketForm", () => {
	it("asks Kartverket once per distinct address", async () => {
		const asked: string[] = []
		const body = JSON.stringify({
			adresser: [
				{ adresseid: "a1", adressetekst: "Storgata 1A", kommunenummer: "3405", postnummer: "2609" },
			],
		})
```

After:

```ts
describe("resolveAddresses and kartverketForm", () => {
	it("asks Kartverket once per distinct address", async () => {
		const asked: string[] = []
		const body = JSON.stringify({
			adresser: [
				{
					adresseid: "a1",
					adressetekst: "Storgata 1A",
					kommunenummer: "3405",
					postnummer: "2609",
					poststed: "LILLEHAMMER",
				},
			],
		})
```

and, at the end of the same test, before:

```ts
		expect(hit).toEqual({ addressId: "a1", kommune: "3405", text: "Storgata 1A" })
		expect(
			kartverketForm("Storgata 1 A, 2609 Lillehammer", hit ?? { addressId: "", kommune: "" })
		).toBe("Storgata 1A, 2609 Lillehammer")
```

After:

```ts
		expect(hit).toEqual({
			addressId: "a1",
			kommune: "3405",
			text: "Storgata 1A",
			postcode: "2609",
			poststed: "LILLEHAMMER",
		})
		expect(
			kartverketForm("Storgata 1 A, 2609 Lillehammer", hit ?? { addressId: "", kommune: "" })
		).toEqual({ value: "Storgata 1A, 2609 Lillehammer" })
```

Check that nothing else builds a Kartverket answer without a poststed and expects the place part kept: `grep -rn "postnummer" test/*.ts` lists only `kartverket.test.ts`, `context.test.ts`, `verify.test.ts`, `discover.test.ts` (a Brreg address) and `nav.test.ts` (Nav's own address); the last two are not Kartverket answers.

- [ ] **Step 10: Run the tests to see them pass**

Run: `npx vitest run test/placePart.test.ts test/verify.test.ts test/kartverket.test.ts test/context.test.ts && npm test`
Expected: PASS. The existing verify tests keep "Storgata 1, 2609 Lillehammer" as accepted, because their Kartverket answer now carries `LILLEHAMMER`.

- [ ] **Step 11: Show it red once**

In `kartverketForm`, replace the last line with the old form, `return { value: \`${hit.text}${value.slice(value.indexOf(","))}\` }`. Run `npx vitest run test/verify.test.ts`: FAIL on "cuts a trailing name from the value, so redaction removes it from the quote too" (the value holds "Kari Nordmann", and so does the lock). Restore, run: PASS. Then in `settle`, change `const field = placeReview === undefined ? gated : toReview(gated, placeReview)` to `const field = gated`. Run it: FAIL on "sends an answer with no poststed to review" (status `accepted`). Restore, run: PASS. Then in `placePart`, replace `withoutClosing(words.at(-1) ?? "")` with `words.at(-1) ?? ""`. Run `npx vitest run test/placePart.test.ts`: FAIL on "cuts a trailing Telefon, and the full stop after the poststed". Restore, run: PASS. Then in `settle`, delete the `else` branch that keeps the text before the comma. Run `npx vitest run test/verify.test.ts`: FAIL on "sends a different postcode to review through the validity gate, with the text before the comma alone" (the value holds the whole line). Restore, run: PASS. Note all four for the PR body.

- [ ] **Step 12: Format, types, lint, tests, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm run lint && npm test
git add src/text/address.ts src/registers/kartverket.ts src/gates/types.ts src/verify/context.ts src/verify/verify.ts test/placePart.test.ts test/verify.test.ts test/kartverket.test.ts test/context.test.ts
git commit -m "fix(pipeline): keep an address's place part only when Kartverket confirms it"
```

---

### Task 3: Kartverket pace, cache and offline lookups

Kartverket's address API gets its own pace of one request a second, one at a time, keyed by registrable domain the way the crawler already keys its queues. The 5-second floor stays for websites and the other registers. Answers are cached under `<cache>/kartverket/` for 30 days, each file named by the sha256 of its normalised key, and only a parsed answer is written. Offline, any age counts and a miss throws. The crawler's report gains each host's delay, which Task 10 reads.

This task does not wire the CLIs. Task 6 builds the `AddressCache` in `verify` (with `--offline` and `--dry-run`), passes it from `VerifyInput` to `resolveAddresses`, and runs its `purge` in `fetch`. `review` keeps its live lookup without a cache (plan Decided 11). Note for Task 6: an `OfflineMissError` or an `AddressLookupError` thrown inside `verifyKommune` reaches `verifyEach`, whose `unfinishedReason` prints only "stopped on an unexpected error" for it today.

**Files:**
- Create: `pipeline/src/io/addressCache.ts`, `pipeline/src/io/offline.ts`
- Modify: `pipeline/src/net/types.ts` (after line 3), `pipeline/src/net/crawler.ts` (lines 13-22, 73, 95-98, 178-188, 289-294, 373-387), `pipeline/src/discover/types.ts` (lines 91-93), `pipeline/src/registers/kartverket.ts` (lines 1-5 imports, 61-72 after Task 2), `pipeline/src/verify/context.ts` (lines 85-95)
- Test: `pipeline/test/pace.test.ts` (new), `pipeline/test/addressCache.test.ts` (new), `pipeline/test/crawler.test.ts` (lines 68-70, 156-160, 302-304, 318-321, 365-368, 408-410)

**Interfaces:**
- Consumes: `AddressRecord`, `pickAddress`, `findAddress`, `parseAddressSearch` (Task 2), `writeJsonAtomic` (`src/io/files.ts`), `MAX_AGE_DAYS` and `DAY_MS` (`src/io/pageCache.ts`), `isoSeconds` (`src/net/clock.ts`), `normaliseText`, `UtcTimestamp` (`src/schema/common.ts`), `getDomain` as `#state` uses it.
- Produces:
  - `src/net/types.ts`: `PACE_MS: Readonly<Record<string, number>>` = `{ "kartverket.no": 1_000 }`.
  - `src/net/crawler.ts`: `HostLine = { host: string; requests: number; delayMs: number; stopped?: HostStop }`.
  - `src/io/addressCache.ts`: `ADDRESS_MAX_AGE_DAYS = 30`; `class AddressCache { constructor(dir: string, options?: { offline?: boolean; dryRun?: boolean; now?: () => number }); lookups: number; hits: number; read(search, kommune): AddressRecord[] | undefined; write(search, kommune, records): void; purge(nowMs: number): number }`.
  - `src/io/offline.ts`: `class OfflineMissError extends Error { readonly what: string }` (message `offline: not in the cache: <what>`); `offlineGet: Get`.
  - `src/registers/kartverket.ts`: `findAddress(get, wanted, kommune, cache?: AddressCache)`; `class AddressLookupError extends Error {}` (thrown when a cache is given and Kartverket's host is stopped).
  - `src/verify/context.ts`: `resolveAddresses(get, addresses, kommune, cache?: AddressCache)`.
  - `src/discover/types.ts`: `DiscoverReport.hosts[]` accepts an optional `delayMs` (a discover report written before this task still reads).

- [ ] **Step 1: Write the failing pace test**

Create `pipeline/test/pace.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { AllowList } from "../src/net/allowList.ts"
import { Crawler } from "../src/net/crawler.ts"
import { FLOOR_MS, PACE_MS } from "../src/net/types.ts"
import { addressQuery } from "../src/registers/kartverket.ts"
import { FakeClock, fakeWeb, html, json, type Route, text } from "./netHelpers.ts"

const A = "https://www.eksempel.kommune.no"
const KARTVERKET_ROBOTS = "https://api.kartverket.no/robots.txt"
const BRREG = "https://data.brreg.no/enhetsregisteret/api/enheter"
const Q1 = addressQuery("storgata 1", "3405")
const Q2 = addressQuery("storgata 2", "3405")

// The fixed allow-list (registers included) plus one kommune site.
function setup(extra: Record<string, Route> = {}) {
	const clock = new FakeClock()
	const allowList = new AllowList()
	allowList.add("www.eksempel.kommune.no", "kommune", "ownPage")
	const web = fakeWeb({
		[Q1]: json({ adresser: [] }),
		[Q2]: json({ adresser: [] }),
		[`${BRREG}/999999981`]: json({}),
		[`${BRREG}/999999982`]: json({}),
		[`${A}/a/`]: html("a"),
		[`${A}/b/`]: html("b"),
		...extra,
	})
	const crawler = new Crawler({ transport: web.transport, clock, allowList })
	return { crawler, clock }
}

describe("crawler: Kartverket's own pace", () => {
	it("keys the pace by registrable domain and leaves every other server on the floor", () => {
		expect(PACE_MS).toEqual({ "kartverket.no": 1000 })
		expect(FLOOR_MS).toBe(5000)
	})

	it("asks Kartverket a second apart, while Brreg and a website still wait 5 seconds", async () => {
		const { crawler, clock } = setup()
		for (const url of [Q1, Q2, `${BRREG}/999999981`, `${BRREG}/999999982`]) {
			expect((await crawler.get(url, "json")).ok).toBe(true)
		}
		for (const url of [`${A}/a/`, `${A}/b/`]) expect((await crawler.get(url, "html")).ok).toBe(true)
		// Each server's robots.txt is its first request and waits for nothing; every gap after it
		// is that server's pace.
		expect(clock.sleeps).toEqual([1000, 1000, 5000, 5000, 5000, 5000])
	})

	it("sends one Kartverket request at a time when two are asked at once", async () => {
		const { crawler, clock } = setup()
		await Promise.all([crawler.get(Q1, "json"), crawler.get(Q2, "json")])
		expect(clock.sleeps).toEqual([1000, 1000])
	})

	it("waits Kartverket's own Crawl-delay when it is longer than a second", async () => {
		const { crawler, clock } = setup({
			[KARTVERKET_ROBOTS]: text("User-agent: *\nCrawl-delay: 3"),
		})
		await crawler.get(Q1, "json")
		await crawler.get(Q2, "json")
		expect(clock.sleeps).toEqual([3000, 3000])
	})

	it("reports each host's delay", async () => {
		const { crawler } = setup()
		await crawler.get(Q1, "json")
		await crawler.get(`${A}/a/`, "html")
		expect(crawler.report().hosts).toEqual([
			{ host: "api.kartverket.no", requests: 2, delayMs: 1000 },
			{ host: "www.eksempel.kommune.no", requests: 2, delayMs: 5000 },
		])
	})
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run test/pace.test.ts`
Expected: FAIL. `PACE_MS` is not exported, Kartverket waits 5,000 ms, and the report has no `delayMs`.

- [ ] **Step 3: Add `PACE_MS` and the per-server floor**

In `src/net/types.ts`, after `export const FLOOR_MS = 5_000` (line 3):

```ts
// A server's own pace where it is not the website floor, keyed by registrable domain as the
// crawler keys its queues. Kartverket's address API (version 1.2.0, read 12.11.2026) needs no
// login and states no rate limit: I hold it to one request a second, one at a time. Every other
// server keeps FLOOR_MS, and a longer Crawl-delay still wins everywhere.
export const PACE_MS: Readonly<Record<string, number>> = Object.freeze({ "kartverket.no": 1_000 })
```

In `src/net/crawler.ts`, add `PACE_MS` to the `./types.ts` import (lines 13-22). Line 73, before:

```ts
export type HostLine = { host: string; requests: number; stopped?: HostStop }
```

After:

```ts
// delayMs is the pace the host's server ended the run on: its floor, or a longer Crawl-delay.
export type HostLine = { host: string; requests: number; delayMs: number; stopped?: HostStop }
```

Lines 95-98, before:

```ts
// One request at a time per server: www and the bare domain, and every subdomain of one
// registrable domain (the 371 *.frivilligsentral.no sites), share one queue and one pace.
// robots.txt and stops stay per host, as RFC 9309 reads robots.txt per host.
type Queue = { delayMs: number; next: number; tail: Promise<unknown> }
```

After:

```ts
// One request at a time per server: www and the bare domain, and every subdomain of one
// registrable domain (the 371 *.frivilligsentral.no sites), share one queue and one pace.
// robots.txt and stops stay per host, as RFC 9309 reads robots.txt per host. floorMs is the
// server's own floor (PACE_MS, else FLOOR_MS); delayMs never goes under it.
type Queue = { delayMs: number; floorMs: number; next: number; tail: Promise<unknown> }

// Object.hasOwn, so a host named like an Object method never reads the prototype.
function floorFor(server: string): number {
	return Object.hasOwn(PACE_MS, server) ? (PACE_MS[server] ?? FLOOR_MS) : FLOOR_MS
}
```

Lines 178-188 (`report`), before:

```ts
	report(): CrawlReport {
		const hosts = [...this.#hosts.entries()]
			.sort(byHost)
			.map(
				([host, s]): HostLine =>
					s.stopped === undefined
						? { host, requests: s.requests }
						: { host, requests: s.requests, stopped: s.stopped }
			)
		return { hosts, notFetched: [...this.#notFetched] }
	}
```

After:

```ts
	report(): CrawlReport {
		const hosts = [...this.#hosts.entries()].sort(byHost).map(([host, s]): HostLine => {
			const line: HostLine = { host, requests: s.requests, delayMs: s.queue.delayMs }
			return s.stopped === undefined ? line : { ...line, stopped: s.stopped }
		})
		return { hosts, notFetched: [...this.#notFetched] }
	}
```

Lines 289-294 (`#pace`), before:

```ts
	// A server's pace is the slowest any of its hosts asks for, never under the floor.
	#pace(state: HostState, delay: number): void {
		const queue = state.queue
		queue.delayMs = Math.max(queue.delayMs, FLOOR_MS, delay)
		queue.next = Math.max(queue.next, this.#clock.now() + queue.delayMs)
	}
```

After:

```ts
	// A server's pace is the slowest any of its hosts asks for, never under its own floor.
	#pace(state: HostState, delay: number): void {
		const queue = state.queue
		queue.delayMs = Math.max(queue.delayMs, queue.floorMs, delay)
		queue.next = Math.max(queue.next, this.#clock.now() + queue.delayMs)
	}
```

Lines 373-387 (`#state`), replace the queue creation, before:

```ts
			if (queue === undefined) {
				queue = { delayMs: FLOOR_MS, next: 0, tail: Promise.resolve() }
				this.#queues.set(server, queue)
			}
```

After:

```ts
			if (queue === undefined) {
				const floorMs = floorFor(server)
				queue = { delayMs: floorMs, floorMs, next: 0, tail: Promise.resolve() }
				this.#queues.set(server, queue)
			}
```

`FLOOR_MS` stays imported: `floorFor` uses it.

- [ ] **Step 4: Let a discover report hold the delay, and update the report tests**

`src/cli/discover.ts` copies `crawler.report().hosts` into `discover/report.json`, which `readDiscovery` parses with a strict schema. In `src/discover/types.ts`, lines 91-93, before:

```ts
	hosts: z.array(
		z.strictObject({ host: NonBlank, requests: Count, stopped: z.enum(HOST_STOPS).optional() })
	),
```

After:

```ts
	// delayMs since PR 4. Optional, so a discover report written before it still reads.
	hosts: z.array(
		z.strictObject({
			host: NonBlank,
			requests: Count,
			delayMs: Count.optional(),
			stopped: z.enum(HOST_STOPS).optional(),
		})
	),
```

`test/discover.test.ts` writes and reads a report built from a real `crawler.report()`, so it covers this.

In `test/crawler.test.ts`, every host line a test compares whole gains `delayMs: 5000`. None of these servers has a `PACE_MS` entry, and each stops before a Crawl-delay could raise the pace:

- lines 68-70: `{ host: "www.eksempel.kommune.no", requests: 1, delayMs: 5000, stopped: "crawlDelayTooLong" }`
- lines 156-160 (`toContainEqual`): add `delayMs: 5000,` after `requests: 3,`
- lines 302-304: `{ host: "data.register-a.no", requests: 1, delayMs: 5000, stopped: "retryAfterTooLong" }`
- lines 318-321: both `data.register-a.no` and `data.register-b.no` lines gain `delayMs: 5000`
- lines 365-368: both `www.eksempel.kommune.no` and `www.leverandor.no` lines gain `delayMs: 5000`
- lines 408-410: `{ host: "www.eksempel.kommune.no", requests: 2, delayMs: 5000, stopped: "visitTime" }`

Then check nothing else compares a host line whole: `grep -rn "requests: [0-9]" test/*.ts`. Expected: only the lines above, `test/pace.test.ts`, and `test/recall.test.ts` line 121, which is a `DiscoverReport` (where `delayMs` is optional) and stays as it is.

- [ ] **Step 5: Run the pace and crawler tests to see them pass**

Run: `npx vitest run test/pace.test.ts test/crawler.test.ts test/discover.test.ts`
Expected: PASS.

- [ ] **Step 6: Write the failing cache tests**

Create `pipeline/test/addressCache.test.ts`:

```ts
import { createHash } from "node:crypto"
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { ADDRESS_MAX_AGE_DAYS, AddressCache } from "../src/io/addressCache.ts"
import { OfflineMissError, offlineGet } from "../src/io/offline.ts"
import { DAY_MS, MAX_AGE_DAYS } from "../src/io/pageCache.ts"
import type { Get } from "../src/net/crawler.ts"
import { AddressLookupError, addressQuery, findAddress } from "../src/registers/kartverket.ts"
import { resolveAddresses } from "../src/verify/context.ts"
import { fakeGet, T_NOON } from "./netHelpers.ts"

const KOMMUNE = "3405"
const VALUE = "Storgata 1, 2999 Eksempelby"
const SEARCH = "storgata 1"
const RECORD = {
	adresseid: "a1",
	adressetekst: "Storgata 1",
	kommunenummer: KOMMUNE,
	postnummer: "2999",
	poststed: "EKSEMPELBY",
}
const HIT = {
	addressId: "a1",
	kommune: KOMMUNE,
	text: "Storgata 1",
	postcode: "2999",
	poststed: "EKSEMPELBY",
}

const folder = () => join(mkdtempSync(join(tmpdir(), "varde-address-cache-")), "kartverket")
const fileFor = (search: string, kommune = KOMMUNE) =>
	`${createHash("sha256").update(`${kommune}\n${search}`).digest("hex")}.json`
const at = (ms: number) => () => ms

// A Kartverket that answers the one search and counts every request.
function kartverket(body: unknown = { adresser: [RECORD] }) {
	const asked: string[] = []
	const answer = fakeGet({ [addressQuery(SEARCH, KOMMUNE)]: { body: JSON.stringify(body) } })
	const get: Get = (url, kind) => {
		asked.push(url)
		return answer(url, kind)
	}
	return { get, asked }
}

describe("AddressCache: a fresh answer", () => {
	it("answers a second lookup from the cache, with no request", async () => {
		const dir = folder()
		const web = kartverket()
		const first = new AddressCache(dir, { now: at(T_NOON) })
		expect(await findAddress(web.get, VALUE, KOMMUNE, first)).toEqual(HIT)
		const later = new AddressCache(dir, { now: at(T_NOON + DAY_MS) })
		expect(await findAddress(web.get, VALUE, KOMMUNE, later)).toEqual(HIT)
		expect(web.asked).toHaveLength(1)
		expect({ lookups: later.lookups, hits: later.hits }).toEqual({ lookups: 1, hits: 1 })
	})

	it("writes { cachedAt, records } under the sha256 of the key", async () => {
		const dir = folder()
		await findAddress(kartverket().get, VALUE, KOMMUNE, new AddressCache(dir, { now: at(T_NOON) }))
		expect(readdirSync(dir)).toEqual([fileFor(SEARCH)])
		expect(JSON.parse(readFileSync(join(dir, fileFor(SEARCH)), "utf8"))).toEqual({
			cachedAt: "2026-11-03T12:00:00Z",
			records: [HIT],
		})
	})

	it("asks again once the answer is 30 days old, and the new answer starts its own 30 days", async () => {
		const dir = folder()
		const web = kartverket()
		await findAddress(web.get, VALUE, KOMMUNE, new AddressCache(dir, { now: at(T_NOON) }))
		const almost = T_NOON + ADDRESS_MAX_AGE_DAYS * DAY_MS - 1
		await findAddress(web.get, VALUE, KOMMUNE, new AddressCache(dir, { now: at(almost) }))
		expect(web.asked).toHaveLength(1)
		const expired = new AddressCache(dir, { now: at(almost + 1) })
		expect(await findAddress(web.get, VALUE, KOMMUNE, expired)).toEqual(HIT)
		expect(web.asked).toHaveLength(2)
		expect({ lookups: expired.lookups, hits: expired.hits }).toEqual({ lookups: 1, hits: 0 })
		expect(JSON.parse(readFileSync(join(dir, fileFor(SEARCH)), "utf8")).cachedAt).toBe(
			"2026-12-03T12:00:00Z"
		)
	})

	it("caches an answer with no hits, so the empty search is not asked again", async () => {
		const dir = folder()
		const web = kartverket({ adresser: [] })
		const cache = new AddressCache(dir, { now: at(T_NOON) })
		expect(await findAddress(web.get, VALUE, KOMMUNE, cache)).toBeUndefined()
		expect(await findAddress(web.get, VALUE, KOMMUNE, cache)).toBeUndefined()
		expect(web.asked).toHaveLength(1)
	})
})

describe("AddressCache: what is never cached", () => {
	it("never caches a 503, a stopped host or a body that is not an answer", async () => {
		const dir = folder()
		const cache = new AddressCache(dir, { now: at(T_NOON) })
		const unavailable: Get = async (url) => ({ ok: false, url, reason: "httpStatus", status: 503 })
		// A timeout stops the host, so every later request comes back hostSkipped.
		const stopped: Get = async (url) => ({ ok: false, url, reason: "hostSkipped" })
		const notJson = fakeGet({
			[addressQuery(SEARCH, KOMMUNE)]: { body: "<html></html>", contentType: "text/html" },
		})
		const notAnAnswer = kartverket({ feil: "x" }).get
		for (const get of [unavailable, notJson, notAnAnswer]) {
			expect(await findAddress(get, VALUE, KOMMUNE, cache)).toBeUndefined()
		}
		// With a cache (verify), a stopped host is no answer at all: the kommune stops unfinished
		// instead of sending every later address to review as unknown.
		await expect(findAddress(stopped, VALUE, KOMMUNE, cache)).rejects.toThrow(AddressLookupError)
		// review has no cache and keeps today's answer: no hit.
		expect(await findAddress(stopped, VALUE, KOMMUNE)).toBeUndefined()
		expect(existsSync(dir)).toBe(false)
	})

	it("reads a file that does not parse as a miss", () => {
		const dir = folder()
		const cache = new AddressCache(dir, { now: at(T_NOON) })
		cache.write(SEARCH, KOMMUNE, [])
		writeFileSync(join(dir, fileFor(SEARCH)), "{ not json")
		expect(cache.read(SEARCH, KOMMUNE)).toBeUndefined()
		writeFileSync(join(dir, fileFor(SEARCH)), JSON.stringify({ cachedAt: "i går", records: [] }))
		expect(cache.read(SEARCH, KOMMUNE)).toBeUndefined()
		expect({ lookups: cache.lookups, hits: cache.hits }).toEqual({ lookups: 2, hits: 0 })
	})

	it("reads but never writes in a dry run", async () => {
		const dir = folder()
		const web = kartverket()
		const dry = new AddressCache(dir, { dryRun: true, now: at(T_NOON) })
		expect(await findAddress(web.get, VALUE, KOMMUNE, dry)).toEqual(HIT)
		expect(existsSync(dir)).toBe(false)
		new AddressCache(dir, { now: at(T_NOON) }).write(SEARCH, KOMMUNE, [HIT])
		expect(await findAddress(web.get, VALUE, KOMMUNE, dry)).toEqual(HIT)
		expect(web.asked).toHaveLength(1)
	})
})

describe("AddressCache: file names", () => {
	it("names each answer by the sha256 of its normalised key, never by the key", () => {
		const dir = folder()
		const cache = new AddressCache(dir, { now: at(T_NOON) })
		cache.write("storgata 1: æøå", KOMMUNE, [])
		const [name] = readdirSync(dir)
		expect(name).toMatch(/^[0-9a-f]{64}\.json$/)
		expect(name).toBe(fileFor("storgata 1: æøå"))
		// The same search in other capitals and spacing is the same answer; another kommune is not.
		expect(cache.read("Storgata  1: ÆØÅ", KOMMUNE)).toEqual([])
		cache.write("storgata 1: æøå", "3407", [])
		expect(readdirSync(dir)).toHaveLength(2)
	})
})

describe("AddressCache: purge", () => {
	it("removes answers over 90 days old, .tmp leftovers and files that do not parse", () => {
		const dir = folder()
		new AddressCache(dir, { now: at(T_NOON) }).write("storgata 1", KOMMUNE, [])
		new AddressCache(dir, { now: at(T_NOON + 10 * DAY_MS) }).write("storgata 2", KOMMUNE, [])
		writeFileSync(join(dir, `${fileFor("storgata 3")}.4242.tmp`), "{}")
		writeFileSync(join(dir, fileFor("storgata 4")), "{ not json")
		const removed = new AddressCache(dir).purge(T_NOON + (MAX_AGE_DAYS + 1) * DAY_MS)
		expect(removed).toBe(3)
		expect(readdirSync(dir)).toEqual([fileFor("storgata 2")])
	})

	it("purges nothing in a dry run, or when there is no folder", () => {
		const dir = folder()
		expect(new AddressCache(dir).purge(T_NOON)).toBe(0)
		new AddressCache(dir, { now: at(T_NOON) }).write("storgata 1", KOMMUNE, [])
		expect(new AddressCache(dir, { dryRun: true }).purge(T_NOON + 365 * DAY_MS)).toBe(0)
		expect(readdirSync(dir)).toHaveLength(1)
	})
})

describe("AddressCache: offline", () => {
	it("uses an answer of any age and sends no request", async () => {
		const dir = folder()
		await findAddress(kartverket().get, VALUE, KOMMUNE, new AddressCache(dir, { now: at(T_NOON) }))
		const offline = new AddressCache(dir, { offline: true, now: at(T_NOON + 80 * DAY_MS) })
		expect(await findAddress(offlineGet, VALUE, KOMMUNE, offline)).toEqual(HIT)
		expect({ lookups: offline.lookups, hits: offline.hits }).toEqual({ lookups: 1, hits: 1 })
	})

	it("fails on a miss and names the search and the kommune", async () => {
		const offline = new AddressCache(folder(), { offline: true, now: at(T_NOON) })
		expect(() => offline.read("storgata 9", KOMMUNE)).toThrow(OfflineMissError)
		await expect(
			findAddress(offlineGet, "Storgata 9, 2999 Eksempelby", KOMMUNE, offline)
		).rejects.toThrow('offline: not in the cache: address search "storgata 9" in kommune 3405')
	})

	it("lets no request through: offlineGet fails and names the URL", async () => {
		const url = "https://www.eksempel.kommune.no/a/"
		await expect(offlineGet(url, "html")).rejects.toThrow(OfflineMissError)
		await expect(offlineGet(url, "html")).rejects.toThrow(`offline: not in the cache: ${url}`)
	})
})

describe("resolveAddresses with the cache", () => {
	it("asks once for two spellings of one search: the second is a cache hit", async () => {
		const web = kartverket()
		const cache = new AddressCache(folder(), { now: at(T_NOON) })
		const map = await resolveAddresses(
			web.get,
			[VALUE, "Storgata 1, 2999 EKSEMPELBY"],
			KOMMUNE,
			cache
		)
		expect(web.asked).toHaveLength(1)
		expect(map.get("Storgata 1, 2999 EKSEMPELBY")).toEqual(HIT)
		expect({ lookups: cache.lookups, hits: cache.hits }).toEqual({ lookups: 2, hits: 1 })
	})
})
```

- [ ] **Step 7: Run it to see it fail**

Run: `npx vitest run test/addressCache.test.ts`
Expected: FAIL, the modules `../src/io/addressCache.ts` and `../src/io/offline.ts` do not exist.

- [ ] **Step 8: Create `src/io/offline.ts`**

```ts
import type { Get } from "../net/crawler.ts"

// A gap PR scores from the local caches only (spec, "Gap PRs score offline"): nothing expires and
// nothing is fetched, so a page or an answer the cache lacks is an error, never a request. what
// names the URL or the search that missed. The message is printed on my own terminal only.
export class OfflineMissError extends Error {
	readonly what: string

	constructor(what: string) {
		super(`offline: not in the cache: ${what}`)
		this.name = "OfflineMissError"
		this.what = what
	}
}

// The get() an offline stage hands on: every request fails and names its URL.
export const offlineGet: Get = (url) => Promise.reject(new OfflineMissError(url))
```

- [ ] **Step 9: Create `src/io/addressCache.ts`**

```ts
import { createHash } from "node:crypto"
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { z } from "zod"
import { isoSeconds } from "../net/clock.ts"
import type { AddressRecord } from "../registers/kartverket.ts"
import { UtcTimestamp } from "../schema/common.ts"
import { normaliseText } from "../text/normalise.ts"
import { writeJsonAtomic } from "./files.ts"
import { OfflineMissError } from "./offline.ts"
import { DAY_MS, MAX_AGE_DAYS } from "./pageCache.ts"

// A Kartverket answer is used for 30 days, then asked again (spec, "Kartverket pace and cache").
export const ADDRESS_MAX_AGE_DAYS = 30
const ANSWER_FILE = /^[0-9a-f]{64}\.json$/

const CachedAnswer = z.strictObject({
	cachedAt: UtcTimestamp,
	records: z.array(
		z.strictObject({
			addressId: z.string(),
			kommune: z.string(),
			text: z.string(),
			postcode: z.string().optional(),
			poststed: z.string().optional(),
		})
	),
})
type CachedAnswer = z.infer<typeof CachedAnswer>

// Kartverket's answers on disk, next to the page cache (<cache>/kartverket/), one file per search
// and kommune. The search is page text and can hold a name, or a character a Windows file name
// cannot, so each file is named by the sha256 of the normalised key, never the key itself. Only
// an answer that parsed is written, an empty one included: a 503 or a timeout never pins a wrong
// answer for 30 days. Offline, any age counts and a miss is an error. Locally the folder is
// gitignored like the rest of .cache/; in Actions it is the job's temporary folder.
export class AddressCache {
	readonly dir: string
	lookups = 0
	hits = 0
	readonly #offline: boolean
	readonly #dryRun: boolean
	readonly #now: () => number

	constructor(
		dir: string,
		options: { offline?: boolean; dryRun?: boolean; now?: () => number } = {}
	) {
		this.dir = dir
		this.#offline = options.offline ?? false
		this.#dryRun = options.dryRun ?? false
		this.#now = options.now ?? Date.now
	}

	// The cached records for a search, when fresh (any age offline). Each call counts a lookup.
	read(search: string, kommune: string): AddressRecord[] | undefined {
		this.lookups++
		const answer = this.#load(this.#path(search, kommune))
		if (answer !== undefined && (this.#offline || this.#fresh(answer))) {
			this.hits++
			return answer.records
		}
		if (this.#offline) {
			throw new OfflineMissError(`address search "${search}" in kommune ${kommune}`)
		}
		return undefined
	}

	write(search: string, kommune: string, records: readonly AddressRecord[]): void {
		if (this.#dryRun) return
		writeJsonAtomic(this.#path(search, kommune), {
			cachedAt: isoSeconds(this.#now()),
			records,
		})
	}

	// Deletes answers cached over 90 days ago (the page cache's limit), answer files that do not
	// parse (their age is unknown), and .tmp leftovers from a write that stopped halfway.
	purge(nowMs: number): number {
		if (this.#dryRun || !existsSync(this.dir)) return 0
		const cutoff = nowMs - MAX_AGE_DAYS * DAY_MS
		let removed = 0
		for (const name of readdirSync(this.dir)) {
			let stale = name.endsWith(".tmp")
			if (ANSWER_FILE.test(name)) {
				const answer = this.#load(join(this.dir, name))
				stale = answer === undefined || Date.parse(answer.cachedAt) < cutoff
			}
			if (stale) {
				rmSync(join(this.dir, name))
				removed++
			}
		}
		return removed
	}

	#path(search: string, kommune: string): string {
		const key = `${kommune}\n${normaliseText(search)}`
		return join(this.dir, `${createHash("sha256").update(key).digest("hex")}.json`)
	}

	#fresh(answer: CachedAnswer): boolean {
		return this.#now() - Date.parse(answer.cachedAt) < ADDRESS_MAX_AGE_DAYS * DAY_MS
	}

	// A file that is missing or does not parse is a miss. Its text is never printed.
	#load(path: string): CachedAnswer | undefined {
		if (!existsSync(path)) return undefined
		try {
			const parsed = CachedAnswer.safeParse(JSON.parse(readFileSync(path, "utf8")))
			return parsed.success ? parsed.data : undefined
		} catch {
			return undefined
		}
	}
}
```

`search` is the `streetKey(...)` text `findAddress` sends, which is already normalised; `normaliseText` again changes nothing for it and gives a caller with another spelling the same file.

- [ ] **Step 10: `findAddress` reads the cache first, and `resolveAddresses` takes it through**

In `src/registers/kartverket.ts`, add `import type { AddressCache } from "../io/addressCache.ts"` to the imports and drop `import { readJson } from "./json.ts"` (nothing else in the file uses it). Add `AddressLookupError` above `findAddress`, and replace `findAddress` (lines 61-72 after Task 2), before:

```ts
export async function findAddress(
	get: Get,
	wanted: string,
	kommune: string
): Promise<AddressHit | undefined> {
	const parts = splitAddress(wanted)
	if (parts === undefined) return undefined
	const records = parseAddressSearch(
		await readJson(get, addressQuery(streetKey(parts.street), kommune))
	)
	return records === undefined ? undefined : pickAddress(records, wanted)
}
```

After:

```ts
// One timeout, network error or server error stops api.kartverket.no for the rest of the run, and
// every later request comes back hostSkipped. In verify that is no answer at all: reading it as
// "unknown address" would send every later address to review, and a resume would then skip those
// locks. The message names no search, since a search is page text.
export class AddressLookupError extends Error {
	constructor() {
		super(
			"Kartverket stopped answering in this run, so no address was checked and nothing was written: run verify --resume later"
		)
		this.name = "AddressLookupError"
	}
}

// The cache first (when given), then Kartverket, then the cache again: only an answer that parsed
// is written, so a failed request (a 503, a stopped host) or a body that is no answer is asked
// again next time. Offline, the cache throws on a miss before any request. A stopped host throws
// AddressLookupError when a cache is given (verify); review passes none and gets no hit.
export async function findAddress(
	get: Get,
	wanted: string,
	kommune: string,
	cache?: AddressCache
): Promise<AddressHit | undefined> {
	const parts = splitAddress(wanted)
	if (parts === undefined) return undefined
	const search = streetKey(parts.street)
	const cached = cache?.read(search, kommune)
	if (cached !== undefined) return pickAddress(cached, wanted)
	const res = await get(addressQuery(search, kommune), "json")
	if (!res.ok && res.reason === "hostSkipped" && cache !== undefined) throw new AddressLookupError()
	if (!res.ok) return undefined
	let body: unknown
	try {
		body = JSON.parse(res.body)
	} catch {
		return undefined
	}
	const records = parseAddressSearch(body)
	if (records === undefined) return undefined
	cache?.write(search, kommune, records)
	return pickAddress(records, wanted)
}
```

In `src/verify/context.ts`, add `import type { AddressCache } from "../io/addressCache.ts"`, and replace lines 85-95, before:

```ts
// Each distinct address once, through Kartverket, before any gate runs: the gates are
// synchronous, the address API is not.
export async function resolveAddresses(
	get: Get,
	addresses: Iterable<string>,
	kommune: string
): Promise<Map<string, AddressHit | undefined>> {
	const distinct = [...new Set(addresses)]
	const hits = await Promise.all(distinct.map((a) => findAddress(get, a, kommune)))
	return new Map(distinct.map((a, i) => [a, hits[i]]))
}
```

After:

```ts
// Each distinct address once, through Kartverket and its cache, before any gate runs: the gates
// are synchronous, the address API is not. One at a time: the crawler sends Kartverket one
// request at a time anyway, and this way a second spelling of one search ("2999 Eksempelby" and
// "2999 EKSEMPELBY") finds the answer the first one cached.
export async function resolveAddresses(
	get: Get,
	addresses: Iterable<string>,
	kommune: string,
	cache?: AddressCache
): Promise<Map<string, AddressHit | undefined>> {
	const found = new Map<string, AddressHit | undefined>()
	for (const a of addresses) {
		if (!found.has(a)) found.set(a, await findAddress(get, a, kommune, cache))
	}
	return found
}
```

`verifyKommune` still calls `resolveAddresses(input.get, wanted, k.kommune)` with no cache; Task 6 adds the cache to `VerifyInput` and passes it here.

- [ ] **Step 11: Run the tests to see them pass**

Run: `npx vitest run test/addressCache.test.ts test/pace.test.ts test/kartverket.test.ts test/context.test.ts && npm test`
Expected: PASS. The context test "asks Kartverket once per distinct address" still counts one request.

- [ ] **Step 12: Show it red once**

In `#state`, write `const floorMs = FLOOR_MS` instead of `floorFor(server)`. Run `npx vitest run test/pace.test.ts`: FAIL on "asks Kartverket a second apart" (sleeps start `5000, 5000`). Restore, run: PASS. In `#pace`, drop `delay` from the `Math.max`. Run it: FAIL on "waits Kartverket's own Crawl-delay" (`1000, 1000`). Restore, run: PASS. In `AddressCache.read`, change `(this.#offline || this.#fresh(answer))` to `true`. Run `npx vitest run test/addressCache.test.ts`: FAIL on "asks again once the answer is 30 days old" (one request, not two). Restore, run: PASS. In `findAddress`, move the write above the check as `cache?.write(search, kommune, records ?? [])`. Run it: FAIL on "never caches a 503, a stopped host or a body that is not an answer" (the folder exists). Restore, run: PASS. In `findAddress`, delete the `throw new AddressLookupError()` line. Run it: FAIL on "never caches a 503, a stopped host or a body that is not an answer" (the promise resolves instead of rejecting). Restore, run: PASS. Note all five for the PR body.

- [ ] **Step 13: Check the network boundary**

`test/networkBoundary.test.ts` scans every `.ts` file under `src/` recursively and fails on any network import outside `src/net/`, so `src/io/addressCache.ts`, `src/io/offline.ts` and Task 1's `src/pilot/list.ts` are covered without a change. Its list of named files only proves the scan reaches the PR 3 folders. Run: `npx vitest run test/networkBoundary.test.ts`. Expected: PASS.

- [ ] **Step 14: Format, types, lint, tests, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm run lint && npm test
git add src/net/types.ts src/net/crawler.ts src/discover/types.ts src/io/addressCache.ts src/io/offline.ts src/registers/kartverket.ts src/verify/context.ts test/pace.test.ts test/addressCache.test.ts test/crawler.test.ts
git commit -m "feat(pipeline): pace Kartverket at one second and cache its answers for 30 days"
```

### Task 4: The page-cache journal, `fetch --resume`, progress lines and the cache lock

A run over 47 kommuner takes an afternoon, so it must survive Ctrl+C and a sleeping PC. Each stored page appends one line to `manifest.jsonl`, so a stop loses only the pages in flight. `fetch --resume` goes on with the same run id and asks only for what is missing, and its crawl report is merged into the stopped run's report so a host stopped in run 1 keeps its stop (Review Focus 1). A `run.lock` in the cache folder keeps a second process out. Progress lines, the stage timing and the Kartverket purge ride along.

**Files:**
- Create: `pipeline/src/io/runLock.ts`, `pipeline/src/io/timings.ts`, `pipeline/src/fetch/progress.ts`
- Modify: `pipeline/src/io/pageCache.ts` (whole file, 117 lines), `pipeline/src/fetch/fetchPages.ts` (whole file, 89 lines), `pipeline/src/cli/fetch.ts` (whole file), `pipeline/src/cli/discover.ts` (imports at lines 4-13, the purge at lines 64-69, the catch at lines 71-77), `pipeline/test/pageCache.test.ts` (line 81)
- Test: `pipeline/test/journal.test.ts`, `pipeline/test/runLock.test.ts`, `pipeline/test/resumeFetch.test.ts`, `pipeline/test/progress.test.ts`, `pipeline/test/timings.test.ts` (all new)

**Interfaces:**
- Consumes: `parseOnly`, `selects` (`src/pilot/list.ts`, Task 1); `HostLine` with `delayMs` and `AddressCache` with `purge(nowMs)` (Task 3); `Crawler.report()`, `HOST_STOPS`, `SKIP_REASONS`, `CrawlReport`, `Get` (`src/net/crawler.ts`); `readPage` (`src/adapters/read.ts`); `writeFileAtomic`, `writeJsonAtomic` (`src/io/files.ts`); `readDiscovery` (`src/discover/files.ts`); `fakeGet` (`test/netHelpers.ts`).
- Produces:
  - `src/io/pageCache.ts`: `ManifestEntry` gains `runId: z.string().regex(/^[0-9a-z-]{8,40}$/).optional()`; `new PageCache(dir, { dryRun?, runId? })`; `put` appends one line to `manifest.jsonl`; `save()` writes `manifest.json` once and empties the journal; `readRunId(dir: string): string | undefined`; `writeRunId(dir: string, runId: string): void`.
  - `src/io/runLock.ts`: `RUN_LOCK = "run.lock"`, `class CacheBusyError extends Error`, `pidAlive(pid: number): boolean`, `holdCache(dir: string, isAlive?: (pid: number) => boolean): { release: () => void }`.
  - `src/fetch/fetchPages.ts`: `resumeFilter(urls, cache, runId, nowMs): string[]`, `mergeCrawlReports(previous, current, tried?): CrawlReport`, `readCrawlReport(path: string): CrawlReport | undefined`, `urlsByKommune(kommuner, limit?): Map<string, string[]>`, `fetchPages(get, cache, urls, onPage?)`.
  - `src/fetch/progress.ts`: `class KommuneProgress { constructor(byKommune, names, print); page(url): void; heartbeat(): void }`.
  - `src/io/timings.ts`: `recordTiming(cacheDir: string, stage: string, ms: number): void`, `readTimings(cacheDir: string): Record<string, number>`.

- [ ] **Step 1: Write the failing tests**

Create `pipeline/test/journal.test.ts`:

```ts
import { randomUUID } from "node:crypto"
import { appendFileSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { PageCache, readRunId, writeRunId } from "../src/io/pageCache.ts"
import type { Fetched } from "../src/net/crawler.ts"

const A = "https://www.eksempel.kommune.no/a/"
const B = "https://www.eksempel.kommune.no/b/"
const C = "https://www.eksempel.kommune.no/c/"
const RUN = "run-0001-eksempel"
const NOW = Date.parse("2026-11-13T12:00:00Z")

const page = (
	url: string,
	body = "<main>Eksempel helsestasjon</main>",
	fetchedAt = "2026-11-13T09:00:00Z"
): Fetched => ({
	ok: true,
	url,
	finalUrl: url,
	status: 200,
	contentType: "text/html",
	headers: {},
	body,
	fetchedAt,
})
const tmp = () => mkdtempSync(join(tmpdir(), "varde-journal-"))
const journal = (dir: string) => join(dir, "manifest.jsonl")

describe("the page-cache journal", () => {
	it("knows a page that was put but never saved, after a reload", () => {
		const dir = tmp()
		const entry = new PageCache(dir).put(page(A))
		expect(existsSync(join(dir, "manifest.json"))).toBe(false)
		const reloaded = new PageCache(dir)
		expect(reloaded.get(A)).toEqual(entry)
		expect(reloaded.read(entry)).toBe("<main>Eksempel helsestasjon</main>")
	})

	it("appends one line per page, and keeps page text out of it", () => {
		const dir = tmp()
		const cache = new PageCache(dir)
		cache.put(page(A))
		cache.put(page(B))
		const text = readFileSync(journal(dir), "utf8")
		expect(text.split("\n")).toHaveLength(3)
		expect(text.endsWith("\n")).toBe(true)
		expect(text).not.toContain("Eksempel helsestasjon")
	})

	it("loads without a last line that was cut off, and starts the next line on its own", () => {
		const dir = tmp()
		const first = new PageCache(dir).put(page(A))
		appendFileSync(
			journal(dir),
			'{"url":"https://www.eksempel.kommune.no/b/","finalUrl":"https://www.eks'
		)
		const reloaded = new PageCache(dir)
		expect(reloaded.entries()).toEqual([first])
		const third = reloaded.put(page(C))
		expect(new PageCache(dir).entries()).toEqual([first, third])
	})

	it("skips a line that is JSON but not a manifest entry", () => {
		const dir = tmp()
		const first = new PageCache(dir).put(page(A))
		appendFileSync(journal(dir), '{"url":"https://www.eksempel.kommune.no/b/"}\n')
		expect(new PageCache(dir).entries()).toEqual([first])
	})

	it("folds the journal over the saved manifest, the later line winning per URL", () => {
		const dir = tmp()
		const cache = new PageCache(dir)
		cache.put(page(A))
		const b = cache.put(page(B))
		cache.save()
		const newer = new PageCache(dir).put(page(A, "<main>Ny tekst</main>", "2026-11-13T10:00:00Z"))
		const reloaded = new PageCache(dir)
		expect(reloaded.entries()).toEqual([newer, b])
		expect(reloaded.read(newer)).toBe("<main>Ny tekst</main>")
	})

	it("save() writes the manifest once and empties the journal", () => {
		const dir = tmp()
		const cache = new PageCache(dir)
		const a = cache.put(page(A))
		const b = cache.put(page(B))
		cache.save()
		expect(readFileSync(journal(dir), "utf8")).toBe("")
		expect(JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")).entries).toEqual([a, b])
		expect(new PageCache(dir).entries()).toEqual([a, b])
	})

	it("still refuses a page whose file changed after its line was written", () => {
		const dir = tmp()
		const entry = new PageCache(dir).put(page(A))
		writeFileSync(join(dir, entry.file), "<main>Endret etter journalen</main>")
		const reloaded = new PageCache(dir)
		expect(reloaded.get(A)).toEqual(entry)
		expect(reloaded.read(entry)).toBeUndefined()
	})

	it("purges an old page the journal knows, and keeps the journal file", () => {
		const dir = tmp()
		new PageCache(dir).put(page(A, "<main>Gammel</main>", "2026-07-01T12:00:00Z"))
		const fresh = new PageCache(dir).put(page(B))
		const cache = new PageCache(dir)
		expect(cache.purge(NOW)).toBe(1)
		expect(cache.entries()).toEqual([fresh])
		expect(existsSync(journal(dir))).toBe(true)
		cache.save()
		expect(new PageCache(dir).entries()).toEqual([fresh])
	})

	it("writes no journal in a dry run", () => {
		const dir = join(tmp(), "pages")
		const cache = new PageCache(dir, { dryRun: true, runId: RUN })
		cache.put(page(A))
		cache.save()
		expect(existsSync(dir)).toBe(false)
	})

	it("stamps each entry with the run id, and refuses a malformed one", () => {
		const dir = tmp()
		const entry = new PageCache(dir, { runId: RUN }).put(page(A))
		expect(entry.runId).toBe(RUN)
		expect(new PageCache(dir).get(A)?.runId).toBe(RUN)
		expect(new PageCache(tmp()).put(page(A)).runId).toBeUndefined()
		expect(() => new PageCache(tmp(), { runId: "Kari Nordmann" })).toThrow("run id")
	})
})

describe("run ids", () => {
	it("reads back the id a new run wrote, and nothing from a missing or broken run.json", () => {
		const dir = tmp()
		expect(readRunId(dir)).toBeUndefined()
		writeRunId(dir, RUN)
		expect(readRunId(dir)).toBe(RUN)
		writeFileSync(join(dir, "run.json"), "{ ikke json")
		expect(readRunId(dir)).toBeUndefined()
		writeFileSync(join(dir, "run.json"), JSON.stringify({ runId: "Kari Nordmann" }))
		expect(readRunId(dir)).toBeUndefined()
	})

	it("takes the id randomUUID gives", () => {
		const dir = tmp()
		const id = randomUUID()
		writeRunId(dir, id)
		expect(readRunId(dir)).toBe(id)
		expect(() => writeRunId(dir, "Kari Nordmann")).toThrow("run id")
	})
})
```

Create `pipeline/test/runLock.test.ts`:

```ts
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { CacheBusyError, holdCache, pidAlive } from "../src/io/runLock.ts"

// A pages folder inside a fresh temporary folder, so the message names "pages/run.lock".
function pagesDir(): string {
	const dir = join(mkdtempSync(join(tmpdir(), "varde-runlock-")), "pages")
	mkdirSync(dir, { recursive: true })
	return dir
}
const lockOf = (dir: string) => join(dir, "run.lock")

describe("holdCache", () => {
	it("writes run.lock with my process id, and removes it on release", () => {
		const dir = pagesDir()
		const held = holdCache(dir)
		expect(readFileSync(lockOf(dir), "utf8")).toBe(`${process.pid}\n`)
		held.release()
		expect(existsSync(lockOf(dir))).toBe(false)
	})

	it("refuses a second fetch on a held cache, and names the lock file", () => {
		const dir = pagesDir()
		const held = holdCache(dir)
		expect(() => holdCache(dir)).toThrow(CacheBusyError)
		expect(() => holdCache(dir)).toThrow("pages/run.lock")
		expect(() => holdCache(dir)).toThrow("another fetch, extract or verify is running")
		held.release()
	})

	it("refuses a lock whose process is alive, and leaves it as it was", () => {
		const dir = pagesDir()
		writeFileSync(lockOf(dir), "4242\n")
		expect(() => holdCache(dir, (pid) => pid === 4242)).toThrow(CacheBusyError)
		expect(readFileSync(lockOf(dir), "utf8")).toBe("4242\n")
	})

	it("takes over a lock whose process is gone", () => {
		const dir = pagesDir()
		writeFileSync(lockOf(dir), "4242\n")
		const held = holdCache(dir, () => false)
		expect(readFileSync(lockOf(dir), "utf8")).toBe(`${process.pid}\n`)
		held.release()
	})

	it("takes over a lock it cannot read a process id from", () => {
		const dir = pagesDir()
		writeFileSync(lockOf(dir), "Kari Nordmann")
		const held = holdCache(dir, () => true)
		expect(readFileSync(lockOf(dir), "utf8")).toBe(`${process.pid}\n`)
		held.release()
	})

	it("releases once, and never removes a later holder's lock", () => {
		const dir = pagesDir()
		const first = holdCache(dir)
		first.release()
		const second = holdCache(dir)
		first.release()
		expect(existsSync(lockOf(dir))).toBe(true)
		second.release()
		expect(existsSync(lockOf(dir))).toBe(false)
	})

	it("creates the folder when it does not exist yet", () => {
		const dir = join(mkdtempSync(join(tmpdir(), "varde-runlock-")), "ny", "pages")
		const held = holdCache(dir)
		expect(existsSync(lockOf(dir))).toBe(true)
		held.release()
	})
})

describe("pidAlive", () => {
	it("finds my own process alive", () => {
		expect(pidAlive(process.pid)).toBe(true)
	})
})
```

Create `pipeline/test/resumeFetch.test.ts`:

```ts
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import type { KommuneDiscovery } from "../src/discover/types.ts"
import {
	fetchPages,
	mergeCrawlReports,
	pagesToFetch,
	readCrawlReport,
	resumeFilter,
	urlsByKommune,
} from "../src/fetch/fetchPages.ts"
import { writeJsonAtomic } from "../src/io/files.ts"
import { DAY_MS, PageCache } from "../src/io/pageCache.ts"
import type { CrawlReport, Get } from "../src/net/crawler.ts"
import { fakeGet } from "./netHelpers.ts"

const K = "https://www.eksempel.kommune.no"
const A = `${K}/a/`
const B = `${K}/b/`
const C = `${K}/c/`
const RUN = "run-0001-eksempel"
// fakeGet stamps every page with this fetch time.
const FETCHED = Date.parse("2026-11-03T12:00:00Z")
const body = { body: "<main>Eksempel helsestasjon</main>", contentType: "text/html" }
const tmp = () => mkdtempSync(join(tmpdir(), "varde-resume-"))

// fakeGet's answers, with every URL asked for recorded.
function recording(routes: Parameters<typeof fakeGet>[0]): { get: Get; asked: string[] } {
	const inner = fakeGet(routes)
	const asked: string[] = []
	const get: Get = async (url, kind) => {
		asked.push(url)
		return inner(url, kind)
	}
	return { get, asked }
}

describe("fetch --resume", () => {
	it("fetches only the pages a stopped run is missing", async () => {
		const dir = tmp()
		// Run 1 stores A and B, C fails, and the run stops before save().
		const first = recording({ [A]: body, [B]: body })
		await fetchPages(first.get, new PageCache(dir, { runId: RUN }), [A, B, C])
		expect([...first.asked].sort()).toEqual([A, B, C])
		// The resumed run is a new process: a new cache over the same folder, the same run id,
		// two days later. A and B are this run's, so their age does not matter.
		const cache = new PageCache(dir, { runId: RUN })
		const todo = resumeFilter([A, B, C], cache, RUN, FETCHED + 2 * DAY_MS)
		expect(todo).toEqual([C])
		const second = recording({ [A]: body, [B]: body, [C]: body })
		const summary = await fetchPages(second.get, cache, todo)
		expect(second.asked).toEqual([C])
		expect(summary).toMatchObject({ pages: 1, fetched: 1 })
		expect(cache.entries().map((e) => e.url)).toEqual([A, B, C])
	})

	it("skips another run's page under 24 hours old, and fetches it again from 24 hours on", async () => {
		const dir = tmp()
		await fetchPages(fakeGet({ [A]: body }), new PageCache(dir, { runId: "run-0000-tidligere" }), [
			A,
		])
		const cache = new PageCache(dir, { runId: RUN })
		expect(resumeFilter([A], cache, RUN, FETCHED + DAY_MS - 1)).toEqual([])
		expect(resumeFilter([A], cache, RUN, FETCHED + DAY_MS)).toEqual([A])
	})

	it("fetches again a page whose file no longer matches its entry", async () => {
		const dir = tmp()
		const cache = new PageCache(dir, { runId: RUN })
		await fetchPages(fakeGet({ [A]: body }), cache, [A])
		const entry = cache.get(A)
		if (entry === undefined) throw new Error("the page was not stored")
		writeFileSync(join(dir, entry.file), "<main>Endret</main>")
		expect(resumeFilter([A], new PageCache(dir, { runId: RUN }), RUN, FETCHED)).toEqual([A])
	})
})

describe("fetchPages onPage", () => {
	it("is called once per URL, fetched or not", async () => {
		const seen: string[] = []
		const cache = new PageCache(tmp(), { dryRun: true })
		await fetchPages(fakeGet({ [A]: body }), cache, [A, B], (url) => seen.push(url))
		expect(seen.sort()).toEqual([A, B])
	})
})

describe("mergeCrawlReports", () => {
	const W = "www.eksempel.kommune.no"
	const BOOKING = "booking.eksempel.kommune.no"
	const BOOKING_PAGE = `https://${BOOKING}/time/`
	const previous: CrawlReport = {
		hosts: [
			{ host: BOOKING, requests: 3, delayMs: 5_000, stopped: "timeout" },
			{ host: W, requests: 40, delayMs: 5_000, stopped: "network" },
		],
		notFetched: [
			{ ok: false, url: BOOKING_PAGE, reason: "hostSkipped" },
			{ ok: false, url: A, reason: "hostSkipped" },
			{ ok: false, url: B, reason: "robots" },
		],
	}

	it("keeps the stop of a host the resumed run never touched", () => {
		const current: CrawlReport = {
			hosts: [{ host: W, requests: 2, delayMs: 5_000 }],
			notFetched: [],
		}
		const merged = mergeCrawlReports(previous, current, [A])
		// Requests add up over both runs; the resumed run's line (no stop) wins otherwise.
		expect(merged.hosts).toEqual([
			{ host: BOOKING, requests: 3, delayMs: 5_000, stopped: "timeout" },
			{ host: W, requests: 42, delayMs: 5_000 },
		])
		expect(merged.notFetched.map((n) => n.url)).toEqual([BOOKING_PAGE, B])
	})

	it("lets the current run's line win for a URL it tried again", () => {
		const current: CrawlReport = {
			hosts: [{ host: W, requests: 1, delayMs: 5_000 }],
			notFetched: [{ ok: false, url: B, reason: "httpStatus", status: 404 }],
		}
		for (const merged of [
			mergeCrawlReports(previous, current, [B]),
			mergeCrawlReports(previous, current),
		]) {
			expect(merged.notFetched.filter((n) => n.url === B)).toEqual([
				{ ok: false, url: B, reason: "httpStatus", status: 404 },
			])
		}
	})

	it("sorts hosts by name as report() does, and gives the current report alone with no previous one", () => {
		const current: CrawlReport = {
			hosts: [{ host: "aaa.eksempel.kommune.no", requests: 1, delayMs: 5_000 }],
			notFetched: [],
		}
		expect(mergeCrawlReports(previous, current).hosts.map((h) => h.host)).toEqual([
			"aaa.eksempel.kommune.no",
			BOOKING,
			W,
		])
		expect(mergeCrawlReports(undefined, current)).toEqual(current)
	})
})

describe("readCrawlReport", () => {
	it("reads the report fetch wrote, and nothing from a missing, broken or older file", () => {
		const path = join(tmp(), "report.json")
		expect(readCrawlReport(path)).toBeUndefined()
		const report: CrawlReport = {
			hosts: [{ host: "www.eksempel.kommune.no", requests: 2, delayMs: 5_000, stopped: "timeout" }],
			notFetched: [{ ok: false, url: A, reason: "hostSkipped" }],
		}
		writeJsonAtomic(path, report)
		expect(readCrawlReport(path)).toEqual(report)
		writeFileSync(path, "{ ikke json")
		expect(readCrawlReport(path)).toBeUndefined()
		// A report written before hosts carried their crawl delay.
		writeJsonAtomic(path, { hosts: [{ host: "www.eksempel.kommune.no", requests: 1 }], notFetched: [] })
		expect(readCrawlReport(path)).toBeUndefined()
	})
})

describe("urlsByKommune", () => {
	const kommune = (code: string, urls: string[]): KommuneDiscovery => ({
		kommune: code,
		name: "Eksempelby",
		discoveredAt: "2026-11-13T09:00:00Z",
		brregComplete: true,
		allSitemapUrls: [],
		units: [],
		pages: urls.map((url) => ({ url, from: "sitemap" })),
	})

	it("gives each kommune's pages, at most limit, as pagesToFetch takes them", () => {
		const kommuner = [kommune("3405", [A, B, C]), kommune("3407", [A])]
		expect(urlsByKommune(kommuner, 2)).toEqual(
			new Map([
				["3405", [A, B]],
				["3407", [A]],
			])
		)
		expect([...urlsByKommune(kommuner).values()].flat()).toEqual([A, B, C, A])
		expect(pagesToFetch(kommuner, undefined, 2)).toEqual([A, B])
	})
})
```

Create `pipeline/test/progress.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { KommuneProgress } from "../src/fetch/progress.ts"

const K = "https://www.eksempel.kommune.no"
const A = `${K}/a/`
const B = `${K}/b/`
const C = `${K}/c/`
const NAMES = new Map([
	["3401", "Eksempelby"],
	["3405", "Nordre Eksempelby"],
	["3407", "Søndre Eksempelby"],
])

function progress(byKommune: Map<string, string[]>) {
	const lines: string[] = []
	const p = new KommuneProgress(byKommune, NAMES, (line) => lines.push(line))
	return { p, lines }
}

describe("KommuneProgress", () => {
	it("prints a kommune done when its last page settles, a shared page counting for both", () => {
		const { p, lines } = progress(
			new Map([
				["3401", [A, B]],
				["3405", [B, C]],
				["3407", []],
			])
		)
		// A kommune with nothing left to fetch is done when progress starts.
		expect(lines).toEqual(["fetch: 3407 Søndre Eksempelby done (1 of 3)"])
		p.page(A)
		expect(lines).toHaveLength(1)
		p.page(B)
		p.page(B)
		p.page(C)
		expect(lines).toEqual([
			"fetch: 3407 Søndre Eksempelby done (1 of 3)",
			"fetch: 3401 Eksempelby done (2 of 3)",
			"fetch: 3405 Nordre Eksempelby done (3 of 3)",
		])
	})

	it("prints the heartbeat with pages and kommuner, and no host or URL", () => {
		const { p, lines } = progress(
			new Map([
				["3401", [A, B]],
				["3405", [B, C]],
			])
		)
		p.heartbeat()
		p.page(A)
		p.page(B)
		p.heartbeat()
		expect(lines).toEqual([
			"fetch: 0 of 3 pages, 0 of 2 kommuner",
			"fetch: 3401 Eksempelby done (1 of 2)",
			"fetch: 2 of 3 pages, 1 of 2 kommuner",
		])
		for (const line of lines) expect(line).not.toMatch(/https:|eksempel\.kommune/)
	})

	it("ignores a URL outside every kommune, and writes large counts with a comma", () => {
		const many = Array.from({ length: 1_200 }, (_, i) => `${K}/side-${i}/`)
		const { p, lines } = progress(new Map([["3401", many]]))
		p.page("https://www.nav.no/kontor/nav-eksempel")
		p.heartbeat()
		expect(lines).toEqual(["fetch: 0 of 1,200 pages, 0 of 1 kommuner"])
	})

	it("prints the number alone for a kommune with no name", () => {
		const { lines } = progress(new Map([["3499", []]]))
		expect(lines).toEqual(["fetch: 3499 done (1 of 1)"])
	})
})
```

Create `pipeline/test/timings.test.ts`:

```ts
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { readTimings, recordTiming } from "../src/io/timings.ts"

const tmp = () => mkdtempSync(join(tmpdir(), "varde-timings-"))

describe("stage timings", () => {
	it("merges each stage's time into timings.json, sorted, the newest time per stage winning", () => {
		const dir = tmp()
		expect(readTimings(dir)).toEqual({})
		recordTiming(dir, "verify", 1_500.4)
		recordTiming(dir, "fetch", 60_000)
		recordTiming(dir, "verify", 2_000)
		expect(readTimings(dir)).toEqual({ fetch: 60_000, verify: 2_000 })
		const text = readFileSync(join(dir, "timings.json"), "utf8")
		expect(Object.keys(JSON.parse(text))).toEqual(["fetch", "verify"])
		expect(readdirSync(dir)).toEqual(["timings.json"])
	})

	it("rounds to whole milliseconds", () => {
		const dir = tmp()
		recordTiming(dir, "extract", 1_500.4)
		expect(readTimings(dir)).toEqual({ extract: 1_500 })
	})

	it("starts over from a file that does not parse or does not fit", () => {
		const dir = tmp()
		writeFileSync(join(dir, "timings.json"), "{ ikke json")
		expect(readTimings(dir)).toEqual({})
		writeFileSync(join(dir, "timings.json"), JSON.stringify({ fetch: "lenge" }))
		expect(readTimings(dir)).toEqual({})
		recordTiming(dir, "extract", 10)
		expect(readTimings(dir)).toEqual({ extract: 10 })
	})
})
```

In `pipeline/test/pageCache.test.ts`, the purge test now also finds the journal in the folder. Change line 81:

```ts
		expect(readdirSync(dir)).toEqual([fresh.file])
```

to:

```ts
		expect(readdirSync(dir).sort()).toEqual([fresh.file, "manifest.jsonl"].sort())
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run test/journal.test.ts test/runLock.test.ts test/resumeFetch.test.ts test/progress.test.ts test/timings.test.ts test/pageCache.test.ts`
Expected: FAIL. `src/io/runLock.ts`, `src/io/timings.ts` and `src/fetch/progress.ts` do not exist; `readRunId`, `writeRunId`, `resumeFilter`, `mergeCrawlReports`, `readCrawlReport` and `urlsByKommune` are not exported; `pageCache.test.ts` fails on the purge test because no `manifest.jsonl` is written yet.

- [ ] **Step 3: Replace `src/io/pageCache.ts`**

```ts
import { createHash } from "node:crypto"
import {
	appendFileSync,
	existsSync,
	readdirSync,
	readFileSync,
	rmSync,
	truncateSync,
} from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { z } from "zod"
import { ADAPTER_NAMES, type AdapterName } from "../adapters/types.ts"
import type { Fetched } from "../net/crawler.ts"
import { HttpsUrl, UtcTimestamp } from "../schema/common.ts"
import { writeFileAtomic, writeJsonAtomic } from "./files.ts"

// The cache folder when a command gets no --cache: .cache/ at the repo root, gitignored.
export const DEFAULT_CACHE_DIR = fileURLToPath(new URL("../../../.cache/", import.meta.url))

// Raw pages can hold staff names, so a local cache keeps them 90 days at most.
export const MAX_AGE_DAYS = 90
export const DAY_MS = 86_400_000
const PAGE_FILE = /^[0-9a-f]{32}\.html$/
// A fetch run's id. randomUUID() gives 36 of these characters.
const RUN_ID = /^[0-9a-z-]{8,40}$/
const JOURNAL = "manifest.jsonl"

export const ManifestEntry = z.strictObject({
	url: HttpsUrl,
	finalUrl: HttpsUrl,
	status: z.number().int(),
	contentType: z.string(),
	fetchedAt: UtcTimestamp,
	contentHash: z.string().regex(/^sha256:[0-9a-f]{64}$/),
	file: z.string().regex(PAGE_FILE),
	adapter: z.enum(ADAPTER_NAMES).optional(),
	textLength: z.number().int().nonnegative().optional(),
	// The fetch run that stored the page, so fetch --resume skips it whatever its age.
	runId: z.string().regex(RUN_ID).optional(),
})
export type ManifestEntry = z.infer<typeof ManifestEntry>
const Manifest = z.strictObject({ entries: z.array(ManifestEntry) })
const RunFile = z.strictObject({ runId: z.string().regex(RUN_ID) })

const sha256 = (text: string) => createHash("sha256").update(text).digest("hex")
const byUrl = (a: ManifestEntry, b: ManifestEntry) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0)

function checkRunId(runId: string): void {
	if (!RUN_ID.test(runId)) throw new Error("a run id is 8 to 40 lowercase letters, digits or hyphens")
}

// The run a fetch started without --resume, from <pages>/run.json. undefined when there is none
// or it does not parse; the file is never printed.
export function readRunId(dir: string): string | undefined {
	const path = join(dir, "run.json")
	if (!existsSync(path)) return undefined
	try {
		const parsed = RunFile.safeParse(JSON.parse(readFileSync(path, "utf8")))
		return parsed.success ? parsed.data.runId : undefined
	} catch {
		return undefined
	}
}

export function writeRunId(dir: string, runId: string): void {
	checkRunId(runId)
	writeJsonAtomic(join(dir, "run.json"), { runId })
}

// Raw pages plus their index: URL, status, final URL, fetch time, content hash and run id.
// Locally the folder is .cache/pages/ (gitignored); in Actions it is the job's temporary folder.
// Page text is never printed and never goes into the index.
//
// The index is a journal. Each stored page appends one JSON line to manifest.jsonl, so a run
// that stops loses only the pages in flight, and no file is rewritten per page (on Windows a
// rename onto a file Defender holds open can fail and end the run). Loading reads manifest.json,
// then folds the journal over it in order, the later line winning per URL. A line that does not
// parse (cut off by a stop) or does not fit an entry is skipped. read() still checks each page
// against its hash. save() writes manifest.json once and empties the journal.
export class PageCache {
	readonly dir: string
	readonly #dryRun: boolean
	readonly #runId: string | undefined
	readonly #entries = new Map<string, ManifestEntry>()
	// False when the journal on disk ends in a cut-off line: the next line then starts with a
	// line break of its own, so the cut-off text cannot swallow it.
	#journalEndsClean = true

	constructor(dir: string, options: { dryRun?: boolean; runId?: string } = {}) {
		this.dir = dir
		this.#dryRun = options.dryRun ?? false
		if (options.runId !== undefined) checkRunId(options.runId)
		this.#runId = options.runId
		this.#loadManifest()
		this.#foldJournal()
	}

	put(page: Fetched, extra: { adapter?: AdapterName; textLength?: number } = {}): ManifestEntry {
		const entry: ManifestEntry = {
			url: page.url,
			finalUrl: page.finalUrl,
			status: page.status,
			contentType: page.contentType,
			fetchedAt: page.fetchedAt,
			contentHash: `sha256:${sha256(page.body)}`,
			file: `${sha256(page.url).slice(0, 32)}.html`,
			...extra,
			...(this.#runId === undefined ? {} : { runId: this.#runId }),
		}
		if (!this.#dryRun) {
			// The page first, then its line. A stop between the two leaves a page no line describes:
			// for a new URL purge removes it later, and for a URL fetched before, the old line's hash
			// no longer matches, so read() refuses the page and --resume fetches it again.
			writeFileAtomic(join(this.dir, entry.file), page.body)
			const lead = this.#journalEndsClean ? "" : "\n"
			appendFileSync(join(this.dir, JOURNAL), `${lead}${JSON.stringify(entry)}\n`)
			this.#journalEndsClean = true
		}
		this.#entries.set(page.url, entry)
		return entry
	}

	get(url: string): ManifestEntry | undefined {
		return this.#entries.get(url)
	}

	// The page only when it is the one its entry describes: a run that stopped between writing a
	// page and its journal line leaves a page whose hash no longer matches.
	read(entry: ManifestEntry): string | undefined {
		const path = join(this.dir, entry.file)
		if (!existsSync(path)) return undefined
		const body = readFileSync(path, "utf8")
		return `sha256:${sha256(body)}` === entry.contentHash ? body : undefined
	}

	entries(): ManifestEntry[] {
		return [...this.#entries.values()].sort(byUrl)
	}

	// manifest.json then holds every entry, so the journal starts over.
	save(): void {
		if (this.#dryRun) return
		writeJsonAtomic(join(this.dir, "manifest.json"), { entries: this.entries() })
		const journal = join(this.dir, JOURNAL)
		if (existsSync(journal)) truncateSync(journal, 0)
		this.#journalEndsClean = true
	}

	// Drops entries fetched more than 90 days ago, and deletes every page file no entry keeps
	// (old pages, and leftovers from a run that stopped halfway). Every command purges before it
	// puts, and save() writes what is left. The journal file stays: it is no page file, and a line
	// for a purged page loads again only to be purged again, its file already gone.
	purge(nowMs: number): number {
		if (this.#dryRun || !existsSync(this.dir)) return 0
		const cutoff = nowMs - MAX_AGE_DAYS * DAY_MS
		const keep = new Set<string>()
		for (const [url, e] of this.#entries) {
			if (Date.parse(e.fetchedAt) < cutoff) this.#entries.delete(url)
			else keep.add(e.file)
		}
		let removed = 0
		for (const name of readdirSync(this.dir)) {
			const stale = (PAGE_FILE.test(name) && !keep.has(name)) || name.endsWith(".tmp")
			if (stale) {
				rmSync(join(this.dir, name))
				removed++
			}
		}
		return removed
	}

	// A manifest that does not parse is started over: pages are cheap to fetch again.
	#loadManifest(): void {
		const path = join(this.dir, "manifest.json")
		if (!existsSync(path)) return
		let data: unknown
		try {
			data = JSON.parse(readFileSync(path, "utf8"))
		} catch {
			return
		}
		const parsed = Manifest.safeParse(data)
		if (parsed.success) for (const e of parsed.data.entries) this.#entries.set(e.url, e)
	}

	#foldJournal(): void {
		const path = join(this.dir, JOURNAL)
		if (!existsSync(path)) return
		const text = readFileSync(path, "utf8")
		this.#journalEndsClean = text === "" || text.endsWith("\n")
		for (const line of text.split("\n")) {
			if (line.trim() === "") continue
			let data: unknown
			try {
				data = JSON.parse(line)
			} catch {
				continue
			}
			const parsed = ManifestEntry.safeParse(data)
			if (parsed.success) this.#entries.set(parsed.data.url, parsed.data)
		}
	}
}
```

(The purge test in `journal.test.ts` expects `purge` to return 1: the old page's file is the one page file no entry keeps. Its journal line is still on disk until `save()`.)

- [ ] **Step 4: Create `src/io/runLock.ts`**

```ts
import { closeSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { basename, join } from "node:path"

export const RUN_LOCK = "run.lock"

// The message names the lock file by its folder only, never a machine path: Actions logs are public.
export class CacheBusyError extends Error {
	constructor(dir: string) {
		super(
			`another fetch, extract or verify is running on this cache: ${basename(dir)}/${RUN_LOCK} holds its process id. If none is running, delete that file and start again`
		)
		this.name = "CacheBusyError"
	}
}

// Signal 0 checks that a process exists and sends nothing. EPERM means it exists but is not mine.
export function pidAlive(pid: number): boolean {
	try {
		process.kill(pid, 0)
		return true
	} catch (err) {
		return (err as { code?: string }).code === "EPERM"
	}
}

function readPid(path: string): number | undefined {
	try {
		const text = readFileSync(path, "utf8").trim()
		return /^\d{1,10}$/.test(text) && Number(text) > 0 ? Number(text) : undefined
	} catch {
		return undefined
	}
}

// The "wx" flag creates the file only when it does not exist yet, in one step. false: it exists.
function create(path: string): boolean {
	let fd: number
	try {
		fd = openSync(path, "wx")
	} catch (err) {
		if ((err as { code?: string }).code === "EEXIST") return false
		throw err
	}
	writeFileSync(fd, `${process.pid}\n`)
	closeSync(fd)
	return true
}

// One process per cache. Two fetch runs in two terminal tabs would interleave the journal and
// both write manifest.json at the end, so each stage holds run.lock in the cache folder while it
// runs. A lock whose process is gone (a closed tab, a crash) is taken over, and so is one with no
// process id I can read.
export function holdCache(
	dir: string,
	isAlive: (pid: number) => boolean = pidAlive
): { release: () => void } {
	mkdirSync(dir, { recursive: true })
	const path = join(dir, RUN_LOCK)
	if (!create(path)) {
		const pid = readPid(path)
		if (pid !== undefined && isAlive(pid)) throw new CacheBusyError(dir)
		rmSync(path, { force: true })
		// Another process took it over in between: it is busy after all.
		if (!create(path)) throw new CacheBusyError(dir)
	}
	let released = false
	return {
		release: () => {
			if (released) return
			released = true
			rmSync(path, { force: true })
		},
	}
}
```

- [ ] **Step 5: Create `src/io/timings.ts`**

```ts
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { z } from "zod"
import { writeJsonAtomic } from "./files.ts"

// How long each stage took, in milliseconds, by stage name. It lives in the cache folder, never
// in the report: a duration changes on every run, and the report must not. score --pr-body reads
// it for the PR body's scale numbers.
const Timings = z.record(z.string(), z.number().int().nonnegative())
const FILE = "timings.json"

// {} when the file is missing, does not parse or does not fit: the next stage starts it over.
export function readTimings(cacheDir: string): Record<string, number> {
	const path = join(cacheDir, FILE)
	if (!existsSync(path)) return {}
	try {
		const parsed = Timings.safeParse(JSON.parse(readFileSync(path, "utf8")))
		return parsed.success ? parsed.data : {}
	} catch {
		return {}
	}
}

// Sets one stage's time and writes the file whole, its keys sorted.
export function recordTiming(cacheDir: string, stage: string, ms: number): void {
	const timings = { ...readTimings(cacheDir), [stage]: Math.max(0, Math.round(ms)) }
	const sorted = Object.fromEntries(
		Object.entries(timings).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
	)
	writeJsonAtomic(join(cacheDir, FILE), sorted)
}
```

- [ ] **Step 6: Replace `src/fetch/fetchPages.ts`**

```ts
import { existsSync, readFileSync } from "node:fs"
import { z } from "zod"
import { readPage } from "../adapters/read.ts"
import { ADAPTER_NAMES, type AdapterName } from "../adapters/types.ts"
import type { KommuneDiscovery, NationalDiscovery } from "../discover/types.ts"
import { DAY_MS, type PageCache } from "../io/pageCache.ts"
import {
	type CrawlReport,
	type Get,
	HOST_STOPS,
	type HostLine,
	SKIP_REASONS,
	type SkipReason,
} from "../net/crawler.ts"

export type FetchSummary = {
	pages: number
	fetched: number
	byAdapter: Record<AdapterName, number>
	noMainText: number
	notFetched: Partial<Record<SkipReason, number>>
}

// Each kommune's pages, at most limit, in discover's order. Progress counts by these.
export function urlsByKommune(
	kommuner: readonly KommuneDiscovery[],
	limit?: number
): Map<string, string[]> {
	return new Map(
		kommuner.map((k): [string, string[]] => {
			const urls = k.pages.map((p) => p.url)
			return [k.kommune, limit === undefined ? urls : urls.slice(0, limit)]
		})
	)
}

// The pages to fetch: each kommune's, at most limit per kommune, and the national ones (Nav
// offices, catalogue findings) only when given, at most limit per source.
export function pagesToFetch(
	kommuner: readonly KommuneDiscovery[],
	national: NationalDiscovery | undefined,
	limit?: number
): string[] {
	const take = (list: readonly string[]) => (limit === undefined ? list : list.slice(0, limit))
	const urls = [...urlsByKommune(kommuner, limit).values()].flat()
	if (national !== undefined) {
		const bySource = new Map<string, string[]>()
		for (const p of national.pages) {
			const source = p.catalogue ?? p.from
			bySource.set(source, [...(bySource.get(source) ?? []), p.url])
		}
		for (const list of bySource.values()) urls.push(...take(list))
	}
	return [...new Set(urls)]
}

// The URLs a resumed run still has to fetch. A page this run already stored is skipped whatever
// its age, so a run stopped in the evening and resumed the next afternoon fetches nothing twice.
// Any other page is skipped while its cached copy is under 24 hours old. A page whose file no
// longer matches its entry is fetched again.
export function resumeFilter(
	urls: readonly string[],
	cache: PageCache,
	runId: string,
	nowMs: number
): string[] {
	return urls.filter((url) => {
		const entry = cache.get(url)
		if (entry === undefined || cache.read(entry) === undefined) return true
		if (entry.runId === runId) return false
		return nowMs - Date.parse(entry.fetchedAt) >= DAY_MS
	})
}

const byHost = (a: HostLine, b: HostLine) => (a.host < b.host ? -1 : a.host > b.host ? 1 : 0)

// A resumed run's crawl report merged into the stopped run's. A resumed run asks only for what is
// missing, so its own report would lose every host the first run stopped, and verify would call
// that kommune "no pages fetched" instead of "host stopped". For each host it touched, the
// requests of both runs add up (PR 5 sizes its jobs on them) and the current run's stop and delay
// win. A previous notFetched line stays only for a URL the current run did not try:
// tried lists what it asked for, and its own notFetched URLs count as tried too. Hosts come out
// sorted by name, as Crawler.report() gives them.
export function mergeCrawlReports(
	previous: CrawlReport | undefined,
	current: CrawlReport,
	tried: readonly string[] = []
): CrawlReport {
	if (previous === undefined) return current
	const hosts = new Map(previous.hosts.map((h) => [h.host, h]))
	for (const h of current.hosts) {
		const before = hosts.get(h.host)
		hosts.set(h.host, before === undefined ? h : { ...h, requests: before.requests + h.requests })
	}
	const retried = new Set([...tried, ...current.notFetched.map((n) => n.url)])
	return {
		hosts: [...hosts.values()].sort(byHost),
		notFetched: [...previous.notFetched.filter((n) => !retried.has(n.url)), ...current.notFetched],
	}
}

const Count = z.number().int().nonnegative()
const CrawlReportFile = z.strictObject({
	hosts: z.array(
		z.strictObject({
			host: z.string().min(1),
			requests: Count,
			delayMs: Count,
			stopped: z.enum(HOST_STOPS).optional(),
		})
	),
	notFetched: z.array(
		z.strictObject({
			ok: z.literal(false),
			url: z.string(),
			reason: z.enum(SKIP_REASONS),
			status: z.number().int().optional(),
			contentType: z.string().optional(),
		})
	),
})

// The crawl report in pages/report.json. undefined when there is none, or it does not parse or
// fit (a report from before hosts carried their crawl delay). The file is never printed.
export function readCrawlReport(path: string): CrawlReport | undefined {
	if (!existsSync(path)) return undefined
	try {
		const parsed = CrawlReportFile.safeParse(JSON.parse(readFileSync(path, "utf8")))
		return parsed.success ? parsed.data : undefined
	} catch {
		return undefined
	}
}

// Fetches every page through the crawler (which keeps one request at a time per host, and
// re-checks a host's stop and Visit-time when a queued request's turn comes) and stores it
// with the adapter that read it. The adapter reads the body in hand, not the cache, so a dry
// run (which writes no file) counts the same as a real one. The page text itself never leaves
// the cache. onPage hears of each URL once, when it settles, fetched or not.
export async function fetchPages(
	get: Get,
	cache: PageCache,
	urls: readonly string[],
	onPage?: (url: string) => void
): Promise<FetchSummary> {
	const byAdapter = Object.fromEntries(ADAPTER_NAMES.map((n) => [n, 0])) as Record<
		AdapterName,
		number
	>
	const notFetched: Partial<Record<SkipReason, number>> = {}
	let fetched = 0
	let noMainText = 0
	await Promise.all(
		urls.map(async (url) => {
			try {
				const res = await get(url, "html")
				if (!res.ok) {
					notFetched[res.reason] = (notFetched[res.reason] ?? 0) + 1
					return
				}
				// One page that breaks the reader must not cost the run its manifest: it is stored as
				// a fallback page with no main text, and save() still runs.
				let page: { adapter: AdapterName; text: string }
				try {
					page = readPage(res.body, res.finalUrl)
				} catch {
					page = { adapter: "fallback", text: "" }
				}
				cache.put(res, { adapter: page.adapter, textLength: page.text.length })
				fetched++
				byAdapter[page.adapter]++
				if (page.text === "") noMainText++
			} finally {
				onPage?.(url)
			}
		})
	)
	return { pages: urls.length, fetched, byAdapter, noMainText, notFetched }
}

// What the command prints: counts and hosts only. URLs go to pages/report.json in the cache.
export function formatFetchSummary(summary: FetchSummary, crawl: CrawlReport): string {
	const skipped = Object.entries(summary.notFetched).map(([reason, n]) => `${reason} ${n}`)
	const stopped = crawl.hosts
		.filter((h) => h.stopped !== undefined)
		.map((h) => `${h.host} (${h.stopped})`)
	return [
		`Fetch: ${summary.fetched} of ${summary.pages} pages fetched`,
		`By adapter: ${ADAPTER_NAMES.map((n) => `${n} ${summary.byAdapter[n]}`).join(", ")}`,
		`No main text: ${summary.noMainText}`,
		`Not fetched: ${skipped.length === 0 ? "none" : skipped.join(", ")}`,
		`Hosts stopped: ${stopped.length === 0 ? "none" : stopped.join(", ")}`,
	].join("\n")
}
```

- [ ] **Step 7: Create `src/fetch/progress.ts`**

```ts
// Progress lines for a long fetch. Actions logs are public, so a line holds counts, kommune
// numbers and KLASS names only, never a host or a URL.
const count = (n: number) => n.toLocaleString("en-US")

export class KommuneProgress {
	readonly #names: ReadonlyMap<string, string>
	readonly #print: (line: string) => void
	readonly #kommuner: number
	// The pages each kommune still waits for, and the kommuner each page belongs to. A page two
	// kommuner share counts for both.
	readonly #waiting = new Map<string, Set<string>>()
	readonly #kommunerOf = new Map<string, string[]>()
	readonly #settled = new Set<string>()
	#done = 0

	constructor(
		byKommune: ReadonlyMap<string, readonly string[]>,
		names: ReadonlyMap<string, string>,
		print: (line: string) => void
	) {
		this.#names = names
		this.#print = print
		this.#kommuner = byKommune.size
		for (const [kommune, urls] of byKommune) {
			this.#waiting.set(kommune, new Set(urls))
			for (const url of urls) {
				const list = this.#kommunerOf.get(url)
				if (list === undefined) this.#kommunerOf.set(url, [kommune])
				else if (!list.includes(kommune)) list.push(kommune)
			}
		}
		// A kommune with nothing to fetch (all of it stored before a resume) is done at once.
		for (const [kommune, waiting] of this.#waiting) if (waiting.size === 0) this.#finish(kommune)
	}

	// One URL settled, fetched or not. A second call for the same URL changes nothing, and so does
	// a URL outside every kommune (a national page): the counts are the kommuner's pages.
	page(url: string): void {
		const kommuner = this.#kommunerOf.get(url)
		if (kommuner === undefined || this.#settled.has(url)) return
		this.#settled.add(url)
		for (const kommune of kommuner) {
			const waiting = this.#waiting.get(kommune)
			if (waiting === undefined) continue
			waiting.delete(url)
			if (waiting.size === 0) this.#finish(kommune)
		}
	}

	heartbeat(): void {
		this.#print(
			`fetch: ${count(this.#settled.size)} of ${count(this.#kommunerOf.size)} pages, ${this.#done} of ${this.#kommuner} kommuner`
		)
	}

	#finish(kommune: string): void {
		this.#done++
		const name = this.#names.get(kommune)
		const who = name === undefined ? kommune : `${kommune} ${name}`
		this.#print(`fetch: ${who} done (${this.#done} of ${this.#kommuner})`)
	}
}
```

- [ ] **Step 8: Run the tests to see them pass**

Run: `npx vitest run test/journal.test.ts test/runLock.test.ts test/resumeFetch.test.ts test/progress.test.ts test/timings.test.ts test/pageCache.test.ts test/fetchPages.test.ts`
Expected: PASS. The existing `fetchPages.test.ts` passes unchanged: its dry-run test still finds an empty folder, because a dry run writes no journal.

- [ ] **Step 9: Replace `src/cli/fetch.ts`**

The whole file, written against Task 1's `parseOnly` and `selects` and Task 3's `AddressCache`:

```ts
// Fetches the pages discover listed into <cache>/pages/, with a manifest, and prints counts.
//   node src/cli/fetch.ts [--only 3405,0301|pilot] [--national] [--limit 3] [--resume] [--cache <dir>] [--dry-run]
// A run without --resume gets a new id in pages/run.json. --resume goes on with that run: it
// skips every page the run stored, and any other page fetched under 24 hours ago, and merges its
// crawl report into the stopped run's. Ctrl+C keeps every page stored so far.
import { randomUUID } from "node:crypto"
import { rmSync } from "node:fs"
import { join } from "node:path"
import { parseArgs } from "node:util"
import { DiscoverError } from "../discover/discover.ts"
import { readDiscovery } from "../discover/files.ts"
import {
	fetchPages,
	formatFetchSummary,
	mergeCrawlReports,
	pagesToFetch,
	readCrawlReport,
	resumeFilter,
	urlsByKommune,
} from "../fetch/fetchPages.ts"
import { KommuneProgress } from "../fetch/progress.ts"
import { AddressCache } from "../io/addressCache.ts"
import { writeJsonAtomic } from "../io/files.ts"
import { DEFAULT_CACHE_DIR, PageCache, readRunId, writeRunId } from "../io/pageCache.ts"
import { CacheBusyError, holdCache } from "../io/runLock.ts"
import { readTimings, recordTiming } from "../io/timings.ts"
import { AllowList } from "../net/allowList.ts"
import { systemClock } from "../net/clock.ts"
import { Crawler } from "../net/crawler.ts"
import { httpsTransport } from "../net/http.ts"
import { parseOnly, selects } from "../pilot/list.ts"

const USAGE =
	"usage: fetch [--only 3405,0301|pilot] [--national] [--limit N] [--resume] [--cache <dir>] [--dry-run]"
const HEARTBEAT_MS = 5 * 60_000

const { values } = parseArgs({
	options: {
		only: { type: "string" },
		national: { type: "boolean", default: false },
		limit: { type: "string" },
		resume: { type: "boolean", default: false },
		cache: { type: "string" },
		"dry-run": { type: "boolean", default: false },
	},
})
const only = parseOnly(values.only)
const limit = values.limit === undefined ? undefined : Number(values.limit)
if (only === undefined || (limit !== undefined && (!Number.isInteger(limit) || limit < 1))) {
	console.error(USAGE)
	process.exit(2)
}

const root = values.cache ?? DEFAULT_CACHE_DIR
const pagesDir = join(root, "pages")
const reportPath = join(pagesDir, "report.json")
const dryRun = values["dry-run"]
const resume = values.resume
const count = (n: number) => n.toLocaleString("en-US")

async function main(selection: readonly string[]): Promise<number> {
	const started = Date.now()
	const found = readDiscovery(join(root, "discover"))
	const kommuner = found.kommuner.filter((k) => selects(selection, k.kommune))
	const urls = pagesToFetch(kommuner, values.national ? found.national : undefined, limit)
	// A selection that matches nothing must not purge the cache or overwrite the last report.
	if (urls.length === 0) {
		console.error("nothing to fetch for this selection: pages/report.json was left as it was")
		return 2
	}
	// A dry run writes nothing, so it needs no lock.
	const held = dryRun ? undefined : holdCache(pagesDir)
	try {
		const runId = resume ? readRunId(pagesDir) : randomUUID()
		if (runId === undefined) {
			console.error("fetch --resume needs pages/run.json: start the run without --resume first")
			return 2
		}
		if (!resume && !dryRun) {
			writeRunId(pagesDir, runId)
			// The report belongs to the run in run.json, so an older run's report never merges in.
			rmSync(reportPath, { force: true })
		}
		const now = Date.now()
		const cache = new PageCache(pagesDir, { dryRun, runId })
		cache.purge(now)
		new AddressCache(join(root, "kartverket"), { dryRun }).purge(now)
		const todo = resume ? resumeFilter(urls, cache, runId, now) : urls
		if (resume) {
			console.log(
				`resume: ${count(urls.length - todo.length)} of ${count(urls.length)} pages already fetched`
			)
		}
		const previous = resume ? readCrawlReport(reportPath) : undefined
		// A resumed run adds its time to the stopped run's, so the timing is the whole fetch.
		const before = resume ? (readTimings(root).fetch ?? 0) : 0
		const crawler = new Crawler({
			transport: httpsTransport,
			clock: systemClock,
			allowList: AllowList.restore(found.hosts),
		})
		const settled: string[] = []
		const merged = () => mergeCrawlReports(previous, crawler.report(), settled)
		const left = new Set(todo)
		const byKommune = new Map(
			[...urlsByKommune(kommuner, limit)].map(([k, list]): [string, string[]] => [
				k,
				list.filter((url) => left.has(url)),
			])
		)
		const names = new Map(kommuner.map((k): [string, string] => [k.kommune, k.name]))
		const progress = new KommuneProgress(byKommune, names, (line) => console.log(line))
		const beat = setInterval(() => progress.heartbeat(), HEARTBEAT_MS)
		beat.unref()
		// The report and the timing are written whether the run ends, stops on an error or is
		// stopped with Ctrl+C, so --resume knows which hosts this run stopped.
		const wrapUp = () => {
			clearInterval(beat)
			if (dryRun) return
			writeJsonAtomic(reportPath, merged())
			recordTiming(root, "fetch", before + Date.now() - started)
		}
		const onStop = () => {
			wrapUp()
			held?.release()
			console.error("fetch stopped: the pages fetched so far are kept. Run fetch --resume to go on")
			process.exit(130)
		}
		process.once("SIGINT", onStop)
		const onPage = (url: string) => {
			settled.push(url)
			progress.page(url)
		}
		const summary = await fetchPages(crawler.get, cache, todo, onPage).finally(() => {
			process.off("SIGINT", onStop)
			wrapUp()
		})
		cache.save()
		console.log(formatFetchSummary(summary, merged()))
		return 0
	} finally {
		held?.release()
	}
}

try {
	process.exitCode = await main(only)
} catch (err) {
	// The message only: an unexpected error's text could quote a response.
	console.error(
		err instanceof DiscoverError || err instanceof CacheBusyError
			? err.message
			: "fetch stopped on an unexpected error"
	)
	process.exitCode = 1
}
```

- [ ] **Step 10: Hold the cache in discover's purge**

`discover` purges the page cache and calls `save()`, which now empties the journal. Run while a fetch appends, that would lose the fetch's lines, so discover takes the same lock for its purge, and clears the Kartverket answers as it clears the pages (spec: "The 90-day purge clears `.cache/kartverket/` as it clears the pages").

In `src/cli/discover.ts`, add to the imports:

```ts
import { AddressCache } from "../io/addressCache.ts"
import { CacheBusyError, holdCache } from "../io/runLock.ts"
```

Replace:

```ts
		// Every run that starts with discover clears raw pages older than 90 days, even when
		// fetch is not run for a while.
		const pages = new PageCache(join(root, "pages"))
		pages.purge(Date.now())
		pages.save()
```

with:

```ts
		// Every run that starts with discover clears raw pages and Kartverket answers past their
		// age, even when fetch is not run for a while. save() empties the page journal, so the
		// purge holds the cache lock: no fetch, extract or verify may run at the same time.
		const held = holdCache(join(root, "pages"))
		try {
			const pages = new PageCache(join(root, "pages"))
			pages.purge(Date.now())
			pages.save()
			new AddressCache(join(root, "kartverket")).purge(Date.now())
		} finally {
			held.release()
		}
```

and in the `catch` below it replace:

```ts
		err instanceof DiscoverError ? err.message : "discover stopped on an unexpected error"
```

with:

```ts
		err instanceof DiscoverError || err instanceof CacheBusyError
			? err.message
			: "discover stopped on an unexpected error"
```

- [ ] **Step 10b: A progress line and a timing for discover**

The spec asks every stage for one line when a kommune finishes, and the PR body's stage durations need discover too. In `src/discover/discover.ts`, `DiscoverOptions` gains `onKommune?: (kommune: string, name: string, at: number, of: number) => void`. In `discover()`, the kommune map inside `Promise.all` awaits each `discoverKommune(...)`, then raises a `done` counter (declared `let done = 0` before it) and calls `o.onKommune?.(k.code, k.name, done, kommuner.length)`. Kommuner run side by side, so the count is how many are done, not a place in the list.

In `src/cli/discover.ts`, set `const started = Date.now()` before the call, pass `onKommune: (kommune, name, at, of) => console.log(`discover: ${kommune} ${name} done (${at} of ${of})`)`, and after `writeDiscovery(...)` call `recordTiming(root, "discover", Date.now() - started)` (import it from `../io/timings.ts`).

In `test/discover.test.ts`, add a test that a two-kommune run calls `onKommune` twice, the last time with 2 of 2. Add `src/discover/discover.ts test/discover.test.ts` to this task's `git add`.

- [ ] **Step 11: Check the CLI offline**

Neither check reaches the network: the first stops at the arguments, the second before the crawler is built. From `pipeline/`:

```bash
node src/cli/fetch.ts --only x; echo "exit $?"
```

Expected: the usage line, then `exit 2`.

```bash
tmp="$(cygpath -m "$(mktemp -d)")"
node --input-type=module -e '
const [root] = process.argv.slice(1)
const { writeJsonAtomic } = await import("./src/io/files.ts")
const at = "2026-11-13T09:00:00Z"
writeJsonAtomic(`${root}/discover/report.json`, { ranAt: at, date: "2026-11-13", only: [], kommuner: ["3405"], renumberings: [], nameMismatches: [], problems: [], hosts: [], notFetched: [] })
writeJsonAtomic(`${root}/discover/hosts.json`, [])
writeJsonAtomic(`${root}/discover/national.json`, { discoveredAt: at, pages: [], catalogues: [], navOffices: 0 })
writeJsonAtomic(`${root}/discover/kommuner/3405.json`, { kommune: "3405", name: "Eksempelby", discoveredAt: at, brregComplete: true, allSitemapUrls: [], units: [], pages: [{ url: "https://www.eksempel.kommune.no/a/", from: "sitemap" }] })
' "$tmp"
node src/cli/fetch.ts --resume --cache "$tmp"; echo "exit $?"
ls -A "$tmp/pages"; echo "files listed: $(ls -A "$tmp/pages" | wc -l)"
```

Expected: `fetch --resume needs pages/run.json: start the run without --resume first`, `exit 2`, and `files listed: 0` (the lock was released and nothing was written).

- [ ] **Step 12: Show it red once**

Each break, one at a time; restore after each and run the same file again to see it PASS.

1. In `#foldJournal`, replace the `try { data = JSON.parse(line) } catch { continue }` block with `data = JSON.parse(line)`. Run `npx vitest run test/journal.test.ts`: FAIL on "loads without a last line that was cut off" with a `SyntaxError`.
2. In `put`, change `const lead = this.#journalEndsClean ? "" : "\n"` to `const lead = ""`. Run `npx vitest run test/journal.test.ts`: FAIL on the same test, the third entry lost (`[first]` received, `[first, third]` expected).
3. In `save()`, delete the `truncateSync` line. Run `npx vitest run test/journal.test.ts`: FAIL on "save() writes the manifest once and empties the journal".
4. In `resumeFilter`, delete `if (entry.runId === runId) return false`. Run `npx vitest run test/resumeFetch.test.ts`: FAIL on "fetches only the pages a stopped run is missing" (`[A, B, C]` received).
5. In `mergeCrawlReports`, replace the host loop's body with a plain `hosts.set(h.host, h)`. Run `npx vitest run test/resumeFetch.test.ts`: FAIL on "keeps the stop of a host the resumed run never touched" (`requests: 2`, not 42). Restore, then replace the whole body with `return current`. Run it: FAIL on the same test (Review Focus 1).
6. In `holdCache`, change `if (pid !== undefined && isAlive(pid))` to `if (false)`. Run `npx vitest run test/runLock.test.ts`: FAIL on "refuses a second fetch on a held cache" and "refuses a lock whose process is alive".

Note each break and its red result for the PR body.

- [ ] **Step 13: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm run lint && npm test
git add src/io/pageCache.ts src/io/runLock.ts src/io/timings.ts src/fetch/fetchPages.ts src/fetch/progress.ts src/cli/fetch.ts src/cli/discover.ts test/journal.test.ts test/runLock.test.ts test/resumeFetch.test.ts test/progress.test.ts test/timings.test.ts test/pageCache.test.ts
git commit -m "feat(pipeline): journal the page cache, resume a stopped fetch, print progress and lock the cache"
```

The network boundary test scans every file under `src/`, so the three new modules are covered without a change to it.

---

### Task 5: Lock schema: `inputs`, `failed`, `RULES_VERSION`

Every lock records what it was built from (`inputs`), so `verify --resume` (Task 6) can compare hashes instead of file times. A kommune where nothing came through still gets a lock, with no units and a `failed` reason that keeps the crawler's stop kind (Decided 3). `RULES_VERSION` moves with the rule code, and a fingerprint test fails when a rule file changes and the version does not (Decided 2, Review Focus 3).

**Files:**
- Create: `pipeline/src/verify/rules.ts`
- Modify: `pipeline/src/schema/lock.ts` (imports at lines 1-21, `LockFile` at lines 188-201), `pipeline/src/verify/verify.ts` (imports at lines 1 and 23, `VerifyInput` at lines 41-54, the lock parse at lines 336-340), `pipeline/schema/lock.schema.json` (regenerated), `pipeline/test/helpers.ts`, `pipeline/test/schema.test.ts` (lines 111-137), `pipeline/test/dataCheck.test.ts` (lines 6, 19, 55, 68, 82, 112, 123, 135, 147, 161), `pipeline/test/curatedWrite.test.ts` (lines 15, 70), `pipeline/test/golden.test.ts` (lines 9, 40-41), `pipeline/test/queue.test.ts` (lines 9, 60-61), `pipeline/test/reviewHelpers.ts` (lines 7, 21-22), `pipeline/test/session.test.ts` (lines 9, 39-40, 342-343, 360-361), `pipeline/test/score.test.ts` (lines 5, 50)
- Test: `pipeline/test/rules.test.ts` (new), `pipeline/test/schema.test.ts`, `pipeline/test/dataCheck.test.ts`, `pipeline/test/verify.test.ts` (extend)

**Interfaces:**
- Consumes: `HOST_STOPS` (`src/net/crawler.ts`); `CalendarDate`, `NonBlank`, `KommuneNumber` (`src/schema/common.ts`); `verifyKommune` (`src/verify/verify.ts`); `checkData` (`src/check/dataCheck.ts`).
- Produces:
  - `src/schema/lock.ts`: `Sha256`, `LockInputs` (and its type), `FAILED_KINDS`, `type FailedKind`, `LockFailure` (and its type); `LockFile` gains required `inputs: LockInputs` and optional `failed: LockFailure`, and a lock with `failed` has `units: []`.
  - `src/verify/rules.ts`: `RULES_VERSION = 1`, `RULES_FINGERPRINT` (a literal `"sha256:..."`), `RULE_PATHS`, `rulesFingerprint(root: string): string`, `ruleGaps(root: string): string[]` (files `src/verify/verify.ts` imports, outside `src/net/` and `src/io/`, that no rule path covers).
  - `src/verify/verify.ts`: `VerifyInput.inputs?: LockInputs`. Without it, `verifyKommune` records `{ extraction: <sha256 of JSON.stringify(input.extraction)>, rules: RULES_VERSION }`. Task 6 passes the real inputs.
  - `test/helpers.ts`: `testInputs(): LockInputs`, `{ extraction: "sha256:" + "0".repeat(64), rules: 1 }`.

- [ ] **Step 1: Confirm the schema module can import `HOST_STOPS` without a network module**

`src/schema/lock.ts` will import `HOST_STOPS` from `src/net/crawler.ts`. The boundary test reads each file's own text, not what it loads, so I check the chain by hand. From `pipeline/`:

```bash
grep -n "^import\|^} from" src/net/crawler.ts src/net/clock.ts src/net/robots.ts src/net/types.ts src/text/normalise.ts
```

Expected: `crawler.ts` imports `tldts`, `../text/normalise.ts`, a type-only `./allowList.ts`, `./clock.ts`, `./robots.ts` and `./types.ts` (Task 3 may add `PACE_MS` from `./types.ts`); `normalise.ts` imports `tldts`; `clock.ts`, `robots.ts` and `types.ts` import nothing. No `node:http`, `node:https`, `node:net`, `node:tls`, `node:dns`, `undici` or `cheerio`. `src/discover/types.ts` already imports `HOST_STOPS` the same way. If the output shows anything else, stop: that is a finding for me before this task goes on. Also confirm there is no import cycle: `src/gates/types.ts` imports from `src/schema/lock.ts` with `import type` only, which is erased.

- [ ] **Step 2: Write the failing tests**

Add to `pipeline/test/helpers.ts`. Change the type import on line 4 to:

```ts
import type { GateResult, LockField, LockInputs, LockUnit } from "../src/schema/lock.ts"
```

and add after `lockUnit`:

```ts
// The inputs every fixture lock carries: an all-zero extraction hash and rules version 1. Only
// the resume tests read them.
export function testInputs(): LockInputs {
	return { extraction: `sha256:${"0".repeat(64)}`, rules: 1 }
}
```

Create `pipeline/test/rules.test.ts`:

```ts
import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
	RULE_PATHS,
	RULES_FINGERPRINT,
	RULES_VERSION,
	ruleGaps,
	rulesFingerprint,
} from "../src/verify/rules.ts"

const ROOT = fileURLToPath(new URL("..", import.meta.url))

function tree(files: Record<string, string>): string {
	const root = mkdtempSync(join(tmpdir(), "varde-rules-"))
	for (const [rel, text] of Object.entries(files)) {
		mkdirSync(dirname(join(root, rel)), { recursive: true })
		writeFileSync(join(root, rel), text)
	}
	return root
}
const sha = (text: string) => `sha256:${createHash("sha256").update(text).digest("hex")}`

const FILES = {
	"src/gates/b.ts": "export const b = 2\r\n",
	"src/gates/a.ts": "export const a = 1\n",
	"src/gates/notes.md": "not code",
	"src/text/deep/x.ts": "export const x = 0\n",
	"src/registers/kartverket.ts": "export const k = 1\n",
	"src/cli/verify.ts": "export const cli = 1\n",
	"src/verify/rules.ts": 'export const RULES_FINGERPRINT = "sha256:x"\n',
}

describe("RULES_VERSION", () => {
	it("moves with the rule files", () => {
		const now = rulesFingerprint(ROOT)
		expect(
			now,
			`rule files changed: bump RULES_VERSION in src/verify/rules.ts and set RULES_FINGERPRINT to ${now}`
		).toBe(RULES_FINGERPRINT)
	})

	it("is a positive whole number, over the rule folders the plan names", () => {
		expect(Number.isInteger(RULES_VERSION) && RULES_VERSION > 0).toBe(true)
		expect(RULE_PATHS).toEqual([
			"src/adapters/",
			"src/answerKey/schema.ts",
			"src/discover/catalogues.ts",
			"src/discover/types.ts",
			"src/extract/cmsBoxes.ts",
			"src/extract/page.ts",
			"src/recall/match.ts",
			"src/registers/",
			"src/schema/",
			"src/sources/",
			"src/xlsx/",
			"src/gates/",
			"src/verify/",
			"src/curate/",
			"src/text/",
		])
	})
})

describe("RULE_PATHS", () => {
	it("covers every file verify.ts imports, outside src/net/ and src/io/", () => {
		expect(ruleGaps(ROOT), "add these to RULE_PATHS and bump RULES_VERSION").toEqual([])
	})
})

describe("rulesFingerprint", () => {
	it("hashes each .ts file under the rule paths in sorted order, \\r\\n read as \\n", () => {
		const expected = sha(
			[
				"src/gates/a.ts\nexport const a = 1\n\n",
				"src/gates/b.ts\nexport const b = 2\n\n",
				"src/registers/kartverket.ts\nexport const k = 1\n\n",
				"src/text/deep/x.ts\nexport const x = 0\n\n",
			].join("")
		)
		expect(rulesFingerprint(tree(FILES))).toBe(expected)
	})

	it("leaves out rules.ts itself and every file outside the rule paths", () => {
		const base = rulesFingerprint(tree(FILES))
		expect(
			rulesFingerprint(tree({ ...FILES, "src/verify/rules.ts": 'export const RULES_FINGERPRINT = "y"\n' }))
		).toBe(base)
		expect(rulesFingerprint(tree({ ...FILES, "src/cli/verify.ts": "endret\n" }))).toBe(base)
		expect(rulesFingerprint(tree({ ...FILES, "src/gates/notes.md": "endret" }))).toBe(base)
	})

	it("changes with a rule file's text or a new rule file, never with its line endings", () => {
		const base = rulesFingerprint(tree(FILES))
		expect(rulesFingerprint(tree({ ...FILES, "src/gates/a.ts": "export const a = 2\n" }))).not.toBe(
			base
		)
		expect(rulesFingerprint(tree({ ...FILES, "src/curate/new.ts": "export {}\n" }))).not.toBe(base)
		expect(
			rulesFingerprint(tree({ ...FILES, "src/gates/a.ts": "export const a = 1\r\n" }))
		).toBe(base)
	})
})
```

In `pipeline/test/schema.test.ts`, extend the lock import (lines 5-13) to:

```ts
import {
	acceptedCost,
	Evidence,
	evidenceQuotes,
	FAILED_KINDS,
	LockField,
	LockFile,
	LockInputs,
	LockUnit,
	Sha256,
	SourceRef,
} from "../src/schema/lock.ts"
import { HOST_STOPS } from "../src/net/crawler.ts"
import { acceptedField, allGatesPass, curatedUnit, lockUnit, T, testInputs } from "./helpers.ts"
```

(the last line replaces the existing `./helpers.ts` import on line 14). Then in `describe("LockFile")` (lines 111-137), add `inputs: testInputs(),` after `kommune: "3403",` in every lock literal, so each test fails only for the reason it names:

```ts
describe("LockFile", () => {
	const lock = (units: unknown[], over: Record<string, unknown> = {}) => ({
		kommune: "3403",
		inputs: testInputs(),
		units,
		...over,
	})

	it("accepts a valid file", () => {
		expect(LockFile.safeParse(lock([lockUnit()])).success).toBe(true)
	})

	it("rejects a file-level timestamp, so a plain re-run cannot change it", () => {
		expect(LockFile.safeParse(lock([lockUnit()], { generatedAt: T })).success).toBe(false)
	})

	it("rejects two units with the same id", () => {
		expect(LockFile.safeParse(lock([lockUnit(), lockUnit()])).success).toBe(false)
	})

	it("rejects a field name outside the twelve", () => {
		const unit = { ...lockUnit(), fields: { ...lockUnit().fields, fax: acceptedField() } }
		expect(LockFile.safeParse(lock([unit])).success).toBe(false)
	})

	it("rejects a value of the wrong kind for its field", () => {
		const unit = lockUnit({ fields: { alwaysOpen: acceptedField({ value: "ja" }) } })
		expect(LockFile.safeParse(lock([unit])).success).toBe(false)
		const cost = lockUnit({ fields: { cost: acceptedField({ value: "cheap" }) } })
		expect(LockFile.safeParse(lock([cost])).success).toBe(false)
	})

	it("rejects a lock without inputs", () => {
		expect(LockFile.safeParse({ kommune: "3403", units: [lockUnit()] }).success).toBe(false)
	})

	it("takes every input a resume compares, and nothing else", () => {
		const sha = `sha256:${"a".repeat(64)}`
		const all = { extraction: sha, national: sha, curated: sha, nklm: "2026-11-01", rules: 1 }
		expect(LockInputs.safeParse(all).success).toBe(true)
		expect(LockInputs.safeParse({ extraction: sha, rules: 1 }).success).toBe(true)
		expect(LockInputs.safeParse({ ...all, fetchedAt: T }).success).toBe(false)
		expect(LockInputs.safeParse({ ...all, rules: 0 }).success).toBe(false)
		expect(LockInputs.safeParse({ ...all, rules: 1.5 }).success).toBe(false)
		expect(LockInputs.safeParse({ ...all, nklm: "01.11.2026" }).success).toBe(false)
		expect(LockInputs.safeParse({ rules: 1 }).success).toBe(false)
	})

	it("rejects a sha256 that is not sha256: and 64 lowercase hex digits", () => {
		expect(Sha256.safeParse(`sha256:${"0".repeat(64)}`).success).toBe(true)
		for (const bad of [
			`sha256:${"0".repeat(63)}`,
			`sha256:${"A".repeat(64)}`,
			"0".repeat(64),
			`sha1:${"0".repeat(64)}`,
		]) {
			expect(Sha256.safeParse(bad).success, bad).toBe(false)
			expect(LockFile.safeParse(lock([], { inputs: { extraction: bad, rules: 1 } })).success).toBe(
				false
			)
		}
	})

	it("takes every failed kind: the crawler's stops, robots and noPages", () => {
		expect(FAILED_KINDS).toEqual([...HOST_STOPS, "robots", "noPages"])
		for (const kind of FAILED_KINDS) {
			const failed = { kind, reason: "host stopped" }
			expect(LockFile.safeParse(lock([], { failed })).success, kind).toBe(true)
		}
		expect(LockFile.safeParse(lock([], { failed: { kind: "sleep", reason: "x" } })).success).toBe(
			false
		)
		expect(LockFile.safeParse(lock([], { failed: { kind: "timeout", reason: " " } })).success).toBe(
			false
		)
	})

	it("rejects a failed lock with a unit, at units", () => {
		const parsed = LockFile.safeParse(
			lock([lockUnit()], { failed: { kind: "timeout", reason: "host stopped: timeout" } })
		)
		expect(parsed.success).toBe(false)
		expect(parsed.error?.issues.map((i) => [i.path.join("."), i.message])).toContainEqual([
			"units",
			"a failed lock has no units",
		])
	})
})
```

In `pipeline/test/dataCheck.test.ts`, change the helpers import on line 6 to:

```ts
import { acceptedField, curatedUnit, lockUnit, PAGE_URL, testInputs } from "./helpers.ts"
```

replace line 19:

```ts
const lock = { kommune: "3403", units: [lockUnit()] }
```

with:

```ts
const lockOf = (units: unknown[]) => ({ kommune: "3403", inputs: testInputs(), units })
const lock = lockOf([lockUnit()])
```

and turn each `{ kommune: "3403", units: [...] }` on lines 55, 68, 82, 112, 123, 135, 147 and 161 into `lockOf([...])`, keeping what is inside the brackets:

```bash
sed -i -E 's/\{ kommune: "3403", units: \[([a-z, ]*)\] \}/lockOf([\1])/' test/dataCheck.test.ts
grep -c "lockOf(" test/dataCheck.test.ts
```

Expected count: 9 (line 19's `lockOf([lockUnit()])` and the eight lines; the definition reads `lockOf = (`). Then add, inside `describe("checkData")`:

```ts
	it("passes a failed lock: no units, its kind and its reason", () => {
		const failed = {
			kommune: "3403",
			inputs: testInputs(),
			failed: { kind: "noPages", reason: "no pages fetched" },
			units: [],
		}
		expect(checkData(repo({ "lock/3403.json": failed }))).toEqual([])
	})

	it("flags a lock without inputs, by its path", () => {
		const problems = checkData(repo({ "lock/3403.json": { kommune: "3403", units: [lockUnit()] } }))
		expect(problems.some((p) => p.startsWith("lock/3403.json inputs: "))).toBe(true)
	})
```

In `pipeline/test/verify.test.ts`, add `import { createHash } from "node:crypto"` at the top and `import { RULES_VERSION } from "../src/verify/rules.ts"` with the other `src/verify` imports, and add inside `describe("verifyKommune")`:

```ts
	it("records its inputs on the lock: the extraction's hash and RULES_VERSION unless given", async () => {
		const { input } = setup({ pages: { [BV]: UNIT_PAGE }, units: [unit()] })
		const { lock } = await verifyKommune(input)
		const hash = createHash("sha256").update(JSON.stringify(input.extraction)).digest("hex")
		expect(lock.inputs).toEqual({ extraction: `sha256:${hash}`, rules: RULES_VERSION })
		expect(Object.keys(lock)).toEqual(["kommune", "inputs", "units"])
		const given = { extraction: `sha256:${"1".repeat(64)}`, rules: 7 }
		expect((await verifyKommune({ ...input, inputs: given })).lock.inputs).toEqual(given)
	})
```

- [ ] **Step 3: Run them to see them fail**

Run: `npx vitest run test/rules.test.ts test/schema.test.ts test/dataCheck.test.ts test/verify.test.ts`
Expected: FAIL. `src/verify/rules.ts` does not exist, so `rules.test.ts` and `verify.test.ts` fail to load; `FAILED_KINDS`, `LockInputs` and `Sha256` are not exported, so the new schema tests fail; `checkData` reports the fixtures' `inputs` as an unrecognized key, so most `dataCheck.test.ts` tests fail.

- [ ] **Step 4: Change `src/schema/lock.ts`**

Add after the `zod` import on line 1:

```ts
import { HOST_STOPS } from "../net/crawler.ts"
```

Replace lines 188-201 (the comment and `LockFile`) with:

```ts
// A sha256 hash as the pipeline writes it: "sha256:" and 64 lowercase hex digits.
export const Sha256 = z.string().regex(/^sha256:[0-9a-f]{64}$/)

// What verify built the lock from: the hashes of the kommune's extraction file, the national
// extraction file and the curated file as verify wrote it, the NKLM edition date, and the rules
// (RULES_VERSION in src/verify/rules.ts). verify --resume re-runs a kommune when any of them
// differs from what it would read now. Hashes, not file times: a checkout gives every committed
// file a new time, and a gate change leaves the extraction files alone.
export const LockInputs = z.strictObject({
	extraction: Sha256,
	national: Sha256.optional(),
	curated: Sha256.optional(),
	nklm: CalendarDate.optional(),
	rules: z.number().int().positive(),
})
export type LockInputs = z.infer<typeof LockInputs>

// Why a kommune has no units: the crawler's stop for its host, robots.txt refusing every page,
// or no page fetched at all. score refuses while a kommune failed for a transient kind.
export const FAILED_KINDS = [...HOST_STOPS, "robots", "noPages"] as const
export type FailedKind = (typeof FAILED_KINDS)[number]
export const LockFailure = z.strictObject({ kind: z.enum(FAILED_KINDS), reason: NonBlank })
export type LockFailure = z.infer<typeof LockFailure>

// No file-level timestamp: a plain refresh moves only verifiedAt, fetchedAt and the inputs'
// hashes. A kommune where nothing came through still gets a lock, with its failure and no units,
// so score can tell a failed kommune from one never attempted.
export const LockFile = z
	.strictObject({
		$schema: z.string().optional(),
		kommune: KommuneNumber,
		inputs: LockInputs,
		failed: LockFailure.optional(),
		units: z.array(LockUnit),
	})
	.superRefine((file, ctx) => {
		const ids = file.units.map((u) => u.unitId)
		if (new Set(ids).size !== ids.length) {
			ctx.addIssue({ code: "custom", path: ["units"], message: "unit ids must be unique" })
		}
		if (file.failed !== undefined && file.units.length > 0) {
			ctx.addIssue({ code: "custom", path: ["units"], message: "a failed lock has no units" })
		}
	})
export type LockFile = z.infer<typeof LockFile>
```

`inputs` and `failed` sit before `units`, so a lock file opens with what it was built from and ends with its units.

- [ ] **Step 5: Create `src/verify/rules.ts`**

```ts
import { createHash } from "node:crypto"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

// The version of the rules verify applies. Every lock records it in its inputs, and
// verify --resume re-runs a kommune whose lock holds another one. Bump it with every change to a
// gate, a field rule, the address rule or Kartverket's reader, and set RULES_FINGERPRINT to match:
// test/rules.test.ts fails until the two move together.
export const RULES_VERSION = 1

// rulesFingerprint over this repo's rule files when RULES_VERSION was last set. A hash of source
// code, not of page data.
export const RULES_FINGERPRINT = "sha256:0000000000000000000000000000000000000000000000000000000000000000"

// The code that decides a lock's values: every file verify.ts imports, outside src/net/ and
// src/io/ (ruleGaps checks this). A formatting-only change asks for a bump too: that costs one
// full verify from the local caches, a few minutes.
export const RULE_PATHS: readonly string[] = [
	"src/adapters/",
	"src/answerKey/schema.ts",
	"src/discover/catalogues.ts",
	"src/discover/types.ts",
	"src/extract/cmsBoxes.ts",
	"src/extract/page.ts",
	"src/recall/match.ts",
	"src/registers/",
	"src/schema/",
	"src/sources/",
	"src/xlsx/",
	"src/gates/",
	"src/verify/",
	"src/curate/",
	"src/text/",
]
// This file holds the fingerprint, so a hash that read it could never match it.
const SELF = "src/verify/rules.ts"
const byPath = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

// Every .ts file at or under one rule path, as a path relative to root with "/" between parts.
function tsFiles(root: string, rel: string): string[] {
	const path = join(root, rel)
	if (!existsSync(path)) return []
	if (!statSync(path).isDirectory()) return rel.endsWith(".ts") ? [rel] : []
	const dir = rel.endsWith("/") ? rel : `${rel}/`
	return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
		if (entry.isDirectory()) return tsFiles(root, `${dir}${entry.name}/`)
		return entry.name.endsWith(".ts") ? [`${dir}${entry.name}`] : []
	})
}

// sha256 over the rule files in sorted relative-path order, each as its path, a line break, its
// text with \r\n read as \n, and a line break. A checkout's line endings never change it.
export function rulesFingerprint(root: string): string {
	const files = [...new Set(RULE_PATHS.flatMap((p) => tsFiles(root, p)))]
		.filter((f) => f !== SELF)
		.sort(byPath)
	const hash = createHash("sha256")
	for (const rel of files) {
		const text = readFileSync(join(root, rel), "utf8").replace(/\r\n/g, "\n")
		hash.update(`${rel}\n${text}\n`)
	}
	return `sha256:${hash.digest("hex")}`
}

// The files src/verify/verify.ts reads, followed through their relative imports, that no rule
// path covers, sorted. src/net/ and src/io/ fetch and store and decide no value, so they stay out.
// A file listed here could change a lock's values while verify --resume keeps the old lock.
export function ruleGaps(root: string): string[] {
	const covered = (rel: string) =>
		RULE_PATHS.some((p) => (p.endsWith("/") ? rel.startsWith(p) : rel === p))
	const seen = new Set<string>()
	const todo = ["src/verify/verify.ts"]
	for (let rel = todo.pop(); rel !== undefined; rel = todo.pop()) {
		if (seen.has(rel)) continue
		seen.add(rel)
		const text = readFileSync(join(root, rel), "utf8")
		for (const [, spec] of text.matchAll(/from "(\.{1,2}\/[^"]+\.ts)"/g)) {
			if (spec !== undefined) todo.push(new URL(spec, `file:///${rel}`).pathname.slice(1))
		}
	}
	return [...seen]
		.filter((f) => !f.startsWith("src/net/") && !f.startsWith("src/io/") && !covered(f))
		.sort(byPath)
}
```

The all-zero `RULES_FINGERPRINT` is set to its real value in Step 9, after every rule file in this task is written and formatted.

- [ ] **Step 6: Record the inputs in `src/verify/verify.ts`**

Change line 1 to:

```ts
import { createHash } from "node:crypto"
import { existsSync, readdirSync, readFileSync } from "node:fs"
```

Change line 23 to:

```ts
import {
	acceptedCost,
	type LockField,
	LockFile,
	type LockInputs,
	type LockUnit,
} from "../schema/lock.ts"
```

Add with the `./context.ts` import:

```ts
import { RULES_VERSION } from "./rules.ts"
```

In `VerifyInput`, after `now: string`, add:

```ts
	// What the lock records it was built from: the file hashes, the NKLM edition and
	// RULES_VERSION. Without it, the hash of the extraction in hand and today's RULES_VERSION.
	inputs?: LockInputs
```

Add before `verifyKommune`:

```ts
function defaultInputs(extraction: ExtractionFile): LockInputs {
	const hash = createHash("sha256").update(JSON.stringify(extraction)).digest("hex")
	return { extraction: `sha256:${hash}`, rules: RULES_VERSION }
}
```

and in `verifyKommune` replace:

```ts
	const parsed = LockFile.safeParse({
		kommune: k.kommune,
		units: units.sort((a, b) => (a.unitId < b.unitId ? -1 : 1)),
	})
```

with:

```ts
	const parsed = LockFile.safeParse({
		kommune: k.kommune,
		inputs: input.inputs ?? defaultInputs(input.extraction),
		units: units.sort((a, b) => (a.unitId < b.unitId ? -1 : 1)),
	})
```

`verifyAndWrite` keeps its signature here; Task 6 changes it to pass the real inputs.

- [ ] **Step 7: Give every existing fixture lock its inputs**

`inputs` is now required, so each test file that builds a lock gets `inputs: testInputs()` after `kommune`, and imports `testInputs` from `./helpers.ts`. The grep that found them: `grep -rn "LockFile\.\(safe\)\?[pP]arse\|writeLockFile(\|kommune: \"[0-9]*\",\? *units\|: LockFile\b" test`. `test/verify.test.ts` line 793 writes a raw lock string it only compares byte for byte, so it stays. `test/session.test.ts` line 168 spreads `lockWith()`, which carries the inputs after the change below.

- `test/curatedWrite.test.ts`: line 15 becomes `import { curatedUnit, lockUnit, testInputs } from "./helpers.ts"`; line 70 becomes `const lock = { kommune: "3405", inputs: testInputs(), units: [lockUnit()] }`.
- `test/golden.test.ts`: line 9 becomes `import { acceptedField, lockUnit, testInputs } from "./helpers.ts"`; in the planted lock (lines 40-42) `kommune: row.kommune,` is followed by `inputs: testInputs(),`.
- `test/queue.test.ts`: line 9 becomes `import { acceptedField, curatedUnit, lockUnit, PAGE_URL, testInputs } from "./helpers.ts"`; in "asks again, labelled" (lines 60-63) `kommune: "3405",` is followed by `inputs: testInputs(),`.
- `test/reviewHelpers.ts`: line 7 becomes `import { acceptedField, curatedUnit, lockUnit, testInputs } from "./helpers.ts"`; in `lockWith` (lines 21-22) `kommune: "3405",` is followed by `inputs: testInputs(),`.
- `test/session.test.ts`: line 9 becomes `import { acceptedField, curatedUnit, lockUnit, PAGE_URL, testInputs } from "./helpers.ts"`; in `onePhone` (line 40), in `oneField` (line 343) and in "reads the unit's own accepted cost" (line 361), each `kommune: "3405",` inside `dataDir({` is followed by `inputs: testInputs(),`. For example, `onePhone` becomes:

  ```ts
  const onePhone = (phone: Parameters<typeof reviewField>[0]): string =>
  	dataDir({
  		kommune: "3405",
  		inputs: testInputs(),
  		units: [lockUnit({ unitId: "org:999999991", fields: { phone: reviewField(phone) } })],
  	})
  ```

- `test/score.test.ts`: line 5 becomes `import { acceptedField, lockUnit, testInputs } from "./helpers.ts"`; line 50 becomes `const lock = (units: LockUnit[]): LockFile => ({ kommune: "3403", inputs: testInputs(), units })`.

Then confirm none is left: `npm run typecheck` reports no `Property 'inputs' is missing` error.

- [ ] **Step 8: Regenerate the JSON Schema**

Run: `npm run schema`
Expected: `wrote schema/lock.schema.json` among the four lines. `git diff --stat schema/` shows only `schema/lock.schema.json` changed: `inputs` and `failed` added, each with `"additionalProperties": false`, and `inputs` in the top-level `required`. Then `npx vitest run test/schemaExport.test.ts`: PASS (the file matches, and every object is closed).

- [ ] **Step 9: Set the fingerprint**

Format first, because the hash is over the files as committed: `npx biome check --write .`. Then run `npx vitest run test/rules.test.ts`. Expected: FAIL on "moves with the rule files", with the message `rule files changed: bump RULES_VERSION in src/verify/rules.ts and set RULES_FINGERPRINT to sha256:<64 hex digits>`. Copy that `sha256:...` value into `RULES_FINGERPRINT` in `src/verify/rules.ts`. It is a hash of source code, not page data, so reading it is fine. Keep `RULES_VERSION` at 1: no lock records a version yet. `rules.ts` is outside the hash, so editing the literal does not move it. Run the test again: PASS.

For the rest of this PR: until Task 13 Step 4 writes the first locks, a later task that changes a file under `RULE_PATHS` (Task 6 under `src/verify/`, Task 11 in `src/text/names.ts`) sets the new `RULES_FINGERPRINT` the same way and keeps `RULES_VERSION` at 1. From then on, every such change bumps both.

- [ ] **Step 10: Run the tests to see them pass**

Run: `npx vitest run test/rules.test.ts test/schema.test.ts test/dataCheck.test.ts test/verify.test.ts test/schemaExport.test.ts && npm test`
Expected: PASS, the whole suite included (`golden`, `queue`, `session`, `score` and `curatedWrite` with their fixture locks carrying `inputs`).

- [ ] **Step 11: Show it red once**

Each break, one at a time; restore after each and run the same file again to see it PASS.

1. In `LockFile`'s `superRefine`, delete the `file.failed !== undefined && file.units.length > 0` check. Run `npx vitest run test/schema.test.ts`: FAIL on "rejects a failed lock with a unit, at units".
2. Add one empty line at the end of `src/gates/run.ts`. Run `npx vitest run test/rules.test.ts`: FAIL on "moves with the rule files" with the message "rule files changed: bump RULES_VERSION in src/verify/rules.ts and set RULES_FINGERPRINT to sha256:...". Restore with `git checkout -- src/gates/run.ts` (this task does not change that file).
3. In `rulesFingerprint`, delete `.filter((f) => f !== SELF)`. Run `npx vitest run test/rules.test.ts`: FAIL on "leaves out rules.ts itself" and on "moves with the rule files".
4. In `LockInputs`, change `rules: z.number().int().positive()` to `rules: z.number()`. Run `npx vitest run test/schema.test.ts`: FAIL on "takes every input a resume compares, and nothing else".
5. Delete `"src/recall/match.ts"` from `RULE_PATHS` and from the test's `toEqual` list. Run `npx vitest run test/rules.test.ts`: FAIL on "covers every file verify.ts imports, outside src/net/ and src/io/", naming `src/recall/match.ts` (and on "moves with the rule files", since the hash lost a file).

Note each break and its red result for the PR body.

- [ ] **Step 12: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm run lint && npm test && npm run data:check
git add src/schema/lock.ts src/verify/rules.ts src/verify/verify.ts schema/lock.schema.json test/helpers.ts test/rules.test.ts test/schema.test.ts test/dataCheck.test.ts test/verify.test.ts test/curatedWrite.test.ts test/golden.test.ts test/queue.test.ts test/reviewHelpers.ts test/session.test.ts test/score.test.ts
git commit -m "feat(pipeline): record each lock's inputs and failure, and tie RULES_VERSION to the rule files"
```

`npm run data:check` passes with no lock files in `data/lock/` yet; the failed-lock test above shows `checkData` passes a failed lock.

### Task 6: Extract and verify: `--resume`, failed locks, `--offline`, progress and the repo's `data/`

A pilot run is stopped and resumed, and a kommune whose site stopped must still get a lock. Each lock records the inputs it was built from (`inputs`), and `verify --resume` skips a kommune only when every input hashes the same as last time: the extraction file, the national file, the curated file as verify saved it, the NKLM edition and `RULES_VERSION`. A kommune whose extraction file holds no pages gets a lock with no units and the crawler's reason, once the crawl report settles every page (Decided 4). `--offline` makes `extract` and `verify` read only the caches. A miss is an error that names what it missed (local only). Both stages print a line per kommune, take the page-cache lock and record their duration. Verify may now write to the repo's `data/` (Decided 13).

**Files:**
- Create: `pipeline/src/verify/resume.ts`, `pipeline/src/verify/failed.ts`, `pipeline/test/verifyHelpers.ts`
- Modify: `pipeline/src/verify/rules.ts` (the new `RULES_FINGERPRINT`, Step 16)
- Modify: `pipeline/src/io/files.ts` (imports, after line 41), `pipeline/src/curate/write.ts` (lines 72-86 on `main`), `pipeline/src/verify/verify.ts` (imports; `VerifyInput` lines 41-54; the `resolveAddresses` call, line 243; `verifyAndWrite` lines 350-367; `unfinishedReason` lines 372-378; `verifyEach` lines 380-400), `pipeline/src/extract/extract.ts` (imports; `extractScope` lines 126-165; `extractScopes` lines 191-212; new `runExtract` after line 254), `pipeline/src/cli/verify.ts` (whole file), `pipeline/src/cli/extract.ts` (whole file)
- Test: `pipeline/test/resumeVerify.test.ts`, `pipeline/test/failed.test.ts`, `pipeline/test/offline.test.ts` (all new), `pipeline/test/extract.test.ts` (extend), `pipeline/test/verify.test.ts` (seven calls updated, one test added)

**Interfaces:**
- Consumes: `LockInputs`, `LockFailure`, `FAILED_KINDS`, `LockFile` with `inputs` and `failed` (Task 5); `RULES_VERSION` (Task 5); `VerifyInput.inputs?` (Task 5); `AddressCache`, `OfflineMissError`, `offlineGet`, `AddressLookupError`, `resolveAddresses(get, addresses, kommune, cache?)` (Task 3); `holdCache`, `CacheBusyError`, `recordTiming`, `HostLine.delayMs`, `readCrawlReport(path)` (Task 4); `parseOnly`, `selects` (Task 1); on `main`: `extractionPath`, `readExtraction`, `purgeExtractions`, `findCuratedPath`, `lockPath`, `readCuratedFile`, `writeLockFile`, `writeCuratedFile`, `holdDataDir`, `writeJsonAtomic`, `httpsHost`, `checkData`.
- Produces:
  - `src/verify/resume.ts`: `sha256File(path: string): string | undefined`, `lockInputs(o: { cacheDir: string; dataDir: string; kommune: string; nklmDate?: string }): LockInputs`, `canSkip(dataDir: string, kommune: string, inputs: LockInputs): boolean`, `splitResume<K extends { kommune: string }>(kommuner: readonly K[], o: { cacheDir: string; dataDir: string; nklmDate?: string }): { todo: K[]; skipped: K[] }`.
  - `src/verify/failed.ts`: `type FailedKind`, `TRANSIENT_KINDS: readonly FailedKind[]`, `failedKind(k: KommuneDiscovery, report: CrawlReport | undefined): LockFailure`, `failedLock(kommune: string, failure: LockFailure, inputs: LockInputs): LockFile`, `writeFailedLock(dataDir, k, report, inputs, io?): Promise<LockFailure>`, `failedCounts(k: { kommune: string; name: string }): VerifyCounts`.
  - `src/verify/verify.ts`: `VerifyInput.addressCache?: AddressCache`; `verifyAndWrite(dataDir: string, input: VerifyInput, inputs: Omit<LockInputs, "curated">, io?: RenameIo): Promise<VerifyCounts>`; `verifyEach(kommuner, run, onDone?: (k: K, at: number, of: number) => void)`; `unfinishedReason` names an `OfflineMissError` with its `what`, and an `AddressLookupError` (Task 3) with its message.
  - `src/io/files.ts`: `sha256Of(data: string | Uint8Array): string` (`"sha256:<hex>"`).
  - `src/curate/write.ts`: `curatedText(file: CuratedFile): string`, the exact text `writeCuratedFile` saves.
  - `src/extract/extract.ts`: `ExtractOptions = { offline?: boolean; notFetched?: ReadonlySet<string> }`; `extractScope(..., options?)`; `extractScopes(..., options?: ExtractOptions & { onDone? })` returns `{ summaries, failed, misses }`; `runExtract(o: ExtractRun): { purged: number | undefined; summaries; failed; misses }`.
  - Files: `<cache>/verify-stats.json` (`{ lookups, hits }`), and `verify` and `extract` entries in `<cache>/timings.json`. Task 10 reads both. `verify --resume` writes neither the stats nor its timing, so they stay the full run's.
  - `src/verify/failed.ts` also: `fetchSettled(k: KommuneDiscovery, report: CrawlReport | undefined): boolean`.

- [ ] **Step 1: Write the shared verify fixture**

`test/verify.test.ts` keeps its own `setup()`. Three new test files need the same fictional kommune, plus an extraction file on disk (which `lockInputs` hashes), so it lives in one helper. Create `pipeline/test/verifyHelpers.ts`:

```ts
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { DiscoveredUnit, KommuneDiscovery } from "../src/discover/types.ts"
import { extractionPath, extractScope } from "../src/extract/extract.ts"
import { writeJsonAtomic } from "../src/io/files.ts"
import { PageCache } from "../src/io/pageCache.ts"
import { AllowList } from "../src/net/allowList.ts"
import type { Fetched, Get } from "../src/net/crawler.ts"
import { addressQuery } from "../src/registers/kartverket.ts"
import type { VerifyInput } from "../src/verify/verify.ts"
import { fakeGet } from "./netHelpers.ts"

// The fictional barneverntjeneste of verify.test.ts, with its extraction file written to a temp
// cache, as extract leaves it for verify. Every value is fictional.
export const K = "https://www.eksempel.kommune.no"
export const NOW = "2026-11-06T10:00:00Z"
export const BV = `${K}/barnevern/`
export const CTX = { places: ["Lillehammer"], kommuneHost: "www.eksempel.kommune.no" }

const html = (body: string) =>
	`<html><head><meta name="acos-cmscontext" content="x"></head><body><main class="main">${body}</main></body></html>`

export const UNIT_PAGE = html(
	[
		"<h1>Eksempel barneverntjeneste</h1>",
		"<p>Barneverntjenesten er gratis, og du trenger ikke henvisning.</p>",
		"<h2>Kontakt</h2>",
		"<p>Telefon: 62 00 00 00</p>",
		'<p>E-post: <a href="mailto:barnevern@eksempel.kommune.no">barnevern@eksempel.kommune.no</a></p>',
		"<p>Besøksadresse: Storgata 1, 2609 Lillehammer</p>",
		"<h2>Åpningstider</h2>",
		"<p>Mandag 08.00-15.30</p>",
	].join("")
)

export const unit = (over: Partial<DiscoveredUnit> = {}): DiscoveredUnit => ({
	orgNumber: "999999991",
	name: "EKSEMPEL KOMMUNE BARNEVERNTJENESTE",
	orgForm: "BEDR",
	naeringskode: "88.991",
	address: "Storgata 1, 2609 LILLEHAMMER",
	kommune: "3405",
	website: BV,
	register: "underenheter",
	...over,
})

export const fetched = (url: string, body: string): Fetched => ({
	ok: true,
	url,
	finalUrl: url,
	status: 200,
	contentType: "text/html",
	headers: {},
	body,
	fetchedAt: "2026-11-06T09:00:00Z",
})

const kartverket = fakeGet({
	[addressQuery("storgata 1", "3405")]: {
		body: JSON.stringify({
			adresser: [
				{
					adresseid: "a1",
					adressetekst: "Storgata 1",
					kommunenummer: "3405",
					postnummer: "2609",
					poststed: "LILLEHAMMER",
				},
			],
		}),
	},
})

export function verifySetup(o: {
	pages: Record<string, string>
	units?: DiscoveredUnit[]
	get?: Get
}): { dir: string; cacheDir: string; dataDir: string; input: VerifyInput } {
	const dir = mkdtempSync(join(tmpdir(), "varde-resume-"))
	const cacheDir = join(dir, "cache")
	const dataDir = join(dir, "data")
	const cache = new PageCache(join(cacheDir, "pages"))
	for (const [url, body] of Object.entries(o.pages))
		cache.put(fetched(url, body), { adapter: "acos" })
	const kommune: KommuneDiscovery = {
		kommune: "3405",
		name: "Lillehammer",
		discoveredAt: NOW,
		site: {
			host: "www.eksempel.kommune.no",
			sitemap: "probe",
			sitemapUrls: 1,
			servicePages: 1,
			kept: 1,
			truncated: false,
		},
		brregComplete: true,
		allSitemapUrls: [],
		units: o.units ?? [],
		pages: Object.keys(o.pages).map((url) => ({ url, from: "sitemap" as const })),
	}
	const { file } = extractScope("3405", Object.keys(o.pages), cache, CTX, NOW)
	writeJsonAtomic(extractionPath(cacheDir, "3405"), file)
	const input: VerifyInput = {
		kommune,
		extraction: file,
		manifest: cache.entries(),
		readHtml: (e) => cache.read(e),
		allowList: AllowList.restore([
			{ host: "www.eksempel.kommune.no", kind: "kommune", licence: "ownPage" },
		]),
		validKommuner: new Set(["3405"]),
		places: CTX.places,
		get: o.get ?? kartverket,
		now: NOW,
	}
	return { dir, cacheDir, dataDir, input }
}
```

- [ ] **Step 2: Write the failing resume tests**

Create `pipeline/test/resumeVerify.test.ts`:

```ts
import { readFileSync, utimesSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { curatedText, writeCuratedFile } from "../src/curate/write.ts"
import { extractionPath, readExtraction } from "../src/extract/extract.ts"
import { writeJsonAtomic } from "../src/io/files.ts"
import { fetchSettled, writeFailedLock } from "../src/verify/failed.ts"
import { canSkip, lockInputs, sha256File, splitResume } from "../src/verify/resume.ts"
import { RULES_VERSION } from "../src/verify/rules.ts"
import {
	findCuratedPath,
	lockPath,
	readCuratedFile,
	verifyAndWrite,
	verifyEach,
} from "../src/verify/verify.ts"
import { BV, NOW, UNIT_PAGE, unit, verifySetup } from "./verifyHelpers.ts"

const LATER = "2026-11-07T10:00:00Z"
type Setup = ReturnType<typeof verifySetup>

const where = (s: Setup) => ({ cacheDir: s.cacheDir, dataDir: s.dataDir })
const lockBytes = (s: Setup) => readFileSync(lockPath(s.dataDir, "3405"))
const curatedAt = (s: Setup) => findCuratedPath(s.dataDir, "3405") ?? ""
// A lock file newer than everything else, as a checkout or a copy leaves it.
const touchAhead = (path: string) => {
	const ahead = new Date(Date.now() + 86_400_000)
	utimesSync(path, ahead, ahead)
}

async function verified(): Promise<Setup> {
	const s = verifySetup({ pages: { [BV]: UNIT_PAGE }, units: [unit()] })
	await verifyAndWrite(s.dataDir, s.input, lockInputs({ ...where(s), kommune: "3405" }))
	return s
}

// One resumed run, as the verify CLI runs it: split the kommuner, then verify the ones left from
// the files on disk, a day later.
async function resume(s: Setup, nklmDate?: string) {
	const o = { ...where(s), ...(nklmDate === undefined ? {} : { nklmDate }) }
	const { todo, skipped } = splitResume([s.input.kommune], o)
	const { unfinished } = await verifyEach(todo, async (k) => {
		const extraction = readExtraction(s.cacheDir, k.kommune)
		if (extraction === undefined) return undefined
		const at = findCuratedPath(s.dataDir, k.kommune)
		const input = {
			...s.input,
			extraction,
			now: LATER,
			...(at === undefined ? {} : { curated: readCuratedFile(at, k.kommune) }),
		}
		return verifyAndWrite(s.dataDir, input, lockInputs({ ...o, kommune: k.kommune }))
	})
	expect(unfinished).toEqual([])
	return { todo: todo.map((k) => k.kommune), skipped: skipped.map((k) => k.kommune) }
}

describe("lockInputs", () => {
	it("hashes the kommune's extraction file and records the rules version", () => {
		const s = verifySetup({ pages: { [BV]: UNIT_PAGE }, units: [unit()] })
		const inputs = lockInputs({ ...where(s), kommune: "3405" })
		expect(inputs).toEqual({
			extraction: sha256File(extractionPath(s.cacheDir, "3405")),
			rules: RULES_VERSION,
		})
		expect(inputs.extraction).toMatch(/^sha256:[0-9a-f]{64}$/)
	})

	it("adds the national file, the curated file and the NKLM edition when there are any", async () => {
		const s = verifySetup({ pages: { [BV]: UNIT_PAGE }, units: [unit()] })
		writeJsonAtomic(extractionPath(s.cacheDir, "national"), {
			scope: "national",
			extractedAt: NOW,
			pages: [],
		})
		const curated = join(s.dataDir, "curated", "3405-lillehammer.json")
		await writeCuratedFile(curated, { kommune: "3405", name: "Lillehammer", units: [] })
		expect(lockInputs({ ...where(s), kommune: "3405", nklmDate: "2026-11-01" })).toEqual({
			extraction: sha256File(extractionPath(s.cacheDir, "3405")),
			national: sha256File(extractionPath(s.cacheDir, "national")),
			curated: sha256File(curated),
			nklm: "2026-11-01",
			rules: RULES_VERSION,
		})
	})

	it("names the kommune when its extraction file is missing", () => {
		const s = verifySetup({ pages: { [BV]: UNIT_PAGE }, units: [unit()] })
		expect(() => lockInputs({ ...where(s), kommune: "3407" })).toThrow(
			"3407: no extraction file (run extract first)"
		)
	})
})

describe("verifyAndWrite and the lock's inputs", () => {
	it("records the curated file's hash exactly as it saved the file, so a resume right after skips", async () => {
		const s = await verified()
		const lock = JSON.parse(readFileSync(lockPath(s.dataDir, "3405"), "utf8"))
		expect(lock.inputs).toEqual({
			extraction: sha256File(extractionPath(s.cacheDir, "3405")),
			curated: sha256File(curatedAt(s)),
			rules: RULES_VERSION,
		})
		expect(readFileSync(curatedAt(s), "utf8")).toBe(
			curatedText(readCuratedFile(curatedAt(s), "3405"))
		)
		expect(canSkip(s.dataDir, "3405", lockInputs({ ...where(s), kommune: "3405" }))).toBe(true)
	})
})

describe("verify --resume", () => {
	it("leaves a finished kommune byte for byte the same", async () => {
		const s = await verified()
		const lock = lockBytes(s)
		const curated = readFileSync(curatedAt(s))
		expect(await resume(s)).toEqual({ todo: [], skipped: ["3405"] })
		expect(lockBytes(s)).toEqual(lock)
		expect(readFileSync(curatedAt(s))).toEqual(curated)
	})

	it("would change the lock on a plain re-run, so the skip is what keeps it the same", async () => {
		const s = await verified()
		const before = lockBytes(s)
		await verifyAndWrite(
			s.dataDir,
			{ ...s.input, now: LATER },
			lockInputs({ ...where(s), kommune: "3405" })
		)
		expect(lockBytes(s)).not.toEqual(before)
	})

	it("re-runs a kommune whose extraction file changed, even when its lock file is newer", async () => {
		const s = await verified()
		const path = extractionPath(s.cacheDir, "3405")
		writeJsonAtomic(path, { ...JSON.parse(readFileSync(path, "utf8")), extractedAt: LATER })
		touchAhead(lockPath(s.dataDir, "3405"))
		const before = lockBytes(s)
		expect(await resume(s)).toEqual({ todo: ["3405"], skipped: [] })
		expect(lockBytes(s)).not.toEqual(before)
	})

	it("re-runs a kommune whose lock was written under another RULES_VERSION, even when it is newer", async () => {
		const s = await verified()
		const at = lockPath(s.dataDir, "3405")
		const lock = JSON.parse(readFileSync(at, "utf8"))
		const other = { ...lock, inputs: { ...lock.inputs, rules: RULES_VERSION + 1 } }
		writeFileSync(at, `${JSON.stringify(other, null, "\t")}\n`)
		touchAhead(at)
		expect(await resume(s)).toEqual({ todo: ["3405"], skipped: [] })
		expect(JSON.parse(readFileSync(at, "utf8")).inputs.rules).toBe(RULES_VERSION)
	})

	it("re-runs a kommune after review saved my answer in its curated file", async () => {
		const s = await verified()
		const curated = readCuratedFile(curatedAt(s), "3405")
		const decision = {
			field: "phone" as const,
			value: "62 00 00 00",
			sourceUrl: BV,
			decision: "accept" as const,
			decidedOn: "2026-11-07",
		}
		await writeCuratedFile(curatedAt(s), {
			...curated,
			units: curated.units.map((u) => ({ ...u, decisions: [decision] })),
		})
		touchAhead(lockPath(s.dataDir, "3405"))
		expect(await resume(s)).toEqual({ todo: ["3405"], skipped: [] })
		// The re-run lock records the file with my answer, so the next resume skips.
		expect(await resume(s)).toEqual({ todo: [], skipped: ["3405"] })
	})

	it("re-runs a kommune when the NKLM edition changes or a national file appears", async () => {
		const s = await verified()
		expect((await resume(s, "2026-11-01")).todo).toEqual(["3405"])
		expect((await resume(s, "2026-11-01")).skipped).toEqual(["3405"])
		writeJsonAtomic(extractionPath(s.cacheDir, "national"), {
			scope: "national",
			extractedAt: NOW,
			pages: [],
		})
		expect((await resume(s, "2026-11-01")).todo).toEqual(["3405"])
	})

	it("never skips without a lock, with a lock that does not parse, or with a failed lock", async () => {
		const s = verifySetup({ pages: { [BV]: UNIT_PAGE }, units: [unit()] })
		const inputs = lockInputs({ ...where(s), kommune: "3405" })
		expect(canSkip(s.dataDir, "3405", inputs)).toBe(false)
		await writeFailedLock(s.dataDir, s.input.kommune, undefined, inputs)
		expect(canSkip(s.dataDir, "3405", inputs)).toBe(false)
		writeFileSync(lockPath(s.dataDir, "3405"), "{ Kari Nordmann")
		expect(canSkip(s.dataDir, "3405", inputs)).toBe(false)
	})

	it("keeps a kommune with no extraction file in the run, so the run still names it", () => {
		const s = verifySetup({ pages: { [BV]: UNIT_PAGE }, units: [unit()] })
		const other = { ...s.input.kommune, kommune: "3407" }
		expect(splitResume([other], where(s))).toEqual({ todo: [other], skipped: [] })
	})
})

describe("fetchSettled", () => {
	const kommune = () => verifySetup({ pages: { [BV]: UNIT_PAGE } }).input.kommune

	it("is settled when the crawl report lists every page as not fetched", () => {
		const skippedBv = { ok: false as const, url: BV, reason: "hostSkipped" as const }
		expect(fetchSettled(kommune(), { hosts: [], notFetched: [skippedBv] })).toBe(true)
	})

	it("is not settled when a page is neither cached nor listed, as a fetch stopped with Ctrl+C leaves it", () => {
		expect(fetchSettled(kommune(), { hosts: [], notFetched: [] })).toBe(false)
		expect(fetchSettled(kommune(), undefined)).toBe(false)
	})

	it("is settled for a kommune with no pages to fetch", () => {
		expect(fetchSettled({ ...kommune(), pages: [] }, undefined)).toBe(true)
	})
})
```

- [ ] **Step 3: Write the failing failed-lock tests**

Create `pipeline/test/failed.test.ts`:

```ts
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { checkData } from "../src/check/dataCheck.ts"
import type { KommuneDiscovery } from "../src/discover/types.ts"
import type { CrawlReport, HostLine } from "../src/net/crawler.ts"
import { LockFile } from "../src/schema/lock.ts"
import {
	failedCounts,
	failedKind,
	failedLock,
	TRANSIENT_KINDS,
	writeFailedLock,
} from "../src/verify/failed.ts"
import { RULES_VERSION } from "../src/verify/rules.ts"
import { formatVerifySummary, lockPath } from "../src/verify/verify.ts"

const SITE = "www.eksempel.kommune.no"
const OTHER = "www.eksempel-helse.no"
const A = `https://${SITE}/barnevern/`
const B = `https://${OTHER}/rus/`
const INPUTS = { extraction: `sha256:${"0".repeat(64)}`, rules: RULES_VERSION }

const kommune = (pages: readonly string[] = [A, B]): KommuneDiscovery => ({
	kommune: "3405",
	name: "Lillehammer",
	discoveredAt: "2026-11-06T10:00:00Z",
	site: {
		host: SITE,
		sitemap: "probe",
		sitemapUrls: 2,
		servicePages: 2,
		kept: 2,
		truncated: false,
	},
	brregComplete: true,
	allSitemapUrls: [],
	units: [],
	pages: pages.map((url) => ({ url, from: "sitemap" as const })),
})
const host = (name: string, stopped?: HostLine["stopped"]): HostLine =>
	stopped === undefined
		? { host: name, requests: 3, delayMs: 5_000 }
		: { host: name, requests: 3, delayMs: 5_000, stopped }
const report = (over: Partial<CrawlReport> = {}): CrawlReport => ({
	hosts: [],
	notFetched: [],
	...over,
})

describe("failedKind", () => {
	it("gives the stop of the kommune's own site, a transient one for a timeout", () => {
		const failure = failedKind(kommune(), report({ hosts: [host(SITE, "timeout")] }))
		expect(failure).toEqual({ kind: "timeout", reason: `host stopped: timeout (${SITE})` })
		expect(TRANSIENT_KINDS).toContain(failure.kind)
	})

	it("puts the kommune's own site first, before another page host that stopped", () => {
		const r = report({ hosts: [host(OTHER, "serverError"), host(SITE, "visitTime")] })
		expect(failedKind(kommune(), r).kind).toBe("visitTime")
	})

	it("gives a page host's stop when the kommune's own site ran", () => {
		const r = report({ hosts: [host(OTHER, "serverError"), host(SITE)] })
		expect(failedKind(kommune(), r)).toEqual({
			kind: "serverError",
			reason: `host stopped: serverError (${OTHER})`,
		})
	})

	it("ignores a stopped host that serves none of the kommune's pages", () => {
		const r = report({ hosts: [host("www.annen.kommune.no", "timeout")] })
		expect(failedKind(kommune(), r).kind).toBe("noPages")
	})

	it("says robots when robots.txt refused every page, and only then", () => {
		const refused = (url: string) => ({ ok: false as const, url, reason: "robots" as const })
		expect(failedKind(kommune(), report({ notFetched: [refused(A), refused(B)] }))).toEqual({
			kind: "robots",
			reason: "every page refused by robots.txt",
		})
		const mixed = report({
			notFetched: [refused(A), { ok: false, url: B, reason: "httpStatus", status: 404 }],
		})
		expect(failedKind(kommune(), mixed).kind).toBe("noPages")
	})

	it("says no pages fetched when the report says nothing, or there is no report", () => {
		expect(failedKind(kommune(), report())).toEqual({ kind: "noPages", reason: "no pages fetched" })
		expect(failedKind(kommune(), undefined).kind).toBe("noPages")
		expect(failedKind(kommune([]), report()).kind).toBe("noPages")
	})

	it("never puts a URL in the reason", () => {
		const r = report({ hosts: [host(SITE, "network")] })
		expect(failedKind(kommune(), r).reason).not.toContain("/barnevern/")
	})

	it("counts only a timeout, a network error and a server error as transient", () => {
		expect(TRANSIENT_KINDS).toEqual(["timeout", "network", "serverError"])
		for (const kind of ["robots", "noPages", "visitTime", "secondTooMany"] as const) {
			expect(TRANSIENT_KINDS).not.toContain(kind)
		}
	})
})

describe("failed locks", () => {
	it("writes a lock with no units and its reason, which data:check passes", async () => {
		const root = mkdtempSync(join(tmpdir(), "varde-failed-"))
		const dataDir = join(root, "data")
		const failure = await writeFailedLock(
			dataDir,
			kommune(),
			report({ hosts: [host(SITE, "timeout")] }),
			INPUTS
		)
		const lock = LockFile.parse(JSON.parse(readFileSync(lockPath(dataDir, "3405"), "utf8")))
		expect(lock).toMatchObject({ kommune: "3405", units: [], failed: failure, inputs: INPUTS })
		expect(checkData(root)).toEqual([])
	})

	it("leaves the curated file alone, so my answers survive a failed run", async () => {
		const root = mkdtempSync(join(tmpdir(), "varde-failed-"))
		const dataDir = join(root, "data")
		mkdirSync(join(dataDir, "curated"), { recursive: true })
		const curated = join(dataDir, "curated", "3405-lillehammer.json")
		const text = `${JSON.stringify({ kommune: "3405", name: "Lillehammer", units: [] }, null, "\t")}\n`
		writeFileSync(curated, text)
		await writeFailedLock(dataDir, kommune(), undefined, INPUTS)
		expect(readFileSync(curated, "utf8")).toBe(text)
	})

	it("builds a lock the schema accepts for a robots refusal and for no pages", () => {
		for (const failure of [
			{ kind: "robots" as const, reason: "every page refused by robots.txt" },
			{ kind: "noPages" as const, reason: "no pages fetched" },
		]) {
			expect(LockFile.safeParse(failedLock("3405", failure, INPUTS)).success).toBe(true)
		}
	})

	it("counts a failed kommune as zero units in the summary", () => {
		expect(formatVerifySummary([failedCounts(kommune())])).toContain("3405 Lillehammer: 0 units")
	})
})
```

- [ ] **Step 4: Write the failing offline tests**

Create `pipeline/test/offline.test.ts`:

```ts
import { existsSync, mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
	extractionPath,
	extractScope,
	extractScopes,
	runExtract,
} from "../src/extract/extract.ts"
import { AddressCache } from "../src/io/addressCache.ts"
import { writeJsonAtomic } from "../src/io/files.ts"
import { OfflineMissError, offlineGet } from "../src/io/offline.ts"
import { PageCache } from "../src/io/pageCache.ts"
import { AddressLookupError } from "../src/registers/kartverket.ts"
import { unfinishedReason, verifyEach, verifyKommune } from "../src/verify/verify.ts"
import { BV, CTX, fetched, K, NOW, UNIT_PAGE, unit, verifySetup } from "./verifyHelpers.ts"

const MISSING = `${K}/ikke-hentet/`
const cachedRoot = () => {
	const root = mkdtempSync(join(tmpdir(), "varde-offline-"))
	const cache = new PageCache(join(root, "pages"))
	cache.put(fetched(BV, UNIT_PAGE), { adapter: "acos" })
	return { root, cache }
}

describe("verify --offline", () => {
	it("stops a kommune on an address the Kartverket cache does not hold, and names the search", async () => {
		const s = verifySetup({ pages: { [BV]: UNIT_PAGE }, units: [unit()], get: offlineGet })
		const addressCache = new AddressCache(join(s.cacheDir, "kartverket"), { offline: true })
		const err: unknown = await verifyKommune({ ...s.input, addressCache }).catch(
			(e: unknown) => e
		)
		expect(err).toBeInstanceOf(OfflineMissError)
		const miss = err as OfflineMissError
		expect(miss.message).toBe(`offline: not in the cache: ${miss.what}`)
		expect(miss.what.toLowerCase()).toContain("storgata")
		expect(addressCache.hits).toBe(0)
	})

	it("names the kommune and the miss in the run's reasons, the one reason that prints a search", async () => {
		const run = async (): Promise<undefined> => {
			throw new OfflineMissError("storgata 1")
		}
		const { unfinished } = await verifyEach([{ kommune: "3405" }], run)
		expect(unfinished).toEqual([
			{ kommune: "3405", reason: "3405: offline: not in the cache: storgata 1" },
		])
		expect(unfinishedReason("3405", new Error("Kari Nordmann"))).toBe(
			"3405: stopped on an unexpected error"
		)
		expect(unfinishedReason("3405", new AddressLookupError())).toBe(
			"3405: Kartverket stopped answering in this run, so no address was checked and nothing was written: run verify --resume later"
		)
	})
})

describe("extract --offline", () => {
	it("throws on a page the cache does not hold, naming its URL", () => {
		const { cache } = cachedRoot()
		expect(() =>
			extractScope("3405", [BV, MISSING], cache, CTX, NOW, { offline: true })
		).toThrow(`offline: not in the cache: ${MISSING}`)
	})

	it("counts a page fetch recorded as not fetched, as an online run does", () => {
		const { cache } = cachedRoot()
		const offline = extractScope("3405", [BV, MISSING], cache, CTX, NOW, {
			offline: true,
			notFetched: new Set([MISSING]),
		})
		expect(offline.summary).toMatchObject({ pages: 1, notInCache: 1 })
		const online = extractScope("3405", [BV, MISSING], cache, CTX, NOW)
		expect(online.summary).toMatchObject({ pages: 1, notInCache: 1 })
	})

	it("goes on to the next scope after a miss, and keeps the miss apart from the failures", () => {
		const { cache } = cachedRoot()
		const scopes = [
			{ scope: "3405", urls: [MISSING], ctx: CTX },
			{ scope: "3407", urls: [BV], ctx: CTX },
		]
		const written: string[] = []
		const result = extractScopes(
			scopes,
			cache,
			NOW,
			(scope) => {
				written.push(scope)
			},
			{ offline: true }
		)
		expect(written).toEqual(["3407"])
		expect(result.failed).toEqual([])
		expect(result.misses).toEqual([`3405: offline: not in the cache: ${MISSING}`])
		expect(result.summaries.map((s) => s.scope)).toEqual(["3407"])
	})

	it("purges no extraction file offline, and purges an old one online", () => {
		const { root, cache } = cachedRoot()
		const old = extractionPath(root, "3407")
		writeJsonAtomic(old, { scope: "3407", extractedAt: "2026-01-01T00:00:00Z", pages: [] })
		const run = { root, scopes: [{ scope: "3405", urls: [BV], ctx: CTX }], cache, now: NOW }
		const offline = runExtract({ ...run, nowMs: Date.parse(NOW), offline: true })
		expect(offline.purged).toBeUndefined()
		expect(existsSync(old)).toBe(true)
		expect(existsSync(extractionPath(root, "3405"))).toBe(true)
		const online = runExtract({ ...run, nowMs: Date.parse(NOW) })
		expect(online.purged).toBe(1)
		expect(existsSync(old)).toBe(false)
	})

	it("writes nothing in a dry run", () => {
		const { root, cache } = cachedRoot()
		const scopes = [{ scope: "3405", urls: [BV], ctx: CTX }]
		const result = runExtract({ root, scopes, cache, now: NOW, nowMs: Date.parse(NOW), dryRun: true })
		expect(result.purged).toBeUndefined()
		expect(existsSync(extractionPath(root, "3405"))).toBe(false)
	})

	it("reports each scope it finishes, with a running count", () => {
		const { root, cache } = cachedRoot()
		const scopes = [
			{ scope: "3405", urls: [BV], ctx: CTX },
			{ scope: "3407", urls: [MISSING], ctx: CTX },
			{ scope: "3411", urls: [BV], ctx: CTX },
		]
		const lines: string[] = []
		runExtract({
			root,
			scopes,
			cache,
			now: NOW,
			nowMs: Date.parse(NOW),
			offline: true,
			onDone: (scope, at, of) => lines.push(`extract: ${scope} done (${at} of ${of})`),
		})
		expect(lines).toEqual(["extract: 3405 done (1 of 3)", "extract: 3411 done (3 of 3)"])
	})
})
```

- [ ] **Step 5: Pin the empty extraction file, and the verify progress callback**

Add to `pipeline/test/extract.test.ts`, after the `describe("extractScopes", ...)` block:

```ts
describe("extractScopes: a scope with no cached page", () => {
	it("still writes its file, with no pages, so verify can write its failed lock", () => {
		const cache = cacheWith({})
		const pages: [string, number][] = []
		const { summaries, failed } = extractScopes(
			[{ scope: "3405", name: "Lillehammer", urls: [A, B], ctx }],
			cache,
			NOW,
			(scope, file) => {
				pages.push([scope, file.pages.length])
			}
		)
		expect(failed).toEqual([])
		expect(pages).toEqual([["3405", 0]])
		expect(summaries[0]).toMatchObject({ pages: 0, notInCache: 2 })
	})
})
```

Add to `pipeline/test/verify.test.ts`, inside `describe("verifyEach", ...)` after its existing test (it reuses that block's `counts` helper):

```ts
	it("reports each kommune it finishes, with a running count", async () => {
		const lines: string[] = []
		await verifyEach(
			["3405", "3407", "3411"].map((kommune) => ({ kommune })),
			async ({ kommune }) => {
				if (kommune === "3407") throw new VerifyError("3407: the curated file is not valid JSON")
				return counts(kommune)
			},
			(k, at, of) => lines.push(`${k.kommune} ${at} of ${of}`)
		)
		expect(lines).toEqual(["3405 1 of 3", "3411 3 of 3"])
	})
```

- [ ] **Step 6: Run them to see them fail**

Run: `npx vitest run test/resumeVerify.test.ts test/failed.test.ts test/offline.test.ts test/extract.test.ts test/verify.test.ts`
Expected: FAIL. `test/resumeVerify.test.ts` and `test/failed.test.ts` cannot load `../src/verify/resume.ts` and `../src/verify/failed.ts`; `test/offline.test.ts` fails on the missing `runExtract` export (and `extractScope` ignores the options); `test/verify.test.ts` fails on "reports each kommune it finishes" (no callback). The new `extract.test.ts` test already passes: it pins today's behaviour (Decided 4).

- [ ] **Step 7: One hash helper and one curated serialiser**

In `pipeline/src/io/files.ts`, add `import { createHash } from "node:crypto"` as the first import, and at the end of the file:

```ts
// "sha256:<hex>" of a text or a file's bytes, the form lock files and the page cache use.
export function sha256Of(data: string | Uint8Array): string {
	return `sha256:${createHash("sha256").update(data).digest("hex")}`
}
```

In `pipeline/src/curate/write.ts`, replace `writeCuratedFile` (lines 72-86 on `main`) with:

```ts
// The exact text a curated file is saved as. verify hashes this text into the lock's inputs, so a
// resume right after compares equal, and a review that saves my answers makes it differ.
export function curatedText(file: CuratedFile): string {
	const parsed = CuratedFile.safeParse(file)
	if (!parsed.success)
		throw new Error("the curated file does not match its schema: nothing was written")
	return `${JSON.stringify(parsed.data, null, "\t")}\n`
}

// Each answer is written at once, checked against the schema first.
export async function writeCuratedFile(
	path: string,
	file: CuratedFile,
	io: RenameIo = {}
): Promise<void> {
	await saveWhole(path, curatedText(file), io, (temp) => new CuratedWriteError(temp))
}
```

(`writeCuratedFile` stays `async`, so a schema failure is still a rejected promise, as `test/curatedWrite.test.ts` expects.)

- [ ] **Step 8: The crawl report reader**

Nothing to create. Task 4 exports `readCrawlReport(path)` from `src/fetch/fetchPages.ts`: it returns the report in `<cache>/pages/report.json`, or `undefined` when there is none or it does not parse. The two CLIs below call it with `join(root, "pages", "report.json")`. One reader and one schema for the file keep fetch, verify, extract and score reading it the same way.

- [ ] **Step 9: Change `src/verify/verify.ts`**

Imports: add

```ts
import type { AddressCache } from "../io/addressCache.ts"
import { sha256Of } from "../io/files.ts"
import { OfflineMissError } from "../io/offline.ts"
import { AddressLookupError } from "../registers/kartverket.ts"
```

change the `../curate/write.ts` import to

```ts
import {
	curatedText,
	type RenameIo,
	SaveError,
	writeCuratedFile,
	writeLockFile,
} from "../curate/write.ts"
```

and add `type LockInputs` to the `../schema/lock.ts` import (beside `acceptedCost`, `LockField`, `LockFile`, `LockUnit`).

In `VerifyInput`, after the line `get: Get`, add:

```ts
	// Kartverket's answers on disk. Offline it answers from disk alone, and a miss stops the kommune.
	addressCache?: AddressCache
```

In `verifyKommune`, replace

```ts
	const resolved = await resolveAddresses(input.get, wanted, k.kommune)
```

with

```ts
	const resolved = await resolveAddresses(input.get, wanted, k.kommune, input.addressCache)
```

Replace `verifyAndWrite` (lines 350-367 on `main`) with:

```ts
// Verify, then write the curated file and the lock file, each whole and each with the Windows
// retry. Nothing is written for a kommune that does not complete. The curated file goes first: a
// lock that fails to save after it leaves extra curated units, which review never walks, while a
// lock with no curated file would stop the whole review run. The CLI holds the data folder
// (holdDataDir) for the whole run, so no review writes the curated file in between. The lock
// records the curated file as this run saves it: a resume right after compares equal, and a
// review that saves my answers later makes it differ.
export async function verifyAndWrite(
	dataDir: string,
	input: VerifyInput,
	inputs: Omit<LockInputs, "curated">,
	io: RenameIo = {}
): Promise<VerifyCounts> {
	const { lock, curated, counts } = await verifyKommune(input)
	const path =
		findCuratedPath(dataDir, input.kommune.kommune) ??
		curatedPathFor(dataDir, input.kommune.kommune, input.kommune.name)
	const recorded: LockInputs = { ...inputs, curated: sha256Of(curatedText(curated)) }
	await writeCuratedFile(path, curated, io)
	await writeLockFile(lockPath(dataDir, input.kommune.kommune), { ...lock, inputs: recorded }, io)
	return counts
}
```

In `unfinishedReason`, after the `SaveError` line, add:

```ts
	// An offline miss names the URL or the search it missed: --offline runs on my PC only. A stopped
	// Kartverket names no search.
	if (err instanceof OfflineMissError || err instanceof AddressLookupError) {
		return `${kommune}: ${err.message}`
	}
```

Replace `verifyEach` (lines 380-400 on `main`) with:

```ts
// Each kommune on its own, as extract runs each scope: one that stops is named in the summary and
// never stops the next, and the counts of the ones done still print. run gives undefined for a
// kommune with no extraction file. onDone hears of each kommune that finished, with its place in
// the run, for the progress line.
export async function verifyEach<K extends { kommune: string }>(
	kommuner: readonly K[],
	run: (k: K) => Promise<VerifyCounts | undefined>,
	onDone?: (k: K, at: number, of: number) => void
): Promise<{ counts: VerifyCounts[]; missing: string[]; unfinished: Unfinished[] }> {
	const counts: VerifyCounts[] = []
	const missing: string[] = []
	const unfinished: Unfinished[] = []
	for (const [i, k] of kommuner.entries()) {
		try {
			const done = await run(k)
			if (done === undefined) missing.push(k.kommune)
			else {
				counts.push(done)
				onDone?.(k, i + 1, kommuner.length)
			}
		} catch (err) {
			unfinished.push({ kommune: k.kommune, reason: unfinishedReason(k.kommune, err) })
		}
	}
	return { counts, missing, unfinished }
}
```

- [ ] **Step 10: Create `src/verify/failed.ts`**

```ts
import { type RenameIo, writeLockFile } from "../curate/write.ts"
import type { KommuneDiscovery } from "../discover/types.ts"
import type { CrawlReport } from "../net/crawler.ts"
import type { FailedKind, LockFailure, LockFile, LockInputs } from "../schema/lock.ts"
import { httpsHost } from "../text/normalise.ts"
import { lockPath, type VerifyCounts } from "./verify.ts"

export type { FailedKind }

// The stops a sleeping PC or one bad hour causes. A kommune failed for one of these is not a
// result: score refuses the pilot until fetch --resume has fetched it again. Every other kind is
// lasting and scored as lost recall.
export const TRANSIENT_KINDS: readonly FailedKind[] = ["timeout", "network", "serverError"]

const hostStopped = (host: string, kind: FailedKind): LockFailure => ({
	kind,
	reason: `host stopped: ${kind} (${host})`,
})

// Why nothing came through for a kommune, from the crawl report: its own site's stop first, then
// the first stopped host among its pages' hosts (in the report's host order), then robots when
// robots.txt refused every page, else no pages. Hosts are public; a reason never holds a URL.
export function failedKind(k: KommuneDiscovery, report: CrawlReport | undefined): LockFailure {
	const hosts = report?.hosts ?? []
	const own = k.site?.host.toLowerCase()
	const ownLine = hosts.find((h) => h.host === own)
	if (ownLine?.stopped !== undefined) return hostStopped(ownLine.host, ownLine.stopped)
	const pageHosts = new Set(k.pages.map((p) => httpsHost(p.url)))
	const pageLine = hosts.find((h) => h.stopped !== undefined && pageHosts.has(h.host))
	if (pageLine?.stopped !== undefined) return hostStopped(pageLine.host, pageLine.stopped)
	const refused = new Set(
		(report?.notFetched ?? []).filter((n) => n.reason === "robots").map((n) => n.url)
	)
	if (k.pages.length > 0 && k.pages.every((p) => refused.has(p.url))) {
		return { kind: "robots", reason: "every page refused by robots.txt" }
	}
	return { kind: "noPages", reason: "no pages fetched" }
}

// Whether the crawl report settles every page of a kommune: each one is listed as not fetched (a
// stop, a refusal, a 404). A fetch stopped with Ctrl+C leaves its remaining URLs in neither the
// cache nor the report. A kommune with no pages for that reason has not failed: it is not
// finished, so it gets no failed lock. A kommune with no pages to fetch is settled.
export function fetchSettled(k: KommuneDiscovery, report: CrawlReport | undefined): boolean {
	if (k.pages.length === 0) return true
	if (report === undefined) return false
	const listed = new Set(report.notFetched.map((n) => n.url))
	return k.pages.every((p) => listed.has(p.url))
}

// A kommune that came through with no pages still gets a lock: no units, and why.
export function failedLock(kommune: string, failure: LockFailure, inputs: LockInputs): LockFile {
	return { kommune, inputs, failed: failure, units: [] }
}

// Writes the failed lock whole. The curated file is left alone, so my answers survive a run whose
// host stopped.
export async function writeFailedLock(
	dataDir: string,
	k: KommuneDiscovery,
	report: CrawlReport | undefined,
	inputs: LockInputs,
	io: RenameIo = {}
): Promise<LockFailure> {
	const failure = failedKind(k, report)
	await writeLockFile(lockPath(dataDir, k.kommune), failedLock(k.kommune, failure, inputs), io)
	return failure
}

// A failed kommune's line in the summary: zero of everything.
export function failedCounts(k: { kommune: string; name: string }): VerifyCounts {
	return {
		kommune: k.kommune,
		name: k.name,
		units: 0,
		auto: 0,
		inclusionReview: 0,
		accepted: 0,
		review: 0,
		dropped: 0,
		noUnitId: 0,
		unitsWithoutPage: 0,
		nationalUnmatched: 0,
		pagesWithProblem: 0,
		pagesStale: 0,
		foldedParents: 0,
		answersUnsettled: 0,
	}
}
```

(`HostStop` is a subset of `FailedKind`, since `FAILED_KINDS` spreads `HOST_STOPS`, so `ownLine.stopped` passes as a `FailedKind`.)

- [ ] **Step 11: Create `src/verify/resume.ts`**

```ts
import { existsSync, readFileSync } from "node:fs"
import { extractionPath } from "../extract/extract.ts"
import { sha256Of } from "../io/files.ts"
import { LockFile, type LockInputs } from "../schema/lock.ts"
import { RULES_VERSION } from "./rules.ts"
import { findCuratedPath, lockPath, VerifyError } from "./verify.ts"

// The file's bytes hashed, or undefined when there is no file.
export function sha256File(path: string): string | undefined {
	return existsSync(path) ? sha256Of(readFileSync(path)) : undefined
}

// Everything verify reads for a kommune, by hash: its extraction file, the national file, its
// curated file, the NKLM edition and the rules. A resume compares these, never file times: a
// checkout gives every file a new time, and a gate change leaves every file alone.
export function lockInputs(o: {
	cacheDir: string
	dataDir: string
	kommune: string
	nklmDate?: string
}): LockInputs {
	const extraction = sha256File(extractionPath(o.cacheDir, o.kommune))
	if (extraction === undefined)
		throw new VerifyError(`${o.kommune}: no extraction file (run extract first)`)
	const national = sha256File(extractionPath(o.cacheDir, "national"))
	const curatedAt = findCuratedPath(o.dataDir, o.kommune)
	const curated = curatedAt === undefined ? undefined : sha256File(curatedAt)
	return {
		extraction,
		...(national === undefined ? {} : { national }),
		...(curated === undefined ? {} : { curated }),
		...(o.nklmDate === undefined ? {} : { nklm: o.nklmDate }),
		rules: RULES_VERSION,
	}
}

// True only when the kommune's lock parses, is not a failed lock, and was written from exactly
// these inputs, key by key (a key absent on both sides counts as equal). A failed lock is always
// written again: its reason comes from the crawl report, which is not an input, and it costs
// nothing.
export function canSkip(dataDir: string, kommune: string, inputs: LockInputs): boolean {
	const path = lockPath(dataDir, kommune)
	if (!existsSync(path)) return false
	let data: unknown
	try {
		data = JSON.parse(readFileSync(path, "utf8"))
	} catch {
		return false
	}
	const parsed = LockFile.safeParse(data)
	if (!parsed.success || parsed.data.kommune !== kommune || parsed.data.failed !== undefined)
		return false
	const had: Record<string, unknown> = parsed.data.inputs
	const now: Record<string, unknown> = inputs
	const keys = new Set([...Object.keys(had), ...Object.keys(now)])
	return [...keys].every((key) => had[key] === now[key])
}

// The kommuner a resumed run verifies, and the ones it skips. A kommune with no extraction file
// stays in todo, so the run still names it ("run extract first").
export function splitResume<K extends { kommune: string }>(
	kommuner: readonly K[],
	o: { cacheDir: string; dataDir: string; nklmDate?: string }
): { todo: K[]; skipped: K[] } {
	const todo: K[] = []
	const skipped: K[] = []
	for (const k of kommuner) {
		const extracted = existsSync(extractionPath(o.cacheDir, k.kommune))
		if (extracted && canSkip(o.dataDir, k.kommune, lockInputs({ ...o, kommune: k.kommune })))
			skipped.push(k)
		else todo.push(k)
	}
	return { todo, skipped }
}
```

(`resume.ts` imports from `verify.ts`, never the other way, so there is no import cycle.)

- [ ] **Step 12: Offline, progress and the empty scope in `src/extract/extract.ts`**

Add the imports:

```ts
import { writeJsonAtomic } from "../io/files.ts"
import { OfflineMissError } from "../io/offline.ts"
```

Replace the comment and `extractScope` (lines 126-165 on `main`) with:

```ts
// --offline: nothing is fetched and nothing expires, so the cache must hold every page the scope
// lists. A URL that fetch recorded as not fetched (robots, a 404, a stopped host) is no miss: the
// run that filled the cache never had it either. Any other URL the cache lacks is an error that
// names it (local only: --offline never runs in Actions).
export type ExtractOptions = { offline?: boolean; notFetched?: ReadonlySet<string> }

// Every cached page of one scope (a kommune, or "national" for Nav offices). A URL fetch never
// stored is counted, not read. A scope with no cached page still gives a file, with no pages,
// so verify can write that kommune's failed lock.
export function extractScope(
	scope: string,
	urls: readonly string[],
	cache: PageCache,
	ctx: ExtractContext,
	now: string,
	options: ExtractOptions = {}
): { file: ExtractionFile; summary: ExtractSummary } {
	const summary: ExtractSummary = {
		scope,
		pages: 0,
		notInCache: 0,
		withValues: 0,
		problems: {},
		byField: {},
		withLavterskel: 0,
		lostToName: 0,
	}
	const pages: ExtractedPage[] = []
	for (const url of [...new Set(urls)].sort()) {
		const entry = cache.get(url)
		if (entry === undefined) {
			if (options.offline === true && options.notFetched?.has(url) !== true)
				throw new OfflineMissError(url)
			summary.notInCache++
			continue
		}
		const page = extractPage(entry, cache.read(entry), ctx)
		pages.push(page)
		summary.pages++
		if (page.problem !== undefined) bump(summary.problems, page.problem)
		if (page.candidates.length > 0) summary.withValues++
		for (const c of page.candidates) {
			bump(summary.byField, c.field)
			if (c.field === "phone" && c.review === LOST_TO_NAME) summary.lostToName++
		}
		if (page.lavterskelQuotes.length > 0) summary.withLavterskel++
	}
	const file = ExtractionFile.parse({ scope, extractedAt: now, pages })
	return { file, summary }
}
```

Replace the comment and `extractScopes` (lines 191-212 on `main`) with:

```ts
// Every scope in turn, each written whole or not at all (write is writeJsonAtomic in runExtract).
// One scope that stops never stops the next: it is counted, and its old file stays as it was. An
// offline miss is kept apart, with what it missed; any other error gives the scope name only,
// since its text could quote a page. onDone hears of each scope written, for the progress line.
export function extractScopes(
	scopes: readonly ScopeInput[],
	cache: PageCache,
	now: string,
	write: (scope: string, file: ExtractionFile) => void,
	options: ExtractOptions & { onDone?: (scope: string, at: number, of: number) => void } = {}
): { summaries: ExtractSummary[]; failed: string[]; misses: string[] } {
	const summaries: ExtractSummary[] = []
	const failed: string[] = []
	const misses: string[] = []
	for (const [i, s] of scopes.entries()) {
		try {
			const { file, summary } = extractScope(s.scope, s.urls, cache, s.ctx, now, options)
			write(s.scope, file)
			summaries.push(s.name === undefined ? summary : { ...summary, name: s.name })
			options.onDone?.(s.scope, i + 1, scopes.length)
		} catch (err) {
			if (err instanceof OfflineMissError) misses.push(`${s.scope}: ${err.message}`)
			else failed.push(s.scope)
		}
	}
	return { summaries, failed, misses }
}
```

At the end of the file, after `purgeExtractions`, add:

```ts
export type ExtractRun = {
	root: string
	scopes: readonly ScopeInput[]
	cache: PageCache
	now: string
	nowMs: number
	dryRun?: boolean
	offline?: boolean
	notFetched?: ReadonlySet<string>
	onDone?: (scope: string, at: number, of: number) => void
}

// The extract command's run, so a test can drive it: purge extraction files over 90 days old
// (never offline, where nothing expires, and never in a dry run), then every scope, each written
// whole to <cache>/extract/<scope>.json unless it is a dry run.
export function runExtract(o: ExtractRun): {
	purged: number | undefined
	summaries: ExtractSummary[]
	failed: string[]
	misses: string[]
} {
	const purged =
		o.dryRun === true || o.offline === true ? undefined : purgeExtractions(o.root, o.nowMs)
	const write = (scope: string, file: ExtractionFile) => {
		if (o.dryRun !== true) writeJsonAtomic(extractionPath(o.root, scope), file)
	}
	const result = extractScopes(o.scopes, o.cache, o.now, write, {
		offline: o.offline,
		notFetched: o.notFetched,
		onDone: o.onDone,
	})
	return { purged, ...result }
}
```

- [ ] **Step 13: Pass the inputs in the existing verify tests**

`verifyAndWrite` now takes the lock's inputs third. In `pipeline/test/verify.test.ts`, add `import { RULES_VERSION } from "../src/verify/rules.ts"` to the imports and, below `const NOW = ...`:

```ts
// Inputs for a lock in a test that does not resume: any well-formed hash will do.
const INPUTS = { extraction: `sha256:${"0".repeat(64)}`, rules: RULES_VERSION }
```

Then change the seven calls (line numbers on `main`):

| Line | Before | After |
|---|---|---|
| 728 | `await verifyAndWrite(join(dir, "data"), input)` | `await verifyAndWrite(join(dir, "data"), input, INPUTS)` |
| 739 | `const counts = await verifyAndWrite(join(dir, "data"), input)` | `const counts = await verifyAndWrite(join(dir, "data"), input, INPUTS)` |
| 766 | `await verifyAndWrite(join(dir, "data"), input)` | `await verifyAndWrite(join(dir, "data"), input, INPUTS)` |
| 781 | `await expect(verifyAndWrite(data, input, { rename })).rejects.toThrow("could not save the lock")` | `await expect(verifyAndWrite(data, input, INPUTS, { rename })).rejects.toThrow("could not save the lock")` |
| 794 | `await expect(verifyAndWrite(data, input)).rejects.toThrow()` | `await expect(verifyAndWrite(data, input, INPUTS)).rejects.toThrow()` |
| 804 | `await verifyAndWrite(data, input)` | `await verifyAndWrite(data, input, INPUTS)` |
| 825 | `await verifyAndWrite(data, { ...input, curated })` | `await verifyAndWrite(data, { ...input, curated }, INPUTS)` |

`npm run typecheck` names any call this table missed (Tasks 2 and 5 may have moved the lines).

- [ ] **Step 14: The new `src/cli/verify.ts`**

Replace the whole file. The PR 3 guard on the repo's `data/` goes (Decided 13); `isRepoData` stays exported from `src/curate/write.ts` with its tests in `test/curatedWrite.test.ts`.

```ts
// Runs the five gates on what extract found and writes lock and curated files into --data. The
// repo's own data/ is a valid target: PR 4 commits the pilot there.
//   node src/cli/verify.ts --data <dir> [--only pilot|3405,0301] [--cache <dir>]
//     [--nklm-file <path>] [--nklm-fetch] [--resume] [--offline] [--dry-run]
import { join, resolve } from "node:path"
import { parseArgs } from "node:util"
import { DataBusyError, holdDataDir, SaveError } from "../curate/write.ts"
import { DiscoverError } from "../discover/discover.ts"
import { readDiscovery } from "../discover/files.ts"
import { readExtraction } from "../extract/extract.ts"
import { readCrawlReport } from "../fetch/fetchPages.ts"
import { AddressCache } from "../io/addressCache.ts"
import { writeJsonAtomic } from "../io/files.ts"
import { offlineGet } from "../io/offline.ts"
import { DEFAULT_CACHE_DIR, PageCache } from "../io/pageCache.ts"
import { CacheBusyError, holdCache } from "../io/runLock.ts"
import { recordTiming } from "../io/timings.ts"
import { AllowList } from "../net/allowList.ts"
import { systemClock } from "../net/clock.ts"
import { Crawler, type Get } from "../net/crawler.ts"
import { httpsTransport } from "../net/http.ts"
import { parseOnly, selects } from "../pilot/list.ts"
import { fetchNklm, kommuneLookup, loadNklm, readNklm } from "../registers/nklm.ts"
import type { LockFailure } from "../schema/lock.ts"
import {
	failedCounts,
	failedKind,
	fetchSettled,
	TRANSIENT_KINDS,
	writeFailedLock,
} from "../verify/failed.ts"
import { lockInputs, splitResume } from "../verify/resume.ts"
import {
	findCuratedPath,
	formatUnfinished,
	formatVerifySummary,
	readCuratedFile,
	VerifyError,
	verifyAndWrite,
	verifyEach,
	verifyKommune,
} from "../verify/verify.ts"

const USAGE =
	"usage: verify --data <dir> [--only pilot|3405,0301] [--cache <dir>] [--nklm-file <path>] [--nklm-fetch] [--resume] [--offline] [--dry-run]"

const { values } = parseArgs({
	options: {
		data: { type: "string" },
		only: { type: "string" },
		cache: { type: "string" },
		"nklm-file": { type: "string" },
		"nklm-fetch": { type: "boolean", default: false },
		resume: { type: "boolean", default: false },
		offline: { type: "boolean", default: false },
		"dry-run": { type: "boolean", default: false },
	},
})
const only = parseOnly(values.only)
// Offline nothing is fetched, so --nklm-fetch with --offline asks for two opposite things.
if (values.data === undefined || only === undefined || (values.offline && values["nklm-fetch"])) {
	console.error(USAGE)
	process.exit(2)
}
const dataDir = resolve(values.data)
const root = values.cache ?? DEFAULT_CACHE_DIR
const dryRun = values["dry-run"]
const offline = values.offline
const started = Date.now()
const now = new Date(started).toISOString().replace(/\.\d{3}Z$/, "Z")

// One writer at a time in the data folder (a review running now would lose my answers), and one
// process at a time in the page cache (a fetch running now would change the pages under me).
let held: { release: () => void } | undefined
let cacheHeld: { release: () => void } | undefined
const releaseAll = () => {
	held?.release()
	cacheHeld?.release()
}
try {
	cacheHeld = holdCache(join(root, "pages"))
	held = dryRun ? undefined : holdDataDir(dataDir)
} catch (err) {
	releaseAll()
	console.error(
		err instanceof DataBusyError || err instanceof CacheBusyError
			? err.message
			: "verify could not take the data folder or the page cache"
	)
	process.exit(2)
}
process.on("SIGINT", () => {
	releaseAll()
	process.exit(130)
})
try {
	const found = readDiscovery(join(root, "discover"))
	const allowList = AllowList.restore(found.hosts)
	// Offline no crawler exists: every lookup answers from the caches, and a miss names itself.
	const get: Get = offline
		? offlineGet
		: new Crawler({ transport: httpsTransport, clock: systemClock, allowList }).get
	const cache = new PageCache(join(root, "pages"), { dryRun: true })
	const addressCache = new AddressCache(join(root, "kartverket"), { offline, dryRun })
	// Kartverket answers are keyed by page text, so they age out like the pages. Offline nothing
	// expires.
	if (!offline && !dryRun)
		console.log(`Kartverket answers purged: ${addressCache.purge(Date.now())}`)
	const nklmDir = join(root, "nklm")
	if (values["nklm-fetch"]) {
		const fetched = await fetchNklm(get, nklmDir, now)
		console.log(
			fetched.ok
				? `NKLM file fetched (${fetched.changed ? "changed" : "unchanged"})`
				: `NKLM: ${fetched.reason}`
		)
	}
	const bytes = loadNklm(nklmDir, values["nklm-file"])
	const read =
		bytes === undefined
			? undefined
			: readNklm(
					bytes,
					kommuneLookup(found.kommuner.map((k) => ({ code: k.kommune, name: k.name })))
				)
	console.log(
		read === undefined
			? "NKLM: not used (no file)"
			: read.ok
				? `NKLM: ${read.rows.length} rows from the ${read.date} edition, ${read.unknownKommuner} kommune names not placed`
				: `NKLM: not used (${read.reason})`
	)
	const nklm = read?.ok === true ? { date: read.date, rows: read.rows } : undefined
	const nklmDate = nklm === undefined ? {} : { nklmDate: nklm.date }
	const national = readExtraction(root, "national")
	const report = readCrawlReport(join(root, "pages", "report.json"))
	const kommuner = found.kommuner.filter((k) => selects(only, k.kommune))
	const { todo, skipped } = values.resume
		? splitResume(kommuner, { cacheDir: root, dataDir, ...nklmDate })
		: { todo: kommuner, skipped: [] }
	if (values.resume)
		console.log(
			`resume: ${skipped.length} of ${kommuner.length} kommuner skipped, their inputs unchanged`
		)
	const failed: { kommune: string; failure: LockFailure }[] = []
	// One kommune that stops never stops the next: the summary prints the ones done, then names
	// the ones not finished.
	const { counts, missing, unfinished } = await verifyEach(
		todo,
		async (k) => {
			const extraction = readExtraction(root, k.kommune)
			if (extraction === undefined) return undefined
			const inputs = lockInputs({ cacheDir: root, dataDir, kommune: k.kommune, ...nklmDate })
			// Nothing came through: the lock says why, with no units, and the curated file keeps my
			// answers. Only when the crawl report settles every page: after a fetch stopped with
			// Ctrl+C the kommune is not finished, gets no lock, and score refuses it as never run.
			if (extraction.pages.length === 0) {
				if (!fetchSettled(k, report)) {
					throw new VerifyError(
						`${k.kommune}: fetch did not settle every page: run fetch --resume, extract, then verify`
					)
				}
				const failure = dryRun
					? failedKind(k, report)
					: await writeFailedLock(dataDir, k, report, inputs)
				failed.push({ kommune: k.kommune, failure })
				return failedCounts(k)
			}
			const curatedAt = findCuratedPath(dataDir, k.kommune)
			const input = {
				kommune: k,
				extraction,
				...(national === undefined ? {} : { national }),
				manifest: cache.entries(),
				readHtml: (e: Parameters<typeof cache.read>[0]) => cache.read(e),
				allowList,
				validKommuner: new Set(found.report.kommuner),
				places: found.kommuner.map((x) => x.name),
				get,
				addressCache,
				...(nklm === undefined ? {} : { nklm }),
				...(curatedAt === undefined ? {} : { curated: readCuratedFile(curatedAt, k.kommune) }),
				now,
			}
			return dryRun ? (await verifyKommune(input)).counts : verifyAndWrite(dataDir, input, inputs)
		},
		(k, at, of) => console.log(`verify: ${k.kommune} ${k.name} done (${at} of ${of})`)
	)
	console.log(formatVerifySummary(counts))
	if (missing.length > 0)
		console.log(`No extraction file (run extract first): ${missing.join(", ")}`)
	if (failed.length > 0)
		console.log(
			`Nothing came through, so the lock has no units and its reason: ${failed
				.map((f) => `${f.kommune} ${f.failure.kind}`)
				.join(", ")}`
		)
	// A host that stopped halfway leaves a kommune with some pages: its lock is normal and the rest
	// is missing. score refuses one whose own site stopped this way (Task 10).
	const cut = kommuner.filter(
		(k) =>
			!failed.some((f) => f.kommune === k.kommune) &&
			TRANSIENT_KINDS.includes(failedKind(k, report).kind)
	)
	if (cut.length > 0)
		console.log(
			`Pages missing after a timeout, a network error or a server error: run fetch --resume, extract and verify --resume before score for ${cut
				.map((k) => k.kommune)
				.join(", ")}`
		)
	const transient = failed.filter((f) => TRANSIENT_KINDS.includes(f.failure.kind))
	if (transient.length > 0)
		console.log(
			`Stopped by a timeout, a network error or a server error, so score refuses them: run fetch --resume, extract and verify again for ${transient
				.map((f) => f.kommune)
				.join(", ")}`
		)
	// A resumed run verifies only some kommuner, so its counts and its time would replace the full
	// run's with a part of it. Only a full run writes them.
	if (!dryRun && !values.resume) {
		writeJsonAtomic(join(root, "verify-stats.json"), {
			lookups: addressCache.lookups,
			hits: addressCache.hits,
		})
		recordTiming(root, "verify", Date.now() - started)
	}
	if (unfinished.length > 0) {
		console.error(formatUnfinished(unfinished))
		process.exitCode = 1
	}
} catch (err) {
	const known =
		err instanceof DiscoverError || err instanceof VerifyError || err instanceof SaveError
	console.error(known ? err.message : "verify stopped on an unexpected error")
	process.exitCode = 1
} finally {
	releaseAll()
}
```

- [ ] **Step 15: The new `src/cli/extract.ts`**

Replace the whole file:

```ts
// Extracts field values from the pages fetch cached, into <cache>/extract/, and prints counts.
//   node src/cli/extract.ts [--only pilot|3405,0301] [--national] [--cache <dir>] [--offline] [--dry-run]
import { join } from "node:path"
import { parseArgs } from "node:util"
import { DiscoverError } from "../discover/discover.ts"
import { readDiscovery } from "../discover/files.ts"
import { formatExtractSummary, runExtract, type ScopeInput } from "../extract/extract.ts"
import { readCrawlReport } from "../fetch/fetchPages.ts"
import { DEFAULT_CACHE_DIR, PageCache } from "../io/pageCache.ts"
import { CacheBusyError, holdCache } from "../io/runLock.ts"
import { recordTiming } from "../io/timings.ts"
import { parseOnly, selects } from "../pilot/list.ts"
import { isNavOfficeUrl } from "../registers/nav.ts"

const USAGE =
	"usage: extract [--only pilot|3405,0301] [--national] [--cache <dir>] [--offline] [--dry-run]"

const { values } = parseArgs({
	options: {
		only: { type: "string" },
		national: { type: "boolean", default: false },
		cache: { type: "string" },
		offline: { type: "boolean", default: false },
		"dry-run": { type: "boolean", default: false },
	},
})
const only = parseOnly(values.only)
if (only === undefined) {
	console.error(USAGE)
	process.exit(2)
}

const root = values.cache ?? DEFAULT_CACHE_DIR
const dryRun = values["dry-run"]
const started = Date.now()
// One process at a time in the page cache: a fetch running now would change the pages under me.
let held: { release: () => void } | undefined
try {
	held = holdCache(join(root, "pages"))
} catch (err) {
	console.error(
		err instanceof CacheBusyError ? err.message : "extract could not take the page cache"
	)
	process.exit(2)
}
process.on("SIGINT", () => {
	held?.release()
	process.exit(130)
})
try {
	const found = readDiscovery(join(root, "discover"))
	const cache = new PageCache(join(root, "pages"), { dryRun: true })
	const places = found.kommuner.map((k) => k.name)
	const now = new Date(started).toISOString().replace(/\.\d{3}Z$/, "Z")
	const scopes: ScopeInput[] = found.kommuner
		.filter((k) => selects(only, k.kommune))
		.map((k) => ({
			scope: k.kommune,
			name: k.name,
			urls: k.pages.map((p) => p.url),
			ctx: k.site === undefined ? { places } : { places, kommuneHost: k.site.host },
		}))
	if (values.national) {
		scopes.push({
			scope: "national",
			urls: found.national.pages.map((p) => p.url).filter(isNavOfficeUrl),
			ctx: { places },
		})
	}
	// Offline, a page fetch recorded as not fetched is no miss: the run before never had it either.
	const reportPath = join(root, "pages", "report.json")
	const notFetched = new Set((readCrawlReport(reportPath)?.notFetched ?? []).map((n) => n.url))
	// Each scope is written whole or not at all, and one that stops never stops the next.
	const result = runExtract({
		root,
		scopes,
		cache,
		now,
		nowMs: started,
		dryRun,
		offline: values.offline,
		notFetched,
		onDone: (scope, at, of) => console.log(`extract: ${scope} done (${at} of ${of})`),
	})
	if (result.purged !== undefined) console.log(`extraction files purged: ${result.purged}`)
	console.log(formatExtractSummary(result.summaries))
	// Local only: --offline runs on my PC, and a miss must name what it missed.
	for (const miss of result.misses) console.error(miss)
	if (result.failed.length > 0) {
		console.error(
			`extract stopped on ${result.failed.length} of ${scopes.length} scopes; their old files are unchanged`
		)
		console.error(`not finished: ${result.failed.join(", ")}`)
	}
	if (result.failed.length > 0 || result.misses.length > 0) process.exitCode = 1
	if (!dryRun) recordTiming(root, "extract", Date.now() - started)
} catch (err) {
	// The message only: an unexpected error's text could quote a page.
	console.error(
		err instanceof DiscoverError ? err.message : "extract stopped on an unexpected error"
	)
	process.exitCode = 1
} finally {
	held?.release()
}
```

(`process.exit` inside a `try` skips its `finally`, so a stop inside the run sets `process.exitCode` and lets `finally` release the cache lock.)

- [ ] **Step 16: Run the tests to see them pass**

This task changes `src/verify/verify.ts` and `src/curate/write.ts` and adds two files under `src/verify/`, all in `RULE_PATHS`, so Task 5's fingerprint test goes red. Format first (the hash is over the files as committed): `npx biome check --write .`. Run `npx vitest run test/rules.test.ts`, then set `RULES_FINGERPRINT` in `src/verify/rules.ts` to the value its message names and leave `RULES_VERSION` at 1 (Task 5 Step 9: before the baseline only the fingerprint moves).

Run: `npx vitest run test/resumeVerify.test.ts test/failed.test.ts test/offline.test.ts test/extract.test.ts test/verify.test.ts test/curatedWrite.test.ts && npm test`
Expected: PASS. `test/networkBoundary.test.ts` scans every file under `src/` by itself, so it covers the four new modules; it also confirms that no test imports a CLI.

Then check both CLIs refuse a bad call before they touch any cache (usage lines only, nothing read):

```bash
node src/cli/verify.ts --data "$(mktemp -d)" --offline --nklm-fetch; echo "exit $?"
node src/cli/extract.ts --only 99x; echo "exit $?"
```

Expected: each prints its usage line, then `exit 2`. Do not run `verify` or `extract` against the real `.cache/` from an agent shell: an `--offline` miss prints a URL or a search taken from page text.

- [ ] **Step 17: Show it red once**

Five breaks, each restored before the next:

1. In `verifyAndWrite`, hash `JSON.stringify(curated)` instead of `curatedText(curated)`. Run `npx vitest run test/resumeVerify.test.ts`: FAIL on "records the curated file's hash exactly as it saved the file" and "leaves a finished kommune byte for byte the same" (the resume finds the hash changed and re-runs). Restore: PASS.
2. In `canSkip`, compare only `extraction` and `rules` (replace the `keys` set with `["extraction", "rules"]`). Run the same file: FAIL on "re-runs a kommune after review saved my answer" (Review Focus 2: `todo` is `[]`) and on the NKLM and national test. Restore: PASS.
3. In `failedKind`, move the page-host lookup above the own-site lookup. Run `npx vitest run test/failed.test.ts`: FAIL on "puts the kommune's own site first" (`serverError` instead of `visitTime`). Restore: PASS.
4. In `extractScope`, delete the `if (options.offline === true ...)` line. Run `npx vitest run test/offline.test.ts`: FAIL on "throws on a page the cache does not hold" and "goes on to the next scope after a miss". Restore: PASS.
5. Make `fetchSettled` return `true` on its first line. Run `npx vitest run test/resumeVerify.test.ts`: FAIL on "is not settled when a page is neither cached nor listed". Restore: PASS.

Note all five and their red results for the PR body.

- [ ] **Step 18: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm run lint && npm test && npm run data:check
git add src/io/files.ts src/curate/write.ts src/verify/verify.ts src/verify/rules.ts src/verify/resume.ts src/verify/failed.ts src/extract/extract.ts src/cli/verify.ts src/cli/extract.ts test/verifyHelpers.ts test/resumeVerify.test.ts test/failed.test.ts test/offline.test.ts test/extract.test.ts test/verify.test.ts
git commit -m "feat(pipeline): resume verify by input hashes, write failed locks, and run extract and verify offline"
```

---

### Task 7: The ratchet: known wrong values, rulings and `data:check --publish`

With the pilot's locks committed, the golden test can no longer assert that there are none. It becomes a ratchet: `test/known-wrong.json` lists each value I ruled "pipeline wrong", the test fails on a wrong value the list lacks and on a listed one that no longer occurs, and every "pipeline wrong" ruling of mine in `test/pilot-checks.json` must be on the list. `data:check --publish` fails while the list has any entry, so nothing on it can reach the site. A key row now also counts as found by a name in review (Decided 8), behind an option the golden test does not use.

Task 13 fills `known-wrong.json` and `pilot-checks.json` after the run; Task 8 reads both through the readers built here (`score` refuses on a stale entry, and the report shows proposed rulings and mine apart). This task commits them empty.

**Files:**
- Create: `pipeline/src/score/checks.ts`, `pipeline/test/known-wrong.json`, `pipeline/test/pilot-checks.json`
- Modify: `pipeline/src/answerKey/score.ts` (lines 6-15 `Score`; 29-51 `accepted` and `matchKeyRow`; 55-102 `score` on `main`), `pipeline/src/check/dataCheck.ts` (imports; line 36 and line 111 on `main`), `pipeline/src/cli/data-check.ts` (whole file), `pipeline/test/golden.test.ts` (whole file)
- Test: `pipeline/test/checks.test.ts`, `pipeline/test/publish.test.ts` (new), `pipeline/test/score.test.ts` (extend), `pipeline/test/golden.test.ts`

**Interfaces:**
- Consumes: `LockFile` with `inputs` and `RULES_VERSION` (Task 5); `KEY_KOMMUNER` (Task 1); on `main`: `score`, `Wrong`, `AnswerKey`, `KeyRow`, `comparable`, `FieldName`, `NonBlank`, `UnitId`, `readJsonDir`, `checkData`.
- Produces:
  - `src/score/checks.ts`: `RULINGS`, `PilotCheck`, `PilotChecks`, `KnownWrongEntry`, `KnownWrong` (schemas and types), `ChecksFileError`, `readPilotChecks(path): PilotChecks`, `readKnownWrong(path): KnownWrong`, `ratchet(wrong, known): { unlisted: Wrong[]; gone: KnownWrongEntry[] }`, `checksAgree(checks, known): string[]`, `keyIsWrong(checks, w): boolean`, `goneSamples(known, locks): KnownWrongEntry[]`.
  - `src/answerKey/score.ts`: `matchKeyRow(unit, rows, options?: { anyStatus?: boolean })`; `Score.badgeWrong: Wrong[]` (each badge mismatch with its unit, field `lowThreshold`).
  - `src/check/dataCheck.ts`: `checkData(root: string, options?: { publish?: boolean }): string[]`.
  - `npm run data:check -- --publish`.
  - Files: `pipeline/test/known-wrong.json` (`{ "entries": [] }`), `pipeline/test/pilot-checks.json` (`{ "checks": [] }`).

- [ ] **Step 1: Commit the two lists, empty**

Create `pipeline/test/known-wrong.json` (tab-indented, one trailing newline):

```json
{
	"entries": []
}
```

Create `pipeline/test/pilot-checks.json`:

```json
{
	"checks": []
}
```

- [ ] **Step 2: Write the failing schema, reader and ratchet tests**

Create `pipeline/test/checks.test.ts`:

```ts
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
	ChecksFileError,
	checksAgree,
	goneSamples,
	keyIsWrong,
	KnownWrong,
	type KnownWrongEntry,
	type PilotCheck,
	PilotChecks,
	ratchet,
	readKnownWrong,
	readPilotChecks,
} from "../src/score/checks.ts"
import type { LockFile, LockUnit } from "../src/schema/lock.ts"
import { RULES_VERSION } from "../src/verify/rules.ts"
import { acceptedField, lockUnit } from "./helpers.ts"

const INPUTS = { extraction: `sha256:${"0".repeat(64)}`, rules: RULES_VERSION }
const check = (over: Partial<PilotCheck> = {}): PilotCheck => ({
	kind: "disagreement",
	keyId: 12,
	unitId: "org:999999999",
	field: "phone",
	ruling: "pipelineWrong",
	note: "The source page shows another number.",
	by: "me",
	...over,
})
const entry = (over: Partial<KnownWrongEntry> = {}): KnownWrongEntry => ({
	kind: "disagreement",
	keyId: 12,
	unitId: "org:999999999",
	field: "phone",
	...over,
})
const sample = (over: Partial<KnownWrongEntry> = {}): KnownWrongEntry => {
	const { keyId: _keyId, ...rest } = entry({ kind: "sample", ...over })
	return rest
}
const fileWith = (name: string, text: string) => {
	const path = join(mkdtempSync(join(tmpdir(), "varde-checks-")), name)
	writeFileSync(path, text)
	return path
}

describe("PilotChecks", () => {
	it("takes a disagreement with its key row and a sample without one", () => {
		const { keyId: _keyId, ...noKey } = check({ kind: "sample", ruling: "right" })
		expect(PilotChecks.safeParse({ checks: [check(), noKey] }).success).toBe(true)
	})

	it("refuses a disagreement with no key row, and a sample with one", () => {
		const { keyId: _keyId, ...noKey } = check()
		expect(PilotChecks.safeParse({ checks: [noKey] }).success).toBe(false)
		expect(PilotChecks.safeParse({ checks: [check({ kind: "sample" })] }).success).toBe(false)
	})

	it("refuses a sample ruled key stale: a sample has no key to be stale", () => {
		const { keyId: _keyId, ...noKey } = check({ kind: "sample", ruling: "keyStale" })
		expect(PilotChecks.safeParse({ checks: [noKey] }).success).toBe(false)
	})

	it("refuses two checks of one field, a long note and an unknown author", () => {
		expect(PilotChecks.safeParse({ checks: [check(), check({ ruling: "unclear" })] }).success).toBe(
			false
		)
		expect(PilotChecks.safeParse({ checks: [check({ note: "x".repeat(301) })] }).success).toBe(false)
		expect(PilotChecks.safeParse({ checks: [{ ...check(), by: "someone" }] }).success).toBe(false)
		expect(PilotChecks.safeParse({ checks: [check({ by: "proposed" }), check({ by: "me" })] }).success).toBe(true)
	})
})

describe("KnownWrong", () => {
	it("refuses a disagreement with no key row, a sample with one, and a repeated entry", () => {
		const { keyId: _keyId, ...noKey } = entry()
		expect(KnownWrong.safeParse({ entries: [noKey] }).success).toBe(false)
		expect(KnownWrong.safeParse({ entries: [entry({ kind: "sample" })] }).success).toBe(false)
		expect(KnownWrong.safeParse({ entries: [entry(), entry()] }).success).toBe(false)
		expect(KnownWrong.safeParse({ entries: [entry(), sample()] }).success).toBe(true)
	})
})

describe("readPilotChecks and readKnownWrong", () => {
	it("read a valid file", () => {
		const path = fileWith("known-wrong.json", JSON.stringify({ entries: [entry()] }))
		expect(readKnownWrong(path)).toEqual({ entries: [entry()] })
		const checks = fileWith("pilot-checks.json", JSON.stringify({ checks: [check()] }))
		expect(readPilotChecks(checks)).toEqual({ checks: [check()] })
	})

	it("name the file, never its text, when it is missing, broken or off the schema", () => {
		const dir = mkdtempSync(join(tmpdir(), "varde-checks-"))
		expect(() => readPilotChecks(join(dir, "pilot-checks.json"))).toThrow(
			new ChecksFileError("pilot-checks.json is missing")
		)
		const broken = fileWith("known-wrong.json", "{ Kari Nordmann")
		expect(() => readKnownWrong(broken)).toThrow("known-wrong.json is not valid JSON")
		const odd = fileWith(
			"known-wrong.json",
			JSON.stringify({ entries: [{ ...entry(), "Kari Nordmann": "62 00 00 00" }] })
		)
		let message = ""
		try {
			readKnownWrong(odd)
		} catch (err) {
			message = err instanceof ChecksFileError ? err.message : "not a ChecksFileError"
		}
		expect(message).toMatch(/^known-wrong\.json does not match its schema/)
		expect(message).not.toContain("Kari")
		expect(message).not.toContain("62 00 00 00")
	})
})

describe("ratchet", () => {
	const wrong = { keyId: 12, unitId: "org:999999999", field: "phone" }

	it("passes a wrong value the list holds", () => {
		expect(ratchet([wrong], { entries: [entry()] })).toEqual({ unlisted: [], gone: [] })
	})

	it("gives a wrong value the list lacks, and a listed one that no longer occurs", () => {
		expect(ratchet([wrong], { entries: [] }).unlisted).toEqual([wrong])
		expect(ratchet([], { entries: [entry()] }).gone).toEqual([entry()])
	})

	it("matches on key row, unit and field together", () => {
		const other = entry({ keyId: 13 })
		expect(ratchet([wrong], { entries: [other] })).toEqual({ unlisted: [wrong], gone: [other] })
	})

	it("leaves sample entries to goneSamples", () => {
		expect(ratchet([], { entries: [sample()] })).toEqual({ unlisted: [], gone: [] })
	})
})

describe("goneSamples", () => {
	const lock = (fields: LockUnit["fields"]): LockFile => ({
		kommune: "3405",
		inputs: INPUTS,
		units: [lockUnit({ fields })],
	})

	it("keeps a sample entry whose field is still accepted in a lock", () => {
		expect(goneSamples({ entries: [sample()] }, [lock({ phone: acceptedField() })])).toEqual([])
	})

	it("gives a sample entry whose field left accepted, or whose unit is gone", () => {
		const review = acceptedField({ status: "review", reason: "agreement: 1 other source(s) disagree" })
		expect(goneSamples({ entries: [sample()] }, [lock({ phone: review })])).toEqual([sample()])
		expect(goneSamples({ entries: [sample({ unitId: "org:999999998" })] }, [lock({})])).toEqual([
			sample({ unitId: "org:999999998" }),
		])
	})
})

describe("checksAgree", () => {
	it("passes when every pipeline wrong ruling of mine is listed, and nothing else is", () => {
		expect(checksAgree({ checks: [check()] }, { entries: [entry()] })).toEqual([])
	})

	it("names a pipeline wrong ruling of mine that the list lacks", () => {
		expect(checksAgree({ checks: [check()] }, { entries: [] })).toEqual([
			"pilot-checks.json rules disagreement with key row 12, unit org:999999999, field phone pipeline wrong, and known-wrong.json does not list it",
		])
	})

	it("names a listed value with no pipeline wrong ruling of mine, a proposal included", () => {
		const problem =
			"known-wrong.json lists disagreement with key row 12, unit org:999999999, field phone, and pilot-checks.json has no pipeline wrong ruling of mine for it"
		expect(checksAgree({ checks: [] }, { entries: [entry()] })).toEqual([problem])
		expect(checksAgree({ checks: [check({ by: "proposed" })] }, { entries: [entry()] })).toEqual([
			problem,
		])
		expect(checksAgree({ checks: [check({ ruling: "right" })] }, { entries: [entry()] })).toEqual([
			problem,
		])
	})

	it("ignores a proposal and a ruling other than pipeline wrong when the list lacks them", () => {
		const checks = [check({ by: "proposed" }), check({ keyId: 13, ruling: "keyStale" })]
		expect(checksAgree({ checks }, { entries: [] })).toEqual([])
	})

	it("names a sample by unit and field", () => {
		const { keyId: _keyId, ...mine } = check({ kind: "sample" })
		expect(checksAgree({ checks: [mine] }, { entries: [] })).toEqual([
			"pilot-checks.json rules sample, unit org:999999999, field phone pipeline wrong, and known-wrong.json does not list it",
		])
	})
})

describe("keyIsWrong", () => {
	it("lets a value pass that I ruled key stale or right, never a proposal or unclear", () => {
		const w = { keyId: 12, unitId: "org:999999999", field: "phone" as const }
		expect(keyIsWrong({ checks: [check({ ruling: "keyStale" })] }, w)).toBe(true)
		expect(keyIsWrong({ checks: [check({ ruling: "right" })] }, w)).toBe(true)
		expect(keyIsWrong({ checks: [check({ ruling: "keyStale", by: "proposed" })] }, w)).toBe(false)
		expect(keyIsWrong({ checks: [check({ ruling: "unclear" })] }, w)).toBe(false)
	})
})
```

- [ ] **Step 3: Write the failing `matchKeyRow` and badge tests**

Add to `pipeline/test/score.test.ts`: change the score import to `import { matchKeyRow, score } from "../src/answerKey/score.ts"`, then append:

```ts
describe("matchKeyRow", () => {
	const rows = [keyRow(1, "Rusteamet", { address: "Storgata 1, 2317 Hamar" })]
	const inReview = (value: string) =>
		acceptedField({
			status: "review",
			reason: "agreement: 1 other source(s) disagree",
			value,
			evidence: { kind: "quote", quotes: [value] },
		})

	it("reads accepted names only, unless asked for any status", () => {
		const u = unit(0, "Annet navn", { name: inReview("Rusteamet") })
		expect(matchKeyRow(u, rows)).toBeUndefined()
		expect(matchKeyRow(u, rows, { anyStatus: true })?.id).toBe(1)
	})

	it("reads an address and phone pair in review only when asked for any status", () => {
		const u = unit(0, "Annet navn", {
			address: inReview("Storgata 1, 2317 Hamar"),
			phone: inReview("62 00 00 00"),
		})
		expect(matchKeyRow(u, rows)).toBeUndefined()
		expect(matchKeyRow(u, rows, { anyStatus: true })?.id).toBe(1)
	})

	it("never reads a dropped field", () => {
		const dropped = acceptedField({
			status: "dropped",
			value: undefined,
			evidence: undefined,
			reason: "grounding: no quote holds the value",
		})
		const u = unit(0, "Rusteamet", { name: dropped })
		expect(matchKeyRow(u, rows, { anyStatus: true })).toBeUndefined()
	})
})

describe("score: badge mismatches for the ratchet", () => {
	it("gives each badge mismatch with its unit and the field lowThreshold", () => {
		const badge = {
			lowThreshold: acceptedField({ value: true, evidence: { kind: "quote", quotes: ["x"] } }),
		}
		const units = names.map((n, i) => (i === 0 ? unit(i, n, badge) : unit(i, n)))
		expect(run(units).badgeWrong).toEqual([
			{ keyId: 1, unitId: "org:000000000", field: "lowThreshold" },
		])
		expect(run(units, [1]).badgeWrong).toEqual([])
	})
})
```

(The dropped name replaces the accepted "Rusteamet" that `unit()` would give; the unit keeps an accepted phone `62 00 00 00` but has no address, so neither path matches.)

- [ ] **Step 4: Write the failing publish tests**

Create `pipeline/test/publish.test.ts`:

```ts
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { checkData } from "../src/check/dataCheck.ts"

// A repo root with an empty data/ and, when given, pipeline/test/known-wrong.json.
function repo(knownWrong?: unknown): string {
	const root = mkdtempSync(join(tmpdir(), "varde-publish-"))
	mkdirSync(join(root, "data", "curated"), { recursive: true })
	mkdirSync(join(root, "data", "lock"), { recursive: true })
	if (knownWrong !== undefined) {
		mkdirSync(join(root, "pipeline", "test"), { recursive: true })
		writeFileSync(
			join(root, "pipeline", "test", "known-wrong.json"),
			typeof knownWrong === "string" ? knownWrong : JSON.stringify(knownWrong)
		)
	}
	return root
}
const ENTRY = { kind: "disagreement", keyId: 12, unitId: "org:999999999", field: "phone" }

describe("data:check --publish", () => {
	it("fails while known-wrong.json has an entry", () => {
		expect(checkData(repo({ entries: [ENTRY] }), { publish: true })).toEqual([
			"known-wrong.json lists 1 value: nothing may be published while it has an entry",
		])
		const two = { entries: [ENTRY, { ...ENTRY, keyId: 13 }] }
		expect(checkData(repo(two), { publish: true })).toEqual([
			"known-wrong.json lists 2 values: nothing may be published while it has an entry",
		])
	})

	it("passes with an empty list", () => {
		expect(checkData(repo({ entries: [] }), { publish: true })).toEqual([])
	})

	it("changes nothing without --publish", () => {
		expect(checkData(repo({ entries: [ENTRY] }))).toEqual([])
		expect(checkData(repo({ entries: [ENTRY] }), { publish: false })).toEqual([])
	})

	it("fails on a missing or broken list, naming the file and never its text", () => {
		expect(checkData(repo(), { publish: true })).toEqual(["known-wrong.json is missing"])
		const problems = checkData(repo("{ Kari Nordmann"), { publish: true })
		expect(problems).toEqual(["known-wrong.json is not valid JSON"])
	})
})
```

- [ ] **Step 5: Rewrite the golden test**

Replace the whole of `pipeline/test/golden.test.ts`:

```ts
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { AnswerKey } from "../src/answerKey/schema.ts"
import { score } from "../src/answerKey/score.ts"
import { readJsonDir } from "../src/io/files.ts"
import { KEY_KOMMUNER } from "../src/pilot/list.ts"
import {
	checksAgree,
	goneSamples,
	keyIsWrong,
	ratchet,
	readKnownWrong,
	readPilotChecks,
} from "../src/score/checks.ts"
import { LockFile } from "../src/schema/lock.ts"
import { RULES_VERSION } from "../src/verify/rules.ts"
import { acceptedField, lockUnit } from "./helpers.ts"

const ROOT = fileURLToPath(new URL("../../", import.meta.url))
const here = (name: string) => fileURLToPath(new URL(`./${name}`, import.meta.url))
const key = AnswerKey.parse(JSON.parse(readFileSync(here("answer-key.json"), "utf8")))
const decideOnce: number[] = JSON.parse(readFileSync(here("lavterskel-changes.json"), "utf8")).rows
const known = readKnownWrong(here("known-wrong.json"))
const checks = readPilotChecks(here("pilot-checks.json"))
const INPUTS = { extraction: `sha256:${"0".repeat(64)}`, rules: RULES_VERSION }

// A Hamar row with a phone, and a lock that gives it a wrong one: the planted value.
function planted() {
	const row = key.rows.find((r) => r.kommune === "3403" && r.fields.phone !== null)
	if (row === undefined || row.kommune === null || row.fields.phone === null) {
		throw new Error("no Hamar row with a phone")
	}
	const digits = row.fields.phone.replace(/\D/g, "")
	const wrongPhone = `${digits.slice(0, -1)}${digits.endsWith("0") ? "1" : "0"}`
	const lock = LockFile.parse({
		kommune: row.kommune,
		inputs: INPUTS,
		units: [
			lockUnit({
				fields: {
					name: acceptedField({ value: row.name, evidence: { kind: "quote", quotes: [row.name] } }),
					phone: acceptedField({ value: wrongPhone, evidence: { kind: "quote", quotes: [wrongPhone] } }),
				},
			}),
		],
	})
	const result = score({ locks: [lock], key, kommuner: [row.kommune], decideOnce })
	return { row, lock, result }
}

// Runs over the committed lock files only, never the page cache. A ratchet: the pilot's baseline
// may hold wrong values, but only the ones known-wrong.json lists, and a fixed one must leave the
// list in the PR that fixes it. The report still counts listed values as wrong.
describe("golden test", () => {
	const locks = readJsonDir(join(ROOT, "data", "lock")).map((f) => LockFile.parse(f.data))
	const result = score({ locks, key, kommuner: KEY_KOMMUNER, decideOnce })
	// A badge that differs from the key, apart from the rows I decide once, is a wrong value too, so
	// it fails here unless the list holds it. A value I ruled key stale or right passes.
	const wrong = [...result.wrong, ...result.badgeWrong].filter((w) => !keyIsWrong(checks, w))

	it("finds no wrong value in the key kommuner that known-wrong.json does not list", () => {
		expect(ratchet(wrong, known).unlisted).toEqual([])
	})

	it("lists no wrong value that no longer occurs", () => {
		expect(ratchet(wrong, known).gone).toEqual([])
		expect(goneSamples(known, locks)).toEqual([])
	})

	it("lists exactly the values I ruled pipeline wrong in pilot-checks.json", () => {
		expect(checksAgree(checks, known)).toEqual([])
	})

	it("goes red on one planted wrong value that the list does not hold", () => {
		const { row, result: r } = planted()
		expect(r.wrong).toEqual([{ keyId: row.id, unitId: "org:999999999", field: "phone" }])
		expect(ratchet(r.wrong, { entries: [] }).unlisted).toEqual(r.wrong)
		const listed = {
			entries: [
				{ kind: "disagreement" as const, keyId: row.id, unitId: "org:999999999", field: "phone" as const },
			],
		}
		expect(ratchet(r.wrong, listed)).toEqual({ unlisted: [], gone: [] })
	})

	it("goes red on a listed wrong value that no longer occurs", () => {
		const { row } = planted()
		const fixed = {
			kind: "disagreement" as const,
			keyId: row.id,
			unitId: "org:999999999",
			field: "phone" as const,
		}
		expect(ratchet([], { entries: [fixed] }).gone).toEqual([fixed])
		const sampled = { kind: "sample" as const, unitId: "org:999999998", field: "phone" as const }
		expect(goneSamples({ entries: [sampled] }, [planted().lock])).toEqual([sampled])
	})

	it("goes red when a pipeline wrong ruling of mine is missing from the list", () => {
		const { row } = planted()
		const mine = {
			kind: "disagreement" as const,
			keyId: row.id,
			unitId: "org:999999999",
			field: "phone" as const,
			ruling: "pipelineWrong" as const,
			note: "The source page shows another number.",
			by: "me" as const,
		}
		expect(checksAgree({ checks: [mine] }, { entries: [] })).toHaveLength(1)
	})
})
```

- [ ] **Step 6: Run them to see them fail**

Run: `npx vitest run test/checks.test.ts test/publish.test.ts test/score.test.ts test/golden.test.ts`
Expected: FAIL. `test/checks.test.ts` and `test/golden.test.ts` cannot load `../src/score/checks.ts`; `test/score.test.ts` fails on the `matchKeyRow` option and on `badgeWrong` (undefined); `test/publish.test.ts` gives `[]` where it expects the publish problem.

- [ ] **Step 7: Create `src/score/checks.ts`**

```ts
import { existsSync, readFileSync } from "node:fs"
import { basename } from "node:path"
import { z } from "zod"
import type { Wrong } from "../answerKey/score.ts"
import { FieldName, NonBlank } from "../schema/common.ts"
import { UnitId } from "../schema/ids.ts"
import type { LockFile } from "../schema/lock.ts"

// How I ruled an accepted value that differs from the answer key (a disagreement) or a sampled
// row outside the key (a sample). keyStale: the live site shows an old value. pipelineWrong: the
// lock is wrong, and known-wrong.json lists it. unclear: not settled yet. right: the lock is right.
export const RULINGS = ["keyStale", "pipelineWrong", "unclear", "right"] as const
const KINDS = ["disagreement", "sample"] as const

type Identity = { kind: (typeof KINDS)[number]; keyId?: number; unitId: string; field: string }

// One disagreement or one sampled field. A disagreement is with a key row, so it names one; a
// sample is outside the key, so it never does.
const identity = (e: Identity) => `${e.kind}|${e.keyId ?? ""}|${e.unitId}|${e.field}`

function keyIdProblems(e: Identity): string[] {
	if (e.kind === "disagreement" && e.keyId === undefined)
		return ["a disagreement needs its key row id"]
	if (e.kind === "sample" && e.keyId !== undefined) return ["a sample has no key row id"]
	return []
}

function repeats<T>(list: readonly T[], key: (e: T) => string): number[] {
	const seen = new Set<string>()
	const at: number[] = []
	for (const [i, e] of list.entries()) {
		if (seen.has(key(e))) at.push(i)
		seen.add(key(e))
	}
	return at
}

export const PilotCheck = z
	.strictObject({
		kind: z.enum(KINDS),
		keyId: z.number().int().positive().optional(),
		unitId: UnitId,
		field: FieldName,
		ruling: z.enum(RULINGS),
		note: NonBlank.max(300),
		by: z.enum(["proposed", "me"]),
	})
	.superRefine((c, ctx) => {
		for (const message of keyIdProblems(c)) ctx.addIssue({ code: "custom", message })
		if (c.kind === "sample" && c.ruling === "keyStale")
			ctx.addIssue({ code: "custom", message: "a sample has no key to be stale" })
	})
export type PilotCheck = z.infer<typeof PilotCheck>

export const PilotChecks = z
	.strictObject({ checks: z.array(PilotCheck) })
	.superRefine((file, ctx) => {
		// A proposal and my ruling may stand side by side. Two from one author may not.
		for (const i of repeats(file.checks, (c) => `${identity(c)}|${c.by}`))
			ctx.addIssue({
				code: "custom",
				path: ["checks", i],
				message: "two checks of one disagreement or sampled field by the same author",
			})
	})
export type PilotChecks = z.infer<typeof PilotChecks>

export const KnownWrongEntry = z
	.strictObject({
		kind: z.enum(KINDS),
		keyId: z.number().int().positive().optional(),
		unitId: UnitId,
		field: FieldName,
	})
	.superRefine((e, ctx) => {
		for (const message of keyIdProblems(e)) ctx.addIssue({ code: "custom", message })
	})
export type KnownWrongEntry = z.infer<typeof KnownWrongEntry>

export const KnownWrong = z
	.strictObject({ entries: z.array(KnownWrongEntry) })
	.superRefine((file, ctx) => {
		for (const i of repeats(file.entries, identity))
			ctx.addIssue({ code: "custom", path: ["entries", i], message: "a value listed twice" })
	})
export type KnownWrong = z.infer<typeof KnownWrong>

// A list file that is missing, broken or off its schema. The message names the file and the
// place in it, never its text: the notes and the values are page text.
export class ChecksFileError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "ChecksFileError"
	}
}

function readChecked<S extends z.ZodType>(path: string, schema: S): z.output<S> {
	const name = basename(path)
	if (!existsSync(path)) throw new ChecksFileError(`${name} is missing`)
	let data: unknown
	try {
		data = JSON.parse(readFileSync(path, "utf8"))
	} catch {
		throw new ChecksFileError(`${name} is not valid JSON`)
	}
	const parsed = schema.safeParse(data)
	if (!parsed.success) {
		// An unknown key's message would quote the key, which is text from the file.
		const where = parsed.error.issues
			.map(
				(i) =>
					`${i.path.join(".")}: ${i.code === "unrecognized_keys" ? "an unknown key" : i.message}`
			)
			.join("; ")
		throw new ChecksFileError(`${name} does not match its schema (${where})`)
	}
	return parsed.data
}

export function readPilotChecks(path: string): PilotChecks {
	return readChecked(path, PilotChecks)
}

export function readKnownWrong(path: string): KnownWrong {
	return readChecked(path, KnownWrong)
}

// The golden test's ratchet over disagreements: a wrong value the list lacks, and a listed one
// that no longer occurs, both by key row, unit and field. Sample entries have no key row;
// goneSamples checks them.
export function ratchet(
	wrong: readonly Wrong[],
	known: KnownWrong
): { unlisted: Wrong[]; gone: KnownWrongEntry[] } {
	const at = (keyId: number | undefined, unitId: string, field: string) =>
		`${keyId ?? ""}|${unitId}|${field}`
	const listed = known.entries.filter((e) => e.kind === "disagreement")
	const listedAt = new Set(listed.map((e) => at(e.keyId, e.unitId, e.field)))
	const wrongAt = new Set(wrong.map((w) => at(w.keyId, w.unitId, w.field)))
	return {
		unlisted: wrong.filter((w) => !listedAt.has(at(w.keyId, w.unitId, w.field))),
		gone: listed.filter((e) => !wrongAt.has(at(e.keyId, e.unitId, e.field))),
	}
}

// A listed sample is gone when no committed lock still holds that unit's field as accepted.
export function goneSamples(known: KnownWrong, locks: readonly LockFile[]): KnownWrongEntry[] {
	return known.entries.filter(
		(e) =>
			e.kind === "sample" &&
			!locks.some((l) =>
				l.units.some((u) => u.unitId === e.unitId && u.fields[e.field]?.status === "accepted")
			)
	)
}

const label = (e: Identity) =>
	e.kind === "disagreement"
		? `disagreement with key row ${e.keyId}, unit ${e.unitId}, field ${e.field}`
		: `sample, unit ${e.unitId}, field ${e.field}`

// The two lists agree: every pipeline wrong ruling of mine is on known-wrong.json, and every entry
// there has one. A proposal does not count until I make it mine.
export function checksAgree(checks: PilotChecks, known: KnownWrong): string[] {
	const mine = checks.checks.filter((c) => c.ruling === "pipelineWrong" && c.by === "me")
	const ruled = new Set(mine.map(identity))
	const listed = new Set(known.entries.map(identity))
	return [
		...mine
			.filter((c) => !listed.has(identity(c)))
			.map(
				(c) =>
					`pilot-checks.json rules ${label(c)} pipeline wrong, and known-wrong.json does not list it`
			),
		...known.entries
			.filter((e) => !ruled.has(identity(e)))
			.map(
				(e) =>
					`known-wrong.json lists ${label(e)}, and pilot-checks.json has no pipeline wrong ruling of mine for it`
			),
	]
}

// A disagreement I ruled key stale or right: the key is the wrong side, so the golden test lets the
// value pass until the next key freeze. A proposal or an unclear ruling never does.
export function keyIsWrong(checks: PilotChecks, w: Wrong): boolean {
	return checks.checks.some(
		(c) =>
			c.by === "me" &&
			c.kind === "disagreement" &&
			(c.ruling === "keyStale" || c.ruling === "right") &&
			c.keyId === w.keyId &&
			c.unitId === w.unitId &&
			c.field === w.field
	)
}
```

- [ ] **Step 8: `matchKeyRow` with any status, and each badge mismatch with its unit**

In `pipeline/src/answerKey/score.ts`, add `badgeWrong` to `Score` (after `badgeMismatches: number[]`):

```ts
	// Each badge mismatch with its unit, as a wrong value of the field lowThreshold, for the ratchet.
	badgeWrong: Wrong[]
```

Replace `accepted` and `matchKeyRow` (lines 29-51 on `main`) with:

```ts
// A field's value when its status counts: accepted only, or with anyStatus accepted or in review.
// A dropped field never counts.
function held(unit: LockUnit, field: FieldName, anyStatus: boolean): string | boolean | undefined {
	const f = unit.fields[field]
	if (f === undefined) return undefined
	return f.status === "accepted" || (anyStatus && f.status === "review") ? f.value : undefined
}

function accepted(unit: LockUnit, field: FieldName): string | boolean | undefined {
	return held(unit, field, false)
}

// A unit matches a key row by name, or (when it was renamed) by address and phone together. With
// anyStatus the name, address and phone may still wait in review: a unit that finds the row
// counts as found while I settle its fields (Decided 8). The golden test uses accepted values only.
export function matchKeyRow(
	unit: LockUnit,
	rows: readonly KeyRow[],
	options: { anyStatus?: boolean } = {}
): KeyRow | undefined {
	const anyStatus = options.anyStatus === true
	const name = held(unit, "name", anyStatus)
	if (typeof name === "string") {
		const byName = rows.find((r) => comparable("name", r.name) === comparable("name", name))
		if (byName !== undefined) return byName
	}
	const address = held(unit, "address", anyStatus)
	const phone = held(unit, "phone", anyStatus)
	if (typeof address !== "string" || typeof phone !== "string") return undefined
	return rows.find(
		(r) =>
			r.fields.address !== null &&
			r.fields.phone !== null &&
			comparable("address", r.fields.address) === comparable("address", address) &&
			comparable("phone", r.fields.phone) === comparable("phone", phone)
	)
}
```

In `score`, add `const badgeWrong: Wrong[] = []` after `const badgeMismatches: number[] = []`, replace the badge block with:

```ts
			const badge = accepted(unit, "lowThreshold")
			if (
				badge !== undefined &&
				badge !== row.fields.lowThreshold &&
				!input.decideOnce.includes(row.id)
			) {
				badgeMismatches.push(row.id)
				badgeWrong.push({ keyId: row.id, unitId: unit.unitId, field: "lowThreshold" })
			}
```

and change the return to:

```ts
	return {
		units,
		unitsWithReview,
		keyRows,
		found: found.size,
		wrong,
		badgeMismatches,
		badgeWrong,
		pass,
	}
```

- [ ] **Step 9: `checkData(root, { publish })`**

In `pipeline/src/check/dataCheck.ts`, add the import:

```ts
import { ChecksFileError, type KnownWrong, readKnownWrong } from "../score/checks.ts"
```

Change the signature (line 36 on `main`) to:

```ts
export function checkData(root: string, options: { publish?: boolean } = {}): string[] {
```

Replace its last line, `return problems` (line 111 on `main`), with:

```ts
	if (options.publish === true) problems.push(...publishProblems(root))
	return problems
}

// The publish gate (spec B's publish step and PR 5's workflows run it). A value on the known-wrong
// list is still an accepted field in a committed lock, so nothing may be published while the list
// has an entry, even if a later PR forgets the pass mark. A missing or broken list fails too.
function publishProblems(root: string): string[] {
	let known: KnownWrong
	try {
		known = readKnownWrong(join(root, "pipeline", "test", "known-wrong.json"))
	} catch (err) {
		return [err instanceof ChecksFileError ? err.message : "known-wrong.json could not be read"]
	}
	const n = known.entries.length
	if (n === 0) return []
	return [
		`known-wrong.json lists ${n} ${n === 1 ? "value" : "values"}: nothing may be published while it has an entry`,
	]
```

(The closing brace of `checkData` now closes `publishProblems`; the file still ends with one `}`.)

- [ ] **Step 10: The new `src/cli/data-check.ts`**

Replace the whole file:

```ts
// Validates every file in data/. Exit code 1 when anything is wrong.
//   node src/cli/data-check.ts [--publish]
// --publish also fails while pipeline/test/known-wrong.json lists a value. Spec B's publish step
// and PR 5's workflows run it, so a value I ruled wrong never reaches the site.
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"
import { checkData } from "../check/dataCheck.ts"
import { readJsonDir } from "../io/files.ts"

const USAGE = "usage: data:check [--publish]"

function publishFlag(): boolean | undefined {
	try {
		return parseArgs({ options: { publish: { type: "boolean", default: false } } }).values.publish
	} catch {
		return undefined
	}
}
const publish = publishFlag()
if (publish === undefined) {
	console.error(USAGE)
	process.exit(2)
}

const root = fileURLToPath(new URL("../../../", import.meta.url))
const problems = checkData(root, { publish })
for (const p of problems) console.error(p)
if (problems.length > 0) process.exit(1)
const curated = readJsonDir(`${root}data/curated`).length
const lock = readJsonDir(`${root}data/lock`).length
console.log(
	`data ok: ${curated} curated, ${lock} lock files${publish ? "; known-wrong.json is empty, fit to publish" : ""}`
)
```

- [ ] **Step 11: Run the tests to see them pass**

Run: `npx vitest run test/checks.test.ts test/publish.test.ts test/score.test.ts test/golden.test.ts test/dataCheck.test.ts && npm test`
Expected: PASS. On this branch `data/lock/` holds no lock yet and both lists are empty, so the golden test's three ratchet assertions pass on nothing, and its three planted tests show each check can go red. Task 13 commits the locks and fills the lists.

Then run the command both ways:

```bash
npm run data:check
npm run data:check -- --publish
npm run data:check -- --publsh; echo "exit $?"
```

Expected: the first two print the `data ok:` line (the second with `; known-wrong.json is empty, fit to publish`) and exit 0; the misspelt flag prints `usage: data:check [--publish]` and `exit 2`.

- [ ] **Step 12: Show it red once**

Six breaks, each restored before the next:

1. In `ratchet`, return `gone: []`. Run `npx vitest run test/golden.test.ts test/checks.test.ts`: FAIL on "goes red on a listed wrong value that no longer occurs" and "gives a wrong value the list lacks, and a listed one that no longer occurs". Restore: PASS.
2. In `checksAgree`, drop the second spread (the `known.entries` part). Run `npx vitest run test/checks.test.ts`: FAIL on "names a listed value with no pipeline wrong ruling of mine, a proposal included". Restore: PASS.
3. In `publishProblems`, change `if (n === 0) return []` to `if (n <= 1) return []`. Run `npx vitest run test/publish.test.ts`: FAIL on "fails while known-wrong.json has an entry" (`[]` for one entry). Restore: PASS.
4. In `matchKeyRow`, set `const anyStatus = false`. Run `npx vitest run test/score.test.ts`: FAIL on both "only when asked for any status" tests. Restore: PASS.
5. In `PilotCheck`'s `superRefine`, delete the `keyStale` rule. Run `npx vitest run test/checks.test.ts`: FAIL on "refuses a sample ruled key stale". Restore: PASS.
6. In `keyIsWrong`, drop `c.by === "me" &&`. Run `npx vitest run test/checks.test.ts`: FAIL on "lets a value pass that I ruled key stale or right, never a proposal or unclear" (the proposal gives `true`). Restore: PASS.

Note all six and their red results for the PR body.

- [ ] **Step 13: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm run lint && npm test && npm run data:check -- --publish
git add src/score/checks.ts src/answerKey/score.ts src/check/dataCheck.ts src/cli/data-check.ts test/known-wrong.json test/pilot-checks.json test/golden.test.ts test/checks.test.ts test/publish.test.ts test/score.test.ts
git commit -m "feat(pipeline): turn the golden test into a ratchet over known wrong values, and add data:check --publish"
```

For the reader of later tasks: Task 13 fills `test/known-wrong.json` and `test/pilot-checks.json` from the baseline run and my rulings, and Task 8's `scorePilot` reads both with `readKnownWrong` and `readPilotChecks` (it refuses on a stale entry with `ratchet(...).gone` and `goneSamples`, and counts only `by: "me"` as done). Task 12 documents `data:check -- --publish` in the pipeline README.

### Task 8: Scoring the pilot

`scorePilot` turns the locks, the curated files, the key and my checks into everything the report's seven parts need, or refuses with a list of problems. It is pure: the CLI in Task 10 reads the files. `drawSample` draws the sample outside the key by hash rank (Decided 5).

Readings I chose where the brief leaves room, each with its reason:

- **"Check by hand" means "no ruling by me yet" in a ClaudeBot-blocking kommune.** After `--seed-blocked` (Task 10) every such field has a proposed "unclear, check by hand" entry, so counting "no check at all" would drop to zero before I have read a single page. The count is there to show my time, so it counts what still waits for me.
- **A field whose value or unit page lies on a blocked kommune's site is checked by hand too,** whatever the unit's kommune. A unit in an open kommune can be hosted on, say, Hamar's site, and that page's text must not reach the checks session. `PilotInput.blockedHosts` lists those sites.
- **Rule 5 counts any ruling by me other than `right` as wrong** (fail closed, as rule 1 counts `unclear` as wrong). An empty sample fails rule 5: zero units cannot show zero wrong values.
- **A field with two review reasons counts once under each** in part 3, and the report says so.
- **The discover reason has its backticks taken out.** Recall's reasons wrap hosts in backticks for the PR 2 report; here every reason is plain text that goes through `cellText`, so a host from the key cannot break out of a code span.
- **Refusal texts never name a unit id** (it holds an org number, and logs are public). A check is named by its entry number in `test/pilot-checks.json`, its kind, key row id and field. A disagreement between the two lists is given as a count, since `checksAgree` names unit ids; the golden test names them locally.
- **A badge that differs from the key is listed in part 6 too,** so my ruling on it still occurs and the golden test's ratchet can hold it. Rule 4 counts it; rule 1 counts values only.
- **Two entries with the same `by` for one field refuse**, so a ruling never depends on which entry comes first.

**Files:**
- Create: `pipeline/src/score/sample.ts`, `pipeline/src/score/pilot.ts`, `pipeline/test/pilotFixture.ts`
- Modify: `pipeline/src/recall/report.ts` (export `STOP_TEXT`), `pipeline/test/networkBoundary.test.ts`
- Test: `pipeline/test/sample.test.ts`, `pipeline/test/pilotScore.test.ts`

**Interfaces:**
- Consumes: `score`, `matchKeyRow(unit, rows, { anyStatus })`, `Wrong` (`answerKey/score.ts`); `AnswerKey`, `KeyRow`; `DiscoveryFiles` (`discover/files.ts`); `CrawlReport`, `SkipReason` (`net/crawler.ts`); `recall`, `STOP_TEXT` (`recall/report.ts`); `FIELD_NAMES`, `GATE_NAMES`, `FieldName`, `FieldValue`; `CuratedFile`; `LockFile` with `failed`, `LockUnit`, `LockField`, `evidenceQuotes`; `normaliseUrl`, `siteHost`; `TRANSIENT_KINDS` (Task 6); `PilotChecks`, `KnownWrong`, `RULINGS`, `checksAgree` (Task 7); `testInputs()`, `acceptedField`, `T` (`test/helpers.ts`).
- Produces:
  - `score/sample.ts`: `SAMPLE_SEED = "varde-pilot-2026-11-13"`, `SAMPLE_SIZE = 20`, `compareText(a, b): number`, `curatedIds(curated): Map<string, Set<string>>`, `waitsForInclusion(unit, ids): boolean`, `drawSample(locks, curated, outside): { kommune: string; unitId: string }[]`.
  - `score/pilot.ts`: `PilotInput`, `PilotScore`, `ScoreRefusal`, `scorePilot(input): PilotScore | ScoreRefusal`, `reasonParts(reason)`, `INCLUSION_SECONDS = 30`, `LOST_STAGES`, and the types `Check`, `Checks`, `Ruling`, `RulingName`, `RuleLine`, `RuleStatus`, `KommuneRow`, `ReasonGroup`, `LostRow`, `LostStage`, `Disagreement`, `SampleField`, `SampleUnit`, `PageCount`.
  - `test/pilotFixture.ts`: the shared fictional pilot (`pilotInput`, `baseLocks`, `named`, `lock`, `withUnits`, `withoutUnits`, `keyRow`, `KEY`, `discovery`, `sampleChecks`, `reviewField`, `droppedField`, `INCLUDE_REVIEW`, `page`, `unitIdOf`, `scored`, `refusal`, `AT`). Tasks 9 and 10 use it.

- [ ] **Step 1: Export the stop texts**

In `pipeline/src/recall/report.ts`, change `const STOP_TEXT: Readonly<Record<HostStop, string>> = {` to:

```ts
export const STOP_TEXT: Readonly<Record<HostStop, string>> = {
```

Nothing else in the file changes.

- [ ] **Step 2: Write the shared fixture**

Create `pipeline/test/pilotFixture.ts`:

```ts
import type { AnswerKey, KeyRow } from "../src/answerKey/schema.ts"
import type { DiscoveryFiles } from "../src/discover/files.ts"
import type { KommuneDiscovery } from "../src/discover/types.ts"
import { GATE_NAMES } from "../src/schema/common.ts"
import { LockFile, type LockField, type LockUnit } from "../src/schema/lock.ts"
import {
	type Check,
	type PilotInput,
	type PilotScore,
	type ScoreRefusal,
	scorePilot,
} from "../src/score/pilot.ts"
import { compareText } from "../src/score/sample.ts"
import { acceptedField, testInputs } from "./helpers.ts"

// A fictional pilot of three kommuner: 3401 lies outside the key, 3403 is in the key and blocks
// ClaudeBot, 3405 is in the key. Every name, number, host and org number here is made up.
export const AT = "2026-11-13T08:00:00Z"
export const PILOT_T = ["3401", "3403", "3405"]
export const KEY_T = ["3403", "3405"]
export const BLOCKED_T = ["3403"]
const NAMES: Readonly<Record<string, string>> = {
	"3401": "Eksempelby",
	"3403": "Prøveby",
	"3405": "Testby",
}

export const page = (path: string) => `https://www.eksempel.kommune.no/${path}/`
export const unitIdOf = (n: number) => `org:99999${String(n).padStart(4, "0")}`

export function keyRow(id: number, kommune: string, over: Partial<KeyRow["fields"]> = {}): KeyRow {
	const name = `Tjeneste ${id}`
	return {
		id,
		kommune,
		national: false,
		servedKommuner: [],
		parentId: null,
		name,
		nameEn: name,
		categories: ["rus"],
		fields: {
			phone: "62 00 00 00",
			address: null,
			email: null,
			website: null,
			chatUrl: null,
			openingHours: null,
			cost: null,
			costNote: null,
			alwaysOpen: false,
			lowThreshold: false,
			...over,
		},
	}
}

// Rows 1 to 10 in 3405 and row 11 in 3403.
export const KEY: AnswerKey = {
	frozenOn: "2026-11-10",
	source: "https://varde.pages.dev/data/resources.nb.json",
	rows: [...Array.from({ length: 10 }, (_, i) => keyRow(i + 1, "3405")), keyRow(11, "3403")],
}

export const INCLUDE_REVIEW: NonNullable<LockUnit["inclusion"]> = {
	status: "review",
	reason: "no category rule matched",
	suggestedCategories: [],
}

export function reviewField(reason: string, over: Partial<LockField> = {}): LockField {
	return acceptedField({ status: "review", reason, ...over })
}

export function droppedField(reason: string): LockField {
	return {
		status: "dropped",
		sourceUrl: page("borte"),
		fetchedAt: AT,
		verifiedAt: AT,
		gates: GATE_NAMES.map((gate) =>
			gate === "safety"
				? { gate, pass: false, onFail: "drop" as const, reason }
				: { gate, pass: true }
		),
		reason,
	}
}

// A unit whose name and phone are accepted from its own page. fields replace those two or add more.
export function named(
	n: number,
	name: string,
	fields: LockUnit["fields"] = {},
	over: Partial<LockUnit> = {}
): LockUnit {
	const url = page(`tjeneste-${n}`)
	return {
		unitId: unitIdOf(n),
		sources: [{ kind: "page", ref: url }],
		fields: {
			name: acceptedField({ value: name, sourceUrl: url, evidence: { kind: "quote", quotes: [name] } }),
			phone: acceptedField({ sourceUrl: url }),
			...fields,
		},
		...over,
	}
}

export function lock(
	kommune: string,
	units: readonly LockUnit[],
	failed?: LockFile["failed"]
): LockFile {
	return LockFile.parse({
		kommune,
		inputs: testInputs(),
		units,
		...(failed === undefined ? {} : { failed }),
	})
}

export function baseLocks(): LockFile[] {
	return [
		lock(
			"3401",
			[41, 42, 43].map((n) => named(n, `Tilbud ${n}`))
		),
		lock("3403", [named(11, "Tjeneste 11")]),
		lock(
			"3405",
			Array.from({ length: 10 }, (_, i) => named(i + 1, `Tjeneste ${i + 1}`))
		),
	]
}

// The kommune's lock with these units put in (by unit id) or added, sorted by unit id.
export function withUnits(
	locks: readonly LockFile[],
	kommune: string,
	units: readonly LockUnit[]
): LockFile[] {
	return locks.map((l) => {
		if (l.kommune !== kommune) return l
		const byId = new Map(l.units.map((u) => [u.unitId, u]))
		for (const u of units) byId.set(u.unitId, u)
		return lock(
			kommune,
			[...byId.values()].sort((a, b) => compareText(a.unitId, b.unitId))
		)
	})
}

export function withoutUnits(
	locks: readonly LockFile[],
	kommune: string,
	unitIds: readonly string[]
): LockFile[] {
	return locks.map((l) =>
		l.kommune === kommune
			? lock(
					kommune,
					l.units.filter((u) => !unitIds.includes(u.unitId))
				)
			: l
	)
}

// My check "right" on the name and phone of each sampled unit in the base fixture.
export function sampleChecks(ns: readonly number[] = [41, 42, 43]): Check[] {
	return ns.flatMap((n) =>
		(["name", "phone"] as const).map((field) => ({
			kind: "sample" as const,
			unitId: unitIdOf(n),
			field,
			ruling: "right" as const,
			note: "Matches the source page.",
			by: "me" as const,
		}))
	)
}

// What discover wrote for the three kommuner. pages lists each kommune's discovered page URLs.
export function discovery(pages: Readonly<Record<string, readonly string[]>> = {}): DiscoveryFiles {
	const kommune = (code: string): KommuneDiscovery => ({
		kommune: code,
		name: NAMES[code] ?? code,
		discoveredAt: AT,
		brregComplete: true,
		allSitemapUrls: [],
		units: [],
		pages: (pages[code] ?? []).map((url) => ({ url, from: "sitemap" as const })),
	})
	return {
		report: {
			ranAt: AT,
			date: "2026-11-13",
			only: ["pilot"],
			kommuner: PILOT_T,
			renumberings: [],
			nameMismatches: [],
			problems: [],
			hosts: [],
			notFetched: [],
		},
		hosts: [{ host: "www.eksempel.kommune.no", kind: "kommune", licence: "ownPage" }],
		kommuner: PILOT_T.map(kommune),
		national: { discoveredAt: AT, pages: [], catalogues: [], navOffices: 0 },
	}
}

// A pilot that meets all five rules: 14 units, 11 key rows found, a sample of 3 units, each
// sampled field checked "right" by me.
export function pilotInput(over: Partial<PilotInput> = {}): PilotInput {
	return {
		pilot: PILOT_T,
		keyKommuner: KEY_T,
		blocked: BLOCKED_T,
		blockedHosts: [],
		locks: baseLocks(),
		curated: [],
		key: KEY,
		decideOnce: [],
		checks: { checks: sampleChecks() },
		known: { entries: [] },
		discovery: discovery(),
		crawl: { hosts: [], notFetched: [] },
		extracted: {},
		...over,
	}
}

export function scored(input: PilotInput): PilotScore {
	const result = scorePilot(input)
	if (result.refused) throw new Error(`refused: ${result.problems.join("; ")}`)
	return result
}

export function refusal(input: PilotInput): ScoreRefusal {
	const result = scorePilot(input)
	if (!result.refused) throw new Error("scored, but it should refuse")
	return result
}
```

- [ ] **Step 3: Write the failing tests**

Create `pipeline/test/sample.test.ts`:

```ts
import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import { drawSample, SAMPLE_SEED, SAMPLE_SIZE } from "../src/score/sample.ts"
import { curatedUnit } from "./helpers.ts"
import { baseLocks, INCLUDE_REVIEW, lock, named, reviewField, unitIdOf } from "./pilotFixture.ts"

describe("drawSample", () => {
	const many = lock(
		"3401",
		Array.from({ length: 25 }, (_, i) => named(100 + i, `Tilbud ${100 + i}`))
	)
	const keyed = lock(
		"3405",
		Array.from({ length: 5 }, (_, i) => named(200 + i, `Tjeneste ${200 + i}`))
	)

	it("draws the 20 lowest hash ranks, the same twice, only from kommuner outside the key", () => {
		const first = drawSample([many, keyed], [], ["3401"])
		expect(drawSample([keyed, many], [], ["3401"])).toEqual(first)
		expect(first).toHaveLength(SAMPLE_SIZE)
		expect(first.every((s) => s.kommune === "3401")).toBe(true)
		// The rank is pinned here on its own, so a change to the formula goes red.
		const lowest = many.units
			.map((u) => ({
				unitId: u.unitId,
				rank: createHash("sha256").update(`${SAMPLE_SEED}:3401:${u.unitId}`).digest("hex"),
			}))
			.sort((a, b) => (a.rank < b.rank ? -1 : 1))
			.slice(0, SAMPLE_SIZE)
			.map((r) => r.unitId)
			.sort()
		expect(first.map((s) => s.unitId)).toEqual(lowest)
	})

	it("takes every candidate when there are fewer than 20, sorted by kommune and unit id", () => {
		expect(drawSample(baseLocks(), [], ["3401"])).toEqual([
			{ kommune: "3401", unitId: unitIdOf(41) },
			{ kommune: "3401", unitId: unitIdOf(42) },
			{ kommune: "3401", unitId: unitIdOf(43) },
		])
	})

	it("leaves out a unit waiting for inclusion and one with no accepted field", () => {
		const waiting = named(301, "Tilbud 301", {}, { inclusion: INCLUDE_REVIEW })
		const answered = named(302, "Tilbud 302", {}, { inclusion: INCLUDE_REVIEW })
		const noAccepted = named(303, "Tilbud 303", {
			name: reviewField("validity: not a name", {
				value: "Tilbud 303",
				evidence: { kind: "quote", quotes: ["Tilbud 303"] },
			}),
			phone: reviewField("validity: not a number in the Nkom plan"),
		})
		const curated = [
			{ kommune: "3401", name: "Eksempelby", units: [curatedUnit({ unitId: unitIdOf(302) })] },
		]
		expect(drawSample([lock("3401", [waiting, answered, noAccepted])], curated, ["3401"])).toEqual(
			[{ kommune: "3401", unitId: unitIdOf(302) }]
		)
	})

	it("changes only at its margin when one unit is added", () => {
		const before = drawSample([many], [], ["3401"])
		const after = drawSample([lock("3401", [...many.units, named(130, "Tilbud 130")])], [], ["3401"])
		const kept = after.filter((a) => before.some((b) => b.unitId === a.unitId))
		expect(kept.length).toBeGreaterThanOrEqual(SAMPLE_SIZE - 1)
	})
})
```

Create `pipeline/test/pilotScore.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { reasonParts, scorePilot } from "../src/score/pilot.ts"
import type { Check, PilotScore } from "../src/score/pilot.ts"
import { acceptedField, T } from "./helpers.ts"
import {
	baseLocks,
	discovery,
	droppedField,
	INCLUDE_REVIEW,
	KEY,
	keyRow,
	lock,
	named,
	page,
	pilotInput,
	refusal,
	reviewField,
	sampleChecks,
	scored,
	unitIdOf,
	withoutUnits,
	withUnits,
} from "./pilotFixture.ts"

const rule = (s: PilotScore, n: number) => s.rules.find((r) => r.rule === n)

// Unit n's phone, accepted with another number than the key's.
const otherPhone = (n: number, phone: string) =>
	named(n, `Tjeneste ${n}`, {
		phone: acceptedField({
			value: phone,
			sourceUrl: page(`tjeneste-${n}`),
			evidence: { kind: "quote", quotes: [`Telefon: ${phone}`] },
		}),
	})

const disagreementCheck = (by: Check["by"], ruling: Check["ruling"], keyId = 2): Check => ({
	kind: "disagreement",
	keyId,
	unitId: unitIdOf(keyId),
	field: "phone",
	ruling,
	note: "The live page shows the new number.",
	by,
})

describe("the pass mark", () => {
	it("passes every rule on a pilot that meets the mark", () => {
		const s = scored(pilotInput())
		expect(s.rules.map((r) => r.status)).toEqual(["pass", "pass", "pass", "pass", "pass"])
		expect(s.pass).toBe(true)
		expect(s.rules.map((r) => r.measured)).toEqual([
			"0 wrong. Differ from the key: 0; ruled key stale or right by me: 0",
			"0 of 14 units (0%). Waiting for their inclusion answer, not counted: 0",
			"11 of 11 (100%)",
			"rows that differ: none",
			"0 wrong. Fields checked by me: 6 of 6; units drawn: 3 of 20",
		])
	})
})

describe("rule 1: wrong values in the key kommuner", () => {
	const locks = withUnits(baseLocks(), "3405", [otherPhone(2, "62 00 00 01")])

	it("fails on an accepted value that differs from the key, and lists it", () => {
		const s = scored(pilotInput({ locks }))
		expect(rule(s, 1)?.status).toBe("fail")
		expect(s.disagreements).toEqual([
			{
				keyId: 2,
				kommune: "3405",
				unitId: unitIdOf(2),
				field: "phone",
				keyValue: "62 00 00 00",
				pipelineValue: "62 00 00 01",
				sourceUrl: page("tjeneste-2"),
				quotes: ["Telefon: 62 00 00 01"],
				byHand: false,
			},
		])
	})

	it("shows a proposed ruling and mine apart, and counts only mine", () => {
		const proposed = scored(
			pilotInput({ locks, checks: { checks: [...sampleChecks(), disagreementCheck("proposed", "keyStale")] } })
		)
		expect(rule(proposed, 1)?.status).toBe("fail")
		expect(proposed.disagreements[0]?.proposed).toEqual({
			ruling: "keyStale",
			note: "The live page shows the new number.",
		})
		expect(proposed.disagreements[0]?.mine).toBeUndefined()
		expect(proposed.done.disagreementsRuled).toBe(0)

		const mine = scored(
			pilotInput({
				locks,
				checks: {
					checks: [
						...sampleChecks(),
						disagreementCheck("proposed", "keyStale"),
						disagreementCheck("me", "keyStale"),
					],
				},
			})
		)
		expect(rule(mine, 1)).toMatchObject({
			status: "pass",
			measured: "0 wrong. Differ from the key: 1; ruled key stale or right by me: 1",
		})
		expect(mine.done.disagreementsRuled).toBe(1)
	})

	it("counts a value I ruled pipeline wrong, which known-wrong lists", () => {
		const s = scored(
			pilotInput({
				locks,
				checks: { checks: [...sampleChecks(), disagreementCheck("me", "pipelineWrong")] },
				known: { entries: [{ kind: "disagreement", keyId: 2, unitId: unitIdOf(2), field: "phone" }] },
			})
		)
		expect(rule(s, 1)?.measured).toBe("1 wrong. Differ from the key: 1; ruled key stale or right by me: 0")
	})

	it("refuses when known-wrong does not list a value I ruled pipeline wrong", () => {
		const r = refusal(
			pilotInput({ locks, checks: { checks: [...sampleChecks(), disagreementCheck("me", "pipelineWrong")] } })
		)
		expect(r.problems).toEqual([
			"test/pilot-checks.json and test/known-wrong.json disagree in 1 place: run npx vitest run test/golden.test.ts to see them",
		])
	})

	it("marks a disagreement in a kommune that blocks ClaudeBot for a check by hand until I rule", () => {
		const blocked = withUnits(baseLocks(), "3403", [otherPhone(11, "62 00 00 02")])
		const s = scored(pilotInput({ locks: blocked }))
		expect(s.disagreements.map((d) => [d.keyId, d.byHand])).toEqual([[11, true]])
		expect(s.done.checkByHand).toBe(1)
		const ruled = scored(
			pilotInput({
				locks: blocked,
				checks: { checks: [...sampleChecks(), disagreementCheck("me", "keyStale", 11)] },
			})
		)
		expect(ruled.disagreements[0]?.byHand).toBe(false)
		expect(ruled.done.checkByHand).toBe(0)
	})
})

describe("rule 2: units with a field in review", () => {
	const review = (n: number, reason: string) =>
		named(n, `Tjeneste ${n}`, { phone: reviewField(reason) })

	it("allows 1 unit in 10, not 2", () => {
		const one = withUnits(baseLocks(), "3405", [review(1, "agreement: 1 other source(s) disagree")])
		expect(rule(scored(pilotInput({ locks: one })), 2)?.status).toBe("pass")
		const two = withUnits(one, "3405", [review(2, "agreement: 1 other source(s) disagree")])
		expect(rule(scored(pilotInput({ locks: two })), 2)?.status).toBe("fail")
	})

	it("counts a unit waiting for its inclusion answer as a question, not a review row", () => {
		const one = withUnits(baseLocks(), "3405", [review(1, "agreement: 1 other source(s) disagree")])
		const waiting = withUnits(one, "3401", [
			named(44, "Tilbud 44", { phone: reviewField("validity: not a number in the Nkom plan") }, {
				inclusion: INCLUDE_REVIEW,
			}),
		])
		const s = scored(pilotInput({ locks: waiting }))
		expect(rule(s, 2)).toMatchObject({
			status: "pass",
			measured: "1 of 14 units (7.1%). Waiting for their inclusion answer, not counted: 1",
		})
		expect(s.inclusion).toEqual({
			rows: [{ kommune: "3401", name: "Eksempelby", questions: 1 }],
			total: 1,
			estimateMinutes: 1,
		})
		expect(s.kommuner.find((k) => k.kommune === "3401")).toMatchObject({
			units: 4,
			waiting: 1,
			unitsWithReview: 0,
			review: 1,
		})
		// The waiting unit is never sampled either.
		expect(s.sample.drawn).toBe(3)
	})
})

describe("rule 3: key rows found", () => {
	it("needs 9 in 10 of the key rows", () => {
		const ten = withoutUnits(baseLocks(), "3405", [unitIdOf(10)])
		expect(rule(scored(pilotInput({ locks: ten })), 3)).toMatchObject({
			status: "pass",
			measured: "10 of 11 (90.9%)",
			target: "at least 10 of 11",
		})
		const nine = withoutUnits(ten, "3405", [unitIdOf(9)])
		expect(rule(scored(pilotInput({ locks: nine })), 3)?.status).toBe("fail")
	})

	it("finds a row whose unit waits for inclusion, or has its name in review", () => {
		const locks = withUnits(baseLocks(), "3405", [
			named(10, "Tjeneste 10", {}, { inclusion: INCLUDE_REVIEW }),
			named(9, "Tjeneste 9", {
				name: reviewField("validity: not a name", {
					value: "Tjeneste 9",
					evidence: { kind: "quote", quotes: ["Tjeneste 9"] },
				}),
			}),
		])
		expect(rule(scored(pilotInput({ locks })), 3)?.measured).toBe("11 of 11 (100%)")
	})
})

describe("rule 4: Lavterskel badges", () => {
	it("fails on a badge that differs from the key, unless I decide that row once", () => {
		const locks = withUnits(baseLocks(), "3405", [
			named(1, "Tjeneste 1", {
				lowThreshold: acceptedField({
					value: true,
					evidence: { kind: "quote", quotes: ["Lavterskeltilbud"] },
				}),
			}),
		])
		expect(rule(scored(pilotInput({ locks })), 4)).toMatchObject({
			status: "fail",
			measured: "rows that differ: 1",
		})
		expect(rule(scored(pilotInput({ locks, decideOnce: [1] })), 4)?.status).toBe("pass")
	})

	it("lists a badge mismatch in part 6, so my pipeline wrong ruling on it still occurs", () => {
		const locks = withUnits(baseLocks(), "3405", [
			named(1, "Tjeneste 1", {
				lowThreshold: acceptedField({
					value: true,
					evidence: { kind: "quote", quotes: ["Lavterskeltilbud"] },
				}),
			}),
		])
		const mine: Check = {
			kind: "disagreement",
			keyId: 1,
			unitId: unitIdOf(1),
			field: "lowThreshold",
			ruling: "pipelineWrong",
			note: "The page does not say it is open to all.",
			by: "me",
		}
		const s = scored(
			pilotInput({
				locks,
				checks: { checks: [...sampleChecks(), mine] },
				known: { entries: [{ kind: "disagreement", keyId: 1, unitId: unitIdOf(1), field: "lowThreshold" }] },
			})
		)
		expect(s.disagreements.map((d) => [d.keyId, d.field, d.mine?.ruling])).toEqual([
			[1, "lowThreshold", "pipelineWrong"],
		])
		expect(rule(s, 1)?.status).toBe("pass")
		expect(rule(s, 4)?.status).toBe("fail")
	})
})

describe("rule 5: the sample outside the key", () => {
	it("fails on a sampled field I ruled wrong", () => {
		const checks = sampleChecks().map((c) =>
			c.unitId === unitIdOf(41) && c.field === "phone" ? { ...c, ruling: "pipelineWrong" as const } : c
		)
		const s = scored(
			pilotInput({
				checks: { checks },
				known: { entries: [{ kind: "sample", unitId: unitIdOf(41), field: "phone" }] },
			})
		)
		expect(rule(s, 5)?.status).toBe("fail")
	})

	it("waits while a sampled field has no check by me, a proposal included", () => {
		expect(rule(scored(pilotInput({ checks: { checks: sampleChecks().slice(1) } })), 5)).toMatchObject({
			status: "waiting",
			measured: "0 wrong. Fields checked by me: 5 of 6; units drawn: 3 of 20",
		})
		const proposed = sampleChecks().map((c, i) => (i === 0 ? { ...c, by: "proposed" as const } : c))
		expect(rule(scored(pilotInput({ checks: { checks: proposed } })), 5)?.status).toBe("waiting")
	})

	it("fails with no unit to sample, and says 0 of 20", () => {
		const locks = withoutUnits(baseLocks(), "3401", [unitIdOf(41), unitIdOf(42), unitIdOf(43)])
		expect(rule(scored(pilotInput({ locks, checks: { checks: [] } })), 5)).toMatchObject({
			status: "fail",
			measured: "0 wrong. Fields checked by me: 0 of 0; units drawn: 0 of 20",
		})
	})
})

describe("refusals", () => {
	it("refuses a pilot kommune that was never attempted, and names it", () => {
		const locks = baseLocks().filter((l) => l.kommune !== "3401")
		expect(refusal(pilotInput({ locks })).problems).toEqual([
			"3401: never attempted (no lock file): run the stages for it, then score again",
		])
	})

	it("refuses a kommune that failed for a timeout, names it and says to resume", () => {
		const locks = baseLocks().map((l) =>
			l.kommune === "3403" ? lock("3403", [], { kind: "timeout", reason: "host stopped: timeout" }) : l
		)
		expect(refusal(pilotInput({ locks })).problems).toEqual([
			"3403: failed for timeout (host stopped: timeout): run fetch --resume, then extract and verify again",
		])
	})

	it("scores a kommune that failed for robots as lost recall, with its reason", () => {
		const locks = baseLocks().map((l) =>
			l.kommune === "3403"
				? lock("3403", [], { kind: "robots", reason: "robots.txt refuses every page" })
				: l
		)
		const s = scored(pilotInput({ locks }))
		expect(s.recall.lost).toEqual([
			{
				keyId: 11,
				kommune: "3403",
				name: "Tjeneste 11",
				stage: "failed",
				reason: "robots.txt refuses every page",
			},
		])
		expect(rule(s, 3)?.measured).toBe("10 of 11 (90.9%)")
		expect(s.kommuner.find((k) => k.kommune === "3403")?.failed).toEqual({
			kind: "robots",
			reason: "robots.txt refuses every page",
		})
	})

	it("refuses a check whose disagreement no longer occurs", () => {
		const r = refusal(
			pilotInput({ checks: { checks: [...sampleChecks(), disagreementCheck("me", "keyStale")] } })
		)
		expect(r.problems).toEqual([
			"test/pilot-checks.json entry 7 (disagreement, row 2, phone) no longer occurs: remove it, and its known-wrong entry if it has one",
		])
	})

	it("refuses a sample check whose field is no longer in the sample", () => {
		const gone: Check = {
			kind: "sample",
			unitId: unitIdOf(99),
			field: "phone",
			ruling: "right",
			note: "Matches the source page.",
			by: "me",
		}
		expect(refusal(pilotInput({ checks: { checks: [...sampleChecks(), gone] } })).problems).toEqual([
			"test/pilot-checks.json entry 7 (sample, phone) no longer occurs: remove it, and its known-wrong entry if it has one",
		])
	})

	it("refuses two rulings of mine on one field", () => {
		const checks = [...sampleChecks(), sampleChecks()[0] as Check]
		expect(refusal(pilotInput({ checks: { checks } })).problems).toEqual([
			"test/pilot-checks.json entries 1 and 7 (sample, name) are both mine: keep one",
		])
	})
})

describe("recall", () => {
	it("names the stage that lost each key row", () => {
		const traced = [21, 22, 23, 24].map((id) => keyRow(id, "3405", { website: page(`tjeneste-${id}`) }))
		const unknown = keyRow(25, "3405", { website: "https://ukjent.eksempel.no/tilbud/" })
		const dropped = named(30, "Tjeneste 30", { name: droppedField("source: the host is not on the allow list") }, {
			sources: [{ kind: "page", ref: page("tjeneste-24") }],
		})
		const s = scored(
			pilotInput({
				key: { ...KEY, rows: [...KEY.rows, ...traced, unknown] },
				locks: withUnits(baseLocks(), "3405", [dropped]),
				discovery: discovery({ "3405": [21, 22, 23, 24].map((id) => page(`tjeneste-${id}`)) }),
				crawl: { hosts: [], notFetched: [{ ok: false, url: page("tjeneste-21"), reason: "robots" }] },
				extracted: {
					"3405": [
						{ url: page("tjeneste-22"), finalUrl: page("tjeneste-22"), candidates: 0 },
						{ url: page("tjeneste-23"), finalUrl: page("tjeneste-23"), candidates: 2 },
						{ url: page("tjeneste-24"), finalUrl: page("tjeneste-24"), candidates: 3 },
					],
				},
			})
		)
		expect(s.recall.lost.map((r) => [r.keyId, r.stage, r.reason])).toEqual([
			[21, "notFetched", "not fetched: robots.txt refuses it"],
			[22, "noValues", "no values extracted"],
			[23, "noUnitId", "fetched, no unit id"],
			[24, "droppedByGate", "dropped by a gate: source: the host is not on the allow list"],
			[25, "discover", "ukjent.eksempel.no was not found by any register, sitemap or catalogue"],
		])
		expect(s.recall.lost[0]?.website).toBe(page("tjeneste-21"))
	})
})

describe("review reasons", () => {
	it("splits a reason into its gates; a part with no gate name belongs to the rule", () => {
		expect(reasonParts("validity: not a number in the Nkom plan; place part does not match Kartverket")).toEqual([
			{ gate: "validity", reason: "not a number in the Nkom plan" },
			{ gate: "rule", reason: "place part does not match Kartverket" },
		])
		expect(reasonParts("my decision of 13.11.2026: rejected")).toEqual([
			{ gate: "rule", reason: "my decision of 13.11.2026: rejected" },
		])
	})

	it("groups the reasons, largest first, then by gate and reason", () => {
		const locks = withUnits(baseLocks(), "3405", [
			named(1, "Tjeneste 1", {
				phone: reviewField("validity: not a number in the Nkom plan; agreement: 1 other source(s) disagree"),
			}),
			named(2, "Tjeneste 2", {
				phone: reviewField("validity: not a number in the Nkom plan; place part does not match Kartverket"),
			}),
		])
		const s = scored(pilotInput({ locks }))
		expect(s.reviewFields).toBe(2)
		expect(s.reviewReasons).toEqual([
			{ gate: "validity", reason: "not a number in the Nkom plan", count: 2 },
			{ gate: "agreement", reason: "1 other source(s) disagree", count: 1 },
			{ gate: "rule", reason: "place part does not match Kartverket", count: 1 },
		])
	})
})

describe("determinism", () => {
	it("gives the same score twice in a row, whatever the order of its input", () => {
		const input = pilotInput({
			locks: withUnits(baseLocks(), "3405", [
				otherPhone(2, "62 00 00 01"),
				named(3, "Tjeneste 3", { phone: reviewField("agreement: 1 other source(s) disagree") }),
			]),
		})
		const reversed = {
			...input,
			locks: [...input.locks].reverse().map((l) => ({ ...l, units: [...l.units].reverse() })),
		}
		expect(scorePilot(input)).toEqual(scorePilot(input))
		expect(scorePilot(reversed)).toEqual(scorePilot(input))
	})

	it("states the oldest fetchedAt in the locks", () => {
		expect(scored(pilotInput()).oldestFetchedAt).toBe(T)
		const locks = withUnits(baseLocks(), "3401", [
			named(41, "Tilbud 41", {
				phone: acceptedField({ sourceUrl: page("tjeneste-41"), fetchedAt: "2026-10-01T08:00:00Z" }),
			}),
		])
		expect(scored(pilotInput({ locks })).oldestFetchedAt).toBe("2026-10-01T08:00:00Z")
	})
})
```

- [ ] **Step 4: Run them to see them fail**

Run: `npx vitest run test/sample.test.ts test/pilotScore.test.ts`
Expected: FAIL, `Cannot find module '../src/score/sample.ts'` (and `pilot.ts`).

- [ ] **Step 5: Write `src/score/sample.ts`**

```ts
import { createHash } from "node:crypto"
import type { CuratedFile } from "../schema/curated.ts"
import type { LockFile, LockUnit } from "../schema/lock.ts"

// The fixed seed of the sample outside the key. A new seed draws a new sample, and every row in it
// would wait for a new check by me, so it stays as it is.
export const SAMPLE_SEED = "varde-pilot-2026-11-13"
export const SAMPLE_SIZE = 20

// Plain code-unit order: the same on every machine and in every locale.
export function compareText(a: string, b: string): number {
	if (a < b) return -1
	return a > b ? 1 : 0
}

// The unit ids in each kommune's curated file.
export function curatedIds(curated: readonly CuratedFile[]): Map<string, Set<string>> {
	const ids = new Map<string, Set<string>>()
	for (const file of curated) {
		const set = ids.get(file.kommune) ?? new Set<string>()
		for (const u of file.units) set.add(u.unitId)
		ids.set(file.kommune, set)
	}
	return ids
}

// A unit waits for my "include this unit?" answer while verify sent its inclusion to review and
// the kommune's curated file holds no unit with its id yet.
export function waitsForInclusion(unit: LockUnit, ids: ReadonlySet<string> | undefined): boolean {
	return unit.inclusion?.status === "review" && ids?.has(unit.unitId) !== true
}

// The units I check by hand outside the key (spec, "Sample outside the key"). Each candidate ranks
// by sha256("<seed>:<kommune>:<unit id>") and the lowest ranks are drawn, so the same locks give
// the same sample, and a gap PR that adds or drops a few units moves it only at its margin. A
// candidate is a unit in one of the given kommuner, not waiting for its inclusion answer, with at
// least one accepted field. Fewer than 20 candidates means all of them. Sorted by kommune, then id.
export function drawSample(
	locks: readonly LockFile[],
	curated: readonly CuratedFile[],
	outside: readonly string[]
): { kommune: string; unitId: string }[] {
	const ids = curatedIds(curated)
	const candidates: { kommune: string; unitId: string; rank: string }[] = []
	for (const lock of locks) {
		if (!outside.includes(lock.kommune)) continue
		for (const unit of lock.units) {
			if (waitsForInclusion(unit, ids.get(lock.kommune))) continue
			if (!Object.values(unit.fields).some((f) => f?.status === "accepted")) continue
			const rank = createHash("sha256")
				.update(`${SAMPLE_SEED}:${lock.kommune}:${unit.unitId}`)
				.digest("hex")
			candidates.push({ kommune: lock.kommune, unitId: unit.unitId, rank })
		}
	}
	return candidates
		.sort(
			(a, b) =>
				compareText(a.rank, b.rank) ||
				compareText(a.kommune, b.kommune) ||
				compareText(a.unitId, b.unitId)
		)
		.slice(0, SAMPLE_SIZE)
		.map(({ kommune, unitId }) => ({ kommune, unitId }))
		.sort((a, b) => compareText(a.kommune, b.kommune) || compareText(a.unitId, b.unitId))
}
```

- [ ] **Step 6: Write `src/score/pilot.ts`**

```ts
import type { z } from "zod"
import type { AnswerKey, KeyRow } from "../answerKey/schema.ts"
import { matchKeyRow, score as scoreKey } from "../answerKey/score.ts"
import type { DiscoveryFiles } from "../discover/files.ts"
import type { CrawlReport, SkipReason } from "../net/crawler.ts"
import { recall, STOP_TEXT } from "../recall/report.ts"
import { FIELD_NAMES, type FieldName, type FieldValue, GATE_NAMES } from "../schema/common.ts"
import type { CuratedFile } from "../schema/curated.ts"
import { evidenceQuotes, type LockFile } from "../schema/lock.ts"
import { normaliseUrl, siteHost } from "../text/normalise.ts"
import { TRANSIENT_KINDS } from "../verify/failed.ts"
import { checksAgree, type KnownWrong, type PilotChecks, type RULINGS } from "./checks.ts"
import { compareText, curatedIds, drawSample, SAMPLE_SIZE, waitsForInclusion } from "./sample.ts"

export type Checks = z.infer<typeof PilotChecks>
export type Check = Checks["checks"][number]
export type RulingName = (typeof RULINGS)[number]
export type Ruling = { ruling: RulingName; note: string }

// One page extract read, cut down to what recall needs. The score never holds page text.
export type PageCount = { url: string; finalUrl: string; candidates: number }

export type PilotInput = {
	// The kommuner scored (PILOT for --only pilot), the ones the answer key covers, and the ones
	// that block ClaudeBot.
	pilot: readonly string[]
	keyKommuner: readonly string[]
	blocked: readonly string[]
	// Their sites, as siteHost gives them (from discover). A value read from one of these pages is
	// checked by hand too, whatever the unit's kommune.
	blockedHosts: readonly string[]
	locks: readonly LockFile[]
	curated: readonly CuratedFile[]
	key: AnswerKey
	// The rows whose badge the new Lavterskel rule changes (test/lavterskel-changes.json).
	decideOnce: readonly number[]
	checks: Checks
	known: z.infer<typeof KnownWrong>
	// What discover wrote: recall's discover reasons come from it.
	discovery: DiscoveryFiles
	// The merged crawl report, when the cache has one.
	crawl?: CrawlReport
	// Per kommune number, and "national", the pages extract read.
	extracted: Readonly<Record<string, readonly PageCount[]>>
}

export const INCLUSION_SECONDS = 30
export const LOST_STAGES = [
	"failed",
	"discover",
	"notFetched",
	"noValues",
	"noUnitId",
	"droppedByGate",
	"noMatch",
] as const
export type LostStage = (typeof LOST_STAGES)[number]
export type RuleStatus = "pass" | "fail" | "waiting"
export type RuleLine = {
	rule: 1 | 2 | 3 | 4 | 5
	title: string
	measured: string
	target: string
	status: RuleStatus
}
export type KommuneRow = {
	kommune: string
	name: string
	units: number
	waiting: number
	unitsWithReview: number
	accepted: number
	review: number
	dropped: number
	failed?: { kind: string; reason: string }
}
export type ReasonGroup = { gate: string; reason: string; count: number }
export type LostRow = {
	keyId: number
	kommune: string
	name: string
	stage: LostStage
	reason: string
	website?: string
}
export type Disagreement = {
	keyId: number
	kommune: string
	unitId: string
	field: FieldName
	keyValue: FieldValue
	pipelineValue: FieldValue
	sourceUrl: string
	quotes: string[]
	proposed?: Ruling
	mine?: Ruling
	byHand: boolean
}
export type SampleField = {
	field: FieldName
	value: FieldValue
	sourceUrl: string
	quotes: string[]
	proposed?: Ruling
	mine?: Ruling
	byHand: boolean
}
export type SampleUnit = {
	kommune: string
	unitId: string
	sources: { kind: string; ref: string }[]
	fields: SampleField[]
}

export type ScoreRefusal = { refused: true; problems: string[] }
// Everything the report's seven parts need. Every list is sorted: kommune number, then unit id,
// then field; review reasons by count, largest first, then gate name, then reason.
export type PilotScore = {
	refused: false
	pass: boolean
	keyFrozenOn: string
	rules: RuleLine[]
	kommuner: KommuneRow[]
	reviewFields: number
	reviewReasons: ReasonGroup[]
	inclusion: {
		rows: { kommune: string; name: string; questions: number }[]
		total: number
		estimateMinutes: number
	}
	recall: { keyRows: number; found: number; lost: LostRow[] }
	disagreements: Disagreement[]
	badgeMismatches: number[]
	sample: { size: number; drawn: number; units: SampleUnit[] }
	oldestFetchedAt?: string
	// What "done when" counts: rulings and checks by me only, and what waits for my own browser.
	done: {
		disagreements: number
		disagreementsRuled: number
		sampleFields: number
		sampleFieldsChecked: number
		checkByHand: number
	}
}

const GATES: ReadonlySet<string> = new Set(GATE_NAMES)
const SORTED_FIELDS = [...FIELD_NAMES].sort(compareText)
const percent = (n: number, of: number) => (of === 0 ? 0 : Math.round((n * 1000) / of) / 10)

// A review reason as runGates and verify build it: gate results joined by "; ", each
// "<gate>: <reason>". A part with no gate name in front (the place-part rule, a rule's own review
// reason, "my decision of ...") belongs to the gate "rule".
export function reasonParts(reason: string): { gate: string; reason: string }[] {
	return reason
		.split("; ")
		.filter((part) => part.trim() !== "")
		.map((part) => {
			const at = part.indexOf(": ")
			const gate = at === -1 ? "" : part.slice(0, at)
			return GATES.has(gate) ? { gate, reason: part.slice(at + 2) } : { gate: "rule", reason: part }
		})
}

const SKIP_TEXT: Readonly<Record<SkipReason, string>> = {
	notHttps: "the address is not https",
	notAllowListed: "its host is not on the allow list",
	robots: "robots.txt refuses it",
	hostSkipped: "its host was stopped",
	httpStatus: "the server answered with an error",
	wrongType: "it is not an HTML page",
	tooLarge: "the page is too large",
	tooManyRedirects: "too many redirects",
}

// Why a page the key names never reached the cache: the crawler's own reason for that URL, else
// its host's stop, else nothing more than the fact.
function notFetchedReason(website: string, crawl: CrawlReport | undefined): string {
	const target = normaliseUrl(website)
	const skipped = crawl?.notFetched.find((n) => normaliseUrl(n.url) === target)
	if (skipped !== undefined) {
		const status = skipped.status === undefined ? "" : ` (HTTP ${skipped.status})`
		return `not fetched: ${SKIP_TEXT[skipped.reason]}${status}`
	}
	const host = siteHost(website)
	const stop = crawl?.hosts.find(
		(h) => h.stopped !== undefined && siteHost(`https://${h.host}/`) === host
	)?.stopped
	return stop === undefined ? "not fetched" : `not fetched: its host was stopped (${STOP_TEXT[stop]})`
}

const NO_MATCH = "no lock unit matches it by name, or by address and phone"

// The stage that lost a key row: a failed kommune first, then discover's own reason, then the
// key's website traced through fetch, extract and verify.
function lostAt(
	row: KeyRow,
	lock: LockFile | undefined,
	discoverReason: string | undefined,
	pages: readonly PageCount[],
	crawl: CrawlReport | undefined
): { stage: LostStage; reason: string } {
	if (lock?.failed !== undefined) return { stage: "failed", reason: lock.failed.reason }
	// Recall writes hosts as code for its own report; here every reason is plain text.
	if (discoverReason !== undefined)
		return { stage: "discover", reason: discoverReason.replaceAll("`", "") }
	const website = row.fields.website
	if (website === null) return { stage: "noMatch", reason: NO_MATCH }
	const target = normaliseUrl(website)
	const page = pages.find(
		(p) => normaliseUrl(p.url) === target || normaliseUrl(p.finalUrl) === target
	)
	if (page === undefined) return { stage: "notFetched", reason: notFetchedReason(website, crawl) }
	if (page.candidates === 0) return { stage: "noValues", reason: "no values extracted" }
	const urls = new Set([normaliseUrl(page.url), normaliseUrl(page.finalUrl)])
	const onPage = (lock?.units ?? []).filter((u) =>
		u.sources.some((s) => s.kind === "page" && urls.has(normaliseUrl(s.ref)))
	)
	if (onPage.length === 0) return { stage: "noUnitId", reason: "fetched, no unit id" }
	const dropped = onPage.map((u) => u.fields.name).find((f) => f?.status === "dropped")
	if (dropped !== undefined)
		return { stage: "droppedByGate", reason: `dropped by a gate: ${dropped.reason ?? "no reason given"}` }
	return { stage: "noMatch", reason: `a unit was built from its page, but ${NO_MATCH}` }
}

type Slot = { ruling: Ruling; entry: number }
const targetOf = (kind: Check["kind"], keyId: number | undefined, unitId: string, field: string) =>
	`${kind}|${keyId ?? "-"}|${unitId}|${field}`
// Never the unit id: it holds an org number, and refusals print to public logs.
const entryText = (c: Check) => `${c.kind}${c.keyId === undefined ? "" : `, row ${c.keyId}`}, ${c.field}`

function keyValueOf(row: KeyRow, field: FieldName): FieldValue | null {
	const fields: Readonly<Partial<Record<FieldName, FieldValue | null>>> = row.fields
	return fields[field] ?? null
}

function sampleStatus(wrong: number, drawn: number, unchecked: number): RuleStatus {
	if (wrong > 0 || drawn === 0) return "fail"
	return unchecked > 0 ? "waiting" : "pass"
}

const quotesOf = (f: { evidence?: Parameters<typeof evidenceQuotes>[0] }) =>
	f.evidence === undefined ? [] : [...evidenceQuotes(f.evidence)]

export function scorePilot(input: PilotInput): PilotScore | ScoreRefusal {
	const pilot = [...input.pilot].sort(compareText)
	const byKommune = new Map(input.locks.map((l) => [l.kommune, l]))
	const locks: LockFile[] = []
	const stops: string[] = []
	for (const kommune of pilot) {
		const lock = byKommune.get(kommune)
		if (lock === undefined) {
			stops.push(`${kommune}: never attempted (no lock file): run the stages for it, then score again`)
			continue
		}
		if (lock.failed !== undefined && TRANSIENT_KINDS.includes(lock.failed.kind)) {
			stops.push(
				`${kommune}: failed for ${lock.failed.kind} (${lock.failed.reason}): run fetch --resume, then extract and verify again`
			)
		}
		locks.push(lock)
	}
	// A partial pilot, or one a sleeping PC broke, is never scored as a whole one.
	if (stops.length > 0) return { refused: true, problems: stops }

	const unitOf = (kommune: string, unitId: string) =>
		byKommune.get(kommune)?.units.find((u) => u.unitId === unitId)
	// A field reads a blocked kommune's text when its kommune blocks ClaudeBot, or when its value or
	// any page of its unit lies on a blocked kommune's site (a unit in an open kommune can be hosted there).
	const blockedHosts = new Set(input.blockedHosts)
	const readsBlocked = (kommune: string, urls: readonly string[]) =>
		input.blocked.includes(kommune) ||
		urls.some((url) => {
			const host = siteHost(url)
			return host !== undefined && blockedHosts.has(host)
		})
	const pagesOf = (kommune: string, unitId: string) =>
		(unitOf(kommune, unitId)?.sources ?? []).filter((s) => s.kind === "page").map((s) => s.ref)
	const keyLocks = locks.filter((l) => input.keyKommuner.includes(l.kommune))
	// checksAgree names unit ids, which hold org numbers, so a refusal gives the count only.
	const agree = checksAgree(input.checks, input.known).length
	const problems: string[] =
		agree === 0
			? []
			: [
					`test/pilot-checks.json and test/known-wrong.json disagree in ${agree} ${agree === 1 ? "place" : "places"}: run npx vitest run test/golden.test.ts to see them`,
				]

	// One proposal and one ruling of mine per checked field. A second of either is a mistake in
	// the file, so the score never depends on which entry comes first.
	const slots = new Map<string, Partial<Record<Check["by"], Slot>>>()
	for (const [i, c] of input.checks.checks.entries()) {
		const target = targetOf(c.kind, c.keyId, c.unitId, c.field)
		const slot = slots.get(target) ?? {}
		const earlier = slot[c.by]
		if (earlier === undefined) slot[c.by] = { ruling: { ruling: c.ruling, note: c.note }, entry: i + 1 }
		else
			problems.push(
				`test/pilot-checks.json entries ${earlier.entry} and ${i + 1} (${entryText(c)}) are both ${c.by === "me" ? "mine" : "proposals"}: keep one`
			)
		slots.set(target, slot)
	}
	const rulings = (target: string): { proposed?: Ruling; mine?: Ruling } => {
		const slot = slots.get(target)
		return {
			...(slot?.proposed === undefined ? {} : { proposed: slot.proposed.ruling }),
			...(slot?.me === undefined ? {} : { mine: slot.me.ruling }),
		}
	}

	// Part 6: every accepted value in the key kommuner that differs from the key.
	const keyed = scoreKey({
		locks: keyLocks,
		key: input.key,
		kommuner: input.keyKommuner,
		decideOnce: input.decideOnce,
	})
	const rowById = new Map(input.key.rows.map((r) => [r.id, r]))
	const disagreements: Disagreement[] = []
	// A badge mismatch is listed here too, so a ruling on it still occurs; rule 4 counts it, rule 1 does not.
	for (const w of [...keyed.wrong, ...keyed.badgeWrong]) {
		const row = rowById.get(w.keyId)
		if (row === undefined || row.kommune === null) continue
		const field = w.field as FieldName
		const lockField = unitOf(row.kommune, w.unitId)?.fields[field]
		const keyValue = keyValueOf(row, field)
		if (lockField?.value === undefined || keyValue === null) continue
		const r = rulings(targetOf("disagreement", row.id, w.unitId, field))
		disagreements.push({
			keyId: row.id,
			kommune: row.kommune,
			unitId: w.unitId,
			field,
			keyValue,
			pipelineValue: lockField.value,
			sourceUrl: lockField.sourceUrl,
			quotes: quotesOf(lockField),
			...r,
			byHand:
				readsBlocked(row.kommune, [lockField.sourceUrl, ...pagesOf(row.kommune, w.unitId)]) &&
				r.mine === undefined,
		})
	}
	disagreements.sort(
		(a, b) =>
			compareText(a.kommune, b.kommune) ||
			compareText(a.unitId, b.unitId) ||
			compareText(a.field, b.field) ||
			a.keyId - b.keyId
	)

	// Part 7: the sample from the kommuner the key does not cover, each accepted field with its checks.
	const outside = pilot.filter((k) => !input.keyKommuner.includes(k))
	const drawn = drawSample(locks, input.curated, outside)
	const sample: SampleUnit[] = []
	for (const { kommune, unitId } of drawn) {
		const unit = unitOf(kommune, unitId)
		if (unit === undefined) continue
		const fields: SampleField[] = []
		for (const field of SORTED_FIELDS) {
			const f = unit.fields[field]
			if (f?.status !== "accepted" || f.value === undefined) continue
			const r = rulings(targetOf("sample", undefined, unitId, field))
			fields.push({
				field,
				value: f.value,
				sourceUrl: f.sourceUrl,
				quotes: quotesOf(f),
				...r,
				byHand: readsBlocked(kommune, [f.sourceUrl, ...pagesOf(kommune, unitId)]) && r.mine === undefined,
			})
		}
		sample.push({ kommune, unitId, sources: unit.sources.map((s) => ({ kind: s.kind, ref: s.ref })), fields })
	}

	// A check whose disagreement or sampled field no longer occurs fails the score, as a stale
	// known-wrong entry fails the golden test. Each gap PR removes its own entries.
	const live = new Set([
		...disagreements.map((d) => targetOf("disagreement", d.keyId, d.unitId, d.field)),
		...sample.flatMap((u) => u.fields.map((f) => targetOf("sample", undefined, u.unitId, f.field))),
	])
	for (const [i, c] of input.checks.checks.entries()) {
		if (!live.has(targetOf(c.kind, c.keyId, c.unitId, c.field))) {
			problems.push(
				`test/pilot-checks.json entry ${i + 1} (${entryText(c)}) no longer occurs: remove it, and its known-wrong entry if it has one`
			)
		}
	}
	if (problems.length > 0) return { refused: true, problems }

	// Parts 2, 3 and 4, and the oldest fetchedAt, in one pass over every field.
	const ids = curatedIds(input.curated)
	const names = new Map<string, string>()
	for (const file of input.curated) names.set(file.kommune, file.name)
	for (const k of input.discovery.kommuner) names.set(k.kommune, k.name)
	const groups = new Map<string, ReasonGroup>()
	const kommuner: KommuneRow[] = []
	let reviewFields = 0
	let oldest: string | undefined
	for (const lock of locks) {
		const row: KommuneRow = {
			kommune: lock.kommune,
			name: names.get(lock.kommune) ?? "",
			units: lock.units.length,
			waiting: 0,
			unitsWithReview: 0,
			accepted: 0,
			review: 0,
			dropped: 0,
			...(lock.failed === undefined
				? {}
				: { failed: { kind: lock.failed.kind, reason: lock.failed.reason } }),
		}
		for (const unit of lock.units) {
			const waits = waitsForInclusion(unit, ids.get(lock.kommune))
			if (waits) row.waiting++
			let inReview = false
			for (const f of Object.values(unit.fields)) {
				if (f === undefined) continue
				if (oldest === undefined || f.fetchedAt < oldest) oldest = f.fetchedAt
				row[f.status]++
				if (f.status !== "review") continue
				inReview = true
				reviewFields++
				for (const part of reasonParts(f.reason ?? "review")) {
					const key = `${part.gate}\u0000${part.reason}`
					const group = groups.get(key) ?? { ...part, count: 0 }
					group.count++
					groups.set(key, group)
				}
			}
			// A unit waiting for "include this unit?" is not a row yet (spec decision 2).
			if (inReview && !waits) row.unitsWithReview++
		}
		kommuner.push(row)
	}
	const reviewReasons = [...groups.values()].sort(
		(a, b) => b.count - a.count || compareText(a.gate, b.gate) || compareText(a.reason, b.reason)
	)
	const waitingTotal = kommuner.reduce((n, k) => n + k.waiting, 0)
	const counted = kommuner.reduce((n, k) => n + k.units - k.waiting, 0)
	const withReview = kommuner.reduce((n, k) => n + k.unitsWithReview, 0)

	// Rule 3 and part 5. A unit in review or waiting for inclusion still finds its row (Decided 8).
	const inScope = input.key.rows.filter(
		(r) => !r.national && r.kommune !== null && input.keyKommuner.includes(r.kommune)
	)
	const found = new Set<number>()
	for (const lock of keyLocks) {
		const rows = inScope.filter((r) => r.kommune === lock.kommune)
		for (const unit of lock.units) {
			const row = matchKeyRow(unit, rows, { anyStatus: true })
			if (row !== undefined) found.add(row.id)
		}
	}
	const discoverMisses = new Map(
		recall({
			key: input.key,
			kommuner: input.discovery.kommuner,
			national: input.discovery.national,
			report: input.discovery.report,
			hosts: input.discovery.hosts,
		}).misses.map((m) => [m.id, m.reason])
	)
	const lost: LostRow[] = inScope
		.filter((r) => !found.has(r.id))
		.map((r) => {
			const kommune = r.kommune ?? ""
			const pages = [...(input.extracted[kommune] ?? []), ...(input.extracted.national ?? [])]
			const at = lostAt(r, byKommune.get(kommune), discoverMisses.get(r.id), pages, input.crawl)
			return {
				keyId: r.id,
				kommune,
				name: r.name,
				...at,
				...(r.fields.website === null ? {} : { website: r.fields.website }),
			}
		})
		.sort((a, b) => compareText(a.kommune, b.kommune) || a.keyId - b.keyId)

	const badges = [...new Set(keyed.badgeMismatches)].sort((a, b) => a - b)
	const values = disagreements.filter((d) => d.field !== "lowThreshold")
	const fine = values.filter(
		(d) => d.mine?.ruling === "keyStale" || d.mine?.ruling === "right"
	).length
	const wrongCounted = values.length - fine
	const sampleFields = sample.flatMap((u) => u.fields)
	const checked = sampleFields.filter((f) => f.mine !== undefined).length
	// Any ruling of mine other than "right" counts as wrong, as "unclear" does in rule 1.
	const sampleWrong = sampleFields.filter((f) => f.mine !== undefined && f.mine.ruling !== "right").length
	const status = (ok: boolean): RuleStatus => (ok ? "pass" : "fail")
	const rules: RuleLine[] = [
		{
			rule: 1,
			title: "Zero wrong values in the key kommuner",
			measured: `${wrongCounted} wrong. Differ from the key: ${values.length}; ruled key stale or right by me: ${fine}`,
			target: "0",
			status: status(wrongCounted === 0),
		},
		{
			rule: 2,
			title: "At most 1 unit in 10 with a field in review, in all pilot kommuner",
			measured: `${withReview} of ${counted} units (${percent(withReview, counted)}%). Waiting for their inclusion answer, not counted: ${waitingTotal}`,
			target: "at most 1 in 10",
			status: status(withReview * 10 <= counted),
		},
		{
			rule: 3,
			title: "At least 9 in 10 key rows found in the key kommuner",
			measured: `${found.size} of ${inScope.length} (${percent(found.size, inScope.length)}%)`,
			target: `at least ${Math.ceil((inScope.length * 9) / 10)} of ${inScope.length}`,
			status: status(found.size * 10 >= inScope.length * 9),
		},
		{
			rule: 4,
			title: "Lavterskel badges match the key, apart from the rows I decide once",
			measured: `rows that differ: ${badges.length === 0 ? "none" : badges.join(", ")}`,
			target: "none",
			status: status(badges.length === 0),
		},
		{
			rule: 5,
			title: "Zero wrong values in the sample outside the key",
			measured: `${sampleWrong} wrong. Fields checked by me: ${checked} of ${sampleFields.length}; units drawn: ${drawn.length} of ${SAMPLE_SIZE}`,
			target: "0, with every sampled field checked by me",
			status: sampleStatus(sampleWrong, drawn.length, sampleFields.length - checked),
		},
	]

	const inclusionRows = kommuner
		.filter((k) => k.waiting > 0)
		.map((k) => ({ kommune: k.kommune, name: k.name, questions: k.waiting }))
	return {
		refused: false,
		pass: rules.every((r) => r.status === "pass"),
		keyFrozenOn: input.key.frozenOn,
		rules,
		kommuner,
		reviewFields,
		reviewReasons,
		inclusion: {
			rows: inclusionRows,
			total: waitingTotal,
			estimateMinutes: Math.ceil((waitingTotal * INCLUSION_SECONDS) / 60),
		},
		recall: { keyRows: inScope.length, found: found.size, lost },
		disagreements,
		badgeMismatches: badges,
		sample: { size: SAMPLE_SIZE, drawn: drawn.length, units: sample },
		...(oldest === undefined ? {} : { oldestFetchedAt: oldest }),
		done: {
			disagreements: disagreements.length,
			disagreementsRuled: disagreements.filter((d) => d.mine !== undefined).length,
			sampleFields: sampleFields.length,
			sampleFieldsChecked: checked,
			checkByHand:
				disagreements.filter((d) => d.byHand).length + sampleFields.filter((f) => f.byHand).length,
		},
	}
}
```

- [ ] **Step 7: Run the tests to see them pass**

Run: `npx vitest run test/sample.test.ts test/pilotScore.test.ts`
Expected: PASS.

- [ ] **Step 8: The network boundary scans `src/score/`**

In `pipeline/test/networkBoundary.test.ts`, test "scans the PR 3 folders and files", add `"src/score/"` to the folder list. On `main` the line reads as below; keep any folder an earlier task of this plan added:

```ts
		for (const dir of ["src/extract/", "src/curate/", "src/verify/", "src/review/", "src/xlsx/", "src/score/"]) {
```

Run: `npx vitest run test/networkBoundary.test.ts`
Expected: PASS.

- [ ] **Step 9: Show it red once**

1. In `scorePilot`, change `if (inReview && !waits) row.unitsWithReview++` to `if (inReview) row.unitsWithReview++`. Run `npx vitest run test/pilotScore.test.ts`: FAIL on "counts a unit waiting for its inclusion answer as a question, not a review row" (measured `2 of 14 units`). Restore, run: PASS.
2. In `drawSample`, delete the line `if (!outside.includes(lock.kommune)) continue`. Run `npx vitest run test/sample.test.ts`: FAIL on "draws the 20 lowest hash ranks, the same twice, only from kommuner outside the key". Restore, run: PASS.
3. In `scorePilot`, delete `&& TRANSIENT_KINDS.includes(lock.failed.kind)` so every failed kommune refuses. Run `npx vitest run test/pilotScore.test.ts`: FAIL on "scores a kommune that failed for robots as lost recall". Restore, run: PASS.
4. In `scorePilot`, change `for (const w of [...keyed.wrong, ...keyed.badgeWrong])` to `for (const w of keyed.wrong)`. Run `npx vitest run test/pilotScore.test.ts`: FAIL on "lists a badge mismatch in part 6, so my pipeline wrong ruling on it still occurs" (refused: the entry "no longer occurs"). Restore, run: PASS.
5. In `scorePilot`, set `const problems: string[] = [...checksAgree(input.checks, input.known)]` (the lines that name unit ids). Run `npx vitest run test/pilotScore.test.ts`: FAIL on "refuses when known-wrong does not list a value I ruled pipeline wrong". Restore, run: PASS.

Note all five for the PR body.

- [ ] **Step 10: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm run lint && npm test
git add src/score/sample.ts src/score/pilot.ts src/recall/report.ts test/pilotFixture.ts test/sample.test.ts test/pilotScore.test.ts test/networkBoundary.test.ts
git commit -m "feat(pipeline): score the pilot against the pass mark, with a fixed-seed sample outside the key"
```

---

### Task 9: The report and the PR-body summary

The report is committed and GitHub renders it, so every quote, value and URL is made inert: `sanitise()` first, then a code span or a fenced block whose fence is longer than any backtick run inside. Free text (unit names from the key, reasons, my notes) goes through `cellText`. The PR body holds part 1, part 2, the counts of parts 3 to 7, the report's path and the scale block, and throws over 60,000 characters.

Quotes never reach the PR body, so the "too long" fixture inflates part 2 (2,000 kommune rows) and the test shows the same score renders a report longer than the limit without a throw.

The report shows at most what the locks hold: it quotes only lock fields (spec, "Privacy of the baseline").

**Files:**
- Create: `pipeline/src/score/markdown.ts`, `pipeline/src/score/render.ts`, `pipeline/src/score/scale.ts` (types and formatting only; Task 10 adds `scaleNumbers`)
- Test: `pipeline/test/markdown.test.ts`, `pipeline/test/report.test.ts`

**Interfaces:**
- Consumes: `sanitise` (`review/sanitise.ts`), `inert` (`recall/report.ts`), `PilotScore`, `Ruling`, `RulingName`, `RuleStatus`, `LostStage`, `INCLUSION_SECONDS` (Task 8), `compareText` (Task 8).
- Produces:
  - `score/markdown.ts`: `codeSpan(text: string): string`, `codeBlock(text: string): string`, `cellText(text: string): string`.
  - `score/render.ts`: `PR_BODY_LIMIT = 60_000`, `PrBodyTooLongError`, `renderReport(s: PilotScore): string`, `renderPrBody(s: PilotScore, scale: ScaleNumbers | undefined, reportPath: string): string`.
  - `score/scale.ts`: `HostScale = { host; requests; delayMs; estimateMs }`, `ScaleNumbers = { hosts: HostScale[]; slowest?: HostScale; overJobLimit: string[]; lockBytes: number; kartverket?: { lookups: number; hits: number }; timings: Record<string, number> }`, `JOB_LIMIT_MS`, `formatDuration(ms): string`, `groupDigits(n): string`.

- [ ] **Step 1: Write the failing tests**

Create `pipeline/test/markdown.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { cellText, codeBlock, codeSpan } from "../src/score/markdown.ts"

const ticks = (n: number) => "`".repeat(n)

describe("codeSpan", () => {
	it("fences text with one backtick more than its longest run", () => {
		expect(codeSpan("62 00 00 00")).toBe("`62 00 00 00`")
		expect(codeSpan("a `b` c")).toBe("``a `b` c``")
		expect(codeSpan(`end${ticks(2)}`)).toBe(`${ticks(3)} end${ticks(2)} ${ticks(3)}`)
	})

	it("pads text that starts or ends with a backtick", () => {
		expect(codeSpan("`start")).toBe("`` `start ``")
	})

	it("sanitises first, and writes blank text as plain words", () => {
		expect(codeSpan("Ring\u001b[31m @someone")).toBe("`Ring @someone`")
		expect(codeSpan("\u0007")).toBe("(blank)")
	})
})

describe("codeBlock", () => {
	it("uses three backticks, or one more than the longest run inside", () => {
		expect(codeBlock("plain")).toBe(`${ticks(3)}text\nplain\n${ticks(3)}`)
		expect(codeBlock(`one\n${ticks(3)} two\nthree${ticks(4)}`)).toBe(
			`${ticks(5)}text\none\n${ticks(3)} two\nthree${ticks(4)}\n${ticks(5)}`
		)
	})

	it("sanitises each line", () => {
		expect(codeBlock("a\tb\r\nc\u001b[2J")).toBe(`${ticks(3)}text\na b\nc\n${ticks(3)}`)
	})
})

describe("cellText", () => {
	it("sanitises and escapes, the pipe included, so the text stays in its cell", () => {
		expect(cellText("Kafé | @varde <img> `x`\nny linje")).toBe(
			"Kafé \\| &#64;varde \\<img\\> \\`x\\` ny linje"
		)
	})

	it("breaks a bare web address, so GitHub cannot make it a link", () => {
		expect(cellText("Se www.eksempel.kommune.no eller https://eksempel.kommune.no/side")).toBe(
			"Se www&#46;eksempel.kommune.no eller https&#58;//eksempel.kommune.no/side"
		)
	})
})
```

Create `pipeline/test/report.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import type { Check, PilotScore } from "../src/score/pilot.ts"
import { PR_BODY_LIMIT, PrBodyTooLongError, renderPrBody, renderReport } from "../src/score/render.ts"
import { formatDuration, groupDigits } from "../src/score/scale.ts"
import { acceptedField } from "./helpers.ts"
import {
	baseLocks,
	named,
	page,
	pilotInput,
	reviewField,
	sampleChecks,
	scored,
	unitIdOf,
	withUnits,
} from "./pilotFixture.ts"

const ticks = (n: number) => "`".repeat(n)
// The line of three backticks inside would close a three-backtick fence early.
const EVIL = `Ring @someone <img src=x onerror=alert(1)> ${ticks(3)} her\n${ticks(3)}\n@other <img src=y>`
const REPORT_PATH = "docs/pilot/pilot-report.md"

// The lines GitHub renders as markdown: those outside fenced blocks. A fence closes only on a
// line of backticks at least as long as the one that opened it.
function outsideFences(md: string): string[] {
	const out: string[] = []
	let open = 0
	for (const line of md.split("\n")) {
		const fence = /^(`{3,})/.exec(line)?.[1]?.length ?? 0
		if (open === 0) {
			if (fence > 0) open = fence
			else out.push(line)
		} else if (fence >= open && line.trim() === ticks(fence)) open = 0
	}
	return out
}

describe("renderReport", () => {
	it("has the seven parts in order", () => {
		const md = renderReport(scored(pilotInput()))
		expect(md.split("\n").filter((l) => l.startsWith("## "))).toEqual([
			"## 1. Pass mark",
			"## 2. Per kommune",
			"## 3. Review reasons, ranked",
			"## 4. Inclusion questions",
			"## 5. Recall",
			"## 6. Disagreements",
			"## 7. Sample outside the key",
		])
		expect(md).toContain("| 3. At least 9 in 10 key rows found in the key kommuner | 11 of 11 (100%) | at least 10 of 11 | pass |")
		expect(md).toContain("| 3401 Eksempelby | 3 | 0 | 0 | 6 | 0 | 0 |  |")
	})

	it("renders a hostile quote and a javascript: value inert", () => {
		const locks = withUnits(baseLocks(), "3401", [
			named(41, "Tilbud 41", {
				phone: acceptedField({ sourceUrl: page("tjeneste-41"), evidence: { kind: "quote", quotes: [EVIL] } }),
				website: acceptedField({
					value: "javascript:alert(1)",
					sourceUrl: page("tjeneste-41"),
					evidence: { kind: "quote", quotes: ["javascript:alert(1)"] },
				}),
			}),
		])
		const md = renderReport(scored(pilotInput({ locks })))
		expect(md).toContain([`${ticks(4)}text`, EVIL, ticks(4)].join("\n"))
		expect(md).toContain(
			["#### website", "", "- Value: `javascript:alert(1)`", `- Source: \`${page("tjeneste-41")}\``].join("\n")
		)
		const plain = outsideFences(md)
		expect(plain.filter((l) => l.includes("@someone") || l.includes("<img"))).toEqual([])
		expect(plain.filter((l) => l.includes("javascript:"))).toEqual(["- Value: `javascript:alert(1)`"])
	})

	it("keeps two review reasons with equal counts in one order across runs", () => {
		const a = withUnits(baseLocks(), "3405", [
			named(1, "Tjeneste 1", { phone: reviewField("validity: not a number in the Nkom plan") }),
			named(2, "Tjeneste 2", { phone: reviewField("agreement: 1 other source(s) disagree") }),
		])
		const b = a.map((l) => ({ ...l, units: [...l.units].reverse() })).reverse()
		const first = renderReport(scored(pilotInput({ locks: a })))
		expect(renderReport(scored(pilotInput({ locks: b })))).toBe(first)
		expect(first).toContain(
			["| 1 | agreement | 1 other source(s) disagree |", "| 1 | validity | not a number in the Nkom plan |"].join("\n")
		)
	})

	it("is the same twice, with no clock time, a dated oldest page and an estimated time", () => {
		const md = renderReport(scored(pilotInput()))
		expect(renderReport(scored(pilotInput()))).toBe(md)
		expect(md).toContain("The oldest cached page behind these locks was fetched on 29.10.2026.")
		expect(md).toContain("That is an estimate at 30 seconds a question")
		expect(md).not.toMatch(/\d{2}:\d{2}/)
		expect(md).not.toContain("\r")
		expect(md.endsWith("\n")).toBe(true)
	})

	it("shows a proposed ruling, my ruling and a check by hand apart", () => {
		const locks = withUnits(
			withUnits(baseLocks(), "3405", [
				named(2, "Tjeneste 2", {
					phone: acceptedField({
						value: "62 00 00 01",
						sourceUrl: page("tjeneste-2"),
						evidence: { kind: "quote", quotes: ["Telefon: 62 00 00 01"] },
					}),
				}),
			]),
			"3403",
			[
				named(11, "Tjeneste 11", {
					phone: acceptedField({
						value: "62 00 00 02",
						sourceUrl: page("tjeneste-11"),
						evidence: { kind: "quote", quotes: ["Telefon: 62 00 00 02"] },
					}),
				}),
			]
		)
		const proposed: Check = {
			kind: "disagreement",
			keyId: 2,
			unitId: unitIdOf(2),
			field: "phone",
			ruling: "keyStale",
			note: "The live page shows 62 00 00 01.",
			by: "proposed",
		}
		const mine: Check = { ...proposed, note: "I checked it myself.", by: "me" }
		const md = renderReport(scored(pilotInput({ locks, checks: { checks: [...sampleChecks(), proposed, mine] } })))
		expect(md).toContain(
			["- Proposed ruling: key stale. The live page shows 62 00 00 01.", "- My ruling: key stale. I checked it myself."].join("\n")
		)
		expect(md).toContain(
			"- My ruling: none yet. Check by hand: its kommune, or the site its page is on, blocks ClaudeBot, so no AI session reads it."
		)
		expect(md).toContain("2 accepted values differ from the key. 1 have my ruling, and 1 wait for a check by hand.")
	})
})

describe("renderPrBody", () => {
	it("holds parts 1 and 2, the counts and the report's path, and no quote", () => {
		const locks = withUnits(baseLocks(), "3401", [
			named(41, "Tilbud 41", {
				phone: acceptedField({ sourceUrl: page("tjeneste-41"), evidence: { kind: "quote", quotes: [EVIL] } }),
			}),
		])
		const body = renderPrBody(scored(pilotInput({ locks })), undefined, REPORT_PATH)
		expect(body).toContain(
			"| 3. At least 9 in 10 key rows found in the key kommuner | 11 of 11 (100%) | at least 10 of 11 | pass |"
		)
		expect(body).toContain("### Per kommune")
		expect(body).toContain("- Sample outside the key (part 7): 3 of 20 units, 6 of 6 fields with my check, 0 to check by hand.")
		expect(body).toContain("The whole report is committed as `docs/pilot/pilot-report.md`.")
		expect(body).not.toContain("@someone")
	})

	it("throws over the limit, and the report itself is never limited", () => {
		const s = scored(pilotInput())
		const [first] = s.kommuner
		if (first === undefined) throw new Error("the fixture has kommuner")
		const big: PilotScore = {
			...s,
			kommuner: Array.from({ length: 2_000 }, (_, i) => ({ ...first, kommune: String(1000 + i), name: `Eksempelby ${i}` })),
		}
		expect(() => renderPrBody(big, undefined, REPORT_PATH)).toThrow(PrBodyTooLongError)
		expect(renderReport(big).length).toBeGreaterThan(PR_BODY_LIMIT)
		expect(renderPrBody(s, undefined, REPORT_PATH).length).toBeLessThanOrEqual(PR_BODY_LIMIT)
	})
})

describe("scale formatting", () => {
	it("writes durations and byte counts the same way every time", () => {
		expect(formatDuration(30_000_000)).toBe("8 h 20 min")
		expect(formatDuration(6 * 3_600_000)).toBe("6 h")
		expect(formatDuration(125_000)).toBe("2 min 5 s")
		expect(formatDuration(5_000)).toBe("5 s")
		expect(groupDigits(1_234_567)).toBe("1,234,567")
		expect(groupDigits(999)).toBe("999")
	})
})
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run test/markdown.test.ts test/report.test.ts`
Expected: FAIL, `Cannot find module '../src/score/markdown.ts'` (and `render.ts`, `scale.ts`).

- [ ] **Step 3: Write `src/score/markdown.ts`**

```ts
import { inert } from "../recall/report.ts"
import { sanitise } from "../review/sanitise.ts"

// The longest run of backticks in the text, read once from start to end.
function longestRun(text: string): number {
	let longest = 0
	let run = 0
	for (const ch of text) {
		run = ch === "`" ? run + 1 : 0
		if (run > longest) longest = run
	}
	return longest
}

// Text from a page or a lock as inline code: sanitised first, then fenced with one backtick more
// than its longest run, so it cannot close its own span. CommonMark takes one space off each end,
// so text that starts or ends with a backtick gets a space on both sides. Blank text has nothing
// to show, so it is written as plain words. Never use this for page text in a table cell: GitHub
// splits cells on "|" even inside code.
export function codeSpan(text: string): string {
	const clean = sanitise(text)
	if (clean.trim() === "") return "(blank)"
	const fence = "`".repeat(longestRun(clean) + 1)
	const pad = clean.startsWith("`") || clean.endsWith("`") ? " " : ""
	return `${fence}${pad}${clean}${pad}${fence}`
}

// Text from a page or a lock as a fenced block: each line sanitised, and a fence of at least three
// backticks and longer than any run inside, so a quote holding a run of three cannot close it.
export function codeBlock(text: string): string {
	const lines = text.split(/\r\n|\r|\n/).map(sanitise)
	const fence = "`".repeat(Math.max(3, longestRun(lines.join("\n")) + 1))
	return [`${fence}text`, ...lines, fence].join("\n")
}

// Free text (a unit name from the key, a reason, my note) in a table cell or a list line:
// sanitised, then made inert. inert escapes "|" too, so the text cannot open a new cell. GitHub
// links a bare web address on its own, so "www." and "://" are broken with an entity.
export function cellText(text: string): string {
	return inert(sanitise(text)).replace(/www\./gi, "www&#46;").replace(/:\/\//g, "&#58;//")
}
```

- [ ] **Step 4: Write `src/score/scale.ts`**

```ts
// The numbers PR 5 sizes its workflows from. They come from the local cache and change with every
// run, so they go in the PR body only, never in the deterministic report.
export type HostScale = { host: string; requests: number; delayMs: number; estimateMs: number }
export type ScaleNumbers = {
	// Slowest first, then by host name.
	hosts: HostScale[]
	slowest?: HostScale
	// Hosts whose estimate is over JOB_LIMIT_MS.
	overJobLimit: string[]
	lockBytes: number
	kartverket?: { lookups: number; hits: number }
	timings: Record<string, number>
}

// A GitHub-hosted job stops after 6 hours.
export const JOB_LIMIT_MS = 6 * 3_600_000

// "8 h 20 min", "2 min 5 s", "5 s": whole seconds, the two largest units that are not zero.
export function formatDuration(ms: number): string {
	const total = Math.round(ms / 1000)
	const h = Math.floor(total / 3600)
	const m = Math.floor((total % 3600) / 60)
	const s = total % 60
	if (h > 0) return m === 0 ? `${h} h` : `${h} h ${m} min`
	if (m > 0) return s === 0 ? `${m} min` : `${m} min ${s} s`
	return `${s} s`
}

// "1,234,567": a comma between each group of three digits, whatever the machine's locale.
export function groupDigits(n: number): string {
	const digits = String(Math.trunc(Math.abs(n)))
	let out = ""
	for (let i = 0; i < digits.length; i++) {
		if (i > 0 && (digits.length - i) % 3 === 0) out += ","
		out += digits.charAt(i)
	}
	return n < 0 ? `-${out}` : out
}
```

- [ ] **Step 5: Write `src/score/render.ts`**

```ts
import { cellText, codeBlock, codeSpan } from "./markdown.ts"
import {
	INCLUSION_SECONDS,
	type LostStage,
	type PilotScore,
	type RuleStatus,
	type Ruling,
	type RulingName,
} from "./pilot.ts"
import { compareText } from "./sample.ts"
import { formatDuration, groupDigits, JOB_LIMIT_MS, type ScaleNumbers } from "./scale.ts"

// GitHub refuses a PR body over 65,536 characters. The summary stays under this, with room left
// for my own lines.
export const PR_BODY_LIMIT = 60_000

export class PrBodyTooLongError extends Error {
	constructor(length: number) {
		super(
			`the PR body is ${length} characters, over the ${PR_BODY_LIMIT}-character limit: nothing was written`
		)
		this.name = "PrBodyTooLongError"
	}
}

const dotted = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`

const RESULT: Readonly<Record<RuleStatus, string>> = {
	pass: "pass",
	fail: "fail",
	waiting: "waiting for my checks",
}
const RULING_TEXT: Readonly<Record<RulingName, string>> = {
	keyStale: "key stale",
	pipelineWrong: "pipeline wrong",
	unclear: "unclear",
	right: "right",
}
const STAGE_TEXT: Readonly<Record<LostStage, string>> = {
	failed: "the failed kommune",
	discover: "discover",
	notFetched: "fetch",
	noValues: "extract",
	noUnitId: "verify (no unit)",
	droppedByGate: "verify (a gate)",
	noMatch: "verify (no match)",
}
const STAGE_ORDER = ["discover", "fetch", "extract", "verify", "score"]
const SHOWN_HOSTS = 30
const BY_HAND =
	"none yet. Check by hand: its kommune, or the site its page is on, blocks ClaudeBot, so no AI session reads it."

// Blocks of lines with one blank line between them.
const spaced = (blocks: readonly (readonly string[])[]): string[] =>
	blocks.flatMap((b, i) => (i === 0 ? [...b] : ["", ...b]))

const kommuneLabel = (kommune: string, name: string) =>
	name === "" ? kommune : `${kommune} ${cellText(name)}`
const rulingText = (r: Ruling) => `${RULING_TEXT[r.ruling]}. ${cellText(r.note)}`

function myText(mine: Ruling | undefined, byHand: boolean): string {
	if (mine !== undefined) return rulingText(mine)
	return byHand ? BY_HAND : "none yet"
}

function checkLines(
	noun: "ruling" | "check",
	proposed: Ruling | undefined,
	mine: Ruling | undefined,
	byHand: boolean
): string[] {
	return [
		`- Proposed ${noun}: ${proposed === undefined ? "none" : rulingText(proposed)}`,
		`- My ${noun}: ${myText(mine, byHand)}`,
	]
}

function quoteLines(quotes: readonly string[]): string[] {
	if (quotes.length === 0) return ["No quote: the value comes from a register."]
	return ["Quotes:", "", codeBlock(quotes.join("\n"))]
}

function intro(s: PilotScore): string {
	const oldest =
		s.oldestFetchedAt === undefined
			? "No lock holds a field, so no cached page stands behind them."
			: `The oldest cached page behind these locks was fetched on ${dotted(s.oldestFetchedAt)}.`
	return `I score the committed lock and curated files with \`npm run score\`, against the answer key frozen on ${dotted(s.keyFrozenOn)}, \`test/lavterskel-changes.json\` and my checks in \`test/pilot-checks.json\`. ${oldest} Nothing in this report is on the live site.`
}

function passMark(s: PilotScore): string[] {
	return [
		"| Rule | Measured | Target | Result |",
		"|---|---|---|---|",
		...s.rules.map(
			(r) => `| ${r.rule}. ${r.title} | ${r.measured} | ${r.target} | ${RESULT[r.status]} |`
		),
		"",
		`Overall: **${s.pass ? "pass" : "not passed yet"}**.`,
		"",
		`Done when every disagreement has my ruling and every sampled field my check: disagreements ruled by me ${s.done.disagreementsRuled} of ${s.done.disagreements}; sampled fields checked by me ${s.done.sampleFieldsChecked} of ${s.done.sampleFields}. Left to check by hand in the kommuner that block ClaudeBot: ${s.done.checkByHand}.`,
	]
}

function perKommune(s: PilotScore): string[] {
	return [
		"| Kommune | Units | Waiting for inclusion | Units with review | Accepted fields | Review fields | Dropped fields | Note |",
		"|---|---|---|---|---|---|---|---|",
		...s.kommuner.map((k) => {
			const note =
				k.failed === undefined ? "" : cellText(`failed (${k.failed.kind}): ${k.failed.reason}`)
			return `| ${kommuneLabel(k.kommune, k.name)} | ${k.units} | ${k.waiting} | ${k.unitsWithReview} | ${k.accepted} | ${k.review} | ${k.dropped} | ${note} |`
		}),
	]
}

function reviewPart(s: PilotScore): string[] {
	if (s.reviewReasons.length === 0) return ["No field is in review."]
	return [
		`${s.reviewFields} fields are in review. A field with more than one reason counts under each.`,
		"",
		"| Fields | Gate | Reason |",
		"|---|---|---|",
		...s.reviewReasons.map((g) => `| ${g.count} | ${g.gate} | ${cellText(g.reason)} |`),
	]
}

function inclusionPart(s: PilotScore): string[] {
	const head = `${s.inclusion.total} units wait for my "include this unit?" answer. My time for them: about ${s.inclusion.estimateMinutes} minutes. That is an estimate at ${INCLUSION_SECONDS} seconds a question; each answer is saved in the curated file and never asked again.`
	if (s.inclusion.rows.length === 0) return [head]
	return [
		head,
		"",
		"| Kommune | Questions |",
		"|---|---|",
		...s.inclusion.rows.map((r) => `| ${kommuneLabel(r.kommune, r.name)} | ${r.questions} |`),
	]
}

function recallPart(s: PilotScore): string[] {
	const { found, keyRows, lost } = s.recall
	const head = `Found ${found} of ${keyRows} key rows in the key kommuner. A row counts as found while its unit waits for my inclusion answer. Lost: ${lost.length}.`
	if (lost.length === 0) return [head]
	return [
		head,
		"",
		...lost.map((r) => {
			const website = r.website === undefined ? "" : ` Website: ${codeSpan(r.website)}`
			return `- Row ${r.keyId} in ${r.kommune}, ${cellText(r.name)}. Lost at ${STAGE_TEXT[r.stage]}: ${cellText(r.reason)}.${website}`
		}),
	]
}

function disagreementPart(s: PilotScore): string[] {
	const n = s.disagreements.length
	if (n === 0) return ["No accepted value differs from the key."]
	const byHand = s.disagreements.filter((d) => d.byHand).length
	return spaced([
		[
			`${n} accepted values differ from the key. ${s.done.disagreementsRuled} have my ruling, and ${byHand} wait for a check by hand.`,
		],
		...s.disagreements.map((d) => [
			`### Row ${d.keyId}, ${d.field}, in ${d.kommune}`,
			"",
			`- Unit: ${codeSpan(d.unitId)}`,
			`- Key value: ${codeSpan(String(d.keyValue))}`,
			`- Pipeline value: ${codeSpan(String(d.pipelineValue))}`,
			`- Source: ${codeSpan(d.sourceUrl)}`,
			...checkLines("ruling", d.proposed, d.mine, d.byHand),
			"",
			...quoteLines(d.quotes),
		]),
	])
}

function samplePart(s: PilotScore): string[] {
	const { drawn, size, units } = s.sample
	const short =
		drawn < size
			? ` Only ${drawn} units could be drawn, so this is ${drawn} of ${size}, not a full sample.`
			: ""
	const head = `The sample holds ${drawn} of ${size} accepted units from the pilot kommuner the key does not cover.${short} Fields with my check: ${s.done.sampleFieldsChecked} of ${s.done.sampleFields}.`
	return spaced([
		[head],
		...units.map((u) =>
			spaced([
				[
					`### ${u.kommune}, ${codeSpan(u.unitId)}`,
					"",
					`Sources: ${u.sources.map((x) => `${x.kind} ${codeSpan(x.ref)}`).join("; ")}`,
				],
				...u.fields.map((f) => [
					`#### ${f.field}`,
					"",
					`- Value: ${codeSpan(String(f.value))}`,
					`- Source: ${codeSpan(f.sourceUrl)}`,
					...checkLines("check", f.proposed, f.mine, f.byHand),
					"",
					...quoteLines(f.quotes),
				]),
			])
		),
	])
}

// The committed report: the spec's seven parts in order, "\n" line ends, no clock time, no
// duration, no machine path. The same score gives the same bytes.
export function renderReport(s: PilotScore): string {
	return `${spaced([
		["# Pilot report", "", intro(s)],
		["## 1. Pass mark", "", ...passMark(s)],
		["## 2. Per kommune", "", ...perKommune(s)],
		["## 3. Review reasons, ranked", "", ...reviewPart(s)],
		["## 4. Inclusion questions", "", ...inclusionPart(s)],
		["## 5. Recall", "", ...recallPart(s)],
		["## 6. Disagreements", "", ...disagreementPart(s)],
		["## 7. Sample outside the key", "", ...samplePart(s)],
	]).join("\n")}\n`
}

function stageLine(timings: Readonly<Record<string, number>>): string {
	const rank = (stage: string) => {
		const i = STAGE_ORDER.indexOf(stage)
		return i === -1 ? STAGE_ORDER.length : i
	}
	const stages = Object.entries(timings).sort(
		([a], [b]) => rank(a) - rank(b) || compareText(a, b)
	)
	if (stages.length === 0) return "- Stage times: none recorded."
	return `- Stage times: ${stages.map(([stage, ms]) => `${cellText(stage)} ${formatDuration(ms)}`).join(", ")}.`
}

function scaleLines(n: ScaleNumbers): string[] {
	const lines = ["### Scale", "", "From this run's cache, so none of it is in the committed report."]
	if (n.hosts.length === 0) lines.push("", "No crawl report, so no hosts.")
	else {
		lines.push(
			"",
			`The ${Math.min(SHOWN_HOSTS, n.hosts.length)} slowest hosts at their pace:`,
			"",
			"| Host | Requests | Crawl delay | Time at that pace |",
			"|---|---|---|---|",
			...n.hosts
				.slice(0, SHOWN_HOSTS)
				.map(
					(h) =>
						`| ${codeSpan(h.host)} | ${groupDigits(h.requests)} | ${formatDuration(h.delayMs)} | ${formatDuration(h.estimateMs)} |`
				)
		)
		const rest = n.hosts.slice(SHOWN_HOSTS)
		if (rest.length > 0) {
			const requests = rest.reduce((sum, h) => sum + h.requests, 0)
			lines.push("", `And ${rest.length} more hosts with ${groupDigits(requests)} requests between them.`)
		}
	}
	const limit = formatDuration(JOB_LIMIT_MS)
	lines.push(
		"",
		n.slowest === undefined
			? "- Slowest host: none, as there is no crawl report."
			: `- Slowest host: ${codeSpan(n.slowest.host)}, ${formatDuration(n.slowest.estimateMs)} for ${groupDigits(n.slowest.requests)} requests at a ${formatDuration(n.slowest.delayMs)} delay.`,
		n.overJobLimit.length === 0
			? `- No host needs more than the ${limit} a GitHub-hosted job may run.`
			: `- Over the ${limit} a GitHub-hosted job may run: ${n.overJobLimit.map((h) => codeSpan(h)).join(", ")}.`,
		`- Lock files: ${groupDigits(n.lockBytes)} bytes in all.`,
		n.kartverket === undefined
			? "- Kartverket: no counts, as verify-stats.json is missing."
			: `- Kartverket: ${groupDigits(n.kartverket.lookups)} lookups, ${groupDigits(n.kartverket.hits)} answered from the cache.`,
		stageLine(n.timings)
	)
	return lines
}

// The PR body: part 1, part 2, the counts of parts 3 to 7, the report's path and the scale
// numbers. Quotes never come here, and it throws rather than give GitHub a body it refuses.
export function renderPrBody(
	s: PilotScore,
	scale: ScaleNumbers | undefined,
	reportPath: string
): string {
	const disagreementsByHand = s.disagreements.filter((d) => d.byHand).length
	const sampleByHand = s.done.checkByHand - disagreementsByHand
	const lines = [
		"## Pilot score",
		"",
		...passMark(s),
		"",
		"### Per kommune",
		"",
		...perKommune(s),
		"",
		"### The rest of the report",
		"",
		`- Review reasons (part 3): ${s.reviewFields} fields in review, in ${s.reviewReasons.length} groups.`,
		`- Inclusion questions (part 4): ${s.inclusion.total}, about ${s.inclusion.estimateMinutes} minutes of my time. That is an estimate.`,
		`- Recall (part 5): ${s.recall.found} of ${s.recall.keyRows} key rows found, ${s.recall.lost.length} lost.`,
		`- Disagreements (part 6): ${s.done.disagreements}, ${s.done.disagreementsRuled} with my ruling, ${disagreementsByHand} to check by hand.`,
		`- Sample outside the key (part 7): ${s.sample.drawn} of ${s.sample.size} units, ${s.done.sampleFieldsChecked} of ${s.done.sampleFields} fields with my check, ${sampleByHand} to check by hand.`,
		"",
		`The whole report is committed as ${codeSpan(reportPath)}.`,
		...(scale === undefined ? [] : ["", ...scaleLines(scale)]),
	]
	const body = `${lines.join("\n")}\n`
	if (body.length > PR_BODY_LIMIT) throw new PrBodyTooLongError(body.length)
	return body
}
```

- [ ] **Step 6: Run the tests to see them pass**

Run: `npx vitest run test/markdown.test.ts test/report.test.ts`
Expected: PASS.

- [ ] **Step 7: Show it red once**

1. In `codeBlock`, change `Math.max(3, longestRun(lines.join("\n")) + 1)` to `3`. Run `npx vitest run test/report.test.ts`: FAIL on "renders a hostile quote and a javascript: value inert" (the fence is three backticks, so the quote's line of three backticks closes it, `@other <img src=y>` lands outside, and `outsideFences` finds it). Restore, run: PASS.
2. In `pilot.ts` (Task 8), change the review-reason sort to `(a, b) => b.count - a.count`. Run `npx vitest run test/report.test.ts`: FAIL on "keeps two review reasons with equal counts in one order across runs". Restore, run: PASS.
3. In `renderPrBody`, change `body.length > PR_BODY_LIMIT` to `body.length > PR_BODY_LIMIT * 10`. Run `npx vitest run test/report.test.ts`: FAIL on "throws over the limit". Restore, run: PASS.
4. In `cellText`, remove the two `.replace` calls after `inert(sanitise(text))`. Run `npx vitest run test/markdown.test.ts`: FAIL on "breaks a bare web address, so GitHub cannot make it a link". Restore, run: PASS.

Note all four for the PR body.

- [ ] **Step 8: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm run lint && npm test
git add src/score/markdown.ts src/score/render.ts src/score/scale.ts test/markdown.test.ts test/report.test.ts
git commit -m "feat(pipeline): render the pilot report and the PR-body summary inert"
```

---

### Task 10: The `score` command and the scale numbers

`npm run score -- --only pilot` reads the committed files and the local caches, refuses or writes `docs/pilot/pilot-report.md`, and prints the pass-mark lines. The file reading lives in `src/score/load.ts` so a test can run it against a temp folder; the CLI only parses arguments and writes.

Two more options, from the controller, because parts 6 and 7 quote lock text from all 47 kommuner and the Claude session that checks live pages must never read the report:

- `--todo <file>` writes `{ blockedHosts: string[]; items: TodoItem[] }`: every disagreement and sampled field with no check by me, outside the ClaudeBot-blocking kommuner and never one whose value or unit page lies on their sites (`byHand`). `blockedHosts` lists those sites, so the checking session knows which hosts it must never open. It prints the count only.
- `--seed-blocked` adds `{ kind, keyId?, unitId, field, ruling: "unclear", note: "check by hand", by: "proposed" }` to `test/pilot-checks.json` for every disagreement and sampled field in a blocking kommune, or marked `byHand`, with no check at all. It copies ids and field names only, runs after the refusal checks pass, and a second run adds nothing.

`score` also refuses while the merged crawl report holds a transient stop (a timeout, a network error or a server error) on a pilot kommune's own site host, and names those kommune numbers (Decided 26).

Everything is computed before anything is written, so a refusal, a load error or a PR body over the limit leaves every file as it was. Only the pass-mark lines and counts are printed; never a quote, a value, a unit id or a URL.

`--offline` is accepted and changes nothing (Decided 7): `score` never fetches and never purges. The usage line and `--help` say so.

Never run `npm run score` against the real caches from an agent shell. On `main` there are no lock files, so it would only refuse, but the smoke test below points `--cache` at an empty temp folder anyway.

**Files:**
- Create: `pipeline/src/score/load.ts`, `pipeline/src/score/todo.ts`, `pipeline/src/cli/score.ts`
- Modify: `pipeline/src/score/scale.ts` (add `ScaleInput`, `scaleNumbers`), `pipeline/package.json`, `pipeline/test/networkBoundary.test.ts`
- Test: `pipeline/test/scale.test.ts`, `pipeline/test/scoreLoad.test.ts`, `pipeline/test/todo.test.ts`

**Interfaces:**
- Consumes: `readDiscovery`, `DiscoverError`, `DiscoveryFiles`; `siteHost` (`text/normalise.ts`); `readExtraction`; `readJsonDir`, `writeFileAtomic`, `writeJsonAtomic`; `readTimings`, `readCrawlReport(path)` (Task 4); `CrawlReport`; `TRANSIENT_KINDS` (Task 6); `PILOT`, `KEY_KOMMUNER`, `CLAUDEBOT_BLOCKED` (Task 1); `AnswerKey`; `LockFile`; `CuratedFile`; `readPilotChecks`, `readKnownWrong`, `PilotChecks` (Task 7); `scorePilot`, `PilotScore`, `Check`, `Checks`, `Ruling`, `PageCount`, `PilotInput`, `compareText` (Task 8); `renderReport`, `renderPrBody`, `PrBodyTooLongError`, `ScaleNumbers`, `HostScale`, `JOB_LIMIT_MS` (Task 9); `DEFAULT_CACHE_DIR`.
- Produces:
  - `score/scale.ts`: `ScaleInput = { report?: CrawlReport; lockBytes: number; stats?: { lookups: number; hits: number }; timings: Record<string, number> }`, `scaleNumbers(o: ScaleInput): ScaleNumbers`.
  - `score/load.ts`: `REPORT_PATH = "docs/pilot/pilot-report.md"`, `testFile(root, name): string`, `ScoreLoadError`, `loadPilotInput(root: string, cacheDir: string, only: readonly string[]): PilotInput`, `loadScaleInput(root, cacheDir, only): ScaleInput`, `transientStops(input: PilotInput): string[]` (pilot kommuner whose own site host has a transient stop in the crawl report; the CLI refuses on any, Decided 26).
  - `score/todo.ts`: `CHECK_BY_HAND = "check by hand"`, `TodoItem = { kind: "disagreement" | "sample"; keyId?: number; kommune: string; unitId: string; field: FieldName; keyValue?: FieldValue; pipelineValue: FieldValue; sourceUrl: string; quotes: string[]; proposed?: Ruling }`, `todoItems(s: PilotScore, blocked: readonly string[]): TodoItem[]` (the `--todo` file is `{ blockedHosts: string[]; items: TodoItem[] }`), `compareChecks(a: Check, b: Check): number`, `seedBlocked(s: PilotScore, checks: Checks, blocked: readonly string[]): { checks: Checks; added: number }`.
  - `cli/score.ts`, npm script `score`: `npm run score -- [--only pilot] [--pr-body <file>] [--todo <file>] [--seed-blocked] [--offline] [--cache <dir>]`.

- [ ] **Step 1: Write the failing tests**

Create `pipeline/test/scale.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { renderPrBody, renderReport } from "../src/score/render.ts"
import { scaleNumbers } from "../src/score/scale.ts"
import { pilotInput, scored } from "./pilotFixture.ts"

// The spec's example: 1,000 pages at a 30-second delay is 8 hours 20 minutes.
const report = {
	hosts: [
		{ host: "www.eksempel.kommune.no", requests: 120, delayMs: 5_000 },
		{ host: "treg.eksempel.no", requests: 1_000, delayMs: 30_000 },
	],
	notFetched: [],
}

describe("scaleNumbers", () => {
	const n = scaleNumbers({
		report,
		lockBytes: 1_234_567,
		stats: { lookups: 400, hits: 310 },
		timings: { fetch: 30_000_000, discover: 125_000 },
	})

	it("estimates each host at its pace, slowest first, and flags one over 6 hours", () => {
		expect(n.hosts).toEqual([
			{ host: "treg.eksempel.no", requests: 1_000, delayMs: 30_000, estimateMs: 30_000_000 },
			{ host: "www.eksempel.kommune.no", requests: 120, delayMs: 5_000, estimateMs: 600_000 },
		])
		expect(n.slowest?.host).toBe("treg.eksempel.no")
		expect(n.overJobLimit).toEqual(["treg.eksempel.no"])
		expect(n).toMatchObject({ lockBytes: 1_234_567, kartverket: { lookups: 400, hits: 310 } })
	})

	it("puts the numbers in the PR body and never in the report", () => {
		const s = scored(pilotInput())
		const body = renderPrBody(s, n, "docs/pilot/pilot-report.md")
		for (const line of [
			"| `treg.eksempel.no` | 1,000 | 30 s | 8 h 20 min |",
			"- Slowest host: `treg.eksempel.no`, 8 h 20 min for 1,000 requests at a 30 s delay.",
			"- Over the 6 h a GitHub-hosted job may run: `treg.eksempel.no`.",
			"- Lock files: 1,234,567 bytes in all.",
			"- Kartverket: 400 lookups, 310 answered from the cache.",
			"- Stage times: discover 2 min 5 s, fetch 8 h 20 min.",
		]) {
			expect(body).toContain(line)
		}
		expect(renderReport(s)).not.toContain("treg.eksempel.no")
	})

	it("has no hosts and no slowest host without a crawl report", () => {
		const bare = scaleNumbers({ lockBytes: 0, timings: {} })
		expect(bare).toEqual({ hosts: [], overJobLimit: [], lockBytes: 0, timings: {} })
	})
})
```

Create `pipeline/test/scoreLoad.test.ts`:

```ts
import { mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { describe, expect, it } from "vitest"
import type { HostLine } from "../src/net/crawler.ts"
import { CLAUDEBOT_BLOCKED } from "../src/pilot/list.ts"
import {
	loadPilotInput,
	loadScaleInput,
	ScoreLoadError,
	transientStops,
} from "../src/score/load.ts"
import { type PilotInput, scorePilot } from "../src/score/pilot.ts"
import { AT, baseLocks, discovery, KEY, lock, page, PILOT_T, pilotInput } from "./pilotFixture.ts"

const write = (path: string, value: unknown) => {
	mkdirSync(dirname(path), { recursive: true })
	writeFileSync(path, `${JSON.stringify(value, null, "\t")}\n`)
}

// A tiny repo and cache, laid out as the score command finds them. The extraction's quote holds
// a marker word, so a test can show the loaded input keeps no page text.
function layout(): { root: string; cache: string } {
	const root = mkdtempSync(join(tmpdir(), "varde-score-"))
	const cache = join(root, ".cache")
	for (const l of baseLocks()) write(join(root, "data", "lock", `${l.kommune}.json`), l)
	write(join(root, "data", "lock", "0301.json"), lock("0301", []))
	write(join(root, "data", "curated", "3401-eksempelby.json"), {
		kommune: "3401",
		name: "Eksempelby",
		units: [],
	})
	const test = (name: string) => join(root, "pipeline", "test", name)
	write(test("answer-key.json"), KEY)
	write(test("lavterskel-changes.json"), { rows: [] })
	write(test("pilot-checks.json"), { checks: [] })
	write(test("known-wrong.json"), { entries: [] })
	const found = discovery()
	write(join(cache, "discover", "report.json"), found.report)
	write(join(cache, "discover", "hosts.json"), found.hosts)
	write(join(cache, "discover", "national.json"), found.national)
	for (const k of found.kommuner) write(join(cache, "discover", "kommuner", `${k.kommune}.json`), k)
	write(join(cache, "pages", "report.json"), {
		hosts: [{ host: "www.eksempel.kommune.no", requests: 12, delayMs: 5_000 }],
		notFetched: [],
	})
	write(join(cache, "verify-stats.json"), { lookups: 40, hits: 30 })
	for (const scope of ["3401", "3403", "national"])
		write(join(cache, "extract", `${scope}.json`), { scope, extractedAt: AT, pages: [] })
	write(join(cache, "extract", "3405.json"), {
		scope: "3405",
		extractedAt: AT,
		pages: [
			{
				url: page("tjeneste-1"),
				finalUrl: page("tjeneste-1"),
				fetchedAt: AT,
				adapter: "fallback",
				fallback: true,
				blocks: [],
				candidates: [
					{
						field: "phone",
						value: "62 00 00 00",
						evidence: { kind: "quote", quotes: ["Sentralbord 62 00 00 00 (eksempeltekst)"] },
						origin: "unitPage",
					},
				],
				lavterskelQuotes: [],
			},
		],
	})
	return { root, cache }
}

describe("loadPilotInput", () => {
	it("reads the committed files and the caches, and keeps no page text", () => {
		const { root, cache } = layout()
		const input = loadPilotInput(root, cache, PILOT_T)
		expect(input.pilot).toEqual(PILOT_T)
		expect(input.keyKommuner).toEqual(["3403", "3405"])
		expect(input.blocked).toEqual(CLAUDEBOT_BLOCKED)
		expect(input.locks.map((l) => l.kommune)).toEqual(PILOT_T)
		expect(input.curated.map((c) => c.kommune)).toEqual(["3401"])
		expect(input.key.rows).toHaveLength(11)
		expect(input.crawl?.hosts).toEqual([
			{ host: "www.eksempel.kommune.no", requests: 12, delayMs: 5_000 },
		])
		expect(input.extracted).toEqual({
			"3401": [],
			"3403": [],
			"3405": [{ url: page("tjeneste-1"), finalUrl: page("tjeneste-1"), candidates: 1 }],
			national: [],
		})
		expect(JSON.stringify(input)).not.toContain("eksempeltekst")
		expect(scorePilot(input).refused).toBe(false)
	})

	it("says to run discover when the discover folder is missing", () => {
		const { root, cache } = layout()
		rmSync(join(cache, "discover"), { recursive: true })
		expect(() => loadPilotInput(root, cache, PILOT_T)).toThrow(
			new ScoreLoadError("discover/report.json is missing: run discover first")
		)
	})

	it("stops on a missing extraction file and names it", () => {
		const { root, cache } = layout()
		rmSync(join(cache, "extract", "3403.json"))
		expect(() => loadPilotInput(root, cache, PILOT_T)).toThrow(
			new ScoreLoadError(
				"extract/3403.json is missing or does not match its schema: run extract first (--offline for a gap PR)"
			)
		)
	})

	it("names a lock file that does not match its schema, never quoting it", () => {
		const { root, cache } = layout()
		write(join(root, "data", "lock", "3401.json"), { kommune: "3401", units: "Kari Nordmann" })
		expect(() => loadPilotInput(root, cache, PILOT_T)).toThrow(
			new ScoreLoadError("data/lock/3401.json does not match its schema: run npm run data:check")
		)
	})

	it("reads the scale input from the cache and the selected lock files", () => {
		const { root, cache } = layout()
		const scale = loadScaleInput(root, cache, PILOT_T)
		const bytes = PILOT_T.reduce(
			(sum, k) => sum + statSync(join(root, "data", "lock", `${k}.json`)).size,
			0
		)
		expect(scale).toMatchObject({ lockBytes: bytes, stats: { lookups: 40, hits: 30 } })
		expect(scale.report?.hosts).toHaveLength(1)
	})
})

describe("transientStops", () => {
	const SITE = "www.eksempel.kommune.no"
	// 3405's own site is SITE, and the crawl report gives SITE the stop under test.
	const input = (stopped?: HostLine["stopped"]): PilotInput => {
		const found = discovery()
		const site = {
			host: SITE,
			sitemap: "probe" as const,
			sitemapUrls: 1,
			servicePages: 1,
			kept: 1,
			truncated: false,
		}
		const line = { host: SITE, requests: 12, delayMs: 5_000 }
		return pilotInput({
			discovery: {
				...found,
				kommuner: found.kommuner.map((k) => (k.kommune === "3405" ? { ...k, site } : k)),
			},
			crawl: { hosts: [stopped === undefined ? line : { ...line, stopped }], notFetched: [] },
		})
	}

	it("names a pilot kommune whose own site stopped on a timeout, a network error or a server error", () => {
		for (const kind of ["timeout", "network", "serverError"] as const) {
			expect(transientStops(input(kind))).toEqual(["3405"])
		}
	})

	it("leaves out a lasting stop, a site that ran, and a run with no crawl report", () => {
		expect(transientStops(input("visitTime"))).toEqual([])
		expect(transientStops(input())).toEqual([])
		expect(transientStops(pilotInput({ crawl: undefined }))).toEqual([])
	})
})
```

Create `pipeline/test/todo.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { PilotChecks } from "../src/score/checks.ts"
import { CHECK_BY_HAND, seedBlocked, todoItems } from "../src/score/todo.ts"
import { acceptedField } from "./helpers.ts"
import { baseLocks, named, page, pilotInput, sampleChecks, scored, unitIdOf, withUnits } from "./pilotFixture.ts"

const otherPhone = (n: number) =>
	named(n, `Tjeneste ${n}`, {
		phone: acceptedField({
			value: "62 00 00 09",
			sourceUrl: page(`tjeneste-${n}`),
			evidence: { kind: "quote", quotes: ["Telefon: 62 00 00 09"] },
		}),
	})
// A disagreement in 3405 (open) and one in 3403 (blocks ClaudeBot).
const locks = withUnits(withUnits(baseLocks(), "3405", [otherPhone(2)]), "3403", [otherPhone(11)])

describe("todoItems", () => {
	it("lists what waits for a check, never from a kommune that blocks ClaudeBot", () => {
		const s = scored(pilotInput({ locks, checks: { checks: sampleChecks().slice(2) } }))
		const items = todoItems(s, ["3403"])
		expect(items.map((i) => [i.kind, i.kommune, i.keyId, i.unitId, i.field])).toEqual([
			["disagreement", "3405", 2, unitIdOf(2), "phone"],
			["sample", "3401", undefined, unitIdOf(41), "name"],
			["sample", "3401", undefined, unitIdOf(41), "phone"],
		])
		expect(items[0]).toMatchObject({
			keyValue: "62 00 00 00",
			pipelineValue: "62 00 00 09",
			sourceUrl: page("tjeneste-2"),
			quotes: ["Telefon: 62 00 00 09"],
		})
		expect(todoItems(s, ["3401", "3403"]).map((i) => i.kommune)).toEqual(["3405"])
	})

	it("leaves out a field whose page is on a blocked kommune's site, whatever the unit's kommune", () => {
		const blockedPage = "https://www.proveby.kommune.no/tjeneste-41/"
		const hosted = withUnits(baseLocks(), "3401", [
			named(41, "Tilbud 41", { phone: acceptedField({ sourceUrl: blockedPage }) }),
		])
		const s = scored(
			pilotInput({
				locks: hosted,
				blockedHosts: ["proveby.kommune.no"],
				checks: { checks: sampleChecks([42, 43]) },
			})
		)
		const fields = s.sample.units.find((u) => u.unitId === unitIdOf(41))?.fields ?? []
		expect(fields.map((f) => [f.field, f.byHand])).toEqual([
			["name", false],
			["phone", true],
		])
		expect(todoItems(s, ["3403"]).map((i) => [i.kommune, i.unitId, i.field])).toEqual([
			["3401", unitIdOf(41), "name"],
		])
	})
})

describe("seedBlocked", () => {
	it("adds one id-only check-by-hand entry per open field in a blocked kommune, once", () => {
		const input = pilotInput({ locks, blocked: ["3401", "3403"], checks: { checks: [] } })
		const first = seedBlocked(scored(input), input.checks, input.blocked)
		// The 3403 disagreement and the 6 sampled fields in 3401; never the open 3405 one.
		expect(first.added).toBe(7)
		expect(PilotChecks.parse(first.checks)).toEqual(first.checks)
		expect(first.checks.checks[0]).toEqual({
			kind: "disagreement",
			keyId: 11,
			unitId: unitIdOf(11),
			field: "phone",
			ruling: "unclear",
			note: CHECK_BY_HAND,
			by: "proposed",
		})
		for (const c of first.checks.checks) {
			expect(Object.keys(c).sort()).toEqual(
				c.kind === "sample"
					? ["by", "field", "kind", "note", "ruling", "unitId"]
					: ["by", "field", "keyId", "kind", "note", "ruling", "unitId"]
			)
		}
		expect(first.checks.checks.map((c) => `${c.kind} ${c.unitId} ${c.field}`)).toEqual([
			`disagreement ${unitIdOf(11)} phone`,
			`sample ${unitIdOf(41)} name`,
			`sample ${unitIdOf(41)} phone`,
			`sample ${unitIdOf(42)} name`,
			`sample ${unitIdOf(42)} phone`,
			`sample ${unitIdOf(43)} name`,
			`sample ${unitIdOf(43)} phone`,
		])
		const again = seedBlocked(scored({ ...input, checks: first.checks }), first.checks, input.blocked)
		expect(again.added).toBe(0)
		expect(again.checks).toEqual(first.checks)
	})
})
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run test/scale.test.ts test/scoreLoad.test.ts test/todo.test.ts`
Expected: FAIL, `scaleNumbers` is not exported from `../src/score/scale.ts`, and `../src/score/load.ts` and `../src/score/todo.ts` do not exist.

- [ ] **Step 3: Add `scaleNumbers` to `src/score/scale.ts`**

Add at the top of the file:

```ts
import type { CrawlReport } from "../net/crawler.ts"
import { compareText } from "./sample.ts"
```

and at the end:

```ts
export type ScaleInput = {
	report?: CrawlReport
	lockBytes: number
	stats?: { lookups: number; hits: number }
	timings: Record<string, number>
}

// Each host's time if its requests run one after another at its crawl delay. A host over 6 hours
// cannot finish in one GitHub-hosted job, so PR 5 has to split or resume it.
export function scaleNumbers(o: ScaleInput): ScaleNumbers {
	const hosts = (o.report?.hosts ?? [])
		.map((h) => ({
			host: h.host,
			requests: h.requests,
			delayMs: h.delayMs,
			estimateMs: h.requests * h.delayMs,
		}))
		.sort((a, b) => b.estimateMs - a.estimateMs || compareText(a.host, b.host))
	const [slowest] = hosts
	return {
		hosts,
		...(slowest === undefined ? {} : { slowest }),
		overJobLimit: hosts
			.filter((h) => h.estimateMs > JOB_LIMIT_MS)
			.map((h) => h.host)
			.sort(compareText),
		lockBytes: o.lockBytes,
		...(o.stats === undefined ? {} : { kartverket: { lookups: o.stats.lookups, hits: o.stats.hits } }),
		timings: { ...o.timings },
	}
}
```

- [ ] **Step 4: Write `src/score/load.ts`**

```ts
import { existsSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { z } from "zod"
import { AnswerKey } from "../answerKey/schema.ts"
import { DiscoverError } from "../discover/discover.ts"
import { type DiscoveryFiles, readDiscovery } from "../discover/files.ts"
import { readExtraction } from "../extract/extract.ts"
import { readCrawlReport } from "../fetch/fetchPages.ts"
import { readJsonDir } from "../io/files.ts"
import { readTimings } from "../io/timings.ts"
import type { CrawlReport } from "../net/crawler.ts"
import { CLAUDEBOT_BLOCKED, KEY_KOMMUNER } from "../pilot/list.ts"
import { CuratedFile } from "../schema/curated.ts"
import { LockFile } from "../schema/lock.ts"
import { siteHost } from "../text/normalise.ts"
import { TRANSIENT_KINDS } from "../verify/failed.ts"
import { readKnownWrong, readPilotChecks } from "./checks.ts"
import type { PageCount, PilotInput } from "./pilot.ts"
import { compareText } from "./sample.ts"
import type { ScaleInput } from "./scale.ts"

export const REPORT_PATH = "docs/pilot/pilot-report.md"
export const testFile = (root: string, name: string) => join(root, "pipeline", "test", name)

export class ScoreLoadError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "ScoreLoadError"
	}
}

const VerifyStats = z.object({
	lookups: z.number().int().nonnegative(),
	hits: z.number().int().nonnegative(),
})
const DecideOnce = z.object({ rows: z.array(z.number().int().positive()) })

// Messages name the file only: a parse error would quote its text.
function readJson<S extends z.ZodType>(schema: S, path: string, name: string): z.output<S> {
	if (!existsSync(path)) throw new ScoreLoadError(`${name} is missing`)
	let data: unknown
	try {
		data = JSON.parse(readFileSync(path, "utf8"))
	} catch {
		throw new ScoreLoadError(`${name} is not valid JSON`)
	}
	const parsed = schema.safeParse(data)
	if (!parsed.success) throw new ScoreLoadError(`${name} does not match its schema`)
	return parsed.data
}

function readLocks(root: string, only: readonly string[]): LockFile[] {
	return readJsonDir(join(root, "data", "lock")).flatMap((f) => {
		const parsed = LockFile.safeParse(f.data)
		if (!f.valid || !parsed.success)
			throw new ScoreLoadError(`data/lock/${f.file} does not match its schema: run npm run data:check`)
		return only.includes(parsed.data.kommune) ? [parsed.data] : []
	})
}

function readCurated(root: string, only: readonly string[]): CuratedFile[] {
	return readJsonDir(join(root, "data", "curated")).flatMap((f) => {
		const parsed = CuratedFile.safeParse(f.data)
		if (!f.valid || !parsed.success)
			throw new ScoreLoadError(`data/curated/${f.file} does not match its schema: run npm run data:check`)
		return only.includes(parsed.data.kommune) ? [parsed.data] : []
	})
}

function readChecksFile<T>(read: () => T, name: string): T {
	try {
		return read()
	} catch {
		throw new ScoreLoadError(`${name} is missing or does not match its schema`)
	}
}

function readDiscoveryFiles(cacheDir: string): DiscoveryFiles {
	try {
		return readDiscovery(join(cacheDir, "discover"))
	} catch (err) {
		if (err instanceof DiscoverError) throw new ScoreLoadError(`discover/${err.message}`)
		throw err
	}
}

// The crawl report through fetch's own reader (Task 4). A report that exists but does not parse
// stops the score: read as missing, it would turn a stopped host into "no pages fetched".
function crawlReportOf(cacheDir: string): CrawlReport | undefined {
	const path = join(cacheDir, "pages", "report.json")
	if (!existsSync(path)) return undefined
	const report = readCrawlReport(path)
	if (report === undefined) throw new ScoreLoadError("pages/report.json does not match its schema")
	return report
}

// The sites of the kommuner that block ClaudeBot, as siteHost gives them, from what discover found.
function blockedHostsOf(discovery: DiscoveryFiles): string[] {
	const hosts = new Set<string>()
	for (const k of discovery.kommuner) {
		if (!CLAUDEBOT_BLOCKED.includes(k.kommune) || k.site === undefined) continue
		const host = siteHost(`https://${k.site.host}/`)
		if (host !== undefined) hosts.add(host)
	}
	return [...hosts].sort(compareText)
}

// Everything scorePilot needs, read from the repo (root) and the cache. The extraction files hold
// page lines: each is cut down to its pages' URLs and candidate counts here, so the score never
// holds page text. only is the list of kommune numbers to score (PILOT for --only pilot).
export function loadPilotInput(root: string, cacheDir: string, only: readonly string[]): PilotInput {
	const discovery = readDiscoveryFiles(cacheDir)
	const pilot = [...only].sort(compareText)
	const extracted: Record<string, PageCount[]> = {}
	for (const scope of [...pilot, "national"]) {
		// Read as empty, a missing file would change the report with no lock change.
		const extraction = readExtraction(cacheDir, scope)
		if (extraction === undefined)
			throw new ScoreLoadError(
				`extract/${scope}.json is missing or does not match its schema: run extract first (--offline for a gap PR)`
			)
		extracted[scope] = extraction.pages.map((p) => ({
			url: p.url,
			finalUrl: p.finalUrl,
			candidates: p.candidates.length,
		}))
	}
	return {
		pilot,
		keyKommuner: KEY_KOMMUNER.filter((k) => pilot.includes(k)),
		blocked: CLAUDEBOT_BLOCKED,
		blockedHosts: blockedHostsOf(discovery),
		locks: readLocks(root, pilot),
		curated: readCurated(root, pilot),
		key: readJson(AnswerKey, testFile(root, "answer-key.json"), "test/answer-key.json"),
		decideOnce: readJson(
			DecideOnce,
			testFile(root, "lavterskel-changes.json"),
			"test/lavterskel-changes.json"
		).rows,
		checks: readChecksFile(
			() => readPilotChecks(testFile(root, "pilot-checks.json")),
			"test/pilot-checks.json"
		),
		known: readChecksFile(
			() => readKnownWrong(testFile(root, "known-wrong.json")),
			"test/known-wrong.json"
		),
		discovery,
		crawl: crawlReportOf(cacheDir),
		extracted,
	}
}

// The pilot kommuner whose own site host stopped on a timeout, a network error or a server error in
// the merged crawl report (Decided 26). Such a kommune can hold a normal lock with part of its
// pages missing, so its numbers are no result yet. Kommune numbers only.
export function transientStops(input: PilotInput): string[] {
	const stops = new Map((input.crawl?.hosts ?? []).map((h) => [h.host, h.stopped]))
	return input.discovery.kommuner
		.filter((k) => {
			const kind = stops.get(k.site?.host.toLowerCase() ?? "")
			return input.pilot.includes(k.kommune) && kind !== undefined && TRANSIENT_KINDS.includes(kind)
		})
		.map((k) => k.kommune)
		.sort(compareText)
}

// The PR body's scale numbers: the crawl report, the selected lock files' total size, verify's
// Kartverket counts and the stage timings. All of it is local; none of it goes in the report.
export function loadScaleInput(root: string, cacheDir: string, only: readonly string[]): ScaleInput {
	let lockBytes = 0
	for (const kommune of only) {
		const path = join(root, "data", "lock", `${kommune}.json`)
		if (existsSync(path)) lockBytes += statSync(path).size
	}
	const report = crawlReportOf(cacheDir)
	const statsPath = join(cacheDir, "verify-stats.json")
	return {
		...(report === undefined ? {} : { report }),
		lockBytes,
		...(existsSync(statsPath)
			? { stats: readJson(VerifyStats, statsPath, "verify-stats.json") }
			: {}),
		timings: readTimings(cacheDir),
	}
}
```

- [ ] **Step 5: Write `src/score/todo.ts`**

```ts
import type { FieldName, FieldValue } from "../schema/common.ts"
import type { Check, Checks, PilotScore, Ruling } from "./pilot.ts"
import { compareText } from "./sample.ts"

export const CHECK_BY_HAND = "check by hand"

export type TodoItem = {
	kind: "disagreement" | "sample"
	keyId?: number
	kommune: string
	unitId: string
	field: FieldName
	keyValue?: FieldValue
	pipelineValue: FieldValue
	sourceUrl: string
	quotes: string[]
	proposed?: Ruling
}

// What the checking session reads instead of the report: every disagreement and sampled field
// with no check by me yet. The kommuner that block ClaudeBot are left out whole, and so is any
// field marked by hand (its value or its unit's page lies on one of their sites), because their
// text never goes to an AI company; I check those myself.
export function todoItems(s: PilotScore, blocked: readonly string[]): TodoItem[] {
	const items: TodoItem[] = []
	for (const d of s.disagreements) {
		if (blocked.includes(d.kommune) || d.byHand || d.mine !== undefined) continue
		items.push({
			kind: "disagreement",
			keyId: d.keyId,
			kommune: d.kommune,
			unitId: d.unitId,
			field: d.field,
			keyValue: d.keyValue,
			pipelineValue: d.pipelineValue,
			sourceUrl: d.sourceUrl,
			quotes: [...d.quotes],
			...(d.proposed === undefined ? {} : { proposed: d.proposed }),
		})
	}
	for (const u of s.sample.units) {
		if (blocked.includes(u.kommune)) continue
		for (const f of u.fields) {
			if (f.byHand || f.mine !== undefined) continue
			items.push({
				kind: "sample",
				kommune: u.kommune,
				unitId: u.unitId,
				field: f.field,
				pipelineValue: f.value,
				sourceUrl: f.sourceUrl,
				quotes: [...f.quotes],
				...(f.proposed === undefined ? {} : { proposed: f.proposed }),
			})
		}
	}
	return items
}

// The order of test/pilot-checks.json: kind, key row id, unit id, field, then who wrote it.
export function compareChecks(a: Check, b: Check): number {
	return (
		compareText(a.kind, b.kind) ||
		(a.keyId ?? 0) - (b.keyId ?? 0) ||
		compareText(a.unitId, b.unitId) ||
		compareText(a.field, b.field) ||
		compareText(a.by, b.by)
	)
}

// One proposed "unclear, check by hand" entry for each disagreement and sampled field in a
// kommune that blocks ClaudeBot, or marked by hand, that has no check at all. It copies ids and
// field names only, never a value or a quote, and a second run adds nothing.
export function seedBlocked(
	s: PilotScore,
	checks: Checks,
	blocked: readonly string[]
): { checks: Checks; added: number } {
	const added: Check[] = []
	const seed = (target: { kind: Check["kind"]; keyId?: number; unitId: string; field: FieldName }) =>
		added.push({ ...target, ruling: "unclear", note: CHECK_BY_HAND, by: "proposed" })
	for (const d of s.disagreements) {
		if ((blocked.includes(d.kommune) || d.byHand) && d.proposed === undefined && d.mine === undefined)
			seed({ kind: "disagreement", keyId: d.keyId, unitId: d.unitId, field: d.field })
	}
	// Every sampled unit is read: a field in an open kommune can still be marked by hand.
	for (const u of s.sample.units) {
		for (const f of u.fields) {
			if ((blocked.includes(u.kommune) || f.byHand) && f.proposed === undefined && f.mine === undefined)
				seed({ kind: "sample", unitId: u.unitId, field: f.field })
		}
	}
	return { checks: { checks: [...checks.checks, ...added].sort(compareChecks) }, added: added.length }
}
```

- [ ] **Step 6: Run the tests to see them pass**

Run: `npx vitest run test/scale.test.ts test/scoreLoad.test.ts test/todo.test.ts`
Expected: PASS.

- [ ] **Step 7: Write `src/cli/score.ts`**

```ts
// Scores the pilot's committed lock files against the pass mark and writes
// docs/pilot/pilot-report.md. It never fetches and never purges: it reads data/, the answer key,
// my checks, and the local discover, crawl and extract caches. It prints the pass-mark lines and
// counts only, never a quote, a value, a unit id or a URL.
//   node src/cli/score.ts [--only pilot] [--pr-body <file>] [--todo <file>] [--seed-blocked] [--offline] [--cache <dir>]
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"
import { writeFileAtomic, writeJsonAtomic } from "../io/files.ts"
import { DEFAULT_CACHE_DIR } from "../io/pageCache.ts"
import { PILOT } from "../pilot/list.ts"
import {
	loadPilotInput,
	loadScaleInput,
	REPORT_PATH,
	ScoreLoadError,
	testFile,
	transientStops,
} from "../score/load.ts"
import { type PilotInput, type PilotScore, scorePilot } from "../score/pilot.ts"
import { PrBodyTooLongError, renderPrBody, renderReport } from "../score/render.ts"
import { scaleNumbers } from "../score/scale.ts"
import { seedBlocked, todoItems } from "../score/todo.ts"

const USAGE =
	"usage: score [--only pilot] [--pr-body <file>] [--todo <file>] [--seed-blocked] [--offline (changes nothing)] [--cache <dir>]"
const HELP = [
	USAGE,
	"",
	"  --only pilot      Oslo and the 46 Innlandet kommuner: the default, and the only selection score takes",
	"  --pr-body <file>  also write the PR-body summary, with the scale numbers from the cache",
	"  --todo <file>     write the disagreements and sampled fields that wait for my check, leaving out the kommuner that block ClaudeBot",
	'  --seed-blocked    add a "check by hand" entry to test/pilot-checks.json for each one in those kommuner',
	"  --offline         accepted so every stage takes it; it changes nothing, because score never fetches and never purges",
	"  --cache <dir>     the cache folder (default: .cache/ at the repo root)",
].join("\n")

function stop(message: string, code: number): never {
	console.error(message)
	process.exit(code)
}

const parsed = (() => {
	try {
		return parseArgs({
			options: {
				only: { type: "string" },
				"pr-body": { type: "string" },
				todo: { type: "string" },
				"seed-blocked": { type: "boolean", default: false },
				offline: { type: "boolean", default: false },
				cache: { type: "string" },
				help: { type: "boolean", default: false },
			},
		})
	} catch {
		return undefined
	}
})()
if (parsed === undefined) stop(USAGE, 2)
const { values } = parsed
if (values.help) {
	console.log(HELP)
	process.exit(0)
}
if (values.only !== undefined && values.only !== "pilot")
	stop(`score takes the whole pilot only: use --only pilot\n${USAGE}`, 2)

const root = fileURLToPath(new URL("../../../", import.meta.url))
const cacheDir = values.cache ?? DEFAULT_CACHE_DIR

function scoreOrStop(input: PilotInput): PilotScore {
	const result = scorePilot(input)
	if (!result.refused) return result
	for (const p of result.problems) console.error(p)
	return stop("score refused: nothing was written", 1)
}

try {
	const input = loadPilotInput(root, cacheDir, PILOT)
	// A kommune whose own site stopped halfway can hold a normal lock with pages missing (Decided 26).
	const stops = transientStops(input)
	if (stops.length > 0) {
		console.error(
			`Own site stopped on a timeout, a network error or a server error: ${stops.join(", ")}. Run fetch --resume, extract, verify --resume, then score.`
		)
		stop("score refused: nothing was written", 1)
	}
	let score = scoreOrStop(input)
	// Seeding only ever follows a score that passed the refusal checks.
	const seeded = values["seed-blocked"] ? seedBlocked(score, input.checks, input.blocked) : undefined
	if (seeded !== undefined && seeded.added > 0) score = scoreOrStop({ ...input, checks: seeded.checks })
	// Everything is built before anything is written: a body over the limit leaves every file as it was.
	const report = renderReport(score)
	const prBodyPath = values["pr-body"]
	const prBody =
		prBodyPath === undefined
			? undefined
			: renderPrBody(score, scaleNumbers(loadScaleInput(root, cacheDir, PILOT)), REPORT_PATH)
	const todo = values.todo === undefined ? undefined : todoItems(score, input.blocked)

	if (seeded !== undefined && seeded.added > 0)
		writeJsonAtomic(testFile(root, "pilot-checks.json"), seeded.checks)
	writeFileAtomic(join(root, REPORT_PATH), report)
	if (prBodyPath !== undefined && prBody !== undefined) writeFileAtomic(resolve(prBodyPath), prBody)
	if (values.todo !== undefined && todo !== undefined)
		writeJsonAtomic(resolve(values.todo), { blockedHosts: input.blockedHosts, items: todo })

	for (const r of score.rules)
		console.log(`Rule ${r.rule} (${r.status}): ${r.measured}. Target: ${r.target}.`)
	console.log(
		`Done when: disagreements ruled by me ${score.done.disagreementsRuled} of ${score.done.disagreements}, sampled fields checked by me ${score.done.sampleFieldsChecked} of ${score.done.sampleFields}, to check by hand ${score.done.checkByHand}`
	)
	if (seeded !== undefined) console.log(`Check-by-hand entries added to test/pilot-checks.json: ${seeded.added}`)
	if (todo !== undefined) console.log(`Items written to the todo file: ${todo.length}`)
	console.log(`Report written: ${REPORT_PATH}`)
	if (prBody !== undefined) console.log(`PR body summary written: ${prBody.length} characters`)
} catch (err) {
	const known = err instanceof ScoreLoadError || err instanceof PrBodyTooLongError
	console.error(known ? err.message : "score stopped on an unexpected error")
	process.exit(1)
}
```

- [ ] **Step 8: The npm script, the boundary list, and a smoke test**

In `pipeline/package.json`, add to `"scripts"` (keep any script an earlier task added):

```json
		"score": "node src/cli/score.ts",
```

In `pipeline/test/networkBoundary.test.ts`, test "scans the PR 3 folders and files", add `"src/cli/score.ts"` to the file list after `"src/cli/review.ts",`.

Smoke test, from `pipeline/`, against an empty temp cache so nothing real is read:

```bash
npm run score -- --help
npm run score -- --only 3405; echo "exit $?"
npm run score -- --only pilot --cache "$(mktemp -d)"; echo "exit $?"
```

Expected: the help text with the `--offline` line; then the usage error and `exit 2`; then `discover/report.json is missing: run discover first` and `exit 1`. `git status` shows no `docs/pilot/` file.

- [ ] **Step 9: Show it red once**

1. In `scaleNumbers`, change `estimateMs: h.requests * h.delayMs` to `estimateMs: h.requests`. Run `npx vitest run test/scale.test.ts`: FAIL on "estimates each host at its pace, slowest first, and flags one over 6 hours". Restore, run: PASS.
2. In `readDiscoveryFiles`, change `` `discover/${err.message}` `` to `"discover failed"`. Run `npx vitest run test/scoreLoad.test.ts`: FAIL on "says to run discover when the discover folder is missing". Restore, run: PASS.
3. In `todoItems`, delete `blocked.includes(d.kommune) || d.byHand || `. Run `npx vitest run test/todo.test.ts`: FAIL on "lists what waits for a check, never from a kommune that blocks ClaudeBot" (row 11 appears). Restore, run: PASS.
4. In `seedBlocked`, delete `d.proposed === undefined && `. Run `npx vitest run test/todo.test.ts`: FAIL on "adds one id-only check-by-hand entry per open field in a blocked kommune, once" (`again.added` is 1). Restore, run: PASS.
5. In `todoItems`, change `if (f.byHand || f.mine !== undefined) continue` to `if (f.mine !== undefined) continue`. Run `npx vitest run test/todo.test.ts`: FAIL on "leaves out a field whose page is on a blocked kommune's site, whatever the unit's kommune" (unit 41's phone appears). Restore, run: PASS.
6. In `loadPilotInput`, delete the `if (extraction === undefined) throw ...` lines and read `extraction?.pages ?? []`. Run `npx vitest run test/scoreLoad.test.ts`: FAIL on "stops on a missing extraction file and names it" (nothing thrown). Restore, run: PASS.
7. In `transientStops`, delete `&& TRANSIENT_KINDS.includes(kind)`. Run `npx vitest run test/scoreLoad.test.ts`: FAIL on "leaves out a lasting stop, a site that ran, and a run with no crawl report" (`["3405"]` for `visitTime`). Restore, run: PASS.

Note all seven for the PR body.

- [ ] **Step 10: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm run lint && npm test
git add src/score/scale.ts src/score/load.ts src/score/todo.ts src/cli/score.ts package.json test/scale.test.ts test/scoreLoad.test.ts test/todo.test.ts test/networkBoundary.test.ts
git commit -m "feat(pipeline): add npm run score with scale numbers, a todo list and check-by-hand seeding"
```

---

### Task 11: The name sweep

`npm run sweep -- --only pilot` reads the locks offline and prints every capitalised word left in values, roles and quotes that does not open a sentence and is not a word Varde knows, with its kommune, unit id, field and where it stands. It prints to my terminal only and writes no file (spec, "Privacy of the baseline").

Places come from the discover files when the cache has them, else from the curated files' `name`: verify copies each kommune's KLASS name there, and the curated files are committed beside the locks, so a fresh clone still knows its places. With neither, the sweep prints a note that kommune names are listed too.

`[navn]` needs no code of its own: the marker is lower case, so `midSentenceWords` never returns it, and the word after it still counts as mid-sentence. A test pins both.

`isKnownWord` must sit in `src/text/names.ts` beside the private `staticWord` and `fold`, and `src/text/` is one of `RULE_PATHS`, so this task sets a new `RULES_FINGERPRINT` (Decided 2) and keeps `RULES_VERSION` at 1, as Task 5 says for every change before the baseline. No lock is committed before Task 13, so nothing needs a re-run.

Never run `npm run sweep` on real lock files from an agent shell, and never paste its output into a Claude session. On `main` there are none; the smoke test below uses an empty selection anyway.

**Files:**
- Create: `pipeline/src/score/sweep.ts`, `pipeline/src/cli/sweep.ts`
- Modify: `pipeline/src/text/names.ts`, `pipeline/src/verify/rules.ts` (the new fingerprint), `pipeline/package.json`, `pipeline/test/networkBoundary.test.ts`
- Test: `pipeline/test/sweep.test.ts`

**Interfaces:**
- Consumes: `midSentenceWords`, the private `staticWord` and `fold` (`text/names.ts`); `LockFile`, `evidenceQuotes`; `CuratedFile`; `FIELD_NAMES`; `readJsonDir`; `readDiscovery`, `DiscoverError`; `parseOnly`, `selects` (Task 1); `RULES_VERSION`, `RULES_FINGERPRINT` (Task 5); `testInputs()`, `acceptedField`, `allGatesPass`, `T` (`test/helpers.ts`).
- Produces:
  - `text/names.ts`: `isKnownWord(word: string, places: readonly string[]): boolean`.
  - `score/sweep.ts`: `SweepLine = { kommune: string; unitId: string; field: string; where: "value" | "role" | "quote"; word: string }`, `sweepLocks(locks, places): SweepLine[]`, `formatSweep(lines): string`, `SWEEP_HEADER`, `SweepError`, `sweepPlaces(root, cacheDir): string[]`, `runSweep(root, cacheDir, only): string`.
  - `cli/sweep.ts`, npm script `sweep`: `npm run sweep -- [--only pilot] [--cache <dir>]`.

- [ ] **Step 1: Write the failing test**

Create `pipeline/test/sweep.test.ts`:

```ts
import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { describe, expect, it } from "vitest"
import { LockFile } from "../src/schema/lock.ts"
import { formatSweep, runSweep, SWEEP_HEADER, sweepLocks } from "../src/score/sweep.ts"
import { isKnownWord } from "../src/text/names.ts"
import { acceptedField, allGatesPass, T, testInputs } from "./helpers.ts"

const URL = "https://www.eksempel.kommune.no/helsestasjon/"
const ID = "org:999990001"

// A fictional lock: a name left in a phone quote, one after a [navn] marker, a sentence opener,
// a day, a role word and a place, and a dropped field.
const LOCK = LockFile.parse({
	kommune: "3405",
	inputs: testInputs(),
	units: [
		{
			unitId: ID,
			sources: [{ kind: "page", ref: URL }],
			fields: {
				name: acceptedField({
					value: "Eksempel Helsestasjon",
					sourceUrl: URL,
					evidence: { kind: "quote", quotes: ["Eksempel Helsestasjon"] },
				}),
				phone: acceptedField({
					sourceUrl: URL,
					role: "Avdelingsleder",
					evidence: {
						kind: "quote",
						quotes: [
							"Ring Kari Nordmann på 62 00 00 00, eller Kari på sms. Helsestasjonen er åpen.",
							"kontakt Avdelingsleder på 62 00 00 00",
						],
					},
				}),
				openingHours: acceptedField({
					value: "Åpent hver Mandag i Eksempelby",
					sourceUrl: URL,
					evidence: { kind: "quote", quotes: ["Åpent hver Mandag i Eksempelby"] },
				}),
				email: acceptedField({
					value: "post@eksempel.kommune.no",
					sourceUrl: URL,
					evidence: { kind: "quote", quotes: ["E-post til [navn] Nordmann: post@eksempel.kommune.no"] },
				}),
				phoneHours: {
					status: "dropped",
					sourceUrl: URL,
					fetchedAt: T,
					verifiedAt: T,
					gates: allGatesPass(),
					reason: "safety: person name left after redaction",
				},
			},
		},
	],
})

const line = (field: string, where: "value" | "role" | "quote", word: string) => ({
	kommune: "3405",
	unitId: ID,
	field,
	where,
	word,
})

describe("isKnownWord", () => {
	it("knows days, months, labels, roles and places, and not a name", () => {
		const places = ["Eksempelby", "Nord-Eksempel"]
		for (const word of ["Mandag", "Januar", "Telefonnummer", "Avdelingsleder", "Eksempelby", "Nord-Eksempel", "Eksempel"]) {
			expect(isKnownWord(word, places), word).toBe(true)
		}
		for (const word of ["Kari", "Nordmann", "Tor", "Helsestasjon"]) {
			expect(isKnownWord(word, places), word).toBe(false)
		}
	})
})

describe("sweepLocks", () => {
	it("lists each name left in a value or quote once, sorted, and nothing else", () => {
		expect(sweepLocks([LOCK], ["Eksempelby"])).toEqual([
			line("email", "quote", "Nordmann"),
			line("name", "quote", "Helsestasjon"),
			line("name", "value", "Helsestasjon"),
			line("phone", "quote", "Kari"),
			line("phone", "quote", "Nordmann"),
		])
	})

	it("lists a kommune name when it does not know the place", () => {
		expect(sweepLocks([LOCK], [])).toContainEqual(line("openingHours", "value", "Eksempelby"))
	})

	it("prints one line per word, then a count", () => {
		expect(formatSweep(sweepLocks([LOCK], ["Eksempelby"]))).toBe(
			[
				`3405 ${ID} email quote: Nordmann`,
				`3405 ${ID} name quote: Helsestasjon`,
				`3405 ${ID} name value: Helsestasjon`,
				`3405 ${ID} phone quote: Kari`,
				`3405 ${ID} phone quote: Nordmann`,
				"5 words to read.",
			].join("\n")
		)
	})
})

describe("runSweep", () => {
	const write = (path: string, value: unknown) => {
		mkdirSync(dirname(path), { recursive: true })
		writeFileSync(path, `${JSON.stringify(value, null, "\t")}\n`)
	}
	const files = (dir: string) => readdirSync(dir, { recursive: true }).map(String).sort()

	it("reads places from the curated files when there is no discover cache, and writes no file", () => {
		const root = mkdtempSync(join(tmpdir(), "varde-sweep-"))
		write(join(root, "data", "lock", "3405.json"), LOCK)
		write(join(root, "data", "curated", "3405-eksempelby.json"), { kommune: "3405", name: "Eksempelby", units: [] })
		const before = files(root)
		const out = runSweep(root, join(root, ".cache"), ["3405"])
		expect(files(root)).toEqual(before)
		expect(out.split("\n")[0]).toBe(SWEEP_HEADER)
		expect(out).not.toContain("Eksempelby")
		expect(out.endsWith("5 words to read.")).toBe(true)
	})

	it("says so when it has no place names", () => {
		const root = mkdtempSync(join(tmpdir(), "varde-sweep-"))
		write(join(root, "data", "lock", "3405.json"), LOCK)
		const out = runSweep(root, join(root, ".cache"), [])
		expect(out.split("\n")[1]).toBe(
			"No place names found (no discover files, no curated files), so kommune names are listed too."
		)
		expect(out).toContain(`3405 ${ID} openingHours value: Eksempelby`)
	})
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run test/sweep.test.ts`
Expected: FAIL, `Cannot find module '../src/score/sweep.ts'`, and `isKnownWord` is not exported from `../src/text/names.ts`.

- [ ] **Step 3: Add `isKnownWord` to `src/text/names.ts`**

Add after `const wordsOf = ...`:

```ts
// The folded place names and each of their parts: "Nord-Odal" gives "nord-odal", "nord" and "odal".
function placeWords(places: readonly string[]): Set<string> {
	const words = new Set<string>()
	for (const place of places) {
		words.add(fold(place))
		for (const part of place.split(/[\s-]+/)) words.add(fold(part))
	}
	return words
}
```

In `possibleNames`, replace its first five lines (the `const places = new Set<string>()` and the `for` loop that fills it) with:

```ts
	const places = placeWords(ctx.places)
```

Add after `staticWord`:

```ts
// A word Varde knows is no name: a day, month, label or role word, or a place (a kommune name or
// one of its parts). The name sweep lists every other capitalised word that does not open a
// sentence.
export function isKnownWord(word: string, places: readonly string[]): boolean {
	const folded = fold(word)
	return staticWord(folded) || placeWords(places).has(folded)
}
```

`possibleNames` behaves exactly as before; `npx vitest run test/names.test.ts` stays green.

- [ ] **Step 4: Write `src/score/sweep.ts`**

```ts
import { join } from "node:path"
import { DiscoverError } from "../discover/discover.ts"
import { readDiscovery } from "../discover/files.ts"
import { readJsonDir } from "../io/files.ts"
import { selects } from "../pilot/list.ts"
import { FIELD_NAMES } from "../schema/common.ts"
import { CuratedFile } from "../schema/curated.ts"
import { evidenceQuotes, LockFile } from "../schema/lock.ts"
import { isKnownWord, midSentenceWords } from "../text/names.ts"

export const SWEEP_HEADER = "Read this list yourself. Do not paste it into an AI session."

export type SweepLine = {
	kommune: string
	unitId: string
	field: string
	where: "value" | "role" | "quote"
	word: string
}

export class SweepError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "SweepError"
	}
}

const compare = (a: string, b: string) => {
	if (a < b) return -1
	return a > b ? 1 : 0
}

// Every capitalised word left in a field's value, role and quotes that does not open a sentence
// and is not a word Varde knows, once per kommune, unit, field, place and word. A dropped field
// holds no text. The "[navn]" marker is lower case, so it is never a word here, and the word
// after it still counts as mid-sentence.
export function sweepLocks(locks: readonly LockFile[], places: readonly string[]): SweepLine[] {
	const lines = new Map<string, SweepLine>()
	for (const lock of locks) {
		for (const unit of lock.units) {
			for (const field of FIELD_NAMES) {
				const f = unit.fields[field]
				if (f === undefined || f.status === "dropped") continue
				const texts: [SweepLine["where"], string][] = []
				if (typeof f.value === "string") texts.push(["value", f.value])
				if (f.role !== undefined) texts.push(["role", f.role])
				for (const q of f.evidence === undefined ? [] : evidenceQuotes(f.evidence)) texts.push(["quote", q])
				for (const [where, text] of texts) {
					for (const word of midSentenceWords(text)) {
						if (isKnownWord(word, places)) continue
						const line = { kommune: lock.kommune, unitId: unit.unitId, field, where, word }
						lines.set([lock.kommune, unit.unitId, field, where, word].join("\u0000"), line)
					}
				}
			}
		}
	}
	return [...lines.values()].sort(
		(a, b) =>
			compare(a.kommune, b.kommune) ||
			compare(a.unitId, b.unitId) ||
			compare(a.field, b.field) ||
			compare(a.where, b.where) ||
			compare(a.word, b.word)
	)
}

export function formatSweep(lines: readonly SweepLine[]): string {
	return [
		...lines.map((l) => `${l.kommune} ${l.unitId} ${l.field} ${l.where}: ${l.word}`),
		`${lines.length} words to read.`,
	].join("\n")
}

function readLocks(root: string, only: readonly string[]): LockFile[] {
	return readJsonDir(join(root, "data", "lock")).flatMap((f) => {
		const parsed = LockFile.safeParse(f.data)
		if (!f.valid || !parsed.success)
			throw new SweepError(`data/lock/${f.file} does not match its schema: run npm run data:check`)
		return selects(only, parsed.data.kommune) ? [parsed.data] : []
	})
}

// Place names from discover's files when the cache has them; else from the curated files, which
// hold each kommune's KLASS name and are committed beside the locks.
export function sweepPlaces(root: string, cacheDir: string): string[] {
	try {
		return readDiscovery(join(cacheDir, "discover")).kommuner.map((k) => k.name)
	} catch (err) {
		if (!(err instanceof DiscoverError)) throw err
	}
	return readJsonDir(join(root, "data", "curated")).flatMap((f) => {
		const parsed = CuratedFile.safeParse(f.data)
		return parsed.success ? [parsed.data.name] : []
	})
}

// What the sweep command prints. It reads only, and returns the text: no file is written.
export function runSweep(root: string, cacheDir: string, only: readonly string[]): string {
	const places = sweepPlaces(root, cacheDir)
	const note =
		places.length === 0
			? ["No place names found (no discover files, no curated files), so kommune names are listed too."]
			: []
	return [SWEEP_HEADER, ...note, formatSweep(sweepLocks(readLocks(root, only), places))].join("\n")
}
```

- [ ] **Step 5: Write `src/cli/sweep.ts`**

```ts
// Lists every capitalised word left in the lock files' values, roles and quotes that does not
// open a sentence and is not a word Varde knows, so I can read them before a commit. It prints to
// my terminal only and writes no file. I run it in Windows Terminal, outside any AI tool.
//   node src/cli/sweep.ts [--only pilot|3405,0301] [--cache <dir>]
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"
import { DEFAULT_CACHE_DIR } from "../io/pageCache.ts"
import { parseOnly } from "../pilot/list.ts"
import { runSweep, SweepError } from "../score/sweep.ts"

const USAGE = "usage: sweep [--only pilot|3405,0301] [--cache <dir>]"

const { values } = parseArgs({
	options: { only: { type: "string" }, cache: { type: "string" } },
})
const only = parseOnly(values.only)
if (only === undefined) {
	console.error(USAGE)
	process.exit(2)
}

const root = fileURLToPath(new URL("../../../", import.meta.url))
try {
	console.log(runSweep(root, values.cache ?? DEFAULT_CACHE_DIR, only))
} catch (err) {
	console.error(err instanceof SweepError ? err.message : "sweep stopped on an unexpected error")
	process.exit(1)
}
```

- [ ] **Step 6: Run the tests to see them pass, then bump the rules version**

Run: `npx vitest run test/sweep.test.ts test/names.test.ts`
Expected: PASS.

Run: `npm test`
Expected: FAIL in Task 5's fingerprint test (`test/rules.test.ts`), because `src/text/names.ts` changed. In `src/verify/rules.ts`, set `RULES_FINGERPRINT` to the value the test's message names and leave `RULES_VERSION` at 1 (the message says to bump both; before the baseline only the fingerprint moves, see Task 5 Step 9). Run `npm test` again.
Expected: PASS.

- [ ] **Step 7: The npm script, the boundary list, and a smoke test**

In `pipeline/package.json`, add to `"scripts"` (keep any script an earlier task added):

```json
		"sweep": "node src/cli/sweep.ts",
```

In `pipeline/test/networkBoundary.test.ts`, test "scans the PR 3 folders and files", add `"src/cli/sweep.ts"` to the file list after `"src/cli/review.ts",`.

Smoke test, from `pipeline/`, with a selection that matches no kommune and an empty cache:

```bash
npm run sweep -- --only 99 --cache "$(mktemp -d)"; echo "exit $?"
npm run sweep -- --only x; echo "exit $?"
git status --short
```

Expected: the header line, then `0 words to read.` (with the "No place names found" note only if `data/curated/` is empty on this branch) and `exit 0`; then the usage line and `exit 2`; `git status` shows only the files this task changed.

- [ ] **Step 8: Show it red once**

1. In `isKnownWord`, change `return staticWord(folded) || placeWords(places).has(folded)` to `return staticWord(folded)`. Run `npx vitest run test/sweep.test.ts`: FAIL on "lists each name left in a value or quote once, sorted, and nothing else" (`Eksempelby` is listed). Restore, run: PASS.
2. In `sweepLocks`, delete the line `if (isKnownWord(word, places)) continue`. Run `npx vitest run test/sweep.test.ts`: FAIL on "lists each name left in a value or quote once, sorted, and nothing else" (`Mandag`, `Avdelingsleder` and `Eksempelby` are listed). Restore, run: PASS.
3. In `runSweep`, add `writeFileSync(join(root, "sweep.txt"), "")` (with its import) before the `return`. Run `npx vitest run test/sweep.test.ts`: FAIL on "reads places from the curated files when there is no discover cache, and writes no file". Restore, run: PASS.

Note all three for the PR body.

- [ ] **Step 9: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm run lint && npm test
git add src/text/names.ts src/verify/rules.ts src/score/sweep.ts src/cli/sweep.ts package.json test/sweep.test.ts test/networkBoundary.test.ts
git commit -m "feat(pipeline): add npm run sweep to list capitalised words left in the locks"
```

### Task 12: Docs: the pilot run, sources and licences, the notice

**Files:**
- Modify: `pipeline/README.md` (intro paragraph, `## Commands`, the `--data` paragraph; new `## Pilot run`)
- Modify: `data/README.md` (new `## Sources and licences` and `## Personal data (Art. 14 notice)`)
- Modify: `pipeline/test/networkBoundary.test.ts` (the "scans the PR 3 folders and files" test)
- Modify: `docs/superpowers/specs/2026-10-28-varde-national-data-design.md` (the Våler line in "### Who reads the live pages")

**Interfaces:**
- Consumes: every command and flag from Tasks 1 to 11: `--only pilot`, `fetch --resume`, `extract --offline`, `verify --resume`, `verify --offline`, `data:check --publish`, `score` (`--pr-body`, `--todo`, `--seed-blocked`, `--offline`), `sweep`.
- Produces: nothing code reads.

- [ ] **Step 1: Extend the network boundary test's scan list**

In `pipeline/test/networkBoundary.test.ts`, rename the test "scans the PR 3 folders and files" to "scans the PR 3 and PR 4 folders and files", add `"src/pilot/"` to the folder list (Task 8 added `"src/score/"`), and add these to the file list:

```ts
			"src/io/addressCache.ts",
			"src/io/runLock.ts",
			"src/io/offline.ts",
			"src/io/timings.ts",
			"src/verify/resume.ts",
			"src/verify/failed.ts",
			"src/verify/rules.ts",
			"src/fetch/progress.ts",
```

- [ ] **Step 2: Run it**

Run: `npx vitest run test/networkBoundary.test.ts`
Expected: PASS (every file exists after Tasks 1 to 11). Shown red once: add `"src/score/missing.ts"` to the list, run, see `expected [...] to include 'src/score/missing.ts'`, remove it.

- [ ] **Step 3: Update `pipeline/README.md`**

Replace the intro's last two sentences ("Nothing here writes to the repo's `data/` yet; PR 4 commits the pilot's lock files.") with:

```markdown
PR 4 added the pilot run: one full run over Oslo and the 46 Innlandet kommuner, committed as a
scored baseline in `data/` and `docs/pilot/pilot-report.md`. Nothing in `data/` reaches the
site until spec B's publish step, and `data:check --publish` refuses while
`test/known-wrong.json` lists a value.
```

In the `## Commands` block, replace the discover, fetch, extract and verify lines and add the new ones, so the block reads:

```bash
npm ci
npm test              # unit, gate, stage and golden tests; none touches the network
npm run typecheck
npm run data:check    # validates every file in data/; add -- --publish before a publish
npm run schema        # rewrites schema/*.schema.json after a schema change
npm run discover -- --only pilot        # Oslo and Innlandet (or --only 34,0301): units and pages, no page text
npm run fetch -- --only pilot           # pages discover listed, into the cache; --resume after a stop
npm run extract -- --only pilot         # field values with their quotes, into the cache
npm run verify -- --data ../data --only pilot --nklm-fetch   # the five gates, lock and curated files
npm run review -- --data ../data        # my answers, one item at a time, in a terminal
npm run score -- --only pilot           # the pass mark and docs/pilot/pilot-report.md
npm run sweep -- --only pilot           # capitalised words left in the locks, for me to read
npm run recall-report > ../.cache/recall-report.md  # discover's output against the 138-row answer key
```

Replace the sentence "Until PR 4, `verify` refuses the repo's own `data/` and every folder inside it." with:

```markdown
The pilot writes to the repo's own `data/` (`--data ../data`).
```

Append after that paragraph:

```markdown
`discover`, `fetch`, `extract` and `verify` each hold `<cache>/pages/run.lock` while they run, so two of
them never share a cache. A lock left by a process that is gone is taken over. Each prints a
line when a kommune is done, with a running count, and `fetch` prints a line about every five
minutes. `fetch --resume` skips a page the same run already fetched and any page under 24 hours
old. `verify --resume` skips a kommune only when its lock's `inputs` (the hashes of its
extraction file, the national extraction file and its curated file, the NKLM edition and
`RULES_VERSION`) all match. A change to a gate or a field rule bumps `RULES_VERSION` in
`src/verify/rules.ts`; `test/rules.test.ts` fails until it is bumped. `extract --offline` and
`verify --offline` fetch nothing and let nothing expire: a page or a Kartverket answer missing
from the cache stops the kommune and names what it missed. Gap PRs score this way, so a rule
change is never mixed with changes on the source pages.

Kartverket's address API gets its own pace, one request a second, and its answers are cached
for 30 days in `<cache>/kartverket/`, each file named by a hash of its search. The 90-day purge
in `fetch` clears them with the pages.
```

Add a new section before `## Review`:

````markdown
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
   npm run fetch -- --only pilot
   npm run extract -- --only pilot
   npm run verify -- --data ../data --only pilot --nklm-fetch
   npm run score -- --only pilot --pr-body ../.cache/pr-body.md
   ```

   If `score` refuses because a kommune failed on a timeout, a network error or a server
   error, run `npm run fetch -- --only pilot --resume`, then extract, `verify --resume` and
   score again.
4. `npm run score -- --only pilot --seed-blocked` writes "check by hand" entries for the seven
   kommuner that block ClaudeBot. I check those pages myself in a browser.
5. `npm run score -- --only pilot --todo ../.cache/pilot-todo.json` lists the other open
   checks, without the seven kommuner or any page on their sites. A fresh Claude session reads only that file and the
   live pages, and writes its proposals into `test/pilot-checks.json` with `by: "proposed"`.
   I rule on each and set `by: "me"`; every "pipeline wrong" ruling also goes into
   `test/known-wrong.json`.
6. `npm run sweep -- --only pilot` in a terminal outside any AI tool. I read the list myself and never
   paste it into an AI session. A real name means a redaction fix, a test fixture and a new
   `verify`, never a hand edit of a lock.
7. `npm run score -- --only pilot --pr-body ../.cache/pr-body.md` once more, then commit
   `data/lock/`, `data/curated/`, `docs/pilot/pilot-report.md`, `test/known-wrong.json`,
   `test/pilot-checks.json` and `test/answer-key.json` if the freeze changed it.

Gap PRs re-run `extract --offline`, `verify --offline --resume` and `score` from the local
caches, which takes minutes. The report states the date of the oldest page behind the locks,
so a re-baseline after the 90-day purge shows as one.
````

- [ ] **Step 4: Confirm each licence and its credit line from the source**

Read each source's own terms page in a browser (they are public docs, not kommune pages) and note the licence and the credit wording it asks for. Write "confirm" in the table for any line I could not read. Expected, to be checked, not copied:

| Source | Licence in `src/sources/registers.ts` or `hosts.ts` | Where to read it |
|---|---|---|
| Brønnøysundregistrene (Enhetsregisteret) | `nlod` | data.brreg.no API documentation, licence section |
| Kartverket (address API) | `ccBy` | api.kartverket.no or kartverket.no terms for the address API |
| SSB KLASS | `ccBy` | ssb.no KLASS API documentation |
| Nav (office pages) | `ownPage` | `docs/licence-requests/README.md`: yes on 06.11.2026, no licence named |
| NKLM (NORCE) legevakt list | `granted` | `docs/licence-requests/README.md`: credit line «Oversikt over legevakter i Norge, NKLM (NORCE), per 01.01.2026» |
| The kommuner's and providers' own pages | `ownPage` | each lock value carries its own source URL |

- [ ] **Step 5: Ask me for the controller's name and the removal contact**

The notice names who is responsible (the controller), and it needs a way to ask for removal that does not publish the number again (an open GitHub issue would). Ask me which name and which address go in. Recommend `malinfossum.dev@proton.me` for the address, the address already public in every commit. Use the name and the address I give.

- [ ] **Step 6: Update `data/README.md`**

Replace the paragraph "A dropped value keeps only its reason and source URL. No person's name is ever stored. Raw pages live in `.cache/`, which is never committed." with the same text plus the sentence "The first files here are the pilot run's baseline (PR 4, see `docs/pilot/pilot-report.md`); they are scored, not published." Then append:

```markdown
## Sources and licences

| Source | What the locks take from it | Licence | Credit |
|---|---|---|---|
| Brønnøysundregistrene, Enhetsregisteret | units, org numbers, the kommune's switchboard number | <from Step 4> | <from Step 4> |
| Kartverket, address API | address ids and street names | <from Step 4> | <from Step 4> |
| Statistisk sentralbyrå, KLASS | kommune numbers and names | <from Step 4> | <from Step 4> |
| Nav, office pages on nav.no | Nav offices' contact details | Nav's own pages; permission 06.11.2026, no licence named | Nav |
| NKLM (NORCE), legevakt list | legevakt phone and address, as cross-checks | permission 05.11.2026 for the file dated 01.01.2026 | Oversikt over legevakter i Norge, NKLM (NORCE), per 01.01.2026 |
| The kommuner's and providers' own pages | contact details, hours, costs, with a verbatim quote | none named: facts carry no copyright, and the short quotes are kept as evidence with the source named (quotation right, åndsverkloven § 29; confirm) | the source URL beside each value |

Permissions and requests: `docs/licence-requests/README.md`.

## Personal data (Art. 14 notice)

The lock files, and the pilot report that quotes them, hold one kind of personal data: a phone
number that a kommune publishes as a unit's contact, when it belongs to a manager. It is stored with the person's role
("avdelingsleder"), never with their name. Names on the source pages are redacted from every
stored quote before a file is written, and I read a list of the capitalised words left before
each commit. A rule can still miss a name; if you find one, write to me and I remove it.

- **Who is responsible:** <name from Step 5>, a private person who runs Varde as a free,
  non-commercial directory. Contact: <address from Step 5>.
- **Why:** so people can reach a service that helps them. The number is the one the kommune
  itself gives for that purpose.
- **Legal basis:** legitimate interest (GDPR Art. 6(1)(f)). People need to reach the service,
  and the number is one the kommune already publishes for that purpose.
- **Where it comes from:** the kommune's own public page, named by the source URL beside the
  value.
- **How long:** as long as the kommune publishes it. Each run replaces the files, so a number
  the kommune takes down leaves the current files at the next run.
- **Who can see it:** anyone. The repository is public on GitHub.
- **Your rights:** you can ask to see, correct or erase the data, and you can object to it
  (GDPR Art. 21). You can also complain to Datatilsynet.
- **Removal:** write to <address from Step 5>. I take the value out of the current files and
  out of every later run. Older commits keep it unless the repository's history is
  rewritten, which I do on request.
```

Fill every `<from Step 4>` cell with what Step 4 found, or "confirm" where the source could not be read, `<name from Step 5>` with the name I gave and `<address from Step 5>` with the address I gave. No angle-bracket marker may remain: run `grep -n "<from Step\|<address from\|<name from" data/README.md` and expect no output.

- [ ] **Step 7: Settle the Våler line in the spec**

In `docs/superpowers/specs/2026-10-28-varde-national-data-design.md`, "### Who reads the live pages", replace "(The list above names Våler without a number; the plan confirms from robots.txt that it is Innlandet's 3419.)" with "(Våler is Innlandet's 3419: checked 13.11.2026, `www.vaaler-he.kommune.no` disallows ClaudeBot, and Østfold's Våler, 3114, does not.)" This edit goes on the branch `docs/national-data-spec`, not on `feat/pipeline-pilot`.

- [ ] **Step 8: Check and commit**

Run from `pipeline/`: `npx biome check --write .`, `npx biome ci .`, `npm run typecheck`, `npm run lint`, `npm test`. Expected: all pass.

```bash
git add README.md ../data/README.md test/networkBoundary.test.ts
git commit -m "docs(pipeline): document the pilot run, sources and licences, and the data notice"
```

And on `docs/national-data-spec` (its worktree `pr4-spec`):

```bash
git add docs/superpowers/specs/2026-10-28-varde-national-data-design.md
git commit -m "docs(spec): record that Våler in the ClaudeBot list is 3419"
```

### Task 13: Full suites, the pilot run, the checks, the baseline PR

This task is the run itself. The controller drives the commands in a Terminal tab I can see (`run_in_terminal`, cwd `pipeline/` of the `feat/pipeline-pilot` worktree), never in an agent's own shell, and reads only what the stages print (counts, kommune numbers and names, hosts, reasons). Two outputs are never read by any Claude session: `docs/pilot/pilot-report.md` (it quotes lock text from the seven kommuner that block ClaudeBot) and the sweep. The controller reads the PR-body summary only after checking it holds no quote (parts 3 to 7 are counts there).

**Files:**
- Create: `data/lock/*.json` (47), `data/curated/*.json`, `docs/pilot/pilot-report.md`
- Modify: `pipeline/test/known-wrong.json`, `pipeline/test/pilot-checks.json`, `pipeline/test/answer-key.json` (only if the freeze changed it)

**Interfaces:**
- Consumes: every command from Tasks 1 to 12.
- Produces: the baseline, and the PR.

- [ ] **Step 1: Full suites before the run**

From `pipeline/`: `npx biome ci .`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run data:check`. From `web/`: `npm ci`, `cp e2e/fixtures/data/*.json public/data/`, `npm test`, `npx playwright install chromium`, `npm run e2e` (the full suite). Expected: all green. A red suite stops the task.

- [ ] **Step 2: Freeze the key**

```bash
mkdir -p ../.cache/live-data
for f in resources.nb.json resources.en.json municipalities.json; do curl -sf "https://varde.pages.dev/data/$f" -o "../.cache/live-data/$f"; done
date +"%Y-%m-%d %A"
npm run key:freeze -- ../.cache/live-data <today's date from the line above>
git diff --stat test/answer-key.json
```

Expected: `answer key: <n> rows, frozen on <today>`. If the diff is more than the date line, run `npm test` (the golden test reads it) and commit it alone: `git add test/answer-key.json && git commit -m "chore(pipeline): freeze the answer key before the pilot run"`.

- [ ] **Step 3: Keep the PC awake and start the run**

Ask the app to keep the PC awake for the run (`mcp__ccd_host__request_keep_awake`), and tell me the Terminal tab's link. Then, one at a time in that tab, each waiting for the one before:

```bash
npm run discover -- --only pilot
npm run fetch -- --only pilot
```

Expected: progress lines per kommune ("fetch: 3405 Lillehammer done (12 of 47)") and a heartbeat about every five minutes. If the run is stopped (Ctrl+C, a sleep, a crash), continue with `npm run fetch -- --only pilot --resume`.

- [ ] **Step 4: Extract and verify**

```bash
npm run extract -- --only pilot
npm run verify -- --data ../data --only pilot --nklm-fetch
```

Expected: a done line per kommune, the verify summary, the Kartverket lookups and cache hits, and every pilot kommune with a lock file: `ls ../data/lock | wc -l` gives `47`.

- [ ] **Step 5: First score**

```bash
npm run score -- --only pilot --pr-body ../.cache/pr-body.md
```

If it refuses on a transient failure, it names the kommuner: run `npm run fetch -- --only pilot --resume`, `npm run extract -- --only pilot`, `npm run verify -- --data ../data --only pilot --resume`, and score again. If it refuses for a missing lock, find out why from the verify output and fix the cause before going on. Expected at the end: the pass-mark lines printed (rule 5 "waiting" until the sample is checked) and `docs/pilot/pilot-report.md` written.

Run Step 9 (the name sweep) here, before any check is written: a redaction fix re-runs verify, and changed locks would make every check after it stale.

- [ ] **Step 6: Seed the blocked kommuner and write the todo list**

```bash
npm run score -- --only pilot --seed-blocked
npm run score -- --only pilot --todo ../.cache/pilot-todo.json
```

Expected: two counts. Tell me the number of "check by hand" entries and the time it implies.

- [ ] **Step 7: The checks session**

Start this session only after I have read the sweep (Step 5) and settled any name it found: the todo file carries lock quotes, so no AI session reads them before I do.

Start a fresh Claude session (`start_session`, "fresh", `use_worktree: false` in the pilot worktree) with this brief: read `.cache/pilot-todo.json` only (never `docs/pilot/pilot-report.md`, never `data/lock/`, never `.cache/pages/` or `.cache/extract/`); never open a URL whose host is in the file's `blockedHosts`, and stop at any redirect or link to one (write that item as "unclear" with the note "check by hand"); for each item open its `sourceUrl` live and decide "key stale", "pipeline wrong", "unclear" or (for a sample) "right"; read `pipeline/test/pilot-checks.json` first, keep every entry in it, and only add: one entry per item with `by: "proposed"` and a note under 300 characters that holds no person's name; touch no other file; commit nothing. When it reports, check `git diff --stat` shows only `pipeline/test/pilot-checks.json`.

- [ ] **Step 8: My rulings**

I go through `test/pilot-checks.json`: I set each entry to `by: "me"`, keeping or changing the ruling, and check the "check by hand" ones in my own browser. For each "pipeline wrong" ruling of mine, add its entry to `test/known-wrong.json` (`kind`, `keyId` for a disagreement, `unitId`, `field`). For each "key stale" ruling, note the row for a live-data PR after this one. Then:

```bash
npm test
npm run score -- --only pilot --pr-body ../.cache/pr-body.md
```

Expected: the golden test passes (every wrong value listed or ruled key stale or right by me, every listing still occurring, the two files agree), and score no longer reports open checks. "Done when" in the PR body counts only `by: "me"`.

- [ ] **Step 9: The name sweep again (mine), only if a lock changed since Step 5**

I run `npm run sweep -- --only pilot` in Windows Terminal, outside the Claude app, so no session's `read_terminal` can reach it, and read it. If I find a real name: stop, write a redaction fix with a fictional test fixture as its own commit (the fix moves `RULES_FINGERPRINT`, and `RULES_VERSION` goes to 2), then re-run `npm run verify -- --data ../data --only pilot` without `--resume` (expect 47 verified, 0 skipped), score and sweep again. Then run `--seed-blocked` and `--todo` again (Step 6) and repeat Steps 7 and 8 for any new item.

- [ ] **Step 10: Check and commit the baseline**

```bash
npm run data:check
npm run data:check -- --publish
```

Expected: the first passes; the second fails while `test/known-wrong.json` has entries (that is the guard working; with an empty list it passes).

A write stopped halfway can leave a `<file>.<pid>.tmp` beside a lock or curated file (Decided 13), so I stage the JSON files only:

```bash
git add ../data/lock/*.json ../data/curated/*.json ../docs/pilot/pilot-report.md test/known-wrong.json test/pilot-checks.json
git status --short ../data
git commit -m "feat(data): commit the pilot run as a scored baseline"
```

Expected before the commit: `git status --short ../data` lists no `.tmp` file. If one shows, delete it (it is a leftover, never data) and check again.

- [ ] **Step 11: Full suites again, then the PR**

Before opening the PR, confirm that no AI reviewer runs on this repo's PRs: Copilot code review in the repo settings and rulesets, and no installed app that reviews PRs. The diff holds the seven kommuner's quotes. If one runs, stop and ask me.

Repeat Step 1. Then open the PR from `feat/pipeline-pilot` to `main`, title "feat(pipeline): pilot run over Oslo and Innlandet, scored baseline". Its body: `.cache/pr-body.md` (the report summary and the scale numbers), then the stage durations, then the "shown red once" list from every task (each break and its red result), then "Done when" with each item ticked only when true: every test passes; the summary is in the body; every disagreement has my ruling; every sampled field has my check; I read the name sweep before the commit. Check the body's size: `wc -c` under 60,000. Bind the PR with the ccd_pr tools and leave the merge to me.

> Stress-tested 2026-11-13 (skill a06dd56), Tasks 1-6 and Tasks 7-13 by two fresh reviewers: 19 applied, 6 adapted, 3 decided by me (B11 keyIsWrong, C6 no-hit address cut at the first comma, A7 score refuses an own-host transient stop).
