// Validates every file in data/. Exit code 1 when anything is wrong.
import { fileURLToPath } from "node:url"
import { checkData } from "../check/dataCheck.ts"
import { readJsonDir } from "../io/files.ts"

const root = fileURLToPath(new URL("../../../", import.meta.url))
const problems = checkData(root)
for (const p of problems) console.error(p)
if (problems.length > 0) process.exit(1)
const curated = readJsonDir(`${root}data/curated`).length
const lock = readJsonDir(`${root}data/lock`).length
console.log(`data ok: ${curated} curated, ${lock} lock files`)
