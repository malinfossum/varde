# Varde brand guidelines

The mark is a varde on a mountain top. A varde is the cairn people build on Norwegian mountain
routes so the next person finds the way when the weather closes in. That is what this service
is for.

## The two forms

- **Ring mark.** The ring around the mountain and the cairn, with two fjord lines at the base.
  Use it on its own: the favicon, the site header, next to the name.
- **Scene.** The mountain and the cairn without the ring. Use it only inside an app-icon tile,
  because the tile is already the frame.

## The stones

Three stones, even in size but cut by hand: flat bases, ends chopped at angles with small
facets. Life is not a dance on roses, so the stones are not polished. Never round them, never
add a fourth (four blur into a tree at small sizes), never make them symmetric.

## Colour

One colour, the accent token: `#285f45` on light paper, `#7fc39e` on dark. On the web it
inherits `currentColor`. The banner adds two flat tints of the accent mixed into the paper (25 %
and 50 %). No gradients, no second brand colour.

## Clear space and size

- Keep clear space of at least a quarter of the ring's diameter on every side.
- Smallest ring mark: 16 px. Smallest app icon: 48 px.

## Don't

- Recolour it per service or per page.
- Add gradients, shadows or outlines.
- Put it on a busy photo.
- Stretch, rotate or redraw it. Change `web/scripts/brand-geometry.mjs` and run `npm run brand`.

## Name and licence

The code is MIT. The Varde name and mark are not: all rights reserved (see `LICENSE`). A
service people trust in a crisis should not be easy to copy. The code that draws the mark is
MIT as code, but the design it draws is not licensed.

Name check in Patentstyret, classes 35, 44 and 45, on 2026-10-01: the word is registered by
others for other kinds of services. Varde is free and non-commercial, so I keep the name and do
not register it as a trademark.

## Files

Masters in `docs/brand/src/`, built by `npm run brand` (run from `web/`). The pack table is in
the brand spec, `docs/superpowers/specs/2026-10-01-varde-brand-design.md`.
