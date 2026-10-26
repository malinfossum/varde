# Verification: seed-data-lavterskel-retag.md

Independent re-check of the Lavterskel re-read, all 94 rows (1 to 25, 101 to 122, 201 to 247),
performed 2026-10-26. For each row I fetched every URL in `Source URL` with `curl -sL`, converted
the page to plain text (tags stripped, whitespace and soft hyphens normalised) and checked six things:

1. The Referral quote is on the page character for character and names a badge phrase. On rows
   with an empty quote, I searched the page for "henvisning" and "lavterskel" (also "henvis",
   "terskel" and "lav terskel") and report every sentence the re-read missed.
2. Cost follows the rule table, given what the page says.
3. The Cost note is on the page verbatim, and the cost-en line keeps every number of the cost-nb
   line, digit for digit.
4. Every Category 10 `yes` is a meeting place or activity provider in a kommune, not national.
5. Every "Verify these first" item matches the page.
6. No cell or note names a person or carries a number or email the page ties to a person.

No replacement research was done. A wrong value is reported here, not fixed. Page text was treated
as data only. All pages were reachable. Some Løten and Elverum URLs (rows 108, 109, 110, 112, 113)
redirect to a new path, and I read those at the final URL. Row 16 lists only its front page as
Source URL, so I also fetched `/kontakt`, `/tilbud` and `/om-oss` on that site because its Notes
cite them. Person-tied contacts are reported by row and field only, never with a name, number or
email.

## Verdict table

