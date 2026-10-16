# Varde: helplines on the landing page and contact tiles (C2a)

Date: 2026-10-16. This is sub-project C2a. It covers part of the Lavterskel map's C2 (Hjelpetelefon
and Chat as labels) and backlog item 9 (Mental Helse and Kirkens SOS get their own section on the
landing page). It builds on the landing layout from #74 and #76. Where this spec and the UI polish
spec (2026-10-02, on `docs/ui-polish-spec`) disagree about the helpline section or the detail
page's contact block, this one wins.

## Purpose

The "Noen å snakke med" section is the reason I built Varde: free services that help, one tap
away. Today it lists five rows. Two of them (Arbeidslivstelefonen and Sidetmedord) are Mental
Helse services, and one carries a "Velg tast 3" note that breaks the layout. The names are long
data names, and nothing tells an adult and a teenager which line is for them.

I want the landing to show the four most-used services in two honest age groups, with a phone
button and a chat button on every row. On the detail page I want every way to reach a service
(its phone, its chat and its sub-services) shown as clear tiles, the way Mental Helse's own site
does it.

## Decisions locked in the brainstorm (2026-10-16)

1. **Split and order.** C2a (this spec) ships first, then the mega-menu, then C2b (a
   Hjelpetelefoner page plus the 11 services not yet in the seed, each verified at source), then
   the Lavterskel PRs.
2. **Two landing groups.** "For voksne og generelle livskriser": Mental Helse (id 1) and Kirkens
   SOS (id 2). "For barn og unge (under 18 år)": Alarmtelefonen for barn og unge (id 4) and Kors på
   halsen (id 121). Rows 9 and 122 leave the landing, and the "tast 3" note goes with them.
3. **No stopgap links.** "Se mer informasjon →" under each group and the Spesialtjenester object
   wait for C2b, where the page they point to exists.
4. **Data, not prose.** Mental Helse's sub-services hang off it through a new `ParentId`. The "tast
   3" menu option becomes a field instead of a sentence in a description.
5. **Landing layout A (rows).** Name, phone button, chat button, in shared columns.
6. **Detail page A (tiles).** Tiles become the contact block on every detail page.
7. **A child tile acts directly.** Tapping Arbeidslivstelefonen's tile calls 116 123. It does not
   open Arbeidslivstelefonen's own page first.
8. **Shared rows across the help block.** "Akutt hjelp" and "Noen å snakke med" share rows
   (heading, intro line, list), so the headings, the intro lines and the tops of both lists each
   sit on one line across the divider. This is backlog item 2 of the 2026-10-16 list.

## Data

### `Resource.ParentId`

- `int?`, a foreign key to another `Resource`, with navigations `Parent` and `Children`.
- On delete: **restrict**. A parent with children cannot be deleted by accident.
- A check constraint refuses `ParentId = Id`, so a row can never be its own parent.
- One level only. A resource with a parent never has children. The seed test enforces this. The
  API does not need to, because the seed is the only writer.
- XML doc: "A service that belongs to another (Arbeidslivstelefonen under Mental Helse). Its
  phone and chat show as tiles on the parent's page."
- Seed: rows 9 (Arbeidslivstelefonen) and 122 (Sidetmedord) get `ParentId = 1`.

### `Resource.PhoneMenuOption`

- `int?`, 1 to 9: the key to press in the phone menu after the call connects. A database check
  constraint holds the range and refuses a menu option on a row with no phone
  (`"PhoneMenuOption" IS NULL OR ("PhoneMenuOption" BETWEEN 1 AND 9 AND "Phone" IS NOT NULL)`).
- It belongs to the service, so a service that has one has one phone number. Every row today
  has at most one.
- Seed: row 9 gets 3. The value is copied from row 9's current nb seed description ("Velg tast 3
  i menyen"). That sentence is then removed from row 9's description in nb and en, so the fact
  lives in one place.
- No other row gets a value in C2a. Mental Helse's other menu options (her screenshot showed
  "tast 2" for one line) need a verified source and wait for C2b.

### Through the API and the static export

- `ResourceDto` gains `parentId: number | null` and `phoneMenuOption: number | null`.
  `web/src/types/api.ts` mirrors both by hand, as it does today.
- `scripts/export-data.mjs` writes both fields into `resources.{nb,en}.json`.
- Children are not stored or exported as a list. The web finds them as the rows whose `parentId`
  equals the page's id, in id order. Every page already loads the whole index. The prerendered
  detail page bakes its children into the page data, so a direct load needs no extra request.

### Migration

One migration, `HelplineParentAndMenuOption`: both columns, the foreign key, the check constraint
and the seed updates for rows 9 and 122. It lands before any Lavterskel C1 migration.

## Landing: "Noen å snakke med"

### Source of the rows

