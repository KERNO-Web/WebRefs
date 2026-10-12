# SORRY MAMA / KERNØ — REBORN MASTER IMPLEMENTATION SPECIFICATION

**Document type:** art direction + product specification + production-level Claude Code implementation prompt.  
**Language of this specification:** English. **Language of the site:** natural Russian.  
**Project:** unofficial concept for Sorry Mama rest-lounge, Kazan, Russia.  
**Directive:** NEW BUILD. Do NOT keep patching the previous failed page composition. The user has expressly approved a fresh visual implementation.

---

## 0. READ THIS BEFORE CODING — THE NON-NEGOTIABLE CONTRACT

You are the creative front-end engineer, layout specialist, motion designer, typographer and meticulous visual QA engineer. The art direction is already decided. Your job is to *implement*, not reinterpret it as another generic restaurant template. Make independent technical decisions; the owner is not a programmer and should not be asked to choose JavaScript libraries, CSS values, image formats or animation implementation methods.

The user and art director have explicitly approved ALL of these choices:

1. First impression: **“Wow, how beautiful.”** Sakura and the actual atmosphere of the venue matter more than explanatory marketing copy.
2. Narrative: **DAY → NIGHT**. A luminous, lovely sakura terrace transforms through scroll into the warm evening lounge.
3. First frame: **sakura PLUS the actual terrace**. People should see the place, powder-blue sofas / white wood and architectural environment — not an isolated flower wallpaper.
4. Display typography: **a HUGE `SORRY MAMA` integrated spatially with sakura**. Blossom branches pass in front of parts of the letters. This must feel like a high-end editorial cover, not a small two-line H1 in a left sidebar.
5. Heading character: a *confident wide contemporary bold display* with subtle experimentation in proportions, in deliberate contrast to delicate blossoms. Avoid bridal high-contrast serifs, Times/Playfair look, generic thin luxury typography and random decorative Japanese lettering.
6. On scroll: camera appears to enter/approach the blooms. The huge title **disappears BEHIND flowers** (spatial occlusion); it must NOT merely fade like an overlay. The flowers conceal an intentional match-cut to the actual warm interior.
7. Night destination: a **real, photographically rich wide-feeling indoor scene**, not a featureless plum rectangle, disconnected tree or generic UI panel. After the transition, the next content must grow organically from the night scene.
8. Use **real photographs of this exact venue** only. Never substitute generic restaurants, unrelated cherry-blossom stock, or AI-fabricated venue images. Never present an invented booking or menu as real.
9. Never sacrifice image fidelity for a giant background: a stretched 960px portrait photograph is NOT a premium 1440px desktop hero.
10. Typography, interaction and layout must be equally composed on mobile. This is a full restaurant-facing portfolio showcase, not merely an animation exercise.

**Tone and visual benchmark:** authored, cinematic, tasteful, confident, textural, recognizably this venue. A contemporary urban lounge, NOT a Japanese-themed restaurant. User's benchmark sites: https://sadkobwfm.ru/ , https://tunguskarestaurant.ru/ , https://urartu24.ru/ . Study their compositional confidence and professional typographic systems; do NOT clone them or infer their actual font files without verifying. KERNØ quality references: https://kerno-web.github.io/WebRefs/ (Roman, BRIGHTLINE, NOCTIS, Afterimage, EPC: level of craft only, not templates).

**Previous failure:** recorded video `Запись экрана — 2026-10-12 в 22.54.50.mov` (provided separately by owner). The earlier version starts with a cropped sakura portrait, small `Sorry Mama` title, prematurely drops into a giant night flower close-up, then reveals an enormous nearly empty dark plum region containing a tiny terrace inset and ordinary left text block. No such dead screen, small floating photo, or generic caption box may survive. The result became less convincing with each patch. Preserve concepts, restart the layout.

### Work environment and deliverables

- Inspect repository structure and current asset directories before acting. Back up old implementation to a branch or immutable copy; don't destroy working files. Create a clean isolated implementation or clean branch, appropriately named `sorry-mama-reborn`, and preserve existing build/deployment configuration if useful.
- This attached package contains `manifest.json`, `manifest.csv`, `assets/provided/*` (9 user-provided reference images) and `SORRY_MAMA_ASSET_CONTACT_SHEET.jpg` alongside this specification. Locate these resources after import; do not invent file paths. If files are not colocated, ask only how to access the directory, NOT creative/technical questions.
- Art-direct from the available real imagery. The attached 9 images are **working references, predominantly portrait, 960–1280px wide** and NOT sufficient proof of adequate high-resolution hero assets. You must first research and acquire legitimately accessible better originals within this Claude Code session before locking hero image selections.
- Build a working website, not a screenshot. Each visible click target has a real action or explicit *demo* behavior. Keep network keys, forms and personal information safe.
- Never claim publication rights are cleared. This is an **unofficial KERNØ portfolio concept**; any public hosting of user-review photos requires appropriate permissions/credits.

---

## 1. SOURCE-OF-TRUTH / VERIFIED LOCATION / UNVERIFIED FACTS

**Exact venue:** Sorry Mama / Sorry мама, rest-lounge, Kazan, **ул. Фатыха Амирхана, 21г, 2 этаж**.

**Venue references (same venue ID + address):**

- 2GIS (place id `70000001034900657`): https://2gis.ru/kazan/firm/70000001034900657/tab/photos
- 2GIS menu: https://2gis.ru/kazan/firm/70000001034900657/tab/menu
- Yandex Maps (organization id `169351776272`): https://yandex.com/maps/org/sorry_mama/169351776272/gallery/
- Yandex Maps venue card: https://yandex.ru/maps/org/sorry_mama/169351776272/
- Restoclub venue page: https://www.restoclub.ru/kzn/place/sorry-mama
- A-a-ah venue page: https://a-a-ah.ru/restoran-sorry-mama
- Other contextual photo listings: https://restaurantguru.ru/Sorry-Mama-Kazan ; https://tomesto.ru/kazan/places/sorry-mama

**Phone independently repeated on several venue records:** `+7 (843) 203-33-03` → `tel:+78432033303`. Verify again against live cards before public deployment.

