import { expect, test } from "vitest"
import { loadRows } from "../src/services/rows.ts"
import { rows } from "./filterFixture.ts"

test("loadRows hands back every row while all rows live in one file", () => {
	expect(loadRows({ resources: rows }, { counties: ["34"], municipalities: [] })).toBe(rows)
})
