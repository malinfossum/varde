import { Readable } from "node:stream"
import { gzipSync } from "node:zlib"
import { describe, expect, it } from "vitest"
import { decode, readCapped } from "../src/net/body.ts"

describe("readCapped", () => {
	it("reads a body under the cap", async () => {
		const body = await readCapped(Readable.from([Buffer.from("abc")]), 10)
		expect(body.toString()).toBe("abc")
	})

	it("stops a body over the cap", async () => {
		const stream = Readable.from([Buffer.alloc(6), Buffer.alloc(6)])
		await expect(readCapped(stream, 10)).rejects.toMatchObject({ kind: "tooLarge" })
	})
})

describe("decode", () => {
	it("passes a plain body through", async () => {
		expect((await decode(Buffer.from("<urlset/>"), undefined, 100)).toString()).toBe("<urlset/>")
	})

	it("unpacks gzip by its header, or by its magic bytes when a .gz file comes untyped", async () => {
		const packed = gzipSync("<urlset/>")
		expect((await decode(packed, "gzip", 100)).toString()).toBe("<urlset/>")
		expect((await decode(packed, undefined, 100)).toString()).toBe("<urlset/>")
	})

	it("refuses a small gzip that unpacks past the cap", async () => {
		const bomb = gzipSync(Buffer.alloc(1_000_000))
		expect(bomb.length).toBeLessThan(10_000)
		await expect(decode(bomb, "gzip", 100_000)).rejects.toMatchObject({ kind: "tooLarge" })
	})

	it("refuses an encoding it does not know", async () => {
		await expect(decode(Buffer.from("x"), "compress", 100)).rejects.toMatchObject({
			kind: "network",
		})
	})
})
