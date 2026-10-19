import './styles.css';
import './ambient.css';
import { startAmbient } from './ambient';
import { CATS, type Cat, type Project } from './projects';
import { visibleProjects } from './settings';

const ADMIN_ROUTE = '#/kerno-admin';
const ARROW =
  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5"/></svg>';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const pad = (n: number) => String(n).padStart(2, '0');
const linkAttrs = (p: Project) => `href="${esc(p.href)}"${p.external ? ' target="_blank" rel="noopener"' : ''}`;
// the image keeps its own wrapper; .fx holds the preview's living element and
// .ev-clip the rare reflection, clipped to the object it crosses
const shot = (p: Project, alt: string, extra = '') =>
  `<div class="shot"${p.idle ? ` data-idle="${p.idle}"` : ''}><div class="shot-in"><img src="${esc(p.thumbnail)}" alt="${esc(alt)}" width="1200" height="630"${extra} /></div>${p.idle ? '<span class="fx" aria-hidden="true"></span>' : ''}${p.idle === 'sweep' || p.idle === 'lamps' ? '<span class="ev-clip" aria-hidden="true"><i></i></span>' : ''}</div>`;
const kind = (p: Project) => `<p class="kind">${esc(p.label ?? (p.real ? 'Коммерческий проект' : 'Авторский концепт'))}</p>`;
// short Russian words stay with the next word, never at a line end
const glue = (s: string) => s.replace(/(^|[\s(«])(в|к|с|у|о|а|и|я|на|по|за|из|от|до|для|не|но|же|без)\s/gi, '$1$2\u00a0').replace(/\s—/g, '\u00a0—');

/* ---------- pinned project and the rest of the grid ---------- */

/* ---------- category filter ---------- */

const isCat = (v: string | null): v is Cat => CATS.some((c) => c.id === v);
const fromUrl = new URLSearchParams(location.search).get('cat');
let cat: Cat | null = isCat(fromUrl) ? fromUrl : null;
const plural = (n: number) => {
  const m10 = n % 10;
  const m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? 'работа' : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? 'работы' : 'работ';
};

function renderCats() {
  const { featured, rest } = visibleProjects();
  const all = [...featured, ...rest];
  const chip = (id: Cat | null, name: string, n: number) =>
    `<button type="button" class="cat" data-cat="${id ?? ''}" aria-pressed="${cat === id}">${esc(name)}<span>${n}</span></button>`;
  document.getElementById('cats')!.innerHTML =
    chip(null, 'Все работы', all.length) +
    CATS.map((c) => chip(c.id, c.name, all.filter((p) => p.cats.includes(c.id)).length)).join('');
  // on phones the row scrolls sideways: keep the picked chip in sight
  const bar = document.getElementById('cats')!;
  const on = bar.querySelector<HTMLElement>('[aria-pressed="true"]');
  if (on && bar.scrollWidth > bar.clientWidth) bar.scrollLeft = on.offsetLeft - bar.offsetLeft - 16;
}

function setCat(next: Cat | null, scroll = false) {
  cat = next;
  const url = new URL(location.href);
  if (cat) url.searchParams.set('cat', cat);
  else url.searchParams.delete('cat');
  history.replaceState(null, '', url.pathname + url.search + url.hash);
  renderCats();
  render();
  if (scroll) document.getElementById('works')!.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

document.getElementById('cats')!.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-cat]');
  if (b) setCat(isCat(b.dataset.cat ?? null) ? (b.dataset.cat as Cat) : null);
});
document.querySelectorAll<HTMLAnchorElement>('.build-go').forEach((a) =>
  a.addEventListener('click', (e) => {
    e.preventDefault();
    setCat(a.dataset.cat as Cat, true);
  }),
);

