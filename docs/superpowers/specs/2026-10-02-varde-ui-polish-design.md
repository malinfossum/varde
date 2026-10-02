# Varde: UI polish and install hint (sub-project A) design

Date: 2026-10-02. Builds on the redesign spec (2026-09-08), the static-first spec (2026-09-15)
and the brand spec (2026-10-01). Where this document and an earlier one disagree, this one
wins. The backlog items are numbered as in the plan 5 backlog (2026-09-10); A1 to A4 and P were
added during the brainstorm.

## Purpose

Varde works, and people are already sharing it. What it lacks is finish and a few safety
pieces. The landing page is taller than one screen, the result cards are ragged, the header
controls look like plain buttons, and there is no page that says what Varde is and is not.
Someone in crisis must never mistake a directory for an emergency service, and I need that
said plainly before the site spreads further.

Two requirements govern every call in this spec, as in all of plan 5: Varde must be **fast**,
and its data must be **always current**. Nothing here adds a server, a service worker or a
cache that could serve a stale phone number.

## Decisions locked in the brainstorm (2026-09-28 and 2026-10-02)

- **The whole landing page, footer included, fits a 950 px tall window** (a maximised browser
  on a 1080p screen) at widths 1280 and 1920. Measured 2026-10-02 at 1920 x 960: 1175 px tall,
  hero 570 px of which 128 px is padding.
- **Cards use CSS subgrid** so every slot lines up across a row. Descriptions are never clamped.
- **Chips:** Nødtjenester stands apart as its own accent chip; the other eight sit in an equal
  grid, 2 columns on phone and 4 from 768 px.
- **"Noen å snakke med"** is a new landing section, driven by a curated list of resource ids.
- **Navbar:** "Alle tjenester" (`/sok`), "Helsenorge" and "NAV". No kommune index until
  sub-project C.
- **Quick exit follows the GOV.UK "Exit this page" pattern:** always in view, Shift pressed
  three times leaves (also inside inputs), one explainer line on the landing page.
- **Language and theme use the Workbench pickers** (DS 3.8.0, `components/picker.js` and
  `theme/theme-toggle.js`): a globe language menu built to take any number of languages, and a
  theme menu with Lyst, Mørkt and System. This replaces the segmented control and switch shown
  in the first section 1 sketch.
- **PWA: installable, online-only.** A web manifest and the icons from sub-project D, plus an
  instruction-style install hint. No service worker, because an offline cache fights "always
  current".
- **"Om Varde" page with liability text**, a footer line on every page and a "Meld feil" link.
  The liability text goes live in A and gets a lawyer's check (free student legal aid) once the
  whole project is finalised, so everything can be validated at once.
- **"Meld feil" goes to a new, dedicated Proton alias**, not the existing Varde alias, which is
  tied to deploy accounts.
- **A back arrow appears only in installed (standalone) mode**, where there is no browser back
  button.
- **Playwright is approved** as a dev dependency in `web/`, Chromium only, run in CI on every
  pull request.
- **Six PRs, in order:** harness, Om Varde, header, landing, cards, install.

## Out of scope (other sub-projects)

Item 1 (chip click lands mid-page) is already fixed by #20 and verified live. Item 6 (filter
dropdown), the fylke-then-kommune filter, Lavterskel and Spesialisthelsetjenesten belong to C.
Forms (`/skjema`) are B. The data watchdog is E. The mega-menu, the NPE and Lovdata shortcuts,
phone bottom tabs and back/forward on the web are F. More languages than nb and en are their
own later sub-project; A only builds the picker so it can take them.

## The items

### Header (items 8, A1, A2, 7)

One row on desktop, in this order:

| Slot | Content |
|---|---|
| Back (A4) | Back arrow, installed mode only (see Install) |
| Brand | BrandMark and "Varde", links to `/` (unchanged) |
| Nav | "Alle tjenester" (`/sok`), "Helsenorge", "NAV" |
| Pickers | Language picker, theme picker |
| Exit | "Forlat siden" |

- **Links.** "Alle tjenester" / "All services" is an internal link. "Helsenorge" points to
  `https://www.helsenorge.no` (the same URL `services/hints.ts` already uses) and "NAV" to
  `https://www.nav.no`. Both open in the same tab, carry a small ↗ marker and a visually hidden
  "(ekstern side)" / "(external site)". The URLs are copied from the official sites, never from
  memory, and a unit test pins them.
