import { useEffect, useState } from "react"
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

	// Escape closes the tooltips (WCAG 1.4.13) until the pointer enters or focus lands on an action,
	// the same pattern as the acute strip.
	const [tipsHidden, setTipsHidden] = useState(false)
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setTipsHidden(true)
		}
		document.addEventListener("keydown", onKeyDown)
		return () => document.removeEventListener("keydown", onKeyDown)
	}, [])
	const showTips = () => setTipsHidden(false)

	const onCopy = async () => {
		if (!phone) return
		const ok = await copyText(phone, navigator)
		announce(t(ok ? "detail.phoneCopied" : "detail.copyFailed"))
	}

	const onShare = async () => {
		const outcome = await shareResource({ name, phone, url: window.location.href }, navigator)
		if (outcome === "copied") announce(t("detail.linkCopied"))
		if (outcome === "failed") announce(t("detail.copyFailed"))
	}

	const copyName = t("detail.copyPhone")
	const shareName = t(capability === "share" ? "detail.share" : "detail.copyLink")
	const reportName = t("report.link")
	const hover = { onPointerEnter: showTips, onFocus: showTips }

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
					<CopyIcon />
					<span className="action-label" aria-hidden="true">
						{copyName}
					</span>
					<span className="action-tip" aria-hidden="true">
						{copyName}
					</span>
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
					<ShareIcon />
					<span className="action-label" aria-hidden="true">
						{shareName}
					</span>
					<span className="action-tip" aria-hidden="true">
						{shareName}
					</span>
				</button>
			)}
			<a href={reportHref(id, name)} className="action-btn" aria-label={reportName} {...hover}>
				<FlagIcon />
				<span className="action-label" aria-hidden="true">
					{t("report.short")}
				</span>
				<span className="action-tip" aria-hidden="true">
					{reportName}
				</span>
			</a>
		</div>
	)
}
