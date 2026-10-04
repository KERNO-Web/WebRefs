import { useState } from 'react';
import { useI18n } from './i18n';
import { navigate, scrollToId, useRoute, useRouteScroll } from './store';
import { Header, type NavTarget } from './ui/Header';
import { Logo } from './ui/bits';
import { Home, type CatalogState } from './pages/Home';
import { ServicePage } from './pages/Service';
import { OrderPage, OrdersPage } from './pages/Order';

export default function App() {
  const { t } = useI18n();
  const route = useRoute();
  const [catalog, setCatalog] = useState<CatalogState>({ game: 'all', cat: 'all' });
  useRouteScroll(route);

  const onNav = (n: NavTarget) => {
    if (n.game) setCatalog({ game: n.game, cat: 'all' });
    if (route.page === 'home') requestAnimationFrame(() => scrollToId(n.anchor));
    else navigate('#/', n.anchor);
  };

  return (
    <>
      <Header onNav={onNav} />
      {route.page === 'home' && <Home catalog={catalog} setCatalog={setCatalog} />}
      {route.page === 'service' && <ServicePage key={route.id} id={route.id} />}
      {route.page === 'order' && <OrderPage id={route.id} />}
      {route.page === 'orders' && <OrdersPage />}
      <footer className="foot">
        <div className="foot-top">
          <a className="brand" href="#/" onClick={(e) => { e.preventDefault(); navigate('#/'); }}><Logo />RANKED</a>
          <nav aria-label={t('Подвал')}>
            <button onClick={() => onNav({ anchor: 'games' })}>{t('Игры')}</button>
            <button onClick={() => onNav({ anchor: 'catalog' })}>{t('Услуги')}</button>
            <button onClick={() => onNav({ anchor: 'reviews' })}>{t('Отзывы')}</button>
            <button onClick={() => navigate('#/orders')}>{t('Мои заказы')}</button>
          </nav>
        </div>
        <p>{t('Демо-проект для портфолио. Не связан с Valve, Riot Games, Rockstar Games и FACEIT. Изображения — официальные материалы правообладателей. Заказы и оплата не настоящие.')}</p>
      </footer>
    </>
  );
}
