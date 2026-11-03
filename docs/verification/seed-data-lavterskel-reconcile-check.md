# Verification: seed-data-lavterskel-reconcile.md

**Status: CHECK DONE, 03.11.2026 (Tuesday).** Independent check of all 48 category 10 rows of
`docs/seed-data-lavterskel-reconcile.md` against the pages each row cites. It feeds my
verification gate; no seed or code reads it.

Six groups worked independently, each on its own rows, from the cited pages only. They matched
every quoted string with curl plus a local tag-strip and whitespace collapse (case ignored), and
used the browser pane only where curl got a 403 or the page needed JavaScript. Two pages
returned 403 to curl: https://www.haraldsplass.org/hospice-sangen/ (row 307, read in the browser
pane; no quote of the row sits on it) and parkrun.no (row 314, not in the row's Source URL, so
the row rests on the kommune page as the doc says). Every other cited URL returned HTTP 200 and
none needed the browser pane. No group did replacement research or changed a value. Each row got
five checks:

1. Every quoted string in Topic evidence and Referral quote is on a cited page, word for word.
2. Each Topic slug follows from its evidence by the Topic rule, and no slug lacks evidence;
   `none` rows: the page names no theme or target group.
3. The Referral quote names a badge phrase, or the row has a Verify item for a new phrase.
4. The quote is about this place or a wider body that contains it, not a neighbouring service.
5. No private person's name or number appears in the row.

Verdicts: `CONFIRMED`, `MISMATCH`, `UNREACHABLE`, `QUESTION`. Where a Detail cell says "check N",
N is the check above.

## Verdict table

