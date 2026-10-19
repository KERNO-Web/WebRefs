# ЗЕЛЬЕВАРНЯ — grimoire cocktail bar concept site (2026-10-19)

Communicate with Sergey in Russian. Keep progress updates and the final response in Russian.
Code, filenames and identifiers may stay in English. Visible site copy: RU.
Category: A (visual showcase) with a light C layer (menu + table booking). Repo: `Vibecode/Examples/zelevarnya/` inside the WebRefs monorepo. New project. When done: add to `_landing/src/projects.ts`, commit + push to main (standing rule for Examples).

## 0 — Starting point
- Trigger: Sergey saw dysphoria.ru (Tilda Zero, Druk, monochrome + brick red, grain, technical line graphics). What he liked: ONE unique visual system soaks every block, not "aesthetics". He wants the same principle in fantasy, not cyber.
- His exact words: «чтобы духом фентези было пронизано всё — щупальцы которые появляются, какие то магически символы, знаки, котел варить… просто по максимуму пичкануть».
- Explicit anti-reference: our own Witcher showcase, whose visual = game screenshots and dev art. Here the site DRAWS its world itself.
- Fictional bar. The whole site is a concept, labelled «Концепт KERNØ. Бар вымышленный» in the footer and booking success state.
- Out of scope: real backend, payments, CMS, EN version.

## 1 — Governance
- Read only: this brief, `Examples/witcher/package.json` + `vite.config.ts` (stack parity), `_landing/src/projects.ts` (card format). Don't rescan other portfolio projects.
- I decide: stack, file structure, motion lib, exact coordinates. The one creative decision that was Sergey's: style «гримуар» (approved 2026-10-19) and niche «коктейльный бар» (approved).
- Skills: `design-taste-frontend` (main taste reviewer, anti-slop pass at every gate) + `ui-ux-pro-max` (booking form UX, type pairing check). Not loading high-end-visual-design / frontend-design (overlap). QA via built-in browser pane.
- Gates:
  - Gate A — ink system: parchment, hatching, ink-roughness filter, palette, 2 fonts on one test frame. Screenshot.
  - Gate B — STATIC hero + one menu spread + floor-plan frame, 1440×900 and 390×844. If the static doesn't read as an engraved grimoire, fix composition before any motion.
  - Gate C — motion: tentacles, rune reveals, cauldron steam/bubbles, page flip, potion colour change. One timeline per section, reduced-motion fallback.
  - Gate D — rest of page.
  - Gate E — booking flow states + QA matrix + build.

## 2 — The one idea
**«Сайт — это гримуар алхимика».** Every pixel is printed in ink on parchment, as an old engraving; the only non-ink colour is the potion itself: absinthe green that glows. Colour = magic. Everything that is magic (liquids, runes when active, the CTA, the selected table, the wax seal) is green. Everything else is ink.

Emotional priorities: 1 «ебать, это всё нарисовано» 2 «хочу прочитать каждую страницу» 3 «одержимая детализация» 4 «понятно, как забронировать стол».

"Maximum" is NOT to be reinterpreted as: clipart pile, Halloween orange/purple, Harry Potter font, glowing neon everywhere, random stock potions, emoji-runes, dark-mode-with-sparkles, glassmorphism, 3D blobs. Density yes, but ONE technique: line engraving + hatching. Nothing filled with flat vector colour except the green potion.

## 3 — Content (concept; prices are concept prices, labelled as concept site-wide)
- Bar name: **Зельеварня**. Tagline: «Коктейльный бар, где напитки варят, а не мешают».
- Hero subhead: «Восемь зелий по старой книге рецептов. Дым под колпаком, напиток, который меняет цвет, и стол у котла».
- CTAs: «Забронировать стол» (primary, green) · «Открыть книгу рецептов» (ink, secondary).
- Hours (concept): ежедневно 18:00–03:00.

