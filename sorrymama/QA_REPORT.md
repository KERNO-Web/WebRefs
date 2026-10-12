# QA report — Sorry Mama V3 (13.10.2026)

Run: `npm run dev` → http://localhost:5187 (Playwright Chromium). Proofs in `screenshots/v3/` (gitignored), video `screenshots/v3-scroll-desktop.mp4`.

## Brief's capture list
Desktop 1440×900: D01-hero, D02-p025, D03-p048, D04-p061, D05-p085, D06-after400, D07-terrace, D08-menu, D09-details-hover + D09b-lightbox, D10-contacts + D10b-footer.
Mobile 390×844: M01-hero, M02-transition, M03-night, M04-terrace, M05-menu, M06-gallery-open.
Widths: W360/768/1024/1366/1920 hero + night. Reduced motion: RM-night.

## Hard failures — checked
| failure | result |
|---|---|
| wordmark like a pasted corporate header | fixed: photo-locked composition ≥1180 px, one real sprig crossing |
| detached cutout / halos / white dots | none: full-tree cutout and petal curtain deleted; branch matte checked at 100% |
| hard day/night jump, scrim dropping early | none: single scrim held through the cut; recording shows ≤11/255 steps inside the passage |
| empty beige/plum voids, tiny paragraphs | terrace/atmosphere/menu/contacts recomposed; remaining dark space is the photo tail |
| inert CTAs | all links: tel, Yandex, 2GIS, 2GIS menu, anchors |
| blurry / hallucinated images | neural 2× only where it won at 100% (097, 216); 085 kept original |
| duplicate photos across sections | removed (each photo has one role) |
| mobile crop loses brand or tree | no |

## Measured
- Overflow 0 px at 360, 390, 768, 1024, 1366, 1440, 1920. Broken images 0. Console errors 0.
- Scrub frame time: median 16.7 ms, p95 18.5 ms.
- Cursor: active on mouse, «Смотреть» over photos, ↗ on external links, off with reduced motion and on Tab.
- Lightbox: arrows step 01→02, scroll locked, Escape closes, focus returns to the thumbnail.
- Header: active chapter underlined (Атмосфера / Терраса / Меню / Контакты).
- Terrace reveal: fires on entry at every height (fixed: tall mobile section never revealed before).
- Reduced motion: stage unpinned, cursor off, day and night as two stills.

## Open
- Retina sharpness of the night master (source 1440 px, neural rejected for faces).
- Photo rights not cleared; nothing published.
- Real touch devices and Safari not tested (Chromium emulation only).
