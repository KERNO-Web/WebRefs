import { useRef } from 'react';
import { assets } from '../../data/assets';
import { nb } from '../../app/nb';
import { useReveal } from '../../app/useReveal';

/** Daylight chapter: the title on its own line, the open roof below it, copy and a detail beside. */
export function Terrace() {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);
  return (
    <section className="terrace" id="terrace" data-tone="day" aria-labelledby="terrace-h" ref={ref}>
      <div className="tr-head reveal-type">
        <h2 id="terrace-h" className="title-xl tr-title">Терраса</h2>
      </div>
      <div className="tr-copy reveal-type reveal-late">
        <p className="body">{nb('Летняя терраса: белые деревянные диваны с голубыми подушками, гирлянды над столами и цветущие деревья среди них.')}</p>
        <button className="btn btn-arrow" type="button" data-book>Забронировать стол <span aria-hidden="true">→</span></button>
      </div>
      <figure className="tr-main reveal-img">
        <img src={assets.terraceDay.src} srcSet={`${assets.terraceDay.src} 1178w, ${assets.terraceDay.src2x} 2356w`} sizes="(max-width: 899px) 100vw, 62vw"
          alt="Терраса Sorry Mama днём: белые диваны с голубыми подушками, цветущее дерево и ретроавтомобиль на крыше" loading="lazy" width={1178} height={740} />
      </figure>
      <figure className="tr-detail reveal-img reveal-late">
        <img src={assets.table.src} alt="Фрукты и чай на деревянном столе террасы" loading="lazy" width={1080} height={1400} />
        <figcaption>Стол на террасе</figcaption>
      </figure>
    </section>
  );
}