Menu = «Книга рецептов» (based on real bar techniques, so believable):
1. **Зелье невидимости** — джин на цветках анчана, тоник, лимон. Синий в бокале, розовеет, когда добавляешь лимон. 650 ₽
2. **Дыхание дракона** — мескаль, перец чили, копчёный ананас. Подаётся с пузырём дыма. 720 ₽
3. **Отвар болотной ведьмы** — абсент, базилик, лайм, огурец. Под стеклянным колпаком с дымом розмарина. 690 ₽
4. **Слеза русалки** — ром, голубой кюрасао, кокос, съедобный перламутр, который кружится в бокале. 640 ₽
5. **Эликсир мандрагоры** — бурбон, свёкла, имбирь, мёд. Корень на шпажке. 680 ₽
6. **Порох алхимика** — виски, кофе, апельсин, горящая корица. 700 ₽
7. **Лунная вода** (б/а) — анчан, бузина, лимонад. Тоже меняет цвет. 390 ₽
8. **Кровь василиска** (б/а) — зелёное яблоко, огурец, розмарин, содовая (кровь у василиска зелёная, держим систему «магия = зелёный»). 390 ₽
Each recipe page: name, engraved vessel, ingredients as alchemical glyphs + words, «Эффект» line (playful one-liner, e.g. «Эффект: на час перестаёшь отвечать в рабочем чате»), price.

