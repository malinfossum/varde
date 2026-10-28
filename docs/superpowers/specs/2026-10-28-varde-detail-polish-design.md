# Varde: website tile, clickable result cards and one clock format

Date: 2026-10-28. This spec covers plan 5 backlog items 24 to 27. It builds on the helplines
C2a spec (2026-10-16, on `docs/helplines-c2a-spec`), which made the contact tiles, and the
detail card spec (on `docs/detail-card-spec`). Where they disagree on the points below, this one
wins.

## Purpose

Three small things make Varde harder to read than it needs to be. A detail page ends with a
website URL that can run to 159 characters. A result card is only clickable on its title and a
"Detaljer" button, which gives a screen reader more than 100 identical links on `/sok`. And
opening hours are written in at least six styles (`13.00-18.00`, `12:00 – 16:00`, `9–15`,
`08.00 til 16.00`), with "Sist bekreftet" shown as an ISO date. I want one compact website link,
one link per card, and one way of writing times and dates across the whole site.

## Decisions locked in the brainstorm (2026-10-28)

I compared mockups of each choice on the BUA Hamar row (id 309) before deciding.

1. **Item 24: the website becomes a Nettside tile.** It is a fourth tile kind in Kontakt,
   placed after E-post. Its value is the domain only, so `stiftelsencrux.no` opens
   `https://stiftelsencrux.no/vare-virksomheter/hamartiltakene/bua-hamar`. The Nettside row leaves
   Praktisk informasjon. Icon-only was rejected: it is harder to read and to hear.
2. **Item 25: Praktisk informasjon stays a list.** Tiles mean "tap to act" (call, mail, open).
   Hours, price and address are reading content, so boxing them would blur that cue.
3. **Item 26: the whole result card is one link, and Detaljer goes.** The title link stretches
   over the card. A chevron after the title is the visible cue on touch.
4. **Item 27: times take a colon, dates take periods.** This is my rule for everything I make
   (loadout `CLAUDE.md`). The seed text is rewritten, bare hours are written out, and "Sist
   bekreftet" shows `27.10.2026`. A seed test keeps new rows in the same format.

## Item 24: the Nettside tile

`web/src/services/contactTiles.ts` gets a fourth kind:

```ts
| { kind: "website"; key: string; domain: string; href: string }
```

- **Order:** own phone, own chat, child chats, child phones, e-mail, then website. The website
  belongs to the service itself; a child's website stays on the child's own page, like its
  e-mail.
- **Guard:** the same https guard as today (`safeChatUrl`). A website that fails it gets no
  tile and stays a plain-text row in Praktisk informasjon, exactly as now. No row in the data
  hits this today, so the fallback is for a future typo.
- **Domain:** `new URL(href).hostname` with one leading `www.` removed. No other trimming:
  `hamar.kommune.no` stays as it is, so two services on the same kommune site read the same.
  The hostname is shown as the URL parser gives it, so a future domain with æ, ø or å shows in
  its `xn--` form. No website in the data has one today (checked 2026-10-28).
- **Tile text:** label "Nettside" (en "Website"), value the domain. The accessible name is the
  visible text in reading order ("Nettside, stiftelsencrux.no"), same pattern as the other tiles.
- **Icon:** the existing `GlobeIcon`. The language picker uses it too, but in the header and
  with its own label, so the two never sit together.
- **Link:** same tab, `rel="noopener noreferrer"`, like the chat tile.
- **Layout:** no change to the tile grid. One column below 768 px; two columns from 768 px, so a
  third or fifth tile sits alone on its last row, which the grid already allows.

`ResourceDetail.tsx` drops the Nettside row from the `dl`, except in the unsafe fallback above.
`hasFacts` counts the website only in that fallback.

## Item 25: Praktisk informasjon

No change.

## Item 26: the clickable result card

`web/src/components/ResourceCard.tsx`, used on the landing page, `/sok` and kommune pages.

