# Varde: the detail page as one card

## Why

C2a (PR #78) put the contact tiles inside a bordered card on `/resources/:id`, and I love how it
looks. The rest of the page still sits under the card, outside it: the description, an
hours/website list and "Sist bekreftet". I want everything about a service inside the one card,
in clear sections, with the actions in the card's top-right corner.

Base: PR #78 had not merged when I wrote this, so `feat/detail-card` is cut from
`feat/helplines-c2a`. It is rebased onto `main` once #78 merges, before the PR opens.

## Decisions

1. **One card holds everything.** Title, badges, region, contact, description, practical details
   and last verified all sit in one `article` with the C2a card style (rounded, 1 px border,
   surface fill, `p-5`, `md:p-8`).
2. **Sections with real headings.** Kontakt, Om tjenesten and Praktisk informasjon are each a
   `section` labelled by a visible `h2`. Browse mode reaches them with H (headings) and D
   (landmarks, since a labelled section is a region).
3. **Last verified is the card's footer**, with no heading. A heading over one date is noise in
   the heading list.
4. **Email moves into Kontakt as a tile.** It is a way to reach the service, like phone and chat.
5. **Corner actions, option D** (chosen from four rendered options on 2026-10-16): icon buttons
   with tooltips in the top-right corner from 768 px with a mouse or trackpad, and labelled
   buttons in a row under the title everywhere else (phones, and touch tablets at any width),
   where there is no hover to show a tooltip.
6. **"Back to results" goes**, because the in-app back and forward buttons replace it. See
   "Back to results" below for the order this lands in.

## Card structure

In DOM order, which is also the reading and focus order at every width:

1. **Head** (`header`)
   - `h1` service name (arrival focus target, unchanged)
   - badges, region line, "Del av …", fallback-translation note (unchanged)
   - the action group (see Corner actions)
2. **Kontakt** (`section aria-labelledby`): the contact tiles. Left out when there are no tiles.
3. **Om tjenesten** (`section`): the description as one paragraph, `max-w-prose`. Left out when
   the description is empty or only whitespace. When `isFallbackTranslation` is true on an
   English page, the paragraph gets `lang="nb"`, so a screen reader reads the Norwegian text with
   Norwegian pronunciation (WCAG 3.1.2).
4. **Praktisk informasjon** (`section`): a `dl` of Åpningstider, Adresse, Nettside, in that
   order. Left out when the service has none of the three.
5. **Footer** (`footer`, `text-sm text-muted`): "Sist bekreftet 2026-08-13". A `footer` inside an
   `article` is not a contentinfo landmark, so the site footer stays the only one.

Between sections: a 1 px `border-border` line, with `1.5rem` above and below it (`gap-6` on the
card, `padding-top: 1.5rem` on each section after the head).

### Section headings

The `h2` text is a label, not a title: `0.75rem`, uppercase, `letter-spacing: 0.12em`, regular
weight, `var(--muted)`. These are the same values as `.helpline-group` on the landing page, so
both selectors share one rule (`.helpline-group, .section-label { … }`) instead of a copy.
The Kontakt `h2` exists today as `visually-hidden`. It becomes visible with this style.

### Practical details

- `dt` muted, `dd` in body text (labels look like labels).
- Below 768 px each pair stacks, label over value, with `0.25rem` inside a pair and `1rem`
  between pairs, so it is clear which label belongs to which value. Each pair is a `div` inside
  the `dl` (valid HTML). From 768 px the `div` is `display: contents` and the `dl` is the C2a
  two-column grid (`max-content 1fr`, `gap-x-8`, `gap-y-3`).
- Website and email values use `overflow-wrap: anywhere` so a long URL wraps inside the card at
  320 px and at 200 % text.

## Kontakt: the email tile

- `contactTiles()` gains a third tile kind, `email`: `{ kind: "email", key, address, href }`,
  where `href` is `mailto:` plus the address. Only the service's own email becomes a tile.
  Children's emails stay on the children's own pages.
- **Guard, like `safeChatUrl`:** a new `safeEmail()` accepts one plain address
  (`local@domain.tld`, no spaces, no `?`, `&`, `,`, `;` or `:`) and returns null otherwise. A
  value like `a@b.no?bcc=x@y.no` would otherwise add hidden recipients or headers to the mailto.
  An unsafe value gets no tile and no link. Today's `dd` has the same hole, and it closes here.
- **Order:** the C2a order is unchanged, and the email tile comes last.
- **Tile content:** the mail icon, label "E-post" / "Email" (`detail.email`), value the address.
  The name reads "E-post, postmottak…" (the C2a hidden comma, same markup as the phone tiles).
  No `rel` or `target`: a `mailto:` link opens the mail app, not a page.
- The email row leaves Praktisk informasjon.
- **Row heights (a fix to C2a):** below 768 px the tiles are one column, and each tile is as tall
  as its own content. `grid-auto-rows: 1fr` applies from 768 px only, where tiles sit side by
  side. Today, at 200 % text, the phone tile stretches to the height of a wrapped email tile.

## Corner actions

Three actions, in this order: **Kopier nummer** (only when the service has a phone), **Del** or
**Kopier lenke** (the C2a share capability), **Meld feil i oppføringen** (the existing `mailto:`
report link, unchanged in behaviour).

### Markup

One set of controls serves every width. CSS switches the look, so there are no duplicated DOM
nodes.

- Each action is a `button` (copy, share) or an `a` (report) with class `action-btn`. It contains
  the icon, a visible short label (`action-label`) and a tooltip (`action-tip`).
- **Accessible name** is the full text via `aria-label`: "Kopier nummer", "Del" / "Kopier lenke",
  "Meld feil i oppføringen". The short label and the tooltip are `aria-hidden`, so a screen
  reader hears each name once. Every short label is contained in its name (WCAG 2.5.3, so voice
  control works with what is on screen).
- The group is a `div` with no role. Three controls do not need a toolbar's arrow-key model.

### Which mode applies

Icon mode needs both room and a hover-capable pointer:
`@media (min-width: 768px) and (hover: hover) and (pointer: fine)`. Every other case gets
labelled mode. Width alone is not enough: an iPad at 1024 px has room but no hover, so icon-only
buttons there would show no label at all. A touchscreen laptop reports its primary pointer (the
trackpad), so it gets icon mode.

### Labelled mode (phones, touch tablets): labelled buttons under the head

- The group sits after the head text and before Kontakt, matching the DOM order.
- `display: grid; grid-template-columns: repeat(auto-fit, minmax(5.5rem, 1fr)); gap: 0.5rem`.
  The buttons share one width and one height and fill the row. At 200 % text they wrap to one
  per row, with no sideways scroll.
- Each button: icon above the short label, `min-height: 56px`, `0.75rem` label text, the
  `btn-secondary` border, radius and surface.
- Short labels: "Kopier nummer" / "Copy number", "Del" / "Share" (or "Kopier lenke" /
  "Copy link"), "Meld feil" / "Report".

### Icon mode (768 px and up, with a mouse or trackpad): icon buttons in the top-right corner

- The head becomes a grid, `minmax(0, 1fr) auto`, `gap-4`, `align-items: start`. The title block
  is column 1, the group is column 2, and the group's top lines up with the card's content top.
  The title wraps within column 1 and never runs under the actions.
- Each button is 44 × 44 px, with the icon centred and the short label visually hidden.
- **Tooltip:** the full name, in the `.strip-tip` style. It sits `6px` below the button, aligned
  to the button's end edge, so it never leaves the card. It shows on hover and on
  `:focus-visible`. It exists only in icon mode, because labelled mode already shows the name.
  Escape hides it until the pointer re-enters or
  focus moves (WCAG 1.4.13, the same pattern as the acute strip). The pointer can move onto it
  without it closing, because it sits inside the control.

### Visible feedback for copy and share

Today the result of a copy ("Nummeret er kopiert", "Lenken er kopiert", "Kunne ikke kopiere")
only goes to the screen-reader live region, so a sighted user gets no sign anything happened. I
keep the live-region announcement, and add:

- After a copy or a share-by-copy, the same text shows for 4 seconds in that button's tooltip
  slot, in both modes (below the labelled button, below the icon). In icon mode it **replaces**
  the name tooltip while it shows, so two bubbles never stack. It is `aria-hidden`, because the
  live region already speaks it. Four seconds, not two: someone with low vision needs time to
  find and read even three words.
- A native share sheet (`outcome: "shared"`) shows nothing. The sheet itself is the feedback.
- Escape, or a click on another action, clears it early. A second click on the same action
  restarts the 4 seconds. The timer is cleared on unmount, so navigating away mid-message leaves
  no stray state update.

### Hydration: no corner jump on load

Today the copy and share buttons render only after a mount effect finds `navigator.clipboard`
or `navigator.share`. With the actions in a shared row, that would make the row jump from one
button to three on every load. The prerender therefore renders all three buttons, with the share
button labelled "Del". After mount the effect corrects the rare cases: no clipboard hides copy,
no share and no clipboard hides share, and clipboard without share relabels it "Kopier lenke".
The server and the first client render still match, so hydration stays clean.

## Back to results

The link and its `cameFromResults` history-state effect are removed in whichever PR lands second:

- If the in-app back and forward buttons have merged to `main` when this PR opens, this PR
  removes "Back to results".
- If not, this PR leaves it above the card, unchanged, and the back/forward PR removes it.

The page must never ship without a way back.

## Copy

New keys, in both bundles:

| Key | nb | en |
|---|---|---|
| `detail.aboutHeading` | Om tjenesten | About the service |
| `detail.practicalHeading` | Praktisk informasjon | Practical details |
| `report.short` | Meld feil | Report |

Reused: `detail.contactHeading`, `detail.copyPhone`, `detail.share`, `detail.copyLink`,
`detail.phoneCopied`, `detail.linkCopied`, `detail.copyFailed`, `detail.email`, `report.link`,
`card.hours`, `detail.address`, `detail.website`, `card.lastVerified`.

## Icons

Four new icons in `icons.tsx`, on the shared 24-unit `Svg` grid, decorative (`aria-hidden`):
**CopyIcon** (two offset rounded squares), **ShareIcon** (an arrow up out of an open box),
**FlagIcon** (a pole with a notched flag) and **MailIcon** (an envelope).

## Out of scope

- Dates following the language (backlog item 18). "Sist bekreftet" keeps the ISO date.
- Content links opening in a new tab (backlog item 19). The website link keeps its current
  behaviour.
- Hyphenating long Norwegian words in the title. At 200 % text, `wrap-anywhere` still breaks
  "rustjenester" mid-word, as it does today.

## Testing and verification

**Unit (vitest)**
- `contactTiles`: an email tile appears last, only for the service's own email. No email means no
  tile. `safeEmail` rejects `a@b.no?bcc=x@y.no`, `a@b.no,c@d.no`, `javascript:x@y.no` and
  `a b@c.no`, and accepts `postmottak.psykisk.helse@ringsaker.kommune.no`.
- Om tjenesten is left out for a blank description. On `/en` with `isFallbackTranslation`, the
  description paragraph carries `lang="nb"`, and without the flag it carries no `lang`.
- Copy feedback: the visible text appears, replaces the name tooltip, is gone after 4 seconds
  (fake timers) and after Escape. A second click restarts it. Unmounting mid-message logs no
  React warning.
- Detail page: the h1 and three h2s in order (Kontakt, Om tjenesten, Praktisk informasjon). Each
  section is a region named by its heading. Praktisk informasjon is left out when the service has
  no hours, address or website. Kontakt is left out when there are no tiles. The footer holds
  last verified. Email is a tile and not a `dd`.
- Actions: accessible names in both languages. Copy shows the visible confirmation and announces
  once. The prerendered markup holds all three actions. After mount, missing clipboard and share
  support hide copy and share as described above. Hydration produces no mismatch warning.
- The existing axe test passes on the new card.

**End to end (Playwright, against `build:site`)**
- At 768, 1024 and 1920 px in both languages: the action group's box does not intersect the h1's
  box. All three buttons are 44 × 44 and share one top and one bottom edge.
- At 375 px in both languages: the three buttons share one width, one height (at least 56 px)
  and one bottom edge. Every control on the card is at least 44 px tall.
- At 320 px, and at 200 % text at 375 px: no horizontal scroll, and the tiles and dl values stay
  inside the card.
- Tooltip: hover and keyboard focus show it at 1024 px, Escape hides it, and it stays inside the
  card's box.
- Below 768 px, tiles in one column are not all the same height when their content differs
  (id 102 at 200 % text).
- Touch tablet: a context with `hasTouch: true, isMobile: true` at 1024 px gets labelled mode
  (visible short labels, group under the head). Desktop Chrome at 1024 px gets icon mode.
- Each new layout check is run red once before the build: the e2e tests are written first and
  fail against the C2a layout, which proves they can fail.

**Before the PR:** measured screenshots of id 1 (three tiles) and id 102 (longest name, email
tile, all practical fields) at 375, 1024 and 1920 px, nb and en, dark and light, shown to me
before the PR opens. Every suite green: `dotnet test`, `biome ci`, `typecheck`, `vitest`,
Playwright against `build:site`.

## Considered and rejected

- **A toolbar role for the action group.** Three controls in a row are quicker with Tab than
  with a toolbar's arrow-key model, and the model would be one more thing to learn.
- **Hiding duplicate controls per breakpoint.** Two sets of buttons (one per mode) would be
  simpler CSS but double the test surface and risk the two drifting. One set, restyled, wins.
- **`lang="nb"` on the title and opening hours of a fallback row.** Names are proper nouns, and
  hours are short. Only the description is long enough for the wrong pronunciation to matter.
- **Fixing the cold-load language switch on detail pages** (page data has no language). It is a
  separate bug with its own follow-up, and this card reads every string through `t()` already.
- **Keeping the copy and share buttons hidden until mount.** Correct but jumpy. The optimistic
  prerender trades a rare flash (a browser with no clipboard) for no jump on every load.

> Stress-tested 2026-10-16 (skill 1b85fca): 6 applied, 1 adapted, 0 decided by me.