**DO NOT TRUST:** opening hours across aggregators differ; copy the *current* verified live listing and cite its retrieval date or omit hours pending confirmation. Some external business listing phone numbers also differ. Prices, promotions, reservation providers, kitchen categories, seasonal terrace availability and exact seating policies are not validated by this document. Do NOT hardcode invented details. The previous domain `sorrymama-lounge.ru` was reported by the user to redirect to unrelated gambling content. DO NOT link it or scrape from it unless independently verified safe. Do not label an aggregator as the official restaurant website.

**Data contract:** all display content that may change belongs in one typed configuration object (`src/data/venue.ts`) and a separate menu data file. A researcher can later adjust contacts and menu without redesigning the page. The user's actual menu may be supplied after visual implementation; it takes priority over third-party historic menus.

---

## 2. PHOTO ASSET GATE — CLAUDE MUST SOURCE THE IMAGES BEFORE FINALIZING HERO

### 2.1 Read and curate, do not hallucinate

Before writing art-directed layout, inspect every available image's real pixel dimensions, aspect, actual content, compression artifacts, visible watermarks, people and copyright status. Open contact sheet and key source images visually; don't let filenames determine creative decisions.

The provided nine photos, as initially audited, have approximate categories:

| ID | Nominal subject | Status for final site |
|---|---|---|
| SM04 | daytime rooftop, blue sofas, white blossoms, strong urban background | compositional *reference*, too small/portrait for wide hero |
| SM06 | daytime terrace, pink tree, blue sofas, wicker lamps | contextual reference, too small/portrait for wide hero |
| SM05 | indoor warm flower canopy, red lantern | strong **night-transition close-up** candidate, portrait/low resolution |
| SM08 | indoor blooming tree with circular ceiling light | evening atmosphere reference, portrait/low resolution |
| SM03 | venue sign through pink blossoms | cropped editorial detail; visible watermark may preclude use |
| SM02 | blue drink with terrace background | possible drinks detail, composition-first crop |
| SM01 | vintage branded car | optional quirky location vignette, not a hero |
| SM07 | terrace/person under blossoms | avoid prominent people without consent |
| SM09 | identifiable people indoors | exclude until release/permission verified |

**Do not mistake an existing screenshot, compressed webp or upscaled copy for a new original.** A 960×1280 image is still 960px wide when placed into a 1600px background; no AI sharpening makes it a true high-res original.

### 2.2 Acquiring originals

YOU, Claude Code, are responsible for sourcing and curating real restaurant imagery as part of this implementation. Attempt publicly visible, *permitted* original-sized photos from the two exact business listings, plus optional legitimate venue listings above. There is no separate asset collector assigned to this project. Respect site terms and HTTP rate limits; no captcha bypass, account cookies, hidden/private APIs, evasion or aggressive network scraping. Preserve image provenance, credit and licensing status. If the maps services deny bulk retrieval, stop and report; do not retry stealthily. Asset sourcing is your first project phase. Minimize token expenditure: use deterministic scripts for dimensions, hashing, and thumbnails, inspect compact contact sheets, and do not repeatedly rescan the same galleries. Never bypass website restrictions or pretend blocked downloads succeeded.

Look for these **specific** compositions, not just anything labeled sakura:

- **DAY HERO:** landscape ≥2000px width (ideally 2400–3200), terrace visible in lower 40%, vivid blooming tree occupies center/right, enough lighter negative space for huge title LEFT and across flowers. Prefer bright cloud-white/soft peach sky over saturated cobalt blue. No foreground people. Viewpoint that clearly depicts the venue, not a close-up of flowers against apartment blocks.
- **DAY FOREGROUND MATTE:** high-resolution foreground blossom branches or crop derived from SAME venue photograph(s) with alpha that can visually occlude large text. Crop must make physical/spatial sense.
- **TRANSITION OCCLUSION:** dense real venue blossoms enough to mask the visual handoff. Could be a separate cropped source photo of the venue; do not fake the background beyond authentic material.
- **NIGHT HERO:** landscape ≥2000px, real intimate interior, branching blossom canopy, lanterns/tiny lights and actual seating/bar architecture. Tree is a rich part of the room, not only macro branches filling every pixel.
- **ATMOSPHERE:** one medium-wide indoor image, one atmospheric detail (lights, furniture), one terrace detail.
- **MENU:** tasteful actual venue food/drink photos from approved sources. Skip food photos if they look blurry or generic.

If ideal images aren't available: make the best honest **editorial composition with portrait photographs as deliberate bounded editorial frames**, not an enlarged full-screen low-resolution photo; report the quality blocker explicitly. You may build interaction and the interface in that state, but do not claim final cinematic acceptance. Never generate fictitious interior pictures to 'complete' the venue.

### 2.3 Asset naming and manifest

Use filenames that describe content, not hashes without labels: `terrace-master.jpg`, `terrace-foreground-alpha.webp`, `bloom-occlusion.webp`, `lounge-master.jpg`, `lounge-detail-01.jpg`. In `src/data/assets.ts`, map roles to actual selected filenames. All visual asset URLs are relative to the project, not hotlinks to unpredictable third-party sites. Maintain a source manifest with `id, original_filename, width, height, source_page_url, photographer_or_unknown, rights_status, tags, approved_for_publication`. Keep collected unlicensed images private; do not commit them to a public GitHub Pages build until rights resolved.

**Make a contact sheet of actual candidates and an `ASSET_SELECTION.md` explaining the final two master-image choices and alternate options.** Images should be inspected at their original dimensions, not only as 200px contact sheet thumbnails.

---

## 3. THE CREATIVE DIRECTION — ONE BLOOM, TWO WORLDS

There is precisely ONE signature cinematic device: sakura blossoms conduct the viewer from a fresh day terrace into a warm indoor evening. The interaction serves the venue's real architecture, not your ability to show off an animation library.

**DAY feeling:** luminous flower petals, chalky almost-white, dusty pink, pale powder blue upholstery, sunlit pale timber, breeze, real rooftop intimacy. Do not make it look like a seaside resort or generic Kyoto travel poster. Correct the existing photographs' electric blue sky or flat exposure through mild, authentic color grading only — avoid hiding bad source composition beneath filters.

**NIGHT feeling:** wine/plum shadows, warm amber incandescent lanterns, subtle green/teal/burgundy seating, glints in glass, flower petals caught by point lights. Not pure black and not empty #26151f rectangles. There must be actual photographic detail across the frame.

