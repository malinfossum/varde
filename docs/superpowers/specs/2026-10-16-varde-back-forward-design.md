# Varde: Back and Forward in the installed app

Date: 2026-10-16. This spec replaces the back arrow (A4) in the UI polish spec (2026-10-02, on
the `docs/ui-polish-spec` branch) and takes over the manifest from that spec's PR 6. It works
beside the mega-menu spec (2026-10-15, on `docs/mega-menu-spec`), which changes the nav slot of
the same header. Where this spec and the UI polish spec disagree, this one wins.

## Purpose

An installed Varde (display mode standalone) has no browser buttons. Someone who taps the wrong
service on a phone has no way back except the brand link, and no way forward at all. I want
proper Back and Forward buttons there, so a misclick takes one tap to fix and you land where you
were.

A browser tab already has its own Back and Forward, so Varde adds nothing there.

## Decisions locked in the brainstorm (2026-10-16)

I looked at three placements rendered on a detail page at 375 and 1280 px before deciding.

1. **Installed mode only.** The buttons exist only under display mode standalone, like Rookdex's
   `HistoryButtons`. Browser tabs get no extra controls.
2. **The manifest ships in this branch**, as the UI polish spec describes it, so the app can be
   installed and the buttons tested on a real phone. The install hint stays in its own later PR.
3. **Back goes home when there is nothing behind it**, and is disabled on the landing page in
   that case. Nobody is stuck on a detail page the app opened straight onto.
4. **Phones and tablets get a bottom bar; desktop gets two icons before the brand.** Icons in
   the phone header were measured and do not fit: at 375 px the row needs 343 of 343 px in
   Norwegian and about 20 px more in English, even with the brand cut to its mark, so "Forlat
   siden" wraps. A bar under the header fitted but made the sticky header 52 px taller on every
   page.
5. **Back and Forward return you to your spot.** The page scrolls back to where you were and
   focus lands on the link you followed, so the next Tab carries on from there.
6. **The quick exit is unchanged**, and the limit of `location.replace` is stated here and
   tested as it is (see Quick exit).

## The manifest

`web/public/manifest.webmanifest`: `name` and `short_name` "Varde", `lang` "nb", `start_url`
"/", `scope` "/", `display` "standalone", `background_color` and `theme_color` from the light
`ground` token, and the four icons sub-project D shipped: `icon-192.png` and `icon-512.png` as
`any`, `icon-maskable-192.png` and `icon-maskable-512.png` as `maskable`. `index.html` links it
and adds one `theme-color` meta per colour scheme. The CSP's `default-src 'self'` already covers
`manifest-src`. The Search Console meta tag on `index.html` line 7 stays where it is. No service
worker: an offline cache fights "always current".

## Layout

**Installed mode.** The prerendered HTML is the same for everyone, so nothing changes at
hydration. CSS shows the controls only under `@media (display-mode: standalone)`, or when
`<html>` carries `data-standalone`. `main.tsx` sets that attribute before it hydrates when
`navigator.standalone` is true, for iPhones that do not match the media query. In a browser tab
the controls are `display: none`, so they are in neither the tab order nor the accessibility
tree.

Both layouts render from one component, `HistoryButtons.tsx`, with a `layout` prop (`"bar"` or
`"icons"`) that only changes markup and class names. Each is a `<nav>` named "Sidehistorikk" /
"Page history". CSS shows one of the two at any width, never both, the way the Meny and the
header nav share the header today.

**Below 1024 px: the bottom bar.**
- Fixed to the bottom edge, full width, `--surface` background, a 1 px `--border` on top, and
  `0.5rem 1rem` padding plus `env(safe-area-inset-bottom)` at the bottom. The viewport meta gets
  `viewport-fit=cover` so the inset is reported.
