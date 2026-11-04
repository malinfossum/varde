# Seed data: the three-month re-check of the 16 acute rows

**Status: VERIFICATION GATE CLOSED 04.11.2026.** I resolved every item under "Verify these first",
so the rows below are ready to seed.

Every acute row (category `nodtjenester`: 3, 4, 5, 12, 14, 16, 19, 21, 23, 24, 25, 216, 218, 221,
222, 236) was read again on 04.11.2026 against the pages its seed doc cites. Every seeded field
was checked: name, phone, phone menu option, email, website, chat URL, address, IsAlwaysOpen,
opening hours (nb and en), cost and cost note, the low-threshold quote where the row has one, and
whether the nb and en descriptions still match what the page says the service does. Each
difference is listed under "Verify these first", and I fix it only once I have resolved it.
Nothing is written from memory. Every quote below was fetched with curl and read as plain text.

None of the 16 rows seeds an email, a parent or a phone menu option, so those fields had nothing to
check. Person-tied contacts printed on the pages of rows 4, 5, 12 and 218 are not recorded here.

## Verify these first

1. **Row 3 (Legevakt), Website:** the seeded URL now answers with a 301 redirect. Seeded value:
   `https://www.helsenorge.no/legevakt/`. The page cites itself as "Tilgjengelig fra:
   https://www.helsenorge.no/hjelpetilbud-i-kommunene/legevakt/". Source:
   https://www.helsenorge.no/hjelpetilbud-i-kommunene/legevakt. The same URL is the `source` of the
   `legevakt` line in `web/src/services/emergency.ts`. Proposed value:
   `https://www.helsenorge.no/hjelpetilbud-i-kommunene/legevakt/` in both places.
   RESOLVED 04.11.2026: Website `https://www.helsenorge.no/hjelpetilbud-i-kommunene/legevakt/`, in the seed and as the `source` of the `legevakt` line in `emergency.ts`.
