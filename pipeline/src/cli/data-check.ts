// Validates every file in data/. Exit code 1 when anything is wrong.
//   node src/cli/data-check.ts [--publish]
// --publish also fails while pipeline/test/known-wrong.json lists a value. Spec B's publish step
// and PR 5's workflows run it, so a value I ruled wrong never reaches the site.
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"
import { checkData } from "../check/dataCheck.ts"
import { readJsonDir } from "../io/files.ts"

const USAGE = "usage: data:check [--publish]"

function publishFlag(): boolean | undefined {
	try {
		return parseArgs({ options: { publish: { type: "boolean", default: false } } }).values.publish
	} catch {
		return undefined
	}
}
const publish = publishFlag()
if (publish === undefined) {
	console.error(USAGE)
	process.exit(2)
}

const root = fileURLToPath(new URL("../../../", import.meta.url))
const problems = checkData(root, { publish })
for (const p of problems) console.error(p)
if (problems.length > 0) process.exit(1)
const curated = readJsonDir(`${root}data/curated`).length
const lock = readJsonDir(`${root}data/lock`).length
console.log(
	`data ok: ${curated} curated, ${lock} lock files${publish ? "; known-wrong.json is empty, fit to publish" : ""}`
)
