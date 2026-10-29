# Varde filter redesign

Date: 30.10.2026. Status: draft, awaiting my review.

## Goal

The /sok filter has to work at national scale and answer real questions in one pass. My test
case is "rus i Hamar": it must show the kommune's own rus services and the lavterskel rus
offers next to them. Today the filter takes one kommune, a national on/off toggle and any-of
category chips. It cannot pick a fylke or several kommuner. It cannot ask for "akutt" and
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
   Rus plus Akutt means acute rus help. Rus plus Nødtjenester means rus or emergency.
   Lavterskeltilbud and Nødtjenester stay in Kategorier.
5. **National services are a 3-way radio under Sted:** Ta med (default), Skjul, Bare nasjonale.
   National rows serve every place. "Nasjonal" is not an Egenskap; its card badge stays.
6. **The browser is the only search.** `web/src/services/query.ts` stops promising to mirror
   the C# `ResourceRepository.SearchAsync`. The C# search is frozen as it is and gets none of
   the new filters. What happens to the API itself belongs to spec B (storage).

## Filter model

| Group | URL param (repeatable) | Values | Logic |
|---|---|---|---|
| Søk | `search` | free text | Substring of name or description, as today |
| Sted | `county`, `municipality` | fylkesnummer (`34`), kommunenummer (`3403`) | Any picked place |
| Nasjonale tjenester | `national` | `exclude`, `only`; absent means Ta med | Narrows |
| Kategorier | `category` | category slug | Any of |
| Egenskaper | `feature` | `akutt`, `lavterskel`, `dognapent` | All of |
| Pris | `cost` | `free`, `partly`, `paid` | Any of |
| Tilbyder | `provider` | `offentlig`, `frivillig` | Any of. Hidden until rows carry the field |

Groups AND together. `page` works as today. Any filter change resets `page` to 1.

Place numbers are strings everywhere (`"0301"`, `"03"`), because the leading zero matters.

### How each group matches a row

- **Sted.** A row matches a picked kommune when it is located there or serves it. That is
  today's `matchesMunicipality`, so a shared krisesenter shows in every kommune it covers. A
  picked fylke expands to its kommuner before matching.
- **Nasjonale tjenester.** Ta med: national rows are added to whatever Sted matches. Skjul:
  national rows are dropped. Bare nasjonale: only national rows, and Sted is ignored. With no
  Sted picked, Ta med and Skjul both start from every row.
- **Egenskaper.** Akutt is a row with category `nodtjenester` (as `ResourceBadges` derives it
  today). Lavterskel is `isLowThreshold`. Døgnåpent is `isAlwaysOpen`.
- **Pris.** Matches `cost`. A row with no stated cost drops out once any Pris box is ticked.
- **Tilbyder.** Matches `providerType` from the national data spec.

### Facet counts

Every checkbox and radio option shows how many results the list would have if I ticked it,
with every other group kept as it is (disjunctive counts). An option with 0 stays visible and
enabled, so the layout never jumps and nothing is hidden from a screen reader. One pure function,
`facetCounts(rows, filters)`, computes all counts in one pass over the rows.

### Old links

Parsing stays lenient, so no shared link breaks:

- `municipality` with one or two digits is an old database id. It maps to a kommunenummer
  through the catalog. Today's ids: 1 Hamar 3403, 2 Lillehammer 3405, 3 Gjøvik 3407,
  4 Ringsaker 3411, 5 Stange 3413, 6 Løten 3412, 7 Elverum 3420, 8 Oslo 0301 (SSB KLASS,
  classification 131, codesAt 30.10.2026).
- `national=true` means `only`.
- Unknown values in any param are dropped, not errors.
- A kommunenummer that changed in a reform maps through KLASS's correspondence tables. That
  table lives with the place data (spec B), and the parser takes it as input.

The URL is rewritten to the new form with `history.replaceState` once parsed, so a copied link
is always in the current form.

## UI

### Components

`FilterBar.tsx` splits into four parts with one job each.

1. **PlaceBar.** Søk and Sted side by side from 768 px, stacked below. Both controls are 44 px
   tall and share one bottom edge, and their labels sit on one baseline.
   - Sted is a react-aria `ComboBox` with `selectionMode="multiple"`. Picks show as removable
     `TagGroup` chips inside the field. The list stays open after a pick.
   - Options are grouped: Fylker, then Kommuner, each sorted with the `nb` collator. Only places
     with at least one row (located or served) are listed.
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
4. **ActiveFilters.** A `TagGroup` labelled "Valgte filtre" above the results. One chip per
   active value, Sted picks and the national choice included (Ta med has no chip). Removing a
   chip moves focus to the next chip, or to the results heading when none are left. The search
   text gets no chip, because it is visible in its own field. "Nullstill alt" clears every
   filter and the search text, as the reset does today. It shows whenever anything is set.

