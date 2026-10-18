// Чат оживает при прокрутке: перед ответом бота «печатает…», потом сообщение появляется.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const statusEl = document.getElementById('status');
const sieve = document.getElementById('sieve');
const msgs = [...document.querySelectorAll('.chat .m')];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function cutSieve() {
  [...sieve.children].forEach((li, i) => setTimeout(() => li.classList.add('cut'), reduce ? 0 : 350 + i * 260));
}

if (reduce || !('IntersectionObserver' in window)) {
  sieve.classList.add('static');
} else {
  document.documentElement.classList.add('js');
  // первый экран показываем сразу, остальное по мере прокрутки
  const fold = innerHeight * 0.9;
  const queue = [];
  let busy = false;
  msgs.forEach((m) => { if (m.getBoundingClientRect().top > fold) m.classList.add('wait'); });

  async function drain() {
    if (busy) return;
    busy = true;
    while (queue.length) {
      const m = queue.shift();
      if (m.classList.contains('in')) {
        statusEl.textContent = 'печатает…';
        statusEl.classList.add('live');
        await wait(650);
      }
      m.classList.remove('wait');
      statusEl.textContent = 'бот';
      statusEl.classList.remove('live');
      if (m.contains(sieve)) cutSieve();
      await wait(m.classList.contains('out') ? 260 : 180);
    }
    busy = false;
  }

  const io = new IntersectionObserver((entries) => {
    entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => msgs.indexOf(a.target) - msgs.indexOf(b.target))
      .forEach((e) => { io.unobserve(e.target); queue.push(e.target); });
    drain();
  }, { rootMargin: '0px 0px -12% 0px' });

  msgs.forEach((m) => {
    if (m.classList.contains('wait')) io.observe(m);
    else if (m.contains(sieve)) cutSieve();
  });
}
