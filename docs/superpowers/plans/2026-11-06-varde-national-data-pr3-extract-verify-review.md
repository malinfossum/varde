# Varde national data, PR 3 (extract, verify, review) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the pages PR 2 caches into checked values: rule-based field extraction (`src/extract/`), the NKLM legevakt reader (`src/xlsx/`, `src/registers/nklm.ts`), unit matching and inclusion (`src/curate/`), the real `GateContext` and the `verify` stage that writes lock files (`src/verify/`), and the terminal `review` command that writes my answers into the curated file (`src/review/`). Nothing new is committed to `data/`, no AI model runs, and nothing the site shows changes.

**Architecture:** `extract` re-reads each cached page with the PR 2 adapter, finds the unit's contact block (a CMS box, else the lines under a Kontakt heading) and runs one small rule per field. Every rule returns the value with the exact page line it came from, so the quote is verbatim by construction; a rule that cannot decide marks its candidate for review. The extraction files live in the cache folder. `verify` matches pages to Brreg units, decides inclusion, builds the `GateContext` from the cache, the registers and the NKLM file, runs the five gates and writes the lock and curated files for one kommune at a time, atomically. `review` walks me through what the gates could not decide, one item at a time, and writes each answer at once.

**Tech Stack:** Node 24 (native type stripping), TypeScript 7, Zod 4.6.7, Vitest 5, Biome 2.6.4, `cheerio@1.2.0` (as `cheerio/slim`, HTML and the sheet XML), `tldts@7.4.19`. One new runtime dependency, approved by me: `fflate` (0.8.3 on 05.11.2026; check the latest at build time and pin it exactly). Node built-ins for the rest: `node:crypto`, `node:fs`, `node:path`, `node:util` (`parseArgs`), `node:stream`.

**Spec:** `docs/superpowers/specs/2026-10-28-varde-national-data-design.md` on `docs/national-data-spec` (tip 059f2d2 or later). Read the section "PR 3: extract, verify, review" in full before Task 1, plus "Architecture", "Verification gates" with "Phone order", and "The Lavterskel rule". That section wins where it differs from earlier text. Code it builds on: `pipeline/` on `main` (PR 1 and PR 2 merged, tip 4b33b8f).

## Global Constraints

Every task's requirements include these. Values are copied from the spec and from the PR 2 plan where they still apply.

- **Only `src/net/` touches the network, and no test does.** The boundary test (`test/networkBoundary.test.ts`) fails if any file outside `src/net/` imports `node:http`, `node:https`, `node:http2`, `node:net`, `node:tls`, `node:dns`, `node:dgram`, `undici` or the full `cheerio`, or calls `fetch(`, and if any test imports `src/net/http.ts` or a CLI. Every stage takes the crawler's `get(url, kind)`; tests use `fakeGet` or `fakeWeb` from `test/netHelpers.ts`.
- **Pinned dependencies, exact versions.** Runtime: `zod@4.6.7`, `cheerio@1.2.0`, `tldts@7.4.19`, `fflate@<latest, checked on npm at build time>`. Dev: `typescript@7.0.2`, `vitest@5.0.5`, `@biomejs/biome@2.6.4`, `@types/node@24.19.2`. Install with `--save-exact`. No other package. Ward's Dependabot already covers `/pipeline`.
- **Node 24**, relative imports carry `.ts`, and only erasable TypeScript: no `enum`, no `namespace`, no constructor parameter properties. Write fields out.
- **No AI model, no key, no spend.** PR 3 extracts with rules. No page text leaves the machine or the runner.
- **Nothing new goes into `data/`.** `verify` and `review` take a required `--data <dir>` that holds `curated/` and `lock/`. The trial run points it at a temporary folder. PR 4 commits the pilot's lock files. The golden test still expects no lock files.
- **Fail closed, per kommune.** `extract` and `verify` build a kommune's whole output in memory and write each file with `writeJsonAtomic` only when that kommune is complete. A crash leaves the previous file byte for byte the same.
- **Linear-time patterns only.** Page text comes from sites I do not control: no nested or overlapping quantifiers, and every rule skips a line longer than 2,000 characters (`MAX_LINE`) as not a contact line. A 1 MB line of digits and dots must finish every rule within a second (Task 10 test).
- **Logs are public in Actions.** Commands print counts, kommune numbers, KLASS kommune names, adapter names, hosts and reasons. Never page text, quotes, unit names, org numbers, phone numbers, emails or URLs. Reasons never hold a value, a quote or a URL.
- **Person data.** A role mobile stores only two quotes: the role word and the number. Every other quote runs the name redaction (`personNames`, computed in verify, never stored). A Brreg sole proprietorship (`ENK`) is still dropped at the reader. Brreg's `telefon` is read for the kommune's own record (`organisasjonsform` KOMM) only, never `mobil`, never for any other unit.
- **The 11 kommuner that block ClaudeBot.** Their page text must never reach an AI company. In the pilot area that is Hamar (3403), Løten (3412), Stange (3413), Nord-Odal (3414), Sør-Odal (3415), Grue (3417) and Våler (3419); outside it Røst, Gol, Drammen and Asker. No live step in this plan runs `--only` with one of them, no AI agent opens, prints or quotes a page, an extraction file or a lock file built from their hosts, and no fixture comes from them.
- **Never print cached page text, extraction files, or lock quotes and values, for any host.** Checks print counts, lengths, tag names, classes and ids. When a live run needs debugging, count keys or lengths (`node -e` over the JSON), never the values. The implementer is an AI agent: anything it prints is sent to Anthropic.
- **Test fixtures are fictional:** numbers like `62 00 00 00` and `900 00 000`, the placeholder name "Kari Nordmann" (and, where a test needs a second or a longer name, "Ola Nordmann", "Kari Anne Nordmann" and "Anne-Marie Nordmann"), org numbers starting `99999`, hosts under `eksempel.kommune.no`. Page fixtures are written by hand from markup shapes (tag names, ids and classes only). Two real-data exceptions, both listed in `test/fixtures/README.md`: the KLASS code list (PR 2), and one Kartverket answer for a rådhus (Task 5, CC BY 4.0, Kartverket's credit).
- **Text I ship:** code, comments and docs in English, first person, no em dashes anywhere (rewrite the sentence; no en dash or spaced hyphen as a stand-in). In code strings, typographic dashes and spaces are `\u` escapes. Dates in prose are written `06.11.2026`, times `13:00`. House-style hours are `kl. 13:00–18:00`.
- **Commits:** conventional prefix (`feat:`, `fix:`, `test:`, `docs:`, `chore:`), scope `(pipeline)`, author `malinfossum.dev@proton.me`, no `Co-Authored-By`, no AI attribution. Stage explicit paths only, never `git commit -a`.
- **Dates:** before writing any date into a file, run `date +"%Y-%m-%d %A"` in the same tool batch.
- **Every new check is shown red once:** break the code or a fixture on purpose, run the check, see it fail, restore. Each task names its break; the PR body lists every break and its red result.
- **Commands, from `pipeline/`:** `npx biome check --write .` then `npx biome ci .`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run data:check`.

## Review Focus

Inputs the spec implies but no spec test names, most likely first. Each has a test in the task that owns the code.

1. **A "Faks" number in the contact block.** Kommune contact boxes often list `Telefon` and `Faks` side by side, and both are valid Nkom numbers. A fax number must never become the unit's phone, not even as a second rank-1 number that sends the real one to review. Test in Task 7.
2. **"Telefon:" on one line and the number on the next.** CMS boxes put the label in a `<dt>` or `<strong>` and the number in its own block, so `mainText` writes two lines. That is still rank 1, with both lines as quotes. Test in Task 7.
3. **Hours already in house style.** A page that already writes `kl. 08:00–15:30` must come out unchanged, so the formatter is idempotent and a second run never writes `kl. kl.`. Test in Task 4.
4. **The same number written twice on one page.** A number in the contact box and again in the body text is one candidate, not "two different numbers on the same rank" (which would send it to review). Test in Task 7 (one block) and Task 10 (the whole page).
5. **A cached page whose hash no longer matches its manifest entry.** `PageCache.read` returns `undefined`. Its unit gets no values from that page, and the extract summary counts it under the reason `cacheMismatch`. Test in Task 10.

## Decided (06.11.2026, writing this plan)

Choices the spec leaves open, or where the code on `main` forced a different shape. Each line has its reason.

1. **Folder layout follows PR 2, not the spec's `src/stages/`.** PR 2 shipped `src/discover/`, `src/fetch/` and `src/cli/`, so PR 3 adds `src/extract/` (`contactBlock.ts`, `cmsBoxes.ts`, `page.ts`, `roleWords.ts`, `fields/{phone,email,website,address,hours,lavterskel,name}.ts`, `extract.ts`), `src/text/{hours,phone,names}.ts`, `src/xlsx/read.ts`, `src/registers/nklm.ts`, `src/verify/{context,candidates,verify}.ts`, `src/curate/{categories,include,write}.ts`, `src/review/{sanitise,queue,render,session,lines}.ts`, `src/cli/{extract,verify,review}.ts`, and npm scripts `extract`, `verify`, `review`. Reason: one layout for the whole workspace. `extract/page.ts`, `extract/roleWords.ts`, `curate/categories.ts` and `review/lines.ts` are four files the brief did not list: the shared page reader, the role word list, the category tables I confirm at plan review, and the Enter-only line reader each get their own reviewable file.
2. **The extraction file is a new schema,** `src/schema/extraction.ts` (`ExtractionFile`), written to `<cache>/extract/<kommune>.json` (and `national.json` for Nav office pages), never committed. The exported `extraction` JSON Schema in `export.ts` stays the old model-answer shape (`model.ts`), kept for a possible AI fallback. Reason: the extraction file is cache data with page lines in it; it needs no JSON Schema and must not change the model schema. Per page it holds url, final url, fetch time, adapter, the fallback flag, a problem reason when the page gave nothing, the contact blocks (source `cms` or `heading`, the naming heading text, the lines) and the candidates (field, value, evidence, origin, optional role, rank, block index and review reason). No person names are stored in it.
3. **Person names are computed in verify, never stored.** `text/names.ts` `possibleNames(quote, { unitName, places })` returns every capitalised word or run that is not a role word, a label word, a KLASS kommune name, a day or month name, or a word of the unit's own name. `Candidate.personName` becomes `personNames: readonly string[]` (required, so a forgotten call cannot skip redaction); `redact` and `nameSurvives` take the list. Reason: ruling 28, a missed name is a public leak. The **label words** (`Telefon`, `Tlf`, `E-post`, `Besøksadresse` and so on) are my addition to the spec's exclusion list: without them every phone line would hold a "name", and rank 1 ("no person name on the line") could never match.
4. **Page text for grounding:** `extract` and `verify` share one function, `readUnitPage` in `extract/page.ts`, that reads a cached HTML page into the adapter's main text plus the text of any CMS contact or hours box that sits outside the main element, with the same `mainText` cleaner. Reason: every quote a rule takes must be in the text the grounding gate sees.
5. **CMS box selectors come from fetched pages, never guessed.** There is no page cache on this machine. Task 6 includes a step that runs `discover` and `fetch` for a few kommuner that do not block ClaudeBot (one ACOS, one CorePublish, one Sitevision), inspects only tag names, classes and ids around `tel:` and `mailto:` links with a local script that prints structure and never text, and records each box with a "checked dd.mm.2026 on <host>" comment, as `siteRules.ts` does. A CMS with no box found gets none; the heading rule still runs. Same for the hours box. Reason: a guessed selector either matches nothing or matches the wrong block.
6. **Role words** (`src/extract/roleWords.ts`): each word is added only from a fetched page or from Varde's existing data, with a source comment. From Varde's data today: `avdelingsleder`, `virksomhetsleder`, `barnevernleder` (`docs/seed-data-innlandet-ring.md`) and `daglig leder` (`docs/seed-data-lavterskel-innlandet.md`). "Enhetsleder" goes in only once a fetched page shows it (Task 6 counts role-shaped words on fetched pages, printing words only). Day and month names (nb) live in `text/names.ts`. Reason: the spec's never-from-memory rule for role words.
7. **Unit inclusion questions live in the lock.** `LockUnit` gains optional `inclusion: { status: "auto" | "review", reason, suggestedCategories, providerType? }`. The spec's "Schema changes" list misses this. `providerType` is my addition: a "yes" in review must write a curated unit, and `CuratedUnit.providerType` is required. Review reads it; the answer goes to the curated file (`include`, `categories`, `excludeReason`, `providerType`). Reason: the lock is the pipeline's file, and the question must survive between runs without inventing a curated answer.
8. **Unit identity and matching** (`curate/include.ts`): a Brreg unit and a fetched page belong together when the unit's `website` normalises to the page URL (`normaliseUrl`), when the page carries the unit's org number (Nav office JSON), or when `namesMatch(unit.name, pageName)` and both addresses resolve to the same Kartverket address id. Exactly one unit for one page, that unit on no other page, plus a known category gives `include: true` (auto) in the curated file; anything else is one review question. A page with no matching unit gets `unitId({ addressId, name })` from its own resolved address and page name; a page with neither cannot get a unit id, so it is counted under reason "no unit id" and stored nowhere (PR 4 measures it). A Brreg unit with no page gets no lock unit in PR 3 and is counted. A national page (a Nav office) joins a kommune only through one of that kommune's units; otherwise it is counted.
9. **Category tables, conservative, Malin confirms at plan review** (`curate/categories.ts`). One-to-one cases only. Checked on 06.11.2026 against the 138-row answer key:

   | Code or path word | Categories | Answer-key rows of that kind |
   |---|---|---|
   | 86.942, `helsestasjon` | `familie-og-barn` | 2 rows, both helsestasjon for ungdom, also carry `psykisk-helse`: **disagree** |
   | 88.991, `barnevern` | `familie-og-barn` | 4 of 6 agree; the 2 barnevernvakt rows also carry `nodtjenester` and `vold-og-overgrep`: **disagree**, so `barnevernvakt` maps to nothing (review) |
   | 88.992, `familievern` | `familie-og-barn` | 5 of 5 agree |
   | 87.999, `krisesenter` | `vold-og-overgrep`, `nodtjenester` | 4 of 4 carry both (2 also `bolig`). The brief named `vold-og-overgrep` alone; I added `nodtjenester` because every key row has it and review sorts acute units first by it |
   | `legevakt`, an NKLM match | `nodtjenester` | 4 of 4 agree; 3 also carry `psykisk-helse`: **partly disagree** |
   | `gjeldsradgiv` | `okonomi` | 2 of 2 agree |

   86.941, 88.995, 88.994 and 88.996 map to nothing, so those units go to review. Reason: a wrong category on an auto-included unit is a wrong value; review costs one question.
10. **Name field:** the page's `<h1>` as a quote (`unitPage`). The Brreg name (capitals, longer) is used only for matching, never as a peer candidate. Reason: the agreement gate would send every name to review.
11. **Sentralbord (rank 3) from Brreg:** `registers/brreg.ts` reads `telefon` for the kommune's own record only (`organisasjonsform` KOMM), never `mobil`, and refuses a mobile-shaped value. `KommuneDiscovery` gains optional `switchboard: { phone, orgNumber }` (optional, so old discovery files still parse). Verify uses it with register evidence (`brreg`, record id the org number, source URL `https://data.brreg.no/enhetsregisteret/api/enheter/<orgnr>`), role "Sentralbord", only when ranks 1 and 2 are empty. A fetched page on the kommune's own site with a number next to "Sentralbord" or "Servicetorg" is the quote path. Reason: spec "Phone order" rank 3, with the least Brreg data read.
12. **NKLM:** `REGISTER_SOURCES.nklm.licence` becomes `granted`; the source gate already passes any register licence that is not `pending` (checked: `src/gates/source.ts`). The reader gives legevakt rows (name, kommuner covered, phone, address) with record id `<file date>#<row>`. NKLM phone and address are only ever peers for the agreement gate, never their own lock field. A legevakt page whose name matches an NKLM row covering that kommune counts as a known category (`nodtjenester`). Storing coverage for publishing is spec B's job. The crawler gets a `binary` kind for the `.xlsx` (today's `Get` decodes every body as text). The edition is known by the file's SHA-256 in a table of editions the licence covers, so a new edition stops the step whatever its name or date says. The file is fetched only on `verify --nklm-fetch`; otherwise the last copy in `<cache>/nklm/` is used, or `--nklm-file <path>`. `<cache>/nklm/state.json` holds the last date, hash and URL. The NKLM host joins `FIXED_HOSTS` as a register. Reason: spec "Errors", NKLM file.
13. **`verify` takes a required `--data <dir>`** (holding `curated/` and `lock/`), so PR 3 can never write to the repo's `data/` by accident; the trial run points it at a temp folder. `review` takes the same `--data`. Reason: PR 4 owns the first committed lock files.
14. **GateContext assembly** (`verify/context.ts`): `allowedHosts` and `licence` from `AllowList.restore(hosts.json)`; `robotsAllows(url)` true only for URLs the manifest holds with a fetch the crawler made (it checked robots then) or a URL on a register's own host; `urlStatus` from the manifest (url and finalUrl); `pageText` from decision 4; `findAddress` from a map filled before the gates run, resolving each distinct address once through `registers/kartverket.ts` `findAddress` with the crawler's `get`; `validKommuner` from the discover report's kommuner; `unit` facts from Brreg (orgForm), the categories, `isKrisesenter` (category path word or SN 87.999), `ownHosts` from the unit's pages; `peers` from every candidate of that unit, plus Brreg and NKLM peers.
15. **Curated decisions in verify:** `accept` and `edit` become `Evidence` kind `decision` (`decidedOn` and the original evidence, whose quotes are the page quotes), and the value is `editedValue` for an edit; `reject` gives status `dropped` with reason "my decision of <date>: rejected". The grounding gate passes `decision` evidence with reason "my decision of <date>", and so does the agreement gate: I resolved the disagreement, and otherwise an accepted disagreement would come back on every run. Source, validity and safety still run. Safety and redaction read the quotes of `decision` evidence too. The `decision` kind nests the original evidence (`original: register | quote`) instead of holding only quotes, because a reviewed register value has no page quote.
16. **Two gate rules the spec implies but the code lacks.** The grounding gate passes a `website` whose value is the source page itself ("already grounded by the fetch"), and it grounds `openingHours` and `phoneHours` by `hoursGrounded` (every time range and every word of the value is in the quotes), because the formatted value is never a verbatim substring of the raw quote. The grounding gate also grounds `address` by street key and postcode (`quoteHasAddress`), so `Storgata 1A` from Kartverket is found in `Storgata 1 A` on the page.
17. **A narrow name guard on hours values.** Quotes are redacted, but the hours value is built from the same lines and is stored as it is. `runGates` drops an `openingHours` or `phoneHours` value that holds a run of two or more capitalised words that are not day, month, label or role words ("Kari Nordmann"), with the reason "the hours text may hold a person name". It also drops an activity name such as "Røde Kors"; that is the safe side. Reason: the spec's leak rule, applied to a place the spec does not name.
18. **Redacted quotes no longer match the page verbatim.** `[navn]` replaces every possible name, including sentence-initial words such as "Tilbudet". The monthly quote check (PR 5) must treat `[navn]` as a wildcard. Not built here; listed under "Left for later plans".

## Left for later plans

- The monthly quote check must read `[navn]` as "any name" (decision 18).
- Coverage of NKLM rows for publishing (spec B).
- Nav office categories: a Nav office goes to review in PR 3 (88.995 maps to nothing). If PR 4 shows many such questions, a Nav row in the category table (`arbeid`, `bolig`, `okonomi`, as 19 of 23 key rows have it) is one line for me to approve.
- A Brreg unit with no page, and a page with no unit id, are counted only.

## File Structure

```text
docs/licence-requests/README.md        # NKLM answer recorded
pipeline/
  package.json, package-lock.json      # + fflate; scripts extract, verify, review
  README.md                            # the three commands, the review keys, the privacy rules
  schema/curated.schema.json           # regenerated (ReviewDecision)
  schema/lock.schema.json              # regenerated (decision evidence, inclusion)
  src/schema/lock.ts                   # RegisterEvidence, QuoteEvidence, DecisionEvidence, Inclusion, evidenceQuotes
  src/schema/curated.ts                # ReviewDecision edit, findDecision
  src/schema/extraction.ts             # ExtractionFile (cache only)
  src/text/normalise.ts                # MAX_LINE; quoteHasPhone learns dotted shapes
  src/text/names.ts                    # possibleNames, capitalisedRuns, day and month names
  src/text/phone.ts                    # findPhones, isMobileDigits
  src/text/hours.ts                    # formatHours, hoursGrounded, timeRanges, hoursLength
  src/text/address.ts                  # streetKey, quoteHasAddress
  src/gates/types.ts                   # Candidate.personNames
  src/gates/run.ts                     # redact and nameSurvives take a list; hours name guard
  src/gates/grounding.ts               # decision, website, hours and address rules
  src/gates/agreement.ts               # decision evidence passes
  src/gates/safety.ts                  # reads decision quotes
  src/gates/validity.ts                # hours length in code points
  src/registers/kartverket.ts          # "1 A" equals "1A"; AddressHit.text
  src/registers/brreg.ts               # KOMM telefon as switchboard
  src/registers/nklm.ts                # NKLM reader, editions, state
  src/xlsx/read.ts                     # first sheet of an .xlsx, with zip limits
  src/net/crawler.ts                   # Kind "binary", Fetched.bytes
  src/sources/registers.ts             # nklm granted, its host
  src/sources/hosts.ts                 # nklm in FIXED_HOSTS
  src/adapters/clean.ts                # textLines (mainText built on it)
  src/adapters/read.ts                 # readPageWith (adapter result plus its selector)
  src/discover/types.ts                # KommuneDiscovery.switchboard
  src/discover/discover.ts             # fills switchboard
  src/extract/roleWords.ts             # role words, each with its source
  src/extract/cmsBoxes.ts              # CMS contact and hours boxes, each checked on a live page
  src/extract/page.ts                  # readUnitPage: main text plus boxes outside it
  src/extract/contactBlock.ts          # contactBlocks, hoursLines
  src/extract/fields/*.ts              # one rule per field
  src/extract/extract.ts               # the extract stage
  src/curate/categories.ts             # SN2025 and path word tables
  src/curate/include.ts                # matching pages to units, inclusion
  src/curate/write.ts                  # curated file: atomic write with retry
  src/verify/context.ts                # GateContext assembly, address resolution
  src/verify/candidates.ts             # extraction to gate candidates, shared pages, phone rank
  src/verify/verify.ts                 # the verify stage
  src/review/sanitise.ts               # strips control codes, OSC 8, bidi and zero-width
  src/review/queue.ts                  # open questions, acute first
  src/review/render.ts                 # one item as plain text
  src/review/lines.ts                  # Enter-only line reader
  src/review/session.ts                # the walk-through
  src/cli/extract.ts, src/cli/verify.ts, src/cli/review.ts
  test/fixtures/README.md              # + Kartverket exception, CMS box shapes
  test/fixtures/kartverket/*.json      # one recorded rådhus answer
  test/fixtures/pages/*.html           # + contact boxes, Kontakt heading, hours, shared page
  test/*.test.ts
```

## Setup (before Task 1)

- [ ] Start from current `main`: `git fetch origin && git switch -c feat/pipeline-extract-verify-review origin/main`.
- [ ] Bring the spec and this plan in as local, untracked copies so they never land in the PR:

```bash
mkdir -p docs/superpowers/specs docs/superpowers/plans
git show origin/docs/national-data-spec:docs/superpowers/specs/2026-10-28-varde-national-data-design.md > docs/superpowers/specs/2026-10-28-varde-national-data-design.md
git show origin/docs/national-data-spec:docs/superpowers/plans/2026-11-06-varde-national-data-pr3-extract-verify-review.md > docs/superpowers/plans/2026-11-06-varde-national-data-pr3-extract-verify-review.md
printf '%s\n' docs/superpowers/specs/2026-10-28-varde-national-data-design.md docs/superpowers/plans/2026-11-06-varde-national-data-pr3-extract-verify-review.md >> "$(git rev-parse --git-path info/exclude)"
git status --short
```

Expected: `git status --short` prints nothing.

- [ ] Install and check the baseline, from `pipeline/`: `npm ci && npx biome ci . && npm run typecheck && npm test`. Expected: all green before any change.

---

### Task 1: Schema changes

The lock learns decision evidence and the inclusion question, the curated file learns the `edit` answer, and the extraction file gets its own schema.

**Files:**
- Modify: `pipeline/src/schema/lock.ts`, `pipeline/src/schema/curated.ts`
- Create: `pipeline/src/schema/extraction.ts`
- Regenerate: `pipeline/schema/lock.schema.json`, `pipeline/schema/curated.schema.json`
- Test: `pipeline/test/schema.test.ts` (extend), `pipeline/test/extraction.test.ts`

**Interfaces:**
- Consumes: `Register`, `CalendarDate`, `CategorySlug`, `ProviderType`, `FieldName`, `FieldValue`, `MAX_QUOTE`, `NonBlank` (`schema/common.ts`), `ADAPTER_NAMES` (`adapters/types.ts`), `comparable` (`gates/compare.ts`).
- Produces:
  - `schema/lock.ts`: `RegisterEvidence`, `QuoteEvidence`, `DecisionEvidence` (Zod and type), `Evidence` (union of the three), `evidenceQuotes(e: Evidence): readonly string[]`, `Inclusion` (Zod and type: `status: "auto" | "review"`, `reason`, `suggestedCategories: CategorySlug[]`, `providerType?`), `LockUnit.inclusion?`.
  - `schema/curated.ts`: `ReviewDecision` with `decision: "accept" | "reject" | "edit"`, `editedValue?: FieldValue`, `role?: string`; `type ReviewDecision`; `findDecision(decisions: readonly ReviewDecision[], q: { field: FieldName; value: FieldValue; sourceUrl: string }): ReviewDecision | undefined`.
  - `schema/extraction.ts`: `PAGE_PROBLEMS = ["cacheMismatch", "noText", "unreadable"]`, `type PageProblem`, `EXTRACTED_FIELDS = ["name", "phone", "phoneHours", "address", "email", "website", "openingHours", "alwaysOpen"]`, `type ExtractedField`, `ExtractedEvidence`, `ExtractedCandidate`, `ContactBlock`, `ExtractedPage`, `ExtractionFile` (Zod and type each).

- [ ] **Step 1: Write the failing tests**

Add to `pipeline/test/schema.test.ts` (keep the existing tests; add the imports `CuratedUnit`, `findDecision`, `ReviewDecision` from `../src/schema/curated.ts` and `evidenceQuotes`, `LockUnit` from `../src/schema/lock.ts`):

```ts
describe("Evidence: my decision", () => {
	const decision = {
		kind: "decision",
		decidedOn: "2026-11-06",
		original: { kind: "quote", quotes: ["Telefon: 62 00 00 00"] },
	}

	it("accepts a decision that keeps the page's quotes", () => {
		expect(Evidence.safeParse(decision).success).toBe(true)
		expect(evidenceQuotes(Evidence.parse(decision))).toEqual(["Telefon: 62 00 00 00"])
	})

	it("accepts a decision over a register value, which has no quote", () => {
		const reg = { ...decision, original: { kind: "register", register: "brreg", recordId: "999999999" } }
		expect(Evidence.safeParse(reg).success).toBe(true)
		expect(evidenceQuotes(Evidence.parse(reg))).toEqual([])
	})

	it("refuses a decision without a date, or one nested in another", () => {
		const { decidedOn: _d, ...noDate } = decision
		expect(Evidence.safeParse(noDate).success).toBe(false)
		expect(Evidence.safeParse({ ...decision, original: decision }).success).toBe(false)
	})
})

describe("LockUnit: the inclusion question", () => {
	it("keeps an open question with its suggested categories", () => {
		const unit = lockUnit({
			inclusion: { status: "review", reason: "two units share the page", suggestedCategories: ["rus"] },
		})
		expect(LockUnit.safeParse(unit).success).toBe(true)
	})

	it("refuses an unknown status or category", () => {
		expect(
			LockUnit.safeParse(lockUnit({ inclusion: { status: "maybe", reason: "x", suggestedCategories: [] } as never }))
				.success
		).toBe(false)
		expect(
			LockUnit.safeParse(
				lockUnit({ inclusion: { status: "auto", reason: "x", suggestedCategories: ["sport"] } as never })
			).success
		).toBe(false)
	})
})

describe("ReviewDecision", () => {
	const base = {
		field: "phone",
		value: "62 00 00 00",
		sourceUrl: "https://www.eksempel.kommune.no/helsestasjon/",
		decidedOn: "2026-11-06",
	}

	it("takes accept, reject and edit", () => {
		for (const decision of ["accept", "reject"]) {
			expect(ReviewDecision.safeParse({ ...base, decision }).success).toBe(true)
		}
		const edit = { ...base, decision: "edit", editedValue: "62 00 00 01", role: "Vakttelefon" }
		expect(ReviewDecision.safeParse(edit).success).toBe(true)
	})

	it("refuses an edit without its value, and an edited value on anything but an edit", () => {
		expect(ReviewDecision.safeParse({ ...base, decision: "edit" }).success).toBe(false)
		expect(ReviewDecision.safeParse({ ...base, decision: "accept", editedValue: "x" }).success).toBe(false)
		expect(ReviewDecision.safeParse({ ...base, decision: "reject", role: "Leder" }).success).toBe(false)
	})

	it("finds the answer to the same question, with the value compared as the gates compare it", () => {
		const d = ReviewDecision.parse({ ...base, decision: "accept" })
		expect(findDecision([d], { field: "phone", value: "62000000", sourceUrl: base.sourceUrl })).toEqual(d)
		expect(findDecision([d], { field: "phone", value: "62 00 00 01", sourceUrl: base.sourceUrl })).toBeUndefined()
		expect(
			findDecision([d], { field: "phone", value: "62 00 00 00", sourceUrl: "https://www.eksempel.kommune.no/x/" })
		).toBeUndefined()
		expect(findDecision([d], { field: "email", value: "62 00 00 00", sourceUrl: base.sourceUrl })).toBeUndefined()
	})

	it("is part of a curated unit", () => {
		const unit = curatedUnit({ decisions: [{ ...base, decision: "edit", editedValue: "62 00 00 01" } as never] })
		expect(CuratedUnit.safeParse(unit).success).toBe(true)
	})
})
```

Create `pipeline/test/extraction.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { ExtractionFile } from "../src/schema/extraction.ts"

const URL_A = "https://www.eksempel.kommune.no/helsestasjon/"

export const extractedPage = (over: Record<string, unknown> = {}) => ({
	url: URL_A,
	finalUrl: URL_A,
	fetchedAt: "2026-11-06T10:00:00Z",
	adapter: "acos",
	fallback: false,
	blocks: [{ source: "heading", heading: "Kontakt", lines: ["Telefon: 62 00 00 00"] }],
	candidates: [
		{
			field: "phone",
			value: "62 00 00 00",
			evidence: { kind: "quote", quotes: ["Telefon: 62 00 00 00"] },
			origin: "unitContact",
			rank: 1,
			block: 0,
		},
	],
	lavterskelQuotes: ["Helsestasjonen er gratis."],
	...over,
})

describe("ExtractionFile", () => {
	it("holds a kommune's pages, or the national ones", () => {
		for (const scope of ["3405", "national"]) {
			const file = { scope, extractedAt: "2026-11-06T10:00:00Z", pages: [extractedPage()] }
			expect(ExtractionFile.safeParse(file).success).toBe(true)
		}
	})

	it("keeps a page that gave nothing, with its reason", () => {
		const page = extractedPage({ problem: "cacheMismatch", blocks: [], candidates: [], lavterskelQuotes: [] })
		const file = { scope: "3405", extractedAt: "2026-11-06T10:00:00Z", pages: [page] }
		expect(ExtractionFile.safeParse(file).success).toBe(true)
	})

	it("refuses a decision as extraction evidence, a lowThreshold candidate and an unknown problem", () => {
		const bad = [
			extractedPage({
				candidates: [
					{
						field: "phone",
						value: "62 00 00 00",
						evidence: { kind: "decision", decidedOn: "2026-11-06", original: { kind: "quote", quotes: ["x"] } },
						origin: "unitContact",
					},
				],
			}),
			extractedPage({
				candidates: [
					{ field: "lowThreshold", value: true, evidence: { kind: "quote", quotes: ["x"] }, origin: "unitPage" },
				],
			}),
			extractedPage({ problem: "tooHard" }),
		]
		for (const page of bad) {
			const file = { scope: "3405", extractedAt: "2026-11-06T10:00:00Z", pages: [page] }
			expect(ExtractionFile.safeParse(file).success).toBe(false)
		}
	})
})
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run test/schema.test.ts test/extraction.test.ts`
Expected: FAIL, `evidenceQuotes`, `findDecision` and `src/schema/extraction.ts` do not exist.

- [ ] **Step 3: Change `src/schema/lock.ts`**

Add `CalendarDate`, `CategorySlug` and `ProviderType` to the `./common.ts` import, then replace the `Evidence` block with:

```ts
export const RegisterEvidence = z.strictObject({
	kind: z.literal("register"),
	register: Register,
	recordId: NonBlank,
})
export const QuoteEvidence = z.strictObject({
	kind: z.literal("quote"),
	quotes: z.array(NonBlank.max(MAX_QUOTE)).min(1),
})
// My answer in review. It keeps the evidence the page or register gave, so safety and redaction
// still read the page's quotes, and a register value I reviewed keeps its record id.
export const DecisionEvidence = z.strictObject({
	kind: z.literal("decision"),
	decidedOn: CalendarDate,
	original: z.discriminatedUnion("kind", [RegisterEvidence, QuoteEvidence]),
})
export const Evidence = z.discriminatedUnion("kind", [RegisterEvidence, QuoteEvidence, DecisionEvidence])
export type Evidence = z.infer<typeof Evidence>

// The page quotes behind a value: a quote's own, a decision's original ones, none for a register.
export function evidenceQuotes(e: Evidence): readonly string[] {
	if (e.kind === "quote") return e.quotes
	if (e.kind === "decision" && e.original.kind === "quote") return e.original.quotes
	return []
}
```

Before `LockUnit`, add:

```ts
// "Include this unit?" A clear match is auto (verify writes include: true to the curated file);
// anything else waits for my answer in review. Reasons never hold a value or a name.
export const Inclusion = z.strictObject({
	status: z.enum(["auto", "review"]),
	reason: NonBlank,
	suggestedCategories: z.array(CategorySlug),
	providerType: ProviderType.optional(),
})
export type Inclusion = z.infer<typeof Inclusion>
```

and add `inclusion: Inclusion.optional(),` after `fields: LockFields,` in `LockUnit`.

- [ ] **Step 4: Change `src/schema/curated.ts`**

Add the import `import { comparable } from "../gates/compare.ts"` (no cycle: `compare.ts` imports only `common.ts` and `text/normalise.ts`). Replace `ReviewDecision` with:

```ts
// One answer of mine per question, so the review command never asks twice. A question is one
// value for one field from one page, so the key (field, value, sourceUrl) stays the page's
// value; an edit stores mine in editedValue.
export const ReviewDecision = z
	.strictObject({
		field: FieldName,
		value: FieldValue,
		sourceUrl: HttpsUrl,
		decision: z.enum(["accept", "reject", "edit"]),
		editedValue: FieldValue.optional(),
		role: NonBlank.optional(),
		decidedOn: CalendarDate,
		note: NonBlank.optional(),
	})
	.superRefine((d, ctx) => {
		const issue = (message: string) => ctx.addIssue({ code: "custom", message })
		if (d.decision === "edit" && d.editedValue === undefined) issue("an edit needs its edited value")
		if (d.decision !== "edit" && (d.editedValue !== undefined || d.role !== undefined)) {
			issue("only an edit carries an edited value or a role")
		}
	})
export type ReviewDecision = z.infer<typeof ReviewDecision>

// My answer to this question, if I gave one. Values compare as the gates compare them, so
// "62000000" and "62 00 00 00" are one question.
export function findDecision(
	decisions: readonly ReviewDecision[],
	q: { field: z.infer<typeof FieldName>; value: z.infer<typeof FieldValue>; sourceUrl: string }
): ReviewDecision | undefined {
	const wanted = comparable(q.field, q.value)
	return decisions.find(
		(d) => d.field === q.field && d.sourceUrl === q.sourceUrl && comparable(d.field, d.value) === wanted
	)
}
```

- [ ] **Step 5: Write `src/schema/extraction.ts`**

```ts
import { z } from "zod"
import { ADAPTER_NAMES } from "../adapters/types.ts"
import { FieldValue, HttpsUrl, KommuneNumber, MAX_QUOTE, NonBlank, UtcTimestamp } from "./common.ts"
import { QuoteEvidence, RegisterEvidence } from "./lock.ts"

// What extract writes to <cache>/extract/<kommune>.json. Cache data only: it holds page lines,
// so it is never committed, never printed, and has no JSON Schema export. Person names are not
// stored here; verify computes them from the quotes.

// Why a page gave nothing. Counted in the summary; never a value or a URL.
export const PAGE_PROBLEMS = ["cacheMismatch", "noText", "unreadable"] as const
export type PageProblem = (typeof PAGE_PROBLEMS)[number]

// lowThreshold is not a field rule's value: the page's Lavterskel quotes are collected apart,
// and the safety gate's rule decides the badge in verify.
export const EXTRACTED_FIELDS = [
	"name",
	"phone",
	"phoneHours",
	"address",
	"email",
	"website",
	"openingHours",
	"alwaysOpen",
] as const
export type ExtractedField = (typeof EXTRACTED_FIELDS)[number]

export const ExtractedEvidence = z.discriminatedUnion("kind", [RegisterEvidence, QuoteEvidence])
export type ExtractedEvidence = z.infer<typeof ExtractedEvidence>

export const ExtractedCandidate = z.strictObject({
	field: z.enum(EXTRACTED_FIELDS),
	value: FieldValue,
	evidence: ExtractedEvidence,
	origin: z.enum(["unitContact", "unitPage", "register"]),
	role: NonBlank.optional(),
	// The phone order: 1 service phone, 2 a number the kommune publishes with a role, 3 the
	// switchboard.
	rank: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
	// Index into the page's blocks: the shared-page rule reads that block's heading.
	block: z.number().int().nonnegative().optional(),
	// A rule that cannot decide says why, and verify sends the field to review.
	review: NonBlank.optional(),
})
export type ExtractedCandidate = z.infer<typeof ExtractedCandidate>

export const ContactBlock = z.strictObject({
	source: z.enum(["cms", "heading"]),
	// The heading that names the block's service, when there is one above it.
	heading: NonBlank.optional(),
	lines: z.array(z.string()),
})
export type ContactBlock = z.infer<typeof ContactBlock>

export const ExtractedPage = z.strictObject({
	url: HttpsUrl,
	finalUrl: HttpsUrl,
	fetchedAt: UtcTimestamp,
	adapter: z.enum(ADAPTER_NAMES),
	fallback: z.boolean(),
	problem: z.enum(PAGE_PROBLEMS).optional(),
	// From a Nav office page's own data, for matching to a Brreg unit.
	orgNumber: z
		.string()
		.regex(/^\d{9}$/)
		.optional(),
	navOfficeId: NonBlank.optional(),
	blocks: z.array(ContactBlock),
	candidates: z.array(ExtractedCandidate),
	lavterskelQuotes: z.array(NonBlank.max(MAX_QUOTE)),
})
export type ExtractedPage = z.infer<typeof ExtractedPage>

export const ExtractionFile = z.strictObject({
	scope: z.union([KommuneNumber, z.literal("national")]),
	extractedAt: UtcTimestamp,
	pages: z.array(ExtractedPage),
})
export type ExtractionFile = z.infer<typeof ExtractionFile>
```

- [ ] **Step 6: Run the tests to see them pass**

Run: `npx vitest run test/schema.test.ts test/extraction.test.ts`
Expected: PASS.

- [ ] **Step 7: Regenerate the JSON Schemas**

Run: `npm run schema && npx vitest run test/schemaExport.test.ts`
Expected: `wrote schema/curated.schema.json` and the three others; the export test PASSES, including "closes every object". `git diff --stat schema/` shows `curated` and `lock` changed, `extraction` and `description` unchanged.

- [ ] **Step 8: Show it red once**

In `ReviewDecision`'s refinement, delete the line that refuses an edit without its value. Run `npx vitest run test/schema.test.ts`: FAIL on "refuses an edit without its value". Restore, run: PASS. Note it for the PR body.

- [ ] **Step 9: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add src/schema/lock.ts src/schema/curated.ts src/schema/extraction.ts schema/lock.schema.json schema/curated.schema.json test/schema.test.ts test/extraction.test.ts
git commit -m "feat(pipeline): add decision evidence, the inclusion question, the edit answer and the extraction file"
```

---

### Task 2: Gates read decisions and a list of person names

`Candidate.personName` becomes `personNames`, computed from the quotes by `text/names.ts`. The gates learn `decision` evidence, the source page as its own website, and the hours name guard.

**Files:**
- Create: `pipeline/src/text/names.ts`, `pipeline/src/extract/roleWords.ts`
- Modify: `pipeline/src/gates/types.ts`, `pipeline/src/gates/run.ts`, `pipeline/src/gates/grounding.ts`, `pipeline/src/gates/agreement.ts`, `pipeline/src/gates/safety.ts`, `pipeline/test/helpers.ts`, `pipeline/test/run.test.ts` (and every other test that sets `personName`: find them with `grep -ln personName test/`)
- Test: `pipeline/test/names.test.ts`, `pipeline/test/run.test.ts`, `pipeline/test/grounding.test.ts`, `pipeline/test/agreement.test.ts`, `pipeline/test/safety.test.ts`

**Interfaces:**
- Consumes: `Evidence`, `evidenceQuotes` (Task 1), `foldNorwegian`, `normaliseUrl` (`text/normalise.ts`).
- Produces:
  - `extract/roleWords.ts`: `type RoleWord = { word: string; label: string }` (word in lower case as pages write it, label as Varde shows it), `ROLE_WORDS: readonly RoleWord[]`, `findRoleWord(line: string): { label: string; quote: string } | undefined` (the role word as written on the line, verbatim).
  - `text/names.ts`: `DAY_WORDS: ReadonlySet<string>` (folded), `MONTH_WORDS`, `LABEL_WORDS`, `type NameContext = { unitName?: string; places: readonly string[] }`, `possibleNames(text: string, ctx: NameContext): string[]`, `capitalisedRuns(text: string): string[]` (runs of two or more, no context).
  - `gates/types.ts`: `Candidate.personNames: readonly string[]` (required).
  - `gates/run.ts`: `redact(quotes: readonly string[], personNames: readonly string[]): string[]`.

- [ ] **Step 1: Write the failing tests**

Create `pipeline/test/names.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { findRoleWord } from "../src/extract/roleWords.ts"
import { capitalisedRuns, possibleNames } from "../src/text/names.ts"

const ctx = { unitName: "Eksempel helsestasjon", places: ["Lillehammer", "Nord-Odal", "Oslo"] }

describe("possibleNames", () => {
	it("finds a name, a three-part name and a hyphenated name as whole runs", () => {
		expect(possibleNames("Kari Nordmann treffes her.", ctx)).toEqual(["Kari Nordmann"])
		expect(possibleNames("Ring Kari Anne Nordmann i dag.", ctx)).toEqual(["Ring Kari Anne Nordmann"])
		expect(possibleNames("Kontakt Anne-Marie Nordmann.", ctx)).toEqual(["Anne-Marie Nordmann"])
	})

	it("leaves out role words, label words, places, days, months and the unit's own name", () => {
		const line = "Telefon: Avdelingsleder Eksempel Helsestasjon Lillehammer Nord-Odal Mandag Januar"
		expect(possibleNames(line, ctx)).toEqual([])
	})

	it("splits a run at a word it leaves out, so both sides are still names", () => {
		expect(possibleNames("Kari Mandag Nordmann", ctx)).toEqual(["Kari", "Nordmann"])
	})

	it("redacts too much on purpose: any other capitalised word counts", () => {
		expect(possibleNames("Tilbudet er gratis.", ctx)).toEqual(["Tilbudet"])
	})

	it("finishes on a 1 MB line well within a second", () => {
		const line = "Aa ".repeat(350_000)
		const started = performance.now()
		possibleNames(line, ctx)
		expect(performance.now() - started).toBeLessThan(1000)
	})
})

describe("capitalisedRuns", () => {
	it("finds two or more capitalised words that are not days, months, labels or roles", () => {
		expect(capitalisedRuns("Mandag kl. 10:00\u201312:00 hos Kari Nordmann")).toEqual(["Kari Nordmann"])
		expect(capitalisedRuns("Hverdager kl. 09:00\u201315:00")).toEqual([])
		expect(capitalisedRuns("Mandag Tirsdag kl. 10:00\u201312:00")).toEqual([])
	})
})

describe("findRoleWord", () => {
	it("finds a role word as written, and labels it as Varde shows it", () => {
		expect(findRoleWord("Avdelingsleder: 900 00 000")).toEqual({
			label: "Avdelingsleder",
			quote: "Avdelingsleder",
		})
		expect(findRoleWord("kontakt daglig leder på 900 00 000")).toEqual({
			label: "Daglig leder",
			quote: "daglig leder",
		})
	})

	it("needs the whole word", () => {
		expect(findRoleWord("Avdelingslederen sitt kontor")).toBeUndefined()
		expect(findRoleWord("Telefon 62 00 00 00")).toBeUndefined()
	})
})
```

In `pipeline/test/run.test.ts`, change every `personName: "<name>"` to `personNames: ["<name>"]` (keep the names), and add:

```ts
describe("runGates: several names and decisions", () => {
	it("redacts every name in the list, longest first", () => {
		expect(redact(["Kari Nordmann og Ola Nordmann svarer"], ["Ola Nordmann", "Kari Nordmann"])).toEqual([
			"[navn] og [navn] svarer",
		])
	})

	it("redacts the quotes a decision keeps", () => {
		const page = `${PAGE}\nKari Nordmann svarer hverdager 08.00\u201315.30`
		const c = candidate({
			field: "phoneHours",
			value: "Hverdager kl. 08:00\u201315:30",
			evidence: {
				kind: "decision",
				decidedOn: "2026-11-06",
				original: { kind: "quote", quotes: ["Kari Nordmann svarer hverdager 08.00\u201315.30"] },
			},
			personNames: ["Kari Nordmann"],
		})
		const field = runGates(c, context({ pageText: () => page }), T)
		expect(JSON.stringify(field)).not.toContain("Kari")
		expect(field.evidence).toEqual({
			kind: "decision",
			decidedOn: "2026-11-06",
			original: { kind: "quote", quotes: ["[navn] svarer hverdager 08.00\u201315.30"] },
		})
	})

	it("drops an hours value that holds a two-word capitalised run", () => {
		// The value is verbatim here so this test does not depend on the hours grounding of Task 4.
		const page = `${PAGE}\nÅpent hos Kari Nordmann mandag 10.00\u201312.00`
		const c = candidate({
			field: "openingHours",
			value: "Åpent hos Kari Nordmann mandag 10.00\u201312.00",
			evidence: { kind: "quote", quotes: ["Åpent hos Kari Nordmann mandag 10.00\u201312.00"] },
			personNames: [],
		})
		const field = runGates(c, context({ pageText: () => page }), T)
		expect(field).toMatchObject({ status: "dropped", reason: "the hours text may hold a person name" })
	})
})
```

Add to `pipeline/test/grounding.test.ts` (it already imports `groundingGate`, `candidate`, `context`, `PAGE_URL`):

```ts
describe("grounding: decisions and the page itself", () => {
	it("passes my decision without reading the page, and says whose", () => {
		const c = candidate({
			value: "62 00 00 01",
			evidence: { kind: "decision", decidedOn: "2026-11-06", original: { kind: "quote", quotes: ["x"] } },
		})
		expect(groundingGate(c, context({ pageText: () => undefined }))).toEqual({
			gate: "grounding",
			pass: true,
			reason: "my decision of 06.11.2026",
		})
	})

	it("passes a website that is the source page itself, once its quote is on the page", () => {
		const c = candidate({
			field: "website",
			value: PAGE_URL,
			evidence: { kind: "quote", quotes: ["Rusteamet Hamar"] },
			origin: "unitPage",
		})
		expect(groundingGate(c, context()).pass).toBe(true)
		const other = candidate({ ...c, value: "https://www.hamar.kommune.no/annet/" })
		expect(groundingGate(other, context()).pass).toBe(false)
	})
})
```

Add to `pipeline/test/agreement.test.ts`:

```ts
it("passes my decision even when another source disagrees", () => {
	const mine = candidate({
		evidence: { kind: "decision", decidedOn: "2026-11-06", original: { kind: "quote", quotes: ["x"] } },
	})
	const other = candidate({ value: "62 00 00 01", sourceUrl: "https://www.eksempel.kommune.no/" })
	expect(agreementGate(mine, context({ peers: [mine, other] }))).toEqual({
		gate: "agreement",
		pass: true,
		reason: "my decision of 06.11.2026",
	})
})
```

Add to `pipeline/test/safety.test.ts`:

```ts
it("reads the quotes inside my decision: an account number there is still dropped", () => {
	const c = candidate({
		field: "email",
		value: "post@eksempel.kommune.no",
		evidence: {
			kind: "decision",
			decidedOn: "2026-11-06",
			original: { kind: "quote", quotes: ["Konto 1234.56.78901"] },
		},
	})
	expect(safetyGate(c, context()).pass).toBe(false)
})
```

If an imported name is missing in one of these files, add it to that file's imports.

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run test/names.test.ts test/run.test.ts test/grounding.test.ts test/agreement.test.ts test/safety.test.ts`
Expected: FAIL, `src/text/names.ts` and `src/extract/roleWords.ts` do not exist, and `personNames` is not a `Candidate` key.

- [ ] **Step 3: Write `src/extract/roleWords.ts`**

```ts
import { foldNorwegian } from "../text/normalise.ts"

// Words that name a public role next to a number the kommune publishes as a unit's contact
// (spec, "Phone order" rank 2). Each word is added from a fetched page or from Varde's own data,
// never from memory, with its source. Task 6 of the PR 3 plan adds the ones fetched pages show.
export type RoleWord = { word: string; label: string }

export const ROLE_WORDS: readonly RoleWord[] = [
	// docs/seed-data-innlandet-ring.md, rows researched 2026-08 (kommune service pages).
	{ word: "avdelingsleder", label: "Avdelingsleder" },
	{ word: "virksomhetsleder", label: "Virksomhetsleder" },
	{ word: "barnevernleder", label: "Barnevernleder" },
	// docs/seed-data-lavterskel-innlandet.md (a frivilligsentral's contact block).
	{ word: "daglig leder", label: "Daglig leder" },
]

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

// A role word as a whole word, any case, with any spacing inside a two-word role. Built once.
const PATTERNS = ROLE_WORDS.map((r) => ({
	label: r.label,
	pattern: new RegExp(
		`(?<![\\p{L}\\p{N}])${r.word.split(" ").map(escape).join("\\s+")}(?![\\p{L}\\p{N}])`,
		"iu"
	),
}))

// The first role word on the line, as the page writes it (a verbatim quote) and as Varde
// labels it. Lines are compared as written: role words have no æ, ø or å today; foldNorwegian
// keeps it that way for any that do.
export function findRoleWord(line: string): { label: string; quote: string } | undefined {
	for (const { label, pattern } of PATTERNS) {
		const m = pattern.exec(line)
		if (m !== null) return { label, quote: m[0] }
	}
	return undefined
}

// Folded single words of every role, for the name rules: "daglig leder" gives both words.
export const ROLE_WORD_PARTS: ReadonlySet<string> = new Set(
	ROLE_WORDS.flatMap((r) => r.word.split(" ").map(foldNorwegian))
)
```

- [ ] **Step 4: Write `src/text/names.ts`**

```ts
import { ROLE_WORD_PARTS } from "../extract/roleWords.ts"
import { foldNorwegian } from "./normalise.ts"

// Possible person names in a quote (ruling 28). Lock files and PR bodies are public, so a
// missed name is a leak: every capitalised word, and every run of them, counts unless it is a
// word Varde knows is no name. It redacts too much on purpose.

const days = ["mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag", "søndag"]
// Day names, their plurals ("mandager"), definite forms ("mandagen") and short forms ("man").
export const DAY_WORDS: ReadonlySet<string> = new Set(
	[
		...days,
		...days.map((d) => `${d}er`),
		...days.map((d) => `${d}en`),
		"man",
		"tir",
		"ons",
		"tor",
		"fre",
		"lør",
		"søn",
		"hverdag",
		"hverdager",
		"helg",
		"helger",
		"helgen",
		"helligdager",
	].map(foldNorwegian)
)
export const MONTH_WORDS: ReadonlySet<string> = new Set(
	[
		"januar",
		"februar",
		"mars",
		"april",
		"mai",
		"juni",
		"juli",
		"august",
		"september",
		"oktober",
		"november",
		"desember",
	].map(foldNorwegian)
)
// Words that label a contact line. Without them every phone line would hold a "name".
export const LABEL_WORDS: ReadonlySet<string> = new Set(
	[
		"telefon",
		"tlf",
		"vakttelefon",
		"mobil",
		"sms",
		"faks",
		"fax",
		"telefaks",
		"sentralbord",
		"servicetorg",
		"e-post",
		"epost",
		"post",
		"adresse",
		"besøksadresse",
		"postadresse",
		"postboks",
		"kontakt",
		"kontaktinformasjon",
		// "Ring 62 00 00 00" opens many contact lines.
		"ring",
		"åpningstider",
		"telefontid",
		"telefontider",
		"åpent",
		"stengt",
		"døgnåpent",
		"døgnåpen",
		"kl",
	].map(foldNorwegian)
)

export type NameContext = { unitName?: string; places: readonly string[] }

// A capitalised word: a capital letter, then letters or marks, with hyphenated parts kept in
// one word ("Anne-Marie"). The hyphen separates the parts, so nothing overlaps.
const CAPITALISED = /(?<![\p{L}\p{N}\p{M}])\p{Lu}[\p{L}\p{M}]*(?:[-\u2010\u2011][\p{L}\p{M}]+)*/gu
const WHITESPACE_ONLY = /^\s+$/

const fold = (word: string) => foldNorwegian(word.replace(/[\u2010\u2011]/g, "-"))
const wordsOf = (text: string) => text.split(/[\s,()]+/).filter((w) => w !== "")

function staticWord(folded: string): boolean {
	return DAY_WORDS.has(folded) || MONTH_WORDS.has(folded) || LABEL_WORDS.has(folded) || ROLE_WORD_PARTS.has(folded)
}

// Runs of capitalised words that stand next to each other with only spaces between. A word left
// out ends a run, so both sides still count.
function runs(text: string, leftOut: (folded: string) => boolean): string[][] {
	const found: string[][] = []
	let current: string[] = []
	let lastEnd = -1
	for (const m of text.matchAll(CAPITALISED)) {
		const word = m[0]
		const start = m.index
		if (current.length > 0 && !WHITESPACE_ONLY.test(text.slice(lastEnd, start))) {
			found.push(current)
			current = []
		}
		if (leftOut(fold(word))) {
			if (current.length > 0) found.push(current)
			current = []
		} else {
			current.push(word)
		}
		lastEnd = start + word.length
	}
	if (current.length > 0) found.push(current)
	return found
}

export function possibleNames(text: string, ctx: NameContext): string[] {
	const known = new Set<string>()
	for (const place of ctx.places) {
		known.add(fold(place))
		for (const part of place.split(/[\s-]+/)) known.add(fold(part))
	}
	for (const word of wordsOf(ctx.unitName ?? "")) known.add(fold(word))
	const found = runs(text, (w) => staticWord(w) || known.has(w)).map((r) => r.join(" "))
	return [...new Set(found)]
}

// Two or more capitalised words in a row that are not days, months, labels or roles: the shape
// of "Kari Nordmann". The hours name guard in runGates uses it on a value it cannot redact.
export function capitalisedRuns(text: string): string[] {
	return runs(text, staticWord)
		.filter((r) => r.length >= 2)
		.map((r) => r.join(" "))
}
```

- [ ] **Step 5: Change `src/gates/types.ts`**

Replace the two lines `// Used to redact quotes, never stored.` and `personName?: string` with:

```ts
	// Possible person names in the quotes (text/names.ts), used to redact them. Never stored.
	// Required, so a candidate built without the name check does not compile.
	personNames: readonly string[]
```

- [ ] **Step 6: Change `src/gates/run.ts`**

Add the imports `import { evidenceQuotes } from "../schema/lock.ts"` (beside the existing `Evidence, LockField` type import) and `import { capitalisedRuns } from "../text/names.ts"`. Rename the existing single-name `redact` to `redactOne(quotes: readonly string[], personName: string): string[]` (same body, without the undefined check) and the existing `nameSurvives` to `survivesOne(texts: readonly string[], personName: string): boolean` (same body, without the undefined check). Then add:

```ts
// Longest names first, so "Kari Anne Nordmann" becomes one marker before "Kari" is tried.
const longestFirst = (names: readonly string[]) =>
	[...names].filter((n) => n.trim() !== "").sort((a, b) => b.length - a.length)

export function redact(quotes: readonly string[], personNames: readonly string[]): string[] {
	return longestFirst(personNames).reduce((qs, name) => redactOne(qs, name), [...quotes])
}

function nameSurvives(texts: readonly string[], personNames: readonly string[]): boolean {
	return longestFirst(personNames).some((name) => survivesOne(texts, name))
}

function stored(evidence: Evidence, personNames: readonly string[]): Evidence {
	if (evidence.kind === "quote") return { kind: "quote", quotes: redact(evidence.quotes, personNames) }
	if (evidence.kind === "decision" && evidence.original.kind === "quote") {
		return {
			...evidence,
			original: { kind: "quote", quotes: redact(evidence.original.quotes, personNames) },
		}
	}
	return evidence
}

const HOURS_FIELDS = new Set(["openingHours", "phoneHours"])
```

In `runGates`, after the `dropped` check, add:

```ts
	// The hours value is built from the quoted lines and stored as it is, so it cannot be
	// redacted. A run like "Kari Nordmann" in it drops the field.
	if (HOURS_FIELDS.has(c.field) && typeof c.value === "string" && capitalisedRuns(c.value).length > 0) {
		return { ...base, status: "dropped", reason: "the hours text may hold a person name" }
	}
```

and replace the three uses of `c.personName` with `c.personNames`, and the `left` line with:

```ts
	const left = [...evidenceQuotes(evidence), ...(role ? [role] : [])]
```

Delete the old `stored` function.

- [ ] **Step 7: Change the gates**

`src/gates/grounding.ts`: add `normaliseUrl` to the `../text/normalise.ts` import, and a helper and two rules. At the top:

```ts
// "2026-11-06" as "06.11.2026": reasons are read in Norwegian date style.
export const norwegianDate = (iso: string) => iso.split("-").reverse().join(".")
```

At the start of `groundingGate`, before the register check:

```ts
	// My answer in review settles grounding; validity and safety still run.
	if (c.evidence.kind === "decision") {
		return pass("grounding", `my decision of ${norwegianDate(c.evidence.decidedOn)}`)
	}
```

and in the `switch`, before `default`:

```ts
		case "website":
			// The unit's own page is its website, grounded by the fetch itself (spec, "Email and
			// website"); any other address must be in a quote.
			if (typeof c.value === "string" && normaliseUrl(c.value) === normaliseUrl(c.sourceUrl)) {
				return pass("grounding", "the source page itself")
			}
			return quotes.some((q) => quoteHasValue(c.field, c.value, q))
				? pass("grounding")
				: drop("grounding", "no quote holds the value")
```

TypeScript narrows `c.evidence` to quote evidence after the two early returns, so `c.evidence.quotes` still compiles.

`src/gates/agreement.ts`: import `norwegianDate` from `./grounding.ts` and add at the start of `agreementGate`:

```ts
	// I settled the disagreement in review. Without this an accepted answer would come back.
	if (c.evidence.kind === "decision") {
		return pass("agreement", `my decision of ${norwegianDate(c.evidence.decidedOn)}`)
	}
```

`src/gates/safety.ts`: import `evidenceQuotes` from `../schema/lock.ts` and replace the first line of `safetyGate` with:

```ts
	const quotes = evidenceQuotes(c.evidence)
```

In the krisesenter case, accept the centre's own quotes through a decision too:

```ts
			return (c.evidence.kind === "quote" || c.evidence.kind === "decision") &&
				evidenceQuotes(c.evidence).length > 0 &&
				(c.origin === "unitContact" || c.origin === "unitPage")
```

- [ ] **Step 8: Change `test/helpers.ts`**

In `candidate()`, add `personNames: [],` after `origin: "unitContact",`. Then run `grep -ln "personName\b" test/ src/` and change every remaining `personName:` to `personNames: [ ... ]`. The direct calls in `test/run.test.ts` change the same way: `redact(["Ring Karis kontor"], "Kari Nordmann")` becomes `redact(["Ring Karis kontor"], ["Kari Nordmann"])`, and the loop's `redact([...], name)` becomes `redact([...], [name])`.

- [ ] **Step 9: Run the tests to see them pass**

Run: `npx vitest run test/names.test.ts test/run.test.ts test/grounding.test.ts test/agreement.test.ts test/safety.test.ts && npm test`
Expected: PASS, and the whole suite stays green.

- [ ] **Step 10: Show it red once**

In `capitalisedRuns`, change `r.length >= 2` to `r.length >= 3`. Run `npx vitest run test/run.test.ts`: FAIL on "drops an hours value that holds a two-word capitalised run". Restore, run: PASS. Note it for the PR body.

- [ ] **Step 11: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add src/text/names.ts src/extract/roleWords.ts src/gates/types.ts src/gates/run.ts src/gates/grounding.ts src/gates/agreement.ts src/gates/safety.ts test/
git commit -m "feat(pipeline): redact a list of possible names, and let the gates read my decisions"
```

---

### Task 3: Phone numbers in page text, dot-grouped ones too

A number is any run that `phoneDigits` turns into a valid Nkom number. Dotted runs count only in the shapes 2-2-2-2 and 3-2-3, which no time or date has, and `quoteHasPhone` learns the same two shapes so the grounding gate finds them.

**Files:**
- Create: `pipeline/src/text/phone.ts`
- Modify: `pipeline/src/text/normalise.ts`
- Test: `pipeline/test/phone.test.ts`, `pipeline/test/normalise.test.ts` (extend)

**Interfaces:**
- Consumes: `phoneDigits`, `normaliseText` (`text/normalise.ts`), `fitsNumberPlan` (`gates/validity.ts`).
- Produces:
  - `text/normalise.ts`: `MAX_LINE = 2000`; `quoteHasPhone` unchanged in signature.
  - `text/phone.ts`: `type PhoneHit = { text: string; digits: string; index: number }` (`text` is the verbatim run, `index` its offset in the line), `findPhones(line: string): PhoneHit[]`, `isMobileDigits(digits: string): boolean`.

- [ ] **Step 1: Write the failing tests**

Create `pipeline/test/phone.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { findPhones, isMobileDigits } from "../src/text/phone.ts"

const texts = (line: string) => findPhones(line).map((h) => h.text)

describe("findPhones", () => {
	it("finds the shapes Norwegian pages write", () => {
		expect(texts("Telefon: 62 00 00 00")).toEqual(["62 00 00 00"])
		expect(texts("Mobil 900 00 000")).toEqual(["900 00 000"])
		expect(texts("Ring 62000000 i dag")).toEqual(["62000000"])
		expect(texts("Tlf. 6200 0000")).toEqual(["6200 0000"])
		expect(texts("Fra utlandet: +47 62 00 00 00")).toEqual(["+47 62 00 00 00"])
		expect(texts("Ring 113 ved fare")).toEqual(["113"])
		expect(texts("Hjelpetelefon 116 123")).toEqual(["116 123"])
	})

	it("finds dot-grouped numbers in the two shapes no time or date has", () => {
		expect(texts("Telefon 62.00.00.00")).toEqual(["62.00.00.00"])
		expect(texts("Telefon 620.00.000")).toEqual(["620.00.000"])
		expect(findPhones("Telefon 62.00.00.00")[0]?.digits).toBe("62000000")
	})

	it("never reads a time, a date or a postcode as a number", () => {
		expect(texts("Åpent 08.00-15.30")).toEqual([])
		expect(texts("Stengt 27.10.2026")).toEqual([])
		expect(texts("Storgata 1, 2317 Hamar")).toEqual([])
		expect(texts("Klokka 08:00:00")).toEqual([])
	})

	it("finds the number after a postcode in the same run of digits", () => {
		expect(texts("2317 62 00 00 00")).toEqual(["62 00 00 00"])
	})

	it("finds two numbers on one line, in order", () => {
		expect(texts("Telefon 62 00 00 00, faks 62 00 00 01")).toEqual(["62 00 00 00", "62 00 00 01"])
	})

	it("skips a line longer than 2,000 characters, and finishes a 1 MB line fast", () => {
		const long = "1.".repeat(500_000)
		const started = performance.now()
		expect(findPhones(long)).toEqual([])
		expect(performance.now() - started).toBeLessThan(1000)
	})
})

describe("isMobileDigits", () => {
	it("knows a mobile by its first digit 4 or 9 and eight digits", () => {
		expect(isMobileDigits("90000000")).toBe(true)
		expect(isMobileDigits("40000000")).toBe(true)
		expect(isMobileDigits("62000000")).toBe(false)
		expect(isMobileDigits("900")).toBe(false)
	})
})
```

Add to `pipeline/test/normalise.test.ts` (it already imports `quoteHasPhone`):

```ts
describe("quoteHasPhone: dot-grouped numbers", () => {
	it("finds 2-2-2-2 and 3-2-3 dotted numbers", () => {
		expect(quoteHasPhone("Telefon 62.00.00.00", "62 00 00 00")).toBe(true)
		expect(quoteHasPhone("Telefon 620.00.000", "620 00 000")).toBe(true)
	})

	it("still blanks times and dates, so hours never glue onto a number", () => {
		expect(quoteHasPhone("Åpent 08.00-15.30, tlf 62 00 00 00", "62 00 00 00")).toBe(true)
		expect(quoteHasPhone("27.10.2026", "27102026")).toBe(false)
		expect(quoteHasPhone("62.00.00", "620000")).toBe(false)
	})

	it("finishes on a 1 MB run of digits and dots well within a second", () => {
		const started = performance.now()
		quoteHasPhone("12.".repeat(350_000), "62 00 00 00")
		expect(performance.now() - started).toBeLessThan(1000)
	})
})
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run test/phone.test.ts test/normalise.test.ts`
Expected: FAIL, `src/text/phone.ts` does not exist, and the dotted `quoteHasPhone` cases are false.

- [ ] **Step 3: Change `src/text/normalise.ts`**

Add near the top:

```ts
// A line longer than this is not a contact line. Every rule skips it, so no pattern ever runs
// over a page's worth of text (spec, "Field rules").
export const MAX_LINE = 2000

// Dotted numbers in the two shapes no time ("08.00") or date ("27.10.2026") has. The whole
// dotted run must have the shape: no digit or further dotted group on either side.
const DOTTED_2222 = /(?<![\d.:])(\d{2})\.(\d{2})\.(\d{2})\.(\d{2})(?!\d|[.:]\d)/g
const DOTTED_323 = /(?<![\d.:])(\d{3})\.(\d{2})\.(\d{3})(?!\d|[.:]\d)/g

// "62.00.00.00" as "62 00 00 00", so the space rules below read it as a number.
export function undotPhones(text: string): string {
	return text.replace(DOTTED_2222, "$1 $2 $3 $4").replace(DOTTED_323, "$1 $2 $3")
}
```

In `quoteHasPhone`, replace the `withoutTimes` line with:

```ts
	const withoutTimes = undotPhones(normaliseText(quote)).replace(/\d+(?:[.:]\d+)+/g, " ")
```

- [ ] **Step 4: Write `src/text/phone.ts`**

```ts
import { fitsNumberPlan } from "../gates/validity.ts"
import { MAX_LINE, phoneDigits, undotPhones } from "./normalise.ts"

export type PhoneHit = { text: string; digits: string; index: number }

// A run of digits with single spaces or dots between them, with an optional country code. Each
// repetition takes one digit, and the separator before it is optional, so nothing overlaps.
const RUN = /(?<![\d+])(?:\+47[ \u00A0]?|0047[ \u00A0]?)?\d(?:[ \u00A0.]?\d)*(?!\d)/g
const COUNTRY = /^(?:\+47|0047)[ \u00A0]?/
const DOTTED_SHAPE = /^(?:\d{2}\.\d{2}\.\d{2}\.\d{2}|\d{3}\.\d{2}\.\d{3})$/

// Group lengths Norwegian pages write an eight-digit number in. Anything else ("2317 62 00")
// is not read as one number.
const EIGHT = new Set(["8", "2,2,2,2", "3,2,3", "4,4"])

export function isMobileDigits(digits: string): boolean {
	return /^[49]\d{7}$/.test(digits)
}

type Group = { digits: string; start: number; end: number }

function groups(run: string): Group[] {
	return [...run.matchAll(/\d+/g)].map((m) => ({
		digits: m[0],
		start: m.index,
		end: m.index + m[0].length,
	}))
}

// The numbers in one space-grouped run, scanning group by group. At most four groups make one
// number, so this is linear in the run's length.
function spaced(run: string, offset: number, prefix: string): PhoneHit[] {
	const gs = groups(run)
	const hits: PhoneHit[] = []
	let i = 0
	while (i < gs.length) {
		let found: { end: number; digits: string } | undefined
		for (let n = 1; n <= 4 && i + n <= gs.length; n++) {
			const part = gs.slice(i, i + n)
			const digits = part.map((g) => g.digits).join("")
			const shape = part.map((g) => g.digits.length).join(",")
			const whole = i === 0 && i + n === gs.length
			const eight = digits.length === 8 && EIGHT.has(shape)
			// Short numbers (1xx, 116xxx, 0xxxx) only when they are the whole run.
			const short = whole && digits.length !== 8 && (shape === "3" || shape === "5" || shape === "3,3" || shape === "6")
			if ((eight || short) && fitsNumberPlan(digits)) found = { end: i + n, digits }
			if (found !== undefined) break
		}
		if (found === undefined) {
			i++
			continue
		}
		const first = gs[i]
		const last = gs[found.end - 1]
		if (first !== undefined && last !== undefined) {
			const lead = i === 0 ? prefix : ""
			hits.push({
				text: `${lead}${run.slice(first.start, last.end)}`,
				digits: found.digits,
				index: offset + first.start - lead.length,
			})
		}
		i = found.end
	}
	return hits
}

// Every phone number on a line, in order, as the page writes it. A line over MAX_LINE is skipped.
export function findPhones(line: string): PhoneHit[] {
	if (line.length > MAX_LINE) return []
	const hits: PhoneHit[] = []
	for (const m of line.matchAll(RUN)) {
		const raw = m[0]
		const prefix = COUNTRY.exec(raw)?.[0] ?? ""
		const run = raw.slice(prefix.length)
		if (run.includes(".")) {
			// A dotted run counts only as a whole, in one of the two phone shapes.
			if (DOTTED_SHAPE.test(run)) {
				hits.push({ text: raw, digits: phoneDigits(undotPhones(run)), index: m.index })
			}
			continue
		}
		hits.push(...spaced(run, m.index + prefix.length, prefix))
	}
	return hits.map((h) => ({ ...h, digits: phoneDigits(h.text) }))
}
```

- [ ] **Step 5: Run the tests to see them pass**

Run: `npx vitest run test/phone.test.ts test/normalise.test.ts test/grounding.test.ts`
Expected: PASS.

- [ ] **Step 6: Show it red once**

Add `"4,2,2"` to `EIGHT`. Run `npx vitest run test/phone.test.ts`: FAIL on "finds the number after a postcode in the same run of digits" (it reads `2317 62 00` as one number). Restore, run: PASS. Note it for the PR body.

- [ ] **Step 7: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add src/text/normalise.ts src/text/phone.ts test/phone.test.ts test/normalise.test.ts
git commit -m "feat(pipeline): find phone numbers in page lines, dot-grouped ones too"
```

---

### Task 4: The hours formatter

Opening hours stay text. The formatter rewrites only the times into house style: `13.00-18.00`, `13-18` and `kl 13.00 - 18.00` all become `kl. 13:00–18:00`. A time it cannot read is an error the rule turns into a review. The grounding gate learns to ground a formatted value in its raw quotes.

**Files:**
- Create: `pipeline/src/text/hours.ts`
- Modify: `pipeline/src/gates/grounding.ts`, `pipeline/src/gates/validity.ts`
- Test: `pipeline/test/hours.test.ts`, `pipeline/test/grounding.test.ts` (extend), `pipeline/test/validity.test.ts` (extend)

**Interfaces:**
- Consumes: `DAY_WORDS` (`text/names.ts`), `foldNorwegian`, `normaliseText`, `MAX_LINE` (`text/normalise.ts`).
- Produces: `type HoursResult = { ok: true; text: string } | { ok: false; reason: string }`, `formatHours(text: string): HoursResult`, `hasTime(text: string): boolean`, `hoursGrounded(value: string, quotes: readonly string[]): boolean`, `hoursLength(text: string): number` (Unicode code points), all in `text/hours.ts`.

- [ ] **Step 1: Write the failing tests**

Create `pipeline/test/hours.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { formatHours, hasTime, hoursGrounded, hoursLength } from "../src/text/hours.ts"

const D = "\u2013"
const ok = (text: string) => ({ ok: true, text })

describe("formatHours: each input style and its house style", () => {
	const table: [string, string][] = [
		["13.00-18.00", `kl. 13:00${D}18:00`],
		["Mandag 13-18", `Mandag kl. 13:00${D}18:00`],
		["kl 13.00 - 18.00", `kl. 13:00${D}18:00`],
		["Hverdager 08.00 til 15.30", `Hverdager kl. 08:00${D}15:30`],
		["Kveld og natt 15.00-08.00", `Kveld og natt kl. 15:00${D}08:00`],
		["Fra kl 08.00", "Fra kl. 08:00"],
		["Mandag 08-15.30", `Mandag kl. 08:00${D}15:30`],
		["  Tirsdag   10.00\u201312.00 ", `Tirsdag kl. 10:00${D}12:00`],
		["Åpent til 24.00", "Åpent til 24:00"],
	]
	for (const [input, output] of table) {
		it(`${input.trim()} becomes ${output}`, () => expect(formatHours(input)).toEqual(ok(output)))
	}

	it("leaves hours already in house style unchanged, so a second run changes nothing", () => {
		const done = `Mandag kl. 08:00${D}15:30, fredag kl. 10:00${D}12:00`
		expect(formatHours(done)).toEqual(ok(done))
		const once = formatHours("Mandag 08.00-15.30")
		expect(once.ok && formatHours(once.text)).toEqual(once)
	})

	it("keeps day names, other words, dates and phone numbers as the page wrote them", () => {
		expect(formatHours("Stengt 27.10.2026")).toEqual(ok("Stengt 27.10.2026"))
		expect(formatHours("Tlf 61.13.20.00")).toEqual(ok("Tlf 61.13.20.00"))
		expect(formatHours("1-2 ganger i uka")).toEqual(ok("1-2 ganger i uka"))
		expect(formatHours("Helsestasjon 0 til 5 år")).toEqual(ok("Helsestasjon 0 til 5 år"))
	})

	it("refuses a time it cannot read, rather than storing it half tidied", () => {
		for (const bad of ["Åpent 25.00", "Åpent 13.75", "Mandag 08.00-24.30"]) {
			expect(formatHours(bad)).toEqual({ ok: false, reason: "a time the formatter cannot read" })
		}
	})

	it("finishes on a 1 MB line of digits and dots well within a second", () => {
		const started = performance.now()
		formatHours("1.1-".repeat(250_000))
		expect(performance.now() - started).toBeLessThan(1000)
	})
})

describe("hasTime", () => {
	it("sees a time or a range, not a bare count", () => {
		expect(hasTime("kl. 08:00")).toBe(true)
		expect(hasTime("Mandag 13-18")).toBe(true)
		expect(hasTime("1-2 ganger i uka")).toBe(false)
	})
})

describe("hoursGrounded", () => {
	it("grounds a formatted value in its raw quote", () => {
		expect(hoursGrounded(`Hverdager kl. 08:00${D}15:30`, ["Hverdager 08.00-15.30"])).toBe(true)
		expect(hoursGrounded(`kl. 08:00${D}15:30`, ["Telefon 62 00 00 00 (08.00-15.30)"])).toBe(true)
	})

	it("refuses a time or a word the quote does not hold", () => {
		expect(hoursGrounded(`Hverdager kl. 08:00${D}16:00`, ["Hverdager 08.00-15.30"])).toBe(false)
		expect(hoursGrounded(`Helger kl. 08:00${D}15:30`, ["Hverdager 08.00-15.30"])).toBe(false)
		expect(hoursGrounded(`kl. 08:00${D}15:30`, ["Åpent 25.00-15.30"])).toBe(false)
	})
})

describe("hoursLength", () => {
	it("counts code points, not UTF-16 units", () => {
		expect(hoursLength("Åpent \u{1F600}")).toBe(7)
	})
})
```

Add to `pipeline/test/grounding.test.ts`:

```ts
it("grounds opening hours by their times and words, not as a verbatim substring", () => {
	const c = candidate({
		field: "openingHours",
		value: "kl. 08:00\u201315:30",
		evidence: { kind: "quote", quotes: ["Telefon:\u00A062 00 00 00 (hverdager 08.00\u201315.30)"] },
		origin: "unitPage",
	})
	expect(groundingGate(c, context()).pass).toBe(true)
	expect(groundingGate({ ...c, value: "kl. 08:00\u201316:00" }, context()).pass).toBe(false)
})
```

Add to `pipeline/test/validity.test.ts`:

```ts
it("counts hours in code points: 200 emoji are 200, not 400", () => {
	const c = candidate({ field: "openingHours", value: "\u{1F600}".repeat(200) })
	expect(validityGate(c, context()).pass).toBe(true)
})
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run test/hours.test.ts test/grounding.test.ts test/validity.test.ts`
Expected: FAIL, `src/text/hours.ts` does not exist.

- [ ] **Step 3: Write `src/text/hours.ts`**

```ts
import { DAY_WORDS } from "./names.ts"
import { foldNorwegian, MAX_LINE, normaliseText } from "./normalise.ts"

export type HoursResult = { ok: true; text: string } | { ok: false; reason: string }

const DASH = "\u2013"
const UNREADABLE: HoursResult = { ok: false, reason: "a time the formatter cannot read" }

// One pattern, two alternatives, tried left to right at each place: a range first, then a single
// time. A range is "kl" (optional), a time with or without minutes, a dash or "til", and a second
// time. A single time always has minutes. Neither may sit inside a longer dotted run (a date or a
// dotted phone number), which the lookbehind and lookahead refuse. Text is collapsed to single
// spaces first, so every space in the pattern is a single optional one.
const TIMES =
	/(?<![\p{L}\d.:])(?:(kl\.? ?)?(\d{1,2})(?:[.:](\d{2}))? ?(?:-|\u2013|\u2014|til) ?(?:kl\.? ?)?(\d{1,2})(?:[.:](\d{2}))?(?!\d|[.:]\d)|(kl\.? ?)?(\d{1,2})[.:](\d{2})(?!\d|[.:]\d))/giu

const pad = (n: number) => String(n).padStart(2, "0")

// Hours 0 to 24 and minutes 0 to 59; 24 only as 24:00.
function clock(hours: string | undefined, minutes: string | undefined): string | undefined {
	const h = Number(hours)
	const m = minutes === undefined ? 0 : Number(minutes)
	if (!Number.isInteger(h) || h > 24 || m > 59 || (h === 24 && m !== 0)) return undefined
	return `${pad(h)}:${pad(m)}`
}

// A bare range without minutes ("13-18") is a time only next to "kl" or a day name, so
// "1-2 ganger i uka" stays text.
function timeContext(text: string): boolean {
	if (/(?<![\p{L}])kl(?![\p{L}])/iu.test(text)) return true
	return text.split(/[^\p{L}]+/u).some((w) => DAY_WORDS.has(foldNorwegian(w)))
}

export function formatHours(text: string): HoursResult {
	if (text.length > MAX_LINE) return UNREADABLE
	const collapsed = text.replace(/\s+/g, " ").trim()
	const bareAllowed = timeContext(collapsed)
	let failed = false
	const out = collapsed.replace(TIMES, (match, _kl1, h1, m1, h2, m2, kl3, h3, m3) => {
		if (h1 !== undefined) {
			if (m1 === undefined && m2 === undefined && !bareAllowed) return match
			const from = clock(h1, m1)
			const to = clock(h2, m2)
			if (from === undefined || to === undefined) {
				failed = true
				return match
			}
			return `kl. ${from}${DASH}${to}`
		}
		const at = clock(h3, m3)
		if (at === undefined) {
			failed = true
			return match
		}
		return kl3 === undefined ? at : `kl. ${at}`
	})
	return failed ? UNREADABLE : { ok: true, text: out }
}

const FORMATTED_TIME = /\d{2}:\d{2}(?:\u2013\d{2}:\d{2})?/g

// Whether the text holds a time or a time range the formatter reads.
export function hasTime(text: string): boolean {
	const formatted = formatHours(text)
	return formatted.ok && /\d{2}:\d{2}/.test(formatted.text)
}

const wordsOf = (text: string) =>
	normaliseText(text)
		.split(/[^\p{L}]+/u)
		.filter((w) => w.length >= 2 && w !== "kl")

// A formatted value is grounded when every time range in it is one its quotes give once
// formatted, and every word in it is a word of the quotes. The value is never a verbatim
// substring of a raw quote ("08.00-15.30" against "kl. 08:00\u201315:30"), so the plain text
// check cannot ground it.
export function hoursGrounded(value: string, quotes: readonly string[]): boolean {
	const formatted = quotes.map(formatHours)
	if (formatted.some((f) => !f.ok)) return false
	const text = formatted.map((f) => (f.ok ? f.text : "")).join(" ")
	const times = new Set(text.match(FORMATTED_TIME) ?? [])
	const words = new Set(wordsOf(text))
	return (
		(value.match(FORMATTED_TIME) ?? []).every((t) => times.has(t)) &&
		wordsOf(value).every((w) => words.has(w))
	)
}

// The length the 200-character limit counts: Unicode code points of the stored text.
export function hoursLength(text: string): number {
	return [...text].length
}
```

- [ ] **Step 4: Teach the gates**

`src/gates/grounding.ts`: import `hoursGrounded` from `../text/hours.ts`, and in the `switch` before `case "website":` add:

```ts
		case "openingHours":
		case "phoneHours":
			return typeof c.value === "string" && hoursGrounded(c.value, quotes)
				? pass("grounding")
				: drop("grounding", "no quote holds these hours")
```

`src/gates/validity.ts`: import `hoursLength` from `../text/hours.ts` and change the hours case to:

```ts
		case "openingHours":
		case "phoneHours":
			return hoursLength(c.value) <= MAX_HOURS
				? pass("validity")
				: review("validity", `hours are longer than ${MAX_HOURS} characters`)
```

- [ ] **Step 5: Run the tests to see them pass**

Run: `npx vitest run test/hours.test.ts test/grounding.test.ts test/validity.test.ts && npm test`
Expected: PASS.

- [ ] **Step 6: Show it red once**

In `clock`, change `h > 24` to `h > 25`. Run `npx vitest run test/hours.test.ts`: FAIL on "refuses a time it cannot read" (`25.00` becomes `25:00`). Restore, run: PASS. Note it for the PR body.

- [ ] **Step 7: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add src/text/hours.ts src/gates/grounding.ts src/gates/validity.ts test/hours.test.ts test/grounding.test.ts test/validity.test.ts
git commit -m "feat(pipeline): format opening hours into house style and ground them by their times"
```

---

### Task 5: "Storgata 1 A" is Kartverket's "Storgata 1A"

`pickAddress` compares street numbers with the space between the number and the letter removed, and the stored value is Kartverket's own address text. Before writing the rule I check Kartverket's form against one recorded API answer for a rådhus.

**Files:**
- Create: `pipeline/test/fixtures/kartverket/radhus.json`
- Modify: `pipeline/src/text/address.ts`, `pipeline/src/registers/kartverket.ts`, `pipeline/src/gates/types.ts`, `pipeline/src/gates/grounding.ts`, `pipeline/test/fixtures/README.md`
- Test: `pipeline/test/kartverket.test.ts` (extend), `pipeline/test/address.test.ts` (extend), `pipeline/test/grounding.test.ts` (extend)

**Interfaces:**
- Consumes: `splitAddress`, `normaliseText`, `quoteHasText`.
- Produces:
  - `text/address.ts`: `streetKey(text: string): string`, `quoteHasAddress(quote: string, value: string): boolean`.
  - `gates/types.ts`: `AddressHit = { addressId: string; kommune: string; text?: string }` (`text` is Kartverket's `adressetekst`).
  - `registers/kartverket.ts`: `pickAddress` returns `text`; `AddressRecord` unchanged.

- [ ] **Step 1: Record one Kartverket answer for a rådhus**

The rådhus of a kommune that does not block ClaudeBot is a public building, and its address is public. From `pipeline/`, list the street addresses Brreg gives the Innlandet kommuner (skipping the seven blocking ones and post boxes):

```bash
node --input-type=module -e '
const { Crawler } = await import("./src/net/crawler.ts")
const { httpsTransport } = await import("./src/net/http.ts")
const { systemClock } = await import("./src/net/clock.ts")
const { AllowList } = await import("./src/net/allowList.ts")
const { kommuneSitesQuery } = await import("./src/registers/brreg.ts")
const crawler = new Crawler({ transport: httpsTransport, clock: systemClock, allowList: new AllowList() })
const BLOCKING = new Set(["3403", "3412", "3413", "3414", "3415", "3417", "3419"])
for (let page = 0; page < 4; page++) {
	const res = await crawler.get(kommuneSitesQuery(page), "json")
	if (!res.ok) break
	for (const u of JSON.parse(res.body)._embedded?.enheter ?? []) {
		const a = u.forretningsadresse ?? {}
		const street = (a.adresse ?? [])[0] ?? ""
		if (a.kommunenummer?.startsWith("34") && !BLOCKING.has(a.kommunenummer) && !/^postboks/i.test(street)) {
			console.log(a.kommunenummer, street, a.postnummer)
		}
	}
}'
```

Pick one whose house number has a letter if any does, else any one. Then ask Kartverket and keep only that rådhus's record:

```bash
node --input-type=module -e '
const [street, kommune] = process.argv.slice(1)
const { writeFileSync, mkdirSync } = await import("node:fs")
const { Crawler } = await import("./src/net/crawler.ts")
const { httpsTransport } = await import("./src/net/http.ts")
const { systemClock } = await import("./src/net/clock.ts")
const { AllowList } = await import("./src/net/allowList.ts")
const { addressQuery } = await import("./src/registers/kartverket.ts")
const crawler = new Crawler({ transport: httpsTransport, clock: systemClock, allowList: new AllowList() })
const res = await crawler.get(addressQuery(street, kommune), "json")
if (!res.ok) { console.log("not fetched:", res.reason); process.exit(1) }
const body = JSON.parse(res.body)
const keep = ["adressetekst", "adresseid", "nummer", "bokstav", "kommunenummer", "kommunenavn", "postnummer", "poststed"]
const hits = (body.adresser ?? []).filter((a) => a.adressetekst?.toLowerCase().replace(/\s/g, "") === street.toLowerCase().replace(/\s/g, ""))
console.log("records:", (body.adresser ?? []).length, "matching:", hits.length, "keys:", Object.keys(hits[0] ?? {}).join(","))
mkdirSync("test/fixtures/kartverket", { recursive: true })
const record = Object.fromEntries(keep.filter((k) => hits[0]?.[k] !== undefined).map((k) => [k, hits[0][k]]))
writeFileSync("test/fixtures/kartverket/radhus.json", JSON.stringify({ metadata: { totaltAntallTreff: 1 }, adresser: [record] }, null, "\t") + "\n")
' "<street and number>" "<kommune number>"
```

Expected: `matching: 1`, and the keys include `adressetekst`, `adresseid`, `kommunenummer` and `postnummer`. If `adresseid` is not among the keys, stop: PR 2's parser reads a key Kartverket does not send, and that is a finding for me before this task goes on. Open `test/fixtures/kartverket/radhus.json` and check that it holds only the rådhus record. Note how `adressetekst` writes a letter (`1A` or `1 A`) for the PR body.

- [ ] **Step 2: Write the failing tests**

Add to `pipeline/test/kartverket.test.ts`:

```ts
import { readFileSync } from "node:fs"

const radhus = JSON.parse(
	readFileSync(new URL("./fixtures/kartverket/radhus.json", import.meta.url), "utf8")
)

describe("pickAddress: a house letter", () => {
	it("matches the recorded rådhus answer, with a space before the letter or without", () => {
		const r = radhus.adresser[0]
		const spaced = String(r.adressetekst).replace(/(\d)(\p{L})$/u, "$1 $2")
		const hit = pickAddress(records(r), `${spaced}, ${r.postnummer} ${r.poststed}`)
		expect(hit).toEqual({ addressId: r.adresseid, kommune: r.kommunenummer, text: r.adressetekst })
	})

	it("reads Storgata 1 A as Storgata 1A, and gives Kartverket's text", () => {
		const hit = pickAddress(records(record("a1", "Storgata 1A")), "Storgata 1 A, 2609 Lillehammer")
		expect(hit).toEqual({ addressId: "a1", kommune: "3405", text: "Storgata 1A" })
	})

	it("never reads Storgata 1 as Storgata 1A, nor Storgata 1 og 2 as a letter", () => {
		expect(pickAddress(records(record("a1", "Storgata 1A")), "Storgata 1, 2609 Lillehammer")).toBeUndefined()
		expect(pickAddress(records(record("a1", "Storgata 1A")), "Storgata 1 og 2, 2609 Lillehammer")).toBeUndefined()
	})
})
```

(`records` and `record` are the helpers already at the top of the file; `record` takes `(adresseid, adressetekst, postnummer)`. Pass the recorded object to `records` as it is: `parseAddressSearch` keeps only the keys it reads.)

Add to `pipeline/test/address.test.ts`:

```ts
import { quoteHasAddress, streetKey } from "../src/text/address.ts"

describe("streetKey and quoteHasAddress", () => {
	it("joins a house letter to its number", () => {
		expect(streetKey("Storgata 1 A")).toBe("storgata 1a")
		expect(streetKey("Storgata 12")).toBe("storgata 12")
		expect(streetKey("Storgata 1 og 2")).toBe("storgata 1 og 2")
	})

	it("finds Kartverket's form in the page's quote, street and postcode", () => {
		expect(quoteHasAddress("Besøksadresse: Storgata 1 A, 2609 Lillehammer", "Storgata 1A, 2609 Lillehammer")).toBe(true)
		expect(quoteHasAddress("Storgata 1 A\n2609 Lillehammer", "Storgata 1A, 2609 Lillehammer")).toBe(true)
		expect(quoteHasAddress("Storgata 12, 2609 Lillehammer", "Storgata 1, 2609 Lillehammer")).toBe(false)
		expect(quoteHasAddress("Storgata 1, 2610 Lillehammer", "Storgata 1, 2609 Lillehammer")).toBe(false)
	})
})
```

Add to `pipeline/test/grounding.test.ts`:

```ts
it("grounds Kartverket's address text in the page's own spelling", () => {
	const c = candidate({
		field: "address",
		value: "Storgata 1A, 2317 Hamar",
		evidence: { kind: "quote", quotes: ["Besøksadresse: Storgata 1 A, 2317 Hamar"] },
	})
	const page = "Besøksadresse: Storgata 1 A, 2317 Hamar"
	expect(groundingGate(c, context({ pageText: () => page })).pass).toBe(true)
})
```

- [ ] **Step 3: Run them to see them fail**

Run: `npx vitest run test/kartverket.test.ts test/address.test.ts test/grounding.test.ts`
Expected: FAIL, `streetKey` and `quoteHasAddress` do not exist, and `pickAddress` gives no `text`.

- [ ] **Step 4: Change `src/text/address.ts`**

Add `quoteHasText` to the `./normalise.ts` import, then:

```ts
// The street as Kartverket compares it: normalised, with a single house letter joined to its
// number. "Storgata 1 A" and "Storgata 1A" are one address; "Storgata 1 og 2" keeps its space,
// because "og" is a word, not a letter.
export function streetKey(text: string): string {
	return normaliseText(text).replace(/(\d) (\p{L})(?![\p{L}\p{N}])/gu, "$1$2")
}

// The quote holds the value's street (letter joined) and its postcode, each as a whole word. A
// two-line page address ("Storgata 1 A" over "2609 Lillehammer") is one quote, so it counts.
export function quoteHasAddress(quote: string, value: string): boolean {
	const parts = splitAddress(value)
	if (parts === undefined) return quoteHasText(quote, value)
	const text = streetKey(quote)
	if (!quoteHasText(text, streetKey(parts.street))) return false
	return parts.postcode === undefined || quoteHasText(text, parts.postcode)
}
```

- [ ] **Step 5: Change `src/registers/kartverket.ts` and `src/gates/types.ts`**

In `gates/types.ts`:

```ts
// text is Kartverket's own address text ("Storgata 1A"), the form verify stores.
export type AddressHit = { addressId: string; kommune: string; text?: string }
```

In `registers/kartverket.ts`, import `streetKey` from `../text/address.ts`, and in `pickAddress` replace the filter's street test and the return:

```ts
	const wantedStreet = streetKey(parts.street)
	const hits = records.filter(
		(r) =>
			streetKey(r.text) === wantedStreet &&
			(parts.postcode === undefined || r.postcode === parts.postcode)
	)
	const [hit] = hits
	if (hit === undefined || new Set(hits.map((h) => h.addressId)).size !== 1) return undefined
	return { addressId: hit.addressId, kommune: hit.kommune, text: hit.text }
```

Remove the now unused `normaliseText` import if Biome flags it.

- [ ] **Step 6: Ground addresses by street key**

In `src/gates/grounding.ts`, import `quoteHasAddress` from `../text/address.ts` and change `quoteHasValue`:

```ts
	if (field === "address") return quoteHasAddress(quote, value)
```

(before the final `return quoteHasText(quote, value)`).

- [ ] **Step 7: Credit the recorded answer**

In `pipeline/test/fixtures/README.md`, replace the last paragraph with:

```markdown
Two exceptions hold real public data:

- `klass/codes-at-2026-11-03.json`: real KLASS classification 131 codes for Innlandet and
  Oslo, public reference data from SSB under CC BY 4.0.
- `kartverket/radhus.json`: one answer from Kartverket's address API for a rådhus, a public
  building, trimmed to the keys the reader uses. It shows how Kartverket writes a house
  number. Kartverket, CC BY 4.0. Recorded <dd.mm.yyyy>.
```

Run `date +"%Y-%m-%d %A"` in the same batch and fill in the date.

- [ ] **Step 8: Run the tests to see them pass**

Run: `npx vitest run test/kartverket.test.ts test/address.test.ts test/grounding.test.ts && npm test`
Expected: PASS. The existing `pickAddress` tests still pass: their records give `text` too, so update any `toEqual({ addressId, kommune })` there to include `text`.

- [ ] **Step 9: Show it red once**

In `streetKey`, drop the `.replace(...)`. Run `npx vitest run test/kartverket.test.ts`: FAIL on "reads Storgata 1 A as Storgata 1A". Restore, run: PASS. Note it for the PR body.

- [ ] **Step 10: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add src/text/address.ts src/registers/kartverket.ts src/gates/types.ts src/gates/grounding.ts test/fixtures/kartverket/radhus.json test/fixtures/README.md test/kartverket.test.ts test/address.test.ts test/grounding.test.ts
git commit -m "feat(pipeline): match a house letter with or without its space, and store Kartverket's form"
```

---

### Task 6: The page reader, CMS boxes and the contact block

`readUnitPage` reads a cached page into the adapter's main text plus any CMS contact or hours box outside it, as lines that know which ones are headings. `contactBlocks` finds the unit's contact block: the CMS box first, then the lines under a Kontakt heading. The box selectors come from fetched pages in this task, never from a guess.

**Files:**
- Modify: `pipeline/src/adapters/clean.ts`, `pipeline/src/adapters/read.ts`, `pipeline/src/extract/roleWords.ts` (only if Step 9 finds role words)
- Create: `pipeline/src/extract/cmsBoxes.ts`, `pipeline/src/extract/page.ts`, `pipeline/src/extract/contactBlock.ts`, `pipeline/test/fixtures/pages/kontakt-heading.html`, `pipeline/test/fixtures/pages/shared-page.html`, `pipeline/test/fixtures/pages/test-box.html`, `pipeline/test/fixtures/pages/<cms>-contact-box.html` (one per CMS a box is found for)
- Modify: `pipeline/test/fixtures/README.md`
- Test: `pipeline/test/page.test.ts`, `pipeline/test/contactBlock.test.ts`, `pipeline/test/adapters.test.ts` (must stay green unchanged)

**Interfaces:**
- Consumes: `mainText`'s cleaning rules, `SITE_RULES`, `AdapterName`, `ContactBlock` (Task 1), `normaliseText`.
- Produces:
  - `adapters/clean.ts`: `type TextLine = { text: string; heading?: number }` (heading level 1 to 6), `textLines($: CheerioAPI, selector: string, pageUrl: string): TextLine[] | undefined`; `mainText` keeps its signature and output.
  - `adapters/read.ts`: `readPageWith(html: string, url: string): { result: AdapterResult; selector: string; lines: TextLine[] }`; `readPage` unchanged.
  - `extract/cmsBoxes.ts`: `type CmsBox = { adapter: "acos" | "corepublish" | "sitevision"; kind: "contact" | "hours"; tag: string; className?: string; id?: string }`, `CMS_BOXES: readonly CmsBox[]`, `boxSelector(box: CmsBox): string`.
  - `extract/page.ts`: `type PageBox = { kind: "contact" | "hours"; lines: TextLine[]; inMain: boolean }`, `type UnitPage = { adapter: AdapterName; fallback: boolean; main: TextLine[]; boxes: PageBox[]; text: string }`, `readUnitPage(html: string, url: string, boxes?: readonly CmsBox[]): UnitPage`, `allLines(page: UnitPage): string[]` (main lines, then the lines of boxes outside main).
  - `extract/contactBlock.ts`: `contactBlocks(page: UnitPage): ContactBlock[]`, `hoursLines(page: UnitPage): { source: "cms" | "heading"; lines: string[] } | undefined`, `headingIs(text: string, words: ReadonlySet<string>): boolean`.

- [ ] **Step 1: Write the hand fixtures for the mechanism**

These three use shapes every CMS shares (a heading, paragraphs, a box after `<main>`). Their values are fictional.

`pipeline/test/fixtures/pages/kontakt-heading.html`:

```html
<!DOCTYPE html>
<html lang="nb">
<head><meta charset="utf-8"><meta name="acos-cmscontext" content="w1$o1$m1$sl0" /><title>Eksempel helsestasjon</title></head>
<body>
<main class="main">
<h1>Eksempel helsestasjon</h1>
<p>Helsestasjonen er gratis, og du trenger ikke henvisning.</p>
<h2>Kontakt oss</h2>
<p><strong>Telefon:</strong></p>
<p>62 00 00 00</p>
<p>E-post: <a href="mailto:helsestasjon@eksempel.kommune.no">helsestasjon@eksempel.kommune.no</a></p>
<h2>Åpningstider</h2>
<p>Mandag til fredag 08.00-15.30</p>
<h2>Les mer</h2>
<p>Vaksiner for barn.</p>
</main>
</body>
</html>
```

`pipeline/test/fixtures/pages/shared-page.html`:

```html
<!DOCTYPE html>
<html lang="nb">
<head><meta charset="utf-8"><meta name="acos-cmscontext" content="w1$o1$m1$sl0" /><title>Helsestasjoner</title></head>
<body>
<main class="main">
<h1>Helsestasjoner i Eksempel</h1>
<h2>Eksempel helsestasjon sentrum</h2>
<h3>Kontakt</h3>
<p>Telefon: 62 00 00 01</p>
<h2>Eksempel helsestasjon nord</h2>
<h3>Kontakt</h3>
<p>Telefon: 62 00 00 02</p>
<h2>Eksempel helsestasjon sør</h2>
<h3>Kontakt</h3>
<p>Telefon: 62 00 00 03</p>
</main>
</body>
</html>
```

`pipeline/test/fixtures/pages/test-box.html` (a box outside `<main>`, a hidden copy, and a heading marker a page tries to forge):

```html
<!DOCTYPE html>
<html lang="nb">
<head><meta charset="utf-8"><meta name="acos-cmscontext" content="w1$o1$m1$sl0" /><title>Eksempel</title></head>
<body>
<main class="main">
<h1>Eksempel helsestasjon</h1>
<p>Drop-in hver tirsdag.</p>
<p>Ikke en overskrift: &#0;2&#0;Kontakt</p>
</main>
<aside class="testboks">
<h2>Kontakt oss</h2>
<p>Telefon: 62 00 00 00</p>
<p hidden>Telefon: 900 00 000</p>
</aside>
<div class="testtider"><p>Mandag 08.00-15.30</p></div>
</body>
</html>
```

- [ ] **Step 2: Write the failing tests**

Create `pipeline/test/page.test.ts`:

```ts
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import type { CmsBox } from "../src/extract/cmsBoxes.ts"
import { allLines, readUnitPage } from "../src/extract/page.ts"

const page = (name: string) => readFileSync(new URL(`./fixtures/pages/${name}`, import.meta.url), "utf8")
const K = "https://www.eksempel.kommune.no/helse/helsestasjon/"
const TEST_BOXES: readonly CmsBox[] = [
	{ adapter: "acos", kind: "contact", tag: "aside", className: "testboks" },
	{ adapter: "acos", kind: "hours", tag: "div", className: "testtider" },
]

describe("readUnitPage", () => {
	it("marks headings with their level and keeps every other line as mainText writes it", () => {
		const p = readUnitPage(page("kontakt-heading.html"), K, [])
		expect(p.adapter).toBe("acos")
		expect(p.main.slice(0, 4)).toEqual([
			{ text: "Eksempel helsestasjon", heading: 1 },
			{ text: "Helsestasjonen er gratis, og du trenger ikke henvisning." },
			{ text: "Kontakt oss", heading: 2 },
			{ text: "Telefon:" },
		])
	})

	it("adds a box outside main to the page text, and leaves out what a visitor cannot see", () => {
		const p = readUnitPage(page("test-box.html"), K, TEST_BOXES)
		expect(p.boxes.map((b) => [b.kind, b.inMain])).toEqual([
			["contact", false],
			["hours", false],
		])
		expect(p.text).toContain("Telefon: 62 00 00 00")
		expect(p.text).toContain("Mandag 08.00-15.30")
		expect(p.text).not.toContain("900 00 000")
		expect(allLines(p)).toContain("Telefon: 62 00 00 00")
	})

	it("never lets page text forge a heading", () => {
		const p = readUnitPage(page("test-box.html"), K, TEST_BOXES)
		const forged = p.main.find((l) => l.text.includes("Ikke en overskrift"))
		expect(forged?.heading).toBeUndefined()
	})

	it("reads no box on a fallback page", () => {
		const p = readUnitPage(page("unknown.html"), K, TEST_BOXES)
		expect(p.fallback).toBe(true)
		expect(p.boxes).toEqual([])
	})
})
```

Create `pipeline/test/contactBlock.test.ts`:

```ts
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import type { CmsBox } from "../src/extract/cmsBoxes.ts"
import { contactBlocks, hoursLines } from "../src/extract/contactBlock.ts"
import { readUnitPage } from "../src/extract/page.ts"

const page = (name: string) => readFileSync(new URL(`./fixtures/pages/${name}`, import.meta.url), "utf8")
const K = "https://www.eksempel.kommune.no/helse/helsestasjon/"
const TEST_BOXES: readonly CmsBox[] = [
	{ adapter: "acos", kind: "contact", tag: "aside", className: "testboks" },
	{ adapter: "acos", kind: "hours", tag: "div", className: "testtider" },
]

describe("contactBlocks", () => {
	it("takes the lines under a Kontakt heading until the next heading, named by the heading above it", () => {
		const blocks = contactBlocks(readUnitPage(page("kontakt-heading.html"), K, []))
		expect(blocks).toEqual([
			{
				source: "heading",
				heading: "Eksempel helsestasjon",
				lines: ["Telefon:", "62 00 00 00", "E-post: helsestasjon@eksempel.kommune.no"],
			},
		])
	})

	it("takes a CMS contact box first", () => {
		const blocks = contactBlocks(readUnitPage(page("test-box.html"), K, TEST_BOXES))
		expect(blocks[0]).toEqual({ source: "cms", lines: ["Kontakt oss", "Telefon: 62 00 00 00"] })
	})

	it("gives each block of a shared page the heading that names its service", () => {
		const blocks = contactBlocks(readUnitPage(page("shared-page.html"), K, []))
		expect(blocks.map((b) => [b.heading, b.lines])).toEqual([
			["Eksempel helsestasjon sentrum", ["Telefon: 62 00 00 01"]],
			["Eksempel helsestasjon nord", ["Telefon: 62 00 00 02"]],
			["Eksempel helsestasjon sør", ["Telefon: 62 00 00 03"]],
		])
	})

	it("finds a heading block on a fallback page too", () => {
		const html = "<html><body><main><h1>Eksempel</h1><h2>Kontaktinformasjon:</h2><p>Tlf 62 00 00 00</p></main></body></html>"
		const blocks = contactBlocks(readUnitPage(html, K, []))
		expect(blocks).toEqual([{ source: "heading", heading: "Eksempel", lines: ["Tlf 62 00 00 00"] }])
	})
})

describe("hoursLines", () => {
	it("takes the CMS hours box first, then the lines under an Åpningstider heading", () => {
		expect(hoursLines(readUnitPage(page("test-box.html"), K, TEST_BOXES))).toEqual({
			source: "cms",
			lines: ["Mandag 08.00-15.30"],
		})
		expect(hoursLines(readUnitPage(page("kontakt-heading.html"), K, []))).toEqual({
			source: "heading",
			lines: ["Mandag til fredag 08.00-15.30"],
		})
	})

	it("is undefined when the page has neither", () => {
		expect(hoursLines(readUnitPage(page("shared-page.html"), K, []))).toBeUndefined()
	})
})
```

- [ ] **Step 3: Run them to see them fail**

Run: `npx vitest run test/page.test.ts test/contactBlock.test.ts`
Expected: FAIL, the modules do not exist.

- [ ] **Step 4: Build `mainText` on `textLines` in `src/adapters/clean.ts`**

Replace `mainText` with:

```ts
export type TextLine = { text: string; heading?: number }

const HEADINGS = "h1, h2, h3, h4, h5, h6"
// A heading's level rides on its line between two NUL characters. Pages cannot forge it: every
// NUL already in the page's text is removed first.
const MARK = "\u0000"
const MARKED = /^\u0000([1-6])\u0000/
const ANY_MARK = /\u0000[1-6]?\u0000?/g

// The visible text of the first element the selector finds, one line per block, each link as
// its text followed by its address (PR 1's contract), with each heading's level. undefined
// when there is no such element, when it or an ancestor is hidden, or when it holds no text.
export function textLines($: CheerioAPI, selector: string, pageUrl: string): TextLine[] | undefined {
	const root = $(selector).first()
	if (root.length === 0) return undefined
	const hidden = root
		.parents()
		.addBack()
		.filter((_, el) => {
			const node = $(el)
			return node.is(HIDDEN) || HIDDEN_STYLE.test(node.attr("style") ?? "")
		})
	if (hidden.length > 0) return undefined
	root.find(DROP).remove()
	root
		.find("[style]")
		.filter((_, el) => HIDDEN_STYLE.test($(el).attr("style") ?? ""))
		.remove()
	root.find("a[href]").each((_, el) => {
		const link = $(el)
		const text = link.text().replace(/\s+/g, " ").trim()
		const target = linkTarget(link.attr("href") ?? "", pageUrl)
		if (target !== undefined && !text.includes(target)) {
			link.text(text === "" ? target : `${text} ${target}`)
		}
	})
	root
		.find("*")
		.addBack()
		.contents()
		.each((_, node) => {
			const text = node as { type?: unknown; data?: unknown }
			if (text.type === "text" && typeof text.data === "string") text.data = text.data.replaceAll(MARK, "")
		})
	root.find(HEADINGS).each((_, el) => {
		const node = $(el)
		node.text(`${MARK}${el.tagName.slice(1)}${MARK}${node.text()}`)
	})
	root.find("br").replaceWith("\n")
	root.find(BLOCK).each((_, el) => {
		$(el).prepend("\n").append("\n")
	})
	const lines: TextLine[] = []
	for (const raw of root.text().split("\n")) {
		const level = MARKED.exec(raw)?.[1]
		const text = raw.replace(ANY_MARK, "").replace(/\s+/g, " ").trim()
		if (text === "") continue
		lines.push(level === undefined ? { text } : { text, heading: Number(level) })
	}
	return lines.length === 0 ? undefined : lines
}

export function mainText($: CheerioAPI, selector: string, pageUrl: string): string | undefined {
	return textLines($, selector, pageUrl)
		?.map((l) => l.text)
		.join("\n")
}
```

A root that is itself a heading (a site rule pointing at an `<h1>`) is not marked, since `find` skips the root; no rule does that.

Run: `npx vitest run test/adapters.test.ts`
Expected: PASS unchanged. If a test fails, the line output moved: fix `textLines`, never the test.

- [ ] **Step 5: Return the selector and the lines from `src/adapters/read.ts`**

Replace `found`, `fallback` and `readPage` with:

```ts
import { mainText, type TextLine, textLines } from "./clean.ts"

export type PageRead = { result: AdapterResult; selector: string; lines: TextLine[] }

const read = (adapter: AdapterName, selector: string, lines: TextLine[], fallback: boolean): PageRead => ({
	result: { adapter, text: lines.map((l) => l.text).join("\n"), origin: "unitPage", fallback },
	selector,
	lines,
})

// Everything else falls back to <main>, marked, so PR 3 can tell its values apart.
const fallback = ($: CheerioAPI, url: string): PageRead =>
	read("fallback", "main", textLines($, "main", url) ?? [], true)

// The page's main text, by the site rule for its host, else the first CMS adapter that knows
// the page. A rule or adapter whose element is missing (a redesign) falls back, marked. The
// selector and the lines go to PR 3's page reader.
export function readPageWith(html: string, url: string): PageRead {
	const $ = load(html)
	const host = siteHost(url)
	const rule = SITE_RULES.find((r) => siteHost(`https://${r.host}/`) === host)
	if (rule !== undefined) {
		const lines = textLines($, rule.selector, url)
		return lines === undefined ? fallback($, url) : read("siteRule", rule.selector, lines, false)
	}
	const cms = CMS.find((c) => c.detect(html, $))
	for (const selector of cms?.selectors ?? []) {
		const lines = textLines($, selector, url)
		if (lines !== undefined && cms !== undefined) return read(cms.name, selector, lines, false)
	}
	return fallback($, url)
}

export function readPage(html: string, url: string): AdapterResult {
	return readPageWith(html, url).result
}
```

Remove the `mainText` import if it is no longer used in `read.ts`.

- [ ] **Step 6: Write `src/extract/cmsBoxes.ts` (no boxes yet)**

```ts
// CMS boxes that hold a unit's contact details or opening hours, often outside the main
// element. Each entry was found on a fetched page (tag names, ids and classes only) and says
// where and when. A CMS with no entry gets none: the Kontakt heading rule still runs.
export type CmsBox = {
	adapter: "acos" | "corepublish" | "sitevision"
	kind: "contact" | "hours"
	tag: string
	className?: string
	id?: string
}

export const CMS_BOXES: readonly CmsBox[] = []

const IDENT = /^[A-Za-z][\w-]*$/

// "aside.kontaktboks", "div#apningstider". Only plain identifiers, so a table entry can never
// smuggle a combinator or a pseudo-class into the selector.
export function boxSelector(box: CmsBox): string {
	for (const part of [box.tag, box.className, box.id]) {
		if (part !== undefined && !IDENT.test(part)) throw new Error("a CMS box needs plain identifiers")
	}
	return `${box.tag}${box.className === undefined ? "" : `.${box.className}`}${box.id === undefined ? "" : `#${box.id}`}`
}
```

- [ ] **Step 7: Write `src/extract/page.ts`**

```ts
import { load } from "cheerio/slim"
import { type TextLine, textLines } from "../adapters/clean.ts"
import { readPageWith } from "../adapters/read.ts"
import type { AdapterName } from "../adapters/types.ts"
import { boxSelector, CMS_BOXES, type CmsBox } from "./cmsBoxes.ts"

export type PageBox = { kind: "contact" | "hours"; lines: TextLine[]; inMain: boolean }
export type UnitPage = {
	adapter: AdapterName
	fallback: boolean
	main: TextLine[]
	boxes: PageBox[]
	// What the grounding gate reads: the main text, then every box outside the main element.
	text: string
}

// Shared by extract and verify, so every quote a rule takes is in the text the grounding gate
// sees. Each box is read from a fresh parse: textLines changes the tree it reads.
export function readUnitPage(html: string, url: string, boxes: readonly CmsBox[] = CMS_BOXES): UnitPage {
	const { result, selector, lines } = readPageWith(html, url)
	const found: PageBox[] = []
	if (!result.fallback) {
		for (const box of boxes.filter((b) => b.adapter === result.adapter)) {
			const $ = load(html)
			const sel = boxSelector(box)
			const el = $(sel).first()
			if (el.length === 0) continue
			const inMain = el.closest(selector).length > 0
			const boxLines = textLines($, sel, url)
			if (boxLines !== undefined) found.push({ kind: box.kind, lines: boxLines, inMain })
		}
	}
	const outside = found.filter((b) => !b.inMain).flatMap((b) => b.lines)
	return {
		adapter: result.adapter,
		fallback: result.fallback,
		main: lines,
		boxes: found,
		text: [...lines, ...outside].map((l) => l.text).join("\n"),
	}
}

export function allLines(page: UnitPage): string[] {
	return [...page.main, ...page.boxes.filter((b) => !b.inMain).flatMap((b) => b.lines)].map((l) => l.text)
}
```

- [ ] **Step 8: Write `src/extract/contactBlock.ts`**

```ts
import type { TextLine } from "../adapters/clean.ts"
import type { ContactBlock } from "../schema/extraction.ts"
import { normaliseText } from "../text/normalise.ts"
import type { UnitPage } from "./page.ts"

const KONTAKT: ReadonlySet<string> = new Set(["kontakt", "kontakt oss", "kontaktinformasjon"])
const APNINGSTIDER: ReadonlySet<string> = new Set(["åpningstider", "åpningstid"])

// A heading's words, without trailing punctuation: "Kontakt oss:" is "kontakt oss".
export function headingIs(text: string, words: ReadonlySet<string>): boolean {
	return words.has(normaliseText(text).replace(/[\s:.!]+$/, ""))
}

// The lines under each heading the test picks, until the next heading of any level, with the
// nearest heading above it that is not itself such a heading (the service the block belongs to).
function under(lines: readonly TextLine[], words: ReadonlySet<string>): ContactBlock[] {
	const blocks: ContactBlock[] = []
	let naming: string | undefined
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		if (line?.heading === undefined) continue
		if (!headingIs(line.text, words)) {
			naming = line.text
			continue
		}
		const body: string[] = []
		for (let j = i + 1; j < lines.length && lines[j]?.heading === undefined; j++) body.push(lines[j]?.text ?? "")
		if (body.length > 0) {
			blocks.push(naming === undefined ? { source: "heading", lines: body } : { source: "heading", heading: naming, lines: body })
		}
	}
	return blocks
}

// The unit's contact block: the CMS contact box first (where the adapter knows one), then the
// lines under a Kontakt, Kontakt oss or Kontaktinformasjon heading in the main text.
export function contactBlocks(page: UnitPage): ContactBlock[] {
	const boxes = page.boxes
		.filter((b) => b.kind === "contact")
		.map((b): ContactBlock => {
			const named = b.lines.find((l) => l.heading !== undefined && !headingIs(l.text, KONTAKT))
			const lines = b.lines.map((l) => l.text)
			return named === undefined ? { source: "cms", lines } : { source: "cms", heading: named.text, lines }
		})
	return [...boxes, ...under(page.main, KONTAKT)]
}

// Opening hours: the CMS hours box, else the lines under an Åpningstider heading until the next
// heading. Nav's office JSON comes before both; the hours rule handles that.
export function hoursLines(page: UnitPage): { source: "cms" | "heading"; lines: string[] } | undefined {
	const box = page.boxes.find((b) => b.kind === "hours")
	if (box !== undefined) {
		const lines = box.lines.filter((l) => l.heading === undefined).map((l) => l.text)
		if (lines.length > 0) return { source: "cms", lines }
	}
	const [first] = under(page.main, APNINGSTIDER)
	return first === undefined ? undefined : { source: "heading", lines: first.lines }
}
```

- [ ] **Step 9: Run the tests to see them pass**

Run: `npx vitest run test/page.test.ts test/contactBlock.test.ts test/adapters.test.ts`
Expected: PASS.

- [ ] **Step 10: Find the CMS boxes on fetched pages**

This machine has no page cache, so I fetch a few pages first, from kommuner that do not block ClaudeBot: Kongsvinger (3401, CorePublish), Lillehammer (3405, ACOS) and Ringsaker (3411, Sitevision). From `pipeline/`:

```bash
npm run discover -- --only 3401,3405,3411
npm run fetch -- --only 3401,3405,3411 --limit 10
```

Read only the printed summaries. If no page reads as `sitevision`, add one more Innlandet kommune that is not on the blocking list (never 3403, 3412, 3413, 3414, 3415, 3417, 3419), one at a time, until one does.

Then print the structure around every `tel:` and `mailto:` link, and around every element whose class or id looks like opening hours. The script prints tag names, classes and ids, and never text. Save it outside the repo, at `C:/Users/Nugget/AppData/Local/Temp/varde-structure.mjs`; it runs through `node -e` from `pipeline/`, so its imports resolve there:

```js
// Structure only: tag.class#id chains. Never text, never an href, never a URL path.
const { readFileSync } = await import("node:fs")
const { join } = await import("node:path")
const cacheDir = process.argv[1]
const BLOCKING = /(?:^|\.)(?:hamar|stange|loten|grue|nord-odal|sor-odal|valer|rost|gol|drammen|asker)\.kommune\.no$/
const { load } = await import("cheerio/slim")
const { readPage } = await import("./src/adapters/read.ts")
const manifest = JSON.parse(readFileSync(join(cacheDir, "pages/manifest.json"), "utf8"))
const tally = new Map()
const add = (key) => tally.set(key, (tally.get(key) ?? 0) + 1)
const node = (el) =>
	`${el.tagName}${el.attribs?.class ? `.${el.attribs.class.trim().split(/\s+/).join(".")}` : ""}${el.attribs?.id ? `#${el.attribs.id}` : ""}`
for (const entry of manifest.entries) {
	const host = new URL(entry.finalUrl).hostname
	if (BLOCKING.test(host)) continue
	const html = readFileSync(join(cacheDir, "pages", entry.file), "utf8")
	const adapter = readPage(html, entry.finalUrl).adapter
	const $ = load(html)
	const chain = (el) => $(el).parents().toArray().slice(0, 6).map(node).reverse().join(" > ")
	$('a[href^="tel:"], a[href^="mailto:"]').each((_, el) => add(`${adapter} | link | ${chain(el)}`))
	$("[class], [id]")
		.filter((_, el) => /apning|opening|hours|tider/i.test(`${el.attribs.class ?? ""} ${el.attribs.id ?? ""}`))
		.each((_, el) => add(`${adapter} | hours | ${chain(el)} > ${node(el)}`))
}
for (const [key, n] of [...tally].sort((a, b) => b[1] - a[1])) console.log(n, key)
```

Run: `node --input-type=module -e "$(cat C:/Users/Nugget/AppData/Local/Temp/varde-structure.mjs)" ../.cache`
Expected: lines like `7 acos | link | body > div.x > aside.y > div.z`. Pick, per CMS, the innermost element that holds the contact links on most pages and sits outside `<main>` or inside it as its own box, and likewise the hours box. A box shared by many pages of one site with different contact details is the unit's box; a box with the kommune's switchboard on every page (a footer) is not, so skip any element inside `footer` or `header`.

- [ ] **Step 11: Record each box, with its check**

Run `date +"%Y-%m-%d %A"` first. For each box found, add one entry to `CMS_BOXES`, with a comment line naming the date and the host it was checked on, as `siteRules.ts` does. For example, for an ACOS contact box found as `aside.kontaktinfo` on Lillehammer pages:

```ts
export const CMS_BOXES: readonly CmsBox[] = [
	// ACOS contact box, checked 06.11.2026 on www.lillehammer.kommune.no (7 of 10 pages).
	{ adapter: "acos", kind: "contact", tag: "aside", className: "kontaktinfo" },
]
```

(The class name above shows the format only; use what Step 10 printed.) A CMS with no clear box gets no entry, and the PR body says so.

For each recorded box, write a fictional fixture `pipeline/test/fixtures/pages/<cms>-contact-box.html` (and `<cms>-hours-box.html` for an hours box) with the CMS's marker, its main element, and the box's tag and class around fictional lines. For ACOS:

```html
<!DOCTYPE html>
<html lang="nb">
<head><meta charset="utf-8"><meta name="acos-cmscontext" content="w1$o1$m1$sl0" /><title>Eksempel</title></head>
<body>
<main class="main"><h1>Eksempel helsestasjon</h1><p>Vi har drop-in.</p></main>
<aside class="kontaktinfo"><h2>Kontakt oss</h2><p>Telefon: 62 00 00 00</p><p>E-post: <a href="mailto:post@eksempel.kommune.no">post@eksempel.kommune.no</a></p></aside>
</body>
</html>
```

The CorePublish marker is the word `corepublish` anywhere in the page (for example `<meta name="generator" content="CorePublish">`) with `<main id="main-content">`; the Sitevision marker is `sitevision` with `<main class="svp-main">` (see `src/adapters/read.ts`). Then add to `pipeline/test/contactBlock.test.ts`:

```ts
import { CMS_BOXES } from "../src/extract/cmsBoxes.ts"

describe("the recorded CMS boxes", () => {
	it("finds every recorded box in its fixture", () => {
		for (const box of CMS_BOXES) {
			const p = readUnitPage(page(`${box.adapter}-${box.kind}-box.html`), K)
			if (box.kind === "contact") expect(contactBlocks(p)[0]?.source, box.adapter).toBe("cms")
			else expect(hoursLines(p)?.source, box.adapter).toBe("cms")
		}
	})
})
```

Add one line per fixture to `pipeline/test/fixtures/README.md`: "`<cms>-contact-box.html`: shape of the <CMS> contact box seen on <host>, <date>; values fictional."

- [ ] **Step 12: Count role words on the fetched pages**

Role words are added only from a fetched page or Varde's own data (decision 6). This prints words only, never a line, never a number:

```bash
node --input-type=module -e '
const { readFileSync } = await import("node:fs")
const { join } = await import("node:path")
const { readUnitPage } = await import("./src/extract/page.ts")
const { allLines } = await import("./src/extract/page.ts")
const { findPhones, isMobileDigits } = await import("./src/text/phone.ts")
const dir = process.argv[1]
const BLOCKING = /(?:^|\.)(?:hamar|stange|loten|grue|nord-odal|sor-odal|valer|rost|gol|drammen|asker)\.kommune\.no$/
const m = JSON.parse(readFileSync(join(dir, "pages/manifest.json"), "utf8"))
const words = new Map()
for (const e of m.entries) {
	if (BLOCKING.test(new URL(e.finalUrl).hostname)) continue
	const lines = allLines(readUnitPage(readFileSync(join(dir, "pages", e.file), "utf8"), e.finalUrl))
	lines.forEach((line, i) => {
		const near = [line, lines[i - 1] ?? ""].join(" ")
		if (!findPhones(line).some((h) => isMobileDigits(h.digits))) return
		for (const w of near.toLowerCase().match(/\p{L}+(?:leder|koordinator|sjef|rådgiver)(?!\p{L})/gu) ?? []) {
			words.set(w, (words.get(w) ?? 0) + 1)
		}
	})
}
console.log([...words].sort((a, b) => b[1] - a[1]))
' ../.cache
```

For each word printed that names a role (not a name), add an entry to `ROLE_WORDS` with the comment "seen next to a mobile on <host>, <dd.mm.yyyy>" (the host from the structure run, not a URL). "Enhetsleder" goes in only if it is printed here.

- [ ] **Step 13: Run everything**

Run: `npm test`
Expected: PASS, including one test per recorded box.

- [ ] **Step 14: Show it red once**

In `contactBlocks`, change `[...boxes, ...under(page.main, KONTAKT)]` to `under(page.main, KONTAKT)`. Run `npx vitest run test/contactBlock.test.ts`: FAIL on "takes a CMS contact box first" and on each recorded box. Restore, run: PASS. Note it for the PR body.

- [ ] **Step 15: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add src/adapters/clean.ts src/adapters/read.ts src/extract/cmsBoxes.ts src/extract/page.ts src/extract/contactBlock.ts src/extract/roleWords.ts test/page.test.ts test/contactBlock.test.ts test/fixtures/pages/ test/fixtures/README.md
git commit -m "feat(pipeline): read a page with its CMS boxes and find the unit's contact block"
```

---

### Task 7: The phone rule

Ranks 1 and 2 of the phone order from the contact block, rank 3 from a kommune page that labels its switchboard. A role mobile keeps only two quotes. A time on the number's line becomes `phoneHours`, and "døgnåpen" sets `alwaysOpen` only when nothing else stands beside it.

**Files:**
- Create: `pipeline/src/extract/fields/phone.ts`
- Test: `pipeline/test/fields/phone.test.ts`

**Interfaces:**
- Consumes: `findPhones`, `isMobileDigits` (Task 3), `formatHours`, `hasTime` (Task 4), `possibleNames`, `LABEL_WORDS` (Task 2), `findRoleWord` (Task 2), `ContactBlock`, `ExtractedCandidate` (Task 1), `MAX_LINE`, `MAX_QUOTE`, `quoteHasText`, `foldNorwegian`.
- Produces: `type RuleContext = { unitName?: string; places: readonly string[]; onKommuneSite: boolean }`, `phoneCandidates(blocks: readonly ContactBlock[], ctx: RuleContext): ExtractedCandidate[]`, `dedupe(candidates: readonly ExtractedCandidate[]): ExtractedCandidate[]` (one per field, compared value and role; the first wins), all in `extract/fields/phone.ts`.

- [ ] **Step 1: Write the failing tests**

Create `pipeline/test/fields/phone.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { phoneCandidates } from "../../src/extract/fields/phone.ts"
import type { ContactBlock } from "../../src/schema/extraction.ts"

const ctx = { unitName: "Eksempel helsestasjon", places: ["Eksempel"], onKommuneSite: true }
const block = (...lines: string[]): ContactBlock[] => [{ source: "heading", lines }]
const phones = (blocks: ContactBlock[]) => phoneCandidates(blocks, ctx).filter((c) => c.field === "phone")
const D = "\u2013"

describe("phone rule: rank 1, the service phone", () => {
	it("takes a number next to Telefon, with the line as its quote", () => {
		expect(phones(block("Telefon: 62 00 00 00"))).toEqual([
			{
				field: "phone",
				value: "62 00 00 00",
				evidence: { kind: "quote", quotes: ["Telefon: 62 00 00 00"] },
				origin: "unitContact",
				rank: 1,
				block: 0,
			},
		])
	})

	it("takes Telefon on one line and the number on the next, with both lines as quotes", () => {
		expect(phones(block("Telefon:", "62 00 00 00"))).toMatchObject([
			{ value: "62 00 00 00", rank: 1, evidence: { kind: "quote", quotes: ["Telefon:", "62 00 00 00"] } },
		])
	})

	it("takes a number next to the unit's own name, and a Vakttelefon", () => {
		expect(phones(block("Eksempel helsestasjon 62 00 00 00"))).toMatchObject([{ rank: 1 }])
		expect(phones(block("Vakttelefon 62 00 00 09"))).toMatchObject([{ rank: 1 }])
	})

	it("never takes a fax number, on its own line or beside the phone", () => {
		expect(phones(block("Telefon: 62 00 00 00", "Faks: 62 00 00 01")).map((c) => c.value)).toEqual(["62 00 00 00"])
		expect(phones(block("Telefon 62 00 00 00, faks 62 00 00 01")).map((c) => c.value)).toEqual(["62 00 00 00"])
		expect(phones(block("Telefaks:", "62 00 00 01"))).toEqual([])
	})

	it("gives one candidate for the same number written twice", () => {
		expect(phones(block("Telefon: 62 00 00 00", "Tlf. 62000000"))).toHaveLength(1)
	})

	it("gives both of two different labelled numbers, so the agreement gate sends them to review", () => {
		expect(phones(block("Telefon: 62 00 00 00", "Telefon: 62 00 00 02")).map((c) => c.rank)).toEqual([1, 1])
	})

	it("takes no unlabelled landline", () => {
		expect(phones(block("62 00 00 00"))).toEqual([])
	})
})

describe("phone rule: rank 2 and person names", () => {
	it("keeps a role mobile as two quotes, the role word and the number, whatever the name", () => {
		for (const line of [
			"Avdelingsleder Kari Nordmann 900 00 000",
			"Avdelingsleder Kari Anne Nordmann, mobil 900 00 000",
			"Anne-Marie Nordmann (avdelingsleder): 900 00 000",
			"Avdelingsleder Kari: 900 00 000",
		]) {
			const found = phones(block(line))
			expect(found).toHaveLength(1)
			expect(found[0]).toMatchObject({ rank: 2, role: "Avdelingsleder", value: "900 00 000" })
			expect(found[0]?.evidence).toEqual({
				kind: "quote",
				quotes: [line.match(/avdelingsleder/i)?.[0], "900 00 000"],
			})
			expect(JSON.stringify(found)).not.toMatch(/Kari|Anne|Nordmann/)
		}
	})

	it("reads the role word on the line above", () => {
		expect(phones(block("Virksomhetsleder", "900 00 000"))).toMatchObject([{ rank: 2, role: "Virksomhetsleder" }])
	})

	it("never makes a landline next to a person name rank 1: no role word sends it to review, number only", () => {
		const found = phones(block("Kari Nordmann, telefon 62 00 00 00"))
		expect(found).toEqual([
			{
				field: "phone",
				value: "62 00 00 00",
				evidence: { kind: "quote", quotes: ["62 00 00 00"] },
				origin: "unitContact",
				rank: 2,
				block: 0,
				review: "a number next to a possible name, with no role word",
			},
		])
	})

	it("takes a mobile with no role word as rank 2 with no role, quoting the number only", () => {
		expect(phones(block("Telefon 900 00 000"))).toEqual([
			{
				field: "phone",
				value: "900 00 000",
				evidence: { kind: "quote", quotes: ["900 00 000"] },
				origin: "unitContact",
				rank: 2,
				block: 0,
			},
		])
	})
})

describe("phone rule: rank 3, the switchboard", () => {
	it("labels a Sentralbord or Servicetorg number on the kommune's own site", () => {
		expect(phones(block("Sentralbord: 62 00 00 00"))).toMatchObject([{ rank: 3, role: "Sentralbord" }])
		expect(phones(block("Servicetorget 62 00 00 00"))).toMatchObject([{ rank: 3, role: "Sentralbord" }])
	})

	it("ignores a switchboard number anywhere else", () => {
		expect(phoneCandidates(block("Sentralbord: 62 00 00 00"), { ...ctx, onKommuneSite: false })).toEqual([])
	})
})

describe("phone rule: phoneHours and alwaysOpen", () => {
	const of = (field: string, blocks: ContactBlock[]) => phoneCandidates(blocks, ctx).filter((c) => c.field === field)

	it("formats a time range on the number's line or the line after", () => {
		expect(of("phoneHours", block("Telefon: 62 00 00 00 (hverdager 08.00-15.30)"))).toMatchObject([
			{ value: `hverdager kl. 08:00${D}15:30`, evidence: { quotes: ["Telefon: 62 00 00 00 (hverdager 08.00-15.30)"] } },
		])
		expect(of("phoneHours", block("Telefon: 62 00 00 00", "Telefontid 09.00-14.00"))).toMatchObject([
			{ value: `Telefontid kl. 09:00${D}14:00`, evidence: { quotes: ["Telefontid 09.00-14.00"] } },
		])
	})

	it("sends a time it cannot read to review, as the page wrote it", () => {
		expect(of("phoneHours", block("Telefon: 62 00 00 00 (08.00-25.00)"))).toMatchObject([
			{ value: "08.00-25.00", review: "a time the formatter cannot read" },
		])
	})

	it("sets alwaysOpen when the phrase stands alone or next to the number", () => {
		expect(of("alwaysOpen", block("Telefon: 62 00 00 00", "Døgnåpent"))).toMatchObject([
			{ value: true, evidence: { quotes: ["Døgnåpent"] } },
		])
		expect(of("alwaysOpen", block("Telefon 62 00 00 00, døgnåpen"))).toMatchObject([{ value: true }])
		expect(of("alwaysOpen", block("Telefon: 62 00 00 00", "Døgnåpent"))[0]?.review).toBeUndefined()
	})

	it("sends any other word on that line to review, never a plain alwaysOpen", () => {
		for (const line of ["Ikke døgnåpen", "Døgnåpen i helgene", "Døgnåpent unntatt mandag"]) {
			const found = of("alwaysOpen", block("Telefon: 62 00 00 00", line))
			expect(found).toHaveLength(1)
			expect(found[0]?.review).toBe("the always-open line holds other words")
		}
	})

	it("reads no alwaysOpen in a block without a service phone", () => {
		expect(of("alwaysOpen", block("Døgnåpent"))).toEqual([])
	})
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run test/fields/phone.test.ts`
Expected: FAIL, `src/extract/fields/phone.ts` does not exist.

- [ ] **Step 3: Write `src/extract/fields/phone.ts`**

```ts
import { comparable } from "../../gates/compare.ts"
import { MAX_QUOTE } from "../../schema/common.ts"
import type { ContactBlock, ExtractedCandidate } from "../../schema/extraction.ts"
import { formatHours, hasTime } from "../../text/hours.ts"
import { possibleNames } from "../../text/names.ts"
import { MAX_LINE, quoteHasText } from "../../text/normalise.ts"
import { findPhones, isMobileDigits, type PhoneHit } from "../../text/phone.ts"
import { findRoleWord } from "../roleWords.ts"

export type RuleContext = { unitName?: string; places: readonly string[]; onKommuneSite: boolean }

const word = (alternatives: string) => new RegExp(`(?<![\\p{L}])(?:${alternatives})(?![\\p{L}])`, "iu")
const PHONE_LABEL = word("telefon|tlf|vakttelefon")
const FAX = word("faks|fax|telefaks")
const SWITCHBOARD = word("sentralbord(?:et)?|servicetorg(?:et)?")
const ALWAYS = word("døgnåpen|døgnåpent|hele døgnet")
const LETTER = /\p{L}/u

// One candidate per field, compared value and role: a number in the box and again in the text
// is one number, not two.
export function dedupe(candidates: readonly ExtractedCandidate[]): ExtractedCandidate[] {
	const seen = new Set<string>()
	return candidates.filter((c) => {
		const key = `${c.field}|${comparable(c.field, c.value)}|${c.role ?? ""}`
		if (seen.has(key)) return false
		seen.add(key)
		return true
	})
}

type Labelled = { hit: PhoneHit; label: string; labelLine?: number }

// Each number's label: the text between it and the number before it on the line. A number with
// no words before it takes the label of the number before it on the line, or else the line
// above when that line holds no number of its own ("Telefon:" over "62 00 00 00").
function labelled(lines: readonly string[], i: number): Labelled[] {
	const line = lines[i] ?? ""
	const hits = findPhones(line)
	const out: Labelled[] = []
	let from = 0
	let previous: Labelled | undefined
	for (const hit of hits) {
		const segment = line.slice(from, hit.index)
		from = hit.index + hit.text.length
		if (LETTER.test(segment)) {
			previous = { hit, label: segment }
		} else if (previous !== undefined) {
			previous = { hit, label: previous.label, ...(previous.labelLine === undefined ? {} : { labelLine: previous.labelLine }) }
		} else {
			const above = lines[i - 1]
			previous =
				above !== undefined && findPhones(above).length === 0 && above.length <= MAX_LINE
					? { hit, label: above, labelLine: i - 1 }
					: { hit, label: "" }
		}
		out.push(previous)
	}
	return out
}

const quote = (texts: readonly string[]) => ({ kind: "quote" as const, quotes: [...texts] })

// "(hverdager 08.00-15.30)" after the number, or a line after it that holds a time.
function hoursAfter(lines: readonly string[], i: number, hit: PhoneHit, block: number): ExtractedCandidate | undefined {
	const line = lines[i] ?? ""
	const rest = line.slice(hit.index + hit.text.length)
	const next = lines[i + 1]
	const source = hasTime(rest) || /\d[.:]\d{2}/.test(rest)
		? { text: rest, line }
		: next !== undefined && next.length <= MAX_LINE && findPhones(next).length === 0 && (hasTime(next) || /\d[.:]\d{2}/.test(next))
			? { text: next, line: next }
			: undefined
	if (source === undefined || source.line.length > MAX_QUOTE) return undefined
	const trimmed = source.text.replace(/^[\s,;:()-]+|[\s,;()]+$/g, "").replace(/\s+/g, " ")
	if (trimmed === "") return undefined
	const formatted = formatHours(trimmed)
	return formatted.ok
		? { field: "phoneHours", value: formatted.text, evidence: quote([source.line]), origin: "unitContact", block }
		: {
				field: "phoneHours",
				value: trimmed,
				evidence: quote([source.line]),
				origin: "unitContact",
				block,
				review: "a time the formatter cannot read",
			}
}

// "Døgnåpent" alone on a line of the block, or next to the service phone. Any other word on
// that line sends it to review: a wrong alwaysOpen on an acute line tells someone at night that
// a closed place is open.
function alwaysOpen(lines: readonly string[], block: number, ctx: RuleContext): ExtractedCandidate | undefined {
	for (const line of lines) {
		if (line.length > MAX_QUOTE) continue
		const m = ALWAYS.exec(line)
		if (m === null) continue
		let rest = line.replace(m[0], " ")
		for (const hit of findPhones(line)) rest = rest.replace(hit.text, " ")
		const others = rest
			.split(/[^\p{L}]+/u)
			.filter((w) => w !== "" && !PHONE_LABEL.test(w) && !(ctx.unitName !== undefined && quoteHasText(ctx.unitName, w)))
		const c: ExtractedCandidate = { field: "alwaysOpen", value: true, evidence: quote([line]), origin: "unitContact", block }
		return others.length === 0 ? c : { ...c, review: "the always-open line holds other words" }
	}
	return undefined
}

function inBlock(block: ContactBlock, b: number, ctx: RuleContext): ExtractedCandidate[] {
	const lines = block.lines
	const out: ExtractedCandidate[] = []
	let serviceLine: number | undefined
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] ?? ""
		if (line.length > MAX_LINE) continue
		for (const { hit, label, labelLine } of labelled(lines, i)) {
			if (FAX.test(label)) continue
			const base = { field: "phone" as const, value: hit.text, origin: "unitContact" as const, block: b }
			if (SWITCHBOARD.test(label)) {
				if (ctx.onKommuneSite && line.length <= MAX_QUOTE) {
					const quotes = labelLine === undefined ? [line] : [lines[labelLine] ?? "", line]
					out.push({ ...base, evidence: quote(quotes), rank: 3, role: "Sentralbord" })
				}
				continue
			}
			const role = findRoleWord(line) ?? findRoleWord(lines[i - 1] ?? "")
			if (role !== undefined) {
				// Two verbatim pieces only, so no name on the line can be stored, whatever its shape.
				out.push({ ...base, evidence: quote([role.quote, hit.text]), rank: 2, role: role.label })
				continue
			}
			const without = findPhones(line).reduce((text, h) => text.replace(h.text, " "), line)
			if (possibleNames(without, ctx).length > 0) {
				out.push({
					...base,
					evidence: quote([hit.text]),
					rank: 2,
					review: "a number next to a possible name, with no role word",
				})
				continue
			}
			if (isMobileDigits(hit.digits)) {
				// The safety gate sends a mobile with no role label to review.
				out.push({ ...base, evidence: quote([hit.text]), rank: 2 })
				continue
			}
			const named = ctx.unitName !== undefined && quoteHasText(label, ctx.unitName)
			if (!PHONE_LABEL.test(label) && !named) continue
			if (line.length > MAX_QUOTE) continue
			const quotes = labelLine === undefined ? [line] : [lines[labelLine] ?? "", line]
			out.push({ ...base, evidence: quote(quotes), rank: 1 })
			const hours = hoursAfter(lines, i, hit, b)
			if (hours !== undefined) out.push(hours)
			serviceLine ??= i
		}
	}
	if (serviceLine !== undefined) {
		const open = alwaysOpen(lines, b, ctx)
		if (open !== undefined) out.push(open)
	}
	return out
}

// Ranks 1 and 2 of the phone order from the contact blocks, and rank 3 from a kommune page that
// labels its switchboard. The gates decide; this rule only proposes.
export function phoneCandidates(blocks: readonly ContactBlock[], ctx: RuleContext): ExtractedCandidate[] {
	return dedupe(blocks.flatMap((block, b) => inBlock(block, b, ctx)))
}
```

- [ ] **Step 4: Run it to see it pass**

Run: `npx vitest run test/fields/phone.test.ts`
Expected: PASS. If the "landline next to a person name" case finds `telefon` as a name, the label words in `text/names.ts` are missing it; fix the list, not the test.

- [ ] **Step 5: Show it red once**

Delete the line `if (FAX.test(label)) continue`. Run the file: FAIL on "never takes a fax number". Restore, run: PASS. Note it for the PR body.

- [ ] **Step 6: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add src/extract/fields/phone.ts test/fields/phone.test.ts
git commit -m "feat(pipeline): extract phone numbers by the phone order, with role labels and no names"
```

---

### Task 8: Email, website, address and name rules

**Files:**
- Create: `pipeline/src/extract/fields/email.ts`, `pipeline/src/extract/fields/website.ts`, `pipeline/src/extract/fields/address.ts`, `pipeline/src/extract/fields/name.ts`
- Test: `pipeline/test/fields/email.test.ts`, `pipeline/test/fields/address.test.ts`, `pipeline/test/fields/name.test.ts`

**Interfaces:**
- Consumes: `ContactBlock`, `ExtractedCandidate` (Task 1), `TextLine` (Task 6), `dedupe` (Task 7), `splitAddress`, `MAX_LINE`, `MAX_QUOTE`.
- Produces:
  - `extract/fields/email.ts`: `emailsIn(line: string): string[]`, `emailCandidates(blocks: readonly ContactBlock[], pageLines: readonly string[]): ExtractedCandidate[]`.
  - `extract/fields/website.ts`: `websiteCandidate(finalUrl: string, main: readonly TextLine[]): ExtractedCandidate | undefined`.
  - `extract/fields/address.ts`: `addressCandidates(blocks: readonly ContactBlock[]): ExtractedCandidate[]`.
  - `extract/fields/name.ts`: `nameCandidate(main: readonly TextLine[]): ExtractedCandidate | undefined`.

- [ ] **Step 1: Write the failing tests**

Create `pipeline/test/fields/email.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { emailCandidates, emailsIn } from "../../src/extract/fields/email.ts"

describe("emailsIn", () => {
	it("finds plain and linked addresses, without a trailing full stop", () => {
		expect(emailsIn("E-post: post@eksempel.kommune.no.")).toEqual(["post@eksempel.kommune.no"])
		expect(emailsIn("Skriv til helsestasjon@eksempel.kommune.no eller post@eksempel.no")).toEqual([
			"helsestasjon@eksempel.kommune.no",
			"post@eksempel.no",
		])
	})

	it("finishes a long line of address characters with no @ fast", () => {
		const started = performance.now()
		emailsIn("a.".repeat(1000))
		expect(performance.now() - started).toBeLessThan(1000)
	})
})

describe("emailCandidates", () => {
	const block = [{ source: "heading" as const, lines: ["E-post: post@eksempel.kommune.no"] }]

	it("takes the contact block first, as unitContact", () => {
		expect(emailCandidates(block, ["Skriv til annet@eksempel.kommune.no"])).toEqual([
			{
				field: "email",
				value: "post@eksempel.kommune.no",
				evidence: { kind: "quote", quotes: ["E-post: post@eksempel.kommune.no"] },
				origin: "unitContact",
				block: 0,
			},
		])
	})

	it("reads the rest of the page only when the block has none", () => {
		expect(emailCandidates([], ["Skriv til post@eksempel.kommune.no"])).toMatchObject([
			{ value: "post@eksempel.kommune.no", origin: "unitPage" },
		])
	})

	it("proposes a personal-looking address too: the safety gate drops it", () => {
		const own = [{ source: "heading" as const, lines: ["kari.nordmann@eksempel.kommune.no"] }]
		expect(emailCandidates(own, [])).toHaveLength(1)
	})
})
```

Create `pipeline/test/fields/address.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { addressCandidates } from "../../src/extract/fields/address.ts"

const block = (...lines: string[]) => [{ source: "heading" as const, lines }]
const values = (...lines: string[]) => addressCandidates(block(...lines)).map((c) => c.value)

describe("addressCandidates", () => {
	it("takes a line with a street and a four-digit postcode, without its label", () => {
		expect(addressCandidates(block("Besøksadresse: Storgata 1, 2609 Lillehammer"))).toEqual([
			{
				field: "address",
				value: "Storgata 1, 2609 Lillehammer",
				evidence: { kind: "quote", quotes: ["Besøksadresse: Storgata 1, 2609 Lillehammer"] },
				origin: "unitContact",
				block: 0,
			},
		])
	})

	it("joins a street line and a postcode line", () => {
		expect(addressCandidates(block("Storgata 1 A", "2609 Lillehammer"))).toMatchObject([
			{ value: "Storgata 1 A, 2609 Lillehammer", evidence: { quotes: ["Storgata 1 A", "2609 Lillehammer"] } },
		])
	})

	it("lets Besøksadresse win over Postadresse, and never takes a Postboks", () => {
		expect(values("Postadresse: Kirkegata 2, 2609 Lillehammer", "Besøksadresse: Storgata 1, 2609 Lillehammer")).toEqual([
			"Storgata 1, 2609 Lillehammer",
		])
		expect(values("Postboks 1, 2601 Lillehammer")).toEqual([])
		expect(values("Postadresse: Postboks 1, 2601 Lillehammer", "Storgata 1, 2609 Lillehammer")).toEqual([
			"Storgata 1, 2609 Lillehammer",
		])
	})

	it("takes nothing without a postcode, and nothing from a bare postcode line", () => {
		expect(values("Storgata 1")).toEqual([])
		expect(values("2609 Lillehammer")).toEqual([])
	})
})
```

Create `pipeline/test/fields/name.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { nameCandidate } from "../../src/extract/fields/name.ts"
import { websiteCandidate } from "../../src/extract/fields/website.ts"

const main = [{ text: "Eksempel helsestasjon", heading: 1 }, { text: "Vi har drop-in." }]
const URL_A = "https://www.eksempel.kommune.no/helsestasjon/"

describe("nameCandidate", () => {
	it("is the page's h1, quoted", () => {
		expect(nameCandidate(main)).toEqual({
			field: "name",
			value: "Eksempel helsestasjon",
			evidence: { kind: "quote", quotes: ["Eksempel helsestasjon"] },
			origin: "unitPage",
		})
	})

	it("is undefined without an h1", () => {
		expect(nameCandidate([{ text: "Vi har drop-in." }, { text: "Mer", heading: 2 }])).toBeUndefined()
	})
})

describe("websiteCandidate", () => {
	it("is the page's own final URL, with the h1 as the quote that proves the page", () => {
		expect(websiteCandidate(URL_A, main)).toEqual({
			field: "website",
			value: URL_A,
			evidence: { kind: "quote", quotes: ["Eksempel helsestasjon"] },
			origin: "unitPage",
		})
	})
})
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run test/fields/`
Expected: FAIL for the three new files, the modules do not exist.

- [ ] **Step 3: Write `src/extract/fields/email.ts`**

```ts
import { MAX_QUOTE } from "../../schema/common.ts"
import type { ContactBlock, ExtractedCandidate } from "../../schema/extraction.ts"
import { MAX_LINE } from "../../text/normalise.ts"
import { dedupe } from "./phone.ts"

// The local part may not start inside another run of its characters (the lookbehind), so the
// engine never rescans a run; the domain is dot-separated labels, so nothing overlaps. A full
// stop after the address is not part of it: a label must follow every dot.
const EMAIL = /(?<![\p{L}\p{N}._%+-])[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+/gu

export function emailsIn(line: string): string[] {
	if (line.length > MAX_LINE) return []
	return [...line.matchAll(EMAIL)].map((m) => m[0])
}

const quoted = (line: string, value: string, origin: "unitContact" | "unitPage", block?: number): ExtractedCandidate => ({
	field: "email",
	value,
	evidence: { kind: "quote", quotes: [line] },
	origin,
	...(block === undefined ? {} : { block }),
})

// mailto: links and plain addresses in the contact block first; the rest of the page only when
// the block gives none. The safety gate drops an address that may be a person's own.
export function emailCandidates(blocks: readonly ContactBlock[], pageLines: readonly string[]): ExtractedCandidate[] {
	const inBlocks = blocks.flatMap((b, i) =>
		b.lines.filter((l) => l.length <= MAX_QUOTE).flatMap((line) => emailsIn(line).map((e) => quoted(line, e, "unitContact", i)))
	)
	if (inBlocks.length > 0) return dedupe(inBlocks)
	return dedupe(
		pageLines.filter((l) => l.length <= MAX_QUOTE).flatMap((line) => emailsIn(line).map((e) => quoted(line, e, "unitPage")))
	)
}
```

- [ ] **Step 4: Write `src/extract/fields/name.ts` and `src/extract/fields/website.ts`**

`name.ts`:

```ts
import type { TextLine } from "../../adapters/clean.ts"
import { MAX_QUOTE } from "../../schema/common.ts"
import type { ExtractedCandidate } from "../../schema/extraction.ts"

// The page's own h1. The Brreg name (capitals, often longer) is only for matching: as a peer it
// would send every name to review.
export function nameCandidate(main: readonly TextLine[]): ExtractedCandidate | undefined {
	const h1 = main.find((l) => l.heading === 1)
	if (h1 === undefined || h1.text.length > MAX_QUOTE) return undefined
	return { field: "name", value: h1.text, evidence: { kind: "quote", quotes: [h1.text] }, origin: "unitPage" }
}
```

`website.ts`:

```ts
import type { TextLine } from "../../adapters/clean.ts"
import { MAX_QUOTE } from "../../schema/common.ts"
import type { ExtractedCandidate } from "../../schema/extraction.ts"

// The unit's own page URL, already grounded by the fetch. The grounding gate passes a website
// that is its source page; the quote (the h1, else the first line) proves the page has text.
export function websiteCandidate(finalUrl: string, main: readonly TextLine[]): ExtractedCandidate | undefined {
	const anchor = main.find((l) => l.heading === 1) ?? main[0]
	if (anchor === undefined || anchor.text.length > MAX_QUOTE) return undefined
	return { field: "website", value: finalUrl, evidence: { kind: "quote", quotes: [anchor.text] }, origin: "unitPage" }
}
```

- [ ] **Step 5: Write `src/extract/fields/address.ts`**

```ts
import { MAX_QUOTE } from "../../schema/common.ts"
import type { ContactBlock, ExtractedCandidate } from "../../schema/extraction.ts"
import { splitAddress } from "../../text/address.ts"
import { MAX_LINE } from "../../text/normalise.ts"
import { dedupe } from "./phone.ts"

type Kind = "visit" | "plain" | "post"
const LABEL = /^(besøksadresse|postadresse|adresse)\s*:?\s*/iu
const POSTBOKS = /(?<![\p{L}])postboks(?![\p{L}])/iu
const POSTCODE_LINE = /^\d{4} \p{L}/u
const RANK: Readonly<Record<Kind, number>> = { visit: 0, plain: 1, post: 2 }

const kindOf = (label: string | undefined): Kind =>
	label === undefined ? "plain" : /^besøk/i.test(label) ? "visit" : /^post/i.test(label) ? "post" : "plain"

// A street with its number, then a four-digit postcode: on one line after a comma, or on the
// next line. "Besøksadresse" wins over "Postadresse", and a Postboks is never a street address.
function inBlock(block: ContactBlock, b: number): ExtractedCandidate | undefined {
	const found: { kind: Kind; value: string; quotes: string[] }[] = []
	const lines = block.lines
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] ?? ""
		if (line.length > MAX_LINE || line.length > MAX_QUOTE || POSTBOKS.test(line)) continue
		const above = lines[i - 1] ?? ""
		const own = LABEL.exec(line)
		const labelAbove = own === null && LABEL.test(above) && above.replace(LABEL, "") === "" ? LABEL.exec(above) : null
		const label = own?.[1] ?? labelAbove?.[1]
		const rest = line.replace(LABEL, "").trim().replace(/[.,;]+$/, "")
		const quotes = labelAbove === null ? [line] : [above, line]
		const parts = splitAddress(rest)
		if (parts?.postcode !== undefined && POSTCODE_LINE.test(rest.slice(rest.indexOf(",") + 1).trim())) {
			found.push({ kind: kindOf(label), value: rest, quotes })
			continue
		}
		const next = (lines[i + 1] ?? "").trim()
		if (parts !== undefined && !rest.includes(",") && POSTCODE_LINE.test(next) && next.length <= MAX_QUOTE) {
			found.push({ kind: kindOf(label), value: `${rest}, ${next.replace(/[.,;]+$/, "")}`, quotes: [...quotes, lines[i + 1] ?? ""] })
		}
	}
	const best = found.sort((x, y) => RANK[x.kind] - RANK[y.kind])[0]
	return best === undefined
		? undefined
		: { field: "address", value: best.value, evidence: { kind: "quote", quotes: best.quotes }, origin: "unitContact", block: b }
}

export function addressCandidates(blocks: readonly ContactBlock[]): ExtractedCandidate[] {
	return dedupe(blocks.flatMap((block, b) => inBlock(block, b) ?? []))
}
```

`sort` is stable in Node, so of two addresses of one kind the first on the page wins.

- [ ] **Step 6: Run the tests to see them pass**

Run: `npx vitest run test/fields/`
Expected: PASS.

- [ ] **Step 7: Show it red once**

Delete `|| POSTBOKS.test(line)` from the skip line. Run `npx vitest run test/fields/address.test.ts`: FAIL on "never takes a Postboks". Restore, run: PASS. Note it for the PR body.

- [ ] **Step 8: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add src/extract/fields/email.ts src/extract/fields/website.ts src/extract/fields/address.ts src/extract/fields/name.ts test/fields/email.test.ts test/fields/address.test.ts test/fields/name.test.ts
git commit -m "feat(pipeline): extract email, website, address and name, each with its page line"
```

---

### Task 9: Hours and Lavterskel quotes

**Files:**
- Create: `pipeline/src/extract/fields/hours.ts`, `pipeline/src/extract/fields/lavterskel.ts`
- Test: `pipeline/test/fields/hours.test.ts`, `pipeline/test/fields/lavterskel.test.ts`

**Interfaces:**
- Consumes: `hoursLines`, `UnitPage` (Task 6), `formatHours`, `hoursLength` (Task 4), `NavOffice` (`registers/nav.ts`), `MAX_HOURS` (`gates/validity.ts`), `readReferral`, `saysFree`, `saysFee` (`gates/phrases.ts`).
- Produces:
  - `extract/fields/hours.ts`: `navHoursCandidate(office: NavOffice): ExtractedCandidate | undefined`, `pageHoursCandidate(page: UnitPage): ExtractedCandidate | undefined`.
  - `extract/fields/lavterskel.ts`: `lavterskelQuotes(lines: readonly string[]): string[]`.

- [ ] **Step 1: Write the failing tests**

Create `pipeline/test/fields/hours.test.ts`:

```ts
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { navHoursCandidate, pageHoursCandidate } from "../../src/extract/fields/hours.ts"
import { readUnitPage } from "../../src/extract/page.ts"
import type { NavOffice } from "../../src/registers/nav.ts"

const D = "\u2013"
const page = (name: string) => readFileSync(new URL(`../fixtures/pages/${name}`, import.meta.url), "utf8")
const K = "https://www.eksempel.kommune.no/helse/helsestasjon/"
const office = (hours: NavOffice["hours"]): NavOffice => ({ enhetNr: "0399", name: "Nav Eksempel", status: "Aktiv", hours, receptions: 1 })

describe("pageHoursCandidate", () => {
	it("formats the lines under Åpningstider into house style, quoting them as written", () => {
		expect(pageHoursCandidate(readUnitPage(page("kontakt-heading.html"), K, []))).toEqual({
			field: "openingHours",
			value: `Mandag til fredag kl. 08:00${D}15:30`,
			evidence: { kind: "quote", quotes: ["Mandag til fredag 08.00-15.30"] },
			origin: "unitPage",
		})
	})

	it("sends a time it cannot read to review, unformatted", () => {
		const html = "<html><body><main><h1>X</h1><h2>Åpningstider</h2><p>Mandag 08.00-25.00</p></main></body></html>"
		expect(pageHoursCandidate(readUnitPage(html, K, []))).toMatchObject({
			value: "Mandag 08.00-25.00",
			review: "a time the formatter cannot read",
		})
	})

	it("sends hours over 200 characters to review", () => {
		const long = Array.from({ length: 12 }, (_, i) => `<p>Uke ${i + 1}: mandag og onsdag 08.00-15.30</p>`).join("")
		const html = `<html><body><main><h1>X</h1><h2>Åpningstider</h2>${long}</main></body></html>`
		expect(pageHoursCandidate(readUnitPage(html, K, []))?.review).toBe("the hours are longer than 200 characters")
	})
})

describe("navHoursCandidate", () => {
	it("builds the hours from Nav's office data, as register evidence", () => {
		const c = navHoursCandidate(
			office([
				{ day: "Mandag", from: "10:00", to: "14:00", closed: false, appointmentOnly: false },
				{ day: "Tirsdag", closed: true, appointmentOnly: false },
				{ date: "2026-12-24", from: "10:00", to: "12:00", closed: false, appointmentOnly: false },
			])
		)
		expect(c).toEqual({
			field: "openingHours",
			value: `Mandag kl. 10:00${D}14:00`,
			evidence: { kind: "register", register: "nav", recordId: "0399" },
			origin: "register",
		})
	})

	it("sends appointment-only hours to review", () => {
		const c = navHoursCandidate(office([{ day: "Mandag", from: "10:00", to: "14:00", closed: false, appointmentOnly: true }]))
		expect(c?.review).toBe("Nav lists appointment-only hours")
	})

	it("is undefined when Nav lists no open day", () => {
		expect(navHoursCandidate(office([]))).toBeUndefined()
	})
})
```

Create `pipeline/test/fields/lavterskel.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { lavterskelQuotes } from "../../src/extract/fields/lavterskel.ts"

describe("lavterskelQuotes", () => {
	it("collects the sentences that hold a cost or referral phrase, verbatim", () => {
		expect(
			lavterskelQuotes([
				"Eksempel helsestasjon",
				"Helsestasjonen er gratis. Du trenger ikke henvisning. Vi har vaksiner.",
				"Egenandel kr 350 per time.",
			])
		).toEqual(["Helsestasjonen er gratis.", "Du trenger ikke henvisning.", "Egenandel kr 350 per time."])
	})

	it("collects from the whole page, once each, and skips lines over 2,000 characters", () => {
		expect(lavterskelQuotes(["Drop-in hver tirsdag.", "Drop-in hver tirsdag.", `${"Gratis. ".repeat(300)}`])).toEqual([
			"Drop-in hver tirsdag.",
		])
	})
})
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run test/fields/hours.test.ts test/fields/lavterskel.test.ts`
Expected: FAIL, the modules do not exist.

- [ ] **Step 3: Write `src/extract/fields/hours.ts`**

```ts
import { MAX_HOURS } from "../../gates/validity.ts"
import type { NavOffice } from "../../registers/nav.ts"
import { MAX_QUOTE } from "../../schema/common.ts"
import type { ExtractedCandidate } from "../../schema/extraction.ts"
import { formatHours, hoursLength } from "../../text/hours.ts"
import { hoursLines } from "../contactBlock.ts"
import type { UnitPage } from "../page.ts"

const collapse = (text: string) => text.replace(/\s+/g, " ").trim()

// Nav's own office data (licence ownPage, register evidence): the open days in its order, each
// through the formatter. Special dates and closed days are left out.
export function navHoursCandidate(office: NavOffice): ExtractedCandidate | undefined {
	const open = office.hours.filter(
		(h) => h.date === undefined && !h.closed && h.day !== undefined && h.from !== undefined && h.to !== undefined
	)
	const formatted = open.map((h) => formatHours(`${h.day} ${h.from}-${h.to}`))
	if (formatted.length === 0 || formatted.some((f) => !f.ok)) return undefined
	const c: ExtractedCandidate = {
		field: "openingHours",
		value: formatted.map((f) => (f.ok ? f.text : "")).join(", "),
		evidence: { kind: "register", register: "nav", recordId: office.enhetNr },
		origin: "register",
	}
	return open.some((h) => h.appointmentOnly) ? { ...c, review: "Nav lists appointment-only hours" } : c
}

// The CMS hours box, else the lines under an Åpningstider heading. Every line is a quote, so a
// line too long to quote gives no candidate.
export function pageHoursCandidate(page: UnitPage): ExtractedCandidate | undefined {
	const found = hoursLines(page)
	if (found === undefined || found.lines.some((l) => l.length > MAX_QUOTE)) return undefined
	const quotes = found.lines
	const formatted = quotes.map(formatHours)
	const base = { field: "openingHours" as const, evidence: { kind: "quote" as const, quotes }, origin: "unitPage" as const }
	if (formatted.some((f) => !f.ok)) {
		return { ...base, value: collapse(quotes.join(", ")), review: "a time the formatter cannot read" }
	}
	const value = collapse(formatted.map((f) => (f.ok ? f.text : "")).join(", "))
	return hoursLength(value) > MAX_HOURS
		? { ...base, value, review: `the hours are longer than ${MAX_HOURS} characters` }
		: { ...base, value }
}
```

- [ ] **Step 4: Write `src/extract/fields/lavterskel.ts`**

```ts
import { readReferral, saysFee, saysFree } from "../../gates/phrases.ts"
import { MAX_QUOTE } from "../../schema/common.ts"
import { MAX_LINE } from "../../text/normalise.ts"

// Sentences of the whole page that hold a phrase from the phrase table: a cost phrase or a
// referral phrase. The rule only collects them; the Lavterskel rule in the safety gate decides.
// Sentences are split as phrases.ts splits them, but on the raw text, so each is verbatim.
export function lavterskelQuotes(lines: readonly string[]): string[] {
	const found = new Set<string>()
	for (const line of lines) {
		if (line.length > MAX_LINE) continue
		for (const sentence of line.split(/(?<=[.!?])\s+/)) {
			const s = sentence.trim()
			if (s === "" || s.length > MAX_QUOTE) continue
			if (readReferral([s]) !== "silent" || saysFree(s) || saysFee(s)) found.add(s)
		}
	}
	return [...found]
}
```

- [ ] **Step 5: Run the tests to see them pass**

Run: `npx vitest run test/fields/hours.test.ts test/fields/lavterskel.test.ts`
Expected: PASS. If "Vi har vaksiner." is collected, `readReferral` reads it as something other than silent: check the phrase table before changing the test.

- [ ] **Step 6: Show it red once**

In `pageHoursCandidate`, change `hoursLength(value) > MAX_HOURS` to `value.length > MAX_HOURS * 2`. Run the hours test: FAIL on "sends hours over 200 characters to review". Restore, run: PASS. Note it for the PR body.

- [ ] **Step 7: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add src/extract/fields/hours.ts src/extract/fields/lavterskel.ts test/fields/hours.test.ts test/fields/lavterskel.test.ts
git commit -m "feat(pipeline): extract opening hours from Nav data or the page, and collect Lavterskel quotes"
```

---

### Task 10: The extract stage and its command

**Files:**
- Create: `pipeline/src/extract/extract.ts`, `pipeline/src/cli/extract.ts`
- Modify: `pipeline/package.json` (script `extract`)
- Test: `pipeline/test/extract.test.ts`

**Interfaces:**
- Consumes: every field rule (Tasks 7 to 9), `readUnitPage`, `allLines`, `contactBlocks` (Task 6), `PageCache`, `ManifestEntry`, `DEFAULT_CACHE_DIR` (`io/pageCache.ts`), `readDiscovery` (`discover/files.ts`), `isNavOfficeUrl`, `parseNavOffice` (`registers/nav.ts`), `siteHost`, `writeJsonAtomic`, `ExtractionFile` (Task 1).
- Produces (`extract/extract.ts`):
  - `type ExtractContext = { places: readonly string[]; kommuneHost?: string }`
  - `extractPage(entry: ManifestEntry, html: string | undefined, ctx: ExtractContext): ExtractedPage`
  - `type ExtractSummary = { scope: string; name?: string; pages: number; notInCache: number; withValues: number; problems: Partial<Record<PageProblem, number>>; byField: Partial<Record<ExtractedField, number>>; withLavterskel: number }`
  - `extractScope(scope: string, urls: readonly string[], cache: PageCache, ctx: ExtractContext, now: string): { file: ExtractionFile; summary: ExtractSummary }`
  - `formatExtractSummary(summaries: readonly ExtractSummary[]): string`
  - `extractionPath(cacheDir: string, scope: string): string` (`<cache>/extract/<scope>.json`), `readExtraction(cacheDir: string, scope: string): ExtractionFile | undefined`

- [ ] **Step 1: Write the failing test**

Create `pipeline/test/extract.test.ts`:

```ts
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { addressCandidates } from "../src/extract/fields/address.ts"
import { emailCandidates } from "../src/extract/fields/email.ts"
import { lavterskelQuotes } from "../src/extract/fields/lavterskel.ts"
import { phoneCandidates } from "../src/extract/fields/phone.ts"
import { extractPage, extractScope, formatExtractSummary } from "../src/extract/extract.ts"
import { PageCache } from "../src/io/pageCache.ts"
import type { Fetched } from "../src/net/crawler.ts"
import { formatHours } from "../src/text/hours.ts"
import { possibleNames } from "../src/text/names.ts"
import { quoteHasPhone } from "../src/text/normalise.ts"
import { findPhones } from "../src/text/phone.ts"

const page = (name: string) => readFileSync(new URL(`./fixtures/pages/${name}`, import.meta.url), "utf8")
const A = "https://www.eksempel.kommune.no/helsestasjon/"
const B = "https://www.eksempel.kommune.no/helsestasjoner/"
const ctx = { places: ["Eksempel"], kommuneHost: "eksempel.kommune.no" }
const NOW = "2026-11-06T10:00:00Z"
const fetched = (url: string, body: string): Fetched => ({
	ok: true,
	url,
	finalUrl: url,
	status: 200,
	contentType: "text/html",
	headers: {},
	body,
	fetchedAt: "2026-11-06T09:00:00Z",
})
const cacheWith = (pages: Record<string, string>) => {
	const cache = new PageCache(mkdtempSync(join(tmpdir(), "varde-extract-")))
	for (const [url, body] of Object.entries(pages)) cache.put(fetched(url, body), { adapter: "acos" })
	return cache
}

describe("extractPage", () => {
	it("gives the page's values, each with its quote, and the Lavterskel sentences", () => {
		const cache = cacheWith({ [A]: page("kontakt-heading.html") })
		const entry = cache.get(A)
		if (entry === undefined) throw new Error("no entry")
		const p = extractPage(entry, cache.read(entry), ctx)
		expect(p.problem).toBeUndefined()
		expect(p.candidates.map((c) => [c.field, c.value])).toEqual([
			["name", "Eksempel helsestasjon"],
			["website", A],
			["phone", "62 00 00 00"],
			["email", "helsestasjon@eksempel.kommune.no"],
			["openingHours", "Mandag til fredag kl. 08:00\u201315:30"],
		])
		expect(p.lavterskelQuotes).toEqual(["Helsestasjonen er gratis, og du trenger ikke henvisning."])
	})

	it("gives a page whose cache entry no longer matches no values, with the reason", () => {
		const dir = mkdtempSync(join(tmpdir(), "varde-extract-"))
		const cache = new PageCache(dir)
		const entry = cache.put(fetched(A, page("kontakt-heading.html")), { adapter: "acos" })
		writeFileSync(join(dir, entry.file), "<main>Endret etter manifestet</main>")
		const p = extractPage(entry, cache.read(entry), ctx)
		expect(p).toMatchObject({ problem: "cacheMismatch", candidates: [], lavterskelQuotes: [] })
	})

	it("gives a page with no text the reason noText", () => {
		const cache = cacheWith({ [A]: "<html><body><main></main></body></html>" })
		const entry = cache.get(A)
		if (entry === undefined) throw new Error("no entry")
		expect(extractPage(entry, cache.read(entry), ctx).problem).toBe("noText")
	})

	it("reads one number written in a box and again in the body as one candidate", () => {
		const html = `<html><head><meta name="acos-cmscontext" content="x"></head><body><main class="main"><h1>Eksempel helsestasjon</h1><h2>Kontakt</h2><p>Telefon: 62 00 00 00</p><p>Ring oss på telefon 62 00 00 00.</p></main></body></html>`
		const cache = cacheWith({ [A]: html })
		const entry = cache.get(A)
		if (entry === undefined) throw new Error("no entry")
		const phones = extractPage(entry, cache.read(entry), ctx).candidates.filter((c) => c.field === "phone")
		expect(phones).toHaveLength(1)
	})
})

describe("every rule on a 1 MB line of digits and dots", () => {
	it("finishes within a second", () => {
		const line = "62.00.".repeat(175_000)
		const block = [{ source: "heading" as const, lines: [line] }]
		const started = performance.now()
		findPhones(line)
		quoteHasPhone(line, "62 00 00 00")
		formatHours(line)
		possibleNames(line, ctx)
		phoneCandidates(block, { ...ctx, onKommuneSite: true })
		emailCandidates(block, [line])
		addressCandidates(block)
		lavterskelQuotes([line])
		const cache = cacheWith({ [A]: `<html><body><main><h1>X</h1><h2>Kontakt</h2><p>${line}</p></main></body></html>` })
		const entry = cache.get(A)
		if (entry === undefined) throw new Error("no entry")
		extractPage(entry, cache.read(entry), ctx)
		expect(performance.now() - started).toBeLessThan(1000)
	})
})

describe("extractScope", () => {
	it("extracts every cached page of the scope, counts the rest, and says so in counts only", () => {
		const cache = cacheWith({ [A]: page("kontakt-heading.html"), [B]: page("shared-page.html") })
		const { file, summary } = extractScope("3405", [A, B, "https://www.eksempel.kommune.no/ikke-hentet/"], cache, ctx, NOW)
		expect(file.scope).toBe("3405")
		expect(file.pages.map((p) => p.url)).toEqual([A, B])
		expect(summary).toMatchObject({ pages: 2, notInCache: 1, withValues: 2 })
		const text = formatExtractSummary([{ ...summary, name: "Lillehammer" }])
		expect(text).toContain("3405 Lillehammer: 2 pages")
		for (const secret of ["62 00 00 00", "helsestasjon@", "eksempel.kommune.no", "Eksempel helsestasjon"]) {
			expect(text).not.toContain(secret)
		}
	})
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run test/extract.test.ts`
Expected: FAIL, `src/extract/extract.ts` does not exist.

- [ ] **Step 3: Write `src/extract/extract.ts`**

```ts
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { ManifestEntry, PageCache } from "../io/pageCache.ts"
import { isNavOfficeUrl, parseNavOffice } from "../registers/nav.ts"
import {
	type ExtractedCandidate,
	type ExtractedField,
	type ExtractedPage,
	ExtractionFile,
	type PageProblem,
} from "../schema/extraction.ts"
import { siteHost } from "../text/normalise.ts"
import { contactBlocks } from "./contactBlock.ts"
import { addressCandidates } from "./fields/address.ts"
import { emailCandidates } from "./fields/email.ts"
import { navHoursCandidate, pageHoursCandidate } from "./fields/hours.ts"
import { lavterskelQuotes } from "./fields/lavterskel.ts"
import { nameCandidate } from "./fields/name.ts"
import { dedupe, phoneCandidates } from "./fields/phone.ts"
import { websiteCandidate } from "./fields/website.ts"
import { allLines, readUnitPage } from "./page.ts"

export type ExtractContext = { places: readonly string[]; kommuneHost?: string }

const empty = (entry: ManifestEntry, problem: PageProblem): ExtractedPage => ({
	url: entry.url,
	finalUrl: entry.finalUrl,
	fetchedAt: entry.fetchedAt,
	adapter: entry.adapter ?? "fallback",
	fallback: (entry.adapter ?? "fallback") === "fallback",
	problem,
	blocks: [],
	candidates: [],
	lavterskelQuotes: [],
})

// One cached page through the adapter and every field rule. A page that gives nothing keeps its
// reason; the run goes on.
export function extractPage(entry: ManifestEntry, html: string | undefined, ctx: ExtractContext): ExtractedPage {
	if (html === undefined) return empty(entry, "cacheMismatch")
	let unit: ReturnType<typeof readUnitPage>
	try {
		unit = readUnitPage(html, entry.finalUrl)
	} catch {
		return empty(entry, "unreadable")
	}
	if (unit.text === "") return { ...empty(entry, "noText"), adapter: unit.adapter, fallback: unit.fallback }
	const blocks = contactBlocks(unit)
	const name = nameCandidate(unit.main)
	const unitName = typeof name?.value === "string" ? name.value : undefined
	const rule = {
		...(unitName === undefined ? {} : { unitName }),
		places: ctx.places,
		onKommuneSite: ctx.kommuneHost !== undefined && siteHost(entry.finalUrl) === siteHost(`https://${ctx.kommuneHost}/`),
	}
	const nav = isNavOfficeUrl(entry.url) ? parseNavOffice(html) : undefined
	const navValues: ExtractedCandidate[] = []
	if (nav !== undefined) {
		const hours = navHoursCandidate(nav)
		if (hours !== undefined) navValues.push(hours)
		if (nav.visitingAddress !== undefined) {
			navValues.push({
				field: "address",
				value: nav.visitingAddress,
				evidence: { kind: "register", register: "nav", recordId: nav.enhetNr },
				origin: "register",
			})
		}
	}
	const hours = nav === undefined ? pageHoursCandidate(unit) : undefined
	const website = websiteCandidate(entry.finalUrl, unit.main)
	const candidates = dedupe([
		...(name === undefined ? [] : [name]),
		...(website === undefined ? [] : [website]),
		...phoneCandidates(blocks, rule),
		...emailCandidates(blocks, allLines(unit)),
		...addressCandidates(blocks),
		...navValues,
		...(hours === undefined ? [] : [hours]),
	])
	const page: ExtractedPage = {
		url: entry.url,
		finalUrl: entry.finalUrl,
		fetchedAt: entry.fetchedAt,
		adapter: unit.adapter,
		fallback: unit.fallback,
		blocks,
		candidates,
		lavterskelQuotes: lavterskelQuotes(allLines(unit)),
	}
	if (nav?.orgNumber !== undefined) page.orgNumber = nav.orgNumber
	if (nav !== undefined) page.navOfficeId = nav.enhetNr
	return page
}

export type ExtractSummary = {
	scope: string
	name?: string
	pages: number
	notInCache: number
	withValues: number
	problems: Partial<Record<PageProblem, number>>
	byField: Partial<Record<ExtractedField, number>>
	withLavterskel: number
}

const bump = <K extends string>(counts: Partial<Record<K, number>>, key: K) => {
	counts[key] = (counts[key] ?? 0) + 1
}

// Every cached page of one scope (a kommune, or "national" for Nav offices). A URL fetch never
// stored is counted, not read.
export function extractScope(
	scope: string,
	urls: readonly string[],
	cache: PageCache,
	ctx: ExtractContext,
	now: string
): { file: ExtractionFile; summary: ExtractSummary } {
	const summary: ExtractSummary = { scope, pages: 0, notInCache: 0, withValues: 0, problems: {}, byField: {}, withLavterskel: 0 }
	const pages: ExtractedPage[] = []
	for (const url of [...new Set(urls)].sort()) {
		const entry = cache.get(url)
		if (entry === undefined) {
			summary.notInCache++
			continue
		}
		const page = extractPage(entry, cache.read(entry), ctx)
		pages.push(page)
		summary.pages++
		if (page.problem !== undefined) bump(summary.problems, page.problem)
		if (page.candidates.length > 0) summary.withValues++
		for (const c of page.candidates) bump(summary.byField, c.field)
		if (page.lavterskelQuotes.length > 0) summary.withLavterskel++
	}
	const file = ExtractionFile.parse({ scope, extractedAt: now, pages })
	return { file, summary }
}

const counts = (c: Partial<Record<string, number>>) => {
	const parts = Object.entries(c).map(([k, n]) => `${k} ${n}`)
	return parts.length === 0 ? "none" : parts.join(", ")
}

// What the command prints. Actions logs are public: counts, kommune numbers and names, reasons.
export function formatExtractSummary(summaries: readonly ExtractSummary[]): string {
	return summaries
		.map(
			(s) =>
				`${s.scope}${s.name === undefined ? "" : ` ${s.name}`}: ${s.pages} pages, ${s.withValues} with values, ` +
				`${s.notInCache} not in the cache; problems: ${counts(s.problems)}; values: ${counts(s.byField)}; ` +
				`Lavterskel quotes on ${s.withLavterskel} pages`
		)
		.join("\n")
}

export const extractionPath = (cacheDir: string, scope: string) => join(cacheDir, "extract", `${scope}.json`)

// The extraction file, or undefined when it is missing or does not match its schema. The error
// is dropped: a parse error quotes the file, and the file holds page lines.
export function readExtraction(cacheDir: string, scope: string): ExtractionFile | undefined {
	const path = extractionPath(cacheDir, scope)
	if (!existsSync(path)) return undefined
	try {
		const parsed = ExtractionFile.safeParse(JSON.parse(readFileSync(path, "utf8")))
		return parsed.success ? parsed.data : undefined
	} catch {
		return undefined
	}
}
```

- [ ] **Step 4: Run it to see it pass**

Run: `npx vitest run test/extract.test.ts`
Expected: PASS. If the 1 MB test is slow, find which call by timing each one on its own; the fix is in that rule's pattern or its length check, never a higher limit.

- [ ] **Step 5: Write `src/cli/extract.ts` and the script**

```ts
// Extracts field values from the pages fetch cached, into <cache>/extract/, and prints counts.
//   node src/cli/extract.ts [--only 3405,0301] [--national] [--cache <dir>] [--dry-run]
import { join } from "node:path"
import { parseArgs } from "node:util"
import { DiscoverError } from "../discover/discover.ts"
import { readDiscovery } from "../discover/files.ts"
import { type ExtractSummary, extractionPath, extractScope, formatExtractSummary } from "../extract/extract.ts"
import { writeJsonAtomic } from "../io/files.ts"
import { DEFAULT_CACHE_DIR, PageCache } from "../io/pageCache.ts"
import { isNavOfficeUrl } from "../registers/nav.ts"

const USAGE = "usage: extract [--only 3405,0301] [--national] [--cache <dir>] [--dry-run]"

const { values } = parseArgs({
	options: {
		only: { type: "string" },
		national: { type: "boolean", default: false },
		cache: { type: "string" },
		"dry-run": { type: "boolean", default: false },
	},
})
const only = (values.only ?? "")
	.split(",")
	.map((p) => p.trim())
	.filter((p) => p !== "")
if (only.some((p) => !/^\d{2}(?:\d{2})?$/.test(p))) {
	console.error(USAGE)
	process.exit(2)
}

const root = values.cache ?? DEFAULT_CACHE_DIR
try {
	const found = readDiscovery(join(root, "discover"))
	const cache = new PageCache(join(root, "pages"), { dryRun: true })
	const places = found.kommuner.map((k) => k.name)
	const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
	const summaries: ExtractSummary[] = []
	const kommuner = found.kommuner.filter((k) => only.length === 0 || only.some((p) => k.kommune.startsWith(p)))
	for (const k of kommuner) {
		const ctx = k.site === undefined ? { places } : { places, kommuneHost: k.site.host }
		const { file, summary } = extractScope(k.kommune, k.pages.map((p) => p.url), cache, ctx, now)
		// Each kommune is written whole or not at all.
		if (!values["dry-run"]) writeJsonAtomic(extractionPath(root, k.kommune), file)
		summaries.push({ ...summary, name: k.name })
	}
	if (values.national) {
		const urls = found.national.pages.map((p) => p.url).filter(isNavOfficeUrl)
		const { file, summary } = extractScope("national", urls, cache, { places }, now)
		if (!values["dry-run"]) writeJsonAtomic(extractionPath(root, "national"), file)
		summaries.push(summary)
	}
	console.log(formatExtractSummary(summaries))
} catch (err) {
	// The message only: an unexpected error's text could quote a page.
	console.error(err instanceof DiscoverError ? err.message : "extract stopped on an unexpected error")
	process.exit(1)
}
```

The page cache opens with `dryRun: true` on purpose: extract only reads it, so it never saves or purges the manifest.

In `pipeline/package.json`, add to `scripts` after `"fetch"`: `"extract": "node src/cli/extract.ts",`.

- [ ] **Step 6: Show it red once**

In `extractPage`, change `if (html === undefined) return empty(entry, "cacheMismatch")` to `if (html === undefined) html = ""`. Run `npx vitest run test/extract.test.ts`: FAIL on "gives a page whose cache entry no longer matches no values". Restore, run: PASS. Note it for the PR body.

- [ ] **Step 7: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add src/extract/extract.ts src/cli/extract.ts package.json test/extract.test.ts
git commit -m "feat(pipeline): add the extract stage and its command"
```

---

### Task 11: Reading the first sheet of an .xlsx, with zip limits

`xlsx/read.ts` unpacks only the workbook, the shared strings and the first sheet, counts the real bytes as they unpack and stops at 20 MB, and reads the sheet XML with `cheerio` in XML mode, which resolves no external entity.

**Files:**
- Modify: `pipeline/package.json`, `pipeline/package-lock.json` (add `fflate`)
- Create: `pipeline/src/xlsx/read.ts`
- Test: `pipeline/test/xlsx.test.ts`, `pipeline/test/xlsxHelpers.ts`

**Interfaces:**
- Consumes: `fflate` (`Unzip`, `UnzipInflate`; tests also `zipSync`, `strToU8`), `cheerio/slim` (`load` with `{ xml: true }`).
- Produces (`xlsx/read.ts`): `MAX_UNPACKED = 20 * 1024 * 1024`, `XLSX_ENTRIES` (the three entry names), `type XlsxError = "notAZip" | "tooLarge" | "noSheet" | "unreadable"`, `type XlsxResult = { ok: true; rows: string[][] } | { ok: false; error: XlsxError }`, `readFirstSheet(bytes: Uint8Array, limit?: number): XlsxResult`.
- Produces (`test/xlsxHelpers.ts`, tests only): `buildXlsx(rows: readonly (readonly string[])[], extra?: Record<string, Uint8Array>): Uint8Array`, `lieAboutSize(zip: Uint8Array, entry: string, size: number): Uint8Array`.

- [ ] **Step 1: Add `fflate`, pinned**

From `pipeline/`: `npm view fflate version` and `npm view fflate license dependencies`. Expected: a version (0.8.3 on 05.11.2026), `MIT`, and no dependencies. If the license is not MIT or it has dependencies, stop and tell me. Then:

```bash
npm install --save-exact fflate@<that version>
```

Check `package.json` shows `"fflate": "<that version>"` with no `^`, and that `npm ls --all --omit=dev` lists nothing new under it.

- [ ] **Step 2: Write the test helpers**

`pipeline/test/xlsxHelpers.ts`:

```ts
import { strToU8, zipSync } from "fflate"

const esc = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
const column = (i: number) => String.fromCharCode(65 + i)

// A tiny workbook in the shape Excel writes: every text cell in the shared strings table.
export function buildXlsx(rows: readonly (readonly string[])[], extra: Record<string, Uint8Array> = {}): Uint8Array {
	const strings: string[] = []
	const index = (s: string) => {
		const at = strings.indexOf(s)
		if (at >= 0) return at
		strings.push(s)
		return strings.length - 1
	}
	const sheetRows = rows
		.map(
			(row, r) =>
				`<row r="${r + 1}">${row.map((cell, c) => `<c r="${column(c)}${r + 1}" t="s"><v>${index(cell)}</v></c>`).join("")}</row>`
		)
		.join("")
	const ns = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
	return zipSync({
		"[Content_Types].xml": strToU8("<Types/>"),
		"xl/workbook.xml": strToU8(`<workbook ${ns}><sheets><sheet name="Ark1" sheetId="1"/></sheets></workbook>`),
		"xl/sharedStrings.xml": strToU8(
			`<sst ${ns}>${strings.map((s) => `<si><t>${esc(s)}</t></si>`).join("")}</sst>`
		),
		"xl/worksheets/sheet1.xml": strToU8(`<worksheet ${ns}><sheetData>${sheetRows}</sheetData></worksheet>`),
		...extra,
	})
}

const same = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((x, i) => x === b[i])

// Rewrites the uncompressed size an entry declares, in its local header and in the central
// directory, the way a zip bomb lies about it.
export function lieAboutSize(zip: Uint8Array, entry: string, size: number): Uint8Array {
	const out = zip.slice()
	const view = new DataView(out.buffer)
	const name = strToU8(entry)
	for (let i = 0; i + 46 <= out.length; i++) {
		const sig = view.getUint32(i, true)
		if (sig === 0x04034b50 && same(out.subarray(i + 30, i + 30 + view.getUint16(i + 26, true)), name)) {
			view.setUint32(i + 22, size, true)
		}
		if (sig === 0x02014b50 && same(out.subarray(i + 46, i + 46 + view.getUint16(i + 28, true)), name)) {
			view.setUint32(i + 24, size, true)
		}
	}
	return out
}
```

- [ ] **Step 3: Write the failing test**

`pipeline/test/xlsx.test.ts`:

```ts
import { strToU8, zipSync } from "fflate"
import { describe, expect, it } from "vitest"
import { MAX_UNPACKED, readFirstSheet } from "../src/xlsx/read.ts"
import { buildXlsx, lieAboutSize } from "./xlsxHelpers.ts"

describe("readFirstSheet", () => {
	it("reads the rows of the first sheet, shared strings resolved, in column order", () => {
		const bytes = buildXlsx([
			["Navn", "Kommuner"],
			["Eksempel legevakt", "Eksempel, Annen"],
		])
		expect(readFirstSheet(bytes)).toEqual({
			ok: true,
			rows: [
				["Navn", "Kommuner"],
				["Eksempel legevakt", "Eksempel, Annen"],
			],
		})
	})

	it("keeps an empty cell's place by its column letter, and reads inline strings and numbers", () => {
		const sheet = `<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>a</t></is></c><c r="C1"><v>62000000</v></c></row></sheetData></worksheet>`
		const bytes = zipSync({
			"xl/workbook.xml": strToU8("<workbook/>"),
			"xl/worksheets/sheet1.xml": strToU8(sheet),
		})
		expect(readFirstSheet(bytes)).toEqual({ ok: true, rows: [["a", "", "62000000"]] })
	})

	it("reads only the workbook, the shared strings and the first sheet", () => {
		const big = new Uint8Array(MAX_UNPACKED + 1024)
		const bytes = buildXlsx([["Navn"]], { "xl/media/stort.bin": big, "xl/worksheets/sheet2.xml": big })
		expect(readFirstSheet(bytes)).toEqual({ ok: true, rows: [["Navn"]] })
	})

	it("stops at 20 MB of real unpacked bytes", () => {
		const big = "a".repeat(MAX_UNPACKED + 1024)
		const bytes = zipSync({ "xl/workbook.xml": strToU8("<workbook/>"), "xl/sharedStrings.xml": strToU8(big) })
		expect(readFirstSheet(bytes)).toEqual({ ok: false, error: "tooLarge" })
	})

	it("never trusts the size an entry declares: a small declared size that unpacks past the limit stops", () => {
		const big = `<sst>${"<si><t>a</t></si>".repeat(1_400_000)}</sst>`
		const honest = buildXlsx([["Navn"]], { "xl/sharedStrings.xml": strToU8(big) })
		const lying = lieAboutSize(honest, "xl/sharedStrings.xml", 100)
		expect(readFirstSheet(lying)).toEqual({ ok: false, error: "tooLarge" })
	})

	it("resolves no external entity", () => {
		const sheet = `<?xml version="1.0"?><!DOCTYPE w [<!ENTITY e SYSTEM "file:///C:/Windows/win.ini">]><worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>&e;</t></is></c></row></sheetData></worksheet>`
		const bytes = zipSync({ "xl/workbook.xml": strToU8("<workbook/>"), "xl/worksheets/sheet1.xml": strToU8(sheet) })
		const result = readFirstSheet(bytes)
		expect(result.ok && result.rows[0]?.[0]).not.toMatch(/fonts|extensions|\[/i)
	})

	it("refuses bytes that are not a zip, and a zip with no first sheet", () => {
		expect(readFirstSheet(strToU8("<html>ikke en fil</html>"))).toEqual({ ok: false, error: "notAZip" })
		expect(readFirstSheet(zipSync({ "xl/workbook.xml": strToU8("<workbook/>") }))).toEqual({ ok: false, error: "noSheet" })
	})
})
```

- [ ] **Step 4: Run it to see it fail**

Run: `npx vitest run test/xlsx.test.ts`
Expected: FAIL, `src/xlsx/read.ts` does not exist.

- [ ] **Step 5: Write `src/xlsx/read.ts`**

```ts
import { load } from "cheerio/slim"
import { Unzip, UnzipInflate } from "fflate"

// The .xlsx files the pipeline reads (NKLM's legevakt list) come from outside, so the zip is
// read with limits: only three entries, and at most 20 MB of real unpacked bytes, counted while
// they unpack. The size an entry declares is never trusted: a zip bomb lies about it.
export const MAX_UNPACKED = 20 * 1024 * 1024
export const XLSX_ENTRIES = ["xl/workbook.xml", "xl/sharedStrings.xml", "xl/worksheets/sheet1.xml"] as const
// Compressed bytes are pushed in small chunks, so one push can unpack to at most about 16 MB
// (deflate's ratio limit) before the count is checked again.
const CHUNK = 16 * 1024

export type XlsxError = "notAZip" | "tooLarge" | "noSheet" | "unreadable"
export type XlsxResult = { ok: true; rows: string[][] } | { ok: false; error: XlsxError }

type Unpacked = { ok: true; files: Map<string, Uint8Array> } | { ok: false; error: XlsxError }

function unpack(bytes: Uint8Array, limit: number): Unpacked {
	const parts = new Map<string, Uint8Array[]>()
	let total = 0
	let seen = 0
	let error: XlsxError | undefined
	const unzip = new Unzip((file) => {
		seen++
		if (!(XLSX_ENTRIES as readonly string[]).includes(file.name)) return
		const chunks: Uint8Array[] = []
		parts.set(file.name, chunks)
		file.ondata = (err, data) => {
			if (err !== null) {
				error ??= "unreadable"
				return
			}
			total += data.length
			if (total > limit) {
				error = "tooLarge"
				file.terminate()
				return
			}
			chunks.push(data)
		}
		file.start()
	})
	unzip.register(UnzipInflate)
	try {
		for (let at = 0; at < bytes.length && error === undefined; at += CHUNK) {
			unzip.push(bytes.subarray(at, at + CHUNK), at + CHUNK >= bytes.length)
		}
	} catch {
		return { ok: false, error: seen === 0 ? "notAZip" : (error ?? "unreadable") }
	}
	if (error !== undefined) return { ok: false, error }
	if (seen === 0) return { ok: false, error: "notAZip" }
	const files = new Map<string, Uint8Array>()
	for (const [name, chunks] of parts) {
		const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0))
		let at = 0
		for (const c of chunks) {
			out.set(c, at)
			at += c.length
		}
		files.set(name, out)
	}
	return { ok: true, files }
}

const decode = (bytes: Uint8Array) => new TextDecoder("utf-8").decode(bytes)

// "AB12" is column 27 (0-based), so an empty cell keeps its place.
function columnOf(ref: string | undefined, fallback: number): number {
	const letters = /^([A-Z]{1,3})\d*$/.exec(ref ?? "")?.[1]
	if (letters === undefined) return fallback
	return [...letters].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1
}

// Cheerio in XML mode (htmlparser2's xmlMode) decodes only the five XML entities and never
// reads a DTD, so a declared external entity stays unresolved text.
function sharedStrings(xml: string): string[] {
	const $ = load(xml, { xml: true })
	return $("si")
		.toArray()
		.map((si) =>
			$(si)
				.find("t")
				.filter((_, t) => $(t).parents("rPh").length === 0)
				.toArray()
				.map((t) => $(t).text())
				.join("")
		)
}

export function readFirstSheet(bytes: Uint8Array, limit = MAX_UNPACKED): XlsxResult {
	const unpacked = unpack(bytes, limit)
	if (!unpacked.ok) return unpacked
	const sheet = unpacked.files.get("xl/worksheets/sheet1.xml")
	if (sheet === undefined || !unpacked.files.has("xl/workbook.xml")) return { ok: false, error: "noSheet" }
	try {
		const shared = unpacked.files.has("xl/sharedStrings.xml")
			? sharedStrings(decode(unpacked.files.get("xl/sharedStrings.xml") ?? new Uint8Array()))
			: []
		const $ = load(decode(sheet), { xml: true })
		const rows = $("sheetData > row")
			.toArray()
			.map((row) => {
				const cells: string[] = []
				$(row)
					.children("c")
					.each((i, c) => {
						const cell = $(c)
						const type = cell.attr("t")
						const raw = cell.children("v").text()
						const value =
							type === "s" ? (shared[Number(raw)] ?? "") : type === "inlineStr" ? cell.find("is t").text() : raw
						const at = columnOf(cell.attr("r"), i)
						while (cells.length < at) cells.push("")
						cells[at] = value
					})
				return cells
			})
		return { ok: true, rows }
	} catch {
		return { ok: false, error: "unreadable" }
	}
}
```

- [ ] **Step 6: Run it to see it pass**

Run: `npx vitest run test/xlsx.test.ts`
Expected: PASS. The lying-size test builds about 25 MB of XML in memory; it should still finish in a few seconds. If fflate's streaming reader throws on the lied size before 20 MB, the result is `unreadable`: then check that the throw comes after the count passed the limit (log `total` in a scratch run), and keep `tooLarge` as the answer when it did.

- [ ] **Step 7: Show it red once**

In `unpack`, change `if (total > limit)` to `if (total > limit * 100)`. Run the file: FAIL on "stops at 20 MB" and "never trusts the size an entry declares". Restore, run: PASS. Note it for the PR body.

- [ ] **Step 8: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add package.json package-lock.json src/xlsx/read.ts test/xlsx.test.ts test/xlsxHelpers.ts
git commit -m "feat(pipeline): read the first sheet of an xlsx with fflate, counting real unpacked bytes"
```

---

### Task 12: The NKLM reader, its licence and a binary fetch

**Files:**
- Create: `pipeline/src/registers/nklm.ts`
- Modify: `pipeline/src/net/crawler.ts`, `pipeline/src/sources/registers.ts`, `pipeline/src/sources/hosts.ts`, `docs/licence-requests/README.md`
- Test: `pipeline/test/nklm.test.ts`, `pipeline/test/crawler.test.ts` (extend), `pipeline/test/source.test.ts` (extend), `pipeline/test/allowList.test.ts` (check)

**Interfaces:**
- Consumes: `readFirstSheet` (Task 11), `Get`, `Fetched` (`net/crawler.ts`), `foldNorwegian`, `writeFileAtomic`, `writeJsonAtomic`, `REGISTER_SOURCES`.
- Produces:
  - `net/crawler.ts`: `Kind` gains `"binary"`; `Fetched.bytes?: Buffer` (set for `binary` only; `body` is then `""`).
  - `registers/nklm.ts`: `NKLM_PAGE: string`, `NKLM_FILE_URL: string | undefined`, `type NklmEdition = { date: string; sha256: string }`, `NKLM_EDITIONS: readonly NklmEdition[]`, `type NklmColumns = { name: string; kommuner: string; phone: string; address: string }`, `NKLM_COLUMNS: NklmColumns`, `type NklmRow = { row: number; name: string; kommuner: string[]; phone?: string; address?: string }`, `type NklmRead = { ok: true; date: string; rows: NklmRow[]; unknownKommuner: number } | { ok: false; reason: string }`, `readNklm(bytes: Uint8Array, kommune: (token: string) => string | undefined, editions?: readonly NklmEdition[], columns?: NklmColumns): NklmRead`, `nklmRecordId(date: string, row: number): string`, `kommuneLookup(kommuner: readonly { code: string; name: string }[]): (token: string) => string | undefined`, `fetchNklm(get: Get, dir: string, now: string): Promise<{ ok: true; changed: boolean } | { ok: false; reason: string }>`, `loadNklm(dir: string, file?: string): Uint8Array | undefined`, `sha256Hex(bytes: Uint8Array): string`.

- [ ] **Step 1: Check the file page and the edition, and learn the columns**

The licence I have covers the file NKLM sent me on 05.11.2026, "Oversikt over legevakter i Norge" dated 01.01.2026. Ask me for the local path of that file (I keep it outside the repo). It holds no person names, but treat it like page text: print headers, counts and a hash only.

From `pipeline/` (after Task 11, so `readFirstSheet` exists):

```bash
node --input-type=module -e '
const { readFileSync } = await import("node:fs")
const { createHash } = await import("node:crypto")
const { readFirstSheet } = await import("./src/xlsx/read.ts")
const bytes = readFileSync(process.argv[1])
console.log("sha256", createHash("sha256").update(bytes).digest("hex"))
const r = readFirstSheet(new Uint8Array(bytes))
if (!r.ok) { console.log("error", r.error); process.exit(1) }
console.log("rows", r.rows.length)
const header = r.rows.findIndex((row) => row.filter((c) => c.trim() !== "").length >= 4)
console.log("header row", header, JSON.stringify(r.rows[header]))
' "<path to the NKLM file>"
```

Expected: a hash, a row count, and the header row (column names only). Then look at the shape of the column that lists the kommuner each legevakt covers, printing the first three cells of that column only (kommune names are public KLASS data):

```bash
node --input-type=module -e '
const { readFileSync } = await import("node:fs")
const { readFirstSheet } = await import("./src/xlsx/read.ts")
const [path, header, col] = process.argv.slice(1)
const r = readFirstSheet(new Uint8Array(readFileSync(path)))
console.log(r.rows.slice(Number(header) + 1, Number(header) + 4).map((row) => row[Number(col)]))
' "<path>" <header row> <kommuner column index>
```

Expected: kommune names (or numbers) with a separator. If it holds something else, stop and tell me. Write down the four header names (legevakt name, kommuner covered, phone, address) and whether the sheet also lists legevaktsentraler in a type column (if it does, name that column too).

Now the page. Fetch `https://nklm.norceresearch.no/prosjekter/nasjonalt-legevaktregister` with the crawler as VardeBot (the host is a register in `FIXED_HOSTS` after Step 6; until then build the allow-list with it added by hand), print the `.xlsx` links it holds, then fetch the first and compare its hash with the hash above:

```bash
node --input-type=module -e '
const { createHash } = await import("node:crypto")
const { load } = await import("cheerio/slim")
const { Crawler } = await import("./src/net/crawler.ts")
const { httpsTransport } = await import("./src/net/http.ts")
const { systemClock } = await import("./src/net/clock.ts")
const { AllowList } = await import("./src/net/allowList.ts")
const allowList = new AllowList()
allowList.add("nklm.norceresearch.no", "register", "granted")
const crawler = new Crawler({ transport: httpsTransport, clock: systemClock, allowList })
const page = "https://nklm.norceresearch.no/prosjekter/nasjonalt-legevaktregister"
const res = await crawler.get(page, "html")
if (!res.ok) { console.log("page not fetched:", res.reason, res.status ?? ""); process.exit(1) }
const links = load(res.body)("a[href]").toArray().map((a) => new URL(a.attribs.href, res.finalUrl).href).filter((h) => /\.xlsx(?:$|\?)/i.test(h))
console.log("xlsx links:", links)
' 
```

If the page answers and lists an `.xlsx`, fetch it with kind `"binary"` (after Step 4 below) and print its SHA-256. Record what I found for the PR body: the page answers or not, the file's host, and whether its hash equals the 01.01.2026 file's.

- If the hashes match: `NKLM_FILE_URL` is that link, and if its host is not `nklm.norceresearch.no`, add its host to `FIXED_HOSTS` as a register too (exact host, licence `granted`).
- If they do not, or the page lists no file: `NKLM_FILE_URL` stays `undefined`, and the reader takes the file through `--nklm-file`. The page's URL is still the source URL of every NKLM fact, since it is where the register lives.

- [ ] **Step 2: Write the failing tests**

Create `pipeline/test/nklm.test.ts`:

```ts
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { fetchNklm, kommuneLookup, loadNklm, nklmRecordId, readNklm, sha256Hex } from "../src/registers/nklm.ts"
import { buildXlsx } from "./xlsxHelpers.ts"

const COLUMNS = { name: "Legevakt", kommuner: "Kommuner", phone: "Telefon", address: "Adresse" }
const header = ["Legevakt", "Kommuner", "Telefon", "Adresse"]
const rows = [
	["Oversikt over legevakter (fiktiv)"],
	header,
	["Eksempel legevakt", "Lillehammer, Øyer og 3407", "62 00 00 00", "Storgata 1, 2609 Lillehammer"],
	["Annen legevakt", "Ukjentby", "62 00 00 01", ""],
]
const bytes = buildXlsx(rows)
const EDITIONS = [{ date: "2026-01-01", sha256: sha256Hex(bytes) }]
const lookup = kommuneLookup([
	{ code: "3405", name: "Lillehammer" },
	{ code: "3440", name: "Øyer" },
	{ code: "3407", name: "Gjøvik" },
])

describe("readNklm", () => {
	it("reads each legevakt with the kommuner it covers, by name or number", () => {
		expect(readNklm(bytes, lookup, EDITIONS, COLUMNS)).toEqual({
			ok: true,
			date: "2026-01-01",
			unknownKommuner: 1,
			rows: [
				{
					row: 3,
					name: "Eksempel legevakt",
					kommuner: ["3405", "3440", "3407"],
					phone: "62 00 00 00",
					address: "Storgata 1, 2609 Lillehammer",
				},
				{ row: 4, name: "Annen legevakt", kommuner: [], phone: "62 00 00 01" },
			],
		})
		expect(nklmRecordId("2026-01-01", 3)).toBe("2026-01-01#3")
	})

	it("stops on a new edition: nothing from it is used until the licence is checked", () => {
		const newer = buildXlsx([...rows, ["Ny legevakt", "Lillehammer", "62 00 00 02", ""]])
		expect(readNklm(newer, lookup, EDITIONS, COLUMNS)).toEqual({
			ok: false,
			reason: "new NKLM edition: licence check needed",
		})
	})

	it("stops when a column is missing or renamed, naming the column", () => {
		const renamed = buildXlsx([["Legevakt", "Kommune", "Telefon", "Adresse"], rows[2] ?? []])
		const editions = [{ date: "2026-01-01", sha256: sha256Hex(renamed) }]
		expect(readNklm(renamed, lookup, editions, COLUMNS)).toEqual({
			ok: false,
			reason: "the NKLM file has no column Kommuner",
		})
	})

	it("passes the xlsx reader's refusal on", () => {
		const notZip = new TextEncoder().encode("ikke en fil")
		const editions = [{ date: "2026-01-01", sha256: sha256Hex(notZip) }]
		expect(readNklm(notZip, lookup, editions, COLUMNS)).toEqual({ ok: false, reason: "the NKLM file could not be read: notAZip" })
	})
})

describe("loadNklm and fetchNklm", () => {
	it("takes a local file first, else the last saved copy", () => {
		const dir = mkdtempSync(join(tmpdir(), "varde-nklm-"))
		expect(loadNklm(dir)).toBeUndefined()
		const local = join(dir, "lokal.xlsx")
		writeFileSync(local, bytes)
		expect(loadNklm(dir, local)).toEqual(bytes)
	})

	it("says so when no file URL is known", async () => {
		const dir = mkdtempSync(join(tmpdir(), "varde-nklm-"))
		const result = await fetchNklm(async (url) => ({ ok: false, url, reason: "httpStatus" }), dir, "2026-11-06T10:00:00Z")
		expect(result.ok).toBe(false)
	})
})
```

Add to `pipeline/test/crawler.test.ts`:

```ts
describe("crawler: binary", () => {
	it("keeps a binary body as bytes, untouched by text decoding", async () => {
		const zipStart = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0xff, 0xfe])
		const { crawler } = setup({
			[`${A}/fil.xlsx`]: {
				status: 200,
				headers: { "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
				body: zipStart,
			},
		})
		const res = await crawler.get(`${A}/fil.xlsx`, "binary")
		expect(res.ok && res.bytes).toEqual(zipStart)
		expect(res.ok && res.body).toBe("")
	})

	it("refuses an HTML page asked for as binary", async () => {
		const { crawler } = setup({ [`${A}/fil.xlsx`]: html("<p>Fant ikke</p>") })
		expect(await crawler.get(`${A}/fil.xlsx`, "binary")).toMatchObject({ ok: false, reason: "wrongType" })
	})
})
```

Add to `pipeline/test/source.test.ts`:

```ts
it("passes NKLM register evidence now that its licence is granted", () => {
	const c = candidate({
		sourceUrl: "https://nklm.norceresearch.no/prosjekter/nasjonalt-legevaktregister",
		evidence: { kind: "register", register: "nklm", recordId: "2026-01-01#3" },
		origin: "register",
	})
	const ctx = context({ allowedHosts: new Set(["nklm.norceresearch.no"]) })
	expect(sourceGate(c, ctx)).toEqual({ gate: "source", pass: true, reason: "register nklm (granted)" })
})
```

If `source.test.ts` has a test that NKLM is refused as `pending`, change it to use a register you set to `pending` in that test only, or delete it with a note in the PR body: the licence is now granted.

- [ ] **Step 3: Run them to see them fail**

Run: `npx vitest run test/nklm.test.ts test/crawler.test.ts test/source.test.ts`
Expected: FAIL, `src/registers/nklm.ts` does not exist, `"binary"` is not a kind, and NKLM is still `pending`.

- [ ] **Step 4: Teach the crawler `binary`**

In `src/net/crawler.ts`:

```ts
export type Kind = "html" | "xml" | "json" | "text" | "binary"
```

Add `bytes?: Buffer` to `Fetched` with the comment `// The raw body, for kind "binary" only; body is then "".`. Add to `ACCEPT`:

```ts
	binary: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream",
```

and to `TYPE_FITS`:

```ts
	// A spreadsheet or a plain download; never a page that only looks like one.
	binary: (t) => /spreadsheetml|octet-stream|application\/zip/i.test(t),
```

In `#step`, replace `const body = decodeText(res.body, contentType)` with:

```ts
		const body = kind === "binary" ? "" : decodeText(res.body, contentType)
```

and add `...(kind === "binary" ? { bytes: res.body } : {}),` to the returned `Fetched`.

- [ ] **Step 5: Write `src/registers/nklm.ts`**

Fill the three constants marked below from Step 1. Each gets a comment with the date it was checked.

```ts
import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { writeFileAtomic, writeJsonAtomic } from "../io/files.ts"
import type { Get } from "../net/crawler.ts"
import { foldNorwegian } from "../text/normalise.ts"
import { readFirstSheet } from "../xlsx/read.ts"

// NKLM's list of legevakter («Oversikt over legevakter i Norge, NKLM (NORCE), per 01.01.2026»),
// licence granted by email on 05.11.2026. It finds legevakter and the kommuner each covers. Its
// phone and address are only ever peers for the agreement gate: they must agree with the
// legevakt's own page, never stand alone.

// Where the register lives: the source URL of every NKLM fact. Checked <dd.mm.yyyy>.
export const NKLM_PAGE = "https://nklm.norceresearch.no/prosjekter/nasjonalt-legevaktregister"
// The file on that page, when the page serves the edition the licence covers. Checked <dd.mm.yyyy>:
// <what Step 1 found>. Without it, the file comes through --nklm-file.
export const NKLM_FILE_URL: string | undefined = undefined

export type NklmEdition = { date: string; sha256: string }
// The editions the licence covers, by the file's own hash. Any other file stops the NKLM step,
// whatever its name or date says, until I record that the permission covers it too
// (docs/licence-requests/README.md).
export const NKLM_EDITIONS: readonly NklmEdition[] = [{ date: "2026-01-01", sha256: "<sha256 from Step 1>" }]

export type NklmColumns = { name: string; kommuner: string; phone: string; address: string }
// The header names of the 01.01.2026 file, checked <dd.mm.yyyy>.
export const NKLM_COLUMNS: NklmColumns = {
	name: "<legevakt name header>",
	kommuner: "<kommuner header>",
	phone: "<phone header>",
	address: "<address header>",
}

export type NklmRow = { row: number; name: string; kommuner: string[]; phone?: string; address?: string }
export type NklmRead =
	| { ok: true; date: string; rows: NklmRow[]; unknownKommuner: number }
	| { ok: false; reason: string }

export const sha256Hex = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex")
export const nklmRecordId = (date: string, row: number) => `${date}#${row}`

// A kommune by its four-digit number or its KLASS name, folded: "Øyer", "oyer" and "3440" are one.
export function kommuneLookup(kommuner: readonly { code: string; name: string }[]): (token: string) => string | undefined {
	const byName = new Map(kommuner.map((k) => [foldNorwegian(k.name), k.code]))
	const codes = new Set(kommuner.map((k) => k.code))
	return (token) => {
		const t = token.trim()
		if (/^\d{4}$/.test(t)) return codes.has(t) ? t : undefined
		return byName.get(foldNorwegian(t))
	}
}

const SEPARATOR = /\s*[,;\n/]\s*|\s+og\s+/

// Reasons may name a column header (public) but never a cell's value.
export function readNklm(
	bytes: Uint8Array,
	kommune: (token: string) => string | undefined,
	editions: readonly NklmEdition[] = NKLM_EDITIONS,
	columns: NklmColumns = NKLM_COLUMNS
): NklmRead {
	const edition = editions.find((e) => e.sha256 === sha256Hex(bytes))
	if (edition === undefined) return { ok: false, reason: "new NKLM edition: licence check needed" }
	const sheet = readFirstSheet(bytes)
	if (!sheet.ok) return { ok: false, reason: `the NKLM file could not be read: ${sheet.error}` }
	const headerAt = sheet.rows.findIndex((r) => r.some((c) => c.trim() === columns.name))
	const header = sheet.rows[headerAt] ?? []
	const index: Partial<Record<keyof NklmColumns, number>> = {}
	for (const key of Object.keys(columns) as (keyof NklmColumns)[]) {
		const at = header.findIndex((c) => c.trim() === columns[key])
		if (at < 0) return { ok: false, reason: `the NKLM file has no column ${columns[key]}` }
		index[key] = at
	}
	let unknownKommuner = 0
	const rows: NklmRow[] = []
	sheet.rows.slice(headerAt + 1).forEach((cells, i) => {
		const cell = (key: keyof NklmColumns) => (cells[index[key] ?? -1] ?? "").trim()
		const name = cell("name")
		if (name === "") return
		const codes: string[] = []
		for (const token of cell("kommuner").split(SEPARATOR).filter((t) => t !== "")) {
			const code = kommune(token)
			if (code === undefined) unknownKommuner++
			else if (!codes.includes(code)) codes.push(code)
		}
		const row: NklmRow = { row: headerAt + 2 + i, name, kommuner: codes }
		if (cell("phone") !== "") row.phone = cell("phone")
		if (cell("address") !== "") row.address = cell("address")
		rows.push(row)
	})
	return { ok: true, date: edition.date, rows, unknownKommuner }
}

const FILE = "nklm.xlsx"
const STATE = "state.json"

// A local file I name, else the copy the last --nklm-fetch saved in <cache>/nklm/.
export function loadNklm(dir: string, file?: string): Uint8Array | undefined {
	const path = file ?? join(dir, FILE)
	return existsSync(path) ? new Uint8Array(readFileSync(path)) : undefined
}

// Fetches the file only when asked, and keeps its date, hash and URL in state.json, so a run can
// tell me whether it changed. The raw file stays in the cache folder and is never committed.
export async function fetchNklm(
	get: Get,
	dir: string,
	now: string
): Promise<{ ok: true; changed: boolean } | { ok: false; reason: string }> {
	if (NKLM_FILE_URL === undefined) return { ok: false, reason: "no NKLM file URL is known: use --nklm-file" }
	const res = await get(NKLM_FILE_URL, "binary")
	if (!res.ok || res.bytes === undefined) return { ok: false, reason: "the NKLM file was not fetched" }
	const bytes = new Uint8Array(res.bytes)
	const sha256 = sha256Hex(bytes)
	const statePath = join(dir, STATE)
	const before = existsSync(statePath) ? (JSON.parse(readFileSync(statePath, "utf8")) as { sha256?: string }) : {}
	const date = NKLM_EDITIONS.find((e) => e.sha256 === sha256)?.date
	writeFileAtomic(join(dir, FILE), bytes)
	writeJsonAtomic(statePath, { date: date ?? null, sha256, url: NKLM_FILE_URL, savedAt: now })
	return { ok: true, changed: before.sha256 !== sha256 }
}
```

`writeFileAtomic` in `src/io/files.ts` takes a string today. Widen it to `data: string | Uint8Array` (the body is unchanged: `writeFileSync` takes both), so the file is written byte for byte.

- [ ] **Step 6: Grant the licence and allow the host**

`src/sources/registers.ts`: change the NKLM line to `nklm: { host: "nklm.norceresearch.no", licence: "granted" },` (or the host Step 1 found for the register page), and the comment above `REGISTER_SOURCES` to: "Nav describes its own offices, so its office pages are ownPage. NKLM said yes by email on 05.11.2026 for its 01.01.2026 file."

`src/sources/hosts.ts`: add `register("nklm"),` to `FIXED_HOSTS` after `register("nav")`, and in the comment above it replace "NKLM and the Aim API (api.aimcms.no) are not fetched until their owners answer." with "The Aim API (api.aimcms.no) is not fetched until Prokom answers." If Step 1 found the file on another host, add `{ host: "<that host>", kind: "register", licence: "granted" }` with a comment saying it serves the NKLM file.

`docs/licence-requests/README.md`: in the NKLM row, fill the Answer column with `05.11.2026: yes, from an NKLM adviser, for the file dated 01.01.2026 (granted)`, and add a paragraph under the table:

```markdown
NKLM's permission covers the file dated 01.01.2026. The pipeline knows that file by its hash
(`pipeline/src/registers/nklm.ts`, `NKLM_EDITIONS`), so a new edition stops the NKLM step until
I record here that the permission covers it too. Credit line for "Kilder og lisenser":
«Oversikt over legevakter i Norge, NKLM (NORCE), per 01.01.2026».
```

- [ ] **Step 7: Run the tests to see them pass**

Run: `npx vitest run test/nklm.test.ts test/crawler.test.ts test/source.test.ts test/allowList.test.ts && npm test`
Expected: PASS. An allow-list test that lists `FIXED_HOSTS` exactly needs the NKLM host added to its expected list.

- [ ] **Step 8: Show it red once**

In `readNklm`, delete the edition check (the first two lines). Run `npx vitest run test/nklm.test.ts`: FAIL on "stops on a new edition". Restore, run: PASS. Note it for the PR body.

- [ ] **Step 9: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add src/registers/nklm.ts src/net/crawler.ts src/io/files.ts src/sources/registers.ts src/sources/hosts.ts ../docs/licence-requests/README.md test/nklm.test.ts test/crawler.test.ts test/source.test.ts test/allowList.test.ts
git commit -m "feat(pipeline): read NKLM's legevakt list, by licensed edition only"
```

---

### Task 13: The kommune switchboard from Brreg

**Files:**
- Modify: `pipeline/src/registers/brreg.ts`, `pipeline/src/discover/types.ts`, `pipeline/src/discover/discover.ts`, `pipeline/test/fixtures/brreg/komm.json`
- Test: `pipeline/test/brreg.test.ts` (extend), `pipeline/test/discover.test.ts` (extend)

**Interfaces:**
- Consumes: `fitsNumberPlan` (`gates/validity.ts`), `isMobileDigits` (Task 3), `phoneDigits`.
- Produces:
  - `registers/brreg.ts`: `BrregUnit.switchboard?: string`, `kommuneSwitchboards(units: readonly BrregUnit[]): Map<string, { phone: string; orgNumber: string }>`, `brregRecordUrl(register: BrregRegister, orgNumber: string): string`.
  - `discover/types.ts`: `KommuneDiscovery.switchboard?: { phone: string; orgNumber: string }`.

- [ ] **Step 1: Give the fixture kommune a switchboard**

In `pipeline/test/fixtures/brreg/komm.json`, add `"telefon": "62 00 00 00", "mobil": "900 00 001",` to the Lillehammer record and `"telefon": "900 00 002",` to the Oslo record (a mobile-shaped value the reader must refuse).

- [ ] **Step 2: Write the failing tests**

Add to `pipeline/test/brreg.test.ts`:

```ts
import { brregRecordUrl, kommuneSwitchboards } from "../src/registers/brreg.ts"

describe("the kommune switchboard", () => {
	it("reads telefon from the kommune's own record only, never mobil", () => {
		const page = parseBrregPage(fixture("komm.json"), "enheter")
		const units = page?.units ?? []
		expect(units.find((u) => u.kommune === "3405")?.switchboard).toBe("62 00 00 00")
		expect(JSON.stringify(units)).not.toContain("900 00 001")
		expect([...kommuneSwitchboards(units)]).toEqual([["3405", { phone: "62 00 00 00", orgNumber: "999999981" }]])
	})

	it("refuses a mobile-shaped switchboard", () => {
		const units = parseBrregPage(fixture("komm.json"), "enheter")?.units ?? []
		expect(units.find((u) => u.kommune === "0301")?.switchboard).toBeUndefined()
	})

	it("still reads no telefon for any other unit", () => {
		const page = parseBrregPage(fixture("units.json"), "underenheter")
		expect(page?.units.every((u) => u.switchboard === undefined)).toBe(true)
	})

	it("points a record at Brreg's own API", () => {
		expect(brregRecordUrl("enheter", "999999981")).toBe("https://data.brreg.no/enhetsregisteret/api/enheter/999999981")
	})
})
```

In `pipeline/test/discover.test.ts`, in the test that checks `3405`'s discovery (`expect(k).toMatchObject({ kommune: "3405", ... })`), add:

```ts
		expect(k?.switchboard).toEqual({ phone: "62 00 00 00", orgNumber: "999999981" })
		expect(JSON.stringify(k?.units)).not.toContain("switchboard")
```

- [ ] **Step 3: Run them to see them fail**

Run: `npx vitest run test/brreg.test.ts test/discover.test.ts`
Expected: FAIL, `switchboard` is never set.

- [ ] **Step 4: Change `src/registers/brreg.ts`**

Import `fitsNumberPlan` from `../gates/validity.ts`, `isMobileDigits` from `../text/phone.ts` and add `phoneDigits` to the `../text/normalise.ts` import. Replace the comment above `Address` with:

```ts
// z.object drops every key it does not name, so mobil and epostadresse are never read. telefon
// is read, and kept only for the kommune's own record (KOMM): its switchboard, rank 3 of the
// phone order. A mobile-shaped value is refused, since a switchboard is never a person's phone.
```

Add `telefon: z.string().optional(),` to `Unit`, `switchboard?: string` to `BrregUnit`, and in `parseBrregPage` after the `parent` line:

```ts
		const phone = u.telefon?.trim()
		if (u.organisasjonsform.kode === "KOMM" && phone !== undefined) {
			const digits = phoneDigits(phone)
			if (fitsNumberPlan(digits) && !isMobileDigits(digits)) unit.switchboard = phone
		}
```

Then add:

```ts
// Each kommune's switchboard, from its KOMM record, with the record's org number as evidence.
export function kommuneSwitchboards(units: readonly BrregUnit[]): Map<string, { phone: string; orgNumber: string }> {
	const boards = new Map<string, { phone: string; orgNumber: string }>()
	for (const u of units) {
		if (u.orgForm === "KOMM" && u.kommune !== undefined && u.switchboard !== undefined) {
			boards.set(u.kommune, { phone: u.switchboard, orgNumber: u.orgNumber })
		}
	}
	return boards
}

export const brregRecordUrl = (register: BrregRegister, orgNumber: string) => `${BRREG_API}/${register}/${orgNumber}`
```

- [ ] **Step 5: Carry it into discover**

`src/discover/types.ts`: add to `KommuneDiscovery`, after `site`:

```ts
	// The kommune's own switchboard from its Brreg record (rank 3 of the phone order). Optional,
	// so a discovery file written before PR 3 still parses.
	switchboard: z.strictObject({ phone: NonBlank, orgNumber: z.string().regex(/^\d{9}$/) }).optional(),
```

`src/discover/discover.ts`: import `kommuneSwitchboards`; in `discover()`, after `const sites = kommuneSites(komm.units)`, add `const boards = kommuneSwitchboards(komm.units)`; pass `boards.get(k.code)` to `discoverKommune` as a fourth argument `board: { phone: string; orgNumber: string } | undefined`, and set it on the discovery before `return discovery`:

```ts
	if (board !== undefined) discovery.switchboard = board
```

In `sortUnits`, drop the field from units, so a KOMM record found by another query can never carry it into `units` (whose schema is strict):

```ts
	return [...byOrg.values()]
		.sort((a, b) => (a.orgNumber < b.orgNumber ? -1 : 1))
		.map(({ switchboard: _switchboard, ...unit }) => unit)
```

and change its return type to `Omit<BrregUnit, "switchboard">[]`.

- [ ] **Step 6: Run the tests to see them pass**

Run: `npx vitest run test/brreg.test.ts test/discover.test.ts && npm test`
Expected: PASS.

- [ ] **Step 7: Show it red once**

Delete `&& !isMobileDigits(digits)`. Run `npx vitest run test/brreg.test.ts`: FAIL on "refuses a mobile-shaped switchboard". Restore, run: PASS. Note it for the PR body.

- [ ] **Step 8: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add src/registers/brreg.ts src/discover/types.ts src/discover/discover.ts test/fixtures/brreg/komm.json test/brreg.test.ts test/discover.test.ts
git commit -m "feat(pipeline): read the kommune's switchboard from its own Brreg record"
```

---

### Task 14: Matching pages to units, and who gets in

**Files:**
- Create: `pipeline/src/curate/categories.ts`, `pipeline/src/curate/include.ts`
- Test: `pipeline/test/categories.test.ts`, `pipeline/test/include.test.ts`

**Interfaces:**
- Consumes: `DiscoveredUnit` (`discover/types.ts`), `ExtractedPage` (Task 1), `Inclusion` (Task 1), `namesMatch` (`recall/match.ts`), `unitId` (`schema/ids.ts`), `normaliseUrl`, `siteHost`, `foldNorwegian`, `CATEGORY_SLUGS`.
- Produces:
  - `curate/categories.ts`: `SN_CATEGORIES`, `PATH_CATEGORIES`, `categoriesFor(input: { naeringskode?: string; urls: readonly string[]; nklmLegevakt: boolean }): { categories: CategorySlug[]; known: boolean; isKrisesenter: boolean }`, `providerTypeFor(input: { orgForm?: string; urls: readonly string[]; kommuneHost?: string }): ProviderType | undefined`.
  - `curate/include.ts`: `type UnitGroup = { unitId: string; unit?: DiscoveredUnit; pages: ExtractedPage[]; name: string; matchName: string; categories: CategorySlug[]; isKrisesenter: boolean; providerType?: ProviderType; inclusion: Inclusion }`, `type MatchInput = { units: readonly DiscoveredUnit[]; pages: readonly ExtractedPage[]; national: ReadonlySet<string>; addressId: (address: string) => string | undefined; kommuneHost?: string; nklmLegevakt: (pageName: string) => boolean }`, `type MatchResult = { groups: UnitGroup[]; noUnitId: number; unitsWithoutPage: number; pagesWithProblem: number; nationalUnmatched: number }`, `matchUnits(input: MatchInput): MatchResult`, `pageName(page: ExtractedPage): string | undefined`, `pageAddress(page: ExtractedPage): string | undefined`.

`name` is the name Varde would show (the page's h1, or the Brreg name when the page is shared or has no h1); `matchName` is the one block headings are matched against (the Brreg name when there is a unit, else the h1).

- [ ] **Step 1: Write the failing tests**

Create `pipeline/test/categories.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { categoriesFor, providerTypeFor } from "../src/curate/categories.ts"

const K = "https://www.eksempel.kommune.no"

describe("categoriesFor", () => {
	it("knows a category from an SN2025 code or a path word, one-to-one", () => {
		expect(categoriesFor({ naeringskode: "86.942", urls: [], nklmLegevakt: false })).toEqual({
			categories: ["familie-og-barn"],
			known: true,
			isKrisesenter: false,
		})
		expect(categoriesFor({ urls: [`${K}/helse/legevakt/`], nklmLegevakt: false })).toMatchObject({
			categories: ["nodtjenester"],
			known: true,
		})
		expect(categoriesFor({ naeringskode: "87.999", urls: [], nklmLegevakt: false })).toEqual({
			categories: ["vold-og-overgrep", "nodtjenester"],
			known: true,
			isKrisesenter: true,
		})
	})

	it("knows a legevakt from NKLM", () => {
		expect(categoriesFor({ urls: [`${K}/helse/`], nklmLegevakt: true })).toMatchObject({ categories: ["nodtjenester"], known: true })
	})

	it("maps the ambiguous codes and barnevernvakt to nothing, so the unit goes to review", () => {
		for (const code of ["86.941", "88.995", "88.994", "88.996"]) {
			expect(categoriesFor({ naeringskode: code, urls: [], nklmLegevakt: false }).known).toBe(false)
		}
		expect(categoriesFor({ urls: [`${K}/barnevernvakt/`], nklmLegevakt: false }).known).toBe(false)
	})

	it("is not known when the code and the path disagree, but suggests both", () => {
		expect(categoriesFor({ naeringskode: "86.942", urls: [`${K}/gjeldsradgivning/`], nklmLegevakt: false })).toEqual({
			categories: ["okonomi", "familie-og-barn"],
			known: false,
			isKrisesenter: false,
		})
	})
})

describe("providerTypeFor", () => {
	it("is offentlig on the kommune's site, on nav.no, or for a public form", () => {
		expect(providerTypeFor({ urls: [`${K}/x/`], kommuneHost: "www.eksempel.kommune.no" })).toBe("offentlig")
		expect(providerTypeFor({ urls: ["https://www.nav.no/kontor/nav-eksempel"] })).toBe("offentlig")
		expect(providerTypeFor({ orgForm: "IKS", urls: ["https://www.krisesenter.no/"] })).toBe("offentlig")
	})

	it("is frivillig for an association or a foundation, and unknown otherwise", () => {
		expect(providerTypeFor({ orgForm: "FLI", urls: ["https://www.eksempel-forening.no/"] })).toBe("frivillig")
		expect(providerTypeFor({ orgForm: "BEDR", urls: ["https://www.eksempel-forening.no/"] })).toBeUndefined()
	})
})
```

Create `pipeline/test/include.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { matchUnits } from "../src/curate/include.ts"
import type { DiscoveredUnit } from "../src/discover/types.ts"
import type { ExtractedPage } from "../src/schema/extraction.ts"

const K = "https://www.eksempel.kommune.no"
const unit = (over: Partial<DiscoveredUnit> = {}): DiscoveredUnit => ({
	orgNumber: "999999991",
	name: "EKSEMPEL KOMMUNE HELSESTASJON",
	orgForm: "BEDR",
	naeringskode: "86.942",
	address: "Storgata 1, 2609 LILLEHAMMER",
	kommune: "3405",
	website: `${K}/helsestasjon/`,
	register: "underenheter",
	...over,
})
const page = (url: string, over: Partial<ExtractedPage> = {}): ExtractedPage => ({
	url,
	finalUrl: url,
	fetchedAt: "2026-11-06T09:00:00Z",
	adapter: "acos",
	fallback: false,
	blocks: [],
	candidates: [
		{ field: "name", value: "Eksempel helsestasjon", evidence: { kind: "quote", quotes: ["Eksempel helsestasjon"] }, origin: "unitPage" },
		{
			field: "address",
			value: "Storgata 1, 2609 Lillehammer",
			evidence: { kind: "quote", quotes: ["Storgata 1, 2609 Lillehammer"] },
			origin: "unitContact",
		},
	],
	lavterskelQuotes: [],
	...over,
})
const base = {
	national: new Set<string>(),
	addressId: (a: string) => (/storgata 1,/i.test(a) ? "adr-1" : undefined),
	kommuneHost: "www.eksempel.kommune.no",
	nklmLegevakt: () => false,
}

describe("matchUnits", () => {
	it("includes one unit with one page and a known category, automatically", () => {
		const result = matchUnits({ ...base, units: [unit()], pages: [page(`${K}/helsestasjon/`)] })
		expect(result.groups).toMatchObject([
			{
				unitId: "org:999999991",
				name: "Eksempel helsestasjon",
				categories: ["familie-og-barn"],
				providerType: "offentlig",
				inclusion: { status: "auto", reason: "one register unit, one page, a known category" },
			},
		])
	})

	it("matches by name and Kartverket address id when the unit lists no website", () => {
		const result = matchUnits({ ...base, units: [unit({ website: undefined })], pages: [page(`${K}/helse/hs/`)] })
		expect(result.groups[0]?.unitId).toBe("org:999999991")
	})

	it("never includes a page that two register units match: both are review questions", () => {
		const two = [unit(), unit({ orgNumber: "999999992", name: "EKSEMPEL HELSESTASJON NORD" })]
		const result = matchUnits({ ...base, units: two, pages: [page(`${K}/helsestasjon/`)] })
		expect(result.groups.map((g) => [g.unitId, g.inclusion.status, g.inclusion.reason])).toEqual([
			["org:999999991", "review", "two or more register units share the page"],
			["org:999999992", "review", "two or more register units share the page"],
		])
		expect(result.groups[1]?.name).toBe("EKSEMPEL HELSESTASJON NORD")
	})

	it("asks about a unit with two pages, and about a unit with no known category", () => {
		const twoPages = matchUnits({
			...base,
			units: [unit({ website: undefined })],
			pages: [page(`${K}/a/`), page(`${K}/b/`)],
		})
		expect(twoPages.groups[0]?.inclusion).toMatchObject({ status: "review", reason: "the unit has two or more pages" })
		const unknown = matchUnits({
			...base,
			units: [unit({ naeringskode: "88.995", website: `${K}/tjenester/` })],
			pages: [page(`${K}/tjenester/`)],
		})
		expect(unknown.groups[0]?.inclusion).toMatchObject({ status: "review", reason: "no known category" })
	})

	it("gives a page with no unit an address id, and counts a page it cannot name", () => {
		const result = matchUnits({ ...base, units: [], pages: [page(`${K}/x/`), page(`${K}/y/`, { candidates: [] })] })
		expect(result.groups.map((g) => [g.unitId, g.inclusion.reason])).toEqual([
			["adr:adr-1:eksempel-helsestasjon", "no register unit matches the page"],
		])
		expect(result.noUnitId).toBe(1)
	})

	it("counts a unit without a page, a page with a problem, and a national page no unit claims", () => {
		const result = matchUnits({
			...base,
			national: new Set(["https://www.nav.no/kontor/nav-eksempel"]),
			units: [unit({ website: undefined, address: undefined })],
			pages: [
				page(`${K}/z/`, { problem: "cacheMismatch", candidates: [] }),
				page("https://www.nav.no/kontor/nav-eksempel", { orgNumber: "999999993" }),
			],
		})
		expect(result).toMatchObject({ groups: [], unitsWithoutPage: 1, pagesWithProblem: 1, nationalUnmatched: 1 })
	})

	it("joins a Nav office page by its org number", () => {
		const nav = unit({ orgNumber: "999999993", naeringskode: "88.995", website: undefined, address: undefined })
		const result = matchUnits({
			...base,
			national: new Set(["https://www.nav.no/kontor/nav-eksempel"]),
			units: [nav],
			pages: [page("https://www.nav.no/kontor/nav-eksempel", { orgNumber: "999999993" })],
		})
		expect(result.groups[0]).toMatchObject({ unitId: "org:999999993", providerType: "offentlig" })
	})
})
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run test/categories.test.ts test/include.test.ts`
Expected: FAIL, the modules do not exist.

- [ ] **Step 3: Write `src/curate/categories.ts`**

```ts
import { CATEGORY_SLUGS, type CategorySlug } from "../schema/common.ts"
import type { ProviderType } from "../schema/common.ts"
import { foldNorwegian, siteHost } from "../text/normalise.ts"

// Categories a unit gets without my look. One-to-one cases only, confirmed by me at plan review
// (PR 3 plan, decision 9). Checked against the 138-row answer key on 06.11.2026:
// - helsestasjon: the two key rows (helsestasjon for ungdom) also carry psykisk-helse.
// - barnevern: 4 of 6 agree; the two barnevernvakt rows also carry nodtjenester and
//   vold-og-overgrep, so barnevernvakt maps to nothing.
// - familievern 5 of 5, gjeldsrådgivning 2 of 2.
// - krisesenter: all 4 key rows carry vold-og-overgrep and nodtjenester (2 also bolig).
// - legevakt: all 4 carry nodtjenester; 3 also psykisk-helse.
// 86.941, 88.995, 88.994 and 88.996 map to nothing: those units are one review question each.
export const SN_CATEGORIES: Readonly<Record<string, readonly CategorySlug[]>> = {
	"86.942": ["familie-og-barn"],
	"88.991": ["familie-og-barn"],
	"88.992": ["familie-og-barn"],
	"87.999": ["vold-og-overgrep", "nodtjenester"],
}

// Path words, as discover's path words read them: a word of the folded path that starts with the
// stem. The first stem that matches a word wins, so barnevernvakt is tried before barnevern.
// null marks a known service with no one-to-one category.
export const PATH_CATEGORIES: readonly { stem: string; categories: readonly CategorySlug[] | null }[] = [
	{ stem: "barnevernvakt", categories: null },
	{ stem: "helsestasjon", categories: ["familie-og-barn"] },
	{ stem: "barnevern", categories: ["familie-og-barn"] },
	{ stem: "familievern", categories: ["familie-og-barn"] },
	{ stem: "krisesenter", categories: ["vold-og-overgrep", "nodtjenester"] },
	{ stem: "legevakt", categories: ["nodtjenester"] },
	{ stem: "gjeldsradgiv", categories: ["okonomi"] },
]

const LEGEVAKT: readonly CategorySlug[] = ["nodtjenester"]

function pathWords(url: string): string[] {
	try {
		return foldNorwegian(decodeURIComponent(new URL(url).pathname))
			.split(/[^a-z0-9]+/)
			.filter((w) => w !== "")
	} catch {
		return []
	}
}

const ordered = (slugs: Iterable<CategorySlug>) => {
	const set = new Set(slugs)
	return CATEGORY_SLUGS.filter((s) => set.has(s))
}

export function categoriesFor(input: { naeringskode?: string; urls: readonly string[]; nklmLegevakt: boolean }): {
	categories: CategorySlug[]
	known: boolean
	isKrisesenter: boolean
} {
	const found: (readonly CategorySlug[])[] = []
	let ambiguous = false
	let krisesenter = input.naeringskode === "87.999"
	// A code the table does not map adds nothing, so a unit known only by it stays unknown.
	const code = input.naeringskode === undefined ? undefined : SN_CATEGORIES[input.naeringskode]
	if (code !== undefined) found.push(code)
	for (const url of input.urls) {
		for (const word of pathWords(url)) {
			const hit = PATH_CATEGORIES.find((p) => word.startsWith(p.stem))
			if (hit === undefined) continue
			if (hit.stem === "krisesenter") krisesenter = true
			if (hit.categories === null) ambiguous = true
			else found.push(hit.categories)
		}
	}
	if (input.nklmLegevakt) found.push(LEGEVAKT)
	// Known only when every source gives the same set; otherwise all of them are my suggestion.
	const distinct = new Set(found.map((c) => ordered(c).join(",")))
	return { categories: ordered(found.flat()), known: distinct.size === 1 && !ambiguous, isKrisesenter: krisesenter }
}

const PUBLIC_FORMS: ReadonlySet<string> = new Set(["KOMM", "ORGL", "STAT", "IKS", "KF", "FYLK", "SF"])
const VOLUNTARY_FORMS: ReadonlySet<string> = new Set(["FLI", "STI"])

// offentlig for a page on the kommune's own site or nav.no, or a public organisation form;
// frivillig for an association (FLI) or a foundation (STI). A sub-unit's form (BEDR) says
// nothing, so it stays unknown and the unit goes to review.
export function providerTypeFor(input: { orgForm?: string; urls: readonly string[]; kommuneHost?: string }): ProviderType | undefined {
	const own = input.kommuneHost === undefined ? undefined : siteHost(`https://${input.kommuneHost}/`)
	const hosts = input.urls.map(siteHost)
	if (hosts.some((h) => h !== undefined && (h === own || h === "nav.no"))) return "offentlig"
	if (input.orgForm !== undefined && PUBLIC_FORMS.has(input.orgForm)) return "offentlig"
	if (input.orgForm !== undefined && VOLUNTARY_FORMS.has(input.orgForm)) return "frivillig"
	return undefined
}
```

- [ ] **Step 4: Write `src/curate/include.ts`**

```ts
import type { DiscoveredUnit } from "../discover/types.ts"
import { namesMatch } from "../recall/match.ts"
import type { CategorySlug, ProviderType } from "../schema/common.ts"
import type { ExtractedPage } from "../schema/extraction.ts"
import { unitId } from "../schema/ids.ts"
import type { Inclusion } from "../schema/lock.ts"
import { normaliseUrl } from "../text/normalise.ts"
import { categoriesFor, providerTypeFor } from "./categories.ts"

export type UnitGroup = {
	unitId: string
	unit?: DiscoveredUnit
	pages: ExtractedPage[]
	name: string
	matchName: string
	categories: CategorySlug[]
	isKrisesenter: boolean
	providerType?: ProviderType
	inclusion: Inclusion
}

export type MatchInput = {
	units: readonly DiscoveredUnit[]
	pages: readonly ExtractedPage[]
	// Nav office pages and other pages found nationally: they join a kommune only through a unit.
	national: ReadonlySet<string>
	addressId: (address: string) => string | undefined
	kommuneHost?: string
	nklmLegevakt: (pageName: string) => boolean
}

export type MatchResult = {
	groups: UnitGroup[]
	noUnitId: number
	unitsWithoutPage: number
	pagesWithProblem: number
	nationalUnmatched: number
}

const valueOf = (page: ExtractedPage, field: "name" | "address") => {
	const c = page.candidates.find((x) => x.field === field && x.origin !== "register")
	return typeof c?.value === "string" ? c.value : undefined
}
export const pageName = (page: ExtractedPage) => valueOf(page, "name")
export const pageAddress = (page: ExtractedPage) => valueOf(page, "address")

// A Brreg unit and a page belong together by the unit's website, by the org number the page
// carries (Nav office data), or by name plus the same Kartverket address id.
function belongs(u: DiscoveredUnit, p: ExtractedPage, addressId: MatchInput["addressId"]): boolean {
	if (u.website !== undefined) {
		const site = normaliseUrl(u.website)
		if (site === normaliseUrl(p.url) || site === normaliseUrl(p.finalUrl)) return true
	}
	if (p.orgNumber !== undefined && p.orgNumber === u.orgNumber) return true
	const name = pageName(p)
	const address = pageAddress(p)
	if (name === undefined || address === undefined || u.address === undefined) return false
	const id = addressId(address)
	return id !== undefined && id === addressId(u.address) && namesMatch(u.name, name)
}

const byUnitId = (a: UnitGroup, b: UnitGroup) => (a.unitId < b.unitId ? -1 : a.unitId > b.unitId ? 1 : 0)

// Which pages belong to which unit, and whether each unit gets in without my look. Exactly one
// unit for one page, that unit on no other page, a known category and a known provider type is
// automatic. Anything else is one question for me. Reasons never hold a name or a value.
export function matchUnits(input: MatchInput): MatchResult {
	let pagesWithProblem = 0
	let nationalUnmatched = 0
	let noUnitId = 0
	const usable = input.pages.filter((p) => {
		if (p.problem === undefined) return true
		pagesWithProblem++
		return false
	})
	const unitsOf = new Map<ExtractedPage, DiscoveredUnit[]>()
	const pagesOf = new Map<DiscoveredUnit, ExtractedPage[]>()
	for (const p of usable) {
		const units = input.units.filter((u) => belongs(u, p, input.addressId))
		unitsOf.set(p, units)
		for (const u of units) pagesOf.set(u, [...(pagesOf.get(u) ?? []), p])
	}
	const groups = new Map<string, UnitGroup>()
	for (const [u, pages] of pagesOf) {
		const shared = pages.some((p) => (unitsOf.get(p)?.length ?? 0) > 1)
		const h1 = pages.length === 1 && !shared ? pageName(pages[0] as ExtractedPage) : undefined
		const urls = pages.map((p) => p.finalUrl)
		const legevakt = pages.some((p) => {
			const n = pageName(p)
			return n !== undefined && input.nklmLegevakt(n)
		})
		const cat = categoriesFor({ ...(u.naeringskode === undefined ? {} : { naeringskode: u.naeringskode }), urls, nklmLegevakt: legevakt })
		const providerType = providerTypeFor({
			orgForm: u.orgForm,
			urls,
			...(input.kommuneHost === undefined ? {} : { kommuneHost: input.kommuneHost }),
		})
		const reason = shared
			? "two or more register units share the page"
			: pages.length > 1
				? "the unit has two or more pages"
				: !cat.known
					? "no known category"
					: providerType === undefined
						? "the provider type is unknown"
						: undefined
		const inclusion: Inclusion = {
			status: reason === undefined ? "auto" : "review",
			reason: reason ?? "one register unit, one page, a known category",
			suggestedCategories: cat.categories,
			...(providerType === undefined ? {} : { providerType }),
		}
		const id = unitId({ orgNumber: u.orgNumber, name: u.name })
		groups.set(id, {
			unitId: id,
			unit: u,
			pages,
			name: h1 ?? u.name,
			matchName: u.name,
			categories: cat.categories,
			isKrisesenter: cat.isKrisesenter,
			...(providerType === undefined ? {} : { providerType }),
			inclusion,
		})
	}
	for (const p of usable) {
		if ((unitsOf.get(p)?.length ?? 0) > 0) continue
		if (input.national.has(p.url)) {
			nationalUnmatched++
			continue
		}
		const name = pageName(p)
		const address = pageAddress(p)
		const addressId = address === undefined ? undefined : input.addressId(address)
		let id: string | undefined
		try {
			id = name === undefined || addressId === undefined ? undefined : unitId({ addressId, name })
		} catch {
			id = undefined
		}
		if (id === undefined || name === undefined) {
			// No org number and no resolvable address: no unit id, so nothing is stored. PR 4 measures it.
			noUnitId++
			continue
		}
		const existing = groups.get(id)
		if (existing !== undefined) {
			existing.pages.push(p)
			continue
		}
		const cat = categoriesFor({ urls: [p.finalUrl], nklmLegevakt: input.nklmLegevakt(name) })
		const providerType = providerTypeFor({
			urls: [p.finalUrl],
			...(input.kommuneHost === undefined ? {} : { kommuneHost: input.kommuneHost }),
		})
		groups.set(id, {
			unitId: id,
			pages: [p],
			name,
			matchName: name,
			categories: cat.categories,
			isKrisesenter: cat.isKrisesenter,
			...(providerType === undefined ? {} : { providerType }),
			inclusion: {
				status: "review",
				reason: "no register unit matches the page",
				suggestedCategories: cat.categories,
				...(providerType === undefined ? {} : { providerType }),
			},
		})
	}
	const unitsWithoutPage = input.units.filter((u) => !pagesOf.has(u)).length
	return { groups: [...groups.values()].sort(byUnitId), noUnitId, unitsWithoutPage, pagesWithProblem, nationalUnmatched }
}
```

- [ ] **Step 5: Run the tests to see them pass**

Run: `npx vitest run test/categories.test.ts test/include.test.ts`
Expected: PASS. The two units in "never includes a page that two register units match" both list the hub page as their website (the fixture default), the realistic case of two Brreg sub-units pointing at one kommune page.

- [ ] **Step 6: Show it red once**

In `matchUnits`, change `const shared = pages.some((p) => (unitsOf.get(p)?.length ?? 0) > 1)` to `const shared = false`. Run `npx vitest run test/include.test.ts`: FAIL on "never includes a page that two register units match". Restore, run: PASS. Note it for the PR body.

- [ ] **Step 7: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add src/curate/categories.ts src/curate/include.ts test/categories.test.ts test/include.test.ts
git commit -m "feat(pipeline): match pages to Brreg units and decide which get in without a question"
```

---

### Task 15: The real GateContext

**Files:**
- Create: `pipeline/src/verify/context.ts`
- Test: `pipeline/test/context.test.ts`

**Interfaces:**
- Consumes: `GateContext`, `UnitFacts`, `Candidate`, `AddressHit` (`gates/types.ts`), `AllowList` (`net/allowList.ts`), `ManifestEntry` (`io/pageCache.ts`), `readUnitPage` (Task 6), `findAddress` (`registers/kartverket.ts`), `REGISTER_SOURCES`, `normaliseUrl`, `Get`.
- Produces (`verify/context.ts`):
  - `type Lookups = Omit<GateContext, "unit" | "peers">`
  - `buildLookups(input: { manifest: readonly ManifestEntry[]; readHtml: (entry: ManifestEntry) => string | undefined; allowList: AllowList; validKommuner: ReadonlySet<string>; addresses: ReadonlyMap<string, AddressHit | undefined> }): Lookups`
  - `contextFor(lookups: Lookups, unit: UnitFacts, peers: readonly Candidate[]): GateContext`
  - `resolveAddresses(get: Get, addresses: Iterable<string>, kommune: string): Promise<Map<string, AddressHit | undefined>>`
  - `kartverketForm(value: string, hit: AddressHit): string` (Kartverket's street text, then the page's postcode and place)

- [ ] **Step 1: Write the failing test**

Create `pipeline/test/context.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import type { ManifestEntry } from "../src/io/pageCache.ts"
import { AllowList } from "../src/net/allowList.ts"
import { buildLookups, contextFor, kartverketForm, resolveAddresses } from "../src/verify/context.ts"
import { fakeGet } from "./netHelpers.ts"
import { addressQuery } from "../src/registers/kartverket.ts"

const A = "https://www.eksempel.kommune.no/helsestasjon/"
const FINAL = "https://eksempel.kommune.no/helsestasjon/"
const entry: ManifestEntry = {
	url: A,
	finalUrl: FINAL,
	status: 200,
	contentType: "text/html",
	fetchedAt: "2026-11-06T09:00:00Z",
	contentHash: `sha256:${"0".repeat(64)}`,
	file: `${"a".repeat(32)}.html`,
	adapter: "fallback",
}
const html = "<html><body><main><h1>Eksempel helsestasjon</h1><p>Telefon: 62 00 00 00</p></main></body></html>"
const allowList = AllowList.restore([{ host: "www.eksempel.kommune.no", kind: "kommune", licence: "ownPage" }])
const lookups = buildLookups({
	manifest: [entry],
	readHtml: () => html,
	allowList,
	validKommuner: new Set(["3405"]),
	addresses: new Map([["Storgata 1, 2609 Lillehammer", { addressId: "a1", kommune: "3405", text: "Storgata 1" }]]),
})

describe("buildLookups", () => {
	it("allows the hosts and licences discover recorded, and the registers", () => {
		expect(lookups.allowedHosts.has("eksempel.kommune.no")).toBe(true)
		expect(lookups.allowedHosts.has("data.brreg.no")).toBe(true)
		expect(lookups.licence("eksempel.kommune.no")).toBe("ownPage")
	})

	it("lets robots pass only for a URL the crawler fetched, or a register's own host", () => {
		expect(lookups.robotsAllows(A)).toBe(true)
		expect(lookups.robotsAllows(FINAL)).toBe(true)
		expect(lookups.robotsAllows("https://www.eksempel.kommune.no/annet/")).toBe(false)
		expect(lookups.robotsAllows("https://data.brreg.no/enhetsregisteret/api/enheter/999999981")).toBe(true)
	})

	it("gives the page text the rules read, for the URL and the final URL", () => {
		expect(lookups.pageText(FINAL)).toContain("Telefon: 62 00 00 00")
		expect(lookups.pageText(A)).toBe(lookups.pageText(FINAL))
		expect(lookups.pageText("https://www.eksempel.kommune.no/annet/")).toBeUndefined()
	})

	it("gives the manifest's status for a URL, compared normalised", () => {
		expect(lookups.urlStatus("https://eksempel.kommune.no/helsestasjon")).toBe(200)
		expect(lookups.urlStatus("https://www.eksempel.kommune.no/annet/")).toBeUndefined()
	})

	it("answers addresses from the map filled before the gates run", () => {
		expect(lookups.findAddress("Storgata 1, 2609 Lillehammer")).toMatchObject({ addressId: "a1" })
		expect(lookups.findAddress("Storgata 2, 2609 Lillehammer")).toBeUndefined()
	})
})

describe("contextFor", () => {
	it("adds the unit's facts and peers", () => {
		const unit = { categories: [], isKrisesenter: false, ownHosts: new Set(["eksempel.kommune.no"]) }
		const ctx = contextFor(lookups, unit, [])
		expect(ctx.unit).toBe(unit)
		expect(ctx.peers).toEqual([])
	})
})

describe("resolveAddresses and kartverketForm", () => {
	it("asks Kartverket once per distinct address", async () => {
		const asked: string[] = []
		const body = JSON.stringify({
			adresser: [{ adresseid: "a1", adressetekst: "Storgata 1A", kommunenummer: "3405", postnummer: "2609" }],
		})
		const get = fakeGet({ [addressQuery("storgata 1 a", "3405")]: { body } })
		const counting: typeof get = async (url, kind) => {
			asked.push(url)
			return get(url, kind)
		}
		const map = await resolveAddresses(counting, ["Storgata 1 A, 2609 Lillehammer", "Storgata 1 A, 2609 Lillehammer"], "3405")
		expect(asked).toHaveLength(1)
		const hit = map.get("Storgata 1 A, 2609 Lillehammer")
		expect(hit).toEqual({ addressId: "a1", kommune: "3405", text: "Storgata 1A" })
		expect(kartverketForm("Storgata 1 A, 2609 Lillehammer", hit ?? { addressId: "", kommune: "" })).toBe(
			"Storgata 1A, 2609 Lillehammer"
		)
	})
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run test/context.test.ts`
Expected: FAIL, `src/verify/context.ts` does not exist.

- [ ] **Step 3: Write `src/verify/context.ts`**

```ts
import { readUnitPage } from "../extract/page.ts"
import type { AddressHit, Candidate, GateContext, UnitFacts } from "../gates/types.ts"
import type { ManifestEntry } from "../io/pageCache.ts"
import type { AllowList } from "../net/allowList.ts"
import type { Get } from "../net/crawler.ts"
import { findAddress } from "../registers/kartverket.ts"
import { REGISTER_SOURCES } from "../sources/registers.ts"
import { normaliseUrl } from "../text/normalise.ts"

export type Lookups = Omit<GateContext, "unit" | "peers">

const REGISTER_HOSTS: ReadonlySet<string> = new Set(Object.values(REGISTER_SOURCES).map((r) => r.host))

const hostOf = (url: string) => {
	try {
		return new URL(url).hostname.toLowerCase()
	} catch {
		return undefined
	}
}

// Every lookup the gates need that does not depend on the unit. Built once per kommune from the
// cache: robots.txt was checked when the crawler fetched each page, so a URL the manifest holds
// passed it; a register's own host is a documented open API. Anything else is refused.
export function buildLookups(input: {
	manifest: readonly ManifestEntry[]
	readHtml: (entry: ManifestEntry) => string | undefined
	allowList: AllowList
	validKommuner: ReadonlySet<string>
	addresses: ReadonlyMap<string, AddressHit | undefined>
}): Lookups {
	const byUrl = new Map<string, ManifestEntry>()
	const byNormalised = new Map<string, ManifestEntry>()
	for (const e of input.manifest) {
		byUrl.set(e.url, e)
		byUrl.set(e.finalUrl, e)
		byNormalised.set(normaliseUrl(e.url), e)
		byNormalised.set(normaliseUrl(e.finalUrl), e)
	}
	const texts = new Map<string, string | undefined>()
	const pageText = (url: string): string | undefined => {
		const e = byUrl.get(url)
		if (e === undefined) return undefined
		if (!texts.has(e.url)) {
			const html = input.readHtml(e)
			let text: string | undefined
			try {
				text = html === undefined ? undefined : readUnitPage(html, e.finalUrl).text
			} catch {
				text = undefined
			}
			texts.set(e.url, text)
		}
		return texts.get(e.url)
	}
	return {
		allowedHosts: new Set(input.allowList.entries().map((h) => h.host)),
		robotsAllows: (url) => byUrl.has(url) || REGISTER_HOSTS.has(hostOf(url) ?? ""),
		licence: (host) => input.allowList.licence(host),
		pageText,
		urlStatus: (url) => byNormalised.get(normaliseUrl(url))?.status,
		findAddress: (address) => input.addresses.get(address),
		validKommuner: input.validKommuner,
	}
}

export function contextFor(lookups: Lookups, unit: UnitFacts, peers: readonly Candidate[]): GateContext {
	return { ...lookups, unit, peers }
}

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

// The value verify stores: Kartverket's own street text, then the page's postcode and place.
export function kartverketForm(value: string, hit: AddressHit): string {
	if (hit.text === undefined) return value
	const comma = value.indexOf(",")
	return comma < 0 ? hit.text : `${hit.text}${value.slice(comma)}`
}
```

`AllowList.restore` already adds `FIXED_HOSTS` (the registers and catalogues), so `allowedHosts` holds `data.brreg.no` without the hosts file listing it. The test's host `eksempel.kommune.no` is there as the `www` twin.

- [ ] **Step 4: Run it to see it pass**

Run: `npx vitest run test/context.test.ts`
Expected: PASS. The fake Kartverket answer is keyed by `addressQuery("storgata 1 a", "3405")`, the street as `splitAddress` normalises it; if the test misses, print the URL the reader asked for (it holds only the fictional street) and key the route by it.

- [ ] **Step 5: Show it red once**

Change `robotsAllows: (url) => byUrl.has(url) || ...` to `robotsAllows: () => true`. Run the file: FAIL on "lets robots pass only for a URL the crawler fetched". Restore, run: PASS. Note it for the PR body.

- [ ] **Step 6: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add src/verify/context.ts test/context.test.ts
git commit -m "feat(pipeline): assemble the real GateContext from the cache, the registers and Kartverket"
```

---

### Task 16: The verify stage and its command

Verify matches pages to units, picks one value per field by the phone order and the origin, applies my answers, runs the five gates, and writes the lock and curated files of one kommune at a time, atomically.

**Files:**
- Create: `pipeline/src/verify/candidates.ts`, `pipeline/src/verify/verify.ts`, `pipeline/src/curate/write.ts`, `pipeline/src/cli/verify.ts`
- Modify: `pipeline/package.json` (script `verify`)
- Test: `pipeline/test/candidates.test.ts`, `pipeline/test/verify.test.ts`, `pipeline/test/curatedWrite.test.ts`

**Interfaces:**
- Consumes: `matchUnits`, `UnitGroup` (Task 14), `buildLookups`, `contextFor`, `resolveAddresses`, `kartverketForm` (Task 15), `runGates` (Task 2), `lavterskel` (`gates/lavterskel.ts`), `norwegianDate` (Task 2), `findDecision`, `CuratedFile`, `CuratedUnit`, `ReviewDecision` (Task 1), `LockFile`, `LockField`, `LockUnit` (Task 1), `possibleNames` (Task 2), `brregRecordUrl` (Task 13), `NKLM_PAGE`, `nklmRecordId`, `NklmRow` (Task 12), `namesMatch`, `slugify`, `extractScope`, `readExtraction` (Task 10).
- Produces:
  - `verify/candidates.ts`: `type Proposal = { candidate: Candidate; block?: number; rank?: 1 | 2 | 3; review?: string }`, `type CandidateInput = { kommune: string; group: UnitGroup; sharers: ReadonlyMap<string, readonly UnitGroup[]>; switchboard?: { phone: string; orgNumber: string }; kommunePages: readonly ExtractedPage[]; nklm?: { date: string; rows: readonly NklmRow[] }; places: readonly string[] }`, `unitCandidates(input: CandidateInput): { chosen: Proposal[]; peers: Candidate[] }`, `SHARED_FIELDS`.
  - `verify/verify.ts`: `type VerifyInput`, `type VerifyCounts`, `verifyKommune(input: VerifyInput): Promise<{ lock: LockFile; curated: CuratedFile; counts: VerifyCounts }>`, `verifyAndWrite(dataDir: string, input: VerifyInput): Promise<VerifyCounts>`, `formatVerifySummary(counts: readonly VerifyCounts[]): string`, `lockPath(dataDir: string, kommune: string): string`, `curatedPathFor(dataDir: string, kommune: string, name: string): string`, `findCuratedPath(dataDir: string, kommune: string): string | undefined`, `readCuratedFile(path: string): CuratedFile`, `class VerifyError`.
  - `curate/write.ts`: `type RenameIo = { rename?: (from: string, to: string) => void; sleep?: (ms: number) => Promise<void>; attempts?: number; waitMs?: number }`, `class CuratedWriteError extends Error { readonly tempPath: string }`, `writeCuratedFile(path: string, file: CuratedFile, io?: RenameIo): Promise<void>`.

- [ ] **Step 1: Write the failing tests for the curated write**

Create `pipeline/test/curatedWrite.test.ts`:

```ts
import { existsSync, mkdtempSync, readFileSync, renameSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { CuratedWriteError, writeCuratedFile } from "../src/curate/write.ts"
import type { CuratedFile } from "../src/schema/curated.ts"
import { curatedUnit } from "./helpers.ts"

const file: CuratedFile = { kommune: "3405", name: "Lillehammer", units: [curatedUnit()] }
const busy = () => Object.assign(new Error("busy"), { code: "EBUSY" })
const noWait = async () => {}

describe("writeCuratedFile", () => {
	it("writes the file whole, through a temporary file", async () => {
		const path = join(mkdtempSync(join(tmpdir(), "varde-curated-")), "curated", "3405-lillehammer.json")
		await writeCuratedFile(path, file)
		expect(JSON.parse(readFileSync(path, "utf8"))).toEqual(file)
	})

	it("retries a rename that fails once, as on Windows when a scanner holds the file", async () => {
		const path = join(mkdtempSync(join(tmpdir(), "varde-curated-")), "3405-lillehammer.json")
		let calls = 0
		const rename = (from: string, to: string) => {
			calls++
			if (calls === 1) throw busy()
			renameSync(from, to)
		}
		await writeCuratedFile(path, file, { rename, sleep: noWait })
		expect(calls).toBe(2)
		expect(existsSync(path)).toBe(true)
	})

	it("stops with a clear message and keeps the temporary file when the rename keeps failing", async () => {
		const path = join(mkdtempSync(join(tmpdir(), "varde-curated-")), "3405-lillehammer.json")
		const err = await writeCuratedFile(path, file, { rename: () => { throw busy() }, sleep: noWait }).catch((e) => e)
		expect(err).toBeInstanceOf(CuratedWriteError)
		expect(existsSync((err as CuratedWriteError).tempPath)).toBe(true)
		expect(existsSync(path)).toBe(false)
		expect(String(err.message)).toContain("kept")
	})

	it("refuses a file that does not match its schema, and writes nothing", async () => {
		const path = join(mkdtempSync(join(tmpdir(), "varde-curated-")), "3405-lillehammer.json")
		const bad = { ...file, units: [curatedUnit({ include: true, categories: [] })] }
		await expect(writeCuratedFile(path, bad)).rejects.toThrow("does not match its schema")
		expect(existsSync(path)).toBe(false)
	})
})
```

- [ ] **Step 2: Write `src/curate/write.ts`**

```ts
import { mkdirSync, renameSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import { CuratedFile } from "../schema/curated.ts"

export type RenameIo = {
	rename?: (from: string, to: string) => void
	sleep?: (ms: number) => Promise<void>
	attempts?: number
	waitMs?: number
}

export class CuratedWriteError extends Error {
	readonly tempPath: string

	constructor(tempPath: string) {
		super(`could not save the curated file; my answers are kept in ${tempPath}`)
		this.name = "CuratedWriteError"
		this.tempPath = tempPath
	}
}

// Another program can hold a file for a moment on Windows (an editor, a virus scanner).
const RETRYABLE = new Set(["EPERM", "EBUSY", "EACCES"])
const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

// Each answer is written at once: checked against the schema, written to a temporary file, then
// renamed over the old one, so a crash mid-write leaves the old file whole. A rename that keeps
// failing stops with the temporary file kept, so no answer is lost.
export async function writeCuratedFile(path: string, file: CuratedFile, io: RenameIo = {}): Promise<void> {
	const parsed = CuratedFile.safeParse(file)
	if (!parsed.success) throw new Error("the curated file does not match its schema: nothing was written")
	const rename = io.rename ?? renameSync
	const sleep = io.sleep ?? pause
	const attempts = io.attempts ?? 5
	mkdirSync(dirname(path), { recursive: true })
	const temp = `${path}.${process.pid}.tmp`
	writeFileSync(temp, `${JSON.stringify(parsed.data, null, "\t")}\n`)
	for (let attempt = 1; ; attempt++) {
		try {
			rename(temp, path)
			return
		} catch (err) {
			const code = (err as { code?: string }).code ?? ""
			if (!RETRYABLE.has(code) || attempt >= attempts) throw new CuratedWriteError(temp)
			await sleep(io.waitMs ?? 200)
		}
	}
}
```

Run: `npx vitest run test/curatedWrite.test.ts`
Expected: PASS.

- [ ] **Step 3: Write the failing tests for candidates and verify**

Create `pipeline/test/verify.test.ts`:

```ts
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import type { DiscoveredUnit, KommuneDiscovery } from "../src/discover/types.ts"
import { extractScope } from "../src/extract/extract.ts"
import { PageCache } from "../src/io/pageCache.ts"
import { AllowList } from "../src/net/allowList.ts"
import type { Fetched, Get } from "../src/net/crawler.ts"
import { addressQuery } from "../src/registers/kartverket.ts"
import type { CuratedFile } from "../src/schema/curated.ts"
import { formatVerifySummary, lockPath, verifyAndWrite, verifyKommune } from "../src/verify/verify.ts"
import { fakeGet } from "./netHelpers.ts"

const K = "https://www.eksempel.kommune.no"
const NOW = "2026-11-06T10:00:00Z"
const D = "\u2013"
const html = (body: string) =>
	`<html><head><meta name="acos-cmscontext" content="x"></head><body><main class="main">${body}</main></body></html>`
const UNIT_PAGE = html(
	[
		"<h1>Eksempel helsestasjon</h1>",
		"<p>Helsestasjonen er gratis, og du trenger ikke henvisning.</p>",
		"<h2>Kontakt</h2>",
		"<p>Telefon: 62 00 00 00</p>",
		'<p>E-post: <a href="mailto:helsestasjon@eksempel.kommune.no">helsestasjon@eksempel.kommune.no</a></p>',
		"<p>Besøksadresse: Storgata 1, 2609 Lillehammer</p>",
		"<h2>Åpningstider</h2>",
		"<p>Mandag 08.00-15.30</p>",
	].join("")
)
const unit = (over: Partial<DiscoveredUnit> = {}): DiscoveredUnit => ({
	orgNumber: "999999991",
	name: "EKSEMPEL HELSESTASJON",
	orgForm: "BEDR",
	naeringskode: "86.942",
	address: "Storgata 1, 2609 LILLEHAMMER",
	kommune: "3405",
	website: `${K}/helsestasjon/`,
	register: "underenheter",
	...over,
})
const kartverket = fakeGet({
	[addressQuery("storgata 1", "3405")]: {
		body: JSON.stringify({
			adresser: [{ adresseid: "a1", adressetekst: "Storgata 1", kommunenummer: "3405", postnummer: "2609" }],
		}),
	},
})
const fetched = (url: string, body: string): Fetched => ({
	ok: true,
	url,
	finalUrl: url,
	status: 200,
	contentType: "text/html",
	headers: {},
	body,
	fetchedAt: "2026-11-06T09:00:00Z",
})

function setup(o: {
	pages: Record<string, string>
	units?: DiscoveredUnit[]
	curated?: CuratedFile
	switchboard?: { phone: string; orgNumber: string }
	get?: Get
}) {
	const dir = mkdtempSync(join(tmpdir(), "varde-verify-"))
	const cache = new PageCache(join(dir, "pages"))
	for (const [url, body] of Object.entries(o.pages)) cache.put(fetched(url, body), { adapter: "acos" })
	const places = ["Lillehammer"]
	const kommune: KommuneDiscovery = {
		kommune: "3405",
		name: "Lillehammer",
		discoveredAt: NOW,
		site: { host: "www.eksempel.kommune.no", sitemap: "probe", sitemapUrls: 1, servicePages: 1, kept: 1, truncated: false },
		brregComplete: true,
		allSitemapUrls: [],
		units: o.units ?? [],
		pages: Object.keys(o.pages).map((url) => ({ url, from: "sitemap" as const })),
		...(o.switchboard === undefined ? {} : { switchboard: o.switchboard }),
	}
	const { file } = extractScope("3405", Object.keys(o.pages), cache, { places, kommuneHost: "www.eksempel.kommune.no" }, NOW)
	const input = {
		kommune,
		extraction: file,
		manifest: cache.entries(),
		readHtml: (e: Parameters<typeof cache.read>[0]) => cache.read(e),
		allowList: AllowList.restore([{ host: "www.eksempel.kommune.no", kind: "kommune", licence: "ownPage" }]),
		validKommuner: new Set(["3405"]),
		places,
		get: o.get ?? kartverket,
		...(o.curated === undefined ? {} : { curated: o.curated }),
		now: NOW,
	}
	return { dir, input }
}

describe("verifyKommune", () => {
	it("includes a clear unit by itself and accepts every value that passes the five gates", async () => {
		const { input } = setup({ pages: { [`${K}/helsestasjon/`]: UNIT_PAGE }, units: [unit()] })
		const { lock, curated, counts } = await verifyKommune(input)
		const [u] = lock.units
		expect(u?.unitId).toBe("org:999999991")
		expect(u?.inclusion?.status).toBe("auto")
		const status = Object.fromEntries(Object.entries(u?.fields ?? {}).map(([k, f]) => [k, [f?.status, f?.value]]))
		expect(status).toMatchObject({
			name: ["accepted", "Eksempel helsestasjon"],
			website: ["accepted", `${K}/helsestasjon/`],
			phone: ["accepted", "62 00 00 00"],
			email: ["accepted", "helsestasjon@eksempel.kommune.no"],
			address: ["accepted", "Storgata 1, 2609 Lillehammer"],
			openingHours: ["accepted", `Mandag kl. 08:00${D}15:30`],
		})
		expect(u?.fields.address?.addressId).toBe("a1")
		expect(curated.units).toMatchObject([
			{ unitId: "org:999999991", include: true, categories: ["familie-og-barn"], providerType: "offentlig" },
		])
		expect(counts).toMatchObject({ units: 1, auto: 1, inclusionReview: 0 })
	})

	it("keeps a role mobile with its role, and no name anywhere in the lock", async () => {
		const page = html("<h1>Eksempel helsestasjon</h1><h2>Kontakt</h2><p>Avdelingsleder Kari Nordmann 900 00 000</p>")
		const { input } = setup({ pages: { [`${K}/helsestasjon/`]: page }, units: [unit({ address: undefined })] })
		const { lock } = await verifyKommune(input)
		expect(lock.units[0]?.fields.phone).toMatchObject({ status: "accepted", value: "900 00 000", role: "Avdelingsleder" })
		expect(JSON.stringify(lock)).not.toMatch(/Kari|Nordmann/)
	})

	it("sends two different service numbers on one rank to review", async () => {
		const page = html("<h1>Eksempel helsestasjon</h1><h2>Kontakt</h2><p>Telefon: 62 00 00 00</p><p>Telefon: 62 00 00 02</p>")
		const { input } = setup({ pages: { [`${K}/helsestasjon/`]: page }, units: [unit({ address: undefined })] })
		const { lock } = await verifyKommune(input)
		expect(lock.units[0]?.fields.phone).toMatchObject({ status: "review", reason: expect.stringContaining("agreement") })
	})

	it("uses the kommune's Brreg switchboard, labelled, only when ranks 1 and 2 are empty", async () => {
		const page = html("<h1>Eksempel helsestasjon</h1><p>Vi har drop-in.</p>")
		const { input } = setup({
			pages: { [`${K}/helsestasjon/`]: page },
			units: [unit({ address: undefined })],
			switchboard: { phone: "62 00 00 05", orgNumber: "999999981" },
		})
		const { lock } = await verifyKommune(input)
		expect(lock.units[0]?.fields.phone).toMatchObject({
			status: "accepted",
			value: "62 00 00 05",
			role: "Sentralbord",
			evidence: { kind: "register", register: "brreg", recordId: "999999981" },
			sourceUrl: "https://data.brreg.no/enhetsregisteret/api/enheter/999999981",
		})
	})

	it("never includes a page two register units match, and sends its contact values to review", async () => {
		const page = html("<h1>Eksempel helsestasjon</h1><h2>Kontakt</h2><p>Telefon: 62 00 00 00</p>")
		const units = [unit({ address: undefined }), unit({ orgNumber: "999999992", name: "EKSEMPEL HELSESTASJON NORD", address: undefined })]
		const { input } = setup({ pages: { [`${K}/helsestasjon/`]: page }, units })
		const { lock, curated } = await verifyKommune(input)
		expect(lock.units.map((u) => [u.inclusion?.status, u.fields.phone?.status])).toEqual([
			["review", "review"],
			["review", "review"],
		])
		expect(lock.units[0]?.fields.phone?.reason).toContain("the page is shared by 2 units")
		expect(curated.units).toEqual([])
	})

	it("on a page listing three services, accepts for each unit only the block whose heading names it", async () => {
		const hub = `${K}/helsestasjoner/`
		const page = readFileSync(new URL("./fixtures/pages/shared-page.html", import.meta.url), "utf8")
		const units = ["SENTRUM", "NORD", "SØR"].map((part, i) =>
			unit({ orgNumber: `99999999${i + 1}`, name: `EKSEMPEL HELSESTASJON ${part}`, website: hub, address: undefined })
		)
		const { input } = setup({ pages: { [hub]: page }, units })
		const { lock } = await verifyKommune(input)
		expect(lock.units.map((u) => [u.unitId, u.fields.phone?.status, u.fields.phone?.value])).toEqual([
			["org:999999991", "accepted", "62 00 00 01"],
			["org:999999992", "accepted", "62 00 00 02"],
			["org:999999993", "accepted", "62 00 00 03"],
		])
		expect(lock.units.every((u) => u.inclusion?.status === "review")).toBe(true)
		expect(lock.units[0]?.fields.name?.status).toBe("review")
	})

	it("applies my answers: accept and edit become my decision, reject drops the value", async () => {
		const page = html("<h1>Eksempel helsestasjon</h1><h2>Kontakt</h2><p>Telefon: 62 00 00 00</p><p>E-post: post@eksempel.kommune.no</p>")
		const units = [unit({ address: undefined }), unit({ orgNumber: "999999992", name: "EKSEMPEL HELSESTASJON NORD", address: undefined })]
		const sourceUrl = `${K}/helsestasjon/`
		const curated: CuratedFile = {
			kommune: "3405",
			name: "Lillehammer",
			units: [
				{
					unitId: "org:999999991",
					name: "Eksempel helsestasjon",
					include: true,
					sources: { orgNumber: "999999991", pages: [sourceUrl] },
					categories: ["familie-og-barn"],
					providerType: "offentlig",
					decisions: [
						{ field: "phone", value: "62 00 00 00", sourceUrl, decision: "edit", editedValue: "62 00 00 09", decidedOn: "2026-11-06" },
						{ field: "email", value: "post@eksempel.kommune.no", sourceUrl, decision: "reject", decidedOn: "2026-11-06" },
					],
				},
				{
					unitId: "org:999999992",
					name: "Eksempel helsestasjon nord",
					include: true,
					sources: { orgNumber: "999999992", pages: [sourceUrl] },
					categories: ["familie-og-barn"],
					providerType: "offentlig",
					decisions: [{ field: "phone", value: "62 00 00 00", sourceUrl, decision: "accept", decidedOn: "2026-11-06" }],
				},
			],
		}
		const { input } = setup({ pages: { [sourceUrl]: page }, units, curated })
		const { lock } = await verifyKommune(input)
		const [first, second] = lock.units
		expect(first?.fields.phone).toMatchObject({
			status: "accepted",
			value: "62 00 00 09",
			evidence: { kind: "decision", decidedOn: "2026-11-06" },
		})
		expect(first?.fields.email).toMatchObject({ status: "dropped", reason: "my decision of 06.11.2026: rejected" })
		expect(second?.fields.phone).toMatchObject({ status: "accepted", value: "62 00 00 00" })
	})

	it("still runs the validity gate on my edit", async () => {
		const page = html("<h1>Eksempel helsestasjon</h1><h2>Kontakt</h2><p>Telefon: 62 00 00 00</p>")
		const sourceUrl = `${K}/helsestasjon/`
		const curated: CuratedFile = {
			kommune: "3405",
			name: "Lillehammer",
			units: [
				{
					unitId: "org:999999991",
					name: "Eksempel helsestasjon",
					include: true,
					sources: { orgNumber: "999999991", pages: [sourceUrl] },
					categories: ["familie-og-barn"],
					providerType: "offentlig",
					decisions: [{ field: "phone", value: "62 00 00 00", sourceUrl, decision: "edit", editedValue: "12345", decidedOn: "2026-11-06" }],
				},
			],
		}
		const { input } = setup({ pages: { [sourceUrl]: page }, units: [unit({ address: undefined })], curated })
		const { lock } = await verifyKommune(input)
		expect(lock.units[0]?.fields.phone).toMatchObject({ status: "dropped", reason: expect.stringContaining("validity") })
	})

	it("prints counts only", async () => {
		const { input } = setup({ pages: { [`${K}/helsestasjon/`]: UNIT_PAGE }, units: [unit()] })
		const { counts } = await verifyKommune(input)
		const text = formatVerifySummary([counts])
		expect(text).toContain("3405 Lillehammer:")
		for (const secret of ["62 00 00 00", "helsestasjon@", "eksempel.kommune.no", "Storgata", "999999991"]) {
			expect(text).not.toContain(secret)
		}
	})
})

describe("verifyAndWrite", () => {
	it("writes the lock and curated files of a kommune that completes", async () => {
		const { dir, input } = setup({ pages: { [`${K}/helsestasjon/`]: UNIT_PAGE }, units: [unit()] })
		await verifyAndWrite(join(dir, "data"), input)
		expect(JSON.parse(readFileSync(lockPath(join(dir, "data"), "3405"), "utf8")).kommune).toBe("3405")
		expect(JSON.parse(readFileSync(join(dir, "data", "curated", "3405-lillehammer.json"), "utf8")).units).toHaveLength(1)
	})

	it("leaves the previous lock file byte for byte the same when the run stops halfway", async () => {
		const failing: Get = async () => {
			throw new Error("stopped halfway")
		}
		const { dir, input } = setup({ pages: { [`${K}/helsestasjon/`]: UNIT_PAGE }, units: [unit()], get: failing })
		const data = join(dir, "data")
		mkdirSync(join(data, "lock"), { recursive: true })
		writeFileSync(lockPath(data, "3405"), '{"kommune":"3405","units":[]}\n')
		await expect(verifyAndWrite(data, input)).rejects.toThrow()
		expect(readFileSync(lockPath(data, "3405"), "utf8")).toBe('{"kommune":"3405","units":[]}\n')
	})
})
```

Create `pipeline/test/candidates.test.ts` with the two rules the stage relies on most, the phone rank pick and the shared page:

```ts
import { describe, expect, it } from "vitest"
import type { UnitGroup } from "../src/curate/include.ts"
import type { ExtractedCandidate, ExtractedPage } from "../src/schema/extraction.ts"
import { unitCandidates } from "../src/verify/candidates.ts"

const URL_A = "https://www.eksempel.kommune.no/helsestasjon/"
const phone = (value: string, rank: 1 | 2 | 3, block = 0, role?: string): ExtractedCandidate => ({
	field: "phone",
	value,
	evidence: { kind: "quote", quotes: [value] },
	origin: "unitContact",
	rank,
	block,
	...(role === undefined ? {} : { role }),
})
const page = (candidates: ExtractedCandidate[], blocks: ExtractedPage["blocks"] = [{ source: "heading", lines: [] }]): ExtractedPage => ({
	url: URL_A,
	finalUrl: URL_A,
	fetchedAt: "2026-11-06T09:00:00Z",
	adapter: "acos",
	fallback: false,
	blocks,
	candidates,
	lavterskelQuotes: [],
})
const group = (p: ExtractedPage, over: Partial<UnitGroup> = {}): UnitGroup => ({
	unitId: "org:999999991",
	pages: [p],
	name: "Eksempel helsestasjon",
	matchName: "EKSEMPEL HELSESTASJON",
	categories: ["familie-og-barn"],
	isKrisesenter: false,
	inclusion: { status: "auto", reason: "x", suggestedCategories: [] },
	...over,
})
const base = { kommune: "3405", sharers: new Map(), kommunePages: [], places: ["Lillehammer"] }

describe("unitCandidates: the phone order", () => {
	it("picks rank 1 over rank 2, and compares only rank 1 numbers as peers", () => {
		const p = page([phone("62 00 00 00", 1), phone("900 00 000", 2, 0, "Avdelingsleder")])
		const { chosen, peers } = unitCandidates({ ...base, group: group(p) })
		expect(chosen.find((c) => c.candidate.field === "phone")?.candidate.value).toBe("62 00 00 00")
		expect(peers.filter((c) => c.field === "phone").map((c) => c.value)).toEqual(["62 00 00 00"])
	})

	it("takes the Brreg switchboard before a page's rank 3", () => {
		const p = page([phone("62 00 00 07", 3, 0, "Sentralbord")])
		const { chosen } = unitCandidates({ ...base, group: group(p), switchboard: { phone: "62 00 00 05", orgNumber: "999999981" } })
		expect(chosen.find((c) => c.candidate.field === "phone")?.candidate).toMatchObject({ value: "62 00 00 05", role: "Sentralbord" })
	})
})

describe("unitCandidates: a shared page", () => {
	it("keeps the block naming the unit, skips a block naming another, and reviews the rest", () => {
		const blocks: ExtractedPage["blocks"] = [
			{ source: "heading", heading: "Eksempel helsestasjon", lines: [] },
			{ source: "heading", heading: "Eksempel familievern", lines: [] },
			{ source: "heading", lines: [] },
		]
		const p = page([phone("62 00 00 01", 1, 0), phone("62 00 00 02", 1, 1), phone("62 00 00 03", 1, 2)], blocks)
		const me = group(p)
		const other = group(p, { unitId: "org:999999992", matchName: "EKSEMPEL FAMILIEVERN" })
		const sharers = new Map([[URL_A, [me, other]]])
		const { chosen, peers } = unitCandidates({ ...base, group: me, sharers })
		const pick = chosen.find((c) => c.candidate.field === "phone")
		expect(pick?.candidate.value).toBe("62 00 00 01")
		expect(pick?.review).toBeUndefined()
		expect(peers.filter((c) => c.field === "phone").map((c) => c.value)).toEqual(["62 00 00 01", "62 00 00 03"])
	})
})
```

- [ ] **Step 4: Run them to see them fail**

Run: `npx vitest run test/verify.test.ts test/candidates.test.ts`
Expected: FAIL, the modules do not exist.

- [ ] **Step 5: Write `src/verify/candidates.ts`**

```ts
import type { UnitGroup } from "../curate/include.ts"
import { lavterskel } from "../gates/lavterskel.ts"
import type { Candidate } from "../gates/types.ts"
import { namesMatch } from "../recall/match.ts"
import { brregRecordUrl } from "../registers/brreg.ts"
import { NKLM_PAGE, type NklmRow, nklmRecordId } from "../registers/nklm.ts"
import { FIELD_NAMES, type FieldName } from "../schema/common.ts"
import type { ExtractedCandidate, ExtractedPage } from "../schema/extraction.ts"
import { possibleNames } from "../text/names.ts"

export type Proposal = { candidate: Candidate; block?: number; rank?: 1 | 2 | 3; review?: string }

export type CandidateInput = {
	kommune: string
	group: UnitGroup
	// The units each page is a source for, by final URL.
	sharers: ReadonlyMap<string, readonly UnitGroup[]>
	switchboard?: { phone: string; orgNumber: string }
	// Pages on the kommune's own site: a "Sentralbord" line there is rank 3 for every unit.
	kommunePages: readonly ExtractedPage[]
	nklm?: { date: string; rows: readonly NklmRow[] }
	places: readonly string[]
}

// The values a page shared by several units can put on the wrong one (decided 06.11.2026). name
// joins them, since a shared page's h1 names the page; phoneHours and alwaysOpen go with the phone.
export const SHARED_FIELDS: ReadonlySet<FieldName> = new Set(["phone", "phoneHours", "alwaysOpen", "email", "address", "name"])

const ORIGIN_ORDER: Readonly<Record<string, number>> = { unitContact: 0, unitPage: 1, register: 2 }

function toCandidate(input: CandidateInput, page: ExtractedPage, c: ExtractedCandidate): Candidate {
	const quotes = c.evidence.kind === "quote" ? c.evidence.quotes : []
	const ctx = { unitName: `${input.group.name} ${input.group.matchName}`, places: input.places }
	// The h1 is the name Varde stores, so its quote is no person's name to redact.
	const personNames = c.field === "name" || c.field === "website" ? [] : [...new Set(quotes.flatMap((q) => possibleNames(q, ctx)))]
	return {
		kommune: input.kommune,
		unitId: input.group.unitId,
		field: c.field,
		value: c.value,
		sourceUrl: page.finalUrl,
		evidence: c.evidence,
		origin: c.origin,
		...(c.role === undefined ? {} : { role: c.role }),
		personNames,
		fetchedAt: page.fetchedAt,
	}
}

type Verdict = "keep" | "skip" | "review"

// On a page several units share, a value counts for this unit only when its block's heading names
// this unit and no other one. A heading that names only another unit is that unit's value. Any
// other value goes to review: a heading such as "Eksempel helsestasjon" names every unit on the
// page, because namesMatch lets the shorter name match the longer.
function shared(input: CandidateInput, page: ExtractedPage, c: ExtractedCandidate): Verdict {
	const sharers = input.sharers.get(page.finalUrl) ?? []
	if (sharers.length <= 1 || !SHARED_FIELDS.has(c.field)) return "keep"
	const heading = c.block === undefined ? undefined : page.blocks[c.block]?.heading
	const named = heading === undefined ? [] : sharers.filter((g) => namesMatch(heading, g.matchName))
	if (named.length === 1 && named[0]?.unitId === input.group.unitId) return "keep"
	if (named.length > 0 && !named.some((g) => g.unitId === input.group.unitId)) return "skip"
	return "review"
}

const register = (
	input: CandidateInput,
	field: FieldName,
	value: string,
	reg: "brreg" | "nklm",
	recordId: string,
	sourceUrl: string,
	fetchedAt: string,
	role?: string
): Candidate => ({
	kommune: input.kommune,
	unitId: input.group.unitId,
	field,
	value,
	sourceUrl,
	evidence: { kind: "register", register: reg, recordId },
	origin: "register",
	...(role === undefined ? {} : { role }),
	personNames: [],
	fetchedAt,
})

// One proposal per field for the unit, and every candidate the agreement gate compares it with.
export function unitCandidates(input: CandidateInput): { chosen: Proposal[]; peers: Candidate[] } {
	const proposals: Proposal[] = []
	const g = input.group
	const firstFetch = g.pages[0]?.fetchedAt ?? "1970-01-01T00:00:00Z"
	for (const page of g.pages) {
		for (const c of page.candidates) {
			const verdict = shared(input, page, c)
			if (verdict === "skip") continue
			const sharers = input.sharers.get(page.finalUrl)?.length ?? 1
			const review = verdict === "review" ? `the page is shared by ${sharers} units` : c.review
			proposals.push({
				candidate: toCandidate(input, page, c),
				...(c.block === undefined ? {} : { block: c.block }),
				...(c.rank === undefined ? {} : { rank: c.rank }),
				...(review === undefined ? {} : { review }),
			})
		}
	}
	const peers: Candidate[] = proposals.filter((p) => p.candidate.field !== "phone").map((p) => p.candidate)
	if (g.unit?.address !== undefined) {
		const url = brregRecordUrl(g.unit.register, g.unit.orgNumber)
		peers.push(register(input, "address", g.unit.address, "brreg", g.unit.orgNumber, url, firstFetch))
	}
	const nklmRows = (input.nklm?.rows ?? []).filter((r) => r.kommuner.includes(input.kommune) && namesMatch(r.name, g.name))
	const nklmPeers = nklmRows.flatMap((r) => {
		const id = nklmRecordId(input.nklm?.date ?? "", r.row)
		return [
			...(r.phone === undefined ? [] : [register(input, "phone", r.phone, "nklm", id, NKLM_PAGE, firstFetch)]),
			...(r.address === undefined ? [] : [register(input, "address", r.address, "nklm", id, NKLM_PAGE, firstFetch)]),
		]
	})
	peers.push(...nklmPeers.filter((c) => c.field === "address"))

	const chosen: Proposal[] = []
	// The phone order: rank 1, else rank 2, else the switchboard (Brreg first, then a kommune page).
	const phones = proposals.filter((p) => p.candidate.field === "phone")
	const top = ([1, 2] as const).map((r) => phones.filter((p) => p.rank === r)).find((list) => list.length > 0)
	let phone: Proposal | undefined = top?.[0]
	if (top !== undefined) {
		peers.push(...top.map((p) => p.candidate))
		if (phone?.rank === 1) peers.push(...nklmPeers.filter((c) => c.field === "phone"))
	} else if (input.switchboard !== undefined) {
		const url = brregRecordUrl("enheter", input.switchboard.orgNumber)
		phone = {
			candidate: register(input, "phone", input.switchboard.phone, "brreg", input.switchboard.orgNumber, url, firstFetch, "Sentralbord"),
			rank: 3,
		}
	} else {
		const rank3 =
			phones.find((p) => p.rank === 3) ??
			input.kommunePages
				.flatMap((page) => page.candidates.filter((c) => c.field === "phone" && c.rank === 3).map((c) => ({ page, c })))
				.map(({ page, c }): Proposal => ({ candidate: toCandidate(input, page, c), rank: 3 }))[0]
		phone = rank3
	}
	if (phone !== undefined) chosen.push(phone)
	for (const field of FIELD_NAMES) {
		if (field === "phone" || field === "lowThreshold") continue
		let list = proposals.filter((p) => p.candidate.field === field)
		// Hours and always-open belong to the rank 1 number they were read beside.
		if (field === "phoneHours" || field === "alwaysOpen") {
			list = phone?.rank === 1 ? list.filter((p) => p.candidate.sourceUrl === phone?.candidate.sourceUrl && p.block === phone?.block) : []
		}
		const best = [...list].sort((a, b) => (ORIGIN_ORDER[a.candidate.origin] ?? 3) - (ORIGIN_ORDER[b.candidate.origin] ?? 3))[0]
		if (best !== undefined) chosen.push(best)
		else if (field === "address" && g.unit?.address !== undefined) {
			const url = brregRecordUrl(g.unit.register, g.unit.orgNumber)
			chosen.push({ candidate: register(input, "address", g.unit.address, "brreg", g.unit.orgNumber, url, firstFetch) })
		}
	}
	// The Lavterskel badge: the first page with quotes; the safety gate's rule decides it.
	const lav = g.pages.find((p) => p.lavterskelQuotes.length > 0)
	if (lav !== undefined) {
		const quotes = lav.lavterskelQuotes
		const ctx = { unitName: `${g.name} ${g.matchName}`, places: input.places }
		chosen.push({
			candidate: {
				kommune: input.kommune,
				unitId: g.unitId,
				field: "lowThreshold",
				value: lavterskel(quotes, undefined).outcome === "yes",
				sourceUrl: lav.finalUrl,
				evidence: { kind: "quote", quotes },
				origin: "unitPage",
				personNames: [...new Set(quotes.flatMap((q) => possibleNames(q, ctx)))],
				fetchedAt: lav.fetchedAt,
			},
		})
	}
	return { chosen, peers }
}
```

The Brreg address is a peer for the page address, and the chosen value only when the page has none (the krisesenter rule in the safety gate still drops it for a krisesenter). The test "compares only rank 1 numbers as peers" pins that a rank-2 number never makes a rank-1 number "disagree".

- [ ] **Step 6: Write `src/verify/verify.ts`**

```ts
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { writeCuratedFile } from "../curate/write.ts"
import { matchUnits, type UnitGroup } from "../curate/include.ts"
import type { KommuneDiscovery } from "../discover/types.ts"
import { norwegianDate } from "../gates/grounding.ts"
import { runGates } from "../gates/run.ts"
import type { GateContext, UnitFacts } from "../gates/types.ts"
import { writeJsonAtomic } from "../io/files.ts"
import type { ManifestEntry } from "../io/pageCache.ts"
import type { AllowList } from "../net/allowList.ts"
import type { Get } from "../net/crawler.ts"
import { namesMatch } from "../recall/match.ts"
import type { NklmRow } from "../registers/nklm.ts"
import type { FieldName } from "../schema/common.ts"
import { CuratedFile, type CuratedUnit, findDecision, type ReviewDecision } from "../schema/curated.ts"
import type { ExtractionFile } from "../schema/extraction.ts"
import { slugify } from "../schema/ids.ts"
import { LockFile, type LockField, type LockUnit } from "../schema/lock.ts"
import { siteHost } from "../text/normalise.ts"
import { type Proposal, unitCandidates } from "./candidates.ts"
import { buildLookups, contextFor, kartverketForm, resolveAddresses } from "./context.ts"

export class VerifyError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "VerifyError"
	}
}

export type VerifyInput = {
	kommune: KommuneDiscovery
	extraction: ExtractionFile
	national?: ExtractionFile
	manifest: readonly ManifestEntry[]
	readHtml: (entry: ManifestEntry) => string | undefined
	allowList: AllowList
	validKommuner: ReadonlySet<string>
	places: readonly string[]
	get: Get
	nklm?: { date: string; rows: readonly NklmRow[] }
	curated?: CuratedFile
	now: string
}

export type VerifyCounts = {
	kommune: string
	name: string
	units: number
	auto: number
	inclusionReview: number
	accepted: number
	review: number
	dropped: number
	noUnitId: number
	unitsWithoutPage: number
	nationalUnmatched: number
	pagesWithProblem: number
}

export const lockPath = (dataDir: string, kommune: string) => join(dataDir, "lock", `${kommune}.json`)
export const curatedPathFor = (dataDir: string, kommune: string, name: string) =>
	join(dataDir, "curated", `${kommune}-${slugify(name)}.json`)

// The kommune's curated file, whatever its name part: "3405-lillehammer.json".
export function findCuratedPath(dataDir: string, kommune: string): string | undefined {
	const dir = join(dataDir, "curated")
	if (!existsSync(dir)) return undefined
	const name = readdirSync(dir).find((f) => f.startsWith(`${kommune}-`) && f.endsWith(".json"))
	return name === undefined ? undefined : join(dir, name)
}

// Messages name the kommune only: a parse error would quote the file.
export function readCuratedFile(path: string): CuratedFile {
	let data: unknown
	try {
		data = JSON.parse(readFileSync(path, "utf8"))
	} catch {
		throw new VerifyError("a curated file is not valid JSON")
	}
	const parsed = CuratedFile.safeParse(data)
	if (!parsed.success) throw new VerifyError("a curated file does not match its schema")
	return parsed.data
}

function toReview(field: LockField, reason: string): LockField {
	if (field.status === "dropped") return field
	if (field.status === "review") return { ...field, reason: `${field.reason ?? "review"}; ${reason}` }
	return { ...field, status: "review", reason }
}

// One field: Kartverket's form for an address, my answer if I gave one, then the five gates. A
// rule's or the shared page's review reason applies only where I have not answered.
function settle(p: Proposal, ctx: GateContext, decisions: readonly ReviewDecision[], now: string): LockField {
	let c = p.candidate
	if (c.field === "address" && typeof c.value === "string") {
		const hit = ctx.findAddress(c.value)
		if (hit !== undefined) c = { ...c, value: kartverketForm(c.value, hit) }
	}
	const d = findDecision(decisions, { field: c.field, value: c.value, sourceUrl: c.sourceUrl })
	if (d?.decision === "reject") {
		const { gates } = runGates(c, ctx, now)
		return {
			status: "dropped",
			sourceUrl: c.sourceUrl,
			fetchedAt: c.fetchedAt,
			verifiedAt: now,
			gates,
			reason: `my decision of ${norwegianDate(d.decidedOn)}: rejected`,
		}
	}
	if (d !== undefined) {
		const original = c.evidence.kind === "decision" ? c.evidence.original : c.evidence
		c = {
			...c,
			evidence: { kind: "decision", decidedOn: d.decidedOn, original },
			...(d.decision === "edit" ? { value: d.editedValue ?? c.value } : {}),
			...(d.role === undefined ? {} : { role: d.role }),
		}
		return runGates(c, ctx, now)
	}
	const field = runGates(c, ctx, now)
	return p.review === undefined ? field : toReview(field, p.review)
}

function sourcesOf(g: UnitGroup): LockUnit["sources"] {
	const nav = g.pages.find((p) => p.navOfficeId !== undefined)?.navOfficeId
	return [
		...(g.unit === undefined ? [] : [{ kind: "brreg" as const, ref: g.unit.orgNumber }]),
		...(nav === undefined ? [] : [{ kind: "nav" as const, ref: nav }]),
		...g.pages.map((p) => ({ kind: "page" as const, ref: p.finalUrl })),
	]
}

function curatedFor(g: UnitGroup): CuratedUnit | undefined {
	if (g.inclusion.status !== "auto" || g.providerType === undefined) return undefined
	const nav = g.pages.find((p) => p.navOfficeId !== undefined)?.navOfficeId
	return {
		unitId: g.unitId,
		name: g.name,
		include: true,
		sources: {
			...(g.unit === undefined ? {} : { orgNumber: g.unit.orgNumber }),
			...(nav === undefined ? {} : { navOfficeId: nav }),
			pages: g.pages.map((p) => p.finalUrl),
		},
		categories: g.categories,
		providerType: g.providerType,
		decisions: [],
	}
}

// Verify one kommune: everything in memory, nothing written. A throw anywhere (a lookup, a schema)
// leaves the files as they were.
export async function verifyKommune(input: VerifyInput): Promise<{ lock: LockFile; curated: CuratedFile; counts: VerifyCounts }> {
	const k = input.kommune
	const pages = [...input.extraction.pages, ...(input.national?.pages ?? [])]
	const national = new Set((input.national?.pages ?? []).map((p) => p.url))
	const nklmHere = (input.nklm?.rows ?? []).filter((r) => r.kommuner.includes(k.kommune))
	const wanted = new Set<string>()
	for (const u of k.units) if (u.address !== undefined) wanted.add(u.address)
	for (const p of pages) for (const c of p.candidates) if (c.field === "address" && typeof c.value === "string") wanted.add(c.value)
	for (const r of nklmHere) if (r.address !== undefined) wanted.add(r.address)
	const resolved = await resolveAddresses(input.get, wanted, k.kommune)
	const addresses = new Map(resolved)
	for (const [a, hit] of resolved) if (hit?.text !== undefined) addresses.set(kartverketForm(a, hit), hit)

	const match = matchUnits({
		units: k.units,
		pages,
		national,
		addressId: (a) => addresses.get(a)?.addressId,
		...(k.site === undefined ? {} : { kommuneHost: k.site.host }),
		nklmLegevakt: (name) => nklmHere.some((r) => namesMatch(r.name, name)),
	})
	const sharers = new Map<string, UnitGroup[]>()
	for (const g of match.groups) for (const p of g.pages) sharers.set(p.finalUrl, [...(sharers.get(p.finalUrl) ?? []), g])
	const lookups = buildLookups({
		manifest: input.manifest,
		readHtml: input.readHtml,
		allowList: input.allowList,
		validKommuner: input.validKommuner,
		addresses,
	})
	const own = k.site === undefined ? undefined : siteHost(`https://${k.site.host}/`)
	const kommunePages = pages.filter((p) => own !== undefined && siteHost(p.finalUrl) === own)
	const curated: CuratedFile = input.curated ?? { kommune: k.kommune, name: k.name, units: [] }
	const mine = new Map(curated.units.map((u) => [u.unitId, u]))
	const counts: VerifyCounts = {
		kommune: k.kommune,
		name: k.name,
		units: 0,
		auto: 0,
		inclusionReview: 0,
		accepted: 0,
		review: 0,
		dropped: 0,
		noUnitId: match.noUnitId,
		unitsWithoutPage: match.unitsWithoutPage,
		nationalUnmatched: match.nationalUnmatched,
		pagesWithProblem: match.pagesWithProblem,
	}
	const units: LockUnit[] = []
	const added: CuratedUnit[] = []
	for (const g of match.groups) {
		const answer = mine.get(g.unitId)
		if (answer?.include === false) continue
		const { chosen, peers } = unitCandidates({
			kommune: k.kommune,
			group: g,
			sharers,
			...(k.switchboard === undefined ? {} : { switchboard: k.switchboard }),
			kommunePages,
			...(input.nklm === undefined ? {} : { nklm: { date: input.nklm.date, rows: nklmHere } }),
			places: input.places,
		})
		const facts: UnitFacts = {
			categories: answer?.categories ?? g.categories,
			isKrisesenter: g.isKrisesenter,
			ownHosts: new Set(g.pages.map((p) => siteHost(p.finalUrl)).filter((h): h is string => h !== undefined)),
			...(g.unit === undefined ? {} : { orgForm: g.unit.orgForm }),
		}
		const ctx = contextFor(lookups, facts, peers)
		const fields: Partial<Record<FieldName, LockField>> = {}
		for (const p of chosen) {
			const field = settle(p, ctx, answer?.decisions ?? [], input.now)
			fields[p.candidate.field] = field
			counts[field.status]++
		}
		units.push({ unitId: g.unitId, sources: sourcesOf(g), fields, inclusion: g.inclusion })
		counts.units++
		if (g.inclusion.status === "auto") counts.auto++
		else if (answer === undefined) counts.inclusionReview++
		const auto = answer === undefined ? curatedFor(g) : undefined
		if (auto !== undefined) added.push(auto)
	}
	// A parse error would quote a value, so only the kommune is named.
	const parsed = LockFile.safeParse({ kommune: k.kommune, units: units.sort((a, b) => (a.unitId < b.unitId ? -1 : 1)) })
	if (!parsed.success) throw new VerifyError(`${k.kommune}: the lock file does not match its schema: nothing was written`)
	const lock = parsed.data
	const all = [...curated.units, ...added].sort((a, b) => (a.unitId < b.unitId ? -1 : 1))
	return { lock, curated: { ...curated, units: all }, counts }
}

// Verify, then write the lock file and the curated file, each whole. Nothing is written for a
// kommune that does not complete.
export async function verifyAndWrite(dataDir: string, input: VerifyInput): Promise<VerifyCounts> {
	const { lock, curated, counts } = await verifyKommune(input)
	writeJsonAtomic(lockPath(dataDir, input.kommune.kommune), lock)
	const path = findCuratedPath(dataDir, input.kommune.kommune) ?? curatedPathFor(dataDir, input.kommune.kommune, input.kommune.name)
	await writeCuratedFile(path, curated)
	return counts
}

// What the command prints. Actions logs are public: counts, kommune numbers and names only.
export function formatVerifySummary(counts: readonly VerifyCounts[]): string {
	return counts
		.map(
			(c) =>
				`${c.kommune} ${c.name}: ${c.units} units (${c.auto} included by rule, ${c.inclusionReview} to ask), ` +
				`fields ${c.accepted} accepted, ${c.review} review, ${c.dropped} dropped; ` +
				`not stored: ${c.noUnitId} pages with no unit id, ${c.unitsWithoutPage} Brreg units with no page, ` +
				`${c.nationalUnmatched} national pages with no unit here, ${c.pagesWithProblem} pages with a problem`
		)
		.join("\n")
}
```

- [ ] **Step 7: Run the tests to see them pass**

Run: `npx vitest run test/verify.test.ts test/candidates.test.ts test/curatedWrite.test.ts`
Expected: PASS. When a status differs from the test, print the field's `reason` (reasons hold no values) to see which gate decided, and fix the stage, not the test. Two places that need care:

- In "accepts every value", the email must pass the source gate as `unitContact` on the unit's own host, and the website must find status 200 in the manifest by its final URL.
- In "three services", each unit's name only matches its own block heading if `namesMatch` reads "SØR" and "sør" alike (it folds both to "sor"). In "never includes a page two register units match", the block's heading is the h1 "Eksempel helsestasjon", which names both units, so both phones go to review: that is the rule working.

- [ ] **Step 8: Write `src/cli/verify.ts` and the script**

```ts
// Runs the five gates on what extract found and writes lock and curated files into --data.
//   node src/cli/verify.ts --data <dir> [--only 3405] [--cache <dir>] [--nklm-file <path>] [--nklm-fetch] [--dry-run]
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"
import { CuratedWriteError } from "../curate/write.ts"
import { DiscoverError } from "../discover/discover.ts"
import { readDiscovery } from "../discover/files.ts"
import { readExtraction } from "../extract/extract.ts"
import { DEFAULT_CACHE_DIR, PageCache } from "../io/pageCache.ts"
import { AllowList } from "../net/allowList.ts"
import { systemClock } from "../net/clock.ts"
import { Crawler } from "../net/crawler.ts"
import { httpsTransport } from "../net/http.ts"
import { fetchNklm, kommuneLookup, loadNklm, readNklm } from "../registers/nklm.ts"
import {
	findCuratedPath,
	formatVerifySummary,
	readCuratedFile,
	type VerifyCounts,
	VerifyError,
	verifyAndWrite,
	verifyKommune,
} from "../verify/verify.ts"

const USAGE =
	"usage: verify --data <dir> [--only 3405,0301] [--cache <dir>] [--nklm-file <path>] [--nklm-fetch] [--dry-run]"

const { values } = parseArgs({
	options: {
		data: { type: "string" },
		only: { type: "string" },
		cache: { type: "string" },
		"nklm-file": { type: "string" },
		"nklm-fetch": { type: "boolean", default: false },
		"dry-run": { type: "boolean", default: false },
	},
})
const only = (values.only ?? "")
	.split(",")
	.map((p) => p.trim())
	.filter((p) => p !== "")
if (values.data === undefined || only.some((p) => !/^\d{2}(?:\d{2})?$/.test(p))) {
	console.error(USAGE)
	process.exit(2)
}
const dataDir = resolve(values.data)
// PR 3 never writes to the repo's own data/: PR 4 lifts this when it commits the pilot.
const repoData = resolve(fileURLToPath(new URL("../../../data/", import.meta.url)))
if (dataDir === repoData) {
	console.error("verify does not write to the repo's data/ yet: point --data at another folder")
	process.exit(2)
}

const root = values.cache ?? DEFAULT_CACHE_DIR
const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
try {
	const found = readDiscovery(join(root, "discover"))
	const allowList = AllowList.restore(found.hosts)
	const crawler = new Crawler({ transport: httpsTransport, clock: systemClock, allowList })
	const cache = new PageCache(join(root, "pages"), { dryRun: true })
	const nklmDir = join(root, "nklm")
	if (values["nklm-fetch"]) {
		const fetched = await fetchNklm(crawler.get, nklmDir, now)
		console.log(fetched.ok ? `NKLM file fetched (${fetched.changed ? "changed" : "unchanged"})` : `NKLM: ${fetched.reason}`)
	}
	const bytes = loadNklm(nklmDir, values["nklm-file"])
	const read =
		bytes === undefined
			? undefined
			: readNklm(bytes, kommuneLookup(found.kommuner.map((k) => ({ code: k.kommune, name: k.name }))))
	console.log(
		read === undefined
			? "NKLM: not used (no file)"
			: read.ok
				? `NKLM: ${read.rows.length} rows from the ${read.date} edition, ${read.unknownKommuner} kommune names not placed`
				: `NKLM: not used (${read.reason})`
	)
	const nklm = read?.ok === true ? { date: read.date, rows: read.rows } : undefined
	const national = readExtraction(root, "national")
	const kommuner = found.kommuner.filter((k) => only.length === 0 || only.some((p) => k.kommune.startsWith(p)))
	const counts: VerifyCounts[] = []
	const missing: string[] = []
	for (const k of kommuner) {
		const extraction = readExtraction(root, k.kommune)
		if (extraction === undefined) {
			missing.push(k.kommune)
			continue
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
			get: crawler.get,
			...(nklm === undefined ? {} : { nklm }),
			...(curatedAt === undefined ? {} : { curated: readCuratedFile(curatedAt) }),
			now,
		}
		counts.push(values["dry-run"] ? (await verifyKommune(input)).counts : await verifyAndWrite(dataDir, input))
	}
	console.log(formatVerifySummary(counts))
	if (missing.length > 0) console.log(`No extraction file (run extract first): ${missing.join(", ")}`)
} catch (err) {
	const known = err instanceof DiscoverError || err instanceof VerifyError || err instanceof CuratedWriteError
	console.error(known ? err.message : "verify stopped on an unexpected error")
	process.exit(1)
}
```

A kommune that throws stops the run after the kommuner before it were written whole; the kommune itself and the ones after it keep their previous files, and the message says it stopped. In `pipeline/package.json`, add `"verify": "node src/cli/verify.ts",` after `"extract"`.

- [ ] **Step 9: Show it red once**

In `settle`, swap the order so the rule's review is applied before the decision check (`if (p.review !== undefined) return toReview(runGates(c, ctx, now), p.review)` as the first line after the address rewrite). Run `npx vitest run test/verify.test.ts`: FAIL on "applies my answers" (my accepted answer on the shared page stays in review). Restore, run: PASS. Note it for the PR body.

- [ ] **Step 10: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add src/verify/candidates.ts src/verify/verify.ts src/curate/write.ts src/cli/verify.ts package.json test/verify.test.ts test/candidates.test.ts test/curatedWrite.test.ts
git commit -m "feat(pipeline): add the verify stage: gates, my answers, and atomic lock and curated files"
```

---

### Task 17: Review building blocks: sanitising, the queue, one item on screen

**Files:**
- Create: `pipeline/src/review/sanitise.ts`, `pipeline/src/review/queue.ts`, `pipeline/src/review/render.ts`
- Test: `pipeline/test/sanitise.test.ts`, `pipeline/test/queue.test.ts`, `pipeline/test/render.test.ts`, `pipeline/test/reviewHelpers.ts`

**Interfaces:**
- Consumes: `LockFile`, `evidenceQuotes`, `Evidence`, `SourceRef` (Task 1), `CuratedFile`, `findDecision` (Task 1), `findCuratedPath`, `lockPath` (Task 16), `FIELD_NAMES`.
- Produces:
  - `review/sanitise.ts`: `sanitise(text: string): string`.
  - `review/queue.ts`: `type FieldItem = { kind: "field"; kommune: string; unitId: string; unitName: string; field: FieldName; value: FieldValue; role?: string; evidence: Evidence; sourceUrl: string; reason: string; acute: boolean; categories: CategorySlug[] }`, `type IncludeItem = { kind: "include"; kommune: string; unitId: string; unitName: string; reason: string; suggestedCategories: CategorySlug[]; providerType?: ProviderType; sources: { kind: string; ref: string }[]; acute: boolean }`, `type ReviewItem = FieldItem | IncludeItem`, `type KommuneFiles = { kommune: string; lock: LockFile; curated: CuratedFile; curatedPath: string }`, `buildQueue(files: readonly KommuneFiles[]): ReviewItem[]`, `readKommuneFiles(dataDir: string, only?: string): KommuneFiles[]`, `kommuneArg(value: string | undefined, known: ReadonlySet<string>): { ok: true; kommune?: string } | { ok: false }`, `class ReviewError`.
  - `review/render.ts`: `renderItem(item: ReviewItem, at: number, of: number, color: boolean): string`, `FIELD_KEYS`, `INCLUDE_KEYS`.

- [ ] **Step 1: Write the failing tests**

Create `pipeline/test/sanitise.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { sanitise } from "../src/review/sanitise.ts"

describe("sanitise", () => {
	it("strips colour and cursor codes, so a page cannot recolour or clear my terminal", () => {
		expect(sanitise("\u001b[31mrød\u001b[0m \u001b[2Jtekst")).toBe("rød tekst")
		expect(sanitise("\u009b31mrød")).toBe("rød")
	})

	it("strips OSC 8 links, so a link cannot show one text and point somewhere else", () => {
		const link = "\u001b]8;;https://angriper.example/\u001b\\Eksempel kommune\u001b]8;;\u001b\\"
		expect(sanitise(link)).toBe("Eksempel kommune")
		expect(sanitise("\u001b]0;ny tittel\u0007tekst")).toBe("tekst")
	})

	it("strips bidi controls, zero-width characters and other control characters", () => {
		expect(sanitise("62\u202e00\u2066 00\u200b 00\u0007")).toBe("6200 00 00")
		expect(sanitise("linje\nto\tfane")).toBe("linje to fane")
	})

	it("keeps Norwegian letters and ordinary punctuation", () => {
		expect(sanitise("Åpent kl. 08:00\u201315:30, også lørdag.")).toBe("Åpent kl. 08:00\u201315:30, også lørdag.")
	})
})
```

Create `pipeline/test/reviewHelpers.ts` (shared by the queue and session tests; a helper file, not a test file, so importing it runs no test twice):

```ts
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { writeJsonAtomic } from "../src/io/files.ts"
import type { CuratedFile } from "../src/schema/curated.ts"
import type { LockFile } from "../src/schema/lock.ts"
import { acceptedField, curatedUnit, lockUnit } from "./helpers.ts"

const reviewPhone = acceptedField({
	status: "review",
	reason: "agreement: 1 other source(s) disagree",
	gates: acceptedField().gates.map((g) => (g.gate === "agreement" ? { ...g, pass: false, onFail: "review" as const, reason: "x" } : g)),
})
export const lockWith = (): LockFile => ({
	kommune: "3405",
	units: [
		lockUnit({ unitId: "org:999999991", fields: { phone: reviewPhone } }),
		lockUnit({
			unitId: "org:999999992",
			fields: {},
			inclusion: { status: "review", reason: "two or more register units share the page", suggestedCategories: ["nodtjenester"], providerType: "offentlig" },
		}),
	],
})
export const curatedWith = (over: Partial<CuratedFile> = {}): CuratedFile => ({
	kommune: "3405",
	name: "Lillehammer",
	units: [curatedUnit({ unitId: "org:999999991" })],
	...over,
})

export function dataDir(lock = lockWith(), curated = curatedWith()): string {
	const dir = mkdtempSync(join(tmpdir(), "varde-review-"))
	writeJsonAtomic(join(dir, "lock", "3405.json"), lock)
	writeJsonAtomic(join(dir, "curated", "3405-lillehammer.json"), curated)
	return dir
}
```

Create `pipeline/test/queue.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { buildQueue, kommuneArg, readKommuneFiles } from "../src/review/queue.ts"
import { curatedUnit, PAGE_URL } from "./helpers.ts"
import { curatedWith, dataDir, lockWith } from "./reviewHelpers.ts"

describe("buildQueue", () => {
	it("asks about acute units first, an include question before a unit's fields", () => {
		const items = buildQueue(readKommuneFiles(dataDir()))
		expect(items.map((i) => [i.kind, i.unitId, i.acute])).toEqual([
			["include", "org:999999992", true],
			["field", "org:999999991", false],
		])
	})

	it("drops every question the curated file already answers", () => {
		const answered = curatedWith({
			units: [
				curatedUnit({
					unitId: "org:999999991",
					decisions: [{ field: "phone", value: "62 00 00 00", sourceUrl: PAGE_URL, decision: "accept", decidedOn: "2026-11-06" }],
				}),
				curatedUnit({ unitId: "org:999999992", include: false, excludeReason: "Ikke en tjeneste", categories: [] }),
			],
		})
		expect(buildQueue(readKommuneFiles(dataDir(lockWith(), answered)))).toEqual([])
	})
})

describe("kommuneArg", () => {
	const known = new Set(["3405", "0301"])

	it("takes a KLASS kommune number the last discover run read, or none", () => {
		expect(kommuneArg("3405", known)).toEqual({ ok: true, kommune: "3405" })
		expect(kommuneArg(undefined, known)).toEqual({ ok: true })
	})

	it("refuses anything else before it is used in a path", () => {
		for (const bad of ["../x", "3405/../../etc", "9999", "34050", "", " 3405"]) expect(kommuneArg(bad, known)).toEqual({ ok: false })
	})
})
```

Create `pipeline/test/render.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import type { FieldItem, IncludeItem } from "../src/review/queue.ts"
import { renderItem } from "../src/review/render.ts"

const field: FieldItem = {
	kind: "field",
	kommune: "3405",
	unitId: "org:999999991",
	unitName: "Eksempel helsestasjon",
	field: "phone",
	value: "900 00 000",
	role: "Avdelingsleder",
	evidence: { kind: "quote", quotes: ["Avdelingsleder\u001b[2J", "900 00 000\u202e"] },
	sourceUrl: "https://www.eksempel.kommune.no/helsestasjon/",
	reason: "safety: a mobile on the unit page needs its role label",
	acute: false,
	categories: ["familie-og-barn"],
}

describe("renderItem", () => {
	it("shows progress, kommune, unit, field, value, role, quote, link, host and reason, in that order", () => {
		const text = renderItem(field, 3, 17, false)
		const order = ["3 of 17", "3405", "Eksempel helsestasjon", "phone", "900 00 000", "Avdelingsleder", "Quote", "Source", "Host: www.eksempel.kommune.no", "Why"]
		const at = order.map((s) => text.indexOf(s))
		expect(at.every((n) => n >= 0)).toBe(true)
		expect([...at].sort((a, b) => a - b)).toEqual(at)
		expect(text).toContain("a accept, r reject, e edit, s skip, q quit, then Enter")
	})

	it("prints no escape code at all without colour, and frames in plain ASCII", () => {
		const text = renderItem(field, 1, 1, false)
		expect(text).not.toContain("\u001b")
		expect(text).not.toContain("\u202e")
		for (const line of text.split("\n").filter((l) => l.startsWith("+") || l.trimStart().startsWith("+"))) {
			expect(line).toMatch(/^[\x20-\x7E]*$/)
		}
	})

	it("uses colour for labels only, and strips codes from page text even then", () => {
		const text = renderItem(field, 1, 1, true)
		expect(text).toContain("\u001b[1m")
		expect(text).not.toContain("\u001b[2J")
	})

	it("asks an include question with its keys", () => {
		const item: IncludeItem = {
			kind: "include",
			kommune: "3405",
			unitId: "org:999999992",
			unitName: "Eksempel legevakt",
			reason: "no known category",
			suggestedCategories: ["nodtjenester"],
			sources: [{ kind: "page", ref: "https://www.eksempel.kommune.no/legevakt/" }],
			acute: true,
		}
		const text = renderItem(item, 1, 2, false)
		expect(text).toContain("Include this unit?")
		expect(text).toContain("nodtjenester")
		expect(text).toContain("y include, n leave out, s skip, q quit, then Enter")
	})
})
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run test/sanitise.test.ts test/queue.test.ts test/render.test.ts`
Expected: FAIL, the modules do not exist.

- [ ] **Step 3: Write `src/review/sanitise.ts`**

```ts
// Page text can hold terminal control codes. Everything a page gave (quotes, values, links) goes
// through here before it is printed, so a page cannot recolour, clear or rewrite my terminal, or
// make a quote or a link read differently from what it is. Each pattern scans forward once.
const OSC = /\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)?/g
const C1_OSC = /\u009d[^\u0007\u009c]*[\u0007\u009c]?/g
const CSI = /\u001b\[[0-?]*[ -/]*[@-~]/g
const C1_CSI = /\u009b[0-?]*[ -/]*[@-~]/g
const OTHER_ESCAPE = /\u001b[@-Z\\-_]?/g
const LINE_BREAKS = /[\t\n\r\u2028\u2029]/g
const CONTROLS = /[\u0000-\u001f\u007f-\u009f]/g
// Bidi controls (they reorder what follows), zero-width characters and the soft hyphen.
const INVISIBLE = /[\u00ad\u061c\u180e\u200b-\u200f\u202a-\u202e\u2060-\u2064\u2066-\u2069\ufeff]/g

export function sanitise(text: string): string {
	return text
		.replace(OSC, "")
		.replace(C1_OSC, "")
		.replace(CSI, "")
		.replace(C1_CSI, "")
		.replace(OTHER_ESCAPE, "")
		.replace(LINE_BREAKS, " ")
		.replace(CONTROLS, "")
		.replace(INVISIBLE, "")
}
```

- [ ] **Step 4: Write `src/review/queue.ts`**

```ts
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { type CategorySlug, FIELD_NAMES, type FieldName, type FieldValue, type ProviderType } from "../schema/common.ts"
import { CuratedFile, findDecision } from "../schema/curated.ts"
import { type Evidence, LockFile } from "../schema/lock.ts"
import { findCuratedPath } from "../verify/verify.ts"

export class ReviewError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "ReviewError"
	}
}

export type FieldItem = {
	kind: "field"
	kommune: string
	unitId: string
	unitName: string
	field: FieldName
	value: FieldValue
	role?: string
	evidence: Evidence
	sourceUrl: string
	reason: string
	acute: boolean
	categories: CategorySlug[]
}
export type IncludeItem = {
	kind: "include"
	kommune: string
	unitId: string
	unitName: string
	reason: string
	suggestedCategories: CategorySlug[]
	providerType?: ProviderType
	sources: { kind: string; ref: string }[]
	acute: boolean
}
export type ReviewItem = FieldItem | IncludeItem
export type KommuneFiles = { kommune: string; lock: LockFile; curated: CuratedFile; curatedPath: string }

// --kommune must be a KLASS kommune number the last discover run read, checked before it is used
// in any file path. "../x" never reaches a path.
export function kommuneArg(value: string | undefined, known: ReadonlySet<string>): { ok: true; kommune?: string } | { ok: false } {
	if (value === undefined) return { ok: true }
	return /^\d{4}$/.test(value) && known.has(value) ? { ok: true, kommune: value } : { ok: false }
}

// The parsed JSON of a file. Messages name the file only, since a parse error would quote it.
function readJson(path: string, label: string): unknown {
	try {
		return JSON.parse(readFileSync(path, "utf8"))
	} catch {
		throw new ReviewError(`${label} is not valid JSON`)
	}
}

// Every lock file in <data>/lock, with its kommune's curated file. Verify writes both, so a lock
// file without a curated file means verify did not finish.
export function readKommuneFiles(dataDir: string, only?: string): KommuneFiles[] {
	const dir = join(dataDir, "lock")
	if (!existsSync(dir)) return []
	return readdirSync(dir)
		.filter((f) => /^\d{4}\.json$/.test(f) && (only === undefined || f === `${only}.json`))
		.sort()
		.map((f) => {
			const kommune = f.slice(0, 4)
			const lock = LockFile.safeParse(readJson(join(dir, f), `lock/${f}`))
			if (!lock.success) throw new ReviewError(`lock/${f} does not match its schema`)
			const curatedPath = findCuratedPath(dataDir, kommune)
			if (curatedPath === undefined) throw new ReviewError(`${kommune} has no curated file: run verify first`)
			const curated = CuratedFile.safeParse(readJson(curatedPath, `the curated file of ${kommune}`))
			if (!curated.success) throw new ReviewError(`the curated file of ${kommune} does not match its schema`)
			return { kommune, lock: lock.data, curated: curated.data, curatedPath }
		})
}

const ACUTE: CategorySlug = "nodtjenester"

// Every open question: fields in review that I have not answered, and "include this unit?" for
// units the curated file does not have yet. Acute units first, then kommune, unit and field.
export function buildQueue(files: readonly KommuneFiles[]): ReviewItem[] {
	const items: ReviewItem[] = []
	for (const f of files) {
		for (const unit of f.lock.units) {
			const mine = f.curated.units.find((u) => u.unitId === unit.unitId)
			if (mine?.include === false) continue
			const categories = mine?.categories ?? unit.inclusion?.suggestedCategories ?? []
			const acute = categories.includes(ACUTE)
			const lockName = unit.fields.name?.value
			const unitName = mine?.name ?? (typeof lockName === "string" ? lockName : unit.unitId)
			const pending = mine === undefined && unit.inclusion?.status === "review"
			if (pending && unit.inclusion !== undefined) {
				items.push({
					kind: "include",
					kommune: f.kommune,
					unitId: unit.unitId,
					unitName,
					reason: unit.inclusion.reason,
					suggestedCategories: unit.inclusion.suggestedCategories,
					...(unit.inclusion.providerType === undefined ? {} : { providerType: unit.inclusion.providerType }),
					sources: unit.sources,
					acute,
				})
			}
			if (mine === undefined && !pending) continue
			for (const name of FIELD_NAMES) {
				const field = unit.fields[name]
				if (field?.status !== "review" || field.value === undefined || field.evidence === undefined) continue
				const q = { field: name, value: field.value, sourceUrl: field.sourceUrl }
				if (mine !== undefined && findDecision(mine.decisions, q) !== undefined) continue
				items.push({
					kind: "field",
					kommune: f.kommune,
					unitId: unit.unitId,
					unitName,
					field: name,
					value: field.value,
					...(field.role === undefined ? {} : { role: field.role }),
					evidence: field.evidence,
					sourceUrl: field.sourceUrl,
					reason: field.reason ?? "review",
					acute,
					categories,
				})
			}
		}
	}
	const rank = (i: ReviewItem) => (i.kind === "include" ? -1 : FIELD_NAMES.indexOf(i.field))
	return items.sort(
		(a, b) =>
			Number(b.acute) - Number(a.acute) ||
			a.kommune.localeCompare(b.kommune) ||
			a.unitId.localeCompare(b.unitId) ||
			rank(a) - rank(b)
	)
}
```

- [ ] **Step 5: Write `src/review/render.ts`**

```ts
import { evidenceQuotes } from "../schema/lock.ts"
import type { ReviewItem } from "./queue.ts"
import { sanitise } from "./sanitise.ts"

export const FIELD_KEYS = "Keys: a accept, r reject, e edit, s skip, q quit, then Enter"
export const INCLUDE_KEYS = "Keys: y include, n leave out, s skip, q quit, then Enter"

const RULE = `+${"-".repeat(72)}`
const QUOTE_RULE = `  +${"-".repeat(70)}`

const hostOf = (url: string) => {
	try {
		return new URL(url).hostname
	} catch {
		return "(not a URL)"
	}
}

// One item as plain text. Meaning never rests on colour: the frame is ASCII, every item lists its
// keys in words, and colour (labels in bold) is off without a terminal or with NO_COLOR. Every
// piece of page text is sanitised, and a link's host is printed on its own line.
export function renderItem(item: ReviewItem, at: number, of: number, color: boolean): string {
	const label = (text: string) => (color ? `\u001b[1m${text}\u001b[0m` : text)
	const s = (text: string) => sanitise(text)
	const head = item.kind === "field" ? `field ${item.field}` : "Include this unit?"
	const lines = [RULE, `| ${at} of ${of}   kommune ${item.kommune}   ${s(item.unitName)}   ${head}`, RULE]
	if (item.kind === "field") {
		lines.push(`${label("Value:")} ${s(String(item.value))}`)
		if (item.role !== undefined) lines.push(`${label("Role:")} ${s(item.role)}`)
		const quotes = evidenceQuotes(item.evidence)
		const original = item.evidence.kind === "decision" ? item.evidence.original : item.evidence
		if (quotes.length > 0) {
			lines.push(label("Quote:"), QUOTE_RULE, ...quotes.map((q) => `  | ${s(q)}`), QUOTE_RULE)
		} else if (original.kind === "register") {
			lines.push(`${label("Register:")} ${original.register}, record ${s(original.recordId)}`)
		}
		lines.push(`${label("Source:")} ${s(item.sourceUrl)}`, `${label("Host:")} ${s(hostOf(item.sourceUrl))}`)
		lines.push(`${label("Why:")} ${s(item.reason)}`, FIELD_KEYS)
	} else {
		lines.push(`${label("Why:")} ${s(item.reason)}`)
		lines.push(`${label("Suggested categories:")} ${item.suggestedCategories.join(", ") || "none"}`)
		lines.push(`${label("Provider type:")} ${item.providerType ?? "unknown"}`)
		for (const ref of item.sources) {
			if (ref.kind === "page") lines.push(`${label("Page:")} ${s(ref.ref)}`, `${label("Host:")} ${s(hostOf(ref.ref))}`)
			else lines.push(`${label("Register:")} ${ref.kind}, record ${s(ref.ref)}`)
		}
		lines.push(INCLUDE_KEYS)
	}
	return `${lines.join("\n")}\n`
}
```

The render test's "Host:" check passes on "Host: www.eksempel.kommune.no" with `color: false`; with colour the label is wrapped, which the order test does not use.

- [ ] **Step 6: Run the tests to see them pass**

Run: `npx vitest run test/sanitise.test.ts test/queue.test.ts test/render.test.ts`
Expected: PASS.

- [ ] **Step 7: Show it red once**

In `sanitise`, delete `.replace(OSC, "")`. Run `npx vitest run test/sanitise.test.ts`: FAIL on "strips OSC 8 links". Restore, run: PASS. Note it for the PR body.

- [ ] **Step 8: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add src/review/sanitise.ts src/review/queue.ts src/review/render.ts test/sanitise.test.ts test/queue.test.ts test/render.test.ts test/reviewHelpers.ts
git commit -m "feat(pipeline): build the review queue and show each item as sanitised plain text"
```

---

### Task 18: The review walk-through and its command

**Files:**
- Create: `pipeline/src/review/lines.ts`, `pipeline/src/review/session.ts`, `pipeline/src/cli/review.ts`
- Modify: `pipeline/package.json` (script `review`)
- Test: `pipeline/test/session.test.ts`

**Interfaces:**
- Consumes: `buildQueue`, `KommuneFiles`, `FieldItem`, `IncludeItem` (Task 17), `renderItem` (Task 17), `writeCuratedFile`, `CuratedWriteError` (Task 16), `validityGate`, `safetyGate`, `GateContext`, `Candidate`, `AddressHit`, `CuratedFile`, `CuratedUnit`, `ReviewDecision`, `CATEGORY_SLUGS`, `findAddress` (CLI only), `kommuneArg`, `readKommuneFiles`.
- Produces:
  - `review/lines.ts`: `class LineReader` with `constructor(input: NodeJS.ReadableStream, signal?: AbortSignal)` and `next(): Promise<string | undefined>` (a whole line without its line break; `undefined` at the end of input or on abort; a last line without Enter is dropped).
  - `review/session.ts`: `type EditChecks = { findAddress: (address: string, kommune: string) => Promise<AddressHit | undefined>; urlStatus: (url: string) => Promise<number | undefined>; validKommuner: ReadonlySet<string> }`, `type ReviewIO = { input: NodeJS.ReadableStream; output: { write: (text: string) => unknown }; isTTY: boolean; color: boolean; signal?: AbortSignal; today: () => string; checks: EditChecks; save?: (path: string, file: CuratedFile) => Promise<void> }`, `type ReviewOutcome = { outcome: "empty" | "refused" | "done" | "quit" | "stopped"; answered: number }`, `runReview(files: KommuneFiles[], io: ReviewIO): Promise<ReviewOutcome>`, `osloDate(ms?: number): string`.

- [ ] **Step 1: Write the failing test**

Create `pipeline/test/session.test.ts`:

```ts
import { readFileSync, renameSync } from "node:fs"
import { PassThrough } from "node:stream"
import { describe, expect, it } from "vitest"
import { writeCuratedFile } from "../src/curate/write.ts"
import { readKommuneFiles } from "../src/review/queue.ts"
import { type ReviewIO, runReview } from "../src/review/session.ts"
import type { CuratedFile } from "../src/schema/curated.ts"
import { curatedUnit, PAGE_URL } from "./helpers.ts"
import { curatedWith, dataDir, lockWith } from "./reviewHelpers.ts"

const checks = { findAddress: async () => undefined, urlStatus: async () => 200, validKommuner: new Set(["3405"]) }

async function session(keys: string, over: Partial<ReviewIO> = {}, dir = dataDir()) {
	const files = readKommuneFiles(dir)
	const input = new PassThrough()
	const out: string[] = []
	const done = runReview(files, {
		input,
		output: { write: (t: string) => out.push(t) },
		isTTY: true,
		color: false,
		today: () => "2026-11-06",
		checks,
		...over,
	})
	input.end(keys)
	const result = await done
	const curated = JSON.parse(readFileSync(files[0]?.curatedPath ?? "", "utf8")) as CuratedFile
	return { result, text: out.join(""), curated }
}

describe("runReview", () => {
	it("says Nothing to review and exits when nothing is open", async () => {
		const answered = curatedWith({
			units: [
				curatedUnit({
					unitId: "org:999999991",
					decisions: [{ field: "phone", value: "62 00 00 00", sourceUrl: PAGE_URL, decision: "accept", decidedOn: "2026-11-06" }],
				}),
				curatedUnit({ unitId: "org:999999992", include: false, excludeReason: "Ikke en tjeneste", categories: [] }),
			],
		})
		const { result, text } = await session("", {}, dataDir(lockWith(), answered))
		expect(result.outcome).toBe("empty")
		expect(text).toContain("Nothing to review")
	})

	it("refuses to start without an interactive terminal, so it can never answer for me", async () => {
		const { result, curated } = await session("y\n\na\n", { isTTY: false })
		expect(result.outcome).toBe("refused")
		expect(curated).toEqual(curatedWith())
	})

	it("y with Enter includes the unit with the suggested categories; a accepts the field", async () => {
		const { result, curated } = await session("y\n\na\n")
		expect(result).toEqual({ outcome: "done", answered: 2 })
		expect(curated.units.find((u) => u.unitId === "org:999999992")).toMatchObject({
			include: true,
			categories: ["nodtjenester"],
			providerType: "offentlig",
		})
		expect(curated.units.find((u) => u.unitId === "org:999999991")?.decisions).toEqual([
			{ field: "phone", value: "62 00 00 00", sourceUrl: PAGE_URL, decision: "accept", decidedOn: "2026-11-06" },
		])
	})

	it("y with numbers picks the categories", async () => {
		const { curated } = await session("y\n9 3\ns\n")
		expect(curated.units.find((u) => u.unitId === "org:999999992")?.categories).toEqual(["psykisk-helse", "nodtjenester"])
	})

	it("n leaves the unit out with my reason; r rejects the field", async () => {
		const { curated } = await session("n\nIkke en tjeneste\nr\n")
		expect(curated.units.find((u) => u.unitId === "org:999999992")).toMatchObject({ include: false, excludeReason: "Ikke en tjeneste" })
		expect(curated.units.find((u) => u.unitId === "org:999999991")?.decisions[0]).toMatchObject({ decision: "reject" })
	})

	it("s skips and q quits, and neither saves anything", async () => {
		expect((await session("s\ns\n")).curated).toEqual(curatedWith())
		const quit = await session("q\n")
		expect(quit.result.outcome).toBe("quit")
		expect(quit.curated).toEqual(curatedWith())
	})

	it("saves nothing for a key without Enter", async () => {
		const { result, curated } = await session("y")
		expect(result.outcome).toBe("quit")
		expect(curated).toEqual(curatedWith())
	})

	it("asks again after a key it does not know", async () => {
		const { text, curated } = await session("x\ns\ns\n")
		expect(text).toContain("Use one of")
		expect(curated).toEqual(curatedWith())
	})

	it("refuses an edit the validity or safety gate fails, says why, and asks the same item again", async () => {
		const { text, curated } = await session("s\ne\nikke et nummer\ne\n62 00 00 09\n\n")
		expect(text).toContain("Refused: validity: not a number in the Nkom plan")
		expect(curated.units.find((u) => u.unitId === "org:999999991")?.decisions).toEqual([
			{
				field: "phone",
				value: "62 00 00 00",
				sourceUrl: PAGE_URL,
				decision: "edit",
				editedValue: "62 00 00 09",
				decidedOn: "2026-11-06",
			},
		])
	})

	it("asks for a role with an edited mobile, and refuses a mobile with none", async () => {
		const { text, curated } = await session("s\ne\n900 00 009\n\ne\n900 00 009\nAvdelingsleder\n")
		expect(text).toContain("Refused: safety")
		expect(curated.units.find((u) => u.unitId === "org:999999991")?.decisions[0]).toMatchObject({
			editedValue: "900 00 009",
			role: "Avdelingsleder",
		})
	})

	it("stops on Ctrl+C like q, with every earlier answer saved", async () => {
		const controller = new AbortController()
		const files = readKommuneFiles(dataDir())
		const input = new PassThrough()
		const done = runReview(files, {
			input,
			output: { write: () => true },
			isTTY: true,
			color: false,
			today: () => "2026-11-06",
			checks,
			signal: controller.signal,
		})
		input.write("y\n\n")
		await new Promise((r) => setTimeout(r, 20))
		controller.abort()
		expect((await done).outcome).toBe("quit")
		const curated = JSON.parse(readFileSync(files[0]?.curatedPath ?? "", "utf8")) as CuratedFile
		expect(curated.units.some((u) => u.unitId === "org:999999992")).toBe(true)
	})

	it("saves through a rename that fails once, and stops with the temporary file kept when it keeps failing", async () => {
		let calls = 0
		const flaky = (path: string, file: CuratedFile) =>
			writeCuratedFile(path, file, {
				rename: (from, to) => {
					calls++
					if (calls === 1) throw Object.assign(new Error("busy"), { code: "EBUSY" })
					renameSync(from, to)
				},
				sleep: async () => {},
			})
		const once = await session("y\n\ns\n", { save: flaky })
		expect(once.curated.units.some((u) => u.unitId === "org:999999992")).toBe(true)
		const broken = (path: string, file: CuratedFile) =>
			writeCuratedFile(path, file, {
				rename: () => {
					throw Object.assign(new Error("busy"), { code: "EBUSY" })
				},
				sleep: async () => {},
			})
		const stopped = await session("y\n\n", { save: broken })
		expect(stopped.result.outcome).toBe("stopped")
		expect(stopped.text).toContain("kept in")
	})

	it("prints no escape code with colour off, and bold labels with it on", async () => {
		expect((await session("q\n")).text).not.toContain("\u001b")
		expect((await session("q\n", { color: true })).text).toContain("\u001b[1m")
	})
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run test/session.test.ts`
Expected: FAIL, `src/review/session.ts` does not exist.

- [ ] **Step 3: Write `src/review/lines.ts`**

```ts
// Whole lines from the terminal, one per Enter. A key with no Enter after it is never a line, so a
// stray or repeated key press commits nothing. On abort (Ctrl+C) or the end of input, next() gives
// undefined at once.
export class LineReader {
	readonly #lines: string[] = []
	#partial = ""
	#closed = false
	#aborted = false
	#wake: (() => void) | undefined

	constructor(input: NodeJS.ReadableStream, signal?: AbortSignal) {
		;(input as { setEncoding?: (encoding: string) => void }).setEncoding?.("utf8")
		input.on("data", (chunk: string | Buffer) => {
			const parts = `${this.#partial}${String(chunk)}`.split("\n")
			this.#partial = parts.pop() ?? ""
			this.#lines.push(...parts.map((l) => l.replace(/\r$/, "")))
			this.#wake?.()
		})
		const close = () => {
			this.#closed = true
			this.#wake?.()
		}
		input.on("end", close)
		input.on("close", close)
		const abort = () => {
			this.#aborted = true
			close()
		}
		if (signal?.aborted) abort()
		signal?.addEventListener("abort", abort, { once: true })
	}

	async next(): Promise<string | undefined> {
		for (;;) {
			if (this.#aborted) return undefined
			const line = this.#lines.shift()
			if (line !== undefined) return line
			if (this.#closed) return undefined
			await new Promise<void>((resolve) => {
				this.#wake = resolve
			})
			this.#wake = undefined
		}
	}
}
```

- [ ] **Step 4: Write `src/review/session.ts`**

```ts
import { CuratedWriteError, writeCuratedFile } from "../curate/write.ts"
import { safetyGate } from "../gates/safety.ts"
import type { AddressHit, Candidate, Gate, GateContext } from "../gates/types.ts"
import { validityGate } from "../gates/validity.ts"
import { CATEGORY_SLUGS, type CategorySlug, type FieldValue, type ProviderType } from "../schema/common.ts"
import type { CuratedFile, CuratedUnit, ReviewDecision } from "../schema/curated.ts"
import { LineReader } from "./lines.ts"
import { buildQueue, type FieldItem, type IncludeItem, type KommuneFiles } from "./queue.ts"
import { renderItem } from "./render.ts"

export type EditChecks = {
	findAddress: (address: string, kommune: string) => Promise<AddressHit | undefined>
	urlStatus: (url: string) => Promise<number | undefined>
	validKommuner: ReadonlySet<string>
}
export type ReviewIO = {
	input: NodeJS.ReadableStream
	output: { write: (text: string) => unknown }
	isTTY: boolean
	color: boolean
	signal?: AbortSignal
	today: () => string
	checks: EditChecks
	save?: (path: string, file: CuratedFile) => Promise<void>
}
export type ReviewOutcome = { outcome: "empty" | "refused" | "done" | "quit" | "stopped"; answered: number }

// Today in Norway, as the calendar date my decisions carry.
export const osloDate = (ms = Date.now()) =>
	new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo", year: "numeric", month: "2-digit", day: "2-digit" }).format(ms)

type Step = "answered" | "skip" | "again" | "quit" | "stopped"
const BOOLEAN_FIELDS = new Set(["alwaysOpen", "lowThreshold"])

class Session {
	readonly #io: ReviewIO
	readonly #reader: LineReader
	readonly #byKommune: Map<string, KommuneFiles>

	constructor(files: readonly KommuneFiles[], io: ReviewIO) {
		this.#io = io
		this.#reader = new LineReader(io.input, io.signal)
		this.#byKommune = new Map(files.map((f) => [f.kommune, f]))
	}

	out(text: string): void {
		this.#io.output.write(text)
	}

	// A line from me, trimmed. undefined means quit: the end of input or Ctrl+C.
	async line(prompt: string): Promise<string | undefined> {
		this.out(prompt)
		return (await this.#reader.next())?.trim()
	}

	async key(keys: readonly string[]): Promise<string | undefined> {
		for (;;) {
			const answer = await this.line("> ")
			if (answer === undefined) return undefined
			if (keys.includes(answer.toLowerCase())) return answer.toLowerCase()
			this.out(`Use one of: ${keys.join(", ")}, then Enter\n`)
		}
	}

	async save(kommune: string): Promise<boolean> {
		const f = this.#byKommune.get(kommune)
		if (f === undefined) return false
		try {
			await (this.#io.save ?? writeCuratedFile)(f.curatedPath, f.curated)
			return true
		} catch (err) {
			this.out(`${err instanceof CuratedWriteError ? err.message : "could not save the curated file"}. Stopping.\n`)
			return false
		}
	}

	unit(kommune: string, unitId: string): CuratedUnit | undefined {
		return this.#byKommune.get(kommune)?.curated.units.find((u) => u.unitId === unitId)
	}

	addUnit(kommune: string, unit: CuratedUnit): void {
		const f = this.#byKommune.get(kommune)
		if (f === undefined) return
		f.curated = { ...f.curated, units: [...f.curated.units, unit].sort((a, b) => (a.unitId < b.unitId ? -1 : 1)) }
	}

	async providerType(suggested: ProviderType | undefined): Promise<ProviderType | undefined> {
		if (suggested !== undefined) return suggested
		this.out("Provider type: o offentlig, f frivillig, then Enter\n")
		const k = await this.key(["o", "f"])
		return k === undefined ? undefined : k === "o" ? "offentlig" : "frivillig"
	}

	async categories(suggested: readonly CategorySlug[]): Promise<CategorySlug[] | undefined> {
		const list = CATEGORY_SLUGS.map((c, i) => `${i + 1} ${c}`).join(", ")
		for (;;) {
			const answer = await this.line(`Categories by number (${list}). Enter takes: ${suggested.join(", ") || "none"}\n> `)
			if (answer === undefined) return undefined
			if (answer === "" && suggested.length > 0) return [...suggested]
			const picked = answer.split(/\s+/).map(Number)
			if (answer !== "" && picked.every((n) => Number.isInteger(n) && n >= 1 && n <= CATEGORY_SLUGS.length)) {
				const set = new Set(picked.map((n) => CATEGORY_SLUGS[n - 1] as CategorySlug))
				return CATEGORY_SLUGS.filter((c) => set.has(c))
			}
			this.out("Use numbers from the list, separated by spaces\n")
		}
	}

	async include(item: IncludeItem): Promise<Step> {
		const k = await this.key(["y", "n", "s", "q"])
		if (k === undefined || k === "q") return "quit"
		if (k === "s") return "skip"
		const brreg = item.sources.find((s) => s.kind === "brreg")?.ref
		const nav = item.sources.find((s) => s.kind === "nav")?.ref
		const sources: CuratedUnit["sources"] = {
			...(brreg === undefined ? {} : { orgNumber: brreg }),
			...(nav === undefined ? {} : { navOfficeId: nav }),
			pages: item.sources.filter((s) => s.kind === "page").map((s) => s.ref),
		}
		if (k === "y") {
			const categories = await this.categories(item.suggestedCategories)
			if (categories === undefined) return "quit"
			const providerType = await this.providerType(item.providerType)
			if (providerType === undefined) return "quit"
			this.addUnit(item.kommune, { unitId: item.unitId, name: item.unitName, include: true, sources, categories, providerType, decisions: [] })
		} else {
			let reason = ""
			while (reason === "") {
				const answer = await this.line("Why leave it out? Then Enter\n> ")
				if (answer === undefined) return "quit"
				reason = answer
			}
			const providerType = await this.providerType(item.providerType)
			if (providerType === undefined) return "quit"
			this.addUnit(item.kommune, {
				unitId: item.unitId,
				name: item.unitName,
				include: false,
				excludeReason: reason,
				sources,
				categories: [],
				providerType,
				decisions: [],
			})
		}
		return (await this.save(item.kommune)) ? "answered" : "stopped"
	}

	// An edited value runs the validity gate and the safety gate before it is saved.
	async refusal(item: FieldItem, value: FieldValue, role: string | undefined, gates: readonly Gate[]): Promise<string | undefined> {
		const text = typeof value === "string" ? value : undefined
		const hit = item.field === "address" && text !== undefined ? await this.#io.checks.findAddress(text, item.kommune) : undefined
		const status =
			(item.field === "website" || item.field === "chatUrl") && text !== undefined ? await this.#io.checks.urlStatus(text) : undefined
		const ctx: GateContext = {
			allowedHosts: new Set(),
			robotsAllows: () => true,
			licence: () => "ownPage",
			pageText: () => undefined,
			urlStatus: () => status,
			findAddress: () => hit,
			validKommuner: this.#io.checks.validKommuner,
			// The real facts come back in verify, which runs both gates again on my answer.
			unit: { categories: item.categories, isKrisesenter: false, ownHosts: new Set() },
			peers: [],
		}
		const original = item.evidence.kind === "decision" ? item.evidence.original : item.evidence
		const c: Candidate = {
			kommune: item.kommune,
			unitId: item.unitId,
			field: item.field,
			value,
			sourceUrl: item.sourceUrl,
			evidence: { kind: "decision", decidedOn: this.#io.today(), original },
			origin: "unitContact",
			...(role === undefined ? {} : { role }),
			personNames: [],
			fetchedAt: "1970-01-01T00:00:00Z",
		}
		for (const gate of gates) {
			const result = gate(c, ctx)
			if (!result.pass) return `${result.gate}: ${result.reason ?? "failed"}`
		}
		return undefined
	}

	async field(item: FieldItem): Promise<Step> {
		const k = await this.key(["a", "r", "e", "s", "q"])
		if (k === undefined || k === "q") return "quit"
		if (k === "s") return "skip"
		const unit = this.unit(item.kommune, item.unitId)
		if (unit === undefined) return "skip"
		const base = { field: item.field, value: item.value, sourceUrl: item.sourceUrl, decidedOn: this.#io.today() }
		let decision: ReviewDecision
		if (k === "e") {
			const typed = await this.line(BOOLEAN_FIELDS.has(item.field) ? "Your value, ja or nei, then Enter\n> " : "Your value, then Enter\n> ")
			if (typed === undefined) return "quit"
			const value: FieldValue = BOOLEAN_FIELDS.has(item.field) ? typed.toLowerCase() === "ja" : typed
			if (typed === "" || (BOOLEAN_FIELDS.has(item.field) && !["ja", "nei"].includes(typed.toLowerCase()))) {
				this.out("Refused: that is not a value for this field\n")
				return "again"
			}
			// Validity first, so a value that is no number is refused before the role is asked.
			const invalid = await this.refusal(item, value, undefined, [validityGate])
			if (invalid !== undefined) {
				this.out(`Refused: ${invalid}\n`)
				return "again"
			}
			let role: string | undefined
			if (item.field === "phone") {
				const typedRole = await this.line("Role label (for example Avdelingsleder), or Enter for none\n> ")
				if (typedRole === undefined) return "quit"
				role = typedRole === "" ? undefined : typedRole
			}
			const unsafe = await this.refusal(item, value, role, [safetyGate])
			if (unsafe !== undefined) {
				this.out(`Refused: ${unsafe}\n`)
				return "again"
			}
			decision = { ...base, decision: "edit", editedValue: value, ...(role === undefined ? {} : { role }) }
		} else {
			decision = { ...base, decision: k === "a" ? "accept" : "reject" }
		}
		unit.decisions = [...unit.decisions, decision]
		return (await this.save(item.kommune)) ? "answered" : "stopped"
	}
}

// The terminal walk-through, one item at a time. Each answer is written to the curated file at
// once, so quitting (q, Ctrl+C, the end of input) loses nothing already answered.
export async function runReview(files: KommuneFiles[], io: ReviewIO): Promise<ReviewOutcome> {
	if (!io.isTTY) {
		io.output.write("review needs an interactive terminal, so it can never answer for me. Run it in a terminal.\n")
		return { outcome: "refused", answered: 0 }
	}
	const items = buildQueue(files)
	if (items.length === 0) {
		io.output.write("Nothing to review\n")
		return { outcome: "empty", answered: 0 }
	}
	const s = new Session(files, io)
	const left = new Set<string>()
	let answered = 0
	for (let i = 0; i < items.length; i++) {
		const item = items[i]
		if (item === undefined) continue
		const key = `${item.kommune}|${item.unitId}`
		if (item.kind === "field" && (left.has(key) || s.unit(item.kommune, item.unitId)?.include !== true)) continue
		s.out(renderItem(item, i + 1, items.length, io.color))
		const step = item.kind === "include" ? await s.include(item) : await s.field(item)
		if (step === "quit") {
			s.out("Stopped. Every answer so far is saved.\n")
			return { outcome: "quit", answered }
		}
		if (step === "stopped") return { outcome: "stopped", answered }
		if (step === "again") i--
		if (step === "answered") answered++
		if (item.kind === "include" && step !== "answered") left.add(key)
	}
	s.out(`Done: ${answered} answered. Run git diff on the curated files to check them before I commit.\n`)
	return { outcome: "done", answered }
}
```

`KommuneFiles.curated` is reassigned by `addUnit`, so it cannot be `readonly`; the type in `queue.ts` has no `readonly`, which is what this needs.

- [ ] **Step 5: Run it to see it pass**

Run: `npx vitest run test/session.test.ts`
Expected: PASS. The validity gate runs before the role is asked, so in "refuses an edit" the bad value never reaches the role prompt. In "asks for a role with an edited mobile", the first edit has an empty role, so the safety gate gives "a mobile on the unit page needs its role label", which the session refuses (any failed gate refuses); the second edit has the role and is saved.

- [ ] **Step 6: Write `src/cli/review.ts` and the script**

```ts
// Walks me through every open review item, one at a time, and writes each answer into the
// curated file at once. Local only: it refuses to run without an interactive terminal.
//   node src/cli/review.ts --data <dir> [--kommune 3405] [--cache <dir>]
import { join, resolve } from "node:path"
import { parseArgs } from "node:util"
import { CuratedWriteError } from "../curate/write.ts"
import { DiscoverError } from "../discover/discover.ts"
import { readDiscovery } from "../discover/files.ts"
import { DEFAULT_CACHE_DIR } from "../io/pageCache.ts"
import { AllowList } from "../net/allowList.ts"
import { systemClock } from "../net/clock.ts"
import { Crawler } from "../net/crawler.ts"
import { httpsTransport } from "../net/http.ts"
import { findAddress } from "../registers/kartverket.ts"
import { kommuneArg, ReviewError, readKommuneFiles } from "../review/queue.ts"
import { osloDate, runReview } from "../review/session.ts"

const USAGE = "usage: review --data <dir> [--kommune 3405] [--cache <dir>]"
const { values } = parseArgs({ options: { data: { type: "string" }, kommune: { type: "string" }, cache: { type: "string" } } })
if (values.data === undefined) {
	console.error(USAGE)
	process.exit(2)
}
const root = values.cache ?? DEFAULT_CACHE_DIR
try {
	const found = readDiscovery(join(root, "discover"))
	const known = new Set(found.report.kommuner)
	// Checked before the number is used in any path.
	const arg = kommuneArg(values.kommune, known)
	if (!arg.ok) {
		console.error("--kommune must be a KLASS kommune number the last discover run read")
		process.exit(2)
	}
	const files = readKommuneFiles(resolve(values.data), arg.kommune)
	const crawler = new Crawler({ transport: httpsTransport, clock: systemClock, allowList: AllowList.restore(found.hosts) })
	const controller = new AbortController()
	process.on("SIGINT", () => controller.abort())
	const isTTY = process.stdin.isTTY === true && process.stdout.isTTY === true
	const result = await runReview(files, {
		input: process.stdin,
		output: process.stdout,
		isTTY,
		// NO_COLOR with any value turns colour off (no-color.org).
		color: isTTY && !process.env.NO_COLOR,
		signal: controller.signal,
		today: () => osloDate(),
		checks: {
			findAddress: (address, kommune) => findAddress(crawler.get, address, kommune),
			urlStatus: async (url) => {
				const res = await crawler.get(url, "html")
				return res.ok ? res.status : res.status
			},
			validKommuner: known,
		},
	})
	process.exit(result.outcome === "refused" ? 2 : result.outcome === "stopped" ? 1 : 0)
} catch (err) {
	const known = err instanceof DiscoverError || err instanceof ReviewError || err instanceof CuratedWriteError
	console.error(known ? err.message : "review stopped on an unexpected error")
	process.exit(1)
}
```

In `pipeline/package.json`, add `"review": "node src/cli/review.ts",` after `"verify"`.

- [ ] **Step 7: Show it red once**

In `LineReader`'s `data` handler, change `this.#partial = parts.pop() ?? ""` to `this.#partial = ""` (so a last line without Enter becomes a line). Run `npx vitest run test/session.test.ts`: FAIL on "saves nothing for a key without Enter". Restore, run: PASS. Note it for the PR body.

- [ ] **Step 8: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add src/review/lines.ts src/review/session.ts src/cli/review.ts package.json test/session.test.ts
git commit -m "feat(pipeline): add the review walk-through: one item at a time, each answer saved at once"
```

---

### Task 19: Docs and the network boundary

**Files:**
- Modify: `pipeline/README.md`, `pipeline/test/fixtures/README.md`, `pipeline/test/networkBoundary.test.ts`

**Interfaces:**
- Consumes: the three new commands.
- Produces: nothing new in code.

- [ ] **Step 1: The boundary test covers every new file**

The boundary test already scans every `.ts` file under `src/` and `test/`. Add a test that proves the PR 3 folders are among them, so a folder moved out of `src/` can never slip past:

```ts
	it("scans the PR 3 folders and files", () => {
		const scanned = tsFiles(join(ROOT, "src")).map(rel)
		for (const dir of ["src/extract/", "src/curate/", "src/verify/", "src/review/", "src/xlsx/"]) {
			expect(scanned.some((f) => f.startsWith(dir)), dir).toBe(true)
		}
		for (const file of ["src/registers/nklm.ts", "src/text/hours.ts", "src/text/phone.ts", "src/text/names.ts", "src/cli/review.ts"]) {
			expect(scanned).toContain(file)
		}
	})
```

Run: `npx vitest run test/networkBoundary.test.ts`
Expected: PASS: no new file outside `src/net/` imports a network module or calls `fetch(`, and no test imports `src/net/http.ts` or a CLI.

- [ ] **Step 2: Rewrite the commands and privacy sections of `pipeline/README.md`**

Replace "So far: ..." and the "Commands" block with:

````markdown
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
npm run recall > ../.cache/recall.md    # discover against the 138-row answer key
```

`verify` and `review` need `--data <dir>`, a folder holding `curated/` and `lock/`. Until PR 4,
`verify` refuses the repo's own `data/`. `verify --nklm-fetch` fetches NKLM's legevakt list when
its page serves the licensed edition; otherwise `--nklm-file` names the file NKLM sent. A new
edition stops the NKLM step until its licence is recorded in `docs/licence-requests/README.md`.

## Review

`review` shows each open item with its quote, its source link and host, and the gate's reason.
Each answer is a key and Enter, written to the curated file at once (check it with `git diff`):

| Key | Does |
|---|---|
| a | accept the value as shown |
| r | reject it; the field is dropped |
| e | type my own value (and a role for a phone); the validity and safety gates check it first |
| s | skip, ask again next time |
| q or Ctrl+C | quit; every earlier answer is already saved |

For "include this unit?" the keys are y (then pick categories) and n (then type why). Page text
is stripped of control codes, escape sequences, bidi and zero-width characters before it is
shown. `NO_COLOR` turns colour off, and meaning never rests on colour.
````

Under "Privacy", add:

```markdown
- A role mobile keeps two quotes only, the role word and the number. Every other quote has its
  possible names replaced by `[navn]` before it is stored. Names are never stored.
- Extraction files (`<cache>/extract/`) hold page lines: cache only, never printed, never committed.
```

- [ ] **Step 3: List the new fixtures**

In `pipeline/test/fixtures/README.md`, add after the first paragraph:

```markdown
PR 3 adds `kontakt-heading.html`, `shared-page.html` and `test-box.html` (shapes every CMS
shares: headings, paragraphs, a box after `<main>`), one `<cms>-contact-box.html` or
`<cms>-hours-box.html` per CMS box recorded in `src/extract/cmsBoxes.ts`, and the
`.xlsx` workbooks the NKLM tests build in memory (`test/xlsxHelpers.ts`). All values are
fictional.
```

- [ ] **Step 4: Commit the docs**

```bash
npx biome ci . && npm test
git add README.md test/fixtures/README.md test/networkBoundary.test.ts
git commit -m "docs(pipeline): describe extract, verify and review, and keep the network boundary on the new folders"
```

---

### Task 20: Full suites, the trial run, then the PR

**Files:** none new. The trial run writes only to the cache folder and a temporary data folder.

- [ ] **Step 1: Every suite, from a clean state**

From `pipeline/`:

```bash
npx biome ci . && npm run typecheck && npm run lint && npm test && npm run data:check
```

From `web/` (a fresh worktree needs the install and the fixture data first, since prerender reads `public/data`):

```bash
npm ci
cp e2e/fixtures/data/*.json public/data/
npm test
npm run e2e
git status --short
```

Expected: every suite green, and `git status --short` shows no change to commit (if the copied fixture data shows up, it must not be staged: run `git checkout -- public/data` before going on). A failing suite blocks the PR: fix it, never skip it.

- [ ] **Step 2: The trial run, counts only**

Four pilot kommuner that do not block ClaudeBot, one per CMS where possible: Kongsvinger (3401, CorePublish), Lillehammer (3405, ACOS), Gjøvik (3407, ACOS) and Ringsaker (3411, Sitevision). Ask me for the path of the NKLM file first. From `pipeline/`, in the background (discover and fetch take a while: 5 seconds per request per host):

```bash
npm run discover -- --only 3401,3405,3407,3411
npm run fetch -- --only 3401,3405,3407,3411 --limit 20
npm run extract -- --only 3401,3405,3407,3411
TRIAL="$(mktemp -d)"
npm run verify -- --data "$TRIAL" --only 3401,3405,3407,3411 --nklm-file "<path to the NKLM file>"
```

Keep each printed summary for the PR body. They hold counts, kommune numbers, names, adapter names and reasons only. Then count the lock files' statuses, printing numbers only:

```bash
node -e '
const { readdirSync, readFileSync } = require("node:fs")
const dir = process.argv[1] + "/lock"
for (const f of readdirSync(dir)) {
	const lock = JSON.parse(readFileSync(dir + "/" + f, "utf8"))
	const c = { accepted: 0, review: 0, dropped: 0 }
	let unitsInReview = 0
	for (const u of lock.units) {
		const statuses = Object.values(u.fields).map((x) => x.status)
		for (const s of statuses) c[s]++
		if (statuses.includes("review") || u.inclusion?.status === "review") unitsInReview++
	}
	console.log(f.slice(0, 4), "units", lock.units.length, "in review", unitsInReview, JSON.stringify(c))
}' "$TRIAL"
```

Do not open, print or quote anything in `$TRIAL`, `.cache/extract/` or `.cache/pages/`. The counts are a first look at the review share; PR 4 owns the real measure against the 1-in-10 target. A high review share does not block this PR.

- [ ] **Step 3: Final checks over the whole branch**

From the repo root:

```bash
git diff --stat origin/main -- web api data
git diff origin/main --name-only | xargs grep -nP '\x{2014}|\x{2013}' || echo "no dashes"
git diff origin/main | grep -n "Kari" | grep -v "Kari Nordmann\|Kari Anne Nordmann\|Kari:" || echo "only the placeholder names"
git diff origin/main --name-only | grep -n "\.cache\|/tmp" || echo "no cache files"
grep -rn "<sha256 from Step 1>\|<dd.mm.yyyy>\|<legevakt name header>" pipeline/src pipeline/test && echo "a placeholder is left" || echo "no placeholders"
```

Expected: the first prints nothing; then `no dashes`, `only the placeholder names`, `no cache files` and `no placeholders`. The en dash in house-style hours is written `\u2013` in code, which the dash check does not match.

- [ ] **Step 4: Push and open the PR**

```bash
git push -u origin feat/pipeline-extract-verify-review
```

PR title: `feat(pipeline): extract, verify and review for the national data pipeline`

PR body:

````markdown
Extract, verify and review for the national data pipeline (spec
`docs/superpowers/specs/2026-10-28-varde-national-data-design.md` on `docs/national-data-spec`,
section "PR 3: extract, verify, review"). Extraction is rule-based: no AI model, no key, no page
text leaves the machine. Nothing goes into `data/`, and nothing the site shows changes.

## What is in it

- `src/extract/`: the page reader (adapter text plus CMS boxes outside `<main>`), the contact
  block (CMS box, else a Kontakt heading), and one rule per field: phone by the phone order
  (role mobiles keep only the role word and the number), email, website, address, name,
  opening hours (Nav data, CMS box or an Åpningstider heading) and the Lavterskel quotes.
- `src/text/`: dot-grouped phone numbers, the hours formatter into `kl. 13:00–18:00`, possible
  person names for redaction, and "1 A" read as Kartverket's "1A".
- `src/xlsx/` and `src/registers/nklm.ts`: NKLM's legevakt list, read with zip limits, by the
  licensed edition only. The licence answer is recorded in `docs/licence-requests/README.md`.
- `src/curate/` and `src/verify/`: matching pages to Brreg units, inclusion by rule or one
  question, the real `GateContext`, my decisions, and atomic lock and curated files.
- `src/review/` and `npm run review`: the terminal walk-through, with sanitised page text.
- Brreg's switchboard for the kommune's own record only, and a `binary` fetch kind.
- New runtime dependency, pinned: `fflate` <version> (MIT, no dependencies).

## Trial run

<the four summaries from Step 2, and the status counts>

## Checks shown red once

<one line per task: the break and the red result>

## CMS boxes

<per CMS: the box recorded and where it was checked, or "none found">
````

---

## Self-review (done while writing this plan)

1. **Spec coverage.** Every item of "PR 3: extract, verify, review" maps to a task: the three commands (Tasks 10, 16, 18), the contact block and CMS boxes (6), each field rule (7, 8, 9), the hours formatter (4), the shared-page rule (16), linear patterns and the 2,000-character skip (3, 7, 10), dot-grouped numbers and `quoteHasPhone` (3), mobiles and the phone order (7, 13, 16), person names (2, 7), email and website (8), address with "1 A" and the recorded rådhus answer (5, 8), hours sources, length and the "1-2 ganger" rule (4, 9), Lavterskel quotes (9), the review command, its keys, sanitising, `NO_COLOR`, Ctrl+C, the non-terminal refusal and `--kommune` (17, 18), how answers are stored and written (1, 16), errors per kommune and per page (10, 16), NKLM's fetch rule, edition stop, column check and zip limits (11, 12), the schema changes (1, 2), the dependency (11), the network boundary (19) and the checks before the PR (20). Every must-fail fixture the spec's "Testing" section lists is a named test: role-mobile lines with one, three-part and hyphenated names (Task 7), a landline next to a name (7), "ikke døgnåpen" and "døgnåpen i helgene" (7), `25.00`, `13.75` and "1-2 ganger" (4), a page two register units match (14, 16), the three-service page (6, 16), the 1 MB line (10), and each review-command case (17, 18).
2. **Placeholders.** Three values are filled from live evidence inside their tasks, by decision 5 and the spec's never-guess rules: the CMS boxes (Task 6, Steps 10 to 11), the NKLM columns, edition hash and file URL (Task 12, Step 1), and the recorded Kartverket answer (Task 5, Step 1). Each step says exactly how, and Task 20 Step 3 fails if a marker is left.
3. **Type consistency.** `Candidate.personNames`, `ExtractedCandidate`, `UnitGroup`, `Proposal`, `FieldItem` and `KommuneFiles` are defined once (Tasks 1, 2, 14, 16, 17) and used with the same fields after.
4. **Review Focus.** Each of the five lines has its test: Faks and "Telefon:" over the number (Task 7), house-style hours (Task 4), the same number twice (Task 7, and the whole page in Task 10), the hash mismatch (Task 10).

