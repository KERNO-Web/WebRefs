export type Status = 'processing' | 'shipped' | 'in_transit' | 'customs' | 'out_for_delivery' | 'delivered' | 'delayed';
export type Carrier = 'NorthPost' | 'ExpressOne' | 'Global Parcel' | 'DHL' | 'FreshCart' | 'City Courier';

export interface TrackEvent { label: string; at: string | null; place?: string }
export interface Shipment {
  id: string;
  product: string;
  store: string;
  carrier: Carrier;
  tracking: string;
  status: Status;
  eta: string; // ISO date (day)
  window?: string; // e.g. 14:00–17:00
  origin: string;
  destination: string;
  weight: string;
  updated: string; // ISO datetime
  events: TrackEvent[];
  delay?: { reason: string; detail: string; was: string };
  delivered?: { at: string; leftAt: string };
  archived?: boolean;
  kind: 'parcel' | 'groceries' | 'documents' | 'box';
  added?: boolean;
  issue?: string;
}

/** Demo clock: Tuesday, October 6, 11:20 */
export const NOW = new Date(2026, 9, 6, 11, 20);
const d = (day: number, h = 0, m = 0) => new Date(2026, 8 + (day < 15 ? 1 : 0), day, h, m).toISOString();

export const SEED: Shipment[] = [
  {
    id: 's1', product: 'Running Shoes', store: 'Nike', carrier: 'DHL', tracking: '9482 1170 3364', status: 'out_for_delivery',
    eta: d(6), window: '14:00–17:00', origin: 'Leipzig, DE', destination: 'Lindenstraße 14, Berlin', weight: '1.2 kg', updated: d(6, 8, 31),
    kind: 'box',
    events: [
      { label: 'Order received', at: d(28 - 0, 10, 42), place: 'Nike Store Online' },
      { label: 'Shipped', at: d(29, 8, 14), place: 'Leipzig, DE' },
      { label: 'Regional facility', at: d(3, 22, 8), place: 'Berlin-Schönefeld' },
      { label: 'Out for delivery', at: d(6, 8, 31), place: 'Berlin-Mitte depot' },
      { label: 'Delivered', at: null },
    ],
  },
  {
    id: 's2', product: 'Groceries', store: 'FreshCart', carrier: 'FreshCart', tracking: 'FC-77120', status: 'delivered',
    eta: d(6), window: '08:30–09:30', origin: 'FreshCart Hub Kreuzberg', destination: 'Lindenstraße 14, Berlin', weight: '6.4 kg', updated: d(6, 9, 0),
    kind: 'groceries', delivered: { at: d(6, 9, 0), leftAt: 'Handed to resident' },
    events: [
      { label: 'Order received', at: d(5, 19, 3) },
      { label: 'Packed', at: d(6, 7, 40), place: 'FreshCart Hub Kreuzberg' },
      { label: 'Out for delivery', at: d(6, 8, 22) },
      { label: 'Delivered', at: d(6, 9, 0) },
    ],
  },
  {
    id: 's3', product: 'Documents', store: 'Notary Weber & Co.', carrier: 'ExpressOne', tracking: 'EX20447815', status: 'in_transit',
    eta: d(6), window: 'around 12:30', origin: 'Hamburg, DE', destination: 'Lindenstraße 14, Berlin', weight: '0.2 kg', updated: d(6, 7, 55),
    kind: 'documents',
    events: [
      { label: 'Picked up', at: d(5, 16, 10), place: 'Hamburg, DE' },
      { label: 'Overnight hub', at: d(5, 23, 40), place: 'Hannover hub' },
      { label: 'Arrived in Berlin', at: d(6, 7, 55), place: 'Berlin-Tempelhof' },
      { label: 'Out for delivery', at: null },
      { label: 'Delivered', at: null },
    ],
  },
  {
    id: 's4', product: 'Wireless Headphones', store: 'Sonora', carrier: 'NorthPost', tracking: 'NP51099264', status: 'shipped',
    eta: d(8), origin: 'Rotterdam, NL', destination: 'Lindenstraße 14, Berlin', weight: '0.6 kg', updated: d(5, 17, 20), kind: 'box',
    events: [
      { label: 'Order received', at: d(4, 13, 2), place: 'sonora.store' },
      { label: 'Shipped', at: d(5, 17, 20), place: 'Rotterdam, NL' },
      { label: 'In transit', at: null },
      { label: 'Delivered', at: null },
    ],
  },
  {
    id: 's5', product: 'Ceramic Vase', store: 'Atelier Nord Keramik', carrier: 'Global Parcel', tracking: 'GL7730015521', status: 'customs',
    eta: d(9), origin: 'London, UK', destination: 'Lindenstraße 14, Berlin', weight: '2.1 kg', updated: d(6, 6, 12), kind: 'parcel',
    events: [
      { label: 'Shipped', at: d(1, 11, 30), place: 'London, UK' },
      { label: 'Left origin country', at: d(3, 4, 15), place: 'London Heathrow' },
      { label: 'Customs clearance', at: d(6, 6, 12), place: 'Frankfurt customs' },
      { label: 'Delivered', at: null },
    ],
  },
  {
    id: 's6', product: 'Winter Jacket', store: 'Northfield', carrier: 'NorthPost', tracking: 'NP48810233', status: 'delayed',
    eta: d(10), origin: 'Oslo, NO', destination: 'Lindenstraße 14, Berlin', weight: '1.8 kg', updated: d(5, 18, 5), kind: 'parcel',
    delay: { reason: 'Weather disruption', detail: 'Storm closed the Øresund crossing for 36 hours. The parcel is safe at the Malmö hub and leaves on the first truck.', was: d(7) },
    events: [
      { label: 'Shipped', at: d(2, 9, 0), place: 'Oslo, NO' },
      { label: 'Held at hub', at: d(5, 18, 5), place: 'Malmö, SE' },
      { label: 'In transit', at: null },
      { label: 'Delivered', at: null },
    ],
  },
  {
    id: 's7', product: 'Coffee Beans', store: 'Roastery Ost', carrier: 'City Courier', tracking: 'CC-30981', status: 'processing',
    eta: d(9), origin: 'Berlin-Friedrichshain', destination: 'Lindenstraße 14, Berlin', weight: '1.0 kg', updated: d(6, 10, 2), kind: 'box',
    events: [
      { label: 'Order received', at: d(6, 10, 2), place: 'roastery-ost.de' },
      { label: 'Roasting', at: null },
      { label: 'Shipped', at: null },
      { label: 'Delivered', at: null },
    ],
  },
  {
    id: 's8', product: 'Phone Case', store: 'Casely', carrier: 'ExpressOne', tracking: 'EX20511904', status: 'in_transit',
    eta: d(8), origin: 'Warsaw, PL', destination: 'Lindenstraße 14, Berlin', weight: '0.1 kg', updated: d(6, 5, 48), kind: 'parcel',
    events: [
      { label: 'Shipped', at: d(4, 15, 20), place: 'Warsaw, PL' },
      { label: 'In transit', at: d(6, 5, 48), place: 'Frankfurt (Oder)' },
      { label: 'Delivered', at: null },
    ],
  },
  {
    id: 's9', product: 'Desk Lamp', store: 'Lumen Studio', carrier: 'Global Parcel', tracking: 'GL7712093340', status: 'delivered',
    eta: d(5), origin: 'Copenhagen, DK', destination: 'Lindenstraße 14, Berlin', weight: '2.6 kg', updated: d(5, 15, 42), kind: 'box',
    delivered: { at: d(5, 15, 42), leftAt: 'Front desk' },
    events: [
      { label: 'Shipped', at: d(1, 12, 0), place: 'Copenhagen, DK' },
      { label: 'Regional facility', at: d(4, 21, 30), place: 'Berlin-Schönefeld' },
      { label: 'Out for delivery', at: d(5, 9, 10) },
      { label: 'Delivered', at: d(5, 15, 42) },
    ],
  },
  {
    id: 's10', product: 'Dual Monitor Arm, Gas Spring', store: 'ErgoWorks Office Supply', carrier: 'DHL', tracking: '9480 5521 0087', status: 'shipped',
    eta: d(12), origin: 'Munich, DE', destination: 'Lindenstraße 14, Berlin', weight: '3.4 kg', updated: d(6, 9, 30), kind: 'box',
    events: [
      { label: 'Order received', at: d(5, 11, 0) },
      { label: 'Shipped', at: d(6, 9, 30), place: 'Munich, DE' },
      { label: 'Delivered', at: null },
    ],
  },
  {
    id: 's11', product: 'Paperback Books ×3', store: 'Bookhaus', carrier: 'NorthPost', tracking: 'NP50022817', status: 'delivered',
    eta: d(28), origin: 'Cologne, DE', destination: 'Lindenstraße 14, Berlin', weight: '1.1 kg', updated: d(28, 13, 15), kind: 'box', archived: true,
    delivered: { at: d(28, 13, 15), leftAt: 'Mailbox' },
    events: [{ label: 'Shipped', at: d(25, 10, 0), place: 'Cologne, DE' }, { label: 'Delivered', at: d(28, 13, 15) }],
  },
  {
    id: 's12', product: 'Passport', store: 'Bürgeramt Mitte', carrier: 'City Courier', tracking: 'CC-29004', status: 'delivered',
    eta: d(24), origin: 'Berlin-Mitte', destination: 'Lindenstraße 14, Berlin', weight: '0.1 kg', updated: d(24, 11, 5), kind: 'documents', archived: true,
    delivered: { at: d(24, 11, 5), leftAt: 'Signed by resident' },
    events: [{ label: 'Ready', at: d(23, 9, 0) }, { label: 'Delivered', at: d(24, 11, 5) }],
  },
];

