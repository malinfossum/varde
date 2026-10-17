import { useDismissibleTips } from "../hooks/useDismissibleTips.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { type EmergencyLine, emergencyLines, telHref } from "../services/emergency.ts"
import { AmbulanceIcon, FlameIcon, ShieldIcon, StethoscopeIcon } from "./icons.tsx"
import { Link } from "./Link.tsx"

const icons: Record<EmergencyLine["id"], typeof FlameIcon> = {
	brann: FlameIcon,
	politi: ShieldIcon,
	ambulanse: AmbulanceIcon,
	legevakt: StethoscopeIcon,
}

// Above the header on every page. Not sticky, not dismissable: the person who needs it most
// is the one least likely to find a re-open control. Numbers are constants (see emergency.ts).
export function AcuteStrip() {
	const t = useTranslation()
	// Escape closes the tooltips (WCAG 1.4.13) until the pointer enters or focus lands on a link.
	const tips = useDismissibleTips()
	return (
		<section aria-label={t("strip.label")} className="bg-akutt-soft text-akutt">
			{/* One line at every width (spec: Acute strip, one line): an icon and the number per
			    service, with the label in the link's name, so each link reads "Brann 110". At 320 px it
			    only just fits, so the items wrap instead of overflowing at a larger text size. */}
			<ul
				data-tips={tips.hidden ? "hidden" : undefined}
				className="acute-strip mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-1 text-sm md:justify-start md:gap-x-6"
			>
				{emergencyLines.map((line) => {
					const Icon = icons[line.id]
					return (
						<li key={line.id}>
							<a
								href={telHref(line.phone)}
								aria-label={`${t(`strip.short.${line.id}`)} ${line.phone}`}
								onPointerEnter={tips.show}
								onFocus={tips.show}
								className="strip-link relative inline-flex min-h-11 min-w-11 items-center justify-center gap-1 whitespace-nowrap font-semibold text-akutt"
							>
								<Icon className="size-[1.125rem] shrink-0" />
								{line.phone}
								{/* Shown on hover and keyboard focus with a mouse only (see .strip-tip). It
								    repeats the link's name, so screen readers skip it. */}
								<span className="strip-tip" aria-hidden="true">
									{t(`strip.short.${line.id}`)}
								</span>
							</a>
						</li>
					)
				})}
				<li className="md:ml-auto">
					{/* The name stays the full term; below 768 px the visible text is its first word. */}
					<Link
						to="/sok?category=nodtjenester"
						aria-label={t("strip.more")}
						className="inline-flex min-h-11 items-center whitespace-nowrap text-akutt underline"
					>
						<span className="md:hidden">{t("strip.moreShort")} →</span>
						<span className="hidden md:inline">{t("strip.more")}</span>
					</Link>
				</li>
			</ul>
		</section>
	)
}
