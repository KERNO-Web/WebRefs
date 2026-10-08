// What the homepage shows is decided by one file in the repository,
// src/site-settings.json: the pinned projects (up to two), the order of the
// works and the hidden ones. It is baked in at build time, so the page never
// waits for a network call. The hidden admin edits that file through the
// GitHub API, and the Pages workflow rebuilds the site.
import raw from './site-settings.json';
import { DEFAULT_FEATURED, PROJECTS, bySlug, type Project } from './projects';

export interface SiteSettings {
  /** pinned projects, shown first and large; one or two */
  featured: string[];
  /** every project slug, in homepage order */
  order: string[];
  hidden: string[];
}

export const MAX_PINNED = 2;
export const REPO = 'KERNO-Web/WebRefs';
export const SETTINGS_PATH = '_landing/src/site-settings.json';

const uniq = (list: string[]) => [...new Set(list)];

/** Accepts the current shape and the older `featured: "slug"` one. */
export function normalize(s: Partial<Omit<SiteSettings, 'featured'>> & { featured?: string | string[] }): SiteSettings {
  const known = (slug: unknown): slug is string => typeof slug === 'string' && Boolean(bySlug(slug));
  const hidden = uniq((s.hidden ?? []).filter(known));
  // projects added later than the saved order simply go to the end
  const order = uniq([...(s.order ?? []).filter(known), ...PROJECTS.map((p) => p.slug)]);
  const wanted = Array.isArray(s.featured) ? s.featured : s.featured ? [s.featured] : [];
  let featured = uniq(wanted.filter(known))
    .filter((slug) => !hidden.includes(slug))
    .slice(0, MAX_PINNED);
  if (!featured.length) {
    const fallback = !hidden.includes(DEFAULT_FEATURED) && bySlug(DEFAULT_FEATURED) ? DEFAULT_FEATURED : order.find((slug) => !hidden.includes(slug));
    featured = fallback ? [fallback] : [];
  }
  // pinned ones follow the general order too
  featured.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return { featured, order, hidden };
}

export const SETTINGS: SiteSettings = normalize(raw as Parameters<typeof normalize>[0]);

/** Projects shown on the homepage: pinned first, then the rest in order. */
export function visibleProjects(s: SiteSettings = SETTINGS): { featured: Project[]; rest: Project[] } {
  const shown = s.order.filter((slug) => !s.hidden.includes(slug)).map((slug) => bySlug(slug)!);
  const featured = shown.filter((p) => s.featured.includes(p.slug));
  if (!featured.length && shown[0]) featured.push(shown[0]);
  return { featured, rest: shown.filter((p) => !featured.includes(p)) };
}
