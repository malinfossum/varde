# Varde pipeline

Finds, checks and refreshes Varde's service data. Design:
`docs/superpowers/specs/2026-10-28-varde-national-data-design.md`.

This first part is offline: the schema for `data/curated/` and `data/lock/`, the five
verification gates, the answer key and the golden test. Nothing here fetches a page yet.

## Commands

Run from `pipeline/` (Node 24 or newer).

```bash
npm ci
npm test              # unit, gate and golden tests
npm run typecheck
npm run data:check    # validates every file in data/
npm run schema        # rewrites schema/*.schema.json after a schema change
```

A Dependabot bump of `zod` can change the exported schemas. The snapshot test then fails on
purpose: run `npm run schema` in that PR and commit the result.