| # | Name | Verdict | Detail |
|---|------|---------|--------|
| 1 | Hjelpetelefonen (Mental Helse) | PARTIAL | Cost sentence exact, free is right. cost-en adds the number 24 ("24-hour") that cost-nb does not have (check 3). |
| 2 | Kirkens SOS | PARTIAL | Cost note exact. Check 2 judgement: wording is "tar seg ikke betalt", not "gratis", and the page adds that calls cost like a landline call. No Verify item raises it. |
| 3 | Legevakt | CONFIRMED | Egenandel sentence exact, paid fits. Verify item 1 (call free, visit costs) matches the page. |
| 4 | Alarmtelefonen for barn og unge | CONFIRMED | Cost sentence exact, no referral or lavterskel wording on the page. |
| 5 | VO-linjen | CONFIRMED | "Helt gratis og anonymt." exact. Verify item 2 sentence exact (chat 09.00 - 20.00). |
| 6 | Navs økonomi- og gjeldsveiledningstelefon | CONFIRMED | Cost sentence and hours "Åpent hverdager kl. 9–15." exact. |
| 7 | Jussbuss | CONFIRMED | Cost sentence exact. |
| 8 | Rustelefonen | CONFIRMED | Empty cells right: page has no referral, lavterskel or price wording. |
| 9 | Arbeidslivstelefonen (Mental Helse) | CONFIRMED | Empty cells right. Verify item 3 hours sentence exact. |
| 10 | Familievernkontoret Innlandet Øst, avdeling Hamar | CONFIRMED | Quote and "Tilbudet er gratis." exact. |
| 11 | Nav Hamar | CONFIRMED | Empty cells right. Only drop-in wording, which is not a badge phrase. |
| 12 | Hamar interkommunale krisesenter | PARTIAL | Quote exact on both pages, cost sentence exact on the hjelpetelefoner page only (as the Notes say). cost-en adds the number 24 ("24-hour") that cost-nb lacks (check 3). Verify item 4 matches the page. |
| 13 | Tjeneste psykisk helse og rus, Hamar kommune | CONFIRMED | Empty cost right: prices only for sub-teams. Verify item 5 sentences and hours exact. |
| 14 | Ringsaker interkommunale barnevernvakt | CONFIRMED | Empty cells right. Verify item 6 hours text exact. |
| 15 | Rask psykisk helsehjelp, Lillehammer kommune | CONFIRMED | Quote and cost sentence exact, cost-en keeps 16. |
| 16 | Gudbrandsdal Krisesenter IKS | CONFIRMED | "Døgnåpent - Gratis - Alle dager" on the front page, free right with no note. No referral wording on any of the four pages. |
| 17 | Housing First, Lillehammer kommune | CONFIRMED | Quote and "Våre tjenester er gratis." exact. Intro-level inference is already Verify item 7. See detail for check 6. |
| 18 | Oppfølgingsteamet, Lillehammer kommune | CONFIRMED | Same intro sentences, exact. Already Verify item 8. See detail for the shared phone block. |
| 19 | Mottak for seksuelle overgrep, Lillehammer | CONFIRMED | Empty cells right. |
| 20 | Nav Gjøvik | CONFIRMED | Empty cells right. |
| 21 | Gjøvik Krisesenter IKS | CONFIRMED | Quote and "Tilbudet er gratis." exact on /om-oss, the two /Vare-tilbud sentences exact. |
| 22 | Jobbhus Gjøvik | CONFIRMED | Empty quote right. Verify item 9 sentences exact. |
| 23 | Brannvesen (nødnummer) | CONFIRMED | Empty cells right. |
| 24 | Politi (nødnummer) | CONFIRMED | Page names "hva det koster å ringe" but states no price, so empty cost is right. |
| 25 | Ambulanse (medisinsk nødhjelp) | CONFIRMED | Empty cells right. |
| 101 | Nav Ringsaker | CONFIRMED | Page has no henvisning, terskel or price wording. Empty cells correct. |
| 102 | Psykisk helse- og rustjenester, Ringsaker kommune | CONFIRMED | Quote "Du trenger ikke henvisning." exact and names a badge phrase. No price on page, Cost empty correct. |
| 103 | Barneverntjenesten i Ringsaker | CONFIRMED | Only "henvisning" is in "etter henvisning eller melding fra andre" (not an access statement). Empty correct. See missed-sentence list. |
| 104 | Nav Stange | CONFIRMED | Verify item 11 matches the page (Selvbetjent mottak Mon, Tue, Thu, Fri 09.00-14.30, Wed 12.00-14.30; Betjent mottak Wed 09.00-12.00). No referral or price wording. |
| 105 | Stangehjelpa, Stange kommune | CONFIRMED | Quote exact ("lav terskel" and "ingen henvisning"; the PP-tjenesten exception is on the page). Cost free and note "Det er gratis å motta hjelp hos oss." exact. cost-en faithful. |
| 106 | Psykososial krisehjelp, Stange kommune | CONFIRMED | Note exact, free correct. No referral wording on page. |
| 107 | Barneverntjenesten i Stange | CONFIRMED | Verify item 12 matches (08.30-15:30 under vakttjenesten, and "8.30-15.00 på hverdager" for the vakttelefon). The Alarmtelefonen "gratis" sentence is another service, so Cost empty is correct. Minor: Changed is empty although Verify 12 offers alternative hours. |
| 108 | Nav Løten | CONFIRMED | No henvisning, terskel or price wording on the page. Cited URL redirects. |
| 109 | Økonomisk rådgivning, Nav Løten | CONFIRMED | Note exact, free correct. "Vi er pliktig til å henvise til..." is outgoing referral, not an access statement. See missed-sentence list. Cited URL redirects. |
| 110 | Psykisk helse og rus-teamet (ROP-team), Løten kommune | CONFIRMED | Note "Tjenesten er gratis." exact. Page lists "Henvisning fra fastlege" as a way in, so no badge is right. Verify item 13 matches (page title "Psykisk helse-team", Krisetelefon Mon-Fri 08.00-15.00). Cited URL redirects. |
| 111 | Barnevernet i Løten | CONFIRMED | Only "henvise til annen hjelp" (outgoing). No price wording. Empty correct. |
| 112 | Rask psykisk helsehjelp (RPH), Løten kommune | CONFIRMED | Quote exact, note exact, both in the page's first sentence block. cost-en keeps "16". Phone cell correctly empty (numbers on page sit under first names). |
| 113 | Nav Elverum | CONFIRMED | Verify item 14 matches (closure sentence has no dates, address St. Olavs gate 4, 2406). No referral or price wording. |
| 114 | Barneverntjenesten i Elverum | CONFIRMED | Hours and phone as in Verify item 15 are on the page; no injected text in the raw page ("Innlogging" is a footer link). No referral or price wording. |
| 115 | Lavterskel rus- og psykisk helsehjelp (Annekset og Grip), Elverum kommune | CONFIRMED | Quote exact, names "lavterskeltilbud". "Våre tjenester er gratis." exact (appears under both headings). Category 10 yes holds: both Annekset and Grip sentences exact, Elverum kommune, not national. Verify item 16 matches. The phone shown on the page under "Du finner oss" is the Annekset and Grip line; the leader's mobile is correctly marked PERSON CONTACT ONLY. |
| 116 | Ambulant akutt enhet (AAE), DPS Elverum-Hamar | CONFIRMED | No referral or price wording for this unit. Phone and hours as noted are on the page. |
| 117 | Nok. Elverum Ressurssenter | CONFIRMED | Note exact, free correct (limited to residents, stated in the note). Empty quote follows the "other words" rule and is raised in Verify item 17; the page sentence matches. Verify item 18 matches (nok.elverum.no vs www.nokelverum.no). See missed-sentence list. |
| 118 | Nok. Hamar | CONFIRMED | Quote exact, contains "lavterskel". Note identical to quote, exact. free correct. Not Category 10 (treatment and support). |
| 119 | Husbanken | CONFIRMED | No referral or price wording. |
| 120 | Skatteetaten | CONFIRMED | Verify item 19 matches ("09:00–15:00 alle hverdager"). Only price sentence is "Det er gratis å ringe dette nummeret." (the call, not the service). Cost empty is a defensible reading and is already raised in Verify item 20. |
| 121 | Kors på halsen (Røde Kors) | CONFIRMED | Note exact, free correct. No referral wording. |
| 122 | Sidetmedord (Mental Helse) | CONFIRMED | Note is the exact page sentence and names Sidetmedord.no among "gratis og anonyme svartjenester". No referral wording. |
| 201 | Nav Alna | CONFIRMED | Page has no referral, lavterskel or price wording. Verify item 21 matches (visit address "Trygve Lies plass 5", Beliggenhet block "Trygve Lies plass 1"). |
| 202 | Nav Bjerke | CONFIRMED | No referral, lavterskel or price wording. |
| 203 | Nav Frogner | CONFIRMED | No referral, lavterskel or price wording. |
| 204 | Nav Gamle Oslo | CONFIRMED | No referral, lavterskel or price wording. |
| 205 | Nav Grorud | CONFIRMED | No referral, lavterskel or price wording. |
| 206 | Nav Grünerløkka | CONFIRMED | No referral, lavterskel or price wording. |
| 207 | Nav Nordre Aker | CONFIRMED | Verify item 22 matches ("12. november 2026" / "Stengt" under Spesielle åpningstider). |
| 208 | Nav Nordstrand | CONFIRMED | No referral, lavterskel or price wording. |
| 209 | Nav Sagene | CONFIRMED | Verify item 23 matches ("Hver onsdag er det drop-in for økonomirådgivning fra kl. 9 til 11."). No henvisning or lavterskel sentence missed. Minor: see Changed note below. |
| 210 | Nav St. Hanshaugen | CONFIRMED | No referral, lavterskel or price wording. Page lists 26-30 Oct 2026 as 11.00-15.00 (same as regular hours). |
| 211 | Nav Stovner | CONFIRMED | Verify item 24 matches ("Kun timeavtale" listed for 26-30 Oct, 2-6 Nov and 9 Nov 2026). Minor: see Changed note below. |
| 212 | Nav Søndre Nordstrand | CONFIRMED | No referral, lavterskel or price wording. |
| 213 | Nav Ullern | CONFIRMED | No referral, lavterskel or price wording. |
| 214 | Nav Vestre Aker | CONFIRMED | No referral, lavterskel or price wording. |
| 215 | Nav Østensjø | CONFIRMED | No referral, lavterskel or price wording. |
| 216 | Oslo Krisesenter | CONFIRMED | Quote and cost note are exact on /sporsmal-og-svar. Cost `free` fits "Det koster ingenting ...". Quote has "heller" between "trenger" and "ikke"; see note below. |
| 217 | Unge Relasjoner | CONFIRMED | Cost note exact; `free` correct; no referral or lavterskel wording on the page. |
| 218 | Overgrepsmottaket, Legevakten i Oslo | CONFIRMED | Quote and cost note exact; quote contains "trenger ikke henvisning". Page also prints names and numbers of staff (press contacts); none of them is in the doc. |
| 219 | Alternativ til Vold (ATV) Oslo | PARTIAL | Quote exact but the page spells it "lav terskel tilbud"; the cost note is stitched from two places on the page. Check 1 and 3, see below. |
| 220 | Vake kirkelig ressurssenter mot seksuelle overgrep | CONFIRMED | dinutvei.no page and ressurssenteret.no home page have no referral, lavterskel or price wording; cells correctly empty. Verify item 26 matches (301 from kirkeligressurssenter.no; 15A visit / 15C post address; seed address form "15 C" is the dinutvei.no form). |
| 221 | Psykososial akuttjeneste, Legevakten i Oslo | PARTIAL | Quote and note exact, but the only access phrase is "krever ikke henvisning", which Task 1's rule lists as "other words" (leave empty plus a Verify item). Check 1, see below. |
| 222 | Legevakten i Oslo | CONFIRMED | Cost note exact (two contiguous sentences); `paid` fits "betale egenandel"; Verify item 27 matches (both sentences quoted are on the page). No referral statement; only "henviser deg" in the transport paragraph, which is not an access statement. |
| 223 | Uteseksjonen, Oslo kommune | CONFIRMED | Empty quote is defensible and every candidate sentence is already disclosed in Verify item 28. Three page sentences reported below (missed-sentence report). Category 10 empty is correct (outreach and advice). |
| 224 | Uteseksjonens psykologtjeneste | CONFIRMED | Quote "Du trenger ikke henvisning." is on the page (intro line) and names "trenger ikke henvisning". Cost empty is correct (page states no price). Page gives no times (seeded hours empty). |
| 225 | Prindsen mottakssenter | CONFIRMED | Quote found verbatim ("lavterskeltilbud"). Cost free: "Alle våre tjenester er gratis." found. Verify 30 (09:00-15:00 via bydel, the vakttelefon is for the bydel) matches the page. Cost note empty, allowed for free. |
| 226 | Feltpleien i Oslo (Frelsesarmeen) | CONFIRMED | Quote found verbatim ("lavterskel"). Page states no price, Cost empty is right. |
| 227 | Fyrlyset, Oslo (Frelsesarmeen) | CONFIRMED | Quote is on the second cited page (Feltpleien), verbatim, names "lavterskel", and is about Fyrlyset. Fyrlyset's own page only has "lavterskelaktører" (Verify 31 quotes it correctly). No price on either page. Category 10 sentence found verbatim on the Fyrlyset page; a værested in Oslo, not national. |
| 228 | LINK Oslo | CONFIRMED | No referral or lavterskel wording on the page (no missed sentence). Cost free: sentence found verbatim. Category 10 sentence found verbatim; groups and activities in Oslo, not national. Verify 32 quote found. |
| 229 | Rask psykisk helsehjelp, Bydel Alna | CONFIRMED | Quote found verbatim ("lavterskeltilbud"). Cost sentence found verbatim. |
| 230 | Rask psykisk helsehjelp, Bydel Ullern | CONFIRMED | Quote found verbatim ("trenger ikke henvisning"). Cost sentence found verbatim. |
| 231 | Rask psykisk helsehjelp, Bydel Vestre Aker | CONFIRMED | Empty quote is right: no "henvis" or "lavterskel" text on the page. Cost sentence found verbatim. |
| 232 | Ung Arena Oslo sentrum | CONFIRMED | Quote found verbatim ("ingen henvisning"). Cost sentences found verbatim. |
| 233 | Kontoret for fri rettshjelp, Oslo kommune | CONFIRMED | Empty quote is right for the badge phrases (the only "henvises" is about onward referral by the lawyers). Cost empty is defensible: "gratis" is tied to income, Verify 33 quotes the page correctly. See detail: a walk-in sentence in other words has no Verify item. |
| 234 | JURK, Juridisk rådgivning for kvinner | CONFIRMED | No referral or lavterskel wording. Cost free: sentence found verbatim. Case work, correctly not category 10. |
| 235 | Gatejuristen | CONFIRMED | No referral or lavterskel wording. Cost free: sentence found verbatim. |
| 236 | Barnevernvakten i Oslo | CONFIRMED | Page prints only the vakttelefon line; nothing on referral or price. Empty cells right. |
| 237 | Familievernkontoret Christiania | CONFIRMED | Quote found verbatim. "Tilbudet er gratis." found. |
| 238 | Familievernkontoret Enerhaugen | CONFIRMED | Quote found verbatim. "Tilbudet er gratis." found. |
| 239 | Familievernkontoret Homansbyen | CONFIRMED | Quote found verbatim. "Tilbudet er gratis." found. Verify 34 (new address from 08. desember 2026) found verbatim. |
| 240 | Familievernkontoret Oslo Nord | CONFIRMED | Quote found verbatim. "Tilbudet er gratis." found. Verify 35 (Telefontider and Åpningstider) found verbatim. |
| 241 | Gamle Oslo helsestasjon for ungdom (HFU) | CONFIRMED | No referral or lavterskel wording. "Tjenestene er gratis." found. Verify 36 matches the page (title Sentrum helsestasjon for ungdom, phone, Hagegata 32, age sentence, booking sentence). |
| 242 | Helsestasjon for ungdom (HFU) i Oslo | CONFIRMED | No referral or lavterskel wording. Cost sentence found verbatim. |
| 243 | Oslohjelpa | CONFIRMED | Quote found verbatim ("trenger ikke henvisning"). Cost sentence and the "uten henvisning" sentence found verbatim. |
| 244 | Boligkontorene i Oslo | CONFIRMED | Nothing on referral or price. Empty cells right. |
| 245 | Stovner boligkontor | CONFIRMED | Nothing on referral or price. Verify 37 sentence is on the page; the number sits in the landlord section and is an office-type contact, not tied to a person. |
| 246 | Økonomisk rådgivning og gjeldsrådgivning, Oslo kommune | CONFIRMED | Nothing on referral or price. Empty cells right. |
| 247 | Bymisjonssenteret, Oslo (Kirkens Bymisjon) | CONFIRMED | Nothing on referral or lavterskel. Cost empty is defensible (see detail). Category 10 sentence found verbatim; a centre with food, activities and events in Oslo, not national. The contact page ties an email to a person, and the doc correctly records only `PERSON CONTACT ONLY`. |

