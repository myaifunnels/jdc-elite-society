import type { Metadata } from "next";
import Link from "next/link";

import { mastermindOffer } from "@/data/mastermind-offer";

export const metadata: Metadata = {
  title: {
    absolute: "Payment Verification | JDC Mastermind",
  },
  robots: { index: false, follow: false },
};

export default function BuildingPaymentVerificationPage() {
  return (
    <main className="elite-offer elite-thank-you-page">
      <div className="elite-thanks">
        <div className="elite-thanks-check" aria-hidden="true">✓</div>
        <p className="elite-kicker">PAYMENT RECEIVED</p>
        <h1 className="elite-display">I&apos;m verifying your payment.</h1>

        <p className="elite-thanks-lead">
          Salamat. Natanggap ko na ang iyong payment submission. Ve-verify ko ito, at makakatanggap ka ng email na
          may link para i-set up ang iyong password kapag na-approve ko na ang iyong seat.
        </p>

        <div className="elite-verification-status" aria-label="Payment verification progress">
          <div className="is-complete">
            <span>✓</span>
            <div><strong>Payment submitted</strong><small>Complete</small></div>
          </div>
          <div className="is-current">
            <span>2</span>
            <div><strong>Payment verification</strong><small>I'm reviewing it now</small></div>
          </div>
          <div>
            <span>3</span>
            <div><strong>Seat confirmed</strong><small>You&apos;ll get an email</small></div>
          </div>
        </div>

        <p className="elite-thanks-expect">Once verified, makakatanggap ka ng email na may:</p>
        <div className="elite-glass elite-thanks-card">
          <ul className="elite-list">
            <li>
              <span className="elite-dot">✓</span>
              Confirmation na approved ang iyong membership
            </li>
            <li>
              <span className="elite-dot">✓</span>
              Access links para sa JDC Mastermind Sessions (Foundation and Execution, recorded, watch anytime)
            </li>
            <li>
              <span className="elite-dot">✓</span>
              Invitation sa JDC Elite Society Portal (community.coachjdc.org)
            </li>
          </ul>
        </div>

        <Link href="/account/password" className="elite-cta elite-cta-lg elite-thanks-dashboard-link">
          <span>
            <strong>SET UP YOUR ACCOUNT</strong>
            <small>Add your photo and set your password while you wait</small>
          </span>
          <span aria-hidden="true">→</span>
        </Link>

        <p>
          Please watch your inbox, including the spam and promotions folders. If you need help, email{" "}
          {mastermindOffer.support.email} or call {mastermindOffer.support.phone}.
        </p>
        <p style={{ marginTop: "1.5rem" }}>
          I-join ang JDC Elite Society community:{" "}
          <a href={mastermindOffer.communityUrl}>{mastermindOffer.communityUrl.replace("https://", "")}</a>
        </p>
        <p>Coach JDC</p>
      </div>
    </main>
  );
}
