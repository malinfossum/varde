# Domain stories

Varde as one overview and six short domain stories: who does what, with what, in what order.
Story 0 puts every part on one board, one sentence each; stories 1 to 6 zoom in. Each `.story` is
the source and each `.egn` is generated from it for [Egon.io](https://egon.io/app) (Import).
Regenerate after an edit with the `domain-story` generator:
`node ~/.claude/loadout/skills/domain-story/scripts/story-to-egn.mjs <name>.story`.

## How they fit together

```text
2 curated by hand ───────────────────────────────────┐
5 discover and fetch ─> 6 extract and review (to-be) ┴─> 3 the gates ─> 4 rebuild and deploy ─> 1 a visitor finds help
```

Stories 1 to 5 are as-is. Story 6 is to-be: the rest of the design in
`docs/superpowers/specs/2026-10-28-varde-national-data-design.md`. Story 0 is as-is with the
planned pipeline steps marked "(planned)".

**Keep them current.** A PR that changes the structure (a workflow, a pipeline stage, a data
store, who runs what) updates the story that tells it, regenerates the `.egn`, and fixes this
README in the same PR.

| Story | Scope | Replay |
|---|---|---|
| [0 The whole project at a glance](00-varde-overview.story) | coarse, as-is + planned | [Egon.io](https://egon.io/app?storyUrl=https://raw.githubusercontent.com/malinfossum/varde/main/docs/domain-stories/00-varde-overview.egn&startReplay=true) |
| [1 A visitor finds help](01-visitor-finds-help.story) | coarse, as-is | [Egon.io](https://egon.io/app?storyUrl=https://raw.githubusercontent.com/malinfossum/varde/main/docs/domain-stories/01-visitor-finds-help.egn&startReplay=true) |
| [2 A service row is curated by hand](02-hand-curated-row.story) | medium, as-is | [Egon.io](https://egon.io/app?storyUrl=https://raw.githubusercontent.com/malinfossum/varde/main/docs/domain-stories/02-hand-curated-row.egn&startReplay=true) |
| [3 A change passes the gates](03-pr-gates.story) | medium, as-is | [Egon.io](https://egon.io/app?storyUrl=https://raw.githubusercontent.com/malinfossum/varde/main/docs/domain-stories/03-pr-gates.egn&startReplay=true) |
| [4 The site is rebuilt and deployed](04-daily-deploy.story) | medium, as-is | [Egon.io](https://egon.io/app?storyUrl=https://raw.githubusercontent.com/malinfossum/varde/main/docs/domain-stories/04-daily-deploy.egn&startReplay=true) |
| [5 The pipeline discovers and fetches a kommune](05-pipeline-discover-fetch.story) | medium, as-is | [Egon.io](https://egon.io/app?storyUrl=https://raw.githubusercontent.com/malinfossum/varde/main/docs/domain-stories/05-pipeline-discover-fetch.egn&startReplay=true) |
| [6 The pipeline extracts, checks and publishes a kommune](06-pipeline-extract-review.story) | medium, to-be | [Egon.io](https://egon.io/app?storyUrl=https://raw.githubusercontent.com/malinfossum/varde/main/docs/domain-stories/06-pipeline-extract-review.egn&startReplay=true) |

## Where each sentence lives

**0 The whole project at a glance**

| # | Told in full by |
|---|---|
| 1-3 | Story 2, curated by hand |
| 4-7 | Story 3, the gates |
| 8-11 | Story 4, rebuild and deploy |
| 12-14 | Story 1, a visitor finds help |
| 15-18 | Story 5, discover and fetch |
| 19-22 | Story 6, extract and review (planned) |

**1 A visitor finds help**

| # | Code |
|---|---|
| 1-2 | `web/dist/`, written by `web/scripts/prerender.mjs`, served by Cloudflare Pages |
| 3 | `web/src/components/AcuteStrip.tsx`, constants in `web/src/services/emergency.ts` |
| 4-6 | `web/src/components/SearchBar.tsx`, `web/src/services/data.ts` (loads `/data/*.json`), `match.ts` |
| 7 | `web/src/components/ResourceDetail.tsx` |
| 8 | `web/src/services/contactTiles.ts` (`tel:` tiles) |
| 9 | `web/src/services/contactActions.ts` (`mailto:` to the forwarding alias) |
| 10 | `web/src/components/QuickExit.tsx`, `web/src/services/quickExit.ts` (`location.replace`) |

**2 A service row is curated by hand**

| # | Code |
|---|---|
| 1-3 | `docs/seed-data*.md` |
| 4-5 | `docs/verification/*-check.md` |
| 6 | `docs/verification/call-list.md` |
| 8 | `api/Varde.Data/Seed/SeedData.cs`, a migration in `api/Varde.Data/Migrations/`, and a row in `web/data/places.json` for a new kommune |
| 7, 11 | No artifact: the ruling and the re-check (three months for acute lines, six for the rest) live in the docs above and in "Sist bekreftet" |

**3 A change passes the gates**

| # | Code |
|---|---|
| 3, 6 | `.github/workflows/ci.yml`: `api-tests` (required), `web-e2e`, `pipeline` |
| 4, 7, 8 | `.github/workflows/ward.yml`: Ward CI, CodeQL, Dependabot auto-merge |
| 5, 10 | `.github/workflows/build-test.yml`: format, unit tests, vulnerable packages; on `main` the `sha-` image to GHCR |
| 2 | `.github/dependabot.yml` |

**4 The site is rebuilt and deployed**

| # | Code |
|---|---|
| 1-8 | `.github/workflows/deploy-web.yml` (`test`, then `build-and-deploy`) |
| 4-5 | `api/Varde.Api` startup migrates and seeds; `api/Varde.Data/Repositories` reads |
| 6 | `web/scripts/export-data.mjs` (`npm run data`) |
| 7 | `npm run build:site`, `web/scripts/prerender.mjs` |

**5 The pipeline discovers and fetches a kommune**

| # | Code |
|---|---|
| 1, 8, 11 | `pipeline/src/cli/discover.ts`, `fetch.ts`, `recall-report.ts` (`npm run discover`, `fetch`, `recall-report`) |
| 2 | `pipeline/src/registers/klass.ts` |
| 3 | `pipeline/src/registers/brreg.ts`, unit codes in `sn2025.ts` |
| 4 | `pipeline/src/net/robots.ts`, `pipeline/src/discover/sitemap.ts` |
| 5 | `pipeline/src/discover/catalogues.ts` |
| 6 | `pipeline/src/registers/nav.ts` |
| 7 | `pipeline/src/discover/files.ts` (`kommuner/<number>.json`, `national.json`, `hosts.json`, `report.json` in the cache) |
| 9 | `pipeline/src/fetch/fetchPages.ts`, `pipeline/src/net/crawler.ts` (allow-list, crawl delay) |
| 10 | `pipeline/src/io/pageCache.ts` (`pages/manifest.json`, `pages/report.json`) |
| 12 | `pipeline/src/recall/`, scored against `pipeline/src/answerKey/` |

**6 The pipeline extracts, checks and publishes a kommune**

| # | Code | Built |
|---|---|---|
| 1-2 | Extract stage (Haiku batch; a local model for kommuner that block ClaudeBot) | PR 3 |
| 3 | `pipeline/src/gates/` (source, grounding, validity, agreement, safety) | gates PR 1, the verify stage PR 3 |
| 4 | `pipeline/src/schema/lock.ts`; writing `data/lock/` | schema PR 1, writing PR 3 |
| 5-7 | Review command; `pipeline/src/schema/curated.ts` | schema PR 1, command PR 3 |
| 8-10 | Scheduled workflows, `check-refresh-only`, bot token | PR 5 |

## Gaps

- The stories that feed the site do not meet yet. Story 4 reads rows from Neon, which the
  C# seed fills; story 6 will write `data/` files the site never reads. Spec B decides the join
  (storage decided 2026-10-30: JSON in git).
- No workflow runs the pipeline yet. Discover and fetch run by hand from `pipeline/`.
- Story 2 has no trace of sentence 7 (settling the final values) beyond the check reports.
