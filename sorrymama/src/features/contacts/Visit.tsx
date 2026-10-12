import { assets } from '../../data/assets';
import { venue } from '../../data/venue';

export function Visit() {
  return (
    <section className="visit" id="contacts" data-tone="night" aria-labelledby="visit-h">
      <div className="visit-hero">
        <img src={assets.canopy.src} alt="Крона дерева с фонарями и гирляндами под потолком зала Sorry Mama" loading="lazy" width={1440} height={1100} />
        <h2 id="visit-h" className="visit-title"><span>Как</span><span>добраться</span></h2>
      </div>
      <div className="visit-row">
        <div className="visit-cell">
          <p className="visit-k">Адрес</p>
          <address className="visit-addr"><span>{venue.city}, {venue.street}</span><span>{venue.floor}</span></address>
          <div className="visit-links">
            <a className="link link-night" href={venue.maps.yandex} target="_blank" rel="noopener noreferrer">Яндекс Карты ↗</a>
            <a className="link link-night" href={venue.maps.twoGis} target="_blank" rel="noopener noreferrer">2ГИС ↗</a>
          </div>
        </div>
        <div className="visit-cell">
          <p className="visit-k">Телефон</p>
          <a className="visit-phone" href={venue.phone.href}>{venue.phone.display}</a>
          <p className="visit-note">{venue.hours ?? 'Часы работы уточняйте по телефону'}</p>
        </div>
        <div className="visit-cell">
          <p className="visit-k">Бронь</p>
          <a className="btn btn-gold btn-arrow" href={venue.phone.href}>Забронировать стол <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </section>
  );
}
