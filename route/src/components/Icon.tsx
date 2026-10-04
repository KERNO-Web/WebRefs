const P: Record<string, string> = {
  home: 'M4 11 L12 4 L20 11 V20 H14 V14 H10 V20 H4 Z',
  calendar: 'M4 6 H20 V20 H4 Z M4 10 H20 M8 3 V7 M16 3 V7',
  truck: 'M2 6 H14 V16 H2 Z M14 10 H18 L21 13 V16 H14 M6 18.5 a1.5 1.5 0 1 0 0.01 0 M17 18.5 a1.5 1.5 0 1 0 0.01 0',
  check: 'M5 12.5 L10 17 L19 7',
  archive: 'M3 5 H21 V9 H3 Z M5 9 V19 H19 V9 M10 13 H14',
  settings: 'M12 9 a3 3 0 1 0 0.01 0 M12 2 V5 M12 19 V22 M4.9 4.9 L7 7 M17 17 L19.1 19.1 M2 12 H5 M19 12 H22 M4.9 19.1 L7 17 M17 7 L19.1 4.9',
  plus: 'M12 5 V19 M5 12 H19',
  bell: 'M6 16 V11 a6 6 0 0 1 12 0 V16 L19.5 18 H4.5 Z M10 20.5 a2 2 0 0 0 4 0',
  search: 'M11 4 a7 7 0 1 0 0.01 0 M20 20 L16 16',
  close: 'M6 6 L18 18 M18 6 L6 18',
  copy: 'M9 9 H20 V20 H9 Z M5 15 H4 V4 H15 V5',
  flag: 'M5 21 V4 M5 4 H17 L15 8 L17 12 H5',
  back: 'M15 5 L8 12 L15 19',
  restore: 'M4 12 a8 8 0 1 0 2.3 -5.7 M4 4 V9 H9',
  pin: 'M12 21 C 12 21 5 14 5 9.5 a7 7 0 0 1 14 0 C 19 14 12 21 12 21 Z M12 7 a2.5 2.5 0 1 0 0.01 0',
  alert: 'M12 3 L22 20 H2 Z M12 10 V14 M12 17 V17.5',
  box: 'M3 7.5 L12 3 L21 7.5 V16.5 L12 21 L3 16.5 Z M3 7.5 L12 12 L21 7.5 M12 12 V21',
  doc: 'M6 3 H14 L19 8 V21 H6 Z M14 3 V8 H19 M9 13 H16 M9 17 H14',
  bag: 'M5 8 H19 L18 21 H6 Z M9 8 V6 a3 3 0 0 1 6 0 V8',
  chevron: 'M9 6 L15 12 L9 18',
};

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name]} />
    </svg>
  );
}
