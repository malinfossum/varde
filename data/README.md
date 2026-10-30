# Data

Service data for the national pipeline (`pipeline/`). Two files per kommune, keyed by its
KLASS number.

- `curated/<number>-<slug>.json` is mine: which units are in, their categories and provider
  type, the Lavterskel decision, Varde's own descriptions, and my review answers.
- `lock/<number>.json` is the pipeline's: every value with its source URL, its evidence (a
  register record id or a verbatim quote), when it was fetched and verified, and the result
  of each gate.

A dropped value keeps only its reason and source URL. No person's name is ever stored.
Raw pages live in `.cache/`, which is never committed.

Check the files: `cd pipeline && npm run data:check`.
