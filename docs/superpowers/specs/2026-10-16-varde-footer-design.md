# Varde: a calmer footer with icons and a theme pill

## Why

The footer today is two lines of text: the liability sentence with the 113 link, then "Om Varde
og ansvar", "Meld feil", "Kildekode på GitHub" and "Ingen sporing. Ingen informasjonskapsler.".
It works, but it reads as a wall of small text. I want a calmer footer: a small muted label,
plain icons where the meaning is universal, short small uppercase text, and a theme switcher as
three icons in a pill. Less text and more air, without losing a single safety word. Inspired by
the footer on sanity.io.

Rule for this footer, and for the design-system pattern that follows it: **an icon where the
meaning is universal, short text where it is not. A safety or trust link is always text.**

## Decisions

1. **Approach A, one bar** (chosen 2026-10-16 from three approaches, after a rendered prototype).
   From 1280 px the footer is one 44 px row and stays **69 px tall**, exactly as today, so the
   landing page still fits one 1920 x 950 screen. Below 1024 px it stacks.
2. **The theme switcher moves to the footer** as a pill of three icon buttons (sun, monitor,
   moon). The desktop header loses its Tema picker. The phone Meny keeps its theme rows.
   Language stays in the header, because someone who cannot read Norwegian needs it at the top.
3. **Only GitHub becomes an icon.** "Om Varde og ansvar", "Meld feil" and "Slett historikken"
   stay as visible text, and so does the liability sentence with 113.
4. **A muted label, "Om nettstedet" / "About this site"**, above the links on phones and tablets.
   From 1024 px it is visually hidden but still names the footer nav.
5. **"© Varde" with no year**, at the start of the privacy note's first line, so it costs no
   extra width or height: "© Varde · Ingen sporing." / "Ingen informasjonskapsler.".
6. **The privacy note is small text**: two short lines, small, uppercase, muted.

## Layout

### DOM order

The same at every width. It is also the reading and focus order:

1. `p.footer-liability`: the liability sentence and the 113 link (unchanged text and target).
2. `nav.footer-nav` with `aria-labelledby` pointing at its label:
   - `span.footer-label`: "Om nettstedet" / "About this site"
   - the text links: Om Varde og ansvar, Meld feil, Slett historikken (see Coordination)
3. `p.footer-note`: line 1 "© Varde · Ingen sporing.", line 2 "Ingen informasjonskapsler."
4. `div.footer-bar`: the GitHub icon link, then the theme pill.

### Below 1024 px (stacked)

A grid with `gap-3`, everything left-aligned, `text-sm`:

- the liability sentence, full width;
- the label over the links (the links wrap as today, `gap-x-4`);
- the note on its own line, two lines;
- the bar: one 44 px row, GitHub icon on the left, pill on the right (`justify-between`). The
  GitHub link gets `-ml-3` so its 20 px glyph lines up with the text edge above it, while its
  44 px target stays whole.

Measured on the prototype at 375 px (nb and en): the bar is 44 px tall and the GitHub link and
the pill share one bottom edge. The note fits on two lines in both languages.

### From 1024 px (one row)

`lg:flex lg:flex-wrap lg:items-center lg:justify-between lg:gap-x-6`. The label is visually
hidden with Tailwind's built-in `lg:sr-only`, so it still names the nav. (Varde's own
`.visually-hidden` is a plain class in `@layer components`, and Tailwind v4 generates no `lg:`
variant for those.)

- **Liability:** `lg:max-w-[17rem]`, so the sentence wraps to two lines (2 x 20 px = 40 px,
  inside the 44 px row). Measured: 272 x 40 px in both languages.
- **Links:** one line, `lg:gap-x-3`, each `min-h-11`.
- **Note:** two lines of 16 px = 32 px, centred in the row.
- **Bar:** GitHub icon and pill, `lg:gap-3`.

Each group is `flex-none` except the links, so a group never breaks in the middle. Between 1024
and about 1100 px the row does not fit and the groups wrap to a second row, as the footer does
today. That is allowed: the one-screen rule only applies at 1920.

### Width budget (measured 2026-10-16 on the prototype, with "Slett historikken" in place)

The content width is 1120 px at 1280 and at 1920 (`max-w-6xl` minus `px-4`).

