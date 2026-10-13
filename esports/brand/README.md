# EPC brand assets

Pulled from the designer's Figma PDF export (`design/figma-pdf/`, frame `EPC_BrandBook` and `02 · Component library`) with `scripts/assets/pdf-vectors.mjs`. Exact vector geometry: don't redraw.

- `epc-lockup.svg`: primary lockup (mark + ESPORTS PRO CIRCUIT), `currentColor`
- `epc-mark.svg`: the EPC mark alone
- `epc-wordmark.svg`: the wordmark alone
- `pattern-quiet.svg`: Circuit / Quiet tile (266×475, hero scale). Use it as a CSS mask and colour it with a token (hero: graphite at 25%)
- `pattern-dense.svg`: Circuit / Dense tile (83×150). Same mask approach (brand red)
- `icons/*.svg`: the library §02 icon set (outlined strokes, 1.6 weight). `twitch.svg` is redrawn as a stroke from the same 24-grid glyph, because its inner lines didn't survive the PDF
- `art/*.webp`: approved image fills (red crystal, shield-on-crystal), full size + `-sm`

Hero values measured from the Figma render: background #09090B, quiet pattern = #19191E at 25%, the big mark = #F81721 at 10%, rotated +2°, cropped on the right.
