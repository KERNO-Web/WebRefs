import { useEffect, useRef, useState } from 'react';
import { assets } from '../../data/assets';

const SHOTS = [
  { ...assets.terraceTree, alt: 'Розовое дерево и голубые диваны на террасе днём', caption: 'Терраса днём', cls: 'g-wide' },
  { ...assets.carClose, alt: 'Красный ретроавтомобиль на крыше террасы', caption: 'Автомобиль на крыше', cls: 'g-a' },
  { ...assets.bloom, alt: 'Дерево с гирляндами в зале вечером', caption: 'Второе дерево, в зале', cls: 'g-b' },
];
const pad = (n: number) => String(n).padStart(2, '0');

export function Gallery() {
  const dlg = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const [cur, setCur] = useState(0);
  const open = (i: number, e: React.MouseEvent<HTMLButtonElement>) => {
    opener.current = e.currentTarget; setCur(i);
    document.documentElement.classList.add('menu-open'); // stop the page behind
    dlg.current?.showModal();
  };
  const step = (d: number) => setCur((c) => (c + d + SHOTS.length) % SHOTS.length);

  useEffect(() => {
    const el = dlg.current!;
    const onKey = (e: KeyboardEvent) => {
      if (!el.open) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const shot = SHOTS[cur];
  return (
    <section className="gallery" id="gallery" data-tone="day" aria-labelledby="gallery-h">
      <h2 id="gallery-h" className="display">Детали</h2>
      <div className="g-grid">
        {SHOTS.map((s, i) => (
          <figure key={s.src} className={s.cls}>
            <button className="g-open" onClick={(e) => open(i, e)} aria-label={`Открыть фото: ${s.caption}`} data-cursor="view">
              <img src={s.src} alt={s.alt} loading="lazy" width={s.w} height={s.h} />
              <span className="g-cap" aria-hidden="true"><b>{pad(i + 1)}</b>{s.caption}</span>
            </button>
          </figure>
        ))}
      </div>
      <dialog ref={dlg} className="lightbox" aria-label={shot.caption}
        onClose={() => { document.documentElement.classList.remove('menu-open'); opener.current?.focus(); }}
        onClick={(e) => e.target === dlg.current && dlg.current?.close()}>
        <figure className="lb-fig">
          <img src={shot.src} alt={shot.alt} />
          <figcaption><b>{pad(cur + 1)} / {pad(SHOTS.length)}</b> {shot.caption}</figcaption>
        </figure>
        <div className="lb-bar">
          <button className="lb-btn" onClick={() => step(-1)} aria-label="Предыдущее фото">←</button>
          <button className="lb-btn" onClick={() => step(1)} aria-label="Следующее фото">→</button>
          <form method="dialog"><button className="lb-btn lb-close">Закрыть</button></form>
        </div>
      </dialog>
    </section>
  );
}
