import { useId } from "react"
import { useTranslation } from "../i18n/LanguageProvider.tsx"

export function SearchBar({
	value,
	onChange,
}: {
	value: string
	onChange: (value: string) => void
}) {
	const t = useTranslation()
	const id = useId()
	return (
		<search onSubmit={(event) => event.preventDefault()}>
			<label htmlFor={id}>{t("search.label")}</label>
			<input
				id={id}
				type="search"
				value={value}
				onChange={(event) => onChange(event.target.value)}
				autoComplete="off"
			/>
		</search>
	)
}
