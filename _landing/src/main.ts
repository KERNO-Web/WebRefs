import './styles.css';
import './ambient.css';
import { startAmbient } from './ambient';
import { startHeroFx } from './hero-fx';
import { startCursor } from './cursor';
import { startContact } from './contact';
import { CATS, PROJECTS, type Cat, type Project } from './projects';
import { visibleProjects } from './settings';
import { CASES } from './cases';
import { CLIPS } from './clips';
import { bindPreviews } from './previews';

const ADMIN_ROUTE = '#/kerno-admin';
const CASE_ROUTE = '#/case/';
const ARROW =
  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5"/></svg>';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const pad = (n: number) => String(n).padStart(2, '0');
// a commercial work with a write-up leads to its case page; the rest open the work itself
const linkAttrs = (p: Project) =>
  CASES[p.slug] ? `href="${CASE_ROUTE}${p.slug}"` : `href="${esc(p.href)}"${p.external ? ' target="_blank" rel="noopener"' : ''}`;
const goLabel = (p: Project) => (CASES[p.slug] ? 'Смотреть кейс' : 'Открыть проект');
// the cover keeps its own wrapper, with the work's 5 s loop over it when there
// is one (previews.ts plays it)
const clip = (p: Project) =>
  CLIPS.has(p.slug) ? `<video class="clip" data-src="clips/${p.slug}.mp4" muted playsinline loop preload="none" aria-hidden="true"></video>` : '';
// a work without a loop has a living cover: a slow drift and a passing sheen (styles.css)
const status = (p: Project) => p.label ?? (p.real ? 'Коммерческий проект' : 'Авторский концепт');
const shot = (p: Project, alt: string, extra = '') =>
  `<div class="shot${CLIPS.has(p.slug) ? '' : ' cover'}"><div class="shot-in"><img src="${esc(p.thumbnail)}" alt="${esc(alt)}" width="1200" height="630"${extra} />${clip(p)}</div><span class="chip"${p.accent ? ` style="--dot:${esc(p.accent)}"` : ''}><i></i>${esc(status(p))}</span></div>`;
const kind = (p: Project) => `<p class="kind">${esc(status(p))}</p>`;
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
          <h2 class="card-title">${esc(p.title)}</h2>
          <p class="desc">${esc(glue(p.description))}</p>
          <span class="go">${goLabel(p)} ${ARROW}</span>
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
        <h2 class="card-title">${esc(p.title)}</h2>
        <p class="desc">${esc(glue(p.description))}</p>
        <span class="go">${goLabel(p)} ${ARROW}</span>
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
          <h3 class="card-title">${esc(r.title)}</h3>
          <p class="desc">${esc(glue(r.description))}</p>
          <span class="go">${goLabel(r)} ${ARROW}</span>
        </div>
      </a>`,
    )
    .join('');
  observeReveals();
  bindPreviews();
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

/* ---------- case pages ---------- */

const caseView = document.getElementById('case')!;
// where the visitor was on the homepage, so «back» lands on the same card
let homeScroll = 0;

function renderCase(slug: string) {
  const all = visibleProjects();
  const list = [...all.featured, ...all.rest].filter((p) => CASES[p.slug]);
  const i = list.findIndex((p) => p.slug === slug);
  const p = i >= 0 ? list[i] : PROJECTS.find((x) => x.slug === slug);
  const c = CASES[slug];
  if (!p || !c) return false;
  const next = list.length > 1 ? list[(i + 1) % list.length] : null;
  const year = p.year ? `<div><dt>Год</dt><dd>${p.year}</dd></div>` : '';
  caseView.innerHTML = `
    <article class="case wrap">
      <a class="case-back" href="#works">${ARROW} Все работы</a>
      <header class="case-head">
        ${kind(p)}
        <h1 class="case-title">${esc(p.title)}</h1>
        <p class="case-lead">${esc(glue(c.lead))}</p>
        <dl class="case-meta">
          ${year}
          <div><dt>Стек</dt><dd>${c.stack.map(esc).join(', ')}</dd></div>
        </dl>
        <a class="btn btn-accent btn-lg case-open" href="${esc(p.href)}"${p.external || /^https?:/.test(p.href) ? ' target="_blank" rel="noopener"' : ''}>${esc(c.open ?? 'Открыть проект')} ${ARROW}</a>
      </header>
      <figure class="case-shot">
        <img src="${esc(p.thumbnail)}" alt="${esc(p.title)} — первый экран" width="1200" height="630" />
      </figure>
      <div class="case-body">
        <section class="case-row">
          <h2>Задача</h2>
          <p>${esc(glue(c.task))}</p>
        </section>
        <section class="case-row">
          <h2>Что сделал</h2>
          <ul>${c.did.map((d) => `<li>${esc(glue(d))}</li>`).join('')}</ul>
        </section>
        <section class="case-row">
          <h2>Что вышло</h2>
          <p>${esc(glue(c.result))}</p>
        </section>
      </div>
      ${
        next
          ? `<a class="case-next" href="${CASE_ROUTE}${next.slug}">
        <span class="case-next-label">Следующий кейс</span>
        <span class="case-next-title">${esc(next.title)} ${ARROW}</span>
      </a>`
          : ''
      }
    </article>`;
  return true;
}

/* ---------- views: home, case page, hidden admin ---------- */

const home = document.getElementById('home')!;
const admin = document.getElementById('admin')!;
let adminMounted = false;
let view: 'home' | 'case' | 'admin' = 'home';
// the page scrolls smoothly by default; switching views must jump, not glide
const jump = (top: number) => window.scrollTo({ top, behavior: 'instant' });

async function route() {
  const hash = location.hash;
  const isAdmin = hash === ADMIN_ROUTE;
  const slug = hash.startsWith(CASE_ROUTE) ? hash.slice(CASE_ROUTE.length) : '';
  const isCase = Boolean(slug) && renderCase(slug);
  if (view === 'home' && (isAdmin || isCase)) homeScroll = scrollY;
  const prev = view;
  view = isAdmin ? 'admin' : isCase ? 'case' : 'home';
  document.documentElement.classList.toggle('admin-mode', isAdmin);
  home.hidden = view !== 'home';
  admin.hidden = !isAdmin;
  caseView.hidden = !isCase;
  if (isAdmin) {
    document.title = 'KERNØ — закреп на главной';
    if (!adminMounted) {
      adminMounted = true;
      const { mountAdmin } = await import('./admin');
      mountAdmin(admin);
    }
    jump(0);
  } else if (isCase) {
    document.title = `${PROJECTS.find((p) => p.slug === slug)!.title} — кейс KERNØ`;
    jump(0);
  } else {
    document.title = 'KERNØ — дизайн и разработка';
    // back from a case: return to the card the visitor left from
    if (prev !== 'home') {
      const target = hash.length > 1 && !hash.startsWith('#/') ? document.querySelector(hash) : null;
      if (prev === 'case' && hash === '#works' && homeScroll) jump(homeScroll);
      else if (target) target.scrollIntoView({ behavior: 'instant' });
      else jump(homeScroll);
    }
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

// the name rises only once its own face has arrived, so it never jumps from the
// fallback width to Dela's; a slow network gets 1.5 s before the fallback is used.
// Then two frames, so the entrance transitions start from their initial state
Promise.race([
  document.fonts.load("1em 'Dela Gothic One'", 'KERNØ'),
  new Promise((done) => setTimeout(done, 1500)),
])
  .catch(() => {})
  .then(() => requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.add('ready'))));
route();
renderCats();
render();
startAmbient();
startHeroFx();
startCursor();
startContact();