«Ритуал» (how it's served), 3 steps: «Варим» (котёл, настойки) → «Дымим» (колпак, пузырь дыма) → «Подаём» (напиток меняет цвет у вас на глазах).

Booking copy: «Выберите стол на карте зала», fields Дата, Время, Гостей, Имя, Телефон. Success: «Печать поставлена. Это концепт: бар вымышленный, бронь никуда не ушла».

## 4 — Assets
- UPDATE 2026-10-19 (Sergey: «зелья должны быть не рисунками, а реальными коктейлями, больше»; fal не использовать никогда): menu = 12 real CC0/CC BY/CC BY-SA photos from Wikimedia Commons (public/potions, 800×1000, credits in data.ts + footer), pink variants recoloured locally (.work/pinkify.mjs); ritual = Mixkit free videos 4172 + 4416 (public/video). Drawn vessels stay only as fallback.
- No photos. Everything is SVG/Canvas drawn in code, consistent engraving technique:
  - parchment: CSS + SVG feTurbulence noise, warm vignette, foxing spots;
  - ink roughness: shared SVG filter (feTurbulence + feDisplacementMap, scale ~1.2) on all line art;
  - hatching: SVG `<pattern>` line hatch at 3 densities (light/mid/dark) used for shading every object;
  - objects: cauldron, 8 vessels (flask, alembic, bell jar, skull goblet, vial, horn, coupe, retort), tentacles, rune ring, alchemical glyphs, floor plan, wax seal, frame ornaments.
- Optional (Sergey decides): fal-generated engravings for the 8 vessels + cauldron in one fixed style, traced/tinted to ink. Default if no answer: pure code.
- Fonts (Cyrillic verified, Google Fonts): **Cormorant Unicase** (display, small-caps feel of old print) + **Cormorant Garamond** (body, italics for «Эффект»). Fallback audition if Cyrillic display feels weak: Ruslan Display for the logo only.

## 5 — Layout (1440×900, then 390×844)
Palette tokens: `--parchment #E9DCC0`, `--parchment-deep #D8C6A0`, `--ink #1E1812`, `--ink-soft #4A3F33`, `--potion #7BD63A` (glow `rgba(123,214,58,.45)`), `--wax #3E7A22`. No other hues.

1. **Hero «Обложка»** — centre: engraved cauldron (≈560px wide) on a tripod over hatched fire, green liquid with bubbles; around it a rune ring (≈780px) that rotates 1 turn / 120s. Title «Зельеварня» in Cormorant Unicase ≈140px set ON an arched baseline above the cauldron. Two tentacles enter from bottom-left and top-right frame corners. Subhead + 2 CTAs bottom-left. Ornamented frame border on the whole viewport (book page). Focal point: the green liquid.
2. **«Книга рецептов»** — an open book spread (≈1200×720): left page = engraved vessel big + glyph ingredients, right page = name, recipe, effect, price. Page flip (prev/next, swipe on mobile, arrow keys). Index of 8 potions as tab-ribbons on the book's edge. Signature interaction: for «Зелье невидимости» / «Лунная вода» a lemon button «Капнуть лимон» turns the potion blue → pink (pH, real effect).
3. **«Ритуал»** — alchemical plate: 3 engraved diagrams connected by a dashed ink path, numbered with alchemical numerals. Steam/smoke draws itself on scroll.
4. **«Зал»** — floor plan engraved like a dungeon map: bar counter, the cauldron table in the centre, 8 tables with rune markers, compass rose. Hover/tap table → green highlight + seats count. Selecting a table fills the booking form.
5. **«Бронь»** — the form as a parchment slip with a wax-seal submit button. On submit the seal stamps (scale + green wax splash).
6. **Footer** — hours, «Концепт KERNØ. Бар вымышленный», the rune alphabet strip, link to t.me/Kernodev.
Tentacles appear from section edges across the page (3–4 total, not on every block), always curling from behind frame ornaments, never covering text.
Mobile: book becomes a single page with flip; map pinch-free, tables as larger hit areas; hero cauldron ≈320px, title ≈64px on two lines.

## 6 — Typography
Display: Cormorant Unicase 600, titles 64–140px clamp, line-height .95. Body: Cormorant Garamond 500, 19/1.5 desktop, 17/1.5 mobile (Cormorant runs small). Labels: Cormorant Unicase 600 14px, tracking .06em max. Prices in Cormorant Garamond with lining numerals. Non-breaking spaces after в/к/с/и/на/за/по/у/о.

## 7 — Motion
- Sergey 2026-10-19: «будто в мультике рисуют анимацию карандашом, покадровая анимация щупалец» → everything alive runs on a 12 fps clock (on twos) with a 3-variant line-boil filter swapped every frame; tentacles, flames, steam and bubbles are redrawn per frame with jitter; page flip / colour change use steps() easing.
- Library: GSAP + ScrollTrigger (free). One timeline per section.
- Hero on load (≈2.2s): frame ornaments draw (stroke-dashoffset) → cauldron ink draws → liquid fills green → tentacles slide/curl in → title letters ink-bleed in. Then idle: bubbles rise, steam paths drift, rune ring rotates.
- Runes: each section's corner runes draw themselves on enter and glow green 600ms, then settle to ink.
- Tentacles: SVG path with animated control points (sine), curl on enter, slight sway idle, retreat on leave. Cursor proximity makes the nearest tentacle tip twitch (desktop only).
- Page flip: 3D rotateY page turn 700ms, power2.inOut; mobile swipe.
- Colour change: liquid gradient interpolates blue→pink 1.6s with a swirl.
- `prefers-reduced-motion`: everything renders in its final drawn state, no idle loops, flip = crossfade.

## 8 — Functional layer
- Menu fully navigable by click, swipe, keyboard.
- Booking: table from map or select; date ≥ today; time 18:00–02:30 step 30 min; guests 1–8 capped by table seats; phone mask +7. States: invalid fields inline, submitting (seal spins), success (seal stamped + concept note). No network request; labelled as concept, not as integration.
- No dead links. Touch targets ≥44px.

## 9 — Anti-patterns
Clipart, Halloween palette, purple neon, sparkles/emoji, gradients other than potion liquid, rounded cards, feature-card grid, same layout section after section, photo assets, game art, fake reviews/ratings, a strong hero with a weaker rest, everything uppercase, grey text instead of hierarchy, tentacles over text.

## 10 — Acceptance
- Every viewport screenshot reads as an engraved grimoire page; only magic is green.
- Cyrillic renders in Cormorant at every size; no orphaned prepositions at 360px.
- Book flips both directions on desktop and mobile; lemon changes colour.
- Booking reaches success from the map at 390×844 and 1440×900.
- No horizontal scroll 320–1920; reduced-motion shows full drawings.
- `npm run build` passes; added to `_landing` projects; pushed.
- taste.md final self-check all «yes».

## 11 — QA
qa-protocol.md matrix: 360×640, 390×844, 844×390, 768×1024, 1366×768, 1440×900, 1920×1080. Screenshots in the built-in browser.

## 12 — Final response
Russian, ≤6 lines: what was built, what was checked (only what ran), what's left, local port + live link.