- **Language picker.** A port of the Workbench picker: `<details class="picker">` with a
  `<summary>` trigger (globe icon and the current language name, "Norsk" or "English") and a
  list of `.picker-row` links, one per language, each showing the name and a code (NO, EN). No
  flags: a flag names a country, not a language. The current row carries `aria-current`.
  Choosing a row keeps today's behaviour: it navigates to the same page in that language,
  writes `localStorage["varde.lang"]`, drops `page` from the query and announces
  `status.langChanged`. The rows come from one `LANGUAGES` list in `src/i18n/`, so a later
  language is a list entry plus its strings and its URL prefix. Each language name carries its
  own `lang` attribute (`lang="nb"` on "Norsk", `lang="en"` on "English") so a screen reader
  pronounces it right.
- **Theme picker.** The same picker shell with three button rows: "Lyst", "Mørkt",
  "System". The trigger shows the active choice, and for System also the resolved theme
  ("System (mørkt)"). Semantics follow `theme-toggle.js`: Lyst and Mørkt write
  `localStorage["theme"]`; System removes the key, applies `prefers-color-scheme` and follows
  the OS live while it stays on System. Like `theme-toggle.js`, it also listens for `storage`
  events, so a second open tab follows the choice. The storage key is the one Varde already
  uses, so the inline no-flash script in `index.html` does not change, and neither does its
  CSP hash. The prerendered HTML cannot know the reader's theme, so the trigger renders the
  plain name "Tema" / "Theme" and fills in the value after mount, as `ThemeToggle` does today.
  That avoids a hydration mismatch.
- **Names and state for both pickers.** The trigger's accessible name holds the setting and
  its value: "Språk: Norsk", "Tema: System (mørkt)". The list is a `role="group"` labelled by
  the setting name. Language rows mark the current one with `aria-current="page"`; theme rows
  are buttons with `aria-pressed`. The current row also shows a check mark, so it is never
  marked by colour alone. After a choice, focus returns to the trigger, whose name now carries
  the new value; that is the audible result of a theme change.
- **Picker behaviour,** ported from `picker.js`: opening focuses the active row (or the first);
  opening one picker closes the other; ArrowUp and ArrowDown wrap; Home and End jump; Escape
  closes and returns focus to the trigger; a click outside, a row choice or focus leaving
  closes it; the list shifts to stay 8 px inside the viewport.
- **Why a port, not the Workbench scripts.** Workbench ships classic IIFE scripts that bind to
  the document, and Varde is React with a prerendered DOM and a CSP that hashes its one inline
  script. Loading the scripts would mean a second owner of the same DOM. So the markup and class
  names copy Workbench, the behaviour becomes a small `usePicker` hook, and `picker.css` is
  ported with Workbench tokens mapped to Varde's (`--surface-2` and friends do not exist in
  `tokens.css`). A comment names DS 3.8.0 as the source. Because the shell is a native
  `<details>` and language rows are links, the language picker works before hydration and
  without JavaScript.
