import type { Transform } from "node:stream"
import { createBrotliDecompress, createGunzip, createInflate } from "node:zlib"
import { NetError } from "./types.ts"

// Reads a stream into memory and stops at max bytes, so a large or endless body cannot fill
// the runner.
export async function readCapped(
	stream: AsyncIterable<Buffer | string>,
	max: number
): Promise<Buffer> {
	const chunks: Buffer[] = []
	let size = 0
	for await (const chunk of stream) {
		const buffer = typeof chunk === "string" ? Buffer.from(chunk) : chunk
		size += buffer.length
		if (size > max) throw new NetError("tooLarge")
		chunks.push(buffer)
	}
	return Buffer.concat(chunks)
}

// Unpacks a body that came compressed, and caps it again after: a small gzip can unpack to
// gigabytes. A sitemap.xml.gz served without a Content-Encoding is found by its magic bytes.
export async function decode(
	body: Buffer,
	contentEncoding: string | undefined,
	max: number
): Promise<Buffer> {
	// A redirect or a 204 can carry Content-Encoding with no body to unpack.
	if (body.length === 0) return body
	const encoding = (contentEncoding ?? "").trim().toLowerCase()
	const gzipMagic = body[0] === 0x1f && body[1] === 0x8b
	let unpack: Transform | undefined
	if (encoding === "gzip" || encoding === "x-gzip" || (encoding === "" && gzipMagic)) {
		unpack = createGunzip()
	} else if (encoding === "br") {
		unpack = createBrotliDecompress()
	} else if (encoding === "deflate") {
		unpack = createInflate()
	} else if (encoding !== "" && encoding !== "identity") {
		throw new NetError("network")
	}
	if (unpack === undefined) return body
	unpack.end(body)
	try {
		return await readCapped(unpack, max)
	} catch (err) {
		unpack.destroy()
		throw err instanceof NetError ? err : new NetError("network")
	}
}