**Brand expression:** bold, large, contemporary `SORRY MAMA` display name framed by delicate real flowers. Contrast does the work. No pseudo-Japanese symbols, no massive automatic falling petals, no rotating 3D tree, no shiny WebGL sakura mesh, no 7 gradient blobs, no glassmorphism card forest, no AI-generated giant slogans.

Photographic depth and editorial typography matter more than animation complexity. The initial screenshot should work as an exceptional static cover.

---

## 4. VISUAL TOKENS AND TYPOGRAPHIC SYSTEM — EXPLICIT

### 4.1 Color tokens

The actual hero photographs are the authority. Start with these values and tune within a narrow range *against selected real photos*:

```css
:root {
  --day-paper: #f5f0ec;      /* warm blossom white, never sterile white */
  --day-ink: #31252b;        /* bold plum ink over daylight */
  --day-muted: #665963;
  --powder-blue: #b7ced8;    /* real cushions, not a dominant interface gradient */
  --petal-pink: #e4afb9;     /* tiny pictorial accent, not all-button pink */
  --night-black: #191317;
  --night-plum: #2a1c24;
  --night-ink: #f6eae4;
  --night-muted: #cbb9b7;
  --lantern-gold: #d09b67;  /* restrained interaction accent */
  --line-day: rgba(49,37,43,.18);
  --line-night: rgba(246,234,228,.19);
  --page-gutter: clamp(22px, 3.3vw, 64px);
  --ui-radius: 2px;          /* avoid endless round app-chip styling */
}
```

No arbitrary gradients for the sake of “premium.” Use light vignettes where necessary solely for readability, and keep floral photography uncrushed. On dark sections favor nuanced dark photographs over empty solid color.

### 4.2 Exact font direction and fallback

**Primary heading audition**: `Unbounded` Cyrillic-supported display, weights 500/600/700; investigate optical fit and actual font files/availability. It is wide and characterful, so treat its width as a composition constraint. **Primary UI/body:** `Onest`, weights 400/500/600/700, with strong Cyrillic legibility. Links: https://fonts.google.com/specimen/Unbounded and https://fonts.google.com/specimen/Onest . Keep fonts local/preloaded when allowed by license and build policy, `font-display: swap`; avoid excessive font downloads.

Test no more than two alternatives to Unbounded **using the same exact final photograph and composition** if the preferred face proves too wide or visually stiff. Alternatives may include `Geologica` (variable modern display) or a bolder weight/width of `Commissioner` if font assets permit. Do not waste cycles testing random Instagram wedding serifs or Montserrat. Choose **one** display family and one text family, commit to them. The typography audit is part of visual QA, not an invitation to endlessly generate options.

Suggested rules:

```css
--font-display: 'Unbounded', 'Arial Black', system-ui, sans-serif;
--font-ui: 'Onest', system-ui, sans-serif;
--hero-display-size: clamp(82px, 10.4vw, 186px);
--hero-display-leading: .84;
--hero-display-tracking: -.065em; /* inspect per font; avoid collisions */
--section-display-size: clamp(48px, 6.8vw, 108px);
--section-display-leading: .98;
--body-size: clamp(15px, 1.13vw, 17px);
--body-leading: 1.5;
```

`SORRY MAMA` should be visually HUGE. Default design uses **two deliberate stacked words**, `SORRY` and `MAMA`, with slightly different alignment; neither is a tiny H1. Do not simply set `text-align:left; font-size:60px;` on a beige panel. On 1440px desktop, combined typography should occupy roughly x=70..1050 in the visual foreground; first word may overlap tree canopy around x=530..850, second word around x=440..950, depending on actual tree. Aim for words approximately 115–160px tall in the chosen font; make precise optical adjustments against real assets. The blossom matte occludes selective letters/parts while the content remains understandable.

No artificially huge letter spacing. No generic all-uppercase 9px eyebrow distributed throughout the site. Typography hierarchy is composed around photography: one monumental headline, restrained clear subhead, small purposeful factual labels. Use `text-wrap:balance` cautiously for large editorial copy; never orphan single Russian short prepositions/conjunctions at line ends (`в, с, к, у, о, и, а, на, по, за, из`). For manually controlled headlines use non-breaking spaces; do not indiscriminately turn whole paragraphs into unbreakable strings.

**Russian editorial content**: speak plainly. Use short real phrases. No synthetic “место, где время замирает,” “атмосфера, которая вдохновляет,” or “гастрономическое путешествие” unless actually sourced. Do not claim Japanese cuisine as the restaurant's entire identity. Do not add unverifiable awards, dates, guest quotes or review averages.

### 4.3 Interaction details

- Header UI uses readable 14–15px text and 44px minimum interaction hit targets; booking CTA always distinguishable.
- Desktop hover: 180–240ms ease, 1–2px underline movement or subtle image drift; no bouncy UI carnival.
- Cursor: native cursor. No huge gimmicky custom blob.
- Accessibility: visible focus ring, keyboard nav, skip link, correctly labeled buttons, user-select text where sensible.
- Decorative floral layer has `pointer-events:none` and `aria-hidden=true`.

---

## 5. HERO — SINGLE FULL-SCREEN ART-DIRECTED COVER

**Reference composition at 1440×900 viewport**; preserve intent at 1366×768 and 1920×1080.

### 5.1 DOM / layer order

Layer 0 `hero-day-scene`: real day photograph, preferably multi-source authentic cut/grade composition, edge-to-edge where sufficient resolution. Terrace and sofa architecture remain visible at lower-center/right, not wholly behind text. Tree has spatial grounding (trunk or branches visibly connect to venue). If image is only portrait 960px, do not make full-bleed blurry. Use an honest bounded crop while waiting for masters.

Layer 1 `hero-day-light`: tiny graduated warm-light correction/vignette, **not** a flat beige overlay. Preserve bright petals and sky detail.

Layer 2 `hero-wordmark`: real text DOM, semantically one H1; two controlled line spans, spatially behind the foreground blossom matte. Large dark wine/near-black ink or slightly soft chalky ink depending on photo contrast. Text must be readable yet integrated with the canopy.

Layer 3 `hero-foreground-blossoms`: a carefully masked alpha blossom component sourced ONLY from real venue photo material. It comes over parts of wordmark and establishes depth. Subtle natural edge softening; no jagged polygons, glowing halos or noticeable duplicated branches. If masking quality is poor, reduce overlap rather than fake physical occlusion.

