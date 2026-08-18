import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for the Coach JDC platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="section-space">
        <div className="container-shell max-w-3xl">
          <p className="eyebrow text-xs">Legal</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em]">Terms & Conditions</h1>
          <p className="mt-5 text-[var(--muted)] leading-8">
            By using coachjdc.org and related Coach JDC programs, you agree to use the site for
            lawful inquiries, respect community guidelines, and understand that coaching results
            vary by individual effort and follow-through.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
