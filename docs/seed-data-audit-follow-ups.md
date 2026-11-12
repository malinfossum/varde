# Seed data: two follow-ups from the lavterskel badge audit

**Status: VERIFICATION GATE CLOSED 10.11.2026.** Both pages were read on the live site on
10.11.2026 with curl and a local tag strip. Checked in
docs/verification/seed-data-audit-follow-ups-check.md.

**LastVerified:** this pass read only the Website of row 17 and the description of row 225. It
does not move LastVerified.

docs/seed-data-lavterskel-audit.md listed three follow-ups. This doc settles two of them. Row 15
moves to Industrigata 17 in December and stays a dated check. Nothing is written from memory.

## Row 17: Website

| # | Name | Kommune | Field | Old value | New value | Source URL | Verified |
|---|---|---|---|---|---|---|---|
| 17 | Housing First, Lillehammer kommune | Lillehammer | Website | https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/ | https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/housing-first/ | https://lillehammer.kommune.no/helse-og-velferd/psykisk-helse-og-rus/ | 2026-11-10 |

The old value is the department index. That index links to the new page in its menu, under the
link text "Housing First". The link is copied from the index as printed, with the default port
`:443` left out. The new page is the unit's own page:

- Its heading is "Housing First" and it opens with "Housing First er et tilbud for bostedsløse og
  personer med en ustabil bosituasjon som følge av rusproblemer og/eller psykiske
  helseutfordringer."
- It carries the team's own application rules: "Du kan søke direkte til teamet ved å ta kontakt
  med teamleder eller via inntaksteamet for psykisk helse og rus"
- It says the team itself makes the decision: "Om vi kommer frem til at du skal delta i Housing
  First blir du tildelt et vedtak"

## Row 225: description

| # | Name | Kommune | Source URL | Verified |
|---|---|---|---|---|
| 225 | Prindsen mottakssenter | Oslo | https://www.oslo.kommune.no/helse-og-omsorg/rustjenester/alle-rusinstitusjoner/prindsen-mottakssenter/ | 2026-11-10 |

The source URL in docs/seed-data-oslo.md
(`https://oslo.kommune.no/helse-og-omsorg/rusomsorg/rusinstitusjon/alle-rusinstitusjoner/prindsen-mottakssenter`)
now redirects to the URL above.

The old description ended "Du trenger ikke henvisning for å komme." The page has no sentence
about a referral. It also says the akutt overnatting needs a vedtak, so the old sentence read as
covering a part that is not open. The new text keeps the first sentence and replaces the second
with what the page says:

- "Feltpleie med gratis drop-in helsetjenester"
- "For vedtak om akuttplass mandag–fredag kl. 09:00–15:00, ta kontakt med din bydel."
- "For vedtak om akuttplass etter kl. 15:00 frem til kl. 09:00 samt helg, fri- og helligdager
  hele døgnet, kan du møte opp på Oslo legevakt i Trondheimsveien 233 (Aker sykehus), eller
  ringe psykososial akuttjeneste på telefon 23 04 05 00."

The page says nothing about whether the brukerrom needs a referral or a vedtak, so the new text
says nothing about it either. The badge stays: it rests on "Prindsen mottakssenter er et helse-
og sosialfaglig lavterskeltilbud for personer over 18 år med alvorlige og langvarige
rusproblemer." (docs/seed-data-lavterskel-retag.md and docs/seed-data-lavterskel-audit.md).

| Field | nb | en |
|---|---|---|
| Description | Lavterskeltilbud med helse- og sosialtjenester for deg med rusutfordringer, med brukerrom, feltpleie, lege og akutt overnatting. Feltpleien har gratis drop-in helsetjenester. For en akuttplass trenger du et vedtak: på hverdager kl. 09:00–15:00 kontakter du bydelen din, ellers Oslo legevakt eller psykososial akuttjeneste. | A low-threshold centre with health and social services for people with substance use difficulties, offering a drug consumption room, field nursing, a doctor and emergency overnight accommodation. Field nursing offers free drop-in health services. An emergency bed needs a formal decision (vedtak): on weekdays 09:00–15:00 contact your district (bydel), at other times Oslo legevakt or the psychosocial emergency service. |

## Noted, not changed

- Row 17's opening hours read "Hverdager 09:00–15:00". The Housing First page gives
  "Mandag til fredag kl. 08.00-15.30." as opening hours and "Hverdager kl. 09.00-15.00" as phone
  hours. The seed matches the phone hours.
- Row 225's first sentence says "for deg med rusutfordringer". The page says "for personer over
  18 år med alvorlige og langvarige rusproblemer", so the seed leaves out the age limit.
- Row 225's Website is `https://www.oslo.kommune.no`, the front page of the kommune, not the
  Prindsen page.
