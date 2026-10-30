import { expect, test } from "vitest"
import { kommunerWithPages, slugify } from "../scripts/slug.mjs"

test("slugify folds æøå and collapses punctuation", () => {
	expect(slugify("Gjøvik")).toBe("gjoevik")
	expect(slugify("Våler")).toBe("vaaler")
	expect(slugify("Nord-Fron")).toBe("nord-fron")
	expect(slugify("Sør-Odal kommune")).toBe("soer-odal-kommune")
	expect(slugify("Øyer")).toBe("oeyer")
	expect(slugify("Ålesund")).toBe("aalesund")
	expect(slugify("Åmot")).toBe("aamot")
})

test("only kommuner with an own or served resource get a page, in id order, collisions suffixed", () => {
	// Våler and Tom numbers are made up for this test, with the right fylke prefix.
	const municipalities = [
		{ id: 3, name: "Våler", county: "Innlandet", number: "3498", countyNumber: "34" },
		{ id: 1, name: "Hamar", county: "Innlandet", number: "3403", countyNumber: "34" },
		{ id: 2, name: "Våler", county: "Østfold", number: "3098", countyNumber: "30" },
		{ id: 4, name: "Tom", county: "Innlandet", number: "3499", countyNumber: "34" },
	]
	const resources = [
		{ id: 10, municipalityId: 1, servedMunicipalityIds: [3] },
		{ id: 11, municipalityId: null, servedMunicipalityIds: [2] },
	]
	expect(kommunerWithPages(municipalities, resources)).toEqual([
		{ id: 1, slug: "hamar", name: "Hamar", county: "Innlandet", number: "3403" },
		{ id: 2, slug: "vaaler", name: "Våler", county: "Østfold", number: "3098" },
		{ id: 3, slug: "vaaler-3", name: "Våler", county: "Innlandet", number: "3498" },
	])
})
