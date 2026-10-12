/*
 * Menu data model — Phase 02.
 * Filled only by transcribing the venue's real menu once it is supplied.
 * Nothing here is rendered until then: no invented dishes, no invented prices.
 */

export type MenuItem = {
  name: string;
  price: number; // ₽, as printed
  description?: string;
  image?: string;
  available?: boolean;
};

export type MenuCategory = {
  category: string;
  items: MenuItem[];
};

export const MENU: MenuCategory[] = [];
