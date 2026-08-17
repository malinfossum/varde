# Seed data — Oslo

**Status: VERIFICATION GATE CLOSED 2026-08-17** — bulk-accepted by Malin under the no-calls
policy (see seed-data.md's status block for the full rule).

Row numbers continue from **201**, so this file does not collide with `docs/seed-data.md` (rows 1–22).

Oslo is one municipality in this database. Bydeler are not municipalities — a bydel service is a
resource sitting in Oslo, named for its bydel. `Municipality` is `Oslo` on every row below
(row 217 excepted — reclassified national 2026-08-17).

Every phone number, address, URL and opening hour in this file was read off the page named in
`Source URL` during the session on 2026-08-13. Where a value could not be found on an official
page, the cell is empty and Notes says `NOT FOUND`. Nothing is reconstructed from memory or
inferred from a pattern.

## Verify these first

Conflicts, ambiguities and judgement calls. Deal with these before anything is seeded.

1. **Row 241 (Gamle Oslo helsestasjon for ungdom)** — I requested the URL ending
   `/grunerlokka-helsestasjon-for-ungdom-hfu/` and the page that came back is titled **Gamle Oslo
   helsestasjon for ungdom (HFU)**, with address Hagegata 32, 0653 Oslo. The postcode is consistent
   with Gamle Oslo, so the content looks internally coherent, but the URL and the title disagree.
   I have recorded it as Gamle Oslo and cited the URL I actually fetched. ✅ RESOLVED 2026-08-17:
   seed as Gamle Oslo — Malin's decision; page content (title + Hagegata 32, postcode consistent
   with Gamle Oslo) wins over the URL slug. Oslo friends can double-check during their pass.
2. **Rows 218 and 221 (Overgrepsmottaket / Psykososial akuttjeneste)** — both print **23 04 05 00**.
   Same number, two different services, and Oslo kommune's own døgnåpne-tjenester page lists both
   against that number. A search result stated the menu routes to psykososial akuttjeneste on
   keypress 2; **I did not read that keypress on an official page and have therefore not recorded
   it anywhere.** ✅ RESOLVED 2026-08-17: keep both rows with the shared number, no keypress
   invented — Malin's decision; two real services behind one real switchboard is honest presentation.
3. **Row 245 (Stovner boligkontor)** — the page prints the phone as `55553333`, which is the
   national Nav number 55 55 33 33 run together. ✅ RESOLVED 2026-08-17: leave the phone empty —
   Malin's decision; the national line isn't the office's own and seeding it implies a direct
   contact that doesn't exist. The row ships website-only. (Item previously mislabelled row 244.)
4. **Row 223 / 224 (Uteseksjonen and Uteseksjonens psykologtjeneste)** — the same number,
   913 03 913, and the same address serve both entries on two different Oslo kommune pages.
   ✅ RESOLVED 2026-08-17: keep two rows — distinct services (oppsøkende tjeneste vs
   psykologtilbud under 25) with their own pages and target groups; same pattern as the
   218/221 decision (two real services behind one real number is honest presentation).
5. **Rows 213 and 230 (Nav Ullern / RPH Ullern)** and **rows 214 and 231 (Nav Vestre Aker / RPH
   Vestre Aker)** — each pair shares a street address (Hoffsveien 48; Sørkedalsveien 150 A). That
   is plausible for co-located bydel services, but worth one look.
6. **Row 232 (Ung Arena Oslo sentrum)** and **row 241 (HFU)** share the address Hagegata 32, 0653
   Oslo, and **row 204 (Nav Gamle Oslo)** is at Hagegata 24. Confirm the house numbers.
7. **Phone formatting** — several Oslo kommune pages print numbers unspaced (`23040500`,
   `91303913`, `22307712`, `47781315`, `90415388`, `41565535`, `23427200`, `55553333`). I have
   written them in the spaced Norwegian form to match the rest of the database and flagged each one
   in Notes. **The digits are unchanged**, but confirm the grouping is what Malin wants displayed.
8. **Row 235 (Gatejuristen)** — `gatejuristen.no` could not be fetched in this session (the domain
   was blocked). Kirkens Bymisjon's own Gatejuristen page carries no phone number or address. The
   row is deliberately contactless. Someone must open gatejuristen.no manually.
9. **Row 220 (Vake kirkelig ressurssenter)** — the only page I could read for this service was its
   entry on **dinutvei.no**, which is a national official directory run by NKVTS rather than the
   organisation's own site. It is a step below my preferred sources. Verify against
   kirkeligressurssenter.no directly.
10. **Could not be sourced at all — no row was written.** Fransiskushjelpen (both contact URLs
    returned 404), Kirkens Bymisjon **24SJU** (the only contact details I found were on commercial
    aggregators, which this project does not use), and **Møtestedet Oslo** (the shared
    contact page rendered the Bodø and Drammen entries but not the Oslo one). All three are
    legitimate Oslo services and should be added by hand.
11. **Row 217 (Unge Relasjoner)** is a chat with no phone. It is run by Oslo Krisesenter but is
    described on its own site as a **national** chat. I have kept `Municipality` as `Oslo` because
    of the operator; reclassify to `(national)` if Malin prefers.
    ✅ RESOLVED 2026-08-17: reclassified to (national) — Malin's decision.

## Table

