import { load } from "cheerio/slim"
import { describe, expect, it } from "vitest"
import { stripScripts } from "../src/fetch/stripScripts.ts"

describe("stripScripts", () => {
	it("empties every runnable script and gives it a type no browser runs, keeping its src", () => {
		const out = stripScripts(
			[
				'<script src="https://cdn.example/acos-shared-components.js"></script>',
				'<script>alert("x")</script>',
				'<script type="module">import "x"</script>',
				'<script type=" text/javascript ">eval(atob("eA=="))</script>',
			].join("")
		)
		const $ = load(out)
		expect($("script").length).toBe(4)
		$("script").each((_, el) => {
			expect($(el).attr("type")).toBe("text/x-varde-stripped")
			expect($(el).text()).toBe("")
		})
		expect(out).toContain("acos-shared-components")
		for (const code of ["alert", "import", "eval"]) expect(out).not.toContain(code)
	})

	it("keeps JSON data blocks, which a browser never runs", () => {
		const next =
			'<script id="__NEXT_DATA__" type="application/json">{"office":"Nav Eksempel"}</script>'
		const ld = '<script type="application/ld+json">{"@type":"Organization"}</script>'
		const out = stripScripts(next + ld)
		expect(load(out)("script#__NEXT_DATA__").text()).toBe('{"office":"Nav Eksempel"}')
		expect(out).toContain('{"@type":"Organization"}')
	})

	it("drops event handlers, code URLs and a refresh redirect, and leaves the rest", () => {
		const out = stripScripts(
			[
				'<meta http-equiv="Refresh" content="0;url=https://scam.example/">',
				'<body onload="go()"><a href="java\tscript:go()" title="Kontakt">Kontakt</a>',
				'<iframe src="data:text/html,<b>x</b>"></iframe>',
				'<a href="https://eksempel.no/" onmouseover="go()">Eksempel</a></body>',
			].join("")
		)
		for (const gone of ["scam.example", "onload", "script:", "data:text", "onmouseover"]) {
			expect(out).not.toContain(gone)
		}
		expect(out).toContain('href="https://eksempel.no/"')
		expect(out).toContain('title="Kontakt"')
	})
})