## Non-CONFIRMED / flagged rows in detail

Five rows are PARTIAL (1, 2, 12, 219, 221). No row is REJECTED. The other entries below are minor
flags, missed-sentence reports and observations on CONFIRMED rows. None of them changes a verdict.

### Row 1 (Hjelpetelefonen (Mental Helse)): PARTIAL

Check 3 failed. cost-nb is "116 123 er en gratis og døgnåpen telefontjeneste for alle som trenger
noen å snakke med." and its numbers are 116 and 123. cost-en reads "116 123 is a free, 24-hour
phone service ...", whose numbers are 116, 123 and 24. "døgnåpen" has no digit in Norwegian. The
plan's `NumberProblems` guard requires the same sorted number list on both sides, so this row would
fail it. Writing "round-the-clock" instead of "24-hour" fixes it.

### Row 2 (Kirkens SOS): PARTIAL

Check 2 judgement. Page sentences: "Kirkens SOS tar seg ikke betalt for tjenesten og tjener ingenting
på tellerskrittene." and "Det vil koste det samme å ringe vårt nye telefonnummer, som det koster å
ringe et vanlig fasttelefonnummer. Prisene varierer fra abonnement til abonnement. For noen vil det
være gratis, for andre en liten kostnad." The service charges nothing but the caller pays operator
rates. The Free rule examples are "gratis", "koster ingenting", "uten egenandel", and this page uses
none of them. The Notes mention the call charge, but no "Verify these first" item asks me to decide.

