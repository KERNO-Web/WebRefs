/*
 * Everything factual the page shows. Change it here, not in components.
 * Address and phone agree across 2GIS, Yandex Maps, Zoon, Restoran.cafe, ТоМесто (checked 12–13.10.2026).
 * Opening hours disagree between sources, so none are shown.
 */

export const venue = {
  name: 'Sorry Mama',
  kind: 'Рест-лаунж',
  city: 'Казань',
  street: 'ул. Фатыха Амирхана, 21г',
  floor: '2 этаж',
  phone: { display: '+7 (843) 203-33-03', href: 'tel:+78432033303' },
  hours: null as string | null, // unverified: «Часы работы уточняйте по телефону»
  maps: {
    yandex: 'https://yandex.ru/maps/org/sorry_mama/169351776272/',
    twoGis: 'https://2gis.ru/kazan/firm/70000001034900657',
  },
  menuSource: 'https://2gis.ru/kazan/firm/70000001034900657/tab/menu',
} as const;
