# Varde: "Alle tjenester" mega-menu design

Date: 2026-10-15. Builds on the UI polish spec (2026-10-02, sub-project A, on the
`docs/ui-polish-spec` branch), whose Header, "One source, two layouts" and "Below 1024 px: Meny"
sections this one extends. Where the two disagree, this one wins. This is backlog item 22 (the
sub-menu under "Alle tjenester"); it pairs with item 6 (the filter dropdown), which it does not
build.

## Purpose

"Alle tjenester" in the header is a plain link to /sok today. Someone who wants to know what
Varde covers has to land on a long list and read the filter. I want one click that shows
everything Varde offers, grouped and labelled, the way Sanity's "Products" panel shows a whole
product range at a glance. On a phone the same overview lives inside the Meny.

The panel must stay a navigation aid, not a second emergency surface: the acute strip already
sits above the header on every page.

## Decisions locked in the brainstorm (2026-10-15)

I tested two throwaway prototypes (click and hover) in the preview before deciding.

1. **It opens on click, never on hover.** Helsenorge and NAV sit right beside the trigger, so a
   hover panel would flash open whenever the pointer passes on its way to them. Click matches the
   Meny and both pickers, and it avoids the WCAG 1.4.13 hover-content rules entirely.
2. **A disclosure, not a menu.** The trigger is a `<details>`/`<summary>` disclosure, the same
   element as the Meny and the pickers. `<summary>` is exposed as a button with an expanded or
   collapsed state, it works on the prerendered page before hydration, and there is no
   `role="menu"`, `menuitem` or roving tabindex anywhere.
3. **Content:** four groups. Kategorier (all nine), Noen å snakke med (the five landing-page
   helplines), Offentlige tjenester (Helsenorge, NAV) and Varde (Om Varde), plus a "Se alle
   tjenester" link to /sok.
4. **No emergency numbers in the panel.** The acute strip already shows them directly above the
   header. Nødtjenester stays as a category.
5. **Helsenorge and NAV stay in the header bar as well as in the panel.** The bar gives them one
   click (backlog item 8); the panel is the complete overview.
6. **Visible separation.** Hairline dividers between the columns, and labels that look like
   labels: smaller than the rows, bold, uppercase and in the accent colour.
7. **Phones: an accordion inside the Meny.** "Alle tjenester" is a nested disclosure in the
   Meny, in a group of its own, so it never sits flush against the links that leave Varde.

## Desktop: the panel (from 1024 px)

**Trigger.** "Alle tjenester" in the header nav becomes the `<summary>` of a `<details
class="services">`, styled as the other nav items (`.nav-link`: 44 px tall, weight 500) with a
16 px chevron after the text that turns 180° when open (no turn under
`prefers-reduced-motion`). The open trigger gets the picker hover tint as its background. Its
accessible name is "Alle tjenester" / "All services"; the chevron is `aria-hidden`.

**Position.** The `<details>` is `position: static`, so the panel (`.services-panel`) is
positioned against the sticky header: `position: absolute; inset-inline: 0; inset-block-start:
100%`, full viewport width, `z-index` above page content and below the open pickers' lists.
Background `--surface`, a 1 px `--border` top and bottom, and the picker shadow, deepened to
`0 16px 32px rgb(0 0 0 / 0.24)`.

**Height.** The panel moves with the sticky header, so the page cannot scroll it into view. Its
`max-block-size` is `calc(100dvh - 8rem)` (the Meny's value), with `overflow-y: auto` and
`overscroll-behavior: contain`, so on a short or zoomed window every link stays reachable by
mouse and visible when tabbed to (WCAG 2.4.11, house bar 2.4.12).

**Layout.** The panel body is held to the header's own column (`max-width: 72rem`, `1rem`
inline padding), so its first column starts on the brand's left edge. Three columns,
`grid-template-columns: 3fr 1fr 1fr`, with no gap: each column has `1.5rem 1rem 1rem` padding
(none on the outer edges) and every column after the first has a 1 px `--border` on its
inline start, so the dividers run the full height of the body.

