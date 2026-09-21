/// <reference types="vitest/config" />

/* ======================================================================
   vite.config.ts
   The react plugin is required; everything else is optional.
   ====================================================================== */

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig(({ isSsrBuild }) => ({
	plugins: [react(), tailwindcss()],
	// The server build (build:server) is a plain Node module scripts/prerender.mjs imports by
	// name — entryFileNames keeps its output at dist-server/entry-server.mjs instead of a
	// hashed name.
	// The client build writes dist/.vite/manifest.json so the prerender can add modulepreload
	// hints for each route's lazy chunk (scripts/prerender.mjs deletes the folder afterwards).
	build: isSsrBuild
		? { rollupOptions: { output: { entryFileNames: "[name].mjs" } } }
		: { manifest: true },
	test: {
		environment: "jsdom",
		setupFiles: ["./tests/setup.ts"],
	},
	// If you deploy to GitHub Pages under a repo name, set:
	// base: '/your-repo-name/',
}))