| # | Name | Municipality | Serves | Categories | Phone | Chat | Website | Opening hours | Source URL | Verified | Checked | Notes |
|---|------|--------------|--------|------------|-------|------|---------|----------------|------------|----------|---------|-------|
| 201 | Nav Alna | Oslo | | okonomi, arbeid, bolig | 55 55 33 33 | | https://www.nav.no | Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15 | https://www.nav.no/kontor/nav-alna | 2026-08-13 | ☑ | Trygve Lies plass 5, 1051 Oslo (Furuset senter, Bydelshuset, Innbyggertorget, 1. etasje). Phone is the national Nav line — no office-specific number is printed. No chat on the page. |
| 202 | Nav Bjerke | Oslo | | okonomi, arbeid, bolig | 55 55 33 33 | | https://www.nav.no | Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15 | https://www.nav.no/kontor/nav-bjerke | 2026-08-13 | ☑ | Ulvenveien 84A, 0581 Oslo. National Nav line only; no office-specific number, no chat. |
| 203 | Nav Frogner | Oslo | | okonomi, arbeid, bolig | 55 55 33 33 | | https://www.nav.no | Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15 | https://www.nav.no/kontor/nav-frogner | 2026-08-13 | ☑ | Drammensveien 60, 0271 Oslo. National Nav line only; no office-specific number, no chat. |
| 204 | Nav Gamle Oslo | Oslo | | okonomi, arbeid, bolig | 55 55 33 33 | | https://www.nav.no | Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15 | https://www.nav.no/kontor/nav-gamle-oslo | 2026-08-13 | ☑ | Hagegata 24, 0653 Oslo. National Nav line only; no office-specific number, no chat. |
| 205 | Nav Grorud | Oslo | | okonomi, arbeid, bolig | 55 55 33 33 | | https://www.nav.no | Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15 | https://www.nav.no/kontor/nav-grorud | 2026-08-13 | ☑ | Kakkelovnskroken 3A, 0954 Oslo. National Nav line only; no office-specific number, no chat. |
| 206 | Nav Grünerløkka | Oslo | | okonomi, arbeid, bolig, rus | 55 55 33 33 | | https://www.nav.no | Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15 | https://www.nav.no/kontor/nav-grunerlokka | 2026-08-13 | ☑ | Marstrandgata 6, 0566 Oslo. The page lists nødhjelp, økonomisk rådgivning, bolig, flyktningtjeneste and rusoppfølging among the office's services. National Nav line only; no chat. |
| 207 | Nav Nordre Aker | Oslo | | okonomi, arbeid, bolig | 55 55 33 33 | | https://www.nav.no | Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15 | https://www.nav.no/kontor/nav-nordre-aker | 2026-08-13 | ☑ | Gullhaugveien 7, 0484 Oslo, inngang fra Sandakerveien 130–138. National Nav line only; no chat. |
| 208 | Nav Nordstrand | Oslo | | okonomi, arbeid, bolig | 55 55 33 33 | | https://www.nav.no | Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15 | https://www.nav.no/kontor/nav-nordstrand | 2026-08-13 | ☑ | Cecilie Thoresens vei 1, 1153 Oslo. National Nav line only; no office-specific number, no chat. |
| 209 | Nav Sagene | Oslo | | okonomi, arbeid, bolig | 55 55 33 33 | | https://www.nav.no | Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15. Drop-in økonomirådgivning onsdager 9–11 | https://www.nav.no/kontor/nav-sagene | 2026-08-13 | ☑ | Thorvald Meyers gate 9, 0555 Oslo. The only Oslo Nav page I read that advertises a separate drop-in for økonomirådgivning: "Hver onsdag er det drop-in for økonomirådgivning fra kl. 9 til 11." National Nav line only; no chat. |
| 210 | Nav St. Hanshaugen | Oslo | | okonomi, arbeid, bolig | 55 55 33 33 | | https://www.nav.no | Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15 | https://www.nav.no/kontor/nav-st.hanshaugen | 2026-08-13 | ☑ | Pilestredet 56, 0167 Oslo. Note the URL contains a literal dot ("nav-st.hanshaugen"), unlike every other Oslo office slug. The page mentions screen sharing with an adviser using a 5-digit code, which is not a chat and is not recorded as one. |
| 211 | Nav Stovner | Oslo | | okonomi, arbeid, bolig | 55 55 33 33 | | https://www.nav.no | Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15 | https://www.nav.no/kontor/nav-stovner | 2026-08-13 | ☑ | Stovner Senter 17, 0985 Oslo. National Nav line only; no office-specific number, no chat. |
| 212 | Nav Søndre Nordstrand | Oslo | | okonomi, arbeid, bolig | 55 55 33 33 | | https://www.nav.no | Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15 | https://www.nav.no/kontor/nav-sondre-nordstrand | 2026-08-13 | ☑ | Ravnåsveien 3, 1254 Oslo. National Nav line only; no office-specific number, no chat. |
| 213 | Nav Ullern | Oslo | | okonomi, arbeid, bolig | 55 55 33 33 | | https://www.nav.no | Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15 | https://www.nav.no/kontor/nav-ullern | 2026-08-13 | ☑ | Hoffsveien 48, 0377 Oslo — the same address as Rask psykisk helsehjelp Bydel Ullern (row 230). National Nav line only; no chat. |
| 214 | Nav Vestre Aker | Oslo | | okonomi, arbeid, bolig | 55 55 33 33 | | https://www.nav.no | Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15 | https://www.nav.no/kontor/nav-vestre-aker | 2026-08-13 | ☑ | Sørkedalsveien 150A, 0754 Oslo, inngang til venstre når man kommer inn hovedinngangen. Same street address as RPH Bydel Vestre Aker (row 231). National Nav line only; no chat. |
| 215 | Nav Østensjø | Oslo | | okonomi, arbeid, bolig | 55 55 33 33 | | https://www.nav.no | Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15 | https://www.nav.no/kontor/nav-ostensjo | 2026-08-13 | ☑ | Olaf Helsets vei 6, 0694 Oslo. National Nav line only; no office-specific number, no chat. |
| 216 | Oslo Krisesenter | Oslo | | vold-og-overgrep, bolig, nodtjenester | 22 48 03 80 | | https://www.oslokrisesenter.no | Døgnåpent | https://www.oslokrisesenter.no/kontakt-oss | 2026-08-13 | ☑ | Number confirmed on two independent official pages: the centre's own contact page and Oslo kommune's døgnåpne-tjenester page. The centre is at a hemmelig adresse — leave the address field empty; this is a safety measure, not missing data. Postboks 7055 St. Olavs plass, 0130 Oslo. Email answered within 1–2 business days. |
| 217 | Unge Relasjoner | (national) | | vold-og-overgrep, psykisk-helse | | https://www.ungerelasjoner.no/ | https://www.ungerelasjoner.no | Chat tirsdag 12–20 og fredag 12–15 | https://www.ungerelasjoner.no/ | 2026-08-13 | ☑ | Chat only, no phone — do not present as a crisis line. Run by Oslo Krisesenter, but the site describes it as a national chat; reclassify the municipality if that matters. Hours read verbatim: "Chatten er åpen tirsdag 12 - 20 og fredag 12-15". Age 16–25. RECLASSIFIED 2026-08-17 (Malin's decision): national — the site describes a national chat; the operator (Oslo Krisesenter) is noted here, not in the municipality field. |
| 218 | Overgrepsmottaket, Legevakten i Oslo | Oslo | | vold-og-overgrep, nodtjenester | 23 04 05 00 | | https://www.oslo.kommune.no | Døgnåpent | https://www.oslo.kommune.no/helse-og-omsorg/akutt-helsehjelp-og-legevakt/legevakt-oslo/overgrepsmottaket/ | 2026-08-13 | ☑ | Trondheimsveien 233 (Aker sykehus), 0587 Oslo. For deg fra 14 år. Under 14 år går henvendelsen til barnemottaket, som the page prints as 22 98 91 40 — a different service, seed separately or not at all. A staff/professional line 23 04 04 90 is also printed; that is not a public number. The service page prints the main number unspaced ("23040500"); the kriser-og-vold page prints "Ring 23 04 05 00" — I used the spaced form. |
| 219 | Alternativ til Vold (ATV) Oslo | Oslo | | vold-og-overgrep, psykisk-helse | 22 40 11 10 | | https://atv-stiftelsen.no | Telefontid mandag–fredag 09.00–15.00 | https://atv-stiftelsen.no/avdeling/oslo/ | 2026-08-13 | ☑ | Brugata 19, 0186 Oslo. Number confirmed twice: ATV's own Oslo page and Oslo kommune's page on behandling for vold og aggresjonsproblemer. For deg over 18 år som utøver vold. Group therapy is listed at 15:15–16:45 on the kommune page; that is a session time, not opening hours, so it is not seeded. |
| 220 | Vake kirkelig ressurssenter mot seksuelle overgrep | Oslo | | vold-og-overgrep, psykisk-helse | 23 22 79 30 | | https://www.kirkeligressurssenter.no | | https://dinutvei.no/hjelpetilbud/kirkelig-ressurssenter-mot-vold-og-seksuelle-overgrep/ | 2026-08-13 | ☑ | Lovisenberggata 15 C, 0456 Oslo. SMS 47 46 46 16 is also printed. Sourced from dinutvei.no, a national official directory rather than the organisation's own site. RESOLVED 2026-08-17 (no-calls policy): an official national directory is a sufficient source; ships as-is. Opening hours NOT FOUND. |
| 221 | Psykososial akuttjeneste, Legevakten i Oslo | Oslo | | psykisk-helse, vold-og-overgrep, nodtjenester | 23 04 05 00 | | https://www.oslo.kommune.no | Døgnåpent | https://www.oslo.kommune.no/helse-og-omsorg/akutt-helsehjelp-og-legevakt/psykososial-akuttjeneste/ | 2026-08-13 | ☑ | Trondheimsveien 233 (Aker sykehus), 0587 Oslo. Same number as Overgrepsmottaket (row 218) — confirm the phone menu before publishing either. Page prints it unspaced ("23040500"); Oslo kommune's døgnåpne-tjenester page prints "23 04 05 00". The page notes one component is available "kun kveld, natt og helg" while the service as a whole is døgnåpen — do not present that caveat as the service's hours without checking. |
| 222 | Legevakten i Oslo | Oslo | | psykisk-helse, nodtjenester | 116 117 | | https://www.oslo.kommune.no | Åpent 00–24 | https://www.oslo.kommune.no/helse-og-omsorg/akutt-helsehjelp-og-legevakt/legevakt-oslo/ | 2026-08-13 | ☑ | Trondheimsveien 233 (Aker sykehus). The page prints "Ved sykdom, ring 116 117" and "Ring 113 ved fare for liv og helse". Oslo kommune's døgnåpne-tjenester page additionally prints 23 48 72 00 for Legevakten — a second, Oslo-specific number I did not find on the legevakt page itself. RESOLVED 2026-08-17 (no-calls policy): show 116 117 — the number on the service's own page; the second number stays note-only. Overlaps with row 3 in seed-data.md, see Overlaps. |
| 223 | Uteseksjonen, Oslo kommune | Oslo | | rus, psykisk-helse | 913 03 913 | | https://www.oslo.kommune.no | Rådgivningstjenesten i Maridalsveien 3 mandag–fredag 10:00–15:00 | https://www.oslo.kommune.no/helse-og-omsorg/rustjenester/sentrumsarbeid/uteseksjonen/ | 2026-08-13 | ☑ | Maridalsveien 3, 0178 Oslo. Post: Postboks 30, Sentrum, 0101 Oslo. Number printed unspaced ("91303913") — digits unchanged, grouping is mine. The SMS claim was moved to row 224 (2026-08-17): it comes from row 224's page, which states phone/SMS on this same number; this row's own page does not mention SMS. NOTE: this row's nb/en descriptions still say "sende SMS" — revisit when deciding whether 223/224 are one service or two. Patruljer are out every day and evening year-round, later on Friday and Saturday nights; only the rådgivningstjeneste hours are seeded because they are the only ones stated as clock times. Særlig fokus på unge opptil 25 år. |
| 224 | Uteseksjonens psykologtjeneste | Oslo | | psykisk-helse, rus | 913 03 913 | | https://www.oslo.kommune.no | | https://www.oslo.kommune.no/helse-og-omsorg/psykisk-helsehjelp/psykisk-helsehjelp-til-barn-unge-og-familier/psykisk-helsehjelp-for-ungdom-og-unge-voksne/uteseksjonens-psykologtjeneste/ | 2026-08-13 | ☑ | Maridalsveien 3, 0178 Oslo. Same number and address as row 223 — decide whether this is one service or two. For unge under 25 år. Opening hours NOT FOUND; the page says phone or SMS without stating times. |
| 225 | Prindsen mottakssenter | Oslo | | rus, bolig, psykisk-helse | 23 42 72 00 | | https://www.oslo.kommune.no | Brukerrom mandag–søndag 09:00–22:00. Feltpleie mandag–fredag 09:00–22:00, lørdag–søndag 10:00–20:00 | https://oslo.kommune.no/helse-og-omsorg/rusomsorg/rusinstitusjon/alle-rusinstitusjoner/prindsen-mottakssenter | 2026-08-13 | ☑ | Hausmannsgate 11, 0182 Oslo. Number printed unspaced ("23427200"). The page also prints 23 04 05 00 for akutt overnatting after 15:00 (that is the legevakt/psykososial number, see rows 218 and 221) and 91 54 59 71 for Nav-inntak — confirm whether the latter is a service line before seeding it anywhere. Doctor mandag–fredag 10:00–20:00. Overnatting is døgnåpen but decisions are made mandag–fredag 08:00–15:00 via Nav. |
| 226 | Feltpleien i Oslo (Frelsesarmeen) | Oslo | | rus | 22 67 43 45 | | https://frelsesarmeen.no | Mandag–fredag 09.00–15.00 | https://frelsesarmeen.no/rusomsorg/feltpleien-i-oslo | 2026-08-13 | ☑ | Urtegata 16 A, 0187 Oslo — same address as Fyrlyset (row 227). Lege onsdag og fredag 12.30–15.00. |
| 227 | Fyrlyset, Oslo (Frelsesarmeen) | Oslo | | rus, bolig | 23 03 66 80 | | https://frelsesarmeen.no | Hverdager 09.00–14.30, søndager 11.00–13.00 | https://frelsesarmeen.no/rusomsorg/fyrlyset-oslo | 2026-08-13 | ☑ | Urtegata 16 A, 0187 Oslo. Kontaktsenter for mennesker med rusproblemer over 18 år. Email fyrlyset.oslo@frelsesarmeen.no. |
| 228 | LINK Oslo | Oslo | | psykisk-helse | 940 30 488 | | https://linkoslo.no | Telefon hverdager 9–15 | https://linkoslo.no | 2026-08-13 | ☑ | Lilletorget 1, 5. etasje — the site describes a move from the 2nd to the 5th floor of the same building dated 1. april 2025, so confirm the current floor. Printed as "940 30 488 hverdager 9-15". Selvhjelps- og mestringsgrupper; the hours given are phone hours, not drop-in. |
| 229 | Rask psykisk helsehjelp – Bydel Alna | Oslo | | psykisk-helse, rus | 22 30 77 12 | | https://www.oslo.kommune.no | | https://www.oslo.kommune.no/helse-og-omsorg/psykisk-helsehjelp/ved-milde-til-moderate-psykiske-utfordringer/rask-psykisk-helsehjelp-bydel-alna/ | 2026-08-13 | ☑ | Trygve Lies Plass 6, 1051 Oslo. Number printed unspaced ("22307712"). Opening hours NOT FOUND as text — the page renders a live weekly calendar showing most days "Stengt", which I will not transcribe as fixed hours because it changes week to week. For deg med bostedsadresse i bydel Alna. |
| 230 | Rask psykisk helsehjelp – Bydel Ullern | Oslo | | psykisk-helse, rus | 95 29 83 22 | | https://www.oslo.kommune.no | Telefonen er bemannet torsdager 12:00–13:00 | https://www.oslo.kommune.no/helse-og-omsorg/psykisk-helsehjelp/ved-milde-til-moderate-psykiske-utfordringer/rask-psykisk-helsehjelp-bydel-ullern/ | 2026-08-13 | ☑ | Hoffsveien 48, 0377 Oslo — same address as Nav Ullern (row 213). One hour of phone time a week; the UI must not imply wider availability. |
| 231 | Rask psykisk helsehjelp – Bydel Vestre Aker | Oslo | | psykisk-helse, rus | 47 78 13 15 | | https://www.oslo.kommune.no | | https://www.oslo.kommune.no/helse-og-omsorg/psykisk-helsehjelp/ved-milde-til-moderate-psykiske-utfordringer/rask-psykisk-helsehjelp-bydel-vestre-aker/ | 2026-08-13 | ☑ | Sørkedalsveien 150 A, 0754 Oslo. Number printed unspaced ("47781315"). Opening hours NOT FOUND as text — the page shows a live calendar rather than stated hours. Gratis, for deg over 16 år. |
| 232 | Ung Arena Oslo sentrum | Oslo | | psykisk-helse, familie-og-barn | 904 15 388 | | https://www.oslo.kommune.no | Drop-in torsdager 14:00–17:00 | https://www.oslo.kommune.no/helse-og-omsorg/psykisk-helsehjelp/psykisk-helsehjelp-til-barn-unge-og-familier/psykisk-helsehjelp-for-ungdom-og-unge-voksne/ung-arena/ung-arena-oslo-sentrum/ | 2026-08-13 | ☑ | Hagegata 32, 0653 Oslo. Number printed unspaced ("90415388"). For barn og ungdom mellom 12 og 25 år, gratis, ingen henvisning. Only the drop-in hours are stated as clock times; the rest of the page is a live calendar. There is also a Ung Arena Oslo vest — not fetched, add separately. |
| 233 | Kontoret for fri rettshjelp, Oslo kommune | Oslo | | juridisk-hjelp, okonomi, bolig | 23 48 79 00 | | https://www.oslo.kommune.no | Timeavtaler mandag–fredag 08:00–15:30. Drop-in mandag–torsdag 16:00–19:00 | https://www.oslo.kommune.no/bolig-og-sosiale-tjenester/fri-rettshjelp/ | 2026-08-13 | ☑ | Storgata 19, 0184 Oslo. Email frirettshjelp@vel.oslo.kommune.no. Everyone gets up to half an hour with a lawyer; free of charge. Evening drop-in is unusual and genuinely useful — worth surfacing in the UI. |
| 234 | JURK – Juridisk rådgivning for kvinner | Oslo | | juridisk-hjelp, vold-og-overgrep, okonomi | 22 84 29 50 | | https://foreninger.uio.no/jurk/ | Nye saker: mandag 12:00–15:00, onsdag 09:00–12:00 (kun telefon) og onsdag 17:00–20:00 | https://foreninger.uio.no/jurk/ | 2026-08-13 | ☑ | Skippergata 23, 0154 Oslo. Existing cases: phone mandag–torsdag 09:00–15:00 — different hours from new-case intake, so do not merge them. Student-run; expect reduced summer hours. Shares Jusshuset with Jussbuss (row 7 of seed-data.md) and Gatejuristen. |
| 235 | Gatejuristen | Oslo | | juridisk-hjelp, rus | | | https://kirkensbymisjon.no/gatejuristen/ | | https://kirkensbymisjon.no/gatejuristen/ | 2026-08-13 | ☑ | NOT FOUND — no phone, address or opening hours are printed on Kirkens Bymisjon's Gatejuristen page, and gatejuristen.no could not be fetched in this session (domain blocked). Seed without contact details or hold the row until someone opens gatejuristen.no by hand. Gratis rettshjelp til folk som har eller har hatt rusproblemer. |
| 236 | Barnevernvakten i Oslo | Oslo | | familie-og-barn, vold-og-overgrep, nodtjenester | 40 42 77 77 | | https://www.oslo.kommune.no | | https://www.oslo.kommune.no/dognapne-tjenester/ | 2026-08-13 | ☑ | Number read off Oslo kommune's own døgnåpne-tjenester page, which lists Barnevernvakten among the city's 24-hour services. I could not open a dedicated Barnevernvakten service page — the URLs I tried returned 404 and the kontakt-barnevernet page only links onward without printing the number. Address and stated opening hours NOT FOUND. Note the tension: the number is listed under "døgnåpne tjenester", but barnevernvakter are usually evening/night/weekend services. Confirm the hours before showing any. |
| 237 | Familievernkontoret Christiania | Oslo | | familie-og-barn | 23 28 39 40 | | https://www.bufdir.no | Åpent 08.15–15.30, telefontid 08.30–15.00 | https://www.bufdir.no/familie/familievernkontorer/oversikt/christiania/ | 2026-08-13 | ☑ | Dronningens gate 8 A, 0152 Oslo. Serves bydelene Søndre Nordstrand, Nordstrand, Grünerløkka og Frogner. The only one of the four Oslo offices that prints separate opening and phone hours. |
| 238 | Familievernkontoret Enerhaugen | Oslo | | familie-og-barn | 466 17 010 | | https://www.bufdir.no | 08.30–15.00 | https://www.bufdir.no/familie/familievernkontorer/oversikt/enerhaugen/ | 2026-08-13 | ☑ | Grønlandsleiret 25, 0190 Oslo. Serves bydelene Alna, Gamle Oslo, Østensjø og Nordre Aker. |
| 239 | Familievernkontoret Homansbyen | Oslo | | familie-og-barn | 466 16 660 | | https://www.bufdir.no | 08.30–15.00 | https://www.bufdir.no/familie/familievernkontorer/oversikt/homansbyen/ | 2026-08-13 | ☑ | Oscars gate 20, 0352 Oslo. Serves bydelene St. Hanshaugen, Ullern, Sagene og Vestre Aker. |
| 240 | Familievernkontoret Oslo Nord | Oslo | | familie-og-barn | 46 61 51 20 | | https://www.bufdir.no | 08.30–15.30 | https://www.bufdir.no/familie/familievernkontorer/oversikt/oslo-nord/ | 2026-08-13 | ☑ | Kabelgata 2, 0581 Oslo. Serves bydelene Bjerke, Grorud og Stovner. The page adds "Vår telefon er åpen kl. 08.30-11.45 i uke 28 - 31" — a summer restriction, not the year-round hours, so it is not in the hours field. Number cross-confirmed on dinutvei.no. |
| 241 | Gamle Oslo helsestasjon for ungdom (HFU) | Oslo | | familie-og-barn, psykisk-helse | 415 65 535 | | https://www.oslo.kommune.no | Telefontid tirsdag og torsdag 11:00–14:00 | https://www.oslo.kommune.no/helse-og-omsorg/helsehjelp/helsestasjon/helsestasjon-for-ungdom-hfu/grunerlokka-helsestasjon-for-ungdom-hfu/ | 2026-08-13 | ☑ | RESOLVED 2026-08-17 (was URL/TITLE MISMATCH — see Verify these first, item 1): seed as Gamle Oslo — content wins over the URL slug. The URL says grunerlokka, the page content says Gamle Oslo, address Hagegata 32, 0653 Oslo. Number printed unspaced ("41565535"). Alle ungdommer i Oslo mellom 12 og 24 år kan bruke helsestasjon for ungdom, tjenestene er gratis, og du velger fritt hvilken du vil gå til (from the central HFU page). Drop-in hours NOT FOUND. |
| 242 | Helsestasjon for ungdom (HFU) i Oslo | Oslo | | familie-og-barn, psykisk-helse | | | https://www.oslo.kommune.no | | https://www.oslo.kommune.no/helse-og-omsorg/helsehjelp/helsestasjon/helsestasjon-for-ungdom-hfu/ | 2026-08-13 | ☑ | City-level entry. NOT FOUND — the central page prints no phone number and names no individual stations; it only states the age range (12–24), that the service is free, and that you may choose any station. Each bydel has its own HFU with its own number; only row 241 was fetched. RESOLVED 2026-08-17: keep as the phone-less city-level overview row — consistent with the Jobbhus/RPH decisions (website-only rows are acceptable); individual stations can be added later. |
| 243 | Oslohjelpa | Oslo | | familie-og-barn, psykisk-helse | | | https://www.oslo.kommune.no | | https://www.oslo.kommune.no/helse-og-omsorg/barn-ungdom-og-familie/oslohjelpa/ | 2026-08-13 | ☑ | NOT FOUND — no phone number is printed. The page says "Ring eller send en e-post til Oslohjelpa i din bydel så avtaler vi tid for en samtale" but lists no per-bydel contacts. Gratis lavterskeltilbud for barn, unge og familier, ingen henvisning. Exact age range NOT FOUND. |
| 244 | Boligkontorene i Oslo | Oslo | | bolig | | | https://www.oslo.kommune.no | | https://www.oslo.kommune.no/bolig-og-sosiale-tjenester/bolig/alle-boligkontorer-i-oslo/ | 2026-08-13 | ☑ | NOT FOUND — the overview page names no offices and prints no numbers: "Det er boligkontorer i alle bydeler i Oslo. Velg din bydel eller søk opp via adressen din for å finne riktig boligkontor, åpningstider og kontaktinformasjon." City-level row only. |
| 245 | Stovner boligkontor | Oslo | | bolig | | | https://www.oslo.kommune.no | | https://www.oslo.kommune.no/bolig-og-sosiale-tjenester/bolig/alle-boligkontorer-i-oslo/stovner-boligkontor/ | 2026-08-13 | ☑ | Bydel Stovner, Boligenheten, Karl Fossums vei 30, 0985 Oslo. RESOLVED 2026-08-17: phone left empty — Malin's decision. The page prints only "55553333" (the national Nav line run together), which is not the office's own number; the row ships website-only. Opening hours NOT FOUND. Sampled as one example of a bydel boligkontor; the other 14 were not fetched. |
| 246 | Økonomisk rådgivning og gjeldsrådgivning, Oslo kommune | Oslo | | okonomi | | | https://www.oslo.kommune.no | | https://www.oslo.kommune.no/bolig-og-sosiale-tjenester/sosiale-tjenester/okonomisk-radgivning/ | 2026-08-13 | ☑ | NOT FOUND — no phone number and no hours are printed. The page routes you to your local Nav office: "Ta kontakt med Nav-kontoret for å avtale tid for en samtale." In practice that means rows 201–215. Nav Sagene (row 209) is the only Oslo office I found that advertises a dedicated drop-in for økonomirådgivning. See also Overlaps: Navs økonomi- og gjeldsveiledningstelefon is already row 6 of seed-data.md. |
| 247 | Bymisjonssenteret, Oslo (Kirkens Bymisjon) | Oslo | | psykisk-helse, rus | 22 66 67 80 | | https://kirkensbymisjon.no | | https://kirkensbymisjon.no/tilbud-bymisjonssenteret/kontaktinformasjon/ | 2026-08-13 | ☑ | Herslebsgate 43, 0578 Oslo. Opening hours NOT FOUND. The only email on the page is a named employee's (the operations manager) — **do not seed a personal address**; leave the email field empty. Confirm 22 66 67 80 is a switchboard and not a personal line. |