| # | Name | Verdict | Detail |
|---|------|---------|--------|
| 115 | Lavterskel rus- og psykisk helsehjelp (Annekset og Grip), Elverum kommune | QUESTION | Both quotes found (curl). Badge quote is in the Annekset/Grip section and contains "lavterskeltilbud". Topic `rus` is the narrow reading, see Detail (check 2). |
| 227 | Fyrlyset, Oslo (Frelsesarmeen) | QUESTION | All four quotes found (curl): three on the Fyrlyset page, the badge quote on the Feltpleien page and it names Fyrlyset. Topics bolig and psykisk-helse are oblique, see Detail (check 2). |
| 228 | LINK Oslo | CONFIRMED | Evidence "for å styrke vår psykiske helse" found (curl). No henvisning, vedtak or lavterskel wording anywhere on the page, so no quote and no badge is right; Verify item 7 covers the description. |
| 247 | Bymisjonssenteret, Oslo (Kirkens Bymisjon) | QUESTION | Both evidence strings found, but only on the Sporet page (curl). Topic basis is weak, see Detail (check 2). No referral wording on any page, no quote, Verify items 8 and 9 present. |
| 301 | Sagatun Brukerstyrt Senter | CONFIRMED | Both Topic evidence strings found (psykisk-helse on sagatun.no, arbeid on the subpage). Referral quote "Du trenger ikke henvisning for å bruke tilbudet." found on sagatun.no, about the whole centre, names "trenger ikke henvisning". |
| 302 | Hamar Frivilligsentral | CONFIRMED | All four evidence strings found (Angstgrupper and Advokatvakt on the kommune page, the aleneforeldre and UngInnsats sentences on the frivilligsentral sub-page). No referral quote and none on any page, matching the empty cell. Evidence for two topics is a bare activity name; Verify items 1 and 11 already carry this. |
| 303 | Høbben, et sted for ungdom | CONFIRMED | Page names youth as a target group and no theme ("rusfritt" describes the house, not a theme); both sentences quoted in Verify item 12 found. No vedtak, referral or lavterskel wording on the page, so no badge is right. |
| 304 | CRUX Arbeideren | CONFIRMED | All four evidence strings found on the Arbeideren page. "lavterskel" appears only in the news headline the doc names; no henvisning/vedtak sentence for this service. Arbeid and juridisk-hjelp rest on bare headings ("Muligheter for arbeidsrettede tilbud", "Gatejuristen"); Verify items 1 and 13 carry this. |
| 305 | Evangeliesenteret kontaktsenter Hamar | CONFIRMED | bolig evidence and the badge quote found on the national kontaktsenter page, rus evidence on the Hamar page. The national sentence covers all Kontaktsentre, so Hamar is inside the wider body. |
| 306 | Blå Kors barnas stasjon Hamar | CONFIRMED | familie-og-barn evidence and the badge quote ("... ikke behøver henvisning fra lege eller andre.") found on the Blå Kors Hamar page; psykisk-helse and rus evidence found on the kommune page in the Barnas stasjon entry. |
| 307 | Støttesenter for pårørende, Hospice Sangen | CONFIRMED | The long quote is on the kommune page as one continuous sentence, about this centre, names "lavterskel". No category theme named. Browser read of the Hospice Sangen page: no opening hours, general phone only, as the doc says. |
| 308 | Hamar Røde Kors | CONFIRMED | curl: both Topic quotes (Ferie for alle, BARK) and the Onsdagsgjengen and "Påmelding påkrevd." sentences found word for word on the cited page, each under the right activity heading. No henvisning, vedtak or lavterskel on the page, so no quote or badge is right. Verify item 18 covers the multi-activity ruling. |
| 309 | BUA Hamar | QUESTION | curl: all quoted strings found (CRUX page and kommune page), no referral wording. But the Topic `none` claim fails check 2, see Detail. |
| 310 | Åpen barnehage (Ankerløkken barnehage) | CONFIRMED | curl: "Målgruppe: Alle barn under skolealder." and the welcome line "Alle barn under skolealder er hjertelig velkomne!" both sit in the Åpen barnehage entry on the gratis-hjelpetilbud page; Torggata 73 found on hamar.frivilligsentral.no. The "Gratis lavterskeltilbud" sentence on that page belongs to the next entry (Barnas stasjon) and is correctly not used. Verify item 20 covers the no-badge case. |
| 311 | Prestrud ungdomsklubb | CONFIRMED | curl: "Målgruppe: 13 - 18 år." and "Møtested for ungdommer på iskroa i CC amfi/hockeyhallen." are in the Prestrud entry of the kommune page; phone matches. No theme among the eight named, no referral wording. Youth-club reading is covered by Verify item 1 and 21. |
| 312 | Fritidsklubb Wiik | CONFIRMED | curl: "Medlemskap kr 120,- pr skoleår.", "Målgruppe: 13 - 18 år." and "Klubben er på Øvre Vang samfunnshus." are in the Wiik entry of the kommune page. No theme named, no referral wording. Verify item 22 present. |
| 313 | Terningkast 7 | CONFIRMED | curl: the rusfrie/aldersgrupper sentence, "Spillkveldene våre er åpne for alle nye medlemmer." and "Nybegynnere er alltid velkomne" all found on terningkast7.no; no henvisning, vedtak or lavterskel on the page. Verify item 23 present. |
| 314 | Parkrun Ankerskogen | CONFIRMED | curl: both Parkrun sentences found word for word in the Parkrun entry on the kommune page. parkrun.no returned HTTP 403 to curl, as the doc says; it is not in the row's Source URL column, so the row rests on the kommune page as stated. Verify item 24 present. |
| 315 | Lavterskeltilbud Storgata 9B | CONFIRMED | Topic evidence and referral quote both found verbatim (curl). Quote is about this service and contains "lavterskel"; Verify 25 covers the stronger sentence, also found verbatim. No named person in the row. |
| 316 | Lavterskeltilbud Gamlevegen 101 | CONFIRMED | Topic evidence and the full referral quote found verbatim (curl); "trenger ikke henvisning" is a BadgePhrase and the sentence is about this place. Phone remark in Detail. |
| 317 | Lillehammer Frivilligsentral | CONFIRMED | The `none` evidence quote is verbatim. No lavterskel, henvisning or vedtak wording on either cited page (grep). `none` depends on Verify 1 and 26 (see Detail). |
| 318 | Lillehammer Røde Kors | CONFIRMED | `none` and no badge hold: the "lavterskeltilbud" sentence is found verbatim but is about the Norsktrening group only, as the row's Notes say. Candidate sentences in Verify 27 and 28 are verbatim. `none` depends on Verify 1. |
| 320 | Blå Kors gatenært Gjøvik (Kafe Kampen) | CONFIRMED | All 4 quotes found word for word on blakors.no/gatenaert/kampen (curl). Badge quote is the page's history sentence and names "lavterskeltilbud" for this place (check 4 passes, gate D4). The organisation's own phone is printed under "Kontakt oss" (answers Verify item 30). No private name or number in the row. |
| 321 | Fontenehuset Gjøvik | CONFIRMED | All 3 quotes found on the home page (curl). "ingen henvisning" is a BadgePhrase and the page has a "Lavterskeltilbud" label next to it. Topics psykisk-helse and arbeid follow from the two evidence sentences. |
| 322 | Gjøvik frivilligsentral avd. Sentrum | CONFIRMED | "Gratis veiledning fra advokater" found under Advokathjelp (curl, /aktiviteter and home page). Kaffetreff "lavterskel" sentence found and correctly not used as a badge quote. No referral or vedtak wording anywhere. Note for the item 1 ruling: if one activity is enough, the same page also lists "Leksehjelp grunnskole en til en" and "Juleverksted for barn" as familie-og-barn candidates that the doc does not mention. |
| 323 | Gjøvik frivilligsentral avd. Øverby (Øverbykafeen og Torsdagstreff) | CONFIRMED | /overby lists hours (Mondays 11:00-13:30, Thursdays 10:00-13:00, Sundays 11:00-14:00), Torsdagstreff at Øverbyvegen 95, Øverbykafeen and the volunteer groups; no theme, target group or referral wording. `none` holds. |
| 324 | PULS - ditt værested (Frelsesarmeen Gjøvik og Toten) | QUESTION | All 3 quotes found (course and jobbsøknader sentences on the Åpent Hus Velferd page, each on one line, so the two-line join is fine; PULS sentence on the PULS page). The question is the Notes claim that PULS's own page names only loneliness, immigrants and spiritual longing. See Detail. Fails check 2 (basis) and check 4 (neighbouring service). |
| 326 | Ung i Gjøvik (Ungdommens hus) | QUESTION | Both quoted strings found on the kommune page (curl). The page ties Ung i Gjøvik to a health service and an assessed request form. See Detail. Fails check 2 (`none` basis). |
| 327 | Hverdag - Mat & Mening | CONFIRMED | "drevet av frivillige og folk på arbeidstrening" found, inside the sentence beginning "Hovedaktiviteten i vår virksomhet er kafédrift, catering og utleie" (curl, ashverdag.no). The "Helt spesielt ..." sentence in Verify 38 is on the page as one sentence, in a board member's own statement. No referral wording; empty quote is right. |
| 328 | Norsktrening (Gjøvik Røde Kors) | CONFIRMED | Badge quote found exactly, including the typo "lavterskeltilbudder", in the Norsktrening section (curl, rodekors.no/lokalforeninger/oppland/gjovik/); it is about Norsktrening, the row itself. "et tilbud til alle som ønsker å lære seg norsk" found. Verify 40: the "Ta kontakt med oss på tlf: ... eller e-post" sentence sits under the BARK activity, not Norsktrening, and the same number is printed under a named coordinator elsewhere on the page, so leaving it out is right; the header shows "Telefon -". |
| 329 | Solsia aktivitetshus | CONFIRMED | curl: both evidence strings are in the Solsia sentence ("utfordringer innen psykisk helse og/eller avhengighet"). The two henvisning sentences are in the neighbouring service and the relatives' section only; the Solsia section has none, so the empty quote is right. |
| 330 | Mental Helse Ringsaker | CONFIRMED | curl: evidence "jobber for at alle skal ha en best mulig psykisk helse" is on the kommune page; hours "Tirsdag kl. 10.00 – 14.00" match; no badge phrase, henvisning or vedtak wording on any of the three pages (mentalhelse.no/ringsaker also shows a Tuesday 10:00–14:00 open meeting place). |
| 331 | Brumunddal frivilligsentral | QUESTION | curl: "på tvers av generasjoner" and "Alle gruppearrangement er åpne for alle og gratis å delta på." match, but the topic evidence says the page names no theme for the centre or its activities. See Detail. |
| 332 | Moelv frivilligsentral | CONFIRMED | curl: the evidence sentence and "Alle er velkommen!" (Strikkekafé og Hobbytreff page) match; no theme, no henvisning, vedtak or lavterskel wording on the four pages. |
| 333 | Ringsaker Røde Kors: Norsktrening | CONFIRMED | curl: the full quote is one sentence inside a single paragraph element in the raw HTML (one look done, so the two-segment worry is resolved); "lavterskeltilbud" contains "lavterskel"; the sentence is about Norsktrening, the row itself. |
| 334 | LHL Ringsaker: lavterskeltrim i Brumunddal | CONFIRMED | curl: both quotes match on the page; "lavterskeltrim" contains "lavterskel"; the sentence is about this very session; the page has a named contact person that the row does not record. |
| 335 | Stangehjelpa aktivitetshus | CONFIRMED | curl: the aktivitetshus evidence and "familiehjelp, rus og psykisk helse" match; the badge quote is on the parent Stangehjelpa page (heading "Til samarbeidspartnere") and the row is tagged "wider body"; the aktivitetshus page itself says "Stangehjelpa" in its own text, so it is part of that body. The same parent page says "Deler av tjenesten er vedtaksbasert." (already Verify item 47). |
| 336 | Ottestad frivilligsentral | CONFIRMED | curl: the evidence sentence and the welcome sentence match; no henvisning, vedtak or lavterskel wording on the three pages; frivilligsentral.no gives contact data only. |
| 337 | Ungdomshuset i Ottestad | QUESTION | curl: all quoted strings match on the Stange page, but the badge sentence names both youth offers and the Notes carry no "wider body" tag. See Detail. |
| 338 | Stange musikkverksted | QUESTION | curl: all quoted strings match, but same badge sentence and same missing "wider body" tag. See Detail. |
| 339 | Løten Frivilligsentral | CONFIRMED | The `none` evidence quote is verbatim on the front page. No lavterskel, henvisning or vedtak wording on the three cited pages. Knøttetreff quote in Verify 51 verbatim. `none` depends on Verify 1. |
| 340 | Ungdommens hus | CONFIRMED | Topic evidence verbatim, so `familie-og-barn` follows by the Topic rule for children as a target group. No referral wording, so empty quote and no badge is right. Hours sentences in Notes verbatim. Verify 52 covers the alternative. |
| 341 | Felles aktivitet i Løtenhallen | QUESTION | Check 2, see Detail. |
| 342 | BUA Løten | CONFIRMED | The `none` evidence quote is verbatim. The page names no theme or target group beyond the scheme's name. No referral wording. Cost sentence "helt gratis" found verbatim. |
| 343 | Elverum frivilligsentral | CONFIRMED | No quote to match. All four pages fetched; no theme or target group among the eight, no henvisning, vedtak or lavterskel wording. Welcome lines, hours and the "varmlunsj" inconsistency are as the doc says. Minor: the Trimgruppe line says "Fysisk aktivitet er beste medisin for god mental og fysisk helse!" (a benefit of exercise, not a theme of the place), so `none` stands. |
| 344 | Møteplassen Elverum | QUESTION | No quote to match. The cited about page names a psykisk helse offer, see Detail (check 2). No badge is right for the place as a whole. |
| 345 | Treffpunktet (Møteplassen Elverum) | QUESTION | Both quotes found (curl): the evidence on the Treffpunktet page, the badge quote on the about page; the badge quote is about Treffpunktet itself. Notes claim about the phone is out of date, see Detail. |
| 346 | Ungdommens hus | CONFIRMED | No quote to match. Page names youth 10 to 18 and no theme among the eight; "rusfri arena" is a house rule. New cost wording "Her kan du være med på mange aktiviteter, og det er gratis." found (curl), address, phone and five hours lines match, no referral wording. |

