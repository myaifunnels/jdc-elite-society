"use client";

import { useRef, useState } from "react";
import Link from "next/link";

import { mastermindOffer } from "@/data/mastermind-offer";

function SoundIcon({ muted }: { muted: boolean }) {
  return muted ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="m16 9 5 6M21 9l-5 6" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12" />
    </svg>
  );
}

export function EliteThankYou() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (video.paused) void video.play();
  }

  return (
    <main className="elite-offer elite-thank-you-page">
      <div className="elite-thanks">
        <div className="elite-thanks-check" aria-hidden="true">✓</div>
        <p className="elite-kicker">YOU&apos;RE IN</p>
        <h1 className="elite-display">Your JDC Mastermind access is unlocked.</h1>

        <div className="elite-thanks-video">
          <video ref={videoRef} autoPlay muted loop playsInline preload="auto">
            <source src={mastermindOffer.thankYouVideo} type="video/mp4" />
          </video>
          <button
            type="button"
            className="elite-thanks-sound"
            onClick={toggleSound}
            aria-label={muted ? "Unmute video" : "Mute video"}
          >
            <SoundIcon muted={muted} />
          </button>
        </div>

        <Link href="/account/password" className="elite-cta elite-cta-lg elite-thanks-dashboard-link">
          <span>
            <strong>ACCESS YOUR DASHBOARD</strong>
            <small>Add your photo and set your password to finish setup</small>
          </span>
          <span aria-hidden="true">→</span>
        </Link>

        <p className="elite-thanks-lead">
          Salamat. Natanggap na namin ang iyong submission — hindi mo na kailangang maghintay, bukas na agad ang
          iyong access. Bini-verify pa rin namin ang resibo sa background, para lang siguradong maayos ang lahat.
        </p>

        <div className="elite-verification-status" aria-label="Payment verification progress">
          <div className="is-complete">
            <span>✓</span>
            <div><strong>Payment submitted</strong><small>Complete</small></div>
          </div>
          <div className="is-complete">
            <span>✓</span>
            <div><strong>Access unlocked</strong><small>Ready now</small></div>
          </div>
          <div className="is-current">
            <span>3</span>
            <div><strong>Receipt verification</strong><small>Running in the background</small></div>
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
              Access links para sa JDC Mastermind Sessions
            </li>
            <li>
              <span className="elite-dot">✓</span>
              Invitation sa JDC Elite Society Portal (community.coachjdc.org)
            </li>
          </ul>
        </div>

        <p>
          Please watch your inbox, including the spam and promotions folders. We&apos;re verifying your receipt in
          the background. If you need help, email {mastermindOffer.support.email} or call{" "}
          {mastermindOffer.support.phone}.
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
