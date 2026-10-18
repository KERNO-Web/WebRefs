import { useEffect, useRef, useState, type FormEvent } from 'react';
import { venue } from '../../data/venue';
import { formatPhone, phoneOk, sendBooking, type BookingRequest } from '../../data/booking';

const GUESTS = ['1', '2', '3', '4', '5', '6', '7+'];
const FOR: Record<string, string> = { '1': 'одного', '2': 'двоих', '3': 'троих', '4': 'четверых', '5': 'пятерых', '6': 'шестерых', '7+': 'компанию от семи человек' };
const guestsWord = (g: string) => FOR[g];

/**
 * The booking popup: how many, name, phone. Any element with [data-book] opens it.
 * Honest about where the request goes (see src/data/booking.ts).
 */
export function BookingDialog() {
  const dlg = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [guests, setGuests] = useState('2');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [tried, setTried] = useState(false);
  const [state, setState] = useState<'form' | 'sending' | 'sent' | 'not-sent' | 'error'>('form');

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = (e.target as Element).closest?.('[data-book]') as HTMLElement | null;
      if (!t) return;
      e.preventDefault();
      opener.current = t;
      setState('form'); setTried(false);
      document.documentElement.classList.add('menu-open');
      dlg.current?.showModal();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const close = () => dlg.current?.close();
  const nameOk = name.trim().length >= 2;
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!nameOk || !phoneOk(phone)) return;
    setState('sending');
    const req: BookingRequest = { guests, name: name.trim(), phone };
    try { setState(await sendBooking(req)); } catch { setState('error'); }
  };

  return (
    <dialog ref={dlg} className="bkd" aria-labelledby="bkd-h"
      onClose={() => { document.documentElement.classList.remove('menu-open'); opener.current?.focus(); }}
      onClick={(e) => e.target === dlg.current && close()}>
      <div className="bkd-panel">
        <button className="bkd-x" type="button" onClick={close} aria-label="Закрыть">×</button>
        {state === 'form' || state === 'sending' ? (
          <form onSubmit={submit} noValidate>
            <h2 id="bkd-h" className="bkd-title">Бронь стола</h2>
            <p className="bkd-sub">Терраса днём или зал под деревом вечером.</p>
            <fieldset className="bkd-guests">
              <legend className="bkd-k">Сколько вас</legend>
              <div className="bkd-chips">
                {GUESTS.map((g) => (
                  <label key={g} className="bkd-chip">
                    <input type="radio" name="guests" value={g} checked={guests === g} onChange={() => setGuests(g)} />
                    <span>{g}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="bkd-field">
              <span className="bkd-k">Имя</span>
              <input type="text" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)}
                aria-invalid={tried && !nameOk} placeholder="Как к вам обращаться" />
              {tried && !nameOk && <span className="bkd-err">Напишите имя</span>}
            </label>
            <label className="bkd-field">
              <span className="bkd-k">Телефон</span>
              <input type="tel" name="phone" autoComplete="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))}
                aria-invalid={tried && !phoneOk(phone)} placeholder="+7 (___) ___-__-__" />
              {tried && !phoneOk(phone) && <span className="bkd-err">Нужен номер из 11 цифр</span>}
            </label>
            <button className="btn btn-xl bkd-send" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Отправляем…' : 'Отправить заявку'}</button>
            <p className="bkd-fine">Или позвоните: <a href={venue.phone.href}>{venue.phone.display}</a></p>
          </form>
        ) : state === 'sent' ? (
          <div className="bkd-done" role="status">
            <h2 id="bkd-h" className="bkd-title">Заявка у нас</h2>
            <p className="bkd-sub">{name.trim()}, перезвоним на {phone}, чтобы подтвердить стол на {guestsWord(guests)}.</p>
            <button className="btn btn-xl" type="button" onClick={close}>Готово</button>
          </div>
        ) : (
          <div className="bkd-done" role="status">
            <h2 id="bkd-h" className="bkd-title">Осталось позвонить</h2>
            <p className="bkd-sub">
              {state === 'error' ? 'Заявка не ушла — связь подвела. ' : 'Онлайн-бронь пока не подключена, заявки отсюда никуда не уходят. '}
              {name.trim()}, позвоните — стол на {guestsWord(guests)} подтвердят по телефону.
            </p>
            <a className="btn btn-gold btn-xl btn-arrow" href={venue.phone.href}>Позвонить {venue.phone.display} <span aria-hidden="true">→</span></a>
            <button className="bkd-back" type="button" onClick={() => setState('form')}>Изменить данные</button>
          </div>
        )}
      </div>
    </dialog>
  );
}