2. **Row 12 (Hamar interkommunale krisesenter), Website:** the seeded URL now answers with a 301
   redirect. Seeded value: `https://www.hamar.kommune.no/familiehjelp-oversikt-over-tilbud/krisesenter/`.
   The redirect target carries the same content ("Krisesenteret er døgnåpent alle dager, også på
   helligdager."). Source: https://www.hamar.kommune.no/krisesenter/. Proposed value:
   `https://www.hamar.kommune.no/krisesenter/`.
   RESOLVED 04.11.2026: Website `https://www.hamar.kommune.no/krisesenter/`.
3. **Row 14 (Ringsaker interkommunale barnevernvakt), Website:** the seeded URL now answers with a
   301 redirect. Seeded value:
   `https://www.hamar.kommune.no/familiehjelp-oversikt-over-tilbud/hjelpetelefoner-for-familier-og-barn-unge/`.
   The redirect target still lists the service ("Ringsaker interkommunale barnevernvakt", "Tlf: 40 40
   40 15"). Source:
   https://www.hamar.kommune.no/familiehjelp-oversikt-over-tilbud/kontaktsteder-i-en-krisesituasjon/.
   Proposed value: that redirect target. Alternative: the operating kommune's page
   https://www.ringsaker.kommune.no/tjenester/barn-oppvekst-og-laering/barnevern/melding-til-barneverntjenesten,
   which the 15:30 hours already rest on.
   RESOLVED 04.11.2026: Website `https://www.ringsaker.kommune.no/tjenester/barn-oppvekst-og-laering/barnevern/melding-til-barneverntjenesten`, not the Hamar re-listing. Ringsaker runs the service, so its page is the service's own, and it prints the 15:30 hours the row shows. The Hamar page prints the 15:00 variant I ruled out twice.
4. **Row 16 (Gudbrandsdal Krisesenter IKS), opening hours and IsAlwaysOpen:** the seed has no
   opening hours (nb or en) and IsAlwaysOpen is false. The front page says "Døgnåpent - Gratis -
   Alle dager" under "Telefonnummer: 41 48 12 20" (https://gudbrandsdal-krisesenter.no/), and the
   offer page says "Vi har døgnåpen telefon (støtte/veiledning)."
   (https://gudbrandsdal-krisesenter.no/tilbud). Proposed value: nb `Døgnåpent`, en `Open 24
   hours`, IsAlwaysOpen true (the same treatment as rows 12 and 21).
   RESOLVED 04.11.2026: nb `Døgnåpent`, en `Open 24 hours`, IsAlwaysOpen true.
5. **Row 16 (Gudbrandsdal Krisesenter IKS), description:** two parts have no source. (a) Seeded nb
   "Tilbudet er gratis, og du trenger ingen henvisning." and en "The service is free and needs no
   referral.": the free part is on the page ("Døgnåpent - Gratis - Alle dager"), but /, /tilbud,
   /om-oss and /kontakt say nothing about referral. (b) Seeded "utsatt for vold eller trusler om
   vold i nære relasjoner": the pages say "utsatt for vold i nære relasjoner"
   (https://gudbrandsdal-krisesenter.no/tilbud); "trussel" appears only in the menu item "Råd til
   volds- og trusselutsatte". Proposed value: nb "Krisesenter for kvinner, menn og barn som er
   utsatt for vold i nære relasjoner. Tilbudet er gratis." and en "A crisis centre for women, men
   and children affected by violence in close relationships. The service is free." (the same
   ruling as row 228 on 03.11.2026). Alternative for (b): keep "trusler om vold" on the menu item.
   RESOLVED 04.11.2026: The description says only what the service's own pages say, the same rule as row 228 on 03.11.2026. nb "Krisesenter for kvinner, menn og barn som er utsatt for vold i nære relasjoner. Tilbudet er gratis." en "A crisis centre for women, men and children affected by violence in close relationships. The service is free."
6. **Row 19 (Mottak for seksuelle overgrep, Lillehammer), description: page says nothing.** The
   cited page prints only the label and the number: "Mottak for seksuelle overgrep: 61 27 22 16"
   (https://lillehammer.kommune.no/om-kommunen/kontakt-oss/nod-og-vakttelefoner/). Nothing on it
   supports the seeded nb "Medisinsk hjelp, undersøkelse og sporsikring ... Du kan ta kontakt uten
   å ha anmeldt forholdet til politiet." or its en version. Proposed value: keep the seeded
   description, flagged, until a page for the service itself is found and cited.
   RESOLVED 04.11.2026: Keep the seeded description, flagged, until I find and cite a page for the service itself.
7. **Row 21 (Gjøvik Krisesenter IKS), description:** seeded nb "utsatt for vold i nære relasjoner,
   voldtekt eller tvangsekteskap" (en "violence in close relationships, rape or forced marriage").
   None of the cited pages (/no/Kontakt-oss.html, /no/om-oss.html, /no/Vare-tilbud.html) nor the
   front page, /no/Hva-er-vold.html or /no/Kvinner.html names rape or forced marriage. The pages
   say "Vi tilbyr et gratis døgnåpent tilbud til personer utsatt for vold i nære relasjoner."
   (https://www.krisesenteret-gjovik.no/no/om-oss.html). Proposed value: nb "Gratis døgnåpent
   tilbud til kvinner, menn og barn som er utsatt for vold i nære relasjoner. Adressen oppgis først
   når du tar kontakt, av hensyn til sikkerheten." and en "A free 24-hour service for women, men
   and children affected by violence in close relationships. The address is only given when you
   make contact, for safety reasons."
   RESOLVED 04.11.2026: The description says only what the service's own pages say, as in item 5. nb "Gratis døgnåpent tilbud til kvinner, menn og barn som er utsatt for vold i nære relasjoner. Adressen oppgis først når du tar kontakt, av hensyn til sikkerheten." en "A free 24-hour service for women, men and children affected by violence in close relationships. The address is only given when you make contact, for safety reasons."
8. **Row 24 (Politi (nødnummer)), cost:** the seed has no Cost and no cost note (the 26.10.2026
   retag found no price). The page's "Nødnummeret 112" section now says "Det er gratis å ringe til
   112." (https://www.politiet.no/kontakt-politiet/ring-politiet; the text sits in a collapsed
   section that is in the page source). Proposed value: Cost `free`, nb cost note "Det er gratis å
   ringe til 112.", en "It is free to call 112." Linked question: the row 25 and row 23 pages say
   nothing about price, but row 3's page says of 113 "Ring 113 når det er akutt og står om liv. Det
   er gratis å ringe." (https://www.helsenorge.no/hjelpetilbud-i-kommunene/legevakt). Should row 25
   take that sentence, so the acute strip's numbers read the same way?
   RESOLVED 04.11.2026: No change. Rows 23, 24 and 25 keep no Cost and no cost note. Emergency numbers are free to call, so they need no badge and no mention. The linked question for row 25 closes the same way.
9. **Row 24 (Politi (nødnummer)), opening hours: page says nothing.** The page states "Ring
   nødnummeret 112 når det er behov for øyeblikkelig hjelp." but no hours. Proposed value: keep
   `Døgnåpent` / `Open 24 hours` and IsAlwaysOpen true, flagged.
   RESOLVED 04.11.2026: Keep `Døgnåpent` / `Open 24 hours` and IsAlwaysOpen true, flagged.
10. **Row 25 (Ambulanse (medisinsk nødhjelp)), opening hours: page says nothing.** The page states
    "Ring 113 om situasjonen er kritisk, og det står om liv og helse." but no hours
    (https://www.helsenorge.no/forstehjelp). Proposed value: keep `Døgnåpent` / `Open 24 hours` and
    IsAlwaysOpen true, flagged.
    RESOLVED 04.11.2026: Keep `Døgnåpent` / `Open 24 hours` and IsAlwaysOpen true, flagged.
11. **Row 222 (Legevakten i Oslo), opening hours and IsAlwaysOpen:** seeded nb `Åpent 00–24`, en
    `Open 24 hours`, IsAlwaysOpen false. The page says "Døgnåpent tilbud når hjelpen ikke kan
    vente." and "Åpent: 00–24"
    (https://www.oslo.kommune.no/helse-og-omsorg/akutt-helsehjelp-og-legevakt/legevakt-oslo/). With
    IsAlwaysOpen false the row does not show as always open, although the page says it is. Proposed
    value: nb `Døgnåpent`, en `Open 24 hours`, IsAlwaysOpen true.
    RESOLVED 04.11.2026: nb `Døgnåpent`, en `Open 24 hours`, IsAlwaysOpen true.
12. **Row 236 (Barnevernvakten i Oslo), opening hours:** the seed has none and IsAlwaysOpen is
    false. The official pages disagree:
    - Oslo kommune: "Barnevernvakten er barnevernets akuttberedskap på kveldstid og i helger."
      (https://www.oslo.kommune.no/helse-og-omsorg/barn-ungdom-og-familie/barnevern-og-foreldreveiledning/bekymringsmelding/)
    - Oslo kommune lists it under the heading "Døgnåpne tjenester" with no hours
      (https://www.oslo.kommune.no/dognapne-tjenester/).
    - barnevernvakten.no, which Oslo kommune links as "Kontakt Barnevernvakten": "Åpningstider:
      Døgnåpen vakt." (https://www.barnevernvakten.no/kommuner/oslo-kommune; the site says it is run
      by Barnevernsvakten i Kristiansand kommune).
    - Alarmtelefonen: "Det er fire barnevernvakter i Norge som er døgnåpne og besvarer
      Alarmtelefonen hele døgnet. Dette gjelder Oslo, Trondhjem, Romerike og Tromsø."
      (https://www.116111.no/omalarmtelefonen)

    Proposed value: keep the hours empty until I rule. If I accept barnevernvakten.no and
    Alarmtelefonen over the kommune's "kveldstid og i helger": nb `Døgnåpent`, en `Open 24 hours`,
    IsAlwaysOpen true.
    RESOLVED 04.11.2026: barnevernvakten.no is the service's own page (Oslo kommune links it as "Kontakt Barnevernvakten"), so its "Døgnåpen vakt." and Alarmtelefonen's statement outweigh the kommune's "kveldstid og i helger". nb `Døgnåpent`, en `Open 24 hours`, IsAlwaysOpen true. Website `https://www.barnevernvakten.no/kommuner/oslo-kommune`.
13. **Row 236 (Barnevernvakten i Oslo), address:** the seed has none ("NOT FOUND" in
    seed-data-oslo.md). barnevernvakten.no prints "Besøksadresse: Politihuset i Oslo Grønlandsleiret
    44 0190 Oslo" (https://www.barnevernvakten.no/kommuner/oslo-kommune). No Oslo kommune page I
    read prints an address. The same page also prints a functional email; the seed has none.
    Proposed value: `Grønlandsleiret 44 (Politihuset i Oslo), 0190 Oslo` if I accept
    barnevernvakten.no as the service's page (Oslo kommune links to it); otherwise keep it empty.
    RESOLVED 04.11.2026: Address `Grønlandsleiret 44 (Politihuset i Oslo), 0190 Oslo`, from barnevernvakten.no as the service's own page (item 12). The email is not seeded.
14. **Row 4 (Alarmtelefonen for barn og unge), description:** found by the independent check
    (missed difference 1). Seeded nb "Gratis døgnåpen telefon for barn og unge som opplever vold,
    overgrep eller omsorgssvikt." and en "A free 24-hour phone line for children and young people
    experiencing violence, abuse or neglect.". The check found "overgrep" on none of
    /omalarmtelefonen, /, /ungdom and /barn, and the full wording only on Hamar kommune's
    re-listing.
    RESOLVED 04.11.2026: The check's claim was wrong. The service's own front page supports the seeded wording: its heading reads "Blir du utsatt for vold eller overgrep?" and its meta description reads "Alarmtelefonen er en gratis telefon for barn og unge som er utsatt for vold, overgrep og omsorgssvikt." (https://www.116111.no/, re-read 04.11.2026). No change to row 4's description.
15. **Row 14 (Ringsaker interkommunale barnevernvakt), description:** found by the independent
    check (missed difference 2). Seeded nb "Barnevernets akuttberedskap på kveld, natt, helg og
    helligdager for barn og unge i akutte situasjoner. Både barn selv og voksne som er bekymret kan
    ringe." The cited pages contain neither "akuttberedskap", "akutte situasjoner" nor anything about
    children calling themselves. Ringsaker says "For henvendelser utenfor alminnelig kontortid,
    kontakt Ringsaker interkommunale barnevernvakt" and Hamar says "For henvendelser om generell råd
    og veiledning eller bekymringsmeldinger."
    RESOLVED 04.11.2026: The description says only what the cited pages say. nb "Barnevernvakt for henvendelser utenfor alminnelig kontortid. Du kan ringe for generelle råd og veiledning eller for å melde en bekymring." en "The child welfare out-of-hours service, for enquiries outside normal office hours. You can call for general advice and guidance or to report a concern." Sources: https://www.ringsaker.kommune.no/tjenester/barn-oppvekst-og-laering/barnevern/melding-til-barneverntjenesten and https://www.hamar.kommune.no/familiehjelp-oversikt-over-tilbud/kontaktsteder-i-en-krisesituasjon/, both re-read 04.11.2026.
16. **Row 14 (Ringsaker interkommunale barnevernvakt), hours and phone grouping:** found by the
    independent check (missed difference 3). The Hamar page lists the same number a third way:
    "Barnevernvakta - Tlf. 404 04 015" with "Døgnåpent nummer.", beside its "Alle kvelder og netter
    15.00 – 08.00 + helger/helligdager" entry. Also, `docs/seed-data.md` row 14 prints
    `40 40 40 15`, while the seed has `404 04 015`. The digits are the same.
    RESOLVED 04.11.2026: Recorded only, no seed change. Ringsaker's own "15.30 – 08.00 på hverdager, og hele døgnet på helg og helligdager" still outranks both Hamar variants. The phone keeps `404 04 015` under the 17.08.2026 grouping rule (mobile numbers group as "xxx xx xxx").
17. **Row 236 (Barnevernvakten i Oslo), phone source claim:** found by the independent check
    (missed difference 4). The Rows table said 40 42 77 77 is "on all three pages". The
    bekymringsmelding page does not print it; it only links to barnevernvakten.no.
    RESOLVED 04.11.2026: The Rows table now names the two pages that print the number (Oslo kommune's døgnåpne-tjenester page and barnevernvakten.no). The value stays.
18. **Rows 218, 221, 222 and 236, Website:** found by the independent check (missed difference
    5). All four seed the Oslo kommune front page `https://www.oslo.kommune.no`, although each row
    cites its own service page as its source in `docs/seed-data-oslo.md`.
    RESOLVED 04.11.2026: Each row's Website becomes the service page it cites. Row 218 `https://www.oslo.kommune.no/helse-og-omsorg/akutt-helsehjelp-og-legevakt/legevakt-oslo/overgrepsmottaket/`, row 221 `https://www.oslo.kommune.no/helse-og-omsorg/akutt-helsehjelp-og-legevakt/psykososial-akuttjeneste/`, row 222 `https://www.oslo.kommune.no/helse-og-omsorg/akutt-helsehjelp-og-legevakt/legevakt-oslo/`. All three answered 200 without a redirect on 04.11.2026. Row 236 takes barnevernvakten.no (item 12).
19. **Row 236 (Barnevernvakten i Oslo), description:** I checked every claim in the seeded nb
    "Barnevernets akuttberedskap for barn og unge i akutte situasjoner. Både barn selv og voksne
    som er bekymret for et barn kan ta kontakt." and its en version against the pages this doc
    cites for the row. Supported: "Barnevernvakten er barnevernets akuttberedskap på kveldstid og i
    helger."
    (https://www.oslo.kommune.no/helse-og-omsorg/barn-ungdom-og-familie/barnevern-og-foreldreveiledning/bekymringsmelding/)
    and "om situasjonen er akutt og hjelp må iverksettes raskt"
    (https://www.barnevernvakten.no/kommuner/oslo-kommune). Not supported as written: no page says
    who may call in the words "Både barn selv og voksne som er bekymret for et barn". The
    bekymringsmelding page's "Voksne som er bekymret for barn kan også ringe." is about
    Alarmtelefonen, not Barnevernvakten. What barnevernvakten.no says is "Ta kontakt dersom du selv
    blir utsatt for, eller kjenner til at barn eller unge utsettes for:", followed by a list that
    includes "vold eller er vitne til vold", "seksuelle overgrep" and "omsorgssvikt".
    RESOLVED 04.11.2026: The description says only what the pages say, as in item 5. "i akutte situasjoner" goes too: barnevernvakten.no prints "akutt" only in "Oslo kommune har akuttberedskap." and in the list of what the vakt assesses ("om situasjonen er akutt og hjelp må iverksettes raskt"), never as who the line is for. nb "Barnevernets akuttberedskap for barn og unge. Du kan ta kontakt hvis du selv blir utsatt for vold, seksuelle overgrep eller omsorgssvikt, eller kjenner til at barn eller unge blir det." en "The child welfare emergency service for children and young people. You can get in touch if you are exposed to violence, sexual abuse or neglect yourself, or know of children or young people who are."

**LastVerified:** I re-read every seeded field of all 16 rows on 04.11.2026, so every row takes
LastVerified 2026-11-04, changed or not. The four `verified` dates in
`web/src/services/emergency.ts` (rows 23, 24, 25 and 3) move with them.

No page was unreachable. Two pages fill part of their content with JavaScript, but the text was
in the fetched source: politiet.no keeps its section text in embedded page data, and Oslo kommune
fills the times under "Åpningstid" on row 221's page from data attributes (kl. 00:00–23:59 every
day).

## Rows

| # | Name | Source URL(s) | Fields confirmed | Differences (item no.) |
|---|------|---------------|------------------|------------------------|
| 3 | Legevakt | https://www.helsenorge.no/hjelpetilbud-i-kommunene/legevakt (redirect from the seeded URL) | Name, phone "116 117" (also "116117"), IsAlwaysOpen ("Du kan ringe 116 117 hele døgnet"), hours, Cost paid, cost note verbatim, description (nb, en). `emergency.ts` phone matches the seed. | 1 |
| 4 | Alarmtelefonen for barn og unge | https://www.116111.no/omalarmtelefonen https://www.116111.no/ | Name, phone 116 111, chat URL ("Ring 116 111 eller chat med oss."), IsAlwaysOpen ("Telefonen og e-post er åpne for samtaler hele døgnet for hele landet."), hours, Cost free, cost note verbatim, description (nb, en). Chat and SMS hours (kl. 16:15–22:45, Saturdays to kl. 23:45) unchanged; they stay note-only. | 14 (no change) |
| 5 | VO-linjen | https://www.volinjen.no/ | Name, phone 116 006, chat URL, IsAlwaysOpen ("Vår telefontjeneste er døgnåpen"), hours, Cost free, cost note "Helt gratis og anonymt." verbatim, description (nb, en). Chat still "mandag til fredag kl. 09.00 - 20.00". | none |
| 12 | Hamar interkommunale krisesenter | https://www.hamar.kommune.no/krisesenter/ https://www.hamar.kommune.no/familiehjelp-oversikt-over-tilbud/kontaktsteder-i-en-krisesituasjon/ https://www.ringsaker.kommune.no/tjenester/brann-og-beredskap/hamar-interkommunale-krisesenter | Name, phone 62 56 18 30, address "Kronborgvegen 23, 2318 Hamar", IsAlwaysOpen, hours, Cost free, cost note verbatim (on the kontaktsteder page), low-threshold quote, description (nb, en), coverage (Ringsaker, Løten, Stange, Elverum named in "Senteret gir krisesentertilbud til innbyggerne i ..."). | 2 |
| 14 | Ringsaker interkommunale barnevernvakt | https://www.ringsaker.kommune.no/tjenester/barn-oppvekst-og-laering/barnevern/melding-til-barneverntjenesten https://www.hamar.kommune.no/familiehjelp-oversikt-over-tilbud/kontaktsteder-i-en-krisesituasjon/ | Name, phone (seeded "404 04 015"; Ringsaker prints "40 40 40 15", Hamar prints both groupings), hours ("15.30 – 08.00 på hverdager, og hele døgnet på helg og helligdager"). The Hamar page still says "15.00 – 08.00", the variant ruled out twice (17.08.2026, 26.10.2026). | 3, 15, 16 |
| 16 | Gudbrandsdal Krisesenter IKS | https://gudbrandsdal-krisesenter.no/kontakt https://gudbrandsdal-krisesenter.no/ https://gudbrandsdal-krisesenter.no/tilbud https://gudbrandsdal-krisesenter.no/om-oss | Name, phone (414 81 220 and 41 48 12 20), address "Skoletorget 6 D, 2609 Lillehammer", website, Cost free ("Gratis"), no low-threshold quote. | 4, 5 |
| 19 | Mottak for seksuelle overgrep, Lillehammer | https://lillehammer.kommune.no/om-kommunen/kontakt-oss/nod-og-vakttelefoner/ | Name (label), phone 61 27 22 16, website, no hours (page prints none). | 6 |
| 21 | Gjøvik Krisesenter IKS | https://www.krisesenteret-gjovik.no/no/Kontakt-oss.html https://www.krisesenteret-gjovik.no/no/om-oss.html https://www.krisesenteret-gjovik.no/no/Vare-tilbud.html | Name, phone 61 17 55 60, address withheld ("Besøksadresse: Gis ved kontakt"), IsAlwaysOpen ("Du kan ringe oss hele døgnet."), hours, Cost free, cost note "Tilbudet er gratis." verbatim, low-threshold quote. The contact page also prints organisation and bank details (not recorded). | 7 |
| 23 | Brannvesen (nødnummer) | https://www.dsb.no/brannsikkerhet/nodmelding/110-sentralene/ | Name, phone 110, IsAlwaysOpen ("Alle 110-sentralene er døgnbemannet av heltidspersonell."), hours, description verbatim ("Ved brann, ulykker eller andre akutte situasjoner, ring nødnummer 110."). `emergency.ts` matches the seed. | none |
| 24 | Politi (nødnummer) | https://www.politiet.no/kontakt-politiet/ring-politiet | Name, phone 112 ("Nødnummeret 112"), description verbatim. `emergency.ts` matches the seed. | 8, 9 |
| 25 | Ambulanse (medisinsk nødhjelp) | https://www.helsenorge.no/forstehjelp | Name, phone 113, description verbatim. `emergency.ts` matches the seed. | 8 (linked question), 10 |
| 216 | Oslo Krisesenter | https://www.oslokrisesenter.no/kontakt-oss https://www.oslokrisesenter.no/sporsmal-og-svar | Name, phone 22 48 03 80, address withheld ("Oslo Krisesenter holder til på hemmelig adresse."), IsAlwaysOpen ("Døgnåpen telefon"), hours, Cost free, cost note verbatim, low-threshold quote, description (nb, en). | none |
| 218 | Overgrepsmottaket, Legevakten i Oslo | https://www.oslo.kommune.no/helse-og-omsorg/akutt-helsehjelp-og-legevakt/legevakt-oslo/overgrepsmottaket/ | Name, phone ("23040500"), address "Trondheimsveien 233 (Aker sykehus) 0587 Oslo", IsAlwaysOpen, hours, Cost free, cost note verbatim, low-threshold quote, description (nb, en) including the under-14 barnemottaket line. | 18 |
| 221 | Psykososial akuttjeneste, Legevakten i Oslo | https://www.oslo.kommune.no/helse-og-omsorg/akutt-helsehjelp-og-legevakt/psykososial-akuttjeneste/ | Name, phone ("23040500"), address, IsAlwaysOpen ("kommunens døgnåpne tjeneste ved akutt oppståtte kriser"), hours, Cost free, cost note verbatim, low-threshold quote, description (nb, en). | 18 |
| 222 | Legevakten i Oslo | https://www.oslo.kommune.no/helse-og-omsorg/akutt-helsehjelp-og-legevakt/legevakt-oslo/ | Name, phone 116 117, address "Trondheimsveien 233 (Aker sykehus)", Cost paid, cost note verbatim, description (nb, en). The page now prints the second number itself ("Alternativt nummer: 23 48 72 00"); the 17.08.2026 ruling to show 116 117 still holds, so no change proposed. | 11, 18 |
| 236 | Barnevernvakten i Oslo | https://www.oslo.kommune.no/dognapne-tjenester/ https://www.oslo.kommune.no/helse-og-omsorg/barn-ungdom-og-familie/barnevern-og-foreldreveiledning/bekymringsmelding/ https://www.barnevernvakten.no/kommuner/oslo-kommune | Name, phone 40 42 77 77 (on the døgnåpne-tjenester page and on barnevernvakten.no; the bekymringsmelding page only links to barnevernvakten.no), first description sentence ("Barnevernvakten er barnevernets akuttberedskap ..."). | 12, 13, 17, 18, 19 |