### Row 12 (Hamar interkommunale krisesenter): PARTIAL

Check 3 failed, same cause as row 1: cost-nb "Hamar interkommunale krisesenter er et gratis
døgnåpent akuttsenter." has no digit, cost-en "... is a free 24-hour emergency centre." introduces
24. The quote check passed: "Senteret er et lavterskeltilbud og man trenger ikke henvising fra lege
eller andre for å få hjelp." is exact on both pages and names "lavterskeltilbud" (spelling
"henvising" confirmed, as in Verify item 4). Check 6: the Notes line "PERSON CONTACT ONLY" is
correct, the krisesenter page does print a leader's name and mobile number; the doc records neither.

### Row 17 (Housing First, Lillehammer kommune)

Quote, cost and the intro-level inference all match the page (Verify item 7 already raises the
inference). Check 6, minor: the Notes record the Housing First line number. On the page the same
number is printed under the Housing First heading and again under the team leader entry of that
block. The heading use is the unit line, so I do not call it a person contact, but the doc could
say the number is the unit's line.

### Row 18 (Oppfølgingsteamet, Lillehammer kommune)

Quote, cost and inference match the page (Verify item 8). Observation: the Oppfølgingsteamet phone
and hours in the Notes are identical to the block the page labels "FACT Gamlevegen 101,
lavterskeltilbud rus" (same number, "mandag til søndag"). The Notes say the two lavterskel places
are "not rows in this slice" but do not say they share the number with this row. It does not change
the badge, because the quote is the page intro.

