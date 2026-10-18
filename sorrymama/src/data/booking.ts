/*
 * Where a booking request goes. No endpoint is configured yet, so
 * nothing leaves the browser and the guest is told to confirm by phone. When the venue gives an
 * endpoint (CRM, bot, mail relay), set it here; the form already sends JSON { guests, name, phone }.
 * Never show «бронь подтверждена» for a request nobody received.
 */
export type BookingRequest = { guests: string; name: string; phone: string };
export const BOOKING_ENDPOINT: string | null = null;

export async function sendBooking(r: BookingRequest): Promise<'sent' | 'not-sent'> {
  if (!BOOKING_ENDPOINT) return 'not-sent';
  const res = await fetch(BOOKING_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r) });
  if (!res.ok) throw new Error(`booking ${res.status}`);
  return 'sent';
}

/** +7 (XXX) XXX-XX-XX from whatever was typed; a leading 8 counts as 7. */
export function formatPhone(raw: string) {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (d && !d.startsWith('7')) d = '7' + d;
  d = d.slice(0, 11);
  const p = d.slice(1);
  if (!d) return '';
  let out = '+7';
  if (p.length) out += ' (' + p.slice(0, 3);
  if (p.length >= 3) out += ')';
  if (p.length > 3) out += ' ' + p.slice(3, 6);
  if (p.length > 6) out += '-' + p.slice(6, 8);
  if (p.length > 8) out += '-' + p.slice(8, 10);
  return out;
}
export const phoneOk = (v: string) => v.replace(/\D/g, '').length === 11;
