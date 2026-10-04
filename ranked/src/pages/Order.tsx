import { useEffect, useState } from 'react';
import { BOOSTERS, gameById, serviceById } from '../data';
import { useI18n } from '../i18n';
import { STAGES, clearOrders, navigate, stageOf, useOrders } from '../store';
import { GameTag, Icon, svcImg, useSummary } from '../ui/bits';

const STAGE_NAMES = ['Ищем исполнителя', 'Исполнитель назначен', 'В работе', 'Выполнено'];

function useNow(active: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

const time = (ts: number, lang: string) => new Date(ts).toLocaleTimeString(lang === 'ru' ? 'ru-RU' : 'en-GB', { hour: '2-digit', minute: '2-digit' });

export function OrderPage({ id }: { id: number }) {
  const { t, tr, rub, days, lang } = useI18n();
  const summary = useSummary();
  const orders = useOrders();
  const o = orders.find((x) => x.id === id);
  const now = useNow(!!o && stageOf(o, Date.now()) < 3);

  if (!o) {
    return (
      <main className="page narrow">
        <div className="empty"><p>{t('Заказ #{id} не найден в этом браузере.', { id })}</p>
          <button className="btn primary" onClick={() => navigate('#/orders')}>{t('Мои заказы')}</button></div>
      </main>
    );
  }
  const s = serviceById(o.service)!;
  const g = gameById(s.game);
  const stage = stageOf(o, now);
  const b = BOOSTERS[s.game];
  const sum = summary(s, o.choice);
  const extras = s.extras.filter((e) => o.choice.extras.includes(e.id)).map((e) => tr(e.label));
  if (s.modes) extras.unshift(o.choice.mode === 'duo' ? t('Вместе с вами') : t('Играет исполнитель'));

  return (
    <main className="page narrow order-page" style={{ ['--gc' as string]: g.color }}>
      <button className="back" onClick={() => navigate('#/orders')}><Icon name="back" size={18} />{t('Мои заказы')}</button>
      <div className="order-banner cut-lg">
        <img src={svcImg(s.id, true)} alt="" width="1600" height="900" />
        <div className="ob-copy">
          <GameTag game={s.game} full />
          <h1>{t('Заказ')} #{o.id}</h1>
          <span className={'status s' + stage}>{t(STAGE_NAMES[stage])}</span>
        </div>
      </div>

      <div className="order-card">
        <div className="oc-main">
          <span className="eyebrow">{tr(s.title)}</span>
          <b className="order-label">{sum.title}</b>
          {sum.detail && <span className="muted">{sum.detail}</span>}
          {extras.length > 0 && <span className="muted">{extras.join(' · ')}</span>}
        </div>
        <dl>
          <div><dt>{t('Сумма')}</dt><dd>{rub(o.price)}</dd></div>
          <div><dt>{t('Срок')}</dt><dd>≈ {days(o.days)}</dd></div>
          <div><dt>{t('Связь')}</dt><dd>{o.contact}</dd></div>
        </dl>
      </div>

      <ol className="timeline">
        {STAGE_NAMES.map((n, i) => (
          <li key={n} className={i < stage || (i === 3 && stage === 3) ? 'done' : i === stage ? 'now' : ''}>
            <span className="dot" aria-hidden="true">{i < stage || (i === 3 && stage === 3) ? <Icon name="check" size={14} /> : null}</span>
            <div>
              <b>{t(n)}</b>
              {i <= stage && <small>{time(o.at + STAGES[i], lang)}</small>}
              {i === 0 && stage === 0 && <p>{t('Подбираем игрока под вашу игру и ранг. Обычно это занимает несколько минут.')}</p>}
              {i === 1 && stage >= 1 && (
                <div className="booster">
                  <span className="ava" aria-hidden="true">{b.nick[0].toUpperCase()}</span>
                  <span><b>{b.nick}</b><small>{tr(b.note)} · ★ {b.rating} · {t('{n} заказов', { n: b.orders.toLocaleString('ru-RU') })}</small></span>
                </div>
              )}
              {i === 2 && stage === 2 && <p>{t('Исполнитель играет. Прогресс обновится здесь после сессии, а уведомление придёт в {c}.', { c: o.contact })}</p>}
              {i === 3 && stage === 3 && <p>{t('Готово. Если давали пароль от аккаунта — поменяйте его.')}</p>}
            </div>
          </li>
        ))}
      </ol>
      <p className="fine">{t('Демо-заказ: статусы меняются сами, исполнитель вымышленный.')}</p>
    </main>
  );
}

export function OrdersPage() {
  const { t, tr, rub } = useI18n();
  const summary = useSummary();
  const orders = useOrders();
  const now = useNow(orders.some((o) => stageOf(o, Date.now()) < 3));

  return (
    <main className="page narrow">
      <h1 className="page-h">{t('Мои заказы')}</h1>
      {orders.length === 0 ? (
        <div className="empty big">
          <Icon name="bag" size={28} />
          <p>{t('Заказов пока нет. Выберите игру и услугу — оформление займёт минуту.')}</p>
          <button className="btn primary" onClick={() => navigate('#/', 'games')}>{t('Выбрать игру')}</button>
        </div>
      ) : (
        <>
          <ul className="order-list">
            {orders.map((o) => {
              const s = serviceById(o.service)!;
              const st = stageOf(o, now);
              return (
                <li key={o.id} style={{ ['--gc' as string]: gameById(s.game).color }}>
                  <a href={`#/order/${o.id}`} onClick={(e) => { e.preventDefault(); navigate(`#/order/${o.id}`); }}>
                    <img className="cut-sm" src={svcImg(s.id)} alt="" width="96" height="54" />
                    <span className="ol-main"><small>#{o.id} · {gameById(s.game).short} · {tr(s.title)}</small><b>{summary(s, o.choice).title}</b></span>
                    <span className={'status s' + st}>{t(STAGE_NAMES[st])}</span>
                    <b className="ol-price">{rub(o.price)}</b>
                  </a>
                </li>
              );
            })}
          </ul>
          <button className="link" onClick={clearOrders}>{t('Очистить демо-заказы')}</button>
        </>
      )}
    </main>
  );
}
