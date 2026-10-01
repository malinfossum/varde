# Varde: brand (sub-project D) design

Date: 2026-10-01. Builds on the redesign spec (2026-09-08) and the static-first spec
(2026-09-15). Where this document and an earlier one disagree, this one wins. The brief in
`docs/brand/varde-brief.md` was the input; this spec replaces its "The mark" and
"Deliverables" sections, and PR 2 rewrites the brief to match.

## Purpose

The current mark is three gold rounded bars tapering on black. At favicon size it reads as
the poop emoji, so people link the site to the wrong thing before they read a word. Varde
needs a mark that tells its story at a glance, and a pack around it: favicons, app icons, a
link preview card, README banners and a GitHub social preview.

This runs ahead of sub-project A (UI polish and install hint) on purpose. A's web manifest
would bake whatever icon exists into people's home screens, so the icon has to be right first.
The manifest itself stays in A; this sub-project only ships the icon files it will point to.

## Decisions locked in the brainstorm (2026-09-30 and 2026-10-01)

- **Concept: a varde on top of a mountain.** The cairn is the way-marker; the mountain is
  where you need one. Fjord lines at the base place it in Norway.
- **Stones are even but hand-cut.** A flat base, ends chopped at angles with small facets. Not
  rounded pills, not symmetric octagons (those read as a pagoda or a Christmas tree), not
  uneven rubble. The story line for the guidelines: life is not a dance on roses, so the
  stones are cut by hand, not polished.
- **Three stones.** Four blur into a tree at 32 and 16 px.
- **The chosen variant is C1:** stone gaps 0.7, stones at 87.1 % size, mountain at 115 %,
  stack top held where variant C had it. The mountain never touches the fjord lines (0 sky
  pixels above the top line, measured).
- **Two forms of the mark.** The ring medallion (ring around a clipped scene, the mountain
  fused into the ring) is the favicon and header mark. The scene without the ring is the app
  icon, because the icon tile is already the frame.
- **The banner is a layered-range landscape.** Three flat accent tints, no gradients, the
  varde on the front summit, a full-width water band with the two fjord knockouts.
- **Favicon option A.** One SVG favicon, the ring mark, light and dark through a media query.
  An SVG favicon cannot switch drawings by size, so there is no separate 16 px drawing.
- **Hard condition: the mark must not read as a penis** (or as poop). Verified by a
  fresh-eyes silhouette check, below.
- **`@resvg/resvg-js` is approved as a devDependency**, installed only once the plan is
  approved.

## Colours

All colours come from `web/src/styles/tokens.css` at build time. No new brand colour.

| Role | Light | Dark |
|---|---|---|
| Mark ink (`accent`) | `#285f45` | `#7fc39e` |
| Paper (`ground`) | `#f6f2ea` | `#0b0d10` |
| Text in banners (`text`) | `#1d1b17` | `#f3efe7` |
| Eyebrow in banners (`muted`) | `#5f5a52` | `#b3b0a8` |
| Banner back range (tint 1) | `#c3cdc1` | `#283b34` |
| Banner middle range (tint 2) | `#8fa998` | `#456857` |

The two tints are background fills only, like the `-soft` tokens, and are not text.

## The pack

| File | Size | Drawing | Where it lives |
|---|---|---|---|
| `favicon.svg` | vector | Ring mark in accent; dark accent under `prefers-color-scheme: dark` | `web/public` |
| `favicon.ico` | 32×32 | Medallion: paper disc, light accent ring mark | `web/public` |
| `apple-touch-icon.png` | 180×180 | Accent plate, scene in paper, no ring (iOS rounds the corners) | `web/public` |
| `icon-192.png`, `icon-512.png` | 192, 512 | Medallion: paper disc, accent ring and scene, transparent outside the disc (manifest `purpose: any`) | `web/public` |
| `icon-maskable-192.png`, `icon-maskable-512.png` | 192, 512 | Full-bleed accent plate, scene in paper, fitted inside the 40 % safe circle (manifest `purpose: maskable`) | `web/public` |
| `og.png` | 1200×630 | Light banner recomposed for 1.91:1 | `web/public` |
| `banner-light.png`, `banner-dark.png` | 1280×320 | The layered-range banner | `docs/brand` |
| `social-preview.png` | 1280×640 | Light banner recomposed for 2:1 | `docs/brand` (I upload it by hand) |
| `src/*.svg` | vector | The master SVG behind every file above | `docs/brand/src` |

Why the `.ico` is a medallion: an `.ico` cannot carry a dark-mode variant, and the light
accent on a dark browser tab falls under 3:1. The paper disc gives the mark its own ground on
any tab. The same reason makes `icon-192/512` medallions: launchers put `any` icons on
unknown backgrounds.