### Row 22 (Jobbhus Gjøvik), observation

The page says "Hos oss treffer du andre i samme situasjon som deg" next to its drop-in offer. The
doc keeps it out of category 10 as case work and job follow-up. That is a judgement call, not an
error, and no Verify item names it.

### Verify item 10 (rows 10, 15, 17, 20)

I searched the raw page text of rows 10, 15, 17 and 20 for text addressed to an AI, instructions or
requests to reproduce sentences or list names. None found in the curl output. The item is therefore
consistent with an artefact of the summarising fetch tool used in the re-read.

### Row 103 (Barneverntjenesten i Ringsaker), missed-sentence report

Page sentence: "Barneverntjenesten kan sette inn barneverntiltak etter henvendelse fra foreldre,
barnet selv eller etter henvisning eller melding fra andre." Not a no-referral statement. The re-read
already noted it. No change.

### Row 107 (Barneverntjenesten i Stange), minor

Changed is empty although Verify item 12 sets out alternative hours. Task 1 defines Changed as "yes"
when a Verify item proposes a correction; the item proposes keeping the seed value, so this is
borderline.

### Row 109 (Økonomisk rådgivning, Nav Løten), missed-sentence report

Page sentence: "Vi er pliktig til å henvise til og formidle kontakt med de rette instanser om det
berører områder som er utenfor vårt kompetansefelt." Outgoing referral, not an access statement. No
change.