Layer 4 `hero-interface`: compact factual descriptor and two functional navigation/booking actions. Keep this layer above decorative petals; make sure no blossom covers a button or nav link.

Layer 5 `site-header`: no giant opaque navbar. Header is an overlay that changes contrast as scene turns night. Fixed/sticky behavior should not jitter during scroll pinning.

### 5.2 Desktop composition / approximate coordinates

- **Header** y=0..76: x=48..1392, small logotype left (distinct from enormous H1), nav links `Атмосфера`, `Меню`, `Как добраться` in center/right, outlined or high-contrast `Забронировать` far right. Logo state should remain readable on both moods. At 1440×900 avoid centered massive navigation bar competing with title.
- **Primary scene** y=76..900: open daylight with white wood / powder-blue sofas visibly signaling a real terrace. Focus tree center-right (approximately x=710..1080, y=170..750). Do NOT choose crop where 60% of the screen is plain cobalt-blue sky.
- **Main wordmark** occupies an editorial band approximately y=275..600. `SORRY` begins x≈58, `MAMA` begins x≈200 (rough direction, refine against tree). Letters weave through right-side branches via foreground alpha layer. The tree is still the primary photogenic object; adjust spacing so title/tree complement rather than collide.
- **Information bar** roughly bottom x=55..1385, y=790..866 (or visually appropriate for photo): left `РЕСТ-ЛАУНЖ · КАЗАНЬ`, one small honest phrase `Днём — терраса. Вечером — лаунж.`; right minimal scroll invitation plus CTAs `Забронировать стол` and `Смотреть меню`. Don't create an opaque glass card across half the hero.
- The static still MUST read: enormous strong wordmark, obvious real rooftop, blossom crossing letters, place to visit, booking path. Nothing needs to move for this to be beautiful.

### 5.3 Header interaction

Top-of-page header: translucent/surface-less day ink contrast, no pill clutter. It becomes slightly backed by a dark semitransparent surface only when readability demands it on night scene. Maintain 44px buttons. On mobile logo and booking visible; menu toggles an elegant accessible overlay with section anchors; Escape closes, focus trapping and return focus work. No header spring jump when ScrollTrigger pins/unpins.

### 5.4 Entrance reveal

No loader fake percentage meter, no mandatory waiting sequence. Show actual LCP image and title at first paint. Optional short entrance after image decode:

- 0–450ms: full scene appears naturally with a tiny 1.03→1 zoom, if image is ready; no flash from black/white.
- 150–750ms: wordmark masked upward ≤28px, stagger second word 100ms; not individual character shuffle.
- 350–850ms: navigation/CTA clean fade-up ≤12px.
- Disabled or simplified for reduced motion; page usable even if JS fails.

---

## 6. SIGNATURE DAY→NIGHT BLOSSOM PASS-THROUGH — EXACT TIMELINE

Use one carefully orchestrated scroll scene. Concept: the viewer physically approaches the flowering tree, the petals grow and cover the name, then the warm interior emerges from behind the blooms. It is an *occluded photographic match-cut*, not a literal 3D transition or an opacity fade between photographs.

### 6.1 Layout geometry

Desktop: hero-journey track height approximately `230svh`; one sticky visual viewport height `100svh`; animate over about `130svh` of scroll travel. This is an opening recommendation to be tuned by real video capture. The pinned scene must never leave 100–200vh of unrelated blank scroll after the night picture arrives. Avoid nested pinning and transforms on the element ScrollTrigger itself pins. Mobile: shorter range approximately `165–190svh`, no touch scroll trap. If fast scroll skips animation frames, the final state remains complete and correct.

Build one GSAP `timeline` driven by `ScrollTrigger` with `start:'top top'`, `end` computed from track, `scrub:0.55` or `0.65`, `invalidateOnRefresh:true`, controlled pin/sticky semantics. Only the inner images and matte transform, not the pinned container. Clean up animation instances on React unmount or hot reload. Native browser scrolling is the default; do not add Lenis unless concrete testing proves native inadequate.

### 6.2 Five mandatory keyframes — P ∈ [0,1]

**F0 — P=0.00 — DAY STILL / BEAUTY**

The approved first hero. Wordmark HUGE and behind petals; terrace recognisable; open brightness; usable links. If screenshot at 1440×900 fails, fix imagery and layout BEFORE touching motion. Header readable.

**F1 — P=0.18 — SLOW APPROACH**

Camera illusion: day background scale from 1.00 to only ~1.075, slightly adjust focal point to tree; foreground blossoms scale ~1.08–1.13 at greater relative depth; title stays almost fixed as physical foreground crosses its contour. CTA/information fades or slides out before significant overlap, after sufficient initial reading time; header remains accessible. NO giant zooming photo blur.

**F2 — P=0.38 — WORDMARK BEHIND FLOWERS**

True foreground blossom matte covers most central title. A small opacity reduction of text is allowed only AFTER the flowers already obscure it; dominant causal impression is physical occlusion, not simply `opacity:0`. Foreground bloom should now occupy ~55–75% of frame, with textured petal detail (NOT uniformly colored pink overlay). Blue terrace recognizable near the outer edge until coverage.

**F3 — P=0.54 — FLOWER CURTAIN / HIDDEN CUT**

Dense genuine petal texture covers enough viewport to conceal the photo discontinuity. This is the only section where two unrelated physical tree geometries may be swapped. Under occlusion, move from day master to night master. Light shifts sun cream → dusty rose/amber → lantern-warm plum; **never to flat gray**. Avoid full-screen maroon fade, fully blurred blobs, black frames and harsh white flashes. If two source photos cannot align perfectly, use DIFFERENT depth of blossom occlusion to hide incompatibility. Do not align obviously different tree trunks side-by-side in an attempted morph.

**F4 — P=0.78 — NIGHT ROOM REVEAL**

Foreground blossoms clear toward edges; the night interior image is fully legible, including architecture / lanterns / furniture. Set photographic lighting warm, not black crushed. Header flips to night contrast before it becomes unreadable. No floating small rectangular terrace photo at this moment; no content panel eating 40% of the room image.

**F5 — P=1.00 — NIGHT ARRIVAL / HANDOFF**

The viewer is now IN the warm lounge. The camera settles; a restrained night editorial phrase and CTA, if present, appear WITHOUT a dark opaque box. The next section begins from the SAME photographic color/edge and at an intentional contact point, so the scene remains connected. Immediately after unpin, users see designed content, not hundreds of pixels of empty wine-colored background.

