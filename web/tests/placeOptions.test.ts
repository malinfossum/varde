import { describe, expect, test } from "vitest"
import type { Catalog } from "../src/services/data.ts"
import {
	kommunerWithRows,
	placeLabel,
	placeOptions,
	placePatch,
	selectedPlaceKeys,
} from "../src/services/placeOptions.ts"
import type { MunicipalityDto } from "../src/types/api.ts"
import { rows } from "./filterFixture.ts"

const kommune = (id: number, name: string, county: string, number: string): MunicipalityDto => ({
	id,
	name,
	county,
	number,
	countyNumber: number.slice(0, 2),
})

// Hamar, Løten, Ringsaker and Oslo carry their KLASS numbers from the spec. The two Våler rows
// are a made-up duplicate name: 3499 and 3199 are not real kommunenummer, only the fylke prefix
// is real.
const hamar = kommune(1, "Hamar", "Innlandet", "3403")
const loten = kommune(6, "Løten", "Innlandet", "3412")
const ringsaker = kommune(4, "Ringsaker", "Innlandet", "3411")
const oslo = kommune(8, "Oslo", "Oslo", "0301")
const valerInnlandet = kommune(98, "Våler", "Innlandet", "3499")
const valerOstfold = kommune(99, "Våler", "Østfold", "3199")

const catalog: Pick<Catalog, "municipalities" | "counties" | "aliases"> = {
	municipalities: [oslo, valerOstfold, hamar, ringsaker, loten, valerInnlandet],
	counties: [
		{ number: "03", name: "Oslo" },
		{ number: "31", name: "Østfold" },
		{ number: "34", name: "Innlandet" },
	],
	// A made-up alias row for the test. aliases.json ships empty.
	aliases: [{ alias: "Brumunddal", number: "3411", source: "test fixture" }],
}
const all = new Set([1, 4, 6, 8, 98, 99])
const labels = (options: { label: string }[]) => options.map((o) => o.label)

describe("placeOptions", () => {
	test.each<[string, string, ReadonlySet<number> | null, string[], string[]]>([
		[
			"an empty field lists every place with rows, fylker first, Oslo once as the kommune",
			"",
			all,
			["Innlandet", "Østfold"],
			["Hamar", "Løten", "Oslo", "Ringsaker", "Våler (Innlandet)", "Våler (Østfold)"],
		],
		[
			"with the rows not known yet, every catalog kommune is offered",
			"",
			null,
			["Innlandet", "Østfold"],
			["Hamar", "Løten", "Oslo", "Ringsaker", "Våler (Innlandet)", "Våler (Østfold)"],
		],
		[
			"a kommune without rows is left out, and keeps its fylke label on the other Våler",
			"",
			new Set([1, 4, 8, 98, 99]),
			["Innlandet", "Østfold"],
			["Hamar", "Oslo", "Ringsaker", "Våler (Innlandet)", "Våler (Østfold)"],
		],
		[
			"a fylke whose kommuner have no rows is left out",
			"",
			new Set([1, 4, 6, 8, 98]),
			["Innlandet"],
			["Hamar", "Løten", "Oslo", "Ringsaker", "Våler (Innlandet)"],
		],
		["matching folds ø both ways: lot finds Løten", "lot", all, [], ["Løten"]],
		["a typed fylke name finds the fylke", "innl", all, ["Innlandet"], []],
		["Oslo is offered once, as the kommune", "oslo", all, [], ["Oslo"]],
		[
			"a shared name lists both, each with its fylke",
			"valer",
			all,
			[],
			["Våler (Innlandet)", "Våler (Østfold)"],
		],
		["one letter never offers an alias", "b", all, [], []],
		[
			"two letters offer the alias, labelled with its kommune",
			"br",
			all,
			[],
			["Ringsaker (Brumunddal)"],
		],
		[
			"an alias for a kommune without rows is not offered",
			"brum",
			new Set([1, 6, 8, 98, 99]),
			[],
			[],
		],
	])("%s", (_name, input, withRows, counties, municipalities) => {
		const options = placeOptions(catalog, withRows, input)
		expect(labels(options.counties)).toEqual(counties)
		expect(labels(options.municipalities)).toEqual(municipalities)
	})

	test("keys carry the kind and the number, and an alias key carries its kommune", () => {
		expect(placeOptions(catalog, all, "brum").municipalities.map((o) => o.key)).toEqual([
			"alias:3411:Brumunddal",
		])
		expect(placeOptions(catalog, all, "hamar").municipalities.map((o) => o.key)).toEqual([
			"municipality:3403",
		])
		expect(placeOptions(catalog, all, "innlandet").counties.map((o) => o.key)).toEqual([
			"county:34",
		])
	})

	test("the nb collator sorts Æ, Ø and Å after Z, as Norwegian does", () => {
		// Made-up kommunenummer in fylke 46; only the prefix is real. An English collator would put
		// Ærøy and Åsane before Bergen.
		const vestland = {
			municipalities: [
				kommune(1, "Åsane", "Vestland", "4698"),
				kommune(2, "Bergen", "Vestland", "4699"),
				kommune(3, "Ærøy", "Vestland", "4697"),
			],
			counties: [{ number: "46", name: "Vestland" }],
			aliases: [],
		}
		expect(labels(placeOptions(vestland, null, "").municipalities)).toEqual([
			"Bergen",
			"Ærøy",
			"Åsane",
		])
	})
})

describe("kommunerWithRows", () => {
	test("collects every kommune a row is located in or serves", () => {
		expect([...kommunerWithRows(rows)].sort((a, b) => a - b)).toEqual([1, 4, 8])
	})
})

describe("picks", () => {
	test("selectedPlaceKeys lists fylker, then kommuner", () => {
		expect(selectedPlaceKeys({ counties: ["34"], municipalities: ["0301", "3403"] })).toEqual([
			"county:34",
			"municipality:0301",
			"municipality:3403",
		])
	})

	test("placePatch turns keys back into numbers, and an alias into its kommune", () => {
		expect(placePatch(["county:34", "municipality:0301", "alias:3411:Brumunddal"])).toEqual({
			counties: ["34"],
			municipalities: ["0301", "3411"],
		})
		expect(placePatch([])).toEqual({ counties: [], municipalities: [] })
	})

	test("placeLabel names a picked place, with its fylke when the name is shared", () => {
		expect(placeLabel(catalog, "county:34")).toBe("Innlandet")
		expect(placeLabel(catalog, "county:03")).toBe("Oslo")
		expect(placeLabel(catalog, "municipality:3403")).toBe("Hamar")
		expect(placeLabel(catalog, "municipality:3199")).toBe("Våler (Østfold)")
		expect(placeLabel(catalog, "municipality:9999")).toBeNull()
	})
})
