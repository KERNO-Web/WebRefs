# TapShift

Interactive crypto-card product demo (formerly NEXUS; still served from `/nexus/`).

A short landing, then the product: choose a lived-in **demo account** or **start from zero** (finish, cardholder, currency, spending source, hold to activate). Inside: Home, Card, Wallets, Activity, Settings — funding, exchange, Smart Spend, card controls that decide simulated payments, refunds, analytics, balance privacy.

Everything is simulated and stored in localStorage. No backend, no real money, no blockchain.

Routes: `#` landing · `#start` onboarding · `#app`, `#app/card`, `#app/wallets`, `#app/activity`, `#app/settings`.

```bash
npm install
npm run dev
```
