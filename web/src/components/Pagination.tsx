import { useTranslation } from "../i18n/LanguageProvider.tsx"

export function Pagination({
	page,
	pageSize,
	totalCount,
	onPage,
}: {
	page: number
	pageSize: number
	totalCount: number
	onPage: (page: number) => void
}) {
	const t = useTranslation()
	const pages = Math.max(1, Math.ceil(totalCount / pageSize))
	if (pages === 1) return null
	const status = t("list.pagerStatus")
		.replace("{page}", String(page))
		.replace("{pages}", String(pages))
	return (
		<nav className="flex items-center justify-between gap-3">
			<button
				type="button"
				className="btn-secondary"
				disabled={page <= 1}
				onClick={() => onPage(page - 1)}
			>
				{t("list.pagerPrev")}
			</button>
			<span className="text-sm text-muted">{status}</span>
			<button
				type="button"
				className="btn-secondary"
				disabled={page >= pages}
				onClick={() => onPage(page + 1)}
			>
				{t("list.pagerNext")}
			</button>
		</nav>
	)
}