export const CARRIER_PATTERNS: { re: RegExp; carrier: Carrier }[] = [
  { re: /^(NP|RQ)\d{6,}$/i, carrier: 'NorthPost' },
  { re: /^EX\d{6,}$/i, carrier: 'ExpressOne' },
  { re: /^GL\d{6,}$/i, carrier: 'Global Parcel' },
  { re: /^\d{10,14}$/, carrier: 'DHL' },
];
export const detectCarrier = (raw: string) => {
  const v = raw.replace(/\s+/g, '').toUpperCase();
  return CARRIER_PATTERNS.find((p) => p.re.test(v))?.carrier ?? null;
};
const KNOWN: Record<string, { product: string; store: string; days: number }> = {
  RQ84299318: { product: 'Wireless Keyboard', store: 'Keyline', days: 3 },
};
const TRANSIT_DAYS: Record<Carrier, number> = { NorthPost: 3, ExpressOne: 1, 'Global Parcel': 5, DHL: 2, FreshCart: 0, 'City Courier': 1 };
export function lookup(raw: string) {
  const v = raw.replace(/\s+/g, '').toUpperCase();
  const carrier = detectCarrier(v);
  if (!carrier) return null;
  const k = KNOWN[v];
  const eta = new Date(NOW);
  eta.setDate(eta.getDate() + (k?.days ?? TRANSIT_DAYS[carrier]));
  return { tracking: v, carrier, product: k?.product ?? null, store: k?.store ?? carrier, eta: eta.toISOString() };
}

