// Sibling declaration for brand-geometry.mjs. This project carries no allowJs/@types/node, so
// a plain .mjs import has no type on its own. tests/brand.test.ts and tests/brandMark.test.tsx
// are the only TS consumers.
export declare const FONTS: { display: string; body: string }
export declare const FONT_FILES: string[]
export type Point = [number, number]
export type Stone = [yT: number, yB: number, w: number]
export type RingPoints = { mountain: string; stones: string[] }
export type Geometry = { stack?: Stone[]; mountain?: Point[]; f?: number; k?: number }
export declare const SUMMIT: number
export declare const MOUNTAIN: Point[]
export declare const C1: { f: number; k: number }
export declare const RING: { cx: number; cy: number; r: number; strokeWidth: number }
export declare const CLIP_R: number
export declare const FJORD_LINES: { y: number; strokeWidth: number }[]
export declare function fmt(n: number): string
export declare function pointList(points: Point[]): string
export declare function stackC(): Stone[]
export declare function sized(stack: Stone[], f: number, k: number, base: number): Stone[]
export declare function stonePoints(cx: number, yT: number, yB: number, w: number): Point[]
export declare function aboutBase(f: number, base: number): (p: Point) => Point
export declare function ringMarkPoints(geometry?: Geometry): RingPoints
export declare function ringMark(
	ink: string,
	options?: { idPrefix?: string; points?: RingPoints }
): string
export declare function svgDoc(width: number, height: number, body: string): string
export type Colors = {
	accent: string
	ground: string
	text: string
	muted: string
	tint1: string
	tint2: string
}
export type Placement = { s: number; tx: number; ty: number }
export declare const SCENE_PLACEMENT: Placement
export declare function mix(a: string, b: string, t: number): string
export declare function brandColors(tokens: Record<string, string>): Colors
export declare function scene(ink: string, placement?: Placement): string
export declare function maskablePlacement(): Placement
export declare function medallion(colors: Colors, points?: RingPoints): string
export declare function plateIcon(colors: Colors, placement?: Placement): string
export type Layout = {
	width: number
	height: number
	land: number
	text: { x: number; y: number; scale: number }
}
export declare const LAYOUTS: { banner: Layout; og: Layout; social: Layout }
export declare function landscapeCard(colors: Colors, layout: Layout): string
export type Themes = { light: Record<string, string>; dark: Record<string, string> }
export declare const SRC: string
export declare const PNG_TARGETS: [master: string, out: string, width: number][]
export declare const ICO: { master: string; out: string; size: number }
export declare function faviconStyle(light: string, dark: string): string
export declare function faviconSvg(light: string, dark: string, points?: RingPoints): string
export declare function brandPathsTs(points: RingPoints): string
export declare function masters(themes: Themes, geometry?: Geometry): Record<string, string>
