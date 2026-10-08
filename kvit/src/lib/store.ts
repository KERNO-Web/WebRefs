// The sandbox's single source of truth, persisted to localStorage and shared
// between tabs (the merchant's terminal and the customer's checkout can be
// open side by side). A small engine advances time-based states: sessions
// expire, payments confirm, refunds complete, invoices go overdue.

import { useSyncExternalStore } from 'react';
import type { AssetId, DemoState, Invoice, InvoiceItem, Merchant, Payment, PaymentLink, Refund } from './model';
import { SESSION_MINUTES, assetById, fakeAddress, fakeHash, invoiceTotal, refundable, rid } from './model';
import { getRates, quote } from './rates';
import { createSeed, startOfDay } from './seed';

const KEY = 'kvit:demo';
const DAY = 86_400_000;

function load(): DemoState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as DemoState;
      if (s?.v === 2 && Array.isArray(s.payments)) return s;
    }
  } catch {
    /* fall through to a fresh seed */
  }
  return createSeed();
}

let state: DemoState = load();
const listeners = new Set<() => void>();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode: the demo still works for this session */
  }
}

function commit(next: DemoState) {
  state = next;
  save();
  listeners.forEach((l) => l());
}

function update(fn: (draft: DemoState) => void) {
  const draft: DemoState = structuredClone(state);
  fn(draft);
  commit(draft);
}

// ---------- time engine ----------

function advance(s: DemoState, now: number): boolean {
  let changed = false;
  const rates = getRates();
  for (const p of s.payments) {
    if ((p.status === 'pending' || p.status === 'created') && now >= p.expiresAt) {
      p.status = 'expired';
      p.closedAt = p.expiresAt;
      changed = true;
    }
    if (p.status === 'processing' && p.resolveAt && now >= p.resolveAt) {
      if (p.willFail) {
        p.status = 'failed';
        p.failedAt = p.resolveAt;
      } else {
        p.status = 'paid';
        p.paidAt = p.resolveAt;
        p.usdt = +(p.amount / rates.rub.usdt).toFixed(2);
        p.txHash = fakeHash();
        if (p.source === 'invoice') {
          const inv = s.invoices.find((i) => i.id === p.sourceId);
          if (inv && inv.status !== 'paid') {
            inv.status = 'paid';
            inv.paidAt = p.paidAt;
            inv.paymentId = p.id;
          }
        }
        if (p.source === 'link') {
          const link = s.links.find((l) => l.id === p.sourceId);
          if (link && !link.reusable && !link.completedAt) {
            link.completedAt = p.paidAt;
            link.active = false;
          }
        }
      }
      changed = true;
    }
    for (const r of p.refunds) {
      if (r.status === 'pending' && now >= r.resolveAt) {
        r.status = 'completed';
        r.completedAt = r.resolveAt;
        const left = refundable({ ...p, status: 'paid' });
        p.status = left <= 0 ? 'refunded' : 'partial_refund';
        changed = true;
      }
    }
  }
  for (const i of s.invoices) {
    if (i.status === 'pending' && now >= i.dueAt) {
      const inFlight = s.payments.some((p) => p.sourceId === i.id && p.status === 'processing');
      if (!inFlight) {
        i.status = 'expired';
        i.closedAt = i.dueAt;
        changed = true;
      }
    }
  }
  return changed;
}

/**
 * Keeps a returning visitor's demo "current": whole days that passed since the
 * data was seeded are added to every timestamp, so today's dashboard is never
 * a ghost town. Relationships between records are preserved.
 */
function keepFresh(s: DemoState, now: number): boolean {
  const days = Math.floor((startOfDay(now) - startOfDay(s.seededAt)) / DAY);
  if (days <= 0) return false;
  const shift = days * DAY;
  const keys = ['createdAt', 'expiresAt', 'processingAt', 'resolveAt', 'paidAt', 'failedAt', 'closedAt', 'sentAt', 'dueAt', 'completedAt'];
  const move = (o: Record<string, unknown>) => {
    for (const k of keys) if (typeof o[k] === 'number') (o[k] as number) += shift;
  };
  s.payments.forEach((p) => {
    move(p as unknown as Record<string, unknown>);
    p.refunds.forEach((r) => move(r as unknown as Record<string, unknown>));
  });
  s.invoices.forEach((i) => move(i as unknown as Record<string, unknown>));
  s.links.forEach((l) => move(l as unknown as Record<string, unknown>));
  s.seededAt += shift;
  // anything shifted into the future simply hasn't happened yet: drop it
  s.payments = s.payments.filter((p) => p.createdAt <= now);
  s.payments.forEach((p) => {
    if (p.paidAt && p.paidAt > now) p.paidAt = now - 60_000;
    p.refunds = p.refunds.filter((r) => r.createdAt <= now);
  });
  return true;
}