### 6.3 Interpolation curves / visual invariants

- Day background scale: `1.00 → 1.10` through F3; night image begins around `1.10 → 1.00` through F5, designed to suggest arrival rather than digital zoom.
- Foreground blossom scale: `1 → 1.35..1.65` through F3 (asset dependent); position follows a chosen flower mass, not random `translateX`.
- Depth motion: background shifts ≤20px when fore-layer shifts 35–65px; disable pointer tracking on mobile and while scrub dragging; desktop pointer parallax only ~4–8px optional.
- Title transform: remain mostly stationary; minimal translateY ≤12px. Main disappearance happens by actual foreground occlusion; only a secondary opacity transition near/after F2.
- Color grade: daylight warmth rises smoothly, then lamp warmth; no neutral gray midpoint.
- Headline copy / foreground CTA must not obscure final room. Do not add huge dark caption panels.
- Timeline is fully reversible. Scrub backwards to daylight, and repeat five times; no stale class states, stuck z-index or image blinking.

### 6.4 Three acceptable implementations — choose lowest complexity that works

1. **Preferred:** actual real foreground blossom alpha matte rendered above text; precomputed transparent WebP/AVIF or PNG created once from selected photo crop, optimized. Two underlying real location photographs crossfade/mask only during dense bloom occlusion.
2. **Alternative:** layered real-image crops and CSS mask driven by scroll; use a coherent foreground bloom patch; don't create poor-quality floating 2D paper-cut petals.
3. **Fallback:** elegant non-3D camera push into a full-frame canopy crop, hidden photo swap as canopy covers camera, reveal night. Preserve huge title behind blossom overlay where possible.

NOT ACCEPTABLE: simply crossfade whole day to black/night; blend two mismatched trunks; use an imprecise `clip-path` polygon over blossoms; tint everything flat pink; slow down scroll with 350vh of padding; overlay random floating floral PNGs or unrelated 3D tree models.

### 6.5 Mobile scene

Viewport design case 390×844 with 360×800 as stress case. Asset selection on mobile needs dedicated `object-position` and sometimes distinct portrait source images. The subject must not vanish behind giant words; title may use two or three intelligently composed lines but still be strong; approximate `font-size:clamp(58px, 16vw, 80px)` depending font. Let tree and terrace be clearly visible in 390×844 initial composition, CTA within first view. A weaker simpler blossom curtain on small phones is preferable to janky pinning. Avoid fixed 100vh on mobile browser chrome; use `svh` and/or `dvh` judiciously.

If device ≤767px or `prefers-reduced-motion:reduce`, optionally drop sticky pin and use a simple 2-frame transition with two strong full-bleed static scenes as separate sections. Motion should never block navigation or booking.

---

## 7. WHOLE-SITE EDITORIAL STORYBOARD — NOT TEMPLATE SECTIONS

After the Hero, build a complete restaurant site with a cohesive visual rhythm. **No twelve generic rounded cards**, repeated “section eyebrow + huge title + same two-column image” layout, pointless number badges, redundant photo carousels or blank gradients. Every chapter has a distinct editorial composition and a job for restaurant customers.

### Section 00 — Cinematic hero / day-to-night

Specified above. Brand moment and primary reservation conversion. Treat it as pages 1–2 of one narrative, not a disposable banner.

### Section 01 — `АТМОСФЕРА` / NIGHT CONTINUATION

**Position:** immediately after pinned room settles, with barely perceptible transition from real night photograph to deeper warm material of site. The first 25% of visible section should maintain continuity with night master: match its texture, framing and dominant light direction. Use the selected interior image at credible quality, never a plain plum wash.

**1440×900 scene:** editorial asymmetry, right 58–65% of viewport holds a superb 4:5 or 3:4 photo of the actual night room; photo extends toward top and lower fold, with portion of the frame possibly cropped by a single strong geometric margin; on left a small `ВЕЧЕРОМ` factual label and restrained two-line display message. Not an uncreative flat `text left / image right` rectangle on an empty solid background: allow one intentional overlap of title with photograph / negative space, a generous vertical bleed, and secondary cropped flower/lantern detail on a different layer. The image should dominate ~65% of visual area; type is subordinate to scene.

**Copy default:** `Вечер. Тёплый свет. Свои люди.` is a placeholder concept line; replace if actual imagery suggests a more grounded shorter expression, do not pretend it's a venue tagline. Supporting copy <=180 Russian characters and should actually describe observed space (sakura, warm light, lounge, seating). No invented history.

**Animation:** as pinned section ends, the same night scene gently hands off to content; at most 20px editorial text entrance and a subtle image reveal. No global blur or reset to blank screen. On mobile photo first, text over stable readable area or immediately below, no tiny inset photo.

### Section 02 — `ДНЁМ НА ТЕРРАСЕ` / LIGHT WINDOW

Introduce a carefully designed return to daylight, but NOT another full day-night transition. Use a clear visual cut like a chapter turn, with a pale chalk-white page / powder-blue material. This is a secondary view of terrace, taking advantage of real furniture and sakura.

**1440×900:** tall portrait photo deliberately presented as a vertical editorial crop x≈80..650, y≈115..780; second small landscape/detail image (if verified high-quality) x≈920..1270, y≈365..690. Giant but lower-priority heading `Терраса` positioned right x≈660..1340 around y≈120..320; a short factual description under, then simple CTA to booking. One distinctive overlapping horizontal thin divider or micro index permitted if it adds structure. Avoid repeating the hero layout.

**Note:** when terrace is seasonal, do not promise year-round availability; copy can be timeless descriptive until verified. No fake sunshine/blue-sky composites behind actual architecture.

### Section 03 — `МЕНЮ` / FOOD, NOT CARDS

Menu is a central user need, but actual menu text and prices may not yet be supplied. Build a real extensible system, never invent dishes or prices.

**Section design:** off-white/warm surface, `МЕНЮ` massive editorial title, a broad real venue dish photograph cropped like a magazine feature if permission is available; if not, an elegant typographic treatment plus verified `Смотреть актуальное меню` linking to 2GIS menu. Source authentic content first; menu teaser is not a fake list of 12 dishes with invented ruble amounts.

