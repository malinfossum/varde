import { render } from "@testing-library/react"
import { beforeEach, expect, test } from "vitest"
import { LanguageProvider, resolveLang, useTranslation } from "../src/i18n/LanguageProvider.tsx"

beforeEach(() => localStorage.clear())

test("resolution order is url, then localStorage, then nb", () => {
	expect(resolveLang(null)).toBe("nb")
	localStorage.setItem("varde.lang", "en")
	expect(resolveLang(null)).toBe("en")
	expect(resolveLang("nb")).toBe("nb")
	expect(resolveLang("garbage")).toBe("en") // unrecognised values are ignored, not rejected
})

test("url language never overwrites the stored preference", () => {
	localStorage.setItem("varde.lang", "en")
	function Probe() {
		const t = useTranslation()
		return <p>{t("app.title")}</p>
	}
	render(
		<LanguageProvider initialLang="nb">
			<Probe />
		</LanguageProvider>
	)
	expect(localStorage.getItem("varde.lang")).toBe("en") // visit renders nb, storage untouched
	expect(document.documentElement.lang).toBe("nb")
})

test("every nb key has an en twin and vice versa", async () => {
	const nb = (await import("../src/i18n/nb.json")).default as Record<string, string>
	const en = (await import("../src/i18n/en.json")).default as Record<string, string>
	expect(Object.keys(nb).sort()).toEqual(Object.keys(en).sort())
})
