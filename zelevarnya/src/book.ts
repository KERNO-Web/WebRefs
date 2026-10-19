import gsap from 'gsap';
import { reduced } from './anim';
import { glyph } from './art/runes';
import { drawVessel } from './art/vessels';
import { POTIONS, Potion } from './data';
import { el, NS } from './ink';

const COLORS = {
  green: ['#c4f58f', '#7bd63a', '#3f8a1c'],
  blue: ['#9aa6ff', '#4b55d6', '#24257a'],
  pink: ['#ffc2e0', '#e2559f', '#8e2463'],
};
let gid = 0;

function vesselSvg(p: Potion) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 300 420');
  svg.setAttribute('aria-hidden', 'true');
  const id = `pot-${p.id}-${gid++}`;
  const defs = el('defs', {}, svg);
  const gr = el('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  const cols = p.shifts ? COLORS.blue : COLORS.green;
  ['0%', '55%', '100%'].forEach((o, i) => el('stop', { offset: o, 'stop-color': cols[i] }, gr));
  drawVessel(svg, p.vessel, id);
  return svg;
}

// Menu photo in an engraved plate; falls back to the drawn vessel if the file is missing.
function plate(p: Potion) {
  const f = document.createElement('figure');
  f.className = 'plate';
  const img = new Image();
  img.src = `potions/${p.id}.jpg`;
  img.alt = `${p.name}: ${p.base.toLowerCase()}`;
  img.decoding = 'async';
  img.onerror = () => { f.replaceWith(vesselSvg(p)); };
  f.append(img);
  if (p.shifts) {
    const pink = new Image();
    pink.src = `potions/${p.id}-pink.jpg`;
    pink.alt = '';
    pink.className = 'pink';
    pink.onerror = () => pink.remove();
    f.append(pink);
  }
  f.insertAdjacentHTML('beforeend', '<span class="plate-frame" aria-hidden="true"></span>');
  return f;
}

function leftPage(p: Potion) {
  const d = document.createElement('div');
  d.className = 'pl-vessel';
  d.append(plate(p));
  d.insertAdjacentHTML('beforeend', `<span class="pl-num">${p.num}</span>${p.zero ? '<span class="pl-zero">Без алкоголя</span>' : ''}`);
  return d;
}

function rightPage(p: Potion) {
  const d = document.createElement('div');
  d.className = 'pr';
  d.innerHTML = `
    <div class="pr-vessel-mobile"></div>
    <h3>${p.name}</h3>
    <p class="pr-base">${nb(p.base)}</p>
    <div class="pr-glyphs">${p.glyphs.map((g) => `<figure data-g="${g.g}"><svg viewBox="-30 -30 60 60" aria-hidden="true"></svg><figcaption>${g.label}</figcaption></figure>`).join('')}</div>
    <p class="pr-serve">${nb(p.serve)}</p>
    <p class="pr-effect"><b>Эффект:</b>${nb(p.effect)}</p>
    <div class="pr-foot">
      <span class="pr-price">${p.price}&nbsp;₽</span>
      ${p.shifts ? '<button type="button" class="btn btn-ink lemon">Капнуть лимон</button>' : ''}
    </div>`;
  d.querySelectorAll<HTMLElement>('figure').forEach((f) => glyph(f.querySelector('svg')!, f.dataset.g!, 0, 0, 44));
  const mob = d.querySelector('.pr-vessel-mobile')!;
  mob.append(plate(p));
  return d;
}

// Non-breaking space after short words so they never hang at line end.
export function nb(s: string) {
  return s.replace(/(^|\s)([вкс]|и|а|на|за|по|у|о|не|из|от|до|но|с)\s/gi, '$1$2 ');
}

// Blue → pink: the anchan reacts to lemon acid.
function lemon(page: HTMLElement, btn: HTMLButtonElement) {
  btn.disabled = true;
  const pinks = Array.from(page.closest('.book')!.querySelectorAll<HTMLImageElement>('.plate .pink'));
  if (pinks.length) {
    gsap.to(pinks, { opacity: 1, duration: reduced ? 0 : 1.6, ease: 'steps(14)' });
    btn.textContent = 'Порозовело';
    return;
  }
  const svgs = Array.from(page.closest('.book')!.querySelectorAll<SVGSVGElement>('svg')).filter((s) => s.querySelector('linearGradient'));
  const stops = svgs.flatMap((s) => Array.from(s.querySelectorAll('linearGradient stop')));
  const drop = svgs.map((s) => {
    const d = el('path', { d: 'M150 0c8 14 12 22 12 30a12 12 0 0 1-24 0c0-8 4-16 12-30z', class: 'ink drop' }, s);
    return d;
  });
  const proxy = { k: 0 };
  const tl = gsap.timeline({ onComplete: () => drop.forEach((d) => d.remove()) });
  tl.fromTo(drop, { y: -40, opacity: 1 }, { y: 200, duration: reduced ? 0 : 0.6, ease: 'steps(7)' })
    .to(drop, { opacity: 0, duration: 0.1 })
    .to(proxy, {
      k: 1, duration: reduced ? 0 : 1.6, ease: 'steps(16)',
      onUpdate: () => stops.forEach((st, i) => st.setAttribute('stop-color', mix(COLORS.blue[i % 3], COLORS.pink[i % 3], proxy.k))),
    });
  btn.textContent = 'Порозовело';
}

