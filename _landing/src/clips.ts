// Works that have a video preview at public/clips/<slug>.mp4 (recorded and
// encoded by _ai/portfolio/.work/clips.mjs and clips-encode.mjs). A slug listed
// here gets the clip on its card; remove it to fall back to the still image.
export const CLIPS = new Set<string>([
  'afterimage',
  'assistant',
  'brightline',
  'crm',
  'epc',
  'facemail',
  'key01',
  'kvit',
  'lumi',
  'miniapp',
  'nexus',
  'noctis',
  'null',
  'orderradar',
  'roman',
  'servicebot',
  'sorrymama',
  'witcher',
]);
