# Varde: Lavterskel and Lavterskeltilbud (sub-project C1) design

Date: 2026-10-15. Builds on the UI polish spec (2026-10-02, sub-project A, on the
`docs/ui-polish-spec` branch), whose "Out of scope" section hands Lavterskel to sub-project C,
and on the seed-data docs (`docs/seed-data.md`, `docs/seed-data-innlandet-ring.md`,
`docs/seed-data-oslo.md`). Where this document and an earlier one disagree, this one wins. This
is plan 5 backlog item 11, minus "Hjelpetelefon" and "Chat", which move to C2.

## Purpose

As a social worker, the help I reached for most often was not a hotline. It was a place: a
værested, the frivilligsentral, a café where someone could sit for an hour without becoming a
case. Those places are hard to find, they rarely show up next to NAV and the legevakt, and
whether they cost money decides whether a client can go at all. Varde should show them properly.

Two ideas live in item 11, and this spec keeps them apart:

- **Lavterskeltilbud** is a category: meeting places and activity providers in each kommune.
- **Lavterskel** is a label: a badge on any service, in any category, that needs no referral.

Both show what costs money and what is free.

The two plan 5 requirements still govern: Varde must be **fast**, and its data must be **always
current**. Activities change by season, which is why a row is a place and not a weekly event.

## Decisions locked in the brainstorm (2026-10-15)

1. **Category = places, label = no referral.** The category lists meeting places and activity
   providers. The badge marks any service whose source says it needs no referral.
2. **A row is a place, plus a few standing activities.** One row per provider or meeting place,
   linking to its own programme page. An activity gets its own row only when its source presents
   it as ongoing (rule under "What qualifies").
3. **Badge rule: no referral, stated by the source.** The cited page must say "uten henvisning",
   "ingen henvisning" or "lavterskel". An appointment does not disqualify a service, so Rask
   psykisk helsehjelp gets the badge.
4. **Cost is Free, Paid or Partly, plus a price note.** A structured value per service and a
   per-language note copied from the source. Not stated shows nothing, as with opening hours.
5. **Innlandet first, then Oslo.** Batch 1 covers Hamar, Lillehammer, Gjøvik, Ringsaker, Stange,
   Løten and Elverum. Batch 2 covers Oslo. Same spec, two data batches.
6. **The 94 live rows are re-read.** Every existing source page is read again for the referral
   statement and price wording, so the badge never appears on a new café while Rask psykisk
   helsehjelp lacks it.
7. **Landing: two featured chips.** Lavterskeltilbud sits beside Nødtjenester above the grid of
   eight, which stays as it is. Lavterskeltilbud does not borrow the red acute style.
8. **Plain fields, no label table.** `IsLowThreshold`, `Cost` and `CostNote` follow the
   `IsAlwaysOpen` and `OpeningHours` pattern. A general label table waits until a second label
   actually needs it.
9. **No C umbrella spec.** The only decisions that cross C pieces are the category count and the
   chip layout, and this spec settles both. The C map below records the order instead.
10. **No /sok filter toggles in C1.** "Only free" and "only lavterskel" belong to C4's filter
    redesign, so C1 does not build a toggle that C4 would replace.
11. **Facebook-only offers are not seeded.** Many such pages cannot be read without logging in,
    so they cannot be re-checked. Each one is logged as skipped.

## Sub-project C map

| Piece | Content | Backlog |
|---|---|---|
| C1 | Lavterskel label, Lavterskeltilbud category, cost field (this spec) | 11 |
| C2 | Hjelpetelefon and Chat as labels and categories | 11 |
| C3 | Spesialisthelsetjenesten: DPS, ambulante team, TSB, institutions | 12 |
| C4 | Filter dropdown on /sok and the fylke-then-kommune filter | 6 |
| C5 | National coverage, every fylke and kommune; static JSON split per kommune | 10 |

Each piece gets its own spec, plan and PRs. C2 and C3 may add categories. With the grid of eight
kept as it is, a ninth grid category breaks the even rows again; the spec that adds it must
either add enough categories for full rows of four or redesign the chip area. The "Alle
tjenester" mega-menu (spec of 2026-10-15) already flows three across, so a tenth category only
starts a fourth row there.