If menu dataset is provided, generate accessible real categories using **real names, exact descriptions and prices**. Desktop shows categories as a quiet horizontal or left-side vertical list; items displayed in typographically arranged rows (name, description, optional gram amount, price aligned end) with sparse real photography only on hero items. On mobile categories become a scrollable list/tabs with keyboard/ARIA, item prices never cropped, navigation efficient. Use structured data type `MenuCategory` / `MenuItem` with optional image. No search box unless menu is large enough to justify. Never show fake checkout; real delivery if verified may be external.

CTAs `Меню полностью` → a live accessible section or actual existing 2GIS menu listing; do not route to `#` or dead buttons. Never mark a PDF as “download” if it doesn't exist. Actual dish data from the owner will replace placeholders without redesign.

### Section 04 — `ДЕТАЛИ` / SPARSE PHOTO SEQUENCE

A restrained one-time photo gallery: 5–7 **verified** excellent shots of lounge architectural details, real blossoms, drinks and the signature car if rights permit. Compose like a contact story/editorial spread, NOT a symmetrical Masonry Pinterest gallery. Use one wide anchor photograph and one vertical stack of 2, followed by a thin sideways image band *only if* it materially improves narrative. Captions functional and short, optional, no invented photography credits. Image interaction: accessible lightbox or native click-to-expand with escape and focus restoration; lazy load below fold. If only 2 good shots, show 2, don't fill 7 slots with junk.

### Section 05 — `КАК НАС НАЙТИ` / VISIT + RESERVATION

This is an actual useful restaurant endpoint, visually art-directed rather than fake map screenshot. Dark near-plum substrate using a beautiful genuine night/venue detail on right, substantial clear contact typography on left.

Factual display:
- `Sorry Mama`
- `Казань, ул. Фатыха Амирхана, 21г` / `2 этаж` (confirmed on major map cards)
- `+7 (843) 203-33-03` → `tel:+78432033303` (verify once more live)
- Opening hours **only after verified**. If uncertain, omit or write `Часы работы уточняйте по телефону`, not fictional times.
- `Проложить маршрут` → verified official Yandex Maps place URL; alternative 2GIS URL.
- `Забронировать стол` → actual verified channel (default phone dial). If real booking platform is confirmed, it may replace phone action.

No full-screen Google map embed tracking users by default. Map link/semantic location are enough; optional lightweight static map only with licensing/accessibility and accurate coordinates.

### Section 06 — Footer

