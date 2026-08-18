import type { Metadata } from "next";

import { InquiryForm } from "@/components/forms/inquiry-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AddressMap } from "@/components/maps/address-map";
import { programs } from "@/data/programs";
import { siteContent } from "@/data/site-content";
import { getGoogleMapsConfig } from "@/lib/maps";

export const metadata: Metadata = {
  title: "Talk to me",
  description:
    "Send Coach Jayson Dela Cruz a message about where you are. He'll review it and talk with you about the next honest step.",
};

type ContactPageProps = {
  searchParams: Promise<{ program?: string }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { program } = await searchParams;
  const selectedProgram = programs.find((item) => item.title === program)?.title;
  const mapsConfig = await getGoogleMapsConfig();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="section-space">
        <div className="container-shell">
          <div className="mb-8 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-dark)]">
              {siteContent.inquiry.eyebrow}
            </p>
            <h1 className="mt-3 text-5xl font-semibold tracking-tight">{siteContent.inquiry.heading}</h1>
            <p className="mt-4 text-lg text-[var(--muted)]">{siteContent.inquiry.body}</p>
          </div>

          <InquiryForm defaultProgram={selectedProgram} showIntro={false} />

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="card-surface rounded-[2rem] p-8">
              <p className="text-sm font-semibold">{siteContent.inquiry.nextHeading}</p>
              <ul className="mt-5 grid gap-3 text-sm text-[var(--muted)]">
                {siteContent.inquiry.nextSteps.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>

            <AddressMap
              address={selectedProgram ? `${selectedProgram}, Philippines` : "Makati City, Metro Manila"}
              embedKey={mapsConfig.embedKey}
            />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
