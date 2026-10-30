// Plain JavaScript so export-data.mjs and Vitest can both import it, as slug.mjs is. The place
// files in web/data give every kommune its kommunenummer and fylkesnummer (filter spec, Data
// contract). The export refuses to publish them unless this guard passes.
import { readFileSync } from "node:fs"
import { join } from "node:path"

export function readPlaceFiles(dir) {
	const read = (name) => JSON.parse(readFileSync(join(dir, name), "utf8"))
	return {
		places: read("places.json"),
		counties: read("counties.json"),
		aliases: read("aliases.json"),
	}
}

// Strictly rising numbers keep one catalog order for the URL and rule out duplicates too.
function checkRising(list, label, errors) {
	for (let i = 1; i < list.length; i++) {
		if (list[i - 1].number >= list[i].number) {
			errors.push(`${label(list[i])}: ${list[i].number} breaks the rising number order`)
		}
	}
}

export function checkPlaces(places, counties, aliases) {
	const errors = []
	for (const c of counties) {
		if (!/^\d{2}$/.test(c.number))
			errors.push(`fylke ${c.name}: number ${c.number} is not 2 digits`)
	}
	checkRising(counties, (c) => `fylke ${c.name}`, errors)
	const countyNumbers = new Set(counties.map((c) => c.number))
	const ids = new Set()
	for (const p of places) {
		if (!/^\d{4}$/.test(p.number)) {
			errors.push(`${p.name}: kommunenummer ${p.number} is not 4 digits`)
		} else if (p.number.slice(0, 2) !== p.countyNumber) {
			errors.push(`${p.name}: ${p.number} does not start with fylke ${p.countyNumber}`)
		}
		if (!countyNumbers.has(p.countyNumber)) {
			errors.push(`${p.name}: fylke ${p.countyNumber} is not in counties.json`)
		}
		if (ids.has(p.id)) errors.push(`${p.name}: id ${p.id} is used twice`)
		ids.add(p.id)
	}
	checkRising(places, (p) => p.name, errors)
	const numbers = new Set(places.map((p) => p.number))
	for (const a of aliases) {
		if (!numbers.has(a.number)) errors.push(`alias ${a.alias}: ${a.number} is not in places.json`)
		if (!a.source) errors.push(`alias ${a.alias}: no source`)
	}
	return errors
}

// The API knows kommuner by database id only. The numbers come from the place files, and a
// kommune they lack (or name differently) stops the export instead of shipping without a number.
export function attachNumbers(municipalities, places) {
	const byId = new Map(places.map((p) => [p.id, p]))
	return municipalities.map((m) => {
		const place = byId.get(m.id)
		if (!place) throw new Error(`places.json has no entry for municipality ${m.id} ${m.name}`)
		if (place.name !== m.name) {
			throw new Error(
				`places.json names municipality ${m.id} "${place.name}", the API says "${m.name}"`
			)
		}
		return { ...m, number: place.number, countyNumber: place.countyNumber }
	})
}
