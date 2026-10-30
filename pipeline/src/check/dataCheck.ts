import { join } from "node:path"
import { quoteHasValue } from "../gates/grounding.ts"
import { ACCOUNT_NUMBER } from "../gates/safety.ts"
import { fitsNumberPlan, MAX_HOURS } from "../gates/validity.ts"
import { readJsonDir } from "../io/files.ts"
import { FieldName } from "../schema/common.ts"
import { CuratedFile } from "../schema/curated.ts"
import { LockFile } from "../schema/lock.ts"

// Runs in CI on every PR: the schemas, the file names, and the gate checks that need no
// page (a quote still holds its value, the phone plan, the hours limit, no account
// numbers). Problems name the file, unit and field, never the value.
export function checkData(root: string): string[] {
	const problems: string[] = []

	for (const { file, data, valid } of readJsonDir(join(root, "data", "curated"))) {
		if (!valid) {
			problems.push(`curated/${file}: not valid JSON`)
			continue
		}
		const parsed = CuratedFile.safeParse(data)
		if (!parsed.success) {
			for (const issue of parsed.error.issues) {
				problems.push(`curated/${file} ${issue.path.join(".")}: ${issue.message}`)
			}
			continue
		}
		const match = /^(\d{4})-[a-z0-9-]+\.json$/.exec(file)
		if (match?.[1] !== parsed.data.kommune) {
			problems.push(`curated/${file}: name must be <kommune number>-<slug>.json for its kommune`)
		}
	}

	for (const { file, data, valid } of readJsonDir(join(root, "data", "lock"))) {
		if (!valid) {
			problems.push(`lock/${file}: not valid JSON`)
			continue
		}
		if (ACCOUNT_NUMBER.test(JSON.stringify(data))) {
			problems.push(`lock/${file}: holds an account number`)
		}
		const parsed = LockFile.safeParse(data)
		if (!parsed.success) {
			for (const issue of parsed.error.issues) {
				problems.push(`lock/${file} ${issue.path.join(".")}: ${issue.message}`)
			}
			continue
		}
		if (file !== `${parsed.data.kommune}.json`) {
			problems.push(`lock/${file}: name must be <kommune number>.json for its kommune`)
		}
		// Sorted units make a plain re-run byte-identical, which the refresh-only check relies on.
		const ids = parsed.data.units.map((u) => u.unitId)
		if (ids.some((id, i) => i > 0 && (ids[i - 1] ?? "") > id)) {
			problems.push(`lock/${file}: units must be sorted by unitId`)
		}
		for (const unit of parsed.data.units) {
			for (const name of FieldName.options) {
				const field = unit.fields[name]
				if (field === undefined || field.status === "dropped" || field.value === undefined) continue
				const at = `lock/${file} ${unit.unitId} ${name}`
				const value = field.value
				if (
					field.evidence?.kind === "quote" &&
					!field.evidence.quotes.some((q) => quoteHasValue(name, value, q))
				) {
					problems.push(`${at}: no stored quote holds the value`)
				}
				if (field.status !== "accepted" || typeof value !== "string") continue
				if (name === "phone" && !fitsNumberPlan(value)) {
					problems.push(`${at}: not a number in the Nkom plan`)
				}
				if ((name === "openingHours" || name === "phoneHours") && value.length > MAX_HOURS) {
					problems.push(`${at}: longer than ${MAX_HOURS} characters`)
				}
			}
		}
	}
	return problems
}
