import { useRef } from 'react';
import { assets } from '../../data/assets';
import { venue } from '../../data/venue';
import { nb } from '../../app/nb';
import { useReveal } from '../../app/useReveal';

/** The booking destination: one call to action, the number in full, the choice of where to sit. */
export function Booking() {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);
  return (
    <section className="booking" id="booking" data-tone="night" aria-labelledby="booking-h" ref={ref}>
      {/* the lounge only ever seen out of focus: warmth behind the type, not a picture to read */}
      <img className="bk-bg" src={assets.nightSoft.src} alt="" aria-hidden="true" loading="lazy" />
      <div className="bk-grid">
        <div className="bk-head reveal-type">
          <p className="kicker"><b>06</b> / Бронь</p>
          <h2 id="booking-h" className="title-xl bk-title"><span>Забронируйте</span><span>стол</span></h2>
        </div>
        <div className="bk-side reveal-type reveal-late">
          <ul className="bk-where">
            <li><b>Терраса</b><span>днём, под открытым небом</span></li>
            <li><b>Зал</b><span>вечером, под деревом с фонарями</span></li>
          </ul>
          <p className="body">{nb('Бронь по телефону: скажите, сколько вас и где хотите сидеть.')}</p>
          <a className="btn btn-gold btn-xl btn-arrow" href={venue.phone.href}>Позвонить и забронировать <span aria-hidden="true">→</span></a>
          <a className="bk-phone" href={venue.phone.href}>{venue.phone.display}</a>
        </div>
      </div>
    </section>
  );
}
