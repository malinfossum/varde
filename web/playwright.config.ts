import { defineConfig, devices } from "@playwright/test"

// Runs against `vite preview` of a full build (npm run build:site: build plus prerender), so
// every check sees the real prerendered pages, not the dev server. Chromium only (spec: Testing
// and verification). No retries: a flaky layout check is a finding, not noise to hide.
// reuseExistingServer is off on purpose: a preview already on the port, perhaps from another
// checkout, must fail the run loudly instead of being measured.
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
		reuseExistingServer: false,
	},
})
