# Data

Service data for the national pipeline (`pipeline/`). Two files per kommune, keyed by its
KLASS number.

- `curated/<number>-<slug>.json` is mine: which units are in, their categories and provider
  type, the Lavterskel decision, Varde's own descriptions, and my review answers.
- `lock/<number>.json` is the pipeline's: every value with its source URL, its evidence (a
  register record id or a verbatim quote), when it was fetched and verified, and the result
  of each gate.

A dropped value keeps only its reason and source URL. No person's name is ever stored.
Raw pages live in `.cache/`, which is never committed. The first files here are the pilot run's
baseline (PR 4, see `docs/pilot/pilot-report.md`); they are scored, not published.

Check the files: `cd pipeline && npm run data:check`.

## Sources and licences

| Source | What the locks take from it | Licence | Credit | Link |
|---|---|---|---|---|
| Brønnøysundregistrene, Enhetsregisteret | units, org numbers, the kommune's switchboard number | Norsk lisens for offentlige data (NLOD) | «Inneholder data under Norsk lisens for offentlige data (NLOD) tilgjengeliggjort av Brønnøysundregistrene» (the wording NLOD 2.0 point 5 gives when the licensor names none; Brreg's page names none) | `https://data.brreg.no/enhetsregisteret/api/docs/index.html`, `https://data.norge.no/nlod/no/2.0` |
| Kartverket, address API | address ids and street names | Creative Commons Attribution 4.0 International (CC BY 4.0) | ©Kartverket, and a link to www.kartverket.no where this is possible (the terms page's general wording; it gives none for addresses in particular) | `https://www.kartverket.no/en/api-and-data/terms-of-use` |
| Statistisk sentralbyrå, KLASS | kommune numbers and names | Creative Commons Attribution 4.0 International (CC BY 4.0) | confirm (the API guide names the licence and gives no credit wording) | `https://data.ssb.no/api/klass/v1/api-guide.html` |
| Nav, office pages on nav.no | Nav offices' contact details | Nav's own pages; permission 06.11.2026, no licence named | Nav | `docs/licence-requests/README.md` |
| NKLM (NORCE), legevakt list | legevakt phone and address, as cross-checks | permission 05.11.2026 for the file dated 01.01.2026 | Oversikt over legevakter i Norge, NKLM (NORCE), per 01.01.2026 | `docs/licence-requests/README.md` |
| The kommuner's and providers' own pages | contact details, hours, costs, with a verbatim quote | none named: facts carry no copyright, and the short quotes are kept as evidence with the source named (quotation right, åndsverkloven § 29; confirm) | the source URL beside each value | the source URL beside each value |

Permissions and requests: `docs/licence-requests/README.md`.

## Personal data (Art. 14 notice)

The lock files, and the pilot report that quotes them, hold one kind of personal data: a phone
number that a kommune publishes as a unit's contact, when it belongs to a manager. It is
stored with the person's role ("avdelingsleder"), never with their name. Names on the source pages are redacted from every
stored quote before a file is written, and I read a list of the capitalised words left before
each commit. A rule can still miss a name; if you find one, write to me and I remove it.

- **Who is responsible:** Malin Fossum, a private person who runs Varde as a free,
  non-commercial directory. Contact: malinfossum.dev@proton.me.
- **Why:** so people can reach a service that helps them. The number is the one the kommune
  itself gives for that purpose.
- **Legal basis:** legitimate interest (GDPR Art. 6(1)(f)). People need to reach the service,
  and the number is one the kommune already publishes for that purpose.
- **Where it comes from:** the kommune's own public page, named by the source URL beside the
  value.
- **How long:** as long as the kommune publishes it. Each run replaces the files, so a number
  the kommune takes down leaves the current files at the next run.
- **Who can see it:** anyone. The repository is public on GitHub.
- **Your rights:** you can ask to see, correct or erase the data, and you can object to it
  (GDPR Art. 21). You can also complain to Datatilsynet.
- **Removal:** write to malinfossum.dev@proton.me. I take the value out of the current files and
  out of every later run. Older commits keep it unless the repository's history is
  rewritten, which I do on request.
