/// <reference types="vitest/config" />

/* ======================================================================
   vite.config.ts
   The react plugin is required; everything else is optional.
   ====================================================================== */

import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
	plugins: [react()],
	test: {
		environment: "jsdom",
		setupFiles: ["./tests/setup.ts"],
	},
	// If you deploy to GitHub Pages under a repo name, set:
	// base: '/your-repo-name/',
})