## Non-CONFIRMED rows in detail

All twelve are `QUESTION`. None is a `MISMATCH` or `UNREACHABLE`: no quoted string was missing
from its page, and every cited page was reached. The questions sit in check 2 (Topic basis) and,
for 324, 337 and 338, check 4.

### 115 Lavterskel rus- og psykisk helsehjelp (Annekset og Grip), Elverum kommune (check 2)

- Page sentence, page-wide: "Her finner du informasjon om lavterskeltilbud innen både psykisk helse og rus." The page title names both too.
- Page sentence, Annekset and Grip section: "Annekset er en møteplass for deg som er voksen og sliter med rusavhengighet."
- URL: https://www.elverum.kommune.no/vare-tjenester/helse-omsorg-og-sosiale-tjenester/rus-og-psykisk-helsetjenester/lavterskel-rus-og-psykisk-helsehjelp/
- The doc drops `psykisk-helse` because only the Mestringsteamet section names it. `rus` follows from the section sentence; `psykisk-helse` depends on whether the page-wide intro counts. That is my ruling.
- Related: Verify item 2 already carries this. The badge quote is about the Annekset and Grip section (check 4 passes).

### 227 Fyrlyset, Oslo (Frelsesarmeen) (check 2)

- Page sentence behind `bolig`: "Gjennom oppsøkende patruljer forsøker vi å dokumentere og observere situasjonen for hjemløse og mennesker med rusproblemer". It is about observing the situation of homeless people, not about housing help, and homelessness is not stated as the centre's own target group.
- Page sentence behind `psykisk-helse`: "mennesker med rusproblemer med sammensatte psykiske og fysiske utfordringer". It describes the users of one funded project on the same page, not the centre.
- `rus` is solid: "Fyrlyset er et kontaktsenter for mennesker med rusproblemer over 18 år i Oslo."
- URL: https://frelsesarmeen.no/rusomsorg/fyrlyset-oslo (the badge quote is on the Feltpleien page and names Fyrlyset).
- Related: Verify items 1 and 5 carry both topics. No page text addressed the reader or asked for anything.

