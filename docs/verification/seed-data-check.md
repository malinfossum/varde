# Seed data verification — independent check

Adversarial fact-check of `docs/seed-data.md` against each row's cited Source URL, done without
seeing the researcher's process. Every source page was fetched live on 2026-08-13.

## Verdict table

| # | Name | Verdict | Detail |
|---|------|---------|--------|
| 1 | Hjelpetelefonen (Mental Helse) | CONFIRMED | |
| 2 | Kirkens SOS | CONFIRMED | |
| 3 | Legevakt | CONFIRMED | |
| 4 | Alarmtelefonen for barn og unge | CONFIRMED | |
| 5 | VO-linjen | CONFIRMED | |
| 6 | Navs økonomi- og gjeldsveiledningstelefon | CONFIRMED | |
| 7 | Jussbuss | CONFIRMED | |
| 8 | Rustelefonen | CONFIRMED, CONFLICT-FLAGGED | See below — seeded value matches its cited source; the competing Hamar-kommune number was not itself checked (out of scope). |
| 9 | Arbeidslivstelefonen (Mental Helse) | CONFIRMED, CONFLICT-FLAGGED | See below. |
| 10 | Familievernkontoret Innlandet Øst, Hamar | CONFIRMED, CONFLICT-FLAGGED | See below. |
| 11 | Nav Hamar | CONFIRMED | |
| 12 | Hamar interkommunale krisesenter | CONFIRMED | |
| 13 | Tjeneste psykisk helse og rus, Hamar | CONFIRMED (ambiguity unresolved) | See below. |
| 14 | Ringsaker interkommunale barnevernvakt | CONFIRMED | |
| 15 | Rask psykisk helsehjelp, Lillehammer | CONFIRMED | |
| 16 | Gudbrandsdal Krisesenter IKS | CONFIRMED, CONFLICT-FLAGGED | See below. |
| 17 | Housing First, Lillehammer kommune | CONFIRMED (ambiguity unresolved) | See below. |
| 18 | Oppfølgingsteamet, Lillehammer kommune | CONFIRMED | |
| 19 | Overgrepsmottak, Lillehammer | PARTIAL | Phone number correct; the Notes' claim about where the *name* came from does not hold up — see below. |
| 20 | Nav Gjøvik | CONFIRMED | |
| 21 | Gjøvik Krisesenter IKS | CONFIRMED | |
| 22 | Jobbhus Gjøvik | CONFIRMED | |

## Notes on non-clean rows

### Row 8 — Rustelefonen (CONFLICT-FLAGGED)
Checked against its cited source, `https://rustelefonen.no/`: phone renders as
`Telefon: 915 08 588` (tel:91508588) — matches the seeded value digit-for-digit. Hours render as
weekdays 11:00–14:30 and 15:00–18:00, closed weekends — matches. The page also states a daily
midday closure (14:30–15:00) not mentioned in the row, and a one-off closure notice for "fredag
26.9" — neither contradicts the seeded data. The competing Hamar-kommune figure ("08588") was not
independently checked; per the task's Notes, this row still needs a phone call before shipping.

### Row 9 — Arbeidslivstelefonen (CONFLICT-FLAGGED)
Source `https://mentalhelse.no/fa-hjelp/arbeidslivstelefonen/` reads: "Telefon: 116 123 (tast 3).
Telefon og chat er åpen fra kl. 08.30 til 16.00 mandag, tirsdag, onsdag og fredag, og fra kl.
08.30 til 18.00 torsdager." Seeded phone `116 123` matches, and the "(tast 3)" instruction was
correctly moved out of the Phone field into the Notes as claimed. The competing Hamar-kommune
number (22 56 67 00) was not independently checked.

### Row 10 — Familievernkontoret Innlandet Øst, Hamar (CONFLICT-FLAGGED)
Source `https://www.bufdir.no/familie/familievernkontorer/oversikt/innlandet-ost/`: Hamar office
phone is printed as `46 61 71 30` (matches seeded value exactly), address "Vangsvegen 121, 2318
Hamar" (matches), telefontider "08.30 - 15.00" (matches). Also checked the "redusert om sommeren"
claim specifically — confirmed, page states: "Vår åpningstid på telefon i sommer: - mandag,
onsdag, torsdag og fredag: kl. 08.30 - 11.45 og kl. 12.30 - 14.00." The competing Hamar-kommune
number (466 17 150) was not independently checked.

