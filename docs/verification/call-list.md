# Call list — the human part of seed verification

**Date:** 2026-08-13 · **Status of the machine pass:** 79 of 91 rows independently
re-checked against their cited sources — **zero transcription mismatches found anywhere**.
Pending: ring rows 101–112 (checker interrupted by a session limit; independent re-check
resumes after 18:00). Full verdicts: `seed-data-check.md`, `seed-data-oslo-check.md` in this
folder; ring report to follow.

Everything below is what a machine cannot settle. Sections A and B need a phone; section C
needs only a decision or a text fix I can apply on your word.

---

## POLICY CHANGE 2026-08-17 — no phone calls (Malin's decision)

Source verification is sufficient; if a number can't be verified by phone, the remaining
sources (the service's own website above all) decide. Sections A and B are therefore
**closed without dialling**:

**A outcomes** (rule: the service's own page wins over kommune re-listings):
1. Gudbrandsdal Krisesenter: 414 81 220 — own kontakt page, re-fetched live 2026-08-17. ✅
2. Nok. Hamar: **changed to 91 69 17 14** — nokhamar.no found and fetched live 2026-08-17;
   website added to row 118; Løten's 62 53 34 01 demoted to a note. ✅
3. Familievernkontoret Innlandet Øst: Bufdir's 46 61 71 30 (Bufdir runs familievernet). ✅
4. NAV gjeldstelefon: nav.no's 55 55 33 39; Løten's 800 45 353 ships nowhere. ✅
5. Barnevernvakta: weekday start **15:30** — Ringsaker (operating kommune) verbatim;
   row 14's hours and description updated. ✅
6. Rustelefonen: 915 08 588 (own site); short code 08588 added to the description. ✅
7. Barnevernet i Løten: resepsjon's labelled hours 08:00–15:30 apply to the seeded
   resepsjon number; the unlabelled string is ignored. ✅

**B outcome:** all 8 crisis lines were already CONFIRMED by two independent machine passes
against their sources — they ship on that verification. ✅

**Nothing remains before Task 9 except the human gate on the rows themselves.**
The original sections follow for reference; do not re-action them.

---

## A — Dial these: two official sources disagree

| Pri | Service (row) | Dial | Also dial | What to establish |
|-----|---------------|------|-----------|-------------------|
| 1 | **Gudbrandsdal Krisesenter** (16) | 414 81 220 (own site) | 61 27 92 20 (Lillehammer kommune) | Which reaches the krisesenter 24/7? A wrong number here is the app's worst possible failure. |
| 2 | **Nok. Hamar** (118) | 91 69 17 14 (nokhamar.no) | 62 53 34 01 (Løten kommune) | The org's own site and the kommune list different numbers. Org's is likely current. |
| 3 | **Familievernkontoret Innlandet Øst, Hamar** (10) | 46 61 71 30 (Bufdir) | 466 17 150 (Hamar kommune) | Different digits, not different spacing. Bufdir runs familievern — theirs is likely right. |
| 4 | **NAV gjeldsrådgivning** (6/ring I) | 55 55 33 39 (nav.no) | 800 45 353 (Løten kommune) | Both confirmed live on their pages today. Is the 800-number still answering, or a stale legacy? |
| 5 | **Barnevernvakta** (14) | 40 40 40 15 | — | One call: does the weekday shift start 15:00 (Elverum's page) or 15:30 (Ringsaker's — the operating kommune)? Both live today. |
| 6 | **Rustelefonen** (8) | 915 08 588 (own site) | 08588 (printed by Hamar, Stange, Elverum) | Probably the same line (short code vs full). Confirm both answer; seed the full number, short code in description. |
| 7 | **Barnevernet i Løten** (111) | 948 70 878 | — | The same Løten page prints two hour-strings (08:00–15:30 for the resepsjon vs an unlabelled 08:30–15:00). One call settles which applies to this number. |

## B — Dial regardless of machine verdicts: crisis lines

Machine checks say all of these match their sources. Dial anyway — thirty seconds each, and
these are the numbers someone in crisis will trust because your app said so.

| Service (row) | Number |
|---------------|--------|
| Hamar interkommunale krisesenter (12) | 62 56 18 30 |
| Gjøvik Krisesenter (21) | 61 17 55 60 |
| Mental Helse Hjelpetelefonen (1) | 116 123 |
| Kirkens SOS (2) | 22 40 00 40 |
| Legevakt (3) | 116 117 |
| Alarmtelefonen for barn og unge (4) | 116 111 |
| VO-linjen (5) | 116 006 |
| Mottak for seksuelle overgrep, Lillehammer (19) | 61 27 22 16 |

## C — Decisions and text fixes ✅ ALL 15 RESOLVED 2026-08-17

All outcomes applied to the seed files the same day. Summary (details in each row's Notes):

1. Row 19 renamed to "Mottak for seksuelle overgrep, Lillehammer". ✅
2. Row 121 URL fixed to korspahalsen.no (ASCII). ✅
3. Row 9: seed 116 123, keypress in description (22 56 67 00 not dialled — unreproducible). ✅
4. Row 13: display name "Tjeneste psykisk helse og rus". ✅
5. Row 17 Housing First: keep the number (Malin: kommune leaders publish work mobiles). ✅
6. Row 112 Løten RPH: seed with empty phone. ✅
7. Row 113 NAV Elverum: nav.no postcode 2414 + closure line added to description. ✅
8. Row 22 Jobbhus: seed phone-less. ✅
9. Row 241 Oslo HFU: seed as Gamle Oslo (content wins over URL slug). ✅
10. Rows 218/221: keep both with shared 23 04 05 00, no keypress invented. ✅
11. Row 245 Stovner: phone left empty. ✅
12. Ring citation gap: page located and content-verified by machine 2026-08-17 —
    https://www.ringsaker.kommune.no/vakttelefoner-og-viktige-telefonnumre.576290.no.html
    (all seven cited numbers appear on it); citation added to the ring file's coverage map. ✅
13. Row 223: SMS note moved to row 224. ✅
14. Row 116 AAE: Serves cleared (unstated coverage claim). ✅
15. Row 108 NAV Løten: selvbetjening detail omitted (unresolvable conflict). ✅

Also decided 2026-08-17: new ninth category `nodtjenester` (strict — acute lines only), applied
to rows 3, 4, 5, 12, 14, 16, 19, 21, 216, 218, 221, 222, 236. See seed-data.md ## Categories.

~~Remaining before Task 9: sections A and B only (phone work).~~ SUPERSEDED same day by the
no-calls policy — see the POLICY CHANGE block below; A and B are closed on source verification.

The original decision list follows for reference; do not re-action it.

1. **Row 19 rename** — kommune page says *"Mottak for seksuelle overgrep"*, never
   "Overgrepsmottak". Rename the row (machine-caught).
2. **Row 121 website fix** — `korspåhalsen.no` (with å) fails TLS; certificate covers only
   `korspahalsen.no`. Fix the URL (machine-caught).
3. **Row 9 Arbeidslivstelefonen** — the 116 123 (tast 3) route is double-confirmed on Mental
   Helse's site; the 22 56 67 00 pairing was seen by one checker but could not be reproduced
   by the second. If you prefer the direct line (cleaner than a menu), dial 22 56 67 00 first
   to confirm it still answers; otherwise seed 116 123 with the keypress in the description.
4. **Row 13 label** — 916 03 327 appears as both "Tjeneste psykisk helse og rus" and
   "Psykososial krisehjelp" on two Hamar pages. Pick the display name.
5. **Row 17 Housing First** — 451 64 131 may be the team leader's personal mobile. Your
   sosionom judgement: seed it, or leave phone empty with the kommune switchboard route?
6. **Row 112 Løten RPH** — source lists only first-name personal mobiles. Seed with empty
   phone, or drop the row?
7. **Row 113 NAV Elverum** — mottak closed ~12 weeks from Aug 3 (rebuilding, verbatim on
   kommune page); postcode 2406 (kommune) vs 2414 (nav.no). Suggest nav.no's postcode and a
   temporary-closure line in the description.
8. **Row 22 Jobbhus Gjøvik** — no phone printed anywhere. Seed phone-less (website only), or drop?
9. **Row 241 Oslo HFU** — URL says Grünerløkka, page title says Gamle Oslo. One for your
   Oslo friends: which HFU is this?
10. **Rows 218/221 Oslo** — Overgrepsmottaket and Psykososial akuttjeneste share
    23 04 05 00 (legevakt switchboard). Keep both rows with the shared number, no keypress
    invented — confirm that's acceptable presentation.
11. **Row 245 Stovner boligkontor** — prints only the national NAV number as its own.
    Seed with it, or leave phone empty?
12. **Ring citation gap** — four coverage claims cite "Ringsaker's vakttelefon list" without
    a URL; the checker found the probable page (`vakttelefoner-og-viktige-telefonnumre.576290`).
    I'll fix the citations to whatever page you confirm.
13. **Row 223 Oslo Uteseksjonen** — SMS claim actually sourced from row 224's page; move the
    note (text fix).
14. **Row 116 AAE (DPS Elverum-Hamar)** — its `Serves: Hamar` value is an inference from the
    service's name; no page states the coverage area. Verify with Sykehuset Innlandet, or
    clear the field (my suggestion: clear it — an unstated coverage claim shouldn't become a
    database row).
15. **Rows 108 NAV Løten** — the selvbetjening-days conflict between kommune page and nav.no
    reconfirmed live on both sides; pick which to show, or omit the detail.

---

**Coverage map (feeds the database's "also serves" rows):** independently CONFIRMED —
Hamar krisesenter's nine-kommune coverage is stated verbatim on Ringsaker's page and
corroborated by Løten and Elverum; the barnevernvakt's ~13-kommune coverage likewise.
The address is "Kronborgveien 23" on every page checked (the "Kronborgvegen" variant in
row 12's notes appeared nowhere — corrected in seed-data.md 2026-08-17 ✅).
