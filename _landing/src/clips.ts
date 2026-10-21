// Works whose card cover is a 5 s loop at public/clips/<slug>.mp4: the screen on
// the cover's device steps through three states, or plays the work's own live
// motion (NULL, Зельеварня). Rendered from the same
// template as the still covers (_ai/portfolio/.work/covers-web/cover.html, see
// covers-render.mjs). The rest of the covers are stills that drift (styles.css).
export const CLIPS = new Set<string>(['kvit', 'crm', 'assistant', 'servicebot', 'miniapp', 'noctis', 'null', 'zelevarnya']);
