import { useRef, useState } from 'react';
import { assets } from '../../data/assets';

const SHOTS = [
  { ...assets.terraceEvening, alt: 'Терраса на закате: гирлянды, белые диваны и цветущее дерево', caption: 'Терраса на закате', cls: 'g-wide' },
  { ...assets.carClose, alt: 'Красный ретроавтомобиль на крыше террасы', caption: 'Автомобиль на террасе', cls: 'g-a' },
  { ...assets.bloom, alt: 'Дерево с гирляндами в зале вечером', caption: 'Дерево в зале', cls: 'g-b' },
];

export function Gallery() {
  const dlg = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const [cur, setCur] = useState(0);
  const open = (i: number, e: React.MouseEvent<HTMLButtonElement>) => { opener.current = e.currentTarget; setCur(i); dlg.current?.showModal(); };
  const shot = SHOTS[cur];
  return (
    <section className="gallery" id="gallery" data-tone="day" aria-labelledby="gallery-h">
      <h2 id="gallery-h" className="display">Детали</h2>
      <div className="g-grid">
        {SHOTS.map((s, i) => (
          <figure key={s.src} className={s.cls}>
            <button className="g-open" onClick={(e) => open(i, e)} aria-label={`Открыть фото: ${s.caption}`}>
              <img src={s.src} alt={s.alt} loading="lazy" width={s.w} height={s.h} />
            </button>
            <figcaption>{s.caption}</figcaption>
          </figure>
        ))}
      </div>
      <dialog ref={dlg} className="lightbox" aria-label={shot.caption} onClose={() => opener.current?.focus()}
        onClick={(e) => e.target === dlg.current && dlg.current?.close()}>
        <img src={shot.src} alt={shot.alt} />
        <form method="dialog"><button className="lb-close" aria-label="Закрыть">Закрыть</button></form>
      </dialog>
    </section>
  );
}