## Descriptions

### 201. Nav Alna
- **nb:** Nav-kontoret for deg som bor i bydel Alna, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.
- **en:** The Nav office for people living in the Alna district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.
- **hours-nb:** Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15
- **hours-en:** Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15

### 202. Nav Bjerke
- **nb:** Nav-kontoret for deg som bor i bydel Bjerke, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.
- **en:** The Nav office for people living in the Bjerke district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.
- **hours-nb:** Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15
- **hours-en:** Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15

### 203. Nav Frogner
- **nb:** Nav-kontoret for deg som bor i bydel Frogner, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.
- **en:** The Nav office for people living in the Frogner district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.
- **hours-nb:** Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15
- **hours-en:** Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15

### 204. Nav Gamle Oslo
- **nb:** Nav-kontoret for deg som bor i bydel Gamle Oslo, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.
- **en:** The Nav office for people living in the Gamle Oslo district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.
- **hours-nb:** Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15
- **hours-en:** Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15

### 205. Nav Grorud
- **nb:** Nav-kontoret for deg som bor i bydel Grorud, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.
- **en:** The Nav office for people living in the Grorud district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.
- **hours-nb:** Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15
- **hours-en:** Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15

### 206. Nav Grünerløkka
- **nb:** Nav-kontoret for deg som bor i bydel Grünerløkka. Kontoret hjelper med arbeid, nødhjelp, økonomisk rådgivning, bolig, flyktningtjeneste og oppfølging ved rusproblemer.
- **en:** The Nav office for people living in the Grünerløkka district. The office helps with work, emergency assistance, money advice, housing, refugee services and substance use follow-up.
- **hours-nb:** Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15
- **hours-en:** Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15