Purposeful dark footer, no enormous empty black bottom. One graceful large typographic wordmark or cropped fragment (not repeating Hero's exact composition), direct route/phone/social if VERIFIED, link `KERNØ — неофициальный концепт сайта` plainly labeled for a portfolio prototype. Do not masquerade as the venue's sanctioned site. If demo uses third-party imagery without cleared permission, keep access private until cleared.

---

## 8. ROUTES, HEADER, MOBILE NAVIGATION AND ALL CLICKS

**Anchor architecture:** single-page landing with anchored sections: `#top`, `#atmosphere`, `#terrace`, `#menu`, `#gallery`, `#contacts`. Smooth scroll when motion allowed, and instant jump in reduced-motion mode. Ensure sticky header does not cover headings: `scroll-margin-top` / accurate scroll offsets.

Header desktop labels precisely `Атмосфера`, `Терраса`, `Меню`, `Контакты`; booking button `Забронировать`. Booking action uses a verified telephone `tel:+78432033303` until an actual reservation URL is confirmed. Do not fabricate a booking success state. If a modal is truly necessary it must **clearly** say `Связаться для бронирования` and offer phone/maps; never collect real personal reservation data or show fake confirmation.

Mobile: 56–64px high top bar; `Sorry Mama` compact left, `Бронь` as 44px action right, menu icon with 44px hit target. Menu overlay occupies viewport with short functional links on warm night paper, Escape and focus management. Opening mobile menu pauses only cosmetic animations, not entire site functionality. Lock page scroll properly; close after anchor click. Header transitions from dark text to light when night scene is behind it, not purely based on naïve global scroll pixel value.

Optional delivery button ONLY if verified external destination, not one of the main nav necessities. No fake stock photos next to delivery.

Analytics/cookie banner: do not add any tracking/marketing consent popup if there is no tracking. Avoid sticky promo ribbons, review ratings and influencer badges.

---

## 9. RESPONSIVE ART DIRECTION — SPECIFIC, NOT “MAKE MOBILE GOOD”

Breakpoints are guidance; test actual content and adjust. Must pass: 360×800, 390×844, 768×1024, 1024×768, 1366×768, 1440×900, 1920×1080.

### Desktop ≥1200

Strong edge-to-edge scene. Global margin 48–64px; 12-column reference grid with visual freedom. Giant 2-line heading; authentic blossoms overlap title. Scaled photographic assets prefer ≥2000px. Header 72–76px; room transition as one long pinned scene. Text body max 42–58ch; functional controls stable.

### Small laptops 900–1199

Font hero ~75–120px (font-dependent); crop selected to preserve terrace sofas and right-side canopy. Never let massive text consume 95% of visual; optimize actual collision with branches. Use grid with more flexible spacing; prevent scrolling horizontal overflow.

### Tablets 600–899

Header compresses; nav collapses gracefully rather than an overflowing row. Hero title ~76–100px with selected break. Place lower information panel on visually quiet portion of terrace; avoid covering tree trunk. Shorten scroll journey; no jump on orientation/resize.

### Phones 360–599

- The initial viewport MUST simultaneously show photo-based sakura, recognisable terrace, large title, booking affordance.
- Screen-specific crop from actual portrait daytime photo may be *higher fidelity* than desktop source. Prioritize real blossoms x≈center/right, some pale blue sofa low viewport.
- Wordmark roughly x=20..360, y=230..490; use two art-directed lines, no silly 4-line wrapping or 10px tiny text. Prefer x alignment allowing blossoms on top of a segment of title.
- Hero scroll invitation optional and unobtrusive; bottom UI above device safe area.
- Transition can collapse to simpler two-image masked reveal if full pinned scrub is unstable. Minimal scene distance; user can scroll to menu/contacts without scroll hijacking.
- Menu rows full width, 16px copy, prices never truncated; category strip swipeable without hiding focus.
- Footer contact information tap-friendly; avoid tiny low-contrast headings.
- Honor `env(safe-area-inset-*)`, reduced motion, virtual keyboard and dynamic viewport heights.

**No desktop-only feature may silently disappear if it contains critical content or navigation.** Decorative branches can simplify. Never force `overflow:hidden` on document body just to hide a layout defect.

---

## 10. TECHNICAL IMPLEMENTATION — YOUR CALL, BUT THESE DEFAULTS ARE DELIBERATE

### 10.1 Stack

Preferred: **Vite + React + TypeScript strict + scoped CSS or carefully structured plain CSS + GSAP ScrollTrigger** for the cinematic narrative. Version-select responsibly from actually installed/current packages and official docs; lock dependencies. No heavyweight UI kit needed for this editorial venue site. Do NOT bring in Next.js SSR, a database, Three.js, WebGL, Framer Motion, shadcn or 10 icon packages because available skills mention them. Add one dependency only when it solves a real requirement. HTML semantic markup and CSS images can provide most of the richness.

Suggested architecture (adapt only with justification):

```
src/
  app/App.tsx
  components/Header.tsx
  components/MobileMenu.tsx
  features/hero/HeroJourney.tsx
  features/hero/useBlossomTimeline.ts
  features/hero/HeroScene.tsx
  features/atmosphere/Atmosphere.tsx
  features/terrace/Terrace.tsx
  features/menu/Menu.tsx
  features/gallery/Gallery.tsx
  features/contacts/Visit.tsx
  components/Footer.tsx
  data/venue.ts
  data/assets.ts
  data/menu.ts
  styles/tokens.css
  styles/global.css
  styles/hero.css
  styles/sections.css
  styles/responsive.css
public/assets/
research/assets/          # PRIVATE / NOT PUBLISHED without licensing
research/ASSET_SELECTION.md
screenshots/              # QA output
```

Use native CSS image masks and source assets; pre-render alpha matte masks offline when possible. No per-frame React re-render from scroll. GSAP sets transforms/opacity on DOM refs; state-driven logic only for menu/visibility and genuine interactions. Respect StrictMode lifecycle cleanup. Refresh ScrollTrigger once photos decode and once fonts are ready; do not create a loop of forced refreshes. ResizeObserver where justified only.

### 10.2 Image performance

- Use real intrinsic dimensions and crop focus points in metadata.
- Generate responsive `srcset` / `<picture>` variants for master photos only if you have legal source originals; use WebP/AVIF as appropriate and jpg fallback.
- Don't accidentally resize original larger *in CSS* than its pixel width on 2x retina; use image width required by rendered CSS × DPR as a guideline, balanced against download weight. A 960px source spread to 1440CSSpx is unacceptable.
- LCP image: high fetch priority + preload only actual visible initial day master; do not lazy load it. Night master may be preloaded opportunistically or eagerly when transition becomes near; all later gallery assets lazy.
- Responsive sizes accurate; no original 10MB images for tiny thumbnails.
- Avoid heavy CSS filter blur across full 4K images on every scroll tick. Use preprocessed colors and transform/opacity; animate stable layers.

### 10.3 Font performance

Load max two final families, necessary weights only; use CSS variable font if sensible, self-host or trusted source with correct licenses. Font swap must not cause a giant brand reflow while scrolling; preload main heading weight. Perform layout after fonts settle.

### 10.4 Semantics / accessibility

Landmark `<header>`, `<main>`, `<nav>`, `<footer>`. One accessible `<h1>` for brand; on-screen wordmark may contain spans. Subheads in hierarchical order. Decorative layers `aria-hidden`. All links actually navigable; no clickable div masquerading as button; no mobile `hover`-only functionality. Readable contrast and sufficient hit targets; keyboard focus visible on dark/light scenes; reduced-motion mode eliminates pinned disorienting movement. Meaningful alt text in Russian, no alt for purely decorative duplicates. Lightbox keyboard accessible.

### 10.5 Motion robustness

- Timeline synchronized with position, not with timed state variables that drift.
- Reverse scroll and route anchor scrolling never cause stuck images.
- No body scroll lock for main hero, no forced scroll snapping, no wheel/touch listeners that prevent standard scrolling.
- Handle browser back/forward, starting at hash route and orientation changes.
- Distinguish UI overlay state from scrub timeline state; no stale filters after header color change.
- Test Safari/WebKit or equivalent if tool support; include fallback where mask compositor lacks precision.

---

## 11. DESIGN SKILLS AND TOKEN-EFFICIENT EXECUTION

Available in the owner's Claude environment (already checked and active): `design-taste-frontend`, `ui-ux-pro-max`, `high-end-visual-design`, `redesign-existing-projects`, official `frontend-design`, official `playwright`; additional workflow plugins exist. **Do not install any of them again.** Figma and Context7 tool servers were reported installed but not authenticated. Do not spend tokens attempting to use them unless the task specifically depends on their capabilities and authorization becomes available.

For this task:

1. Primary visual guidance: `design-taste-frontend` **once**, when laying out scene and art direction, if not already in context. Don't load four overlapping 1000-line visual skills in a single pass.
2. `ui-ux-pro-max` **targeted lookups only** when needed for typography/accessibility/mobile menu, not 200 irrelevant palette suggestions.
3. `playwright` official when actually taking QA screenshots and verifying interactions, not repeatedly throughout every CSS tweak.
4. `redesign-existing-projects` only if the fresh branch unexpectedly depends on old production code; otherwise skip.
5. Do NOT invoke costly multi-agent swarms for a landing page.

**Context discipline:** Read this master once as instruction; treat project notes as concise index. Probe filenames (`rg --files`, `ls`) before opening full source files. Don't paste multi-megabyte files or entire skill documents into chat responses. Execute deterministic image validation, duplicate detection, build/test/thumbnail generation with local scripts instead of asking the model to manually reason through repetitive rows. Batch related visual fixes. After completing a milestone, respond briefly: outputs/screenshots, checked items, blockers. Avoid narrating every tool call.

**Project memory:** create short `CLAUDE.md` (≤150–200 lines) with durable invariants, links to THIS detailed master and `ASSET_SELECTION.md`, project run/test commands and current art direction. Do not paste the entire master into `CLAUDE.md` or import it automatically every session. Preserve it as `docs/MASTER_SPEC.md`, read relevant sections on demand. Remember this is a new build, not incremental patching of old hero.

**Model use:** high reasoning only for image selection/complex transition and visual diagnosis; ordinary coding, asset processing and tests can be done with less costly available modes/agents when configured. Do not claim that using multiple agents necessarily reduces total tokens.

---

## 12. SEQUENTIAL EXECUTION AND ACCEPTANCE GATES

**One master brief, staged implementation.** You should finish a beautiful website; do not stop after writing a plan, but don't proceed past a failed visual gate pretending it's done. One substantial task, one repo, clear QA artifacts.

### Gate A — Asset reality

A1. Inspect local assets, manifest, selected venue source URLs, dimensions and content.  
A2. Source the highest-quality actual venue photos that are publicly and legitimately accessible, using Claude Code browser/network tools as permitted. Track rights separately: images with unverified publication rights are private research references, not cleared deployment assets.  
A3. Curate the best specific day/night master pair; prepare alpha matte plan.  
A4. Save `research/ASSET_SELECTION.md`: exact photo filenames, dimensions, provenance, rights, crop focus x/y, limitations.  
A5. If masters don't exist, DO NOT invent: build editorial prototype using the best bounded real images, clearly mark `HERO_ASSET_GATE: BLOCKED — need high-resolution landscape originals`. Continue building functional structure and prototype, but retain visual gate failure in final report.

### Gate B — 3-frame static visual proof

Before full animation, create actual renderable stills of **F0 DAY**, **F3 BLOOM CURTAIN** and **F5 NIGHT** with correct real photos and typography. Evaluate from screenshots at 1440×900, plus mobile F0 at 390×844. Do not proceed with complicated scrolling until stills look plausible. Log any crop/image resolution failures. Required visual priorities: sakura+terrace visible, giant wordmark, letters behind blossom matte, authentic room architecture at night. A video of a badly composed still is still bad design.

### Gate C — Motion

Implement ScrollTrigger narrative with F0–F5 above. Test stop points at scroll progress [0, .18, .38, .54, .78, 1]. Screenshot **each of those six progress values** at 1440×900; take scroll forward AND reverse recording. Inspect five previous failure symptoms and require zero: gray sky/midpoint, obvious mismatched trunk morph, black/plum blank screen, blurry full-bleed photo, disconnected tiny inset photo.

### Gate D — Whole restaurant site

Build atmosphere, terrace, menu, gallery, contacts, footer to exact chapter structure. Ensure every public-facing claim/link is grounded. Finish responsive layouts with functional booking (phone) and map links. Missing real menu → honest external source link and data model; never invented dish prices. At least one interactive navigation path from top to menu and one to contact/booking.

### Gate E — QA and delivery

Capture annotated or enumerated screenshots at all required widths; compare the site first against the design directions, THEN optimize code. Visually inspect real render rather than relying on the successful build signal. Verify all nav, gallery, booking and route links; phone href, scroll state after mobile menu, focus, reduced motion. Run TypeScript and build; smoke-test runtime errors and missing image URLs. Create `screenshots/` and `QA_REPORT.md` with PASS/FAIL for every major requirement and specific screenshot paths.

**Acceptance list** (all true for FINAL visual approval):

- [ ] First desktop frame is a compelling authentic **sakura + terrace** photograph composition, NOT flower-only or generic blue sky.
- [ ] `SORRY MAMA` extremely large, typographically strong, partially **covered by real blossoms**, legible enough.
- [ ] No stretched 960px photo as a 1440–1920px hero; high-res images or explicitly unapproved fallback.
- [ ] Mid-scroll flowers cover scene; no flat gray wash, false tree morph, opacity-only title removal or faux Japanese assets.
- [ ] Final night frame clearly shows restaurant architecture and warm lights; scene contains no giant solid plum void.
- [ ] Continuation of night into atmosphere feels designed, not a generic photo+paragraph template.
- [ ] Fresh terrace chapter has a distinct editorial composition, and actual menu path exists.
- [ ] CTA `Забронировать` has a real action; all other visible interactions have proper links/states.
- [ ] Contact/address/phone checked, no fraudulent confirmation flows or third-party gambling links.
- [ ] Mobile 390×844 starts with recognisable venue + bold brand + CTA; scroll works and reduced motion is safe.
- [ ] No fake client quotes, scores, awards, dish names, prices, false official affiliation or unverified rights claims.
- [ ] Browser screenshots, mobile screenshots, both-direction scroll screen recording and QA report exist.

### Final report format — no verbose self-congratulation

1. `Built`: repo path, startup command, demo URL if actually running.  
2. `Assets`: selected file names / dimensions / source / permissions and explicit gate status.  
3. `Visual`: links to desktop/mobile screenshot series and scroll clip.  
4. `QA`: concise pass/fail counts and major outstanding issues.  
5. `Missing real-world inputs`: only facts/permission/data genuinely needed from the owner.  
6. `Next action`: one clearly proposed action.  
Never claim tasks/tests/rights are completed without actual evidence.

---

## 13. OFFICIAL IMPLEMENTATION REFERENCES — READ ONLY WHEN NECESSARY

Use these precise references as implementation documentation, **not** as alternative art direction:

- GSAP ScrollTrigger official: https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- GSAP React integration / cleanup: https://gsap.com/resources/React/
- Vite official: https://vite.dev/guide/
- React documentation: https://react.dev/learn
- TypeScript documentation: https://www.typescriptlang.org/docs/
- Web accessibility guidelines WCAG 2.2: https://www.w3.org/TR/WCAG22/
- MDN CSS masks: https://developer.mozilla.org/en-US/docs/Web/CSS/mask-image
- MDN reduced motion: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- Google Fonts Unbounded: https://fonts.google.com/specimen/Unbounded
- Google Fonts Onest: https://fonts.google.com/specimen/Onest
- Performance / LCP: https://web.dev/articles/optimize-lcp
- Official Claude Code memory: https://code.claude.com/docs/en/memory
- Official Claude Code best practices: https://code.claude.com/docs/en/best-practices
- Actual venue 2GIS photos: https://2gis.ru/kazan/firm/70000001034900657/tab/photos
- Actual venue Yandex Maps photos: https://yandex.com/maps/org/sorry_mama/169351776272/gallery/

**Final imperative:** Don't ask the owner how to program. Use technical judgment and real photographic materials to make a contemporary, beautiful, credible restaurant website. If the perfect photograph doesn't exist, state the truth instead of manufacturing visual success. No more endless patches over the previous failed Hero.
