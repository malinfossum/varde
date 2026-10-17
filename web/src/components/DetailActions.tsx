import { type ReactNode, useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import {
	copyText,
	reportHref,
	type ShareCapability,
	shareCapability,
	shareResource,
} from "../services/contactActions.ts"
import { CopyIcon, FlagIcon, ShareIcon } from "./icons.tsx"
import { useAnnounce } from "./StatusRegion.tsx"

// How long a copy confirmation stays on screen (spec: Visible feedback). Four seconds, not two:
// someone with low vision needs time to find and read even three words.
export const FEEDBACK_MS = 4000

// The key, not the text, so a language switch while it shows changes the bubble too.
type Feedback = { action: "copy" | "share"; key: string }

// What every action shows inside its button or link: the icon, the short label and one bubble. A
// confirmation takes the name tooltip's place, so there is never more than one bubble. All three
// are aria-hidden, since the name is the aria-label and the live region speaks the confirmation.
function ActionBody({
	icon,
	label,
	name,
	feedback,
}: {
	icon: ReactNode
	label: string
	name: string
	feedback: string | null
}) {
	return (
		<>
			{icon}
			<span className="action-label" aria-hidden="true">
				{label}
			</span>
			{feedback ? (
				<span className="action-feedback" aria-hidden="true">
					{feedback}
				</span>
			) : (
				<span className="action-tip" aria-hidden="true">
					{name}
				</span>
			)}
		</>
	)
}

// Copy number, share and report (spec: Corner actions, option D). One set of controls serves
// every width; main.css shows them as labelled buttons under the title, or as 44 px icons with
// tooltips in the card's top-right corner when there is room and a mouse. The full name is the
// aria-label, so the short label and the tooltip are aria-hidden and a screen reader hears each
// name once. The group has no role: three controls are quicker with Tab than a toolbar.
export function DetailActions({
	id,
	name,
	phone,
}: {
	id: number
	name: string
	phone: string | null
}) {
	const t = useTranslation()
	const announce = useAnnounce()

	// The prerender shows all three actions, with share labelled Del, so the row never jumps from
	// one button to three on load (spec: Hydration). After mount this corrects the rare browser
	// that has no clipboard or no share sheet. The server and first client render still match.
	const [capability, setCapability] = useState<ShareCapability>("share")
	const [canCopy, setCanCopy] = useState(true)
	// Share/copy support is a fact about this browser, not this navigation, so this runs on mount.
	useEffect(() => {
		setCapability(shareCapability(navigator))
		setCanCopy(Boolean(navigator.clipboard))
	}, [])

	const [feedback, setFeedback] = useState<Feedback | null>(null)
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
	// False once the page is gone, so a clipboard write that finishes after navigation starts no
	// timer and sets no state. Set in the effect, not at creation, so StrictMode's second mount
	// turns it back on.
	const mounted = useRef(false)
	useEffect(() => {
		mounted.current = true
		return () => {
			mounted.current = false
			clearTimeout(timer.current)
		}
	}, [])

	const clearFeedback = useCallback(() => {
		clearTimeout(timer.current)
		setFeedback(null)
	}, [])
	// A second click on the same action lands here again and restarts the 4 seconds.
	const showConfirmation = (action: Feedback["action"], key: string) => {
		announce(t(key))
		if (!mounted.current) return
		clearTimeout(timer.current)
		setFeedback({ action, key })
		timer.current = setTimeout(() => setFeedback(null), FEEDBACK_MS)
	}

	// Escape closes the tooltips (WCAG 1.4.13) and a confirmation with them, until the pointer
	// enters or focus lands on an action. Same pattern as the acute strip.
	const [tipsHidden, setTipsHidden] = useState(false)
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Escape") return
			setTipsHidden(true)
			clearFeedback()
		}
		document.addEventListener("keydown", onKeyDown)
		return () => document.removeEventListener("keydown", onKeyDown)
	}, [clearFeedback])
	const showTips = () => setTipsHidden(false)

	// A click on any action first clears a confirmation that another action shows.
	const onCopy = async () => {
		if (!phone) return
		clearFeedback()
		const ok = await copyText(phone, navigator)
		showConfirmation("copy", ok ? "detail.phoneCopied" : "detail.copyFailed")
	}

	// A native share sheet ("shared") is its own feedback, and a cancelled one says nothing.
	const onShare = async () => {
		clearFeedback()
		const outcome = await shareResource({ name, phone, url: window.location.href }, navigator)
		if (outcome === "copied") showConfirmation("share", "detail.linkCopied")
		if (outcome === "failed") showConfirmation("share", "detail.copyFailed")
	}

	const copyName = t("detail.copyPhone")
	const shareName = t(capability === "share" ? "detail.share" : "detail.copyLink")
	const reportName = t("report.link")
	const hover = { onPointerEnter: showTips, onFocus: showTips }
	const copyFeedback = feedback?.action === "copy" ? t(feedback.key) : null
	const shareFeedback = feedback?.action === "share" ? t(feedback.key) : null

	return (
		<div className="detail-actions" data-tips={tipsHidden ? "hidden" : undefined}>
			{phone && canCopy && (
				<button
					type="button"
					className="action-btn"
					aria-label={copyName}
					onClick={onCopy}
					{...hover}
				>
					<ActionBody
						icon={<CopyIcon />}
						label={copyName}
						name={copyName}
						feedback={copyFeedback}
					/>
				</button>
			)}
			{capability !== "none" && (
				<button
					type="button"
					className="action-btn"
					aria-label={shareName}
					onClick={onShare}
					{...hover}
				>
					<ActionBody
						icon={<ShareIcon />}
						label={shareName}
						name={shareName}
						feedback={shareFeedback}
					/>
				</button>
			)}
			<a
				href={reportHref(id, name)}
				className="action-btn"
				aria-label={reportName}
				onClick={clearFeedback}
				{...hover}
			>
				<ActionBody
					icon={<FlagIcon />}
					label={t("report.short")}
					name={reportName}
					feedback={null}
				/>
			</a>
		</div>
	)
}
