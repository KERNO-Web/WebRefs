import { venue } from '../data/venue';

export function Footer() {
  return (
    <footer className="foot" data-tone="night">
      <div className="foot-row">
        <p>{venue.name} · {venue.city}, {venue.street}</p>
        <button className="btn btn-gold btn-arrow" type="button" data-book>Забронировать стол <span aria-hidden="true">→</span></button>
        <a className="link link-night" href={venue.phone.href}>{venue.phone.display}</a>
        <p className="foot-note">Сайт — KERNØ. Фотографии гостей из открытой галереи 2ГИС, права не согласованы.</p>
      </div>
    </footer>
  );
}