### 207. Nav Nordre Aker
- **nb:** Nav-kontoret for deg som bor i bydel Nordre Aker, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.
- **en:** The Nav office for people living in the Nordre Aker district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.
- **hours-nb:** Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15
- **hours-en:** Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15

### 208. Nav Nordstrand
- **nb:** Nav-kontoret for deg som bor i bydel Nordstrand, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.
- **en:** The Nav office for people living in the Nordstrand district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.
- **hours-nb:** Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15
- **hours-en:** Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15

### 209. Nav Sagene
- **nb:** Nav-kontoret for deg som bor i bydel Sagene, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Hver onsdag er det drop-in for økonomirådgivning fra klokken 9 til 11.
- **en:** The Nav office for people living in the Sagene district, with help on financial assistance, work, housing and other social services. Every Wednesday there is a drop-in for money advice from 9 to 11.
- **hours-nb:** Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15. Drop-in økonomirådgivning onsdager 9–11
- **hours-en:** Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15. Money-advice drop-in Wednesdays 9–11

### 210. Nav St. Hanshaugen
- **nb:** Nav-kontoret for deg som bor i bydel St. Hanshaugen, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.
- **en:** The Nav office for people living in the St. Hanshaugen district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.
- **hours-nb:** Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15
- **hours-en:** Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15

### 211. Nav Stovner
- **nb:** Nav-kontoret for deg som bor i bydel Stovner, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.
- **en:** The Nav office for people living in the Stovner district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.
- **hours-nb:** Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15
- **hours-en:** Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15

