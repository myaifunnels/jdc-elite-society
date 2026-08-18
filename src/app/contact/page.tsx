import type { Metadata } from "next";

import { InquiryForm } from "@/components/forms/inquiry-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AddressMap } from "@/components/maps/address-map";
import { programs } from "@/data/programs";

export const metadata: Metadata = {
  title: "Contact",
  description: "Capture inquiries and route them into the Coach JDC CRM workflow.",
};

type ContactPageProps = {
  searchParams: Promise<{ program?: string }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { program } = await searchParams;
  const selectedProgram = programs.find((item) => item.title === program)?.title;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="section-space">
        <div className="container-shell">
          <div className="mb-8 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-dark)]">Inquiry and CRM intake</p>
            <h1 className="mt-3 text-5xl font-semibold tracking-tight">
              Capture every serious inquiry with the right CRM fields from day one.
            </h1>
            <p className="mt-4 text-lg text-[var(--muted)]">
              This intake flow records contact details, program interest, tags, and map-ready address information for admin and partner visibility.
            </p>
          </div>

          <InquiryForm defaultProgram={selectedProgram} />

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="card-surface rounded-[2rem] p-8">
              <p className="text-sm font-semibold">What gets captured</p>
              <ul className="mt-5 grid gap-3 text-sm text-[var(--muted)]">
                {[
                  "Name, email, phone, and date of birth",
                  "Tags for campaign, program, or partner routing",
                  "Address and city for Google Maps-assisted workflows",
                  "Program interest for segmented follow-up",
                ].map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>

            <AddressMap address={selectedProgram ? `${selectedProgram}, Philippines` : "Makati City, Metro Manila"} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
