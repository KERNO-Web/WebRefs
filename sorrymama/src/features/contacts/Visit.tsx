import { assets } from '../../data/assets';
import { venue } from '../../data/venue';

export function Visit() {
  return (
    <section className="visit" id="contacts" data-tone="night" aria-labelledby="visit-h">
      <div className="visit-text">
        <h2 id="visit-h" className="display">Как добраться</h2>
        <address className="visit-addr">
          <span className="visit-name">{venue.name}</span>
          <span>{venue.city}, {venue.street}</span>
          <span>{venue.floor}</span>
        </address>
        <a className="visit-phone" href={venue.phone.href}>{venue.phone.display}</a>
        <p className="visit-note">{venue.hours ?? 'Часы работы уточняйте по телефону'}</p>
        <div className="visit-actions">
          <a className="btn btn-gold" href={venue.phone.href}>Забронировать стол</a>
          <a className="link link-night" href={venue.maps.yandex} target="_blank" rel="noopener noreferrer">Проложить маршрут</a>
          <a className="link link-night" href={venue.maps.twoGis} target="_blank" rel="noopener noreferrer">2ГИС</a>
        </div>
      </div>
      <figure className="visit-photo">
        <img src={assets.lounge.src} alt="Бар и бархатные диваны в зале Sorry Mama" loading="lazy" width={1440} height={2440} />
      </figure>
    </section>
  );
}
