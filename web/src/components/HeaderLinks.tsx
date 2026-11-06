import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { useCurrentUrl } from "../navigation.ts"
import { HELSENORGE_URL, NAV_URL } from "../services/externalLinks.ts"
import { parseUrl } from "../services/urlState.ts"
import { Link } from "./Link.tsx"

// One source for the header's four links, rendered by the desktop nav and by the Meny (spec:
// One source, two layouts). Helsenorge and NAV open in a new tab so Varde stays open behind
// them. The arrow is decoration; the hidden text says it. The space after the name is what
// separates it from the hidden text in the accessible name.
const EXTERNAL = [
	{ name: "Helsenorge", href: HELSENORGE_URL },
	{ name: "NAV", href: NAV_URL },
] as const

export function HeaderLinks({
	className,
	onFollow,
}: {
	className: string
	// Runs when a link is followed. The Meny uses it to close and refocus its trigger; the
	// desktop nav passes nothing.
	onFollow?: () => void
}) {
	const t = useTranslation()
	// The current page's link says so (aria-current); a click on it still works.
	const current = parseUrl(useCurrentUrl().pathname).route.kind
	return (
		<>
			<Link
				to="/sok"
				className={className}
				aria-current={current === "list" ? "page" : undefined}
				onNavigate={() => {
					onFollow?.()
				}}
			>
				<span>{t("header.allServices")}</span>
			</Link>
			<Link
				to="/kommune"
				className={className}
				aria-current={current === "kommuneIndex" ? "page" : undefined}
				onNavigate={() => {
					onFollow?.()
				}}
			>
				<span>{t("header.kommuner")}</span>
			</Link>
			{EXTERNAL.map(({ name, href }) => (
				<a
					key={name}
					href={href}
					target="_blank"
					rel="noopener noreferrer"
					className={className}
					onClick={() => onFollow?.()}
				>
					{name} <span aria-hidden="true">↗</span>
					<span className="visually-hidden">{t("header.external")}</span>
				</a>
			))}
		</>
	)
}