### 212. Nav Søndre Nordstrand
- **nb:** Nav-kontoret for deg som bor i bydel Søndre Nordstrand, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.
- **en:** The Nav office for people living in the Søndre Nordstrand district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.
- **hours-nb:** Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15
- **hours-en:** Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15

### 213. Nav Ullern
- **nb:** Nav-kontoret for deg som bor i bydel Ullern, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.
- **en:** The Nav office for people living in the Ullern district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.
- **hours-nb:** Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15
- **hours-en:** Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15

### 214. Nav Vestre Aker
- **nb:** Nav-kontoret for deg som bor i bydel Vestre Aker, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.
- **en:** The Nav office for people living in the Vestre Aker district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.
- **hours-nb:** Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15
- **hours-en:** Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15

### 215. Nav Østensjø
- **nb:** Nav-kontoret for deg som bor i bydel Østensjø, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i åpningstiden.
- **en:** The Nav office for people living in the Østensjø district, with help on financial assistance, work, housing and other social services. You can come without an appointment during opening hours.
- **hours-nb:** Drop-in mandag–fredag 11.00–15.00. Telefontid hverdager 9–15
- **hours-en:** Drop-in Monday–Friday 11.00–15.00. Phone hours weekdays 9–15

### 216. Oslo Krisesenter
- **nb:** Gratis døgnåpent tilbud til deg som er utsatt for vold i nære relasjoner. Du kan ringe for råd og veiledning, og senteret har også botilbud. Adressen er hemmelig av hensyn til sikkerheten.
- **en:** A free 24-hour service for anyone affected by violence in a close relationship. You can call for advice and guidance, and the centre also offers a place to stay. The address is kept secret for safety reasons.
- **hours-nb:** Døgnåpent
- **hours-en:** Open 24 hours

