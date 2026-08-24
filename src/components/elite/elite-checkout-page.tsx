import Link from "next/link";

import { EliteCheckoutForm, IncludeList, PaymentInstructions } from "@/components/elite/elite-checkout-form";
import { formatPhp, mastermindOffer } from "@/data/mastermind-offer";

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="3" />
      <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
    </svg>
  );
}

export function EliteCheckoutPage() {
  return (
    <main className="elite-offer elite-checkout-page">
      <div className="elite-checkout-glow" aria-hidden="true" />
      <div className="elite-shell elite-checkout-topbar">
        <Link href="/elite" className="elite-back-link">
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
            Send your payment, upload the receipt, and we will verify it as soon as possible.
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
                  <span>Today&apos;s investment</span>
                  <strong>{formatPhp(mastermindOffer.offerPrice)}</strong>
                </div>
                <p className="elite-order-note">One-time payment. No recurring fees.</p>
              </div>

              <div className="elite-glass elite-payment-card">
                <p className="elite-kicker">HOW PAYMENT WORKS</p>
                <PaymentInstructions />
              </div>
            </aside>

            <EliteCheckoutForm />
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
