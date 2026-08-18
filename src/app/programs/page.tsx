import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProgramCard } from "@/components/sections/program-card";
import { programs } from "@/data/programs";

export const metadata: Metadata = {
  title: "Programs",
  description: "Mindset, business, leadership, OFW transition, and JDC Mastermind programs from Coach Jayson Dela Cruz.",
};

export default async function ProgramsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="section-space">
        <div className="container-shell">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-dark)]">Programs</p>
          <h1 className="display-title mt-3 max-w-3xl text-5xl md:text-6xl">
            Five tracks. One standard: you do the work.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">
            Pick the season you&apos;re in. I&apos;ll coach you from there. Don&apos;t pick the program that sounds impressive. Pick the one that names your actual problem.
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
