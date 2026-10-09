import type { Asset, Category, Channel, MerchantId } from '../store';
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
};

export function Icon({ name, size = 20, stroke = 1.7 }: { name: string; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name]} />
    </svg>
  );
}

export const CHANNEL_ICON: Record<Channel | 'deposit', string> = { contactless: 'contactless', online: 'online', atm: 'atm', deposit: 'plus' };

export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 19V5l14 14V5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}

const ASSET_SRC: Partial<Record<Asset, string>> = { USDT: 'tether.svg', ETH: 'ethereum.svg' };

/** Asset glyph: tone-on-tone, crypto stays infrastructure, never decoration. */
export function AssetMark({ asset, size = 28 }: { asset: Asset; size?: number }) {
  const src = ASSET_SRC[asset];
  return (
    <span className={'asset-mark a-' + asset.toLowerCase()} style={{ width: size, height: size }} aria-hidden="true">
      {src
        ? <span className="glyph" style={{ WebkitMaskImage: `url(${import.meta.env.BASE_URL}logos/${src})`, maskImage: `url(${import.meta.env.BASE_URL}logos/${src})` }} />
        : <span className="glyph-text" style={{ fontSize: size * 0.5 }}>$</span>}
    </span>
  );
}

const CAT_TONE: Record<Category, string> = { coffee: 'warm', subscription: 'cool', shopping: 'cool', cash: 'metal', transport: 'warm', travel: 'cool', groceries: 'warm', deposit: 'ice' };

export function MerchantMark({ id, size = 40 }: { id: MerchantId | 'deposit'; size?: number }) {
  if (id === 'deposit') {
    return <span className="m-mark tone-ice" style={{ width: size, height: size }} aria-hidden="true"><Icon name="down" size={size * 0.45} /></span>;
  }
  const m = MERCHANTS[id];
  return <span className={'m-mark tone-' + CAT_TONE[m.category]} style={{ width: size, height: size, fontSize: size * 0.34 }} aria-hidden="true">{m.mark}</span>;
}
