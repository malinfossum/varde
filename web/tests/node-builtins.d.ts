// This project carries no @types/node. tokens.test.ts needs to read tokens.css from disk, which
// takes three Node built-ins — declaring just those here avoids pulling in the full package.
declare module "node:fs" {
	export function readFileSync(path: string, encoding: "utf8"): string
}
declare module "node:path" {
	export function dirname(path: string): string
	export function join(...paths: string[]): string
}
declare module "node:url" {
	export function fileURLToPath(url: string | URL): string
}
