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
- **Never print cached page text, extraction files, or lock quotes and values, for any host, from an AI agent's shell.** The implementer is an AI agent: anything it prints is sent to Anthropic. Checks print counts, lengths, kommune numbers and reasons. The pilot run itself happens in my visible Terminal tab, never in an agent's shell.
- **Logs are public in Actions** (PR 5 runs these stages there). Commands print counts, kommune numbers, KLASS kommune names, hosts and reasons. Never page text, quotes, unit names, org numbers, phone numbers, emails or URLs. Exceptions, both local only: an `--offline` cache miss names the URL or the search it missed (the spec asks for it), and `sweep` prints words from the locks to my terminal.
- **Fail closed.** Each lock, curated, extraction and report file is written whole (`writeJsonAtomic`, `writeFileAtomic`, `writeLockFile`); a stop never leaves half a file.
- **Linear-time patterns only.** No nested or overlapping quantifiers on text from pages or locks.
- **Deterministic report.** `docs/pilot/pilot-report.md` holds no clock time, no durations, no machine path and no cache-dependent number. The same locks, curated files, key and checks give the same bytes, with `\n` line ends.
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

Choices the spec leaves open, or where the code on `main` forced a shape. Each line has its reason. Lines 1, 2, 5 and 6 go further than the spec's text; I approve them at plan review or they change.

1. **A lock's `inputs` hold more than the spec names:** `{ extraction, national?, curated?, nklm?, rules }`: the sha256 of the kommune's extraction file, of the national extraction file, of the curated file as verify wrote it, the NKLM edition date, and `RULES_VERSION`. Verify reads all of them, so a resume that skipped on the spec's two alone would keep stale locks after a review session (Review Focus 2), a new Nav extraction or a new NKLM edition. Every extra input only makes resume skip less.
2. **`RULES_VERSION` has a fingerprint** (`RULES_FINGERPRINT`, sha256 over `src/gates/`, `src/verify/`, `src/curate/`, `src/text/` and `src/registers/kartverket.ts`, with `\r\n` read as `\n`). A test fails while the two do not match, and its message says to bump both. Reason: Review Focus 3. A formatting-only change also asks for a bump; that costs one full verify of the local caches, a few minutes.
3. **The failed kinds are the crawler's `HostStop` kinds plus `robots` and `noPages`.** Transient, as the spec lists them: `timeout`, `network`, `serverError`. Every other kind is lasting and scored as lost recall, `visitTime` and `secondTooMany` included, since the spec names only those three as what a sleeping PC causes. The kind comes from the merged crawl report: the kommune's own site host's stop first, then the first stopped host among its pages' hosts, then `robots` when every page was refused by robots.txt, else `noPages`.
4. **A kommune "came through" when its extraction file holds at least one page.** `extract` already writes a file for every kommune it is asked for (an empty `pages` list when nothing is cached); Task 6 pins that with a test. Verify writes the `failed` lock when that list is empty.
5. **The sample ranks by hash, not by shuffle.** Each candidate unit gets `sha256("<SAMPLE_SEED>:<kommune>:<unitId>")`, and the 20 lowest are drawn. Same locks, same sample, as the spec asks. A gap PR that adds or drops a few units changes the sample only at its margin, so fewer rows wait for a new check. A candidate is a unit in one of the 39 kommuner outside the key, not waiting for its inclusion answer, with at least one accepted field.
6. **One sample check per accepted field** of each sampled unit (`kind: "sample"`, `unitId`, `field`), so a wrong value can name its field in `known-wrong.json`. About 20 units times 5 to 7 fields.
7. **`score --offline` is accepted and changes nothing,** because `score` never fetches and never purges. The "oldest cached page" date in the report is the oldest `fetchedAt` in the committed locks, which keeps the report deterministic and readable in CI. `extract --offline` and `verify --offline` carry the spec's rule (nothing expires, nothing is fetched, a miss is an error that names it).
8. **A key row counts as found when a lock unit's name matches it in any status but dropped** (accepted or review), or by address and phone as today. The spec counts a unit waiting for its inclusion answer as found; a name in review is the same kind of "found, not settled". Rule 1 (wrong values) still compares accepted values only. `matchKeyRow` gains an option for this; the golden test keeps the accepted-only form.
9. **The report's sanitiser is new code, reused later.** No PR-body renderer exists yet (PR 5 publishes). `src/score/markdown.ts` holds `codeSpan`, `codeBlock` and `cellText`; PR 5's review PR body uses the same module.
10. **The place-part rule is read literally: the place part is the text after the address's first comma.** "Storgata 1, 2. etasje, 2609 Lillehammer" therefore goes to review ("place part does not match Kartverket"). The report's part 3 counts it, and a gap PR can widen the rule with a measured reason. A Kartverket answer with no `poststed` sends the field to review too.
11. **The Kartverket cache is used by verify only.** `review` keeps its live lookup, now at the new 1-second pace: a value I type should be checked against today's register.
12. **Stage timings and scale numbers live in the cache, not the report.** Each stage CLI appends its duration to `<cache>/timings.json`; verify writes its Kartverket counts to `<cache>/verify-stats.json`; the crawler's report gains each host's crawl delay. `score --pr-body` reads them for the PR body's scale block.
13. **`verify` may now write to the repo's `data/`.** The PR 3 guard (`isRepoData`) is removed from the verify CLI; `isRepoData` stays exported for its tests until a later clean-up. `--data` stays required, so a run always names its target.

