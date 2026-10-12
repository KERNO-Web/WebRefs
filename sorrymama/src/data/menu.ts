/*
 * Menu model. Empty on purpose: filled only from the venue's real menu (owner-supplied takes priority
 * over third-party copies). Never invent dishes or prices.
 */
export type MenuItem = { name: string; price: number; description?: string; weight?: string; image?: string; available?: boolean };
export type MenuCategory = { id: string; category: string; items: MenuItem[] };

export const menu: MenuCategory[] = [];
