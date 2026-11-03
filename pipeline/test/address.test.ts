import { describe, expect, it } from "vitest"
import { guardedLookup, isIpLiteralHost, isPrivateAddress } from "../src/net/address.ts"

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
			"192.88.99.1",
			"::a00:1",
			"::ffff:0:a00:1",
			"64:ff9b:1::a00:1",
			"2001::a00:1",
			"2002:a00:1::1",
			"not-an-address",
		]) {
			expect(isPrivateAddress(ip), ip).toBe(true)
		}
	})

	it("lets public addresses through", () => {
		for (const ip of ["151.101.1.1", "2a02:c7f::1", "::ffff:151.101.1.1", "2001:4860:4860::8888"]) {
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

describe("isIpLiteralHost", () => {
	it("flags an IPv4 or bracketed IPv6 literal, public or private", () => {
		for (const url of [
			"https://169.254.169.254/",
			"https://10.0.0.1/",
			"https://151.101.1.1/",
			"https://[::1]/",
			"https://[2a02:c7f::1]/",
			"https://2130706433/",
		]) {
			expect(isIpLiteralHost(new URL(url)), url).toBe(true)
		}
	})

	it("lets a host name through", () => {
		for (const url of ["https://www.eksempel.no/", "https://eksempel.no:8443/x"]) {
			expect(isIpLiteralHost(new URL(url)), url).toBe(false)
		}
	})
})