## In scope

- Category 10 `lavterskeltilbud` and its two translations.
- `Resource.IsLowThreshold`, `Resource.Cost` and `ResourceTranslation.CostNote`, through the API,
  the JSON export and the web types.
- The Lavterskel badge and one cost badge on cards and the detail page, and a "Pris" line on the
  detail page.
- The featured chip row on the landing page.
- The re-read of the 94 live rows.
- Batch 1 (Innlandet, rows 301 and up) and batch 2 (Oslo, rows 401 and up).

## Out of scope

- /sok filter toggles for free and lavterskel (C4).
- Hjelpetelefon and Chat labels (C2), Spesialisthelsetjenesten (C3), new kommuner (C5).
- Weekly schedules, event dates or "open now" for activities.
- Any source that cannot be fetched without logging in.

## What qualifies

### The category

A row belongs in Lavterskeltilbud when it is a **meeting place or an activity provider**: you go
there to be with others or to do something, without becoming a case. Examples: væresteder,
frivilligsentraler, Fontenehus, café and activity offers, drop-in centres run by organisations
such as Kirkens Bymisjon.

Treatment, case work and outreach do not qualify, even when they need no referral. Rask psykisk
helsehjelp, helsestasjon for ungdom and Uteseksjonen keep their own categories and get only the
badge. A row in category 10 may carry other categories too, as NAV does today.

Every category 10 row sits in a kommune (`MunicipalityId` set) and is never national.

### Standing activities

An activity gets its own row only when its source presents it as ongoing: no season, no end
date, no "denne høsten" or "våren 2027". A walking group that "går hver tirsdag" with no end
qualifies; an autumn course does not. Everything else is described in its place row, and the
place row links to the provider's own programme page, where the current schedule lives.

### The Lavterskel badge

`IsLowThreshold` is true only where the cited page states one of: "uten henvisning", "ingen
henvisning", "trenger ikke henvisning", or calls the service "lavterskel" or a
"lavterskeltilbud". The exact sentence is copied into the row's Notes as the **referral quote**.
No quote, no badge. The badge does not depend on cost or on whether you must book a time.

### Cost

| Value | Meaning | Set when the source says |
|---|---|---|
| null | Not stated | Nothing about price |
| Free | Free to use | "gratis", "koster ingenting", "uten egenandel" |
| Paid | Using it costs money | A price, fee or egenandel for the service itself |
| Partly | Free to come, some parts cost | Free entry and a price for food, trips or materials |

`CostNote` carries the source's own price wording, copied verbatim in nb ("Kaffe og vafler
20 kr, aktivitetene er gratis"). The en note is a translation in which every number and amount
stays digit for digit. Free may have a note or none. Paid and Partly must have one, because
"costs money" without an amount helps nobody.

## Sourcing and verification

The never-invent rule binds every value: phone, address, price, hours and the referral quote are
copied from a cited page, never written from memory or inferred from a pattern.

**Allowed sources**, in this order of trust:

1. The provider's own website.
2. The kommune's website.
3. frivilligsentralen.no, or the organisation's national site (Kirkens Bymisjon, Fontenehus
   Norge, Mental Helse).

A public Facebook page is not a source. An offer found only there goes into a "Skipped" list in
the seed doc with its name, kommune and "Facebook only", so I can see what is missing.

**Organisation contacts only.** Small væresteder and volunteer groups often print a private
person's name and mobile number as the contact. Varde never seeds a person: no names, no number
or email printed under a person's name. The row takes the organisation's own number, email or
website instead, and if there is none, the contact cells stay empty and Notes says
`PERSON CONTACT ONLY`. The checker flags any phone or email that the page ties to a person.

**Own words.** Descriptions are written in my words from the facts on the page, as in every
earlier batch. Only the price wording and the referral quote are copied verbatim, and both are
short factual lines.

**Row ranges.** Batch 1 uses 301 to 399 and batch 2 uses 401 to 499. A batch that would pass 99
rows is split into two PRs, and the second continues at the next free hundred (501 and up).

**Process per batch**, the same as the Oslo batch:

