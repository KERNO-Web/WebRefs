// What the homepage shows is decided by one file in the repository,
// src/site-settings.json: the pinned project and the hidden ones. It is baked
// in at build time, so the page never waits for a network call. The hidden
// admin edits that file through the GitHub API, and the Pages workflow
// rebuilds the site.
import raw from './site-settings.json';
import { DEFAULT_FEATURED, PROJECTS, bySlug, type Project } from './projects';

export interface SiteSettings {
  featured: string;
  hidden: string[];
}

export const REPO = 'KERNO-Web/WebRefs';
export const SETTINGS_PATH = '_landing/src/site-settings.json';

export function normalize(s: Partial<SiteSettings>): SiteSettings {
  const hidden = (s.hidden ?? []).filter((slug) => bySlug(slug));
  let featured = s.featured && bySlug(s.featured) && !hidden.includes(s.featured) ? s.featured : DEFAULT_FEATURED;
  if (hidden.includes(featured)) featured = PROJECTS.find((p) => !hidden.includes(p.slug))?.slug ?? DEFAULT_FEATURED;
  return { featured, hidden };
}

export const SETTINGS: SiteSettings = normalize(raw as Partial<SiteSettings>);

/** Projects shown on the homepage, pinned one first. */
export function visibleProjects(s: SiteSettings = SETTINGS): { featured: Project; rest: Project[] } {
  const shown = PROJECTS.filter((p) => !s.hidden.includes(p.slug));
  const featured = shown.find((p) => p.slug === s.featured) ?? shown[0];
  return { featured, rest: shown.filter((p) => p !== featured) };
}
