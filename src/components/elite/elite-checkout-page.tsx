import Link from "next/link";

import { EliteCheckoutEmbed } from "@/components/elite/elite-checkout-embed";
import { IncludeList } from "@/components/elite/elite-checkout-form";
import { formatPhp, mastermindOffer } from "@/data/mastermind-offer";

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="3" />
      <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5 5 6v5.3c0 4.5 3 7.9 7 9.2 4-1.3 7-4.7 7-9.2V6l-7-2.5Z" />
      <path d="m9 12 2 2 4-4.2" />
    </svg>
  );
}

// Kept for elite-checkout-form.tsx, which stays in the repo unused (but functional) as a
// fallback if the GHL-embedded checkout ever needs to be swapped back out.
export type SignedInCheckoutUser = {
  name: string;
  email: string;
  phone: string;
  phoneCountry: string;
};

function CheckoutSteps() {
  const steps = [
    { n: "1", title: "FILL OUT THE FORM", body: "Enter your name, email, and payment details in the secure form." },
    { n: "2", title: "PAYMENT IS PROCESSED", body: "Your card or GCash payment is processed instantly and securely." },
    {
      n: "3",
      title: "GET INSTANT ACCESS",
      body: "Check your inbox for a JDC Mastermind account link so you can sign in at coachjdc.org.",
    },
  ];
  return (
    <div>
      {steps.map((step) => (
        <div className="elite-pay-row" key={step.n}>
          <span className="elite-step">{step.n}</span>
          <div>
            <h4>{step.title}</h4>
            <p>{step.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EliteCheckoutPage() {
  return (
    <main className="elite-offer elite-checkout-page">
      <div className="elite-checkout-glow" aria-hidden="true" />
      <div className="elite-shell elite-checkout-topbar">
        <Link href="/building" className="elite-back-link">
          <span aria-hidden="true">←</span> Back to JDC Mastermind
        </Link>
        <span className="elite-secure-label">
          <LockIcon /> Secure checkout
        </span>
      </div>

      <section className="elite-checkout-hero">
        <div className="elite-shell">
          <p className="elite-kicker elite-center">COMPLETE YOUR ENROLLMENT</p>
          <h1 className="elite-display">One final step toward a higher standard.</h1>
          <p className="elite-sub elite-center">
            Complete the secure form below and get instant access to JDC Mastermind Season 1.
          </p>

          <div className="elite-checkout-layout">
            <aside className="elite-checkout-summary">
              <div className="elite-glass elite-order-card">
                <p className="elite-kicker">YOUR ORDER</p>
                <div className="elite-order-heading">
                  <div>
                    <strong>JDC Mastermind</strong>
                    <span>Lifetime access</span>
                  </div>
                  <strong>{formatPhp(mastermindOffer.offerPrice)}</strong>
                </div>
                <IncludeList items={mastermindOffer.offerSummary} />
                <div className="elite-order-total">
                  <span>Total value</span>
                  <s>{formatPhp(mastermindOffer.listPrice)}</s>
                </div>
                <div className="elite-order-total is-final">
                  <span>Mastermind starts at</span>
                  <strong>{formatPhp(mastermindOffer.offerPrice)}</strong>
                </div>
                <p className="elite-order-note">Optional private coaching is calculated inside the form.</p>
              </div>

              <div className="elite-glass elite-payment-card">
                <p className="elite-kicker">HOW IT WORKS</p>
                <CheckoutSteps />
              </div>
            </aside>

            <div className="elite-checkout-form-wrap">
              <div className="elite-checkout-form-head">
                <p className="elite-kicker">SECURE ENROLLMENT FORM</p>
                <h2>Enter your details to lock in your seat.</h2>
                <span className="elite-checkout-form-secure">
                  <ShieldIcon /> Encrypted &amp; PCI-compliant checkout
                </span>
              </div>
              <EliteCheckoutEmbed />
            </div>
          </div>

          <p className="elite-checkout-help">
            Need help? Email <a href={`mailto:${mastermindOffer.support.email}`}>{mastermindOffer.support.email}</a> or
            call <a href={`tel:${mastermindOffer.support.tel}`}>{mastermindOffer.support.phone}</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
