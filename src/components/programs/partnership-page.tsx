import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PartnershipApply } from "@/components/programs/partnership-apply";
import { PartnershipVideo } from "@/components/programs/partnership-video";

export const partnershipVsl =
  "https://assets.cdn.filesafe.space/Col3j2B7jRDX5y8J5bgN/media/696f53429b21f02c0e67e5f4.mp4";
export const partnershipThankYouVsl =
  "https://assets.cdn.filesafe.space/Col3j2B7jRDX5y8J5bgN/media/697182fdeb392b81b66d5f1a.mp4";

const heroBackgroundVideo =
  "https://assets.cdn.filesafe.space/Col3j2B7jRDX5y8J5bgN/media/6a8425979f720b54ef08fd2f.mp4";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  width: 24,
  height: 24,
  "aria-hidden": true,
};

const benefits: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: "Commission-based earnings",
    body: "Join the JDC Partnership Program and earn commissions by referring people.",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M14.8 9.2c-.4-.8-1.4-1.2-2.8-1.2-1.6 0-2.6.7-2.6 1.8 0 2.6 5.4 1.2 5.4 3.9 0 1.1-1.1 1.8-2.8 1.8-1.5 0-2.6-.5-3-1.5M12 6.5V8m0 8v1.5" />
      </svg>
    ),
  },
  {
    title: "Real-time tracking",
    body: "A transparent dashboard to monitor clicks, signups, and commissions.",
    icon: (
      <svg {...iconProps}>
        <path d="M4 20V10m6 10V4m6 16v-7m4 7H2" />
      </svg>
    ),
  },
  {
    title: "Long-term partnership",
    body: "Not a one-time promo. A sustainable income stream.",
    icon: (
      <svg {...iconProps}>
        <path d="m11 17 2 2a1.4 1.4 0 0 0 2-2M14 14l2.5 2.5a1.4 1.4 0 0 0 2-2L15 11l-3 1-3-3 4-3 3 1 5 4M3 11l5-5 2 2M2 12l6 6a1.4 1.4 0 0 0 2-2" />
      </svg>
    ),
  },
];

export function PartnershipPage() {
  return (
    <>
      <SiteHeader />
      <div className="elite-offer">
        <section className="partner-hero">
          <video className="partner-hero-video" autoPlay muted loop playsInline preload="auto" aria-hidden="true">
            <source src={heroBackgroundVideo} type="video/mp4" />
          </video>
          <div className="partner-hero-scrim" />
          <div className="elite-shell partner-hero-grid">
            <div className="partner-area-head">
              <p className="elite-kicker" style={{ color: "#8fc8ff", fontSize: "0.95rem" }}>
                The JDC Partnership Program
              </p>
              <h1 className="elite-display partner-headline">
                <span className="partner-line">Earn While You Help Others</span>{" "}
                <em className="partner-line">Transform Their</em>{" "}
                <em className="partner-line">Life &amp; Business.</em>
              </h1>
            </div>
            <div className="elite-glass partner-video partner-area-video">
              <div className="partner-video-inner">
                <PartnershipVideo src={partnershipVsl} autoPlay />
              </div>
            </div>
            <div className="partner-area-body">
              <p className="partner-sub">
                Watch the short video, then apply to become a JDC partner. Refer people, earn commissions, and track it
                all in one place.
              </p>
              <PartnershipApply className="partner-cta-desktop" />
              <div className="partner-chips">
                {benefits.map((item) => (
                  <span key={item.title}>
                    <strong>{item.title}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="elite-shell">
          <div className="partner-benefits">
            {benefits.map((item) => (
              <div key={item.title} className="elite-glass partner-benefit">
                <div className="partner-benefit-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <PartnershipApply className="partner-cta-sticky" />

        <section className="elite-shell partner-final">
          <h2 className="elite-display partner-headline" style={{ fontSize: "clamp(1.8rem, 3.6vw, 2.6rem)" }}>
            Ready to <em>partner with us?</em>
          </h2>
          <PartnershipApply />
        </section>
      </div>
      <SiteFooter />
    </>
  );
}

export function PartnershipThankYou() {
  return (
    <>
      <SiteHeader />
      <div className="elite-offer">
        <section className="partner-hero" style={{ textAlign: "center" }}>
          <div className="elite-shell" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <p className="elite-kicker">You&apos;re in</p>
            <h1 className="elite-display partner-headline">
              Welcome to the <em>JDC Partnership Program.</em>
            </h1>
            <p className="partner-sub">Thanks for signing up. Watch the video below for your next steps.</p>
            <div className="elite-glass partner-video" style={{ width: "min(880px, 100%)", marginBottom: "4rem" }}>
              <div className="partner-video-inner">
                <PartnershipVideo src={partnershipThankYouVsl} />
              </div>
            </div>
          </div>
        </section>
      </div>
      <SiteFooter />
    </>
  );
}