## Left for later plans

- Every gap fix the baseline shows, one gap per PR (spec decision 1).
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
    verify/rules.ts          NEW  RULES_VERSION, RULES_FINGERPRINT, RULE_DIRS
    verify/resume.ts         NEW  lockInputs, canSkip
    verify/failed.ts         NEW  failedKind, failedLock, TRANSIENT_KINDS
    net/types.ts             MOD  PACE_MS
    net/crawler.ts           MOD  per-server pace floor; HostLine.delayMs
    io/pageCache.ts          MOD  manifest.jsonl journal, runId on entries
    io/addressCache.ts       NEW  AddressCache (30-day, hashed file names, offline)
    io/runLock.ts            NEW  holdCache, CacheBusyError
    io/offline.ts            NEW  OfflineMissError, offlineGet
    io/timings.ts            NEW  recordTiming, readTimings
    fetch/fetchPages.ts      MOD  onPage callback; resumeFilter; mergeCrawlReports
    fetch/progress.ts        NEW  KommuneProgress
    schema/lock.ts           MOD  LockInputs, FAILED_KINDS, LockFailure, LockFile.inputs, LockFile.failed
    check/dataCheck.ts       MOD  checkData(root, { publish })
    answerKey/score.ts       MOD  matchKeyRow option { anyStatus }
    score/checks.ts          NEW  PilotChecks, KnownWrong, readers, ratchet, checksAgree
    score/sample.ts          NEW  SAMPLE_SEED, SAMPLE_SIZE, drawSample
    score/pilot.ts           NEW  scorePilot, ScoreRefusal, PilotScore
    score/markdown.ts        NEW  codeSpan, codeBlock, cellText
    score/render.ts          NEW  renderReport, renderPrBody, PR_BODY_LIMIT
    score/scale.ts           NEW  ScaleNumbers, scaleNumbers
    score/sweep.ts           NEW  sweepLocks, formatSweep
    text/names.ts            MOD  export isKnownWord
  schema/lock.schema.json    MOD  regenerated (npm run schema)
  test/
    known-wrong.json         NEW  { "entries": [] }
    pilot-checks.json        NEW  { "checks": [] }
    golden.test.ts           MOD  the ratchet
    pilotList.test.ts, placePart.test.ts, addressCache.test.ts, pace.test.ts, journal.test.ts,
    resumeFetch.test.ts, runLock.test.ts, lockInputs.test.ts, rules.test.ts, resumeVerify.test.ts,
    failed.test.ts, offline.test.ts, checks.test.ts, publish.test.ts, sample.test.ts,
    pilotScore.test.ts, markdown.test.ts, report.test.ts, scale.test.ts, sweep.test.ts   NEW
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
// src/gates/types.ts (Task 2)
export type AddressHit = { addressId: string; kommune: string; text?: string; postcode?: string; poststed?: string }

// src/text/address.ts (Task 2)
export const PLACE_MISMATCH = "place part does not match Kartverket"
export function placePart(value: string, postcode: string | undefined, poststed: string | undefined): { place: string } | { review: string } | undefined
// undefined: the value has no comma (nothing to keep); place: ", <postcode> <page spelling>"
// src/verify/context.ts (Task 2)
export function kartverketForm(value: string, hit: AddressHit): { value: string; review?: string }

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
// src/net/types.ts (Task 3)
export const PACE_MS: Readonly<Record<string, number>>                  // { "kartverket.no": 1_000 }, keyed by registrable domain
// src/net/crawler.ts (Tasks 3, 4)
export type HostLine = { host: string; requests: number; delayMs: number; stopped?: HostStop }

