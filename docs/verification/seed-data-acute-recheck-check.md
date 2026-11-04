# Verification: seed-data-acute-recheck.md

**Status: CHECK DONE, 04.11.2026 (Wednesday).** Independent second pass over
`docs/seed-data-acute-recheck.md`, the three-month re-check of the 16 acute rows (3, 4, 5, 12, 14,
16, 19, 21, 23, 24, 25, 216, 218, 221, 222, 236). It feeds my verification gate; no seed or code
reads it.

I read every seeded value in `api/Varde.Data/Seed/SeedData.cs` (the `Resource` blocks and both
`ResourceTranslation` entries per row) and in `web/src/services/emergency.ts`, and took the source
URLs from `docs/seed-data.md`, `docs/seed-data-oslo.md` and `docs/seed-data-lavterskel-retag.md`
(the reconcile doc has no override for these rows). I fetched every cited page with `curl -sL`,
stripped the tags with a local Python script (`python -I`) and matched each quoted string after
collapsing whitespace, dropping soft hyphens and removing the space a stripped link leaves before a
comma. Every page answered HTTP 200. Three seeded URLs answer with a 301 first: the row 3 URL ends
at https://www.helsenorge.no/hjelpetilbud-i-kommunene/legevakt, the row 12 URL at
https://www.hamar.kommune.no/krisesenter/ and the row 14 URL at
https://www.hamar.kommune.no/familiehjelp-oversikt-over-tilbud/kontaktsteder-i-en-krisesituasjon/.
No page needed the browser pane. Beyond the doc's own sources I also read https://www.116111.no/ungdom,
https://www.116111.no/barn and
https://www.oslo.kommune.no/helse-og-omsorg/barn-ungdom-og-familie/barnevern-og-foreldreveiledning/kontakt-barnevernet/.

Verdicts: `CONFIRMED` (seeded value stated correctly, quote on the page, proposal follows from the
page) or `QUESTION` (reason in the Note).

## Verdict table

