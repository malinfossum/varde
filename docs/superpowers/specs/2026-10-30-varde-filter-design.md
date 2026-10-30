# Varde filter redesign

Date: 30.10.2026. Status: reviewed 30.10.2026 (Akutt and Lavterskel folded in), awaiting approval.

## Goal

The /sok filter has to work at national scale and answer real questions in one pass. My test
case is "rus i Hamar": it must show the kommune's own rus services and the lavterskel rus
offers next to them. Today the filter takes one kommune, a national on/off toggle and any-of
category chips. It cannot pick a fylke or several kommuner. It cannot ask for "rus" and
"lavterskel" at once, and it hides how many results a choice would give.

Done means: a model that scales to 357 kommuner and 15 fylker, a layout that works from 375 px
to 1920 px, old links that keep working, and no new dependency.

## Decisions

1. **Layout 1.** Søk and Sted sit in one bar on top. Facet groups with counts sit in a sidebar
   from 1024 px. Below 1024 px a "Flere filtre (n)" button opens a full-screen dialog. Removable
   chips for every active filter, plus "Nullstill alt", sit above the results.
2. **Sted is one multi-select combobox** for fylker and kommuner. Several places can be picked.
   The result is the union of the picked places. Nothing picked means all of Norway. A fylke
   counts as all its kommuner.
3. **Towns are aliases, not a filter.** Typing "Brumunddal" offers "Ringsaker (Brumunddal)",
   and picking it selects Ringsaker kommune. Filter state holds fylker and kommuner only,
   because every row belongs to a kommune and no field says which town a service sits in.
4. **Two overlap rules, both shown to the user.** Kategorier are any-of. Egenskaper are all-of.
   Rus plus Lavterskel means lavterskel rus help. Rus plus Nødtjenester means rus or emergency.
5. **One control per meaning.** Nødtjenester stays in Kategorier, and Akutt is not an Egenskap,
   because Akutt is that same category under another name. Lavterskel is an Egenskap only
   (`isLowThreshold`, which follows my definition and carries a quote), and the category
   Lavterskeltilbud is not offered as a filter. On 30.10.2026 the category and the flag
   agreed on only 17 rows (48 in the category, 43 flagged), so side by side they would give
   two different lists under nearly the same name. Both card badges stay as they are.
6. **National services are a 3-way radio under Sted:** Ta med (default), Skjul, Bare nasjonale.
   National rows serve every place. "Nasjonal" is not an Egenskap; its card badge stays.
7. **The browser is the only search.** `web/src/services/query.ts` stops promising to mirror
   the C# `ResourceRepository.SearchAsync`. The C# search is frozen as it is and gets none of
   the new filters. What happens to the API itself belongs to spec B (storage).

## Filter model

| Group | URL param (repeatable) | Values | Logic |
|---|---|---|---|
| Søk | `search` | free text | Substring of name or description, as today |
| Sted | `county`, `municipality` | fylkesnummer (`34`), kommunenummer (`3403`) | Any picked place |
| Nasjonale tjenester | `national` | `exclude`, `only`; absent means Ta med | Narrows |
| Kategorier | `category` | category slug, except `lavterskeltilbud` | Any of |
| Egenskaper | `feature` | `lavterskel`, `dognapent` | All of |
| Pris | `cost` | `free`, `partly`, `paid` | Any of |
| Tilbyder | `provider` | `offentlig`, `frivillig` | Any of. Hidden until rows carry the field |

Groups AND together. `page` works as today. Any filter change resets `page` to 1.

Place numbers are strings everywhere (`"0301"`, `"03"`), because the leading zero matters.

### How each group matches a row

- **Sted.** A row matches a picked kommune when it is located there or serves it. That is
  today's `matchesMunicipality`, so a shared krisesenter shows in every kommune it covers. A
  picked fylke expands to its kommuner before matching.
- **Nasjonale tjenester.** Ta med: national rows are added to whatever Sted matches. Skjul:
  national rows are dropped. Bare nasjonale: only national rows. With no Sted picked, Ta med
  and Skjul both start from every row.
- **Bare nasjonale and Sted exclude each other**, as the national toggle and the kommune do in
  today's `applyPatch`. Choosing Bare nasjonale clears the Sted picks. Picking a place while
  Bare nasjonale is on switches the radio back to Ta med. So a Sted chip is never shown while
  it is being ignored.
- **Redundant picks are allowed.** Innlandet plus Hamar gives the same rows as Innlandet. Both
  stay as chips, so removing one never removes the other.
