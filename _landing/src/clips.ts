// Works that have a video preview at public/clips/<slug>.mp4 (recorded and
// encoded by _ai/portfolio/.work/clips.mjs and clips-encode.mjs). A slug listed
// here gets the clip on its card; remove it to fall back to the still image.
// Clips are for works with something to operate (clicks, forms, a product UI);
// visual works get a living cover instead (ambient.css, cover hover in styles.css).
export const CLIPS = new Set<string>([
  'assistant',
  'crm',
  'epc',
  'facemail',
  'kvit',
  'lumi',
  'miniapp',
  'nexus',
  'orderradar',
  'servicebot',
]);
