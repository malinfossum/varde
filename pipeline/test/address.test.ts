import { describe, expect, it } from "vitest"
import { guardedLookup, isPrivateAddress } from "../src/net/address.ts"

describe("isPrivateAddress", () => {
	it("refuses private, loopback, link-local and other non-public addresses", () => {
		for (const ip of [
			"10.0.0.1",
			"172.16.5.4",
			"192.168.1.1",
			"127.0.0.1",
			"169.254.169.254",
			"100.64.0.1",
			"0.0.0.0",
			"224.0.0.1",
			"255.255.255.255",
			"::1",
			"::",
			"fe80::1",
			"fd00::1",
			"::ffff:10.0.0.1",
			"::ffff:127.0.0.1",
			"64:ff9b::a00:1",
			"not-an-address",
		]) {
			expect(isPrivateAddress(ip), ip).toBe(true)
		}
	})

	it("lets public addresses through", () => {
		for (const ip of ["151.101.1.1", "2a02:c7f::1", "::ffff:151.101.1.1"]) {
			expect(isPrivateAddress(ip), ip).toBe(false)
		}
	})
})

type Answer = { err: NodeJS.ErrnoException | null; address: unknown }

function lookup(addresses: { address: string; family: number }[], all = false): Promise<Answer> {
	return new Promise((resolve) => {
		guardedLookup(async () => addresses)("www.eksempel.no", { all }, (err, address) =>
			resolve({ err, address })
		)
	})
}

describe("guardedLookup", () => {
	it("refuses a host that resolves to a private address", async () => {
		const answer = await lookup([{ address: "10.0.0.7", family: 4 }])
		expect(answer.err?.code).toBe("EPRIVATE")
	})

	it("refuses a host when any one of its addresses is private", async () => {
		const answer = await lookup([
			{ address: "151.101.1.1", family: 4 },
			{ address: "127.0.0.1", family: 4 },
		])
		expect(answer.err?.code).toBe("EPRIVATE")
	})

	it("refuses a host with no address at all", async () => {
		expect((await lookup([])).err?.code).toBe("EPRIVATE")
	})

	it("passes a public address, one at a time or as a list", async () => {
		expect((await lookup([{ address: "151.101.1.1", family: 4 }])).address).toBe("151.101.1.1")
		expect((await lookup([{ address: "151.101.1.1", family: 4 }], true)).address).toEqual([
			{ address: "151.101.1.1", family: 4 },
		])
	})
})
