// Whole lines from the terminal, one per Enter. A key with no Enter after it is never a line, so a
// stray or repeated key press commits nothing. On abort (Ctrl+C) or the end of input, next() gives
// undefined at once.
export class LineReader {
	readonly #lines: string[] = []
	#partial = ""
	#closed = false
	#aborted = false
	#wake: (() => void) | undefined

	constructor(input: NodeJS.ReadableStream, signal?: AbortSignal) {
		;(input as { setEncoding?: (encoding: string) => void }).setEncoding?.("utf8")
		input.on("data", (chunk: string | Buffer) => {
			const parts = `${this.#partial}${String(chunk)}`.split("\n")
			this.#partial = parts.pop() ?? ""
			this.#lines.push(...parts.map((l) => l.replace(/\r$/, "")))
			this.#wake?.()
		})
		const close = () => {
			this.#closed = true
			this.#wake?.()
		}
		input.on("end", close)
		input.on("close", close)
		const abort = () => {
			this.#aborted = true
			close()
		}
		if (signal?.aborted) abort()
		signal?.addEventListener("abort", abort, { once: true })
	}

	async next(): Promise<string | undefined> {
		for (;;) {
			if (this.#aborted) return undefined
			const line = this.#lines.shift()
			if (line !== undefined) return line
			if (this.#closed) return undefined
			await new Promise<void>((resolve) => {
				this.#wake = resolve
			})
			this.#wake = undefined
		}
	}
}
