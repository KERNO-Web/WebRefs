# Asset selection — Sorry Mama reborn (13.10.2026)

**HERO_ASSET_GATE: PARTIAL.** Real venue originals found (1440×1920, sharp 1:1 on a 1440 desktop), but no landscape master ≥2000 px exists in the public gallery. Retina (2×) and 1920 px screens still upscale. Final cinematic acceptance needs owner originals.

## Source
2GIS public gallery of firm `70000001034900657` (https://2gis.ru/kazan/firm/70000001034900657/tab/photos): 713 photos listed on 13.10.2026. Previews (328×170) for all 713 and 12 originals downloaded with the owner's approval; files in `research/2gis/` (private, gitignored). Photos are guest uploads, photographer unknown. **Rights: NOT cleared.** `approved_for_publication: no` for every file. 2GIS corner marks are cropped off the bottom edge; provenance is kept here.

## Selected (manifest)
| role | file in public/assets/venue | 2GIS idx | original | used crop | source URL (+`.jpg`) |
|---|---|---|---|---|---|
| day master | terrace-master.webp | 097 | 1440×1920 | 1440×1820 top; desktop band focus (1000,760) | i1.photo.2gis.com/photo-gallery/1f029678-73c2-433a-8420-6107b338e941 |
| crown matte (alpha) | terrace-crown-alpha.webp | 097 | — | region x690 y480 660×680, petals+branches keyed, gaps closed | same |
| night master | lounge-master.webp | 085 | 1440×2560 | 1440×2440 top; focus (760,1150) | i4.photo.2gis.com/photo-gallery/de2447e0-fd8b-439e-bf68-c70b245cc5ad |
| bloom veil / curtain (alpha) | bloom-source.webp, bloom-curtain-alpha.webp | 061 | 1440×1920 | veil rows 380–1100 only (no trunk); curtain y340 1440×1180 keyed | i7.photo.2gis.com/photo-gallery/fdcbd0e4-5832-4a93-9719-0efab5cca1c1 |
| terrace chapter, tall | terrace-evening.webp | 081 | 1440×1920 | 1440×1800 | i3.photo.2gis.com/photo-gallery/c5d6cac5-d5bd-464c-b63b-31d7ac2799e8 |
| terrace chapter, small | terrace-car.webp | 015 | 1179×867 | 1179×800 | i9.photo.2gis.com/photo-gallery/362b1b1e-c936-4134-900c-18d4fdb8efe8 |
| atmosphere | lounge-lanterns.webp | 216 | 1440×1920 | 1440×1800 | i5.photo.2gis.com/photo-gallery/d835cf3c-fb9c-4b17-87ff-3fc146094af5 |
| gallery anchor | terrace-tree.webp | 124 | 1440×1920 | 1440×1800 | i9.photo.2gis.com/photo-gallery/7574fe32-965a-466c-b27d-cbba343f2686 |
| menu photo | lounge-cocktail.webp | 014 | 1440×1920 | x200 1240×1500 (guest at the edge cropped out) | i7.photo.2gis.com/photo-gallery/97aae6b7-71f6-46b0-9de2-d83c1b0b07c3 |
| gallery detail | terrace-car-close.webp | pack SM01 | 961×1280 | full | owner research pack (`XXXL (1).webp`) |

## Why these two masters
- **Day 097:** overcast-warm sky (no cobalt), string lights, the pink-and-white tree centre-right, white slatted terrace and blue sofas, no people. The crown stands clear against sky, so a credible matte lets `SORRY MAMA` pass behind it.
- **Night 085:** the indoor tree as part of a real room: green velvet chesterfields, red armchairs, lanterns in the crown, bar behind. No prominent guests (bartender small, far).
- **Curtain 061:** dense lit petals on a dark room, keys cleanly; the veil crop avoids its trunk so no two trunks ever cross.

## Alternates kept in research/2gis/orig
081 (golden-hour framed terrace) as a day alternative; 216 / 200 (lanterns close, guests in 200) as night alternatives; 124 day terrace from another angle.

## Excluded
Recognisable guests (many selfies on the neon staircase, portraits), watermarked SM03 / SM09, food shots used for no role yet. Venue menu photos exist in the gallery (≈#697–#713) but were not transcribed: possibly outdated, and the owner's menu takes priority.

## Needed for final quality
Owner originals ≥2400 px: the terrace tree with sofas (landscape, soft daylight) and the lounge tree as a wide room shot; publication permission for any guest photo kept.

## V3 audit (13.10.2026) — every photo on the page
| file | source | drawn at 1440×900 (CSS) | DPR 2 need | crop | 100% sharpness | dup | verdict |
|---|---|---|---|---|---|---|---|
| terrace-master(-2x) | 097, 1440×1820 → Real-ESRGAN 2× 2880×3640 | 1613×2038 (scale 1.12) | 3226 | desktop band, focus (1000,760) | neural crisp, no doubling | hero only | **neural wins** |
| terrace-branch-alpha | 097 2× region 280×360 | 157×202 | — | one sprig over last letter | clean at 100% after texture rule | — | kept (≥1180 px only) |
| day-soft / night-soft | 097 / 085 → 720 px, gblur σ7 | only seen defocused | — | full frame | intentionally soft | — | kept |
| lounge-master | 085, 1440×2440 | 1440×2440 (1:1) | 2880 | focus (760,1150) | original; neural made the bartender's face plastic | hero + tail | **original wins** |
| lounge-lanterns(-2x) | 216 → neural 2× | ≈ 900 wide | 1800 | 4:3, lanterns | neural crisp | atmosphere only | **neural wins** |
| terrace-evening | 081, 1440×1800 | ≈ 760 wide | 1520 | 5:4 bottom-anchored | 1:1 at 1x | terrace only | ok |
| terrace-table | 191 crop 1080×1400 | ≈ 300 wide | 600 | fruit plate | sharp | — | ok |
| lounge-cocktail | 014 crop 1240×1500 | ≈ 420 wide | 840 | full | sharp | menu only | ok |
| terrace-drink | pack SM02 crop 580×860 | ≈ 330 wide | 660 | hand + glass, guests cut out | sharp | menu only | ok |
| terrace-tree | 124, 1440×1800 | ≈ 860 wide | 1720 | 5:4 | 1:1 | gallery only | ok |
| terrace-car-close | pack SM01 961×1280 | ≈ 400 wide | 800 | 4:3 | sharp | gallery only | ok |
| bloom-source | 061, 1440×1800 | ≈ 400 wide | 800 | 4:3 | sharp | gallery only | ok |
| lounge-canopy | 200 crop 1440×1100 (guests cut out) | 1440×≈700 | 2880 | upper canopy | soft on retina | contacts only | acceptable, dark scene |

Rights: none cleared (2GIS guest uploads + owner's research pack). Local only.

## V3 typography
Auditioned Commissioner, Geologica and Manrope on the identical hero crop (scratch board, labels outside). Chosen: **Commissioner 800** with FLAR 60 / VOLM 80. Reason: its humanist construction and flared terminals sit with the blossoms instead of stamping over them; Geologica read colder and more geometric, Manrope rounder and corporate. Composition first: both lines over the sky, `MAMA` ending where one real sprig crosses its last letter. Onest stays for UI/body.

## V3.1 — owner's cut-out layers (13.10.2026)
The owner supplied two 1086×1448 RGBA layers made from 097: `tree` (crown + AI-extended trunk) and `terrace` (terrace, wires, building; sky and tree removed). Both were Real-ESRGAN 4× upscaled and placed on the 2880×3640 grid of the day master:
- terrace layer scaled to 2880×3840, shifted −16 px (measured against the original), cropped to 3640 rows;
- tree layer scaled to 1108×1477 at (1402, 1014), trunk clipped at the sofa line (y 2330) so it stays behind the furniture;
- merged into `terrace-front(-2x).webp` (alpha).
The sky behind the wordmark is `terrace-sky(-2x).webp`: the original photo where the front layer is transparent, with wires, bulbs and remnants of the old building/tree detected and filled by normalized blur (two radii), so nothing doubles with the owner's sharper wires. The branch matte from V3 is retired.
Layer order: sky → SORRY MAMA → front (terrace, wires, tree). The wordmark sits behind the wires and the crown; on scroll the crown grows over it.

## Polish pass (13.10.2026)
| file | source | treatment | role |
|---|---|---|---|
| lounge-master-2x.webp | 085 | Real-ESRGAN x4plus → 2880×4880; bartender (1x box x1120–1340, y1260–1460) blended back from the original with a 60 px cosine feather | hero night, wide/retina screens |
| terrace-day(-2x).webp | 015 | neural 4× → 2356×1480 / 1178×740; black band on top and the Avito mark at bottom right cropped off | terrace chapter, main |
| menu-kitchen(-2x).webp | 186 | neural 4× → 2160×2700 / 1080×1350, 4:5 from the top (2GIS mark below the crop) | menu gateway «Кухня»; no dish name claimed |
| lounge-canopy.webp | 200 | **removed**: too soft as a full-bleed contacts background | — |
| terrace-evening.webp | 081 | unchanged; moved to the contacts frame (square crop, ≈580 px wide → sharp) | contacts |
| night-soft.webp | 085 | unchanged; reused as intentionally defocused backdrop of the booking block | booking |

## Menu (13.10.2026)
2GIS album `price_list_image` (13 photos, API `api.photo.2gis.com/3.0/objects/70000001034900657/albums/price_list_image/media`), originals in `research/2gis/menu/m01–m13` with URLs in `urls.txt`. m02, m04–m11: owner uploads 19.02.2025; m01, m03: social posts 22.01.2026; m12 (drinks board) and m13 (text menu) are from 2024 and were not used.
30 dish photos cut from the cards, Real-ESRGAN x4plus, 800×600 webp in `public/assets/venue/menu/`. Group shots (soups m07, platters m10, two-plate shots m02/m05) were split only where each plate is identifiable by its contents. No photo: vitello tonnato (covered by a «NEW» label), Magadan shrimp (cut off). Bar: only m12 (alcohol-free cocktails board, 2024) lists drinks; no drink photos or recipes exist, so the bar is typographic.

## Trunk fix (13.10.2026)
terrace-front(-15x,-2x).webp: the cut-out trunk ended in a flat edge drawn over the far cushion (x≈1954–2042, y≈2290–2330 in 2× px). Those rows are now refilled with the cushion, blended from the cloth on both sides of the trunk, so the cushion passes in front of it. Fixed in the 2× file; 1.5× and 1× resampled from it.
