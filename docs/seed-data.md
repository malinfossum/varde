# Seed data — phase 1

22 candidate services, hand-curated, some of which may be dropped during verification. Every
row is verified against the source website before it becomes a migration. `Verified` is the
date the phone number and website were last checked by a human, and it is what the UI shows as
"Sist bekreftet".

**Status: VERIFICATION GATE CLOSED 2026-08-17.** All rows bulk-accepted by Malin under the
no-calls policy: two independent machine passes against sources (zero transcription
mismatches), every flagged conflict resolved by documented decision or source hierarchy.
Phone numbers are never dial-tested; the service's own page wins over re-listings.

## Categories

Nine categories (decided 2026-08-17: `nodtjenester` added on Malin's request — supersedes the
plan's "category ids 1–8"; Task 9's `Categories.cs` seeds nine). Slugs: `psykisk-helse`,
`familie-og-barn`, `vold-og-overgrep`, `okonomi`, `arbeid`, `bolig`, `rus`, `juridisk-hjelp`,
`nodtjenester` (nb "Nødtjenester" / en "Emergency services").

`nodtjenester` is **strict** (Malin's call 2026-08-17): only services for an ongoing emergency —
legevakt, krisesentre, barnevernvakter, Alarmtelefonen 116 111, VO-linjen 116 006,
overgrepsmottak, psykososial akuttjeneste. Døgnåpne support lines (Hjelpetelefonen 116 123,
Kirkens SOS) stay under `psykisk-helse` — they are support, not emergency response.

## Verify these first

Rows whose Notes flag a genuine conflict between two official sources, or an ambiguity that needs a judgement call:

1. **Row 8 (Rustelefonen)** — ✅ RESOLVED 2026-08-17 (no-calls policy): seed 915 08 588 (the organisation's own site); the short code 08588 — printed by Hamar, Stange and Elverum for the same service — is mentioned in the description. Both are attributed to Rustelefonen by official sources.
2. **Row 9 (Arbeidslivstelefonen)** — ✅ RESOLVED 2026-08-17: seed 116 123 with the keypress in the description. The 22 56 67 00 pairing could not be reproduced by the second checker; the 116 123 route is double-confirmed on Mental Helse's own site.
3. **Row 10 (Familievernkontoret Innlandet Øst, Hamar)** — ✅ RESOLVED 2026-08-17 (no-calls policy): keep Bufdir's 46 61 71 30 — Bufdir runs familievernet, so its page is the service's own source; Hamar kommune's 466 17 150 is a re-listing and stays only in the row note.
4. **Row 13 (Tjeneste psykisk helse og rus, Hamar)** — ✅ RESOLVED 2026-08-17: display name is "Tjeneste psykisk helse og rus" (the service's own page is the primary source; the crisis page is a re-listing).
5. **Row 16 (Gudbrandsdal Krisesenter)** — ✅ RESOLVED 2026-08-17 (no-calls policy): keep 414 81 220 — re-fetched live from gudbrandsdal-krisesenter.no/kontakt the same day (printed twice on the page). Lillehammer kommune's 61 27 92 20 is not shipped; it stays in the row note as an unexplained kommune-page variant.
6. **Row 17 (Housing First, Lillehammer kommune)** — ✅ RESOLVED 2026-08-17, Malin's sosionom call: keep 451 64 131. Kommune team leaders are public-facing and routinely publish their work mobiles as the team's contact; the kommune chose to print it as the team's line.

| # | Name | Municipality | Categories | Phone | Website | Opening hours | Source URL | Verified | Checked | Notes |
|---|------|--------------|------------|-------|---------|----------------|------------|----------|---------|-------|
| 1 | Hjelpetelefonen (Mental Helse) | (national) | psykisk-helse | 116 123 | https://mentalhelse.no | Døgnåpent | https://mentalhelse.no/fa-hjelp/hjelpetelefonen/ | 2026-08-13 | ☑ | Matches the spec's 116 123. Page also gives +47 911 16 123 for calls from abroad, and an administrative number 352 96 060 that is NOT the helpline — do not seed the admin number. Døgnåpen. |
| 2 | Kirkens SOS | (national) | psykisk-helse | 22 40 00 40 | https://www.kirkens-sos.no | Døgnåpent | https://www.kirkens-sos.no/telefon | 2026-08-13 | ☑ | Number was not in the spec; read off Kirkens SOS' own page. Døgnåpen, all year. |
| 3 | Legevakt | (national) | psykisk-helse, nodtjenester | 116 117 | https://www.helsenorge.no/legevakt/ |  | https://www.helsenorge.no/legevakt/ | 2026-08-13 | ☑ | Matches the spec's 116 117. The page renders it unspaced in body text ("Ring 116117") and spaced elsewhere; I used the spaced form per Norwegian convention — worth a second look. Page also states 113 for life-threatening emergencies. |
| 4 | Alarmtelefonen for barn og unge | (national) | familie-og-barn, vold-og-overgrep, nodtjenester | 116 111 | https://www.116111.no | Døgnåpent | https://www.116111.no/omalarmtelefonen | 2026-08-13 | ☑ | Phone and email 24/7. SMS 417 16 111 and chat only 16:15–22:45 (Saturdays to 23:45) — restricted hours, do not present SMS as always-on. From abroad: +47 954 11 755. |
| 5 | VO-linjen | (national) | vold-og-overgrep, nodtjenester | 116 006 | https://www.volinjen.no | Døgnåpent | https://www.volinjen.no/ | 2026-08-13 | ☑ | Phone døgnåpen. Own site says chat is Mon–Fri 09:00–15:00; a third-party listing claimed 09:00–20:00 — I trusted volinjen.no. Chat hours are not seeded, only noted. |
| 6 | Navs økonomi- og gjeldsveiledningstelefon | (national) | okonomi | 55 55 33 39 | https://www.nav.no | Hverdager 09:00–15:00 | https://www.nav.no/800gjeld | 2026-08-13 | ☑ | RESOLVED 2026-08-17 (no-calls policy): keep 55 55 33 39 — nav.no's own current page prints it; the 800 45 353 variant exists only on Løten kommune's page (see ring row 109) and is not shipped. The old "800GJELD" branding no longer maps to a working 800-number on this page. Open weekdays 09–15 only — flag the restricted hours in the UI. |
| 7 | Jussbuss | (national) | juridisk-hjelp | 22 84 29 00 | https://foreninger.uio.no/jussbuss/ | Mandag 17:00–20:00 og tirsdag 10:00–15:00 | https://foreninger.uio.no/jussbuss/ | 2026-08-13 | ☑ | Copied exactly as printed — the site writes it unspaced with country code, unlike every other row. Consider normalising to 22 84 29 00, but only after Malin confirms. Case intake Mon 17:00–20:00 and Tue 10:00–15:00 only; student-run, closed in parts of the summer. Phone normalised from "+47 22842900" as printed on the source, to match the spacing used by every other row. Digits unchanged — verify against the source. |
| 8 | Rustelefonen | (national) | rus | 915 08 588 | https://rustelefonen.no | Hverdager 11:00–14:30 og 15:00–18:00 | https://rustelefonen.no/ | 2026-08-13 | ☑ | RESOLVED 2026-08-17 (was CONFLICT, no-calls policy): seed 915 08 588 (the organisation's own site); short code 08588 (printed by Hamar, Stange, Elverum for this service) mentioned in the description. Weekdays 11:00–14:30 and 15:00–18:00, closed weekends. |
| 9 | Arbeidslivstelefonen (Mental Helse) | (national) | arbeid, psykisk-helse | 116 123 | https://mentalhelse.no |  | https://mentalhelse.no/fa-hjelp/arbeidslivstelefonen/ | 2026-08-13 | ☑ | RESOLVED 2026-08-17 (was CONFLICT): seed 116 123 — Malin's decision; the 22 56 67 00 pairing (Hamar kommune's list) could not be reproduced by the second checker, while the 116 123 + tast 3 route is double-confirmed on mentalhelse.no. The "(tast 3)" suffix will need handling if the UI renders phone numbers as tel: links. Keypress instruction moved out of the Phone field so the number remains a valid tel: link. |
| 10 | Familievernkontoret Innlandet Øst, avdeling Hamar | Hamar | familie-og-barn | 46 61 71 30 | https://www.bufdir.no/familie/familievernkontorer/oversikt/innlandet-ost/ | 08:30–15:00, redusert om sommeren | https://www.bufdir.no/familie/familievernkontorer/oversikt/innlandet-ost/ | 2026-08-13 | ☑ | RESOLVED 2026-08-17 (was CONFLICT, no-calls policy): keep Bufdir's 46 61 71 30 — Bufdir runs familievernet. Hamar kommune's helpline list gives 466 17 150; not shipped, kept here as the kommune-page variant. Vangsvegen 121, 2318 Hamar. Phone hours 08:30–15:00, reduced in summer. |
| 11 | Nav Hamar | Hamar | okonomi, arbeid | 555 53 333 | https://www.nav.no | Drop-in mandag og onsdag 12:00–14:00, fredag 10:00–12:00 | https://www.hamar.kommune.no/sosiale-tjenester-og-nav/nav-hamar/ | 2026-08-13 | ☑ | Formatting copied from the page ("555 53 333") — it is the national Nav number 55 55 33 33 grouped unusually. Address on this page is Torggata 63, 2317 Hamar; a search snippet claimed Vangsvegen 51 — I trusted the kommune page. Drop-in only Mon and Wed 12:00–14:00, Fri 10:00–12:00. |
| 12 | Hamar interkommunale krisesenter | Hamar | vold-og-overgrep, bolig, nodtjenester | 62 56 18 30 | https://www.hamar.kommune.no/familiehjelp-oversikt-over-tilbud/krisesenter/ | Døgnåpent | https://www.hamar.kommune.no/familiehjelp-oversikt-over-tilbud/krisesenter/ | 2026-08-13 | ☑ | 62 56 18 30 confirmed on two separate Hamar kommune pages. Page also lists mobile 907 48 795 and the leader's personal number 948 34 210 — do NOT seed the leader's number. Kronborgveien 23, 2318 Hamar. Døgnåpent. Serves Hamar, Ringsaker, Løten, Stange, Elverum, Engerdal, Våler, Trysil, Åmot. |
| 13 | Tjeneste psykisk helse og rus, Hamar kommune | Hamar | psykisk-helse, rus | 916 03 327 | https://www.hamar.kommune.no/helseogomsorg/psykisk-helse-og-rus/ | Kun dagtid | https://www.hamar.kommune.no/helseogomsorg/psykisk-helse-og-rus/tjeneste-psykisk-helse-og-rus/ | 2026-08-13 | ☑ | RESOLVED 2026-08-17 (was AMBIGUOUS): display name is "Tjeneste psykisk helse og rus" — Malin's decision; the service's own page wins over the crisis page's re-listing of 916 03 327 as "Psykososial krisehjelp". Vangsvegen 121, 2318 Hamar. Daytime only; outside hours the interkommunalt kriseteam is 952 41 155 (Fri 16:00 – Mon 08:00 and holidays). |
| 14 | Ringsaker interkommunale barnevernvakt | Hamar | familie-og-barn, vold-og-overgrep, nodtjenester | 40 40 40 15 | https://www.hamar.kommune.no/familiehjelp-oversikt-over-tilbud/hjelpetelefoner-for-familier-og-barn-unge/ | Kveld og natt 15:30–08:00, samt helger og helligdager | https://www.hamar.kommune.no/familiehjelp-oversikt-over-tilbud/hjelpetelefoner-for-familier-og-barn-unge/ | 2026-08-13 | ☑ | RESOLVED 2026-08-17 (no-calls policy): weekday start is 15:30, per Ringsaker — the operating kommune — whose page states verbatim "40 40 40 15 i tidsrommet 15.30 – 08.00 på hverdager, og hele døgnet på helg og helligdager" (quoted in seed-data-innlandet-ring.md). Elverum's page says 15:00 — the earlier variant, not shipped. The Hamar page lists "Barnevernvakta 404 04 015" separately — identical digits, different grouping, one service under two names. Lillehammer's emergency page prints the same number as 40 40 40 15. |
| 15 | Rask psykisk helsehjelp, Lillehammer kommune | Lillehammer | psykisk-helse, rus | 91 71 33 38 | https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/ | Mandag og onsdag 11:30–13:00 | https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/rask-psykisk-helsehjelp/informasjon-om-rask-psykisk-helsehjelp/ | 2026-08-13 | ☑ | Lillehammer's own contact page prints the same digits as "917 13 338" — identical number, two groupings across two kommune pages. Phone hours Mon and Wed 11:30–13:00 only; very restricted. Age 16+, no referral needed. |
| 16 | Gudbrandsdal Krisesenter IKS | Lillehammer | vold-og-overgrep, nodtjenester | 414 81 220 | https://gudbrandsdal-krisesenter.no |  | https://gudbrandsdal-krisesenter.no/kontakt | 2026-08-13 | ☑ | RESOLVED 2026-08-17 (was CONFLICT, no-calls policy): keep 414 81 220 — the krisesenter's own contact page prints it (also rendered "41 48 12 20"), re-fetched live 2026-08-17 and still printed twice. Lillehammer kommune's emergency page prints 61 27 92 20 for "Krisesenter" — not shipped, unexplained variant. Skoletorget 6 D, 2609 Lillehammer. |
| 17 | Housing First, Lillehammer kommune | Lillehammer | bolig, psykisk-helse | 451 64 131 | https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/ | Hverdager 09:00–15:00 | https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/om-psykisk-helse-og-rus/kontaktinformasjon/ | 2026-08-13 | ☑ | RESOLVED 2026-08-17: keep the number — Malin's sosionom call: kommune team leaders are public-facing and their published work mobiles are the intended team contact. Weekdays 09:00–15:00. |
| 18 | Oppfølgingsteamet, Lillehammer kommune | Lillehammer | rus, psykisk-helse | 902 43 733 | https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/ | Hver dag 09:00–21:00 | https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/om-psykisk-helse-og-rus/kontaktinformasjon/ | 2026-08-13 | ☑ | Same page lists 902 43 733 for Oppfølgingsteamet and "90 24 37 33" for the Gamlevegen 101 lavterskeltilbud — identical digits, so the two entries may be one shared line. Open every day 09:00–21:00, which is unusually wide for a municipal service — worth confirming. |
| 19 | Mottak for seksuelle overgrep, Lillehammer | Lillehammer | vold-og-overgrep, nodtjenester | 61 27 22 16 | https://lillehammer.kommune.no/om-kommunen/kontakt-oss/nod-og-vakttelefoner/ |  | https://lillehammer.kommune.no/om-kommunen/kontakt-oss/nod-og-vakttelefoner/ | 2026-08-13 | ☑ | Listed on the kommune's emergency-numbers page as "Mottak for seksuelle overgrep" (renamed 2026-08-17 — the earlier "Overgrepsmottak" label appears nowhere on the page). No separate service page found, so the formal name and opening hours are unconfirmed — the name in this row is taken from the label, not from the service's own site. |
| 20 | Nav Gjøvik | Gjøvik | okonomi, arbeid, bolig | 55 55 33 33 | https://www.nav.no | Hverdager 09:00–15:00 | https://www.gjovik.kommune.no/tjenester/bolig-og-sosiale-tjenester/nav-gjovik/ | 2026-08-13 | ☑ | 55 55 33 33 is the national Nav line, weekdays 09:00–15:00. The page also gives a local akutt/crisis line 90 01 25 89 staffed only Tue and Thu 12:00–14:00 — narrow hours, so do not present it as an emergency number. Parkgata 10 A, 2815 Gjøvik. |
| 21 | Gjøvik Krisesenter IKS | Gjøvik | vold-og-overgrep, nodtjenester | 61 17 55 60 | https://www.krisesenteret-gjovik.no | Døgnåpent | https://www.krisesenteret-gjovik.no/no/Kontakt-oss.html | 2026-08-13 | ☑ | Printed both spaced ("Telefon: 61 17 55 60") and unspaced ("61175560") on the same page; I used the spaced form. Døgnåpen. Visiting address deliberately withheld by the centre ("Gis ved kontakt") — leave the address field empty, this is a safety measure, not missing data. Postboks 5, 2801 Gjøvik. |
| 22 | Jobbhus Gjøvik | Gjøvik | arbeid | | https://www.gjovik.kommune.no/jobbhus/jeg-onsker-jobb/ |  | https://www.gjovik.kommune.no/jobbhus/jeg-onsker-jobb/ | 2026-08-13 | ☑ | RESOLVED 2026-08-17: seed phone-less (website only) — Malin's decision. No phone number is printed on the service page; it links only to a generic "Kontakt oss" page and an opening-hours page. A collaboration between Gjøvik kommune and Nav, aimed at ages 16–30, with drop-in open to all. |

## Descriptions

### 1. Hjelpetelefonen (Mental Helse)
- **nb:** Gratis og døgnåpen telefontjeneste for alle som trenger noen å snakke med om det som er vanskelig. Du kan være anonym, og de som svarer har taushetsplikt.
- **en:** A free 24-hour phone line for anyone who needs someone to talk to about what is difficult. You can stay anonymous, and everyone who answers is bound by confidentiality.
- **hours-nb:** Døgnåpent
- **hours-en:** Open 24 hours

### 2. Kirkens SOS
- **nb:** Døgnåpen krisetelefon for deg som har det vanskelig eller tenker på selvmord. Tjenesten er anonym, og du trenger ikke ha en bestemt grunn for å ringe.
- **en:** A 24-hour crisis line for anyone in distress or having thoughts of suicide. The service is anonymous, and you do not need a particular reason to call.
- **hours-nb:** Døgnåpent
- **hours-en:** Open 24 hours

### 3. Legevakt
- **nb:** Nasjonalt nummer som setter deg over til legevaktsentralen der du befinner deg, når fastlegen er stengt og du trenger hjelp raskt. Ved akutt livsfare skal du ringe 113.
- **en:** A national number that connects you to the out-of-hours medical service where you are, when your regular doctor is closed and you need help quickly. In a life-threatening emergency, call 113 instead.

### 4. Alarmtelefonen for barn og unge
- **nb:** Gratis døgnåpen telefon for barn og unge som opplever vold, overgrep eller omsorgssvikt. Voksne som er bekymret for et barn kan også ringe.
- **en:** A free 24-hour phone line for children and young people experiencing violence, abuse or neglect. Adults who are worried about a child can call too.
- **hours-nb:** Døgnåpent
- **hours-en:** Open 24 hours

### 5. VO-linjen
- **nb:** Hjelpelinje for deg som opplever vold eller overgrep i nære relasjoner. Også for pårørende og hjelpere, og du kan være helt anonym.
- **en:** A helpline for anyone experiencing violence or abuse in a close relationship. It is also for relatives and professionals, and you can remain completely anonymous.
- **hours-nb:** Døgnåpent
- **hours-en:** Open 24 hours

### 6. Navs økonomi- og gjeldsveiledningstelefon
- **nb:** Gratis veiledning for deg som har økonomiske problemer eller gjeld du ikke klarer å betjene. Du kan få hjelp til å få oversikt over økonomien og sette opp et realistisk budsjett.
- **en:** Free guidance for anyone with money problems or debt they cannot manage. You can get help mapping out your finances and building a budget you can actually live with.
- **hours-nb:** Hverdager 09:00–15:00
- **hours-en:** Weekdays 09:00–15:00

### 7. Jussbuss
- **nb:** Gratis rettshjelp fra jusstudenter i saker om blant annet husleie, gjeld, trygd, arbeid, utlendingsrett og fengsel. Du trenger ikke advokat for å ta kontakt.
- **en:** Free legal aid from law students in areas such as rent, debt, benefits, employment, immigration and prison law. You do not need a lawyer to get in touch.
- **hours-nb:** Mandag 17:00–20:00 og tirsdag 10:00–15:00
- **hours-en:** Monday 17:00–20:00 and Tuesday 10:00–15:00

### 8. Rustelefonen
- **nb:** Anonym telefontjeneste for spørsmål om rus, både for deg som bruker rusmidler selv og for pårørende. Du får informasjon og veiledning uten å bli møtt med pekefinger. Kortnummeret 08588 brukes også for tjenesten.
- **en:** An anonymous phone service for questions about drugs and alcohol, both for people who use substances and for their families. You get information and guidance without being judged. The short code 08588 is also used for the service.
- **hours-nb:** Hverdager 11:00–14:30 og 15:00–18:00
- **hours-en:** Weekdays 11:00–14:30 and 15:00–18:00

### 9. Arbeidslivstelefonen (Mental Helse)
- **nb:** Rådgivning om vanskelige forhold på jobben, som konflikt, mobbing, sykefravær eller oppsigelse. Åpen for arbeidstakere, ledere, tillitsvalgte og arbeidssøkere. Velg tast 3 i menyen.
- **en:** Advice about difficult situations at work, such as conflict, bullying, sick leave or dismissal. Open to employees, managers, union representatives and jobseekers. Choose option 3 in the menu.

### 10. Familievernkontoret Innlandet Øst, avdeling Hamar
- **nb:** Gratis tilbud om samtale, parterapi og mekling for familier, par og enkeltpersoner. Du trenger ingen henvisning for å bestille time.
- **en:** A free service offering counselling, couples therapy and mediation for families, couples and individuals. No referral is needed to book an appointment.
- **hours-nb:** 08:30–15:00, redusert om sommeren
- **hours-en:** 08:30–15:00, reduced in summer

### 11. Nav Hamar
- **nb:** Nav-kontoret for innbyggere i Hamar, med hjelp til økonomisk sosialhjelp, arbeid og andre sosiale tjenester. Du kan møte opp uten avtale i drop-in-tiden, eller avtale time på forhånd.
- **en:** The Nav office for people living in Hamar, offering help with financial assistance, work and other social services. You can come without an appointment during drop-in hours, or book a time in advance.
- **hours-nb:** Drop-in mandag og onsdag 12:00–14:00, fredag 10:00–12:00
- **hours-en:** Drop-in Monday and Wednesday 12:00–14:00, Friday 10:00–12:00

### 12. Hamar interkommunale krisesenter
- **nb:** Gratis døgnåpent tilbud til kvinner, menn, barn og eldre som er utsatt for vold i nære relasjoner. Senteret tilbyr både beskyttet botilbud og samtaler for dem som ikke trenger å bo der.
- **en:** A free 24-hour service for women, men, children and older people affected by violence in close relationships. The centre offers both protected accommodation and counselling for those who do not need to stay.
- **hours-nb:** Døgnåpent
- **hours-en:** Open 24 hours

### 13. Tjeneste psykisk helse og rus, Hamar kommune
- **nb:** Kommunens tilbud til voksne med psykiske vansker eller rusproblemer, med samtaler, oppfølging og praktisk hjelp i hverdagen. Du kan ta kontakt selv, uten henvisning fra lege.
- **en:** The municipality's service for adults with mental health or substance use difficulties, offering counselling, follow-up and practical everyday support. You can make contact yourself, without a doctor's referral.
- **hours-nb:** Kun dagtid
- **hours-en:** Daytime only

### 14. Ringsaker interkommunale barnevernvakt
- **nb:** Barnevernets akuttberedskap på kveld, natt, helg og helligdager for barn og unge i akutte situasjoner. Både barn selv og voksne som er bekymret kan ringe.
- **en:** The child welfare emergency service, staffed evenings, nights, weekends and public holidays for children and young people in urgent situations. Both children themselves and worried adults can call.
- **hours-nb:** Kveld og natt 15:30–08:00, samt helger og helligdager
- **hours-en:** Evenings and nights 15:30–08:00 plus weekends and holidays

### 15. Rask psykisk helsehjelp, Lillehammer kommune
- **nb:** Korttidsbehandling for deg fra 16 år med lettere angst, depresjon, søvnvansker eller begynnende rusproblemer. Tilbudet er gratis, og du trenger ikke henvisning fra fastlegen.
- **en:** Short-term treatment for people aged 16 and over with mild anxiety, depression, sleep problems or early substance use difficulties. The service is free and needs no referral from your doctor.
- **hours-nb:** Mandag og onsdag 11:30–13:00
- **hours-en:** Monday and Wednesday 11:30–13:00

### 16. Gudbrandsdal Krisesenter IKS
- **nb:** Krisesenter for kvinner, menn og barn som er utsatt for vold eller trusler om vold i nære relasjoner. Tilbudet er gratis, og du trenger ingen henvisning.
- **en:** A crisis centre for women, men and children affected by violence or threats of violence in close relationships. The service is free and needs no referral.

### 17. Housing First, Lillehammer kommune
- **nb:** Tilbud til bostedsløse med rus- eller psykiske helseutfordringer, der du først får en varig bolig og deretter oppfølging der du bor. Målet er en stabil bosituasjon uten krav om rusfrihet på forhånd.
- **en:** A service for homeless people with substance use or mental health difficulties, where you first get permanent housing and then receive support where you live. The aim is a stable home without requiring sobriety first.
- **hours-nb:** Hverdager 09:00–15:00
- **hours-en:** Weekdays 09:00–15:00

### 18. Oppfølgingsteamet, Lillehammer kommune
- **nb:** Team som gir tett oppfølging til voksne med rusproblemer eller psykiske helseutfordringer i hverdagen. Teamet har lang åpningstid, også i helgene.
- **en:** A team providing close everyday follow-up for adults with substance use or mental health difficulties. The team has long opening hours, including weekends.
- **hours-nb:** Hver dag 09:00–21:00
- **hours-en:** Every day 09:00–21:00

### 19. Mottak for seksuelle overgrep, Lillehammer
- **nb:** Medisinsk hjelp, undersøkelse og sporsikring for deg som har vært utsatt for voldtekt eller seksuelt overgrep. Du kan ta kontakt uten å ha anmeldt forholdet til politiet.
- **en:** Medical care, examination and forensic evidence collection for people who have experienced rape or sexual assault. You can get in touch without having reported it to the police.

### 20. Nav Gjøvik
- **nb:** Nav-kontoret for innbyggere i Gjøvik, med oppfølging innen økonomi, arbeid, bolig og sosiale tjenester. Du kan komme innom i drop-in-tiden eller avtale time.
- **en:** The Nav office for people living in Gjøvik, offering support with money, work, housing and social services. You can drop in during open hours or book an appointment.
- **hours-nb:** Hverdager 09:00–15:00
- **hours-en:** Weekdays 09:00–15:00

### 21. Gjøvik Krisesenter IKS
- **nb:** Gratis døgnåpent tilbud til kvinner, menn og barn som er utsatt for vold i nære relasjoner, voldtekt eller tvangsekteskap. Adressen oppgis først når du tar kontakt, av hensyn til sikkerheten.
- **en:** A free 24-hour service for women, men and children affected by violence in close relationships, rape or forced marriage. The address is only given when you make contact, for safety reasons.
- **hours-nb:** Døgnåpent
- **hours-en:** Open 24 hours

### 22. Jobbhus Gjøvik
- **nb:** Hjelp til å komme i arbeid for deg mellom 16 og 30 år i Gjøvik, med veiledning, jobbsøking, CV og arbeidspraksis. Drop-in-tilbudet er åpent for alle arbeidssøkere uansett alder og bosted.
- **en:** Help getting into work for people aged 16 to 30 in Gjøvik, with guidance, job applications, CV writing and work placements. The drop-in service is open to all jobseekers regardless of age or where they live.