- **One link:** the title link stays the only link to the detail page. Its `::after` covers the
  whole card (`position: absolute; inset: 0`), and the `li` becomes `position: relative`.
- **Controls above it:** the Ring button and, on kommune pages, the kommune link sit above the
  stretched link (`position: relative; z-index: 1`), so they keep their own clicks.
- **Detaljer goes.** One fewer tab stop per card, and no list of identical link names. The
  `card.details` key leaves `nb.json` and `en.json`, and `web/tests/list.test.tsx`, the one test
  that finds a card by "Detaljer", moves to the title link.
- **Chevron:** a small `ChevronRightIcon` after the title text, inside the link, with
  `aria-hidden="true"`. A new icon in `icons.tsx`, drawn like `ArrowLeftIcon`.
- **Hover:** the card border turns `--accent`. No lift or shadow; nothing moves.
- **Focus:** the title link's focus ring is drawn around the whole card, so keyboard users see
  the target they will open. The selector names the title link only
  (`li:has(.card-link:focus-visible)`), never a bare `:has(:focus-visible)`: that would also ring
  the whole card when focus is on Ring, and two rings would point at two different targets.
- **Clicks that open a new tab:** the stretched area is part of the anchor, so Ctrl+click,
  middle-click and "Copy link" work on the whole card, not only the title.
- **Forced colours:** the border change uses `LinkText` there, so the hover still shows.
- **Trade-off I accept:** selecting description text with a mouse gets awkward, since a drag
  starts on the link. The phone number keeps its own button and stays copyable, and the detail
  page has a copy action.

## Item 27: one clock and date format

### Format rules

| | Norwegian (`nb`) | English (`en`) |
|---|---|---|
| Time | `kl. 13:00` | `13:00` |
| Time range | `kl. 13:00–18:00` | `13:00–18:00` |
| Day range | `mandag–fredag` | `Monday–Friday` |
| Bare hours | `9–15` becomes `kl. 09:00–15:00` | `9–15` becomes `09:00–15:00` |
| Date | `27.10.2026` | `27.10.2026` |

- Colon in every time, always two-digit hours and minutes.
- En dash with no spaces in every range: times, days and dates
  (`15. september–14. mai`). Dates inside hours text keep their month names, so they never
  look like a time.
- "kl." goes before a bare time in Norwegian. It is dropped where the text already says
  "klokka" or "klokken", or where a range reads "fra ... til".
- Format only. No word, day or time changes meaning. A row that cannot be fixed without
  changing content is left as it is and listed in the PR body.
- The 200-character cap on `OpeningHours` still holds after the rewrite.

### The data

In `api/Varde.Data/Seed/SeedData.cs`, 113 rows in each language have `OpeningHours`, so 226
strings. Some of them are "Døgnåpent" / "Open 24 hours" and need nothing. I rewrite the rest in
place, then
generate one EF migration (`NormaliseOpeningHours`, `UpdateData` only) and re-export the static
JSON with `npm run data`. "Døgnåpent" is untouched, so `IsAlwaysOpen` and its test stay green.

### The guard

A new case in `api/Varde.Tests/Integration/SeedDataTests.cs` fails on any `OpeningHours` that
contains:

- a time with a period (`\b\d{1,2}\.\d{2}\b`),
- a range with a hyphen or a spaced dash between digits (`\d\s*-\s*\d`, `\d\s+–\s*\d`,
  `\d\s*–\s+\d`),
- a one-digit hour inside a time (`(?<!\d)\d:\d{2}`).

It also fails on any English string that contains "kl.".

The test prints every offending row id and string, so the next data batch sees what to fix.

A guard that can never go red protects nothing. The patterns live in one helper
(`OpeningHoursFormat.Violations(string text, string lang)`), and a unit test feeds it known-bad
strings taken from today's data (`kl. 13.00-18.00.`, `12:00 – 16:00`, `9–15`, `kl. 9:00`, an
English `kl. 10:00`) and known-good ones (`kl. 13:00–18:00`, `15. september–14. mai`,
`Døgnåpent`). Each bad string must give at least one violation, each good one none.

