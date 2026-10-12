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
- Booking = verified phone `tel:+78432033303`; no fake confirmations, no data collection.
- Russian short words (в, с, к, у, о, и, а, на, по, за, из) never end a line in headings: use `nb()`.
- Hero: day terrace → blossoms occlude the huge `SORRY MAMA` → hidden cut → night lounge. GSAP ScrollTrigger, transforms/opacity only, fully reversible.
- Fonts: Unbounded (display), Onest (UI).
