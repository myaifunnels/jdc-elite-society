import type { ReactNode } from "react";
import Script from "next/script";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PartnershipVideo } from "@/components/programs/partnership-video";

export const partnershipVsl =
  "https://assets.cdn.filesafe.space/Col3j2B7jRDX5y8J5bgN/media/696f53429b21f02c0e67e5f4.mp4";
export const partnershipThankYouVsl =
  "https://assets.cdn.filesafe.space/Col3j2B7jRDX5y8J5bgN/media/697182fdeb392b81b66d5f1a.mp4";

const formId = "hEadKGITGhjwVT5DwVcQ";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-7 w-7",
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

/* The signup form is a white embed, so we invert it into dark mode; hue-rotate keeps brand colors true. */
const darkForm = "invert(0.92) hue-rotate(180deg) saturate(1.1)";

const pageBackground =
  "radial-gradient(1100px 500px at 15% -10%, rgba(37,99,235,0.28), transparent 60%), radial-gradient(900px 500px at 100% 10%, rgba(245,158,11,0.08), transparent 60%), #070d1f";

export function PartnershipPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="text-white" style={{ background: pageBackground }}>
        <section className="px-4 pb-10 pt-14 text-center sm:pt-20">
          <span className="inline-flex rounded-full border border-amber-400/40 bg-amber-400/10 px-5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-amber-100">
            Become a JDC Partner
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold uppercase leading-[1.05] tracking-[-0.025em] sm:text-5xl lg:text-7xl">
            JDC <span className="text-blue-400">Partnership</span> Program
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300 sm:text-xl">
            Earn while helping others transform their life &amp; business.
          </p>
        </section>

        <section className="px-4 pb-10">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.35fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-[#111b36] p-3 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] sm:p-4">
              <PartnershipVideo src={partnershipVsl} autoPlay />
            </div>

            <div
              id="apply"
              className="rounded-2xl border border-blue-400/20 bg-gradient-to-b from-[#0f1c3d] to-[#0a1330] p-5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] sm:p-6"
            >
              <h2 className="text-center text-2xl font-bold uppercase tracking-tight">Become a JDC Partner</h2>
              <p className="mt-1 text-center text-sm text-slate-400">Fill out the form below to apply</p>
              <div className="mt-4 overflow-hidden rounded-xl bg-[#0a1330]">
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
              </div>
              <Script src="https://api.myaifunnels.com/js/form_embed.js" strategy="afterInteractive" />
            </div>
          </div>
        </section>

        <section className="px-4 pb-20">
          <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
            {benefits.map((item) => (
              <div key={item.title} className="rounded-xl border border-white/[0.06] bg-[#111b36] p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
                  {item.icon}
                </div>
                <h3 className="mt-4 text-base font-bold uppercase tracking-tight">{item.title}</h3>
                <p className="mt-2 text-slate-400">{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export function PartnershipThankYou() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="px-4 py-16 text-center text-white sm:py-24" style={{ background: pageBackground }}>
        <span className="inline-flex rounded-full border border-amber-400/40 bg-amber-400/10 px-5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-amber-100">
          You&apos;re in
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold uppercase leading-[1.05] tracking-[-0.025em] sm:text-5xl">
          Welcome to the <span className="text-blue-400">JDC Partnership</span> Program
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
          Thanks for signing up. Watch the video below for your next steps.
        </p>
        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-white/10 bg-[#111b36] p-3 sm:p-4">
          <PartnershipVideo src={partnershipThankYouVsl} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
