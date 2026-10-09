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
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  const css = `
.kerno-cta-dim{position:fixed;inset:0;z-index:2147482999;background:#000;opacity:0;pointer-events:none;transition:opacity .7s cubic-bezier(.16,1,.3,1)}
.kerno-cta-dim.is-open{opacity:.55}
.kerno-cta{position:fixed;inset:0;z-index:2147483000;display:block;overflow:hidden;overscroll-behavior:contain;background:#edebe6;color:#0e0e0e;transform:translate3d(0,100%,0);transition:transform .75s cubic-bezier(.16,1,.3,1);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Helvetica Neue","Segoe UI",Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased;text-align:left}
.kerno-cta[hidden]{display:none}
.kerno-cta:focus{outline:none}
.kerno-cta.is-open{transform:none}
.kerno-cta *{box-sizing:border-box;margin:0;padding:0;font:inherit;color:inherit;letter-spacing:normal;text-transform:none;text-decoration:none;background:none;border:0;box-shadow:none}
.kerno-cta .kc-inner{height:100%;display:grid;grid-template-rows:auto 1fr auto;gap:24px;padding:max(22px,env(safe-area-inset-top)) clamp(20px,5vw,72px) max(22px,env(safe-area-inset-bottom))}
.kerno-cta .kc-top{display:flex;align-items:center;justify-content:space-between;gap:16px}
.kerno-cta .kc-mark{font-size:18px;font-weight:700;letter-spacing:.02em}
.kerno-cta .kc-close{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 2px;font-size:15px;font-weight:500;cursor:pointer;color:#0e0e0e;border-bottom:1px solid rgba(14,14,14,.35)}
.kerno-cta .kc-close:hover{border-bottom-color:#0e0e0e}
.kerno-cta .kc-main{align-self:end;padding-bottom:clamp(8px,4vh,48px)}
.kerno-cta .kc-h{font-size:clamp(34px,10.4vw,172px);font-weight:800;line-height:.98;letter-spacing:-.045em;text-transform:uppercase}
.kerno-cta .kc-p{margin-top:clamp(18px,3vh,32px);max-width:34ch;font-size:clamp(17px,1.7vw,23px);line-height:1.4;color:#4a4945}
.kerno-cta .kc-btn{display:inline-flex;align-items:center;gap:12px;margin-top:clamp(24px,4.5vh,48px);min-height:64px;padding:0 30px;border-radius:2px;background:#0e0e0e;color:#edebe6;font-size:16px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;transition:background .2s}
.kerno-cta .kc-btn:hover{background:#2b2a28}
.kerno-cta .kc-foot{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;padding-top:16px;border-top:1px solid rgba(14,14,14,.16);font-size:13px;color:#6b6a66}
.kerno-cta :focus-visible{outline:2px solid #0e0e0e;outline-offset:4px}
@media (max-width:520px){.kerno-cta .kc-h{font-size:11.8vw}.kerno-cta .kc-btn{width:100%;justify-content:center;padding:0 18px;font-size:15px}.kerno-cta .kc-foot span+span{display:none}}
@media (max-height:480px){.kerno-cta .kc-h{font-size:clamp(30px,7vw,64px)}.kerno-cta .kc-btn{min-height:52px;margin-top:18px}.kerno-cta .kc-p{margin-top:12px}}
@media (prefers-reduced-motion:reduce){.kerno-cta{transform:none;opacity:0;transition:opacity .15s linear}.kerno-cta.is-open{opacity:1}.kerno-cta-dim{transition:opacity .15s linear}}
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
      '<div class="kc-inner">' +
        '<div class="kc-top"><span class="kc-mark">KERNØ</span>' +
        '<button type="button" class="kc-close">Вернуться к проекту <span aria-hidden="true">↑</span></button></div>' +
        '<div class="kc-main">' +
          '<h2 class="kc-h" id="kerno-cta-h">Хотите себе такой же сайт?</h2>' +
          '<p class="kc-p">Напишите мне в Telegram — обсудим задачу.</p>' +
          '<a class="kc-btn" href="' + TG + '" target="_blank" rel="noopener">Написать в Telegram <span aria-hidden="true">↗</span></a>' +
        '</div>' +
        '<div class="kc-foot"><span>t.me/kerno_web</span><span>Прокрутите вверх, чтобы вернуться</span></div>' +
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
      const items = root.querySelectorAll('.kc-close, .kc-btn');
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
