# Varde web

The Varde web frontend: a bilingual (Norwegian/English) static site built with Vite, React and
TypeScript. The browser never calls the API. At build time `npm run data` exports the API's
data to `public/data/*.json`, the pages are prerendered to HTML, and the browser filters that
JSON locally.

## Run locally

```bash
npm install
npm run data   # export JSON from a running API (default http://localhost:5005)
npm run dev
npm test
```

`npm run data -- <url>` exports from a different API instance. `npm run build:site` builds and
prerenders the full static site, the same step the deploy workflow runs.

## Specs

- [Design](../docs/superpowers/specs/2026-08-17-varde-web-design.md)
- [Plan](../docs/superpowers/plans/2026-08-17-varde-web.md)
