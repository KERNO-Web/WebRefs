import { assets } from '../../data/assets';
import { venue } from '../../data/venue';
import { nb } from '../../app/nb';

/** A chapter turn back to daylight: the terrace on its own terms, not another transition. */
export function Terrace() {
  return (
    <section className="terrace" id="terrace" data-tone="day" aria-labelledby="terrace-h">
      <figure className="terrace-tall">
        <img src={assets.terraceEvening.src} alt="Терраса Sorry Mama на закате: гирлянды, белые диваны и цветущее дерево" loading="lazy" width={1440} height={1800} />
      </figure>
      <div className="terrace-text">
        <h2 id="terrace-h" className="display display-xl">Терраса</h2>
        <p className="body">{nb('Летняя терраса: белые деревянные диваны с голубыми подушками, гирлянды над столами и цветущие деревья.')}</p>
        <a className="btn" href={venue.phone.href}>Забронировать стол</a>
      </div>
      <figure className="terrace-small">
        <img src={assets.terraceCar.src} alt="Белое дерево и ретроавтомобиль на террасе" loading="lazy" width={1178} height={800} />
      </figure>
    </section>
  );
}
