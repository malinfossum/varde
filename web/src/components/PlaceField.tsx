import { useMemo, useRef, useState } from "react"
import {
	Button,
	ComboBox,
	ComboBoxValue,
	Group,
	Header,
	Input,
	Label,
	ListBox,
	ListBoxItem,
	ListBoxSection,
	Popover,
	TagGroup,
	TagList,
} from "react-aria-components"
import { useChipFocus } from "../hooks/useChipFocus.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import type { Catalog } from "../services/data.ts"
import type { Filters } from "../services/filters.ts"
import {
	type PlaceOption,
	placeLabel,
	placeOptions,
	placePatch,
	selectedPlaceKeys,
} from "../services/placeOptions.ts"
import { FilterChip } from "./FilterChip.tsx"
import { CheckIcon } from "./icons.tsx"

function PlaceItem({ option }: { option: PlaceOption }) {
	return (
		<ListBoxItem id={option.key} textValue={option.label} className="place-option">
			{({ isSelected }) => (
				<>
					<span>{option.label}</span>
					{isSelected && <CheckIcon className="place-check" />}
				</>
			)}
		</ListBoxItem>
	)
}

// Focusing the field while it is off-screen (Tab back up from far down the page, or the field
// low on a phone at 200 % text) makes the browser scroll it into view. The page moves at once,
// but its scroll event comes on the next frame, after focus has opened the list, and react-aria
// closes an open combobox list on any scroll of the page around it. So for that one frame I stop
// the page's scroll event before react-aria sees it. Any scroll after that still closes the list,
// as react-aria means it to. Found by the e2e at 375 px and 200 % text on 09.11.2026.
function keepListOpenThroughFocusScroll(): void {
	const swallow = (event: Event) => {
		if (event.target === document) event.stopImmediatePropagation()
	}
	window.addEventListener("scroll", swallow, true)
	requestAnimationFrame(() => window.removeEventListener("scroll", swallow, true))
}