| Item | Row | Field | Verdict | Note |
|------|-----|-------|---------|------|
| 1 | 3 | Website | CONFIRMED | Seeded `https://www.helsenorge.no/legevakt/` answers 301 to `/hjelpetilbud-i-kommunene/legevakt` (200). "Tilgjengelig fra: https://www.helsenorge.no/hjelpetilbud-i-kommunene/legevakt/" is on the page. `emergency.ts` carries the old URL as `source` for `legevakt`. The test in `web/tests/emergency.test.ts` pins only the phone and the URL scheme, so changing both places is safe. |
| 2 | 12 | Website | CONFIRMED | Seeded URL answers 301 to https://www.hamar.kommune.no/krisesenter/. "Krisesenteret er døgnåpent alle dager, også på helligdager." is on the target page, which also carries the address, phone and low-threshold sentence. |
| 3 | 14 | Website | QUESTION | Seeded value, 301 and both quotes ("Ringsaker interkommunale barnevernvakt", "Tlf: 40 40 40 15") are correct. But the proposal makes the Hamar re-listing primary. Ringsaker runs the service, so its page is the service's own and outranks the re-listing. The Hamar page also prints the hours variant that was ruled out ("Alle kvelder og netter 15.00 – 08.00 + helger/helligdager") and lists "Barnevernvakta - Tlf. 404 04 015" as "Døgnåpent nummer.". A visitor who follows that link sees hours that contradict the row. The doc's alternative (the Ringsaker page, which prints "15.30 – 08.00 på hverdager, og hele døgnet på helg og helligdager") follows the rule better. |
| 4 | 16 | Opening hours, IsAlwaysOpen | CONFIRMED | Seed has no hours in either language and no `IsAlwaysOpen` (so false). "Telefonnummer: 41 48 12 20" and "Døgnåpent - Gratis - Alle dager" are on the front page, and "Vi har døgnåpen telefon (støtte/veiledning)." is on /tilbud. The proposal matches rows 12 and 21. |
| 5 | 16 | Description | CONFIRMED | Seeded nb and en match the doc. None of /, /tilbud, /om-oss or /kontakt has "henvis" (count 0 on each). "utsatt for vold i nære relasjoner" is on /tilbud, and "trussel" occurs only inside the menu item "Råd til volds- og trusselutsatte". All four pages name "kvinner, menn og barn" or "kvinner, menn og deres barn", so the proposed wording follows. |
| 6 | 19 | Description | CONFIRMED | "Mottak for seksuelle overgrep: 61 27 22 16" is the only line about the service on the page. Nothing there supports sporsikring or reporting to the police. Keeping it flagged is consistent with the never-invent rule. |
| 7 | 21 | Description | CONFIRMED | Seeded nb and en match the doc. Neither "voldtekt" nor "tvangsekte" appears on any of the six pages the doc names. "Vi tilbyr et gratis døgnåpent tilbud til personer utsatt for vold i nære relasjoner." is on /no/om-oss.html, and "kvinner, menn og barn" is there too ("Vi kan tilby kvinner, menn og barn et midlertidig beskyttet botilbud."). |
| 8 | 24 | Cost, cost note | CONFIRMED | Seed has no `Cost` and no cost note. "Det er gratis å ringe til 112." is in the "Nødnummeret 112" accordion body in the embedded page data, not in the visible text, as the doc says. Linked question: "Ring 113 når det er akutt og står om liv. Det er gratis å ringe." is on the row 3 page. The row 25 and row 23 pages have no price wording. |
| 9 | 24 | Opening hours | CONFIRMED | "Ring nødnummeret 112 når det er behov for øyeblikkelig hjelp." is in the same embedded accordion. No "døgn" or hours wording anywhere in the page source. |
| 10 | 25 | Opening hours | CONFIRMED | "Ring 113 om situasjonen er kritisk, og det står om liv og helse." is on the page. No hours or "døgn" wording. |
| 11 | 222 | Opening hours, IsAlwaysOpen | CONFIRMED | Seeded nb `Åpent 00–24`, en `Open 24 hours`, no `IsAlwaysOpen` (so false). "Døgnåpent tilbud når hjelpen ikke kan vente." and "Åpent: 00–24" are on the page. The always-open badge and the open-now filter read `isAlwaysOpen` (`ResourceBadges.tsx`, `query.ts`), so the doc's point holds. |
| 12 | 236 | Opening hours | CONFIRMED | All four quotes are on their pages. Oslo kommune links "Kontakt Barnevernvakten" (bekymringsmelding) and "Barnevernvakten" (døgnåpne tjenester) to barnevernvakten.no/kommuner/oslo-kommune. The doc missed one more Oslo kommune statement on the evening and weekend side: "Ta kontakt med barnevernet i din bydel eller ring barnevernsvakta hvis du trenger hjelp på kveldstid eller i helgene." (https://www.oslo.kommune.no/helse-og-omsorg/barn-ungdom-og-familie/barnevern-og-foreldreveiledning/kontakt-barnevernet/). |
| 13 | 236 | Address | CONFIRMED | Seed has no address. "Besøksadresse: Politihuset i Oslo Grønlandsleiret 44 0190 Oslo" is on barnevernvakten.no (after whitespace collapse), and the page also prints a functional email. The proposed format follows row 218's pattern. |

## Missed differences

1. **Row 4, description (nb and en).** The doc lists it as confirmed. "overgrep" (en "abuse") is on
   none of the row's pages (/omalarmtelefonen and /, and also /ungdom and /barn). "vold" appears only
   on /ungdom ("Blir du slått, er du redd, eller opplever du trusler om vold?"), and the front page
   has "Blir du slått eller truer noen med å slå deg?". The own pages describe the service as for
   children and young people "utsatt for ulike former for omsorgssvikt". The full wording "utsatt for
   vold, overgrep og omsorgssvikt" is only on a re-listing (Hamar kommune's kontaktsteder page).
2. **Row 14, description (nb and en).** The doc lists it as confirmed. The cited pages contain neither
   "akuttberedskap", "akutte situasjoner" nor anything about children calling themselves ("Både barn
   selv"). Ringsaker says only "For henvendelser utenfor alminnelig kontortid, kontakt Ringsaker
   interkommunale barnevernvakt ...", and Hamar says "For henvendelser om generell råd og veiledning
   eller bekymringsmeldinger.".
3. **Row 14, hours: a third variant the doc does not record.** The Hamar page lists "Barnevernvakta -
   Tlf. 404 04 015" with "Døgnåpent nummer." beside the "15.00 – 08.00" entry for the same number.
   Ringsaker's 15:30 still outranks it, so no change follows, but the doc should name it. Related:
   `docs/seed-data.md` row 14 has `40 40 40 15` in its Phone column, while `SeedData.cs` seeds
   `404 04 015`. The digits are the same, and the operating kommune (and Lillehammer) print
   `40 40 40 15`. The doc notes the grouping but raises no item.
4. **Row 236, phone source claim.** The Rows table says 40 42 77 77 is "on all three pages". The
   bekymringsmelding page does not print it (0 hits in the raw HTML; it only links to
   barnevernvakten.no). The number is on the døgnåpne-tjenester page and on barnevernvakten.no. The
   value is right; the claim is not.
5. **Rows 218, 221, 222 and 236, Website.** The doc says every seeded field was checked, but its
   confirmed lists for these rows leave Website out. All four seed the Oslo kommune front page
   `https://www.oslo.kommune.no` (it answers 200), although each row has its own service page (row
   236: barnevernvakten.no, which Oslo kommune itself links). This is not a change on the pages. It is
   a field the doc does not report on.

## Doc hygiene

- No em dashes (a `grep -c` for U+2014 prints 0).
- No person's name and no person-tied phone or email. Every number in the doc is a service line
  (116 006, 116 111, 116 117, 22 48 03 80, 23 48 72 00, 23040500, 40 40 40 15, 404 04 015,
  40 42 77 77, 41 48 12 20, 414 81 220, 61 17 55 60, 61 27 22 16, 62 56 18 30, plus 110, 112 and 113).
  The person-tied contacts on the row 4, 5, 12 and 218 pages are left out, as the doc says. Row 236's
  functional email is mentioned but not printed.
- Times: one unquoted time uses dots. The row 4 cell says "(16.15 to 22.45, Saturdays to 23.45)" and
  should read "kl. 16:15–22:45, Saturdays to kl. 23:45". The row 221 sentence "(00:00 to 23:59 every
  day)" has colons but not the `kl. 00:00–23:59` form. Dots inside quoted page text are correct as
  they are. Dates use periods throughout.
- Every quoted string is on a fetched page. One claim is not: row 236's "on all three pages" (missed
  difference 4).
- Not covered by the doc: `emergency.ts` also carries a `verified` date per line (2026-09-09 for
  rows 23 to 25, 2026-09-07 for row 3). When the gate closes and LastVerified moves for those rows,
  these four strings should move with it.

## Summary

Counts read off the verdict table: 12 `CONFIRMED`, 1 `QUESTION` (item 3), 13 items in all. Missed
differences: 5.
