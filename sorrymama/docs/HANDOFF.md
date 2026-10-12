# Handoff — reborn build, 13.10.2026

Branch `sorry-mama-reborn` (repo KERNO-Web/WebRefs), project `sorrymama/`. Not pushed, not in the Pages workflow.

Accepted so far (pending owner review):
- Hero: day master 097 with keyed crown in front of `SORRY MAMA` (Unbounded 700), lit-petal curtain from 061 hides the cut, night master 085, caption «Лаунж под цветущим деревом». GSAP timeline in `src/features/hero/useBlossomTimeline.ts`, geometry in `layout.ts`.
- Chapters: Atmosphere (night continues), Terrace (light), Menu (2GIS link, empty model), Details gallery + lightbox, Как добраться, footer.

Open: owner originals ≥2400 px; photo rights; real menu → `src/data/menu.ts`; curtain over daylight (QA_REPORT issue 2); Safari test.
Mattes are regenerated with the Playwright canvas script described in docs/ASSET_SELECTION.md (rules: pink/branch + closing for the crown; pink/sparks for the curtain).