// The Sted field (filter spec, PlaceBar): one react-aria ComboBox in multiple mode for fylker and
// kommuner. Keyboard, typeahead, group announcements and the popover come from the library; this
// file decides what the options are. Picks show as chips inside the field, and the list stays
// open after a pick, which multiple mode does by itself.
export function PlaceField({
	catalog,
	withRows,
	filters,
	onPatch,
}: {
	catalog: Catalog
	withRows: ReadonlySet<number> | null
	filters: Filters
	onPatch: (patch: Partial<Filters>) => void
}) {
	const t = useTranslation()
	const inputRef = useRef<HTMLInputElement>(null)
	// What is typed, for my own matching. The field itself stays uncontrolled: with inputValue
	// left to react-stately, multiple mode clears the text after every pick and on blur by
	// itself. Passing inputValue would make both of those mine, the trap the old single combobox
	// documented, and typed text that was never picked could linger looking like a filter.
	const [input, setInput] = useState("")
	const picked = selectedPlaceKeys(filters)
	// The picks are the URL's, never this field's own memory, so Back, Forward and every outside
	// change show at once. One string keeps the array's identity stable between renders:
	// react-stately compares `value` by reference, and a new array on every keystroke would read
	// as a new pick and wipe the text being typed.
	const pickedKey = picked.join(" ")
	const value = useMemo(() => (pickedKey ? pickedKey.split(" ") : []), [pickedKey])
	const options = placeOptions(catalog, withRows, input)
	const { listRef, removing } = useChipFocus(picked.length, () => inputRef.current?.focus())
	const remove = (key: string) => {
		removing(picked.indexOf(key))
		onPatch(placePatch(picked.filter((k) => k !== key)))
	}

	return (
		<ComboBox
			className="place-field"
			selectionMode="multiple"
			menuTrigger="focus"
			allowsEmptyCollection
			// `items` is how I tell ComboBox that the list it is given is already filtered: it is
			// the prop react-aria checks before doing any filtering of its own, so `options` stays
			// the single source of truth for what is rendered. It also keeps the collection built
			// from one set of node objects: without it, react-aria swaps its section nodes for
			// plain clones the moment you type, and React 19.2's development-only render logger
			// walks that diff into a `childNodes` getter that throws on purpose, which froze the
			// old combobox in `npm run dev` only. defaultFilter stays as a pass-through in case a
			// future version stops honouring `items`: ComboBox's own filter does not fold ø and æ
			// the way matchesEitherWay does, and would drop matches I just decided to keep.
			items={[...options.counties, ...options.municipalities]}
			defaultFilter={() => true}
			value={value}
			onChange={(keys) => onPatch(placePatch(keys.map(String)))}
			onInputChange={setInput}
		>
			{({ isOpen }) => (
				<>
					<Label className="field-label">{t("filter.place")}</Label>
					{/* react-aria's ComboBox hides everything outside [input, popover] while the list
					    is open, and menuTrigger="focus" means that is whenever the field has focus, so
					    a plain wrapper here would hide the chips next to the input.
					    data-react-aria-top-layer is react-aria's own escape hatch for this (there is
					    no public prop for it on ComboBox in this version; ariaHideOutside.mjs scans for
					    it before hiding anything). Only while the list is open: every later
					    ariaHideOutside honours it too, and left on it would keep the whole Sted field
					    and its <main> reachable behind the filter dialog's modal. */}
					<Group
						role="presentation"
						data-react-aria-top-layer={isOpen ? "" : undefined}
						className="place-group"
					>
						{/* ComboBoxValue is the slot react-aria gives a multi-pick field for its picks.
						    It is left out of the ComboBox's own collection pass, so the chips' Tag
						    nodes never land in the option list: a TagGroup placed here directly
						    throws "Duplicate key county:34 found in collection". */}
						<ComboBoxValue className="contents">
							{() =>
								picked.length > 0 && (
									<TagGroup
										aria-label={t("filter.place")}
										className="contents"
										onRemove={(keys) => {
											const [key] = [...keys]
											if (key !== undefined) remove(String(key))
										}}
									>
										<TagList ref={listRef} className="flex max-w-full flex-wrap gap-1">
											{picked.map((key) => (
												<FilterChip key={key} id={key} label={placeLabel(catalog, key) ?? key} />
											))}
										</TagList>
									</TagGroup>
								)
							}
						</ComboBoxValue>
						<Input
							ref={inputRef}
							onFocus={keepListOpenThroughFocusScroll}
							placeholder={t("filter.placePlaceholder")}
							className="place-input"
						/>
					</Group>
					<Popover className="max-h-72 w-[var(--trigger-width)] overflow-auto rounded-xl border border-border bg-surface p-1 shadow-lg">
						<ListBox
							renderEmptyState={() => (
								<p className="p-3 text-sm text-muted">
									{t("filter.noMatch")}{" "}
									{/* slot={null}: this button is not the ComboBox's own trigger button. */}
									<Button
										slot={null}
										className="underline"
										onPress={() => onPatch({ national: "only" })}
									>
										{t("filter.noMatchLink")}
									</Button>
								</p>
							)}
						>
							{options.counties.length > 0 && (
								<ListBoxSection id="counties">
									<Header className="px-3 pt-2 text-xs uppercase tracking-wide text-muted">
										{t("filter.counties")}
									</Header>
									{options.counties.map((option) => (
										<PlaceItem key={option.key} option={option} />
									))}
								</ListBoxSection>
							)}
							{options.municipalities.length > 0 && (
								<ListBoxSection id="municipalities">
									<Header className="px-3 pt-2 text-xs uppercase tracking-wide text-muted">
										{t("filter.municipalities")}
									</Header>
									{options.municipalities.map((option) => (
										<PlaceItem key={option.key} option={option} />
									))}
								</ListBoxSection>
							)}
						</ListBox>
					</Popover>
				</>
			)}
		</ComboBox>
	)
}
