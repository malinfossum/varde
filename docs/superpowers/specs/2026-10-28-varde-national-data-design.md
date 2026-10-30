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
   extracted by a local model, so their text never reaches an AI company.
10. **It runs in scheduled GitHub Actions.** Refresh-only PRs merge themselves. Visible changes
    wait for me in one weekly PR.
11. **Publishing waits for spec B.** The pilot is scored, not published.
12. **Descriptions are AI drafts, labelled.** The model drafts them from the quotes only, a gate
    rejects any fact that is not in the lock file, and the site says they were written with AI.

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
Schema export is the structured-output schema for the model.

### Stages

Each stage is its own command, reads the previous stage's output and can be re-run alone.

1. **discover:** list candidate units per kommune from registers and sitemaps.
2. **fetch:** download each candidate's page into the cache. Obeys robots.txt and crawl delay.
3. **extract:** turn cached page text into field values with quotes (Haiku 5.5 batch; Ollama
   for the 11 blocking kommuner; Sonnet 5.5 only for pages Haiku fails on).
4. **verify:** run the five gates on every field and write the lock file.
5. **review:** a local command that walks me through open review items one at a time, shows
   the quote and the source link, and writes my decision into the curated file.
6. **publish:** open the PR. The format the site reads is spec B's.

**Failing halfway fails closed.** Each stage writes a kommune's output to a temporary file and
replaces the old one only when that kommune is complete. A run that crashes, times out or hits
the spend limit leaves the previous lock files untouched, opens no PR, and says in its summary
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
| NKLM legevakt list | Legevakter and legevaktsentraler | Licence request |
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
  site's crawl delay (seen: 1, 5, 7 and 30 seconds).
- Their pages are extracted by a local model through Ollama (NorMistral-11B or a Gemma or Qwen
  model, picked in the pilot), so the text never leaves the runner.
- If the local model misses the pass mark, those kommuner are researched by hand.
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

- **API key:** a GitHub secret I paste in myself, like the Cloudflare and Neon secrets today.
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
- **Ollama on the runner:** a pinned Ollama release with its checksum checked, never
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
  everyone.
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

## Delivery

Each PR leaves `main` green. None of them changes what the site shows.

1. **Skeleton:** `pipeline/` workspace, Zod schema and JSON Schema export, curated and lock
   formats, all five gates with their fixtures, the answer key and the golden test harness. No
   network. Licence request drafts.
2. **Discover and fetch:** registers (brreg, Nav, NKLM, KLASS, Kartverket), sitemaps, the
   fetcher with robots and crawl delay, the CMS adapters.
3. **Extract, verify, review:** Haiku batch, Ollama, the review command.
4. **Pilot run:** Innlandet and Oslo scored against the pass mark, with a report in the PR. Not
   published.
5. **Automation:** the scheduled workflows, the bot token, `check-refresh-only` and the
   auto-merge rule.

Then spec B, then Innlandet goes live, then the rollout. The UI follow-up, with the Om Varde
notice and "Kilder og lisenser", ships before the first pipeline row goes live, because the
Art. 14 notice and the NLOD credit lines must be there from the first published value.

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
- **Community MCP servers for brreg or Kartverket.** Unvetted code with my user rights, and
  name-squat risk. The pipeline calls the public APIs directly.

## Sources

- Enhetsregisteret API: https://data.brreg.no/enhetsregisteret/api/dokumentasjon/no/index.html
- Frivillighetsregisteret API: https://data.brreg.no/frivillighetsregisteret/api/icnpo-kategorier
- SSB KLASS: https://data.ssb.no/api/klass/v1/api-guide.html
- Kartverket addresses: https://api.kartverket.no/adresser/v1/
- NKLM legevakt list: https://nklm.norceresearch.no/en/file/offisiell-oversikt-over-legevakter-og-legevaktsentraler-i-norge
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

> Stress-tested 2026-10-28 (skill 1b85fca): 15 applied, 3 adapted, 2 decided by me.