### 217. Unge Relasjoner
- **nb:** Anonym chat for deg mellom 16 og 25 år som er i en usunn relasjon. Du chatter med fagpersoner som har lang erfaring med vold i nære relasjoner.
- **en:** An anonymous chat for people aged 16 to 25 who are in an unhealthy relationship. You chat with professionals who have long experience with violence in close relationships.
- **hours-nb:** Chat tirsdag 12–20 og fredag 12–15
- **hours-en:** Chat Tuesday 12–20 and Friday 12–15

### 218. Overgrepsmottaket, Legevakten i Oslo
- **nb:** Gratis døgnåpent helsetilbud for deg fra 14 år som har vært utsatt for voldtekt, voldtektsforsøk eller andre seksuelle overgrep. Du kan komme uten å ha anmeldt forholdet til politiet. Gjelder det et barn under 14 år, skal henvendelsen gå til barnemottaket.
- **en:** A free 24-hour health service for people aged 14 and over who have experienced rape, attempted rape or other sexual assault. You can come without having reported it to the police. For a child under 14, the enquiry goes to the children's unit instead.
- **hours-nb:** Døgnåpent
- **hours-en:** Open 24 hours

### 219. Alternativ til Vold (ATV) Oslo
- **nb:** Behandlingstilbud til deg over 18 år som bruker vold eller har problemer med sinne og aggresjon. Både kvinner og menn kan få behandling, individuelt eller i gruppe.
- **en:** A treatment service for people over 18 who use violence or struggle with anger and aggression. Both women and men can receive treatment, individually or in a group.
- **hours-nb:** Telefontid mandag–fredag 09.00–15.00
- **hours-en:** Phone hours Monday–Friday 09.00–15.00

### 220. Vake kirkelig ressurssenter mot seksuelle overgrep
- **nb:** Ressurssenter for deg som har opplevd seksuelle overgrep eller vold, med samtaler og veiledning. Du kan ta kontakt på telefon eller SMS.
- **en:** A resource centre for people who have experienced sexual abuse or violence, offering counselling and guidance. You can get in touch by phone or text message.

### 221. Psykososial akuttjeneste, Legevakten i Oslo
- **nb:** Kommunens døgnåpne tjeneste ved akutt oppståtte kriser. Du kan få samtale på legevakten, på telefon eller video, og tjenesten kan også komme hjem til deg. Du trenger ikke henvisning, og tilbudet er gratis.
- **en:** The city's 24-hour service for people in an acute crisis. You can talk at the emergency clinic, by phone or by video, and the service can also come to your home. No referral is needed and it is free.
- **hours-nb:** Døgnåpent
- **hours-en:** Open 24 hours

### 222. Legevakten i Oslo
- **nb:** Legevakten i Oslo er åpen hele døgnet for deg som trenger rask helsehjelp når fastlegen er stengt. Ved fare for liv og helse skal du ringe 113.
- **en:** The Oslo emergency clinic is open around the clock for anyone needing urgent medical help when their regular doctor is closed. If there is danger to life, call 113 instead.
- **hours-nb:** Åpent 00–24
- **hours-en:** Open 24 hours

### 223. Uteseksjonen, Oslo kommune
- **nb:** Oslo kommunes oppsøkende tjeneste i sentrum, med særlig fokus på unge opptil 25 år. Patruljer er ute hver dag og kveld, og du kan også komme til rådgivningstjenesten eller ringe eller sende SMS.
- **en:** The City of Oslo's outreach service in the city centre, with a particular focus on young people up to 25. Patrols are out every day and evening, and you can also visit the advice service or call or text.
- **hours-nb:** Rådgivningstjenesten i Maridalsveien 3 mandag–fredag 10:00–15:00
- **hours-en:** Advice service at Maridalsveien 3 Monday–Friday 10:00–15:00

### 224. Uteseksjonens psykologtjeneste
- **nb:** Psykologhjelp for deg under 25 år, gjennom Uteseksjonen. Du kan ta kontakt selv på telefon eller SMS, uten henvisning.
- **en:** Psychological help for people under 25, through the outreach service. You can get in touch yourself by phone or text, without a referral.

