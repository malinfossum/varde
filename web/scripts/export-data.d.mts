// Sibling declaration for export-data.mjs — this project carries no allowJs/@types/node, so a
// plain .mjs import has no type on its own. tests/exportData.test.ts is the only TS consumer.
export type ExportDataOptions = {
	baseUrl: string
	outDir: string
	fetchImpl?: typeof fetch
	log?: (message: string) => void
}
export type ExportDataResult = { resources: { nb: number; en: number }; kommuner: number }

export declare const MIN_RESOURCES: number
export declare function exportData(options: ExportDataOptions): Promise<ExportDataResult>
