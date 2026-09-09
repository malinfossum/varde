import { useState } from "react"
import {
	Button,
	ComboBox,
	Group,
	Header,
	Input,
	Label,
	ListBox,
	ListBoxItem,
	ListBoxSection,
	Popover,
} from "react-aria-components"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { matchesEitherWay } from "../services/match.ts"
import type { MunicipalityDto } from "../types/api.ts"

const nbCollator = new Intl.Collator("nb")
const ALL = "all"

// react-aria-components ComboBox: keyboard, typeahead, group announcements and the popover
// come from the library; this file only decides what the options are. Filtering is ours so
// "lot" finds Løten (matchesEitherWay folds diacritics), which the built-in contains-filter
// would miss.
export function MunicipalityCombobox({
	municipalities,
	selectedId,
	onSelect,
	onNoMatchNational,
}: {
	municipalities: MunicipalityDto[]
	selectedId: number | null
	onSelect: (id: number | null) => void
	onNoMatchNational: () => void
}) {
	const t = useTranslation()
	const selectedName = municipalities.find((m) => m.id === selectedId)?.name ?? ""
	const [input, setInput] = useState(selectedName)

	// Passing inputValue makes the field ours to keep in sync: react-stately skips its own
	// reset paths whenever inputValue is defined, so nothing follows selectedId when it changes
	// from outside this component — and plenty of things change it while this component stays
	// mounted ("Nullstill", the national toggle, a municipality suggestion, EmptyState's clear
	// button, browser back/forward). Adjusting state during render is React's own pattern for
	// that, and I prefer it to keying the component: a remount would throw keyboard focus out
	// of the field right after a selection.
	const [syncedId, setSyncedId] = useState(selectedId)
	if (syncedId !== selectedId) {
		setSyncedId(selectedId)
		setInput(selectedName)
	}

	const visible = input.trim()
		? municipalities.filter((m) => matchesEitherWay(input, m.name))
		: municipalities
	const counties = [...new Set(visible.map((m) => m.county))].sort(nbCollator.compare)
	// "Alle kommuner" clears the filter, so it has to be there whenever someone wants to undo a
	// choice — and after a selection the input holds that municipality's name, which is exactly
	// when the old empty-input-only guard hid the row. Show it while the user is still browsing:
	// the field is empty, or it only says what is already selected. Once they type a real query
	// it drops out of the way.
	const browsing = input.trim() === "" || input === selectedName

	return (
		<ComboBox
			className="grid gap-1"
			menuTrigger="focus"
			allowsEmptyCollection
			// `items` is how I tell ComboBox that the list it is given is already filtered — it is
			// the prop react-aria checks before doing any filtering of its own, so `visible` stays
			// the single source of truth for what's rendered. It also keeps the collection built
			// from one set of node objects: without it, react-aria swaps its section nodes for
			// plain clones the moment you type, and React 19.2's development-only render logger
			// walks that diff straight into a `childNodes` getter that throws on purpose. The
			// exception escapes React's commit and every later render is dropped, so the input
			// text freezes and the popover never closes — in `npm run dev` only, never in a
			// production build. defaultFilter stays as a pass-through in case a future version
			// stops honouring `items`: ComboBox's own filter uses a collator that doesn't fold
			// ø/æ the way matchesEitherWay does, and would drop matches we just decided to keep.
			items={visible}
			defaultFilter={() => true}
			inputValue={input}
			onInputChange={setInput}
			selectedKey={selectedId ?? ALL}
			onSelectionChange={(key) => {
				if (key === null) return
				const next = key === ALL ? null : Number(key)
				setInput(next === null ? "" : (municipalities.find((m) => m.id === next)?.name ?? ""))
				onSelect(next)
			}}
		>
			<Label className="text-sm font-semibold">{t("filter.municipality")}</Label>
			{/* react-aria's ComboBox hides everything outside [input, popover] while the listbox
			    is open (menuTrigger="focus" means that's whenever this field has focus) — a plain
			    wrapper here would aria-hide Clear and the toggle even though they sit right next
			    to the input. data-react-aria-top-layer is react-aria's own escape hatch for
			    exactly this (the same one it uses to keep toasts reachable over a modal); there is
			    no public prop for it on ComboBox in this version. Verified against
			    react-aria's ariaHideOutside source (node_modules/react-aria/dist/private/overlays/ariaHideOutside.mjs) — it
			    scans for this attribute before hiding anything. */}
			<Group
				role="presentation"
				data-react-aria-top-layer=""
				className="flex items-center rounded-xl border border-border bg-surface"
			>
				<Input className="min-h-11 flex-1 bg-transparent px-3 text-fg outline-none" />
				{input && (
					<Button
						slot={null}
						className="min-h-11 px-3 text-muted"
						onPress={() => {
							setInput("")
							onSelect(null)
						}}
					>
						{t("filter.clear")}
					</Button>
				)}
				<Button className="min-h-11 min-w-11 text-muted" aria-label={t("filter.toggleList")}>
					▾
				</Button>
			</Group>
			<Popover className="max-h-72 w-[var(--trigger-width)] overflow-auto rounded-xl border border-border bg-surface p-1 shadow-lg">
				<ListBox
					renderEmptyState={() => (
						<p className="p-3 text-sm text-muted">
							{t("filter.noMatch")}{" "}
							<Button className="underline" onPress={onNoMatchNational}>
								{t("filter.noMatchLink")}
							</Button>
						</p>
					)}
				>
					{browsing && (
						<ListBoxItem
							id={ALL}
							className="cursor-pointer rounded-lg px-3 py-2 data-[focused]:bg-accent-soft data-[selected]:font-semibold"
						>
							{t("filter.all")}
						</ListBoxItem>
					)}
					{counties.map((county) => (
						<ListBoxSection key={county} id={county}>
							<Header className="px-3 pt-2 text-xs uppercase tracking-wide text-muted">
								{county}
							</Header>
							{visible
								.filter((m) => m.county === county)
								.sort((a, b) => nbCollator.compare(a.name, b.name))
								.map((m) => (
									<ListBoxItem
										key={m.id}
										id={m.id}
										textValue={m.name}
										className="cursor-pointer rounded-lg px-3 py-2 data-[focused]:bg-accent-soft data-[selected]:font-semibold"
									>
										{m.name}
									</ListBoxItem>
								))}
						</ListBoxSection>
					))}
				</ListBox>
			</Popover>
		</ComboBox>
	)
}
