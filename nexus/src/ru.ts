// Russian copy. Written for Russian, not translated word for word: own line breaks, own rhythm.
export const RU: Record<string, string> = {
  // nav + sections
  Sections: 'Разделы', 'Switch language': 'Переключить язык', 'Open demo': 'Открыть демо', 'How it works': 'Как это работает',
  Issue: 'Выпуск', Funding: 'Пополнение', Fund: 'Пополнить', Spend: 'Оплата', Control: 'Контроль', Activity: 'Операции',
  ISSUE: 'ВЫПУСК', FUND: 'ПОПОЛНЕНИЕ', SPEND: 'ОПЛАТА', CONTROL: 'КОНТРОЛЬ', ACTIVITY: 'ОПЕРАЦИИ',

  // hero
  'Virtual crypto card': 'Виртуальная крипто-карта',
  'SPEND\nCRYPTO.\nANYWHERE.': 'ПЛАТИТЕ\nКРИПТОЙ.\nВЕЗДЕ.',
  'Hold USDT and USDC. Pay by card. NEXUS converts at the moment you pay.': 'Храните USDT и USDC. Платите картой. NEXUS конвертирует в момент оплаты.',
  'Available to spend': 'Доступно', 'Simulated demo': 'Симуляция', Active: 'Активна', Frozen: 'Заморожена', Draft: 'Черновик',

  // card face (printed parts stay Latin, like a real card)
  'virtual card': 'виртуальная карта', ending: 'с окончанием', DRAFT: 'ЧЕРНОВИК', FROZEN: 'ЗАМОРОЖЕНА',

  // issue
  'YOUR CARD.\nIN SECONDS.': 'ВАША КАРТА.\nЗА СЕКУНДЫ.',
  'Pick a finish, put your name on it, create it. The number is yours instantly.': 'Выберите отделку, впишите имя, выпустите. Номер готов сразу.',
  Finish: 'Отделка', Graphite: 'Графит', Titanium: 'Титан', Ice: 'Лёд',
  'Name on card': 'Имя на карте', 'Base currency': 'Базовая валюта', 'Card type': 'Тип карты',
  'Multi-use': 'Многоразовая', 'Single-use': 'Одноразовая',
  'Create card': 'Выпустить карту', 'Issuing…': 'Выпускаем…',
  'New number issued. Old one is closed.': 'Новый номер выпущен, старый закрыт.',
  'Single-use: the number changes after every approved purchase.': 'Одноразовая: номер меняется после каждой одобренной покупки.',
  'Preview only until you create it.': 'Это превью, пока вы не выпустите карту.',
  'Creating again issues a fresh number.': 'Повторный выпуск даст новый номер.',
  'Issue a new card': 'Выпустить новую карту',

  // fund
  'FUND IT.\nFROM ANY WALLET.': 'ПОПОЛНИТЕ\nС ЛЮБОГО\nКОШЕЛЬКА.',
  'Send stablecoins or ETH. They land on the card as spendable balance.': 'Отправьте стейблкоины или ETH. Они сразу становятся балансом карты.',
  'Your wallet · simulated': 'Ваш кошелёк · симуляция', 'NEXUS card': 'Карта NEXUS',
  Asset: 'Актив', Network: 'Сеть', Amount: 'Сумма', 'In wallet': 'В кошельке', 'More than your wallet holds': 'Больше, чем есть в кошельке', Max: 'Всё',
  Rate: 'Курс', 'Network fee': 'Комиссия сети', 'Lands on card': 'Поступит на карту', 'Card balance after': 'Баланс после',
  'Card balance': 'Баланс карты', Received: 'Зачислено', 'Fund {amount}': 'Пополнить на {amount}', 'Fund again': 'Пополнить ещё',
  'Confirming on network…': 'Подтверждаем в сети…', 'Fund card': 'Пополнить карту', Done: 'Готово',
  'Simulated. No real crypto moves.': 'Симуляция. Настоящая крипта никуда не уходит.',

  // spend
  'YOU PAY {fiat}.': 'ВЫ ПЛАТИТЕ {fiat}.', 'NEXUS USES {crypto}.': 'NEXUS СПИШЕТ {crypto}.',
  Fee: 'Комиссия', 'Smart Spend': 'Smart Spend', 'Left after': 'Остаток', NEXT: 'ДАЛЕЕ', Declined: 'Отклонено',

  // smart spend
  'You hold more than one balance. Choose the rule, NEXUS picks the one that pays.': 'У вас несколько балансов. Выберите правило, а NEXUS решит, каким из них платить.',
  'Smart Spend rule': 'Правило Smart Spend',
  'Stablecoins first': 'Сначала стейблкоины', 'Spends USDT or USDC before anything that moves in price.': 'Тратит USDT или USDC раньше всего, что меняется в цене.',
  'Best available balance': 'Лучший доступный баланс', 'Picks the balance with the lowest conversion spread.': 'Выбирает баланс с самым низким спредом конвертации.',
  'Manual priority': 'Ручной порядок', 'Your order. NEXUS falls through it until a balance covers the payment.': 'Ваш порядок. NEXUS идёт по нему, пока какой-то баланс не покроет платёж.',
  'Balances, in the order NEXUS tries them': 'Балансы в том порядке, в каком NEXUS их пробует',
  'Move {asset} up': 'Поднять {asset}', 'Move {asset} down': 'Опустить {asset}',
  Used: 'Спишем', 'Too low': 'Мало', 'Next payment': 'Следующий платёж', Uses: 'Спишем',
  'No single balance covers {amount}': 'Ни один баланс не покрывает {amount}',

  // control
  'FREEZE IT.\nLIMIT IT.\nUSE IT.': 'ЗАМОРОЗЬТЕ.\nОГРАНИЧЬТЕ.\nПЛАТИТЕ.',
  'Every switch is live. Change one, then try a purchase below.': 'Все переключатели настоящие. Измените любой и попробуйте покупку ниже.',
  'Freeze card': 'Заморозить карту', 'Every payment declines until you unfreeze.': 'Все платежи отклоняются, пока карта заморожена.',
  'Online payments': 'Онлайн-платежи', 'Shops, apps and subscriptions.': 'Магазины, приложения и подписки.',
  Contactless: 'Бесконтактная оплата', 'Tap to pay with your phone.': 'Оплата касанием телефона.',
  'ATM withdrawals': 'Снятие в банкомате', 'Cash, with a flat €1.50 fee.': 'Наличные, фиксированная комиссия €1.50.',
  'International payments': 'Платежи за рубежом', 'Merchants outside your home region.': 'Продавцы за пределами вашего региона.',
  'Monthly limit': 'Лимит в месяц', '{spent} of {limit} spent this month': 'В этом месяце потрачено {spent} из {limit}',
  'Card status': 'Состояние карты', 'TEST A PURCHASE': 'ПОПРОБУЙТЕ ПОКУПКУ', 'Test a purchase': 'Пробная покупка',
  'Six real-world scenarios. Each one runs against the switches above.': 'Шесть жизненных сценариев. Каждый проверяется по переключателям выше.',
  'Pick a purchase. The card answers with its current settings.': 'Выберите покупку. Карта ответит согласно текущим настройкам.',
  Abroad: 'За рубежом', 'Paid from': 'Списано', 'NEXUS fee': 'Комиссия NEXUS', 'Available now': 'Доступно сейчас',

  // decline reasons
  'Card is frozen': 'Карта заморожена', 'Online payments are off': 'Онлайн-платежи выключены', 'Contactless is off': 'Бесконтактная оплата выключена',
  'ATM withdrawals are off': 'Снятие в банкомате выключено', 'International payments are off': 'Платежи за рубежом выключены',
  'Over the monthly limit': 'Превышен месячный лимит', 'No balance covers this payment': 'Ни один баланс не покрывает платёж',

  // activity
  'EVERY EURO.\nEVERY USDT.': 'КАЖДОЕ ЕВРО.\nКАЖДЫЙ USDT.', 'EVERY DOLLAR.\nEVERY USDT.': 'КАЖДЫЙ ДОЛЛАР.\nКАЖДЫЙ USDT.',
  'Spent this month': 'Потрачено за месяц', Held: 'На балансах', 'Full history': 'Вся история',
  Merchant: 'Продавец', 'Crypto source': 'Источник', Status: 'Статус', Time: 'Время', 'Nothing here yet.': 'Здесь пока пусто.',
  Filter: 'Фильтр', All: 'Все', Paid: 'Оплачено', Refunded: 'Возврат', 'Top ups': 'Пополнения',
  PAID: 'ОПЛАЧЕНО', DECLINED: 'ОТКЛОНЕНО', REFUNDED: 'ВОЗВРАТ', RECEIVED: 'ЗАЧИСЛЕНО', PROCESSING: 'ОБРАБОТКА',
  Today: 'Сегодня', Yesterday: 'Вчера',
  Coffee: 'Кофе', Subscription: 'Подписка', Shopping: 'Покупки', Cash: 'Наличные', Transport: 'Транспорт', Travel: 'Путешествия', Groceries: 'Продукты', 'Top up': 'Пополнение',
  Online: 'Онлайн', 'ATM withdrawal': 'Снятие наличных', Deposit: 'Депозит',
  ATM: 'Банкомат', Taxi: 'Такси',
  Berlin: 'Берлин', Stockholm: 'Стокгольм', Amsterdam: 'Амстердам', Tokyo: 'Токио',

  // transaction sheet
  Transaction: 'Операция', Date: 'Дата', 'Payment type': 'Тип платежа', Credited: 'Зачислено', 'Crypto debit': 'Списано в крипте',
  Reason: 'Причина', Card: 'Карта', 'Transaction ID': 'ID операции', 'Simulate refund': 'Симулировать возврат', 'Processing refund…': 'Оформляем возврат…',
  '{amount} returned to your {asset} balance.': '{amount} вернулись на баланс {asset}.',
  Close: 'Закрыть',

  // final + footer
  'THE WHOLE CARD.\nIN ONE APP.': 'ВСЯ КАРТА.\nВ ОДНОМ\nПРИЛОЖЕНИИ.',
  'Home, card, activity, settings. Same balances, same rules, same history.': 'Главная, карта, операции, настройки. Те же балансы, те же правила, та же история.',
  'Portfolio concept by KERNØ. Simulated balances, rates and payments. No real cards, custody or blockchain transactions.': 'Концепт для портфолио KERNØ. Балансы, курсы и платежи симулированы. Никаких настоящих карт, хранения средств и транзакций в блокчейне.',
  'Reset demo': 'Сбросить демо', 'Reset everything?': 'Сбросить всё?', Reset: 'Сбросить', Cancel: 'Отмена',

  // demo app
  DEMO: 'ДЕМО', App: 'Приложение', Home: 'Главная', Settings: 'Настройки', 'Back to site': 'Вернуться на сайт',
  Pay: 'Оплатить', Freeze: 'Заморозить', Unfreeze: 'Разморозить', 'New card': 'Новая карта',
  '{spent} spent this month': 'В этом месяце: {spent}',
  Balances: 'Балансы', 'Recent activity': 'Последние операции', 'See all': 'Все',
  Controls: 'Управление', 'Card details': 'Реквизиты', 'Card number': 'Номер карты', Expiry: 'Срок', Show: 'Показать', Hide: 'Скрыть', Copy: 'Копировать', Copied: 'Скопировано',
  '{n} operations': 'Операций: {n}',
  Preferences: 'Параметры', 'Prices, limits and balances are shown in it.': 'В ней показаны цены, лимиты и балансы.', Language: 'Язык',
  'Restores the original balances, card and history.': 'Вернёт исходные балансы, карту и историю.',
};
