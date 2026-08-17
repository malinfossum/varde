# Verification — seed-data-oslo.md

Independent adversarial check of all 47 rows (201–247) against their live `Source URL`, performed
2026-08-13. Method: fetch each source page, compare phone (digit-for-digit), address, website
resolution, opening hours and chat URL against the row's claims. No replacement research was done —
this is a checker's report, not a second research pass.

All 47 rows were reachable and checked. No fabricated/invented values were found: every non-empty
claim traced to text actually present on the cited page, and every `NOT FOUND` cell was verified as
a genuine absence rather than a shortcut.

## Verdict table

| # | Name | Verdict | Detail |
|---|------|---------|--------|
| 201 | Nav Alna | CONFIRMED | |
| 202 | Nav Bjerke | CONFIRMED | |
| 203 | Nav Frogner | CONFIRMED | |
| 204 | Nav Gamle Oslo | CONFIRMED | |
| 205 | Nav Grorud | CONFIRMED | |
| 206 | Nav Grünerløkka | CONFIRMED | |
| 207 | Nav Nordre Aker | CONFIRMED | |
| 208 | Nav Nordstrand | CONFIRMED | |
| 209 | Nav Sagene | CONFIRMED | verbatim quote on econ.-advice drop-in matched exactly |
| 210 | Nav St. Hanshaugen | CONFIRMED | dotted URL slug (`nav-st.hanshaugen`) verified to load correctly |
| 211 | Nav Stovner | CONFIRMED | |
| 212 | Nav Søndre Nordstrand | CONFIRMED | |
| 213 | Nav Ullern | CONFIRMED | address match with row 230 confirmed on both pages independently |
| 214 | Nav Vestre Aker | CONFIRMED | address match with row 231 confirmed on both pages independently |
| 215 | Nav Østensjø | CONFIRMED | |
| 216 | Oslo Krisesenter | CONFIRMED | secret-address claim, postal address, dögnåpent, 1–2 day email response all verified |
| 217 | Unge Relasjoner | CONFIRMED | chat hours quote matched verbatim |
| 218 | Overgrepsmottaket, Legevakten i Oslo | CONFIRMED — CONFLICT-FLAGGED | see below |
| 219 | Alternativ til Vold (ATV) Oslo | CONFIRMED | |
| 220 | Vake kirkelig ressurssenter | CONFIRMED | dinutvei.no third-party source correctly disclosed |
| 221 | Psykososial akuttjeneste, Legevakten i Oslo | CONFIRMED — CONFLICT-FLAGGED | see below |
| 222 | Legevakten i Oslo | CONFIRMED | second-number claim (23 48 72 00 absent from own page, present on kommune overview) verified precisely |
| 223 | Uteseksjonen, Oslo kommune | PARTIAL | see below |
| 224 | Uteseksjonens psykologtjeneste | CONFIRMED | |
| 225 | Prindsen mottakssenter | CONFIRMED | |
| 226 | Feltpleien i Oslo (Frelsesarmeen) | CONFIRMED | |
| 227 | Fyrlyset, Oslo (Frelsesarmeen) | CONFIRMED | |
| 228 | LINK Oslo | CONFIRMED | floor-move claim (2nd→5th, 1 apr 2025) verified consistent with today's date |
| 229 | Rask psykisk helsehjelp – Bydel Alna | CONFIRMED | live-calendar-not-text-hours claim verified |
| 230 | Rask psykisk helsehjelp – Bydel Ullern | CONFIRMED | |
| 231 | Rask psykisk helsehjelp – Bydel Vestre Aker | CONFIRMED | live-calendar-not-text-hours claim verified |
| 232 | Ung Arena Oslo sentrum | CONFIRMED | |
| 233 | Kontoret for fri rettshjelp, Oslo kommune | CONFIRMED | |
| 234 | JURK – Juridisk rådgivning for kvinner | CONFIRMED | new-case vs existing-case hours both verified as distinct |
| 235 | Gatejuristen | CONFIRMED | see note below (gatejuristen.no reachability) |
| 236 | Barnevernvakten i Oslo | CONFIRMED | |
| 237 | Familievernkontoret Christiania | CONFIRMED | |
| 238 | Familievernkontoret Enerhaugen | CONFIRMED | |
| 239 | Familievernkontoret Homansbyen | CONFIRMED | |
| 240 | Familievernkontoret Oslo Nord | CONFIRMED | summer-hours sub-claim also verified verbatim |
| 241 | Gamle Oslo helsestasjon for ungdom (HFU) | CONFIRMED — CONFLICT-FLAGGED | see below |
| 242 | Helsestasjon for ungdom (HFU) i Oslo | CONFIRMED | |
| 243 | Oslohjelpa | CONFIRMED | |
| 244 | Boligkontorene i Oslo | CONFIRMED | |
| 245 | Stovner boligkontor | CONFIRMED — CONFLICT-FLAGGED | see below |
| 246 | Økonomisk rådgivning og gjeldsrådgivning | CONFIRMED | |
| 247 | Bymisjonssenteret, Oslo (Kirkens Bymisjon) | CONFIRMED | named-employee-email exclusion verified correct |

