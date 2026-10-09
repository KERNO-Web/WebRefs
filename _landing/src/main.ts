import './styles.css';
import type { Project } from './projects';
import { visibleProjects } from './settings';

const ADMIN_ROUTE = '#/kerno-admin';
const ARROW =
  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5"/></svg>';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const pad = (n: number) => String(n).padStart(2, '0');
const linkAttrs = (p: Project) => `href="${esc(p.href)}"${p.external ? ' target="_blank" rel="noopener"' : ''}`;
const kind = (p: Project) => `<p class="kind"><b>${p.real ? 'Коммерческий' : 'Авторский'}</b> ${p.real ? 'проект' : 'концепт'}</p>`;
// short Russian words stay with the next word, never at a line end
const glue = (s: string) => s.replace(/(^|[\s(«])(в|к|с|у|о|а|и|я|на|по|за|из|от|до|для|не|но|же|без)\s/gi, '$1$2\u00a0').replace(/\s—/g, '\u00a0—');

/* ---------- pinned project and the rest of the grid ---------- */

function render() {
  const { featured, rest } = visibleProjects();
  const feat = document.getElementById('featured')!;
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
        <div class="shot"><img src="${esc(p.thumbnail)}" alt="${esc(p.title)} — первый экран" width="1200" height="630"${i === 0 ? ' fetchpriority="high"' : ''} /></div>
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
      <div class="shot"><img src="${esc(p.thumbnail)}" alt="${esc(p.title)} — первый экран" width="1200" height="630" fetchpriority="high" /></div>
      <div class="feat-info">
        ${kind(p)}
        <h2 class="card-title">${esc(p.title)}</h2>
        <p class="desc">${esc(glue(p.description))}</p>
        <span class="go">Открыть проект ${ARROW}</span>
      </div>
    </a>`;
  }

  document.getElementById('grid')!.innerHTML = rest
    .map(
      (r, i) => `
      <a class="card rv" ${linkAttrs(r)}>
        <div class="shot"><img src="${esc(r.thumbnail)}" alt="${esc(r.title)}" loading="lazy" width="1200" height="630" /></div>
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
render();
