import type { LookupAddress } from "node:dns"
import { BlockList, isIP, type LookupFunction } from "node:net"

const blocked = new BlockList()
// IPv4: this network, private ranges, shared address space, loopback, link-local, protocol
// assignments, documentation, benchmarking, multicast, reserved and broadcast.
for (const [net, prefix] of [
	["0.0.0.0", 8],
	["10.0.0.0", 8],
	["100.64.0.0", 10],
	["127.0.0.0", 8],
	["169.254.0.0", 16],
	["172.16.0.0", 12],
	["192.0.0.0", 24],
	["192.0.2.0", 24],
	["192.168.0.0", 16],
	["198.18.0.0", 15],
	["198.51.100.0", 24],
	["203.0.113.0", 24],
	["224.0.0.0", 4],
	["240.0.0.0", 4],
] as const) {
	blocked.addSubnet(net, prefix, "ipv4")
}
// IPv6: unspecified, loopback, NAT64, discard, documentation, unique local, link-local and
// multicast. IPv4-mapped addresses are checked as IPv4 below.
for (const [net, prefix] of [
	["::", 128],
	["::1", 128],
	["64:ff9b::", 96],
	["100::", 64],
	["2001:db8::", 32],
	["fc00::", 7],
	["fe80::", 10],
	["ff00::", 8],
] as const) {
	blocked.addSubnet(net, prefix, "ipv6")
}

export function isPrivateAddress(ip: string): boolean {
	const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip)
	if (mapped?.[1] !== undefined) return isPrivateAddress(mapped[1])
	const family = isIP(ip)
	if (family === 4) return blocked.check(ip, "ipv4")
	if (family === 6) return blocked.check(ip, "ipv6")
	return true
}

export type Resolve = (hostname: string) => Promise<LookupAddress[]>

// The DNS lookup node:https calls when it connects. It refuses a name when any of its
// addresses is private, so a host cannot answer one address to a check and another to the
// connection. Every address must be public, not just the first.
export function guardedLookup(resolve: Resolve): LookupFunction {
	return (hostname, options, callback) => {
		resolve(hostname).then(
			(addresses) => {
				const [first] = addresses
				if (first === undefined || addresses.some((a) => isPrivateAddress(a.address))) {
					callback(Object.assign(new Error("private address"), { code: "EPRIVATE" }), "", 0)
					return
				}
				if (options.all === true) callback(null, addresses)
				else callback(null, first.address, first.family)
			},
			(err: NodeJS.ErrnoException) => callback(err, "", 0)
		)
	}
}
