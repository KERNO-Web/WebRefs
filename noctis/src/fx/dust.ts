/** Slow motes of warm light drifting upward. Paused off-screen. */
export function mountDust(canvas: HTMLCanvasElement, count = 70) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  let w = 0, h = 0, dpr = 1, raf = 0, visible = false;
  const motes = Array.from({ length: count }, () => ({
    x: Math.random(), y: Math.random(), r: 0.4 + Math.random() * 1.6, s: 0.02 + Math.random() * 0.05,
    a: 0.15 + Math.random() * 0.55, ph: Math.random() * Math.PI * 2, warm: Math.random() < 0.6,
  }));
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  let last = performance.now();
  const draw = (now: number) => {
    raf = 0;
    if (!visible) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (const m of motes) {
      m.y -= m.s * dt * 0.6;
      m.ph += dt * 0.6;
      if (m.y < -0.02) { m.y = 1.02; m.x = Math.random(); }
      const x = (m.x + Math.sin(m.ph) * 0.01) * w, y = m.y * h;
      const flick = 0.6 + 0.4 * Math.sin(m.ph * 2.3);
      const g = ctx.createRadialGradient(x, y, 0, x, y, m.r * 4);
      g.addColorStop(0, m.warm ? `rgba(240,196,150,${m.a * flick})` : `rgba(214,222,236,${m.a * flick})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, m.r * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = requestAnimationFrame(draw);
  };
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(draw); } });
  io.observe(canvas);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
}
