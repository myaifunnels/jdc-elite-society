import Script from "next/script";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const partnershipVsl =
  "https://assets.cdn.filesafe.space/Col3j2B7jRDX5y8J5bgN/media/696f53429b21f02c0e67e5f4.mp4";
export const partnershipThankYouVsl =
  "https://assets.cdn.filesafe.space/Col3j2B7jRDX5y8J5bgN/media/697182fdeb392b81b66d5f1a.mp4";

const formId = "hEadKGITGhjwVT5DwVcQ";

function Vsl({ src }: { src: string }) {
  return (
    <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-2xl border border-[var(--line)] bg-black shadow-lg">
      <video className="aspect-video w-full" controls playsInline preload="metadata">
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}

export function PartnershipPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="section-space">
          <div className="container-shell text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-dark)]">JDC Partnership Program</p>
            <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Partner with Coach JDC.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--muted)]">
              Watch the video below, then sign up to become a JDC partner.
            </p>
            <Vsl src={partnershipVsl} />
          </div>
        </section>

        <section className="pb-16">
          <div className="container-shell mx-auto max-w-2xl">
            <h2 className="text-center text-2xl font-semibold tracking-tight">Sign up as a partner</h2>
            <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--line)] bg-[color:var(--surface-elevated)] p-2">
              <iframe
                src={`https://api.myaifunnels.com/widget/form/${formId}`}
                style={{ width: "100%", height: "100%", minHeight: 500, border: "none", borderRadius: 3 }}
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
      <main>
        <section className="section-space">
          <div className="container-shell text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-dark)]">JDC Partnership Program</p>
            <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              You&apos;re in. Watch this next.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--muted)]">
              Thanks for signing up. Watch the video below for your next steps.
            </p>
            <Vsl src={partnershipThankYouVsl} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