**`og.png` and `social-preview.png` layout rules.** They reuse the banner's parts at a taller
ratio: the three ranges, the front summit with the varde, the water band, and the text block
(ring mark, "Varde" in Fraunces 600, eyebrow "HJELPETJENESTER I NORGE" in Figtree 600,
tagline "Finn riktig hjelp, der du bor." in Fraunces 600). The text block sits left with at
least 64 px of margin; the landscape fills the right side and the bottom. All text stays
inside the centre 90 % so a platform crop never cuts a letter. The exact positions are set
while building and approved by me on the contact sheet (see Verification) before PR 1 opens.

**One card, Norwegian text.** Both language versions of every page share `og.png`. The
service is Norwegian and the name is the same in both languages, so one card is enough.

## Geometry

The C1 geometry is the single source of truth for every drawing. `marks9.html` (gitignored
brainstorm file) is where it was found; the numbers are copied here so the spec stands alone.
All coordinates are in a 32×32 viewBox.

**One stone** of width `w` between `yT` and `yB`, centred on `cx`: the polygon through these
points, as fractions of `(w, h)` from the top-left corner `(cx - w/2, yT)`:
`[[.05,1],[0,.5],[.1,.04],[.55,0],[.74,.08],[.9,.2],[1,.62],[.95,1]]`.

**The stack (C, gap 0.7).** Summit at y = 18.8. Stone heights top to bottom `4.4, 4.8, 5.2`,
widths `7.8, 11, 13`. Built from the summit upwards: the bottom stone ends 0.7 above the
summit, and each stone above sits 0.7 above the one below.

**C1 sizing.** Mountain scaled by f = 1.15 about its base line (y = 33); the stack scaled by
k = 0.871 and moved so it rests on the scaled summit. For a stone edge at `y` in the C stack,
its C1 position is `sm - k * (18.8 - y)`, where `sm = 33 - f * (33 - 18.8)`. Widths scale by k.

**Mountain** (before the f scale):
`M-4,33 L5,22.2 L7.6,23.8 L12.2,20.2 L16,18.8 L19.8,20.2 L23.2,23.6 L25.6,22.2 L36,33 Z`.

**Ring mark.** Ring: circle at (16,16), r 14.6, stroke 2.4, no fill. Scene: clipped to a
circle at (16,16) r 13.6 and drawn through `translate(16,17.2) scale(0.8) translate(-16,-16)`.
Fjord lines: knocked out of the scene by a mask, horizontal across the full width at
y = 25.9 (stroke 1.2) and y = 28.3 (stroke 1.0).

**Scene (app icons).** No ring, no clip, no fjord lines. The mountain runs from x -2 to 34 on
base line y = 31, and the whole scene is drawn through `translate(16,16.6) scale(0.72)
translate(-16,-16)`. For the maskable icons the build scales the scene down until the corners
of its bounding box sit inside the 40 % safe circle, computed from the box, not hand-tuned.

**Banner (1280×320).** Back range
`M520,320 L660,210 L720,236 L850,96 L915,150 L975,122 L1110,215 L1190,170 L1280,212 L1280,320Z`
in tint 1; middle range
`M600,320 L740,246 L790,262 L880,190 L940,222 L1070,178 L1180,250 L1230,236 L1280,262 L1280,320Z`
in tint 2; front range
`M680,320 L810,276 L860,288 L965,214 L1010,206 L1055,214 L1130,266 L1165,256 L1280,296 L1280,320Z`
in accent. The C1 stack is drawn at ×3.6 centred on x = 1010, resting on the front summit
(y = 206). Water band: accent rect y 288 to 320 across the full width, with paper knockouts at
y 296 (height 5) and y 308 (height 4). Text block at `translate(72,84)`: the ring mark at
×2.4, "Varde" at (96,58) Fraunces 600 64 px in `text`, the eyebrow at (2,132) Figtree 600 15 px
letter-spacing 1.5 in `muted`, the tagline at (0,168) Fraunces 600 30 px in `text`.

## Build

```
web/scripts/brand-geometry.mjs   pure functions: geometry above → SVG strings
web/scripts/ico.mjs              PNG bytes → .ico bytes
web/scripts/brand.mjs            npm run brand: read tokens + fonts, write every file
docs/brand/fonts/                Fraunces 600 and Figtree 600 static TTFs + OFL.txt
```

- **`brand-geometry.mjs`** holds the numbers once and exports one function per drawing (ring
  mark, scene, medallion, plate icon, banner, og card, social preview). It takes colours as
  arguments and never reads files, so tests can call it directly. Typed with a `.d.mts` next
  to it, like the other scripts.
