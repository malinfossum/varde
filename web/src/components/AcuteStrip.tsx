import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { emergencyLines, telHref } from "../services/emergency.ts"
import { Link } from "./Link.tsx"

// Above the header on every page. Not sticky, not dismissable: the person who needs it most
// is the one least likely to find a re-open control. Numbers are constants (see emergency.ts).
export function AcuteStrip() {
	const t = useTranslation()
	return (
		<section aria-label={t("strip.label")} className="bg-akutt-soft text-akutt">
			<ul className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm">
				{emergencyLines.map((line) => (
					<li key={line.id} className="flex items-center gap-1">
						<a
							href={telHref(line.phone)}
							className="inline-flex min-h-11 items-center font-semibold text-akutt"
						>
							{line.phone}
						</a>
						<span>{t(`strip.${line.id}`)}</span>
					</li>
				))}
				<li className="ml-auto">
					<Link
						to="/sok?category=nodtjenester"
						className="inline-flex min-h-11 items-center text-akutt underline"
					>
						{t("strip.more")}
					</Link>
				</li>
			</ul>
		</section>
	)
}