### 247 Bymisjonssenteret, Oslo (Kirkens Bymisjon) (check 2)

- Page sentence: "I vrimmelen av mennesker finnes også mennesker med rusrelaterte utfordringer, dårlig psykisk helse, ensomhet, bostedsløse og personer med demens." It describes people passing through Oslo S, not a target group of Bymisjonssenteret or Sporet.
- URL: https://kirkensbymisjon.no/tilbud-sporet (both evidence strings are only there). The centre's own page, https://kirkensbymisjon.no/tilbud-bymisjonssenteret/, names no theme: it lists food, showers, laundry, "akuttovernatting", activities and church. Sporet is also run with Bane Nor Eiendom per its own page.
- Related: Verify item 8 already holds the alternative `none`; item 9 is present. No referral wording on any page, so no quote and no badge.

### 309 BUA Hamar (check 2)

- The Topic cell is `none` and Verify item 19 says no page sentence mentions cost or income, only "helt gratis". Two cited pages say otherwise.
- Page sentence: "Gode steder å henvende seg: Brukt utstyr og økonomisk støtte kan hjelpe deg til å kunne delta på flere aktiviteter." URL: https://www.hamar.kommune.no/familiehjelp-oversikt-over-tilbud/gratis-kultur-og-aktivitetstilbud/ . It is the section lead above the BUA entry. The same section also holds a neighbouring entry, Kontingentkassa, so the checker could not tell whether the lead is about BUA.
- Page sentences: "BUA har fokus på folkehelse, miljø og sosial utjevning." and "BUA Hamar er i tillegg en arena for arbeidsutprøving for de som har stått utenfor arbeidslivet i en kortere eller lengere periode." URL: https://stiftelsencrux.no/vare-virksomheter/hamartiltakene/bua-hamar . The second reads as `arbeid` under the Topic rule and would sit in the single-activity group of Verify item 1.
- So the claim "page names no theme" and the text of item 19 are inaccurate. Whether the topic should be `arbeid` and/or `okonomi` is my ruling. No quote in the row is wrong.
- Related: Verify item 19 and item 1. The CRUX page names two private persons in a lead sentence; the row contains neither (check 5 passes).

