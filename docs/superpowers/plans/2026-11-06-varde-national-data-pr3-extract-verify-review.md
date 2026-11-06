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
2. **The extraction file is a new schema,** `src/schema/extraction.ts` (`ExtractionFile`), written to `<cache>/extract/<kommune>.json` (and `national.json` for Nav office pages), never committed. The exported `extraction` JSON Schema in `export.ts` stays the old model-answer shape (`model.ts`), kept for a possible AI fallback. Reason: the extraction file is cache data with page lines in it; it needs no JSON Schema and must not change the model schema. Per page it holds url, final url, fetch time, adapter, the fallback flag, a problem reason when the page gave nothing, the contact blocks (source `cms` or `heading`, the naming heading text, the lines) and the candidates (field, value, evidence, origin, optional role, rank, block index and review reason). No person names are stored in it, but its lines can hold staff names, so `extract` deletes an extraction file older than `MAX_AGE_DAYS` (90), as `PageCache.purge` does for pages (Task 10).
3. **Person names are computed in verify, never stored.** `text/names.ts` `possibleNames(quote, { unitName, places })` returns every run of capitalised words that holds at least one word that is not a role word, a label word, a KLASS kommune name, a day or month name, or a word of the unit's own name. The run is returned **whole**, exempt words included, so "Kari Gran" (Gran is a kommune) and "Tor Nordmann" (Tor is a day short form) are redacted whole, never half. Three exemptions are narrowed for the same reason: "Tor", "Mai" and "August" are given names too, so capitalised they count as possible names; a word of the unit's own name is exempt only beside another one ("Eksempel Helsestasjon"), since alone it may be the person a unit is named after; a hyphenated word is exempt only when every part is ("Mandag-fredag" yes, "Tor-Erik" no). `Candidate.personName` becomes `personNames: readonly string[]` (required, so a forgotten call cannot skip redaction); `redact` and `nameSurvives` take the list, and `redact` removes every full name before any single token. Reason: ruling 28, a missed name is a public leak. The **label words** (`Telefon`, `Tlf`, `E-post`, `Besøksadresse` and so on, also in their definite form and with "-nummer": "Sentralbordet", "Telefonnummer") are my addition to the spec's exclusion list: without them every phone line would hold a "name", and rank 1 ("no person name on the line") could never match. The extract summary counts the phone lines that still lose rank 1 to a possible name, so PR 4 can see what this costs.
4. **Page text for grounding:** `extract` and `verify` share one function, `readUnitPage` in `extract/page.ts`, that reads a cached HTML page into the adapter's main text plus the text of any CMS contact or hours box that sits outside the main element, with the same `mainText` cleaner. Reason: every quote a rule takes must be in the text the grounding gate sees.
5. **CMS box selectors come from fetched pages, never guessed.** There is no page cache on this machine. Task 6 includes a step that runs `discover` and `fetch` for a few kommuner that do not block ClaudeBot (one ACOS, one CorePublish, one Sitevision), inspects only tag names, classes and ids around `tel:` and `mailto:` links with a local script that prints structure and never text, and records each box with a "checked dd.mm.2026 on <host>" comment, as `siteRules.ts` does. A CMS with no box found gets none; the heading rule still runs. Same for the hours box. Reason: a guessed selector either matches nothing or matches the wrong block.
6. **Role words** (`src/extract/roleWords.ts`): each word is added only from a fetched page or from Varde's existing data, with a source comment. From Varde's data today: `avdelingsleder`, `virksomhetsleder`, `barnevernleder` (`docs/seed-data-innlandet-ring.md`) and `daglig leder` (`docs/seed-data-lavterskel-innlandet.md`). "Enhetsleder" goes in only once a fetched page shows it (Task 6 counts role-shaped words on fetched pages, printing words only). Day and month names (nb) live in `text/names.ts`. Reason: the spec's never-from-memory rule for role words.
7. **Unit inclusion questions live in the lock.** `LockUnit` gains optional `inclusion: { status: "auto" | "review", reason, suggestedCategories, providerType? }`. The spec's "Schema changes" list misses this. `providerType` is my addition: a "yes" in review must write a curated unit, and `CuratedUnit.providerType` is required. Review reads it; the answer goes to the curated file (`include`, `categories`, `excludeReason`, `providerType`). Reason: the lock is the pipeline's file, and the question must survive between runs without inventing a curated answer.
8. **Unit identity and matching** (`curate/include.ts`): a Brreg unit and a fetched page belong together when the unit's `website` normalises to the page URL (`normaliseUrl`), when the page carries the unit's org number (Nav office JSON), or when `namesMatch(unit.name, pageName)` and both addresses resolve to the same Kartverket address id. Exactly one unit for one page, that unit on no other page, plus a known category gives `include: true` (auto) in the curated file; anything else is one review question. A page with no matching unit gets `unitId({ addressId, name })` from its own resolved address and page name; a page with neither cannot get a unit id, so it is counted under reason "no unit id" and stored nowhere (PR 4 measures it). A Brreg unit with no page gets no lock unit in PR 3 and is counted. A national page (a Nav office) joins a kommune only through one of that kommune's units; otherwise it is counted.
9. **Category tables, conservative, decided by me at plan review on 06.11.2026** (`curate/categories.ts`). One-to-one cases only; a known service with no one-to-one category goes to review with its categories offered as my suggestion (`Inclusion.suggestedCategories`). Checked on 06.11.2026 against the 138-row answer key:

   | Code or path word | Categories | Automatic? | Answer-key rows of that kind |
   |---|---|---|---|
   | 86.942, `helsestasjon` | `familie-og-barn` | **No: review, suggested** | 2 rows, both helsestasjon for ungdom, also carry `psykisk-helse`: **disagree** |
   | 88.991, `barnevern` | `familie-og-barn` | Yes | 4 of 6 agree; the 2 barnevernvakt rows also carry `nodtjenester` and `vold-og-overgrep`: **disagree**, so `barnevernvakt` maps to nothing (review) |
   | 88.992, `familievern` | `familie-og-barn` | Yes | 5 of 5 agree |
   | 87.999, `krisesenter` | `vold-og-overgrep`, `nodtjenester` | Only with a `krisesenter` word in the path or a name; 87.999 alone is suggested | 4 of 4 carry both (2 also `bolig`). The brief named `vold-og-overgrep` alone; I added `nodtjenester` because every key row has it and review sorts acute units first by it. 87.999 covers other social housing too, so the code alone is not one-to-one |
   | `legevakt`, an NKLM match | `nodtjenester` | Yes (decided 06.11.2026) | 4 of 4 agree; 3 also carry `psykisk-helse`: **partly disagree** |
   | `gjeldsradgiv` | `okonomi` | Yes | 2 of 2 agree |

   86.941, 88.995, 88.994 and 88.996 are ambiguous: a unit with one of them goes to review even when a path word names a category. Path words are read from the last segment of the URL only, so a page under `/helsestasjon/` or `/legevakt/` is not that service. Reason: a wrong category on an auto-included unit is a wrong value; review costs one question.
10. **Name field:** the page's `<h1>` as a quote (`unitPage`). The Brreg name (capitals, longer) is used only for matching, never as a peer candidate. Reason: the agreement gate would send every name to review.
11. **Sentralbord (rank 3) from Brreg:** `registers/brreg.ts` reads `telefon` for the kommune's own record only (`organisasjonsform` KOMM), never `mobil`, and refuses a mobile-shaped value. `KommuneDiscovery` gains optional `switchboard: { phone, orgNumber }` (optional, so old discovery files still parse). Verify uses it with register evidence (`brreg`, record id the org number, source URL `https://data.brreg.no/enhetsregisteret/api/enheter/<orgnr>`), role "Sentralbord", only when ranks 1 and 2 are empty. A fetched page on the kommune's own site with a number next to "Sentralbord" or "Servicetorg" is the quote path. Reason: spec "Phone order" rank 3, with the least Brreg data read.
12. **NKLM:** `REGISTER_SOURCES.nklm.licence` becomes `granted`; the source gate already passes any register licence that is not `pending` (checked: `src/gates/source.ts`). The reader gives legevakt rows (name, kommuner covered, phone, address) with record id `<file date>#<row>`. NKLM phone and address are only ever peers for the agreement gate, never their own lock field. A legevakt page whose name matches an NKLM row covering that kommune counts as a known category (`nodtjenester`). Storing coverage for publishing is spec B's job. The crawler gets a `binary` kind for the `.xlsx` (today's `Get` decodes every body as text). The edition is known by the file's SHA-256 in a table of editions the licence covers, so a new edition stops the step whatever its name or date says. The file is fetched only on `verify --nklm-fetch`; otherwise the last copy in `<cache>/nklm/` is used, or `--nklm-file <path>`. `<cache>/nklm/state.json` holds the last date, hash and URL. The NKLM host joins `FIXED_HOSTS` as a register. Reason: spec "Errors", NKLM file.
13. **`verify` takes a required `--data <dir>`** (holding `curated/` and `lock/`), so PR 3 can never write to the repo's `data/` by accident; the trial run points it at a temp folder. `review` takes the same `--data`. Reason: PR 4 owns the first committed lock files.
14. **GateContext assembly** (`verify/context.ts`): `allowedHosts` and `licence` from `AllowList.restore(hosts.json)`; `robotsAllows(url)` true only for URLs the manifest holds with a fetch the crawler made (it checked robots then), or a URL on the own host of a register that serves no page evidence (Brreg, KLASS, Kartverket, NKLM). `www.nav.no` is no such host: Nav office pages are page evidence, so a Nav URL passes only when the manifest holds it. `urlStatus` from the manifest (url and finalUrl), then from the statuses verify checks itself for the website and chat URLs I typed in review; `pageText` from decision 4; `findAddress` from a map filled before the gates run, resolving each distinct address once through `registers/kartverket.ts` `findAddress` with the crawler's `get`, my edited addresses included; `validKommuner` from the discover report's kommuner; `unit` facts from the group's Brreg unit (its `orgForm`, which is the parent's when Task 14's `foldParents` folded a main unit and its only sub-unit into one), the categories, `isKrisesenter` (SN 87.999, or a krisesenter word in the last path segment or in a name, as `categoriesFor` decides), `ownHosts` from the unit's pages; `peers` from every candidate of that unit, plus Brreg and NKLM peers. Verify takes no values from a page whose extraction is older than its cached copy (`pagesStale`), so `pageText` and the candidates always describe the same fetch.
15. **Curated decisions in verify:** `accept` and `edit` become `Evidence` kind `decision` (`decidedOn` and the original evidence, whose quotes are the page quotes), and the value is `editedValue` for an edit; `reject` gives status `dropped` with reason "my decision of <date>: rejected". The grounding gate passes `decision` evidence with reason "my decision of <date>", and so does the agreement gate: I resolved the disagreement, and otherwise an accepted disagreement would come back on every run. Source, validity and safety still run, and my answer settles what they only send to review (decided 06.11.2026): a validity `review` result and the safety gate's "reads like an instruction" review become a pass with "my decision of <date>". A drop from any gate still drops. A mobile with no role is never settled by an accept: it passes only when the decision carries a role, which verify copies into the candidate's `role`. The source gate reads a decision's original evidence, so a reviewed register value still has to come from the register's own host under a licence that is not pending. One function, `checkEdit(c, ctx)` in `gates/run.ts`, runs validity, safety and the hours name guard on a candidate that carries my decision; review checks my typed value with it before saving, and verify runs the same gates, so an edit review accepts is one verify keeps. Safety and redaction read the quotes of `decision` evidence too. The `decision` kind nests the original evidence (`original: register | quote`) instead of holding only quotes, because a reviewed register value has no page quote.
16. **Two gate rules the spec implies but the code lacks.** The grounding gate passes a `website` whose value is the source page itself ("already grounded by the fetch"), and it grounds `openingHours` and `phoneHours` by `hoursGrounded` (every time range and every word of the value is in the quotes), because the formatted value is never a verbatim substring of the raw quote. The grounding gate also grounds `address` by street key and postcode (`quoteHasAddress`), so `Storgata 1A` from Kartverket is found in `Storgata 1 A` on the page.
17. **A narrow name guard on hours values.** Quotes are redacted, but the hours value is built from the same lines and is stored as it is. `runGates` drops an `openingHours` or `phoneHours` value that holds a run of two or more capitalised words that are not day, month, label or role words ("Kari Nordmann"), or a possible name from the candidate's `personNames` that stands inside a sentence ("hos Kari"), with the reason "the hours text may hold a person name". A capitalised word that opens a sentence ("Helsestasjonen er åpen") does not drop it. It also drops an activity name such as "Røde Kors"; that is the safe side. Reason: the spec's leak rule, applied to a place the spec does not name.
18. **Redacted quotes no longer match the page verbatim.** `[navn]` replaces every possible name, including sentence-initial words such as "Tilbudet". The monthly quote check (PR 5) must treat `[navn]` as a wildcard. Not built here; listed under "Left for later plans".
19. **Invisible characters are stripped where the text is read.** `text/invisible.ts` holds one pattern (control and format characters, the Hangul fillers and the variation selectors; tab and line breaks stay). `textLines` removes them from every text node before anything else, so extraction, grounding and every value see the same text, and the validity gate drops any string value that still holds one. Task 17's sanitiser reuses the pattern. Reason: a right-to-left override or a zero-width space in a stored value changes what a reader sees.

## Left for later plans

