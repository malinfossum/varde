# Test fixtures

Every fixture here is fictional and holds no personal data: numbers like `62 00 00 00`,
the placeholder name "Kari Nordmann", org numbers starting `99999`. Their shapes (field
names, tag names, ids and classes) were copied from live responses on 03.11.2026; no
saved live page is stored here. No fixture comes from a kommune that blocks ClaudeBot.

PR 3 adds `kontakt-heading.html`, `shared-page.html` and `test-box.html` (shapes every CMS
shares: headings, paragraphs, a box after `<main>`) and the `.xlsx` workbooks the NKLM tests
build in memory (`test/xlsxHelpers.ts`). No CMS box is recorded in `src/extract/cmsBoxes.ts`
yet, so there are no per-CMS box fixtures. All values are fictional.

Two exceptions hold real public data:

- `klass/codes-at-2026-11-03.json`: real KLASS classification 131 codes for Innlandet and
  Oslo, public reference data from SSB under CC BY 4.0.
- `kartverket/radhus.json`: one answer from Kartverket's address API for a rådhus, a public
  building, trimmed to the keys the reader uses. It shows how Kartverket writes a house
  number. Kartverket, CC BY 4.0. Recorded 09.11.2026.
