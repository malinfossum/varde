import { expect, type Page, test } from "@playwright/test"

// A screen reader reads what Chromium puts in its accessibility tree, so these checks read that
// tree through CDP instead of trusting the DOM. Found with an NVDA pass on /resources/219: the
// badges sat in a <p> with display: flex, and Chromium drops the paragraph role from a flex
// container, so each badge was an inline span inside an unnamed generic with no block of its own.
// A <ul> with one <li> per badge is a real list: "list, 2 items", then each badge in order.

type Exposed = { role: string | undefined; parentRole: string | undefined }

// For every element matching `selector`, the role of the nearest ancestor of its text that the
// accessibility tree does not ignore, and that node's own parent role. Chromium prunes a plain
// span from the tree, so the walk starts at the span's text node.
async function exposedBadges(page: Page, selector: string): Promise<Exposed[]> {
	const cdp = await page.context().newCDPSession(page)
	try {
		const { root } = await cdp.send("DOM.getDocument", { depth: 0 })
		const { nodeIds } = await cdp.send("DOM.querySelectorAll", {
			nodeId: root.nodeId,
			selector,
		})
		const { nodes } = await cdp.send("Accessibility.getFullAXTree")
		const byBackendId = new Map(nodes.map((n) => [n.backendDOMNodeId, n]))
		const byId = new Map(nodes.map((n) => [n.nodeId, n]))
		const result: Exposed[] = []
		for (const nodeId of nodeIds) {
			const { node } = await cdp.send("DOM.describeNode", { nodeId, depth: 1 })
			const textNode = node.children?.find((child) => child.nodeType === 3)
			const start = textNode ? byBackendId.get(textNode.backendNodeId) : undefined
			let current = start?.parentId ? byId.get(start.parentId) : undefined
			while (current?.ignored) current = current.parentId ? byId.get(current.parentId) : undefined
			const parent = current?.parentId ? byId.get(current.parentId) : undefined
			result.push({
				role: current?.role?.value as string | undefined,
				parentRole: parent?.role?.value as string | undefined,
			})
		}
		return result
	} finally {
		await cdp.detach()
	}
}

const CASES = [
	{ path: "/resources/219", badges: ["Lavterskel", "Koster penger"] },
	{ path: "/en/resources/219", badges: ["No referral", "Costs money"] },
] as const

for (const { path, badges } of CASES) {
	test(`${path}: the detail badges are list items in the accessibility tree, in order`, async ({
		page,
	}) => {
		await page.goto(path)
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
		// Playwright's role query follows the same tree as a screen reader: a real list whose
		// items are the badges, in visual order.
		const list = page.getByRole("article").getByRole("list").first()
		await expect(list.getByRole("listitem")).toHaveText([...badges])
		const exposed = await exposedBadges(page, "article .badge")
		expect(exposed.map((e) => [e.role, e.parentRole])).toEqual(
			badges.map(() => ["listitem", "list"])
		)
	})
}

for (const { path, badges } of CASES) {
	const search = path.startsWith("/en") ? "/en/sok" : "/sok"
	test(`${search}: the result card badges are list items in the accessibility tree`, async ({
		page,
	}) => {
		await page.goto(search)
		const card = page.locator("li", { has: page.locator('h2 a[href$="/resources/219"]') })
		await expect(card.getByRole("list").getByRole("listitem")).toHaveText([...badges])
		const exposed = await exposedBadges(page, 'li:has(h2 a[href$="/resources/219"]) .badge')
		expect(exposed.map((e) => [e.role, e.parentRole])).toEqual(
			badges.map(() => ["listitem", "list"])
		)
	})
}
