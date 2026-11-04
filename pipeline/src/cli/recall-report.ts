// Scores discover's output against the 138-row answer key and prints the report as markdown
// for the PR body. A low number does not fail: each miss becomes a discover fix before PR 4.
//   node src/cli/recall-report.ts [--cache <dir>] > recall.md
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { parseArgs } from "node:util"
import { AnswerKey } from "../answerKey/schema.ts"
import { DiscoverError } from "../discover/discover.ts"
import { readDiscovery } from "../discover/files.ts"
import { DEFAULT_CACHE_DIR } from "../io/pageCache.ts"
import { recall, renderRecall } from "../recall/report.ts"

const { values } = parseArgs({ options: { cache: { type: "string" } } })

try {
	const found = readDiscovery(join(values.cache ?? DEFAULT_CACHE_DIR, "discover"))
	const key = AnswerKey.parse(
		JSON.parse(readFileSync(new URL("../../test/answer-key.json", import.meta.url), "utf8"))
	)
	process.stdout.write(
		renderRecall(
			recall({
				key,
				kommuner: found.kommuner,
				national: found.national,
				report: found.report,
				hosts: found.hosts,
			})
		)
	)
} catch (err) {
	console.error(
		err instanceof DiscoverError ? err.message : "recall-report stopped on an unexpected error"
	)
	process.exit(1)
}
