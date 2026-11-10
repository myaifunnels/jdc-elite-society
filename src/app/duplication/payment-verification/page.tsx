import type { Metadata } from "next";

import { mastermindOffer } from "@/data/mastermind-offer";

export const metadata: Metadata = {
  title: {
    absolute: "Payment Verification | JDC Mastermind: Duplication Season",
  },
  robots: { index: false, follow: false },
};

export default function DuplicationPaymentVerificationPage() {
  return (
    <main className="elite-offer elite-thank-you-page">
      <div className="elite-thanks">
        <div className="elite-thanks-check" aria-hidden="true">✓</div>
        <p className="elite-kicker">PAYMENT RECEIVED</p>
        <h1 className="elite-display">We&apos;re verifying your payment.</h1>

        <p className="elite-thanks-lead">
          Salamat. Natanggap ko na ang iyong resibo. I-verify ko ito, makakatanggap ka ng email kapag na-approve
          na ang iyong seat.
        </p>

        <div className="elite-verification-status" aria-label="Payment verification progress">
          <div className="is-complete">
            <span>✓</span>
            <div><strong>Payment submitted</strong><small>Complete</small></div>
          </div>
          <div className="is-current">
            <span>2</span>
            <div><strong>Payment verification</strong><small>In review by our team</small></div>
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
              Confirmation na approved ang iyong enrollment
            </li>
            <li>
              <span className="elite-dot">✓</span>
              Access links para sa JDC Mastermind Sessions (October 2 at October 9)
            </li>
            <li>
              <span className="elite-dot">✓</span>
              Access sa JDC Portal (coachjdc.org)
            </li>
          </ul>
        </div>

        <p>
          No further action is needed from you right now. Please watch your inbox, including the spam and
          promotions folders. If you need help, email {mastermindOffer.support.email} or call{" "}
          {mastermindOffer.support.phone}.
        </p>
        <p>Coach JDC</p>
      </div>
    </main>
  );
}