## Non-CONFIRMED / flagged rows in detail

### 223 — Uteseksjonen, Oslo kommune (PARTIAL)

Phone, address, website and hours all verified. The row's Notes say "SMS is also accepted on the
same number" — this is **not supported by row 223's own cited source page**
(`/rustjenester/sentrumsarbeid/uteseksjonen/`), which does not mention SMS at all. The SMS claim
*is* explicitly stated on row 224's page ("du kan også sende sms"), for the same shared number. So
the underlying fact is probably true, but as written the claim is attached to the wrong page's
citation — a sourcing slip, not an invented number.

### 218 — Overgrepsmottaket, Legevakten i Oslo (CONFIRMED — CONFLICT-FLAGGED)

Phone (23 04 05 00, unspaced "23040500" on page), address, hours, barnemottaket number
(22 98 91 40) and staff-only line (23 04 04 90) all verified present on the cited page. One
sub-claim — that a separate "kriser-og-vold" page also prints "Ring 23 04 05 00" — could not be
checked; no URL for that page was given anywhere in the row. Not a mismatch, just unverified.
Conflict with row 221 (same number, different service) reconfirmed as genuinely true on both live
pages, per the draft's own flag.

### 221 — Psykososial akuttjeneste, Legevakten i Oslo (CONFIRMED — CONFLICT-FLAGGED)

Phone, address, hours, and the "kun kveld, natt og helg" nuance all verified present and accurate.
Shares 23 04 05 00 with row 218, confirmed genuine on both official pages — not resolved, as
instructed.

### 241 — Gamle Oslo helsestasjon for ungdom (HFU) (CONFIRMED — CONFLICT-FLAGGED)

At the URL ending `/grunerlokka-helsestasjon-for-ungdom-hfu/`, the page's title, address (Hagegata
32, 0653 Oslo) and phone (41565535) all read "Gamle Oslo" content, exactly as the draft describes.
The URL slug says "grunerlokka" but the content says "Gamle Oslo" — draft's characterization is
accurate; the underlying URL/title conflict is real and still needs a human to open both HFU pages
and confirm, as item 1 in "Verify these first" requests.

### 245 — Stovner boligkontor (CONFIRMED — CONFLICT-FLAGGED)

Address, phone (55553333 = 55 55 33 33 national line, unspaced) confirmed present. The "Confirm
this is really how you reach the boligkontor" question from the draft remains open — checkable
only by phoning, not by re-reading the page.

**Numbering inconsistency spotted, not in the seed data itself but in the draft's own cross-reference
notes:** "Verify these first" item 3 says "Row 244 (Stovner boligkontor)" — but in the table, row
244 is the separate city-wide overview row ("Boligkontorene i Oslo"), and row 245 is Stovner
boligkontor. The note's row number is off by one. Worth a quick fix in the draft; it did not cause
any data error, only a misleading cross-reference.

## Other things noticed, not row failures

- **Row 235 (Gatejuristen):** the draft says `gatejuristen.no` was blocked during the researcher's
  session. In this check, `gatejuristen.no` was reachable and 301-redirects to
  `kirkensbymisjon.no/gatejuristen` — the same page already cited, with the same absence of phone/
  address/hours. So the row's claims stand, but the domain is not actually unreachable in general;
  it may be worth someone retrying it now that access has changed.
- No invented digits, addresses, or hours were found anywhere. Every unspaced-number claim (the
  eight the draft flagged) matched the live page's unspaced digits exactly.

## Summary

- **CONFIRMED:** 42
- **CONFIRMED — CONFLICT-FLAGGED:** 4 (rows 218, 221, 241, 245 — pre-existing conflicts the draft
  already surfaced; content itself checks out, the underlying conflict is unresolved by design)
- **PARTIAL:** 1 (row 223 — SMS claim sourced to the wrong page)
- **MISMATCH:** 0
- **UNREACHABLE:** 0

**Rows needing human attention:** 218, 221 (shared number — ring and confirm menu), 223 (fix SMS
citation to point at row 224's page or re-verify on 223's own page), 241 (URL/title conflict, per
item 1), 245 (confirm boligkontor really uses the national line).