| Width | Language | Liability | Links | Note | Bar | Gaps | Spare |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1280, 1920 | nb | 272 | 305 | 231 | 188 | 72 | 52 |
| 1280, 1920 | en | 272 | 391 | 181 | 188 | 72 | 16 |

English has 16 px to spare. The e2e test below holds it to one row at 1280, so any later text
change that breaks the row fails loudly instead of quietly pushing the landing off the screen.

### Height

Measured on the prototype at 1920 x 950: footer 69 px, bottom at 950, page height 950 in both
languages and both themes. Every footer control (three links, GitHub, three pill buttons) is
44 px tall with one bottom edge at 938 px.

## Text and names

New and changed keys in `nb.json` / `en.json`:

| Key | nb | en |
| --- | --- | --- |
| `footer.label` (new) | Om nettstedet | About this site |
| `footer.noTracking` (changed) | Ingen sporing. | No tracking. |
| `footer.noCookies` (new) | Ingen informasjonskapsler. | No cookies. |
| `footer.source` (unchanged) | Kildekode på GitHub | Source code on GitHub |

"© Varde" is not translated and is not a key. The `·` between "© Varde" and the first sentence
sits in an `aria-hidden` span, so a screen reader does not read "middle dot". Uppercase comes
from CSS (`text-transform`), never from the strings, so screen readers read normal words, not
letter by letter.

The theme buttons reuse `header.themeLight`, `header.themeSystem`, `header.themeDark` and
`header.theme` (the group name). The `header.` prefix stays, to keep this change small.

### Label and note style

One rule, `.footer-label, .footer-note`: `0.75rem`, `line-height: 1rem`, uppercase,
`letter-spacing: 0.14em`, `var(--muted)`. Two different trackings for two pieces of small
uppercase text side by side would look like a mistake.

## The GitHub icon link

- An `a` to `https://github.com/malinfossum/varde` with `rel="noopener noreferrer"`, 44 x 44 px,
  icon centred, `text-muted`, `hover:text-fg`. Same tab, as today.
- **Name:** a visually hidden span, "Kildekode på GitHub" / "Source code on GitHub".
- **Icon:** GitHub's own mark, filled, `viewBox="0 0 24 24"`, 20 px, `aria-hidden`. The path is
  copied from GitHub's Octicons `mark-github-24` source, never typed from memory. Before copying,
  the build confirms two things from their sources and cites them in the comment above the
  path: the Octicons licence (expected MIT), and GitHub's logo guidelines, which allow the
  unaltered mark as a link to a GitHub repository. The mark is never recoloured beyond
  `currentColor`, rotated or combined with other shapes. It lives in `icons.tsx` as `GitHubIcon`, with a
  comment that it is the one filled brand mark among the stroke icons, on purpose.
- **Tooltip:** see Tooltips.

## The theme pill

### Markup

```tsx
<div role="group" aria-label={t("header.theme")} className="theme-pill">
  <button type="button" aria-pressed={…} className="theme-pill-btn">
    <SunIcon />
    <span className="visually-hidden">{t("header.themeLight")}</span>
    <span className="footer-tip" aria-hidden="true">{t("header.themeLight")}</span>
  </button>
  … System, then Mørkt
</div>
```

- **Order:** Lyst, System, Mørkt (sun, monitor, moon). Light to dark with System
  between them reads as a scale. `THEME_CHOICES` keeps its order for the Meny rows. The pill
  has its own order list in `ThemePill.tsx`, built from the same three entries.
- **Size:** each button is 44 x 44 px and round. The pill is 132 x 44 px. Its outline is an inset
  `box-shadow: inset 0 0 0 1px var(--border)` on the group, so the outline adds no size and the
  pill is exactly as tall as the links beside it.
- **Pressed:** `aria-pressed="true"` on the current choice. It shows an inset 1 px ring in
  `var(--text)` and `text-fg`. The others are `text-muted`, `hover:text-fg`.
- **Forced colours:** box shadows vanish there, so under `@media (forced-colors: active)` the
  group gets `outline: 1px solid CanvasText` and the pressed button
  `border: 2px solid Highlight`. A border, not an outline, so it never replaces the house focus
  ring (`:focus-visible` is an outline) on the pressed button.