The labels share one grid row through `subgrid`: the body has the rows `auto 1fr`, and each
column spans both with `grid-template-rows: subgrid`, as the landing's helpline rows already
do. At 1024 px "Noen å snakke med" and "Offentlige tjenester" wrap to two lines (measured in the
prototype: their first rows started 19 px below the categories'), and the shared row keeps the
first row of every column on one line however the labels wrap, in both languages.

| Column | Label | Rows |
|---|---|---|
| 1 | Kategorier / Categories | The nine categories, three by three (`repeat(3, 1fr)`), in `CATEGORY_SLUGS` order, row first |
| 2 | Noen å snakke med / Someone to talk to | The five helplines, in `HELPLINE_IDS` order |
| 3 | Offentlige tjenester / Public services | Helsenorge ↗, NAV ↗ |
| 3, below a hairline | Varde | Om Varde / About Varde |

Below the body, a full-width 1 px `--border` rule, then "Se alle tjenester →" / "See all
services →" in the accent, weight 600, aligned with the first column's row text.

**Labels.** `0.8125rem`, weight 700, `letter-spacing: 0.08em`, uppercase, `--accent`, with
`0.75rem` inline padding so they share an edge with the row text. They are never focusable.
The Varde label sits under a 1 px rule with `1rem` above and below it.

**Rows.** The picker row shape: 44 px minimum height, `0.5rem 0.75rem` padding, `0.5rem`
radius, the picker hover tint, `--text` colour, no underline. External rows keep the `↗` and
the hidden "(ekstern side, åpnes i ny fane)" text, as in `HeaderLinks`.

**Links.**
- A category: `/sok?category={slug}` with the language prefix (`/en/sok?...`).
- A helpline: its detail page, `/resources/{id}`.
- Helsenorge and NAV: `HELSENORGE_URL` and `NAV_URL` from `services/externalLinks.ts`, new
  tab, `rel="noopener noreferrer"`.
- Om Varde: `/om`.
- Se alle tjenester: `/sok`.

The row for the category in the current URL carries `aria-current="true"` and the picker's
current-row style.

**Forced colours.** The panel's border, the dividers and the rules stay visible as
`CanvasText`; the current category uses the picker's existing forced-colours rule; the open
trigger is marked by its turned chevron, never by the tint alone.

**Header bar.** The bar keeps Helsenorge ↗ and NAV ↗ after the trigger, unchanged. The header
stays one row at every width (the UI polish spec's header row rule).

## Phones and tablets: the Meny (below 1024 px)

**Order.** The Meny's groups become:

1. "Alle tjenester ▾", alone in its group.
2. Offentlige tjenester: Helsenorge ↗, NAV ↗, under the small muted label already used for
   Språk and Tema.
3. Språk.
4. Tema.

Each group keeps the existing hairline divider, so "Alle tjenester" never touches a link that
leaves Varde (at 320 px: 41 px from its bottom edge to Helsenorge's top edge, measured in the
prototype).

**The accordion.** "Alle tjenester" is a nested `<details class="services-accordion">` whose
`<summary>` is a picker row with the chevron in the row's last column. Open, it shows the same
four groups as the desktop panel and the same "Se alle tjenester" link, one column, with the
accent labels. The groups hang off a 1 px `--border` line on their inline start, indented
`0.75rem`, so they read as children of "Alle tjenester". The accordion is closed every time the
Meny opens.

**Sheet.** Below 640 px the Meny's list is a sheet across the header: positioned against the
header (the Meny's `<details>` becomes `position: static` here), `inset-inline: 0.5rem`, no
maximum width. From 640 px to 1023 px it keeps the picker's right-anchored shape at `22rem`.
At every width below 1024 px its maximum height is `calc(100dvh - 8rem)`, it scrolls inside
itself and has `overscroll-behavior: contain`. This replaces the 24 rem cap for the Meny only;
the pickers keep theirs.

## One source, two layouts

A new `components/ServicesGroups.tsx` renders the four groups and the "Se alle tjenester" link,
with a `layout` prop (`"panel"` or `"accordion"`) that only changes class names, and the same
`onFollow` callback `HeaderLinks` takes. `ServicesPanel.tsx` (desktop) and `HeaderMenu.tsx`
(the accordion) both render it, so the two layouts can never list different things.

Data comes from existing sources: `CATEGORY_SLUGS` and the `category.*` keys, `HELPLINE_IDS`,
and `externalLinks.ts`. The header renders on every page, and not every page's data block
holds the helplines, so their names come from a new constant, `HELPLINE_NAMES` in
`services/helplines.ts`, copied from the seed. A test reads the exported data and fails if a
name or an id ever differs (the never-invent rule: no name is typed from memory).

New i18n keys, in nb and en:

| Key | nb | en |
|---|---|---|
| `services.categories` | Kategorier | Categories |
| `services.talk` | Noen å snakke med | Someone to talk to |
| `services.public` | Offentlige tjenester | Public services |
| `services.varde` | Varde | Varde |
| `services.about` | Om Varde | About Varde |
| `services.all` | Se alle tjenester | See all services |

`header.allServices` stays as the trigger's name.

## Behaviour

**Desktop panel.**
- Click, Enter or Space on the trigger toggles it. Focus stays on the trigger when it opens;
  the next Tab enters the panel, and Tab and Shift+Tab move through the links in DOM order
  (column by column). There are no arrow keys in the panel: it is a disclosure of links.
- It closes on Escape (focus back to the trigger), on a pointer-down outside it, when focus
  moves outside it, when a link in it is followed, and on any route change.
- Following an in-app link closes it and returns focus to the trigger, and the route change then
  moves focus to the new heading as today. A link to the route already shown, or a new tab,
  leaves focus on the trigger.
- Opening it closes any open picker, and opening a picker closes it: one open surface at a
  time.
- Safari does not focus a `<summary>` or a link on click, so focus-out alone cannot be relied on
  there; the outside pointer-down rule is what closes it, as in `usePicker`.
- Opening never moves focus. Chrome opens a closed `<details>` when find-in-page matches text
  inside it, so searching the page for "Bolig" opens the panel; that is accepted, and it must
  not steal focus from the find bar.

**Phone accordion.**
- The Meny keeps the picker behaviour: it opens with focus on its first row, which is now
  "Alle tjenester". Arrow keys, Home and End move between rows.
- `usePicker` changes in one place: its row list keeps only rows that are rendered
  (`checkVisibility()`), so arrow keys skip the rows of a closed accordion instead of stalling
  on them.
- Enter or Space on "Alle tjenester" toggles the accordion. Escape closes the whole Meny and
  returns focus to the Meny trigger. Following any link closes the Meny, as today.
- The nested `<details>` must not have the `picker` class, so `usePicker`'s "close every other
  open picker" rule does not close it, and its toggle event must not run the Meny's
  `onToggle`. A test covers both.

**Screen readers.** Each group is a `<ul aria-labelledby>` pointing at its label, so NVDA says
"Kategorier, liste, 9 elementer" on entering it. The labels are `<span>`s, not headings, so the
panel adds nothing to every page's heading outline. The trigger is announced as a button with
its expanded or collapsed state.

**Touch.** Click only, so a tap opens and a second tap closes. Every target is at least 44 px.

## Out of scope

- Opening on hover (decided against, decision 1).
- A one-line description under each row, as in Zed's panel.
- Item 6, the filter dropdown on /sok. The panel's `/sok?category={slug}` links are the
  contract it reads, and `CATEGORY_SLUGS` stays the one category list for both.
- More categories (sub-project C). The category column flows three across, so a tenth category
  starts a fourth row without a layout change.

## Considered and rejected

- **Arrow keys in the desktop panel.** It is a disclosure of links; Tab reaches them all, and
  arrows in a three-column grid would be ambiguous (down a column or along a row?).
- **Headings for the group labels.** They would add four headings to every page's outline;
  labelled lists give NVDA the same group names.
- **Rendering the panel only after hydration.** It would save about twenty links per page of
  HTML, but the panel would not work before JavaScript loads. The links are internal and help
  search engines find the category pages.

## Testing

**Unit (Vitest and Testing Library).**
- The trigger toggles the panel and its expanded state, for nb and en.
- Every link has the right href, for nb and en, and the current category has `aria-current`.
- Escape, an outside pointer-down, focus leaving and following a link each close the panel,
  with focus where this spec says.
- The panel and a picker are never open together.
- The Meny lists its groups in the new order, and the accordion is closed each time it opens.
- Arrow keys skip a closed accordion's rows. Opening the accordion leaves the Meny open.
- `HELPLINE_NAMES` matches the exported data.
- `header.test.tsx` and `headerMenu.test.tsx` drop their "Alle tjenester is a link to /sok"
  checks; the "Se alle tjenester" link takes them over.

**End to end (Playwright).**
- 1280 x 800: the panel's first column, its row highlights and "Se alle tjenester" start on the
  brand's left edge; every row is 44 px; the dividers run the body's full height.
- 320, 375 and 800 px: the Meny sheet stays inside the viewport with no sideways scroll.
- 1024 x 800, nb and en: the first row of every column starts on one line.
- 1024 x 500: with the panel open, Tab to "Se alle tjenester"; it is inside the viewport.
- axe passes with the panel open and with the accordion open, in both themes.
- Forced colours (`forcedColors: "active"`): the panel's border and dividers are not
  transparent, and the focus outline shows on a row.
- The header stays one row with the panel's trigger in it.

> Stress-tested 2026-10-15 (skill 1b85fca): 6 applied, 0 adapted, 0 decided by me.