- **Egenskaper.** Lavterskel is `isLowThreshold`. Døgnåpent is `isAlwaysOpen`.
- **Pris.** Matches `cost`. A row with no stated cost drops out once any Pris box is ticked.
- **Tilbyder.** Matches `providerType` from the national data spec.

### Facet counts

Every checkbox and radio option shows how many results the list would have if I ticked it,
with every other group kept as it is. How an option's own group counts depends on its rule:

- **Any-of groups** (Kategorier, Pris, Tilbyder) and the national radio count each option
  without the group's other ticks (disjunctive). Ticking one more Kategori can only widen the
  list, so its count is never below the current total.
- **All-of groups** (Egenskaper) count each option with the group's other ticks kept. With
  Døgnåpent ticked, the count next to Lavterskel is the rows that are both.
- **A ticked option** shows the count of the list as it is now, in both kinds of group.

An option with 0 stays visible and
enabled, so the layout never jumps and nothing is hidden from a screen reader. One pure function,
`facetCounts(rows, filters)`, computes all counts in one pass over the rows.

### Old links

Parsing stays lenient, so no shared link breaks:

- `municipality` with one or two digits is an old database id. It maps to a kommunenummer
  through the catalog. Today's ids: 1 Hamar 3403, 2 Lillehammer 3405, 3 Gjøvik 3407,
  4 Ringsaker 3411, 5 Stange 3413, 6 Løten 3412, 7 Elverum 3420, 8 Oslo 0301 (SSB KLASS,
  classification 131, codesAt 30.10.2026).
- `national=true` means `only`.
- `category=lavterskeltilbud` means `feature=lavterskel`. The list behind an old link can
  differ slightly, because the flag and the category are not yet the same rows.
- Unknown values in any param are dropped, not errors. Repeated values are deduplicated.
- A kommunenummer that changed in a reform maps through KLASS's correspondence tables. That
  table lives with the place data (spec B), and the parser takes it as input.

