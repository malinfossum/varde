// Scores the pilot's committed lock files against the pass mark and writes
// docs/pilot/pilot-report.md. It never fetches and never purges: it reads data/, the answer key,
// my checks, and the local discover, crawl and extract caches. It prints the pass-mark lines and
// counts only, never a quote, a value, a unit id or a URL.
//   node src/cli/score.ts [--only pilot] [--pr-body <file>] [--todo <file>] [--seed-blocked] [--offline] [--cache <dir>]
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"
import { writeFileAtomic, writeJsonAtomic } from "../io/files.ts"
import { DEFAULT_CACHE_DIR } from "../io/pageCache.ts"
import { PILOT } from "../pilot/list.ts"
import {
	loadPilotInput,
	loadScaleInput,
	REPORT_PATH,
	ScoreLoadError,
	testFile,
	transientStops,
} from "../score/load.ts"
import { type PilotInput, type PilotScore, scorePilot } from "../score/pilot.ts"
import { PrBodyTooLongError, renderPrBody, renderReport } from "../score/render.ts"
import { scaleNumbers } from "../score/scale.ts"
import { seedBlocked, todoItems } from "../score/todo.ts"

const USAGE =
	"usage: score [--only pilot] [--pr-body <file>] [--todo <file>] [--seed-blocked] [--offline (changes nothing)] [--cache <dir>]"
const HELP = [
	USAGE,
	"",
	"  --only pilot      Oslo and the 46 Innlandet kommuner: the default, and the only selection score takes",
	"  --pr-body <file>  also write the PR-body summary, with the scale numbers from the cache",
	"  --todo <file>     write the disagreements and sampled fields that wait for my check, leaving out the kommuner that block ClaudeBot",
	'  --seed-blocked    add a "check by hand" entry to test/pilot-checks.json for each one in those kommuner',
	"  --offline         accepted so every stage takes it; it changes nothing, because score never fetches and never purges",
	"  --cache <dir>     the cache folder (default: .cache/ at the repo root)",
].join("\n")

function stop(message: string, code: number): never {
	console.error(message)
	process.exit(code)
}

const parsed = (() => {
	try {
		return parseArgs({
			options: {
				only: { type: "string" },
				"pr-body": { type: "string" },
				todo: { type: "string" },
				"seed-blocked": { type: "boolean", default: false },
				offline: { type: "boolean", default: false },
				cache: { type: "string" },
				help: { type: "boolean", default: false },
			},
		})
	} catch {
		return undefined
	}
})()
if (parsed === undefined) stop(USAGE, 2)
const { values } = parsed
if (values.help) {
	console.log(HELP)
	process.exit(0)
}
if (values.only !== undefined && values.only !== "pilot")
	stop(`score takes the whole pilot only: use --only pilot\n${USAGE}`, 2)

const root = fileURLToPath(new URL("../../../", import.meta.url))
const cacheDir = values.cache ?? DEFAULT_CACHE_DIR

function scoreOrStop(input: PilotInput): PilotScore {
	const result = scorePilot(input)
	if (!result.refused) return result
	for (const p of result.problems) console.error(p)
	return stop("score refused: nothing was written", 1)
}

try {
	const input = loadPilotInput(root, cacheDir, PILOT)
	// A kommune whose own site stopped halfway can hold a normal lock with pages missing (Decided 26).
	const stops = transientStops(input)
	if (stops.length > 0) {
		console.error(
			`Own site stopped on a timeout, a network error or a server error: ${stops.join(", ")}. Run fetch --resume, extract, verify --resume, then score.`
		)
		stop("score refused: nothing was written", 1)
	}
	let score = scoreOrStop(input)
	// Seeding only ever follows a score that passed the refusal checks.
	const seeded = values["seed-blocked"]
		? seedBlocked(score, input.checks, input.blocked)
		: undefined
	if (seeded !== undefined && seeded.added > 0)
		score = scoreOrStop({ ...input, checks: seeded.checks })
	// Everything is built before anything is written: a body over the limit leaves every file as it was.
	const report = renderReport(score)
	const prBodyPath = values["pr-body"]
	const prBody =
		prBodyPath === undefined
			? undefined
			: renderPrBody(score, scaleNumbers(loadScaleInput(root, cacheDir, PILOT)), REPORT_PATH)
	const todo = values.todo === undefined ? undefined : todoItems(score, input.blocked)

	if (seeded !== undefined && seeded.added > 0)
		writeJsonAtomic(testFile(root, "pilot-checks.json"), seeded.checks)
	writeFileAtomic(join(root, REPORT_PATH), report)
	if (prBodyPath !== undefined && prBody !== undefined) writeFileAtomic(resolve(prBodyPath), prBody)
	if (values.todo !== undefined && todo !== undefined)
		writeJsonAtomic(resolve(values.todo), { blockedHosts: input.blockedHosts, items: todo })

	for (const r of score.rules)
		console.log(`Rule ${r.rule} (${r.status}): ${r.measured}. Target: ${r.target}.`)
	console.log(
		`Done when: disagreements ruled by me ${score.done.disagreementsRuled} of ${score.done.disagreements}, sampled fields checked by me ${score.done.sampleFieldsChecked} of ${score.done.sampleFields}, to check by hand ${score.done.checkByHand}`
	)
	if (seeded !== undefined)
		console.log(`Check-by-hand entries added to test/pilot-checks.json: ${seeded.added}`)
	if (todo !== undefined) console.log(`Items written to the todo file: ${todo.length}`)
	console.log(`Report written: ${REPORT_PATH}`)
	if (prBody !== undefined) console.log(`PR body summary written: ${prBody.length} characters`)
} catch (err) {
	const known = err instanceof ScoreLoadError || err instanceof PrBodyTooLongError
	console.error(known ? err.message : "score stopped on an unexpected error")
	process.exit(1)
}
