import { useTranslation } from "../i18n/LanguageProvider.tsx"
import type { ContactTile } from "../services/contactTiles.ts"
import { ChatIcon, MailIcon, PhoneIcon } from "./icons.tsx"

type Translate = ReturnType<typeof useTranslation>

const icons = { phone: PhoneIcon, chat: ChatIcon, email: MailIcon } as const

function tileLabel(tile: ContactTile, t: Translate): string {
	if (tile.kind === "email") return t("detail.email")
	return tile.name ?? t(tile.kind === "phone" ? "card.call" : "detail.chat")
}

function tileValue(tile: ContactTile, t: Translate): string {
	if (tile.kind === "email") return tile.address
	if (tile.kind === "chat") return t("detail.tile.openChat")
	return tile.menuOption === null
		? tile.phone
		: `${tile.phone}, ${t("detail.tile.menuOption").replace("{n}", String(tile.menuOption))}`
}

// The detail page's contact block (spec C2a). The whole tile is one link, and its name is the
// visible text in reading order, so voice control works with what is on screen. The " · " is
// hidden from screen readers and a hidden comma stands in, so NVDA reads "Ring, døgnåpen, 116 123"
// and not "Ring dot døgnåpen". The h2 is a visible label and puts the block in the heading list.
export function ContactTiles({ tiles }: { tiles: ContactTile[] }) {
	const t = useTranslation()
	if (tiles.length === 0) return null
	return (
		<section aria-labelledby="contact" className="detail-section grid gap-3">
			<h2 id="contact" className="section-label">
				{t("detail.contactHeading")}
			</h2>
			{/* One column below 768 px, each tile as tall as its own content. Side by side from
			    768 px, where a row shares one height. */}
			<ul
				// biome-ignore lint/a11y/noRedundantRoles: VoiceOver drops it when list-style is none
				role="list"
				className="grid gap-3 md:auto-rows-fr md:grid-cols-2"
			>
				{tiles.map((tile) => {
					const Icon = icons[tile.kind]
					return (
						<li key={tile.key}>
							<a
								href={tile.href}
								className="contact-tile"
								rel={tile.kind === "chat" ? "noopener noreferrer" : undefined}
							>
								<span className="contact-tile-icon">
									<Icon />
								</span>
								<span className="grid min-w-0">
									<span className="contact-tile-label block text-sm text-muted">
										{tileLabel(tile, t)}
										{tile.kind === "phone" && tile.alwaysOpen && (
											<>
												<span className="hidden-inline">,</span> <span aria-hidden="true">·</span>{" "}
												{t("detail.tile.alwaysOpen")}
											</>
										)}
										<span className="hidden-inline">,</span>
									</span>
									{/* A real space between the lines: name computation trims each span, so without it
									    the label's comma runs into the value. */}{" "}
									<span className="contact-tile-value block font-semibold">
										{tileValue(tile, t)}
									</span>
								</span>
							</a>
						</li>
					)
				})}
			</ul>
		</section>
	)
}
