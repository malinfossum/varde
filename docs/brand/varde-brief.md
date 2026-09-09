# Varde — brand brief

One page for Claude Design. I'm the sole developer and designer here, and I built the "Paper"
brand tokens and type pairing myself for the 2026-09 redesign — this brief hands them to you
along with the parts I haven't built: the mark and the pack around it.

## The name and the story

*Varde* is Norwegian for a cairn — a stack of stones people build on mountain routes so the
next hiker can find the way when the weather closes in. That's the whole idea of this app: a
directory of Norwegian social services, so someone can find the right help even when they
can't see clearly. I mean that literally for the person searching (crisis narrows your focus)
and structurally for the service itself (contact details that don't go stale like the ones a
cairn survives every winter). The mark should read as a way-marker, not a logo for a company.

## Who's looking at it

Two people, and the design already has to serve both:

- **Someone in a crisis, on a phone.** They need a number they can trust in seconds. No
  patience for cleverness, no tolerance for anything that reads as corporate distance.
- **A social worker at a desk.** They open Varde daily, know it well, and want it to work
  like a proper tool — a filter bar, a grid that scans, a system that doesn't get in the way
  once you know it.

Design for the first person's worst day without boring the second person's every day.

## Tone

Calm, professional, public-service. Never alarmist — even the emergency section states the
numbers and says "call whichever fits, but call," rather than raising the temperature. No
jokes, no cuteness, no startup voice. Think a well-run public library's signage, not a
hotline ad.

## Tokens (locked — light and dark)

These are already built and shipped in `web/src/styles/tokens.css`, checked by an automated
contrast test. Treat them as fixed inputs, not a starting point to riff on.

| Token | Light | Dark | Use |
|---|---|---|---|
| ground | `#f6f2ea` | `#0b0d10` | page background |
| surface | `#ffffff` | `#13161a` | cards, inputs, header |
| border | `#d9d2c6` | `#2a2f36` | hairlines |
| text | `#1d1b17` | `#f3efe7` | body |
| muted | `#5f5a52` | `#b3b0a8` | secondary text, eyebrows |
| accent | `#285f45` | `#7fc39e` | buttons, links, active chips |
| on-accent | `#f6f2ea` | `#0b0d10` | text on accent fills |
| akutt | `#b3361f` | `#ff8a7a` | emergency badge and strip |

Light is the default and the primary theme — the daily user is at a desk in daylight, and the
person in crisis gets the same calm page. Dark is a mirror, not an afterthought, and switches
automatically with the OS unless someone picks explicitly.

## Type

**Fraunces**, weight 600, for the two largest headings only (h1 and h2) — a serif with enough
warmth to keep "public service" from reading as "government form." **Figtree**, weights 400
and 600, for everything else: body text, labels, buttons, badges. Both are self-hosted static
Latin woff2 files (not the variable builds — too heavy for the critical path), so anything the
pack adds should assume no other typefaces are loaded and no third-party font requests.

## The mark

A stacked-stones cairn: three or four rounded forms stacked with a slight organic offset, not
a perfect pyramid — it should look built by hand, the way a real varde is. One colour, applied
through `currentColor` so it inherits `text` or `accent` from whatever surface it sits on —
never a fixed fill. It has to hold up at three sizes: a 16 px favicon, a 32 px header mark, and
128 px for a social card or app icon, which means the stones need to stay legible as distinct
shapes even when the smallest one is a handful of pixels. The current placeholder
(`web/src/components/BrandMark.tsx`) is three rounded bars — good enough to ship, not the real
mark. I'd rather see something with real weight and a bit of asymmetry than something that
reads as a generic "stack of pancakes" icon.

## Deliverables

- The mark as a single SVG, `currentColor` fill, clean at 16, 32 and 128 px.
- A favicon set built from it.
- A 1280×640 social card (for link previews).
- A 1280×320 README banner.
- A short guidelines page: clear space, minimum size, the one thing not to do to the mark
  (don't recolor it per-service, don't add a gradient, don't put it on a busy photo).

## Constraints

- No gradients on interactive controls — the hero's two soft radial colour blooms behind the
  headline are the one place decoration is allowed, and even those are CSS, not images.
- One accent family. `accent` carries all the "this is interactive or important" meaning;
  don't introduce a second brand colour that competes with it.
- The contrast floors are load-bearing, not a suggestion: text on ground ≥ 7:1, muted on
  ground ≥ 4.5:1, accent as text on ground ≥ 4.5:1, on-accent on accent ≥ 4.5:1, akutt as text
  on ground ≥ 4.5:1, border against ground ≥ 1.3:1. Anything the pack adds that sits on these
  backgrounds needs to clear the same bars — a mark drawn only in `accent` on `ground`, for
  instance, already does.
- No colour carries meaning alone anywhere in the app (the akutt badge always has the word
  next to it, the active chip always has a checkmark) — keep that principle if the pack adds
  any status or category colouring later.
