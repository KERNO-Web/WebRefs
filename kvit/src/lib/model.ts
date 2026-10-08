// Domain model for the Kvit sandbox. Everything here is simulated: no wallet,
// chain or custody is involved. Amounts are kept in roubles (the merchant's
// currency); crypto amounts are derived from the rate captured at payment time.

export type Lang = 'ru' | 'en';
/** User-entered strings are plain; seeded strings carry both languages. */
export type Text = string | { ru: string; en: string };

export const tx = (text: Text | undefined, lang: Lang) =>
  text === undefined ? '' : typeof text === 'string' ? text : text[lang];

export type Coin = 'usdt' | 'usdc' | 'ton' | 'btc' | 'eth';
export type AssetId = 'usdt_ton' | 'usdt_tron' | 'usdc_sol' | 'ton' | 'btc' | 'eth_base';

export interface AssetDef {
  id: AssetId;
  coin: Coin;
  symbol: string;
  network: string;
  decimals: number;
  /** network fee paid by the customer, in units of the asset */
  fee: number;
  /** typical time to confirm, seconds — shown to the customer */
  eta: number;
  /** balance of the simulated customer wallet */
  demoBalance: number;
}

export const ASSETS: AssetDef[] = [
  { id: 'usdt_ton', coin: 'usdt', symbol: 'USDT', network: 'TON', decimals: 2, fee: 0.03, eta: 5, demoBalance: 143.8 },
  { id: 'usdt_tron', coin: 'usdt', symbol: 'USDT', network: 'TRON', decimals: 2, fee: 1.1, eta: 60, demoBalance: 1250.4 },
  { id: 'usdc_sol', coin: 'usdc', symbol: 'USDC', network: 'Solana', decimals: 2, fee: 0.01, eta: 2, demoBalance: 61.25 },
  { id: 'ton', coin: 'ton', symbol: 'TON', network: 'TON', decimals: 2, fee: 0.008, eta: 5, demoBalance: 48.2 },
  { id: 'btc', coin: 'btc', symbol: 'BTC', network: 'Bitcoin', decimals: 6, fee: 0.000014, eta: 600, demoBalance: 0.0041 },
  { id: 'eth_base', coin: 'eth', symbol: 'ETH', network: 'Base', decimals: 5, fee: 0.00002, eta: 4, demoBalance: 0.052 },
];

export const assetById = (id: AssetId | undefined) => ASSETS.find((a) => a.id === id) ?? ASSETS[0];

export type PaymentStatus =
  | 'created'
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'expired'
  | 'cancelled'
  | 'partial_refund'
  | 'refunded';

export type RefundStatus = 'pending' | 'completed' | 'failed';
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'expired' | 'cancelled';
export type Source = 'pos' | 'invoice' | 'link';

export interface Refund {
  id: string;
  amount: number;
  /** returned to the customer in the original asset */
  crypto: number;
  /** deducted from the settlement */
  usdt: number;
  reason?: Text;
  status: RefundStatus;
  createdAt: number;
  resolveAt: number;
  completedAt?: number;
}

export interface Payment {
  id: string;
  amount: number;
  description?: Text;
  source: Source;
  sourceId?: string;
  customer?: Text;
  status: PaymentStatus;
  createdAt: number;
  expiresAt: number;
  processingAt?: number;
  resolveAt?: number;
  willFail?: boolean;
  paidAt?: number;
  failedAt?: number;
  closedAt?: number;
  asset?: AssetId;
  crypto?: number;
  /** roubles per one unit of the asset, locked when the customer paid */
  rate?: number;
  networkFee?: number;
  /** USDT the payment adds to the settlement, before the platform fee */
  usdt?: number;
  from?: string;
  txHash?: string;
  refunds: Refund[];
}

export interface InvoiceItem {
  title: Text;
  qty: number;
  price: number;
}

export interface Invoice {
  id: string;
  number: string;
  customer: Text;
  email: string;
  items: InvoiceItem[];
  memo?: Text;
  status: InvoiceStatus;
  createdAt: number;
  sentAt?: number;
  dueAt: number;
  paidAt?: number;
  closedAt?: number;
  paymentId?: string;
}

export interface PaymentLink {
  id: string;
  title: Text;
  description?: Text;
  amount: number;
  reusable: boolean;
  active: boolean;
  createdAt: number;
  /** a one-off link closes itself after the first successful payment */
  completedAt?: number;
}

export interface Merchant {
  name: string;
  settleAsset: 'USDT' | 'USDC';
  accepted: AssetId[];
  feeRate: number;
  payoutWallet: string;
  apiKey: string;
}

export interface DemoState {
  v: 2;
  seededAt: number;
  merchant: Merchant;
  payments: Payment[];
  invoices: Invoice[];
  links: PaymentLink[];
}

export const invoiceTotal = (inv: Pick<Invoice, 'items'>) =>
  inv.items.reduce((s, i) => s + i.qty * i.price, 0);

export const refundedAmount = (p: Payment) =>
  p.refunds.filter((r) => r.status !== 'failed').reduce((s, r) => s + r.amount, 0);

export const refundable = (p: Payment) =>
  p.status === 'paid' || p.status === 'partial_refund' ? p.amount - refundedAmount(p) : 0;

/** "Successful" money in: paid, including ones later refunded in part or in full. */
export const wasPaid = (p: Payment) =>
  p.status === 'paid' || p.status === 'partial_refund' || p.status === 'refunded';

export const SESSION_MINUTES = 15;

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function rid(prefix: string, len = 10, rnd: () => number = Math.random) {
  let s = '';
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(rnd() * ALPHABET.length)];
  return `${prefix}_${s}`;
}

export function fakeHash(rnd: () => number = Math.random) {
  let s = '';
  for (let i = 0; i < 64; i++) s += '0123456789abcdef'[Math.floor(rnd() * 16)];
  return s;
}

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export function fakeAddress(asset: AssetId, rnd: () => number = Math.random) {
  const body = (n: number) => Array.from({ length: n }, () => B58[Math.floor(rnd() * B58.length)]).join('');
  switch (asset) {
    case 'usdt_ton':
    case 'ton':
      return 'UQ' + body(46);
    case 'usdt_tron':
      return 'T' + body(33);
    case 'usdc_sol':
      return body(44);
    case 'btc':
      return 'bc1q' + body(38).toLowerCase();
    case 'eth_base':
      return '0x' + fakeHash(rnd).slice(0, 40);
  }
}

export const shortAddr = (a: string, head = 4, tail = 4) =>
  a.length <= head + tail + 1 ? a : `${a.slice(0, head)}…${a.slice(-tail)}`;
