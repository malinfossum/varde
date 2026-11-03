// Tests never touch the network. A stray fetch fails at once instead of reaching a real host;
// the boundary test keeps every other network module out of the tests.
globalThis.fetch = (() =>
	Promise.reject(new Error("tests never touch the network"))) as unknown as typeof fetch
