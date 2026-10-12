import { within } from "@testing-library/react"

// The header renders its links, language rows and theme rows twice: the desktop nav and
// pickers, and the Meny (spec: One source, two layouts). CSS shows one of them; jsdom loads no
// CSS and does not hide a closed <details>, so both are in the tree and a test scopes to one.
function scope(selector: string) {
	const el = document.querySelector<HTMLElement>(selector)
	if (!el) throw new Error(`no ${selector} in the document`)
	return within(el)
}

export const desktopTools = () => scope(".header-tools")
export const menu = () => scope("details.header-menu")