### Row 110 (Psykisk helse og rus-teamet (ROP-team), Løten kommune), missed-sentence report

Page lines: "Henvisning fra fastlege" (listed as one way in) and "Vi kan vurdere om bruker har behov
for dette tilbudet og henviser da videre." The first is already in the row Notes; the second is
outgoing. No change.

### Row 111 (Barnevernet i Løten), missed-sentence report

Page sentence: "Vi kan gi råd om eller henvise til annen hjelp: Helsestasjonen,
Pedagogisk-Psykologisk tjeneste, Barne- og ungdomspsykiatrien eller familievernkontoret." Outgoing
referral. No change.

### Row 117 (Nok. Elverum Ressurssenter), missed-sentence report

Page sentence: "Du kan ta direkte kontakt med senteret på telefon, sms eller e-post. Du trengs ikke
henvisning eller anmeldelse for å få hjelp." This is a real no-referral statement in the "trengs"
spelling. The re-read left the quote empty under the "other words" rule and raised it as Verify item
17, so the handling follows Task 1. It is the one sentence that could turn this row into a badge row
if accepted.

### Row 120 (Skatteetaten), minor

Cost is empty while the page says the number is free to call. Raised in Verify item 20; left for the
gate.

### Row 216 (Oslo Krisesenter), minor

