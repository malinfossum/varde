# Verification: seed-data-audit-follow-ups.md

**Status: CHECK DONE, 10.11.2026 (Tuesday).** Independent check of the row 17 Website change and
the row 225 description change in `docs/seed-data-audit-follow-ups.md`, and of the uncommitted
seed, snapshot and migration that carry them. It feeds my verification gate; no seed or code
reads it.

I fetched every cited page fresh at 11:11 with curl (`-sSL -A "Mozilla/5.0"`) and stripped tags
locally with Python (script, style and comments removed, HTML unescaped, whitespace collapsed).
I pulled every double-quoted string out of the doc with a script and searched the stripped pages
for each one, exact match first. All three page URLs returned HTTP 200 and none needed the
browser pane. Values in the doc, `SeedData.cs`, the model snapshot and the migration were
compared by script, character for character. I did no replacement research and changed no value.
Five checks:

1. Every double-quoted string the doc attributes to a page is on that page, word for word.
2. Row 17: the department index links to the new Website URL, the new URL returns HTTP 200, and
   that page is Housing First's own page. The seed's Website for row 17 equals the doc's New
   value.
3. Row 225: the nb and en descriptions claim nothing the Prindsen page does not say, and the en
   text says the same as the nb text. The doc table and `SeedData.cs` (translations 137 and 138)
   are identical. The old cited URL in `docs/seed-data-oslo.md` redirects to the doc's Source
   URL. I also looked for any sentence about referral (henvisning) on the page.
4. The migration changes exactly these three values and nothing else. LastVerified is not touched
   anywhere in the diff.
5. No private person's name and no personal staff phone number appears in the doc.

Verdicts: `CONFIRMED`, `MISMATCH`, `UNREACHABLE`, `QUESTION`.

## Verdict table

| # | Item | Verdict | Detail |
|---|------|---------|--------|
| 1 | Quotes | CONFIRMED | 13 quoted strings. 9 are page quotes and all are on the cited page. One needs a whitespace note (below). The other 4 are not page quotes: "Housing First" twice (link text and heading, both found), the old description "Du trenger ikke henvisning for å komme." (found in the committed seed) and the seed hours "Hverdager 09:00–15:00" (found on row 17's nb translation, Id 33). |
| 2 | Row 17 Website | CONFIRMED | The index menu has an `<a>` with link text "Housing First" and href `https://lillehammer.kommune.no:443/helse-og-velferd/psykisk-helse-og-rus/housing-first/`. The doc's value is that href with `:443` left out, as the doc says. The new URL returns 200 with no redirect. Its `<h1>` is "Housing First" and its body is about this team only. Seed, snapshot and migration all hold the doc's New value exactly. |
| 3 | Row 225 description | CONFIRMED | Every claim is on the page (list below). en says the same as nb. Doc table, `SeedData.cs` and the snapshot are identical for Id 137 (nb, 322 characters) and Id 138 (en, 420 characters). The old URL answers 301 to `www.oslo.kommune.no:443/...rusomsorg/...`, then 301 to the doc's Source URL, then 200; both downloads are byte-identical. The page has no "henvis" anywhere in its raw HTML, so no referral sentence at all. |
| 4 | Migration scope | CONFIRMED | `Up` has exactly three `UpdateData` calls: ResourceTranslations 137 Description, ResourceTranslations 138 Description, Resources 17 Website. Each value equals the doc. `Down` has the same three and restores the committed values exactly. No other `migrationBuilder` operation. The snapshot diff is three one-line changes. The Designer file matches the snapshot apart from the usual class header. The only "LastVerified" in the diff is a comment line ("so LastVerified does not move"); no date, `Verified` or `UpdatedAt` value changes. |
| 5 | Private data | CONFIRMED | The doc names no person and holds no email address. The only phone number in it is 23 04 05 00, the psykososial akuttjeneste line, inside a page quote. The Housing First page prints a team leader's name, mobile and email, and the Prindsen page prints four staff names with emails and a bydel vakttelefon. None of these is in the doc. "teamleder" appears only as a role inside a quote. |

## Check 1: whitespace note

- "... ringe psykososial akuttjeneste på telefon 23 04 05 00." My exact match failed. In the raw
  HTML the number is a `tel:` link followed straight by the full stop
  (`<a href="tel:23040500">23 04 05 00</a>.`). The tag strip turned that into "23 04 05 00 .".
  With the space before the full stop removed the sentence matches word for word. This is a strip
  artefact, not a mismatch.
- Two quotes wrap across lines in the doc ("helse-\nog" in the Prindsen badge quote, and the line
  break inside the Housing First opening sentence). Read with the line break as one space, both
  match exactly.

## Row 225: claim by claim

Each claim in the nb description, with its support on the Prindsen page.

- Lavterskeltilbud with health and social services: "Prindsen mottakssenter er et helse- og
  sosialfaglig lavterskeltilbud". Found.
- For people with rusutfordringer: the page says "personer over 18 år med alvorlige og langvarige
  rusproblemer". Supported, though the seed's wording is wider (see Notes).
- Brukerrom: "Brukerrom for rusinntak i trygge og hygieniske omgivelser". Found.
- Feltpleie: listed under Tjenester. Found.
- Lege: services are given by "sosialarbeidere, sykepleiere, erfaringskonsulent og lege". Found.
- Akutt overnatting: "Akuttovernatting for alle kjønn". Found.
- Feltpleien has free drop-in health services: "Feltpleie med gratis drop-in helsetjenester".
  Found.
- An akuttplass needs a vedtak: the page tells you how to get a "vedtak om akuttplass". It does
  not say "you need a vedtak" in those words, but both routes it gives are for getting one. I
  count that as support.
- Weekdays 09:00–15:00, contact your bydel: "For vedtak om akuttplass mandag–fredag kl.
  09:00–15:00, ta kontakt med din bydel." Found. The seed says "hverdager" where the page says
  "mandag–fredag" (see Notes).
- Otherwise Oslo legevakt or psykososial akuttjeneste: "etter kl. 15:00 frem til kl. 09:00 samt
  helg, fri- og helligdager hele døgnet, kan du møte opp på Oslo legevakt ... eller ringe
  psykososial akuttjeneste". Found.
- The removed sentence: no "henvis" on the page, so nothing supported "Du trenger ikke henvisning
  for å komme". The doc is right to drop it.
- The page says nothing on how to get into the brukerrom (no vedtak, referral or application
  sentence next to it), which matches the doc.

The en text carries the same statements in the same order. Two small differences, both faithful:
en says "a formal decision (vedtak)" where nb says "et vedtak" (the same gloss I accepted for row
17), and en drops "kl." before the hours.

## Notes outside the checks

- The first sentence of both descriptions is unchanged from the old text. It says "for deg med
  rusutfordringer", while the page narrows the group to people over 18 with serious and
  long-term problems. Not a claim the page contradicts, so I did not count it, but the age limit
  is missing.
- "hverdager" is a fair reading of "mandag–fredag" here: the page sends fri- and helligdager to
  legevakt, so a holiday Monday is not a bydel day either.
- The doc's own status line already says "VERIFICATION GATE CLOSED 10.11.2026". It is true once
  this file lands.
- The seed comment on row 225 calls the unseeded second number a "Nav-inntak line". The page now calls it the
  vakttelefon of Seksjon fagstøtte og inntak, for the bydel to call. Not part of this change; I
  note it for a later pass.
- Row 225's Website is still `https://www.oslo.kommune.no`, as the doc's "Noted, not changed"
  says. The badge stays (`IsLowThreshold = true`), resting on the quote above.
