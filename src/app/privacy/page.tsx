import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for the Coach JDC platform.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="section-space">
        <div className="container-shell max-w-3xl">
          <p className="eyebrow text-xs">Legal</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em]">Privacy Policy</h1>
          <p className="mt-5 text-[var(--muted)] leading-8">
            Inquiry details submitted through this site are used for coaching follow-up, partner
            routing, and service delivery. We do not sell personal data. Contact
            team@mail.coachjdc.org if you need an update or deletion request.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
