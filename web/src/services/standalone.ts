// Installed mode (spec: Layout, Installed mode). Android and desktop installs match
// (display-mode: standalone) in CSS; an iPhone app added to the home screen does not, and reports
// navigator.standalone instead. main.tsx marks <html> from it before it hydrates, so the CSS can
// switch the history controls on from either signal. Only the CSS reads it.
export function isIosStandalone(nav: Navigator): boolean {
	return (nav as Navigator & { standalone?: unknown }).standalone === true
}

export function markStandalone(root: HTMLElement, nav: Navigator): void {
	if (isIosStandalone(nav)) root.dataset.standalone = ""
}
