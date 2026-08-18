import { useEffect, useId, useState } from "react"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { matchesEitherWay } from "../services/match.ts"
import type { MunicipalityDto } from "../types/api.ts"
import { useAnnounce } from "./StatusRegion.tsx"

type Selection = { municipality: number } | { national: true } | { all: true }

// Norwegian names only sort å/ø/æ correctly under nb collation (plain string/localeCompare
// comparison would sort them as if they came right after a-z's "z"-adjacent range, ahead of
// where Norwegian readers expect them).
const nbCollator = new Intl.Collator("nb")

export function KommunePicker({
	municipalities,
	selectedId,
	nationalSelected,
	onSelect,
}: {
	municipalities: MunicipalityDto[]
	selectedId: number | null
	nationalSelected: boolean
	onSelect: (selection: Selection) => void
}) {
	const t = useTranslation()
	const announce = useAnnounce()
	const id = useId()
	const [filter, setFilter] = useState("")

	const visible = filter.trim()
		? municipalities.filter((m) => matchesEitherWay(filter, m.name))
		: municipalities

	// Announce the filtered count once it settles — through the app's single region.
	useEffect(() => {
		if (!filter.trim()) return
		const timer = window.setTimeout(() => announce(`${visible.length} ${t("picker.shown")}`), 300)
		return () => window.clearTimeout(timer)
	}, [filter, visible.length, announce, t])

	const counties = [...new Set(visible.map((m) => m.county))].sort((a, b) =>
		nbCollator.compare(a, b)
	)
	const nationalMatches = !filter.trim() || matchesEitherWay(filter, t("picker.national"))

	return (
		<section className="kommune-picker">
			<label htmlFor={id}>{t("picker.label")}</label>
			<input
				id={id}
				type="search"
				value={filter}
				onChange={(event) => setFilter(event.target.value)}
				autoComplete="off"
			/>
			<button
				type="button"
				aria-pressed={selectedId === null && !nationalSelected}
				onClick={() => onSelect({ all: true })}
			>
				{t("picker.all")}
			</button>
			{nationalMatches && (
				<button
					type="button"
					aria-pressed={nationalSelected}
					onClick={() => onSelect({ national: true })}
				>
					{t("picker.national")}
				</button>
			)}
			{counties.map((county) => (
				<section key={county}>
					<h3>{county}</h3>
					<ul>
						{visible
							.filter((m) => m.county === county)
							.sort((a, b) => nbCollator.compare(a.name, b.name))
							.map((m) => (
								<li key={m.id}>
									<button
										type="button"
										aria-pressed={m.id === selectedId}
										onClick={() => onSelect({ municipality: m.id })}
									>
										{m.name}
									</button>
								</li>
							))}
					</ul>
				</section>
			))}
			{visible.length === 0 && (
				<p>
					{t("picker.noMatch")}{" "}
					<button type="button" onClick={() => onSelect({ national: true })}>
						{t("picker.noMatchLink")}
					</button>
				</p>
			)}
		</section>
	)
}
