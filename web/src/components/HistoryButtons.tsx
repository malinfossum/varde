import { type MouseEvent, useEffect, useRef } from "react"
import { useDismissibleTips } from "../hooks/useDismissibleTips.ts"
import { useHistoryButtons } from "../hooks/useHistoryButtons.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { notePress } from "../services/returnFocus.ts"
import { BackIcon, ForwardIcon } from "./icons.tsx"

type Layout = "bar" | "icons"

// Back and Forward for the installed app, where the browser shows none (spec: Layout). One
// component, two layouts: the bottom bar below 1024 px and two icons before the brand from
// 1024 px. CSS shows at most one, and only in installed mode; in a browser tab both are
// display: none, so they are in neither the tab order nor the accessibility tree. The arrow is
// the only thing on screen; the name is visually hidden text.
export function HistoryButtons({ layout, atLanding }: { layout: Layout; atLanding: boolean }) {
	const t = useTranslation()
	const { backDisabled, forwardDisabled, back, forward } = useHistoryButtons(atLanding)
	const barRef = useBarHeight(layout === "bar")
	const { hidden: tipsHidden, show: showTips } = useDismissibleTips()
	const icons = layout === "icons"
	const press = (go: () => void) => (event: MouseEvent<HTMLButtonElement>) => {
		notePress(event.currentTarget)
		go()
	}
	const buttons = [
		{ key: "back", label: t("history.back"), Icon: BackIcon, disabled: backDisabled, go: back },
		{
			key: "forward",
			label: t("history.forward"),
			Icon: ForwardIcon,
			disabled: forwardDisabled,
			go: forward,
		},
	]
	return (
		<nav
			ref={barRef}
			aria-label={t("history.label")}
			className={icons ? "history-icons" : "history-bar"}
			data-tips={icons && tipsHidden ? "hidden" : undefined}
		>
			{buttons.map(({ key, label, Icon, disabled, go }) => (
				<button
					key={key}
					type="button"
					className="btn-secondary history-btn"
					disabled={disabled}
					onClick={press(go)}
					onPointerEnter={icons ? showTips : undefined}
					onFocus={icons ? showTips : undefined}
				>
					<Icon className="size-6" />
					<span className="visually-hidden">{label}</span>
					{/* Shown on hover and keyboard focus with a mouse only (see .history-tip). It
					    repeats the button's name, so screen readers skip it. */}
					{icons && (
						<span className="history-tip" aria-hidden="true">
							{label}
						</span>
					)}
				</button>
			))}
		</nav>
	)
}

// The page keeps room under its last line for the bar (spec: below 1024 px). The bar's real
// height, safe-area inset and larger text included, goes to --history-bar-h on <html>; CSS falls
// back to 4.25rem plus the inset until this runs. setProperty is CSSOM, which the CSP allows.
function useBarHeight(active: boolean) {
	const ref = useRef<HTMLElement>(null)
	useEffect(() => {
		const bar = ref.current
		if (!active || !bar) return
		const root = document.documentElement
		const observer = new ResizeObserver(() => {
			root.style.setProperty("--history-bar-h", `${bar.getBoundingClientRect().height}px`)
		})
		observer.observe(bar)
		return () => {
			observer.disconnect()
			root.style.removeProperty("--history-bar-h")
		}
	}, [active])
	return ref
}
