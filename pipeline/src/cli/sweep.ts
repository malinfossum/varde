// Lists every capitalised word left in the lock files' values, roles and quotes that does not
// open a sentence and is not a word Varde knows, so I can read them before a commit. It prints to
// my terminal only and writes no file. I run it in Windows Terminal, outside any AI tool.
//   node src/cli/sweep.ts [--only pilot|3405,0301] [--cache <dir>]
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"
import { DEFAULT_CACHE_DIR } from "../io/pageCache.ts"
import { parseOnly } from "../pilot/list.ts"
import { ScoreLoadError } from "../score/load.ts"
import { runSweep } from "../score/sweep.ts"

const USAGE = "usage: sweep [--only pilot|3405,0301] [--cache <dir>]"

function stop(message: string, code: number): never {
	console.error(message)
	process.exit(code)
}

const parsed = (() => {
	try {
		return parseArgs({ options: { only: { type: "string" }, cache: { type: "string" } } })
	} catch {
		return undefined
	}
})()
if (parsed === undefined) stop(USAGE, 2)
const only = parseOnly(parsed.values.only)
if (only === undefined) stop(USAGE, 2)

const root = fileURLToPath(new URL("../../../", import.meta.url))
try {
	console.log(runSweep(root, parsed.values.cache ?? DEFAULT_CACHE_DIR, only))
} catch (err) {
	stop(err instanceof ScoreLoadError ? err.message : "sweep stopped on an unexpected error", 1)
}
