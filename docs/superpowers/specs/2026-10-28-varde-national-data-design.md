# Varde: national data pipeline (sub-projects A and C) design

Date: 2026-10-28. Builds on the Lavterskel spec (`2026-10-15-varde-lavterskel-design.md`) and
the seed-data docs (`docs/seed-data*.md`, `docs/verification/`). Where this document and an
earlier one disagree, this one wins. The one rule it changes on purpose is the Lavterskel badge
(see "The Lavterskel rule").

## Purpose

Varde covers 138 hand-verified rows today: national helplines, Oslo and parts of Innlandet. Every
row was researched by hand, one source per field, under the never-invent rule. That does not
scale to 357 kommuner, and it does not stay current once I have a praksisplass or a job and no
time to re-check pages every week.

This spec designs a pipeline that finds, checks and refreshes service data on its own, and only
asks me when a machine cannot be sure. Two requirements govern it:

- **Never wrong.** A value reaches the site only when it is grounded in a register record or a
  verbatim quote from the source page, and passes every gate below.
- **Mostly hands-off.** At most 1 row in 10 needs my review, and routine refreshes merge
  themselves.

## Decisions locked in the brainstorm (2026-10-28)

1. **Scope split.** This spec is sub-project A (the intake pipeline) plus C (the rollout order).
   Sub-project B (storage off EF `HasData`, per-kommune JSON on the site, Cloudflare Pages'
   20,000-file cap) gets its own spec next.
2. **Approach: registers plus verified page extraction, Innlandet pilot first.** Registers give
   the skeleton (which units exist, where). Page extraction fills what registers lack (direct
   phone lines, hours, lavterskel status). Every extracted value must prove where it came from.
3. **Two files per kommune.** A curated file I own, and a machine lock file the pipeline owns.
4. **Six stages as separate commands:** discover, fetch, extract, verify, review, publish.
5. **Five automatic gates per field.** A failed gate drops the value or sends it to review,
   never to the site.
6. **Phone order:** the unit's own service phone, then a number the kommune publishes on the
   unit's page (even a manager's), then the kommune switchboard labelled "Sentralbord".
7. **New Lavterskel rule:** free to attend, and no vedtak or referral needed. Free to attend
   with paid extras (`Cost` Partly) counts.
8. **Frivillige organisasjoner are a provider type**, not an 11th category.
9. **The 11 kommuner that block ClaudeBot** are fetched with Varde's own user agent and
   extracted by a local model, so their text never reaches an AI company. (Amended
   06.11.2026: PR 3 extracts with rules, so no page text leaves the runner for any kommune.
   The local model returns only with an AI fallback, decided after PR 4 (see "PR 3: extract, verify, review").)
10. **It runs in scheduled GitHub Actions.** Refresh-only PRs merge themselves. Visible changes
    wait for me in one weekly PR.
11. **Publishing waits for spec B.** The pilot is scored, not published.
12. **Descriptions are AI drafts, labelled.** The model drafts them from the quotes only, a gate
    rejects any fact that is not in the lock file, and the site says they were written with AI.
   (Amended 06.11.2026: postponed. PR 3 drafts no descriptions.)

## Sub-project map

| Sub-project | What | Where |
|---|---|---|
| A | Intake pipeline: stages, gates, sources, freshness | This spec |
| B | Storage: data off EF `HasData`, per-kommune JSON on the site, file-cap plan | Own spec, next |
| C | Rollout order: pilot, then one fylke per PR | This spec, "Rollout" |
| UI follow-up | Provider type badge and filter, frivillige page, header link, AI label on descriptions, Om Varde text | Own small PR |

## In scope

- The `pipeline/` TypeScript workspace: schema, the six stages, the gates, the CMS adapters.
- The curated and lock file formats.
- Scheduled GitHub Actions workflows, the refresh-only check and the auto-merge rule.
- The Innlandet pilot (46 kommuner) plus Oslo, scored against the 138-row answer key.
- Drafts of the licence requests.

## Out of scope

- Where the site reads data from, and the migration off `HasData` (spec B).
- Any UI change. The provider type field is defined here; its badge, filter, the frivillige page,
  the header link and the Om Varde text ship as their own PR.
- Time-of-day "open now" (needs structured hours; plan 2 blocker still stands).
- Crowd tips from users. The trust level is defined so a later spec can add them safely.

## Architecture

### Files

```text
data/
  curated/3403-hamar.json   # mine: which units are in, and Varde's own words
  lock/3403.json            # the pipeline's: every value with its proof
pipeline/                   # TypeScript workspace
  src/schema/               # Zod schemas, exported as JSON Schema
  src/stages/               # discover, fetch, extract, verify, review, publish
  src/gates/                # one module per gate
  src/adapters/             # one per kommune CMS (CorePublish, ACOS, Aim, WordPress, ...)
  test/answer-key.json      # the 138 rows, frozen from today's JSON export
.cache/pages/               # raw page cache, gitignored, never committed
```

**Curated file** (one per kommune, keyed by KLASS kommune number). For each unit:

- inclusion (in or out, and why when out)
- source references (brreg org number, Nav office id, page URLs)
- categories and provider type (Offentlig or Frivillig/ideell)
- the Lavterskel decision and its quote(s)
- Varde's own nb and en descriptions, never copied prose (see "Descriptions")
- my review decisions, so no question is asked twice
- `recheckAfter` dates for known changes (Stovner after 09.11.2026, Homansbyen on 08.12.2026)

**Lock file** (one per kommune). For each field of each unit:

- the value
- the source URL
- the evidence: a register record id, or the verbatim quote
- `fetchedAt` and `verifiedAt` (UTC timestamps; `recheckAfter` in the curated file is a plain
  Norwegian calendar date)
- the result of each gate, and a status: accepted, review or dropped

A dropped field keeps its reason and source URL, never its value. Person data the safety gate
drops is therefore never written anywhere, not even in the lock file.

**Units are deduplicated** across sources by brreg org number, or else by normalised name plus
Kartverket address id. One unit found in brreg and in dinutvei is one row with two sources,
which is what the agreement gate needs.

**Kommune changes.** Discover reads KLASS classification 131's change list. A merged, split or
renumbered kommune becomes a review item that maps the old files to the new number, so no
file is orphaned silently.

The Zod schema is the single source of truth. It validates both files in CI, and its JSON
Schema export would be the structured-output schema for a model, if an AI fallback is added.

### Stages

Each stage is its own command, reads the previous stage's output and can be re-run alone.

1. **discover:** list candidate units per kommune from registers and sitemaps.
2. **fetch:** download each candidate's page into the cache. Obeys robots.txt and crawl delay.
3. **extract:** turn cached page text into field values with quotes, by rules (amended
   06.11.2026; the field rules are in "PR 3: extract, verify, review"). No AI model, unless
   PR 4's review share calls for a fallback.
