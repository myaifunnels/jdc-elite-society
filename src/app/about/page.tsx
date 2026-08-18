import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { siteContent } from "@/data/site-content";

export const metadata: Metadata = {
  title: "About",
  description: "Learn more about Coach Jayson Dela Cruz and the Coach JDC platform.",
};

export default async function AboutPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="section-space">
        <div className="container-shell grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="card-surface rounded-[2rem] p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-dark)]">About Coach JDC</p>
            <h1 className="mt-3 text-4xl font-semibold">{siteContent.mentorHeading}</h1>
            <p className="mt-4 text-lg leading-8 text-[var(--muted)]">{siteContent.mentorBody}</p>

            <div className="mt-8 grid gap-4">
              {[
                "Mentoring OFWs, employees, and first-time entrepreneurs",
                "Combining business strategy, mindset work, and life discipline",
                "Building a stronger lead and partner ecosystem through CRM visibility",
              ].map((item) => (
                <div key={item} className="rounded-[1.5rem] border border-black/8 bg-white px-5 py-4 text-sm text-[var(--muted)]">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="card-surface rounded-[2rem] p-8">
            <p className="text-sm font-semibold">Platform promise</p>
            <p className="mt-4 text-[var(--muted)]">
              The rebuilt site is designed to support both storytelling and operations: public pages for trust and conversion, plus internal dashboards for coordinated follow-up.
            </p>

            <div className="mt-6 rounded-[1.5rem] bg-[#fff5e9] p-5">
              <p className="font-semibold">{siteContent.frameworkHeading}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{siteContent.frameworkBody}</p>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
