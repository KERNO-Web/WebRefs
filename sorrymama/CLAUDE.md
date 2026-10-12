# Sorry Mama — unofficial KERNØ concept (reborn build)

Single-page restaurant site for Sorry Mama rest-lounge, Kazan. Russian copy. Not affiliated with the venue.

## Commands
- `npm run dev` (port 5187 via `.claude/launch.json` → `sorrymama`)
- `npm run build` — `tsc -b && vite build`

## Sources of truth
- Full art direction: `docs/MASTER_SPEC.md` (read sections on demand, don't import whole).
- Photo choices, provenance, crops: `docs/ASSET_SELECTION.md` (copy also in research/).
- Facts: `src/data/venue.ts` (address/phone verified across map cards; hours unverified → not shown).
- Menu: `src/data/menu.ts` — empty until the owner supplies the real menu. Never invent dishes or prices.

## Non-negotiables
- Only real photos of this venue. No stretched 960px images as full-bleed desktop heroes.
- `research/` holds unlicensed map-gallery photos: private, gitignored, never deployed until rights are cleared.
- No link to `sorrymama-lounge.ru` (reported gambling redirect).
- Booking: popup (`[data-book]` opens `BookingDialog`) — guests, name, phone. `src/data/booking.ts` has no endpoint in the concept, so nothing is sent and the guest is told to call `tel:+78432033303`. Never show a confirmation for a request nobody received.
- Russian short words (в, с, к, у, о, и, а, на, по, за, из) never end a line in headings: use `nb()`.
- Hero: day terrace → blossoms occlude the huge `SORRY MAMA` → hidden cut → night lounge. ~10% of a screen of scroll starts a self-running GSAP timeline (1.5 s); scrolling faster drives it faster; the same distance back rewinds it. Script never blocks or sets the page scroll (that caused jumps under trackpad inertia). Layers leave the frame at opacity 0.001, never 0 or visibility:hidden (dropped rasters flickered on the way back). Transforms/opacity only.
- Page order: Hero → Atmosphere → Menu → Terrace → Details → Booking → Contacts. Menu and Booking are header buttons of their own; never bury them.
- Fonts: Commissioner 800 with `--display-axes` (display: `.title-xl`, `.subhead`), Onest (UI). Titles flush left (no staggered lines), no chapter numbers or tag rows.
