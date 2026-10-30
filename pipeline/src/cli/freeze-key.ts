// Freezes the answer key from a downloaded copy of the live site's data.
// Usage: node src/cli/freeze-key.ts <dir with resources.nb.json, resources.en.json,
// municipalities.json> <yyyy-mm-dd>
import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { freezeKey } from "../answerKey/freeze.ts"

const [dir, frozenOn] = process.argv.slice(2)
if (dir === undefined || frozenOn === undefined) {
	console.error("usage: freeze-key.ts <dir> <yyyy-mm-dd>")
	process.exit(1)
}
const read = (name: string) => JSON.parse(readFileSync(join(dir, name), "utf8"))
const key = freezeKey(
	read("resources.nb.json"),
	read("resources.en.json"),
	read("municipalities.json"),
	frozenOn
)
const out = fileURLToPath(new URL("../../test/answer-key.json", import.meta.url))
writeFileSync(out, `${JSON.stringify(key, null, "\t")}\n`)
console.log(`answer key: ${key.rows.length} rows, frozen on ${key.frozenOn}`)
