import gsap from 'gsap';
import { reduced } from './anim';
import { rune } from './art/runes';
import { TABLES, Table } from './data';
import { arc, el, NS, rng, smooth, stroke, swell } from './ink';

// Wax seal: lumpy green blob with an embossed rune.
export function drawSeal(svg: SVGSVGElement, runeName = 'othala') {
  const r = rng(8);
  const pts = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    const rr = 66 + (r() - 0.5) * 12 + (i % 7 === 0 ? 8 : 0);
    return [80 + Math.cos(a) * rr, 80 + Math.sin(a) * rr] as [number, number];
  });
  el('path', { d: smooth(pts, true), class: 'wax' }, svg);
  stroke(svg, pts.concat([pts[0]]), () => 1.6);
  el('circle', { cx: 80, cy: 80, r: 46, class: 'wax-ink', opacity: 0.35 }, svg);
  stroke(svg, arc(80, 80, 48, 48, 0, Math.PI * 2, 40), () => 2, 'wax-ink');
  stroke(svg, arc(80, 80, 41, 41, 0, Math.PI * 2, 40), () => 1, 'wax-ink');
  rune(svg, runeName, 82, 80, 44, 0, 'wax-ink');
  stroke(svg, arc(64, 58, 34, 30, Math.PI * 1.1, Math.PI * 1.45, 10), swell(4), 'wax-hi');
}

