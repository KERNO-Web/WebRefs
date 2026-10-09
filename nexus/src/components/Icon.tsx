import type { Category, Channel, MerchantId, Wallet } from '../store';
import { MERCHANTS } from '../store';

const P: Record<string, string> = {
  plus: 'M12 5v14M5 12h14',
  snow: 'M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5',
  card: 'M3 6h18v12H3zM3 10h18M7 15h4',
  close: 'M6 6l12 12M18 6 6 18',
  check: 'M5 12.5l4.5 4.5L19 7',
  home: 'M4 11 12 4l8 7v9h-5v-6H9v6H4z',
  list: 'M4 6h16M4 12h16M4 18h10',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  back: 'M19 12H5M11 6l-6 6 6 6',
  globe: 'M12 3a9 9 0 1 0 .01 0M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18',
  contactless: 'M8.5 8.5a5 5 0 0 1 0 7M12 6a8.5 8.5 0 0 1 0 12M15.5 3.5a12 12 0 0 1 0 17M5 11a1.5 1.5 0 0 1 0 2',
  online: 'M3 5h18v11H3zM8 20h8M12 16v4',
  atm: 'M3 7h18v10H3zM12 9.5a2.5 2.5 0 1 0 .01 0M6 10v4M18 10v4',
  sliders: 'M4 7h10M18 7h2M4 17h4M12 17h8M14 4v6M8 14v6',
  up: 'M12 19V5M6 11l6-6 6 6',
  down: 'M12 5v14M6 13l6 6 6-6',
  refund: 'M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4',
  wallet: 'M3 7h16v12H3zM3 7l12-3v3M15 13h2',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 .01 0',
  copy: 'M8 8h12v12H8zM4 16V4h12',
  limit: 'M4 18a8 8 0 1 1 16 0M12 18l4-6',
  route: 'M5 6h9a4 4 0 0 1 0 8H8a4 4 0 0 0 0 8h11M16 19l3 3-3 3',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4',
  exchange: 'M4 8h13M13 4l4 4-4 4M20 16H7M11 12l-4 4 4 4',
  eyeoff: 'M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.1 4M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 21h4',
  finger: 'M12 11v3a8 8 0 0 1-1.5 4.6M8.5 7.5A5 5 0 0 1 17 11v2.5M7 11a5 5 0 0 0 0 .5V14a12 12 0 0 1-.8 4.3M15 16.5a14 14 0 0 1-1 3.5M4.6 15A16 16 0 0 0 5 11a7 7 0 0 1 12.4-4.4',
  pay: 'M3 7h18v10H3zM7 12h4M16 12h1',
  exit: 'M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.5-4 4.5-6 8-6s6.5 2 8 6',
  bolt: 'M13 3 5 13h6l-1 8 8-10h-6z',
};

export function Icon({ name, size = 20, stroke = 1.7 }: { name: string; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name]} />
    </svg>
  );
}

export const CHANNEL_ICON: Record<Channel | 'deposit' | 'exchange', string> = { contactless: 'contactless', online: 'online', atm: 'atm', deposit: 'plus', exchange: 'exchange' };

/** TapShift mark: a bar, and the same bar shifted. */
export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 8.5h11.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
      <path d="M9.5 15.5H21" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" opacity="0.55" />
    </svg>
  );
}

const ASSET_SRC: Partial<Record<Wallet, string>> = { USDT: 'tether.svg', ETH: 'ethereum.svg' };

/** Asset glyph: tone-on-tone, crypto stays infrastructure, never decoration. */
export function AssetMark({ asset, size = 28 }: { asset: Wallet; size?: number }) {
  const src = ASSET_SRC[asset];
  return (
    <span className={'asset-mark a-' + asset.toLowerCase()} style={{ width: size, height: size }} aria-hidden="true">
      {src
        ? <span className="glyph" style={{ WebkitMaskImage: `url(${import.meta.env.BASE_URL}logos/${src})`, maskImage: `url(${import.meta.env.BASE_URL}logos/${src})` }} />
        : <span className="glyph-text" style={{ fontSize: size * 0.5 }}>{asset === 'EUR' ? '€' : '$'}</span>}
    </span>
  );
}

const CAT_TONE: Record<Category, string> = { coffee: 'warm', subscription: 'cool', shopping: 'cool', cash: 'metal', transport: 'warm', travel: 'cool', groceries: 'warm', deposit: 'ice', exchange: 'ice' };

export function MerchantMark({ id, size = 40 }: { id: MerchantId | 'deposit' | 'exchange'; size?: number }) {
  if (id === 'deposit' || id === 'exchange') {
    return <span className="m-mark tone-ice" style={{ width: size, height: size }} aria-hidden="true"><Icon name={id === 'deposit' ? 'down' : 'exchange'} size={size * 0.45} /></span>;
  }
  const m = MERCHANTS[id];
  return <span className={'m-mark tone-' + CAT_TONE[m.category]} style={{ width: size, height: size, fontSize: size * 0.34 }} aria-hidden="true">{m.mark}</span>;
}
