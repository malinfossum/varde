import { defineConfig, devices } from "@playwright/test"

// Runs against `vite preview` of a full build (npm run build), so every check sees the real
// prerendered pages, not the dev server. Chromium only (spec: Testing and verification).
// No retries: a flaky layout check is a finding, not noise to hide.
export default defineConfig({
	testDir: "e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: 0,
	reporter: "list",
	use: {
		baseURL: "http://localhost:4173",
		trace: "retain-on-failure",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: {
		command: "npm run preview -- --port 4173 --strictPort",
		url: "http://localhost:4173",
		reuseExistingServer: !process.env.CI,
	},
})
