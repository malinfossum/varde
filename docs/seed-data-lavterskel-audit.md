# Seed data: the lavterskel badge audit

**Status: VERIFICATION GATE CLOSED 10.11.2026.** Rulings made 09.11.2026; every quote below was
read again on the live pages on 10.11.2026. Checked in
docs/verification/seed-data-lavterskel-audit-check.md.

**LastVerified:** this pass read only the referral statement, the price wording, the address of
rows 17 and 18 and the description of row 17. It does not move LastVerified.

43 rows carried the Lavterskel badge before this pass. Nine of them rested on a quote that is
not about the unit itself: an intro that covers a whole department, a sentence about a wider
body, or a line that only says you need no referral from a doctor. Each of the nine was read
again against the unit's own page. Nothing is written from memory.

## The rule

A sentence that covers a whole department or a wider body never earns a unit the badge on its
own. Neither does a line that only rules out a referral from a GP: a unit can still need a
vedtak or an assessment by an allocation team. Psykisk helse og rus is organised differently in
every kommune, so each unit's own text decides.

This doc overrides the Referral quote of its rows in docs/seed-data-lavterskel-retag.md and
docs/seed-data-lavterskel-reconcile.md. An empty quote means no badge.

## Badge off

| # | Name | Kommune | Source URL | Referral quote | Verified | Notes |
|---|---|---|---|---|---|---|
| 17 | Housing First, Lillehammer kommune | Lillehammer | https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/housing-first/ https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/om-psykisk-helse-og-rus/vi-flytter-til-nye-lokaler/ | | 2026-11-10 | The old quote ("Det er kort ventetid og du kan selv ta kontakt uten henvisning fra fastlege.") is the department intro on the contact page. The unit's own page: "Du kan søke direkte til teamet" and "Om vi kommer frem til at du skal delta i Housing First blir du tildelt et vedtak". Cost stays `free`; the note now comes from the own page: "Tilbudet er gratis". Description rewritten, see below. Address added, see below. |
| 18 | Oppfølgingsteamet, Lillehammer kommune | Lillehammer | https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/til-fastleger-og-henvisere/ https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/om-psykisk-helse-og-rus/vi-flytter-til-nye-lokaler/ | | 2026-11-10 | Same department intro as row 17. The team has no own page; its contact block holds only phone, hours and address. The referral page says requests go through an intake team that includes the allocation office: "Inntaksteam for psykisk helse og rus avholder ukentlige møter hver tirsdag, hvor henvisninger og henvendelser fra personer som selv tar kontakt gjennomgås, vurderes og fordeles." and "Teamet er tverrfaglig sammensatt og består av representanter fra Tildelingsenheten". Cost stays `free` with its note. Address added, see below. |
| 305 | Evangeliesenteret kontaktsenter Hamar | Hamar | https://www.evangeliesenteret.no/kontaktsenter/hamar | | 2026-11-10 | The old quote is from the national page and covers every kontaktsenter: "Evangeliesenterets Kontaktsentre er et lavterskeltilbud for rusmisbrukere og hjemløse." The Hamar page has no referral sentence of its own: "Hamar kontaktsenter deler ut mat hver onsdag kl. 12:00 – 16:00." The word "lavterskeltilbud" appears three times on the Hamar page, but only in its list of other centres (Moss, Lofoten, Strømmen). Stays in category 10. |
| 335 | Stangehjelpa aktivitetshus | Stange | https://www.stange.kommune.no/helse-og-mestring/psykisk-helse-og-rus/stangehjelpa/voksne/stangehjelpa-aktivitetshus/ | | 2026-11-10 | The old quote is from the parent Stangehjelpa page: "Vi er et tilbud med lav terskel og du trenger ingen henvisning (med unntak fra PP-tjenesten)." The house's own page has no referral or lavterskel sentence: "Du kan selv ta kontakt med aktivitetshuset, eller du kan henvende deg via noen du har kontakt med i hjelpeapparatet for øvrig." That is not a badge phrase, so no badge. Stays in category 10. |

### Rows 17 and 18: new address

The whole psykisk helse og rus service in Lillehammer is moving. The notice page says: "Først ut
er Psykisk helse- og rusteam, Oppfølgingsteamet og Housing First, flyttingen starter 28.
september." and gives the new address as "Industrigata 17, 3. etg. 2619 Lillehammer". Rows 17
and 18 had no address, so both get `Industrigata 17, 3. etg., 2619 Lillehammer`. The contact
page still prints Kirkegata 26 for both teams; the notice is newer and names them.

### Row 17: description and cost note