### 324 PULS - ditt værested (Frelsesarmeen Gjøvik og Toten) (checks 2 and 4)

- Page sentence: "Hovedmålgruppe for arbeidstreningen er mennesker som faller utenfor arbeidslivet på grunn av psykosomatiske eller språklige utfordringer." URL: https://frelsesarmeen.no/korps/puls-ditt-vaerested
- The Notes and Verify item 35 say PULS's own page names only loneliness, immigrants and spiritual longing. This sentence is a work-training target group on PULS's own page, so `arbeid` (and arguably `psykisk-helse`) has evidence there, and the "alternative is none if only PULS's own page counts" in item 35 is not accurate.
- Check 4: all three Topic evidence strings come from the Åpent Hus Velferd page, https://frelsesarmeen.no/korps/matutdeling-gjovik-toten , a separate Frelsesarmeen service at the same address. The doc discloses this, but the PULS page does not confirm that it is part of PULS. That page also says "Skal man søke hjelp om mat og/eller klær, må man først ha en samtale." (about the food and clothes help, not the course or job-application help), so there is no badge risk and none is claimed.
- Related: Verify item 35.

### 326 Ung i Gjøvik (Ungdommens hus) (check 2)

- Page sentences: "Team ung er en del av virksomheten Ung helse og mestring i Gjøvik kommune." and, under the request form, "De vurderer hvilken tjeneste som er aktuell, og tar kontakt med deg innen 14 dager. På grunn av kapasitetsutfordringer kan det for tiden være noe ventetid på oppstart av behandling." The staff list repeats "ung mestring" for most staff.
- URL: https://www.gjovik.kommune.no/tjenester/barn-ungdom-og-familie/ung-i-gjovik/
- The row says the page names no theme. The page links Ung i Gjøvik to a health and coping service (a possible `psykisk-helse` theme) and to a form where the request is assessed. Neither is in the Notes or in Verify item 37. My ruling: whether that wording changes `none`, and whether the assessed request form matters for category 10 membership (a Verify item, not a removal).
- The Ungdommens hus opening-hours line ("åpent for deg som går på ungdomsskolen og videregående") says nothing about a referral, so no badge is claimed or implied.
- Related: Verify item 37.

