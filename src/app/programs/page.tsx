import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProgramCard } from "@/components/sections/program-card";
import { programs } from "@/data/programs";

export const metadata: Metadata = {
  title: "Programs",
  description: "Explore the coaching and mentoring programs offered by Coach JDC.",
};

export default async function ProgramsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="section-space">
        <div className="container-shell">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-dark)]">Programs</p>
          <h1 className="mt-3 max-w-3xl text-5xl font-semibold tracking-tight">
            Coaching tracks built for breakthrough, leadership, and business action.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">
            Each program is presented as a conversion-ready page connected to the CRM so inquiries can move directly into admin and partner follow-up.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {programs.map((program) => (
              <ProgramCard key={program.slug} program={program} />
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
