// PNG bytes to a single-image .ico: a 6-byte header, one 16-byte directory entry, then the PNG
// itself (every browser since Vista-era IE reads PNG-in-ICO). No dependency.
export function pngToIco(png, size) {
	const out = new Uint8Array(22 + png.length)
	const view = new DataView(out.buffer)
	view.setUint16(0, 0, true) // reserved
	view.setUint16(2, 1, true) // type 1: icon
	view.setUint16(4, 1, true) // one image
	out[6] = size >= 256 ? 0 : size // width, 0 means 256
	out[7] = size >= 256 ? 0 : size // height
	view.setUint16(10, 1, true) // colour planes
	view.setUint16(12, 32, true) // bits per pixel
	view.setUint32(14, png.length, true) // image size
	view.setUint32(18, 22, true) // image offset
	out.set(png, 22)
	return out
}