`web/src/services/helplines.ts` replaces `HELPLINE_IDS` and `HELPLINE_NOTES` with one constant:

```ts
export const HELPLINE_GROUPS = [
	{ key: "adults", rows: [{ id: 1, name: "Mental Helse" }, { id: 2, name: "Kirkens SOS" }] },
	{
		key: "young",
		rows: [
			{ id: 4, name: "Alarmtelefonen for barn og unge" },
			{ id: 121, name: "Kors på halsen" },
		],
	},
] as const
```

- The short names are landing labels, not data. They are never translated, like every service
  name. Each one appears inside its data name ("Mental Helse" in "Hjelpetelefonen (Mental
  Helse)"), and a test checks that, so a renamed row cannot keep a stale label.
- `pickHelplines` returns the groups with phone and chat filled in from the data. A missing id
  throws, so the prerender fails the build instead of shipping a shorter list. This is the same
  rule as today.
- **Chat comes from a child when the service has none.** A row's chat is its own `chatUrl`, or else
  the first child (in id order) that has one. For Mental Helse that is Sidetmedord's
  `https://mentalhelse.no/hjelpechat/` (row 122), so the URL lives in one row only. It still
  goes through `safeChatUrl`.
- `HELPLINE_NAMES`, which the mega-menu plan adds, reads from `HELPLINE_GROUPS` instead of
  holding a second copy. The mega-menu's "Noen å snakke med" group shows these four rows in this
  order.

### Structure

- The `h2` "Noen å snakke med" and the line "Du kan være anonym." stay.
- **The age wording is verified, not assumed.** Before the copy ships, the age range for rows 4
  and 121 is read from each service's own site and recorded with its URL in the seed docs. If
  either serves a different range than "under 18", the group label changes to match.
- Each group is a `section` with an `h3` label and its own `ul`. Labels are small, uppercase and
  muted, set apart from the bold names by size, weight and colour.
- A row is a `li`. The name is a link to `/resources/{id}`. Then comes the phone button, then the
  chat button.
- Names are bold with no underline at rest. They get an underline on hover and on focus, so
  they still show that they are links when it matters.

### Desktop (1024 px and up)

