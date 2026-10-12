import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { LANGUAGES } from "../i18n/languages.ts"
import { GlobeIcon } from "./icons.tsx"
import { LanguageRows } from "./LanguageRows.tsx"
import { Picker } from "./Picker.tsx"

export function LanguagePicker() {
	const { lang } = useLanguage()
	const t = useTranslation()
	const current = LANGUAGES.find((language) => language.code === lang) ?? LANGUAGES[0]
	return (
		<Picker name={t("header.language")} value={current.name} icon={<GlobeIcon />}>
			{(closeAndFocus) => <LanguageRows onDone={closeAndFocus} />}
		</Picker>
	)
}