function mix(a: string, b: string, k: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * k).toString(16).padStart(2, '0')).join('');
}

export function buildBook() {
  const book = document.querySelector<HTMLElement>('[data-book]')!;
  const body = book.querySelector<HTMLElement>('.book-body')!;
  const L = book.querySelector<HTMLElement>('[data-page="l"]')!;
  const R = book.querySelector<HTMLElement>('[data-page="r"]')!;
  const tabs = book.querySelector<HTMLElement>('.book-tabs')!;
  const folio = book.querySelector<HTMLElement>('[data-folio]')!;
  let i = 0, busy = false;

  POTIONS.forEach((p, k) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.textContent = p.num;
    b.title = p.name;
    b.setAttribute('aria-label', p.name);
    b.addEventListener('click', () => go(k));
    tabs.append(b);
  });

  const fill = (page: HTMLElement, node: HTMLElement) => page.replaceChildren(node);
  const sync = () => {
    folio.textContent = `${POTIONS[i].num} / ${POTIONS[POTIONS.length - 1].num}`;
    tabs.querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-selected', String(k === i)));
    R.querySelector<HTMLButtonElement>('.lemon')?.addEventListener('click', (e) => lemon(R, e.currentTarget as HTMLButtonElement));
  };
  fill(L, leftPage(POTIONS[0]));
  fill(R, rightPage(POTIONS[0]));
  sync();

  const single = () => matchMedia('(max-width: 900px)').matches;

  function go(n: number) {
    n = (n + POTIONS.length) % POTIONS.length;
    if (busy || n === i) return;
    const dir = n > i ? 1 : -1;
    const next = POTIONS[n];
    if (reduced) { i = n; fill(L, leftPage(next)); fill(R, rightPage(next)); sync(); return; }
    busy = true;

    if (single()) {
      gsap.to(R, {
        rotateY: dir * -90, duration: 0.3, ease: 'steps(5)', transformOrigin: dir > 0 ? 'left center' : 'right center',
        onComplete: () => {
          i = n; fill(R, rightPage(next)); sync();
          gsap.fromTo(R, { rotateY: dir * 90 }, { rotateY: 0, duration: 0.3, ease: 'steps(5)', onComplete: () => { busy = false; } });
        },
      });
      return;
    }

    const leaf = document.createElement('div');
    leaf.className = 'leaf';
    const front = document.createElement('div'), back = document.createElement('div');
    front.className = 'face front'; back.className = 'face back';
    const shade = document.createElement('div');
    shade.className = 'leaf-shade';
    const pf = document.createElement('div'), pb = document.createElement('div');
    if (dir > 0) {
      leaf.style.left = '50%';
      pf.className = 'page page-r'; pf.append(...Array.from(R.childNodes));
      pb.className = 'page page-l'; pb.append(leftPage(next));
      fill(R, rightPage(next));
    } else {
      leaf.style.left = '0';
      pf.className = 'page page-l'; pf.append(...Array.from(L.childNodes));
      pb.className = 'page page-r'; pb.append(rightPage(next));
      fill(L, leftPage(next));
    }
    front.append(pf, shade); back.append(pb);
    leaf.append(front, back);
    body.append(leaf);
    gsap.set(leaf, { transformOrigin: dir > 0 ? 'left center' : 'right center' });
    gsap.to(shade, { opacity: 1, duration: 0.7, ease: 'steps(10)' });
    gsap.to(leaf, {
      rotateY: dir > 0 ? -180 : 180, duration: 0.8, ease: 'steps(11)',
      onComplete: () => {
        if (dir > 0) fill(L, pb.firstElementChild as HTMLElement);
        else fill(R, pb.firstElementChild as HTMLElement);
        leaf.remove();
        i = n; sync(); busy = false;
      },
    });
  }

  book.querySelectorAll<HTMLButtonElement>('[data-turn]').forEach((b) => b.addEventListener('click', () => go(i + Number(b.dataset.turn))));
  addEventListener('keydown', (e) => {
    const r = book.getBoundingClientRect();
    if (r.top > innerHeight * 0.6 || r.bottom < innerHeight * 0.4) return;
    if ((e.target as HTMLElement).closest('input, select, textarea')) return;
    if (e.key === 'ArrowRight') go(i + 1);
    if (e.key === 'ArrowLeft') go(i - 1);
  });
  let sx = 0, sy = 0;
  body.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
  body.addEventListener('pointerup', (e) => {
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(i + (dx < 0 ? 1 : -1));
  });
}