- **`brand.mjs`** reads the colours from `tokens.css` (the same parser the contrast test
  uses), builds every master SVG into `docs/brand/src/`, renders the PNGs with resvg, writes
  `favicon.svg` and `favicon.ico`, and writes `web/src/components/brandPaths.ts` (the ring
  mark's path data for `BrandMark.tsx`). It also writes `docs/brand/src/hashes.json`: the
  SHA-256 of each master SVG at the moment its PNG was rendered. `hashes.json` is written
  last, so a run that crashes halfway leaves stale hashes and the drift test goes red.
- **`@resvg/resvg-js` is pinned to an exact version** (no caret), like `axe-core` and
  `react-aria-components` already are. Its licence (MPL-2.0, confirm at install) is fine
  because it is a devDependency and never ships. It brings its binary as per-platform optional
  packages, and npm has a known bug where a lockfile written on Windows leaves out the other
  platforms' entries. After installing I check that `package-lock.json` lists
  `@resvg/resvg-js-linux-x64-gnu`; the PR's CI test run is the proof.
- **Generated files are committed.** CI and the Cloudflare deploy never render anything and
  never need the native resvg binary. A brand change shows up in the PR as image diffs.
- **Fonts.** resvg reads TrueType and OpenType, not the `.woff2` files Fontsource ships. I
  commit the static Fraunces 600 and Figtree 600 TTFs from the official upstream repos,
  fetched at a pinned release tag, with their OFL 1.1 licence (confirmed from the repo at that
  tag) and a `SOURCE.md` recording each file's URL, tag and SHA-256, and resvg loads only those (`loadSystemFonts: false`), so every
  machine renders the same pixels. If a font file is missing the script stops with an error
  instead of rendering a fallback face. The plan's first task proves resvg renders both faces
  before anything else is built.
- **`ico.mjs`** writes a single-image ICO with the 32×32 PNG embedded: a 6-byte header, one
  16-byte directory entry, then the PNG. About 20 lines, no dependency.
- **`npm run brand -- --sheet`** also writes a contact sheet to
  `.superpowers/brand-review/sheet.html` (gitignored). It is a review tool, not a deliverable.

## Site wiring

- **`BrandMark.tsx`** draws the C1 ring mark from `brandPaths.ts` with `currentColor`, as now.
  The clip and mask ids come from React's `useId`, so two marks on one page never share an id;
  a test renders two marks and asserts each `url(#…)` reference resolves to its own element.
  It stays `aria-hidden`; the header link already carries the name.
- **`Header.tsx`**: the mark goes from `h-6 w-6` to `h-8 w-8`.
- **`index.html`** head gets the icon links only:
  `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`,
  `<link rel="icon" href="/favicon.ico" sizes="32x32">` and
  `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`. The Search Console tag on
  line 7 is not touched.
- **`prerender.mjs` `headTags`** writes every social tag next to `canonical`. Every value
  goes through the existing `escapeHtml`, because titles and descriptions come from service
  names and can hold quotes or ampersands. The tags live here, not in `index.html`, because
  the site origin is already known here, so every URL comes out absolute: `og:type` website,
  `og:site_name` Varde, `og:title`, `og:description`, `og:url` (same URL as `canonical`),
  `og:locale` (`nb_NO` or `en_US`), `og:image` (`{origin}/og.png`), `og:image:width` 1200,
  `og:image:height` 630, `og:image:alt`, and `twitter:card` summary_large_image.
  The alt text, per language: nb "Varde-logoen, en varde på en fjelltopp, og teksten Finn
  riktig hjelp, der du bor." / en "The Varde logo, a cairn on a mountain top, with the
  Norwegian tagline Finn riktig hjelp, der du bor."
- The old `favicon.svg` is replaced. `img-src 'self'` already covers our own images, and
  nothing loads from a third party.
- **One CSP change.** The favicon's dark variant needs a `<style>` block with a media query,
  and Cloudflare sends the site CSP on `favicon.svg` too, so `style-src` would block that
  block and the favicon would stay light in dark mode. The fix follows the existing pattern
  for react-aria's inline style: the favicon's exact `<style>` text is hashed into
  `style-src`, and `headers.test.ts` rebuilds that hash from `favicon.svg`, so a change to
  the favicon without a new hash goes red.

## Verification

Automated, in `web/tests/brand.test.ts`, run by `npm test` locally and in CI. The pixel checks
render the master SVGs with resvg to raw RGBA in the test itself, so no PNG decoder is needed.

| Check | Pass condition |
|---|---|
| Sizes | Every committed PNG's IHDR reports the size in the pack table |
| Contrast | Mark ink against its own plate or disc ≥ 3:1 for every variant (WCAG 1.4.11), via `contrastRatio`; `favicon.svg` light accent ≥ 3:1 against light tabs (`#ffffff`, Firefox `#f0f0f4`), dark accent ≥ 3:1 against dark tabs (Chrome `#35363a`, Firefox `#42414d`) |
| Maskable safe zone | No non-plate pixel outside a circle of radius 0.4 × size, at 192 and 512 |
| Fjord clearance | Port of `touchCheck()`: 0 sky pixels in the row just above the top fjord line, ring mark at 640 px |
| ICO | Reserved 0, type 1, one image, 32×32, and the payload starts with the PNG signature |
| No drift | Fresh output of `brand-geometry.mjs` equals the committed `docs/brand/src/*.svg`, `favicon.svg` and `brandPaths.ts` byte for byte; every hash in `hashes.json` matches its current master |
| Fonts rendered | The text-bearing masters have ink inside the "Varde" text box (a missing face would leave it blank) |
| Head tags | `prerender.test.ts`: every route's HTML has the og tags, `og:url` equals `canonical`, `og:image` is absolute; a fixture title holding `"`, `<` and `&` comes out escaped |
| Favicon CSP hash | `headers.test.ts`: the `style-src` hash equals the SHA-256 of `favicon.svg`'s `<style>` text |

**Every gate is proven able to fail.** Each pixel and contrast gate also runs once against a
known-bad input and must report a failure: the clearance check against the v6 stack (26 sky
pixels when measured), the safe-zone check against the unfitted scene, the contrast check
against the light accent on `#35363a`, the drift check against a geometry with one number
changed, and the font check against a render with no fonts loaded.

Reviewed by hand before PR 1 opens:

- **Header alignment.** Mark and wordmark share one centre line at `h-8`, measured from
  bounding boxes in the browser at 320 and 1280 px wide, light and dark. Under
  `forced-colors: active` emulation the mark stays visible (it draws in `currentColor`, which
  forced colours remap).
- **Contact sheet.** Every asset at real size: the favicon on light and dark browser tabs at
  16 and 32 px, the apple-touch and maskable icons in a home-screen mock (circle, squircle and
  square masks), the medallion on light and dark launchers, `og.png` inside a share-card
  frame, both banners. Margins and alignment are measured first; then I approve the og and
  social-preview layout here.
- **Silhouette check.** A fresh subagent that has seen nothing of this work gets only the
  512 px medallion and the 32 px ring mark as images, and is asked what each depicts and what
  else it could be mistaken for. Pass: it names a cairn, stacked stones or a mountain, and
  nothing bodily (no penis, no poop). Run once for light and once for dark. A fail stops the
  build and comes back to me with the subagent's words, never a quiet tweak.

Live, after PR 1 deploys (from outside, with `curl`):

- `og.png`, `favicon.svg`, `favicon.ico` and `apple-touch-icon.png` return 200 with the right
  content type.
- `/`, `/sok` and `/resources/12` carry the og tags with absolute URLs.
- `/favicon.svg` opened in the browser pane with dark colour-scheme emulation draws the dark
  accent and logs no CSP violation (opened as a document it runs under the same CSP it gets
  as an icon).
- A share-preview validator (opengraph.xyz, given only the public URL) renders the card.

## Rollout

1. **PR 1 `feat(brand)`: the pack and the site wiring.** Geometry module, fonts and licence,
   `npm run brand`, the ico writer, every generated file, the tests, `BrandMark.tsx`,
   `Header.tsx`, `index.html` and the `headTags` change, plus `@resvg/resvg-js` as a
   devDependency. The PR description carries the contact sheet and the silhouette verdicts.
2. **Live checks** as above.
3. **PR 2 `docs(brand)`: the words.** `docs/brand/guidelines.md` (clear space, minimum size,
   the two forms and when to use each, colours, don'ts, and the hand-cut story), the README
   banner as a light/dark `<picture>` with the alt text "Varde: hjelpetjenester i Norge. Finn
   riktig hjelp, der du bor.", and `varde-brief.md` rewritten to match what shipped.
   It also carries the licence carve-out below.
4. **I upload** `docs/brand/social-preview.png` in the repo's GitHub settings (General,
   Social preview). GitHub has no API for it.

## Name and licence

- **The mark is not MIT.** The code stays MIT. The Varde name and mark (every file in
  `docs/brand/` and the icon files in `web/public/`) are excluded: all rights reserved. One
  line says so in `LICENSE`, the README and `docs/brand/guidelines.md`. A service people
  trust in a crisis should not be easy to impersonate with a copycat that looks like it.
  The bundled fonts keep their own OFL licence, which `docs/brand/fonts/` carries.
- **Name check.** Before PR 1 merges I search "Varde" in Patentstyret's register (classes 35,
  44 and 45) and record the result and the date in `docs/brand/guidelines.md`. A conflict
  stops the rollout for a decision; it does not get worked around quietly.

## Out of scope

- The web manifest and the install hint (sub-project A).
- A separate pixel-drawn 16 px favicon (option A was chosen over it).
- Any change to colour tokens or type.
- Animated or seasonal variants of the mark.

> Stress-tested 2026-10-01 (skill 0b01b4c) — 10 applied, 1 adapted, 1 decided by me.
