"use client";

import Script from "next/script";

const formId = "22fC57U5wPPBVd3tt22a";

export function EliteCheckoutEmbed() {
  return (
    <div className="elite-checkout-embed">
      <iframe
        src={`https://api.myaifunnels.com/widget/form/${formId}`}
        style={{ width: "100%", height: 911, minHeight: 911, border: "none", borderRadius: 3, colorScheme: "light" }}
        id={`inline-${formId}`}
        data-layout="{'id':'INLINE'}"
        data-trigger-type="alwaysShow"
        data-trigger-value=""
        data-activation-type="alwaysActivated"
        data-activation-value=""
        data-deactivation-type="neverDeactivate"
        data-deactivation-value=""
        data-form-name="S1 Building Checkout Form"
        data-height="911"
        data-layout-iframe-id={`inline-${formId}`}
        data-form-id={formId}
        data-cookie-consent="true"
        data-cookie-consent-provider="auto"
        title="S1 Building Checkout Form"
      />
      <Script src="https://api.myaifunnels.com/js/form_embed.js" strategy="afterInteractive" />
    </div>
  );
}