function render() {
  const all = visibleProjects();
  const feat = document.getElementById('featured')!;
  const title = document.getElementById('grid-title')!;
  const count = document.getElementById('grid-count')!;
  // with a category picked the pinned block steps aside and every match goes into the grid
  const featured = cat ? [] : all.featured;
  const rest = cat ? [...all.featured, ...all.rest].filter((p) => p.cats.includes(cat!)) : all.rest;
  feat.hidden = Boolean(cat);
  title.textContent = cat ? CATS.find((c) => c.id === cat)!.name : 'Другие работы';
  count.textContent = cat ? `${rest.length} ${plural(rest.length)}` : '';
  if (!featured.length) {
    renderGrid(rest);
    return;
  }
  const head = `
    <header class="feat-head">
      <span class="pin"><i aria-hidden="true"></i>Закреплено</span>
    </header>`;
  if (featured.length > 1) {
    feat.removeAttribute('style');
    feat.innerHTML = `${head}
    <div class="feat-duo">
      ${featured
        .map(
          (p, i) => `
      <a class="feat-card card" ${linkAttrs(p)}>
        ${shot(p, `${p.title} — первый экран`, i === 0 ? ' fetchpriority="high"' : '')}
        <div class="feat-info">
          ${kind(p)}
          <h2 class="card-title">${esc(p.title)}</h2>
          <p class="desc">${esc(glue(p.description))}</p>
          <span class="go">Открыть проект ${ARROW}</span>
        </div>
      </a>`,
        )
        .join('')}
    </div>`;
  } else {
    const p = featured[0];
    feat.removeAttribute('style');
    feat.innerHTML = `${head}
    <a class="feat-card card" ${linkAttrs(p)}>
      ${shot(p, `${p.title} — первый экран`, ' fetchpriority="high"')}
      <div class="feat-info">
        ${kind(p)}
        <h2 class="card-title">${esc(p.title)}</h2>
        <p class="desc">${esc(glue(p.description))}</p>
        <span class="go">Открыть проект ${ARROW}</span>
      </div>
    </a>`;
  }

  renderGrid(rest);
}

function renderGrid(rest: Project[]) {
  document.getElementById('grid')!.innerHTML = rest
    .map(
      (r, i) => `
      <a class="card rv" ${linkAttrs(r)}>
        ${shot(r, r.title, ' loading="lazy"')}
        <div class="info">
          <span class="num">${pad(i + 1)}</span>
          ${kind(r)}
          <h3 class="card-title">${esc(r.title)}</h3>
          <p class="desc">${esc(glue(r.description))}</p>
          <span class="go">Открыть проект ${ARROW}</span>
        </div>
      </a>`,
    )
    .join('');
  observeReveals();
}

/* ---------- reveals ---------- */

let io: IntersectionObserver | null = null;
function observeReveals() {
  const els = document.querySelectorAll('.rv:not(.in)');
  if (!('IntersectionObserver' in window)) {
    els.forEach((e) => e.classList.add('in'));
    return;
  }
  io ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io!.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  els.forEach((e) => io!.observe(e));
}

/* ---------- hidden admin route ---------- */

const home = document.getElementById('home')!;
const admin = document.getElementById('admin')!;
let adminMounted = false;

async function route() {
  const isAdmin = location.hash === ADMIN_ROUTE;
  document.documentElement.classList.toggle('admin-mode', isAdmin);
  home.hidden = isAdmin;
  admin.hidden = !isAdmin;
  if (isAdmin) {
    document.title = 'KERNØ — закреп на главной';
    if (!adminMounted) {
      adminMounted = true;
      const { mountAdmin } = await import('./admin');
      mountAdmin(admin);
    }
    window.scrollTo(0, 0);
  } else {
    document.title = 'KERNØ — дизайн и разработка';
  }
}

addEventListener('hashchange', route);
addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    location.hash = location.hash === ADMIN_ROUTE ? '' : ADMIN_ROUTE;
  }
});

/* ---------- current section in the top bar ---------- */

const navLinks = [...document.querySelectorAll<HTMLAnchorElement>('.top-nav a')];
const spy = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      const link = navLinks.find((a) => a.hash === `#${e.target.id}`);
      link?.classList.toggle('on', e.isIntersecting);
    }
  },
  { rootMargin: '-45% 0px -50% 0px' },
);
['works', 'build', 'contact'].forEach((id) => spy.observe(document.getElementById(id)!));

// two frames so the entrance transitions start from their initial state
requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.add('ready')));
route();
renderCats();
render();
startAmbient();
