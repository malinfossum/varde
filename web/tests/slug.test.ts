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
	const municipalities = [
		{ id: 3, name: "Våler", county: "Innlandet" },
		{ id: 1, name: "Hamar", county: "Innlandet" },
		{ id: 2, name: "Våler", county: "Østfold" },
		{ id: 4, name: "Tom", county: "Innlandet" },
	]
	const resources = [
		{ id: 10, municipalityId: 1, servedMunicipalityIds: [3] },
		{ id: 11, municipalityId: null, servedMunicipalityIds: [2] },
	]
	expect(kommunerWithPages(municipalities, resources)).toEqual([
		{ id: 1, slug: "hamar", name: "Hamar", county: "Innlandet" },
		{ id: 2, slug: "vaaler", name: "Våler", county: "Østfold" },
		{ id: 3, slug: "vaaler-3", name: "Våler", county: "Innlandet" },
	])
})