export const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const isActive = (s: Shipment) => s.status !== 'delivered' && !s.archived;
export const isToday = (s: Shipment) => sameDay(new Date(s.status === 'delivered' && s.delivered ? s.delivered.at : s.eta), NOW);
export const isThisWeek = (s: Shipment) => {
  const e = new Date(s.eta);
  const end = new Date(NOW); end.setDate(NOW.getDate() + (7 - NOW.getDay())); end.setHours(23, 59);
  return e >= new Date(2026, 9, 6) && e <= end;
};
export const inTransit = (s: Shipment) => ['shipped', 'in_transit', 'customs', 'out_for_delivery', 'delayed'].includes(s.status) && !s.archived;

/** Product photos (Unsplash, stored in /public/products). Anything unknown gets a plain parcel. */
const PHOTO: Record<string, string> = {
  'Running Shoes': 'shoes', Groceries: 'groceries', Documents: 'documents', 'Wireless Headphones': 'headphones', 'Ceramic Vase': 'vase',
  'Winter Jacket': 'jacket', 'Coffee Beans': 'coffee', 'Phone Case': 'phonecase', 'Desk Lamp': 'lamp', 'Dual Monitor Arm, Gas Spring': 'monitorarm',
  'Paperback Books ×3': 'books', Passport: 'passport', 'Wireless Keyboard': 'keyboard',
};
export const photoOf = (s: Shipment) => `${import.meta.env.BASE_URL}products/${PHOTO[s.product] ?? 'parcel'}.webp`;