`buildSearch` writes params in one fixed order (the table's order) and values in catalog order,
so one filter state always gives one URL. When the parsed URL differs from that canonical form,
it is rewritten with `history.replaceState(history.state, "", url)`. Passing the existing
`history.state` keeps the scroll key that Back and Forward restore from.

## UI

### Components

`FilterBar.tsx` splits into four parts with one job each.

1. **PlaceBar.** Søk and Sted side by side from 768 px, stacked below. Both controls are 44 px
   tall and share one bottom edge, and their labels sit on one baseline.
   - Sted is a react-aria `ComboBox` with `selectionMode="multiple"`. Picks show as removable
     `TagGroup` chips inside the field. The chips wrap onto new lines and the field grows, so
     there is no horizontal scroll at 320 px. The list stays open after a pick.
   - Removing a chip inside the field moves focus to the next chip, or to the text input when
     none are left. Focus never falls to `<body>`.
   - Options are grouped: Fylker, then Kommuner, each sorted with the `nb` collator. Only places
     with at least one row (located or served) are listed. Alias options appear only once the
     typed text is 2 characters or more, so an empty field lists at most 15 fylker and 357
     kommuner and never the full tettsted list.
   - A duplicate kommune name carries its fylke: "Våler (Innlandet)". A fylke with exactly one
     kommune of the same name (Oslo) is listed once, as the kommune.
   - An alias option reads "Ringsaker (Brumunddal)" and picks the kommune.
   - Matching folds diacritics both ways, as `matchesEitherWay` does today.
   - The "Fant ikke kommunen din" message and its national link stay. The link sets
     `national=only`.
   - The national radio group sits directly under the bar: a `fieldset` with legend
     "Nasjonale tjenester" and three native radios.
2. **FacetGroup.** One `<details>` per group, holding a `fieldset` with a `legend` and native
   checkboxes. Each option is a 44 px row: label on the left, count on the right. Kategorier and
   Egenskaper start open. Pris and Tilbyder start closed. A closed group with ticked options
   shows the count of ticked options in its summary.
3. **FacetPanel.** From 1024 px the FacetGroups form a sidebar left of the results. Below
   1024 px a "Flere filtre (n)" button opens them in a full-screen react-aria `Modal`, where n
   counts ticked facet options. The dialog has a sticky footer button "Vis N treff" that closes
   it. Focus returns to the "Flere filtre" button on close. Escape closes too. Changes apply
   live, so the count in the footer is always the real one.
   - The page's one status region must stay audible while the dialog is open. react-aria's
     `Modal` hides everything outside it from screen readers (`ariaHideOutside`). The build
     confirms in react-aria's source which attribute that function leaves visible and puts it on
     the status region. The count announcement is not duplicated inside the dialog.
   - The dialog's scroll area has `scroll-padding-bottom` equal to the footer's height, so the
     sticky footer never covers the focused checkbox.
4. **ActiveFilters.** A `TagGroup` labelled "Valgte filtre" above the results. One chip per
   active value, Sted picks and the national choice included (Ta med has no chip). Removing a
   chip moves focus to the next chip, or to the results heading when none are left. The search
   text gets no chip, because it is visible in its own field. "Nullstill alt" clears every
   filter and the search text, as the reset does today. It shows whenever anything is set.

### Loading and failure

- **While rows load,** counts are not rendered at all. A "0" before the data arrives would read
  as "nothing here". The reserved height (below) holds the layout still.
- **If the catalog fails,** the filter shows Søk only, as FilterBar does today, and the results
  area shows the existing error state with its retry (`error.heading`, both languages). Sted,
  the national radio and the facets need the catalog, so they stay hidden instead of showing
  empty. URL filters that need the catalog (old ids, fylker) wait for a successful retry.

### Behaviour kept from today

- The debounced result-count announcement fires on every filter key, the new ones included.
- Picking a search suggestion adds the place or category to the filter. Today a category
  suggestion replaces the chosen categories, and that changes. A Lavterskeltilbud suggestion
  ticks the Lavterskel Egenskap.
- The filter column reserves its loaded height while the catalog loads, so Back to /sok lands
  on the saved scroll position. The reserved height is re-measured for the new layout, both
  below and from 1024 px, and `e2e/historyNav.spec.ts` stays green.
- Links into /sok from the landing page, the acute strip and the kommune pages keep working.
  The kommune page link switches to `?municipality=<kommunenummer>`. The landing page's
  Lavterskeltilbud chip links to `?feature=lavterskel`. The acute strip keeps
  `?category=nodtjenester`.

### Copy

| Key | nb | en |
|---|---|---|
| Sted label | Sted | Place |
| Sted placeholder | Fylke, kommune eller tettsted | County, municipality or town |
| Groups in the list | Fylker, Kommuner | Counties, Municipalities |
| National legend | Nasjonale tjenester | National services |
| National options | Ta med, Skjul, Bare nasjonale | Include, Hide, National only |
| Facet legends | Kategorier, Egenskaper, Pris, Tilbyder | Categories, Features, Cost, Provider |
| Features | Lavterskel, Døgnåpent | Low threshold, Open 24/7 |
| Cost | Gratis, Delvis gratis, Betalt | Free, Partly free, Paid |
| Provider | Offentlig, Frivillig | Public, Voluntary |
| Phone button | Flere filtre (n) | More filters (n) |
| Dialog footer | Vis N treff | Show N results |
| Chips label | Valgte filtre | Selected filters |
| Reset | Nullstill alt | Clear all |

Existing badge strings are reused where the meaning is the same, so a facet and a badge never
use two words for one thing.

### Accessibility and look

- Every group is a `fieldset` with a `legend`, so a screen reader hears the group before the
  option. Counts are part of the label text ("Rus, 12").
- Group legends and option labels are set apart from counts by weight and colour. Counts are
  muted and tabular.
- Every control is at least 44 px. Controls side by side share one height and one bottom edge.
- Under `forced-colors: active`, checkbox and radio states, chip borders and focus rings stay
  visible through system colours, never through `box-shadow` alone.
- Both themes, 200 % text and 320 px reflow are checked. At 200 % text the sidebar stays a
  sidebar only while the results column keeps at least 20rem; below that it falls back to the
  dialog.
- Mobile-first CSS with min-width breakpoints at 768 px and 1024 px.

## Data contract

The filter needs place numbers and a fylke list. It does not need new resource fields:
Lavterskel, Døgnåpent and Pris use fields every row already has.

- **`places.json`** in the web data: each kommune with `number`, `countyNumber`, `name` and the
  old `id` while old links exist. Today's 8 kommuner and their numbers are copied from KLASS
  (listed under "Old links"). The build reads it next to `municipalities.json` and attaches the
  numbers, so this needs no C# change.
- **`counties.json`**: each fylke with data, `number` and `name`. Today: 34 Innlandet,
  03 Oslo.
- **`aliases.json`**: rows of `{ alias, number, source }`. It ships empty. The national data
  pipeline fills it from SSB tettsteder or Kartverket stedsnavn, never from memory. Whichever
  source fills it gets a credit line in the "Kilder og lisenser" list the national data spec
  adds, under that source's licence (confirm the licence when the source is picked). The KLASS
  numbers in `places.json` and `counties.json` get the same SSB credit.
- **A guard on the place files.** A test checks that every kommunenummer is 4 digits, every
  fylkesnummer is 2, each kommune's first two digits equal its `countyNumber`, and every
  `countyNumber` exists in `counties.json`. A fixture with Hamar under fylke `03` must fail it.
- **A `loadRows(places)` seam.** Filtering and facet counts call this one function for their
  rows. Today it returns every row. Spec B can make it fetch only the picked places' files
  without touching the filter code.
- **A data reconcile, before PR 2 opens.** The filter reaches lavterskel rows through the
  flag and topic categories only, so two things must hold for every row in category
  `lavterskeltilbud`:
  - It carries its topic category (for example `rus`). On 30.10.2026, 31 of the 48 rows
    carried no other category, so "rus i Hamar" missed them.
  - Its `isLowThreshold` is settled against my definition: a quote from the source earns the
    flag, and a row without one stays unflagged. The never-invent rule holds, so a flag is
    never set from memory.

  This is its own data PR, done where the data lives. The pipeline follows the same two rules
  for new rows. The category itself stays in the data for its badge and landing page chip.

Spec B (storage) takes over ownership of these three files.

## Testing

- **Unit (vitest), PR 1:** table-driven tests for every group alone and for groups combined.
  Disjunctive counts in an any-of group, kept-tick counts in Egenskaper, a ticked option's
  count, and a 0 count. Every old link form, `category=lavterskeltilbud` included. The fylke expansion, served
  kommuner and the three national modes. Bare nasjonale clearing Sted, and a place pick
  resetting the radio. URL round trip: parse then build gives the same URL, and two orders of
  the same params build one URL. The place-file guard, with its failing fixture.
- **Components (vitest with axe), PR 2:** each of the four components, both languages.
- **e2e (Playwright), PR 2:** at 375, 1024 and 1920 px in both themes. The keyboard path through
  Sted and the dialog, with focus back on its button. The count announcement. 200 % text. An
  old `?municipality=1` link lands on Hamar, and Back from there restores the scroll position.
  A measuring test asserts that Søk and Sted have the same height and bottom edge. With the
  dialog open, the status region is outside every `aria-hidden` subtree. Tabbing to the last
  checkbox in the dialog leaves it above the footer's top edge. Five Sted picks at 375 px
  cause no horizontal scroll. A forced-colors run (Playwright `forcedColors: "active"`) shows
  a visible focus ring on a checkbox. A failed catalog shows Søk and the error state only.
- **Manual, by me after PR 2 deploys:** an NVDA pass through Sted, the dialog and the chips
  row, listening for the count announcement while the dialog is open.
- `npm test` and the full `npm run e2e` pass before each PR opens.

## Delivery

1. **PR 1: the model.** `urlState` (params, old links, rewrite), `query` (all groups, the
   `loadRows` seam), `facetCounts`, the three data files and the build step that attaches
   numbers. Today's UI changes only as much as it must to write the new params. The single
   combobox writes a kommunenummer, and the national button writes `only`.
2. **Data PR: the lavterskel reconcile** (see Data contract). It can run in parallel with
   PR 1 and must merge before PR 2 opens.
3. **PR 2: the UI.** PlaceBar, FacetGroup, FacetPanel, ActiveFilters, the copy, and the
   reserved-height re-measure.

The Tilbyder group ships with the national data spec's UI follow-up, when rows carry
`providerType`.

## Out of scope

- Natural-language search ("tilbud for rusavhengige i hamar" turned into filters).
- Filling `aliases.json`, and the reform correspondence table. Both are pipeline data.
- Time-of-day "open now". Opening hours are still free text.
- Where the data lives and how the site loads it (spec B).

## Considered and rejected

- **A kommune number with no data in a shared link.** It is dropped like any unknown value,
  so the link widens to all of Norway. Data only grows, and renumbering goes through the KLASS
  table, so this is rare. Showing an unnamed chip would need names for places without rows.
- **Precomputed facet counts.** One pass over every row per filter change is about 25 checks
  per row. Even at 20,000 rows that is half a million cheap comparisons, well under a frame.
  An index adds code for no felt gain. Revisit only if a profile says otherwise.
- **A cap on how many places can be picked.** Picks come from a fixed list, values are
  deduplicated, and the union cannot grow past the full row set.
- **Remembering the last filter in `localStorage`.** It is not strictly necessary for the
  search, so ekomloven § 3-15 would require consent. It would also leave "rus i Hamar" on a
  shared device. The URL already restores state on Back and through shared links.

> Stress-tested 2026-10-30 (skill 1b85fca): 14 applied, 0 adapted, 0 decided by me.