function boot() {
  const now = Date.now();
  const draft = structuredClone(state);
  advance(draft, now);
  keepFresh(draft, now);
  advance(draft, now);
  commit(draft);

  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    if (!e.newValue) {
      state = createSeed();
      listeners.forEach((l) => l());
      return;
    }
    try {
      const s = JSON.parse(e.newValue) as DemoState;
      if (s?.v === 2) {
        state = s;
        listeners.forEach((l) => l());
      }
    } catch {
      /* ignore */
    }
  });

  setInterval(() => {
    const draft = structuredClone(state);
    if (advance(draft, Date.now())) commit(draft);
  }, 400);
}

if (typeof window !== 'undefined') boot();

export function useDemo() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

export const getDemo = () => state;

// ---------- actions ----------

export function createPosPayment(amount: number, description: string): string {
  const now = Date.now();
  const id = rid('pay');
  update((s) => {
    s.payments.unshift({
      id,
      amount,
      description: description.trim() || undefined,
      source: 'pos',
      status: 'pending',
      createdAt: now,
      expiresAt: now + SESSION_MINUTES * 60_000,
      refunds: [],
    });
  });
  return id;
}

/** Imports a session that was opened from a QR on another device. */
export function importSession(id: string, amount: number, description: string | undefined, expiresAt: number) {
  if (state.payments.some((p) => p.id === id)) return;
  update((s) => {
    s.payments.unshift({
      id,
      amount,
      description,
      source: 'pos',
      status: Date.now() >= expiresAt ? 'expired' : 'pending',
      createdAt: expiresAt - SESSION_MINUTES * 60_000,
      expiresAt,
      refunds: [],
    });
  });
}

function startOn(p: Payment, asset: AssetId, fail: boolean) {
  const now = Date.now();
  const q = quote(p.amount, asset);
  const a = assetById(asset);
  p.status = 'processing';
  p.asset = asset;
  p.crypto = q.crypto;
  p.rate = q.rate;
  p.networkFee = q.fee;
  p.from = fakeAddress(asset);
  p.processingAt = now;
  // fast networks feel instant; slow ones still resolve quickly in the sandbox
  p.resolveAt = now + (a.eta > 30 ? 5200 : 3400);
  p.willFail = fail;
}

export function payPayment(id: string, asset: AssetId, fail = false) {
  update((s) => {
    const p = s.payments.find((x) => x.id === id);
    if (!p || (p.status !== 'pending' && p.status !== 'created' && p.status !== 'failed')) return;
    if (p.status === 'failed') {
      // a retry after failure gets a fresh window
      p.expiresAt = Math.max(p.expiresAt, Date.now() + 5 * 60_000);
      delete p.failedAt;
    }
    startOn(p, asset, fail);
  });
}

export function payLink(linkId: string, asset: AssetId, fail = false): string | null {
  const link = state.links.find((l) => l.id === linkId);
  if (!link || !link.active) return null;
  const now = Date.now();
  const id = rid('pay');
  update((s) => {
    const p: Payment = {
      id,
      amount: link.amount,
      description: link.title,
      source: 'link',
      sourceId: link.id,
      customer: { ru: 'Покупатель по ссылке', en: 'Customer via link' },
      status: 'pending',
      createdAt: now,
      expiresAt: now + SESSION_MINUTES * 60_000,
      refunds: [],
    };
    startOn(p, asset, fail);
    s.payments.unshift(p);
  });
  return id;
}

export function payInvoice(invoiceId: string, asset: AssetId, fail = false): string | null {
  const inv = state.invoices.find((i) => i.id === invoiceId);
  if (!inv || inv.status !== 'pending') return null;
  const now = Date.now();
  const id = rid('pay');
  update((s) => {
    const p: Payment = {
      id,
      amount: invoiceTotal(inv),
      description: { ru: `Счёт ${inv.number}`, en: `Invoice ${inv.number}` },
      source: 'invoice',
      sourceId: inv.id,
      customer: inv.customer,
      status: 'pending',
      createdAt: now,
      expiresAt: now + SESSION_MINUTES * 60_000,
      refunds: [],
    };
    startOn(p, asset, fail);
    s.payments.unshift(p);
  });
  return id;
}

