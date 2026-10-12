/*
 * Menu model. Empty on purpose: filled only from the venue's real menu (owner-supplied takes priority
 * over third-party copies such as the 2GIS menu tab). Never invent dishes or prices.
 *
 * Photos: a dish photo is attached only when it unambiguously shows that dish.
 *   'exact'  — the photo shows this dish and nothing that could be mistaken for it → shown with the item
 *   'shared' — one photo with several dishes; which is which is unclear → not shown with the item
 *   absent   — no photo
 * Ambiguous items stay text-only until someone confirms the match.
 */
export type PhotoMatch = 'exact' | 'shared';
export type MenuItem = {
  name: string;
  price: number;
  description?: string;
  weight?: string;
  photo?: { src: string; match: PhotoMatch };
  available?: boolean;
};
export type MenuCategory = { id: string; category: string; items: MenuItem[] };

export const menu: MenuCategory[] = [];

/** The only photo a menu card may show next to a dish name. */
export const itemPhoto = (i: MenuItem) => (i.photo?.match === 'exact' ? i.photo.src : undefined);
