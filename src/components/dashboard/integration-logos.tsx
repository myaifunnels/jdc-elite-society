type LogoProps = { size?: number };

/** Google-blue map pin on a white tile — evokes Google Maps without reproducing its wordmark. */
export function GoogleMapsLogo({ size = 28 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#FFFFFF" />
      <path
        d="M20 8c-5.2 0-9.4 4.2-9.4 9.4 0 6.9 9.4 14.6 9.4 14.6s9.4-7.7 9.4-14.6C29.4 12.2 25.2 8 20 8Z"
        fill="#4285F4"
      />
      <circle cx="20" cy="17.2" r="3.6" fill="#FFFFFF" />
    </svg>
  );
}

/** Cloudflare-orange cloud mark. */
export function CloudflareLogo({ size = 28 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="cf-grad" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0" stopColor="#FAAD3F" />
          <stop offset="1" stopColor="#F6821F" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#cf-grad)" />
      <path
        d="M27.8 21.6c1.9.05 3.4 1.6 3.4 3.5 0 .2 0 .4-.05.6H10.2c-.35-.8-.55-1.7-.55-2.6 0-3.5 2.85-6.35 6.35-6.35.55 0 1.1.08 1.6.22 1.05-2.5 3.5-4.25 6.35-4.25 3.7 0 6.75 2.85 7.05 6.45.3-.06.6-.1.92-.1.2 0 .38 0 .58.03"
        fill="#FFFFFF"
      />
    </svg>
  );
}

/** GoHighLevel-teal growth mark. */
export function GoHighLevelLogo({ size = 28 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="ghl-grad" x1="0" y1="40" x2="40" y2="0">
          <stop offset="0" stopColor="#0F9B8E" />
          <stop offset="1" stopColor="#37E8B5" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#ghl-grad)" />
      <path d="M11 26 17 18l5 5 7-11" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M23 12h6v6" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/** TextBee — amber "bee" tone message bubble. */
export function TextBeeLogo({ size = 28 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="tb-grad" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0" stopColor="#FFCC33" />
          <stop offset="1" stopColor="#F5A300" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#tb-grad)" />
      <path
        d="M11 14.5c0-1.4 1.1-2.5 2.5-2.5h13c1.4 0 2.5 1.1 2.5 2.5v8.6c0 1.4-1.1 2.5-2.5 2.5h-9.4L13 29V14.5Z"
        fill="#1A1300"
      />
      <circle cx="16" cy="18.5" r="1.3" fill="#FFCC33" />
      <circle cx="20" cy="18.5" r="1.3" fill="#FFCC33" />
      <circle cx="24" cy="18.5" r="1.3" fill="#FFCC33" />
    </svg>
  );
}