### Row 13 — Tjeneste psykisk helse og rus, Hamar (ambiguity unresolved, not a two-source conflict)
Source `.../tjeneste-psykisk-helse-og-rus/`: phone `916 03 327` confirmed verbatim (tel:916 03
327). Exact opening-hours text: "Man, tirs, ons og fre kl 09.00 - 11.00, 11.30 - 14.30 / Tors kl.
11.30 - 14.30" — the seeded "Kun dagtid" is a fair paraphrase (daytime-only, with a midday gap
the row doesn't mention, which is fine — paraphrase, not contradiction). The page does not use
the word "dagtid" itself. The after-hours crisis-team number `952 41 155` is present on the same
page. The row's own flagged ambiguity (same number under two labels on two different Hamar pages)
was not re-litigated — the second page (crisis page) was outside the cited Source URL for this
row, per the task's "don't research replacements" instruction. Note this is tagged AMBIGUOUS in
the source Notes, not CONFLICT, so I have not applied CONFLICT-FLAGGED — but it is still on the
"Verify these first" list and needs the same human follow-up.

### Row 16 — Gudbrandsdal Krisesenter IKS (CONFLICT-FLAGGED)
Source `https://gudbrandsdal-krisesenter.no/kontakt`: both `414 81 220` and `41 48 12 20` appear
on the page (same digits, different grouping) — matches. Address "Skoletorget 6 D, 2609
Lillehammer" matches. No opening hours are stated on the contact page, matching the row's empty
Opening Hours cell. The competing Lillehammer-kommune figure (61 27 92 20) was independently spot
-checked anyway (it appears on `lillehammer.kommune.no/.../nod-og-vakttelefoner/` under
"Krisesenter") and is confirmed real — so this is a genuine two-source conflict, correctly flagged.

### Row 17 — Housing First, Lillehammer kommune (ambiguity unresolved)
Source `.../kontaktinformasjon/`: "Telefon: 451 64 131 (hverdager klokken 09:00 - 15:00)" — matches
seeded phone and hours. Confirmed the same number, `451 64 131`, is also listed separately for
"Teamleder Marthe Løkken" on the same page — so the row's flagged concern (team line vs. named
employee's personal number) is real and still unresolved on the source; needs the human call the
row already asks for.

### Row 19 — Overgrepsmottak, Lillehammer (PARTIAL)
Source `https://lillehammer.kommune.no/om-kommunen/kontakt-oss/nod-og-vakttelefoner/`: phone
number confirmed — `61 27 22 16` appears verbatim. However, the Notes claim "the name in this row
is taken from the label" as "Overgrepsmottak"; the page does **not** use that word anywhere. The
actual label on the page is **"Mottak for seksuelle overgrep"**. This isn't a phone/website/hours
mismatch, but it is a factual claim in the Notes (about where the name came from) that the source
does not support — worth a second look before the display name ships. Separately, and not part of
this row's claim: the same page lists "Krisesenter: 61 27 92 20" under a nearby line, which is the
number that Row 16's notes cite as the competing figure for Gudbrandsdal Krisesenter — confirmed
present, consistent with Row 16's CONFLICT note.

## Rows independently spot-checked beyond their own cited source
- Row 14's claim that Lillehammer's own emergency page also prints `40 40 40 15` for
  "Barnevernvakta" — confirmed on `lillehammer.kommune.no/.../nod-og-vakttelefoner/`.
- Row 18's claim that "Gamlevegen 101, lavterskeltilbud rus" is listed with identical digits in a
  different grouping (`90 24 37 33` vs. `902 43 733`) — confirmed verbatim on the same
  kontaktinformasjon page, in that exact grouping.

## Website URL resolution
All 22 rows' Website URLs resolve (fetched successfully; several share a domain — mentalhelse.no,
nav.no, hamar.kommune.no, lillehammer.kommune.no — checked once per unique target). No broken or
redirected-to-unexpected-host cases found.

## Summary

- **CONFIRMED (clean):** 15 — rows 1, 2, 3, 4, 5, 6, 7, 11, 12, 14, 15, 18, 20, 21, 22
- **CONFIRMED, CONFLICT-FLAGGED:** 4 — rows 8, 9, 10, 16
- **CONFIRMED, ambiguity unresolved (not a two-source conflict, still needs a human call):** 2 — rows 13, 17
- **PARTIAL:** 1 — row 19 (phone correct, Notes' name-sourcing claim not supported by the page)
- **MISMATCH:** 0
- **UNREACHABLE:** 0

**Rows needing human attention before this goes live:** 8, 9, 10, 13, 16, 17 (all already flagged
by the researcher — confirmed as genuine and still open) and 19 (new: the "Overgrepsmottak" label
is not on the source page, unlike what the Notes claim).