### 331 Brumunddal frivilligsentral (check 2)

- The Topic evidence says the page names no theme or target group for the centre or its activities. The activity page lists activities that do.
- Page sentences: "Mental Helse Ringsaker har fast møteplass i våre lokaler." and "Selvhjelpsgrupper og andre aktiviteter, igangsettes etter behov." (`psykisk-helse` candidates), and the Småjobbsentralen line "rettet særlig mot eldre og minstepensjonister samt uføre" (the doc already mentions this one).
- URL: https://brumunddal.frivilligsentral.no/aktivitet?Id=8587&aktiviteter-for-grupper=
- Under the doc's own Topic rule ("for the place or its activities") the evidence statement is too strong. The Mental Helse and selvhjelp activities should be listed as candidates and fall under Verify item 1, like rows 317, 318, 335 and 339. Row 330 (same source page, Mental Helse Ringsaker) carries `psykisk-helse`, so the two rows read the same page differently. No badge phrase or referral wording, so no badge is right.
- Related: Verify item 1.

### 337 Ungdomshuset i Ottestad (check 4)

- Page sentence: "Kommunen har i tillegg gratis lavterskeltilbud rettet mot ungdom gjennom Stange musikkverksted og Ottestad ungdomshus."
- URL: https://www.stange.kommune.no/kultur-og-frivillighet/aktiviteter-for-ungdom/
- It is a kommune-level sentence that names this house together with another offer (row 338), so it counts only as a statement about a wider group that contains the row. The Notes say "The quote names both youth offers (rows 337 and 338)" but do not use the "wider body:" tag that row 335 carries. The sentence's own words cover the row, so I expect it qualifies once tagged. Fix: add the tag (or a Verify item) so the gate sees it.
- Related: the checker named no existing Verify item.

### 338 Stange musikkverksted (check 4)

- Same sentence and URL as row 337: "Kommunen har i tillegg gratis lavterskeltilbud rettet mot ungdom gjennom Stange musikkverksted og Ottestad ungdomshus." https://www.stange.kommune.no/kultur-og-frivillighet/aktiviteter-for-ungdom/
- Same issue: it names Stange musikkverksted and Ottestad ungdomshus together, and the Notes lack the "wider body" tag. Same fix as 337.
- Related: the checker named no existing Verify item.

### 341 Felles aktivitet i Løtenhallen (check 2)

- Evidence: the section name "Psykisk helse- og rustjenesten". It is in the breadcrumb and menu, not in the body. The body ("Det legges opp til variert aktivitet som passer for alle!", "slik at alle kan delta uavhengig av forutsetninger") names no theme or target group.
- URL: https://www.loten.kommune.no/helse-sosial-og-familie/psykisk-helse-og-rustjenesten/aktiviteter-og-kurs/felles-aktivitet-i-lotenhallen/
- `psykisk-helse` therefore rests on a menu label alone. If the label counts, the same label names `rus` and the cell should read `psykisk-helse, rus`. If it does not count, the cell should be `none`. The row as written is an in-between reading.
- Related: Verify item 53 lists both alternatives but does not say that keeping only `psykisk-helse` is inconsistent with the Topic rule.

