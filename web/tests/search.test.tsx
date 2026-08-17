import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, test, vi } from "vitest"
import { Suggestions } from "../src/components/Suggestions.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"

test("suggestions render as buttons and report picks", async () => {
	const onPick = vi.fn()
	const user = userEvent.setup()
	render(
		<LanguageProvider initialLang="nb">
			<Suggestions
				suggestions={[
					{ kind: "municipality", id: 1, name: "Hamar" },
					{ kind: "category", slug: "rus", name: "Rus" },
				]}
				onPick={onPick}
			/>
		</LanguageProvider>
	)
	await user.click(screen.getByRole("button", { name: "Hamar (kommune)" }))
	expect(onPick).toHaveBeenCalledWith({ kind: "municipality", id: 1, name: "Hamar" })
	expect(screen.getByRole("button", { name: "Rus (kategori)" })).toBeInTheDocument()
})
