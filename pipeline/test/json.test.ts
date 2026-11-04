import { describe, expect, it } from "vitest"
import { readJson } from "../src/registers/json.ts"
import { fakeGet } from "./netHelpers.ts"

describe("readJson", () => {
	const url = "https://data.example.no/a"

	it("returns the parsed body of an ok result, fetched as json", async () => {
		const kinds: string[] = []
		const get = fakeGet({ [url]: { body: '{"a":[1,2]}' } })
		const read = await readJson(async (u, kind) => {
			kinds.push(kind)
			return get(u, kind)
		}, url)
		expect(read).toEqual({ a: [1, 2] })
		expect(kinds).toEqual(["json"])
	})

	it("returns undefined when the result is not ok", async () => {
		expect(await readJson(fakeGet({}), url)).toBeUndefined()
	})

	it("returns undefined when the body does not parse", async () => {
		expect(await readJson(fakeGet({ [url]: { body: "<html>" } }), url)).toBeUndefined()
	})
})
