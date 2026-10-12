/*
 * KERNØ end-of-project CTA.
 * Self-contained: injects its own styles and markup, no dependencies.
 * The same file ships in every portfolio project's public/ folder.
 *
 * Opens only after the visitor has reached the true bottom of the page
 * and then makes one more deliberate downward gesture. Never prevents
 * page scrolling; leaves on upward scroll/swipe, the close control or Escape.
 *
 * Optional: <script src="./kerno-end-cta.js" data-kerno-scope=".selector" defer>
 * limits the CTA to views where that selector exists.
 */
(() => {
  if (window.__kernoEndCta) return;
  window.__kernoEndCta = true;

  const TG = 'https://t.me/kerno_web';
  const SESSION_KEY = 'kerno-end-cta-shown';
  const script = document.currentScript;
  const scope = script && script.dataset.kernoScope;
  const backLabel = (script && script.dataset.kernoBack) || 'Вернуться к проекту';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  const css = `
.kerno-cta-dim{position:fixed;inset:0;z-index:2147482999;background:#000;opacity:0;pointer-events:none;transition:opacity .8s cubic-bezier(.16,1,.3,1)}
.kerno-cta-dim.is-open{opacity:.6}
.kerno-cta{position:fixed;inset:0;z-index:2147483000;display:block;overflow:hidden;overscroll-behavior:contain;color:#f4f3ef;text-align:left;
  background:radial-gradient(70% 60% at 8% 100%,rgba(124,108,255,.13),transparent 70%),radial-gradient(120% 90% at 50% 40%,transparent 55%,rgba(0,0,0,.55) 100%),linear-gradient(180deg,#121216 0%,#0b0b0d 55%,#09090b 100%);
  transform:translate3d(0,100%,0);transition:transform .72s cubic-bezier(.16,1,.3,1);
  font-family:Onest,-apple-system,BlinkMacSystemFont,"SF Pro Display","Helvetica Neue","Segoe UI",Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.kerno-cta[hidden]{display:none}
.kerno-cta:focus{outline:none}
html body .kerno-cta.kerno-cta,html body .kerno-cta.kerno-cta *{cursor:default!important;pointer-events:auto}
html body .kerno-cta.kerno-cta .kc-btn,html body .kerno-cta.kerno-cta .kc-handle,html body .kerno-cta.kerno-cta .kc-close,html body .kerno-cta.kerno-cta .kc-btn *,html body .kerno-cta.kerno-cta .kc-close *{cursor:pointer!important}
html body .kerno-cta.kerno-cta .kc-o{pointer-events:none}
.kerno-cta.is-open{transform:none}
.kerno-cta *{box-sizing:border-box;margin:0;padding:0;font:inherit;color:inherit;letter-spacing:normal;text-transform:none;text-decoration:none;background:none;border:0;box-shadow:none}
.kerno-cta::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.07;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .6 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.kerno-cta .kc-o{position:absolute;right:-19vw;top:50%;height:min(124vh,118vw);width:auto;aspect-ratio:100/110;transform:translate3d(0,-38%,0);opacity:0;transition:transform 1.05s cubic-bezier(.16,1,.3,1),opacity .9s cubic-bezier(.16,1,.3,1);pointer-events:none}
.kerno-cta.is-open .kc-o{transform:translate3d(0,-50%,0);opacity:1}
.kerno-cta .kc-inner{position:relative;z-index:1;height:100%;display:grid;grid-template-rows:auto 1fr auto;gap:24px;padding:max(24px,env(safe-area-inset-top)) clamp(20px,5vw,72px) max(22px,env(safe-area-inset-bottom))}
.kerno-cta .kc-top{display:flex;align-items:center;justify-content:space-between;gap:16px}
.kerno-cta .kc-mark{display:inline-flex;align-items:baseline;gap:10px;font-size:15px;font-weight:600;color:#8c8c92}
.kerno-cta .kc-mark b{font-size:18px;font-weight:800;letter-spacing:-.01em;color:#f4f3ef}
.kerno-cta .kc-mark i{font-style:normal;color:#7c6cff}
.kerno-cta .kc-close{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 4px;font-size:15px;font-weight:600;color:#f4f3ef;cursor:pointer;transition:color .2s}
.kerno-cta .kc-close:hover{color:#fff}
.kerno-cta .kc-main{align-self:end;max-width:100%;padding-bottom:clamp(8px,5vh,64px)}
.kerno-cta .kc-h{font-size:clamp(38px,7.1vw,136px);font-weight:800;line-height:1.06;letter-spacing:-.05em;text-transform:uppercase;color:#f4f3ef}
.kerno-cta .kc-p{margin-top:clamp(18px,3vh,30px);max-width:32ch;font-size:clamp(17px,1.6vw,22px);line-height:1.45;color:#a9a8ae}
.kerno-cta .kc-row{display:flex;flex-wrap:wrap;align-items:center;gap:14px 28px;margin-top:clamp(26px,4.5vh,46px)}
.kerno-cta .kc-btn{display:inline-flex;align-items:center;gap:12px;min-height:62px;padding:0 28px;border-radius:6px;background:#7c6cff;color:#0b0b0d;font-size:16px;font-weight:700;letter-spacing:.02em;text-transform:uppercase;cursor:pointer;transition:background .2s,transform .2s}
.kerno-cta .kc-btn:hover{background:#8f81ff}
.kerno-cta .kc-btn:active{transform:translateY(1px)}
.kerno-cta .kc-handle{font-size:17px;font-weight:600;color:#f4f3ef;border-bottom:1px solid rgba(244,243,239,.25);padding-bottom:2px;transition:border-color .2s}
.kerno-cta .kc-handle:hover{border-bottom-color:#7c6cff}
.kerno-cta .kc-foot{display:flex;justify-content:flex-start;gap:8px 18px;flex-wrap:wrap;max-width:calc(100% - 20vw);padding-top:16px;border-top:1px solid rgba(244,243,239,.1);font-size:13px;color:#8c8c92}
.kerno-cta .kc-h,.kerno-cta .kc-p,.kerno-cta .kc-row{opacity:0;transform:translate3d(0,18px,0);transition:opacity .6s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
.kerno-cta .kc-p{transition-delay:.06s}
.kerno-cta.is-open .kc-h{opacity:1;transform:none;transition-delay:.16s}
.kerno-cta.is-open .kc-p{opacity:1;transform:none;transition-delay:.24s}
.kerno-cta.is-open .kc-row{opacity:1;transform:none;transition-delay:.32s}
.kerno-cta :focus-visible{outline:2px solid #f4f3ef;outline-offset:4px}
@media (max-width:760px){
  .kerno-cta .kc-o{right:-34vw;top:-4vh;height:62vh;transform:translate3d(0,8%,0)}
  .kerno-cta.is-open .kc-o{transform:none}
  .kerno-cta .kc-main{align-self:end;padding-bottom:8px}
  .kerno-cta .kc-h{font-size:12.4vw;line-height:1.04}
  .kerno-cta .kc-foot{max-width:none}
  .kerno-cta .kc-btn{width:100%;justify-content:center;padding:0 18px;font-size:15px}
  .kerno-cta .kc-mark span{display:none}
  .kerno-cta .kc-foot span+span{display:none}
}
@media (max-height:480px){.kerno-cta .kc-h{font-size:clamp(30px,6.4vw,60px)}.kerno-cta .kc-btn{min-height:50px;width:auto}.kerno-cta .kc-row{margin-top:16px}.kerno-cta .kc-p{margin-top:10px}.kerno-cta .kc-o{height:150vh;top:50%;right:-10vw;transform:translate3d(0,-50%,0)}}
@media (prefers-reduced-motion:reduce){.kerno-cta{transform:none;opacity:0;transition:opacity .18s linear}.kerno-cta.is-open{opacity:1}.kerno-cta .kc-o,.kerno-cta .kc-h,.kerno-cta .kc-p,.kerno-cta .kc-row{transition:none!important}.kerno-cta-dim{transition:opacity .18s linear}}
`;

  let root = null;
  let dim = null;
  let open = false;
  let prevFocus = null;
  let lastClose = 0;
  let armedAt = 0; // when the visitor arrived at the bottom
  let leftBottom = true; // after a close, the visitor must leave the bottom before it can reopen
  let wheelAcc = 0;
  let wheelStart = 0;
  let lastWheel = 0;
  let touchY = null;
  let touchReady = false;

  const doc = () => document.scrollingElement || document.documentElement;
  const maxScroll = () => doc().scrollHeight - window.innerHeight;
  // a page that barely scrolls has no "end" to scroll past
  const atBottom = () => maxScroll() > 120 && window.scrollY >= maxScroll() - 4;
  const markShown = () => { try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* ignore */ } };

  function blocked() {
    if (open) return true;
    if (scope && !document.querySelector(scope)) return true;
    if (getComputedStyle(document.body).overflow === 'hidden') return true; // the project has its own dialog open
    if (document.querySelector('[aria-modal="true"]:not(.kerno-cta)')) return true;
    if (!leftBottom) return true;
    return Date.now() - lastClose < 1200;
  }
  // the extra gesture has to start after arriving, not be the tail of the fling that got here
  const ready = (start) => armedAt > 0 && start - armedAt > 300 && atBottom() && !blocked();

  function build() {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    dim = document.createElement('div');
    dim.className = 'kerno-cta-dim';
    dim.setAttribute('aria-hidden', 'true');
    root = document.createElement('div');
    root.className = 'kerno-cta';
    root.hidden = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'kerno-cta-h');
    root.tabIndex = -1;
    root.innerHTML =
      // the brand object: KERNØ's Ø as geometry, cropped by the viewport
      '<svg class="kc-o" viewBox="0 0 100 110" aria-hidden="true"><defs><linearGradient id="kc-og" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="#8a7cff"/><stop offset=".55" stop-color="#7c6cff"/><stop offset="1" stop-color="#4f46a8"/></linearGradient></defs>' +
        '<g fill="none" stroke="url(#kc-og)"><ellipse cx="50" cy="55" rx="34" ry="41" stroke-width="16"/><path d="M86 6 14 104" stroke-width="12"/></g></svg>' +
      '<div class="kc-inner">' +
        '<div class="kc-top"><span class="kc-mark"><b>KERN<i>Ø</i></b><span>Digital products</span></span>' +
        '<button type="button" class="kc-close">' + backLabel + ' <span aria-hidden="true">↑</span></button></div>' +
        '<div class="kc-main">' +
          '<h2 class="kc-h" id="kerno-cta-h">Хотите себе<br>такой же сайт?</h2>' +
          '<p class="kc-p">Напишите мне в&nbsp;Telegram&nbsp;— обсудим задачу.</p>' +
          '<div class="kc-row">' +
            '<a class="kc-btn" href="' + TG + '" target="_blank" rel="noopener">Написать в&nbsp;Telegram</a>' +
            '<a class="kc-handle" href="' + TG + '" target="_blank" rel="noopener">@kerno_web</a>' +
          '</div>' +
        '</div>' +
        '<div class="kc-foot"><span>© KERNØ</span><span>Прокрутите вверх, чтобы вернуться</span></div>' +
      '</div>';
    document.body.appendChild(dim);
    document.body.appendChild(root);
    root.querySelector('.kc-close').addEventListener('click', close);

    // inside the layer: scrolling up or swiping down closes it; nothing scrolls the page behind
    root.addEventListener('wheel', (e) => { e.preventDefault(); if (e.deltaY < -24) close(); }, { passive: false });
    let y0 = null;
    root.addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; }, { passive: true });
    root.addEventListener('touchmove', (e) => { if (e.cancelable) e.preventDefault(); }, { passive: false });
    root.addEventListener('touchend', (e) => {
      if (y0 !== null && e.changedTouches[0].clientY - y0 > 70) close();
      y0 = null;
    });
  }

  function show() {
    if (!root) build();
    open = true;
    markShown();
    prevFocus = document.activeElement;
    root.hidden = false;
    // next frame so the transition runs from the hidden position
    requestAnimationFrame(() => requestAnimationFrame(() => {
      root.classList.add('is-open');
      dim.classList.add('is-open');
    }));
    root.focus({ preventScroll: true });
    document.addEventListener('keydown', onKey, true);
  }

  function close() {
    if (!open) return;
    open = false;
    lastClose = Date.now();
    leftBottom = false;
    armedAt = 0;
    root.classList.remove('is-open');
    dim.classList.remove('is-open');
    document.removeEventListener('keydown', onKey, true);
    const done = () => { if (!open) root.hidden = true; };
    if (reduce.matches) setTimeout(done, 160); else setTimeout(done, 760);
    if (prevFocus && prevFocus.focus) prevFocus.focus({ preventScroll: true });
  }

  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') {
      const items = root.querySelectorAll('.kc-close, .kc-btn, .kc-handle');
      const first = items[0], last = items[items.length - 1];
      if (document.activeElement === root) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  function onScroll() {
    if (open) return;
    if (atBottom()) {
      if (!armedAt) armedAt = Date.now();
    } else {
      armedAt = 0;
      wheelAcc = 0;
      if (window.scrollY < maxScroll() - 200) leftBottom = true;
    }
  }

  function onWheel(e) {
    if (open) return;
    const now = Date.now();
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
    // a pause separates one gesture from the next (trackpad momentum is continuous)
    if (now - lastWheel > 220) { wheelAcc = 0; wheelStart = now; }
    lastWheel = now;
    if (dy <= 0) { wheelAcc = 0; return; }
    if (!atBottom()) return;
    if (!armedAt) armedAt = now;
    wheelAcc += dy;
    if (wheelAcc > 90 && ready(wheelStart)) { wheelAcc = 0; show(); }
  }

  function onKeyDown(e) {
    if (open || e.defaultPrevented) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    const down = e.key === 'PageDown' || e.key === 'ArrowDown' || e.key === 'End' || (e.key === ' ' && !e.shiftKey && !(t && t.tagName === 'BUTTON'));
    if (down && ready(Date.now())) show();
  }

  function onTouchStart(e) {
    if (open || e.touches.length !== 1) return;
    touchY = e.touches[0].clientY;
    touchReady = ready(Date.now());
  }
  function onTouchEnd(e) {
    if (touchY === null) return;
    const swipedUp = touchY - e.changedTouches[0].clientY > 70; // finger up = scroll down
    touchY = null;
    if (touchReady && swipedUp && atBottom() && !blocked()) show();
    touchReady = false;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  window.addEventListener('wheel', onWheel, { passive: true });
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchend', onTouchEnd, { passive: true });

})();
