// Живая лента: карточки заказов приходят по одной, как в настоящем чате с ботом.
const feed = document.getElementById('feed');
const statusEl = document.getElementById('status');
const cards = [...document.getElementById('cards').content.children];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function loop() {
  if (reduce) {
    cards.forEach((c) => feed.append(c.cloneNode(true)));
    return;
  }
  for (;;) {
    for (const c of cards) {
      statusEl.textContent = 'проверяет биржи…';
      const typing = document.createElement('div');
      typing.className = 'typing';
      typing.innerHTML = '<i></i><i></i><i></i>';
      feed.append(typing);
      await wait(1400);
      typing.remove();
      feed.querySelectorAll('.card').forEach((el) => el.classList.add('old'));
      feed.append(c.cloneNode(true));
      statusEl.textContent = 'бот';
      // старые карточки уезжают вверх, в ленте остаются две последние
      while (feed.querySelectorAll('.card').length > 2) feed.querySelector('.card').remove();
      await wait(4200);
    }
  }
}
loop();

// Сито: строки появляются по очереди, мусор зачёркивается
const rows = [...document.querySelectorAll('#sieve li')];
if (reduce || !('IntersectionObserver' in window)) {
  rows.forEach((li) => li.classList.add('in'));
} else {
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    rows.forEach((li, i) => setTimeout(() => li.classList.add('in'), i * 260));
    io.disconnect();
  }, { threshold: 0.25 });
  io.observe(document.getElementById('sieve'));
}