// src/io/pageCache.ts (Task 4)
export const ManifestEntry  // gains runId: z.string().regex(/^[0-9a-z-]{8,40}$/).optional()
class PageCache { constructor(dir, options?: { dryRun?: boolean; runId?: string }); /* put appends to manifest.jsonl; save writes manifest.json and empties the journal */ }
// src/io/runLock.ts (Task 4)
export class CacheBusyError extends Error {}
export function holdCache(dir: string, isAlive?: (pid: number) => boolean): { release: () => void } // run.lock with the pid; a dead pid is taken over
// src/fetch/fetchPages.ts (Task 4)
export function resumeFilter(urls: readonly string[], cache: PageCache, runId: string, nowMs: number): string[] // drops same-run pages and pages under 24 h old
export function mergeCrawlReports(previous: CrawlReport | undefined, current: CrawlReport): CrawlReport // current wins per host and per URL
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
export const RULE_PATHS: readonly string[]  // ["src/gates/", "src/verify/", "src/curate/", "src/text/", "src/registers/kartverket.ts"]

// src/verify/resume.ts (Task 6)
export function sha256File(path: string): string | undefined                  // "sha256:<hex>", undefined when missing
export function lockInputs(o: { cacheDir: string; dataDir: string; kommune: string; nklmDate?: string }): LockInputs
export function canSkip(dataDir: string, kommune: string, inputs: LockInputs): boolean // the lock parses and its inputs deep-equal
// src/verify/failed.ts (Task 6)
export const TRANSIENT_KINDS: readonly FailedKind[]  // ["timeout","network","serverError"]
export function failedKind(k: KommuneDiscovery, report: CrawlReport | undefined): LockFailure
export function failedLock(kommune: string, failure: LockFailure, inputs: LockInputs): LockFile
// src/verify/verify.ts (Task 6)
export async function verifyAndWrite(dataDir: string, input: VerifyInput, inputs: Omit<LockInputs, "curated">, io?: RenameIo): Promise<VerifyCounts>
export async function verifyEach<K extends { kommune: string }>(kommuner: readonly K[], run: (k: K) => Promise<VerifyCounts | undefined>, onDone?: (k: K, at: number, of: number) => void): Promise<...same as today>

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

// src/score/markdown.ts (Task 9)
export function codeSpan(text: string): string
export function codeBlock(text: string): string
export function cellText(text: string): string
// src/score/render.ts (Task 9)
export const PR_BODY_LIMIT = 60_000
export function renderReport(s: PilotScore): string
export function renderPrBody(s: PilotScore, scale: ScaleNumbers | undefined, reportPath: string): string
// src/score/scale.ts (Task 10)
export type ScaleNumbers = { hosts: { host: string; requests: number; delayMs: number; estimateMs: number }[]; slowest?: {...}; lockBytes: number; kartverket?: { lookups: number; hits: number }; timings: Record<string, number> }
export function scaleNumbers(o: { report?: CrawlReport; lockBytes: number; stats?: { lookups: number; hits: number }; timings: Record<string, number> }): ScaleNumbers

// src/text/names.ts (Task 11)
export function isKnownWord(word: string, places: readonly string[]): boolean
// src/score/sweep.ts (Task 11)
export type SweepLine = { kommune: string; unitId: string; field: string; where: "value" | "role" | "quote"; word: string }
export function sweepLocks(locks: readonly LockFile[], places: readonly string[]): SweepLine[]
export function formatSweep(lines: readonly SweepLine[]): string
```

## Tasks

| # | Task | Depends on |
|---|---|---|
| 1 | The pilot list and `--only pilot` | none |
| 2 | The address place part | none |
| 3 | Kartverket pace, cache and `--offline` lookups | 2 |
| 4 | The page-cache journal, `fetch --resume`, progress, the cache lock | 1 |
| 5 | Lock schema: `inputs`, `failed`, `RULES_VERSION` | none |
| 6 | Verify: `--resume`, failed locks, `--offline`, progress, the repo's `data/` | 3, 4, 5 |
| 7 | The ratchet: known wrong values, rulings, `data:check --publish` | 5 |
| 8 | Scoring the pilot | 1, 7 |
| 9 | The report and the PR-body summary | 8 |
| 10 | The `score` command and the scale numbers | 4, 6, 9 |
| 11 | The name sweep | 5 |
| 12 | Docs: the pilot run, sources and licences, the notice | 10, 11 |
| 13 | Full suites, the pilot run, the checks, the baseline PR | all |