The old description said you "først får en varig bolig". The unit's own page says the opposite:
"Det er viktig å være klar over at teamet ikke disponerer boliger og ikke tildeler kommunale
boliger." The new text uses only the own page:

- "Du må ha langvarige utfordringer knyttet til rus og/eller psykisk lidelse og være fylt 18 år"
- "Vår rolle er å støtte, veilede og motivere deg til å mestre eget boforhold."
- "Teamet gir oppfølging til personer som bor i kommunal bolig, leier privat eller eier egen bolig."
- "Søker du kommunal bolig kan du skrive i det elektroniske skjemaet at du ønsker vurdering av deltakelse i Housing First"
- "Om du ønsker å søke, ta kontakt med oss for en informasjonssamtale før du sender søknaden."
- "Om vi kommer frem til at du skal delta i Housing First blir du tildelt et vedtak"

"uten krav om rusfrihet" is gone: the page does not say it.

| Field | nb | en |
|---|---|---|
| Description | Støtte til å mestre eget boforhold for deg som er fylt 18 år og har langvarige utfordringer knyttet til rus og/eller psykisk lidelse. Teamet følger deg opp enten du bor i kommunal bolig, leier privat eller eier egen bolig. Teamet disponerer ikke boliger og tildeler ikke kommunale boliger. Søker du kommunal bolig, kan du skrive i søknaden at du ønsker vurdering av deltakelse i Housing First. Ta kontakt for en informasjonssamtale før du søker. Skal du delta, får du et vedtak. | Support to manage your own home for people aged 18 or over with long-term difficulties related to substance use and/or mental illness. The team follows you up whether you live in municipal housing, rent privately or own your home. The team does not hold or allocate municipal housing. If you apply for municipal housing, you can write in the application that you want to be assessed for Housing First. Get in touch for an information talk before you apply. If you join, you get a formal decision (vedtak). |
| Cost note | Tilbudet er gratis. | The service is free. |

## Badge kept

These five were flagged for the same reasons, and the unit's own page supports the badge. The
table has no Referral quote column, so it does not override anything.

| # | Name | Kommune | Why flagged | Own page (verbatim) | Ruling |
|---|---|---|---|---|---|
| 218 | Overgrepsmottaket, Legevakten i Oslo | Oslo | The quote rules out only a doctor's referral | "Ta kontakt med oss selv om du ikke husker hva som har skjedd. Alle som henvender seg til oss får rask hjelp." No vedtak step. | Keep |
| 230 | Rask psykisk helsehjelp – Bydel Ullern | Oslo | The quote rules out only a doctor's referral | "Alle henvendelser blir drøftet i teamet for å vurdere om dette er riktig tilbud for deg." No vedtak or allocation step. | Keep |
| 102 | Psykisk helse- og rustjenester, Ringsaker kommune | Ringsaker | The row is a whole department, and parts need a vedtak | "... gir tilbud om inntil fire samtaler ... Du trenger ikke henvisning." and "Tjenesten er tilgjengelig hele døgnet for de brukere som har vedtak om det." | Keep: the entry offer is open, and the description already says up to four talks without a referral |
| 105 | Stangehjelpa (avdeling for psykisk helse og rus), Stange kommune | Stange | Parts need a vedtak | "Vi er et tilbud med lav terskel og du trenger ingen henvisning (med unntak fra PP-tjenesten)." and "Deler av tjenesten er vedtaksbasert." | Keep |
| 225 | Prindsen mottakssenter | Oslo | Parts need a vedtak | "... er et helse- og sosialfaglig lavterskeltilbud ..." and "For vedtak om akuttplass mandag–fredag kl. 09:00–15:00, ta kontakt med din bydel." | Keep |

## Checked, not flagged

The other badged rows rest on the unit's own page, or on a kommune page that names the unit:
10, 12, 15, 21, 112, 115, 117, 118, 216, 219, 221, 224, 226, 227, 229, 232, 237, 238, 239, 240,
243, 301, 306, 307, 315, 316, 320, 321, 328, 333, 334, 337, 338, 345.

## Follow-ups (not in this PR)

- Row 15 (Rask psykisk helsehjelp, Lillehammer kommune) moves to Industrigata 17 in December: "Rask
  psykisk helsehjelp starter flyttingen i løpet av desember." Dated check then.
- Row 17's Website still points to the department index; Housing First now has its own page.
  DONE 10.11.2026 in docs/seed-data-audit-follow-ups.md.
- Row 225's description says "Du trenger ikke henvisning for å komme", which also reads as
  covering the akutt overnatting that needs a vedtak from the bydel. DONE 10.11.2026 in
  docs/seed-data-audit-follow-ups.md.