- **Focus:** the house focus ring, unchanged. The group does not clip it.

### Behaviour

- A click calls `theme.choose(choice)`: Lyst and Mørkt store the key, System removes it and
  follows the OS. This is the existing `useThemeChoice` and `services/theme.ts`, unchanged.
- **Announcement:** a choice is announced as "Tema: Mørkt" / "Theme: Dark" through
  `useAnnounce()` from `StatusRegion.tsx`, the live region the Meny already uses, because a change in pressed state alone is not reliably
  spoken (the Meny learned this, see the comment in `HeaderMenu.tsx`). Focus stays on the
  button. Pressing the button that is already pressed changes nothing. The focused button
  already reads as "pressed", so no second line is needed.
- **Before mount** (prerender and first paint) the state is `null`. Every button renders
  `aria-pressed="false"`, so the server and the browser HTML match. The real state arrives in
  the effect. No hydration mismatch, the same model as the picker it replaces.

### One theme state

Today `Header` calls `useThemeChoice()` and shares the result between the desktop picker and the
Meny. With the pill in the footer, a second call would give a second state: a choice in the pill
would not update the Meny's pressed row in the same tab (a `storage` event only fires in
*other* tabs). So `App` calls `useThemeChoice()` once and passes `theme` to `Header` (for the
Meny) and to `Footer` (for the pill), as props. One level of props, no context.

## Tooltips

The GitHub link and each pill button get a tooltip with the name, in the style and with the
behaviour of `.strip-tip` (hover and `:focus-visible`, only with
`(hover: hover) and (pointer: fine)`, Escape hides them until the pointer enters or focus moves,
WCAG 1.4.13). One difference: **footer tooltips open above** the control
(`inset-block-end: 100%` plus a 6 px gap), because the footer sits at the bottom of the screen
and a tooltip below it would be cut off or add a scrollbar.

The shared rule becomes `.strip-tip, .footer-tip { … }` with a `.footer-tip` override for the
position:

- **Bridge:** the 6 px gap is the tooltip's own transparent `padding-block-end` (the visible
  bubble is an inner span), so the pointer can move from the control onto the tooltip without
  leaving the hover area (WCAG 1.4.13, hoverable).
- **Alignment, so no tooltip leaves the screen:** the GitHub link's tooltip aligns to the link's
  start edge, because on phones and narrow windows it sits at the left edge of the page and a
  centred "Kildekode på GitHub" would run off it. The Mørkt tooltip aligns to its end edge,
  because the pill sits at the right edge. Lyst and System are centred. The Escape handling moves out of `AcuteStrip.tsx` into a small hook,
`useDismissibleTips()`, which returns `{ hidden, show }`. The strip and the footer each call it.
The tooltip text is `aria-hidden`, because the hidden span already carries the name.

The System tooltip shows the resolved theme once mounted: "System (mørkt)" / "System (dark)",
reusing `header.themeResolvedDark` / `header.themeResolvedLight`. This keeps the one useful thing
the old picker's visible value did.

## Header change

- `Header` drops `ThemePicker` from `.header-tools`. Only `LanguagePicker` stays there.
- `ThemePicker.tsx` and `tests/themePicker.test.tsx` are deleted. Every behaviour the picker
  tests cover (stores the choice, System follows the OS live, another tab is followed, blocked
  storage keeps the page up, Mørkt survives an OS change with storage blocked, prerendered HTML
  matches) moves to `tests/themePill.test.tsx` against the pill.
- `Picker.tsx` stays: `LanguagePicker` uses it.
- `HeaderMenu` and `ThemeRows` are unchanged, apart from `theme` now arriving from `App`.

## Coordination with other branches

- **History tip** (the session that writes the "Slett historikken" tip on `/om`): that branch
  owns the "Slett historikken" / "Delete your history" link to `/om#slett-historikk`, because
  its target does not exist until that branch lands. It also planned to turn the GitHub link
  into an icon. This spec does that, so the history-tip branch drops its GitHub change if this
  one lands first. **Whichever merges second rebases** and runs the footer e2e checks. The width
  budget above was measured with the history link in place, so both orders fit.