The exact quote is "Man trenger heller ikke henvisning fra lege eller andre for å få plass på
krisesenteret." It reads "trenger heller ikke henvisning", with "heller" between the words of the
badge phrase "trenger ikke henvisning". I counted it as the badge phrase, since "heller" only adds
emphasis. The gate may want to confirm.

### Row 219 (Alternativ til Vold (ATV) Oslo): PARTIAL

- Check 1: the quote is exact: "ATV Oslo er et spesialisert lav terskel tilbud." But the page writes
  "lav terskel" as two words, so it does not literally contain the badge phrase "lavterskel" or
  "lavterskeltilbud". The doc already raises this in Verify item 25(a); the call is the gate's.
- Check 3: the cost note joins three sentences from two places on the page. The first two sit
  together in the Kontakt block ("ATV har en egenandel på kr 350,- for voksne utøverklienter i
  individualterapi. For gruppebehandling vil egenandelen variere uavhengig hva slags gruppe det
  dreier seg om."). The third comes from the FAQ ("Mange av tilbudene på ATV har en
  egenandelsbetaling, mens enkelte kontorer og tilbud er gratis."). Each sentence is verbatim and the
  digits in cost-en match (kr 350,-), but the note is not one passage, and the third sentence is
  ATV-wide, not about the Oslo office. The FAQ continues "Forhør deg med ditt kontor om kostnader.",
  which is left out. Cost `paid` itself fits the Oslo-page sentence on the 350 egenandel.
- Check 6: the page lists named staff with direct numbers; none is in the doc.

### Row 221 (Psykososial akuttjeneste, Legevakten i Oslo): PARTIAL

Check 1: the quote "Tjenesten er gratis, krever ikke henvisning og de ansatte har taushetsplikt etter
helsepersonelloven." is exact. The access phrase is "krever ikke henvisning". Task 1 Step 2 names
"krever ikke henvisning" as an example of the same thing in other words, to be left empty with a
"Verify these first" item. Row 221 has the badge and no Verify item. The page has no "lavterskel"
and no "ingen/uten/trenger ikke henvisning". The same pattern on row 15 ("ikke krever formell
henvisning") would need the same decision.

### Row 223 (Uteseksjonen, Oslo kommune), missed-sentence report

The quote cell is empty. These page sentences contain "lavterskel" or "henvisning". All three are
already quoted in Verify item 28.

1. Section heading "Lavterskel rus- og psykisk helsetilbud".
2. "Psykologtjenesten vår har lav terskel og gir tilbud til deg som har rus og/eller psykisk
   helseproblem som du ikke får hjelp til andre steder." (item 28 quotes this up to "psykisk
   helseproblem")
3. "Psykologhjelp uten henvisning til unge under 25 år." (under the link "Uteseksjonens
   psykologtjeneste")

All three describe the psychologist service (row 224), not the outreach service. "Du trenger ikke å
ha en avtale" concerns appointments, not referral.

### Changed column (rows 209, 211, 223), minor

Item 23 (row 209) and item 24 (row 211) propose no correction, yet Changed is `yes`. Rows 201 and
207 also have only a "no change" Verify item and Changed is empty. Row 223 is `yes` with no proposed
correction either. This does not affect any seed value, but the Changed rule in Task 1 Step 2 is
applied unevenly. Row 107 (above) is the same issue in the other direction.

### Row 227 (Fyrlyset, Oslo (Frelsesarmeen)), minor

Check 1: the quote is not on Fyrlyset's own page, only on the cited Feltpleien page. It is verbatim
there and does describe Fyrlyset as "et lavterskel værested". Already raised as Verify 31.

### Row 233 (Kontoret for fri rettshjelp, Oslo kommune), minor

Check 1, empty quote: no "henvisning" or "lavterskel" sentence was missed. The page does say the same
thing in other words: "Drop-in timer" (Mandag til torsdag: klokken 16:00-19:00) and "Du kan bestille
time på telefon, e-post eller ved å møte opp i resepsjonen." Task 1 says such wording should get a
"Verify these first" item; Verify 33 covers only the cost, so there is no item for the walk-in
wording. This does not change the badge (it stays off) and I did not count it as a missed
"henvisning"/"lavterskel" sentence.

### Row 247 (Bymisjonssenteret, Oslo (Kirkens Bymisjon))

Check 2: the page sentence is "Vi tilbyr alt fra gratis og rimelig matservering, dusj, vaskeri og
akuttovernatting, til ulike aktiviteter, kulturarrangementer og utleie av kirkerommet." It names no
price, so empty Cost matches the rule table. Verify 38 already offers `partly`. Check 6: the email on
the contact page is tied to a person on the page; the doc contains no name, number or email for it.

### No missed sentence on the other empty-quote rows

- Rows 1 to 25: none missed. Row 13 ("hjelp med henvisning til annet hjelpeapparat", "FACT kan ikke
  henvises direkte til") has no access statement. Row 22's two sentences are already Verify item 9.
  Row 11 has only drop-in wording. Row 14's only lavterskeltilbud sentence is about the krisesenter
  (row 12). Rows 1 to 9, 16, 19, 20 and 23 to 25 have no "henvisning" or "lavterskel" on their pages.
- Rows 101 to 122: no "terskel" or "henvis" sentence on the pages of rows 101, 104, 106, 107, 108,
  113, 114, 116, 119, 120, 121 and 122.
- Rows 225 to 247: the only hits on empty-quote rows were "henvises videre" (row 233, onward
  referral), "henvise deg til noen" (row 234) and "henvise til abort" (row 242). None is a badge
  statement.

### Person-tied contacts (check 6)

No cell, note or Verify item in any of the 94 rows names a person or carries a number or email the
page ties to a person. Rows 104, 105, 107, 110, 111, 112 and 115 are marked PERSON CONTACT ONLY, and
the page does print person-tied numbers in those cases. The pages for rows 12, 218, 219, 223 and 247
also print names, numbers or emails tied to people; the doc leaves them out. The numbers that do
appear in Verify items and Notes (rows 107, 110, 114, 115, 116, 118, Verify 30, 36, 37 and row 247's
Notes) are organisation, office, vakttelefon or service lines on their pages.

## Summary

- **CONFIRMED:** 89
- **PARTIAL:** 5 (rows 1, 2, 12, 219, 221)
- **REJECTED:** 0
- **UNREACHABLE:** 0

**Category 10:** all four `yes` rows (115, 227, 228, 247) hold. Each is a meeting place or activity
provider in a kommune, not national.

**Missed-sentence reports:** 8 (rows 103, 109, 110, 111, 117 and three on row 223). Only row 117 is
a real access statement for its own row, and it is already Verify item 17.

**Rows needing my attention at the gate:** 1 and 12 (cost-en adds "24", fix the wording), 2 (decide
whether "tar seg ikke betalt" with operator call charges counts as free), 219 ("lav terskel" as two
words and a stitched cost note), 221 ("krever ikke henvisning" carries the badge without a Verify
item). Minor items to tidy at the same time: 107, 117, 120, 216, 227, 233, and the uneven Changed
column on 107, 209, 211 and 223.
