/* ======================================================================
   src/main.tsx — VITE ENTRY POINT
   Boots the app. Rarely edited.
   ====================================================================== */

import { StrictMode } from "react"
import { createRoot, hydrateRoot } from "react-dom/client"
import { App } from "./App.tsx"
import { PageDataContext } from "./pageData.ts"
import { readPageData } from "./services/data.ts"
import "./styles/main.css"

const root = document.getElementById("root")
if (!root) throw new Error("Missing #root element in index.html")

const app = (
	<StrictMode>
		<PageDataContext.Provider value={readPageData() ?? {}}>
			<App />
		</PageDataContext.Provider>
	</StrictMode>
)

// Prerendered pages arrive with HTML inside #root and are hydrated. The Vite dev server and
// 404.html ship an empty root and are rendered from scratch. One entry, both cases.
// firstElementChild, not hasChildNodes: index.html's <!--app-html--> placeholder is itself a
// comment child of an empty root, so hasChildNodes() would be true even with nothing to
// hydrate and wrongly call hydrateRoot on an empty tree.
if (root.firstElementChild) {
	hydrateRoot(root, app, {
		onRecoverableError: (error) =>
			console.error("Hydration mismatch — the prerender and the client disagree:", error),
	})
} else {
	createRoot(root).render(app)
}
