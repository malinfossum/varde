# Seed data — Innlandet ring + national additions

**Status: VERIFICATION GATE CLOSED 2026-08-17** — bulk-accepted by Malin under the no-calls
policy (see seed-data.md's status block for the full rule).

Row numbers continue from `docs/seed-data.md` and start at 101, so nothing here collides with the
existing 22 rows. That file is untouched. `Verified` is the date each value was read off the cited
source page; `Checked` stays unticked until the row passes the verification gate. (Policy change
2026-08-17, Malin: no phone calls — source verification is sufficient; conflicts resolve by
source hierarchy, the service's own page winning over re-listings.)

Every phone number, address, URL and opening hour below was read off the cited page in this
session. Where a value could not be found on an official source, the cell is empty and the Notes
column says `NOT FOUND`. Numbers belonging to named individuals were deliberately **not** seeded —
they are recorded in Notes only, so Malin can decide whether they are service lines.

Services that already exist in `seed-data.md` and simply also cover one of the four new kommuner are
**not** duplicated here. They are recorded in the `## Coverage map` section instead.

| # | Name | Municipality | Serves | Categories | Phone | Chat | Website | Opening hours | Source URL | Verified | Checked | Notes |
|---|------|--------------|--------|------------|-------|------|---------|----------------|------------|----------|---------|-------|
| 101 | Nav Ringsaker | Ringsaker | | okonomi, arbeid, bolig | 5555 3333 | | https://www.nav.no/kontor/nav-ringsaker | Mandag 12.00-14.00, onsdag 12.00-14.00, fredag 10.00-12.00 | https://www.ringsaker.kommune.no/tjenester/individ-og-samfunn/sosiale-tjenester-i-nav | 2026-08-13 | ☑ | Phone copied exactly as the kommune page prints it ("5555 3333"); nav.no/kontor/nav-ringsaker prints the same digits as "55 55 33 33". Same unusual grouping problem as row 11 (Nav Hamar). Drop-in hours identical on both pages. Besøksadresse "Nordåsvegen 4, Brumunddal" on the kommune page, "Nordåsvegen 4, 2382 BRUMUNDDAL" on nav.no. nav.no marks Tue and Thu "Kun timeavtale". |
| 102 | Psykisk helse- og rustjenester, Ringsaker kommune | Ringsaker | | psykisk-helse, rus | 62 33 52 20 | | https://www.ringsaker.kommune.no/tjenester/helse-og-omsorg/psykisk-helse-og-rustjenester | Kan kontaktes i tidsrommet 08-15.30 | https://www.ringsaker.kommune.no/tjenester/helse-og-omsorg/psykisk-helse-og-rustjenester | 2026-08-13 | ☑ | 62 33 52 20 confirmed on two separate Ringsaker kommune pages (the service page and the vakttelefon list). Besøksadresse Brugata 3, 2380 Brumunddal. E-post postmottak.psykisk.helse@ringsaker.kommune.no. Page states 24-hour availability only for users who already have an approved vedtak — do not present the line as døgnåpen. |
| 103 | Barneverntjenesten i Ringsaker | Ringsaker | | familie-og-barn | 47 47 27 87 | | https://www.ringsaker.kommune.no/tjenester/barn-oppvekst-og-laering/barnevern/melding-til-barneverntjenesten | Hverdager 08.00–15.30 | https://www.ringsaker.kommune.no/tjenester/barn-oppvekst-og-laering/barnevern/melding-til-barneverntjenesten | 2026-08-13 | ☑ | CONFLICT (grouping only): this page prints "47 47 27 87", Ringsaker's own vakttelefon list prints "474 72 787". Identical digits, two groupings on two kommune pages — pick one. Besøksadresse Administrasjonsbygget, Furnesvegen 28, 2382 Brumunddal. Outside 15.30–08.00 the page refers callers to the interkommunale barnevernvakt — see Coverage map, do not seed a second row. |
| 104 | Nav Stange | Stange | | okonomi, arbeid, bolig | 55553333 | | https://www.nav.no/kontor/nav-stange | Drop-in mandag, onsdag og fredag 10.00-12.00; selvbetjening hverdager 09.00-14.30 | https://www.stange.kommune.no/sosiale-tjenester/nav/ | 2026-08-13 | ☑ | Phone copied unspaced exactly as the kommune page prints it; nav.no/kontor/nav-stange prints "55 55 33 33". Drop-in hours agree on both pages. Besøksadresse Storgata 43, 2335 Stange (note: the kommune's own footer address is Storgata 45 — that is the rådhus, not the Nav office). E-post nav.stange@nav.no. The page also prints the Nav-leder's number 99321516 — a named individual, NOT seeded. It also prints "55553339", which is the national gjeldstelefon already in row 6. |
| 105 | Stangehjelpa (avdeling for psykisk helse og rus), Stange kommune | Stange | | psykisk-helse, rus | 62562300 | | https://www.stange.kommune.no/helse-og-mestring/psykisk-helse-og-rus/stangehjelpa/ | Telefontid hverdager 09.00-15.00 (stengt 11.00-11.45) | https://www.stange.kommune.no/helse-og-mestring/psykisk-helse-og-rus/stangehjelpa/om-oss-og-om-vart-samarbeid/slik-samarbeider-vi/ | 2026-08-13 | ☑ | Phone printed unspaced as "62562300" on both the Stangehjelpa landing page and the samarbeid page — consider normalising to 62 56 23 00 after Malin confirms. Telefontid with the 45-minute lunch closure is stated on the samarbeid page. Addresses: voksen og småbarn Dr. Thorshaugsveg 25, 2335 Stange; PPT og barn/unge Stange rådhus, Storgata 45; aktivitetshuset Skolegata 13. The "her finner du oss" page lists ten named employees' mobiles — NONE seeded. |
| 106 | Psykososial krisehjelp, Stange kommune | Stange | | psykisk-helse | 90805567 | | https://www.stange.kommune.no/helse-og-mestring/psykisk-helse-og-rus/psykososial-krisehjelp/ | Hverdager til 15.30 (16.00 fredag) settes over til Stangehjelpa | https://www.stange.kommune.no/helse-og-mestring/psykisk-helse-og-rus/psykososial-krisehjelp/ | 2026-08-13 | ☑ | Printed unspaced as "90805567" under "Kontaktinformasjon". The routing is layered and must be shown carefully: weekdays until 15.30 (16.00 on Fridays) the call goes to Stangehjelpa; after 15.30 it goes to Høgmyr omsorgsboliger, which the page says has no akuttberedskap; Friday 16.00 to Monday 08.00 and holidays it goes to the interkommunale kriseteam. Do NOT present this as a 24-hour crisis line. |
| 107 | Barneverntjenesten i Stange | Stange | | familie-og-barn | 90542305 | | https://www.stange.kommune.no/helse-og-mestring/barn-unge-og-familie/barnevern/ | Vakttelefon mandag–fredag 08.30–15.30 | https://www.stange.kommune.no/helse-og-mestring/barn-unge-og-familie/barnevern/ | 2026-08-13 | ☑ | Seeded number is the "Barnevernstjenestens vakttjeneste" line, printed unspaced as "90542305", open Mon–Fri 08.30–15.30. The same page also prints the switchboard "62562000" (office hours 08:00-15:30, rådhuset 09:00-15:00) and the barnevernleder's mobile "95476504" — the leader's number is NOT seeded. Outside hours the page refers to "116111/ 40404015" — see Coverage map. |
| 108 | Nav Løten | Løten | | okonomi, arbeid, bolig | 55 55 33 33 | | https://www.nav.no/kontor/nav-loten | | https://www.loten.kommune.no/helse-sosial-og-familie/sosiale-tjenester-og-nav/nav-loten/ | 2026-08-13 | ☑ | RESOLVED 2026-08-17 (was CONFLICT): omit the selvbetjening/drop-in detail entirely — Malin's decision. The kommune page says the veiledningssenter is open for selvbetjening 09.00–15.00 every day; nav.no/kontor/nav-loten marks every weekday "Kun timeavtale"; both reconfirmed live, unresolvable without a call, so neither ships. The kommune page also gives a direct akutt/krise line 948 51 485 (mandag, onsdag, fredag 09.00–15.00 and tirsdag, torsdag 09.00–13.00) — narrow hours, do not present it as an emergency number. Besøksadresse Kildevegen 1, 2340 Løten; e-post nav.loten@nav.no. |
| 109 | Økonomisk rådgivning, Nav Løten | Løten | | okonomi | 55 55 33 33 | | https://www.loten.kommune.no/helse-sosial-og-familie/sosiale-tjenester-og-nav/okonomisk-radgivning/ | Mandag, onsdag og fredag 09.00 – 15.00; tirsdag og torsdag 09.00 – 13.00 | https://www.loten.kommune.no/helse-sosial-og-familie/sosiale-tjenester-og-nav/okonomisk-radgivning/ | 2026-08-13 | ☑ | RESOLVED 2026-08-17 (was CONFLICT with row 6 of seed-data.md, no-calls policy): nav.no's own 55 55 33 39 wins for the national gjeldstelefon (row 6); this page's "800 45 353" is a kommune re-listing and ships nowhere. This row is unaffected — it uses the general Nav line 55 55 33 33, also printed on this page. The stated hours belong to the local veileder line 948 51 485, also printed here. Not a separate organisation from Nav — consider merging into row 108 if the DB prefers one row per office. |
| 110 | Psykisk helse og rus-teamet (ROP-team), Løten kommune | Løten | | psykisk-helse, rus | 904 74 982 | | https://www.loten.kommune.no/helse-sosial-og-familie/psykisk-helse-og-rus/psykisk-helse-og-rus-kategori/ | Krisetelefon mandag – fredag kl. 08.00-15.00 | https://www.loten.kommune.no/helse-sosial-og-familie/psykisk-helse-og-rus/psykisk-helse-og-rus-kategori/ | 2026-08-13 | ☑ | 904 74 982 confirmed on two separate Løten kommune pages (the service page, labelled "Krisetelefon", and the kriseberedskap page, where it is staffed by ROP-teamet on dagtid and by hjemmebaserte tjenester 15:30–08:00). The service page also lists three named employees' mobiles (avdelingsleder, tildelingsteam, virksomhetsleder) — NONE seeded. Weekends and holidays route to the interkommunale kriseteam, see Coverage map. |
| 111 | Barnevernet i Løten | Løten | | familie-og-barn | 948 70 878 | | https://www.loten.kommune.no/helse-sosial-og-familie/barn-unge-og-familie/barnevern/ | Mandag - fredag kl. 08:00-15:30 | https://www.loten.kommune.no/helse-sosial-og-familie/barn-unge-og-familie/barnevern/ | 2026-08-13 | ☑ | Seeded number is the one labelled "Resepsjon barnevernet i Løten". The same page also prints the barnevernleder's mobile (971 13 058) and the virksomhetsleder's (489 94 050) — named individuals, NOT seeded. RESOLVED 2026-08-17 (was AMBIGUOUS, no-calls policy): the seeded number is the one labelled "Resepsjon barnevernet i Løten", so the resepsjon's labelled hours "Mandag - fredag kl. 08:00-15:30" apply; the page's unlabelled "Hverdager kl. 08:30-15:00" string is ignored as unattributable. |
| 112 | Rask psykisk helsehjelp (RPH), Løten kommune | Løten | | psykisk-helse | | | https://www.loten.kommune.no/helse-sosial-og-familie/psykisk-helse-og-rus/rask-psykisk-helsehjelp-rph/ | kl. 08.00-15.30 | https://www.loten.kommune.no/helse-sosial-og-familie/psykisk-helse-og-rus/rask-psykisk-helsehjelp-rph/ | 2026-08-13 | ☑ | RESOLVED 2026-08-17: seed with empty phone — Malin's decision. The only numbers on the page are listed under two first names ("Pål 415 58 006", "Andrine 917 41 079") — individual therapists' mobiles, not a service line; they are NOT seeded and no call is needed. The row ships website-only. Kildevegen 1, 2340 Løten. Free, age 16+, no referral needed. |
| 113 | Nav Elverum | Elverum | | okonomi, arbeid, bolig | 55 55 33 33 | | https://www.nav.no/kontor/nav-elverum | Telefontid hverdager kl. 09 - 15 | https://www.elverum.kommune.no/vare-tjenester/helse-omsorg-og-sosiale-tjenester/sosiale-tjenester/nav-i-elverum/ | 2026-08-13 | ☑ | RESOLVED 2026-08-17 (was CONFLICT): use nav.no's postcode — "St. Olavs gate 4, 2414 Elverum" (NAV's own source wins for a NAV office; the kommune page had 2406). TIME-LIMITED: the kommune page states the reception is closed from Monday 3 August for roughly 12 weeks for renovation — a temporary-closure line is now in the description; nav.no currently marks every weekday "Kun timeavtale". Re-check before launch (closure ends ~late October 2026). |
| 114 | Barneverntjenesten i Elverum | Elverum | | familie-og-barn | 94 01 77 70 | | https://www.elverum.kommune.no/vare-tjenester/barnehage-og-skole/barnevern/kontakt-barnevernet/ | Mandag - fredag kl. 08 - 15 | https://www.elverum.kommune.no/vare-tjenester/barnehage-og-skole/barnevern/kontakt-barnevernet/ | 2026-08-13 | ☑ | Phone hours "mandag - fredag kl. 08 - 15" and besøkstid "mandag - fredag kl. 08 - 15.30" are stated separately on the page — the seeded hours are the phone hours. Besøksadresse Helsehuset, Kirkevegen 47, 2413 Elverum. Outside hours the page refers to barnevernvakta 40 40 40 15 — see Coverage map, do not seed a second row. |
| 115 | Lavterskel rus- og psykisk helsehjelp (Annekset og Grip), Elverum kommune | Elverum | | rus, psykisk-helse | 993 72 609 | | https://www.elverum.kommune.no/vare-tjenester/helse-omsorg-og-sosiale-tjenester/rus-og-psykisk-helsetjenester/lavterskel-rus-og-psykisk-helsehjelp/ | | https://www.elverum.kommune.no/vare-tjenester/helse-omsorg-og-sosiale-tjenester/rus-og-psykisk-helsetjenester/lavterskel-rus-og-psykisk-helsehjelp/ | 2026-08-13 | ☑ | AMBIGUOUS NAME: 993 72 609 is printed on the page next to "Annekset" and "Grip" at Hummeldalsvegen 1 / Amundsengården, but the page's own heading for the whole service is "Lavterskel rus og psykisk helsehjelp" and it also refers to a "Mestringsteam". Confirm the correct public name before publishing. No opening hours stated — NOT FOUND. The page also prints an avdelingsleder's mobile (477 95 870) — a named individual, NOT seeded. Elverum's own contact page for psykisk helse og rusomsorg returns 404. |
| 116 | Ambulant akutt enhet (AAE), DPS Elverum-Hamar | Elverum | | psykisk-helse | 915 06 200 | | https://www.elverum.kommune.no/vare-tjenester/helse-omsorg-og-sosiale-tjenester/rus-og-psykisk-helsetjenester/er-du-i-en-krisesituasjon-og-trenger-akutt-hjelp/ | Mandag – fredag kl. 07.30 - 15.30 | https://www.elverum.kommune.no/vare-tjenester/helse-omsorg-og-sosiale-tjenester/rus-og-psykisk-helsetjenester/er-du-i-en-krisesituasjon-og-trenger-akutt-hjelp/ | 2026-08-13 | ☑ | RESOLVED 2026-08-17: Serves cleared — Malin's decision; an unstated coverage claim doesn't become a database row. This is a specialist health service (Sykehuset Innlandet), not a kommunal one — the name "DPS Elverum-Hamar" implies it covers both, but nothing on the page states it. Re-add Hamar only if Sykehuset Innlandet confirms. Number and hours read off Elverum kommune's crisis page; not corroborated on the health trust's own site. |
| 117 | Nok. Elverum Ressurssenter | Elverum | | vold-og-overgrep | 97 15 98 10 | | https://www.nokelverum.no | | https://www.elverum.kommune.no/vare-tjenester/helse-omsorg-og-sosiale-tjenester/vold-og-overgrep/nok-senteret-ved-seksuelle-overgrep/ | 2026-08-13 | ☑ | Name, number and address (Storgata 10, 2408 Elverum) read off Elverum kommune's own page; e-post post@nokelverum.no. Opening hours NOT FOUND — the kommune page states none. The centre's own site www.nokelverum.no was not read in this session, so the Website value is the URL as printed on the kommune page, not a page I opened. Verify both before publishing. |
| 118 | Nok. Hamar | Hamar | Løten | vold-og-overgrep | 91 69 17 14 | | https://www.nokhamar.no | | https://www.nokhamar.no | 2026-08-17 | ☑ | RESOLVED 2026-08-17 (was LOW CONFIDENCE + CONFLICT, no-calls policy): phone and website replaced with the centre's own — nokhamar.no fetched live 2026-08-17 prints 91 69 17 14 and post@nokhamar.no; the org's own site wins over the kommune re-listing. Løten kommune's kriseberedskap page (https://www.loten.kommune.no/politikk-og-organisasjon/krise-og-beredskap-1/kontakter-ved-krise/) prints 62 53 34 01 under "Nok. Hamar" — not shipped, kept as the kommune variant; that page remains the sole source for Serves: Løten. Opening hours and address still NOT FOUND (neither page prints them). |
| 119 | Husbanken | (national) | | okonomi, bolig | 22 96 16 00 | | https://husbanken.no/person/ | Mandag - fredag, kl. 08.00 - 15.45 (15. september - 14. mai); mandag - fredag, kl. 08.00 - 15.00 (15. mai - 14. september) | https://www.husbanken.no/om-husbanken/kontakt/ | 2026-08-13 | ☑ | The number is labelled "Husbankens sentralbord" — a switchboard, not a bostøtte helpline. husbanken.no/person/ carries NO phone number at all; it links to "Bostøtte", "Startlån og tilskudd" and "Lån fra Husbanken". Startlån is applied for through the kommune, not Husbanken, so the UI should not imply Husbanken handles it directly. Postadresse Husbanken, Postboks 1404, 8002 Bodø. E-post post@husbanken.no. Seasonal opening hours will need handling if the UI renders a single hours string. |
| 120 | Skatteetaten | (national) | | okonomi | 800 80 000 | | https://www.skatteetaten.no | Åpningstiden vår er 09:00–14:30 alle hverdager | https://www.skatteetaten.no/kontakt/ | 2026-08-13 | ☑ | Page states "Hovednummeret vårt er 800 80 000. Det er gratis å ringe dette nummeret" and gives +47 22 07 70 00 for calls from abroad. Ringsaker kommune's vakttelefon list independently prints Skatteetaten 800 80 000 — two official sources agree. Folkeregisteret sits under Skatteetaten: its pages live at https://www.skatteetaten.no/person/folkeregister/ on Skatteetaten's own domain. I could NOT find a verbatim sentence on skatteetaten.no saying Skatteetaten forvalter Folkeregisteret — the om-oss page does not say it and the om-folkeregisteret page returned 404, so treat the relationship as inferred from the URL structure. `juridisk-hjelp` NOT applied: nothing on the contact page supports Skatteetaten as a legal-aid provider. Chat: the contact page has a "Start chat" button for a chat robot, but no chat URL is printed — Chat cell left empty. |
| 121 | Kors på halsen (Røde Kors) | (national) | | familie-og-barn, psykisk-helse | 800 33 321 | https://www.korspahalsen.no | https://www.korspahalsen.no | Åpent alle dager, hele året, kl. 14-22 (jule- og sommerferie 16-22) | https://www.rodekors.no/tilbudene/samtaletilbud/ | 2026-08-13 | ☑ | Number, hours and URL read off Røde Kors' own samtaletilbud page. The page also states chat is open until 00.00 on Tuesdays and Thursdays, and that phone support in North Sámi runs every other Wednesday (even weeks) 18–21 — extended hours not folded into the Opening hours cell. Stored as korspahalsen.no (ASCII, fixed 2026-08-17): the å-form fails TLS — the certificate covers only korspahalsen.no. The source page prints it with å; korspaahalsen.rodekors.no redirects to the ASCII form. For barn og unge under 18 år. |
| 122 | Sidetmedord (Mental Helse) | (national) | | psykisk-helse | | https://sidetmedord.mentalhelse.no/ | https://sidetmedord.mentalhelse.no/ | | https://mentalhelse.no/fa-hjelp/ | 2026-08-13 | ☑ | Listed on Mental Helse's own "få hjelp" page as their chat and forum service. sidetmedord.no redirects (301) to sidetmedord.mentalhelse.no. Opening hours NOT FOUND — neither mentalhelse.no/fa-hjelp/ nor the sidetmedord front page prints any, and the om-oss page returned 404. No phone of its own; the site points to Hjelpetelefonen 116 123, which is already row 1. RESOLVED 2026-08-17: own row — a chat-only service with its own site and identity, same pattern as Unge Relasjoner (Oslo row 217); folding it into row 1's chat field would hide it. |

## Descriptions

### 101. Nav Ringsaker
- **nb:** Nav-kontoret for innbyggere i Ringsaker, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Du kan møte opp uten avtale i drop-in-tiden, eller avtale time på forhånd.
- **en:** The Nav office for people living in Ringsaker, offering help with financial assistance, work, housing and other social services. You can come without an appointment during drop-in hours, or book a time in advance.
- **hours-nb:** Mandag 12.00-14.00, onsdag 12.00-14.00, fredag 10.00-12.00
- **hours-en:** Monday 12.00-14.00, Wednesday 12.00-14.00, Friday 10.00-12.00

### 102. Psykisk helse- og rustjenester, Ringsaker kommune
- **nb:** Kommunens tilbud til voksne med psykiske vansker eller rusproblemer, med samtaler, oppfølging og praktisk hjelp i hverdagen. Du kan få inntil fire samtaler uten henvisning.
- **en:** The municipality's service for adults with mental health or substance use difficulties, offering counselling, follow-up and practical everyday support. You can have up to four conversations without a referral.
- **hours-nb:** Kan kontaktes i tidsrommet 08-15.30
- **hours-en:** Reachable between 08.00 and 15.30

### 103. Barneverntjenesten i Ringsaker
- **nb:** Kommunens barneverntjeneste, som tar imot bekymringsmeldinger og gir hjelp til barn, unge og familier som har det vanskelig. Du kan ringe for å drøfte en bekymring før du melder.
- **en:** The municipal child welfare service, which receives reports of concern and helps children, young people and families in difficulty. You can call to discuss a worry before making a formal report.
- **hours-nb:** Hverdager 08.00–15.30
- **hours-en:** Weekdays 08.00–15.30

### 104. Nav Stange
- **nb:** Nav-kontoret for innbyggere i Stange, med hjelp til økonomisk sosialhjelp, arbeid, bolig og andre sosiale tjenester. Veiledningssenteret er åpent for selvbetjening, og du kan komme innom i drop-in-tiden.
- **en:** The Nav office for people living in Stange, offering help with financial assistance, work, housing and other social services. The guidance centre is open for self-service, and you can come by during drop-in hours.
- **hours-nb:** Drop-in mandag, onsdag og fredag 10.00-12.00; selvbetjening hverdager 09.00-14.30
- **hours-en:** Drop-in Monday, Wednesday and Friday 10.00-12.00; self-service weekdays 09.00-14.30

### 105. Stangehjelpa (avdeling for psykisk helse og rus), Stange kommune
- **nb:** Stange kommunes samlede lavterskeltilbud innen psykisk helse og rus, for både barn, unge og voksne. Du trenger ingen henvisning, og kan ta kontakt selv i telefontiden.
- **en:** Stange municipality's combined low-threshold service for mental health and substance use, for children, young people and adults alike. No referral is needed, and you can get in touch yourself during phone hours.
- **hours-nb:** Telefontid hverdager 09.00-15.00 (stengt 11.00-11.45)
- **hours-en:** Phone hours weekdays 09.00-15.00 (closed 11.00-11.45)

### 106. Psykososial krisehjelp, Stange kommune
- **nb:** Kommunens telefon for deg som står i en akutt psykisk krise og trenger noen å snakke med nå. På dagtid settes du over til Stangehjelpa, og i helgene til det interkommunale kriseteamet.
- **en:** The municipality's line for anyone in an acute mental health crisis who needs to talk to someone now. During the day you are put through to Stangehjelpa, and at weekends to the intermunicipal crisis team.
- **hours-nb:** Hverdager til 15.30 (16.00 fredag) settes over til Stangehjelpa
- **hours-en:** Weekdays until 15.30 (16.00 on Fridays) the call goes through to Stangehjelpa

### 107. Barneverntjenesten i Stange
- **nb:** Kommunens barneverntjeneste, som tar imot bekymringsmeldinger og følger opp barn, unge og familier. Vakttelefonen er bemannet på dagtid i ukedagene.
- **en:** The municipal child welfare service, which receives reports of concern and follows up children, young people and families. The duty phone is staffed during weekday daytime hours.
- **hours-nb:** Vakttelefon mandag–fredag 08.30–15.30
- **hours-en:** Duty phone Monday–Friday 08.30–15.30

### 108. Nav Løten
- **nb:** Nav-kontoret for innbyggere i Løten, med hjelp til arbeid, økonomisk sosialhjelp, bolig og forvaltning av egen økonomi. Veiledningssenteret har PC-er du kan bruke, og du kan avtale time med en veileder.
- **en:** The Nav office for people living in Løten, offering help with work, financial assistance, housing and managing your own money. The guidance centre has computers you can use, and you can book a meeting with an adviser.
- (hours lines removed 2026-08-17 — the same resolution that cleared the table cell: the
  selvbetjening detail is omitted entirely; seed OpeningHours = null.)

### 109. Økonomisk rådgivning, Nav Løten
- **nb:** Gratis økonomisk rådgivning for deg som sliter med gjeld eller ikke får budsjettet til å gå opp. Rådgiveren hjelper deg med å få oversikt og ser på muligheter som refinansiering eller gjeldsordning.
- **en:** Free financial counselling for anyone struggling with debt or unable to make the budget add up. The adviser helps you get an overview and looks at options such as refinancing or a debt settlement.
- **hours-nb:** Mandag, onsdag og fredag 09.00 – 15.00; tirsdag og torsdag 09.00 – 13.00
- **hours-en:** Monday, Wednesday and Friday 09.00 – 15.00; Tuesday and Thursday 09.00 – 13.00

### 110. Psykisk helse og rus-teamet (ROP-team), Løten kommune
- **nb:** Kommunens team for voksne med psykiske vansker, rusproblemer eller begge deler. Krisetelefonen er åpen på dagtid i ukedagene, og bemannes av teamet selv.
- **en:** The municipality's team for adults with mental health difficulties, substance use problems or both. The crisis line is open during weekday daytime hours and is staffed by the team itself.
- **hours-nb:** Krisetelefon mandag – fredag kl. 08.00-15.00
- **hours-en:** Crisis line Monday – Friday 08.00-15.00

### 111. Barnevernet i Løten
- **nb:** Kommunens barneverntjeneste, som tar imot bekymringsmeldinger og gir hjelp til barn, unge og familier. Resepsjonen kan svare på spørsmål og sette deg i kontakt med rett person.
- **en:** The municipal child welfare service, which receives reports of concern and helps children, young people and families. Reception can answer questions and put you through to the right person.
- **hours-nb:** Mandag - fredag kl. 08:00-15:30
- **hours-en:** Monday - Friday 08:00-15:30

### 112. Rask psykisk helsehjelp (RPH), Løten kommune
- **nb:** Gratis korttidsbehandling for deg fra 16 år med lettere angst, nedstemthet, stress eller søvnvansker. Hjelpen gis ofte over telefon, med veiledet selvhjelp, og du trenger ingen henvisning.
- **en:** Free short-term treatment for people aged 16 and over with mild anxiety, low mood, stress or sleep problems. Help is often given by phone, using guided self-help, and no referral is needed.
- **hours-nb:** kl. 08.00-15.30
- **hours-en:** 08.00-15.30

### 113. Nav Elverum
- **nb:** Nav-kontoret for innbyggere i Elverum, med hjelp til arbeid, økonomisk sosialhjelp, bolig og sosiale tjenester. Er du i en krisesituasjon uten penger til mat, medisin eller strøm, skal du ta kontakt med en gang. Merk: mottaket er midlertidig stengt for ombygging (ca. 12 uker fra 3. august 2026) — ring eller bruk nav.no i denne perioden.
- **en:** The Nav office for people living in Elverum, offering help with work, financial assistance, housing and social services. If you are in a crisis with no money for food, medicine or electricity, get in touch straight away. Note: the reception is temporarily closed for renovation (about 12 weeks from 3 August 2026) — call or use nav.no during this period.
- **hours-nb:** Telefontid hverdager kl. 09 - 15
- **hours-en:** Phone hours weekdays 09.00 - 15.00

### 114. Barneverntjenesten i Elverum
- **nb:** Kommunens barneverntjeneste, som tar imot bekymringsmeldinger og følger opp barn, unge og familier som trenger hjelp. Både barn selv og voksne som er bekymret kan ta kontakt.
- **en:** The municipal child welfare service, which receives reports of concern and follows up children, young people and families who need help. Both children themselves and worried adults can get in touch.
- **hours-nb:** Mandag - fredag kl. 08 - 15
- **hours-en:** Monday - Friday 08.00 - 15.00

### 115. Lavterskel rus- og psykisk helsehjelp (Annekset og Grip), Elverum kommune
- **nb:** Kommunens lavterskeltilbud til voksne med rusproblemer eller psykiske helseutfordringer, med samtaler og oppfølging. Tilbudet er gratis, og du kan ta kontakt selv.
- **en:** The municipality's low-threshold service for adults with substance use or mental health difficulties, offering conversations and follow-up. The service is free and you can make contact yourself.

### 116. Ambulant akutt enhet (AAE), DPS Elverum-Hamar
- **nb:** Akutteam i spesialisthelsetjenesten for deg som står i en alvorlig psykisk krise og trenger rask vurdering. Teamet kan komme til deg, og er tilgjengelig på dagtid i ukedagene.
- **en:** An acute team within the specialist health service for people in a serious mental health crisis who need a rapid assessment. The team can come to you and is available during weekday daytime hours.
- **hours-nb:** Mandag – fredag kl. 07.30 - 15.30
- **hours-en:** Monday – Friday 07.30 - 15.30

### 117. Nok. Elverum Ressurssenter
- **nb:** Ressurssenter for deg som har opplevd seksuelle overgrep, og for pårørende. Du kan få samtaler og støtte gratis, uten henvisning og uten å ha anmeldt forholdet.
- **en:** A resource centre for people who have experienced sexual abuse, and for their relatives. You can get conversations and support free of charge, without a referral and without having reported it.

### 118. Nok. Hamar
- **nb:** Ressurssenter for deg som har opplevd seksuelle overgrep eller incest, og for pårørende. Tilbudet er gratis, og du trenger ingen henvisning.
- **en:** A resource centre for people who have experienced sexual abuse or incest, and for their relatives. The service is free and no referral is needed.

### 119. Husbanken
- **nb:** Statens virkemiddel i boligpolitikken, med bostøtte til deg som har lav inntekt og høye boutgifter, og startlån og tilskudd til å kjøpe eller beholde bolig. Startlån søker du om gjennom kommunen din.
- **en:** The state housing bank, with housing benefit for people on low incomes with high housing costs, and start-up loans and grants to buy or keep a home. Start-up loans are applied for through your municipality.
- **hours-nb:** Mandag - fredag, kl. 08.00 - 15.45 (15. september - 14. mai); mandag - fredag, kl. 08.00 - 15.00 (15. mai - 14. september)
- **hours-en:** Monday - Friday 08.00 - 15.45 (15 September - 14 May); Monday - Friday 08.00 - 15.00 (15 May - 14 September)

### 120. Skatteetaten
- **nb:** Statlig etat med ansvar for skatt, skattemelding og Folkeregisteret. Hit henvender du deg om skattekort, restskatt, flytting, navneendring og attester fra folkeregisteret.
- **en:** The national tax administration, responsible for tax, tax returns and the National Population Register. Contact them about tax cards, underpaid tax, changes of address, name changes and registry certificates.
- **hours-nb:** Åpningstiden vår er 09:00–14:30 alle hverdager
- **hours-en:** Open 09:00–14:30 every weekday

### 121. Kors på halsen (Røde Kors)
- **nb:** Gratis og anonymt samtaletilbud for barn og unge under 18 år, på telefon, chat og e-post. Du kan snakke med en voksen om akkurat det du har på hjertet, uansett hvor stort eller lite det er.
- **en:** A free and anonymous talking service for children and young people under 18, by phone, chat and email. You can talk to an adult about whatever is on your mind, however big or small.
- **hours-nb:** Åpent alle dager, hele året, kl. 14-22 (jule- og sommerferie 16-22)
- **hours-en:** Open every day, all year, 14.00-22.00 (16.00-22.00 during the Christmas and summer holidays)

### 122. Sidetmedord (Mental Helse)
- **nb:** Mental Helses nettsted der du kan skrive anonymt om det som er vanskelig, i chat eller i forum. Du kan lese om temaer som ensomhet, angst, depresjon og økonomi, og få svar fra andre.
- **en:** Mental Helse's website where you can write anonymously about what is difficult, in chat or on the forum. You can read about topics such as loneliness, anxiety, depression and money, and get replies from others.

## Coverage map

Existing services from `seed-data.md` that also cover one or more of the four new kommuner. These
must be linked through the coverage join, **not** duplicated as new rows.

**Source note (added 2026-08-17):** every mention of "Ringsaker's vakttelefon list" below and in
the row Notes refers to https://www.ringsaker.kommune.no/vakttelefoner-og-viktige-telefonnumre.576290.no.html
— located and content-verified 2026-08-17: all numbers cited from it appear on the live page
(Hjelpetelefonen Mental helse 116 123, Kirkens SOS 22 40 00 40, Legevakt 116 117, Interkommunal
barnevernvakt 404 04 015, Barnevernstjenesten 474 72 787, Interkommunalt krisesenter 62 56 18 30,
Skatteetaten 800 80 000). This closes the check report's four UNVERIFIABLE coverage claims.

### Row 12 — Hamar interkommunale krisesenter → Ringsaker, Stange, Løten, Elverum

One sentence covers all four. Ringsaker kommune's own page states verbatim:

> "Senteret gir krisesentertilbud til innbyggerne i Hamar, Ringsaker, Løten, Stange, Elverum, Engerdal, Våler, Trysil og Åmot kommune."

- Source (all four kommuner in one sentence): https://www.ringsaker.kommune.no/tjenester/brann-og-beredskap/hamar-interkommunale-krisesenter
- Løten, independently: https://www.loten.kommune.no/politikk-og-organisasjon/krise-og-beredskap-1/kontakter-ved-krise/ — lists the krisesenter with 62 56 18 30, hik@hamar.kommune.no, Kronborgveien 23, 2318 Hamar
- Elverum, independently: https://www.elverum.kommune.no/vare-tjenester/helse-omsorg-og-sosiale-tjenester/vold-og-overgrep/krisesenter/ — same number and address
- Stange: covered only by the sentence above; no Stange kommune page was read that states it.
- Note: Ringsaker's and Elverum's pages spell the street "Kronborgveien", row 12 of seed-data.md has "Kronborgvegen". Minor, but pick one.

### Row 14 — Ringsaker interkommunale barnevernvakt → Ringsaker, Stange, Løten, Elverum

- Ringsaker: https://www.ringsaker.kommune.no/tjenester/barn-oppvekst-og-laering/barnevern/melding-til-barneverntjenesten — "40 40 40 15 i tidsrommet 15.30 – 08.00 på hverdager, og hele døgnet på helg og helligdager". Ringsaker's vakttelefon list prints the same digits as "404 04 015".
- Løten: https://www.loten.kommune.no/helse-sosial-og-familie/barn-unge-og-familie/barnevern/ — "Interkommunal barnevernvakt 404 04 015", and the kriseberedskap page repeats 404 04 015.
- Stange: https://www.stange.kommune.no/helse-og-mestring/barn-unge-og-familie/barnevern/ — prints "116111/ 40404015" for evenings and weekends.
- Elverum: https://www.elverum.kommune.no/vare-tjenester/barnehage-og-skole/barnevern/kontakt-barnevernet/ — "Barnevernvakta - åpent utenfor kontortid, telefon: 40 40 40 15", e-post barnevernvakta@ringsaker.kommune.no, and states the service covers thirteen kommuner in the region, running "mellom kl. 15 - 08 på hverdager, og hele døgnet i helgene".
- Note: Elverum says the service runs from 15.00, Ringsaker says from 15.30. Real one-hour discrepancy in the published hours — resolve before launch.

### Row 13 note — interkommunalt kriseteam 952 41 155 → Løten

- https://www.loten.kommune.no/politikk-og-organisasjon/krise-og-beredskap-1/kontakter-ved-krise/ — "Interkommunalt kriseteam 952 41 155", weekend duty Friday 16:00 to Monday 08:00 plus holidays. Same number and same hours as recorded in the Notes of row 13 (Hamar). This is one shared regional service; if it is ever promoted to its own row, Løten and Hamar both link to it.
- Stange's psykososial krisehjelp page also routes weekends to "det interkommunale kriseteamet" but prints no number.

### Row 4 — Alarmtelefonen for barn og unge (116 111) → Ringsaker, Stange, Løten, Elverum

Printed on all four kommuner's pages: Ringsaker's vakttelefon list, Løten's barnevern and kriseberedskap pages, Stange's barnevern page, Elverum's kontakt-barnevernet page ("åpent hele døgnet").

### Row 3 — Legevakt (116 117) → Ringsaker, Løten

- Ringsaker: vakttelefon list. Løten: kriseberedskap page, where it is named "Hedmarken legevakt", Tunbekkvegen 8, Åkershagan, Ottestad.

### Row 5 — VO-linjen (116 006) → Løten, Elverum

- Løten kriseberedskap page and Elverum's crisis page, the latter printing it as "Vold- og overgrepslinjen: 116 006".

### Row 1 — Hjelpetelefonen (116 123) → Ringsaker, Stange, Elverum

- Ringsaker vakttelefon list ("Hjelpetelefonen Mental helse: 116 123"), Stange's psykisk helse og rus page ("Hjelpetelefon Mental Helse 116 123"), Elverum's crisis page ("Hjelpetelefon Mental Helse: 116 123 — Alltid åpen").

### Row 2 — Kirkens SOS (22 40 00 40) → Ringsaker

- Ringsaker vakttelefon list, "Kirkens SOS: 22 40 00 40".

### Row 6 — Navs økonomi- og gjeldsveiledningstelefon → Stange, Løten

- Stange: https://www.stange.kommune.no/sosiale-tjenester/nav/ prints "55553339" — same digits as row 6.
- Løten: https://www.loten.kommune.no/helse-sosial-og-familie/sosiale-tjenester-og-nav/okonomisk-radgivning/ prints "Nav sin gjeldsrådgivningstelefon 800 45 353" — a **different number**. See Verify these first.

### Row 8 — Rustelefonen → Stange, Elverum (bears on the existing row 8 conflict)

- Stange: https://www.stange.kommune.no/helse-og-mestring/psykisk-helse-og-rus/ prints "Rustelefon 08588".
- Elverum: crisis page prints "Rustelefonen: 08588".
- Together with Hamar kommune's list, that is now **three** kommune sources printing 08588 against Rustelefonen's own 915 08 588. The existing seed used 915 08 588.

### Chat addenda to the existing 22 rows

- **Row 2 (Kirkens SOS)** — chat URL https://www.soschat.no. Verified on Kirkens SOS' own pages: the front page links "Skriv SOS Chat" to soschat.no, and https://www.kirkens-sos.no/krisetjenesten lists SOS-chat as one of three channels. `kirkens-sos.no/chat` 302-redirects to soschat.no. **Chat opening hours NOT FOUND** — the krisetjenesten page says only "Chattetjenesten har egne åpningstider som du finner her", and soschat.no renders its content in JavaScript so nothing was readable. Do not assume the phone's døgnåpent applies to the chat; the same page confirms only the telefon and SOS-melding are 24/7.
- **Row 4 (Alarmtelefonen for barn og unge)** — chat via https://www.116111.no. Hours as printed on their own site: "fra kl. 16.15 til 22.45 alle dager bortsett fra lørdag. Da er vi åpne til kl. 23.45". This matches the note already in row 4. Source: https://www.116111.no/
- **Row 5 (VO-linjen)** — chat on https://www.volinjen.no, hours as printed: "chatten er åpen mandag til fredag kl. 09.00 - 15.00". No separate chat URL is printed; the chat opens on the same site. This matches the note already in row 5. Source: https://www.volinjen.no/
- **Row 1 (Hjelpetelefonen, Mental Helse)** — Mental Helse's written channel is Sidetmedord, seeded here as row 122 rather than as a chat field on row 1. Decide which model the DB should use. Source: https://mentalhelse.no/fa-hjelp/
- **Row 6 (Navs økonomi- og gjeldsveiledningstelefon)** — no chat found. https://www.nav.no/800gjeld and https://www.nav.no/okonomi-gjeld print a phone number and hours only. NOT FOUND.

## Verify these first

Rows and coverage entries with a genuine conflict between two official sources, or an ambiguity that
needs a judgement call.

**Status 2026-08-17 — all items below are settled** (no-calls policy: source hierarchy decides;
details in each row's Notes):

1. Gjeldstelefon: nav.no's 55 55 33 39 ships (row 6); Løten's 800 45 353 ships nowhere. ✅
2. Row 112: seeds with empty phone (Malin's decision). ✅
3. Row 118: nokhamar.no found and fetched live — phone now 91 69 17 14 (own site), website added. ✅
4. Row 113: nav.no postcode 2414; closure line added to description. ✅
5. Row 108: selvbetjening detail omitted. ✅
6. Barnevernvakt: 15:30 ships — Ringsaker (operating kommune) verbatim; row 14 updated. ✅
7. Rustelefonen: 915 08 588 stands (own site); short code 08588 now in row 8's description. ✅
8. Arbeidslivstelefonen: 116 123 (tast 3) ships — the org's primary published route; the
   22 56 67 00 sighting on Sidetmedord is noted but not shipped (Malin's decision). ✅
9. Row 103: keep "47 47 27 87" — the grouping printed on the row's cited source page. ✅
10. Row 115: keep the page's own heading "Lavterskel rus- og psykisk helsehjelp (Annekset og
    Grip)" — no cleaner source exists. ✅
11. Row 116: Serves cleared (name-inference, unstated). ✅
12. Skatteetaten/Folkeregisteret: stays as recorded — documentation note, no action. —
13. Row 121: ASCII korspahalsen.no stored (å-form fails TLS). ✅
14. Phone formatting: normalise grouping at seed time to Norwegian convention (landline
    "xx xx xx xx", mobile "xxx xx xxx", short codes as printed) — digits never change; the
    as-printed forms stay in Notes. ✅ (rule, applied during Task 9)
15. NOT FOUND record: stands, minus row 118 (website since found). —

1. **Row 109 / Coverage: Nav's gjeldstelefon** — Løten kommune prints "800 45 353", nav.no prints 55 55 33 39 (row 6 of seed-data.md). Two different numbers on two official sources for the same national service. Neither is seeded in row 109. Ring both. This one matters most: it is the number a person in debt crisis will dial.
2. **Row 112 (Rask psykisk helsehjelp, Løten)** — the only numbers on the page sit under two first names, "Pål 415 58 006" and "Andrine 917 41 079". Phone left empty deliberately. Confirm whether either is a service line before publishing, or drop the row.
3. **Row 118 (Nok. Hamar)** — 62 53 34 01 rests on a single source, Løten kommune's kriseberedskap page. No Nok. Hamar site, address or hours found. Corroborate or drop.
4. **Row 113 (Nav Elverum)** — postcode conflict: kommune page says "2406 Elverum", nav.no says "2414 ELVERUM". Also time-limited: the reception is stated as closed from Monday 3 August for roughly 12 weeks for renovation, so any drop-in hours seeded now will be wrong on launch day.
5. **Row 108 (Nav Løten)** — the kommune page describes selvbetjening open 09.00–15.00 daily; nav.no marks every weekday "Kun timeavtale". Decide which the UI should show.
6. **Coverage: barnevernvakt start time** — Elverum kommune says the vakt runs "mellom kl. 15 - 08", Ringsaker kommune says "15.30 – 08.00". A real one-hour gap in the published hours of the same service. Row 14 of seed-data.md currently says 15:00–08:00.
7. **Coverage: Rustelefonen (row 8)** — Stange and Elverum kommune pages both print "08588", joining Hamar's list. Three kommune sources against Rustelefonen's own 915 08 588, which is what row 8 seeds. Worth re-deciding.
8. **Row 9 of seed-data.md (Arbeidslivstelefonen)** — new evidence, not a new conflict: Mental Helse's own sidetmedord.mentalhelse.no prints **both** "Arbeidslivstelefonen 116 123 (tast 3)" **and** "22566700" side by side. Hamar kommune's 22 56 67 00 is therefore not stale — both routes appear to be live on Mental Helse's own property. Decide which to show.
9. **Row 103 (Barneverntjenesten i Ringsaker)** — same digits printed two ways on two Ringsaker pages, "47 47 27 87" and "474 72 787". Grouping only, but pick one.
10. **Row 115 (Elverum lavterskel rus/psykisk helse)** — the page carries three candidate names for the same service: "Lavterskel rus og psykisk helsehjelp", "Mestringsteamet", and the locations "Annekset" and "Grip". Elverum's own kontakt page for psykisk helse og rusomsorg returns 404, so there is no cleaner source. Decide the public name.
11. **Row 116 (AAE, DPS Elverum-Hamar)** — `Serves: Hamar` is inferred from the service's name, not stated on the page. Verify with Sykehuset Innlandet or clear the Serves field.
12. **Row 120 (Skatteetaten)** — I could not find a verbatim sentence on skatteetaten.no stating that Skatteetaten forvalter Folkeregisteret; the om-oss page does not say it and the om-folkeregisteret page 404s. The relationship is inferred from Folkeregisteret's pages living on skatteetaten.no. `juridisk-hjelp` was NOT applied for the same reason — nothing on their contact page supports it.
13. **Row 121 (Kors på halsen)** — the URL is printed with a Norwegian å, korspåhalsen.no, and korspaahalsen.rodekors.no 302-redirects to korspahalsen.no. Decide which form to store; an IDN may need punycode in an href.
14. **Rows 101, 104, 105, 106, 107 (unusual phone formatting)** — copied exactly as the source prints them: "5555 3333", "55553333", "62562300", "90805567", "90542305". Same normalisation question as rows 7, 11 and 14 of seed-data.md. Normalise consistently, but only after confirming the digits.
15. **NOT FOUND, for the record** — Kirkens SOS chat opening hours (row 2 addendum); Sidetmedord opening hours (row 122); opening hours and website page content for Nok. Elverum (row 117); everything but the phone for Nok. Hamar (row 118); opening hours for Elverum's lavterskel service (row 115); any phone number on husbanken.no/person/ (row 119); any chat URL on skatteetaten.no/kontakt/ (row 120).
