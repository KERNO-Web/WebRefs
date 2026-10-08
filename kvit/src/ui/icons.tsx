import type { ReactNode, SVGProps } from 'react';

const paths: Record<string, ReactNode> = {
  overview: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="4.5" rx="1.5" />
      <rect x="13.5" y="11" width="7" height="9.5" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  terminal: (
    <>
      <rect x="5" y="2.75" width="14" height="18.5" rx="2.5" />
      <path d="M8.5 6.75h7v3.5h-7z" />
      <path d="M8.75 14h.01M12 14h.01M15.25 14h.01M8.75 17.25h.01M12 17.25h.01M15.25 17.25h.01" strokeWidth="2.2" />
    </>
  ),
  invoice: (
    <>
      <path d="M6 2.75h8.5L19 7.25V20a1.25 1.25 0 0 1-1.25 1.25H6A1.25 1.25 0 0 1 4.75 20V4A1.25 1.25 0 0 1 6 2.75Z" />
      <path d="M14 2.75v4.75h5M8.5 12.5h7M8.5 16h4.5" />
    </>
  ),
  link: (
    <>
      <path d="M10 13.5a4.25 4.25 0 0 0 6 .2l2.6-2.6a4.25 4.25 0 0 0-6-6l-1.3 1.3" />
      <path d="M14 10.5a4.25 4.25 0 0 0-6-.2l-2.6 2.6a4.25 4.25 0 0 0 6 6l1.3-1.3" />
    </>
  ),
  list: (
    <>
      <path d="M8.5 6h11.5M8.5 12h11.5M8.5 18h11.5" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" strokeWidth="2.4" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2.25" />
      <circle cx="9" cy="17" r="2.25" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  copy: (
    <>
      <rect x="8.75" y="8.75" width="11.5" height="11.5" rx="2" />
      <path d="M15.25 8.75V5.5a1.75 1.75 0 0 0-1.75-1.75h-8a1.75 1.75 0 0 0-1.75 1.75v8a1.75 1.75 0 0 0 1.75 1.75h3.25" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  back: <path d="M15 5.5 8.5 12l6.5 6.5" />,
  chevron: <path d="m9 5.5 6.5 6.5L9 18.5" />,
  backspace: (
    <>
      <path d="M9 5.5h10.25a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H9L3.5 12 9 5.5Z" />
      <path d="m12.5 9.5 5 5M17.5 9.5l-5 5" />
    </>
  ),
  down: <path d="m6 9.5 6 6 6-6" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.25" />
      <path d="m20 20-4.5-4.5" />
    </>
  ),
  external: (
    <>
      <path d="M13.5 4h6.5v6.5M20 4l-9 9" />
      <path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
    </>
  ),
  refund: (
    <>
      <path d="M4.5 9.5h10a5 5 0 0 1 0 10H9" />
      <path d="M8.5 5.5l-4 4 4 4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  send: (
    <>
      <path d="M20.5 3.5 10 14" />
      <path d="m20.5 3.5-6.5 17-4-6.5-6.5-4 17-6.5Z" />
    </>
  ),
  qr: (
    <>
      <rect x="3.75" y="3.75" width="6.5" height="6.5" rx="1" />
      <rect x="13.75" y="3.75" width="6.5" height="6.5" rx="1" />
      <rect x="3.75" y="13.75" width="6.5" height="6.5" rx="1" />
      <path d="M14 14h2.5v2.5H14zM17.5 17.5H20V20h-2.5zM14 18.5v1.5M19.75 14v1" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5V8" />
      <rect x="4" y="7.5" width="16.5" height="12" rx="2.5" />
      <path d="M16.25 13.5h.01" strokeWidth="2.6" />
    </>
  ),
  bank: (
    <>
      <path d="M3.5 9.5 12 4.5l8.5 5" />
      <path d="M5.5 10v7M10 10v7M14 10v7M18.5 10v7M3.5 19.5h17" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 7.75v5M12 16h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15.5" r="4" />
      <path d="m11 12.5 8.5-8.5M16.5 7l2.5 2.5M14 9.5l2 2" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M3.75 12h16.5M12 3.75c2.4 2.3 3.6 5 3.6 8.25S14.4 18 12 20.25C9.6 18 8.4 15.25 8.4 12S9.6 6.05 12 3.75Z" />
    </>
  ),
  reset: (
    <>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4.5 4.5v4h4" />
    </>
  ),
  bolt: <path d="M13 3.5 5.5 13.5H12l-1 7 7.5-10H12l1-7Z" />,
  pause: <path d="M9 6v12M15 6v12" />,
  play: <path d="M8 5.5v13l10-6.5-10-6.5Z" />,
  share: (
    <>
      <path d="M12 15V3.5M7.5 8 12 3.5 16.5 8" />
      <path d="M5 12.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-6.5" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  store: (
    <>
      <path d="M4.5 9.5V19a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V9.5" />
      <path d="M3.5 5.5 5 3.5h14l1.5 2v1.75a2.75 2.75 0 0 1-5.5 0 2.75 2.75 0 0 1-5.5 0 2.75 2.75 0 0 1-5.5 0Z" />
      <path d="M9.5 20.5v-5h5v5" />
    </>
  ),
};

export type IconName = keyof typeof paths;

export function Icon({ name, size = 20, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
