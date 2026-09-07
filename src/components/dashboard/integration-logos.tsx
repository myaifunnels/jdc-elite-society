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

/** Multi-color Google "G" mark on a white tile — used for Google Sign-In credentials. */
export function GoogleLogo({ size = 28 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#FFFFFF" />
      <path
        fill="#EA4335"
        d="M20 11.8c2.7 0 4.9.9 6.6 2.6l5-5C28.7 6.5 24.7 4.8 20 4.8 12.9 4.8 6.8 8.9 3.9 14.9l5.8 4.5C11.2 14.7 15.2 11.8 20 11.8z"
      />
      <path
        fill="#4285F4"
        d="M35.1 20.9c0-1.2-.1-2.4-.3-3.5H20v7h8.5c-.4 2.1-1.6 3.9-3.4 5.1l5.4 4.2c3.2-2.9 5-7.2 5-12.8z"
      />
      <path
        fill="#FBBC05"
        d="M9.7 22.6a10.9 10.9 0 0 1 0-5.2l-5.8-4.5a17.8 17.8 0 0 0 0 14.2l5.8-4.5z"
      />
      <path
        fill="#34A853"
        d="M20 36c4.7 0 8.7-1.5 11.6-4.2l-5.4-4.2c-1.5 1-3.6 1.7-6.2 1.7-4.8 0-8.8-2.9-10.3-7.1l-5.8 4.5C6.8 31.1 12.9 36 20 36z"
      />
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

/** Zoom-blue rounded tile with an abstracted camera mark — evokes Zoom without reproducing its
 * literal logo artwork. Used on the public webinars hero next to the "Live on Zoom" copy. */
export function ZoomLogo({ size = 28 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="zoom-grad" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0" stopColor="#4A8CFF" />
          <stop offset="1" stopColor="#2D6CDF" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#zoom-grad)" />
      <rect x="9" y="14" width="16" height="12" rx="3" fill="#FFFFFF" />
      <path d="M27 18.2 32 15v10l-5-3.2Z" fill="#FFFFFF" />
    </svg>
  );
}
