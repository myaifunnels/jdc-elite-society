"use client";

import { useRef, useState } from "react";
import Link from "next/link";

import { mastermindOffer } from "@/data/mastermind-offer";

export function EliteThankYou() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  }

  return (
    <main className="elite-offer elite-thank-you-page">
      <div className="elite-thanks">
        <div className="elite-thanks-check" aria-hidden="true">✓</div>
        <p className="elite-kicker">PAYMENT RECEIVED</p>
        <h1 className="elite-display">We&apos;re verifying your payment now.</h1>
        <p className="elite-thanks-lead">
          Salamat. Natanggap na namin ang iyong submission. Our team will review your receipt as soon as possible and
          send your JDC Mastermind access once the payment is confirmed.
        </p>

        <div className="elite-verification-status" aria-label="Payment verification progress">
          <div className="is-complete">
            <span>✓</span>
            <div><strong>Payment submitted</strong><small>Complete</small></div>
          </div>
          <div className="is-current">
            <span>2</span>
            <div><strong>Verification</strong><small>In progress</small></div>
          </div>
          <div>
            <span>3</span>
            <div><strong>Access delivered</strong><small>Sent after approval</small></div>
          </div>
        </div>

        <div className="elite-thanks-video" onClick={toggle}>
          <video
            ref={videoRef}
            controls={playing}
            playsInline
            preload="auto"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          >
            <source src={mastermindOffer.thankYouVideo} type="video/mp4" />
          </video>
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
              Access links para sa JDC Mastermind Sessions
            </li>
            <li>
              <span className="elite-dot">✓</span>
              Invitation sa JDC Elite Society Portal (community.coachjdc.org)
            </li>
          </ul>
        </div>
        <Link href="/dashboard" className="elite-cta elite-cta-lg elite-thanks-dashboard-link">
          <span>
            <strong>Open my JDC dashboard</strong>
            <small>Your account is ready while payment verification is in progress</small>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
        <p>
          Please watch your inbox, including the spam and promotions folders. We aim to verify every payment as soon as
          possible. If you need help, email {mastermindOffer.support.email} or call {mastermindOffer.support.phone}.
        </p>
        <p style={{ marginTop: "1.5rem" }}>
          I-join ang aming community:{" "}
          <a href={mastermindOffer.communityUrl}>{mastermindOffer.communityUrl.replace("https://", "")}</a>
        </p>
        <p className="elite-display elite-thanks-signoff">Your next chapter is already in motion.</p>
        <p>Coach JDC and the JDC Elite Society Team</p>
      </div>
    </main>
  );
}