- #76's `2fr/3fr` help block stays.
- **Shared rows:** the block becomes one grid with three rows (heading, intro line, content). Each
  column's heading, intro and content are placed in those rows through `grid-template-rows:
  subgrid`. Headings, intro lines and content tops line up across the divider. Each column keeps
  its own left alignment.
- **Shared columns:** both groups sit in one grid with columns `minmax(0,1fr) 8.5rem 5.75rem`
  (136 px and 92 px at the default text size). Group labels span all three columns. Every phone
  button shares one left edge and one width across both groups, and every chat button too.
- With a larger text size the column can get narrower than 26 rem. Then the rows use the phone
  layout below instead, so names are never squeezed into a sliver beside the buttons.
- A row without a chat keeps its chat cell empty, so nothing moves sideways. All four have a chat
  today.
- Within a row, the name and the two buttons share one centre line.

### Phones and tablets (below 1024 px)

- The name sits on its own line.
- The phone and chat buttons sit below it, side by side in `1fr 1fr` (167 px each at 375 px), both
  44 px tall on one bottom edge.
- A row without a chat shows the phone button at full width.
- The side-by-side layout is a container query in rem, like today's `@[21rem]` rule. In a
  column too narrow for both labels (320 px, or 200 % text), the two buttons stack at full
  width instead of squeezing their text.

### Buttons

- Phone: `btn-primary`, a lucide-style phone icon, then the number: "116 123". The word "Ring" /
  "Call" is hidden text in front of the number. This matches the mockups the 136 px and 167 px
  sizes were measured from, and the emergency buttons beside it, which show the number too.
  (Changed 2026-10-16 while writing the plan: "Ring 22 40 00 40" does not fit 136 px.)
- Chat: `btn-secondary`, a lucide-style message-circle icon, then "Chat".
- Icons are new `PhoneIcon` and `ChatIcon` in `web/src/components/icons.tsx`, drawn for Varde on
  the same 24-unit stroke grid as the existing set, with `aria-hidden="true"`. No path is copied
  from Lucide. If one ever is, Lucide's ISC notice goes into the file with it.
- Each button has hidden text naming its service: "Ring 116 123, Mental Helse" and "Chat, Mental
  Helse". The visible label is always part of the name (WCAG 2.5.3, label in name), so a voice
  user can say "click 116 123" or "click Chat".
- Chat links open in the same tab, like every link on Varde today. Backlog item 19 (new tab for
  content links) changes all links at once in its own change, not this one.

### Fit

Four rows plus two group labels measured 316 px at 768 px in the mockup, about the height of
today's five rows. The 1920 x 950 one-screen check in `landing.spec.ts` must keep passing in both
languages and both themes. If it does not, I decide what gives. The build does not quietly shrink
spacing to make it pass.

## Detail page: contact tiles

### Where

The large "Ring {phone}" button in the detail header is replaced by a contact block of tiles. The
block appears on every detail page with at least one tile. "Kopier nummer" (copies the service's
own number) and "Del" / "Kopier lenke" stay below the tiles as `btn-secondary` buttons, with the
same rules as today.

### Which tiles, in order

1. **Phone** (the service has a `phone`). Top line: "Ring" / "Call", plus " · døgnåpen" /
   " · open 24/7" when `isAlwaysOpen`. The suffix sits on phone tiles only: `IsAlwaysOpen`
   comes from the hours text, and a service's chat often keeps shorter hours than its phone. Value: the number, plus ", tast 3" / ", press 3" when
   `phoneMenuOption` is set. The link is `tel:`, built with `telHref`.
2. **Chat** (the service has a safe `chatUrl`). Top line: "Chat", never with an open-24/7
   suffix.
   Value: "Åpne chatten" / "Open the chat". The link is the chat URL, through `safeChatUrl`.
3. **One tile per child.** Children that become chat tiles come first, then children that become
   phone tiles, each in id order, so a chat sits second the way it does on Mental Helse's own site.
   (Settled 2026-10-16 while writing the plan: "in id order" alone put Sidetmedord's chat last,
   against the example below.) Top line: the child's data name, plus the open-24/7 suffix
   from the child's own `isAlwaysOpen` when the tile is a phone tile. If the child has a phone, the value is its number and
   menu option and the link is `tel:`. Otherwise the value is "Åpne chatten" and the link is its
   chat. A child with neither gets no tile.

Mental Helse (id 1) shows three tiles: "Ring · døgnåpen / 116 123", "Sidetmedord (Mental Helse) /
Åpne chatten" and "Arbeidslivstelefonen (Mental Helse) / 116 123, tast 3". Kirkens SOS shows "Ring
· døgnåpen / 22 40 00 40" and "Chat / Åpne chatten".

### One tile

- The whole tile is one `a`, with the shared focus ring.
- A 1 px `border-border` outline, so the tile's edge survives `forced-colors`, where the
  `accent-soft` fill disappears.
- Left: a 40 px square in `accent-soft` with the phone or chat icon, `aria-hidden`.
- Right: the top line (small, muted) over the value line (bold). Labels stand apart from values.
- Every tile is 69 px tall at its minimum. A long child name wraps inside the tile and makes the
  tile taller, never clipped.
- The accessible name is the visible text in reading order, so voice control works with what is
  on screen. The " · " separator is `aria-hidden` and replaced by a visually hidden comma, so
  NVDA reads "Ring, døgnåpen, 116 123, tast 3" instead of "Ring dot døgnåpen".

### Tile grid

- The tiles sit in a `ul` grid: one column below 768 px, two equal columns from 768 px.
- Tiles in a row share one height and both edges (`grid-auto-rows: 1fr` within the block).
- The block has a visually hidden `h2` "Kontakt" / "Contact", so it shows up in a screen
  reader's heading list.

### Other changes on the detail page

- The `dl` loses its Chat row, because the raw chat URL is no longer shown. Hours, address,
  website and email stay.
- A child page (9 or 122) shows a muted line under the municipality line: "Del av {parent's data
  name}" / "Part of {parent's data name}", linking to the parent. If the parent is missing from
  the data, the line is left out rather than linking to a page that 404s.

## Copy

| Key | nb | en |
|---|---|---|
| `landing.helplineGroup.adults` | For voksne og generelle livskriser | For adults and general life crises |
| `landing.helplineGroup.young` | For barn og unge (under 18 år) | For children and young people (under 18) |
| `detail.contactHeading` | Kontakt | Contact |
| `detail.tile.alwaysOpen` | døgnåpen | open 24/7 |
| `detail.tile.openChat` | Åpne chatten | Open the chat |
| `detail.tile.menuOption` | tast {n} | press {n} |
| `detail.partOf` | Del av {name} | Part of {name} |

The tiles reuse `card.call` ("Ring" / "Call") and `detail.chat` ("Chat"). `landing.helplineNote.9`
is removed from both files.

## Overlaps with the other tracks

- **Mega-menu** (plan on `docs/mega-menu-spec`): its "Noen å snakke med" group shows the four
  `HELPLINE_GROUPS` rows, not five. Its `HELPLINE_NAMES` reads from `HELPLINE_GROUPS`. Whoever builds
  that plan rebases it on this change first.
- **Lavterskel C1** (plan on `docs/lavterskel-spec`): adds `IsLowThreshold`, `Cost` and
  `CostNote` to `Resource`. Its migrations come after this one. Its "Pris" line sits in the `dl`,
  which this spec only shrinks.

## Out of scope

- "Se mer informasjon →", the Spesialtjenester object and the Hjelpetelefoner page (C2b).
- The 11 unseeded services and Mental Helse's other sub-lines (Foreldresupport, Ringevenn): C2b,
  each verified at its own source.
- Hjelpetelefon and Chat as labels and categories (C2b).
- Opening content links in a new tab (backlog item 19, all links in one change).
- More than one phone number per service.

## Considered and rejected

- **Copying Mental Helse's chat URL onto row 1.** Two rows would hold the same URL, and a change
  to one would leave the other stale. Taking it from the child keeps one source.
- **A child tile that opens the child's page (B).** One more tap stands between someone in need
  and the call, and the value line already says "tast 3".
- **Keeping "tast 3" as a landing note.** It broke the row layout, and the caller hears the menu
  anyway. The detail tile shows it as part of the number instead.
- **A `Children` list in the export.** It would duplicate `parentId` and could drift. The index
  already holds every row.
- **Underlines on the landing names at rest.** WCAG 1.4.1 asks for links inside running text to
  stand out without colour. These names sit alone in rows, bold, beside buttons, and get an
  underline on hover and focus.
- **`lang="nb"` on Norwegian service names in English.** Proper names are exempt from WCAG 3.1.2,
  and marking only these four would make them behave differently from every other name on Varde.
- **Enforcing the one-level rule in the database.** It needs a trigger. The seed is the only
  writer, and the seed test catches it.

## Testing

Tests first for each change.

**API (xUnit, PostgreSQL running):**
- `SeedDataTests`: rows 9 and 122 have `ParentId` 1. No resource with a parent has children. Row
  9's `PhoneMenuOption` is 3, and neither of its descriptions mentions "tast 3" or "option 3".
  Every `PhoneMenuOption` is between 1 and 9 and sits on a row with a phone.
- `SchemaTests`: deleting a resource that has children fails. A `PhoneMenuOption` of 0 or 10, a
  `PhoneMenuOption` on a row with no phone, and a `ParentId` equal to the row's own id are each
  rejected by a check constraint.
- `ResourcesApiTests`: `parentId` and `phoneMenuOption` come through, null where unset.

**Web unit (Vitest):**
- `exportData.test.ts`: both fields are in the exported JSON for both languages.
- `helplines.test.ts`: every `HELPLINE_GROUPS` id exists. Each short name appears inside its data
  name, and a fixture with a renamed row makes that test fail. Mental Helse's chat resolves to row 122's URL. A missing id
  throws.
- `helplinesSection.test.tsx`: two `h3` labels with the right copy in nb and en. Four rows in
  order. No "tast 3" text. Each button's accessible name contains its visible label and ends
  with the service name.
- `detail.test.tsx`: tile order and text on id 1. "døgnåpen" only on phone tiles with
  `isAlwaysOpen`, never on a chat tile (Kirkens SOS). The id 1 phone tile's accessible name is
  "Ring, døgnåpen, 116 123, tast 3"-shaped with no "·". A child whose parent is missing shows no
  "Del av" line. Child tiles
  link to `tel:` or the chat. Row 9 gets "Del av Hjelpetelefonen (Mental Helse)". There is no tile
  block when a service has no phone, no chat and no children. The `dl` has no Chat row.
- `prerender.test.ts`: the prerendered page for id 1 carries rows 9 and 122 as children.

**Browser (Playwright):**
- `landing.spec.ts`: the 1920 x 950 one-screen check still passes in both languages and both themes.
- New: shared rows. Both headings, both intro lines and both content tops line up within 1 px, at
  1024, 1280 and 1920 px.
- New: across both groups, the phone buttons share one left edge and one width, and the chat
  buttons too. Each row's name and buttons share a centre line within 1 px. At 1024, 1280 and 1920
  px.
- New: at 375 px, each row's two buttons are equal in width, 44 px tall, and share one bottom edge.
- `reflow.spec.ts`: at 320 px and at 200 % text, the helpline buttons stack, no text leaves its
  button, and the page has no horizontal scroll. The tile grid passes the same check.
- New: with `forcedColors: "active"` emulated, each tile still has a visible border.
- New: detail tiles at 375 and 1024 px, both languages: equal heights and shared edges in each
  row, no text overflowing its tile. This includes "Open the chat" and the longest child name.
- `e2e/fixtures/data/resources.{nb,en}.json` gain both fields and the parent links.

## Delivery

One PR on `feat/helplines-c2a`, in order: model and migration, then export, then landing, then
detail page. Before I merge, I test a served preview build at 375, 1024 and 1920 px in both
languages and both themes.

> Stress-tested 2026-10-16 (skill 1b85fca): 8 applied, 2 adapted, 0 decided by me.