### The date

`lastVerified` is an ISO date string (`2026-10-27`). A small helper,
`formatDate(iso: string): string` in `web/src/services/format.ts`, returns `27.10.2026` by string
split, not `Date` parsing, so no time zone can shift the day. `ResourceCard` and `ResourceDetail`
both use it. Anything that is not `YYYY-MM-DD` is returned unchanged.

## Out of scope

- Any change to Praktisk informasjon's layout (item 25 said no).
- A computed "open now" from opening hours. `OpeningHours` stays free text; that idea has its
  own blocker in plan 2.
- New data, new rows or re-verifying content. This is a format pass only.

## Considered and rejected

- **Formatting hours at render time with a regex.** Free text has too many shapes, the API
  would keep serving the old format, and a missed case would be invisible.
- **Website as an icon-only button.** Less clear to read and to hear.
- **Keeping Detaljer next to the clickable card.** It doubles every link and adds noise for
  screen readers for no gain once the card itself is the link.
- **Praktisk informasjon as boxes.** Compared side by side; it blurs the tap-to-act cue.
- **Decoding `xn--` domains to æ, ø and å.** No row needs it today, and showing the raw form is
  the safe default against look-alike domains.
- **Opening the website in a new tab.** The chat tile opens in the same tab, and a new tab
  breaks Back for screen-reader and phone users. Same tab it is.
- **Keeping hover and focus as two different styles.** One accent border for both is enough;
  focus already adds its outline.

## Testing

**Vitest:**
- `contactTiles`: a website tile after e-mail, the domain without `www.`, no tile for a
  non-https website, no tile from a child's website.
- `ContactTiles`: the Nettside tile's accessible name is "Nettside, <domain>".
- `ResourceDetail`: no Nettside row when the tile shows; the row stays for an unsafe URL.
- `ResourceCard`: exactly one link to the detail page per card, no "Detaljer" text, the Ring
  link still present, and the kommune link on kommune pages.
- `formatDate`: `2026-10-27` gives `27.10.2026`; a non-ISO value comes back unchanged.

**Playwright:**
- Clicking the description of a card on `/sok` opens its detail page.
- Clicking Ring on a card keeps you on `/sok` (the `tel:` link is followed, not the card).
- Tab order on `/sok`: card title, then Ring, then the next card.
- axe stays clean on `/sok`, a kommune page and a detail page, at 375, 1024 and 1920 px, both
  themes and both languages.
- The existing history and scroll-restore specs still pass (the card is what you click on the
  way out).

**Manual (me, with NVDA, after PR 2 deploys):** one detail page and `/sok` in each language,
to hear how the en dash in `kl. 13:00–18:00` is read. If NVDA reads it as "dash" rather than a
pause or "til", that is a follow-up, not a reason to hold the PR.

**API:**
- The new format guard in `SeedDataTests`, and the `OpeningHoursFormat` unit test that proves
  the guard can go red.
- The full suite (`dotnet test`, PostgreSQL started first).

## Build order

Two PRs from `main`, in this order:

1. **PR 1, UI:** items 24 and 26 plus `formatDate`. Small, and it does not touch the data.
2. **PR 2, data:** item 27's seed rewrite, migration, JSON export and guard test. Its diff is
   about 226 strings, so it is easier to review alone. The guard test lands in this PR, red
   first, then green after the rewrite.

Each PR runs `npm test` and the full `npm run e2e` before it opens.

**Coordination:** PR 2 rewrites strings all over `SeedData.cs`, and other work adds rows there
(the Lavterskel Oslo batch, the kommune data refresh). Whichever lands second rebases and
regenerates its migration. A data batch that lands after PR 2 writes its hours in the new format
from the start, and the guard tells it if it does not.

> Stress-tested 2026-10-28 (skill 1b85fca): 6 applied, 1 adapted, 0 decided by me.
