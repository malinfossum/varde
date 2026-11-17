// Progress lines for a long fetch. Actions logs are public, so a line holds counts, kommune
// numbers and KLASS names only, never a host or a URL.
const count = (n: number) => n.toLocaleString("en-US")

export class KommuneProgress {
	readonly #names: ReadonlyMap<string, string>
	readonly #print: (line: string) => void
	readonly #kommuner: number
	// The pages each kommune still waits for, and the kommuner each page belongs to. A page two
	// kommuner share counts for both.
	readonly #waiting = new Map<string, Set<string>>()
	readonly #kommunerOf = new Map<string, string[]>()
	readonly #settled = new Set<string>()
	#done = 0

	constructor(
		byKommune: ReadonlyMap<string, readonly string[]>,
		names: ReadonlyMap<string, string>,
		print: (line: string) => void
	) {
		this.#names = names
		this.#print = print
		this.#kommuner = byKommune.size
		for (const [kommune, urls] of byKommune) {
			this.#waiting.set(kommune, new Set(urls))
			for (const url of urls) {
				const list = this.#kommunerOf.get(url)
				if (list === undefined) this.#kommunerOf.set(url, [kommune])
				else if (!list.includes(kommune)) list.push(kommune)
			}
		}
		// A kommune with nothing left to fetch, all of it stored before a resume, is done at once.
		for (const [kommune, waiting] of this.#waiting) if (waiting.size === 0) this.#finish(kommune)
	}

	// One URL settled, fetched or not. A second call for the same URL changes nothing, and so does
	// a URL outside every kommune (a national page): the counts are the kommuner's pages.
	page(url: string): void {
		const kommuner = this.#kommunerOf.get(url)
		if (kommuner === undefined || this.#settled.has(url)) return
		this.#settled.add(url)
		for (const kommune of kommuner) {
			const waiting = this.#waiting.get(kommune)
			if (waiting === undefined) continue
			waiting.delete(url)
			if (waiting.size === 0) this.#finish(kommune)
		}
	}

	heartbeat(): void {
		this.#print(
			`fetch: ${count(this.#settled.size)} of ${count(this.#kommunerOf.size)} pages, ${this.#done} of ${this.#kommuner} kommuner`
		)
	}

	#finish(kommune: string): void {
		this.#done++
		const name = this.#names.get(kommune)
		const who = name === undefined ? kommune : `${kommune} ${name}`
		this.#print(`fetch: ${who} done (${this.#done} of ${this.#kommuner})`)
	}
}
