import { venue } from '../data/venue';

export function Footer() {
  return (
    <footer className="foot" data-tone="night">
      <p className="foot-mark" aria-hidden="true">SORRY MAMA</p>
      <div className="foot-row">
        <p>{venue.name} · {venue.city}, {venue.street}</p>
        <a className="btn btn-gold btn-arrow" href={venue.phone.href}>Забронировать стол <span aria-hidden="true">→</span></a>
        <a className="link link-night" href={venue.phone.href}>{venue.phone.display}</a>
        <p className="foot-note">KERNØ · неофициальный концепт сайта. Не является сайтом заведения. Фотографии гостей из открытой галереи 2ГИС, права не согласованы.</p>
      </div>
    </footer>
  );
}