### 225. Prindsen mottakssenter
- **nb:** Lavterskeltilbud med helse- og sosialtjenester for deg med rusutfordringer, med brukerrom, feltpleie, lege og akutt overnatting. Du trenger ikke henvisning for å komme.
- **en:** A low-threshold centre with health and social services for people with substance use difficulties, offering a drug consumption room, field nursing, a doctor and emergency overnight accommodation. No referral is needed.
- **hours-nb:** Brukerrom mandag–søndag 09:00–22:00. Feltpleie mandag–fredag 09:00–22:00, lørdag–søndag 10:00–20:00
- **hours-en:** Consumption room Monday–Sunday 09:00–22:00. Field nursing Monday–Friday 09:00–22:00, Saturday–Sunday 10:00–20:00

### 226. Feltpleien i Oslo (Frelsesarmeen)
- **nb:** Helsehjelp for deg som lever med rusproblemer, med sårstell, prevensjon og andre helsetjenester uten timeavtale. Lege er til stede onsdag og fredag.
- **en:** Health care for people living with substance use problems, with wound care, contraception and other health services without an appointment. A doctor is present on Wednesdays and Fridays.
- **hours-nb:** Mandag–fredag 09.00–15.00
- **hours-en:** Monday–Friday 09.00–15.00

### 227. Fyrlyset, Oslo (Frelsesarmeen)
- **nb:** Kontaktsenter for deg over 18 år med rusproblemer, der du kan få mat, drikke, klær og mulighet til å vaske deg. Du kan komme innom uten avtale.
- **en:** A drop-in centre for people over 18 with substance use problems, where you can get food, drink, clothes and a chance to wash. You can come without an appointment.
- **hours-nb:** Hverdager 09.00–14.30, søndager 11.00–13.00
- **hours-en:** Weekdays 09.00–14.30, Sundays 11.00–13.00

### 228. LINK Oslo
- **nb:** Senter for selvhjelp og mestring, der du kan få hjelp til å starte eller finne en selvhjelpsgruppe. Tilbudet er gratis og du trenger ingen henvisning.
- **en:** A centre for self-help and coping, where you can get help starting or finding a self-help group. The service is free and needs no referral.
- **hours-nb:** Telefon hverdager 9–15
- **hours-en:** Phone weekdays 9–15

### 229. Rask psykisk helsehjelp – Bydel Alna
- **nb:** Kortvarig og gratis behandling for deg med bostedsadresse i bydel Alna som har milde til moderate psykiske plager. Du tar kontakt selv, uten henvisning fra lege.
- **en:** Short-term, free treatment for people registered as living in the Alna district with mild to moderate mental health difficulties. You get in touch yourself, without a doctor's referral.

### 230. Rask psykisk helsehjelp – Bydel Ullern
- **nb:** Kortvarig og gratis behandling for deg i bydel Ullern som har milde til moderate psykiske plager. Telefonen er bare bemannet én time i uken, så ring innenfor telefontiden.
- **en:** Short-term, free treatment for people in the Ullern district with mild to moderate mental health difficulties. The phone is staffed only one hour a week, so call within the stated time.
- **hours-nb:** Telefonen er bemannet torsdager 12:00–13:00
- **hours-en:** Phone staffed Thursdays 12:00–13:00

### 231. Rask psykisk helsehjelp – Bydel Vestre Aker
- **nb:** Gratis korttidsbehandling for deg over 16 år i bydel Vestre Aker med milde til moderate psykiske utfordringer. Du trenger ikke henvisning.
- **en:** Free short-term treatment for people over 16 in the Vestre Aker district with mild to moderate mental health difficulties. No referral is needed.

### 232. Ung Arena Oslo sentrum
- **nb:** Gratis lavterskeltilbud med samtaler og veiledning for deg mellom 12 og 25 år som har det vanskelig psykisk. Du trenger ingen henvisning, og på torsdager kan du komme på drop-in.
- **en:** A free low-threshold service offering conversations and guidance for people aged 12 to 25 who are struggling mentally. No referral is needed, and on Thursdays you can drop in.
- **hours-nb:** Drop-in torsdager 14:00–17:00
- **hours-en:** Drop-in Thursdays 14:00–17:00

### 233. Kontoret for fri rettshjelp, Oslo kommune
- **nb:** Gratis juridisk rådgivning fra advokater for deg som bor i Oslo og omegn. Alle får inntil en halvtime med advokat, og du kan bestille time eller komme på drop-in på ettermiddagen.
- **en:** Free legal advice from lawyers for people living in Oslo and the surrounding area. Everyone gets up to half an hour with a lawyer, and you can book a time or come to the afternoon drop-in.
- **hours-nb:** Timeavtaler mandag–fredag 08:00–15:30. Drop-in mandag–torsdag 16:00–19:00
- **hours-en:** Appointments Monday–Friday 08:00–15:30. Drop-in Monday–Thursday 16:00–19:00

### 234. JURK – Juridisk rådgivning for kvinner
- **nb:** Gratis rettshjelp fra jusstudenter til kvinner og personer som definerer seg som kvinner, i saker om blant annet vold, familie, arbeid, bolig og gjeld. Nye saker tas imot i egne tider.
- **en:** Free legal aid from law students for women and people who identify as women, in areas such as violence, family, work, housing and debt. New cases are taken during separate opening times.
- **hours-nb:** Nye saker: mandag 12:00–15:00, onsdag 09:00–12:00 (kun telefon) og onsdag 17:00–20:00
- **hours-en:** New cases: Monday 12:00–15:00, Wednesday 09:00–12:00 (phone only) and Wednesday 17:00–20:00

### 235. Gatejuristen
- **nb:** Gratis rettshjelp til deg som har eller har hatt rusproblemer. Kontaktinformasjon må hentes fra Gatejuristens egne nettsider.
- **en:** Free legal aid for people who have, or have had, substance use problems. Contact details must be taken from Gatejuristen's own website.

### 236. Barnevernvakten i Oslo
- **nb:** Barnevernets akuttberedskap for barn og unge i akutte situasjoner. Både barn selv og voksne som er bekymret for et barn kan ta kontakt.
- **en:** The child welfare emergency service for children and young people in urgent situations. Both children themselves and adults worried about a child can get in touch.

### 237. Familievernkontoret Christiania
- **nb:** Gratis tilbud om samtale, parterapi, foreldreveiledning og mekling. Du trenger ingen henvisning for å bestille time. Kontoret samarbeider med bydelene Søndre Nordstrand, Nordstrand, Grünerløkka og Frogner.
- **en:** A free service offering counselling, couples therapy, parenting guidance and mediation. No referral is needed to book. The office works with the Søndre Nordstrand, Nordstrand, Grünerløkka and Frogner districts.
- **hours-nb:** Åpent 08.15–15.30, telefontid 08.30–15.00
- **hours-en:** Open 08.15–15.30, phone hours 08.30–15.00

### 238. Familievernkontoret Enerhaugen
- **nb:** Gratis tilbud om samtale, parterapi, foreldreveiledning og mekling. Du trenger ingen henvisning for å bestille time. Kontoret samarbeider med bydelene Alna, Gamle Oslo, Østensjø og Nordre Aker.
- **en:** A free service offering counselling, couples therapy, parenting guidance and mediation. No referral is needed to book. The office works with the Alna, Gamle Oslo, Østensjø and Nordre Aker districts.
- **hours-nb:** 08.30–15.00
- **hours-en:** 08.30–15.00

