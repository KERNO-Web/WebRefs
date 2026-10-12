import { useRef } from 'react';
import { assets } from '../../data/assets';
import { venue } from '../../data/venue';
import { useReveal } from '../../app/useReveal';

/** Closing frame, continuous with the booking block: the practical facts large, one framed photograph. */
export function Visit() {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);
  return (
    <section className="visit" id="contacts" data-tone="night" aria-labelledby="visit-h" ref={ref}>
      <div className="visit-main reveal-type">
        <p className="kicker"><b>07</b> / Контакты</p>
        <h2 id="visit-h" className="title-xl visit-title"><span>Как</span><span>добраться</span></h2>
        <div className="visit-rows">
          <div className="visit-cell">
            <p className="visit-k">Адрес</p>
            <address className="visit-addr">{venue.city}, {venue.street}<span>{venue.floor}</span></address>
            <div className="visit-links">
              <a className="btn btn-line" href={venue.maps.yandex} target="_blank" rel="noopener noreferrer">Яндекс Карты ↗</a>
              <a className="btn btn-line" href={venue.maps.twoGis} target="_blank" rel="noopener noreferrer">2ГИС ↗</a>
            </div>
          </div>
          <div className="visit-cell">
            <p className="visit-k">Телефон и бронь</p>
            <a className="visit-phone" href={venue.phone.href}>{venue.phone.display}</a>
            <p className="visit-note">{venue.hours ?? 'Часы работы уточняйте по телефону'}</p>
          </div>
        </div>
      </div>
      <figure className="visit-photo reveal-img">
        <img src={assets.terraceEvening.src} alt="Терраса Sorry Mama на закате: гирлянды над белыми диванами и розовое дерево" loading="lazy" width={1440} height={1800} />
        <figcaption>Терраса на закате</figcaption>
      </figure>
    </section>
  );
}
