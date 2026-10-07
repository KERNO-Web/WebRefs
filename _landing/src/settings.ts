// The pinned project lives in one Supabase row (see README.md for the SQL).
// Visitors only read it, with the public anon key and a plain REST call, so the
// Supabase client is loaded only for the admin panel. Without configuration, or
// if Supabase does not answer in time, the page uses DEFAULT_FEATURED.
import type { SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_FEATURED, bySlug } from './projects';

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(URL && KEY);

export async function readFeaturedSlug(timeoutMs = 2500): Promise<string> {
  if (!supabaseConfigured) return DEFAULT_FEATURED;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${URL}/rest/v1/portfolio_settings?id=eq.1&select=featured_project_slug`, {
      headers: { apikey: KEY!, Authorization: `Bearer ${KEY}` },
      signal: ctrl.signal,
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(String(res.status));
    const rows = (await res.json()) as { featured_project_slug: string }[];
    const slug = rows[0]?.featured_project_slug;
    return bySlug(slug) ? slug! : DEFAULT_FEATURED;
  } catch {
    return DEFAULT_FEATURED;
  } finally {
    clearTimeout(timer);
  }
}

let client: SupabaseClient | null = null;

export async function adminClient(): Promise<SupabaseClient> {
  if (!supabaseConfigured) throw new Error('Supabase не настроен');
  if (!client) {
    const { createClient } = await import('@supabase/supabase-js');
    client = createClient(URL!, KEY!, { auth: { persistSession: true, storageKey: 'kerno-admin' } });
  }
  return client;
}
