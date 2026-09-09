// This project carries no @types/node. tokens.test.ts needs to read tokens.css from disk, which
// takes three Node built-ins — declaring just those here avoids pulling in the full package.
// fonts.test.ts adds existsSync/statSync (fs) and createHash (crypto) for its byte-identity check.
declare module "node:fs" {
	export function readFileSync(path: string, encoding: "utf8"): string
	export function readFileSync(path: string): Uint8Array
	export function existsSync(path: string): boolean
	export function statSync(path: string): { size: number }
}
declare module "node:path" {
	export function dirname(path: string): string
	export function join(...paths: string[]): string
}
declare module "node:url" {
	export function fileURLToPath(url: string | URL): string
}
declare module "node:crypto" {
	export function createHash(algorithm: string): {
		update(data: Uint8Array): { digest(encoding: "hex"): string }
	}
}
