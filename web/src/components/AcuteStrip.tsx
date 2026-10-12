import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { emergencyLines, telHref } from "../services/emergency.ts"
import { Link } from "./Link.tsx"

// Above the header on every page. Not sticky, not dismissable: the person who needs it most
// is the one least likely to find a re-open control. Numbers are constants (see emergency.ts).
export function AcuteStrip() {
	const t = useTranslation()
	return (
		<section aria-label={t("strip.label")} className="bg-akutt-soft text-akutt">
			{/* Below 768 px a 2 x 2 grid: 110 and 112, then 113 and 116 117 (the order
			    emergencyLines has), with "Alle nødtjenester" on a row of its own. From 768 px one
			    row (spec: Acute strip on phones). */}
			<ul className="acute-strip mx-auto grid max-w-6xl grid-cols-2 items-center gap-x-4 gap-y-1 py-2 text-sm md:flex md:flex-wrap">
				{emergencyLines.map((line) => (
					<li key={line.id} className="flex items-center gap-1">
						<a
							href={telHref(line.phone)}
							className="inline-flex min-h-11 min-w-11 items-center justify-center whitespace-nowrap font-semibold text-akutt"
						>
							{line.phone}
						</a>
						{/* Labels, not running text, so each starts with a capital. The strip has its
						    own short keys; the landing page's grid keeps the full terms. */}
						<span>{t(`strip.short.${line.id}`)}</span>
					</li>
				))}
				<li className="col-span-2 md:ml-auto">
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
