# Domain stories

Varde as five short domain stories: who does what, with what, in what order. Each `.story` is
the source and each `.egn` is generated from it for [Egon.io](https://egon.io/app) (Import).
Regenerate after an edit with the `domain-story` generator:
`node ~/.claude/loadout/skills/domain-story/scripts/story-to-egn.mjs <name>.story`.

## How they fit together

```text
2 a row is curated by hand ──┐
                             ├─> 3 the change passes the gates ─> 4 the site is rebuilt ─> 1 a visitor finds help
5 the national pipeline ─────┘   (to-be; publishing waits for spec B)
```

Stories 1 to 4 are as-is. Story 5 is to-be: the design in
`docs/superpowers/specs/2026-10-28-varde-national-data-design.md`, partly built.

| Story | Scope | Replay |
|---|---|---|
| [1 A visitor finds help](01-visitor-finds-help.story) | coarse, as-is | [Egon.io](https://egon.io/app?storyUrl=https://raw.githubusercontent.com/malinfossum/varde/main/docs/domain-stories/01-visitor-finds-help.egn&startReplay=true) |
| [2 A service row is curated by hand](02-hand-curated-row.story) | medium, as-is | [Egon.io](https://egon.io/app?storyUrl=https://raw.githubusercontent.com/malinfossum/varde/main/docs/domain-stories/02-hand-curated-row.egn&startReplay=true) |
| [3 A change passes the gates](03-pr-gates.story) | medium, as-is | [Egon.io](https://egon.io/app?storyUrl=https://raw.githubusercontent.com/malinfossum/varde/main/docs/domain-stories/03-pr-gates.egn&startReplay=true) |
| [4 The site is rebuilt and deployed](04-daily-deploy.story) | medium, as-is | [Egon.io](https://egon.io/app?storyUrl=https://raw.githubusercontent.com/malinfossum/varde/main/docs/domain-stories/04-daily-deploy.egn&startReplay=true) |
| [5 The national pipeline refreshes a kommune](05-national-pipeline.story) | medium, to-be | [Egon.io](https://egon.io/app?storyUrl=https://raw.githubusercontent.com/malinfossum/varde/main/docs/domain-stories/05-national-pipeline.egn&startReplay=true) |

## Where each sentence lives

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
| 7, 11 | No artifact: the ruling and the six-month re-check live in the docs above and in "Sist bekreftet" |

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

**5 The national pipeline refreshes a kommune**

| # | Code | Built |
|---|---|---|
| 1 | `pipeline/src/registers/` (Brreg, Nav, KLASS, Kartverket), `pipeline/src/discover/` | PR 2 |
| 2 | `pipeline/src/discover/sitemap.ts`, `pipeline/src/net/` (robots, allow-list) | PR 2 |
| 3 | `pipeline/src/fetch/fetchPages.ts`, `pipeline/src/io/pageCache.ts` | PR 2 |
| 4-5 | Extract stage | PR 3 |
| 6 | `pipeline/src/gates/` (source, grounding, validity, agreement, safety) | gates PR 1, the verify stage PR 3 |
| 7 | `pipeline/src/schema/lock.ts`; writing `data/lock/` | schema PR 1, writing PR 3 |
| 8 | `pipeline/src/recall/`, `pipeline/src/answerKey/` | PR 1-2 |
| 9-10 | Review command; `pipeline/src/schema/curated.ts` | schema PR 1, command PR 3 |
| 11-13 | Scheduled workflows, `check-refresh-only`, bot token | PR 5 |

## Gaps

- The two stories that feed the site do not meet yet. Story 4 reads rows from Neon, which the
  C# seed fills; story 5 writes `data/` files the site never reads. Spec B decides the join
  (storage decided 2026-10-30: JSON in git).
- No workflow runs the pipeline yet. Discover and fetch run by hand from `pipeline/`.
- Story 2 has no trace of sentence 7 (settling the final values) beyond the check reports.
