const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const IconHistory = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5M12 7v5l3 2" />
  </svg>
);

export const IconClock = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const IconSun = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const IconMoon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

export const IconSliders = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="12" r="2" />
    <circle cx="17" cy="17" r="2" />
  </svg>
);

export const IconSearch = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
);

export const IconTrash = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
  </svg>
);

export const IconMic = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);

export const IconSpark = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
  </svg>
);

export const IconDots = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="5" cy="12" r="1.5" fill="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="19" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

export const Lotus = ({ size = 46 }) => (
  <svg width={size} height={size * 0.88} viewBox="0 0 64 56" aria-hidden="true">
    <defs>
      <linearGradient id="lotusA" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f4a3bd" />
        <stop offset="1" stopColor="#c4407c" />
      </linearGradient>
      <linearGradient id="lotusB" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f7b9cc" />
        <stop offset="1" stopColor="#d9648f" />
      </linearGradient>
    </defs>
    <path d="M30 44C16 46 6 40 2 30c12 0 22 4 28 14z" fill="url(#lotusB)" opacity=".85" />
    <path d="M34 44c14 2 24-4 28-14-12 0-22 4-28 14z" fill="url(#lotusB)" opacity=".85" />
    <path d="M32 42C20 40 10 30 8 18c12 2 22 10 24 24z" fill="url(#lotusA)" opacity=".92" />
    <path d="M32 42c12-2 22-12 24-24-12 2-22 10-24 24z" fill="url(#lotusA)" opacity=".92" />
    <path d="M32 6c8 12 8 24 0 36C24 30 24 18 32 6z" fill="url(#lotusA)" />
  </svg>
);