# Licence requests

Six requests from the national data design (`docs/superpowers/specs/2026-10-28-varde-national-data-design.md`,
"Licence requests"). Until a body says yes, the pipeline uses its catalogue only to find a
provider's own page and to cross-check, and takes the facts from that page or a register.

| Body | What I ask for | Draft | Sent | Answer |
|---|---|---|---|---|
| Prokom | The Aim API for 29 kommuner | [prokom-aim.md](prokom-aim.md) | 03.11.2026 | |
| Nav | Office pages on nav.no/kontor | [nav.md](nav.md) | 03.11.2026 | 06.11.2026: yes, from Nav's technology department: office information is open public data and fine to use, no licence named (stays ownPage) |
| NKLM | The legevakt list | [nklm.md](nklm.md) | 03.11.2026 | 05.11.2026: yes, from an NKLM adviser, for the file dated 01.01.2026 (granted) |
| NKVTS | dinutvei.no's help services | [nkvts-dinutvei.md](nkvts-dinutvei.md) | 03.11.2026 | |
| Norges Frivilligsentraler | The frivilligsentral register | [norges-frivilligsentraler.md](norges-frivilligsentraler.md) | 03.11.2026 | |
| Kirkens Bymisjon | The tilbud list | [kirkens-bymisjon.md](kirkens-bymisjon.md) | 03.11.2026 | |

When an answer comes, I record it here and set the host's licence status in the pipeline:
`pipeline/src/sources/hosts.ts` for catalogues, `pipeline/src/sources/registers.ts` for
registers (`granted`, or leave it `pending`).

Nav's answer names no licence, so `nav` stays `ownPage` in `registers.ts`: the office pages
are Nav describing its own offices, and `granted` is for a catalogue owner saying yes about
other providers. I still credit Nav under "Kilder og lisenser", as the request promised.

NKLM's permission covers the file dated 01.01.2026. The pipeline knows that file by its hash
(`pipeline/src/registers/nklm.ts`, `NKLM_EDITIONS`), so a new edition stops the NKLM step until
I record here that the permission covers it too. Credit line for "Kilder og lisenser":
«Oversikt over legevakter i Norge, NKLM (NORCE), per 01.01.2026».
