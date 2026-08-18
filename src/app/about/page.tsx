import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { siteContent } from "@/data/site-content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Coach Jayson Dela Cruz works with OFWs, employees, and first-time entrepreneurs who need a real plan — not another pep talk.",
};

export default async function AboutPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="section-space">
        <div className="container-shell grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="card-surface rounded-[2rem] p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-dark)]">
              {siteContent.mentorEyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{siteContent.mentorHeading}</h1>
            <p className="mt-4 text-lg leading-8 text-[var(--muted)]">{siteContent.mentorBody}</p>

            <div className="mt-8 grid gap-4">
              {siteContent.mentorPoints.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.5rem] border border-black/8 bg-white px-5 py-4 text-sm text-[var(--muted)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="card-surface rounded-[2rem] p-8">
            <p className="text-sm font-semibold">{siteContent.frameworkHeading}</p>
            <p className="mt-4 text-[var(--muted)]">{siteContent.frameworkBody}</p>

            <ol className="mt-6 grid gap-3">
              {siteContent.frameworkItems.map((item, index) => (
                <li
                  key={item}
                  className="flex gap-4 rounded-[1.5rem] bg-[#fff5e9] px-5 py-4 text-sm"
                >
                  <span className="font-semibold text-[var(--brand-dark)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
