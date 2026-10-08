// Read models computed from the demo state. Settlements are derived rather
// than stored, so they can never disagree with the payments they summarise.

import type { Coin, DemoState, Payment } from './model';
import { assetById, wasPaid } from './model';
import { startOfDay } from './seed';

const DAY = 86_400_000;
export const PAYOUT_HOUR = 10;

export type SettlementStatus = 'open' | 'scheduled' | 'completed';

export interface Settlement {
  id: string;
  day: number;
  count: number;
  grossRub: number;
  gross: number;
  fee: number;
  refunds: number;
  refundCount: number;
  net: number;
  status: SettlementStatus;
  payoutAt: number;
}

export function settlements(s: DemoState, now = Date.now()): Settlement[] {
  const byDay = new Map<number, Settlement>();
  const today = startOfDay(now);
  const get = (day: number) => {
    let st = byDay.get(day);
    if (!st) {
      const payoutAt = day + DAY + PAYOUT_HOUR * 3_600_000;
      const d = new Date(day);
      st = {
        id: `stl_${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`,
        day,
        count: 0,
        grossRub: 0,
        gross: 0,
        fee: 0,
        refunds: 0,
        refundCount: 0,
        net: 0,
        status: day === today ? 'open' : now < payoutAt ? 'scheduled' : 'completed',
        payoutAt,
      };
      byDay.set(day, st);
    }
    return st;
  };
  for (const p of s.payments) {
    if (wasPaid(p) && p.paidAt && p.usdt) {
      const st = get(startOfDay(p.paidAt));
      st.count++;
      st.grossRub += p.amount;
      st.gross += p.usdt;
    }
    for (const r of p.refunds) {
      if (r.status !== 'completed' || !r.completedAt) continue;
      const st = get(startOfDay(r.completedAt));
      st.refunds += r.usdt;
      st.refundCount++;
    }
  }
  const list = [...byDay.values()].sort((a, b) => b.day - a.day);
  for (const st of list) {
    st.gross = round2(st.gross);
    st.fee = round2(st.gross * s.merchant.feeRate);
    st.refunds = round2(st.refunds);
    st.net = round2(st.gross - st.fee - st.refunds);
  }
  return list;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface DayStats {
  day: number;
  revenue: number;
  count: number;
}

export function overview(s: DemoState, now = Date.now()) {
  const today = startOfDay(now);
  const elapsed = now - today;
  const paid = s.payments.filter((p) => wasPaid(p) && p.paidAt);

  const inRange = (from: number, to: number) => paid.filter((p) => p.paidAt! >= from && p.paidAt! < to);
  const todayList = inRange(today, today + DAY);
  // same moment yesterday, for an honest comparison mid-day
  const yesterdaySoFar = inRange(today - DAY, today - DAY + elapsed);

  const sum = (l: Payment[]) => l.reduce((a, p) => a + p.amount, 0);
  const received = sum(todayList);
  const receivedPrev = sum(yesterdaySoFar);

  const refundsToday = s.payments
    .flatMap((p) => p.refunds)
    .filter((r) => r.status === 'completed' && r.completedAt && r.completedAt >= today)
    .reduce((a, r) => a + r.amount, 0);

  const week: DayStats[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = today - i * DAY;
    const l = inRange(day, day + DAY);
    week.push({ day, revenue: sum(l), count: l.length });
  }

  const monthFrom = today - 29 * DAY;
  const mixMap = new Map<Coin, number>();
  let mixTotal = 0;
  for (const p of paid) {
    if (p.paidAt! < monthFrom) continue;
    const c = assetById(p.asset).coin;
    mixMap.set(c, (mixMap.get(c) ?? 0) + p.amount);
    mixTotal += p.amount;
  }
  const mix = [...mixMap.entries()]
    .map(([coin, amount]) => ({ coin, amount, share: mixTotal ? amount / mixTotal : 0 }))
    .sort((a, b) => b.amount - a.amount);

  const attempts = s.payments.filter((p) => p.createdAt >= today - 6 * DAY && p.status !== 'pending' && p.status !== 'processing' && p.status !== 'created');
  const success = attempts.length ? attempts.filter(wasPaid).length / attempts.length : 1;

  const openInvoices = s.invoices.filter((i) => i.status === 'pending');
  const st = settlements(s, now);

  return {
    received,
    receivedPrev,
    count: todayList.length,
    countPrev: yesterdaySoFar.length,
    average: todayList.length ? Math.round(received / todayList.length) : 0,
    refundsToday,
    week,
    weekTotal: week.reduce((a, d) => a + d.revenue, 0),
    mix,
    success,
    openInvoices,
    current: st.find((x) => x.status === 'open') ?? null,
    upcoming: st.find((x) => x.status === 'scheduled') ?? null,
    lastPaid: st.find((x) => x.status === 'completed') ?? null,
    settlements: st,
  };
}

export const COIN_LABEL: Record<Coin, string> = { usdt: 'USDT', usdc: 'USDC', ton: 'TON', btc: 'BTC', eth: 'ETH' };
