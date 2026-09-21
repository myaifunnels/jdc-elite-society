"use client";

import { useRef, useState } from "react";
import Script from "next/script";

const formId = "hEadKGITGhjwVT5DwVcQ";

/* The signup form is a white embed, so we invert it into dark mode; hue-rotate keeps brand colors true. */
const darkForm = "invert(0.92) hue-rotate(180deg) saturate(1.1)";

export function PartnershipApply({
  title = "Apply to become a partner",
  subtext = "Free to join. Takes less than a minute.",
  className,
}: {
  className?: string;
  title?: string;
  subtext?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [opened, setOpened] = useState(false);

  function open() {
    setOpened(true);
    dialogRef.current?.showModal();
  }

  return (
    <div className={className}>
      <button type="button" onClick={open} className="elite-cta elite-cta-rich elite-cta-lg">
        <span className="elite-cta-copy">
          <strong>{title}</strong>
          <small>{subtext}</small>
        </span>
        <span className="elite-cta-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h13M13 6l6 6-6 6" />
          </svg>
        </span>
      </button>

      <dialog
        ref={dialogRef}
        className="partner-dialog"
        aria-label="Become a JDC Partner"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
      >
        <button
          type="button"
          className="partner-dialog-close"
          aria-label="Close"
          onClick={() => dialogRef.current?.close()}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
        <div style={{ padding: "1.6rem 1.2rem 0.8rem", textAlign: "center" }}>
          <p className="elite-kicker" style={{ marginBottom: "0.4rem" }}>JDC Partnership Program</p>
          <h2 className="elite-display" style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "1.7rem", fontWeight: 500 }}>
            Become a JDC Partner
          </h2>
        </div>
        {opened ? (
          <div style={{ padding: "0 0.6rem 0.8rem" }}>
            <iframe
              src={`https://api.myaifunnels.com/widget/form/${formId}`}
              style={{ width: "100%", height: "100%", minHeight: 460, border: "none", filter: darkForm }}
              id={`inline-${formId}`}
              data-layout="{'id':'INLINE'}"
              data-trigger-type="alwaysShow"
              data-trigger-value=""
              data-activation-type="alwaysActivated"
              data-activation-value=""
              data-deactivation-type="neverDeactivate"
              data-deactivation-value=""
              data-form-name="Affiliate Signup Form"
              data-height="400"
              data-layout-iframe-id={`inline-${formId}`}
              data-form-id={formId}
              data-cookie-consent="true"
              data-cookie-consent-provider="auto"
              title="Affiliate Signup Form"
            />
            <Script src="https://api.myaifunnels.com/js/form_embed.js" strategy="afterInteractive" />
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
