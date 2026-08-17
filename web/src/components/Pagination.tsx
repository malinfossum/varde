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
		<nav className="pager">
			<button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>
				{t("list.pagerPrev")}
			</button>
			<span>{status}</span>
			<button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)}>
				{t("list.pagerNext")}
			</button>
		</nav>
	)
}
