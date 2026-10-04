const P: Record<string, string> = {
  plus: 'M12 5v14M5 12h14',
  swap: 'M7 4v14M3 14l4 4 4-4M17 20V6M13 10l4-4 4 4',
  snow: 'M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5',
  card: 'M3 6h18v12H3zM3 10h18M7 15h4',
  close: 'M6 6l12 12M18 6 6 18',
  check: 'M5 12.5l4.5 4.5L19 7',
  home: 'M4 11 12 4l8 7v9h-5v-6H9v6H4z',
  list: 'M4 6h16M4 12h16M4 18h10',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  globe: 'M12 3a9 9 0 1 0 .01 0M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18',
};

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name]} />
    </svg>
  );
}

/** Merchant / asset logo: an svg from /logos, or a monogram when the string starts with "#" */
export function Logo({ src, size = 40 }: { src: string; size?: number }) {
  if (src.startsWith('#')) return <span className="logo mono" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden="true">{src.slice(1)}</span>;
  return (
    <span className="logo" style={{ width: size, height: size }} aria-hidden="true">
      <span className="logo-glyph" style={{ WebkitMaskImage: `url(${import.meta.env.BASE_URL}logos/${src})`, maskImage: `url(${import.meta.env.BASE_URL}logos/${src})` }} />
    </span>
  );
}
