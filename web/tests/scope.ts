import { within } from "@testing-library/react"

// The header renders its links and language rows twice: the desktop nav and picker, and the
// Meny (spec: One source, two layouts). Theme rows render once, in the Meny; the other theme
// control is the footer pill. CSS shows one of the two header layouts; jsdom loads no CSS and
// does not hide a closed <details>, so both are in the tree and a test scopes to one.
function scope(selector: string) {
	const el = document.querySelector<HTMLElement>(selector)
	if (!el) throw new Error(`no ${selector} in the document`)
	return within(el)
}

export const desktopTools = () => scope(".header-tools")
export const menu = () => scope("details.header-menu")
