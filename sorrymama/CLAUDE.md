# Sorry Mama — unofficial KERNØ concept (reborn build)

Single-page restaurant site for Sorry Mama rest-lounge, Kazan. Russian copy. Not affiliated with the venue.

## Commands
- `npm run dev` (port 5187 via `.claude/launch.json` → `sorrymama`)
- `npm run build` — `tsc -b && vite build`

## Sources of truth
- Full art direction: `docs/MASTER_SPEC.md` (read sections on demand, don't import whole).
- Photo choices, provenance, crops: `docs/ASSET_SELECTION.md` (copy also in research/).
- Facts: `src/data/venue.ts` (address/phone verified across map cards; hours unverified → not shown).
- Menu: `src/data/menu.ts`, transcribed from the 11 current cards of the venue's 2GIS «Меню» album (originals in `research/2gis/menu/`). Rendered on its own page `menu.html` (`src/menu/`). Never invent dishes or prices: a price cut off on the card stays `null` («цену уточняйте»). A dish photo is shown only when it unambiguously shows that dish; otherwise a typographic plate. Bar (`bar` in menu.ts): six alcohol-free cocktails from the 2024 board, set as type — no invented recipes.

## Non-negotiables
- Only real photos of this venue. No stretched 960px images as full-bleed desktop heroes.
- `research/` holds unlicensed map-gallery photos: private, gitignored, never deployed until rights are cleared.
- No link to `sorrymama-lounge.ru` (reported gambling redirect).
- Booking: popup (`[data-book]` opens `BookingDialog`) — guests, name, phone. `src/data/booking.ts` has no endpoint in the concept, so nothing is sent and the guest is told to call `tel:+78432033303`. Never show a confirmation for a request nobody received.
- Russian short words (в, с, к, у, о, и, а, на, по, за, из) never end a line in headings: use `nb()`.
- Hero: day terrace → blossoms occlude the huge `SORRY MAMA` → hidden cut → night lounge. A short scroll starts a self-running GSAP timeline (1.5 s); faster scrolling drives it, capped so a full run takes ≥1.1 s forward / ≥0.85 s back. Wheel inside the hero is owned from the first event of a gesture (never mid-gesture: the browser won't let you, and the leftover inertia caused jumps), halved, eased, and held at the track end until the night has landed. Touch/keys/scrollbar stay native. The photographs are painted into two canvases (sky behind the DOM wordmark, the rest in front), never moved as page layers: zoomed layers got tiled and showed black squares at the edges on the way back.
- Page order: Hero → Atmosphere → Menu → Terrace → Details → Booking → Contacts. Menu and Booking are header buttons of their own; never bury them.
- Fonts: Commissioner 800 with `--display-axes` (display: `.title-xl`, `.subhead`), Onest (UI). Titles flush left (no staggered lines), no chapter numbers or tag rows.