4. **verify:** run the five gates on every field and write the lock file.
5. **review:** a local command that walks me through open review items one at a time, shows
   the quote and the source link, and writes my decision into the curated file.
6. **publish:** open the PR. The format the site reads is spec B's.

**Failing halfway fails closed.** Each stage writes a kommune's output to a temporary file and
replaces the old one only when that kommune is complete. A run that crashes, times out or hits
the spend limit (only with an AI fallback) leaves the previous lock files untouched, opens no PR, and says in its summary
which kommuner it did not finish. Re-running a stage on the same input gives the same output.

## Verification gates

Every field passes all five. They are automatic.

1. **Source gate.** The host is on the allow-list, robots.txt allows the fetch, and the source's
   licence status is recorded.
2. **Grounding gate.** The value has a register record id (brreg, Nav, KLASS), or a verbatim
   quote that is found in the cached page text and contains the value. This catches invented
   values.
3. **Validity gate.**
   - Phone numbers fit the Nkom plan: 8 digits, 3-digit 1xx, 6-digit 116xxx, 5-digit 0xxxx.
   - URLs answer 200.
   - Addresses resolve in Kartverket's address API, inside the right kommune.
   - Hours are 200 characters or fewer (today's database limit, which no seed guard checks).
   - The kommune number is valid in KLASS on the fetch date.
4. **Agreement gate.** When two independent sources agree (for example the brreg address and
   the page address), the field is accepted. When they disagree, it goes to review. The quote
   check cannot catch a real value attached to the wrong unit; this gate and the CMS adapters,
   which limit extraction to the unit's own page, can.
5. **Safety gate.**
   - Person data is dropped: a name next to a mobile number from anywhere other than the unit's
     own contact field (staff lists, articles), sole proprietorships (ENK), personal email
     addresses, account numbers, and JSON-LD `author` persons.
   - A krisesenter street address is accepted only from a quote on the centre's own page
     (amended 2026-10-29, my call). From a register or catalogue it is dropped and never
     stored, because a centre must register a business address in brreg even when it keeps
     it off its own site on purpose.
   - The Lavterskel badge follows "The Lavterskel rule" below.

### Phone order

1. **The unit's own service phone**, stored with its phone hours or "døgnåpen".
2. **A number the kommune publishes on the unit's own page as its contact.** In some kommuner
   that is a manager's own mobile, because the manager acts in a public role. I keep the number,
   drop the name and label it with the role, for example "Avdelingsleder". The monthly quote
   check removes it when it leaves the page. The number still identifies a person, so it is
   personal data even without the name. Basis: legitimate interest (GDPR Art. 6(1)(f)). The
   kommune itself publishes it as the unit's contact, Varde shows it for the same purpose, and
   no direct line exists. Om Varde carries the notice that Art. 14 requires, since those
   people are not told one by one (Art. 14(5)(b)): what is collected, from where, why, how long
   (until it leaves the kommune's page, at most a month after), and how to ask for removal.
3. **The kommune switchboard**, labelled "Sentralbord", accepted automatically. It is a true
   number, and the switchboard can transfer the caller to the right unit.

### The Lavterskel rule

A service is lavterskel when it is **free** and needs **no vedtak or referral** from a doctor or
anyone else. This replaces the 2026-10-15 rule, where the badge did not depend on cost.

| Outcome | When |
|---|---|
| Yes, automatic | Quotes show both: free ("gratis", "koster ingenting", "uten egenandel", or `Cost` Free or Partly, where entry is free) and no referral ("uten henvisning", "trenger ikke vedtak", "drop-in", "lavterskeltilbud") |
| No, automatic | A quote says it needs a vedtak, a referral or a fee for the service itself |
| Review | Anything else: silent on cost or referral, conflicting quotes, unclear negation |

To make the automatic yes cover more rows, the pipeline has a small table of service types that
are free by law, one Lovdata source each. Every entry is verified against Lovdata when the table
is built, and none is added from memory. My review answers are saved in the curated file. The
golden test lists today's badge rows that cost money, so I decide those once.

### Descriptions

**Postponed (06.11.2026).** PR 3 drafts no descriptions, and rows go without one until a later
decision. The rules below stand for when descriptions return.

Writing nb and en descriptions for every row in 357 kommuner by hand is not realistic, so the
extract stage drafts them.

- The model drafts each description from the unit's accepted quotes only, never from the whole
  page or its own knowledge.
- **Description gate:** every number, name, address, time and price in the draft must match a
  value in the lock file, or the draft is rejected and drafted again once. A second failure
  sends it to review. The en draft keeps every number digit for digit, as the Lavterskel spec
  already requires for cost notes.
- **Label.** AI-written text that informs the public must be labelled under the EU AI Act
  (Art. 50), unless a human has edited it and taken responsibility. A drafted description is
  stored with `descriptionSource: "ai"`, and the site labels it ("Beskrivelsen er skrevet med
  KI ut fra kildesiden"). When I write or edit one myself it becomes `"human"` and loses the
  label. The 138 existing rows are `"human"`. Showing the label is part of the UI follow-up.

### Trust levels

| Level | Shown when |
|---|---|
| Register value | Verified by record id and fetch date |
| Extracted value | Gates 2 to 5 pass. Goes to review only when a gate fails |
| Crowd tip (later) | Never, until a human confirms it against a primary source |

## Sources

### Pilot sources

| Source | Gives | Notes |
|---|---|---|
| Enhetsregisteret (brreg), SN2025 codes | Units, addresses, org numbers, update feed | Nav 88.995, barnevern 88.991, frivilligsentral 88.996, helsestasjon 86.942, rus 88.994, krisesenter in practice 87.999. Legevakt by name only (shares 86.210 with GPs). Phone is often the switchboard. NLOD |
| nav.no/kontor pages | Office hours, `kunTimeavtale` | JSON embedded in each office page |
| NKLM legevakt list | Legevakter and legevaktsentraler | `granted` 05.11.2026. Credit: «Oversikt over legevakter i Norge, NKLM (NORCE), per 01.01.2026» |
| SSB KLASS | Kommune numbers, area tables | Classification 131; correspondence tables 2873 to 2876 |
| Kartverket adresse API | Address check | Validity gate |
| dinutvei.no | Help services for violence and abuse | WordPress API, 253 entries. Licence request |
| Konfliktrådet | Konfliktråd offices | WordPress API |
| Kirkens Bymisjon, Frelsesarmeen | Voluntary services | Bymisjon WordPress API (144 tilbud). Licence request to Bymisjon |
| frivilligsentral.no | 577 sentraler in 337 kommuner, org numbers | Licence request |
| frivillighetnorge.no/medlemmer | 385 member organisations | HTML only, no licence. A filtered checklist of national organisations, not a feed |

**Closed to me:** RESH, Lokasjonsregisteret and the NORG2 API. An access request to NHN is
optional.

**Catalogues and the database right.** Bare facts are not protected by copyright, but
åndsverkloven § 24 protects a catalogue as a whole against repeated, systematic extraction.
Until a catalogue owner says yes, the pipeline uses that catalogue to find a provider's own
page and to cross-check, and takes the facts from the provider's page or a register. Register
data under NLOD gets its credit line on Om Varde, under "Kilder og lisenser".

**Licence requests.** I send them myself, from drafts prepared in the first build PR: Prokom
(the Aim API, 29 kommuner), Nav, NKLM, NKVTS (dinutvei), Norges Frivilligsentraler and Kirkens
Bymisjon.

### Provider type

`providerType` is `offentlig` or `frivillig` (covers ideelle organisasjoner). It is a field,
not a category, because one Røde Kors activity can be both lavterskel and rus. This spec only
defines and fills the field. The UI follow-up adds the badge, a filter, a page listing the
relevant national organisations, and the header link to
https://www.frivillighetnorge.no/medlemmer.

### Kommuner that block ClaudeBot

Eleven kommuner block ClaudeBot in robots.txt: Hamar, Stange, Løten, Grue, Nord-Odal, Sør-Odal,
Våler and Røst (all on CorePublish), plus Gol, Drammen and Asker. ClaudeBot is Anthropic's
training crawler, and these kommuner have said they do not want AI on their content. So:

- The fetcher uses its own honest user agent, `VardeBot/1.0 (+https://varde.pages.dev/om)`,
  which robots.txt allows. The URL follows the domain if it changes, and the UI follow-up adds
  the Om Varde section it points to. The fetcher never spoofs a browser, and it honours each
  site's crawl delay with a 5-second floor (seen: 1, 5, 7 and 30 seconds).
- PR 3 extracts every page with rules, so their text never leaves the runner. If PR 4 adds an
  AI fallback, their pages go to a local model through Ollama (NorMistral-11B or a Gemma or
  Qwen model, picked then), never to an AI company.
- If that model misses the pass mark, those kommuner are researched by hand.
- Om Varde explains how the pipeline works.

## Freshness, privacy and security

### Schedule

| When | What | Needs the API key |
|---|---|---|
| Daily | Read the brreg update feed. A removed unit flags its row | No |
| Weekly | Compare sitemap `lastmod` dates and JSON-LD `dateModified`. CorePublish's `Last-Modified` header echoes the fetch time and is ignored | No |
| Monthly | Check every stored quote is still on its page. Re-extract only pages whose quote has gone | Yes, for re-extraction |
| Per field | Due after 12 months, or 3 months for acute lines (nødtjenester, legevakt, krisesenter). Not re-verified by the due date means review | No |
| Per date | `recheckAfter` from the curated file | No |

### Where it runs

Scheduled GitHub Actions on standard runners, which are free for public repositories. My PC is
only for the first pilot run and for debugging.

- **API key (only with an AI fallback after PR 4):** a GitHub secret I paste in myself, like the Cloudflare and Neon secrets today.
  Claude never sees the value. It belongs to its own Console workspace with a monthly spend
  limit of $5 and an alert, so a bug cannot cost more. Opt-in data sharing in the Console stays
  off.
- **Forks:** pull requests from forks get no secrets, and no workflow uses `pull_request_target`.
- **Bot token:** PRs opened with `GITHUB_TOKEN` do not start CI, so the workflows open PRs with
  a fine-grained token scoped to this repository: contents and pull requests write, no
  workflows permission, one-year expiry. The ruleset already blocks direct pushes to `main`, so
  the token can only reach `main` through a PR. I create it.
- **Workflow hygiene:** top-level `permissions:` read-only, raised per job only where needed.
  Third-party actions pinned to a full SHA. Scheduled jobs share a `concurrency` group, so two
  runs never write the same branch at once. Page text and quotes never pass inline through
  `run:`; they go through files.
- **Ollama on the runner (same):** a pinned Ollama release with its checksum checked, never
  `curl | sh`, and the model pinned by digest. Only the model is cached with `actions/cache`
  (it is public data). The pilot measures whether a public runner (16 GB RAM) is fast enough.
- **No page cache in Actions.** On a public repository, a fork's PR workflow can restore caches
  from the default branch. Raw pages can hold staff names, so in Actions they live only in the
  job's temporary folder and die with it. Pages are cheap to fetch again.
- **Logs are public.** Actions logs on a public repository can be read by anyone. The pipeline
  logs counts, URLs, gate names and kommune numbers, never page text, quotes or values.
- **A schedule that stops is noticed.** GitHub turns off scheduled workflows in a public
  repository after 60 days without activity. The monthly quote check always ends in a
  refresh-only commit, so the repository is never idle that long. A failed scheduled run emails
  me (GitHub's default for the person who last edited the schedule).

### Auto-merge rule

- **Refresh-only PRs merge themselves** once CI is green. A required check,
  `pipeline check-refresh-only`, runs on every PR. It passes at once unless the PR's head is
  the `data/refresh` branch of this repository (a fork's branch of the same name does not
  count). On that branch it fails if the diff touches anything other than `verifiedAt` and
  `fetchedAt`. The auto-merge trusts that check, not the bot.
- **Visible changes wait for me**, batched into one weekly PR. Its body lists each review item
  with the quote and the source link. I decide with the review command. Quotes are page text,
  so in the PR body they sit inside code blocks: no raw HTML, no images, no live links, and no
  `@` mention can ping anyone.
- If nothing needs me, no PR waits.

### Privacy

- The only personal data stored is a manager's number that the kommune publishes as the unit's
  contact: the number and the role, never the name. Om Varde says how to ask for removal.
- The raw page cache is never committed. In Actions it lives only in the job's temporary
  folder; locally it is gitignored and purged after 90 days.
- Only cleaned text from public pages goes to the Claude API, and the CMS adapters cut it down
  to the unit's own content block first. API inputs are not used for training by default. Page
  text can still hold staff names, so Anthropic acts as a processor for it, outside the EEA.
  Confirm before PR 3: that the Commercial Terms' data processing addendum applies to my
  Console account, and which transfer basis it names (SCCs or the Data Privacy Framework).
  If it does not hold, the 11-kommune setup (Ollama on the runner) becomes the setup for
  everyone. (Amended 06.11.2026: PR 3 sends nothing to any API, so this check moves to the
  AI fallback decision after PR 4. What I found on 05.11.2026: the DPA is part of the
  Commercial Terms, uses SCCs, and covers the API only, not a Pro or Max plan.)
- Telemetry is off in every tool the pipeline runs (Ollama with `OLLAMA_NO_CLOUD=1`, Playwright
  and the rest).

### Security

- **Fetcher:** allow-listed hosts only, HTTPS only, private IP addresses blocked, size and time
  limits, no JavaScript run by default. Redirects are followed by hand, at most 5 hops, and
  every hop is checked again against the allow-list and, after DNS resolution, against the
  private-address block.
- **Page text is data, never instructions.** The model gets no tools during extraction and must
  answer in the schema. The grounding gate means injected text cannot add a value that is not on
  the page.
- The pipeline writes only to `data/`. CI runs the schema and the gates again on every PR.
- Dependencies are pinned and covered by Ward's Dependabot.
- For research sessions only: the Playwright MCP and the reference fetch server (`uvx`). No
  Norwegian community MCPs; several brreg MCP packages on npm look like name-squats.

## Pilot

**Innlandet, 46 kommuner** (KLASS 131 on 2026-10-28, codes 3401 to 3454), plus Oslo, so the
whole answer key is scored.

**Pass mark.** All four must hold:

1. **Zero wrong values.** No accepted field differs from the answer key once disagreements are
   resolved. Values are compared normalised (phone digits, URL, Kartverket address id). When
   the key turns out to be stale, the key is fixed, and that counts as a find, not a failure.
2. **At most 1 row in 10** has a field in review.
3. **At least 9 in 10** of the answer-key services in the pilot kommuner are found (matched by
   org number, or by name and address).
4. **Lavterskel badges match the key**, apart from rows the new rule changes. Those come to me
   once.

The pilot output is scored but not published. Order: the pilot passes, spec B ships, then
Innlandet goes live.

## Rollout (sub-project C)

- One fylke per PR, ordered by population (SSB table 11342), unless I set another order.
- Outside the pilot there is no answer key. Before each fylke merges, 20 random accepted rows are
  checked by hand against their sources, in a fresh session.
- One wrong value stops the rollout. That case becomes a gate fix and a test fixture before the
  next fylke.

## Testing

- **Schema:** Zod tests, plus a snapshot of the exported JSON Schema.
- **Gate unit tests with fixtures:** a switchboard number; a manager's mobile on the unit page
  (kept, name dropped); a mobile from a staff list (dropped); a krisesenter address; negation
  quotes ("krever ikke henvisning" against "krever henvisning"); a lavterskel service with a
  fee; a free-to-attend service with paid coffee (badge kept); hours over 200 characters;
  phone number ranges; a page with injected instructions; a description draft holding a phone
  number that is not in the lock file (rejected).
- **Every gate has a fixture it must reject.** A gate with no red case is not done.
- **Adapter tests:** small trimmed HTML fixtures per CMS, with no personal data in them.
- **Golden test:** runs in CI against the committed lock files and `answer-key.json`, so it
  never needs the page cache. One planted wrong value proves it goes red.
- **Refresh-only check:** passes on a date-only diff on `data/refresh`; fails on any other
  change there; treats a fork's `data/refresh` as an ordinary PR.
- **Fetcher tests:** a redirect to a host off the allow-list and a host that resolves to a
  private address are both refused.
- **Fail-closed test:** a run stopped in the middle of verify leaves the previous lock file
  byte for byte the same.
- **Log test:** a full run over the fixtures writes none of the fixtures' phone numbers,
  names or quotes to its log.
- **PR body test:** a quote holding `@someone`, `<img>` and backticks renders as inert text.
- **Dry-run mode:** every stage can run without writing, and publish can write the PR body
  without opening a PR.

## Cost

| Item | Cost |
|---|---|
| GitHub Actions, standard runners, public repo | $0 |
| First national run, Haiku 5.5 batch | About $3 |
| Monthly re-extraction | About $0.0003 a page; 1,000 pages is $0.30 |
| Sonnet 5.5 | Only pages Haiku fails on |
| Ceiling | $5 a month, enforced by the workspace spend limit |

Amended 06.11.2026: PR 3 extracts with rules, so the pipeline costs $0. The model rows above
apply only if PR 4 leads to an AI fallback.

Amended 12.11.2026: PR 3 as built. The extraction file has its own schema. `alwaysOpen` next to a
number goes to review. `phoneHours` comes from the next line only after "Telefontid". A unit's
website match includes it. A bare hour range counts only right after "kl" or a day word. My
answer settles validity and Lavterskel safety reviews, and decision evidence nests `original`.
Review accepts a typed "keep" for an edit the gate would only send to review. NKLM is fetched
only on `--nklm-fetch`, from the project page's file on `www.norceresearch.no`.

## Delivery

Each PR leaves `main` green. None of them changes what the site shows.

1. **Skeleton:** `pipeline/` workspace, Zod schema and JSON Schema export, curated and lock
   formats, all five gates with their fixtures, the answer key and the golden test harness. No
   network. Licence request drafts.
2. **Discover and fetch:** registers (brreg, Nav, KLASS, Kartverket), sitemaps, the
   fetcher with robots and crawl delay, the CMS adapters. Detail in "PR 2: discover and
   fetch" below.
3. **Extract, verify, review:** the field rules, the NKLM reader and the review command. Detail
   in "PR 3: extract, verify, review" below.
4. **Pilot run:** Innlandet and Oslo scored against the pass mark, with a report in the PR. Not
   published.
5. **Automation:** the scheduled workflows, the bot token, `check-refresh-only` and the
   auto-merge rule.

Then spec B, then Innlandet goes live, then the rollout. The UI follow-up, with the Om Varde
notice and "Kilder og lisenser", ships before the first pipeline row goes live, because the
Art. 14 notice and the NLOD credit lines must be there from the first published value.

## PR 2: discover and fetch

Decided in the brainstorm on 02.11.2026 and 03.11.2026. Where this section and an earlier one
disagree, this section wins.

### What it delivers

- The `discover`, `fetch` and `recall-report` commands. Nothing new goes into `data/`.
- Done when every test passes and the PR body holds the recall report.

### Modules

- `src/net/` is the only code that touches the network. It reads robots.txt (`Disallow`,
  `Crawl-delay`, `Visit-time`, `Sitemap`), keeps one queue per host and sends the `VardeBot`
  user agent. It writes each page plus a manifest (URL, status, final URL, fetch time, content
  hash) to the cache folder.
- `src/registers/` has one reader each for Brreg (enheter and underenheter by SN2025 code,
  legevakt by name), the nav.no office pages (`__NEXT_DATA__`), KLASS 131 (kommuner and their
  changes) and the Kartverket address API.
- `src/discover/` reads the sitemaps robots.txt lists, and tries `/sitemap.xml` on every host
  even when robots.txt lists none. Engerdal serves 773 URLs there and lists no sitemap.
  Catalogues (dinutvei, Bymisjon, Konfliktrådet, frivilligsentral.no) only point to a
  provider's own page.
- `src/adapters/` holds ACOS, CorePublish, Sitevision, the site rule list and the fallback.
  Each one detects its CMS, returns the page's main text and sets the value's `origin`.
- Fetch, extract and verify run in one Actions job and share its temporary folder. Locally the
  cache is `.cache/pages/`. Artifacts are not used: on a public repository anyone signed in can
  download them.
- The NKLM reader waits for PR 3 or for NKLM's licence answer. Until then legevakter are found
  through Brreg names and kommune sitemaps.

### Crawl rules

- Wait 5 seconds or the host's `Crawl-delay`, whichever is longer, between two requests to
  one host. One request at a time per host, hosts in parallel. The slowest host sets the job's
  length either way (Kongsvinger asks for 30 seconds), so the floor costs no total time.
- On 429 or 503, wait as long as `Retry-After` says. A second one stops that host for the run.
- `Visit-time` is honoured for every host. Outside the window the host is skipped and named in
  the run report. frivilligsentral.no asks for 02:00–05:00 UTC+1, so the scheduled runs in
  PR 5 start at 01:00 UTC.
- 30 seconds timeout and 5 MB cap per request. PDFs and other non-HTML responses are skipped
  and listed.
- A redirect is followed only to an allow-listed host, and robots.txt is checked again there.
- A host that fails (a timeout, a server error, a second 429) is skipped for the run and
  listed. The run goes on.

### CMS coverage

Innlandet runs ACOS (34), CorePublish (8), Sitevision (3: Ringsaker, Nordre Land, Gran) and
Optimizely (1: Søndre Land). Oslo is on CorePublish by the vendor's account, unconfirmed.

- **Sitevision gets an adapter now.** The three Sitevision homepages share one template
  (`main.svp-main` and the same generated class names), so one adapter should fit the other
  Sitevision kommuner too.
- **Optimizely gets no adapter.** Each site is built by an agency: Asker marks its content
  `main#main-content`, Drammen `main.mainBody`, and Søndre Land has no `<main>` at all. A site
  rule list maps a host to the selector of its main text instead. Søndre Land is the first row.
- **Everything else falls back to `<main>`.** Values from fallback pages are marked, and PR 3
  sends them to review.

### Licences

`LicenceStatus` gains `ccBy` (CC BY 4.0). It works like `nlod`: free reuse, with a credit line
under "Kilder og lisenser".

| Source | Status |
|---|---|
| nav.no office pages | `ownPage`: Nav describes its own offices. The licence request to Nav still goes out |
| Aim API (Prokom) | `pending` until Prokom answers. Those kommuner's own pages are read instead |
| Kartverket, KLASS | `ccBy` |

### Fixes carried over from PR 1

- Register evidence names its register, and the source gate checks that register's licence
  (`nlod` or `ccBy`).
- Agreement independence compares registrable domains (the Public Suffix List, through
  `tldts`), not hostnames.
- A `unitPage` origin must be the unit's own host.
- `unitId()` only emits ids that `UnitId` accepts. An email domain no longer grounds a root URL.
- The kommune number is checked against the kommune name through KLASS.
- The lock's `Evidence` register list and the `SourceRef` kinds agree (`klass`, `kartverket`).
- PR 1's "no network" rule becomes: only `src/net/` touches the network, and no test does.

Moved to PR 3: several person names per candidate (ruling 28), dot-grouped phone numbers, and
how the length of opening hours is counted. Settled in "PR 3: extract, verify, review", under
"Field rules".

### Dependencies

`cheerio` reads HTML and sitemap XML by CSS selector. `tldts` finds registrable domains.
Both are pinned and covered by Dependabot.

### Tests

- No test touches the network. A fake fetcher and a fake clock test the 5-second floor,
  `Retry-After`, the stop after a second 429, and `Visit-time`.
- The robots reader: `Disallow`, `Crawl-delay`, `Visit-time` and `Sitemap` lines, and a
  missing robots.txt.
- Each adapter and the site rule list: trimmed saved pages with no personal data in them.
- The fallback marks its pages.
- Recall matching: one case per matching rule below, and one miss.
- The fetcher tests above (a redirect off the allow-list, a private address) land here.

### Recall report

Run once by hand against the live sources for Innlandet and Oslo. Discover only: no page text
and no model.

- An answer-key service counts as found when discover lists it by org number, by name and
  address (pass mark 3), or by the service's own website URL, since sitemaps give URLs and
  not names.
- The PR body shows "found X of 138" against the 9-in-10 bar. It lists each miss with its
  kommune and a likely reason, and every host that was skipped for its visiting hours or a
  failure.
- A low number does not block PR 2. Each miss becomes a discover fix before the pilot run in
  PR 4.

## PR 3: extract, verify, review

Decided in the brainstorm on 05.11.2026 and 06.11.2026. Where this section and an earlier one
disagree, this section wins.

### What it delivers

- The `extract`, `verify` and `review` commands, and the NKLM reader.
- Nothing new is committed to `data/`. The local trial run writes to a temporary folder, and
  PR 4 commits the pilot's lock files.
- Done when every test passes and the PR body holds the trial run's counts (accepted, review,
  dropped) for the kommuner it covered.

### Decisions

1. Extraction is rule-based. No AI model in PR 3, so no account, no bill, and no page text
   leaves the machine or the runner. Descriptions are left out of PR 3.
2. Units enter the curated file automatically when the match is clear. Anything unclear is one
   review question: "include this unit?"
3. Values from a bare `<main>` (the fallback adapter) pass all five gates like any value.
4. The NKLM reader is part of PR 3. Licence granted by email on 05.11.2026.
5. The NKLM file is read with `fflate` and the `cheerio` the pipeline already uses.
6. The contact block is the CMS contact box where the adapter knows it, else the lines under a
   Kontakt heading.
7. Opening hours stay text. A tested formatter rewrites only the times into house style.
8. The review command is a terminal walk-through, one item at a time.

### Parts and data flow

PR 3 adds three commands: `extract`, `verify` and `review`. Each reads the previous stage's
files and writes its own.

#### extract

Reads each cached page (the raw HTML PR 2 stores) and runs the same adapter again. Then:

- `extract/contactBlock.ts` finds the unit's contact block: the CMS contact box first
  (selectors taken from fetched pages, never guessed), then the lines under a "Kontakt",
  "Kontakt oss" or "Kontaktinformasjon" heading. Values inside it get origin `unitContact`.
  Everything else stays `unitPage`.
- `extract/fields/*.ts` holds one small rule file per field: phone (with role label and phone
  order), email, address, opening hours, website and the Lavterskel quotes. Each rule returns
  the value together with the exact page line it came from, so the quote is verbatim by
  construction. A rule that cannot decide emits a review candidate, never a guess.
- `text/hours.ts` is the time formatter: `13.00-18.00` becomes `kl. 13:00–18:00`.
- Output: one extraction file per kommune, in its own schema (`src/schema/extraction.ts`), cache only.

#### NKLM reader

`xlsx/read.ts` (`fflate` plus `cheerio`) and `registers/nklm.ts`. The file is fetched only when
I run `verify --nklm-fetch`; every other run rereads the saved copy. A changed hash is recorded in
`state.json`. It finds legevakter and the kommuner each one covers. It never supplies a
phone number or an address on its own: those must agree with the legevakt's own page.

#### verify

Builds the real `GateContext` from the cache, the registers and the NKLM data
(`verify/context.ts`, the assembly left over from #114). Runs the five gates and writes the lock
file. Unit inclusion lives in `curate/include.ts`. A match is clear when exactly one register
unit and exactly one fetched page belong together (by org number, by normalised name plus
Kartverket address id, or by the unit's brreg website normalising to the page URL, which also
needs the page's h1 to name the unit) and the category is known (from the SN2025 code or a known service
path). A clear match gets `include: true`. Anything else (two units for one page, two pages for
one unit, no category) becomes one review question.

#### review

The terminal walk-through. Each answer is written to the curated file at once.

Network access stays in `src/net/` only, and no test touches the network.

### Field rules

Every rule reads the adapter's text for the page, plus the contact block when one is found.
Fallback pages (a bare `<main>`) run the same rules, but only the heading rule can find a
contact block on them. Each rule hands the verify stage a value, its verbatim quote and its
origin. The gates then decide; no rule accepts a value itself.

**A page shared by several units** (a kommune page such as "Helsestasjoner i Gjøvik" that
lists three services) can put a real number on the wrong unit, and no gate catches that. When
one page is the source for two or more units, its phone, email and address values go to
review, unless the contact block's own heading names the unit (decided 06.11.2026). PR 4
measures what this costs in review share.

Page text comes from sites I do not control, so every rule pattern runs in linear time: no
nested or overlapping quantifiers, and a line longer than 2,000 characters is skipped as not a
contact line.

#### Phone

A number is any run that `phoneDigits` turns into a valid Nkom number. Two cases are new:

- **Dot-grouped numbers** such as `61.13.20.00` or `611.32.000`. Today `quoteHasPhone` blanks
  every dotted run as a time or a date. A dotted run counts as a phone only when it has four
  groups of two digits or the groups 3-2-3, which no time (`08.00`) or date (`27.10.2026`) has.
  `quoteHasPhone` learns the same two shapes, so the grounding gate finds these numbers too.
- **Mobile or not:** an 8-digit number starting with 4 or 9 is a mobile, so the safety gate
  needs a role label for it.

The phone order from the main spec decides which number the unit gets:

1. **Service phone:** a number in the contact block next to "Telefon", "Tlf", "Vakttelefon" or
   the unit's name, with no person name on the line. A landline with a person name on its line
   is not a service phone: it follows rank 2 (role word needed, name never stored) or goes to
   review. A time range on the same line becomes
   `phoneHours` (through the formatter), and so does one on the line after, but only when that
   line says "Telefontid". "Døgnåpen" or "hele døgnet" sets
   `alwaysOpen` only when the phrase stands alone on its line. Next to a number it goes to
   review, because the grounding gate would not pass it as a plain claim. Any other
   word on that line ("ikke", "unntatt", "i helgene", a day name) sends it to review. A wrong
   `alwaysOpen` on an acute line tells someone at night that a closed place is open.
2. **Role mobile:** a mobile in the contact block with a role word on the same line or the line
   above. The role words live in one list in code ("Avdelingsleder", "Enhetsleder" and so on),
   and each word is added from a fetched page, never from memory. A mobile with no known role
   word goes to review, as the safety gate already says.
3. **Sentralbord:** the kommune switchboard, labelled "Sentralbord", only when ranks 1 and 2
   are empty. It is read once per kommune: from the kommune's own record in brreg (register
   evidence), or from the kommune's own contact page where the number sits next to
   "Sentralbord" or "Servicetorg" (a quote).

Two different numbers on the same rank with no label that tells them apart: review.

#### Person names (ruling 28)

Lock files and PR bodies are public, so a missed name is a leak. Two rules:

- **A role mobile stores no line at all.** Its quotes are just two verbatim pieces of the page:
  the role word and the number (for example "Avdelingsleder" and "912 34 567"). Nothing else
  from that line is stored, so no name can slip through, whatever its shape.
- **Every other quote** (hours lines, Lavterskel sentences) runs the name redaction.
  `personName` becomes `personNames`, a list. Every capitalised word, and every run of them,
  that is not a role word, a place name from KLASS, a day or month name, or a word of the unit's
  own name counts as a possible name and is redacted. It redacts too much on purpose.

Redaction happens after the grounding gate, which matches the raw quote, so the gate still
works. Names are never stored, as today.

#### Email and website

- **Email:** `mailto:` links and plain addresses in the contact block first, then the rest of
  the page. The safety gate's existing rule drops an address that may be a person's own.
- **Website:** the unit's own page URL, which is already grounded by the fetch.

#### Address

- Lines in the contact block with a four-digit postcode. "Besøksadresse" wins over
  "Postadresse", and a "Postboks" line is never a street address.
- **"1 A" and "1A":** `pickAddress` compares street numbers with the space between the number
  and the letter removed, so `Storgata 1 A` matches Kartverket's `Storgata 1A`. The stored value
  is Kartverket's own address text. Before writing this rule I check Kartverket's form against a
  recorded API answer in the test fixtures. That answer is for a public building (a rådhus),
  and the fixtures README lists it as its second real-data exception, under CC BY 4.0 with
  Kartverket's credit.
- Krisesenter addresses keep the safety gate's rule: only from a quote on the centre's own page.

#### Opening hours

- Source, in this order: Nav's page JSON (nav.no offices), the CMS hours box, then the lines
  under an "Åpningstider" heading until the next heading.
- The formatter rewrites times only: `13.00-18.00`, `13-18` and `kl 13.00 - 18.00` all become
  `kl. 13:00–18:00`. Day names and other words stay as the page wrote them. A time the
  formatter cannot read sends the field to review rather than storing it half tidied.
- A time is hours 0 to 24 and minutes 0 to 59. An end before the start is allowed, because an
  overnight legevakt runs `kl. 15:00–08:00`. A bare range without minutes (`13-18`) counts as
  times only right after "kl" or a day word, so "1-2 ganger i uka" stays text.
- **Length:** counted in characters (Unicode code points) on the final stored text, after the
  formatter and after runs of whitespace collapse to one space. Over 200: review.

#### Lavterskel quotes

Sentences in the page text that hold a phrase from the existing phrase table
(`gates/phrases.ts`), from the whole page rather than only the contact block. The rule only
collects the quotes; the Lavterskel rule in the safety gate decides the badge.

### Review command and curated answers

`npm run review` is a local command. It never runs in CI. `--kommune <number>` limits it to
one kommune; the number must be a valid KLASS kommune number, checked before it is used in any
file path. With nothing open it says "Nothing to review" and exits.

#### What it asks

It reads every lock file, collects the fields with status `review` and the "include this unit?"
questions, and drops every question the curated file already answers. The order is acute units
first (nødtjenester, legevakt, krisesenter), then by kommune, unit and field.

Each item shows, in this order:

- progress ("3 of 17"), kommune, unit name, field
- the value, and the role label for a role mobile
- the quote, as plain text in a framed block
- the source link
- why it is in review (the gate's reason)

Page text can hold terminal control codes. Every quote, value and link has control characters,
escape sequences (including OSC 8 links, whose text can differ from their target), Unicode
bidi controls and zero-width characters stripped before it is printed. So a page cannot
recolour, clear or rewrite my terminal, or make a quote or link read differently from what it
is. The link's host is also printed on its own line.

Meaning never rests on colour. The frame is plain ASCII, every item lists its keys in text, and
`NO_COLOR` turns colour off.

#### My answers

Each answer is a key followed by Enter, so a stray or repeated key press never commits
anything. A wrong answer is still easy to take back: the curated file is tracked in git, so
`git diff` shows every answer before I commit, and a changed answer is one line to edit.

| Key | Does | Stored as |
|---|---|---|
| a | accept the value as shown | `decision: "accept"` |
| r | reject it | `decision: "reject"`, the field is dropped |
| e | type my own value | `decision: "edit"` plus `editedValue` (and `role` for a phone) |
| s | skip, ask again next time | nothing |
| q | quit | nothing; all earlier answers are already saved |

For "include this unit?" the keys are y (include, then pick its categories from a numbered
list) and n (leave out, then type the reason). That writes `include`, `categories` and
`excludeReason` on the unit, which the schema already requires.

An edited value runs the validity gate and the safety gate before it is saved. A value that
fails is refused on the spot with the gate's reason, and the same item is asked again, except
when the gate would only send the value to review. Then review shows the reason and I type
"keep" to save it anyway, or type the value again. A drop is still refused on the spot.

#### How an answer is stored

- `ReviewDecision` gains `"edit"` and an optional `editedValue` and `role`. A question is still
  one value for one field from one page, so the key (`field`, `value`, `sourceUrl`) stays the
  page's value, not mine.
- `Evidence` gains a third kind, `decision`, with `decidedOn` and the original evidence nested
  as `original` (a register record or a page quote). `verify` uses it for an accepted or edited
  answer, and the grounding gate and the agreement gate pass it with the reason "my decision of
  <date>". Validity and safety still run on every verify, but my answer settles what they only
  send to review: a validity review, and a Lavterskel safety review when the rule's outcome is
  review (silent or unclear). A drop still drops, a mobile still needs a role, and a rule that
  gives an automatic yes or no my value contradicts stays in review (ruling of 06.11.2026).
- When the page's value changes, the key no longer matches and the question comes back. When
  the quote leaves the page, the monthly quote check drops the value, as for any other.
- Each answer is written at once: the curated file is checked against its schema, written to a
  temporary file, then renamed over the old one. A crash mid-write leaves the old file whole.
  On Windows a rename can fail for a moment while another program holds the file (an editor, a
  virus scanner). The write retries a few times, then stops with a clear message and keeps
  the temporary file, so no answer is lost.

### Errors

- **Per kommune, fail closed.** `extract` and `verify` write each kommune to a temporary file
  and rename it over the old one only when that kommune is complete, as the main spec already
  says for every stage.
- **One bad page** (no adapter text, HTML the rules cannot read) gives its unit no values from
  that page. The run goes on. The summary counts it by reason; reasons never hold a value, a
  quote or a URL, because the summary ends up in public logs.
- **NKLM file:**
  - It is downloaded only on `verify --nklm-fetch`, from
    https://nklm.norceresearch.no/file/oversikt-over-legevakter-i-norge, which redirects to the
    allow-listed host `www.norceresearch.no`. The saved copy is reread every run, and the file is
    kept only when its hash matches an edition the licence covers. The raw file is never
    committed. The Sources list links NKLM's project page. Without the download, the reader
    takes a local path I set (`--nklm-file`).
  - The permission I have covers the 01.01.2026 file. A new edition stops the NKLM step with
    "new NKLM edition: licence check needed", and nothing from it is used until I record in
    `docs/licence-requests/README.md` that the permission covers it too.
  - The reader checks the column headers first. A missing or renamed column fails the NKLM step
    with a clear message, and no NKLM fact is used that run. Legevakter are still found through
    the other sources.
  - The zip is read with limits: at most 20 MB unpacked, and only the workbook, the shared
    strings and the first sheet. The limit counts the real bytes while they are unpacked and
    stops at 20 MB. The size a zip entry declares is never trusted, because a zip bomb lies
    about it. `cheerio` reads the XML in XML mode and never resolves an
    external entity.
  - NKLM facts enter the lock as register evidence: register `nklm`, record id = file date plus
    row number.
- **Review command:** Ctrl+C works like q. Without an interactive terminal (a pipe, CI) it
  refuses to start, so it can never answer for me.

### Testing

- **Fixtures stay fictional**, as the fixtures README requires: shapes copied from live pages,
  values like `62 00 00 00` and "Kari Nordmann". New fixtures: a contact box per CMS, a page
  with a Kontakt heading, hours in each style, dot-grouped phones, a role mobile with two names
  on the line, and a fallback page.
- **Per rule:** one test file per field rule, plus a table test for the hours formatter (each
  input style and its house-style output, and the unreadable cases that must go to review).
- **NKLM:** the test builds a tiny `.xlsx` in memory with `fflate`, with fictional rows, a
  renamed column, an oversized entry, an entry that declares a small size but unpacks past the
  limit, and a new edition date that must stop the step.
- **Must-fail fixtures for the stress-test fixes:** a role-mobile line holding a single name, a
  three-part name and a hyphenated name (none of them in any stored quote); a landline next to
  a name (not rank 1); "ikke døgnåpen" and "døgnåpen i helgene" (review, never `alwaysOpen`);
  `25.00`, `13.75` and "1-2 ganger" (review or text, never a time); a page matched by two
  register units (review, not included); a page listing three services, where only the block
  whose heading names the unit is accepted; a 1 MB line of repeated digits and dots that every
  rule must finish within a second.
- **Review command:** driven by fake input and output streams in a temporary folder. Tests cover
  each key, a key without Enter (nothing saved), the stripping of escape codes, OSC 8 links and
  bidi controls, `NO_COLOR` output with no escape code in it, `--kommune ../x` (refused), an
  empty queue, the refused edit, the atomic write with a rename that fails once, and the
  non-terminal refusal.
- **Golden test:** unchanged. It still expects no lock files; PR 4 commits the pilot's.
- **Network boundary test** covers every new file.
- **Before the PR:** `npm test`, `typecheck` and `lint` in `pipeline/`, and the web suites
  (`npm test` and the full `npm run e2e`). Then one local run of `extract` and `verify` on the
  PR 2 page cache for a few kommuner, which prints counts only (accepted, review, dropped). It
  is a first look at the review share. PR 4 owns the real measure.

### What changed elsewhere in this spec

- Decisions 9 and 12, "Stages" (with "Failing halfway"), the Zod schema line, "Descriptions",
  "Kommuner that block ClaudeBot", "Where it runs", "Cost" and "Delivery" carry a short amendment note: PR 3 has no AI model, no key and
  no spend. An AI fallback, with its key, spend limit and Ollama, is decided after PR 4
  measures the review share against the 1-in-10 target.
- The Sources table marks NKLM `granted`, with its credit line. PR 3 records the answer in
  `docs/licence-requests/README.md` (a role, not a name). The credit line joins "Kilder og
  lisenser" in the UI follow-up, before the first NKLM-backed row goes live.
- "Moved to PR 3" under PR 2 points to "Field rules" above.
- "Considered and rejected" gains an AI model for extraction in PR 3.
- The Console DPA check under "Privacy" moves to the AI fallback decision.

### Schema changes

- `Register` gains `nklm`, and the source gate accepts `granted` as the licence for it.
- `ReviewDecision` gains `edit`, plus optional `editedValue` and `role`.
- `Evidence` gains the `decision` kind (`decidedOn` and the original evidence, nested as `original`).
- `Candidate.personName` becomes `personNames`, a list.

### Dependencies

`fflate` joins `cheerio` and `tldts`: MIT, no dependencies of its own, pinned and covered by
Dependabot. It unzips the NKLM `.xlsx`, and `cheerio` reads the sheet XML.

## Considered and rejected

- **Running the pipeline on my PC.** Safer for the key, but it needs me every week. GitHub
  secrets already hold Varde's other credentials, and the spend limit caps the risk.
- **Auto-merging every change.** A changed phone number reaching users unseen breaks the
  never-wrong rule. Only date refreshes merge themselves.
- **Frivillige organisasjoner as an 11th category.** One activity can belong to several
  categories; provider type is a separate axis.
- **Sending every switchboard number to review.** Brreg often lists the switchboard, so the
  review pile would grow, and the number is true.
- **A browser user agent for the blocking kommuner.** Dishonest, and it takes away their way to
  block Varde by name.
- **The Claude Code subscription for the bulk run.** Bulk extraction sits outside ordinary
  individual use under the Consumer Terms. The API runs under the Commercial Terms.
- **Hiding a value as soon as its quote leaves the page.** For an acute line, a hidden number
  can do more harm than an old one, and the same monthly run usually finds the new value. The
  old value stays live with its old `verifiedAt` until the weekly PR settles it.
- **A GitHub App instead of a fine-grained token.** Tokens that never expire and finer
  permissions, but more setup than one repository needs. Revisit if the yearly token renewal
  becomes a chore.
- **An AI model for extraction in PR 3.** Rules give the verbatim quote by construction, need
  no account and no bill, and keep page text on the runner. PR 4 measures whether a model is
  worth adding, against the 1-in-10 review target.
- **A lock between `verify` and `review`.** Both run on my PC, one after the other. A lock
  file would guard a race that one person does not create.
- **An undo key in the review command.** Key plus Enter stops stray presses, and `git diff` on
  the curated file shows every answer before I commit it.
- **Decision keys that survive a formatter change.** If the hours formatter changes its output,
  those questions come back once. That costs a few answers and is never wrong.
- **A checksum for the NKLM file.** NKLM publishes none to compare against. HTTPS from an
  allow-listed host and the column check are what the reader can verify.
- **Screen-reader tuning of the review command beyond plain text.** I am its only user. Plain
  ASCII, keys in text and `NO_COLOR` keep it readable without colour or graphics.
- **Community MCP servers for brreg or Kartverket.** Unvetted code with my user rights, and
  name-squat risk. The pipeline calls the public APIs directly.

## Sources

- Enhetsregisteret API: https://data.brreg.no/enhetsregisteret/api/dokumentasjon/no/index.html
- Frivillighetsregisteret API: https://data.brreg.no/frivillighetsregisteret/api/icnpo-kategorier
- SSB KLASS: https://data.ssb.no/api/klass/v1/api-guide.html
- Kartverket addresses: https://api.kartverket.no/adresser/v1/
- NKLM legevakt list: https://nklm.norceresearch.no/prosjekter/nasjonalt-legevaktregister
- dinutvei: https://dinutvei.no/wp-json/wp/v2/help
- Konfliktrådet: https://konfliktraadet.no/wp-json/wp/v2/ditt_konfliktrad
- Kirkens Bymisjon: https://kirkensbymisjon.no/wp-json/wp/v2/tilbud
- Frelsesarmeen: https://www.frelsesarmeen.no/lokalavdelinger
- Frivilligsentraler: https://frivilligsentral.no/register
- Frivillighet Norge: https://www.frivillighetnorge.no/medlemmer
- Prokom Aim API: https://api.aimcms.no/api
- Nkom number plan: https://lovdata.no/dokument/SF/forskrift/2004-02-16-426/KAPITTEL_3
- NLOD 2.0: https://data.norge.no/nlod
- Open Referral HSDS (staleness practice): https://docs.openreferral.org/en/latest/hsds/field_guidance.html
- Claude pricing: https://platform.claude.com/docs/en/about-claude/pricing
- Claude batch processing: https://platform.claude.com/docs/en/build-with-claude/batch-processing
- Console workspaces and spend limits: https://platform.claude.com/docs/en/manage-claude/workspaces
- GitHub Actions runner pricing: https://docs.github.com/en/billing/reference/actions-runner-pricing
- Ollama structured outputs: https://docs.ollama.com/capabilities/structured-outputs
- NorMistral-11B: https://huggingface.co/ltg/normistral-11b-thinking

> Stress-tested 2026-11-06 (skill a217382), PR 3 section: 14 applied, 2 adapted, 1 decided by me. Earlier run 2026-10-28 (skill 1b85fca), whole spec: 15 applied, 3 adapted, 2 decided by me.
