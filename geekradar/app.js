// The chat comes alive as it scrolls: before each card the bot is «печатает…»,
// then the card arrives. The feedback buttons light up when pressed, as in the bot.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const statusEl = document.getElementById('status');
const msgs = [...document.querySelectorAll('.chat .m')];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

document.querySelectorAll('.kbs').forEach((kb) =>
  kb.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    kb.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b && !b.classList.contains('on')));
  }),
);

if (!reduce && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('js');
  // the first screen shows at once, the rest as it scrolls into view
  const fold = innerHeight * 0.9;
  msgs.forEach((m) => { if (m.getBoundingClientRect().top > fold) m.classList.add('wait'); });
  const queue = [];
  let busy = false;
  const drain = async () => {
    if (busy) return;
    busy = true;
    while (queue.length) {
      const m = queue.shift();
      if (m.classList.contains('in')) {
        statusEl.textContent = 'печатает…';
        statusEl.classList.add('live');
        await wait(600);
      }
      m.classList.remove('wait');
      statusEl.textContent = 'бот';
      statusEl.classList.remove('live');
      await wait(200);
    }
    busy = false;
  };
  const io = new IntersectionObserver((entries) => {
    entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => msgs.indexOf(a.target) - msgs.indexOf(b.target))
      .forEach((e) => { io.unobserve(e.target); queue.push(e.target); });
    drain();
  }, { rootMargin: '0px 0px -10% 0px' });
  msgs.forEach((m) => { if (m.classList.contains('wait')) io.observe(m); });
}