- **Quick exit.** Label stays "Forlat siden" / "Leave this page", and the target stays
  `https://www.google.com` via `location.replace`, so the page does not survive the back button.
  - **Always in view.** The header is sticky from 480 px viewport height (today's rule). Below
    that the button itself is `position: fixed` in the top right corner.
  - **Shift three times.** A document-level listener, mounted once in `App`, counts Shift key
    releases. Any other key pressed in between resets the count (Ctrl and Alt included), so
    typing capitals or a shortcut never triggers it. Key repeat from holding Shift down counts
    once, and events during IME composition are ignored. The count also resets 5 seconds after
    the first press, so a slow third press does nothing. It fires inside inputs too, as on
    GOV.UK.
  - **Explainer line.** One line on the landing page, in the trust line (see Landing):
    "Trykk Shift tre ganger for å forlate siden raskt." / "Press Shift three times to leave
    quickly."
- **Phone (375 px).** The nav links move to a second row. The pickers show their icon only
  (the name stays as visually hidden text). Every control is 44 px tall either way.
- **The header row rule.** Every control in a header row is 44 px tall and shares one bottom
  edge. A Playwright check measures it at 375, 1280 and 1920.
- **The sticky header never hides focus.** `html` gets `scroll-padding-top` equal to the
  header height, so an element reached by Tab never ends up under the sticky header
  (WCAG 2.4.11, house bar 2.4.12).
- **320 px.** At 320 px width the header, like every page in this spec, reflows without
  horizontal scrolling.

### Landing (items 2, 3, 9, 16, 17)

Order from top: acute strip (unchanged), header, hero, chips, then emergency and helplines side
by side, then the trust line, then the footer.

- **Hero spacing (16).** The h1 gets line-height 1.1 (today `text-6xl` forces 1.0 and the lines
  touch) and `text-wrap: balance`. The strings keep the last three words together with
  non-breaking spaces, so the line breaks at the comma and no word stands alone:
  "Finn riktig hjelp, der du bor." and "Find the right help, where you live." The hero padding
  shrinks; the exact values are whatever passes the 950 px check.
- **Chips (3).** Nødtjenester first, as its own chip in accent colour on a row of its own. The
  other eight in an equal grid below: 2 columns under 768 px, 4 from 768 px. All chips in the
  grid share one width.
- **Emergency intro (2).** `landing.emergencyIntro` becomes "Ved akutt fare, ring:" / "In an
  emergency, call:". The four emergency buttons become a 2 x 2 grid in their half.
- **Noen å snakke med (9).** Heading "Noen å snakke med" / "Someone to talk to", a short
  subtitle, and five entries in this order: ids 1 (Hjelpetelefonen), 2 (Kirkens SOS),
  121 (Kors på halsen), 9 (Arbeidslivstelefonen), 122 (Sidetmedord).
  - The ids live in `src/services/helplines.ts` as `HELPLINE_IDS`, with a
    `pickHelplines(resources)` that returns them in that order and throws when one is missing.
  - Prerender calls it on the exported JSON and passes the five rows as landing page data, so
    a vanished id fails the build. A unit test covers the order and the throw.
  - Each entry shows the name (linking to its detail page) and a call button with the number
    from the data. An entry without a phone (Sidetmedord today) shows a link to its `chatUrl`
    instead, labelled "Chat". That link renders only when the URL starts with `https://`;
    otherwise the entry shows its name alone.
  - Visible labels stay short ("Ring 116 123", "Chat"), but each accessible name includes the
    service ("Ring Hjelpetelefonen, 116 123"). Two of the five share 116 123 today, so a list
    of links read out of context must still tell them apart.
  - The subtitle says only what every listed service's own source confirms. The sketch said
    "Gratis og anonymt."; the plan checks the five sources before that string is written, and
    drops "Gratis" if any one of them costs a normal call.
- **Two columns (amended 2026-10-02, while writing the plan).** Measured live at 1280 x 950,
  the stacked landing page is 1175 px, and the content this spec adds sums to about 1075 px
  with every padding at zero, so a stacked layout cannot fit 950 px. From 1024 px the landing
  page therefore has two columns: hero, search and chips on the left; emergency numbers and
  helplines on the right (emergency first). The hero is left-aligned there. Trust line and
  footer run full width below. Under 1024 px everything stacks: hero, emergency, helplines.
- **Trust line (17).** The three trust paragraphs become one muted line:
  "Ingen sporing · Hvert nummer kopiert fra kilden · Sjekkes hvert halvår", followed by the
  quick exit explainer. Next to it sits the install hint (see Install). The visually hidden
  "Derfor kan du stole på Varde" heading stays.
- **Fit (17).** The landing page, footer included, is at most 950 px tall at 1280 x 950 and
  1920 x 950, in both themes and both languages. This is measured with the final header and
  footer, which is why the landing PR comes after both. The fit applies at default zoom only;
  at 200 % text the page scrolls, and that is correct.
- **Targets.** Every new interactive element in this spec (chips, helpline buttons, the
  install hint's `<summary>`, footer links, picker rows, the back arrow) is at least 44 x 44 px.

### Cards and hover (items 4, 5)

- **Slots (4).** The result grid (`ListPage`, `KommunePage`) defines no rows of its own. Each
  card spans eight rows and uses `grid-template-rows: subgrid`, one row per slot: title,
  badges, kommune, fallback note, description, hours, actions, last verified. A slot a card
  does not use still renders as an empty element, so the slots below it stay in line. The
  gap inside a card and the gap between cards are set separately. At 1280 the call button sits
  at the same height in every card of a row (today it ranges from 295 to 414 px).
- **Hover (5).** Cards, chips and buttons lift 2 px with a soft shadow over 150 ms, only under
  `(hover: hover) and (prefers-reduced-motion: no-preference)`. Under reduced motion there is
  no movement; the border colour change alone marks hover. Focus styles are unchanged.

### Om Varde and liability (A3)

- **Route.** A new route kind `about` at `/om` (and `/en/om`, matching how `/sok` works today),
  lazy-loaded, prerendered in both languages, in the sitemap, with its own title and
  description.
- **Footer, on every route.** Line one is the liability line: "Varde er en oversikt, ikke en
  nødtjeneste. Ved fare for liv, ring 113." / "Varde is a directory, not an emergency service.
  If a life is in danger, call 113." The number is a `tel:` link. Line two holds the links "Om
  Varde og ansvar" / "About Varde and liability", "Meld feil" / "Report an error", "Kildekode på
  GitHub", and "Ingen sporing. Ingen informasjonskapsler."
- **Meld feil.** The footer link goes to `/om#meld-feil`, not straight to `mailto:`. On a
  device with no mail app a bare `mailto:` link does nothing, and the reader never learns why.
  The About section shows the address as plain text, so it can be copied, next to a `mailto:`
  link with the subject "Varde: feil" / "Varde: error". `REPORT_ADDRESS` in
  `services/contactActions.ts` changes to the new alias, so the existing "Meld feil i
  oppføringen" link on detail pages uses it too. PR 2 cannot merge until I have created the
  alias and the address is in the code.
- **Page text, first draft.** Written in my voice. Norwegian below; English mirrors it.

  > **Hva Varde er**
  > Varde er en oversikt over hjelpetjenester i Norge: hvem du kan ringe, hvor de holder til og
  > når de har åpent. Varde er gratis, og jeg har laget den på fritiden.
  >
  > **Hva Varde ikke er**
  > Varde er ikke en nødtjeneste. Ingen følger med på det du gjør her, og ingen kan sende hjelp
  > ut fra denne siden. Ved fare for liv, ring 113. Brann 110, politi 112, legevakt 116 117.
  > Varde gir ikke medisinske, juridiske eller økonomiske råd, og er ikke tilknyttet NAV,
  > Helsenorge eller tjenestene som står oppført.
  >
  > **Hvor opplysningene kommer fra**
  > Hvert telefonnummer, hver adresse og hver åpningstid er kopiert fra tjenestens egen side
  > eller fra et offentlig register. Ingenting er gjettet eller funnet på. Hver oppføring viser
  > kilden og datoen den sist ble bekreftet. Tjenester endrer seg: ring tjenesten for å
  > bekrefte før du drar dit.
  >
  > **Ansvar**
  > Jeg gjør mitt beste for at alt stemmer, men jeg kan ikke garantere at opplysningene er
  > riktige, fullstendige eller oppdaterte til enhver tid. Varde gis som den er. Så langt loven
  > tillater det, er jeg ikke ansvarlig for tap eller skade som følger av at noen bruker eller
  > stoler på opplysningene her.
  >
  > **Meld feil**
  > Ser du noe som er feil? Send en e-post til {address}. Skriv hvilken tjeneste det gjelder
  > og hva som er feil, så retter jeg det.
  >
  > **Personvern**
  > Varde er laget og drives av Malin Fossum, som er ansvarlig for opplysningene nedenfor.
  > Ingen sporing, ingen informasjonskapsler og ingen kontoer. Valget ditt av språk og tema
  > lagres bare i nettleseren din. Varde ligger hos Cloudflare, som ser IP-adressen din slik
  > alle nettsider gjør, men jeg samler ikke inn statistikk og ser ikke hvem som besøker siden.
  > Sender du meg en e-post om en feil, ser jeg e-postadressen din. Jeg bruker den bare til å
  > rette feilen og svare deg, deler den aldri, og sletter e-posten når saken er ferdig.
  >
  > **Kildekode**
  > Varde er åpen kildekode (MIT-lisens) på GitHub.
  >
  > Teksten ble sist endret {date}.

- **Why this shape.** A disclaimer alone does not protect against gross negligence under
  Norwegian law. What protects most is visible care: a source and a verified date on every
  entry, tested emergency numbers, a plain statement of what Varde is not, and an easy way to
  report errors. The page says all four. It does not promise response times or accuracy.

### Install (items P, A4)

- **Manifest.** `web/public/manifest.webmanifest`: name and short_name "Varde", `lang` "nb",
  `start_url` "/", `scope` "/", `display` "standalone", `background_color` and `theme_color`
  from the light `ground` token, and the four icons sub-project D shipped (`icon-192.png` and
  `icon-512.png` as `any`, `icon-maskable-192.png` and `icon-maskable-512.png` as `maskable`).
  `index.html` links it and adds a `theme-color` meta per colour scheme. The CSP's
  `default-src 'self'` already covers `manifest-src`. The Search Console meta tag on
  `index.html` line 7 stays where it is.
- **Install hint.** A native `<details>` next to the trust line: "Legg Varde på hjemskjermen:
  slik gjør du" / "Add Varde to your home screen: how". Inside, three short steps: iPhone and
  iPad (Safari), Android (Chrome), and computer (Chrome or Edge). The menu labels in each step
  are copied from Apple's and Google's current help pages in the plan, not written from memory.
  The hint is hidden under `(display-mode: standalone)`. Opening it may push the page past
  950 px; that is the reader's choice, and the fit check runs with it closed.
- **Back arrow (A4).** A 44 px button left of the brand with a ← icon and the visually hidden
  name "Tilbake" / "Back". It calls `history.back()` when there is an earlier entry in this
  window (`history.length > 1`) and goes to `/` otherwise, so an app opened straight onto a
  detail page still has a way out. CSS shows it only under
  `(display-mode: standalone)` and hides it on the landing page, so the prerendered HTML is the
  same for everyone and nothing changes at hydration.

## Testing and verification

Every PR keeps Biome, the vitest suite and the build green. New views get an axe check.

**Every new check is shown red once.** Before a Playwright or unit check is trusted, the PR
proves it fails on a deliberate break (extra padding for the fit check, one card's slot
removed, a missing helpline id, a 40 px control in the header row), the same way #48 proved
its mutations. The PR description lists each break and its red result.

**No `style` attribute in prerendered HTML.** The CSP's `style-src` allows only hashed inline
styles, so a `style="..."` in the static HTML is silently dropped. Inline styles are set from
JavaScript after mount (the picker's edge shift does this), never in rendered markup. The
prerender test fails on a `style=` attribute in a page.

| Item | Unit test (vitest) | Real browser (Playwright) | Manual, before merge |
|---|---|---|---|
| 2 Emergency intro | Both languages render the new line | | |
| 3 Chips | Nødtjenester first and apart, 8 in the grid | 2 columns at 375, 4 at 1280 | |
| 4 Card slots | | Call button at the same height across a row | |
| 5 Hover | | Lift on hover, no transform with reduced motion | Feels subtle to me |
| 7 Quick exit | Shift x3 leaves, also in inputs; other keys and a slow third press don't | Still in view after scrolling | |
| 9 Helplines | Order, throw on a missing id, numbers from the data | | |
| P Install | Manifest valid, icons exist, maskable present | | Install on my Android phone |
| A1 NAV | Official URLs, labelled as external | | |
| A2 Pickers | Arrows wrap, Escape returns focus, System follows the OS | | |
| A3 Om Varde | Footer line on every route, About in both languages and in the sitemap | | I read the text |
| A4 Back arrow | Shown only in installed mode, not on landing | | Checked in the installed app |
| 16 Hero | | Line height 1.1, two lines, last three words together (nb and en) | |
| 17 One screen | | Landing incl. footer at most 950 px tall at 1280 and 1920 | |
| Header rule | | Every control in a header row is 44 px with one bottom edge | |
| Focus not hidden | | Tabbing through the landing page, no focused element sits under the sticky header | |
| Reflow | | No horizontal scroll at 320 px on landing, list, detail and About | |
| Forced colours | | Focus ring and the current picker row stay visible with `forcedColors: "active"` | |
| Everything | axe on new views, Biome, prerender test (incl. no `style=`) | Same checks in light and dark | Screenshots at 375 and 1920 x 950, both themes; NVDA pass over header, pickers and helplines |

- **Playwright harness.** `@playwright/test` as a dev dependency in `web/`, Chromium only.
  Config in `web/playwright.config.ts`, specs in `web/e2e/`. Playwright has no telemetry to
  switch off. The version is pinned exactly in `package.json`, and the plan reads its licence
  from the installed package before the PR (Apache-2.0 expected; confirm). The tests run against `vite preview` of a full build, so they see the real
  prerendered pages.
- **Data for the browser tests.** A full build needs `public/data/`, which is gitignored and
  normally comes from the API. The layout checks need no live data, so the harness commits a
  snapshot of the export to `web/e2e/fixtures/data/`, made with `npm run data` against my local
  seeded API. The snapshot is real seed data, never hand-written. CI copies it into
  `public/data/` before the build. It only needs refreshing when a layout test depends on data
  the snapshot lacks.
- **CI.** A new job `web-e2e` in `.github/workflows/ci.yml` on every pull request: `npm ci`,
  copy the snapshot, `npm run build`, `npx playwright install --with-deps chromium`,
  `npx playwright test`. It uses only the first-party actions the workflow already uses, under
  the workflow's existing read-only `permissions:`. Once it runs green I add it as a required
  check in branch protection.
  Cost: about 150 MB of Chromium and about a minute per run.

## Rollout

Six PRs, each small enough to review in one sitting and revert on its own.

| # | Branch | Contents | Why here |
|---|---|---|---|
| 1 | `test/playwright-harness` | Playwright, the data snapshot, the CI job, one smoke test | The later PRs need it to prove themselves |
| 2 | `feat/om-varde` | A3: About page, footer lines, Meld feil with the new alias | People are already sharing the site |
| 3 | `feat/header` | 8, A1, A2, 7: links, pickers, quick exit with Shift x3 | Header height is part of the 950 px budget |
| 4 | `feat/landing-fit` | 2, 3, 9, 16, 17: hero, chips, helplines, trust line, 950 px check | Measured with the final header and footer |
| 5 | `feat/card-slots` | 4, 5: subgrid slots and hover | |
| 6 | `feat/install` | P, A4: manifest, install hint, back arrow | I test the install on my phone |

Each PR adds its own Playwright checks from the table above. Each merges only with CI green
and after my review. After each merge I check the live site on `varde.pages.dev`.

## Open items before or during the build

- **The new "Meld feil" alias.** I create it in Proton. PR 2 waits for the address.
- **The current report address is already public.** `REPORT_ADDRESS` today is the existing
  Varde alias, shown on every detail page since static-first. If that is the alias tied to my
  deploy accounts, it has already been visible to scrapers, so I may want to watch it for
  phishing once the new alias replaces it.
- **The About text** is a first draft. I review it in this spec; the lawyer's check comes when
  the whole project is finalised.
- **"Ingen sporing" must stay true.** Before PR 2 merges, I confirm in the Cloudflare dashboard
  that Web Analytics is off for the Pages project, since the About page now names Cloudflare.

## Considered and rejected

- **Sticky Keys can trigger the quick exit.** A Windows Sticky Keys user who presses Shift
  twice to lock it and once to release it leaves the page. GOV.UK ships the same pattern with
  the same risk; the cost is one reload of Varde, with no data lost, and the explainer line
  says what Shift does. Kept as is.
- **A setting to turn the Shift shortcut off.** WCAG 2.1.4 covers single character keys, not
  a modifier, and a setting would need storage and UI for a rare case. Not added.
- **Loading the Workbench scripts directly.** Rejected in the Header section: two owners of
  one DOM, and the CSP hashes Varde's only inline script.
- **Sanitising every data URL on the detail page.** The new helpline link gets an `https://`
  check; the detail page's existing website and chat links render seed data as before.
  Hardening them is outside A and goes to E, where data from outside sources first arrives.
- **Pinning first-party actions to SHAs.** The workflow pins `actions/*` by tag today; the new
  job follows that and adds no third-party action.

> Stress-tested 2026-10-02 (skill 81b73ff): 19 applied, 1 adapted, 1 decided by me.
