// A case told through its work (cases.ts `chapters`): an opening loop, then a
// chapter per part of the job, each built from media blocks. One device runs
// through the page, taken from the work's own frames: the cut corner with the
// accent line (styles.css, .ec-frame). Loops load and play only on screen;
// reduced motion and data saver keep the posters.
import type { Case, CaseBlock, CaseMedia } from './cases';
import type { Project } from './projects';

interface Helpers {
  esc: (s: string) => string;
  glue: (s: string) => string;
  arrow: string;
  route: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function chapterCase(p: Project, c: Case, next: Project | null, h: Helpers) {
  const { esc, glue, arrow } = h;
  // hyphenated words (тай-брейк, плей-офф, epc-tournament.com) never break at the hyphen
  // and the last word of a line of copy never hangs alone
  const t = (s: string) => esc(glue(s.replace(/ (\S+)\s*$/, '\u00a0$1'))).replace(/[\p{L}\d]+(?:[-–][\p{L}\d]+)+(?:\.\p{L}+)?/gu, '<span class="nw">$&</span>');
  const chapters = c.chapters ?? [];
  const external = p.external || /^https?:/.test(p.href) ? ' target="_blank" rel="noopener"' : '';

  const media = (m: CaseMedia, cls = '') => {
    const ratio = `--r:${m.w}/${m.h}`;
    const inner = m.poster
      ? `<video class="ec-video" data-src="${esc(m.src)}" poster="${esc(m.poster)}" width="${m.w}" height="${m.h}" muted playsinline loop preload="none" aria-label="${esc(m.alt)}"></video>`
      : `<img src="${esc(m.src)}" alt="${esc(m.alt)}" width="${m.w}" height="${m.h}" loading="lazy" decoding="async" />`;
    return `<figure class="ec-m ${cls}">
      <div class="${m.phone ? 'ec-phone' : 'ec-frame'}" style="${ratio}">${inner}</div>
      ${m.caption ? `<figcaption>${t(m.caption)}</figcaption>` : ''}
    </figure>`;
  };

  const block = (b: CaseBlock): string => {
    switch (b.kind) {
      case 'band':
        return `<div class="ec-band">${media(b.media)}</div>`;
      case 'devices':
        return `<div class="ec-devices">
          ${media(b.desktop, 'ec-desk')}
          <div class="ec-phones">${b.phones.map((m) => media(m)).join('')}</div>
        </div>`;
      case 'grid': {
        const rows = [b.items.slice(0, 2), b.items.slice(2, 4)].filter((r) => r.length);
        return `<div class="ec-grid">${rows.map((r, i) => `<div class="ec-row ec-row-${i + 1}">${r.map((m) => media(m)).join('')}</div>`).join('')}</div>`;
      }
      case 'aside':
        return `<div class="ec-aside${b.flip ? ' flip' : ''}">
          <div class="ec-aside-text">
            <h3>${t(b.title)}</h3>
            <ul class="ec-list">${b.points.map((x) => `<li>${t(x)}</li>`).join('')}</ul>
          </div>
          ${media(b.media)}
        </div>`;
      case 'trio':
        return `<div class="ec-trio">
          ${media(b.media)}
          <div class="ec-trio-side">${b.side.map((m) => media(m)).join('')}</div>
        </div>`;
      case 'widths':
        return widths(t(b.caption));
      case 'aligned':
        return `<figure class="ec-m ec-aligned">
          <div class="ec-frame ec-stack" style="--a:${(b.edges[0] * 100).toFixed(2)}%;--b:${(b.edges[1] * 100).toFixed(2)}%">
            ${b.items.map((m) => `<img src="${esc(m.src)}" alt="${esc(m.alt)}" width="${m.w}" height="${m.h}" loading="lazy" decoding="async" />`).join('')}
            <i class="ec-guide" aria-hidden="true"></i><i class="ec-guide ec-guide-b" aria-hidden="true"></i>
          </div>
          <figcaption>${t(b.caption)}</figcaption>
        </figure>`;
      case 'facts':
        return `<ul class="ec-list ec-facts">${b.items.map((x) => `<li>${t(x)}</li>`).join('')}</ul>`;
    }
  };

  return `
    <article class="case ec wrap" style="--ec:${esc(p.accent ?? '#ff2a2a')}">
      <a class="case-back" href="#works">${arrow} Все работы</a>
      <header class="ec-head">
        <div class="ec-head-main">
          <p class="ec-kind">${p.real ? 'Коммерческий проект' : 'Авторский концепт'}${p.year ? `, ${p.year}` : ''}</p>
          <h1 class="case-title">${esc(p.title)}</h1>
          <p class="ec-lead">${t(c.lead)}</p>
        </div>
        <div class="ec-head-side">
          <ol class="ec-index">
            ${chapters.map((ch, i) => `<li><a href="${h.route}${p.slug}" data-jump="ec-${esc(ch.id)}"><span class="ec-num">${pad(i + 1)}</span>${t(ch.title)}</a></li>`).join('')}
          </ol>
          <a class="btn btn-accent btn-lg ec-open" href="${esc(p.href)}"${external}>${esc(c.open ?? 'Открыть проект')} ${arrow}</a>
        </div>
      </header>
      ${c.hero ? `<div class="ec-hero">${media(c.hero)}</div>` : ''}
      ${chapters
        .map(
          (ch, i) => `
      <section class="ec-ch" id="ec-${esc(ch.id)}">
        <header class="ec-ch-head">
          <div>
            <p class="ec-num">${pad(i + 1)}</p>
            <h2>${t(ch.title)}</h2>
          </div>
          <p class="ec-ch-lead">${t(ch.lead)}</p>
        </header>
        ${ch.blocks.map(block).join('')}
        ${ch.where ? `<p class="ec-where"><span>${t(ch.where)}</span></p>` : ''}
      </section>`,
        )
        .join('')}
      ${
        c.credits
          ? `<section class="ec-credits">
        <h2>Кто что делал</h2>
        <dl>${c.credits.map((x) => `<div><dt>${t(x.part)}</dt><dd>${t(x.who)}</dd></div>`).join('')}</dl>
        ${c.note ? `<p class="ec-note">${t(c.note)}</p>` : ''}
      </section>`
          : ''
      }
      ${
        next
          ? `<a class="case-next" href="${h.route}${next.slug}">
        <span class="case-next-label">Следующий кейс</span>
        <span class="case-next-title">${esc(next.title)} ${arrow}</span>
      </a>`
          : ''
      }
    </article>`;
}

/* ---------- ability panel widths, without and with the mod ---------- */

// Dota's own CSS: an ability slot is 58 px, Invoker's orbs block 80 px. The mod
// holds the panel at 290 px (5 slots): 4 abilities get 72.5 px cells, 6 and more
// are scaled down to fit, and the orbs block is narrowed to 56 px.
const SLOT = 58;
const ORBS = 80;
const ORBS_MOD = 56;
const FIXED = 290;
const HEROES = [
  { name: 'Алхимик', n: 4, orbs: false },
  { name: 'Кез', n: 6, orbs: false },
  { name: 'Инвокер', n: 6, orbs: true },
];
const SPAN = Math.max(...HEROES.map((x) => x.n * SLOT + (x.orbs ? ORBS : 0)));
const pct = (v: number) => `${((v / SPAN) * 100).toFixed(3)}%`;

function widths(caption: string) {
  // cells are sized against their own bar, the bar against the shared scale
  const bar = (cells: number[], orbs: number) => {
    const all = cells.reduce((a, b) => a + b, 0) + orbs;
    const of = (v: number) => `${((v / all) * 100).toFixed(3)}%`;
    return `${cells.map((w) => `<i class="ec-cell" style="width:${of(w)}"></i>`).join('')}${orbs ? `<i class="ec-cell ec-orbs" style="width:${of(orbs)}"><b></b><b></b><b></b></i>` : ''}`;
  };
  const row = (name: string, inner: string, width: number) =>
    `<div class="ec-w-row"><span class="ec-w-name">${name}</span><div class="ec-w-track"><div class="ec-w-bar" style="width:${pct(width)}">${inner}</div></div></div>`;
  const before = HEROES.map((x) => {
    const w = x.n * SLOT + (x.orbs ? ORBS : 0);
    return row(x.name, bar(Array(x.n).fill(SLOT), x.orbs ? ORBS : 0), w);
  }).join('');
  const after = HEROES.map((x) => {
    if (x.n <= 4) return row(x.name, bar(Array(x.n).fill(FIXED / x.n), 0), FIXED);
    const s = FIXED / (x.n * SLOT + (x.orbs ? ORBS_MOD : 0));
    return row(x.name, bar(Array(x.n).fill(SLOT * s), x.orbs ? ORBS_MOD * s : 0), FIXED);
  }).join('');
  return `<figure class="ec-m ec-widths">
    <div class="ec-w">
      <div class="ec-w-col">
        <p class="ec-w-title">Без мода</p>
        <p class="ec-w-sub">панель растёт, рамка HUD едет за ней</p>
        ${before}
      </div>
      <div class="ec-w-col ec-w-fixed" style="--edge:${pct(FIXED)}">
        <p class="ec-w-title">С модом</p>
        <p class="ec-w-sub">одна ширина, рамка стоит</p>
        ${after}
      </div>
    </div>
    <figcaption>${caption}</figcaption>
  </figure>`;
}

/* ---------- loops: load and play on screen only ---------- */

const quiet = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches ||
  Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);

let io: IntersectionObserver | null = null;

export function bindCaseMedia(root: HTMLElement) {
  // chapter links scroll inside the case; a plain #id would leave the case route
  root.querySelectorAll<HTMLAnchorElement>('[data-jump]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById(a.dataset.jump!)?.scrollIntoView({ behavior: quiet() ? 'auto' : 'smooth' });
    }),
  );
  io?.disconnect();
  const videos = root.querySelectorAll<HTMLVideoElement>('video.ec-video');
  if (!videos.length || quiet() || !('IntersectionObserver' in window)) return;
  io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        const v = e.target as HTMLVideoElement;
        if (e.isIntersecting) {
          if (!v.src) v.src = v.dataset.src!;
          v.play().catch(() => {});
        } else v.pause();
      }),
    { threshold: 0.25 },
  );
  videos.forEach((v) => io!.observe(v));
}

/** stop the loops when the case is left */
export function unbindCaseMedia() {
  io?.disconnect();
  io = null;
  document.querySelectorAll<HTMLVideoElement>('video.ec-video').forEach((v) => v.pause());
}
