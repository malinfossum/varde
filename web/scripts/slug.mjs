// Plain JavaScript so both scripts (export, prerender) and Vitest can import it without a
// build. The browser never slugifies: it reads kommuner.json.

export function slugify(name) {
	return name
		.toLowerCase()
		.replace(/æ/g, "ae")
		.replace(/ø/g, "oe")
		.replace(/å/g, "aa")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
}

export function kommunerWithPages(municipalities, resources) {
	const covered = new Set()
	for (const r of resources) {
		if (r.municipalityId !== null) covered.add(r.municipalityId)
		for (const id of r.servedMunicipalityIds) covered.add(id)
	}
	const taken = new Set()
	const out = []
	for (const m of [...municipalities].sort((a, b) => a.id - b.id)) {
		if (!covered.has(m.id)) continue
		let slug = slugify(m.name)
		if (taken.has(slug)) slug = `${slug}-${m.id}`
		taken.add(slug)
		out.push({ id: m.id, slug, name: m.name, county: m.county })
	}
	return out
}
