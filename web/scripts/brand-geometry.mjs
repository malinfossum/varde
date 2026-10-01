// web/scripts/brand-geometry.mjs
// The Varde mark, once. Every drawing in the brand pack comes from the C1 numbers in
// docs/superpowers/specs/2026-10-01-varde-brand-design.md. Pure: colours come in as arguments
// and nothing touches the disk, so tests call it directly. scripts/brand.mjs writes the output
// and renders the PNGs.

// Family names exactly as the bundled TTFs declare them (docs/brand/fonts/SOURCE.md). resvg
// loads no system fonts and quietly falls back to the first font loaded when a name does not
// match, so a wrong name here renders the wrong face (tests/brand.test.ts catches it).
export const FONTS = { display: "Fraunces 9pt", body: "Figtree" }

// Repo-relative, so the build script and the tests resolve them from the same root.
export const FONT_FILES = [
	"docs/brand/fonts/Fraunces-SemiBold.ttf",
	"docs/brand/fonts/Figtree-SemiBold.ttf",
]