- **Mega-menu and Back/Forward specs:** both describe the desktop header. If either names the
  Tema picker, whichever lands second removes it from that description. The header row only
  gains room from this change.
- **Detail card:** it adds a `.section-label` style. That one is a card heading. The footer label
  is a different element with its own rule, so the two do not collide.

## Testing

Unit (`vitest`):

- `tests/footer.test.tsx`: the liability text and the 113 link; the three text links and their
  `href`s in nb and en; the GitHub link by its name in nb and en, with no visible text; the note
  reads "© Varde Ingen sporing. Ingen informasjonskapsler." (en: "© Varde No tracking. No
  cookies."); the nav is named "Om nettstedet" / "About this site".
- `tests/themePill.test.tsx`: the group is named Tema/Theme; three buttons named Lyst, System,
  Mørkt in that order (en: Light, System, Dark); every behaviour moved from
  `themePicker.test.tsx`; a pill choice updates the Meny's pressed row in the same render tree;
  the announcement fires; pressing the pressed button leaves the stored key unchanged.
- `tests/shell.test.tsx` and `tests/header.test.tsx`: no theme picker in the header any more.
- `tests/axe.test.tsx`: unchanged, it must stay clean.
- `tests/i18n.test.tsx` already fails on a key with no twin, and `tests/tokens.test.ts` already
  holds `--muted` at 4.5:1 or more on the page ground in both themes, which covers the 12 px
  label and note.

End to end (Playwright):

- `e2e/landing.spec.ts`: the one-screen test at 1920 x 950 stays as it is and must still pass.
- `e2e/footer.spec.ts`, new checks (all through the `e2e/helpers.ts` load, which waits for
  `document.fonts.ready`, so a fallback font never decides the width):
  - at 1280 and 1920, both languages, both themes: footer height ≤ 69 px and every footer control
    on one row (all tops equal);
  - at 375, 1024, 1280 and 1920: every footer control is 44 px tall and the controls on each row
    share one bottom edge;
  - at 375: the GitHub glyph's left edge lines up with the liability text's left edge (± 1 px);
  - with text at 200 % at 375 and 1280: no sideways scroll;
  - forced colours: the pressed pill button has a visible outline;
  - at 320, 375 and 1920 with a mouse: each footer tooltip sits above its control and inside
    the viewport; moving the pointer from the control onto the tooltip keeps it open; Escape
    hides them;
  - the existing 113 target test, unchanged.
- `e2e/header.spec.ts`: "at ≥1024 only the nav and the pickers" becomes "the nav and the
  language picker"; the forced-colours test keeps its language-picker row.

Visual check before the PR: screenshots at 375, 1024, 1280 and 1920, nb and en, dark and light,
measured as above. I see them before the PR opens.

## Considered and rejected

- **A radio group for the pill.** `role="radiogroup"` with one tab stop and arrow keys is the
  other valid pattern. I keep three `aria-pressed` buttons because the Meny's theme rows and the
  design-system picker already use pressed buttons, so one model runs through the whole site.
  Three tab stops at the end of the page is a small cost.
- **Keeping a theme control in the desktop header.** Theme becomes harder to find on a long
  list page, because the footer is far down. I accepted that on 2026-10-16: theme is set once,
  and a calmer header matters more.
- **Announcing again when the pressed button is pressed again.** The shared announcer drops a
  message identical to the last one (React keeps the same state), and making it repeat would
  change the announcer for every caller. Not needed: the focused button already reads as
  "pressed".
- **The pill before hydration.** Its buttons do nothing until the app has loaded, as with the
  Meny's rows today. The init snippet already applies the stored or system theme, so nothing
  looks wrong in the meantime.
- **New-tab links (backlog item 19).** The GitHub link keeps opening in the same tab, as today.
  If the new-tab change lands later, the icon link's hidden name gains "(åpnes i ny fane)" /
  "(opens in a new tab)", and its tooltip shows the marker, in that change.

## Out of scope

- A separate "© Varde 2026" line, social icons other than GitHub, a status pill.
- Moving the language picker.
- The workbench design-system pattern. It has its own spec in the workbench repo.

> Stress-tested 2026-10-16 (skill 1b85fca): 5 applied, 2 adapted, 0 decided by me.
