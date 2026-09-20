"use client";

import { useState } from "react";

import { JdcWordmark } from "@/components/branding/jdc-wordmark";

/** The saved logo image, falling back to the text wordmark if it ever fails to load — a dead URL
 * used to show the browser's broken-image icon and alt text in the sidebar. */
export function LogoImage({ src, alt, compact }: { src: string; alt: string; compact: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <JdcWordmark compact={compact} />;
  return (
    // User-provided logo URLs can come from R2 or any public host.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="site-logo-image h-9 w-auto object-contain"
      onError={() => setFailed(true)}
    />
  );
}