const TIMES = (() => {
  const out: string[] = [];
  for (let m = 18 * 60; m <= 26 * 60 + 30; m += 30) {
    const h = Math.floor(m / 60) % 24, mm = m % 60;
    out.push(`${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
  }
  return out;
})();

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const plural = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? 'гость' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'гостя' : 'гостей');

export function buildBooking() {
  const form = document.querySelector<HTMLFormElement>('[data-booking]')!;
  const table = form.elements.namedItem('table') as HTMLSelectElement;
  const date = form.elements.namedItem('date') as HTMLInputElement;
  const time = form.elements.namedItem('time') as HTMLSelectElement;
  const guests = form.elements.namedItem('guests') as HTMLSelectElement;
  const name = form.elements.namedItem('name') as HTMLInputElement;
  const phone = form.elements.namedItem('phone') as HTMLInputElement;
  const seal = form.querySelector<HTMLButtonElement>('.seal')!;
  const done = form.querySelector<HTMLElement>('[data-done]')!;

  drawSeal(seal.querySelector('svg')!);

  table.innerHTML = '<option value="">Выберите на карте или здесь</option>' + TABLES.filter((t) => !t.cursed).map((t) => `<option value="${t.id}">${t.label} · до ${t.seats} гостей</option>`).join('');
  time.innerHTML = TIMES.map((t) => `<option${t === '20:00' ? ' selected' : ''}>${t}</option>`).join('');
  const today = new Date();
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  date.min = iso(today);
  date.value = iso(today);

  const fillGuests = () => {
    const t = TABLES.find((x) => x.id === table.value);
    const max = t?.seats ?? 8;
    const cur = Math.min(Number(guests.value) || 2, max);
    guests.innerHTML = Array.from({ length: max }, (_, i) => `<option${i + 1 === cur ? ' selected' : ''}>${i + 1}</option>`).join('');
  };
  fillGuests();
  const slipTable = form.querySelector<HTMLElement>('[data-slip-table]')!;
  const showTable = () => {
    const t = TABLES.find((x) => x.id === table.value);
    const box = slipTable.querySelector<HTMLElement>('.st-rune')!;
    box.replaceChildren();
    if (!t) { slipTable.classList.remove('on'); slipTable.querySelector('.st-text')!.textContent = 'Стол ещё не выбран. Отметьте его на карте'; return; }
    const sv = document.createElementNS(NS, 'svg');
    sv.setAttribute('viewBox', '-20 -20 40 40');
    rune(sv, t.rune, 0, 0, 30);
    box.append(sv);
    slipTable.classList.add('on');
    slipTable.querySelector('.st-text')!.textContent = `${t.label} · до ${t.seats} гостей`;
  };
  table.addEventListener('change', () => { fillGuests(); clear(table); showTable(); });

  phone.addEventListener('input', () => {
    let d = phone.value.replace(/\D/g, '');
    if (d.startsWith('8')) d = '7' + d.slice(1);
    if (!d.startsWith('7')) d = '7' + d;
    d = d.slice(0, 11);
    const p = d.slice(1);
    let out = '+7';
    if (p.length) out += ' ' + p.slice(0, 3);
    if (p.length > 3) out += ' ' + p.slice(3, 6);
    if (p.length > 6) out += '-' + p.slice(6, 8);
    if (p.length > 8) out += '-' + p.slice(8, 10);
    phone.value = out;
    clear(phone);
  });
  name.addEventListener('input', () => clear(name));
  date.addEventListener('input', () => clear(date));

  function err(f: HTMLInputElement | HTMLSelectElement, msg: string) {
    const lab = f.closest('.field')!;
    lab.classList.add('err');
    if (!lab.querySelector('.err-msg')) lab.insertAdjacentHTML('beforeend', `<span class="err-msg">${msg}</span>`);
    f.setAttribute('aria-invalid', 'true');
  }
  function clear(f: HTMLInputElement | HTMLSelectElement) {
    const lab = f.closest('.field')!;
    lab.classList.remove('err');
    lab.querySelector('.err-msg')?.remove();
    f.removeAttribute('aria-invalid');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    [table, date, name, phone].forEach(clear);
    let ok = true;
    if (!table.value) { err(table, 'Выберите стол'); ok = false; }
    if (!date.value || date.value < date.min) { err(date, 'Выберите дату не раньше сегодняшней'); ok = false; }
    if (name.value.trim().length < 2) { err(name, 'Как к вам обращаться?'); ok = false; }
    if (phone.value.replace(/\D/g, '').length !== 11) { err(phone, 'Нужен номер целиком'); ok = false; }
    if (!ok) {
      form.querySelector<HTMLElement>('[aria-invalid]')?.focus();
      if (!reduced) gsap.fromTo(form, { x: -6 }, { x: 0, duration: 0.4, ease: 'steps(6)' });
      return;
    }
    const t = TABLES.find((x) => x.id === table.value)!;
    const [y, m, d] = date.value.split('-').map(Number);
    const n = Number(guests.value);
    seal.disabled = true;
    const stamp = document.createElementNS(NS, 'svg');
    stamp.setAttribute('viewBox', '0 0 160 160');
    stamp.classList.add('stamp');
    stamp.setAttribute('aria-hidden', 'true');
    drawSeal(stamp, t.rune);
    const finish = () => {
      form.classList.add('sealed');
      done.hidden = false;
      done.querySelector('[data-done-text]')!.textContent = `${t.label}, ${d} ${MONTHS[m - 1]}${y !== today.getFullYear() ? ' ' + y : ''}, ${time.value}. ${n} ${plural(n)}, на имя ${name.value.trim()}.`;
      form.append(stamp);
      if (!reduced) gsap.fromTo(stamp, { scale: 2.4, rotate: -30, opacity: 0 }, { scale: 1, rotate: -8, opacity: 1, duration: 0.42, ease: 'steps(6)' });
      done.querySelector<HTMLElement>('h3')!.setAttribute('tabindex', '-1');
      done.querySelector<HTMLElement>('h3')!.focus();
    };
    if (reduced) finish();
    else gsap.to(seal.querySelector('svg'), { rotate: 360, scale: 0.86, duration: 0.7, ease: 'steps(9)', onComplete: finish });
  });

  form.querySelector('[data-again]')!.addEventListener('click', () => {
    form.classList.remove('sealed');
    done.hidden = true;
    form.querySelector('.stamp')?.remove();
    seal.disabled = false;
    gsap.set(seal.querySelector('svg'), { rotate: 0, scale: 1 });
  });

  return {
    hint(t: Table | null) {
      if (!t) { showTable(); slipTable.classList.remove('cursed'); return; }
      if (t.cursed) {
        slipTable.classList.add('cursed');
        slipTable.querySelector('.st-text')!.textContent = 'Стол XIII не бронируется. Не спрашивайте почему.';
        return;
      }
      slipTable.classList.remove('cursed');
      if (table.value) return;
      slipTable.querySelector('.st-text')!.textContent = `${t.label} · до ${t.seats} гостей. Нажмите, чтобы выбрать`;
    },
    pick(t: Table) {
      slipTable.classList.remove('cursed');
      table.value = t.id; fillGuests(); clear(table); showTable();
      if (!reduced) gsap.fromTo(slipTable, { scale: 1.08 }, { scale: 1, duration: 0.4, ease: 'steps(5)' });
      if (matchMedia('(max-width: 1000px)').matches) form.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    },
  };
}
