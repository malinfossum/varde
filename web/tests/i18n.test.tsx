import { render, screen } from "@testing-library/react"
import { beforeEach, expect, test } from "vitest"
import { LanguageProvider, useTranslation } from "../src/i18n/LanguageProvider.tsx"

beforeEach(() => localStorage.clear())

test("a stored preference never overrides the language the provider is given", () => {
	// Redirecting a stored "en" preference away from a bare "/" load is public/theme-init.js's
	// job, which runs before React even mounts — the provider itself only ever renders the
	// language it's handed as a prop, regardless of what's in storage.
	localStorage.setItem("varde.lang", "en")
	function Probe() {
		const t = useTranslation()
		return <p>{t("app.skipToContent")}</p>
	}
	render(
		<LanguageProvider lang="nb">
			<Probe />
		</LanguageProvider>
	)
	expect(screen.getByText("Hopp til innhold")).toBeInTheDocument()
	expect(document.documentElement.lang).toBe("nb")
	expect(localStorage.getItem("varde.lang")).toBe("en")
})

test("every nb key has an en twin and vice versa", async () => {
	const nb = (await import("../src/i18n/nb.json")).default as Record<string, string>
	const en = (await import("../src/i18n/en.json")).default as Record<string, string>
	expect(Object.keys(nb).sort()).toEqual(Object.keys(en).sort())
})