### 239. Familievernkontoret Homansbyen
- **nb:** Gratis tilbud om samtale, parterapi, foreldreveiledning og mekling. Du trenger ingen henvisning for å bestille time. Kontoret samarbeider med bydelene St. Hanshaugen, Ullern, Sagene og Vestre Aker.
- **en:** A free service offering counselling, couples therapy, parenting guidance and mediation. No referral is needed to book. The office works with the St. Hanshaugen, Ullern, Sagene and Vestre Aker districts.
- **hours-nb:** 08.30–15.00
- **hours-en:** 08.30–15.00

### 240. Familievernkontoret Oslo Nord
- **nb:** Gratis tilbud om samtale, parterapi, foreldreveiledning og mekling. Du trenger ingen henvisning for å bestille time. Kontoret samarbeider med bydelene Bjerke, Grorud og Stovner.
- **en:** A free service offering counselling, couples therapy, parenting guidance and mediation. No referral is needed to book. The office works with the Bjerke, Grorud and Stovner districts.
- **hours-nb:** 08.30–15.30
- **hours-en:** 08.30–15.30

### 241. Gamle Oslo helsestasjon for ungdom (HFU)
- **nb:** Gratis helsestasjon for ungdom, med helsesykepleier, lege og samtaler om kropp, seksualitet, psykisk helse og andre ting du lurer på. Du kan bruke hvilken som helst helsestasjon for ungdom i Oslo.
- **en:** A free youth health clinic with nurses, a doctor and conversations about your body, sexuality, mental health and anything else on your mind. You can use any youth health clinic in Oslo.
- **hours-nb:** Telefontid tirsdag og torsdag 11:00–14:00
- **hours-en:** Phone hours Tuesday and Thursday 11:00–14:00

### 242. Helsestasjon for ungdom (HFU) i Oslo
- **nb:** Alle ungdommer i Oslo mellom 12 og 24 år kan bruke helsestasjon for ungdom, og tjenestene er gratis. Du velger fritt hvilken helsestasjon du vil gå til.
- **en:** All young people in Oslo aged 12 to 24 can use a youth health clinic, and the services are free. You are free to choose whichever clinic you want to go to.

### 243. Oslohjelpa
- **nb:** Gratis lavterskeltilbud som skal hjelpe barn, unge og familier raskt når de trenger det. Du trenger ingen henvisning, og du tar kontakt med Oslohjelpa i din egen bydel.
- **en:** A free low-threshold service meant to help children, young people and families quickly when they need it. No referral is needed, and you contact Oslohjelpa in your own district.

### 244. Boligkontorene i Oslo
- **nb:** Alle bydeler i Oslo har et boligkontor som hjelper deg med å søke kommunal bolig og kommunal bostøtte. Du finner riktig kontor ved å velge bydelen din eller søke opp adressen din.
- **en:** Every district in Oslo has a housing office that helps you apply for municipal housing and municipal housing benefit. You find the right office by choosing your district or searching for your address.

### 245. Stovner boligkontor
- **nb:** Boligkontoret i bydel Stovner, som hjelper deg med å søke kommunal bolig og kommunal bostøtte. Du kan få hjelp til å fylle ut søknaden.
- **en:** The housing office in the Stovner district, which helps you apply for municipal housing and municipal housing benefit. You can get help filling in the application.

### 246. Økonomisk rådgivning og gjeldsrådgivning, Oslo kommune
- **nb:** Hjelp til deg som sliter med å betale regninger eller gjeld, med råd om økonomi og gjeldsordning. Du tar kontakt med Nav-kontoret i bydelen din for å avtale time.
- **en:** Help for people struggling to pay bills or debt, with advice on finances and debt settlement. You contact the Nav office in your district to book an appointment.

### 247. Bymisjonssenteret, Oslo (Kirkens Bymisjon)
- **nb:** Kirkens Bymisjons senter på Grønland, med møteplasser, aktiviteter og oppfølging for mennesker i vanskelige livssituasjoner.
- **en:** Kirkens Bymisjon's centre at Grønland, with meeting places, activities and follow-up for people in difficult life situations.

## Overlaps

Services already present in `docs/seed-data.md` (rows 1–22) that would otherwise have been added
here. **None of these are duplicated above.**

- **Jussbuss** — row 7 of `seed-data.md`, listed as `(national)`. Jussbuss is physically in Oslo
  (it shares Jusshuset with JURK and Gatejuristen) and appears on Oslo kommune's own list of
  tilbud. If Varde ever wants Oslo-local legal aid to surface together, the cleanest fix is to
  adjust row 7's `Serves` field rather than create a second Jussbuss row.
- **Legevakt / 116 117** — row 3 of `seed-data.md` is the national 116 117 entry. Row 222 above is
  the **Oslo-specific** Legevakten i Oslo entry, with its own address, 00–24 hours and a possible
  second number (23 48 72 00). These are related but not the same record. If Malin would rather
  not carry both, drop row 222 and keep the national one.
- **Navs økonomi- og gjeldsveiledningstelefon (55 55 33 39)** — row 6 of `seed-data.md`. It is the
  national gjeld line and is the practical answer for Oslo too; row 246 above is the Oslo kommune
  page that routes people to their local Nav office, not a duplicate number.
- **Alarmtelefonen for barn og unge (116 111)**, **VO-linjen (116 006)**, **Kirkens SOS**,
  **Hjelpetelefonen (116 123)**, **Rustelefonen** — all national, all already in `seed-data.md`
  (rows 1, 2, 4, 5, 8). Oslo kommune's "Trenger du noen å snakke med?" page links to several of
  them plus chat services (soschat.no, korspaahalsen.rodekors.no,
  mentalhelseungdom.no/vare-lavterskeltilbud/chat/, rusinfo.no). **None of those chats have stated
  hours on that Oslo page**, and they are national services, so I have not created rows for them.
  They are worth adding as national rows in a separate pass, sourced from each operator's own site.

## What is missing, and why

Recorded so the gaps are visible rather than silently absent.

- **Chat channels.** Only one Oslo-run chat was found with stated hours: **Unge Relasjoner**
  (row 217). No Nav Oslo office page advertises a chat. Oslo kommune's own pages link to national
  chats but state no hours for them.
- **Gjeldsrådgivning** has no Oslo-specific phone number on any kommune page I could read — it is
  delivered through the bydel Nav offices (rows 201–215).
- **Rask psykisk helsehjelp** exists in more bydeler than the three sourced here (rows 229–231).
  Oslo kommune has a page per bydel; the rest were not fetched. Adding them is straightforward
  but each needs its own page read.
- **Helsestasjon for ungdom** likewise exists per bydel; only one was fetched (row 241), and that
  one has a URL/title mismatch.
- **Boligkontorer** exist in all 15 bydeler; one was sampled (row 245).
- **Not sourced at all:** Fransiskushjelpen, 24SJU, Møtestedet Oslo, Gatejuristen's contact
  details, Ung Arena Oslo vest, Barnevernvakten's address and hours.
