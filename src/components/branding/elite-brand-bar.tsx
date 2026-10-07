import Link from "next/link";

import { BrandLogo } from "@/components/branding/brand-logo";

/** Logo strip for the full-bleed Elite / Duplication landing pages, which have no site header. */
export function EliteBrandBar() {
  return (
    <div className="elite-brand-bar">
      <div className="elite-shell">
        <Link href="/" aria-label="Coach JDC home">
          <BrandLogo onDark />
        </Link>
      </div>
    </div>
  );
}