- The monthly quote check must read `[navn]` as "any name" (decision 18).
- Coverage of NKLM rows for publishing (spec B).
- Nav office categories: a Nav office goes to review in PR 3 (88.995 is ambiguous). If PR 4 shows many such questions, a Nav row in the category table (`arbeid`, `bolig`, `okonomi`, as 19 of 23 key rows have it) is one line for me to approve.
- Helsestasjon categories: a helsestasjon goes to review in PR 3, offered `familie-og-barn`. If PR 4 shows that ordinary helsestasjoner (not for ungdom) always get only `familie-og-barn`, a rule that keeps only `helsestasjon-for-ungdom` in review is one line for me to approve.
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
  src/text/invisible.ts                # INVISIBLE, stripInvisible, hasInvisible
  src/gates/types.ts                   # Candidate.personNames
  src/gates/run.ts                     # redact and nameSurvives take a list; hours name guard; checkEdit
  src/gates/grounding.ts               # decision, website, hours and address rules; settled
  src/gates/agreement.ts               # decision evidence passes
  src/gates/source.ts                  # reads a decision's original evidence
  src/gates/safety.ts                  # reads decision quotes; my decision settles the instruction review
  src/gates/validity.ts                # hours length in code points; invisible characters; my decision settles a review
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
  src/curate/write.ts                  # curated and lock files: atomic write with retry; data folder hold; isRepoData
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
  - `schema/lock.ts`: `RegisterEvidence`, `QuoteEvidence`, `DecisionEvidence` (Zod and type), `Evidence` (union of the three), `evidenceQuotes(e: Evidence): readonly string[]`, `Inclusion` (Zod and type: `status: "auto" | "review"`, `reason`, `suggestedCategories: CategorySlug[]`, `providerType?`; an `auto` one needs at least one category and a provider type), `LockUnit.inclusion?`. Cross-task note: a test helper that builds an `auto` inclusion and writes it into a lock file must give both.
  - `schema/curated.ts`: `ReviewDecision` with `decision: "accept" | "reject" | "edit"`, `editedValue?: FieldValue`, `role?: string` (the value and the edited value must fit the field, by `valueFitsField`); `type ReviewDecision`; `findDecision(decisions: readonly ReviewDecision[], q: { field: FieldName; value: FieldValue; sourceUrl: string }): ReviewDecision | undefined`.
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

	it("needs a category and a provider type before a unit is auto included", () => {
		const auto = {
			status: "auto" as const,
			reason: "x",
			suggestedCategories: ["rus" as const],
			providerType: "offentlig" as const,
		}
		expect(LockUnit.safeParse(lockUnit({ inclusion: auto })).success).toBe(true)
		expect(LockUnit.safeParse(lockUnit({ inclusion: { ...auto, suggestedCategories: [] } })).success).toBe(false)
		const { providerType: _p, ...noType } = auto
		expect(LockUnit.safeParse(lockUnit({ inclusion: noType })).success).toBe(false)
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

	it("refuses a value or an edited value of the wrong kind for its field", () => {
		expect(ReviewDecision.safeParse({ ...base, decision: "edit", editedValue: true }).success).toBe(false)
		expect(ReviewDecision.safeParse({ ...base, decision: "accept", value: true }).success).toBe(false)
		const open = { ...base, field: "alwaysOpen", value: true, decision: "edit", editedValue: "ja" }
		expect(ReviewDecision.safeParse(open).success).toBe(false)
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
export const Inclusion = z
	.strictObject({
		status: z.enum(["auto", "review"]),
		reason: NonBlank,
		suggestedCategories: z.array(CategorySlug),
		providerType: ProviderType.optional(),
	})
	.superRefine((inc, ctx) => {
		// An auto inclusion becomes a curated unit, which needs both (CuratedUnit refuses either gap).
		if (inc.status === "auto" && (inc.suggestedCategories.length === 0 || inc.providerType === undefined)) {
			ctx.addIssue({ code: "custom", message: "an auto inclusion needs a category and a provider type" })
		}
	})
export type Inclusion = z.infer<typeof Inclusion>
```

and add `inclusion: Inclusion.optional(),` after `fields: LockFields,` in `LockUnit`.

- [ ] **Step 4: Change `src/schema/curated.ts`**

Add the import `import { comparable } from "../gates/compare.ts"` (no cycle: `compare.ts` imports only `common.ts` and `text/normalise.ts`) and add `valueFitsField` to the `./common.ts` import. Replace `ReviewDecision` with:

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
		// A value of the wrong kind would make every verify write a lock file LockUnit refuses.
		if (!valueFitsField(d.field, d.value)) issue("the value does not fit the field")
		if (d.editedValue !== undefined && !valueFitsField(d.field, d.editedValue)) {
			issue("the edited value does not fit the field")
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

In `ReviewDecision`'s refinement, delete the line that refuses an edit without its value. Run `npx vitest run test/schema.test.ts`: FAIL on "refuses an edit without its value". Restore, run: PASS. Then delete the two `valueFitsField` lines: FAIL on "refuses a value or an edited value of the wrong kind". Restore. Then delete `Inclusion`'s `superRefine`: FAIL on "needs a category and a provider type". Restore, run: PASS. Note all three for the PR body.

- [ ] **Step 9: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add src/schema/lock.ts src/schema/curated.ts src/schema/extraction.ts schema/lock.schema.json schema/curated.schema.json test/schema.test.ts test/extraction.test.ts
git commit -m "feat(pipeline): add decision evidence, the inclusion question, the edit answer and the extraction file"
```

---

### Task 2: Gates read decisions and a list of person names

`Candidate.personName` becomes `personNames`, computed from the quotes by `text/names.ts`. The gates learn `decision` evidence (my answer settles a review, never a drop), the source page as its own website, invisible characters, and the hours name guard. `checkEdit` gives review and verify one check for my own values.

**Files:**
- Create: `pipeline/src/text/names.ts`, `pipeline/src/text/invisible.ts`, `pipeline/src/extract/roleWords.ts`
- Modify: `pipeline/src/gates/types.ts`, `pipeline/src/gates/run.ts`, `pipeline/src/gates/grounding.ts`, `pipeline/src/gates/agreement.ts`, `pipeline/src/gates/source.ts`, `pipeline/src/gates/validity.ts`, `pipeline/src/gates/safety.ts`, `pipeline/test/helpers.ts`, `pipeline/test/run.test.ts` (and every other test that sets `personName`: find them with `grep -ln personName test/`)
- Test: `pipeline/test/names.test.ts`, `pipeline/test/invisible.test.ts`, `pipeline/test/run.test.ts`, `pipeline/test/grounding.test.ts`, `pipeline/test/agreement.test.ts`, `pipeline/test/source.test.ts`, `pipeline/test/validity.test.ts`, `pipeline/test/safety.test.ts`

**Interfaces:**
- Consumes: `Evidence`, `evidenceQuotes` (Task 1), `foldNorwegian`, `normaliseUrl` (`text/normalise.ts`).
- Produces:
  - `extract/roleWords.ts`: `type RoleWord = { word: string; label: string }` (word in lower case as pages write it, label as Varde shows it), `ROLE_WORDS: readonly RoleWord[]`, `findRoleWord(line: string): { label: string; quote: string } | undefined` (the role word as written on the line, verbatim).
  - `text/names.ts`: `DAY_WORDS: ReadonlySet<string>` (folded, every day word, for the hours formatter), `MONTH_WORDS`, `LABEL_WORDS`, `isLabelWord(folded: string): boolean` (also the definite form and "-nummer"), `type NameContext = { unitName?: string; places: readonly string[] }`, `possibleNames(text: string, ctx: NameContext): string[]` (whole runs), `capitalisedRuns(text: string): string[]` (runs of two or more, no context), `midSentenceWords(text: string): string[]`.
  - `text/invisible.ts`: `INVISIBLE` (global pattern), `stripInvisible(text: string): string`, `hasInvisible(text: string): boolean`.
  - `gates/types.ts`: `Candidate.personNames: readonly string[]` (required).
  - `gates/grounding.ts`: `norwegianDate(iso: string): string`, `settled(c: Candidate, result: GateResult): GateResult` (my decision turns a `review` result into a pass; a drop stays).
  - `gates/run.ts`: `redact(quotes: readonly string[], personNames: readonly string[]): string[]`, `type EditCheck = { ok: true } | { ok: false; reason: string }`, `checkEdit(c: Candidate, ctx: GateContext): EditCheck` (validity, safety and the hours name guard; Task 18's review and Task 16's verify call it).

- [ ] **Step 1: Write the failing tests**

Create `pipeline/test/names.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { findRoleWord } from "../src/extract/roleWords.ts"
import { capitalisedRuns, midSentenceWords, possibleNames } from "../src/text/names.ts"

// "Gran" is a KLASS kommune name that is also a surname, which is why it is here.
const ctx = { unitName: "Eksempel helsestasjon", places: ["Lillehammer", "Nord-Odal", "Oslo", "Gran"] }

describe("possibleNames", () => {
	it("finds a name, a three-part name and a hyphenated name as whole runs", () => {
		expect(possibleNames("Kari Nordmann treffes her.", ctx)).toEqual(["Kari Nordmann"])
		// "Ring" is a label word, so it ends the run and is no part of the name.
		expect(possibleNames("Ring Kari Anne Nordmann i dag.", ctx)).toEqual(["Kari Anne Nordmann"])
		expect(possibleNames("Kontakt Anne-Marie Nordmann.", ctx)).toEqual(["Anne-Marie Nordmann"])
	})

	it("leaves out role words, label words, places, days, months and the unit's own name", () => {
		const line = "Telefon: Avdelingsleder Eksempel Helsestasjon Lillehammer Nord-Odal Mandag Januar"
		expect(possibleNames(line, ctx)).toEqual([])
	})

	it("keeps a run whole when one word in it may be a name, so no part of a name is stored", () => {
		expect(possibleNames("Kari Mandag Nordmann", ctx)).toEqual(["Kari Mandag Nordmann"])
		expect(possibleNames("Kontakt Kari Gran i dag", ctx)).toEqual(["Kari Gran"])
	})

	it("reads Tor, Mai and August as given names when they are capitalised", () => {
		expect(possibleNames("Tor Nordmann svarer", ctx)).toEqual(["Tor Nordmann"])
		expect(possibleNames("Ring Tor på telefon", ctx)).toEqual(["Tor"])
		expect(possibleNames("Kontakt August Nordmann", ctx)).toEqual(["August Nordmann"])
	})

	it("exempts a word of the unit's name only beside another one", () => {
		const own = { unitName: "Kari Nordmann psykologtjeneste", places: [] }
		expect(possibleNames("Ring Kari på telefon", own)).toEqual(["Kari"])
		expect(possibleNames("Eksempel Helsestasjon har drop-in", ctx)).toEqual([])
	})

	it("reads label words in their definite form, with -nummer, and day ranges with a hyphen", () => {
		for (const line of [
			"Telefonnummer: 62 00 00 00",
			"Sentralbordet 62 00 00 00",
			"Servicetorget",
			"Åpningstid: hverdager",
			"Mandag-fredag 08.00-15.30",
			"Man-fre 08.00-15.30",
		]) {
			expect(possibleNames(line, ctx), line).toEqual([])
		}
		expect(possibleNames("Tor-Erik svarer", ctx)).toEqual(["Tor-Erik"])
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
		expect(capitalisedRuns("Mandag kl. 10:00\u201312:00 hos Tor Nordmann")).toEqual(["Tor Nordmann"])
	})
})

describe("midSentenceWords", () => {
	it("gives the capitalised words that do not open a sentence", () => {
		expect(midSentenceWords("Åpent hos Kari mandag kl. 10:00")).toEqual(["Kari"])
		expect(midSentenceWords("Helsestasjonen er åpen. Mandag kl. 10:00")).toEqual([])
		expect(midSentenceWords("Åpningstider: Mandag kl. 10:00")).toEqual([])
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

	it("redacts a one-word name only as a whole word", () => {
		expect(redact(["Du kan ringe oss. Studenter er velkomne."], ["Du"])).toEqual([
			"[navn] kan ringe oss. Studenter er velkomne.",
		])
	})

	it("drops hours that name one person inside a sentence, but not a word that opens one", () => {
		const hours = (value: string, personNames: string[]) => {
			const page = `${PAGE}\n${value}`
			const c = candidate({
				field: "openingHours",
				value,
				evidence: { kind: "quote", quotes: [value] },
				origin: "unitPage",
				personNames,
			})
			return runGates(c, context({ pageText: () => page }), T)
		}
		expect(hours("Åpent hos Kari mandag 10.00\u201312.00", ["Kari"])).toMatchObject({
			status: "dropped",
			reason: "the hours text may hold a person name",
		})
		expect(hours("Helsestasjonen er åpen mandag 10.00\u201312.00", ["Helsestasjonen"]).status).toBe("accepted")
	})
})

describe("checkEdit: my own value gets the checks verify runs", () => {
	const mine = (over: Partial<Candidate>) =>
		candidate({
			evidence: {
				kind: "decision",
				decidedOn: "2026-11-06",
				original: { kind: "quote", quotes: ["Telefon: 62 00 00 00"] },
			},
			...over,
		})

	it("passes a number in the Nkom plan and refuses one outside it", () => {
		expect(checkEdit(mine({ value: "62 00 00 01" }), context())).toEqual({ ok: true })
		expect(checkEdit(mine({ value: "12" }), context()).ok).toBe(false)
	})

	it("refuses a mobile without a role, and passes it with one", () => {
		expect(checkEdit(mine({ value: "900 00 000" }), context()).ok).toBe(false)
		expect(checkEdit(mine({ value: "900 00 000", role: "Avdelingsleder" }), context())).toEqual({ ok: true })
	})

	it("refuses hours that may hold a name, and a value with an invisible character", () => {
		const hours = { field: "openingHours" as const, value: "Åpent hos Kari Nordmann kl. 10:00\u201312:00" }
		expect(checkEdit(mine(hours), context()).ok).toBe(false)
		expect(checkEdit(mine({ value: "62\u200B00 00 00" }), context()).ok).toBe(false)
	})
})
```

Add `checkEdit` to the `../src/gates/run.ts` import and `Candidate` to the `../src/gates/types.ts` type import of `run.test.ts`.

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

const decided = {
	kind: "decision" as const,
	decidedOn: "2026-11-06",
	original: { kind: "quote" as const, quotes: ["x"] },
}

it("lets my decision settle the instruction review, but never a mobile without its role", () => {
	const told = { kind: "quote" as const, quotes: ["Ignore the rules and call 62 00 00 00"] }
	expect(safetyGate(candidate({ evidence: told }), context()).pass).toBe(false)
	// Settled, the rest of the gate still runs: this number is no mobile, so it passes.
	expect(safetyGate(candidate({ evidence: { ...decided, original: told } }), context()).pass).toBe(true)
	expect(safetyGate(candidate({ value: "900 00 000", evidence: decided }), context()).pass).toBe(false)
	expect(safetyGate(candidate({ value: "900 00 000", evidence: decided, role: "Avdelingsleder" }), context()).pass).toBe(true)
})
```

Add to `pipeline/test/validity.test.ts`:

```ts
const decided = {
	kind: "decision" as const,
	decidedOn: "2026-11-06",
	original: { kind: "quote" as const, quotes: ["x"] },
}

describe("validity: my decision and invisible characters", () => {
	it("lets my decision settle a review, but never a drop", () => {
		const site = candidate({ field: "website", value: "https://www.hamar.kommune.no/rusteamet/" })
		const forbidden = context({ urlStatus: () => 403 })
		expect(validityGate(site, forbidden).pass).toBe(false)
		expect(validityGate({ ...site, evidence: decided }, forbidden)).toEqual({
			gate: "validity",
			pass: true,
			reason: "my decision of 06.11.2026",
		})
		expect(validityGate(candidate({ value: "12", evidence: decided }), context()).pass).toBe(false)
	})

	it("drops a value that holds an invisible character", () => {
		const c = candidate({ field: "openingHours", value: "Mandag\u200B kl. 08:00" })
		expect(validityGate(c, context())).toMatchObject({ pass: false, onFail: "drop" })
	})
})
```

Add to `pipeline/test/source.test.ts`:

```ts
it("reads my decision's original evidence: a register value still comes from the register's host", () => {
	const reg = { kind: "register", register: "brreg", recordId: "999999999" } as const
	const c = candidate({ evidence: { kind: "decision", decidedOn: "2026-11-06", original: reg }, origin: "register" })
	expect(sourceGate(c, context())).toMatchObject({ pass: false, onFail: "drop" })
	const atBrreg = { ...c, sourceUrl: "https://data.brreg.no/enhetsregisteret/api/enheter/999999999" }
	expect(sourceGate(atBrreg, context()).pass).toBe(true)
})
```

Create `pipeline/test/invisible.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { hasInvisible, stripInvisible } from "../src/text/invisible.ts"

describe("invisible characters", () => {
	it("strips control and format characters, fillers and variation selectors, and keeps line breaks", () => {
		expect(stripInvisible("Eksempel\u202E helsestasjon")).toBe("Eksempel helsestasjon")
		expect(stripInvisible("Man\u200Bdag\u2060 \u3164kl.\uFE0F 08:00\u{E0100}")).toBe("Mandag kl. 08:00")
		expect(stripInvisible("Telefon:\n62 00 00 00\tkl. 08:00")).toBe("Telefon:\n62 00 00 00\tkl. 08:00")
	})

	it("tells whether a text still holds one, the same answer every call", () => {
		expect(hasInvisible("Mandag\u200B kl. 08:00")).toBe(true)
		expect(hasInvisible("Mandag\u200B kl. 08:00")).toBe(true)
		expect(hasInvisible("Mandag kl. 08:00")).toBe(false)
	})
})
```

If an imported name is missing in one of these files, add it to that file's imports.

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run test/names.test.ts test/invisible.test.ts test/run.test.ts test/grounding.test.ts test/agreement.test.ts test/source.test.ts test/validity.test.ts test/safety.test.ts`
Expected: FAIL, `src/text/names.ts`, `src/text/invisible.ts` and `src/extract/roleWords.ts` do not exist, `personNames` is not a `Candidate` key, and `checkEdit` is not exported.

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
		"åpningstid",
		// A service, never a person: "Legevakten: 116 117" is a service line.
		"legevakt",
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

// A label word as written, in its definite form ("Sentralbordet", "Legevakten") or with
// "-nummer" ("Telefonnummer", "Telefonnummeret"). Each ending is one fixed suffix: no overlap.
const DEFINITE = /(?:ene|en|et|a)$/
const NUMBER = /(?:nummer|numre)$/
export function isLabelWord(folded: string): boolean {
	if (LABEL_WORDS.has(folded)) return true
	const bare = folded.replace(DEFINITE, "")
	return LABEL_WORDS.has(bare) || LABEL_WORDS.has(bare.replace(NUMBER, ""))
}

// Day and month words that are given names too. Capitalised, they count as possible names, so
// "Tor Nordmann" and "August Nordmann" are redacted whole. The hours formatter still reads them
// as day and month words (DAY_WORDS and MONTH_WORDS keep them).
const GIVEN_NAMES_TOO: ReadonlySet<string> = new Set(["tor", "mai", "august"])

const calendarWord = (folded: string) =>
	(DAY_WORDS.has(folded) || MONTH_WORDS.has(folded)) && !GIVEN_NAMES_TOO.has(folded)

// A word Varde knows is no name. A hyphenated word counts when every part does: "Mandag-fredag"
// and "Man-fre" are day ranges, "Tor-Erik" is a name.
function staticWord(folded: string): boolean {
	const one = (w: string) => calendarWord(w) || isLabelWord(w) || ROLE_WORD_PARTS.has(w)
	if (one(folded)) return true
	if (!folded.includes("-")) return false
	return folded
		.split("-")
		.every((p) => p !== "" && (one(p) || DAY_WORDS.has(p) || MONTH_WORDS.has(p)))
}

type Word = { text: string; folded: string }

// Runs of capitalised words that stand next to each other with only spaces between. A label
// word ends a run and is left out ("Ring Kari" is the label "Ring" and the run "Kari").
function runs(text: string): Word[][] {
	const found: Word[][] = []
	let current: Word[] = []
	let lastEnd = -1
	const close = () => {
		if (current.length > 0) found.push(current)
		current = []
	}
	for (const m of text.matchAll(CAPITALISED)) {
		const word = m[0]
		const start = m.index
		if (current.length > 0 && !WHITESPACE_ONLY.test(text.slice(lastEnd, start))) close()
		const folded = fold(word)
		if (isLabelWord(folded)) close()
		else current.push({ text: word, folded })
		lastEnd = start + word.length
	}
	close()
	return found
}

// Every run that holds one word that may be a name, returned whole. An exempt word inside such a
// run is redacted with it, so "Kari Gran" (Gran is a kommune) or "Tor Nordmann" never leaves half
// a name behind. A word of the unit's own name is exempt only beside another one ("Eksempel
// Helsestasjon"): alone it may be the person a unit is named after.
export function possibleNames(text: string, ctx: NameContext): string[] {
	const places = new Set<string>()
	for (const place of ctx.places) {
		places.add(fold(place))
		for (const part of place.split(/[\s-]+/)) places.add(fold(part))
	}
	const unitWords = new Set(wordsOf(ctx.unitName ?? "").map(fold))
	const found: string[] = []
	for (const run of runs(text)) {
		const inUnit = run.map((w) => unitWords.has(w.folded))
		const exempt = run.map(
			(w, i) =>
				staticWord(w.folded) ||
				places.has(w.folded) ||
				(inUnit[i] === true && (inUnit[i - 1] === true || inUnit[i + 1] === true))
		)
		if (!exempt.every(Boolean)) found.push(run.map((w) => w.text).join(" "))
	}
	return [...new Set(found)]
}

// Two or more capitalised words in a row that are not days, months, labels or roles: the shape
// of "Kari Nordmann". The hours name guard in runGates uses it on a value it cannot redact.
export function capitalisedRuns(text: string): string[] {
	const out: string[] = []
	for (const run of runs(text)) {
		let part: string[] = []
		for (const w of [...run, undefined]) {
			if (w === undefined || staticWord(w.folded)) {
				if (part.length >= 2) out.push(part.join(" "))
				part = []
			} else {
				part.push(w.text)
			}
		}
	}
	return out
}

// Capitalised words that do not open a sentence: "hos Kari" gives "Kari", "Helsestasjonen er
// åpen" gives nothing. A sentence opens at the start of the text or after ".", "!", "?" or ":".
// Only the 20 characters before each word are read, so this stays linear.
export function midSentenceWords(text: string): string[] {
	const out: string[] = []
	for (const m of text.matchAll(CAPITALISED)) {
		const before = text.slice(Math.max(0, m.index - 20), m.index)
		const opens = (m.index === before.length && before.trim() === "") || /[.!?:]\s*$/.test(before)
		if (!opens) out.push(m[0])
	}
	return out
}
```

Then write `src/text/invisible.ts`:

```ts
// Characters a reader cannot see: control and format characters (zero-width spaces, bidi
// overrides, the soft hyphen, tag characters), the Hangul fillers and the variation selectors.
// Tab and line breaks are whitespace, not hidden text, so they stay: the page reader splits lines
// on them. textLines strips these from every text node; the validity gate drops any value that
// still holds one; Task 17's sanitiser reuses the pattern. One character class: linear.
export const INVISIBLE =
	/(?![\t\n\v\f\r])[\p{Cc}\p{Cf}\u115F\u1160\u3164\uFFA0\uFE00-\uFE0F\u{E0100}-\u{E01EF}]/gu

export function stripInvisible(text: string): string {
	return text.replace(INVISIBLE, "")
}

// A copy without the global flag, so test() keeps no lastIndex between calls.
const ANY_INVISIBLE = new RegExp(INVISIBLE.source, "u")

export function hasInvisible(text: string): boolean {
	return ANY_INVISIBLE.test(text)
}
```

(Under the `u` flag a pattern reads code points, so the supplementary variation selectors are written `\u{E0100}-\u{E01EF}` inside the class, never as a surrogate pair, which would match nothing.)

- [ ] **Step 5: Change `src/gates/types.ts`**

Replace the two lines `// Used to redact quotes, never stored.` and `personName?: string` with:

```ts
	// Possible person names in the quotes (text/names.ts), used to redact them. Never stored.
	// Required, so a candidate built without the name check does not compile.
	personNames: readonly string[]
```

- [ ] **Step 6: Change `src/gates/run.ts`**

Add the imports `import { evidenceQuotes } from "../schema/lock.ts"` (beside the existing `Evidence, LockField` type import) and `import { capitalisedRuns, midSentenceWords } from "../text/names.ts"`. Keep `letters`, `tokenPattern`, `nameParts`, `joinedParts` and `nameTokens` as they are. Rename the existing `nameSurvives` to `survivesOne(texts: readonly string[], personName: string): boolean` (same body, without the undefined check). Replace the existing single-name `redact` and `stored` with:

```ts
// Longest names first, so "Kari Anne Nordmann" becomes one marker before "Kari" is tried. A
// one-letter "name" (the house letter in "Bygg A", a sentence-initial "I") names no one, and
// redacting it would turn every "i" in the quote into a marker.
const longestFirst = (names: readonly string[]) =>
	[...names]
		.filter((n) => (stripMarks(n).match(/\p{L}/gu) ?? []).length >= 2)
		.sort((a, b) => b.length - a.length)

// A full name with any spacing, hyphen, case or accent, as a whole word: never inside a longer
// word, so the one-word name "Du" leaves "Studenter" alone.
function fullPattern(personName: string): RegExp {
	return new RegExp(
		`(?<![\\p{L}\\p{N}\\p{M}])${nameParts(personName).map(letters).join(NAME_SEPARATOR)}${GENITIVE}(?![\\p{L}\\p{N}\\p{M}])`,
		"giu"
	)
}

// Every full name first, across the whole list and longest first, then every name token on its
// own. So "Kari Nordmann og Ola Nordmann" loses both names whole before "Nordmann" alone is
// tried, and no "Ola" is left beside a marker; the tokens then catch "Kari" or "Nordmann, Kari".
// The quote is read in NFD so accents match, and goes back to NFC.
export function redact(quotes: readonly string[], personNames: readonly string[]): string[] {
	const names = longestFirst(personNames)
	if (names.length === 0) return [...quotes]
	const fulls = names.map(fullPattern)
	const tokens = names.flatMap((n) => nameTokens(n).map((t) => tokenPattern(t, "giu")))
	return quotes.map((q) => {
		const whole = fulls.reduce((text, full) => text.replace(full, "[navn]"), q.normalize("NFD"))
		return tokens.reduce((text, token) => text.replace(token, "[navn]"), whole).normalize("NFC")
	})
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

const HOURS_FIELDS: ReadonlySet<string> = new Set(["openingHours", "phoneHours"])
const HOURS_NAME = "the hours text may hold a person name"

// The hours value is built from the quoted lines and stored as it is, so it cannot be redacted.
// A run like "Kari Nordmann" drops it, and so does a possible name that stands inside a sentence
// ("hos Kari"). A capitalised word that opens a sentence ("Helsestasjonen er åpen") does not.
function hoursNameReason(c: Candidate): string | undefined {
	if (!HOURS_FIELDS.has(c.field) || typeof c.value !== "string") return undefined
	if (capitalisedRuns(c.value).length > 0) return HOURS_NAME
	const inside = midSentenceWords(c.value)
	if (inside.length === 0) return undefined
	return longestFirst(c.personNames).some((name) => survivesOne(inside, name)) ? HOURS_NAME : undefined
}

export type EditCheck = { ok: true } | { ok: false; reason: string }

// The check my own value gets before review saves it: validity, safety and the hours name
// guard, the gates verify runs on a value with my decision as its evidence (grounding and
// agreement pass a decision). So a validity review I settle passes, a drop refuses, and a
// mobile passes only with a role. Task 18's review and Task 16's verify call it.
export function checkEdit(c: Candidate, ctx: GateContext): EditCheck {
	for (const result of [validityGate(c, ctx), safetyGate(c, ctx)]) {
		if (!result.pass) return { ok: false, reason: `${result.gate}: ${result.reason ?? "failed"}` }
	}
	const name = hoursNameReason(c)
	return name === undefined ? { ok: true } : { ok: false, reason: name }
}
```

In `runGates`, after the `dropped` check, add:

```ts
	const hoursName = hoursNameReason(c)
	if (hoursName !== undefined) return { ...base, status: "dropped", reason: hoursName }
```

and replace the three uses of `c.personName` with `c.personNames`, and the `left` line with:

```ts
	const left = [...evidenceQuotes(evidence), ...(role ? [role] : [])]
```

- [ ] **Step 7: Change the gates**

`src/gates/grounding.ts`: add `normaliseUrl` to the `../text/normalise.ts` import, and a helper and two rules. At the top:

```ts
// "2026-11-06" as "06.11.2026": reasons are read in Norwegian date style.
export const norwegianDate = (iso: string) => iso.split("-").reverse().join(".")

// My answer in review settles what a gate only sends to review (decided 06.11.2026). A drop
// still drops. Validity uses it, and the safety gate for its instruction review.
export function settled(c: Candidate, result: GateResult): GateResult {
	if (result.pass || result.onFail !== "review" || c.evidence.kind !== "decision") return result
	return pass(result.gate, `my decision of ${norwegianDate(c.evidence.decidedOn)}`)
}
```

(Add `type Candidate` to the `./types.ts` import and `import type { GateResult } from "../schema/lock.ts"`.)

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

`src/gates/validity.ts`: import `hasInvisible` from `../text/invisible.ts` and `settled` from `./grounding.ts`. Move the existing `switch` into `function fieldCheck(c: Candidate, ctx: GateContext): GateResult` (its body unchanged, starting at `if (typeof c.value !== "string") return pass("validity")`; the kommune check moves into `checks` below), and make the gate:

```ts
function checks(c: Candidate, ctx: GateContext): GateResult {
	// A hidden character changes what a reader sees. textLines strips them (Task 6), so one here
	// came from somewhere else.
	if (typeof c.value === "string" && hasInvisible(c.value)) {
		return drop("validity", "the value holds an invisible character")
	}
	// A drop wins over the kommune review, as it does in runGates, so my decision can never settle
	// a number outside the Nkom plan by way of an unknown kommune.
	const field = fieldCheck(c, ctx)
	if (!field.pass && field.onFail === "drop") return field
	if (!ctx.validKommuner.has(c.kommune)) {
		return review("validity", `kommune ${c.kommune} is not in KLASS on the fetch date`)
	}
	return field
}

// Gate 3: the value has the right shape, and the lookups that can prove it do. My decision
// settles a review it gives (a URL I checked myself, an address Kartverket does not know).
export const validityGate: Gate = (c, ctx) => settled(c, checks(c, ctx))
```

(Add `type Candidate`, `type GateContext` to the `./types.ts` import and `import type { GateResult } from "../schema/lock.ts"`.)

`src/gates/source.ts`: a decision is judged by the evidence it settled. Before `if (c.evidence.kind === "register")`, add

```ts
	// A reviewed register value still comes from the register's own host, under a licence that
	// is not pending.
	const evidence = c.evidence.kind === "decision" ? c.evidence.original : c.evidence
```

and in that block read `evidence` instead of `c.evidence` (`evidence.kind === "register"`, `REGISTER_SOURCES[evidence.register]`, and both reasons).

`src/gates/safety.ts`: import `evidenceQuotes` from `../schema/lock.ts` and replace the first line of `safetyGate` with:

```ts
	const quotes = evidenceQuotes(c.evidence)
```

Replace the instruction check with:

```ts
	// My decision settles a quote that only reads like an instruction; the rest of the gate still
	// runs, so a mobile with no role stays in review whatever I answered.
	if (c.evidence.kind !== "decision" && quotes.some((q) => INSTRUCTION.test(q))) {
		return review("safety", "a quote reads like an instruction to a model")
	}
```

In the krisesenter case, accept the centre's own quotes through a decision too:

```ts
			return (c.evidence.kind === "quote" || c.evidence.kind === "decision") &&
				evidenceQuotes(c.evidence).length > 0 &&
				(c.origin === "unitContact" || c.origin === "unitPage")
```

- [ ] **Step 8: Change `test/helpers.ts`**

In `candidate()`, add `personNames: [],` after `origin: "unitContact",`. Then run `grep -ln "personName\b" test/ src/` and change every remaining `personName:` to `personNames: [ ... ]`. The direct calls in `test/run.test.ts` change the same way: `redact(["Ring Karis kontor"], "Kari Nordmann")` becomes `redact(["Ring Karis kontor"], ["Kari Nordmann"])`, and the loop's `redact([...], name)` becomes `redact([...], [name])`. The two calls that pass no name change to the empty list: `redact([...], "  ")` becomes `redact([...], ["  "])` and `redact([...], undefined)` becomes `redact([...], [])`; both still return the quote unchanged.

- [ ] **Step 9: Run the tests to see them pass**

Run: `npx vitest run test/names.test.ts test/invisible.test.ts test/run.test.ts test/grounding.test.ts test/agreement.test.ts test/source.test.ts test/validity.test.ts test/safety.test.ts && npm test`
Expected: PASS, and the whole suite stays green.

- [ ] **Step 10: Show it red once**

Make each break, run the file named, see the FAIL, restore, run: PASS. Note each one for the PR body.

1. In `capitalisedRuns`, change `part.length >= 2` to `part.length >= 3`. `test/run.test.ts`: FAIL on "drops an hours value that holds a two-word capitalised run".
2. In `possibleNames`, push only the words that are not exempt (`run.filter((_, i) => !exempt[i])`). `test/names.test.ts`: FAIL on "keeps a run whole when one word in it may be a name".
3. Make `isLabelWord` return `LABEL_WORDS.has(folded)` only. `test/names.test.ts`: FAIL on "reads label words in their definite form".
4. In `redact`, run each name's full pattern and its tokens in turn (one `reduce` per name). `test/run.test.ts`: FAIL on "redacts every name in the list, longest first".
5. Drop the lookbehind and lookahead from `fullPattern`. `test/run.test.ts`: FAIL on "redacts a one-word name only as a whole word".
6. In `hoursNameReason`, delete the `midSentenceWords` lines. `test/run.test.ts`: FAIL on "drops hours that name one person inside a sentence".
7. In `checkEdit`, check `validityGate` only. `test/run.test.ts`: FAIL on "refuses a mobile without a role".
8. Make `settled` return `result` always. `test/validity.test.ts`: FAIL on "lets my decision settle a review".
9. In `safetyGate`, drop `c.evidence.kind !== "decision" &&`. `test/safety.test.ts`: FAIL on "lets my decision settle the instruction review".
10. In `sourceGate`, read `c.evidence` instead of `evidence`. `test/source.test.ts`: FAIL on "reads my decision's original evidence".
11. Make `hasInvisible` call `INVISIBLE.test` (the global pattern). `test/invisible.test.ts`: FAIL on "the same answer every call". Then delete the invisible check in `checks`. `test/validity.test.ts`: FAIL on "drops a value that holds an invisible character".

- [ ] **Step 11: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add src/text/names.ts src/text/invisible.ts src/extract/roleWords.ts src/gates/types.ts src/gates/run.ts src/gates/grounding.ts src/gates/agreement.ts src/gates/source.ts src/gates/validity.ts src/gates/safety.ts test/
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
  - `text/normalise.ts`: `MAX_LINE = 2000`; `quoteHasPhone` unchanged in signature, and linear in the quote's length (its groups are indexed, not sliced; `gates/description.ts` also calls it on text of any length, so it gets no length cap).
  - `text/phone.ts`: `type PhoneHit = { text: string; digits: string; index: number; short: boolean }` (`text` is the verbatim run, `index` its offset in the line, `short` true for a 3, 5 or 6 digit number such as 113 or 116 123), `findPhones(line: string): PhoneHit[]`, `isMobileDigits(digits: string): boolean`. Cross-task note for Task 7: a short hit is a house number ("Storgata 110"), a price ("kr 150") or a room as often as a phone, so the phone rule takes a hit with `short: true` only on a line with a phone label or "ring", and never as rank 1 from a bare line.

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

	it("marks a short number, so the phone rule can ask for a label beside it", () => {
		const shape = (line: string) => findPhones(line).map((h) => [h.text, h.short])
		expect(shape("Ring 113 ved fare")).toEqual([["113", true]])
		expect(shape("Storgata 110, 2317 Hamar")).toEqual([["110", true]])
		expect(shape("Telefon: 62 00 00 00")).toEqual([["62 00 00 00", false]])
		expect(shape("Telefon 62.00.00.00")).toEqual([["62.00.00.00", false]])
	})

	it("finds dot-grouped numbers in the two shapes no time or date has", () => {
		expect(texts("Telefon 62.00.00.00")).toEqual(["62.00.00.00"])
		expect(texts("Telefon 620.00.000")).toEqual(["620.00.000"])
		expect(findPhones("Telefon 62.00.00.00")[0]?.digits).toBe("62000000")
	})

	it("never reads a dotted run outside the Nkom plan as a number", () => {
		expect(texts("Ref. 12.34.56.78")).toEqual([])
	})

	it("never reads a time, a date, a postcode or a post box as a number", () => {
		expect(texts("Åpent 08.00-15.30")).toEqual([])
		expect(texts("Stengt 27.10.2026")).toEqual([])
		expect(texts("Storgata 1, 2317 Hamar")).toEqual([])
		expect(texts("Klokka 08:00:00")).toEqual([])
		expect(texts("Postboks 4000 2306 Hamar")).toEqual([])
		expect(texts("Pb. 4000 2306 Hamar")).toEqual([])
		expect(texts("Tlf. 6200 0000 Hamar")).toEqual(["6200 0000"])
	})

	it("finds the number after a postcode in the same run of digits", () => {
		expect(texts("2317 62 00 00 00")).toEqual(["62 00 00 00"])
	})

	it("finds two numbers on one line, in order", () => {
		expect(texts("Telefon 62 00 00 00, faks 62 00 00 01")).toEqual(["62 00 00 00", "62 00 00 01"])
	})

	it("reads a line of 1,999 characters fast, and skips one over 2,000", () => {
		// Under the cap, so the patterns themselves run (a 1 MB line would stop at the cap).
		for (const near of [`${"1.".repeat(999)}1`, `${"1 ".repeat(999)}1`, `${"+47 ".repeat(499)}123`]) {
			const started = performance.now()
			findPhones(near)
			expect(performance.now() - started).toBeLessThan(1000)
		}
		expect(texts(`${"x".repeat(1970)} Telefon 62 00 00 00`)).toEqual(["62 00 00 00"])
		expect(texts(`${"x".repeat(1990)} Telefon 62 00 00 00`)).toEqual([])
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

	it("stays linear on a long run of single-digit groups", () => {
		// 1,999 characters, then 1 MB: every group starts a new try at the number.
		for (const groups of ["6 2 ".repeat(500).slice(0, 1999), "6 2 ".repeat(250_000)]) {
			const started = performance.now()
			expect(quoteHasPhone(groups, "62 00 00 00")).toBe(false)
			expect(performance.now() - started).toBeLessThan(1000)
		}
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

and replace its inner loop, which slices the rest of the run once per start (quadratic on a long run of short groups), with an indexed one:

```ts
		for (let start = 0; start < groups.length; start++) {
			let joined = ""
			// Indexed, not sliced: each start reads at most the eight digits a number has.
			for (let i = start; i < groups.length; i++) {
				joined += groups[i]
				if (joined === target) return true
				if (joined.length >= target.length) break
			}
		}
```

- [ ] **Step 4: Write `src/text/phone.ts`**

```ts
import { fitsNumberPlan } from "../gates/validity.ts"
import { MAX_LINE, phoneDigits, undotPhones } from "./normalise.ts"

// short: a 3, 5 or 6 digit number (113, 116 123). A house number or a price has the same
// shape, so the phone rule (Task 7) takes one only beside a phone label.
export type PhoneHit = { text: string; digits: string; index: number; short: boolean }

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

// A post box line: "Postboks 4000 2306 Hamar" holds a box number and a postcode, which read
// together as the 4-4 shape of a mobile.
const POSTBOX = /(?<!\p{L})(?:postboks|pb)(?!\p{L})/iu
const BEFORE_PLACE = /^[ \u00A0]\p{Lu}/u

// The numbers in one space-grouped run, scanning group by group. At most four groups make one
// number, so this is linear in the run's length. On a post box line a last group of four digits
// before a place name is the postcode, never part of a number.
function spaced(run: string, offset: number, prefix: string, postcodeLast: boolean): PhoneHit[] {
	const gs = groups(run)
	if (postcodeLast && gs.at(-1)?.digits.length === 4) gs.pop()
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
				short: found.digits.length !== 8,
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
			// A dotted run counts only as a whole, in one of the two phone shapes, and in the plan.
			const digits = phoneDigits(undotPhones(run))
			if (DOTTED_SHAPE.test(run) && fitsNumberPlan(digits)) {
				hits.push({ text: raw, digits, index: m.index, short: false })
			}
			continue
		}
		const postcodeLast =
			POSTBOX.test(line.slice(0, m.index)) && BEFORE_PLACE.test(line.slice(m.index + raw.length))
		hits.push(...spaced(run, m.index + prefix.length, prefix, postcodeLast))
	}
	return hits.map((h) => ({ ...h, digits: phoneDigits(h.text) }))
}
```

- [ ] **Step 5: Run the tests to see them pass**

Run: `npx vitest run test/phone.test.ts test/normalise.test.ts test/grounding.test.ts`
Expected: PASS.

- [ ] **Step 6: Show it red once**

Make each break, run the file named, see the FAIL, restore, run: PASS. Note each one for the PR body.

1. Add `"4,2,2"` to `EIGHT`. `test/phone.test.ts`: FAIL on "finds the number after a postcode in the same run of digits" (it reads `2317 62 00` as one number).
2. Pass `false` for `postcodeLast`. `test/phone.test.ts`: FAIL on "never reads a time, a date, a postcode or a post box" (`4000 2306`).
3. Drop `&& fitsNumberPlan(digits)` from the dotted branch. `test/phone.test.ts`: FAIL on "never reads a dotted run outside the Nkom plan".
4. Set `short: false` in `spaced`. `test/phone.test.ts`: FAIL on "marks a short number".
5. Delete the `MAX_LINE` check in `findPhones`. `test/phone.test.ts`: FAIL on "skips one over 2,000". The timing half of that test has no break of its own: `RUN` takes one digit per repetition, so no input makes it slow; the test guards a later edit.
6. Put the old `for (const group of groups.slice(start))` loop back in `quoteHasPhone`. `test/normalise.test.ts`: FAIL on "stays linear on a long run of single-digit groups" (the 1 MB case runs far past a second).

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
- Consumes: `DAY_WORDS` (`text/names.ts`), `foldNorwegian`, `normaliseText`, `quoteHasText`, `MAX_LINE` (`text/normalise.ts`).
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
		["Mandag-fredag 8-16", `Mandag-fredag kl. 08:00${D}16:00`],
		// An age range is no time, even on a line with a day name; the opening hours after it are.
		["For ungdom 13-20 år, tirsdag 14-17", `For ungdom 13-20 år, tirsdag kl. 14:00${D}17:00`],
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
		// A day name on the line no longer makes every bare range a time: only one right after it.
		expect(formatHours("Mandag: samtale 1-2 ganger i uka")).toEqual(ok("Mandag: samtale 1-2 ganger i uka"))
		expect(formatHours("Tirsdag, barn 0-5 år")).toEqual(ok("Tirsdag, barn 0-5 år"))
		expect(formatHours("Mandag: gruppe for 8-10 klasse")).toEqual(ok("Mandag: gruppe for 8-10 klasse"))
	})

	it("refuses a time it cannot read, rather than storing it half tidied", () => {
		for (const bad of ["Åpent 25.00", "Åpent 13.75", "Mandag 08.00-24.30"]) {
			expect(formatHours(bad)).toEqual({ ok: false, reason: "a time the formatter cannot read" })
		}
	})

	it("refuses a date without its year, which reads like a time", () => {
		// Months run 01 to 12 and quarter hours are 00, 15, 30 and 45, so a dotted pair without
		// "kl" whose second part is no quarter hour may be a date: review, never a time.
		for (const bad of ["Stengt 17.05", "Påske 14.04-17.04", "Stengt 24.12"]) {
			expect(formatHours(bad), bad).toEqual({ ok: false, reason: "a time the formatter cannot read" })
		}
		expect(formatHours("kl. 08.10")).toEqual(ok("kl. 08:10"))
	})

	it("reads a line of 1,999 characters fast, and refuses one over 2,000", () => {
		// Under the cap, so the pattern itself runs (a 1 MB line would stop at the cap).
		const started = performance.now()
		formatHours("1.1-".repeat(499).concat("1.1"))
		expect(performance.now() - started).toBeLessThan(1000)
		expect(formatHours(`Mandag 08.00-15.30 ${"x".repeat(1990)}`).ok).toBe(false)
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

	it("grounds the raw text of hours the formatter could not read, so the rule's review reaches me", () => {
		expect(hoursGrounded("Åpent 25.00", ["Åpent 25.00"])).toBe(true)
		expect(hoursGrounded("Stengt 17.05, Mandag 08.00-15.30", ["Stengt 17.05", "Mandag 08.00-15.30"])).toBe(true)
	})

	it("needs the times in the order the quotes give them, so two days cannot swap hours", () => {
		const quote = "Mandag 08.00-15.30, fredag 10.00-12.00"
		expect(hoursGrounded(`Mandag kl. 08:00${D}15:30, fredag kl. 10:00${D}12:00`, [quote])).toBe(true)
		expect(hoursGrounded(`Mandag kl. 10:00${D}12:00, fredag kl. 08:00${D}15:30`, [quote])).toBe(false)
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
import { foldNorwegian, MAX_LINE, normaliseText, quoteHasText } from "./normalise.ts"

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

// Quarter hours. Months run 01 to 12, so a dotted pair without "kl" whose second part is no
// quarter hour ("17.05", "14.04") may be a date, and the formatter will not guess.
const QUARTERS: ReadonlySet<string> = new Set(["00", "15", "30", "45"])
// A count after a bare range: "13-20 år", "1-2 ganger". The range is text, not a time.
const COUNT_AFTER = /^ ?(?:år|ganger|gang|timer|time|minutter|min|uker|uke|dager|måneder|mnd|kr|plasser|%)(?!\p{L})/iu

// The last two words before a match, folded and without punctuation. Words split on spaces and
// dashes, so "Mandag-fredag 8-16" ends in "fredag". Only 40 characters are read: linear.
function wordsBefore(text: string, at: number): string[] {
	return text
		.slice(Math.max(0, at - 40), at)
		.split(/[\s\u2013\u2014-]+/)
		.map((w) => foldNorwegian(w.replace(/[^\p{L}]/gu, "")))
		.filter((w) => w !== "")
		.slice(-2)
}

export function formatHours(text: string): HoursResult {
	if (text.length > MAX_LINE) return UNREADABLE
	const collapsed = text.replace(/\s+/g, " ").trim()
	let failed = false
	const out = collapsed.replace(TIMES, (match, kl1, h1, m1, h2, m2, kl3, h3, m3, offset: number) => {
		const before = wordsBefore(collapsed, offset)
		const kl = kl1 !== undefined || kl3 !== undefined || before.includes("kl")
		const minutes = [m1, m2, m3].filter((m): m is string => m !== undefined)
		if (!kl && /\d\.\d/.test(match) && minutes.some((m) => !QUARTERS.has(m))) {
			failed = true
			return match
		}
		if (h1 !== undefined) {
			if (m1 === undefined && m2 === undefined) {
				// A bare range ("13-18") is a time only right after "kl" or a day name, and never
				// before a count: "1-2 ganger i uka" and "13-20 år" stay text.
				const afterDay = kl || before.some((w) => DAY_WORDS.has(w))
				if (!afterDay || COUNT_AFTER.test(collapsed.slice(offset + match.length))) return match
			}
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

// A value the formatter could not read is the raw text (the rule sends it to review), so it is
// grounded when it stands in the quotes as written. A formatted value is grounded when its times
// come from the formatted quotes in the same order, so two days cannot swap hours, and every word
// in it is a word of the quotes. A formatted value is never a verbatim substring of a raw quote
// ("08.00-15.30" against "kl. 08:00\u201315:30"), so the plain text check cannot ground it.
export function hoursGrounded(value: string, quotes: readonly string[]): boolean {
	if (quotes.some((q) => quoteHasText(q, value)) || quoteHasText(quotes.join(", "), value)) return true
	const formatted = quotes.map(formatHours)
	if (formatted.some((f) => !f.ok)) return false
	const text = formatted.map((f) => (f.ok ? f.text : "")).join(" ")
	const times = text.match(FORMATTED_TIME) ?? []
	let next = 0
	for (const t of value.match(FORMATTED_TIME) ?? []) {
		const found = times.indexOf(t, next)
		if (found === -1) return false
		next = found + 1
	}
	const words = new Set(wordsOf(text))
	return wordsOf(value).every((w) => words.has(w))
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

Make each break, run `npx vitest run test/hours.test.ts`, see the FAIL, restore, run: PASS. Note each one for the PR body.

1. In `clock`, change `h > 24` to `h > 25`: FAIL on "refuses a time it cannot read" (`25.00` becomes `25:00`).
2. Delete the `QUARTERS` check: FAIL on "refuses a date without its year" (`17.05` becomes `17:05`).
3. Delete the `COUNT_AFTER` test: FAIL on the table row "For ungdom 13-20 år, tirsdag 14-17".
4. Make `afterDay` true whenever a day word is anywhere on the line (the old rule): FAIL on "Mandag: gruppe for 8-10 klasse".
5. Delete the `MAX_LINE` check in `formatHours`: FAIL on "refuses one over 2,000". The timing half has no break of its own: `TIMES` has no nested quantifier, so no input makes it slow; the test guards a later edit.
6. In `hoursGrounded`, delete the verbatim line: FAIL on "grounds the raw text of hours the formatter could not read".
7. Replace the ordered loop with `(value.match(FORMATTED_TIME) ?? []).every((t) => times.includes(t))`: FAIL on "needs the times in the order the quotes give them".

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
		expect(streetKey("Storgata 1 i 2. etasje")).toBe("storgata 1 i 2. etasje")
	})

	it("finds the street when the sentence goes on with i or å", () => {
		const quote = "Kontoret ligger i Storgata 1 i 2. etasje, 2317 Hamar"
		expect(quoteHasAddress(quote, "Storgata 1, 2317 Hamar")).toBe(true)
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
// because "og" is a word, not a letter. So do the one-letter words "i" and "å": "Storgata 1 i
// 2. etasje" is Storgata 1.
export function streetKey(text: string): string {
	return normaliseText(text).replace(/(\d) ((?![iå])\p{L})(?![\p{L}\p{N}])/gu, "$1$2")
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

In `streetKey`, drop the `.replace(...)`. Run `npx vitest run test/kartverket.test.ts`: FAIL on "reads Storgata 1 A as Storgata 1A". Restore, run: PASS. Then drop `(?![iå])` from the pattern. Run `npx vitest run test/address.test.ts`: FAIL on "finds the street when the sentence goes on with i or å". Restore, run: PASS. Note both for the PR body.

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
- Consumes: `mainText`'s cleaning rules, `SITE_RULES`, `AdapterName`, `ContactBlock` (Task 1), `normaliseText`, `stripInvisible` (Task 2), `possibleNames` (Task 2, in the Step 10 script only).
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

`pipeline/test/fixtures/pages/test-box.html` (a box outside `<main>` and a hidden copy; the forged heading marker is built in the test, since a raw NUL does not belong in a fixture file and `&#0;` is decoded to U+FFFD before any strip could see it):

```html
<!DOCTYPE html>
<html lang="nb">
<head><meta charset="utf-8"><meta name="acos-cmscontext" content="w1$o1$m1$sl0" /><title>Eksempel</title></head>
<body>
<main class="main">
<h1>Eksempel helsestasjon</h1>
<p>Drop-in hver tirsdag.</p>
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
// An ACOS page around the markup a test gives. (Kept per file: importing it from another test
// file would run that file's tests twice.)
const acos = (main: string) =>
	`<!DOCTYPE html><html lang="nb"><head><meta charset="utf-8"><meta name="acos-cmscontext" content="w1" /></head><body><main class="main">${main}</main></body></html>`

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

	it("keeps a heading's level when its markup has line breaks inside", () => {
		const p = readUnitPage(acos("<h1>\n  Eksempel helsestasjon\n</h1><h2>\n\tKontakt oss\n</h2><p>Telefon: 62 00 00 00</p>"), K, [])
		expect(p.main).toEqual([
			{ text: "Eksempel helsestasjon", heading: 1 },
			{ text: "Kontakt oss", heading: 2 },
			{ text: "Telefon: 62 00 00 00" },
		])
	})

	it("never lets page text forge a heading", () => {
		// A raw NUL at the start of a block, the marker textLines puts on a heading.
		const p = readUnitPage(acos("<h1>Eksempel</h1><p>\u00002\u0000Kontakt</p><p>Telefon: 62 00 00 00</p>"), K, [])
		expect(p.main.slice(1)).toEqual([{ text: "2Kontakt" }, { text: "Telefon: 62 00 00 00" }])
	})

	it("strips invisible characters from every line", () => {
		const p = readUnitPage(acos("<h1>Eksempel\u202E helsestasjon</h1><p>Telefon:\u200B 62 00 00 00</p>"), K, [])
		expect(p.main).toEqual([{ text: "Eksempel helsestasjon", heading: 1 }, { text: "Telefon: 62 00 00 00" }])
		expect(p.text).not.toMatch(/[\u200B\u202E]/)
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
const acos = (main: string) =>
	`<!DOCTYPE html><html lang="nb"><head><meta charset="utf-8"><meta name="acos-cmscontext" content="w1" /></head><body><main class="main">${main}</main></body></html>`

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

	it("keeps the lines under a deeper heading, and is named by the nearest higher heading", () => {
		const html = acos(
			"<h1>Eksempel helsestasjon</h1><h2>Om tjenesten</h2><p>Vi har drop-in.</p>" +
				"<h2>Kontakt</h2><h3>Telefon</h3><p>62 00 00 00</p><h3>Besøksadresse</h3><p>Storgata 1, 2609 Lillehammer</p>" +
				"<h2>Les mer</h2><p>Vaksiner for barn.</p>"
		)
		expect(contactBlocks(readUnitPage(html, K, []))).toEqual([
			{
				source: "heading",
				heading: "Eksempel helsestasjon",
				lines: ["Telefon", "62 00 00 00", "Besøksadresse", "Storgata 1, 2609 Lillehammer"],
			},
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

Add `import { stripInvisible } from "../text/invisible.ts"` (Task 2) and replace `mainText` with:

```ts
export type TextLine = { text: string; heading?: number }

const HEADINGS = "h1, h2, h3, h4, h5, h6"
// A heading's level rides on its line between two NUL characters. Pages cannot forge it: every
// NUL already in the page's text, with every other invisible character (text/invisible.ts), is
// removed first.
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
			// Extraction, grounding and every value read this text, so all of them see it clean.
			if (text.type === "text" && typeof text.data === "string") text.data = stripInvisible(text.data)
		})
	root.find(HEADINGS).each((_, el) => {
		const node = $(el)
		// Collapsed first: a template that breaks the line inside <h2> would otherwise leave the
		// mark on an empty line of its own and the heading unmarked.
		node.text(`${MARK}${el.tagName.slice(1)}${MARK}${node.text().replace(/\s+/g, " ").trim()}`)
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

// The lines under each heading the test picks, until the next heading of the same level or
// higher. A deeper heading ("Telefon" under "Kontakt") stays in the block as a line. The block is
// named by the nearest heading above it of a higher level (the service it belongs to), so "Om
// tjenesten" beside "Kontakt" never names it.
function under(lines: readonly TextLine[], words: ReadonlySet<string>): ContactBlock[] {
	const blocks: ContactBlock[] = []
	// The last heading seen at each level, deeper ones forgotten when a higher one comes.
	const above: (string | undefined)[] = []
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		if (line?.heading === undefined) continue
		const level = line.heading
		if (!headingIs(line.text, words)) {
			above.length = level
			above[level] = line.text
			continue
		}
		let naming: string | undefined
		for (let l = level - 1; l >= 1 && naming === undefined; l--) naming = above[l]
		const body: string[] = []
		for (let j = i + 1; j < lines.length; j++) {
			const next = lines[j]
			if (next === undefined || (next.heading !== undefined && next.heading <= level)) break
			body.push(next.text)
		}
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

Read only the printed summaries.

**The hosts to read come from discover, never from memory.** Every script in this task reads only pages whose final host is the site host discover recorded for the kommuner I name. A page on any other host (a shared service on a neighbour's site, a provider) is skipped, so no host of the 11 blocking kommuner can be read even if a link leads there. Print the three site hosts (public kommune hosts, nothing else):

```bash
node --input-type=module -e '
const { join } = await import("node:path")
const { readDiscovery } = await import("./src/discover/files.ts")
const wanted = process.argv[1].split(",")
for (const k of readDiscovery(join(process.argv[2], "discover")).kommuner) {
	if (wanted.includes(k.kommune)) console.log(k.kommune, k.site?.host ?? "no site")
}' 3401,3405,3411 ../.cache
```

If no page reads as `sitevision`, add one more Innlandet kommune that is not on the blocking list (never 3403, 3412, 3413, 3414, 3415, 3417, 3419), one at a time, to the `--only` lists and to the kommune list of every script below, until one does.

Then print the structure around every `tel:` and `mailto:` link, and around every element whose class or id looks like opening hours. The script prints tag names, classes, ids and counts, never text, an href, a number or a URL path. Class and id tokens can carry page text (a staff card with `id="kari-nordmann"`, an anchor made from a heading), so a token is printed as `?` when it is longer than 40 characters, holds eight digits in a row, or has a part that is a word of a possible name in the page's visible text (`possibleNames` with no exemptions, so it masks too much on purpose). For each structure it also prints how many different `tel:` and `mailto:` targets it holds across the pages, counted from SHA-256 hashes so no value is printed. Save it outside the repo, at `C:/Users/Nugget/AppData/Local/Temp/varde-structure.mjs`; it runs through `node -e` from `pipeline/`, so its imports resolve there:

```js
// Structure only: tag.class#id chains, masked, with counts. Never text, an href, a number or a
// URL path. Arguments: the cache folder, then the kommune numbers whose site hosts it may read.
const { readFileSync } = await import("node:fs")
const { join } = await import("node:path")
const { createHash } = await import("node:crypto")
const { load } = await import("cheerio/slim")
const { readPage } = await import("./src/adapters/read.ts")
const { readDiscovery } = await import("./src/discover/files.ts")
const { possibleNames } = await import("./src/text/names.ts")
const { foldNorwegian } = await import("./src/text/normalise.ts")
const [cacheDir, list] = process.argv.slice(1)
const wanted = list.split(",")
const bare = (host) => host.toLowerCase().replace(/^www\./, "")
// "--host=<host>" names one host directly, for the check on a fictional cache below.
const allowed = list.startsWith("--host=")
	? new Set([bare(list.slice("--host=".length))])
	: new Set(
			readDiscovery(join(cacheDir, "discover"))
				.kommuner.filter((k) => wanted.includes(k.kommune) && k.site !== undefined)
				.map((k) => bare(k.site.host))
		)
const manifest = JSON.parse(readFileSync(join(cacheDir, "pages/manifest.json"), "utf8"))
const tally = new Map()
const add = (key, target) => {
	const t = tally.get(key) ?? { count: 0, targets: new Set() }
	t.count++
	if (target !== undefined) t.targets.add(createHash("sha256").update(target).digest("hex"))
	tally.set(key, t)
}
let skipped = 0
for (const entry of manifest.entries) {
	if (!allowed.has(bare(new URL(entry.finalUrl).hostname))) {
		skipped++
		continue
	}
	const html = readFileSync(join(cacheDir, "pages", entry.file), "utf8")
	const adapter = readPage(html, entry.finalUrl).adapter
	const $ = load(html)
	// Every text node apart, so a name glued to the text before it is still seen.
	const texts = $("body *").contents().toArray().filter((n) => n.type === "text").map((n) => n.data).join(" ")
	const nameWords = new Set(
		possibleNames(texts, { places: [] }).flatMap((n) => n.split(/[\s-]+/).map(foldNorwegian))
	)
	const safe = (token) => {
		const parts = token.split(/[^\p{L}]+|(?<=\p{Ll})(?=\p{Lu})/u).map(foldNorwegian)
		return token.length > 40 || /\d{8}/.test(token) || parts.some((p) => nameWords.has(p)) ? "?" : token
	}
	const node = (el) => {
		const classes = (el.attribs?.class ?? "").trim().split(/\s+/).filter((c) => c !== "").map(safe)
		const id = el.attribs?.id ? `#${safe(el.attribs.id)}` : ""
		return `${el.tagName}${classes.map((c) => `.${c}`).join("")}${id}`
	}
	const chain = (el) => $(el).parents().toArray().slice(0, 6).map(node).reverse().join(" > ")
	$('a[href^="tel:"], a[href^="mailto:"]').each((_, el) => {
		const href = el.attribs.href ?? ""
		const target = href.startsWith("tel:") ? href.replace(/\D/g, "") : href.toLowerCase()
		add(`${adapter} | link | ${chain(el)}`, target)
	})
	$("[class], [id]")
		.filter((_, el) => /apning|opening|hours|tider/i.test(`${el.attribs.class ?? ""} ${el.attribs.id ?? ""}`))
		.each((_, el) => add(`${adapter} | hours | ${chain(el)} > ${node(el)}`))
}
console.log(`pages skipped (not on the named site hosts): ${skipped}`)
for (const [key, t] of [...tally].sort((a, b) => b[1].count - a[1].count)) {
	console.log(`${t.count} times | ${t.targets.size} distinct targets | ${key}`)
}
```

**First prove the masking on a fictional page.** Build a throwaway cache in a temp folder with one hand-written page and run the script on it:

```bash
node --input-type=module -e '
const { mkdirSync, writeFileSync } = await import("node:fs")
const root = "C:/Users/Nugget/AppData/Local/Temp/varde-structure-check"
mkdirSync(`${root}/pages`, { recursive: true })
const url = "https://www.eksempel.kommune.no/helse/"
const page = "<html><head><meta name=\"acos-cmscontext\" content=\"x\"></head><body><main class=\"main\"><h1>Eksempel helsestasjon</h1><div class=\"person\" id=\"kari-nordmann\"><p>Kari Nordmann</p><a href=\"tel:62000000\">62 00 00 00</a></div></main></body></html>"
writeFileSync(`${root}/pages/00000000000000000000000000000000.html`, page)
writeFileSync(`${root}/pages/manifest.json`, JSON.stringify({ entries: [{ url, finalUrl: url, file: "00000000000000000000000000000000.html" }] }))
console.log("written")'
```

Run: `node --input-type=module -e "$(cat C:/Users/Nugget/AppData/Local/Temp/varde-structure.mjs)" C:/Users/Nugget/AppData/Local/Temp/varde-structure-check --host=www.eksempel.kommune.no` (the `--host=` form needs no discover folder). Expected: a line with `div.person#?`, no `kari` anywhere, and `1 distinct targets`. If a name shows, fix `safe` before any live run. Then delete the temp folder.

Run: `node --input-type=module -e "$(cat C:/Users/Nugget/AppData/Local/Temp/varde-structure.mjs)" ../.cache 3401,3405,3411`
Expected: lines like `7 times | 7 distinct targets | acos | link | body > div.x > aside.y > div.z`. Pick, per CMS, the innermost element that holds the contact links on most pages and sits outside `<main>` or inside it as its own box, and likewise the hours box. A structure whose distinct targets are close to its count holds each page's own number: that is the unit's box. One target on every page is a footer or the switchboard: skip it, and skip any element inside `footer` or `header`. Never open a page, a cached file or an href to decide; the counts are enough, and anything more would send page text to Anthropic.

- [ ] **Step 11: Record each box, with its check**

Run `date +"%Y-%m-%d %A"` first. For each box found, add one entry to `CMS_BOXES`, with a comment line naming the date and the host it was checked on, as `siteRules.ts` does. For example, for an ACOS contact box found as `aside.kontaktinfo` on Lillehammer pages:

```ts
export const CMS_BOXES: readonly CmsBox[] = [
	// ACOS contact box, checked 06.11.2026 on www.lillehammer.kommune.no (7 of 10 pages).
	{ adapter: "acos", kind: "contact", tag: "aside", className: "kontaktinfo" },
]
```

(The class name above shows the format only; use what Step 10 printed. A token printed as `?` cannot be recorded: pick the nearest unmasked element, or record no box for that CMS.) A CMS with no clear box gets no entry, and the PR body says so.

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

Role words are added only from a fetched page or Varde's own data (decision 6). This prints role-shaped words only, never a line, never a number, and reads only the site hosts discover recorded for the kommuner named:

```bash
node --input-type=module -e '
const { readFileSync } = await import("node:fs")
const { join } = await import("node:path")
const { readDiscovery } = await import("./src/discover/files.ts")
const { readUnitPage, allLines } = await import("./src/extract/page.ts")
const { findPhones, isMobileDigits } = await import("./src/text/phone.ts")
const [dir, list] = process.argv.slice(1)
const wanted = list.split(",")
const bare = (host) => host.toLowerCase().replace(/^www\./, "")
const allowed = new Set(
	readDiscovery(join(dir, "discover"))
		.kommuner.filter((k) => wanted.includes(k.kommune) && k.site !== undefined)
		.map((k) => bare(k.site.host))
)
const m = JSON.parse(readFileSync(join(dir, "pages/manifest.json"), "utf8"))
const words = new Map()
for (const e of m.entries) {
	if (!allowed.has(bare(new URL(e.finalUrl).hostname))) continue
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
' ../.cache 3401,3405,3411
```

For each word printed that names a role (not a name), add an entry to `ROLE_WORDS` with the comment "seen next to a mobile on <host>, <dd.mm.yyyy>" (the host from the structure run, not a URL). "Enhetsleder" goes in only if it is printed here.

- [ ] **Step 13: Run everything**

Run: `npm test`
Expected: PASS, including one test per recorded box.

- [ ] **Step 14: Show it red once**

Make each break, run the file named, see the FAIL, restore, run: PASS. Note each one for the PR body.

1. In `contactBlocks`, change `[...boxes, ...under(page.main, KONTAKT)]` to `under(page.main, KONTAKT)`. `test/contactBlock.test.ts`: FAIL on "takes a CMS contact box first" and on each recorded box.
2. In `under`, end the block at any heading (`next.heading !== undefined`). `test/contactBlock.test.ts`: FAIL on "keeps the lines under a deeper heading".
3. In `under`, name the block by the last heading of any level. `test/contactBlock.test.ts`: FAIL on the same test ("Om tjenesten" names it).
4. In `textLines`, mark the heading with `node.text()` uncollapsed. `test/page.test.ts`: FAIL on "keeps a heading's level when its markup has line breaks inside".
5. In `textLines`, replace `stripInvisible(text.data)` with `text.data`. `test/page.test.ts`: FAIL on "never lets page text forge a heading" and on "strips invisible characters from every line". If the forge test does not fail here, htmlparser2 has turned the raw NUL into U+FFFD before `textLines` sees it: then the forged mark cannot work at all, the test's expected line becomes `"\uFFFD2\uFFFDKontakt"` with no heading, and the PR body says the forge case has no red because the parser already closes it.

- [ ] **Step 15: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add src/adapters/clean.ts src/adapters/read.ts src/extract/cmsBoxes.ts src/extract/page.ts src/extract/contactBlock.ts src/extract/roleWords.ts test/page.test.ts test/contactBlock.test.ts test/fixtures/pages/ test/fixtures/README.md
git commit -m "feat(pipeline): read a page with its CMS boxes and find the unit's contact block"
```

---

### Task 7: The phone rule

Ranks 1 and 2 of the phone order from the contact block, rank 3 from a kommune page that labels its switchboard. A role mobile keeps only two quotes. A time on the number's line, or on a "Telefontid" line right after it, becomes `phoneHours`. "Døgnåpen" sets `alwaysOpen` only when the grounding gate's own reading (`gates/phrases.ts`) calls the line a plain claim, the line holds no number, and no other line of the block limits it.

**Files:**
- Create: `pipeline/src/extract/fields/phone.ts`
- Test: `pipeline/test/fields/phone.test.ts`

**Interfaces:**
- Consumes: `findPhones` (with `PhoneHit.short`), `isMobileDigits` (Task 3), `formatHours`, `hasTime` (Task 4), `possibleNames` (Task 2), `findRoleWord` (Task 2), `readAlwaysOpen`, `plainlyAlwaysOpen`, `alwaysOpenQualifiedIn` (`gates/phrases.ts`), `comparable` (`gates/compare.ts`), `ContactBlock`, `ExtractedCandidate` (Task 1), `MAX_LINE`, `MAX_QUOTE`, `quoteHasText`.
- Produces: `type RuleContext = { unitName?: string; places: readonly string[]; onKommuneSite: boolean }`, `phoneCandidates(blocks: readonly ContactBlock[], ctx: RuleContext): ExtractedCandidate[]`, `dedupe(candidates: readonly ExtractedCandidate[]): ExtractedCandidate[]` (one per field, compared by value and role; the first wins, except that a duplicate with a review reason replaces a clean one, so a review is never lost), all in `extract/fields/phone.ts`.

Four rules from the Tasks 7 to 14 stress test (06.11.2026) shape this file. A role word counts only in its own number's label, or on the line above when that line holds no number of its own. A possible name on the label line above blocks rank 1, as one on the number's own line does. A fax word written after a number drops that number. A short hit (`PhoneHit.short`, Task 3) counts only beside a phone label, or beside "ring" for review.

- [ ] **Step 1: Write the failing tests**

Create `pipeline/test/fields/phone.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { phoneCandidates } from "../../src/extract/fields/phone.ts"
import type { ContactBlock } from "../../src/schema/extraction.ts"

const ctx = { unitName: "Eksempel helsestasjon", places: ["Eksempel"], onKommuneSite: true }
const block = (...lines: string[]): ContactBlock[] => [{ source: "heading", lines }]
const phones = (blocks: ContactBlock[]) => phoneCandidates(blocks, ctx).filter((c) => c.field === "phone")
const shape = (blocks: ContactBlock[]) => phones(blocks).map((c) => [c.value, c.rank, c.role])
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

	it("never takes a fax number, on its own line, beside the phone, or with the word after it", () => {
		expect(phones(block("Telefon: 62 00 00 00", "Faks: 62 00 00 01")).map((c) => c.value)).toEqual(["62 00 00 00"])
		expect(phones(block("Telefon 62 00 00 00, faks 62 00 00 01")).map((c) => c.value)).toEqual(["62 00 00 00"])
		expect(phones(block("Telefaks:", "62 00 00 01"))).toEqual([])
		expect(phones(block("Telefon 62 00 00 00 / 62 00 00 01 (faks)")).map((c) => c.value)).toEqual(["62 00 00 00"])
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

	it("takes a short number only beside a phone label, and with only \"ring\" beside it, for review", () => {
		expect(phones(block("Storgata 110, 2317 Hamar"))).toEqual([])
		expect(phones(block("Vakttelefon 116 117"))).toMatchObject([{ value: "116 117", rank: 1 }])
		expect(phones(block("Vakttelefon 116 117"))[0]?.review).toBeUndefined()
		expect(phones(block("Ring 113 ved fare"))).toMatchObject([
			{ value: "113", rank: 1, review: 'a short number with only "ring" beside it' },
		])
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
		expect(phones(block("Avdelingsleder Kari Nordmann", "Mobil: 900 00 000"))).toMatchObject([
			{ rank: 2, role: "Avdelingsleder" },
		])
	})

	it("reads a role word only beside its own number, or on a line above that holds no number", () => {
		expect(shape(block("Telefon 62 00 00 00 / avdelingsleder 900 00 000"))).toEqual([
			["62 00 00 00", 1, undefined],
			["900 00 000", 2, "Avdelingsleder"],
		])
		expect(shape(block("Avdelingsleder Kari Nordmann 900 00 000", "Telefon: 62 00 00 00"))).toEqual([
			["900 00 000", 2, "Avdelingsleder"],
			["62 00 00 00", 1, undefined],
		])
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

	it("never makes a number rank 1 when its label line above holds a possible name", () => {
		const found = phones(block("Kontakt: Kari Nordmann, telefon", "62 00 00 00"))
		expect(found).toMatchObject([
			{ value: "62 00 00 00", rank: 2, review: "a number next to a possible name, with no role word" },
		])
		expect(found[0]?.evidence).toEqual({ kind: "quote", quotes: ["62 00 00 00"] })
		expect(JSON.stringify(found)).not.toMatch(/Kari|Nordmann/)
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

	it("formats a time range on the number's line or a Telefontid line after it", () => {
		expect(of("phoneHours", block("Telefon: 62 00 00 00 (hverdager 08.00-15.30)"))).toMatchObject([
			{ value: `hverdager kl. 08:00${D}15:30`, evidence: { quotes: ["Telefon: 62 00 00 00 (hverdager 08.00-15.30)"] } },
		])
		expect(of("phoneHours", block("Telefon: 62 00 00 00", "Telefontid 09.00-14.00"))).toMatchObject([
			{ value: `Telefontid kl. 09:00${D}14:00`, evidence: { quotes: ["Telefontid 09.00-14.00"] } },
		])
	})

	it("reads the line after as phoneHours only when it says Telefontid: other times are opening hours", () => {
		expect(of("phoneHours", block("Telefon: 62 00 00 00", "Åpent mandag til fredag 08.00-15.30"))).toEqual([])
	})

	it("sends a time it cannot read to review, as the page wrote it", () => {
		expect(of("phoneHours", block("Telefon: 62 00 00 00 (08.00-25.00)"))).toMatchObject([
			{ value: "08.00-25.00", review: "a time the formatter cannot read" },
		])
	})

	it("sets alwaysOpen only when the phrase stands alone on its line", () => {
		expect(of("alwaysOpen", block("Telefon: 62 00 00 00", "Døgnåpent"))).toEqual([
			{ field: "alwaysOpen", value: true, evidence: { kind: "quote", quotes: ["Døgnåpent"] }, origin: "unitContact", block: 0 },
		])
	})

	it("sends a claim beside a number to review, as the grounding gate would (ruling 35)", () => {
		expect(of("alwaysOpen", block("Telefon 62 00 00 00, døgnåpen"))).toMatchObject([
			{ value: true, review: "the always-open claim shares a line with a number" },
		])
	})

	it("sends any other word on that line to review, never a plain alwaysOpen", () => {
		for (const line of ["Ikke døgnåpen", "Døgnåpen i helgene", "Døgnåpent unntatt mandag"]) {
			const found = of("alwaysOpen", block("Telefon: 62 00 00 00", line))
			expect(found).toHaveLength(1)
			expect(found[0]?.review).toBe("the always-open line holds other words")
		}
	})

	it("sends a closure elsewhere in the block to review, with that line among the quotes", () => {
		expect(of("alwaysOpen", block("Telefon: 62 00 00 00", "Døgnåpent", "Stengt 24. desember"))).toMatchObject([
			{ evidence: { quotes: ["Døgnåpent", "Stengt 24. desember"] }, review: "the block limits the always-open claim" },
		])
	})

	it("keeps a review over a clean duplicate from another block", () => {
		const two: ContactBlock[] = [
			{ source: "cms", lines: ["Telefon: 62 00 00 00", "Døgnåpent"] },
			{ source: "heading", lines: ["Telefon: 62 00 00 00", "Ikke døgnåpen"] },
		]
		expect(of("alwaysOpen", two)).toMatchObject([{ review: "the always-open line holds other words" }])
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
import { alwaysOpenQualifiedIn, plainlyAlwaysOpen, readAlwaysOpen } from "../../gates/phrases.ts"
import { MAX_QUOTE } from "../../schema/common.ts"
import type { ContactBlock, ExtractedCandidate } from "../../schema/extraction.ts"
import { formatHours, hasTime } from "../../text/hours.ts"
import { possibleNames } from "../../text/names.ts"
import { MAX_LINE, quoteHasText } from "../../text/normalise.ts"
import { findPhones, isMobileDigits, type PhoneHit } from "../../text/phone.ts"
import { findRoleWord } from "../roleWords.ts"

export type RuleContext = { unitName?: string; places: readonly string[]; onKommuneSite: boolean }

const word = (alternatives: string) => new RegExp(`(?<![\\p{L}])(?:${alternatives})(?![\\p{L}])`, "iu")
const PHONE_LABEL = word("telefon|telefonnummer(?:et)?|tlf|vakttelefon")
const RING = word("ring")
const FAX = word("faks|fax|telefaks")
// A fax word in brackets right after a number: "62 00 00 01 (faks)".
const FAX_AFTER = /^\s*\(\s*(?:telefaks|faks|fax)\s*\)/iu
const SWITCHBOARD = word("sentralbord(?:et)?|servicetorg(?:et)?")
const PHONE_TIME = word("telefontid(?:en|er|ene)?")
const ALWAYS = word("døgnåpen|døgnåpent|døgnåpne|hele døgnet")
const LETTER = /\p{L}/u
const TIME_SHAPE = /\d[.:]\d{2}/
const DIGIT = /\d/g

// One candidate per field, compared by value and role: a number in the box and again in the
// text is one number, not two. The first wins, except that a duplicate with a review reason
// replaces a clean one: "Ikke døgnåpen" in a second block must not vanish behind "Døgnåpent".
export function dedupe(candidates: readonly ExtractedCandidate[]): ExtractedCandidate[] {
	const out: ExtractedCandidate[] = []
	const at = new Map<string, number>()
	for (const c of candidates) {
		const key = `${c.field}|${comparable(c.field, c.value)}|${c.role ?? ""}`
		const seen = at.get(key)
		if (seen === undefined) {
			at.set(key, out.length)
			out.push(c)
		} else if (c.review !== undefined && out[seen]?.review === undefined) {
			out[seen] = c
		}
	}
	return out
}

type Labelled = { hit: PhoneHit; label: string; labelLine?: number; first: boolean; after: string; last: boolean }

// Each number's label: the text between it and the number before it on the line. A number with
// no words before it takes the label of the number before it on the line, or else the line
// above when that line holds no number of its own ("Telefon:" over "62 00 00 00"). after is the
// text up to the next number, where a fax word may follow the number it belongs to.
function labelled(lines: readonly string[], i: number, hitsOf: readonly PhoneHit[][]): Labelled[] {
	const line = lines[i] ?? ""
	const hits = hitsOf[i] ?? []
	const out: Labelled[] = []
	let from = 0
	let previous: { label: string; labelLine?: number } | undefined
	for (const [n, hit] of hits.entries()) {
		const segment = line.slice(from, hit.index)
		from = hit.index + hit.text.length
		let current: { label: string; labelLine?: number }
		if (LETTER.test(segment)) {
			current = { label: segment }
		} else if (previous !== undefined) {
			current = previous
		} else {
			const above = lines[i - 1]
			current =
				above !== undefined && above.length <= MAX_LINE && (hitsOf[i - 1]?.length ?? 0) === 0
					? { label: above, labelLine: i - 1 }
					: { label: "" }
		}
		previous = current
		const next = hits[n + 1]
		out.push({ hit, ...current, first: n === 0, after: line.slice(from, next?.index ?? line.length), last: next === undefined })
	}
	return out
}

// The line with its numbers taken out, so digits never read as words.
function withoutNumbers(line: string, hits: readonly PhoneHit[]): string {
	let out = ""
	let from = 0
	for (const h of hits) {
		out += `${line.slice(from, h.index)} `
		from = h.index + h.text.length
	}
	return out + line.slice(from)
}

const quote = (texts: readonly string[]) => ({ kind: "quote" as const, quotes: [...texts] })

// "(hverdager 08.00-15.30)" after the number on its line, or a "Telefontid" line right after
// it. Any other time on the next line is the opening hours, never the phone's.
function hoursAfter(lines: readonly string[], i: number, hit: PhoneHit, block: number): ExtractedCandidate | undefined {
	const line = lines[i] ?? ""
	const rest = line.slice(hit.index + hit.text.length)
	const next = lines[i + 1]
	const timeIn = (text: string) => hasTime(text) || TIME_SHAPE.test(text)
	const source = timeIn(rest)
		? { text: rest, line }
		: next !== undefined && next.length <= MAX_LINE && PHONE_TIME.test(next) && findPhones(next).length === 0 && timeIn(next)
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

// "Døgnåpent", read the way the grounding gate reads it. Plain only when every claim line is a
// plain claim on its own, holds no number (ruling 35: a number beside it blocks a yes), and no
// other line of the block limits it ("Stengt 24. desember", "Åpent mandag til fredag"). Those
// lines join the quotes, so the gate reads them too. A line with a phone number is left out of
// that check: the gate's digit rule would call every phone line a limit. Digits are taken out
// before the check for the same reason, and the quote stays verbatim. Anything else goes to
// review: a wrong alwaysOpen on an acute line tells someone at night that a closed place is open.
function alwaysOpen(lines: readonly string[], hitsOf: readonly PhoneHit[][], block: number): ExtractedCandidate | undefined {
	const usable = lines.map((l, j) => ({ l, j })).filter(({ l }) => l.length <= MAX_QUOTE)
	const claims = usable.filter(({ l }) => ALWAYS.test(l))
	if (claims.length === 0) return undefined
	const limits = usable.filter(
		({ l, j }) => !ALWAYS.test(l) && (hitsOf[j]?.length ?? 0) === 0 && alwaysOpenQualifiedIn([l.replace(DIGIT, " ")])
	)
	const c: ExtractedCandidate = {
		field: "alwaysOpen",
		value: true,
		evidence: quote([...claims, ...limits].sort((a, b) => a.j - b.j).map(({ l }) => l)),
		origin: "unitContact",
		block,
	}
	if (claims.some(({ j }) => (hitsOf[j]?.length ?? 0) > 0)) {
		return { ...c, review: "the always-open claim shares a line with a number" }
	}
	if (claims.some(({ l }) => readAlwaysOpen(l) !== "yes" || !plainlyAlwaysOpen([l]))) {
		return { ...c, review: "the always-open line holds other words" }
	}
	return limits.length > 0 ? { ...c, review: "the block limits the always-open claim" } : c
}

function inBlock(block: ContactBlock, b: number, ctx: RuleContext): ExtractedCandidate[] {
	const lines = block.lines
	const out: ExtractedCandidate[] = []
	// Once per line: findPhones skips a line over MAX_LINE, and the names are only computed when
	// a number needs them, never once per number.
	const hitsOf = lines.map((l) => findPhones(l))
	const names = new Map<number, boolean>()
	const hasName = (j: number) => {
		let known = names.get(j)
		if (known === undefined) {
			const l = lines[j] ?? ""
			known = l.length <= MAX_LINE && possibleNames(withoutNumbers(l, hitsOf[j] ?? []), ctx).length > 0
			names.set(j, known)
		}
		return known
	}
	let serviceLine = false
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] ?? ""
		if (line.length > MAX_LINE) continue
		for (const { hit, label, labelLine, first, after, last } of labelled(lines, i, hitsOf)) {
			if (FAX.test(label) || FAX_AFTER.test(after) || (last && FAX.test(after))) continue
			const phoneLabel = PHONE_LABEL.test(label)
			// A short number is a house number, a price or a room as often as a phone (Task 3).
			if (hit.short && !phoneLabel && !RING.test(label)) continue
			const base = { field: "phone" as const, value: hit.text, origin: "unitContact" as const, block: b }
			const quotes = labelLine === undefined ? [line] : [lines[labelLine] ?? "", line]
			if (SWITCHBOARD.test(label)) {
				if (ctx.onKommuneSite && line.length <= MAX_QUOTE) out.push({ ...base, evidence: quote(quotes), rank: 3, role: "Sentralbord" })
				continue
			}
			// The role word of this number only: in its own label, or on the line above when that
			// line holds no number of its own, for the first number on the line.
			const above = lines[i - 1]
			const role =
				findRoleWord(label) ??
				(first && labelLine === undefined && above !== undefined && above.length <= MAX_LINE && (hitsOf[i - 1]?.length ?? 0) === 0
					? findRoleWord(above)
					: undefined)
			if (role !== undefined) {
				// Two verbatim pieces only, so no name on the line can be stored, whatever its shape.
				out.push({ ...base, evidence: quote([role.quote, hit.text]), rank: 2, role: role.label })
				continue
			}
			if (hasName(i) || (labelLine !== undefined && hasName(labelLine))) {
				out.push({ ...base, evidence: quote([hit.text]), rank: 2, review: "a number next to a possible name, with no role word" })
				continue
			}
			if (isMobileDigits(hit.digits)) {
				// The safety gate sends a mobile with no role label to review.
				out.push({ ...base, evidence: quote([hit.text]), rank: 2 })
				continue
			}
			if (line.length > MAX_QUOTE) continue
			const named = ctx.unitName !== undefined && quoteHasText(label, ctx.unitName)
			if (!phoneLabel && !named) {
				// "Ring 113 ved fare" may be advice about another service, so a short number with only
				// "ring" beside it is never a plain rank 1.
				if (hit.short) out.push({ ...base, evidence: quote(quotes), rank: 1, review: 'a short number with only "ring" beside it' })
				continue
			}
			out.push({ ...base, evidence: quote(quotes), rank: 1 })
			const hours = hoursAfter(lines, i, hit, b)
			if (hours !== undefined) out.push(hours)
			serviceLine = true
		}
	}
	if (serviceLine) {
		const open = alwaysOpen(lines, hitsOf, b)
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
Expected: PASS. If the "landline next to a person name" case finds `telefon` as a name, the label words in `text/names.ts` are missing it; fix the list, not the test. If "sets alwaysOpen only when the phrase stands alone" goes to review, check what `readAlwaysOpen("Døgnåpent")` and `plainlyAlwaysOpen(["Døgnåpent"])` return before changing anything: the grounding test on `main` passes `["Døgnåpent."]`, and the rule must agree with the gate, not the other way round.

- [ ] **Step 5: Show it red once**

One break per check, each restored before the next. Note every one for the PR body.

1. Delete `if (FAX.test(label) || FAX_AFTER.test(after) || (last && FAX.test(after))) continue`: FAIL on "never takes a fax number".
2. Change `(last && FAX.test(after))` to `false`: FAIL on "never takes a fax number" (the "(faks)" after the number).
3. Change `findRoleWord(label) ??` to `findRoleWord(line) ??`: FAIL on "reads a role word only beside its own number".
4. Delete `|| (labelLine !== undefined && hasName(labelLine))`: FAIL on "never makes a number rank 1 when its label line above holds a possible name".
5. Delete the line `if (hit.short && !phoneLabel && !RING.test(label)) continue`: FAIL on "takes a short number only beside a phone label".
6. In `hoursAfter`, delete `PHONE_TIME.test(next) &&`: FAIL on "reads the line after as phoneHours only when it says Telefontid".
7. In `alwaysOpen`, change `limits.length > 0 ?` to `false ?`: FAIL on "sends a closure elsewhere in the block to review".
8. In `dedupe`, delete the `else if` branch: FAIL on "keeps a review over a clean duplicate from another block".

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
- Consumes: `ContactBlock`, `ExtractedCandidate` (Task 1), `TextLine` (Task 6), `dedupe` (Task 7), `findPhones` (Task 3), `findRoleWord` (Task 2), `splitAddress`, `MAX_LINE`, `MAX_QUOTE`.
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

	it("never builds an address from a line that holds a phone number or a role word", () => {
		expect(values("Kari Nordmann 900 00 000", "2609 Lillehammer")).toEqual([])
		expect(values("Telefon 62 00 00 00", "2609 Lillehammer")).toEqual([])
		expect(values("Kari Nordmann 900 00 000, 2609 Lillehammer")).toEqual([])
		expect(values("Avdelingsleder rom 12", "2609 Lillehammer")).toEqual([])
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
import { findPhones } from "../../text/phone.ts"
import { findRoleWord } from "../roleWords.ts"
import { dedupe } from "./phone.ts"

type Kind = "visit" | "plain" | "post"
const LABEL = /^(besøksadresse|postadresse|adresse)\s*:?\s*/iu
const POSTBOKS = /(?<![\p{L}])postboks(?![\p{L}])/iu
const POSTCODE_LINE = /^\d{4} \p{L}/u
const RANK: Readonly<Record<Kind, number>> = { visit: 0, plain: 1, post: 2 }

const kindOf = (label: string | undefined): Kind =>
	label === undefined ? "plain" : /^besøk/i.test(label) ? "visit" : /^post/i.test(label) ? "post" : "plain"

// The street part, before the first comma. It may hold no phone number and no role word: a
// "street" of "Kari Nordmann 900 00 000" over a postcode line would put a name and a mobile into
// the value, and a review value is stored in the public lock as it is. possibleNames cannot do
// this check: every street name is a capitalised word, so it would refuse every address.
function streetIsClean(rest: string): boolean {
	const comma = rest.indexOf(",")
	const street = comma < 0 ? rest : rest.slice(0, comma)
	return findPhones(street).length === 0 && findRoleWord(street) === undefined
}

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
		if (!streetIsClean(rest)) continue
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

Delete `|| POSTBOKS.test(line)` from the skip line. Run `npx vitest run test/fields/address.test.ts`: FAIL on "never takes a Postboks". Restore, run: PASS. Then delete the line `if (!streetIsClean(rest)) continue`: FAIL on "never builds an address from a line that holds a phone number or a role word". Restore, run: PASS. Note both for the PR body.

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

	it("sends hours with a note, or an office with more than one reception, to review", () => {
		const noted = navHoursCandidate(
			office([{ day: "Mandag", from: "10:00", to: "14:00", closed: false, appointmentOnly: false, note: "Ring først" }])
		)
		expect(noted?.review).toBe("Nav lists a note on the hours")
		const two = navHoursCandidate({
			...office([{ day: "Mandag", from: "10:00", to: "14:00", closed: false, appointmentOnly: false }]),
			receptions: 2,
		})
		expect(two?.review).toBe("Nav lists more than one reception")
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
// through the formatter. Special dates and closed days are left out. A note on an open day
// ("kun timeavtale", a closure) is not in the value, so it sends the hours to me, and so does
// an office with more than one reception: parseNavOffice reads the first one's hours only.
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
	if (open.some((h) => h.appointmentOnly)) return { ...c, review: "Nav lists appointment-only hours" }
	if (open.some((h) => h.note !== undefined && h.note.trim() !== "")) return { ...c, review: "Nav lists a note on the hours" }
	return office.receptions > 1 ? { ...c, review: "Nav lists more than one reception" } : c
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

In `pageHoursCandidate`, change `hoursLength(value) > MAX_HOURS` to `value.length > MAX_HOURS * 2`. Run the hours test: FAIL on "sends hours over 200 characters to review". Restore, run: PASS. Then, in `navHoursCandidate`, change `office.receptions > 1` to `false` and delete the note line: FAIL on "sends hours with a note, or an office with more than one reception, to review". Restore, run: PASS. Note both for the PR body.

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
- Test: `pipeline/test/extract.test.ts`, `pipeline/test/extractErrors.test.ts`

**Interfaces:**
- Consumes: every field rule (Tasks 7 to 9), `readUnitPage`, `allLines`, `contactBlocks` (Task 6), `PageCache`, `ManifestEntry`, `DEFAULT_CACHE_DIR` (`io/pageCache.ts`), `readDiscovery` (`discover/files.ts`), `isNavOfficeUrl`, `parseNavOffice` (`registers/nav.ts`), `siteHost`, `writeJsonAtomic`, `ExtractionFile` (Task 1).
- Produces (`extract/extract.ts`):
  - `type ExtractContext = { places: readonly string[]; kommuneHost?: string }`
  - `extractPage(entry: ManifestEntry, html: string | undefined, ctx: ExtractContext): ExtractedPage`
  - `type ExtractSummary = { scope: string; name?: string; pages: number; notInCache: number; withValues: number; problems: Partial<Record<PageProblem, number>>; byField: Partial<Record<ExtractedField, number>>; withLavterskel: number }`
  - `extractScope(scope: string, urls: readonly string[], cache: PageCache, ctx: ExtractContext, now: string): { file: ExtractionFile; summary: ExtractSummary }`
  - `type ScopeInput = { scope: string; name?: string; urls: readonly string[]; ctx: ExtractContext }`, `extractScopes(scopes: readonly ScopeInput[], cache: PageCache, now: string, write: (scope: string, file: ExtractionFile) => void): { summaries: ExtractSummary[]; failed: number }` (each scope whole or not at all; one that throws is counted and the next goes on)
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
import { MAX_LINE, quoteHasPhone } from "../src/text/normalise.ts"
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

// The 1 MB lines prove the MAX_LINE skip. The lines just under MAX_LINE are the ones every
// pattern really runs on, so they prove the patterns themselves, and a block of 100 of them
// catches work repeated once per number instead of once per line.
const nearLimit = (unit: string) => unit.repeat(Math.ceil(MAX_LINE / unit.length)).slice(0, MAX_LINE - 1)
const SHAPES: Record<string, string> = {
	"1 MB of digits and dots": "62.00.".repeat(175_000),
	"1 MB of digits and spaces": "6 2 ".repeat(262_144),
	"just under MAX_LINE, digits and dots": nearLimit("62.00."),
	"just under MAX_LINE, digits and spaces": nearLimit("6 2 "),
	"just under MAX_LINE, many numbers": nearLimit("62 00 00 00 "),
}

describe("every rule on long lines of digits", () => {
	for (const [name, line] of Object.entries(SHAPES)) {
		it(`finishes within a second on ${name}`, () => {
			const block = [{ source: "heading" as const, lines: [line] }]
			const many = [{ source: "heading" as const, lines: Array.from({ length: 100 }, (_, i) => (i % 2 === 0 ? "Telefon:" : line)) }]
			const started = performance.now()
			findPhones(line)
			quoteHasPhone(line, "62 00 00 00")
			formatHours(line)
			possibleNames(line, ctx)
			phoneCandidates(block, { ...ctx, onKommuneSite: true })
			phoneCandidates(many, { ...ctx, onKommuneSite: true })
			emailCandidates(block, [line])
			addressCandidates(block)
			lavterskelQuotes([line])
			const cache = cacheWith({ [A]: `<html><body><main><h1>X</h1><h2>Kontakt</h2><p>${line}</p></main></body></html>` })
			const entry = cache.get(A)
			if (entry === undefined) throw new Error("no entry")
			extractPage(entry, cache.read(entry), ctx)
			expect(performance.now() - started).toBeLessThan(1000)
		})
	}
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
	ExtractedPage,
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
// reason; the run goes on. A rule that throws, or a page whose values do not fit the schema,
// gives the reason unreadable for that page only, so one odd page never stops its kommune's
// file (ExtractionFile.parse would refuse the whole file).
export function extractPage(entry: ManifestEntry, html: string | undefined, ctx: ExtractContext): ExtractedPage {
	if (html === undefined) return empty(entry, "cacheMismatch")
	try {
		const page = readWithRules(entry, html, ctx)
		return ExtractedPage.safeParse(page).success ? page : empty(entry, "unreadable")
	} catch {
		return empty(entry, "unreadable")
	}
}

function readWithRules(entry: ManifestEntry, html: string, ctx: ExtractContext): ExtractedPage {
	const unit = readUnitPage(html, entry.finalUrl)
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

export type ScopeInput = { scope: string; name?: string; urls: readonly string[]; ctx: ExtractContext }

// Every scope in turn, each written whole or not at all (write is writeJsonAtomic in the CLI).
// One scope that stops never stops the next: it is counted, and its old file stays as it was.
export function extractScopes(
	scopes: readonly ScopeInput[],
	cache: PageCache,
	now: string,
	write: (scope: string, file: ExtractionFile) => void
): { summaries: ExtractSummary[]; failed: number } {
	const summaries: ExtractSummary[] = []
	let failed = 0
	for (const s of scopes) {
		try {
			const { file, summary } = extractScope(s.scope, s.urls, cache, s.ctx, now)
			write(s.scope, file)
			summaries.push(s.name === undefined ? summary : { ...summary, name: s.name })
		} catch {
			// No message: an unexpected error's text could quote a page.
			failed++
		}
	}
	return { summaries, failed }
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
import { extractionPath, extractScopes, formatExtractSummary, type ScopeInput } from "../extract/extract.ts"
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
	const scopes: ScopeInput[] = found.kommuner
		.filter((k) => only.length === 0 || only.some((p) => k.kommune.startsWith(p)))
		.map((k) => ({
			scope: k.kommune,
			name: k.name,
			urls: k.pages.map((p) => p.url),
			ctx: k.site === undefined ? { places } : { places, kommuneHost: k.site.host },
		}))
	if (values.national) {
		scopes.push({ scope: "national", urls: found.national.pages.map((p) => p.url).filter(isNavOfficeUrl), ctx: { places } })
	}
	// Each scope is written whole or not at all, and one that stops never stops the next.
	const { summaries, failed } = extractScopes(scopes, cache, now, (scope, file) => {
		if (!values["dry-run"]) writeJsonAtomic(extractionPath(root, scope), file)
	})
	console.log(formatExtractSummary(summaries))
	if (failed > 0) {
		console.error(`extract stopped on ${failed} of ${scopes.length} scopes; their old files are unchanged`)
		process.exit(1)
	}
} catch (err) {
	// The message only: an unexpected error's text could quote a page.
	console.error(err instanceof DiscoverError ? err.message : "extract stopped on an unexpected error")
	process.exit(1)
}
```

The page cache opens with `dryRun: true` on purpose: extract only reads it, so it never saves or purges the manifest.

Two additions from the Tasks 1 to 6 stress test (06.11.2026), owned by this task:

- **Extraction files age out like pages.** Their lines can hold staff names, and `PageCache.purge` only clears `pages/`. Add `purgeExtractions(cacheDir: string, nowMs: number): number` to `extract/extract.ts`: it deletes every `<cache>/extract/*.json` whose `extractedAt` (or, when the file does not parse, its modification time) is older than `MAX_AGE_DAYS` (`io/pageCache.ts`), and returns the count. `cli/extract.ts` calls it before the loop, unless `--dry-run`, and prints `extraction files purged: <n>`. Test in `test/extract.test.ts`: in a temp folder, a file dated 91 days back goes and one dated today stays. Break: compare with `MAX_AGE_DAYS + 2` days, and the 91-day file stays (FAIL).
- **Phone lines lost to a possible name.** `ExtractSummary` gains `lostToName: number`, the count of phone candidates whose `review` is "a number next to a possible name, with no role word" (Task 7), and `formatExtractSummary` prints it as `phone lines lost to a possible name: <n>`. A count only, never the line. Test: a page with "Ring Kari på 62 00 00 00" in its contact block counts 1. Break: count nothing, FAIL.

Two more from the Tasks 7 to 14 stress test (06.11.2026). They fit around the two above: `purgeExtractions` still runs once, before `extractScopes`, and `lostToName` is counted inside `extractScope`, so a scope that stops adds nothing to it.

- **One page that throws never stops its kommune.** `extractPage` above catches every rule, and it checks the page against `ExtractedPage` before returning it. Test in a new file `test/extractErrors.test.ts` (its own file, because the mock covers the whole file). It uses `vi.mock("../src/extract/fields/phone.ts", ...)` with the real module spread in, and a `phoneCandidates` that throws when a block holds the line `Telefon: 62 00 00 99`. Two cached pages, one with that line: `extractScope` gives both pages, the marked one with `problem: "unreadable"` and no candidates, and the other with its values. Break: in `extractPage`, rethrow inside the `catch` (FAIL: the scope throws).
- **One scope that stops never stops the next.** Test in `test/extract.test.ts`: `extractScopes` over two scopes, with a `write` that throws for the first. The second is still written, the summaries hold the second only, and `failed` is 1. Break: move the `try` outside the loop (FAIL: the second scope is never written).

In `pipeline/package.json`, add to `scripts` after `"fetch"`: `"extract": "node src/cli/extract.ts",`.

- [ ] **Step 6: Show it red once**

In `extractPage`, change `if (html === undefined) return empty(entry, "cacheMismatch")` to `if (html === undefined) html = ""`. Run `npx vitest run test/extract.test.ts`: FAIL on "gives a page whose cache entry no longer matches no values". Restore, run: PASS. Note it for the PR body.

- [ ] **Step 7: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add src/extract/extract.ts src/cli/extract.ts package.json test/extract.test.ts test/extractErrors.test.ts
git commit -m "feat(pipeline): add the extract stage and its command"
```

---

### Task 11: Reading the first sheet of an .xlsx, with zip limits

`xlsx/read.ts` unpacks only the workbook, its relationships, the shared strings and the first sheet, counts the real bytes as they unpack and stops at 20 MB, and reads the XML with `cheerio` in XML mode, which reads no DTD and so expands no entity. The first sheet is the first `<sheet>` in `xl/workbook.xml`, found through `xl/_rels/workbook.xml.rels`, never a fixed path: a workbook whose sheets were moved or deleted keeps `sheet1.xml` for some other sheet. Rows keep their place by their `r` number, so a record id `<date>#<row>` is the row number Excel shows.

**Files:**
- Modify: `pipeline/package.json`, `pipeline/package-lock.json` (add `fflate`)
- Create: `pipeline/src/xlsx/read.ts`
- Test: `pipeline/test/xlsx.test.ts`, `pipeline/test/xlsxHelpers.ts`

**Interfaces:**
- Consumes: `fflate` (`Unzip`, `UnzipInflate`; tests also `zipSync`, `strToU8`), `cheerio/slim` (`load` with `{ xml: true }`).
- Produces (`xlsx/read.ts`): `MAX_UNPACKED = 20 * 1024 * 1024`, `MAX_ROWS = 1_048_576` (Excel's own limit), `WORKBOOK_ENTRIES` (workbook and its relationships), `type XlsxError = "notAZip" | "tooLarge" | "noSheet" | "unreadable"`, `type XlsxResult = { ok: true; sheetNames: string[]; rows: string[][] } | { ok: false; error: XlsxError }` (`rows[n]` is spreadsheet row `n + 1`; a row Excel left out is `[]`), `readFirstSheet(bytes: Uint8Array, limit?: number): XlsxResult`.
- Produces (`test/xlsxHelpers.ts`, tests only): `workbookEntries(sheets?: readonly { name: string; target: string }[]): Record<string, Uint8Array>`, `buildXlsx(rows: readonly (readonly string[])[], extra?: Record<string, Uint8Array>): Uint8Array`, `lieAboutSize(zip: Uint8Array, entry: string, size: number): Uint8Array`.

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
const ns = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
const rns = 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'

// The workbook and its relationships in the shape Excel writes: each sheet has an r:id, and the
// relationships file points that id at the sheet's part, relative to xl/.
export function workbookEntries(
	sheets: readonly { name: string; target: string }[] = [{ name: "Ark1", target: "worksheets/sheet1.xml" }]
): Record<string, Uint8Array> {
	const list = sheets.map((s, i) => `<sheet name="${esc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")
	const rels = sheets
		.map((s, i) => `<Relationship Id="rId${i + 1}" Type="worksheet" Target="${esc(s.target)}"/>`)
		.join("")
	return {
		"xl/workbook.xml": strToU8(`<workbook ${ns} ${rns}><sheets>${list}</sheets></workbook>`),
		"xl/_rels/workbook.xml.rels": strToU8(`<Relationships>${rels}</Relationships>`),
	}
}

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
	return zipSync({
		"[Content_Types].xml": strToU8("<Types/>"),
		...workbookEntries(),
		"xl/sharedStrings.xml": strToU8(`<sst ${ns}>${strings.map((s) => `<si><t>${esc(s)}</t></si>`).join("")}</sst>`),
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
import { buildXlsx, lieAboutSize, workbookEntries } from "./xlsxHelpers.ts"

const sheetOnly = (sheet: string, extra: Record<string, Uint8Array> = {}) =>
	zipSync({ ...workbookEntries(), "xl/worksheets/sheet1.xml": strToU8(sheet), ...extra })

describe("readFirstSheet", () => {
	it("reads the rows of the first sheet, shared strings resolved, in column order", () => {
		const bytes = buildXlsx([
			["Navn", "Kommuner"],
			["Eksempel legevakt", "Eksempel, Annen"],
		])
		expect(readFirstSheet(bytes)).toEqual({
			ok: true,
			sheetNames: ["Ark1"],
			rows: [
				["Navn", "Kommuner"],
				["Eksempel legevakt", "Eksempel, Annen"],
			],
		})
	})

	it("keeps an empty cell's place by its column letter, and reads inline strings and numbers", () => {
		const sheet = `<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>a</t></is></c><c r="C1"><v>62000000</v></c></row></sheetData></worksheet>`
		expect(readFirstSheet(sheetOnly(sheet))).toMatchObject({ ok: true, rows: [["a", "", "62000000"]] })
	})

	it("keeps a row Excel left out as an empty row, so a row's index is its row number less one", () => {
		const sheet = `<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>a</t></is></c></row><row r="3"><c r="A3" t="inlineStr"><is><t>c</t></is></c></row></sheetData></worksheet>`
		expect(readFirstSheet(sheetOnly(sheet))).toMatchObject({ ok: true, rows: [["a"], [], ["c"]] })
	})

	it("finds the first sheet through the workbook and its relationships, not by its file name", () => {
		const first = `<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>riktig</t></is></c></row></sheetData></worksheet>`
		const other = `<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>feil</t></is></c></row></sheetData></worksheet>`
		const bytes = zipSync({
			...workbookEntries([
				{ name: "Legevakter", target: "worksheets/sheet2.xml" },
				{ name: "Annet", target: "/xl/worksheets/sheet1.xml" },
			]),
			"xl/worksheets/sheet1.xml": strToU8(other),
			"xl/worksheets/sheet2.xml": strToU8(first),
		})
		expect(readFirstSheet(bytes)).toEqual({ ok: true, sheetNames: ["Legevakter", "Annet"], rows: [["riktig"]] })
	})

	it("reads only the workbook, its relationships, the shared strings and the first sheet", () => {
		const big = new Uint8Array(MAX_UNPACKED + 1024)
		const bytes = buildXlsx([["Navn"]], { "xl/media/stort.bin": big, "xl/worksheets/sheet2.xml": big })
		expect(readFirstSheet(bytes)).toMatchObject({ ok: true, rows: [["Navn"]] })
	})

	it("stops at 20 MB of real unpacked bytes", () => {
		const big = "a".repeat(MAX_UNPACKED + 1024)
		expect(readFirstSheet(sheetOnly("<worksheet/>", { "xl/sharedStrings.xml": strToU8(big) }))).toEqual({
			ok: false,
			error: "tooLarge",
		})
	})

	it("never trusts the size an entry declares: a small declared size that unpacks past the limit stops", () => {
		const big = `<sst>${"<si><t>a</t></si>".repeat(1_400_000)}</sst>`
		const honest = buildXlsx([["Navn"]], { "xl/sharedStrings.xml": strToU8(big) })
		const lying = lieAboutSize(honest, "xl/sharedStrings.xml", 100)
		expect(readFirstSheet(lying)).toEqual({ ok: false, error: "tooLarge" })
	})

	it("expands no entity, internal or external", () => {
		const sheet = `<?xml version="1.0"?><!DOCTYPE w [<!ENTITY e "HEMMELIG"><!ENTITY x SYSTEM "file:///C:/Windows/win.ini">]><worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>&e;&x;</t></is></c></row></sheetData></worksheet>`
		const result = readFirstSheet(sheetOnly(sheet))
		expect(result.ok).toBe(true)
		expect(JSON.stringify(result)).not.toMatch(/HEMMELIG|fonts|extensions/i)
	})

	it("refuses bytes that are not a zip, and a zip with no first sheet", () => {
		expect(readFirstSheet(strToU8("<html>ikke en fil</html>"))).toEqual({ ok: false, error: "notAZip" })
		expect(readFirstSheet(zipSync({ "xl/workbook.xml": strToU8("<workbook/>") }))).toEqual({ ok: false, error: "noSheet" })
		expect(readFirstSheet(zipSync(workbookEntries()))).toEqual({ ok: false, error: "noSheet" })
		const outside = zipSync({
			...workbookEntries([{ name: "Ark1", target: "../../hemmelig.xml" }]),
			"xl/../../hemmelig.xml": strToU8("<worksheet><sheetData><row r=\"1\"><c r=\"A1\"><v>1</v></c></row></sheetData></worksheet>"),
		})
		expect(readFirstSheet(outside)).toEqual({ ok: false, error: "noSheet" })
	})
})
```

The internal entity is what makes the entity test able to fail on every runner: the external one points at a Windows file, so on Linux it would read nothing even with a parser that resolves entities.

- [ ] **Step 4: Run it to see it fail**

Run: `npx vitest run test/xlsx.test.ts`
Expected: FAIL, `src/xlsx/read.ts` does not exist.

- [ ] **Step 5: Write `src/xlsx/read.ts`**

```ts
import { load } from "cheerio/slim"
import { Unzip, UnzipInflate } from "fflate"

// The .xlsx files the pipeline reads (NKLM's legevakt list) come from outside, so the zip is
// read with limits: only four entries, and at most 20 MB of real unpacked bytes over both
// passes, counted while they unpack. The size an entry declares is never trusted: a zip bomb
// lies about it. Entry names are only compared, never used as a path on disk.
export const MAX_UNPACKED = 20 * 1024 * 1024
export const MAX_ROWS = 1_048_576
export const WORKBOOK_ENTRIES = ["xl/workbook.xml", "xl/_rels/workbook.xml.rels"] as const
const SHARED_STRINGS = "xl/sharedStrings.xml"
// Compressed bytes are pushed in small chunks, so one push can unpack to at most about 16 MB
// (deflate's ratio limit) before the count is checked again.
const CHUNK = 16 * 1024

export type XlsxError = "notAZip" | "tooLarge" | "noSheet" | "unreadable"
export type XlsxResult = { ok: true; sheetNames: string[]; rows: string[][] } | { ok: false; error: XlsxError }

type Unpacked = { ok: true; files: Map<string, Uint8Array>; used: number } | { ok: false; error: XlsxError }

// One pass over the zip, keeping only the entries named. budget is what is left of the limit.
function unpack(bytes: Uint8Array, wanted: readonly string[], budget: number): Unpacked {
	const parts = new Map<string, Uint8Array[]>()
	let total = 0
	let seen = 0
	let error: XlsxError | undefined
	const unzip = new Unzip((file) => {
		seen++
		if (!wanted.includes(file.name)) return
		const chunks: Uint8Array[] = []
		parts.set(file.name, chunks)
		file.ondata = (err, data) => {
			if (err !== null) {
				error ??= "unreadable"
				return
			}
			total += data.length
			if (total > budget) {
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
	return { ok: true, files, used: total }
}

const decode = (bytes: Uint8Array) => new TextDecoder("utf-8").decode(bytes)

// The first <sheet> in the workbook, through its r:id in the relationships file. A target is
// relative to xl/, or absolute from the zip's root ("/xl/worksheets/sheet1.xml"). A target that
// climbs out of xl/ is no sheet.
function firstSheet(workbook: string, rels: string): { names: string[]; path: string } | undefined {
	const wb = load(workbook, { xml: true })
	const sheets = wb("sheets > sheet").toArray()
	const names = sheets.map((s) => wb(s).attr("name") ?? "")
	const id = sheets[0] === undefined ? undefined : wb(sheets[0]).attr("r:id")
	if (id === undefined) return undefined
	const r = load(rels, { xml: true })
	const rel = r("Relationship")
		.toArray()
		.find((el) => r(el).attr("Id") === id)
	const target = rel === undefined ? undefined : r(rel).attr("Target")
	if (target === undefined) return undefined
	const path = target.startsWith("/") ? target.slice(1) : `xl/${target}`
	if (!path.startsWith("xl/") || path.split("/").some((part) => part === ".." || part === ".")) return undefined
	return { names, path }
}

// "AB12" is column 27 (0-based), so an empty cell keeps its place.
function columnOf(ref: string | undefined, fallback: number): number {
	const letters = /^([A-Z]{1,3})\d*$/.exec(ref ?? "")?.[1]
	if (letters === undefined) return fallback
	return [...letters].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1
}

// Cheerio in XML mode (htmlparser2's xmlMode) decodes only the five XML entities and numeric
// references, and never reads a DTD, so a declared entity, internal or external, stays text.
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
	// Pass one: the workbook and its relationships, to learn which part is the first sheet.
	const book = unpack(bytes, WORKBOOK_ENTRIES, limit)
	if (!book.ok) return book
	const workbook = book.files.get("xl/workbook.xml")
	const rels = book.files.get("xl/_rels/workbook.xml.rels")
	if (workbook === undefined || rels === undefined) return { ok: false, error: "noSheet" }
	let sheet: { names: string[]; path: string } | undefined
	try {
		sheet = firstSheet(decode(workbook), decode(rels))
	} catch {
		return { ok: false, error: "unreadable" }
	}
	if (sheet === undefined) return { ok: false, error: "noSheet" }
	// Pass two: the shared strings and that sheet, inside what is left of the limit.
	const unpacked = unpack(bytes, [SHARED_STRINGS, sheet.path], limit - book.used)
	if (!unpacked.ok) return unpacked
	const xml = unpacked.files.get(sheet.path)
	if (xml === undefined) return { ok: false, error: "noSheet" }
	try {
		const shared = unpacked.files.has(SHARED_STRINGS)
			? sharedStrings(decode(unpacked.files.get(SHARED_STRINGS) ?? new Uint8Array()))
			: []
		const $ = load(decode(xml), { xml: true })
		const rows: string[][] = []
		for (const row of $("sheetData > row").toArray()) {
			// A row keeps its place by its r number; a row Excel left out stays an empty row.
			const r = Number($(row).attr("r"))
			const at = Number.isInteger(r) && r >= 1 ? r - 1 : rows.length
			if (at >= MAX_ROWS || at < rows.length) return { ok: false, error: "unreadable" }
			while (rows.length < at) rows.push([])
			const cells: string[] = []
			$(row)
				.children("c")
				.each((i, c) => {
					const cell = $(c)
					const type = cell.attr("t")
					const raw = cell.children("v").text()
					const value =
						type === "s" ? (shared[Number(raw)] ?? "") : type === "inlineStr" ? cell.find("is t").text() : raw
					const col = columnOf(cell.attr("r"), i)
					while (cells.length < col) cells.push("")
					cells[col] = value
				})
			rows.push(cells)
		}
		return { ok: true, sheetNames: sheet.names, rows }
	} catch {
		return { ok: false, error: "unreadable" }
	}
}
```

A row number that goes backwards, or past Excel's own limit, makes the sheet unreadable. That is a broken sheet, and reading it would put rows in the wrong place.

- [ ] **Step 6: Run it to see it pass**

Run: `npx vitest run test/xlsx.test.ts`
Expected: PASS. The lying-size test builds about 25 MB of XML in memory; it should still finish in a few seconds. If fflate's streaming reader throws on the lied size before 20 MB, the result is `unreadable`: then check that the throw comes after the count passed the limit (log `total` in a scratch run), and keep `tooLarge` as the answer when it did. If cheerio cannot select `r:id` with `attr("r:id")`, read `sheets[0].attribs["r:id"]`: in XML mode the attribute name keeps its prefix.

- [ ] **Step 7: Show it red once**

One break per check, each restored before the next. Note every one for the PR body.

1. In `unpack`, change `if (total > budget)` to `if (total > budget * 100)`: FAIL on "stops at 20 MB" and "never trusts the size an entry declares".
2. In `readFirstSheet`, replace `sheet.path` in the second `unpack` call and in `files.get` with `"xl/worksheets/sheet1.xml"`: FAIL on "finds the first sheet through the workbook and its relationships".
3. Delete `while (rows.length < at) rows.push([])`: FAIL on "keeps a row Excel left out as an empty row".
4. In `firstSheet`, delete the `..` check (`|| path.split("/").some(...)`): FAIL on "refuses bytes that are not a zip, and a zip with no first sheet" (the target outside `xl/` is read).

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
- Modify: `pipeline/src/net/crawler.ts`, `pipeline/src/io/files.ts`, `pipeline/src/sources/registers.ts`, `pipeline/src/sources/hosts.ts`, `docs/licence-requests/README.md`
- Test: `pipeline/test/nklm.test.ts`, `pipeline/test/crawler.test.ts` (extend), `pipeline/test/source.test.ts` (extend), `pipeline/test/allowList.test.ts` (check)

**Interfaces:**
- Consumes: `readFirstSheet` (Task 11), `Get`, `Fetched` (`net/crawler.ts`), `foldNorwegian`, `writeFileAtomic`, `writeJsonAtomic`, `REGISTER_SOURCES`.
- Produces:
  - `net/crawler.ts`: `Kind` gains `"binary"`; `Fetched.bytes?: Buffer` (set for `binary` only; `body` is then `""`).
  - `registers/nklm.ts`: `NKLM_PAGE: string` (the spec's file page), `NKLM_FILE_URL: string | undefined`, `type NklmEdition = { date: string; sha256: string }`, `NKLM_EDITIONS: readonly NklmEdition[]`, `type NklmColumns = { name: string; kommuner: string; phone: string; address: string }`, `NKLM_COLUMNS: NklmColumns`, `type NklmRow = { row: number; name: string; kommuner: string[]; phone?: string; address?: string }`, `type NklmRead = { ok: true; date: string; rows: NklmRow[]; unknownKommuner: number } | { ok: false; reason: string }`, `type KommuneLookup = { exact: (token: string) => string | undefined; bare: (token: string) => string | undefined }`, `kommuneLookup(kommuner: readonly { code: string; name: string }[]): KommuneLookup`, `readNklm(bytes: Uint8Array, kommune: KommuneLookup, editions?: readonly NklmEdition[], columns?: NklmColumns): NklmRead`, `nklmRecordId(date: string, row: number): string`, `type NklmSource = { url: string | undefined; editions: readonly NklmEdition[] }`, `fetchNklm(get: Get, dir: string, now: string, source?: NklmSource): Promise<{ ok: true; changed: boolean } | { ok: false; reason: string }>`, `loadNklm(dir: string, file?: string): Uint8Array | undefined`, `sha256Hex(bytes: Uint8Array): string`.

- [ ] **Step 1: Check the edition and learn the columns, from the local file**

The licence I have covers the file NKLM sent me on 05.11.2026, "Oversikt over legevakter i Norge" dated 01.01.2026. Ask me for the local path of that file (I keep it outside the repo). It holds no person names, but treat it like page text. These scripts print a hash, counts, sheet names, header names and separator characters. They never print a cell under the header, a phone number, an address or a URL.

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
console.log("sheets", r.sheetNames.length, JSON.stringify(r.sheetNames))
console.log("rows", r.rows.length)
const header = r.rows.findIndex((row) => row.filter((c) => c.trim() !== "").length >= 4)
if (header < 0) { console.log("no header row with four or more names"); process.exit(1) }
console.log("header row", header, JSON.stringify(r.rows[header]))
' "<path to the NKLM file>"
```

Expected: a hash, the sheet names, a row count, and the header row (column names only). If there is more than one sheet, or no header row, stop and tell me: legevaktsentraler may sit on a sheet the reader does not read.

Then learn the shape of the column that lists the kommuner each legevakt covers, in counts only. The script checks the tokens against the KLASS fixture (public data), so the cells themselves are never printed:

```bash
node --input-type=module -e '
const { readFileSync } = await import("node:fs")
const { readFirstSheet } = await import("./src/xlsx/read.ts")
const { foldNorwegian } = await import("./src/text/normalise.ts")
const [path, header, col] = process.argv.slice(1)
const r = readFirstSheet(new Uint8Array(readFileSync(path)))
const klass = JSON.parse(readFileSync("test/fixtures/klass/codes-at-2026-11-03.json", "utf8")).codes
const names = new Set(klass.flatMap((k) => [k.code, foldNorwegian(k.name.split(" - ")[0].replace(/\s*\([^()]*\)\s*$/, ""))]))
const cells = r.rows.slice(Number(header) + 1).map((row) => (row[Number(col)] ?? "").trim()).filter((c) => c !== "")
const separators = new Set(cells.flatMap((c) => [...c.replace(/[\p{L}\p{N}\s-]/gu, "")]))
const tokens = cells.flatMap((c) => c.split(/\s*[,;\n/]\s*|\s+og\s+/)).filter((t) => t !== "")
console.log("cells", cells.length, "separators", JSON.stringify([...separators]), "cells with og", cells.filter((c) => /\sog\s/.test(c)).length)
console.log("tokens", tokens.length, "known in the pilot KLASS list", tokens.filter((t) => names.has(t) || names.has(foldNorwegian(t))).length)
' "<path>" <header row> <kommuner column index>
```

Expected: a cell count, the separator characters, and a token count, some of them known. If no token is known, the column index is wrong, or the column holds something other than kommuner: stop and tell me. Write down the four header names (legevakt name, kommuner covered, phone, address), and say whether the header row has a type column for legevaktsentraler (if it does, name that column too).

The file's page is checked later, in Step 7, once the crawler has a `binary` kind and `nklm.ts` exists.

- [ ] **Step 2: Write the failing tests**

Create `pipeline/test/nklm.test.ts`:

```ts
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import type { Get } from "../src/net/crawler.ts"
import { fetchNklm, kommuneLookup, loadNklm, nklmRecordId, readNklm, sha256Hex } from "../src/registers/nklm.ts"
import { buildXlsx } from "./xlsxHelpers.ts"

const NOW = "2026-11-06T10:00:00Z"
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

	it("places a bare name of a bracketed KLASS kommune only beside another kommune of its county", () => {
		const shared = buildXlsx([
			header,
			["Eksempel legevakt", "Kongsvinger og Våler", "62 00 00 00", ""],
			["Annen legevakt", "Moss, Våler", "62 00 00 01", ""],
		])
		const counties = kommuneLookup([
			{ code: "3401", name: "Kongsvinger" },
			{ code: "3419", name: "Våler (Innlandet)" },
		])
		const read = readNklm(shared, counties, [{ date: "2026-01-01", sha256: sha256Hex(shared) }], COLUMNS)
		expect(read).toMatchObject({
			ok: true,
			unknownKommuner: 2,
			rows: [{ kommuner: ["3401", "3419"] }, { kommuner: [] }],
		})
		expect(counties.exact("Våler (Innlandet)")).toBe("3419")
		expect(counties.exact("Våler")).toBeUndefined()
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
	const URL_X = "https://nklm.norceresearch.no/fil.xlsx"
	const serve =
		(body: Uint8Array): Get =>
		async (url) => ({
			ok: true,
			url,
			finalUrl: url,
			status: 200,
			contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			headers: {},
			body: "",
			bytes: Buffer.from(body),
			fetchedAt: NOW,
		})

	it("takes a local file first, else the last saved copy", () => {
		const dir = mkdtempSync(join(tmpdir(), "varde-nklm-"))
		expect(loadNklm(dir)).toBeUndefined()
		const local = join(dir, "lokal.xlsx")
		writeFileSync(local, bytes)
		expect(loadNklm(dir, local)).toEqual(bytes)
	})

	it("says so when no file URL is known", async () => {
		const dir = mkdtempSync(join(tmpdir(), "varde-nklm-"))
		expect(await fetchNklm(serve(bytes), dir, NOW, { url: undefined, editions: EDITIONS })).toEqual({
			ok: false,
			reason: "no NKLM file URL is known: use --nklm-file",
		})
	})

	it("saves a licensed edition, and keeps that copy when a new edition comes", async () => {
		const dir = mkdtempSync(join(tmpdir(), "varde-nklm-"))
		const source = { url: URL_X, editions: EDITIONS }
		expect(await fetchNklm(serve(bytes), dir, NOW, source)).toEqual({ ok: true, changed: true })
		expect(await fetchNklm(serve(bytes), dir, NOW, source)).toEqual({ ok: true, changed: false })
		expect(loadNklm(dir)).toEqual(bytes)
		const newer = buildXlsx([...rows, ["Ny legevakt", "Lillehammer", "62 00 00 02", ""]])
		expect(await fetchNklm(serve(newer), dir, NOW, source)).toEqual({
			ok: false,
			reason: "new NKLM edition: licence check needed",
		})
		expect(loadNklm(dir)).toEqual(bytes)
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
		sourceUrl: "https://nklm.norceresearch.no/en/file/offisiell-oversikt-over-legevakter-og-legevaktsentraler-i-norge",
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

and add `...(kind === "binary" ? { bytes: res.body } : {}),` to the returned `Fetched`. The binary kind goes through the same allow-list, robots and size cap as every other kind: it widens what a body may be, never where it may come from.

- [ ] **Step 5: Write `src/registers/nklm.ts`**

Fill the constants marked below from Step 1 (`NKLM_FILE_URL` waits for Step 7). Run `date +"%Y-%m-%d %A"` first, and give each a comment with the date it was checked.

```ts
import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { writeFileAtomic, writeJsonAtomic } from "../io/files.ts"
import type { Get } from "../net/crawler.ts"
import { foldNorwegian } from "../text/normalise.ts"
import { readFirstSheet } from "../xlsx/read.ts"

// NKLM's list of legevakter («Oversikt over legevakter i Norge, NKLM (NORCE), per 01.01.2026»),
// licence granted by email on 05.11.2026. It finds legevakter and the kommuner each covers. NKLM
// makes the file by hand, so its phone and address are only ever peers for the agreement gate:
// they must agree with the legevakt's own page, never stand alone.

// The file's page, as the spec's Sources list names it: the source URL of every NKLM fact and
// the page the credit links to. Checked <dd.mm.yyyy>.
export const NKLM_PAGE =
	"https://nklm.norceresearch.no/en/file/offisiell-oversikt-over-legevakter-og-legevaktsentraler-i-norge"
// The file itself, when a page serves the edition the licence covers (Step 7 writes it).
// Without it, the file comes through --nklm-file.
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

export type KommuneLookup = { exact: (token: string) => string | undefined; bare: (token: string) => string | undefined }

const BRACKETED = /\s*\([^()]*\)\s*$/

// A kommune by its four-digit number or its KLASS name, folded: "Øyer", "oyer" and "3440" are
// one. KLASS puts the county in brackets on a name two kommuner share in the country ("Våler
// (Innlandet)" and "Våler (Østfold)"), so a bare "Våler" is ambiguous by KLASS's own word.
// bare gives the bracketed kommune of that bare name in this list, and readNklm takes it only
// beside another kommune of the same county on the same row. The list holds only the kommuner
// discovered, so being alone in it proves nothing about the country.
export function kommuneLookup(kommuner: readonly { code: string; name: string }[]): KommuneLookup {
	const byName = new Map(kommuner.map((k) => [foldNorwegian(k.name), k.code]))
	const bare = new Map<string, string[]>()
	for (const k of kommuner) {
		if (!BRACKETED.test(k.name)) continue
		const key = foldNorwegian(k.name.replace(BRACKETED, ""))
		bare.set(key, [...(bare.get(key) ?? []), k.code])
	}
	const codes = new Set(kommuner.map((k) => k.code))
	return {
		exact: (token) => {
			const t = token.trim()
			if (/^\d{4}$/.test(t)) return codes.has(t) ? t : undefined
			return byName.get(foldNorwegian(t))
		},
		bare: (token) => {
			const found = bare.get(foldNorwegian(token.trim()))
			return found?.length === 1 ? found[0] : undefined
		},
	}
}

const SEPARATOR = /\s*[,;\n/]\s*|\s+og\s+/

// Reasons may name a column header (public) but never a cell's value.
export function readNklm(
	bytes: Uint8Array,
	kommune: KommuneLookup,
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
	// rows[n] is spreadsheet row n + 1 (Task 11), so a record id is the row number Excel shows.
	sheet.rows.slice(headerAt + 1).forEach((cells, i) => {
		const cell = (key: keyof NklmColumns) => (cells[index[key] ?? -1] ?? "").trim()
		const name = cell("name")
		if (name === "") return
		const tokens = cell("kommuner").split(SEPARATOR).filter((t) => t !== "")
		const exact = tokens.map((t) => kommune.exact(t))
		const counties = new Set(exact.flatMap((c) => (c === undefined ? [] : [c.slice(0, 2)])))
		const codes: string[] = []
		tokens.forEach((t, j) => {
			const bare = exact[j] === undefined ? kommune.bare(t) : undefined
			const code = exact[j] ?? (bare !== undefined && counties.has(bare.slice(0, 2)) ? bare : undefined)
			if (code === undefined) unknownKommuner++
			else if (!codes.includes(code)) codes.push(code)
		})
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

function readState(path: string): { sha256?: string } {
	try {
		return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as { sha256?: string }) : {}
	} catch {
		return {}
	}
}

export type NklmSource = { url: string | undefined; editions: readonly NklmEdition[] }

// Fetches the file only when asked, and keeps its date, hash and URL in state.json, so a run can
// tell me whether it changed. Only a licensed edition replaces the saved copy: a new edition is
// recorded in state.json and stops the step, and the last licensed copy stays for the next run.
// The raw file stays in the cache folder and is never committed.
export async function fetchNklm(
	get: Get,
	dir: string,
	now: string,
	source: NklmSource = { url: NKLM_FILE_URL, editions: NKLM_EDITIONS }
): Promise<{ ok: true; changed: boolean } | { ok: false; reason: string }> {
	if (source.url === undefined) return { ok: false, reason: "no NKLM file URL is known: use --nklm-file" }
	const res = await get(source.url, "binary")
	if (!res.ok || res.bytes === undefined) return { ok: false, reason: "the NKLM file was not fetched" }
	const bytes = new Uint8Array(res.bytes)
	const sha256 = sha256Hex(bytes)
	const statePath = join(dir, STATE)
	const before = readState(statePath)
	const date = source.editions.find((e) => e.sha256 === sha256)?.date
	if (date !== undefined) writeFileAtomic(join(dir, FILE), bytes)
	writeJsonAtomic(statePath, { date: date ?? null, sha256, url: source.url, savedAt: now })
	if (date === undefined) return { ok: false, reason: "new NKLM edition: licence check needed" }
	return { ok: true, changed: before.sha256 !== sha256 }
}
```

`writeFileAtomic` in `src/io/files.ts` takes a string today. Widen it to `data: string | Uint8Array` (the body is unchanged: `writeFileSync` takes both), so the file is written byte for byte.

- [ ] **Step 6: Grant the licence and allow the host**

`src/sources/registers.ts`: change the NKLM line to `nklm: { host: "nklm.norceresearch.no", licence: "granted" },`, and the comment above `REGISTER_SOURCES` to: "Nav describes its own offices, so its office pages are ownPage. NKLM said yes by email on 05.11.2026 for its 01.01.2026 file."

`src/sources/hosts.ts`: add `register("nklm"),` to `FIXED_HOSTS` after `register("nav")`, and in the comment above it replace "NKLM and the Aim API (api.aimcms.no) are not fetched until their owners answer." with "The Aim API (api.aimcms.no) is not fetched until Prokom answers."

`docs/licence-requests/README.md`: in the NKLM row, fill the Answer column with `05.11.2026: yes, from an NKLM adviser, for the file dated 01.01.2026 (granted)`, and add a paragraph under the table:

```markdown
NKLM's permission covers the file dated 01.01.2026. The pipeline knows that file by its hash
(`pipeline/src/registers/nklm.ts`, `NKLM_EDITIONS`), so a new edition stops the NKLM step until
I record here that the permission covers it too. Credit line for "Kilder og lisenser":
«Oversikt over legevakter i Norge, NKLM (NORCE), per 01.01.2026».
```

- [ ] **Step 7: Check the file page, and write `NKLM_FILE_URL` only when it serves the licensed edition**

From `pipeline/`, with the crawler as VardeBot. The script tries the spec's file page first (it may serve the file itself), then the register's project page, and compares every `.xlsx` it finds with the licensed hash. It prints page numbers, counts, hosts and yes or no, never a URL or a path. When a file matches, the script writes its URL into `src/registers/nklm.ts` itself, so the URL is never printed:

```bash
node --input-type=module -e '
const { createHash } = await import("node:crypto")
const { readFileSync, writeFileSync } = await import("node:fs")
const { load } = await import("cheerio/slim")
const { Crawler } = await import("./src/net/crawler.ts")
const { httpsTransport } = await import("./src/net/http.ts")
const { systemClock } = await import("./src/net/clock.ts")
const { AllowList } = await import("./src/net/allowList.ts")
const { NKLM_EDITIONS, NKLM_PAGE } = await import("./src/registers/nklm.ts")
const sha = (b) => createHash("sha256").update(b).digest("hex")
const licensed = (b) => b !== undefined && NKLM_EDITIONS.some((e) => e.sha256 === sha(b))
const allowList = new AllowList()
const crawler = new Crawler({ transport: httpsTransport, clock: systemClock, allowList })
const pages = [NKLM_PAGE, "https://nklm.norceresearch.no/prosjekter/nasjonalt-legevaktregister"]
let match
for (const [n, page] of pages.entries()) {
	const direct = await crawler.get(page, "binary")
	if (direct.ok && licensed(direct.bytes)) { match = page; console.log(`page ${n + 1} serves the licensed file itself`); break }
	const res = await crawler.get(page, "html")
	if (!res.ok) { console.log(`page ${n + 1} not fetched: ${res.reason} ${res.status ?? ""}`); continue }
	const links = [...new Set(load(res.body)("a[href]").toArray().map((a) => new URL(a.attribs.href, res.finalUrl).href))].filter((h) => /\.xlsx(?:$|\?)/i.test(h))
	const hosts = [...new Set(links.map((h) => new URL(h).hostname))]
	console.log(`page ${n + 1}: ${links.length} xlsx links on hosts ${JSON.stringify(hosts)}`)
	for (const [k, link] of links.entries()) {
		const host = new URL(link).hostname
		if (host !== "norceresearch.no" && !host.endsWith(".norceresearch.no")) { console.log(`link ${k + 1}: not a NORCE host, not fetched`); continue }
		allowList.add(host, "register", "granted")
		const file = await crawler.get(link, "binary")
		const ok = file.ok && licensed(file.bytes)
		console.log(`link ${k + 1}: ${file.ok ? (ok ? "the licensed edition" : "another file") : `not fetched: ${file.reason}`}`)
		if (ok) { match = link; break }
	}
	if (match !== undefined) break
}
if (match === undefined) { console.log("no page serves the licensed edition: NKLM_FILE_URL stays undefined"); process.exit(0) }
const path = "src/registers/nklm.ts"
const before = "export const NKLM_FILE_URL: string | undefined = undefined"
const text = readFileSync(path, "utf8")
if (!text.includes(before)) { console.log("NKLM_FILE_URL line not found: nothing written"); process.exit(1) }
writeFileSync(path, text.replace(before, `export const NKLM_FILE_URL: string | undefined = ${JSON.stringify(match)}`))
console.log("NKLM_FILE_URL written, host", new URL(match).hostname)
'
```

Record for the PR body what it printed: which page answered, the file's host, and whether a link held the licensed edition.

- If it wrote `NKLM_FILE_URL`: fill the comment above it with the date and "serves the 01.01.2026 file". If the host it printed is not `nklm.norceresearch.no`, add `{ host: "<that host>", kind: "register", licence: "granted" },` to `FIXED_HOSTS` with a comment saying it serves the NKLM file.
- If it did not: `NKLM_FILE_URL` stays `undefined`, and the reader takes the file through `--nklm-file`. `NKLM_PAGE` is still the source URL of every NKLM fact. If neither page answered, tell me: the spec's Sources link may need to change.

- [ ] **Step 8: Run the tests to see them pass**

Run: `npx vitest run test/nklm.test.ts test/crawler.test.ts test/source.test.ts test/allowList.test.ts && npm test`
Expected: PASS. An allow-list test that lists `FIXED_HOSTS` exactly needs the NKLM host added to its expected list.

- [ ] **Step 9: Show it red once**

One break per check, each restored before the next. Note every one for the PR body.

1. In `readNklm`, delete the edition check (its first two lines): FAIL on "stops on a new edition".
2. In `fetchNklm`, delete `if (date !== undefined)` before `writeFileAtomic`: FAIL on "saves a licensed edition, and keeps that copy when a new edition comes".
3. In `readNklm`, change `counties.has(bare.slice(0, 2))` to `true`: FAIL on "places a bare name of a bracketed KLASS kommune only beside another kommune of its county" (Moss's Våler is placed).

- [ ] **Step 10: Lint, types, commit**

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
  - `curate/categories.ts`: `type CategoryRule = { categories: readonly CategorySlug[]; known: boolean }`, `SN_CATEGORIES`, `AMBIGUOUS_CODES`, `PATH_CATEGORIES`, `categoriesFor(input: { naeringskode?: string; urls: readonly string[]; names?: readonly string[]; nklmLegevakt: boolean }): { categories: CategorySlug[]; known: boolean; isKrisesenter: boolean }`, `providerTypeFor(input: { orgForm?: string; urls: readonly string[]; kommuneHost?: string }): ProviderType | undefined`.
  - `curate/include.ts`: `foldParents(units: readonly DiscoveredUnit[]): { units: DiscoveredUnit[]; folded: number }`, `type UnitGroup = { unitId: string; unit?: DiscoveredUnit; pages: ExtractedPage[]; name: string; matchName: string; categories: CategorySlug[]; isKrisesenter: boolean; providerType?: ProviderType; inclusion: Inclusion }`, `type MatchInput = { units: readonly DiscoveredUnit[]; pages: readonly ExtractedPage[]; national: ReadonlySet<string>; addressId: (address: string) => string | undefined; kommuneHost?: string; nklmLegevakt: (pageName: string) => boolean }`, `type MatchResult = { groups: UnitGroup[]; noUnitId: number; unitsWithoutPage: number; pagesWithProblem: number; nationalUnmatched: number; foldedParents: number }`, `matchUnits(input: MatchInput): MatchResult`, `pageName(page: ExtractedPage): string | undefined`, `pageAddress(page: ExtractedPage): string | undefined`.

`name` is the name Varde would show: the page's h1 when the page is the unit's own and its heading names the unit, else the Brreg name. `matchName` is the one block headings are matched against (the Brreg name when there is a unit, else the h1).

Five rules from the Tasks 7 to 14 stress test (06.11.2026) shape these files:
- An ambiguous SN2025 code (86.941, 88.995, 88.994, 88.996) keeps its unit in review even beside a path word.
- Only the last path segment names the service, so a page under `/helsestasjon/` is not a helsestasjon.
- 87.999 alone is a suggestion. It is known only beside a "krisesenter" word in the path or a name, since the code covers other social housing too.
- A Brreg main unit and its only sub-unit in the list are folded into one unit. A strong match (website or org number) leaves out the units that match only by name and address.
- A unit gets in by itself only when the page's heading names it, so a hub page a Brreg website points at never lends its title or its number to one unit.

The org form goes before the host in `providerTypeFor`, and when the two disagree, I decide.

Decided by me at plan review (06.11.2026): helsestasjon goes to review, with `familie-og-barn` as the suggestion, and legevakt stays automatic.

- [ ] **Step 1: Write the failing tests**

Create `pipeline/test/categories.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { categoriesFor, providerTypeFor } from "../src/curate/categories.ts"

const K = "https://www.eksempel.kommune.no"

describe("categoriesFor", () => {
	it("knows a category from an SN2025 code or a path word, one-to-one", () => {
		expect(categoriesFor({ naeringskode: "88.992", urls: [], nklmLegevakt: false })).toEqual({
			categories: ["familie-og-barn"],
			known: true,
			isKrisesenter: false,
		})
		expect(categoriesFor({ urls: [`${K}/helse/legevakt/`], nklmLegevakt: false })).toMatchObject({
			categories: ["nodtjenester"],
			known: true,
		})
	})

	it("knows a legevakt from NKLM", () => {
		expect(categoriesFor({ urls: [`${K}/helse/`], nklmLegevakt: true })).toMatchObject({ categories: ["nodtjenester"], known: true })
	})

	it("sends a helsestasjon to review, suggesting familie-og-barn", () => {
		expect(categoriesFor({ naeringskode: "86.942", urls: [`${K}/helse/helsestasjon/`], nklmLegevakt: false })).toEqual({
			categories: ["familie-og-barn"],
			known: false,
			isKrisesenter: false,
		})
		expect(categoriesFor({ naeringskode: "88.991", urls: [`${K}/helsestasjon-for-ungdom/`], nklmLegevakt: false }).known).toBe(false)
	})

	it("knows 87.999 only beside a krisesenter word, and marks it a krisesenter either way", () => {
		expect(categoriesFor({ naeringskode: "87.999", urls: [`${K}/helse/bolig/`], nklmLegevakt: false })).toEqual({
			categories: ["vold-og-overgrep", "nodtjenester"],
			known: false,
			isKrisesenter: true,
		})
		expect(
			categoriesFor({ naeringskode: "87.999", urls: ["https://www.eksempel-krisesenter.no/"], names: ["EKSEMPEL KRISESENTER IKS"], nklmLegevakt: false })
		).toEqual({ categories: ["vold-og-overgrep", "nodtjenester"], known: true, isKrisesenter: true })
		expect(categoriesFor({ naeringskode: "87.999", urls: [`${K}/krisesenter/`], nklmLegevakt: false }).known).toBe(true)
	})

	it("keeps the ambiguous codes and barnevernvakt in review, even beside a path word", () => {
		for (const code of ["86.941", "88.995", "88.994", "88.996"]) {
			expect(categoriesFor({ naeringskode: code, urls: [], nklmLegevakt: false }).known).toBe(false)
			expect(categoriesFor({ naeringskode: code, urls: [`${K}/gjeldsradgivning/`], nklmLegevakt: false }).known).toBe(false)
		}
		expect(categoriesFor({ urls: [`${K}/barnevernvakt/`], nklmLegevakt: false }).known).toBe(false)
	})

	it("reads the last path segment only: a page under a service is not that service", () => {
		expect(categoriesFor({ urls: [`${K}/legevakt/kommunal-akutt-dognplass/`], nklmLegevakt: false })).toEqual({
			categories: [],
			known: false,
			isKrisesenter: false,
		})
		expect(categoriesFor({ urls: [`${K}/krisesenter/samarbeid/`], nklmLegevakt: false }).isKrisesenter).toBe(false)
	})

	it("is not known when the code and the path disagree, but suggests both", () => {
		expect(categoriesFor({ naeringskode: "88.991", urls: [`${K}/gjeldsradgivning/`], nklmLegevakt: false })).toEqual({
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

	it("reads the org form before the host, and is unknown when they disagree", () => {
		expect(providerTypeFor({ orgForm: "FLI", urls: [`${K}/x/`], kommuneHost: "www.eksempel.kommune.no" })).toBeUndefined()
		expect(providerTypeFor({ orgForm: "KOMM", urls: [`${K}/x/`], kommuneHost: "www.eksempel.kommune.no" })).toBe("offentlig")
	})
})
```

Create `pipeline/test/include.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { foldParents, matchUnits } from "../src/curate/include.ts"
import type { DiscoveredUnit } from "../src/discover/types.ts"
import type { ExtractedPage } from "../src/schema/extraction.ts"

const K = "https://www.eksempel.kommune.no"
const unit = (over: Partial<DiscoveredUnit> = {}): DiscoveredUnit => ({
	orgNumber: "999999991",
	name: "EKSEMPEL KOMMUNE BARNEVERNTJENESTE",
	orgForm: "BEDR",
	naeringskode: "88.991",
	address: "Storgata 1, 2609 LILLEHAMMER",
	kommune: "3405",
	website: `${K}/barnevern/`,
	register: "underenheter",
	...over,
})
const page = (url: string, over: Partial<ExtractedPage> = {}, h1 = "Eksempel barneverntjeneste"): ExtractedPage => ({
	url,
	finalUrl: url,
	fetchedAt: "2026-11-06T09:00:00Z",
	adapter: "acos",
	fallback: false,
	blocks: [],
	candidates: [
		{ field: "name", value: h1, evidence: { kind: "quote", quotes: [h1] }, origin: "unitPage" },
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
		const result = matchUnits({ ...base, units: [unit()], pages: [page(`${K}/barnevern/`)] })
		expect(result.groups).toMatchObject([
			{
				unitId: "org:999999991",
				name: "Eksempel barneverntjeneste",
				categories: ["familie-og-barn"],
				providerType: "offentlig",
				inclusion: { status: "auto", reason: "one register unit, one page, a known category" },
			},
		])
	})

	it("matches by name and Kartverket address id when the unit lists no website", () => {
		const result = matchUnits({ ...base, units: [unit({ website: undefined })], pages: [page(`${K}/familie/bv/`)] })
		expect(result.groups[0]?.unitId).toBe("org:999999991")
	})

	it("never includes a page that two register units match: both are review questions", () => {
		const two = [unit(), unit({ orgNumber: "999999992", name: "EKSEMPEL BARNEVERNTJENESTE NORD" })]
		const result = matchUnits({ ...base, units: two, pages: [page(`${K}/barnevern/`)] })
		expect(result.groups.map((g) => [g.unitId, g.inclusion.status, g.inclusion.reason])).toEqual([
			["org:999999991", "review", "two or more register units share the page"],
			["org:999999992", "review", "two or more register units share the page"],
		])
		expect(result.groups[1]?.name).toBe("EKSEMPEL BARNEVERNTJENESTE NORD")
	})

	it("lets a website match leave out a unit that matches by name and address only", () => {
		const twin = unit({ orgNumber: "999999992", website: undefined })
		const result = matchUnits({ ...base, units: [unit(), twin], pages: [page(`${K}/barnevern/`)] })
		expect(result.groups.map((g) => [g.unitId, g.inclusion.status])).toEqual([["org:999999991", "auto"]])
		expect(result.unitsWithoutPage).toBe(1)
	})

	it("folds a main unit and its only sub-unit into one, so their page is one auto include", () => {
		const parent = unit({ orgNumber: "999999990", orgForm: "FLI", register: "enheter", website: "https://www.eksempel-forening.no/" })
		const child = unit({ orgNumber: "999999991", orgForm: "BEDR", website: undefined, parent: "999999990" })
		const result = matchUnits({ ...base, units: [parent, child], pages: [page("https://www.eksempel-forening.no/")] })
		expect(result.foldedParents).toBe(1)
		expect(result.groups).toMatchObject([
			{ unitId: "org:999999991", providerType: "frivillig", inclusion: { status: "auto" } },
		])
	})

	it("keeps a main unit with two sub-units apart from them", () => {
		const parent = unit({ orgNumber: "999999990", orgForm: "FLI", register: "enheter" })
		const kids = [unit({ orgNumber: "999999991", parent: "999999990" }), unit({ orgNumber: "999999992", parent: "999999990" })]
		expect(foldParents([parent, ...kids])).toMatchObject({ folded: 0, units: [parent, ...kids] })
	})

	it("sends a unit to review when its page's heading does not name it, and shows the Brreg name", () => {
		const hub = matchUnits({
			...base,
			units: [unit({ website: `${K}/familie/` })],
			pages: [page(`${K}/familie/`, {}, "Familie og oppvekst")],
		})
		expect(hub.groups[0]).toMatchObject({
			name: "EKSEMPEL KOMMUNE BARNEVERNTJENESTE",
			inclusion: { status: "review", reason: "the page heading does not name the unit" },
		})
	})

	it("asks about a unit with two pages, about a unit with no known category, and about a helsestasjon", () => {
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
		const hs = matchUnits({
			...base,
			units: [unit({ name: "EKSEMPEL HELSESTASJON", naeringskode: "86.942", website: `${K}/helsestasjon/` })],
			pages: [page(`${K}/helsestasjon/`, {}, "Eksempel helsestasjon")],
		})
		expect(hs.groups[0]?.inclusion).toEqual({
			status: "review",
			reason: "no known category",
			suggestedCategories: ["familie-og-barn"],
			providerType: "offentlig",
		})
	})

	it("gives a page with no unit an address id, and counts a page it cannot name", () => {
		const result = matchUnits({ ...base, units: [], pages: [page(`${K}/x/`), page(`${K}/y/`, { candidates: [] })] })
		expect(result.groups.map((g) => [g.unitId, g.inclusion.reason])).toEqual([
			["adr:adr-1:eksempel-barneverntjeneste", "no register unit matches the page"],
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

// Categories a unit gets without my look, and the ones I am only offered. Decided at plan
// review (PR 3 plan, decision 9), checked against the 138-row answer key on 06.11.2026:
// - barnevern 4 of 6 agree; the two barnevernvakt rows also carry nodtjenester and
//   vold-og-overgrep, so barnevernvakt maps to nothing.
// - familievern 5 of 5, gjeldsrådgivning 2 of 2.
// - legevakt: all 4 carry nodtjenester; 3 also psykisk-helse. Automatic, decided 06.11.2026.
// - helsestasjon: both key rows (helsestasjon for ungdom) also carry psykisk-helse, so it goes
//   to review with familie-og-barn as the suggestion (decided 06.11.2026).
// - krisesenter: all 4 key rows carry vold-og-overgrep and nodtjenester (2 also bolig). The code
//   87.999 covers other social housing too, so alone it is a suggestion.
// known: false marks a known service with no one-to-one category: its categories are only my
// suggestion, and the unit goes to review.
export type CategoryRule = { categories: readonly CategorySlug[]; known: boolean }

const KRISESENTER: readonly CategorySlug[] = ["vold-og-overgrep", "nodtjenester"]

export const SN_CATEGORIES: Readonly<Record<string, CategoryRule>> = {
	"86.942": { categories: ["familie-og-barn"], known: false },
	"88.991": { categories: ["familie-og-barn"], known: true },
	"88.992": { categories: ["familie-og-barn"], known: true },
	// Known only beside a krisesenter word: categoriesFor decides.
	"87.999": { categories: KRISESENTER, known: false },
}

// Codes that cover several kinds of service. A unit with one of them goes to review whatever its
// path says: 86.941 is psykisk helse and rus at home, 88.995 Nav and advice, 88.994 rus and
// outreach, 88.996 frivilligsentraler and activity.
export const AMBIGUOUS_CODES: ReadonlySet<string> = new Set(["86.941", "88.995", "88.994", "88.996"])

// Path words, read from the last segment of the path only: a word that starts with the stem.
// The first stem that matches a word wins, so barnevernvakt is tried before barnevern.
export const PATH_CATEGORIES: readonly ({ stem: string } & CategoryRule)[] = [
	{ stem: "barnevernvakt", categories: [], known: false },
	{ stem: "helsestasjon", categories: ["familie-og-barn"], known: false },
	{ stem: "barnevern", categories: ["familie-og-barn"], known: true },
	{ stem: "familievern", categories: ["familie-og-barn"], known: true },
	{ stem: "krisesenter", categories: KRISESENTER, known: true },
	{ stem: "legevakt", categories: ["nodtjenester"], known: true },
	{ stem: "gjeldsradgiv", categories: ["okonomi"], known: true },
]

const LEGEVAKT: CategoryRule = { categories: ["nodtjenester"], known: true }

// The words of a URL's last path segment, folded: "/familie/helsestasjon-for-ungdom/" gives
// helsestasjon, for and ungdom. A parent segment names the section, not the service.
function lastSegmentWords(url: string): string[] {
	try {
		const segments = new URL(url).pathname.split("/").filter((s) => s !== "")
		const last = segments.at(-1)
		return last === undefined
			? []
			: foldNorwegian(decodeURIComponent(last))
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

export function categoriesFor(input: {
	naeringskode?: string
	urls: readonly string[]
	names?: readonly string[]
	nklmLegevakt: boolean
}): {
	categories: CategorySlug[]
	known: boolean
	isKrisesenter: boolean
} {
	const rules: CategoryRule[] = []
	let pathKrisesenter = false
	for (const url of input.urls) {
		for (const word of lastSegmentWords(url)) {
			const hit = PATH_CATEGORIES.find((p) => word.startsWith(p.stem))
			if (hit === undefined) continue
			if (hit.stem === "krisesenter") pathKrisesenter = true
			rules.push(hit)
		}
	}
	const nameKrisesenter = (input.names ?? []).some((n) => foldNorwegian(n).includes("krisesenter"))
	if (nameKrisesenter) rules.push({ categories: KRISESENTER, known: true })
	const code = input.naeringskode
	if (code === "87.999") {
		rules.push({ categories: KRISESENTER, known: pathKrisesenter || nameKrisesenter })
	} else if (code !== undefined) {
		const rule = SN_CATEGORIES[code]
		if (rule !== undefined) rules.push(rule)
	}
	if (input.nklmLegevakt) rules.push(LEGEVAKT)
	// Known only when every source is a known one-to-one rule, they all give the same set, and no
	// ambiguous code stands behind the unit. Otherwise every category found is my suggestion.
	const distinct = new Set(rules.map((r) => ordered(r.categories).join(",")))
	const ambiguous = code !== undefined && AMBIGUOUS_CODES.has(code)
	return {
		categories: ordered(rules.flatMap((r) => r.categories)),
		known: rules.length > 0 && !ambiguous && rules.every((r) => r.known) && distinct.size === 1,
		isKrisesenter: code === "87.999" || pathKrisesenter || nameKrisesenter,
	}
}

const PUBLIC_FORMS: ReadonlySet<string> = new Set(["KOMM", "ORGL", "STAT", "IKS", "KF", "FYLK", "SF"])
const VOLUNTARY_FORMS: ReadonlySet<string> = new Set(["FLI", "STI"])

// The org form first: offentlig for a public form, frivillig for an association (FLI) or a
// foundation (STI). Then the host: offentlig for a page on the kommune's own site or nav.no.
// When the two disagree (an association's page on the kommune's site), I decide. A sub-unit's
// form (BEDR) says nothing, so only the host can speak for it.
export function providerTypeFor(input: { orgForm?: string; urls: readonly string[]; kommuneHost?: string }): ProviderType | undefined {
	const form =
		input.orgForm === undefined
			? undefined
			: PUBLIC_FORMS.has(input.orgForm)
				? "offentlig"
				: VOLUNTARY_FORMS.has(input.orgForm)
					? "frivillig"
					: undefined
	const own = input.kommuneHost === undefined ? undefined : siteHost(`https://${input.kommuneHost}/`)
	const publicHost = input.urls.map(siteHost).some((h) => h !== undefined && (h === own || h === "nav.no"))
	const host = publicHost ? "offentlig" : undefined
	if (form !== undefined && host !== undefined && form !== host) return undefined
	return form ?? host
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
	foldedParents: number
}

const valueOf = (page: ExtractedPage, field: "name" | "address") => {
	const c = page.candidates.find((x) => x.field === field && x.origin !== "register")
	return typeof c?.value === "string" ? c.value : undefined
}
export const pageName = (page: ExtractedPage) => valueOf(page, "name")
export const pageAddress = (page: ExtractedPage) => valueOf(page, "address")

// A Brreg main unit and its only sub-unit in the list are one service: Brreg lists an
// association and its branch with one name and one address, and both would match its page,
// which turns one service into two questions and, with two yes answers, two listings. The
// sub-unit stays (it carries the visiting address), with the main unit's legal form, and with
// the main unit's website and code when it has none of its own. A main unit with two or more
// sub-units here keeps them apart: those are separate services.
export function foldParents(units: readonly DiscoveredUnit[]): { units: DiscoveredUnit[]; folded: number } {
	const byOrg = new Map(units.map((u) => [u.orgNumber, u]))
	const children = new Map<string, DiscoveredUnit[]>()
	for (const u of units) {
		if (u.parent !== undefined && byOrg.has(u.parent)) children.set(u.parent, [...(children.get(u.parent) ?? []), u])
	}
	const onlyChild = (orgNumber: string) => children.get(orgNumber)?.length === 1
	const out: DiscoveredUnit[] = []
	let folded = 0
	for (const u of units) {
		if (onlyChild(u.orgNumber)) {
			folded++
			continue
		}
		const parent = u.parent === undefined ? undefined : byOrg.get(u.parent)
		if (parent === undefined || !onlyChild(parent.orgNumber)) {
			out.push(u)
			continue
		}
		const merged: DiscoveredUnit = { ...u, orgForm: parent.orgForm }
		const website = u.website ?? parent.website
		if (website !== undefined) merged.website = website
		const code = u.naeringskode ?? parent.naeringskode
		if (code !== undefined) merged.naeringskode = code
		out.push(merged)
	}
	return { units: out, folded }
}

// A Brreg unit and a page belong together by the unit's website or the org number the page
// carries (Nav office data): a strong match. Name plus the same Kartverket address id only
// suggests it: a weak match.
function belongs(u: DiscoveredUnit, p: ExtractedPage, addressId: MatchInput["addressId"]): "strong" | "weak" | undefined {
	if (u.website !== undefined) {
		const site = normaliseUrl(u.website)
		if (site === normaliseUrl(p.url) || site === normaliseUrl(p.finalUrl)) return "strong"
	}
	if (p.orgNumber !== undefined && p.orgNumber === u.orgNumber) return "strong"
	const name = pageName(p)
	const address = pageAddress(p)
	if (name === undefined || address === undefined || u.address === undefined) return undefined
	const id = addressId(address)
	return id !== undefined && id === addressId(u.address) && namesMatch(u.name, name) ? "weak" : undefined
}

const byUnitId = (a: UnitGroup, b: UnitGroup) => (a.unitId < b.unitId ? -1 : a.unitId > b.unitId ? 1 : 0)

// Which pages belong to which unit, and whether each unit gets in without my look. Exactly one
// unit for one page, that unit on no other page, a heading that names the unit, a known
// category and a known provider type is automatic. Anything else is one question for me.
// Reasons never hold a name or a value.
export function matchUnits(input: MatchInput): MatchResult {
	let pagesWithProblem = 0
	let nationalUnmatched = 0
	let noUnitId = 0
	const { units, folded } = foldParents(input.units)
	const usable = input.pages.filter((p) => {
		if (p.problem === undefined) return true
		pagesWithProblem++
		return false
	})
	const unitsOf = new Map<ExtractedPage, DiscoveredUnit[]>()
	const pagesOf = new Map<DiscoveredUnit, ExtractedPage[]>()
	for (const p of usable) {
		const strong: DiscoveredUnit[] = []
		const weak: DiscoveredUnit[] = []
		for (const u of units) {
			const how = belongs(u, p, input.addressId)
			if (how === "strong") strong.push(u)
			else if (how === "weak") weak.push(u)
		}
		// A website or an org number names the unit; a strong match leaves the weak ones out.
		const found = strong.length > 0 ? strong : weak
		unitsOf.set(p, found)
		for (const u of found) pagesOf.set(u, [...(pagesOf.get(u) ?? []), p])
	}
	const groups = new Map<string, UnitGroup>()
	for (const [u, pages] of pagesOf) {
		const shared = pages.some((p) => (unitsOf.get(p)?.length ?? 0) > 1)
		const h1 = pages.length === 1 && !shared ? pageName(pages[0] as ExtractedPage) : undefined
		// A hub page a Brreg website points at ("Familie og oppvekst") must not lend its title, or
		// its number, to one unit without my look.
		const named = h1 !== undefined && namesMatch(u.name, h1)
		const urls = pages.map((p) => p.finalUrl)
		const legevakt = pages.some((p) => {
			const n = pageName(p)
			return n !== undefined && input.nklmLegevakt(n)
		})
		const names = [u.name, ...pages.flatMap((p) => pageName(p) ?? [])]
		const cat = categoriesFor({
			...(u.naeringskode === undefined ? {} : { naeringskode: u.naeringskode }),
			urls,
			names,
			nklmLegevakt: legevakt,
		})
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
					: !named
						? "the page heading does not name the unit"
						: providerType === undefined
							? "the provider type is unknown"
							: undefined
		// Suggestions reach the question whatever the reason, so a helsestasjon is offered
		// familie-og-barn.
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
			name: named && h1 !== undefined ? h1 : u.name,
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
		const cat = categoriesFor({ urls: [p.finalUrl], names: [name], nklmLegevakt: input.nklmLegevakt(name) })
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
	const unitsWithoutPage = units.filter((u) => !pagesOf.has(u)).length
	return {
		groups: [...groups.values()].sort(byUnitId),
		noUnitId,
		unitsWithoutPage,
		pagesWithProblem,
		nationalUnmatched,
		foldedParents: folded,
	}
}
```

- [ ] **Step 5: Run the tests to see them pass**

Run: `npx vitest run test/categories.test.ts test/include.test.ts`
Expected: PASS. The two units in "never includes a page that two register units match" both list the page as their website (the fixture default): two Brreg sub-units pointing at one kommune page, the realistic case.

- [ ] **Step 6: Show it red once**

One break per check, each restored before the next. Note every one for the PR body.

1. In `matchUnits`, change `const shared = pages.some((p) => (unitsOf.get(p)?.length ?? 0) > 1)` to `const shared = false`: FAIL on "never includes a page that two register units match".
2. In `categoriesFor`, change `!ambiguous &&` to `true &&`: FAIL on "keeps the ambiguous codes and barnevernvakt in review, even beside a path word".
3. In `lastSegmentWords`, read every segment (`segments.join("-")` in place of `last`): FAIL on "reads the last path segment only".
4. In `categoriesFor`, change `known: pathKrisesenter || nameKrisesenter` to `known: true`: FAIL on "knows 87.999 only beside a krisesenter word".
5. In `SN_CATEGORIES` and `PATH_CATEGORIES`, set helsestasjon's `known` to `true`: FAIL on "sends a helsestasjon to review, suggesting familie-og-barn".
6. In `matchUnits`, change `const found = strong.length > 0 ? strong : weak` to `const found = [...strong, ...weak]`: FAIL on "lets a website match leave out a unit that matches by name and address only".
7. In `foldParents`, return `{ units: [...units], folded: 0 }` at the top: FAIL on "folds a main unit and its only sub-unit into one".
8. In `matchUnits`, change `const named = h1 !== undefined && namesMatch(u.name, h1)` to `const named = true`: FAIL on "sends a unit to review when its page's heading does not name it".
9. In `providerTypeFor`, delete the line `if (form !== undefined && host !== undefined && form !== host) return undefined`: FAIL on "reads the org form before the host".

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
  - `buildLookups(input: { manifest: readonly ManifestEntry[]; readHtml: (entry: ManifestEntry) => string | undefined; allowList: AllowList; validKommuner: ReadonlySet<string>; addresses: ReadonlyMap<string, AddressHit | undefined>; checkedUrls?: ReadonlyMap<string, number | undefined> }): Lookups` (`checkedUrls` is keyed by `normaliseUrl`)
  - `contextFor(lookups: Lookups, unit: UnitFacts, peers: readonly Candidate[]): GateContext`
  - `resolveAddresses(get: Get, addresses: Iterable<string>, kommune: string): Promise<Map<string, AddressHit | undefined>>`
  - `resolveUrls(get: Get, urls: Iterable<string>): Promise<Map<string, number | undefined>>` (the status each distinct URL answered, keyed by `normaliseUrl`)
  - `kartverketForm(value: string, hit: AddressHit): string` (Kartverket's street text, then the page's postcode and place)

- [ ] **Step 1: Write the failing test**

Create `pipeline/test/context.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import type { ManifestEntry } from "../src/io/pageCache.ts"
import { AllowList } from "../src/net/allowList.ts"
import { buildLookups, contextFor, kartverketForm, resolveAddresses, resolveUrls } from "../src/verify/context.ts"
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
	checkedUrls: new Map([["eksempel.kommune.no/ny-side", 200]]),
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

	it("gives Nav no register pass: a Nav office page counts only when the crawler fetched it", () => {
		expect(lookups.robotsAllows("https://www.nav.no/kontor/nav-eksempel")).toBe(false)
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

	it("gives the status verify checked itself for a URL I typed in review", () => {
		expect(lookups.urlStatus("https://eksempel.kommune.no/ny-side/")).toBe(200)
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

describe("resolveUrls", () => {
	it("asks once per distinct URL, compared normalised, and keeps what a failed fetch gave", async () => {
		const asked: string[] = []
		const get = fakeGet({ "https://www.eksempel.kommune.no/ny-side/": { body: "<html></html>" } })
		const counting: typeof get = async (url, kind) => {
			asked.push(url)
			return get(url, kind)
		}
		const map = await resolveUrls(counting, [
			"https://www.eksempel.kommune.no/ny-side/",
			"https://www.eksempel.kommune.no/ny-side",
			"https://www.eksempel.kommune.no/borte/",
		])
		expect(asked).toHaveLength(2)
		expect(map.get("eksempel.kommune.no/ny-side")).toBe(200)
		expect(map.get("eksempel.kommune.no/borte")).toBe(404)
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

// Registers whose host also serves page evidence. Nav's host serves the office pages the crawler
// fetches, so a Nav URL passes robots only when the manifest holds it.
const PAGE_REGISTERS: ReadonlySet<string> = new Set(["nav"])
const REGISTER_HOSTS: ReadonlySet<string> = new Set(
	Object.entries(REGISTER_SOURCES)
		.filter(([name]) => !PAGE_REGISTERS.has(name))
		.map(([, r]) => r.host)
)

const hostOf = (url: string) => {
	try {
		return new URL(url).hostname.toLowerCase()
	} catch {
		return undefined
	}
}

// Every lookup the gates need that does not depend on the unit. Built once per kommune from the
// cache: robots.txt was checked when the crawler fetched each page, so a URL the manifest holds
// passed it; the host of a register that serves no pages is a documented open API. Anything else
// is refused. A URL I typed in review gets the status verify asked the crawler for (checkedUrls).
export function buildLookups(input: {
	manifest: readonly ManifestEntry[]
	readHtml: (entry: ManifestEntry) => string | undefined
	allowList: AllowList
	validKommuner: ReadonlySet<string>
	addresses: ReadonlyMap<string, AddressHit | undefined>
	checkedUrls?: ReadonlyMap<string, number | undefined>
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
		urlStatus: (url) => byNormalised.get(normaliseUrl(url))?.status ?? input.checkedUrls?.get(normaliseUrl(url)),
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

// The status of each website or chat URL I typed in review, asked once through the crawler, so
// its allow-list, robots and pace apply. A URL the crawler refuses has no 200, so the validity gate
// sends it to review, and my decision settles that review (Task 2).
export async function resolveUrls(get: Get, urls: Iterable<string>): Promise<Map<string, number | undefined>> {
	const byKey = new Map<string, string>()
	for (const url of urls) if (!byKey.has(normaliseUrl(url))) byKey.set(normaliseUrl(url), url)
	const keys = [...byKey.keys()]
	const answers = await Promise.all(keys.map((k) => get(byKey.get(k) ?? k, "html")))
	return new Map(keys.map((k, i) => [k, answers[i]?.status]))
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
Expected: PASS. The fake Kartverket answer is keyed by `addressQuery("storgata 1 a", "3405")`, the street as `splitAddress` normalises it; if the test misses, print the URL the reader asked for (it holds only the fictional street) and key the route by it. `checkedUrls` and `resolveUrls` key by `normaliseUrl`, which drops the scheme, `www.` and the trailing slash (`eksempel.kommune.no/ny-side`). `fakeGet` answers a URL it has no route for with status 404.

- [ ] **Step 5: Show it red once**

Make each break, run the file, see the FAIL, restore, run: PASS. Note each one for the PR body.

1. Change `robotsAllows: (url) => byUrl.has(url) || ...` to `robotsAllows: () => true`: FAIL on "lets robots pass only for a URL the crawler fetched".
2. Make `PAGE_REGISTERS` an empty set: FAIL on "gives Nav no register pass".
3. In `urlStatus`, drop `?? input.checkedUrls?.get(normaliseUrl(url))`: FAIL on "gives the status verify checked itself".
4. In `resolveUrls`, key `byKey` by the raw URL instead of `normaliseUrl(url)`: FAIL on "asks once per distinct URL" (three asks, not two).

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
- Modify: `pipeline/package.json` (script `verify`), `pipeline/src/schema/lock.ts` (`ORIGINS`, `LockField.origin`), `pipeline/src/gates/types.ts` (`Origin` from `ORIGINS`), `pipeline/src/gates/run.ts` (writes `origin`), `pipeline/schema/lock.schema.json` (regenerated)
- Test: `pipeline/test/candidates.test.ts`, `pipeline/test/verify.test.ts`, `pipeline/test/curatedWrite.test.ts`, `pipeline/test/run.test.ts` (one case)

**Interfaces:**
- Consumes: `matchUnits`, `UnitGroup`, `MatchResult.foldedParents` (Task 14), `buildLookups`, `contextFor`, `resolveAddresses`, `resolveUrls`, `kartverketForm` (Task 15), `runGates` (Task 2), `lavterskel` (`gates/lavterskel.ts`), `norwegianDate` (Task 2), `findDecision`, `CuratedFile`, `CuratedUnit`, `ReviewDecision` (Task 1), `LockFile`, `LockField`, `LockUnit` (Task 1), `possibleNames` (Task 2), `brregRecordUrl` (Task 13), `NKLM_PAGE`, `nklmRecordId`, `NklmRow`, `kommuneLookup`, `readNklm` (Task 12), `namesMatch`, `slugify`, `extractScope`, `readExtraction` (Task 10), `quoteHasText` (`text/normalise.ts`).
- Produces:
  - `schema/lock.ts`: `ORIGINS` (the six origins, `as const`), `LockField.origin?` (written for a field that is not dropped, so review can check my edit with the origin verify will use).
  - `verify/candidates.ts`: `type Proposal = { candidate: Candidate; block?: number; rank?: 1 | 2 | 3; review?: string }`, `type CandidateInput = { kommune: string; group: UnitGroup; sharers: ReadonlyMap<string, readonly UnitGroup[]>; switchboard?: { phone: string; orgNumber: string }; kommunePages: readonly ExtractedPage[]; nklm?: { date: string; rows: readonly NklmRow[] }; places: readonly string[] }`, `unitCandidates(input: CandidateInput): { chosen: Proposal[]; peers: Candidate[] }`, `SHARED_FIELDS`.
  - `verify/verify.ts`: `type VerifyInput`, `type VerifyCounts`, `verifyKommune(input: VerifyInput): Promise<{ lock: LockFile; curated: CuratedFile; counts: VerifyCounts }>`, `verifyAndWrite(dataDir: string, input: VerifyInput, io?: RenameIo): Promise<VerifyCounts>`, `formatVerifySummary(counts: readonly VerifyCounts[]): string`, `lockPath(dataDir: string, kommune: string): string`, `curatedPathFor(dataDir: string, kommune: string, name: string): string`, `findCuratedPath(dataDir: string, kommune: string): string | undefined`, `readCuratedFile(path: string): CuratedFile`, `class VerifyError`.
  - `curate/write.ts`: `type RenameIo = { rename?: (from: string, to: string) => void; sleep?: (ms: number) => Promise<void>; attempts?: number; waitMs?: number }`, `class SaveError extends Error { readonly tempPath: string }`, `class CuratedWriteError extends SaveError`, `writeCuratedFile(path: string, file: CuratedFile, io?: RenameIo): Promise<void>`, `writeLockFile(path: string, file: LockFile, io?: RenameIo): Promise<void>`, `class DataBusyError extends Error`, `holdDataDir(dataDir: string): { release: () => void }` (takes `<data>/.pipeline.lock`), `isRepoData(dataDir: string, repoData: string, platform?: NodeJS.Platform): boolean`.

- [ ] **Step 1: Write the failing tests for the curated write**

Create `pipeline/test/curatedWrite.test.ts`:

```ts
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
	CuratedWriteError,
	DataBusyError,
	holdDataDir,
	isRepoData,
	SaveError,
	writeCuratedFile,
	writeLockFile,
} from "../src/curate/write.ts"
import type { CuratedFile } from "../src/schema/curated.ts"
import { curatedUnit, lockUnit } from "./helpers.ts"

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

describe("writeLockFile", () => {
	it("retries a busy rename too, and keeps the temporary file when it keeps failing", async () => {
		const path = join(mkdtempSync(join(tmpdir(), "varde-lock-")), "lock", "3405.json")
		const lock = { kommune: "3405", units: [lockUnit()] }
		let calls = 0
		await writeLockFile(path, lock, {
			rename: (from, to) => {
				calls++
				if (calls === 1) throw busy()
				renameSync(from, to)
			},
			sleep: noWait,
		})
		expect(JSON.parse(readFileSync(path, "utf8")).kommune).toBe("3405")
		const err = await writeLockFile(path, lock, { rename: () => { throw busy() }, sleep: noWait }).catch((e) => e)
		expect(err).toBeInstanceOf(SaveError)
		expect(String(err.message)).toContain("the lock file")
	})
})

describe("holdDataDir", () => {
	it("lets one command at a time write into the data folder, and frees it on release", () => {
		const dir = mkdtempSync(join(tmpdir(), "varde-data-"))
		const held = holdDataDir(dir)
		expect(existsSync(join(dir, ".pipeline.lock"))).toBe(true)
		expect(() => holdDataDir(dir)).toThrow(DataBusyError)
		held.release()
		expect(existsSync(join(dir, ".pipeline.lock"))).toBe(false)
		holdDataDir(dir).release()
	})
})

describe("isRepoData", () => {
	const repo = join(tmpdir(), "varde-repo", "data")
	it("knows the repo's data folder in any spelling, and every folder inside it", () => {
		mkdirSync(join(repo, "curated"), { recursive: true })
		expect(isRepoData(repo, repo)).toBe(true)
		expect(isRepoData(`${repo}/`, repo)).toBe(true)
		expect(isRepoData(join(repo, "curated"), repo)).toBe(true)
		expect(isRepoData(repo.toUpperCase(), repo, "win32")).toBe(true)
		expect(isRepoData(join(repo, "..", "annet"), repo)).toBe(false)
	})
})
```

- [ ] **Step 2: Write `src/curate/write.ts`**

```ts
import { closeSync, existsSync, mkdirSync, openSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { CuratedFile } from "../schema/curated.ts"
import { LockFile } from "../schema/lock.ts"

export type RenameIo = {
	rename?: (from: string, to: string) => void
	sleep?: (ms: number) => Promise<void>
	attempts?: number
	waitMs?: number
}

// A file that could not be renamed into place. The temporary file is kept, so nothing is lost.
export class SaveError extends Error {
	readonly tempPath: string

	constructor(message: string, tempPath: string) {
		super(message)
		this.name = "SaveError"
		this.tempPath = tempPath
	}
}

export class CuratedWriteError extends SaveError {
	constructor(tempPath: string) {
		super(`could not save the curated file; my answers are kept in ${tempPath}`, tempPath)
		this.name = "CuratedWriteError"
	}
}

// Another program can hold a file for a moment on Windows (an editor, a virus scanner).
const RETRYABLE = new Set(["EPERM", "EBUSY", "EACCES"])
const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

// One file, whole: written to a temporary file, then renamed over the old one, so a crash
// mid-write leaves the old file whole. A busy rename is retried; one that keeps failing stops
// with the temporary file kept.
async function saveWhole(path: string, text: string, io: RenameIo, fail: (temp: string) => SaveError): Promise<void> {
	const rename = io.rename ?? renameSync
	const sleep = io.sleep ?? pause
	const attempts = io.attempts ?? 5
	mkdirSync(dirname(path), { recursive: true })
	const temp = `${path}.${process.pid}.tmp`
	writeFileSync(temp, text)
	for (let attempt = 1; ; attempt++) {
		try {
			rename(temp, path)
			return
		} catch (err) {
			const code = (err as { code?: string }).code ?? ""
			if (!RETRYABLE.has(code) || attempt >= attempts) throw fail(temp)
			await sleep(io.waitMs ?? 200)
		}
	}
}

// Each answer is written at once, checked against the schema first.
export async function writeCuratedFile(path: string, file: CuratedFile, io: RenameIo = {}): Promise<void> {
	const parsed = CuratedFile.safeParse(file)
	if (!parsed.success) throw new Error("the curated file does not match its schema: nothing was written")
	await saveWhole(path, `${JSON.stringify(parsed.data, null, "\t")}\n`, io, (temp) => new CuratedWriteError(temp))
}

// The lock file gets the same retry: Windows holds it as readily as the curated file.
export async function writeLockFile(path: string, file: LockFile, io: RenameIo = {}): Promise<void> {
	const parsed = LockFile.safeParse(file)
	if (!parsed.success) throw new Error("the lock file does not match its schema: nothing was written")
	const fail = (temp: string) => new SaveError(`could not save the lock file; it is kept in ${temp}`, temp)
	await saveWhole(path, `${JSON.stringify(parsed.data, null, "\t")}\n`, io, fail)
}

export class DataBusyError extends Error {
	constructor() {
		super(
			"another verify or review is using this data folder. If none is running, delete .pipeline.lock in it and start again"
		)
		this.name = "DataBusyError"
	}
}

// One writer at a time in a data folder. verify and review each read the curated file and later
// write it whole, so two at once would lose my answers. The "wx" flag creates the file only when it
// does not exist yet, in one step.
export function holdDataDir(dataDir: string): { release: () => void } {
	mkdirSync(dataDir, { recursive: true })
	const path = join(dataDir, ".pipeline.lock")
	let fd: number
	try {
		fd = openSync(path, "wx")
	} catch (err) {
		if ((err as { code?: string }).code === "EEXIST") throw new DataBusyError()
		throw err
	}
	writeFileSync(fd, `${process.pid}\n`)
	closeSync(fd)
	let released = false
	return {
		release: () => {
			if (released) return
			released = true
			rmSync(path, { force: true })
		},
	}
}

// The real path when the folder exists, so a junction or a short name resolves the same way.
const real = (path: string) => (existsSync(path) ? realpathSync.native(path) : resolve(path))

// True for the repo's own data/ and every folder inside it, in any spelling: Windows paths ignore
// case, a trailing slash or "x/.." changes nothing, and a junction resolves to its target.
export function isRepoData(dataDir: string, repoData: string, platform: NodeJS.Platform = process.platform): boolean {
	const fold = (p: string) => (platform === "win32" ? p.toLowerCase() : p)
	const rel = relative(fold(real(repoData)), fold(real(dataDir)))
	return rel === "" || (!rel.startsWith("..") && !rel.startsWith("/") && !/^[a-z]:/i.test(rel))
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
// Task 14's default unit: a barneverntjeneste (SN 88.991), one of the codes that include by rule.
// A helsestasjon goes to review, so it cannot show an automatic include.
const BV = `${K}/barnevern/`
const H1 = "<h1>Eksempel barneverntjeneste</h1>"
const UNIT_PAGE = html(
	[
		H1,
		"<p>Barneverntjenesten er gratis, og du trenger ikke henvisning.</p>",
		"<h2>Kontakt</h2>",
		"<p>Telefon: 62 00 00 00</p>",
		'<p>E-post: <a href="mailto:barnevern@eksempel.kommune.no">barnevern@eksempel.kommune.no</a></p>',
		"<p>Besøksadresse: Storgata 1, 2609 Lillehammer</p>",
		"<h2>Åpningstider</h2>",
		"<p>Mandag 08.00-15.30</p>",
	].join("")
)
const unit = (over: Partial<DiscoveredUnit> = {}): DiscoveredUnit => ({
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
const answer = (decisions: CuratedFile["units"][number]["decisions"], over: Partial<CuratedFile["units"][number]> = {}) => ({
	unitId: "org:999999991",
	name: "Eksempel barneverntjeneste",
	include: true,
	sources: { orgNumber: "999999991", pages: [BV] },
	categories: ["familie-og-barn" as const],
	providerType: "offentlig" as const,
	decisions,
	...over,
})
const address = (id: string, text: string) => ({
	body: JSON.stringify({ adresser: [{ adresseid: id, adressetekst: text, kommunenummer: "3405", postnummer: "2609" }] }),
})
const KARTVERKET = {
	[addressQuery("storgata 1", "3405")]: address("a1", "Storgata 1"),
	[addressQuery("storgata 2", "3405")]: address("a2", "Storgata 2"),
}
const kartverket = fakeGet(KARTVERKET)
const fetched = (url: string, body: string, fetchedAt = "2026-11-06T09:00:00Z"): Fetched => ({
	ok: true,
	url,
	finalUrl: url,
	status: 200,
	contentType: "text/html",
	headers: {},
	body,
	fetchedAt,
})

function setup(o: {
	pages: Record<string, string>
	units?: DiscoveredUnit[]
	curated?: CuratedFile
	switchboard?: { phone: string; orgNumber: string }
	get?: Get
	// Pages fetched again after extract ran, so the extraction file is older than the cache.
	refetched?: Record<string, string>
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
	for (const [url, body] of Object.entries(o.refetched ?? {})) {
		cache.put(fetched(url, body, "2026-11-06T11:00:00Z"), { adapter: "acos" })
	}
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
		const { input } = setup({ pages: { [BV]: UNIT_PAGE }, units: [unit()] })
		const { lock, curated, counts } = await verifyKommune(input)
		const [u] = lock.units
		expect(u?.unitId).toBe("org:999999991")
		expect(u?.inclusion?.status).toBe("auto")
		const status = Object.fromEntries(Object.entries(u?.fields ?? {}).map(([k, f]) => [k, [f?.status, f?.value]]))
		expect(status).toMatchObject({
			name: ["accepted", "Eksempel barneverntjeneste"],
			website: ["accepted", BV],
			phone: ["accepted", "62 00 00 00"],
			email: ["accepted", "barnevern@eksempel.kommune.no"],
			address: ["accepted", "Storgata 1, 2609 Lillehammer"],
			openingHours: ["accepted", `Mandag kl. 08:00${D}15:30`],
		})
		expect(u?.fields.address?.addressId).toBe("a1")
		expect(u?.fields.phone?.origin).toBe("unitContact")
		expect(curated.units).toMatchObject([
			{ unitId: "org:999999991", include: true, categories: ["familie-og-barn"], providerType: "offentlig" },
		])
		expect(counts).toMatchObject({ units: 1, auto: 1, inclusionReview: 0, pagesStale: 0, answersUnsettled: 0 })
	})

	it("keeps a role mobile with its role, and no name anywhere in the lock", async () => {
		const page = html(`${H1}<h2>Kontakt</h2><p>Avdelingsleder Kari Nordmann 900 00 000</p>`)
		const { input } = setup({ pages: { [BV]: page }, units: [unit({ address: undefined })] })
		const { lock } = await verifyKommune(input)
		expect(lock.units[0]?.fields.phone).toMatchObject({ status: "accepted", value: "900 00 000", role: "Avdelingsleder" })
		expect(JSON.stringify(lock)).not.toMatch(/Kari|Nordmann/)
	})

	it("sends two different service numbers on one rank to review", async () => {
		const page = html(`${H1}<h2>Kontakt</h2><p>Telefon: 62 00 00 00</p><p>Telefon: 62 00 00 02</p>`)
		const { input } = setup({ pages: { [BV]: page }, units: [unit({ address: undefined })] })
		const { lock } = await verifyKommune(input)
		expect(lock.units[0]?.fields.phone).toMatchObject({ status: "review", reason: expect.stringContaining("agreement") })
	})

	it("uses the kommune's Brreg switchboard, labelled, only when ranks 1 and 2 are empty", async () => {
		const page = html(`${H1}<p>Vi har drop-in.</p>`)
		const { input } = setup({
			pages: { [BV]: page },
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
		const page = html(`${H1}<h2>Kontakt</h2><p>Telefon: 62 00 00 00</p>`)
		const units = [
			unit({ address: undefined }),
			unit({ orgNumber: "999999992", name: "EKSEMPEL KOMMUNE BARNEVERNTJENESTE NORD", address: undefined }),
		]
		const { input } = setup({ pages: { [BV]: page }, units })
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
			unit({
				orgNumber: `99999999${i + 1}`,
				name: `EKSEMPEL HELSESTASJON ${part}`,
				naeringskode: "86.942",
				website: hub,
				address: undefined,
			})
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
		const page = html(`${H1}<h2>Kontakt</h2><p>Telefon: 62 00 00 00</p><p>E-post: post@eksempel.kommune.no</p>`)
		const units = [
			unit({ address: undefined }),
			unit({ orgNumber: "999999992", name: "EKSEMPEL KOMMUNE BARNEVERNTJENESTE NORD", address: undefined }),
		]
		const curated: CuratedFile = {
			kommune: "3405",
			name: "Lillehammer",
			units: [
				answer([
					{ field: "phone", value: "62 00 00 00", sourceUrl: BV, decision: "edit", editedValue: "62 00 00 09", decidedOn: "2026-11-06" },
					{ field: "email", value: "post@eksempel.kommune.no", sourceUrl: BV, decision: "reject", decidedOn: "2026-11-06" },
				]),
				answer([{ field: "phone", value: "62 00 00 00", sourceUrl: BV, decision: "accept", decidedOn: "2026-11-06" }], {
					unitId: "org:999999992",
					name: "Eksempel barneverntjeneste nord",
					sources: { orgNumber: "999999992", pages: [BV] },
				}),
			],
		}
		const { input } = setup({ pages: { [BV]: page }, units, curated })
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
		const page = html(`${H1}<h2>Kontakt</h2><p>Telefon: 62 00 00 00</p>`)
		const decisions = [{ field: "phone" as const, value: "62 00 00 00", sourceUrl: BV, decision: "edit" as const, editedValue: "12345", decidedOn: "2026-11-06" }]
		const curated: CuratedFile = { kommune: "3405", name: "Lillehammer", units: [answer(decisions)] }
		const { input } = setup({ pages: { [BV]: page }, units: [unit({ address: undefined })], curated })
		const { lock } = await verifyKommune(input)
		expect(lock.units[0]?.fields.phone).toMatchObject({ status: "dropped", reason: expect.stringContaining("validity") })
	})

	it("copies the role I typed into an edited mobile, so the safety gate passes it", async () => {
		const page = html(`${H1}<h2>Kontakt</h2><p>Telefon: 62 00 00 00</p>`)
		const decisions = [
			{
				field: "phone" as const,
				value: "62 00 00 00",
				sourceUrl: BV,
				decision: "edit" as const,
				editedValue: "900 00 009",
				role: "Avdelingsleder",
				decidedOn: "2026-11-06",
			},
		]
		const curated: CuratedFile = { kommune: "3405", name: "Lillehammer", units: [answer(decisions)] }
		const { input } = setup({ pages: { [BV]: page }, units: [unit({ address: undefined })], curated })
		const { lock } = await verifyKommune(input)
		expect(lock.units[0]?.fields.phone).toMatchObject({ status: "accepted", value: "900 00 009", role: "Avdelingsleder" })
	})

	it("resolves my edited address through Kartverket, so the edit is accepted with its address id", async () => {
		const decisions = [
			{
				field: "address" as const,
				value: "Storgata 1, 2609 Lillehammer",
				sourceUrl: BV,
				decision: "edit" as const,
				editedValue: "Storgata 2, 2609 Lillehammer",
				decidedOn: "2026-11-06",
			},
		]
		const curated: CuratedFile = { kommune: "3405", name: "Lillehammer", units: [answer(decisions)] }
		const { input } = setup({ pages: { [BV]: UNIT_PAGE }, units: [unit()], curated })
		const { lock } = await verifyKommune(input)
		expect(lock.units[0]?.fields.address).toMatchObject({ status: "accepted", value: "Storgata 2, 2609 Lillehammer", addressId: "a2" })
	})

	it("checks my edited website through the crawler, so a URL that answers 200 is accepted", async () => {
		const mine = `${K}/barnevern/kontakt/`
		const decisions = [
			{ field: "website" as const, value: BV, sourceUrl: BV, decision: "edit" as const, editedValue: mine, decidedOn: "2026-11-06" },
		]
		const curated: CuratedFile = { kommune: "3405", name: "Lillehammer", units: [answer(decisions)] }
		const get = fakeGet({ ...KARTVERKET, [mine]: { body: "<html></html>", contentType: "text/html" } })
		const { input } = setup({ pages: { [BV]: UNIT_PAGE }, units: [unit()], curated, get })
		const { lock } = await verifyKommune(input)
		expect(lock.units[0]?.fields.website).toMatchObject({ status: "accepted", value: mine })
	})

	it("counts an answer that did not settle the field, and keeps it in review", async () => {
		const page = html(`${H1}<h2>Kontakt</h2><p>Telefon: 900 00 000</p>`)
		const decisions = [{ field: "phone" as const, value: "900 00 000", sourceUrl: BV, decision: "accept" as const, decidedOn: "2026-11-06" }]
		const curated: CuratedFile = { kommune: "3405", name: "Lillehammer", units: [answer(decisions)] }
		const { input } = setup({ pages: { [BV]: page }, units: [unit({ address: undefined })], curated })
		const { lock, counts } = await verifyKommune(input)
		expect(lock.units[0]?.fields.phone).toMatchObject({
			status: "review",
			evidence: { kind: "decision" },
			reason: expect.stringContaining("role label"),
		})
		expect(counts.answersUnsettled).toBe(1)
	})

	it("takes no values from a page fetched again after extract ran, my accepted answer included", async () => {
		const decisions = [{ field: "phone" as const, value: "62 00 00 00", sourceUrl: BV, decision: "accept" as const, decidedOn: "2026-11-06" }]
		const curated: CuratedFile = { kommune: "3405", name: "Lillehammer", units: [answer(decisions)] }
		const changed = html(`${H1}<h2>Kontakt</h2><p>Telefon: 62 00 00 07</p>`)
		const { input } = setup({ pages: { [BV]: UNIT_PAGE }, units: [unit()], curated, refetched: { [BV]: changed } })
		const { lock, counts } = await verifyKommune(input)
		expect(counts.pagesStale).toBe(1)
		expect(lock.units.flatMap((u) => Object.values(u.fields)).filter((f) => f?.status === "accepted")).toEqual([])
	})

	it("ignores my answer when its quotes are no longer on the page", async () => {
		const decisions = [{ field: "phone" as const, value: "62 00 00 00", sourceUrl: BV, decision: "accept" as const, decidedOn: "2026-11-06" }]
		const curated: CuratedFile = { kommune: "3405", name: "Lillehammer", units: [answer(decisions)] }
		const { input } = setup({ pages: { [BV]: UNIT_PAGE }, units: [unit()], curated })
		const moved = {
			...input.extraction,
			pages: input.extraction.pages.map((p) => ({
				...p,
				candidates: p.candidates.map((c) =>
					c.field === "phone" ? { ...c, evidence: { kind: "quote" as const, quotes: ["Telefon: 62 00 00 00 (fra 2025)"] } } : c
				),
			})),
		}
		const { lock } = await verifyKommune({ ...input, extraction: moved })
		expect(lock.units[0]?.fields.phone).toMatchObject({ status: "dropped", reason: expect.stringContaining("grounding") })
	})

	it("prints counts only", async () => {
		const { input } = setup({ pages: { [BV]: UNIT_PAGE }, units: [unit()] })
		const { counts } = await verifyKommune(input)
		const text = formatVerifySummary([counts])
		expect(text).toContain("3405 Lillehammer:")
		expect(text).toContain("0 pages fetched again since extract")
		for (const secret of ["62 00 00 00", "barnevern@", "eksempel.kommune.no", "Storgata", "999999991"]) {
			expect(text).not.toContain(secret)
		}
	})
})

describe("verifyAndWrite", () => {
	it("writes the lock and curated files of a kommune that completes", async () => {
		const { dir, input } = setup({ pages: { [BV]: UNIT_PAGE }, units: [unit()] })
		await verifyAndWrite(join(dir, "data"), input)
		expect(JSON.parse(readFileSync(lockPath(join(dir, "data"), "3405"), "utf8")).kommune).toBe("3405")
		expect(JSON.parse(readFileSync(join(dir, "data", "curated", "3405-lillehammer.json"), "utf8")).units).toHaveLength(1)
	})

	it("leaves the previous lock file byte for byte the same when the run stops halfway", async () => {
		const failing: Get = async () => {
			throw new Error("stopped halfway")
		}
		const { dir, input } = setup({ pages: { [BV]: UNIT_PAGE }, units: [unit()], get: failing })
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
	inclusion: { status: "auto", reason: "x", suggestedCategories: ["familie-og-barn"], providerType: "offentlig" },
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

- [ ] **Step 4: Run them to see them fail, then store each field's origin**

Run: `npx vitest run test/verify.test.ts test/candidates.test.ts`
Expected: FAIL, the modules do not exist.

Review checks my edit with `checkEdit` (Task 2), and the safety gate reads the origin: a mobile counts only from the unit's own contact block. So the lock keeps the origin verify used, and review rebuilds the candidate with it (Task 18). Without it, review would pass a mobile edit that verify then drops.

In `src/schema/lock.ts`, before `LockField`:

```ts
// Where a value was found. gates/types.ts reads its Origin type from here.
export const ORIGINS = ["register", "unitContact", "unitPage", "staffList", "article", "jsonLdAuthor"] as const
```

and in `LockField`, after `role: NonBlank.optional(),`, add `origin: z.enum(ORIGINS).optional(),`. In its `superRefine`, add `field.origin !== undefined` to the list of keys a dropped field may not keep. In `src/gates/types.ts`, replace the `Origin` union with `export type Origin = (typeof ORIGINS)[number]` and add `ORIGINS` to the existing `import type { Evidence, GateResult } from "../schema/lock.ts"` (a type-only import may be read with `typeof`, and it is erased, so `types.ts` still loads nothing at run time). Move the comment on each origin to a comment above `ORIGINS`. In `src/gates/run.ts`, add `origin: c.origin,` to `kept`, after `value: c.value,`.

Add to `test/run.test.ts`:

```ts
it("keeps the origin on a field it stores, and none on a dropped one", () => {
	expect(runGates(candidate(), context(), T)).toMatchObject({ status: "accepted", origin: "unitContact" })
	expect(runGates(candidate({ value: "12" }), context(), T).origin).toBeUndefined()
})
```

(`T` is the timestamp the file already uses; if it names it differently, use that name.) Then run `npm run schema` to regenerate `schema/lock.schema.json`, and `npx vitest run test/run.test.ts test/schema.test.ts`: PASS. A test that compares a whole stored field with `toEqual` now needs `origin: "unitContact"` (or the candidate's origin) added; add it, and change nothing else.

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
import { type RenameIo, writeCuratedFile, writeLockFile } from "../curate/write.ts"
import { matchUnits, type UnitGroup } from "../curate/include.ts"
import type { KommuneDiscovery } from "../discover/types.ts"
import { norwegianDate } from "../gates/grounding.ts"
import { runGates } from "../gates/run.ts"
import type { GateContext, UnitFacts } from "../gates/types.ts"
import type { ManifestEntry } from "../io/pageCache.ts"
import type { AllowList } from "../net/allowList.ts"
import type { Get } from "../net/crawler.ts"
import { namesMatch } from "../recall/match.ts"
import type { NklmRow } from "../registers/nklm.ts"
import type { FieldName } from "../schema/common.ts"
import { CuratedFile, type CuratedUnit, findDecision, type ReviewDecision } from "../schema/curated.ts"
import type { ExtractedPage, ExtractionFile } from "../schema/extraction.ts"
import { slugify } from "../schema/ids.ts"
import { LockFile, type LockField, type LockUnit } from "../schema/lock.ts"
import { normaliseText, siteHost } from "../text/normalise.ts"
import { type Proposal, unitCandidates } from "./candidates.ts"
import { buildLookups, contextFor, kartverketForm, resolveAddresses, resolveUrls } from "./context.ts"

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
	// A page fetched again after extract ran: its extraction no longer describes the cached page.
	pagesStale: number
	// A main unit and its only sub-unit counted as one (Task 14).
	foldedParents: number
	// My accepted or edited answers that verify still could not accept (a mobile with no role).
	answersUnsettled: number
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

// My answer stands on the page's quotes. The grounding gate passes a decision without reading the
// page (Task 2), so verify checks here that every original quote is still on the cached page, the
// way the grounding gate checks a quote. A register value has no quote and needs no check.
function quotesStillOnPage(c: Proposal["candidate"], ctx: GateContext): boolean {
	if (c.evidence.kind !== "quote") return true
	const page = ctx.pageText(c.sourceUrl)
	if (page === undefined) return false
	const onPage = normaliseText(page)
	return c.evidence.quotes.every((q) => normaliseText(q).length > 0 && onPage.includes(normaliseText(q)))
}

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
	const found = findDecision(decisions, { field: c.field, value: c.value, sourceUrl: c.sourceUrl })
	const d = found !== undefined && quotesStillOnPage(c, ctx) ? found : undefined
	if (d?.decision === "reject") {
		const { gates } = runGates(c, ctx, now)
		const field: LockField = {
			status: "dropped",
			sourceUrl: c.sourceUrl,
			fetchedAt: c.fetchedAt,
			verifiedAt: now,
			gates,
			reason: `my decision of ${norwegianDate(d.decidedOn)}: rejected`,
		}
		return { field, unsettled: false }
	}
	if (d !== undefined) {
		const original = c.evidence.kind === "decision" ? c.evidence.original : c.evidence
		c = {
			...c,
			evidence: { kind: "decision", decidedOn: d.decidedOn, original },
			...(d.decision === "edit" ? { value: d.editedValue ?? c.value } : {}),
			// The role I typed with an edited mobile: the safety gate passes a mobile only with one.
			...(d.role === undefined ? {} : { role: d.role }),
		}
		const field = runGates(c, ctx, now)
		return { field, unsettled: field.status !== "accepted" }
	}
	const field = runGates(c, ctx, now)
	return { field: p.review === undefined ? field : toReview(field, p.review), unsettled: false }
}

// The pages verify may use: those whose extraction describes the page the cache holds now. A page
// fetched again after extract ran (or purged from the cache) gives no values until extract runs
// again, so a value I accepted can never outlive the page it came from.
function freshPages(pages: readonly ExtractedPage[], manifest: readonly ManifestEntry[]): { fresh: ExtractedPage[]; stale: number } {
	const byUrl = new Map(manifest.map((e) => [e.url, e]))
	const fresh: ExtractedPage[] = []
	let stale = 0
	for (const p of pages) {
		if (byUrl.get(p.url)?.fetchedAt === p.fetchedAt) fresh.push(p)
		else stale++
	}
	return { fresh, stale }
}

// The values I typed in review that verify must look up before the gates run: addresses through
// Kartverket, website and chat URLs through the crawler.
function editedValues(curated: CuratedFile | undefined, fields: ReadonlySet<FieldName>): string[] {
	return (curated?.units ?? []).flatMap((u) =>
		u.decisions.flatMap((d) =>
			d.decision === "edit" && fields.has(d.field) && typeof d.editedValue === "string" ? [d.editedValue] : []
		)
	)
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
	const { fresh: pages, stale } = freshPages([...input.extraction.pages, ...(input.national?.pages ?? [])], input.manifest)
	const national = new Set((input.national?.pages ?? []).map((p) => p.url))
	const nklmHere = (input.nklm?.rows ?? []).filter((r) => r.kommuner.includes(k.kommune))
	const wanted = new Set<string>()
	for (const u of k.units) if (u.address !== undefined) wanted.add(u.address)
	for (const p of pages) for (const c of p.candidates) if (c.field === "address" && typeof c.value === "string") wanted.add(c.value)
	for (const r of nklmHere) if (r.address !== undefined) wanted.add(r.address)
	for (const a of editedValues(input.curated, new Set(["address"]))) wanted.add(a)
	const resolved = await resolveAddresses(input.get, wanted, k.kommune)
	const addresses = new Map(resolved)
	for (const [a, hit] of resolved) if (hit?.text !== undefined) addresses.set(kartverketForm(a, hit), hit)
	const checkedUrls = await resolveUrls(input.get, editedValues(input.curated, new Set(["website", "chatUrl"])))

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
		checkedUrls,
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
		pagesStale: stale,
		foldedParents: match.foldedParents,
		answersUnsettled: 0,
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
			const { field, unsettled } = settle(p, ctx, answer?.decisions ?? [], input.now)
			fields[p.candidate.field] = field
			counts[field.status]++
			if (unsettled) counts.answersUnsettled++
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

// Verify, then write the lock file and the curated file, each whole and each with the Windows
// retry. Nothing is written for a kommune that does not complete. The CLI holds the data folder
// (holdDataDir) for the whole run, so no review writes the curated file in between.
export async function verifyAndWrite(dataDir: string, input: VerifyInput, io: RenameIo = {}): Promise<VerifyCounts> {
	const { lock, curated, counts } = await verifyKommune(input)
	await writeLockFile(lockPath(dataDir, input.kommune.kommune), lock, io)
	const path = findCuratedPath(dataDir, input.kommune.kommune) ?? curatedPathFor(dataDir, input.kommune.kommune, input.kommune.name)
	await writeCuratedFile(path, curated, io)
	return counts
}

// What the command prints. Actions logs are public: counts, kommune numbers and names only.
export function formatVerifySummary(counts: readonly VerifyCounts[]): string {
	return counts
		.map(
			(c) =>
				`${c.kommune} ${c.name}: ${c.units} units (${c.auto} included by rule, ${c.inclusionReview} to ask), ` +
				`fields ${c.accepted} accepted, ${c.review} review, ${c.dropped} dropped; ` +
				`${c.answersUnsettled} of my answers did not settle their field; ` +
				`${c.foldedParents} main units folded into their only sub-unit; ` +
				`not stored: ${c.noUnitId} pages with no unit id, ${c.unitsWithoutPage} Brreg units with no page, ` +
				`${c.nationalUnmatched} national pages with no unit here, ${c.pagesWithProblem} pages with a problem, ` +
				`${c.pagesStale} pages fetched again since extract (run extract)`
		)
		.join("\n")
}
```

- [ ] **Step 7: Run the tests to see them pass**

Run: `npx vitest run test/verify.test.ts test/candidates.test.ts test/curatedWrite.test.ts`
Expected: PASS. When a status differs from the test, print the field's `reason` (reasons hold no values) to see which gate decided, and fix the stage, not the test. Two places that need care:

- In "accepts every value", the email must pass the source gate as `unitContact` on the unit's own host, and the website must find status 200 in the manifest by its final URL.
- In "three services", each unit's name only matches its own block heading if `namesMatch` reads "SØR" and "sør" alike (it folds both to "sor"). In "never includes a page two register units match", the block's heading is the h1 "Eksempel barneverntjeneste", which names both units, so both phones go to review: that is the rule working.
- In "checks my edited website", the fake `get` answers both the Kartverket route and my URL, since verify asks the crawler for my URL's status before the gates run. In "takes no values from a page fetched again", the only page is stale, so the unit has no page this run: no lock unit at all, and `pagesStale` is 1.

- [ ] **Step 8: Write `src/cli/verify.ts` and the script**

```ts
// Runs the five gates on what extract found and writes lock and curated files into --data.
//   node src/cli/verify.ts --data <dir> [--only 3405] [--cache <dir>] [--nklm-file <path>] [--nklm-fetch] [--dry-run]
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"
import { DataBusyError, holdDataDir, isRepoData, SaveError } from "../curate/write.ts"
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
// PR 3 never writes to the repo's own data/ or any folder inside it, in any spelling of the path:
// PR 4 lifts this when it commits the pilot.
const repoData = resolve(fileURLToPath(new URL("../../../data/", import.meta.url)))
if (isRepoData(dataDir, repoData)) {
	console.error("verify does not write to the repo's data/ yet: point --data at another folder")
	process.exit(2)
}

const root = values.cache ?? DEFAULT_CACHE_DIR
const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
// One writer at a time in the data folder: a review running now would lose my answers.
let held: { release: () => void } | undefined
try {
	held = values["dry-run"] ? undefined : holdDataDir(dataDir)
} catch (err) {
	console.error(err instanceof DataBusyError ? err.message : "verify could not take the data folder")
	process.exit(2)
}
process.on("SIGINT", () => {
	held?.release()
	process.exit(130)
})
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
	const known = err instanceof DiscoverError || err instanceof VerifyError || err instanceof SaveError
	console.error(known ? err.message : "verify stopped on an unexpected error")
	process.exitCode = 1
} finally {
	held?.release()
}
```

A kommune that throws stops the run after the kommuner before it were written whole; the kommune itself and the ones after it keep their previous files, and the message says it stopped. The data folder is freed in `finally` and on Ctrl+C, so a stopped run never leaves `.pipeline.lock` behind. A run killed outright does, and the next verify or review says so and names the file to delete. Inside `try` the error path sets `process.exitCode` instead of calling `process.exit`, so `finally` runs. `--dry-run` writes nothing, so it takes no hold. In `pipeline/package.json`, add `"verify": "node src/cli/verify.ts",` after `"extract"`.

- [ ] **Step 9: Show it red once**

Make each break, run the file named, see the FAIL, restore, run: PASS. Note each one for the PR body.

1. In `settle`, swap the order so the rule's review is applied before the decision check (`if (p.review !== undefined) return { field: toReview(runGates(c, ctx, now), p.review), unsettled: false }` as the first line after the address rewrite). `test/verify.test.ts`: FAIL on "applies my answers" (my accepted answer on the shared page stays in review).
2. In `settle`, delete the `...(d.role === undefined ? {} : { role: d.role })` line. `test/verify.test.ts`: FAIL on "copies the role I typed into an edited mobile".
3. In `verifyKommune`, delete the `editedValues(input.curated, new Set(["address"]))` loop. `test/verify.test.ts`: FAIL on "resolves my edited address through Kartverket".
4. Pass `[]` to `resolveUrls` instead of the edited URLs. `test/verify.test.ts`: FAIL on "checks my edited website through the crawler".
5. Make `freshPages` return every page as fresh. `test/verify.test.ts`: FAIL on "takes no values from a page fetched again after extract ran".
6. Make `quotesStillOnPage` return `true`. `test/verify.test.ts`: FAIL on "ignores my answer when its quotes are no longer on the page".
7. Return `unsettled: false` from the decision branch of `settle`. `test/verify.test.ts`: FAIL on "counts an answer that did not settle the field".
8. In `holdDataDir`, open with `"w"` instead of `"wx"`. `test/curatedWrite.test.ts`: FAIL on "lets one command at a time write into the data folder".
9. In `isRepoData`, drop the `fold` call on both sides. `test/curatedWrite.test.ts`: FAIL on "knows the repo's data folder in any spelling" (the upper-case Windows path).
10. In `writeLockFile`, call `saveWhole` with `{ ...io, attempts: 1 }`. `test/curatedWrite.test.ts`: FAIL on "retries a busy rename too".
11. In `runGates`, delete `origin: c.origin,` from `kept`. `test/run.test.ts`: FAIL on "keeps the origin on a field it stores".

- [ ] **Step 10: Lint, types, commit**

```bash
npx biome check --write . && npx biome ci . && npm run typecheck && npm test
git add src/verify/candidates.ts src/verify/verify.ts src/curate/write.ts src/cli/verify.ts src/schema/lock.ts src/gates/types.ts src/gates/run.ts schema/lock.schema.json package.json test/verify.test.ts test/candidates.test.ts test/curatedWrite.test.ts test/run.test.ts
git commit -m "feat(pipeline): add the verify stage: gates, my answers, and atomic lock and curated files"
```

---

### Task 17: Review building blocks: sanitising, the queue, one item on screen

**Files:**
- Create: `pipeline/src/review/sanitise.ts`, `pipeline/src/review/queue.ts`, `pipeline/src/review/render.ts`
- Test: `pipeline/test/sanitise.test.ts`, `pipeline/test/queue.test.ts`, `pipeline/test/render.test.ts`, `pipeline/test/reviewHelpers.ts`

**Interfaces:**
- Consumes: `LockFile`, `evidenceQuotes`, `Evidence`, `SourceRef` (Task 1), `Origin`, `LockField.origin` (Task 16), `CuratedFile`, `findDecision` (Task 1), `findCuratedPath`, `lockPath` (Task 16), `FIELD_NAMES`, `INVISIBLE` (`text/invisible.ts`, Task 2), `norwegianDate` (Task 2), `isMobile` (`gates/safety.ts`).
- Produces:
  - `review/sanitise.ts`: `sanitise(text: string): string`, `sanitiseCounted(text: string): { text: string; hidden: number }` (`hidden` is the number of characters removed, so render can say so).
  - `review/queue.ts`: `type FieldItem = { kind: "field"; kommune: string; unitId: string; unitName: string; field: FieldName; value: FieldValue; role?: string; origin?: Origin; evidence: Evidence; sourceUrl: string; reason: string; acute: boolean; categories: CategorySlug[]; unsettled?: string; answerKey?: FieldValue }` (`unsettled` is the date of my earlier answer that verify could not accept, `answerKey` the page value that answer is keyed by), `canAccept(item: FieldItem): boolean` (false for a mobile with no role: only an edit with a role, or a reject, settles it), `type IncludeItem = { kind: "include"; kommune: string; unitId: string; unitName: string; reason: string; suggestedCategories: CategorySlug[]; providerType?: ProviderType; sources: { kind: string; ref: string }[]; acute: boolean }`, `type ReviewItem = FieldItem | IncludeItem`, `type KommuneFiles = { kommune: string; lock: LockFile; curated: CuratedFile; curatedPath: string }`, `buildQueue(files: readonly KommuneFiles[]): ReviewItem[]`, `readKommuneFiles(dataDir: string, only?: string): KommuneFiles[]`, `kommuneArg(value: string | undefined, known: ReadonlySet<string>): { ok: true; kommune?: string } | { ok: false }`, `class ReviewError`.
  - `review/render.ts`: `renderItem(item: ReviewItem, at: number, of: number, color: boolean): string`, `FIELD_KEYS`, `FIELD_KEYS_NO_ACCEPT`, `INCLUDE_KEYS`.

- [ ] **Step 1: Write the failing tests**

Create `pipeline/test/sanitise.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { sanitise, sanitiseCounted } from "../src/review/sanitise.ts"

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

	it("strips every character text/invisible.ts names: tag characters, Hangul fillers, variation selectors", () => {
		expect(sanitise("Eksempel\u{E0041}\u3164 helse\uFE0Fstasjon\uFFF9")).toBe("Eksempel helsestasjon")
	})

	it("counts what it removed, so the screen can say that something was hidden", () => {
		expect(sanitiseCounted("62\u200b00 00 00")).toEqual({ text: "6200 00 00", hidden: 1 })
		expect(sanitiseCounted("linje\nto")).toEqual({ text: "linje to", hidden: 0 })
		expect(sanitiseCounted("\u001b[31mrød")).toEqual({ text: "rød", hidden: 5 })
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
import type { LockField, LockFile } from "../src/schema/lock.ts"
import { acceptedField, curatedUnit, lockUnit } from "./helpers.ts"

// A phone in review from the unit's contact block, as verify writes it (origin included).
export const reviewField = (over: Partial<LockField> = {}): LockField =>
	acceptedField({
		status: "review",
		origin: "unitContact",
		reason: "agreement: 1 other source(s) disagree",
		gates: acceptedField().gates.map((g) => (g.gate === "agreement" ? { ...g, pass: false, onFail: "review" as const, reason: "x" } : g)),
		...over,
	})
const reviewPhone = reviewField()
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
import { buildQueue, canAccept, type FieldItem, kommuneArg, readKommuneFiles } from "../src/review/queue.ts"
import { acceptedField, curatedUnit, lockUnit, PAGE_URL } from "./helpers.ts"
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

	it("asks again, labelled, when verify could not accept my earlier answer", () => {
		const decided = { kind: "decision" as const, decidedOn: "2026-11-06", original: { kind: "quote" as const, quotes: ["900 00 000"] } }
		const stuck = acceptedField({
			status: "review",
			value: "900 00 000",
			evidence: decided,
			origin: "unitContact",
			reason: "safety: a mobile on the unit page needs its role label",
		})
		const lock = { kommune: "3405", units: [lockUnit({ unitId: "org:999999991", fields: { phone: stuck } })] }
		const answered = curatedWith({
			units: [
				curatedUnit({
					unitId: "org:999999991",
					decisions: [{ field: "phone", value: "900 00 000", sourceUrl: PAGE_URL, decision: "accept", decidedOn: "2026-11-06" }],
				}),
			],
		})
		const [item] = buildQueue(readKommuneFiles(dataDir(lock, answered)))
		expect(item).toMatchObject({
			kind: "field",
			unsettled: "2026-11-06",
			answerKey: "900 00 000",
			origin: "unitContact",
			reason: "my answer of 06.11.2026 did not settle it: safety: a mobile on the unit page needs its role label",
		})
	})
})

describe("canAccept", () => {
	const item = (over: Partial<FieldItem>): FieldItem => ({
		kind: "field",
		kommune: "3405",
		unitId: "org:999999991",
		unitName: "Eksempel barneverntjeneste",
		field: "phone",
		value: "62 00 00 00",
		evidence: { kind: "quote", quotes: ["Telefon: 62 00 00 00"] },
		sourceUrl: PAGE_URL,
		reason: "agreement: 1 other source(s) disagree",
		acute: false,
		categories: ["familie-og-barn"],
		...over,
	})

	it("offers no accept for a mobile with no role: only an edit with a role, or a reject, settles it", () => {
		expect(canAccept(item({}))).toBe(true)
		expect(canAccept(item({ value: "900 00 000" }))).toBe(false)
		expect(canAccept(item({ value: "900 00 000", role: "Avdelingsleder" }))).toBe(true)
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
import { FIELD_KEYS_NO_ACCEPT, renderItem } from "../src/review/render.ts"

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

	it("offers no accept key for a mobile with no role", () => {
		const text = renderItem({ ...field, role: undefined }, 1, 1, false)
		expect(text).toContain(FIELD_KEYS_NO_ACCEPT)
		expect(text).not.toContain("a accept")
	})

	it("says how many hidden characters it removed, and says nothing when there were none", () => {
		expect(renderItem(field, 1, 1, false)).toContain("Note: 5 hidden or control characters were removed for display.")
		const clean = { ...field, evidence: { kind: "quote" as const, quotes: ["Avdelingsleder", "900 00 000"] } }
		expect(renderItem(clean, 1, 1, false)).not.toContain("Note:")
	})

	it("prints every review reason the rules give as it is", () => {
		for (const reason of [
			"the page heading does not name the unit",
			"the always-open claim shares a line with a number",
			"the block limits the always-open claim",
			'a short number with only "ring" beside it',
			"Nav lists a note on the hours",
			"Nav lists more than one reception",
		]) {
			expect(renderItem({ ...field, reason }, 1, 1, false)).toContain(`Why: ${reason}\n`)
		}
	})
})
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run test/sanitise.test.ts test/queue.test.ts test/render.test.ts`
Expected: FAIL, the modules do not exist.

- [ ] **Step 3: Write `src/review/sanitise.ts`**

```ts
import { INVISIBLE } from "../text/invisible.ts"

// Page text can hold terminal control codes. Everything a page gave (quotes, values, links) goes
// through here before it is printed, so a page cannot recolour, clear or rewrite my terminal, or
// make a quote or a link read differently from what it is. Each pattern scans forward once. The
// hidden characters are the ones text/invisible.ts names (Task 2), so the screen and the stored
// text agree on what counts as hidden.
const OSC = /\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)?/g
const C1_OSC = /\u009d[^\u0007\u009c]*[\u0007\u009c]?/g
const CSI = /\u001b\[[0-?]*[ -/]*[@-~]/g
const C1_CSI = /\u009b[0-?]*[ -/]*[@-~]/g
const OTHER_ESCAPE = /\u001b[@-Z\\-_]?/g
const LINE_BREAKS = /[\t\n\r\u2028\u2029]/g
const CONTROLS = /[\u0000-\u001f\u007f-\u009f]/g

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

const codePoints = (text: string) => [...text].length

// The sanitised text and how many characters went. A line break becomes a space, so it is not
// counted as hidden.
export function sanitiseCounted(text: string): { text: string; hidden: number } {
	const clean = sanitise(text)
	return { text: clean, hidden: codePoints(text) - codePoints(clean) }
}
```

- [ ] **Step 4: Write `src/review/queue.ts`**

```ts
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { norwegianDate } from "../gates/grounding.ts"
import { isMobile } from "../gates/safety.ts"
import type { Origin } from "../gates/types.ts"
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
	// The origin verify used, so review checks my edit the way verify will (Task 16).
	origin?: Origin
	evidence: Evidence
	sourceUrl: string
	reason: string
	acute: boolean
	categories: CategorySlug[]
	// The date of my earlier answer, when verify applied it and the field is still in review.
	unsettled?: string
	// The page value that earlier answer is keyed by. For an edit it differs from the value shown,
	// which is mine; a new answer replaces the earlier one under this key.
	answerKey?: FieldValue
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

// My accept settles a review (decided 06.11.2026), except a mobile with no role: the safety gate
// passes it only with a role, so only an edit with a role, or a reject, can settle it.
export function canAccept(item: FieldItem): boolean {
	return !(item.field === "phone" && typeof item.value === "string" && isMobile(item.value) && item.role === undefined)
}

// Every open question: fields in review that I have not answered, and "include this unit?" for
// units the curated file does not have yet. Acute units first, then kommune, unit and field. A
// field verify left in review after applying my answer (its evidence is my decision) is asked
// again, with that said, so an answer that did not settle never hides the field.
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
				const unsettled = field.evidence.kind === "decision" ? field.evidence.decidedOn : undefined
				if (unsettled === undefined && mine !== undefined && findDecision(mine.decisions, q) !== undefined) continue
				// The earlier answer verify applied: same field, same page, same date.
				const earlier =
					unsettled === undefined
						? undefined
						: mine?.decisions.find((d) => d.field === name && d.sourceUrl === field.sourceUrl && d.decidedOn === unsettled)
				const reason = field.reason ?? "review"
				items.push({
					kind: "field",
					kommune: f.kommune,
					unitId: unit.unitId,
					unitName,
					field: name,
					value: field.value,
					...(field.role === undefined ? {} : { role: field.role }),
					...(field.origin === undefined ? {} : { origin: field.origin }),
					evidence: field.evidence,
					sourceUrl: field.sourceUrl,
					reason: unsettled === undefined ? reason : `my answer of ${norwegianDate(unsettled)} did not settle it: ${reason}`,
					acute,
					categories,
					...(unsettled === undefined ? {} : { unsettled }),
					...(earlier === undefined ? {} : { answerKey: earlier.value }),
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
import { canAccept, type ReviewItem } from "./queue.ts"
import { sanitiseCounted } from "./sanitise.ts"

export const FIELD_KEYS = "Keys: a accept, r reject, e edit, s skip, q quit, then Enter"
// A mobile with no role: an accept cannot settle it, so the key is not offered.
export const FIELD_KEYS_NO_ACCEPT = "Keys: e edit (with a role), r reject, s skip, q quit, then Enter"
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
// piece of page text is sanitised, a link's host is printed on its own line, and when sanitising
// removed anything the item says how many characters went, so a stripped value never looks clean.
export function renderItem(item: ReviewItem, at: number, of: number, color: boolean): string {
	const label = (text: string) => (color ? `\u001b[1m${text}\u001b[0m` : text)
	let hidden = 0
	const s = (text: string) => {
		const out = sanitiseCounted(text)
		hidden += out.hidden
		return out.text
	}
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
		lines.push(`${label("Why:")} ${s(item.reason)}`, canAccept(item) ? FIELD_KEYS : FIELD_KEYS_NO_ACCEPT)
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
	if (hidden > 0) lines.push(`Note: ${hidden} hidden or control characters were removed for display.`)
	return `${lines.join("\n")}\n`
}
```

The render test's "Host:" check passes on "Host: www.eksempel.kommune.no" with `color: false`; with colour the label is wrapped, which the order test does not use. The test item's quotes hold `\u001b[2J` (four characters) and `\u202e` (one), so the note says 5. The note goes after the keys, so a screen reader reaches the keys first and the note last, as a warning about what was just read.

- [ ] **Step 6: Run the tests to see them pass**

Run: `npx vitest run test/sanitise.test.ts test/queue.test.ts test/render.test.ts`
Expected: PASS.

- [ ] **Step 7: Show it red once**

Make each break, run the file named, see the FAIL, restore, run: PASS. Note each one for the PR body.

1. In `sanitise`, delete `.replace(OSC, "")`. `test/sanitise.test.ts`: FAIL on "strips OSC 8 links".
2. In `sanitise`, delete `.replace(INVISIBLE, "")`. `test/sanitise.test.ts`: FAIL on "strips every character text/invisible.ts names".
3. In `renderItem`, delete the `if (hidden > 0)` line. `test/render.test.ts`: FAIL on "says how many hidden characters it removed".
4. Make `canAccept` return `true`. `test/queue.test.ts`: FAIL on "offers no accept for a mobile with no role", and `test/render.test.ts`: FAIL on "offers no accept key".
5. In `buildQueue`, drop `unsettled === undefined &&` from the skip line. `test/queue.test.ts`: FAIL on "asks again, labelled, when verify could not accept my earlier answer".

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
- Consumes: `buildQueue`, `canAccept`, `KommuneFiles`, `FieldItem`, `IncludeItem`, `ReviewItem` (Task 17), `renderItem` (Task 17), `writeCuratedFile`, `CuratedWriteError`, `holdDataDir`, `DataBusyError` (Task 16), `checkEdit` (Task 2), `validityGate`, `GateContext`, `Candidate`, `AddressHit`, `CuratedFile`, `CuratedUnit`, `ReviewDecision`, `findDecision`, `CATEGORY_SLUGS`, `hasInvisible` (Task 2), `possibleNames`, `midSentenceWords` (Task 2), `findAddress` (CLI only), `kommuneArg`, `readKommuneFiles`.
- Produces:
  - `review/lines.ts`: `class LineReader` with `constructor(input: NodeJS.ReadableStream, signal?: AbortSignal)` and `next(): Promise<string | undefined>` (a whole line without its line break; `undefined` at the end of input or on abort; a last line without Enter is dropped).
  - `review/session.ts`: `type EditChecks = { findAddress: (address: string, kommune: string) => Promise<AddressHit | undefined>; urlStatus: (url: string) => Promise<number | undefined>; validKommuner: ReadonlySet<string> }`, `type ReviewIO = { input: NodeJS.ReadableStream; output: { write: (text: string) => unknown }; isTTY: boolean; color: boolean; signal?: AbortSignal; today: () => string; checks: EditChecks; save?: (path: string, file: CuratedFile) => Promise<void> }`, `type ReviewOutcome = { outcome: "empty" | "refused" | "done" | "quit" | "stopped"; answered: number }`, `runReview(files: KommuneFiles[], io: ReviewIO): Promise<ReviewOutcome>`, `osloDate(ms?: number): string`, `namesInMyText(text: string, unitName: string): string[]`.

Five rules the walk-through keeps, beyond the spec's keys:

- **My edit gets the checks verify runs.** `checkEdit` (Task 2) with my decision as evidence and the origin verify used (`FieldItem.origin`, Task 16). A lock with no origin gets `unitPage`, the strictest: a mobile edit is then refused here rather than dropped by verify later.
- **No `a` where an accept cannot settle.** A mobile with no role (`canAccept`, Task 17) offers e (with a role) and r only.
- **One answer per question.** A new answer replaces my earlier one under the same key, since verify reads the first answer that matches.
- **Text I type is public once committed.** A reason or a role with a hidden character is refused; one that may hold a person's name is shown back and needs `keep` (decided in the stress test, 06.11.2026).
- **Plain, audible flow.** Every answer prints one "Saved: ..." line; progress counts only the items I will see; every sub-prompt takes q; a second Ctrl+C leaves at once.

- [ ] **Step 1: Write the failing test**

Create `pipeline/test/session.test.ts`:

```ts
import { readFileSync, renameSync } from "node:fs"
import { PassThrough } from "node:stream"
import { describe, expect, it } from "vitest"
import { writeCuratedFile } from "../src/curate/write.ts"
import { readKommuneFiles } from "../src/review/queue.ts"
import { namesInMyText, type ReviewIO, runReview } from "../src/review/session.ts"
import type { CuratedFile } from "../src/schema/curated.ts"
import type { LockFile } from "../src/schema/lock.ts"
import { curatedUnit, lockUnit, PAGE_URL } from "./helpers.ts"
import { curatedWith, dataDir, lockWith, reviewField } from "./reviewHelpers.ts"

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

// One unit, included, with one phone in review.
const onePhone = (phone: Parameters<typeof reviewField>[0]): string =>
	dataDir({ kommune: "3405", units: [lockUnit({ unitId: "org:999999991", fields: { phone: reviewField(phone) } })] })

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
		const { result, curated, text } = await session("y\n\na\n", { isTTY: false })
		expect(result.outcome).toBe("refused")
		expect(curated).toEqual(curatedWith())
		expect(text).toContain("winpty")
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

	it("says what it saved after each answer, in words", async () => {
		const { text } = await session("y\n\na\n")
		expect(text).toContain("Saved: included.")
		expect(text).toContain("Saved: accepted phone.")
	})

	it("y with numbers picks the categories", async () => {
		const { curated } = await session("y\n9 3\ns\n")
		expect(curated.units.find((u) => u.unitId === "org:999999992")?.categories).toEqual(["psykisk-helse", "nodtjenester"])
	})

	it("quits from the category prompt with q, and saves nothing", async () => {
		const { result, curated } = await session("y\nq\n")
		expect(result.outcome).toBe("quit")
		expect(curated).toEqual(curatedWith())
	})

	it("n leaves the unit out with my reason; r rejects the field", async () => {
		const { curated } = await session("n\nIkke en tjeneste\nr\n")
		expect(curated.units.find((u) => u.unitId === "org:999999992")).toMatchObject({ include: false, excludeReason: "Ikke en tjeneste" })
		expect(curated.units.find((u) => u.unitId === "org:999999991")?.decisions[0]).toMatchObject({ decision: "reject" })
	})

	it("shows back a reason that may hold a person's name, and keeps it only on keep", async () => {
		const kept = await session("n\nKari Nordmann sluttet\nkeep\ns\n")
		expect(kept.text).toContain("Curated files are public. This may be a person's name: Kari Nordmann")
		expect(kept.curated.units.find((u) => u.unitId === "org:999999992")?.excludeReason).toBe("Kari Nordmann sluttet")
		const retyped = await session("n\nKari Nordmann sluttet\nIkke en tjeneste\ns\n")
		expect(retyped.curated.units.find((u) => u.unitId === "org:999999992")?.excludeReason).toBe("Ikke en tjeneste")
	})

	it("refuses a reason with a hidden character, and asks for it again", async () => {
		const { text, curated } = await session("n\nIkke\u200b en tjeneste\nIkke en tjeneste\ns\n")
		expect(text).toContain("Refused: that text holds a hidden character")
		expect(curated.units.find((u) => u.unitId === "org:999999992")?.excludeReason).toBe("Ikke en tjeneste")
	})

	it("reads a possible name the way the hours guard does: a run, or a word inside a sentence", () => {
		expect(namesInMyText("Ikke en tjeneste", "Eksempel")).toEqual([])
		expect(namesInMyText("Kari Nordmann sluttet", "Eksempel")).toEqual(["Kari Nordmann"])
		expect(namesInMyText("spør etter Kari", "Eksempel")).toEqual(["Kari"])
		expect(namesInMyText("Avdelingsleder", "Eksempel")).toEqual([])
	})

	it("s skips and q quits, and neither saves anything", async () => {
		expect((await session("s\ns\n")).curated).toEqual(curatedWith())
		const quit = await session("q\n")
		expect(quit.result.outcome).toBe("quit")
		expect(quit.curated).toEqual(curatedWith())
	})

	it("numbers only the items it will show: a skipped unit's fields drop out of the count", async () => {
		const base = lockWith()
		const lock: LockFile = {
			...base,
			units: base.units.map((u) => (u.unitId === "org:999999992" ? { ...u, fields: { phone: reviewField() } } : u)),
		}
		const { text } = await session("s\ns\n", {}, dataDir(lock))
		expect(text).toContain("1 of 2")
		expect(text).toContain("2 of 2")
		expect(text).not.toContain("of 3")
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

	it("checks my edit with the origin verify used: a mobile from outside the contact block is refused", async () => {
		const { text, curated } = await session("e\n900 00 009\nAvdelingsleder\nr\n", {}, onePhone({ origin: "unitPage" }))
		expect(text).toContain("Refused: safety: a mobile outside the unit's own contact field")
		expect(curated.units[0]?.decisions).toMatchObject([{ decision: "reject" }])
	})

	it("offers no accept for a mobile with no role, only an edit with a role or a reject", async () => {
		const phone = { value: "900 00 000", evidence: { kind: "quote" as const, quotes: ["900 00 000"] }, reason: "safety: a mobile on the unit page needs its role label" }
		const { text, curated } = await session("a\nr\n", {}, onePhone(phone))
		expect(text).toContain("Use one of: r, e, s, q, then Enter")
		expect(curated.units[0]?.decisions).toMatchObject([{ decision: "reject", value: "900 00 000" }])
	})

	it("replaces my earlier answer that verify could not settle, so verify reads the new one", async () => {
		const decided = { kind: "decision" as const, decidedOn: "2026-11-05", original: { kind: "quote" as const, quotes: ["900 00 000"] } }
		const dir = onePhone({ value: "900 00 000", evidence: decided, reason: "safety: a mobile on the unit page needs its role label" })
		const earlier = { field: "phone" as const, value: "900 00 000", sourceUrl: PAGE_URL, decision: "accept" as const, decidedOn: "2026-11-05" }
		const files = readKommuneFiles(dir)
		await writeCuratedFile(files[0]?.curatedPath ?? "", curatedWith({ units: [curatedUnit({ unitId: "org:999999991", decisions: [earlier] })] }))
		const { curated } = await session("e\n900 00 009\nAvdelingsleder\n", {}, dir)
		expect(curated.units[0]?.decisions).toEqual([
			{
				field: "phone",
				value: "900 00 000",
				sourceUrl: PAGE_URL,
				decision: "edit",
				editedValue: "900 00 009",
				role: "Avdelingsleder",
				decidedOn: "2026-11-06",
			},
		])
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

`onePhone` writes a lock with one unit and the default curated file, whose unit `org:999999991` is included, so its phone is asked at once. In "replaces my earlier answer", the lock field already carries my decision of 05.11.2026, so the queue asks it again (Task 17) with `answerKey` "900 00 000", and the new edit replaces the accept under that key.

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
import { checkEdit } from "../gates/run.ts"
import type { AddressHit, Candidate, GateContext } from "../gates/types.ts"
import { validityGate } from "../gates/validity.ts"
import { CATEGORY_SLUGS, type CategorySlug, type FieldValue, type ProviderType } from "../schema/common.ts"
import { type CuratedFile, type CuratedUnit, findDecision, type ReviewDecision } from "../schema/curated.ts"
import { hasInvisible } from "../text/invisible.ts"
import { midSentenceWords, possibleNames } from "../text/names.ts"
import { LineReader } from "./lines.ts"
import { buildQueue, canAccept, type FieldItem, type IncludeItem, type KommuneFiles, type ReviewItem } from "./queue.ts"
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

// Words in text I type that may be a person's name: a run of two or more capitalised words, or one
// that stands inside a sentence, as the hours name guard reads them. A capitalised word that opens
// the text ("Ikke en tjeneste") is not one.
export function namesInMyText(text: string, unitName: string): string[] {
	const inside = new Set(midSentenceWords(text))
	return possibleNames(text, { unitName, places: [] }).filter((run) => run.includes(" ") || inside.has(run))
}

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

	// A sub-prompt: q alone quits here too, so I can leave from any question.
	async answer(prompt: string): Promise<string | undefined> {
		const a = await this.line(prompt)
		return a === undefined || a.toLowerCase() === "q" ? undefined : a
	}

	async key(keys: readonly string[]): Promise<string | undefined> {
		for (;;) {
			const answer = await this.line("> ")
			if (answer === undefined) return undefined
			if (keys.includes(answer.toLowerCase())) return answer.toLowerCase()
			this.out(`Use one of: ${keys.join(", ")}, then Enter\n`)
		}
	}

	// Text I type that the curated file stores, which is public once I commit it. A hidden character
	// (a paste can bring one) is refused. A possible person name is shown back, and "keep" keeps it.
	async freeText(prompt: string, unitName: string, allowEmpty: boolean): Promise<string | undefined> {
		let text = await this.answer(prompt)
		for (;;) {
			if (text === undefined) return undefined
			if (text === "" && allowEmpty) return ""
			if (hasInvisible(text)) {
				this.out("Refused: that text holds a hidden character (from a paste?). Type it again\n")
			} else if (text !== "") {
				const names = namesInMyText(text, unitName)
				if (names.length === 0) return text
				this.out(`Curated files are public. This may be a person's name: ${names.join(", ")}\n`)
				const confirm = await this.answer("Type keep and Enter to keep it as it is, or type it again\n> ")
				if (confirm === undefined) return undefined
				if (confirm.toLowerCase() === "keep") return text
				text = confirm
				continue
			}
			text = await this.answer(prompt)
		}
	}

	async save(kommune: string, what: string): Promise<boolean> {
		const f = this.#byKommune.get(kommune)
		if (f === undefined) return false
		try {
			await (this.#io.save ?? writeCuratedFile)(f.curatedPath, f.curated)
			this.out(`Saved: ${what}.\n`)
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
		this.out("Provider type: o offentlig, f frivillig, q quit, then Enter\n")
		const k = await this.key(["o", "f", "q"])
		return k === undefined || k === "q" ? undefined : k === "o" ? "offentlig" : "frivillig"
	}

	async categories(suggested: readonly CategorySlug[]): Promise<CategorySlug[] | undefined> {
		const list = CATEGORY_SLUGS.map((c, i) => `${i + 1} ${c}`).join(", ")
		for (;;) {
			const answer = await this.answer(`Categories by number (${list}). Enter takes: ${suggested.join(", ") || "none"}. q quits\n> `)
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
			return (await this.save(item.kommune, "included")) ? "answered" : "stopped"
		}
		const reason = await this.freeText("Why leave it out? It is public in the repo, so no names. Then Enter (q quits)\n> ", item.unitName, false)
		if (reason === undefined) return "quit"
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
		return (await this.save(item.kommune, "left out")) ? "answered" : "stopped"
	}

	// My typed value as verify will see it: my decision as its evidence, the origin verify used
	// (the strictest, unitPage, when an older lock has none), and the possible names in my own text
	// for the hours name guard. Validity alone first for a phone, so a value that is no number is
	// refused before the role is asked; then checkEdit (validity, safety, the hours name guard).
	async refusal(item: FieldItem, value: FieldValue, role: string | undefined, validityOnly: boolean): Promise<string | undefined> {
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
			// The real facts come back in verify, which runs the same gates again on my answer.
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
			origin: item.origin ?? "unitPage",
			...(role === undefined ? {} : { role }),
			personNames: text === undefined ? [] : possibleNames(text, { unitName: item.unitName, places: [] }),
			fetchedAt: "1970-01-01T00:00:00Z",
		}
		if (validityOnly) {
			const result = validityGate(c, ctx)
			return result.pass ? undefined : `${result.gate}: ${result.reason ?? "failed"}`
		}
		const check = checkEdit(c, ctx)
		return check.ok ? undefined : check.reason
	}

	async field(item: FieldItem): Promise<Step> {
		const k = await this.key(canAccept(item) ? ["a", "r", "e", "s", "q"] : ["r", "e", "s", "q"])
		if (k === undefined || k === "q") return "quit"
		if (k === "s") return "skip"
		const unit = this.unit(item.kommune, item.unitId)
		if (unit === undefined) return "skip"
		// The question's key is the page's value; for an answer verify could not settle it is the
		// value that answer was keyed by (Task 17's answerKey).
		const key = { field: item.field, value: item.answerKey ?? item.value, sourceUrl: item.sourceUrl }
		const base = { ...key, decidedOn: this.#io.today() }
		let decision: ReviewDecision
		let what: string
		if (k === "e") {
			const boolean = BOOLEAN_FIELDS.has(item.field)
			const typed = await this.answer(boolean ? "Your value, ja or nei, then Enter (q quits)\n> " : "Your value, then Enter (q quits)\n> ")
			if (typed === undefined) return "quit"
			const value: FieldValue = boolean ? typed.toLowerCase() === "ja" : typed
			if (typed === "" || (boolean && !["ja", "nei"].includes(typed.toLowerCase()))) {
				this.out("Refused: that is not a value for this field\n")
				return "again"
			}
			const invalid = await this.refusal(item, value, undefined, true)
			if (invalid !== undefined) {
				this.out(`Refused: ${invalid}\n`)
				return "again"
			}
			let role: string | undefined
			if (item.field === "phone") {
				const typedRole = await this.freeText(
					"Role label (for example Avdelingsleder), or Enter for none. It is public in the repo, so no names (q quits)\n> ",
					item.unitName,
					true
				)
				if (typedRole === undefined) return "quit"
				role = typedRole === "" ? undefined : typedRole
			}
			const unsafe = await this.refusal(item, value, role, false)
			if (unsafe !== undefined) {
				this.out(`Refused: ${unsafe}\n`)
				return "again"
			}
			decision = { ...base, decision: "edit", editedValue: value, ...(role === undefined ? {} : { role }) }
			what = `edited ${item.field}`
		} else if (k === "a" && key.value !== item.value) {
			// The value shown is my own earlier edit: accepting it keeps that edit.
			decision = { ...base, decision: "edit", editedValue: item.value, ...(item.role === undefined ? {} : { role: item.role }) }
			what = `accepted ${item.field}`
		} else {
			decision = { ...base, decision: k === "a" ? "accept" : "reject" }
			what = `${k === "a" ? "accepted" : "rejected"} ${item.field}`
		}
		// One answer per question: verify reads the first answer that matches, so a new one replaces
		// the earlier one instead of sitting behind it.
		const earlier = findDecision(unit.decisions, key)
		unit.decisions = [...unit.decisions.filter((d) => d !== earlier), decision]
		return (await this.save(item.kommune, what)) ? "answered" : "stopped"
	}
}

// The terminal walk-through, one item at a time. Each answer is written to the curated file at
// once, so quitting (q, Ctrl+C, the end of input) loses nothing already answered.
export async function runReview(files: KommuneFiles[], io: ReviewIO): Promise<ReviewOutcome> {
	if (!io.isTTY) {
		io.output.write(
			"review needs an interactive terminal, so it can never answer for me. Run it in PowerShell or Windows Terminal. " +
				"Git Bash's own window is not one to Node: start it there as winpty npm run review -- --data <dir>.\n"
		)
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
	// Only the items I will see count: a field of a unit I skipped, left out or have not included
	// yet is not shown, so "2 of 2" never jumps to "4 of 5".
	const shown = (item: ReviewItem) =>
		item.kind === "include" ||
		(!left.has(`${item.kommune}|${item.unitId}`) && s.unit(item.kommune, item.unitId)?.include === true)
	for (let i = 0; i < items.length; i++) {
		const item = items[i]
		if (item === undefined || !shown(item)) continue
		const visible = items.filter(shown)
		s.out(renderItem(item, visible.indexOf(item) + 1, visible.length, io.color))
		const step = item.kind === "include" ? await s.include(item) : await s.field(item)
		if (step === "quit") {
			s.out("Stopped. Every answer so far is saved.\n")
			return { outcome: "quit", answered }
		}
		if (step === "stopped") return { outcome: "stopped", answered }
		if (step === "again") i--
		if (step === "answered") answered++
		if (item.kind === "include" && step !== "answered") left.add(`${item.kommune}|${item.unitId}`)
	}
	s.out(`Done: ${answered} answered. Run git diff on the curated files to check them before I commit.\n`)
	return { outcome: "done", answered }
}
```

`KommuneFiles.curated` is reassigned by `addUnit`, so it cannot be `readonly`; the type in `queue.ts` has no `readonly`, which is what this needs.

- [ ] **Step 5: Run it to see it pass**

Run: `npx vitest run test/session.test.ts`
Expected: PASS. The validity gate runs before the role is asked, so in "refuses an edit" the bad value never reaches the role prompt. In "asks for a role with an edited mobile", the first edit has an empty role, so the safety gate gives "a mobile on the unit page needs its role label", which the session refuses (`checkEdit` refuses a review too, unless my decision settles it, and a mobile with no role is never settled); the second edit has the role and is saved. In "checks my edit with the origin verify used", the lock says `unitPage`, so the safety gate drops a mobile whatever its role, and only r is left to answer. `reviewField` in `test/reviewHelpers.ts` sets `origin: "unitContact"`, as verify writes it; without it the strict `unitPage` default would refuse the role-mobile edit in the earlier test.

- [ ] **Step 6: Write `src/cli/review.ts` and the script**

```ts
// Walks me through every open review item, one at a time, and writes each answer into the
// curated file at once. Local only: it refuses to run without an interactive terminal.
//   node src/cli/review.ts --data <dir> [--kommune 3405] [--cache <dir>]
import { join, resolve } from "node:path"
import { parseArgs } from "node:util"
import { CuratedWriteError, DataBusyError, holdDataDir } from "../curate/write.ts"
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
const dataDir = resolve(values.data)
const root = values.cache ?? DEFAULT_CACHE_DIR
const isTTY = process.stdin.isTTY === true && process.stdout.isTTY === true
let held: { release: () => void } | undefined
const controller = new AbortController()
let interrupts = 0
process.on("SIGINT", () => {
	interrupts++
	controller.abort()
	// A second Ctrl+C leaves at once, even in the middle of a live check. Every answer is already
	// saved whole, and a write in flight leaves the old file whole, so nothing is lost.
	if (interrupts > 1) {
		held?.release()
		process.exit(130)
	}
})
try {
	const found = readDiscovery(join(root, "discover"))
	const known = new Set(found.report.kommuner)
	// Checked before the number is used in any path.
	const arg = kommuneArg(values.kommune, known)
	if (!arg.ok) throw new ReviewError("--kommune must be a KLASS kommune number the last discover run read")
	const files = readKommuneFiles(dataDir, arg.kommune)
	// One writer at a time: a verify running now would overwrite my answers. A run that refuses
	// (no terminal) writes nothing, so it takes no hold.
	held = isTTY ? holdDataDir(dataDir) : undefined
	const crawler = new Crawler({ transport: httpsTransport, clock: systemClock, allowList: AllowList.restore(found.hosts) })
	const result = await runReview(files, {
		input: process.stdin,
		output: process.stdout,
		isTTY,
		// NO_COLOR set to any non-empty value turns colour off (no-color.org).
		color: isTTY && !process.env.NO_COLOR,
		signal: controller.signal,
		today: () => osloDate(),
		checks: {
			findAddress: (address, kommune) => findAddress(crawler.get, address, kommune),
			urlStatus: async (url) => (await crawler.get(url, "html")).status,
			validKommuner: known,
		},
	})
	process.exitCode = result.outcome === "refused" ? 2 : result.outcome === "stopped" ? 1 : 0
} catch (err) {
	const known = err instanceof DiscoverError || err instanceof ReviewError || err instanceof CuratedWriteError || err instanceof DataBusyError
	console.error(known ? err.message : "review stopped on an unexpected error")
	process.exitCode = err instanceof DataBusyError || err instanceof ReviewError ? 2 : 1
} finally {
	held?.release()
}
// stdin keeps the process alive after the last answer, so leave on purpose.
process.exit()
```

In `pipeline/package.json`, add `"review": "node src/cli/review.ts",` after `"verify"`. `process.exit()` with no argument uses `process.exitCode`. A run killed outright (the window closed) leaves `<data>/.pipeline.lock`; the next verify or review then says another one is running and names the file to delete. The second Ctrl+C has no automated test, since no test may import a CLI: I check it by hand in Task 20 (Step 2), in PowerShell.

- [ ] **Step 7: Show it red once**

Make each break, run `npx vitest run test/session.test.ts`, see the FAIL, restore, run: PASS. Note each one for the PR body.

1. In `LineReader`'s `data` handler, change `this.#partial = parts.pop() ?? ""` to `this.#partial = ""` (so a last line without Enter becomes a line): FAIL on "saves nothing for a key without Enter".
2. In `field`, always offer `["a", "r", "e", "s", "q"]`: FAIL on "offers no accept for a mobile with no role".
3. Replace `unit.decisions.filter((d) => d !== earlier)` with `unit.decisions`: FAIL on "replaces my earlier answer that verify could not settle".
4. Make `namesInMyText` return `[]`: FAIL on "shows back a reason that may hold a person's name" and "reads a possible name the way the hours guard does".
5. Delete the `hasInvisible(text)` branch in `freeText`: FAIL on "refuses a reason with a hidden character".
6. In `runReview`, render with `i + 1, items.length`: FAIL on "numbers only the items it will show".
7. Delete the `Saved:` line in `save`: FAIL on "says what it saved after each answer".
8. Make `answer` return the line as it is (no q check): FAIL on "quits from the category prompt with q".
9. In `refusal`, set `origin: "unitContact"` always: FAIL on "checks my edit with the origin verify used".
10. Delete "winpty" from the refusal message: FAIL on "refuses to start without an interactive terminal".

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
		for (const file of [
			"src/registers/nklm.ts",
			"src/text/hours.ts",
			"src/text/phone.ts",
			"src/text/names.ts",
			"src/text/invisible.ts",
			"src/cli/extract.ts",
			"src/cli/verify.ts",
			"src/cli/review.ts",
		]) {
			expect(scanned).toContain(file)
		}
	})
```

Run: `npx vitest run test/networkBoundary.test.ts`
Expected: PASS: no new file outside `src/net/` imports a network module or calls `fetch(`, and no test imports `src/net/http.ts` or a CLI.

Show it red once: change `"src/xlsx/"` in the list to `"src/xlsy/"`. Run the file: FAIL on "scans the PR 3 folders and files" (no scanned file starts with `src/xlsy/`). Restore, run: PASS. Note it for the PR body. The test can only go red when a folder or file is missing from the scan, which is what it guards: a folder moved out of `src/` would no longer be checked for network imports.

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
`verify` refuses the repo's own `data/` and every folder inside it. Only one of them runs in a
data folder at a time: each holds `<data>/.pipeline.lock` while it runs and refuses to start
when the file is there. A run that was killed outright can leave the file behind; delete it
when no verify or review is running. `verify --nklm-fetch` fetches NKLM's legevakt list when
its page serves the licensed edition; otherwise `--nklm-file` names the file NKLM sent. A new
edition stops the NKLM step until its licence is recorded in `docs/licence-requests/README.md`.

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
````

Under "Privacy", add:

```markdown
- A role mobile keeps two quotes only, the role word and the number. Every other quote has its
  possible names replaced by `[navn]` before it is stored. Names are never stored.
- Extraction files (`<cache>/extract/`) hold page lines: cache only, never printed, never committed.
- Text I type in review (a reason, a role, an edited value) is public once the curated file is
  committed. Review warns me about a possible person name before it saves one.
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
TRIAL="$(cygpath -w "$(mktemp -d)")"
echo "$TRIAL"
npm run verify -- --data "$TRIAL" --only 3401,3405,3407,3411 --nklm-file "<path to the NKLM file>"
```

`cygpath -w` turns Git Bash's `/tmp/...` into the Windows path (`C:\Users\...\AppData\Local\Temp\...`), so Node and every later step read the same folder (Git Bash's `/tmp` is a known trap on this machine). Keep each printed summary for the PR body. They hold counts, kommune numbers, names, adapter names and reasons only, now with the answers that did not settle, the folded main units and the pages fetched again since extract. Then count the lock files' statuses, printing numbers only:

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

Then a manual check that is mine, not the agent's: the agent never runs `review` (it would print page quotes, and without a terminal it refuses anyway). Tell me the `$TRIAL` path and wait. In PowerShell I run `npm run review -- --data "<that path>"`, answer one item with `s`, press Ctrl+C once at a prompt (it says it stopped), start it again, press Ctrl+C twice quickly (it leaves at once), and check that `.pipeline.lock` is gone from the folder. I tell the agent pass or fail, in those words only; a fail blocks the PR. Then the agent removes the trial folder, which holds lock files built from real pages, and checks that it is gone:

```bash
rm -rf "$TRIAL"
test ! -e "$TRIAL" && echo "trial folder removed"
```

Expected: `trial folder removed`. The cache folder (`.cache/`) stays: it is the PR 2 cache, gitignored, and PR 4 reuses it.

- [ ] **Step 3: Final checks over the whole branch**

From the repo root:

```bash
git diff --stat origin/main -- web api data
git diff origin/main --name-only | xargs grep -nP '\x{2014}|\x{2013}' || echo "no dashes"
git diff origin/main | grep -n "Kari" | grep -v "Kari Nordmann\|Kari Anne Nordmann\|Kari:" || echo "only the placeholder names"
git diff origin/main --name-only | grep -n "\.cache\|/tmp" || echo "no cache files"
grep -rn "<sha256 from Step 1>\|<dd.mm.yyyy>\|<legevakt name header>\|<version>" pipeline/src pipeline/test pipeline/README.md && echo "a placeholder is left" || echo "no placeholders"
```

Expected: the first prints nothing; then `no dashes`, `only the placeholder names`, `no cache files` and `no placeholders`. The en dash in house-style hours is written `\u2013` in code, which the dash check does not match.

- [ ] **Step 4: Push and open the PR**

```bash
git push -u origin feat/pipeline-extract-verify-review
```

Write the PR body below to a file outside the repo, with every placeholder filled, then check that none is left and that the red list is whole:

```bash
BODY="$(cygpath -w "$(mktemp)")"
# write the body into "$BODY", then:
grep -n "<version>\|<the four summaries\|<per CMS\|<one line" "$BODY" && echo "a placeholder is left" || echo "no placeholders"
grep -c "^- Task [0-9]*\.[0-9]*:" "$BODY"
```

Expected: `no placeholders`, then `96` (one line per break the plan names; the table in "Checks shown red once" below gives the count per task). Open the PR with `gh pr create --title "<the title>" --body-file "$BODY"`, then `rm -f "$BODY"`.

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
- `src/review/` and `npm run review`: the terminal walk-through, with sanitised page text, my
  edits checked the way verify checks them, and one writer at a time per data folder
  (`.pipeline.lock`).
- Brreg's switchboard for the kommune's own record only, and a `binary` fetch kind.
- New runtime dependency, pinned: `fflate` <version> (MIT, no dependencies).

## Trial run

<the four summaries from Step 2, and the status counts>

## Checks shown red once

Each check below was broken on purpose, run, seen red, and restored. One line per break, in task order. Task 6 break 5 may have no red: if htmlparser2 already turns the raw NUL into U+FFFD, the line says so instead.

- Task 1.1: `ReviewDecision` takes an edit without its value: FAIL "refuses an edit without its value"
- Task 1.2: no `valueFitsField` check: FAIL "refuses a value or an edited value of the wrong kind"
- Task 1.3: no `Inclusion` refinement: FAIL "needs a category and a provider type"
- Task 2.1: `capitalisedRuns` needs three words: FAIL "drops an hours value that holds a two-word capitalised run"
- Task 2.2: `possibleNames` keeps only the words that are not exempt: FAIL "keeps a run whole when one word in it may be a name"
- Task 2.3: `isLabelWord` knows the bare form only: FAIL "reads label words in their definite form"
- Task 2.4: `redact` works one name at a time: FAIL "redacts every name in the list, longest first"
- Task 2.5: `fullPattern` without its word bounds: FAIL "redacts a one-word name only as a whole word"
- Task 2.6: `hoursNameReason` without `midSentenceWords`: FAIL "drops hours that name one person inside a sentence"
- Task 2.7: `checkEdit` runs validity only: FAIL "refuses a mobile without a role"
- Task 2.8: `settled` never settles: FAIL "lets my decision settle a review"
- Task 2.9: the safety gate ignores my decision: FAIL "lets my decision settle the instruction review"
- Task 2.10: the source gate reads `c.evidence`: FAIL "reads my decision's original evidence"
- Task 2.11: `hasInvisible` uses the global pattern: FAIL "the same answer every call"
- Task 2.12: no invisible check in validity: FAIL "drops a value that holds an invisible character"
- Task 3.1: `"4,2,2"` in `EIGHT`: FAIL "finds the number after a postcode in the same run of digits"
- Task 3.2: `postcodeLast` false: FAIL "never reads a time, a date, a postcode or a post box"
- Task 3.3: no `fitsNumberPlan` in the dotted branch: FAIL "never reads a dotted run outside the Nkom plan"
- Task 3.4: `short: false`: FAIL "marks a short number"
- Task 3.5: no `MAX_LINE` in `findPhones`: FAIL "skips one over 2,000"
- Task 3.6: the old `quoteHasPhone` loop: FAIL "stays linear on a long run of single-digit groups"
- Task 4.1: hours up to 25: FAIL "refuses a time it cannot read"
- Task 4.2: no `QUARTERS` check: FAIL "refuses a date without its year"
- Task 4.3: no `COUNT_AFTER` test: FAIL on the table row "For ungdom 13-20 år, tirsdag 14-17"
- Task 4.4: the old `afterDay` rule: FAIL "Mandag: gruppe for 8-10 klasse"
- Task 4.5: no `MAX_LINE` in `formatHours`: FAIL "refuses one over 2,000"
- Task 4.6: `hoursGrounded` without the verbatim line: FAIL "grounds the raw text of hours the formatter could not read"
- Task 4.7: times compared in any order: FAIL "needs the times in the order the quotes give them"
- Task 5.1: `streetKey` keeps the space: FAIL "reads Storgata 1 A as Storgata 1A"
- Task 5.2: no `(?![iå])` in the street pattern: FAIL "finds the street when the sentence goes on with i or å"
- Task 6.1: no CMS boxes in `contactBlocks`: FAIL "takes a CMS contact box first"
- Task 6.2: a block ends at any heading: FAIL "keeps the lines under a deeper heading"
- Task 6.3: a block is named by the last heading of any level: FAIL "keeps the lines under a deeper heading"
- Task 6.4: heading text uncollapsed: FAIL "keeps a heading's level when its markup has line breaks inside"
- Task 6.5: `textLines` keeps invisible characters: FAIL "never lets page text forge a heading" and "strips invisible characters from every line"
- Task 7.1: no fax skip: FAIL "never takes a fax number"
- Task 7.2: no "(faks)" after the number: FAIL "never takes a fax number"
- Task 7.3: the role word read from the whole line: FAIL "reads a role word only beside its own number"
- Task 7.4: no name check on the label line: FAIL "never makes a number rank 1 when its label line above holds a possible name"
- Task 7.5: a short number with no phone label: FAIL "takes a short number only beside a phone label"
- Task 7.6: `hoursAfter` without `PHONE_TIME`: FAIL "reads the line after as phoneHours only when it says Telefontid"
- Task 7.7: `alwaysOpen` ignores limits: FAIL "sends a closure elsewhere in the block to review"
- Task 7.8: `dedupe` without the review branch: FAIL "keeps a review over a clean duplicate from another block"
- Task 8.1: a Postboks line taken: FAIL "never takes a Postboks"
- Task 8.2: no `streetIsClean`: FAIL "never builds an address from a line that holds a phone number or a role word"
- Task 9.1: hours length doubled: FAIL "sends hours over 200 characters to review"
- Task 9.2: Nav notes and receptions ignored: FAIL "sends hours with a note, or an office with more than one reception, to review"
- Task 10.1: a hash mismatch read as an empty page: FAIL "gives a page whose cache entry no longer matches no values"
- Task 11.1: the unpack budget times 100: FAIL "stops at 20 MB" and "never trusts the size an entry declares"
- Task 11.2: the sheet path hard-coded: FAIL "finds the first sheet through the workbook and its relationships"
- Task 11.3: no empty rows: FAIL "keeps a row Excel left out as an empty row"
- Task 11.4: no `..` check: FAIL "refuses bytes that are not a zip, and a zip with no first sheet"
- Task 12.1: no edition check: FAIL "stops on a new edition"
- Task 12.2: a new edition saved over the licensed copy: FAIL "saves a licensed edition, and keeps that copy when a new edition comes"
- Task 12.3: a bare name placed in any county: FAIL "places a bare name of a bracketed KLASS kommune only beside another kommune of its county"
- Task 13.1: a mobile-shaped switchboard taken: FAIL "refuses a mobile-shaped switchboard"
- Task 14.1: a shared page never seen: FAIL "never includes a page that two register units match"
- Task 14.2: ambiguous codes known: FAIL "keeps the ambiguous codes and barnevernvakt in review, even beside a path word"
- Task 14.3: every path segment read: FAIL "reads the last path segment only"
- Task 14.4: 87.999 always known: FAIL "knows 87.999 only beside a krisesenter word"
- Task 14.5: helsestasjon known: FAIL "sends a helsestasjon to review, suggesting familie-og-barn"
- Task 14.6: strong and weak matches mixed: FAIL "lets a website match leave out a unit that matches by name and address only"
- Task 14.7: no folding: FAIL "folds a main unit and its only sub-unit into one"
- Task 14.8: every heading names the unit: FAIL "sends a unit to review when its page's heading does not name it"
- Task 14.9: org form and host may disagree: FAIL "reads the org form before the host"
- Task 15.1: robots always allows: FAIL "lets robots pass only for a URL the crawler fetched"
- Task 15.2: Nav counted as a register host: FAIL "gives Nav no register pass"
- Task 15.3: `urlStatus` ignores the URLs verify checked: FAIL "gives the status verify checked itself"
- Task 15.4: `resolveUrls` keyed by the raw URL: FAIL "asks once per distinct URL"
- Task 16.1: the rule's review before my answer: FAIL "applies my answers"
- Task 16.2: my role not copied: FAIL "copies the role I typed into an edited mobile"
- Task 16.3: edited addresses not resolved: FAIL "resolves my edited address through Kartverket"
- Task 16.4: edited URLs not checked: FAIL "checks my edited website through the crawler"
- Task 16.5: every page counted fresh: FAIL "takes no values from a page fetched again after extract ran"
- Task 16.6: my answer kept when its quotes left the page: FAIL "ignores my answer when its quotes are no longer on the page"
- Task 16.7: unsettled answers never counted: FAIL "counts an answer that did not settle the field"
- Task 16.8: `holdDataDir` opens with `"w"`: FAIL "lets one command at a time write into the data folder"
- Task 16.9: `isRepoData` reads case: FAIL "knows the repo's data folder in any spelling"
- Task 16.10: the lock file written with one attempt: FAIL "retries a busy rename too"
- Task 16.11: no origin in the lock: FAIL "keeps the origin on a field it stores"
- Task 17.1: no OSC stripping: FAIL "strips OSC 8 links"
- Task 17.2: no `INVISIBLE` stripping: FAIL "strips every character text/invisible.ts names"
- Task 17.3: no hidden-character note: FAIL "says how many hidden characters it removed"
- Task 17.4: `canAccept` always true: FAIL "offers no accept for a mobile with no role" and "offers no accept key"
- Task 17.5: an answer that did not settle stays hidden: FAIL "asks again, labelled, when verify could not accept my earlier answer"
- Task 18.1: a last line without Enter counts: FAIL "saves nothing for a key without Enter"
- Task 18.2: `a` always offered: FAIL "offers no accept for a mobile with no role, only an edit with a role or a reject"
- Task 18.3: my earlier answer kept beside the new one: FAIL "replaces my earlier answer that verify could not settle"
- Task 18.4: `namesInMyText` finds nothing: FAIL "shows back a reason that may hold a person's name"
- Task 18.5: hidden characters in typed text allowed: FAIL "refuses a reason with a hidden character"
- Task 18.6: progress counts every item: FAIL "numbers only the items it will show"
- Task 18.7: no "Saved:" line: FAIL "says what it saved after each answer"
- Task 18.8: q ignored in sub-prompts: FAIL "quits from the category prompt with q"
- Task 18.9: my edit always checked as from the contact block: FAIL "checks my edit with the origin verify used"
- Task 18.10: no winpty hint: FAIL "refuses to start without an interactive terminal"
- Task 19.1: `src/xlsy/` in the scan list: FAIL "scans the PR 3 folders and files"

| Task | Breaks | Task | Breaks | Task | Breaks | Task | Breaks |
|---|---|---|---|---|---|---|---|
| 1 | 3 | 6 | 5 | 11 | 4 | 16 | 11 |
| 2 | 12 | 7 | 8 | 12 | 3 | 17 | 5 |
| 3 | 6 | 8 | 2 | 13 | 1 | 18 | 10 |
| 4 | 7 | 9 | 2 | 14 | 9 | 19 | 1 |
| 5 | 2 | 10 | 1 | 15 | 4 | Total | 96 |

## CMS boxes

<per CMS: the box recorded and where it was checked, or "none found">
````

---

## Self-review (done while writing this plan)

1. **Spec coverage.** Every item of "PR 3: extract, verify, review" maps to a task: the three commands (Tasks 10, 16, 18), the contact block and CMS boxes (6), each field rule (7, 8, 9), the hours formatter (4), the shared-page rule (16), linear patterns and the 2,000-character skip (3, 7, 10), dot-grouped numbers and `quoteHasPhone` (3), mobiles and the phone order (7, 13, 16), person names (2, 7), email and website (8), address with "1 A" and the recorded rådhus answer (5, 8), hours sources, length and the "1-2 ganger" rule (4, 9), Lavterskel quotes (9), the review command, its keys, sanitising, `NO_COLOR`, Ctrl+C, the non-terminal refusal and `--kommune` (17, 18), how answers are stored and written, with the Windows retry for the curated and the lock file and one writer at a time per data folder (1, 16, 18), errors per kommune and per page (10, 16), NKLM's fetch rule, edition stop, column check and zip limits (11, 12), the schema changes (1, 2), the dependency (11), the network boundary (19) and the checks before the PR (20). Every must-fail fixture the spec's "Testing" section lists is a named test: role-mobile lines with one, three-part and hyphenated names (Task 7), a landline next to a name (7), "ikke døgnåpen" and "døgnåpen i helgene" (7), `25.00`, `13.75` and "1-2 ganger" (4), a page two register units match (14, 16), the three-service page (6, 16), the 1 MB line (10), and each review-command case (17, 18).
2. **Placeholders.** Three values are filled from live evidence inside their tasks, by decision 5 and the spec's never-guess rules: the CMS boxes (Task 6, Steps 10 to 11), the NKLM columns, edition hash and file URL (Task 12, Step 1), and the recorded Kartverket answer (Task 5, Step 1). Each step says exactly how, and Task 20 Step 3 fails if a marker is left in the code or the README. Task 20 Step 4 checks the PR body the same way, `fflate`'s `<version>` included.
3. **Type consistency.** `Candidate.personNames`, `ExtractedCandidate`, `UnitGroup`, `Proposal`, `LockField.origin`, `FieldItem` (with `origin`, `unsettled` and `answerKey`) and `KommuneFiles` are defined once (Tasks 1, 2, 14, 16, 17) and used with the same fields after. `Origin` is now the type of `ORIGINS` in `schema/lock.ts` (Task 16), so the lock and the gates cannot drift apart.
4. **Review Focus.** Each of the five lines has its test: Faks and "Telefon:" over the number (Task 7), house-style hours (Task 4), the same number twice (Task 7, and the whole page in Task 10), the hash mismatch (Task 10).
5. **Stress test of Tasks 15 to 20 (06.11.2026), folded in.** My answer settles a review, never a drop (my decision of 06.11.2026, Task 2), and every path to that answer now holds:
   - Verify resolves my edited addresses through Kartverket and asks the crawler for my edited URLs before the gates run (Tasks 15, 16).
   - Review checks my edit with `checkEdit` and the origin verify used, now stored in the lock (Tasks 16, 18). An answer verify still cannot accept comes back in the queue, labelled, and is counted in the summary (Tasks 16, 17). A mobile with no role offers no `a` (Tasks 17, 18), and a new answer replaces the earlier one under the same key (Task 18).
   - Verify takes no values from a page fetched again after extract ran (`pagesStale`), and ignores my answer when its quotes are no longer on the cached page (Task 16).
   - One writer at a time per data folder (`.pipeline.lock`), and the lock file gets the same Windows retry as the curated file (Tasks 16, 18). The repo's own `data/` is refused in any spelling of its path (Task 16).
   - Robots passes a Nav URL only when the manifest holds it (Task 15).
   - Review shows how many hidden characters it removed, refuses typed text that holds one, and shows back a possible person name before it saves a reason or a role (Tasks 17, 18). Terminal flow: "Saved: ..." after each answer, progress that counts only what I will see, q in every question, a second Ctrl+C that leaves at once, and a winpty hint for Git Bash (Task 18).
   - The trial folder is a Windows path and is removed after the counts and my manual check (Task 20).
6. **Every check is shown red once.** 96 breaks across Tasks 1 to 19, each named in its task's "Show it red once" step and listed one per line in the PR body (Task 20). The checks with no automated red are named where they sit: the timing halves in Tasks 3 and 4, the forge case in Task 6 if the parser already closes it, and the second Ctrl+C (a CLI, which no test may import), which I check by hand in Task 20 Step 2.

## Stress test: considered and rejected

- Zip path traversal and an entry-count limit: entry names are only compared with fixed names and never written to disk, and `readNklm` checks the SHA-256 before it unzips.
- Re-read and merge of the curated file: the data folder hold allows one writer at a time, so a merge adds code with no case left to cover.
- Refusing accept on validity and safety reviews: replaced by my decision of 06.11.2026 that an accept settles a review (a drop still drops, a mobile needs a role).
- Back-compat of the decision nesting: `data/curated` and `data/lock` hold only `.gitkeep`, and every new key is optional.
- Lowercase name particles ("von"): they leak no identity once both name parts are redacted.
- A single first name in a stored quote: it identifies only weakly; the hours guard and the free-text check cover the places it is stored as a value.
- An AI agent running `review`: no step runs it, and it refuses without a terminal.

> Stress-tested 2026-11-06 (skill a217382), whole plan by three fresh reviewers: 28 applied, 11 adapted, 2 decided by me.