### Behaviour kept from today

- The debounced result-count announcement fires on every filter key, the new ones included.
- Picking a search suggestion adds the place or category to the filter. Today a category
  suggestion replaces the chosen categories, and that changes.
- The filter column reserves its loaded height while the catalog loads, so Back to /sok lands
  on the saved scroll position. The reserved height is re-measured for the new layout, both
  below and from 1024 px, and `e2e/historyNav.spec.ts` stays green.
- Links into /sok from the landing page, the acute strip and the kommune pages keep working.
  The kommune page link switches to `?municipality=<kommunenummer>`.

### Copy

| Key | nb | en |
|---|---|---|
| Sted label | Sted | Place |
| Sted placeholder | Fylke, kommune eller tettsted | County, municipality or town |
| Groups in the list | Fylker, Kommuner | Counties, Municipalities |
| National legend | Nasjonale tjenester | National services |
| National options | Ta med, Skjul, Bare nasjonale | Include, Hide, National only |
| Facet legends | Kategorier, Egenskaper, Pris, Tilbyder | Categories, Features, Cost, Provider |
| Features | Akutt, Lavterskel, Døgnåpent | Acute, Low threshold, Open 24/7 |
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
- Both themes, 200 % text and 320 px reflow are checked. At 200 % text the sidebar stays a
  sidebar only while the results column keeps at least 20rem; below that it falls back to the
  dialog.
- Mobile-first CSS with min-width breakpoints at 768 px and 1024 px.

## Data contract

The filter needs place numbers and a fylke list. It does not need new resource fields: Akutt,
Lavterskel, Døgnåpent and Pris use fields every row already has.

- **`places.json`** in the web data: each kommune with `number`, `countyNumber`, `name` and the
  old `id` while old links exist. Today's 8 kommuner and their numbers are copied from KLASS
  (listed under "Old links"). The build reads it next to `municipalities.json` and attaches the
  numbers, so this needs no C# change.
- **`counties.json`**: each fylke with data, `number` and `name`. Today: 34 Innlandet,
  03 Oslo.
- **`aliases.json`**: rows of `{ alias, number, source }`. It ships empty. The national data
  pipeline fills it from SSB tettsteder or Kartverket stedsnavn, never from memory.
- **A `loadRows(places)` seam.** Filtering and facet counts call this one function for their
  rows. Today it returns every row. Spec B can make it fetch only the picked places' files
  without touching the filter code.
- **One data rule for the pipeline:** a row in category `lavterskeltilbud` also carries its
  topic category (for example `rus`). Without it "rus i Hamar" misses the lavterskel offers.
  31 of the 48 lavterskeltilbud rows carry no other category today. Adding their topic
  categories is a data change of its own, done where the data lives.

Spec B (storage) takes over ownership of these three files.

## Testing

- **Unit (vitest), PR 1:** table-driven tests for every group alone and for groups combined.
  Disjunctive counts, including a 0 count. Every old link form. The fylke expansion, served
  kommuner and the three national modes. URL round trip: parse then build gives the same URL.
- **Components (vitest with axe), PR 2:** each of the four components, both languages.
- **e2e (Playwright), PR 2:** at 375, 1024 and 1920 px in both themes. The keyboard path through
  Sted and the dialog, with focus back on its button. The count announcement. 200 % text. An
  old `?municipality=1` link lands on Hamar. A measuring test asserts that Søk and Sted have
  the same height and bottom edge.
- `npm test` and the full `npm run e2e` pass before each PR opens.

## Delivery

1. **PR 1: the model.** `urlState` (params, old links, rewrite), `query` (all groups, the
   `loadRows` seam), `facetCounts`, the three data files and the build step that attaches
   numbers. Today's UI changes only as much as it must to write the new params. The single
   combobox writes a kommunenummer, and the national button writes `only`.
2. **PR 2: the UI.** PlaceBar, FacetGroup, FacetPanel, ActiveFilters, the copy, and the
   reserved-height re-measure.

The Tilbyder group ships with the national data spec's UI follow-up, when rows carry
`providerType`.

## Out of scope

- Natural-language search ("tilbud for rusavhengige i hamar" turned into filters).
- Filling `aliases.json`, and the reform correspondence table. Both are pipeline data.
- Time-of-day "open now". Opening hours are still free text.
- Where the data lives and how the site loads it (spec B).
