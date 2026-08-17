import { useTranslation } from "../i18n/LanguageProvider.tsx"

export function LoadingState() {
	const t = useTranslation()
	return <p className="loading-state">{t("status.loading")}</p>
}
