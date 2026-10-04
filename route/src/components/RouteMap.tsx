import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useI18n } from '../i18n';

/* Demo route in Berlin: Mitte depot → Lindenstraße 14. Real map tiles, illustrative courier position. */
const DEPOT: L.LatLngTuple = [52.5121, 13.3889];
const HOME: L.LatLngTuple = [52.5048, 13.3958];
const PATH: L.LatLngTuple[] = [DEPOT, [52.5096, 13.3896], [52.5069, 13.3904], [52.5066, 13.3941], [52.5059, 13.3957], HOME];
const COURIER: L.LatLngTuple = [52.5089, 13.3898];

const pin = (cls: string, html = '') => L.divIcon({ className: 'pin ' + cls, html, iconSize: [28, 28], iconAnchor: [14, 14] });

export function RouteMap({ updated }: { updated: string }) {
  const { t, time } = useI18n();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const touch = matchMedia('(pointer: coarse)').matches;
    const map = L.map(el, { zoomSnap: 0.25, zoomControl: false, scrollWheelZoom: false, dragging: !touch, attributionControl: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.polyline(PATH, { color: '#176b55', weight: 4, opacity: 0.85, dashArray: '2 8', lineCap: 'round' }).addTo(map);
    L.marker(DEPOT, { icon: pin('depot'), keyboard: false }).addTo(map);
    L.marker(HOME, { icon: pin('home'), keyboard: false }).addTo(map);
    L.marker(COURIER, { icon: pin('courier', '<span></span>'), keyboard: false }).addTo(map);
    map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
    const fit = () => { const c = L.latLngBounds(PATH).getCenter(); map.setView([c.lat + 0.0006, c.lng], el.clientHeight >= 280 ? 14.5 : 14.25, { animate: false }); };
    fit();
    // keep the whole route in frame whenever the panel changes size
    const ro = new ResizeObserver(() => { map.invalidateSize(); fit(); });
    ro.observe(el);
    return () => { ro.disconnect(); map.remove(); };
  }, []);

  return (
    <figure className="map">
      <div className="map-canvas" ref={box} role="img" aria-label={t('Map of the delivery route from the depot to your address')} />
      <span className="map-demo">{t('Demo: courier position is illustrative')}</span>
      <figcaption>
        <b>{t('The courier is on the way to you')}</b>
        <span className="muted">{t('Last update: {time}', { time: time(updated) })}</span>
        <ul className="map-legend" aria-hidden="true">
          <li><i className="lg-depot" />{t('Depot')}</li>
          <li><i className="lg-courier" />{t('Courier')}</li>
          <li><i className="lg-home" />{t('Your address')}</li>
        </ul>
      </figcaption>
    </figure>
  );
}