1. **Research.** A research pass writes the seed doc: `docs/seed-data-lavterskel-innlandet.md`
   (rows 301 and up) for batch 1, `docs/seed-data-lavterskel-oslo.md` (rows 401 and up) for
   batch 2. It uses the existing table columns plus **Cost**, **Cost note** and **Referral
   quote**, a "Verify these first" list, a "Descriptions" section in nb and en, and the
   "Skipped" list. Empty cells say `NOT FOUND` in Notes.
2. **Check.** An independent checker fetches every cited page and writes
   `docs/verification/seed-data-lavterskel-innlandet-check.md` (and the Oslo twin), with a verdict
   per row. The checker does no replacement research.
3. **Gate.** I resolve "Verify these first" and close the gate in the doc's status block.
4. **Seed.** Only then do the rows go into `SeedData.cs`, copied from the doc.

**The re-read of the 94 live rows** follows the same steps with its own pair of docs:
`docs/seed-data-lavterskel-retag.md` and
`docs/verification/seed-data-lavterskel-retag-check.md`. It changes only `IsLowThreshold`,
`Cost`, `CostNote` and category 10 membership. A row whose page changed in any other way is
listed under "Verify these first" and fixed in the same pass, never silently. Every row the pass
changes gets a new `LastVerified` date; untouched rows keep theirs.

## Model and data flow

**Core models:**

- `Resource.IsLowThreshold`: `bool`, default false. XML doc states the badge rule.
- `Resource.Cost`: `ResourceCost?`, a new enum `Free = 1, Paid = 2, Partly = 3`, stored as an
  int. Null means not stated, never "free".
- `ResourceTranslation.CostNote`: `string?`, plain text like `Description`.

**Seed:** `Categories.cs` gets `public const int Lavterskeltilbud = 10;`, the entry
`new() { Id = Lavterskeltilbud, Slug = "lavterskeltilbud" }`, and translations 19 (nb
"Lavterskeltilbud") and 20 (en "Drop-in and activities"). The XML doc's "nine phase-1
categories" line is updated. Batches add rows to `SeedData.cs` under the existing conventions:
compile-time constants, `DateTimeKind.Utc`, the phone grouping rule.

**Migrations:** one for the schema and category 10, one per data batch (re-read, Innlandet,
Oslo), so each PR carries exactly one.

**API:** `ResourceDto` gains `IsLowThreshold`, `Cost` (serialised as the lowercase string
`"free"`, `"paid"`, `"partly"` or null) and `CostNote`, with the same language fallback as
`Description`. `ResourceService` maps them. Nothing else in the API changes.

**Export and web:** the JSON export walks the DTO, so it carries the fields without changes.
`types/api.ts` mirrors them (`cost: "free" | "paid" | "partly" | null`). `CATEGORY_SLUGS` gets
`"lavterskeltilbud"` as its tenth entry, in the `Categories.cs` order, so `seedDrift.test.ts`
keeps both lists equal.

## UI

### Badges

`ResourceBadges` renders, in this fixed order: Akutt, Nasjonal, Døgnåpent, Lavterskel, then one
cost badge. Not stated renders no cost badge. The card keeps its single badge slot, so the
subgrid and the card height rules from sub-project A are untouched. The badges wrap inside the
slot as they already do.

### Detail page

When `costNote` is present, the detail page shows a "Pris" line next to the hours, the label set
apart from its value by weight or colour like the other `dt`/`dd` pairs. No note, no line.

### Landing chips

The browse area gets a featured row above the grid of eight: Nødtjenester (`chip chip-acute`,
unchanged) and Lavterskeltilbud (new `chip chip-featured`: accent border and accent text, the
same surface as the grid chips, no red). Both chips have equal width and height, at least 44 px
tall, side by side at every width including 320 px, centred as the single Nødtjenester chip is
today. `GRID_SLUGS` filters out both featured slugs. The grid stays 2 columns on phones and 4
from 768 px.

