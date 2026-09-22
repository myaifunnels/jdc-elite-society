"use client";

import { useState } from "react";
import Script from "next/script";

const forms = {
  building: { formId: "22fC57U5wPPBVd3tt22a", height: 911, name: "S1 Building Checkout Form" },
  duplication: { formId: "Y1d3jeoR1spHiZQ6Phkb", height: 1110, name: "S2 Duplication Checkout Form" },
  "elite-society": { formId: "ohApYj9qLzpCxnG4tgYZ", height: 841, name: "JDC Elite Society Checkout Form" },
} as const;

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="3" />
      <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
    </svg>
  );
}

export function EliteCheckoutEmbed({ variant = "building" }: { variant?: keyof typeof forms }) {
  const [loaded, setLoaded] = useState(false);
  const { formId, height, name } = forms[variant];

  return (
    <div className="elite-checkout-embed">
      <div className="elite-checkout-embed-frame" data-loaded={loaded}>
        {!loaded ? (
          <div className="elite-checkout-embed-skeleton" aria-hidden="true">
            <div className="elite-checkout-embed-spinner" />
            <p>Loading secure checkout…</p>
          </div>
        ) : null}
        <iframe
          key={formId}
          src={`https://api.myaifunnels.com/widget/form/${formId}`}
          style={{ width: "100%", height, minHeight: height, border: "none", colorScheme: "light" }}
          id={`inline-${formId}`}
          data-layout="{'id':'INLINE'}"
          data-trigger-type="alwaysShow"
          data-trigger-value=""
          data-activation-type="alwaysActivated"
          data-activation-value=""
          data-deactivation-type="neverDeactivate"
          data-deactivation-value=""
          data-form-name={name}
          data-height={height}
          data-layout-iframe-id={`inline-${formId}`}
          data-form-id={formId}
          data-cookie-consent="true"
          data-cookie-consent-provider="auto"
          title={name}
          onLoad={() => setLoaded(true)}
        />
      </div>
      <Script src="https://api.myaifunnels.com/js/form_embed.js" strategy="afterInteractive" />
      <p className="elite-checkout-embed-trust">
        <LockIcon /> Your information is encrypted and processed on a secure payment page.
      </p>
    </div>
  );
}
