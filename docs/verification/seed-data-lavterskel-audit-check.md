# Verification: seed-data-lavterskel-audit.md

**Status: CHECK DONE, 10.11.2026 (Tuesday).** Independent check of the Badge off table (rows 17,
18, 305, 335), the Badge kept table (rows 218, 230, 102, 105, 225) and the row 17 "new address"
and "description and cost note" sections of `docs/seed-data-lavterskel-audit.md`. It feeds my
verification gate; no seed or code reads it.

I fetched every cited page with curl (`-sL -A "Mozilla/5.0"`) and stripped tags locally with
Python (script tags removed, HTML unescaped, whitespace collapsed, case ignored). All twelve URLs
returned HTTP 200 and none needed the browser pane. Quotes with "..." were checked piece by
piece. I did no replacement research and changed no value. Five checks:

1. Every double-quoted string attributed to a page is on that page, word for word.
2. Badge off rows: the unit's own page has no sentence naming a badge phrase about this unit
   (phrases: uten, ingen, trenger ikke, trengs ikke, trenger heller ikke, krever ikke henvisning;
   ikke krav om henvisning; ingen formell henvisning; lavterskel; lav terskel).
3. Row 17's nb and en description and cost note claim nothing the Housing First page does not
   say, and the en text says the same as the nb text. The doc table and `SeedData.cs`
   (ResourceId = 17, translations 33 and 34) are identical.
4. `SeedData.cs`: rows 17 and 18 have no `IsLowThreshold` and the address
   `Industrigata 17, 3. etg., 2619 Lillehammer`; the moving notice names both teams. Rows 305
   and 335 have no `IsLowThreshold`.
5. No private person's name or phone number appears in the doc.

Verdicts: `CONFIRMED`, `MISMATCH`, `UNREACHABLE`, `QUESTION`.

## Verdict table

| # | Name | Verdict | Detail |
|---|------|---------|--------|
| 17 | Housing First, Lillehammer kommune | CONFIRMED | Checks 1 to 5 pass. Own page has "Du kan søke direkte til teamet", the vedtak sentence and "Tilbudet er gratis"; no badge phrase anywhere on it. Old quote is on the contact page. Details below. |
| 18 | Oppfølgingsteamet, Lillehammer kommune | CONFIRMED | Both intake-team quotes found on the referral page. No badge phrase about the team: the only "lavterskel" on that page is "øvrige lavterskeltilbud" in a general sentence to GPs. Moving notice names the team; seed has the new address and no `IsLowThreshold`. |
| 305 | Evangeliesenteret kontaktsenter Hamar | CONFIRMED | National quote found on the national page. The Hamar sentence is found. "lavterskeltilbud" occurs exactly three times on the Hamar page, each time in the list entries for Moss, Lofoten and Strømmen. No `IsLowThreshold` in the seed. |
| 335 | Stangehjelpa aktivitetshus | CONFIRMED | Parent-page quote found on the Stangehjelpa parent page. The house page has the quoted contact sentence and no "henvisning" or "lavterskel" at all. No `IsLowThreshold` in the seed. |
| 218 | Overgrepsmottaket, Legevakten i Oslo | CONFIRMED | Both own-page sentences found (they sit in the page as two sentences, as quoted). |
| 230 | Rask psykisk helsehjelp, Bydel Ullern | CONFIRMED | The quoted sentence is on the page. I did not look for an allocation step beyond what the doc states. |
| 102 | Psykisk helse- og rustjenester, Ringsaker | CONFIRMED | All three pieces found: "gir tilbud om inntil fire samtaler", "Du trenger ikke henvisning." and the vedtak sentence. |
| 105 | Stangehjelpa, Stange kommune | CONFIRMED | Both quotes found on the parent page named in the retag doc. |
| 225 | Prindsen mottakssenter | CONFIRMED | Both pieces found: "er et helse- og sosialfaglig lavterskeltilbud" and the vedtak line for akuttplass. |
| Row 17 address and notice | | CONFIRMED | The notice has "Først ut er Psykisk helse- og rusteam, Oppfølgingsteamet og Housing First, flyttingen starter 28. september." and "Industrigata 17, 3. etg. 2619 Lillehammer". The contact page still prints "Kirkegata 26" for Housing First and Oppfølgingsteamet. Seed rows 17 and 18 carry the new address. The follow-up quote about Rask psykisk helsehjelp (December) is on the notice, not the contact page. |
| Row 17 description and cost note | | CONFIRMED | See the claim list below. Doc table and seed text are identical in nb and en. |
| Private data | | CONFIRMED | The doc holds no person's name and no phone number. The contact page does print a team leader and a department head with numbers, and the doc leaves them out. |

## Row 17: claim by claim

Each claim in the nb description, with its support on the Housing First page.

- Support to manage your own home: "Vår rolle er å støtte, veilede og motivere deg til å mestre eget boforhold." Found.
- Aged 18 or over, long-term difficulties with rus and/or psykisk lidelse: the "Du må ha langvarige utfordringer ... være fylt 18 år" sentence. Found.
- Follows you up in municipal housing, private rental or own home: "Teamet gir oppfølging til personer som bor i kommunal bolig, leier privat eller eier egen bolig." Found.
- Does not hold or allocate municipal housing: "Det er viktig å være klar over at teamet ikke disponerer boliger og ikke tildeler kommunale boliger." Found. My first match failed only because the tag strip left a space before the full stop (the sentence is followed by a separate element); read in context the wording is exact.
- Write in the application that you want assessment for Housing First: the "elektroniske skjemaet" sentence. Found.
- Information talk before you apply: found.
- Join means a vedtak: "Om vi kommer frem til at du skal delta i Housing First blir du tildelt et vedtak". Found.
- Cost note "Tilbudet er gratis": found directly after the vedtak sentence.
- "uten krav om rusfrihet" and "først får en varig bolig" are not on the page, which matches the doc (it removes the first and attributes the second to the old description).

The en text carries the same seven statements. One small difference: en says "a formal decision (vedtak)" where nb says only "et vedtak". The page says "vedtak" without "formal". I count that as a faithful gloss, not a claim without support.

## Notes outside the checks

- Row 17's seed opening hours read "Hverdager 09:00–15:00". The Housing First page gives opening hours "mandag til fredag kl. 08.00-15.30" and phone hours "hverdager kl. 09.00-15.00". The seed value matches the phone hours. The audit doc does not claim anything about hours, so I did not count it, but I note it.
- Row 17's Website still points to the department index, as the doc's follow-ups say.
