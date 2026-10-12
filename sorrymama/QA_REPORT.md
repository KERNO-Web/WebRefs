# QA report — Sorry Mama reborn (13.10.2026)

Run: `npm run dev` → http://localhost:5187 (Playwright, Chromium). Screenshots in `screenshots/` (gitignored).

## Gates
| gate | status | evidence |
|---|---|---|
| A asset reality | **PARTIAL** | 713-photo 2GIS gallery screened, 12 originals; best = 1440×1920 portrait, no ≥2000 px landscape. `research/ASSET_SELECTION.md` |
| B static stills | PASS | desktop-p0.00 / p0.54 / p1.00, mobile-p0.00 |
| C motion | PASS (one note) | desktop/mobile p0.00 p0.18 p0.38 p0.54 p0.78 p1.00; scroll-*-forward-reverse.mp4 |
| D whole site | PASS | atmosphere, terrace, menu (2GIS link, empty data model), gallery + lightbox, contacts, footer |
| E QA | PASS | below |

## Acceptance list
| requirement | result |
|---|---|
| F0 sakura + real terrace, not flower-only or cobalt sky | PASS |
| `SORRY MAMA` huge, partly behind real blossoms, legible | PASS (last `A` weaves behind the crown) |
| No stretched 960 px hero | PASS at 1440 (1:1); **NOT retina-grade**, 1.33× at 1920 |
| Mid-scroll cover, no grey wash, no trunk morph, no opacity-only title removal | PASS (title covered first, fades at p .37+) |
| Night frame shows architecture and warm light, no plum void | PASS |
| Night continues into Atmosphere | PASS (same photograph continues below the stage) |
| Distinct terrace chapter, real menu path | PASS |
| `Забронировать` real action | PASS → `tel:+78432033303` everywhere |
| Contacts checked, no fake flows, no gambling link | PASS (no sorrymama-lounge.ru) |
| Mobile 390×844: venue + brand + CTA in first view | PASS |
| No fake quotes / prices / dishes / affiliation | PASS (footer states unofficial, rights not cleared) |
| Screenshots, mobile, both-direction recording, this report | PASS |

## Measured
- Horizontal overflow: 0 px at 360, 390, 768, 1024, 1366, 1440, 1920.
- Broken images: 0 (desktop, mobile). Console errors: 0.
- Scrub frame time 1440×900: median 16.5 ms, p95 17.8 ms.
- Recording: max frame-to-frame brightness step 3.5/255, round trip returns to the identical first frame.
- Header tone: day at p0 → night at p1 → night over Atmosphere/contacts, day over terrace/menu.
- Mobile menu: opens with scroll lock, Escape closes, focus returns to toggle, anchor click closes and lands on section.
- Lightbox: opens, Escape closes, focus returns to the thumbnail.
- Reduced motion: stage unpinned, day and night shown as two stills.
- Links: `#atmosphere #terrace #menu #contacts #top #main`, `tel:+78432033303`, Yandex Maps org 169351776272, 2GIS firm 70000001034900657 (+ /tab/menu).

## Open issues
1. Retina sharpness of both masters (source limit, see Gate A).
2. p .18–.38: the lounge's lit petals over daylight read slightly collaged; a daylit blossom close-up from the terrace would make the curtain seamless.
3. Opening hours not shown (sources disagree). Phone repeated across cards; re-check before any public launch.
4. Not tested on real Safari/iOS (Chromium only).
