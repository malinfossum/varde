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
		<search>
			<form onSubmit={(event) => event.preventDefault()}>
				<label htmlFor={id} className="field-label">
					{t("search.label")}
				</label>
				<input
					id={id}
					type="search"
					value={value}
					onChange={(event) => onChange(event.target.value)}
					autoComplete="off"
					className="search-input"
				/>
			</form>
		</search>
	)
}