### 344 Møteplassen Elverum (check 2)

- Page sentence: "Treffpunktet er et lavterskeltilbud innen psykisk helse – og er organisert under Møteplassen Elverum." The menu also lists Treffpunktet among the place's activities.
- URL: https://moteplassen.elverum.no/index.php/om-oss/moteplassen-elverum
- The doc says the page names no theme among the eight. Under the "place or its activities" reading of Verify item 1, that is a named psykisk-helse activity (it is also row 345). Row 344's Notes mention the sentence only as a badge candidate, and no Verify item on 344 lists `psykisk-helse` as a topic candidate the way the items for 317, 318, 335 and 339 do. `none` and no badge are right for the place as a whole; the question is only whether item 1 should list 344 too.
- Related: Verify item 1.

### 345 Treffpunktet (Møteplassen Elverum) (Notes, minor)

- Page text: the Treffpunktet page prints a phone number under "Kontaktinformasjon" with no person named; the email is hidden behind a script notice. URL: https://moteplassen.elverum.no/index.php/treffpunkt
- The Notes say the phone and email are "hidden or tied to a contact" and that the phone was not re-confirmed. The seeded phone is on the page and matches, so this is a stale Notes line, not a data problem. Checks 1 to 4 pass: "Du trenger ingen formell henvisning" is present as the doc says, and "ingen henvisning" does not match it.
- Related: the checker named no existing Verify item.

## Summary

Counts read off this file with `grep -c` on the verdict table rows, for example
`grep -c "^| [0-9]* | .* | CONFIRMED |" docs/verification/seed-data-lavterskel-reconcile-check.md`:

| Verdict | `grep -c` output |
|---------|------------------|
| CONFIRMED | 36 |
| MISMATCH | 0 |
| UNREACHABLE | 0 |
| QUESTION | 12 |

`grep -c "^| [0-9][0-9]* |"` on the same file prints 48, one line per row.

Smaller notes the checkers recorded on CONFIRMED rows that bear on my gate:

- 302, 304: the Topic evidence for two topics each is a bare activity name or heading (Verify items 1, 11 and 13 already carry this).
- 305: the badge sentence is on the national kontaktsenter page and covers all Kontaktsentre, so Hamar sits inside a wider body.
- 315: the quote is a location sentence ("Lavterskeltilbudet holder til i Storgata 9B."); it earns the badge only through "lavterskel" in the service's own name (ruled 27.10.2026). Verify item 25 covers the stronger sentence, which is also verbatim on the page.
- 316: the service page and the kommune contact page disagree on which of two numbers is the Gamlevegen 101 line; the seeded phone is the Oppfølgingsteamet line on the kommune page. The Notes say "already ruled", so the verdict stands.
- 317, 318, 339: the cited pages name single activities with themes (317 Sorgstøtte and Aktivitetsfadder, 318 Barnas Røde Kors and Vitnestøtte, 339 Knøttetreff). `none` stands and the candidates are in Verify items 1, 26, 27 and 51.
- 320: the organisation's own phone is printed under "Kontakt oss", which answers Verify item 30.
- 322: if one activity is enough under Verify item 1, the same page also lists "Leksehjelp grunnskole en til en" and "Juleverksted for barn" as `familie-og-barn` candidates that the doc does not mention.
- 328: the badge quote matches the page exactly, including its typo "lavterskeltilbudder". The phone sentence in Verify item 40 sits under the BARK activity, so leaving it out is right.
- 329: the two "henvisning" sentences on the page belong to the neighbouring service and the relatives' section; the Solsia section has none, so the empty quote is right.
- 335: the badge quote is on the parent Stangehjelpa page (heading "Til samarbeidspartnere") and is tagged "wider body". The same page says "Deler av tjenesten er vedtaksbasert." (Verify item 47).
- 340: `familie-og-barn` follows from children as a target group; Verify item 52 covers the alternative.
- 343: the Trimgruppe line "Fysisk aktivitet er beste medisin for god mental og fysisk helse!" is a benefit of exercise, not a theme of the place, so `none` stands.
- 346: the new cost wording "Her kan du være med på mange aktiviteter, og det er gratis." is on the page.