- Two equal columns (`1fr 1fr`, `0.5rem` gap) holding "‹ Tilbake" and "Fremover ›" (English
  "‹ Back" and "Forward ›"), in the `btn-secondary` shape, 44 px tall, with the 24 px stroke
  chevrons Rookdex uses (`M15 5l-7 7 7 7` and `M9 5l7 7-7 7`). The chevrons are `aria-hidden`;
  the visible text is the name.
- The bar sits after the footer in the DOM, so Tab reaches it last, in the order it is seen.
- `z-index` above page content and below the open Meny sheet and the open pickers.
- In installed mode below 1024 px, `body` gets a bottom padding equal to the bar's height, and
  `html` gets the same `scroll-padding-bottom`. The bar then never covers the footer, a call
  button or a control that Tab has just focused (WCAG 2.4.11). The height is the bar's real
  one: a `ResizeObserver` writes it to `--history-bar-h` on `<html>`, so a label that wraps at
  200 % text grows the padding with it. Until the observer runs, the value is `4.25rem` plus
  the safe-area inset (the bar's height at default text).
- The header is unchanged on phones.
- Neither layout prints: `@media print` hides both.

**From 1024 px: two icons before the brand.**
- Two 44 × 44 px buttons in the `btn-secondary` shape with no inline padding, `0.25rem` apart,
  as the first item in the header row. The row's own gap separates them from the brand.
- Each has the visually hidden name "Tilbake" / "Back" and "Fremover" / "Forward", and a
  tooltip with the same words on hover and on focus, built like the acute strip's tooltips
  (inside the button, `aria-hidden`, so the name is not read twice). As on the strip, Escape
  hides it until the pointer or focus leaves, and the pointer can move onto it without it
  closing (WCAG 1.4.13).
- Measured with the prototype at 1024 px: 33 px stay free in English and 45 px in Norwegian.
  The mega-menu's chevron takes about 24 px, so the header stays one row; the e2e checks hold
  this.
- In installed mode the mega-menu panel's first column lines up with the row's start edge,
  which is now the Back button, not the brand. In a browser tab nothing moves.

**Disabled.** A button that cannot act gets the real `disabled` attribute: Tab skips it, it is
dimmed (`opacity: 0.45`, default cursor), and it never disappears, so nothing beside it moves.
In forced colours a disabled button uses `GrayText`.

**"Tilbake til resultater"** on the detail page stays as it is. It also serves browser tabs.

## Behaviour

**Back.**
- When there is an earlier entry, Back calls `history.back()`.
- When there is none and the page is not the landing page, Back navigates to the landing page
  in the current language through the router. That adds an entry, so Forward can return.
- When there is none and the page is the landing page, Back is disabled.

**Forward.** Calls `history.forward()` when there is an entry ahead; otherwise it is disabled.

**Knowing what is behind and ahead.**
- Where the Navigation API exists (Baseline 2026), the state comes from `navigation.canGoBack`
  and `navigation.canGoForward`, read again on `currententrychange` and on `pageshow` (a page
  restored from the back/forward cache keeps the state it had when it was left).
- Without the API, the router keeps its own count. Every entry it writes carries an `idx` next
  to the existing `from: "sok"`, and it holds the highest reachable `idx` in memory. A push
  gives the new entry the current `idx` plus one and makes that the highest, because a push
  drops every entry that was ahead. Back is possible when `idx > 0` and Forward when `idx` is
  below the highest. After a reload the highest is not known, so it starts as the current
  `idx` and Forward is disabled: the safe direction. A page load that arrived without router
  state counts as `idx` 0.
- pushState fires no event, so the router lets the buttons subscribe and tells them after each
  push and each traversal; the buttons never poll.
- Every `replaceState` the router makes keeps the fields already on the entry (`from`, `idx`,
  and the saved focus values below) and changes only its own.
- Nothing is written to `localStorage` or `sessionStorage`.

**Before hydration** both buttons render disabled in the prerendered HTML and in the first
client render, then take their real state, so the two renders match.

**Focus and scroll.** Right before each push, the router saves two values on the entry being
left (with `replaceState`): `scrollY`, and the `href` of the link that was followed. `Link`
passes its own `href` to `navigate`; a navigation without a link (the search form, the
Back-to-home fallback) saves no `href`. `history.scrollRestoration` is set to `"manual"` so the
browser does not restore at a different moment than the page.

When a traversal (popstate, from these buttons or from the browser's own) arrives:

| Case | What happens |
|---|---|
| Route changed, the saved `href` matches a visible link | Once the page is ready: scroll to the saved `scrollY`, then focus the first visible link whose `href` attribute equals that value, with `preventScroll` |
| Route changed, no saved `href`, or no visible match | Today's arrival: scroll to the top, focus the heading |
| Same route (a filter change on /sok) | Scroll to the saved `scrollY`; focus stays where it is, unless it was on a history button that is now disabled, in which case it moves to the heading without scrolling |

The saved values are read from `history.state` when the page becomes ready, not when popstate
fires, so two quick presses restore the entry you end on. Links are matched by comparing each
link's `href` attribute with the saved string, never by building a CSS selector from it, so a
quote or bracket in a search URL cannot break the lookup. Scrolling is instant
(`behavior: "instant"`); nothing in this spec animates.

New navigations (link clicks, the search form) keep today's arrival: top of the page, focus on
the heading. "Visible" means `checkVisibility()` is true, so a link inside a closed Meny never
takes focus.

**Keyboard and screen readers.** Both are real `<button>`s: Enter and Space press them. On
phones the visible text is the accessible name; on desktop the visually hidden text is.
Landing on a page by Back or Forward announces the focused link (or the heading) and the page
title changes as on any arrival.

## Quick exit

"Forlat siden" keeps calling `location.replace(EXIT_URL)`. These buttons cannot undo it: the
exit page is not Varde, so the buttons are not on it.

**The limit, stated.** `location.replace` removes only the page you are on. Earlier Varde pages
in the same tab or app session stay in its history, so the browser's own Back (or Android's
system Back in the installed app) after an exit lands on the Varde page before the one you left.
It never lands on the page you left. No script can delete earlier history entries; krisesenter.no
and dinutvei.no have the same limit. These buttons move only through entries the router already
creates; the Back-to-home fallback adds one entry, the same as clicking the brand.

A short "how to delete your history" tip, on Om Varde or beside the exit, is a separate
follow-up, not part of this branch.

## Copy

New i18n keys, in nb and en:

| Key | nb | en |
|---|---|---|
| `history.label` | Sidehistorikk | Page history |
| `history.back` | Tilbake | Back |
| `history.forward` | Fremover | Forward |

## Out of scope

- The install hint ("Legg Varde på hjemskjermen"). It stays in the UI polish spec's PR 6.
- The "delete your history" tip (follow-up, see Quick exit).
- Buttons in browser tabs (decision 1).
- Swipe gestures, and a service worker or offline mode.

## Considered and rejected

- **Icons in the header at every width.** They break the one-row header at 375 px (decision 4).
- **A bar under the header.** It fits at every width but makes the sticky header 52 px taller
  on every page of the installed app.
- **Hiding a button that cannot act.** The brand and the bar's other half would move whenever
  the state changed.
- **`history.length > 1` as the test for "something behind".** It also counts entries ahead and
  entries from before Varde, so it says yes when Back would leave the app or do nothing.
- **Keeping today's top-and-heading arrival on Back.** It throws away your place in a long
  results list, which is the misclick this feature exists to fix.
- **A double tap on Back-to-home undoes itself.** The first tap goes home and adds an entry, so
  the second, now on the landing page with something behind it, goes back to the page you
  started on. Replacing the entry instead would stop that, but then Forward could not return
  (decision 3). It is harmless: you end where you were, and a third tap goes home.
- **Saving the scroll when you leave by Back or Forward.** The browser's own buttons cannot be
  intercepted before they move, so only pushes save. Forward to a page you left by Back opens
  it at the top with focus on the heading, the same with every button.
- **The Varde icon on a shared phone.** Installing puts a visible icon on the home screen. The
  name and the mark are neutral, and installing is the person's own choice; the install hint
  PR is the place to say so.
- **The bottom bar above the on-screen keyboard.** Where a phone lifts fixed elements above the
  keyboard, the bar sits between the keyboard and the search field. The field stays above it,
  and hiding the bar while typing would add a rule for little gain.
- **Without the Navigation API, Back after a full page load goes home.** A page reached by a
  full load (an old browser, a language switch) has no router state, so the fallback counts it
  as the first entry. Only browsers older than Baseline 2026 are affected.

## Testing

**Unit (Vitest and Testing Library).**
- The state logic with a fake Navigation API: `canGoBack` and `canGoForward` drive `disabled`,
  and `currententrychange` and `pageshow` refresh it.
- The fallback without the API: `idx` written on push, Back and Forward from `idx` and the
  highest `idx`, Forward disabled after a reload, and Forward disabled after Back followed by a
  new push.
- `replaceState` keeps `from: "sok"` and `idx` when the focus values are saved.
- A saved `href` with a quote in it is matched without an error.
- A same-route traversal that disables the focused history button moves focus to the heading.
- Back on a first load navigates home; Back on the landing page with nothing behind is disabled.
- The router saves `scrollY` and the followed `href` on the entry it leaves; a navigation
  without a link saves no `href`.
- A traversal back to a page with a matching visible link restores the scroll and focuses it; a
  missing or hidden link falls back to the heading at the top; a same-route traversal restores
  the scroll only.
- Names and the nav label in nb and en; both buttons disabled in the server render.
- The `navigator.standalone` check sets `data-standalone`.
- The manifest is valid JSON, every icon it names exists, and two are `maskable`.

**End to end (Playwright against `build:site`).**
- Installed mode is forced through Chromium's emulated `display-mode` media feature if Playwright
  accepts it; otherwise through the `navigator.standalone` path with an init script. The plan
  checks which one works before any test relies on it.
- Browser tab: no history controls at 375, 1024 or 1280 px.
- Installed mode, nb and en: the bar at 320 and 375 px, the icons at 1024 and 1280 px. Every
  control on the header row and on the bar shares one height and one bottom edge. No sideways
  scroll at 320 px. The header stays one row at 1024 px.
- The bar never covers the footer's last line at 375 px, and at 320 px with text at 200 %
  (the labels may wrap; the padding follows).
- With a mouse at 1280 px, hovering a desktop icon shows its tooltip and Escape hides it.
- Print emulation (`page.emulateMedia({ media: "print" })`) hides both layouts.
- axe passes in installed mode in both themes, at 375 and 1280 px.
- A first load of the landing page: Back is disabled.
- A first load of a detail page: Back goes to the landing page; Forward then returns to the
  detail page.
- /sok, scroll down, open a result, press Back: the scroll position matches what it was and the
  result's link has focus. Forward opens the detail page again.
- Quick exit, with `https://www.google.com/**` answered by `page.route` with a marked stub page.
  Each test first asserts the stub page is showing, so a quick exit that never left cannot pass:
  - after exiting from a detail page reached from /sok, `page.goBack()` lands on /sok, never on
    the detail page that was left;
  - in a one-page session, `page.goBack()` after the exit leaves Varde entirely;
  - Back-to-home raises `history.length` by exactly one.

**On my phone.** I install Varde from the built branch and try Back, Forward and the quick
exit in the real installed app before the PR opens. I also check whether the installed desktop
window (Chrome or Edge) already shows a back arrow of its own; if it does, dropping the desktop
icons becomes a follow-up.

## Build order and coordination

The build branch starts from `main` after PR #78 merges. The mega-menu changes the header's nav
slot and this spec adds the first item of the same row, so whichever merges second rebases and
re-runs the 1024 px one-row check in both languages.

> Stress-tested 2026-10-16 (skill 1b85fca): 11 applied, 1 adapted, 0 decided by me.
