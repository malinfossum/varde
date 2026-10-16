import { useTranslation } from "../i18n/LanguageProvider.tsx"
import type { ContactTile } from "../services/contactTiles.ts"
import { ChatIcon, PhoneIcon } from "./icons.tsx"

// The detail page's contact block (spec C2a). The whole tile is one link, and its name is the
// visible text in reading order, so voice control works with what is on screen. The " · " is
// hidden from screen readers and a hidden comma stands in, so NVDA reads "Ring, døgnåpen, 116 123"
// and not "Ring dot døgnåpen". The hidden h2 puts the block in the heading list.
export function ContactTiles({ tiles }: { tiles: ContactTile[] }) {
	const t = useTranslation()
	if (tiles.length === 0) return null
	return (
		<section aria-labelledby="contact">
			<h2 id="contact" className="visually-hidden">
				{t("detail.contactHeading")}
			</h2>
			<ul className="grid auto-rows-fr gap-3 md:grid-cols-2">
				{tiles.map((tile) => (
					<li key={tile.key}>
						<a
							href={tile.href}
							className="contact-tile"
							rel={tile.kind === "chat" ? "noopener noreferrer" : undefined}
						>
							<span className="contact-tile-icon">
								{tile.kind === "phone" ? <PhoneIcon /> : <ChatIcon />}
							</span>
							<span className="grid min-w-0">
								<span className="contact-tile-label block text-sm text-muted">
									{tile.name ?? t(tile.kind === "phone" ? "card.call" : "detail.chat")}
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
									{tile.kind === "chat"
										? t("detail.tile.openChat")
										: tile.menuOption === null
											? tile.phone
											: `${tile.phone}, ${t("detail.tile.menuOption").replace("{n}", String(tile.menuOption))}`}
								</span>
							</span>
						</a>
					</li>
				))}
			</ul>
		</section>
	)
}