At 320 px each chip is about 140 px wide, and "Lavterskeltilbud" is one long word. The nb string
carries a soft hyphen (U+00AD, `Lavterskel\u00ADtilbud` in `nb.json`), so it breaks as "Lavterskel-" and "tilbud" only
when it must; screen readers ignore the soft hyphen. Labels may wrap to two lines, and both
chips then grow together to one shared height. Text never overflows a chip and is never cut
with an ellipsis. At 200 % text size, where two chips cannot fit side by side, they stack, one
per row (reflow wins over the side-by-side rule).

The two featured chips are a `<ul>` with two `<li>`, like the grid, so a screen reader announces
"list, 2 items" instead of two loose links.

### Copy

| Key | nb | en |
|---|---|---|
| `category.lavterskeltilbud` | Lavterskeltilbud | Drop-in and activities |
| `badge.lowThreshold` | Lavterskel | No referral |
| `badge.cost.free` | Gratis | Free |
| `badge.cost.partly` | Delvis gratis | Partly free |
| `badge.cost.paid` | Koster penger | Costs money |
| `detail.price` | Pris | Price |

"Low-threshold" is jargon to most English readers, so the en strings say what it means.

## Testing

**API (SeedDataTests and unit tests):**

- Category 10 exists with slug `lavterskeltilbud` and both translations.
- Every resource with `IsLowThreshold` has a non-empty referral quote for its row in the seed
  docs. All three docs (retag, Innlandet, Oslo) carry a "Referral quote" column, and the guard
  finds it by its header name, not by position, then looks the row up by number. A test fixture
  with a badge row and an empty quote must make the guard fail.
- Every `Website` and `ChatUrl` in the seed is an absolute `https://` URL, so no seeded value can
  become a `javascript:` link. `CostNote` is rendered as React text, never as HTML.
- `Cost` and `CostNote` agree: Paid and Partly need a nb and en note; a note without a cost fails.
- Every category 10 row has a `MunicipalityId` and `IsNational == false`.
- Numbers in each en `CostNote` equal the numbers in its nb note.
- `ResourceDto` maps the three fields, and `CostNote` falls back like `Description`.

**Web (unit):** badge order and labels in nb and en; no cost badge for null; the "Pris" line
appears only with a note; `GRID_SLUGS` excludes both featured slugs.

**Web (Playwright):** the two featured chips share one height and one bottom edge at 320, 768 and
1280 px, in nb and en; at 320 px no chip's `scrollWidth` exceeds its `clientWidth`; at 200 %
text the chips stack without overflow; `/sok?category=lavterskeltilbud` returns rows; the grid
of eight still has even rows.

**Manual:** I run one NVDA pass over the landing chips and one detail page with a "Pris" line
before PR 1 merges.

## Delivery

| PR | Content |
|---|---|
| 1 | Model, migration, category 10, DTO, badges, "Pris" line, featured chip, copy, the re-read of the 94 rows with its check doc |
| 2 | Batch 1: Innlandet seed doc, check doc, rows 301 and up |
| 3 | Batch 2: Oslo seed doc, check doc, rows 401 and up |
| 4 | Spec amendments, only if the build moved a decision |

Category 10 has members from PR 1 on, because the re-read moves existing meeting places (for
example Fyrlyset) into it, so the featured chip never leads to an empty list. If the re-read
finds none, the category itself (its `Categories.cs` entry, its slug in `CATEGORY_SLUGS` and the
featured chip) moves to PR 2, so neither the landing nor the /sok filter ever offers an empty
category. The fields and badges still ship in PR 1.

## Considered and rejected

- **A "prices can change" line next to "Pris".** Every card already shows `LastVerified`, and the
  Om Varde liability text covers stale data. A second disclaimer on one field adds noise.
- **Guarding the research pass against instructions planted in source pages.** The independent
  checker re-fetches every page and compares digit for digit, and I close the gate by hand, so
  an injected value has to survive two passes and me.
- **A re-check cadence for activity programmes.** Keeping data fresh over time is sub-project E
  (the data watchdog). C1 limits staleness by making rows places, not events.
- **Matching numbers between nb and en notes when amounts are written as words.** Rare in price
  wording, and the checker reads both notes. The digit guard covers the common case.

> Stress-tested 2026-10-15 (skill 1b85fca): 8 applied, 1 adapted, 0 decided by me.
