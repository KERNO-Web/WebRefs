import { useRef } from 'react';
import { assets } from '../../data/assets';
import { venue } from '../../data/venue';
import { nb } from '../../app/nb';
import { useReveal } from '../../app/useReveal';

/** One asymmetric artboard: photograph → title → action, a diagonal read. */
export function Terrace() {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);
  return (
    <section className="terrace" id="terrace" data-tone="day" aria-labelledby="terrace-h" ref={ref}>
      <figure className="tr-main reveal-img">
        <img src={assets.terraceEvening.src} alt="Терраса Sorry Mama на закате: гирлянды над белыми диванами и розовое дерево" loading="lazy" width={1440} height={1800} />
      </figure>
      <p className="tr-index reveal-type" aria-hidden="true"><b>03</b> / День</p>
      <h2 id="terrace-h" className="tr-title reveal-type">Терраса</h2>
      <div className="tr-copy reveal-type">
        <p className="body">{nb('Летняя терраса: белые деревянные диваны с голубыми подушками, гирлянды над столами и цветущие деревья среди них.')}</p>
        <a className="btn btn-arrow" href={venue.phone.href}>Забронировать стол <span aria-hidden="true">→</span></a>
      </div>
      <figure className="tr-detail reveal-img reveal-late">
        <img src={assets.table.src} alt="Фрукты и чай на деревянном столе террасы" loading="lazy" width={1080} height={1400} />
        <figcaption>Стол на террасе</figcaption>
      </figure>
    </section>
  );
}