export function cancelPayment(id: string) {
  update((s) => {
    const p = s.payments.find((x) => x.id === id);
    if (!p || (p.status !== 'pending' && p.status !== 'created')) return;
    p.status = 'cancelled';
    p.closedAt = Date.now();
  });
}

/** Sandbox control: jump a waiting session to its timeout. */
export function expireNow(id: string) {
  update((s) => {
    const p = s.payments.find((x) => x.id === id);
    if (!p || (p.status !== 'pending' && p.status !== 'created')) return;
    p.status = 'expired';
    p.expiresAt = Date.now();
    p.closedAt = Date.now();
  });
}

export function issueRefund(paymentId: string, amount: number, reason: string): string | null {
  const p = state.payments.find((x) => x.id === paymentId);
  if (!p || amount <= 0 || amount > refundable(p)) return null;
  const now = Date.now();
  const id = rid('ref');
  update((s) => {
    const pay = s.payments.find((x) => x.id === paymentId)!;
    const r: Refund = {
      id,
      amount,
      crypto: +(((pay.crypto ?? 0) * amount) / pay.amount).toFixed(assetById(pay.asset).decimals),
      usdt: +(((pay.usdt ?? 0) * amount) / pay.amount).toFixed(2),
      reason: reason.trim() || undefined,
      status: 'pending',
      createdAt: now,
      resolveAt: now + 2600,
    };
    pay.refunds.push(r);
  });
  return id;
}

export interface InvoiceDraft {
  customer: string;
  email: string;
  items: InvoiceItem[];
  memo: string;
  dueDays: number;
}

export function createInvoice(d: InvoiceDraft, send: boolean): string {
  const now = Date.now();
  const id = rid('inv');
  update((s) => {
    const max = s.invoices.reduce((m, i) => Math.max(m, parseInt(i.number.replace(/\D/g, ''), 10) || 0), 0);
    const inv: Invoice = {
      id,
      number: `KC-${String(max + 1).padStart(4, '0')}`,
      customer: d.customer.trim(),
      email: d.email.trim(),
      items: d.items,
      memo: d.memo.trim() || undefined,
      status: send ? 'pending' : 'draft',
      createdAt: now,
      sentAt: send ? now : undefined,
      dueAt: now + d.dueDays * DAY,
    };
    s.invoices.unshift(inv);
  });
  return id;
}

export function sendInvoice(id: string) {
  update((s) => {
    const inv = s.invoices.find((i) => i.id === id);
    if (!inv || inv.status !== 'draft') return;
    const term = Math.max(DAY, inv.dueAt - inv.createdAt);
    inv.status = 'pending';
    inv.sentAt = Date.now();
    inv.dueAt = Date.now() + term;
  });
}

export function cancelInvoice(id: string) {
  update((s) => {
    const inv = s.invoices.find((i) => i.id === id);
    if (!inv || (inv.status !== 'pending' && inv.status !== 'draft')) return;
    inv.status = 'cancelled';
    inv.closedAt = Date.now();
  });
}

export interface LinkDraft {
  title: string;
  description: string;
  amount: number;
  reusable: boolean;
}

export function createLink(d: LinkDraft): string {
  const id = rid('lnk');
  update((s) => {
    const link: PaymentLink = {
      id,
      title: d.title.trim(),
      description: d.description.trim() || undefined,
      amount: d.amount,
      reusable: d.reusable,
      active: true,
      createdAt: Date.now(),
    };
    s.links.unshift(link);
  });
  return id;
}

export function setLinkActive(id: string, active: boolean) {
  update((s) => {
    const l = s.links.find((x) => x.id === id);
    if (!l || l.completedAt) return;
    l.active = active;
  });
}

export function updateMerchant(patch: Partial<Merchant>) {
  update((s) => {
    s.merchant = { ...s.merchant, ...patch };
  });
}

export function rotateApiKey() {
  update((s) => {
    s.merchant.apiKey = 'sk_sandbox_' + fakeHash().slice(0, 32);
  });
}

export function resetDemo() {
  commit(createSeed());
}

