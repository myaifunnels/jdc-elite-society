"use client";

import { useRef, useState } from "react";

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
    <div className="elite-offer">
      <div className="elite-thanks">
        <h1 className="elite-display" style={{ fontSize: "2.6rem" }}>
          SALAMAT! 🎉
          <br />
          NATANGGAP NA NAMIN ANG IYONG PAYMENT.
        </h1>
        <h2 className="elite-display" style={{ color: "var(--elite-blue-soft)", fontSize: "1.4rem", marginTop: "1rem" }}>
          Ikaw ay opisyal na miyembro ng JDC Mastermind.
        </h2>
        <div style={{ position: "relative", cursor: "pointer" }} onClick={toggle}>
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
        <p>
          Bini-verify namin ang iyong payment ngayon. Sa loob ng 24 oras, makakatanggap ka ng email na may:
        </p>
        <div className="elite-glass" style={{ padding: "1.5rem", textAlign: "left", maxWidth: 600, margin: "1.5rem auto" }}>
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
          I-check ang iyong inbox, kasama na ang spam/promotions folder. Kung wala pa pagkatapos ng 24 oras,
          mag-message sa amin sa {mastermindOffer.support.email} o {mastermindOffer.support.phone}.
        </p>
        <p style={{ marginTop: "1.5rem" }}>
          I-join ang aming community:{" "}
          <a href={mastermindOffer.communityUrl}>{mastermindOffer.communityUrl.replace("https://", "")}</a>
        </p>
        <p className="elite-display" style={{ marginTop: "2rem", fontSize: "1.25rem" }}>
          Welcome to JDC Mastermind.
        </p>
        <p>Coach JDC at ang JDC Elite Society Team</p>
      </div>
    </div>
  );
}
